// src/app/login/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
      }
      router.push('/')
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden h-screen flex flex-col">
      {/* Mobile Status Bar */}
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <span className="font-semibold">SocialSage</span>
        <span>100%</span>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center p-6 bg-gradient-to-b from-blue-50 to-purple-50">
        
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">SS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">SocialSage</h1>
          <p className="text-gray-600 text-sm">AI-Powered Social Media Analytics</p>
        </div>

        {/* Login/Signup Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all ${
              isLogin
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all ${
              !isLogin
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Privacy Policy & Terms Links - REQUIRED FOR META COMPLIANCE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <div className="text-blue-600 mt-0.5">🔒</div>
            <div>
              <h3 className="text-blue-900 font-semibold text-sm mb-1">Privacy & Data Protection</h3>
              <p className="text-blue-800 text-xs mb-2">
                We protect your data and respect your privacy. Learn how we collect, use, and safeguard your information.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
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
        </div>

        {/* Additional Privacy Information for Meta Compliance */}
        {!isLogin && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-green-600 mt-0.5">📱</div>
              <div>
                <h4 className="text-green-900 font-medium text-xs mb-1">Instagram Integration</h4>
                <p className="text-green-800 text-xs">
                  After signup, you can connect your Instagram account to access analytics. 
                  We only access data you explicitly authorize through Instagram's secure process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex justify-center space-x-4 text-xs">
            <a 
              href="/privacy" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Terms of Service
            </a>
            <a 
              href="mailto:support@socialsage.app"
              className="text-gray-500 hover:text-gray-700 underline"
            >
              Support
            </a>
          </div>
          
          <p className="text-xs text-gray-500">
            © 2025 SocialSage. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}