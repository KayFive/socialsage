// src/types/instagram.ts

export interface InstagramUser {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  media_count: number;
  followers_count: number;
  follows_count: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
  comments_count: number;
  like_count: number;
  is_comment_enabled: boolean;
  is_shared_to_feed: boolean;
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  profile_views: number;
  website_clicks: number;
  follows: number;
  unfollows: number;
  date: string;
}

export interface InstagramMediaInsights {
  media_id: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  profile_visits: number;
  website_clicks: number;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export interface InstagramAccount {
  id: string;
  user_id: string;
  instagram_user_id: string;
  username: string;
  access_token: string;
  token_expires_at: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaAnalytics {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  average_engagement_rate: number;
  best_performing_post: InstagramMedia;
  worst_performing_post: InstagramMedia;
  media_type_breakdown: {
    images: number;
    videos: number;
    carousels: number;
  };
}

export interface GrowthMetrics {
  follower_growth: {
    current: number;
    previous: number;
    growth_rate: number;
    growth_count: number;
  };
  engagement_growth: {
    current: number;
    previous: number;
    growth_rate: number;
  };
  reach_growth: {
    current: number;
    previous: number;
    growth_rate: number;
  };
}