"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { analytics } from '@/lib/analytics'
import { AuthService } from '@/lib/auth'

interface AnalyticsContextType {
  userId?: string
  trackFeature: (featureName: string, action: 'view' | 'click' | 'interact' | 'complete', metadata?: Record<string, any>) => void
  trackEngagement: (eventType: string, properties?: Record<string, any>) => void
  trackFunnel: (funnelName: string, stepName: string, stepOrder: number, completed?: boolean, metadata?: Record<string, any>) => void
  trackFeedback: (type: 'nps' | 'feature_rating' | 'bug_report' | 'suggestion', score?: number, text?: string, context?: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initialize analytics tracking
    const initializeAnalytics = async () => {
      try {
        // Get current user from your auth system
        const user = await AuthService.getCurrentUser()
        
        if (user) {
          setUserId(user.id)
          
          // Identify user in analytics
          await analytics.identifyUser({
            userId: user.id,
            email: user.email,
            signupDate: new Date(user.created_at)
          })
          
          // Track login event
          analytics.trackEngagement(
            'user_login',
            user.id,
            {
              login_method: 'returning_user',
              days_since_signup: getDaysSinceSignup(user.created_at)
            }
          )
          
          // Start session tracking
          await analytics.startSession(user.id)
        } else {
          // Anonymous user - still start session without user ID
          await analytics.startSession()
        }
        
        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize analytics:', error)
        setInitialized(true) // Still mark as initialized to avoid blocking
      }
    }

    if (!initialized) {
      initializeAnalytics()
    }
  }, [initialized])

  // Track page views on route changes
  useEffect(() => {
    if (!initialized) return

    const handleRouteChange = () => {
      analytics.trackPageView(window.location.pathname, document.title, userId)
    }

    // Track initial page view
    handleRouteChange()

    // Listen for browser navigation (back/forward buttons)
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [userId, initialized])

  const trackFeature = (featureName: string, action: 'view' | 'click' | 'interact' | 'complete', metadata?: Record<string, any>) => {
    if (!initialized) return
    analytics.trackFeatureUsage(featureName, action, userId, metadata)
  }

  const trackEngagement = (eventType: string, properties?: Record<string, any>) => {
    if (!initialized) return
    analytics.trackEngagement(eventType, userId, properties)
  }

  const trackFunnel = (funnelName: string, stepName: string, stepOrder: number, completed: boolean = true, metadata?: Record<string, any>) => {
    if (!initialized) return
    analytics.trackFunnelStep(funnelName, stepName, stepOrder, userId, completed, metadata)
  }

  const trackFeedback = (type: 'nps' | 'feature_rating' | 'bug_report' | 'suggestion', score?: number, text?: string, context?: string) => {
    if (!initialized) return
    analytics.trackFeedback(type, userId, score, text, context)
  }

  return (
    <AnalyticsContext.Provider value={{
      userId,
      trackFeature,
      trackEngagement,
      trackFunnel,
      trackFeedback
    }}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Helper Components for Easy Tracking

// Click Tracker Component
interface ClickTrackerProps {
  featureName: string
  actionType?: 'click' | 'interact'
  metadata?: Record<string, any>
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function ClickTracker({ 
  featureName, 
  actionType = 'click', 
  metadata, 
  children, 
  className, 
  onClick 
}: ClickTrackerProps) {
  const { trackFeature } = useAnalytics()

  const handleClick = () => {
    trackFeature(featureName, actionType, metadata)
    onClick?.()
  }

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  )
}

// View Tracker Component (tracks when something comes into view)
interface ViewTrackerProps {
  featureName: string
  metadata?: Record<string, any>
  children: React.ReactNode
  threshold?: number // Percentage of element that needs to be visible
}

export function ViewTracker({ 
  featureName, 
  metadata, 
  children, 
  threshold = 0.5 
}: ViewTrackerProps) {
  const { trackFeature } = useAnalytics()
  const ref = React.useRef<HTMLDivElement>(null)
  const hasTracked = React.useRef(false)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= threshold && !hasTracked.current) {
          trackFeature(featureName, 'view', metadata)
          hasTracked.current = true
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [featureName, metadata, threshold, trackFeature])

  return <div ref={ref}>{children}</div>
}

// Utility function
function getDaysSinceSignup(signupDate: string): number {
  const signup = new Date(signupDate)
  const now = new Date()
  return Math.floor((now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24))
}