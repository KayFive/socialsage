import React, { useState, useEffect, useCallback } from 'react';
import { Send, Sparkles, TrendingUp, Users, Calendar, ArrowLeft, Target, ChevronRight, MessageCircle, Heart, Clock, BarChart3, RefreshCw, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Type definitions (COMPLETE - all from original)
interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface Post {
  id: string;
  media_type: string;
  caption?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  reach?: number;
  impressions?: number;
  saved?: number;
  shares?: number;
  profile_visits?: number;
  content_category?: string;
  comments?: Comment[];
  day?: string;
  hour?: number;
  time?: string;
  totalEngagement?: number;
}

interface Comment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  like_count?: number;
}

interface TopFollower {
  username: string;
  interactions: number;
  comments: number;
  likes: number;
  lastSeen: string;
  engagementType: 'high' | 'medium' | 'regular';
  postsEngaged: number;
}

interface SentimentMonth {
  month: string;
  positive: number;
  negative: number;
  neutral: number;
  totalComments: number;
  score: number;
}

interface PositiveComment {
  username: string;
  text: string;
  post: string;
}

interface Sentiment {
  overall: {
    positive: number;
    negative: number;
    neutral: number;
    totalComments: number;
  };
  score: number;
  trend: string;
  byMonth: SentimentMonth[];
  positiveComments: PositiveComment[];
}

interface WeekData {
  week: string;
  date: string;
  followers: number;
}

interface WeeklyEngagementData {
  week: string;
  label: string;
  engagementRate: number;
  posts: number;
}

interface FrequencyData {
  current: number;
  optimal: number;
  consistency: number;
  weeklyPattern: number[];
  optimalConfidence?: 'high' | 'medium' | 'low' | 'insufficient';
  optimalReasoning?: string;
  performanceByFrequency?: Array<{
    frequency: string;
    avgEngagementPerPost: number;
    weekCount: number;
    totalPosts: number;
  }>;
}

interface KeyStat {
  label: string;
  value: string | number;
  detail?: string;
}

interface Section {
  title: string;
  items: string[];
}

interface Action {
  priority: number;
  timeframe: string;
  action: string;
  details: string;
  impact: string;
  expected: string;
}

interface FormatStat {
  post_type: string;
  count: number;
  avg_likes: number;
  avg_comments: number;
  avg_reach: number;
  avg_impressions: number;
  engagement_rate: string;
  total_engagement: number;
}

interface CategoryStat {
  content_category: string;
  count: number;
  avg_likes: number;
  avg_comments: number;
  avg_reach: number;
  avg_impressions: number;
}

interface ResponseData {
  title: string;
  tldr: string;
  mainMetric: string;
  comparison: string;
  keyStats: KeyStat[];
  sections?: Section[];
  actions?: Action[];
  topFollowers?: TopFollower[];
  sentiment?: Sentiment;
  followerChart?: WeekData[];
  weeklyEngagementChart?: WeeklyEngagementData[];
  frequencyData?: FrequencyData;
  heatmapData?: Post[];
  topPosts?: Post[];
  recentPosts?: Post[];
  avgEngagement?: number;
  latestPost?: Post;
}

interface AICoachMainProps {
  instagramData: any;
  onNavigateToProfile: () => void;
}

interface InstagramData {
  followers: number;
  mediaCount: number;
  username: string;
  engagementRate: string;
  growthRate?: string | null;
  monthlyGrowth?: string | null;
  avgLikes?: number;
  avgComments?: number;
  totalReach?: number;
  totalImpressions?: number;
  avgReach?: number;
  recentPosts?: Post[];
  topFollowers?: TopFollower[];
  historicalData?: {
    weekly: Array<{date: string; followers: number; isComplete: boolean}>;
    monthly: Array<{date: string; followers: number; isComplete: boolean}>;
  };
  accountInsights?: {
    reach: number;
    profile_visits: number;
    saved: number;
    shares: number;
  };
  growthData?: {
    canCalculateWeekly: boolean;
    canCalculateMonthly: boolean;
    daysOfData: number;
    dataAvailableSince: string | null;
    daysUntilWeekly: number;
    daysUntilMonthly: number;
  };
  formatStats?: FormatStat[];
  categoryStats?: CategoryStat[];
  timingAnalysis?: any;
  contentAnalysis?: any;
}

interface QuickAction {
  icon: React.ReactElement;
  label: string;
  query: string;
}

interface DayGroup {
  posts: Post[];
  totalEng: number;
  totalReach: number;
}

interface TimeWindow {
  day: string;
  time: string;
  hour: number;
  engagement: string;
  likes: number;
  reach: number;
}

function AICoachUpdated({ instagramData, onNavigateToProfile }: AICoachMainProps) {
  const [hasAskedQuestion, setHasAskedQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [selectedPostForTagging, setSelectedPostForTagging] = useState<Post | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [postsView, setPostsView] = useState('recent');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [realInstagramData, setRealInstagramData] = useState<InstagramData | null>(null);

  const availableCategories: Category[] = [
    { id: 1, name: 'Tutorial', emoji: '📚' },
    { id: 2, name: 'How-to', emoji: '🛠️' },
    { id: 3, name: 'BTS', emoji: '🎬' },
    { id: 4, name: 'Tips', emoji: '💡' },
    { id: 5, name: 'Portfolio', emoji: '🎨' },
    { id: 6, name: 'Personal', emoji: '✨' }
  ];

  const quickActions: QuickAction[] = [
    { icon: React.createElement(TrendingUp, { className: "w-4 h-4" }), label: 'Growth', query: 'How am I growing?' },
    { icon: React.createElement(Calendar, { className: "w-4 h-4" }), label: 'Timing', query: 'When should I post?' },
    { icon: React.createElement(BarChart3, { className: "w-4 h-4" }), label: 'Content', query: 'What content performs best?' },
    { icon: React.createElement(Users, { className: "w-4 h-4" }), label: 'Engagement', query: 'What is my engagement rate?' },
    { icon: React.createElement(Target, { className: "w-4 h-4" }), label: 'Posts', query: 'How did my last post perform?' },
    { icon: React.createElement(MessageCircle, { className: "w-4 h-4" }), label: 'Audience', query: 'Who are my super fans?' },
    { icon: React.createElement(Clock, { className: "w-4 h-4" }), label: 'Frequency', query: 'How often should I post?' },
    { icon: React.createElement(Sparkles, { className: "w-4 h-4" }), label: 'Strategy', query: 'What should I focus on?' }
  ];

  // // Logout function
const handleLogout = async () => {
  console.log('🚪 Logging out from AI Coach...');
  
  try {
    // Clear storage first
    sessionStorage.removeItem('socialsage_user_id');
    sessionStorage.removeItem('socialsage_user_email');
    localStorage.clear();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Logout error:', error);
      alert('Logout failed. Please try again.');
      return;
    }
    
    console.log('✅ Logged out successfully');
    
    // 🔥 FIX #1: React navigation, no hard refresh
    onNavigateToProfile();
    
  } catch (error) {
    console.error('❌ Error during logout:', error);
    alert('An error occurred during logout.');
  }
};

  // // Reusable function to fetch Instagram data
const fetchInstagramData = useCallback(async () => {
  console.log('🔄 AI Coach: Fetching Instagram data...');
  setIsLoadingData(true);
  
  try {
    const response = await fetch('/api/instagram/metrics');
    console.log('📊 AI Coach: API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ AI Coach: Instagram data loaded:', {
        totalPosts: data.recentPosts?.length,
        taggedPosts: data.taggingProgress?.taggedPosts,
        categoryStats: data.categoryStats?.length,
        crossAnalysisStats: data.crossAnalysisStats?.length,
        crossAnalysisData: data.crossAnalysisStats
      });
      setRealInstagramData(data);
    } else {
      const error = await response.json();
      console.error('❌ AI Coach: API Error:', error);
    }
  } catch (error) {
    console.error('❌ AI Coach: Failed to fetch Instagram data:', error);
  }
  
  setIsLoadingData(false);
}, []);

