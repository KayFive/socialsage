// src/services/insightGenerator.ts
import { InstagramDataPackage, InstagramMedia } from '@/types/instagram.types';

export interface WeeklyWin {
  type: 'post_performance' | 'engagement_spike' | 'growth_milestone' | 'content_discovery';
  title: string;
  description: string;
  data: any;
  actionable_tip: string;
  confidence_score: number;
}

export interface SmartInsight {
  id: string;
  type: 'timing' | 'content' | 'audience' | 'trend' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  data_source: string;
  created_at: string;
}

export interface WeeklyPerformance {
  currentWeek: {
    likes: number;
    comments: number;
    posts: number;
    shares: number;
    impressions: number;
  };
  previousWeek: {
    likes: number;
    comments: number;
    posts: number;
    shares: number;
    impressions: number;
  };
  changes: {
    likes: { value: number; percentage: number };
    comments: { value: number; percentage: number };
    posts: { value: number; percentage: number };
    shares: { value: number; percentage: number };
    impressions: { value: number; percentage: number };
  };
  topPost: {
    type: string;
    engagements: number;
    caption?: string;
  };
  smartTip: {
    title: string;
    description: string;
    confidence: string;
  };
}

export class InsightGenerator {
  
  static generateWeeklyWins(reportData: any): WeeklyWin[] {
    console.log('🔍 Input data structure:', JSON.stringify(reportData, null, 2));
    
    const wins: WeeklyWin[] = [];
    
    // Try to find media data in different possible locations
    let media: any[] = [];
    
    if (reportData?.media && Array.isArray(reportData.media)) {
      media = reportData.media;
    } else if (reportData?.contentAnalysis?.topPosts && Array.isArray(reportData.contentAnalysis.topPosts)) {
      media = reportData.contentAnalysis.topPosts;
    } else if (reportData?.raw_instagram_data?.media && Array.isArray(reportData.raw_instagram_data.media)) {
      media = reportData.raw_instagram_data.media;
    } else {
      console.log('⚠️ No media data found, using fallback insights');
      return this.generateFallbackWins(reportData);
    }
    
    console.log('📊 Found media array with', media.length, 'posts');
    
    if (media.length === 0) {
      return this.generateFallbackWins(reportData);
    }
    
    // Get posts from last 7 days
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const recentPosts = media.filter(post => {
      if (!post.timestamp) return false;
      return new Date(post.timestamp) >= lastWeek;
    });
    
    console.log('📅 Recent posts (last 7 days):', recentPosts.length);
    
    // If no recent posts, use all posts
    const postsToAnalyze = recentPosts.length > 0 ? recentPosts : media.slice(0, 5);
    
    if (postsToAnalyze.length === 0) {
      return this.generateFallbackWins(reportData);
    }
    
    // Find best performing post
    const bestPost = postsToAnalyze.reduce((best, current) => {
      const bestEngagement = (best.like_count || 0) + (best.comments_count || 0);
      const currentEngagement = (current.like_count || 0) + (current.comments_count || 0);
      return currentEngagement > bestEngagement ? current : best;
    });
    
    const totalEngagement = (bestPost.like_count || 0) + (bestPost.comments_count || 0);
    
    if (totalEngagement > 0) {
      wins.push({
        type: 'post_performance',
        title: '🔥 Your Top Performing Post!',
        description: `Your ${bestPost.media_type || 'post'} got ${totalEngagement.toLocaleString()} total engagements - that's your best one yet!`,
        data: bestPost,
        actionable_tip: this.generatePostTip(bestPost),
        confidence_score: 0.9
      });
    }
    
    // Check engagement rate if available
    const profile = reportData?.profile;
    if (profile?.engagement_rate && profile.engagement_rate > 3) {
      wins.push({
        type: 'engagement_spike',
        title: '📈 Great Engagement Rate!',
        description: `Your ${profile.engagement_rate.toFixed(2)}% engagement rate is above average - your audience loves your content!`,
        data: { engagement_rate: profile.engagement_rate },
        actionable_tip: "Keep posting consistently to maintain this momentum!",
        confidence_score: 0.8
      });
    }
    
    console.log('✅ Generated', wins.length, 'wins');
    return wins;
  }
  
