// src/lib/auth.ts - Replace your entire file with this

import { createBrowserClient } from '@supabase/ssr'
import { InstagramAccount } from '@/types/instagram'

// Singleton pattern to ensure only one Supabase client instance
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    console.log('🔧 Created new Supabase client instance');
  }
  return supabaseInstance;
}

// Get the singleton instance
const supabase = getSupabaseClient();

export class AuthService {
  // Helper method to determine the correct base URL based on environment
  static getBaseUrl(): string {
    // Priority 1: Use NEXT_PUBLIC_APP_URL if set (production and configured environments)
    const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (envAppUrl) {
      console.log('✅ Using APP_URL from environment:', envAppUrl);
      return envAppUrl;
    }

    // Priority 2: Browser environment detection for development
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      console.log('🌐 Client-side detected origin:', currentOrigin);
      
      // If we're on ngrok, use ngrok URL for development
      if (currentOrigin.includes('ngrok')) {
        console.log('🔧 Using ngrok development URL');
        return currentOrigin;
      }
      
      // If we're on localhost, check for ngrok URL in environment
      if (currentOrigin.includes('localhost')) {
        // Check if there's an ngrok URL in redirect URI we can extract
        const envRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
        if (envRedirectUri && envRedirectUri.includes('ngrok')) {
          const baseUrl = envRedirectUri.replace('/auth/instagram/callback', '');
          console.log('🔧 Using ngrok URL extracted from redirect URI for localhost');
          return baseUrl;
        }
        // For localhost without ngrok, use localhost
        return currentOrigin;
      }
      
      // For any other browser environment, use current origin
      return currentOrigin;
    }
    
    // Priority 3: Server-side fallback - extract from redirect URI if available
    const envRedirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
    if (envRedirectUri) {
      const baseUrl = envRedirectUri.replace('/auth/instagram/callback', '');
      console.log('✅ Server-side: Extracted base URL from REDIRECT_URI:', baseUrl);
      return baseUrl;
    }
    
