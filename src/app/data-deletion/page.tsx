"use client"

// app/data-deletion/page.tsx
import React from 'react';
import Head from 'next/head';
import { Shield, Download, Trash2, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

const DataDeletionPage = () => {
  return (
    <>
      <Head>
        <title>Data Deletion Instructions - SocialSage</title>
        <meta name="description" content="Learn how to delete your data from SocialSage - Complete instructions for account and data deletion." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://socialsage-app.vercel.app/data-deletion" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Deletion Instructions</h1>
                <p className="text-gray-600 mt-2">Complete guide to deleting your data from SocialSage</p>
              </div>
              <a 
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                ← Back to SocialSage
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-900">⚠️ Important Notice</h3>
                <p className="text-yellow-800 text-sm mt-1">
                  Data deletion is permanent and cannot be undone. We recommend exporting your data first 
                  as a backup before proceeding with deletion.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Export Data First</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Download a complete copy of your data before deletion. This includes your analytics, 
                Instagram connections, and account history.
              </p>
              <a 
                href="/login" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Go to Account Settings <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Data</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Choose between deleting just your Instagram data or your complete SocialSage account. 
                Both options are available in your account settings.
              </p>
              <a 
                href="/login" 
                className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Access Deletion Options <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Step-by-Step Deletion Process</h2>
            
            <div className="space-y-6">
              
              {/* Step 1 */}
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Sign In to Your Account</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Log in to your SocialSage account using the same email and password you used to create the account.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Can't sign in?</strong> Contact our support team at{' '}
                      <a href="mailto:support@socialsage.app" className="underline">support@socialsage.app</a> for assistance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Navigate to Profile Settings</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Once logged in, go to your Profile tab (bottom navigation) and look for the "Account Data Management" option in the Settings section.
                  </p>
                  <div className="bg-gray-50 border rounded p-3">
                    <p className="text-gray-700 text-sm">
                      <strong>Path:</strong> Profile → Settings → Account Data Management
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Export Your Data (Recommended)</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Before deleting, we strongly recommend downloading a copy of your data. This includes:
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1 ml-4 mb-3">
                    <li>• Your account profile information</li>
                    <li>• Connected Instagram account details</li>
                    <li>• Historical analytics data and growth metrics</li>
                    <li>• Sync history and interaction logs</li>
                  </ul>
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-green-800 text-sm">
                      Click "Download My Data" to export your information as a JSON file.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Choose Your Deletion Option</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    SocialSage offers two deletion options to meet different privacy needs:
                  </p>
                  
                  <div className="space-y-3">
                    <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                      <h4 className="font-medium text-orange-900 mb-1">📸 Delete Instagram Data Only</h4>
                      <p className="text-orange-800 text-sm mb-2">
                        Removes all Instagram account connections and analytics data, but keeps your SocialSage account.
                      </p>
                      <p className="text-orange-700 text-xs">
                        <strong>Result:</strong> You can reconnect Instagram accounts later if desired.
                      </p>
                    </div>

                    <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <h4 className="font-medium text-red-900 mb-1">🗑️ Delete Complete Account</h4>
                      <p className="text-red-800 text-sm mb-2">
                        Permanently deletes your SocialSage account and ALL associated data.
                      </p>
                      <p className="text-red-700 text-xs">
                        <strong>Result:</strong> This action cannot be undone. You would need to create a new account to use SocialSage again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Confirm Your Deletion</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    For complete account deletion, you'll need to type "DELETE MY ACCOUNT" to confirm. 
                    For Instagram-only deletion, simply click confirm.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-800 text-sm">
                      <strong>Important:</strong> This step cannot be undone. Make sure you've exported any data you want to keep.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* What Gets Deleted */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What Data Gets Deleted</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                  Instagram Data Deletion
                </h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Instagram account connections and usernames</li>
                  <li>• Daily analytics snapshots and growth data</li>
                  <li>• Historical follower and engagement metrics</li>
                  <li>• Sync logs and API interaction history</li>
                  <li>• AI-generated insights and recommendations</li>
                  <li>• Top followers analysis and comment data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Trash2 className="w-4 h-4 text-red-500 mr-2" />
                  Complete Account Deletion
                </h3>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Your SocialSage user account and profile</li>
                  <li>• All Instagram data (as listed above)</li>
                  <li>• Account preferences and settings</li>
                  <li>• Login credentials and authentication tokens</li>
                  <li>• All interaction history with our platform</li>
                  <li>• Any support tickets or communication history</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline and Support */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                Deletion Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900">Immediate</h4>
                  <p className="text-gray-600">Account access is immediately revoked</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Within 24 hours</h4>
                  <p className="text-gray-600">All personal data is removed from active systems</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Within 30 days</h4>
                  <p className="text-gray-600">Data is purged from backups and redundant systems</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Legal retention</h4>
                  <p className="text-gray-600">Some data may be retained if required by law</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-2" />
                Need Help?
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Having trouble with deletion?</h4>
                  <p className="text-gray-600 text-sm">Contact our support team for assistance</p>
                  <a href="mailto:support@socialsage.app" className="text-blue-600 hover:text-blue-800 text-sm underline">
                    support@socialsage.app
                  </a>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Privacy questions?</h4>
                  <p className="text-gray-600 text-sm">Our privacy team can help with data requests</p>
                  <a href="mailto:privacy@socialsage.app" className="text-blue-600 hover:text-blue-800 text-sm underline">
                    privacy@socialsage.app
                  </a>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Legal concerns?</h4>
                  <p className="text-gray-600 text-sm">For formal legal matters and compliance</p>
                  <a href="mailto:legal@socialsage.app" className="text-blue-600 hover:text-blue-800 text-sm underline">
                    legal@socialsage.app
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Data Subject Rights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Data Rights</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">🇪🇺 EU/UK Users (GDPR)</h4>
                <ul className="text-blue-800 space-y-1">
                  <li>• Right to erasure ("right to be forgotten")</li>
                  <li>• Right to data portability</li>
                  <li>• Right to rectification</li>
                  <li>• Right to object to processing</li>
                  <li>• Right to withdraw consent</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">🇺🇸 California Users (CCPA)</h4>
                <ul className="text-blue-800 space-y-1">
                  <li>• Right to know what personal information is collected</li>
                  <li>• Right to delete personal information</li>
                  <li>• Right to opt-out of the sale of personal information</li>
                  <li>• Right to non-discrimination for exercising rights</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> SocialSage does not sell personal data. We respect all data subject rights 
                regardless of your location. For more information, see our{' '}
                <a href="/privacy" className="underline hover:text-blue-900">Privacy Policy</a>.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">© 2025 SocialSage. All rights reserved.</p>
              <div className="flex justify-center space-x-6 text-sm">
                <a href="/" className="text-gray-500 hover:text-gray-900">Home</a>
                <a href="/terms" className="text-gray-500 hover:text-gray-900">Terms of Service</a>
                <a href="/privacy" className="text-gray-500 hover:text-gray-900">Privacy Policy</a>
                <a href="/data-deletion" className="text-gray-500 hover:text-gray-900 font-medium">Data Deletion</a>
                <a href="mailto:support@socialsage.app" className="text-gray-500 hover:text-gray-900">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DataDeletionPage;