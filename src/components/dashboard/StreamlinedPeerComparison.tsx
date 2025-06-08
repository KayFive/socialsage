// components/dashboard/StreamlinedPeerComparison.tsx
import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StreamlinedPeerComparisonProps {
  comparison: {
    metrics: Array<{
      name: string;
      userValue: number;
      peerAverage: number;
      peerMedian: number;
      percentile: number;
      unit: string;
      trend: 'up' | 'down' | 'neutral';
      insight: string;
    }>;
    totalPeers: number;
  };
}

export default function StreamlinedPeerComparison({ comparison }: StreamlinedPeerComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentile >= 25) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') return `${value.toFixed(1)}${unit}`;
    if (unit === 'posts') return value.toString();
    return value.toFixed(1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div 
        className="px-6 py-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Peer Comparison</h2>
            <p className="text-sm text-gray-600">vs {comparison.totalPeers.toLocaleString()} peers</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {isExpanded ? 'Show less' : 'Show details'}
            </span>
            {isExpanded ? 
              <ChevronUp className="w-5 h-5 text-gray-400" /> : 
              <ChevronDown className="w-5 h-5 text-gray-400" />
            }
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 py-4">
          <div className="space-y-6">
            {comparison.metrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{metric.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(metric.trend)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPercentileColor(metric.percentile)}`}>
                      {metric.percentile}th percentile
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900 text-lg">
                      {formatValue(metric.userValue, metric.unit)}
                    </div>
                    <div className="text-gray-600">Your Value</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 text-lg">
                      {formatValue(metric.peerAverage, metric.unit)}
                    </div>
                    <div className="text-gray-600">Peer Average</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-700 text-lg">
                      {formatValue(metric.peerMedian, metric.unit)}
                    </div>
                    <div className="text-gray-600">Peer Median</div>
                  </div>
                </div>

                {metric.insight && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">{metric.insight}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}