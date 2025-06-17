// src/app/login/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  // If already logged in, show loading while redirecting
  if (user) {
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Already logged in, redirecting...</p>
        </div>
      </div>
    )
  }

  // Your existing login form here
  return (
    <div>
      {/* Your login form */}
    </div>
  )
}