  static generateFallbackWins(reportData: any): WeeklyWin[] {
    const wins: WeeklyWin[] = [];
    const profile = reportData?.profile;
    
    if (profile?.followers_count && profile.followers_count > 100) {
      wins.push({
        type: 'growth_milestone',
        title: '🌟 Nice Following!',
        description: `You have ${profile.followers_count.toLocaleString()} followers - that's a solid foundation to build on!`,
        data: { followers: profile.followers_count },
        actionable_tip: "Focus on consistent posting to grow your engaged audience.",
        confidence_score: 0.7
      });
    }
    
    return wins;
  }
  
  static generateSmartInsights(reportData: any): SmartInsight[] {
    console.log('🧠 Generating insights from:', Object.keys(reportData));
    
    const insights: SmartInsight[] = [];
    const profile = reportData?.profile;
    
    // Timing insight (always include this)
    insights.push({
      id: `timing_${Date.now()}`,
      type: 'timing',
      title: 'Perfect Posting Window',
      description: 'Evening posts (7-9 PM) typically get the best engagement on Instagram',
      impact: 'high',
      effort: 'easy',
      data_source: 'posting_pattern_analysis',
      created_at: new Date().toISOString()
    });
    
    // Content type insight
    if (reportData?.contentAnalysis?.contentPatterns) {
      const patterns = reportData.contentAnalysis.contentPatterns;
      
      if (patterns.VIDEO && patterns.IMAGE) {
        const videoPerformance = patterns.VIDEO;
        const imagePerformance = patterns.IMAGE;
        
        if (videoPerformance > imagePerformance) {
          insights.push({
            id: `content_${Date.now()}`,
            type: 'content',
            title: 'Video Content is Your Secret Weapon',
            description: `Your video posts outperform images by ${Math.round(((videoPerformance / imagePerformance) - 1) * 100)}%. Create more Reels and video content!`,
            impact: 'medium',
            effort: 'medium',
            data_source: 'content_performance_analysis',
            created_at: new Date().toISOString()
          });
        }
      }
    }
    
    // Engagement insight
    if (profile?.engagement_rate) {
      const rate = profile.engagement_rate;
      let message = '';
      let impact: 'high' | 'medium' | 'low' = 'medium';
      
      if (rate > 6) {
        message = `Your ${rate.toFixed(2)}% engagement rate is excellent! Your audience is highly engaged.`;
        impact = 'high';
      } else if (rate > 3) {
        message = `Your ${rate.toFixed(2)}% engagement rate is good. Focus on building deeper connections with your audience.`;
        impact = 'medium';
      } else {
        message = `Your ${rate.toFixed(2)}% engagement rate has room for improvement. Try asking questions in your captions to boost interaction.`;
        impact = 'high';
      }
      
      insights.push({
        id: `engagement_${Date.now()}`,
        type: 'audience',
        title: 'Engagement Rate Analysis',
        description: message,
        impact,
        effort: 'easy',
        data_source: 'audience_behavior_analysis',
        created_at: new Date().toISOString()
      });
    }
    
    console.log('✅ Generated', insights.length, 'insights');
    return insights;
  }

  static generateWeeklyPerformance(currentReportData: any, previousReportData?: any): WeeklyPerformance | null {
    try {
      const currentMedia = currentReportData.media || [];
      const currentProfile = currentReportData.profile || {};
      
      // Calculate current week metrics
      const currentWeek = {
        likes: currentMedia.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0),
        comments: currentMedia.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0),
        posts: currentMedia.length,
        shares: currentMedia.reduce((sum: number, post: any) => sum + (post.shares_count || post.send_count || 0), 0),
        impressions: currentMedia.reduce((sum: number, post: any) => sum + (post.impressions_count || post.reach || 0), 0)
      };

      // Calculate previous week metrics (if available)
      let previousWeek = {
        likes: 0,
        comments: 0,
        posts: 0,
        shares: 0,
        impressions: 0
      };

