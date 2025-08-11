/**
 * Gamification Demo Component
 * Demonstrates all gamification features working together
 */

import React, { useState, useEffect } from 'react';
import GamificationInterface from '../components/GamificationInterface';
import QRScanner from '../components/QRScanner';
import GamificationIntegration from '../lib/gamification-integration';
import { gamificationSystem } from '../lib/gamification-system';

const GamificationDemo: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);

  useEffect(() => {
    // Create a demo user
    const userId = 'demo_user_' + Date.now();
    setCurrentUserId(userId);

    // Create the user in the gamification system
    gamificationSystem.createUser({
      userId,
      username: 'Demo User',
      email: 'demo@sata.com'
    });
  }, []);

  const demoSteps = [
    {
      title: 'Welcome to SATA Gamification! 🎮',
      description: 'Let\'s demonstrate how the gamification system rewards mental health engagement.',
      action: () => {
        // Initial welcome points already awarded in user creation
      }
    },
    {
      title: 'Daily Check-in 📝',
      description: 'Starting with a daily mood check-in...',
      action: () => {
        GamificationIntegration.onDailyCheckIn(currentUserId, 8, 'Feeling optimistic today!', 4);
      }
    },
    {
      title: 'PHQ-4 Assessment 📊',
      description: 'Taking a mental health assessment...',
      action: () => {
        GamificationIntegration.onPHQ4Assessment(currentUserId, 2, 3, 5);
      }
    },
    {
      title: 'Educational Content 📚',
      description: 'Engaging with educational materials...',
      action: () => {
        GamificationIntegration.onEducationalContentEngagement(
          currentUserId, 
          'stress-management-article', 
          'article', 
          240, 
          95
        );
      }
    },
    {
      title: 'Peer Support Group 🤝',
      description: 'Participating in peer support...',
      action: () => {
        GamificationIntegration.onPeerSupportActivity(
          currentUserId,
          'support-given',
          'support-group-123',
          5,
          150
        );
      }
    },
    {
      title: 'Buddy Interaction 👥',
      description: 'Having a meaningful buddy conversation...',
      action: () => {
        GamificationIntegration.onBuddyInteraction(
          currentUserId,
          'buddy_456',
          'voice-call',
          5,
          1200,
          'supportive'
        );
      }
    },
    {
      title: 'Resource Utilization 🏥',
      description: 'Using mental health resources...',
      action: () => {
        GamificationIntegration.onResourceUtilization(
          currentUserId,
          'counselor-123',
          'counselor',
          'contact'
        );
      }
    },
    {
      title: 'Building Streaks 🔥',
      description: 'Maintaining consistent engagement...',
      action: () => {
        // Simulate a 7-day streak
        GamificationIntegration.onStreakMaintenance(currentUserId, 'daily-check-in', 7);
      }
    },
    {
      title: 'Special Achievement 🏆',
      description: 'Unlocking a special milestone...',
      action: () => {
        GamificationIntegration.onSpecialEvent(
          currentUserId,
          'mental-health-day',
          'complete-challenge'
        );
      }
    },
    {
      title: 'Demo Complete! 🎉',
      description: 'You\'ve seen all the gamification features in action. Now you can explore the full interface!',
      action: () => {
        // Final bonus
        gamificationSystem.awardPoints(
          currentUserId,
          'achievement',
          100,
          'Demo completion bonus! 🎊',
          'demo-completion'
        );
      }
    }
  ];

  const runDemo = async () => {
    setIsRunningDemo(true);
    
    for (let i = 0; i < demoSteps.length; i++) {
      setDemoStep(i);
      
      // Wait for user to see the step
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Execute the step action
      demoSteps[i].action();
      
      // Wait to see the result
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    setIsRunningDemo(false);
  };

  const handleQRScanSuccess = (redemptionData: any) => {
    console.log('QR Scan Success:', redemptionData);
    setShowQRScanner(false);
  };

  const handleQRScanError = (error: string) => {
    console.error('QR Scan Error:', error);
    alert(`QR Scan Error: ${error}`);
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎮</div>
          <p className="text-gray-600">Setting up gamification demo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">🎮 SATA Gamification Demo</h1>
            <p className="text-blue-100 mb-4">
              Experience how our gamification system motivates mental health engagement
            </p>
            
            {!isRunningDemo ? (
              <div className="space-x-4">
                <button
                  onClick={runDemo}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  🚀 Run Interactive Demo
                </button>
                <button
                  onClick={() => setShowQRScanner(true)}
                  className="bg-purple-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-900 transition-colors"
                >
                  📱 Test QR Scanner
                </button>
              </div>
            ) : (
              <div className="bg-white bg-opacity-20 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="animate-spin text-2xl">⚡</div>
                  <span className="font-semibold">Running Demo</span>
                </div>
                <div className="text-center">
                  <p className="text-sm mb-2">
                    Step {demoStep + 1} of {demoSteps.length}
                  </p>
                  <h3 className="font-medium">{demoSteps[demoStep]?.title}</h3>
                  <p className="text-xs text-blue-100 mt-1">
                    {demoSteps[demoStep]?.description}
                  </p>
                </div>
                <div className="w-full bg-purple-800 rounded-full h-2 mt-3">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-500"
                    style={{ width: `${((demoStep + 1) / demoSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demo Activity Simulation */}
      {isRunningDemo && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center space-x-4">
              <div className="animate-pulse text-2xl">🎯</div>
              <div className="text-center">
                <p className="text-sm text-yellow-800">
                  <strong>Simulating:</strong> {demoSteps[demoStep]?.description}
                </p>
                <p className="text-xs text-yellow-600">
                  Watch the points and achievements update in real-time!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h3 className="text-lg font-semibold mb-3">🎯 Try These Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => GamificationIntegration.onDailyCheckIn(currentUserId, Math.floor(Math.random() * 5) + 6)}
              className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">✅</div>
              <div className="text-xs font-medium">Daily Check-in</div>
            </button>

            <button
              onClick={() => GamificationIntegration.onPHQ4Assessment(currentUserId, 2, 2, 4)}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">📊</div>
              <div className="text-xs font-medium">Take Assessment</div>
            </button>

            <button
              onClick={() => GamificationIntegration.onEducationalContentEngagement(
                currentUserId, 'demo-article', 'article', 180, 90
              )}
              className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">📚</div>
              <div className="text-xs font-medium">Read Article</div>
            </button>

            <button
              onClick={() => GamificationIntegration.onPeerSupportActivity(
                currentUserId, 'support-given', 'demo-group', 4, 120
              )}
              className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">🤝</div>
              <div className="text-xs font-medium">Help Others</div>
            </button>

            <button
              onClick={() => GamificationIntegration.onBuddyInteraction(
                currentUserId, 'demo-buddy', 'text-chat', 5
              )}
              className="p-3 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">💬</div>
              <div className="text-xs font-medium">Chat with Buddy</div>
            </button>

            <button
              onClick={() => GamificationIntegration.onResourceUtilization(
                currentUserId, 'demo-resource', 'counselor', 'view'
              )}
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-center"
            >
              <div className="text-xl mb-1">🏥</div>
              <div className="text-xs font-medium">Use Resource</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Gamification Interface */}
      <GamificationInterface userId={currentUserId} />

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
        onScanError={handleQRScanError}
      />

      {/* Features Overview */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h3 className="text-2xl font-bold text-center mb-6">🌟 Gamification Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">💎</div>
              <h4 className="font-semibold text-center mb-2">Points System</h4>
              <p className="text-sm text-gray-600 text-center">
                Earn points for daily check-ins, assessments, learning, and peer support
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">🏆</div>
              <h4 className="font-semibold text-center mb-2">Achievements</h4>
              <p className="text-sm text-gray-600 text-center">
                Unlock badges and achievements for milestones and consistent engagement
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">🔥</div>
              <h4 className="font-semibold text-center mb-2">Streaks</h4>
              <p className="text-sm text-gray-600 text-center">
                Build momentum with daily streaks and earn bonus points
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">🎁</div>
              <h4 className="font-semibold text-center mb-2">Rewards</h4>
              <p className="text-sm text-gray-600 text-center">
                Redeem points for wellness products, counseling sessions, and more
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">📱</div>
              <h4 className="font-semibold text-center mb-2">QR Redemption</h4>
              <p className="text-sm text-gray-600 text-center">
                Generate and scan QR codes for secure reward redemption
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">🏅</div>
              <h4 className="font-semibold text-center mb-2">Leaderboards</h4>
              <p className="text-sm text-gray-600 text-center">
                Compete with others while maintaining privacy and support
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">📊</div>
              <h4 className="font-semibold text-center mb-2">Analytics</h4>
              <p className="text-sm text-gray-600 text-center">
                Track progress with detailed statistics and insights
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="text-3xl mb-3 text-center">🎮</div>
              <h4 className="font-semibold text-center mb-2">Levels</h4>
              <p className="text-sm text-gray-600 text-center">
                Progress through levels with increasing perks and recognition
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDemo;
