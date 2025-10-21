// components/AnalyticsTest.tsx
'use client'

import { useState } from 'react'
import { analytics } from '@/lib/analytics'

interface AnalyticsTestProps {
  userId?: string
}

export default function AnalyticsTest({ userId }: AnalyticsTestProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `${timestamp}: ${message}`])
  }

  const testSignup = async () => {
    setIsLoading(true)
    addLog('🚀 Testing signup tracking...')
    try {
      await analytics.trackSignup(userId || 'test-user-123', {
        source: 'test',
        referralUrl: 'https://example.com',
        utmParams: {
          utm_source: 'test',
          utm_medium: 'debug',
          utm_campaign: 'analytics-test'
        }
      })
      addLog('✅ Signup tracking successful!')
    } catch (error) {
      addLog(`❌ Signup tracking failed: ${error}`)
    }
    setIsLoading(false)
  }

  const testSession = async () => {
    setIsLoading(true)
    addLog('🚀 Testing session tracking...')
    try {
      await analytics.startSession(userId || 'test-user-123')
      addLog('✅ Session start successful')
      
      addLog('⏳ Waiting 3 seconds...')
      
      // Wait 3 seconds then end session
      setTimeout(async () => {
        await analytics.endSession()
        addLog('✅ Session end successful')
        setIsLoading(false)
      }, 3000)
    } catch (error) {
      addLog(`❌ Session tracking failed: ${error}`)
      setIsLoading(false)
    }
  }

  const testFeature = async () => {
    setIsLoading(true)
    addLog('🚀 Testing feature tracking...')
    try {
      await analytics.trackFeatureUsage(
        'analytics_test_button', 
        'click', 
        userId || 'test-user-123',
        { test_data: 'debug_mode', button_color: 'purple' }
      )
      addLog('✅ Feature tracking successful!')
    } catch (error) {
      addLog(`❌ Feature tracking failed: ${error}`)
    }
    setIsLoading(false)
  }

  const testEngagement = async () => {
    setIsLoading(true)
    addLog('🚀 Testing engagement tracking...')
    try {
      await analytics.trackEngagement(
        'test_engagement_event',
        userId || 'test-user-123',
        { test_property: 'debug_value', location: 'test_component' }
      )
      addLog('✅ Engagement tracking successful!')
    } catch (error) {
      addLog(`❌ Engagement tracking failed: ${error}`)
    }
    setIsLoading(false)
  }

  const testFeedback = async () => {
    setIsLoading(true)
    addLog('🚀 Testing feedback tracking...')
    try {
      await analytics.trackFeedback(
        'feature_rating',
        userId || 'test-user-123',
        5,
        'This analytics test is working great!',
        'analytics_test',
        { component: 'AnalyticsTest' }
      )
      addLog('✅ Feedback tracking successful!')
    } catch (error) {
      addLog(`❌ Feedback tracking failed: ${error}`)
    }
    setIsLoading(false)
  }

  const runAllTests = async () => {
    clearLogs()
    addLog('🏁 Running all analytics tests...')
    
    await testSignup()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testFeature()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testEngagement()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testFeedback()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testSession()
    
    addLog('🎉 All tests completed!')
  }

  const clearLogs = () => setLogs([])

  const checkSupabase = () => {
    addLog('🔍 Check your Supabase tables now:')
    addLog('• user_analytics')
    addLog('• user_sessions') 
    addLog('• feature_usage')
    addLog('• engagement_events')
    addLog('• user_feedback')
    addLog('• user_retention_snapshots')
  }

  return (
    <div className="p-6 border rounded-lg bg-gray-50 max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-center">🧪 Analytics Test Dashboard</h3>
      
      {userId && (
        <p className="text-sm text-gray-600 mb-4 text-center">
          Testing with User ID: <code className="bg-gray-200 px-1 rounded">{userId}</code>
        </p>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <button 
          onClick={testSignup}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          📝 Test Signup
        </button>
        <button 
          onClick={testSession}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          🕐 Test Session
        </button>
        <button 
          onClick={testFeature}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          🎯 Test Feature
        </button>
        <button 
          onClick={testEngagement}
          disabled={isLoading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          ❤️ Test Engagement
        </button>
        <button 
          onClick={testFeedback}
          disabled={isLoading}
          className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          💬 Test Feedback
        </button>
        <button 
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          🏁 Run All Tests
        </button>
      </div>

      <div className="flex gap-2 mb-4 justify-center">
        <button 
          onClick={clearLogs}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          🗑️ Clear Logs
        </button>
        <button 
          onClick={() => analytics.debugStatus()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded text-sm"
        >
          🔍 Debug Info
        </button>
        <button 
          onClick={checkSupabase}
          className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded text-sm"
        >
          📊 Check Supabase
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-gray-500">
            📱 Analytics Test Console
            <br />
            Click a test button above to start testing your analytics setup.
            <br />
            <br />
            💡 Tip: Open your browser's developer console (F12) to see detailed logs.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>📋 How to verify:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Run a test above</li>
          <li>Go to your Supabase Dashboard → Table Editor</li>
          <li>Check the relevant analytics tables for new data</li>
          <li>Verify the data looks correct</li>
        </ol>
      </div>
    </div>
  )
}