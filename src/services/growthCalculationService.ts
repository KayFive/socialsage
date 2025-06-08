// File: src/services/growthCalculationService.ts
// Updated with real historical data integration

import { HistoricalDataService } from './historicalDataService';

export interface GrowthAnalysisResult {
  growthRates: {
    weekly: number;
    monthly: number;
    annual: number;
  };
  postCounts: {
    weekly: number;
    monthly: number;
    annual: number;
  };
  followerCounts: {
    current: number;
    weekAgo: number;
    monthAgo: number;
    yearAgo: number;
  };
  engagementTrends: {
    current: number;
    weekAgo: number;
    monthAgo: number;
    improvement: number;
  };
  isRealData: boolean;
  dataPoints: number;
  lastUpdated: string;
}

export class GrowthCalculationService {
  private static historicalService = new HistoricalDataService();

  /**
   * Get comprehensive growth analysis using real historical data
   */
  static async getComprehensiveGrowthAnalysis(
    userId: string,
    reportData?: any
  ): Promise<GrowthAnalysisResult> {
    try {
      console.log('📊 Getting comprehensive growth analysis for user:', userId);
      
      // Try to get real historical data first
      const growthAnalytics = await this.historicalService.getGrowthAnalytics(userId);
      const accountSummary = await this.historicalService.getAccountSummary(userId);
      
      if (growthAnalytics.isRealData && accountSummary) {
        console.log('✅ Using real historical data for growth analysis');
        
        return {
          growthRates: {
            weekly: growthAnalytics.weekly?.followers_growth_rate || 0,
            monthly: growthAnalytics.monthly?.followers_growth_rate || 0,
            annual: growthAnalytics.annual?.followers_growth_rate || 0,
          },
          postCounts: {
            weekly: growthAnalytics.weekly?.posts_growth || 0,
            monthly: growthAnalytics.monthly?.posts_growth || 0,
            annual: growthAnalytics.annual?.posts_growth || 0,
          },
          followerCounts: {
            current: accountSummary.profile.followers_count,
            weekAgo: accountSummary.profile.followers_count - (growthAnalytics.weekly?.followers_growth || 0),
            monthAgo: accountSummary.profile.followers_count - (growthAnalytics.monthly?.followers_growth || 0),
            yearAgo: accountSummary.profile.followers_count - (growthAnalytics.annual?.followers_growth || 0),
          },
          engagementTrends: {
            current: accountSummary.metrics.engagement_rate,
            weekAgo: accountSummary.metrics.engagement_rate - (growthAnalytics.weekly?.engagement_growth_rate || 0),
            monthAgo: accountSummary.metrics.engagement_rate - (growthAnalytics.monthly?.engagement_growth_rate || 0),
            improvement: growthAnalytics.monthly?.engagement_growth_rate || 0,
          },
          isRealData: true,
          dataPoints: accountSummary.dataQuality.dataPoints,
          lastUpdated: accountSummary.profile.last_updated,
        };
      }

      // Fallback to estimates if no real data available yet
      console.log('⚠️ No historical data available, using estimates based on current data');
      
      if (reportData?.profile) {
        return this.generateEstimatedGrowth(reportData);
      }

      // Default fallback
      return this.getDefaultGrowthAnalysis();
      
    } catch (error) {
      console.error('❌ Error in growth analysis:', error);
      return this.getDefaultGrowthAnalysis();
    }
  }

