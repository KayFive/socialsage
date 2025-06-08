// src/services/analyticsDataService.ts

export interface MonthlyMetrics {
  month: string;
  year: number;
  followers: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalEngagement: number;
  avgEngagementPerPost: number;
  engagementRate: number;
}

export interface GrowthMetrics {
  followersGrowth: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  engagementGrowth: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  postsGrowth: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}

export interface ContentCategory {
  category: string;
  count: number;
  percentage: number;
  avgLikes: number;
  avgComments: number;
  avgEngagement: number;
  engagementRate: number;
  topPost?: any;
  examples: any[];
}

export interface ContentInsights {
  categories: ContentCategory[];
  bestPerformingCategory: ContentCategory;
  underperformingCategory: ContentCategory;
  recommendations: string[];
}

export interface AnalyticsData {
  monthlyMetrics: MonthlyMetrics[];
  growthMetrics: GrowthMetrics;
  contentInsights: ContentInsights;
  currentMonth: MonthlyMetrics;
  previousMonth: MonthlyMetrics;
}

export class AnalyticsDataService {
  
  static processReportData(reportData: any): AnalyticsData {
    try {
      const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
      const profile = reportData?.profile || {};
      
      // Generate monthly metrics (current + previous months)
      const monthlyMetrics = this.generateMonthlyMetrics(media, profile);
      
      // Calculate growth metrics
      const growthMetrics = this.calculateGrowthMetrics(monthlyMetrics);
      
      // Analyze content categories
      const contentInsights = this.analyzeContentCategories(media, profile);
      
      return {
        monthlyMetrics,
        growthMetrics,
        contentInsights,
        currentMonth: monthlyMetrics[monthlyMetrics.length - 1],
        previousMonth: monthlyMetrics[monthlyMetrics.length - 2] || monthlyMetrics[0]
      };
    } catch (error) {
      console.error('Error processing analytics data:', error);
      return this.getDefaultAnalyticsData();
    }
  }
  
  private static generateMonthlyMetrics(media: any[], profile: any): MonthlyMetrics[] {
    const metrics: MonthlyMetrics[] = [];
    const currentDate = new Date();
    
    // Generate last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = targetDate.toLocaleDateString('en-US', { month: 'long' });
      const year = targetDate.getFullYear();
      
      // Filter posts for this month
      const monthPosts = media.filter((post: any) => {
        if (!post.timestamp) return i === 0; // Put posts without timestamp in current month
        const postDate = new Date(post.timestamp);
        return postDate.getMonth() === targetDate.getMonth() && 
               postDate.getFullYear() === targetDate.getFullYear();
      });
      
      // Calculate metrics for this month
      const totalLikes = monthPosts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0);
      const totalComments = monthPosts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
      const totalEngagement = totalLikes + totalComments;
      const avgEngagementPerPost = monthPosts.length > 0 ? totalEngagement / monthPosts.length : 0;
      
      // Simulate follower growth (in real app, this would come from historical data)
      const baseFollowers = profile.followers_count || 1000;
      const growthFactor = 1 - (i * 0.05) - (Math.random() * 0.02); // Gradual growth with some variance
      const followers = Math.round(baseFollowers * growthFactor);
      
      const engagementRate = followers > 0 ? (avgEngagementPerPost / followers) * 100 : 0;
      
