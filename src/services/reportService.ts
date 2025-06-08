// src/services/reportService.ts
import { InstagramDataPackage } from '@/types/instagram.types';
import { createBrowserClient } from '@/lib/supabase';

export const generateReport = async (
  data: InstagramDataPackage,
  requestId: string,
  userId: string
) => {
  // Process the data to generate insights
  const insights = analyzeData(data);
  
  // Generate recommendations
  const recommendations = generateRecommendations(data, insights);
  
  // Create report structure
  const report = {
    profile: data.profile,
    summary: {
      overallScore: calculateOverallScore(data),
      strengths: findStrengths(insights),
      weaknesses: findWeaknesses(insights),
      keyMetrics: extractKeyMetrics(data)
    },
    contentAnalysis: analyzeContent(data),
    audienceInsights: analyzeAudience(data),
    engagementAnalysis: analyzeEngagement(data),
    growthOpportunities: findGrowthOpportunities(data),
    recommendations: recommendations,
    actionPlan: createActionPlan(recommendations)
  };
  
  // Save report in database
  const supabase = createBrowserClient();
  await supabase
    .from('reports')
    .update({
      report_data: report,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('request_id', requestId)
    .eq('user_id', userId);
  
  return report;
};

// Helper functions for report generation
function analyzeData(data: InstagramDataPackage) {
  return {
    contentEffectiveness: calculateContentEffectiveness(data),
    audienceEngagement: calculateAudienceEngagement(data),
    growthTrends: calculateGrowthTrends(data),
    hashtags: analyzeHashtags(data),
    postTiming: analyzePostTiming(data)
  };
}

function calculateContentEffectiveness(data: InstagramDataPackage) {
  // Analyze which content types perform best
  const mediaTypes = data.media.reduce((acc, post) => {
    const type = post.media_type;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        likes: 0,
        comments: 0,
        engagement: 0,
        impressions: 0
      };
    }
    
    acc[type].count += 1;
    acc[type].likes += post.like_count;
    acc[type].comments += post.comments_count;
    acc[type].engagement += post.like_count + post.comments_count;
    acc[type].impressions += post.impressions || 0;
    
    return acc;
  }, {} as Record<string, any>);
  
  // Calculate average metrics per type
  Object.keys(mediaTypes).forEach(type => {
    const typeData = mediaTypes[type];
    typeData.avgLikes = typeData.likes / typeData.count;
    typeData.avgComments = typeData.comments / typeData.count;
    typeData.avgEngagement = typeData.engagement / typeData.count;
    typeData.avgImpressions = typeData.impressions / typeData.count;
    typeData.engagementRate = typeData.avgImpressions > 0 ? (typeData.avgEngagement / typeData.avgImpressions * 100) : 0;
  });
  
  return {
    mediaTypes,
    mostEffectiveType: Object.entries(mediaTypes)
      .sort((a, b) => b[1].engagementRate - a[1].engagementRate)[0]?.[0] || 'IMAGE'
  };
}

function calculateAudienceEngagement(data: InstagramDataPackage) {
  // Calculate when audience is most active
  const activeTimes = data.audience.active_times;

  // Separate days and hours if needed, or just sort the array by activity_level
  // Assuming activeTimes is an array of objects with 'day', 'hour', and 'activity_level' properties

  // Find peak engagement days
  const daysMap = new Map<string, number>();
  activeTimes.forEach(item => {
    if (item.day !== undefined) {
      daysMap.set(item.day, (daysMap.get(item.day) || 0) + item.activity_level);
    }
  });
  const peakDays = Array.from(daysMap.entries())
    .map(([day, activity_level]) => ({ day, activity_level }))
    .sort((a, b) => b.activity_level - a.activity_level)
    .slice(0, 3);

  // Find peak engagement hours
  const hoursMap = new Map<number, number>();
  activeTimes.forEach(item => {
    if (item.hour !== undefined) {
      hoursMap.set(item.hour, (hoursMap.get(item.hour) || 0) + item.activity_level);
    }
  });
  const peakHours = Array.from(hoursMap.entries())
    .map(([hour, activity_level]) => ({ hour, activity_level }))
    .sort((a, b) => b.activity_level - a.activity_level)
    .slice(0, 3);

  return {
    peakDays,
    peakHours,
    demographicEngagement: {
      ageGroups: data.audience.age_ranges.map(age => ({
        range: age.range,
        percentage: age.percentage,
        estimatedFollowers: Math.round(data.profile.followers_count * (age.percentage / 100))
      })),
      gender: {
        male: {
          percentage: data.audience.gender.male,
          estimatedFollowers: Math.round(data.profile.followers_count * (data.audience.gender.male / 100))
        },
        female: {
          percentage: data.audience.gender.female,
          estimatedFollowers: Math.round(data.profile.followers_count * (data.audience.gender.female / 100))
        },
        other: {
          percentage: data.audience.gender.other,
          estimatedFollowers: Math.round(data.profile.followers_count * (data.audience.gender.other / 100))
        }
      }
    }
  };
}

