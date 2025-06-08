// src/components/achievements/AchievementBadge.tsx
'use client';

import { Achievement } from '@/services/achievementEngine';
import { useState } from 'react';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  onClick?: () => void;
}

export default function AchievementBadge({ 
  achievement, 
  size = 'medium', 
  showProgress = true,
  onClick 
}: AchievementBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const sizeClasses = {
    small: 'w-12 h-12 text-lg',
    medium: 'w-16 h-16 text-xl',
    large: 'w-20 h-20 text-2xl'
  };
  
  const getDifficultyColor = () => {
    switch (achievement.difficulty) {
      case 'bronze': return 'from-amber-600 to-amber-700 border-amber-500';
      case 'silver': return 'from-gray-400 to-gray-500 border-gray-400';
      case 'gold': return 'from-yellow-400 to-yellow-500 border-yellow-400';
      case 'platinum': return 'from-purple-500 to-purple-600 border-purple-400';
      default: return 'from-gray-300 to-gray-400 border-gray-300';
    }
  };
  
  const getProgressPercentage = () => {
    if (!achievement.max_progress || !achievement.progress) return 0;
    return Math.min((achievement.progress / achievement.max_progress) * 100, 100);
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        onClick={onClick}
        className={`
          ${sizeClasses[size]} 
          relative rounded-full border-2 flex items-center justify-center cursor-pointer
          transition-all duration-300 transform hover:scale-110
          ${achievement.unlocked 
            ? `bg-gradient-to-br ${getDifficultyColor()} text-white shadow-lg` 
            : 'bg-gray-100 border-gray-300 text-gray-400'
          }
          ${onClick ? 'hover:shadow-xl' : ''}
        `}
      >
        <span className="font-bold">{achievement.icon}</span>
        
        {/* Unlock indicator */}
        {achievement.unlocked && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
        
        {/* Progress ring for unfinished achievements */}
        {!achievement.unlocked && showProgress && achievement.max_progress && (
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
                strokeDasharray={`${getProgressPercentage()}, 100`}
                className="transition-all duration-500"
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-sm rounded-lg py-2 px-3 max-w-48 text-center">
            <div className="font-semibold">{achievement.title}</div>
            <div className="text-xs text-gray-300 mt-1">{achievement.description}</div>
            
            {!achievement.unlocked && achievement.max_progress && (
              <div className="text-xs text-gray-400 mt-2">
                Progress: {achievement.progress?.toLocaleString() || 0} / {achievement.max_progress.toLocaleString()}
              </div>
            )}
            {achievement.unlocked && achievement.unlocked_at && (
             <div className="text-xs text-green-300 mt-2">
               Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
             </div>
           )}
           
           <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
         </div>
       </div>
     )}
   </div>
 );
}