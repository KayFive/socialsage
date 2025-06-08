// src/app/LayoutClient.tsx
'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AnalyticsProvider } from '@/providers/AnalyticsProvider';

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        {children}
      </AnalyticsProvider>
    </AuthProvider>
  );
}