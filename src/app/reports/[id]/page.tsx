// src/app/reports/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createBrowserClient } from '@/lib/supabase';
import { generatePDF } from '@/services/pdfService';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';
import { AnalyticsDataService, AnalyticsData } from '@/services/analyticsDataService';

export default function ReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  useEffect(() => {
    const fetchReport = async () => {
      if (!user || !id) return;
      
      try {
        setIsLoading(true);
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('Report not found');
        
        const reportData = data.report_data;
        
        // Check if this is real Instagram data or mock data
        const hasRealData = reportData?.raw_instagram_data || reportData?.raw_data;
        setIsRealData(hasRealData);
        
        let processedReport;
        if (hasRealData) {
          console.log('📊 Real Instagram data detected');
          processedReport = transformRealDataToMockStructure(reportData);
        } else {
          console.log('📊 Mock data detected');
          processedReport = reportData;
        }
        
        setReport(processedReport);
        
        // Process analytics data
        const analyticsResults = AnalyticsDataService.processReportData(processedReport);
        setAnalyticsData(analyticsResults);
        
        // Track report viewed
        analytics.track(ANALYTICS_EVENTS.REPORT_VIEWED, {
          report_id: id,
          instagram_handle: reportData.profile.username,
          overall_score: reportData.summary?.overallScore || 0,
          user_id: user.id,
          source: 'direct',
          followers_count: reportData.profile.followers_count,
          engagement_rate: reportData.profile.engagement_rate || 0,
          account_type: reportData.profile.account_type || 'PERSONAL',
          is_verified: reportData.profile.is_verified || false,
          data_type: hasRealData ? 'real' : 'mock'
        });
        
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReport();
  }, [id, user]);

  // Transform real Instagram data to match the expected mock data structure
  const transformRealDataToMockStructure = (realData: any) => {
    const rawInstagramData = realData.raw_instagram_data || realData.raw_data?.platform_data;
    const media = rawInstagramData?.media || [];
    const profile = realData.profile;
    const summary = realData.summary;

    return {
      profile: {
        ...profile,
        profile_picture_url: profile.profile_picture_url || '/default-avatar.png',
        is_verified: profile.is_verified || false,
        account_type: profile.account_type || 'PERSONAL'
      },
      summary: {
        overallScore: summary?.overallScore || Math.round((profile.engagement_rate || 0) * 10),
        strengths: [
          `${media.length} posts analyzed`,
          `${profile.followers_count.toLocaleString()} followers`,
          `${(profile.engagement_rate || 0).toFixed(2)}% engagement rate`
        ],
        weaknesses: [
          'Continue posting consistently',
          'Experiment with different content types',
          'Engage more with your audience'
        ],
        keyMetrics: {
          engagement: profile.engagement_rate || 0,
          followers: profile.followers_count || 0,
          posts: media.length || 0,
          avgLikes: summary?.avgLikes || Math.round(media.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0) / media.length) || 0,
          avgComments: summary?.avgComments || Math.round(media.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0) / media.length) || 0
        }
      },
      media: media, // Include media for analytics processing
      contentAnalysis: {
        topPosts: media.sort((a: any, b: any) => 
          ((b.like_count || 0) + (b.comments_count || 0)) - 
          ((a.like_count || 0) + (a.comments_count || 0))
        ).slice(0, 10),
        contentPatterns: {
          optimalCaptionLength: 125,
          hashtagsImportant: true,
          IMAGE: (profile.engagement_rate || 0) * 1.1,
          VIDEO: (profile.engagement_rate || 0) * 1.3
        },
        captionAnalysis: {
          averageLength: media.reduce((sum: number, post: any) => 
            sum + (post.caption?.length || 0), 0) / media.length || 0
        }
      }
    };
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    
    analytics.track(ANALYTICS_EVENTS.REPORT_DOWNLOADED, {
      report_id: id,
      instagram_handle: report.profile.username,
      format: 'pdf',
      user_id: user?.id,
      overall_score: report.summary.overallScore,
      current_tab: activeTab,
      data_type: isRealData ? 'real' : 'mock'
    });
    
    try {
      setIsPdfGenerating(true);
      const pdfBytes = await generatePDF(report);
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `instagram-report-${report.profile.username}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleTabSwitch = (tabId: string) => {
    analytics.track(ANALYTICS_EVENTS.TAB_SWITCHED, {
      from_tab: activeTab,
      to_tab: tabId,
      report_id: id,
      user_id: user?.id,
      instagram_handle: report?.profile.username,
      data_type: isRealData ? 'real' : 'mock'
    });
    
    setActiveTab(tabId);
  };

  const handlePrint = () => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'print_report',
      report_id: id,
      user_id: user?.id,
      instagram_handle: report?.profile.username,
      data_type: isRealData ? 'real' : 'mock'
    });
    
    window.print();
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-0"></div>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }
  
  if (error || !report || !analyticsData) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="bg-red-50 p-4 rounded-md text-red-700">
            {error || 'Report not found'}
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }
  
  const { monthlyMetrics, growthMetrics, contentInsights, currentMonth, previousMonth } = analyticsData;
  
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Data Type Badge */}
          {isRealData && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Real Instagram Data
              </span>
            </div>
          )}
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Instagram Analytics Report
              </h1>
              <p className="text-gray-500 mt-1">
                @{report.profile.username}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPdfGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
          
          {/* Profile Summary */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0">
                <img
                  src={report.profile.profile_picture_url || '/default-avatar.png'}
                  alt={report.profile.name}
                  className="h-16 w-16 rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
                <div className="sm:ml-6 flex-grow">
                  <h2 className="text-xl font-bold text-gray-900">{report.profile.name}</h2>
                  <p className="text-gray-500">@{report.profile.username}</p>
                  <div className="mt-2 flex flex-wrap space-x-2">
                    {report.profile.is_verified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {report.profile.account_type}
                    </span>
                  </div>
                </div>
                <div className="sm:ml-auto">
                  <div className="text-center bg-indigo-50 p-4 rounded-lg">
                    <div className="text-4xl font-bold text-indigo-600">
                      {report.summary.overallScore}
                    </div>
                    <div className="text-sm text-gray-500">Overall Score</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {report.summary.keyMetrics.posts?.toLocaleString() || 0}
                </div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {AnalyticsDataService.formatNumber(report.profile.followers_count || 0)}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {AnalyticsDataService.formatNumber(report.profile.follows_count || 0)}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(report.summary.keyMetrics.engagement || 0).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">Engagement Rate</div>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Performance Overview' },
                  { id: 'content', label: 'Content Analysis' },
                  { id: 'engagement', label: 'Engagement Details' },
                  { id: 'growth', label: 'Growth Analytics' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSwitch(tab.id)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          
          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <PerformanceOverview analyticsData={analyticsData} />
            )}
            
            {activeTab === 'content' && (
              <ContentAnalysisTab report={report} contentInsights={contentInsights} />
            )}
            
            {activeTab === 'engagement' && (
              <EngagementDetailsTab analyticsData={analyticsData} />
            )}
            
            {activeTab === 'growth' && (
              <GrowthAnalyticsTab analyticsData={analyticsData} />
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}

// Performance Overview Component
function PerformanceOverview({ analyticsData }: { analyticsData: AnalyticsData }) {
  const { monthlyMetrics, growthMetrics, contentInsights, currentMonth, previousMonth } = analyticsData;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Performance Overview</h2>
      
      {/* Key Growth Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Followers Growth */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Followers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {AnalyticsDataService.formatNumber(currentMonth.followers)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center ${AnalyticsDataService.getGrowthColor(growthMetrics.followersGrowth.changePercent)}`}>
                <span className="text-sm mr-1">
                  {AnalyticsDataService.getGrowthIcon(growthMetrics.followersGrowth.changePercent)}
                </span>
                <span className="text-sm font-semibold">
                  {AnalyticsDataService.formatPercentage(growthMetrics.followersGrowth.changePercent)}
                </span>
              </div>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last month:</span>
              <span className="font-medium">{AnalyticsDataService.formatNumber(previousMonth.followers)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Change:</span>
              <span className={`font-medium ${AnalyticsDataService.getGrowthColor(growthMetrics.followersGrowth.change)}`}>
                {growthMetrics.followersGrowth.change >= 0 ? '+' : ''}{AnalyticsDataService.formatNumber(growthMetrics.followersGrowth.change)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Engagement Per Post */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">💝</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Engagement/Post</p>
                <p className="text-2xl font-bold text-gray-900">
                  {AnalyticsDataService.formatNumber(currentMonth.avgEngagementPerPost)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center ${AnalyticsDataService.getGrowthColor(growthMetrics.engagementGrowth.changePercent)}`}>
                <span className="text-sm mr-1">
                  {AnalyticsDataService.getGrowthIcon(growthMetrics.engagementGrowth.changePercent)}
                </span>
                <span className="text-sm font-semibold">
                  {AnalyticsDataService.formatPercentage(growthMetrics.engagementGrowth.changePercent)}
                </span>
              </div>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last month:</span>
              <span className="font-medium">{AnalyticsDataService.formatNumber(previousMonth.avgEngagementPerPost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total this month:</span>
              <span className="font-medium">{AnalyticsDataService.formatNumber(currentMonth.totalEngagement)}</span>
            </div>
          </div>
        </div>
        
        {/* Posts Published */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Posts This Month</p>
                <p className="text-2xl font-bold text-gray-900">{currentMonth.totalPosts}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center ${AnalyticsDataService.getGrowthColor(growthMetrics.postsGrowth.changePercent)}`}>
                <span className="text-sm mr-1">
                  {AnalyticsDataService.getGrowthIcon(growthMetrics.postsGrowth.changePercent)}
                </span>
                <span className="text-sm font-semibold">
                  {AnalyticsDataService.formatPercentage(growthMetrics.postsGrowth.changePercent)}
                </span>
              </div>
              <p className="text-xs text-gray-500">vs last month</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last month:</span>
              <span className="font-medium">{previousMonth.totalPosts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg per week:</span>
              <span className="font-medium">{(currentMonth.totalPosts / 4).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Month over Month Growth Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Follower Growth Trend</h3>
        <div className="h-64">
          <FollowersGrowthChart data={monthlyMetrics} />
        </div>
      </div>
      
      {/* Content Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Categories Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Category Performance</h3>
          <div className="space-y-4">
            {contentInsights.categories.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-green-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-purple-500' :
                    index === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{category.category}</p>
                    <p className="text-sm text-gray-600">
                      {category.count} posts ({category.percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {AnalyticsDataService.formatNumber(category.avgEngagement)}
                  </p>
                  <p className="text-xs text-gray-500">avg engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Best vs Worst Performing Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Performance Insights</h3>
          
          {/* Best Performing */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🏆</span>
              <h4 className="font-semibold text-green-800">Best Performing</h4>
            </div>
            <p className="text-sm text-green-700 mb-2">
              <strong>{contentInsights.bestPerformingCategory.category}</strong>
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600">Avg Engagement:</p>
                <p className="font-semibold text-green-800">
                  {AnalyticsDataService.formatNumber(contentInsights.bestPerformingCategory.avgEngagement)}
                </p>
              </div>
              <div>
                <p className="text-green-600">Posts:</p>
                <p className="font-semibold text-green-800">
                  {contentInsights.bestPerformingCategory.count}
                </p>
              </div>
            </div>
          </div>
          
          {/* Improvement Opportunity */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">💡</span>
              <h4 className="font-semibold text-yellow-800">Improvement Opportunity</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-2">
              <strong>{contentInsights.underperformingCategory.category}</strong>
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-yellow-600">Avg Engagement:</p>
                <p className="font-semibold text-yellow-800">
                  {AnalyticsDataService.formatNumber(contentInsights.underperformingCategory.avgEngagement)}
                </p>
              </div>
              <div>
                <p className="text-yellow-600">Posts:</p>
                <p className="font-semibold text-yellow-800">
                  {contentInsights.underperformingCategory.count}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Key Insights & Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">💡</span>
          Key Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentInsights.recommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-indigo-100">
              <div className="flex items-start">
                <span className="text-indigo-600 mr-2 mt-1">•</span>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Engagement Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Month Engagement Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {AnalyticsDataService.formatNumber(currentMonth.totalLikes)}
            </div>
            <div className="text-sm text-red-600 font-medium">Total Likes</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: {AnalyticsDataService.formatNumber(currentMonth.totalLikes / (currentMonth.totalPosts || 1))} per post
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {AnalyticsDataService.formatNumber(currentMonth.totalComments)}
            </div>
            <div className="text-sm text-blue-600 font-medium">Total Comments</div>
            <div className="text-xs text-gray-500 mt-1">
              Avg: {AnalyticsDataService.formatNumber(currentMonth.totalComments / (currentMonth.totalPosts || 1))} per post
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {currentMonth.engagementRate.toFixed(2)}%
            </div>
            <div className="text-sm text-purple-600 font-medium">Engagement Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Industry avg: 1.9%
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {(currentMonth.totalComments / (currentMonth.totalLikes || 1) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-green-600 font-medium">Comment Rate</div>
            <div className="text-xs text-gray-500 mt-1">
              Comments per like
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Content Analysis Tab Component
function ContentAnalysisTab({ report, contentInsights }: { report: any, contentInsights: any }) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Content Analysis</h2>
      
      {/* Detailed Content Categories */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Content Category Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentInsights.categories.map((category: any, index: number) => (
            <div key={category.category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{category.category}</h4>
                <span className="text-sm text-gray-500">{category.count} posts</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Percentage:</span>
                  <span className="text-sm font-medium">{category.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Likes:</span>
                  <span className="text-sm font-medium">{AnalyticsDataService.formatNumber(category.avgLikes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Comments:</span>
                  <span className="text-sm font-medium">{AnalyticsDataService.formatNumber(category.avgComments)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Engagement:</span>
                  <span className="text-sm font-semibold text-indigo-600">{AnalyticsDataService.formatNumber(category.avgEngagement)}</span>
                </div>
              </div>
              
              {/* Performance Bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${Math.min(category.avgEngagement / contentInsights.bestPerformingCategory.avgEngagement * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((category.avgEngagement / contentInsights.bestPerformingCategory.avgEngagement) * 100).toFixed(0)}% of best category
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Performing Posts */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h3>
        <div className="space-y-4">
          {(report.contentAnalysis?.topPosts || []).slice(0, 5).map((post: any, index: number) => (
            <div key={post.id || index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
              <img 
                src={post.media_url || post.thumbnail_url || '/placeholder-image.png'} 
                alt="Post thumbnail"
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.png';
                }}
              />
              <div className="flex-grow">
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {post.caption?.slice(0, 120) || 'No caption'}...
                </p>
                <div className="flex space-x-6 text-sm">
                  <span className="flex items-center text-red-600">
                    ❤️ {(post.like_count || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center text-blue-600">
                    💬 {(post.comments_count || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center text-green-600">
                    📈 {((post.like_count || 0) + (post.comments_count || 0)).toLocaleString()} total
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {post.media_type || 'Image'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-indigo-600">
                  #{index + 1}
                </div>
                <div className="text-xs text-gray-500">
                  Top {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Engagement Details Tab Component
function EngagementDetailsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  const { monthlyMetrics, currentMonth } = analyticsData;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Engagement Details</h2>
      
      {/* Monthly Engagement Trend */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Engagement Trend</h3>
        <div className="h-64">
          <EngagementTrendChart data={monthlyMetrics} />
        </div>
      </div>
      
      {/* Engagement Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Rate Comparison</h3>
          <div className="space-y-4">
            {monthlyMetrics.slice(-3).map((month, index) => (
              <div key={`${month.month}-${month.year}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{month.month} {month.year}</p>
                  <p className="text-sm text-gray-600">{month.totalPosts} posts</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600">{month.engagementRate.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">engagement rate</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">❤️</span>
                <div>
                  <p className="font-medium text-gray-900">Likes</p>
                  <p className="text-sm text-gray-600">Total this month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{AnalyticsDataService.formatNumber(currentMonth.totalLikes)}</p>
                <p className="text-sm text-gray-500">{((currentMonth.totalLikes / currentMonth.totalEngagement) * 100).toFixed(0)}% of total</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💬</span>
                <div>
                  <p className="font-medium text-gray-900">Comments</p>
                  <p className="text-sm text-gray-600">Total this month</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600">{AnalyticsDataService.formatNumber(currentMonth.totalComments)}</p>
                <p className="text-sm text-gray-500">{((currentMonth.totalComments / currentMonth.totalEngagement) * 100).toFixed(0)}% of total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Growth Analytics Tab Component
function GrowthAnalyticsTab({ analyticsData }: { analyticsData: AnalyticsData }) {
  const { monthlyMetrics, growthMetrics } = analyticsData;
  
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900">Growth Analytics</h2>
      
      {/* Growth Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Follower Growth</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current:</span>
              <span className="font-semibold">{AnalyticsDataService.formatNumber(growthMetrics.followersGrowth.current)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Previous:</span>
              <span className="font-semibold">{AnalyticsDataService.formatNumber(growthMetrics.followersGrowth.previous)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change:</span>
              <span className={`font-semibold ${AnalyticsDataService.getGrowthColor(growthMetrics.followersGrowth.changePercent)}`}>
                {AnalyticsDataService.formatPercentage(growthMetrics.followersGrowth.changePercent)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Growth</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current:</span>
              <span className="font-semibold">{AnalyticsDataService.formatNumber(growthMetrics.engagementGrowth.current)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Previous:</span>
              <span className="font-semibold">{AnalyticsDataService.formatNumber(growthMetrics.engagementGrowth.previous)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change:</span>
              <span className={`font-semibold ${AnalyticsDataService.getGrowthColor(growthMetrics.engagementGrowth.changePercent)}`}>
                {AnalyticsDataService.formatPercentage(growthMetrics.engagementGrowth.changePercent)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Growth</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Current:</span>
              <span className="font-semibold">{growthMetrics.postsGrowth.current} posts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Previous:</span>
              <span className="font-semibold">{growthMetrics.postsGrowth.previous} posts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Change:</span>
              <span className={`font-semibold ${AnalyticsDataService.getGrowthColor(growthMetrics.postsGrowth.changePercent)}`}>
                {AnalyticsDataService.formatPercentage(growthMetrics.postsGrowth.changePercent)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Monthly Metrics Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Followers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlyMetrics.map((month) => (
                <tr key={`${month.month}-${month.year}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {month.month} {month.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {AnalyticsDataService.formatNumber(month.followers)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month.totalPosts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {AnalyticsDataService.formatNumber(month.avgEngagementPerPost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {month.engagementRate.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Chart Components
function FollowersGrowthChart({ data }: { data: any[] }) {
  const maxFollowers = Math.max(...data.map(d => d.followers));
  const minFollowers = Math.min(...data.map(d => d.followers));
  const range = maxFollowers - minFollowers;
  
  return (
    <div className="w-full h-full relative">
      <div className="flex items-end justify-between h-48 px-4 pb-8">
        {data.map((month, index) => {
          const height = range > 0 ? ((month.followers - minFollowers) / range) * 180 + 20 : 100;
          const isCurrentMonth = index === data.length - 1;
          const isGrowth = index > 0 && month.followers > data[index - 1].followers;
          
          return (
            <div key={`${month.month}-${month.year}`} className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm border">
                  {AnalyticsDataService.formatNumber(month.followers)}
                </div>
                {index > 0 && (
                  <div className={`text-xs mt-1 ${isGrowth ? 'text-green-600' : 'text-red-600'}`}>
                    {isGrowth ? '↗' : '↘'} {AnalyticsDataService.formatNumber(Math.abs(month.followers - data[index - 1].followers))}
                  </div>
                )}
              </div>
              
              <div 
                className={`w-8 rounded-t transition-all duration-500 ${
                  isCurrentMonth ? 'bg-indigo-600' : 
                  isGrowth ? 'bg-green-500' : 'bg-gray-400'
                }`}
                style={{ height: `${height}px` }}
              ></div>
              
              <div className="mt-2 text-xs text-gray-600 text-center">
                <div className="font-medium">{month.month.slice(0, 3)}</div>
                <div>{month.year}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500">
        <div>{AnalyticsDataService.formatNumber(maxFollowers)}</div>
        <div>{AnalyticsDataService.formatNumber((maxFollowers + minFollowers) / 2)}</div>
        <div>{AnalyticsDataService.formatNumber(minFollowers)}</div>
      </div>
      
      <div className="flex justify-center mt-4 space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-600 rounded mr-2"></div>
          <span>Current Month</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Growth</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
          <span>Decline</span>
        </div>
      </div>
    </div>
  );
}

function EngagementTrendChart({ data }: { data: any[] }) {
  const maxEngagement = Math.max(...data.map(d => d.avgEngagementPerPost));
  const minEngagement = Math.min(...data.map(d => d.avgEngagementPerPost));
  const range = maxEngagement - minEngagement;
  
  return (
    <div className="w-full h-full relative">
      <div className="flex items-end justify-between h-48 px-4 pb-8">
        {data.map((month, index) => {
          const height = range > 0 ? ((month.avgEngagementPerPost - minEngagement) / range) * 180 + 20 : 100;
          const isCurrentMonth = index === data.length - 1;
          const isGrowth = index > 0 && month.avgEngagementPerPost > data[index - 1].avgEngagementPerPost;
          
          return (
            <div key={`${month.month}-${month.year}`} className="flex flex-col items-center flex-1">
              <div className="relative mb-2">
                <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow-sm border">
                  {AnalyticsDataService.formatNumber(month.avgEngagementPerPost)}
                </div>
                {index > 0 && (
                  <div className={`text-xs mt-1 ${isGrowth ? 'text-green-600' : 'text-red-600'}`}>
                    {isGrowth ? '↗' : '↘'} {AnalyticsDataService.formatNumber(Math.abs(month.avgEngagementPerPost - data[index - 1].avgEngagementPerPost))}
                  </div>
                )}
              </div>
              
              <div 
                className={`w-8 rounded-t transition-all duration-500 ${
                  isCurrentMonth ? 'bg-purple-600' : 
                  isGrowth ? 'bg-green-500' : 'bg-gray-400'
                }`}
                style={{ height: `${height}px` }}
              ></div>
              
              <div className="mt-2 text-xs text-gray-600 text-center">
                <div className="font-medium">{month.month.slice(0, 3)}</div>
                <div>{month.year}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-gray-500">
        <div>{AnalyticsDataService.formatNumber(maxEngagement)}</div>
        <div>{AnalyticsDataService.formatNumber((maxEngagement + minEngagement) / 2)}</div>
        <div>{AnalyticsDataService.formatNumber(minEngagement)}</div>
      </div>
      
      <div className="flex justify-center mt-4 space-x-6 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-600 rounded mr-2"></div>
          <span>Current Month</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Growth</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
          <span>Decline</span>
        </div>
      </div>
    </div>
  );
}