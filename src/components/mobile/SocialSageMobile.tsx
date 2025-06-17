import React, { useState, useEffect } from 'react';
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

type TimeFrame = 'weekly' | 'monthly' | 'annual';
type PostsTimeFrame = 'weekly' | 'monthly' | 'annual';
type Performance = 'high' | 'medium' | 'low';
type Status = 'excellent' | 'strong' | 'opportunity' | 'normal';

const SocialSageMobile = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string | null>(null);
  
  // Real Instagram data state
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Replace the original useEffect that fetches Instagram data with this updated version
  useEffect(() => {
    const fetchInstagramData = async () => {
      console.log('🚀 SocialSage: Starting to fetch Instagram data...');
      try {
        console.log('📡 SocialSage: Calling /api/instagram/metrics...');
        const response = await fetch('/api/instagram/metrics');
        console.log('📊 SocialSage: API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 SocialSage: Instagram API Response:', data);
          console.log('📱 SocialSage: Recent Posts:', data.recentPosts);
          console.log('📈 SocialSage: Posts count:', data.recentPosts?.length || 0);
          console.log('🔍 SocialSage: First post structure:', data.recentPosts?.[0]);
          console.log('👥 SocialSage: Top Followers:', data.topFollowers);
          console.log('🎯 SocialSage: Real insights available:', {
            hasReach: data.recentPosts?.[0]?.reach > 0,
            hasImpressions: data.recentPosts?.[0]?.impressions > 0,
            hasProfileVisits: data.accountInsights?.profile_visits > 0,
            totalReach: data.totalReach,
            avgReach: data.avgReach,
            topFollowersCount: data.topFollowers?.length || 0
          });
          setInstagramData(data);
          setDataError(null);
        } else {
          const error = await response.json();
          console.error('❌ SocialSage: API Error:', error);
          setDataError(error.error || 'Failed to fetch Instagram data');
        }
      } catch (error) {
        console.error('❌ SocialSage: Failed to fetch Instagram data:', error);
        setDataError('Network error while fetching data');
      } finally {
        setIsLoadingData(false);
      }
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

  // Helper function to calculate reach from real data or estimate
  const calculateReach = (post: InstagramPost) => {
    if (post.reach) {
      if (post.reach >= 1000) {
        return `${(post.reach / 1000).toFixed(1)}K`;
      }
      return post.reach.toString();
    }
    
    const estimatedReach = (post.like_count + post.comments_count * 10) * 1.5;
    if (estimatedReach >= 1000) {
      return `${(estimatedReach / 1000).toFixed(1)}K`;
    }
    return estimatedReach.toString();
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
            name: 'Follower Growth Rate', 
            value: instagramData?.growthRate || '+8.2%', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Total Followers', 
            value: instagramData?.followers?.toLocaleString() || '12.4K', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Profile Visits', 
            value: instagramData?.accountInsights?.profile_visits?.toLocaleString() || '1.2K', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Reach', 
            value: instagramData?.accountInsights?.reach ? `${(instagramData.accountInsights.reach / 1000).toFixed(1)}K` : '15.3K', 
            trend: 'up' as 'up' 
          },
          { 
            name: 'Impressions', 
            value: instagramData?.accountInsights?.impressions ? `${(instagramData.accountInsights.impressions / 1000).toFixed(1)}K` : '45.7K', 
            trend: 'up' as 'up' 
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
        metrics: [
          { name: 'Reels vs Posts', value: 'Reels +67%', trend: 'up' as 'up' },
          { name: 'Carousel Performance', value: '+23%', trend: 'up' as 'up' },
          { name: 'Story Engagement', value: '+15%', trend: 'up' as 'up' },
          { name: 'Tutorial Content', value: '+89%', trend: 'up' as 'up' },
          { name: 'Behind-the-scenes', value: '+34%', trend: 'up' as 'up' }
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
            { name: 'Sarah Chen (@sarahdesigns)', value: '47 interactions', trend: 'up' as 'up' },
            { name: 'Mike Rodriguez (@mikecodes)', value: '32 interactions', trend: 'up' as 'up' },
            { name: 'Emma Wilson (@emmawrites)', value: '28 interactions', trend: 'up' as 'up' },
            { name: 'Alex Kumar (@alextech)', value: '24 interactions', trend: 'up' as 'up' },
            { name: 'Luna Martinez (@lunacreatex)', value: '19 interactions', trend: 'up' as 'up' }
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
          // Fallback demo data
          return [
            {
              type: 'Reel',
              emoji: '🎬',
              count: 8,
              avgLikes: 420,
              avgComments: 28,
              avgReach: 1850,
              avgShares: 12,
              engagementRate: '5.8%',
              color: 'from-purple-500 to-pink-500',
              bgColor: 'from-purple-50 to-pink-50',
              borderColor: 'border-purple-200'
            },
            {
              type: 'Carousel',
              emoji: '📸',
              count: 5,
              avgLikes: 380,
              avgComments: 22,
              avgReach: 1650,
              avgShares: 8,
              engagementRate: '4.9%',
              color: 'from-blue-500 to-indigo-500',
              bgColor: 'from-blue-50 to-indigo-50',
              borderColor: 'border-blue-200'
            },
            {
              type: 'Post',
              emoji: '📝',
              count: 12,
              avgLikes: 295,
              avgComments: 15,
              avgReach: 1200,
              avgShares: 5,
              engagementRate: '3.8%',
              color: 'from-green-500 to-emerald-500',
              bgColor: 'from-green-50 to-emerald-50',
              borderColor: 'border-green-200'
            }
          ];
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-teal-50 to-cyan-50">
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

            {/* Content Strategy Recommendations */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">💡</span>
                Key Insights
              </h3>
              
              <div className="space-y-3">
                {contentTypes.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🏆</span>
                      </div>
                      <span className="font-medium text-green-800">Top Performer</span>
                    </div>
                    <p className="text-sm text-green-700">
                      <strong>{contentTypes[0].type}s</strong> are your best content format with {contentTypes[0].engagementRate} engagement rate and {contentTypes[0].avgLikes} average likes.
                    </p>
                  </div>
                )}

                {contentTypes.length > 1 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">📈</span>
                      </div>
                      <span className="font-medium text-blue-800">Growth Opportunity</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Consider creating more <strong>{contentTypes[0].type}s</strong> - they get {Math.round(((contentTypes[0].avgLikes - contentTypes[contentTypes.length - 1].avgLikes) / contentTypes[contentTypes.length - 1].avgLikes) * 100)}% more likes than your lowest performing format.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🎯</span>
                    </div>
                    <span className="font-medium text-purple-800">Content Mix</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    You've posted {instagramData?.recentPosts?.length || contentTypes.reduce((sum, type) => sum + type.count, 0)} pieces of content. Focus on your top-performing formats for maximum engagement.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-teal-50 rounded-2xl p-4">
              <h3 className="font-semibold text-teal-900 mb-2">🤖 AI Recommendations</h3>
              <div className="space-y-2 text-sm">
                {contentTypes.length > 0 && (
                  <>
                    <p className="text-teal-800">
                      • <strong>{contentTypes[0].type}s</strong> are your strongest content format - create more of these
                    </p>
                    <p className="text-teal-800">
                      • Your {contentTypes[0].type.toLowerCase()}s average <strong>{contentTypes[0].avgLikes} likes</strong> and <strong>{contentTypes[0].avgComments} comments</strong>
                    </p>
                    {contentTypes.length > 1 && (
                      <p className="text-teal-800">
                        • Consider experimenting with different approaches for <strong>{contentTypes[contentTypes.length - 1].type}s</strong> to improve their {contentTypes[contentTypes.length - 1].engagementRate} engagement rate
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-purple-50 to-pink-50">
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

                {/* AI Recommendations */}
                <div className="mt-6 bg-purple-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">💡 AI Recommendations</h3>
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-orange-50 to-red-50">
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

                {/* Consistency Score */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="mr-2">🎯</span>
                    Consistency Score
                  </h3>
                  
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-4 rounded-full transition-all duration-700 ${
                          frequencyData.consistencyScore >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                          frequencyData.consistencyScore >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${frequencyData.consistencyScore}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-bold text-gray-900">{frequencyData.consistencyScore}%</div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {frequencyData.consistencyScore >= 80 ? 'Excellent! You post very consistently.' :
                     frequencyData.consistencyScore >= 60 ? 'Good consistency, but room for improvement.' :
                     'Try to post more regularly for better engagement.'}
                  </p>
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

                {/* AI Recommendations */}
                <div className="mt-6 bg-orange-50 rounded-2xl p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">💡 AI Recommendations</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-orange-800">
                      • Your optimal posting frequency is <strong>{frequencyData.optimalFrequency} posts per week</strong>
                    </p>
                    <p className="text-orange-800">
                      • Best performing frequency range: <strong>{frequencyData.performanceByFrequency[0]?.range}</strong>
                    </p>
                    <p className="text-orange-800">
                      • Consistency score: {frequencyData.consistencyScore}% - {frequencyData.consistencyScore >= 70 ? 'keep it up!' : 'try posting more regularly'}
                    </p>
                    {frequencyData.currentFrequency < frequencyData.optimalFrequency && (
                      <p className="text-orange-800">
                        • Consider increasing to {frequencyData.optimalFrequency} posts/week for better engagement
                      </p>
                    )}
                  </div>
                </div>
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
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-violet-50 to-purple-50">
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
      return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-emerald-50 to-teal-50">
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">Your Growth Journey</h2>
              <p className="text-emerald-800 text-sm">
                Track your follower growth and profile performance across all metrics.
              </p>
            </div>

            {/* Main Growth Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {instagramData?.followers?.toLocaleString() || '12.4K'}
                </div>
                <div className="text-sm text-gray-600 mb-2">Total Followers</div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">
                    {instagramData?.growthRate || '+8.2%'} growth
                  </span>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {instagramData?.accountInsights?.profile_visits?.toLocaleString() || '1.2K'}
                </div>
                <div className="text-sm text-gray-600 mb-2">Profile Visits</div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-blue-600 font-medium">Last 30 days</span>
                </div>
              </div>
            </div>

            {/* Reach & Impressions Visual */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📈</span>
                Reach & Impressions
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Reach</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {instagramData?.accountInsights?.reach ? `${(instagramData.accountInsights.reach / 1000).toFixed(1)}K` : '15.3K'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-700" style={{width: '75%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">75% of your follower base reached</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Impressions</span>
                    <span className="text-lg font-bold text-blue-600">
                      {instagramData?.accountInsights?.impressions ? `${(instagramData.accountInsights.impressions / 1000).toFixed(1)}K` : '45.7K'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-3 rounded-full transition-all duration-700" style={{width: '85%'}}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">3.6x reach through multiple views</div>
                </div>
              </div>
            </div>

            {/* Growth Rate Visualization */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Growth Rate Breakdown
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {instagramData?.growthRate || '+8.2%'}
                </div>
                <div className="text-sm text-gray-600">Weekly Growth Rate</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Above Industry Average</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+5.7%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">↗</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Consistent Growth</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">4 weeks</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-emerald-50 rounded-2xl p-4">
              <h3 className="font-semibold text-emerald-900 mb-2">💡 Growth Insights</h3>
              <div className="space-y-2 text-sm">
                <p className="text-emerald-800">
                  • Your growth rate is <strong>{instagramData?.growthRate || '8.2%'}</strong> above industry average
                </p>
                <p className="text-emerald-800">
                  • Profile visits increased <strong>24%</strong> this month - your bio optimization is working
                </p>
                <p className="text-emerald-800">
                  • Reach is <strong>75%</strong> of your follower count - excellent visibility
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (category.id === 'engagement') {
      return (
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-blue-50 to-purple-50">
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
              <h2 className="text-lg font-bold text-gray-900 mb-2">Audience Interaction</h2>
              <p className="text-blue-800 text-sm">
                Measure how actively your audience engages with your content.
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
                      50 + 50 * Math.cos((parseFloat(instagramData?.engagementRate?.replace('%', '') || '4.2') / 10) * 2 * Math.PI - Math.PI/2)
                    }% ${
                      50 - 50 * Math.sin((parseFloat(instagramData?.engagementRate?.replace('%', '') || '4.2') / 10) * 2 * Math.PI - Math.PI/2)
                    }%, 50% 50%)`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {instagramData?.engagementRate || '4.2%'}
                    </div>
                    <div className="text-xs text-gray-600">Engagement</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-1 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Above average (3.5%)</span>
              </div>
            </div>

            {/* Engagement Breakdown */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Engagement Breakdown
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Likes per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {instagramData?.avgLikes?.toString() || '342'}
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
                      {instagramData?.avgComments?.toString() || '18.5'}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Share className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Reach per Post</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {instagramData?.avgReach ? instagramData.avgReach.toLocaleString() : '1.2K'}
                    </div>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Quality Score */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⭐</span>
                Engagement Quality
              </h3>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">8.7</div>
                  <div className="text-xs text-gray-600">Like Quality</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">9.2</div>
                  <div className="text-xs text-gray-600">Comment Quality</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">7.8</div>
                  <div className="text-xs text-gray-600">Share Rate</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-sm font-medium text-gray-900 mb-1">Overall Quality Score</div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-lg font-bold text-purple-600">8.5/10</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Engagement Insights</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-800">
                  • Your engagement rate <strong>{instagramData?.engagementRate || '4.2%'}</strong> is above industry average
                </p>
                <p className="text-blue-800">
                  • Comments drive higher quality engagement - ask more questions in captions
                </p>
                <p className="text-blue-800">
                  • Your reach per post averages <strong>{instagramData?.avgReach?.toLocaleString() || '1,200'}</strong> people
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular metric detail view for other categories
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
            <h3 className="font-semibold text-blue-900 mb-2">💡 AI Insights</h3>
            <p className="text-blue-800 text-sm">
              {category.id === 'growth' && `Your follower growth is ${instagramData ? 'performing well' : 'accelerating'}! ${instagramData ? `You have ${instagramData.followers.toLocaleString()} followers with ${instagramData?.accountInsights?.profile_visits?.toLocaleString() || 'N/A'} profile visits in the last 30 days.` : 'Profile visits increased 24% after implementing story highlights.'}`}
              {category.id === 'engagement' && `Your engagement rate is ${instagramData?.engagementRate || '4.2%'}. ${instagramData?.avgReach ? `Your posts reach an average of ${instagramData.avgReach.toLocaleString()} people.` : 'Comments are driving higher engagement rates.'} Consider asking more questions in your captions.`}
              {category.id === 'content' && "Tutorial Reels are your top performer with 89% higher engagement. Carousels work great for educational content, while behind-the-scenes posts build authentic connections."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Data for different time periods using real data
  const getMetrics = (period: TimeFrame): Metrics => {
    if (instagramData) {
      const estimatedWeeklyReach = (instagramData.totalReach && instagramData.totalReach > 0) ? 
        instagramData.totalReach.toLocaleString() :
        Math.round(instagramData.followers * 0.15).toLocaleString();
        
      const estimatedMonthlyReach = (instagramData.totalReach && instagramData.totalReach > 0) ?
        (instagramData.totalReach * 4.33).toLocaleString() :
        Math.round(instagramData.followers * 2.8).toLocaleString();
        
      return {
        weekly: {
          growth: instagramData.growthRate,
          engagement: instagramData.engagementRate,
          reach: estimatedWeeklyReach,
          timeLabel: 'This Week'
        },
        monthly: {
          growth: instagramData.monthlyGrowth || instagramData.growthRate,
          engagement: instagramData.engagementRate,
          reach: instagramData.monthlyReach || estimatedMonthlyReach,
          timeLabel: 'This Month'
        },
        annual: {
          growth: '+187%',
          engagement: instagramData.engagementRate,
          reach: Math.round(instagramData.followers * 35).toLocaleString(),
          timeLabel: 'This Year'
        }
      }[period];
    }

    const data: Record<TimeFrame, Metrics> = {
      weekly: {
        growth: '+8.2%',
        engagement: '+24%',
        reach: '15.3K',
        timeLabel: 'This Week'
      },
      monthly: {
        growth: '+31.5%',
        engagement: '+18%',
        reach: '68.7K',
        timeLabel: 'This Month'
      },
      annual: {
        growth: '+187%',
        engagement: '+45%',
        reach: '892K',
        timeLabel: 'This Year'
      }
    };
    return data[period];
  };

  const DashboardContent = () => {
    const metrics = getMetrics(timeFrame);
    
    if (selectedMetricCategory) {
      const category = metricCategories.find(cat => cat.id === selectedMetricCategory);
      if (!category) return null;
      return <MetricDetailView category={category} />;
    }
    
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50/30">
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-900">SocialSage</h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => window.location.href = '/logout'} 
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
              { key: 'monthly' as TimeFrame, label: 'Monthly' },
              { key: 'annual' as TimeFrame, label: 'Annual' }
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
                {instagramData ? instagramData.followers.toLocaleString() : '12.4K'}
              </div>
              <div className="text-xs text-gray-600">Total Followers</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
              <div className="text-xl font-bold text-emerald-600">{metrics.growth}</div>
              <div className="text-xs text-gray-600">Growth Rate</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
              <div className="text-xl font-bold text-purple-600">{metrics.engagement}</div>
              <div className="text-xs text-gray-600">Engagement</div>
            </div>
            <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20">
              <div className="text-xl font-bold text-orange-600">
                {(() => {
                  console.log('🔍 Dashboard Reach Debug:', {
                    avgReach: instagramData?.avgReach,
                    totalReach: instagramData?.totalReach,
                    postsCount: instagramData?.recentPosts?.length,
                    fallbackReach: metrics.reach,
                    followers: instagramData?.followers
                  });
                  
                  if (instagramData?.avgReach && instagramData.avgReach > 0) {
                    if (instagramData.avgReach === instagramData.followers) {
                      console.warn('⚠️ Avg reach equals follower count - this seems wrong, using fallback');
                      return metrics.reach;
                    }
                    return instagramData.avgReach >= 1000 ? 
                      `${(instagramData.avgReach / 1000).toFixed(1)}K` : 
                      instagramData.avgReach.toString();
                  }
                  
                  if (instagramData?.totalReach && instagramData?.recentPosts?.length) {
                    const calculatedAvg = Math.round(instagramData.totalReach / instagramData.recentPosts.length);
                    console.log('📊 Calculated avg reach from total:', calculatedAvg);
                    if (calculatedAvg !== instagramData.followers) {
                      return calculatedAvg >= 1000 ? 
                        `${(calculatedAvg / 1000).toFixed(1)}K` : 
                        calculatedAvg.toString();
                    }
                  }
                  
                  return metrics.reach;
                })()}
              </div>
              <div className="text-xs text-gray-600">
                {instagramData?.avgReach ? 'Avg Reach' : 'Reach'} {metrics.timeLabel}
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

    // Use real posts data if available, otherwise fallback to demo data
    const recentPosts: Post[] = instagramData?.recentPosts?.slice(0, 10).map((post, index) => {
      const avgLikes = instagramData.avgLikes || 342;
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
          shares: post.website_clicks || Math.floor(Math.random() * 50),
          reach: calculateReach(post)
        },
        performance: getPerformanceLevel(post.like_count || 0, avgLikes),
        caption: post.caption
      };
    }) || [
      {
        id: 1,
        platform: 'Instagram',
        type: 'Reel',
        title: 'Social Media Tips for 2025',
        timestamp: '2h ago',
        thumbnail: 'from-blue-400 to-purple-500',
        metrics: { likes: 1247, comments: 89, shares: 34, reach: '5.2K' },
        performance: 'high'
      },
      {
        id: 2,
        platform: 'Instagram',
        type: 'Carousel',
        title: 'Behind the Scenes: Content Creation',
        timestamp: '5h ago',
        thumbnail: 'from-pink-400 to-red-500',
        metrics: { likes: 892, comments: 56, shares: 12, reach: '3.8K' },
        performance: 'medium'
      },
      {
        id: 3,
        platform: 'Twitter/X',
        type: 'Post',
        title: 'Quick productivity hack thread',
        timestamp: '8h ago',
        thumbnail: 'from-gray-400 to-gray-600',
        metrics: { likes: 445, comments: 23, shares: 67, reach: '2.1K' },
        performance: 'medium'
      },
      {
        id: 4,
        platform: 'Instagram',
        type: 'Story',
        title: 'Morning routine poll',
        timestamp: '1d ago',
        thumbnail: 'from-green-400 to-teal-500',
        metrics: { likes: 234, comments: 45, shares: 8, reach: '1.9K' },
        performance: 'low'
      }
    ];

    const getTopPosts = (timeframe: PostsTimeFrame): TopPost[] => {
      if (instagramData?.recentPosts && instagramData.recentPosts.length > 0) {
        const sortedPosts = [...instagramData.recentPosts]
          .sort((a, b) => {
            const aReach = a.reach || (a.like_count + a.comments_count) * 10;
            const bReach = b.reach || (b.like_count + b.comments_count) * 10;
            return bReach - aReach;
          })
          .slice(0, 10);

        return sortedPosts.map((post, index) => ({
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
      }

      const posts: Record<PostsTimeFrame, TopPost[]> = {
        weekly: [
          { title: 'Social Media Tips for 2025', type: 'Reel', metrics: { likes: 1247, comments: 89, shares: 34, reach: '5.2K' }, performance: 'high' },
          { title: 'Content Creation Workflow', type: 'Carousel', metrics: { likes: 1089, comments: 76, shares: 28, reach: '4.8K' }, performance: 'high' },
          { title: 'Instagram Algorithm Secrets', type: 'Post', metrics: { likes: 934, comments: 65, shares: 21, reach: '4.1K' }, performance: 'high' },
          { title: 'Behind the Scenes Magic', type: 'Carousel', metrics: { likes: 823, comments: 54, shares: 19, reach: '3.7K' }, performance: 'high' },
          { title: 'Quick Photography Tips', type: 'Reel', metrics: { likes: 756, comments: 43, shares: 16, reach: '3.2K' }, performance: 'high' }
        ],
        monthly: [
          { title: 'Ultimate Social Media Guide', type: 'Carousel', metrics: { likes: 2341, comments: 156, shares: 67, reach: '12.4K' }, performance: 'high' },
          { title: 'Viral Content Strategy', type: 'Reel', metrics: { likes: 1987, comments: 123, shares: 54, reach: '9.8K' }, performance: 'high' },
          { title: 'Building Your Brand Online', type: 'Post', metrics: { likes: 1654, comments: 98, shares: 43, reach: '8.2K' }, performance: 'high' },
          { title: 'Photography Masterclass', type: 'Carousel', metrics: { likes: 1432, comments: 87, shares: 38, reach: '7.1K' }, performance: 'high' },
          { title: 'Content Planning Secrets', type: 'Reel', metrics: { likes: 1298, comments: 76, shares: 32, reach: '6.5K' }, performance: 'high' }
        ],
        annual: [
          { title: 'Year in Review: Top Moments', type: 'Carousel', metrics: { likes: 5432, comments: 287, shares: 156, reach: '28.9K' }, performance: 'high' },
          { title: 'Social Media Predictions 2025', type: 'Reel', metrics: { likes: 4321, comments: 234, shares: 124, reach: '24.1K' }, performance: 'high' },
          { title: 'Behind the Brand Documentary', type: 'Video', metrics: { likes: 3876, comments: 189, shares: 98, reach: '19.7K' }, performance: 'high' },
          { title: 'Best Content of 2024', type: 'Carousel', metrics: { likes: 3245, comments: 167, shares: 87, reach: '16.8K' }, performance: 'high' },
          { title: 'Growth Journey Story', type: 'Reel', metrics: { likes: 2987, comments: 143, shares: 76, reach: '15.2K' }, performance: 'high' }
        ]
      };
      return posts[timeframe];
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
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
              {recentPosts.map((post) => {
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
                    <div className="flex items-start space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${post.thumbnail} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-2xl">{getTypeEmoji(post.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
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
                        
                        <div className="grid grid-cols-4 gap-3 text-center">
                          <div className="bg-white/60 rounded-lg p-2">
                            <div className="text-sm font-bold text-gray-900">{post.metrics.likes.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">Likes</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2">
                            <div className="text-sm font-bold text-gray-900">{post.metrics.comments}</div>
                            <div className="text-xs text-gray-600">Comments</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2">
                            <div className="text-sm font-bold text-gray-900">{post.metrics.shares}</div>
                            <div className="text-xs text-gray-600">Shares</div>
                          </div>
                          <div className="bg-white/60 rounded-lg p-2">
                            <div className="text-sm font-bold text-gray-900">{post.metrics.reach}</div>
                            <div className="text-xs text-gray-600">Reach</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top Posts {postsTimeFrame === 'weekly' ? 'This Week' : postsTimeFrame === 'monthly' ? 'This Month' : 'This Year'}
                </h2>
                <div className="text-sm text-gray-500">Top 10</div>
              </div>
              {getTopPosts(postsTimeFrame).map((post, index) => (
                <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-2xl p-4 shadow-sm border hover:shadow-md transition-all">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
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
                      
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-sm font-bold text-gray-900">{post.metrics.likes.toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Likes</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-sm font-bold text-gray-900">{post.metrics.comments}</div>
                          <div className="text-xs text-gray-600">Comments</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-sm font-bold text-gray-900">{post.metrics.shares}</div>
                          <div className="text-xs text-gray-600">Shares</div>
                        </div>
                        <div className="bg-white/70 rounded-lg p-2">
                          <div className="text-sm font-bold text-gray-900">{post.metrics.reach}</div>
                          <div className="text-xs text-gray-600">Reach</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
      { platform: 'Instagram', username: instagramData?.username || '@socialsage_demo', connected: true, color: 'from-pink-500 to-orange-500' },
      { platform: 'Twitter/X', username: '@socialsage_demo', connected: true, color: 'from-gray-800 to-black' },
      { platform: 'LinkedIn', username: 'Social Sage Demo', connected: false, color: 'from-blue-600 to-blue-700' }
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
      const baseRecommendations: Record<string, AIRecommendation> = {
        growth: {
          title: "Boost Your Follower Growth",
          insights: [
            `You currently have ${instagramData?.followers?.toLocaleString() || '12,400'} followers. Your growth rate is ${instagramData?.growthRate || '+8.2%'}.`,
            "Stories get 3x more reach than posts. Create more behind-the-scenes content to increase discoverability.",
            "Post consistently at optimal times when your audience is most active."
          ],
          actions: [
            "Update your bio with a compelling hook and clear CTA",
            "Create 5 story highlights showcasing your best content",
            "Schedule posts for optimal times using our AI scheduler"
          ]
        },
        engagement: {
          title: "Increase Engagement Rate",
          insights: [
            `Your engagement rate is ${instagramData?.engagementRate || '4.2%'}, which is above industry average of 3.5%.`,
            `Your average likes per post: ${instagramData?.avgLikes || '342'}. Average comments: ${instagramData?.avgComments || '18'}.`,
            "Carousel posts have 45% higher engagement but you post them only 15% of the time."
          ],
          actions: [
            "Add engaging questions to every caption",
            "Create more carousel posts with tips and tutorials",
            "Respond to comments within 1 hour for algorithm boost"
          ]
        },
        timing: {
          title: "Optimize Your Posting Times",
          insights: [
            "Based on your posting history, we've identified your best performing time slots.",
            "Your top time slot gets significantly more engagement than average.",
            "Consistent posting during peak times can increase reach by 40%."
          ],
          actions: [
            "Post during your identified peak time slots",
            "Avoid posting during low-activity hours",
            "Use scheduling tools to maintain consistency"
          ]
        },
        frequency: {
          title: "Optimize Your Posting Frequency",
          insights: [
            `Your current posting frequency: ${instagramData ? calculateFrequencyOptimization(instagramData.recentPosts || []).currentFrequency : '2.5'} posts/week`,
            `Optimal frequency for your account: ${instagramData ? calculateFrequencyOptimization(instagramData.recentPosts || []).optimalFrequency : '3.5'} posts/week`,
            "Posting too frequently can decrease individual post performance."
          ],
          actions: [
            "Adjust to your optimal posting frequency",
            "Focus on quality over quantity",
            "Plan content calendar for consistent posting"
          ]
        }
      };
      return baseRecommendations[selectedMetric] || baseRecommendations.growth;
    };

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-50">
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
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
            className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
                <h2 className="text-lg font-bold text-gray-900">John Doe</h2>
                <p className="text-gray-600">Social Media Manager</p>
                <p className="text-sm text-gray-500">Premium Plan</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Accounts</h3>
            <div className="space-y-3">
              {[
                { platform: 'Instagram', connected: !!instagramData, color: 'bg-pink-500', username: instagramData?.username },
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
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    account.connected ? 'bg-green-100 text-green-800' : 
                    account.comingSoon ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {account.connected ? 'Connected' : 
                     account.comingSoon ? 'Coming Soon' : 'Connect'}
                  </div>
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
    <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <span>SocialSage</span>
        <span>100%</span>
      </div>

      {renderContent()}

      <div className="bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center safe-area-pb">
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