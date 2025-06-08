// File: src/components/MobileDashboard.tsx (Updated with Post Sorting Toggles)

'use client';

import React, { useState, useEffect } from 'react';
import { Home, BarChart3, Bell, User, Plus, TrendingUp, Users, Heart, MessageCircle, Share, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';

// Import the improved services
import { MobileDataService } from '@/services/mobileDataService';
import { GrowthCalculationService } from '@/services/growthCalculationService';
import { HistoricalDataService } from '@/services/historicalDataService';

interface MobileDashboardProps {
  reportData?: any;
  instagramConnection?: any;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ reportData, instagramConnection }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [selectedMetricCategory, setSelectedMetricCategory] = useState<string | null>(null);
  const [growthAnalysis, setGrowthAnalysis] = useState<any>(null);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(false);
  const [transformedData, setTransformedData] = useState<any>(null);
  const [metricCategories, setMetricCategories] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [postSortType, setPostSortType] = useState<'recent' | 'top'>('recent');

  const historicalService = new HistoricalDataService();

  // Enhanced data transformation with historical context
  useEffect(() => {
    const transformData = async () => {
      if (reportData && user?.id) {
        console.log('🔄 Transforming data with historical context...');
        
        try {
          // Transform data with historical context
          const data = await MobileDataService.transformReportForMobile(reportData, user.id);
          setTransformedData(data);
          
          // Generate metric categories with enhanced colors
          const categories = await MobileDataService.generateMetricCategories(reportData, user.id);
          const enhancedCategories = categories.map((category: any) => ({
            ...category,
            ...getEnhancedCategoryStyle(category.id)
          }));
          setMetricCategories(enhancedCategories);
          
          // Set last sync time if available
          if (data?.profile.lastUpdated) {
            setLastSyncTime(data.profile.lastUpdated);
          }
          
        } catch (error) {
          console.error('Error transforming data:', error);
          // Fallback to basic transformation
          const data = await MobileDataService.transformReportForMobile(reportData);
          setTransformedData(data);
          const categories = await MobileDataService.generateMetricCategories(reportData);
          const enhancedCategories = categories.map((category: any) => ({
            ...category,
            ...getEnhancedCategoryStyle(category.id)
          }));
          setMetricCategories(enhancedCategories);
        }
      }
    };

    transformData();
  }, [reportData, user?.id]);

  // Enhanced growth analysis calculation
  useEffect(() => {
    const calculateGrowthAnalysis = async () => {
      if (!user?.id || !reportData) return;

      setIsLoadingGrowth(true);
      try {
        console.log('📊 Calculating enhanced growth analysis...');
        const analysis = await GrowthCalculationService.getComprehensiveGrowthAnalysis(user.id, reportData);
        setGrowthAnalysis(analysis);
        console.log('✅ Enhanced growth analysis completed:', analysis);
      } catch (error) {
        console.error('❌ Error calculating growth analysis:', error);
      } finally {
        setIsLoadingGrowth(false);
      }
    };

    calculateGrowthAnalysis();
  }, [user?.id, reportData]);

  // Enhanced category styling for meditation app feel
  const getEnhancedCategoryStyle = (categoryId: string) => {
    const styles = {
      'growth': {
        gradient: 'from-emerald-400 via-teal-500 to-green-600',
        bgGradient: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50',
        glassColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-200/50',
        textColor: 'text-emerald-900',
        emoji: '🌿',
        hoverScale: 'hover:scale-[1.02]'
      },
      'engagement': {
        gradient: 'from-blue-400 via-indigo-500 to-blue-600',
        bgGradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50',
        glassColor: 'bg-blue-500/10',
        borderColor: 'border-blue-200/50',
        textColor: 'text-blue-900',
        emoji: '🌊',
        hoverScale: 'hover:scale-[1.02]'
      },
      'reach': {
        gradient: 'from-orange-400 via-red-500 to-pink-600',
        bgGradient: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
        glassColor: 'bg-orange-500/10',
        borderColor: 'border-orange-200/50',
        textColor: 'text-orange-900',
        emoji: '🔥',
        hoverScale: 'hover:scale-[1.02]'
      },
      'timing': {
        gradient: 'from-purple-400 via-pink-500 to-purple-600',
        bgGradient: 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50',
        glassColor: 'bg-purple-500/10',
        borderColor: 'border-purple-200/50',
        textColor: 'text-purple-900',
        emoji: '💜',
        hoverScale: 'hover:scale-[1.02]'
      },
      'content': {
        gradient: 'from-cyan-400 via-blue-500 to-teal-600',
        bgGradient: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50',
        glassColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-200/50',
        textColor: 'text-cyan-900',
        emoji: '🌀',
        hoverScale: 'hover:scale-[1.02]'
      },
      'insights': {
        gradient: 'from-yellow-400 via-orange-500 to-amber-600',
        bgGradient: 'bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50',
        glassColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-200/50',
        textColor: 'text-yellow-900',
        emoji: '☀️',
        hoverScale: 'hover:scale-[1.02]'
      }
    };
    return styles[categoryId as keyof typeof styles] || styles.growth;
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    if (!user?.id || isRefreshing) return;

    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered...');
      
      // Call the user sync API
      const response = await fetch('/api/sync/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Manual sync completed:', result);
        
        // Refresh the data
        if (reportData) {
          const data = await MobileDataService.transformReportForMobile(reportData, user.id);
          setTransformedData(data);
          
          const categories = await MobileDataService.generateMetricCategories(reportData, user.id);
          const enhancedCategories = categories.map((category: any) => ({
            ...category,
            ...getEnhancedCategoryStyle(category.id)
          }));
          setMetricCategories(enhancedCategories);
          
          setLastSyncTime(new Date().toISOString().split('T')[0]);
        }
        
        // Track the manual refresh
        analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
          feature_name: 'manual_data_refresh',
          user_id: user.id,
          success: true,
          source: 'mobile_dashboard'
        });
        
      } else {
        console.error('Manual sync failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error in manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get metrics with enhanced historical data
  const getMetrics = (period: string) => {
    if (transformedData && growthAnalysis) {
      const { growthRates, postCounts, isRealData } = growthAnalysis;
      
      const periodGrowthRate = growthRates[period as keyof typeof growthRates] || 0;
      const periodPostCount = postCounts[period as keyof typeof postCounts] || 0;
      
      // Enhanced engagement calculation
      const baseEngagement = transformedData.metrics.engagement || 0;
      const engagementImprovement = growthAnalysis.engagementTrends?.improvement || 0;

      return {
        growth: `${periodGrowthRate >= 0 ? '+' : ''}${periodGrowthRate.toFixed(1)}%`,
        engagement: `${baseEngagement.toFixed(1)}%`,
        posts: periodPostCount.toString(),
        timeLabel: period === 'weekly' ? 'This Week' : 
                  period === 'monthly' ? 'This Month' : 'This Year',
        isRealData,
        engagementTrend: engagementImprovement > 0 ? '+' : '',
        lastUpdated: growthAnalysis.lastUpdated
      };
    }

    // Fallback data
    const data = {
      weekly: { growth: '+1.2%', engagement: '2.5%', posts: '0', timeLabel: 'This Week', isRealData: false },
      monthly: { growth: '+5.0%', engagement: '2.8%', posts: '0', timeLabel: 'This Month', isRealData: false },
      annual: { growth: '+60%', engagement: '3.2%', posts: '22', timeLabel: 'This Year', isRealData: false }
    };
    return data[period as keyof typeof data];
  };

  const DashboardContent = () => {
    const metrics = getMetrics(timeFrame);
    
    if (selectedMetricCategory) {
      const category = metricCategories.find(cat => cat.id === selectedMetricCategory);
      if (category) {
        return <MetricDetailView category={category} />;
      }
    }
    
    const followerCount = transformedData?.profile.followerCount || 12400;
    const username = transformedData?.profile.username || 'demo_account';
    const totalPosts = transformedData?.metrics.posts || 0;
    const hasHistoricalData = transformedData?.historicalContext?.hasHistoricalData || false;
    
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* Header with glassmorphism */}
        <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Social Sage
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 transition-all duration-200 hover:scale-110"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 text-blue-500 hover:text-blue-600 transition-all duration-200 hover:scale-110">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>



        {/* Time Frame Selector with glassmorphism */}
        <div className="p-4">
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-1 border border-white/20">
            {[
              { key: 'weekly', label: 'Weekly' },
              { key: 'monthly', label: 'Monthly' },
              { key: 'annual', label: 'Annual' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setTimeFrame(period.key)}
                className={`flex-1 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  timeFrame === period.key
                    ? 'bg-white/80 backdrop-blur-sm text-blue-600 shadow-lg shadow-blue-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/20'
                }`}
              >
                {period.label}
                {isLoadingGrowth && period.key === timeFrame && (
                  <span className="ml-1 animate-spin">⟳</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Key Metrics Display with glassmorphism - 2x2 Grid */}
        <div className="px-4 pb-4 mb-6">
          <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-xl shadow-blue-500/10">
            <div className="grid grid-cols-2 gap-4">
              {/* Followers */}
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {followerCount >= 1000 ? `${(followerCount / 1000).toFixed(1)}K` : followerCount.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 font-medium">Followers</div>
                {transformedData && (
                  <div className="text-xs text-gray-500">@{username}</div>
                )}
              </div>
              
              {/* Growth Rate with arrow and percentage */}
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                    {(() => {
                      // Extract the numeric value and calculate growth number
                      const growthPercent = parseFloat(metrics.growth.replace(/[+%]/g, ''));
                      const baseFollowers = followerCount || 12400;
                      const growthValue = Math.round((baseFollowers * growthPercent) / 100);
                      return growthValue >= 1000 ? `${(growthValue / 1000).toFixed(1)}K` : growthValue.toString();
                    })()}
                  </div>
                  <div className={`text-lg ${metrics.growth.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {metrics.growth.startsWith('+') ? '↗' : '↘'}
                  </div>
                </div>
                <div className="text-xs text-gray-600 font-medium">Growth Rate</div>
                <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                  <span>{metrics.growth}</span>
                  {metrics.isRealData && <span className="text-emerald-500">✨</span>}
                </div>
              </div>
              
              {/* Engagement */}
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                  {metrics.engagement}
                </div>
                <div className="text-xs text-gray-600 font-medium">Engagement</div>
                <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                  {transformedData?.historicalContext?.hasHistoricalData && <span className="text-purple-500">✨</span>}
                </div>
              </div>
              
              {/* Posts */}
              <div className="text-center bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {metrics.posts}
                </div>
                <div className="text-xs text-gray-600 font-medium">Posts</div>
                <div className="text-xs text-gray-500 flex items-center justify-center space-x-1">
                  <span>{metrics.timeLabel}</span>
                  {metrics.isRealData && <span className="text-blue-500">✨</span>}
                </div>
              </div>
            </div>
            
            {/* Enhanced data indicator */}
            {(growthAnalysis?.isRealData || transformedData?.historicalContext?.hasHistoricalData) && (
              <div className="mt-3 text-center">
                <span className="text-xs text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full font-medium">
                  ✨ Powered by {transformedData?.historicalContext?.hasHistoricalData ? 'historical insights' : 'live data'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Detailed Analytics Cards with individual colors */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Detailed Analytics
            </h2>
            {transformedData?.historicalContext?.hasHistoricalData && (
              <span className="text-xs text-emerald-600 bg-emerald-50/50 px-3 py-1 rounded-full font-medium">
                {transformedData.historicalContext.dataPoints} insights
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {metricCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedMetricCategory(category.id);
                  analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
                    feature_name: 'metric_category_viewed',
                    category_id: category.id,
                    source: 'mobile_dashboard',
                    user_id: user?.id,
                    has_real_data: !!transformedData,
                    has_historical_data: !!transformedData?.historicalContext?.hasHistoricalData
                  });
                }}
                className={`${category.bgGradient} ${category.glassColor} backdrop-blur-sm border ${category.borderColor} rounded-2xl p-4 shadow-lg transition-all duration-300 ${category.hoverScale} hover:shadow-xl text-left group`}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-xl">{category.emoji}</span>
                </div>
                <h3 className={`font-semibold ${category.textColor} text-sm mb-1`}>{category.title}</h3>
                <p className={`text-xs ${category.textColor}/70 leading-relaxed`}>{category.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs ${category.textColor} font-medium bg-white/30 px-2 py-1 rounded-full`}>
                    {category.metrics.length} insights →
                  </span>
                  {category.metrics.some((m: any) => m.isRealData) && (
                    <span className="text-xs">✨</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MetricDetailView = ({ category }: { category: any }) => (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center sticky top-0 z-10">
        <button 
          onClick={() => setSelectedMetricCategory(null)}
          className="mr-3 text-blue-500 font-medium hover:text-blue-600 transition-colors duration-200"
        >
          ← Back
        </button>
        <div className="flex items-center">
          <span className="mr-2">{category.emoji}</span>
          <h1 className={`text-xl font-bold ${category.textColor}`}>{category.title}</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className={`bg-gradient-to-r ${category.gradient} rounded-3xl p-6 text-white shadow-xl`}>
          <h2 className="text-lg font-bold mb-2">{category.title}</h2>
          <p className="text-white/90 text-sm leading-relaxed">{category.description}</p>
        </div>

        <div className="space-y-3">
          {category.metrics.map((metric: any, index: number) => (
            <div key={index} className="bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${category.textColor}`}>{metric.value}</span>
                  <div className={`w-3 h-3 rounded-full shadow-sm ${
                    metric.trend === 'up' ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 
                    metric.trend === 'down' ? 'bg-gradient-to-r from-red-400 to-pink-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  }`}></div>
                  {metric.isRealData && (
                    <span className="text-xs" title="Live data">✨</span>
                  )}
                </div>
              </div>
              <div className="h-12 bg-gradient-to-r from-gray-50/50 to-gray-100/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className={`w-6 h-6 ${
                  metric.trend === 'up' ? 'text-emerald-500' : 
                  metric.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
              </div>
              <div className="mt-2 text-xs text-gray-600">
                {metric.isRealData ? 'Based on your live data' : 
                 transformedData ? 'From current insights' : 
                 'Demo data - connect for personalized metrics'}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced AI Insights with glassmorphism */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-6 border border-blue-200/30">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
            <span className="mr-2">🧠</span>
            Mindful Insights
          </h3>
          <p className="text-blue-800 text-sm leading-relaxed">
            {getAIInsightForCategory(category.id, transformedData, growthAnalysis)}
          </p>
        </div>
      </div>
    </div>
  );

  // Enhanced AI insights
  const getAIInsightForCategory = (categoryId: string, data: any, growth: any) => {
    if (!data) {
      return "Connect your Instagram account to unlock personalized insights based on your unique content journey and audience engagement patterns.";
    }

    const hasHistoricalData = data.historicalContext?.hasHistoricalData;

    const insights = {
      'growth': hasHistoricalData 
        ? `Your mindful growth journey shows ${growth?.isRealData ? 'authentic' : 'steady'} weekly progress of ${growth?.growthRates?.weekly?.toFixed(1) || 0}%. This ${growth?.growthRates?.weekly > 2 ? 'flourishing growth reflects your authentic content resonance' : 'gentle expansion builds lasting community'}. With ${data.historicalContext.dataPoints} data points, we see your authentic growth story unfolding.`
        : `Your ${data.profile.followerCount.toLocaleString()} followers represent a growing community. Each connection is an opportunity for meaningful engagement. Historical insights will reveal your growth patterns after daily sync completion.`,
      'engagement': hasHistoricalData
        ? `Your ${data.metrics.engagement.toFixed(1)}% engagement rate ${data.metrics.engagement > 3 ? 'demonstrates exceptional authentic connection - well above the 1-3% norm' : data.metrics.engagement > 1.5 ? 'shows healthy community interaction with room for deeper connection' : 'offers beautiful potential for more meaningful engagement'}. ${data.metrics.avgComments > 15 ? 'Your community actively participates in conversations.' : 'Consider sharing more personal stories to invite deeper dialogue.'}`
        : `Your ${data.metrics.engagement.toFixed(1)}% engagement rate provides a foundation for growth. Historical tracking will reveal your audience's rhythms and preferences for more mindful content strategy.`
    };
    return insights[categoryId as keyof typeof insights] || insights.growth;
  };

  // Enhanced Posts content with meditation vibes and sorting toggles
  const PostsContent = () => {
    const recentPosts = transformedData?.recentPosts || [];
    
    // Sort posts based on selected toggle
    const sortedPosts = [...recentPosts].sort((a, b) => {
      if (postSortType === 'recent') {
        // Parse timestamps and sort by date (most recent first)
        const parseDate = (timestamp: string) => {
          // Handle various date formats
          if (!timestamp) return 0;
          
          // Handle relative time formats like "11mo ago", "2 days ago", etc.
          const match = timestamp.match(/(\d+)\s*([a-z]+)\s*ago/i);
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            const now = Date.now();
            
            // Convert to milliseconds
            let milliseconds = 0;
            if (unit.startsWith('s')) { // seconds
              milliseconds = value * 1000;
            } else if (unit.startsWith('mi') || unit === 'm') { // minutes (not months)
              milliseconds = value * 60 * 1000;
            } else if (unit.startsWith('h')) { // hours
              milliseconds = value * 60 * 60 * 1000;
            } else if (unit.startsWith('d')) { // days
              milliseconds = value * 24 * 60 * 60 * 1000;
            } else if (unit.startsWith('w')) { // weeks
              milliseconds = value * 7 * 24 * 60 * 60 * 1000;
            } else if (unit === 'mo' || unit.startsWith('mo')) { // months
              milliseconds = value * 30 * 24 * 60 * 60 * 1000;
            } else if (unit.startsWith('y')) { // years
              milliseconds = value * 365 * 24 * 60 * 60 * 1000;
            }
            
            return now - milliseconds;
          }
          
          // Try to parse as a regular date
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) return date.getTime();
          
          return 0;
        };
        
        const aTime = parseDate(a.timestamp);
        const bTime = parseDate(b.timestamp);
        
        // Sort by most recent first (higher timestamp value = more recent)
        return bTime - aTime;
      } else {
        // Sort by performance (best performing first)
        const performanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const aScore = performanceOrder[a.performance as keyof typeof performanceOrder] || 0;
        const bScore = performanceOrder[b.performance as keyof typeof performanceOrder] || 0;
        
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        
        // If performance is equal, sort by engagement metrics
        const aEngagement = (a.metrics?.likes || 0) + (a.metrics?.comments || 0) * 2 + (a.metrics?.shares || 0) * 3;
        const bEngagement = (b.metrics?.likes || 0) + (b.metrics?.comments || 0) * 2 + (b.metrics?.shares || 0) * 3;
        
        return bEngagement - aEngagement;
      }
    });
    
    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Content Journey
          </h1>
          
          {/* Toggle Buttons */}
          <div className="bg-white/30 backdrop-blur-md rounded-2xl p-1 border border-white/20">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setPostSortType('recent');
                  analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
                    feature_name: 'post_sort_toggle',
                    sort_type: 'recent',
                    source: 'mobile_dashboard',
                    user_id: user?.id
                  });
                }}
                className={`py-2 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  postSortType === 'recent'
                    ? 'bg-white/80 backdrop-blur-sm text-blue-600 shadow-lg shadow-blue-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/20'
                }`}
              >
                Recent Posts
              </button>
              <button
                onClick={() => {
                  setPostSortType('top');
                  analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
                    feature_name: 'post_sort_toggle',
                    sort_type: 'top',
                    source: 'mobile_dashboard',
                    user_id: user?.id
                  });
                }}
                className={`py-2 px-4 text-sm font-medium rounded-xl transition-all duration-300 ${
                  postSortType === 'top'
                    ? 'bg-white/80 backdrop-blur-sm text-purple-600 shadow-lg shadow-purple-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/20'
                }`}
              >
                Top Posts
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post: any, index: number) => {
              const postColors = [
                'from-emerald-400 to-teal-500',
                'from-blue-400 to-indigo-500',
                'from-purple-400 to-pink-500',
                'from-orange-400 to-red-500',
                'from-cyan-400 to-blue-500'
              ];
              const postColor = postColors[index % postColors.length];
              
              return (
                <div key={post.id} className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                  <div className="flex items-start space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${postColor} rounded-2xl flex-shrink-0 shadow-lg flex items-center justify-center`}>
                      {postSortType === 'top' && index < 3 && (
                        <span className="text-white text-lg font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{post.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-600 bg-white/50 px-2 py-1 rounded-full">{post.type}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{post.timestamp}</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                          post.performance === 'high' ? 'text-emerald-700 bg-emerald-100/70' : 
                          post.performance === 'medium' ? 'text-amber-700 bg-amber-100/70' : 'text-rose-700 bg-rose-100/70'
                        }`}>
                          {post.performance}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-sm font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                            {post.metrics.likes.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">Likes</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                            {post.metrics.comments}
                          </div>
                          <div className="text-xs text-gray-600">Comments</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {post.metrics.shares}
                          </div>
                          <div className="text-xs text-gray-600">Shares</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                            {post.metrics.reach}
                          </div>
                          <div className="text-xs text-gray-600">Reach</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 text-center border border-white/30 shadow-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                Your Content Journey Awaits
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                {transformedData 
                  ? 'No recent posts found in your Instagram data. Time to share your story!' 
                  : 'Connect your Instagram account to see your beautiful content journey unfold here.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // AI Insights Chatbot Content
  const AIInsightsContent = () => {
    const [chatStep, setChatStep] = useState<number>(1);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [selectedMetric, setSelectedMetric] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [conversation, setConversation] = useState<Array<{type: string, content: string}>>([]);

    interface Account {
      platform: string;
      username: string;
      connected: boolean;
      hasData: boolean;
      gradient: string;
      followers: number;
    }

    interface MetricOption {
      value: string;
      label: string;
      description: string;
      gradient: string;
    }

    const availableAccounts: Account[] = [
      {
        platform: 'Instagram',
        username: transformedData?.profile.username ? `@${transformedData.profile.username}` : '@demo_account',
        connected: !!transformedData,
        hasData: !!transformedData,
        gradient: 'from-pink-500 to-orange-500',
        followers: transformedData?.profile.followerCount || 12400
      },
      {
        platform: 'Twitter/X',
        username: '@socialsage_demo',
        connected: false,
        hasData: false,
        gradient: 'from-gray-800 to-black',
        followers: 0
      },
      {
        platform: 'LinkedIn',
        username: 'Social Sage Demo',
        connected: false,
        hasData: false,
        gradient: 'from-blue-600 to-blue-700',
        followers: 0
      }
    ];

    const metricOptions: MetricOption[] = [
      {
        value: 'growth',
        label: 'Follower Growth',
        description: 'Analyze follower trends and growth patterns',
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        value: 'engagement',
        label: 'Engagement Rate',
        description: 'Understand likes, comments, and shares',
        gradient: 'from-blue-500 to-indigo-600'
      },
      {
        value: 'reach',
        label: 'Content Reach',
        description: 'See how far your content travels',
        gradient: 'from-orange-500 to-red-600'
      },
      {
        value: 'timing',
        label: 'Posting Strategy',
        description: 'Optimize when and how often to post',
        gradient: 'from-purple-500 to-pink-600'
      },
      {
        value: 'content',
        label: 'Content Performance',
        description: 'Which content types work best',
        gradient: 'from-cyan-500 to-blue-600'
      }
    ];

    const resetChat = () => {
      setChatStep(1);
      setSelectedAccount(null);
      setSelectedMetric(null);
      setIsAnalyzing(false);
      setConversation([]);
    };

    const handleAccountSelect = (account: Account) => {
      setSelectedAccount(account);
      const newMessage = {
        type: 'user',
        content: `${account.platform} (${account.username})`
      };
      setConversation(prev => [...prev, newMessage]);
      setChatStep(2);
    };

    const handleMetricSelect = (metric: MetricOption) => {
      setSelectedMetric(metric);
      const newMessage = {
        type: 'user',
        content: metric.label
      };
      setConversation(prev => [...prev, newMessage]);
      setIsAnalyzing(true);
      setChatStep(3);
      
      // Simulate AI analysis
      setTimeout(() => {
        setIsAnalyzing(false);
        setChatStep(4);
      }, 2500);
    };

    const getHistoricalInsights = () => {
      const hasHistoricalData = transformedData?.historicalContext?.hasHistoricalData;
      const currentMetrics = {
        growth: {
          current: growthAnalysis?.growthRates?.weekly || 1.2,
          historical: hasHistoricalData ? 'increasing trend over 3 months' : 'baseline established',
          dataPoints: transformedData?.historicalContext?.dataPoints || 0
        },
        engagement: {
          current: transformedData?.metrics.engagement || 2.5,
          historical: hasHistoricalData ? 'steady improvement since last month' : 'current baseline',
          dataPoints: transformedData?.historicalContext?.dataPoints || 0
        },
        reach: {
          current: '15.3K',
          historical: hasHistoricalData ? 'peak reached 2 weeks ago' : 'establishing reach patterns',
          dataPoints: transformedData?.historicalContext?.dataPoints || 0
        },
        timing: {
          current: '7-9 PM optimal',
          historical: hasHistoricalData ? 'consistent pattern over 4 weeks' : 'initial analysis',
          dataPoints: transformedData?.historicalContext?.dataPoints || 0
        },
        content: {
          current: 'Reels performing +67%',
          historical: hasHistoricalData ? 'video content trending upward' : 'content type analysis',
          dataPoints: transformedData?.historicalContext?.dataPoints || 0
        }
      };

      return currentMetrics[selectedMetric?.value as keyof typeof currentMetrics] || currentMetrics.growth;
    };

    const getActionableAdvice = (): string[] => {
      const hasHistoricalData = transformedData?.historicalContext?.hasHistoricalData;
      const hasRealData = !!transformedData;
      const currentEngagement = transformedData?.metrics.engagement || 0;
      const followerCount = transformedData?.profile.followerCount || 0;
      const username = transformedData?.profile.username || 'your account';
      const totalPosts = transformedData?.metrics.posts || 0;
      const recentPosts = transformedData?.recentPosts || [];
      const currentGrowthRate = growthAnalysis?.growthRates?.weekly || 0;
      
      if (!hasRealData) {
        // Generic advice when no data is connected
        const genericAdvice = {
          growth: [
            "Connect your Instagram account to get personalized growth strategies based on your actual audience behavior",
            "Post consistently (3-5 times per week) to build momentum and audience expectations",
            "Use a mix of content types: 60% educational, 30% entertainment, 10% promotional",
            "Research and use 20-25 relevant hashtags to increase discoverability",
            "Engage authentically with accounts in your niche to build genuine connections"
          ],
          engagement: [
            "Connect your Instagram account to see which content types drive the most engagement for your audience",
            "Ask specific questions in your captions to encourage meaningful comments",
            "Create carousel posts with valuable tips or tutorials (they typically get 1.4x more engagement)",
            "Respond to comments within 2 hours to boost algorithm favor and build community",
            "Share behind-the-scenes content to create authentic connections with your audience"
          ],
          reach: [
            "Connect your Instagram to see when your specific audience is most active",
            "Use trending hashtags relevant to your niche (research them daily for best results)",
            "Create shareable content that provides value or entertainment",
            "Collaborate with accounts of similar size in your niche for mutual growth",
            "Optimize for Instagram's algorithm by posting when engagement is highest"
          ],
          timing: [
            "Connect your Instagram to discover your audience's peak activity times",
            "Test posting at different times and track which gets the most engagement",
            "Use scheduling tools to maintain consistency even during busy periods",
            "Consider your audience's time zones if you have international followers",
            "Aim for 1-2 posts per day maximum to avoid overwhelming your audience"
          ],
          content: [
            "Connect your Instagram to see which content formats perform best for your audience",
            "Video content (Reels) typically gets 22% more reach than static posts",
            "Develop 3-5 content pillars that align with your brand and audience interests",
            "Repurpose your best content into different formats (post → reel → story)",
            "Create content series to keep your audience coming back for more"
          ]
        };
        return genericAdvice[selectedMetric?.value as keyof typeof genericAdvice] || genericAdvice.growth;
      }

      // Personalized advice based on actual data
      const personalizedAdvice = {
        growth: [
          `Your current growth rate is ${currentGrowthRate >= 0 ? '+' : ''}${currentGrowthRate.toFixed(1)}% weekly. ${
            currentGrowthRate > 2 ? 'This is excellent! Maintain your current strategy and consider scaling up content production.' :
            currentGrowthRate > 0.5 ? 'This is steady growth. Focus on increasing engagement to accelerate follower acquisition.' :
            'Growth has slowed. Try posting more consistently and engaging with your community within 1 hour of posting.'
          }`,
          
          `With ${followerCount.toLocaleString()} followers, ${
            followerCount < 1000 ? 'focus on reaching 1K by posting daily and using 25 targeted hashtags. Your small size allows for more personal engagement.' :
            followerCount < 10000 ? 'you\'re in the sweet spot for high engagement. Collaborate with accounts of similar size (1K-10K) for maximum impact.' :
            followerCount < 100000 ? 'leverage your established audience by creating more video content and launching live sessions for deeper connection.' :
            'your large following gives you influence. Focus on thought leadership content and strategic partnerships.'
          }`,
          
          `${hasHistoricalData ? 
            'Your historical data shows your audience is most responsive to consistent posting. Try maintaining a schedule of posts every 2-3 days.' :
            `You've posted ${totalPosts} times. Aim for 3-5 posts per week to build momentum without overwhelming your audience.`
          }`,
          
          `${recentPosts.length > 0 ? 
            `Your recent ${recentPosts[0]?.type || 'content'} posts are performing ${recentPosts[0]?.performance || 'well'}. Create more similar content to capitalize on this trend.` :
            'Start posting regularly to establish patterns in your content performance and audience engagement.'
          }`,
          
          `Profile optimization: ${
            followerCount > 0 ? 'Your bio is driving followers, but consider adding a clear call-to-action to convert visitors into engaged followers.' :
            'Ensure your bio clearly states your value proposition and includes relevant keywords for discoverability.'
          }`
        ],

        engagement: [
          `Your current engagement rate is ${currentEngagement.toFixed(1)}%. ${
            currentEngagement > 6 ? 'This is exceptional! You\'re in the top 10% of creators. Focus on maintaining this quality.' :
            currentEngagement > 3 ? 'This is above average (industry average is 1-3%). Keep creating content that resonates with your audience.' :
            currentEngagement > 1 ? 'This is within normal range but has room for improvement. Try asking more questions in your captions.' :
            'This is below average. Focus on creating more engaging content that sparks conversation and provides clear value.'
          }`,
          
          `${hasHistoricalData ? 
            'Your engagement patterns show peak activity when you post educational content. Create more tutorials, tips, and how-to posts.' :
            'Start tracking which types of posts get the most comments and likes to identify your audience\'s preferences.'
          }`,
          
          `With ${followerCount.toLocaleString()} followers, aim for ${Math.round(followerCount * 0.03)} likes and ${Math.round(followerCount * 0.005)} comments per post to maintain healthy engagement rates.`,
          
          `${recentPosts.length > 0 && recentPosts.some((post: any) => post.metrics?.comments > 10) ?
            'Your posts that get comments are performing well. Respond to every comment within 2 hours to boost algorithm favor.' :
            'To increase comments, end your captions with specific questions or create "this or that" style posts that are easy to answer.'
          }`,
          
          `${currentEngagement < 2 ? 
            'Consider creating more video content (Reels) as they typically get 2-3x more engagement than static posts for accounts your size.' :
            'Your engagement is solid. Focus on building deeper connections by sharing more personal stories and behind-the-scenes content.'
          }`
        ],

        reach: [
          `${hasHistoricalData ? 
            'Your historical reach data shows posts with educational content travel furthest. Create more "how-to" and tip-based posts.' :
            'Start using Instagram Insights to track which posts reach the most accounts beyond your followers.'
          }`,
          
          `For an account with ${followerCount.toLocaleString()} followers, aim to reach ${Math.round(followerCount * 1.5).toLocaleString()} accounts per post through strategic hashtag use.`,
          
          `${recentPosts.length > 0 ? 
            `Your ${recentPosts[0]?.type || 'recent'} content is reaching ${recentPosts[0]?.metrics?.reach || 'people'}. ${
              recentPosts[0]?.performance === 'high' ? 'This format is working well - create more similar content.' :
              'Try converting this into Reel format for 40% more reach potential.'
            }` :
            'Post consistently to build reach momentum. Instagram favors accounts that post regularly.'
          }`,
          
          `${followerCount > 5000 ? 
            'Your larger following means hashtags are less critical. Focus on creating shareable content that your audience will repost.' :
            'Use 20-25 hashtags per post, mixing popular (100K+ posts) with niche (10K-100K posts) tags for maximum discoverability.'
          }`,
          
          `${currentEngagement > 3 ?
            'Your high engagement signals quality to Instagram\'s algorithm. Your content is likely being shown to more people organically.' :
            'Improve engagement first (comments, saves, shares) as this directly impacts how far Instagram distributes your content.'
          }`
        ],

        timing: [
          `${hasHistoricalData ? 
            'Your historical data shows your audience is most active between 7-9 PM on weekdays and 2-4 PM on weekends. Schedule posts during these windows.' :
            'Track your Instagram Insights for 2 weeks to identify when your specific audience is most active, then post during those peak times.'
          }`,
          
          `With ${followerCount.toLocaleString()} followers, consistency matters more than perfection. ${
            totalPosts > 50 ? 'You\'ve established a posting rhythm. Maintain your current schedule for best results.' :
            'Aim for 3-4 posts per week to build audience expectations and algorithm favor.'
          }`,
          
          `${recentPosts.length > 2 ? 
            `Your recent posts show ${recentPosts[0]?.timestamp ? 'varying' : 'inconsistent'} timing. Create a content calendar to plan posts for your peak engagement hours.` :
            'Start posting at the same times each day to train your audience when to expect new content.'
          }`,
          
          `${followerCount > 10000 ? 
            'Your large audience likely spans multiple time zones. Post during 7-9 PM EST to capture both US coasts effectively.' :
            'Focus on when your core audience is active rather than trying to reach all time zones - quality engagement beats broad reach.'
          }`,
          
          `${currentEngagement > 2 ? 
            'Your engagement timing is working well. Maintain your current posting schedule while testing one new time slot per week.' :
            'Try posting 2 hours earlier or later than usual and compare engagement rates to optimize your timing strategy.'
          }`
        ],

        content: [
          `${recentPosts.length > 0 ? 
            `Your ${recentPosts.filter((p: any) => p.performance === 'high').length > 0 ? 'high-performing' : 'recent'} posts show ${
              recentPosts[0]?.type === 'Reel' ? 'video content works well for your audience. Create 60% video, 40% static content.' :
              recentPosts[0]?.type === 'Carousel' ? 'carousel posts engage your audience well. Create more multi-slide educational content.' :
              'static posts are your current format. Try adding more video content for 2-3x better reach.'
            }` :
            'Start experimenting with different content types (Reels, carousels, single posts) to see what resonates with your audience.'
          }`,
          
          `Based on ${followerCount.toLocaleString()} followers, create content that ${
            followerCount < 1000 ? 'showcases your personality and expertise. Personal stories perform well with smaller, engaged audiences.' :
            followerCount < 10000 ? 'provides clear value - tutorials, tips, and actionable advice work best for growing accounts.' :
            followerCount < 100000 ? 'establishes thought leadership. Share insights, industry trends, and behind-the-scenes content.' :
            'influences and inspires. Your large platform should focus on bigger picture content and community building.'
          }`,
          
          `${currentEngagement > 3 ? 
            'Your high engagement indicates your content style resonates well. Double down on your current approach while testing one new format weekly.' :
            'Experiment with content that encourages interaction: polls in stories, "save this post" carousels, and question-prompting captions.'
          }`,
          
          `${hasHistoricalData ? 
            'Your data shows educational content performs 40% better than promotional posts. Maintain an 80/20 value-to-promotion ratio.' :
            'Follow the 80/20 rule: 80% valuable content (education, entertainment, inspiration) and 20% promotional content.'
          }`,
          
          `Content planning: ${
            totalPosts > 30 ? 'You\'ve posted consistently. Analyze your top 5 performing posts and create similar content to replicate success.' :
            'Create content pillars (3-5 main themes) to ensure variety while maintaining focus on your niche and audience interests.'
          }`
        ]
      };

      return personalizedAdvice[selectedMetric?.value as keyof typeof personalizedAdvice] || personalizedAdvice.growth;
    };

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Insights
          </h1>
          {chatStep > 1 && (
            <button 
              onClick={resetChat}
              className="text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-full font-medium hover:shadow-lg transition-all duration-200"
            >
              New Chat
            </button>
          )}
        </div>

        {/* Chat Container */}
        <div className="p-4 space-y-4 pb-20">
          
          {/* AI Welcome Message */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-white/30 shadow-lg max-w-xs">
              <p className="text-gray-800 text-sm leading-relaxed">
                Hi! I'm your AI insights assistant. I'll analyze your social media data and provide personalized recommendations to help you grow.
              </p>
            </div>
          </div>

          {/* Step 1: Account Selection */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-white/30 shadow-lg flex-1">
              <p className="text-gray-800 text-sm mb-3 leading-relaxed">
                Which account would you like me to analyze today?
              </p>
              
              {chatStep === 1 && (
                <div className="space-y-3">
                  {availableAccounts.map((account, index) => (
                    <button
                      key={index}
                      onClick={() => account.connected ? handleAccountSelect(account) : null}
                      disabled={!account.connected}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ${
                        account.connected 
                          ? 'border-white/40 bg-white/30 hover:bg-white/50 hover:scale-[1.02]' 
                          : 'border-gray-200/30 bg-gray-50/30 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${account.gradient} rounded-xl shadow-lg flex items-center justify-center`}>
                          <span className="text-white text-xs font-bold">
                            {account.platform === 'Instagram' ? 'IG' :
                             account.platform === 'Twitter/X' ? 'X' :
                             account.platform === 'LinkedIn' ? 'IN' : '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{account.platform}</div>
                          <div className="text-xs text-gray-600">{account.username}</div>
                          {account.connected && account.followers > 0 && (
                            <div className="text-xs text-gray-500">
                              {account.followers >= 1000 ? `${(account.followers / 1000).toFixed(1)}K` : account.followers} followers
                            </div>
                          )}
                        </div>
                        {account.connected && (
                          <div className="text-xs bg-emerald-100/70 text-emerald-700 px-2 py-1 rounded-full">
                            Connected
                          </div>
                        )}
                        {!account.connected && (
                          <div className="text-xs text-gray-500">Not connected</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User's Account Selection Response */}
          {conversation.length > 0 && conversation[0] && (
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-md p-3 shadow-lg max-w-xs">
                <p className="text-sm">{conversation[0].content}</p>
              </div>
            </div>
          )}

          {/* Step 2: Metric Selection */}
          {chatStep >= 2 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-white/30 shadow-lg flex-1">
                <p className="text-gray-800 text-sm mb-3 leading-relaxed">
                  Perfect! What metric would you like me to focus on for your {selectedAccount?.platform} analysis?
                </p>
                
                {chatStep === 2 && (
                  <div className="space-y-2">
                    {metricOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleMetricSelect(option)}
                        className="w-full text-left p-3 rounded-xl border border-white/40 bg-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 bg-gradient-to-br ${option.gradient} rounded-lg shadow-lg`}></div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                            <div className="text-xs text-gray-600">{option.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User's Metric Selection Response */}
          {conversation.length > 1 && conversation[1] && (
            <div className="flex justify-end">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-md p-3 shadow-lg max-w-xs">
                <p className="text-sm">{conversation[1].content}</p>
              </div>
            </div>
          )}

          {/* Step 3: AI Analysis */}
          {chatStep === 3 && isAnalyzing && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-white/30 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-800 text-sm">Analyzing your {selectedMetric?.label?.toLowerCase()} data...</p>
                </div>
                <p className="text-gray-600 text-xs mt-2">This may take a moment while I review your historical patterns.</p>
              </div>
            </div>
          )}

          {/* Step 4: AI Insights & Recommendations */}
          {chatStep === 4 && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl rounded-tl-md p-4 border border-white/30 shadow-lg flex-1">
                {(() => {
                  const insights = getHistoricalInsights();
                  const advice = getActionableAdvice();
                  const hasHistoricalData = transformedData?.historicalContext?.hasHistoricalData;

                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          📊 {selectedMetric?.label} Analysis
                        </h3>
                        
                        {/* Current Performance */}
                        <div className="bg-blue-50/50 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-blue-900 text-sm mb-1">Current Performance</h4>
                          <p className="text-blue-800 text-xs">
                            Your {selectedMetric?.label?.toLowerCase()} is at {insights.current}
                            {hasHistoricalData && ` with ${insights.historical}`}
                          </p>
                          {hasHistoricalData && (
                            <p className="text-blue-700 text-xs mt-1">
                              Based on {insights.dataPoints} data points collected over time
                            </p>
                          )}
                        </div>

                        {/* Historical Context */}
                        <div className="bg-emerald-50/50 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-emerald-900 text-sm mb-1">Historical Trends</h4>
                          <p className="text-emerald-800 text-xs">
                            {hasHistoricalData 
                              ? `Your ${selectedMetric?.label?.toLowerCase()} shows ${insights.historical}. This gives us valuable insights into what's working for your audience.`
                              : `We're building your historical baseline. After a few days of data collection, I'll be able to show you trends and patterns specific to your account.`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Actionable Recommendations */}
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm mb-2">🎯 Actionable Recommendations</h4>
                        <div className="space-y-2">
                          {advice.map((tip: string, index: number) => (
                            <div key={index} className="flex items-start space-x-2">
                              <div className="w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                <span className="text-white text-xs font-bold">{index + 1}</span>
                              </div>
                              <p className="text-gray-700 text-xs leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <button 
                          onClick={resetChat}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg py-2 text-xs font-medium hover:shadow-lg transition-all duration-200"
                        >
                          Analyze Another Metric
                        </button>
                        <button className="px-3 py-2 bg-white/50 text-gray-600 rounded-lg text-xs hover:bg-white/70 transition-all duration-200">
                          Save Report
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  // Smart Notifications Content with real insights
  const NotificationsContent = () => {
    const hasData = !!transformedData;
    const hasHistoricalData = transformedData?.historicalContext?.hasHistoricalData;
    
    // Generate smart notifications based on data
    const generateSmartNotifications = () => {
      const notifications = [];
      const currentHour = new Date().getHours();
      const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
      
      if (hasData) {
        const engagement = transformedData.metrics.engagement || 0;
        const followerCount = transformedData.profile.followerCount || 0;
        const recentPosts = transformedData.recentPosts || [];
        
        // Best time to post notifications
        if (hasHistoricalData) {
          notifications.push({
            id: 1,
            type: 'timing',
            priority: 'high',
            icon: '⏰',
            title: 'Optimal Posting Window',
            message: 'Your audience is most active between 7-9 PM today. Perfect time to share your next post!',
            timeAgo: '2 min ago',
            actionable: true,
            gradient: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50/50'
          });
        } else {
          notifications.push({
            id: 1,
            type: 'timing',
            priority: 'medium',
            icon: '📊',
            title: 'Building Your Posting Schedule',
            message: 'We\'re analyzing your audience activity. Check back tomorrow for personalized timing insights!',
            timeAgo: '1 hour ago',
            actionable: false,
            gradient: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-50/50'
          });
        }

        // Engagement insights
        if (engagement > 3) {
          notifications.push({
            id: 2,
            type: 'engagement',
            priority: 'high',
            icon: '🔥',
            title: 'Engagement on Fire!',
            message: `Your ${engagement.toFixed(1)}% engagement rate is crushing it! Keep posting similar content to maintain momentum.`,
            timeAgo: '15 min ago',
            actionable: true,
            gradient: 'from-red-500 to-pink-600',
            bgColor: 'bg-red-50/50'
          });
        } else if (engagement > 1.5) {
          notifications.push({
            id: 2,
            type: 'engagement',
            priority: 'medium',
            icon: '📈',
            title: 'Solid Engagement Growth',
            message: `Your ${engagement.toFixed(1)}% engagement is growing! Try asking questions in your captions to boost comments.`,
            timeAgo: '30 min ago',
            actionable: true,
            gradient: 'from-emerald-500 to-green-600',
            bgColor: 'bg-emerald-50/50'
          });
        } else {
          notifications.push({
            id: 2,
            type: 'engagement',
            priority: 'medium',
            icon: '💡',
            title: 'Boost Your Engagement',
            message: 'Try posting behind-the-scenes content and stories to increase audience interaction.',
            timeAgo: '45 min ago',
            actionable: true,
            gradient: 'from-yellow-500 to-orange-600',
            bgColor: 'bg-yellow-50/50'
          });
        }

        // Content performance insights
        if (recentPosts.length > 0) {
          const highPerformingPosts = recentPosts.filter((post: any) => post.performance === 'high');
          if (highPerformingPosts.length > 0) {
            notifications.push({
              id: 3,
              type: 'content',
              priority: 'high',
              icon: '✨',
              title: 'Content That Works',
              message: `Your ${highPerformingPosts[0].type} posts are performing exceptionally well. Create more similar content!`,
              timeAgo: '1 hour ago',
              actionable: true,
              gradient: 'from-purple-500 to-pink-600',
              bgColor: 'bg-purple-50/50'
            });
          }
        }

        // Follower growth insights
        if (growthAnalysis?.growthRates?.weekly > 2) {
          notifications.push({
            id: 4,
            type: 'growth',
            priority: 'high',
            icon: '🚀',
            title: 'Explosive Growth!',
            message: `You're gaining followers ${growthAnalysis.growthRates.weekly.toFixed(1)}% faster than average. Your content strategy is working!`,
            timeAgo: '2 hours ago',
            actionable: false,
            gradient: 'from-green-500 to-emerald-600',
            bgColor: 'bg-green-50/50'
          });
        }

        // Reach optimization
        notifications.push({
          id: 5,
          type: 'reach',
          priority: 'medium',
          icon: '🌍',
          title: 'Expand Your Reach',
          message: 'Use trending hashtags #DigitalMarketing #ContentCreator to reach 2.5x more people.',
          timeAgo: '3 hours ago',
          actionable: true,
          gradient: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50/50'
        });

        // Weekly trends
        if (currentDay === 1) { // Monday
          notifications.push({
            id: 6,
            type: 'trends',
            priority: 'medium',
            icon: '📊',
            title: 'Weekly Trends Report',
            message: 'Motivational Monday posts get 40% more engagement. Share your weekly goals!',
            timeAgo: '4 hours ago',
            actionable: true,
            gradient: 'from-indigo-500 to-purple-600',
            bgColor: 'bg-indigo-50/50'
          });
        }

        // Consistency reminder
        const daysSinceLastPost = Math.floor(Math.random() * 3) + 1; // Mock data
        if (daysSinceLastPost > 2) {
          notifications.push({
            id: 7,
            type: 'consistency',
            priority: 'medium',
            icon: '📅',
            title: 'Stay Consistent',
            message: `It's been ${daysSinceLastPost} days since your last post. Consistent posting increases reach by 30%.`,
            timeAgo: '6 hours ago',
            actionable: true,
            gradient: 'from-orange-500 to-red-600',
            bgColor: 'bg-orange-50/50'
          });
        }

      } else {
        // Default notifications when no data is connected
        notifications.push({
          id: 1,
          type: 'setup',
          priority: 'high',
          icon: '🔗',
          title: 'Connect Your Instagram',
          message: 'Link your Instagram account to start receiving personalized growth insights and optimal posting times.',
          timeAgo: 'Now',
          actionable: true,
          gradient: 'from-blue-500 to-purple-600',
          bgColor: 'bg-blue-50/50'
        });
      }

      return notifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
      });
    };

    const notifications = generateSmartNotifications();

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Insights
            </h1>
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {notifications.length} new
            </div>
          </div>
          
          {hasData && (
            <div className="mt-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-200/30 rounded-xl p-2">
              <p className="text-emerald-800 text-xs text-center font-medium">
                ✨ AI-powered insights from your Instagram data
                {hasHistoricalData && <span className="block">📈 Enhanced with historical patterns</span>}
              </p>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-4 space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${notification.bgColor} backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className={`w-10 h-10 bg-gradient-to-r ${notification.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <span className="text-lg">{notification.icon}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                      {notification.priority === 'high' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed mb-2">
                    {notification.message}
                  </p>
                  
                  {/* Action buttons */}
                  {notification.actionable && (
                    <div className="flex items-center space-x-2 mt-3">
                      <button className={`bg-gradient-to-r ${notification.gradient} text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:shadow-lg transition-all duration-200`}>
                        {notification.type === 'timing' ? 'Set Reminder' :
                         notification.type === 'content' ? 'View Details' :
                         notification.type === 'setup' ? 'Connect Now' :
                         'Take Action'}
                      </button>
                      <button className="text-gray-500 text-xs px-2 py-1.5 hover:text-gray-700 transition-colors">
                        Dismiss
                      </button>
                    </div>
                  )}
                  
                  {/* Category tag */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs bg-gradient-to-r ${notification.gradient} bg-clip-text text-transparent font-medium capitalize`}>
                      {notification.type === 'timing' ? '⏰ Optimal Timing' :
                       notification.type === 'engagement' ? '💬 Engagement' :
                       notification.type === 'content' ? '📝 Content Strategy' :
                       notification.type === 'growth' ? '📈 Growth' :
                       notification.type === 'reach' ? '🌍 Reach' :
                       notification.type === 'trends' ? '📊 Trends' :
                       notification.type === 'consistency' ? '📅 Consistency' :
                       '🔗 Setup'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Smart Insights Footer */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-6 border border-blue-200/30 mt-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">🧠</span>
              AI Growth Assistant
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed mb-3">
              {hasData 
                ? `Based on your ${transformedData.profile.followerCount.toLocaleString()} followers and ${transformedData.metrics.posts || 0} posts, here are your personalized growth recommendations.`
                : 'Connect your Instagram account to unlock personalized AI insights that will help you grow faster and engage better with your audience.'
              }
            </p>
            {hasData && (
              <div className="text-xs text-blue-700 bg-blue-100/50 px-3 py-2 rounded-lg">
                💡 Pro Tip: Check back daily for fresh insights as we analyze your latest posts and engagement patterns!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Profile Content with meditation app aesthetic
  const ProfileContent = () => {
    const userProfile = {
      name: transformedData?.profile.username ? `@${transformedData.profile.username}` : 'Demo User',
      role: 'Content Creator',
      plan: 'Premium Plan',
      avatar: transformedData?.profile.profilePicture || null,
      followerCount: transformedData?.profile.followerCount || 12400,
      joinDate: 'March 2024'
    };

    const connectedAccounts = [
      {
        platform: 'Instagram',
        username: transformedData?.profile.username ? `@${transformedData.profile.username}` : '@demo_account',
        connected: !!transformedData,
        gradient: 'from-pink-500 to-orange-500',
        bgColor: 'bg-pink-50/50',
        borderColor: 'border-pink-200/30'
      },
      {
        platform: 'Twitter/X',
        username: '@socialsage_demo',
        connected: false,
        gradient: 'from-gray-800 to-black',
        bgColor: 'bg-gray-50/50',
        borderColor: 'border-gray-200/30'
      },
      {
        platform: 'LinkedIn',
        username: 'Social Sage Demo',
        connected: false,
        gradient: 'from-blue-600 to-blue-700',
        bgColor: 'bg-blue-50/50',
        borderColor: 'border-blue-200/30'
      },
      {
        platform: 'TikTok',
        username: '@socialsage_demo',
        connected: false,
        gradient: 'from-red-500 to-pink-600',
        bgColor: 'bg-red-50/50',
        borderColor: 'border-red-200/30'
      }
    ];

    const settingsOptions = [
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Manage your alert preferences',
        icon: 'N',
        gradient: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50/50'
      },
      {
        id: 'privacy',
        title: 'Privacy & Security',
        description: 'Control your data and privacy',
        icon: 'P',
        gradient: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50/50'
      },
      {
        id: 'billing',
        title: 'Billing & Subscription',
        description: 'Manage your premium plan',
        icon: 'B',
        gradient: 'from-purple-500 to-pink-600',
        bgColor: 'bg-purple-50/50'
      },
      {
        id: 'help',
        title: 'Help & Support',
        description: 'Get assistance and tutorials',
        icon: 'H',
        gradient: 'from-orange-500 to-red-600',
        bgColor: 'bg-orange-50/50'
      },
      {
        id: 'about',
        title: 'About Social Sage',
        description: 'App info and feedback',
        icon: 'A',
        gradient: 'from-cyan-500 to-blue-600',
        bgColor: 'bg-cyan-50/50'
      }
    ];

    const stats = [
      {
        label: 'Total Posts',
        value: transformedData?.metrics.posts || '156',
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        label: 'Avg Engagement',
        value: transformedData?.metrics.engagement ? `${transformedData.metrics.engagement.toFixed(1)}%` : '4.2%',
        gradient: 'from-blue-500 to-indigo-600'
      },
      {
        label: 'Growth Rate',
        value: growthAnalysis?.growthRates?.monthly ? `+${growthAnalysis.growthRates.monthly.toFixed(1)}%` : '+8.5%',
        gradient: 'from-purple-500 to-pink-600'
      }
    ];

    return (
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3 sticky top-0 z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Profile
          </h1>
        </div>

        <div className="p-4 space-y-4">
          {/* Profile Header Card */}
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {userProfile.name}
                </h2>
                <p className="text-gray-600 text-sm">{userProfile.role}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 rounded-full font-medium">
                    {userProfile.plan}
                  </span>
                  <span className="text-xs text-gray-500">Since {userProfile.joinDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
            <h3 className="font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Connected Accounts
            </h3>
            <div className="space-y-3">
              {connectedAccounts.map((account, index) => (
                <div key={index} className={`${account.bgColor} backdrop-blur-sm rounded-2xl p-4 border ${account.borderColor} transition-all duration-300 hover:scale-[1.01]`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${account.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-xs font-bold">
                          {account.platform === 'Instagram' ? 'IG' :
                           account.platform === 'Twitter/X' ? 'X' :
                           account.platform === 'LinkedIn' ? 'IN' :
                           account.platform === 'TikTok' ? 'TT' : '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{account.platform}</div>
                        <div className="text-xs text-gray-600">{account.username}</div>
                      </div>
                    </div>
                    <button className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      account.connected 
                        ? 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-200/70' 
                        : `bg-gradient-to-r ${account.gradient} text-white hover:shadow-lg`
                    }`}>
                      {account.connected ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                  {account.connected && transformedData && (
                    <div className="mt-2 text-xs text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-lg">
                      Live data syncing enabled
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Preferences */}
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
            <h3 className="font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Settings & Preferences
            </h3>
            <div className="space-y-3">
              {settingsOptions.map((setting) => (
                <button
                  key={setting.id}
                  className={`w-full ${setting.bgColor} backdrop-blur-sm rounded-2xl p-4 border border-white/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg text-left group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${setting.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-white text-sm font-semibold">{setting.icon}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{setting.title}</div>
                        <div className="text-xs text-gray-600">{setting.description}</div>
                      </div>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      <span className="text-lg">›</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 border border-white/30 shadow-xl">
            <h3 className="font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
              Account Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-3 px-4 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                Upgrade to Premium+
              </button>
              <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl py-3 px-4 font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                Export Analytics Data
              </button>
              <button className="w-full bg-white/60 backdrop-blur-sm border border-red-200/50 text-red-600 rounded-2xl py-3 px-4 font-medium hover:bg-red-50/50 transition-all duration-300">
                Sign Out
              </button>
            </div>
          </div>

          {/* App Info Footer */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-6 border border-blue-200/30">
            <div className="text-center">
              <h4 className="font-semibold text-blue-900 mb-2">Social Sage</h4>
              <p className="text-blue-800 text-sm mb-3">
                Your mindful companion for social media growth
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-blue-700">
                <span>Version 2.1.0</span>
                <span>•</span>
                <button className="hover:text-blue-900 transition-colors">Privacy Policy</button>
                <span>•</span>
                <button className="hover:text-blue-900 transition-colors">Terms</button>
              </div>
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
        return <ProfileContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col backdrop-blur-sm border border-white/20">
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <span>Social Sage</span>
        <span>100%</span>
      </div>

      {renderContent()}

      {/* Enhanced Bottom Navigation with glassmorphism */}
      <div className="bg-white/70 backdrop-blur-md border-t border-white/20 px-2 py-2 flex justify-around items-center safe-area-pb">
        {[
          { id: 'dashboard', icon: Home, label: 'Dashboard', gradient: 'from-blue-500 to-indigo-500' },
          { id: 'posts', icon: BarChart3, label: 'Posts', gradient: 'from-emerald-500 to-teal-500' },
          { id: 'insights', icon: TrendingUp, label: 'AI Insights', gradient: 'from-yellow-500 to-orange-500' },
          { id: 'notifications', icon: Bell, label: 'Notifications', gradient: 'from-purple-500 to-pink-500' },
          { id: 'profile', icon: User, label: 'Profile', gradient: 'from-cyan-500 to-blue-500' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
                feature_name: 'mobile_tab_navigation',
                tab_name: tab.id,
                source: 'mobile_dashboard',
                user_id: user?.id,
                has_real_data: !!transformedData,
                has_historical_data: !!transformedData?.historicalContext?.hasHistoricalData
              });
            }}
            className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-2xl transition-all duration-300 hover:scale-105 ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
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

export default MobileDashboard;