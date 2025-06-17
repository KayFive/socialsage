'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const logout = async () => {
      console.log('🚪 Logging out user...')
      
      try {
        // Create modern Supabase client
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('❌ Logout error:', error)
        } else {
          console.log('✅ Successfully logged out')
        }
        
        // Clear any local storage or session data
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
        }
        
        // Redirect to home page
        router.push('/')
        router.refresh() // Force a full page refresh
        
      } catch (error) {
        console.error('❌ Logout failed:', error)
        // Still redirect even if logout fails
        router.push('/')
      }
    }
    
    logout()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md mx-4">
        <div className="mb-6">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Logging out...</h1>
          <p className="text-gray-600">Please wait while we sign you out securely.</p>
        </div>
        
        <div className="text-sm text-gray-500">
          You'll be redirected to the login page in a moment.
        </div>
      </div>
    </div>
  )
}