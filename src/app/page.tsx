// app/page.tsx - Updated with AccountDataManagement component
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
import SocialSageMobile from '@/components/mobile/SocialSageMobile'
import AccountDataManagement from '@/components/AccountDataManagement' // NEW IMPORT
import { InstagramAccount } from '@/types/instagram'
import { User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Auth form states
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // NEW: Data management state
  const [showDataManagement, setShowDataManagement] = useState(false)

  useEffect(() => {
    console.log('🔍 Starting auth check...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📋 Session check result:')
      console.log('- Session exists:', !!session)
      console.log('- User exists:', !!session?.user)
      console.log('- User ID:', session?.user?.id)
      console.log('- User email:', session?.user?.email)
      console.log('- Error:', error)
      
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('✅ User found, loading Instagram...')
        loadInstagramAccount(session.user.id)
      } else {
        console.log('❌ No user, stopping loading')
        setIsLoading(false)
      }
    }).catch(error => {
      console.error('❌ Session check failed:', error)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session?.user)
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadInstagramAccount(session.user.id)
        } else {
          setInstagramAccount(null)
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadInstagramAccount = async (userId: string) => {
    console.log('📱 Loading Instagram account for user:', userId)
    try {
      console.log('🔍 Calling AuthService.getActiveInstagramAccount...')
      const account = await AuthService.getActiveInstagramAccount(userId)
      console.log('📸 Instagram account result:', !!account, account?.username)
      setInstagramAccount(account)
    } catch (error) {
      console.error('❌ Error loading Instagram account:', error)
      setInstagramAccount(null)
    } finally {
      console.log('✅ Finished loading Instagram account')
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    if (!email || !password) {
      setAuthError('Please enter both email and password')
      setAuthLoading(false)
      return
    }

    try {
      if (isSignUp) {
        console.log('📝 Starting email sign up...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        if (data?.user && !data.session) {
          setAuthError('Please check your email and click the confirmation link to complete signup.')
        } else {
          console.log('✅ Sign up successful')
        }
      } else {
        console.log('🔐 Starting email sign in...')
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        console.log('✅ Sign in successful')
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error)
      setAuthError(error.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleConnectInstagram = () => {
    console.log('📸 Starting Instagram connection...')
    console.log('- Current user:', !!user, user?.id)
    
    if (user?.id) {
      // Store user ID in multiple places as backup
      sessionStorage.setItem('socialsage_user_id', user.id)
      sessionStorage.setItem('socialsage_user_email', user.email || '')
      localStorage.setItem('socialsage_user_id_backup', user.id)
      localStorage.setItem('socialsage_user_email_backup', user.email || '')
      
      console.log('💾 Stored user ID in sessionStorage:', user.id)
      console.log('💾 Stored user email in sessionStorage:', user.email)
      console.log('💾 Stored backup in localStorage')
      
      const authUrl = AuthService.getInstagramAuthUrl(user.id)
      console.log('- Instagram auth URL:', authUrl)
      window.location.href = authUrl
    } else {
      console.error('❌ No user ID to store')
      return
    }
  }

  const handleLogout = async () => {
    console.log('🚪 Logging out...')
    try {
      sessionStorage.removeItem('socialsage_user_id')
      sessionStorage.removeItem('socialsage_user_email')
      localStorage.clear()
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Logout error:', error)
      } else {
        console.log('✅ Logged out successfully')
      }
      
      setUser(null)
      setInstagramAccount(null)
      setIsLoading(false)
      setEmail('')
      setPassword('')
      setAuthError('')
      setShowDataManagement(false) // Reset data management view
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
    }
  }

  // NEW: Handle data management navigation
  const handleDataManagementAccess = () => {
    setShowDataManagement(true)
  }

  // Loading state
  if (isLoading) {
    console.log('⏳ Showing loading state')
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  // NEW: Show data management if requested and user is signed in
  if (showDataManagement && user) {
    return <AccountDataManagement onBack={() => setShowDataManagement(false)} />
  }

  // Not signed in - Show login/signup form
  if (!user) {
    console.log('🔐 Showing login page - no user')
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SocialSage</h1>
            <p className="text-gray-600">Your Instagram analytics companion</p>
          </div>
          
          <div className="w-full max-w-xs">
            {/* Toggle between Sign In / Sign Up */}
            <div className="flex mb-6">
              <button
                onClick={() => {setIsSignUp(false); setAuthError('')}}
                className={`flex-1 py-2 text-sm font-medium rounded-l-lg ${
                  !isSignUp 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {setIsSignUp(true); setAuthError('')}}
                className={`flex-1 py-2 text-sm font-medium rounded-r-lg ${
                  isSignUp 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  minLength={6}
                  required
                />
              </div>

              {authError && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-3 font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {authLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div className="text-center mt-4 space-y-2">
              <p className="text-xs text-gray-600">
                By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
                <a 
                  href="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a 
                  href="/terms" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Terms of Service
                </a>
              </p>

              <p className="text-xs text-gray-500">
                {isSignUp 
                  ? 'Create an account to connect your Instagram and start tracking your performance'
                  : 'Sign in to connect your Instagram account and start tracking your performance'
                }
              </p>

              {/* NEW: Data management link for non-users */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Need to delete your data?
                </p>
                <a 
                  href="/data-deletion"
                  className="text-blue-600 hover:text-blue-800 underline text-xs font-medium"
                >
                  📄 View Data Deletion Instructions
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Signed in but no Instagram account
  if (!instagramAccount) {
    console.log('📸 Showing Instagram connect page - user exists but no Instagram')
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {/* Header with logout and data management */}
          <div className="absolute top-4 right-4 flex space-x-2">
            {/* NEW: Data management button */}
            <button
              onClick={handleDataManagementAccess}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Manage Data
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white text-3xl">📸</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Connect Instagram</h1>
            <p className="text-gray-600 text-lg">Connect your Instagram account to start analyzing your performance</p>
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Signed in as: {user.email}
            </div>
          </div>

          {/* Privacy Notice for Meta Compliance */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 mb-8 w-full max-w-md shadow-sm">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center">
              <span className="mr-2">🔒</span>
              Instagram Data Usage
            </h3>
            <p className="text-blue-800 text-sm mb-4 leading-relaxed">
              When you connect Instagram, we'll access your profile data, posts, comments, 
              and analytics to provide personalized insights. We never share your data 
              with third parties.
            </p>
            <a 
              href="/privacy" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-700 hover:text-blue-900 underline text-sm font-medium transition-colors"
            >
              <span className="mr-1">📄</span>
              Read our full Privacy Policy
            </a>
          </div>
          
          <div className="w-full max-w-md space-y-4">
            <button
              onClick={handleConnectInstagram}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              Connect Instagram Account
            </button>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              We'll redirect you to Instagram to authorize SocialSage. Your data is protected per our{' '}
              <a 
                href="/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Signed in with Instagram account - show the main dashboard
  console.log('🎉 Showing main app - user and Instagram connected')
  return <SocialSageMobile />
}