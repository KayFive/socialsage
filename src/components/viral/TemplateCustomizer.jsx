import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wand2, Copy, Download, Share2, Lightbulb } from 'lucide-react';

const TemplateCustomizer = ({ template, userProfile, onBack, onSave }) => {
  const [customizedContent, setCustomizedContent] = useState({
    selectedHook: '',
    customHook: '',
    contentSteps: [],
    selectedFormat: '',
    hashtags: [],
    niche: userProfile?.niche || '',
    audience: userProfile?.audience || 'general'
  });

  const [generatedSuggestions, setGeneratedSuggestions] = useState({
    hooks: [],
    hashtags: [],
    contentIdeas: []
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (template) {
      setCustomizedContent(prev => ({
        ...prev,
        selectedHook: template.structure.hook_templates[0],
        selectedFormat: template.structure.optimal_formats[0],
        contentSteps: template.structure.content_flow.map(step => ({
          title: step.split(':')[0],
          content: '',
          placeholder: step.split(':')[1]?.trim() || 'Add your content here...'
        }))
      }));
      generatePersonalizedSuggestions();
    }
  }, [template, userProfile]);

  const generatePersonalizedSuggestions = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation - replace with actual AI service
    setTimeout(() => {
      const nicheSpecificHooks = generateNicheHooks(template, customizedContent.niche);
      const nicheHashtags = generateNicheHashtags(template, customizedContent.niche);
      const contentIdeas = generateContentIdeas(template, customizedContent.niche);
      
      setGeneratedSuggestions({
        hooks: nicheSpecificHooks,
        hashtags: nicheHashtags,
        contentIdeas: contentIdeas
      });
      setIsGenerating(false);
    }, 2000);
  };

  const generateNicheHooks = (template, niche) => {
    const baseHooks = template.structure.hook_templates;
    const nicheMap = {
      'fitness': [
        'From out of shape to [GOAL] in [TIME]',
        'The workout that changed everything',
        'Why I stopped [BAD HABIT] and started [GOOD HABIT]'
      ],
      'business': [
        'From $0 to [REVENUE] in [TIME]',
        'The business mistake that cost me [AMOUNT]',
        'Why most [NICHE] businesses fail'
      ],
      'tech': [
        'The coding trick that saves me hours',
        'Why I switched from [OLD TOOL] to [NEW TOOL]',
        'The bug that taught me everything'
      ]
    };
    
    return nicheMap[niche?.toLowerCase()] || baseHooks;
  };

  const generateNicheHashtags = (template, niche) => {
    const baseHashtags = template.structure.hashtag_strategy.trending;
    const nicheHashtags = {
      'fitness': ['#fitness', '#workout', '#transformation', '#healthylifestyle'],
      'business': ['#entrepreneur', '#business', '#startup', '#businesstips'],
      'tech': ['#coding', '#programming', '#tech', '#developer']
    };
    
    return [...baseHashtags, ...(nicheHashtags[niche?.toLowerCase()] || [])];
  };

  const generateContentIdeas = (template, niche) => {
    return [
      `Share your personal ${niche} journey`,
      `Common mistakes in ${niche} and how to avoid them`,
      `Tools and resources that changed your ${niche} game`
    ];
  };

  const handleHookSelect = (hook) => {
    setCustomizedContent(prev => ({
      ...prev,
      selectedHook: hook,
      customHook: hook
    }));
  };

  const handleStepUpdate = (index, content) => {
    setCustomizedContent(prev => ({
      ...prev,
      contentSteps: prev.contentSteps.map((step, i) => 
        i === index ? { ...step, content } : step
      )
    }));
  };

  const handleHashtagToggle = (hashtag) => {
    setCustomizedContent(prev => ({
      ...prev,
      hashtags: prev.hashtags.includes(hashtag)
        ? prev.hashtags.filter(h => h !== hashtag)
        : [...prev.hashtags, hashtag]
    }));
  };

  const generatePost = () => {
    const post = {
      template_id: template.id,
      hook: customizedContent.customHook || customizedContent.selectedHook,
      content: customizedContent.contentSteps.map(step => step.content).join('\n\n'),
      format: customizedContent.selectedFormat,
      hashtags: customizedContent.hashtags,
      predicted_engagement: calculatePredictedEngagement()
    };
    
    onSave(post);
  };

  const calculatePredictedEngagement = () => {
    // Simple prediction algorithm - replace with actual ML model
    let score = 50; // base score
    
    if (customizedContent.customHook.length > 0) score += 10;
    if (customizedContent.contentSteps.every(step => step.content.length > 10)) score += 15;
    if (customizedContent.hashtags.length >= 10) score += 10;
    if (customizedContent.hashtags.length <= 30) score += 5;
    
    return Math.min(score, 95);
  };

  if (!template) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Customize: {template.name}
          </h1>
          <p className="text-gray-600">
            Personalize this template for your {customizedContent.niche} audience
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">Predicted Engagement</div>
          <div className="text-2xl font-bold text-green-600">
            {calculatePredictedEngagement()}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customization Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hook Selection */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="text-yellow-500" size={20} />
              <h2 className="text-xl font-bold text-gray-900">Hook Selection</h2>
            </div>
            
            <div className="space-y-3 mb-4">
              {template.structure.hook_templates.map((hook, index) => (
                <label key={index} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="hook"
                    value={hook}
                    checked={customizedContent.selectedHook === hook}
                    onChange={() => handleHookSelect(hook)}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">"{hook}"</span>
                </label>
              ))}
            </div>

            {generatedSuggestions.hooks.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  AI-Generated for {customizedContent.niche}:
                </h3>
                <div className="space-y-2">
                  {generatedSuggestions.hooks.map((hook, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="hook"
                        value={hook}
                        checked={customizedContent.selectedHook === hook}
                        onChange={() => handleHookSelect(hook)}
                        className="mt-1"
                      />
                      <span className="text-sm text-purple-700 font-medium">"{hook}"</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Hook:
              </label>
              <textarea
                value={customizedContent.customHook}
                onChange={(e) => setCustomizedContent(prev => ({ ...prev, customHook: e.target.value }))}
                placeholder="Write your own hook..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
              />
            </div>
          </div>

          {/* Content Structure */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content Structure</h2>
            
            <div className="space-y-4">
              {customizedContent.contentSteps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                  </div>
                  
                  <textarea
                    value={step.content}
                    onChange={(e) => handleStepUpdate(index, e.target.value)}
                    placeholder={step.placeholder}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content Format</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {template.structure.optimal_formats.map(format => (
                <label
                  key={format}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    customizedContent.selectedFormat === format
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={customizedContent.selectedFormat === format}
                    onChange={(e) => setCustomizedContent(prev => ({ ...prev, selectedFormat: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-900 mb-1">
                      {format.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format === 'carousel' && 'Multiple slides, high engagement'}
                      {format === 'reel' && 'Video content, maximum reach'}
                      {format === 'story_series' && 'Story highlights, personal touch'}
                      {format === 'text_post' && 'Simple text, easy to create'}
                      {format === 'live' && 'Real-time interaction'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Hashtag Strategy */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hashtag Strategy</h2>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Selected ({customizedContent.hashtags.length}/30)
                </span>
                <span className={`text-sm ${
                  customizedContent.hashtags.length >= 10 && customizedContent.hashtags.length <= 30
                    ? 'text-green-600' : 'text-red-600'
                }`}>
                  {customizedContent.hashtags.length < 10 ? 'Add more hashtags' : 
                   customizedContent.hashtags.length > 30 ? 'Too many hashtags' : 'Perfect range'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {customizedContent.hashtags.map(hashtag => (
                  <span
                    key={hashtag}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm cursor-pointer hover:bg-purple-200"
                    onClick={() => handleHashtagToggle(hashtag)}
                  >
                    {hashtag} ×
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Trending Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.structure.hashtag_strategy.trending.map(hashtag => (
                    <button
                      key={hashtag}
                      onClick={() => handleHashtagToggle(hashtag)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        customizedContent.hashtags.includes(hashtag)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {hashtag}
                    </button>
                  ))}
                </div>
              </div>

              {generatedSuggestions.hashtags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Niche-Specific Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedSuggestions.hashtags.map(hashtag => (
                      <button
                        key={hashtag}
                        onClick={() => handleHashtagToggle(hashtag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          customizedContent.hashtags.includes(hashtag)
                            ? 'bg-purple-500 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {hashtag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-white rounded-lg border p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                {customizedContent.selectedFormat.replace('_', ' ').toUpperCase()}
              </div>
              
              <div className="bg-white rounded-lg p-4 border">
                <p className="font-medium text-gray-900 mb-3">
                  {customizedContent.customHook || customizedContent.selectedHook}
                </p>
                
                <div className="space-y-2 text-sm text-gray-700">
                  {customizedContent.contentSteps
                    .filter(step => step.content.length > 0)
                    .map((step, index) => (
                      <p key={index}>{step.content}</p>
                    ))
                  }
                </div>
                
                {customizedContent.hashtags.length > 0 && (
                  <div className="mt-3 text-sm text-blue-600">
                    {customizedContent.hashtags.join(' ')}
                  </div>
                )}
              </div>
            </div>

            {/* Prediction Metrics */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Engagement Score</span>
                <span className="font-medium text-green-600">
                  {calculatePredictedEngagement()}%
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Viral Potential</span>
                <span className="font-medium text-purple-600">
                  {calculatePredictedEngagement() > 80 ? 'High' : 
                   calculatePredictedEngagement() > 60 ? 'Medium' : 'Low'}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Best Time to Post</span>
                <span className="font-medium text-blue-600">
                  {template.structure.posting_times.best.split(' ')[0]}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={generatePost}
                className="w-full px-4 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
              >
                Save Post
              </button>
              
              <div className="grid grid-cols-3 gap-2">
                <button className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <Copy size={14} />
                  Copy
                </button>
                
                <button className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <Download size={14} />
                  Export
                </button>
                
                <button className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm">
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Content Ideas */}
          {generatedSuggestions.contentIdeas.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Content Ideas</h2>
              <div className="space-y-2">
                {generatedSuggestions.contentIdeas.map((idea, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    💡 {idea}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCustomizer;