// src/components/ProgressiveLoadingState.tsx - Enhanced with analytics tracking

import React, { useEffect, useState } from 'react';
import { AuthService } from '@/lib/auth';
import { analytics } from '@/lib/analytics';

interface ProgressiveLoadingStateProps {
  isLoading: boolean;
  loadingMessage?: string;
  className?: string;
  children?: React.ReactNode;
  userId?: string; // Optional: pass user ID for better tracking
  loadingContext?: string; // Optional: what's being loaded (e.g., 'dashboard', 'instagram_auth')
}

export const ProgressiveLoadingState: React.FC<ProgressiveLoadingStateProps> = ({
  isLoading,
  loadingMessage = 'Loading...',
  className = '',
  children,
  userId,
  loadingContext = 'general'
}) => {
  const [duration, setDuration] = useState(0);
  const [showHelpText, setShowHelpText] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [analyticsTracked, setAnalyticsTracked] = useState({
    loadingStarted: false,
    slowLoading: false,
    verySlowLoading: false,
    recoveryShown: false
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLoading) {
      setDuration(0);
      setShowHelpText(false);
      setShowRecovery(false);
      setAnalyticsTracked({
        loadingStarted: false,
        slowLoading: false,
        verySlowLoading: false,
        recoveryShown: false
      });
      
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          
          // Track loading started (only once)
          if (newDuration === 1 && !analyticsTracked.loadingStarted) {
            analytics.track('Loading Started', {
              loading_context: loadingContext,
              loading_message: loadingMessage
            }, userId);
            setAnalyticsTracked(prev => ({ ...prev, loadingStarted: true }));
          }
          
          // Track slow loading (15 seconds)
          if (newDuration === 15) {
            setShowHelpText(true);
            if (!analyticsTracked.slowLoading) {
              analytics.track('Slow Loading Detected', {
                loading_context: loadingContext,
                duration_seconds: 15,
                loading_message: loadingMessage
              }, userId);
              setAnalyticsTracked(prev => ({ ...prev, slowLoading: true }));
            }
          }
          
          // Track very slow loading and show recovery (30 seconds)
          if (newDuration === 30) {
            setShowRecovery(true);
            if (!analyticsTracked.verySlowLoading) {
              analytics.track('Very Slow Loading - Recovery Options Shown', {
                loading_context: loadingContext,
                duration_seconds: 30,
                loading_message: loadingMessage
              }, userId);
              setAnalyticsTracked(prev => ({ ...prev, verySlowLoading: true, recoveryShown: true }));
            }
          }
          
          return newDuration;
        });
      }, 1000);
    } else {
      // Track successful loading completion
      if (duration > 0) {
        analytics.track('Loading Completed', {
          loading_context: loadingContext,
          duration_seconds: duration,
          loading_message: loadingMessage,
          required_recovery: showRecovery
        }, userId);
      }
      
      setDuration(0);
      setShowHelpText(false);
      setShowRecovery(false);
      setAnalyticsTracked({
        loadingStarted: false,
        slowLoading: false,
        verySlowLoading: false,
        recoveryShown: false
      });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, loadingContext, loadingMessage, userId, duration, showRecovery, analyticsTracked]);

  const handleQuickRefresh = () => {
    console.log('🔄 User clicked refresh');
    
    // Track recovery action
    analytics.track('Loading Recovery - Quick Refresh', {
      loading_context: loadingContext,
      duration_before_refresh: duration,
      loading_message: loadingMessage
    }, userId);
    
    window.location.reload();
  };

  const handleClearAndRefresh = () => {
    console.log('🧹 User clicked clear and refresh');
    
    // Track recovery action  
    analytics.track('Loading Recovery - Clear State and Refresh', {
      loading_context: loadingContext,
      duration_before_reset: duration,
      loading_message: loadingMessage
    }, userId);
    
    AuthService.clearAuthState();
    window.location.reload();
  };

  if (!isLoading) return null;

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Your existing loading UI or default spinner */}
      {children || (
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">{loadingMessage}</span>
        </div>
      )}
      
      {/* Duration counter (subtle, appears after 8 seconds) */}
      {duration > 8 && (
        <div className="text-xs text-gray-400">
          {duration}s
        </div>
      )}
      
      {/* Helpful text (appears after 15 seconds) */}
      {showHelpText && !showRecovery && (
        <div className="text-sm text-gray-500 text-center max-w-sm">
          This is taking longer than usual. Please wait a moment...
        </div>
      )}
      
      {/* Recovery options (appears after 30 seconds) */}
      {showRecovery && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-sm">
          <div className="text-sm text-amber-800 text-center mb-3">
            Still loading? Try refreshing the page.
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleQuickRefresh}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleClearAndRefresh}
              className="flex-1 px-3 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
            >
              Reset & Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressiveLoadingState;