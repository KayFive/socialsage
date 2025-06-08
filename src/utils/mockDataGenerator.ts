import { 
  InstagramProfile, 
  InstagramMedia, 
  MediaType, 
  AudienceDemographics,
  AccountMetrics,
  InstagramDataPackage,
  HistoricalData
} from '@/types/instagram.types';

// Helper Functions
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min: number, max: number, decimals: number = 2): number => {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
};

const getRandomItem = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Format date as ISO string (YYYY-MM-DDThh:mm:ss.sssZ)
const formatDate = (date: Date): string => {
  return date.toISOString();
};

// Realistic data arrays for random selection
const mediaTypes: MediaType[] = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'];
const hashtagPool: string[] = [
  '#marketing', '#social', '#instagram', '#business', '#entrepreneur', 
  '#success', '#motivation', '#startup', '#branding', '#digitalmarketing',
  '#smallbusiness', '#entrepreneurship', '#innovation', '#tech', '#leadership',
  '#growth', '#strategy', '#contentmarketing', '#socialmediatips', '#analytics'
];
const captionStarters: string[] = [
  "Excited to announce",
  "Check out our latest",
  "New day, new goals",
  "The team has been working on",
  "We're thrilled to share",
  "Behind the scenes at",
  "Today we're talking about",
  "What do you think about",
  "It's official!",
  "Here's a sneak peek of"
];
const industries: string[] = [
  "Fashion & Apparel", "Beauty & Cosmetics", "Health & Fitness", 
  "Food & Beverage", "Travel & Lifestyle", "Business & Entrepreneurship",
  "Education & Learning", "Arts & Entertainment", "Technology & Gaming",
  "Home & Decor"
];
const cities: string[] = [
  "New York", "Los Angeles", "London", "Tokyo", "Paris", 
  "Berlin", "Sydney", "Toronto", "Singapore", "Dubai"
];
const countries: string[] = [
  "United States", "United Kingdom", "Japan", "France", "Germany",
  "Australia", "Canada", "Singapore", "United Arab Emirates", "Brazil"
];
const days: string[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];
const colorPalette: string[] = [
  "#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300", 
  "#DAF7A6", "#FF5733", "#C70039", "#2471A3", "#1ABC9C"
];

// Mock Profile Generator
export const generateMockProfile = (username: string): InstagramProfile => {
  const followerCount = getRandomInt(1000, 100000);
  const followingCount = getRandomInt(100, 2000);
  const mediaCount = getRandomInt(50, 500);
  
  return {
    id: `${getRandomInt(1000000000, 9999999999)}`,
    username: username.replace('@', ''),
    account_type: getRandomItem(['BUSINESS', 'CREATOR']),
    media_count: mediaCount,
    followers_count: followerCount,
    follows_count: followingCount,
    profile_picture_url: `https://randomuser.me/api/portraits/${getRandomInt(0, 1) ? 'women' : 'men'}/${getRandomInt(1, 99)}.jpg`,
    biography: `${getRandomItem(industries)} professional sharing insights, tips, and inspiration. Based in ${getRandomItem(cities)}.`,
    website: `https://www.${username.replace('@', '')}.com`,
    name: username.replace('@', '').split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    is_verified: Math.random() > 0.8, // 20% chance of being verified
  };
};

