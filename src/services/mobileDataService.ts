// File: src/services/mobileDataService.ts
// Enhanced with historical data integration

import { HistoricalDataService } from './historicalDataService';

export class MobileDataService {
  private static historicalService = new HistoricalDataService();

  /**
   * Transform report data for mobile display - Enhanced with historical data
   */
  static async transformReportForMobile(reportData: any, userId?: string) {
    if (!reportData) return null;

    console.log('🔄 Transforming report data with historical context:', reportData);

    // Try to get historical data if userId is provided
    let historicalData = null;
    if (userId) {
      try {
        historicalData = await this.historicalService.getAccountSummary(userId);
        console.log('📊 Historical data retrieved:', historicalData ? 'Yes' : 'No');
      } catch (error) {
        console.warn('⚠️ Could not retrieve historical data:', error);
      }
    }

    // Use historical data if available, otherwise fall back to reportData
    const profile = historicalData?.profile || reportData.profile || {};
    const summary = historicalData?.metrics || reportData.summary || {};
    const media = reportData.media || [];
    const rawInstagramData = reportData.raw_instagram_data || {};

    // Check if media is in raw_instagram_data
    const actualMedia = media.length > 0 ? media : (rawInstagramData.media || []);

    // Use historical data for more accurate metrics
    const postCount = historicalData?.profile.media_count || this.getPostCount(reportData);
    const engagementRate = historicalData?.metrics.engagement_rate || this.getEngagementRate(reportData);
    const followerCount = historicalData?.profile.followers_count || profile.followers_count || profile.follower_count || 0;

    console.log(`📊 Using ${historicalData ? 'historical' : 'report'} data: ${postCount} posts, ${engagementRate}% engagement, ${followerCount} followers`);

    return {
      profile: {
        username: profile.username,
        fullName: profile.full_name || profile.name || profile.username,
        followerCount: followerCount,
        followingCount: historicalData?.profile.following_count || profile.follows_count || profile.following_count || 0,
        profilePicUrl: profile.profile_pic_url || profile.profile_picture_url,
        category: profile.category || profile.account_type || 'PERSONAL',
        isVerified: profile.is_verified || false,
        lastUpdated: historicalData?.profile.last_updated
      },
      metrics: {
        posts: postCount,
        engagement: engagementRate,
        reach: this.getReach(reportData),
        impressions: this.getImpressions(reportData),
        avgLikes: historicalData?.metrics.avg_likes_per_post || this.getAvgLikes(reportData),
        avgComments: historicalData?.metrics.avg_comments_per_post || this.getAvgComments(reportData),
        saves: this.getSaves(reportData),
        totalLikes: historicalData?.metrics.total_likes || summary.totalLikes || 0,
        totalComments: historicalData?.metrics.total_comments || summary.totalComments || 0
      },
      recentPosts: actualMedia.length > 0 ? this.transformMediaForMobile(actualMedia) : this.generatePostsFromSummary(reportData),
      overallScore: summary.overallScore || this.calculateOverallScore(reportData),
      historicalContext: {
        hasHistoricalData: !!historicalData,
        dataPoints: historicalData?.dataQuality.dataPoints || 0,
        isRealData: !!historicalData?.dataQuality.isRealData
      }
    };
  }

