// src/components/actions/QuickActions.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  type: 'internal' | 'external' | 'share';
  href?: string;
}

interface QuickActionsProps {
  reportData?: any;
  userId?: string;
}

export default function QuickActions({ reportData, userId }: QuickActionsProps) {
  const [copiedInsight, setCopiedInsight] = useState<string | null>(null);
  
  const getBestPostingTime = () => {
    // Simple calculation for demo
    const hour = 19; // 7 PM
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };
  
  const shareInsight = async (insight: string) => {
    try {
      await navigator.clipboard.writeText(insight);
      setCopiedInsight(insight);
      
      analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
        feature_name: 'share_insight',
        insight_type: 'quick_tip',
        user_id: userId
      });
      
      setTimeout(() => setCopiedInsight(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };
  
  const quickActions: QuickAction[] = [
    {
      id: 'best_time',
      title: 'Best Time to Post Today',
      description: `Post at ${getBestPostingTime()} for maximum engagement`,
      icon: '⏰',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
          feature_name: 'best_time_reminder',
          user_id: userId
        });
      },
      type: 'internal'
    },
    {
      id: 'instagram_app',
      title: 'Open Instagram',
      description: 'Quick access to post or engage',
      icon: '📱',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
          feature_name: 'open_instagram',
          user_id: userId
        });
        window.open('https://instagram.com', '_blank');
      },
      type: 'external'
    },
    {
      id: 'share_tip',
      title: 'Share Growth Tip',
      description: 'Copy your personalized tip to share',
      icon: '💡',
      action: () => {
        const tip = `💡 Pro tip: ${reportData?.profile?.username ? `@${reportData.profile.username}` : 'Your account'} performs best with video content! Try posting more Reels for better engagement. #SocialSageInsights`;
        shareInsight(tip);
      },
      type: 'share'
    },
    {
      id: 'new_analysis',
      title: 'Analyze Another Account',
      description: 'Quick competitor analysis',
      icon: '🔍',
      action: () => {
        analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
          feature_name: 'quick_new_analysis',
          source: 'quick_actions',
          user_id: userId
        });
      },
      type: 'internal',
      href: '/analysis/new'
    }
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        ⚡ Quick Actions
      </h3>
      
      <div className="space-y-3">
        {quickActions.map((action) => {
          if (action.type === 'internal' && action.href) {
            return (
              <Link
                key={action.id}
                href={action.href}
                onClick={action.action}
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group"
              >
                <span className="text-2xl">{action.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          }
          
          return (
            <button
              key={action.id}
              onClick={action.action}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group text-left"
            >
              <span className="text-2xl">{action.icon}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              {action.type === 'share' && copiedInsight && (
                <span className="text-xs text-green-600 font-medium">Copied! ✓</span>
              )}
              {action.type === 'external' && (
                <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Voice Query Button (Future Feature) */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => {
            analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
              feature_name: 'voice_query_attempt',
              user_id: userId
            });
            alert('🎤 Voice queries coming soon! "Hey Social Sage, when should I post today?"');
          }}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 group"
        >
          <span className="text-lg">🎤</span>
          <span className="font-medium text-indigo-700 group-hover:text-indigo-800">
            Voice Query (Coming Soon)
          </span>
        </button>
      </div>
    </div>
  );
}