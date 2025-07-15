import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Home, BarChart3, Bell, User, Plus, TrendingUp, Users, Heart, MessageCircle, Bookmark, MoreHorizontal } from 'lucide-react';
import { AuthService } from '@/lib/auth'
import { useAnalytics, ClickTracker, ViewTracker } from '@/components/AnalyticsProvider'
import AccountDataManagement from '@/components/AccountDataManagement'

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

const SocialSageMobile = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('weekly');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string | null>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);
  
  // Real Instagram data state
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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

  // Fetch real Instagram data with tracking
  useEffect(() => {
    const fetchInstagramData = async () => {
      console.log('📡 SocialSage: Fetching Instagram data...');
      setIsLoadingData(true);
      
      // Track data fetch attempt
      trackEngagement('instagram_data_fetch_started')
      
      try {
        const response = await fetch('/api/instagram/metrics');
        console.log('📊 SocialSage: API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 SocialSage: Instagram API Response:', data);
          setInstagramData(data);
          setDataError(null);
          
          // Track successful data fetch
          trackEngagement('instagram_data_fetch_success', {
            followers: data.followers,
            posts_count: data.recentPosts?.length || 0,
            engagement_rate: data.engagementRate,
            has_insights: !!data.accountInsights
          })
          
          // Track Instagram connection status
          if (data.followers > 0) {
            trackEngagement('instagram_connected_detected', {
              follower_count: data.followers,
              account_type: data.followers < 1000 ? 'micro' : data.followers < 10000 ? 'small' : 'large'
            })
            
            // Complete Instagram onboarding funnel
            trackFunnel('instagram_onboarding', 'data_loaded', 3, true, {
              followers: data.followers
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
    };

    fetchInstagramData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchInstagramData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        title: 'Follower Growth',
        emoji: '🚀',
        description: 'See how your community is growing',
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
        title: 'Audience Engagement',
        emoji: '💬',
        description: 'See how much your audience loves your content',
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
    if (categoryId === 'timing') {
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

    // Enhanced metric detail view for Growth and Engagement categories
    if (category.id === 'growth') {
      const [growthTimeFrame, setGrowthTimeFrame] = useState<'weekly' | 'monthly'>('weekly');
      
      // Track growth timeframe changes
      const handleGrowthTimeFrameChange = (newTimeFrame: 'weekly' | 'monthly') => {
        setGrowthTimeFrame(newTimeFrame)
        trackFeature('growth_timeframe_change', 'click', {
          new_timeframe: newTimeFrame,
          previous_timeframe: growthTimeFrame
        })
      }
      
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

      const getTimeframeSpecificTotalMetrics = () => {
  if (!instagramData?.recentPosts || instagramData.recentPosts.length === 0) {
    return {
      totalReach: 0,
      totalProfileVisits: 0,
      totalImpressions: 0,
      postsCount: 0
    };
  }

  const now = new Date();
  const daysBack = growthTimeFrame === 'weekly' ? 7 : 30;
  const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

  // Filter posts within the timeframe
  const timeframePosts = instagramData.recentPosts.filter(post => {
    const postDate = new Date(post.timestamp);
    return postDate >= cutoffDate;
  });

  if (timeframePosts.length === 0) {
    return {
      totalReach: 0,
      totalProfileVisits: 0,
      totalImpressions: 0,
      postsCount: 0
    };
  }

  // Sum up the actual metrics from filtered posts
  const totalReach = timeframePosts.reduce((sum, post) => sum + (post.reach || 0), 0);
  const totalProfileVisits = timeframePosts.reduce((sum, post) => sum + (post.profile_visits || 0), 0);
  const totalImpressions = timeframePosts.reduce((sum, post) => sum + (post.impressions || 0), 0);

  return {
    totalReach,
    totalProfileVisits,
    totalImpressions,
    postsCount: timeframePosts.length
  };
};

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
    // FIXED: Parse the year-month string directly without Date object
    const [year, month] = dataPoint.date.split('-');
    const monthNumber = parseInt(month, 10); // 06 becomes 6, 07 becomes 7
    
    const isCurrentMonth = !dataPoint.isComplete;
    
    // FIXED: Create month label directly from month number
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabel = monthNames[monthNumber - 1]; // monthNumber is 1-based, array is 0-based
    
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
            <ClickTracker
              featureName="growth_metrics_back"
              metadata={{ timeframe: growthTimeFrame }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-emerald-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
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
                  <ClickTracker
                    key={period.key}
                    featureName="growth_timeframe_toggle"
                    metadata={{
                      selected_timeframe: period.key,
                      has_data: growthData.canCalculate
                    }}
                  >
                    <button
                      onClick={() => handleGrowthTimeFrameChange(period.key)}
                      className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
                        growthTimeFrame === period.key
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

            {/* Growth Rate Display */}
            <ViewTracker
              featureName="growth_rate_display"
              metadata={{
                timeframe: growthTimeFrame,
                has_data: growthData.canCalculate,
                followers: instagramData?.followers || 0
              }}
            >
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
            </ViewTracker>

            {/* Real Profile Performance using filtered post data */}
{(() => {
  const timeframeMetrics = getTimeframeSpecificTotalMetrics();
  
  // Only show if we have actual data for the timeframe
  if (timeframeMetrics.postsCount === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👁️</span>
          Profile Performance ({growthTimeFrame === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'})
        </h3>
        
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-gray-400 text-xl">📊</span>
          </div>
          <p className="text-gray-600 text-sm">
            No posts in the {growthTimeFrame === 'weekly' ? 'last 7 days' : 'last 30 days'} to calculate reach metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ViewTracker
      featureName="profile_performance_insights_filtered"
      metadata={{
        timeframe: growthTimeFrame,
        posts_in_timeframe: timeframeMetrics.postsCount,
        total_reach: timeframeMetrics.totalReach
      }}
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👁️</span>
          Profile Performance ({growthTimeFrame === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'})
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {timeframeMetrics.totalProfileVisits > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {timeframeMetrics.totalProfileVisits.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Profile Visits</div>
              <div className="text-xs text-gray-500 mt-1">
                From {timeframeMetrics.postsCount} posts
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {timeframeMetrics.totalReach >= 1000 ? 
                (timeframeMetrics.totalReach / 1000).toFixed(1) + 'K' :
                timeframeMetrics.totalReach.toLocaleString()
              }
            </div>
            <div className="text-sm text-gray-600">Total Reach</div>
            <div className="text-xs text-gray-500 mt-1">
              From {timeframeMetrics.postsCount} posts
            </div>
          </div>

          {timeframeMetrics.totalImpressions > 0 && (
            <div className="text-center col-span-2">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {timeframeMetrics.totalImpressions >= 1000 ? 
                  (timeframeMetrics.totalImpressions / 1000).toFixed(1) + 'K' :
                  timeframeMetrics.totalImpressions.toLocaleString()
                }
              </div>
              <div className="text-sm text-gray-600">Total Impressions</div>
              <div className="text-xs text-gray-500 mt-1">
                From {timeframeMetrics.postsCount} posts
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Calculated from posts published in the {growthTimeFrame === 'weekly' ? 'last 7 days' : 'last 30 days'}
        </div>
      </div>
    </ViewTracker>
  );
})()}

            {/* Follower History Bar Chart - Vertical Bars */}
            {chartData.length > 0 && (
              <ViewTracker
                featureName="growth_history_chart"
                metadata={{
                  timeframe: growthTimeFrame,
                  data_points: chartData.length,
                  current_followers: instagramData?.followers || 0
                }}
              >
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
              </ViewTracker>
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
            avgSaves: 0
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
            avgSaves: 0
          };
        }

        // Calculate metrics from last 30 days
        const totalLikes = last30DaysPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
        const totalComments = last30DaysPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0);
        const totalReach = last30DaysPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
        const totalSaves = last30DaysPosts.reduce((sum, post) => sum + (post.saves || 0), 0);
        const totalEngagement = totalLikes + totalComments;

        const avgLikes = Math.round(totalLikes / last30DaysPosts.length);
        const avgComments = Math.round(totalComments / last30DaysPosts.length);
        const avgReach = totalReach > 0 ? Math.round(totalReach / last30DaysPosts.length) : 0;
        const avgSaves = Math.round(totalSaves / last30DaysPosts.length);

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
          avgSaves
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
            <ClickTracker
              featureName="engagement_metrics_back"
              metadata={{ engagement_rate: engagementMetrics.engagementRate }}
            >
              <button 
                onClick={() => setSelectedMetricCategory(null)}
                className="mr-3 text-blue-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
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
            <ViewTracker
              featureName="engagement_rate_circle"
              metadata={{
                engagement_rate: engagementMetrics.engagementRate,
                avg_likes: engagementMetrics.avgLikes,
                avg_comments: engagementMetrics.avgComments
              }}
            >
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
            </ViewTracker>

            {/* Engagement Breakdown */}
            <ViewTracker
              featureName="engagement_breakdown"
              metadata={{
                total_metrics: 4,
                has_reach_data: engagementMetrics.avgReach > 0
              }}
            >
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
                      <Bookmark className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Avg Saves per Post</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {engagementMetrics.avgSaves.toLocaleString()}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{width: '55%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ViewTracker>

            {/* Engagement Rate History Bar Chart */}
            {engagementHistory.length > 0 && (
              <ViewTracker
                featureName="engagement_history_chart"
                metadata={{
                  months_analyzed: engagementHistory.length,
                  max_rate: maxEngagementRate
                }}
              >
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
              </ViewTracker>
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
                'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-200',
                'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200', 
                'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200',
                'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200',
                'bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-200',
                'bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200'
              ];
              return (
                <div className="h-full">
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
  const lastUsedVariationsRef = useRef<{[key: string]: string}>({});

  // Track AI insights usage
  useEffect(() => {
    trackEngagement('ai_insights_opened', {
      has_instagram_data: !!instagramData,
      posts_count: instagramData?.recentPosts?.length || 0,
      followers: instagramData?.followers || 0
    })
  }, [])

  // Performance Classification System
  const classifyPerformance = (metric: ValidMetric, data: InstagramData): PerformanceLevel => {
    const followerCount = data.followers || 0;
    
    switch (metric) {
      case 'engagement':
        const engagementRate = parseFloat(data.engagementRate?.replace('%', '') || '0');
        
        // Adjust benchmarks by follower count
        let goodThreshold, excellentThreshold;
        
        if (followerCount < 10000) {
          goodThreshold = 4.0;   // Micro creators should see higher engagement
          excellentThreshold = 7.0;
        } else if (followerCount < 100000) {
          goodThreshold = 3.0;   // Growing creators
          excellentThreshold = 5.0;
        } else {
          goodThreshold = 2.0;   // Large creators
          excellentThreshold = 3.5;
        }
        
        if (engagementRate >= excellentThreshold) return 'positive';
        if (engagementRate >= goodThreshold) return 'mixed';
        return 'negative';
        
      case 'growth':
        if (!data.growthData?.canCalculateWeekly) return 'neutral';
        
        const weeklyGrowth = parseFloat(data.growthRate?.replace(/[+%]/g, '') || '0');
        
        // Larger accounts naturally grow slower
        let growthGood, growthExcellent;
        
        if (followerCount < 1000) {
          growthGood = 2.0;      // Early creators can grow faster
          growthExcellent = 5.0;
        } else if (followerCount < 10000) {
          growthGood = 1.5;
          growthExcellent = 3.0;
        } else {
          growthGood = 0.5;      // Large accounts grow slower
          growthExcellent = 1.5;
        }
        
        if (weeklyGrowth >= growthExcellent) return 'positive';
        if (weeklyGrowth >= growthGood) return 'mixed';
        if (weeklyGrowth >= 0) return 'negative';
        return 'declining';
        
      case 'reach':
        const avgReach = data.avgReach || 0;
        const reachRatio = followerCount > 0 ? avgReach / followerCount : 0;
        
        if (reachRatio >= 0.6) return 'positive';
        if (reachRatio >= 0.3) return 'mixed';
        if (reachRatio >= 0.1) return 'negative';
        return 'very_low';
        
      case 'frequency':
        const frequencyData = data.recentPosts ? calculateFrequencyOptimization(data.recentPosts) : null;
        if (!frequencyData) return 'neutral';
        
        const difference = Math.abs(frequencyData.currentFrequency - frequencyData.optimalFrequency);
        
        if (difference <= 0.5) return 'positive';
        if (difference <= 1.5) return 'mixed';
        return 'negative';
        
      case 'timing':
        const timingData = data.recentPosts ? calculateTimingOptimization(data.recentPosts) : null;
        if (!timingData || timingData.timeSlots.length === 0) return 'neutral';
        
        // If they have clear timing patterns and good performance variance
        const topSlotPerformance = timingData.timeSlots[0]?.engagementScore || 0;
        const avgLikes = data.avgLikes || 0;
        
        if (topSlotPerformance > avgLikes * 1.5) return 'positive';
        if (topSlotPerformance > avgLikes * 1.2) return 'mixed';
        return 'negative';
        
      case 'content':
        if (!data.recentPosts || data.recentPosts.length < 5) return 'neutral';
        
        // Analyze content type performance variance
        const contentTypes = analyzeContentTypePerformance(data.recentPosts);
        if (contentTypes.length < 2) return 'neutral';
        
        const bestType = contentTypes[0];
        const worstType = contentTypes[contentTypes.length - 1];
        const performanceGap = (bestType.avgEngagement - worstType.avgEngagement) / (worstType.avgEngagement || 1);
        
        if (performanceGap > 1.0) return 'positive'; // Clear winner
        if (performanceGap > 0.3) return 'mixed';   // Some variance
        return 'negative'; // All performing similarly (might need more variety)
        
      default:
        return 'neutral';
    }
  };

  // Response Variations System
const getResponseVariations = (metric: ValidMetric, performance: PerformanceLevel) => {
  const variations: Record<ValidMetric, Record<VariationLevel, { openers: string[], closers: string[] }>> = {
    growth: {
      positive: {
        openers: [
          "This is exciting! Your growth numbers are looking really solid.",
          "Your follower growth is definitely trending in the right direction.",
          "Nice work on the growth front - you're building real momentum here.",
          "Your growth rate is impressive - you're clearly doing something right."
        ],
        closers: [
          "Keep this momentum going and you'll hit your next milestone soon.",
          "This growth rate puts you ahead of most creators in your range.",
          "Focus on what's working and this upward trend should continue.",
          "Scale what's working and you could see even faster growth."
        ]
      },
      mixed: {
        openers: [
          "Your growth is steady with some clear opportunities to accelerate it.",
          "You're building followers consistently - let's see how we can boost that rate.",
          "Your growth shows good potential with room for optimization.",
          "Solid foundation here - a few tweaks could really improve your growth rate."
        ],
        closers: [
          "Small optimizations often lead to significant growth improvements.",
          "You're on the right track - these changes should accelerate things.",
          "Focus on these areas and you should see faster growth within weeks.",
          "Your foundation is solid - time to optimize for faster growth."
        ]
      },
      negative: {
        openers: [
          "Your growth has slowed down, but that's completely normal and fixable.",
          "Growth can be challenging, but your data shows some clear opportunities.",
          "Let's turn this growth plateau into an opportunity to optimize your strategy.",
          "Growth has been slow, but I found specific areas where we can improve."
        ],
        closers: [
          "Small changes often lead to big improvements in growth.",
          "Most successful creators go through periods like this - it's part of the journey.",
          "Focus on these recommendations and you should see improvement soon.",
          "These strategic changes should help break through the growth plateau."
        ]
      }
    },
    engagement: {
      positive: {
        openers: [
          "Your audience is clearly connecting with your content - these engagement numbers show real community building.",
          "This engagement rate tells me your followers genuinely care about what you're sharing.",
          "Your content is resonating well - this level of engagement is what sustainable growth looks like.",
          "Strong engagement like this is exactly what the algorithm loves to see."
        ],
        closers: [
          "Maintain this level of connection and your growth will follow naturally.",
          "This engagement rate sets you up perfectly for sustained growth.",
          "Keep creating content that sparks this level of interaction.",
          "This community engagement is your foundation for long-term success."
        ]
      },
      mixed: {
        openers: [
          "Your engagement is solid with clear opportunities to boost that connection with your audience.",
          "Good engagement foundation here - let's see how we can make it even stronger.",
          "Your audience is responding well, and there's room to increase that engagement further.",
          "Decent engagement levels with some specific areas we can optimize."
        ],
        closers: [
          "These optimizations should help you connect even deeper with your audience.",
          "Focus on these areas and your engagement should improve noticeably.",
          "Small tweaks to boost engagement often have big impacts on growth.",
          "Better engagement will naturally lead to better reach and growth."
        ]
      },
      negative: {
        openers: [
          "Your engagement has room to grow, which actually gives us clear areas to focus on.",
          "Let's work on boosting that connection with your audience - I see specific opportunities.",
          "Engagement can be tricky, but your posting patterns show me exactly what we need to adjust.",
          "There's opportunity to build stronger connections with your audience."
        ],
        closers: [
          "Better engagement is often just a few strategic changes away.",
          "Focus on connection and interaction - the numbers will follow.",
          "These changes should help you build a more engaged community.",
          "Stronger engagement will improve everything else about your account."
        ]
      }
    },
    timing: {
      positive: {
        openers: [
          "You've really dialed in your timing - your audience clearly has predictable patterns.",
          "Your timing strategy is working well - there's a clear pattern in your best-performing posts.",
          "Great timing insights here - you've found when your audience is most active.",
          "Your posting schedule aligns well with when your audience wants to engage."
        ],
        closers: [
          "Stick with these timing patterns - they're clearly working for you.",
          "This timing consistency will help build audience expectations.",
          "Your timing strategy is a real competitive advantage.",
          "Consistent timing like this helps build loyal viewing habits."
        ]
      },
      mixed: {
        openers: [
          "I found some good timing patterns in your data with room to optimize further.",
          "Your timing shows promise - there are some clear windows where you perform better.",
          "Decent timing strategy with opportunities to fine-tune for better results.",
          "Some solid timing insights here that we can build on."
        ],
        closers: [
          "Refining your timing could give you a nice boost in engagement.",
          "Better timing consistency should improve your overall performance.",
          "These timing optimizations are often quick wins for creators.",
          "Focus on these time windows and you should see improvement."
        ]
      },
      negative: {
        openers: [
          "Your posting times are scattered, but I found some clear patterns in when your audience is active.",
          "There's a timing opportunity here - your data shows when your audience is most engaged.",
          "Your current timing isn't optimized, but the data shows clear windows of opportunity.",
          "Timing has been inconsistent, but I found when your audience is most responsive."
        ],
        closers: [
          "Better timing alone could significantly boost your engagement.",
          "This is often one of the easiest ways to improve performance.",
          "Consistent timing will help you reach more of your audience.",
          "Focus on timing first - it impacts everything else."
        ]
      }
    },
    frequency: {
      positive: {
        openers: [
          "Your posting frequency is really well-calibrated for your audience.",
          "You've found a great posting rhythm that your audience responds well to.",
          "Your frequency strategy is working - good balance between staying visible and not overwhelming.",
          "Perfect posting cadence - your audience knows when to expect content from you."
        ],
        closers: [
          "Keep this posting rhythm - it's clearly working for your audience.",
          "This frequency gives you great visibility without audience fatigue.",
          "Maintain this consistency - it's building strong audience habits.",
          "Your posting frequency is a real strength in your strategy."
        ]
      },
      mixed: {
        openers: [
          "Your posting frequency is decent with room to optimize for better engagement.",
          "Good posting consistency with opportunities to fine-tune the frequency.",
          "Your frequency shows some patterns that we can optimize further.",
          "Solid posting rhythm with potential to adjust for better performance."
        ],
        closers: [
          "Small frequency adjustments often lead to better engagement rates.",
          "Finding your optimal posting rhythm will improve overall performance.",
          "Better frequency balance should boost your audience engagement.",
          "Optimize this and you'll see improvements across all your metrics."
        ]
      },
      negative: {
        openers: [
          "Your posting frequency could use some optimization - I see clear opportunities to improve.",
          "There's room to find a better posting rhythm that works for both you and your audience.",
          "Your frequency pattern shows we can optimize for better engagement and reach.",
          "Let's work on finding your optimal posting frequency based on your data."
        ],
        closers: [
          "The right posting frequency can dramatically improve your results.",
          "Better frequency balance will help with both engagement and growth.",
          "This optimization could be a game-changer for your account performance.",
          "Finding your rhythm is key to sustainable, long-term growth."
        ]
      }
    },
    content: {
      positive: {
        openers: [
          "Your content strategy is really working - you've found formats that resonate with your audience.",
          "Great content performance! You're clearly creating what your audience wants to see.",
          "Your content mix is hitting the mark - engagement across formats shows strong audience connection.",
          "Excellent content performance - you've identified what works best for your community."
        ],
        closers: [
          "Double down on your best-performing content types for continued success.",
          "This content strategy is building a loyal audience - keep it up.",
          "Your content approach is working - maintain this quality and variety.",
          "Focus on scaling your winning content formats for even better results."
        ]
      },
      mixed: {
        openers: [
          "Your content shows good potential with clear opportunities to optimize performance.",
          "Solid content foundation with room to improve your top-performing formats.",
          "Your content strategy has bright spots - let's identify and scale what's working best.",
          "Good content variety with opportunities to focus on your strongest formats."
        ],
        closers: [
          "Focus on your best-performing content types to boost overall engagement.",
          "Optimizing your content mix should improve performance across the board.",
          "These content insights should help you create more engaging posts.",
          "Better content strategy will naturally improve engagement and reach."
        ]
      },
      negative: {
        openers: [
          "Your content has room for improvement, but I found clear patterns in what's working.",
          "Content performance varies, but the data shows specific formats that could work better.",
          "Let's optimize your content strategy - I see opportunities to improve engagement.",
          "Content engagement could be stronger, but there are clear areas to focus on."
        ],
        closers: [
          "Better content strategy often leads to significant improvement in all metrics.",
          "Focus on high-performing content types and engagement should improve.",
          "These content optimizations should help you connect better with your audience.",
          "Improved content strategy will boost engagement, reach, and growth."
        ]
      }
    },
    reach: {
      positive: {
        openers: [
          "Your reach is performing really well - you're successfully expanding beyond your follower base.",
          "Excellent reach numbers! Your content is getting discovered by new audiences.",
          "Strong reach performance shows your content is resonating beyond your existing followers.",
          "Great reach metrics - you're effectively growing your audience through discovery."
        ],
        closers: [
          "Maintain this reach strategy to continue growing your audience.",
          "This reach performance is exactly what drives sustainable growth.",
          "Keep creating discoverable content and your audience will continue expanding.",
          "Your reach strategy is working - scale what's driving this performance."
        ]
      },
      mixed: {
        openers: [
          "Your reach is decent with clear opportunities to expand your audience further.",
          "Good reach foundation with room to optimize for better discoverability.",
          "Your content reaches a solid audience, but there's potential to expand that reach.",
          "Solid reach performance with specific areas we can improve for better discovery."
        ],
        closers: [
          "Better reach optimization should help you discover new audience segments.",
          "Focus on these areas and your content should reach more people.",
          "Improved reach will naturally lead to faster follower growth.",
          "These reach optimizations should expand your audience significantly."
        ]
      },
      negative: {
        openers: [
          "Your reach could be improved, but I found specific strategies to expand your audience.",
          "Let's work on boosting your reach - there are clear opportunities for better discovery.",
          "Reach has been limited, but your content has potential to reach much larger audiences.",
          "Your reach needs optimization, but the data shows clear paths to improvement."
        ],
        closers: [
          "Better reach strategies can dramatically expand your audience.",
          "Focus on discoverability and you should see significant reach improvements.",
          "These reach optimizations should help you find new audience segments.",
          "Improved reach is often the key to breaking through growth plateaus."
        ]
      }
    }
  };
  
  // Map performance levels to variation levels
  const getVariationLevel = (perf: PerformanceLevel): VariationLevel => {
    switch (perf) {
      case 'positive':
        return 'positive';
      case 'mixed':
      case 'neutral':
        return 'mixed';
      case 'negative':
      case 'declining':
      case 'very_low':
      default:
        return 'negative';
    }
  };
  
  const variationLevel = getVariationLevel(performance);
  
  return variations[metric]?.[variationLevel] || { 
    openers: ["Let me analyze your data..."], 
    closers: ["These insights should help you improve."] 
  };
};

  // Get random variation while avoiding recent repeats
  // Get random variation while avoiding recent repeats
const getRandomVariation = (variations: string[], key: string): string => {
  const lastUsed = lastUsedVariationsRef.current[key];
  const available = variations.filter(v => v !== lastUsed);
  const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : variations[0];
  
  // Update ref (doesn't cause re-render)
  lastUsedVariationsRef.current[key] = selected;
  
  return selected;
};

  // Helper function to analyze content type performance
  const analyzeContentTypePerformance = (posts: InstagramPost[]) => {
    const typeGroups = new Map();
    
    posts.forEach(post => {
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

  // Metric definitions data
  const metricDefinitions = {
    growth: {
      title: "Growth Metrics",
      emoji: "🚀",
      metrics: [
        {
          name: "Total Followers",
          definition: "The number of people who follow your account",
          why: "Shows the size of your community",
          example: "If you have 2,500 followers, that's your potential audience for each post",
          good: "Growth depends on your niche, but 5-10% monthly growth is solid"
        },
        {
          name: "Weekly Growth Rate", 
          definition: "Percentage increase in followers over the past 7 days",
          why: "Tracks how fast your community is growing",
          example: "+2.5% means you gained 25 followers for every 1000 you had",
          good: "1-3% weekly is healthy, 5%+ is excellent"
        },
        {
          name: "Monthly Growth Rate",
          definition: "Percentage increase in followers over the past 30 days", 
          why: "Shows longer-term growth trends",
          example: "+8% monthly means you're doubling your followers every year",
          good: "5-15% monthly growth is great for most creators"
        }
      ]
    },
    engagement: {
      title: "Engagement Metrics", 
      emoji: "💬",
      metrics: [
        {
          name: "Engagement Rate",
          definition: "Percentage of people who like, comment, or save your posts",
          why: "Shows how much your audience loves your content",
          example: "4% rate means 40 people engage for every 1000 who see your post",
          good: "3.5%+ is above average, 6%+ is excellent"
        },
        {
          name: "Average Likes",
          definition: "Typical number of likes your posts receive",
          why: "Quick indicator of content popularity",
          example: "If you average 150 likes, posts with 200+ are performing well",
          good: "Consistency matters more than total number"
        },
        {
          name: "Average Comments", 
          definition: "Typical number of comments your posts receive",
          why: "Shows deeper audience connection and conversation",
          example: "20 comments suggests people want to engage with your ideas",
          good: "Comments are 10x more valuable than likes for growth"
        },
        {
          name: "Average Reach",
          definition: "How many unique people see your posts on average",
          why: "Reach determines your growth potential",
          example: "1,500 reach with 1,000 followers means good discoverability",
          good: "Reach above 50% of followers indicates healthy algorithm performance"
        }
      ]
    },
    timing: {
      title: "Timing Metrics",
      emoji: "⏰", 
      metrics: [
        {
          name: "Best Time to Post",
          definition: "When your audience is most active and likely to engage",
          why: "Posting at the right time gets more immediate engagement",
          example: "If your best time is 7PM, posts then get 2x more likes",
          good: "Consistency in timing helps audience expect your content"
        },
        {
          name: "Engagement Score",
          definition: "How well posts perform at different times (calculated from likes + comments)",
          why: "Compares performance across different posting times",
          example: "Score of 85 at 7PM vs 45 at 10AM shows clear preference",
          good: "Focus on your top 2-3 time slots for best results"
        }
      ]
    },
    frequency: {
      title: "Frequency Metrics",
      emoji: "📈",
      metrics: [
        {
          name: "Current Frequency", 
          definition: "How often you currently post per week",
          why: "Shows your current posting rhythm",
          example: "2.5 posts/week means you post about every 3 days",
          good: "Consistency matters more than high frequency"
        },
        {
          name: "Optimal Frequency",
          definition: "How often you should post based on your engagement data",
          why: "The sweet spot between staying visible and not overwhelming your audience",
          example: "If optimal is 3/week but you post 5/week, you might be over-posting",
          good: "Quality over quantity - better to post less but consistently"
        },
        {
          name: "Consistency Score",
          definition: "How regular your posting schedule is (0-100%)",
          why: "Algorithm favors accounts that post consistently",
          example: "80% means you post fairly regularly, 95% means very consistent",
          good: "70%+ consistency helps with algorithm visibility"
        }
      ]
    },
    content: {
      title: "Content Metrics",
      emoji: "📊", 
      metrics: [
        {
          name: "Content Types",
          definition: "Performance comparison between posts, carousels, and reels",
          why: "Shows which formats your audience prefers",
          example: "If carousels average 200 likes vs 100 for posts, focus on carousels",
          good: "Double down on your best-performing format"
        },
        {
          name: "Average Saves",
          definition: "How many people save your posts on average",
          why: "Saves indicate your content is valuable enough to reference later",
          example: "High saves often lead to better reach over time",
          good: "Even 5-10 saves per post shows strong content value"
        }
      ]
    },
    reach: {
      title: "Reach & Discovery Metrics",
      emoji: "👥",
      metrics: [
        {
          name: "Profile Visits",
          definition: "How many people visit your profile from your posts",
          why: "Shows how compelling your content is for discovery",
          example: "500 profile visits from 2,000 reach = 25% visit rate",
          good: "10%+ profile visit rate from reach is strong"
        },
        {
          name: "Impressions", 
          definition: "Total number of times your posts are seen (includes repeat views)",
          why: "Shows total content visibility",
          example: "3,000 impressions with 1,500 reach means people see your posts twice on average",
          good: "Higher impressions than reach indicates engaging content"
        }
      ]
    }
  };

  const metricOptions: MetricOption[] = [
    { value: 'growth', label: 'Grow My Following', description: 'Strategies to reach more people' },
    { value: 'engagement', label: 'Boost Engagement', description: 'Get your audience more involved' },
    { value: 'timing', label: 'Optimize My Timing', description: 'Post when your audience is active' },
    { value: 'frequency', label: 'Find My Rhythm', description: 'How often you should post' },
    { value: 'content', label: 'Improve My Content', description: 'Focus on what performs best' },
    { value: 'reach', label: 'Expand My Reach', description: 'Get discovered by new people' },
    { value: 'definitions', label: 'Understand My Metrics', description: 'What do all these numbers mean?' }
  ];

  const connectedAccounts: Account[] = [
    { platform: 'Instagram', username: instagramData?.username || 'Not connected', connected: !!instagramData, color: 'from-pink-500 to-orange-500' },
    { platform: 'Twitter/X', username: 'Not available', connected: false, color: 'from-gray-800 to-black' },
    { platform: 'LinkedIn', username: 'Not available', connected: false, color: 'from-blue-600 to-blue-700' }
  ];

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    
    if (metric === 'definitions') {
      setChatStep(5);
    } else {
      setChatStep(2);
    }
    
    trackFeature('ai_metric_selection', 'click', {
      metric_selected: metric,
      has_instagram_data: !!instagramData
    })
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setIsAnalyzing(true);
    setChatStep(3);
    
    trackEngagement('ai_analysis_started', {
      metric_type: selectedMetric,
      account_platform: account.platform,
      has_real_data: account.connected,
      analysis_start_time: new Date().toISOString()
    })
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setChatStep(4);
      
      trackEngagement('ai_analysis_completed', {
        metric_type: selectedMetric,
        account_platform: account.platform,
        analysis_duration: 2000,
        recommendations_generated: true
      })
    }, 2000);
  };

  const resetChat = () => {
    setChatStep(1);
    setSelectedMetric('');
    setSelectedAccount('');
    setSelectedDefinitionCategory(null);
    setIsAnalyzing(false);
    
    trackFeature('ai_chat_reset', 'click', {
      previous_metric: selectedMetric,
      chat_step_reached: chatStep
    })
  };

  const getAIRecommendations = (): AIRecommendation => {
    if (!instagramData || !instagramData.recentPosts || instagramData.recentPosts.length === 0) {
      return {
        title: "Connect Your Account for Personalized Insights",
        insights: [
          "Connect your Instagram account to get data-driven recommendations based on your actual performance.",
          "I need at least 5-10 posts to provide meaningful analysis of your content patterns.",
          "Once connected, I'll analyze your posting times, content types, and audience engagement to give you specific advice."
        ],
        actions: [
          "Connect your Instagram Business or Creator account from the Profile tab",
          "Post consistently for 1-2 weeks to gather enough data for analysis",
          "Return here for personalized recommendations based on your performance"
        ]
      };
    }

    // Get performance classification and variations
    const performance = classifyPerformance(selectedMetric as ValidMetric, instagramData);
    const variations = getResponseVariations(selectedMetric as ValidMetric, performance);
    
    // Get dynamic opener and closer
    const opener = getRandomVariation(variations.openers, `${selectedMetric}_opener`);
    const closer = getRandomVariation(variations.closers, `${selectedMetric}_closer`);

    // Calculate data for recommendations
    const timingData = calculateTimingOptimization(instagramData.recentPosts);
    const frequencyData = calculateFrequencyOptimization(instagramData.recentPosts);
    const contentTypes = analyzeContentTypePerformance(instagramData.recentPosts);
    const bestContentType = contentTypes[0];
    const userEngagementRate = parseFloat(instagramData.engagementRate?.replace('%', '') || '0');

    // Track performance classification
    trackEngagement('ai_performance_classified', {
      metric: selectedMetric,
      performance_level: performance,
      follower_count: instagramData.followers,
      engagement_rate: userEngagementRate
    });

    const recommendations: Record<string, AIRecommendation> = {
      growth: {
        title: "Your Growth Strategy Analysis",
        insights: [
          opener,
          `You've built a community of ${instagramData.followers.toLocaleString()} followers${instagramData.growthData?.canCalculateWeekly ? ` with ${instagramData.growthRate} growth this week` : ''}.`,
          `Your ${instagramData.engagementRate} engagement rate ${userEngagementRate > 3.5 ? 'is performing well above average' : 'has room to grow'}.`,
          `Profile visits: ${instagramData.accountInsights?.profile_visits?.toLocaleString() || 'N/A'} in the last 30 days.`
        ],
        actions: [
          bestContentType ? `Focus on ${bestContentType.type.toLowerCase()}s - they average ${bestContentType.avgEngagement} engagement vs your overall ${instagramData.avgLikes} average` : "Test different content formats to find what resonates most",
          timingData.timeSlots.length > 0 ? `Post during your peak time: ${timingData.timeSlots[0].time} (averages ${timingData.timeSlots[0].avgLikes} likes)` : "Experiment with different posting times",
          performance === 'positive' ? "Scale what's working with more of your best content" : "Focus on increasing engagement rate with more interactive content"
        ]
      },
      engagement: {
        title: "Engagement Optimization Analysis", 
        insights: [
          opener,
          `Your posts average ${instagramData.avgLikes} likes and ${(instagramData.avgComments ?? 0)} comments.`,
          bestContentType ? `${bestContentType.type}s are your strongest format with ${bestContentType.engagementRate} engagement rate.` : "Need more content variety to identify top performers.",
          `Your audience is most active during ${timingData.timeSlots[0]?.time || 'evening hours'}.`
        ],
        actions: [
          bestContentType ? `Create more ${bestContentType.type.toLowerCase()}s - they get ${bestContentType.avgEngagement} avg engagement` : "Test different content formats",
          `Post during your top time slots: ${timingData.timeSlots.slice(0, 2).map(slot => slot.time).join(' and ')}`,
          (instagramData.avgComments ?? 0) < (instagramData.avgLikes ?? 0) * 0.1 ? "Increase comments with questions in captions" : "Maintain strong comment engagement"
        ]
      },
      timing: {
        title: "Optimal Timing Strategy",
        insights: [
          opener,
          `Based on ${instagramData.recentPosts.length} posts, your best performing time is ${timingData.timeSlots[0]?.time} with ${timingData.timeSlots[0]?.avgLikes} average likes.`,
          `You've tested ${timingData.timeSlots.length} different time slots with clear performance differences.`,
          `Your top performing times consistently outperform your average by ${timingData.timeSlots[0] ? Math.round(((timingData.timeSlots[0].avgLikes - (instagramData.avgLikes || 0)) / (instagramData.avgLikes || 1)) * 100) : 25}%.`
        ],
        actions: [
          `Schedule posts for ${timingData.timeSlots[0]?.time} - your highest engagement window`,
          timingData.timeSlots.length > 1 ? `Alternate between your top ${Math.min(3, timingData.timeSlots.length)} time slots` : "Test 2-3 additional time slots",
          "Track performance at these times for consistency validation"
        ]
      },
      frequency: {
        title: "Posting Frequency Analysis",
        insights: [
          opener,
          `Current frequency: ${frequencyData.currentFrequency} posts/week. Based on your engagement data, ${frequencyData.optimalFrequency} posts/week appears optimal.`,
          `Your best performing frequency range is ${frequencyData.performanceByFrequency[0]?.range} with ${frequencyData.performanceByFrequency[0]?.avgEngagement} average engagement per post.`,
          `Consistency score: ${frequencyData.consistencyScore}% - ${frequencyData.consistencyScore > 70 ? 'good posting rhythm' : 'room to improve posting consistency'}.`
        ],
        actions: [
          frequencyData.currentFrequency !== frequencyData.optimalFrequency ? 
            `Gradually adjust to ${frequencyData.optimalFrequency} posts per week` : 
            "Maintain your current posting frequency",
          `Focus on the ${frequencyData.performanceByFrequency[0]?.range} range - your sweet spot`,
          "Plan content in advance to maintain quality and consistency"
        ]
      },
      content: {
        title: "Content Performance Analysis",
        insights: [
          opener,
          bestContentType ? 
            `${bestContentType.type}s are your top format: ${bestContentType.avgEngagement} avg engagement, ${bestContentType.engagementRate} engagement rate.` :
            "Need more content variety for comprehensive analysis.",
          contentTypes.length > 1 ? 
            `Performance gap: Your best format outperforms others by ${Math.round(((bestContentType.avgEngagement - contentTypes[contentTypes.length - 1].avgEngagement) / contentTypes[contentTypes.length - 1].avgEngagement) * 100)}%.` :
            "Try different content types to find what works best.",
          `Your content reaches an average of ${instagramData.avgReach?.toLocaleString() || 'N/A'} people per post.`
        ],
        actions: [
          bestContentType ? 
            `Create more ${bestContentType.type.toLowerCase()}s - they generate ${bestContentType.avgEngagement} avg engagement` :
            "Test carousels, reels, and single posts to find your best format",
          contentTypes.length > 1 ? 
            `Improve your lowest performing format or focus entirely on what works best` :
            "Experiment with different content types for better insights",
          "Ask questions in captions to boost comment engagement"
        ]
      },
      reach: {
        title: "Audience Reach Analysis",
        insights: [
          opener,
          `Your posts reach an average of ${instagramData.avgReach?.toLocaleString() || 'calculating'} people (${instagramData.avgReach ? ((instagramData.avgReach / instagramData.followers) * 100).toFixed(1) : 'N/A'}% of your followers).`,
          `Total reach in the last 30 days: ${instagramData.accountInsights?.reach ? (instagramData.accountInsights.reach / 1000).toFixed(1) + 'K' : 'N/A'}.`,
          bestContentType ? 
            `${bestContentType.type}s achieve the best reach with ${bestContentType.avgReach.toLocaleString()} average reach per post.` :
            "Need content variety analysis to identify best reach formats."
        ],
        actions: [
          bestContentType ? 
            `Focus on ${bestContentType.type.toLowerCase()}s for maximum reach` :
            "Test different content formats to maximize reach",
          `Post during peak times (${timingData.timeSlots.slice(0, 2).map(slot => slot.time).join(' and ')}) to boost reach`,
          "Use relevant hashtags and engaging captions to expand beyond your follower base"
        ]
      }
    };

    const recommendation = recommendations[selectedMetric] || recommendations.growth;
return {
  title: recommendation.title,
  insights: recommendation.insights,
  actions: recommendation.actions,
  closer
};
  };

  // Definitions view
  if (chatStep === 5) {
    if (selectedDefinitionCategory) {
      const category = metricDefinitions[selectedDefinitionCategory as keyof typeof metricDefinitions];
      
      return (
        <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-blue-50 to-indigo-50">
          <div className="bg-white/95 backdrop-blur-sm border-b border-blue-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
            <ClickTracker featureName="definition_detail_back">
              <button 
                onClick={() => setSelectedDefinitionCategory(null)}
                className="mr-3 text-blue-600 font-medium"
              >
                ← Back
              </button>
            </ClickTracker>
            <div className="flex items-center">
              <span className="mr-2">{category.emoji}</span>
              <h1 className="text-xl font-bold text-gray-900">{category.title}</h1>
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              {category.metrics.map((metric, index) => (
                <ViewTracker
                  key={index}
                  featureName={`metric_definition_${metric.name.toLowerCase().replace(/\s+/g, '_')}`}
                  metadata={{ category: selectedDefinitionCategory, metric: metric.name }}
                >
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-900 text-lg mb-3">{metric.name}</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">What it means:</h4>
                        <p className="text-gray-700 text-sm">{metric.definition}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">Why it matters:</h4>
                        <p className="text-gray-700 text-sm">{metric.why}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">Example:</h4>
                        <p className="text-gray-700 text-sm italic">{metric.example}</p>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <h4 className="font-semibold text-green-800 text-sm mb-1">💡 Good to know:</h4>
                        <p className="text-green-700 text-sm">{metric.good}</p>
                      </div>
                    </div>
                  </div>
                </ViewTracker>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Definitions category selection
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-blue-50 to-indigo-50">
        <div className="bg-white/95 backdrop-blur-sm border-b border-blue-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
          <ClickTracker featureName="definitions_back">
            <button 
              onClick={() => resetChat()}
              className="mr-3 text-blue-600 font-medium"
            >
              ← Back
            </button>
          </ClickTracker>
          <div className="flex items-center">
            <span className="mr-2">📚</span>
            <h1 className="text-xl font-bold text-gray-900">Metric Definitions</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200 rounded-2xl p-4 mb-6 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Understanding Your Numbers</h2>
            <p className="text-blue-800 text-sm">
              Tap any category below to learn what each metric means and why it matters for your growth.
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(metricDefinitions).map(([key, category]) => (
              <ClickTracker
                key={key}
                featureName={`definition_category_${key}`}
                metadata={{ category: category.title }}
              >
                <button
                  onClick={() => setSelectedDefinitionCategory(key)}
                  className="w-full text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.metrics.length} metrics explained</p>
                    </div>
                    <div className="ml-auto text-blue-400">→</div>
                  </div>
                </button>
              </ClickTracker>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <ClickTracker
              featureName="ai_chat_new_button"
              metadata={{ current_step: chatStep, metric: selectedMetric }}
            >
              <button 
                onClick={resetChat} 
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
              >
                New Chat
              </button>
            </ClickTracker>
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
                Let's dive in! 📊
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
                <span className="font-semibold text-gray-900">What would you like to focus on first?</span>
              </div>
              
              {chatStep === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {metricOptions.map((option) => (
                    <ClickTracker
                      key={option.value}
                      featureName={`ai_metric_option_${option.value}`}
                      metadata={{
                        metric_label: option.label,
                        has_instagram_data: !!instagramData
                      }}
                    >
                      <button
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
                    </ClickTracker>
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
          {chatStep >= 2 && selectedMetric !== 'definitions' && (
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
                      <ClickTracker
                        key={index}
                        featureName={`ai_account_${account.platform.toLowerCase()}`}
                        metadata={{
                          platform: account.platform,
                          connected: account.connected,
                          metric_context: selectedMetric
                        }}
                      >
                        <button
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
                      </ClickTracker>
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
          {chatStep > 2 && selectedMetric !== 'definitions' && (
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
                    <p className="text-gray-800 text-sm font-medium">Analyzing your content patterns...</p>
                    <p className="text-gray-600 text-xs mt-1">Looking for insights in your data</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {chatStep === 4 && (
            <ViewTracker
              featureName="ai_recommendations_display"
              metadata={{
                metric_analyzed: selectedMetric,
                has_real_data: !!instagramData,
                posts_count: instagramData?.recentPosts?.length || 0,
                performance_level: instagramData ? classifyPerformance(selectedMetric as ValidMetric, instagramData) : 'unknown'
              }}
            >
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
                          <span className="text-lg">📈</span>
                          <h3 className="font-bold text-gray-900 text-lg">{recs.title}</h3>
                        </div>
                        
                        <p className="text-sm text-indigo-600 mb-4">
                          Based on your {instagramData?.recentPosts?.length || 0} posts, here's what I found...
                        </p>
                        
                        {/* Key Insights */}
                        <div className="mb-6">
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-base">📊</span>
                            <h4 className="font-semibold text-gray-800">Key Insights</h4>
                          </div>
                          <div className="space-y-3">
                            {recs.insights.map((insight, index) => (
                              <ViewTracker
                                key={index}
                                featureName={`ai_insight_${index + 1}`}
                                metadata={{
                                  metric: selectedMetric,
                                  insight_index: index + 1
                                }}
                              >
                                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">{index + 1}</span>
                                  </div>
                                  <p className="text-sm text-blue-800 leading-relaxed">{insight}</p>
                                </div>
                              </ViewTracker>
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
                              <ViewTracker
                                key={index}
                                featureName={`ai_action_${index + 1}`}
                                metadata={{
                                  metric: selectedMetric,
                                  action_index: index + 1
                                }}
                              >
                                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">✓</span>
                                  </div>
                                  <p className="text-sm text-green-800 leading-relaxed">{action}</p>
                                </div>
                              </ViewTracker>
                            ))}
                          </div>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">{recs.closer}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <ClickTracker
                            featureName="ai_new_analysis_button"
                            metadata={{ previous_metric: selectedMetric }}
                          >
                            <button 
                              onClick={resetChat}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 px-4 font-medium text-sm shadow-sm hover:shadow-md transition-all"
                            >
                              New Analysis
                            </button>
                          </ClickTracker>
                          <ClickTracker
                            featureName="ai_export_report_button"
                            metadata={{ 
                              metric: selectedMetric,
                              insights_count: recs.insights.length,
                              actions_count: recs.actions.length
                            }}
                          >
                            <button className="bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl py-3 px-4 font-medium text-sm hover:bg-indigo-50 transition-all">
                              Export Report
                            </button>
                          </ClickTracker>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </ViewTracker>
          )}

        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t border-indigo-200">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Quick Insights</h3>
          <div className="grid grid-cols-2 gap-3">
            <ClickTracker
              featureName="ai_quick_growth_tips"
              metadata={{ from_section: 'quick_actions' }}
            >
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
            </ClickTracker>
            
            <ClickTracker
              featureName="ai_quick_timing_tips"
              metadata={{ from_section: 'quick_actions' }}
            >
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
            </ClickTracker>
          </div>
        </div>
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

  const ProfileContent = () => {
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
                { name: 'Notifications', clickable: false },
                { name: 'Account Data Management', clickable: true, action: () => setShowDataManagement(true), new: true },
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