// src/services/advancedContentAnalyzer.ts
export interface ContentPattern {
  id: string;
  pattern_type: 'visual' | 'textual' | 'temporal' | 'engagement';
  name: string;
  description: string;
  frequency: number;
  performance_impact: number;
  confidence: number;
  examples: string[];
  recommendation: string;
}

export interface SentimentAnalysis {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1
  emotion_breakdown: {
    joy: number;
    trust: number;
    fear: number;
    surprise: number;
    sadness: number;
    disgust: number;
    anger: number;
    anticipation: number;
  };
  sentiment_trend: 'improving' | 'declining' | 'stable';
  top_positive_words: string[];
  top_negative_words: string[];
}

export interface CompetitorInsight {
  insight_type: 'content_gap' | 'opportunity' | 'threat' | 'trend';
  title: string;
  description: string;
  actionable_advice: string;
  priority: number;
  estimated_effort: 'low' | 'medium' | 'high';
}

export class AdvancedContentAnalyzer {
  
  static analyzeContentPatterns(reportData: any): ContentPattern[] {
    const patterns: ContentPattern[] = [];
    const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
    
    if (media.length === 0) return patterns;
    
    // Analyze visual patterns
    patterns.push(...this.analyzeVisualPatterns(media));
    
    // Analyze textual patterns
    patterns.push(...this.analyzeTextualPatterns(media));
    
    // Analyze temporal patterns
    patterns.push(...this.analyzeTemporalPatterns(media));
    
    // Analyze engagement patterns
    patterns.push(...this.analyzeEngagementPatterns(media));
    
    return patterns.sort((a, b) => b.performance_impact - a.performance_impact);
  }
  
  static analyzeSentiment(reportData: any): SentimentAnalysis {
    const media = reportData?.media || reportData?.contentAnalysis?.topPosts || [];
    
    if (media.length === 0) {
      return this.getDefaultSentimentAnalysis();
    }
    
    // Combine all captions for analysis
    const allText = media
      .map((post: any) => post.caption || '')
      .filter((caption: string) => caption.length > 0)
      .join(' ');
    
    return this.performSentimentAnalysis(allText, media);
  }
  
  static generateCompetitorInsights(reportData: any, industryBenchmarks?: any): CompetitorInsight[] {
    const insights: CompetitorInsight[] = [];
    const profile = reportData?.profile;
    const media = reportData?.media || [];
    
    // Content gap analysis
    insights.push(...this.identifyContentGaps(media, profile));
    
    // Opportunity analysis
    insights.push(...this.identifyOpportunities(reportData));
    
    // Trend analysis
    insights.push(...this.identifyTrendOpportunities(media));
    
    return insights.sort((a, b) => b.priority - a.priority);
  }
  
