// src/services/instagramApiService.ts
// Real Instagram Business API Integration for Social Sage
// Updated to match existing type definitions

import { InstagramDataPackage, InstagramProfile, InstagramMedia } from '@/types/instagram.types';

// Flag to control whether we use mock data or real API
// Set this to false when you're ready to use real Instagram API
const USE_MOCK_DATA = false; // Changed from true to false

interface InstagramTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class InstagramApiService {
  private baseUrl = 'https://graph.instagram.com/v18.0';
  private oauthUrl = 'https://api.instagram.com/oauth';
  
  constructor(
    private clientId: string = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID!,
    private clientSecret: string = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_SECRET!,
    private redirectUri: string = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/instagram/callback`
  ) {}

  /**
   * Step 1: Generate Instagram OAuth URL
   */
  getAuthUrl(): string {
    // DEBUG: Log all the values to see what's being used
    console.log('🔍 DEBUG OAuth Setup:');
    console.log('   NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI:', process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI);
    console.log('   NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('   window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'undefined (server side)');
    console.log('   Final redirectUri being used:', this.redirectUri);
    console.log('   Client ID:', this.clientId);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'instagram_business_basic,instagram_business_manage_insights',
      response_type: 'code',
      state: this.generateState(),
    });

    const authUrl = `${this.oauthUrl}/authorize?${params.toString()}`;
    console.log('   Complete OAuth URL:', authUrl);

    return authUrl;
  }

  /**
   * Step 2: Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      console.log('🔄 Exchanging code for token via API route...');
      
      // Use our API route instead of direct Instagram API call
      const response = await fetch('/api/instagram/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirectUri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token exchange failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Token exchange successful');
      
      return data.access_token;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error('Failed to get Instagram access token');
    }
  }

  /**
   * Get Instagram Business Account Profile
   */
  async getInstagramProfile(accessToken: string, userId: string): Promise<InstagramProfile> {
    if (USE_MOCK_DATA) {
      const fakeHandle = accessToken.split('_')[0];
      const { getMockInstagramData } = await import('./mockInstagramService');
      const mockData = await getMockInstagramData(fakeHandle, userId);
      return mockData.profile;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Profile fetch failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Map API response to your existing InstagramProfile type
      return {
        id: data.id,
        username: data.username,
        name: data.name || data.username,
        biography: data.biography || '',
        followers_count: data.followers_count || 0,
        follows_count: data.follows_count || 0,
        media_count: data.media_count || 0,
        profile_picture_url: data.profile_picture_url || '',
        website: data.website || '',
        is_verified: false, // Instagram API doesn't provide this for business accounts
        account_type: data.account_type || 'BUSINESS', // Default or map from API
      };
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw new Error('Failed to fetch Instagram profile');
    }
  }

  /**
   * Get Instagram Media Posts
   */
  async getInstagramMedia(accessToken: string, userId: string, limit: number = 25): Promise<InstagramMedia[]> {
    if (USE_MOCK_DATA) {
      const fakeHandle = accessToken.split('_')[0];
      const { getMockInstagramData } = await import('./mockInstagramService');
      const mockData = await getMockInstagramData(fakeHandle, userId);
      return mockData.media.slice(0, limit);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Media fetch failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Map API response to your existing InstagramMedia type
      return data.data.map((post: any) => ({
        id: post.id,
        media_type: post.media_type.toLowerCase() as any, // Keep your existing type
        media_url: post.media_url,
        thumbnail_url: post.thumbnail_url || post.media_url,
        caption: post.caption || '',
        timestamp: post.timestamp,
        permalink: post.permalink,
        like_count: post.like_count || 0,     // Use like_count (matches your type)
        comments_count: post.comments_count || 0, // Use comments_count (matches your type)
        engagement_rate: 0, // Will be calculated after getting profile data
        // Add any other properties that your InstagramMedia type expects
      }));
    } catch (error) {
      console.error('Media fetch error:', error);
      throw new Error('Failed to fetch Instagram media');
    }
  }

  /**
   * Get Complete Instagram Data Package
   */
  async getInstagramDataPackage(accessToken: string, userId: string): Promise<InstagramDataPackage> {
    if (USE_MOCK_DATA) {
      const fakeHandle = accessToken.split('_')[0];
      const { getMockInstagramData } = await import('./mockInstagramService');
      return getMockInstagramData(fakeHandle, userId);
    }

    try {
      // Fetch profile and media in parallel
      const [profile, media] = await Promise.all([
        this.getInstagramProfile(accessToken, userId),
        this.getInstagramMedia(accessToken, userId, 25)
      ]);

      // Calculate engagement rates for media
      const mediaWithEngagement = media.map(post => ({
        ...post,
        engagement_rate: this.calculateEngagementRate(
          (post.like_count || 0) + (post.comments_count || 0), 
          profile.followers_count || 0
        )
      }));

      // Create the data package matching your existing InstagramDataPackage type
      return {
        profile,
        media: mediaWithEngagement,
        audience: {
          age_ranges: [],
          gender: {
            male: 0,
            female: 0,
            other: 0
          },
          locations: [],
          active_times: []
        },
        metrics: await this.getBasicInsights(profile, mediaWithEngagement),
        trending_content: mediaWithEngagement.slice(0, 3), // Example: top 3 posts as trending
        historical_growth: [], // Placeholder, fill with real data if available
      };
    } catch (error) {
      console.error('Complete data fetch error:', error);
      throw new Error('Failed to fetch Instagram data package');
    }
  }

  /**
   * Get Basic Insights (calculated from available data)
   */
  private async getBasicInsights(profile: InstagramProfile, media: InstagramMedia[]) {
    const totalLikes = media.reduce((sum, post) => sum + (post.like_count || 0), 0);
    const totalComments = media.reduce((sum, post) => sum + (post.comments_count || 0), 0);
    const totalEngagement = totalLikes + totalComments;
    const avgLikes = media.length > 0 ? totalLikes / media.length : 0;
    const avgComments = media.length > 0 ? totalComments / media.length : 0;
    const engagementRate = media.length > 0 && profile.followers_count ? totalEngagement / (media.length * profile.followers_count) * 100 : 0;
    const overallEngagementRate = profile.followers_count ? (totalEngagement / profile.followers_count) * 100 : 0;
    // Placeholder values for missing metrics
    const followerGrowthRate = 0;
    const avgReachPerPost = 0;
    const avgImpressionsPerPost = 0;
    const avgProfileViewsPerPost = 0;
    const avgWebsiteClicksPerPost = 0;

    return {
      reach: Math.floor((profile.followers_count || 0) * 0.1), // Estimated reach (10% of followers)
      impressions: Math.floor(totalEngagement * 3), // Estimated impressions
      profileViews: Math.floor((profile.followers_count || 0) * 0.05), // Estimated profile views
      websiteClicks: Math.floor(totalEngagement * 0.02), // Estimated website clicks
      engagementRate,
      period: '30d',
      lastUpdated: new Date().toISOString(),
      overall_engagement_rate: overallEngagementRate,
      avg_likes_per_post: avgLikes,
      avg_comments_per_post: avgComments,
      follower_growth_rate: followerGrowthRate,
      avg_reach_per_post: avgReachPerPost,
      avg_impressions_per_post: avgImpressionsPerPost,
      avg_profile_views_per_post: avgProfileViewsPerPost,
      avg_website_clicks_per_post: avgWebsiteClicksPerPost,
      post_frequency: this.calculatePostFrequency(media),
      best_performing_media_type: media.length > 0
        ? media
            .map((post) => post.media_type)
            .reduce((a, b, _, arr) =>
              arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
            ) as import('@/types/instagram.types').MediaType
        : 'image' as import('@/types/instagram.types').MediaType, // Default to 'image' if no media is present
      optimal_posting_times: [], // Placeholder, fill with real data if available
      hashtag_performance: [], // Placeholder, fill with real data if available
    };
  }

  /**
   * Analyze Instagram Account (main function for your current flow)
   */
  async analyzeInstagramAccount(instagramHandle: string, userId: string): Promise<InstagramDataPackage> {
    if (USE_MOCK_DATA) {
      const fakeToken = `${instagramHandle}_mock_token`;
      return this.getInstagramDataPackage(fakeToken, userId);
    }

    // For real API, you'll need a valid access token
    // This would typically come from your database after OAuth
    throw new Error('Real Instagram analysis requires OAuth token. Please connect your Instagram account first.');
  }

  /**
   * Refresh Long-Lived Token
   */
  async refreshToken(accessToken: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  // Helper Functions
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private calculateEngagementRate(totalEngagement: number, followers: number): number {
    if (followers === 0) return 0;
    return Math.round((totalEngagement / followers) * 100 * 100) / 100;
  }

  private calculatePostFrequency(media: InstagramMedia[]): number {
    if (media.length < 2) return 0;
    
    const sortedMedia = [...media].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const newestDate = new Date(sortedMedia[0].timestamp);
    const oldestDate = new Date(sortedMedia[sortedMedia.length - 1].timestamp);
    const daysDifference = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDifference === 0) return media.length;
    
    const postsPerDay = media.length / daysDifference;
    return Math.round(postsPerDay * 100) / 100;
  }
}

// Create and export the service instance
export const instagramApiService = new InstagramApiService();

// Export the individual functions to match your current interface
export const getInstagramProfile = (accessToken: string, userId: string) => 
  instagramApiService.getInstagramProfile(accessToken, userId);

export const getInstagramMedia = (accessToken: string, userId: string, limit?: number) => 
  instagramApiService.getInstagramMedia(accessToken, userId, limit);

export const getInstagramDataPackage = (accessToken: string, userId: string) => 
  instagramApiService.getInstagramDataPackage(accessToken, userId);

export const analyzeInstagramAccount = (instagramHandle: string, userId: string) => 
  instagramApiService.analyzeInstagramAccount(instagramHandle, userId);

// Export the service for OAuth flows
export { instagramApiService as instagramApi };