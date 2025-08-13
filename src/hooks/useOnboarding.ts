// hooks/useOnboarding.ts
'use client'

import { useState, useEffect } from 'react';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  shouldShowOnboarding: boolean;
  onboardingVersion: string;
  completedSteps: string[];
}

const ONBOARDING_VERSION = 'v1.0';
const STORAGE_KEY = 'socialsage_onboarding';

export const useOnboarding = (userId?: string, hasInstagramData?: boolean) => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    shouldShowOnboarding: false,
    onboardingVersion: ONBOARDING_VERSION,
    completedSteps: []
  });

  useEffect(() => {
    if (!userId) return;

    // Check if user has completed onboarding
    const storedData = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        
        // Check if they completed the current version
        const hasCompletedCurrentVersion = parsed.onboardingVersion === ONBOARDING_VERSION && parsed.hasCompletedOnboarding;
        
        setOnboardingState({
          hasCompletedOnboarding: hasCompletedCurrentVersion,
          shouldShowOnboarding: !hasCompletedCurrentVersion,
          onboardingVersion: parsed.onboardingVersion || ONBOARDING_VERSION,
          completedSteps: parsed.completedSteps || []
        });
      } catch (error) {
        console.error('Error parsing onboarding data:', error);
        // Show onboarding if we can't parse stored data
        setOnboardingState(prev => ({ 
          ...prev, 
          shouldShowOnboarding: true 
        }));
      }
    } else {
      // First time user - show onboarding
      setOnboardingState(prev => ({ 
        ...prev, 
        shouldShowOnboarding: true 
      }));
    }
  }, [userId]);

  const completeOnboarding = () => {
    if (!userId) return;

    const newState = {
      hasCompletedOnboarding: true,
      onboardingVersion: ONBOARDING_VERSION,
      completedSteps: ['welcome', 'value_prop', 'dashboard_tour', 'ai_coach', 'data_explanation', 'feature_tour'],
      completedAt: new Date().toISOString()
    };

    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newState));
    
    setOnboardingState(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      shouldShowOnboarding: false
    }));
  };

  const resetOnboarding = () => {
    if (!userId) return;
    
    localStorage.removeItem(`${STORAGE_KEY}_${userId}`);
    setOnboardingState({
      hasCompletedOnboarding: false,
      shouldShowOnboarding: true,
      onboardingVersion: ONBOARDING_VERSION,
      completedSteps: []
    });
  };

  const markStepCompleted = (stepId: string) => {
    if (!userId) return;

    const currentData = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    let updatedData: { completedSteps: string[] } = { completedSteps: [] };

    if (currentData) {
      try {
        updatedData = JSON.parse(currentData);
      } catch (error) {
        console.error('Error parsing onboarding data for step completion:', error);
      }
    }

    const newCompletedSteps = [...(updatedData.completedSteps || [])];
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
    }

    const newData = {
      ...updatedData,
      completedSteps: newCompletedSteps,
      lastStepCompletedAt: new Date().toISOString()
    };

    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(newData));
    
    setOnboardingState(prev => ({
      ...prev,
      completedSteps: newCompletedSteps
    }));
  };

  return {
    ...onboardingState,
    completeOnboarding,
    resetOnboarding,
    markStepCompleted
  };
};