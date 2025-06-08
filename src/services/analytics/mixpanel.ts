// src/services/analytics/mixpanel.ts
import mixpanel from 'mixpanel-browser';

class MixpanelService {
  private initialized = false;

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    
    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) {
      console.warn('Mixpanel token not found');
      return;
    }

    mixpanel.init(token, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });

    this.initialized = true;
  }

  identify(userId: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    
    mixpanel.identify(userId);
    if (properties) {
      mixpanel.people.set(properties);
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.initialized) return;
    
    mixpanel.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  trackPageView(pageName: string, properties?: Record<string, any>) {
    this.track('Page Viewed', {
      page: pageName,
      ...properties,
    });
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;
    mixpanel.people.set(properties);
  }

  incrementUserProperty(property: string, value = 1) {
    if (!this.initialized) return;
    mixpanel.people.increment(property, value);
  }

  reset() {
    if (!this.initialized) return;
    mixpanel.reset();
  }
}

export const analytics = new MixpanelService();

// Event name constants to ensure consistency
export const ANALYTICS_EVENTS = {
  // Authentication
  USER_SIGNED_UP: 'User Signed Up',
  USER_LOGGED_IN: 'User Logged In',
  USER_LOGGED_OUT: 'User Logged Out',
  
  // Report Generation
  ANALYSIS_STARTED: 'Analysis Started',
  ANALYSIS_COMPLETED: 'Analysis Completed',
  ANALYSIS_FAILED: 'Analysis Failed',
  REPORT_VIEWED: 'Report Viewed',
  REPORT_DOWNLOADED: 'Report Downloaded',
  
  // Feature Usage
  FEATURE_USED: 'Feature Used',
  TAB_SWITCHED: 'Tab Switched',
  CHART_INTERACTED: 'Chart Interacted',
  
  // User Actions
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
  INSTAGRAM_CONNECTED: 'Instagram Connected',
  SHARE_CLICKED: 'Share Clicked',
} as const;