// src/lib/analytics.ts
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

class AnalyticsService {
  private mixpanel: any = null
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  private sessionId: string = ''
  private sessionStart: Date = new Date()
  private pagesVisited: number = 0
  private actionsCount: number = 0

  constructor() {
    this.initializeMixpanel()
    this.initializeSession()
  }

  private async initializeMixpanel() {
    if (typeof window !== 'undefined') {
      try {
        const mixpanel = await import('mixpanel-browser')
        if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
          mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
            debug: process.env.NODE_ENV === 'development',
            track_pageview: false, // We'll handle this manually
            persistence: 'localStorage'
          })
          this.mixpanel = mixpanel
        }
      } catch (error) {
        console.warn('Mixpanel failed to initialize:', error)
      }
    }
  }

  private initializeSession() {
    if (typeof window !== 'undefined') {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.sessionStart = new Date()
      this.pagesVisited = 0
      this.actionsCount = 0

      // Track page visibility for session duration
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.endSession()
        }
      })

      // Track session end on beforeunload
      window.addEventListener('beforeunload', () => {
        this.endSession()
      })
    }
  }

  // USER TRACKING
  async identifyUser(userProperties: UserProperties) {
    const { userId, ...properties } = userProperties

    // Mixpanel identification
    if (this.mixpanel) {
      this.mixpanel.identify(userId)
      this.mixpanel.people.set(properties)
    }

    // Store in Supabase (only if we have service role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('user_analytics').upsert({
          user_id: userId,
          ...this.getLocationData(),
          ...this.getDeviceData(),
          ...properties
        })
      } catch (error) {
        console.error('Failed to store user analytics:', error)
      }
    }
  }

  async trackSignup(userId: string, signupData: {
    source?: string
    referralUrl?: string
    utmParams?: Record<string, string>
  }) {
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
      ...this.getLocationData(),
      ...this.getDeviceData()
    }

    // Track in Mixpanel
    this.track('User Signup', {
      source: signupData.source,
      referral_url: signupData.referralUrl,
      ...signupData.utmParams
    }, userId)

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('user_analytics').insert(eventData)
        
        // Initialize retention tracking
        await this.supabase.from('user_retention_snapshots').insert({
          user_id: userId,
          signup_date: new Date().toISOString().split('T')[0]
        })
      } catch (error) {
        console.error('Failed to track signup:', error)
      }
    }
  }

  // SESSION TRACKING
  async startSession(userId?: string) {
    this.sessionStart = new Date()
    this.pagesVisited = 0
    this.actionsCount = 0

    const sessionData = {
      user_id: userId,
      session_id: this.sessionId,
      session_start: this.sessionStart.toISOString(),
      ...this.getLocationData(),
      ...this.getDeviceData()
    }

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('user_sessions').insert(sessionData)
      } catch (error) {
        console.error('Failed to start session:', error)
      }
    }

    // Track in Mixpanel
    this.track('Session Start', {
      session_id: this.sessionId
    }, userId)
  }

  async endSession() {
    const sessionEnd = new Date()
    const duration = Math.round((sessionEnd.getTime() - this.sessionStart.getTime()) / 1000)

    // Update Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase
          .from('user_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_seconds: duration,
            pages_visited: this.pagesVisited,
            actions_taken: this.actionsCount
          })
          .eq('session_id', this.sessionId)
      } catch (error) {
        console.error('Failed to end session:', error)
      }
    }

    // Track in Mixpanel
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

    const eventData = {
      user_id: userId,
      session_id: this.sessionId,
      feature_name: featureName,
      action_type: actionType,
      page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      metadata: metadata || {}
    }

    // Track in Mixpanel
    this.track(`Feature ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`, {
      feature_name: featureName,
      action_type: actionType,
      ...metadata
    }, userId)

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('feature_usage').insert(eventData)
      } catch (error) {
        console.error('Failed to track feature usage:', error)
      }
    }
  }

  // PAGE VIEW TRACKING
  async trackPageView(pagePath: string, pageTitle?: string, userId?: string) {
    this.pagesVisited++

    // Track in Mixpanel
    this.track('Page View', {
      page_path: pagePath,
      page_title: pageTitle,
      session_id: this.sessionId
    }, userId)

    // Update feature usage for page views
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
    const eventData = {
      user_id: userId,
      funnel_name: funnelName,
      step_name: stepName,
      step_order: stepOrder,
      completed_at: completed ? new Date().toISOString() : null,
      dropped_off_at: !completed ? new Date().toISOString() : null,
      metadata: metadata || {}
    }

    // Track in Mixpanel
    this.track(`Funnel ${completed ? 'Step Completed' : 'Step Dropped'}`, {
      funnel_name: funnelName,
      step_name: stepName,
      step_order: stepOrder,
      ...metadata
    }, userId)

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('conversion_funnels').insert(eventData)
      } catch (error) {
        console.error('Failed to track funnel step:', error)
      }
    }
  }

  // ENGAGEMENT EVENTS
  async trackEngagement(
    eventType: string,
    userId?: string,
    properties?: Record<string, any>
  ) {
    const eventData = {
      user_id: userId,
      event_type: eventType,
      event_properties: properties || {}
    }

    // Track in Mixpanel
    this.track(eventType, properties, userId)

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('engagement_events').insert(eventData)
      } catch (error) {
        console.error('Failed to track engagement:', error)
      }
    }

    // Update retention data for key events
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
    const eventData = {
      user_id: userId,
      feedback_type: feedbackType,
      score,
      feedback_text: feedbackText,
      feature_context: featureContext,
      metadata: metadata || {}
    }

    // Track in Mixpanel
    this.track('User Feedback', {
      feedback_type: feedbackType,
      score,
      feature_context: featureContext,
      ...metadata
    }, userId)

    // Store in Supabase
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await this.supabase.from('user_feedback').insert(eventData)
      } catch (error) {
        console.error('Failed to track feedback:', error)
      }
    }
  }

  // GENERIC EVENT TRACKING
  track(event: string, properties?: Record<string, any>, userId?: string) {
    if (this.mixpanel) {
      const eventProperties = {
        ...properties,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
        ...this.getDeviceData()
      }

      this.mixpanel.track(event, eventProperties)
    }
  }

  // UTILITY METHODS
  private getLocationData() {
    // You can integrate with a service like IPGeolocation or MaxMind
    // For now, return empty object
    return {
      country: null,
      state: null,
      city: null,
      ip_address: null
    }
  }

  private getDeviceData() {
    if (typeof window === 'undefined') return {}

    const userAgent = navigator.userAgent
    return {
      user_agent: userAgent,
      device_type: this.getDeviceType(userAgent),
      browser: this.getBrowser(userAgent),
      os: this.getOS(userAgent)
    }
  }

  private getDeviceType(userAgent: string): string {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile'
    return 'desktop'
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOS(userAgent: string): string {
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
    
    const today = new Date().toISOString().split('T')[0]
    
    try {
      // Get user's signup date
      const { data: userAnalytics } = await this.supabase
        .from('user_analytics')
        .select('signup_timestamp')
        .eq('user_id', userId)
        .single()

      if (!userAnalytics) return

      const signupDate = new Date(userAnalytics.signup_timestamp)
      const daysSinceSignup = Math.floor((new Date().getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const updateData: any = {
        last_active_date: today
      }

      if (daysSinceSignup === 1) updateData.day_1_active = true
      if (daysSinceSignup === 7) updateData.day_7_active = true
      if (daysSinceSignup === 30) updateData.day_30_active = true

      await this.supabase
        .from('user_retention_snapshots')
        .update(updateData)
        .eq('user_id', userId)
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
}

// Export singleton instance
export const analytics = new AnalyticsService()