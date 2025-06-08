// /app/settings/instagram/page.js

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import InstagramConnectionManager from '@/components/instagram/InstagramConnectionManager';

export default function InstagramSettings() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);

  const handleConnectionChange = (updatedConnections) => {
    console.log('🔄 Connections updated:', updatedConnections);
    setConnections(updatedConnections);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-xl font-bold text-gray-900">SocialSage</span>
                </Link>
                <div className="hidden md:flex items-center space-x-6 ml-8">
                  <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors">Dashboard</Link>
                  <Link href="/reports" className="text-gray-600 hover:text-indigo-600 transition-colors">Reports</Link>
                  <span className="text-indigo-600 font-semibold">Instagram Settings</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
              <Link 
                href="/dashboard" 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-gray-400">→</span>
              <span className="text-gray-900 font-medium">Instagram Settings</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Instagram Connections
            </h1>
            <p className="text-lg text-gray-600">
              Manage your connected Instagram accounts and permissions
            </p>
          </div>

          {/* Connection Manager */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  📱 Connected Accounts
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {connections.length} account{connections.length !== 1 ? 's' : ''} connected
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <InstagramConnectionManager
                onConnectionChange={handleConnectionChange}
                showAll={true}
                allowMultiple={true}
              />
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Multiple Accounts Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                📊 Multiple Accounts
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Connect multiple Instagram accounts to analyze and compare performance across different profiles.
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Switch between accounts easily</li>
                <li>• Compare performance metrics</li>
                <li>• Manage all accounts from one dashboard</li>
              </ul>
            </div>

            {/* Privacy & Security Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                🔒 Privacy & Security
              </h3>
              <p className="text-green-800 text-sm mb-3">
                Your Instagram data is secure and only used for analytics purposes.
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Tokens are encrypted and stored securely</li>
                <li>• Disconnect anytime to revoke access</li>
                <li>• We only read public data and insights</li>
              </ul>
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Required Permissions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Basic Profile Access</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Profile information (username, bio)</li>
                  <li>• Follower and following counts</li>
                  <li>• Media count</li>
                  <li>• Profile picture</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Insights & Analytics</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Post performance metrics</li>
                  <li>• Story insights and engagement</li>
                  <li>• Audience demographics</li>
                  <li>• Reach and impressions data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}