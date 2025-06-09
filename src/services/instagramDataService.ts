// File: src/services/instagramDataService.ts
// Instagram API service for your existing flat structure

import { createClient } from '../lib/supabaseServer';
import { createAdminClient } from '../lib/supabaseAdmin';

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS';
  media_count: number;
  followers_count: number;
  follows_count: number;
}

export interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  thumbnail_url?: string;
}

export interface InstagramInsights {
  reach?: number;
  impressions?: number;
  saves?: number;
  video_views?: number;
}

export class InstagramDataService {
  /**
   * Fetch user profile data from Instagram Basic Display API
   */
  async fetchProfileData(accessToken: string): Promise<InstagramProfile> {
    const fields = 'id,username,account_type,media_count,followers_count,follows_count';
    const response = await fetch(
      `https://graph.instagram.com/me?fields=${fields}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram API Error Response:', errorText);
      throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Instagram Profile Data:', data);
    return data;
  }

  /**
   * Fetch user's recent media from Instagram Basic Display API
   */
  async fetchRecentMedia(accessToken: string, limit: number = 25): Promise<InstagramPost[]> {
    const fields = 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count,thumbnail_url';
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram Media API Error:', errorText);
      throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📸 Fetched ${data.data?.length || 0} Instagram posts`);
    return data.data || [];
  }

  /**
   * Fetch insights for a specific post (Business accounts only)
   */
  async fetchPostInsights(postId: string, accessToken: string): Promise<InstagramInsights> {
    try {
      const metrics = 'reach,impressions,saves';
      const response = await fetch(
        `https://graph.instagram.com/${postId}/insights?metric=${metrics}&access_token=${accessToken}`
      );

      if (!response.ok) {
        console.warn(`Could not fetch insights for post ${postId}: ${response.status}`);
        return {};
      }

      const data = await response.json();
      const insights: InstagramInsights = {};

      data.data?.forEach((metric: any) => {
        insights[metric.name as keyof InstagramInsights] = metric.values[0]?.value || 0;
      });

      return insights;
    } catch (error) {
      console.warn(`Error fetching insights for post ${postId}:`, error);
      return {};
    }
  }

