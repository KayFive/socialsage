// src/services/achievementEngine.ts
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'growth' | 'engagement' | 'content' | 'consistency' | 'milestone';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  max_progress?: number;
  shareText?: string;
  celebrationMessage?: string;
}

export interface UserStats {
  total_achievements: number;
  bronze_count: number;
  silver_count: number;
  gold_count: number;
  platinum_count: number;
  achievement_score: number;
  latest_unlock?: Achievement;
}

export class AchievementEngine {
  
  static evaluateAchievements(reportData: any, userHistory?: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    const profile = reportData?.profile;
    const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
    
    // Follower Milestones
    achievements.push(...this.checkFollowerMilestones(profile));
    
    // Engagement Achievements
    achievements.push(...this.checkEngagementAchievements(profile, media));
    
    // Content Achievements
    achievements.push(...this.checkContentAchievements(media));
    
    // Growth Achievements
    achievements.push(...this.checkGrowthAchievements(reportData, userHistory));
    
    // Consistency Achievements
    achievements.push(...this.checkConsistencyAchievements(media));
    
    return achievements;
  }
  
  private static checkFollowerMilestones(profile: any): Achievement[] {
    const achievements: Achievement[] = [];
    const followers = profile?.followers_count || 0;
    
    const milestones = [
      { count: 100, title: "First Century", icon: "🌱", difficulty: "bronze" as const },
      { count: 500, title: "Rising Star", icon: "⭐", difficulty: "bronze" as const },
      { count: 1000, title: "1K Club", icon: "🎯", difficulty: "silver" as const },
      { count: 5000, title: "Influence Builder", icon: "🚀", difficulty: "silver" as const },
      { count: 10000, title: "10K Legend", icon: "👑", difficulty: "gold" as const },
      { count: 50000, title: "Creator Elite", icon: "💎", difficulty: "gold" as const },
      { count: 100000, title: "Mega Influencer", icon: "🌟", difficulty: "platinum" as const },
    ];
    
    milestones.forEach(milestone => {
      const unlocked = followers >= milestone.count;
      achievements.push({
        id: `followers_${milestone.count}`,
        title: milestone.title,
        description: `Reach ${milestone.count.toLocaleString()} followers`,
        icon: milestone.icon,
        category: 'milestone',
        difficulty: milestone.difficulty,
        unlocked,
        progress: Math.min(followers, milestone.count),
        max_progress: milestone.count,
        shareText: unlocked ? `🎉 Just unlocked "${milestone.title}" on Social Sage! ${milestone.count.toLocaleString()} followers and counting! 📈 #SocialSageWins` : undefined,
        celebrationMessage: unlocked ? `Congratulations! You've reached ${milestone.count.toLocaleString()} followers! 🎉` : undefined
      });
    });
    
    return achievements;
  }
  
  private static checkEngagementAchievements(profile: any, media: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    const engagementRate = profile?.engagement_rate || 0;
    
    const engagementTiers = [
      { rate: 2, title: "Engagement Starter", icon: "💬", difficulty: "bronze" as const },
      { rate: 4, title: "Community Builder", icon: "🤝", difficulty: "silver" as const },
      { rate: 6, title: "Engagement Master", icon: "🔥", difficulty: "gold" as const },
      { rate: 10, title: "Viral Magnet", icon: "⚡", difficulty: "platinum" as const },
    ];
    
    engagementTiers.forEach(tier => {
      const unlocked = engagementRate >= tier.rate;
      achievements.push({
        id: `engagement_${tier.rate}`,
        title: tier.title,
        description: `Achieve ${tier.rate}%+ engagement rate`,
        icon: tier.icon,
        category: 'engagement',
        difficulty: tier.difficulty,
        unlocked,
        progress: Math.min(engagementRate, tier.rate),
        max_progress: tier.rate,
        shareText: unlocked ? `💪 Unlocked "${tier.title}" with ${engagementRate.toFixed(1)}% engagement rate! My audience loves my content! 🔥 #EngagementWins` : undefined
      });
    });
    
    // High performing post achievements
    if (media.length > 0) {
      const topPost = media.reduce((best: any, current: any) => {
        const bestEngagement = (best.like_count || 0) + (best.comments_count || 0);
        const currentEngagement = (current.like_count || 0) + (current.comments_count || 0);
        return currentEngagement > bestEngagement ? current : best;
      });
      
      const topEngagement = (topPost.like_count || 0) + (topPost.comments_count || 0);
      
      const viralTiers = [
        { engagement: 100, title: "Hundred Club", icon: "💯", difficulty: "bronze" as const },
        { engagement: 500, title: "Crowd Pleaser", icon: "👏", difficulty: "silver" as const },
        { engagement: 1000, title: "Viral Rookie", icon: "🌊", difficulty: "gold" as const },
        { engagement: 5000, title: "Viral Expert", icon: "🔥", difficulty: "platinum" as const },
      ];
      
      viralTiers.forEach(tier => {
        const unlocked = topEngagement >= tier.engagement;
        achievements.push({
          id: `viral_${tier.engagement}`,
          title: tier.title,
          description: `Get ${tier.engagement.toLocaleString()}+ total engagement on a single post`,
          icon: tier.icon,
          category: 'content',
          difficulty: tier.difficulty,
          unlocked,
          shareText: unlocked ? `🚀 My post just got ${topEngagement.toLocaleString()} total engagement! Unlocked "${tier.title}" badge! 📈 #ViralMoment` : undefined
        });
      });
    }
    
    return achievements;
  }
  
