import { InstagramDataPackage } from '@/types/instagram.types';
import { generateMockInstagramData } from '@/utils/mockDataGenerator';
import { createBrowserClient } from '@/lib/supabase';

// In-memory cache for mock data
let mockDataCache: Record<string, InstagramDataPackage> = {};

// Generate or retrieve mock data for a specific Instagram handle
export const getMockInstagramData = async (
  instagramHandle: string,
  userId: string
): Promise<InstagramDataPackage> => {
  // Check if we already have mock data for this handle
  const cacheKey = `${userId}_${instagramHandle}`;
  
  if (mockDataCache[cacheKey]) {
    return mockDataCache[cacheKey];
  }
  
  // Check if we have saved mock data in the database
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('mock_instagram_data')
    .select('*')
    .eq('user_id', userId)
    .eq('instagram_handle', instagramHandle)
    .single();
  
  if (data && !error) {
    // We have saved mock data, parse and return it
    const mockData = JSON.parse(data.mock_data) as InstagramDataPackage;
    mockDataCache[cacheKey] = mockData;
    return mockData;
  }
  
  // Generate new mock data
  const mockData = generateMockInstagramData(instagramHandle);
  mockDataCache[cacheKey] = mockData;
  
  // Save to database for persistence
  try {
    await supabase.from('mock_instagram_data').insert({
      user_id: userId,
      instagram_handle: instagramHandle,
      mock_data: JSON.stringify(mockData),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to save mock data to database', error);
  }
  
  return mockData;
};

// Refresh mock data (useful for testing different scenarios)
export const refreshMockInstagramData = async (
  instagramHandle: string,
  userId: string
): Promise<InstagramDataPackage> => {
  const cacheKey = `${userId}_${instagramHandle}`;
  
  // Remove from cache
  delete mockDataCache[cacheKey];
  
  // Remove from database
  const supabase = createBrowserClient();
  await supabase
    .from('mock_instagram_data')
    .delete()
    .eq('user_id', userId)
    .eq('instagram_handle', instagramHandle);
  
  // Generate new mock data
  return getMockInstagramData(instagramHandle, userId);
};