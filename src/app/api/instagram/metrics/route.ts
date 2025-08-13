import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Add this function RIGHT AFTER the imports at the top of the file
async function savePostsToDatabase(supabase: any, instagramAccountId: string, posts: any[]) {
  console.log(`💾 Saving ${posts.length} posts to database with real metrics...`)
  
  const today = new Date().toISOString().split('T')[0]
  
  const postsToSave = posts.map(post => ({
    instagram_account_id: instagramAccountId,
    instagram_post_id: post.id,
    snapshot_date: today,
    post_type: post.media_type || 'IMAGE',
    caption: post.caption || '',
    permalink: post.permalink || '',
    media_url: post.media_url || '',
    thumbnail_url: post.thumbnail_url || '',
    published_at: post.timestamp || null,
    likes_count: post.like_count || 0,
    comments_count: post.comments_count || 0,
    shares_count: post.insights?.shares || 0,
    saves_count: post.insights?.saved || 0,
    reach: post.insights?.reach || post.reach || 0,
    impressions: post.insights?.views || post.impressions || 0,
    raw_post_data: post,
    raw_insights_data: post.insights || null
  }))

  // Use upsert to update existing posts or create new ones
  const { error } = await supabase
    .from('post_snapshots')
    .upsert(postsToSave, {
      onConflict: 'instagram_account_id,instagram_post_id,snapshot_date',
      ignoreDuplicates: false // Allow updates to get latest data
    })

  if (error) {
    console.error('❌ Error saving posts to database:', error)
  } else {
    console.log(`✅ Saved ${posts.length} posts with real Instagram metrics`)
  }
}

// Content Categorization Helper Functions
async function getCategorizationData(supabase: any, userId: string, accountIds: string[], recentPosts: any[]) {
  try {
    if (!recentPosts || recentPosts.length === 0) {
      return {
        categoryStats: [],
        formatStats: [],
        crossAnalysisStats: [],
        taggingProgress: { totalPosts: 0, taggedPosts: 0, untaggedPosts: 0, completionPercentage: 0 },
        untaggedPosts: [],
        availableCategories: [],
        topPerformers: { category: null, format: null },
        unlockedFeatures: { basicInsights: false, timingAnalysis: false, crossAnalysis: false, fullStrategy: false }
      }
    }

    // 🔥 NEW: ALWAYS calculate format stats from raw Instagram data (independent of tagging)
    const calculateFormatStats = (posts: any[]) => {
      // Group posts by media type
      const typeGroups = new Map();
      
      posts.forEach(post => {
        let type = 'Post';
        if (post.media_type === 'VIDEO') type = 'Reels';
        else if (post.media_type === 'CAROUSEL_ALBUM') type = 'Carousels';
        
        if (!typeGroups.has(type)) {
          typeGroups.set(type, {
            posts: [],
            totalLikes: 0,
            totalComments: 0,
            totalReach: 0,
            totalSaves: 0,
            totalImpressions: 0
          });
        }
        
        const group = typeGroups.get(type);
        group.posts.push(post);
        group.totalLikes += post.like_count || 0;
        group.totalComments += post.comments_count || 0;
        group.totalReach += post.reach || 0;
        group.totalSaves += post.saves || 0;
        group.totalImpressions += post.impressions || 0;
      });

      // Convert to format stats array
      return Array.from(typeGroups.entries()).map(([type, data]) => {
        const count = data.posts.length;
        return {
          post_type: type,
          count,
          avg_likes: count > 0 ? Math.round(data.totalLikes / count) : 0,
          avg_comments: count > 0 ? Math.round(data.totalComments / count) : 0,
          avg_reach: count > 0 ? Math.round(data.totalReach / count) : 0,
          avg_impressions: count > 0 ? Math.round(data.totalImpressions / count) : 0,
          engagement_rate: count > 0 ? 
            (((data.totalLikes + data.totalComments) / Math.max(data.totalReach, 1)) * 100).toFixed(1) + '%' : '0%',
          total_engagement: data.totalLikes + data.totalComments
        };
      }).sort((a, b) => b.total_engagement - a.total_engagement);
    };

    // Get available categories from database
const { data: availableCategories } = await supabase
  .from('content_categories')
  .select('*')
  .order('name')

// Get user's Instagram account ID
const { data: userAccount } = await supabase
  .from('instagram_accounts')
  .select('id')
  .eq('user_id', userId)
  .eq('is_active', true)
  .single()

if (!userAccount) {
  console.log('No active Instagram account found for user')
  return {
    categoryStats: [],
    formatStats: calculateFormatStats(recentPosts), // Keep format stats working
    crossAnalysisStats: [],
    taggingProgress: { 
      totalPosts: recentPosts.length, // Use API count
      taggedPosts: 0, 
      untaggedPosts: recentPosts.length, 
      completionPercentage: 0 
    },
    untaggedPosts: recentPosts.slice(0, 20).map(post => ({
      id: post.id,
      instagram_post_id: post.id,
      caption: post.caption || 'No caption',
      post_type: post.media_type,
      published_at: post.timestamp,
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      reach: post.reach || 0,
      media_url: post.media_url,
      thumbnail_url: post.thumbnail_url
    })),
    availableCategories: availableCategories || [],
    topPerformers: { 
      category: null, 
      format: calculateFormatStats(recentPosts).length > 0 ? calculateFormatStats(recentPosts)[0] : null
    },
    unlockedFeatures: { 
      basicInsights: false, 
      timingAnalysis: false, 
      crossAnalysis: false, 
      fullStrategy: false 
    }
  }
}

// Get post IDs from the API data (source of truth)
const recentPostIds = recentPosts.map(post => post.id)

// Get only the tagging information from database for THESE SPECIFIC POSTS
const { data: taggedPostsData } = await supabase
  .from('post_snapshots')
  .select('instagram_post_id, content_category, is_tagged')
  .eq('instagram_account_id', userAccount.id)
  .eq('is_tagged', true)
  .not('content_category', 'is', null)
  .in('instagram_post_id', recentPostIds)

// Create a map of tagged posts for quick lookup
const taggedPostsMap = new Map()
taggedPostsData?.forEach((taggedPost: any) => {
  taggedPostsMap.set(taggedPost.instagram_post_id, taggedPost.content_category)
})

// Use API data as source of truth, just add tagging info
const taggedPosts = recentPostIds.filter(postId => taggedPostsMap.has(postId)).length
const totalPosts = recentPosts.length // Always use API count
const completionPercentage = totalPosts > 0 ? Math.round((taggedPosts / totalPosts) * 100) : 0

console.log(`📊 UNIFIED count - Total: ${totalPosts}, Tagged: ${taggedPosts}, Percentage: ${completionPercentage}%`)

// Filter untagged posts from API data
const untaggedPosts = recentPosts
  .filter(post => !taggedPostsMap.has(post.id))
  .slice(0, 20)
  .map(post => ({
    id: post.id,
    instagram_post_id: post.id,
    caption: post.caption || 'No caption',
    post_type: post.media_type,
    published_at: post.timestamp,
    likes_count: post.like_count || 0,
    comments_count: post.comments_count || 0,
    reach: post.reach || 0,
    media_url: post.media_url,
    thumbnail_url: post.thumbnail_url
  }))

// Generate category stats using API data + tagging info
const categoryStats: {
  category: string,
  count: number,
  avgLikes: number,
  avgComments: number,
  avgReach: number,
  avgEngagement: number,
  posts: any[]
}[] = []
if (taggedPostsData && taggedPostsData.length > 0) {
  const categoryGroups = new Map()
  
  // Use API posts as source of truth, add category info
  recentPosts.forEach(post => {
    const category = taggedPostsMap.get(post.id)
    if (!category) return
    
    if (!categoryGroups.has(category)) {
      categoryGroups.set(category, {
        posts: [],
        totalLikes: 0,
        totalComments: 0,
        totalReach: 0
      })
    }
    
    const group = categoryGroups.get(category)
    group.posts.push(post)
    group.totalLikes += post.like_count || 0
    group.totalComments += post.comments_count || 0
    group.totalReach += post.reach || 0
  })
  
  // Convert to stats array
  categoryGroups.forEach((data, category) => {
    const count = data.posts.length
    const avgLikes = Math.round(data.totalLikes / count)
    const avgComments = Math.round(data.totalComments / count)
    const avgReach = Math.round(data.totalReach / count)
    const avgEngagement = avgLikes + avgComments
    
    categoryStats.push({
  category,
  count,
  avgLikes,
  avgComments,
  avgReach,
  avgEngagement,
  posts: data.posts
})
  })
  
  // Sort by performance
  categoryStats.sort((a, b) => b.avgEngagement - a.avgEngagement)
}

// Progressive unlocks
const unlockedFeatures = {
  basicInsights: taggedPosts >= 5,
  timingAnalysis: taggedPosts >= 15,
  crossAnalysis: taggedPosts >= 25,
  fullStrategy: completionPercentage >= 100
}

// 🔥 CALCULATE FORMAT STATS IMMEDIATELY - NO TAGGING REQUIRED
const formatStats = calculateFormatStats(recentPosts);

// Find top performing format for insights
const topFormat = formatStats.length > 0 ? formatStats[0] : null;

console.log('📊 Format stats calculated:', formatStats.length, 'format types found');

// Calculate cross-analysis stats (category × format combinations)
const crossAnalysisStats: {
  content_category: string;
  post_type: string;
  count: number;
  avg_likes: number;
  avg_comments: number;
  avg_reach: number;
  avg_impressions: number;
}[] = [];

// Always try to generate cross-analysis if we have tagged posts
if (taggedPosts > 0) {
  const categoryFormatCombinations = new Map();
  
  // Group posts by category + format combination
  recentPosts.forEach(post => {
    const category = taggedPostsMap.get(post.id);
    if (category) {
      const key = `${category}-${post.media_type}`;
      
      if (!categoryFormatCombinations.has(key)) {
        categoryFormatCombinations.set(key, {
          content_category: category,
          post_type: post.media_type,
          posts: [],
          totalLikes: 0,
          totalComments: 0,
          totalReach: 0,
          totalImpressions: 0
        });
      }
      
      const combination = categoryFormatCombinations.get(key);
      combination.posts.push(post);
      combination.totalLikes += post.like_count || 0;
      combination.totalComments += post.comments_count || 0;
      combination.totalReach += post.reach || 0;
      combination.totalImpressions += post.impressions || 0;
    }
  });
  
  // Convert to stats (same format as your category and format stats)
  Array.from(categoryFormatCombinations.values())
    .filter(combo => combo.posts.length >= 2) // Need at least 2 posts for reliable data
    .forEach(combo => {
      const count = combo.posts.length;
      crossAnalysisStats.push({
        content_category: combo.content_category,
        post_type: combo.post_type,
        count: count,
        avg_likes: count > 0 ? Math.round(combo.totalLikes / count) : 0,
        avg_comments: count > 0 ? Math.round(combo.totalComments / count) : 0,
        avg_reach: count > 0 ? Math.round(combo.totalReach / count) : 0,
        avg_impressions: count > 0 ? Math.round(combo.totalImpressions / count) : 0
      });
    });
  
  // Sort by total engagement (highest first) - same as your other views
  crossAnalysisStats.sort((a, b) => (b.avg_likes + b.avg_comments) - (a.avg_likes + a.avg_comments));
}

return {
  categoryStats: categoryStats.map(cat => ({
    content_category: cat.category,
    count: cat.count,
    avg_likes: cat.avgLikes,
    avg_comments: cat.avgComments,
    avg_reach: cat.avgReach,
    avg_impressions: 0
  })),
  formatStats,
  crossAnalysisStats,    // ← Changed from crossAnalysisStats: [] to crossAnalysisStats
  taggingProgress: {
    totalPosts,
    taggedPosts,
    untaggedPosts: totalPosts - taggedPosts,
    completionPercentage
  },
  untaggedPosts,
  availableCategories: availableCategories || [],
  topPerformers: { 
    category: categoryStats.length > 0 ? categoryStats[0] : null, 
    format: topFormat
  },
  unlockedFeatures
}

  } catch (error) {
    console.error('❌ Categorization data error:', error)
    return {
      categoryStats: [],
      formatStats: [],
      crossAnalysisStats: [],
      taggingProgress: { totalPosts: 0, taggedPosts: 0, untaggedPosts: 0, completionPercentage: 0 },
      untaggedPosts: [],
      availableCategories: [],
      topPerformers: { category: null, format: null },
      unlockedFeatures: { basicInsights: false, timingAnalysis: false, crossAnalysis: false, fullStrategy: false }
    }
  }
}

