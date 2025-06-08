import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { instagramApiService } from '@/services/instagramApiService';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query params or auth
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. Get user's Instagram account
    const { data: instagramAccount, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (accountError || !instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 });
    }

    // 2. Get latest report data if available
    const { data: latestReport } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let instagramData;
    
    // 3. Use cached data if recent (less than 24 hours), otherwise fetch fresh
    const isRecentData = latestReport && 
      new Date(latestReport.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000);

    if (isRecentData && latestReport.report_data?.raw_instagram_data) {
      console.log('📱 Using cached Instagram data');
      instagramData = latestReport.report_data.raw_instagram_data;
    } else {
      console.log('📱 Fetching fresh Instagram data');
      instagramData = await instagramApiService.getInstagramDataPackage(
        instagramAccount.access_token,
        instagramAccount.instagram_id
      );
    }

    // 4. Analyze content for viral templates
    const viralTemplateData = analyzeForViralTemplates(instagramData);

    return NextResponse.json({
      success: true,
      profile: {
        id: instagramAccount.instagram_id,
        name: instagramData.profile?.name || instagramAccount.instagram_handle,
        handle: instagramData.profile?.username || instagramAccount.instagram_handle,
        avatar: instagramData.profile?.profile_picture_url || '',
        niche: viralTemplateData.detectedNiche,
        followers: instagramData.profile?.followers_count || 0,
        avg_engagement: instagramData.metrics?.overall_engagement_rate || 0,
        audience: viralTemplateData.audienceType,
        recent_posts: viralTemplateData.analyzedPosts,
        top_performing_posts: viralTemplateData.topPosts,
        posting_patterns: viralTemplateData.postingPatterns,
        content_insights: viralTemplateData.contentInsights
      }
    });

  } catch (error) {
    console.error('💥 Viral templates user data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to analyze Instagram data for viral templates
function analyzeForViralTemplates(instagramData: any) {
  const posts = instagramData.media || [];
  
  // 1. Detect niche from post content
  const detectedNiche = detectNiche(posts);
  
  // 2. Analyze posting patterns
  const postingPatterns = analyzePostingPatterns(posts);
  
  // 3. Get top performing posts
  const topPosts = posts
    .filter((post: any) => post.like_count && post.comments_count)
    .sort((a: any, b: any) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
    .slice(0, 10)
    .map((post: any) => ({
      id: post.id,
      caption: post.caption || '',
      likes: post.like_count || 0,
      comments: post.comments_count || 0,
      engagement_rate: calculatePostEngagement(post),
      media_type: post.media_type,
      timestamp: post.timestamp,
      permalink: post.permalink
    }));

  // 4. Analyze content types and themes
  const contentInsights = analyzeContentTypes(posts);
  
  // 5. Determine audience type
  const audienceType = determineAudienceType(instagramData.profile, posts);

  // 6. Process posts for template analysis
  const analyzedPosts = posts.slice(0, 20).map((post: any) => ({
    id: post.id,
    caption: post.caption || '',
    likes: post.like_count || 0,
    comments: post.comments_count || 0,
    shares: 0, // Instagram API doesn't provide shares
    created_time: post.timestamp,
    media_type: post.media_type,
    engagement_rate: calculatePostEngagement(post)
  }));

  return {
    detectedNiche,
    postingPatterns,
    topPosts,
    contentInsights,
    audienceType,
    analyzedPosts
  };
}

function detectNiche(posts: any[]): string {
  const allText = posts
    .map(post => (post.caption || '').toLowerCase())
    .join(' ');

  const niches = {
    fitness: ['workout', 'gym', 'fitness', 'training', 'muscle', 'cardio', 'exercise', 'health'],
    business: ['entrepreneur', 'startup', 'business', 'success', 'growth', 'money', 'sales'],
    lifestyle: ['life', 'daily', 'morning', 'routine', 'lifestyle', 'mood', 'vibes'],
    food: ['food', 'recipe', 'cooking', 'meal', 'delicious', 'taste', 'chef'],
    travel: ['travel', 'adventure', 'explore', 'trip', 'vacation', 'journey'],
    tech: ['tech', 'code', 'programming', 'development', 'software', 'app'],
    fashion: ['fashion', 'style', 'outfit', 'wear', 'clothes', 'trend'],
    beauty: ['beauty', 'makeup', 'skincare', 'cosmetics', 'glow']
  };

  let maxScore = 0;
  let detectedNiche = 'general';

  Object.entries(niches).forEach(([niche, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = allText.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);

    if (score > maxScore) {
      maxScore = score;
      detectedNiche = niche;
    }
  });

  return detectedNiche;
}

function analyzePostingPatterns(posts: any[]) {
  const postTimes = posts
    .filter(post => post.timestamp)
    .map(post => new Date(post.timestamp));

  if (postTimes.length < 2) {
    return { frequency: 'irregular', bestHours: [], bestDays: [] };
  }

  // Calculate posting frequency
  const intervals = [];
  for (let i = 1; i < postTimes.length; i++) {
    const interval = postTimes[i-1].getTime() - postTimes[i].getTime();
    intervals.push(interval / (1000 * 60 * 60 * 24)); // days
  }
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  let frequency = 'irregular';
  if (avgInterval <= 1) frequency = 'daily';
  else if (avgInterval <= 3) frequency = 'every_few_days';
  else if (avgInterval <= 7) frequency = 'weekly';

  // Best posting hours
  const hourCounts: { [key: number]: number } = {};
  postTimes.forEach(time => {
    const hour = time.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const bestHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Best posting days
  const dayCounts: { [key: number]: number } = {};
  postTimes.forEach(time => {
    const day = time.getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });

  const bestDays = Object.entries(dayCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([day]) => parseInt(day));

  return { frequency, bestHours, bestDays };
}

function analyzeContentTypes(posts: any[]) {
  const types = {
    carousel: 0,
    video: 0,
    image: 0,
    reel: 0
  };

  posts.forEach(post => {
    switch (post.media_type) {
      case 'CAROUSEL_ALBUM':
        types.carousel++;
        break;
      case 'VIDEO':
        if (post.caption?.includes('#reel') || post.caption?.includes('#reels')) {
          types.reel++;
        } else {
          types.video++;
        }
        break;
      case 'IMAGE':
        types.image++;
        break;
    }
  });

  return types;
}

function determineAudienceType(profile: any, posts: any[]): string {
  const followerCount = profile?.followers_count || 0;
  
  if (followerCount < 1000) return 'micro';
  if (followerCount < 10000) return 'small';
  if (followerCount < 100000) return 'medium';
  return 'large';
}

function calculatePostEngagement(post: any): number {
  const likes = post.like_count || 0;
  const comments = post.comments_count || 0;
  const total = likes + comments;
  
  // This is a simplified calculation - you might want to factor in follower count
  return total > 0 ? Math.round((total / Math.max(likes + comments, 100)) * 100) / 100 : 0;
}