  private static analyzeVisualPatterns(media: any[]): ContentPattern[] {
   const patterns: ContentPattern[] = [];
   
   // Analyze media types
   const mediaTypeCount = {
     image: 0,
     video: 0,
     carousel_album: 0
   };
   
   const mediaTypeEngagement = {
     image: 0,
     video: 0,
     carousel_album: 0
   };
   
   media.forEach((post: any) => {
     const type = post.media_type || 'image';
     const engagement = (post.like_count || 0) + (post.comments_count || 0);
     
     if (mediaTypeCount[type as keyof typeof mediaTypeCount] !== undefined) {
       mediaTypeCount[type as keyof typeof mediaTypeCount]++;
       mediaTypeEngagement[type as keyof typeof mediaTypeEngagement] += engagement;
     }
   });
   
   // Find best performing media type
   let bestType = 'image';
   let bestPerformance = 0;
   
   Object.keys(mediaTypeCount).forEach(type => {
     const count = mediaTypeCount[type as keyof typeof mediaTypeCount];
     const totalEngagement = mediaTypeEngagement[type as keyof typeof mediaTypeEngagement];
     const avgPerformance = count > 0 ? totalEngagement / count : 0;
     
     if (avgPerformance > bestPerformance) {
       bestPerformance = avgPerformance;
       bestType = type;
     }
   });
   
   if (mediaTypeCount[bestType as keyof typeof mediaTypeCount] > 2) {
     patterns.push({
       id: `visual_${bestType}_${Date.now()}`,
       pattern_type: 'visual',
       name: `${bestType.charAt(0).toUpperCase() + bestType.slice(1)} Content Excellence`,
       description: `Your ${bestType} content consistently outperforms other formats`,
       frequency: mediaTypeCount[bestType as keyof typeof mediaTypeCount] / media.length,
       performance_impact: (bestPerformance / (mediaTypeEngagement.image + mediaTypeEngagement.video + mediaTypeEngagement.carousel_album) * media.length) || 0,
       confidence: 0.8,
       examples: media.filter((post: any) => post.media_type === bestType).slice(0, 3).map((post: any) => post.id),
       recommendation: `Continue creating ${bestType} content and consider increasing frequency by 25%`
     });
   }
   
   // Analyze face presence (simplified heuristic)
   const postsWithFaces = media.filter((post: any) => {
     const caption = (post.caption || '').toLowerCase();
     return caption.includes('selfie') || caption.includes('me ') || caption.includes('i ') || post.media_type === 'image';
   });
   
   if (postsWithFaces.length > media.length * 0.3) {
     const faceEngagement = postsWithFaces.reduce((sum: number, post: any) => 
       sum + (post.like_count || 0) + (post.comments_count || 0), 0) / postsWithFaces.length;
     
     const otherEngagement = media.filter((post: any) => !postsWithFaces.includes(post))
       .reduce((sum: number, post: any) => sum + (post.like_count || 0) + (post.comments_count || 0), 0) / 
       (media.length - postsWithFaces.length);
     
     if (faceEngagement > otherEngagement * 1.2) {
       patterns.push({
         id: `visual_faces_${Date.now()}`,
         pattern_type: 'visual',
         name: 'Personal Content Connection',
         description: 'Posts featuring people get significantly higher engagement',
         frequency: postsWithFaces.length / media.length,
         performance_impact: ((faceEngagement - otherEngagement) / otherEngagement) * 100,
         confidence: 0.7,
         examples: postsWithFaces.slice(0, 3).map((post: any) => post.id),
         recommendation: 'Include more personal photos and behind-the-scenes content with people'
       });
     }
   }
   
   return patterns;
 }
 
