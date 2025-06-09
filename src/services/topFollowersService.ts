// File: src/services/topFollowersService.ts

export interface TopFollower {
  id: string;
  username: string;
  profilePicture?: string;
  engagementScore: number;
  metrics: {
    totalLikes: number;
    totalComments: number;
    totalViews: number;
    totalShares: number;
    totalSaves: number;
    avgResponseTime: number; // in minutes
    consistencyScore: number; // 0-100
  };
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
  followerSince?: string;
  lastEngagement: string;
  tags: string[];
  interactionHistory: InteractionItem[];
}

export interface InteractionItem {
  id: string;
  type: 'like' | 'comment' | 'share' | 'save' | 'story_view';
  content?: string; // For comments
  postId: string;
  postTitle?: string;
  timestamp: string;
  responseTime?: number; // How quickly they engaged after post
}

export class TopFollowersService {
  static calculateEngagementScore(follower: any): number {
    const weights = {
      likes: 1,
      comments: 3,
      shares: 5,
      saves: 4,
      storyViews: 0.5
    };
    
    const score = 
      (follower.metrics?.totalLikes || 0) * weights.likes +
      (follower.metrics?.totalComments || 0) * weights.comments +
      (follower.metrics?.totalShares || 0) * weights.shares +
      (follower.metrics?.totalSaves || 0) * weights.saves +
      (follower.metrics?.totalViews || 0) * weights.storyViews;
    
    return Math.round(score * 10) / 10;
  }

  static generateMockTopFollowers(): TopFollower[] {
    const mockFollowers: TopFollower[] = [
      {
        id: '1',
        username: 'mindful_sarah',
        profilePicture: 'https://i.pravatar.cc/150?u=sarah',
        engagementScore: 142.5,
        metrics: {
          totalLikes: 89,
          totalComments: 23,
          totalViews: 156,
          totalShares: 12,
          totalSaves: 18,
          avgResponseTime: 15,
          consistencyScore: 92
        },
        engagementTrend: 'increasing',
        followerSince: '6 months ago',
        lastEngagement: '2 hours ago',
        tags: ['super_fan', 'early_supporter', 'frequent_commenter'],
        interactionHistory: [
          {
            id: 'int1',
            type: 'comment',
            content: 'This really resonated with me! 💕',
            postId: 'post123',
            postTitle: 'Finding Balance in Social Media',
            timestamp: '2 hours ago',
            responseTime: 12
          },
          {
            id: 'int2',
            type: 'share',
            postId: 'post122',
            postTitle: 'Morning Meditation Routine',
            timestamp: '1 day ago',
            responseTime: 45
          },
          {
            id: 'int3',
            type: 'like',
            postId: 'post121',
            postTitle: 'Gratitude Practice Tips',
            timestamp: '2 days ago',
            responseTime: 8
          }
        ]
      },
      {
        id: '2',
        username: 'wellness_journey22',
        profilePicture: 'https://i.pravatar.cc/150?u=wellness',
        engagementScore: 128.0,
        metrics: {
          totalLikes: 76,
          totalComments: 19,
          totalViews: 142,
          totalShares: 8,
          totalSaves: 15,
          avgResponseTime: 32,
          consistencyScore: 85
        },
        engagementTrend: 'stable',
        followerSince: '4 months ago',
        lastEngagement: '5 hours ago',
        tags: ['super_fan', 'loyal_follower'],
        interactionHistory: [
          {
            id: 'int4',
            type: 'comment',
            content: 'Love your content! Always inspiring 🌟',
            postId: 'post123',
            postTitle: 'Finding Balance in Social Media',
            timestamp: '5 hours ago',
            responseTime: 28
          },
          {
            id: 'int5',
            type: 'save',
            postId: 'post120',
            postTitle: 'Self-Care Sunday Checklist',
            timestamp: '3 days ago'
          }
        ]
      },
      {
        id: '3',
        username: 'zenlife_alex',
        profilePicture: 'https://i.pravatar.cc/150?u=alex',
        engagementScore: 115.5,
        metrics: {
          totalLikes: 82,
          totalComments: 15,
          totalViews: 128,
          totalShares: 6,
          totalSaves: 11,
          avgResponseTime: 45,
          consistencyScore: 78
        },
        engagementTrend: 'increasing',
        followerSince: '8 months ago',
        lastEngagement: '1 day ago',
        tags: ['early_supporter', 'growth_champion'],
        interactionHistory: [
          {
            id: 'int6',
            type: 'comment',
            content: 'This is exactly what I needed today!',
            postId: 'post122',
            postTitle: 'Morning Meditation Routine',
            timestamp: '1 day ago',
            responseTime: 52
          }
        ]
      },
      {
        id: '4',
        username: 'peaceful_mind_',
        profilePicture: 'https://i.pravatar.cc/150?u=peaceful',
        engagementScore: 98.0,
        metrics: {
          totalLikes: 65,
          totalComments: 12,
          totalViews: 98,
          totalShares: 5,
          totalSaves: 9,
          avgResponseTime: 120,
          consistencyScore: 65
        },
        engagementTrend: 'stable',
        followerSince: '3 months ago',
        lastEngagement: '3 days ago',
        tags: ['regular_engager'],
        interactionHistory: [
          {
            id: 'int7',
            type: 'like',
            postId: 'post119',
            postTitle: 'Weekly Reflection Prompts',
            timestamp: '3 days ago',
            responseTime: 95
          }
        ]
      },
      {
        id: '5',
        username: 'balanced_living',
        profilePicture: 'https://i.pravatar.cc/150?u=balanced',
        engagementScore: 87.5,
        metrics: {
          totalLikes: 58,
          totalComments: 11,
          totalViews: 87,
          totalShares: 3,
          totalSaves: 8,
          avgResponseTime: 180,
          consistencyScore: 60
        },
        engagementTrend: 'decreasing',
        followerSince: '5 months ago',
        lastEngagement: '5 days ago',
        tags: ['needs_attention'],
        interactionHistory: [
          {
            id: 'int8',
            type: 'comment',
            content: 'Great tips as always!',
            postId: 'post118',
            postTitle: 'Digital Detox Guide',
            timestamp: '5 days ago',
            responseTime: 210
          }
        ]
      }
    ];

    // Add more mock followers with lower engagement
    for (let i = 6; i <= 20; i++) {
      mockFollowers.push({
        id: i.toString(),
        username: `follower_${i}`,
        profilePicture: `https://i.pravatar.cc/150?u=follower${i}`,
        engagementScore: Math.round((90 - i * 3) * 10) / 10,
        metrics: {
          totalLikes: 50 - i,
          totalComments: 10 - Math.floor(i / 3),
          totalViews: 80 - i * 2,
          totalShares: Math.max(1, 5 - Math.floor(i / 4)),
          totalSaves: Math.max(1, 7 - Math.floor(i / 3)),
          avgResponseTime: 60 + i * 10,
          consistencyScore: Math.max(30, 70 - i * 2)
        },
        engagementTrend: i % 3 === 0 ? 'increasing' : i % 3 === 1 ? 'stable' : 'decreasing',
        followerSince: `${i} months ago`,
        lastEngagement: `${i} days ago`,
        tags: i <= 10 ? ['regular_engager'] : ['occasional_engager'],
        interactionHistory: [
          {
            id: `int${i}`,
            type: 'like',
            postId: `post${100 + i}`,
            postTitle: 'Recent Post',
            timestamp: `${i} days ago`,
            responseTime: 60 + i * 10
          }
        ]
      });
    }

    return mockFollowers;
  }

