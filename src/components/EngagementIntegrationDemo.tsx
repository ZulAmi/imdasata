/**
 * SATA Engagement Integration Demo
 * Demonstrates how to integrate engagement tracking into existing platform features
 */

import React, { useState, useEffect } from 'react';
import { useEngagementTracking, engagementIntegration } from '../lib/engagement-integration';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  lastActive: string;
}

const EngagementIntegrationDemo = () => {
  const [currentUser] = useState<DemoUser>({
    id: 'demo-user-456',
    name: 'Alex Johnson',
    email: 'alex.demo@sata.app',
    joinDate: '2024-01-15',
    lastActive: new Date().toISOString()
  });

  const [mood, setMood] = useState('neutral');
  const [energy, setEnergy] = useState(5);
  const [anxiety, setAnxiety] = useState(3);
  const [activityLog, setActivityLog] = useState<string[]>([]);

  // Initialize engagement tracking
  const {
    trackInteraction,
    trackPageView,
    trackFeatureUsage,
    trackDailyCheckIn,
    trackContentEngagement,
    trackPeerSupport,
    trackGamification
  } = useEngagementTracking(currentUser.id);

  useEffect(() => {
    // Initialize user session and track page view
    engagementIntegration.initializeUserSession(currentUser.id, {
      device: 'desktop',
      browser: 'Chrome',
      platform: 'web',
      userAgent: navigator.userAgent
    });

    trackPageView('engagement-demo', {
      demoMode: true,
      timestamp: Date.now()
    });

    addToActivityLog('🚀 Engagement tracking initialized for demo session');
  }, []);

  const addToActivityLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActivityLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Demo: Daily Check-in Feature
  const handleDailyCheckIn = () => {
    trackDailyCheckIn(mood, energy, anxiety);
    addToActivityLog(`✅ Daily check-in completed: ${mood} mood, ${energy}/10 energy, ${anxiety}/10 anxiety`);
    
    // Also track gamification points
    trackGamification('points-earned', 10, {
      source: 'daily-checkin',
      mood,
      energy,
      anxiety
    });
    addToActivityLog('🏆 Earned 10 points for daily check-in');
  };

  // Demo: Educational Content Engagement
  const handleContentInteraction = (action: 'view' | 'complete' | 'like' | 'share') => {
    const contentId = 'stress-management-101';
    const contentType = 'article';
    
    trackContentEngagement(contentType, contentId, action, action === 'complete' ? 300 : 60);
    
    const actionText = {
      view: 'viewed',
      complete: 'completed',
      like: 'liked',
      share: 'shared'
    };
    
    addToActivityLog(`📚 Educational content ${actionText[action]}: ${contentId}`);
    
    if (action === 'complete') {
      trackGamification('points-earned', 25, {
        source: 'content-completion',
        contentType,
        contentId
      });
      addToActivityLog('🏆 Earned 25 points for content completion');
    }
  };

  // Demo: Peer Support Activity
  const handlePeerSupportAction = (action: 'message-sent' | 'support-given') => {
    trackPeerSupport(action, {
      platform: 'chat',
      urgent: false,
      supportType: action === 'support-given' ? 'emotional' : 'general'
    });
    
    const actionText = action === 'message-sent' ? 'sent a message' : 'provided support';
    addToActivityLog(`🤝 Peer support: ${actionText} to community`);
    
    trackGamification('points-earned', 15, {
      source: 'peer-support',
      action
    });
    addToActivityLog('🏆 Earned 15 points for peer support activity');
  };

  // Demo: Crisis Resource Access
  const handleCrisisResourceAccess = (resourceType: string, urgent: boolean = false) => {
    engagementIntegration.trackCrisisResourceAccess(currentUser.id, resourceType, urgent);
    addToActivityLog(`🚨 Accessed crisis resource: ${resourceType}${urgent ? ' (URGENT)' : ''}`);
    
    // No points for crisis resources - focus on support
    addToActivityLog('💙 Crisis support tracking recorded (no points - focus on wellbeing)');
  };

  // Demo: Buddy System Interaction
  const handleBuddyActivity = (activity: 'matched' | 'check-in' | 'message') => {
    engagementIntegration.trackBuddyActivity(currentUser.id, activity, 'buddy-789', {
      buddyName: 'Sam Taylor',
      connectionStrength: 8.5
    });
    
    const activityText = {
      matched: 'matched with new buddy',
      'check-in': 'completed buddy check-in',
      message: 'sent message to buddy'
    };
    
    addToActivityLog(`👥 Buddy system: ${activityText[activity]}`);
    
    if (activity === 'check-in') {
      trackGamification('points-earned', 20, {
        source: 'buddy-checkin',
        buddyId: 'buddy-789'
      });
      addToActivityLog('🏆 Earned 20 points for buddy check-in');
    }
  };

  // Demo: Feature Usage Tracking
  const handleFeatureUsage = (feature: string, duration: number) => {
    trackFeatureUsage(feature, duration);
    addToActivityLog(`⏱️ Used ${feature} for ${Math.round(duration/60)} minutes`);
  };

  // Demo: Assessment Completion
  const handleAssessmentComplete = () => {
    engagementIntegration.trackMoodAssessment(currentUser.id, 'PHQ-4', 8, true);
    addToActivityLog('📝 Completed PHQ-4 mood assessment (score: 8)');
    
    trackGamification('points-earned', 30, {
      source: 'assessment-completion',
      assessmentType: 'PHQ-4',
      score: 8
    });
    addToActivityLog('🏆 Earned 30 points for assessment completion');
  };

  // Demo: Notification Interaction
  const handleNotificationClick = () => {
    engagementIntegration.trackNotificationActivity(
      currentUser.id,
      'notif-123',
      'clicked',
      'push'
    );
    addToActivityLog('🔔 Clicked on push notification');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔗 Engagement Integration Demo</h1>
          <p className="text-gray-600 mb-4">
            This demo shows how engagement tracking integrates with all SATA platform features.
            Each interaction is tracked for analytics while maintaining user privacy.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">Demo User: {currentUser.name}</p>
            <p className="text-blue-600 text-sm">ID: {currentUser.id} | Joined: {currentUser.joinDate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Feature Interactions */}
          <div className="space-y-6">
            {/* Daily Check-in Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">✅ Daily Check-in Feature</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mood</label>
                  <select 
                    value={mood} 
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="great">😊 Great</option>
                    <option value="good">🙂 Good</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="low">😔 Low</option>
                    <option value="difficult">😰 Difficult</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Energy Level: {energy}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Anxiety Level: {anxiety}/10</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={anxiety}
                    onChange={(e) => setAnxiety(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={handleDailyCheckIn}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Complete Daily Check-in
                </button>
              </div>
            </div>

            {/* Educational Content Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">📚 Educational Content</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium">Stress Management 101</h4>
                  <p className="text-sm text-gray-600">Learn effective techniques for managing daily stress</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleContentInteraction('view')}
                    className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                  >
                    View Article
                  </button>
                  <button
                    onClick={() => handleContentInteraction('complete')}
                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    Complete Reading
                  </button>
                  <button
                    onClick={() => handleContentInteraction('like')}
                    className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                  >
                    ❤️ Like
                  </button>
                  <button
                    onClick={() => handleContentInteraction('share')}
                    className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    📤 Share
                  </button>
                </div>
              </div>
            </div>

            {/* Assessment Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">📝 Mental Health Assessment</h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium">PHQ-4 Quick Assessment</h4>
                  <p className="text-sm text-gray-600">4-question screening for depression and anxiety</p>
                </div>
                <button
                  onClick={handleAssessmentComplete}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          </div>

          {/* More Feature Interactions */}
          <div className="space-y-6">
            {/* Peer Support Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🤝 Peer Support</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handlePeerSupportAction('message-sent')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Send Support Message
                </button>
                <button
                  onClick={() => handlePeerSupportAction('support-given')}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Provide Emotional Support
                </button>
              </div>
            </div>

            {/* Buddy System Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">👥 Buddy System</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleBuddyActivity('matched')}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  Get Matched with Buddy
                </button>
                <button
                  onClick={() => handleBuddyActivity('check-in')}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Buddy Check-in
                </button>
                <button
                  onClick={() => handleBuddyActivity('message')}
                  className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
                >
                  Message Buddy
                </button>
              </div>
            </div>

            {/* Crisis Resources Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🚨 Crisis Resources</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleCrisisResourceAccess('emergency-contacts', false)}
                  className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                >
                  View Emergency Contacts
                </button>
                <button
                  onClick={() => handleCrisisResourceAccess('crisis-hotline', true)}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  🚨 Access Crisis Hotline
                </button>
              </div>
            </div>

            {/* Misc Features Demo */}
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">🔔 Other Features</h3>
              <div className="space-y-2">
                <button
                  onClick={handleNotificationClick}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Click Notification
                </button>
                <button
                  onClick={() => handleFeatureUsage('meditation', 600)}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors"
                >
                  Use Meditation Feature (10min)
                </button>
                <button
                  onClick={() => handleFeatureUsage('journaling', 900)}
                  className="w-full bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 transition-colors"
                >
                  Use Journaling Feature (15min)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200 mt-6">
          <h3 className="text-lg font-semibold mb-4">📋 Real-time Activity Log</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {activityLog.length === 0 ? (
              <p className="text-gray-500">No activities yet. Try interacting with the features above!</p>
            ) : (
              activityLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>🔒 <strong>Privacy Note:</strong> All tracking respects user privacy. Personal data is anonymized and aggregated for insights.</p>
            <p>📊 This data feeds into the engagement analytics dashboard for platform improvement.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngagementIntegrationDemo;
