/**
 * SATA Gamification System Page
 * Main entry point for the gamification system
 */

import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import GamificationInterface from '../components/GamificationInterface';
import GamificationDemo from '../components/GamificationDemo';
import { gamificationSystem, UserProfile } from '../lib/gamification-system';

interface GamificationPageProps {}

const GamificationPage: NextPage<GamificationPageProps> = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check if this is a demo visit
    const urlParams = new URLSearchParams(window.location.search);
    const demoMode = urlParams.get('demo') === 'true';
    setIsDemo(demoMode);

    if (demoMode) {
      setIsLoading(false);
      return;
    }

    // Simulate user authentication - in real app, this would come from auth context
    const userId = localStorage.getItem('currentUserId') || `user_${Date.now()}`;
    localStorage.setItem('currentUserId', userId);
    
    // Check if user exists in gamification system
    const existingUser = gamificationSystem.getUser(userId);
    if (!existingUser) {
      setShowWelcome(true);
    }
    
    setCurrentUserId(userId);
    setIsLoading(false);
  }, []);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Gamification System</h2>
          <p className="text-gray-600">Preparing your rewards and achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gamification - SATA Mental Health Platform</title>
        <meta name="description" content="Track your mental health journey with points, achievements, and rewards" />
      </Head>

      {isDemo ? (
        <GamificationDemo />
      ) : (
        <>
          {showWelcome && <WelcomeModal userId={currentUserId} onComplete={handleWelcomeComplete} />}
          <GamificationInterface userId={currentUserId} />
        </>
      )}
    </>
  );
};

interface WelcomeModalProps {
  userId: string;
  onComplete: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ userId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');

  const steps = [
    {
      title: 'Welcome to SATA Gamification! 🎮',
      description: 'Turn your mental health journey into an engaging experience with points, achievements, and rewards.',
      icon: '🌟',
    },
    {
      title: 'Earn Points Through Activities 💎',
      description: 'Complete daily check-ins, take assessments, engage with educational content, and support your peers to earn points.',
      icon: '⭐',
    },
    {
      title: 'Unlock Achievements & Level Up 🏆',
      description: 'Maintain streaks, reach milestones, and unlock special achievements as you progress through different levels.',
      icon: '🏅',
    },
    {
      title: 'Redeem Amazing Rewards 🎁',
      description: 'Use your points to unlock wellness products, digital content, and even counseling sessions.',
      icon: '🎉',
    },
    {
      title: 'Compete on Leaderboards 🏅',
      description: 'See how you rank against other community members and celebrate collective wellness achievements.',
      icon: '👥',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Create user in gamification system
    const user = gamificationSystem.createUser({
      userId,
      username: username || `User_${userId.slice(-6)}`,
    });

    // Give welcome demonstration points
    setTimeout(() => {
      gamificationSystem.recordDailyCheckIn(userId, 8, 'Welcome check-in!');
    }, 1000);

    setTimeout(() => {
      gamificationSystem.recordEducationalEngagement(userId, 'article', 180);
    }, 2000);

    onComplete();
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
        <div className="text-6xl mb-4">{currentStepData.icon}</div>
        <h2 className="text-2xl font-bold mb-4">{currentStepData.title}</h2>
        <p className="text-gray-600 mb-6">{currentStepData.description}</p>

        {currentStep === 0 && (
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your display name (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="space-x-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
