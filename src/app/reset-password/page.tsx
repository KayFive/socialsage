'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { analytics } from '@/lib/analytics'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Track page visit
    analytics.track('Reset Password Page Visited')

    // Handle the auth callback
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔑 Password recovery session detected')
        analytics.track('Password Recovery Session Started', {
          user_id: session?.user?.id
        })
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in both password fields')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      console.log('✅ Password updated successfully')
      analytics.track('Password Reset Successful')
      
      setSuccess(true)
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)

    } catch (error: any) {
      console.error('❌ Password reset error:', error)
      setError(error.message || 'Failed to reset password')
      analytics.track('Password Reset Failed', {
        error_message: error.message || 'Failed to reset password'
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full min-h-screen bg-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SocialSage</h1>
            <p className="text-gray-600">Social Media Analytics Companion</p>
          </div>
          
          <div className="w-full max-w-xs bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h2>
              <p className="text-gray-600 mb-4">
                Your password has been successfully updated. You'll be redirected to the login page in a few seconds.
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-3 font-medium hover:shadow-lg transition-all"
              >
                Continue to SocialSage
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SocialSage</h1>
          <p className="text-gray-600">Social Media Analytics Companion</p>
        </div>
        
        <div className="w-full max-w-xs bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
            <p className="text-gray-600 text-sm">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
                required
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={6}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl py-3 font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}