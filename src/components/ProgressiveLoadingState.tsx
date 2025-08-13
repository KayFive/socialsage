// ✅ FIXED: src/components/ProgressiveLoadingState.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AuthService } from '@/lib/auth';
import { analytics } from '@/lib/analytics';

interface ProgressiveLoadingStateProps {
  isLoading: boolean;
  loadingMessage?: string;
  className?: string;
  children?: React.ReactNode;
  userId?: string;
  loadingContext?: string;
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
  
  // ✅ FIX 1: Use useRef for values that don't need to trigger re-renders
  const analyticsTrackedRef = useRef({
    loadingStarted: false,
    slowLoading: false,
    verySlowLoading: false,
    recoveryShown: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FIX 2: Stable analytics tracking functions
  const trackLoadingStart = useCallback(() => {
    if (analyticsTrackedRef.current.loadingStarted) return;
    
    analytics.track('Loading Started', {
      loading_context: loadingContext,
      loading_message: loadingMessage
    }, userId);
    
    analyticsTrackedRef.current.loadingStarted = true;
  }, [loadingContext, loadingMessage, userId]);

  const trackSlowLoading = useCallback(() => {
    if (analyticsTrackedRef.current.slowLoading) return;
    
    analytics.track('Slow Loading Detected', {
      loading_context: loadingContext,
      duration_seconds: 15,
      loading_message: loadingMessage
    }, userId);
    
    analyticsTrackedRef.current.slowLoading = true;
  }, [loadingContext, loadingMessage, userId]);

  const trackVerySlowLoading = useCallback(() => {
    if (analyticsTrackedRef.current.verySlowLoading) return;
    
    analytics.track('Very Slow Loading - Recovery Options Shown', {
      loading_context: loadingContext,
      duration_seconds: 30,
      loading_message: loadingMessage
    }, userId);
    
    analyticsTrackedRef.current.verySlowLoading = true;
    analyticsTrackedRef.current.recoveryShown = true;
  }, [loadingContext, loadingMessage, userId]);

  const trackLoadingComplete = useCallback((finalDuration: number, recoveryUsed: boolean) => {
    analytics.track('Loading Completed', {
      loading_context: loadingContext,
      duration_seconds: finalDuration,
      loading_message: loadingMessage,
      required_recovery: recoveryUsed
    }, userId);
  }, [loadingContext, loadingMessage, userId]);

  // ✅ FIX 3: Single effect that only depends on isLoading
  useEffect(() => {
    if (!isLoading) {
      // Clean up when not loading
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Track completion if we had been loading
      if (duration > 0) {
        trackLoadingComplete(duration, showRecovery);
      }
      
      // Reset states
      setDuration(0);
      setShowHelpText(false);
      setShowRecovery(false);
      analyticsTrackedRef.current = {
        loadingStarted: false,
        slowLoading: false,
        verySlowLoading: false,
        recoveryShown: false
      };
      
      return;
    }

    // Start loading sequence
    setDuration(0);
    setShowHelpText(false);
    setShowRecovery(false);
    analyticsTrackedRef.current = {
      loadingStarted: false,
      slowLoading: false,
      verySlowLoading: false,
      recoveryShown: false
    };

    let currentDuration = 0;
    
    intervalRef.current = setInterval(() => {
      currentDuration += 1;
      setDuration(currentDuration);
      
      // Track loading milestones
      if (currentDuration === 1) {
        trackLoadingStart();
      }
      
      if (currentDuration === 15) {
        setShowHelpText(true);
        trackSlowLoading();
      }
      
      if (currentDuration === 30) {
        setShowRecovery(true);
        trackVerySlowLoading();
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoading, trackLoadingStart, trackSlowLoading, trackVerySlowLoading, trackLoadingComplete]); 
  // ✅ Only stable dependencies that don't change on every render

  const handleQuickRefresh = useCallback(() => {
    console.log('🔄 User clicked refresh');
    
    analytics.track('Loading Recovery - Quick Refresh', {
      loading_context: loadingContext,
      duration_before_refresh: duration,
      loading_message: loadingMessage
    }, userId);
    
    window.location.reload();
  }, [loadingContext, duration, loadingMessage, userId]);

  const handleClearAndRefresh = useCallback(() => {
    console.log('🧹 User clicked clear and refresh');
    
    analytics.track('Loading Recovery - Clear State and Refresh', {
      loading_context: loadingContext,
      duration_before_reset: duration,
      loading_message: loadingMessage
    }, userId);
    
    AuthService.clearAuthState();
    window.location.reload();
  }, [loadingContext, duration, loadingMessage, userId]);

  if (!isLoading) return null;

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Loading UI */}
      {children || (
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">{loadingMessage}</span>
        </div>
      )}
      
      {/* Duration counter (appears after 8 seconds) */}
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