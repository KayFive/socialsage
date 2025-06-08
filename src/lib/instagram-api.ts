// /src/lib/instagram-api.ts - Replace your existing handleInstagramAuth function with this

import { createBrowserClient } from './supabase';
import { InstagramAccount } from '@/types/database.types';
import { instagramApi } from '@/services/instagramApiService';
import { InstagramService } from '@/services/instagramService';

// Instagram API endpoints
const INSTAGRAM_API_BASE = 'https://graph.instagram.com/v18.0';

// Updated types to match your existing structure
export type InstagramUserProfile = {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count?: number;
  follows_count?: number;
  profile_picture_url?: string;
  biography?: string;
  website?: string;
};

export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  children?: { data: { id: string; media_type: string; media_url: string }[] };
  like_count?: number;
  comments_count?: number;
  reach?: number;
  impressions?: number;
};

export type InstagramInsight = {
  name: string;
  period: string;
  values: { value: number }[];
};

// Function to get Instagram user profile
export const getInstagramProfile = async (accessToken: string): Promise<InstagramUserProfile> => {
  const fields = [
    'id',
    'username',
    'account_type',
    'media_count',
    'followers_count',
    'follows_count',
    'profile_picture_url',
    'biography',
    'website'
  ].join(',');

  const response = await fetch(
    `${INSTAGRAM_API_BASE}/me?fields=${fields}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Instagram API error: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Function to get Instagram media
export const getInstagramMedia = async (accessToken: string, limit = 25): Promise<InstagramMedia[]> => {
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'thumbnail_url',
    'timestamp',
    'children{id,media_type,media_url}',
    'like_count',
    'comments_count'
  ].join(',');

  const response = await fetch(
    `${INSTAGRAM_API_BASE}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Instagram API error: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data;
};

// Updated Instagram OAuth handler using new service
export const handleInstagramAuth = async (
  code: string, 
  redirectUri: string, 
  userId: string
): Promise<InstagramAccount> => {
  try {
    // Use the existing service to exchange code for token
    const accessToken = await instagramApi.exchangeCodeForToken(code);

    // Get user profile using existing function
    const profile = await getInstagramProfile(accessToken);

    // Use InstagramService to save connection (works with your existing table)
    const instagramService = new InstagramService();
    const connection = await instagramService.addConnection(userId, {
      instagram_user_id: profile.id,
      instagram_username: profile.username,
      access_token: accessToken,
      account_type: profile.account_type || 'personal',
      media_count: profile.media_count || 0,
      followers_count: profile.followers_count || 0,
      following_count: profile.follows_count || 0,
      profile_picture_url: profile.profile_picture_url || null,
    });

    // Return the connection data in the format your callback expects
    return {
      id: connection.id,
      user_id: userId,
      instagram_id: profile.id,
      instagram_handle: profile.username,
      access_token: accessToken,
      token_expires_at: connection.token_expires_at,
      is_active: true,
      created_at: connection.created_at,
      updated_at: connection.updated_at
    } as InstagramAccount;

  } catch (error) {
    console.error('Error in handleInstagramAuth:', error);
    throw new Error(`Failed to handle Instagram authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to check if an Instagram account is connected
export const hasConnectedInstagramAccount = async (userId: string): Promise<boolean> => {
  const instagramService = new InstagramService();
  const connections = await instagramService.getUserConnections(userId);
  return connections.length > 0;
};

// Function to get connected Instagram account
export const getConnectedInstagramAccount = async (userId: string): Promise<InstagramAccount | null> => {
  const instagramService = new InstagramService();
  return await instagramService.getPrimaryConnection(userId);
};

// Updated analyze Instagram account function
export const analyzeInstagramAccount = async (
  requestId: string, 
  userId: string
): Promise<void> => {
  const supabase = createBrowserClient();
  
  try {
    // Update request status to processing
    await supabase
      .from('instagram_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);
    
    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from('instagram_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    
    if (requestError) throw requestError;
    
    // Get connected Instagram account
    const account = await getConnectedInstagramAccount(userId);
    
    if (!account) {
      throw new Error('No connected Instagram account found');
    }
    
    // Check if token is expired and refresh if needed
    const now = new Date();
    const expiresAt = new Date(account.token_expires_at || 0);
    
    let accessToken = account.access_token;
    
    if (expiresAt <= now) {
      try {
        accessToken = await instagramApi.refreshToken(accessToken);
        
        // Update the token in database
        const instagramService = new InstagramService();
        await instagramService.updateConnectionData(account.id, {
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 5184000 * 1000).toISOString(), // 60 days
        });
          
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        throw new Error('Instagram token expired and refresh failed. Please reconnect your account.');
      }
    }
    
    // Fetch Instagram data using the existing service
    const analysisData = await instagramApi.getInstagramDataPackage(accessToken, userId);
    
    // Create a report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        request_id: requestId,
        report_data: analysisData,
        status: 'completed'
      })
      .select()
      .single();
    
    if (reportError) throw reportError;
    
    // Update request status to completed
    await supabase
      .from('instagram_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);
      
  } catch (error) {
    console.error('Error analyzing Instagram account:', error);
    
    // Update request status to failed
    await supabase
      .from('instagram_requests')
      .update({ status: 'failed' })
      .eq('id', requestId);
      
    throw error;
  }
};

// Helper function to calculate engagement rate
function calculateEngagementRate(profile: InstagramUserProfile, media: InstagramMedia[]): number {
  if (!profile.followers_count || profile.followers_count === 0 || media.length === 0) {
    return 0;
  }
  
  let totalEngagements = 0;
  
  media.forEach(post => {
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;
    totalEngagements += likes + comments;
  });
  
  const avgEngagements = totalEngagements / media.length;
  return (avgEngagements / profile.followers_count) * 100;
}

// Helper function to calculate post frequency
function calculatePostFrequency(media: InstagramMedia[]): { postsPerWeek: number, postsPerMonth: number } {
  if (media.length < 2) {
    return { postsPerWeek: 0, postsPerMonth: 0 };
  }
  
  // Sort by timestamp (newest first)
  const sortedMedia = [...media].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  // Calculate the date range
  const newestDate = new Date(sortedMedia[0].timestamp);
  const oldestDate = new Date(sortedMedia[sortedMedia.length - 1].timestamp);
  const daysDifference = (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDifference === 0) {
    return { postsPerWeek: 0, postsPerMonth: 0 };
  }
  
  const postsPerDay = media.length / daysDifference;
  const postsPerWeek = postsPerDay * 7;
  const postsPerMonth = postsPerDay * 30;
  
  return { postsPerWeek, postsPerMonth };
}

// Helper function to find top performing posts
function findTopPosts(media: InstagramMedia[], count: number): InstagramMedia[] {
  // Calculate engagement for each post
  const mediaWithEngagement = media.map(post => {
    const engagement = (post.like_count || 0) + (post.comments_count || 0);
    return { ...post, engagement };
  });
  
  // Sort by engagement in descending order
  mediaWithEngagement.sort((a, b) => {
    return (b as any).engagement - (a as any).engagement;
  });
  
  // Return top posts
  return mediaWithEngagement.slice(0, count);
}