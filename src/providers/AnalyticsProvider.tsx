// src/providers/AnalyticsProvider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { analytics } from '@/services/analytics/mixpanel';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  // Initialize Mixpanel
  useEffect(() => {
    analytics.init();
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      analytics.trackPageView(pathname);
    }
  }, [pathname]);

  // Identify user when they log in
  useEffect(() => {
    if (user) {
      analytics.identify(user.id, {
        email: user.email,
        created_at: user.created_at,
        name: user.user_metadata?.name,
      });
    } else {
      analytics.reset();
    }
  }, [user]);

  return <>{children}</>;
}