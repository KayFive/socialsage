import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  metric: {
    name: string;
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  timeFrame: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, timeFrame }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <TrendingUp className="w-6 h-6 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-6 h-6 text-red-500" />;
      default:
        return <Minus className="w-6 h-6 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm metric-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{metric.name}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-gray-900">{metric.value}</span>
          <div className={`w-2 h-2 rounded-full ${getTrendColor()}`}></div>
        </div>
      </div>
      <div className="h-12 bg-gray-50 rounded-md flex items-center justify-center">
        {getTrendIcon()}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} performance
      </div>
    </div>
  );
};

export default MetricCard;