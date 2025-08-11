/**
 * SATA Admin Dashboard
 * Comprehensive administrative interface for monitoring user engagement,
 * mental health trends, and system performance
 */

import React, { useState, useEffect, useRef } from 'react';
import { moodAnalyticsEngine } from '../lib/mood-analytics-engine';
import { useEngagementTracking } from '../lib/engagement-integration';

interface AdminMetrics {
  userEngagement: {
    totalActiveUsers: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    sessionDuration: number;
    featureUsage: Record<string, number>;
    retentionRate: number;
    churnRate: number;
  };
  mentalHealthTrends: {
    averageMoodScore: number;
    moodTrend: 'improving' | 'declining' | 'stable';
    assessmentCompletions: number;
    riskLevelDistribution: Record<string, number>;
    interventionTriggers: number;
    crisisAlerts: number;
  };
  resourceUtilization: {
    voiceAnalysisUsage: number;
    moodEntriesDaily: number;
    reportGenerations: number;
    exportRequests: number;
    storageUsed: number;
    bandwidthUsed: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    usagePatterns: Record<string, number>;
    preferredLanguages: Record<string, number>;
    deviceTypes: Record<string, number>;
    geographicDistribution: Record<string, number>;
  };
  highRiskUsers: {
    count: number;
    urgentCases: number;
    pendingInterventions: number;
    recentEscalations: number;
  };
  referralTracking: {
    totalReferrals: number;
    successfulConnections: number;
    outcomeTracking: Record<string, number>;
    followUpRate: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    apiHealth: Record<string, 'healthy' | 'warning' | 'critical'>;
    resourceUsage: Record<string, number>;
  };
}

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
  }>>([]);

  const refreshTimer = useRef<NodeJS.Timeout>();

  // Initialize dashboard data
  useEffect(() => {
    loadDashboardData();
    startAutoRefresh();

    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading real admin metrics
      // In production, this would come from your backend API
      const mockMetrics: AdminMetrics = await generateMockMetrics();
      setMetrics(mockMetrics);
      
      // Check for alerts
      checkForAlerts(mockMetrics);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockMetrics = async (): Promise<AdminMetrics> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const baseMetrics: AdminMetrics = {
      userEngagement: {
        totalActiveUsers: Math.floor(Math.random() * 5000) + 1000,
        dailyActiveUsers: Math.floor(Math.random() * 500) + 100,
        weeklyActiveUsers: Math.floor(Math.random() * 1500) + 300,
        monthlyActiveUsers: Math.floor(Math.random() * 3000) + 800,
        sessionDuration: Math.floor(Math.random() * 20) + 5, // minutes
        featureUsage: {
          'mood-tracking': Math.floor(Math.random() * 1000) + 200,
          'voice-analysis': Math.floor(Math.random() * 800) + 150,
          'trend-visualization': Math.floor(Math.random() * 600) + 100,
          'healthcare-export': Math.floor(Math.random() * 200) + 50,
          'assessment-tools': Math.floor(Math.random() * 400) + 80
        },
        retentionRate: Math.random() * 0.3 + 0.65, // 65-95%
        churnRate: Math.random() * 0.1 + 0.02 // 2-12%
      },
      mentalHealthTrends: {
        averageMoodScore: Math.random() * 3 + 5.5, // 5.5-8.5
        moodTrend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as any,
        assessmentCompletions: Math.floor(Math.random() * 300) + 100,
        riskLevelDistribution: {
          'low': Math.floor(Math.random() * 60) + 70,
          'moderate': Math.floor(Math.random() * 25) + 20,
          'high': Math.floor(Math.random() * 8) + 5,
          'critical': Math.floor(Math.random() * 3) + 1
        },
        interventionTriggers: Math.floor(Math.random() * 50) + 10,
        crisisAlerts: Math.floor(Math.random() * 5) + 1
      },
      resourceUtilization: {
        voiceAnalysisUsage: Math.floor(Math.random() * 2000) + 500,
        moodEntriesDaily: Math.floor(Math.random() * 1500) + 300,
        reportGenerations: Math.floor(Math.random() * 100) + 20,
        exportRequests: Math.floor(Math.random() * 80) + 15,
        storageUsed: Math.random() * 30 + 40, // GB
        bandwidthUsed: Math.random() * 500 + 200 // GB
      },
      demographics: {
        ageGroups: {
          '18-25': Math.floor(Math.random() * 20) + 15,
          '26-35': Math.floor(Math.random() * 25) + 25,
          '36-45': Math.floor(Math.random() * 20) + 20,
          '46-55': Math.floor(Math.random() * 15) + 15,
          '56+': Math.floor(Math.random() * 10) + 10
        },
        usagePatterns: {
          'morning': Math.floor(Math.random() * 30) + 25,
          'afternoon': Math.floor(Math.random() * 35) + 30,
          'evening': Math.floor(Math.random() * 40) + 35,
          'night': Math.floor(Math.random() * 15) + 10
        },
        preferredLanguages: {
          'English': Math.floor(Math.random() * 40) + 50,
          'Spanish': Math.floor(Math.random() * 20) + 15,
          'French': Math.floor(Math.random() * 15) + 10,
          'German': Math.floor(Math.random() * 10) + 8,
          'Portuguese': Math.floor(Math.random() * 8) + 5,
          'Other': Math.floor(Math.random() * 10) + 12
        },
        deviceTypes: {
          'Desktop': Math.floor(Math.random() * 25) + 35,
          'Mobile': Math.floor(Math.random() * 30) + 45,
          'Tablet': Math.floor(Math.random() * 15) + 15,
          'Other': Math.floor(Math.random() * 5) + 5
        },
        geographicDistribution: {
          'North America': Math.floor(Math.random() * 20) + 35,
          'Europe': Math.floor(Math.random() * 15) + 25,
          'Asia': Math.floor(Math.random() * 15) + 20,
          'South America': Math.floor(Math.random() * 8) + 8,
          'Africa': Math.floor(Math.random() * 5) + 5,
          'Oceania': Math.floor(Math.random() * 3) + 3,
          'Other': Math.floor(Math.random() * 3) + 4
        }
      },
      highRiskUsers: {
        count: Math.floor(Math.random() * 50) + 20,
        urgentCases: Math.floor(Math.random() * 8) + 2,
        pendingInterventions: Math.floor(Math.random() * 15) + 5,
        recentEscalations: Math.floor(Math.random() * 3) + 1
      },
      referralTracking: {
        totalReferrals: Math.floor(Math.random() * 200) + 100,
        successfulConnections: Math.floor(Math.random() * 150) + 75,
        outcomeTracking: {
          'completed': Math.floor(Math.random() * 80) + 60,
          'in-progress': Math.floor(Math.random() * 40) + 25,
          'cancelled': Math.floor(Math.random() * 15) + 8,
          'no-show': Math.floor(Math.random() * 10) + 5
        },
        followUpRate: Math.random() * 0.25 + 0.70 // 70-95%
      },
      systemHealth: {
        uptime: Math.random() * 0.05 + 0.95, // 95-100%
        responseTime: Math.random() * 200 + 100, // 100-300ms
        errorRate: Math.random() * 0.02 + 0.001, // 0.1-2.1%
        apiHealth: {
          'Azure Cognitive Services': Math.random() > 0.1 ? 'healthy' : 'warning',
          'Database': Math.random() > 0.05 ? 'healthy' : 'warning',
          'File Storage': Math.random() > 0.02 ? 'healthy' : 'critical',
          'Authentication': 'healthy',
          'Analytics Engine': Math.random() > 0.08 ? 'healthy' : 'warning'
        },
        resourceUsage: {
          'CPU': Math.random() * 40 + 30, // 30-70%
          'Memory': Math.random() * 30 + 40, // 40-70%
          'Disk': Math.random() * 20 + 60, // 60-80%
          'Network': Math.random() * 50 + 20 // 20-70%
        }
      }
    };

    return baseMetrics;
  };

  const checkForAlerts = (metrics: AdminMetrics) => {
    const newAlerts: typeof alerts = [];

    // Critical alerts
    if (metrics.mentalHealthTrends.crisisAlerts > 3) {
      newAlerts.push({
        id: `crisis-${Date.now()}`,
        type: 'critical',
        message: `${metrics.mentalHealthTrends.crisisAlerts} crisis alerts detected in the last ${selectedTimeRange}`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.systemHealth.uptime < 0.98) {
      newAlerts.push({
        id: `uptime-${Date.now()}`,
        type: 'critical',
        message: `System uptime below 98%: ${(metrics.systemHealth.uptime * 100).toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Warning alerts
    if (metrics.highRiskUsers.urgentCases > 5) {
      newAlerts.push({
        id: `urgent-${Date.now()}`,
        type: 'warning',
        message: `${metrics.highRiskUsers.urgentCases} urgent high-risk cases require immediate attention`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (metrics.systemHealth.errorRate > 0.02) {
      newAlerts.push({
        id: `errors-${Date.now()}`,
        type: 'warning',
        message: `Error rate above 2%: ${(metrics.systemHealth.errorRate * 100).toFixed(2)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Info alerts
    if (metrics.userEngagement.churnRate > 0.1) {
      newAlerts.push({
        id: `churn-${Date.now()}`,
        type: 'info',
        message: `User churn rate elevated: ${(metrics.userEngagement.churnRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    setAlerts(prev => [...prev.filter(a => a.acknowledged), ...newAlerts]);
  };

  const startAutoRefresh = () => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
    }

    refreshTimer.current = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();
  const formatBytes = (bytes: number) => `${bytes.toFixed(1)} GB`;
  const formatTime = (ms: number) => `${ms.toFixed(0)}ms`;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-600">Failed to load dashboard data</p>
          <button 
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏥 SATA Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Real-time monitoring and analytics for mental health platform
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
              
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={isLoading}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Bar */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center space-x-4">
              <span className="text-red-600 font-medium">🚨 Active Alerts:</span>
              <div className="flex-1 flex flex-wrap gap-2">
                {alerts.filter(a => !a.acknowledged).slice(0, 3).map(alert => (
                  <div
                    key={alert.id}
                    className={`px-3 py-1 rounded-full text-sm flex items-center space-x-2 ${
                      alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <span>{alert.message}</span>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-2 text-xs opacity-70 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {alerts.filter(a => !a.acknowledged).length > 3 && (
                  <span className="text-red-600 text-sm">
                    +{alerts.filter(a => !a.acknowledged).length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(metrics.userEngagement.dailyActiveUsers)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(metrics.userEngagement.totalActiveUsers)} total
                </p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Mood</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics.mentalHealthTrends.averageMoodScore.toFixed(1)}/10
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center">
                  {getTrendIcon(metrics.mentalHealthTrends.moodTrend)}
                  <span className="ml-1">{metrics.mentalHealthTrends.moodTrend}</span>
                </p>
              </div>
              <div className="text-3xl">😊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(metrics.highRiskUsers.count)}
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {metrics.highRiskUsers.urgentCases} urgent
                </p>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPercentage(metrics.systemHealth.uptime)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTime(metrics.systemHealth.responseTime)} avg response
                </p>
              </div>
              <div className="text-3xl">💚</div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Engagement Metrics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 User Engagement</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Session Duration</p>
                  <p className="text-xl font-semibold">{metrics.userEngagement.sessionDuration} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatPercentage(metrics.userEngagement.retentionRate)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Feature Usage</p>
                <div className="space-y-2">
                  {Object.entries(metrics.userEngagement.featureUsage).map(([feature, usage]) => (
                    <div key={feature} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{feature.replace('-', ' ')}</span>
                      <span className="text-sm font-medium">{formatNumber(usage)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mental Health Trends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Mental Health Trends</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Assessments</p>
                  <p className="text-xl font-semibold">{metrics.mentalHealthTrends.assessmentCompletions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interventions</p>
                  <p className="text-xl font-semibold text-yellow-600">
                    {metrics.mentalHealthTrends.interventionTriggers}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Risk Level Distribution</p>
                <div className="space-y-2">
                  {Object.entries(metrics.mentalHealthTrends.riskLevelDistribution).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className={`text-sm capitalize ${
                        level === 'critical' ? 'text-red-600' :
                        level === 'high' ? 'text-orange-600' :
                        level === 'moderate' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {level} risk
                      </span>
                      <span className="text-sm font-medium">{count}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Utilization & Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resource Utilization */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Resource Utilization</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Voice Analysis</p>
                <p className="text-lg font-semibold">{formatNumber(metrics.resourceUtilization.voiceAnalysisUsage)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Daily Mood Entries</p>
                <p className="text-lg font-semibold">{formatNumber(metrics.resourceUtilization.moodEntriesDaily)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reports Generated</p>
                <p className="text-lg font-semibold">{formatNumber(metrics.resourceUtilization.reportGenerations)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-lg font-semibold">{formatBytes(metrics.resourceUtilization.storageUsed)}</p>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 User Demographics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Age Groups</p>
                <div className="space-y-1">
                  {Object.entries(metrics.demographics.ageGroups).map(([age, percentage]) => (
                    <div key={age} className="flex items-center justify-between">
                      <span className="text-sm">{age}</span>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Device Types</p>
                <div className="space-y-1">
                  {Object.entries(metrics.demographics.deviceTypes).map(([device, percentage]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm">{device}</span>
                      <span className="text-sm font-medium">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High-Risk Users & Referral Tracking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* High-Risk Users */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ High-Risk User Monitoring</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Urgent Cases</p>
                  <p className="text-2xl font-bold text-red-700">{metrics.highRiskUsers.urgentCases}</p>
                  <p className="text-xs text-red-500">Require immediate attention</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-600 font-medium">Pending Interventions</p>
                  <p className="text-2xl font-bold text-yellow-700">{metrics.highRiskUsers.pendingInterventions}</p>
                  <p className="text-xs text-yellow-500">Awaiting response</p>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Recent Escalations</p>
                <p className="text-xl font-bold text-orange-700">{metrics.highRiskUsers.recentEscalations}</p>
                <p className="text-xs text-orange-500">In the last {selectedTimeRange}</p>
              </div>
            </div>
          </div>

          {/* Referral Tracking */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏥 Referral Tracking</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                  <p className="text-xl font-semibold">{formatNumber(metrics.referralTracking.totalReferrals)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-xl font-semibold text-green-600">
                    {formatPercentage(metrics.referralTracking.successfulConnections / metrics.referralTracking.totalReferrals)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Outcome Tracking</p>
                <div className="space-y-2">
                  {Object.entries(metrics.referralTracking.outcomeTracking).map(([outcome, count]) => (
                    <div key={outcome} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{outcome.replace('-', ' ')}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Follow-up Rate</p>
                <p className="text-lg font-semibold text-blue-600">
                  {formatPercentage(metrics.referralTracking.followUpRate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* System Health Monitoring */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💻 System Health Monitoring</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">API Health Status</h4>
              <div className="space-y-2">
                {Object.entries(metrics.systemHealth.apiHealth).map(([service, status]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-sm">{service}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Resource Usage</h4>
              <div className="space-y-3">
                {Object.entries(metrics.systemHealth.resourceUsage).map(([resource, usage]) => (
                  <div key={resource}>
                    <div className="flex justify-between text-sm">
                      <span>{resource}</span>
                      <span>{usage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          usage > 80 ? 'bg-red-500' :
                          usage > 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold text-green-600">
                {formatPercentage(metrics.systemHealth.uptime)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatTime(metrics.systemHealth.responseTime)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-lg font-semibold text-red-600">
                {formatPercentage(metrics.systemHealth.errorRate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
