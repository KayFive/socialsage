// src/services/analytics/tracking-utils.ts
import { analytics } from '@/services/analytics/mixpanel';

export function trackReportQuality(report: any, userId?: string) {
  const metrics = {
    high_engagement: report.summary.keyMetrics.engagement > 5,
    large_following: report.profile.followers_count > 10000,
    verified_account: report.profile.is_verified,
    business_account: report.profile.account_type === 'business',
    followers_count: report.profile.followers_count,
    engagement_rate: report.summary.keyMetrics.engagement,
    posts_count: report.profile.media_count,
    overall_score: report.summary.overallScore,
    user_id: userId,
  };
  
  analytics.track('Report Quality Analyzed', metrics);
}

export function trackUserEngagement(action: string, duration?: number, metadata?: Record<string, any>) {
  analytics.track('User Engagement', {
    action,
    duration_seconds: duration,
    time_of_day: new Date().getHours(),
    day_of_week: new Date().getDay(),
    day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
    is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6,
    ...metadata,
  });
}

export function trackAPIPerformance(endpoint: string, duration: number, success: boolean, errorMessage?: string) {
  analytics.track('API Performance', {
    endpoint,
    duration_ms: duration,
    success,
    error_message: errorMessage,
    is_slow: duration > 3000,
    timestamp: new Date().toISOString(),
  });
}

export function trackUserJourney(step: string, metadata?: Record<string, any>) {
  analytics.track('User Journey Step', {
    step,
    session_id: sessionStorage.getItem('session_id') || 'unknown',
    referrer: document.referrer,
    current_url: window.location.href,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    is_mobile: window.innerWidth < 768,
    ...metadata,
  });
}

export function trackReportInteraction(reportId: string, interaction: string, details?: Record<string, any>) {
  analytics.track('Report Interaction', {
    report_id: reportId,
    interaction_type: interaction,
    timestamp: new Date().toISOString(),
    page_depth: window.scrollY,
    time_on_page: performance.now() / 1000, // seconds since page load
    ...details,
  });
}

// Usage example:
/*
import { trackReportQuality, trackUserEngagement, trackAPIPerformance } from '@/services/analytics/tracking-utils';

// In your report component
useEffect(() => {
  if (report) {
    trackReportQuality(report, user?.id);
  }
}, [report]);

// Track API performance
const startTime = performance.now();
try {
  const response = await fetch('/api/analyze');
  const duration = performance.now() - startTime;
  trackAPIPerformance('/api/analyze', duration, true);
} catch (error) {
  const duration = performance.now() - startTime;
  trackAPIPerformance('/api/analyze', duration, false, error.message);
}

// Track user engagement
let engagementStart = Date.now();
window.addEventListener('beforeunload', () => {
  const duration = (Date.now() - engagementStart) / 1000;
  trackUserEngagement('page_session', duration);
});
*/