// src/components/benchmarking/PeerComparison.tsx
'use client';

import { PeerComparison as PeerComparisonType } from '@/services/benchmarkingService';

interface PeerComparisonProps {
  comparison: PeerComparisonType;
}

export default function PeerComparison({ comparison }: PeerComparisonProps) {
  const getComparisonIcon = (comparisonType: string) => {
    switch (comparisonType) {
      case 'above': return { icon: '📈', color: 'text-green-600', bg: 'bg-green-50' };
      case 'below': return { icon: '📉', color: 'text-red-600', bg: 'bg-red-50' };
      default: return { icon: '➡️', color: 'text-blue-600', bg: 'bg-blue-50' };
    }
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          📊 Peer Comparison
        </h3>
        <div className="text-right">
          <div className="text-lg font-bold text-indigo-600">{comparison.overall_rank}</div>
          <div className="text-sm text-gray-500">vs {comparison.total_peers.toLocaleString()} peers</div>
        </div>
      </div>
      
      {/* Achievement Rank */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 mb-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Achievement Rank</h4>
            <p className="text-sm text-gray-600">Based on unlocked achievements</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-purple-600">{comparison.achievement_rank}</div>
          </div>
        </div>
      </div>
      
      {/* Benchmarks */}
      <div className="space-y-4 mb-6">
        {comparison.benchmarks.map((benchmark, index) => {
          const comp = getComparisonIcon(benchmark.comparison);
          const percentage = benchmark.percentile;
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{benchmark.category}</h4>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${comp.bg}`}>
                  <span>{comp.icon}</span>
                  <span className={`text-sm font-medium ${comp.color}`}>
                    {percentage}th percentile
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {typeof benchmark.user_value === 'number' 
                      ? benchmark.user_value.toFixed(1) 
                      : benchmark.user_value}
                  </div>
                  <div className="text-xs text-gray-500">Your Value</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {benchmark.peer_average.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Peer Average</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {benchmark.peer_median.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Peer Median</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{benchmark.insight}</p>
              
              {benchmark.improvement_tip && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <span className="text-yellow-600">💡</span>
                    <p className="text-sm text-yellow-800">{benchmark.improvement_tip}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Next Milestone */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold text-gray-900 mb-2">🎯 Next Milestone</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {comparison.next_milestone.metric}: {comparison.next_milestone.current.toLocaleString()} → {comparison.next_milestone.target.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {comparison.next_milestone.gap.toLocaleString()} to go!
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-green-600">
              {Math.round((comparison.next_milestone.current / comparison.next_milestone.target) * 100)}%
            </div>
          </div>
        </div>
        <div className="w-full bg-green-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min((comparison.next_milestone.current / comparison.next_milestone.target) * 100, 100)}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}