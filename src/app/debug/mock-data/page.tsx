'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getMockInstagramData, refreshMockInstagramData } from '@/services/mockInstagramService';
import { InstagramDataPackage } from '@/types/instagram.types';

export default function MockDataDebugPage() {
  const { user } = useAuth();
  const [instagramHandle, setInstagramHandle] = useState('@example_user');
  const [mockData, setMockData] = useState<InstagramDataPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const fetchMockData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const cleanHandle = instagramHandle.replace('@', '');
      const data = await getMockInstagramData(cleanHandle, user.id);
      setMockData(data);
    } catch (error) {
      console.error('Error fetching mock data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const cleanHandle = instagramHandle.replace('@', '');
      const data = await refreshMockInstagramData(cleanHandle, user.id);
      setMockData(data);
    } catch (error) {
      console.error('Error refreshing mock data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchMockData();
    }
  }, [user]);
  
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Mock Data Debugger</h1>
          
          <div className="bg-white shadow-md rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <input
                type="text"
                className="flex-grow px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="Enter Instagram handle"
              />
              <button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-md"
                onClick={fetchMockData}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Generate'}
              </button>
            </div>
            
            <button
              className="text-indigo-600 hover:text-indigo-800 text-sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh Data
            </button>
          </div>
          
          {mockData && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'media' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('media')}
                >
                  Media
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'audience' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('audience')}
                >
                  Audience
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'metrics' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('metrics')}
                >
                  Metrics
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${activeTab === 'growth' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('growth')}
                >
                  Growth
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'profile' && (
                  <div>
                    <div className="flex items-center mb-6">
                      <img 
                        src={mockData.profile.profile_picture_url} 
                        alt={mockData.profile.username}
                        className="w-20 h-20 rounded-full mr-4" 
                      />
                      <div>
                        <h2 className="text-xl font-bold">{mockData.profile.name}</h2>
                        <p className="text-gray-600">@{mockData.profile.username}</p>
                        {mockData.profile.is_verified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{mockData.profile.media_count.toLocaleString()}</div>
                        <div className="text-gray-500 text-sm">Posts</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{mockData.profile.followers_count.toLocaleString()}</div>
                        <div className="text-gray-500 text-sm">Followers</div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold">{mockData.profile.follows_count.toLocaleString()}</div>
                        <div className="text-gray-500 text-sm">Following</div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Biography</h3>
                      <p className="text-gray-700">{mockData.profile.biography}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Account Details</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Account Type</div>
                            <div>{mockData.profile.account_type}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Website</div>
                            <div>{mockData.profile.website}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">ID</div>
                            <div>{mockData.profile.id}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Include content for the other tabs (media, audience, metrics, growth) here */}
                {/* This is abbreviated - copy all the tab content from your document */}
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}