// Fetch real Instagram data on mount
useEffect(() => {
  fetchInstagramData();
}, [fetchInstagramData]);

  // Use real data if available, otherwise fall back to prop data
  const activeData = realInstagramData || instagramData;

  function matchQuestion(query: string): string {
    const q = query.toLowerCase().trim();
    
    if (q.match(/how am i growing|am i gaining|am i losing|growth rate|growth percentage/i)) return 'growth';
    if (q.match(/when will i hit|milestone|how long until/i)) return 'growth';
    if (q.match(/what percentage.*followers.*see|reach.*follower.*ratio/i)) return 'growth';
    if (q.match(/how can i reach more|discovery power|limiting.*growth/i)) return 'growth';
    
    if (q.match(/engagement rate|what.?s my engagement/i)) return 'engagement';
    if (q.match(/are people engaging|type of engagement|engagement breakdown/i)) return 'engagement';
    if (q.match(/engagement.*improving|engagement.*declining|engagement.*quality/i)) return 'engagement';
    if (q.match(/how can i improve.*engagement|boost.*engagement|save rate/i)) return 'engagement';
    if (q.match(/valuable engagement|meaningful engagement|comment.*like.*ratio/i)) return 'engagement';
    
    if (q.match(/which content|what content|content.*perform/i)) return 'content';
    if (q.match(/should i focus.*reel|should i focus.*carousel/i)) return 'content';
    if (q.match(/content.*reaches.*most|which.*get.*saves|drive.*profile.*visit/i)) return 'content';
    if (q.match(/content.*categories.*perform|content.*mix|content.*missing/i)) return 'content';
    if (q.match(/what.*best.*combination|reel.*about.*carousel.*about/i)) return 'content';
    
    if (q.match(/last post|latest post|most recent post|my recent post/i)) return 'posts';
    if (q.match(/how did.*post perform|post performance|my posts/i)) return 'posts';
    if (q.match(/top post|best post|highest performing post/i)) return 'posts';
    if (q.match(/recent posts|last.*posts|latest.*posts/i)) return 'posts';
    if (q.match(/show.*my posts|which post.*best/i)) return 'posts';
    
    if (q.match(/when.*post|best time|best day|optimal.*time|optimal.*window/i)) return 'timing';
    if (q.match(/what time.*post|time of day.*post|time.*day.*best/i)) return 'timing';
    if (q.match(/when.*followers.*active|when.*followers.*engaged|when.*audience.*active/i)) return 'timing';
    if (q.match(/time slots.*engagement|which days.*perform|posting time.*affect/i)) return 'timing';
    if (q.match(/what.*best.*time|which time.*best|what day.*post/i)) return 'timing';
    
    if (q.match(/how often.*post|posting frequency|post.*per week|posts.*per.*week/i)) return 'frequency';
    if (q.match(/how many times.*week|times.*week.*post|times.*week.*should/i)) return 'frequency';
    if (q.match(/posting too much|posting too little|how consistent.*schedule/i)) return 'frequency';
    if (q.match(/posting more.*help|posting more.*hurt|ideal.*frequency/i)) return 'frequency';
    if (q.match(/consistency.*score|how.*consistent|posting.*schedule/i)) return 'frequency';
    if (q.match(/should.*post.*more|should.*post.*less|optimal.*frequency/i)) return 'frequency';
    
    if (q.match(/how many people see|average reach|total reach/i)) return 'reach';
    if (q.match(/impression|profile visit.*rate|how many.*profile visit/i)) return 'reach';
    
    if (q.match(/top followers|most engaged followers|super fans|who comments/i)) return 'audience';
    if (q.match(/sentiment|how.*people feel|positive.*negative|sentiment score/i)) return 'audience';
    if (q.match(/who are my fans|audience insights|community/i)) return 'audience';
    
    if (q.match(/what should i focus|what.*do next|strategy|priorities/i)) return 'strategy';
    if (q.match(/biggest opportunity|quick wins|what.?s working|what.*missing/i)) return 'strategy';
    if (q.match(/what should i post.*week|opportunities.*missing|pay attention/i)) return 'strategy';
    
    if (q.match(/\b(how many|average|avg).*like/i) && q.includes('per post')) return 'likes';
    if (q.match(/\b(how many|average|avg).*comment/i)) return 'comments';
    if (q.match(/\b(how many|average|avg).*save/i)) return 'saves';
    if (q.match(/how many followers.*have|follower count/i)) return 'followers';
    
    return 'overview';
  }

  function generateResponse(category: string): ResponseData {
    if (!activeData || !activeData.recentPosts || activeData.recentPosts.length === 0) {
      return {
        title: 'Instagram Not Connected',
        tldr: 'Connect your Instagram account to unlock AI-powered insights and personalized recommendations.',
        mainMetric: 'No data available',
        comparison: 'Connect Instagram to see metrics',
        keyStats: [
          { label: 'Status', value: 'Not Connected' },
          { label: 'Action Required', value: 'Connect' }
        ],
        sections: [
          {
            title: 'GET STARTED',
            items: [
              'Click the Profile tab to connect your Instagram account',
              'Grant the necessary permissions',
              'Come back here for AI-powered insights',
              'Get personalized recommendations to grow your account'
            ]
          }
        ],
        actions: [
          {
            priority: 1,
            timeframe: 'Now',
            action: 'Connect your Instagram account',
            details: 'Navigate to Profile tab and click Connect Instagram',
            impact: 'High',
            expected: 'Unlock all AI Coach features'
          }
        ]
      };
    }

    const posts = activeData.recentPosts;
    const avgLikes = activeData.avgLikes || 0;
    const avgComments = activeData.avgComments || 0;
    const avgReach = activeData.avgReach || 0;
    const followers = activeData.followers || 0;
    
    const reels = posts.filter((p: Post) => p.media_type === 'VIDEO');
    const carousels = posts.filter((p: Post) => p.media_type === 'CAROUSEL_ALBUM');
    const photos = posts.filter((p: Post) => p.media_type === 'IMAGE');
    
    const totalLikes = posts.reduce((sum: number, p: Post) => sum + (p.like_count || 0), 0);
    const totalComments = posts.reduce((sum: number, p: Post) => sum + (p.comments_count || 0), 0);
    const totalSaves = posts.reduce((sum: number, p: Post) => sum + (p.saved || 0), 0);
    const totalReach = posts.reduce((sum: number, p: Post) => sum + (p.reach || 0), 0);
    
    const totalEngagement = totalLikes + totalComments + totalSaves;
    const engagementRate = totalReach > 0 
      ? ((totalEngagement / totalReach) * 100).toFixed(1)
      : activeData.engagementRate ? parseFloat(activeData.engagementRate.replace('%', '')).toFixed(1) : '0.0';
    
    // Calculate timing analysis from posts
    const calculateOptimalTimes = () => {
      const dayGroups: Record<string, DayGroup> = {};
      
      posts.forEach((post: Post) => {
        const date = new Date(post.timestamp);
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        const hour = date.getHours();
        
        if (!dayGroups[day]) {
          dayGroups[day] = { posts: [], totalEng: 0, totalReach: 0 };
        }
        
        const engagement = (post.like_count || 0) + (post.comments_count || 0) + (post.saved || 0);
        const reach = post.reach || 0;
        
        dayGroups[day].posts.push({
          ...post,
          day,
          hour,
          time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          totalEngagement: engagement
        } as any);
        dayGroups[day].totalEng += engagement;
        dayGroups[day].totalReach += reach;
      });
      
      const dayStats = Object.keys(dayGroups).map((day) => {
        const group = dayGroups[day];
        return {
          day,
          avgEngagement: group.totalReach > 0 
            ? ((group.totalEng / group.totalReach) * 100).toFixed(1)
            : '0',
          posts: group.posts.length
        };
      }).sort((a, b) => parseFloat(b.avgEngagement) - parseFloat(a.avgEngagement));
      
      // Calculate top time windows
      const timeWindows: TimeWindow[] = [];
      posts.forEach((post: Post) => {
        const date = new Date(post.timestamp);
        const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        const hour = date.getHours();
        const engagement = (post.like_count || 0) + (post.comments_count || 0) + (post.saved || 0);
        const reach = post.reach || 0;
        const engRate = reach > 0 ? (engagement / reach * 100) : 0;
        
        timeWindows.push({
          day,
          time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          hour,
          engagement: engRate.toFixed(1),
          likes: post.like_count || 0,
          reach
        });
      });
      
      timeWindows.sort((a, b) => parseFloat(b.engagement) - parseFloat(a.engagement));
      
      // Get unique time windows
      const uniqueWindows: TimeWindow[] = [];
      const seen = new Set<string>();
      timeWindows.forEach((w) => {
        const key = w.day + '-' + w.hour;
        if (!seen.has(key) && uniqueWindows.length < 5) {
          seen.add(key);
          uniqueWindows.push(w);
        }
      });
      
      return { dayStats, uniqueWindows };
    };

    const { dayStats, uniqueWindows } = calculateOptimalTimes();
    const bestWindow = uniqueWindows[0];
    const bestHourLabel = bestWindow ? (
      bestWindow.hour === 0 ? '12 AM' : 
      bestWindow.hour < 12 ? bestWindow.hour + ' AM' : 
      bestWindow.hour === 12 ? '12 PM' : 
      (bestWindow.hour - 12) + ' PM'
    ) : '7 PM';

    // AUDIENCE - Generate sentiment from real comments
    if (category === 'audience') {
      const topFollowers = activeData.topFollowers || [];
      const superFans = topFollowers.filter((f: TopFollower) => f.engagementType === 'high');
      const activeFollowers = topFollowers.filter((f: TopFollower) => f.engagementType === 'medium');
      
      // Calculate sentiment from comments
      const allComments = posts.flatMap((p: Post) => p.comments || []);
      const positiveKeywords = ['love', 'great', 'awesome', 'amazing', 'excellent', 'perfect', 'beautiful', 'wonderful', 'thank', 'thanks', '❤️', '😍', '🔥', '✨', '🙌'];
      const negativeKeywords = ['bad', 'hate', 'terrible', 'awful', 'worst', 'horrible', 'ugly'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;
      
      allComments.forEach((comment: Comment) => {
        const text = comment.text.toLowerCase();
        const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
        const hasNegative = negativeKeywords.some(keyword => text.includes(keyword));
        
        if (hasPositive && !hasNegative) {
          positiveCount++;
        } else if (hasNegative) {
          negativeCount++;
        } else {
          neutralCount++;
        }
      });
      
      const totalSentimentComments = allComments.length || 1;
      const positivePercent = Math.round((positiveCount / totalSentimentComments) * 100);
      const negativePercent = Math.round((negativeCount / totalSentimentComments) * 100);
      const neutralPercent = Math.round((neutralCount / totalSentimentComments) * 100);
      const sentimentScore = positivePercent - negativePercent;
      
      // Get top positive comments
      const positiveComments = allComments
        .filter((comment: Comment) => {
          const text = comment.text.toLowerCase();
          return positiveKeywords.some(keyword => text.includes(keyword));
        })
        .slice(0, 3)
        .map((comment: Comment) => {
          const post = posts.find((p: Post) => p.comments?.some(c => c.id === comment.id));
          return {
            username: comment.username,
            text: comment.text,
            post: post?.caption?.slice(0, 30) || 'Post'
          };
        });

      // Generate by-month sentiment (mock for now, could be calculated from real timestamps)
      const byMonth: SentimentMonth[] = [
        { month: 'Aug', positive: 72, negative: 12, neutral: 16, totalComments: Math.round(totalSentimentComments * 0.3), score: 35 },
        { month: 'Sep', positive: 76, negative: 10, neutral: 14, totalComments: Math.round(totalSentimentComments * 0.35), score: 38 },
        { month: 'Oct', positive: positivePercent, negative: negativePercent, neutral: neutralPercent, totalComments: Math.round(totalSentimentComments * 0.35), score: sentimentScore }
      ];
      
      const sentiment: Sentiment = {
        overall: {
          positive: positivePercent,
          negative: negativePercent,
          neutral: neutralPercent,
          totalComments: totalSentimentComments
        },
        score: sentimentScore,
        trend: sentimentScore > 40 ? 'improving' : sentimentScore > 20 ? 'stable' : 'declining',
        byMonth,
        positiveComments
      };
      
      return {
        title: 'Audience & Community Insights',
        tldr: `You have ${superFans.length} super fans who consistently engage. ${positivePercent}% of comments are positive. ${allComments.length} real comments analyzed.`,
        mainMetric: `${superFans.length} super fans`,
        comparison: `${positivePercent}% positive sentiment`,
        topFollowers: topFollowers,
        sentiment: sentiment,
        keyStats: [
          { label: 'Super fans', value: superFans.length },
          { label: 'Active followers', value: activeFollowers.length },
          { label: 'Positive comments', value: positivePercent + '%' },
          { label: 'Sentiment score', value: (sentimentScore > 0 ? '+' : '') + sentimentScore }
        ],
        sections: [
          {
            title: 'YOUR SUPER FANS',
            items: superFans.length > 0 ? [
              `${superFans.length} followers consistently engage with your content (${superFans[0]?.interactions || 15}+ interactions)`,
              superFans[0] ? `@${superFans[0].username} is your #1 fan with ${superFans[0].interactions} interactions across ${superFans[0].postsEngaged} posts` : '',
              superFans[1] ? `@${superFans[1].username} has ${superFans[1].interactions} interactions - very engaged!` : '',
              `Super fans comment ${superFans.length > 0 ? Math.round(superFans.reduce((s: number, f: TopFollower) => s + f.comments, 0) / superFans.length) : 0}× more than average followers`
            ].filter(Boolean) : [
              'No super fans identified yet',
              'Build engagement by posting consistently',
              'Respond to comments to encourage more interaction',
              'Create content that sparks conversation'
            ]
          },
          {
            title: 'AUDIENCE SENTIMENT ANALYSIS',
            items: [
              `${positivePercent}% positive, ${negativePercent}% negative from ${totalSentimentComments} real comments`,
              `Sentiment score: ${sentimentScore > 0 ? '+' : ''}${sentimentScore} (${sentimentScore > 20 ? 'excellent' : sentimentScore > 0 ? 'good' : 'needs improvement'})`,
              `Analyzed ${allComments.length} comments from your recent ${posts.length} posts`,
              `Your audience is ${positivePercent > 70 ? 'highly positive' : positivePercent > 50 ? 'generally positive' : 'mixed'} about your content`
            ]
          },
          ...(positiveComments.length > 0 ? [{
            title: 'TOP POSITIVE COMMENTS',
            items: positiveComments.map((c: PositiveComment) => `@${c.username}: "${c.text.slice(0, 80)}..." on "${c.post}"`)
          }] : []),
          {
            title: 'COMMUNITY ENGAGEMENT TIPS',
            items: superFans.length > 0 ? [
              `Reply to @${superFans[0].username} - they've commented ${superFans[0].comments} times!`,
              'Feature super fans in your stories to strengthen relationships',
              'Your positive sentiment shows your audience values your content',
              'Keep creating the content that drives these positive reactions'
            ] : [
              'Start building your community by posting consistently',
              'Respond to every comment to encourage more engagement',
              'Ask questions in your captions to spark conversations',
              'Show appreciation for your engaged followers'
            ]
          }
        ],
        actions: superFans.length > 0 ? [
          {
            priority: 1,
            timeframe: 'This Week',
            action: 'Engage with your top 3 super fans',
            details: 'Reply to their comments and consider featuring them in stories',
            impact: 'High',
            expected: 'Strengthen community bonds and encourage more engagement'
          },
          {
            priority: 2,
            timeframe: 'This Month',
            action: 'Maintain positive sentiment',
            details: 'Continue creating content that resonates positively with your audience',
            impact: 'High',
            expected: 'Keep building loyal, engaged community'
          }
        ] : [
          {
            priority: 1,
            timeframe: 'This Week',
            action: 'Start building engagement',
            details: 'Post 3-4 times this week with questions in captions',
            impact: 'High',
            expected: 'Begin identifying your super fans'
          }
        ]
      };
    }
    
    // 🔥 ENHANCED GROWTH SECTION WITH FIXES
    if (category === 'growth') {
      const growthData = activeData.growthData;
      const historicalData = activeData.historicalData;
      const weeklyGrowthRate = activeData.growthRate;
      const monthlyGrowthRate = activeData.monthlyGrowth;
      
     // 🔥 FIX: Better handling of growth rate display (matching App_Main_Component logic)
let weeklyGrowth = 0;
let weeklyGrowthText = 'Calculating...';
let hasWeeklyData = false;

console.log('🔍 Growth Debug:', {
  weeklyGrowthRate,
  'growthData?.canCalculateWeekly': growthData?.canCalculateWeekly,
  'historicalData?.weekly?.length': historicalData?.weekly?.length,
  'historicalData?.weekly': historicalData?.weekly
});

// Check if we actually have weekly growth data from API
if (weeklyGrowthRate && weeklyGrowthRate !== 'null' && weeklyGrowthRate !== null) {
  console.log('✅ Using API growth rate');
  const match = weeklyGrowthRate.match(/([+-]?\d+\.?\d*)/);
  if (match) {
    weeklyGrowth = Math.round(parseFloat(match[1]) * followers / 100);
    weeklyGrowthText = weeklyGrowth >= 0 ? `+${weeklyGrowth}` : `${weeklyGrowth}`;
    hasWeeklyData = true;
  }
} else if (historicalData?.weekly?.length >= 2) {  // ← REMOVED growthData?.canCalculateWeekly check
  // Calculate from historical data (same as App_Main_Component)
  console.log('📊 Calculating weekly growth from historical data:', historicalData.weekly);
  const recentWeeks = historicalData.weekly.slice(-2);
  if (recentWeeks[0].followers > 0) {
    const growth = recentWeeks[1].followers - recentWeeks[0].followers;
    const rate = ((growth / recentWeeks[0].followers) * 100).toFixed(1);
    weeklyGrowth = growth;
    weeklyGrowthText = `${parseFloat(rate) >= 0 ? '+' : ''}${rate}%`;
    hasWeeklyData = true;
    console.log('✅ Calculated weekly growth:', { growth, rate, weeklyGrowthText, hasWeeklyData });
  } else {
    console.log('❌ First week has 0 followers');
  }
} else {
  console.log('❌ Not enough historical data:', {
    weeklyDataLength: historicalData?.weekly?.length,
    hasHistoricalData: !!historicalData
  });
  if (growthData && !growthData.canCalculateWeekly && growthData.daysUntilWeekly > 0) {
    weeklyGrowthText = `Available in ${growthData.daysUntilWeekly} days`;
  } else {
    weeklyGrowthText = 'Calculating...';
  }
}

console.log('🎯 Final growth values:', { weeklyGrowthText, hasWeeklyData });

      // Calculate total reach and profile visits in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPostsLast30Days = posts.filter((p: Post) => 
        new Date(p.timestamp) >= thirtyDaysAgo
      );
      
      const totalReachLast30Days = recentPostsLast30Days.reduce((sum: number, p: Post) => 
        sum + (p.reach || 0), 0
      );
      
      const totalProfileVisitsLast30Days = recentPostsLast30Days.reduce((sum: number, p: Post) => 
        sum + (p.profile_visits || 0), 0
      );

      // 🔥 NEW: Get format and category performance data from API
      const formatStats = activeData.formatStats || [];
      const categoryStats = activeData.categoryStats || [];
      
      // Find top performing format by reach
      const topFormatByReach = formatStats.length > 0 
        ? formatStats.reduce((best: FormatStat, current: FormatStat) => 
            current.avg_reach > best.avg_reach ? current : best
          )
        : null;
      
      // Find top performing category by reach
      const topCategoryByReach = categoryStats.length > 0
        ? categoryStats.reduce((best: CategoryStat, current: CategoryStat) =>
            current.avg_reach > best.avg_reach ? current : best
          )
        : null;

      // Calculate saves and shares impact
      const totalSavesLast30Days = recentPostsLast30Days.reduce((sum: number, p: Post) => 
        sum + (p.saved || 0), 0
      );
      const totalSharesLast30Days = recentPostsLast30Days.reduce((sum: number, p: Post) => 
        sum + (p.shares || 0), 0
      );

      // Format type mapping
      const getFormatName = (type: string) => {
        if (type === 'Reels') return 'Reels';
        if (type === 'Carousels') return 'Carousels';
        if (type === 'Posts') return 'Photos';
        return type;
      };
      
      return {
        title: 'Growth & Discovery Analysis',
        tldr: hasWeeklyData
          ? `Growing at ${weeklyGrowthText} followers/week (${weeklyGrowthRate}). Total reach in last 30 days: ${totalReachLast30Days.toLocaleString()}.`
          : growthData && growthData.daysOfData > 0
            ? `Collecting growth data (${growthData.daysOfData} days so far). Weekly rate available in ${growthData.daysUntilWeekly} days.`
            : `${followers.toLocaleString()} followers. Connect longer to track growth.`,
        mainMetric: hasWeeklyData ? `${weeklyGrowthText}/week` : weeklyGrowthText,
        comparison: hasWeeklyData ? weeklyGrowthRate : growthData ? `${growthData.daysOfData} days of data` : 'Building history',
        followerChart: historicalData?.weekly || [],
        keyStats: [
          { 
            label: 'Total followers', 
            value: followers.toLocaleString() 
          },
          { 
            label: 'Weekly growth rate', 
            value: weeklyGrowthText,
            detail: growthData ? `${growthData.daysOfData} days of data` : undefined
          },
          { 
            label: 'Total reach (30d)', 
            value: totalReachLast30Days.toLocaleString()
          },
          { 
            label: 'Profile visits (30d)', 
            value: totalProfileVisitsLast30Days.toLocaleString()
          }
        ],
        sections: [
          {
            title: 'GROWTH OVERVIEW',
            items: hasWeeklyData ? [
              `Growing at ${weeklyGrowthText} followers per week (${weeklyGrowthRate})`,
              monthlyGrowthRate && monthlyGrowthRate !== 'null' ? `Monthly growth: ${monthlyGrowthRate}` : '',
              `Total reach in last 30 days: ${totalReachLast30Days.toLocaleString()} accounts`,
              `Total profile visits in last 30 days: ${totalProfileVisitsLast30Days.toLocaleString()}`,
              growthData?.dataAvailableSince ? `Data collection started: ${growthData.dataAvailableSince}` : ''
            ].filter(Boolean) : growthData && growthData.daysOfData > 0 ? [
              `Building your growth history (${growthData.daysOfData} days of data collected)`,
              `Weekly growth rate available in ${growthData.daysUntilWeekly} more ${growthData.daysUntilWeekly === 1 ? 'day' : 'days'}`,
              `Monthly growth rate available in ${growthData.daysUntilMonthly} more days`,
              `Keep posting consistently to unlock accurate growth metrics`
            ] : [
              'Growth tracking will begin automatically',
              'Post consistently over the next 7 days',
              'Weekly growth rates will be available soon',
              'Monthly growth rates available after 30 days'
            ]
          },
          {
  title: 'WHAT DRIVES YOUR GROWTH',
  items: [
    // 🔥 NEW: Format performance with reach data
    ...(topFormatByReach ? [
      `${getFormatName(topFormatByReach.post_type)} drive the most reach: ${topFormatByReach.avg_reach.toLocaleString()} avg reach per post`,
      `${getFormatName(topFormatByReach.post_type)} get ${topFormatByReach.avg_likes} avg likes, ${topFormatByReach.avg_comments} comments`,
    ] : []),
    
    // 🔥 NEW: Category performance (if tagged)
    ...(topCategoryByReach ? [
      `"${topCategoryByReach.content_category}" content performs best: ${topCategoryByReach.avg_reach.toLocaleString()} avg reach`,
    ] : []),
    
    // 🔥 NEW: All format stats breakdown
    ...(formatStats.length > 0 ? [
      `Format breakdown: ${formatStats.map((f: FormatStat) => 
        `${f.count} ${getFormatName(f.post_type)} (${f.avg_reach.toLocaleString()} avg reach)`
      ).join(', ')}`
    ] : []),
    
    // 🔥 NEW: Saves & Shares impact on reach
    ...(totalSavesLast30Days > 0 || totalSharesLast30Days > 0 ? [
      `Last 30 days: ${totalSavesLast30Days} saves, ${totalSharesLast30Days} shares (drives algorithmic reach)`
    ] : []),
    
    // Timing (keeping your original timing metric)
    `Best posting times: ${bestWindow?.day || 'Evening'} around ${bestHourLabel}`
  ].filter(Boolean)
},
          // 🔥 NEW: Detailed format performance breakdown
          ...(formatStats.length > 1 ? [{
            title: 'FORMAT PERFORMANCE BREAKDOWN',
            items: formatStats
              .sort((a: CategoryStat, b: CategoryStat) => b.avg_reach - a.avg_reach)
              .map((format: FormatStat, idx: number) => 
                `${idx + 1}. ${getFormatName(format.post_type)}: ${format.avg_reach.toLocaleString()} reach • ` +
                `${format.avg_likes} likes • ${format.avg_comments} comments • ` +
                `${format.count} posts • ${format.engagement_rate} engagement rate`
              )
          }] : []),
          
          // 🔥 NEW: Category performance breakdown (if tagged posts exist)
          ...(categoryStats.length > 0 ? [{
            title: 'CATEGORY PERFORMANCE BREAKDOWN',
            items: categoryStats
              .sort((a: CategoryStat, b: CategoryStat) => b.avg_reach - a.avg_reach)
              .map((cat: CategoryStat, idx: number) =>
                `${idx + 1}. ${cat.content_category}: ${cat.avg_reach.toLocaleString()} reach • ` +
                `${cat.avg_likes} likes • ${cat.avg_comments} comments • ${cat.count} posts`
              )
          }] : [])
        ],
        actions: [
          {
            priority: 1,
            timeframe: 'This Week',
            action: growthData && !growthData.canCalculateWeekly 
              ? 'Continue posting consistently'
              : topFormatByReach 
                ? `Create 3 ${getFormatName(topFormatByReach.post_type)} at peak times`
                : 'Create 3 Reels at peak times',
            details: growthData && !growthData.canCalculateWeekly
              ? `Post ${7 - (growthData.daysOfData || 0)} more days to unlock weekly growth metrics`
              : topFormatByReach
                ? `${getFormatName(topFormatByReach.post_type)} drive ${topFormatByReach.avg_reach.toLocaleString()} avg reach - your best format`
                : 'Reels typically drive the most profile visits and discovery',
            impact: 'High',
            expected: growthData && !growthData.canCalculateWeekly
              ? 'Unlock accurate growth tracking'
              : topFormatByReach && weeklyGrowth > 0
                ? `Target ${Math.round(topFormatByReach.avg_reach * 1.2).toLocaleString()} reach per post`
                : '+50 followers'
          },
          // 🔥 NEW: Category-specific action if applicable
          ...(topCategoryByReach ? [{
            priority: 2,
            timeframe: 'This Week',
            action: `Focus on "${topCategoryByReach.content_category}" content`,
            details: `This category gets ${topCategoryByReach.avg_reach.toLocaleString()} avg reach - ${Math.round(topCategoryByReach.avg_reach / (avgReach || 1))}× better than average`,
            impact: 'High',
            expected: 'Maximize reach and discovery'
          }] : [])
        ]
      };
    }
    
    // ENGAGEMENT
    if (category === 'engagement') {
      const saveRate = totalLikes > 0 ? ((totalSaves / totalLikes) * 100).toFixed(1) : '0';
      const commentRate = totalLikes > 0 ? ((totalComments / totalLikes) * 100).toFixed(1) : '0';
      const avgSaveRate = posts.length > 0 ? (totalSaves / posts.length).toFixed(1) : '0';
      
      // Get category and format stats from API
      const categoryStats = activeData.categoryStats || [];
      const formatStats = activeData.formatStats || [];
      const crossAnalysisStats = activeData.crossAnalysisStats || [];
      
      // Calculate engagement by category
      const categoryEngagement = categoryStats.map((cat: CategoryStat) => ({
        category: cat.content_category,
        avgEngagement: cat.avg_likes + cat.avg_comments,
        avgLikes: cat.avg_likes,
        avgComments: cat.avg_comments,
        avgReach: cat.avg_reach || 0,
        count: cat.count
      })).sort((a: { avgEngagement: number }, b: { avgEngagement: number }) => b.avgEngagement - a.avgEngagement);
      
      // Find best performing combinations
      const bestCombo = crossAnalysisStats.length > 0 ? crossAnalysisStats[0] : null;
      
      // Find underutilized but promising combinations
      const promisingCombos = crossAnalysisStats
        .filter((combo: any) => combo.count <= 2 && (combo.avg_likes + combo.avg_comments) > avgLikes + avgComments)
        .sort((a: any, b: any) => (b.avg_likes + b.avg_comments) - (a.avg_likes + a.avg_comments));
      
      // Calculate format-specific save rates
      const reelSaves = reels.length > 0 ? Math.round(reels.reduce((s: number, p: Post) => s + (p.saved || 0), 0) / reels.length) : 0;
      const carouselSaves = carousels.length > 0 ? Math.round(carousels.reduce((s: number, p: Post) => s + (p.saved || 0), 0) / carousels.length) : 0;
      const photoSaves = photos.length > 0 ? Math.round(photos.reduce((s: number, p: Post) => s + (p.saved || 0), 0) / photos.length) : 0;
      
      // Find best format for saves
      const formatSaveComparison = [
        { format: 'Reels', saves: reelSaves, count: reels.length },
        { format: 'Carousels', saves: carouselSaves, count: carousels.length },
        { format: 'Photos', saves: photoSaves, count: photos.length }
      ].filter(f => f.count > 0).sort((a, b) => b.saves - a.saves);
      
      const bestSaveFormat = formatSaveComparison.length > 0 ? formatSaveComparison[0] : null;
      
      // Generate weekly engagement chart
      const postsPerWeek = Math.ceil(posts.length / 6);
      const weeklyEngagementData: WeeklyEngagementData[] = [];
      
      for (let i = 0; i < 6; i++) {
        const weekStart = i * postsPerWeek;
        const weekEnd = Math.min((i + 1) * postsPerWeek, posts.length);
        const weekPosts = posts.slice(weekStart, weekEnd);
        
        if (weekPosts.length > 0) {
          const weekTotalEng = weekPosts.reduce((sum: number, p: Post) => { 
            return sum + p.like_count + p.comments_count + (p.saved || 0); 
          }, 0);
          const weekTotalReach = weekPosts.reduce((sum: number, p: Post) => { 
            return sum + (p.reach || 0); 
          }, 0);
          const weekEngRate = weekTotalReach > 0 ? ((weekTotalEng / weekTotalReach) * 100).toFixed(1) : '0';
          
          const weeksAgo = 5 - i;
          const today = new Date();
          const weekStartDate = new Date(today);
          weekStartDate.setDate(today.getDate() - (weeksAgo * 7));
          const month = weekStartDate.getMonth() + 1;
          const day = weekStartDate.getDate();
          const weekLabel = month + '/' + day;
          
          weeklyEngagementData.push({
            week: 'Week ' + (i + 1),
            label: weekLabel,
            engagementRate: parseFloat(weekEngRate),
            posts: weekPosts.length
          });
        }
      }
      
      // Dynamic engagement boost recommendations based on actual data
      const engagementBoostItems = [];
      
      // Recommendation 1: Based on save format performance
      if (bestSaveFormat && bestSaveFormat.saves > 0) {
        if (bestSaveFormat.format === 'Carousels' && carousels.length < posts.length * 0.3) {
          engagementBoostItems.push(`Create more ${bestSaveFormat.format} - they get ${bestSaveFormat.saves} avg saves (your best format)`);
        } else if (bestSaveFormat.format === 'Carousels') {
          engagementBoostItems.push(`Keep creating ${bestSaveFormat.format} - ${bestSaveFormat.saves} avg saves is excellent`);
        } else {
          engagementBoostItems.push(`${bestSaveFormat.format} drive ${bestSaveFormat.saves} saves - consider making them educational/valuable`);
        }
      } else {
        engagementBoostItems.push('Focus on creating save-worthy educational Carousels');
      }
      
      // Recommendation 2: Based on comment rate
      if (parseFloat(commentRate) < 5) {
        engagementBoostItems.push(`Add specific question CTAs (current comment rate: ${commentRate}% - aim for 8%+)`);
      } else {
        engagementBoostItems.push(`Your ${commentRate}% comment rate is strong - keep asking engaging questions`);
      }
      
      // Recommendation 3: Based on category performance
      if (categoryEngagement.length > 0 && categoryEngagement[0].avgComments > avgComments * 1.2) {
        engagementBoostItems.push(`"${categoryEngagement[0].category}" content gets ${Math.round((categoryEngagement[0].avgComments / avgComments - 1) * 100)}% more comments - create more of this`);
      } else {
        engagementBoostItems.push('Use 90-150 word captions (sweet spot for engagement)');
      }
      
      // Recommendation 4: Response time
      engagementBoostItems.push('Reply to comments within 60 minutes (boosts algorithm)');
      
      return {
        title: 'Engagement & Quality Analysis',
        tldr: `${engagementRate}% engagement rate with ${saveRate}% save rate. ${bestSaveFormat ? `${bestSaveFormat.format} drive the most saves (${bestSaveFormat.saves} avg).` : 'Your content is bookmark-worthy.'} Analyzed ${posts.length} real posts.`,
        mainMetric: `${engagementRate}%`,
        comparison: 'Based on your actual post performance',
        weeklyEngagementChart: weeklyEngagementData,
        keyStats: [
          { label: 'Engagement rate', value: engagementRate + '%' },
          { label: 'Save rate', value: saveRate + '%' },
          { label: 'Comment rate', value: commentRate + '%' },
          { label: 'Avg saves/post', value: avgSaveRate }
        ],
        sections: [
          {
            title: 'ENGAGEMENT QUALITY INDICATORS',
            items: [
              `Save rate: ${saveRate}% (${parseFloat(saveRate) > 4 ? 'excellent' : parseFloat(saveRate) > 2 ? 'good' : 'growing'} - people bookmark your content)`,
              `Average ${avgSaveRate} saves per post${bestSaveFormat ? ` - ${bestSaveFormat.format} lead with ${bestSaveFormat.saves} avg` : ''}`,
              `Comment rate: ${commentRate}% per 100 likes (${parseFloat(commentRate) > 8 ? 'excellent' : parseFloat(commentRate) > 5 ? 'good' : 'room to improve'})`,
              `Total engagement: ${totalLikes.toLocaleString()} likes + ${totalComments.toLocaleString()} comments + ${totalSaves.toLocaleString()} saves`
            ]
          },
          {
            title: 'ENGAGEMENT BY FORMAT',
            items: [
              reels.length > 0 ? `Reels (${reels.length}): ${Math.round(reels.reduce((s: number, p: Post) => s + p.like_count, 0) / reels.length)} avg likes, ${reelSaves} saves, ${Math.round(reels.reduce((s: number, p: Post) => s + p.comments_count, 0) / reels.length)} comments` : '',
              carousels.length > 0 ? `Carousels (${carousels.length}): ${Math.round(carousels.reduce((s: number, p: Post) => s + p.like_count, 0) / carousels.length)} avg likes, ${carouselSaves} saves, ${Math.round(carousels.reduce((s: number, p: Post) => s + p.comments_count, 0) / carousels.length)} comments` : '',
              photos.length > 0 ? `Photos (${photos.length}): ${Math.round(photos.reduce((s: number, p: Post) => s + p.like_count, 0) / photos.length)} avg likes, ${photoSaves} saves, ${Math.round(photos.reduce((s: number, p: Post) => s + p.comments_count, 0) / photos.length)} comments` : '',
              posts.length > 0 ? `Based on your last ${posts.length} posts with complete metrics` : ''
            ].filter(Boolean)
          },
          ...(categoryEngagement.length > 0 ? [{
            title: 'ENGAGEMENT BY CATEGORY',
            items: categoryEngagement.slice(0, 5).map((cat: { category: string; avgEngagement: number; avgLikes: number; avgComments: number; avgReach: number; count: number }, idx: number) => 
              `${idx + 1}. ${cat.category}: ${cat.avgEngagement} avg engagement (${cat.avgLikes} likes, ${cat.avgComments} comments)${cat.avgReach > 0 ? ` • ${cat.avgReach.toLocaleString()} avg reach` : ''} • ${cat.count} posts`
            )
          }] : []),
          {
            title: 'DATA-DRIVEN ENGAGEMENT TIPS',
            items: engagementBoostItems
          }
        ],
        actions: [
          ...(bestCombo ? [{
            priority: 1,
            timeframe: 'This Week',
            action: `Create 2-3 more ${bestCombo.content_category} ${bestCombo.post_type === 'VIDEO' ? 'Reels' : bestCombo.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}`,
            details: `Your best combo: ${bestCombo.avg_likes + bestCombo.avg_comments} avg engagement${bestCombo.avg_reach > 0 ? ` with ${bestCombo.avg_reach.toLocaleString()} avg reach` : ''}`,
            impact: 'High',
            expected: `Target ${Math.round((bestCombo.avg_likes + bestCombo.avg_comments) * 1.1)}+ engagement per post`
          }] : [{
            priority: 1,
            timeframe: 'This Week',
            action: bestSaveFormat ? `Create 2 ${bestSaveFormat.format === 'Carousels' ? 'educational Carousels' : bestSaveFormat.format}` : 'Create 2 educational Carousels',
            details: bestSaveFormat ? `${bestSaveFormat.format} get ${bestSaveFormat.saves} avg saves - your best performing format` : 'Carousels typically drive high save rates',
            impact: 'High',
            expected: bestSaveFormat ? `Target ${Math.round(bestSaveFormat.saves * 1.2)}+ saves per post` : 'Higher save rate = better reach'
          }]),
          ...(promisingCombos.length > 0 ? [{
            priority: 2,
            timeframe: 'This Week',
            action: `Try ${promisingCombos[0].content_category} ${promisingCombos[0].post_type === 'VIDEO' ? 'Reels' : promisingCombos[0].post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}`,
            details: `You've only posted ${promisingCombos[0].count} of these, but they got ${promisingCombos[0].avg_likes + promisingCombos[0].avg_comments} avg engagement - promising!`,
            impact: 'Medium',
            expected: 'Test if this underutilized combo can become your new top performer'
          }] : [{
            priority: 2,
            timeframe: 'Every Post',
            action: parseFloat(commentRate) < 5 ? 'End captions with specific questions' : 'Keep asking engaging questions',
            details: parseFloat(commentRate) < 5 
              ? `Current comment rate: ${commentRate}% - specific questions drive more conversation than generic CTAs`
              : `Your ${commentRate}% comment rate is working - maintain this approach`,
            impact: 'Medium',
            expected: parseFloat(commentRate) < 5 ? `Increase comment rate to ${(parseFloat(commentRate) * 1.5).toFixed(1)}%` : 'Maintain high comment engagement'
          }])
        ]
      };
    }

    // CONTENT
if (category === 'content') {
  const reelsAvgEngagement = reels.length > 0
    ? Math.round(reels.reduce((s: number, p: Post) => s + p.like_count + p.comments_count + (p.saved || 0), 0) / reels.length)
    : 0;
  const carouselsAvgEngagement = carousels.length > 0
    ? Math.round(carousels.reduce((s: number, p: Post) => s + p.like_count + p.comments_count + (p.saved || 0), 0) / carousels.length)
    : 0;
  const photosAvgEngagement = photos.length > 0
    ? Math.round(photos.reduce((s: number, p: Post) => s + p.like_count + p.comments_count + (p.saved || 0), 0) / photos.length)
    : 0;
  
  const reelPercentage = posts.length > 0 ? Math.round((reels.length / posts.length) * 100) : 0;
  const carouselPercentage = posts.length > 0 ? Math.round((carousels.length / posts.length) * 100) : 0;
  const photoPercentage = posts.length > 0 ? Math.round((photos.length / posts.length) * 100) : 0;
  
  // 🔥 FIX #2: Use API taggingProgress data instead of filtering
const taggedPostCount = activeData.taggingProgress?.taggedPosts || 0;
const totalPostCount = activeData.taggingProgress?.totalPosts || posts.length;
const untaggedCount = activeData.taggingProgress?.untaggedPosts || (totalPostCount - taggedPostCount);
const hasTaggedPosts = taggedPostCount > 0;
  
  if (!hasTaggedPosts) {
    // No tagged posts - show tagging prompt
    return {
      title: 'Content Performance Analysis',
      tldr: posts.length > 0
        ? `Reels lead with ${reelsAvgEngagement} avg engagement. Carousels get ${carouselsAvgEngagement}. Tag posts to unlock category insights.`
        : `No posts to analyze yet. Start posting to see insights.`,
      mainMetric: posts.length > 0 ? 'Start tagging posts' : 'No posts yet',
      comparison: `${posts.length} posts analyzed`,
      keyStats: [
  { label: 'Reels', value: reels.length, detail: reelsAvgEngagement > 0 ? `${reelsAvgEngagement} avg eng` : undefined },
  { label: 'Carousels', value: carousels.length, detail: carouselsAvgEngagement > 0 ? `${carouselsAvgEngagement} avg eng` : undefined },
  { label: 'Photos', value: photos.length, detail: photosAvgEngagement > 0 ? `${photosAvgEngagement} avg eng` : undefined },
  { label: 'Posts tagged', value: `${taggedPostCount}/${totalPostCount}` }
],
      sections: [
        {
          title: 'FORMAT PERFORMANCE',
          items: posts.length > 0 ? [
            reels.length > 0 ? `Reels (${reelPercentage}%): ${reelsAvgEngagement} avg engagement, best for discovery` : 'No Reels yet',
            carousels.length > 0 ? `Carousels (${carouselPercentage}%): ${carouselsAvgEngagement} avg engagement, best for saves` : 'No Carousels yet',
            photos.length > 0 ? `Photos (${photoPercentage}%): ${photosAvgEngagement} avg engagement` : 'No Photos yet',
            'Tag posts below to unlock detailed category insights'
          ].filter(Boolean) : [
            'No posts to analyze yet',
            'Start posting to see insights',
            'Mix Reels, Carousels, and Photos',
            'Come back after posting to see performance'
          ]
        },
        {
          title: 'UNLOCK CATEGORY INSIGHTS',
          items: [
            '🏷️ Tag your posts with categories (Tutorial, How-to, BTS, Tips, Portfolio)',
            '📊 See which content categories drive the most engagement',
            '🎯 Identify your best-performing content types',
            '📈 Get personalized recommendations based on category performance'
          ]
        }
      ],
      actions: posts.length > 0 ? [
        {
          priority: 1,
          timeframe: 'Today',
          action: `Tag your posts with categories`,
          details: 'Scroll down to quickly tag untagged posts',
          impact: 'High',
          expected: 'Unlock detailed category performance analysis'
        }
      ] : [
        {
          priority: 1,
          timeframe: 'This Week',
          action: 'Post your first 3 Reels',
          details: 'Start building your content history',
          impact: 'High',
          expected: 'Begin unlocking insights'
        }
      ]
    };
  }
  
  // 🔥 FIX #3: Use API categoryStats directly
const categoryStats = activeData.categoryStats || [];
const sortedCategories = [...categoryStats].sort((a: any, b: any) => 
  (b.avg_likes + b.avg_comments) - (a.avg_likes + a.avg_comments)
);
const bestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;

// 🔥 FIX #4: Get cross-analysis stats from API (already in correct format)
const crossAnalysisStats = activeData.crossAnalysisStats || [];
const bestCategoryFormat = crossAnalysisStats.length > 0 ? crossAnalysisStats[0] : null;

// Legacy format for backward compatibility
const categoryFormatStats = crossAnalysisStats.map((stat: any) => ({
  category: stat.content_category,
  format: stat.post_type === 'VIDEO' ? 'Reel' : stat.post_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo',
  count: stat.count,
  avgEng: stat.avg_likes + stat.avg_comments,
  avgLikes: stat.avg_likes,
  avgComments: stat.avg_comments,
  avgReach: stat.avg_reach
}));

// untaggedCount already calculated above from activeData.taggingProgress

// Safety check - if no valid data, show tagging prompt
if (!bestCategory || !bestCategoryFormat) {
  return {
    title: 'Content Performance Analysis',
    tldr: `${posts.length} posts found. Tag them to see detailed category insights.`,
    mainMetric: 'No category data',
    comparison: `${posts.length} posts`,
    keyStats: [
      { label: 'Posts', value: posts.length },
      { label: 'Tagged', value: taggedPostCount }
    ],
    sections: [{
      title: 'TAG YOUR POSTS',
      items: ['Tag posts below to unlock category performance insights']
    }]
  };
}
  
  return {
  title: 'Content Performance Analysis',
  tldr: `${bestCategory.content_category} content leads with ${bestCategory.avg_likes + bestCategory.avg_comments} avg engagement. Best combo: ${bestCategoryFormat.content_category} ${bestCategoryFormat.post_type === 'VIDEO' ? 'Reels' : bestCategoryFormat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}.`,
  mainMetric: `${sortedCategories.length} categories`,
  comparison: `${taggedPostCount}/${totalPostCount} posts tagged`,
  keyStats: [
  { label: 'Best category', value: bestCategory.content_category },
  { label: 'Avg engagement', value: bestCategory.avg_likes + bestCategory.avg_comments },
  { label: 'Best combo', value: `${bestCategoryFormat.content_category} ${bestCategoryFormat.post_type === 'VIDEO' ? 'Reels' : bestCategoryFormat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}` },
  { label: 'Tagged', value: `${taggedPostCount}/${totalPostCount}` }
],
  sections: [
  {
    title: 'CATEGORY PERFORMANCE BREAKDOWN',
    items: sortedCategories.map((cat: any, idx: number) => 
      `${idx + 1}. ${cat.content_category}: ${cat.avg_likes + cat.avg_comments} engagement (${cat.avg_likes} likes, ${cat.avg_comments} comments) • ${cat.count} ${cat.count === 1 ? 'post' : 'posts'}`
    )
  },
  ...(crossAnalysisStats.length > 0 ? [{
    title: 'CATEGORY × FORMAT PERFORMANCE',
    items: crossAnalysisStats.slice(0, 6).map((stat: any, idx: number) =>
      `${idx + 1}. ${stat.content_category} ${stat.post_type === 'VIDEO' ? 'Reels' : stat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}: ${stat.avg_likes + stat.avg_comments} engagement (${stat.avg_likes} likes, ${stat.avg_comments} comments, ${stat.avg_reach.toLocaleString()} reach) • ${stat.count} ${stat.count === 1 ? 'post' : 'posts'}`
    )
  }] : []),
  {
    title: 'FORMAT PERFORMANCE',
    items: [
      reels.length > 0 ? `Reels (${reelPercentage}%): ${reelsAvgEngagement} avg engagement` : '',
      carousels.length > 0 ? `Carousels (${carouselPercentage}%): ${carouselsAvgEngagement} avg engagement` : '',
      photos.length > 0 ? `Photos (${photoPercentage}%): ${photosAvgEngagement} avg engagement` : '',
      `Optimal mix: 70% Reels, 25% Carousels, 5% Photos`
    ].filter(Boolean)
  },
  {
    title: 'YOUR CURRENT CONTENT MIX',
    items: [
      `Reels: ${reelPercentage}% (${reelPercentage >= 60 ? '✅ Good' : '⚠️ Increase to 70%'})`,
      `Carousels: ${carouselPercentage}% (${carouselPercentage >= 20 && carouselPercentage <= 30 ? '✅ Good' : '⚠️ Target 25%'})`,
      `Photos: ${photoPercentage}% (${photoPercentage <= 10 ? '✅ Good' : '⚠️ Reduce to 5%'})`,
      untaggedCount > 0 ? `${untaggedCount} posts still untagged - tag them for complete insights` : 'All posts tagged! 🎉'
    ]
  },
  {
    title: 'KEY INSIGHTS',
    items: [
      `Best performing combo: ${bestCategoryFormat.content_category} ${bestCategoryFormat.post_type === 'VIDEO' ? 'Reels' : bestCategoryFormat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'} with ${bestCategoryFormat.avg_likes + bestCategoryFormat.avg_comments} avg engagement`,
      bestCategoryFormat.avg_reach > 0 ? `This combo reaches ${bestCategoryFormat.avg_reach.toLocaleString()} accounts on average` : '',
      `${bestCategory.content_category} content gets ${bestCategory.avg_likes + bestCategory.avg_comments} avg engagement - highly valuable to your audience`,
      crossAnalysisStats.length > 3 ? `You have ${crossAnalysisStats.length} different content combinations - good variety!` : 'Try creating more category × format combinations'
    ].filter(Boolean)
  }
],
  actions: [
  {
    priority: 1,
    timeframe: 'This Week',
    action: `Create 3 more ${bestCategoryFormat.content_category} ${bestCategoryFormat.post_type === 'VIDEO' ? 'Reels' : bestCategoryFormat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}`,
    details: `This is your top-performing combination: ${bestCategoryFormat.avg_likes + bestCategoryFormat.avg_comments} avg engagement`,
    impact: 'High',
    expected: `Target ${Math.round((bestCategoryFormat.avg_likes + bestCategoryFormat.avg_comments) * 1.1)}+ engagement per post`
  },
    ...(untaggedCount > 0 ? [{
      priority: 2,
      timeframe: 'Today',
      action: `Tag remaining ${untaggedCount} posts`,
      details: 'Scroll down to quickly tag untagged posts for complete insights',
      impact: 'Medium',
      expected: 'More accurate category × format analysis'
    }] : [])
  ]
};
}

    // POSTS
    if (category === 'posts') {
      if (posts.length === 0) {
        return {
          title: 'Post Performance',
          tldr: 'No posts to analyze yet. Create your first post to see detailed performance insights.',
          mainMetric: 'No posts',
          comparison: 'Start posting to unlock insights',
          keyStats: [
            { label: 'Posts', value: 0 },
            { label: 'Action needed', value: 'Create content' }
          ],
          sections: [
            {
              title: 'GET STARTED',
              items: [
                'Create your first Reel or Carousel',
                'Post consistently (3-4 times per week)',
                'Come back to see detailed performance analysis',
                'Track what content works best for your audience'
              ]
            }
          ],
          actions: [
            {
              priority: 1,
              timeframe: 'Today',
              action: 'Create your first post',
              details: 'Start with a quick tip or behind-the-scenes content',
              impact: 'High',
              expected: 'Begin building your content insights'
            }
          ]
        };
      }

      const latestPost = posts[0];
      const latestEngagement = latestPost.like_count + latestPost.comments_count + (latestPost.saved || 0);
      const avgEngagement = posts.length > 0
        ? Math.round(posts.reduce((s: number, p: Post) => s + p.like_count + p.comments_count + (p.saved || 0), 0) / posts.length)
        : 0;
      const vsAverage = avgEngagement > 0
        ? (((latestEngagement - avgEngagement) / avgEngagement) * 100).toFixed(0)
        : '0';
      
      const topPosts = [...posts]
        .map((p) => ({
          ...p,
          totalEngagement: p.like_count + p.comments_count + (p.saved || 0)
        }))
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 5);
      
      const recentPosts = posts.slice(0, 8);
      
      return {
        title: 'Latest Post Performance',
        tldr: `"${latestPost.caption?.slice(0, 50) || 'Your post'}..." got ${latestEngagement} total engagement - ${parseFloat(vsAverage) > 0 ? vsAverage + '% above' : Math.abs(parseFloat(vsAverage)) + '% below'} your ${avgEngagement} average.`,
        mainMetric: `${latestEngagement} engagement`,
        comparison: `${parseFloat(vsAverage) > 0 ? '+' : ''}${vsAverage}% vs average`,
        latestPost: latestPost,
        topPosts: topPosts,
        recentPosts: recentPosts,
        avgEngagement: avgEngagement,
        keyStats: [
          { label: 'Latest post likes', value: latestPost.like_count },
          { label: 'Comments', value: latestPost.comments_count },
          { label: 'Saves', value: latestPost.saved || 0 },
          { label: 'Reach', value: latestPost.reach ? latestPost.reach.toLocaleString() : 'N/A' }
        ],
        sections: [
          {
            title: 'LATEST POST ANALYSIS',
            items: [
              `Posted: ${new Date(latestPost.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
              `Type: ${latestPost.media_type === 'VIDEO' ? 'Reel' : latestPost.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'}`,
              `${latestEngagement} total engagement (likes + comments + saves)`,
              `Performance: ${parseFloat(vsAverage) > 0 ? `${vsAverage}% above average 📈` : parseFloat(vsAverage) < 0 ? `${Math.abs(parseFloat(vsAverage))}% below average 📉` : 'Right at average'}`
            ]
          },
          {
            title: 'YOUR TOP PERFORMERS',
            items: topPosts.slice(0, 3).map((post, idx) => 
              `#${idx + 1}: "${post.caption?.slice(0, 40) || 'Post'}..." (${post.totalEngagement} engagement)`
            )
          }
        ],
        actions: [
          {
            priority: 1,
            timeframe: 'Next Post',
            action: parseFloat(vsAverage) > 0
              ? 'Recreate what worked in your latest post'
              : `Try posting a ${topPosts[0].media_type === 'VIDEO' ? 'Reel' : topPosts[0].media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'} like your top performer`,
            details: parseFloat(vsAverage) > 0
              ? 'Your latest post is performing above average - double down'
              : 'Learn from your best-performing content',
            impact: 'High',
            expected: parseFloat(vsAverage) > 0
              ? 'Sustain high performance'
              : `Target ${topPosts[0].totalEngagement}+ engagement`
          }
        ]
      };
    }

    // TIMING
    if (category === 'timing') {
      return {
        title: 'Timing Optimization Analysis',
        tldr: uniqueWindows.length > 0
          ? `Best posting windows: ${uniqueWindows[0].day} at ${uniqueWindows[0].time} (${uniqueWindows[0].engagement}% engagement). Based on ${posts.length} real posts.`
          : `Analyzed ${posts.length} posts. ${posts.length >= 5 ? 'Timing patterns emerging.' : 'Post more to identify optimal times.'}`,
        mainMetric: bestWindow ? `${bestWindow.day} at ${bestHourLabel}` : 'Building data',
        comparison: posts.length > 0 ? 'Based on your post performance' : 'Post more to unlock',
        keyStats: [
          { label: 'Best day', value: dayStats[0]?.day || 'Analyzing...' },
          { label: 'Best time', value: bestHourLabel },
          { label: 'Peak engagement', value: bestWindow?.engagement ? bestWindow.engagement + '%' : 'N/A' },
          { label: 'Posts analyzed', value: posts.length }
        ],
        heatmapData: posts,
        sections: [
          ...(uniqueWindows.length > 0 ? [{
            title: 'YOUR TOP POSTING WINDOWS',
            items: uniqueWindows.slice(0, 5).map((w, i) => {
              const hourLabel = w.hour === 0 ? '12 AM' : 
                               w.hour < 12 ? w.hour + ' AM' : 
                               w.hour === 12 ? '12 PM' : 
                               (w.hour - 12) + ' PM';
              return `${i + 1}. ${w.day} at ${hourLabel}: ${w.engagement}% engagement (${w.likes} likes, ${w.reach.toLocaleString()} reach)`;
            })
          }] : []),
          ...(dayStats.length > 0 ? [{
            title: 'DAY-BY-DAY BREAKDOWN',
            items: dayStats.slice(0, 5).map((d, i) => 
              `${i + 1}. ${d.day}: ${d.avgEngagement}% engagement (${d.posts} posts)`
            )
          }] : []),
          {
            title: posts.length >= 5 ? 'WHY TIMING MATTERS' : 'BUILD YOUR TIMING DATA',
            items: posts.length >= 5 ? [
              bestWindow ? `Your audience is most active on ${bestWindow.day}s` : 'Keep posting to identify patterns',
              'Posting during peak times = faster initial engagement',
              'Early engagement velocity determines algorithmic reach',
              'Evening posts typically perform best'
            ] : [
              `You have ${posts.length} posts - need at least 5 to identify patterns`,
              'Post at different times and days',
              'Mix morning, afternoon, and evening posts',
              'Come back after posting more to see timing insights'
            ]
          }
        ],
        actions: posts.length >= 5 && bestWindow ? [
          {
            priority: 1,
            timeframe: 'This Week',
            action: `Schedule your best content for ${bestWindow.day} at ${bestHourLabel}`,
            details: 'This exact hour has your highest engagement',
            impact: 'High',
            expected: `+${Math.round((parseFloat(bestWindow.engagement) / parseFloat(engagementRate) - 1) * 100)}% engagement boost`
          }
        ] : [
          {
            priority: 1,
            timeframe: 'This Week',
            action: `Post ${5 - posts.length} more times at varied times`,
            details: 'Test different times to identify your optimal posting schedule',
            impact: 'High',
            expected: 'Unlock timing insights'
          }
        ]
      };
    }

    // 🔥 COMPLETE FREQUENCY SECTION WITH DYNAMIC OPTIMAL CALCULATION
// This replaces your entire frequency block

    // FREQUENCY - FIXED: Calculate real posting frequency with DYNAMIC optimal based on YOUR performance
    if (category === 'frequency') {
      // Helper function to calculate optimal frequency from actual performance data
      const calculateOptimalFrequency = (posts: Post[]): {
        optimal: number;
        confidence: 'high' | 'medium' | 'low' | 'insufficient';
        reasoning: string;
        performanceByFrequency: Array<{
          frequency: string;
          avgEngagementPerPost: number;
          weekCount: number;
          totalPosts: number;
        }>;
      } => {
        console.log('🧮 Calculating optimal frequency from YOUR data...');
        
        // Need at least 10 posts spanning 3+ weeks for reliable recommendations
        const postDates = posts.map((p: Post) => new Date(p.timestamp)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
        if (postDates.length < 10) {
          return {
            optimal: 4,
            confidence: 'insufficient',
            reasoning: `Need 10+ posts to calculate your optimal frequency. Using industry standard of 4/week as starting point.`,
            performanceByFrequency: []
          };
        }
        
        const oldestPost = postDates[postDates.length - 1];
        const newestPost = postDates[0];
        const totalDays = Math.ceil((newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24));
        const totalWeeks = totalDays / 7;
        
        if (totalWeeks < 3) {
          return {
            optimal: 4,
            confidence: 'insufficient',
            reasoning: `Need 3+ weeks of posting history. Using industry standard of 4/week as starting point.`,
            performanceByFrequency: []
          };
        }
        
        // Group posts by week
        const weeklyGroups = new Map<string, { posts: Post[]; totalEngagement: number }>();
        
        posts.forEach((post: Post) => {
          const postDate = new Date(post.timestamp);
          const weekStart = new Date(postDate);
          weekStart.setDate(postDate.getDate() - postDate.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekKey = weekStart.toISOString().split('T')[0];
          
          if (!weeklyGroups.has(weekKey)) {
            weeklyGroups.set(weekKey, { posts: [], totalEngagement: 0 });
          }
          
          const engagement = (post.like_count || 0) + (post.comments_count || 0) + (post.saved || 0);
          weeklyGroups.get(weekKey)!.posts.push(post);
          weeklyGroups.get(weekKey)!.totalEngagement += engagement;
        });
        
        // Group weeks by posting frequency
        const frequencyBuckets = new Map<string, { weeks: number; totalPosts: number; totalEngagement: number }>();
        
        weeklyGroups.forEach((week) => {
          const postCount = week.posts.length;
          if (postCount === 0) return;
          
          let bucket: string;
          if (postCount === 1) bucket = '1 post/week';
          else if (postCount === 2) bucket = '2 posts/week';
          else if (postCount === 3) bucket = '3 posts/week';
          else if (postCount >= 4 && postCount <= 5) bucket = '4-5 posts/week';
          else if (postCount >= 6 && postCount <= 7) bucket = '6-7 posts/week';
          else bucket = '8+ posts/week';
          
          if (!frequencyBuckets.has(bucket)) {
            frequencyBuckets.set(bucket, { weeks: 0, totalPosts: 0, totalEngagement: 0 });
          }
          
          const data = frequencyBuckets.get(bucket)!;
          data.weeks += 1;
          data.totalPosts += week.posts.length;
          data.totalEngagement += week.totalEngagement;
        });
        
        // Calculate performance by frequency
        const performanceByFrequency = Array.from(frequencyBuckets.entries())
          .map(([frequency, data]) => ({
            frequency,
            avgEngagementPerPost: data.totalPosts > 0 ? Math.round(data.totalEngagement / data.totalPosts) : 0,
            weekCount: data.weeks,
            totalPosts: data.totalPosts
          }))
          .filter(bucket => bucket.weekCount >= 1)
          .sort((a, b) => b.avgEngagementPerPost - a.avgEngagementPerPost);
        
        if (performanceByFrequency.length === 0) {
          return {
            optimal: 4,
            confidence: 'insufficient',
            reasoning: 'Not enough varied frequency data. Using industry standard of 4/week.',
            performanceByFrequency: []
          };
        }
        
        // Find optimal
        const bestBucket = performanceByFrequency[0];
        let optimalFrequency: number;
        
        if (bestBucket.frequency.includes('1 post')) optimalFrequency = 1;
        else if (bestBucket.frequency.includes('2 posts')) optimalFrequency = 2;
        else if (bestBucket.frequency.includes('3 posts')) optimalFrequency = 3;
        else if (bestBucket.frequency.includes('4-5')) optimalFrequency = 4;
        else if (bestBucket.frequency.includes('6-7')) optimalFrequency = 6;
        else if (bestBucket.frequency.includes('8+')) optimalFrequency = 7;
        else optimalFrequency = 4;
        
        optimalFrequency = Math.min(optimalFrequency, 7);
        
        // Confidence level
        let confidence: 'high' | 'medium' | 'low';
        if (bestBucket.weekCount >= 4 && performanceByFrequency.length >= 3) {
          confidence = 'high';
        } else if (bestBucket.weekCount >= 2 && performanceByFrequency.length >= 2) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }
        
        // Reasoning
        const secondBest = performanceByFrequency[1];
        const improvement = secondBest 
          ? Math.round(((bestBucket.avgEngagementPerPost - secondBest.avgEngagementPerPost) / secondBest.avgEngagementPerPost) * 100)
          : 0;
        
        let reasoning = `${bestBucket.frequency} gets you ${bestBucket.avgEngagementPerPost} avg engagement per post`;
        if (secondBest && improvement > 10) {
          reasoning += ` (${improvement}% better than ${secondBest.frequency})`;
        }
        reasoning += ` - tested across ${bestBucket.weekCount} weeks`;
        
        console.log(`✅ Dynamic optimal: ${optimalFrequency}/week (${confidence} confidence)`, performanceByFrequency);
        
        return { optimal: optimalFrequency, confidence, reasoning, performanceByFrequency };
      };
      
      // Calculate REAL time span and frequency
      if (posts.length === 0) {
        return {
          title: 'Posting Frequency Analysis',
          tldr: 'No posts to analyze yet. Start posting to track your frequency.',
          mainMetric: 'No data',
          comparison: 'Start posting',
          keyStats: [
            { label: 'Posts', value: 0 },
            { label: 'Action needed', value: 'Create content' }
          ],
          sections: [{
            title: 'GET STARTED',
            items: [
              'Post your first 3-4 Reels this week',
              'Aim for 3-4 posts per week initially',
              'After 10+ posts, I\'ll calculate YOUR optimal frequency',
              'Come back after 2 weeks to see insights'
            ]
          }],
          actions: [{
            priority: 1,
            timeframe: 'This Week',
            action: 'Post 3-4 Reels',
            details: 'Start building your posting history',
            impact: 'High',
            expected: 'Begin tracking frequency'
          }]
        };
      }
      
      const postDates = posts.map((p: Post) => new Date(p.timestamp)).sort((a: Date, b: Date) => b.getTime() - a.getTime());
      const oldestPost = postDates[postDates.length - 1];
      const newestPost = postDates[0];
      const totalDays = Math.max(1, Math.ceil((newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24)));
      const totalWeeks = Math.max(1, totalDays / 7);
      const currentFrequency = parseFloat((posts.length / totalWeeks).toFixed(1));
      
      // 🔥 CALCULATE DYNAMIC OPTIMAL FREQUENCY
      const optimalCalc = calculateOptimalFrequency(posts);
      const optimalFrequency = optimalCalc.optimal;
      
      console.log('📊 REAL Frequency + Dynamic Optimal:', {
        totalPosts: posts.length,
        totalDays,
        totalWeeks: totalWeeks.toFixed(1),
        currentFrequency: currentFrequency + '/week',
        optimalFrequency: optimalFrequency + '/week',
        confidence: optimalCalc.confidence,
        reasoning: optimalCalc.reasoning
      });
      
      // Calculate weekly pattern (last 6 weeks)
      const weeklyPattern: number[] = [];
      const now = new Date();
      for (let weekOffset = 5; weekOffset >= 0; weekOffset--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (weekOffset * 7 + now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const postsThisWeek = posts.filter((p: Post) => {
          const postDate = new Date(p.timestamp);
          return postDate >= weekStart && postDate < weekEnd;
        }).length;
        weeklyPattern.push(postsThisWeek);
      }
      
      // Calculate consistency
      const daysBetweenPosts: number[] = [];
      for (let i = 0; i < postDates.length - 1; i++) {
        const days = Math.abs(Math.round((postDates[i].getTime() - postDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)));
        daysBetweenPosts.push(days);
      }
      const avgDaysBetween = daysBetweenPosts.length > 0
        ? daysBetweenPosts.reduce((a, b) => a + b, 0) / daysBetweenPosts.length
        : 0;
      const variance = daysBetweenPosts.length > 1
        ? daysBetweenPosts.reduce((sum, val) => sum + Math.pow(val - avgDaysBetween, 2), 0) / daysBetweenPosts.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const consistency = avgDaysBetween > 0 
        ? Math.round(Math.max(0, Math.min(100, (1 - (stdDev / avgDaysBetween)) * 100)))
        : 0;
      
      const idealDaysBetween = Math.round(7 / optimalFrequency);
      const frequencyStatus = currentFrequency < optimalFrequency * 0.75 
        ? 'underposting' 
        : currentFrequency > optimalFrequency * 1.25 
          ? 'overposting' 
          : 'optimal';
      
      // Generate insights
      const frequencyInsights: string[] = [];
      if (posts.length < 3) {
        frequencyInsights.push(`You have ${posts.length} posts over ${totalDays} days - need 3+ to analyze`);
        frequencyInsights.push('Post 2 more times to unlock frequency insights');
      } else if (posts.length < 10) {
        frequencyInsights.push(`Current: ${currentFrequency}/week over ${totalDays} days`);
        frequencyInsights.push(`Target: ${optimalFrequency}/week (industry standard until I have 10+ posts from you)`);
        frequencyInsights.push(`Post ${10 - posts.length} more times to unlock YOUR optimal frequency based on YOUR performance`);
      } else {
        frequencyInsights.push(`Current posting rate: ${currentFrequency}/week over ${Math.round(totalWeeks)} weeks`);
        frequencyInsights.push(`🎯 YOUR optimal rate: ${optimalFrequency}/week (${optimalCalc.confidence} confidence)`);
        frequencyInsights.push(`📊 Why? ${optimalCalc.reasoning}`);
        
        if (frequencyStatus === 'underposting') {
          frequencyInsights.push(`You're ${(((optimalFrequency - currentFrequency) / optimalFrequency) * 100).toFixed(0)}% below YOUR optimal - add ${(optimalFrequency - currentFrequency).toFixed(1)} posts/week`);
        } else if (frequencyStatus === 'overposting') {
          frequencyInsights.push(`You're posting ${(((currentFrequency - optimalFrequency) / optimalFrequency) * 100).toFixed(0)}% above YOUR optimal - quality > quantity`);
        } else {
          frequencyInsights.push('✅ You\'re posting at YOUR optimal frequency!');
        }
      }
      
      const consistencyInsights: string[] = [];
      if (posts.length < 3) {
        consistencyInsights.push('Post 3+ times to measure consistency');
      } else {
        consistencyInsights.push(`Consistency: ${consistency}% based on real posting intervals`);
        if (consistency >= 80) {
          consistencyInsights.push('✅ Excellent - predictable schedule!');
        } else if (consistency >= 60) {
          consistencyInsights.push('Good - minor variations');
          consistencyInsights.push(`Post every ${idealDaysBetween} days to reach 80%+`);
        } else {
          consistencyInsights.push('⚠️ Inconsistent - algorithm penalizes this');
          if (daysBetweenPosts.length > 0) {
            consistencyInsights.push(`Gaps vary from ${Math.min(...daysBetweenPosts)} to ${Math.max(...daysBetweenPosts)} days`);
          }
        }
      }
      
      return {
        title: 'Posting Frequency Analysis',
        tldr: posts.length >= 10
          ? `You're posting ${currentFrequency}/week. YOUR optimal is ${optimalFrequency}/week based on ${optimalCalc.performanceByFrequency.length} frequency patterns I analyzed. ${optimalCalc.reasoning}`
          : posts.length >= 3
            ? `${posts.length} posts in ${totalDays} days (${currentFrequency}/week). Post ${10 - posts.length} more to calculate YOUR optimal frequency.`
            : `${posts.length} posts. Need 3+ to analyze frequency.`,
        mainMetric: posts.length >= 3 ? `${currentFrequency}/week` : `${posts.length} posts`,
        comparison: posts.length >= 10 ? `YOUR optimal: ${optimalFrequency}/week` : posts.length >= 3 ? `Target: ${optimalFrequency}/week` : `${totalDays} days`,
        keyStats: [
          { label: 'Current frequency', value: currentFrequency + '/week' },
          { label: 'YOUR optimal', value: optimalFrequency + '/week', detail: posts.length >= 10 ? optimalCalc.confidence + ' confidence' : 'Industry standard' },
          { label: 'Consistency', value: posts.length >= 3 ? consistency + '%' : 'Need 3+ posts' },
          { label: 'Data confidence', value: optimalCalc.confidence }
        ],
        frequencyData: {
          current: currentFrequency,
          optimal: optimalFrequency,
          optimalConfidence: optimalCalc.confidence,
          optimalReasoning: optimalCalc.reasoning,
          consistency: consistency,
          weeklyPattern: weeklyPattern,
          performanceByFrequency: optimalCalc.performanceByFrequency
        },
        sections: [
          {
            title: 'YOUR FREQUENCY ANALYSIS',
            items: frequencyInsights
          },
          {
            title: 'CONSISTENCY BREAKDOWN',
            items: consistencyInsights
          },
          ...(optimalCalc.performanceByFrequency.length > 0 ? [{
            title: 'PERFORMANCE BY FREQUENCY',
            items: optimalCalc.performanceByFrequency.map((perf, idx) => 
              `${idx === 0 ? '🏆' : idx + 1 + '.'} ${perf.frequency}: ${perf.avgEngagementPerPost} avg engagement/post (${perf.weekCount} weeks, ${perf.totalPosts} posts)`
            )
          }] : []),
          {
            title: 'WHY THIS MATTERS',
            items: posts.length >= 3 ? [
              'Instagram rewards consistent posting with better reach',
              posts.length >= 10 
                ? `YOUR data shows ${optimalFrequency} posts/week gets the best engagement per post`
                : `Industry standard is 3-4 posts/week - I'll calculate YOURS after 10 posts`,
              `Your ${avgDaysBetween.toFixed(1)}-day average${avgDaysBetween <= 2.5 ? ' is great ✅' : ' needs work ⚠️'}`,
              'Consistency > frequency - predictable schedules win'
            ] : [
              'Post 3-4 times per week to train the algorithm',
              'Consistency beats intensity',
              'After 10 posts, I\'ll calculate YOUR optimal frequency',
              'Batch create content to stay consistent'
            ]
          }
        ],
        actions: posts.length >= 3 ? [
          {
            priority: 1,
            timeframe: 'This Week',
            action: frequencyStatus === 'underposting'
              ? `Increase to ${optimalFrequency} posts/week`
              : frequencyStatus === 'overposting'
                ? `Reduce to ${optimalFrequency} posts for quality`
                : `Maintain ${Math.round(currentFrequency)} posts/week`,
            details: posts.length >= 10
              ? `${optimalCalc.reasoning}`
              : `Target ${optimalFrequency}/week based on industry standards`,
            impact: 'High',
            expected: frequencyStatus === 'underposting'
              ? `+${Math.round((optimalFrequency - currentFrequency) * 50)} followers/month`
              : 'Better engagement per post'
          },
          ...(consistency < 70 ? [{
            priority: 2,
            timeframe: 'Ongoing',
            action: 'Fix posting schedule',
            details: `${consistency}% consistency hurts reach. Post every ${idealDaysBetween} days.`,
            impact: 'High',
            expected: `+${Math.round((80 - consistency) * 2)}% better reach at 80% consistency`
          }] : [])
        ] : [{
          priority: 1,
          timeframe: 'This Week',
          action: `Post ${3 - posts.length} more times`,
          details: 'Need 3+ posts to calculate frequency insights',
          impact: 'High',
          expected: 'Unlock frequency analysis'
        }]
      };
    }

    // STRATEGY - Comprehensive Data-Driven Analysis
    if (category === 'strategy') {
      // Gather all available data for comprehensive strategy
      const categoryStats = activeData.categoryStats || [];
      const formatStats = activeData.formatStats || [];
      const crossAnalysisStats = activeData.crossAnalysisStats || [];
      const topFollowersData = activeData.topFollowers || [];
      const growthData = activeData.growthData;
      const hasWeeklyGrowth = activeData.growthRate && activeData.growthRate !== 'null';
      
      // Calculate key metrics
      const totalSavesSum = posts.reduce((sum: number, p: Post) => sum + (p.saved || 0), 0);
      const avgSaves = posts.length > 0 ? totalSavesSum / posts.length : 0;
      const saveRate = totalLikes > 0 ? ((totalSavesSum / totalLikes) * 100).toFixed(1) : '0';
      const commentRate = totalLikes > 0 ? ((totalComments / totalLikes) * 100).toFixed(1) : '0';
      
      // Analyze content mix
      const reelPercentage = posts.length > 0 ? (reels.length / posts.length) * 100 : 0;
      const carouselPercentage = posts.length > 0 ? (carousels.length / posts.length) * 100 : 0;
      const photoPercentage = posts.length > 0 ? (photos.length / posts.length) * 100 : 0;
      
      // Find untapped opportunities
      const taggedPostCount = activeData.taggingProgress?.taggedPosts || 0;
      const superFans = topFollowersData.filter((f: TopFollower) => f.engagementType === 'high');
      
      // Identify top performers
      const topCategory = categoryStats.length > 0 ? categoryStats[0] : null;
      const topFormat = formatStats.length > 0 ? formatStats[0] : null;
      const topCombo = crossAnalysisStats.length > 0 ? crossAnalysisStats[0] : null;
      
      // Find underutilized opportunities (good performance, low volume)
      const underutilized = crossAnalysisStats
        .filter((combo: any) => combo.count <= 2 && combo.avg_reach > avgReach)
        .sort((a: any, b: any) => b.avg_reach - a.avg_reach)
        .slice(0, 2);
      
      // Analyze posting consistency
      const hasConsistentSchedule = posts.length >= 12;
      const avgPostsPerWeek = posts.length >= 6 ? (posts.length / 6) : posts.length;
      
      // Calculate potential growth opportunities
      const reachPotential = avgReach > 0 ? Math.round(avgReach * 1.5) : 0;
      const engagementPotential = parseFloat(engagementRate) < 5 ? '6-8%' : parseFloat(engagementRate) < 8 ? '10-12%' : '12-15%';
      
      if (posts.length === 0) {
        // Getting started strategy
        return {
          title: 'Your Instagram Growth Blueprint',
          tldr: `You're at the perfect starting point. Follow this strategic plan to build a strong foundation, attract your ideal audience, and set up for rapid growth in your first 30 days.`,
          mainMetric: 'Foundation Phase',
          comparison: 'Days 1-30',
          keyStats: [
            { label: 'Current posts', value: 0 },
            { label: 'Week 1 target', value: '3 posts' },
            { label: 'Week 4 target', value: '12 posts' },
            { label: 'Expected followers', value: '+50-100' }
          ],
          sections: [
            {
              title: '🚀 30-DAY STRATEGIC LAUNCH PLAN',
              items: [
                'Week 1-2: Post 3 Reels/week establishing your niche and voice',
                'Week 3: Add 1 educational Carousel/week to build authority',
                'Week 4: Maintain 3 Reels + 1 Carousel = 4 posts/week (optimal frequency)',
                'Goal: 12 total posts by day 30 to unlock full AI insights'
              ]
            },
            {
              title: '🎯 CONTENT STRATEGY FRAMEWORK',
              items: [
                '60% Educational Reels: Share tips, tutorials, quick wins (drives saves + shares)',
                '25% Storytelling Reels: Behind-the-scenes, personal stories (builds connection)',
                '10% Carousels: Deep-dive educational content (highest save rate)',
                '5% Engagement Posts: Questions, polls, community content (drives comments)'
              ]
            },
            {
              title: '💡 STRATEGIC DIFFERENTIATORS (Stand Out)',
              items: [
                'Hook Formula: First 3 seconds must stop the scroll (use pattern interrupts)',
                'Value Stack: Every post should teach something or solve a problem',
                'Authenticity Factor: Show your process, not just results',
                'Consistency Signal: Post same days/times to train the algorithm'
              ]
            },
            {
              title: '⚡ QUICK WINS TO IMPLEMENT IMMEDIATELY',
              items: [
                'Reply to every comment within 1 hour (massive algorithm boost)',
                'Use 5-7 highly specific hashtags (avoid generic ones)',
                'Post between 6-9 PM on weekdays (peak engagement window)',
                'Save your Reels as posts to appear in both Feed and Reels tab',
                'Add value in every caption - minimum 50 words, maximum 150'
              ]
            }
          ],
          actions: [
            {
              priority: 1,
              timeframe: 'Today',
              action: 'Create your first 3 Reels (batch creation)',
              details: 'Choose your niche, film 3 quick tips, schedule for Mon/Wed/Fri at 7 PM',
              impact: 'Critical',
              expected: 'Foundation built, algorithm recognizes you, 20-30 followers'
            },
            {
              priority: 2,
              timeframe: 'This Week',
              action: 'Set up content calendar template',
              details: 'Plan Mon/Wed/Fri posting schedule, create content ideas bank',
              impact: 'High',
              expected: 'Consistency established, reduced decision fatigue'
            },
            {
              priority: 3,
              timeframe: 'Week 2',
              action: 'Engage actively for 30 min/day',
              details: 'Comment on 20 posts in your niche daily, reply to all comments',
              impact: 'High',
              expected: 'Community building starts, 10-15 engaged followers'
            }
          ]
        };
      }
      
      // Data-driven strategy for established accounts
      const strategicInsights: string[] = [];
      const quickWins: string[] = [];
      const creativeTactics: string[] = [];
      const priorityActions: Action[] = [];
      
      // INSIGHT 1: Content Performance Analysis
      if (topCombo) {
        const comboFormat = topCombo.post_type === 'VIDEO' ? 'Reels' : topCombo.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos';
        const comboEngagement = topCombo.avg_likes + topCombo.avg_comments;
        const vsAverage = avgLikes + avgComments > 0 ? Math.round(((comboEngagement / (avgLikes + avgComments)) - 1) * 100) : 0;
        
        strategicInsights.push(
          `Your winning formula: ${topCombo.content_category} ${comboFormat} get ${comboEngagement.toLocaleString()} avg engagement (${vsAverage > 0 ? '+' : ''}${vsAverage}% vs your average)`
        );
        
        if (topCombo.count <= 5) {
          strategicInsights.push(
            `🚨 OPPORTUNITY: You've only created ${topCombo.count} ${topCombo.content_category} ${comboFormat}. Triple down on this winning format!`
          );
        }
        
        priorityActions.push({
          priority: 1,
          timeframe: 'This Week',
          action: `Create 3 more ${topCombo.content_category} ${comboFormat}`,
          details: `Your data shows this combo gets ${topCombo.avg_reach.toLocaleString()} avg reach and ${comboEngagement} engagement - ${vsAverage}% above average`,
          impact: 'Critical',
          expected: `Target ${Math.round(comboEngagement * 1.2).toLocaleString()}+ engagement per post, ${Math.round(topCombo.avg_reach * 1.3).toLocaleString()} reach`
        });
      }
      
      // INSIGHT 2: Underutilized High-Potential Content
      if (underutilized.length > 0) {
        const untapped = underutilized[0];
        const untappedFormat = untapped.post_type === 'VIDEO' ? 'Reels' : untapped.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos';
        
        strategicInsights.push(
          `💎 Hidden gem: ${untapped.content_category} ${untappedFormat} (only ${untapped.count} posts) reached ${untapped.avg_reach.toLocaleString()} accounts - untapped potential!`
        );
        
        creativeTactics.push(
          `Test batch: Create 5 more ${untapped.content_category} ${untappedFormat} to validate if this is your next breakout format`
        );
      }
      
      // INSIGHT 3: Format Mix Optimization
      if (reelPercentage < 60) {
        const reelsNeeded = Math.ceil(posts.length * 0.7) - reels.length;
        quickWins.push(
          `Increase Reels to 70% of content (need ${reelsNeeded} more Reels) - Reels get 2.5× more reach than photos`
        );
      } else if (reelPercentage > 80) {
        quickWins.push(
          `Add 1 Carousel/week (currently ${carouselPercentage.toFixed(0)}%) - Carousels have 3× higher save rate`
        );
      }
      
      // INSIGHT 4: Timing Optimization
      if (bestWindow && uniqueWindows.length >= 3) {
        const secondBest = uniqueWindows[1];
        const timeDiff = Math.round((parseFloat(bestWindow.engagement) / parseFloat(secondBest.engagement) - 1) * 100);
        
        strategicInsights.push(
          `Peak performance window: ${bestWindow.day} at ${bestWindow.time} (${timeDiff}% better than your second-best time)`
        );
        
        quickWins.push(
          `Schedule your best content for ${bestWindow.day}s at ${bestWindow.time} - this is when YOUR specific audience is most active`
        );
      }
      
      // INSIGHT 5: Engagement Quality Analysis
      const highSaveRate = parseFloat(saveRate) > 4;
      const highCommentRate = parseFloat(commentRate) > 8;
      
      if (highSaveRate && highCommentRate) {
        strategicInsights.push(
          `🔥 Elite engagement: ${saveRate}% save rate + ${commentRate}% comment rate = algorithm gold. Instagram is pushing your content!`
        );
      } else if (parseFloat(saveRate) < 2) {
        creativeTactics.push(
          `Save rate opportunity: Create "save for later" content - checklists, templates, guides, step-by-steps (target 4%+ save rate)`
        );
        
        priorityActions.push({
          priority: 2,
          timeframe: 'This Week',
          action: 'Create 2 "save-worthy" Carousels',
          details: `Your current ${saveRate}% save rate is below the 4% sweet spot. Educational carousels with actionable tips drive saves`,
          impact: 'High',
          expected: 'Increase save rate to 4%+, triggering algorithm boost and better reach'
        });
      }
      
      if (parseFloat(commentRate) < 5) {
        quickWins.push(
          `Add "Comment X if..." CTAs (current: ${commentRate}%, target: 8%+) - comments = engagement signal to algorithm`
        );
      }
      
      // INSIGHT 6: Super Fan Strategy
      if (superFans.length > 0) {
        strategicInsights.push(
          `You have ${superFans.length} super fans averaging ${Math.round(superFans.reduce((s: number, f: TopFollower) => s + f.interactions, 0) / superFans.length)} interactions each`
        );
        
        creativeTactics.push(
          `Superfan activation: Feature @${superFans[0].username} in a story, create content answering their questions, turn fans into advocates`
        );
      } else {
        creativeTactics.push(
          `Build your superfan base: Reply to comments within 60min, ask followers questions, create community-focused content`
        );
      }
      
      // INSIGHT 7: Growth Velocity Analysis
      if (hasWeeklyGrowth && activeData.growthRate) {
        const growthMatch = activeData.growthRate.match(/([+-]?\d+\.?\d*)/);
        const growthNum = growthMatch ? parseFloat(growthMatch[1]) : 0;
        
        if (growthNum > 0) {
          strategicInsights.push(
            `Growth momentum: ${activeData.growthRate} weekly - ${growthNum > 5 ? 'exceptional' : growthNum > 2 ? 'strong' : 'building'}. Keep consistency!`
          );
        }
      }
      
      // INSIGHT 8: Frequency Strategy
      if (avgPostsPerWeek < 3) {
        quickWins.push(
          `Increase to 4 posts/week (current: ${avgPostsPerWeek.toFixed(1)}) - consistency beats intensity. The algorithm rewards regularity`
        );
        
        priorityActions.push({
          priority: 3,
          timeframe: 'Starting This Week',
          action: 'Establish 4 posts/week schedule',
          details: 'Choose Mon/Wed/Fri/Sat at your peak time. Batch-create content on Sundays',
          impact: 'High',
          expected: `${Math.round((4 - avgPostsPerWeek) * 50)}+ new followers/month, algorithm boost from consistency`
        });
      } else if (avgPostsPerWeek > 7) {
        quickWins.push(
          `Quality over quantity: Reduce to 4-5 posts/week (current: ${avgPostsPerWeek.toFixed(1)}). Give audience time to engage with each post`
        );
      }
      
      // INSIGHT 9: Creative Breakthrough Strategies
      if (posts.length > 20) {
        creativeTactics.push(
          `Pattern interrupt: Your audience has seen your style. Try a drastically different format for 3 posts - if it works, you've found your next edge`
        );
      }
      
      if (categoryStats.length >= 3) {
        const topThree = categoryStats.slice(0, 3);
        creativeTactics.push(
          `Content mashup: Combine your top 3 categories (${topThree.map((c: any) => c.content_category).join(' + ')}) into one piece - maximum value density`
        );
      }
      
      if (avgReach > 0 && avgReach < followers * 0.3) {
        creativeTactics.push(
          `Reach expansion: Only ${((avgReach / followers) * 100).toFixed(0)}% of followers see your posts. Use more trending audio, hooks in first 3 seconds, and save-worthy content`
        );
      }
      
      // INSIGHT 10: Tagging Opportunity
      if (taggedPostCount < posts.length) {
        const untaggedCount = posts.length - taggedPostCount;
        creativeTactics.push(
          `Tag your ${untaggedCount} untagged posts below to unlock advanced category analytics and find hidden content patterns`
        );
      }
      
      // Build comprehensive strategy response
      return {
        title: 'Your Personalized Growth Strategy',
        tldr: topCombo
          ? `Your data reveals ${topCombo.content_category} ${topCombo.post_type === 'VIDEO' ? 'Reels' : topCombo.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'} as your breakout format (${topCombo.avg_reach.toLocaleString()} reach). ${strategicInsights.length} strategic insights identified from ${posts.length} posts.`
          : `${posts.length} posts analyzed. ${strategicInsights.length} strategic opportunities identified to accelerate your growth.`,
        mainMetric: hasWeeklyGrowth ? activeData.growthRate : 'Building momentum',
        comparison: `${posts.length} posts analyzed`,
        keyStats: [
          { 
            label: 'Top format', 
            value: topCombo ? `${topCombo.content_category} ${topCombo.post_type === 'VIDEO' ? 'Reels' : topCombo.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos'}` : 'Analyzing...',
            detail: topCombo ? `${topCombo.avg_reach.toLocaleString()} reach` : undefined
          },
          { 
            label: 'Growth rate', 
            value: hasWeeklyGrowth ? activeData.growthRate : 'Building data',
            detail: growthData ? `${growthData.daysOfData} days tracked` : undefined
          },
          { 
            label: 'Engagement quality', 
            value: `${saveRate}% saves | ${commentRate}% comments`,
            detail: parseFloat(saveRate) > 4 && parseFloat(commentRate) > 8 ? 'Elite' : parseFloat(saveRate) > 2 || parseFloat(commentRate) > 5 ? 'Strong' : 'Growing'
          },
          { 
            label: 'Strategy score', 
            value: `${Math.min(strategicInsights.length + quickWins.length + creativeTactics.length, 10)}/10`,
            detail: 'Actionable insights'
          }
        ],
        sections: [
          {
            title: '🎯 STRATEGIC INSIGHTS FROM YOUR DATA',
            items: strategicInsights.length > 0 ? strategicInsights : [
              `Analyzing ${posts.length} posts to identify your unique growth patterns...`,
              'Post consistently for 2 more weeks to unlock advanced strategic insights',
              'Current data shows engagement patterns forming'
            ]
          },
          ...(quickWins.length > 0 ? [{
            title: '⚡ QUICK WINS (Implement This Week)',
            items: quickWins
          }] : []),
          ...(creativeTactics.length > 0 ? [{
            title: '💡 CREATIVE BREAKTHROUGH STRATEGIES',
            items: creativeTactics
          }] : []),
          {
            title: '📊 YOUR COMPETITIVE ADVANTAGES',
            items: [
              topCategory ? `${topCategory.content_category} content: ${topCategory.avg_likes + topCategory.avg_comments} avg engagement - lean into this strength` : 'Building content category data...',
              parseFloat(engagementRate) > 5 ? `${engagementRate} engagement rate: Above average - you're creating content people care about` : `Focus on engagement quality to reach 5%+ engagement rate`,
              superFans.length > 0 ? `${superFans.length} highly engaged superfans - your core community is forming` : 'Build your superfan base by consistent engagement',
              hasConsistentSchedule ? 'Consistent posting schedule - algorithm recognizes your reliability' : 'Establish posting consistency to gain algorithm trust'
            ].filter(Boolean)
          },
          {
            title: '🚀 30-DAY GROWTH ROADMAP',
            items: [
              `Week 1: Execute top priority action below + reply to all comments within 1 hour`,
              `Week 2: ${underutilized.length > 0 ? `Test underutilized ${underutilized[0].content_category} content` : 'Analyze performance and double down on winners'}`,
              `Week 3: ${parseFloat(saveRate) < 3 ? 'Create save-worthy carousel series' : 'Maintain winning format consistency'}`,
              `Week 4: Review analytics, identify new patterns, iterate strategy`,
              `Target: ${reachPotential > 0 ? reachPotential.toLocaleString() : '500+'} avg reach per post, ${engagementPotential} engagement rate`
            ]
          }
        ],
        actions: priorityActions.length > 0 ? priorityActions : [
          {
            priority: 1,
            timeframe: 'This Week',
            action: topFormat ? `Create 3 ${topFormat.post_type === 'Reels' ? 'Reels' : topFormat.post_type === 'Carousels' ? 'Carousels' : 'Photos'}` : 'Create 3 Reels',
            details: topFormat ? `Your ${topFormat.post_type} get ${topFormat.avg_reach.toLocaleString()} avg reach - your best format` : 'Reels drive the most discovery',
            impact: 'High',
            expected: topFormat ? `${Math.round(topFormat.avg_reach * 1.2).toLocaleString()}+ reach per post` : '+100 followers'
          },
          {
            priority: 2,
            timeframe: 'This Week',
            action: bestWindow ? `Schedule posts for ${bestWindow.day} at ${bestHourLabel}` : 'Test different posting times',
            details: bestWindow ? 'Your data shows this is your optimal posting window' : 'Find when YOUR audience is most active',
            impact: 'Medium',
            expected: bestWindow ? `${Math.round((parseFloat(bestWindow.engagement) / parseFloat(engagementRate)) * 100 - 100)}% engagement boost` : 'Identify peak times'
          },
          {
            priority: 3,
            timeframe: 'Next 2 Weeks',
            action: parseFloat(saveRate) < 3 ? 'Create educational carousel series' : 'Engage with superfans',
            details: parseFloat(saveRate) < 3 ? 'Boost save rate from ' + saveRate + '% to 4%+ with actionable content' : `Reply and feature your ${superFans.length} most engaged followers`,
            impact: 'Medium',
            expected: parseFloat(saveRate) < 3 ? 'Algorithm boost from increased saves' : 'Turn fans into advocates'
          }
        ]
      };
    }

    // DEFAULT OVERVIEW
    return {
      title: 'Your Instagram Overview',
      tldr: posts.length > 0
        ? `${followers.toLocaleString()} followers, ${engagementRate}% engagement. ${posts.length} posts analyzed. ${activeData.growthRate && activeData.growthRate !== 'null' ? `Growing at ${activeData.growthRate}.` : 'Building growth history.'}`
        : `${followers.toLocaleString()} followers. Start posting to unlock detailed insights and AI recommendations.`,
      mainMetric: followers.toLocaleString() + ' followers',
      comparison: posts.length > 0 ? `${engagementRate}% engagement rate` : 'Post to see metrics',
      keyStats: [
        { label: 'Followers', value: followers.toLocaleString() },
        { label: 'Engagement', value: posts.length > 0 ? engagementRate + '%' : 'N/A' },
        { label: 'Avg reach', value: avgReach > 0 ? avgReach.toLocaleString() : 'N/A' },
        { label: 'Posts', value: posts.length }
      ],
      sections: [
        {
          title: 'ACCOUNT SNAPSHOT',
          items: posts.length > 0 ? [
            `${followers.toLocaleString()} followers`,
            `${engagementRate}% engagement rate`,
            avgReach > 0 ? `${avgReach.toLocaleString()} avg reach per post` : 'Reach data building',
            `${posts.length} posts analyzed`
          ] : [
            `${followers.toLocaleString()} followers`,
            'No posts analyzed yet',
            'Start posting to unlock insights',
            'AI Coach will analyze your content performance'
          ]
        }
      ],
      actions: [
        {
          priority: 1,
          timeframe: 'Now',
          action: posts.length > 0 ? 'Ask me a specific question' : 'Post your first content',
          details: posts.length > 0 
            ? 'Try "How am I growing?" or "When should I post?"'
            : 'Create 3 Reels to start building your insights',
          impact: 'High',
          expected: posts.length > 0 
            ? 'Detailed, actionable insights'
            : 'Unlock AI-powered recommendations'
        }
      ]
    };
  }

  function formatLastSeen(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return diffInDays + ' days ago';
    if (diffInDays < 30) return Math.floor(diffInDays / 7) + ' weeks ago';
    return date.toLocaleDateString();
  }

  function handleAsk(question: string) {
  setCurrentQuestion(question);
  setHasAskedQuestion(true);
  setIsAnalyzing(true);
  setInputValue('');

  setTimeout(() => {
    try {
      const category = matchQuestion(question);
      const generatedResponse = generateResponse(category);
      setResponse(generatedResponse);
    } catch (error) {
      console.error('❌ Error generating response:', error);
      setResponse({
        title: 'Error',
        tldr: 'Something went wrong. Please try asking another question.',
        mainMetric: 'Error',
        comparison: 'Please try again',
        keyStats: [
          { label: 'Status', value: 'Error' }
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, 1200);
}

  async function handleTagPost(postId: string, category: string) {
  try {
    console.log('🏷️ Tagging post:', postId, 'with category:', category);
    
    const response = await fetch('/api/instagram/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'tag',
        postIds: [postId],
        category: category,
        isCustomCategory: !availableCategories.some(c => c.name === category)
      })
    });

    const result = await response.json();
    console.log('📊 Tag API response:', result);

    if (result.success) {
      console.log('✅ Post tagged successfully in Supabase');
      
      // Close modal immediately
      setShowTaggingModal(false);
      setSelectedPostForTagging(null);
      setSelectedCategory('');
      setNewCategoryName('');
      
      // Refresh all data after tagging (same as App_Main_Component)
      await fetchInstagramData();
      
      // If we're viewing content analysis, regenerate the response with fresh data
      if (currentQuestion && matchQuestion(currentQuestion) === 'content') {
        console.log('🔄 Regenerating content analysis...');
        const newResponse = generateResponse('content');
        setResponse(newResponse);
      }
      
      console.log('✅ Posts tagged and data refreshed');
    } else {
      console.error('❌ Failed to tag post:', result.error);
      alert('Failed to tag post. Please try again.');
    }
  } catch (error) {
    console.error('❌ Error tagging post:', error);
    alert('An error occurred while tagging. Please try again.');
  }
}

  function handleReset() {
    setHasAskedQuestion(false);
    setCurrentQuestion('');
    setInputValue('');
    setResponse(null);
    setIsAnalyzing(false);
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-white/80 text-lg">Loading your Instagram data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation Menu */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToProfile}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4" />
              Profile
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm border border-red-400/30 rounded-full text-white text-sm flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {!hasAskedQuestion ? (
          <div className="min-h-screen flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-serif text-white">
                Your growth starts <span className="italic">here</span>
              </h1>
              <p className="text-white/70 text-base">Clear insights. Actionable steps. Real results.</p>
            </div>

            <div className="w-full max-w-2xl flex items-center gap-3">
              <div className="flex-1 bg-white/10 backdrop-blur-md rounded-full px-6 py-4 border border-white/20">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); }}
                  onKeyPress={(e) => { 
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleAsk(inputValue);
                    }
                  }}
                  placeholder="Ask anything about your Instagram..."
                  className="w-full bg-transparent text-white placeholder-white/50 outline-none"
                />
              </div>
              <button
                onClick={() => { 
                  if (inputValue.trim()) {
                    handleAsk(inputValue);
                  }
                }}
                disabled={!inputValue.trim()}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-white/20"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>

            <p className="text-center text-white/50 text-sm">Ask anything. Get clarity.</p>

            <div className="w-full max-w-2xl">
              <div className="text-center mb-3">
                <p className="text-white/60 text-sm font-medium">Popular Questions</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {quickActions.map((action, idx) => {
                  return (
                    <button
                      key={idx}
                      onClick={() => { handleAsk(action.query); }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm flex items-center gap-2 transition-all"
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">New question</span>
            </button>

            {isAnalyzing ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                </div>
                <p className="text-white/80 text-lg">Analyzing your real Instagram data...</p>
              </div>
            ) : response && (
              <div className="space-y-4">
                {/* Main Response Card */}
                <div className="bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-xl rounded-3xl border border-white/30 p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/70 text-sm mb-1">You asked:</p>
                      <p className="text-white text-xl font-medium">{currentQuestion}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/20 pt-6 mb-6">
                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-3">{response.title}</h2>
                    <p className="text-white/90 text-base leading-relaxed">{response.tldr}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {response.keyStats.map((stat, idx) => {
                      return (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                          <p className="text-white/60 text-xs mb-2">{stat.label}</p>
                          <p className="text-white text-2xl font-bold">{stat.value}</p>
                          {stat.detail && <p className="text-white/50 text-xs mt-1">{stat.detail}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMPLETE VISUALIZATIONS START HERE */}

                {/* Audience-specific visualizations */}
                {response.topFollowers && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">👥 Your Top Followers</p>
                    <div className="space-y-3">
                      {response.topFollowers.map((follower, idx) => {
                        const badge = follower.engagementType === 'high' 
                          ? { text: 'Super Fan', color: 'bg-green-500/20 text-green-200' }
                          : follower.engagementType === 'medium'
                            ? { text: 'Active', color: 'bg-blue-500/20 text-blue-200' }
                            : { text: 'Regular', color: 'bg-gray-500/20 text-gray-200' };
                        
                        return (
                          <div key={idx} className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-violet-300/30 p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-bold">
                                  {follower.username.slice(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-white text-sm truncate">@{follower.username}</h3>
                                    <span className={'inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ' + badge.color}>
                                      {badge.text}
                                    </span>
                                  </div>
                                  <div className="text-right ml-3 flex-shrink-0">
                                    <div className="text-xl font-bold text-violet-200">{follower.interactions}</div>
                                    <div className="text-xs text-white/60">interactions</div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-violet-200/20">
                                    <div className="text-sm font-semibold text-violet-200">{follower.comments}</div>
                                    <div className="text-xs text-white/60">comments</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-violet-200/20">
                                    <div className="text-sm font-semibold text-violet-200">{follower.likes}</div>
                                    <div className="text-xs text-white/60">likes</div>
                                  </div>
                                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center border border-violet-200/20">
                                    <div className="text-sm font-semibold text-violet-200">{follower.postsEngaged}</div>
                                    <div className="text-xs text-white/60">posts</div>
                                  </div>
                                </div>
                                
                                <div className="text-xs text-white/50">
                                  Last seen {formatLastSeen(follower.lastSeen)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sentiment visualization */}
                {response.sentiment && (
                  <>
                    <div className="space-y-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest">💭 Sentiment Analysis</p>
                      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-green-500/20 rounded-xl p-3 text-center border border-green-400/30">
                            <div className="text-2xl font-bold text-green-200">{response.sentiment.overall.positive}%</div>
                            <div className="text-xs text-green-300/80">Positive</div>
                          </div>
                          <div className="bg-gray-500/20 rounded-xl p-3 text-center border border-gray-400/30">
                            <div className="text-2xl font-bold text-gray-200">{response.sentiment.overall.neutral}%</div>
                            <div className="text-xs text-gray-300/80">Neutral</div>
                          </div>
                          <div className="bg-red-500/20 rounded-xl p-3 text-center border border-red-400/30">
                            <div className="text-2xl font-bold text-red-200">{response.sentiment.overall.negative}%</div>
                            <div className="text-xs text-red-300/80">Negative</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10 mb-4">
                          <p className="text-white/80 text-sm">
                            <strong>Sentiment Score:</strong> <span className={'font-bold ' + (response.sentiment.score > 20 ? 'text-green-300' : response.sentiment.score > 0 ? 'text-blue-300' : 'text-red-300')}>
                              {response.sentiment.score > 0 ? '+' : ''}{response.sentiment.score}
                            </span>
                            {' '}({response.sentiment.score > 20 ? 'Excellent' : response.sentiment.score > 0 ? 'Good' : 'Needs Improvement'})
                          </p>
                          <p className="text-white/60 text-xs mt-1">
                            Trend: {response.sentiment.trend === 'improving' ? '📈 Improving' : response.sentiment.trend === 'declining' ? '📉 Declining' : '➡️ Stable'} • {response.sentiment.overall.totalComments} comments analyzed
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-white/80 text-xs font-semibold mb-2 uppercase tracking-wider">Monthly Sentiment Trend</h4>
                          {response.sentiment.byMonth.map((month, idx) => {
                            const isLatest = response.sentiment?.byMonth && idx === response.sentiment.byMonth.length - 1;
                            return (
                              <div key={idx} className={'rounded-lg p-3 border transition-all ' + (
                                isLatest ? 'bg-pink-500/10 border-pink-400/30' : 'bg-white/5 border-white/10'
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-white/70 font-medium">{month.month}</span>
                                    {isLatest && (
                                      <span className="px-2 py-0.5 bg-pink-400/20 text-pink-200 text-xs rounded-full">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-white/50">{month.totalComments} comments</span>
                                    <span className={'text-sm font-bold px-2 py-1 rounded-full ' + (
                                      month.score > 20 ? 'bg-green-500/20 text-green-200' :
                                      month.score > 0 ? 'bg-blue-500/20 text-blue-200' :
                                      'bg-red-500/20 text-red-200'
                                    )}>
                                      {month.score > 0 ? '+' : ''}{month.score}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest">💬 Top Positive Comments</p>
                      <div className="space-y-3">
                        {response.sentiment.positiveComments.map((comment, idx) => {
                          return (
                            <div key={idx} className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-400/20 p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <Heart className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white/90 text-sm leading-relaxed mb-2">"{comment.text}"</p>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-green-300 font-medium">@{comment.username}</span>
                                    <span className="text-white/40">•</span>
                                    <span className="text-white/50">on "{comment.post}"</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Follower Chart */}
                {response.followerChart && response.followerChart.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">Week Over Week Growth</p>
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                      <div className="h-64 flex items-end justify-between gap-3">
                        {response.followerChart.map((week, idx) => {
                          const maxFollowers = Math.max(...response.followerChart!.map(w => w.followers));
                          const minFollowers = Math.min(...response.followerChart!.map(w => w.followers));
                          
                          const range = maxFollowers - minFollowers;
                          const valueAboveMin = week.followers - minFollowers;
                          const heightPercent = range > 0 ? 40 + (valueAboveMin / range) * 60 : 50;
                          
                          const isLatest = idx === response.followerChart!.length - 1;
                          
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                              <div 
                                className={'w-full rounded-t-lg flex flex-col items-center justify-start pt-2 ' + (isLatest ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-gradient-to-t from-purple-500/60 to-pink-500/60')}
                                style={{ height: heightPercent + '%' }}
                              >
                                <span className="text-white text-xs font-bold">{(week.followers / 1000).toFixed(1)}k</span>
                              </div>
                              <div className="text-white/60 text-xs text-center whitespace-nowrap mt-2">
                                {week.date}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/50 text-xs text-center">
                          Total growth: +{(response.followerChart[response.followerChart.length - 1].followers - response.followerChart[0].followers).toLocaleString()} followers over {response.followerChart.length} weeks
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weekly Engagement Chart */}
                {response.weeklyEngagementChart && response.weeklyEngagementChart.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">Weekly Engagement Rate Trend</p>
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                      <div className="h-64 flex items-end justify-between gap-3">
                        {response.weeklyEngagementChart.map((week, idx) => {
                          const maxRate = Math.max(...response.weeklyEngagementChart!.map((w) => w.engagementRate));
                          const minRate = Math.min(...response.weeklyEngagementChart!.map((w) => w.engagementRate));
                          
                          const range = maxRate - minRate;
                          const valueAboveMin = week.engagementRate - minRate;
                          const heightPercent = range > 0 ? 40 + (valueAboveMin / range) * 60 : 50;
                          
                          const isLatest = idx === response.weeklyEngagementChart!.length - 1;
                          
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                              <div 
                                className={'w-full rounded-t-lg flex flex-col items-center justify-start pt-2 ' + (isLatest ? 'bg-gradient-to-t from-pink-500 to-purple-500' : 'bg-gradient-to-t from-pink-500/60 to-purple-500/60')}
                                style={{ height: heightPercent + '%' }}
                              >
                                <span className="text-white text-xs font-bold">{week.engagementRate}%</span>
                              </div>
                              <div className="text-white/60 text-xs text-center whitespace-nowrap mt-2">
                                {week.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/50 text-xs text-center">
                          Engagement trend over last {response.weeklyEngagementChart.length} weeks • Current: {response.weeklyEngagementChart[response.weeklyEngagementChart.length - 1].engagementRate}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Frequency Data Visualization */}
                {response.frequencyData && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">📊 Weekly Posting Pattern</p>
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 text-center border border-blue-400/30">
                          <div className="text-3xl font-bold text-blue-200">{response.frequencyData.current}</div>
                          <div className="text-sm text-blue-300 mt-1">Current</div>
                          <div className="text-xs text-white/60">posts/week</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4 text-center border border-green-400/30">
                          <div className="text-3xl font-bold text-green-200">{response.frequencyData.optimal}</div>
                          <div className="text-sm text-green-300 mt-1">Optimal</div>
                          <div className="text-xs text-white/60">posts/week</div>
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white/70 text-sm font-medium">Consistency Score</p>
                          <p className="text-white text-xl font-bold">{response.frequencyData.consistency}%</p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div 
                            className={'h-3 rounded-full transition-all duration-1000 ' + (
                              response.frequencyData.consistency >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                              response.frequencyData.consistency >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                              'bg-gradient-to-r from-red-400 to-pink-500'
                            )}
                            style={{ width: response.frequencyData.consistency + '%' }}
                          />
                        </div>
                        <p className="text-white/50 text-xs mt-2">
                          {response.frequencyData.consistency >= 80 ? '✅ Excellent - very predictable schedule' :
                           response.frequencyData.consistency >= 60 ? '⚠️ Good - minor variations' :
                           '📉 Room to improve - aim for more consistency'}
                        </p>
                      </div>

                      <div>
                        <p className="text-white/70 text-sm font-medium mb-3">Last 6 Weeks Posting Pattern</p>
                        <div className="flex items-end justify-between gap-2 h-32">
                          {response.frequencyData.weeklyPattern.map((count, idx) => {
                            const maxCount = Math.max(...response.frequencyData!.weeklyPattern);
                            const heightPercent = (count / maxCount) * 100;
                            const isOptimal = count === response.frequencyData!.optimal;
                            
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div 
                                  className={'w-full rounded-t-lg flex flex-col items-center justify-start pt-2 ' + (
                                    isOptimal 
                                      ? 'bg-gradient-to-t from-green-500 to-emerald-500' 
                                      : count > response.frequencyData!.optimal
                                        ? 'bg-gradient-to-t from-orange-500/60 to-red-500/60'
                                        : 'bg-gradient-to-t from-blue-500/60 to-cyan-500/60'
                                  )}
                                  style={{ height: Math.max(heightPercent, 15) + '%' }}
                                >
                                  <span className="text-white text-xs font-bold">{count}</span>
                                </div>
                                <div className="text-white/60 text-xs text-center">
                                  {6 - idx}w ago
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-white/50 text-xs mt-3 text-center">
                          Green = optimal frequency • Orange = posting too much • Blue = posting too little
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Heatmap for Timing */}
                {response.heatmapData && response.heatmapData.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">🔥 Engagement Heatmap (3-Hour Time Blocks)</p>
                    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                      <p className="text-white/50 text-xs mb-4">
                        Visual overview by day and time block (e.g., 6p = 6-9 PM). Top windows show exact hours for precision.
                      </p>
                    
                      <div className="flex items-center justify-center space-x-2 mb-4 text-xs">
                        <span className="text-white/60">Low</span>
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-gray-600 rounded"></div>
                          <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded"></div>
                          <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded"></div>
                          <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded"></div>
                          <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded"></div>
                        </div>
                        <span className="text-white/60">High</span>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-max">
                          <div className="grid grid-cols-8 gap-1 mb-1">
                            <div className="text-xs text-white/40 text-center py-1"></div>
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
                              return (
                                <div key={day} className="text-xs text-white/70 text-center py-1 font-medium">
                                  {day}
                                </div>
                              );
                            })}
                          </div>

                          {[
                            { label: '12a', start: 0, hours: [0, 1, 2] },
                            { label: '3a', start: 3, hours: [3, 4, 5] },
                            { label: '6a', start: 6, hours: [6, 7, 8] },
                            { label: '9a', start: 9, hours: [9, 10, 11] },
                            { label: '12p', start: 12, hours: [12, 13, 14] },
                            { label: '3p', start: 15, hours: [15, 16, 17] },
                            { label: '6p', start: 18, hours: [18, 19, 20] },
                            { label: '9p', start: 21, hours: [21, 22, 23] }
                          ].map((block) => {
                            return (
                              <div key={block.label} className="grid grid-cols-8 gap-1 mb-1">
                                <div className="text-xs text-white/40 text-right py-1 pr-2 font-medium">
                                  {block.label}
                                </div>
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                                  const postsInBlock = response.heatmapData!.filter((p) => {
                                    const postDate = new Date(p.timestamp);
                                    const postDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][postDate.getDay()];
                                    const postHour = postDate.getHours();
                                    return postDay === day && Math.floor(postHour / 3) * 3 === block.start;
                                  });
                                  
                                  const totalEng = postsInBlock.reduce((sum, p) => {
                                    return sum + p.like_count + p.comments_count + (p.saved || 0);
                                  }, 0);
                                  const totalReach = postsInBlock.reduce((sum, p) => {
                                    return sum + (p.reach || 0);
                                  }, 0);
                                  const engRate = totalReach > 0 ? (totalEng / totalReach * 100) : 0;
                                  const intensity = engRate;
                                  
                                  const colorClass = postsInBlock.length === 0 ? 'bg-gray-700 text-gray-500' :
                                    intensity >= 8 ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' :
                                    intensity >= 6 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                                    intensity >= 4 ? 'bg-gradient-to-br from-blue-400 to-purple-500 text-white' :
                                    intensity >= 2 ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white' :
                                    'bg-gray-600 text-gray-400';
                                  
                                  return (
                                    <div
                                      key={day}
                                      className={'w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ' + colorClass}
                                      title={postsInBlock.length > 0 
                                        ? day.slice(0, 3) + ' ' + block.label + ': ' + engRate.toFixed(1) + '% (' + postsInBlock.length + ' posts)'
                                        : day.slice(0, 3) + ' ' + block.label + ': No posts'
                                      }
                                    >
                                      {postsInBlock.length > 0 ? postsInBlock.length : ''}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <p className="text-white/50 text-xs mt-4 text-center">
                        Each cell shows post count. Hover for details. Time labels (e.g., 6p) represent 3-hour blocks starting at that hour.
                      </p>
                    </div>
                  </div>
                )}

                {/* 🔥 FIX #6: Quick Tag Section - Use API untaggedPosts */}
{response.title === 'Content Performance Analysis' && activeData?.untaggedPosts && (
  <div className="space-y-3">
    <p className="text-white/40 text-xs uppercase tracking-widest">
      {activeData.untaggedPosts.length > 0 
        ? '🏷️ Quick Tag Untagged Posts' 
        : 'All Posts Tagged! 🎉'}
    </p>
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
      {activeData.untaggedPosts.length > 0 ? (
        <div className="space-y-3">
          <p className="text-white/70 text-sm mb-4">
            Tag your posts to unlock detailed category insights and see which content types perform best.
          </p>
          {activeData.untaggedPosts.slice(0, 5).map((post: any) => {
            const engagement = post.likes_count + post.comments_count;
            return (
              <div key={post.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-white font-medium truncate">
                    {post.caption?.slice(0, 60) || 'No caption'}...
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {post.post_type === 'VIDEO' ? 'Reel' : post.post_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'} • {' '}
                    {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {' '}
                    {engagement} engagement
                  </p>
                </div>
                <button
                  onClick={() => {
                    const fullPost = activeData.recentPosts?.find((p: Post) => p.id === post.instagram_post_id);
                    if (fullPost) {
                      setSelectedPostForTagging(fullPost);
                      setShowTaggingModal(true);
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
                >
                  Tag
                </button>
              </div>
            );
          })}
          {activeData.untaggedPosts.length > 5 && (
            <p className="text-white/50 text-xs text-center mt-3">
              +{activeData.untaggedPosts.length - 5} more posts to tag
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🎉</div>
          <p className="text-white text-lg font-semibold mb-2">All posts tagged!</p>
          <p className="text-white/60 text-sm">
            Great job categorizing your content. Now you can see detailed insights by category in your content analysis.
          </p>
        </div>
      )}
    </div>
  </div>
)}

                {/* 🔥 FIX #5: Category × Format Performance Grid */}
{response.title === 'Content Performance Analysis' && activeData?.crossAnalysisStats && activeData.crossAnalysisStats.length > 0 && (
  <div className="space-y-3">
    <p className="text-white/40 text-xs uppercase tracking-widest">📊 Category × Format Performance Grid</p>
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
      <p className="text-white/70 text-sm mb-4">
        See how different content types × formats perform. Find your winning combinations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeData.crossAnalysisStats.map((stat: any, idx: number) => {
          const isTopPerformer = idx === 0;
          const formatName = stat.post_type === 'VIDEO' ? 'Reels' : 
                           stat.post_type === 'CAROUSEL_ALBUM' ? 'Carousels' : 'Photos';
          
          return (
            <div 
              key={`${stat.content_category}-${stat.post_type}`} 
              className={`rounded-2xl p-4 border transition-all ${
                isTopPerformer 
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/40' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-semibold text-sm">
                      {stat.content_category} {formatName}
                    </h4>
                    {isTopPerformer && (
                      <span className="px-2 py-0.5 bg-emerald-400/20 text-emerald-200 text-xs rounded-full">
                        🏆 Top
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs">{stat.count} {stat.count === 1 ? 'post' : 'posts'}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{stat.avg_likes + stat.avg_comments}</div>
                  <div className="text-xs text-white/50">avg engagement</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-white">{stat.avg_likes}</div>
                  <div className="text-xs text-white/60">Likes</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-white">{stat.avg_comments}</div>
                  <div className="text-xs text-white/60">Comments</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 text-center">
                  <div className="text-sm font-semibold text-white">
                    {stat.avg_reach > 1000 ? (stat.avg_reach / 1000).toFixed(1) + 'k' : stat.avg_reach}
                  </div>
                  <div className="text-xs text-white/60">Reach</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

                {/* Top Posts / Recent Posts Toggle View */}
                {(response.topPosts || response.recentPosts) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white/40 text-xs uppercase tracking-widest">Your Posts</p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex">
                      <button
                        onClick={() => { setPostsView('recent'); }}
                        className={'flex-1 py-2 px-4 text-sm font-semibold rounded-full transition-all ' + (
                          postsView === 'recent'
                            ? 'bg-white text-purple-900 shadow-sm'
                            : 'text-white hover:text-white/80'
                        )}
                      >
                        Recent Posts
                      </button>
                      <button
                        onClick={() => { setPostsView('top'); }}
                        className={'flex-1 py-2 px-4 text-sm font-semibold rounded-full transition-all ' + (
                          postsView === 'top'
                            ? 'bg-white text-purple-900 shadow-sm'
                            : 'text-white hover:text-white/80'
                        )}
                      >
                        Top Posts
                      </button>
                    </div>

                    {postsView === 'recent' && response.recentPosts && (
                      <div className="grid grid-cols-1 gap-3">
                        {response.recentPosts.map((post, idx) => {
                          const engagement = post.like_count + post.comments_count + (post.saved || 0);
                          const isAboveAverage = response.avgEngagement ? engagement > response.avgEngagement : false;
                          
                          return (
                            <div key={post.id} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">#{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-semibold text-sm">
                                      {post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'}
                                    </span>
                                    {post.content_category && (
                                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                                        {post.content_category}
                                      </span>
                                    )}
                                    <span className={'text-xs px-2 py-0.5 rounded-full ml-auto ' + (isAboveAverage ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200')}>
                                      {isAboveAverage ? '📈 Above Avg' : '➡️ Below Avg'}
                                    </span>
                                  </div>
                                  <p className="text-white/70 text-xs line-clamp-1">{post.caption || 'No caption'}</p>
                                  <p className="text-white/50 text-xs mt-1">
                                    {new Date(post.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2">
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.like_count}</div>
                                  <div className="text-white/50 text-xs">Likes</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.comments_count}</div>
                                  <div className="text-white/50 text-xs">Comments</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.saved || 0}</div>
                                  <div className="text-white/50 text-xs">Saves</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{engagement}</div>
                                  <div className="text-white/50 text-xs">Total</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {postsView === 'top' && response.topPosts && (
                      <div className="grid grid-cols-1 gap-3">
                        {response.topPosts.map((post, idx) => {
                          const cardColors = [
                            'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
                            'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
                            'from-purple-500/20 to-pink-500/20 border-purple-500/30',
                            'from-orange-500/20 to-red-500/20 border-orange-500/30',
                            'from-cyan-500/20 to-sky-500/20 border-cyan-500/30'
                          ];
                          
                          return (
                            <div key={post.id} className={'bg-gradient-to-br backdrop-blur-xl rounded-2xl border p-4 ' + cardColors[idx]}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">#{idx + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-semibold text-sm">
                                      {post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'}
                                    </span>
                                    {post.content_category && (
                                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                                        {post.content_category}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/70 text-xs line-clamp-1">{post.caption || 'No caption'}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-4 gap-2">
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.like_count}</div>
                                  <div className="text-white/50 text-xs">Likes</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.comments_count}</div>
                                  <div className="text-white/50 text-xs">Comments</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.saved || 0}</div>
                                  <div className="text-white/50 text-xs">Saves</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white text-sm font-bold">{post.totalEngagement}</div>
                                  <div className="text-white/50 text-xs">Total</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sections */}
                {response.sections && response.sections.map((section, idx) => {
                  return (
                    <div key={idx} className="space-y-3">
                      <p className="text-white/40 text-xs uppercase tracking-widest">{section.title}</p>
                      <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                        <div className="space-y-2">
                          {section.items.map((item, itemIdx) => {
                            return (
                              <div key={itemIdx} className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                                <p className="text-white/80 text-sm leading-relaxed">{item}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Actions */}
                {response.actions && (
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest">What to do next</p>
                    {response.actions.map((action, idx) => {
                      return (
                        <div key={idx} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 p-6 hover:border-white/30 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                #{action.priority}
                              </span>
                              <span className="text-white/60 text-sm">• {action.timeframe}</span>
                            </div>
                            <span className={
                              'text-xs px-3 py-1 rounded-full font-medium ' + 
                              (action.impact === 'High' ? 'bg-green-500/20 text-green-200' :
                              action.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-200' :
                              'bg-blue-500/20 text-blue-200')
                            }>
                              {action.impact} Impact
                            </span>
                          </div>
                          <h4 className="text-white text-base font-semibold mb-2">{action.action}</h4>
                          <p className="text-white/70 text-sm mb-2">{action.details}</p>
                          <p className="text-white/50 text-xs">Expected: {action.expected}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tagging Modal */}
      {showTaggingModal && selectedPostForTagging && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tag Content</h3>
              <button 
                onClick={() => {
                  setShowTaggingModal(false);
                  setSelectedPostForTagging(null);
                  setSelectedCategory('');
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-purple-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-purple-900">
                  {selectedPostForTagging.caption?.slice(0, 60) || 'Post'}...
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {selectedPostForTagging.media_type} • {selectedPostForTagging.like_count} likes
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Select Category</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCategories.map((category) => {
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setNewCategoryName('');
                          }}
                          className={'p-3 rounded-lg border-2 transition-all ' + (
                            selectedCategory === category.name
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">{category.emoji}</div>
                            <div className="text-xs font-medium text-gray-900">{category.name}</div>
                          </div>
                        </button>
                      );
                    })}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowTaggingModal(false);
                    setSelectedPostForTagging(null);
                    setSelectedCategory('');
                    setNewCategoryName('');
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const category = newCategoryName.trim() || selectedCategory;
                    if (category) {
                      handleTagPost(selectedPostForTagging.id, category);
                    }
                  }}
                  disabled={!selectedCategory && !newCategoryName.trim()}
                  className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  Tag Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AICoachUpdated;