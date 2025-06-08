// src/components/achievements/AchievementSection.tsx
'use client';

import { useState } from 'react';
import { Achievement, UserStats } from '@/services/achievementEngine';
import AchievementBadge from './AchievementBadge';
import { analytics, ANALYTICS_EVENTS } from '@/services/analytics/mixpanel';

interface AchievementSectionProps {
  achievements: Achievement[];
  userStats: UserStats;
  userId?: string;
}

export default function AchievementSection({ achievements, userStats, userId }: AchievementSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showShareModal, setShowShareModal] = useState<Achievement | null>(null);
  
  const categories = [
    { id: 'all', label: 'All', icon: '🏆' },
    { id: 'milestone', label: 'Milestones', icon: '🎯' },
    { id: 'engagement', label: 'Engagement', icon: '💬' },
    { id: 'content', label: 'Content', icon: '📸' },
    { id: 'growth', label: 'Growth', icon: '📈' },
    { id: 'consistency', label: 'Consistency', icon: '⚡' }
  ];
  
  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);
  
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);
  
  const handleAchievementClick = (achievement: Achievement) => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'achievement_clicked',
      achievement_id: achievement.id,
      achievement_unlocked: achievement.unlocked,
      user_id: userId
    });
    
    if (achievement.unlocked && achievement.shareText) {
      setShowShareModal(achievement);
    }
  };
  
  const handleShare = async (achievement: Achievement, platform: string) => {
    analytics.track(ANALYTICS_EVENTS.FEATURE_USED, {
      feature_name: 'achievement_shared',
      achievement_id: achievement.id,
      platform: platform,
      user_id: userId
    });
    
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(achievement.shareText || '');
        alert('Achievement shared text copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    } else if (platform === 'instagram') {
      // Open Instagram with pre-filled text (if possible)
      window.open('https://instagram.com', '_blank');
    }
    
    setShowShareModal(null);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          🏆 Achievements
        </h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-600">{userStats.total_achievements}</div>
          <div className="text-sm text-gray-500">Unlocked</div>
        </div>
      </div>
      
      {/* Achievement Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
          <div className="text-xl font-bold text-amber-700">{userStats.bronze_count}</div>
          <div className="text-xs text-amber-600">Bronze</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
          <div className="text-xl font-bold text-gray-700">{userStats.silver_count}</div>
          <div className="text-xs text-gray-600">Silver</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
          <div className="text-xl font-bold text-yellow-700">{userStats.gold_count}</div>
          <div className="text-xs text-yellow-600">Gold</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <div className="text-xl font-bold text-purple-700">{userStats.platinum_count}</div>
          <div className="text-xs text-purple-600">Platinum</div>
        </div>
      </div>
      
      {/* Achievement Score */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 mb-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Achievement Score</h4>
            <p className="text-sm text-gray-600">Your overall achievement ranking</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">{userStats.achievement_score}</div>
            <div className="text-sm text-indigo-500">points</div>
          </div>
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon} {category.label}
          </button>
        ))}
      </div>
      
      {/* Latest Achievement */}
      {userStats.latest_unlock && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-6 border border-green-200">
          <div className="flex items-center space-x-3">
            <AchievementBadge achievement={userStats.latest_unlock} size="medium" showProgress={false} />
            <div>
              <h4 className="font-semibold text-gray-900">🎉 Latest Achievement!</h4>
              <p className="text-sm text-gray-600">{userStats.latest_unlock.title}</p>
              <p className="text-xs text-gray-500 mt-1">{userStats.latest_unlock.description}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            Unlocked ({unlockedAchievements.length})
          </h4>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {unlockedAchievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="medium"
                showProgress={false}
                onClick={() => handleAchievementClick(achievement)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            In Progress ({lockedAchievements.length})
          </h4>
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {lockedAchievements.slice(0, 15).map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                size="medium"
                showProgress={true}
                onClick={() => handleAchievementClick(achievement)}
              />
            ))}
          </div>
          {lockedAchievements.length > 15 && (
            <p className="text-sm text-gray-500 mt-3 text-center">
              +{lockedAchievements.length - 15} more achievements to unlock
            </p>
          )}
        </div>
      )}
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AchievementBadge achievement={showShareModal} size="large" showProgress={false} />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{showShareModal.title}</h3>
                <p className="text-sm text-gray-600">{showShareModal.description}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700">{showShareModal.shareText}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleShare(showShareModal, 'copy')}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                📋 Copy Text
              </button>
              <button
                onClick={() => handleShare(showShareModal, 'instagram')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
              >
                📸 Instagram
              </button>
            </div>
            
            <button
              onClick={() => setShowShareModal(null)}
              className="w-full mt-3 py-2 px-4 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}