function calculateGrowthTrends(data: InstagramDataPackage) {
  // Analyze historical growth data
  const growthData = data.historical_growth;
  
  // Calculate growth rates
  const rates = [];
  for (let i = 1; i < growthData.length; i++) {
    const current = growthData[i];
    const previous = growthData[i-1];
    
    const followerGrowth = previous.followers > 0 ? ((current.followers - previous.followers) / previous.followers) * 100 : 0;
    const followingGrowth = previous.following > 0 ? ((current.following - previous.following) / previous.following) * 100 : 0;
    const postsGrowth = previous.posts > 0 ? ((current.posts - previous.posts) / previous.posts) * 100 : 0;
    
    rates.push({
      period: current.date,
      followerGrowth,
      followingGrowth,
      postsGrowth,
      engagementRate: current.engagement_rate
    });
  }
  
  // Calculate average growth rates
  const avgFollowerGrowth = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate.followerGrowth, 0) / rates.length : 0;
  const avgPostsGrowth = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate.postsGrowth, 0) / rates.length : 0;
  
  // Predict future growth
  const latestFollowers = growthData[growthData.length - 1]?.followers || 0;
  
  return {
    growthRates: rates,
    averages: {
      followerGrowth: avgFollowerGrowth,
      postsGrowth: avgPostsGrowth
    },
    projections: {
      oneMonthFollowers: Math.round(latestFollowers * (1 + (avgFollowerGrowth / 100))),
      threeMonthFollowers: Math.round(latestFollowers * (1 + (avgFollowerGrowth / 100 * 3))),
      sixMonthFollowers: Math.round(latestFollowers * (1 + (avgFollowerGrowth / 100 * 6)))
    }
  };
}

function analyzeHashtags(data: InstagramDataPackage) {
  return data.metrics.hashtag_performance;
}

function analyzePostTiming(data: InstagramDataPackage) {
  return data.metrics.optimal_posting_times;
}

function calculateOverallScore(data: InstagramDataPackage) {
  // Calculate a score from 0-100 based on various metrics
  const metrics = {
    engagementRate: data.metrics.overall_engagement_rate,
    growthRate: data.metrics.follower_growth_rate,
    postFrequency: data.metrics.post_frequency,
    followersCount: data.profile.followers_count
  };
  
  // Weight each metric
  const weights = {
    engagementRate: 0.4,  // 40% weight
    growthRate: 0.3,      // 30% weight
    postFrequency: 0.2,   // 20% weight
    followersCount: 0.1   // 10% weight
  };
  
  // Score each metric from 0-100
  const scores = {
    engagementRate: Math.min(metrics.engagementRate * 20, 100), // 5% engagement = 100 score
    growthRate: Math.min(metrics.growthRate * 10, 100),        // 10% growth = 100 score
    postFrequency: Math.min(metrics.postFrequency * 14.3, 100), // 7 posts/week = 100 score
    followersCount: Math.min(Math.log10(Math.max(metrics.followersCount, 1)) * 20, 100) // 100k followers = 100 score
  };
  
  // Calculate weighted average
  const metricKeys = ['engagementRate', 'growthRate', 'postFrequency', 'followersCount'] as const;
  const overallScore = metricKeys.reduce((score, key) => {
    return score + (scores[key] * weights[key]);
  }, 0);
  
  return Math.round(overallScore);
}

function findStrengths(insights: any) {
  const strengths = [];
  
  // Content effectiveness
  if (insights.contentEffectiveness.mostEffectiveType) {
    strengths.push(`Strong ${insights.contentEffectiveness.mostEffectiveType.toLowerCase()} content performance`);
  }
  
  // Engagement
  if (insights.audienceEngagement.peakDays.length > 0) {
    strengths.push(`Good audience engagement on ${insights.audienceEngagement.peakDays[0].day}`);
  }
  
  // Growth
  if (insights.growthTrends.averages.followerGrowth > 1) {
    strengths.push(`Healthy follower growth rate of ${insights.growthTrends.averages.followerGrowth.toFixed(1)}%`);
  }
  
  return strengths.slice(0, 5); // Return top 5 strengths
}