  /**
   * Save or update Instagram account in your existing table structure
   */
  async saveInstagramAccount(
    userId: string,
    profile: InstagramProfile,
    accessToken: string,
    refreshToken?: string
  ) {
    const supabase = await createClient();
    
    console.log('💾 Saving Instagram account for user:', userId);
    console.log('📊 Profile data:', profile);

    // Use your existing column names
    const upsertData: any = {
      user_id: userId,
      instagram_id: profile.id,
      instagram_handle: profile.username,
      username: profile.username, // New column we added
      access_token: accessToken,
      refresh_token: refreshToken,
      account_type: profile.account_type.toLowerCase(),
      is_active: true,
      last_sync_at: new Date().toISOString(),
    };

    // Set token expiration (Instagram tokens last 60 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    upsertData.token_expires_at = expiresAt.toISOString();

    const { data, error } = await supabase
      .from('instagram_accounts')
      .upsert(upsertData, {
        onConflict: 'user_id,instagram_id' // Adjust based on your constraints
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving Instagram account:', error);
      throw new Error(`Failed to save Instagram account: ${error.message}`);
    }

    console.log('✅ Instagram account saved:', data);
    return data;
  }

  /**
   * Create a daily snapshot of account data
   */
  async createDailySnapshot(instagramAccountId: string) {
    // Use admin client for all operations to bypass RLS
    const supabase = createAdminClient();
    
    console.log(`📸 Creating daily snapshot for account ${instagramAccountId}`);

    // Get Instagram account details
    const { data: account, error: accountError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('id', instagramAccountId)
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      throw new Error(`Instagram account not found: ${accountError?.message}`);
    }

    console.log('📱 Found account:', account.instagram_handle);

    // Log sync start
    const { data: syncLog } = await supabase
      .from('sync_logs')
      .insert({
        instagram_account_id: instagramAccountId,
        sync_type: 'full',
        status: 'started',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    try {
      // Fetch current profile data from Instagram API
      console.log('🔄 Fetching profile data from Instagram...');
      const profileData = await this.fetchProfileData(account.access_token);
      
      // Fetch recent media
      console.log('🔄 Fetching recent media from Instagram...');
      const recentMedia = await this.fetchRecentMedia(account.access_token);

      // Calculate engagement metrics from recent posts
      const engagementMetrics = this.calculateEngagementMetrics(recentMedia, profileData.followers_count);
      console.log('📊 Calculated engagement metrics:', engagementMetrics);

      // Create daily snapshot
      const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      const { error: snapshotError } = await supabase
        .from('daily_snapshots')
        .upsert({
          instagram_account_id: instagramAccountId,
          snapshot_date: snapshotDate,
          followers_count: profileData.followers_count,
          following_count: profileData.follows_count,
          media_count: profileData.media_count,
          total_likes: engagementMetrics.totalLikes,
          total_comments: engagementMetrics.totalComments,
          total_shares: 0, // Instagram Basic Display API doesn't provide shares
          total_saves: 0, // Will be updated with insights if available
          engagement_rate: engagementMetrics.engagementRate,
          avg_likes_per_post: engagementMetrics.avgLikes,
          avg_comments_per_post: engagementMetrics.avgComments,
          posts_published_count: this.calculateNewPostsToday(recentMedia),
          raw_profile_data: profileData,
        }, {
          onConflict: 'instagram_account_id,snapshot_date'
        });

      if (snapshotError) {
        console.error('❌ Error creating daily snapshot:', snapshotError);
        throw new Error(`Failed to create daily snapshot: ${snapshotError.message}`);
      }

      console.log('✅ Daily snapshot created successfully');

      // Save individual post snapshots
      await this.savePostSnapshots(instagramAccountId, recentMedia, account.access_token);

      // Update last sync time
      await supabase
        .from('instagram_accounts')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', instagramAccountId);

      // Log successful completion
      if (syncLog) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            records_processed: recentMedia.length + 1, // posts + profile
          })
          .eq('id', syncLog.id);
      }

      console.log(`✅ Daily snapshot completed for account ${instagramAccountId}`);
      return { 
        success: true, 
        postsProcessed: recentMedia.length,
        profileData: {
          followers: profileData.followers_count,
          following: profileData.follows_count,
          posts: profileData.media_count,
          engagement_rate: engagementMetrics.engagementRate
        }
      };

    } catch (error) {
      console.error(`❌ Error creating daily snapshot:`, error);

      // Log error
      if (syncLog) {
        await supabase
          .from('sync_logs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', syncLog.id);
      }

      throw error;
    }
  }

