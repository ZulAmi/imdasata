import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PopulationTrends, 
  DemographicBreakdown, 
  CompletionMetrics, 
  HighRiskPatterns, 
  VisualizationData 
} from '../lib/phq4-analytics';

interface DashboardSummary {
  trends: PopulationTrends;
  demographics: DemographicBreakdown;
  completion: CompletionMetrics;
  patterns: HighRiskPatterns;
  visualizations: VisualizationData;
}

interface Alert {
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const auth = localStorage.getItem('adminAuthenticated');
        if (auth === 'true') {
          setIsAuthenticated(true);
        }
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [timeRange, selectedCountry, isAuthenticated]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminAuthenticated');
      window.location.href = '/admin-login';
    }
  };

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">You need to be authenticated to access the analytics dashboard.</p>
          <Link href="/admin-login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString();
      
      const params = new URLSearchParams({
        type: 'dashboard-summary',
        startDate,
        endDate
      });

      if (selectedCountry !== 'all') {
        params.append('country', selectedCountry);
      }

      const response = await fetch(`/api/analytics/phq4?${params}`);
      const dashboardData = await response.json();
      setData(dashboardData);

      // Generate alerts based on data
      const generatedAlerts = generateDashboardAlerts(dashboardData);
      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  const generateDashboardAlerts = (dashboardData: DashboardSummary): Alert[] => {
    const alerts: Alert[] = [];

    // High risk percentage alert
    if (dashboardData.patterns.highRiskPercentage > 30) {
      alerts.push({
        type: 'warning',
        title: 'High Risk Population Alert',
        message: `${dashboardData.patterns.highRiskPercentage.toFixed(1)}% of assessments indicate high risk levels`,
        priority: 'high',
        timestamp: new Date().toISOString()
      });
    }

    // Immediate intervention needed
    if (dashboardData.patterns.interventionTriggers.immediateIntervention.length > 0) {
      alerts.push({
        type: 'critical',
        title: 'Immediate Intervention Required',
        message: `${dashboardData.patterns.interventionTriggers.immediateIntervention.length} users require immediate support`,
        priority: 'critical',
        timestamp: new Date().toISOString()
      });
    }

    // Low completion rate
    if (dashboardData.completion.overallCompletionRate < 70) {
      alerts.push({
        type: 'info',
        title: 'Low Completion Rate',
        message: `Assessment completion rate is ${dashboardData.completion.overallCompletionRate.toFixed(1)}%`,
        priority: 'medium',
        timestamp: new Date().toISOString()
      });
    }

    // Trending concerns
    if (dashboardData.trends.overallTrends.scoreChange > 10) {
      alerts.push({
        type: 'warning',
        title: 'Increasing Mental Health Concerns',
        message: `Average scores have increased by ${dashboardData.trends.overallTrends.scoreChange.toFixed(1)}%`,
        priority: 'high',
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  };

  const exportData = async (includeMetadata = true) => {
    try {
      const params = new URLSearchParams({
        type: 'export-data',
        includeMetadata: includeMetadata.toString()
      });

      if (selectedCountry !== 'all') {
        params.append('country', selectedCountry);
      }

      const response = await fetch(`/api/analytics/phq4?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phq4-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <p className="text-red-600">Error loading dashboard data</p>
          <button 
            onClick={fetchDashboardData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">PHQ-4 Analytics Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Mental Health Assessment Analytics & Insights</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleLogout}
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                Logout
              </button>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
                Back to App
              </Link>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <select 
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Countries</option>
                {Object.keys(data.demographics.byCountry).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Alerts & Notifications</h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-500 text-red-800' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                  'bg-blue-50 border-blue-500 text-blue-800'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm mt-1">{alert.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      alert.priority === 'critical' ? 'bg-red-200 text-red-800' :
                      alert.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                      alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Assessments</h3>
            <p className="text-3xl font-bold text-gray-800">{data.trends.totalAssessments.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-2">
              +{data.trends.overallTrends.participationGrowth.toFixed(1)}% growth
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
            <p className="text-3xl font-bold text-gray-800">{data.completion.overallCompletionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600 mt-2">
              Avg. time: {Math.round(data.completion.averageCompletionTime)}s
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">High Risk Users</h3>
            <p className="text-3xl font-bold text-red-600">{data.patterns.totalHighRisk}</p>
            <p className="text-sm text-red-600 mt-2">
              {data.patterns.highRiskPercentage.toFixed(1)}% of completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Countries Served</h3>
            <p className="text-3xl font-bold text-blue-600">{Object.keys(data.demographics.byCountry).length}</p>
            <p className="text-sm text-blue-600 mt-2">
              {Object.keys(data.demographics.byLanguage).length} languages
            </p>
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Risk Level Distribution</h3>
            <div className="space-y-4">
              {data.visualizations.scoreDistribution.datasets[0].data.map((value, index) => {
                const label = data.visualizations.scoreDistribution.labels[index];
                const color = data.visualizations.scoreDistribution.datasets[0].backgroundColor[index];
                const percentage = data.trends.totalAssessments > 0 
                  ? (value / data.trends.totalAssessments * 100).toFixed(1)
                  : '0';
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-800">{value}</span>
                      <span className="text-xs text-gray-500 ml-2">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Countries by Risk</h3>
            <div className="space-y-3">
              {Object.entries(data.demographics.byCountry)
                .sort(([,a], [,b]) => 
                  (b.riskDistribution.severe + b.riskDistribution.moderate) - 
                  (a.riskDistribution.severe + a.riskDistribution.moderate)
                )
                .slice(0, 5)
                .map(([country, stats]) => {
                  const highRiskPercentage = stats.riskDistribution.severe + stats.riskDistribution.moderate;
                  return (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{country}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-800">
                          {stats.totalAssessments} assessments
                        </span>
                        <span className={`text-xs ml-2 px-2 py-1 rounded ${
                          highRiskPercentage > 50 ? 'bg-red-100 text-red-800' :
                          highRiskPercentage > 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {highRiskPercentage}% high risk
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Language and Demographic Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Language Usage</h3>
            <div className="space-y-3">
              {Object.entries(data.demographics.byLanguage)
                .sort(([,a], [,b]) => b.totalAssessments - a.totalAssessments)
                .map(([language, stats]) => {
                  const languageNames: Record<string, string> = {
                    'en': 'English',
                    'zh': 'Chinese',
                    'bn': 'Bengali',
                    'ta': 'Tamil',
                    'my': 'Burmese',
                    'idn': 'Indonesian'
                  };
                  
                  return (
                    <div key={language} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {languageNames[language] || language}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-800">
                          {stats.totalAssessments}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({stats.completionRate.toFixed(1)}% completion)
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Intervention Triggers</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="text-sm font-medium text-red-800">Immediate Intervention</h4>
                <p className="text-2xl font-bold text-red-600">
                  {data.patterns.interventionTriggers.immediateIntervention.length}
                </p>
                <p className="text-xs text-red-600">users requiring urgent support</p>
              </div>

              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="text-sm font-medium text-yellow-800">Follow-up Required</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.patterns.interventionTriggers.followUpRequired.length}
                </p>
                <p className="text-xs text-yellow-600">users for follow-up care</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="text-sm font-medium text-blue-800">Monitoring List</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {data.patterns.interventionTriggers.monitoringList.length}
                </p>
                <p className="text-xs text-blue-600">users for continued monitoring</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trends Analysis */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Score Change</h4>
              <p className={`text-2xl font-bold ${
                data.trends.overallTrends.scoreChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {data.trends.overallTrends.scoreChange > 0 ? '+' : ''}
                {data.trends.overallTrends.scoreChange.toFixed(1)}%
              </p>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Participation Growth</h4>
              <p className="text-2xl font-bold text-blue-600">
                +{data.trends.overallTrends.participationGrowth.toFixed(1)}%
              </p>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Completion Time</h4>
              <p className="text-2xl font-bold text-gray-800">
                {Math.round(data.completion.averageCompletionTime)}s
              </p>
            </div>
          </div>
        </div>

        {/* Export and Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Export & Research</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => exportData(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Export Full Dataset (with metadata)
            </button>
            <button
              onClick={() => exportData(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Export Basic Dataset
            </button>
            <button
              onClick={fetchDashboardData}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              🔄 Refresh Data
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            All exported data is anonymized and PDPA compliant. Research use requires institutional ethics approval.
          </p>
        </div>
      </div>
    </div>
  );
}