function findWeaknesses(insights: any) {
  const weaknesses = [];
  
  // Content effectiveness
  const mediaTypes = insights.contentEffectiveness.mediaTypes;
  const types = Object.keys(mediaTypes);
  if (types.length > 1) {
    const worstType = Object.entries(mediaTypes)
      .sort((a: any, b: any) => a[1].engagementRate - b[1].engagementRate)[0]?.[0];
    if (worstType) {
      weaknesses.push(`Lower engagement on ${worstType.toLowerCase()} content`);
    }
  }
  
  // Growth
  if (insights.growthTrends.averages.followerGrowth < 1) {
    weaknesses.push(`Slow follower growth rate of ${insights.growthTrends.averages.followerGrowth.toFixed(1)}%`);
  }
  
  return weaknesses.slice(0, 5); // Return top 5 weaknesses
}

function extractKeyMetrics(data: InstagramDataPackage) {
  return {
    followers: data.profile.followers_count,
    engagement: data.metrics.overall_engagement_rate,
    growthRate: data.metrics.follower_growth_rate,
    avgLikes: Math.round(data.metrics.avg_likes_per_post),
    avgComments: Math.round(data.metrics.avg_comments_per_post),
    postFrequency: data.metrics.post_frequency
  };
}

function analyzeContent(data: InstagramDataPackage) {
  // Analyze content characteristics
  const posts = data.media;
  
  // Analyze captions
  const captionLengths = posts.map(post => post.caption?.length || 0);
  const avgCaptionLength = captionLengths.length > 0 ? captionLengths.reduce((sum, length) => sum + length, 0) / posts.length : 0;
  
  // Find top performing posts
  const topPosts = [...posts]
    .sort((a, b) => {
      const engagementA = a.like_count + a.comments_count;
      const engagementB = b.like_count + b.comments_count;
      return engagementB - engagementA;
    })
    .slice(0, 5);
  
  // Find patterns in top posts
  const topPostsHaveHashtags = topPosts.every(post => (post.hashtags?.length || 0) > 0);
  const topPostsAvgCaptionLength = topPosts.length > 0 ? topPosts.reduce((sum, post) => sum + (post.caption?.length || 0), 0) / topPosts.length : 0;
  
  return {
    captionAnalysis: {
      averageLength: avgCaptionLength,
      topPerformingLength: topPostsAvgCaptionLength
    },
    topPosts,
    contentPatterns: {
      hashtagsImportant: topPostsHaveHashtags,
      optimalCaptionLength: Math.round(topPostsAvgCaptionLength)
    }
  };
}

function analyzeAudience(data: InstagramDataPackage) {
  return {
    demographics: {
      age: data.audience.age_ranges,
      gender: data.audience.gender,
      locations: data.audience.locations
    },
    activeTimes: data.audience.active_times
  };
}

function analyzeEngagement(data: InstagramDataPackage) {
  // Calculate engagement metrics
  const totalEngagement = data.media.reduce((sum, post) => {
    return sum + post.like_count + post.comments_count;
  }, 0);
  
  const totalImpressions = data.media.reduce((sum, post) => {
    return sum + (post.impressions || 0);
  }, 0);
  
  // Calculate rates
  const commentLikeRatio = data.metrics.avg_comments_per_post / Math.max(data.metrics.avg_likes_per_post, 1);
  
  return {
    overview: {
      totalEngagement,
      engagementRate: data.metrics.overall_engagement_rate,
      commentLikeRatio
    },
    breakdown: {
      likes: data.media.reduce((sum, post) => sum + post.like_count, 0),
      comments: data.media.reduce((sum, post) => sum + post.comments_count, 0),
      saves: data.media.reduce((sum, post) => sum + (post.saved || 0), 0)
    },
    trends: data.historical_growth.map(period => ({
      date: period.date,
      engagementRate: period.engagement_rate
    }))
  };
}

