'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createBrowserClient } from '@/lib/supabase';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error) {
          setReports(data || []);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [user]);
  
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">All Reports</h1>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div key={report.id} className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    @{report.report_data?.profile?.username || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Created: {new Date(report.created_at).toLocaleDateString()}
                  </p>
                  
                  {report.report_data?.summary?.overallScore && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall Score</span>
                        <span>{report.report_data.summary.overallScore}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${report.report_data.summary.overallScore}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <Link
                    href={`/reports/${report.id}`}
                    className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                  >
                    View Report
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          {!isLoading && reports.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No reports found.</p>
              <Link
                href="/analysis/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Report
              </Link>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}