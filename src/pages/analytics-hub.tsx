/**
 * Enhanced Analytics Hub with Integrated Reporting
 * Combines real-time analytics with automated reporting capabilities
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function IntegratedAnalyticsHub() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setMetrics(generateMetrics());
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

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
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="text-3xl">🧠</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SATA</h1>
                  <p className="text-xs text-gray-600">Analytics & Reporting Hub</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/reports" className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>📊</span>
                <span>Reports</span>
              </Link>
              <Link href="/admin-dashboard" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>⚙️</span>
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Analytics & Reporting Dashboard</h1>
              <p className="text-gray-600">Comprehensive mental health insights and automated reporting</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              <Link
                href="/reports"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>📋</span>
                <span>Generate Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '🎯' },
              { id: 'mental-health', name: 'Mental Health', icon: '🧠' },
              { id: 'user-engagement', name: 'User Engagement', icon: '👥' },
              { id: 'resources', name: 'Resources', icon: '📚' },
              { id: 'compliance', name: 'Compliance', icon: '🔒' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview View */}
        {selectedView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.userEngagement.activeUsers}</p>
                  </div>
                  <div className="text-blue-500 text-3xl">👥</div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600">↗ 12.5%</span>
                  <span className="text-gray-500 ml-1">vs last period</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Mood Score</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.mentalHealth.avgMoodScore}</p>
                  </div>
                  <div className="text-purple-500 text-3xl">😊</div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600">↗ 8.3%</span>
                  <span className="text-gray-500 ml-1">improvement</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Risk Users</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.mentalHealth.highRiskUsers}</p>
                  </div>
                  <div className="text-red-500 text-3xl">⚠️</div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-red-600">↗ 4.2%</span>
                  <span className="text-gray-500 ml-1">requires attention</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.compliance.privacyScore}%</p>
                  </div>
                  <div className="text-green-500 text-3xl">🔒</div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-green-600">✓ Compliant</span>
                  <span className="text-gray-500 ml-1">HIPAA certified</span>
                </div>
              </div>
            </div>

            {/* Trend Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mental Health Trends</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">This Week</span>
                    <span className="text-blue-700 font-bold">Mood: 3.4 ↗</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">Assessments</span>
                    <span className="text-green-700 font-bold">+127 this week</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium text-orange-900">High Risk</span>
                    <span className="text-orange-700 font-bold">23 users</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervention Effectiveness</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Crisis Alerts</span>
                    <span className="text-red-600 font-bold">78.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Mood Nudges</span>
                    <span className="text-orange-600 font-bold">65.8%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Peer Support</span>
                    <span className="text-green-600 font-bold">82.4%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mental Health View */}
        {selectedView === 'mental-health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Completion</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{metrics.mentalHealth.assessmentCompletions}</div>
                  <p className="text-gray-600">Total Assessments</p>
                  <div className="mt-4 bg-blue-100 rounded-full p-4">
                    <div className="text-2xl">📝</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Intervention Success</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{metrics.mentalHealth.interventionSuccess}%</div>
                  <p className="text-gray-600">Success Rate</p>
                  <div className="mt-4 bg-green-100 rounded-full p-4">
                    <div className="text-2xl">✅</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Low Risk</span>
                    <span className="text-sm font-medium text-green-600">67.1%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Moderate Risk</span>
                    <span className="text-sm font-medium text-yellow-600">24.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <span className="text-sm font-medium text-red-600">8.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources View */}
        {selectedView === 'resources' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Anxiety Resources</span>
                    <span className="text-green-600 font-bold">82.4%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Depression Support</span>
                    <span className="text-blue-600 font-bold">76.3%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    <span className="font-medium text-gray-900">Academic Stress</span>
                    <span className="text-purple-600 font-bold">91.2%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Gap Analysis</h3>
                <div className="space-y-4">
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-red-900">Academic Stress Resources</span>
                      <span className="text-red-600 font-bold">52.6% Gap</span>
                    </div>
                    <p className="text-red-700 text-sm">High demand, low availability - immediate action needed</p>
                  </div>
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-orange-900">Crisis Intervention</span>
                      <span className="text-orange-600 font-bold">29.4% Gap</span>
                    </div>
                    <p className="text-orange-700 text-sm">Moderate gap - expand capacity recommended</p>
                  </div>
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-green-900">Anxiety Management</span>
                      <span className="text-green-600 font-bold">18.5% Gap</span>
                    </div>
                    <p className="text-green-700 text-sm">Good coverage - minor improvements needed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Compliance View */}
        {selectedView === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
                <div className="text-center">
                  <div className="text-6xl font-bold text-green-600 mb-4">{metrics.compliance.privacyScore}%</div>
                  <p className="text-gray-600 text-lg">Overall Compliance Score</p>
                  <div className="mt-4 bg-green-100 rounded-full p-6">
                    <div className="text-4xl">🔒</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h3>
                <div className="space-y-4">
                  {[
                    { area: 'Data Privacy (HIPAA)', score: 96.8, status: 'compliant' },
                    { area: 'User Consent Management', score: 94.2, status: 'compliant' },
                    { area: 'Data Encryption', score: 98.5, status: 'compliant' },
                    { area: 'Access Control', score: 87.3, status: 'warning' },
                    { area: 'Audit Logging', score: 92.1, status: 'compliant' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'compliant' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="font-medium text-gray-900">{item.area}</span>
                      </div>
                      <span className={`font-bold ${
                        item.score >= 95 ? 'text-green-600' : 
                        item.score >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Quick Report Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/reports?type=weekly"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="text-2xl">📊</div>
              <div>
                <div className="font-medium text-gray-900">Weekly Trends Report</div>
                <div className="text-sm text-gray-600">Mental health analytics</div>
              </div>
            </Link>

            <Link
              href="/reports?type=resource-gap"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
            >
              <div className="text-2xl">📈</div>
              <div>
                <div className="font-medium text-gray-900">Resource Gap Analysis</div>
                <div className="text-sm text-gray-600">Demand vs availability</div>
              </div>
            </Link>

            <Link
              href="/reports?type=compliance"
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <div className="text-2xl">🔒</div>
              <div>
                <div className="font-medium text-gray-900">Compliance Audit</div>
                <div className="text-sm text-gray-600">Privacy & security review</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