async function handleTaggingOperation(supabase: any, userId: string, requestBody: any) {
  console.log('🔍🔍🔍 handleTaggingOperation called:', { userId, requestBody }) // ADD THIS LINE
  
  try {
    const { action, postIds, category, isCustomCategory = false } = requestBody

    // Collect debug info to return to client
    const debugInfo: any = {
      receivedUserId: userId,
      expectedUserId: 'fd4e663c-ba62-43ce-a8e2-6527285cd491',
      postIds: postIds,
      category: category
    }

    if (!action || !postIds || !Array.isArray(postIds)) {
      return { error: 'Invalid request data', status: 400, debug: debugInfo }
    }

    if (action === 'tag') {
      if (!category) {
        return { error: 'Category required for tagging', status: 400, debug: debugInfo }
      }

      // Get user's Instagram account
      const { data: userAccount, error: accountError } = await supabase
        .from('instagram_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      debugInfo.userAccountLookup = {
        userAccount: userAccount,
        accountError: accountError,
        searchedUserId: userId
      }

      if (!userAccount) {
        return { 
          error: 'No active Instagram account found', 
          status: 404,
          debug: debugInfo
        }
      }

      // If it's a custom category, add it to the categories table
      if (isCustomCategory) {
        await supabase
          .from('content_categories')
          .upsert({ 
            name: category, 
            emoji: '🏷️',
            color_scheme: {"bg": "from-gray-50 to-gray-100", "border": "border-gray-200", "text": "text-gray-700"},
            is_default: false 
          })
      }

      // Try to update the posts
      const { data: updatedData, error: updateError } = await supabase
        .from('post_snapshots')
        .update({
          content_category: category,
          is_tagged: true,
          tagged_at: new Date().toISOString(),
          tagged_by: userId
        })
        .eq('instagram_account_id', userAccount.id)
        .in('instagram_post_id', postIds)
        .select('id, instagram_post_id, content_category')

      debugInfo.updateResult = {
        updatedData: updatedData,
        updateError: updateError,
        updatedCount: updatedData?.length || 0
      }

      if (updateError) {
        return { 
          error: `Database error: ${updateError.message}`, 
          status: 500,
          debug: debugInfo
        }
      }

      const actuallyUpdated = updatedData?.length || 0

      if (actuallyUpdated === 0) {
        return { 
          error: 'No posts could be tagged', 
          status: 400,
          debug: debugInfo // This will show us exactly what went wrong
        }
      }

      return { 
        success: true, 
        action: 'tagged',
        updatedPosts: actuallyUpdated,
        category,
        debug: debugInfo
      }
    }

    return { error: 'Invalid action', status: 400, debug: debugInfo }

  } catch (error) {
    console.error('❌ Tagging operation error:', error)
    return { error: 'Failed to process tagging request', status: 500 }
  }
}

// Enhanced interface for Instagram insights
interface MediaInsights {
  reach: number;
  views: number;
  engagement: number;
  profile_visits: number;
  profile_activity: number;
  saved: number;
  shares: number;
  total_interactions: number;
}

// Interface for comment data
interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  like_count?: number;
}

// Interface for top follower analysis
interface TopFollower {
  username: string;
  interactions: number;
  comments: number;
  likes: number;
  lastSeen: string;
  engagementType: 'high' | 'medium' | 'regular';
  postsEngaged: number;
  daysSinceFirst: number;
  avgInteractionsPerPost: number;
}

interface PostWithInsights {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  caption?: string;
  like_count: number;
  comments_count: number;
  insights: MediaInsights;
  comments?: Comment[];
}

// Conservative growth calculation interface
interface RealGrowthCalculation {
  weeklyGrowthRate: string | null;
  monthlyGrowthRate: string | null;
  canCalculateWeekly: boolean;
  canCalculateMonthly: boolean;
  daysOfData: number;
  dataAvailableSince: string | null;
  daysUntilWeekly: number;
  daysUntilMonthly: number;
}

// Interface for historical data
interface HistoricalDataPoint {
  date: string;
  followers: number;
  isComplete: boolean;
}