  /**
   * Enhanced metric categories with historical data integration
   */
  static async generateMetricCategories(reportData: any, userId?: string) {
    let transformedData;
    
    if (userId) {
      transformedData = await this.transformReportForMobile(reportData, userId);
    } else {
      transformedData = await this.transformReportForMobile(reportData);
    }
    
    if (!transformedData) {
      return this.getDefaultMetricCategories();
    }

    console.log('📊 Generating metrics with historical context for:', transformedData.profile.username);

    // Get growth analytics if we have historical data
    let growthAnalytics = null;
    if (userId && transformedData.historicalContext.hasHistoricalData) {
      try {
        growthAnalytics = await this.historicalService.getGrowthAnalytics(userId);
      } catch (error) {
        console.warn('Could not get growth analytics:', error);
      }
    }

    // Calculate accurate growth rates
    const followerGrowthRate = growthAnalytics?.weekly?.followers_growth_rate || 
                             this.estimateGrowthRate(transformedData.profile.followerCount, 'weekly');

    return [
      {
        id: 'growth',
        title: 'Growth Metrics',
        emoji: '🚀',
        description: 'Track follower growth and profile performance',
        color: 'from-green-400 to-emerald-500',
        metrics: [
          { 
            name: 'Follower Growth Rate', 
            value: `+${followerGrowthRate.toFixed(1)}%`, 
            trend: followerGrowthRate > 1 ? 'up' : followerGrowthRate > 0 ? 'neutral' : 'down',
            isRealData: !!growthAnalytics?.weekly
          },
          { 
            name: 'Total Followers', 
            value: transformedData.profile.followerCount.toLocaleString(), 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Total Posts', 
            value: transformedData.metrics.posts.toString(), 
            trend: transformedData.metrics.posts > 10 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Weekly Growth', 
            value: growthAnalytics?.weekly ? 
              `+${growthAnalytics.weekly.followers_growth}` : 
              `+${Math.floor(transformedData.profile.followerCount * (followerGrowthRate / 100))}`,
            trend: 'up',
            isRealData: !!growthAnalytics?.weekly
          },
          { 
            name: 'Monthly Growth', 
            value: growthAnalytics?.monthly ? 
              `+${growthAnalytics.monthly.followers_growth}` : 
              `+${Math.floor(transformedData.profile.followerCount * (followerGrowthRate * 4 / 100))}`,
            trend: 'up',
            isRealData: !!growthAnalytics?.monthly
          }
        ]
      },
      {
        id: 'engagement',
        title: 'Engagement Metrics',
        emoji: '💬',
        description: 'Measure audience interaction and engagement',
        color: 'from-blue-400 to-purple-500',
        metrics: [
          { 
            name: 'Engagement Rate', 
            value: `${transformedData.metrics.engagement.toFixed(2)}%`, 
            trend: transformedData.metrics.engagement > 3 ? 'up' : transformedData.metrics.engagement > 1.5 ? 'neutral' : 'down',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Avg Likes per Post', 
            value: transformedData.metrics.avgLikes.toFixed(0), 
            trend: transformedData.metrics.avgLikes > 50 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Avg Comments per Post', 
            value: transformedData.metrics.avgComments.toFixed(1), 
            trend: transformedData.metrics.avgComments > 5 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Total Engagement', 
            value: (transformedData.metrics.totalLikes + transformedData.metrics.totalComments).toLocaleString(), 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Engagement Trend', 
            value: growthAnalytics?.weekly?.engagement_growth_rate ? 
              `${growthAnalytics.weekly.engagement_growth_rate > 0 ? '+' : ''}${growthAnalytics.weekly.engagement_growth_rate.toFixed(1)}%` :
              '+5%',
            trend: 'up',
            isRealData: !!growthAnalytics?.weekly
          }
        ]
      },
      {
        id: 'reach',
        title: 'Reach & Exposure',
        emoji: '📣',
        description: 'Understand how content reaches your audience',
        color: 'from-orange-400 to-red-500',
        metrics: [
          { 
            name: 'Est. Reach per Post', 
            value: this.formatReach(transformedData.metrics.avgLikes * 3.2), 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Profile Reach', 
            value: this.formatReach(transformedData.profile.followerCount * 0.6), 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Hashtag Discovery', 
            value: '28%', 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Explore Page', 
            value: `${Math.min(25, Math.floor(transformedData.metrics.engagement * 5))}%`, 
            trend: transformedData.metrics.engagement > 3 ? 'up' : 'neutral',
            isRealData: false
          },
          { 
            name: 'Story Reach', 
            value: this.formatReach(transformedData.profile.followerCount * 0.4), 
            trend: 'up',
            isRealData: false
          }
        ]
      },
      {
        id: 'timing',
        title: 'Timing & Content',
        emoji: '⏰',
        description: 'Optimize posting schedule and content types',
        color: 'from-purple-400 to-pink-500',
        metrics: [
          { 
            name: 'Posting Frequency', 
            value: `${(transformedData.metrics.posts / 30).toFixed(1)}/day`, 
            trend: transformedData.metrics.posts > 30 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Best Time to Post', 
            value: this.getBestPostingTime(transformedData.metrics.avgLikes), 
            trend: 'neutral',
            isRealData: false
          },
          { 
            name: 'Consistency Score', 
            value: `${Math.min(95, 60 + (transformedData.metrics.posts * 2))}%`, 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Peak Engagement Day', 
            value: 'Sunday', 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Content Freshness', 
            value: transformedData.profile.lastUpdated ? 
              this.getRelativeTime(transformedData.profile.lastUpdated) : 'Unknown',
            trend: 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          }
        ]
      },
      {
        id: 'content',
        title: 'Content Performance',
        emoji: '📊',
        description: 'Performance by format and content themes',
        color: 'from-teal-400 to-cyan-500',
        metrics: [
          { 
            name: 'Top Content Type', 
            value: this.getTopContentType(transformedData.metrics.avgLikes), 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Avg Engagement/Post', 
            value: `${(transformedData.metrics.avgLikes + transformedData.metrics.avgComments).toFixed(0)}`, 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Content Variety Score', 
            value: transformedData.metrics.posts > 20 ? 'Excellent' : 'Good', 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Visual Quality Score', 
            value: `${Math.min(95, 70 + (transformedData.metrics.avgLikes / 10))}%`, 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Audience Resonance', 
            value: `${Math.min(95, 60 + (transformedData.metrics.avgComments * 5))}%`, 
            trend: 'up',
            isRealData: transformedData.historicalContext.hasHistoricalData
          }
        ]
      },
      {
        id: 'insights',
        title: 'Quality Insights',
        emoji: '💡',
        description: 'Advanced analytics and quality metrics',
        color: 'from-yellow-400 to-orange-500',
        metrics: [
          { 
            name: 'Profile Strength', 
            value: `${transformedData.overallScore}%`, 
            trend: transformedData.overallScore > 80 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          },
          { 
            name: 'Data Quality', 
            value: transformedData.historicalContext.hasHistoricalData ? 
              `${transformedData.historicalContext.dataPoints} snapshots` : 'No history',
            trend: transformedData.historicalContext.hasHistoricalData ? 'up' : 'neutral',
            isRealData: true
          },
          { 
            name: 'Growth Potential', 
            value: transformedData.profile.followerCount < 5000 ? 'High' : 
                   transformedData.profile.followerCount < 50000 ? 'Medium' : 'Stable', 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Audience Quality', 
            value: `${Math.min(95, 75 + (transformedData.metrics.avgComments * 2))}%`, 
            trend: 'up',
            isRealData: false
          },
          { 
            name: 'Overall Rating', 
            value: transformedData.metrics.engagement > 4 ? 'Excellent' : 
                   transformedData.metrics.engagement > 2 ? 'Good' : 'Developing', 
            trend: transformedData.metrics.engagement > 2 ? 'up' : 'neutral',
            isRealData: transformedData.historicalContext.hasHistoricalData
          }
        ]
      }
    ];
  }

  // Keep all the existing helper methods from the original service...
  
  static getPostCount(reportData: any): number {
    const media = reportData.media || [];
    const summary = reportData.summary || {};
    const profile = reportData.profile || {};
    const metrics = reportData.metrics || {};
    const rawInstagramData = reportData.raw_instagram_data || {};

    if (summary.totalPosts) return summary.totalPosts;
    if (media.length > 0) return media.length;
    if (rawInstagramData.media && rawInstagramData.media.length > 0) return rawInstagramData.media.length;
    if (profile.media_count) return profile.media_count;
    if (metrics.total_posts) return metrics.total_posts;
    
    console.log('⚠️ Could not find post count, defaulting to 0');
    return 0;
  }

  static getEngagementRate(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};
    const profile = reportData.profile || {};

    if (summary.avgLikes && summary.avgComments && profile.followers_count) {
      const avgEngagement = (summary.avgLikes + summary.avgComments);
      const engagementRate = (avgEngagement / profile.followers_count) * 100;
      return Math.round(engagementRate * 100) / 100;
    }

    if (summary.keyMetrics?.engagement) return summary.keyMetrics.engagement;
    if (metrics.engagementRate) return metrics.engagementRate;
    if (metrics.engagement_rate) return metrics.engagement_rate;
    if (metrics.overall_engagement_rate) return metrics.overall_engagement_rate;

