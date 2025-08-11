/**
 * SATA Analytics & Engagement Hub
 * Main page for viewing engagement analytics and gamification metrics
 */

import React, { useState, useEffect } from 'react';
import EngagementAnalyticsDashboard from '../components/EngagementAnalyticsDashboard';
import GamificationInterface from '../components/GamificationInterface';
import { engagementIntegration } from '../lib/engagement-integration';
import { useEngagementTracking } from '../lib/engagement-integration';

const AnalyticsHub = () => {
  const [activeView, setActiveView] = useState<'engagement' | 'gamification' | 'combined'>('combined');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [currentUserId] = useState('demo-user-123');
  
  // Initialize engagement tracking
  const {
    trackInteraction,
    trackPageView,
    trackFeatureUsage
  } = useEngagementTracking(currentUserId);

  useEffect(() => {
    // Track page view when component mounts
    trackPageView('analytics-hub', {
      view: activeView,
      role: userRole
    });

    // Initialize user session if not already done
    engagementIntegration.initializeUserSession(currentUserId, {
      device: 'desktop',
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other',
      platform: 'web',
      userAgent: navigator.userAgent
    });
  }, []);

  useEffect(() => {
    // Track view changes
    trackInteraction('analytics-hub', 'view-changed', {
      newView: activeView,
      timestamp: Date.now()
    });
  }, [activeView]);

  const handleRoleToggle = () => {
    const newRole = userRole === 'admin' ? 'user' : 'admin';
    setUserRole(newRole);
    
    trackInteraction('analytics-hub', 'role-switched', {
      fromRole: userRole,
      toRole: newRole
    });
  };

  const renderCombinedView = () => {
    return (
      <div className="space-y-8">
        {/* Quick Stats Overview */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h2 className="text-xl font-bold mb-4">📊 Platform Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,234</div>
              <div className="text-sm text-blue-800">Active Users Today</div>
              <div className="text-xs text-blue-600 mt-1">↗ +8.5% vs yesterday</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">87.3%</div>
              <div className="text-sm text-green-800">Engagement Rate</div>
              <div className="text-xs text-green-600 mt-1">↗ +2.1% vs last week</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">45,678</div>
              <div className="text-sm text-purple-800">Points Earned Today</div>
              <div className="text-xs text-purple-600 mt-1">↗ +12% vs yesterday</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">234</div>
              <div className="text-sm text-orange-800">New Achievements</div>
              <div className="text-xs text-orange-600 mt-1">↗ +5 vs yesterday</div>
            </div>
          </div>
        </div>

        {/* Feature Usage Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">🎯 Top Features This Week</h3>
            <div className="space-y-3">
              {[
                { name: 'Daily Check-ins', users: 892, growth: '+12%', color: 'blue' },
                { name: 'Peer Support', users: 634, growth: '+8%', color: 'green' },
                { name: 'Educational Content', users: 567, growth: '+15%', color: 'purple' },
                { name: 'Mood Assessment', users: 445, growth: '+6%', color: 'orange' },
                { name: 'Buddy System', users: 321, growth: '+20%', color: 'pink' }
              ].map((feature, index) => (
                <div key={feature.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{index + 1}.</span>
                    <div>
                      <span className="font-medium">{feature.name}</span>
                      <p className="text-sm text-gray-600">{feature.users} active users</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{feature.growth}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">🏆 Gamification Highlights</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <span className="font-medium text-yellow-800">Most Active Users</span>
                  <p className="text-sm text-yellow-600">Top 10% earned 2x points</p>
                </div>
                <span className="text-2xl">🌟</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <span className="font-medium text-blue-800">Streak Champions</span>
                  <p className="text-sm text-blue-600">45 users with 30+ day streaks</p>
                </div>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="font-medium text-green-800">New Achievements</span>
                  <p className="text-sm text-green-600">234 unlocked this week</p>
                </div>
                <span className="text-2xl">🎖️</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <span className="font-medium text-purple-800">Peer Support Heroes</span>
                  <p className="text-sm text-purple-600">Top supporters this month</p>
                </div>
                <span className="text-2xl">🤝</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">📈 Recent Platform Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[
              { time: '2 mins ago', action: 'New user completed onboarding', type: 'user', icon: '👋' },
              { time: '5 mins ago', action: 'Achievement "First Week" unlocked by 12 users', type: 'achievement', icon: '🏆' },
              { time: '8 mins ago', action: 'Peer support message sent in Crisis Help group', type: 'support', icon: '💬' },
              { time: '12 mins ago', action: 'Daily check-in completed by 89 users', type: 'checkin', icon: '✅' },
              { time: '15 mins ago', action: 'Educational content "Managing Stress" viewed 34 times', type: 'content', icon: '📚' },
              { time: '18 mins ago', action: 'New buddy pairs matched: 5 successful connections', type: 'buddy', icon: '🤝' },
              { time: '22 mins ago', action: 'Crisis resource accessed: "Emergency Contacts"', type: 'crisis', icon: '🚨' },
              { time: '25 mins ago', action: 'Voice message sent in peer support channel', type: 'voice', icon: '🎙️' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <span className="text-xl mr-3">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activity.type === 'achievement' ? 'bg-yellow-100 text-yellow-800' :
                  activity.type === 'support' ? 'bg-blue-100 text-blue-800' :
                  activity.type === 'crisis' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {activeView === 'engagement' ? '📊' : activeView === 'gamification' ? '🎮' : '🏠'} 
                {' '}
                {activeView === 'engagement' ? 'Engagement Analytics' : 
                 activeView === 'gamification' ? 'Gamification Dashboard' : 'Analytics Hub'}
              </h1>
              <p className="text-gray-600">
                {activeView === 'engagement' ? 'Comprehensive user engagement insights' :
                 activeView === 'gamification' ? 'Gamification metrics and leaderboards' :
                 'Combined view of platform analytics and gamification'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {userRole === 'admin' && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Admin View
                </span>
              )}
              <button
                onClick={handleRoleToggle}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Switch to {userRole === 'admin' ? 'User' : 'Admin'} View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'combined', label: 'Overview', icon: '🏠' },
              { id: 'engagement', label: 'Engagement Analytics', icon: '📊' },
              { id: 'gamification', label: 'Gamification', icon: '🎮' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeView === 'combined' && renderCombinedView()}
        {activeView === 'engagement' && <EngagementAnalyticsDashboard />}
        {activeView === 'gamification' && <GamificationInterface userId={currentUserId} />}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              SATA Analytics Hub - Real-time engagement tracking and gamification metrics
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AnalyticsHub;