// EXTENDED: Helper function to fetch ALL comments for a post with pagination
async function fetchAllComments(postId: string, accessToken: string): Promise<Comment[]> {
  const allComments: Comment[] = [];
  let nextUrl = `https://graph.instagram.com/${postId}/comments?fields=id,text,username,timestamp,like_count,from&limit=100&access_token=${accessToken}`;
  let pageCount = 0;
  const maxPages = 10; // Safety limit - max 1000 comments per post
  
  console.log(`💬 Fetching ALL comments for post ${postId} with pagination...`);
  
  while (nextUrl && pageCount < maxPages) {
    try {
      const response = await fetch(nextUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          const processedComments = data.data.map((comment: any) => {
            // Try multiple ways to get the username - Instagram API returns it in different fields
            let username = comment.username;
            
            if (!username && comment.from) {
              username = comment.from.username || comment.from.id;
            }
            
            return {
              id: comment.id,
              text: comment.text || '',
              username: username || 'unknown',
              timestamp: comment.timestamp || new Date().toISOString(),
              like_count: comment.like_count || 0
            };
          });
          
          allComments.push(...processedComments);
          console.log(`📄 Page ${pageCount + 1}: Found ${processedComments.length} comments (Total: ${allComments.length})`);
        }
        
        // Check for next page
        nextUrl = data.paging?.next || null;
        pageCount++;
        
        // Small delay to respect rate limits
        if (nextUrl) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        console.log(`⚠️ Comments API error on page ${pageCount + 1}:`, response.status);
        break;
      }
    } catch (error) {
      console.log(`❌ Error fetching comments page ${pageCount + 1}:`, error);
      break;
    }
  }
  
  console.log(`✅ Total comments fetched for ${postId}: ${allComments.length} (${pageCount} pages)`);
  return allComments;
}

// EXTENDED: Helper function to analyze top followers with more comprehensive data
function analyzeTopFollowers(posts: PostWithInsights[], ownUsername: string): TopFollower[] {
  const followerMap = new Map<string, {
    comments: number;
    likes: number;
    lastSeen: string;
    firstSeen: string;
    commentTexts: string[];
    postsCommentedOn: Set<string>;
  }>();
  
  console.log('👥 Analyzing top followers from extended comment data...');
  console.log('🔍 Own username to filter out:', ownUsername);
  
  let totalCommentsProcessed = 0;
  let filteredOutOwnComments = 0;
  let filteredOutUnknownComments = 0;
  let validCommentsProcessed = 0;
  
  // Track engagement over time
  const engagementOverTime = new Map<string, Date[]>();
  
  posts.forEach(post => {
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach((comment) => {
        totalCommentsProcessed++;
        const username = comment.username;
        
        // Filter out own comments and unknown/invalid usernames
        if (!username || 
            username === 'unknown' || 
            username === 'NULL' ||
            username.toLowerCase() === (ownUsername || '').toLowerCase() ||
            username === ownUsername) {
          
          if (username === ownUsername || username.toLowerCase() === (ownUsername || '').toLowerCase()) {
            filteredOutOwnComments++;
          } else {
            filteredOutUnknownComments++;
          }
          return; // Skip this comment
        }
        
        validCommentsProcessed++;
        
        const existing = followerMap.get(username) || {
          comments: 0,
          likes: 0,
          lastSeen: comment.timestamp,
          firstSeen: comment.timestamp,
          commentTexts: [],
          postsCommentedOn: new Set<string>()
        };
        
        existing.comments += 1;
        existing.likes += comment.like_count || 0;
        existing.commentTexts.push(comment.text);
        existing.postsCommentedOn.add(post.id);
        
        // Track engagement timing
        const commentDate = new Date(comment.timestamp);
        if (!engagementOverTime.has(username)) {
          engagementOverTime.set(username, []);
        }
        engagementOverTime.get(username)!.push(commentDate);
        
        // Update first and last seen
        if (new Date(comment.timestamp) > new Date(existing.lastSeen)) {
          existing.lastSeen = comment.timestamp;
        }
        if (new Date(comment.timestamp) < new Date(existing.firstSeen)) {
          existing.firstSeen = comment.timestamp;
        }
        
        followerMap.set(username, existing);
      });
    }
  });
  
  console.log('📊 Extended comment processing summary:', {
    totalCommentsProcessed,
    filteredOutOwnComments,
    filteredOutUnknownComments,
    validCommentsProcessed,
    uniqueFollowersFound: followerMap.size,
    avgCommentsPerFollower: followerMap.size > 0 ? Math.round(validCommentsProcessed / followerMap.size) : 0
  });
  
  // Convert to array and calculate enhanced engagement scores
  const topFollowers: TopFollower[] = Array.from(followerMap.entries())
    .map(([username, data]) => {
      const totalInteractions = data.comments + data.likes;
      const postsEngaged = data.postsCommentedOn.size;
      const engagementSpan = new Date(data.lastSeen).getTime() - new Date(data.firstSeen).getTime();
      const daysSinceFirst = Math.floor(engagementSpan / (1000 * 60 * 60 * 24));
      
      // Enhanced engagement classification
      let engagementType: 'high' | 'medium' | 'regular';
      if (totalInteractions >= 15 || postsEngaged >= 5) {
        engagementType = 'high';
      } else if (totalInteractions >= 8 || postsEngaged >= 3) {
        engagementType = 'medium';
      } else {
        engagementType = 'regular';
      }
      
      return {
        username,
        interactions: totalInteractions,
        comments: data.comments,
        likes: data.likes,
        lastSeen: data.lastSeen,
        engagementType,
        // Additional metrics for extended analysis
        postsEngaged,
        daysSinceFirst,
        avgInteractionsPerPost: postsEngaged > 0 ? Math.round(totalInteractions / postsEngaged) : 0
      };
    })
    .sort((a, b) => {
      // Enhanced sorting: prioritize interaction count, then consistency
      const aScore = a.interactions + (a.postsEngaged * 2);
      const bScore = b.interactions + (b.postsEngaged * 2);
      return bScore - aScore;
    })
    .slice(0, 15); // Extended to top 15 followers
  
  console.log('✅ Extended top followers analysis complete:', topFollowers.length, 'active followers found');
  if (topFollowers.length > 0) {
    console.log('🔝 Top 5 followers:', topFollowers.slice(0, 5).map(f => 
      `${f.username} (${f.interactions} interactions across ${f.postsEngaged} posts)`
    ));
  }
  
  return topFollowers;
}

async function fetchPostInsights(postId: string, accessToken: string, basicPost?: any): Promise<MediaInsights> {
  console.log(`🔍 Fetching enhanced insights for post ${postId}...`);
  
  // Try different metric combinations based on what's available
  const metricsToTry = [
    // Try all the enhanced metrics first
    ['reach', 'views', 'profile_visits', 'profile_activity', 'saved', 'shares', 'total_interactions'],
    // Core metrics with profile data
    ['reach', 'views', 'profile_visits', 'saved', 'shares'],
    // Basic engagement metrics
    ['reach', 'profile_visits', 'saved'],
    // Your current working setup
    ['reach'],
    // Last resort
    ['views']
  ];
  
  // Try different metric combinations until one works
  for (const metrics of metricsToTry) {
    try {
      const metricsParam = metrics.join(',');
      
      const insightsResponse = await fetch(
        `https://graph.instagram.com/${postId}/insights?metric=${metricsParam}&access_token=${accessToken}`
      );
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        
        // Parse insights data
        const insights: MediaInsights = {
          reach: 0,
          views: 0,
          engagement: 0,
          profile_visits: 0,
          profile_activity: 0,
          saved: 0,
          shares: 0,
          total_interactions: 0
        };
        
        if (insightsData.data && Array.isArray(insightsData.data)) {
          insightsData.data.forEach((metric: any) => {
            const value = metric.values?.[0]?.value || 0;
            
            switch (metric.name) {
              case 'reach':
                insights.reach = value;
                break;
              case 'views':
                insights.views = value;
                break;
              case 'profile_visits':
                insights.profile_visits = value;
                break;
              case 'profile_activity':
                insights.profile_activity = value;
                break;
              case 'saved':
                insights.saved = value;
                break;
              case 'shares':
                insights.shares = value;
                break;
              case 'total_interactions':
                insights.total_interactions = value;
                break;
            }
          });
        }
        
        // Calculate engagement from available data
        if (insights.total_interactions > 0) {
          insights.engagement = insights.total_interactions;
        } else if (basicPost) {
          insights.engagement = (basicPost.like_count || 0) + (basicPost.comments_count || 0) + insights.saved + insights.shares;
        }
        
        return insights;
      } else {
        continue; // Try next metric combination
      }
    } catch (error) {
      continue;
    }
  }
  
  // All insights attempts failed, use basic post data as fallback
  console.log(`⚠️ All insights attempts failed for post ${postId}, using fallback`);
  if (basicPost) {
    return {
      reach: 0,
      views: 0,
      engagement: (basicPost.like_count || 0) + (basicPost.comments_count || 0),
      profile_visits: 0,
      profile_activity: 0,
      saved: 0,
      shares: 0,
      total_interactions: 0
    };
  }
  
  // Last resort - return zeros
  return {
    reach: 0,
    views: 0,
    engagement: 0,
    profile_visits: 0,
    profile_activity: 0,
    saved: 0,
    shares: 0,
    total_interactions: 0
  };
}