 private static analyzeTextualPatterns(media: any[]): ContentPattern[] {
   const patterns: ContentPattern[] = [];
   
   // Analyze caption lengths
   const captionLengths = media
     .filter((post: any) => post.caption)
     .map((post: any) => ({
       length: post.caption.length,
       engagement: (post.like_count || 0) + (post.comments_count || 0),
       post: post
     }));
   
   if (captionLengths.length > 5) {
     // Group by length categories
     const shortCaptions = captionLengths.filter(cl => cl.length <= 100);
     const mediumCaptions = captionLengths.filter(cl => cl.length > 100 && cl.length <= 300);
     const longCaptions = captionLengths.filter(cl => cl.length > 300);
     
     const categories = [
       { name: 'Short', posts: shortCaptions, range: '≤100 characters' },
       { name: 'Medium', posts: mediumCaptions, range: '100-300 characters' },
       { name: 'Long', posts: longCaptions, range: '>300 characters' }
     ];
     
     let bestCategory = categories[0];
     let bestAvgEngagement = 0;
     
     categories.forEach(category => {
       if (category.posts.length > 0) {
         const avgEngagement = category.posts.reduce((sum, p) => sum + p.engagement, 0) / category.posts.length;
         if (avgEngagement > bestAvgEngagement) {
           bestAvgEngagement = avgEngagement;
           bestCategory = category;
         }
       }
     });
     
     if (bestCategory.posts.length > 2) {
       patterns.push({
         id: `textual_length_${Date.now()}`,
         pattern_type: 'textual',
         name: `${bestCategory.name} Caption Sweet Spot`,
         description: `${bestCategory.name} captions (${bestCategory.range}) perform best for your audience`,
         frequency: bestCategory.posts.length / captionLengths.length,
         performance_impact: bestAvgEngagement,
         confidence: 0.75,
         examples: bestCategory.posts.slice(0, 3).map(p => p.post.id),
         recommendation: `Aim for ${bestCategory.range} in your captions for optimal engagement`
       });
     }
   }
   
   // Analyze question usage
   const postsWithQuestions = media.filter((post: any) => (post.caption || '').includes('?'));
   const postsWithoutQuestions = media.filter((post: any) => !(post.caption || '').includes('?'));
   
   if (postsWithQuestions.length > 0 && postsWithoutQuestions.length > 0) {
     const questionEngagement = postsWithQuestions.reduce((sum: number, post: any) => 
       sum + (post.comments_count || 0), 0) / postsWithQuestions.length;
     
     const noQuestionEngagement = postsWithoutQuestions.reduce((sum: number, post: any) => 
       sum + (post.comments_count || 0), 0) / postsWithoutQuestions.length;
     
     if (questionEngagement > noQuestionEngagement * 1.3) {
       patterns.push({
         id: `textual_questions_${Date.now()}`,
         pattern_type: 'textual',
         name: 'Question-Driven Engagement',
         description: 'Posts with questions generate significantly more comments',
         frequency: postsWithQuestions.length / media.length,
         performance_impact: ((questionEngagement - noQuestionEngagement) / noQuestionEngagement) * 100,
         confidence: 0.8,
         examples: postsWithQuestions.slice(0, 3).map((post: any) => post.id),
         recommendation: 'Include thoughtful questions in 60-80% of your captions to boost comments'
       });
     }
   }
   
   // Analyze hashtag usage
   const hashtagAnalysis = this.analyzeHashtagPatterns(media);
   if (hashtagAnalysis.pattern) {
     patterns.push(hashtagAnalysis.pattern);
   }
   
   return patterns;
 }
 
 private static analyzeTemporalPatterns(media: any[]): ContentPattern[] {
   const patterns: ContentPattern[] = [];
   
   if (media.length < 7) return patterns;
   
   // Analyze day of week patterns
   const dayPerformance: { [key: string]: { count: number, totalEngagement: number } } = {};
   
   media.forEach((post: any) => {
     if (!post.timestamp) return;
     
     const date = new Date(post.timestamp);
     const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
     
     if (!dayPerformance[dayName]) {
       dayPerformance[dayName] = { count: 0, totalEngagement: 0 };
     }
     
     dayPerformance[dayName].count++;
     dayPerformance[dayName].totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
   });
   
   // Find best performing day
   let bestDay = '';
   let bestDayEngagement = 0;
   
   Object.entries(dayPerformance).forEach(([day, data]) => {
     if (data.count >= 2) { // Only consider days with multiple posts
       const avgEngagement = data.totalEngagement / data.count;
       if (avgEngagement > bestDayEngagement) {
         bestDayEngagement = avgEngagement;
         bestDay = day;
       }
     }
   });
   
   if (bestDay && dayPerformance[bestDay].count >= 2) {
     patterns.push({
       id: `temporal_day_${Date.now()}`,
       pattern_type: 'temporal',
       name: `${bestDay} Power Pattern`,
       description: `${bestDay} posts consistently outperform other days`,
       frequency: dayPerformance[bestDay].count / media.length,
       performance_impact: bestDayEngagement,
       confidence: 0.7,
       examples: media.filter((post: any) => {
         if (!post.timestamp) return false;
         const date = new Date(post.timestamp);
         return date.toLocaleDateString('en-US', { weekday: 'long' }) === bestDay;
       }).slice(0, 3).map((post: any) => post.id),
       recommendation: `Schedule your most important content for ${bestDay}s to maximize reach`
     });
   }
   
   // Analyze time of day patterns
   const hourPerformance: { [key: number]: { count: number, totalEngagement: number } } = {};
   
   media.forEach((post: any) => {
     if (!post.timestamp) return;
     
     const date = new Date(post.timestamp);
     const hour = date.getHours();
     
     if (!hourPerformance[hour]) {
       hourPerformance[hour] = { count: 0, totalEngagement: 0 };
     }
     
     hourPerformance[hour].count++;
     hourPerformance[hour].totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
   });
   
   // Find best performing hour
   let bestHour = 0;
   let bestHourEngagement = 0;
   
   Object.entries(hourPerformance).forEach(([hour, data]) => {
     if (data.count >= 2) {
       const avgEngagement = data.totalEngagement / data.count;
       if (avgEngagement > bestHourEngagement) {
         bestHourEngagement = avgEngagement;
         bestHour = parseInt(hour);
       }
     }
   });
   
   if (hourPerformance[bestHour] && hourPerformance[bestHour].count >= 2) {
     const timeLabel = bestHour === 0 ? '12:00 AM' : 
                      bestHour < 12 ? `${bestHour}:00 AM` : 
                      bestHour === 12 ? '12:00 PM' : 
                      `${bestHour - 12}:00 PM`;
     
     patterns.push({
       id: `temporal_hour_${Date.now()}`,
       pattern_type: 'temporal',
       name: `Golden Hour: ${timeLabel}`,
       description: `Posts at ${timeLabel} achieve peak engagement`,
       frequency: hourPerformance[bestHour].count / media.length,
       performance_impact: bestHourEngagement,
       confidence: 0.75,
       examples: media.filter((post: any) => {
         if (!post.timestamp) return false;
         const date = new Date(post.timestamp);
         return date.getHours() === bestHour;
       }).slice(0, 3).map((post: any) => post.id),
       recommendation: `Post at ${timeLabel} for maximum audience engagement`
     });
   }
   
   return patterns;
 }
 
