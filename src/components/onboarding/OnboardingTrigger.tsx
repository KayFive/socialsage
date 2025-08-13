// components/onboarding/OnboardingTrigger.tsx
'use client'

import React from 'react';
import { HelpCircle, RotateCcw } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingTriggerProps {
  userId?: string;
  analytics?: {
    track: (event: string, properties?: any) => void;
  };
}

const OnboardingTrigger: React.FC<OnboardingTriggerProps> = ({ 
  userId, 
  analytics 
}) => {
  const { hasCompletedOnboarding, resetOnboarding } = useOnboarding(userId);

  const handleRestartOnboarding = () => {
    analytics?.track('Onboarding Manually Restarted', {
      user_id: userId,
      restart_method: 'profile_settings'
    });
    
    resetOnboarding();
  };

  if (!hasCompletedOnboarding) {
    return null; // Don't show if they haven't completed it yet
  }

  return (
    <button
      onClick={handleRestartOnboarding}
      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm p-2 rounded-lg hover:bg-blue-50 transition-colors"
    >
      <RotateCcw className="w-4 h-4" />
      <span>Restart App Tour</span>
    </button>
  );
};

export default OnboardingTrigger;