'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { AuthService } from '@/lib/auth'

// Loading component
function LoadingSpinner() {
  return (
    <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <span className="font-semibold">SocialSage</span>
        <span>100%</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Loading...</h2>
        <p className="text-gray-600 text-center">Please wait...</p>
      </div>
    </div>
  )
}

// Main callback component that uses useSearchParams
function InstagramCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  // Create modern Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        console.log('📱 Instagram callback started')
        console.log('- Code exists:', !!code)
        console.log('- Error:', error)
        console.log('- State:', state)

        if (error) {
          throw new Error(`Instagram authorization failed: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        // FIRST: Try to extract user ID from state parameter
        let userId = null
        if (state && state.includes('_USER_')) {
          const userIdFromState = state.split('_USER_')[1]
          if (userIdFromState && userIdFromState !== 'unknown') {
            console.log('✅ Found user ID in state parameter:', userIdFromState)
            userId = userIdFromState
          }
        }
        
        // SECOND: Try to get user from current session
        if (!userId) {
          console.log('🔍 Checking current Supabase session...')
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError)
          }
          
          if (session?.user) {
            console.log('✅ Found user in current session:', session.user.id)
            userId = session.user.id
          }
        }
        
        // THIRD: Try to get user directly (in case session method failed)
        if (!userId) {
          console.log('🔍 Trying getUser() method...')
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError) {
            console.error('❌ User error:', userError)
          }
          
          if (user) {
            console.log('✅ Found user via getUser():', user.id)
            userId = user.id
          }
        }
        
        // FOURTH: Try sessionStorage
        if (!userId) {
          console.log('🔍 Checking sessionStorage...')
          const storedUserId = sessionStorage.getItem('socialsage_user_id')
          
          if (storedUserId) {
            console.log('✅ Found user ID in sessionStorage:', storedUserId)
            userId = storedUserId
          }
        }
        
        // FIFTH: Try localStorage backup
        if (!userId) {
          console.log('🔍 Checking localStorage backup...')
          const backupUserId = localStorage.getItem('socialsage_user_id_backup')
          if (backupUserId) {
            console.log('✅ Found user ID in localStorage backup:', backupUserId)
            userId = backupUserId
          }
        }

        if (!userId) {
          console.error('❌ No user ID found anywhere')
          console.log('🔄 Attempting to recover user session...')
          
          // Wait a moment for session to potentially load
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Try session again with both methods
          const { data: { session: retrySession } } = await supabase.auth.getSession()
          const { data: { user: retryUser } } = await supabase.auth.getUser()
          
          if (retrySession?.user) {
            console.log('✅ Recovered user session:', retrySession.user.id)
            userId = retrySession.user.id
          } else if (retryUser) {
            console.log('✅ Recovered user via getUser:', retryUser.id)
            userId = retryUser.id
          } else {
            // If still no user, redirect to login with error
            console.log('🔄 Redirecting to login with error...')
            router.push('/?error=session_lost&message=Please log in again to connect Instagram')
            return
          }
        }

        console.log('✅ Found user ID, proceeding with token exchange...')
        
        // Exchange code for token
        const tokenData = await AuthService.exchangeCodeForToken(code)
        console.log('📊 Token exchange successful:', !!tokenData.access_token)

        // Save Instagram account using the user ID
        console.log('💾 Saving Instagram account for user:', userId)
        await AuthService.saveInstagramAccount(userId, tokenData)
        console.log('✅ Instagram account saved successfully')

        // Clean up sessionStorage
        sessionStorage.removeItem('socialsage_user_id')
        sessionStorage.removeItem('socialsage_user_email')
        console.log('🧹 Cleaned up sessionStorage')

        setStatus('success')
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          console.log('🏠 Redirecting to home page')
          // Force a refresh to ensure the new Instagram connection is detected
          window.location.href = '/'
        }, 2000)

      } catch (err) {
        console.error('❌ Instagram callback error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        setStatus('error')
        
        // Clean up sessionStorage on error too
        sessionStorage.removeItem('socialsage_user_id')
        sessionStorage.removeItem('socialsage_user_email')
      }
    }

    handleCallback()
  }, [searchParams, router, supabase])

  if (status === 'loading') {
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connecting Instagram</h2>
          <p className="text-gray-600 text-center">Please wait while we set up your account...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 text-center">Instagram account connected successfully. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <span className="font-semibold">SocialSage</span>
        <span>100%</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Failed</h2>
        <p className="text-gray-600 text-center mb-4">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="bg-red-500 text-white rounded-2xl px-6 py-2 font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

// Main export component with Suspense wrapper
export default function InstagramCallback() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <InstagramCallbackContent />
    </Suspense>
  )
}