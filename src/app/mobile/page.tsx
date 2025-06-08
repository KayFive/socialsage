'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createBrowserClient } from '@/lib/supabase';
import { InstagramService } from '@/services/instagramService';
import MobileDashboard from '@/components/mobile/MobileDashboard';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';

export default function MobilePage() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState<any>(null);
  const [instagramConnection, setInstagramConnection] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMobileData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createBrowserClient();
        
        console.log('🔍 MOBILE PAGE - Starting data fetch for user:', user.id);
        
        // Get Instagram connection (same as desktop)
        const instagramService = new InstagramService();
        const primaryConnection = await instagramService.getPrimaryConnection(user.id);
        console.log('📱 Mobile: Instagram connection:', primaryConnection);
        setInstagramConnection(primaryConnection);

        // Get latest report data (same as desktop)
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('📱 Mobile: Raw report data from Supabase:', reportData);

        if (reportError) {
          console.error('❌ Error fetching mobile report data:', reportError);
        } else if (reportData && reportData.length > 0) {
          const latestReport = reportData[0];
          
          console.log('📱 Mobile: Latest report status:', latestReport.status);
          console.log('📱 Mobile: Latest report data exists:', !!latestReport.report_data);
          
          // Only use completed reports with data
          if (latestReport.status === 'completed' && latestReport.report_data) {
            console.log('✅ Mobile: Using real report data:', latestReport.id);
            console.log('📊 Mobile: Report data structure:', {
              profile: !!latestReport.report_data.profile,
              summary: !!latestReport.report_data.summary,
              media: latestReport.report_data.media?.length || 0,
              metrics: !!latestReport.report_data.metrics
            });
            setReportData(latestReport.report_data);
          } else {
            console.log('⚠️ Mobile: No completed report found, status:', latestReport.status);
            setReportData(null);
          }
        } else {
          console.log('⚠️ Mobile: No reports found for user');
          setReportData(null);
        }

        // Track mobile dashboard access
        analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
          feature_name: 'mobile_dashboard_accessed',
          source: 'mobile_page',
          user_id: user.id,
          has_real_data: !!reportData,
          has_instagram_connection: !!primaryConnection
        });

      } catch (error) {
        console.error('❌ Error fetching mobile dashboard data:', error);
      } finally {
        setIsLoading(false);
        console.log('📱 Mobile: Data fetch completed');
      }
    };

    fetchMobileData();
  }, [user]);

  // Debug logging for final state
  useEffect(() => {
    console.log('📱 MOBILE PAGE - Final state:');
    console.log('  - isLoading:', isLoading);
    console.log('  - reportData exists:', !!reportData);
    console.log('  - instagramConnection exists:', !!instagramConnection);
    if (reportData) {
      console.log('  - reportData.profile.username:', reportData.profile?.username);
      console.log('  - reportData.media.length:', reportData.media?.length);
      console.log('  - reportData.profile.followers_count:', reportData.profile?.followers_count);
    }
  }, [isLoading, reportData, instagramConnection]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching Instagram analytics</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MobileDashboard 
        reportData={reportData} 
        instagramConnection={instagramConnection}
      />
    </ProtectedRoute>
  );
}