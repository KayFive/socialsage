'use client';

import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import InstagramAnalysisForm from '@/components/forms/InstagramAnalysisForm';

export default function AnalyzePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Instagram Analysis</h1>
            <p className="text-gray-600 mt-2">
              Connect your Instagram account and get detailed insights about your content performance.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md">
            {user && (
              <InstagramAnalysisForm 
                userId={user.id}
                onSubmitStart={() => console.log('Analysis started')}
                onSubmitSuccess={() => console.log('Analysis completed')}
                onSubmitError={() => console.log('Analysis failed')}
              />
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}