/**
 * SATA Engagement Analytics Dashboard
 * Comprehensive view of user engagement metrics and analytics
 */

import React, { useState, useEffect } from 'react';
import { engagementTracker, FeatureAnalytics, CohortAnalysis } from '../lib/engagement-tracker';

interface AnalyticsDashboardProps {
  timeframe?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

const EngagementAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  timeframe = 'month' 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'features' | 'content' | 'retention' | 'notifications'>('overview');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [selectedTimeframe, autoRefresh]);

  const loadAnalyticsData = () => {
    setIsLoading(true);
    
    // Simulate loading delay for demo
    setTimeout(() => {
      const data = engagementTracker.getAnalyticsDashboard();
      setAnalyticsData(data);
      setIsLoading(false);
    }, 1000);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderOverview = () => {
    if (!analyticsData) return null;

    const { activeUsers, contentInteraction, assessmentCompletion, peerSupportParticipation, notificationEffectiveness } = analyticsData;

    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Daily Active Users</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(activeUsers.daily)}</p>
                <p className="text-xs text-green-600 mt-1">↗ +12% vs yesterday</p>
              </div>
              <div className="text-blue-500 text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Weekly Active Users</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(activeUsers.weekly)}</p>
                <p className="text-xs text-green-600 mt-1">↗ +8% vs last week</p>
              </div>
              <div className="text-green-500 text-3xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(activeUsers.monthly)}</p>
                <p className="text-xs text-green-600 mt-1">↗ +15% vs last month</p>
              </div>
              <div className="text-purple-500 text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Engagement Score</p>
                <p className="text-2xl font-bold text-orange-600">8.7/10</p>
                <p className="text-xs text-green-600 mt-1">↗ +0.3 this month</p>
              </div>
              <div className="text-orange-500 text-3xl">⭐</div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Engagement */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Content Engagement</h3>
            <div className="space-y-3">
              {Object.entries(contentInteraction).map(([type, data]: [string, any]) => (
                <div key={type} className="flex justify-between items-center">
                  <div>
                    <span className="capitalize font-medium">{type}</span>
                    <p className="text-sm text-gray-600">
                      {formatNumber(data.totalViews)} views, {formatNumber(data.totalCompletions)} completions
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-blue-600">
                      {formatPercentage((data.totalCompletions / data.totalViews) * 100)}
                    </span>
                    <p className="text-xs text-gray-500">completion rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Completion */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Assessment Completion</h3>
            <div className="space-y-3">
              {Object.entries(assessmentCompletion).map(([type, data]: [string, any]) => (
                <div key={type} className="flex justify-between items-center">
                  <div>
                    <span className="capitalize font-medium">{type.replace('-', ' ')}</span>
                    <p className="text-sm text-gray-600">
                      {data.totalCompleted}/{data.totalStarted} completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-green-600">
                      {formatPercentage(data.completionRate)}
                    </span>
                    <p className="text-xs text-gray-500">completion rate</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peer Support & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Peer Support Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{peerSupportParticipation.totalParticipants}</div>
                <div className="text-sm text-gray-600">Active Participants</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatNumber(peerSupportParticipation.messagesSent)}</div>
                <div className="text-sm text-gray-600">Messages Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(peerSupportParticipation.supportGiven)}</div>
                <div className="text-sm text-gray-600">Support Given</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{Math.round(peerSupportParticipation.averageResponseTime)}</div>
                <div className="text-sm text-gray-600">Avg Response (min)</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Notification Effectiveness</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formatPercentage(notificationEffectiveness.deliveryRate)}</div>
                <div className="text-sm text-gray-600">Delivery Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatPercentage(notificationEffectiveness.openRate)}</div>
                <div className="text-sm text-gray-600">Open Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatPercentage(notificationEffectiveness.clickRate)}</div>
                <div className="text-sm text-gray-600">Click Rate</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              Total sent: {formatNumber(notificationEffectiveness.totalSent)} notifications
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserAnalytics = () => {
    return (
      <div className="space-y-6">
        {/* User Activity Heatmap */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">User Activity Heatmap (Last 7 Days)</h3>
          <div className="grid grid-cols-7 gap-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <div key={day} className="text-center">
                <div className="text-sm font-medium mb-2">{day}</div>
                <div className="space-y-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const intensity = Math.random(); // Mock data
                    return (
                      <div
                        key={hour}
                        className={`h-2 rounded ${
                          intensity > 0.7 ? 'bg-green-500' :
                          intensity > 0.4 ? 'bg-yellow-400' :
                          intensity > 0.2 ? 'bg-orange-400' : 'bg-gray-200'
                        }`}
                        title={`${hour}:00 - ${(intensity * 100).toFixed(0)}% activity`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center mt-4 text-sm text-gray-600">
            <span className="mr-4">Less active</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <div className="w-3 h-3 bg-green-500 rounded"></div>
            </div>
            <span className="ml-4">More active</span>
          </div>
        </div>

        {/* User Segmentation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">User Segments</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="font-medium text-green-800">High Engagement</span>
                  <p className="text-sm text-green-600">Daily active, multiple features</p>
                </div>
                <span className="font-semibold text-green-700">35%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <span className="font-medium text-yellow-800">Medium Engagement</span>
                  <p className="text-sm text-yellow-600">Weekly active, some features</p>
                </div>
                <span className="font-semibold text-yellow-700">45%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-medium text-red-800">Low Engagement</span>
                  <p className="text-sm text-red-600">Rarely active, minimal usage</p>
                </div>
                <span className="font-semibold text-red-700">20%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-xl mr-2">📱</span>
                  <span>Mobile</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-xl mr-2">💻</span>
                  <span>Desktop</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-xl mr-2">📱</span>
                  <span>Tablet</span>
                </div>
                <div className="flex items-center">
                  <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <span className="text-sm font-medium">10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFeatureAnalytics = () => {
    // Mock feature data for demonstration
    const features = [
      {
        name: 'Daily Check-ins',
        totalUsers: 1250,
        activeUsers: { daily: 450, weekly: 890, monthly: 1150 },
        averageSessionDuration: 180,
        completionRate: 85.5,
        satisfactionScore: 4.6
      },
      {
        name: 'Mood Assessment',
        totalUsers: 980,
        activeUsers: { daily: 320, weekly: 650, monthly: 890 },
        averageSessionDuration: 300,
        completionRate: 78.2,
        satisfactionScore: 4.3
      },
      {
        name: 'Educational Content',
        totalUsers: 1450,
        activeUsers: { daily: 380, weekly: 780, monthly: 1200 },
        averageSessionDuration: 420,
        completionRate: 65.8,
        satisfactionScore: 4.4
      },
      {
        name: 'Peer Support',
        totalUsers: 750,
        activeUsers: { daily: 180, weekly: 420, monthly: 680 },
        averageSessionDuration: 600,
        completionRate: 72.1,
        satisfactionScore: 4.7
      },
      {
        name: 'Crisis Resources',
        totalUsers: 320,
        activeUsers: { daily: 45, weekly: 150, monthly: 280 },
        averageSessionDuration: 240,
        completionRate: 95.2,
        satisfactionScore: 4.8
      },
      {
        name: 'Buddy System',
        totalUsers: 650,
        activeUsers: { daily: 210, weekly: 380, monthly: 580 },
        averageSessionDuration: 480,
        completionRate: 68.9,
        satisfactionScore: 4.5
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Feature Usage Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Feature</th>
                  <th className="text-left py-2">Total Users</th>
                  <th className="text-left py-2">Daily Active</th>
                  <th className="text-left py-2">Weekly Active</th>
                  <th className="text-left py-2">Avg Duration</th>
                  <th className="text-left py-2">Completion Rate</th>
                  <th className="text-left py-2">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.name} className="border-b border-gray-100">
                    <td className="py-3 font-medium capitalize">{feature.name.replace('-', ' ')}</td>
                    <td className="py-3">{formatNumber(feature.totalUsers)}</td>
                    <td className="py-3">{formatNumber(feature.activeUsers.daily)}</td>
                    <td className="py-3">{formatNumber(feature.activeUsers.weekly)}</td>
                    <td className="py-3">{formatDuration(feature.averageSessionDuration)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        feature.completionRate > 70 ? 'bg-green-100 text-green-800' :
                        feature.completionRate > 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(feature.completionRate)}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <span className="mr-2">{feature.satisfactionScore.toFixed(1)}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(feature.satisfactionScore) ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Popularity Chart */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Feature Popularity (Last 30 Days)</h3>
          <div className="space-y-3">
            {features.slice(0, 8).map((feature, index) => {
              const maxUsers = Math.max(...features.map((f) => f.totalUsers));
              const percentage = (feature.totalUsers / maxUsers) * 100;
              
              return (
                <div key={feature.name} className="flex items-center">
                  <div className="w-32 text-sm font-medium capitalize truncate">
                    {feature.name.replace('-', ' ')}
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full ${
                          index % 4 === 0 ? 'bg-blue-500' :
                          index % 4 === 1 ? 'bg-green-500' :
                          index % 4 === 2 ? 'bg-purple-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    {formatNumber(feature.totalUsers)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderRetentionAnalysis = () => {
    if (!analyticsData?.retentionAnalysis) return null;

    const cohorts = analyticsData.retentionAnalysis.slice(0, 6); // Show last 6 cohorts

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Cohort Retention Analysis</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2">Cohort</th>
                  <th className="text-left py-2">Total Users</th>
                  <th className="text-left py-2">Day 1</th>
                  <th className="text-left py-2">Day 7</th>
                  <th className="text-left py-2">Day 14</th>
                  <th className="text-left py-2">Day 30</th>
                  <th className="text-left py-2">Day 60</th>
                  <th className="text-left py-2">Day 90</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort: CohortAnalysis) => (
                  <tr key={cohort.cohortId} className="border-b border-gray-100">
                    <td className="py-3 font-medium">
                      {new Date(cohort.cohortDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">{cohort.totalUsers}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day1 > 70 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day1 > 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day1)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day7 > 50 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day7 > 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day7)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day14 > 40 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day14 > 25 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day14)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day30 > 30 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day30 > 20 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day30)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day60 > 25 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day60 > 15 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day60)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        cohort.retentionRates.day90 > 20 ? 'bg-green-100 text-green-800' :
                        cohort.retentionRates.day90 > 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {formatPercentage(cohort.retentionRates.day90)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Churn Risk Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Churn Risk Distribution</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-medium text-red-800">High Risk</span>
                  <p className="text-sm text-red-600">Inactive 7+ days</p>
                </div>
                <span className="font-semibold text-red-700">15%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div>
                  <span className="font-medium text-yellow-800">Medium Risk</span>
                  <p className="text-sm text-yellow-600">Inactive 3-7 days</p>
                </div>
                <span className="font-semibold text-yellow-700">25%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <span className="font-medium text-green-800">Low Risk</span>
                  <p className="text-sm text-green-600">Active within 3 days</p>
                </div>
                <span className="font-semibold text-green-700">60%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Retention Improvement Actions</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-600 mr-3">📧</span>
                <div>
                  <span className="font-medium text-blue-800">Re-engagement Campaign</span>
                  <p className="text-sm text-blue-600">Target medium risk users</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-600 mr-3">🎯</span>
                <div>
                  <span className="font-medium text-purple-800">Personalized Content</span>
                  <p className="text-sm text-purple-600">Recommend based on usage</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-600 mr-3">🤝</span>
                <div>
                  <span className="font-medium text-green-800">Peer Matching</span>
                  <p className="text-sm text-green-600">Connect disengaged users</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Analytics</h2>
          <p className="text-gray-600">Gathering engagement insights...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">📊 Engagement Analytics</h1>
              <p className="text-gray-600">Track user engagement and platform effectiveness</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 3 Months</option>
                <option value="year">Last 12 Months</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
              </button>
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Data
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
              { id: 'overview', label: 'Overview', icon: '📈' },
              { id: 'users', label: 'User Analytics', icon: '👥' },
              { id: 'features', label: 'Feature Usage', icon: '🎛️' },
              { id: 'content', label: 'Content Analytics', icon: '📚' },
              { id: 'retention', label: 'Retention', icon: '🔄' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserAnalytics()}
        {activeTab === 'features' && renderFeatureAnalytics()}
        {activeTab === 'content' && renderOverview()} {/* Reuse for content analytics */}
        {activeTab === 'retention' && renderRetentionAnalysis()}
        {activeTab === 'notifications' && renderOverview()} {/* Reuse for notifications */}
      </div>
    </div>
  );
};

export default EngagementAnalyticsDashboard;
