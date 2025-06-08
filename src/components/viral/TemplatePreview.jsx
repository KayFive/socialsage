import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Share2, Clock, Users, TrendingUp, Target } from 'lucide-react';

const TemplatePreview = ({ template, onBack, onCustomize }) => {
  const [selectedExample, setSelectedExample] = useState(0);

  if (!template) return null;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{template.icon}</span>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(template.difficulty)}`}>
              {template.difficulty}
            </div>
          </div>
          <p className="text-gray-600">{template.description}</p>
        </div>

        <button
          onClick={() => onCustomize(template)}
          className="px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
        >
          Customize Template
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Engagement Boost</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{template.engagement_boost}</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-blue-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Save Rate</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{template.save_rate}</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-orange-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Time to Create</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{template.time_to_create}</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-purple-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Best For</span>
          </div>
          <div className="text-sm text-gray-600">{template.best_for.join(', ')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Structure */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Template Structure</h2>
          
          {/* Hook Templates */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Hook Options</h3>
            <div className="space-y-2">
              {template.structure.hook_templates.map((hook, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-purple-500">
                  <p className="text-sm text-gray-700 italic">"{hook}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content Flow */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Content Flow</h3>
            <div className="space-y-3">
              {template.structure.content_flow.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Formats */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Optimal Formats</h3>
            <div className="flex flex-wrap gap-2">
              {template.structure.optimal_formats.map(format => (
                <span key={format} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {format.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Strategy & Timing */}
        <div className="space-y-6">
          {/* Posting Strategy */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Posting Strategy</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">🟢 Best Times</h3>
                <p className="text-sm text-gray-700">{template.structure.posting_times.best}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-yellow-600 mb-2">🟡 Good Times</h3>
                <p className="text-sm text-gray-700">{template.structure.posting_times.good}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-2">🔴 Avoid</h3>
                <p className="text-sm text-gray-700">{template.structure.posting_times.avoid}</p>
              </div>
            </div>
          </div>

          {/* Hashtag Strategy */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hashtag Strategy</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Trending Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {template.structure.hashtag_strategy.trending.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p className="mb-1"><strong>Strategy:</strong> {template.structure.hashtag_strategy.niche_mix || template.structure.hashtag_strategy.engagement}</p>
                <p><strong>Count:</strong> {template.structure.hashtag_strategy.count}</p>
              </div>
            </div>
          </div>

          {/* Success Examples */}
          {template.examples && template.examples.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Success Examples</h2>
              
              <div className="space-y-4">
                {template.examples.map((example, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedExample === index ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedExample(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600">{example.niche}</span>
                      <span className="text-sm font-medium text-green-600">{example.engagement}</span>
                    </div>
                    <p className="text-sm text-gray-700 italic">"{example.hook}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Copy size={16} />
          Copy Template
        </button>
        
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Download size={16} />
          Download Guide
        </button>
        
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Share2 size={16} />
          Share Template
        </button>
        
        <button
          onClick={() => onCustomize(template)}
          className="px-8 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
        >
          Start Creating →
        </button>
      </div>
    </div>
  );
};

export default TemplatePreview;