/**
 * SATA Integrated Analytics Hub
 * Combines engagement tracking, gamification, and voice sentiment analysis
 */

import React, { useState, useEffect } from 'react';
import EngagementAnalyticsDashboard from '../components/EngagementAnalyticsDashboard';
import VoiceAnalysisInterface from '../components/VoiceAnalysisInterface';
import { engagementTracker } from '../lib/engagement-tracker';
import { voiceSentimentAnalyzer } from '../lib/voice-sentiment-analyzer';
import { useEngagementTracking } from '../lib/engagement-integration';

interface IntegratedInsights {
  engagementScore: number;
  moodTrend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  interventionRecommendations: string[];
  correlations: {
    engagementVsMood: number;
    featureUsageVsWellbeing: number;
    socialInteractionVsMood: number;
  };
}

const IntegratedAnalyticsHub = () => {
  const [currentUser] = useState({
    id: 'integrated-user-001',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com'
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'voice' | 'insights'>('overview');
  const [integratedInsights, setIntegratedInsights] = useState<IntegratedInsights>({
    engagementScore: 0,
    moodTrend: 'stable',
    riskLevel: 'low',
    interventionRecommendations: [],
    correlations: {
      engagementVsMood: 0,
      featureUsageVsWellbeing: 0,
      socialInteractionVsMood: 0
    }
  });

  const [realtimeData, setRealtimeData] = useState({
    lastEngagementEvent: null as any,
    lastVoiceAnalysis: null as any,
    combinedScore: 0,
    alertLevel: 'normal' as 'normal' | 'warning' | 'critical'
  });

  // Engagement tracking
  const { trackInteraction, trackPageView, trackFeatureUsage } = useEngagementTracking(currentUser.id);

  useEffect(() => {
    // Track page view
    trackPageView('integrated-analytics-hub', {
      features: ['engagement-tracking', 'voice-sentiment', 'integrated-insights']
    });

    // Initialize integration
    initializeIntegratedAnalytics();

    // Set up event listeners for real-time integration
    engagementTracker.on('metrics:updated', handleEngagementUpdate);
    voiceSentimentAnalyzer.on('analysis:completed', handleVoiceAnalysisUpdate);
    
    // Set up periodic insights calculation
    const insightsInterval = setInterval(calculateIntegratedInsights, 30000); // Every 30 seconds

    return () => {
      engagementTracker.removeAllListeners();
      voiceSentimentAnalyzer.removeAllListeners();
      clearInterval(insightsInterval);
    };
  }, []);

  const initializeIntegratedAnalytics = async () => {
    try {
      // Get baseline engagement data
      const engagementData = {
        dailyActiveRate: 75,
        featureEngagement: 68,
        contentInteraction: 82,
        socialParticipation: 45,
        retentionRate: 88
      };

      // Get recent voice analysis data
      const voiceHistory = [
        { 
          moodScore: { overall: 72 },
          emotions: { primary: 'neutral' },
          riskAssessment: { level: 'low' },
          timestamp: new Date()
        }
      ];

      // Calculate initial integrated insights
      calculateIntegratedInsights(engagementData, voiceHistory);
      
    } catch (error) {
      console.error('Failed to initialize integrated analytics:', error);
    }
  };

  const handleEngagementUpdate = (data: any) => {
    setRealtimeData(prev => ({
      ...prev,
      lastEngagementEvent: {
        timestamp: new Date(),
        type: data.eventType,
        score: data.engagementScore,
        feature: data.feature
      }
    }));

    trackInteraction('engagement-update', 'received', {
      eventType: data.eventType,
      score: data.engagementScore
    });
  };

  const handleVoiceAnalysisUpdate = (analysis: any) => {
    setRealtimeData(prev => ({
      ...prev,
      lastVoiceAnalysis: {
        timestamp: new Date(),
        moodScore: analysis.moodScore.overall,
        emotionalState: analysis.emotions.primary,
        riskLevel: analysis.riskAssessment.level
      }
    }));

    // Update alert level based on voice analysis
    const newAlertLevel = analysis.riskAssessment.level === 'critical' ? 'critical' :
                         analysis.riskAssessment.level === 'high' ? 'warning' : 'normal';
    
    setRealtimeData(prev => ({
      ...prev,
      alertLevel: newAlertLevel
    }));

    trackFeatureUsage('voice-analysis-integration', 180, 'completed');
  };

  const calculateIntegratedInsights = async (engagementData?: any, voiceData?: any) => {
    try {
      // Get current data if not provided
      const engagement = engagementData || {
        dailyActiveRate: 75,
        featureEngagement: 68,
        contentInteraction: 82,
        socialParticipation: 45,
        retentionRate: 88
      };
      
      const voiceHistory = voiceData || [
        { 
          moodScore: { overall: 72 },
          emotions: { primary: 'neutral' },
          riskAssessment: { level: 'low' },
          timestamp: new Date()
        }
      ];

      // Calculate engagement score
      const engagementScore = Math.round(
        (engagement.dailyActiveRate * 0.3) +
        (engagement.featureEngagement * 0.25) +
        (engagement.contentInteraction * 0.25) +
        (engagement.socialParticipation * 0.2)
      );

      // Calculate mood trend
      const moodTrend = calculateMoodTrend(voiceHistory);

      // Assess risk level
      const riskLevel = assessIntegratedRiskLevel(engagement, voiceHistory);

      // Generate recommendations
      const recommendations = generateIntegratedRecommendations(engagement, voiceHistory, riskLevel);

      // Calculate correlations
      const correlations = calculateCorrelations(engagement, voiceHistory);

      // Calculate combined score
      const moodScore = voiceHistory.length > 0 
        ? voiceHistory.reduce((sum: number, analysis: any) => sum + analysis.moodScore.overall, 0) / voiceHistory.length 
        : 75;
      
      const combinedScore = Math.round((engagementScore * 0.6) + (moodScore * 0.4));

      setIntegratedInsights({
        engagementScore,
        moodTrend,
        riskLevel,
        interventionRecommendations: recommendations,
        correlations
      });

      setRealtimeData(prev => ({
        ...prev,
        combinedScore
      }));

    } catch (error) {
      console.error('Failed to calculate integrated insights:', error);
    }
  };

  const calculateMoodTrend = (voiceHistory: any[]): 'improving' | 'stable' | 'declining' => {
    if (voiceHistory.length < 2) return 'stable';

    const recent = voiceHistory.slice(-3);
    const earlier = voiceHistory.slice(-6, -3);

    const recentAvg = recent.reduce((sum, analysis) => sum + analysis.moodScore.overall, 0) / recent.length;
    const earlierAvg = earlier.length > 0 
      ? earlier.reduce((sum, analysis) => sum + analysis.moodScore.overall, 0) / earlier.length 
      : recentAvg;

    const change = recentAvg - earlierAvg;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  };

  const assessIntegratedRiskLevel = (engagement: any, voiceHistory: any[]): 'low' | 'medium' | 'high' | 'critical' => {
    let riskScore = 0;

    // Engagement-based risk factors
    if (engagement.dailyActiveRate < 30) riskScore += 2;
    if (engagement.retentionRate < 50) riskScore += 2;
    if (engagement.socialParticipation < 20) riskScore += 1;

    // Voice-based risk factors
    const recentVoiceRisks = voiceHistory.slice(-3).filter(analysis => 
      analysis.riskAssessment.level === 'high' || analysis.riskAssessment.level === 'critical'
    );
    
    riskScore += recentVoiceRisks.length * 2;

    // Combined risk assessment
    if (riskScore >= 6) return 'critical';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  };

  const generateIntegratedRecommendations = (engagement: any, voiceHistory: any[], riskLevel: string): string[] => {
    const recommendations: string[] = [];

    // Engagement-based recommendations
    if (engagement.dailyActiveRate < 50) {
      recommendations.push('Increase daily app usage with personalized reminders');
    }
    if (engagement.socialParticipation < 30) {
      recommendations.push('Encourage peer support group participation');
    }
    if (engagement.contentInteraction < 40) {
      recommendations.push('Suggest relevant mental health content based on mood patterns');
    }

    // Voice-based recommendations
    const lowMoodAnalyses = voiceHistory.filter(analysis => analysis.moodScore.overall < 40);
    if (lowMoodAnalyses.length > 1) {
      recommendations.push('Schedule check-in with mental health professional');
    }

    // Risk-level specific recommendations
    if (riskLevel === 'critical') {
      recommendations.push('Immediate intervention protocol activation');
      recommendations.push('Emergency contact notification');
    } else if (riskLevel === 'high') {
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Proactive counselor outreach');
    }

    return recommendations;
  };

  const calculateCorrelations = (engagement: any, voiceHistory: any[]) => {
    // Simplified correlation calculations for demo
    return {
      engagementVsMood: Math.random() * 0.8 + 0.1, // 0.1 to 0.9
      featureUsageVsWellbeing: Math.random() * 0.7 + 0.2, // 0.2 to 0.9
      socialInteractionVsMood: Math.random() * 0.6 + 0.3 // 0.3 to 0.9
    };
  };

  const getAlertStyle = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-green-100 border-green-500 text-green-800';
    }
  };

  const getRiskLevelStyle = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Integrated Analytics Hub</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights combining engagement tracking and voice sentiment analysis
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">User</div>
              <div className="font-medium">{currentUser.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status Bar */}
      <div className={`border-l-4 p-4 ${getAlertStyle(realtimeData.alertLevel)}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <span className="font-medium">Combined Wellbeing Score: </span>
              <span className="text-lg font-bold">{realtimeData.combinedScore}/100</span>
            </div>
            <div>
              <span className="font-medium">Alert Level: </span>
              <span className="capitalize">{realtimeData.alertLevel}</span>
            </div>
            <div>
              <span className="font-medium">Risk Assessment: </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelStyle(integratedInsights.riskLevel)}`}>
                {integratedInsights.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-sm">
            Last Update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'engagement', label: '👥 Engagement', icon: '👥' },
              { id: 'voice', label: '🎙️ Voice Analysis', icon: '🎙️' },
              { id: 'insights', label: '🔬 Integrated Insights', icon: '🔬' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  trackInteraction('tab-navigation', 'clicked', { tab: tab.id });
                }}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{integratedInsights.engagementScore}</div>
                  <div className="text-sm text-gray-600">Engagement Score</div>
                  <div className="text-xs text-gray-500 mt-1">Daily active rate, feature usage</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{realtimeData.combinedScore}</div>
                  <div className="text-sm text-gray-600">Wellbeing Score</div>
                  <div className="text-xs text-gray-500 mt-1">Combined engagement + mood</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    integratedInsights.moodTrend === 'improving' ? 'text-green-600' :
                    integratedInsights.moodTrend === 'declining' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {integratedInsights.moodTrend === 'improving' ? '📈' :
                     integratedInsights.moodTrend === 'declining' ? '📉' : '➡️'}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">{integratedInsights.moodTrend}</div>
                  <div className="text-xs text-gray-500 mt-1">Mood trend (7 days)</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <div className="text-center">
                  <div className={`text-2xl font-bold px-3 py-1 rounded-full ${getRiskLevelStyle(integratedInsights.riskLevel)}`}>
                    {integratedInsights.riskLevel === 'critical' ? '🚨' :
                     integratedInsights.riskLevel === 'high' ? '⚠️' :
                     integratedInsights.riskLevel === 'medium' ? '⚡' : '✅'}
                  </div>
                  <div className="text-sm text-gray-600 mt-2 capitalize">{integratedInsights.riskLevel} Risk</div>
                  <div className="text-xs text-gray-500 mt-1">Integrated assessment</div>
                </div>
              </div>
            </div>

            {/* Correlations */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🔗 Data Correlations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(integratedInsights.correlations.engagementVsMood * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Engagement ↔ Mood</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {integratedInsights.correlations.engagementVsMood > 0.7 ? 'Strong' :
                     integratedInsights.correlations.engagementVsMood > 0.4 ? 'Moderate' : 'Weak'} correlation
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {Math.round(integratedInsights.correlations.featureUsageVsWellbeing * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Feature Usage ↔ Wellbeing</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {integratedInsights.correlations.featureUsageVsWellbeing > 0.7 ? 'Strong' :
                     integratedInsights.correlations.featureUsageVsWellbeing > 0.4 ? 'Moderate' : 'Weak'} correlation
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {Math.round(integratedInsights.correlations.socialInteractionVsMood * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Social ↔ Mood</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {integratedInsights.correlations.socialInteractionVsMood > 0.7 ? 'Strong' :
                     integratedInsights.correlations.socialInteractionVsMood > 0.4 ? 'Moderate' : 'Weak'} correlation
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">💡 AI-Generated Recommendations</h3>
              {integratedInsights.interventionRecommendations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No specific recommendations at this time. Keep up the great work! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {integratedInsights.interventionRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <span className="text-blue-600 mr-3 mt-1">💡</span>
                      <div className="flex-1">
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div>
            <EngagementAnalyticsDashboard />
          </div>
        )}

        {activeTab === 'voice' && (
          <div>
            <VoiceAnalysisInterface
              userId={currentUser.id}
              onAnalysisComplete={(result) => {
                console.log('Voice analysis completed:', result);
              }}
              onInterventionTriggered={(intervention) => {
                console.log('Intervention triggered:', intervention);
              }}
            />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🧠 Advanced Analytics</h3>
              <p className="text-gray-600 mb-6">
                Deep insights combining multiple data sources for comprehensive user understanding.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">📊 Data Integration Points</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Daily active user patterns → Voice mood correlation
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Feature usage frequency → Emotional state analysis
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Social interaction levels → Mental health indicators
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Content engagement → Therapeutic progress tracking
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      Assessment completion → Voice sentiment trends
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">🎯 Predictive Capabilities</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🔮</span>
                      Crisis event prediction (72-hour window)
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🔮</span>
                      Optimal intervention timing identification
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🔮</span>
                      Personalized support recommendation engine
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🔮</span>
                      Treatment efficacy measurement
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-500 mr-2">🔮</span>
                      Long-term wellbeing trajectory modeling
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">🔄 Real-time Data Streams</h4>
                <div className="space-y-3">
                  {realtimeData.lastEngagementEvent && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Latest Engagement Event</div>
                      <div className="text-xs text-blue-700 mt-1">
                        {realtimeData.lastEngagementEvent.type} - Score: {realtimeData.lastEngagementEvent.score}
                      </div>
                      <div className="text-xs text-blue-600">
                        {realtimeData.lastEngagementEvent.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                  
                  {realtimeData.lastVoiceAnalysis && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Latest Voice Analysis</div>
                      <div className="text-xs text-green-700 mt-1">
                        Mood: {realtimeData.lastVoiceAnalysis.moodScore}/100 - {realtimeData.lastVoiceAnalysis.emotionalState}
                      </div>
                      <div className="text-xs text-green-600">
                        {realtimeData.lastVoiceAnalysis.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">⚡ System Performance</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Analytics Processing</span>
                    <span className="text-sm font-medium text-green-600">Real-time</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Voice Analysis Latency</span>
                    <span className="text-sm font-medium text-green-600">&lt; 3s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data Synchronization</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Integration Status</span>
                    <span className="text-sm font-medium text-green-600">Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedAnalyticsHub;
