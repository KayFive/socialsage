import { VIRAL_TEMPLATES, getTemplatesForNiche } from '../data/viralTemplates';

export class ViralTemplateEngine {
  static analyzeUserContent(posts) {
    if (!posts || posts.length === 0) return null;

    const analysis = {
      top_performing_types: this.getTopPerformingTypes(posts),
      engagement_patterns: this.analyzeEngagementPatterns(posts),
      content_themes: this.extractContentThemes(posts),
      posting_patterns: this.analyzePostingPatterns(posts)
    };

    return analysis;
  }

  static getTopPerformingTypes(posts) {
    const typePerformance = {};
    
    posts.forEach(post => {
      const type = this.classifyPostType(post);
      if (!typePerformance[type]) {
        typePerformance[type] = { total_engagement: 0, count: 0 };
      }
      
      const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);
      typePerformance[type].total_engagement += engagement;
      typePerformance[type].count += 1;
    });

    return Object.entries(typePerformance)
      .map(([type, data]) => ({
        type,
        avg_engagement: data.total_engagement / data.count,
        count: data.count
      }))
      .sort((a, b) => b.avg_engagement - a.avg_engagement);
  }

  static classifyPostType(post) {
    const caption = (post.caption || '').toLowerCase();
    
    if (caption.includes('before') && caption.includes('after')) return 'transformation';
    if (caption.includes('unpopular opinion') || caption.includes('hot take')) return 'controversial';
    if (caption.includes('tutorial') || caption.includes('how to') || caption.includes('tip')) return 'educational';
    if (caption.includes('behind the scenes') || caption.includes('process')) return 'behind_scenes';
    if (caption.includes('?') && caption.split('?').length > 2) return 'question_engagement';
    
    return 'general';
  }

  static analyzeEngagementPatterns(posts) {
    const hourlyEngagement = {};
    const dayEngagement = {};

    posts.forEach(post => {
      if (post.created_time) {
        const date = new Date(post.created_time);
        const hour = date.getHours();
        const day = date.getDay();

        const engagement = (post.likes || 0) + (post.comments || 0) + (post.shares || 0);

        if (!hourlyEngagement[hour]) hourlyEngagement[hour] = [];
        if (!dayEngagement[day]) dayEngagement[day] = [];

        hourlyEngagement[hour].push(engagement);
        dayEngagement[day].push(engagement);
      }
    });

    const bestHours = Object.entries(hourlyEngagement)
      .map(([hour, engagements]) => ({
        hour: parseInt(hour),
        avg_engagement: engagements.reduce((a, b) => a + b, 0) / engagements.length
      }))
      .sort((a, b) => b.avg_engagement - a.avg_engagement)
      .slice(0, 3);

    const bestDays = Object.entries(dayEngagement)
      .map(([day, engagements]) => ({
        day: parseInt(day),
        avg_engagement: engagements.reduce((a, b) => a + b, 0) / engagements.length
      }))
      .sort((a, b) => b.avg_engagement - a.avg_engagement);

    return { bestHours, bestDays };
  }

  static extractContentThemes(posts) {
    const themes = {};
    
    posts.forEach(post => {
      const caption = (post.caption || '').toLowerCase();
      const words = caption.split(/\s+/).filter(word => word.length > 3);
      
      words.forEach(word => {
        if (!themes[word]) themes[word] = 0;
        themes[word]++;
      });
    });

    return Object.entries(themes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));
  }

  static analyzePostingPatterns(posts) {
    if (posts.length < 2) return null;

    const intervals = [];
    const sortedPosts = posts.sort((a, b) => new Date(a.created_time) - new Date(b.created_time));

    for (let i = 1; i < sortedPosts.length; i++) {
      const interval = new Date(sortedPosts[i].created_time) - new Date(sortedPosts[i-1].created_time);
      intervals.push(interval / (1000 * 60 * 60)); // Convert to hours
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    return {
      average_interval_hours: avgInterval,
      posting_frequency: this.getPostingFrequency(avgInterval),
      consistency_score: this.calculateConsistencyScore(intervals)
    };
  }

  static getPostingFrequency(avgHours) {
    if (avgHours <= 24) return 'daily';
    if (avgHours <= 48) return 'every_other_day';
    if (avgHours <= 168) return 'weekly';
    return 'irregular';
  }

  static calculateConsistencyScore(intervals) {
    if (intervals.length < 2) return 0;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  }

  static recommendTemplatesForUser(userAnalysis, userNiche) {
    const nicheTemplates = getTemplatesForNiche(userNiche);
    const recommendations = [];

    if (userAnalysis) {
      // Recommend based on top performing types
      userAnalysis.top_performing_types.forEach(typeData => {
        const matchingTemplate = this.findTemplateByType(typeData.type);
        if (matchingTemplate && !recommendations.find(r => r.id === matchingTemplate.id)) {
          recommendations.push({
            ...matchingTemplate,
            reason: `Based on your ${typeData.type} posts performing well`,
            confidence: 0.9
          });
        }
      });

      // Fill remaining slots with niche-appropriate templates
      nicheTemplates.forEach(template => {
        if (!recommendations.find(r => r.id === template.id)) {
          recommendations.push({
            ...template,
            reason: `Great for ${userNiche} content`,
            confidence: 0.7
          });
        }
      });
    } else {
      // No analysis available - recommend popular templates for niche
      nicheTemplates.forEach(template => {
        recommendations.push({
          ...template,
          reason: `Popular in ${userNiche}`,
          confidence: 0.6
        });
      });
    }

    return recommendations.slice(0, 6); // Return top 6 recommendations
  }

  static findTemplateByType(type) {
    const typeMap = {
      'transformation': VIRAL_TEMPLATES.before_after,
      'controversial': VIRAL_TEMPLATES.controversial_take,
      'educational': VIRAL_TEMPLATES.tutorial_hack,
      'behind_scenes': VIRAL_TEMPLATES.behind_scenes,
      'question_engagement': VIRAL_TEMPLATES.question_hook
    };

    return typeMap[type] || null;
  }

  static generateCustomTemplate(userAnalysis, userNiche, templateBase) {
    const customTemplate = { ...templateBase };

    if (userAnalysis) {
      // Customize hooks based on user's themes
      const userThemes = userAnalysis.content_themes.slice(0, 3).map(t => t.theme);
      customTemplate.structure.hook_templates = this.personalizeHooks(
        templateBase.structure.hook_templates,
        userThemes,
        userNiche
      );

      // Customize posting times based on user's patterns
      if (userAnalysis.engagement_patterns.bestHours.length > 0) {
        const bestHour = userAnalysis.engagement_patterns.bestHours[0].hour;
        customTemplate.structure.posting_times.personalized = 
          `${this.formatHour(bestHour)} (based on your audience activity)`;
      }
    }

    return customTemplate;
  }

  static personalizeHooks(baseHooks, userThemes, niche) {
    const personalizedHooks = baseHooks.map(hook => {
      let personalized = hook;
      
      // Replace placeholders with niche-specific terms
      personalized = personalized.replace('[NICHE]', niche);
      personalized = personalized.replace('[YOUR_FIELD]', niche);
      
      // Add user themes if relevant
      if (userThemes.length > 0 && Math.random() > 0.5) {
        const theme = userThemes[Math.floor(Math.random() * userThemes.length)];
        personalized = personalized.replace('this', `this ${theme}`);
      }
      
      return personalized;
    });

    return personalizedHooks;
  }

  static formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  static saveCustomTemplate(templateData, userId) {
    // This would typically save to a database
    const savedTemplate = {
      id: `custom_${Date.now()}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      ...templateData
    };

    // Simulate API call
    return Promise.resolve(savedTemplate);
  }

  static getUserTemplates(userId) {
    // This would typically fetch from a database
    // For now, return empty array
    return Promise.resolve([]);
  }
}