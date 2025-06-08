// src/components/insights/WeeklyWinsCard.tsx
'use client';

import { WeeklyWin } from '@/services/insightGenerator';
import { useState } from 'react';

interface WeeklyWinsCardProps {
  wins: WeeklyWin[];
}

export default function WeeklyWinsCard({ wins }: WeeklyWinsCardProps) {
  const [currentWinIndex, setCurrentWinIndex] = useState(0);
  
  if (wins.length === 0) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <div className="text-center">
          <span className="text-4xl mb-2 block">🌟</span>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Keep Creating!</h3>
          <p className="text-gray-600">Post more content this week to see your wins here.</p>
        </div>
      </div>
    );
  }
  
  const currentWin = wins[currentWinIndex];
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full -translate-y-16 translate-x-16"></div>
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentWin.title}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {currentWin.description}
            </p>
          </div>
          
          {/* Navigation dots */}
          {wins.length > 1 && (
            <div className="flex space-x-2 ml-4">
              {wins.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentWinIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentWinIndex ? 'bg-green-500' : 'bg-green-200'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Actionable tip */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-green-200">
          <div className="flex items-start space-x-3">
            <span className="text-green-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">Smart Tip</h4>
              <p className="text-gray-700 text-sm">{currentWin.actionable_tip}</p>
            </div>
          </div>
        </div>
        
        {/* Confidence indicator */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Based on your recent posts</span>
          <div className="flex items-center space-x-1">
            <span>Confidence:</span>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-3 rounded-full ${
                    i < Math.round(currentWin.confidence_score * 5) 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}