    // Final fallback (should rarely be used if environment is properly configured)
    console.warn('⚠️ No environment variables found, using localhost fallback');
    return 'http://localhost:3000';
  }

  static getInstagramAuthUrl(userId?: string): string {
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    
    if (!clientId) {
      console.error('❌ NEXT_PUBLIC_INSTAGRAM_CLIENT_ID is not set!');
      throw new Error('Instagram Client ID not configured');
    }
    
    let redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI;
    
    if (!redirectUri) {
      const baseUrl = this.getBaseUrl();
      redirectUri = `${baseUrl}/auth/instagram/callback`;
      console.log('🔧 Constructed redirect URI from base URL');
    } else {
      console.log('✅ Using redirect URI from environment');
    }
    
    console.log('🔧 Instagram Auth Config:');
    console.log('- Client ID:', clientId);
    console.log('- Redirect URI:', redirectUri);
    console.log('- User ID for state:', userId || 'none');
    console.log('- Environment:', process.env.NODE_ENV);
    
    const scope = 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_insights';
    
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().substring(0, 8);
    const state = userId ? `${timestamp}_${randomId}_USER_${userId}` : `${timestamp}_${randomId}`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      state: state
    });
    
    if (typeof window !== 'undefined') {
      const baseUrl = this.getBaseUrl();
      sessionStorage.setItem('oauth_initiated_from', baseUrl);
      sessionStorage.setItem('oauth_redirect_uri', redirectUri);
      sessionStorage.setItem('oauth_timestamp', timestamp.toString());
      if (userId) {
        sessionStorage.setItem('oauth_user_id', userId);
      }
    }
    
    const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    console.log('🔗 Generated Instagram Auth URL:', authUrl);
    console.log('🔗 Redirect will go to:', redirectUri);
    console.log('🔗 Scopes requested:', scope);
    
    return authUrl;
  }

  static async getActiveInstagramAccount(userId: string): Promise<InstagramAccount | null> {
    console.log('🔍 AuthService: Fetching Instagram account for user:', userId);
    
    if (!userId) {
      console.error('❌ No user ID provided');
      return null;
    }
    
    try {
      console.log('📡 Making Supabase query...');
      
      const { data, error } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📊 AuthService: Query result:');
      console.log('- Data:', data);
      console.log('- Error:', error);

      if (error) {
        console.error('❌ AuthService: Database error:', error);
        return null;
      }

      if (data) {
        console.log('✅ AuthService: Found Instagram account:', data.username);
        return data as InstagramAccount;
      }

      console.log('📭 AuthService: No Instagram account found (normal for new users)');
      return null;

    } catch (error) {
      console.error('❌ AuthService: Unexpected error:', error);
      return null;
    }
  }

  static async getCurrentUser() {
    console.log('👤 Getting current user...');
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('❌ AuthService: Error getting user:', error.message);
        return null;
      }
      
      if (user) {
        console.log('✅ AuthService: Found user:', user.id);
        return user;
      }
      
      console.log('📭 AuthService: No user found');
      return null;
    } catch (error) {
      console.error('💥 AuthService: Unexpected error getting user:', error);
      return null;
    }
  }

  static async exchangeCodeForToken(code: string): Promise<any> {
    console.log('🔄 Exchanging authorization code for token...');
    
    try {
      const response = await fetch('/api/auth/instagram/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token exchange failed:', response.status, errorText);
        throw new Error(`Failed to exchange code for token: ${response.status} ${errorText}`);
      }

      const tokenData = await response.json();
      console.log('✅ Token exchange successful');
      return tokenData;

    } catch (error) {
      console.error('❌ Token exchange error:', error);
      throw error;
    }
  }

  static async saveInstagramAccount(userId: string, accountData: any): Promise<InstagramAccount> {
    console.log('💾 Saving Instagram account for user:', userId);
    console.log('📊 Account data:', accountData);
    
    try {
      const response = await fetch('/api/auth/instagram/save-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          accountData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save account API failed:', response.status, errorText);
        throw new Error(`Failed to save Instagram account: ${errorText}`);
      }

      const savedAccount = await response.json();
      console.log('✅ Instagram account saved successfully via API');
      return savedAccount;

    } catch (error) {
      console.error('❌ Save Instagram account error:', error);
      throw error;
    }
  }

  static async disconnectInstagramAccount(userId: string): Promise<void> {
    console.log('🔌 Disconnecting Instagram account for user:', userId);
    
    try {
      const response = await fetch('/api/auth/instagram/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Instagram disconnect failed:', response.status, errorText);
        throw new Error(`Failed to disconnect Instagram: ${errorText}`);
      }

      console.log('✅ Instagram account disconnected successfully');
      
    } catch (error) {
      console.error('❌ Instagram disconnect error:', error);
      throw error;
    }
  }

  static async refreshInstagramToken(accountId: string): Promise<void> {
    console.log('🔄 Refreshing Instagram token for account:', accountId);
    
    try {
      const response = await fetch('/api/auth/instagram/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Token refresh failed:', response.status, errorText);
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      console.log('✅ Token refreshed successfully');

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    console.log('🚪 Signing out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        throw new Error(`Sign out failed: ${error.message}`);
      }
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      console.log('✅ Signed out successfully');
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('💥 Unexpected error getting session:', error);
      return null;
    }
  }

  // Helper method to clear all auth-related storage and reset state
  static clearAuthState() {
    console.log('🧹 Clearing all auth state...');
    
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('oauth') || key.includes('instagram'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('oauth') || key.includes('instagram'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log('✅ Cleared storage keys:', [...keysToRemove, ...sessionKeysToRemove]);
    }
  }

  static debugEnvironment() {
    console.log('🔍 Environment Debug Information:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Current origin (if browser):', typeof window !== 'undefined' ? window.location.origin : 'N/A');
    console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('- NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI:', process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI);
    console.log('- NEXT_PUBLIC_INSTAGRAM_CLIENT_ID:', process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID ? '✅ Set' : '❌ Missing');
    console.log('- Supabase client instance ID:', supabase);
    
    if (typeof window !== 'undefined') {
      console.log('- SessionStorage oauth data:', {
        initiated_from: sessionStorage.getItem('oauth_initiated_from'),
        redirect_uri: sessionStorage.getItem('oauth_redirect_uri'),
        timestamp: sessionStorage.getItem('oauth_timestamp'),
        user_id: sessionStorage.getItem('oauth_user_id')
      });
      
      console.log('- LocalStorage supabase keys:', 
        Object.keys(localStorage).filter(key => key.includes('supabase'))
      );
    }
    
    const baseUrl = this.getBaseUrl();
    console.log('- Calculated base URL:', baseUrl);
    
    const redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || `${baseUrl}/auth/instagram/callback`;
    console.log('- Redirect URI that will be used:', redirectUri);
  }
}

export { supabase };