  static async getTopFollowers(userId: string, limit: number = 20): Promise<TopFollower[]> {
    // In a real implementation, this would fetch from your API
    // For now, return mock data
    const mockData = this.generateMockTopFollowers();
    return mockData.slice(0, limit);
  }

  static getEngagementCategoryMetrics(): any {
    const topFollowers = this.generateMockTopFollowers();
    const superFans = topFollowers.filter(f => f.engagementScore > 100).length;
    const regularEngagers = topFollowers.filter(f => f.engagementScore >= 50 && f.engagementScore <= 100).length;
    const avgEngagement = topFollowers.reduce((acc, f) => acc + f.engagementScore, 0) / topFollowers.length;

    return {
      superFans: superFans.toString(),
      regularEngagers: regularEngagers.toString(),
      avgEngagement: `${(avgEngagement / 30).toFixed(1)}x` // Normalized to a multiplier
    };
  }

  static getFollowerTags(follower: TopFollower): string[] {
    const tags = [];
    
    if (follower.engagementScore > 100) {
      tags.push('super_fan');
    }
    if (follower.metrics.consistencyScore > 80) {
      tags.push('consistent_engager');
    }
    if (follower.metrics.avgResponseTime < 30) {
      tags.push('quick_responder');
    }
    if (follower.metrics.totalComments > 20) {
      tags.push('frequent_commenter');
    }
    if (follower.metrics.totalShares > 10) {
      tags.push('brand_advocate');
    }
    
    return tags;
  }

  static getEngagementInsights(topFollowers: TopFollower[]): string[] {
    const insights = [];
    
    const superFansCount = topFollowers.filter(f => f.engagementScore > 100).length;
    const avgResponseTime = topFollowers.reduce((acc, f) => acc + f.metrics.avgResponseTime, 0) / topFollowers.length;
    const increasingEngagement = topFollowers.filter(f => f.engagementTrend === 'increasing').length;
    
    if (superFansCount >= 5) {
      insights.push(`You have ${superFansCount} super fans who engage with over 80% of your content!`);
    }
    
    if (avgResponseTime < 60) {
      insights.push('Your top followers typically engage within an hour of posting - great community responsiveness!');
    }
    
    if (increasingEngagement > topFollowers.length / 2) {
      insights.push('Over half of your top followers are increasingly engaging with your content.');
    }
    
    // Add personalized recommendations
    const needsAttention = topFollowers.filter(f => f.engagementTrend === 'decreasing');
    if (needsAttention.length > 0) {
      insights.push(`${needsAttention.length} top followers need attention - consider reaching out with personalized content.`);
    }
    
    return insights;
  }
}