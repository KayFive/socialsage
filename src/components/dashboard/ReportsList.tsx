'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getInstagramRequests, getReports } from '@/lib/db';
import { InstagramRequest, Report } from '@/types/database.types';

export default function ReportsList() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [requests, setRequests] = useState<InstagramRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const [reportsData, requestsData] = await Promise.all([
          getReports(user.id),
          getInstagramRequests(user.id)
        ]);
        
        setReports(reportsData);
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const formatDate = (dateString: string) => {
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
            Your Reports
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your Instagram analysis reports.
          </p>
        </div>
        <div className="px-4 py-12 text-center border-t border-gray-200">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your reports...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Your Reports
          </h3>
        </div>
        <div className="px-4 py-5 border-t border-gray-200 text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }
  
  const hasReportsOrRequests = reports.length > 0 || requests.length > 0;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Your Reports
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your Instagram analysis reports.
        </p>
      </div>
      
      {hasReportsOrRequests ? (
        <div>
          {requests.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-3 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">Pending Requests</h4>
              </div>
              <ul className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <li key={request.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">@{request.instagram_handle}</p>
                        <p className="text-sm text-gray-500">Requested on {formatDate(request.created_at)}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {request.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {reports.length > 0 && (
            <div className="border-t border-gray-200">
              <div className="px-4 py-3 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">Completed Reports</h4>
              </div>
              <ul className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <li key={report.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-600">Report #{report.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">Generated on {formatDate(report.created_at)}</p>
                      </div>
                      <div>
                        {report.status === 'completed' ? (
                          <a 
                            href={report.report_url || '#'} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            View Report
                          </a>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {report.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by analyzing your first Instagram account.
          </p>
          <div className="mt-6">
            <Link
              href="/analyze"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Your First Report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}