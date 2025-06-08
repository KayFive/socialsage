// src/app/analysis/new/page.tsx
'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import InstagramAnalysisForm from '@/components/forms/InstagramAnalysisForm';
import { useAuth } from '@/contexts/AuthContext';

export default function NewAnalysisPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSubmitStart = () => {
    setIsSubmitting(true);
  };
  
  const handleSubmitSuccess = () => {
    setIsSubmitting(false);
    setIsSuccess(true);
  };
  
  const handleSubmitError = () => {
    setIsSubmitting(false);
  };
  
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-3xl mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">New Instagram Analysis</h1>
          
          {isSuccess ? (
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-medium text-green-800 mb-2">Analysis Request Submitted!</h2>
              <p className="text-green-700 mb-4">
                Your Instagram analysis is being processed. You'll be notified when it's complete.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Start Another Analysis
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg">
              <InstagramAnalysisForm
                userId={user?.id || ''}
                onSubmitStart={handleSubmitStart}
                onSubmitSuccess={handleSubmitSuccess}
                onSubmitError={handleSubmitError}
              />
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}