// src/services/benchmarkingService.ts
export interface BenchmarkData {
  category: string;
  user_value: number;
  peer_average: number;
  peer_median: number;
  percentile: number;
  comparison: 'above' | 'below' | 'average';
  insight: string;
  improvement_tip?: string;
}

export interface PeerComparison {
  overall_rank: string;
  total_peers: number;
  benchmarks: BenchmarkData[];
  achievement_rank: string;
  next_milestone: {
    metric: string;
    current: number;
    target: number;
    gap: number;
  };
}

export interface StreamlinedComparison {
  metrics: Array<{
    name: string;
    userValue: number;
    peerAverage: number;
    peerMedian: number;
    percentile: number;
    unit: string;
    trend: 'up' | 'down' | 'neutral';
    insight: string;
  }>;
  totalPeers: number;
}

export class BenchmarkingService {
  
  static generatePeerComparison(reportData: any, userAchievements: any[]): PeerComparison {
    const profile = reportData?.profile;
    const followers = profile?.followers_count || 0;
    const engagementRate = profile?.engagement_rate || 0;
    const mediaCount = reportData?.media?.length || 0;
    const achievementScore = this.calculateAchievementScore(userAchievements);
    
    // Simulate peer data based on follower range
    const peerData = this.generatePeerData(followers);
    
    const benchmarks: BenchmarkData[] = [
      {
        category: 'Engagement Rate',
        user_value: engagementRate,
        peer_average: peerData.avgEngagement,
        peer_median: peerData.medianEngagement,
        percentile: this.calculatePercentile(engagementRate, peerData.engagements),
        comparison: this.getComparison(engagementRate, peerData.avgEngagement),
        insight: this.generateEngagementInsight(engagementRate, peerData.avgEngagement),
        improvement_tip: engagementRate < peerData.avgEngagement ? 
          "Try asking questions in your captions and responding to comments quickly" : undefined
      },
      {
        category: 'Posting Frequency',
        user_value: this.calculatePostingFrequency(reportData),
        peer_average: peerData.avgPostFreq,
        peer_median: peerData.medianPostFreq,
        percentile: this.calculatePercentile(this.calculatePostingFrequency(reportData), peerData.postFreqs),
        comparison: this.getComparison(this.calculatePostingFrequency(reportData), peerData.avgPostFreq),
        insight: this.generatePostingInsight(this.calculatePostingFrequency(reportData), peerData.avgPostFreq),
        improvement_tip: this.calculatePostingFrequency(reportData) < peerData.avgPostFreq ?
          "Consider posting more consistently - aim for 4-5 posts per week" : undefined
      },
      {
        category: 'Achievement Score',
        user_value: achievementScore,
        peer_average: peerData.avgAchievements,
        peer_median: peerData.medianAchievements,
        percentile: this.calculatePercentile(achievementScore, peerData.achievements),
        comparison: this.getComparison(achievementScore, peerData.avgAchievements),
        insight: this.generateAchievementInsight(achievementScore, peerData.avgAchievements)
      }
    ];
    
    const overallPercentile = Math.round(
      benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length
    );
    
    return {
      overall_rank: this.getPercentileLabel(overallPercentile),
      total_peers: peerData.totalPeers,
      benchmarks,
      achievement_rank: this.getAchievementRank(achievementScore),
      next_milestone: this.getNextMilestone(reportData, achievementScore)
    };
  }

  static generateStreamlinedComparison(reportData: any): StreamlinedComparison | null {
    try {
      const profile = reportData.profile || {};
      const summary = reportData.summary || {};
      const media = reportData.media || [];

      // Calculate user metrics
      const userEngagementRate = summary.keyMetrics?.engagement || 0;
      const userPostingFrequency = this.calculatePostingFrequencyWeekly(media);
      const userFollowerCount = profile.followers_count || 0;

      // Simulated peer data (in real app, this would come from your database)
      const peerData = {
        engagementRate: {
          average: 4.8,
          median: 4.9,
          userValue: userEngagementRate
        },
        postingFrequency: {
          average: 4.5,
          median: 4.7,
          userValue: userPostingFrequency
        },
        followerGrowth: {
          average: 12.5,
          median: 10.2,
          userValue: this.estimateGrowthRate(userFollowerCount)
        }
      };

      const metrics = [
        {
          name: 'Engagement Rate',
          userValue: userEngagementRate,
          peerAverage: peerData.engagementRate.average,
          peerMedian: peerData.engagementRate.median,
          percentile: this.calculatePercentileFromAverage(userEngagementRate, peerData.engagementRate.average),
          unit: '%',
          trend: userEngagementRate > peerData.engagementRate.average ? 'up' : 'down' as 'up' | 'down',
          insight: userEngagementRate > peerData.engagementRate.average 
            ? `Your engagement rate is ${((userEngagementRate / peerData.engagementRate.average - 1) * 100).toFixed(0)}% above average! Your audience loves your content.`
            : `Consider creating more engaging content to boost your engagement rate above the ${peerData.engagementRate.average}% average.`
        },
        {
          name: 'Posting Frequency',
          userValue: userPostingFrequency,
          peerAverage: peerData.postingFrequency.average,
          peerMedian: peerData.postingFrequency.median,
          percentile: this.calculatePercentileFromAverage(userPostingFrequency, peerData.postingFrequency.average),
          unit: 'posts/week',
          trend: userPostingFrequency > peerData.postingFrequency.average ? 'up' : 'down' as 'up' | 'down',
          insight: userPostingFrequency < peerData.postingFrequency.average
            ? `Consider posting more consistently - aim for ${Math.ceil(peerData.postingFrequency.average)} posts per week.`
            : `Great posting consistency! You're posting more frequently than ${this.calculatePercentileFromAverage(userPostingFrequency, peerData.postingFrequency.average)}% of peers.`
        }
      ];

      return {
        metrics,
        totalPeers: 2000 // This would be dynamic in a real app
      };
    } catch (error) {
      console.error('Error generating streamlined comparison:', error);
      return null;
    }
  }

  private static calculatePostingFrequencyWeekly(media: any[]): number {
    if (!media || media.length === 0) return 0;
    
    // Calculate posts per week based on date range
    const dates = media
      .map(post => new Date(post.timestamp))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length < 2) return media.length;
    
    const daysDiff = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24);
    const weeksDiff = Math.max(daysDiff / 7, 1);
    
    return Math.round((media.length / weeksDiff) * 10) / 10;
  }

  private static calculatePercentileFromAverage(userValue: number, average: number): number {
    // Simplified percentile calculation
    // In a real app, this would use actual distribution data
    const ratio = userValue / average;
    
    if (ratio >= 2.0) return 95;
    if (ratio >= 1.5) return 85;
    if (ratio >= 1.2) return 75;
    if (ratio >= 1.0) return 60;
    if (ratio >= 0.8) return 40;
    if (ratio >= 0.6) return 25;
    if (ratio >= 0.4) return 15;
    return 5;
  }

  private static estimateGrowthRate(followerCount: number): number {
    // Simplified growth rate estimation
    // In a real app, this would track historical data
    if (followerCount > 100000) return 8.5;
    if (followerCount > 10000) return 12.0;
    if (followerCount > 1000) return 15.5;
    return 18.0;
  }
  
  private static generatePeerData(followers: number) {
    // Generate realistic peer data based on follower count
    let baseEngagement = 4.5;
    let basePostFreq = 4.2;
    let baseAchievements = 150;
    let totalPeers = 1000;
    
    // Adjust based on follower count
    if (followers < 1000) {
      baseEngagement = 6.2;
      basePostFreq = 3.1;
      baseAchievements = 80;
      totalPeers = 500;
    } else if (followers < 10000) {
      baseEngagement = 4.8;
      basePostFreq = 4.5;
      baseAchievements = 180;
      totalPeers = 2000;
    } else if (followers < 100000) {
      baseEngagement = 3.2;
      basePostFreq = 5.8;
      baseAchievements = 320;
      totalPeers = 5000;
    }
    
    // Generate arrays of peer data with some variance
    const engagements = Array.from({length: 100}, () => 
      Math.max(0.5, baseEngagement + (Math.random() - 0.5) * 4)
    );
    
    const postFreqs = Array.from({length: 100}, () => 
      Math.max(1, basePostFreq + (Math.random() - 0.5) * 3)
    );
    
    const achievements = Array.from({length: 100}, () => 
      Math.max(0, baseAchievements + (Math.random() - 0.5) * 200)
    );
    
    return {
      totalPeers,
      avgEngagement: baseEngagement,
      medianEngagement: this.median(engagements),
      engagements,
      avgPostFreq: basePostFreq,
      medianPostFreq: this.median(postFreqs),
      postFreqs,
      avgAchievements: baseAchievements,
      medianAchievements: this.median(achievements),
      achievements
    };
  }
  
  private static calculatePercentile(value: number, array: number[]): number {
    const sorted = array.sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return Math.round((below / sorted.length) * 100);
  }
  
  private static getComparison(userValue: number, peerAverage: number): 'above' | 'below' | 'average' {
    const diff = Math.abs(userValue - peerAverage) / peerAverage;
    if (diff < 0.1) return 'average';
    return userValue > peerAverage ? 'above' : 'below';
  }
  
  private static generateEngagementInsight(userRate: number, peerAvg: number): string {
    const diff = ((userRate - peerAvg) / peerAvg) * 100;
    
    if (diff > 20) {
      return `🔥 Your engagement rate is ${Math.abs(diff).toFixed(0)}% above average! Your audience loves your content.`;
    } else if (diff > 0) {
      return `✨ You're performing ${diff.toFixed(0)}% better than similar accounts.`;
    } else if (diff > -20) {
      return `📈 You're slightly below average. Focus on creating more engaging content.`;
    } else {
      return `💡 There's room for improvement. Try posting at peak times and engaging more with your audience.`;
    }
  }
  
  private static generatePostingInsight(userFreq: number, peerAvg: number): string {
    if (userFreq > peerAvg * 1.2) {
      return `🚀 You post more frequently than most similar accounts - great for staying top of mind!`;
    } else if (userFreq < peerAvg * 0.8) {
      return `📅 You could benefit from posting more consistently to match your peers.`;
    } else {
      return `👍 Your posting frequency is right on track with similar accounts.`;
    }
  }
  
  private static generateAchievementInsight(userScore: number, peerAvg: number): string {
    if (userScore > peerAvg * 1.3) {
      return `🏆 You're an achievement superstar! You've unlocked way more than most users.`;
    } else if (userScore > peerAvg) {
      return `⭐ You're ahead of the pack with your achievements!`;
    } else {
      return `🎯 Keep unlocking achievements to climb the leaderboard!`;
    }
  }
  
  private static calculatePostingFrequency(reportData: any): number {
    const media = reportData?.media || [];
    if (media.length < 2) return 1;
    
    // Simple calculation for demo
    return Math.min(7, media.length / 4); // Assume 4 weeks of data
  }
  
  private static calculateAchievementScore(achievements: any[]): number {
    return achievements.filter(a => a.unlocked).reduce((sum, a) => {
      const scores = { bronze: 10, silver: 25, gold: 50, platinum: 100 };
      return sum + (scores[a.difficulty as keyof typeof scores] || 0);
    }, 0);
  }
  
  private static getPercentileLabel(percentile: number): string {
    if (percentile >= 90) return "Top 10%";
    if (percentile >= 75) return "Top 25%";
    if (percentile >= 50) return "Top 50%";
    return "Bottom 50%";
  }
  
  private static getAchievementRank(score: number): string {
    if (score >= 500) return "Achievement Legend";
    if (score >= 300) return "Achievement Master";
    if (score >= 150) return "Achievement Hunter";
    if (score >= 50) return "Achievement Seeker";
    return "Achievement Beginner";
  }
  
  private static getNextMilestone(reportData: any, achievementScore: number) {
    const followers = reportData?.profile?.followers_count || 0;
    const engagementRate = reportData?.profile?.engagement_rate || 0;
    
    // Find the next follower milestone
    const followerMilestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
    const nextFollowerMilestone = followerMilestones.find(m => m > followers);
    
    // Find the next engagement milestone
    const engagementMilestones = [2, 4, 6, 8, 10];
    const nextEngagementMilestone = engagementMilestones.find(m => m > engagementRate);
    
    // Find the next achievement milestone
    const achievementMilestones = [50, 100, 200, 300, 500];
    const nextAchievementMilestone = achievementMilestones.find(m => m > achievementScore);
    
    // Return the closest/most achievable milestone
    if (nextFollowerMilestone && (nextFollowerMilestone - followers) < followers * 0.5) {
      return {
        metric: 'Followers',
        current: followers,
        target: nextFollowerMilestone,
        gap: nextFollowerMilestone - followers
      };
    }
    
    if (nextEngagementMilestone && (nextEngagementMilestone - engagementRate) < 2) {
      return {
        metric: 'Engagement Rate',
        current: engagementRate,
        target: nextEngagementMilestone,
        gap: nextEngagementMilestone - engagementRate
      };
    }
    
    return {
      metric: 'Achievement Score',
      current: achievementScore,
      target: nextAchievementMilestone || achievementScore + 100,
      gap: (nextAchievementMilestone || achievementScore + 100) - achievementScore
    };
  }
  
  private static median(array: number[]): number {
    const sorted = array.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}