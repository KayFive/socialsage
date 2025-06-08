'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { createBrowserClient } from '@/lib/supabase';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';
import { InsightGenerator } from '@/services/insightGenerator';
import { NotificationEngine } from '@/services/notificationEngine';
import { BenchmarkingService } from '@/services/benchmarkingService';
import { InstagramService } from '@/services/instagramService';
import WeeklyPerformanceCard from '@/components/dashboard/WeeklyPerformanceCard';
import ActionableNotifications from '@/components/dashboard/ActionableNotifications';
import StreamlinedPeerComparison from '@/components/dashboard/StreamlinedPeerComparison';
import QuickActions from '@/components/actions/QuickActions';

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [weeklyPerformance, setWeeklyPerformance] = useState<any>(null);
  const [actionableNotifications, setActionableNotifications] = useState<any[]>([]);
  const [peerComparison, setPeerComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [instagramConnection, setInstagramConnection] = useState<any>(null);
  const [instagramConnections, setInstagramConnections] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const supabase = createBrowserClient();
        
        // Use the new Instagram service
        const instagramService = new InstagramService();
        const connections = await instagramService.getUserConnections(user.id);
        const primaryConnection = await instagramService.getPrimaryConnection(user.id);
        
        console.log('📱 Instagram connections:', connections);
        console.log('⭐ Primary connection:', primaryConnection);
        
        setInstagramConnection(primaryConnection);
        setInstagramConnections(connections);

        // Check if user just connected Instagram
        const justConnected = localStorage.getItem('instagram_just_connected');
        const connectedHandle = localStorage.getItem('connected_instagram_handle');
        if (justConnected && connectedHandle) {
          console.log(`🎉 Successfully connected @${connectedHandle}!`);
          localStorage.removeItem('instagram_just_connected');
          localStorage.removeItem('connected_instagram_handle');
        }
        
        // Fetch reports
        const { data: reportData, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (reportError) {
          console.error('Error fetching reports:', reportError);
        } else {
          setReports(reportData || []);
          
          // Generate insights for the latest report
          if (reportData && reportData.length > 0) {
            const latestReport = reportData[0];
            const previousReport = reportData.length > 1 ? reportData[1] : null;
            
            if (latestReport.status === 'completed' && latestReport.report_data) {
              try {
                // Generate weekly performance data
                const weeklyData = InsightGenerator.generateWeeklyPerformance(
                  latestReport.report_data, 
                  previousReport?.report_data
                );
                
                // Filter notifications to only actionable ones
                const allNotifications = NotificationEngine.generateNotifications(latestReport.report_data);
                const actionableOnly = Array.isArray(allNotifications) ? allNotifications.filter(notif => 
                  notif.action_label && (
                    notif.type === 'timing' || 
                    notif.type === 'opportunity' ||
                    notif.type === 'reminder'
                  )
                ) : [];
                
                // Generate streamlined peer comparison
                const comparison = BenchmarkingService.generateStreamlinedComparison(latestReport.report_data);
                
                console.log('📊 Generated weekly performance data');
                console.log('🔔 Generated actionable notifications:', actionableOnly.length, 'items');
                console.log('📈 Generated peer comparison');
                
                setWeeklyPerformance(weeklyData);
                setActionableNotifications(actionableOnly);
                setPeerComparison(comparison);
              } catch (error) {
                console.error('❌ Error generating insights:', error);
                console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
                // Set safe empty values on error
                setWeeklyPerformance(null);
                setActionableNotifications([]);
                setPeerComparison(null);
              }
            }
          }
        }
        
        // Fetch requests
        const { data: requestData, error: requestError } = await supabase
          .from('instagram_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (requestError) {
          console.error('Error fetching requests:', requestError);
        } else {
          setRequests(requestData || []);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            ✓ Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            ⏳ Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            ✗ Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            ⏱ Pending
          </span>
        );
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleViewReport = (reportId: string, username: string) => {
    analytics.track(ANALYTICS_EVENTS.REPORT_VIEWED, {
      report_id: reportId,
      instagram_handle: username,
      source: 'dashboard',
      user_id: user?.id,
    });
  };

  const handleNewAnalysisClick = () => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'new_analysis_button',
      source: 'dashboard',
      user_id: user?.id,
    });
  };

  const handleMobileViewClick = () => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'mobile_view_button',
      source: 'dashboard',
      user_id: user?.id,
    });
  };
  
  const totalAccounts = new Set(reports.map(r => r.report_data?.profile?.username)).size;
  const avgScore = reports.length > 0 
    ? Math.round(reports.reduce((sum, r) => {
        const score = r.report_data?.summary?.overallScore || 
                     r.report_data?.summary?.keyMetrics?.engagement || 0;
        return sum + score;
      }, 0) / reports.length)
    : 0;
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="text-xl font-bold text-gray-900">SocialSage</span>
                </Link>
                <div className="hidden md:flex items-center space-x-6 ml-8">
                  <Link href="/dashboard" className="text-indigo-600 font-semibold">Dashboard</Link>
                  <Link href="/reports" className="text-gray-600 hover:text-indigo-600 transition-colors">Reports</Link>
                  <Link href="/analysis/new" className="text-gray-600 hover:text-indigo-600 transition-colors">New Analysis</Link>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
                
                {/* Instagram Connection Status & Management */}
                {instagramConnection ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 font-medium">
                        @{instagramConnection.instagram_handle}
                      </span>
                      {instagramConnections.length > 1 && (
                        <span className="text-xs text-gray-500">
                          +{instagramConnections.length - 1} more
                        </span>
                      )}
                    </div>
                    <Link
                      href="/settings/instagram"
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-lg transition-colors"
                      title="Manage Instagram Accounts"
                    >
                      Manage
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/analysis/new"
                    className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
                  >
                    <span>📷</span>
                    <span>Connect Instagram</span>
                  </Link>
                )}
                
                {/* Mobile View Link */}
                <Link
                  href="/mobile"
                  onClick={handleMobileViewClick}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                >
                  <span>📱</span>
                  <span>Mobile View</span>
                </Link>
                
                <Link
                  href="/analysis/new"
                  onClick={handleNewAnalysisClick}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  New Analysis
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your Instagram analytics
            </p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Header - Similar to Reports Page */}
              {reports.length > 0 && reports[0].status === 'completed' && reports[0].report_data && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                        {(reports[0].report_data.profile?.profile_pic_url || 
                          reports[0].report_data.profile?.profile_picture_url) ? (
                          <img 
                            src={reports[0].report_data.profile.profile_pic_url || 
                                 reports[0].report_data.profile.profile_picture_url} 
                            alt={`@${reports[0].report_data.profile.username}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl" 
                          style={{display: (reports[0].report_data.profile?.profile_pic_url || 
                                           reports[0].report_data.profile?.profile_picture_url) ? 'none' : 'flex'}}
                        >
                          {(reports[0].report_data.profile?.username || 'U')[0].toUpperCase()}
                        </div>
                      </div>
                      
                      {/* Profile Info */}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {reports[0].report_data.profile?.full_name || 
                           reports[0].report_data.profile?.name || 
                           reports[0].report_data.profile?.username || 'Unknown User'}
                        </h2>
                        <p className="text-lg text-gray-600">
                          @{reports[0].report_data.profile?.username || 'unknown'}
                        </p>
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium mt-1">
                          {reports[0].report_data.profile?.category || 
                           reports[0].report_data.profile?.account_type || 'PERSONAL'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Overall Score */}
                    <div className="text-right">
                      <div className="text-4xl font-bold text-indigo-600 mb-1">
                        {reports[0].report_data.summary?.overallScore || 100}
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                  </div>
                  
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {reports[0].report_data.summary?.keyMetrics?.posts || reports[0].report_data.media?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Posts</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(reports[0].report_data.profile?.followers_count || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Followers</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(reports[0].report_data.profile?.follows_count || reports[0].report_data.profile?.following_count || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Following</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {(reports[0].report_data.summary?.keyMetrics?.engagement || reports[0].report_data.profile?.engagement_rate || 0).toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-600">Engagement Rate</div>
                    </div>
                  </div>
                  
                  {/* Follower Growth Chart - Weekly View */}
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Follower Growth Trend</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-end justify-between h-40 space-x-3">
                        {/* Generate last 5 weeks of follower data (Monday start) */}
                        {Array.from({length: 5}, (_, i) => {
                          const baseFollowers = reports[0].report_data.profile?.followers_count || 1000;
                          const weeklyGrowth = [62, 56, 53, 49, 0]; // Sample weekly growth, current week = 0 change
                          
                          // Calculate the total followers for each week
                          const totalGrowthFromStart = weeklyGrowth.slice(i + 1).reduce((sum, growth) => sum + growth, 0);
                          const weekFollowers = baseFollowers - totalGrowthFromStart;
                          const weeklyChange = weeklyGrowth[i];
                          const isCurrentWeek = i === 4; // Last week is current
                          
                          // Calculate Monday dates for the last 5 weeks
                          const today = new Date();
                          const currentMonday = new Date(today);
                          currentMonday.setDate(today.getDate() - today.getDay() + 1); // Get this Monday
                          
                          const weekMonday = new Date(currentMonday);
                          weekMonday.setDate(currentMonday.getDate() - (7 * (4 - i))); // Go back weeks
                          
                          const monthDay = `${(weekMonday.getMonth() + 1).toString().padStart(2, '0')}/${weekMonday.getDate().toString().padStart(2, '0')}`;
                          
                          // Calculate height (percentage of max)
                          const maxFollowers = baseFollowers;
                          const height = Math.max(60, (weekFollowers / maxFollowers) * 120);
                          
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center">
                              {/* Total followers label */}
                              <div className="mb-2 text-center">
                                <div className="text-sm font-semibold text-gray-800 bg-white px-2 py-1 rounded border shadow-sm">
                                  {weekFollowers.toLocaleString()}
                                </div>
                                {/* Weekly change label */}
                                {weeklyChange > 0 && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ↗ +{weeklyChange}
                                  </div>
                                )}
                                {weeklyChange === 0 && i === 4 && (
                                  <div className="text-xs text-gray-500 font-medium mt-1">
                                    Current
                                  </div>
                                )}
                              </div>
                              
                              {/* Bar */}
                              <div 
                                className={`w-full rounded-t transition-all ${
                                  isCurrentWeek ? 'bg-indigo-600' : 'bg-green-500'
                                }`}
                                style={{height: `${height}px`}}
                              ></div>
                              
                              {/* Week start date labels */}
                              <div className="mt-2 text-center">
                                <div className="text-xs text-gray-600 font-medium">
                                  {monthDay}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Week {i + 1}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Starting follower count reference */}
                      <div className="mt-4 text-xs text-gray-500">
                        {(reports[0].report_data.profile?.followers_count || 1000) - 220}
                      </div>
                      
                      {/* Legend */}
                      <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-indigo-600 rounded"></div>
                          <span className="text-gray-600">Current Week</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-gray-600">Growth</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-gray-400 rounded"></div>
                          <span className="text-gray-600">Decline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Focus Area - Weekly Performance */}
              {weeklyPerformance && (
                <WeeklyPerformanceCard performance={weeklyPerformance} />
              )}
              
              {/* Secondary Quick Wins - Actionable Notifications */}
              {actionableNotifications && actionableNotifications.length > 0 && (
                <ActionableNotifications notifications={actionableNotifications} />
              )}

              {/* Dashboard Widgets Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Recent Reports */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Reports</h2>
                        <Link
                          href="/reports"
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View all →
                        </Link>
                      </div>
                    </div>
                    
                    {reports.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {reports.slice(0, 3).map((report) => (
                          <div key={report.id} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <span className="text-indigo-600 font-semibold text-sm">
                                    {(report.report_data?.profile?.username || 'U')[0].toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    @{report.report_data?.profile?.username || 'Unknown'}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {formatDate(report.created_at)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {report.status === 'completed' && report.report_data?.summary?.overallScore && (
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      {report.report_data.summary.overallScore}/100
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {(report.report_data.summary.keyMetrics?.engagement || 0).toFixed(1)}% engagement
                                    </div>
                                  </div>
                                )}
                                
                                {getStatusBadge(report.status)}
                                
                                {report.status === 'completed' && (
                                  <Link
                                    href={`/reports/${report.id}`}
                                    onClick={() => handleViewReport(report.id, report.report_data?.profile?.username || 'Unknown')}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                                  >
                                    View
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-xl">📊</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">No reports yet</h3>
                        <p className="text-gray-600 mb-4">
                          Start by analyzing an Instagram account to see your first report here.
                        </p>
                        <Link
                          href="/analysis/new"
                          onClick={handleNewAnalysisClick}
                          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                          Create First Report
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <QuickActions 
                    reportData={reports.length > 0 ? reports[0].report_data : null}
                    userId={user?.id}
                  />

                  {/* Performance Stats */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Reports</span>
                        <span className="font-semibold text-gray-900">{reports.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Accounts Analyzed</span>
                        <span className="font-semibold text-gray-900">{totalAccounts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Average Score</span>
                        <span className="font-semibold text-gray-900">{avgScore}</span>
                      </div>
                      {reports.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Latest Analysis</span>
                          <span className="font-semibold text-gray-900">{formatDate(reports[0].created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Requests */}
                  {requests.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Recent Requests</h3>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                        {requests.slice(0, 3).map((request) => (
                          <div key={request.id} className="px-6 py-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-gray-900">
                                @{request.instagram_handle}
                              </span>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(request.created_at)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Peer Comparison (Collapsed by default) */}
              {peerComparison && (
                <StreamlinedPeerComparison comparison={peerComparison} />
              )}

              {/* Getting Started Section (for new users) */}
              {reports.length === 0 && requests.length === 0 && (
                <div className="bg-indigo-50 rounded-xl p-8 border border-indigo-100">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl text-white">🎉</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Welcome to SocialSage!</h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                      Get started with your first Instagram analytics report in just a few simple steps.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-8">
                      {[
                        { step: 1, title: "Start Analysis", desc: "Click 'New Analysis' button" },
                        { step: 2, title: "Enter Details", desc: "Add Instagram handle & info" },
                        { step: 3, title: "Wait for Magic", desc: "We analyze the account" },
                        { step: 4, title: "Get Insights", desc: "View your detailed report" }
                      ].map((item) => (
                        <div key={item.step} className="text-center">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">
                            {item.step}
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <Link
                        href="/analysis/new"
                        onClick={() => analytics.track(ANALYTICS_EVENTS.FEATURE_USED, { 
                          feature_name: 'start_first_analysis', 
                          source: 'getting_started',
                          user_id: user?.id 
                        })}
                        className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Start Your First Analysis
                      </Link>
                      
                      <Link
                        href="/mobile"
                        onClick={handleMobileViewClick}
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-300"
                      >
                        <span>📱</span>
                        <span>Try Mobile View</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}