  /**
   * Save snapshots for individual posts
   */
  private async savePostSnapshots(
    instagramAccountId: string,
    posts: InstagramPost[],
    accessToken: string
  ) {
    const supabase = createAdminClient();
    const snapshotDate = new Date().toISOString().split('T')[0];
    console.log(`📝 Saving ${posts.length} post snapshots for date ${snapshotDate}`);

    for (const post of posts) {
      try {
        // Fetch insights if available (for business accounts)
        const insights = await this.fetchPostInsights(post.id, accessToken);

        const { error } = await supabase
          .from('post_snapshots')
          .upsert({
            instagram_account_id: instagramAccountId,
            instagram_post_id: post.id,
            snapshot_date: snapshotDate,
            post_type: post.media_type,
            caption: post.caption,
            permalink: post.permalink,
            media_url: post.media_url,
            thumbnail_url: post.thumbnail_url,
            published_at: post.timestamp,
            likes_count: post.like_count || 0,
            comments_count: post.comments_count || 0,
            reach: insights.reach || 0,
            impressions: insights.impressions || 0,
            saves_count: insights.saves || 0,
            raw_post_data: post,
            raw_insights_data: insights,
          }, {
            onConflict: 'instagram_account_id,instagram_post_id,snapshot_date'
          });

        if (error) {
          console.error(`Failed to save post snapshot for ${post.id}:`, error);
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
      }
    }

    console.log('✅ Post snapshots saved successfully');
  }

  /**
   * Calculate engagement metrics from recent posts
   */
  private calculateEngagementMetrics(posts: InstagramPost[], followersCount: number) {
    if (posts.length === 0) {
      return {
        totalLikes: 0,
        totalComments: 0,
        avgLikes: 0,
        avgComments: 0,
        engagementRate: 0
      };
    }

    const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    const avgLikes = totalLikes / posts.length;
    const avgComments = totalComments / posts.length;
    
    // Engagement rate = (total likes + total comments) / (posts count * followers) * 100
    const engagementRate = followersCount > 0 
      ? ((totalLikes + totalComments) / (posts.length * followersCount)) * 100 
      : 0;

    return {
      totalLikes,
      totalComments,
      avgLikes,
      avgComments,
      engagementRate: Math.round(engagementRate * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Calculate how many posts were published today
   */
  private calculateNewPostsToday(posts: InstagramPost[]): number {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter(post => {
      const postDate = new Date(post.timestamp).toISOString().split('T')[0];
      return postDate === today;
    }).length;
  }

  /**
   * Get all active Instagram accounts for daily sync
   * USES ADMIN CLIENT TO BYPASS RLS
   */
  async getActiveAccountsForSync() {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get active accounts: ${error.message}`);
    }

    console.log(`📊 Found ${data?.length || 0} active accounts for sync`);
    return data || [];
  }

  /**
   * Get historical snapshots for an account
   */
  async getHistoricalSnapshots(instagramAccountId: string, days: number = 30) {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('daily_snapshots')
      .select('*')
      .eq('instagram_account_id', instagramAccountId)
      .gte('snapshot_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get historical snapshots: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate growth analytics for different periods
   */
  async calculateGrowthAnalytics(instagramAccountId: string) {
    const snapshots = await this.getHistoricalSnapshots(instagramAccountId, 365); // Get last year
    
    if (snapshots.length < 2) {
      console.log('⚠️ Not enough historical data for growth analytics');
      return null; // Need at least 2 data points
    }

    const today = snapshots[0];
    const yesterday = snapshots[1];
    const weekAgo = snapshots.find((s: any) => 
      new Date(s.snapshot_date) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const monthAgo = snapshots.find((s: any) => 
      new Date(s.snapshot_date) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const calculateGrowthRate = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    console.log('📈 Calculating growth analytics with real historical data');

    return {
      daily: {
        followers_growth: today.followers_count - (yesterday?.followers_count || 0),
        followers_growth_rate: calculateGrowthRate(today.followers_count, yesterday?.followers_count || 0),
        posts_growth: today.media_count - (yesterday?.media_count || 0),
      },
      weekly: weekAgo ? {
        followers_growth: today.followers_count - weekAgo.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, weekAgo.followers_count),
        posts_growth: today.media_count - weekAgo.media_count,
      } : null,
      monthly: monthAgo ? {
        followers_growth: today.followers_count - monthAgo.followers_count,
        followers_growth_rate: calculateGrowthRate(today.followers_count, monthAgo.followers_count),
        posts_growth: today.media_count - monthAgo.media_count,
      } : null,
      isRealData: true,
      dataPoints: snapshots.length
    };
  }

  /**
   * Check if user has Instagram account connected (using your schema)
   */
  async getUserInstagramAccount(userId: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to get Instagram account: ${error.message}`);
    }

    return data;
  }

  /**
   * Get account by Instagram ID (using your column names)
   */
  async getAccountByInstagramId(instagramId: string) {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('instagram_id', instagramId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get Instagram account: ${error.message}`);
    }

    return data;
  }

  /**
   * Refresh Instagram access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const response = await fetch('https://graph.instagram.com/refresh_access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        expires_in: data.expires_in
      };
    } catch (error) {
      console.error('Error refreshing Instagram token:', error);
      throw error;
    }
  }

  /**
   * Update account token after refresh
   */
  async updateAccountToken(accountId: string, newAccessToken: string, expiresIn: number) {
    const supabase = createAdminClient();
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    const { error } = await supabase
      .from('instagram_accounts')
      .update({
        access_token: newAccessToken,
        token_expires_at: expiresAt.toISOString(),
        last_sync_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) {
      throw new Error(`Failed to update account token: ${error.message}`);
    }
  }
}