      metrics.push({
        month,
        year,
        followers,
        totalPosts: monthPosts.length,
        totalLikes,
        totalComments,
        totalEngagement,
        avgEngagementPerPost,
        engagementRate
      });
    }
    
    return metrics;
  }
  
  private static calculateGrowthMetrics(monthlyMetrics: MonthlyMetrics[]): GrowthMetrics {
    if (monthlyMetrics.length < 2) {
      return this.getDefaultGrowthMetrics();
    }
    
    const current = monthlyMetrics[monthlyMetrics.length - 1];
    const previous = monthlyMetrics[monthlyMetrics.length - 2];
    
    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;
      return { current, previous, change, changePercent };
    };
    
    return {
      followersGrowth: calculateChange(current.followers, previous.followers),
      engagementGrowth: calculateChange(current.avgEngagementPerPost, previous.avgEngagementPerPost),
      postsGrowth: calculateChange(current.totalPosts, previous.totalPosts)
    };
  }
  
  private static analyzeContentCategories(media: any[], profile: any): ContentInsights {
    const categories = this.categorizeContent(media);
    const sortedCategories = categories.sort((a, b) => b.avgEngagement - a.avgEngagement);
    
    const bestPerforming = sortedCategories[0];
    const underperforming = sortedCategories[sortedCategories.length - 1];
    
    // Generate recommendations based on performance
    const recommendations = this.generateContentRecommendations(categories, bestPerforming, underperforming);
    
    return {
      categories: sortedCategories,
      bestPerformingCategory: bestPerforming,
      underperformingCategory: underperforming,
      recommendations
    };
  }
  
  private static categorizeContent(media: any[]): ContentCategory[] {
    const categories: { [key: string]: any[] } = {
      'Photo Posts': [],
      'Video Content': [],
      'Carousel Posts': [],
      'Educational': [],
      'Personal/Lifestyle': [],
      'Promotional': [],
      'Behind the Scenes': [],
      'User Generated': []
    };
    
    media.forEach((post: any) => {
      // Categorize by media type first
      if (post.media_type === 'VIDEO' || post.media_type === 'video') {
        categories['Video Content'].push(post);
      } else if (post.media_type === 'CAROUSEL_ALBUM' || post.media_type === 'carousel_album') {
        categories['Carousel Posts'].push(post);
      } else {
        categories['Photo Posts'].push(post);
      }
      
      // Categorize by content type based on caption
      const caption = (post.caption || '').toLowerCase();
      
      if (this.isEducational(caption)) {
        categories['Educational'].push(post);
      } else if (this.isPersonalLifestyle(caption)) {
        categories['Personal/Lifestyle'].push(post);
      } else if (this.isPromotional(caption)) {
        categories['Promotional'].push(post);
      } else if (this.isBehindTheScenes(caption)) {
        categories['Behind the Scenes'].push(post);
      } else if (this.isUserGenerated(caption)) {
        categories['User Generated'].push(post);
      }
    });
    
    // Convert to ContentCategory objects
    const result: ContentCategory[] = [];
    const totalPosts = media.length;
    
    Object.entries(categories).forEach(([category, posts]) => {
      if (posts.length > 0) {
        const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0);
        const totalComments = posts.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
        const totalEngagement = totalLikes + totalComments;
        
        const avgLikes = totalLikes / posts.length;
        const avgComments = totalComments / posts.length;
        const avgEngagement = totalEngagement / posts.length;
        
        // Find top performing post in this category
        const topPost = posts.sort((a: any, b: any) => 
          ((b.like_count || 0) + (b.comments_count || 0)) - 
          ((a.like_count || 0) + (a.comments_count || 0))
        )[0];
        
        result.push({
          category,
          count: posts.length,
          percentage: (posts.length / totalPosts) * 100,
          avgLikes,
          avgComments,
          avgEngagement,
          engagementRate: avgEngagement, // Simplified for now
          topPost,
          examples: posts.slice(0, 3)
        });
      }
    });
    
    return result;
  }
  
  private static isEducational(caption: string): boolean {
    const keywords = ['tip', 'tips', 'how to', 'tutorial', 'learn', 'guide', 'lesson', 'advice', 'hack', 'strategy'];
    return keywords.some(keyword => caption.includes(keyword));
  }
  
  private static isPersonalLifestyle(caption: string): boolean {
    const keywords = ['my', 'today', 'morning', 'coffee', 'weekend', 'family', 'home', 'personal', 'life', 'daily'];
    return keywords.some(keyword => caption.includes(keyword));
  }
  
  private static isPromotional(caption: string): boolean {
    const keywords = ['sale', 'discount', 'buy', 'shop', 'offer', 'deal', 'promo', 'code', 'link', 'available'];
    return keywords.some(keyword => caption.includes(keyword));
  }
  
  private static isBehindTheScenes(caption: string): boolean {
    const keywords = ['behind', 'process', 'making', 'setup', 'backstage', 'work', 'studio', 'creating'];
    return keywords.some(keyword => caption.includes(keyword));
  }
  
  private static isUserGenerated(caption: string): boolean {
    const keywords = ['repost', 'feature', 'customer', 'community', 'fan', 'follower', 'thanks', 'shoutout'];
    return keywords.some(keyword => caption.includes(keyword));
  }
  
  private static generateContentRecommendations(
    categories: ContentCategory[], 
    bestPerforming: ContentCategory, 
    underperforming: ContentCategory
  ): string[] {
    const recommendations: string[] = [];
    
    if (bestPerforming) {
      recommendations.push(
        `Your ${bestPerforming.category.toLowerCase()} content performs best with ${bestPerforming.avgEngagement.toFixed(0)} avg engagement. Create more of this type.`
      );
    }
    
    if (underperforming && underperforming.avgEngagement < bestPerforming.avgEngagement * 0.5) {
      recommendations.push(
        `Consider reducing ${underperforming.category.toLowerCase()} content or improving its quality (currently ${underperforming.avgEngagement.toFixed(0)} avg engagement).`
      );
    }
    
    // Check for missing high-performing content types
    const videoCategory = categories.find(c => c.category === 'Video Content');
    const carouselCategory = categories.find(c => c.category === 'Carousel Posts');
    const educationalCategory = categories.find(c => c.category === 'Educational');
    
    if (!videoCategory || videoCategory.percentage < 20) {
      recommendations.push('Video content typically drives 2-3x higher engagement. Consider creating more video posts.');
    }
    
    if (!carouselCategory || carouselCategory.percentage < 15) {
      recommendations.push('Carousel posts increase time spent viewing content. Try creating educational slide series.');
    }
    
    if (!educationalCategory || educationalCategory.percentage < 25) {
      recommendations.push('Educational content gets saved and shared more often. Share tips and tutorials in your niche.');
    }
    
    return recommendations.slice(0, 4); // Limit to top 4 recommendations
  }
  
  private static getDefaultAnalyticsData(): AnalyticsData {
    const defaultMonth: MonthlyMetrics = {
      month: 'Current',
      year: new Date().getFullYear(),
      followers: 0,
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalEngagement: 0,
      avgEngagementPerPost: 0,
      engagementRate: 0
    };
    
    return {
      monthlyMetrics: [defaultMonth],
      growthMetrics: this.getDefaultGrowthMetrics(),
      contentInsights: {
        categories: [],
        bestPerformingCategory: {
          category: 'No Data',
          count: 0,
          percentage: 0,
          avgLikes: 0,
          avgComments: 0,
          avgEngagement: 0,
          engagementRate: 0,
          examples: []
        },
        underperformingCategory: {
          category: 'No Data',
          count: 0,
          percentage: 0,
          avgLikes: 0,
          avgComments: 0,
          avgEngagement: 0,
          engagementRate: 0,
          examples: []
        },
        recommendations: ['Need more data to generate insights']
      },
      currentMonth: defaultMonth,
      previousMonth: defaultMonth
    };
  }
  
  private static getDefaultGrowthMetrics(): GrowthMetrics {
    return {
      followersGrowth: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      },
      engagementGrowth: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      },
      postsGrowth: {
        current: 0,
        previous: 0,
        change: 0,
        changePercent: 0
      }
    };
  }
  
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }
  
  static formatPercentage(num: number): string {
    return (num >= 0 ? '+' : '') + num.toFixed(1) + '%';
  }
  
  static getGrowthColor(percentage: number): string {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  }
  
  static getGrowthIcon(percentage: number): string {
    if (percentage > 0) return '📈';
    if (percentage < 0) return '📉';
    return '➡️';
  }
}