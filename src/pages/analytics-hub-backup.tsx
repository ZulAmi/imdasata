/**
 * Enhanced Analytics Hub with Integrated Reporting
 * Combines real-time analytics with automated reporting capabilities
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface DashboardMetrics {
  userEngagement: {
    activeUsers: number;
    sessionDuration: number;
    completionRate: number;
    retentionRate: number;
  };
  mentalHealth: {
    avgMoodScore: number;
    assessmentCompletions: number;
    highRiskUsers: number;
    interventionSuccess: number;
  };
  resources: {
    totalViews: number;
    popularCategories: string[];
    utilizationRate: number;
    gapScore: number;
  };
  compliance: {
    privacyScore: number;
    auditStatus: string;
    dataProtection: number;
    accessControl: number;
  };
}

interface EngagementDashboardProps {
  userId?: string;
}

// Engagement Analytics Dashboard Component
const EngagementAnalyticsDashboard: React.FC<EngagementDashboardProps> = ({ userId }) => {
  const [engagementData, setEngagementData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading engagement data
    setTimeout(() => {
      setEngagementData({
        activeUsers: 1247,
        avgSessionTime: 18.5,
        bounceRate: 23.1,
        conversionRate: 12.8
      });
      setLoading(false);
    }, 1000);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-gray-600">Loading engagement analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{engagementData.activeUsers}</p>
            </div>
            <div className="text-blue-500 text-3xl">👥</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Session Time</p>
              <p className="text-3xl font-bold text-gray-900">{engagementData.avgSessionTime}m</p>
            </div>
            <div className="text-green-500 text-3xl">⏱️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
              <p className="text-3xl font-bold text-gray-900">{engagementData.bounceRate}%</p>
            </div>
            <div className="text-orange-500 text-3xl">📉</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{engagementData.conversionRate}%</p>
            </div>
            <div className="text-purple-500 text-3xl">🎯</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Gamification Interface Component
const GamificationInterface: React.FC<{ userId: string }> = ({ userId }) => {
  const [gamificationData, setGamificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading gamification data
    setTimeout(() => {
      setGamificationData({
        totalPoints: 2456,
        level: 8,
        achievements: 12,
        streak: 15
      });
      setLoading(false);
    }, 1000);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎮</div>
          <p className="text-gray-600">Loading gamification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Points</p>
              <p className="text-3xl font-bold text-gray-900">{gamificationData.totalPoints}</p>
            </div>
            <div className="text-yellow-500 text-3xl">⭐</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Level</p>
              <p className="text-3xl font-bold text-gray-900">{gamificationData.level}</p>
            </div>
            <div className="text-blue-500 text-3xl">🏆</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Achievements</p>
              <p className="text-3xl font-bold text-gray-900">{gamificationData.achievements}</p>
            </div>
            <div className="text-green-500 text-3xl">🎖️</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              <p className="text-3xl font-bold text-gray-900">{gamificationData.streak}</p>
            </div>
            <div className="text-red-500 text-3xl">🔥</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Analytics Hub Component
const IntegratedAnalyticsHub: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');
  const [activeView, setActiveView] = useState<'combined' | 'engagement' | 'gamification'>('combined');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');
  const currentUserId = 'user-123';

  // Track interactions
  const trackInteraction = (action: string, details?: any) => {
    console.log('Interaction tracked:', { action, details, timestamp: new Date() });
  };

  // Handle role toggle
  const handleRoleToggle = () => {
    const newRole = userRole === 'admin' ? 'user' : 'admin';
    setUserRole(newRole);
    trackInteraction('role_toggle', { from: userRole, to: newRole });
  };

  // Mock data generation
  const generateMetrics = (): DashboardMetrics => ({
    userEngagement: {
      activeUsers: 1247,
      sessionDuration: 18.5,
      completionRate: 78.2,
      retentionRate: 64.7
    },
    mentalHealth: {
      avgMoodScore: 3.4,
      assessmentCompletions: 892,
      highRiskUsers: 23,
      interventionSuccess: 76.8
    },
    resources: {
      totalViews: 5634,
      popularCategories: ['Anxiety Management', 'Depression Support', 'Academic Stress'],
      utilizationRate: 68.9,
      gapScore: 24.3
    },
    compliance: {
      privacyScore: 96.8,
      auditStatus: 'Compliant',
      dataProtection: 98.2,
      accessControl: 87.3
    }
  });

  // Chart configurations
  const trendChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Average Mood Score',
        data: [3.2, 3.4, 3.1, 3.6, 3.8, 3.5, 3.4],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'User Engagement',
        data: [65, 72, 68, 78, 82, 75, 79],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  };

  const interventionChartData = {
    labels: ['Crisis Alerts', 'Mood Nudges', 'Resource Recommendations', 'Peer Support'],
    datasets: [{
      label: 'Success Rate (%)',
      data: [78.2, 65.8, 71.3, 82.4],
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)'
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(16, 185, 129, 1)'
      ],
      borderWidth: 2
    }]
  };

  const complianceRadarData = {
    labels: ['Data Privacy', 'Access Control', 'Encryption', 'Audit Logging', 'User Consent'],
    datasets: [{
      label: 'Compliance Score',
      data: [96.8, 87.3, 98.5, 92.1, 94.2],
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
      borderColor: 'rgba(139, 92, 246, 1)',
      pointBackgroundColor: 'rgba(139, 92, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
    }]
  };

  const resourceUtilizationData = {
    labels: ['Anxiety Resources', 'Depression Support', 'Academic Stress', 'Crisis Intervention', 'Peer Support'],
    datasets: [{
      label: 'Utilization Rate (%)',
      data: [82.4, 76.3, 91.2, 68.7, 74.9],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: 'rgba(16, 185, 129, 1)',
      borderWidth: 2
    }]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(generateMetrics());
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: false
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  // Combined View Renderer
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
              { time: '12 mins ago', action: 'Daily check-in completed by 89 users', type: 'check-in', icon: '✅' },
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

  if (isLoading || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚡</div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

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
        {activeView === 'engagement' && <EngagementAnalyticsDashboard userId={currentUserId} />}
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

export default IntegratedAnalyticsHub;
