import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Home, BarChart3, Bell, User, Plus, TrendingUp, Eye, Users, Heart, MessageCircle, Bookmark, MoreHorizontal, ChevronDown, ChevronRight, Target, Clock, Zap, TestTube, Search, BookOpen, X } from 'lucide-react';
import { AuthService } from '@/lib/auth'
import { useAnalytics, ClickTracker, ViewTracker } from '@/components/AnalyticsProvider'
import AccountDataManagement from '@/components/AccountDataManagement'
import OnboardingTrigger from '@/components/onboarding/OnboardingTrigger'


// Type definitions
interface Metric {
  name: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  detail?: string;
  data?: any;
  percentage?: number;
  people?: string;
  description?: string;
  status?: 'excellent' | 'strong' | 'opportunity' | 'normal';
}

interface MetricCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
  metrics: Metric[];
}

interface Post {
  id: number;
  platform: string;
  type: string;
  title: string;
  timestamp: string;
  thumbnail: string;
  metrics: {
    likes: number;
    comments: number;
    saves: number;
    reach: string;
  };
  performance: 'high' | 'medium' | 'low';
  caption?: string;
}

interface TopPost {
  title: string;
  type: string;
  metrics: {
    likes: number;
    comments: number;
    saves: number;
    reach: string;
  };
  performance: 'high' | 'medium' | 'low';
  caption?: string;
}

interface Account {
  platform: string;
  username: string;
  connected: boolean;
  color: string;
}

interface MetricOption {
  value: string;
  label: string;
  description: string;
}

interface HourlyData {
  hour: string;
  activity: number;
  label: string;
  reach?: number;
  postCount?: number;
}

interface Follower {
  name: string;
  username: string;
  avatar: string;
  interactions: number;
  type: string;
}

// NEW: Real top follower interface
interface TopFollower {
  username: string;
  interactions: number;
  comments: number;
  likes: number;
  lastSeen: string;
  engagementType: 'high' | 'medium' | 'regular';
}

interface Metrics {
  growth: string;
  engagement: string;
  reach: string;
  timeLabel: string;
}

interface AIRecommendation {
  title: string;
  insights: string[];
  actions: string[];
  closer?: string;
}

interface InstagramPost {
  id: string;
  caption: string;
  comments_count: number;
  like_count: number;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  reach?: number;
  impressions?: number;
  profile_visits?: number;
  website_clicks?: number;
  saves?: number;
  comments?: Comment[];
}

interface InstagramData {
  followers: number;
  mediaCount: number;
  username: string;
  engagementRate: string;
  growthRate: string;
  monthlyGrowth?: string;
  monthlyReach?: string;
  recentPosts?: InstagramPost[];
  avgLikes?: number;
  avgComments?: number;
  totalReach?: number;
  totalImpressions?: number;
  avgReach?: number;
  avgImpressions?: number;
  topFollowers?: TopFollower[]; // NEW: Real top followers
  accountInsights?: {
    reach: number;
    profile_visits: number;
    impressions: number;
  };
  growthData?: {
    canCalculateWeekly: boolean;
    canCalculateMonthly: boolean;
    daysOfData: number;
    dataAvailableSince: string | null;
    daysUntilWeekly: number;
    daysUntilMonthly: number;
  };
  categoryStats?: Array<{
    content_category: string;
    count: number;
    avg_likes: number;
    avg_comments: number;
    avg_reach: number;
    avg_impressions: number;
  }>;
  formatStats?: Array<{
  post_type: string;
  count: number;
  avg_likes: number;
  avg_comments: number;
  avg_reach: number;
  avg_impressions: number;
  engagement_rate: string;
  total_engagement: number;
}>;
  crossAnalysisStats?: Array<{
    content_category: string;
    post_type: string;
    count: number;
    avg_likes: number;
    avg_comments: number;
    avg_reach: number;
    avg_impressions: number;
  }>;
  taggingProgress?: {
    totalPosts: number;
    taggedPosts: number;
    untaggedPosts: number;
    completionPercentage: number;
  };
  untaggedPosts?: Array<{
    id: string;
    instagram_post_id: string;
    caption: string;
    post_type: string;
    published_at: string;
    likes_count: number;
    comments_count: number;
    reach?: number;
    media_url?: string;
    thumbnail_url?: string;
  }>;
  availableCategories?: Array<{
    id: string;
    name: string;
    emoji: string;
    color_scheme: any;
    is_default: boolean;
  }>;
  topPerformers?: {
    category: any;
    format: any;
  };
  unlockedFeatures?: {
    basicInsights: boolean;
    timingAnalysis: boolean;
    crossAnalysis: boolean;
    fullStrategy: boolean;
  };
  // NEW: Historical data from daily_snapshots table
  historicalData?: {
    weekly: Array<{
      date: string;
      followers: number;
      isComplete: boolean;
    }>;
    monthly: Array<{
      date: string;
      followers: number;
      isComplete: boolean;
    }>;
  };
}

// NEW: Interfaces for timing and frequency data
interface TimeSlot {
  time: string;
  dayOfWeek: string;
  hour: number;
  avgLikes: number;
  avgComments: number;
  avgReach: number;
  postCount: number;
  engagementScore: number;
  posts: InstagramPost[];
}

// NEW: Heatmap data structure for 3-hour blocks
interface HeatmapCell {
  day: string;
  timeBlock: string; // e.g., "12a-2a"
  startHour: number; // e.g., 0 for 12a-2a block
  dayIndex: number;
  engagementScore: number;
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgReach: number;
  intensity: number; // 0-100 for color intensity
}

interface FrequencyData {
  currentFrequency: number;
  optimalFrequency: number;
  consistencyScore: number;
  performanceByFrequency: {
    range: string;
    avgEngagement: number;
    postCount: number;
  }[];
  weeklyPattern: {
    week: string;
    postCount: number;
    avgEngagement: number;
  }[];
}

type TimeFrame = 'weekly' | 'monthly';
type PostsTimeFrame = 'weekly' | 'monthly' | 'annual';
type Performance = 'high' | 'medium' | 'low';
type Status = 'excellent' | 'strong' | 'opportunity' | 'normal';
type ValidMetric = 'growth' | 'engagement' | 'timing' | 'frequency' | 'content' | 'reach';
type PerformanceLevel = 'positive' | 'mixed' | 'negative' | 'neutral' | 'declining' | 'very_low';
type VariationLevel = 'positive' | 'mixed' | 'negative';

