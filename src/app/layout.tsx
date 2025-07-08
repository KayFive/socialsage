// src/app/layout.tsx
import { AuthProvider } from '@/contexts/AuthContext'
import { AnalyticsProvider } from '@/components/AnalyticsProvider'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnalyticsProvider>
            {children}
          </AnalyticsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}