// components/onboarding/OnboardingWrapper.tsx
'use client'

import React from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import UserOnboarding from './UserOnboarding';

interface OnboardingWrapperProps {
  userId?: string;
  userEmail?: string;
  instagramUsername?: string;
  hasInstagramData?: boolean;
  analytics?: {
    track: (event: string, properties?: any) => void;
  };
  children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({
  userId,
  userEmail,
  instagramUsername,
  hasInstagramData = false,
  analytics,
  children
}) => {
  const { 
    shouldShowOnboarding, 
    hasCompletedOnboarding,
    completeOnboarding 
  } = useOnboarding(userId, hasInstagramData);

  // Don't show onboarding if user is not logged in
  if (!userId) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {shouldShowOnboarding && !hasCompletedOnboarding && (
        <UserOnboarding
          onComplete={completeOnboarding}
          userEmail={userEmail}
          instagramUsername={instagramUsername}
          hasInstagramData={hasInstagramData}
          analytics={analytics}
        />
      )}
    </>
  );
};

export default OnboardingWrapper;