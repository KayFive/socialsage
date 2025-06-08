// File: src/services/historicalDataService.ts
// Historical data service for your flat structure

import { createClient } from '../lib/supabaseServer';

export interface HistoricalSnapshot {
  id: string;
  snapshot_date: string;
  followers_count: number;
  following_count: number;
  media_count: number;
  total_likes: number;
  total_comments: number;
  engagement_rate: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  posts_published_count: number;
}

export interface GrowthAnalytics {
  period: 'daily' | 'weekly' | 'monthly' | 'annual';
  followers_growth: number;
  followers_growth_rate: number;
  posts_growth: number;
  engagement_growth_rate: number;
  period_start_date: string;
  period_end_date: string;
}

export interface PostSnapshot {
  id: string;
  instagram_post_id: string;
  snapshot_date: string;
  post_type: string;
  caption: string;
  permalink: string;
  likes_count: number;
  comments_count: number;
  reach: number;
  impressions: number;
  published_at: string;
}

export class HistoricalDataService {
  /**
   * Get historical snapshots for a user's Instagram account (using your schema)
   */
  async getHistoricalSnapshots(
    userId: string, 
    days: number = 30
  ): Promise<HistoricalSnapshot[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select(`
        *,
        instagram_accounts!inner(user_id)
      `)
      .eq('instagram_accounts.user_id', userId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get historical snapshots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get growth analytics for different time periods
   */
  async getGrowthAnalytics(userId: string): Promise<{
    daily: GrowthAnalytics | null;
    weekly: GrowthAnalytics | null;
    monthly: GrowthAnalytics | null;
    annual: GrowthAnalytics | null;
    isRealData: boolean;
  }> {
    const snapshots = await this.getHistoricalSnapshots(userId, 365);
    
    if (snapshots.length < 2) {
      return {
        daily: null,
        weekly: null,
        monthly: null,
        annual: null,
        isRealData: false
      };
    }

    const today = snapshots[0];
    const yesterday = snapshots[1];
    
    // Find snapshots for different periods
    const weekAgo = this.findSnapshotByDaysAgo(snapshots, 7);
    const monthAgo = this.findSnapshotByDaysAgo(snapshots, 30);
    const yearAgo = this.findSnapshotByDaysAgo(snapshots, 365);

    const calculateGrowthRate = (current: number, previous: number): number => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const calculateEngagementGrowthRate = (
      currentEngagement: number, 
      previousEngagement: number
    ): number => {
      if (previousEngagement === 0) return 0;
      return ((currentEngagement - previousEngagement) / previousEngagement) * 100;
    };

    return {
      daily: yesterday ? {
        period: 'daily',
        followers_growth: today.followers_count - yesterday.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, yesterday.followers_count),
        posts_growth: today.media_count - yesterday.media_count,
        engagement_growth_rate: calculateEngagementGrowthRate(
          today.engagement_rate, 
          yesterday.engagement_rate
        ),
        period_start_date: yesterday.snapshot_date,
        period_end_date: today.snapshot_date,
      } : null,

      weekly: weekAgo ? {
        period: 'weekly',
        followers_growth: today.followers_count - weekAgo.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, weekAgo.followers_count),
        posts_growth: today.media_count - weekAgo.media_count,
        engagement_growth_rate: calculateEngagementGrowthRate(
          today.engagement_rate, 
          weekAgo.engagement_rate
        ),
        period_start_date: weekAgo.snapshot_date,
        period_end_date: today.snapshot_date,
      } : null,

      monthly: monthAgo ? {
        period: 'monthly',
        followers_growth: today.followers_count - monthAgo.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, monthAgo.followers_count),
        posts_growth: today.media_count - monthAgo.media_count,
        engagement_growth_rate: calculateEngagementGrowthRate(
          today.engagement_rate, 
          monthAgo.engagement_rate
        ),
        period_start_date: monthAgo.snapshot_date,
        period_end_date: today.snapshot_date,
      } : null,

      annual: yearAgo ? {
        period: 'annual',
        followers_growth: today.followers_count - yearAgo.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, yearAgo.followers_count),
        posts_growth: today.media_count - yearAgo.media_count,
        engagement_growth_rate: calculateEngagementGrowthRate(
          today.engagement_rate, 
          yearAgo.engagement_rate
        ),
        period_start_date: yearAgo.snapshot_date,
        period_end_date: today.snapshot_date,
      } : null,