 private static analyzeEngagementPatterns(media: any[]): ContentPattern[] {
   const patterns: ContentPattern[] = [];
   
   // Analyze like-to-comment ratios
   const postsWithBothMetrics = media.filter((post: any) => 
     (post.like_count || 0) > 0 && (post.comments_count || 0) > 0
   );
   
   if (postsWithBothMetrics.length > 5) {
     const ratios = postsWithBothMetrics.map((post: any) => {
       const ratio = (post.like_count || 0) / (post.comments_count || 0);
       return {
         ratio,
         totalEngagement: (post.like_count || 0) + (post.comments_count || 0),
         post
       };
     });
     
     // Find posts with unusually high comment ratios (low like:comment ratio)
     const avgRatio = ratios.reduce((sum, r) => sum + r.ratio, 0) / ratios.length;
     const highCommentPosts = ratios.filter(r => r.ratio < avgRatio * 0.7);
     
     if (highCommentPosts.length > 2) {
       const avgHighCommentEngagement = highCommentPosts.reduce((sum, p) => sum + p.totalEngagement, 0) / highCommentPosts.length;
       
       patterns.push({
         id: `engagement_discussion_${Date.now()}`,
         pattern_type: 'engagement',
         name: 'Discussion Catalyst Content',
         description: 'Certain posts generate disproportionately high comment engagement',
         frequency: highCommentPosts.length / media.length,
         performance_impact: avgHighCommentEngagement,
         confidence: 0.7,
         examples: highCommentPosts.slice(0, 3).map(p => p.post.id),
         recommendation: 'Create more conversation-starter content that encourages discussion'
       });
     }
   }
   
   // Analyze save patterns (if available)
   const postsWithSaves = media.filter((post: any) => (post.saves_count || 0) > 0);
   if (postsWithSaves.length > 3) {
     const avgSaves = postsWithSaves.reduce((sum: number, post: any) => sum + (post.saves_count || 0), 0) / postsWithSaves.length;
     
     patterns.push({
       id: `engagement_saves_${Date.now()}`,
       pattern_type: 'engagement',
       name: 'Save-Worthy Content Pattern',
       description: 'Your educational/inspirational content gets saved frequently',
       frequency: postsWithSaves.length / media.length,
       performance_impact: avgSaves,
       confidence: 0.6,
       examples: postsWithSaves.slice(0, 3).map((post: any) => post.id),
       recommendation: 'Create more educational carousels and inspirational quotes that provide value'
     });
   }
   
   return patterns;
 }
 
