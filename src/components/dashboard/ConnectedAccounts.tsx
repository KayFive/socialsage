
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getInstagramAccounts } from '@/lib/db';
import { InstagramAccount } from '@/types/database.types';
import ConnectInstagramButton from '@/components/instagram/ConnectInstagramButton';

export default function ConnectedAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const accountsData = await getInstagramAccounts(user.id);
        setAccounts(accountsData);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Failed to load connected accounts.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAccounts();
  }, [user]);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never expires';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Connected Accounts
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage your connected Instagram accounts.
          </p>
        </div>
        <div className="px-4 py-12 text-center border-t border-gray-200">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your accounts...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Connected Accounts
          </h3>
        </div>
        <div className="px-4 py-5 border-t border-gray-200 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Connected Accounts
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Manage your connected Instagram accounts.
        </p>
      </div>
      
      {accounts.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {accounts.map((account) => (
            <li key={account.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-pink-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-600">@{account.instagram_handle}</span>
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">
                      Connected on {formatDate(account.created_at)}
                    </p>
                    {account.token_expires_at && (
                      <p className="text-xs text-gray-500">
                        Token expires: {formatDate(account.token_expires_at)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-12 text-center border-t border-gray-200">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No connected accounts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Instagram account to analyze it.
          </p>
          <div className="mt-6">
            <ConnectInstagramButton />
          </div>
        </div>
      )}
    </div>
  );
}