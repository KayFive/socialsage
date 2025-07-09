// components/AccountDataManagement.tsx
"use client"

import React, { useState, useEffect } from 'react';
import { Download, Trash2, Shield, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

interface DataSummary {
  userId: string;
  userEmail: string;
  accountCreated: string;
  dataToDelete: {
    instagramAccounts: {
      count: number;
      accounts: Array<{
        username: string;
        connectedSince: string;
      }>;
    };
    dailySnapshots: {
      count: number;
      description: string;
    };
    syncLogs: {
      count: number;
      description: string;
    };
  };
  deletionOptions: {
    instagram_only: {
      name: string;
      description: string;
      consequence: string;
    };
    complete: {
      name: string;
      description: string;
      consequence: string;
    };
  };
}

interface DeletionResult {
  success: boolean;
  message: string;
  deletionResults?: {
    deletionType: string;
    steps: Array<{
      step: string;
      status: 'success' | 'error' | 'skipped';
      details?: string;
      count?: number;
    }>;
  };
  redirect?: boolean;
}

interface AccountDataManagementProps {
  onBack: () => void;
}

const AccountDataManagement: React.FC<AccountDataManagementProps> = ({ onBack }) => {
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string>('');
  
  // Deletion states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletionType, setDeletionType] = useState<'instagram_only' | 'complete'>('instagram_only');
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionResult, setDeletionResult] = useState<DeletionResult | null>(null);

  useEffect(() => {
    fetchDataSummary();
  }, []);

  const fetchDataSummary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/delete-data');
      
      if (response.ok) {
        const data = await response.json();
        setDataSummary(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load account data');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      setExportSuccess('');
      
      const response = await fetch('/api/user/export-data');
      
      if (response.ok) {
        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `socialsage-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setExportSuccess('Your data has been exported successfully!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to export data');
      }
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    try {
      setIsDeleting(true);
      setDeletionResult(null);
      
      const response = await fetch('/api/user/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deletionType,
          confirmationText
        }),
      });
      
      const result = await response.json();
      setDeletionResult(result);
      
      if (result.success && result.redirect) {
        // Account was completely deleted, redirect to home
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else if (result.success) {
        // Partial deletion successful, refresh data
        setTimeout(() => {
          fetchDataSummary();
          setShowDeleteModal(false);
        }, 2000);
      }
      
    } catch (err) {
      setDeletionResult({
        success: false,
        message: 'Failed to process deletion request'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !dataSummary) {
    return (
      <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 text-blue-600 font-medium">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Account Data Management</h1>
          </div>
        </div>
        
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 text-blue-600 font-medium">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Data Management</h1>
            <p className="text-sm text-gray-600">Export or delete your personal data</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Success/Error Messages */}
        {exportSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Success</span>
            </div>
            <p className="text-green-700 text-sm mt-1">{exportSuccess}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-600 text-sm underline mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Account Summary */}
        {dataSummary && (
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Account Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{dataSummary.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Created:</span>
                <span className="font-medium">{new Date(dataSummary.accountCreated).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instagram Accounts:</span>
                <span className="font-medium">{dataSummary.dataToDelete.instagramAccounts.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Analytics Records:</span>
                <span className="font-medium">{dataSummary.dataToDelete.dailySnapshots.count}</span>
              </div>
            </div>
          </div>
        )}

        {/* Data Export Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Your Data</h2>
              <p className="text-sm text-gray-600">Download all your personal data in JSON format</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">📦 What's Included in Your Export:</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Your account profile information</li>
              <li>• Connected Instagram account details (usernames, connection dates)</li>
              <li>• Historical analytics data and growth metrics</li>
              <li>• Sync history and API interaction logs</li>
              <li>• Note: Access tokens and sensitive credentials are NOT included for security</li>
            </ul>
          </div>

          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-3 px-4 font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Preparing Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download My Data</span>
              </>
            )}
          </button>
        </div>
        

        {/* Data Deletion Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Delete Your Data</h2>
              <p className="text-sm text-gray-600">Remove your data from our systems</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-900">⚠️ Important Notice</h4>
                <p className="text-yellow-800 text-sm mt-1">
                  Data deletion is permanent and cannot be undone. Consider exporting your data first.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 px-4 font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete My Data</span>
          </button>
        </div>

        {/* Privacy Information */}
<div className="bg-gray-50 rounded-lg p-4 border">
  <div className="flex items-center space-x-2 mb-2">
    <Shield className="w-4 h-4 text-gray-600" />
    <h3 className="font-medium text-gray-900">Privacy & Security</h3>
  </div>
  <p className="text-gray-700 text-sm mb-3">
    Your data is protected under our Privacy Policy and applicable data protection laws (GDPR, CCPA).
  </p>
  <div className="space-y-1">
    <a href="/data-deletion" target="_blank" className="block text-blue-600 hover:text-blue-800 text-sm underline">
      📋 View Detailed Data Deletion Instructions
    </a>
    <a href="/privacy" target="_blank" className="block text-blue-600 hover:text-blue-800 text-sm underline">
      📄 Read our Privacy Policy
    </a>
    <a href="mailto:privacy@socialsage.app" className="block text-blue-600 hover:text-blue-800 text-sm underline">
      📧 Contact Privacy Team
    </a>
  </div>
</div>
      </div>

      {/* Deletion Modal */}
      {showDeleteModal && dataSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Your Data</h3>
              
              {/* Deletion Options */}
              <div className="space-y-3 mb-6">
                <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  deletionType === 'instagram_only' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`} onClick={() => setDeletionType('instagram_only')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <input 
                      type="radio" 
                      checked={deletionType === 'instagram_only'} 
                      onChange={() => setDeletionType('instagram_only')}
                      className="text-blue-600"
                    />
                    <h4 className="font-medium text-gray-900">{dataSummary.deletionOptions.instagram_only.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{dataSummary.deletionOptions.instagram_only.description}</p>
                  <p className="text-xs text-blue-600 ml-6 mt-1">{dataSummary.deletionOptions.instagram_only.consequence}</p>
                </div>

                <div className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  deletionType === 'complete' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`} onClick={() => setDeletionType('complete')}>
                  <div className="flex items-center space-x-2 mb-2">
                    <input 
                      type="radio" 
                      checked={deletionType === 'complete'} 
                      onChange={() => setDeletionType('complete')}
                      className="text-red-600"
                    />
                    <h4 className="font-medium text-gray-900">{dataSummary.deletionOptions.complete.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">{dataSummary.deletionOptions.complete.description}</p>
                  <p className="text-xs text-red-600 ml-6 mt-1">{dataSummary.deletionOptions.complete.consequence}</p>
                </div>
              </div>

              {/* Confirmation for Complete Deletion */}
              {deletionType === 'complete' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Type "DELETE MY ACCOUNT" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
              )}

              {/* Deletion Result */}
              {deletionResult && (
                <div className={`mb-4 p-3 rounded-lg ${
                  deletionResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    deletionResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {deletionResult.message}
                  </p>
                  
                  {deletionResult.deletionResults && (
                    <div className="mt-2 space-y-1">
                      {deletionResult.deletionResults.steps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          {step.status === 'success' && <CheckCircle className="w-3 h-3 text-green-600" />}
                          {step.status === 'error' && <XCircle className="w-3 h-3 text-red-600" />}
                          {step.status === 'skipped' && <div className="w-3 h-3 bg-gray-400 rounded-full" />}
                          <span className={`${
                            step.status === 'success' ? 'text-green-700' : 
                            step.status === 'error' ? 'text-red-700' : 'text-gray-600'
                          }`}>
                            {step.step.replace(/_/g, ' ')}: {step.details} 
                            {step.count !== undefined && ` (${step.count})`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {deletionResult.redirect && (
                    <p className="text-xs text-green-700 mt-2">
                      Redirecting to homepage in 3 seconds...
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConfirmationText('');
                    setDeletionResult(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg py-2 px-4 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteData}
                  disabled={isDeleting || (deletionType === 'complete' && confirmationText !== 'DELETE MY ACCOUNT')}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg py-2 px-4 font-medium transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Deletion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDataManagement;