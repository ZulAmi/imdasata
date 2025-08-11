/**
 * SATA Voice Sentiment Analysis Demo Page
 * Demonstrates the complete voice analysis system
 */

import React, { useState, useEffect } from 'react';
import VoiceAnalysisInterface from '../components/VoiceAnalysisInterface';
import { voiceSentimentAnalyzer, ProactiveIntervention } from '../lib/voice-sentiment-analyzer';
import { useEngagementTracking } from '../lib/engagement-integration';

const VoiceSentimentDemo = () => {
  const [currentUser] = useState({
    id: 'voice-demo-user',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com'
  });

  const [systemStatus, setSystemStatus] = useState({
    speechService: 'Ready',
    textAnalytics: 'Ready',
    privacyMode: true,
    processingLanguage: 'en-US'
  });

  const [demoStats, setDemoStats] = useState({
    totalAnalyses: 0,
    averageMoodScore: 0,
    interventionsTriggered: 0,
    languagesSupported: 0
  });

  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [interventionLog, setInterventionLog] = useState<ProactiveIntervention[]>([]);

  // Engagement tracking
  const { trackInteraction, trackPageView, trackFeatureUsage } = useEngagementTracking(currentUser.id);

  useEffect(() => {
    // Track page view
    trackPageView('voice-sentiment-demo', {
      userType: 'demo',
      features: ['voice-analysis', 'mood-tracking', 'intervention-system']
    });

    // Initialize demo data
    initializeDemoData();

    // Set up event listeners
    voiceSentimentAnalyzer.on('analysis:completed', handleAnalysisCompleted);
    voiceSentimentAnalyzer.on('intervention:triggered', handleInterventionTriggered);
    voiceSentimentAnalyzer.on('services:initialized', handleServicesInitialized);

    return () => {
      voiceSentimentAnalyzer.removeAllListeners();
    };
  }, []);

  const initializeDemoData = () => {
    const supportedLanguages = voiceSentimentAnalyzer.getSupportedLanguages();
    
    setDemoStats(prev => ({
      ...prev,
      languagesSupported: supportedLanguages.length
    }));

    addActivity('🚀 Voice sentiment analysis system initialized');
    addActivity(`🌍 Supporting ${supportedLanguages.length} languages`);
    addActivity('🔒 Privacy protection enabled');
  };

  const handleAnalysisCompleted = (result: any) => {
    setDemoStats(prev => ({
      ...prev,
      totalAnalyses: prev.totalAnalyses + 1,
      averageMoodScore: Math.round(
        ((prev.averageMoodScore * prev.totalAnalyses) + result.moodScore.overall) / (prev.totalAnalyses + 1)
      )
    }));

    addActivity(`📊 Voice analysis completed - Mood score: ${result.moodScore.overall}/100`);
    
    trackFeatureUsage('voice-sentiment-analysis', 120, 'completed');
  };

  const handleInterventionTriggered = ({ intervention }: { intervention: ProactiveIntervention }) => {
    setInterventionLog(prev => [intervention, ...prev.slice(0, 4)]);
    
    setDemoStats(prev => ({
      ...prev,
      interventionsTriggered: prev.interventionsTriggered + 1
    }));

    addActivity(`🚨 ${intervention.severity.toUpperCase()} intervention triggered`);
    
    trackInteraction('voice-intervention', 'triggered', {
      severity: intervention.severity,
      type: intervention.triggerType
    });
  };

  const handleServicesInitialized = (status: any) => {
    setSystemStatus(prev => ({
      ...prev,
      speechService: status.speech ? 'Connected' : 'Error',
      textAnalytics: status.textAnalytics ? 'Connected' : 'Error'
    }));

    addActivity('✅ Azure Cognitive Services connected');
  };

  const addActivity = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setRecentActivity(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const togglePrivacyMode = () => {
    const newMode = !systemStatus.privacyMode;
    voiceSentimentAnalyzer.enablePrivacyMode(newMode);
    
    setSystemStatus(prev => ({
      ...prev,
      privacyMode: newMode
    }));

    addActivity(`🔒 Privacy mode ${newMode ? 'enabled' : 'disabled'}`);
    
    trackInteraction('voice-privacy', 'toggled', {
      enabled: newMode
    });
  };

  const simulateEmergencyIntervention = () => {
    const mockIntervention: ProactiveIntervention = {
      id: `demo-intervention-${Date.now()}`,
      userId: currentUser.id,
      triggerType: 'risk_keywords',
      severity: 'critical',
      message: 'DEMO: We detected concerning language patterns in your recent voice note. Immediate support is recommended.',
      actions: [
        {
          type: 'emergency_protocol',
          title: 'Crisis Hotline',
          description: 'Connect with crisis counselor immediately',
          url: 'tel:988',
          priority: 1,
          automated: true
        },
        {
          type: 'professional_contact',
          title: 'Mental Health Professional',
          description: 'Schedule emergency appointment',
          priority: 2,
          automated: false
        }
      ],
      timestamp: new Date(),
      responded: false
    };

    handleInterventionTriggered({ intervention: mockIntervention });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎙️ Voice Sentiment Analysis</h1>
              <p className="text-gray-600 mt-2">
                AI-powered emotional insights from voice notes using Azure Cognitive Services
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Demo User</div>
              <div className="font-medium">{currentUser.name}</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* System Status */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">🔧 System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Speech Service</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  systemStatus.speechService === 'Connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemStatus.speechService}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Text Analytics</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  systemStatus.textAnalytics === 'Connected' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {systemStatus.textAnalytics}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Privacy Mode</span>
                <button
                  onClick={togglePrivacyMode}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                    systemStatus.privacyMode 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {systemStatus.privacyMode ? '🔒 ON' : '🔓 OFF'}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Language</span>
                <span className="text-xs font-medium">{systemStatus.processingLanguage}</span>
              </div>
            </div>
          </div>

          {/* Analytics Stats */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">📊 Analytics</h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{demoStats.totalAnalyses}</div>
                <div className="text-xs text-gray-600">Voice Notes Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{demoStats.averageMoodScore}</div>
                <div className="text-xs text-gray-600">Average Mood Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{demoStats.interventionsTriggered}</div>
                <div className="text-xs text-gray-600">Interventions Triggered</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">✨ Features</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Real-time speech-to-text
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Emotion analysis
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Mental health keywords
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Mood score calculation
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Proactive interventions
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Privacy protection
              </div>
              <div className="flex items-center text-sm">
                <span className="text-green-500 mr-2">✓</span>
                Multi-language support
              </div>
            </div>
          </div>

          {/* Demo Controls */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">🎮 Demo Controls</h3>
            <div className="space-y-3">
              <button
                onClick={simulateEmergencyIntervention}
                className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                🚨 Simulate Crisis Intervention
              </button>
              <button
                onClick={() => addActivity('🧪 Demo event simulated')}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                📝 Add Activity Log
              </button>
              <button
                onClick={() => setRecentActivity([])}
                className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
              >
                🧹 Clear Activity Log
              </button>
            </div>
          </div>
        </div>

        {/* Main Voice Analysis Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Analysis Component */}
          <div className="lg:col-span-2">
            <VoiceAnalysisInterface
              userId={currentUser.id}
              onAnalysisComplete={(result) => {
                console.log('Analysis completed:', result);
              }}
              onInterventionTriggered={(intervention) => {
                console.log('Intervention triggered:', intervention);
              }}
            />
          </div>

          {/* Activity and Intervention Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">📱 Recent Activity</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No activity yet</p>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                      {activity}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Interventions */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🚨 Interventions</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {interventionLog.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No interventions triggered</p>
                ) : (
                  interventionLog.map((intervention) => (
                    <div key={intervention.id} className={`p-3 rounded-lg border-l-4 ${
                      intervention.severity === 'critical' ? 'border-red-500 bg-red-50' :
                      intervention.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                      intervention.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          intervention.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          intervention.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          intervention.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {intervention.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {intervention.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{intervention.message}</p>
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">
                          {intervention.actions.length} action(s) available
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Privacy Information */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🔒 Privacy & Security</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">🔒</span>
                  <div>
                    <strong>On-device processing:</strong> Voice analysis can be performed locally for enhanced privacy
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">🛡️</span>
                  <div>
                    <strong>Data encryption:</strong> All voice data is encrypted in transit and at rest
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-500 mr-2 mt-1">⏰</span>
                  <div>
                    <strong>Auto-deletion:</strong> Voice recordings are automatically deleted after analysis
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">👤</span>
                  <div>
                    <strong>Anonymization:</strong> Personal identifiers are removed from analysis data
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Information */}
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">🔬 Technology Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Azure Cognitive Services</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Speech-to-Text API</li>
                <li>• Text Analytics API</li>
                <li>• Language Understanding (LUIS)</li>
                <li>• Health Text Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Analysis Capabilities</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time emotion detection</li>
                <li>• Mental health keyword extraction</li>
                <li>• Sentiment analysis</li>
                <li>• Risk assessment algorithms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Privacy Features</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• On-device processing option</li>
                <li>• End-to-end encryption</li>
                <li>• Automatic data deletion</li>
                <li>• HIPAA compliance ready</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSentimentDemo;
