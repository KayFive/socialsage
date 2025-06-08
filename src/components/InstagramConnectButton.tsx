// src/components/InstagramConnectButton.tsx
// Component for connecting Instagram account

'use client';

import { useState } from 'react';
import { Instagram, ExternalLink, Loader2 } from 'lucide-react';
import { instagramApi } from '@/services/instagramApiService';

interface InstagramConnectButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function InstagramConnectButton({ 
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  children 
}: InstagramConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get Instagram OAuth URL
      const authUrl = instagramApi.getAuthUrl();
      
      // Store current location to return to after auth
      localStorage.setItem('pre_auth_url', window.location.pathname);
      
      // Redirect to Instagram OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error starting Instagram connection:', error);
      setIsConnecting(false);
      
      // You might want to show a toast or error message here
      alert('Failed to start Instagram connection. Please try again.');
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3 text-base';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'border-2 border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white bg-transparent';
      default:
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white';
    }
  };

  const defaultText = children || 'Connect Instagram';

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className={`
        ${getSizeClasses()}
        ${getVariantClasses()}
        rounded-lg font-semibold transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center space-x-2
        transform hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        ${className}
      `}
    >
      {isConnecting ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          {showIcon && <Instagram className="h-5 w-5" />}
          <span>{defaultText}</span>
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

// Alternative button styles for different use cases
export function InstagramConnectCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
            <Instagram className="h-12 w-12 text-pink-600" />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Connect Your Instagram
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Connect your Instagram Business account to start analyzing your content, 
            engagement, and audience insights.
          </p>
        </div>
        
        <InstagramConnectButton 
          size="lg"
          className="w-full"
        >
          Connect Instagram Account
        </InstagramConnectButton>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>✓ Secure OAuth connection</p>
          <p>✓ We never store your Instagram password</p>
          <p>✓ Revoke access anytime from your Instagram settings</p>
        </div>
      </div>
    </div>
  );
}

// Compact version for navigation or smaller spaces
export function InstagramConnectBadge({ className = '' }: { className?: string }) {
  const [isConnected, setIsConnected] = useState(false);
  
  // You might want to check connection status here
  
  if (isConnected) {
    return (
      <div className={`flex items-center space-x-2 text-green-600 ${className}`}>
        <Instagram className="h-4 w-4" />
        <span className="text-sm font-medium">Connected</span>
      </div>
    );
  }
  
  return (
    <InstagramConnectButton 
      size="sm" 
      variant="outline"
      className={className}
    >
      Connect
    </InstagramConnectButton>
  );
}