function findGrowthOpportunities(data: InstagramDataPackage) {
  // Identify areas for growth
  const opportunities = [];
  
  // Check posting frequency
  if (data.metrics.post_frequency < 3) {
    opportunities.push({
      area: 'Posting Frequency',
      description: 'Increase posting frequency to at least 3 times per week',
      impact: 'High',
      difficulty: 'Medium'
    });
  }
  
  // Check hashtag usage
  if (data.metrics.hashtag_performance.length < 5) {
    opportunities.push({
      area: 'Hashtag Strategy',
      description: 'Expand hashtag usage to reach new audiences',
      impact: 'Medium',
      difficulty: 'Low'
    });
  }
  
  // Check posting times
  const optimalTimes = data.metrics.optimal_posting_times;
  if (optimalTimes.length > 0) {
    opportunities.push({
      area: 'Posting Schedule',
      description: `Optimize posting schedule to focus on ${optimalTimes[0].day} at ${optimalTimes[0].hour > 12 ? optimalTimes[0].hour - 12 : optimalTimes[0].hour}${optimalTimes[0].hour >= 12 ? 'PM' : 'AM'}`,
      impact: 'Medium',
      difficulty: 'Low'
    });
  }
  
  // Check engagement
  if (data.metrics.overall_engagement_rate < 3) {
    opportunities.push({
      area: 'Audience Engagement',
      description: 'Increase engagement by asking questions and creating interactive content',
      impact: 'High',
      difficulty: 'Medium'
    });
  }
  
  return opportunities;
}

function generateRecommendations(data: InstagramDataPackage, insights: any) {
  // Generate actionable recommendations
  const recommendations = [];
  
  // Content recommendations
  recommendations.push({
    category: 'Content Strategy',
    items: [
      `Post more ${insights.contentEffectiveness.mostEffectiveType.toLowerCase()} content which performs best with your audience`,
      `Use captions of around ${Math.round(insights.contentAnalysis?.contentPatterns?.optimalCaptionLength || 100)} characters for optimal engagement`,
      `Include ${data.metrics.hashtag_performance[0]?.hashtag || 'relevant hashtags'} in your posts for better discoverability`
    ]
  });
  
  // Timing recommendations
  const optimalTimes = data.metrics.optimal_posting_times;
  recommendations.push({
    category: 'Posting Schedule',
    items: [
      `Post on ${optimalTimes.map(t => t.day).join(', ')} when your audience is most active`,
      `Schedule posts around ${optimalTimes[0]?.hour > 12 ? optimalTimes[0].hour - 12 : optimalTimes[0]?.hour || 9}${(optimalTimes[0]?.hour || 9) >= 12 ? 'PM' : 'AM'} for maximum reach`,
      `Aim for ${Math.min(data.metrics.post_frequency + 1, 7)} posts per week for optimal growth`
    ]
  });
  
  // Audience engagement recommendations
  recommendations.push({
    category: 'Audience Engagement',
    items: [
      'Respond to comments within 1 hour to boost engagement',
      'Use Instagram Stories to engage with your audience daily',
      'Create polls and questions to encourage audience participation'
    ]
  });
  
  // Growth recommendations
  recommendations.push({
    category: 'Growth Strategies',
    items: [
      'Collaborate with accounts in your niche to expand reach',
      'Run targeted Instagram ads to reach new followers',
      'Engage authentically with accounts in your target audience'
    ]
  });
  
  return recommendations;
}

function createActionPlan(recommendations: any[]) {
  // Create a 30-day action plan
  const plan = {
    title: '30-Day Instagram Growth Plan',
    weeks: [
      {
        title: 'Week 1: Foundation',
        tasks: [
          'Audit and organize your content into categories',
          'Create a content calendar for the next 30 days',
          'Implement a consistent posting schedule',
          'Review and refine your bio and profile information'
        ]
      },
      {
        title: 'Week 2: Content Optimization',
        tasks: [
          'Create 5 posts using your most effective content type',
          'Experiment with new hashtag strategies',
          'Improve your caption style based on recommendations',
          'Start engaging with 10 new accounts in your niche daily'
        ]
      },
      {
        title: 'Week 3: Audience Engagement',
        tasks: [
          'Respond to all comments within 1 hour',
          'Create daily Instagram Stories with engagement stickers',
          'Run a Q&A session with your followers',
          'Share user-generated content (with permission)'
        ]
      },
      {
        title: 'Week 4: Growth & Analysis',
        tasks: [
          'Analyze the performance of the past 3 weeks',
          'Identify which new strategies worked best',
          'Refine your approach based on the data',
          'Plan your next 30 days of content'
        ]
      }
    ]
  };
  
  return plan;
}