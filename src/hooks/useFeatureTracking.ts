// src/hooks/useFeatureTracking.ts
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

export function useFeatureTracking() {
  const { user } = useAuth();
  
  const trackFeature = (featureName: string, properties?: Record<string, any>) => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: featureName,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  };
  
  const trackChartInteraction = (chartType: string, interaction: string) => {
    analytics.track(ANALYTICS_EVENTS.CHART_INTERACTED, {
      chart_type: chartType,
      interaction_type: interaction,
      user_id: user?.id,
    });
  };
  
  const trackFeedback = (type: 'bug' | 'feature' | 'general', message: string) => {
    analytics.track(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
      feedback_type: type,
      message_length: message.length,
      user_id: user?.id,
      has_message: message.length > 0,
    });
  };
  
  return {
    trackFeature,
    trackChartInteraction,
    trackFeedback,
  };
}

// Usage example in a component:
/*
import { useFeatureTracking } from '@/hooks/useFeatureTracking';

function MyComponent() {
  const { trackFeature, trackChartInteraction } = useFeatureTracking();
  
  const handleFeatureClick = () => {
    trackFeature('advanced_filters', {
      filter_type: 'date_range',
      value: '30_days'
    });
  };
  
  const handleChartHover = () => {
    trackChartInteraction('engagement_chart', 'hover');
  };
}
*/