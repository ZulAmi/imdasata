/**
 * SATA Mood Trends Visualization Component
 * Advanced charts and visualizations for mood tracking data
 */

import React, { useState, useEffect, useRef } from 'react';
import { moodAnalyticsEngine, MoodEntry, MoodTrend, MoodPattern } from '../lib/mood-analytics-engine';

interface MoodTrendsVisualizationProps {
  userId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  onInsightGenerated?: (insight: any) => void;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
  }[];
}

const MoodTrendsVisualization: React.FC<MoodTrendsVisualizationProps> = ({
  userId,
  timeRange,
  onInsightGenerated
}) => {
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [trends, setTrends] = useState<MoodTrend[]>([]);
  const [patterns, setPatterns] = useState<MoodPattern[]>([]);
  const [activeChart, setActiveChart] = useState<'timeline' | 'weekly' | 'monthly' | 'correlations'>('timeline');
  const [isLoading, setIsLoading] = useState(true);

  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadMoodData();
  }, [userId, timeRange]);

  const loadMoodData = async () => {
    setIsLoading(true);
    try {
      // Get mood entries
      const entries = moodAnalyticsEngine.getMoodEntries(
        userId,
        timeRange?.start,
        timeRange?.end
      );
      setMoodEntries(entries);

      // Calculate trends and patterns
      const calculatedTrends = moodAnalyticsEngine.calculateMoodTrends(userId);
      const identifiedPatterns = moodAnalyticsEngine.identifyMoodPatterns(userId);
      
      setTrends(calculatedTrends);
      setPatterns(identifiedPatterns);

      // Generate insights
      const insights = await moodAnalyticsEngine.generateInsights(userId);
      if (onInsightGenerated && insights.length > 0) {
        insights.forEach(insight => onInsightGenerated(insight));
      }

    } catch (error) {
      console.error('Error loading mood data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimelineChartData = (): ChartData => {
    const last30Days = moodEntries.slice(0, 30).reverse(); // Show chronologically
    
    return {
      labels: last30Days.map(entry => 
        entry.timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ),
      datasets: [
        {
          label: 'Mood Score',
          data: last30Days.map(entry => entry.moodScore),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const generateWeeklyPatternData = (): ChartData => {
    const weeklyPattern = patterns.find(p => p.type === 'weekly');
    
    if (!weeklyPattern) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Average Mood',
          data: [0, 0, 0, 0, 0, 0, 0],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }]
      };
    }

    return {
      labels: weeklyPattern.data.labels,
      datasets: [
        {
          label: 'Average Mood by Day',
          data: weeklyPattern.data.values,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }
      ]
    };
  };

  const generateMonthlyTrendData = (): ChartData => {
    // Group entries by month
    const monthlyData = new Map<string, { sum: number; count: number }>();
    
    moodEntries.forEach(entry => {
      const monthKey = entry.timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { sum: 0, count: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      data.sum += entry.moodScore;
      data.count += 1;
    });

    const months = Array.from(monthlyData.keys()).sort();
    const averages = months.map(month => {
      const data = monthlyData.get(month)!;
      return data.sum / data.count;
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Monthly Average',
          data: averages,
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const renderSimpleChart = (data: ChartData, type: 'line' | 'bar' = 'line') => {
    if (!data.datasets[0] || data.datasets[0].data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No data available for this visualization</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.datasets[0].data);
    const minValue = Math.min(...data.datasets[0].data);
    const range = maxValue - minValue || 1;

    return (
      <div className="h-64 bg-white p-4 rounded-lg border border-gray-200">
        <div className="h-full flex items-end space-x-1">
          {data.datasets[0].data.map((value, index) => {
            const height = ((value - minValue) / range) * 200 + 20; // Min height 20px
            const color = data.datasets[0].borderColor;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-600 mb-1">{value.toFixed(1)}</div>
                <div 
                  className="w-full rounded-t"
                  style={{ 
                    height: `${height}px`, 
                    backgroundColor: color,
                    opacity: 0.7 
                  }}
                />
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center">
                  {data.labels[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTrendAnalysis = () => {
    if (trends.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>Need more data to analyze trends</p>
          <p className="text-sm mt-1">Add at least 7 mood entries to see trend analysis</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {trends.map((trend, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            trend.direction === 'improving' ? 'border-green-500 bg-green-50' :
            trend.direction === 'declining' ? 'border-red-500 bg-red-50' :
            'border-yellow-500 bg-yellow-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold capitalize">
                {trend.period} Trend: {trend.direction}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                trend.confidence > 0.8 ? 'bg-green-200 text-green-800' :
                trend.confidence > 0.6 ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {(trend.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className={`text-2xl mr-2 ${
                  trend.direction === 'improving' ? '📈' :
                  trend.direction === 'declining' ? '📉' : '➡️'
                }`}>
                  {trend.direction === 'improving' ? '📈' :
                   trend.direction === 'declining' ? '📉' : '➡️'}
                </span>
                <div>
                  <div className="font-medium">
                    {Math.abs(trend.change).toFixed(1)}% change
                  </div>
                  <div className="text-sm text-gray-600">
                    over {trend.period} period
                  </div>
                </div>
              </div>
            </div>

            {trend.significantEvents && trend.significantEvents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">Significant Events:</div>
                <div className="space-y-1">
                  {trend.significantEvents.map((event, eventIndex) => (
                    <div key={eventIndex} className="text-sm text-gray-600">
                      <span className={`mr-2 ${
                        event.type === 'peak' ? '🔺' : 
                        event.type === 'dip' ? '🔻' : '🔄'
                      }`}>
                        {event.type === 'peak' ? '🔺' : 
                         event.type === 'dip' ? '🔻' : '🔄'}
                      </span>
                      {event.date.toLocaleDateString()} - {event.type}
                      {event.context && `: ${event.context}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPatternAnalysis = () => {
    if (patterns.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No patterns detected yet</p>
          <p className="text-sm mt-1">Continue logging moods to identify patterns</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {patterns.map((pattern, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 capitalize">
                  {pattern.type} Pattern
                </h4>
                <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                pattern.strength > 0.7 ? 'bg-green-200 text-green-800' :
                pattern.strength > 0.4 ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {(pattern.strength * 100).toFixed(0)}% strength
              </span>
            </div>

            {/* Pattern visualization */}
            <div className="mb-4">
              {renderSimpleChart({
                labels: pattern.data.labels,
                datasets: [{
                  label: 'Pattern Data',
                  data: pattern.data.values,
                  borderColor: pattern.type === 'weekly' ? '#10B981' : 
                              pattern.type === 'temporal' ? '#F59E0B' : '#8B5CF6',
                  backgroundColor: pattern.type === 'weekly' ? 'rgba(16, 185, 129, 0.1)' : 
                                  pattern.type === 'temporal' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)'
                }]
              })}
            </div>

            {pattern.recommendation && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">💡</span>
                  <div>
                    <div className="font-medium text-blue-900">Recommendation</div>
                    <p className="text-sm text-blue-800 mt-1">{pattern.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderCorrelationAnalysis = () => {
    const correlations = moodAnalyticsEngine.calculateAssessmentCorrelations(userId);
    
    if (correlations.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No assessment correlations available</p>
          <p className="text-sm mt-1">Complete assessments to see correlations with mood data</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {correlations.map((correlation, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-gray-900">{correlation.factor}</h4>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  Math.abs(correlation.correlation) > 0.7 ? 'text-green-600' :
                  Math.abs(correlation.correlation) > 0.4 ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {(Math.abs(correlation.correlation) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">correlation</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{correlation.description}</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Sample size: {correlation.sampleSize} data points
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                correlation.significance > 0.8 ? 'bg-green-200 text-green-800' :
                correlation.significance > 0.5 ? 'bg-yellow-200 text-yellow-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {(correlation.significance * 100).toFixed(0)}% significant
              </span>
            </div>

            {correlation.recommendation && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">📋</span>
                  <div>
                    <div className="font-medium text-blue-900">Clinical Insight</div>
                    <p className="text-sm text-blue-800 mt-1">{correlation.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const getChartData = () => {
    switch (activeChart) {
      case 'timeline':
        return generateTimelineChartData();
      case 'weekly':
        return generateWeeklyPatternData();
      case 'monthly':
        return generateMonthlyTrendData();
      default:
        return generateTimelineChartData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Analyzing mood trends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { id: 'timeline', label: '📈 Timeline', description: 'Daily mood progression' },
          { id: 'weekly', label: '📅 Weekly Pattern', description: 'Day-of-week analysis' },
          { id: 'monthly', label: '📊 Monthly Trends', description: 'Long-term changes' },
          { id: 'correlations', label: '🔗 Correlations', description: 'Assessment relationships' }
        ].map((chart) => (
          <button
            key={chart.id}
            onClick={() => setActiveChart(chart.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeChart === chart.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={chart.description}
          >
            {chart.label}
          </button>
        ))}
      </div>

      {/* Main Visualization */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeChart === 'correlations' ? (
          renderCorrelationAnalysis()
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeChart === 'timeline' && 'Mood Timeline'}
                {activeChart === 'weekly' && 'Weekly Pattern'}
                {activeChart === 'monthly' && 'Monthly Trends'}
              </h3>
              <div className="text-sm text-gray-500">
                {moodEntries.length} total entries
              </div>
            </div>
            
            {renderSimpleChart(getChartData())}
            
            {activeChart === 'timeline' && (
              <div className="text-sm text-gray-600 text-center">
                Showing last 30 mood entries chronologically
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Trend Analysis</h3>
        {renderTrendAnalysis()}
      </div>

      {/* Pattern Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Pattern Recognition</h3>
        {renderPatternAnalysis()}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-blue-600">
            {moodEntries.length > 0 
              ? (moodEntries.reduce((sum, entry) => sum + entry.moodScore, 0) / moodEntries.length).toFixed(1)
              : '0'
            }
          </div>
          <div className="text-sm text-gray-600">Average Mood</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-green-600">
            {trends.filter(t => t.direction === 'improving').length}
          </div>
          <div className="text-sm text-gray-600">Improving Trends</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-purple-600">
            {patterns.length}
          </div>
          <div className="text-sm text-gray-600">Patterns Detected</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <div className="text-2xl font-bold text-orange-600">
            {moodEntries.filter(e => e.voiceNote).length}
          </div>
          <div className="text-sm text-gray-600">Voice Notes</div>
        </div>
      </div>
    </div>
  );
};

export default MoodTrendsVisualization;