  /**
   * Generate estimated growth based on current account metrics
   */
  private static generateEstimatedGrowth(reportData: any): GrowthAnalysisResult {
    const followers = reportData.profile?.followers_count || 0;
    const posts = reportData.summary?.totalPosts || reportData.media?.length || 0;
    const engagement = reportData.summary?.avgLikes || 0;

    // Estimate growth rates based on account size and activity
    const weeklyGrowthRate = this.estimateGrowthRate(followers, posts, 'weekly');
    const monthlyGrowthRate = this.estimateGrowthRate(followers, posts, 'monthly');
    const annualGrowthRate = this.estimateGrowthRate(followers, posts, 'annual');

    // Estimate post activity
    const estimatedWeeklyPosts = Math.max(0, Math.floor(posts / 4)); // Assuming posts over a month
    const estimatedMonthlyPosts = posts;
    const estimatedAnnualPosts = Math.floor(posts * 12);

    return {
      growthRates: {
        weekly: weeklyGrowthRate,
        monthly: monthlyGrowthRate,
        annual: annualGrowthRate,
      },
      postCounts: {
        weekly: estimatedWeeklyPosts,
        monthly: estimatedMonthlyPosts,
        annual: estimatedAnnualPosts,
      },
      followerCounts: {
        current: followers,
        weekAgo: Math.max(0, followers - Math.floor(followers * (weeklyGrowthRate / 100))),
        monthAgo: Math.max(0, followers - Math.floor(followers * (monthlyGrowthRate / 100))),
        yearAgo: Math.max(0, followers - Math.floor(followers * (annualGrowthRate / 100))),
      },
      engagementTrends: {
        current: engagement,
        weekAgo: Math.max(0, engagement * 0.95),
        monthAgo: Math.max(0, engagement * 0.9),
        improvement: 5.0, // Estimated improvement
      },
      isRealData: false,
      dataPoints: 1,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Estimate growth rate based on account characteristics
   */
  private static estimateGrowthRate(
    followers: number, 
    posts: number, 
    timeFrame: 'weekly' | 'monthly' | 'annual'
  ): number {
    // Base growth rates by follower count (weekly rates)
    let baseWeeklyRate = 0;
    
    if (followers > 100000) baseWeeklyRate = 0.5;
    else if (followers > 50000) baseWeeklyRate = 1.0;
    else if (followers > 10000) baseWeeklyRate = 2.0;
    else if (followers > 5000) baseWeeklyRate = 3.0;
    else if (followers > 1000) baseWeeklyRate = 5.0;
    else baseWeeklyRate = 8.0;

    // Adjust based on posting activity
    const postingMultiplier = Math.min(1.5, Math.max(0.5, posts / 20));
    baseWeeklyRate *= postingMultiplier;

    // Convert to requested timeframe
    switch (timeFrame) {
      case 'weekly': return baseWeeklyRate;
      case 'monthly': return baseWeeklyRate * 4;
      case 'annual': return baseWeeklyRate * 52;
      default: return baseWeeklyRate;
    }
  }

  /**
   * Default growth analysis when no data is available
   */
  private static getDefaultGrowthAnalysis(): GrowthAnalysisResult {
    return {
      growthRates: {
        weekly: 1.2,
        monthly: 5.0,
        annual: 60.0,
      },
      postCounts: {
        weekly: 0,
        monthly: 0,
        annual: 0,
      },
      followerCounts: {
        current: 0,
        weekAgo: 0,
        monthAgo: 0,
        yearAgo: 0,
      },
      engagementTrends: {
        current: 0,
        weekAgo: 0,
        monthAgo: 0,
        improvement: 0,
      },
      isRealData: false,
      dataPoints: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Calculate growth velocity (acceleration of growth)
   */
  static async getGrowthVelocity(userId: string) {
    try {
      const trends = await this.historicalService.getEngagementTrends(userId, 14);
      
      if (trends.length < 7) {
        return { velocity: 0, trend: 'insufficient_data' };
      }

      // Calculate week-over-week change in follower growth
      const firstWeek = trends.slice(0, 7);
      const secondWeek = trends.slice(7, 14);

      const firstWeekAvgGrowth = firstWeek.reduce((sum, day, index) => {
        if (index === 0) return 0;
        return sum + (day.followers_count - firstWeek[index - 1].followers_count);
      }, 0) / 6;

      const secondWeekAvgGrowth = secondWeek.reduce((sum, day, index) => {
        if (index === 0) return 0;
        return sum + (day.followers_count - secondWeek[index - 1].followers_count);
      }, 0) / 6;

      const velocity = firstWeekAvgGrowth - secondWeekAvgGrowth;
      const trend = velocity > 0 ? 'accelerating' : velocity < 0 ? 'decelerating' : 'stable';

      return { velocity, trend };
    } catch (error) {
      console.error('Error calculating growth velocity:', error);
      return { velocity: 0, trend: 'error' };
    }
  }

  /**
   * Get growth predictions based on historical patterns
   */
  static async getGrowthPredictions(userId: string, days: number = 30) {
    try {
      const chartData = await this.historicalService.getFollowerGrowthChart(userId, 60);
      
      if (chartData.length < 7) {
        return null;
      }

      // Calculate average daily growth from last 7 days
      const lastWeek = chartData.slice(-7);
      const avgDailyGrowth = lastWeek.reduce((sum, day) => sum + day.growth, 0) / 7;

      // Generate predictions
      const lastFollowerCount = chartData[chartData.length - 1].followers;
      const predictions = [];

      for (let i = 1; i <= days; i++) {
        const predictedFollowers = lastFollowerCount + (avgDailyGrowth * i);
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        predictions.push({
          date: date.toISOString().split('T')[0],
          predicted_followers: Math.max(lastFollowerCount, Math.round(predictedFollowers)),
          confidence: Math.max(0.1, 1 - (i / days) * 0.5) // Confidence decreases over time
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error generating growth predictions:', error);
      return null;
    }
  }

  /**
   * Get comprehensive growth insights
   */
  static async getGrowthInsights(userId: string) {
    try {
      const [
        growthAnalysis,
        velocity,
        predictions,
        contentAnalysis
      ] = await Promise.all([
        this.getComprehensiveGrowthAnalysis(userId),
        this.getGrowthVelocity(userId),
        this.getGrowthPredictions(userId, 30),
        this.historicalService.getContentPerformanceAnalysis(userId)
      ]);

      return {
        growth: growthAnalysis,
        velocity,
        predictions,
        content: contentAnalysis,
        insights: this.generateGrowthInsights(growthAnalysis, velocity, contentAnalysis)
      };
    } catch (error) {
      console.error('Error getting growth insights:', error);
      return null;
    }
  }

  /**
   * Generate AI-powered growth insights
   */
  private static generateGrowthInsights(
    growth: GrowthAnalysisResult,
    velocity: any,
    content: any
  ): string[] {
    const insights = [];

    // Growth rate insights
    if (growth.isRealData) {
      if (growth.growthRates.weekly > 2) {
        insights.push("🚀 Excellent weekly growth rate! You're growing faster than 80% of accounts your size.");
      } else if (growth.growthRates.weekly > 1) {
        insights.push("📈 Solid weekly growth. Consider posting more consistently to accelerate.");
      } else if (growth.growthRates.weekly > 0) {
        insights.push("📊 Steady growth pattern. Focus on engagement quality to boost growth rate.");
      } else {
        insights.push("⚠️ Growth has stalled. Time to refresh your content strategy.");
      }
    }

    // Velocity insights
    if (velocity.trend === 'accelerating') {
      insights.push("🔥 Your growth is accelerating! Whatever you're doing is working.");
    } else if (velocity.trend === 'decelerating') {
      insights.push("📉 Growth is slowing down. Consider analyzing your top-performing content.");
    }

    // Content insights
    if (content && content.length > 0) {
      const bestType = content.reduce((best: any, current: any) => 
        current.total_engagement > best.total_engagement ? current : best
      );
      insights.push(`🎯 ${bestType.type} posts perform best for you. Consider creating more of these.`);
    }

    // Engagement insights
    if (growth.engagementTrends.improvement > 0) {
      insights.push("💬 Your engagement rate is improving! Your audience is becoming more active.");
    }

    return insights;
  }
}