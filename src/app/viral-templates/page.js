'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TemplateGallery from '../../components/viral/TemplateGallery';
import TemplatePreview from '../../components/viral/TemplatePreview';
import TemplateCustomizer from '../../components/viral/TemplateCustomizer';
import { ViralTemplateEngine } from '../../services/viralTemplateEngine';

export default function ViralTemplatesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setIsLoading(false);
      setError('Please log in to access viral templates');
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Loading user data for viral templates...');
      
      // Fetch real Instagram data from your API
      const response = await fetch(`/api/viral-templates/user-data?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load user data');
      }

      console.log('✅ User data loaded:', data.profile);
      setUserProfile(data.profile);

      // Generate personalized recommendations based on real data
      const userAnalysis = ViralTemplateEngine.analyzeUserContent(data.profile.recent_posts);
      const recs = ViralTemplateEngine.recommendTemplatesForUser(userAnalysis, data.profile.niche);
      setRecommendations(recs);
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      setError(error.message);
      
      // Fallback to basic profile if Instagram data fails
      setUserProfile({
        id: user.id,
        name: user.email?.split('@')[0] || 'Creator',
        handle: 'creator',
        avatar: '',
        niche: 'general',
        followers: 0,
        avg_engagement: 0,
        audience: 'general',
        recent_posts: [],
        top_performing_posts: [],
        posting_patterns: { frequency: 'irregular', bestHours: [], bestDays: [] }
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCurrentView('preview');
  };

  const handleCustomize = (template) => {
    setSelectedTemplate(template);
    setCurrentView('customize');
  };

  const handleSavePost = async (postData) => {
    try {
      console.log('💾 Saving viral template post:', postData);
      
      // Save to your database
      const response = await fetch('/api/viral-templates/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...postData,
          user_id: user.id,
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('🎉 Post saved successfully! Ready to publish on Instagram.');
        setCurrentView('gallery');
        setSelectedTemplate(null);
      } else {
        throw new Error('Failed to save post');
      }
      
    } catch (error) {
      console.error('❌ Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  };

  const handleBack = () => {
    if (currentView === 'customize') {
      setCurrentView('preview');
    } else {
      setCurrentView('gallery');
      setSelectedTemplate(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized templates...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing your Instagram data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Templates</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={loadUserData}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
            <p className="text-sm text-gray-500">
              Make sure you have connected your Instagram account in your dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                ←
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Viral Templates</h1>
                <p className="text-sm text-gray-600">
                  {currentView === 'gallery' && userProfile && (
                    `Personalized for ${userProfile.niche} • ${userProfile.followers} followers`
                  )}
                  {currentView === 'preview' && `Previewing: ${selectedTemplate?.name}`}
                  {currentView === 'customize' && `Customizing: ${selectedTemplate?.name}`}
                </p>
              </div>
            </div>
            
            {userProfile && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                  <p className="text-xs text-gray-600">@{userProfile.handle}</p>
                </div>
                {userProfile.avatar && (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {currentView === 'gallery' && (
          <TemplateGallery
            onSelectTemplate={handleTemplateSelect}
            userNiche={userProfile?.niche}
            recommendations={recommendations}
            userProfile={userProfile}
          />
        )}

        {currentView === 'preview' && selectedTemplate && (
          <TemplatePreview
            template={selectedTemplate}
            onBack={handleBack}
            onCustomize={handleCustomize}
            userProfile={userProfile}
          />
        )}

        {currentView === 'customize' && selectedTemplate && (
          <TemplateCustomizer
            template={selectedTemplate}
            userProfile={userProfile}
            onBack={handleBack}
            onSave={handleSavePost}
          />
        )}
      </main>
    </div>
  );
}
