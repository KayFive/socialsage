'use client'

import React, { useState } from 'react';
import AICoachMain from './AICoachMain';
import ProfileView from './ProfileView';

type View = 'ai-coach' | 'profile';

interface AppRouterProps {
  user: any;
  instagramData: any;
  isLoadingData: boolean;
  dataError: string | null;
  lastRefreshTime: Date | null;
  handleManualRefresh: () => void;
  handleLogout: () => void;
  showDataManagement: boolean;
  setShowDataManagement: (show: boolean) => void;
  showEmailPreferences: boolean;
  setShowEmailPreferences: (show: boolean) => void;
}

const AppRouter: React.FC<AppRouterProps> = (props) => {
  const [currentView, setCurrentView] = useState<View>('ai-coach');

  const handleNavigateToProfile = () => {
    console.log('🧭 Navigating to Profile');
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToAICoach = () => {
    console.log('🧭 Navigating back to AI Coach');
    setCurrentView('ai-coach');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render the appropriate view
  if (currentView === 'profile') {
    return (
      <ProfileView
        user={props.user}
        instagramData={props.instagramData}
        handleLogout={props.handleLogout}
        showDataManagement={props.showDataManagement}
        setShowDataManagement={props.setShowDataManagement}
        showEmailPreferences={props.showEmailPreferences}
        setShowEmailPreferences={props.setShowEmailPreferences}
        onBackToAICoach={handleBackToAICoach}
      />
    );
  }

  return (
    <AICoachMain
      instagramData={props.instagramData}
      onNavigateToProfile={handleNavigateToProfile}
    />
  );
};

export default AppRouter;