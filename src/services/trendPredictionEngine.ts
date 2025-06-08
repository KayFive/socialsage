// src/services/trendPredictionEngine.ts
export interface TrendPrediction {
  id: string;
  trend_type: 'content' | 'engagement' | 'audience' | 'timing';
  prediction: string;
  confidence: number;
  timeframe: string;
  potential_impact: 'low' | 'medium' | 'high';
  data_points: string[];
  recommendation: string;
}

export interface ContentRecommendation {
  id: string;
  recommendation_type: 'format' | 'topic' | 'style' | 'timing';
  title: string;
  description: string;
  priority: number;
  expected_improvement: string;
  implementation_effort: 'low' | 'medium' | 'high';
  specific_actions: string[];
}

export interface EngagementForecast {
  id: string;
  metric: 'likes' | 'comments' | 'saves' | 'shares' | 'reach';
  current_average: number;
  predicted_value: number;
  confidence_interval: { min: number; max: number };
  timeframe: string;
  factors: string[];
}

export class TrendPredictionEngine {
  
  static generateTrendPredictions(reportData: any): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];
    
    try {
      const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
      const profile = reportData?.profile || {};
      
      if (media.length === 0) {
        console.warn('No media data available for trend predictions');
        return predictions;
      }
      
      // Engagement trend analysis
      predictions.push(...this.analyzeEngagementTrends(media, profile));
      
      // Content format trends
      predictions.push(...this.analyzeContentFormatTrends(media));
      
      // Audience growth predictions
      predictions.push(...this.analyzeAudienceGrowthTrends(profile, media));
      
      // Optimal timing predictions
      predictions.push(...this.analyzeTimingTrends(media));
      
      return predictions.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error generating trend predictions:', error);
      return [];
    }
  }
  
  static generateContentRecommendations(reportData: any): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    try {
      const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
      const profile = reportData?.profile || {};
      
      if (media.length === 0) {
        console.warn('No media data available for content recommendations');
        return recommendations;
      }
      
      // Format recommendations
      recommendations.push(...this.generateFormatRecommendations(media, profile));
      
      // Content topic recommendations
      recommendations.push(...this.generateTopicRecommendations(media, profile));
      
      // Style recommendations
      recommendations.push(...this.generateStyleRecommendations(media));
      
      // Timing recommendations
      recommendations.push(...this.generateTimingRecommendations(media));
      
      return recommendations.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      return [];
    }
  }
  
  static generateEngagementForecast(reportData: any): EngagementForecast[] {
    const forecasts: EngagementForecast[] = [];
    
    try {
      const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
      const profile = reportData?.profile || {};
      
      if (media.length < 3) {
        console.warn('Insufficient data for engagement forecasting');
        return forecasts;
      }
      
      // Calculate current averages
      const currentMetrics = this.calculateCurrentMetrics(media);
      
      // Generate forecasts for each metric
      Object.entries(currentMetrics).forEach(([metric, currentAvg]) => {
        const forecast = this.generateMetricForecast(metric, currentAvg, media, profile);
        if (forecast) {
          forecasts.push(forecast);
        }
      });
      
      return forecasts;
    } catch (error) {
      console.error('Error generating engagement forecast:', error);
      return [];
    }
  }
  
  private static analyzeEngagementTrends(media: any[], profile: any): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];
    
    if (media.length < 5) return predictions;
    
    // Calculate engagement trend over time
    const sortedMedia = media
      .filter((post: any) => post.timestamp)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedMedia.length < 5) return predictions;
    
    const recentPosts = sortedMedia.slice(-Math.floor(sortedMedia.length / 2));
    const olderPosts = sortedMedia.slice(0, Math.floor(sortedMedia.length / 2));
    
    const recentAvgEngagement = recentPosts.reduce((sum: number, post: any) => 
      sum + (post.like_count || 0) + (post.comments_count || 0), 0) / recentPosts.length;
    
    const olderAvgEngagement = olderPosts.reduce((sum: number, post: any) => 
      sum + (post.like_count || 0) + (post.comments_count || 0), 0) / olderPosts.length;
    
    const trendDirection = recentAvgEngagement > olderAvgEngagement ? 'upward' : 'downward';
    const trendStrength = Math.abs((recentAvgEngagement - olderAvgEngagement) / olderAvgEngagement);
    
    if (trendStrength > 0.1) { // Only predict if there's a significant trend
      predictions.push({
        id: `engagement_trend_${Date.now()}`,
        trend_type: 'engagement',
        prediction: `Your engagement is trending ${trendDirection} with a ${(trendStrength * 100).toFixed(1)}% change`,
        confidence: Math.min(0.9, 0.5 + trendStrength),
        timeframe: 'next 30 days',
        potential_impact: trendStrength > 0.3 ? 'high' : trendStrength > 0.15 ? 'medium' : 'low',
        data_points: [
          `Recent avg: ${recentAvgEngagement.toFixed(0)}`,
          `Previous avg: ${olderAvgEngagement.toFixed(0)}`,
          `Trend strength: ${(trendStrength * 100).toFixed(1)}%`
        ],
        recommendation: trendDirection === 'upward' ? 
          'Continue current content strategy and increase posting frequency' :
          'Analyze top-performing posts and adjust content strategy accordingly'
      });
    }
    
    return predictions;
  }
  
  private static analyzeContentFormatTrends(media: any[]): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];
    
    const formatPerformance: { [key: string]: { count: number; totalEngagement: number } } = {};
    
    media.forEach((post: any) => {
      const format = post.media_type || 'image';
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      if (!formatPerformance[format]) {
        formatPerformance[format] = { count: 0, totalEngagement: 0 };
      }
      
      formatPerformance[format].count++;
      formatPerformance[format].totalEngagement += engagement;
    });
    
    // Find the best performing format
    let bestFormat = 'image';
    let bestPerformance = 0;
    
    Object.entries(formatPerformance).forEach(([format, data]) => {
      if (data.count > 1) { // Only consider formats with multiple posts
        const avgPerformance = data.totalEngagement / data.count;
        if (avgPerformance > bestPerformance) {
          bestPerformance = avgPerformance;
          bestFormat = format;
        }
      }
    });
    
    if (formatPerformance[bestFormat] && formatPerformance[bestFormat].count > 1) {
      const formatShare = formatPerformance[bestFormat].count / media.length;
      
      predictions.push({
        id: `format_trend_${Date.now()}`,
        trend_type: 'content',
        prediction: `${bestFormat} content will continue to outperform other formats`,
        confidence: 0.7 + (formatShare * 0.2),
        timeframe: 'next 60 days',
        potential_impact: bestPerformance > 100 ? 'high' : 'medium',
        data_points: [
          `${bestFormat} avg engagement: ${(bestPerformance).toFixed(0)}`,
          `Usage rate: ${(formatShare * 100).toFixed(1)}%`,
          `Total ${bestFormat} posts: ${formatPerformance[bestFormat].count}`
        ],
        recommendation: `Increase ${bestFormat} content to 60-70% of your posts for optimal engagement`
      });
    }
    
    return predictions;
  }
  
  private static analyzeAudienceGrowthTrends(profile: any, media: any[]): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];
    
    const followerCount = profile?.followers_count || 0;
    const avgEngagement = media.length > 0 ? 
      media.reduce((sum: number, post: any) => sum + (post.like_count || 0) + (post.comments_count || 0), 0) / media.length : 0;
    
    const engagementRate = followerCount > 0 ? (avgEngagement / followerCount) * 100 : 0;
    
    let growthPrediction = '';
    let confidence = 0.6;
    let impact: 'low' | 'medium' | 'high' = 'medium';
    
    if (engagementRate > 5) {
      growthPrediction = 'Rapid audience growth expected due to high engagement rate';
      confidence = 0.8;
      impact = 'high';
    } else if (engagementRate > 2) {
      growthPrediction = 'Steady audience growth expected with current engagement levels';
      confidence = 0.7;
      impact = 'medium';
    } else {
      growthPrediction = 'Slow audience growth predicted - engagement optimization needed';
      confidence = 0.6;
      impact = 'low';
    }
    
    predictions.push({
      id: `audience_growth_${Date.now()}`,
      trend_type: 'audience',
      prediction: growthPrediction,
      confidence,
      timeframe: 'next 90 days',
      potential_impact: impact,
      data_points: [
        `Current followers: ${followerCount.toLocaleString()}`,
        `Engagement rate: ${engagementRate.toFixed(2)}%`,
        `Avg post engagement: ${avgEngagement.toFixed(0)}`
      ],
      recommendation: engagementRate < 2 ? 
        'Focus on creating more engaging content and interacting with your audience' :
        'Maintain current strategy and consider expanding content themes'
    });
    
    return predictions;
  }
  
  private static analyzeTimingTrends(media: any[]): TrendPrediction[] {
    const predictions: TrendPrediction[] = [];
    
    if (media.length < 7) return predictions;
    
    const timePerformance: { [key: string]: { count: number; totalEngagement: number } } = {};
    
    media.forEach((post: any) => {
      if (!post.timestamp) return;
      
      const date = new Date(post.timestamp);
      const hour = date.getHours();
      const timeSlot = hour < 6 ? 'early_morning' :
                     hour < 12 ? 'morning' :
                     hour < 18 ? 'afternoon' :
                     hour < 22 ? 'evening' : 'night';
      
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      if (!timePerformance[timeSlot]) {
        timePerformance[timeSlot] = { count: 0, totalEngagement: 0 };
      }
      
      timePerformance[timeSlot].count++;
      timePerformance[timeSlot].totalEngagement += engagement;
    });
    
    // Find best performing time slot
    let bestTimeSlot = 'morning';
    let bestPerformance = 0;
    
    Object.entries(timePerformance).forEach(([timeSlot, data]) => {
      if (data.count > 1) {
        const avgPerformance = data.totalEngagement / data.count;
        if (avgPerformance > bestPerformance) {
          bestPerformance = avgPerformance;
          bestTimeSlot = timeSlot;
        }
      }
    });
    
    if (timePerformance[bestTimeSlot] && timePerformance[bestTimeSlot].count > 1) {
      predictions.push({
        id: `timing_trend_${Date.now()}`,
        trend_type: 'timing',
        prediction: `${bestTimeSlot.replace('_', ' ')} posts will continue to perform best`,
        confidence: 0.75,
        timeframe: 'ongoing',
        potential_impact: 'medium',
        data_points: [
          `Best time: ${bestTimeSlot.replace('_', ' ')}`,
          `Avg engagement: ${(bestPerformance).toFixed(0)}`,
          `Posts analyzed: ${timePerformance[bestTimeSlot].count}`
        ],
        recommendation: `Schedule important content during ${bestTimeSlot.replace('_', ' ')} hours for maximum reach`
      });
    }
    
    return predictions;
  }
  
  private static generateFormatRecommendations(media: any[], profile: any): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    // Analyze current format distribution
    const formatCounts: { [key: string]: number } = {};
    const formatEngagement: { [key: string]: number[] } = {};
    
    media.forEach((post: any) => {
      const format = post.media_type || 'image';
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      formatCounts[format] = (formatCounts[format] || 0) + 1;
      if (!formatEngagement[format]) formatEngagement[format] = [];
      formatEngagement[format].push(engagement);
    });
    
    // Calculate average engagement per format
    const formatAvgs: { [key: string]: number } = {};
    Object.entries(formatEngagement).forEach(([format, engagements]) => {
      formatAvgs[format] = engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length;
    });
    
    // Find underutilized high-performing formats
    const totalPosts = media.length;
    
    // Check for video recommendations
    const videoPercentage = (formatCounts['video'] || 0) / totalPosts;
    const videoAvgEngagement = formatAvgs['video'] || 0;
    
    if (videoPercentage < 0.3 && (videoAvgEngagement > (formatAvgs['image'] || 0) || totalPosts < 10)) {
      recommendations.push({
        id: `format_video_${Date.now()}`,
        recommendation_type: 'format',
        title: 'Increase Video Content',
        description: 'Video content typically drives 2-3x higher engagement than static posts',
        priority: 8,
        expected_improvement: '30-50% engagement increase',
        implementation_effort: 'medium',
        specific_actions: [
          'Create short-form videos (15-30 seconds)',
          'Use trending audio and effects',
          'Show behind-the-scenes content',
          'Create how-to or tutorial videos'
        ]
      });
    }
    
    // Check for carousel recommendations
    const carouselPercentage = (formatCounts['carousel_album'] || 0) / totalPosts;
    
    if (carouselPercentage < 0.2) {
      recommendations.push({
        id: `format_carousel_${Date.now()}`,
        recommendation_type: 'format',
        title: 'Leverage Carousel Posts',
        description: 'Carousel posts increase time spent on your content and boost engagement',
        priority: 6,
        expected_improvement: '20-30% engagement boost',
        implementation_effort: 'low',
        specific_actions: [
          'Create educational slide series',
          'Share before/after transformations',
          'Tell stories across multiple slides',
          'Create interactive polls and quizzes'
        ]
      });
    }
    
    return recommendations;
  }
  
  private static generateTopicRecommendations(media: any[], profile: any): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    // Analyze caption topics (simplified)
    const topicKeywords: { [key: string]: number[] } = {
      'educational': [],
      'personal': [],
      'promotional': [],
      'entertainment': []
    };
    
    media.forEach((post: any) => {
      const caption = (post.caption || '').toLowerCase();
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      if (caption.includes('tip') || caption.includes('learn') || caption.includes('how to')) {
        topicKeywords['educational'].push(engagement);
      } else if (caption.includes('i ') || caption.includes('my ') || caption.includes('personal')) {
        topicKeywords['personal'].push(engagement);
      } else if (caption.includes('buy') || caption.includes('sale') || caption.includes('link')) {
        topicKeywords['promotional'].push(engagement);
      } else {
        topicKeywords['entertainment'].push(engagement);
      }
    });
    
    // Find underutilized high-performing topics
    Object.entries(topicKeywords).forEach(([topic, engagements]) => {
      if (engagements.length < media.length * 0.2 && engagements.length > 0) {
        const avgEngagement = engagements.reduce((sum, eng) => sum + eng, 0) / engagements.length;
        const overallAvg = media.reduce((sum: number, post: any) => sum + (post.like_count || 0) + (post.comments_count || 0), 0) / media.length;
        
        if (avgEngagement > overallAvg * 1.1) {
          recommendations.push({
            id: `topic_${topic}_${Date.now()}`,
            recommendation_type: 'topic',
            title: `Increase ${topic.charAt(0).toUpperCase() + topic.slice(1)} Content`,
            description: `Your ${topic} posts outperform average but are underutilized`,
            priority: 7,
            expected_improvement: '15-25% engagement increase',
            implementation_effort: topic === 'educational' ? 'medium' : 'low',
            specific_actions: this.getTopicSpecificActions(topic)
          });
        }
      }
    });
    
    return recommendations;
  }
  
  private static generateStyleRecommendations(media: any[]): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    // Analyze caption styles
    const captionLengths = media
      .filter((post: any) => post.caption)
      .map((post: any) => ({
        length: post.caption.length,
        engagement: (post.like_count || 0) + (post.comments_count || 0)
      }));
    
    if (captionLengths.length > 5) {
      const avgLength = captionLengths.reduce((sum, item) => sum + item.length, 0) / captionLengths.length;
      const avgEngagement = captionLengths.reduce((sum, item) => sum + item.engagement, 0) / captionLengths.length;
      
      // Find optimal caption length
      const shortCaptions = captionLengths.filter(c => c.length <= 100);
      const mediumCaptions = captionLengths.filter(c => c.length > 100 && c.length <= 300);
      const longCaptions = captionLengths.filter(c => c.length > 300);
      
      const shortAvg = shortCaptions.length > 0 ? shortCaptions.reduce((sum, c) => sum + c.engagement, 0) / shortCaptions.length : 0;
      const mediumAvg = mediumCaptions.length > 0 ? mediumCaptions.reduce((sum, c) => sum + c.engagement, 0) / mediumCaptions.length : 0;
      const longAvg = longCaptions.length > 0 ? longCaptions.reduce((sum, c) => sum + c.engagement, 0) / longCaptions.length : 0;
      
      const bestLength = shortAvg > mediumAvg && shortAvg > longAvg ? 'short' :
                        mediumAvg > longAvg ? 'medium' : 'long';
      
      if (avgLength < 100 && bestLength !== 'short') {
        recommendations.push({
          id: `style_caption_length_${Date.now()}`,
          recommendation_type: 'style',
          title: 'Optimize Caption Length',
          description: `${bestLength} captions perform better for your audience`,
          priority: 5,
          expected_improvement: '10-20% engagement boost',
          implementation_effort: 'low',
          specific_actions: [
            bestLength === 'medium' ? 'Write 100-300 character captions' : 'Write longer, story-driven captions',
            'Include clear call-to-actions',
            'Use line breaks for readability',
            'End with engaging questions'
          ]
        });
      }
    }
    
    return recommendations;
  }
  
  private static generateTimingRecommendations(media: any[]): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = [];
    
    if (media.length < 5) return recommendations;
    
    // Analyze posting frequency
    const sortedPosts = media
      .filter((post: any) => post.timestamp)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (sortedPosts.length < 3) return recommendations;
    
    // Calculate average gap between posts
    const gaps = [];
    for (let i = 1; i < sortedPosts.length; i++) {
      const gap = (new Date(sortedPosts[i].timestamp).getTime() - new Date(sortedPosts[i-1].timestamp).getTime()) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }
    
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    
    if (avgGap > 7) {
      recommendations.push({
        id: `timing_frequency_${Date.now()}`,
        recommendation_type: 'timing',
        title: 'Increase Posting Frequency',
        description: 'More consistent posting will improve your reach and engagement',
        priority: 6,
        expected_improvement: '25-40% reach increase',
        implementation_effort: 'medium',
        specific_actions: [
          'Post 3-5 times per week minimum',
          'Create a content calendar',
          'Batch create content in advance',
          'Use scheduling tools'
        ]
      });
    }
    
    return recommendations;
  }
  
  private static calculateCurrentMetrics(media: any[]): { [key: string]: number } {
    const metrics: { [key: string]: number } = {};
    
    if (media.length === 0) return metrics;
    
    metrics.likes = media.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0) / media.length;
    metrics.comments = media.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0) / media.length;
    metrics.saves = media.reduce((sum: number, post: any) => sum + (post.saves_count || 0), 0) / media.length;
    
    return metrics;
  }
  
  private static generateMetricForecast(metric: string, currentAvg: number, media: any[], profile: any): EngagementForecast | null {
    if (currentAvg === 0) return null;
    
    // Simple trend analysis for prediction
    const recentPosts = media.slice(0, Math.floor(media.length / 2));
    const olderPosts = media.slice(Math.floor(media.length / 2));
    
    const recentAvg = this.calculateMetricAvg(recentPosts, metric);
    const olderAvg = this.calculateMetricAvg(olderPosts, metric);
    
    const trendMultiplier = olderAvg > 0 ? recentAvg / olderAvg : 1;
    const predictedValue = currentAvg * trendMultiplier * 1.1; // 10% optimistic growth
    
    const variance = currentAvg * 0.3; // 30% variance
    
    return {
      id: `forecast_${metric}_${Date.now()}`,
      metric: metric as any,
      current_average: currentAvg,
      predicted_value: predictedValue,
      confidence_interval: {
        min: Math.max(0, predictedValue - variance),
        max: predictedValue + variance
      },
      timeframe: 'next 30 days',
      factors: [
        'Historical performance trend',
        'Engagement rate patterns',
        'Content optimization potential'
      ]
    };
  }
  
  private static calculateMetricAvg(posts: any[], metric: string): number {
    if (posts.length === 0) return 0;
    
    const field = metric === 'likes' ? 'like_count' :
                 metric === 'comments' ? 'comments_count' :
                 metric === 'saves' ? 'saves_count' : 'like_count';
    
    return posts.reduce((sum: number, post: any) => sum + (post[field] || 0), 0) / posts.length;
  }
  
  private static getTopicSpecificActions(topic: string): string[] {
    const actions: { [key: string]: string[] } = {
      educational: [
        'Create weekly tip series',
        'Share industry insights',
        'Make tutorial carousels',
        'Answer frequently asked questions'
      ],
      personal: [
        'Share behind-the-scenes content',
        'Tell your story',
        'Show daily routines',
        'Discuss challenges and wins'
      ],
      promotional: [
        'Highlight customer testimonials',
        'Showcase product benefits',
        'Create limited-time offers',
        'Share user-generated content'
      ],
      entertainment: [
        'Create trending content',
        'Share funny moments',
        'Use popular memes',
        'Join viral challenges'
      ]
    };
    
    return actions[topic] || [];
  }
}