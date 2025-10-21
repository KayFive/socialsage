// src/lib/analytics.ts - EXACTLY MATCHED to your Supabase schema

import { createClient } from '@supabase/supabase-js'

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  userId?: string
  timestamp?: Date
}

interface UserProperties {
  userId: string
  email?: string
  signupDate?: Date
  plan?: string
  instagramConnected?: boolean
  country?: string
  city?: string
  deviceType?: string
  [key: string]: any
}

export const ONBOARDING_EVENTS = {
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_SKIPPED: 'Onboarding Skipped',
  ONBOARDING_MANUALLY_RESTARTED: 'Onboarding Manually Restarted',
  ONBOARDING_FEATURE_COMPLETED: 'Onboarding Feature Completed'
};

class AnalyticsService {
  private mixpanel: any = null
  private sessionId: string = ''
  private sessionStart: Date = new Date()
  private pagesVisited: number = 0
  private actionsCount: number = 0
  private mixpanelInitialized: boolean = false

  constructor() {
    this.initializeMixpanel()
    this.initializeSession()
  }

  private async initializeMixpanel() {
    if (typeof window !== 'undefined') {
      try {
        const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
        
        if (!token) {
          console.warn('⚠️ Mixpanel token not found, analytics will use Supabase only')
          return
        }

        console.log('📥 Loading Mixpanel...')
        
        const mixpanelModule = await import('mixpanel-browser')
        const mixpanel = mixpanelModule.default || mixpanelModule
        
        if (mixpanel && typeof mixpanel.init === 'function') {
          mixpanel.init(token, {
            debug: process.env.NODE_ENV === 'development',
            track_pageview: false,
            persistence: 'localStorage'
          })
          
          this.mixpanel = mixpanel
          this.mixpanelInitialized = true
          console.log('✅ Mixpanel initialized successfully')
        } else {
          throw new Error('Mixpanel module loaded but init function not available')
        }
      } catch (error) {
        console.error('❌ Mixpanel failed to initialize:', error)
        console.log('📊 Analytics will continue with Supabase-only tracking')
      }
    }
  }