  private static checkContentAchievements(media: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    
    if (media.length === 0) return achievements;
    
    // Content volume achievements
    const contentTiers = [
      { count: 10, title: "Content Creator", icon: "📸", difficulty: "bronze" as const },
      { count: 50, title: "Prolific Poster", icon: "📚", difficulty: "silver" as const },
      { count: 100, title: "Content Machine", icon: "⚙️", difficulty: "gold" as const },
      { count: 500, title: "Content Legend", icon: "🏆", difficulty: "platinum" as const },
    ];
    
    contentTiers.forEach(tier => {
      const unlocked = media.length >= tier.count;
      achievements.push({
        id: `content_${tier.count}`,
        title: tier.title,
        description: `Create ${tier.count} posts`,
        icon: tier.icon,
        category: 'content',
        difficulty: tier.difficulty,
        unlocked,
        progress: Math.min(media.length, tier.count),
        max_progress: tier.count
      });
    });
    
    // Content type diversity
    const mediaTypes = new Set(media.map((post: any) => post.media_type).filter(Boolean));
    if (mediaTypes.size >= 2) {
      achievements.push({
        id: 'content_diversity',
        title: 'Content Diversifier',
        description: 'Post different types of content (photos, videos, carousels)',
        icon: '🎨',
        category: 'content',
        difficulty: 'silver',
        unlocked: true,
        shareText: '🎨 I mix up my content types to keep my audience engaged! Just unlocked "Content Diversifier" 📸🎥 #ContentStrategy'
      });
    }
    
    return achievements;
  }
  
  private static checkGrowthAchievements(reportData: any, userHistory?: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    
    // If we don't have history, we can't check growth
    if (!userHistory || userHistory.length < 2) {
      return achievements;
    }
    
    // Calculate growth metrics (simplified for demo)
    const currentFollowers = reportData?.profile?.followers_count || 0;
    const previousReport = userHistory[userHistory.length - 2];
    const previousFollowers = previousReport?.report_data?.profile?.followers_count || 0;
    
    if (previousFollowers > 0) {
      const growthRate = ((currentFollowers - previousFollowers) / previousFollowers) * 100;
      
      const growthTiers = [
        { rate: 5, title: "Growth Spurt", icon: "📈", difficulty: "bronze" as const },
        { rate: 10, title: "Momentum Builder", icon: "🚀", difficulty: "silver" as const },
        { rate: 25, title: "Viral Growth", icon: "💥", difficulty: "gold" as const },
        { rate: 50, title: "Explosive Growth", icon: "🌋", difficulty: "platinum" as const },
      ];
      
      growthTiers.forEach(tier => {
        const unlocked = growthRate >= tier.rate;
        achievements.push({
          id: `growth_${tier.rate}`,
          title: tier.title,
          description: `Achieve ${tier.rate}%+ follower growth`,
          icon: tier.icon,
          category: 'growth',
          difficulty: tier.difficulty,
          unlocked,
          shareText: unlocked ? `📈 Just achieved ${growthRate.toFixed(1)}% follower growth! Unlocked "${tier.title}" badge! 🚀 #GrowthWins` : undefined
        });
      });
    }
    
    return achievements;
  }
  
  private static checkConsistencyAchievements(media: any[]): Achievement[] {
    const achievements: Achievement[] = [];
    
    if (media.length < 7) return achievements;
    
    // Check posting consistency over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPosts = media.filter((post: any) => {
      if (!post.timestamp) return false;
      return new Date(post.timestamp) >= thirtyDaysAgo;
    });
    
    const consistencyTiers = [
      { posts: 7, title: "Week Warrior", icon: "⚡", difficulty: "bronze" as const },
      { posts: 15, title: "Consistency King", icon: "👑", difficulty: "silver" as const },
      { posts: 30, title: "Daily Dedication", icon: "🔥", difficulty: "gold" as const },
    ];
    
    consistencyTiers.forEach(tier => {
      const unlocked = recentPosts.length >= tier.posts;
      achievements.push({
        id: `consistency_${tier.posts}`,
        title: tier.title,
        description: `Post ${tier.posts} times in 30 days`,
        icon: tier.icon,
        category: 'consistency',
        difficulty: tier.difficulty,
        unlocked,
        progress: Math.min(recentPosts.length, tier.posts),
        max_progress: tier.posts,
        shareText: unlocked ? `💪 Consistency pays off! Posted ${recentPosts.length} times this month and unlocked "${tier.title}"! 📅 #ConsistencyWins` : undefined
      });
    });
    
    return achievements;
  }
  
  static calculateUserStats(achievements: Achievement[]): UserStats {
    const unlocked = achievements.filter(a => a.unlocked);
    const bronze = unlocked.filter(a => a.difficulty === 'bronze').length;
    const silver = unlocked.filter(a => a.difficulty === 'silver').length;
    const gold = unlocked.filter(a => a.difficulty === 'gold').length;
    const platinum = unlocked.filter(a => a.difficulty === 'platinum').length;
    
    // Calculate achievement score (weighted by difficulty)
    const score = bronze * 10 + silver * 25 + gold * 50 + platinum * 100;
    
    // Find latest unlock
    const latest = unlocked
      .filter(a => a.unlocked_at)
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())[0];
    
    return {
      total_achievements: unlocked.length,
      bronze_count: bronze,
      silver_count: silver,
      gold_count: gold,
      platinum_count: platinum,
      achievement_score: score,
      latest_unlock: latest
    };
  }
}