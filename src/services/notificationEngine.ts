// src/services/notificationEngine.ts
export interface SmartNotification {
  id: string;
  type: 'timing' | 'opportunity' | 'milestone' | 'insight' | 'reminder';
  title: string;
  body: string;
  action_url?: string;
  action_label?: string;
  priority: 'high' | 'medium' | 'low';
  scheduled_for?: string;
  data: any;
}

export class NotificationEngine {
  
  static generateNotifications(reportData: any, userTimezone: string = 'America/Los_Angeles'): SmartNotification[] {
    const notifications: SmartNotification[] = [];
    const now = new Date();
    
    // 1. Optimal posting time notifications
    const optimalTime = this.calculateOptimalPostingTime(reportData);
    if (optimalTime) {
      const nextOptimalTime = this.getNextOptimalTime(optimalTime, userTimezone);
      notifications.push({
        id: `timing_${Date.now()}`,
        type: 'timing',
        title: '⏰ Perfect time to post!',
        body: `Your audience is most active right now. Post something to maximize engagement!`,
        action_url: '/analysis/new',
        action_label: 'Create Post',
        priority: 'high',
        scheduled_for: nextOptimalTime.toISOString(),
        data: { optimal_time: optimalTime }
      });
    }
    
    // 2. Content opportunity notifications
    const contentOpportunity = this.identifyContentOpportunity(reportData);
    if (contentOpportunity) {
      notifications.push({
        id: `opportunity_${Date.now()}`,
        type: 'opportunity',
        title: '🔥 Trending opportunity detected!',
        body: contentOpportunity.message,
        action_url: '/dashboard',
        action_label: 'See Details',
        priority: 'medium',
        data: contentOpportunity
      });
    }
    
    // 3. Milestone celebrations
    const milestone = this.checkMilestones(reportData);
    if (milestone) {
      notifications.push({
        id: `milestone_${Date.now()}`,
        type: 'milestone',
        title: `🎉 ${milestone.title}`,
        body: milestone.message,
        action_url: '/dashboard',
        action_label: 'Celebrate',
        priority: 'high',
        data: milestone
      });
    }
    
    // 4. Engagement reminders
    if (this.shouldRemindToEngage(reportData)) {
      notifications.push({
        id: `reminder_${Date.now()}`,
        type: 'reminder',
        title: '💬 Time to engage with your community',
        body: 'Respond to comments and engage with your followers to boost your reach',
        action_url: 'https://instagram.com',
        action_label: 'Open Instagram',
        priority: 'low',
        data: { reminder_type: 'engagement' }
      });
    }
    
    return notifications;
  }
  
  private static calculateOptimalPostingTime(reportData: any) {
    // Analyze posting patterns from media data
    const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
    
    if (media.length === 0) {
      return { day: 'Tuesday', hour: 19, confidence: 0.5 }; // Default
    }
    
    const timeSlots: { [key: string]: { engagement: number, count: number } } = {};
    
    media.forEach((post: any) => {
      if (!post.timestamp) return;
      
      const date = new Date(post.timestamp);
      const day = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      const key = `${day}_${hour}`;
      
      const engagement = (post.like_count || 0) + (post.comments_count || 0);
      
      if (!timeSlots[key]) {
        timeSlots[key] = { engagement: 0, count: 0 };
      }
      
      timeSlots[key].engagement += engagement;
      timeSlots[key].count += 1;
    });
    
    let bestSlot = { day: 2, hour: 19, avgEngagement: 0 }; // Default Tuesday 7PM
    
    Object.entries(timeSlots).forEach(([key, data]) => {
      if (data.count >= 2) { // Only consider slots with multiple posts
        const avgEngagement = data.engagement / data.count;
        if (avgEngagement > bestSlot.avgEngagement) {
          const [day, hour] = key.split('_').map(Number);
          bestSlot = { day, hour, avgEngagement };
        }
      }
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return {
      day: dayNames[bestSlot.day],
      hour: bestSlot.hour,
      confidence: Math.min(bestSlot.avgEngagement / 100, 1) // Scale confidence
    };
  }
  
  private static getNextOptimalTime(optimalTime: any, timezone: string): Date {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(optimalTime.day);
    
    // Find next occurrence of the optimal day and time
    const nextDate = new Date();
    const currentDay = nextDate.getDay();
    
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    nextDate.setDate(nextDate.getDate() + daysUntilTarget);
    nextDate.setHours(optimalTime.hour, 0, 0, 0);
    
    return nextDate;
  }
  
  private static identifyContentOpportunity(reportData: any) {
    const contentPatterns = reportData?.contentAnalysis?.contentPatterns;
    
    if (contentPatterns?.VIDEO > contentPatterns?.IMAGE * 1.3) {
      return {
        type: 'video_performs_better',
        message: 'Your video content gets 30% more engagement. Consider posting a Reel today!',
        confidence: 0.8
      };
    }
    
    // Check if it's a good day for posting based on historical data
    const today = new Date().getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if ([1, 2, 4].includes(today)) { // Monday, Tuesday, Thursday
      return {
        type: 'good_posting_day',
        message: `${dayNames[today]} is typically a high-engagement day for your audience`,
        confidence: 0.6
      };
    }
    
    return null;
  }
  
  private static checkMilestones(reportData: any) {
    const profile = reportData?.profile;
    
    if (!profile?.followers_count) return null;
    
    const followers = profile.followers_count;
    const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
    
    // Check if close to a milestone (within 5%)
    for (const milestone of milestones) {
      if (followers >= milestone * 0.95 && followers < milestone) {
        return {
          title: `Almost at ${milestone.toLocaleString()} followers!`,
          message: `You're only ${milestone - followers} followers away from ${milestone.toLocaleString()}!`,
          type: 'follower_milestone_close',
          target: milestone,
          current: followers
        };
      }
      
      // Check if just hit a milestone
      if (followers >= milestone && followers < milestone * 1.05) {
        return {
          title: `${milestone.toLocaleString()} followers achieved!`,
          message: `Congratulations! You've reached ${milestone.toLocaleString()} followers. Keep up the great work!`,
          type: 'follower_milestone_reached',
          milestone: milestone
        };
      }
    }
    
    return null;
  }
  
  private static shouldRemindToEngage(reportData: any): boolean {
    // Simple heuristic: if engagement rate is below 3%, suggest more engagement
    const engagementRate = reportData?.profile?.engagement_rate || 0;
    return engagementRate < 3;
  }
}