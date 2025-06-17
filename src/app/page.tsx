'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
import SocialSageMobile from '@/components/mobile/SocialSageMobile'
import { InstagramAccount } from '@/types/instagram'
import { User } from '@supabase/supabase-js'

// Debug components
function DebugAuthService({ userId }: { userId: string }) {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDirectQuery = async () => {
    setLoading(true)
    try {
      console.log('🔍 Testing direct Supabase query...')
      
      const { data: userRecords, error: userError } = await supabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', userId)
      
      console.log('👤 User records test:', { userRecords, userError })
      
      setResults({ userRecords: userRecords || [], userError })
      
    } catch (error) {
      console.error('❌ Debug test error:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-2 bg-gray-100 rounded-lg mb-2">
      <button
        onClick={testDirectQuery}
        disabled={loading}
        className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
      >
        {loading ? 'Testing...' : 'Test DB'}
      </button>
      
      {results && (
        <pre className="text-xs bg-white p-1 rounded mt-1 max-h-20 overflow-auto">
          {JSON.stringify(results, null, 1)}
        </pre>
      )}
    </div>
  )
}

function DebugInstagramAuth() {
  const [authUrl, setAuthUrl] = useState('')
  
  const getAuthUrl = () => {
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || 'MISSING_CLIENT_ID'
    const redirectUri = `${window.location.origin}/auth/instagram/callback`
    const url = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code`
    
    console.log('🔗 Instagram Auth URL:', url)
    setAuthUrl(url)
  }
  
  return (
    <div className="p-2 bg-yellow-100 rounded-lg mb-2">
      <button
        onClick={getAuthUrl}
        className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
      >
        Get Auth URL
      </button>
      
      {authUrl && (
        <p className="text-xs break-all bg-white p-1 rounded mt-1">{authUrl}</p>
      )}
    </div>
  )
}

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
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
    }
  }

  // Loading state
  if (isLoading) {
    console.log('⏳ Showing loading state')
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  // Not signed in - Show login/signup form
  if (!user) {
    console.log('🔐 Showing login page - no user')
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
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

            <p className="text-xs text-gray-500 text-center mt-4">
              {isSignUp 
                ? 'Create an account to connect your Instagram and start tracking your performance'
                : 'Sign in to connect your Instagram account and start tracking your performance'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Signed in but no Instagram account
  if (!instagramAccount) {
    console.log('📸 Showing Instagram connect page - user exists but no Instagram')
    return (
      <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
        <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
          <span>9:41</span>
          <span className="font-semibold">SocialSage</span>
          <span>100%</span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          {/* Logout button */}
          <div className="absolute top-16 right-4">
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs"
            >
              Logout
            </button>
          </div>
          
          {/* DEBUG COMPONENTS - Remove these later */}
          <div className="w-full max-w-xs mb-6">
            <DebugAuthService userId={user.id} />
            <DebugInstagramAuth />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Instagram</h1>
            <p className="text-gray-600">Connect your Instagram account to start analyzing your performance</p>
            <p className="text-xs text-green-600 mt-2">✅ Signed in as: {user.email}</p>
          </div>
          
          <div className="w-full max-w-xs space-y-4">
            <button
              onClick={handleConnectInstagram}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-2xl py-3 font-medium hover:shadow-lg transition-all"
            >
              Connect Instagram
            </button>
            <p className="text-xs text-gray-500 text-center">
              We'll redirect you to Instagram to authorize SocialSage
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