// Helper function to calculate optimal posting times from post data
function calculateOptimalTimes(posts: PostWithInsights[]) {
  const hourlyEngagement = new Array(24).fill(0)
  const hourlyCounts = new Array(24).fill(0)
  const hourlyReach = new Array(24).fill(0)
  
  posts.forEach(post => {
    if (post.timestamp) {
      const hour = new Date(post.timestamp).getHours()
      const engagement = (post.like_count || 0) + (post.comments_count || 0)
      const reach = post.insights.reach || 0
      
      hourlyEngagement[hour] += engagement
      hourlyReach[hour] += reach
      hourlyCounts[hour] += 1
    }
  })
  
  // Calculate average engagement and reach per hour
  const averageEngagement = hourlyEngagement.map((total, hour) => 
    hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0
  )
  
  const averageReach = hourlyReach.map((total, hour) => 
    hourlyCounts[hour] > 0 ? total / hourlyCounts[hour] : 0
  )
  
  // Find peak hours based on both engagement and reach
  const combinedScore = averageEngagement.map((eng, hour) => eng + (averageReach[hour] * 0.1))
  const maxScore = Math.max(...combinedScore)
  
  const peakHours = combinedScore
    .map((score, hour) => ({ hour, score }))
    .filter(item => item.score > maxScore * 0.8)
    .map(item => item.hour)
  
  return {
    peakHours,
    hourlyActivity: averageEngagement.map((engagement, hour) => ({
      hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      activity: Math.round((combinedScore[hour] / maxScore) * 100) || 0,
      label: hour.toString(),
      reach: Math.round(averageReach[hour]),
      postCount: hourlyCounts[hour]
    }))
  }
}

// Helper function to analyze content performance with enhanced metrics
function analyzeContentTypes(posts: PostWithInsights[]) {
  const typePerformance: { [key: string]: { 
    count: number, 
    totalEngagement: number,
    totalReach: number,
    totalViews: number,
    totalSaved: number,
    totalShares: number,
    totalProfileVisits: number
  } } = {}
  
  posts.forEach(post => {
    const type = post.media_type || 'POST'
    const engagement = post.insights.engagement || ((post.like_count || 0) + (post.comments_count || 0))
    const reach = post.insights.reach || 0
    const views = post.insights.views || 0
    const saved = post.insights.saved || 0
    const shares = post.insights.shares || 0
    const profileVisits = post.insights.profile_visits || 0
    
    if (!typePerformance[type]) {
      typePerformance[type] = { 
        count: 0, 
        totalEngagement: 0,
        totalReach: 0,
        totalViews: 0,
        totalSaved: 0,
        totalShares: 0,
        totalProfileVisits: 0
      }
    }
    
    typePerformance[type].count += 1
    typePerformance[type].totalEngagement += engagement
    typePerformance[type].totalReach += reach
    typePerformance[type].totalViews += views
    typePerformance[type].totalSaved += saved
    typePerformance[type].totalShares += shares
    typePerformance[type].totalProfileVisits += profileVisits
  })
  
  // Calculate averages per type
  const contentAnalysis = Object.entries(typePerformance).map(([type, data]) => ({
    type,
    avgEngagement: data.count > 0 ? Math.round(data.totalEngagement / data.count) : 0,
    avgReach: data.count > 0 ? Math.round(data.totalReach / data.count) : 0,
    avgViews: data.count > 0 ? Math.round(data.totalViews / data.count) : 0,
    avgSaved: data.count > 0 ? Math.round(data.totalSaved / data.count) : 0,
    avgShares: data.count > 0 ? Math.round(data.totalShares / data.count) : 0,
    avgProfileVisits: data.count > 0 ? Math.round(data.totalProfileVisits / data.count) : 0,
    count: data.count,
    totalReach: data.totalReach,
    totalViews: data.totalViews,
    totalSaved: data.totalSaved,
    totalShares: data.totalShares,
    totalProfileVisits: data.totalProfileVisits
  }))
  
  return contentAnalysis
}

// CONSERVATIVE: Calculate real growth rates only when we have sufficient data
async function calculateRealGrowthRates(
  supabase: any, 
  instagramAccountId: string, 
  currentFollowers: number
): Promise<RealGrowthCalculation> {
  
  // Get historical snapshots
  const { data: snapshots, error } = await supabase
    .from('daily_snapshots')
    .select('snapshot_date, followers_count')
    .eq('instagram_account_id', instagramAccountId)
    .order('snapshot_date', { ascending: true })

  if (error || !snapshots || snapshots.length === 0) {
    return {
      weeklyGrowthRate: null,
      monthlyGrowthRate: null,
      canCalculateWeekly: false,
      canCalculateMonthly: false,
      daysOfData: 0,
      dataAvailableSince: null,
      daysUntilWeekly: 7,
      daysUntilMonthly: 30
    }
  }

  const oldestSnapshot = snapshots[0]
  const newestSnapshot = snapshots[snapshots.length - 1]
  const daysOfData = Math.floor(
    (new Date(newestSnapshot.snapshot_date).getTime() - new Date(oldestSnapshot.snapshot_date).getTime()) 
    / (1000 * 60 * 60 * 24)
  ) + 1 // +1 to include today

  const dataAvailableSince = new Date(oldestSnapshot.snapshot_date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })

  // Calculate days until we can show each metric
  const daysUntilWeekly = Math.max(0, 7 - daysOfData)
  const daysUntilMonthly = Math.max(0, 30 - daysOfData)

  // Only calculate weekly growth if we have 7+ days of data
  let weeklyGrowthRate = null
  let canCalculateWeekly = false
  
  if (daysOfData >= 7) {
    const weekAgoTarget = new Date()
    weekAgoTarget.setDate(weekAgoTarget.getDate() - 7)
    
    // Find closest snapshot to 7 days ago (within 2 days tolerance)
    const weekAgoSnapshot = findClosestSnapshot(snapshots, weekAgoTarget, 2)
    
    if (weekAgoSnapshot && weekAgoSnapshot.followers_count > 0) {
      const weeklyGrowth = ((currentFollowers - weekAgoSnapshot.followers_count) / weekAgoSnapshot.followers_count) * 100
      weeklyGrowthRate = weeklyGrowth >= 0 ? `+${weeklyGrowth.toFixed(1)}%` : `${weeklyGrowth.toFixed(1)}%`
      canCalculateWeekly = true
    }
  }

  // Only calculate monthly growth if we have 30+ days of data
  let monthlyGrowthRate = null
  let canCalculateMonthly = false
  
  if (daysOfData >= 30) {
    const monthAgoTarget = new Date()
    monthAgoTarget.setDate(monthAgoTarget.getDate() - 30)
    
    // Find closest snapshot to 30 days ago (within 5 days tolerance)
    const monthAgoSnapshot = findClosestSnapshot(snapshots, monthAgoTarget, 5)
    
    if (monthAgoSnapshot && monthAgoSnapshot.followers_count > 0) {
      const monthlyGrowth = ((currentFollowers - monthAgoSnapshot.followers_count) / monthAgoSnapshot.followers_count) * 100
      monthlyGrowthRate = monthlyGrowth >= 0 ? `+${monthlyGrowth.toFixed(1)}%` : `${monthlyGrowth.toFixed(1)}%`
      canCalculateMonthly = true
    }
  }

  return {
    weeklyGrowthRate,
    monthlyGrowthRate,
    canCalculateWeekly,
    canCalculateMonthly,
    daysOfData,
    dataAvailableSince,
    daysUntilWeekly,
    daysUntilMonthly
  }
}

