'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Handle scroll effects
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    // Add entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white/90 backdrop-blur-md'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <span className="text-2xl transition-transform duration-300 group-hover:scale-110">📊</span>
              <span className="text-xl font-bold text-gray-900">SocialSage</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium"
              >
                Pricing
              </button>
              <Link 
                href="/about"
                className="text-gray-600 hover:text-indigo-600 transition-colors duration-300 font-medium"
              >
                About
              </Link>
            </div>

            <Link 
              href="/signup" 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-semibold"
            >
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-indigo-50 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-20 h-20 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-20 w-20 h-20 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className={`max-w-7xl mx-auto text-center relative z-10 transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <div className="mb-8">
            <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-bounce">
              🚀 Now with AI-Powered Insights
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Instagram Analytics That{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Drive Real Growth
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your Instagram presence with deep insights, actionable recommendations, 
              and beautiful reports that help you understand what works and what doesn't.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/signup"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 group"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">📈</span>
                <span>Start Free Analysis</span>
              </Link>
              <button 
                onClick={() => scrollToSection('demo')}
                className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-300 hover:border-indigo-300 hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 group"
              >
                <span className="transition-transform duration-300 group-hover:scale-110">👁️</span>
                <span>View Demo</span>
              </button>
            </div>
          </div>

          {/* Enhanced Demo Preview */}
          <div id="demo" className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-500 hover:shadow-3xl">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600 animate-pulse">📊</span>
                  <span className="font-bold text-gray-900">SocialSage Dashboard</span>
                </div>
                <div className="flex space-x-4 text-sm text-gray-500">
                  <span className="hover:text-indigo-600 transition-colors cursor-pointer">Dashboard</span>
                  <span className="hover:text-indigo-600 transition-colors cursor-pointer">Analytics</span>
                  <span className="hover:text-indigo-600 transition-colors cursor-pointer">Reports</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300 border border-green-200">
                  <div className="text-3xl font-bold text-green-700 mb-1">24.8K</div>
                  <div className="text-sm text-green-600 font-medium">Followers</div>
                  <div className="text-xs text-green-500 mt-1">↗️ +12% this month</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700 mb-1">4.2%</div>
                  <div className="text-sm text-blue-600 font-medium">Engagement</div>
                  <div className="text-xs text-blue-500 mt-1">↗️ +0.8% this month</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center transform hover:scale-105 transition-all duration-300 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-700 mb-1">89.2K</div>
                  <div className="text-sm text-purple-600 font-medium">Reach</div>
                  <div className="text-xs text-purple-500 mt-1">↗️ +23% this month</div>
                </div>
              </div>
              
              <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <span className="text-white font-semibold text-lg relative z-10">📈 Real-Time Analytics Dashboard</span>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="h-1 bg-white/30 rounded-full">
                    <div className="h-1 bg-white rounded-full w-3/4 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎯 Powerful Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Grow
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive analytics platform gives you deep insights into your Instagram performance 
              with actionable recommendations to boost your growth.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '📊',
                title: 'Deep Analytics',
                description: 'Get comprehensive insights into your followers, engagement rates, reach, and content performance with beautiful visualizations.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: '🤖',
                title: 'AI-Powered Insights',
                description: 'Our AI analyzes your content and provides personalized recommendations to optimize your posting strategy and increase engagement.',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: '📈',
                title: 'Growth Tracking',
                description: 'Monitor your follower growth, track engagement trends, and identify your best-performing content to replicate success.',
                gradient: 'from-green-500 to-emerald-500'
              },
              {
                icon: '📋',
                title: 'Beautiful Reports',
                description: 'Generate stunning PDF reports with all your key metrics and insights, perfect for clients, teams, or personal tracking.',
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-xl transition-all duration-500 group transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10K+', label: 'Accounts Analyzed' },
              { number: '500M+', label: 'Posts Processed' },
              { number: '98%', label: 'Customer Satisfaction' },
              { number: '24/7', label: 'Support Available' }
            ].map((stat, index) => (
              <div key={index} className="transform hover:scale-110 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-white/20 rounded-lg p-4">
                  {stat.number}
                </div>
                <div className="text-indigo-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Grow Your Instagram?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and businesses who are already using SocialSage 
            to optimize their Instagram strategy and drive real growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/signup"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center space-x-2 group"
            >
              <span className="transition-transform duration-300 group-hover:scale-110">🚀</span>
              <span>Start Your Free Trial</span>
            </Link>
            <Link 
              href="/contact"
              className="bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border-2 border-gray-300 hover:border-indigo-300 hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 group"
            >
              <span className="transition-transform duration-300 group-hover:scale-110">💬</span>
              <span>Talk to Sales</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">📊</span>
                <span className="text-xl font-bold">SocialSage</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Empowering creators and businesses with Instagram analytics that drive real growth 
                and meaningful engagement.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">Analytics</Link></li>
                <li><Link href="/reports" className="text-gray-400 hover:text-white transition-colors">Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-400 hover:text-white transition-colors">API</Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 SocialSage. All rights reserved. Built with ❤️ for Instagram creators.</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}