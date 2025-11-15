// app/page.tsx - Updated UI to match AI Coach design
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { AuthService } from '@/lib/auth'
import { analytics } from '@/lib/analytics'
import SocialSageMobile from '@/components/mobile/SocialSageMobile'
import AccountDataManagement from '@/components/AccountDataManagement'
import ProgressiveLoadingState from '@/components/ProgressiveLoadingState'
import { InstagramAccount } from '@/types/instagram'
import { User } from '@supabase/supabase-js'
import { Sparkles, Lock, FileText, LogOut, Database } from 'lucide-react'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [instagramAccount, setInstagramAccount] = useState<InstagramAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Auth form states
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authSuccess, setAuthSuccess] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Data management state
  const [showDataManagement, setShowDataManagement] = useState(false)

  useEffect(() => {
    console.log('🔍 Starting auth check...')
    
    analytics.track('App Load Started', {
      timestamp: new Date().toISOString(),
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined
    })
    
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
        
        analytics.identifyUser({
          userId: session.user.id,
          email: session.user.email || undefined
        })
        analytics.track('Auth Check - User Found', {
          user_id: session.user.id,
          email: session.user.email
        }, session.user.id)
        
        loadInstagramAccount(session.user.id)
      } else {
        console.log('❌ No user, stopping loading')
        
        analytics.track('Auth Check - No User Found')
        
        setIsLoading(false)
      }
    }).catch(error => {
      console.error('❌ Session check failed:', error)
      
      analytics.track('Auth Check Failed', {
        error_message: error.message || 'Unknown error'
      })
      
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, !!session?.user)
        
        analytics.track('Auth State Changed', {
          event_type: event,
          has_user: !!session?.user,
          user_id: session?.user?.id
        }, session?.user?.id)
        
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
      
      analytics.track('Instagram Account Load Result', {
        has_account: !!account,
        username: account?.username,
        user_id: userId
      }, userId)
      
      setInstagramAccount(account)
    } catch (error) {
      console.error('❌ Error loading Instagram account:', error)
      
      analytics.track('Instagram Account Load Error', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: userId
      }, userId)
      
      setInstagramAccount(null)
    } finally {
      console.log('✅ Finished loading Instagram account')
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthSuccess('')
    setAuthLoading(true)

    if (!email || !password) {
      setAuthError('Please enter both email and password')
      setAuthLoading(false)
      return
    }

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setAuthError(passwordError);
        setAuthLoading(false);
        return;
      }
    }

    analytics.track('Auth Attempt Started', {
      auth_type: isSignUp ? 'signup' : 'signin',
      email: email
    })

    try {
      if (isSignUp) {
        console.log('📝 Starting email sign up...')
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        if (data?.user && !data.session) {
          setAuthSuccess('Please check your email and click the confirmation link to complete signup.')
          
          analytics.track('Signup - Email Confirmation Required', {
            email: email,
            user_id: data.user.id
          })
        } else {
          console.log('✅ Sign up successful')
          
          analytics.trackSignup(data.user!.id, {
            source: 'email',
            referralUrl: typeof window !== 'undefined' ? document.referrer : undefined,
            utmParams: analytics.getUtmParams()
          })

          if (data?.user) {
            try {
              await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userEmail: email,
                  userName: email.split('@')[0],
                  userId: data.user.id,
                }),
              });
              
              console.log('✅ Welcome email queued');
            } catch (emailError) {
              console.error('❌ Welcome email failed:', emailError);
            }
          }
        }
      } else {
        console.log('🔐 Starting email sign in...')
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        console.log('✅ Sign in successful')
        
        analytics.track('Signin Successful', {
          email: email
        })
      }
    } catch (error: any) {
      console.error('❌ Auth error:', error)
      setAuthError(error.message || 'Authentication failed')
      
      analytics.track('Auth Error', {
        auth_type: isSignUp ? 'signup' : 'signin',
        error_message: error.message || 'Authentication failed',
        email: email
      })
    } finally {
      setAuthLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address first');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });
      
      if (error) throw error;
      
      setAuthError('Check your email for password reset instructions');
      analytics.track('Password Reset Requested', { email });
    } catch (error: any) {
      setAuthError(error.message || 'Failed to send reset email');
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleConnectInstagram = () => {
    console.log('📸 Starting Instagram connection...')
    console.log('- Current user:', !!user, user?.id)
    
    analytics.track('Instagram Connection Started', {
      user_id: user?.id,
      user_email: user?.email
    }, user?.id)
    
    if (user?.id) {
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
      
      analytics.track('Instagram Connection Error - No User ID')
      return
    }
  }

  const handleLogout = async () => {
    console.log('🚪 Logging out...')
    
    analytics.track('Logout Started', {
      user_id: user?.id,
      had_instagram: !!instagramAccount
    }, user?.id)
    
    try {
      sessionStorage.removeItem('socialsage_user_id')
      sessionStorage.removeItem('socialsage_user_email')
      localStorage.clear()
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Logout error:', error)
        
        analytics.track('Logout Error', {
          error_message: error.message,
          user_id: user?.id
        }, user?.id)
      } else {
        console.log('✅ Logged out successfully')
        
        analytics.track('Logout Successful', {
          user_id: user?.id
        }, user?.id)
      }
      
      setUser(null)
      setInstagramAccount(null)
      setIsLoading(false)
      setEmail('')
      setPassword('')
      setAuthError('')
      setShowDataManagement(false)
      
    } catch (error) {
      console.error('❌ Error during logout:', error)
      
      analytics.track('Logout Exception', {
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_id: user?.id
      }, user?.id)
    }
  }

  const handleDataManagementAccess = () => {
    analytics.track('Data Management Accessed', {
      user_id: user?.id
    }, user?.id)
    
    setShowDataManagement(true)
  }

  // Loading state
  if (isLoading) {
    console.log('⏳ Showing loading state')
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
          </div>
          <p className="text-white/80 text-lg">Loading your account...</p>
        </div>
      </div>
    )
  }

  // Show data management if requested and user is signed in
  if (showDataManagement && user) {
    return <AccountDataManagement onBack={() => setShowDataManagement(false)} />
  }

  // Not signed in - Show login/signup form
  if (!user) {
    console.log('🔐 Showing login page - no user')
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-white mb-2">
              Social<span className="italic">Sage</span>
            </h1>
            <p className="text-white/70 text-lg">Your Instagram analytics companion</p>
          </div>
          
          <div className="w-full max-w-md">
            {/* Auth Toggle */}
            <div className="bg-white/10 backdrop-blur-md rounded-full p-1 flex mb-6 border border-white/20">
              <button
                onClick={() => {
                  setIsSignUp(false); 
                  setAuthError('');
                  analytics.track('Auth Mode Switch', { mode: 'signin' });
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${
                  !isSignUp 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-white hover:text-white/80'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsSignUp(true); 
                  setAuthError('');
                  analytics.track('Auth Mode Switch', { mode: 'signup' });
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-full transition-all ${
                  isSignUp 
                    ? 'bg-white text-purple-900 shadow-lg' 
                    : 'text-white hover:text-white/80'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 transition-all"
                  required
                />
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="Password (8+ chars, uppercase, lowercase, number)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 text-white placeholder-white/50 transition-all"
                  minLength={8}
                  required
                />
              </div>

              {/* Forgot Password Link */}
              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-white/80 hover:text-white underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              {/* Error/Success Messages */}
              {authError && (
                <div className="bg-red-500/20 border border-red-400/30 backdrop-blur-sm text-red-200 text-sm text-center p-3 rounded-xl">
                  {authError}
                </div>
              )}

              {authSuccess && (
                <div className="bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm text-blue-200 text-sm text-center p-3 rounded-xl">
                  {authSuccess}
                </div>
              )}

              {/* Submit Button */}
              {authLoading ? (
                <div className="w-full bg-white/20 backdrop-blur-md rounded-2xl py-4 flex items-center justify-center border border-white/30">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                  <span className="text-white font-semibold">
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl py-4 font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              )}
            </form>

            {/* Footer Links */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-xs text-white/60 leading-relaxed">
                By {isSignUp ? 'creating an account' : 'signing in'}, you agree to our{' '}
                <a 
                  href="/privacy" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white underline font-medium transition-colors"
                >
                  Privacy Policy
                </a>
                {' '}and{' '}
                <a 
                  href="/terms" 
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-white/90 hover:text-white underline font-medium transition-colors"
                >
                  Terms of Service
                </a>
              </p>

              <p className="text-xs text-white/50">
                {isSignUp 
                  ? 'Create an account to connect your Instagram and start tracking your performance'
                  : 'Sign in to connect your Instagram account and start tracking your performance'
                }
              </p>

              {/* Data Deletion Link */}
              <div className="pt-4 border-t border-white/20 mt-4">
                <p className="text-xs text-white/60 mb-2">
                  Need to delete your data?
                </p>
                <a 
                  href="/data-deletion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white/90 hover:text-white underline text-xs font-medium transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  View Data Deletion Instructions
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
        <div className="flex flex-col items-center justify-center min-h-screen p-6">
          {/* Header with Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleDataManagementAccess}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Manage Data
            </button>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          
          {/* Main Content */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-white text-4xl">📸</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Connect Instagram</h1>
            <p className="text-white/80 text-lg mb-4">Connect your Instagram account to start analyzing your performance</p>
            <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-400/30 backdrop-blur-sm text-green-200 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Signed in as: {user.email}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8 w-full max-w-md">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Instagram Data Usage
            </h3>
            <p className="text-white/80 text-sm mb-4 leading-relaxed">
              When you connect Instagram, we'll access your profile data, posts, comments, 
              and analytics to provide personalized insights. We never share your data 
              with third parties.
            </p>
            <a 
              href="/privacy" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-white hover:text-white/80 underline text-sm font-medium transition-colors gap-1"
            >
              <FileText className="w-4 h-4" />
              Read our full Privacy Policy
            </a>
          </div>
          
          {/* Connect Button */}
          <div className="w-full max-w-md space-y-4">
            <button
              onClick={handleConnectInstagram}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-2xl py-5 font-semibold text-lg shadow-2xl hover:shadow-pink-500/50 transition-all transform hover:scale-[1.02]"
            >
              Connect Instagram Account
            </button>
            <p className="text-xs text-white/60 text-center leading-relaxed">
              We'll redirect you to Instagram to authorize SocialSage. Your data is protected per our{' '}
              <a 
                href="/privacy" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/90 hover:text-white underline font-medium transition-colors"
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

  analytics.track('App Fully Loaded', {
    user_id: user.id,
    instagram_username: instagramAccount.username,
    load_time: Date.now()
  }, user.id)

  return <SocialSageMobile />
}