// components/dashboard/WeeklyPerformanceCard.tsx
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface WeeklyPerformanceProps {
  performance: {
    currentWeek: {
      likes: number;
      comments: number;
      posts: number;
      shares: number;
      impressions: number;
    };
    previousWeek: {
      likes: number;
      comments: number;
      posts: number;
      shares: number;
      impressions: number;
    };
    changes: {
      likes: { value: number; percentage: number };
      comments: { value: number; percentage: number };
      posts: { value: number; percentage: number };
      shares: { value: number; percentage: number };
      impressions: { value: number; percentage: number };
    };
    topPost: {
      type: string;
      engagements: number;
      caption?: string;
    };
    smartTip: {
      title: string;
      description: string;
      confidence: string;
    };
  };
}

export default function WeeklyPerformanceCard({ performance }: WeeklyPerformanceProps) {
  const getChangeIcon = (percentage: number) => {
    if (percentage > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (percentage < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getChangeColor = (percentage: number) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">This Week's Performance</h2>
      
      {/* Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Posts */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📝</span>
            </div>
            <span className="text-sm font-medium text-blue-900">Posts</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 mb-1">
            {performance.currentWeek.posts}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor(performance.changes.posts.percentage)}`}>
            {getChangeIcon(performance.changes.posts.percentage)}
            <span>{Math.abs(performance.changes.posts.percentage).toFixed(1)}%</span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>

        {/* Likes */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">❤️</span>
            </div>
            <span className="text-sm font-medium text-red-900">Likes</span>
          </div>
          <div className="text-2xl font-bold text-red-900 mb-1">
            {formatNumber(performance.currentWeek.likes)}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor(performance.changes.likes.percentage)}`}>
            {getChangeIcon(performance.changes.likes.percentage)}
            <span>{Math.abs(performance.changes.likes.percentage).toFixed(1)}%</span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">💬</span>
            </div>
            <span className="text-sm font-medium text-yellow-900">Comments</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900 mb-1">
            {formatNumber(performance.currentWeek.comments)}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor(performance.changes.comments.percentage)}`}>
            {getChangeIcon(performance.changes.comments.percentage)}
            <span>{Math.abs(performance.changes.comments.percentage).toFixed(1)}%</span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>

        {/* Shares */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🔄</span>
            </div>
            <span className="text-sm font-medium text-green-900">Shares</span>
          </div>
          <div className="text-2xl font-bold text-green-900 mb-1">
            {formatNumber(performance.currentWeek.shares)}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor(performance.changes.shares.percentage)}`}>
            {getChangeIcon(performance.changes.shares.percentage)}
            <span>{Math.abs(performance.changes.shares.percentage).toFixed(1)}%</span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>

        {/* Impressions */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">👁️</span>
            </div>
            <span className="text-sm font-medium text-purple-900">Impressions</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 mb-1">
            {formatNumber(performance.currentWeek.impressions)}
          </div>
          <div className={`flex items-center space-x-1 text-sm ${getChangeColor(performance.changes.impressions.percentage)}`}>
            {getChangeIcon(performance.changes.impressions.percentage)}
            <span>{Math.abs(performance.changes.impressions.percentage).toFixed(1)}%</span>
            <span className="text-gray-500">vs last week</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Post */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Top Performing Post</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2">
            Your <span className="font-medium">{performance.topPost.type}</span> got{' '}
            <span className="font-bold text-indigo-600">{performance.topPost.engagements}</span> total engagements
          </p>
          {performance.topPost.caption && (
            <p className="text-xs text-gray-600 italic">
              "{performance.topPost.caption.slice(0, 100)}..."
            </p>
          )}
        </div>

        {/* Smart Tip */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">💡</span>
            <h3 className="font-semibold text-gray-900">Smart Tip</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2 font-medium">
            {performance.smartTip.title}
          </p>
          <p className="text-xs text-gray-600">
            {performance.smartTip.description}
          </p>
          <div className="mt-2">
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Confidence: {performance.smartTip.confidence}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}