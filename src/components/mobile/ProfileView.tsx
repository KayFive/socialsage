import React, { useState, useEffect } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import { useAnalytics, ClickTracker, ViewTracker } from '@/components/AnalyticsProvider';
import AccountDataManagement from '@/components/AccountDataManagement';
import { AuthService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Type definitions
interface InstagramData {
  username: string;
  followers: number;
  mediaCount: number;
  engagementRate: string;
  avgReach?: number;
  recentPosts?: any[];
  accountInsights?: {
    reach: number;
    profile_visits: number;
    impressions: number;
  };
  topFollowers?: any[];
}

interface ProfileViewProps {
  user: any;
  instagramData: InstagramData | null;
  handleLogout: () => void;
  showDataManagement: boolean;
  setShowDataManagement: (show: boolean) => void;
  showEmailPreferences: boolean;
  setShowEmailPreferences: (show: boolean) => void;
  onBackToAICoach: () => void;
}

// EmailPreferences Component - moved inside ProfileView
const EmailPreferences: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const [preferences, setPreferences] = useState({
    marketing: true,
    product: true,
    tips: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load current preferences
    const loadPreferences = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email_marketing_enabled, email_product_updates, email_growth_tips')
          .eq('id', userId)
          .single();

        if (data) {
          setPreferences({
            marketing: data.email_marketing_enabled ?? true,
            product: data.email_product_updates ?? true,
            tips: data.email_growth_tips ?? true,
          });
        }
      } catch (error) {
        console.error('Error loading email preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          email_marketing_enabled: preferences.marketing,
          email_product_updates: preferences.product,
          email_growth_tips: preferences.tips,
        })
        .eq('id', userId);

      alert('Email preferences saved!');
      onClose();
    } catch (error) {
      console.error('Error saving email preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading preferences...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={onClose}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Email Preferences</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Marketing Emails</h3>
              <p className="text-xs text-gray-600">Promotional content and special offers</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Product Updates</h3>
              <p className="text-xs text-gray-600">New features and improvements</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.product}
              onChange={(e) => setPreferences({ ...preferences, product: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Growth Tips</h3>
              <p className="text-xs text-gray-600">Weekly insights and advice</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.tips}
              onChange={(e) => setPreferences({ ...preferences, tips: e.target.checked })}
              className="w-5 h-5"
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  instagramData,
  handleLogout,
  showDataManagement,
  setShowDataManagement,
  showEmailPreferences,
  setShowEmailPreferences,
  onBackToAICoach
}) => {
    console.log('🔍 ProfileView Debug:', {
    hasInstagramData: !!instagramData,
    instagramData: instagramData,
    username: instagramData?.username,
    followers: instagramData?.followers
  });

  const [showAbout, setShowAbout] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [isDisconnectingInstagram, setIsDisconnectingInstagram] = useState(false);
  const [localInstagramData, setLocalInstagramData] = useState(instagramData);
  const [dataError, setDataError] = useState<string | null>(null);

  // Get analytics functions
  const { trackFeature, trackEngagement } = useAnalytics();

  // Track profile view
  useEffect(() => {
    trackFeature('profile_tab', 'view', {
      has_instagram_data: !!instagramData,
      instagram_connected: !!instagramData
    });
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setLocalInstagramData(instagramData);
  }, [instagramData]);

  // 🔥 FIXED: Instagram connect/disconnect handler
  const handleInstagramAuth = async () => {
    console.log('🔌 Instagram auth clicked', { 
      hasInstagramData: !!localInstagramData,
      hasUser: !!user,
      userId: user?.id 
    });

    if (localInstagramData) {
      // === DISCONNECT INSTAGRAM ===
      if (isDisconnectingInstagram) {
        console.log('⏳ Already disconnecting, ignoring click');
        return;
      }
      
      setIsDisconnectingInstagram(true);
      
      // Track disconnect attempt
      trackEngagement('instagram_disconnect_attempt', {
        follower_count: localInstagramData.followers,
        posts_count: localInstagramData.recentPosts?.length || 0,
        engagement_rate: localInstagramData.engagementRate
      });
      
      try {
        // Get current user ID
        console.log('🔍 Getting current user...');
        const currentUser = await AuthService.getCurrentUser();
        
        if (!currentUser) {
          console.error('❌ No user found');
          alert('Please log in first');
          return;
        }
        
        console.log('✅ Current user:', currentUser.id);
        console.log('📞 Calling disconnectInstagramAccount...');
        
        await AuthService.disconnectInstagramAccount(currentUser.id);
        
        console.log('✅ Instagram disconnected successfully');
        setLocalInstagramData(null);
        alert('Instagram account disconnected successfully!');
        
        // Track successful disconnect
        trackEngagement('instagram_disconnected', {
          was_connected_duration: 'unknown'
        });
        
        // Reload the page to refresh all data
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Failed to disconnect Instagram:', error);
        alert('Failed to disconnect Instagram. Please try again.');
        
        // Track disconnect failure
        trackEngagement('instagram_disconnect_failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setIsDisconnectingInstagram(false);
      }
    } else {
      // === CONNECT INSTAGRAM ===
      try {
        console.log('📸 Starting Instagram connection...');
        
        // Track connect attempt
        trackEngagement('instagram_connect_attempt', {
          from_profile: true
        });
        
        // Get current user
        console.log('🔍 Getting current user...');
        const currentUser = await AuthService.getCurrentUser();
        
        if (!currentUser) {
          console.error('❌ No user found');
          alert('Please log in first');
          return;
        }
        
        console.log('✅ Current user:', currentUser.id);
        
        // Get the Instagram auth URL and redirect
        console.log('🔗 Getting Instagram auth URL...');
        const authUrl = AuthService.getInstagramAuthUrl(currentUser.id);
        console.log('📍 Redirecting to:', authUrl);
        
        // Redirect to Instagram OAuth
        window.location.href = authUrl;
        
      } catch (error) {
        console.error('❌ Failed to start Instagram connection:', error);
        alert('Failed to connect Instagram. Please try again.');
        
        // Track connect failure
        trackEngagement('instagram_connect_failed', {
          error: error instanceof Error ? error.message : String(error),
          from_profile: true
        });
      }
    }
  };

  // Show data management page if selected
  if (showDataManagement) {
    return <AccountDataManagement onBack={() => setShowDataManagement(false)} />;
  }

  // Show email preferences if requested
  if (showEmailPreferences) {
    return <EmailPreferences userId={user?.id || ''} onClose={() => setShowEmailPreferences(false)} />;
  }

  const AboutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <ViewTracker
        featureName="about_modal"
        metadata={{ opened_from: 'profile' }}
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">About SocialSage</h2>
            <ClickTracker
              featureName="about_modal_close"
              metadata={{ read_time: Date.now() }}
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </ClickTracker>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <span className="text-white text-2xl font-bold">SS</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">SocialSage</h3>
              <p className="text-gray-600 text-sm">AI-Powered Social Media Analytics</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">App Version</h3>
              <p>Version 1.3.0 (Build 2025.06.16)</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What's New</h3>
              <p>This version includes new timing and frequency optimization views, enhanced real-time analytics, and improved AI recommendations based on your actual posting patterns.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About the Team</h3>
              <p>Built with ❤️ by the SocialSage team. We're dedicated to empowering creators with data-driven insights to grow their social media presence.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p>For questions or support, please contact us at support@socialsage.app or follow us @socialsageapp on social media.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Legal</h3>
              <p>© 2025 SocialSage. All rights reserved. View our Terms of Service and Privacy Policy for more information.</p>
            </div>
          </div>
          
          <ClickTracker
            featureName="about_modal_acknowledge"
            metadata={{ modal_open_duration: Date.now() }}
          >
            <button 
              onClick={() => setShowAbout(false)}
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors"
            >
              Got It
            </button>
          </ClickTracker>
        </div>
      </ViewTracker>
    </div>
  );

  const HelpSupportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <ViewTracker
        featureName="help_support_modal"
        metadata={{ opened_from: 'profile' }}
      >
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Help & Support</h2>
            <ClickTracker
              featureName="help_support_close"
              metadata={{ read_time: Date.now() }}
            >
              <button 
                onClick={() => setShowHelpSupport(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </ClickTracker>
          </div>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Common Questions</h3>
              <div className="space-y-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">How do I connect Instagram?</h4>
                  <p className="text-xs">Go to Profile {'>'} Accounts and click "Connect". You need a Business or Creator account.</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">Why no timing data?</h4>
                  <p className="text-xs">You need at least 5-10 posts for timing analysis. Keep posting and check back!</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-1 text-xs">How is frequency calculated?</h4>
                  <p className="text-xs">We analyze your posting history to find the optimal frequency for your audience engagement.</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Fixes</h3>
              <div className="space-y-1 text-xs">
                <p><strong>No data:</strong> Switch to Business/Creator mode</p>
                <p><strong>Login issues:</strong> Log out and back in</p>
                <p><strong>Slow loading:</strong> Check connection and refresh</p>
                <p><strong>Missing insights:</strong> Need more posts for analysis</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✉</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Email Support</p>
                    <p className="text-blue-600 text-xs">support@socialsage.app</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">💬</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Live Chat</p>
                    <p className="text-gray-600 text-xs">Mon-Fri 9AM-5PM PT</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
              <p>Connect your Instagram Business account, post regularly, and explore the new Timing and Frequency optimization views for personalized recommendations.</p>
            </div>
          </div>
          
          <ClickTracker
            featureName="help_support_acknowledge"
            metadata={{ modal_open_duration: Date.now() }}
          >
            <button 
              onClick={() => setShowHelpSupport(false)}
              className="w-full mt-6 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-all"
            >
              Got It
            </button>
          </ClickTracker>
        </div>
      </ViewTracker>
    </div>
  );

  // 🔥 ADDED: User validation check
  if (!user) {
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 shadow-lg text-center max-w-sm">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
          <button
            onClick={handleLogout}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={onBackToAICoach}
            className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <ViewTracker
          featureName="profile_header"
          metadata={{ has_instagram_data: !!localInstagramData }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Your Account</h2>
                <p className="text-gray-600">Social Media Analytics</p>
                <p className="text-sm text-gray-500">{user?.email || 'SocialSage User'}</p>
              </div>
            </div>
          </div>
        </ViewTracker>

        <ViewTracker
          featureName="profile_accounts_section"
          metadata={{ 
            instagram_connected: !!localInstagramData,
            total_accounts: 4
          }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Accounts</h3>
            {!localInstagramData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">📸 Instagram Data Usage</h4>
                <p className="text-blue-800 text-sm mb-3">
                  When you connect Instagram, we'll access your profile data, posts, comments, 
                  and analytics to provide personalized insights. We never share your data 
                  with third parties.
                </p>
                <a 
                  href="/privacy" 
                  target="_blank"
                  className="text-blue-700 hover:text-blue-900 underline text-sm font-medium"
                >
                  📄 Read our full Privacy Policy →
                </a>
              </div>
            )}
            <div className="space-y-3">
              {[
                { 
                  platform: 'Instagram', 
                  connected: !!localInstagramData, 
                  color: 'bg-pink-500', 
                  username: localInstagramData?.username,
                  isLoading: isDisconnectingInstagram
                },
                { platform: 'Twitter/X', connected: false, color: 'bg-black', comingSoon: true },
                { platform: 'YouTube', connected: false, color: 'bg-red-600', comingSoon: true },
                { platform: 'TikTok', connected: false, color: 'bg-gray-900', comingSoon: true }
              ].map((account) => (
                <div key={account.platform} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${account.color} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">
                        {account.platform === 'Instagram' ? 'IG' : 
                         account.platform === 'Twitter/X' ? 'X' : 
                         account.platform === 'YouTube' ? 'YT' : 'TT'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-700">{account.platform}</span>
                      {account.username && (
                        <p className="text-xs text-gray-500">{account.username}</p>
                      )}
                    </div>
                  </div>
                  
                  {account.platform === 'Instagram' ? (
                    <ClickTracker
                      featureName="instagram_connection_toggle"
                      metadata={{
                        action: account.connected ? 'disconnect' : 'connect',
                        has_data: account.connected
                      }}
                    >
                      <button
                        onClick={handleInstagramAuth}
                        disabled={account.isLoading}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          account.connected 
                            ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                        } ${account.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {account.isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full"></div>
                            <span>Wait...</span>
                          </div>
                        ) : (
                          account.connected ? 'Disconnect' : 'Connect'
                        )}
                      </button>
                    </ClickTracker>
                  ) : (
                    <div className={`px-3 py-1 rounded-full text-xs ${
                      account.comingSoon ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {account.comingSoon ? 'Coming Soon' : 'Connect'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ViewTracker>

        <ViewTracker
          featureName="profile_settings_section"
          metadata={{ settings_count: 7 }}
        >
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
            <div className="space-y-3">
              {[
                { name: 'Email Preferences', clickable: true, action: () => setShowEmailPreferences(true), new: true },
                { name: 'Account Data Management', clickable: true, action: () => setShowDataManagement(true) },
                { name: 'Privacy Policy', clickable: true, action: () => window.open('/privacy', '_blank') },
                { name: 'Terms of Service', clickable: true, action: () => window.open('/terms', '_blank') },
                { name: 'Billing', clickable: false },
                { name: 'Help & Support', clickable: true, action: () => setShowHelpSupport(true) },
                { name: 'About', clickable: true, action: () => setShowAbout(true) }
              ].map((setting) => (
                <ClickTracker
                  key={setting.name}
                  featureName={`profile_setting_${setting.name.toLowerCase().replace(/\s+/g, '_')}`}
                  metadata={{ setting_name: setting.name, clickable: setting.clickable }}
                >
                  <button
                    onClick={setting.clickable ? setting.action : undefined}
                    className={`w-full flex items-center justify-between py-2 ${
                      setting.clickable ? 'hover:bg-gray-50 rounded-lg px-2 -mx-2' : ''
                    }`}
                    disabled={!setting.clickable}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-gray-700 ${setting.clickable ? 'text-blue-600' : ''}`}>
                        {setting.name}
                      </span>
                      {setting.new && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          New
                        </span>
                      )}
                    </div>
                    <div className={`${setting.clickable ? 'text-blue-400' : 'text-gray-400'}`}>›</div>
                  </button>
                </ClickTracker>
              ))}
              
            </div>
          </div>
        </ViewTracker>

        {/* Enhanced Instagram Data Status */}
        {localInstagramData && (
          <ViewTracker
            featureName="instagram_data_status"
            metadata={{
              followers: localInstagramData.followers,
              posts_count: localInstagramData.mediaCount,
              has_insights: !!localInstagramData.accountInsights
            }}
          >
            <div className="bg-green-50 rounded-lg p-4 shadow-sm border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                <span className="mr-2">✅</span>
                Instagram Data Connected
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-700">Followers: {localInstagramData.followers.toLocaleString()}</p>
                <p className="text-green-700">Posts: {localInstagramData.mediaCount}</p>
                <p className="text-green-700">Engagement Rate: {localInstagramData.engagementRate}</p>
                {localInstagramData.avgReach && (
                  <p className="text-green-700">Avg Reach: {localInstagramData.avgReach.toLocaleString()}</p>
                )}
                {localInstagramData.accountInsights && (
                  <>
                    <p className="text-green-700">Profile Visits (30d): {localInstagramData.accountInsights.profile_visits.toLocaleString()}</p>
                    <p className="text-green-700">Total Reach (30d): {(localInstagramData.accountInsights.reach / 1000).toFixed(1)}K</p>
                  </>
                )}
                {localInstagramData.topFollowers && localInstagramData.topFollowers.length > 0 && (
                  <p className="text-green-700">Top Followers: {localInstagramData.topFollowers.length} active commenters found</p>
                )}
                <p className="text-xs text-green-600 mt-2">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </ViewTracker>
        )}

        {dataError && (
          <ViewTracker
            featureName="instagram_data_error"
            metadata={{ error_message: dataError }}
          >
            <div className="bg-red-50 rounded-lg p-4 shadow-sm border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                Data Connection Issue
              </h3>
              <p className="text-red-700 text-sm">{dataError}</p>
            </div>
          </ViewTracker>
        )}
      </div>
      {showAbout && <AboutModal />}
      {showHelpSupport && <HelpSupportModal />}
    </div>
  );
};

export default ProfileView;