 private static performSentimentAnalysis(text: string, media: any[]): SentimentAnalysis {
   // Simplified sentiment analysis (in production, you'd use a proper NLP service)
   const positiveWords = ['amazing', 'great', 'love', 'awesome', 'wonderful', 'fantastic', 'excellent', 'perfect', 'beautiful', 'happy', 'excited', 'grateful', 'blessed', 'incredible', 'outstanding'];
   const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'annoying', 'frustrated', 'disappointed', 'sad', 'angry', 'stressed', 'worried', 'difficult'];
   
   const words = text.toLowerCase().split(/\s+/);
   let positiveCount = 0;
   let negativeCount = 0;
   
   const foundPositive: string[] = [];
   const foundNegative: string[] = [];
   
   words.forEach(word => {
     if (positiveWords.includes(word)) {
       positiveCount++;
       if (!foundPositive.includes(word)) foundPositive.push(word);
     } else if (negativeWords.includes(word)) {
       negativeCount++;
       if (!foundNegative.includes(word)) foundNegative.push(word);
     }
   });
   
   const totalSentimentWords = positiveCount + negativeCount;
   const sentimentScore = totalSentimentWords > 0 ? 
     (positiveCount - negativeCount) / totalSentimentWords : 0;
   
   let overallSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
   if (sentimentScore > 0.2) overallSentiment = 'positive';
   else if (sentimentScore < -0.2) overallSentiment = 'negative';
   
   // Analyze trend over time
   let sentimentTrend: 'improving' | 'declining' | 'stable' = 'stable';
   if (media.length > 5) {
     const recentPosts = media.slice(0, Math.floor(media.length / 2));
     const olderPosts = media.slice(Math.floor(media.length / 2));
     
     const recentText = recentPosts.map((p: any) => p.caption || '').join(' ');
     const olderText = olderPosts.map((p: any) => p.caption || '').join(' ');
     
     const recentScore = this.calculateSimpleSentiment(recentText);
     const olderScore = this.calculateSimpleSentiment(olderText);
     
     if (recentScore > olderScore + 0.1) sentimentTrend = 'improving';
     else if (recentScore < olderScore - 0.1) sentimentTrend = 'declining';
   }
   
   return {
     overall_sentiment: overallSentiment,
     sentiment_score: sentimentScore,
     emotion_breakdown: {
       joy: Math.max(0, sentimentScore) * 0.8,
       trust: Math.max(0, sentimentScore) * 0.6,
       fear: Math.max(0, -sentimentScore) * 0.4,
       surprise: 0.3,
       sadness: Math.max(0, -sentimentScore) * 0.5,
       disgust: Math.max(0, -sentimentScore) * 0.3,
       anger: Math.max(0, -sentimentScore) * 0.4,
       anticipation: 0.4
     },
     sentiment_trend: sentimentTrend,
     top_positive_words: foundPositive.slice(0, 5),
     top_negative_words: foundNegative.slice(0, 5)
   };
 }
 
 private static calculateSimpleSentiment(text: string): number {
   const positiveWords = ['amazing', 'great', 'love', 'awesome', 'wonderful', 'fantastic', 'excellent', 'perfect', 'beautiful', 'happy'];
   const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'annoying', 'frustrated', 'disappointed', 'sad'];
   
   const words = text.toLowerCase().split(/\s+/);
   let positiveCount = 0;
   let negativeCount = 0;
   
   words.forEach(word => {
     if (positiveWords.includes(word)) positiveCount++;
     else if (negativeWords.includes(word)) negativeCount++;
   });
   
   const total = positiveCount + negativeCount;
   return total > 0 ? (positiveCount - negativeCount) / total : 0;
 }
 
 private static getDefaultSentimentAnalysis(): SentimentAnalysis {
   return {
     overall_sentiment: 'neutral',
     sentiment_score: 0,
     emotion_breakdown: {
       joy: 0.5,
       trust: 0.5,
       fear: 0.2,
       surprise: 0.3,
       sadness: 0.2,
       disgust: 0.1,
       anger: 0.1,
       anticipation: 0.4
     },
     sentiment_trend: 'stable',
     top_positive_words: [],
     top_negative_words: []
   };
 }
 
 private static analyzeHashtagPatterns(media: any[]): { pattern?: ContentPattern } {
   let totalHashtags = 0;
   let postsWithHashtags = 0;
   const hashtagCounts: { [key: string]: number } = {};
   
   media.forEach((post: any) => {
     const caption = post.caption || '';
     const hashtags = caption.match(/#\w+/g) || [];
     
     if (hashtags.length > 0) {
       postsWithHashtags++;
       totalHashtags += hashtags.length;
       
       hashtags.forEach((tag: string) => {
         const cleanTag = tag.toLowerCase();
         hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
       });
     }
   });
   
   if (postsWithHashtags < 3) return {};
   
   const avgHashtagsPerPost = totalHashtags / postsWithHashtags;
   const hashtagUsageRate = postsWithHashtags / media.length;
   
   // Find most frequently used hashtags
   const topHashtags = Object.entries(hashtagCounts)
     .sort(([,a], [,b]) => b - a)
     .slice(0, 5)
     .map(([tag]) => tag);
   
   let recommendation = '';
   if (avgHashtagsPerPost < 5) {
     recommendation = 'Increase hashtag usage to 8-12 per post for better discoverability';
   } else if (avgHashtagsPerPost > 15) {
     recommendation = 'Reduce hashtag count to 8-12 for optimal engagement';
   } else {
     recommendation = 'Your hashtag usage is optimal - focus on researching trending tags in your niche';
   }
   
   return {
     pattern: {
       id: `textual_hashtags_${Date.now()}`,
       pattern_type: 'textual',
       name: 'Hashtag Strategy Pattern',
       description: `You use an average of ${avgHashtagsPerPost.toFixed(1)} hashtags per post`,
       frequency: hashtagUsageRate,
       performance_impact: avgHashtagsPerPost * 10, // Simplified impact calculation
       confidence: 0.6,
       examples: topHashtags,
       recommendation
     }
   };
 }
 
 private static identifyContentGaps(media: any[], profile: any): CompetitorInsight[] {
   const insights: CompetitorInsight[] = [];
   
   // Analyze content diversity
   const contentTypes = new Set(media.map((post: any) => post.media_type));
   
   if (!contentTypes.has('video') && media.length > 5) {
     insights.push({
       insight_type: 'content_gap',
       title: 'Missing Video Content',
       description: 'Your feed lacks video content, which typically drives higher engagement',
       actionable_advice: 'Start creating short-form videos or Reels to boost engagement rates',
       priority: 8,
       estimated_effort: 'medium'
     });
   }
   
   if (!contentTypes.has('carousel_album') && media.length > 5) {
     insights.push({
       insight_type: 'content_gap',
       title: 'Underutilizing Carousel Posts',
       description: 'Carousel posts often have higher engagement and are great for storytelling',
       actionable_advice: 'Create educational carousel series or multi-slide stories',
       priority: 6,
       estimated_effort: 'low'
     });
   }
   
   // Check for educational content
   const educationalPosts = media.filter((post: any) => {
     const caption = (post.caption || '').toLowerCase();
     return caption.includes('tip') || caption.includes('how to') || caption.includes('learn') || caption.includes('guide');
   });
   
   if (educationalPosts.length < media.length * 0.2) {
     insights.push({
       insight_type: 'content_gap',
       title: 'Limited Educational Content',
       description: 'Educational content typically gets saved and shared more frequently',
       actionable_advice: 'Create weekly educational posts with tips or tutorials in your niche',
       priority: 7,
       estimated_effort: 'medium'
     });
   }
   
   return insights;
 }
 
 private static identifyOpportunities(reportData: any): CompetitorInsight[] {
   const insights: CompetitorInsight[] = [];
   const profile = reportData?.profile;
   const media = reportData?.media || [];
   
   // Engagement rate opportunity
   const engagementRate = profile?.engagement_rate || 0;
   if (engagementRate < 3) {
     insights.push({
       insight_type: 'opportunity',
       title: 'Engagement Rate Improvement Potential',
       description: 'Your engagement rate has significant room for improvement',
       actionable_advice: 'Focus on asking questions, responding to comments quickly, and posting at optimal times',
       priority: 9,
       estimated_effort: 'low'
     });
   }
   
   // Posting consistency opportunity
   if (media.length > 0) {
     const postingConsistency = this.calculatePostingConsistency(media);
     if (postingConsistency < 0.6) {
       insights.push({
         insight_type: 'opportunity',
         title: 'Posting Consistency Gap',
         description: 'Irregular posting schedule may be limiting your reach',
         actionable_advice: 'Establish a consistent posting schedule of 3-5 posts per week',
         priority: 8,
         estimated_effort: 'medium'
       });
     }
   }
   
   // Community engagement opportunity
   const avgComments = media.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0) / media.length;
   if (avgComments < 10 && profile?.followers_count > 1000) {
     insights.push({
       insight_type: 'opportunity',
       title: 'Community Engagement Potential',
       description: 'Your large following could generate more comments with the right content',
       actionable_advice: 'Create more conversation-starter posts and always respond to comments',
       priority: 7,
       estimated_effort: 'low'
     });
   }
   
   return insights;
 }
 
 private static identifyTrendOpportunities(media: any[]): CompetitorInsight[] {
   const insights: CompetitorInsight[] = [];
   
   // Trending content format opportunities
   const videoPercentage = media.filter((post: any) => post.media_type === 'video').length / media.length;
   
   if (videoPercentage < 0.3) {
     insights.push({
       insight_type: 'trend',
       title: 'Video Content Trend Opportunity',
       description: 'Short-form video content is dominating social media engagement',
       actionable_advice: 'Increase video content to 40-50% of your posts to ride the trend',
       priority: 8,
       estimated_effort: 'medium'
     });
   }
   
   // Authenticity trend
   const personalPosts = media.filter((post: any) => {
     const caption = (post.caption || '').toLowerCase();
     return caption.includes('i ') || caption.includes('my ') || caption.includes('personal');
   });
   
   if (personalPosts.length < media.length * 0.3) {
     insights.push({
       insight_type: 'trend',
       title: 'Authenticity Trend Opportunity',
       description: 'Audiences are craving more authentic, personal content',
       actionable_advice: 'Share more behind-the-scenes content and personal stories',
       priority: 7,
       estimated_effort: 'low'
     });
   }
   
   return insights;
 }
 
 private static calculatePostingConsistency(media: any[]): number {
   if (media.length < 7) return 1; // Not enough data
   
   const dates = media
     .filter((post: any) => post.timestamp)
     .map((post: any) => new Date(post.timestamp))
     .sort((a, b) => a.getTime() - b.getTime());
   
   if (dates.length < 2) return 1;
   
   // Calculate gaps between posts
   const gaps = [];
   for (let i = 1; i < dates.length; i++) {
     const gap = (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24); // days
     gaps.push(gap);
   }
   
   // Calculate consistency score based on variance in gaps
   const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
   const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
   const standardDeviation = Math.sqrt(variance);
   
   // Higher consistency = lower standard deviation relative to average
   const consistencyScore = Math.max(0, 1 - (standardDeviation / avgGap));
   
   return Math.min(1, consistencyScore);
 }
}