// ✅ ADD THE HELPER FUNCTIONS HERE ✅
const getCategoryEmoji = (category: string) => {
  const emojiMap: { [key: string]: string } = {
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
  return emojiMap[category] || '📝';
};

const getFormatEmoji = (format: string) => {
  const emojiMap: { [key: string]: string } = {
    'VIDEO': '🎬',
    'CAROUSEL_ALBUM': '📸',
    'IMAGE': '🖼️',
    'Reels': '🎬',
    'Posts': '📝',
    'Carousels': '📸'
  };
  return emojiMap[format] || '📄';
};

const getFormatType = (mediaType: string) => {
  switch (mediaType) {
    case 'VIDEO':
      return 'Reels';
    case 'CAROUSEL_ALBUM':
      return 'Carousels';
    case 'IMAGE':
    default:
      return 'Posts';
  }
};

function analyzeSentiment(posts: InstagramPost[]) {
  if (!posts || posts.length === 0) return null;

  // Expanded positive keywords for social media
  const positiveKeywords = [
    // Basic positive words
    'love', 'amazing', 'awesome', 'great', 'perfect', 'beautiful', 'best', 'fantastic',
    'wonderful', 'excellent', 'incredible', 'outstanding', 'brilliant', 'superb',
    'good', 'nice', 'cool', 'wow', 'yes', 'absolutely', 'definitely',
    
    // Social media slang & expressions
    'slay', 'slaying', 'iconic', 'legend', 'queen', 'king', 'goals', 'fire', 'lit', 'vibes', 'vibe',
    'mood', 'aesthetic', 'clean', 'fresh', 'smooth', 'crisp', 'stunning', 'gorgeous',
    'obsessed', 'obsessing', 'stan', 'stanning', 'ship', 'shipping', 'living for this',
    'here for it', 'here for this', 'all for it', 'so here for this',
    
    // Achievement & praise terms
    'nailed it', 'killed it', 'crushed it', 'smashed it', 'ate and left no crumbs',
    'main character', 'main character energy', 'chef kiss', 'chefs kiss', 'perfection',
    'flawless', 'immaculate', 'divine', 'ethereal', 'dreamy',
    
    // Internet abbreviations & expressions  
    'omg', 'omfg', 'lol', 'lmao', 'lmfao', 'rofl', 'tbh', 'ngl', 'fr', 'periodt', 'period',
    'facts', 'fax', 'no cap', 'no printer', 'this is it', 'this it',
    'based', 'valid', 'understood the assignment', 'assignment understood',
    
    // Excitement expressions
    'screaming', 'crying', 'dead', 'deceased', 'gone', 'sent me', 'sending me',
    'cannot', 'cant', 'cant even', 'i cant', 'im done', 'done for', 'finished',
    'not me', 'not you', 'the way i', 'the way you', 'respectfully',
    
    // Appreciation & support
    'appreciate', 'grateful', 'blessed', 'thankful', 'thanks', 'thank you', 'tysm',
    'inspiring', 'inspired', 'motivating', 'motivated', 'helpful', 'needed this',
    'came for me', 'called out', 'read me', 'understood', 'felt that', 'relate',
    
    // Content appreciation
    'quality', 'content', 'educational', 'informative', 'helpful', 'useful', 'valuable',
    'entertaining', 'funny', 'hilarious', 'comedy', 'humor', 'laugh', 'laughing',
    'relatable', 'real', 'authentic', 'genuine', 'honest', 'raw', 'vulnerable',
    
    // Agreement & validation
    'exactly', 'precisely', 'absolutely', 'totally', 'completely', 'agree', 'agreed',
    'same', 'me too', 'also me', 'literally me', 'this me', 'big mood', 'whole mood',
    
    // Variations with emphasis
    'amazinggg', 'loveee', 'yesss', 'sooo good', 'sooo cute', 'prettyyyy', 'perfecttt'
  ];

  const negativeKeywords = [
    // Basic negative words
    'hate', 'hating', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'disappointing',
    'annoying', 'boring', 'stupid', 'dumb', 'waste', 'useless', 'pointless',
    'disagree', 'wrong', 'fail', 'failed', 'failure', 'disappointed', 'angry', 'mad',
    
    // Social media criticism & slang
    'cringe', 'cringey', 'cringing', 'ick', 'icky', 'gross', 'disgusting', 'nasty',
    'toxic', 'problematic', 'red flag', 'red flags', 'sus', 'suspicious', 'sketchy',
    'weird', 'odd', 'strange', 'creepy', 'uncomfortable', 'awkward',
    
    // Internet negativity & dismissiveness
    'mid', 'mid af', 'trash', 'garbage', 'flop', 'flopped', 'flopping', 'fail',
    'ratio', 'ratioed', 'cap', 'capping', 'lying', 'lie', 'lies', 'fake',
    'phony', 'fraud', 'scam', 'scammer', 'catfish',
    
    // Disappointment expressions
    'not it', 'aint it', 'this aint it', 'miss', 'missed', 'flop era', 'fallen off',
    'used to be', 'what happened', 'disappointed', 'let down', 'expected better',
    
    // Criticism & negativity
    'overrated', 'overhyped', 'try hard', 'trying too hard', 'desperate', 'attention seeking',
    'pick me', 'basic', 'mainstream', 'generic', 'copied', 'unoriginal',
    'boring', 'bland', 'plain', 'meh', 'okay i guess', 'could be better',
    
    // Dismissive responses
    'whatever', 'sure jan', 'okay karen', 'karen', 'boomer', 'ok boomer',
    'delete this', 'delete', 'remove', 'take this down', 'stop', 'quit', 'enough',
    'no one asked', 'didnt ask', 'who asked', 'nobody cares', 'dont care'
  ];

  const positiveEmojis = [
    '😍', '🥰', '😘', '💕', '❤️', '💖', '💗', '💓', '🔥', '✨', '👏', '🙌', '💯', '👍',
    '😊', '😀', '😃', '😄', '🤩', '😻', '💪', '🌟', '⭐', '💎', '🏆', '🎉', '🎊', '🥳'
  ];

  const negativeEmojis = [
    '😠', '😡', '🤬', '😤', '🙄', '😒', '😞', '😢', '😭', '💔', '👎', '🤮',
    '😷', '🤢', '😵', '😫', '😩', '😖', '😣', '😰', '😨', '🚫', '❌', '💸'
  ];

  // Analyze sentiment by content type and time
  const sentimentByType = new Map();
  const sentimentOverTime = new Map();
  let totalComments = 0;
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;

  posts.forEach(post => {
    if (!post.comments || post.comments.length === 0) return;

    const contentType = post.media_type === 'VIDEO' ? 'Reels' : 
                       post.media_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Posts';
    
    const postDate = new Date(post.timestamp);
    const monthKey = `${postDate.getFullYear()}-${String(postDate.getMonth() + 1).padStart(2, '0')}`;

    if (!sentimentByType.has(contentType)) {
      sentimentByType.set(contentType, { positive: 0, negative: 0, neutral: 0, total: 0 });
    }

    if (!sentimentOverTime.has(monthKey)) {
      sentimentOverTime.set(monthKey, { positive: 0, negative: 0, neutral: 0, total: 0, date: postDate });
    }

    const typeData = sentimentByType.get(contentType);
    const timeData = sentimentOverTime.get(monthKey);

    post.comments.forEach(comment => {
      const text = (comment as any).text?.toLowerCase?.() || '';
      let sentiment = 'neutral';
      let score = 0;

      // Check for positive keywords and emojis
      positiveKeywords.forEach(word => {
        if (text.includes(word)) score += 1;
      });
      positiveEmojis.forEach(emoji => {
        if (text.includes(emoji)) score += 1;
      });

      // Check for negative keywords and emojis
      negativeKeywords.forEach(word => {
        if (text.includes(word)) score -= 1;
      });
      negativeEmojis.forEach(emoji => {
        if (text.includes(emoji)) score -= 1;
      });

      // Determine sentiment
      if (score > 0) sentiment = 'positive';
      else if (score < 0) sentiment = 'negative';

      // Update counters
      typeData[sentiment]++;
      typeData.total++;
      timeData[sentiment]++;
      timeData.total++;
      
      if (sentiment === 'positive') totalPositive++;
      else if (sentiment === 'negative') totalNegative++;
      else totalNeutral++;
      
      totalComments++;
    });
  });

  // Calculate overall sentiment
  const overallSentiment = {
    positive: totalComments > 0 ? Math.round((totalPositive / totalComments) * 100) : 0,
    negative: totalComments > 0 ? Math.round((totalNegative / totalComments) * 100) : 0,
    neutral: totalComments > 0 ? Math.round((totalNeutral / totalComments) * 100) : 0,
    totalComments
  };

  // Convert to arrays and calculate insights
  const contentTypeAnalysis = Array.from(sentimentByType.entries()).map(([type, data]) => ({
    contentType: type,
    positive: data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0,
    negative: data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0,
    neutral: data.total > 0 ? Math.round((data.neutral / data.total) * 100) : 0,
    totalComments: data.total,
    sentiment_score: data.total > 0 ? Math.round(((data.positive - data.negative) / data.total) * 100) : 0
  })).sort((a, b) => b.sentiment_score - a.sentiment_score);

  // Debug logging to track data collection
console.log('Sentiment Analysis Debug:', {
  totalPosts: posts.length,
  monthsFound: Array.from(sentimentOverTime.keys()),
  postsWithComments: posts.filter(p => p.comments && p.comments.length > 0).length
});

  const timeAnalysis = Array.from(sentimentOverTime.entries())
    .map(([month, data]) => ({
      month,
      positive: data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0,
      negative: data.total > 0 ? Math.round((data.negative / data.total) * 100) : 0,
      neutral: data.total > 0 ? Math.round((data.neutral / data.total) * 100) : 0,
      totalComments: data.total,
      sentiment_score: data.total > 0 ? Math.round(((data.positive - data.negative) / data.total) * 100) : 0,
      date: data.date
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-6); // Last 6 months

  return {
    overallSentiment,
    contentTypeAnalysis,
    timeAnalysis,
    insights: {
      bestContentType: contentTypeAnalysis[0]?.contentType || null,
      sentimentTrend: timeAnalysis.length > 1 ? 
        (timeAnalysis[timeAnalysis.length - 1].sentiment_score > timeAnalysis[timeAnalysis.length - 2].sentiment_score ? 'improving' : 'declining') : 
        'stable',
      averageSentimentScore: contentTypeAnalysis.length > 0 ? 
        Math.round(contentTypeAnalysis.reduce((sum, type) => sum + type.sentiment_score, 0) / contentTypeAnalysis.length) : 0
    }
  };
}

const getCategorySentimentData = (instagramData: InstagramData) => {
  if (!instagramData?.categoryStats || !instagramData?.recentPosts) {
    return null;
  }

  // Get real sentiment analysis from actual comments
  const sentimentData = instagramData?.recentPosts ? analyzeSentiment(instagramData.recentPosts) : null;
  
  if (!sentimentData || sentimentData.overallSentiment.totalComments === 0) {
    return null;
  }

  // Map categories to their sentiment analysis
  return instagramData.categoryStats.map((category) => {
    // For now, we'll use the content type analysis as a proxy
    // In a full implementation, you'd need to map posts to categories
    const contentTypeMapping: { [key: string]: string } = {
      'Tutorial': 'Posts',
      'Behind the Scenes': 'Reels', 
      'Product Demo': 'Carousels',
      'Lifestyle': 'Posts',
      'Tips': 'Posts',
      'Story': 'Reels',
      'News': 'Posts',
      'Review': 'Carousels',
      'Entertainment': 'Reels',
      'Educational': 'Posts'
    };
    
    const mappedType = contentTypeMapping[category.content_category] || 'Posts';
    const contentTypeData = sentimentData.contentTypeAnalysis.find((ct: any) => ct.contentType === mappedType);
    
    if (contentTypeData) {
      return {
        category: category.content_category,
        postCount: category.count,
        avgEngagement: category.avg_likes + category.avg_comments,
        sentiment_score: contentTypeData.sentiment_score,
        positive: contentTypeData.positive,
        negative: contentTypeData.negative,
        neutral: contentTypeData.neutral,
        totalComments: contentTypeData.totalComments
      };
    }
    
    // Fallback to overall sentiment if no specific mapping
    return {
      category: category.content_category,
      postCount: category.count,
      avgEngagement: category.avg_likes + category.avg_comments,
      sentiment_score: sentimentData.insights.averageSentimentScore,
      positive: sentimentData.overallSentiment.positive,
      negative: sentimentData.overallSentiment.negative,
      neutral: sentimentData.overallSentiment.neutral,
      totalComments: Math.round(sentimentData.overallSentiment.totalComments / (instagramData.categoryStats?.length || 1))
    };
  }).sort((a, b) => b.sentiment_score - a.sentiment_score);
};

const EmailPreferences = ({ userId, onClose }: { userId: string, onClose: () => void }) => {
  const [preferences, setPreferences] = useState({
    marketing: true,
    product: true,
    tips: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load current preferences
    const loadPreferences = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email_marketing_enabled, email_product_updates, email_growth_tips')
          .eq('id', userId)
          .single();

        if (data) {
          setPreferences({
            marketing: data.email_marketing_enabled ?? true,
            product: data.email_product_updates ?? true,
            tips: data.email_growth_tips ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to load email preferences:', error);
      }
      setLoading(false);
    };

    loadPreferences();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          email_marketing_enabled: preferences.marketing,
          email_product_updates: preferences.product,
          email_growth_tips: preferences.tips,
        })
        .eq('id', userId);
      
      onClose();
    } catch (error) {
      console.error('Failed to save email preferences:', error);
      alert('Failed to save preferences. Please try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Email Preferences</h2>
        
        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
              className="mr-3 mt-1"
            />
            <div>
              <span className="font-medium">Welcome & Growth Tips</span>
              <p className="text-sm text-gray-600">Onboarding emails and Instagram growth strategies</p>
            </div>
          </label>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={preferences.product}
              onChange={(e) => setPreferences(prev => ({ ...prev, product: e.target.checked }))}
              className="mr-3 mt-1"
            />
            <div>
              <span className="font-medium">Product Updates</span>
              <p className="text-sm text-gray-600">New features and app improvements</p>
            </div>
          </label>
          
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={preferences.tips}
              onChange={(e) => setPreferences(prev => ({ ...prev, tips: e.target.checked }))}
              className="mr-3 mt-1"
            />
            <div>
              <span className="font-medium">Weekly Insights</span>
              <p className="text-sm text-gray-600">Personalized Instagram performance insights</p>
            </div>
          </label>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

const SocialSageMobile = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string | null>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showEmailPreferences, setShowEmailPreferences] = useState(false);
  
  // Real Instagram data state
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [selectedPostsForTagging, setSelectedPostsForTagging] = useState<string[]>([]);
  const [bulkTaggingMode, setBulkTaggingMode] = useState(false);
  const [contentView, setContentView] = useState<'categories' | 'formats' | 'cross-analysis'>('categories');

  // Analytics tracking
  const { trackFeature, trackEngagement, trackFunnel } = useAnalytics()

  // Track initial app load
  useEffect(() => {
    trackEngagement('app_loaded', {
      initial_tab: activeTab,
      has_instagram_data: !!instagramData
    })
    
    trackFunnel('user_onboarding', 'app_opened', 1, true)
  }, [])

  // Logout function with tracking
  const handleLogout = async () => {
  console.log('🚪 Logging out from dashboard...')
  
  // Track logout attempt
  trackEngagement('user_logout', {
    session_duration: Date.now() - (performance.timing?.navigationStart || Date.now()),
    tabs_visited: [activeTab],
    had_instagram_connected: !!instagramData
  })
  
  try {
    // Clear storage first
    sessionStorage.removeItem('socialsage_user_id')
    sessionStorage.removeItem('socialsage_user_email')
    localStorage.clear()
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Logout error:', error)
      trackEngagement('logout_failed', { error: error.message })
      alert('Logout failed. Please try again.')
      return
    }
    
    console.log('✅ Logged out successfully')
    trackEngagement('logout_successful')
    
    // Force reload to clear any cached state
    window.location.href = '/'
    
  } catch (error) {
    console.error('❌ Error during logout:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    trackEngagement('logout_error', { error: errorMessage })
    alert('An error occurred during logout. Redirecting...')
    window.location.href = '/'
  }
}

// Fetch Instagram data function (moved outside useEffect)
const fetchInstagramData = useCallback(async () => {
  console.log('📡 SocialSage: Fetching Instagram data...');
  setIsLoadingData(true);
  
  // Track data fetch attempt
  trackEngagement('instagram_data_fetch_started')
  
  try {
    const response = await fetch('/api/instagram/metrics');
    console.log('📊 SocialSage: API Response status:', response.status);
    
    if (response.ok) {
      const rawData = await response.json();
      console.log('🔍 SocialSage: Instagram API Response:', rawData);
      
      const processedData = processCategorizationData(rawData);
      setInstagramData(processedData);
      setDataError(null);

      console.log('📊 Loaded Instagram Data:', {
        totalPosts: processedData.recentPosts?.length || 0,
        postsWithComments: processedData.recentPosts?.filter((p: InstagramPost) => (p.comments?.length ?? 0) > 0).length || 0,
        dateRange: {
          earliest: processedData.recentPosts?.[processedData.recentPosts.length - 1]?.timestamp,
          latest: processedData.recentPosts?.[0]?.timestamp
        },
        monthsOfData: (() => {
          if (!processedData.recentPosts || processedData.recentPosts.length === 0) return 0;
          const earliest = new Date(processedData.recentPosts[processedData.recentPosts.length - 1].timestamp);
          const latest = new Date(processedData.recentPosts[0].timestamp);
        const months = (latest.getFullYear() - earliest.getFullYear()) * 12 + (latest.getMonth() - earliest.getMonth());
        return months;
        })(),
        postsByMonth: (() => {
        if (!processedData.recentPosts) return {};
        const monthCounts: Record<string, number> = {};
        processedData.recentPosts.forEach((post: InstagramPost) => {
        const month = new Date(post.timestamp).toISOString().substring(0, 7);
        monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        return monthCounts;
        })()
      });
      
      // 🆕 NEW: Track when we last refreshed
      setLastRefreshTime(new Date());
      
      // Track successful data fetch
      trackEngagement('instagram_data_fetch_success', {
        followers: processedData.followers,
        posts_count: processedData.recentPosts?.length || 0,
        engagement_rate: processedData.engagementRate,
        has_insights: !!processedData.accountInsights
      })
      
      // Track Instagram connection status
      if (processedData.followers > 0) {
        trackEngagement('instagram_connected_detected', {
          follower_count: processedData.followers,
          account_type: processedData.followers < 1000 ? 'micro' : processedData.followers < 10000 ? 'small' : 'large'
        })
        
        // Complete Instagram onboarding funnel
        trackFunnel('instagram_onboarding', 'data_loaded', 3, true, {
          followers: processedData.followers
        })
      }
      
    } else {
      const error = await response.json();
      console.error('❌ SocialSage: API Error:', error);
      setDataError(error.error || 'Failed to fetch Instagram data');
      
      // Track data fetch error
      trackEngagement('instagram_data_fetch_failed', {
        error: error.error,
        status_code: response.status
      })
    }
  } catch (error) {
    console.error('❌ SocialSage: Failed to fetch Instagram data:', error);
    setDataError('Network error while fetching data. Please check your Instagram connection.');
    
    // Track network error
    trackEngagement('instagram_data_fetch_error', {
      error: error instanceof Error ? error.message : String(error),
      error_type: 'network'
    })
  }
  
  setIsLoadingData(false);
}, [trackEngagement, trackFunnel]);

// 🆕 NEW: Add this useEffect to get the current user
useEffect(() => {
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };
  
  getCurrentUser();
}, []);

// Simple useEffect - only fetch once on mount (NO auto-refresh!)
useEffect(() => {
  fetchInstagramData();
}, [fetchInstagramData]);

// Manual refresh function
const handleManualRefresh = useCallback(async () => {
  trackEngagement('manual_refresh_triggered', {
    last_refresh_ago_minutes: lastRefreshTime ? 
      Math.round((Date.now() - lastRefreshTime.getTime()) / (1000 * 60)) : 
      null
  });
  
  await fetchInstagramData();
}, [lastRefreshTime, trackEngagement, fetchInstagramData]);

// Smart refresh when user returns after being away
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && lastRefreshTime) {
      const minutesSinceLastRefresh = (Date.now() - lastRefreshTime.getTime()) / (1000 * 60);
      
      // Only refresh if it's been more than 30 minutes since last refresh
      if (minutesSinceLastRefresh > 30) {
        console.log('📱 User returned after 30+ minutes, refreshing data...');
        trackEngagement('auto_refresh_on_return', {
          minutes_away: Math.round(minutesSinceLastRefresh)
        });
        fetchInstagramData();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [lastRefreshTime, fetchInstagramData, trackEngagement]);

  // Add this useEffect to scroll to top when changing views
useEffect(() => {
  // Scroll to top when changing tabs or metric categories
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, [activeTab, selectedMetricCategory]);

  // Track timeframe changes
  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    const previousTimeFrame = timeFrame
    setTimeFrame(newTimeFrame)
    
    trackFeature('timeframe_selector', 'click', {
      new_timeframe: newTimeFrame,
      previous_timeframe: previousTimeFrame,
      current_tab: activeTab
    })
  }

  // Helper function to convert 24-hour to 12-hour format
  const formatHour12 = (hour: number): string => {
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  // Helper function to get 3-hour time block label
  const getTimeBlockLabel = (startHour: number): string => {
    return formatHour12(startHour);
  };

  // Helper function to format time for individual slots
  const formatTimeSlot = (dayOfWeek: string, hour: number): string => {
    const time12 = hour === 0 ? '12:00 AM' : 
                  hour < 12 ? `${hour}:00 AM` :
                  hour === 12 ? '12:00 PM' :
                  `${hour - 12}:00 PM`;
    return `${dayOfWeek} ${time12}`;
  };

 // NEW: Calculate real timing data from posts WITH heatmap support for 3-hour blocks
  const calculateTimingOptimization = (posts: InstagramPost[]): { timeSlots: TimeSlot[], heatmapData: HeatmapCell[] } => {
    // Track timing analysis usage
    trackFeature('timing_optimization', 'view', {
      posts_analyzed: posts.length,
      has_data: posts.length > 0
    })
    
    if (!posts || posts.length === 0) {
      return { timeSlots: [], heatmapData: [] };
    }

    const timeSlotMap = new Map<string, TimeSlot>();
    const heatmapBlockMap = new Map<string, HeatmapCell>();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const dayOfWeek = dayAbbr[date.getDay()];
      const dayIndex = date.getDay();
      const hour = date.getHours();
      const timeKey = `${dayOfWeek} ${hour}:00`;
      
      // Calculate which 3-hour block this hour falls into
      const blockStartHour = Math.floor(hour / 3) * 3;
      const blockKey = `${dayIndex}-${blockStartHour}`;

      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      const reach = post.reach || 0;

      // Update individual time slot data (for top 5 slots)
      if (!timeSlotMap.has(timeKey)) {
        timeSlotMap.set(timeKey, {
          time: formatTimeSlot(dayOfWeek, hour),
          dayOfWeek,
          hour,
          avgLikes: 0,
          avgComments: 0,
          avgReach: 0,
          postCount: 0,
          engagementScore: 0,
          posts: []
        });
      }

      const slot = timeSlotMap.get(timeKey)!;
      slot.posts.push(post);
      slot.postCount += 1;

      // Update 3-hour block data (for heatmap)
      if (!heatmapBlockMap.has(blockKey)) {
        heatmapBlockMap.set(blockKey, {
          day: dayOfWeek,
          timeBlock: getTimeBlockLabel(blockStartHour),
          startHour: blockStartHour,
          dayIndex,
          engagementScore: 0,
          postCount: 0,
          avgLikes: 0,
          avgComments: 0,
          avgReach: 0,
          intensity: 0
        });
      }

      const heatmapCell = heatmapBlockMap.get(blockKey)!;
      heatmapCell.postCount += 1;
    });

    // Calculate averages for individual time slots
    const timeSlots = Array.from(timeSlotMap.values()).map(slot => {
      const totalLikes = slot.posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalComments = slot.posts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
      const totalReach = slot.posts.reduce((sum, post) => sum + (post.reach || 0), 0);
      
      return {
        ...slot,
        avgLikes: Math.round(totalLikes / slot.postCount),
        avgComments: Math.round(totalComments / slot.postCount),
        avgReach: Math.round(totalReach / slot.postCount),
        engagementScore: Math.round((totalLikes + totalComments * 3) / slot.postCount)
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);

    // Calculate aggregated data for 3-hour blocks
    const heatmapCells = Array.from(heatmapBlockMap.values()).map(cell => {
      // Find all individual slots that fall within this 3-hour block
      const relevantSlots = timeSlots.filter(slot => {
        const slotBlockStart = Math.floor(slot.hour / 3) * 3;
        return slot.dayOfWeek === cell.day && slotBlockStart === cell.startHour;
      });

      if (relevantSlots.length > 0) {
        // Aggregate data from all slots in this block
        const totalPosts = relevantSlots.reduce((sum, slot) => sum + slot.postCount, 0);
        const totalLikes = relevantSlots.reduce((sum, slot) => sum + (slot.avgLikes * slot.postCount), 0);
        const totalComments = relevantSlots.reduce((sum, slot) => sum + (slot.avgComments * slot.postCount), 0);
        const totalReach = relevantSlots.reduce((sum, slot) => sum + (slot.avgReach * slot.postCount), 0);
        const totalEngagement = relevantSlots.reduce((sum, slot) => sum + (slot.engagementScore * slot.postCount), 0);

        cell.postCount = totalPosts;
        cell.avgLikes = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
        cell.avgComments = totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0;
        cell.avgReach = totalPosts > 0 ? Math.round(totalReach / totalPosts) : 0;
        cell.engagementScore = totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0;
      }

      return cell;
    });

    // Calculate intensity for color mapping (0-100)
    const maxEngagement = Math.max(...heatmapCells.map(cell => cell.engagementScore));
    const minEngagement = Math.min(...heatmapCells.filter(cell => cell.engagementScore > 0).map(cell => cell.engagementScore));
    
    heatmapCells.forEach(cell => {
      if (maxEngagement > minEngagement && cell.engagementScore > 0) {
        cell.intensity = Math.round(((cell.engagementScore - minEngagement) / (maxEngagement - minEngagement)) * 100);
      } else {
        cell.intensity = cell.engagementScore > 0 ? 50 : 0;
      }
    });

    // Fill in missing 3-hour blocks with zero values for complete grid
    const completeHeatmapData: HeatmapCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let blockStart = 0; blockStart < 24; blockStart += 3) {
        const existing = heatmapCells.find(cell => cell.dayIndex === dayIndex && cell.startHour === blockStart);
        if (existing) {
          completeHeatmapData.push(existing);
        } else {
          completeHeatmapData.push({
            day: dayAbbr[dayIndex],
            timeBlock: getTimeBlockLabel(blockStart),
            startHour: blockStart,
            dayIndex,
            engagementScore: 0,
            postCount: 0,
            avgLikes: 0,
            avgComments: 0,
            avgReach: 0,
            intensity: 0
          });
        }
      }
    }

    return { timeSlots, heatmapData: completeHeatmapData };
  };

  // NEW: Calculate real frequency data from posts
  const calculateFrequencyOptimization = (posts: InstagramPost[]): FrequencyData => {
  // Track frequency analysis usage
  trackFeature('frequency_optimization', 'view', {
    posts_analyzed: posts.length,
    has_data: posts.length > 0
  })
  
  if (!posts || posts.length === 0) {
    return {
      currentFrequency: 0,
      optimalFrequency: 3,
      consistencyScore: 0,
      performanceByFrequency: [],
      weeklyPattern: []
    };
  }

  // Helper function to get proper week boundaries (Monday-Sunday)
  const getWeekKey = (date: Date) => {
    const d = new Date(date);
    // Get Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));
    const year = monday.getFullYear();
    const weekNumber = getWeekNumber(monday);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  // Get ISO week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayOfWeek = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  };

  // Sort posts by date
  const sortedPosts = [...posts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Group posts by proper calendar weeks
  const weeklyGroups = new Map<string, {
    posts: InstagramPost[],
    engagement: number,
    weekStart: Date,
    postCount: number
  }>();
  
  sortedPosts.forEach(post => {
    const date = new Date(post.timestamp);
    const weekKey = getWeekKey(date);
    const engagement = (post.like_count || 0) + (post.comments_count || 0);
    
    if (!weeklyGroups.has(weekKey)) {
      // Calculate week start date for this week
      const weekStart = new Date(date);
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      
      weeklyGroups.set(weekKey, {
        posts: [],
        engagement: 0,
        weekStart: weekStart,
        postCount: 0
      });
    }
    
    const group = weeklyGroups.get(weekKey)!;
    group.posts.push(post);
    group.engagement += engagement;
    group.postCount += 1;
  });

  // Calculate current frequency more accurately
  const weeksWithPosts = weeklyGroups.size;
  const totalPosts = posts.length;
  
  // Use actual weeks with data for more accurate frequency
  let currentFrequency = 0;
  if (weeksWithPosts > 0) {
    // If we have less than 4 weeks of data, estimate based on recent activity
    if (weeksWithPosts < 4) {
      // Use the last 30 days for current frequency estimation
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      const recentPosts = sortedPosts.filter(post => new Date(post.timestamp) >= thirtyDaysAgo);
      currentFrequency = Math.round((recentPosts.length / 4.3) * 10) / 10; // 4.3 weeks in 30 days
    } else {
      // Use actual weekly average
      currentFrequency = Math.round((totalPosts / weeksWithPosts) * 10) / 10;
    }
  }

  // Calculate performance by frequency buckets (based on weekly post counts)
  const frequencyBuckets = new Map<string, {
    totalEngagement: number,
    postCount: number,
    weekCount: number,
    avgEngagementPerPost: number
  }>();
  
  Array.from(weeklyGroups.values()).forEach(week => {
    const postsThisWeek = week.postCount;
    let bucketKey = '';
    
    if (postsThisWeek === 0) bucketKey = '0 posts/week';
    else if (postsThisWeek <= 1) bucketKey = '1 post/week';
    else if (postsThisWeek <= 2) bucketKey = '2 posts/week';
    else if (postsThisWeek <= 3) bucketKey = '3 posts/week';
    else if (postsThisWeek <= 5) bucketKey = '4-5 posts/week';
    else if (postsThisWeek <= 7) bucketKey = '6-7 posts/week';
    else bucketKey = '8+ posts/week';
    
    if (!frequencyBuckets.has(bucketKey)) {
      frequencyBuckets.set(bucketKey, {
        totalEngagement: 0,
        postCount: 0,
        weekCount: 0,
        avgEngagementPerPost: 0
      });
    }
    
    const bucket = frequencyBuckets.get(bucketKey)!;
    bucket.totalEngagement += week.engagement;
    bucket.postCount += week.postCount;
    bucket.weekCount += 1;
  });

  // Calculate averages for each frequency bucket
  const performanceByFrequency = Array.from(frequencyBuckets.entries())
    .map(([range, data]) => {
      const avgEngagement = data.postCount > 0 ? Math.round(data.totalEngagement / data.postCount) : 0;
      return {
        range,
        avgEngagement, // Average engagement per post in this frequency range
        postCount: data.postCount,
        weekCount: data.weekCount
      };
    })
    .filter(bucket => bucket.weekCount > 0) // Only include buckets with actual data
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  // Find optimal frequency based on best performing bucket
  let optimalFrequency = currentFrequency; // Default to current if no clear winner
  
  if (performanceByFrequency.length > 0) {
    const bestBucket = performanceByFrequency[0];
    
    // Extract optimal frequency from the best performing range
    if (bestBucket.range.includes('1 post')) optimalFrequency = 1;
    else if (bestBucket.range.includes('2 posts')) optimalFrequency = 2;
    else if (bestBucket.range.includes('3 posts')) optimalFrequency = 3;
    else if (bestBucket.range.includes('4-5')) optimalFrequency = 4;
    else if (bestBucket.range.includes('6-7')) optimalFrequency = 6;
    else if (bestBucket.range.includes('8+')) optimalFrequency = 7;
    else optimalFrequency = 3; // Fallback
    
    // Don't recommend more than 7 posts per week (daily posting)
    optimalFrequency = Math.min(optimalFrequency, 7);
  }

  // Calculate consistency score (how consistent is posting frequency)
  const weekCounts = Array.from(weeklyGroups.values()).map(week => week.postCount);
  let consistencyScore = 0;
  
  if (weekCounts.length > 1) {
    const avgWeeklyPosts = weekCounts.reduce((sum, count) => sum + count, 0) / weekCounts.length;
    const variance = weekCounts.reduce((sum, count) => sum + Math.pow(count - avgWeeklyPosts, 2), 0) / weekCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Score is higher when standard deviation is lower (more consistent)
    // Scale it to 0-100 where 100 means perfectly consistent
    const maxPossibleStdDev = avgWeeklyPosts; // Maximum possible std dev
    const consistencyRatio = Math.max(0, 1 - (standardDeviation / maxPossibleStdDev));
    consistencyScore = Math.round(consistencyRatio * 100);
  }

  // Generate weekly pattern with proper date formatting
  const weeklyPattern = Array.from(weeklyGroups.entries())
    .map(([weekKey, data]) => {
      const weekStart = data.weekStart;
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
      
      return {
        week: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
        weekKey: weekKey,
        postCount: data.postCount,
        avgEngagement: data.postCount > 0 ? Math.round(data.engagement / data.postCount) : 0,
        totalEngagement: data.engagement,
        weekStart: data.weekStart
      };
    })
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime()) // Sort by date
    .slice(-8); // Show last 8 weeks

  // Add debug logging to help troubleshoot
  console.log('📊 Frequency Optimization Debug:', {
    totalPosts: posts.length,
    weeksAnalyzed: weeksWithPosts,
    currentFrequency,
    optimalFrequency,
    performanceByFrequency,
    weeklyPattern: weeklyPattern.slice(-3), // Show last 3 weeks
    consistencyScore
  });

  return {
    currentFrequency,
    optimalFrequency,
    consistencyScore,
    performanceByFrequency,
    weeklyPattern
  };
};

const CombinedGrowthEngagementDetailView = ({ 
  instagramData, 
  timeFrame, 
  setTimeFrame, 
  trackFeature, 
  trackEngagement,
  setSelectedMetricCategory 
}: { 
  instagramData: InstagramData, 
  timeFrame: TimeFrame, 
  setTimeFrame: (tf: TimeFrame) => void, 
  trackFeature: (...args: any[]) => void, 
  trackEngagement: (...args: any[]) => void, 
  setSelectedMetricCategory: (cat: string | null) => void 
}) => {
  const [detailTimeFrame, setDetailTimeFrame] = useState('weekly');
  
  // Track when user enters detail view
  useEffect(() => {
    trackFeature('combined_growth_engagement_detail', 'view', {
      timeframe: detailTimeFrame,
      has_data: !!instagramData,
      followers: instagramData?.followers || 0
    })
  }, [detailTimeFrame])

  // Calculate absolute follower change
  const getAbsoluteFollowerChange = () => {
    if (!instagramData?.followers) return null;
    
    if (detailTimeFrame === 'weekly' && instagramData?.growthData?.canCalculateWeekly && instagramData.growthRate) {
      const growthPercent = parseFloat(instagramData.growthRate.replace('+', '').replace('%', ''));
      const absoluteChange = Math.round((growthPercent / 100) * instagramData.followers);
      return {
        change: absoluteChange,
        isPositive: absoluteChange >= 0,
        formatted: absoluteChange >= 0 ? `+${absoluteChange.toLocaleString()}` : absoluteChange.toLocaleString()
      };
    } else if (detailTimeFrame === 'monthly' && instagramData?.growthData?.canCalculateMonthly && instagramData.monthlyGrowth) {
      const growthPercent = parseFloat(instagramData.monthlyGrowth.replace('+', '').replace('%', ''));
      const absoluteChange = Math.round((growthPercent / 100) * instagramData.followers);
      return {
        change: absoluteChange,
        isPositive: absoluteChange >= 0,
        formatted: absoluteChange >= 0 ? `+${absoluteChange.toLocaleString()}` : absoluteChange.toLocaleString()
      };
    }
    
    return null;
  };

  // Get current metrics based on timeframe
const getCurrentMetrics = () => {
  if (!instagramData) return null;
  
  const now = new Date();
  const daysBack = detailTimeFrame === 'weekly' ? 7 : 30;
  const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

  // Filter posts within the timeframe for engagement calculation
  const timeframePosts = instagramData.recentPosts?.filter(post => {
    const postDate = new Date(post.timestamp);
    return postDate >= cutoffDate;
  }) || [];

  // If no posts in timeframe, return zeros/dashes
  if (timeframePosts.length === 0) {
    return {
      engagementRate: '--',
      avgLikes: 0,
      avgComments: 0,
      avgReach: 0,
      avgImpressions: 0,
      postsInTimeframe: 0
    };
  }

  // Calculate ALL metrics from timeframe-specific posts
  const totalLikes = timeframePosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
  const totalComments = timeframePosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
  const totalReach = timeframePosts.reduce((sum, post) => sum + (post.reach || 0), 0);
  const totalImpressions = timeframePosts.reduce((sum, post) => sum + (post.impressions || 0), 0);
  const totalEngagement = totalLikes + totalComments;

  // Calculate averages from timeframe posts
  const avgLikes = Math.round(totalLikes / timeframePosts.length);
  const avgComments = Math.round(totalComments / timeframePosts.length);
  const avgReach = Math.round(totalReach / timeframePosts.length);
  const avgImpressions = Math.round(totalImpressions / timeframePosts.length);

  // Calculate engagement rate from timeframe posts
  let timeframeEngagementRate = '--';
  if (totalReach > 0) {
    const rate = (totalEngagement / totalReach) * 100;
    timeframeEngagementRate = `${rate.toFixed(1)}%`;
  } else if (instagramData.followers > 0) {
    // Fallback to follower-based calculation
    const avgFollowersReached = instagramData.followers * timeframePosts.length;
    const rate = (totalEngagement / avgFollowersReached) * 100;
    timeframeEngagementRate = `${rate.toFixed(1)}%`;
  }

  return {
    engagementRate: timeframeEngagementRate,
    avgLikes,
    avgComments, 
    avgReach,
    avgImpressions,
    postsInTimeframe: timeframePosts.length
  };
};

  // Generate chart data from real historical data
const generateChartData = () => {
  if (!instagramData?.historicalData) return { followerData: [], engagementData: [] };
  
  const historicalData = detailTimeFrame === 'weekly' 
    ? instagramData.historicalData.weekly 
    : instagramData.historicalData.monthly;
  
  if (!historicalData || historicalData.length === 0) return { followerData: [], engagementData: [] };

  // Process follower data with proper formatting
  const followerData = historicalData.map((dataPoint, index) => {
    const isCurrentPeriod = !dataPoint.isComplete;
    let label = '';
    
    if (detailTimeFrame === 'weekly') {
      // For weekly: show just the start date like "12/15"
      const weekStartDate = new Date(dataPoint.date);
      const startMonth = weekStartDate.getMonth() + 1; // +1 because getMonth() is 0-indexed
      const startDay = weekStartDate.getDate();
      
      label = `${startMonth}/${startDay}`;
    } else {
      // For monthly: show abbreviated month name like "Dec", "Jan"
      const [year, month] = dataPoint.date.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      label = monthDate.toLocaleDateString('en-US', { month: 'short' });
    }
    
    return {
      label,
      followers: dataPoint.followers,
      isCurrentPeriod,
      date: dataPoint.date
    };
  });

  // Calculate REAL engagement data from posts in those periods
  const engagementData = followerData.map((followerItem) => {
    let engagementRate = 0;
    
    if (instagramData.recentPosts && instagramData.recentPosts.length > 0) {
      let periodPosts: any[] = [];
      
      if (detailTimeFrame === 'weekly') {
        // Filter posts for this specific week
        const weekStartDate = new Date(followerItem.date);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);
        weekEndDate.setHours(23, 59, 59, 999); // End of day
        
        periodPosts = instagramData.recentPosts.filter(post => {
          const postDate = new Date(post.timestamp);
          return postDate >= weekStartDate && postDate <= weekEndDate;
        });
      } else {
        // Filter posts for this specific month
        const [year, month] = followerItem.date.split('-');
        const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(month), 0); // Last day of month
        monthEnd.setHours(23, 59, 59, 999); // End of day
        
        periodPosts = instagramData.recentPosts.filter(post => {
          const postDate = new Date(post.timestamp);
          return postDate >= monthStart && postDate <= monthEnd;
        });
      }
      
      // Calculate engagement rate for this period
      if (periodPosts.length > 0) {
        const totalLikes = periodPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const totalComments = periodPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalReach = periodPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
        const totalEngagement = totalLikes + totalComments;
        
        if (totalReach > 0) {
          engagementRate = (totalEngagement / totalReach) * 100;
        } else if (followerItem.followers > 0) {
          // Fallback to follower-based calculation
          const avgFollowersReached = followerItem.followers * periodPosts.length;
          engagementRate = (totalEngagement / avgFollowersReached) * 100;
        }
      } else {
        // No posts in this period, try to estimate from nearby periods or use 0
        engagementRate = 0;
      }
    }
    
    return {
      ...followerItem,
      engagementRate: parseFloat(engagementRate.toFixed(1)),
      postsInPeriod: instagramData.recentPosts ? instagramData.recentPosts.filter(post => {
        if (detailTimeFrame === 'weekly') {
          const weekStartDate = new Date(followerItem.date);
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6);
          weekEndDate.setHours(23, 59, 59, 999);
          const postDate = new Date(post.timestamp);
          return postDate >= weekStartDate && postDate <= weekEndDate;
        } else {
          const [year, month] = followerItem.date.split('-');
          const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
          const monthEnd = new Date(parseInt(year), parseInt(month), 0);
          monthEnd.setHours(23, 59, 59, 999);
          const postDate = new Date(post.timestamp);
          return postDate >= monthStart && postDate <= monthEnd;
        }
      }).length : 0
    };
  });

  return { followerData, engagementData };
};

  const { followerData, engagementData } = generateChartData();
  const absoluteChange = getAbsoluteFollowerChange();
  const currentMetrics = getCurrentMetrics();
  
  const maxFollowers = Math.max(...followerData.map(d => d.followers));
  const maxEngagement = Math.max(...engagementData.map(d => d.engagementRate));

  return (
    <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-emerald-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-emerald-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
        <ClickTracker
          featureName="combined_growth_engagement_back"
          metadata={{ timeframe: detailTimeFrame }}
        >
          <button 
            onClick={() => setSelectedMetricCategory(null)}
            className="mr-3 text-emerald-600 font-medium"
          >
            ← Back
          </button>
        </ClickTracker>
        <div className="flex items-center">
          <span className="mr-2">📈</span>
          <h1 className="text-xl font-bold text-gray-900">Growth & Engagement</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Overview */}
        <div className="bg-gradient-to-br from-emerald-100 to-blue-100 border-emerald-200 rounded-2xl p-4 mb-6 shadow-sm border">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Account Performance Overview</h2>
          <p className="text-emerald-800 text-sm">
            Your combined growth and engagement metrics over time.
          </p>
        </div>

        {/* Timeframe Toggle */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
          <div className="flex bg-emerald-50 rounded-xl p-1 border border-emerald-200">
            {[
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' }
            ].map((period) => (
              <ClickTracker
                key={period.key}
                featureName="combined_detail_timeframe_toggle"
                metadata={{ selected_timeframe: period.key }}
              >
                <button
                  onClick={() => {
                    setDetailTimeFrame(period.key);
                    trackFeature('combined_detail_timeframe_change', 'click', {
                      new_timeframe: period.key,
                      previous_timeframe: detailTimeFrame
                    });
                  }}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                    detailTimeFrame === period.key
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-300'
                      : 'text-emerald-600 hover:text-emerald-700'
                  }`}
                >
                  {period.label}
                </button>
              </ClickTracker>
            ))}
          </div>
        </div>

        {/* Current Performance Metrics */}
        <ViewTracker
          featureName="combined_current_performance"
          metadata={{
            timeframe: detailTimeFrame,
            has_growth_data: detailTimeFrame === 'weekly' ? instagramData?.growthData?.canCalculateWeekly : instagramData?.growthData?.canCalculateMonthly,
            followers: instagramData?.followers || 0
          }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🎯</span>
              Current Performance
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-emerald-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {detailTimeFrame === 'weekly' ? (
                    instagramData?.growthData?.canCalculateWeekly ? (
                      absoluteChange?.formatted || '--'
                    ) : '--'
                  ) : (
                    instagramData?.growthData?.canCalculateMonthly ? (
                      absoluteChange?.formatted || '--'
                    ) : '--'
                  )}
                </div>
                <div className="text-sm text-emerald-700">Follower Change</div>
                <div className="text-xs text-gray-600 mt-1">
                  {detailTimeFrame === 'weekly' ? (
                    instagramData?.growthData?.canCalculateWeekly ? 
                      `${instagramData.growthRate} this week` : 
                      `Available in ${instagramData?.growthData?.daysUntilWeekly || 7}d`
                  ) : (
                    instagramData?.growthData?.canCalculateMonthly ? 
                      `${instagramData.monthlyGrowth} this month` : 
                      `Available in ${instagramData?.growthData?.daysUntilMonthly || 30}d`
                  )}
                </div>
              </div>
              
              <div className="text-center bg-blue-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {currentMetrics?.engagementRate || '--'}
                </div>
                <div className="text-sm text-blue-700">Engagement Rate</div>
                <div className="text-xs text-gray-600 mt-1">
                  Last {detailTimeFrame === 'weekly' ? '7' : '30'} days
                  {currentMetrics?.postsInTimeframe ? ` (${currentMetrics.postsInTimeframe} posts)` : ''}
                </div>
              </div>
            </div>

            {/* Complete Engagement Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-semibold text-gray-900">{currentMetrics?.avgLikes || 0}</span>
                </div>
                <div className="text-xs text-gray-600">Avg Likes per Post</div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold text-gray-900">{currentMetrics?.avgComments || 0}</span>
                </div>
                <div className="text-xs text-gray-600">Avg Comments per Post</div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {(currentMetrics?.avgReach ?? 0) >= 1000 ? `${((currentMetrics?.avgReach ?? 0) / 1000).toFixed(1)}K` : (currentMetrics?.avgReach ?? 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Avg Reach per Post</div>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs">👁</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {(currentMetrics?.avgImpressions ?? 0) >= 1000 ? `${((currentMetrics?.avgImpressions ?? 0) / 1000).toFixed(1)}K` : (currentMetrics?.avgImpressions ?? 0)}
                  </span>
                </div>
                <div className="text-xs text-gray-600">Avg Impressions per Post</div>
              </div>
              
              {instagramData?.accountInsights && (
                <>
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {instagramData.accountInsights.profile_visits >= 1000 ? 
                          `${(instagramData.accountInsights.profile_visits / 1000).toFixed(1)}K` : 
                          instagramData.accountInsights.profile_visits.toLocaleString()
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">Profile Visits (30d)</div>
                  </div>
                  
                  <div className="bg-white/60 rounded-lg p-3 text-center border border-gray-200/50">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        {instagramData.accountInsights.reach >= 1000 ? 
                          `${(instagramData.accountInsights.reach / 1000).toFixed(1)}K` : 
                          instagramData.accountInsights.reach.toLocaleString()
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">Total Reach (30d)</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </ViewTracker>

        {/* Charts */}
        {followerData.length > 0 && (
          <>
            {/* Follower Growth Chart */}
            <ViewTracker
              featureName="combined_follower_chart"
              metadata={{
                timeframe: detailTimeFrame,
                data_points: followerData.length
              }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📈</span>
                  Follower Growth Trend
                </h3>
                
                <div className="relative">
                  <div className="flex items-end justify-between h-32 mb-3">
                    {followerData.map((dataPoint, index) => {
                      const height = maxFollowers > 0 ? (dataPoint.followers / maxFollowers) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2" style={{ width: `${100/followerData.length}%` }}>
                          <div className="text-xs font-bold text-gray-900 mb-1">
                            {dataPoint.followers >= 1000 ? 
                              `${(dataPoint.followers / 1000).toFixed(1)}K` : 
                              dataPoint.followers.toLocaleString()
                            }
                          </div>
                          
                          <div className="relative w-8 bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '100px' }}>
                            <div 
                              className={`absolute bottom-0 w-full transition-all duration-700 rounded-t-lg ${
                                dataPoint.isCurrentPeriod 
                                  ? 'bg-gradient-to-t from-emerald-400 to-emerald-600' 
                                  : 'bg-gradient-to-t from-emerald-300 to-emerald-500'
                              }`}
                              style={{ height: `${Math.max(height, 8)}%` }}
                            />
                            {dataPoint.isCurrentPeriod && (
                              <div className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-400 to-emerald-600 opacity-20 animate-pulse rounded-t-lg" style={{ height: `${Math.max(height, 8)}%` }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    {followerData.map((dataPoint, index) => (
                      <div key={index} className="text-xs text-gray-600 text-center" style={{ width: `${100/followerData.length}%` }}>
                        {dataPoint.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ViewTracker>

            {/* Engagement Rate Chart */}
            <ViewTracker
              featureName="combined_engagement_chart"
              metadata={{
                timeframe: detailTimeFrame,
                data_points: engagementData.length
              }}
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">💬</span>
                  Engagement Rate Trend
                </h3>
                
                <div className="relative">
                  <div className="flex items-end justify-between h-32 mb-3">
                    {engagementData.map((dataPoint, index) => {
                      const height = maxEngagement > 0 ? (dataPoint.engagementRate / maxEngagement) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2" style={{ width: `${100/engagementData.length}%` }}>
                          <div className="text-xs font-bold text-gray-900 mb-1">
                            {dataPoint.engagementRate}%
                          </div>
                          
                          <div className="relative w-8 bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '100px' }}>
                            <div 
                              className={`absolute bottom-0 w-full transition-all duration-700 rounded-t-lg ${
                                dataPoint.isCurrentPeriod 
                                  ? 'bg-gradient-to-t from-blue-400 to-blue-600' 
                                  : 'bg-gradient-to-t from-blue-300 to-blue-500'
                              }`}
                              style={{ height: `${Math.max(height, 8)}%` }}
                            />
                            {dataPoint.isCurrentPeriod && (
                              <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-400 to-blue-600 opacity-20 animate-pulse rounded-t-lg" style={{ height: `${Math.max(height, 8)}%` }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    {engagementData.map((dataPoint, index) => (
                      <div key={index} className="text-xs text-gray-600 text-center" style={{ width: `${100/engagementData.length}%` }}>
                        {dataPoint.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ViewTracker>
          </>
        )}

        {/* Growth-Engagement Insights */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🔗</span>
            Account Performance Insights
          </h3>
          
          <div className="space-y-3">
            {/* Growth-Engagement Correlation */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Growth-Engagement Correlation</span>
                <span className="text-emerald-600 font-bold">
                  {currentMetrics && parseFloat(currentMetrics.engagementRate?.replace('%', '') || '0') > 4 ? 'Strong ↗' : 'Moderate ↗'}
                </span>
              </div>
              <p className="text-xs text-gray-700">
                Your {currentMetrics?.engagementRate || '--'} engagement rate is {
                  parseFloat(currentMetrics?.engagementRate?.replace('%', '') || '0') > 4 ? 'above' : 'at'
                } the typical Instagram average of 3-4%.
              </p>
            </div>

            {/* Data Collection Status */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">Data Collection Status</span>
                <span className="text-purple-600 font-bold">
                  {instagramData?.growthData?.daysOfData || 0} days
                </span>
              </div>
              <p className="text-xs text-gray-700">
                {instagramData?.growthData?.canCalculateWeekly ? 
                  'Weekly growth rates available' : 
                  `Weekly rates available in ${instagramData?.growthData?.daysUntilWeekly || 7} days`
                } • {instagramData?.growthData?.canCalculateMonthly ? 
                  'Monthly growth rates available' : 
                  `Monthly rates available in ${instagramData?.growthData?.daysUntilMonthly || 30} days`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



  // Helper function to truncate caption
  const truncateCaption = (caption: string, maxLength: number = 50) => {
    if (!caption) return "Instagram Post";
    const cleanCaption = caption.split('\n')[0].trim();
    if (cleanCaption.length <= maxLength) return cleanCaption;
    return cleanCaption.substring(0, maxLength) + '...';
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Helper function to calculate reach from real data only
  const calculateReach = (post: InstagramPost) => {
    if (post.reach && post.reach > 0) {
      if (post.reach >= 1000) {
        return `${(post.reach / 1000).toFixed(1)}K`;
      }
      return post.reach.toString();
    }
    
    // Return -- if no real reach data available
    return '--';
  };

  // Helper function to determine performance level
  const getPerformanceLevel = (likes: number, avgLikes: number): Performance => {
    if (likes >= avgLikes * 1.5) return 'high';
    if (likes >= avgLikes * 0.8) return 'medium';
    return 'low';
  };

  const handleTagPosts = async (postIds: string[], category: string, isCustom = false) => {
  try {
    console.log('🏷️ Tagging posts:', postIds, 'with category:', category);

    const response = await fetch('/api/instagram/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'tag',
        postIds,
        category,
        isCustomCategory: isCustom
      })
    });

    // Read the response ONCE
    const result = await response.json();
    console.log('🔍 Complete server response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      // Close modal and reset state
      setShowTaggingModal(false);
      setSelectedPostsForTagging([]);
      setBulkTaggingMode(false);
      
      // Track successful tagging
      trackEngagement('posts_tagged', {
        post_count: postIds.length,
        category,
        is_custom: isCustom
      });

      console.log('✅ Posts tagged successfully');
      
      // Refresh data to show updates
      await fetchInstagramData();
    } else {
      console.error('❌ Failed to tag posts:', result);
      alert(`Failed to tag posts: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to tag posts:', error);
    alert('Network error while tagging posts');
  }
};

  const handleUntagPosts = async (postIds: string[]) => {
    try {
      const response = await fetch('/api/instagram/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'untag',
          postIds
        })
      });

      if (response.ok) {
        await fetchInstagramData();
      }
    } catch (error) {
      console.error('Failed to untag posts:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.round(num).toString();
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case 'VIDEO': return 'Reels';
      case 'CAROUSEL_ALBUM': return 'Carousels';
      case 'IMAGE': return 'Posts';
      default: return format;
    }
  };

  const getFormatEmoji = (format: string) => {
    switch (format) {
      case 'VIDEO': return '🎬';
      case 'CAROUSEL_ALBUM': return '📸';
      case 'IMAGE': return '📝';
      default: return '📱';
    }
  };

  // Process categorization data - now handled server-side
const processCategorizationData = (data: any) => {
  console.log(`📊 Tagging progress: ${data.taggingProgress?.taggedPosts || 0}/${data.taggingProgress?.totalPosts || 0} posts tagged`);
  return data;
};

  // ===== ENHANCED ANALYTICS FUNCTIONS =====

// 1. GROWTH POTENTIAL ANALYSIS
const analyzeDiscoveryPotential = (posts: InstagramPost[]) => {
  if (!posts || posts.length === 0) return null;

  const contentTypeAnalysis = posts.reduce((acc: any, post: InstagramPost) => {
    const type = post.media_type || 'IMAGE';
    if (!acc[type]) {
      acc[type] = {
        totalReach: 0,
        totalProfileVisits: 0,
        totalEngagement: 0,
        totalImpressions: 0,
        count: 0,
        posts: []
      };
    }
    
    acc[type].totalReach += post.reach || 0;
    acc[type].totalProfileVisits += post.profile_visits || 0;
    acc[type].totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
    acc[type].totalImpressions += post.impressions || 0;
    acc[type].count += 1;
    acc[type].posts.push(post);
    
    return acc;
  }, {});

  return Object.entries(contentTypeAnalysis).map(([type, data]: [string, any]) => {
    const avgReach = data.totalReach / data.count;
    const avgProfileVisits = data.totalProfileVisits / data.count;
    const avgEngagement = data.totalEngagement / data.count;
    
    // Profile visit conversion rate
    const profileVisitRate = data.totalReach > 0 ? (data.totalProfileVisits / data.totalReach) * 100 : 0;
    
    // Discovery score combines reach and conversion
    const discoveryScore = avgReach * 0.6 + avgProfileVisits * 0.4;

    return {
      contentType: type,
      label: type === 'VIDEO' ? 'Reels' : type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Posts',
      sampleSize: data.count,
      avgReach: Math.round(avgReach),
      avgProfileVisits: Math.round(avgProfileVisits),
      avgEngagement: Math.round(avgEngagement),
      profileVisitRate: profileVisitRate.toFixed(2),
      discoveryScore: Math.round(discoveryScore),
      topPerformingPost: data.posts.sort((a: InstagramPost, b: InstagramPost) => (b.reach || 0) - (a.reach || 0))[0]
    };
  }).sort((a: any, b: any) => b.discoveryScore - a.discoveryScore);
};

// 2. REACH OPTIMIZATION ANALYSIS
const analyzeReachOptimization = (posts: InstagramPost[], followers: number) => {
  if (!posts || posts.length === 0) return null;

  const totalReach = posts.reduce((sum: number, post: InstagramPost) => sum + (post.reach || 0), 0);
  const avgReach = totalReach / posts.length;
  
  const reachToFollowerRatio = followers > 0 ? (avgReach / followers) * 100 : 0;
  const postsReachingBeyondFollowers = posts.filter((post: InstagramPost) => (post.reach || 0) > followers * 0.8).length;
  
  return {
    avgReach: Math.round(avgReach),
    reachToFollowerRatio: reachToFollowerRatio.toFixed(1),
    postsReachingBeyondFollowers,
    totalReachLast30Days: Math.round(totalReach)
  };
};

// 3. ENGAGEMENT QUALITY ANALYSIS (Updated - No Shares)
const analyzeEngagementQuality = (posts: InstagramPost[]) => {
  if (!posts || posts.length === 0) return null;

  const engagementMetrics = posts.map((post: InstagramPost) => {
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;
    const saves = post.saves || 0;
    
    return {
      commentToLikeRatio: likes > 0 ? (comments / likes) * 100 : 0,
      saveToLikeRatio: likes > 0 ? (saves / likes) * 100 : 0
    };
  });

  const avgSaveToLikeRatio = (engagementMetrics.reduce((sum: number, m: any) => sum + m.saveToLikeRatio, 0) / engagementMetrics.length).toFixed(2);
  const avgCommentToLikeRatio = (engagementMetrics.reduce((sum: number, m: any) => sum + m.commentToLikeRatio, 0) / engagementMetrics.length).toFixed(2);
  
  // Updated criteria without shares
  const highValuePosts = engagementMetrics.filter((m: any) => 
    m.saveToLikeRatio > 5 || m.commentToLikeRatio > 8
  ).length;

  return {
    avgSaveToLikeRatio,
    avgCommentToLikeRatio,
    highValuePostsPercentage: ((highValuePosts / posts.length) * 100).toFixed(1),
    qualityRating: parseFloat(avgSaveToLikeRatio) > 4 ? 'Excellent' : 
                   parseFloat(avgSaveToLikeRatio) > 2.5 ? 'Good' : 'Needs Improvement'
  };
};

// 4. A/B TESTING SUGGESTIONS
const generateABTestSuggestions = (posts: InstagramPost[], timingData?: any, frequencyData?: any) => {
  const suggestions: any[] = [];

  // Timing A/B tests
  if (timingData?.timeSlots?.length >= 2) {
    const topTime = timingData.timeSlots[0];
    const secondTime = timingData.timeSlots[1];
    suggestions.push({
      type: 'Timing',
      hypothesis: `${topTime.time} vs ${secondTime.time} for your best content type`,
      description: `Test posting identical content at ${topTime.time} (avg: ${topTime.avgLikes} likes) vs ${secondTime.time} (avg: ${secondTime.avgLikes} likes)`,
      confidence: topTime.postCount >= 3 && secondTime.postCount >= 3 ? 'High' : 'Medium',
      duration: '2 weeks',
      metric: 'Engagement rate in first 24 hours',
      expectedOutcome: '15-20% difference in engagement'
    });
  }

  // Content type A/B tests
  const contentTypes = analyzeDiscoveryPotential(posts);
  if (contentTypes && contentTypes.length >= 2) {
    const bestType = contentTypes[0];
    const secondType = contentTypes[1];
    suggestions.push({
      type: 'Content Format',
      hypothesis: `${bestType.label} vs ${secondType.label} for educational content`,
      description: `Create the same educational content as ${bestType.label} vs ${secondType.label}`,
      confidence: 'High',
      duration: '3 weeks',
      metric: 'Total reach and profile visits',
      expectedOutcome: `${bestType.label} may get ${((bestType.avgReach - secondType.avgReach) / secondType.avgReach * 100).toFixed(0)}% more reach`
    });
  }

  return suggestions;
};

// 5. CONTENT GAP ANALYSIS
const analyzeContentGaps = (posts: InstagramPost[]): any[] => {
  if (!posts || posts.length === 0) return [];
  
  const now = new Date();
  const gaps: any[] = [];

  // Content type gaps
  const contentTypeCounts: { [key: string]: number } = { VIDEO: 0, CAROUSEL_ALBUM: 0, IMAGE: 0 };
  const lastPostByType: { [key: string]: string | null } = { VIDEO: null, CAROUSEL_ALBUM: null, IMAGE: null };
  
  posts.forEach((post: InstagramPost) => {
    const type = post.media_type || 'IMAGE';
    contentTypeCounts[type]++;
    
    const postDate = new Date(post.timestamp);
    if (!lastPostByType[type] || postDate > new Date(lastPostByType[type]!)) {
      lastPostByType[type] = post.timestamp;
    }
  });

  // Check for content type gaps
  Object.entries(lastPostByType).forEach(([type, lastPost]: [string, string | null]) => {
    if (lastPost) {
      const daysSinceLastPost = Math.floor((now.getTime() - new Date(lastPost).getTime()) / (1000 * 60 * 60 * 24));
      const typeLabel = type === 'VIDEO' ? 'Reel' : type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Single Post';
      
      if (daysSinceLastPost > 7) {
        gaps.push({
          type: 'Content Type Gap',
          description: `Haven't posted a ${typeLabel} in ${daysSinceLastPost} days`,
          priority: 'Medium',
          suggestion: `Consider creating a ${typeLabel} - they typically get good engagement`
        });
      }
    }
  });

  return gaps;
};

// 6. DAY OF WEEK PERFORMANCE ANALYSIS
const analyzeDayOfWeekPerformance = (posts: InstagramPost[]) => {
  if (!posts || posts.length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayMetrics = Array(7).fill(null).map(() => ({ 
  posts: [] as InstagramPost[], totalEngagement: 0, totalReach: 0, count: 0 
}));

  posts.forEach((post: InstagramPost) => {
    const dayOfWeek = new Date(post.timestamp).getDay();
    const engagement = (post.like_count || 0) + (post.comments_count || 0);
    
    dayMetrics[dayOfWeek].posts.push(post);
    dayMetrics[dayOfWeek].totalEngagement += engagement;
    dayMetrics[dayOfWeek].totalReach += post.reach || 0;
    dayMetrics[dayOfWeek].count += 1;
  });

  return dayMetrics.map((metrics: any, index: number) => ({
    day: dayNames[index],
    avgEngagement: metrics.count > 0 ? Math.round(metrics.totalEngagement / metrics.count) : 0,
    avgReach: metrics.count > 0 ? Math.round(metrics.totalReach / metrics.count) : 0,
    postCount: metrics.count,
    engagementRate: metrics.totalReach > 0 ? 
      ((metrics.totalEngagement / metrics.totalReach) * 100).toFixed(1) : '0'
  })).sort((a: any, b: any) => b.avgEngagement - a.avgEngagement);
};

// ===== UI COMPONENTS =====

interface ExpandableInsightProps {
  title: string;
  icon: string;
  summary: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableInsight: React.FC<ExpandableInsightProps> = ({ title, icon, summary, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h4 className="font-semibold text-gray-900">{title}</h4>
              <p className="text-sm text-gray-600">{summary}</p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

interface PerformanceBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

const PerformanceBar: React.FC<PerformanceBarProps> = ({ label, value, maxValue, color = "blue" }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const colorClasses: { [key: string]: string } = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    gray: "bg-gray-400"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${colorClasses[color]}`}
            style={{width: `${Math.min(percentage, 100)}%`}}
          ></div>
        </div>
        <span className="text-sm font-bold text-gray-900 min-w-[40px]">
          {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

  // Generate metric categories with real data
const getMetricCategories = (): MetricCategory[] => {
  // Calculate timing and frequency data
  const timingData = instagramData?.recentPosts ? calculateTimingOptimization(instagramData.recentPosts) : null;
  const frequencyData = instagramData?.recentPosts ? calculateFrequencyOptimization(instagramData.recentPosts) : null;

  const baseCategories = [
    {
      id: 'growth_engagement', // CHANGED: Combined ID
      title: 'Growth & Engagement',
      emoji: '📈',
      description: 'Track follower growth and audience engagement together',
      color: 'from-emerald-400 to-blue-500',
      metrics: [
        { 
          name: 'Total Followers', 
          value: instagramData?.followers?.toLocaleString() || '0', 
          trend: 'neutral' as 'neutral'
        },
        { 
          name: timeFrame === 'weekly' ? 'Weekly Growth' : 'Monthly Growth', 
          value: timeFrame === 'weekly' ? 
            (instagramData?.growthData?.canCalculateWeekly ? 
              (instagramData.growthRate || '0%') : 
              `Available in ${instagramData?.growthData?.daysUntilWeekly || 7}d`) :
            (instagramData?.growthData?.canCalculateMonthly ? 
              (instagramData.monthlyGrowth || '0%') : 
              `Available in ${instagramData?.growthData?.daysUntilMonthly || 30}d`), 
          trend: (timeFrame === 'weekly' ? instagramData?.growthData?.canCalculateWeekly : instagramData?.growthData?.canCalculateMonthly) ? 'up' as 'up' : 'neutral' as 'neutral'
        },
        { 
          name: 'Engagement Rate', 
          value: instagramData?.engagementRate || '4.2%', 
          trend: 'up' as 'up' 
        },
        { 
          name: 'Avg Reach per Post', 
          value: instagramData?.avgReach ? instagramData.avgReach.toLocaleString() : '1.2K', 
          trend: 'up' as 'up' 
        }
      ]
    },
    {
      id: 'timing',
      title: 'Timing Optimization',
      emoji: '⏰',
      description: 'Discover when to post for maximum engagement',
      color: 'from-purple-400 to-pink-500',
      metrics: [
        { 
          name: 'Best Time to Post', 
          value: timingData?.timeSlots[0]?.time || '7-9 PM', 
          detail: timingData?.timeSlots[0] ? `${timingData.timeSlots[0].avgLikes} avg likes` : 'Weekdays peak engagement window',
          trend: 'up' as 'up'
        },
        { 
          name: 'Top Performance Hour', 
          value: timingData?.timeSlots[0] ? `${timingData.timeSlots[0].engagementScore} score` : '85% activity', 
          detail: timingData?.timeSlots[0] ? `Based on ${timingData.timeSlots[0].postCount} posts` : 'Peak audience activity',
          trend: 'up' as 'up'
        },
        { 
          name: 'Active Time Slots', 
          value: timingData?.timeSlots ? `${timingData.timeSlots.length} slots` : '12 slots tested', 
          detail: timingData ? `From ${instagramData?.recentPosts?.length} posts analyzed` : 'Time periods with posts',
          trend: 'up' as 'up'
        }
      ]
    },
    {
      id: 'frequency',
      title: 'Frequency Optimization',
      emoji: '📊',
      description: 'How often to post for optimal growth',
      color: 'from-orange-400 to-red-500',
      metrics: [
        { 
          name: 'Current Frequency', 
          value: frequencyData ? `${frequencyData.currentFrequency}/week` : '2.5/week', 
          detail: 'Based on recent posting pattern',
          trend: 'neutral' as 'neutral'
        },
        { 
          name: 'Optimal Frequency', 
          value: frequencyData ? `${frequencyData.optimalFrequency}/week` : '3.5/week', 
          detail: 'For maximum engagement',
          trend: 'up' as 'up'
        },
        { 
          name: 'Consistency Score', 
          value: frequencyData ? `${frequencyData.consistencyScore}%` : '78%', 
          detail: 'How regularly you post',
          trend: (frequencyData?.consistencyScore || 78) >= 70 ? 'up' as 'up' : 'down' as 'down'
        },
        { 
          name: 'Best Frequency Range', 
          value: frequencyData?.performanceByFrequency[0]?.range || '2-3 posts/week', 
          detail: frequencyData?.performanceByFrequency[0] ? `${frequencyData.performanceByFrequency[0].avgEngagement} avg engagement` : 'Highest performing range',
          trend: 'up' as 'up'
        }
      ]
    },
    {
      id: 'content_categories',
      title: 'Content Categories',
      emoji: '🏷️',
      description: 'Manual post tagging and cross-analysis insights',
      color: 'from-indigo-400 to-purple-500',
      metrics: [
        {
          name: 'Tagged Posts',
          value: instagramData?.taggingProgress?.taggedPosts?.toString() || '0',
          trend: 'neutral' as 'neutral',
          detail: `${instagramData?.taggingProgress?.untaggedPosts || 0} remaining`
        },
        {
          name: 'Categories',
          value: instagramData?.categoryStats?.length?.toString() || '0',
          trend: 'neutral' as 'neutral',
          detail: 'Content types identified'
        },
        {
          name: 'Progress',
          value: instagramData?.taggingProgress?.completionPercentage 
            ? `${instagramData.taggingProgress.completionPercentage}%` 
            : '0%',
          trend: (instagramData?.taggingProgress?.taggedPosts || 0) > 0 ? 'up' as 'up' : 'neutral' as 'neutral',
          detail: instagramData?.topPerformers?.category
            ? `${instagramData.topPerformers.category.content_category} leads`
            : 'Tag posts for insights'
        }
      ]
    },
    {
      id: 'insights',
      title: 'Top Followers',
      emoji: '👥',
      description: 'Your most engaged followers by interaction',
      color: 'from-violet-400 to-purple-500',
      metrics: instagramData?.topFollowers && instagramData.topFollowers.length > 0 ? 
        instagramData.topFollowers.slice(0, 5).map((follower) => ({
          name: `@${follower.username}`,
          value: `${follower.interactions} interactions`,
          trend: 'up' as 'up'
        })) :
        [
          { name: 'No Engagement Data', value: 'Connect account', trend: 'neutral' as 'neutral' }
        ]
    },
    {
      id: 'sentiment_analysis',
      title: 'Audience Sentiment',
      emoji: '💭',
      description: 'Understand how your audience feels about your content',
      color: 'from-pink-400 to-rose-500',
      metrics: (() => {
  const sentimentData = instagramData?.recentPosts ? analyzeSentiment(instagramData.recentPosts) : null;
  const hasTaggedCategories = instagramData?.categoryStats && instagramData.categoryStats.length > 0;
  
  if (sentimentData && sentimentData.overallSentiment.totalComments > 0) {
    const categoryAnalysis = hasTaggedCategories ? getCategorySentimentData(instagramData) : null;
    const bestCategory = categoryAnalysis?.[0];
    const avgSentimentScore = categoryAnalysis ? 
      categoryAnalysis.reduce((sum, cat) => sum + cat.sentiment_score, 0) / categoryAnalysis.length : 
      sentimentData.insights.averageSentimentScore;
    
    // Calculate trend from time analysis
    const trendDirection = sentimentData.insights.sentimentTrend;
    const trendEmoji = trendDirection === 'improving' ? '📈' : 
                     trendDirection === 'declining' ? '📉' : '➡️';
    
    return [
      {
        name: 'Overall Sentiment',
        value: `${sentimentData.overallSentiment.positive}%`,
        trend: sentimentData.overallSentiment.positive > 70 ? 'up' as 'up' : 
               sentimentData.overallSentiment.positive > 50 ? 'neutral' as 'neutral' : 'down' as 'down',
        detail: `${sentimentData.overallSentiment.totalComments} real comments analyzed`
      },
      {
        name: 'Sentiment Score',
        value: `${avgSentimentScore > 0 ? '+' : ''}${Math.round(avgSentimentScore)}`,
        trend: avgSentimentScore > 20 ? 'up' as 'up' : 
               avgSentimentScore > 0 ? 'neutral' as 'neutral' : 'down' as 'down',
        detail: hasTaggedCategories ? 'Across all categories' : 'Overall score'
      },
      {
        name: 'Trend Analysis',
        value: `${trendEmoji} ${trendDirection}`,
        trend: trendDirection === 'improving' ? 'up' as 'up' : 
               trendDirection === 'declining' ? 'down' as 'down' : 'neutral' as 'neutral',
        detail: sentimentData.timeAnalysis.length > 1 ? 
                `${sentimentData.timeAnalysis.length} months analyzed` : 
                'Need more time data'
      },
      {
        name: hasTaggedCategories ? 'Best Category' : 'Best Content Type',
        value: bestCategory?.category || sentimentData.insights.bestContentType || 'Mixed content',
        trend: 'up' as 'up',
        detail: bestCategory ? 
                `${bestCategory.sentiment_score} sentiment score` : 
                'Most positive reactions'
      }
    ];
  } else {
    return [
      {
        name: 'Comments Needed',
        value: 'No data yet',
        trend: 'neutral' as 'neutral',
        detail: 'Post content that encourages comments'
      },
      {
        name: 'Real Analysis',
        value: 'Coming soon',
        trend: 'neutral' as 'neutral',
        detail: 'Based on actual comment text'
      },
      {
        name: 'Historical Trends',
        value: 'Available',
        trend: 'neutral' as 'neutral',
        detail: 'Once you have comment data'
      },
      {
        name: 'Category Insights',
        value: hasTaggedCategories ? 'Ready' : 'Tag posts',
        trend: 'neutral' as 'neutral',
        detail: hasTaggedCategories ? 'Categories tagged' : 'Tag posts to unlock'
      }
    ];
  }
})()
    }
  ];

  return baseCategories;
};

  const metricCategories = useMemo(() => getMetricCategories(), [
  instagramData?.followers,
  instagramData?.recentPosts?.length,
  instagramData?.engagementRate
]);

  // Track metric category selection with analytics
  const handleMetricCategorySelect = (categoryId: string) => {
    const category = metricCategories.find(c => c.id === categoryId)
    setSelectedMetricCategory(categoryId)
    
    // Track feature usage
    trackFeature(`metric_category_${categoryId}`, 'click', {
      category_title: category?.title,
      has_instagram_data: !!instagramData,
      user_followers: instagramData?.followers || 0,
      metrics_count: category?.metrics?.length || 0
    })
    
    // Track specific analytics features
if (categoryId === 'growth_engagement') {
  trackEngagement('combined_growth_engagement_accessed', {
    has_growth_data: timeFrame === 'weekly' ? 
      instagramData?.growthData?.canCalculateWeekly : 
      instagramData?.growthData?.canCalculateMonthly,
    engagement_rate: instagramData?.engagementRate,
    followers: instagramData?.followers || 0
  })
} else if (categoryId === 'timing') {
  trackEngagement('timing_optimization_accessed', {
    posts_available: instagramData?.recentPosts?.length || 0
  })
} else if (categoryId === 'frequency') {
  trackEngagement('frequency_optimization_accessed', {
    posts_available: instagramData?.recentPosts?.length || 0
  })
} else if (categoryId === 'content') {
  trackEngagement('content_analysis_accessed', {
    posts_available: instagramData?.recentPosts?.length || 0
  })
}
  }

  // Track tab navigation with analytics  
  const handleTabChange = (tabId: string) => {
    const previousTab = activeTab
    setActiveTab(tabId)
    
    // Track navigation
    trackFeature(`tab_${tabId}`, 'click', {
      previous_tab: previousTab,
      has_instagram_data: !!instagramData,
      user_followers: instagramData?.followers || 0
    })
    
    // Track specific tab access
    trackEngagement(`${tabId}_tab_accessed`, {
      from_tab: previousTab,
      session_depth: performance.now() / 1000 // Time since page load
    })
  }

  const MetricDetailView = ({ category }: { category: MetricCategory }) => {
    // Track when user enters detail view
    useEffect(() => {
      trackFeature(`metric_detail_${category.id}`, 'view', {
        category_title: category.title,
        time_entered: new Date().toISOString()
      })
      
      const startTime = Date.now()
      return () => {
        const timeSpent = Date.now() - startTime
        if (timeSpent > 3000) { // Only track if spent more than 3 seconds
          trackFeature(`metric_detail_${category.id}`, 'interact', {
            time_spent_seconds: Math.round(timeSpent / 1000),
            category_title: category.title
          })
        }
      }
    }, [category.id])

    // NEW: Handle combined growth & engagement view
if (category.id === 'growth_engagement') {
  if (!instagramData) return null;
  return (
    <CombinedGrowthEngagementDetailView
      instagramData={instagramData}
      timeFrame={timeFrame}
      setTimeFrame={setTimeFrame}
      trackFeature={trackFeature}
      trackEngagement={trackEngagement}
      setSelectedMetricCategory={setSelectedMetricCategory}
    />
  );
}

    if (category.id === 'content') {
      // Calculate content type performance from real data
      const getContentTypeData = () => {
        if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
          return [];
        }

        // Track content analysis usage
        trackFeature('content_analysis_detailed', 'view', {
          posts_analyzed: instagramData.recentPosts.length
        })

        // Group posts by type and calculate averages
        const typeGroups = new Map();
        
        instagramData.recentPosts.forEach(post => {
          let type = 'Post';
          if (post.media_type === 'VIDEO') type = 'Reel';
          else if (post.media_type === 'CAROUSEL_ALBUM') type = 'Carousel';
          
          if (!typeGroups.has(type)) {
            typeGroups.set(type, {
              posts: [],
              totalLikes: 0,
              totalComments: 0,
              totalReach: 0,
              totalSaves: 0
            });
          }
          
          const group = typeGroups.get(type);
          group.posts.push(post);
          group.totalLikes += post.like_count || 0;
          group.totalComments += post.comments_count || 0;
          group.totalReach += post.reach || 0;
          group.totalSaves += post.saves || 0;
        });

        // Convert to array with averages and sort by engagement
        const contentTypes = Array.from(typeGroups.entries()).map(([type, data]) => {
          const count = data.posts.length;
          const avgLikes = Math.round(data.totalLikes / count);
          const avgComments = Math.round(data.totalComments / count);
          const avgReach = Math.round(data.totalReach / count);
          const avgSaves = Math.round(data.totalSaves / count);
          const engagementRate = count > 0 ? (((data.totalLikes + data.totalComments) / data.totalReach) * 100).toFixed(1) + '%' : '0%';
          
          const typeConfig: Record<string, { emoji: string; color: string; bgColor: string; borderColor: string }> = {
            'Reel': { emoji: '🎬', color: 'from-purple-500 to-pink-500', bgColor: 'from-purple-50 to-pink-50', borderColor: 'border-purple-200' },
            'Carousel': { emoji: '📸', color: 'from-blue-500 to-indigo-500', bgColor: 'from-blue-50 to-indigo-50', borderColor: 'border-blue-200' },
            'Post': { emoji: '📝', color: 'from-green-500 to-emerald-500', bgColor: 'from-green-50 to-emerald-50', borderColor: 'border-green-200' }
          };
          
          return {
            type,
            emoji: typeConfig[type]?.emoji || '📝',
            count,
            avgLikes,
            avgComments,
            avgReach,
            avgSaves,
            engagementRate,
            color: typeConfig[type]?.color || 'from-gray-500 to-gray-600',
            bgColor: typeConfig[type]?.bgColor || 'from-gray-50 to-gray-100',
            borderColor: typeConfig[type]?.borderColor || 'border-gray-200',
            totalEngagement: data.totalLikes + data.totalComments
          };
        }).sort((a, b) => b.totalEngagement - a.totalEngagement);

        return contentTypes;
      };

      const contentTypes = getContentTypeData();

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-teal-50 to-cyan-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-teal-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker
              featureName="metric_detail_back_button"
              metadata={{ from_category: category.id }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-teal-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">📊</span>
              <h1 className="text-xl font-bold text-gray-900">Content Analysis</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-teal-100 to-cyan-100 border-teal-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Performance by Content Type</h2>
              <p className="text-teal-800 text-sm">
                Compare how different content formats perform with your audience.
              </p>
            </div>

            {contentTypes.length > 0 ? (
              <>
                {/* Content Type Rankings */}
                <div className="space-y-4 mb-6">
                  {contentTypes.map((contentType, index) => (
                    <ViewTracker
                      key={contentType.type}
                      featureName={`content_type_${contentType.type.toLowerCase()}`}
                      metadata={{ 
                        ranking: index + 1, 
                        avg_engagement: contentType.avgLikes + contentType.avgComments,
                        post_count: contentType.count
                      }}
                    >
                      <div className={`bg-gradient-to-br ${contentType.bgColor} ${contentType.borderColor} rounded-2xl p-4 shadow-sm border`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl">{contentType.emoji}</span>
                                <span className="text-lg font-bold text-gray-900">{contentType.type}</span>
                              </div>
                              <div className="text-sm text-gray-600">{contentType.count} posts analyzed</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold bg-gradient-to-r ${contentType.color} bg-clip-text text-transparent`}>
                              {contentType.engagementRate}
                            </div>
                            <div className="text-xs text-gray-600">Engagement Rate</div>
                          </div>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Heart className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-semibold text-gray-900">{contentType.avgLikes}</span>
                            </div>
                            <div className="text-xs text-gray-600">Avg Likes</div>
                          </div>
                          
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <MessageCircle className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-semibold text-gray-900">{contentType.avgComments}</span>
                            </div>
                            <div className="text-xs text-gray-600">Avg Comments</div>
                          </div>
                          
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                {contentType.avgReach >= 1000 ? `${(contentType.avgReach / 1000).toFixed(1)}K` : contentType.avgReach}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">Avg Reach</div>
                          </div>
                          
                          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Bookmark className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-semibold text-gray-900">{contentType.avgSaves}</span>
                            </div>
                            <div className="text-xs text-gray-600">Avg Saves</div>
                          </div>
                        </div>
                      </div>
                    </ViewTracker>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-teal-600 text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Data Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect your Instagram account and post different types of content to see performance analysis.
                </p>
                <p className="text-teal-700 text-sm">
                  We'll analyze Reels, Carousels, and Posts once you have data.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (category.id === 'timing') {
      // NEW: Enhanced timing optimization view with heatmap
      const timingResult = instagramData?.recentPosts ? calculateTimingOptimization(instagramData.recentPosts) : null;
      const timeSlots = timingResult?.timeSlots || [];
      const heatmapData = timingResult?.heatmapData || [];

      // Track heatmap interaction
      const handleHeatmapInteraction = () => {
        trackFeature('timing_heatmap', 'interact', {
          time_slots_available: timeSlots.length,
          posts_analyzed: instagramData?.recentPosts?.length || 0
        })
      }

      // Helper function to get color intensity for heatmap cells
      const getHeatmapColor = (intensity: number, hasData: boolean) => {
        if (!hasData || intensity === 0) {
          return 'bg-gray-100 text-gray-400';
        }
        
        if (intensity >= 80) return 'bg-gradient-to-br from-green-400 to-emerald-500 text-white';
        if (intensity >= 60) return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white';
        if (intensity >= 40) return 'bg-gradient-to-br from-blue-400 to-purple-500 text-white';
        if (intensity >= 20) return 'bg-gradient-to-br from-purple-400 to-pink-500 text-white';
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700';
      };

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const timeBlocks = [0, 3, 6, 9, 12, 15, 18, 21]; // 3-hour blocks

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-purple-50 to-pink-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-purple-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker
              featureName="timing_optimization_back"
              metadata={{ time_spent: Date.now() }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-purple-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">⏰</span>
              <h1 className="text-xl font-bold text-gray-900">Timing Optimization</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">When Your Audience Engages Most</h2>
              <p className="text-purple-800 text-sm">
                {heatmapData.length > 0 
                  ? `Analysis based on ${instagramData?.recentPosts?.length} real posts from your account.`
                  : 'Connect your Instagram and post content to see personalized timing insights.'
                }
              </p>
            </div>

            {heatmapData.length > 0 ? (
              <>
                {/* HEATMAP GRID */}
                <ViewTracker
                  featureName="timing_heatmap_view"
                  metadata={{
                    posts_analyzed: instagramData?.recentPosts?.length || 0,
                    time_slots_found: timeSlots.length
                  }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                    <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center">
                      <span className="mr-2">🔥</span>
                      Engagement Heatmap (3-Hour Blocks)
                    </h3>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-2 mb-4 text-xs">
                      <span className="text-gray-600">Low</span>
                      <div className="flex space-x-1">
                        <div className="w-3 h-3 bg-gray-200 rounded"></div>
                        <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded"></div>
                        <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded"></div>
                        <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
                        <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded"></div>
                      </div>
                      <span className="text-gray-600">High</span>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="overflow-x-auto" onClick={handleHeatmapInteraction}>
                      <div className="min-w-max">
                        {/* Header with days */}
                        <div className="grid grid-cols-8 gap-1 mb-1">
                          <div className="text-xs text-gray-500 text-center py-1"></div>
                          {days.map(day => (
                            <div key={day} className="text-xs text-gray-700 text-center py-1 font-medium">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* {/* Time block rows */}
                        {timeBlocks.map(blockStart => (
                          <div key={blockStart} className="grid grid-cols-8 gap-1 mb-1">
                            <div className="text-xs text-gray-500 text-right py-1 pr-2 font-medium">
                              {getTimeBlockLabel(blockStart)}
                            </div>
                            {days.map((day, dayIndex) => {
                              const cellData = heatmapData.find(cell => 
                                cell.dayIndex === dayIndex && cell.startHour === blockStart
                              );
                              const hasData = cellData && cellData.postCount > 0;
                              
                              return (
                                <div
                                  key={`${dayIndex}-${blockStart}`}
                                  className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ${
                                    getHeatmapColor(cellData?.intensity || 0, !!hasData)
                                  }`}
                                  title={hasData 
                                    ? `${day} ${cellData.timeBlock}: ${cellData.engagementScore} score (${cellData.postCount} posts)`
                                    : `${day} ${getTimeBlockLabel(blockStart)}: No posts`
                                  }
                                >
                                  {hasData ? cellData.postCount : ''}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 text-center mt-3">
                      Numbers show post count • Hover for details • Each block covers 3 hours
                    </div>
                  </div>
                </ViewTracker>

                {/* Top 5 Time Slots */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🏆</span>
                    Top 5 Time Slots (Individual Hours)
                  </h3>
                  <div className="space-y-3">
                    {timeSlots.slice(0, 5).map((slot, index) => (
                      <ViewTracker
                        key={index}
                        featureName={`timing_slot_${index + 1}`}
                        metadata={{
                          time_slot: slot.time,
                          engagement_score: slot.engagementScore,
                          post_count: slot.postCount
                        }}
                      >
                        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-3 border border-purple-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">#{index + 1}</span>
                              </div>
                              <span className="font-semibold text-gray-900">{slot.time}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-purple-700">{slot.engagementScore}</div>
                              <div className="text-xs text-gray-600">score</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-900">{slot.avgLikes}</div>
                              <div className="text-xs text-gray-600">Avg Likes</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-900">{slot.avgComments}</div>
                              <div className="text-xs text-gray-600">Avg Comments</div>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                              <div className="text-sm font-bold text-gray-900">{slot.avgReach}</div>
                              <div className="text-xs text-gray-600">Avg Reach</div>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500 text-center">
                            Based on {slot.postCount} posts
                          </div>
                        </div>
                      </ViewTracker>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-2xl">⏰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timing Data Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Once you have more posts, we'll analyze your optimal posting times.
                </p>
                <p className="text-purple-700 text-sm">
                  Currently analyzing {instagramData?.recentPosts?.length || 0} posts.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (category.id === 'frequency') {
      // NEW: Frequency optimization view
      const frequencyData = instagramData?.recentPosts ? calculateFrequencyOptimization(instagramData.recentPosts) : null;

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-orange-50 to-red-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-orange-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker
              featureName="frequency_optimization_back"
              metadata={{ category: 'frequency' }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-orange-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">📈</span>
              <h1 className="text-xl font-bold text-gray-900">Frequency Optimization</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-orange-100 to-red-100 border-orange-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">How Often You Should Post</h2>
              <p className="text-orange-800 text-sm">
                {frequencyData 
                  ? `Analysis based on your posting patterns and engagement data.`
                  : 'Post more content to get personalized frequency recommendations.'
                }
              </p>
            </div>

            {frequencyData ? (
              <>
                {/* Current vs Optimal Frequency */}
                <ViewTracker
                  featureName="frequency_comparison"
                  metadata={{
                    current_frequency: frequencyData.currentFrequency,
                    optimal_frequency: frequencyData.optimalFrequency
                  }}
                >
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">{frequencyData.currentFrequency}</div>
                      <div className="text-sm text-blue-600">Posts/Week</div>
                      <div className="text-xs text-gray-600 mt-1">Current Frequency</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{frequencyData.optimalFrequency}</div>
                      <div className="text-sm text-green-600">Posts/Week</div>
                      <div className="text-xs text-gray-600 mt-1">Optimal Frequency</div>
                    </div>
                  </div>
                </ViewTracker>

                {/* Performance by Frequency */}
                <ViewTracker
                  featureName="frequency_performance_analysis"
                  metadata={{
                    frequency_buckets: frequencyData.performanceByFrequency.length
                  }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="mr-2">📊</span>
                      Performance by Frequency
                    </h3>
                    
                    <div className="space-y-3">
                      {frequencyData.performanceByFrequency.map((bucket, index) => (
                        <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{bucket.range}</span>
                            <div className="text-right">
                              <div className="text-sm font-bold text-orange-700">{bucket.avgEngagement}</div>
                              <div className="text-xs text-gray-600">avg engagement</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-orange-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                style={{ 
                                  width: `${Math.max(10, (bucket.avgEngagement / Math.max(...frequencyData.performanceByFrequency.map(b => b.avgEngagement))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{bucket.postCount} posts</span>
                          </div>
                          
                          {index === 0 && (
                            <div className="mt-2">
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Best Performing
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ViewTracker>

                {/* Weekly Pattern */}
                {frequencyData.weeklyPattern.length > 0 && (
                  <ViewTracker
                    featureName="frequency_weekly_pattern"
                    metadata={{
                      weeks_analyzed: frequencyData.weeklyPattern.length
                    }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">📅</span>
                        Recent Weekly Pattern
                      </h3>
                      
                      <div className="space-y-2">
                        {frequencyData.weeklyPattern.slice(-6).map((week, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                            <span className="text-sm text-gray-700">{week.week}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-900">{week.postCount} posts</span>
                              <span className="text-sm text-orange-600">{week.avgEngagement} avg engagement</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ViewTracker>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 text-2xl">📈</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need More Data</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Post more content to get personalized frequency recommendations.
                </p>
                <p className="text-orange-700 text-sm">
                  Currently analyzing {instagramData?.recentPosts?.length || 0} posts.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (category.id === 'insights') {
      // Real Top Followers view using actual comment data
      const realTopFollowers = instagramData?.topFollowers || [];
      
      const getEngagementColor = (type: 'high' | 'medium' | 'regular') => {
        switch (type) {
          case 'high': return 'from-green-400 to-emerald-500';
          case 'medium': return 'from-blue-400 to-cyan-500';
          default: return 'from-gray-400 to-gray-500';
        }
      };
      
      const getEngagementBadge = (type: 'high' | 'medium' | 'regular') => {
        switch (type) {
          case 'high': return { text: 'Super Fan', color: 'bg-green-100 text-green-800' };
          case 'medium': return { text: 'Active', color: 'bg-blue-100 text-blue-800' };
          default: return { text: 'Regular', color: 'bg-gray-100 text-gray-600' };
        }
      };
      
      const formatLastSeen = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        return date.toLocaleDateString();
      };

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-violet-50 to-purple-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-violet-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker
              featureName="top_followers_back"
              metadata={{ followers_count: realTopFollowers.length }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-violet-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">👥</span>
              <h1 className="text-xl font-bold text-gray-900">Top Followers</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200 rounded-2xl p-4 mb-4 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                {realTopFollowers.length > 0 ? 'Your Most Engaged Followers' : 'Top Engaged Community'}
              </h2>
              <p className="text-violet-800 text-sm">
                {realTopFollowers.length > 0 
                  ? `Based on real comment and interaction data from your recent posts.`
                  : 'Connect your Instagram account and post content to see real follower engagement data.'
                }
              </p>
            </div>

            {realTopFollowers.length > 0 ? (
              <ViewTracker
                featureName="top_followers_list"
                metadata={{
                  total_followers: realTopFollowers.length,
                  super_fans: realTopFollowers.filter(f => f.engagementType === 'high').length
                }}
              >
                <div className="space-y-3">
                  {realTopFollowers.map((follower, index) => {
                    const badge = getEngagementBadge(follower.engagementType);
                    return (
                      <ViewTracker
                        key={index}
                        featureName={`top_follower_${index + 1}`}
                        metadata={{
                          engagement_type: follower.engagementType,
                          interactions: follower.interactions
                        }}
                      >
                        <div className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-start space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                              <span className="text-white text-sm font-bold">
                                {follower.username.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 text-sm truncate">@{follower.username}</h3>
                                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${badge.color}`}>
                                    {badge.text}
                                  </span>
                                </div>
                                <div className="text-right ml-3 flex-shrink-0">
                                  <div className="text-xl font-bold text-violet-700">{follower.interactions}</div>
                                  <div className="text-xs text-gray-600">interactions</div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center border border-violet-200/30">
                                  <div className="text-sm font-semibold text-violet-700">{follower.comments}</div>
                                  <div className="text-xs text-gray-600">comments</div>
                                </div>
                                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center border border-violet-200/30">
                                  <div className="text-sm font-semibold text-violet-700">{follower.likes}</div>
                                  <div className="text-xs text-gray-600">comment likes</div>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Last seen {formatLastSeen(follower.lastSeen)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </ViewTracker>
                    );
                  })}
                </div>
              </ViewTracker>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-violet-600 text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Comment Data Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Once people start commenting on your posts, you'll see your most engaged followers here.
                </p>
                <p className="text-violet-700 text-sm">
                  Currently analyzing {instagramData?.recentPosts?.length || 0} recent posts for engagement patterns.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (category.id === 'content_categories') {
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
          <button 
            onClick={() => setSelectedMetricCategory(null)}
            className="mr-3 text-indigo-600 font-medium"
          >
            ← Back
          </button>
          <div className="flex items-center">
            <span className="mr-2">🏷️</span>
            <h1 className="text-xl font-bold text-gray-900">Content Categories</h1>
          </div>
        </div>

        <div className="p-4">
          {/* Progress Overview */}
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-200 rounded-2xl p-4 mb-6 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Content Strategy Analysis</h2>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-indigo-800 text-sm">
                {instagramData?.taggingProgress?.taggedPosts || 0} of {instagramData?.taggingProgress?.totalPosts || 0} posts tagged
              </span>
              <span className="text-indigo-700 font-bold">
                {instagramData?.taggingProgress?.completionPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-indigo-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${instagramData?.taggingProgress?.completionPercentage || 0}%` }}
              ></div>
            </div>

            {/* Feature Unlocks */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'Basic Insights', unlock: 5, unlocked: instagramData?.unlockedFeatures?.basicInsights },
                { name: 'Timing Analysis', unlock: 15, unlocked: instagramData?.unlockedFeatures?.timingAnalysis },
                { name: 'Cross-Analysis', unlock: 25, unlocked: instagramData?.unlockedFeatures?.crossAnalysis },
                { name: 'Full Strategy', unlock: 100, unlocked: instagramData?.unlockedFeatures?.fullStrategy }
              ].map((feature) => (
                <div key={feature.name} className={`p-2 rounded-lg text-xs ${
                  feature.unlocked 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}>
                  <div className="flex items-center space-x-1">
                    <span>{feature.unlocked ? '✅' : '🔒'}</span>
                    <span className="font-medium">{feature.name}</span>
                  </div>
                  <div className="text-xs opacity-75">
                    {feature.unlock === 100 ? 'All posts' : `${feature.unlock} posts`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Three Analysis Views Toggle */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
            <div className="flex bg-indigo-50 rounded-xl p-1 border border-indigo-200">
              {[
                { key: 'categories' as const, label: 'By Topic', count: instagramData?.categoryStats?.length || 0 },
                { key: 'formats' as const, label: 'By Format', count: instagramData?.formatStats?.length || 0 },
                { key: 'cross-analysis' as const, label: 'Cross Analysis', count: instagramData?.crossAnalysisStats?.length || 0 }
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => setContentView(view.key)}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                    contentView === view.key
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  <div>{view.label}</div>
                  <div className="text-xs opacity-75">({view.count})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Category Performance View */}
          {contentView === 'categories' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Performance by Topic ({instagramData?.categoryStats?.length || 0} categories)
              </h3>
              {instagramData?.categoryStats && instagramData.categoryStats.length > 0 ? (
                <div className="space-y-4">
                  {instagramData.categoryStats.map((category, index) => (
                    <div key={category.content_category} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900">{category.content_category}</span>
                            <p className="text-xs text-gray-600">{category.count} posts</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-blue-700">
                            {formatNumber(category.avg_likes + category.avg_comments)} eng/post
                          </div>
                          <div className="text-xs text-gray-600">avg engagement</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="font-bold text-gray-900">{formatNumber(category.avg_likes)}</span>
                          </div>
                          <div className="text-xs text-gray-600">Avg Likes</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="font-bold text-gray-900">{formatNumber(category.avg_comments)}</span>
                          </div>
                          <div className="text-xs text-gray-600">Avg Comments</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="font-bold text-gray-900">{formatNumber(category.avg_reach || 0)}</span>
                          </div>
                          <div className="text-xs text-gray-600">Avg Reach</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">No Category Data Yet</h3>
                  <p className="text-gray-600 text-sm">Tag at least 5 posts to see category performance insights.</p>
                </div>
              )}
            </div>
          )}

          {/* Format Performance View - Always works without tagging */}
{contentView === 'formats' && (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
      <span className="mr-2">📱</span>
      Performance by Post Format ({instagramData?.formatStats?.length || 0} formats)
    </h3>
    
    {instagramData?.formatStats && instagramData.formatStats.length > 0 ? (
      <div className="space-y-4">
        {instagramData.formatStats.map((format, index) => {
          // Configuration for different format types
          const formatConfig = {
            'Reels': { 
              emoji: '🎬', 
              color: 'from-purple-500 to-pink-500', 
              bgColor: 'from-purple-50 to-pink-50', 
              borderColor: 'border-purple-200' 
            },
            'Carousels': { 
              emoji: '📸', 
              color: 'from-blue-500 to-indigo-500', 
              bgColor: 'from-blue-50 to-indigo-50', 
              borderColor: 'border-blue-200' 
            },
            'Post': { 
              emoji: '📝', 
              color: 'from-green-500 to-emerald-500', 
              bgColor: 'from-green-50 to-emerald-50', 
              borderColor: 'border-green-200' 
            }
          };

          const config = formatConfig[format.post_type as keyof typeof formatConfig] || {
            emoji: '📱',
            color: 'from-gray-500 to-gray-600',
            bgColor: 'from-gray-50 to-gray-100',
            borderColor: 'border-gray-200'
          };

          return (
            <div key={format.post_type} className={`bg-gradient-to-br ${config.bgColor} ${config.borderColor} rounded-2xl p-4 shadow-sm border`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <span className="text-lg font-bold text-gray-900">{format.post_type}</span>
                    </div>
                    <div className="text-sm text-gray-600">{format.count} posts analyzed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                    {format.engagement_rate}
                  </div>
                  <div className="text-xs text-gray-600">Engagement Rate</div>
                </div>
              </div>
              
              {/* Metrics Grid - Same as old implementation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-gray-900">{format.avg_likes}</span>
                  </div>
                  <div className="text-xs text-gray-600">Avg Likes</div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-semibold text-gray-900">{format.avg_comments}</span>
                  </div>
                  <div className="text-xs text-gray-600">Avg Comments</div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {format.avg_reach >= 1000 ? `${(format.avg_reach / 1000).toFixed(1)}K` : format.avg_reach}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Avg Reach</div>
                </div>
                
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-gray-900">
                      {format.avg_impressions >= 1000 ? `${(format.avg_impressions / 1000).toFixed(1)}K` : format.avg_impressions}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">Avg Impressions</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-600 text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Content Data Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          Connect your Instagram account and post different types of content to see performance analysis.
        </p>
        <p className="text-gray-700 text-sm">
          We'll analyze Reels, Carousels, and Posts once you have data.
        </p>
      </div>
    )}
  </div>
)}

{/* Cross Analysis Performance View */}
{contentView === 'cross-analysis' && (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
      <span className="mr-2">🎯</span>
      Cross-Format Performance ({instagramData?.crossAnalysisStats?.length || 0} combinations)
    </h3>
    
    {instagramData?.crossAnalysisStats && instagramData.crossAnalysisStats.length > 0 ? (
      <div className="space-y-4">
        {instagramData.crossAnalysisStats.map((item, index) => (
          <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">#{index + 1}</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCategoryEmoji(item.content_category)}</span>
                    <span className="font-semibold text-gray-900">{item.content_category}</span>
                    <span className="text-sm text-gray-500">×</span>
                    <span className="text-lg">{getFormatEmoji(item.post_type)}</span>
                    <span className="font-semibold text-gray-900">{getFormatType(item.post_type)}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.count} posts</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-indigo-700">
                  {formatNumber(item.avg_likes + item.avg_comments)} eng/post
                </div>
                <div className="text-xs text-gray-600">avg engagement</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className="font-bold text-gray-900">{formatNumber(item.avg_likes)}</span>
                </div>
                <div className="text-xs text-gray-600">Avg Likes</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-gray-900">{formatNumber(item.avg_comments)}</span>
                </div>
                <div className="text-xs text-gray-600">Avg Comments</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-bold text-gray-900">{formatNumber(item.avg_reach || 0)}</span>
                </div>
                <div className="text-xs text-gray-600">Avg Reach</div>
              </div>
            </div>
            
            {/* Top Performer Badge (only for #1) */}
            {index === 0 && (
              <div className="mt-3 bg-indigo-100 rounded-lg p-2">
                <div className="flex items-center space-x-1">
                  <span className="text-indigo-600">🏆</span>
                  <span className="text-sm font-medium text-indigo-800">Top Performing Combination</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🎯</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">No Cross-Analysis Data Yet</h3>
        <p className="text-gray-600 text-sm mb-4">
          Tag posts with categories to see how topics perform across different formats.
        </p>
        <div className="mt-4 bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>Cross-analysis shows:</strong> How your content categories perform 
            when combined with different formats (Reels, Posts, Carousels)
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            Need at least 2 posts per category-format combination for reliable insights
          </p>
        </div>
      </div>
    )}
  </div>
)}

          {/* Quick Tagging Section */}
          {instagramData?.untaggedPosts && instagramData.untaggedPosts.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick Tag ({instagramData.untaggedPosts.length}+ untagged posts)
              </h3>
              
              <div className="space-y-3">
                {instagramData.untaggedPosts.slice(0, 3).map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium line-clamp-2">
                        {post.caption?.slice(0, 80) || 'No caption'}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {getFormatName(post.post_type)} • {new Date(post.published_at).toLocaleDateString()} • 
                        {post.likes_count} likes, {post.comments_count} comments
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedPostsForTagging([post.instagram_post_id]);
                        setShowTaggingModal(true);
                      }}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors ml-3"
                    >
                      Tag
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (category.id === 'sentiment_analysis') {
      const sentimentData = instagramData?.recentPosts ? analyzeSentiment(instagramData.recentPosts) : null;

      // Track when user enters sentiment detail view
      useEffect(() => {
        trackFeature('sentiment_analysis_detail', 'view', {
          has_data: !!sentimentData,
          total_comments: sentimentData?.overallSentiment.totalComments || 0
        })
      }, [sentimentData])

      // Debug logging to verify sentiment data
useEffect(() => {
  if (sentimentData) {
    console.log('Sentiment Analysis in Detail View:', {
      hasData: !!sentimentData,
      timeAnalysisLength: sentimentData.timeAnalysis?.length || 0,
      months: sentimentData.timeAnalysis?.map(m => m.month) || [],
      totalComments: sentimentData.overallSentiment?.totalComments || 0,
      firstMonth: sentimentData.timeAnalysis?.[0]?.month,
      lastMonth: sentimentData.timeAnalysis?.[sentimentData.timeAnalysis.length - 1]?.month
    });
  }
}, [sentimentData]);

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-pink-50 to-rose-50">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-sm border-b border-pink-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker
              featureName="sentiment_analysis_back"
              metadata={{ has_data: !!sentimentData }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-pink-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">💭</span>
              <h1 className="text-xl font-bold text-gray-900">Audience Sentiment</h1>
            </div>
          </div>

          <div className="p-4">
            {/* Overview */}
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 border-pink-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">How Your Audience Feels</h2>
              <p className="text-pink-800 text-sm">
  {sentimentData && sentimentData.overallSentiment.totalComments > 0
    ? `Real sentiment analysis based on ${sentimentData.overallSentiment.totalComments} actual comments from your posts. ${
        sentimentData.timeAnalysis.length > 0 
          ? `Historical data spans ${sentimentData.timeAnalysis.length} month${sentimentData.timeAnalysis.length > 1 ? 's' : ''}.` 
          : ''
      }`
    : 'Post content that encourages comments to see real sentiment analysis from actual comment text.'
  }
</p>
            </div>

            {sentimentData && sentimentData.overallSentiment.totalComments > 0 ? (
              <>
                {/* Overall Sentiment Breakdown */}
                <ViewTracker
                  featureName="sentiment_overview"
                  metadata={{
                    positive_percentage: sentimentData.overallSentiment.positive,
                    negative_percentage: sentimentData.overallSentiment.negative,
                    total_comments: sentimentData.overallSentiment.totalComments
                  }}
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Overall Sentiment Breakdown
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center bg-green-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-600">{sentimentData.overallSentiment.positive}%</div>
                        <div className="text-sm text-green-700">Positive</div>
                        <div className="text-xs text-gray-600 mt-1">reactions</div>
                      </div>
                      <div className="text-center bg-gray-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-gray-600">{sentimentData.overallSentiment.neutral}%</div>
                        <div className="text-sm text-gray-700">Neutral</div>
                        <div className="text-xs text-gray-600 mt-1">reactions</div>
                      </div>
                      <div className="text-center bg-red-50 rounded-xl p-4">
                        <div className="text-2xl font-bold text-red-600">{sentimentData.overallSentiment.negative}%</div>
                        <div className="text-sm text-red-700">Negative</div>
                        <div className="text-xs text-gray-600 mt-1">reactions</div>
                      </div>
                    </div>

                    {/* Sentiment Score */}
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 border border-pink-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Overall Sentiment Score</span>
                          <p className="text-xs text-gray-600">Higher scores indicate more positive audience reactions</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            sentimentData.insights.averageSentimentScore > 20 ? 'text-green-600' :
                            sentimentData.insights.averageSentimentScore > 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {sentimentData.insights.averageSentimentScore > 0 ? '+' : ''}{sentimentData.insights.averageSentimentScore}
                          </div>
                          <div className="text-xs text-gray-600">
                            {sentimentData.insights.averageSentimentScore > 20 ? 'Excellent' :
                             sentimentData.insights.averageSentimentScore > 0 ? 'Good' : 'Needs Work'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ViewTracker>

                {/* Sentiment by Tagged Categories */}
                {instagramData?.categoryStats && instagramData.categoryStats.length > 0 ? (
                  <ViewTracker
                    featureName="sentiment_by_categories"
                    metadata={{
                      categories_analyzed: instagramData.categoryStats.length,
                      tagged_posts: instagramData.categoryStats.reduce((sum, cat) => sum + cat.count, 0)
                    }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="mr-2">🏷️</span>
                        Sentiment by Content Category
                      </h3>
                      
                      <div className="space-y-3">
                        {(() => {
                          const categoryAnalysis = getCategorySentimentData(instagramData);
                          return categoryAnalysis?.map((category, index) => {
                            const emoji = getCategoryEmoji(category.category);
                            
                            return (
                              <div key={category.category} className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xl">{emoji}</span>
                                    <div>
                                      <span className="font-medium text-gray-900">{category.category}</span>
                                      <p className="text-xs text-gray-600">{category.postCount} posts tagged</p>
                                    </div>
                                  </div>
                                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                                    category.sentiment_score > 20 ? 'bg-green-100 text-green-700' :
                                    category.sentiment_score > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {category.sentiment_score > 0 ? '+' : ''}{category.sentiment_score}
                                  </span>
                                </div>
                                
                                {/* Visual sentiment bar */}
                                <div className="flex rounded-lg overflow-hidden h-3 mb-2">
                                  <div 
                                    className="bg-green-500"
                                    style={{width: `${category.positive}%`}}
                                  ></div>
                                  <div 
                                    className="bg-gray-400"
                                    style={{width: `${category.neutral}%`}}
                                  ></div>
                                  <div 
                                    className="bg-red-500"
                                    style={{width: `${category.negative}%`}}
                                  ></div>
                                </div>
                                
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>{category.positive}% positive</span>
                                  <span>~{category.totalComments} comments</span>
                                  <span>{category.negative}% negative</span>
                                </div>
                                
                                {/* Engagement context */}
                                <div className="mt-2 text-xs text-gray-500 text-center">
                                  Avg engagement: {category.avgEngagement} per post
                                </div>
                              </div>
                            );
                          }) || [];
                        })()}
                      </div>
                      
                      <div className="mt-4 bg-pink-50 rounded-lg p-3 border border-pink-200">
                        <p className="text-sm text-pink-800">
                          <strong>💡 Note:</strong> Sentiment analysis for categories is estimated based on engagement patterns. 
                          Higher engagement categories typically receive more positive reactions.
                        </p>
                      </div>
                    </div>
                  </ViewTracker>
                ) : (
                  /* Show message about needing tagged posts */
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🏷️</span>
                      Sentiment by Content Category
                    </h3>
                    
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-pink-600 text-2xl">🏷️</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Tag Your Posts First</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        Tag at least 5 posts with categories to see sentiment analysis by content type.
                      </p>
                      <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                        <p className="text-sm text-pink-800">
                          <strong>🚀 Quick Start:</strong> Go to the Content Categories section in your dashboard 
                          to start tagging your posts with categories like "Tutorial", "Behind the Scenes", etc.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-pink-600 text-2xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Comment Data Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Post content that encourages comments to unlock sentiment analysis insights.
                </p>
                <div className="bg-pink-50 rounded-lg p-4 border border-pink-200 max-w-md mx-auto">
                  <h4 className="font-medium text-pink-900 mb-2">💡 Tips to Get Comments</h4>
                  <ul className="text-sm text-pink-800 space-y-1 text-left">
                    <li>• Ask questions in your captions</li>
                    <li>• Share personal stories or experiences</li>
                    <li>• Create polls or "this or that" posts</li>
                    <li>• Respond to comments to encourage more</li>
                    <li>• Post controversial (but respectful) opinions</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default generic metric detail view for other categories
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-10">
          <ClickTracker
            featureName="generic_metric_back"
            metadata={{ category_id: category.id }}
          >
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-blue-500 font-medium"
            >
              ← Back
            </button>
          </ClickTracker>
          <div className="flex items-center">
            <span className="mr-2">{category.emoji}</span>
            <h1 className="text-xl font-bold text-gray-900">{category.title}</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className={`bg-gradient-to-r ${category.color} rounded-lg p-4 text-white`}>
            <h2 className="text-lg font-bold mb-2">{category.title}</h2>
            <p className="text-white/90 text-sm">{category.description}</p>
          </div>

          <div className="space-y-3">
            {category.metrics.map((metric, index) => (
              <ViewTracker
                key={index}
                featureName={`generic_metric_${metric.name.toLowerCase().replace(/\s+/g, '_')}`}
                metadata={{ 
                  category: category.id,
                  metric_value: metric.value,
                  trend: metric.trend
                }}
              >
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">{metric.value}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        metric.trend === 'up' ? 'bg-green-500' : 
                        metric.trend === 'down' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                  {metric.detail && (
                    <div className="text-xs text-gray-500 mb-2">{metric.detail}</div>
                  )}
                  <div className="h-12 bg-gray-50 rounded-md flex items-center justify-center">
                    <TrendingUp className={`w-6 h-6 ${
                      metric.trend === 'up' ? 'text-green-500' : 
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} performance
                  </div>
                </div>
              </ViewTracker>
            ))}
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Key Insights</h3>
            <p className="text-blue-800 text-sm">
              {category.id === 'growth' && instagramData && `You have ${instagramData.followers.toLocaleString()} followers${instagramData?.accountInsights?.profile_visits ? ` with ${instagramData.accountInsights.profile_visits.toLocaleString()} profile visits in the last 30 days.` : '.'}`}
              {category.id === 'engagement' && instagramData && `Your engagement rate is ${instagramData.engagementRate}.${instagramData?.avgReach ? ` Your posts reach an average of ${instagramData.avgReach.toLocaleString()} people.` : ''} Consider asking more questions in your captions to boost engagement.`}
              {category.id === 'content' && instagramData?.recentPosts && instagramData.recentPosts.length > 0 && `You have ${instagramData.recentPosts.length} posts to analyze. Different content types perform differently with your audience.`}
              {!instagramData && 'Connect your Instagram account to see personalized insights and recommendations.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Data for different time periods using real data only
  const getMetrics = (period: TimeFrame): Metrics => {
    if (instagramData) {
      // Calculate timeframe-specific metrics from recent posts
      const getTimeframeSpecificMetrics = () => {
        if (!instagramData.recentPosts || instagramData.recentPosts.length === 0) {
          return {
            engagementRate: instagramData.engagementRate || '--',
            avgReach: instagramData.avgReach && instagramData.avgReach > 0 ? 
              (instagramData.avgReach >= 1000 ? `${(instagramData.avgReach / 1000).toFixed(1)}K` : instagramData.avgReach.toString()) : 
              '--'
          };
        }

        const now = new Date();
        const daysBack = period === 'weekly' ? 7 : 30;
        const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

        // Filter posts within the timeframe
        const timeframePosts = instagramData.recentPosts.filter(post => {
          const postDate = new Date(post.timestamp);
          return postDate >= cutoffDate;
        });

        if (timeframePosts.length === 0) {
          return {
            engagementRate: '--',
            avgReach: '--'
          };
        }

        // Calculate engagement rate for timeframe
        const totalLikes = timeframePosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const totalComments = timeframePosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalReach = timeframePosts.reduce((sum, post) => sum + (post.reach || 0), 0);
        const totalEngagement = totalLikes + totalComments;

        let timeframeEngagementRate = '--';
        if (totalReach > 0) {
          // Calculate based on actual reach
          const rate = (totalEngagement / totalReach) * 100;
          timeframeEngagementRate = `${rate.toFixed(1)}%`;
        } else if (instagramData.followers > 0) {
          // Fallback to follower-based calculation
          const avgFollowersReached = instagramData.followers * timeframePosts.length;
          const rate = (totalEngagement / avgFollowersReached) * 100;
          timeframeEngagementRate = `${rate.toFixed(1)}%`;
        }

        // Calculate avg reach for timeframe
        let timeframeAvgReach = '--';
        if (totalReach > 0) {
          const avgReach = Math.round(totalReach / timeframePosts.length);
          timeframeAvgReach = avgReach >= 1000 ? 
            `${(avgReach / 1000).toFixed(1)}K` : 
            avgReach.toString();
        }

        return {
          engagementRate: timeframeEngagementRate,
          avgReach: timeframeAvgReach
        };
      };

      const timeframeMetrics = getTimeframeSpecificMetrics();

      return {
        weekly: {
          growth: instagramData.growthData?.canCalculateWeekly ? instagramData.growthRate || '--' : '--',
          engagement: timeframeMetrics.engagementRate,
          reach: timeframeMetrics.avgReach,
          timeLabel: 'This Week'
        },
        monthly: {
          growth: instagramData.growthData?.canCalculateMonthly ? instagramData.monthlyGrowth || '--' : '--',
          engagement: timeframeMetrics.engagementRate,
          reach: timeframeMetrics.avgReach,
          timeLabel: 'This Month'
        }
      }[period];
    }

    // No Instagram data - return dashes for all metrics
    return {
      growth: '--',
      engagement: '--',
      reach: '--',
      timeLabel: period === 'weekly' ? 'This Week' : 'This Month'
    };
  };

  const DashboardContent = () => {
    const metrics = getMetrics(timeFrame);
    
    if (selectedMetricCategory) {
      const category = metricCategories.find(cat => cat.id === selectedMetricCategory);
      if (!category) return null;
      return <MetricDetailView category={category} />;
    }
    
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50/30">
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">SocialSage</h1>
          <div className="flex items-center space-x-2">
  {/* 🆕 NEW: Manual refresh button */}
  <ClickTracker
    featureName="manual_refresh_button"
    metadata={{ 
      last_refresh_ago: lastRefreshTime ? Date.now() - lastRefreshTime.getTime() : null 
    }}
  >
    <button 
      onClick={handleManualRefresh}
      disabled={isLoadingData}
      className={`p-2 rounded-lg transition-colors ${
        isLoadingData 
          ? 'text-gray-400 cursor-not-allowed' 
          : 'text-blue-600 hover:bg-blue-50'
      }`}
      title="Refresh data"
    >
      <div className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`}>
        {isLoadingData ? '⟳' : '↻'}
      </div>
    </button>
  </ClickTracker>
  
  <ClickTracker
    featureName="logout_button"
    metadata={{ session_length: Date.now() - performance.timing?.navigationStart }}
  >
    <button 
      onClick={handleLogout}
      className="text-sm text-red-600 hover:text-red-700 px-3 py-2 rounded-lg min-w-[60px] touch-manipulation"
    >
      Logout
    </button>
  </ClickTracker>
  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
    <Plus className="w-4 h-4 text-white" />
  </div>
</div>
        </div>

        {/* Data loading indicator */}
        {isLoadingData && (
  <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
    <div className="flex items-center space-x-2">
      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      <span className="text-blue-600 text-sm">Refreshing Instagram data...</span>
    </div>
  </div>
)}

{/* 🆕 NEW: Show last refresh time */}
{lastRefreshTime && !isLoadingData && (
  <div className="px-4 py-1 bg-gray-50 border-b border-gray-200">
    <div className="text-xs text-gray-500 text-center">
      Last updated: {lastRefreshTime.toLocaleTimeString()}
    </div>
  </div>
)}

        {/* Data error indicator */}
        {dataError && (
  <div className="px-4 py-2 bg-red-50 border-b border-red-200">
    <div className="flex items-center justify-between">
      <span className="text-red-600 text-sm">⚠️ {dataError}</span>
      <button 
        onClick={handleManualRefresh}
        className="text-red-700 hover:text-red-900 text-sm font-medium"
      >
        Retry
      </button>
    </div>
  </div>
)}

        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <ClickTracker
            featureName="timeframe_selector"
            metadata={{ current_timeframe: timeFrame }}
          >
            <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-white/50">
              {[
                { key: 'weekly' as TimeFrame, label: 'Weekly' },
                { key: 'monthly' as TimeFrame, label: 'Monthly' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => handleTimeFrameChange(period.key)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-xl transition-all ${
                    timeFrame === period.key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </ClickTracker>
        </div>

        <div className="px-4 pb-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="grid grid-cols-2 gap-3">
            <ViewTracker
              featureName="total_followers_metric"
              metadata={{ followers: instagramData?.followers || 0 }}
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
                <div className="text-xl font-bold text-blue-600">
                  {instagramData ? instagramData.followers.toLocaleString() : '0'}
                </div>
                <div className="text-xs text-gray-600">Total Followers</div>
              </div>
            </ViewTracker>
            
            <ViewTracker
              featureName="growth_rate_metric"
              metadata={{ 
                timeframe: timeFrame,
                has_data: timeFrame === 'weekly' ? instagramData?.growthData?.canCalculateWeekly : instagramData?.growthData?.canCalculateMonthly
              }}
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
                {timeFrame === 'weekly' ? (
                  <>
                    {instagramData?.growthData?.canCalculateWeekly ? (
                      <>
                        <div className="text-xl font-bold text-emerald-600">
                          {instagramData.growthRate}
                        </div>
                        <div className="text-xs text-gray-600">Weekly Growth</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-bold text-gray-400">--</div>
                        <div className="text-xs text-gray-500">
                          Available in {instagramData?.growthData?.daysUntilWeekly || 7}d
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {instagramData?.growthData?.canCalculateMonthly ? (
                      <>
                        <div className="text-xl font-bold text-emerald-600">
                          {instagramData.monthlyGrowth}
                        </div>
                        <div className="text-xs text-gray-600">Monthly Growth</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-bold text-gray-400">--</div>
                        <div className="text-xs text-gray-500">
                          Available in {instagramData?.growthData?.daysUntilMonthly || 30}d
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </ViewTracker>
            
            <ViewTracker
              featureName="engagement_rate_metric"
              metadata={{ 
                engagement_rate: metrics.engagement,
                timeframe: timeFrame
              }}
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
                <div className="text-xl font-bold text-purple-600">
                  {metrics.engagement}
                </div>
                <div className="text-xs text-gray-600">
                  Engagement Rate
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {timeFrame === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                </div>
              </div>
            </ViewTracker>
            
            <ViewTracker
              featureName="avg_reach_metric"
              metadata={{ 
                reach: metrics.reach,
                timeframe: timeFrame
              }}
            >
              <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
                <div className="text-xl font-bold text-orange-600">
                  {metrics.reach}
                </div>
                <div className="text-xs text-gray-600">
                  Avg Reach Per Post
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {timeFrame === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                </div>
              </div>
            </ViewTracker>
          </div>
        </div>

        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Grow Your Community</h2>
          <div className="grid grid-cols-2 gap-3">
            {metricCategories.map((category, index) => {
              const cardColors = [
  'bg-gradient-to-br from-emerald-100 to-blue-100 border-emerald-200',   // Combined Growth & Engagement
  'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200',    // Timing
  'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200',     // Frequency  
  'bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-200',        // Content Categories
  'bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200',  // Top Followers
  'bg-gradient-to-br from-pink-100 to-rose-100 border-pink-200'         // Sentiment Analysis (NEW)
];
              return (
                <div key={category.id} className="h-full">
  <ViewTracker
    key={category.id}
    featureName={`metric_category_${category.id}_viewed`}
    metadata={{ 
      category_title: category.title,
      has_instagram_data: !!instagramData
    }}
  >
    <ClickTracker
      featureName={`metric_category_${category.id}`}
      metadata={{ 
        category_title: category.title,
        has_data: !!instagramData,
        metrics_count: category.metrics.length,
        user_followers: instagramData?.followers || 0
      }}
    >
      <button
        onClick={() => handleMetricCategorySelect(category.id)}
        className={`${cardColors[index]} rounded-2xl p-3 shadow-sm border hover:shadow-md transition-all text-left hover:scale-105 transform duration-200 flex flex-col w-full h-[180px]`}
      >
        <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mb-3 shadow-sm flex-shrink-0`}>
          <span className="text-2xl">{category.emoji}</span>
        </div>
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 text-xs mb-1 leading-tight">{category.title}</h3>
          <p className="text-xs text-gray-700 leading-tight mb-2 flex-1 line-clamp-2">{category.description}</p>
          <div className="text-xs text-blue-700 font-medium mt-auto leading-tight">View Details →</div>
        </div>
      </button>
    </ClickTracker>
  </ViewTracker>
</div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PostsContent = () => {
    const [postsView, setPostsView] = useState('recent');
    const [postsTimeFrame, setPostsTimeFrame] = useState<PostsTimeFrame>('weekly');

    // Track posts view changes
    const handlePostsViewChange = (view: string) => {
      setPostsView(view)
      trackFeature('posts_view_change', 'click', {
        new_view: view,
        previous_view: postsView,
        has_instagram_data: !!instagramData
      })
    }

    // Track posts timeframe changes
    const handlePostsTimeFrameChange = (timeframe: PostsTimeFrame) => {
      setPostsTimeFrame(timeframe)
      trackFeature('posts_timeframe_change', 'click', {
        new_timeframe: timeframe,
        previous_timeframe: postsTimeFrame,
        posts_view: postsView
      })
    }

    // Use real posts data if available, otherwise show empty state
    const recentPosts: Post[] = instagramData?.recentPosts?.slice(0, 10).map((post, index) => {
      const avgLikes = instagramData.avgLikes || 0;
      return {
        id: index + 1,
        platform: 'Instagram',
        type: post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post',
        title: truncateCaption(post.caption),
        timestamp: formatDate(post.timestamp),
        thumbnail: 'from-blue-400 to-purple-500',
        metrics: { 
          likes: post.like_count || 0, 
          comments: post.comments_count || 0, 
          saves: post.saves || 0,
          reach: calculateReach(post)
        },
        performance: avgLikes > 0 ? getPerformanceLevel(post.like_count || 0, avgLikes) : 'medium',
        caption: post.caption
      };
    }) || [];

    // Show empty state message if no posts
    const hasNoPosts = recentPosts.length === 0;

    const getTopPosts = (timeframe: PostsTimeFrame): TopPost[] => {
      if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
        return [];
      }

      const now = new Date();
      let cutoffDate: Date;
      
      // Calculate cutoff date based on timeframe
      if (timeframe === 'weekly') {
        cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
      } else if (timeframe === 'monthly') {
        cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
      } else { // annual
        cutoffDate = new Date(now.getFullYear(), 0, 1); // Start of current year
      }
      
      // Filter posts by date range, then sort by performance
      const filteredPosts = instagramData.recentPosts.filter(post => {
        const postDate = new Date(post.timestamp);
        return postDate >= cutoffDate;
      });
      
      // Sort by engagement (likes + comments), then by reach as tiebreaker
      const sortedPosts = filteredPosts.sort((a, b) => {
        const aEngagement = (a.like_count || 0) + (a.comments_count || 0);
        const bEngagement = (b.like_count || 0) + (b.comments_count || 0);
        
        if (aEngagement !== bEngagement) {
          return bEngagement - aEngagement;
        }
        
        // Use reach as tiebreaker
        const aReach = a.reach || 0;
        const bReach = b.reach || 0;
        return bReach - aReach;
      }).slice(0, 10);

      return sortedPosts.map((post) => ({
        title: truncateCaption(post.caption),
        type: post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Post',
        metrics: { 
          likes: post.like_count || 0, 
          comments: post.comments_count || 0, 
          saves: post.saves || 0,
          reach: calculateReach(post)
        },
        performance: 'high' as const,
        caption: post.caption
      }));
    };

    const getPerformanceColor = (performance: Performance) => {
      switch (performance) {
        case 'high': return 'text-green-600 bg-green-50 border-green-200';
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'low': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getPlatformIcon = (platform: string) => {
      switch (platform) {
        case 'Instagram': return { bg: 'from-pink-500 to-orange-500', text: 'IG' };
        case 'Twitter/X': return { bg: 'from-gray-800 to-black', text: 'X' };
        case 'LinkedIn': return { bg: 'from-blue-600 to-blue-700', text: 'IN' };
        default: return { bg: 'from-gray-400 to-gray-500', text: '?' };
      }
    };

    const getTypeEmoji = (type: string) => {
      switch (type) {
        case 'Reel': return '🎬';
        case 'Carousel': return '📸';
        case 'Video': return '🎥';
        default: return '📝';
      }
    };

    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Posts</h1>
          
          <ClickTracker
            featureName="posts_view_toggle"
            metadata={{ has_posts: !hasNoPosts }}
          >
            <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
              {[
                { key: 'recent', label: 'Recent Posts' },
                { key: 'top', label: 'Top Posts' }
              ].map((view) => (
                <button
                  key={view.key}
                  onClick={() => handlePostsViewChange(view.key)}
                  className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                    postsView === view.key
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </ClickTracker>

          {postsView === 'top' && (
            <ClickTracker
              featureName="top_posts_timeframe"
              metadata={{ current_timeframe: postsTimeFrame }}
            >
              <div className="flex bg-blue-50 rounded-lg p-1 border border-blue-200">
                {[
                  { key: 'weekly' as PostsTimeFrame, label: 'Week' },
                  { key: 'monthly' as PostsTimeFrame, label: 'Month' },
                  { key: 'annual' as PostsTimeFrame, label: 'Year' }
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => handlePostsTimeFrameChange(period.key)}
                    className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all ${
                      postsTimeFrame === period.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </ClickTracker>
          )}
        </div>

        <div className="p-4 space-y-3">
          {postsView === 'recent' ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
                <div className="text-sm text-gray-500">{recentPosts.length} posts</div>
              </div>
              {hasNoPosts ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-600 text-sm">
                    Connect your Instagram account and start posting to see your content analytics here.
                  </p>
                </div>
              ) : (
                recentPosts.map((post) => {
                  const platformIcon = getPlatformIcon(post.platform);
                  const cardColors = [
                    'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
                    'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200',
                    'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
                    'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
                    'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200',
                    'bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-200',
                    'bg-gradient-to-br from-red-50 to-pink-50 border-red-200',
                    'bg-gradient-to-br from-green-50 to-lime-50 border-green-200',
                    'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200',
                    'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                  ];
                  return (
                    <ViewTracker
                      key={post.id}
                      featureName={`recent_post_${post.id}`}
                      metadata={{
                        post_type: post.type,
                        performance: post.performance,
                        likes: post.metrics.likes,
                        engagement: post.metrics.likes + post.metrics.comments
                      }}
                    >
                      <div className={`${cardColors[(post.id - 1) % cardColors.length]} rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all`}>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{post.title}</h3>
                              <div className="flex items-center space-x-2">
                                <div className={`w-4 h-4 bg-gradient-to-br ${platformIcon.bg} rounded-full flex items-center justify-center`}>
                                  <span className="text-white text-xs font-bold">{platformIcon.text}</span>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">{post.type}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{post.timestamp}</span>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPerformanceColor(post.performance)}`}>
                              {post.performance}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-5 gap-3 text-center">
                            <div className="bg-white/60 rounded-lg p-3">
                              <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-900">{post.metrics.likes.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Likes</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-900">{post.metrics.comments}</div>
                              <div className="text-xs text-gray-600">Comments</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <Bookmark className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-900">{post.metrics.saves}</div>
                              <div className="text-xs text-gray-600">Saves</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-900">{post.metrics.reach}</div>
                              <div className="text-xs text-gray-600">Reach</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3">
                              <BarChart3 className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                              <div className="text-sm font-bold text-gray-900">
                                {post.metrics.reach !== '--' && post.metrics.likes > 0 ? 
                                  `${(((post.metrics.likes + post.metrics.comments) / (parseInt(post.metrics.reach.replace('K', '000').replace('.', '')) || post.metrics.likes + post.metrics.comments)) * 100).toFixed(1)}%` : 
                                  '--'
                                }
                              </div>
                              <div className="text-xs text-gray-600">Eng Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ViewTracker>
                  );
                })
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top Posts {postsTimeFrame === 'weekly' ? 'This Week' : postsTimeFrame === 'monthly' ? 'This Month' : 'This Year'}
                </h2>
                <div className="text-sm text-gray-500">{getTopPosts(postsTimeFrame).length > 0 ? `Top ${getTopPosts(postsTimeFrame).length}` : 'No posts'}</div>
              </div>
              {getTopPosts(postsTimeFrame).length > 0 ? (
                getTopPosts(postsTimeFrame).map((post, index) => (
                  <ViewTracker
                    key={index}
                    featureName={`top_post_${index + 1}`}
                    metadata={{
                      timeframe: postsTimeFrame,
                      post_type: post.type,
                      ranking: index + 1,
                      engagement: post.metrics.likes + post.metrics.comments
                    }}
                  >
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">#{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm mb-1">{post.title}</h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-600 font-medium">{getTypeEmoji(post.type)} {post.type}</span>
                                <div className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200">
                                  Top Performer
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-3 text-center">
                          <div className="bg-white/70 rounded-lg p-3">
                            <Heart className="w-4 h-4 text-red-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">{post.metrics.likes.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">Likes</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-3">
                            <MessageCircle className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">{post.metrics.comments}</div>
                            <div className="text-xs text-gray-600">Comments</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-3">
                            <Bookmark className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">{post.metrics.saves}</div>
                            <div className="text-xs text-gray-600">Saves</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-3">
                            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">{post.metrics.reach}</div>
                            <div className="text-xs text-gray-600">Reach</div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-3">
                            <BarChart3 className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">
                              {post.metrics.reach !== '--' && post.metrics.likes > 0 ? 
                                `${(((post.metrics.likes + post.metrics.comments) / (parseInt(post.metrics.reach.replace('K', '000').replace('.', '')) || post.metrics.likes + post.metrics.comments)) * 100).toFixed(1)}%` : 
                                '--'
                              }
                            </div>
                            <div className="text-xs text-gray-600">Eng Rate</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ViewTracker>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-amber-600 text-2xl">🏆</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Posts for {postsTimeFrame === 'weekly' ? 'This Week' : postsTimeFrame === 'monthly' ? 'This Month' : 'This Year'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {postsTimeFrame === 'weekly' 
                      ? 'Post some content this week to see your top performers!'
                      : postsTimeFrame === 'monthly'
                      ? 'Post some content this month to see your top performers!'
                      : 'Post some content this year to see your top performers!'
                    }
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const AIInsightsContent = () => {
  const [chatStep, setChatStep] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | string>('');
  const [selectedDefinitionCategory, setSelectedDefinitionCategory] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [userPreference, setUserPreference] = useState('');
  const lastUsedVariationsRef = useRef<{[key: string]: string}>({});

  // Track AI insights usage
  useEffect(() => {
    trackEngagement('ai_insights_opened', {
      has_instagram_data: !!instagramData,
      posts_count: instagramData?.recentPosts?.length || 0,
      followers: instagramData?.followers || 0
    })
  }, [])

  // Enhanced metric options
  const enhancedMetricOptions = [
    { 
      value: 'discovery', 
      label: 'Maximize Growth', 
      description: 'Reach more people and drive profile visits',
      icon: <Target className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      value: 'engagement_quality', 
      label: 'Improve Engagement Quality', 
      description: 'Get more saves and meaningful comments',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600'
    },
    { 
      value: 'timing', 
      label: 'Optimize My Timing', 
      description: 'Post when your content reaches the most people',
      icon: <Clock className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600'
    },
    { 
    value: 'frequency', 
    label: 'Perfect My Posting Frequency', 
    description: 'Find the ideal posting schedule for maximum engagement',
    icon: <BarChart3 className="w-6 h-6" />,
    color: 'from-emerald-500 to-green-600'
  },
    { 
      value: 'ab_testing', 
      label: 'Get A/B Testing Ideas', 
      description: 'Specific tests to optimize your strategy',
      icon: <TestTube className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600'
    },
    { 
      value: 'content_gaps', 
      label: 'Find Content Opportunities', 
      description: 'Identify gaps and missed opportunities',
      icon: <Search className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500'
    },
    {
  value: 'sentiment',
  label: 'Understand Audience Sentiment',
  description: 'See how people really feel about your content',
  icon: <Users className="w-6 h-6" />,
  color: 'from-pink-500 to-rose-600'
},
    { 
      value: 'definitions', 
      label: 'Understand My Metrics', 
      description: 'What do all these numbers mean?',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    setChatStep(metric === 'definitions' ? 5 : 2);
    
    trackFeature('ai_metric_selection', 'click', {
      metric_selected: metric,
      has_instagram_data: !!instagramData
    });
  };

  const resetChat = () => {
    setChatStep(1);
    setSelectedMetric('');
    setUserPreference('');
    setShowDetailedAnalysis(false);
  };

  // Calculate sentiment data once for the entire component
  const sentimentData = useMemo(() => {
    if (!instagramData?.recentPosts) return null;
    return analyzeSentiment(instagramData.recentPosts);
  }, [instagramData?.recentPosts]);

  // Enhanced recommendations based on real data
  const getEnhancedRecommendations = () => {
    if (!instagramData?.recentPosts?.length) {
      return {
        title: "Connect Your Account for Personalized Insights",
        heroInsight: "I need access to your Instagram data to provide meaningful recommendations.",
        sections: []
      };
    }

    // Calculate enhanced metrics
    const discoveryAnalysis = analyzeDiscoveryPotential(instagramData.recentPosts);
    const reachAnalysis = analyzeReachOptimization(instagramData.recentPosts, instagramData.followers);
    const engagementQuality = analyzeEngagementQuality(instagramData.recentPosts);
    const abTestSuggestions = generateABTestSuggestions(instagramData.recentPosts);
    const contentGaps = analyzeContentGaps(instagramData.recentPosts);
    const frequencyData = calculateFrequencyOptimization(instagramData.recentPosts);
    const sentimentAnalysis = analyzeSentiment(instagramData.recentPosts);

    const recommendations = {
      discovery: {
        title: "Growth & Reach Optimization",
        heroInsight: discoveryAnalysis ? 
          `Your ${discoveryAnalysis[0].label} reach ${((discoveryAnalysis[0].avgReach / (discoveryAnalysis[1]?.avgReach || discoveryAnalysis[0].avgReach)) * 100 - 100).toFixed(0)}% more people than your other content. Creating 2 more per week could help you reach an additional ${(discoveryAnalysis[0].avgReach * 2 * 4).toLocaleString()} people monthly.` :
          "I need more posts with reach data to analyze your discovery potential.",
        sections: [
          {
            title: "Your Discovery Power",
            type: "metric",
            value: reachAnalysis ? `${reachAnalysis.reachToFollowerRatio}%` : "Calculating...",
            description: "Your content reaches this percentage of your followers on average",
            status: reachAnalysis ? (parseFloat(reachAnalysis.reachToFollowerRatio) > 70 ? "excellent" : parseFloat(reachAnalysis.reachToFollowerRatio) > 50 ? "good" : "needs-improvement") : "unknown"
          }
        ],
        actions: [
          {
            priority: 1,
            timeframe: "This Week",
            action: discoveryAnalysis ? 
              `Create 2 ${discoveryAnalysis[0].label} - they average ${discoveryAnalysis[0].avgReach.toLocaleString()} reach` :
              "Create more video content for better reach",
            impact: "High Impact",
            expected: discoveryAnalysis ? `+${(discoveryAnalysis[0].avgReach * 2).toLocaleString()} more people reached` : "Improved discovery"
          }
        ]
      },
      engagement_quality: {
        title: "Engagement Quality Analysis",
        heroInsight: engagementQuality ? 
          `Your engagement quality is ${engagementQuality.qualityRating.toLowerCase()} with a ${engagementQuality.avgSaveToLikeRatio}% save rate. ${engagementQuality.highValuePostsPercentage}% of your posts drive high-value engagement.` :
          "I need more engagement data to analyze your content quality.",
        sections: [
          {
            title: "Content Value Score",
            type: "metric", 
            value: engagementQuality ? `${engagementQuality.avgSaveToLikeRatio}%` : "Calculating...",
            description: "Percentage of people who save your posts (higher = more valuable)",
            status: engagementQuality ? (parseFloat(engagementQuality.avgSaveToLikeRatio) > 4 ? "excellent" : parseFloat(engagementQuality.avgSaveToLikeRatio) > 2 ? "good" : "needs-improvement") : "unknown"
          }
        ],
        actions: [
          {
            priority: 1,
            timeframe: "This Week",
            action: engagementQuality && parseFloat(engagementQuality.avgSaveToLikeRatio) < 3 ? 
              "Create educational content that people want to reference later" :
              "Maintain your valuable content strategy",
            impact: "High Impact",
            expected: "Increase save rate to 5%+"
          }
        ]
      },
      frequency: {
    title: "Posting Frequency Optimization",
    heroInsight: frequencyData ? 
      `You're currently posting ${frequencyData.currentFrequency} times per week. Based on your engagement patterns, ${frequencyData.optimalFrequency} posts per week would be optimal. Your consistency score is ${frequencyData.consistencyScore}%.` :
      "I need more posting history to analyze your optimal frequency patterns.",
    sections: [
      {
        title: "Consistency Score",
        type: "metric",
        value: frequencyData ? `${frequencyData.consistencyScore}%` : "Calculating...",
        description: "How regularly you post (higher = more predictable schedule)",
        status: frequencyData ? (frequencyData.consistencyScore > 70 ? "excellent" : frequencyData.consistencyScore > 50 ? "good" : "needs-improvement") : "unknown"
      }
    ],
    actions: [
      {
        priority: 1,
        timeframe: "This Week",
        action: frequencyData ? 
          (frequencyData.currentFrequency < frequencyData.optimalFrequency ? 
            `Increase to ${frequencyData.optimalFrequency} posts/week for better engagement` :
            frequencyData.currentFrequency > frequencyData.optimalFrequency ?
            `Scale back to ${frequencyData.optimalFrequency} posts/week to avoid audience fatigue` :
            "Maintain your current posting frequency - it's optimal!") :
          "Post consistently for 2-3 weeks to unlock frequency insights",
        impact: "High Impact",
        expected: frequencyData ? 
          `${Math.abs(frequencyData.optimalFrequency - frequencyData.currentFrequency) * 15}% improvement in average engagement` :
          "Better audience retention"
      }
    ]
  },
  sentiment: {
  title: "Audience Sentiment Analysis",
  heroInsight: sentimentAnalysis ? 
    `${sentimentAnalysis.overallSentiment.positive}% of comments are positive, ${sentimentAnalysis.overallSentiment.negative}% negative. Your ${sentimentAnalysis.insights.bestContentType || 'content'} generates the most positive reactions, and sentiment is ${sentimentAnalysis.insights.sentimentTrend} over time.` :
    "I need more comments on your posts to analyze audience sentiment patterns.",
  sections: [
    {
      title: "Overall Sentiment Score",
      type: "metric",
      value: sentimentAnalysis ? `${sentimentAnalysis.insights.averageSentimentScore > 0 ? '+' : ''}${sentimentAnalysis.insights.averageSentimentScore}` : "Calculating...",
      description: "How positive your audience feels about your content overall",
      status: sentimentAnalysis ? 
        (sentimentAnalysis.insights.averageSentimentScore > 20 ? "excellent" : 
         sentimentAnalysis.insights.averageSentimentScore > 0 ? "good" : "needs-improvement") : "unknown"
    }
  ],
  actions: [
    {
      priority: 1,
      timeframe: "This Week",
      action: sentimentAnalysis ? 
        (sentimentAnalysis.insights.averageSentimentScore > 20 ? 
          `Keep creating ${sentimentAnalysis.insights.bestContentType} - they generate the most positive sentiment` :
          `Focus on positive content like your ${sentimentAnalysis.insights.bestContentType} to improve sentiment`) :
        "Create engaging content that encourages positive comments",
      impact: "High Impact",
      expected: sentimentAnalysis ? "10-15% improvement in positive sentiment" : "Better audience connection"
    }
  ]
},
      ab_testing: {
        title: "Your A/B Testing Lab",
        heroInsight: abTestSuggestions.length > 0 ? 
          `I found ${abTestSuggestions.length} ready-to-run tests based on your posting patterns. Start with timing tests for quick wins.` :
          "I need more posting history to generate specific A/B test recommendations.",
        sections: [],
        tests: abTestSuggestions.slice(0, 3)
      },
      content_gaps: {
        title: "Content Strategy Gaps",
        heroInsight: contentGaps.length > 0 ? 
          `I identified ${contentGaps.length} content gaps that could be limiting your reach and engagement.` :
          "Your content strategy is well-balanced with no major gaps detected.",
        gaps: contentGaps.slice(0, 3)
      }
    };

    type RecommendationKey = 'discovery' | 'engagement_quality' | 'ab_testing' | 'content_gaps';
    const key = selectedMetric as RecommendationKey;
    return recommendations[key] || recommendations.discovery;
  };

  return (
    <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200/50 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">AI Coach</h1>
          </div>
          {chatStep > 1 && (
            <button 
              onClick={resetChat} 
              className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Welcome Message */}
        <div className="mb-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">👋</span>
                <span className="font-semibold text-gray-900">Hey there!</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                I'm here to help you grow your Instagram with insights based on your actual data. 
                I've analyzed your content and I'm ready to share what's working and where you have the biggest opportunities.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Enhanced Metric Selection */}
        {chatStep === 1 && (
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">🎯</span>
                <span className="font-semibold text-gray-900">What would you like to focus on first?</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {enhancedMetricOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMetricSelect(option.value)}
                    className="text-left p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${option.color} rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-indigo-700">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-indigo-600 mt-1">
                          {option.description}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analysis Results */}
        {chatStep >= 2 && selectedMetric !== 'definitions' && (() => {
          const recommendations = getEnhancedRecommendations();
          
          return (
            <div className="space-y-6">
              {/* User Selection Confirmation */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-xs">
                  <p className="text-sm font-medium">
                    {enhancedMetricOptions.find(opt => opt.value === selectedMetric)?.label}
                  </p>
                </div>
              </div>

              {/* AI Response with Enhanced Results */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
                  
                  {/* Hero Insight Cards for All Sections */}
                  {selectedMetric === 'discovery' && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your Biggest Growth Opportunity</h3>
                          <p className="text-blue-700 text-sm">Based on your recent performance</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">
                          {recommendations.heroInsight}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowDetailedAnalysis(true)}
                        className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
                      >
                        Show Me How →
                      </button>
                    </div>
                  )}

                  {/* Engagement Quality Hero Insight */}
                  {selectedMetric === 'engagement_quality' && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your Engagement Quality Opportunity</h3>
                          <p className="text-purple-700 text-sm">Based on your content value analysis</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">
                          {(() => {
                            const engagementQuality = analyzeEngagementQuality(instagramData?.recentPosts || []);
                            if (engagementQuality) {
                              if (parseFloat(engagementQuality.avgSaveToLikeRatio) > 4) {
                                return `Excellent! Your ${engagementQuality.avgSaveToLikeRatio}% save rate shows people find your content valuable. ${engagementQuality.highValuePostsPercentage}% of your posts drive high-quality engagement.`;
                              } else if (parseFloat(engagementQuality.avgSaveToLikeRatio) > 2) {
                                return `Your ${engagementQuality.avgSaveToLikeRatio}% save rate is good, but we can boost it to 5%+ by creating more educational content. Currently ${engagementQuality.highValuePostsPercentage}% of posts drive high-value engagement.`;
                              } else {
                                return `Your ${engagementQuality.avgSaveToLikeRatio}% save rate has room to grow. Creating more educational, reference-worthy content could double your save rate and improve long-term growth.`;
                              }
                            }
                            return "I need more engagement data to analyze your content quality.";
                          })()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowDetailedAnalysis(true)}
                        className="w-full bg-purple-600 text-white rounded-lg py-3 font-medium hover:bg-purple-700 transition-colors"
                      >
                        Show Quality Breakdown →
                      </button>
                    </div>
                  )}

                  {/* Timing Hero Insight */}
                  {selectedMetric === 'timing' && (
                    <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your Timing Optimization Opportunity</h3>
                          <p className="text-orange-700 text-sm">Based on your posting pattern analysis</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">
                          {(() => {
                            const timingData = instagramData?.recentPosts ? calculateTimingOptimization(instagramData.recentPosts) : null;
                            if (timingData?.timeSlots && timingData.timeSlots.length > 0) {
                              const bestTime = timingData.timeSlots[0];
                              const avgEngagement = instagramData?.avgLikes || 0;
                              const improvement = avgEngagement > 0 ? Math.round(((bestTime.avgLikes - avgEngagement) / avgEngagement) * 100) : 0;
                              return `Your best posting time is ${bestTime.time} with ${bestTime.avgLikes} average likes. This is ${improvement}% better than your overall average - posting consistently at optimal times could significantly boost your reach.`;
                            }
                            return "I need more posts at different times to identify your optimal posting windows.";
                          })()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowDetailedAnalysis(true)}
                        className="w-full bg-orange-600 text-white rounded-lg py-3 font-medium hover:bg-orange-700 transition-colors"
                      >
                        Show Timing Analysis →
                      </button>
                    </div>
                  )}

                  {/* Frequency Hero Insight */}
{selectedMetric === 'frequency' && (
  <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 mb-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
        <BarChart3 className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Your Posting Frequency Opportunity</h3>
        <p className="text-emerald-700 text-sm">Based on your posting patterns and engagement analysis</p>
      </div>
    </div>
    
    <div className="bg-white/80 rounded-xl p-4 mb-4">
      <p className="text-gray-800 leading-relaxed">
        {(() => {
          const frequencyData = instagramData?.recentPosts ? calculateFrequencyOptimization(instagramData.recentPosts) : null;
          if (frequencyData) {
            const difference = Math.abs(frequencyData.optimalFrequency - frequencyData.currentFrequency);
            if (difference === 0) {
              return `Perfect! You're posting ${frequencyData.currentFrequency} times per week, which is optimal for your audience. Your ${frequencyData.consistencyScore}% consistency score shows you're maintaining a${frequencyData.consistencyScore > 70 ? ' great' : 'n okay'} posting rhythm.`;
            } else if (frequencyData.currentFrequency < frequencyData.optimalFrequency) {
              return `You're posting ${frequencyData.currentFrequency} times per week, but ${frequencyData.optimalFrequency} would be optimal. Increasing your frequency could boost engagement by ${difference * 15}%. Your consistency score is ${frequencyData.consistencyScore}%.`;
            } else {
              return `You're posting ${frequencyData.currentFrequency} times per week, but ${frequencyData.optimalFrequency} would be better to avoid audience fatigue. Your consistency score is ${frequencyData.consistencyScore}%.`;
            }
          }
          return "I need more posting history to analyze your optimal frequency patterns.";
        })()}
      </p>
    </div>
    
    <button 
      onClick={() => setShowDetailedAnalysis(true)}
      className="w-full bg-emerald-600 text-white rounded-lg py-3 font-medium hover:bg-emerald-700 transition-colors"
    >
      Show Frequency Breakdown →
    </button>
  </div>
)}

{/* Sentiment Hero Insight */}
{selectedMetric === 'sentiment' && (
  <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-2xl p-6 mb-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
        <Users className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Your Audience Sentiment Insights</h3>
        <p className="text-pink-700 text-sm">Based on comment analysis across your content</p>
      </div>
    </div>
    
    <div className="bg-white/80 rounded-xl p-4 mb-4">
      <p className="text-gray-800 leading-relaxed">
        {(() => {
          if (sentimentData) {
            const { overallSentiment, insights } = sentimentData;
            const trend = insights.sentimentTrend === 'improving' ? 'improving' : 
                         insights.sentimentTrend === 'declining' ? 'declining' : 'staying stable';
            
            return `${overallSentiment.positive}% of your comments are positive, with ${overallSentiment.negative}% negative reactions. Your ${insights.bestContentType || 'content'} performs best with audiences, and sentiment is ${trend} over time. You've analyzed ${overallSentiment.totalComments} comments for accurate insights.`;
          }
          return "I need more comments on your posts to analyze how your audience truly feels about your content.";
        })()}
      </p>
    </div>
    
    <button 
      onClick={() => setShowDetailedAnalysis(true)}
      className="w-full bg-pink-600 text-white rounded-lg py-3 font-medium hover:bg-pink-700 transition-colors"
    >
      Show Sentiment Breakdown →
    </button>
  </div>
)}

                  {/* A/B Testing Hero Insight */}
                  {selectedMetric === 'ab_testing' && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <TestTube className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your A/B Testing Opportunities</h3>
                          <p className="text-green-700 text-sm">Based on your content patterns</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">
                          {(() => {
                            const abTestSuggestions = generateABTestSuggestions(instagramData?.recentPosts || []);
                            if (abTestSuggestions.length > 0) {
                              return `I found ${abTestSuggestions.length} ready-to-run tests based on your posting patterns. Start with ${abTestSuggestions[0].type.toLowerCase()} tests for the highest impact - they have ${abTestSuggestions[0].confidence.toLowerCase()} confidence based on your data.`;
                            }
                            return "I need more posting history to generate specific A/B test recommendations. Post consistently for 2-3 weeks to unlock testing opportunities.";
                          })()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowDetailedAnalysis(true)}
                        className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 transition-colors"
                      >
                        Show Test Ideas →
                      </button>
                    </div>
                  )}

                  {/* Content Gaps Hero Insight */}
                  {selectedMetric === 'content_gaps' && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-6 mb-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Search className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Your Content Strategy Gaps</h3>
                          <p className="text-yellow-700 text-sm">Based on your posting history</p>
                        </div>
                      </div>
                      
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <p className="text-gray-800 leading-relaxed">
                          {(() => {
                            const contentGaps = analyzeContentGaps(instagramData?.recentPosts || []);
                            if (contentGaps.length > 0) {
                              return `I identified ${contentGaps.length} content gaps that could be limiting your reach. The biggest opportunity is: ${contentGaps[0].description.toLowerCase()}.`;
                            }
                            return "Your content strategy is well-balanced! No major gaps detected. You're posting a good variety of content types consistently.";
                          })()}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => setShowDetailedAnalysis(true)}
                        className="w-full bg-yellow-600 text-white rounded-lg py-3 font-medium hover:bg-yellow-700 transition-colors"
                      >
                        Show Gap Analysis →
                      </button>
                    </div>
                  )}

                  {/* Visual Performance Cards */}
                  {showDetailedAnalysis && selectedMetric === 'discovery' && (() => {
                    const discoveryAnalysis = analyzeDiscoveryPotential(instagramData?.recentPosts || []);
                    const reachAnalysis = analyzeReachOptimization(instagramData?.recentPosts || [], instagramData?.followers || 0);
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">Your Performance Snapshot</h4>
                        
                        {/* Growth Power Card */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900">Growth Power</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">
                              {reachAnalysis ? `${reachAnalysis.reachToFollowerRatio}%` : '73%'}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{width: reachAnalysis ? `${Math.min(parseFloat(reachAnalysis.reachToFollowerRatio), 100)}%` : '73%'}}
                            ></div>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            Your content reaches this percentage of your followers on average
                          </p>
                          <p className="text-xs text-green-700 mt-1">
                            ✓ {reachAnalysis && parseFloat(reachAnalysis.reachToFollowerRatio) > 50 ? 'Above average (50%+ is good)' : 'Room for improvement'}
                          </p>
                        </div>

                        {/* Content Type Performance */}
                        {discoveryAnalysis && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-gray-900">Best Content Type</span>
                            </div>
                            
                            <div className="space-y-2">
                              {discoveryAnalysis.slice(0, 3).map((content, index) => {
                                const maxReach = discoveryAnalysis[0].avgReach;
                                const percentage = (content.avgReach / maxReach) * 100;
                                const emoji = content.contentType === 'VIDEO' ? '🎬' : 
                                             content.contentType === 'CAROUSEL_ALBUM' ? '📸' : '📝';
                                const color = index === 0 ? 'purple' : index === 1 ? 'blue' : 'gray';
                                
                                return (
                                  <PerformanceBar
                                    key={content.contentType}
                                    label={`${emoji} ${content.label}`}
                                    value={content.avgReach}
                                    maxValue={maxReach}
                                    color={color}
                                  />
                                );
                              })}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-2">Average reach per post</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Engagement Quality Detailed Analysis */}
                  {showDetailedAnalysis && selectedMetric === 'engagement_quality' && (() => {
                    const engagementQuality = analyzeEngagementQuality(instagramData?.recentPosts || []);
                    const discoveryAnalysis = analyzeDiscoveryPotential(instagramData?.recentPosts || []);
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">Your Engagement Quality Breakdown</h4>
                        
                        {/* Content Value Score Card */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-gray-900">Content Value Score</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">
                              {engagementQuality ? `${engagementQuality.avgSaveToLikeRatio}%` : '2.1%'}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{width: engagementQuality ? `${Math.min(parseFloat(engagementQuality.avgSaveToLikeRatio) * 10, 100)}%` : '21%'}}
                            ></div>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            Percentage of people who save your posts (higher = more valuable)
                          </p>
                          <p className="text-xs text-purple-700 mt-1">
                            {engagementQuality ? (
                              parseFloat(engagementQuality.avgSaveToLikeRatio) > 4 ? '✓ Excellent value content' : 
                              parseFloat(engagementQuality.avgSaveToLikeRatio) > 2 ? '✓ Good, aim for 5%+' : 
                              '⚡ Focus on educational content'
                            ) : '⚡ Focus on educational content'}
                          </p>
                        </div>

                        {/* Engagement Types Breakdown - REMOVED SHARES */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-pink-600" />
                            </div>
                            <span className="font-medium text-gray-900">Engagement Quality Types</span>
                          </div>
                          
                          <div className="space-y-2">
                            <PerformanceBar
                              label="💾 Saves (High Value)"
                              value={engagementQuality ? parseFloat(engagementQuality.avgSaveToLikeRatio) : 2.1}
                              maxValue={10}
                              color="purple"
                            />
                            <PerformanceBar
                              label="💬 Comments (Conversation)"
                              value={engagementQuality ? parseFloat(engagementQuality.avgCommentToLikeRatio) : 7.3}
                              maxValue={20}
                              color="blue"
                            />
                            <PerformanceBar
                              label="❤️ Likes (Basic Engagement)"
                              value={100}
                              maxValue={100}
                              color="gray"
                            />
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-2">
                            High-value posts: {engagementQuality ? `${engagementQuality.highValuePostsPercentage}%` : '34%'} 
                            (saves and deep comments)
                          </p>
                        </div>

                        {/* Top Performing Content by Engagement */}
                        {discoveryAnalysis && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Target className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="font-medium text-gray-900">Best Content for Quality Engagement</span>
                            </div>
                            
                            <div className="space-y-2">
                              {discoveryAnalysis.slice(0, 3).map((content, index) => {
                                const emoji = content.contentType === 'VIDEO' ? '🎬' : 
                                             content.contentType === 'CAROUSEL_ALBUM' ? '📸' : '📝';
                                const color = index === 0 ? 'green' : index === 1 ? 'blue' : 'gray';
                                
                                return (
                                  <PerformanceBar
                                    key={content.contentType}
                                    label={`${emoji} ${content.label}`}
                                    value={content.avgProfileVisits}
                                    maxValue={discoveryAnalysis[0].avgProfileVisits}
                                    color={color}
                                  />
                                );
                              })}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-2">Average profile visits per post (indicates content value)</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Timing Detailed Analysis */}
                  {showDetailedAnalysis && selectedMetric === 'timing' && (() => {
                    const timingData = instagramData?.recentPosts ? calculateTimingOptimization(instagramData.recentPosts) : null;
                    const dayOfWeekPerformance = timingData ? analyzeDayOfWeekPerformance(instagramData?.recentPosts ?? []) : null;
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">Your Timing Analysis</h4>
                        
                        {/* Best Time Performance */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Clock className="w-4 h-4 text-orange-600" />
                              </div>
                              <span className="font-medium text-gray-900">Peak Performance Time</span>
                            </div>
                            <span className="text-2xl font-bold text-orange-600">
                              {timingData?.timeSlots?.[0]?.time || '7:30 PM'}
                            </span>
                          </div>
                          
                          <div className="bg-orange-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-orange-800">
                              <strong>Best Time:</strong> {timingData?.timeSlots?.[0]?.time || '7:30 PM'} with {timingData?.timeSlots?.[0]?.avgLikes || '342'} avg likes
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              Based on {timingData?.timeSlots?.[0]?.postCount || '15'} posts at this time
                            </p>
                          </div>
                        </div>

                        {/* Top 5 Time Slots */}
                        {timingData?.timeSlots && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="font-medium text-gray-900">Top 5 Posting Times</span>
                            </div>
                            
                            <div className="space-y-2">
                              {timingData.timeSlots.slice(0, 5).map((slot, index) => {
                                const maxEngagement = timingData.timeSlots[0].avgLikes;
                                const color = index === 0 ? 'orange' : index === 1 ? 'blue' : 'gray';
                                
                                return (
                                  <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700 min-w-[100px]">{slot.time}</span>
                                    <div className="flex items-center space-x-2 flex-1 mx-3">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            color === 'orange' ? 'bg-orange-500' : 
                                            color === 'blue' ? 'bg-blue-500' : 'bg-gray-400'
                                          }`}
                                          style={{width: `${(slot.avgLikes / maxEngagement) * 100}%`}}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 min-w-[40px]">{slot.avgLikes}</span>
                                  </div>
                                );
                              })}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-2">Average likes per post at each time</p>
                          </div>
                        )}

                        {/* Day of Week Performance */}
                        {dayOfWeekPerformance && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-medium text-gray-900">Best Days to Post</span>
                            </div>
                            
                            <div className="space-y-2">
                              {dayOfWeekPerformance.slice(0, 3).map((day, index) => {
                                const maxEngagement = dayOfWeekPerformance[0].avgEngagement;
                                const color = index === 0 ? 'purple' : index === 1 ? 'blue' : 'green';
                                
                                return (
                                  <PerformanceBar
                                    key={day.day}
                                    label={`${day.day} (${day.postCount} posts)`}
                                    value={day.avgEngagement}
                                    maxValue={maxEngagement}
                                    color={color}
                                  />
                                );
                              })}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-2">Average engagement by day of week</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Frequency Detailed Analysis */}
{showDetailedAnalysis && selectedMetric === 'frequency' && (() => {
  const frequencyData = instagramData?.recentPosts ? calculateFrequencyOptimization(instagramData.recentPosts) : null;
  
  return (
    <div className="space-y-4 mb-6">
      <h4 className="font-semibold text-gray-900">Your Frequency Analysis</h4>
      
      {frequencyData ? (
        <>
          {/* Current vs Optimal Frequency Comparison */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-medium text-gray-900">Frequency Comparison</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{frequencyData.currentFrequency}</div>
                <div className="text-sm text-blue-700">Current</div>
                <div className="text-xs text-gray-600">posts/week</div>
              </div>
              <div className="text-center bg-emerald-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-emerald-600">{frequencyData.optimalFrequency}</div>
                <div className="text-sm text-emerald-700">Optimal</div>
                <div className="text-xs text-gray-600">posts/week</div>
              </div>
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-sm text-emerald-800">
                {frequencyData.currentFrequency === frequencyData.optimalFrequency ? 
                  '✓ You\'re posting at the optimal frequency!' :
                  frequencyData.currentFrequency < frequencyData.optimalFrequency ?
                  `⚡ Posting ${frequencyData.optimalFrequency - frequencyData.currentFrequency} more times per week could boost engagement` :
                  `⚠️ Consider reducing by ${frequencyData.currentFrequency - frequencyData.optimalFrequency} posts/week to avoid audience fatigue`
                }
              </p>
            </div>
          </div>

          {/* Consistency Score */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium text-gray-900">Posting Consistency</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{frequencyData.consistencyScore}%</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div 
                className="bg-purple-500 h-3 rounded-full transition-all duration-1000" 
                style={{width: `${frequencyData.consistencyScore}%`}}
              ></div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              How regularly you maintain your posting schedule
            </p>
            <p className={`text-xs ${
              frequencyData.consistencyScore >= 80 ? 'text-green-700' :
              frequencyData.consistencyScore >= 60 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {frequencyData.consistencyScore >= 80 ? '✓ Excellent consistency - your audience knows when to expect content' :
               frequencyData.consistencyScore >= 60 ? '⚡ Good consistency - try to post on more regular days' : 
               '⚠️ Irregular posting - consider creating a content calendar'}
            </p>
          </div>

          {/* Performance by Frequency */}
          {frequencyData.performanceByFrequency.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-medium text-gray-900">Performance by Frequency</span>
              </div>
              
              <div className="space-y-2">
                {frequencyData.performanceByFrequency.slice(0, 4).map((bucket, index) => {
                  const maxEngagement = frequencyData.performanceByFrequency[0].avgEngagement;
                  const color = index === 0 ? 'emerald' : index === 1 ? 'blue' : index === 2 ? 'purple' : 'gray';
                  const isOptimal = bucket.range.includes(frequencyData.optimalFrequency.toString());
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-2 rounded-lg ${
                      isOptimal ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-700 min-w-[100px]">{bucket.range}</span>
                        {isOptimal && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Optimal</span>}
                      </div>
                      <div className="flex items-center space-x-2 flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              color === 'emerald' ? 'bg-emerald-500' : 
                              color === 'blue' ? 'bg-blue-500' : 
                              color === 'purple' ? 'bg-purple-500' : 'bg-gray-400'
                            }`}
                            style={{width: `${(bucket.avgEngagement / maxEngagement) * 100}%`}}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 min-w-[40px]">{bucket.avgEngagement}</span>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-600 mt-2">Average engagement per post at different frequencies</p>
            </div>
          )}

          {/* Weekly Pattern */}
          {frequencyData.weeklyPattern.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-medium text-gray-900">Recent Weekly Pattern</span>
              </div>
              
              <div className="space-y-2">
                {frequencyData.weeklyPattern.slice(-4).map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 flex-1">{week.week}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{week.postCount} posts</span>
                      <span className="text-sm text-orange-600">{week.avgEngagement} avg</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-gray-600 mt-2">Your posting frequency over recent weeks</p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h5 className="font-medium text-gray-900 mb-2">Need More Posting History</h5>
          <p className="text-sm text-gray-600">
            Post consistently for 2-3 weeks to unlock frequency optimization insights.
          </p>
        </div>
      )}
    </div>
  );
})()}

{/* Sentiment Detailed Analysis */}
{showDetailedAnalysis && selectedMetric === 'sentiment' && (() => {
  const sentimentData = instagramData?.recentPosts ? analyzeSentiment(instagramData.recentPosts) : null;
  
  return (
    <div className="space-y-4 mb-6">
      <h4 className="font-semibold text-gray-900">Your Sentiment Analysis</h4>
      
      {sentimentData ? (
        <>
          {/* Overall Sentiment Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-pink-600" />
              </div>
              <span className="font-medium text-gray-900">Overall Sentiment Breakdown</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{sentimentData.overallSentiment.positive}%</div>
                <div className="text-sm text-green-700">Positive</div>
                <div className="text-xs text-gray-600">reactions</div>
              </div>
              <div className="text-center bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-600">{sentimentData.overallSentiment.neutral}%</div>
                <div className="text-sm text-gray-700">Neutral</div>
                <div className="text-xs text-gray-600">reactions</div>
              </div>
              <div className="text-center bg-red-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-600">{sentimentData.overallSentiment.negative}%</div>
                <div className="text-sm text-red-700">Negative</div>
                <div className="text-xs text-gray-600">reactions</div>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 text-center">
              Based on {sentimentData.overallSentiment.totalComments} comments analyzed
            </p>
          </div>

          {/* Sentiment by Content Type */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium text-gray-900">Sentiment by Content Type</span>
            </div>
            
            <div className="space-y-3">
              {sentimentData.contentTypeAnalysis.map((content, index) => {
                const emoji = content.contentType === 'Reels' ? '🎬' : 
                             content.contentType === 'Carousels' ? '📸' : '📝';
                
                return (
                  <div key={content.contentType} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{emoji} {content.contentType}</span>
                      <span className={`text-sm font-bold ${
                        content.sentiment_score > 20 ? 'text-green-600' :
                        content.sentiment_score > 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {content.sentiment_score > 0 ? '+' : ''}{content.sentiment_score}
                      </span>
                    </div>
                    
                    <div className="flex space-x-1 mb-2">
                      <div 
                        className="bg-green-500 h-2 rounded-l"
                        style={{width: `${content.positive}%`}}
                      ></div>
                      <div 
                        className="bg-gray-400 h-2"
                        style={{width: `${content.neutral}%`}}
                      ></div>
                      <div 
                        className="bg-red-500 h-2 rounded-r"
                        style={{width: `${content.negative}%`}}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{content.positive}% positive</span>
                      <span>{content.totalComments} comments</span>
                      <span>{content.negative}% negative</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Sentiment Over Time - Based on your existing working pattern */}
{sentimentData && sentimentData.timeAnalysis && sentimentData.timeAnalysis.length > 0 && (
  <ViewTracker
    featureName="sentiment_trend_detailed"
    metadata={{
      months_analyzed: sentimentData.timeAnalysis.length,
      trend_direction: sentimentData.insights.sentimentTrend
    }}
  >
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <span className="font-medium text-gray-900">Historical Sentiment Trend</span>
          <p className="text-xs text-gray-600">
            {sentimentData.timeAnalysis.length === 1 
              ? 'First month of data' 
              : `${sentimentData.timeAnalysis.length} months of sentiment analysis`}
          </p>
        </div>
      </div>
      
      {/* Trend Summary */}
      {sentimentData.timeAnalysis.length > 1 && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 mb-4 border border-pink-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-pink-900">
              Overall Trend: <strong className="capitalize">{sentimentData.insights.sentimentTrend}</strong>
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              sentimentData.insights.sentimentTrend === 'improving' ? 'bg-green-100 text-green-800' :
              sentimentData.insights.sentimentTrend === 'declining' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {sentimentData.insights.sentimentTrend === 'improving' ? '📈 Improving' :
               sentimentData.insights.sentimentTrend === 'declining' ? '📉 Declining' : 
               '➡️ Stable'}
            </span>
          </div>
        </div>
      )}
      
      {/* Visual Chart */}
      <div className="mb-4">
        {/* Chart Header */}
        <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
          <span>Sentiment Score</span>
          <span>Timeline</span>
        </div>
        
        {/* Chart Area */}
        <div className="relative bg-gray-50 rounded-lg p-4" style={{ minHeight: '200px' }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
            <span>+50</span>
            <span>0</span>
            <span>-50</span>
          </div>
          
          {/* Chart content */}
          <div className="ml-10 h-full relative">
            {/* Zero line */}
            <div className="absolute top-1/2 left-0 right-0 border-t border-gray-300"></div>
            
            {/* Data points and lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Draw connecting lines */}
              <polyline
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                points={sentimentData.timeAnalysis.map((month, index) => {
                  const x = (index / (sentimentData.timeAnalysis.length - 1 || 1)) * 100;
                  const y = 50 - (month.sentiment_score / 100) * 50; // Normalize to 0-100 scale
                  return `${x},${y}`;
                }).join(' ')}
              />
              
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Data points */}
            <div className="relative h-full flex items-end justify-between">
              {sentimentData.timeAnalysis.map((month, index) => {
                const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' });
                const isLatest = index === sentimentData.timeAnalysis.length - 1;
                const normalizedHeight = 50 + (month.sentiment_score / 100) * 50; // 0-100 scale
                
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center justify-end relative">
                    {/* Data point */}
                    <div 
                      className="absolute"
                      style={{ bottom: `${normalizedHeight}%`, transform: 'translateY(50%)' }}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 ${
                        month.sentiment_score > 20 ? 'bg-green-500 border-green-600' :
                        month.sentiment_score > 0 ? 'bg-blue-500 border-blue-600' :
                        'bg-red-500 border-red-600'
                      } ${isLatest ? 'w-4 h-4' : ''}`}>
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            Score: {month.sentiment_score > 0 ? '+' : ''}{month.sentiment_score}
                            <br />
                            {month.totalComments} comments
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Month label */}
                    <div className="absolute bottom-0 transform translate-y-full mt-2">
                      <span className={`text-xs ${isLatest ? 'font-bold text-pink-600' : 'text-gray-600'}`}>
                        {monthName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center items-center space-x-4 mt-8 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Positive ({'>'}20)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Neutral (0-20)</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Negative ({'<'}0)</span>
          </div>
        </div>
      </div>
      
      {/* Monthly Breakdown */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          View Monthly Details
        </summary>
        <div className="mt-3 space-y-2">
          {sentimentData.timeAnalysis.map((month, index) => {
            const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const isLatest = index === sentimentData.timeAnalysis.length - 1;
            
            return (
              <div key={month.month} className={`flex items-center justify-between p-3 rounded-lg ${
                isLatest ? 'bg-pink-50 border border-pink-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700 font-medium">{monthName}</span>
                  {isLatest && (
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-800 text-xs rounded-full">
                      Latest
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-600">{month.totalComments} comments</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                    month.sentiment_score > 20 ? 'bg-green-100 text-green-700' :
                    month.sentiment_score > 0 ? 'bg-blue-100 text-blue-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {month.sentiment_score > 0 ? '+' : ''}{month.sentiment_score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </details>
      
      {/* Insights */}
      <div className="mt-4 bg-pink-50 rounded-lg p-3 border border-pink-200">
        <p className="text-sm text-pink-800">
          <strong>💡 Insight:</strong> {
            sentimentData.timeAnalysis.length === 1 
              ? 'This is your first month of sentiment tracking. Keep posting to build trend data!'
              : sentimentData.insights.sentimentTrend === 'improving'
              ? `Your audience sentiment has been improving! Your ${sentimentData.insights.bestContentType || 'recent content'} is resonating well.`
              : sentimentData.insights.sentimentTrend === 'declining'
              ? 'Consider adjusting your content strategy to better align with what your audience enjoyed in previous months.'
              : 'Your sentiment remains stable. Try experimenting with new content types to boost positive reactions.'
          }
        </p>
      </div>
    </div>
  </ViewTracker>
)}
        </>
      ) : (
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h5 className="font-medium text-gray-900 mb-2">Need More Comment Data</h5>
          <p className="text-sm text-gray-600">
            Post content that encourages comments to unlock sentiment analysis insights.
          </p>
        </div>
      )}
    </div>
  );
})()}

                  {/* A/B Testing Detailed Analysis */}
                  {showDetailedAnalysis && selectedMetric === 'ab_testing' && (() => {
                    const abTestSuggestions = generateABTestSuggestions(instagramData?.recentPosts || []);
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">Ready-to-Run Tests</h4>
                        
                        {abTestSuggestions.length > 0 ? abTestSuggestions.map((test, index) => (
                          <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <span className="text-green-600 text-sm font-bold">{index + 1}</span>
                                </div>
                                <span className="font-medium text-gray-900">{test.type} Test</span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                test.confidence === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {test.confidence} Confidence
                              </span>
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-3 mb-3">
                              <h5 className="font-medium text-green-900 mb-1">Test Hypothesis:</h5>
                              <p className="text-sm text-green-800">{test.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-xs font-medium text-gray-900">Duration:</span>
                                <p className="text-sm text-gray-700">{test.duration}</p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-2">
                                <span className="text-xs font-medium text-gray-900">Success Metric:</span>
                                <p className="text-sm text-gray-700">{test.metric}</p>
                              </div>
                            </div>
                            
                            {test.expectedOutcome && (
                              <div className="bg-blue-50 rounded-lg p-3">
                                <p className="text-xs text-blue-800">
                                  <strong>Expected Outcome:</strong> {test.expectedOutcome}
                                </p>
                              </div>
                            )}
                          </div>
                        )) : (
                          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                            <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h5 className="font-medium text-gray-900 mb-2">Need More Data</h5>
                            <p className="text-sm text-gray-600">
                              Post consistently for 2-3 weeks to unlock specific A/B test recommendations.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Content Gaps Detailed Analysis */}
                  {showDetailedAnalysis && selectedMetric === 'content_gaps' && (() => {
                    const contentGaps = analyzeContentGaps(instagramData?.recentPosts || []);
                    const discoveryAnalysis = analyzeDiscoveryPotential(instagramData?.recentPosts || []);
                    
                    return (
                      <div className="space-y-4 mb-6">
                        <h4 className="font-semibold text-gray-900">Content Strategy Analysis</h4>
                        
                        {contentGaps.length > 0 ? (
                          <>
                            {/* Priority Gaps */}
                            <div className="space-y-3">
                              {contentGaps.slice(0, 3).map((gap, index) => (
                                <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      gap.priority === 'High' ? 'bg-red-100' : 
                                      gap.priority === 'Medium' ? 'bg-yellow-100' : 'bg-blue-100'
                                    }`}>
                                      <span className={`text-sm font-bold ${
                                        gap.priority === 'High' ? 'text-red-600' : 
                                        gap.priority === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                                      }`}>
                                        !
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{gap.type}</h5>
                                      <p className="text-sm text-gray-600">{gap.description}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      gap.priority === 'High' ? 'bg-red-100 text-red-800' : 
                                      gap.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {gap.priority}
                                    </span>
                                  </div>
                                  
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <p className="text-sm text-green-800">
                                      <strong>Suggestion:</strong> {gap.suggestion}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Content Type Balance */}
                            {discoveryAnalysis && (
                              <div className="bg-white rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <span className="font-medium text-gray-900">Content Type Balance</span>
                                </div>
                                
                                <div className="space-y-2">
                                  {discoveryAnalysis.map((content, index) => (
                                    <div key={content.contentType} className="flex items-center justify-between">
                                      <span className="text-sm text-gray-700">
                                        {content.contentType === 'VIDEO' ? '🎬' : 
                                         content.contentType === 'CAROUSEL_ALBUM' ? '📸' : '📝'} {content.label}
                                      </span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">{content.sampleSize} posts</span>
                                        <div className={`w-3 h-3 rounded-full ${
                                          content.sampleSize >= 5 ? 'bg-green-500' : 
                                          content.sampleSize >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <p className="text-xs text-gray-600 mt-2">
                                  🟢 Good variety (5+ posts) • 🟡 Some posts (2-4) • 🔴 Limited data (0-1)
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <span className="text-green-600 text-2xl">✓</span>
                            </div>
                            <h5 className="font-medium text-gray-900 mb-2">Great Content Strategy!</h5>
                            <p className="text-sm text-gray-600">
                              No major gaps detected. You're posting a good variety of content types consistently.
                            </p>
                            <div className="mt-4 bg-green-50 rounded-lg p-3">
                              <p className="text-sm text-green-800">
                                Keep maintaining this balanced approach across different content formats.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Conversational Follow-up */}
                  {(selectedMetric === 'discovery' && showDetailedAnalysis) && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-blue-800 text-sm mb-3">
                          <strong>Quick question:</strong> Are you comfortable creating more video content, 
                          or would you prefer to optimize your current posting strategy first?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setUserPreference('more_videos')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'more_videos' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            More Videos 🎬
                          </button>
                          <button 
                            onClick={() => setUserPreference('optimize_current')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'optimize_current' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            Optimize Current 📊
                          </button>
                        </div>
                      </div>

                      {/* Personalized Action Plan */}
                      {userPreference && (
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                          <h4 className="font-bold text-lg mb-4">Your Focus This Week 🎯</h4>
                          
                          <div className="space-y-3">
                            {userPreference === 'more_videos' ? (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Create 2 Reels (aim for educational/entertaining content)</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Post them Tuesday & Thursday at 7:30 PM</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: +4,680 more people reached this week</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Optimize posting times: use your peak hours more consistently</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Focus on content that drives profile visits</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: 15-20% increase in reach efficiency</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button 
                            onClick={resetChat}
                            className="w-full bg-white text-indigo-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
                          >
                            Got It! New Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Engagement Quality Conversational Follow-up */}
                  {(selectedMetric === 'engagement_quality' && showDetailedAnalysis) && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-purple-800 text-sm mb-3">
                          <strong>Quick question:</strong> What type of content do you enjoy creating most, 
                          or would you like to focus on improving what you already post?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setUserPreference('educational_content')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'educational_content' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white text-purple-700 hover:bg-purple-100'
                            }`}
                          >
                            Educational Content 📚
                          </button>
                          <button 
                            onClick={() => setUserPreference('improve_existing')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'improve_existing' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white text-purple-700 hover:bg-purple-100'
                            }`}
                          >
                            Improve Current 📈
                          </button>
                        </div>
                      </div>

                      {/* Personalized Action Plan for Engagement */}
                      {userPreference && (
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                          <h4 className="font-bold text-lg mb-4">Your Engagement Action Plan 🎯</h4>
                          
                          <div className="space-y-3">
                            {userPreference === 'educational_content' ? (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Create 2 educational posts/carousels with actionable tips</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">End each post with "Save this for later!" to boost saves</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: Save rate improvement to 5%+ within 2 weeks</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Add specific questions to your captions to boost comments</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Respond to all comments within 2 hours to increase engagement</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: 25% increase in comment engagement</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button 
                            onClick={resetChat}
                            className="w-full bg-white text-purple-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
                          >
                            Perfect! New Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timing Conversational Follow-up */}
                  {(selectedMetric === 'timing' && showDetailedAnalysis) && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-orange-800 text-sm mb-3">
                          <strong>Quick question:</strong> Do you prefer to schedule posts in advance, 
                          or do you like posting in real-time when inspiration strikes?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setUserPreference('schedule_posts')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'schedule_posts' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-white text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            Schedule Posts 📅
                          </button>
                          <button 
                            onClick={() => setUserPreference('post_realtime')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'post_realtime' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-white text-orange-700 hover:bg-orange-100'
                            }`}
                          >
                            Real-time Posting ⚡
                          </button>
                        </div>
                      </div>

                      {/* Personalized Action Plan for Timing */}
                      {userPreference && (
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
                          <h4 className="font-bold text-lg mb-4">Your Timing Strategy 🎯</h4>
                          
                          <div className="space-y-3">
                            {userPreference === 'schedule_posts' ? (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Use Later, Buffer, or Creator Studio to schedule posts</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Schedule all posts for your top 3 time windows</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: 30% more consistent reach and engagement</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Set phone reminders for your top 3 optimal posting times</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">If inspiration strikes at off-peak times, save as draft</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: Better timing without losing creativity</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button 
                            onClick={resetChat}
                            className="w-full bg-white text-orange-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
                          >
                            Got It! New Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* A/B Testing Conversational Follow-up */}
                  {(selectedMetric === 'ab_testing' && showDetailedAnalysis) && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-green-800 text-sm mb-3">
                          <strong>Quick question:</strong> Are you ready to start testing, 
                          or would you like me to prioritize which test to run first?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setUserPreference('start_testing')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'start_testing' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white text-green-700 hover:bg-green-100'
                            }`}
                          >
                            Start Testing 🧪
                          </button>
                          <button 
                            onClick={() => setUserPreference('prioritize_tests')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'prioritize_tests' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white text-green-700 hover:bg-green-100'
                            }`}
                          >
                            Prioritize for Me 📋
                          </button>
                        </div>
                      </div>

                      {/* Personalized Action Plan for A/B Testing */}
                      {userPreference && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                          <h4 className="font-bold text-lg mb-4">Your Testing Strategy 🎯</h4>
                          
                          <div className="space-y-3">
                            {userPreference === 'start_testing' ? (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Pick your highest confidence test and run it this week</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Track results daily and compare after test duration</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: Clear winner identified within 2-3 weeks</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Start with timing tests - easiest and highest impact</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Run only 1 test at a time for clean results</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: 15-30% improvement in your weakest area</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button 
                            onClick={resetChat}
                            className="w-full bg-white text-green-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
                          >
                            Let's Do This! New Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Gaps Conversational Follow-up */}
                  {(selectedMetric === 'content_gaps' && showDetailedAnalysis) && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-yellow-800 text-sm mb-3">
                          <strong>Quick question:</strong> Would you rather focus on filling content gaps, 
                          or optimize what's already working well?
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setUserPreference('fill_gaps')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'fill_gaps' 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-white text-yellow-700 hover:bg-yellow-100'
                            }`}
                          >
                            Fill Gaps 🔧
                          </button>
                          <button 
                            onClick={() => setUserPreference('optimize_existing')}
                            className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                              userPreference === 'optimize_existing' 
                                ? 'bg-yellow-600 text-white' 
                                : 'bg-white text-yellow-700 hover:bg-yellow-100'
                            }`}
                          >
                            Optimize Current 🚀
                          </button>
                        </div>
                      </div>

                      {/* Personalized Action Plan for Content Gaps */}
                      {userPreference && (
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl p-6 text-white">
                          <h4 className="font-bold text-lg mb-4">Your Content Strategy 🎯</h4>
                          
                          <div className="space-y-3">
                            {userPreference === 'fill_gaps' ? (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Address your highest priority gap this week</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Create a content calendar to maintain balance</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: More consistent reach across content types</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">1</span>
                                  </div>
                                  <p className="text-sm">Double down on your best-performing content type</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">2</span>
                                  </div>
                                  <p className="text-sm">Create 2-3 variations of your top posts</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold">3</span>
                                  </div>
                                  <p className="text-sm">Expected: 40% increase in average post performance</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <button 
                            onClick={resetChat}
                            className="w-full bg-white text-yellow-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
                          >
                            Perfect Strategy! New Analysis →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Frequency Conversational Follow-up */}
{(selectedMetric === 'frequency' && showDetailedAnalysis) && (
  <div className="mt-6 space-y-4">
    <div className="bg-emerald-50 rounded-lg p-4">
      <p className="text-emerald-800 text-sm mb-3">
        <strong>Quick question:</strong> What's your biggest challenge with posting consistently? 
        Time management or running out of content ideas?
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => setUserPreference('time_management')}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            userPreference === 'time_management' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Time Management ⏰
        </button>
        <button 
          onClick={() => setUserPreference('content_ideas')}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            userPreference === 'content_ideas' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-white text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Content Ideas 💡
        </button>
      </div>
    </div>

    {/* Personalized Action Plan for Frequency */}
    {userPreference && (
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl p-6 text-white">
        <h4 className="font-bold text-lg mb-4">Your Frequency Strategy 🎯</h4>
        
        <div className="space-y-3">
          {userPreference === 'time_management' ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p className="text-sm">Batch create 3-4 posts every Sunday for the week ahead</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p className="text-sm">Use scheduling tools (Later, Buffer) to maintain consistency</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p className="text-sm">Expected: 80%+ consistency score within 2 weeks</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p className="text-sm">Create a content bank with 20+ ideas you can reuse</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p className="text-sm">Repurpose your best posts with new angles or formats</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p className="text-sm">Expected: Never run out of content + optimal frequency achieved</p>
              </div>
            </>
          )}
        </div>
        
        <button 
          onClick={resetChat}
          className="w-full bg-white text-emerald-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
        >
          Perfect Plan! New Analysis →
        </button>
      </div>
    )}
  </div>
)}

{/* Sentiment Conversational Follow-up */}
{(selectedMetric === 'sentiment' && showDetailedAnalysis) && (
  <div className="mt-6 space-y-4">
    <div className="bg-pink-50 rounded-lg p-4">
      <p className="text-pink-800 text-sm mb-3">
        <strong>Quick question:</strong> Would you like to focus on increasing positive sentiment, 
        or reducing negative reactions to your content?
      </p>
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => setUserPreference('increase_positive')}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            userPreference === 'increase_positive' 
              ? 'bg-pink-600 text-white' 
              : 'bg-white text-pink-700 hover:bg-pink-100'
          }`}
        >
          More Positive 😊
        </button>
        <button 
          onClick={() => setUserPreference('reduce_negative')}
          className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
            userPreference === 'reduce_negative' 
              ? 'bg-pink-600 text-white' 
              : 'bg-white text-pink-700 hover:bg-pink-100'
          }`}
        >
          Less Negative 🛡️
        </button>
      </div>
    </div>

    {userPreference && (
      <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white">
        <h4 className="font-bold text-lg mb-4">Your Sentiment Strategy 🎯</h4>
        
        <div className="space-y-3">
          {userPreference === 'increase_positive' ? (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p className="text-sm">Create more content like your best-performing type for positive reactions</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p className="text-sm">Ask engaging questions that prompt enthusiastic responses</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p className="text-sm">Expected: 15-20% increase in positive sentiment within 2 weeks</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p className="text-sm">Avoid controversial topics and focus on universally positive themes</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p className="text-sm">Moderate comments quickly and respond positively to criticism</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p className="text-sm">Expected: 50% reduction in negative sentiment within a month</p>
              </div>
            </>
          )}
        </div>
        
        <button 
          onClick={resetChat}
          className="w-full bg-white text-pink-600 rounded-lg py-3 font-medium mt-4 hover:bg-gray-50 transition-colors"
        >
          Great Strategy! New Analysis →
        </button>
      </div>
    )}
  </div>
)}
                  
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

  const NotificationsContent = () => {
    // Track notifications view
    useEffect(() => {
      trackFeature('notifications_tab', 'view', {
        has_instagram_data: !!instagramData,
        notifications_available: true
      })
    }, [])

    // Generate dynamic notifications based on real user data
    const generateRealNotifications = () => {
      const notifications = [];
      const now = new Date();
      const currentHour = now.getHours();
      
      // 1. OPTIMAL POSTING TIME ALERTS
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
      if (isWeekday && currentHour >= 19 && currentHour <= 21) {
        notifications.push({
          type: 'AI Suggestion',
          message: 'Perfect time to post! Your audience is most active now.',
          time: 'now',
          bg: 'bg-blue-50',
          icon: 'bg-blue-500',
          priority: 'high'
        });
      }
      
      // 2. HIGH PERFORMING POST ALERTS
      if (instagramData?.recentPosts && instagramData.recentPosts.length > 0) {
        const avgLikes = instagramData.avgLikes || 0;
        const recentHighPerformer = instagramData.recentPosts.find(post => 
          (post.like_count || 0) > avgLikes * 1.5
        );
        
        if (recentHighPerformer) {
          const timeAgo = Math.floor((now.getTime() - new Date(recentHighPerformer.timestamp).getTime()) / (1000 * 60 * 60));
          notifications.push({
            type: 'Engagement Alert',
            message: `Your latest post got ${recentHighPerformer.like_count} likes - ${Math.round(((recentHighPerformer.like_count || 0) / avgLikes) * 100)}% above average!`,
            time: timeAgo < 24 ? `${timeAgo}h ago` : '1d ago',
            bg: 'bg-green-50',
            icon: 'bg-green-500',
            priority: 'high'
          });
        }
      }
      
      // 3. TIMING OPTIMIZATION INSIGHTS
      if (instagramData?.recentPosts && instagramData.recentPosts.length > 3) {
        const timingData = calculateTimingOptimization(instagramData.recentPosts);
        if (timingData.timeSlots.length > 0) {
          notifications.push({
            type: 'Timing Insight',
            message: `Your best posting time is ${timingData.timeSlots[0].time} with ${timingData.timeSlots[0].avgLikes} avg likes!`,
            time: '2h ago',
            bg: 'bg-purple-50',
            icon: 'bg-purple-500',
            priority: 'medium'
          });
        }
      }
      
      // 4. FREQUENCY OPTIMIZATION INSIGHTS
      if (instagramData?.recentPosts && instagramData.recentPosts.length > 5) {
        const frequencyData = calculateFrequencyOptimization(instagramData.recentPosts);
        if (frequencyData.currentFrequency !== frequencyData.optimalFrequency) {
          const suggestion = frequencyData.currentFrequency < frequencyData.optimalFrequency ? 'increase' : 'decrease';
          notifications.push({
            type: 'Frequency Insight',
            message: `Consider ${suggestion} posting to ${frequencyData.optimalFrequency}/week for optimal engagement!`,
            time: '4h ago',
            bg: 'bg-orange-50',
            icon: 'bg-orange-500',
            priority: 'medium'
          });
        }
      }
      
      // 5. GROWTH MILESTONES
      if (instagramData?.followers) {
        const followerCount = instagramData.followers;
        const nextMilestone = Math.ceil(followerCount / 1000) * 1000;
        const remaining = nextMilestone - followerCount;
        
        if (remaining <= 50) {
          notifications.push({
            type: 'Growth Milestone',
            message: `You're ${remaining} followers away from ${nextMilestone.toLocaleString()}! Keep posting consistently.`,
            time: '6h ago',
            bg: 'bg-green-50',
            icon: 'bg-green-500',
            priority: 'medium'
          });
        }
      }
      
      // 6. TOP FOLLOWERS INSIGHTS
      if (instagramData?.topFollowers && instagramData.topFollowers.length > 0) {
        const superFans = instagramData.topFollowers.filter(f => f.engagementType === 'high').length;
        if (superFans > 0) {
          notifications.push({
            type: 'Community Insight',
            message: `You have ${superFans} super fans who regularly engage! Consider featuring them in stories.`,
            time: '8h ago',
            bg: 'bg-violet-50',
            icon: 'bg-violet-500',
            priority: 'medium'
          });
        }
      }
      
      // 7. WEEKLY PERFORMANCE SUMMARY
      if (instagramData?.followers && instagramData?.growthRate) {
        const weeklyGrowth = instagramData.growthRate.replace('+', '').replace('%', '');
        const followersGained = Math.round(instagramData.followers * (parseFloat(weeklyGrowth) / 100));
        
        notifications.push({
          type: 'Weekly Summary',
          message: `This week: +${followersGained} followers, ${instagramData.engagementRate || '4.2%'} engagement rate. ${followersGained > 20 ? 'Great work!' : 'Keep it up!'}`,
          time: '1d ago',
          bg: 'bg-indigo-50',
          icon: 'bg-indigo-500',
          priority: 'low'
        });
      }
      
      // 8. DATA CONNECTION STATUS
      if (dataError) {
        notifications.push({
          type: 'Connection Issue',
          message: 'Unable to fetch latest Instagram data. Check your connection in Profile settings.',
          time: '30m ago',
          bg: 'bg-red-50',
          icon: 'bg-red-500',
          priority: 'high'
        });
      }
      
      // Sort by priority (high, medium, low) and then by time
      const priorityOrder: { [key: string]: number } = { high: 3, medium: 2, low: 1 };
      return notifications.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low'];
        return priorityDiff !== 0 ? priorityDiff : 0;
      });
    };

    const notifications = generateRealNotifications();

    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <div className="text-sm text-gray-500">{notifications.length} new</div>
          </div>
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600 text-sm">Connect your Instagram account to start receiving personalized insights and recommendations.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification, index) => (
              <ViewTracker
                key={index}
                featureName={`notification_${notification.type.toLowerCase().replace(/\s+/g, '_')}`}
                metadata={{
                  notification_type: notification.type,
                  priority: notification.priority,
                  time: notification.time
                }}
              >
                <div className={`p-4 ${notification.bg} hover:bg-opacity-80 transition-colors`}>
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 ${notification.icon} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">{notification.type}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{notification.time}</span>
                          {notification.priority === 'high' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mt-1 leading-relaxed">{notification.message}</p>
                    </div>
                  </div>
                </div>
              </ViewTracker>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProfileContent = ({ user }: { user?: any }) => {
  const [showAbout, setShowAbout] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);

  // Track profile view
  useEffect(() => {
    trackFeature('profile_tab', 'view', {
      has_instagram_data: !!instagramData,
      instagram_connected: !!instagramData
    })
  }, [])

  // Handler for Instagram connect/disconnect with tracking
  const handleInstagramAuth = async () => {
    if (instagramData) {
      // Disconnect Instagram
      if (isDisconnectingInstagram) return;
      
      setIsDisconnectingInstagram(true);
      
      // Track disconnect attempt
      trackEngagement('instagram_disconnect_attempt', {
        follower_count: instagramData.followers,
        posts_count: instagramData.recentPosts?.length || 0,
        engagement_rate: instagramData.engagementRate
      })
      
      try {
        // ✅ FIXED: Get current user ID instead of using instagramData.user_id
        const user = await AuthService.getCurrentUser();
        if (!user) {
          alert('Please log in first');
          return;
        }
        
        await AuthService.disconnectInstagramAccount(user.id);
        setInstagramData(null);
        alert('Instagram account disconnected successfully!');
        
        // Track successful disconnect
        trackEngagement('instagram_disconnected', {
          was_connected_duration: 'unknown' // Could track this if you stored connection date
        })
        
      } catch (error) {
        console.error('❌ Failed to disconnect Instagram:', error);
        alert('Failed to disconnect Instagram. Please try again.');
        
        // Track disconnect failure
        trackEngagement('instagram_disconnect_failed', {
          error: error instanceof Error ? error.message : String(error)
        })
      } finally {
        setIsDisconnectingInstagram(false);
      }
    } else {
      // Connect Instagram
      try {
        // Track connect attempt
        trackEngagement('instagram_connect_attempt', {
          from_profile: true
        })
        
        // ✅ FIXED: Actually start the OAuth flow
        const user = await AuthService.getCurrentUser();
        if (!user) {
          alert('Please log in first');
          return;
        }
        
        // Get the Instagram auth URL and redirect
        const authUrl = AuthService.getInstagramAuthUrl(user.id);
        window.location.href = authUrl;
        
      } catch (error) {
        console.error('❌ Failed to start Instagram connection:', error);
        alert('Failed to connect Instagram. Please try again.');
        
        // Track connect failure
        trackEngagement('instagram_connect_failed', {
          error: error instanceof Error ? error.message : String(error),
          from_profile: true
        })
      }
    }
  };

  // Show data management page if selected
  if (showDataManagement) {
    return <AccountDataManagement onBack={() => setShowDataManagement(false)} />;
  }

  // Show email preferences if requested
if (showEmailPreferences) {
  return <EmailPreferences userId={user?.id || ''} onClose={() => setShowEmailPreferences(false)} />;
}

  const AboutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <ViewTracker
        featureName="about_modal"
        metadata={{ opened_from: 'profile' }}
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">About SocialSage</h2>
            <ClickTracker
              featureName="about_modal_close"
              metadata={{ read_time: Date.now() }}
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </ClickTracker>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-white text-2xl font-bold">SS</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">SocialSage</h3>
              <p className="text-gray-600 text-sm">AI-Powered Social Media Analytics</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">App Version</h3>
              <p>Version 1.3.0 (Build 2025.06.16)</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What's New</h3>
              <p>This version includes new timing and frequency optimization views, enhanced real-time analytics, and improved AI recommendations based on your actual posting patterns.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About the Team</h3>
              <p>Built with ❤️ by the SocialSage team. We're dedicated to empowering creators with data-driven insights to grow their social media presence.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p>For questions or support, please contact us at support@socialsage.app or follow us @socialsageapp on social media.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Legal</h3>
              <p>© 2025 SocialSage. All rights reserved. View our Terms of Service and Privacy Policy for more information.</p>
            </div>
          </div>
          
          <ClickTracker
            featureName="about_modal_acknowledge"
            metadata={{ modal_open_duration: Date.now() }}
          >
            <button 
              onClick={() => setShowAbout(false)}
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Got It
            </button>
          </ClickTracker>
        </div>
      </ViewTracker>
    </div>
  );

  const HelpSupportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <ViewTracker
        featureName="help_support_modal"
        metadata={{ opened_from: 'profile' }}
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
            <ClickTracker
              featureName="help_support_close"
              metadata={{ read_time: Date.now() }}
            >
              <button 
                onClick={() => setShowHelpSupport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </ClickTracker>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">How do I connect Instagram?</h4>
                  <p className="text-xs">Go to Profile {'>'} Accounts and click "Connect". You need a Business or Creator account.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">Why no timing data?</h4>
                  <p className="text-xs">You need at least 5-10 posts for timing analysis. Keep posting and check back!</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">How is frequency calculated?</h4>
                  <p className="text-xs">We analyze your posting history to find the optimal frequency for your audience engagement.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Fixes</h3>
              <div className="space-y-1 text-xs">
                <p><strong>No data:</strong> Switch to Business/Creator mode</p>
                <p><strong>Login issues:</strong> Log out and back in</p>
                <p><strong>Slow loading:</strong> Check connection and refresh</p>
                <p><strong>Missing insights:</strong> Need more posts for analysis</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✉</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Email Support</p>
                    <p className="text-blue-600 text-xs">support@socialsage.app</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Live Chat</p>
                    <p className="text-gray-600 text-xs">Mon-Fri 9AM-5PM PT</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
              <p>Connect your Instagram Business account, post regularly, and explore the new Timing and Frequency optimization views for personalized recommendations.</p>
            </div>
          </div>
          
          <ClickTracker
            featureName="help_support_acknowledge"
            metadata={{ modal_open_duration: Date.now() }}
          >
            <button 
              onClick={() => setShowHelpSupport(false)}
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-all"
            >
              Got It
            </button>
          </ClickTracker>
        </div>
      </ViewTracker>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>
      
      <div className="p-4 space-y-4">
        <ViewTracker
          featureName="profile_header"
          metadata={{ has_instagram_data: !!instagramData }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Account</h2>
                <p className="text-gray-600">Social Media Analytics</p>
                <p className="text-sm text-gray-500">SocialSage User</p>
              </div>
            </div>
          </div>
        </ViewTracker>

        <ViewTracker
          featureName="profile_accounts_section"
          metadata={{ 
            instagram_connected: !!instagramData,
            total_accounts: 4
          }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Accounts</h3>
            {!instagramData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">📸 Instagram Data Usage</h4>
                <p className="text-blue-800 text-sm mb-3">
                  When you connect Instagram, we'll access your profile data, posts, comments, 
                  and analytics to provide personalized insights. We never share your data 
                  with third parties.
                </p>
                <a 
                  href="/privacy" 
                  target="_blank"
                  className="text-blue-700 hover:text-blue-900 underline text-sm font-medium"
                >
                  📄 Read our full Privacy Policy →
                </a>
              </div>
            )}
            <div className="space-y-3">
              {[
                { 
                  platform: 'Instagram', 
                  connected: !!instagramData, 
                  color: 'bg-pink-500', 
                  username: instagramData?.username,
                  isLoading: isDisconnectingInstagram
                },
                { platform: 'Twitter/X', connected: false, color: 'bg-black', comingSoon: true },
                { platform: 'YouTube', connected: false, color: 'bg-red-600', comingSoon: true },
                { platform: 'TikTok', connected: false, color: 'bg-gray-900', comingSoon: true }
              ].map((account) => (
                <div key={account.platform} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {account.platform === 'Instagram' ? 'IG' : 
                         account.platform === 'Twitter/X' ? 'X' : 
                         account.platform === 'YouTube' ? 'YT' : 'TT'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700">{account.platform}</span>
                      {account.username && (
                        <p className="text-xs text-gray-500">{account.username}</p>
                      )}
                    </div>
                  </div>
                  
                  {account.platform === 'Instagram' ? (
                    <ClickTracker
                      featureName="instagram_connection_toggle"
                      metadata={{
                        action: account.connected ? 'disconnect' : 'connect',
                        has_data: account.connected
                      }}
                    >
                      <button
                        onClick={handleInstagramAuth}
                        disabled={account.isLoading}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          account.connected 
                            ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                        } ${account.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {account.isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full"></div>
                            <span>Wait...</span>
                          </div>
                        ) : (
                          account.connected ? 'Disconnect' : 'Connect'
                        )}
                      </button>
                    </ClickTracker>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      account.comingSoon ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {account.comingSoon ? 'Coming Soon' : 'Connect'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ViewTracker>

        <ViewTracker
          featureName="profile_settings_section"
          metadata={{ settings_count: 7 }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              {[
  { name: 'Email Preferences', clickable: true, action: () => setShowEmailPreferences(true), new: true },
  { name: 'Account Data Management', clickable: true, action: () => setShowDataManagement(true) },
  { name: 'Privacy Policy', clickable: true, action: () => window.open('/privacy', '_blank') },
  { name: 'Terms of Service', clickable: true, action: () => window.open('/terms', '_blank') },
  { name: 'Billing', clickable: false },
  { name: 'Help & Support', clickable: true, action: () => setShowHelpSupport(true) },
  { name: 'About', clickable: true, action: () => setShowAbout(true) }
].map((setting) => (
                <ClickTracker
                  key={setting.name}
                  featureName={`profile_setting_${setting.name.toLowerCase().replace(/\s+/g, '_')}`}
                  metadata={{ setting_name: setting.name, clickable: setting.clickable }}
                >
                  <button
                    onClick={setting.clickable ? setting.action : undefined}
                    className={`w-full flex items-center justify-between py-2 ${
                      setting.clickable ? 'hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''
                    }`}
                    disabled={!setting.clickable}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-gray-700 ${setting.clickable ? 'text-blue-600' : ''}`}>
                        {setting.name}
                      </span>
                      {setting.new && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className={`${setting.clickable ? 'text-blue-400' : 'text-gray-400'}`}>›</div>
                  </button>
                </ClickTracker>
              ))}
           {/* 🆕 NEW: Add the onboarding trigger */}
      <div className="pt-3 border-t border-gray-200">
        <OnboardingTrigger 
  userId={user?.id} 
  analytics={{ track: trackEngagement }}
/>
      </div>
    </div>
  </div>
</ViewTracker>

        {/* Enhanced Instagram Data Status */}
        {instagramData && (
          <ViewTracker
            featureName="instagram_data_status"
            metadata={{
              followers: instagramData.followers,
              posts_count: instagramData.mediaCount,
              has_insights: !!instagramData.accountInsights
            }}
          >
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                <span className="mr-2">✅</span>
                Instagram Data Connected
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-700">Followers: {instagramData.followers.toLocaleString()}</p>
                <p className="text-green-700">Posts: {instagramData.mediaCount}</p>
                <p className="text-green-700">Engagement Rate: {instagramData.engagementRate}</p>
                {instagramData.avgReach && (
                  <p className="text-green-700">Avg Reach: {instagramData.avgReach.toLocaleString()}</p>
                )}
                {instagramData.accountInsights && (
                  <>
                    <p className="text-green-700">Profile Visits (30d): {instagramData.accountInsights.profile_visits.toLocaleString()}</p>
                    <p className="text-green-700">Total Reach (30d): {(instagramData.accountInsights.reach / 1000).toFixed(1)}K</p>
                  </>
                )}
                {instagramData.topFollowers && instagramData.topFollowers.length > 0 && (
                  <p className="text-green-700">Top Followers: {instagramData.topFollowers.length} active commenters found</p>
                )}
                <p className="text-xs text-green-600 mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </ViewTracker>
        )}

        {dataError && (
          <ViewTracker
            featureName="instagram_data_error"
            metadata={{ error_message: dataError }}
          >
            <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                Data Connection Issue
              </h3>
              <p className="text-red-700 text-sm">{dataError}</p>
            </div>
          </ViewTracker>
        )}
      </div>
      {showAbout && <AboutModal />}
      {showHelpSupport && <HelpSupportModal />}
    </div>
  );
};

// Add TaggingModal component RIGHT HERE (before renderContent function)
  const TaggingModal = () => {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleSubmit = () => {
  if (!selectedCategory && !newCategoryName) return;
  
  const category = newCategoryName.trim() || selectedCategory;
  const isCustom = !!newCategoryName.trim(); // FIXED: Custom if newCategoryName exists
  
  console.log('🏷️ Submitting tag:', { category, isCustom }); // Debug log
  
  handleTagPosts(selectedPostsForTagging, category, isCustom);
};

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tag Content</h3>
            <button 
              onClick={() => {
                setShowTaggingModal(false);
                setSelectedPostsForTagging([]);
                setSelectedCategory('');
                setNewCategoryName('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900">
                Tagging {selectedPostsForTagging.length} post{selectedPostsForTagging.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Select Category</h4>
                <div className="grid grid-cols-2 gap-2">
                  {instagramData?.availableCategories?.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setNewCategoryName('');
                      }}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedCategory === category.name
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{category.emoji}</div>
                        <div className="text-xs font-medium text-gray-900">{category.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Or Create New Category</h4>
                <input
                  type="text"
                  placeholder="e.g., Product Reviews, Case Studies..."
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (e.target.value.trim()) {
                      setSelectedCategory('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowTaggingModal(false);
                  setSelectedPostsForTagging([]);
                  setSelectedCategory('');
                  setNewCategoryName('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedCategory && !newCategoryName.trim()}
                className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Tag {selectedPostsForTagging.length} Post{selectedPostsForTagging.length > 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'posts':
        return <PostsContent />;
      case 'insights':
        return <AIInsightsContent />;
      case 'notifications':
        return <NotificationsContent />;
      case 'profile':
        return <ProfileContent user={user} />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">

      {renderContent()}

      {/* Tagging Modal */}
      {showTaggingModal && <TaggingModal />}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 safe-area-bottom">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'posts', icon: BarChart3, label: 'Posts' },
          { id: 'insights', icon: TrendingUp, label: 'AI Coach' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map((tab) => (
          <ClickTracker
            key={tab.id}
            featureName={`bottom_nav_${tab.id}`}
            metadata={{ 
              from_tab: activeTab,
              to_tab: tab.id,
              has_instagram_data: !!instagramData
            }}
          >
            <button
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          </ClickTracker>
        ))}
      </div>
    </div>
  );
};

export default SocialSageMobile;