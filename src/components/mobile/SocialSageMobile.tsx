import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AuthService } from '@/lib/auth';
import { useAnalytics } from '@/components/AnalyticsProvider';
import AppRouter from './AppRouter';

// Type definitions
interface InstagramPost {
  id: string;
  caption: string;
  comments_count: number;
  like_count: number;
  media_type: string;
  media_url: string;
  permalink: string;
  timestamp: string;
  reach?: number;
  impressions?: number;
  profile_visits?: number;
  website_clicks?: number;
  saves?: number;
  comments?: Comment[];
}

interface InstagramData {
  followers: number;
  mediaCount: number;
  username: string;
  engagementRate: string;
  growthRate: string;
  monthlyGrowth?: string;
  monthlyReach?: string;
  recentPosts?: InstagramPost[];
  avgLikes?: number;
  avgComments?: number;
  avgReach?: number;
  avgSaves?: number;
  totalLikes?: number;
  totalComments?: number;
  totalReach?: number;
  totalSaves?: number;
  totalImpressions?: number;
  profileVisits?: number;
  topFollowers?: any[];
  sentiment?: any;
  categoryStats?: any[];
  taggingProgress?: any;
  unlockedFeatures?: any;
  growthData?: any;
  contentTypeAnalysis?: any[];
}

const SocialSageMobile = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showEmailPreferences, setShowEmailPreferences] = useState(false);
  
  // Real Instagram data state
  const [instagramData, setInstagramData] = useState<InstagramData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  // Analytics tracking
  const { trackFeature, trackEngagement, trackFunnel } = useAnalytics();

  // Track initial app load
  useEffect(() => {
    trackEngagement('app_loaded', {
      has_instagram_data: !!instagramData
    });
    
    trackFunnel('user_onboarding', 'app_opened', 1, true);
  }, []);

  // User authentication check
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking user:', error);
        router.push('/');
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch Instagram data
  useEffect(() => {
    const fetchInstagramData = async () => {
      if (!user) return;

      try {
        setIsLoadingData(true);
        setDataError(null);

        console.log('🔄 Fetching Instagram data for user:', user.id);

        // Fetch metrics from API (this already checks for account)
const response = await fetch('/api/instagram/metrics');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Instagram metrics');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        console.log('✅ Instagram metrics fetched:', data);
        
        setInstagramData(data);
        setLastRefreshTime(new Date());
        
        // Track successful data load
        trackEngagement('instagram_data_loaded', {
          user_id: user.id,
          followers: data.followers || 0,
          posts_count: data.recentPosts?.length || 0
        });

      } catch (error) {
        console.error('❌ Error fetching Instagram data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Instagram data';
        setDataError(errorMessage);
        
        trackEngagement('instagram_data_load_failed', {
          error: errorMessage
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user) {
      fetchInstagramData();
    }
  }, [user, trackEngagement]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    
    trackEngagement('manual_refresh', {
      user_id: user?.id,
      last_refresh_ago: lastRefreshTime ? Date.now() - lastRefreshTime.getTime() : null
    });

    try {
      setIsLoadingData(true);
      setDataError(null);

      const response = await fetch('/api/instagram/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch Instagram metrics');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setInstagramData(data);
      setLastRefreshTime(new Date());
      
      trackEngagement('manual_refresh_success', {
        user_id: user?.id
      });

    } catch (error) {
      console.error('❌ Error refreshing Instagram data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh data';
      setDataError(errorMessage);
      
      trackEngagement('manual_refresh_failed', {
        error: errorMessage
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  // Logout function with tracking
  const handleLogout = async () => {
    console.log('🚪 Logging out from dashboard...');
    
    // Track logout attempt
    trackEngagement('user_logout', {
      session_duration: Date.now() - (performance.timing?.navigationStart || Date.now()),
      had_instagram_connected: !!instagramData
    });
    
    try {
      // Clear storage first
      sessionStorage.removeItem('socialsage_user_id');
      sessionStorage.removeItem('socialsage_user_email');
      localStorage.clear();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        trackEngagement('logout_failed', { error: error.message });
        alert('Logout failed. Please try again.');
        return;
      }
      
      console.log('✅ Logged out successfully');
      trackEngagement('logout_successful');
      
      // Force reload to clear any cached state
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      trackEngagement('logout_error', { error: errorMessage });
      alert('An error occurred during logout. Please refresh the page and try again.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <AppRouter
        user={user}
        instagramData={instagramData}
        isLoadingData={isLoadingData}
        dataError={dataError}
        lastRefreshTime={lastRefreshTime}
        handleManualRefresh={handleManualRefresh}
        handleLogout={handleLogout}
        showDataManagement={showDataManagement}
        setShowDataManagement={setShowDataManagement}
        showEmailPreferences={showEmailPreferences}
        setShowEmailPreferences={setShowEmailPreferences}
      />
    </div>
  );
};

export default SocialSageMobile;