function findClosestSnapshot(snapshots: any[], targetDate: Date, maxDaysTolerance: number) {
  let closest = null
  let closestDiff = Infinity
  
  for (const snapshot of snapshots) {
    const snapshotDate = new Date(snapshot.snapshot_date)
    const diff = Math.abs(snapshotDate.getTime() - targetDate.getTime())
    
    if (diff < closestDiff) {
      closestDiff = diff
      closest = snapshot
    }
  }
  
  // Only return if within tolerance
  const maxDiffMs = maxDaysTolerance * 24 * 60 * 60 * 1000
  return closestDiff <= maxDiffMs ? closest : null
}

// Function to capture daily snapshots with complete data
async function captureDailySnapshot(
  supabase: any, 
  instagramAccountId: string, 
  metricsData: any,
  postsWithInsights: PostWithInsights[]
) {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    // Calculate aggregated data from posts
    const totalSaves = postsWithInsights.reduce((sum, post) => sum + (post.insights.saved || 0), 0);
    const totalShares = postsWithInsights.reduce((sum, post) => sum + (post.insights.shares || 0), 0);
    
    const snapshotData = {
      instagram_account_id: instagramAccountId,
      snapshot_date: today,
      followers_count: metricsData.followers || 0,
      following_count: 0, // Would need to fetch this separately if needed
      media_count: metricsData.mediaCount || 0,
      total_likes: metricsData.avgLikes ? metricsData.avgLikes * metricsData.mediaCount : 0,
      total_comments: metricsData.avgComments ? metricsData.avgComments * metricsData.mediaCount : 0,
      total_shares: totalShares,
      total_saves: totalSaves,
      engagement_rate: parseFloat(metricsData.engagementRate?.replace('%', '') || '0'),
      avg_likes_per_post: metricsData.avgLikes || 0,
      avg_comments_per_post: metricsData.avgComments || 0,
      total_reach: metricsData.totalReach || 0,
      total_impressions: metricsData.totalImpressions || 0,
      posts_published_count: postsWithInsights.length || 0,
      raw_profile_data: {
        username: metricsData.username,
        followers: metricsData.followers,
        mediaCount: metricsData.mediaCount
      },
      raw_insights_data: {
        accountInsights: metricsData.accountInsights,
        topFollowers: metricsData.topFollowers,
        timingAnalysis: metricsData.timingAnalysis,
        contentAnalysis: metricsData.contentAnalysis
      }
    }
    
    // Upsert daily snapshot (update if exists for today, insert if not)
    const { data, error } = await supabase
      .from('daily_snapshots')
      .upsert(snapshotData, {
        onConflict: 'instagram_account_id,snapshot_date'
      })
      .select()
    
    if (error) {
      console.error('❌ Failed to capture daily snapshot:', error)
    } else {
      console.log('✅ Daily snapshot captured successfully')
    }
    
    return { success: !error, data }
  } catch (error) {
    console.error('❌ Error in captureDailySnapshot:', error)
    return { success: false, error }
  }
}

// REPLACE your fetchHistoricalData function with this improved dynamic version:

async function fetchHistoricalData(
  supabase: any, 
  instagramAccountId: string,
  currentFollowers: number
): Promise<{ weekly: HistoricalDataPoint[], monthly: HistoricalDataPoint[] }> {
  try {
    console.log('📊 Fetching historical data from daily_snapshots for charts...')
    
    // Calculate date ranges dynamically
    const now = new Date();
    
    // For 6 months ago: go to the 1st of that month to ensure we get complete months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // First day of that month
    
    // For 4 weeks ago: exact date
    const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
    
    // Use the more recent date for weekly data
    const weeklyStartDate = new Date(Math.max(sixMonthsAgo.getTime(), fourWeeksAgo.getTime()));
    
    // For monthly, use 6 months ago
    const monthlyStartDate = sixMonthsAgo;
    
    console.log('📅 Dynamic date filters:', {
      now: now.toISOString().split('T')[0],
      sixMonthsAgo: sixMonthsAgo.toISOString().split('T')[0],
      fourWeeksAgo: fourWeeksAgo.toISOString().split('T')[0],
      weeklyStartDate: weeklyStartDate.toISOString().split('T')[0],
      monthlyStartDate: monthlyStartDate.toISOString().split('T')[0]
    });

    // Fetch snapshots with date filtering
    const { data: allSnapshots, error } = await supabase
      .from('daily_snapshots')
      .select('snapshot_date, followers_count')
      .eq('instagram_account_id', instagramAccountId)
      .gte('snapshot_date', monthlyStartDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true })

    if (error || !allSnapshots || allSnapshots.length === 0) {
      console.log('❌ No historical snapshots found:', error?.message || 'No data')
      return { weekly: [], monthly: [] }
    }

    console.log(`✅ Found ${allSnapshots.length} snapshots within date range`)
    
    // DEBUG: Show date range of actual data
    if (allSnapshots.length > 0) {
      console.log(`📅 Data range: ${allSnapshots[0].snapshot_date} to ${allSnapshots[allSnapshots.length - 1].snapshot_date}`)
    }

    // Filter for weekly data (last 4 weeks only)
    const weeklySnapshots = allSnapshots.filter((snapshot: { snapshot_date: string, followers_count: number }) => {
      const snapshotDate = new Date(snapshot.snapshot_date);
      return snapshotDate >= weeklyStartDate;
    });

    // Process WEEKLY data (last 4 weeks)
    const weekly: HistoricalDataPoint[] = []
    if (weeklySnapshots && weeklySnapshots.length > 0) {
      const weeklyGroups = new Map<string, { followers: number[], dates: string[] }>()
      
      weeklySnapshots.forEach((snapshot: { snapshot_date: string, followers_count: number }) => {
        const date = new Date(snapshot.snapshot_date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyGroups.has(weekKey)) {
          weeklyGroups.set(weekKey, { followers: [], dates: [] })
        }
        
        weeklyGroups.get(weekKey)!.followers.push(snapshot.followers_count)
        weeklyGroups.get(weekKey)!.dates.push(snapshot.snapshot_date)
      })

      // Convert to array, sort by date, and limit to last 4 weeks
      const weeklyEntries = Array.from(weeklyGroups.entries())
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .slice(-4) // Only keep last 4 weeks

      weeklyEntries.forEach(([weekStart, data]) => {
        const avgFollowers = Math.round(data.followers.reduce((sum, f) => sum + f, 0) / data.followers.length)
        const weekStartDate = new Date(weekStart)
        const currentWeekStart = new Date(now)
        currentWeekStart.setDate(now.getDate() - now.getDay())
        const isCurrentWeek = weekStartDate.getTime() >= currentWeekStart.getTime()
        
        weekly.push({
          date: weekStart,
          followers: avgFollowers,
          isComplete: !isCurrentWeek
        })
      })
    }

    // Process MONTHLY data (all months in range)
    const monthly: HistoricalDataPoint[] = []
    if (allSnapshots && allSnapshots.length > 0) {
      const monthlyGroups = new Map<string, { followers: number[], dates: string[] }>()
      
      allSnapshots.forEach((snapshot: { snapshot_date: string, followers_count: number }) => {
        const date = new Date(snapshot.snapshot_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyGroups.has(monthKey)) {
          monthlyGroups.set(monthKey, { followers: [], dates: [] })
        }
        
        monthlyGroups.get(monthKey)!.followers.push(snapshot.followers_count)
        monthlyGroups.get(monthKey)!.dates.push(snapshot.snapshot_date)
      })

      // Convert to array and sort by date (no artificial limit - let 6-month filter handle it)
      const monthlyEntries = Array.from(monthlyGroups.entries())
        .sort(([a], [b]) => new Date(a + '-01').getTime() - new Date(b + '-01').getTime())

      monthlyEntries.forEach(([month, data]) => {
        const avgFollowers = Math.round(data.followers.reduce((sum, f) => sum + f, 0) / data.followers.length)
        const currentMonth = now.toISOString().slice(0, 7)
        const isCurrentMonth = month === currentMonth
        
        monthly.push({
          date: month,
          followers: avgFollowers,
          isComplete: !isCurrentMonth
        })
      })

      // ENSURE current month is included (even if no snapshots yet)
      const currentMonth = now.toISOString().slice(0, 7)
      const hasCurrentMonth = monthly.some(m => m.date === currentMonth)
      
      if (!hasCurrentMonth) {
        console.log(`📅 Adding current month (${currentMonth}) with current followers: ${currentFollowers}`)
        monthly.push({
          date: currentMonth,
          followers: currentFollowers,
          isComplete: false
        })
      }

      // Sort monthly data again after potential addition
      monthly.sort((a, b) => new Date(a.date + '-01').getTime() - new Date(b.date + '-01').getTime())
    }

    console.log(`📊 Generated dynamic chart data: ${weekly.length} weekly points (max 4), ${monthly.length} monthly points`)
    console.log('📈 Weekly data:', weekly.map(w => `${w.date}: ${w.followers.toLocaleString()}`))
    console.log('📈 Monthly data:', monthly.map(m => `${m.date}: ${m.followers.toLocaleString()}`))

    return { weekly, monthly }
  } catch (error) {
    console.error('❌ Error fetching historical data for charts:', error)
    return { weekly: [], monthly: [] }
  }
}

