import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import RecommendationEngineComponent from '../components/RecommendationEngine';
import { UserProfile, PHQ4Score } from '../lib/ai-recommendation-engine';

const AIRecommendationsPage: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  // Create a sample user profile for demonstration
  const createSampleProfile = (): UserProfile => {
    const profiles: UserProfile[] = [
      // Construction worker from Bangladesh
      {
        anonymousId: 'demo_user_construction',
        phq4Scores: {
          latest: {
            totalScore: 8,
            depressionScore: 4,
            anxietyScore: 4,
            riskLevel: 'moderate',
            timestamp: new Date().toISOString()
          },
          history: []
        },
        demographics: {
          countryOfOrigin: 'Bangladesh',
          ageGroup: '26-35',
          gender: 'male',
          employmentSector: 'Construction',
          language: 'bn',
          location: {
            country: 'Singapore',
            city: 'Singapore'
          }
        },
        usagePatterns: {
          assessmentFrequency: 2,
          preferredTime: '20',
          sessionDuration: 25,
          featuresUsed: ['phq4-assessment', 'crisis-support'],
          lastActive: new Date().toISOString(),
          totalSessions: 5
        },
        preferences: {
          culturalPreferences: ['Islamic', 'Bengali'],
          communicationStyle: 'supportive',
          resourceTypes: ['therapy', 'peer-support', 'crisis'],
          privacyLevel: 'moderate'
        },
        interactionHistory: []
      },
      // Domestic worker from Indonesia
      {
        anonymousId: 'demo_user_domestic',
        phq4Scores: {
          latest: {
            totalScore: 6,
            depressionScore: 3,
            anxietyScore: 3,
            riskLevel: 'mild',
            timestamp: new Date().toISOString()
          },
          history: []
        },
        demographics: {
          countryOfOrigin: 'Indonesia',
          ageGroup: '26-35',
          gender: 'female',
          employmentSector: 'Domestic Work',
          language: 'idn',
          location: {
            country: 'Singapore',
            city: 'Singapore'
          }
        },
        usagePatterns: {
          assessmentFrequency: 3,
          preferredTime: '21',
          sessionDuration: 35,
          featuresUsed: ['phq4-assessment', 'self-help', 'peer-support'],
          lastActive: new Date().toISOString(),
          totalSessions: 12
        },
        preferences: {
          culturalPreferences: ['Indonesian', 'Islamic'],
          communicationStyle: 'peer-based',
          resourceTypes: ['self-help', 'peer-support', 'wellness'],
          privacyLevel: 'high'
        },
        interactionHistory: []
      },
      // Manufacturing worker from Philippines
      {
        anonymousId: 'demo_user_manufacturing',
        phq4Scores: {
          latest: {
            totalScore: 3,
            depressionScore: 1,
            anxietyScore: 2,
            riskLevel: 'minimal',
            timestamp: new Date().toISOString()
          },
          history: []
        },
        demographics: {
          countryOfOrigin: 'Philippines',
          ageGroup: '18-25',
          gender: 'male',
          employmentSector: 'Manufacturing',
          language: 'en',
          location: {
            country: 'Malaysia',
            city: 'Kuala Lumpur'
          }
        },
        usagePatterns: {
          assessmentFrequency: 1,
          preferredTime: '19',
          sessionDuration: 15,
          featuresUsed: ['phq4-assessment', 'wellness'],
          lastActive: new Date().toISOString(),
          totalSessions: 3
        },
        preferences: {
          culturalPreferences: ['Filipino', 'Catholic'],
          communicationStyle: 'direct',
          resourceTypes: ['wellness'],
          privacyLevel: 'minimal'
        },
        interactionHistory: []
      }
    ];

    return profiles[Math.floor(Math.random() * profiles.length)];
  };

  const profileDescriptions = {
    'demo_user_construction': {
      title: 'Construction Worker from Bangladesh',
      description: 'Male, 26-35, moderate stress levels, working in Singapore construction industry',
      riskLevel: 'Moderate',
      primaryConcerns: 'Work stress, family separation, financial pressure'
    },
    'demo_user_domestic': {
      title: 'Domestic Worker from Indonesia',
      description: 'Female, 26-35, mild stress levels, working as domestic helper in Singapore',
      riskLevel: 'Mild',
      primaryConcerns: 'Social isolation, employer relations, homesickness'
    },
    'demo_user_manufacturing': {
      title: 'Manufacturing Worker from Philippines',
      description: 'Male, 18-25, minimal stress levels, working in Malaysian manufacturing',
      riskLevel: 'Minimal',
      primaryConcerns: 'Career development, wellness maintenance'
    }
  };

  const startDemo = () => {
    const profile = createSampleProfile();
    setUserProfile(profile);
    setShowDemo(true);
  };

  const resetDemo = () => {
    setUserProfile(null);
    setShowDemo(false);
  };

  if (showDemo && userProfile) {
    const profileDesc = profileDescriptions[userProfile.anonymousId as keyof typeof profileDescriptions];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header with demo info */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Demo Profile: {profileDesc?.title}</h2>
              <p className="text-sm text-gray-600">{profileDesc?.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Risk Level: {profileDesc?.riskLevel}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Language: {userProfile.demographics.language.toUpperCase()}
                </span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  PHQ-4 Score: {userProfile.phq4Scores.latest.totalScore}/12
                </span>
              </div>
            </div>
            <button
              onClick={resetDemo}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Overview
            </button>
          </div>
        </div>

        {/* Recommendation Engine */}
        <RecommendationEngineComponent 
          userProfile={userProfile}
          trigger="user_request"
          maxRecommendations={8}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🤖 AI Mental Health Recommendation Engine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced machine learning system that provides personalized mental health resource recommendations 
            for migrant workers based on their assessments, demographics, and usage patterns.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="text-lg font-semibold mb-2">Intelligent Matching</h3>
            <p className="text-gray-600 text-sm">
              Uses PHQ-4 scores, demographics, and cultural preferences to match users with the most relevant resources.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold mb-2">Collaborative Filtering</h3>
            <p className="text-gray-600 text-sm">
              Leverages experiences of similar users to recommend resources that have been helpful to others in similar situations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="text-lg font-semibold mb-2">Cultural Sensitivity</h3>
            <p className="text-gray-600 text-sm">
              Considers country of origin, language preferences, and cultural context for culturally appropriate recommendations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-2">A/B Testing</h3>
            <p className="text-gray-600 text-sm">
              Continuously tests different recommendation strategies to optimize effectiveness and user satisfaction.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="text-lg font-semibold mb-2">Machine Learning</h3>
            <p className="text-gray-600 text-sm">
              Improves recommendations over time by learning from user interactions and feedback patterns.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Multi-Strategy</h3>
            <p className="text-gray-600 text-sm">
              Combines content-based, collaborative, demographic, and ML-predicted approaches for comprehensive recommendations.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">How the AI Engine Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                1
              </div>
              <h4 className="font-semibold mb-2">Data Collection</h4>
              <p className="text-sm text-gray-600">
                Gathers PHQ-4 scores, demographics, usage patterns, and preferences
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 text-green-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                2
              </div>
              <h4 className="font-semibold mb-2">Analysis</h4>
              <p className="text-sm text-gray-600">
                Applies multiple algorithms to analyze user needs and find similar cases
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                3
              </div>
              <h4 className="font-semibold mb-2">Matching</h4>
              <p className="text-sm text-gray-600">
                Scores resources based on relevance, cultural fit, and effectiveness
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                4
              </div>
              <h4 className="font-semibold mb-2">Learning</h4>
              <p className="text-sm text-gray-600">
                Tracks interactions and feedback to improve future recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Demo Profiles */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Try the Demo</h2>
          <p className="text-gray-600 text-center mb-8">
            Experience how the AI recommendation engine provides personalized suggestions for different user profiles.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(profileDescriptions).map(([profileId, profile]) => (
              <div key={profileId} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-lg mb-2">{profile.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{profile.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Risk Level:</span>
                    <span className={`font-medium ${
                      profile.riskLevel === 'Minimal' ? 'text-green-600' :
                      profile.riskLevel === 'Mild' ? 'text-yellow-600' :
                      profile.riskLevel === 'Moderate' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {profile.riskLevel}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Primary Concerns:</span>
                    <div className="text-gray-700 mt-1">{profile.primaryConcerns}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // Create specific profile based on ID
                    const profiles = [
                      createSampleProfile(),
                      createSampleProfile(),
                      createSampleProfile()
                    ];
                    const profile = profiles.find(p => p.anonymousId === profileId) || createSampleProfile();
                    profile.anonymousId = profileId;
                    setUserProfile(profile);
                    setShowDemo(true);
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Recommendations
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Technical Implementation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Recommendation Strategies</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <strong>Content-Based:</strong> Matches resources to user needs and preferences
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <strong>Collaborative Filtering:</strong> Leverages similar users' experiences
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <strong>Demographic:</strong> Focuses on cultural and demographic matching
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  <strong>ML-Predicted:</strong> Uses machine learning for pattern recognition
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <strong>Hybrid:</strong> Combines multiple approaches with weighted scoring
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Key Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Real-time personalization based on user interactions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Multi-language support with cultural context awareness
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  A/B testing framework for strategy optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Comprehensive analytics and effectiveness tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Privacy-compliant anonymous data processing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Scalable architecture for growing resource database
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              💡 The recommendation engine continuously learns and improves its suggestions based on user feedback and interaction patterns, 
              ensuring increasingly relevant and helpful recommendations over time.
            </p>
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

export default AIRecommendationsPage;
