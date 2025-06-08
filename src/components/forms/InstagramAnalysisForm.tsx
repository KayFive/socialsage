// src/components/forms/InstagramAnalysisForm.tsx
// Complete updated version with OAuth-based Instagram connection and reports redirect

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInstagramRequest } from '@/services/requestService';
import { useInstagram } from '@/hooks/useInstagram';
import { InstagramConnectCard } from '@/components/InstagramConnectButton';

type InstagramAnalysisFormProps = {
  userId: string;
  onSubmitStart?: () => void;
  onSubmitSuccess?: () => void;
  onSubmitError?: () => void;
};

export default function InstagramAnalysisForm({
  userId,
  onSubmitStart,
  onSubmitSuccess,
  onSubmitError
}: InstagramAnalysisFormProps) {
  const [niche, setNiche] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Add router hook
  const router = useRouter();

  // Use the Instagram hook to check connection status
  const { 
    isConnected, 
    isLoading: instagramLoading, 
    account, 
    instagramData,
    error: instagramError 
  } = useInstagram();

  const handleGoalChange = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(goals.filter(g => g !== goal));
    } else {
      if (goals.length < 3) {
        setGoals([...goals, goal]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      setError('Please connect your Instagram account first');
      return;
    }

    if (!niche) {
      setError('Please select a niche');
      return;
    }

    if (goals.length === 0) {
      setError('Please select at least one goal');
      return;
    }

    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      onSubmitStart?.();
      
      console.log('👤 Current userId from props:', userId);
      console.log('📱 Connected Instagram account:', account.instagram_handle);
      
      // Get the Supabase client
      const { createBrowserClient } = await import('@/lib/supabase');
      const supabase = createBrowserClient();
      
      // Create analysis request in the correct table
      console.log('💾 Creating analysis request in database...');
      const { data: newRequest, error: createError } = await supabase
        .from('analysis_requests')
        .insert([{
          user_id: userId,
          platform: 'instagram',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create analysis request:', createError);
        throw new Error(`Database error: ${createError.message}`);
      }
      
      console.log('✅ Analysis request created:', newRequest);
      
      // Also save the detailed instagram request for reference
      console.log('💾 Creating detailed Instagram request...');
      const detailedRequestResult = await createInstagramRequest({
        user_id: userId,
        instagram_handle: account.instagram_handle,
        niche,
        goals,
        email
      });
      
      console.log('✅ Detailed request created:', detailedRequestResult);
      
      // Add a small delay to ensure database write completes
      console.log('⏳ Waiting 500ms for database write to complete...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger analysis process
      console.log('🚀 Calling analyze API with request ID:', newRequest.id);
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: newRequest.id
        }),
      });
      
      console.log('📡 API Response status:', response.status);
      
      const responseData = await response.json();
      console.log('📥 API Response data:', responseData);
      
      if (!response.ok) {
        console.error('❌ API Error Details:', responseData);
        throw new Error(responseData.error || 'Analysis failed');
      }
      
      // Success
      console.log('🎉 Analysis completed successfully!');
      console.log('📋 Report created with ID:', responseData.report_id);

      // Show success message
      setError('');
      
      onSubmitSuccess?.();

      // Show a brief success message then redirect
      setTimeout(() => {
        console.log('🔄 Redirecting to reports page...');
        router.push('/reports');
      }, 1000);
      
    } catch (err) {
      console.error('❌ Form submission error:', err);
      let errorMessage = 'There was an error';
      if (err instanceof Error) {
        errorMessage = `There was an error: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = `There was an error: ${err}`;
      }
      setError(errorMessage);
      onSubmitError?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking Instagram connection
  if (instagramLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Checking Instagram connection...</span>
        </div>
      </div>
    );
  }

  // Show Instagram connection card if not connected
  if (!isConnected) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Connect Your Instagram</h2>
        <p className="text-gray-600 mb-6">
          To analyze your Instagram account, you need to connect it first. This allows us to access 
          your profile data, posts, and insights to generate a comprehensive analysis.
        </p>
        
        {instagramError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {instagramError}
          </div>
        )}
        
        <InstagramConnectCard />
        
        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">Why do we need access to your Instagram?</p>
          <ul className="space-y-1 ml-4">
            <li>• Analyze your posting patterns and engagement rates</li>
            <li>• Identify your top-performing content</li>
            <li>• Generate insights about your audience</li>
            <li>• Provide personalized recommendations</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Instagram Account Analysis</h2>
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Connected to @{account?.instagram_handle}
              </p>
              {instagramData && (
                <p className="text-sm text-green-600">
                  {instagramData.profile.followers_count} followers • {instagramData.media.length} posts analyzed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Success state when submitting */}
      {isSubmitting && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin h-5 w-5 border-b-2 border-green-600 rounded-full mr-3"></div>
            <div>
              <p className="text-green-800 font-medium">Analysis in progress...</p>
              <p className="text-green-600 text-sm">
                Analyzing your Instagram data. This will redirect to your reports when complete.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="niche" className="block text-sm font-medium text-gray-700 mb-1">
            What industry or niche is your Instagram account focused on?
          </label>
          <select
            id="niche"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">Select an industry</option>
            <option value="Fashion & Apparel">Fashion & Apparel</option>
            <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
            <option value="Health & Fitness">Health & Fitness</option>
            <option value="Food & Beverage">Food & Beverage</option>
            <option value="Travel & Lifestyle">Travel & Lifestyle</option>
            <option value="Business & Entrepreneurship">Business & Entrepreneurship</option>
            <option value="Education & Learning">Education & Learning</option>
            <option value="Arts & Entertainment">Arts & Entertainment</option>
            <option value="Technology & Gaming">Technology & Gaming</option>
            <option value="Home & Decor">Home & Decor</option>
            <option value="E-commerce & Retail">E-commerce & Retail</option>
            <option value="Personal Brand">Personal Brand</option>
            <option value="Non-profit & Cause">Non-profit & Cause</option>
          </select>
        </div>
        
        <div className="mb-4">
          <span className="block text-sm font-medium text-gray-700 mb-1">
            What are your primary goals? (Select up to 3)
          </span>
          <div className="mt-2 space-y-2">
            {[
              'Increase followers/audience growth',
              'Boost engagement (likes, comments, shares)',
              'Drive website traffic',
              'Generate leads or sales',
              'Build brand awareness',
              'Improve content quality',
              'Establish thought leadership',
              'Create community engagement',
              'Optimize posting strategy'
            ].map((goal) => (
              <div key={goal} className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`goal-${goal}`}
                    name="goals"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={goals.includes(goal)}
                    onChange={() => handleGoalChange(goal)}
                    disabled={(!goals.includes(goal) && goals.length >= 3) || isSubmitting}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`goal-${goal}`} className="font-medium text-gray-700">
                    {goal}
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {goals.length}/3 selected
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Where should we send your report?"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            We'll send your analysis report to this email address.
          </p>
        </div>
        
        <button
          type="submit"
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing Instagram...
            </span>
          ) : (
            "Analyze My Instagram"
          )}
        </button>
      </form>
    </div>
  );
}