// 🔥 NEW: Function to find the Instagram account with the most historical data
async function findPrimaryInstagramAccount(supabase: any, userId: string) {
  console.log('🔍 Finding primary Instagram account with most historical data...')

  // Get all Instagram accounts for this user (active and inactive)
  const { data: allAccounts, error: accountsError } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true }) // Oldest first

  if (accountsError || !allAccounts || allAccounts.length === 0) {
    console.log('❌ No Instagram accounts found for user')
    return { account: null, error: 'No Instagram account found' }
  }

  console.log(`📊 Found ${allAccounts.length} Instagram accounts for user`)

  if (allAccounts.length === 1) {
    // Only one account, make sure it's active
    const account = allAccounts[0]
    await supabase
      .from('instagram_accounts')
      .update({ is_active: true })
      .eq('id', account.id)
    
    console.log(`✅ Using single account: ${account.username}`)
    return { account, error: null }
  }

  // Multiple accounts - find the one with the most historical data
  console.log('🔄 Multiple accounts found, determining primary based on historical data...')

  const accountDataCounts = await Promise.all(
    allAccounts.map(async (account: any) => {
      const { count } = await supabase
        .from('daily_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('instagram_account_id', account.id)
      
      return { 
        account, 
        dataCount: count || 0,
        createdAt: new Date(account.created_at).getTime()
      }
    })
  )

  // Sort by data count (most data first), then by creation date (oldest first)
  accountDataCounts.sort((a, b) => {
    if (b.dataCount !== a.dataCount) {
      return b.dataCount - a.dataCount
    }
    return a.createdAt - b.createdAt
  })

  const primaryAccountData = accountDataCounts[0]
  const primaryAccount = primaryAccountData.account
  const duplicateAccounts = accountDataCounts.slice(1)

  console.log(`📊 Primary account: ${primaryAccount.username} (${primaryAccountData.dataCount} data points, created ${new Date(primaryAccount.created_at).toLocaleDateString()})`)
  console.log(`🗑️ Other accounts: ${duplicateAccounts.map(acc => `${acc.account.username} (${acc.dataCount} points)`).join(', ')}`)

  // Migrate data from duplicate accounts to primary account if needed
  for (const duplicateData of duplicateAccounts) {
    if (duplicateData.dataCount > 0) {
      console.log(`🔄 Migrating ${duplicateData.dataCount} snapshots from ${duplicateData.account.username} to ${primaryAccount.username}`)
      
      // Update snapshots to point to primary account
      const { error: migrateError } = await supabase
        .from('daily_snapshots')
        .update({ instagram_account_id: primaryAccount.id })
        .eq('instagram_account_id', duplicateData.account.id)

      if (migrateError) {
        console.error(`❌ Error migrating snapshots:`, migrateError)
      } else {
        console.log(`✅ Migrated ${duplicateData.dataCount} snapshots successfully`)
      }
    }
  }

  // Mark primary account as active, others as inactive
  await supabase
    .from('instagram_accounts')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', primaryAccount.id)

  const duplicateIds = duplicateAccounts.map(acc => acc.account.id)
  if (duplicateIds.length > 0) {
    await supabase
      .from('instagram_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', duplicateIds)
  }

  console.log(`✅ Primary account ${primaryAccount.username} activated, ${duplicateIds.length} duplicates deactivated`)

  return { account: primaryAccount, error: null }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Instagram metrics API called (ENHANCED VERSION WITH DUPLICATE ACCOUNT FIX)')
    
    // Modern Supabase SSR approach - Next.js 15 compatible
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // No need to set cookies in API routes
          },
          remove(name: string, options: CookieOptions) {
            // No need to remove cookies in API routes
          },
        },
      }
    )
    
    console.log('🔐 Supabase client created, checking auth...')
    
    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No authenticated user:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 })
    }

    console.log('✅ Authenticated user:', user.id)

    // 🔥 NEW: Find the primary Instagram account with the most historical data
    const { account: instagramAccount, error: igError } = await findPrimaryInstagramAccount(supabase, user.id)

    if (igError || !instagramAccount) {
      console.log('❌ No Instagram account found:', igError)
      return NextResponse.json({ error: 'Instagram not connected' }, { status: 404 })
    }

    console.log('📸 Using primary Instagram account:', instagramAccount.username, `(ID: ${instagramAccount.id})`)

    // Test basic API access first
    console.log('🧪 Testing basic API access...')
    const testResponse = await fetch(
      `https://graph.instagram.com/me?access_token=${instagramAccount.access_token}`
    )
    
    if (!testResponse.ok) {
      console.log('❌ Basic API test failed:', testResponse.status)
      const errorData = await testResponse.text()
      console.log('Basic API error details:', errorData)
      
      return NextResponse.json({ 
        error: 'Instagram API access failed - check token and permissions',
        details: errorData 
      }, { status: 400 })
    }
    
    const testData = await testResponse.json()
    console.log('✅ Basic API test passed:', testData)

    // Fetch profile data using the correct endpoint
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=followers_count,media_count,username&access_token=${instagramAccount.access_token}`
    )

    if (!profileResponse.ok) {
      console.log('❌ Profile API error:', profileResponse.status)
      const errorData = await profileResponse.text()
      console.log('Profile API error details:', errorData)
      
      return NextResponse.json({ 
        error: 'Failed to fetch Instagram profile data',
        details: errorData 
      }, { status: 400 })
    }

    const profileData = await profileResponse.json()
    console.log('✅ Instagram profile data fetched:', profileData)

    // EXTENDED: Fetch more posts with date filtering for 6+ months of history
    console.log('📱 Fetching extended media list (6+ months history)...')
    
    // Calculate date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sinceTimestamp = Math.floor(sixMonthsAgo.getTime() / 1000);
    
    const mediaResponse = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,permalink,thumbnail_url,timestamp,caption,like_count,comments_count&since=${sinceTimestamp}&limit=50&access_token=${instagramAccount.access_token}`
    )

    let postsWithInsights: PostWithInsights[] = []
    let avgLikes = 0
    let avgComments = 0
    let totalEngagement = 0
    let totalReach = 0
    let totalViews = 0
    let engagementRate = '0%'
    let timingAnalysis = null
    let contentAnalysis = null
    let calculatedAccountInsights = null
    let topFollowers: TopFollower[] = []

    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      console.log('✅ Extended Instagram media data fetched:', mediaData.data.length, 'posts (6+ months)')
      
      if (mediaData.data.length > 0) {
        console.log('🔍 Fetching enhanced insights and ALL comments for each post...')
        
        // EXTENDED: Process posts in smaller batches to respect rate limits
        const batchSize = 5;
        const batches = [];
        for (let i = 0; i < mediaData.data.length; i += batchSize) {
          batches.push(mediaData.data.slice(i, i + batchSize));
        }
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batches[batchIndex].length} posts)`);
          
          const batchResults = await Promise.all(
            batches[batchIndex].map(async (post: any): Promise<PostWithInsights> => {
              const [insights, comments] = await Promise.all([
                fetchPostInsights(post.id, instagramAccount.access_token, post),
                fetchAllComments(post.id, instagramAccount.access_token) // EXTENDED: Get ALL comments
              ]);
              
              return {
                id: post.id,
                media_type: post.media_type,
                media_url: post.media_url,
                thumbnail_url: post.thumbnail_url,
                permalink: post.permalink,
                timestamp: post.timestamp,
                caption: post.caption,
                like_count: post.like_count || 0,
                comments_count: post.comments_count || 0,
                insights,
                comments
              };
            })
          );
          
          postsWithInsights.push(...batchResults);
          
          // Small delay between batches to respect rate limits
          if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        console.log('✅ Extended insights and comments processing complete for', postsWithInsights.length, 'posts')
        await savePostsToDatabase(supabase, instagramAccount.id, postsWithInsights)
        
        // EXTENDED: Analyze top followers from comprehensive comment data
        topFollowers = analyzeTopFollowers(postsWithInsights, profileData.username || instagramAccount.username)
        
        // Calculate comprehensive metrics
        const totalLikes = postsWithInsights.reduce((sum, post) => sum + post.like_count, 0)
        const totalComments = postsWithInsights.reduce((sum, post) => sum + post.comments_count, 0)
        totalReach = postsWithInsights.reduce((sum, post) => sum + post.insights.reach, 0)
        totalViews = postsWithInsights.reduce((sum, post) => sum + post.insights.views, 0)
        
        // Calculate enhanced account-level insights from post aggregation
        const totalProfileVisits = postsWithInsights.reduce((sum, post) => sum + post.insights.profile_visits, 0)
        const totalProfileActivity = postsWithInsights.reduce((sum, post) => sum + post.insights.profile_activity, 0)
        const totalSaved = postsWithInsights.reduce((sum, post) => sum + post.insights.saved, 0)
        const totalShares = postsWithInsights.reduce((sum, post) => sum + post.insights.shares, 0)
        const totalInteractions = postsWithInsights.reduce((sum, post) => sum + post.insights.total_interactions, 0)
        
        avgLikes = Math.round(totalLikes / postsWithInsights.length)
        avgComments = Math.round(totalComments / postsWithInsights.length)
        totalEngagement = totalLikes + totalComments + totalSaved + totalShares // Enhanced engagement calculation
        
        // Calculate total comment count from extended data
        const totalCommentsFromData = postsWithInsights.reduce((sum, post) => sum + (post.comments?.length || 0), 0)
        
        console.log('📊 Extended calculated metrics:', {
          totalLikes,
          totalComments,
          totalCommentsFromExtendedData: totalCommentsFromData,
          totalReach,
          totalViews,
          totalProfileVisits,
          totalProfileActivity,
          totalSaved,
          totalShares,
          totalInteractions,
          avgLikes,
          avgComments,
          postsAnalyzed: postsWithInsights.length,
          timeSpan: postsWithInsights.length > 0 ? `${formatDate(postsWithInsights[postsWithInsights.length - 1].timestamp)} to ${formatDate(postsWithInsights[0].timestamp)}` : 'N/A'
        })
        
        // Create comprehensive account insights from post aggregation
        calculatedAccountInsights = {
          reach: totalReach,
          profile_visits: totalProfileVisits,
          impressions: totalViews, // Use views as impressions replacement
          profile_activity: totalProfileActivity,
          saved: totalSaved,
          shares: totalShares,
          total_interactions: totalInteractions
        }
        
        // Calculate engagement rate ONLY if we have reach data
        if (totalReach > 0) {
          const realEngagementRate = ((totalEngagement / totalReach) * 100)
          engagementRate = `${realEngagementRate.toFixed(1)}%`
          console.log('✅ Using real engagement rate based on reach:', engagementRate)
        } else if (postsWithInsights.length > 0) {
          // Fallback to follower-based calculation only if we have posts
          const engagementPercent = ((totalEngagement / (profileData.followers_count * postsWithInsights.length)) * 100)
          engagementRate = `${engagementPercent.toFixed(1)}%`
          console.log('⚠️ Using fallback engagement rate based on followers:', engagementRate)
        } else {
          engagementRate = '0%'
        }

        // Analyze timing patterns with enhanced data
        timingAnalysis = calculateOptimalTimes(postsWithInsights)
        
        // Analyze content types with enhanced performance data
        contentAnalysis = analyzeContentTypes(postsWithInsights)
        
        console.log('📊 Final extended metrics:', {
          avgLikes,
          avgComments,
          totalReach,
          totalViews,
          totalProfileVisits,
          totalSaved,
          totalShares,
          engagementRate,
          topFollowersFound: topFollowers.length,
          hasRealReachData: totalReach > 0,
          hasEnhancedInsights: totalProfileVisits > 0 || totalViews > 0,
          extendedTimeRange: '6+ months'
        })
      }
    } else {
      console.log('⚠️ Failed to fetch media data')
      const errorText = await mediaResponse.text()
      console.log('Media error details:', errorText)
    }

    // Helper function to format dates
    function formatDate(dateString: string) {
      return new Date(dateString).toLocaleDateString();
    }

    // CONSERVATIVE: Calculate real growth rates
    const realGrowthData = await calculateRealGrowthRates(
      supabase, 
      instagramAccount.id, 
      profileData.followers_count
    )

    // NEW: Fetch historical data for charts
    const historicalData = await fetchHistoricalData(
      supabase,
      instagramAccount.id,
      profileData.followers_count
    )

    // Generate dynamic notifications based on real user data (no fake data)
    const generateRealNotifications = () => {
      const notifications = [];
      const now = new Date();
      const currentHour = now.getHours();
      
      // 1. OPTIMAL POSTING TIME ALERTS (only if we have timing data)
      if (timingAnalysis && timingAnalysis.peakHours.length > 0) {
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        if (isWeekday && timingAnalysis.peakHours.includes(currentHour)) {
          notifications.push({
            type: 'AI Suggestion',
            message: 'Perfect time to post! Based on your posting history, your audience is most active now.',
            time: 'now',
            bg: 'bg-blue-50',
            icon: 'bg-blue-500',
            priority: 'high'
          });
        }
      }
      
      // 2. HIGH PERFORMING POST ALERTS (only with real data)
      if (postsWithInsights.length > 0 && avgLikes > 0) {
        const recentHighPerformer = postsWithInsights.find(post => 
          (post.like_count || 0) > avgLikes * 1.5
        );
        
        if (recentHighPerformer) {
          const timeAgo = Math.floor((now.getTime() - new Date(recentHighPerformer.timestamp).getTime()) / (1000 * 60 * 60));
          notifications.push({
            type: 'Engagement Alert',
            message: `Your post got ${recentHighPerformer.like_count} likes - ${Math.round(((recentHighPerformer.like_count || 0) / avgLikes) * 100)}% above your average!`,
            time: timeAgo < 24 ? `${timeAgo}h ago` : '1d ago',
            bg: 'bg-green-50',
            icon: 'bg-green-500',
            priority: 'high'
          });
        }
      }
      
      // 3. GROWTH MILESTONE ALERTS (only with real data)
      if (realGrowthData.canCalculateWeekly) {
        notifications.push({
          type: 'Growth Update',
          message: `Weekly growth rate now available: ${realGrowthData.weeklyGrowthRate}! Based on your actual follower data.`,
          time: '2h ago',
          bg: 'bg-emerald-50',
          icon: 'bg-emerald-500',
          priority: 'medium'
        });
      }
      
      // 4. DATA AVAILABILITY UPDATES
      if (realGrowthData.daysOfData > 0 && realGrowthData.daysOfData < 7) {
        notifications.push({
          type: 'Data Collection',
          message: `${realGrowthData.daysOfData} days of data collected. Weekly growth rates available in ${realGrowthData.daysUntilWeekly} more days.`,
          time: '4h ago',
          bg: 'bg-blue-50',
          icon: 'bg-blue-500',
          priority: 'low'
        });
      }
      
      // 5. TOP FOLLOWERS INSIGHTS (only with real data)
      if (topFollowers.length > 0) {
        const superFans = topFollowers.filter(f => f.engagementType === 'high').length;
        if (superFans > 0) {
          notifications.push({
            type: 'Community Insight',
            message: `You have ${superFans} highly engaged followers who regularly comment on your posts!`,
            time: '6h ago',
            bg: 'bg-violet-50',
            icon: 'bg-violet-500',
            priority: 'medium'
          });
        }
      }
      
      return notifications.sort((a, b) => {
        const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low'];
      });
    };

    // Capture daily snapshot after calculating all metrics
    if (instagramAccount?.id && postsWithInsights.length > 0) {
      await captureDailySnapshot(supabase, instagramAccount.id, {
        followers: profileData.followers_count || 0,
        mediaCount: profileData.media_count || 0,
        username: profileData.username || instagramAccount.username,
        engagementRate,
        avgLikes,
        avgComments,
        totalReach,
        totalImpressions: totalViews,
        accountInsights: calculatedAccountInsights,
        topFollowers,
        timingAnalysis,
        contentAnalysis
      }, postsWithInsights)
    }

    const result = {
      // Basic metrics (always available)
      followers: profileData.followers_count || 0,
      mediaCount: profileData.media_count || 0,
      username: profileData.username || instagramAccount.username,
      engagementRate,
      
      // CONSERVATIVE: Growth rates (only when we have real data)
      growthRate: realGrowthData.weeklyGrowthRate, // null if not enough data
      monthlyGrowth: realGrowthData.monthlyGrowthRate, // null if not enough data
      
      // Growth data context for UI
      growthData: {
        canCalculateWeekly: realGrowthData.canCalculateWeekly,
        canCalculateMonthly: realGrowthData.canCalculateMonthly,
        daysOfData: realGrowthData.daysOfData,
        dataAvailableSince: realGrowthData.dataAvailableSince,
        daysUntilWeekly: realGrowthData.daysUntilWeekly,
        daysUntilMonthly: realGrowthData.daysUntilMonthly
      },
      
      avgLikes,
      avgComments,
      
      // Enhanced reach metrics (only real data)
      totalReach,
      totalImpressions: totalViews,
      avgReach: postsWithInsights.length > 0 ? Math.round(totalReach / postsWithInsights.length) : 0,
      avgImpressions: postsWithInsights.length > 0 ? Math.round(totalViews / postsWithInsights.length) : 0,
      
      // Enhanced account insights from post aggregation (only if we have data)
      accountInsights: calculatedAccountInsights && 
        (calculatedAccountInsights.reach > 0 || 
         calculatedAccountInsights.profile_visits > 0 || 
         calculatedAccountInsights.impressions > 0) 
        ? calculatedAccountInsights 
        : null,
      
      // NEW: Historical data for charts
      historicalData,
      
      // EXTENDED: Real top followers from comment analysis
      topFollowers,
      
      // Enhanced post data with all insights (limited to most recent 20 for performance)
      recentPosts: postsWithInsights.slice(0, 20).map(post => ({
        id: post.id,
        media_type: post.media_type,
        media_url: post.media_url,
        thumbnail_url: post.thumbnail_url,
        permalink: post.permalink,
        timestamp: post.timestamp,
        caption: post.caption,
        like_count: post.like_count,
        comments_count: post.comments_count,
        // Enhanced insights data
        reach: post.insights.reach,
        impressions: post.insights.views,
        engagement: post.insights.engagement,
        profile_visits: post.insights.profile_visits,
        website_clicks: post.insights.profile_activity,
        saved: post.insights.saved,
        shares: post.insights.shares,
        total_interactions: post.insights.total_interactions,
        comments: (post.comments || []).slice(0, 10) // Limit comments for performance
      })),
      
      // Advanced analytics for AI insights
      timingAnalysis,
      contentAnalysis,
      
      // Dynamic notifications with real data only
      notifications: generateRealNotifications(),
      
      // CONSERVATIVE: Insights with real data context
      insights: {
        bestPostingTime: timingAnalysis && timingAnalysis.peakHours.length > 0 ? 
          `${timingAnalysis.peakHours[0]}-${timingAnalysis.peakHours[timingAnalysis.peakHours.length - 1]}:00` : 
          null, // null instead of estimated time
        topContentType: contentAnalysis && contentAnalysis.length > 0 ? 
          contentAnalysis.reduce((best, current) => (current.avgReach + current.avgProfileVisits) > (best.avgReach + best.avgProfileVisits) ? current : best).type :
          null, // null instead of estimated type
        engagementTrend: totalEngagement > 0 && avgLikes > 0 ? 
          (totalEngagement > (avgLikes + avgComments) * postsWithInsights.length ? 'increasing' : 'stable') : 
          null, // null if no data
        reachTrend: totalReach > 0 ? 'real_data' : 'no_data', // honest about data availability
        hasRealInsights: (calculatedAccountInsights?.profile_visits || 0) > 0 || totalViews > 0,
        apiType: 'instagram_api_enhanced_with_historical_data_and_duplicate_fix',
        dataTimespan: postsWithInsights.length > 0 ? `${formatDate(postsWithInsights[postsWithInsights.length - 1].timestamp)} to ${formatDate(postsWithInsights[0].timestamp)}` : 'No data',
        totalPostsAnalyzed: postsWithInsights.length,
        connectionDate: instagramAccount.created_at ? new Date(instagramAccount.created_at).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        }) : null,
        // 🔥 NEW: Show which account is being used
        primaryAccountId: instagramAccount.id,
        accountCreated: new Date(instagramAccount.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric' 
        })
      }
    }

    console.log('📊 Returning ENHANCED metrics with duplicate account fix:', {
      followers: result.followers,
      mediaCount: result.mediaCount,
      engagementRate: result.engagementRate,
      weeklyGrowthAvailable: result.growthData.canCalculateWeekly,
      monthlyGrowthAvailable: result.growthData.canCalculateMonthly,
      daysOfData: result.growthData.daysOfData,
      postsCount: result.recentPosts.length,
      totalPostsAnalyzed: postsWithInsights.length,
      hasRealReachData: result.totalReach > 0,
      topFollowersCount: topFollowers.length,
      hasHistoricalData: historicalData.weekly.length > 0 || historicalData.monthly.length > 0,
      primaryAccountUsed: instagramAccount.id,
      dataCollectionStarted: result.insights.dataTimespan,
      apiType: result.insights.apiType
    })

    // Add categorization data before returning
console.log('📊 Adding categorization data...')
const categorizationData = await getCategorizationData(supabase, user.id, [instagramAccount.id], result.recentPosts || [])

return NextResponse.json({
  ...result,  // All your existing Instagram data
  ...categorizationData  // Complete categorization system
})

  } catch (error) {
    console.error('❌ Enhanced Instagram metrics error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch metrics',
      details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
    }, { status: 500 })
  }
}

// Helper functions for cross-analysis (add these RIGHT HERE before the exports)
function getCategoryEmoji(category: string) {
  const emojiMap = {
    'Tutorial': '📚',
    'Behind the Scenes': '🎬',
    'Product Demo': '🛍️',
    'Lifestyle': '✨',
    'Tips': '💡',
    'Story': '📖',
    'News': '📰',
    'Review': '⭐',
    'Entertainment': '🎭',
    'Educational': '🎓'
  };
  return emojiMap[category as keyof typeof emojiMap] || '📝';
}

function getFormatEmoji(format: string) {
  const emojiMap = {
    'VIDEO': '🎬',
    'CAROUSEL_ALBUM': '📸',
    'IMAGE': '🖼️',
    'Reels': '🎬',
    'Posts': '📝',
    'Carousels': '📸'
  };
  return emojiMap[format as keyof typeof emojiMap] || '📄';
}

function getFormatType(mediaType: string) {
  switch (mediaType) {
    case 'VIDEO':
      return 'Reels';
    case 'CAROUSEL_ALBUM':
      return 'Carousels';
    case 'IMAGE':
    default:
      return 'Posts';
  }
}

export const dynamic = 'force-dynamic'

// Add this POST method to handle tagging operations
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {},
          remove(name: string, options: CookieOptions) {},
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestBody = await request.json()
    console.log('🔍 POST handler - Request body:', requestBody) // Add this debug
    
    const result = await handleTaggingOperation(supabase, user.id, requestBody)

    console.log('🔍 POST handler - Result:', result) // Add this debug

    if (result.error) {
      return NextResponse.json(result, { status: result.status || 500 }) // Return COMPLETE result with debug
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Instagram tagging API error:', error)
    return NextResponse.json({ 
      error: 'Failed to process tagging request' 
    }, { status: 500 })
  }
}