import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Home, BarChart3, Bell, User, Plus, TrendingUp, Users, Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

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
    shares: number;
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
    shares: number;
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
  shares?: number;
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

// NEW: Heatmap data structure
interface HeatmapCell {
  day: string;
  hour: number;
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

const SocialSageMobile = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string | null>(null);
  
  // Real Instagram data state
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Logout function
  const handleLogout = async () => {
    console.log('🚪 Logging out from dashboard...')
    
    try {
      sessionStorage.removeItem('socialsage_user_id')
      sessionStorage.removeItem('socialsage_user_email')
      localStorage.clear()
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Logout error:', error)
      } else {
        console.log('✅ Logged out successfully')
      }
      
      router.push('/')
      router.refresh()
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
      router.push('/')
    }
  }

  // Fetch real Instagram data
  useEffect(() => {
    const fetchInstagramData = async () => {
      console.log('📡 SocialSage: Fetching Instagram data...');
      setIsLoadingData(true);
      
      try {
        const response = await fetch('/api/instagram/metrics');
        console.log('📊 SocialSage: API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 SocialSage: Instagram API Response:', data);
          setInstagramData(data);
          setDataError(null);
        } else {
          const error = await response.json();
          console.error('❌ SocialSage: API Error:', error);
          setDataError(error.error || 'Failed to fetch Instagram data');
        }
      } catch (error) {
        console.error('❌ SocialSage: Failed to fetch Instagram data:', error);
        setDataError('Network error while fetching data. Please check your Instagram connection.');
      }
      
      setIsLoadingData(false);
    };

    fetchInstagramData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchInstagramData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // NEW: Calculate real timing data from posts WITH heatmap support
  const calculateTimingOptimization = (posts: InstagramPost[]): { timeSlots: TimeSlot[], heatmapData: HeatmapCell[] } => {
    if (!posts || posts.length === 0) {
      return { timeSlots: [], heatmapData: [] };
    }

    const timeSlotMap = new Map<string, TimeSlot>();
    const heatmapMap = new Map<string, HeatmapCell>();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const dayOfWeek = dayAbbr[date.getDay()];
      const dayIndex = date.getDay();
      const hour = date.getHours();
      const timeKey = `${dayOfWeek} ${hour}:00`;
      const heatmapKey = `${dayIndex}-${hour}`;

      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      const reach = post.reach || 0;

      // Update time slot data (existing logic)
      if (!timeSlotMap.has(timeKey)) {
        timeSlotMap.set(timeKey, {
          time: timeKey,
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

      // Update heatmap data
      if (!heatmapMap.has(heatmapKey)) {
        heatmapMap.set(heatmapKey, {
          day: dayOfWeek,
          hour,
          dayIndex,
          engagementScore: 0,
          postCount: 0,
          avgLikes: 0,
          avgComments: 0,
          avgReach: 0,
          intensity: 0
        });
      }

      const heatmapCell = heatmapMap.get(heatmapKey)!;
      heatmapCell.postCount += 1;
    });

    // Calculate averages for time slots
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

    // Calculate heatmap data with proper engagement scores
    const heatmapCells = Array.from(heatmapMap.values()).map(cell => {
      const relevantSlot = timeSlots.find(slot => 
        slot.hour === cell.hour && slot.dayOfWeek === cell.day
      );

      if (relevantSlot) {
        cell.engagementScore = relevantSlot.engagementScore;
        cell.avgLikes = relevantSlot.avgLikes;
        cell.avgComments = relevantSlot.avgComments;
        cell.avgReach = relevantSlot.avgReach;
      }

      return cell;
    });

    // Calculate intensity for color mapping (0-100)
    const maxEngagement = Math.max(...heatmapCells.map(cell => cell.engagementScore));
    const minEngagement = Math.min(...heatmapCells.map(cell => cell.engagementScore));
    
    heatmapCells.forEach(cell => {
      if (maxEngagement > minEngagement) {
        cell.intensity = Math.round(((cell.engagementScore - minEngagement) / (maxEngagement - minEngagement)) * 100);
      } else {
        cell.intensity = cell.engagementScore > 0 ? 50 : 0;
      }
    });

    // Fill in missing cells with zero values for complete grid
    const completeHeatmapData: HeatmapCell[] = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let hour = 0; hour < 24; hour++) {
        const existing = heatmapCells.find(cell => cell.dayIndex === dayIndex && cell.hour === hour);
        if (existing) {
          completeHeatmapData.push(existing);
        } else {
          completeHeatmapData.push({
            day: dayAbbr[dayIndex],
            hour,
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
    if (!posts || posts.length === 0) {
      return {
        currentFrequency: 0,
        optimalFrequency: 3,
        consistencyScore: 0,
        performanceByFrequency: [],
        weeklyPattern: []
      };
    }

    // Calculate current frequency (posts per week)
    const sortedPosts = posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const firstPost = new Date(sortedPosts[sortedPosts.length - 1].timestamp);
    const lastPost = new Date(sortedPosts[0].timestamp);
    const daysDiff = Math.max(1, (lastPost.getTime() - firstPost.getTime()) / (1000 * 60 * 60 * 24));
    const currentFrequency = Math.round((posts.length / daysDiff) * 7 * 10) / 10;

    // Group posts by week and calculate performance
    const weeklyGroups = new Map<string, { posts: InstagramPost[], engagement: number }>();
    
    posts.forEach(post => {
      const date = new Date(post.timestamp);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, { posts: [], engagement: 0 });
      }
      
      const group = weeklyGroups.get(weekKey)!;
      group.posts.push(post);
      group.engagement += engagement;
    });

    // Calculate performance by frequency buckets
    const frequencyBuckets = new Map<string, { totalEngagement: number, postCount: number, weekCount: number }>();
    
    Array.from(weeklyGroups.values()).forEach(week => {
      const postsPerWeek = week.posts.length;
      let bucket = '';
      
      if (postsPerWeek <= 1) bucket = '1 post/week';
      else if (postsPerWeek <= 3) bucket = '2-3 posts/week';
      else if (postsPerWeek <= 5) bucket = '4-5 posts/week';
      else bucket = '6+ posts/week';
      
      if (!frequencyBuckets.has(bucket)) {
        frequencyBuckets.set(bucket, { totalEngagement: 0, postCount: 0, weekCount: 0 });
      }
      
      const bucketData = frequencyBuckets.get(bucket)!;
      bucketData.totalEngagement += week.engagement;
      bucketData.postCount += week.posts.length;
      bucketData.weekCount += 1;
    });

    const performanceByFrequency = Array.from(frequencyBuckets.entries()).map(([range, data]) => ({
      range,
      avgEngagement: data.weekCount > 0 ? Math.round(data.totalEngagement / data.weekCount) : 0,
      postCount: data.postCount
    })).sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Find optimal frequency
    const bestPerformingBucket = performanceByFrequency[0];
    let optimalFrequency = 3; // default
    if (bestPerformingBucket) {
      if (bestPerformingBucket.range.includes('1 post')) optimalFrequency = 1;
      else if (bestPerformingBucket.range.includes('2-3')) optimalFrequency = 2.5;
      else if (bestPerformingBucket.range.includes('4-5')) optimalFrequency = 4.5;
      else optimalFrequency = 6;
    }

    // Calculate consistency score
    const weekCounts = Array.from(weeklyGroups.values()).map(week => week.posts.length);
    const avgWeeklyPosts = weekCounts.reduce((sum, count) => sum + count, 0) / weekCounts.length;
    const variance = weekCounts.reduce((sum, count) => sum + Math.pow(count - avgWeeklyPosts, 2), 0) / weekCounts.length;
    const consistencyScore = Math.max(0, Math.round(100 - (variance * 10)));

    // Weekly pattern
    const weeklyPattern = Array.from(weeklyGroups.entries()).map(([week, data]) => ({
      week,
      postCount: data.posts.length,
      avgEngagement: data.posts.length > 0 ? Math.round(data.engagement / data.posts.length) : 0
    })).slice(-8); // Last 8 weeks

    return {
      currentFrequency,
      optimalFrequency,
      consistencyScore,
      performanceByFrequency,
      weeklyPattern
    };
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

  // Generate metric categories with real data
  const getMetricCategories = (): MetricCategory[] => {
    // Calculate timing and frequency data
    const timingData = instagramData?.recentPosts ? calculateTimingOptimization(instagramData.recentPosts) : null;
    const frequencyData = instagramData?.recentPosts ? calculateFrequencyOptimization(instagramData.recentPosts) : null;

    const baseCategories = [
      {
        id: 'growth',
        title: 'Growth Metrics',
        emoji: '🚀',
        description: 'Track follower growth and profile performance',
        color: 'from-green-400 to-emerald-500',
        metrics: [
          { 
            name: 'Total Followers', 
            value: instagramData?.followers?.toLocaleString() || '0', 
            trend: 'neutral' as 'neutral'
          },
          { 
            name: 'Weekly Growth Rate', 
            value: instagramData?.growthData?.canCalculateWeekly ? 
              (instagramData.growthRate || '0%') : 
              `Available in ${instagramData?.growthData?.daysUntilWeekly || 7}d`, 
            trend: instagramData?.growthData?.canCalculateWeekly ? 'up' as 'up' : 'neutral' as 'neutral'
          },
          { 
            name: 'Monthly Growth Rate', 
            value: instagramData?.growthData?.canCalculateMonthly ? 
              (instagramData.monthlyGrowth || '0%') : 
              `Available in ${instagramData?.growthData?.daysUntilMonthly || 30}d`, 
            trend: instagramData?.growthData?.canCalculateMonthly ? 'up' as 'up' : 'neutral' as 'neutral'
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
            value: instagramData?.engagementRate || '4.2%', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Avg Likes per Post', 
            value: instagramData?.avgLikes?.toString() || '342', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Avg Comments per Post', 
            value: instagramData?.avgComments?.toString() || '18.5', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Avg Reach per Post', 
            value: instagramData?.avgReach ? instagramData.avgReach.toLocaleString() : '1.2K', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Avg Impressions per Post', 
            value: instagramData?.avgImpressions ? instagramData.avgImpressions.toLocaleString() : '2.3K', 
            trend: 'up' as 'up' 
          }
        ]
      },
      {
        id: 'timing',
        title: 'Timing Optimization',
        emoji: '⏰',
        description: 'When to post for maximum engagement',
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
        emoji: '📈',
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
        id: 'content',
        title: 'Content Analysis',
        emoji: '📊',
        description: 'Performance by format and content themes',
        color: 'from-teal-400 to-cyan-500',
        metrics: instagramData?.recentPosts && instagramData.recentPosts.length > 0 ? [
          { name: 'Content Types', value: `${new Set(instagramData.recentPosts.map(p => p.media_type)).size} types`, trend: 'neutral' as 'neutral' },
          { name: 'Total Posts', value: instagramData.recentPosts.length.toString(), trend: 'neutral' as 'neutral' },
          { name: 'Avg Engagement', value: Math.round((instagramData.avgLikes || 0) + (instagramData.avgComments || 0)).toString(), trend: 'up' as 'up' }
        ] : [
          { name: 'No Content Data', value: 'Connect account', trend: 'neutral' as 'neutral' }
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
      }
    ];

    return baseCategories;
  };

  const metricCategories = getMetricCategories();

  const MetricDetailView = ({ category }: { category: MetricCategory }) => {
    if (category.id === 'content') {
      // Calculate content type performance from real data
      const getContentTypeData = () => {
        if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
          return [];
        }

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
              totalShares: 0
            });
          }
          
          const group = typeGroups.get(type);
          group.posts.push(post);
          group.totalLikes += post.like_count || 0;
          group.totalComments += post.comments_count || 0;
          group.totalReach += post.reach || 0;
          group.totalShares += post.shares || 0;
        });

        // Convert to array with averages and sort by engagement
        const contentTypes = Array.from(typeGroups.entries()).map(([type, data]) => {
          const count = data.posts.length;
          const avgLikes = Math.round(data.totalLikes / count);
          const avgComments = Math.round(data.totalComments / count);
          const avgReach = Math.round(data.totalReach / count);
          const avgShares = Math.round(data.totalShares / count);
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
            avgShares,
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
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-teal-600 font-medium"
            >
              ← Back
            </button>
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
                    <div key={contentType.type} className={`bg-gradient-to-br ${contentType.bgColor} ${contentType.borderColor} rounded-2xl p-4 shadow-sm border`}>
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
                            <Share className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-gray-900">{contentType.avgShares}</span>
                          </div>
                          <div className="text-xs text-gray-600">Avg Shares</div>
                        </div>
                      </div>
                    </div>
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

      // Format hour for display
      const formatHour = (hour: number) => {
        if (hour === 0) return '12a';
        if (hour < 12) return `${hour}a`;
        if (hour === 12) return '12p';
        return `${hour - 12}p`;
      };

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const hours = Array.from({ length: 24 }, (_, i) => i);

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-purple-50 to-pink-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-purple-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-purple-600 font-medium"
            >
              ← Back
            </button>
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
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center">
                    <span className="mr-2">🔥</span>
                    Engagement Heatmap
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
                  <div className="overflow-x-auto">
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

                      {/* Hour rows - show every 3 hours to fit mobile */}
                      {hours.filter((_, index) => index % 3 === 0).map(hour => (
                        <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                          <div className="text-xs text-gray-500 text-right py-1 pr-2 font-medium">
                            {formatHour(hour)}
                          </div>
                          {days.map((day, dayIndex) => {
                            const cellData = heatmapData.find(cell => 
                              cell.dayIndex === dayIndex && cell.hour === hour
                            );
                            const hasData = cellData && cellData.postCount > 0;
                            
                            return (
                              <div
                                key={`${dayIndex}-${hour}`}
                                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all hover:scale-110 cursor-pointer ${
                                  getHeatmapColor(cellData?.intensity || 0, !!hasData)
                                }`}
                                title={hasData 
                                  ? `${day} ${formatHour(hour)}: ${cellData.engagementScore} score (${cellData.postCount} posts)`
                                  : `${day} ${formatHour(hour)}: No posts`
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
                    Numbers show post count • Hover for details • Showing every 3rd hour
                  </div>
                </div>

                {/* Top 5 Time Slots */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🏆</span>
                    Top 5 Time Slots
                  </h3>
                  <div className="space-y-3">
                    {timeSlots.slice(0, 5).map((slot, index) => (
                      <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-3 border border-purple-200/50">
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
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 bg-purple-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">💡 Recommendations</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-purple-800">
                      • Your best time slot is <strong>{timeSlots[0]?.time}</strong> with {timeSlots[0]?.avgLikes} average likes
                    </p>
                    <p className="text-purple-800">
                      • You've tested {timeSlots.length} different time slots - try posting more during top performers
                    </p>
                    <p className="text-purple-800">
                      • Consider posting during {timeSlots.slice(0, 3).map(slot => slot.time).join(', ')} for best results
                    </p>
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
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-orange-600 font-medium"
            >
              ← Back
            </button>
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



                {/* Performance by Frequency */}
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

                {/* Weekly Pattern */}
                {frequencyData.weeklyPattern.length > 0 && (
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
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-violet-600 font-medium"
            >
              ← Back
            </button>
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
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {realTopFollowers.map((follower, index) => {
                  const badge = getEngagementBadge(follower.engagementType);
                  return (
                    <div key={index} className="bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-200/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
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
                  );
                })}
              </div>
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

            {realTopFollowers.length > 0 && (
              <>
                <div className="mt-6 bg-violet-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-violet-900 mb-2">💡 Real Insights</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-violet-800">
                      • You have {realTopFollowers.filter(f => f.engagementType === 'high').length} super fans who comment regularly
                    </p>
                    <p className="text-violet-800">
                      • Your top {Math.min(5, realTopFollowers.length)} followers drive {Math.round((realTopFollowers.slice(0, 5).reduce((sum, f) => sum + f.interactions, 0) / realTopFollowers.reduce((sum, f) => sum + f.interactions, 0)) * 100) || 0}% of your engagement
                    </p>
                    <p className="text-violet-800">
                      • Average {(realTopFollowers.reduce((sum, f) => sum + f.comments, 0) / realTopFollowers.length).toFixed(1)} comments per active follower
                    </p>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <button className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl px-6 py-3 font-medium text-sm shadow-sm hover:shadow-md transition-all">
                    Export Engagement Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Enhanced metric detail view for Growth and Engagement categories
    if (category.id === 'growth') {
      const [growthTimeFrame, setGrowthTimeFrame] = useState<'weekly' | 'monthly'>('weekly');
      
      // Get the appropriate growth data based on selected timeframe
      const getCurrentGrowthData = () => {
        if (growthTimeFrame === 'weekly') {
          return {
            rate: instagramData?.growthData?.canCalculateWeekly ? instagramData.growthRate : null,
            canCalculate: instagramData?.growthData?.canCalculateWeekly || false,
            daysUntil: instagramData?.growthData?.daysUntilWeekly || 7,
            label: 'Weekly Growth',
            period: 'past 7 days'
          };
        } else {
          return {
            rate: instagramData?.growthData?.canCalculateMonthly ? instagramData.monthlyGrowth : null,
            canCalculate: instagramData?.growthData?.canCalculateMonthly || false,
            daysUntil: instagramData?.growthData?.daysUntilMonthly || 30,
            label: 'Monthly Growth',
            period: 'past 30 days'
          };
        }
      };

      const growthData = getCurrentGrowthData();

      // Calculate absolute follower change
      const getAbsoluteFollowerChange = () => {
        if (!instagramData?.followers) return null;
        
        if (growthTimeFrame === 'weekly' && instagramData?.growthData?.canCalculateWeekly && instagramData.growthRate) {
          const growthPercent = parseFloat(instagramData.growthRate.replace('+', '').replace('%', ''));
          const absoluteChange = Math.round((growthPercent / 100) * instagramData.followers);
          return {
            change: absoluteChange,
            isPositive: absoluteChange >= 0,
            formatted: absoluteChange >= 0 ? `+${absoluteChange.toLocaleString()}` : absoluteChange.toLocaleString()
          };
        } else if (growthTimeFrame === 'monthly' && instagramData?.growthData?.canCalculateMonthly && instagramData.monthlyGrowth) {
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

      const absoluteChange = getAbsoluteFollowerChange();

      // Generate chart data from real historical data when available
      const generateChartData = () => {
        if (!instagramData?.followers) return [];
        
        // Use real historical data if available
        if (instagramData.historicalData) {
          if (growthTimeFrame === 'weekly' && instagramData.historicalData.weekly.length > 0) {
            return instagramData.historicalData.weekly.map((dataPoint, index) => {
              const date = new Date(dataPoint.date);
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - 6); // Start of the week (Monday)
              
              const isCurrentWeek = !dataPoint.isComplete;
              const weekLabel = isCurrentWeek ? 'This Week' : 
                `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
              
              return {
                label: weekLabel,
                followers: dataPoint.followers,
                isCurrentPeriod: isCurrentWeek,
                date: dataPoint.date
              };
            });
          } else if (growthTimeFrame === 'monthly' && instagramData.historicalData.monthly.length > 0) {
            return instagramData.historicalData.monthly.map((dataPoint, index) => {
              const date = new Date(dataPoint.date);
              const isCurrentMonth = !dataPoint.isComplete;
              const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
              
              return {
                label: monthLabel,
                followers: dataPoint.followers,
                isCurrentPeriod: isCurrentMonth,
                date: dataPoint.date
              };
            });
          }
        }
        
        // Only return empty array if no real data available - no fake/estimated data
        return [];
      };

      const chartData = generateChartData();
      const maxFollowers = Math.max(...chartData.map(d => d.followers));

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-emerald-50 to-teal-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-emerald-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-emerald-600 font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center">
              <span className="mr-2">🚀</span>
              <h1 className="text-xl font-bold text-gray-900">Growth Metrics</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Follower Growth Analysis</h2>
              <p className="text-emerald-800 text-sm">
                {instagramData?.growthData?.daysOfData ? 
                  `${instagramData.growthData.daysOfData} days of data collected since ${instagramData.growthData.dataAvailableSince}` :
                  'Connect your account and wait for data collection to see growth rates.'
                }
              </p>
            </div>

            {/* Weekly/Monthly Toggle */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <div className="flex bg-emerald-50 rounded-xl p-1 border border-emerald-200">
                {[
                  { key: 'weekly' as const, label: 'Weekly' },
                  { key: 'monthly' as const, label: 'Monthly' }
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setGrowthTimeFrame(period.key)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                      growthTimeFrame === period.key
                        ? 'bg-white text-emerald-700 shadow-sm border border-emerald-300'
                        : 'text-emerald-600 hover:text-emerald-700'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth Rate Display */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                {growthData.label}
              </h3>
              
              {growthData.canCalculate ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {growthData.rate}
                      </div>
                      <div className="text-sm text-gray-600">Growth Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-1 ${absoluteChange?.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {absoluteChange?.formatted || '--'}
                      </div>
                      <div className="text-sm text-gray-600">Followers {growthTimeFrame === 'weekly' ? 'This Week' : 'This Month'}</div>
                    </div>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    Growth over {growthData.period}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📊</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Not Enough Data Yet</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    We need {growthTimeFrame === 'weekly' ? '7' : '30'} days of data to calculate accurate {growthTimeFrame} growth rates.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-sm font-medium text-blue-900">
                      {growthData.label} available in {growthData.daysUntil} days
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      We're currently collecting data - check back soon!
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Real Profile Performance (only show if we have real data) */}
            {instagramData?.accountInsights && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">👁️</span>
                  Profile Performance ({growthTimeFrame === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'})
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {instagramData.accountInsights.profile_visits > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {/* Show scaled data based on timeframe */}
                        {growthTimeFrame === 'weekly' ? 
                          Math.round(instagramData.accountInsights.profile_visits * (7/30)).toLocaleString() :
                          instagramData.accountInsights.profile_visits.toLocaleString()
                        }
                      </div>
                      <div className="text-sm text-gray-600">Profile Visits</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {growthTimeFrame === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                      </div>
                    </div>
                  )}
                  
                  {instagramData.accountInsights.reach > 0 && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        {/* Show scaled data based on timeframe */}
                        {growthTimeFrame === 'weekly' ? 
                          ((instagramData.accountInsights.reach * (7/30)) / 1000).toFixed(1) + 'K' :
                          (instagramData.accountInsights.reach / 1000).toFixed(1) + 'K'
                        }
                      </div>
                      <div className="text-sm text-gray-600">Total Reach</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {growthTimeFrame === 'weekly' ? 'Last 7 days' : 'Last 30 days'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Follower History Bar Chart - Vertical Bars */}
            {chartData.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Follower History ({growthTimeFrame === 'weekly' ? 'Last 4 Weeks' : 'Last 6 Months'})
                </h3>
                
                {/* Vertical Bar Chart */}
                <div className="relative">
                  {/* Y-axis labels (follower counts) */}
                  <div className="flex items-end justify-between h-40 mb-3">
                    {chartData.map((dataPoint, index) => {
                      const height = maxFollowers > 0 ? (dataPoint.followers / maxFollowers) * 100 : 0;
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2" style={{ width: `${100/chartData.length}%` }}>
                          {/* Follower count label */}
                          <div className="text-xs font-bold text-gray-900 mb-1">
                            {dataPoint.followers >= 1000 ? 
                              `${(dataPoint.followers / 1000).toFixed(1)}K` : 
                              dataPoint.followers.toLocaleString()
                            }
                          </div>
                          
                          {/* Vertical bar */}
                          <div className="relative w-8 bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
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
                  
                  {/* X-axis labels (time periods) */}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    {chartData.map((dataPoint, index) => (
                      <div key={index} className="text-xs text-gray-600 text-center" style={{ width: `${100/chartData.length}%` }}>
                        {dataPoint.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  {growthTimeFrame === 'weekly' ? 
                    'Current week updates daily until Sunday' : 
                    'Current month updates daily until month end'
                  }
                </div>
              </div>
            )}

            {/* Data Collection Status */}
            <div className="bg-emerald-50 rounded-2xl p-4">
              <h3 className="font-semibold text-emerald-900 mb-2">📊 Data Collection Status</h3>
              <div className="space-y-2 text-sm">
                <p className="text-emerald-800">
                  • <strong>{instagramData?.growthData?.daysOfData || 0} days</strong> of follower data collected
                </p>
                {instagramData?.growthData?.dataAvailableSince && (
                  <p className="text-emerald-800">
                    • Tracking started: <strong>{instagramData.growthData.dataAvailableSince}</strong>
                  </p>
                )}
                <p className="text-emerald-800">
                  • Weekly growth rates: <strong>{instagramData?.growthData?.canCalculateWeekly ? 'Available' : `Available in ${instagramData?.growthData?.daysUntilWeekly || 7} days`}</strong>
                </p>
                <p className="text-emerald-800">
                  • Monthly growth rates: <strong>{instagramData?.growthData?.canCalculateMonthly ? 'Available' : `Available in ${instagramData?.growthData?.daysUntilMonthly || 30} days`}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (category.id === 'engagement') {
      // Calculate 30-day engagement metrics from real data
      const calculateEngagementMetrics = () => {
        if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
          return {
            engagementRate: instagramData?.engagementRate || '--',
            avgLikes: instagramData?.avgLikes || 0,
            avgComments: instagramData?.avgComments || 0,
            avgReach: instagramData?.avgReach || 0,
            avgShares: 0
          };
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // Filter posts from last 30 days
        const last30DaysPosts = instagramData.recentPosts.filter(post => {
          const postDate = new Date(post.timestamp);
          return postDate >= thirtyDaysAgo;
        });

        if (last30DaysPosts.length === 0) {
          return {
            engagementRate: '--',
            avgLikes: 0,
            avgComments: 0,
            avgReach: 0,
            avgShares: 0
          };
        }

        // Calculate metrics from last 30 days
        const totalLikes = last30DaysPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const totalComments = last30DaysPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalReach = last30DaysPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
        const totalShares = last30DaysPosts.reduce((sum, post) => sum + (post.website_clicks || 0), 0);
        const totalEngagement = totalLikes + totalComments;

        const avgLikes = Math.round(totalLikes / last30DaysPosts.length);
        const avgComments = Math.round(totalComments / last30DaysPosts.length);
        const avgReach = totalReach > 0 ? Math.round(totalReach / last30DaysPosts.length) : 0;
        const avgShares = Math.round(totalShares / last30DaysPosts.length);

        // Calculate engagement rate
        let engagementRate = '--';
        if (totalReach > 0) {
          const rate = (totalEngagement / totalReach) * 100;
          engagementRate = `${rate.toFixed(1)}%`;
        } else if (instagramData.followers > 0) {
          const avgFollowersReached = instagramData.followers * last30DaysPosts.length;
          const rate = (totalEngagement / avgFollowersReached) * 100;
          engagementRate = `${rate.toFixed(1)}%`;
        }

        return {
          engagementRate,
          avgLikes,
          avgComments,
          avgReach,
          avgShares
        };
      };

      const engagementMetrics = calculateEngagementMetrics();

      // Generate engagement rate history for last 6 months
      const generateEngagementHistory = () => {
        if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
          return [];
        }

        const months = [];
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
          const isCurrentMonth = i === 0;
          
          // Filter posts for this month
          const monthPosts = instagramData.recentPosts.filter(post => {
            const postDate = new Date(post.timestamp);
            return postDate >= monthStart && postDate <= monthEnd;
          });

          let monthlyEngagementRate = 0;
          if (monthPosts.length > 0) {
            const totalLikes = monthPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
            const totalComments = monthPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
            const totalReach = monthPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
            const totalEngagement = totalLikes + totalComments;

            if (totalReach > 0) {
              monthlyEngagementRate = (totalEngagement / totalReach) * 100;
            } else if (instagramData.followers > 0) {
              const avgFollowersReached = instagramData.followers * monthPosts.length;
              monthlyEngagementRate = (totalEngagement / avgFollowersReached) * 100;
            }
          }

          const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short' });
          
          months.push({
            label: monthLabel,
            engagementRate: monthlyEngagementRate,
            isCurrentPeriod: isCurrentMonth,
            date: monthStart.toISOString(),
            postsCount: monthPosts.length
          });
        }
        
        return months;
      };

      const engagementHistory = generateEngagementHistory();
      const maxEngagementRate = Math.max(...engagementHistory.map(d => d.engagementRate));

      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-blue-50 to-purple-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-blue-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <button 
              onClick={() => setSelectedMetricCategory(null)}
              className="mr-3 text-blue-600 font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center">
              <span className="mr-2">💬</span>
              <h1 className="text-xl font-bold text-gray-900">Engagement Metrics</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 border-blue-200 rounded-2xl p-4 mb-6 shadow-sm border">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Audience Interaction (Last 30 Days)</h2>
              <p className="text-blue-800 text-sm">
                Measure how actively your audience engages with your content over the past month.
              </p>
            </div>

            {/* Main Engagement Rate Circle */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-sm mb-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center">
                <span className="mr-2">🎯</span>
                Overall Engagement Rate
              </h3>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                <div 
                  className="absolute inset-0 rounded-full border-8 border-blue-500 transition-all duration-1000"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${
                      50 + 50 * Math.cos((parseFloat(engagementMetrics.engagementRate?.replace('%', '') || '0') / 10) * 2 * Math.PI - Math.PI/2)
                    }% ${
                      50 - 50 * Math.sin((parseFloat(engagementMetrics.engagementRate?.replace('%', '') || '0') / 10) * 2 * Math.PI - Math.PI/2)
                    }%, 50% 50%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {engagementMetrics.engagementRate}
                    </div>
                    <div className="text-xs text-gray-600">Engagement</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Based on posts from the last 30 days
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Engagement Breakdown (Last 30 Days)
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Likes per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {engagementMetrics.avgLikes.toLocaleString()}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-400 to-pink-500 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Comments per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {engagementMetrics.avgComments.toLocaleString()}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Reach per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {engagementMetrics.avgReach > 0 ? engagementMetrics.avgReach.toLocaleString() : '--'}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Share className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Shares per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {engagementMetrics.avgShares.toLocaleString()}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{width: '55%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Rate History Bar Chart */}
            {engagementHistory.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📈</span>
                  Engagement Rate History (Last 6 Months)
                </h3>
                
                {/* Vertical Bar Chart */}
                <div className="relative">
                  {/* Y-axis labels (engagement rates) */}
                  <div className="flex items-end justify-between h-40 mb-3">
                    {engagementHistory.map((dataPoint, index) => {
                      const height = maxEngagementRate > 0 ? (dataPoint.engagementRate / maxEngagementRate) * 100 : 0;
                      return (
                        <div key={index} className="flex flex-col items-center space-y-2" style={{ width: `${100/engagementHistory.length}%` }}>
                          {/* Engagement rate label */}
                          <div className="text-xs font-bold text-gray-900 mb-1">
                            {dataPoint.engagementRate > 0 ? `${dataPoint.engagementRate.toFixed(1)}%` : '--'}
                          </div>
                          
                          {/* Vertical bar */}
                          <div className="relative w-8 bg-gray-100 rounded-t-lg overflow-hidden" style={{ height: '120px' }}>
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
                  
                  {/* X-axis labels (months) */}
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    {engagementHistory.map((dataPoint, index) => (
                      <div key={index} className="text-xs text-gray-600 text-center" style={{ width: `${100/engagementHistory.length}%` }}>
                        {dataPoint.label}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  Current month updates daily until month end
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
          <button 
            onClick={() => setSelectedMetricCategory(null)}
            className="mr-3 text-blue-500 font-medium"
          >
            ← Back
          </button>
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
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
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
            <button 
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded"
            >
              Logout
            </button>
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
              <span className="text-blue-600 text-sm">Loading Instagram data...</span>
            </div>
          </div>
        )}

        {/* Data error indicator */}
        {dataError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 text-sm">⚠️ {dataError}</span>
            </div>
          </div>
        )}

        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 shadow-sm border border-white/50">
            {[
              { key: 'weekly' as TimeFrame, label: 'Weekly' },
              { key: 'monthly' as TimeFrame, label: 'Monthly' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setTimeFrame(period.key)}
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
        </div>

        <div className="px-4 pb-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
              <div className="text-xl font-bold text-blue-600">
                {instagramData ? instagramData.followers.toLocaleString() : '0'}
              </div>
              <div className="text-xs text-gray-600">Total Followers</div>
            </div>
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
          </div>
        </div>

        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Detailed Analytics</h2>
          <div className="grid grid-cols-2 gap-3">
            {metricCategories.map((category, index) => {
              const cardColors = [
                'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-200',
                'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200', 
                'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200',
                'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200',
                'bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-200',
                'bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200'
              ];
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedMetricCategory(category.id)}
                  className={`${cardColors[index]} rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all text-left hover:scale-105 transform duration-200`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center mb-3 shadow-sm`}>
                    <span className="text-2xl">{category.emoji}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{category.title}</h3>
                  <p className="text-xs text-gray-700 leading-relaxed mb-2">{category.description}</p>
                  <div className="text-xs text-blue-700 font-medium">View Details →</div>
                </button>
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
          shares: post.website_clicks || 0,
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
          shares: post.website_clicks || Math.floor((post.like_count || 0) * 0.1),
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
          
          <div className="flex bg-gray-100 rounded-xl p-1 mb-3">
            {[
              { key: 'recent', label: 'Recent Posts' },
              { key: 'top', label: 'Top Posts' }
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setPostsView(view.key)}
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

          {postsView === 'top' && (
            <div className="flex bg-blue-50 rounded-lg p-1 border border-blue-200">
              {[
                { key: 'weekly' as PostsTimeFrame, label: 'Week' },
                { key: 'monthly' as PostsTimeFrame, label: 'Month' },
                { key: 'annual' as PostsTimeFrame, label: 'Year' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setPostsTimeFrame(period.key)}
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
                    <div key={post.id} className={`${cardColors[(post.id - 1) % cardColors.length]} rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all`}>
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
                            <Share className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                            <div className="text-sm font-bold text-gray-900">{post.metrics.shares}</div>
                            <div className="text-xs text-gray-600">Shares</div>
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
                  <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all">
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
                          <Share className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                          <div className="text-sm font-bold text-gray-900">{post.metrics.shares}</div>
                          <div className="text-xs text-gray-600">Shares</div>
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const metricOptions: MetricOption[] = [
      { value: 'growth', label: 'Follower Growth', description: 'Increase your audience size' },
      { value: 'engagement', label: 'Engagement Rate', description: 'Boost likes, comments, and shares' },
      { value: 'timing', label: 'Posting Times', description: 'When to post for best results' },
      { value: 'frequency', label: 'Posting Frequency', description: 'How often to post optimally' },
      { value: 'content', label: 'Content Strategy', description: 'Improve your content performance' },
      { value: 'reach', label: 'Audience Reach', description: 'Expand your content visibility' }
    ];

    const connectedAccounts: Account[] = [
      { platform: 'Instagram', username: instagramData?.username || 'Not connected', connected: !!instagramData, color: 'from-pink-500 to-orange-500' },
      { platform: 'Twitter/X', username: 'Not available', connected: false, color: 'from-gray-800 to-black' },
      { platform: 'LinkedIn', username: 'Not available', connected: false, color: 'from-blue-600 to-blue-700' }
    ];

    const handleMetricSelect = (metric: string) => {
      setSelectedMetric(metric);
      setChatStep(2);
    };

    const handleAccountSelect = (account: Account) => {
      setSelectedAccount(account);
      setIsAnalyzing(true);
      setChatStep(3);
      setTimeout(() => {
        setIsAnalyzing(false);
        setChatStep(4);
      }, 2000);
    };

    const resetChat = () => {
      setChatStep(1);
      setSelectedMetric('');
      setSelectedAccount('');
      setIsAnalyzing(false);
    };

    const getAIRecommendations = (): AIRecommendation => {
      if (!instagramData || !instagramData.recentPosts || instagramData.recentPosts.length === 0) {
        // Fallback for users with no data
        return {
          title: "Connect Your Account for Personalized Insights",
          insights: [
            "Connect your Instagram account to get data-driven recommendations.",
            "We need at least 5-10 posts to provide meaningful analysis.",
            "Our AI will analyze your content performance, timing, and audience engagement patterns."
          ],
          actions: [
            "Connect your Instagram Business or Creator account",
            "Post consistently for 1-2 weeks to gather data",
            "Return for personalized recommendations based on your performance"
          ]
        };
      }

      // Real data-driven analysis based on selected metric
      const timingData = calculateTimingOptimization(instagramData.recentPosts);
      const frequencyData = calculateFrequencyOptimization(instagramData.recentPosts);
      
      // Calculate content type performance
      const contentTypeAnalysis = () => {
        const typeGroups = new Map();
        if (instagramData.recentPosts) {
          instagramData.recentPosts.forEach(post => {
            let type = 'Post';
            if (post.media_type === 'VIDEO') type = 'Reel';
            else if (post.media_type === 'CAROUSEL_ALBUM') type = 'Carousel';
            
            if (!typeGroups.has(type)) {
              typeGroups.set(type, { posts: [], totalEngagement: 0, totalReach: 0 });
            }
            
            const group = typeGroups.get(type);
            group.posts.push(post);
            group.totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
            group.totalReach += post.reach || 0;
          });
        }

        return Array.from(typeGroups.entries()).map(([type, data]) => ({
          type,
          count: data.posts.length,
          avgEngagement: Math.round(data.totalEngagement / data.posts.length),
          avgReach: Math.round(data.totalReach / data.posts.length),
          engagementRate: data.totalReach > 0 ? 
            (((data.totalEngagement / data.totalReach) * 100).toFixed(1) + '%') : 
            'N/A'
        })).sort((a, b) => b.avgEngagement - a.avgEngagement);
      };

      const contentTypes = contentTypeAnalysis();
      const bestContentType = contentTypes[0];
      const worstContentType = contentTypes[contentTypes.length - 1];

      // Calculate engagement trends
      const calculateEngagementTrend = () => {
        const sortedPosts = [...(instagramData.recentPosts || [])].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const half = Math.floor(sortedPosts.length / 2);
        const firstHalf = sortedPosts.slice(0, half);
        const secondHalf = sortedPosts.slice(half);
        
        const firstHalfAvg = firstHalf.reduce((sum, post) => 
          sum + (post.like_count || 0) + (post.comments_count || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, post) => 
          sum + (post.like_count || 0) + (post.comments_count || 0), 0) / secondHalf.length;
        
        const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg * 100);
        return {
          trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
          percentage: Math.abs(change).toFixed(1)
        };
      };

      const engagementTrend = calculateEngagementTrend();

      // Industry benchmarks (realistic social media benchmarks)
      const industryBenchmarks = {
        engagementRate: 3.5, // Industry average
        postsPerWeek: 3.5,
        avgLikes: 200,
        avgComments: 15
      };

      const userEngagementRate = parseFloat(instagramData.engagementRate?.replace('%', '') || '0');
      const isAboveAverage = userEngagementRate > industryBenchmarks.engagementRate;

    const recommendations: Record<string, AIRecommendation> = {
      growth: {
        title: "Data-Driven Growth Strategy",
        insights: [
        `You have ${instagramData.followers.toLocaleString()} followers with ${instagramData.growthData?.canCalculateWeekly ? instagramData.growthRate : 'steady'} growth rate.`,
        `Your engagement rate of ${instagramData.engagementRate} is ${isAboveAverage ? `${(userEngagementRate - industryBenchmarks.engagementRate).toFixed(1)}% above` : `${(industryBenchmarks.engagementRate - userEngagementRate).toFixed(1)}% below`} the industry average of ${industryBenchmarks.engagementRate}%.`,
        `Profile visits: ${instagramData.accountInsights?.profile_visits?.toLocaleString() || 'N/A'} in the last 30 days. ${(instagramData.accountInsights?.profile_visits || 0) > 1000 ? 'Strong discovery performance!' : 'Room for improvement in discoverability.'}`
        ],
        actions: [
        bestContentType ? `Focus on ${bestContentType.type.toLowerCase()}s - they get ${bestContentType.avgEngagement} avg engagement vs your overall ${instagramData.avgLikes} avg` : "Analyze your best performing content types",
        timingData.timeSlots.length > 0 ? `Post during your peak time: ${timingData.timeSlots[0].time} (${timingData.timeSlots[0].avgLikes} avg likes)` : "Experiment with different posting times",
        isAboveAverage ? "Maintain your above-average engagement with consistent quality content" : "Focus on increasing engagement rate with more interactive content"
        ]
      },
      engagement: {
        title: "Engagement Optimization Analysis",
        insights: [
        `Your posts average ${instagramData.avgLikes} likes and ${(instagramData.avgComments ?? 0)} comments. Engagement is ${engagementTrend.trend} by ${engagementTrend.percentage}% over time.`,
        bestContentType ? `${bestContentType.type}s are your strongest format with ${bestContentType.engagementRate} engagement rate (${bestContentType.count} posts analyzed).` : "Analyzing your content performance patterns.",
        `Your audience is most active during ${timingData.timeSlots[0]?.time || 'evening hours'}. ${timingData.timeSlots.length} optimal time slots identified.`
        ],
        actions: [
        bestContentType && worstContentType && contentTypes.length > 1 ? 
          `Double down on ${bestContentType.type.toLowerCase()}s (${bestContentType.avgEngagement} avg engagement) and improve your ${worstContentType.type.toLowerCase()}s (${worstContentType.avgEngagement} avg)` : 
          "Continue creating your best performing content types",
        `Post during your top 3 time slots: ${timingData.timeSlots.slice(0, 3).map(slot => slot.time).join(', ')}`,
        (instagramData.avgComments ?? 0) < (instagramData.avgLikes ?? 0) * 0.1 ? 
          "Increase comments by asking questions in captions - your comment rate is below optimal" : 
          "Maintain strong comment engagement with interactive captions"
        ]
      },
      timing: {
        title: "Optimal Timing Strategy",
        insights: [
        `Analysis of ${instagramData.recentPosts.length} posts shows your best performing time is ${timingData.timeSlots[0]?.time} with ${timingData.timeSlots[0]?.avgLikes} average likes.`,
        `You've tested ${timingData.timeSlots.length} different time slots. Your top 3 slots outperform others by an average of ${timingData.timeSlots.length > 2 ? Math.round(((timingData.timeSlots[0]?.avgLikes + timingData.timeSlots[1]?.avgLikes + timingData.timeSlots[2]?.avgLikes) / 3 - (instagramData.avgLikes || 0)) / (instagramData.avgLikes || 1) * 100) : 25}%.`,
        `Consistency analysis: ${frequencyData.currentFrequency < 2 ? 'Post more regularly for algorithm favor' : frequencyData.currentFrequency > 5 ? 'Consider reducing frequency to avoid audience fatigue' : 'Good posting consistency'}.`
        ],
        actions: [
        `Schedule posts for ${timingData.timeSlots[0]?.time} - your highest engagement window`,
        timingData.timeSlots.length > 1 ? `Alternate between your top ${Math.min(3, timingData.timeSlots.length)} time slots for optimal reach` : "Test 2-3 additional time slots to find more opportunities",
        `Avoid posting during low-performance hours to maximize your content's potential reach`
        ]
      },
      frequency: {
        title: "Posting Frequency Optimization",
        insights: [
        `Current frequency: ${frequencyData.currentFrequency} posts/week. Optimal frequency for your audience: ${frequencyData.optimalFrequency} posts/week.`,
        `Your best performing frequency range is ${frequencyData.performanceByFrequency[0]?.range} with ${frequencyData.performanceByFrequency[0]?.avgEngagement} average engagement.`,
        frequencyData.currentFrequency < frequencyData.optimalFrequency ? 
          `You're under-posting by ${(frequencyData.optimalFrequency - frequencyData.currentFrequency).toFixed(1)} posts/week, potentially missing ${Math.round((frequencyData.optimalFrequency - frequencyData.currentFrequency) * 52)} opportunities per year.` :
          frequencyData.currentFrequency > frequencyData.optimalFrequency ? 
          `You may be over-posting. Reducing to ${frequencyData.optimalFrequency}/week could improve individual post performance.` :
          `Your current frequency aligns well with optimal performance.`
        ],
        actions: [
        frequencyData.currentFrequency !== frequencyData.optimalFrequency ? 
          `Adjust to ${frequencyData.optimalFrequency} posts per week for optimal audience engagement` : 
          "Maintain your current posting frequency",
        `Focus on the ${frequencyData.performanceByFrequency[0]?.range} range - your highest performing frequency`,
        "Plan content in advance to maintain consistency and quality at your optimal frequency"
        ]
      },
      content: {
        title: "Content Performance Intelligence",
        insights: [
        bestContentType ? 
          `${bestContentType.type}s are your top format: ${bestContentType.avgEngagement} avg engagement (${bestContentType.count} posts), ${bestContentType.engagementRate} engagement rate.` :
          "Analyzing your content format performance.",
        contentTypes.length > 1 ? 
          `Performance gap: ${bestContentType.type}s outperform ${worstContentType.type}s by ${Math.round((bestContentType.avgEngagement - worstContentType.avgEngagement) / (worstContentType.avgEngagement || 1) * 100)}%.` :
          "Need more diverse content types for comprehensive analysis.",
        `Your content reaches an average of ${instagramData.avgReach?.toLocaleString() || 'N/A'} people per post. ${(instagramData.avgReach || 0) > (instagramData.followers * 0.1) ? 'Strong reach performance!' : 'Opportunity to improve reach.'}`
        ],
        actions: [
        bestContentType ? 
          `Create more ${bestContentType.type.toLowerCase()}s - they generate ${bestContentType.avgEngagement} avg engagement vs your ${instagramData.avgLikes} overall average` :
          "Test different content formats to find your best performers",
        contentTypes.length > 1 && worstContentType ? 
          `Improve your ${worstContentType.type.toLowerCase()} strategy - currently averaging only ${worstContentType.avgEngagement} engagement` :
          "Experiment with carousels, reels, and single posts to diversify",
        `${(instagramData.avgComments ?? 0) < 20 ? 'Increase comment engagement with questions and polls' : 'Maintain strong comment engagement'} - comments boost algorithmic reach`
        ]
      },
      reach: {
        title: "Audience Reach Analysis",
        insights: [
        `Your posts reach an average of ${instagramData.avgReach?.toLocaleString() || 'calculating'} people (${instagramData.avgReach ? ((instagramData.avgReach / instagramData.followers) * 100).toFixed(1) : 'N/A'}% of your followers).`,
        `Total reach in the last 30 days: ${instagramData.accountInsights?.reach ? (instagramData.accountInsights.reach / 1000).toFixed(1) + 'K' : 'N/A'}. ${(instagramData.accountInsights?.reach || 0) > instagramData.followers * 2 ? 'Excellent reach performance!' : 'Room to improve reach.'}`,
        bestContentType ? 
          `${bestContentType.type}s achieve the best reach with ${bestContentType.avgReach.toLocaleString()} average reach per post.` :
          "Analyzing which content types achieve the best reach."
        ],
        actions: [
        bestContentType ? 
          `Focus on ${bestContentType.type.toLowerCase()}s for maximum reach - they average ${bestContentType.avgReach.toLocaleString()} vs your overall ${instagramData.avgReach?.toLocaleString() || 'average'}` :
          "Test different content formats to maximize reach",
        `Post during peak engagement times (${timingData.timeSlots.slice(0, 2).map(slot => slot.time).join(' and ')}) to boost reach`,
        `${(instagramData.accountInsights?.reach || 0) < instagramData.followers ? 'Use trending hashtags and engaging captions to expand beyond your follower base' : 'Continue leveraging your strong reach performance'}`
        ]
      }
    };

      return recommendations[selectedMetric] || recommendations.growth;
    };

    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="bg-white/95 backdrop-blur-sm border-b border-indigo-200/50 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
            </div>
            {chatStep > 1 && (
              <button 
                onClick={resetChat} 
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                New Chat
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
                  <span className="font-semibold text-gray-900">Hi there!</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  I'm your AI insights assistant. I'll analyze your Instagram data and provide personalized recommendations to help you grow your social media presence.
                </p>
              </div>
            </div>
          </div>

          {/* Chat Steps */}
          <div className="space-y-4">
            
            {/* Step 1: Metric Selection */}
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm font-bold">AI</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-semibold text-gray-900">What would you like to improve?</span>
                </div>
                
                {chatStep === 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    {metricOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleMetricSelect(option.value)}
                        className="text-left p-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                      >
                        <div className="font-medium text-gray-900 text-sm group-hover:text-indigo-700">
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 group-hover:text-indigo-600">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {chatStep > 1 && (
                  <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <span className="text-indigo-600 text-sm">✓</span>
                    <span className="text-sm text-indigo-700 font-medium">
                      {metricOptions.find(opt => opt.value === selectedMetric)?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Response */}
            {chatStep > 1 && (
              <div className="flex justify-end mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-xs">
                  <p className="text-sm font-medium">
                    {metricOptions.find(opt => opt.value === selectedMetric)?.label}
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Account Selection */}
            {chatStep >= 2 && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">📱</span>
                    <span className="font-semibold text-gray-900">Which account should I analyze?</span>
                  </div>
                  
                  {chatStep === 2 && (
                    <div className="space-y-2">
                      {connectedAccounts.map((account, index) => (
                        <button
                          key={index}
                          onClick={() => account.connected ? handleAccountSelect(account) : null}
                          disabled={!account.connected}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            account.connected 
                              ? 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 group' 
                              : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${account.color} rounded-full flex items-center justify-center shadow-sm`}>
                              <span className="text-white text-xs font-bold">
                                {account.platform === 'Instagram' ? 'IG' : 
                                 account.platform === 'Twitter/X' ? 'X' : 'IN'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${account.connected ? 'text-gray-900 group-hover:text-indigo-700' : 'text-gray-500'}`}>
                                {account.platform}
                              </div>
                              <div className={`text-xs ${account.connected ? 'text-gray-600 group-hover:text-indigo-600' : 'text-gray-400'}`}>
                                {account.username}
                              </div>
                            </div>
                            {account.connected && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                            {!account.connected && (
                              <div className="text-xs text-gray-400">Not connected</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {chatStep > 2 && (
                    <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                      <span className="text-indigo-600 text-sm">✓</span>
                      <span className="text-sm text-indigo-700 font-medium">
                        {typeof selectedAccount === 'object' && selectedAccount.platform} ({typeof selectedAccount === 'object' && selectedAccount.username})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Response 2 */}
            {chatStep > 2 && (
              <div className="flex justify-end mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-xs">
                  <p className="text-sm font-medium">
                    {typeof selectedAccount === 'object' && selectedAccount.platform}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Analysis */}
            {chatStep === 3 && isAnalyzing && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    <div>
                      <p className="text-gray-800 text-sm font-medium">Analyzing your data...</p>
                      <p className="text-gray-600 text-xs mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Results */}
            {chatStep === 4 && (
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm font-bold">AI</span>
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-indigo-100 flex-1">
                  {(() => {
                    const recs = getAIRecommendations();
                    return (
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="text-lg">🎉</span>
                          <h3 className="font-bold text-gray-900 text-lg">{recs.title}</h3>
                        </div>
                        
                        {/* Key Insights */}
                        <div className="mb-6">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-base">📊</span>
                            <h4 className="font-semibold text-gray-800">Key Insights</h4>
                          </div>
                          <div className="space-y-3">
                            {recs.insights.map((insight, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <p className="text-sm text-blue-800 leading-relaxed">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Steps */}
                        <div className="mb-6">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-base">🚀</span>
                            <h4 className="font-semibold text-gray-800">Action Steps</h4>
                          </div>
                          <div className="space-y-3">
                            {recs.actions.map((action, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                                <p className="text-sm text-green-800 leading-relaxed">{action}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={resetChat}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 px-4 font-medium text-sm shadow-sm hover:shadow-md transition-all"
                          >
                            New Analysis
                          </button>
                          <button className="bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl py-3 px-4 font-medium text-sm hover:bg-indigo-50 transition-all">
                            Export Report
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

          </div>

          {/* Quick Actions (Always visible at bottom) */}
          <div className="mt-8 pt-6 border-t border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Insights</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  setSelectedMetric('growth');
                  setChatStep(2);
                }}
                className="p-3 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all text-left"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-green-500">🚀</span>
                  <span className="font-medium text-gray-900 text-sm">Growth Tips</span>
                </div>
                <p className="text-xs text-gray-600">Boost your followers</p>
              </button>
              
              <button 
                onClick={() => {
                  setSelectedMetric('timing');
                  setChatStep(2);
                }}
                className="p-3 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all text-left"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-purple-500">⏰</span>
                  <span className="font-medium text-gray-900 text-sm">Best Times</span>
                </div>
                <p className="text-xs text-gray-600">When to post</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const NotificationsContent = () => {
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
              <div key={index} className={`p-4 ${notification.bg} hover:bg-opacity-80 transition-colors`}>
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
            ))}
          </div>
        )}
      </div>
    );
  };

  const ProfileContent = () => {
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showHelpSupport, setShowHelpSupport] = useState(false);
    const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);

    // Handler for Instagram connect/disconnect
    const handleInstagramAuth = async () => {
      if (instagramData) {
        // Disconnect Instagram
        if (isDisconnectingInstagram) return; // Prevent double clicks
        
        setIsDisconnectingInstagram(true);
        try {
          // Simulate disconnect
          await new Promise(resolve => setTimeout(resolve, 1000));
          setInstagramData(null);
          alert('Instagram account disconnected successfully!');
        } catch (error) {
          console.error('❌ Failed to disconnect Instagram:', error);
          alert('Failed to disconnect Instagram. Please try again.');
        } finally {
          setIsDisconnectingInstagram(false);
        }
      } else {
        // Connect Instagram
        try {
          // Simulate connect
          alert('In a real app, this would redirect to Instagram OAuth!');
        } catch (error) {
          console.error('❌ Failed to start Instagram connection:', error);
          alert('Failed to connect Instagram. Please try again.');
        }
      }
    };

    const PrivacyPolicyModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Privacy Policy</h2>
            <button 
              onClick={() => setShowPrivacyPolicy(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Information We Collect</h3>
              <p>SocialSage collects data from your connected social media accounts to provide analytics and insights. This includes posts, engagement metrics, and follower data.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How We Use Your Data</h3>
              <p>We use your data to generate analytics, provide insights, and help you optimize your social media performance. Your data is never shared with third parties.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Data Security</h3>
              <p>All data is encrypted and stored securely. We follow industry best practices to protect your information.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Account Deletion</h3>
              <p>You can delete your account and all associated data at any time through the settings menu.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
              <p>If you have questions about this privacy policy, please contact us at privacy@socialsage.app</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowPrivacyPolicy(false)}
            className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    );

    const AboutModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">About SocialSage</h2>
            <button 
              onClick={() => setShowAbout(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
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
          
          <button 
            onClick={() => setShowAbout(false)}
            className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    );

    const HelpSupportModal = () => (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
            <button 
              onClick={() => setShowHelpSupport(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
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
          
          <button 
            onClick={() => setShowHelpSupport(false)}
            className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-all"
          >
            Got It
          </button>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
        
        <div className="p-4 space-y-4">
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

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Accounts</h3>
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

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              {[
                { name: 'Notifications', clickable: false },
                { name: 'Privacy', clickable: true, action: () => setShowPrivacyPolicy(true) },
                { name: 'Billing', clickable: false },
                { name: 'Help & Support', clickable: true, action: () => setShowHelpSupport(true) },
                { name: 'About', clickable: true, action: () => setShowAbout(true) }
              ].map((setting) => (
                <button
                  key={setting.name}
                  onClick={setting.clickable ? setting.action : undefined}
                  className={`w-full flex items-center justify-between py-2 ${
                    setting.clickable ? 'hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''
                  }`}
                  disabled={!setting.clickable}
                >
                  <span className={`text-gray-700 ${setting.clickable ? 'text-blue-600' : ''}`}>
                    {setting.name}
                  </span>
                  <div className={`${setting.clickable ? 'text-blue-400' : 'text-gray-400'}`}>›</div>
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Instagram Data Status */}
          {instagramData && (
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
          )}

          {dataError && (
            <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                Data Connection Issue
              </h3>
              <p className="text-red-700 text-sm">{dataError}</p>
            </div>
          )}
        </div>

        {showPrivacyPolicy && <PrivacyPolicyModal />}
        {showAbout && <AboutModal />}
        {showHelpSupport && <HelpSupportModal />}
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
        return <ProfileContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">

      {renderContent()}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50 safe-area-bottom">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard' },
          { id: 'posts', icon: BarChart3, label: 'Posts' },
          { id: 'insights', icon: TrendingUp, label: 'AI Insights' },
          { id: 'notifications', icon: Bell, label: 'Notifications' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialSageMobile;