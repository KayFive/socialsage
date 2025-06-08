export interface MetricTrend {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface MetricCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
  metrics: MetricTrend[];
}

export interface PostMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach: string;
}

export interface MobilePost {
  id: string | number;
  platform: string;
  type: string;
  title: string;
  timestamp: string;
  thumbnail: string;
  metrics: PostMetrics;
  performance: 'high' | 'medium' | 'low';
  url?: string;
}

export interface ConnectedAccount {
  platform: string;
  username: string;
  connected: boolean;
  color: string;
  handle?: string;
}

export interface AIMetricOption {
  value: string;
  label: string;
  description: string;
}

export interface AIRecommendation {
  title: string;
  insights: string[];
  actions: string[];
}

export interface TimeFrameMetrics {
  growth: string;
  engagement: string;
  posts: string;
  timeLabel: string;
}

export interface MobileProfileData {
  username?: string;
  fullName?: string;
  followerCount: number;
  followingCount: number;
  profilePicUrl?: string;
  category?: string;
  isVerified?: boolean;
}

export interface MobileReportMetrics {
  posts: number;
  engagement: number;
  reach: number;
  impressions: number;
  avgLikes: number;
  avgComments: number;
  saves: number;
}

export interface TransformedReportData {
  profile: MobileProfileData;
  metrics: MobileReportMetrics;
  recentPosts: MobilePost[];
  overallScore: number;
}

export interface MobileNotification {
  type: string;
  message: string;
  time: string;
  bg: string;
  icon: string;
}

export interface TabConfig {
  id: string;
  icon: any;
  label: string;
}

export interface MobileDashboardState {
  activeTab: string;
  timeFrame: 'weekly' | 'monthly' | 'annual';
  selectedMetricCategory: string | null;
  chatStep: number;
  selectedMetric: string;
  selectedAccount: ConnectedAccount | string;
  isAnalyzing: boolean;
  postsView: 'recent' | 'top';
  postsTimeFrame: 'weekly' | 'monthly' | 'annual';
}