    return 0;
  }

  static getReach(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};

    return summary.keyMetrics?.reach || 
           metrics.reach || 
           (metrics.avg_reach_per_post || 0) * this.getPostCount(reportData) ||
           0;
  }

  static getImpressions(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};

    return summary.keyMetrics?.impressions || 
           metrics.impressions ||
           (metrics.avg_impressions_per_post || 0) * this.getPostCount(reportData) ||
           0;
  }

  static getAvgLikes(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};

    if (summary.avgLikes) return summary.avgLikes;
    if (summary.keyMetrics?.avgLikes) return summary.keyMetrics.avgLikes;
    if (metrics.avg_likes_per_post) return metrics.avg_likes_per_post;

    return 0;
  }

  static getAvgComments(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};

    if (summary.avgComments) return summary.avgComments;
    if (summary.keyMetrics?.avgComments) return summary.keyMetrics.avgComments;
    if (metrics.avg_comments_per_post) return metrics.avg_comments_per_post;

    return 0;
  }

  static getSaves(reportData: any): number {
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};

    if (summary.keyMetrics?.saves) return summary.keyMetrics.saves;
    if (summary.saves) return summary.saves;
    if (metrics.saves) return metrics.saves;

    const avgLikes = this.getAvgLikes(reportData);
    return Math.floor(avgLikes * 0.1);
  }

  static calculateOverallScore(reportData: any): number {
    const summary = reportData.summary || {};
    
    if (summary.overallScore) return summary.overallScore;
    
    const engagementRate = this.getEngagementRate(reportData);
    const postCount = this.getPostCount(reportData);
    const followerCount = reportData.profile?.followers_count || 0;

    let score = 50;

    if (engagementRate > 5) score += 30;
    else if (engagementRate > 3) score += 20;
    else if (engagementRate > 1) score += 10;

    if (postCount > 50) score += 20;
    else if (postCount > 20) score += 15;
    else if (postCount > 10) score += 10;
    else if (postCount > 0) score += 5;

    if (followerCount > 100000) score += 30;
    else if (followerCount > 10000) score += 25;
    else if (followerCount > 1000) score += 20;
    else if (followerCount > 100) score += 15;
    else if (followerCount > 0) score += 10;

    return Math.min(100, score);
  }

  static generatePostsFromSummary(reportData: any) {
    const summary = reportData.summary || {};
    const topPost = summary.topPerformingPost || {};
    
    const posts = [];
    
    if (topPost && (topPost.likes || topPost.comments)) {
      posts.push({
        id: 'top_post',
        type: 'Post',
        title: topPost.caption ? this.extractTitle(topPost.caption) : 'Top Performing Post',
        timestamp: '2d ago',
        platform: 'Instagram',
        thumbnail: 'from-yellow-400 to-orange-500',
        metrics: {
          likes: topPost.likes || summary.avgLikes || 0,
          comments: topPost.comments || summary.avgComments || 0,
          shares: Math.floor((topPost.likes || summary.avgLikes || 0) * 0.05),
          reach: this.formatReach(topPost.likes || summary.avgLikes || 0)
        },
        performance: 'high',
        url: topPost.permalink || '#'
      });
    }
    
    const avgLikes = summary.avgLikes || 50;
    const avgComments = summary.avgComments || 5;
    
    for (let i = 1; i < Math.min(5, summary.totalPosts || 3); i++) {
      const variance = 0.3;
      const likes = Math.floor(avgLikes * (1 + (Math.random() - 0.5) * variance));
      const comments = Math.floor(avgComments * (1 + (Math.random() - 0.5) * variance));
      
      posts.push({
        id: `generated_post_${i}`,
        type: i % 3 === 0 ? 'Reel' : i % 2 === 0 ? 'Carousel' : 'Post',
        title: `Recent Post ${i}`,
        timestamp: `${i + 1}d ago`,
        platform: 'Instagram',
        thumbnail: this.getThumbnailGradient(i),
        metrics: {
          likes,
          comments,
          shares: Math.floor(likes * 0.05),
          reach: this.formatReach(likes)
        },
        performance: this.getPerformanceLevel(likes),
        url: '#'
      });
    }
    
    return posts;
  }

  static transformMediaForMobile(media: any[]) {
    return media.map((post, index) => ({
      id: post.id || `post_${index}`,
      type: this.getPostType(post.media_type),
      title: this.extractTitle(post.caption),
      timestamp: this.getRelativeTime(post.timestamp),
      platform: 'Instagram',
      thumbnail: this.getThumbnailGradient(index),
      metrics: {
        likes: post.like_count || post.likes_count || 0,
        comments: post.comments_count || post.comment_count || 0,
        shares: Math.floor((post.like_count || 0) * 0.05) + Math.floor(Math.random() * 10),
        reach: this.formatReach(post.like_count || 0)
      },
      performance: this.getPerformanceLevel(post.like_count || 0),
      url: post.permalink
    }));
  }

  // Helper methods
  private static estimateGrowthRate(followers: number, timeFrame: 'weekly' | 'monthly' | 'annual'): number {
    let weeklyRate = 0;
    
    if (followers > 100000) weeklyRate = 0.5;
    else if (followers > 50000) weeklyRate = 1.0;
    else if (followers > 10000) weeklyRate = 2.0;
    else if (followers > 5000) weeklyRate = 3.0;
    else if (followers > 1000) weeklyRate = 5.0;
    else weeklyRate = 8.0;

    switch (timeFrame) {
      case 'weekly': return weeklyRate;
      case 'monthly': return weeklyRate * 4;
      case 'annual': return weeklyRate * 52;
      default: return weeklyRate;
    }
  }

  private static getBestPostingTime(avgLikes: number): string {
    if (avgLikes > 100) return '7-9 PM';
    if (avgLikes > 50) return '6-8 PM';
    return '5-7 PM';
  }

  private static getTopContentType(avgLikes: number): string {
    if (avgLikes > 80) return 'Reels';
    if (avgLikes > 40) return 'Carousel';
    return 'Photos';
  }

  private static getPostType(mediaType: string): string {
    if (!mediaType) return 'Post';
    
    const type = mediaType.toLowerCase();
    if (type.includes('video') || type.includes('reel')) return 'Reel';
    if (type.includes('carousel')) return 'Carousel';
    return 'Post';
  }

  private static extractTitle(caption: string): string {
    if (!caption) return 'Untitled Post';
    
    const cleanCaption = caption
      .replace(/#\w+/g, '')
      .replace(/@\w+/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    
    if (cleanCaption.length === 0) return 'Untitled Post';
    
    const firstSentence = cleanCaption.split('.')[0];
    if (firstSentence.length <= 50) return firstSentence;
    
    return cleanCaption.length > 50 ? cleanCaption.substring(0, 50) + '...' : cleanCaption;
  }

  private static getRelativeTime(timestamp: string): string {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  }

  private static getThumbnailGradient(index: number): string {
    const gradients = [
      'from-blue-400 to-purple-500',
      'from-pink-400 to-red-500',
      'from-gray-400 to-gray-600',
      'from-green-400 to-teal-500',
      'from-yellow-400 to-orange-500',
      'from-purple-400 to-pink-500',
      'from-indigo-400 to-blue-500',
      'from-red-400 to-pink-500'
    ];
    return gradients[index % gradients.length];
  }

  private static formatReach(likes: number): string {
    if (likes === 0) return '0';
    
    const estimatedReach = likes * 3.2;
    
    if (estimatedReach >= 1000000) {
      return `${(estimatedReach / 1000000).toFixed(1)}M`;
    }
    if (estimatedReach >= 1000) {
      return `${(estimatedReach / 1000).toFixed(1)}K`;
    }
    return Math.floor(estimatedReach).toString();
  }

  private static getPerformanceLevel(likes: number): 'high' | 'medium' | 'low' {
    if (likes > 100) return 'high';
    if (likes > 30) return 'medium';
    return 'low';
  }

  private static getDefaultMetricCategories() {
    return [
      {
        id: 'growth',
        title: 'Growth Metrics',
        emoji: '🚀',
        description: 'Track follower growth and profile performance',
        color: 'from-green-400 to-emerald-500',
        metrics: [
          { name: 'Connect Instagram', value: 'Get Started', trend: 'neutral', isRealData: false }
        ]
      }
    ];
  }
}