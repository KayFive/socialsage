// src/hooks/useInstagram.ts
// Custom hook for Instagram authentication and data management

'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { getConnectedInstagramAccount, hasConnectedInstagramAccount } from '@/lib/instagram-api';
import { instagramApi } from '@/services/instagramApiService';
import { InstagramAccount } from '@/types/database.types';
import { InstagramDataPackage } from '@/types/instagram.types';

interface UseInstagramReturn {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Account data
  account: InstagramAccount | null;
  instagramData: InstagramDataPackage | null;
  
  // Actions
  connectInstagram: () => void;
  disconnectInstagram: () => Promise<void>;
  refreshData: () => Promise<void>;
  checkConnection: () => Promise<void>;
}

export function useInstagram(): UseInstagramReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [instagramData, setInstagramData] = useState<InstagramDataPackage | null>(null);

  // Check connection status on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Check if user just connected Instagram
  useEffect(() => {
    const justConnected = localStorage.getItem('instagram_just_connected');
    if (justConnected === 'true') {
      localStorage.removeItem('instagram_just_connected');
      checkConnection(); // Refresh connection status
    }
  }, []);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const supabase = createBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setIsConnected(false);
        setAccount(null);
        setInstagramData(null);
        return;
      }

      // Check if Instagram account is connected
      const connected = await hasConnectedInstagramAccount(user.id);
      setIsConnected(connected);

      if (connected) {
        // Get the connected account details
        const connectedAccount = await getConnectedInstagramAccount(user.id);
        setAccount(connectedAccount);

        // Load Instagram data if we have a valid token
        if (connectedAccount?.access_token) {
          await loadInstagramData(connectedAccount.access_token, user.id);
        }
      } else {
        setAccount(null);
        setInstagramData(null);
      }

    } catch (err) {
      console.error('Error checking Instagram connection:', err);
      setError(err instanceof Error ? err.message : 'Failed to check Instagram connection');
      setIsConnected(false);
      setAccount(null);
      setInstagramData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstagramData = async (accessToken: string, userId: string) => {
    try {
      const data = await instagramApi.getInstagramDataPackage(accessToken, userId);
      setInstagramData(data);
    } catch (err) {
      console.error('Error loading Instagram data:', err);
      
      // If token is invalid, mark as disconnected
      if (err instanceof Error && err.message.includes('token')) {
        setIsConnected(false);
        setAccount(null);
        setError('Instagram token expired. Please reconnect your account.');
      } else {
        setError('Failed to load Instagram data');
      }
    }
  };

  const connectInstagram = () => {
    try {
      setError(null);
      
      // Get Instagram OAuth URL and redirect
      const authUrl = instagramApi.getAuthUrl();
      
      // Store current URL to return to after auth
      localStorage.setItem('pre_auth_url', window.location.pathname);
      
      // Redirect to Instagram OAuth
      window.location.href = authUrl;
      
    } catch (err) {
      console.error('Error connecting to Instagram:', err);
      setError('Failed to start Instagram connection');
    }
  };

  const disconnectInstagram = async () => {
    try {
      setError(null);
      
      if (!account) {
        throw new Error('No account to disconnect');
      }

      // Get current user
      const supabase = createBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to disconnect Instagram');
      }

      // Deactivate the Instagram account in database
      const { error: updateError } = await supabase
        .from('instagram_accounts')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) throw updateError;

      // Clear local state
      setIsConnected(false);
      setAccount(null);
      setInstagramData(null);
      
      // Clear any local storage related to Instagram
      localStorage.removeItem('instagram_just_connected');
      localStorage.removeItem('connected_instagram_handle');

    } catch (err) {
      console.error('Error disconnecting Instagram:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect Instagram');
    }
  };

  const refreshData = async () => {
    try {
      setError(null);
      
      if (!account?.access_token) {
        throw new Error('No Instagram account connected');
      }

      // Get current user
      const supabase = createBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to refresh data');
      }

      // Check if token needs refreshing
      const now = new Date();
      const expiresAt = new Date(account.token_expires_at || 0);
      
      let accessToken = account.access_token;
      
      if (expiresAt <= now) {
        try {
          // Refresh the token
          accessToken = await instagramApi.refreshToken(accessToken);
          
          // Update the token in database
          await supabase
            .from('instagram_accounts')
            .update({
              access_token: accessToken,
              token_expires_at: new Date(Date.now() + 5184000 * 1000).toISOString(), // 60 days
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id);
            
          // Update local account state
          setAccount({
            ...account,
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 5184000 * 1000).toISOString()
          });
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Instagram token expired and refresh failed. Please reconnect your account.');
        }
      }

      // Load fresh Instagram data
      await loadInstagramData(accessToken, user.id);

    } catch (err) {
      console.error('Error refreshing Instagram data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh Instagram data');
      
      // If token issues, mark as disconnected
      if (err instanceof Error && err.message.includes('token')) {
        setIsConnected(false);
        setAccount(null);
        setInstagramData(null);
      }
    }
  };

  return {
    isConnected,
    isLoading,
    error,
    account,
    instagramData,
    connectInstagram,
    disconnectInstagram,
    refreshData,
    checkConnection,
  };
}