import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Clock, TrendingUp, Users } from 'lucide-react';
import { VIRAL_TEMPLATES, getTemplatesByCategory, getTemplatesForNiche } from '../../data/viralTemplates';

const TemplateGallery = ({ onSelectTemplate, userNiche = null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('engagement');

  const categories = ['All', 'Transformation', 'Engagement', 'Educational', 'Authenticity'];
  
  const filteredTemplates = useMemo(() => {
    let templates = Object.values(VIRAL_TEMPLATES);
    
    // Filter by category
    if (selectedCategory !== 'All') {
      templates = getTemplatesByCategory(selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      templates = templates.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.best_for.some(niche => 
          niche.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Sort templates
    templates.sort((a, b) => {
      switch (sortBy) {
        case 'engagement':
          return parseInt(b.engagement_boost.replace('%', '').replace('+', '')) - 
                 parseInt(a.engagement_boost.replace('%', '').replace('+', ''));
        case 'difficulty':
          const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case 'time':
          return parseInt(a.time_to_create.split(' ')[0]) - parseInt(b.time_to_create.split(' ')[0]);
        default:
          return 0;
      }
    });
    
    return templates;
  }, [searchTerm, selectedCategory, sortBy]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Viral Content Templates 🚀
        </h1>
        <p className="text-gray-600">
          Proven frameworks that drive massive engagement. Choose a template and customize it for your niche.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="engagement">Highest Engagement</option>
            <option value="difficulty">Easiest First</option>
            <option value="time">Quickest to Create</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onSelectTemplate(template)}
          >
            {/* Template Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{template.icon}</div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {template.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4">
                {template.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-green-500" size={16} />
                  <span className="text-sm font-medium text-green-600">
                    {template.engagement_boost} engagement
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-500" size={16} />
                  <span className="text-sm text-gray-600">
                    {template.time_to_create}
                  </span>
                </div>
              </div>

              {/* Best For Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.best_for.slice(0, 3).map(niche => (
                  <span
                    key={niche}
                    className={`px-2 py-1 text-xs rounded-full ${
                      userNiche && niche.toLowerCase().includes(userNiche.toLowerCase())
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {niche}
                  </span>
                ))}
                {template.best_for.length > 3 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                    +{template.best_for.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Template Preview */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Example Hook:</h4>
                <p className="text-sm text-gray-600 italic">
                  "{template.structure.hook_templates[0]}"
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-500" size={16} />
                  <span className="text-sm text-gray-600">
                    {template.save_rate} save rate
                  </span>
                </div>
                
                <button className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition-colors">
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;