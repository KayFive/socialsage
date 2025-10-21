// app/analytics-test/page.tsx - Create this new file

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AnalyticsTest from '@/components/AnalyticsTest'
import { User } from '@supabase/supabase-js'

export default function AnalyticsTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setIsLoading(false)
    }

    getUser()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics Test</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to test analytics.</p>
          <a 
            href="/" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Test Dashboard</h1>
          <p className="text-gray-600">Test your analytics implementation</p>
          <p className="text-sm text-gray-500 mt-2">
            User ID: <code className="bg-gray-200 px-2 py-1 rounded">{user.id}</code>
          </p>
        </div>

        <AnalyticsTest userId={user.id} />

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  )
}