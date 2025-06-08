export class ContentOptimizer {
  static analyzeContentQuality(content) {
    const metrics = {
      hook_strength: this.analyzeHookStrength(content.hook),
      readability: this.analyzeReadability(content.text),
      engagement_triggers: this.findEngagementTriggers(content.text),
      visual_appeal: this.analyzeVisualElements(content),
      length_optimization: this.analyzeLengthOptimization(content.text)
    };

    return {
      overall_score: this.calculateOverallScore(metrics),
      metrics,
      improvements: this.generateImprovements(metrics)
    };
  }

  static analyzeHookStrength(hook) {
    if (!hook) return 0;

    let score = 0;
    const hookLower = hook.toLowerCase();

    // Length optimization (8-15 words is ideal)
    const wordCount = hook.split(' ').length;
    if (wordCount >= 8 && wordCount <= 15) score += 20;
    else if (wordCount >= 5 && wordCount <= 20) score += 15;
    else score += 5;

    // Emotional triggers
    const emotionalWords = [
      'shocking', 'amazing', 'incredible', 'unbelievable', 'secret', 'revealed',
      'transform', 'change', 'breakthrough', 'discover', 'mistake', 'truth'
    ];
    const emotionalMatches = emotionalWords.filter(word => hookLower.includes(word));
    score += emotionalMatches.length * 10;

    // Numbers and specificity
    if (/\d+/.test(hook)) score += 15;

    // Question format
    if (hook.includes('?')) score += 10;

    // Power words
    const powerWords = ['free', 'new', 'proven', 'guaranteed', 'exclusive', 'limited'];
    const powerMatches = powerWords.filter(word => hookLower.includes(word));
    score += powerMatches.length * 5;

    // Urgency indicators
    const urgencyWords = ['now', 'today', 'immediately', 'urgent', 'deadline'];
    const urgencyMatches = urgencyWords.filter(word => hookLower.includes(word));
    score += urgencyMatches.length * 8;

    return Math.min(score, 100);
  }

  static analyzeReadability(text) {
    if (!text) return 0;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const avgWordsPerSentence = words.length / sentences.length;

    let score = 100;

    // Penalize very long sentences
    if (avgWordsPerSentence > 20) score -= 30;
    else if (avgWordsPerSentence > 15) score -= 15;

    // Check for complex words (more than 3 syllables)
    const complexWords = words.filter(word => this.countSyllables(word) > 3);
    const complexityRatio = complexWords.length / words.length;
    if (complexityRatio > 0.3) score -= 25;
    else if (complexityRatio > 0.2) score -= 15;

    // Reward good structure
    const hasGoodStructure = text.includes('\n\n') || sentences.length > 2;
    if (hasGoodStructure) score += 10;

    return Math.max(score, 0);
  }

  static countSyllables(word) {
    return word.toLowerCase().replace(/[^aeiouy]/g, '').length || 1;
  }

  static findEngagementTriggers(text) {
    if (!text) return [];

    const triggers = [];
    const textLower = text.toLowerCase();

    // Questions
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 0) {
      triggers.push({
        type: 'questions',
        count: questionCount,
        impact: questionCount * 15
      });
    }

    // Call to action
    const ctaWords = ['comment', 'share', 'like', 'follow', 'subscribe', 'tag', 'dm'];
    const ctaMatches = ctaWords.filter(word => textLower.includes(word));
    if (ctaMatches.length > 0) {
      triggers.push({
        type: 'call_to_action',
        words: ctaMatches,
        impact: ctaMatches.length * 10
      });
    }

    // Personal stories
    const personalWords = ['i', 'my', 'me', 'personally', 'experience'];
    const personalMatches = personalWords.filter(word => textLower.includes(word));
    if (personalMatches.length > 2) {
      triggers.push({
        type: 'personal_story',
        impact: 20
      });
    }

    // Controversy/Opinion
    const controversyWords = ['unpopular', 'controversial', 'opinion', 'disagree', 'wrong'];
    const controversyMatches = controversyWords.filter(word => textLower.includes(word));
    if (controversyMatches.length > 0) {
      triggers.push({
        type: 'controversy',
        words: controversyMatches,
        impact: controversyMatches.length * 12
      });
    }

    return triggers;
  }

  static analyzeVisualElements(content) {
    let score = 0;

    // Check for emojis
    const emojiCount = (content.text?.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount > 0 && emojiCount <= 5) score += 20;
    else if (emojiCount > 5) score += 10; // Too many emojis

    // Check for formatting
    if (content.text?.includes('\n')) score += 15; // Line breaks
    if (content.text?.includes('•') || content.text?.includes('-')) score += 10; // Bullet points

    // Media presence
    if (content.hasImage) score += 20;
    if (content.hasVideo) score += 25;
    if (content.hasCarousel) score += 30;

    return Math.min(score, 100);
  }

  static analyzeLengthOptimization(text) {
    if (!text) return 0;

    const charCount = text.length;
    const wordCount = text.split(/\s+/).length;

    // Instagram optimal lengths
    let score = 0;

    // Caption length optimization
    if (charCount >= 1000 && charCount <= 2200) score += 30; // Optimal range
    else if (charCount >= 500 && charCount <= 3000) score += 20; // Good range
    else if (charCount < 500) score += 10; // Too short
    else score += 5; // Too long

    // First 125 characters are most important (preview text)
    const preview = text.substring(0, 125);
    if (preview.includes('?') || preview.includes('!')) score += 15;
    if (preview.split(' ').length >= 15) score += 10;

    return Math.min(score, 100);
  }

  static calculateOverallScore(metrics) {
    const weights = {
      hook_strength: 0.3,
      readability: 0.2,
      engagement_triggers: 0.25,
      visual_appeal: 0.15,
      length_optimization: 0.1
    };

    let totalScore = 0;
    Object.entries(weights).forEach(([metric, weight]) => {
      const metricScore = Array.isArray(metrics[metric]) 
        ? metrics[metric].reduce((sum, trigger) => sum + trigger.impact, 0)
        : metrics[metric] || 0;
      totalScore += metricScore * weight;
    });

    return Math.min(Math.round(totalScore), 100);
  }

  static generateImprovements(metrics) {
    const improvements = [];

    // Hook improvements
    if (metrics.hook_strength < 60) {
      improvements.push({
        type: 'hook',
        priority: 'high',
        suggestion: 'Strengthen your hook with numbers, emotional words, or questions',
        impact: '+15-25% engagement'
      });
    }

    // Readability improvements
    if (metrics.readability < 70) {
      improvements.push({
        type: 'readability',
        priority: 'medium',
        suggestion: 'Break up long sentences and use simpler words',
        impact: '+10-15% completion rate'
      });
    }

    // Engagement triggers
    const engagementScore = metrics.engagement_triggers.reduce((sum, trigger) => sum + trigger.impact, 0);
    if (engagementScore < 30) {
      improvements.push({
        type: 'engagement',
        priority: 'high',
        suggestion: 'Add questions or clear call-to-actions to boost engagement',
        impact: '+20-35% comments'
      });
    }

    // Visual appeal
    if (metrics.visual_appeal < 50) {
      improvements.push({
        type: 'visual',
        priority: 'medium',
        suggestion: 'Add emojis, line breaks, or better formatting',
        impact: '+8-12% engagement'
      });
    }

    // Length optimization
    if (metrics.length_optimization < 60) {
      improvements.push({
        type: 'length',
        priority: 'low',
        suggestion: 'Optimize caption length for better algorithm performance',
        impact: '+5-10% reach'
      });
    }

    return improvements.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  static optimizeHashtags(hashtags, niche, contentType) {
    const optimized = {
      trending: [],
      niche_specific: [],
      long_tail: [],
      community: []
    };

    // This would typically call an API to get real hashtag data
    const hashtagDatabase = this.getHashtagDatabase();
    
    hashtags.forEach(tag => {
      const data = hashtagDatabase[tag] || { volume: 0, competition: 0.5 };
      
      if (data.volume > 1000000) optimized.trending.push(tag);
      else if (data.volume > 100000) optimized.niche_specific.push(tag);
      else if (data.volume > 10000) optimized.long_tail.push(tag);
      else optimized.community.push(tag);
    });

    // Suggest optimal mix
    const suggestions = {
      remove_high_competition: optimized.trending.slice(5), // Keep only top 5 trending
      add_long_tail: this.suggestLongTailHashtags(niche, contentType),
      balance_recommendation: '30% trending, 40% niche, 20% long-tail, 10% community'
    };

    return { optimized, suggestions };
  }

  static getHashtagDatabase() {
    // This would be populated from a real hashtag analytics API
    return {
      '#viral': { volume: 50000000, competition: 0.9 },
      '#trending': { volume: 30000000, competition: 0.85 },
      '#fitness': { volume: 25000000, competition: 0.8 },
      '#motivation': { volume: 20000000, competition: 0.75 },
      '#business': { volume: 15000000, competition: 0.7 },
      '#entrepreneur': { volume: 10000000, competition: 0.65 }
    };
  }

  static suggestLongTailHashtags(niche, contentType) {
    const suggestions = {
      fitness: ['#homeworkoutmotivation', '#beginnerfitnessjourney', '#strengthtrainingtips'],
      business: ['#smallbusinessgrowth', '#entrepreneurmindset', '#startupstruggles'],
      tech: ['#codingtips', '#webdevelopment', '#programmerlife']
    };

    return suggestions[niche?.toLowerCase()] || [];
  }

  static predictViralPotential(content, userMetrics, timing) {
    const contentScore = this.analyzeContentQuality(content);
    const timingScore = this.analyzeTimingOptimization(timing);
    const audienceScore = this.analyzeAudienceAlignment(content, userMetrics);

    const viralFactors = {
      content_quality: contentScore.overall_score * 0.4,
      timing_optimization: timingScore * 0.3,
      audience_alignment: audienceScore * 0.3
    };

    const viralScore = Object.values(viralFactors).reduce((sum, score) => sum + score, 0);

    return {
      viral_probability: Math.round(viralScore),
      confidence_level: this.calculateConfidence(viralFactors),
      key_factors: this.identifyKeyFactors(viralFactors),
      improvement_areas: contentScore.improvements
    };
  }

  static analyzeTimingOptimization(timing) {
    // This would analyze posting time against audience activity
    // For now, return a simple score based on general best practices
    const hour = new Date(timing).getHours();
    const day = new Date(timing).getDay();

    let score = 50; // Base score

    // Optimal hours (6-9 AM, 12-2 PM, 5-8 PM)
    if ((hour >= 6 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 20)) {
      score += 30;
    }

    // Optimal days (Tuesday-Thursday)
    if (day >= 2 && day <= 4) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  static analyzeAudienceAlignment(content, userMetrics) {
    // This would analyze how well content matches audience preferences
    // For now, return a score based on content type and user's historical performance
    let score = 70; // Base score

    if (userMetrics?.top_content_types) {
      const contentType = this.classifyContentType(content);
      const typePerformance = userMetrics.top_content_types.find(t => t.type === contentType);
      
      if (typePerformance) {
        score += Math.min(typePerformance.avg_engagement / 100, 30);
      }
    }

    return Math.min(score, 100);
  }

  static classifyContentType(content) {
    const text = content.text?.toLowerCase() || '';
    
    if (text.includes('before') && text.includes('after')) return 'transformation';
    if (text.includes('tutorial') || text.includes('how to')) return 'educational';
    if (text.includes('opinion') || text.includes('controversial')) return 'opinion';
    if (text.includes('?')) return 'question';
    
    return 'general';
  }

  static calculateConfidence(factors) {
    const variance = this.calculateVariance(Object.values(factors));
    return Math.max(60, 100 - variance * 2); // Higher variance = lower confidence
  }

  static calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  static identifyKeyFactors(factors) {
    return Object.entries(factors)
      .sort(([,a], [,b]) => b - a)
      .map(([factor, score]) => ({
        factor: factor.replace('_', ' '),
        score: Math.round(score),
        impact: score > 30 ? 'high' : score > 20 ? 'medium' : 'low'
      }));
  }
}