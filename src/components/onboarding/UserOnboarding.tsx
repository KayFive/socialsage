import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, TrendingUp, BarChart3, Target, Users, Zap, CheckCircle, Star, Clock, MessageCircle, Tag, Heart, Trophy, Unlock } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  userEmail?: string;
  instagramUsername?: string;
  hasInstagramData?: boolean;
  analytics?: {
    track: (event: string, properties?: any) => void;
  };
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  primaryAction: string;
  secondaryAction?: string;
  showProgress?: boolean;
}

const UserOnboarding: React.FC<OnboardingProps> = ({ 
  onComplete, 
  userEmail, 
  instagramUsername,
  hasInstagramData = false,
  analytics 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingStartTime] = useState(Date.now());
  const [completedFeatures, setCompletedFeatures] = useState<Set<string>>(new Set());

  // Track onboarding start
  useEffect(() => {
    analytics?.track('Onboarding Started', {
      user_email: userEmail,
      instagram_connected: hasInstagramData,
      onboarding_version: 'v2.0_content_focus'
    });
  }, []);

  const handleFeatureComplete = (featureId: string) => {
    setCompletedFeatures(prev => new Set([...prev, featureId]));
    analytics?.track('Onboarding Feature Completed', {
      feature: featureId,
      step: currentStep,
      time_spent: Date.now() - onboardingStartTime
    });
  };

  const steps: OnboardingStep[] = [
    // Step 1: Welcome
    {
      id: 'welcome',
      title: `Welcome to SocialSage! 👋`,
      subtitle: 'AI-powered Instagram growth insights',
      icon: <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
        <span className="text-white text-2xl font-bold">SS</span>
      </div>,
      primaryAction: 'Let\'s Begin',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Transform your Instagram strategy with AI-powered insights that actually work.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-medium text-blue-800">Smart Analytics</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-medium text-purple-800">AI Insights</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs font-medium text-green-800">Real Growth</div>
            </div>
          </div>
        </div>
      )
    },

    // Step 2: NEW - Content Categories Introduction
    {
      id: 'content_categories_intro',
      title: 'Content Categories Unlock Everything',
      subtitle: 'Tag your posts to unlock powerful insights',
      icon: <Tag className="w-8 h-8 text-cyan-600" />,
      primaryAction: 'Show Me How',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Tag className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              The secret to SocialSage's power? <strong>Content categories.</strong> By tagging your posts, you unlock a world of insights.
            </p>
          </div>
          
          {/* Category Examples */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-200">
              <div className="text-lg mb-1">📚</div>
              <div className="text-sm font-semibold text-purple-800">Tutorial</div>
              <div className="text-xs text-purple-600">How-to content</div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-3 border border-orange-200">
              <div className="text-lg mb-1">🎬</div>
              <div className="text-sm font-semibold text-orange-800">Behind Scenes</div>
              <div className="text-xs text-orange-600">Process videos</div>
            </div>
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl p-3 border border-green-200">
              <div className="text-lg mb-1">🛍️</div>
              <div className="text-sm font-semibold text-green-800">Product Demo</div>
              <div className="text-xs text-green-600">Showcases</div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-3 border border-blue-200">
              <div className="text-lg mb-1">✨</div>
              <div className="text-sm font-semibold text-blue-800">Lifestyle</div>
              <div className="text-xs text-blue-600">Personal content</div>
            </div>
          </div>

          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              <span className="font-semibold text-cyan-800">Why This Matters</span>
            </div>
            <p className="text-sm text-cyan-700">
              Tagging unlocks sentiment analysis, category performance comparison, optimal timing by content type, and AI recommendations tailored to your content strategy.
            </p>
          </div>
        </div>
      )
    },

    // Step 3: NEW - Progressive Unlocks
    {
      id: 'progressive_unlocks',
      title: 'Unlock Advanced Features',
      subtitle: 'Tag posts → Unlock insights → Grow faster',
      icon: <Unlock className="w-8 h-8 text-amber-600" />,
      primaryAction: 'I Want These Features!',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              The more posts you tag, the more powerful insights you unlock:
            </p>
          </div>
          
          {/* Progressive Unlock Levels */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">5</span>
                </div>
                <div>
                  <div className="font-semibold text-green-800">Basic Insights</div>
                  <div className="text-xs text-green-600">Tag 5 posts</div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              </div>
              <p className="text-sm text-green-700">Category performance & sentiment analysis</p>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">15</span>
                </div>
                <div>
                  <div className="font-semibold text-purple-800">Timing Analysis</div>
                  <div className="text-xs text-purple-600">Tag 15 posts</div>
                </div>
                <Clock className="w-5 h-5 text-purple-500 ml-auto" />
              </div>
              <p className="text-sm text-purple-700">Optimal posting times by content category</p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">25</span>
                </div>
                <div>
                  <div className="font-semibold text-blue-800">Cross-Analysis</div>
                  <div className="text-xs text-blue-600">Tag 25 posts</div>
                </div>
                <Target className="w-5 h-5 text-blue-500 ml-auto" />
              </div>
              <p className="text-sm text-blue-700">Category × format performance combinations</p>
            </div>

            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-amber-800">Full Strategy</div>
                  <div className="text-xs text-amber-600">Tag 100% of posts</div>
                </div>
                <Star className="w-5 h-5 text-amber-500 ml-auto" />
              </div>
              <p className="text-sm text-amber-700">Complete AI-powered growth strategy</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <p className="text-sm text-indigo-800 text-center">
              <strong>🚀 Pro Tip:</strong> Start with your 5 most recent posts to unlock Basic Insights immediately!
            </p>
          </div>
        </div>
      )
    },

    // Step 4: NEW - Updated Dashboard Tour showing new metrics
    {
      id: 'dashboard_tour_updated',
      title: 'Your Updated Dashboard',
      subtitle: 'New metrics that drive real growth',
      icon: <BarChart3 className="w-8 h-8 text-green-600" />,
      primaryAction: 'Explore Dashboard',
      showProgress: true,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Your dashboard now features 6 powerful metric categories:
          </p>
          
          {/* New Metric Cards Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-100 to-blue-100 rounded-xl p-3 border border-emerald-200">
              <div className="text-lg mb-1">📈</div>
              <div className="text-xs font-semibold text-emerald-800">Growth & Engagement</div>
              <div className="text-xs text-emerald-600">Combined view</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-200">
              <div className="text-lg mb-1">⏰</div>
              <div className="text-xs font-semibold text-purple-800">Timing Optimization</div>
              <div className="text-xs text-purple-600">Best posting times</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl p-3 border border-cyan-200">
              <div className="text-lg mb-1">🏷️</div>
              <div className="text-xs font-semibold text-cyan-800">Content Categories</div>
              <div className="text-xs text-cyan-600">Performance by type</div>
            </div>
            <div className="bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl p-3 border border-pink-200">
              <div className="text-lg mb-1">💬</div>
              <div className="text-xs font-semibold text-pink-800">Sentiment Analysis</div>
              <div className="text-xs text-pink-600">Audience emotions</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>New:</strong> Tap any metric card to see detailed analytics, trends, and actionable recommendations.
            </p>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">1,234</div>
                <div className="text-xs text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-600">+2.1%</div>
                <div className="text-xs text-gray-600">Growth</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">4.8%</div>
                <div className="text-xs text-gray-600">Engagement</div>
              </div>
              <div>
                <div className="text-lg font-bold text-pink-600">+12</div>
                <div className="text-xs text-gray-600">Sentiment</div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Step 5: Content Tagging Deep Dive (MOST IMPORTANT)
    {
      id: 'content_tagging_tutorial',
      title: 'Master Content Tagging',
      subtitle: 'Your key to unlocking all insights',
      icon: <Tag className="w-8 h-8 text-indigo-600" />,
      primaryAction: 'Start Tagging',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Tag className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              <strong>This is the most important step!</strong> Tagging your posts unlocks the full power of SocialSage.
            </p>
          </div>

          {/* How Tagging Works */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              How Tagging Works
            </h3>
            <div className="space-y-2 text-sm text-indigo-800">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                <span>Go to "Content Categories" in your dashboard</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                <span>Select posts and choose a category (Tutorial, Behind the Scenes, etc.)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                <span>Watch new insights unlock automatically!</span>
              </div>
            </div>
          </div>

          {/* What You'll Discover */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">What You'll Discover:</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center space-x-3">
                <Heart className="w-6 h-6 text-red-500" />
                <div>
                  <div className="font-medium text-gray-900">Which content gets the most engagement</div>
                  <div className="text-xs text-gray-600">Compare categories side by side</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">How people feel about each content type</div>
                  <div className="text-xs text-gray-600">Sentiment analysis by category</div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm flex items-center space-x-3">
                <Clock className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="font-medium text-gray-900">Best times to post each content type</div>
                  <div className="text-xs text-gray-600">Timing optimization by category</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-800 text-center">
              <strong>🎯 Quick Start:</strong> Tag just 5 posts to unlock your first insights!
            </p>
          </div>
        </div>
      )
    },

    // Step 6: NEW - Feature Showcase (Updated)
    {
      id: 'new_features_showcase',
      title: 'Powerful New Features',
      subtitle: 'See what makes SocialSage special',
      icon: <Star className="w-8 h-8 text-yellow-600" />,
      primaryAction: 'Explore Features',
      showProgress: true,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Here's what you can do with your tagged content:
          </p>
          
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl p-4 border border-pink-200">
              <div className="flex items-center space-x-3 mb-2">
                <MessageCircle className="w-6 h-6 text-pink-600" />
                <span className="font-semibold text-pink-800">Real Sentiment Analysis</span>
                <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-pink-700">
                We analyze actual comments to understand how your audience feels about different content types.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <Target className="w-6 h-6 text-blue-600" />
                <span className="font-semibold text-blue-800">Cross-Analysis</span>
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-blue-700">
                See which content categories perform best as Reels vs Posts vs Carousels.
              </p>
            </div>

            <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center space-x-3 mb-2">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-emerald-800">Combined Metrics</span>
                <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-emerald-700">
                Growth and engagement metrics unified in one comprehensive view.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">AI-Powered Recommendations</span>
            </div>
            <p className="text-sm text-yellow-700">
              Get personalized strategies based on your tagged content performance.
            </p>
          </div>
        </div>
      )
    },

    // Step 7: Data Connection (simplified)
    {
      id: 'data_connection',
      title: 'Connect Your Instagram',
      subtitle: 'Safe, secure, and instant setup',
      icon: <Users className="w-8 h-8 text-indigo-600" />,
      primaryAction: hasInstagramData ? 'View My Data' : 'Connect Instagram',
      showProgress: true,
      content: (
        <div className="space-y-4">
          {hasInstagramData ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instagram Connected!</h3>
                <p className="text-gray-600">
                  Perfect! Your Instagram account is connected and we're already analyzing your content.
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <p className="text-sm text-green-800">
                  ✨ <strong>Ready to tag:</strong> You can start tagging your posts immediately to unlock insights.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Connect your Instagram to start getting powerful insights:
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <span className="text-sm font-semibold text-blue-800">Secure OAuth Connection</span>
                    <p className="text-xs text-blue-700">We never store your password</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <span className="text-sm font-semibold text-green-800">Read-Only Access</span>
                    <p className="text-xs text-green-700">We can't post or modify anything</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                  <div>
                    <span className="text-sm font-semibold text-purple-800">Instant Analysis</span>
                    <p className="text-xs text-purple-700">See insights in under 30 seconds</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },

    // Step 8: NEW - Tagging Action Step
    {
      id: 'tagging_action',
      title: 'Let\'s Tag Your First Posts!',
      subtitle: 'Unlock insights in 2 minutes',
      icon: <Zap className="w-8 h-8 text-orange-600" />,
      primaryAction: 'Start Tagging Now',
      secondaryAction: 'Skip for Now',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <p className="text-gray-600 text-base leading-relaxed">
              Ready to see the magic? Let's tag your 5 most recent posts to unlock your first insights!
            </p>
          </div>

          {/* Mock Recent Posts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Your Recent Posts:</h3>
            <div className="space-y-2">
              {[
                { type: '🎬', title: 'How I built this app...', engagement: '245 likes' },
                { type: '📸', title: 'Coffee shop workspace setup', engagement: '189 likes' },
                { type: '🎬', title: 'Quick design tip for beginners', engagement: '312 likes' },
                { type: '📸', title: 'Behind the scenes coding', engagement: '156 likes' },
                { type: '📸', title: 'New project announcement', engagement: '98 likes' }
              ].map((post, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center space-x-3">
                  <div className="text-lg">{post.type}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                    <div className="text-xs text-gray-600">{post.engagement}</div>
                  </div>
                  <div className="text-xs bg-gray-100 px-2 py-1 rounded">Untagged</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-800">What Happens Next</span>
            </div>
            <div className="text-sm text-orange-700 space-y-1">
              <p>✅ Tag these 5 posts → Unlock Basic Insights</p>
              <p>✅ See which content performs best</p>
              <p>✅ Get your first sentiment analysis</p>
              <p>✅ Receive personalized recommendations</p>
            </div>
          </div>
        </div>
      )
    },

    // Step 9: Final - Ready to Grow
    {
      id: 'ready_to_grow',
      title: 'Ready to Accelerate Growth!',
      subtitle: 'Your Instagram success journey starts now',
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      primaryAction: 'Enter SocialSage',
      showProgress: true,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">You're All Set! 🎉</h3>
            <p className="text-gray-600 text-base leading-relaxed">
              You now have everything you need to grow your Instagram strategically with data-driven insights.
            </p>
          </div>

          {/* Quick Navigation Guide */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Quick Navigation:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🏷️</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-cyan-800">Content Categories</span>
                  <p className="text-xs text-cyan-700">Start here - tag posts to unlock insights</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">📊</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-800">Dashboard</span>
                  <p className="text-xs text-emerald-700">Overview of all your key metrics</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-purple-800">AI Coach</span>
                  <p className="text-xs text-purple-700">Get personalized growth strategies</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm text-green-800 text-center">
              <strong>🚀 Remember:</strong> Start by tagging 5 posts in Content Categories to see SocialSage's full power!
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      // Track onboarding completion
      analytics?.track('Onboarding Completed', {
        total_time_spent: Date.now() - onboardingStartTime,
        steps_completed: steps.length,
        features_explored: Array.from(completedFeatures),
        completion_rate: 100,
        version: 'v2.0_content_focus'
      });
      onComplete();
    } else {
      analytics?.track('Onboarding Step Completed', {
        step_id: currentStepData.id,
        step_number: currentStep + 1,
        time_on_step: Date.now() - onboardingStartTime
      });
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    analytics?.track('Onboarding Skipped', {
      step_when_skipped: currentStep + 1,
      time_spent: Date.now() - onboardingStartTime,
      version: 'v2.0_content_focus'
    });
    onComplete();
  };

  // Handle secondary action (for tagging step)
  const handleSecondaryAction = () => {
    if (currentStepData.id === 'tagging_action') {
      // Skip tagging but continue to final step
      analytics?.track('Tagging Skipped in Onboarding', {
        step: currentStep,
        reason: 'secondary_action'
      });
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <h2 className="text-white font-bold text-lg">{currentStepData.title}</h2>
                <p className="text-blue-100 text-sm">{currentStepData.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          {currentStepData.showProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-white text-sm mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={isFirstStep}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFirstStep 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex space-x-3">
              {currentStepData.secondaryAction && (
                <button
                  onClick={handleSecondaryAction}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {currentStepData.secondaryAction}
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <span>{currentStepData.primaryAction}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOnboarding;