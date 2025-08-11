/**
 * Buddy System Admin Dashboard
 * Administrative interface for managing buddy pairs, reports, and system analytics
 */

import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { buddySystem, BuddyUser, BuddyPair, SafetyReport } from '../lib/buddy-system';

const BuddyAdminDashboard: React.FC = () => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'pairs' | 'reports' | 'analytics'>('overview');
  const [users, setUsers] = useState<BuddyUser[]>([]);
  const [pairs, setPairs] = useState<BuddyPair[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activePairs: 0,
    pendingReports: 0,
    totalInteractions: 0,
    averageCompatibility: 0,
    usersByExperience: { newcomer: 0, experienced: 0, veteran: 0 },
    usersByLanguage: {} as { [key: string]: number },
    recentMatches: 0,
  });

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    const allUsers = buddySystem.getActiveUsers();
    const allPairs = buddySystem.getActivePairs();
    const allReports = buddySystem.getPendingReports();

    setUsers(allUsers);
    setPairs(allPairs);
    setReports(allReports);

    // Calculate analytics
    const totalInteractions = allPairs.reduce((sum, pair) => sum + pair.interactionCount, 0);
    const averageCompatibility = allPairs.length > 0 
      ? allPairs.reduce((sum, pair) => sum + pair.compatibilityScore, 0) / allPairs.length 
      : 0;

    const usersByExperience = allUsers.reduce((acc, user) => {
      acc[user.experienceLevel]++;
      return acc;
    }, { newcomer: 0, experienced: 0, veteran: 0 });

    const usersByLanguage = allUsers.reduce((acc, user) => {
      acc[user.language] = (acc[user.language] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const recentMatches = allPairs.filter(pair => {
      const daysSincePaired = (Date.now() - pair.pairedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePaired <= 7;
    }).length;

    setAnalytics({
      totalUsers: allUsers.length,
      activePairs: allPairs.length,
      pendingReports: allReports.length,
      totalInteractions,
      averageCompatibility: Math.round(averageCompatibility),
      usersByExperience,
      usersByLanguage,
      recentMatches,
    });
  };

  const handleReportAction = (reportId: string, action: 'resolve' | 'escalate' | 'investigate', notes?: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    report.status = action === 'resolve' ? 'resolved' : action === 'escalate' ? 'escalated' : 'investigating';
    if (notes) {
      report.moderatorNotes = notes;
    }

    setReports(prev => prev.map(r => r.id === reportId ? report : r));
    setSelectedReport(null);
  };

  const endBuddyPair = (pairId: string, reason: string) => {
    if (buddySystem.endBuddyPair(pairId, reason as any)) {
      loadDashboardData();
    }
  };

  const suspendUser = (userId: string, reason: string) => {
    const user = buddySystem.getUser(userId);
    if (user) {
      user.isActive = false;
      // End current buddy pair if exists
      if (user.currentBuddyId) {
        const pair = buddySystem.getUserPair(userId);
        if (pair) {
          buddySystem.endBuddyPair(pair.id, 'report');
        }
      }
      loadDashboardData();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('buddy_admin_dashboard', 'Buddy System Admin Dashboard')}
            </h1>
            <button
              onClick={loadDashboardData}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {t('refresh', 'Refresh Data')}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'overview', label: t('overview', 'Overview'), icon: '📊' },
                { key: 'users', label: t('users', 'Users'), icon: '👥' },
                { key: 'pairs', label: t('pairs', 'Buddy Pairs'), icon: '🤝' },
                { key: 'reports', label: t('reports', 'Safety Reports'), icon: '⚠️' },
                { key: 'analytics', label: t('analytics', 'Analytics'), icon: '📈' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.key === 'reports' && reports.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                      {reports.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('total_users', 'Total Users')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.totalUsers}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">🤝</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('active_pairs', 'Active Pairs')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.activePairs}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">💬</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('total_interactions', 'Total Interactions')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.totalInteractions}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {t('pending_reports', 'Pending Reports')}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {analytics.pendingReports}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('recent_matches', 'Recent Matches')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {pairs.slice(0, 5).map(pair => {
                      const user1 = users.find(u => u.id === pair.user1Id);
                      const user2 = users.find(u => u.id === pair.user2Id);
                      return (
                        <div key={pair.id} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user1?.name} ↔ {user2?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t('compatibility', 'Compatibility')}: {pair.compatibilityScore}%
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(pair.pairedAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t('system_health', 'System Health')}
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('average_compatibility', 'Average Compatibility')}</span>
                      <span className="text-sm font-medium text-gray-900">{analytics.averageCompatibility}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('recent_matches_week', 'Matches This Week')}</span>
                      <span className="text-sm font-medium text-gray-900">{analytics.recentMatches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">{t('avg_interactions_per_pair', 'Avg Interactions/Pair')}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {analytics.activePairs > 0 ? Math.round(analytics.totalInteractions / analytics.activePairs) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t('user_management', 'User Management')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('user', 'User')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('experience', 'Experience')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('buddy_status', 'Buddy Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('trust_score', 'Trust Score')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('points', 'Points')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => {
                    const buddy = user.currentBuddyId ? users.find(u => u.id === user.currentBuddyId) : null;
                    return (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.language} • {user.country}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.experienceLevel === 'newcomer' ? 'bg-blue-100 text-blue-800' :
                            user.experienceLevel === 'experienced' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {user.experienceLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {buddy ? (
                            <div className="text-sm text-gray-900">
                              {t('paired_with', 'Paired with')} {buddy.name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">{t('seeking_buddy', 'Seeking buddy')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.trustScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.totalBuddyPoints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => suspendUser(user.id, 'Admin action')}
                            className="text-red-600 hover:text-red-900 mr-3"
                          >
                            {t('suspend', 'Suspend')}
                          </button>
                          {user.currentBuddyId && (
                            <button
                              onClick={() => {
                                const pair = buddySystem.getUserPair(user.id);
                                if (pair) endBuddyPair(pair.id, 'Admin action');
                              }}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              {t('end_pair', 'End Pair')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pairs' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {t('buddy_pairs_management', 'Buddy Pairs Management')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('pair', 'Pair')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('compatibility', 'Compatibility')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('interactions', 'Interactions')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('last_activity', 'Last Activity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pairs.map(pair => {
                    const user1 = users.find(u => u.id === pair.user1Id);
                    const user2 = users.find(u => u.id === pair.user2Id);
                    const daysSinceActivity = Math.floor((Date.now() - pair.lastInteraction.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={pair.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user1?.name} ↔ {user2?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t('paired_on', 'Paired on')} {formatDate(pair.pairedAt)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{pair.compatibilityScore}%</div>
                            <div className={`ml-2 w-16 bg-gray-200 rounded-full h-2`}>
                              <div
                                className={`h-2 rounded-full ${
                                  pair.compatibilityScore >= 80 ? 'bg-green-500' :
                                  pair.compatibilityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${pair.compatibilityScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pair.interactionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {daysSinceActivity === 0 ? t('today', 'Today') :
                             daysSinceActivity === 1 ? t('yesterday', 'Yesterday') :
                             `${daysSinceActivity} ${t('days_ago', 'days ago')}`}
                          </div>
                          {daysSinceActivity > 7 && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {t('inactive', 'Inactive')}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => endBuddyPair(pair.id, 'Admin intervention')}
                            className="text-red-600 hover:text-red-900"
                          >
                            {t('end_pair', 'End Pair')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('safety_reports', 'Safety Reports')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('report', 'Report')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('severity', 'Severity')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('reason', 'Reason')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('date', 'Date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map(report => {
                      const reporter = users.find(u => u.id === report.reporterId);
                      const reported = users.find(u => u.id === report.reportedUserId);
                      
                      return (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {reporter?.name} → {reported?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {report.description.substring(0, 50)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                              {report.severity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.reason.replace('-', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(report.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              {t('review', 'Review')}
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'resolve')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              {t('resolve', 'Resolve')}
                            </button>
                            <button
                              onClick={() => handleReportAction(report.id, 'escalate')}
                              className="text-red-600 hover:text-red-900"
                            >
                              {t('escalate', 'Escalate')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Experience Level Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('users_by_experience', 'Users by Experience Level')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.usersByExperience).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{level}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${analytics.totalUsers > 0 ? (count / analytics.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t('users_by_language', 'Users by Language')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(analytics.usersByLanguage).slice(0, 5).map(([language, count]) => (
                    <div key={language} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{language}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${analytics.totalUsers > 0 ? (count / analytics.totalUsers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pair Quality Metrics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('pair_quality_metrics', 'Pair Quality Metrics')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analytics.averageCompatibility}%</div>
                  <div className="text-sm text-gray-600">{t('avg_compatibility', 'Average Compatibility')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.activePairs > 0 ? Math.round(analytics.totalInteractions / analytics.activePairs) : 0}
                  </div>
                  <div className="text-sm text-gray-600">{t('avg_interactions', 'Interactions per Pair')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{analytics.recentMatches}</div>
                  <div className="text-sm text-gray-600">{t('matches_this_week', 'Matches This Week')}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Report Review Modal */}
      {selectedReport && (
        <ReportReviewModal
          report={selectedReport}
          users={users}
          onAction={handleReportAction}
          onClose={() => setSelectedReport(null)}
          t={t}
        />
      )}
    </div>
  );
};

// Report Review Modal Component
const ReportReviewModal: React.FC<{
  report: SafetyReport;
  users: BuddyUser[];
  onAction: (reportId: string, action: 'resolve' | 'escalate' | 'investigate', notes?: string) => void;
  onClose: () => void;
  t: any;
}> = ({ report, users, onAction, onClose, t }) => {
  const [notes, setNotes] = useState('');
  const reporter = users.find(u => u.id === report.reporterId);
  const reported = users.find(u => u.id === report.reportedUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {t('safety_report_review', 'Safety Report Review')}
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reporter', 'Reporter')}
              </label>
              <div className="text-sm text-gray-900">{reporter?.name || 'Unknown'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reported_user', 'Reported User')}
              </label>
              <div className="text-sm text-gray-900">{reported?.name || 'Unknown'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('reason', 'Reason')}
              </label>
              <div className="text-sm text-gray-900">{report.reason.replace('-', ' ')}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('severity', 'Severity')}
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                report.severity === 'low' ? 'bg-green-100 text-green-800' :
                report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                report.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {report.severity}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('description', 'Description')}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900">
              {report.description}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('report_time', 'Report Time')}
            </label>
            <div className="text-sm text-gray-900">
              {report.timestamp.toLocaleDateString()} {report.timestamp.toLocaleTimeString()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('moderator_notes', 'Moderator Notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('add_notes', 'Add your notes about this report...')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {t('close', 'Close')}
          </button>
          <div className="space-x-3">
            <button
              onClick={() => onAction(report.id, 'investigate', notes)}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
            >
              {t('investigate', 'Investigate')}
            </button>
            <button
              onClick={() => onAction(report.id, 'resolve', notes)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            >
              {t('resolve', 'Resolve')}
            </button>
            <button
              onClick={() => onAction(report.id, 'escalate', notes)}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            >
              {t('escalate', 'Escalate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default BuddyAdminDashboard;