  private initializeSession() {
    if (typeof window !== 'undefined') {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.sessionStart = new Date()
      this.pagesVisited = 0
      this.actionsCount = 0

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.endSession()
        }
      })

      window.addEventListener('beforeunload', () => {
        this.endSession()
      })
    }
  }

  private async sendToAPI(type: string, data: any) {
    try {
      console.log(`📊 Sending ${type} to analytics API:`, data)
      
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to send ${type}`)
      }

      console.log(`✅ ${type} sent successfully`)
      return await response.json()
    } catch (error) {
      console.error(`❌ Failed to track ${type}:`, error)
    }
  }

  // USER TRACKING
  async identifyUser(userProperties: UserProperties) {
    const { userId, ...properties } = userProperties

    if (this.mixpanel && this.mixpanelInitialized) {
      try {
        this.mixpanel.identify(userId)
        this.mixpanel.people.set(properties)
      } catch (error) {
        console.error('❌ Mixpanel identify failed:', error)
      }
    }

    // Send data matching user_analytics schema
    await this.sendToAPI('user_identify', {
      user_id: userId,
      country: null,
      state: null,
      city: null,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
      ...properties
    })
  }

  async trackSignup(userId: string, signupData: {
    source?: string
    referralUrl?: string
    utmParams?: Record<string, string>
  }) {
    // Data matching user_analytics schema exactly
    const eventData = {
      user_id: userId,
      signup_timestamp: new Date().toISOString(),
      signup_source: signupData.source || 'direct',
      referral_url: signupData.referralUrl,
      utm_source: signupData.utmParams?.utm_source,
      utm_medium: signupData.utmParams?.utm_medium,
      utm_campaign: signupData.utmParams?.utm_campaign,
      utm_content: signupData.utmParams?.utm_content,
      utm_term: signupData.utmParams?.utm_term,
      country: null,
      state: null,
      city: null,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS()
    }

    this.track('User Signup', {
      source: signupData.source,
      referral_url: signupData.referralUrl,
      ...signupData.utmParams
    }, userId)

    await this.sendToAPI('signup', eventData)
  }

  // SESSION TRACKING
  async startSession(userId?: string) {
    this.sessionStart = new Date()
    this.pagesVisited = 0
    this.actionsCount = 0

    // Data matching user_sessions schema exactly
    const sessionData = {
      user_id: userId,
      session_id: this.sessionId,
      session_start: this.sessionStart.toISOString(),
      country: null,
      city: null,
      device_type: this.getDeviceType()
    }

    await this.sendToAPI('session_start', sessionData)

    this.track('Session Start', {
      session_id: this.sessionId
    }, userId)
  }

  async endSession() {
    const sessionEnd = new Date()
    const duration = Math.round((sessionEnd.getTime() - this.sessionStart.getTime()) / 1000)

    // Data matching user_sessions schema exactly
    const sessionData = {
      session_id: this.sessionId,
      session_end: sessionEnd.toISOString(),
      duration_seconds: duration,
      pages_visited: this.pagesVisited,
      actions_taken: this.actionsCount
    }

    await this.sendToAPI('session_end', sessionData)

    this.track('Session End', {
      session_id: this.sessionId,
      duration_seconds: duration,
      pages_visited: this.pagesVisited,
      actions_taken: this.actionsCount
    })
  }

  // FEATURE USAGE TRACKING
  async trackFeatureUsage(
    featureName: string, 
    actionType: 'view' | 'click' | 'interact' | 'complete',
    userId?: string,
    metadata?: Record<string, any>
  ) {
    this.actionsCount++

    // Data matching feature_usage schema exactly
    const eventData = {
      user_id: userId,
      session_id: this.sessionId, // ✅ This column exists in your schema
      feature_name: featureName,
      action_type: actionType,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null, // ✅ This column exists
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    }

    this.track(`Feature ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`, {
      feature_name: featureName,
      action_type: actionType,
      ...metadata
    }, userId)

    await this.sendToAPI('feature_usage', eventData)
  }

  // PAGE VIEW TRACKING
  async trackPageView(pagePath: string, pageTitle?: string, userId?: string) {
    this.pagesVisited++

    this.track('Page View', {
      page_path: pagePath,
      page_title: pageTitle,
      session_id: this.sessionId
    }, userId)

    await this.trackFeatureUsage(
      this.getFeatureNameFromPath(pagePath),
      'view',
      userId,
      { page_title: pageTitle }
    )
  }

  // CONVERSION FUNNEL TRACKING
  async trackFunnelStep(
    funnelName: string,
    stepName: string,
    stepOrder: number,
    userId?: string,
    completed: boolean = true,
    metadata?: Record<string, any>
  ) {
    // Data matching conversion_funnels schema exactly
    const eventData = {
      user_id: userId,
      funnel_name: funnelName,
      step_name: stepName,
      step_order: stepOrder,
      completed_at: completed ? new Date().toISOString() : null,
      dropped_off_at: !completed ? new Date().toISOString() : null,
      metadata: metadata || {}
    }

    this.track(`Funnel ${completed ? 'Step Completed' : 'Step Dropped'}`, {
      funnel_name: funnelName,
      step_name: stepName,
      step_order: stepOrder,
      ...metadata
    }, userId)

    await this.sendToAPI('funnel', eventData)
  }

  // ENGAGEMENT EVENTS
  async trackEngagement(
    eventType: string,
    userId?: string,
    properties?: Record<string, any>
  ) {
    // Data matching engagement_events schema exactly
    const eventData = {
      user_id: userId,
      event_type: eventType,
      event_properties: properties || {},
      timestamp: new Date().toISOString()
    }

    this.track(eventType, properties, userId)

    await this.sendToAPI('engagement', eventData)

    if (userId && ['login', 'instagram_connect', 'view_insights'].includes(eventType)) {
      await this.updateRetentionData(userId)
    }
  }

  // USER FEEDBACK TRACKING
  async trackFeedback(
    feedbackType: 'nps' | 'feature_rating' | 'bug_report' | 'suggestion',
    userId?: string,
    score?: number,
    feedbackText?: string,
    featureContext?: string,
    metadata?: Record<string, any>
  ) {
    // Data matching user_feedback schema exactly
    const eventData = {
      user_id: userId,
      feedback_type: feedbackType,
      score,
      feedback_text: feedbackText,
      feature_context: featureContext,
      metadata: metadata || {}
    }

    this.track('User Feedback', {
      feedback_type: feedbackType,
      score,
      feature_context: featureContext,
      ...metadata
    }, userId)

    await this.sendToAPI('feedback', eventData)
  }

  // GENERIC EVENT TRACKING
  track(event: string, properties?: Record<string, any>, userId?: string) {
    if (this.mixpanel && this.mixpanelInitialized) {
      try {
        const eventProperties = {
          ...properties,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
          page_path: typeof window !== 'undefined' ? window.location.pathname : '',
          device_type: this.getDeviceType(),
          browser: this.getBrowser(),
          os: this.getOS()
        }

        this.mixpanel.track(event, eventProperties)
      } catch (error) {
        console.error('❌ Mixpanel track failed:', error)
      }
    }
  }

  // UTILITY METHODS
  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'desktop'
    const userAgent = navigator.userAgent
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  private getBrowser(): string {
    if (typeof window === 'undefined') return 'Unknown'
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOS(): string {
    if (typeof window === 'undefined') return 'Unknown'
    const userAgent = navigator.userAgent
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private getFeatureNameFromPath(path: string): string {
    if (path === '/' || path === '/dashboard') return 'dashboard'
    if (path.includes('/posts')) return 'posts'
    if (path.includes('/insights')) return 'ai_insights'
    if (path.includes('/notifications')) return 'notifications'
    if (path.includes('/profile')) return 'profile'
    return 'other'
  }

  private async updateRetentionData(userId: string) {
    const today = new Date().toISOString().split('T')[0]
    
    try {
      await this.sendToAPI('retention_update', {
        user_id: userId,
        last_active_date: today
      })
    } catch (error) {
      console.error('Failed to update retention data:', error)
    }
  }

  // UTILITY METHODS FOR GETTING UTM PARAMETERS
  getUtmParams(): Record<string, string> {
    if (typeof window === 'undefined') return {}

    const urlParams = new URLSearchParams(window.location.search)
    return {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_content: urlParams.get('utm_content') || '',
      utm_term: urlParams.get('utm_term') || ''
    }
  }

  getReferrer(): string {
    if (typeof document === 'undefined') return ''
    return document.referrer
  }

  debugStatus(): void {
    console.log('🔍 Analytics Debug Information:')
    console.log('- Mixpanel token:', process.env.NEXT_PUBLIC_MIXPANEL_TOKEN ? '✅ Set' : '❌ Missing')
    console.log('- Mixpanel initialized:', this.mixpanelInitialized)
    console.log('- Session ID:', this.sessionId)
    console.log('- Pages visited:', this.pagesVisited)
    console.log('- Actions count:', this.actionsCount)
    console.log('- Environment:', process.env.NODE_ENV)
    console.log('- Using API routes: ✅ Yes (secure!)')
    console.log('- Session start:', this.sessionStart.toISOString())
    
    if (typeof window !== 'undefined' && this.mixpanel) {
      console.log('- Mixpanel functions available:', {
        track: typeof this.mixpanel.track === 'function',
        identify: typeof this.mixpanel.identify === 'function',
        people: !!this.mixpanel.people
      })
    }
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()