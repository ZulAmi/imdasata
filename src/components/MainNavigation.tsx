/**
 * SATA Main Navigation Component
 * Includes navigation to all analytics and voice sentiment features
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  description: string;
  category: 'analytics' | 'voice' | 'gamification' | 'integration';
  isNew?: boolean;
}

const MainNavigation = () => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const navigationItems: NavigationItem[] = [
    // Analytics
    {
      id: 'engagement-analytics',
      label: 'Engagement Analytics',
      icon: '📊',
      path: '/engagement-analytics',
      description: 'Track user engagement patterns, retention, and feature usage',
      category: 'analytics'
    },
    {
      id: 'analytics-hub',
      label: 'Analytics Hub',
      icon: '🎯',
      path: '/analytics-hub',
      description: 'Combined dashboard for engagement and gamification metrics',
      category: 'analytics'
    },

    // Voice Sentiment Analysis
    {
      id: 'voice-sentiment',
      label: 'Voice Sentiment Analysis',
      icon: '🎙️',
      path: '/voice-sentiment-demo',
      description: 'AI-powered emotional insights from voice notes using Azure Cognitive Services',
      category: 'voice',
      isNew: true
    },

    // Gamification
    {
      id: 'gamification',
      label: 'Gamification System',
      icon: '🎮',
      path: '/gamification-dashboard',
      description: 'Points, badges, leaderboards, and challenges for user motivation',
      category: 'gamification'
    },

    // Integration
    {
      id: 'integrated-hub',
      label: 'Integrated Analytics Hub',
      icon: '🔬',
      path: '/integrated-analytics-hub',
      description: 'Comprehensive insights combining engagement tracking and voice sentiment',
      category: 'integration',
      isNew: true
    }
  ];

  const categories = [
    { id: 'all', label: 'All Features', icon: '🌟' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'voice', label: 'Voice AI', icon: '🎙️' },
    { id: 'gamification', label: 'Gamification', icon: '🎮' },
    { id: 'integration', label: 'Integration', icon: '🔬' }
  ];

  const filteredItems = activeCategory === 'all' 
    ? navigationItems 
    : navigationItems.filter(item => item.category === activeCategory);

  const handleNavigation = (path: string, itemId: string) => {
    // Track navigation in a real app
    console.log(`Navigating to ${itemId}: ${path}`);
    
    // In a real Next.js app, this would be:
    // router.push(path);
    
    // For demo purposes, we'll show an alert
    alert(`Navigation Demo: Would navigate to ${path}\n\nIn a real implementation, this would use Next.js router.push()`);
  };

  const getCategoryCount = (categoryId: string) => {
    if (categoryId === 'all') return navigationItems.length;
    return navigationItems.filter(item => item.category === categoryId).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">🎯 SATA Feature Navigation</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Comprehensive mental health platform with analytics, voice AI, and gamification
            </p>
            <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
              <span>📊 User Engagement Tracking</span>
              <span>•</span>
              <span>🎙️ Voice Sentiment Analysis</span>
              <span>•</span>
              <span>🎮 Gamification System</span>
              <span>•</span>
              <span>🔬 Integrated Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-200 ${
                activeCategory === category.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                {getCategoryCount(category.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{item.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
                      {item.isNew && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mt-1">
                          NEW ✨
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {item.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.category === 'analytics' ? 'bg-blue-100 text-blue-800' :
                    item.category === 'voice' ? 'bg-purple-100 text-purple-800' :
                    item.category === 'gamification' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {item.category}
                  </span>
                  
                  <button
                    onClick={() => handleNavigation(item.path, item.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Open →
                  </button>
                </div>
              </div>

              {/* Feature Preview */}
              <div className="px-6 pb-6">
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features:</h4>
                  <div className="space-y-1">
                    {item.id === 'engagement-analytics' && (
                      <>
                        <div className="text-xs text-gray-600">• Daily/Weekly/Monthly active users</div>
                        <div className="text-xs text-gray-600">• Feature usage patterns</div>
                        <div className="text-xs text-gray-600">• Retention and churn analysis</div>
                      </>
                    )}
                    {item.id === 'voice-sentiment' && (
                      <>
                        <div className="text-xs text-gray-600">• Real-time speech-to-text</div>
                        <div className="text-xs text-gray-600">• Emotion and mood analysis</div>
                        <div className="text-xs text-gray-600">• Proactive crisis interventions</div>
                      </>
                    )}
                    {item.id === 'gamification' && (
                      <>
                        <div className="text-xs text-gray-600">• Points and badges system</div>
                        <div className="text-xs text-gray-600">• Social leaderboards</div>
                        <div className="text-xs text-gray-600">• Achievement challenges</div>
                      </>
                    )}
                    {item.id === 'integrated-hub' && (
                      <>
                        <div className="text-xs text-gray-600">• Combined analytics dashboard</div>
                        <div className="text-xs text-gray-600">• Cross-platform correlations</div>
                        <div className="text-xs text-gray-600">• AI-generated insights</div>
                      </>
                    )}
                    {item.id === 'analytics-hub' && (
                      <>
                        <div className="text-xs text-gray-600">• Engagement + gamification metrics</div>
                        <div className="text-xs text-gray-600">• Performance comparisons</div>
                        <div className="text-xs text-gray-600">• User behavior insights</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* System Architecture Overview */}
        <div className="mt-12 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">🏗️ System Architecture Overview</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Frontend Layer */}
            <div className="text-center">
              <div className="text-4xl mb-3">⚛️</div>
              <h4 className="font-medium text-gray-900 mb-2">Frontend Layer</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>React 18 + TypeScript</li>
                <li>Next.js 14.2.15</li>
                <li>Tailwind CSS</li>
                <li>Real-time UI updates</li>
              </ul>
            </div>

            {/* Analytics Engine */}
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h4 className="font-medium text-gray-900 mb-2">Analytics Engine</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Engagement tracking</li>
                <li>User behavior analysis</li>
                <li>Retention metrics</li>
                <li>Performance insights</li>
              </ul>
            </div>

            {/* AI/ML Services */}
            <div className="text-center">
              <div className="text-4xl mb-3">🧠</div>
              <h4 className="font-medium text-gray-900 mb-2">AI/ML Services</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Azure Cognitive Services</li>
                <li>Speech-to-Text API</li>
                <li>Sentiment analysis</li>
                <li>Mental health keywords</li>
              </ul>
            </div>

            {/* Data Integration */}
            <div className="text-center">
              <div className="text-4xl mb-3">🔗</div>
              <h4 className="font-medium text-gray-900 mb-2">Data Integration</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Cross-platform analytics</li>
                <li>Real-time event streaming</li>
                <li>Data correlation engine</li>
                <li>Privacy protection</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">🔒 Privacy & Security Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <strong>Data Protection:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• End-to-end encryption</li>
                  <li>• On-device processing options</li>
                  <li>• Automatic data deletion</li>
                  <li>• HIPAA compliance ready</li>
                </ul>
              </div>
              <div>
                <strong>User Control:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Privacy mode toggle</li>
                  <li>• Data anonymization</li>
                  <li>• Consent management</li>
                  <li>• Audit trail logging</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">🛠️ Technology Stack</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">⚛️</div>
              <div className="text-xs font-medium">React 18</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">📘</div>
              <div className="text-xs font-medium">TypeScript</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">▲</div>
              <div className="text-xs font-medium">Next.js</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">🎨</div>
              <div className="text-xs font-medium">Tailwind</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">☁️</div>
              <div className="text-xs font-medium">Azure AI</div>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs font-medium">Chart.js</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleNavigation('/integrated-analytics-hub', 'quick-integrated')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              🔬 View Integrated Hub
            </button>
            <button
              onClick={() => handleNavigation('/voice-sentiment-demo', 'quick-voice')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
            >
              🎙️ Try Voice Analysis
            </button>
            <button
              onClick={() => handleNavigation('/analytics-hub', 'quick-analytics')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium"
            >
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNavigation;