      if (previousReportData) {
        const previousMedia = previousReportData.media || [];
        previousWeek = {
          likes: previousMedia.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0),
          comments: previousMedia.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0),
          posts: previousMedia.length,
          shares: previousMedia.reduce((sum: number, post: any) => sum + (post.shares_count || post.send_count || 0), 0),
          impressions: previousMedia.reduce((sum: number, post: any) => sum + (post.impressions_count || post.reach || 0), 0)
        };
      }

      // Calculate changes
      const changes = {
        likes: {
          value: currentWeek.likes - previousWeek.likes,
          percentage: previousWeek.likes > 0 ? ((currentWeek.likes - previousWeek.likes) / previousWeek.likes) * 100 : 0
        },
        comments: {
          value: currentWeek.comments - previousWeek.comments,
          percentage: previousWeek.comments > 0 ? ((currentWeek.comments - previousWeek.comments) / previousWeek.comments) * 100 : 0
        },
        posts: {
          value: currentWeek.posts - previousWeek.posts,
          percentage: previousWeek.posts > 0 ? ((currentWeek.posts - previousWeek.posts) / previousWeek.posts) * 100 : 0
        },
        shares: {
          value: currentWeek.shares - previousWeek.shares,
          percentage: previousWeek.shares > 0 ? ((currentWeek.shares - previousWeek.shares) / previousWeek.shares) * 100 : 0
        },
        impressions: {
          value: currentWeek.impressions - previousWeek.impressions,
          percentage: previousWeek.impressions > 0 ? ((currentWeek.impressions - previousWeek.impressions) / previousWeek.impressions) * 100 : 0
        }
      };

      // Find top performing post
      const topPost = currentMedia.length > 0 ? 
        currentMedia.reduce((best: any, current: any) => {
          const currentEngagement = (current.like_count || 0) + (current.comments_count || 0);
          const bestEngagement = (best.like_count || 0) + (best.comments_count || 0);
          return currentEngagement > bestEngagement ? current : best;
        }) : null;

      // Generate smart tip
      const smartTips = [
        {
          title: "Post consistently for better engagement",
          description: "Accounts that post 4-5 times per week see 23% higher engagement rates",
          confidence: "High"
        },
        {
          title: "Optimize your posting time",
          description: "Your audience is most active during evening hours (7-9 PM)",
          confidence: "Medium"
        },
        {
          title: "Use more carousel posts",
          description: "Carousel posts typically get 1.4x more engagement than single photos",
          confidence: "High"
        },
        {
          title: "Engage with your audience",
          description: "Responding to comments within 1 hour increases future engagement by 12%",
          confidence: "Medium"
        },
        {
          title: "Try video content",
          description: "Reels and video posts get 22% more engagement than photo posts",
          confidence: "High"
        },
        {
          title: "Use relevant hashtags",
          description: "Posts with 5-10 relevant hashtags perform better than those with more or fewer",
          confidence: "Medium"
        }
      ];

      const randomTip = smartTips[Math.floor(Math.random() * smartTips.length)];

      return {
        currentWeek,
        previousWeek,
        changes,
        topPost: topPost ? {
          type: topPost.media_type || 'post',
          engagements: (topPost.like_count || 0) + (topPost.comments_count || 0),
          caption: topPost.caption
        } : {
          type: 'post',
          engagements: 0,
          caption: 'No posts found'
        },
        smartTip: randomTip
      };
    } catch (error) {
      console.error('Error generating weekly performance:', error);
      return null;
    }
  }
  
  private static generatePostTip(post: any): string {
    const tips = [];
    
    if (post.media_type === 'video') {
      tips.push("Video content is performing great for you");
    }
    
    if (post.caption && post.caption.length > 100) {
      tips.push("Longer captions seem to resonate with your audience");
    }
    
    if (post.timestamp) {
      const hour = new Date(post.timestamp).getHours();
      if (hour >= 18 && hour <= 21) {
        tips.push("Evening posts (6-9 PM) work well for your audience");
      }
    }
    
    return tips.length > 0 
      ? `Try this again: ${tips.join(", ")}`
      : "This type of content resonates well with your audience - create more like this!";
  }
}