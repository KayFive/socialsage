// /components/instagram/InstagramConnectionManager.jsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { InstagramService } from '@/services/instagramService';

export default function InstagramConnectionManager({ 
  onConnectionChange, 
  showAll = false, 
  allowMultiple = true 
}) {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(null);

  const instagramService = new InstagramService();

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      const userConnections = await instagramService.getUserConnections(user.id);
      console.log('🔍 Fetched connections:', userConnections);
      setConnections(userConnections);
      
      if (onConnectionChange) {
        onConnectionChange(userConnections);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!allowMultiple && connections.length > 0) {
      alert('Please disconnect your current account before connecting a new one.');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Generate state parameter for OAuth security
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('instagram_oauth_state', state);
      
      // Build Instagram OAuth URL
      const redirectUri = `${window.location.origin}/auth/instagram/callback`;
      const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
      
      const oauthUrl = `https://api.instagram.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=user_profile,user_media&` +
        `response_type=code&` +
        `state=${state}`;
      
      // Redirect to Instagram OAuth
      window.location.href = oauthUrl;
      
    } catch (error) {
      console.error('Error starting Instagram OAuth:', error);
      alert('Failed to start Instagram connection process');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId) => {
    if (!confirm('Are you sure you want to disconnect this Instagram account?')) {
      return;
    }

    try {
      console.log('🔄 Starting disconnect process for:', connectionId);
      console.log('🔄 User ID:', user.id);
      setIsDisconnecting(connectionId);
      
      // Debug: Let's try a direct Supabase call first
      const { createBrowserClient } = await import('@/lib/supabase');
      const supabase = createBrowserClient();
      
      // Test direct update
      console.log('🔄 Attempting direct Supabase update...');
      const { data, error } = await supabase
        .from('instagram_accounts')
        .update({ is_active: false })
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .select();
      
      console.log('🔄 Direct update result:', { data, error });
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('✅ Direct disconnect successful, refreshing connections...');
      await fetchConnections();
      console.log('✅ Connections refreshed');
      
    } catch (error) {
      console.error('❌ Error disconnecting Instagram:', error);
      
      // Show more specific error message
      let errorMessage = 'Failed to disconnect Instagram account';
      if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsDisconnecting(null);
    }
  };

  const handleSetPrimary = async (connectionId) => {
    try {
      await instagramService.setPrimaryConnection(user.id, connectionId);
      await fetchConnections();
    } catch (error) {
      console.error('Error setting primary connection:', error);
      alert('Failed to set as primary account');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-200 border-t-indigo-600"></div>
        <span className="text-sm text-gray-600">Loading connections...</span>
      </div>
    );
  }

  if (!showAll && connections.length === 0) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
      >
        <span className="text-lg">📷</span>
        <span>{isConnecting ? 'Connecting...' : 'Connect Instagram'}</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Accounts */}
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-white border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {connection.instagram_handle ? connection.instagram_handle[0].toUpperCase() : 'U'}
              </span>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">
                  @{connection.instagram_handle || 'Unknown'}
                </h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Connected {new Date(connection.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDisconnect(connection.id)}
              disabled={isDisconnecting === connection.id}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDisconnecting === connection.id ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        </div>
      ))}

      {/* Add New Connection Button */}
      {(allowMultiple || connections.length === 0) && (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
        >
          <span className="text-lg">📷</span>
          <span>{isConnecting ? 'Connecting...' : 'Connect Another Instagram Account'}</span>
        </button>
      )}
    </div>
  );
}