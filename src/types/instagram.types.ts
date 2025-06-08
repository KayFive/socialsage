// Instagram data types that mirror the actual API response structures

// Basic profile information
export type InstagramProfile = {
  id: string;
  username: string;
  account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
  media_count: number;
  followers_count: number;
  follows_count: number;
  profile_picture_url: string;
  biography: string;
  website: string;
  name: string;
  is_verified: boolean;
};

// Media types that Instagram supports
export type MediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';

// A single media post
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: MediaType;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  children?: InstagramMediaChild[];
  insights?: MediaInsights;
  // Metrics
  like_count: number;
  comments_count: number;
  engagement_rate?: number;
  reach?: number;
  impressions?: number;
  saved?: number;
  // Content analysis
  hashtags?: string[];
  mentioned_users?: string[];
  primary_color?: string;
};

// Child media in carousel posts
export type InstagramMediaChild = {
  id: string;
  media_type: MediaType;
  media_url: string;
};

// Insights data for media
export type MediaInsights = {
  engagement: number;
  impressions: number;
  reach: number;
  saved: number;
  video_views?: number;
};

// Audience demographics
export type AudienceDemographics = {
  age_ranges: AgeRangeData[];
  gender: GenderData;
  locations: LocationData[];
  active_times: ActiveTimeData[];
};

export type AgeRangeData = {
  range: string;
  percentage: number;
};

export type GenderData = {
  male: number;
  female: number;
  other: number;
};

export type LocationData = {
  country: string;
  city?: string;
  percentage: number;
};

export type ActiveTimeData = {
  day: string;
  hour: number;
  activity_level: number; // 0-100 scale
};

// Overall account metrics
export type AccountMetrics = {
  overall_engagement_rate: number;
  avg_likes_per_post: number;
  avg_comments_per_post: number;
  follower_growth_rate: number;
  post_frequency: number; // posts per week
  best_performing_media_type: MediaType;
  optimal_posting_times: OptimalPostingTime[];
  hashtag_performance: HashtagPerformance[];
};

export type OptimalPostingTime = {
  day: string;
  hour: number;
  engagement_score: number; // 0-100 scale
};

export type HashtagPerformance = {
  hashtag: string;
  usage_count: number;
  avg_engagement: number;
};

// Combined Instagram data package for analytics
export type InstagramDataPackage = {
  profile: InstagramProfile;
  media: InstagramMedia[];
  audience: AudienceDemographics;
  metrics: AccountMetrics;
  trending_content: InstagramMedia[];
  historical_growth: HistoricalData[];
};

export type HistoricalData = {
  date: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
};