      isRealData: true
    };
  }

  /**
   * Get post performance history
   */
  async getPostHistory(userId: string, days: number = 30): Promise<PostSnapshot[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('post_snapshots')
      .select(`
        *,
        instagram_accounts!inner(user_id)
      `)
      .eq('instagram_accounts.user_id', userId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get post history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get engagement trends over time
   */
  async getEngagementTrends(userId: string, days: number = 30) {
    const snapshots = await this.getHistoricalSnapshots(userId, days);
    
    return snapshots.map(snapshot => ({
      date: snapshot.snapshot_date,
      engagement_rate: snapshot.engagement_rate,
      avg_likes: snapshot.avg_likes_per_post,
      avg_comments: snapshot.avg_comments_per_post,
      followers_count: snapshot.followers_count,
      posts_count: snapshot.media_count
    }));
  }

  /**
   * Get follower growth chart data
   */
  async getFollowerGrowthChart(userId: string, days: number = 30) {
    const snapshots = await this.getHistoricalSnapshots(userId, days);
    
    return snapshots.reverse().map((snapshot, index) => ({
      date: snapshot.snapshot_date,
      followers: snapshot.followers_count,
      growth: index > 0 ? 
        snapshot.followers_count - snapshots[index - 1].followers_count : 0,
      posts: snapshot.media_count
    }));
  }

  /**
   * Get top performing posts from history
   */
  async getTopPerformingPosts(userId: string, limit: number = 10) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('post_snapshots')
      .select(`
        *,
        instagram_accounts!inner(user_id)
      `)
      .eq('instagram_accounts.user_id', userId)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get top performing posts: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get comprehensive account summary with historical context
   */
  async getAccountSummary(userId: string) {
    const [
      latestSnapshot,
      growthAnalytics,
      topPosts,
      engagementTrends
    ] = await Promise.all([
      this.getHistoricalSnapshots(userId, 1),
      this.getGrowthAnalytics(userId),
      this.getTopPerformingPosts(userId, 5),
      this.getEngagementTrends(userId, 7)
    ]);

    const latest = latestSnapshot[0];
    
    if (!latest) {
      return null;
    }

    return {
      profile: {
        followers_count: latest.followers_count,
        following_count: latest.following_count,
        media_count: latest.media_count,
        last_updated: latest.snapshot_date
      },
      metrics: {
        engagement_rate: latest.engagement_rate,
        avg_likes_per_post: latest.avg_likes_per_post,
        avg_comments_per_post: latest.avg_comments_per_post,
        total_likes: latest.total_likes,
        total_comments: latest.total_comments
      },
      growth: growthAnalytics,
      topPosts,
      trends: engagementTrends,
      dataQuality: {
        hasHistoricalData: latestSnapshot.length > 1,
        dataPoints: latestSnapshot.length,
        isRealData: true
      }
    };
  }

  /**
   * Helper function to find snapshot by days ago
   */
  private findSnapshotByDaysAgo(
    snapshots: HistoricalSnapshot[], 
    daysAgo: number
  ): HistoricalSnapshot | undefined {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const targetDateString = targetDate.toISOString().split('T')[0];
    
    // Find the closest snapshot to the target date
    return snapshots.find(snapshot => {
      const snapshotDate = new Date(snapshot.snapshot_date);
      const targetDateObj = new Date(targetDateString);
      return snapshotDate <= targetDateObj;
    });
  }

  /**
   * Get user's Instagram account info (using your schema)
   */
  async getUserInstagramAccount(userId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Failed to get Instagram account: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if user has sufficient historical data
   */
  async hasHistoricalData(userId: string): Promise<boolean> {
    const snapshots = await this.getHistoricalSnapshots(userId, 7);
    return snapshots.length > 1;
  }

  /**
   * Get latest sync information for a user
   */
  async getLatestSyncInfo(userId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('sync_logs')
      .select(`
        *,
        instagram_accounts!inner(user_id)
      `)
      .eq('instagram_accounts.user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get sync info: ${error.message}`);
    }

    return data;
  }

  /**
   * Get sync history for monitoring
   */
  async getSyncHistory(userId: string, limit: number = 10) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('sync_logs')
      .select(`
        *,
        instagram_accounts!inner(user_id, instagram_handle)
      `)
      .eq('instagram_accounts.user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get sync history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get account statistics summary
   */
  async getAccountStats(userId: string) {
    const account = await this.getUserInstagramAccount(userId);
    if (!account) return null;

    const [snapshots, posts, syncLogs] = await Promise.all([
      this.getHistoricalSnapshots(userId, 30),
      this.getPostHistory(userId, 30),
      this.getSyncHistory(userId, 5)
    ]);

    const latestSnapshot = snapshots[0];
    const oldestSnapshot = snapshots[snapshots.length - 1];

    return {
      account: {
        instagram_handle: account.instagram_handle,
        instagram_id: account.instagram_id,
        account_type: account.account_type,
        last_sync_at: account.last_sync_at,
        is_active: account.is_active
      },
      snapshots: {
        total: snapshots.length,
        latest: latestSnapshot,
        oldest: oldestSnapshot,
        date_range: snapshots.length > 1 ? {
          start: oldestSnapshot?.snapshot_date,
          end: latestSnapshot?.snapshot_date
        } : null
      },
      posts: {
        total_tracked: posts.length,
        unique_posts: Array.from(new Set(posts.map(p => p.instagram_post_id))).length
      },
      sync: {
        total_syncs: syncLogs.length,
        latest_sync: syncLogs[0],
        success_rate: syncLogs.length > 0 ? 
          (syncLogs.filter(log => log.status === 'completed').length / syncLogs.length) * 100 : 0
      }
    };
  }

  /**
   * Calculate growth velocity (rate of change in growth)
   */
  async getGrowthVelocity(userId: string) {
    try {
      const trends = await this.getEngagementTrends(userId, 14);
      
      if (trends.length < 7) {
        return { velocity: 0, trend: 'insufficient_data' };
      }

      // Calculate week-over-week change in follower growth
      const firstWeek = trends.slice(0, 7);
      const secondWeek = trends.slice(7, 14);

      const firstWeekAvgGrowth = firstWeek.reduce((sum, day, index) => {
        if (index === 0) return 0;
        return sum + (day.followers_count - firstWeek[index - 1].followers_count);
      }, 0) / 6;

      const secondWeekAvgGrowth = secondWeek.reduce((sum, day, index) => {
        if (index === 0) return 0;
        return sum + (day.followers_count - secondWeek[index - 1].followers_count);
      }, 0) / 6;

      const velocity = firstWeekAvgGrowth - secondWeekAvgGrowth;
      const trend = velocity > 0 ? 'accelerating' : velocity < 0 ? 'decelerating' : 'stable';

      return { velocity, trend };
    } catch (error) {
      console.error('Error calculating growth velocity:', error);
      return { velocity: 0, trend: 'error' };
    }
  }

  /**
   * Get content performance analysis
   */
  async getContentPerformanceAnalysis(userId: string) {
    const posts = await this.getPostHistory(userId, 30);
    
    if (posts.length === 0) {
      return null;
    }

    const postTypes = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'];
    const analysis = postTypes.map(type => {
      const typePosts = posts.filter(p => p.post_type === type);
      if (typePosts.length === 0) return null;

      const avgLikes = typePosts.reduce((sum, p) => sum + p.likes_count, 0) / typePosts.length;
      const avgComments = typePosts.reduce((sum, p) => sum + p.comments_count, 0) / typePosts.length;
      const totalEngagement = avgLikes + avgComments;

      return {
        type,
        count: typePosts.length,
        avg_likes: Math.round(avgLikes),
        avg_comments: Math.round(avgComments),
        total_engagement: Math.round(totalEngagement),
        best_post: typePosts.reduce((best, current) => 
          (current.likes_count + current.comments_count) > (best.likes_count + best.comments_count) ? current : best
        )
      };
    }).filter(Boolean);

    return analysis;
  }

  /**
   * Get engagement rate trends over time
   */
  async getEngagementRateTrends(userId: string, days: number = 30) {
    const snapshots = await this.getHistoricalSnapshots(userId, days);
    
    return snapshots.reverse().map((snapshot, index) => {
      const previousSnapshot = index > 0 ? snapshots[index - 1] : null;
      const rateChange = previousSnapshot ? 
        snapshot.engagement_rate - previousSnapshot.engagement_rate : 0;

      return {
        date: snapshot.snapshot_date,
        engagement_rate: snapshot.engagement_rate,
        rate_change: rateChange,
        followers_count: snapshot.followers_count,
        posts_count: snapshot.media_count
      };
    });
  }

  /**
   * Get posting frequency analysis
   */
  async getPostingFrequencyAnalysis(userId: string, days: number = 30) {
    const snapshots = await this.getHistoricalSnapshots(userId, days);
    
    if (snapshots.length < 2) return null;

    const dailyPostCounts = snapshots.map(snapshot => ({
      date: snapshot.snapshot_date,
      posts_published: snapshot.posts_published_count
    }));

    const totalPosts = dailyPostCounts.reduce((sum, day) => sum + day.posts_published, 0);
    const avgPostsPerDay = totalPosts / days;
    const mostActiveDay = dailyPostCounts.reduce((max, day) => 
      day.posts_published > max.posts_published ? day : max
    );

    return {
      total_posts: totalPosts,
      avg_posts_per_day: Math.round(avgPostsPerDay * 100) / 100,
      most_active_day: mostActiveDay,
      posting_consistency: this.calculatePostingConsistency(dailyPostCounts)
    };
  }

  /**
   * Calculate posting consistency score
   */
  private calculatePostingConsistency(dailyPostCounts: any[]) {
    if (dailyPostCounts.length === 0) return 0;

    const posts = dailyPostCounts.map(d => d.posts_published);
    const avg = posts.reduce((sum, count) => sum + count, 0) / posts.length;
    const variance = posts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / posts.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher consistency
    // Convert to 0-100 scale where 100 = perfect consistency
    const consistencyScore = Math.max(0, 100 - (standardDeviation * 20));
    return Math.round(consistencyScore);
  }
}