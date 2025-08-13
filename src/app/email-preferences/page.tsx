'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Move your existing component logic into this wrapper component
function EmailPreferencesContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [preferences, setPreferences] = useState({
    marketing: true,
    product: true,
    tips: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdatePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, preferences }),
      });

      if (response.ok) {
        setMessage('Preferences updated successfully!');
      } else {
        setMessage('Failed to update preferences. Please try again.');
      }
    } catch (error) {
      setMessage('Error updating preferences.');
    }
    setLoading(false);
  };

  if (!token) {
    return <div>Invalid link</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Email Preferences</h1>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
              className="mr-3"
            />
            <span>Marketing emails (welcome series, tips)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.product}
              onChange={(e) => setPreferences(prev => ({ ...prev, product: e.target.checked }))}
              className="mr-3"
            />
            <span>Product updates (new features, improvements)</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.tips}
              onChange={(e) => setPreferences(prev => ({ ...prev, tips: e.target.checked }))}
              className="mr-3"
            />
            <span>Growth tips and insights</span>
          </label>
        </div>
        
        <button
          onClick={handleUpdatePreferences}
          disabled={loading}
          className="mt-6 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Preferences'}
        </button>
        
        {message && (
          <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading component for the suspense boundary
function EmailPreferencesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email preferences...</p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function EmailPreferencesPage() {
  return (
    <Suspense fallback={<EmailPreferencesLoading />}>
      <EmailPreferencesContent />
    </Suspense>
  );
}