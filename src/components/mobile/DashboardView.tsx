import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Plus, Home, BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { ClickTracker, ViewTracker } from '@/components/AnalyticsProvider';

// Type definitions
type TimeFrame = 'weekly' | 'monthly';

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
  saves?: number;
  comments?: any[];
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
  avgReach?: number;
  avgSaves?: number;
  totalLikes?: number;
  totalComments?: number;
  totalSaves?: number;
  totalImpressions?: number;
  profileVisits?: number;
  topFollowers?: any[];
  sentiment?: any;
  categoryStats?: any[];
  taggingProgress?: any;
  unlockedFeatures?: any;
  growthData?: {
    canCalculateWeekly: boolean;
    canCalculateMonthly: boolean;
    daysOfData: number;
    dataAvailableSince: string | null;
    daysUntilWeekly: number;
    daysUntilMonthly: number;
  };
  historicalData?: any;
  contentTypeAnalysis?: any[];
}

interface Metrics {
  growth: string;
  engagement: string;
  reach: string;
  timeLabel: string;
}

// Props interface - MUST match what AppRouter passes
interface DashboardViewProps {
  user: any;
  instagramData: InstagramData | null;
  isLoadingData: boolean;
  dataError: string | null;
  lastRefreshTime: Date | null;
  handleManualRefresh: () => void;
  timeFrame: TimeFrame;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  selectedMetricCategory: string | null;
  setSelectedMetricCategory: (category: string | null) => void;
  showTaggingModal: boolean;
  setShowTaggingModal: (show: boolean) => void;
  selectedPostsForTagging: string[];
  setSelectedPostsForTagging: (posts: string[]) => void;
  bulkTaggingMode: boolean;
  setBulkTaggingMode: (mode: boolean) => void;
  contentView: 'categories' | 'formats' | 'cross-analysis';
  setContentView: (view: 'categories' | 'formats' | 'cross-analysis') => void;
  onBackToAICoach: () => void;
}

const DashboardView: React.FC<DashboardViewProps> = (props) => {
  const {
    user,
    instagramData,
    isLoadingData,
    dataError,
    lastRefreshTime,
    handleManualRefresh,
    timeFrame,
    setTimeFrame,
    selectedMetricCategory,
    setSelectedMetricCategory,
    showTaggingModal,
    setShowTaggingModal,
    selectedPostsForTagging,
    setSelectedPostsForTagging,
    bulkTaggingMode,
    setBulkTaggingMode,
    contentView,
    setContentView,
    onBackToAICoach
  } = props;

  // 🎯 PASTE YOUR COMPLETE DASHBOARD CODE BELOW THIS LINE
  // ============================================================================
  // Copy ALL helper functions, metric calculations, metricCategories array, etc.
  // from your original SocialSageMobile.tsx DashboardContent section
  // ============================================================================

  // Helper function: getMetrics
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
          const rate = (totalEngagement / totalReach) * 100;
          timeframeEngagementRate = `${rate.toFixed(1)}%`;
        } else if (instagramData.followers > 0) {
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

    return {
      growth: '--',
      engagement: '--',
      reach: '--',
      timeLabel: period === 'weekly' ? 'This Week' : 'This Month'
    };
  };

  // TODO: Add your metricCategories array here
  // Copy the complete metricCategories array from your original SocialSageMobile.tsx
  const metricCategories: MetricCategory[] = [
    {
      id: 'growth_engagement',
      title: 'Growth & Engagement',
      emoji: '📈',
      description: 'See how your account is growing',
      color: 'from-emerald-500 to-blue-500',
      metrics: []
    },
    // ... add all your other categories
  ];

  // TODO: Add your MetricDetailView component here
  // Copy the complete MetricDetailView component from your original SocialSageMobile.tsx
  const MetricDetailView = ({ category }: { category: MetricCategory }) => {
    return (
      <div className="min-h-screen pb-20">
        {/* Your metric detail view JSX */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center sticky top-0 z-10">
          <button 
            onClick={() => setSelectedMetricCategory(null)}
            className="mr-3 text-blue-600 font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{category.title}</h1>
        </div>
        {/* ... rest of metric detail view */}
      </div>
    );
  };

  // Handle timeframe changes
  const handleTimeFrameChange = (tf: TimeFrame) => {
    setTimeFrame(tf);
  };

  // Handle metric category selection
  const handleMetricCategorySelect = (id: string) => {
    setSelectedMetricCategory(id);
  };

  const metrics = getMetrics(timeFrame);

  // If a metric category is selected, show detail view
  if (selectedMetricCategory) {
    const category = metricCategories.find(cat => cat.id === selectedMetricCategory);
    if (category) {
      return <MetricDetailView category={category} />;
    }
  }

  // Main Dashboard View
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header with back button */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={onBackToAICoach}
            className="mr-3 text-blue-600 font-medium flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Manual refresh button */}
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
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
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

      {/* Last refresh time */}
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

      {/* Dashboard content */}
      <div className="min-h-screen pb-20 overflow-y-auto bg-gradient-to-b from-gray-50 to-blue-50/30">
        {/* Timeframe selector */}
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

        {/* Key metrics grid */}
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

        {/* Metric categories */}
        <div className="px-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Grow Your Community</h2>
          <div className="grid grid-cols-2 gap-3">
            {metricCategories.map((category, index) => {
              const cardColors = [
                'bg-gradient-to-br from-emerald-100 to-blue-100 border-emerald-200',
                'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200',
                'bg-gradient-to-br from-orange-100 to-red-100 border-orange-200',
                'bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-200',
                'bg-gradient-to-br from-violet-100 to-purple-100 border-violet-200',
                'bg-gradient-to-br from-pink-100 to-rose-100 border-pink-200'
              ];
              return (
                <div key={category.id} className="h-full">
                  <ViewTracker
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
    </div>
  );
};

export default DashboardView;