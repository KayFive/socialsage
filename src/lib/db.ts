import { createBrowserClient } from './supabase';
import { Profile, InstagramRequest, Report, InstagramAccount } from '@/types/database.types';

// Profiles
export const getProfile = async (userId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data as Profile;
};

export const updateProfile = async (userId: string, profile: Partial<Profile>) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data as Profile;
};

// Instagram Requests
export const createInstagramRequest = async (request: Omit<InstagramRequest, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('instagram_requests')
    .insert(request)
    .select()
    .single();
    
  if (error) throw error;
  return data as InstagramRequest;
};

export const getInstagramRequests = async (userId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('instagram_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data as InstagramRequest[];
};

// Reports
export const getReports = async (userId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data as Report[];
};

// Instagram Accounts
export const getInstagramAccounts = async (userId: string) => {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);
    
  if (error) throw error;
  return data as InstagramAccount[];
};