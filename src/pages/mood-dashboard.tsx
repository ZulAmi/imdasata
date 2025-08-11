/**
 * SATA Comprehensive Mood Dashboard
 * Unified interface combining all mood tracking features
 */

import React, { useState, useEffect } from 'react';
import MoodLoggingInterface from '../components/MoodLoggingInterface';
import MoodTrendsVisualization from '../components/MoodTrendsVisualization';
import HealthcareExport from '../components/HealthcareExport';
import { moodAnalyticsEngine, MoodInsight } from '../lib/mood-analytics-engine';
import { useEngagementTracking } from '../lib/engagement-integration';

const MoodDashboard = () => {
  const [currentUser] = useState({
    id: 'mood-dashboard-user',
    name: 'Jordan Smith',
    email: 'jordan.smith@example.com'
  });

  const [activeTab, setActiveTab] = useState<'track' | 'trends' | 'insights' | 'export'>('track');
  const [recentInsights, setRecentInsights] = useState<MoodInsight[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalEntries: 0,
    averageMood: 0,
    currentStreak: 0,
    trendsDetected: 0,
    lastEntry: null as Date | null
  });

  const [notifications, setNotifications] = useState<{
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
    id: string;
  }[]>([]);

  // Engagement tracking
  const { trackInteraction, trackPageView, trackFeatureUsage } = useEngagementTracking(currentUser.id);

  useEffect(() => {
    // Track page view
    trackPageView('mood-dashboard', {
      features: ['mood-tracking', 'trend-analysis', 'healthcare-export']
    });

    // Initialize dashboard
    initializeDashboard();

    // Set up event listeners
    moodAnalyticsEngine.on('mood:added', handleMoodAdded);
    moodAnalyticsEngine.on('insights:generated', handleInsightsGenerated);
    moodAnalyticsEngine.on('analysis:completed', handleAnalysisCompleted);

    return () => {
      moodAnalyticsEngine.removeAllListeners();
    };
  }, []);

  const initializeDashboard = async () => {
    try {
      // Load initial data
      const summary = moodAnalyticsEngine.getAnalyticsSummary(currentUser.id);
      const insights = moodAnalyticsEngine.getUserInsights(currentUser.id);

      setDashboardStats({
        totalEntries: summary.entriesCount,
        averageMood: summary.averageMood,
        currentStreak: calculateCurrentStreak(),
        trendsDetected: summary.trendsCount,
        lastEntry: summary.lastEntry || null
      });

      setRecentInsights(insights.slice(0, 5));

      // Generate insights if we have data
      if (summary.entriesCount > 0) {
        await moodAnalyticsEngine.generateInsights(currentUser.id);
      }

    } catch (error) {
      console.error('Error initializing dashboard:', error);
      addNotification('error', 'Failed to load dashboard data');
    }
  };

  const calculateCurrentStreak = (): number => {
    const entries = moodAnalyticsEngine.getMoodEntries(currentUser.id);
    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check consecutive days with mood entries
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasEntry = entries.some(entry => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === checkDate.getTime();
      });

      if (hasEntry) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const handleMoodAdded = ({ userId, entry }: any) => {
    if (userId === currentUser.id) {
      // Update dashboard stats
      setDashboardStats(prev => ({
        ...prev,
        totalEntries: prev.totalEntries + 1,
        currentStreak: calculateCurrentStreak(),
        lastEntry: entry.timestamp
      }));

      // Show success notification
      addNotification('success', '🎉 Mood entry saved successfully!');

      trackFeatureUsage('mood-entry-added', 5, 'completed');
    }
  };

  const handleInsightsGenerated = ({ userId, insights }: any) => {
    if (userId === currentUser.id) {
      setRecentInsights(insights.slice(0, 5));
      
      // Check for high priority insights
      const highPriorityInsights = insights.filter((i: MoodInsight) => i.priority === 'high' || i.priority === 'critical');
      if (highPriorityInsights.length > 0) {
        addNotification('warning', `${highPriorityInsights.length} important insight(s) detected`);
      }

      trackFeatureUsage('mood-insights-generated', 2, 'completed');
    }
  };

  const handleAnalysisCompleted = ({ userId }: any) => {
    if (userId === currentUser.id) {
      // Refresh dashboard stats
      const summary = moodAnalyticsEngine.getAnalyticsSummary(currentUser.id);
      setDashboardStats(prev => ({
        ...prev,
        averageMood: summary.averageMood,
        trendsDetected: summary.trendsCount || prev.trendsDetected
      }));
    }
  };

  const addNotification = (type: 'info' | 'warning' | 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { type, message, id }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'track': return '📝';
      case 'trends': return '📈';
      case 'insights': return '💡';
      case 'export': return '📤';
      default: return '📋';
    }
  };

  const getStreakMessage = () => {
    if (dashboardStats.currentStreak === 0) return 'Start your mood tracking journey today! 🌟';
    if (dashboardStats.currentStreak === 1) return 'Great start! Keep the momentum going! 💪';
    if (dashboardStats.currentStreak < 7) return `${dashboardStats.currentStreak} days strong! Building a healthy habit! 🔥`;
    if (dashboardStats.currentStreak < 30) return `Amazing ${dashboardStats.currentStreak}-day streak! You\'re doing fantastic! ⭐`;
    return `Incredible ${dashboardStats.currentStreak}-day streak! You\'re a mood tracking champion! 🏆`;
  };

  const getMoodStatusColor = () => {
    if (dashboardStats.averageMood >= 7) return 'text-green-600';
    if (dashboardStats.averageMood >= 5) return 'text-yellow-600';
    if (dashboardStats.averageMood >= 3) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`max-w-sm p-4 rounded-lg shadow-lg border-l-4 ${
              notification.type === 'success' ? 'bg-green-50 border-green-500' :
              notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
              notification.type === 'error' ? 'bg-red-50 border-red-500' :
              'bg-blue-50 border-blue-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' :
                notification.type === 'warning' ? 'text-yellow-800' :
                notification.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {notification.message}
              </p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">😊 Mood Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive mood tracking with AI-powered insights and trend analysis
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Welcome back,</div>
              <div className="font-medium text-gray-900">{currentUser.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{dashboardStats.totalEntries}</div>
              <div className="text-sm opacity-90">Total Entries</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${getMoodStatusColor()}`}>
                {dashboardStats.averageMood > 0 ? dashboardStats.averageMood.toFixed(1) : '0'}/10
              </div>
              <div className="text-sm opacity-90">Average Mood</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{dashboardStats.currentStreak}</div>
              <div className="text-sm opacity-90">Day Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{recentInsights.length}</div>
              <div className="text-sm opacity-90">New Insights</div>
            </div>
            <div className="md:col-span-1 col-span-2">
              <div className="text-sm font-medium">{getStreakMessage()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'track', label: 'Track Mood', description: 'Log your current mood with emoji, voice, and notes' },
              { id: 'trends', label: 'View Trends', description: 'Analyze patterns and visualize mood over time' },
              { id: 'insights', label: 'AI Insights', description: 'Personalized recommendations and pattern recognition' },
              { id: 'export', label: 'Export Data', description: 'Generate reports for healthcare providers' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  trackInteraction('mood-dashboard-tab', 'clicked', { tab: tab.id });
                }}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                title={tab.description}
              >
                <span className="mr-2">{getTabIcon(tab.id)}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'track' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MoodLoggingInterface />
            </div>
            
            {/* Sidebar with quick insights */}
            <div className="space-y-6">
              {/* Recent Insights */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Recent Insights</h3>
                {recentInsights.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Add more mood entries to generate personalized insights
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentInsights.slice(0, 3).map((insight, index) => (
                      <div key={index} className={`p-3 rounded-lg border-l-4 ${
                        insight.priority === 'high' ? 'border-red-500 bg-red-50' :
                        insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}>
                        <div className="font-medium text-sm text-gray-900">{insight.title}</div>
                        <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    ))}
                    {recentInsights.length > 3 && (
                      <button
                        onClick={() => setActiveTab('insights')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2"
                      >
                        View all insights →
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Tips */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💫 Today's Tip</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start">
                      <span className="text-green-600 mr-2">🌱</span>
                      <div>
                        <div className="font-medium text-green-900">Consistency is Key</div>
                        <p className="text-sm text-green-800 mt-1">
                          Try to log your mood at the same time each day to build a sustainable habit.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <span className="text-blue-600 mr-2">🎙️</span>
                      <div>
                        <div className="font-medium text-blue-900">Voice Notes Help</div>
                        <p className="text-sm text-blue-800 mt-1">
                          Voice recordings provide richer emotional context than text alone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <MoodTrendsVisualization
            userId={currentUser.id}
            onInsightGenerated={(insight) => {
              setRecentInsights(prev => [insight, ...prev.slice(0, 4)]);
            }}
          />
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">🧠 Personalized AI Insights</h2>
              
              {recentInsights.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available yet</h3>
                  <p className="text-gray-600 mb-6">
                    Add at least 3 mood entries to start generating personalized insights
                  </p>
                  <button
                    onClick={() => setActiveTab('track')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Tracking Mood
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInsights.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-lg border-l-4 ${
                      insight.priority === 'critical' ? 'border-red-500 bg-red-50' :
                      insight.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                      insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            insight.priority === 'critical' ? 'bg-red-200 text-red-800' :
                            insight.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                            insight.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {insight.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {insight.generatedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{insight.description}</p>
                      
                      {insight.actionable && (
                        <div className="flex items-center text-sm">
                          <span className="text-blue-600 mr-2">💡</span>
                          <span className="text-blue-800 font-medium">Action recommended</span>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="text-center pt-6">
                    <button
                      onClick={() => moodAnalyticsEngine.generateInsights(currentUser.id)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🔄 Refresh Insights
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <HealthcareExport
            userId={currentUser.id}
            patientName={currentUser.name}
            onExportComplete={(exportData) => {
              addNotification('success', 'Healthcare report generated successfully');
              trackFeatureUsage('mood-healthcare-export', 30, 'completed');
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌟 Your Mental Health Journey</h3>
            <p className="text-gray-600 mb-6">
              Every mood entry is a step towards better understanding yourself. 
              Keep tracking, stay consistent, and celebrate your progress!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-medium text-gray-900">Easy Tracking</h4>
                <p className="text-sm text-gray-600">Simple emoji-based mood logging with voice notes</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🧠</div>
                <h4 className="font-medium text-gray-900">AI Insights</h4>
                <p className="text-sm text-gray-600">Personalized patterns and recommendations</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏥</div>
                <h4 className="font-medium text-gray-900">Clinical Integration</h4>
                <p className="text-sm text-gray-600">Professional reports for healthcare providers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodDashboard;