// Mock Media Generator
export const generateMockMedia = (profileId: string, count: number = 30): InstagramMedia[] => {
  const media: InstagramMedia[] = [];
  
  // End date is now, start date is X days ago (enough to cover the count of posts)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - count * 2); // Assume an average of one post every 2 days
  
  for (let i = 0; i < count; i++) {
    const mediaType = getRandomItem(mediaTypes);
    const postDate = getRandomDate(startDate, endDate);
    
    // Generate 1-5 random hashtags
    const hashtagCount = getRandomInt(1, 5);
    const hashtags: string[] = [];
    for (let j = 0; j < hashtagCount; j++) {
      hashtags.push(getRandomItem(hashtagPool));
    }
    
    // Generate caption with hashtags
    const caption = `${getRandomItem(captionStarters)} ${getRandomItem(industries).toLowerCase()} tips and tricks! ${hashtags.join(' ')}`;
    
    // Generate engagement metrics based on profile follower count
    const followerPercentageLikes = getRandomFloat(0.01, 0.15); // 1% to 15% of followers like a post
    const followerPercentageComments = getRandomFloat(0.001, 0.02); // 0.1% to 2% of followers comment
    
    const likeCount = Math.floor(50000 * followerPercentageLikes);
    const commentsCount = Math.floor(50000 * followerPercentageComments);
    
    media.push({
      id: `${profileId}_${getRandomInt(1000000000, 9999999999)}`,
      caption: caption,
      media_type: mediaType,
      media_url: `https://picsum.photos/id/${getRandomInt(1, 1000)}/800/800`,
      permalink: `https://instagram.com/p/${generateRandomString(11)}`,
      thumbnail_url: mediaType === 'VIDEO' ? `https://picsum.photos/id/${getRandomInt(1, 1000)}/400/400` : undefined,
      timestamp: formatDate(postDate),
      like_count: likeCount,
      comments_count: commentsCount,
      engagement_rate: ((likeCount + commentsCount) / 50000) * 100,
      reach: getRandomInt(likeCount, likeCount * 3),
      impressions: getRandomInt(likeCount * 2, likeCount * 5),
      saved: getRandomInt(likeCount * 0.01, likeCount * 0.1),
      hashtags: hashtags,
      mentioned_users: [],
      primary_color: getRandomItem(colorPalette),
      children: mediaType === 'CAROUSEL_ALBUM' ? generateMockCarouselChildren(3) : undefined,
      insights: {
        engagement: likeCount + commentsCount,
        impressions: getRandomInt(likeCount * 2, likeCount * 5),
        reach: getRandomInt(likeCount, likeCount * 3),
        saved: getRandomInt(likeCount * 0.01, likeCount * 0.1),
        video_views: mediaType === 'VIDEO' ? getRandomInt(likeCount, likeCount * 4) : undefined
      }
    });
  }
  
  // Sort by timestamp (newest first)
  return media.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Generate carousel children
const generateMockCarouselChildren = (count: number = 3) => {
  const children = [];
  for (let i = 0; i < count; i++) {
    children.push({
      id: `child_${getRandomInt(1000000000, 9999999999)}`,
      media_type: getRandomItem(mediaTypes) as MediaType,
      media_url: `https://picsum.photos/id/${getRandomInt(1, 1000)}/800/800`
    });
  }
  return children;
};

// Generate random string for post IDs
const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Mock Audience Demographics Generator
export const generateMockAudienceDemographics = (): AudienceDemographics => {
  // Age ranges with realistic distribution
  const ageRanges = [
    { range: '13-17', percentage: getRandomFloat(1, 5) },
    { range: '18-24', percentage: getRandomFloat(15, 30) },
    { range: '25-34', percentage: getRandomFloat(25, 40) },
    { range: '35-44', percentage: getRandomFloat(15, 25) },
    { range: '45-54', percentage: getRandomFloat(5, 15) },
    { range: '55-64', percentage: getRandomFloat(2, 10) },
    { range: '65+', percentage: getRandomFloat(1, 5) }
  ];
  
  // Normalize to ensure percentages sum to 100
  const ageTotal = ageRanges.reduce((sum, item) => sum + item.percentage, 0);
  ageRanges.forEach(item => {
    item.percentage = parseFloat((item.percentage / ageTotal * 100).toFixed(1));
  });
  
  // Gender distribution (normalize to 100%)
  const malePercentage = getRandomFloat(20, 60);
  const femalePercentage = getRandomFloat(20, 60);
  const otherPercentage = 100 - malePercentage - femalePercentage;
  
  // Top locations
  const locations = [];
  const locationCount = getRandomInt(3, 6);
  const usedCountries = new Set();
  
  for (let i = 0; i < locationCount; i++) {
    let country;
    do {
      country = getRandomItem(countries);
    } while (usedCountries.has(country));
    
    usedCountries.add(country);
    
    locations.push({
      country: country,
      city: country === 'United States' ? getRandomItem(cities) : undefined,
      percentage: getRandomFloat(5, 30)
    });
  }
  
  // Normalize location percentages
  const locationTotal = locations.reduce((sum, item) => sum + item.percentage, 0);
  locations.forEach(item => {
    item.percentage = parseFloat((item.percentage / locationTotal * 100).toFixed(1));
  });
  
  // Activity times by day and hour
  const activeTimes = [];
  
  for (const day of days) {
    // Generate 3-5 peak hours per day
    const peakHours = getRandomInt(3, 5);
    const usedHours = new Set();
    
    for (let i = 0; i < peakHours; i++) {
      let hour;
      do {
        // Focus on waking hours
        hour = getRandomInt(7, 23);
      } while (usedHours.has(hour));
      
      usedHours.add(hour);
      
      activeTimes.push({
        day: day,
        hour: hour,
        activity_level: getRandomInt(40, 100)
      });
    }
  }
  
  return {
    age_ranges: ageRanges,
    gender: {
      male: parseFloat(malePercentage.toFixed(1)),
      female: parseFloat(femalePercentage.toFixed(1)),
      other: parseFloat(otherPercentage.toFixed(1))
    },
    locations: locations,
    active_times: activeTimes
  };
};

// Generate Account Metrics
export const generateMockAccountMetrics = (media: InstagramMedia[]): AccountMetrics => {
  // Calculate media type distribution
  const mediaTypeCounts = {
    'IMAGE': 0,
    'VIDEO': 0,
    'CAROUSEL_ALBUM': 0
  };
  
  let totalLikes = 0;
  let totalComments = 0;
  let totalEngagement = 0;
  
  const hashtagCounts: Record<string, { count: number, engagement: number }> = {};
  
  media.forEach(post => {
    mediaTypeCounts[post.media_type]++;
    totalLikes += post.like_count;
    totalComments += post.comments_count;
    totalEngagement += post.like_count + post.comments_count;
    
    // Track hashtag performance
    post.hashtags?.forEach(tag => {
      if (!hashtagCounts[tag]) {
        hashtagCounts[tag] = { count: 0, engagement: 0 };
      }
      hashtagCounts[tag].count++;
      hashtagCounts[tag].engagement += post.like_count + post.comments_count;
    });
  });
  
  // Find best performing media type
  let bestType: MediaType = 'IMAGE';
  let maxCount = 0;
  
  Object.entries(mediaTypeCounts).forEach(([type, count]) => {
    if (count > maxCount) {
      maxCount = count;
      bestType = type as MediaType;
    }
  });
  
  // Calculate posting frequency (posts per week)
  const oldestPost = new Date(media[media.length - 1].timestamp);
  const newestPost = new Date(media[0].timestamp);
  const daysRange = (newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24);
  const weeksRange = daysRange / 7;
  const postFrequency = media.length / (weeksRange || 1); // Avoid division by zero
  
  // Generate optimal posting times
  const optimalTimes = [];
  const usedDayHours = new Set();
  
  for (let i = 0; i < 5; i++) {
    const day = getRandomItem(days);
    const hour = getRandomInt(9, 21); // Business hours mostly
    const dayHour = `${day}-${hour}`;
    
    if (!usedDayHours.has(dayHour)) {
      usedDayHours.add(dayHour);
      optimalTimes.push({
        day: day,
        hour: hour,
        engagement_score: getRandomInt(70, 98)
      });
    }
  }
  
  // Process top hashtags
  const topHashtags = Object.entries(hashtagCounts)
    .map(([tag, data]) => ({
      hashtag: tag,
      usage_count: data.count,
      avg_engagement: data.count > 0 ? data.engagement / data.count : 0
    }))
    .sort((a, b) => b.avg_engagement - a.avg_engagement)
    .slice(0, 5);
  
  return {
    overall_engagement_rate: (totalEngagement / (50000 * media.length)) * 100,
    avg_likes_per_post: totalLikes / media.length,
    avg_comments_per_post: totalComments / media.length,
    follower_growth_rate: getRandomFloat(0.5, 5.0),
    post_frequency: postFrequency,
    best_performing_media_type: bestType,
    optimal_posting_times: optimalTimes,
    hashtag_performance: topHashtags
  };
};

// Generate historical data (for growth charts)
export const generateMockHistoricalData = (months: number = 6): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  // Initial values
  let followers = getRandomInt(5000, 20000);
  let following = getRandomInt(500, 2000);
  let posts = getRandomInt(30, 100);
  let engagementRate = getRandomFloat(1.5, 4.0);
  
  // Generate data for each month
  for (let i = 0; i <= months; i++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + i);
    
    data.push({
      date: currentDate.toISOString().slice(0, 10), // YYYY-MM-DD format
      followers: followers,
      following: following,
      posts: posts,
      engagement_rate: engagementRate
    });
    
    // Update values for next month (with some randomness)
    const followerGrowth = getRandomFloat(1.01, 1.05); // 1-5% monthly growth
    followers = Math.floor(followers * followerGrowth);
    following = Math.floor(following * getRandomFloat(1.0, 1.02)); // 0-2% growth
    posts += getRandomInt(4, 12); // 4-12 new posts per month
    engagementRate *= getRandomFloat(0.98, 1.02); // -2% to +2% change
  }
  
  return data;
};

// Generate a complete data package
export const generateMockInstagramData = (
  username: string
): InstagramDataPackage => {
  const profile = generateMockProfile(username);
  const media = generateMockMedia(profile.id, 30);
  const audience = generateMockAudienceDemographics();
  const metrics = generateMockAccountMetrics(media);
  const historicalData = generateMockHistoricalData(6);
  
  // Find trending content (top 5 by engagement)
  const trendingContent = [...media]
    .sort((a, b) => {
      const engagementA = a.like_count + a.comments_count;
      const engagementB = b.like_count + b.comments_count;
      return engagementB - engagementA;
    })
    .slice(0, 5);
  
  return {
    profile,
    media,
    audience,
    metrics,
    trending_content: trendingContent,
    historical_growth: historicalData
  };
};