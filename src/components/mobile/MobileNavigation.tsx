import React from 'react';
import { Home, BarChart3, Bell, User, TrendingUp, LucideIcon } from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';

interface NavigationTab {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userId?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  onTabChange,
  userId
}) => {
  const tabs: NavigationTab[] = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'posts', icon: BarChart3, label: 'Posts' },
    { id: 'insights', icon: TrendingUp, label: 'AI Insights' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    
    // Track tab navigation
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'mobile_tab_navigation',
      tab_name: tabId,
      source: 'mobile_dashboard',
      user_id: userId,
    });
  };

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center safe-area-pb">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all mobile-touch-target ${
            activeTab === tab.id
              ? 'text-blue-600 bg-blue-50 tab-active'
              : 'text-gray-500 hover:text-gray-700 tab-inactive'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileNavigation;