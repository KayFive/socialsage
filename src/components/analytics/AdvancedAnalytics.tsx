'use client';

import { useState } from 'react';
import { TrendPrediction, ContentRecommendation, EngagementForecast } from '@/services/trendPredictionEngine';
import { ContentPattern, SentimentAnalysis, CompetitorInsight } from '@/services/advancedContentAnalyzer';

interface AdvancedAnalyticsProps {
  trendPredictions: TrendPrediction[];
  contentRecommendations: ContentRecommendation[];
  engagementForecast: EngagementForecast[];
  contentPatterns: ContentPattern[];
  sentimentAnalysis: SentimentAnalysis | null;
  competitorInsights: CompetitorInsight[];
}

export default function AdvancedAnalytics({
  trendPredictions,
  contentRecommendations,
  engagementForecast,
  contentPatterns,
  sentimentAnalysis,
  competitorInsights
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'recommendations' | 'patterns' | 'sentiment' | 'competitive'>('predictions');

  const tabs = [
    { id: 'predictions', label: '🔮 Trend Predictions', count: trendPredictions.length },
    { id: 'recommendations', label: '🎯 Content Recommendations', count: contentRecommendations.length },
    { id: 'patterns', label: '📊 Content Patterns', count: contentPatterns.length },
    { id: 'sentiment', label: '😊 Sentiment Analysis', count: sentimentAnalysis ? 1 : 0 },
    { id: 'competitive', label: '🕵️ Competitive Intelligence', count: competitorInsights.length }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100';
    if (priority >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-red-600 bg-red-100';
    if (impact === 'medium') return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'positive') return 'text-green-600 bg-green-100';
    if (sentiment === 'negative') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          🧠 Advanced Analytics
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          AI-powered insights and predictions for your content strategy
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Trend Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-4">
            {trendPredictions.length > 0 ? (
              trendPredictions.map((prediction) => (
                <div key={prediction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{prediction.prediction}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {(prediction.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          {prediction.trend_type.charAt(0).toUpperCase() + prediction.trend_type.slice(1)}
                        </span>
                        <span>⏱️ {prediction.timeframe}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(prediction.potential_impact)}`}>
                          {prediction.potential_impact} impact
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Data Points:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {prediction.data_points.map((point, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">Recommendation:</span> {prediction.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🔮</span>
                <p className="text-gray-600">No trend predictions available</p>
                <p className="text-sm text-gray-500">Need more data to generate predictions</p>
              </div>
            )}
          </div>
        )}

        {/* Content Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {contentRecommendations.length > 0 ? (
              contentRecommendations.map((recommendation) => (
                <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}>
                          Priority: {recommendation.priority}/10
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{recommendation.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                          {recommendation.recommendation_type.charAt(0).toUpperCase() + recommendation.recommendation_type.slice(1)}
                        </span>
                        <span>📈 {recommendation.expected_improvement}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.implementation_effort === 'high' ? 'bg-red-100 text-red-700' :
                          recommendation.implementation_effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {recommendation.implementation_effort} effort
                        </span>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-purple-800 mb-2">Action Steps:</h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                          {recommendation.specific_actions.map((action, index) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2 mt-2 flex-shrink-0"></span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🎯</span>
                <p className="text-gray-600">No content recommendations available</p>
                <p className="text-sm text-gray-500">Need more data to generate recommendations</p>
              </div>
            )}
          </div>
        )}

        {/* Content Patterns Tab */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            {contentPatterns.length > 0 ? (
              contentPatterns.map((pattern) => (
                <div key={pattern.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{pattern.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pattern.confidence)}`}>
                          {(pattern.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{pattern.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600">{(pattern.frequency * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-500">Frequency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{pattern.performance_impact.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">Impact Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">{pattern.pattern_type}</div>
                          <div className="text-xs text-gray-500">Type</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{pattern.examples.length}</div>
                          <div className="text-xs text-gray-500">Examples</div>
                        </div>
                      </div>
                      <div className="bg-green-50 border-l-4 border-green-400 p-3">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Recommendation:</span> {pattern.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">📊</span>
                <p className="text-gray-600">No content patterns detected</p>
                <p className="text-sm text-gray-500">Need more data to identify patterns</p>
              </div>
            )}
          </div>
        )}

        {/* Sentiment Analysis Tab */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            {sentimentAnalysis ? (
              <>
                {/* Overall Sentiment */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Overall Sentiment</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(sentimentAnalysis.overall_sentiment)}`}>
                      {sentimentAnalysis.overall_sentiment.charAt(0).toUpperCase() + sentimentAnalysis.overall_sentiment.slice(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">
                        {(sentimentAnalysis.sentiment_score * 100).toFixed(0)}
                      </div>
                      <div className="text-sm text-gray-600">Sentiment Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {sentimentAnalysis.sentiment_trend.charAt(0).toUpperCase() + sentimentAnalysis.sentiment_trend.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">Trend</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {sentimentAnalysis.top_positive_words.length}
                      </div>
                      <div className="text-sm text-gray-600">Positive Keywords</div>
                    </div>
                  </div>
                </div>

                {/* Emotion Breakdown */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotion Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(sentimentAnalysis.emotion_breakdown).map(([emotion, value]) => (
                      <div key={emotion} className="text-center">
                        <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{(value * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700 capitalize">{emotion}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                      😊 Top Positive Words
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sentimentAnalysis.top_positive_words.map((word, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center">
                      😔 Top Negative Words
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {sentimentAnalysis.top_negative_words.map((word, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">😊</span>
                <p className="text-gray-600">No sentiment analysis available</p>
                <p className="text-sm text-gray-500">Need caption data to analyze sentiment</p>
              </div>
            )}
          </div>
        )}

        {/* Competitive Intelligence Tab */}
        {activeTab === 'competitive' && (
          <div className="space-y-4">
            {competitorInsights.length > 0 ? (
              competitorInsights.map((insight) => (
                <div key={`${insight.insight_type}_${insight.title}_${Date.now()}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                          Priority: {insight.priority}/10
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                          {insight.insight_type.replace('_', ' ').charAt(0).toUpperCase() + insight.insight_type.replace('_', ' ').slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          insight.estimated_effort === 'high' ? 'bg-red-100 text-red-700' :
                          insight.estimated_effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {insight.estimated_effort} effort
                        </span>
                      </div>
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-3">
                        <p className="text-sm text-orange-800">
                          <span className="font-medium">Action:</span> {insight.actionable_advice}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-2 block">🕵️</span>
                <p className="text-gray-600">No competitive insights available</p>
                <p className="text-sm text-gray-500">Need more data to generate competitive analysis</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}