import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import AIRecommendationEngine, { UserProfile } from '../lib/ai-recommendation-engine';
import ResourcesDirectoryManager from '../lib/resources-directory';

// Local interfaces for the demo
interface DemoAssessment {
  responses: number[];
  totalScore: number;
  anxietyScore: number;
  depressionScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  completedAt: string;
}

interface DemoUserProfile {
  age: number;
  country: string;
  workSector: string;
  languagePreference: string;
  location: { lat: number; lng: number };
  culturalBackground: string;
}

const ComprehensiveDemo: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [aiEngine] = useState(() => new AIRecommendationEngine());
  const [directoryManager] = useState(() => new ResourcesDirectoryManager());
  const [currentView, setCurrentView] = useState<'assessment' | 'recommendations' | 'directory'>('assessment');
  
  // Assessment state
  const [phq4Responses, setPHQ4Responses] = useState<number[]>([0, 0, 0, 0]);
  const [userProfile, setUserProfile] = useState<DemoUserProfile>({
    age: 28,
    country: 'Bangladesh',
    workSector: 'construction',
    languagePreference: 'en',
    location: { lat: 1.3521, lng: 103.8198 }, // Singapore coordinates
    culturalBackground: 'South Asian'
  });

  // Results state
  const [assessment, setAssessment] = useState<DemoAssessment | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [directoryResults, setDirectoryResults] = useState<any[]>([]);

  const phq4Questions = [
    "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
    "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
    "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
    "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?"
  ];

  const responseOptions = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ];

  const handleAssessmentComplete = async () => {
    // Create assessment
    const demoAssessment: DemoAssessment = {
      responses: phq4Responses,
      totalScore: phq4Responses.reduce((sum, score) => sum + score, 0),
      anxietyScore: phq4Responses[0] + phq4Responses[1],
      depressionScore: phq4Responses[2] + phq4Responses[3],
      riskLevel: phq4Responses.reduce((sum, score) => sum + score, 0) >= 6 ? 'high' : 
                 phq4Responses.reduce((sum, score) => sum + score, 0) >= 3 ? 'moderate' : 'low',
      completedAt: new Date().toISOString()
    };

    setAssessment(demoAssessment);

    // Create a proper UserProfile for the AI engine
    const aiUserProfile: UserProfile = {
      anonymousId: 'demo-user',
      phq4Scores: {
        latest: {
          totalScore: demoAssessment.totalScore,
          depressionScore: demoAssessment.depressionScore,
          anxietyScore: demoAssessment.anxietyScore,
          riskLevel: demoAssessment.riskLevel === 'high' ? 'severe' : 
                     demoAssessment.riskLevel === 'moderate' ? 'moderate' : 'minimal',
          timestamp: demoAssessment.completedAt
        },
        history: []
      },
      demographics: {
        countryOfOrigin: userProfile.country,
        ageGroup: userProfile.age < 25 ? 'young' : userProfile.age < 40 ? 'adult' : 'senior',
        employmentSector: userProfile.workSector,
        language: userProfile.languagePreference,
        location: {
          country: 'Singapore',
          coordinates: [userProfile.location.lat, userProfile.location.lng]
        }
      },
      usagePatterns: {
        assessmentFrequency: 1,
        preferredTime: '14:00',
        sessionDuration: 15,
        featuresUsed: ['assessment'],
        lastActive: new Date().toISOString(),
        totalSessions: 1
      },
      preferences: {
        culturalPreferences: [userProfile.culturalBackground],
        communicationStyle: 'supportive',
        resourceTypes: ['therapy', 'peer-support'],
        privacyLevel: 'moderate'
      },
      interactionHistory: []
    };

    // Get AI recommendations
    try {
      const aiRecommendations = await aiEngine.getRecommendations({
        userProfile: aiUserProfile,
        context: {
          trigger: 'assessment_complete',
          maxRecommendations: 6,
          urgencyFilter: demoAssessment.riskLevel
        }
      });
      setRecommendations(aiRecommendations);
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
      // Set mock recommendations for demo
      setRecommendations([
        {
          id: 'demo-rec-1',
          type: demoAssessment.riskLevel === 'high' ? 'emergency' : 'professional',
          title: demoAssessment.riskLevel === 'high' ? 'Immediate Support Needed' : 'Professional Counseling',
          description: demoAssessment.riskLevel === 'high' 
            ? 'Your assessment indicates you may need immediate support. Please consider contacting a helpline.'
            : 'Based on your assessment, speaking with a mental health professional could be beneficial.',
          confidence: 0.85,
          strategy: 'content-based',
          priority: demoAssessment.riskLevel === 'high' ? 'urgent' : 'high',
          culturalNotes: `Recommended for ${userProfile.culturalBackground} background`
        }
      ]);
    }

    // Get directory resources
    const resourceResults = directoryManager.searchResources({
      categories: demoAssessment.riskLevel === 'high' ? ['emergency-services', 'helplines'] : 
                  demoAssessment.riskLevel === 'moderate' ? ['clinics', 'online-services'] :
                  ['peer-support', 'online-services'],
      sortBy: 'rating',
      sortOrder: 'desc'
    });

    setDirectoryResults(resourceResults);
    setCurrentView('recommendations');
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRecommendationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'emergency': '🚨',
      'professional': '👨‍⚕️',
      'peer-support': '👥',
      'self-help': '💪',
      'preventive': '🛡️'
    };
    return icons[type] || '💡';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🧠 AI-Powered Mental Health Support Platform
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Comprehensive assessment and personalized recommendations for migrant workers
            </p>
            
            {/* Navigation */}
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setCurrentView('assessment')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'assessment'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📋 Assessment
              </button>
              <button
                onClick={() => setCurrentView('recommendations')}
                disabled={!assessment}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'recommendations' && assessment
                    ? 'bg-blue-600 text-white'
                    : assessment
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                🎯 AI Recommendations
              </button>
              <button
                onClick={() => setCurrentView('directory')}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  currentView === 'directory'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🏥 Resources Directory
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Assessment View */}
        {currentView === 'assessment' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Mental Health Assessment (PHQ-4)
              </h2>

              {/* User Profile Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Your Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Age</label>
                    <input
                      type="number"
                      value={userProfile.age || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Country of Origin</label>
                    <select
                      value={userProfile.country || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="India">India</option>
                      <option value="Myanmar">Myanmar</option>
                      <option value="Philippines">Philippines</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="China">China</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Work Sector</label>
                    <select
                      value={userProfile.workSector || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, workSector: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="construction">Construction</option>
                      <option value="domestic">Domestic Work</option>
                      <option value="marine">Marine</option>
                      <option value="process">Process Work</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="food-services">Food Services</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Preferred Language</label>
                    <select
                      value={userProfile.languagePreference || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, languagePreference: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="my">မြန်မာ (Myanmar)</option>
                      <option value="idn">Bahasa Indonesia</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PHQ-4 Questions */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-700">Assessment Questions</h3>
                {phq4Questions.map((question, index) => (
                  <div key={index} className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-4">
                      {index + 1}. {question}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {responseOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                            phq4Responses[index] === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option.value}
                            checked={phq4Responses[index] === option.value}
                            onChange={(e) => {
                              const newResponses = [...phq4Responses];
                              newResponses[index] = parseInt(e.target.value);
                              setPHQ4Responses(newResponses);
                            }}
                            className="sr-only"
                          />
                          <div className="text-sm font-medium text-gray-700">
                            {option.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Complete Assessment Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={handleAssessmentComplete}
                  disabled={phq4Responses.some(response => response === undefined)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Complete Assessment & Get Recommendations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations View */}
        {currentView === 'recommendations' && assessment && (
          <div className="space-y-8">
            {/* Assessment Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Assessment Results
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{assessment.totalScore}</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{assessment.anxietyScore}</div>
                  <div className="text-sm text-gray-600">Anxiety Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{assessment.depressionScore}</div>
                  <div className="text-sm text-gray-600">Depression Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold px-3 py-1 rounded-full border ${getRiskLevelColor(assessment.riskLevel)}`}>
                    {assessment.riskLevel.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                🤖 AI-Generated Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{getRecommendationIcon(rec.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                        <div className="text-sm text-blue-600">
                          Confidence: {(rec.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{rec.description}</p>
                    <div className="text-xs text-gray-500">
                      Strategy: {rec.strategy} | Priority: {rec.priority}
                    </div>
                    {rec.culturalNotes && (
                      <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 p-2 rounded">
                        Cultural Note: {rec.culturalNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Matched Resources */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                🎯 Matched Mental Health Resources
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {directoryResults.slice(0, 6).map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">
                        {result.resource.category === 'dormitory-based' && '🏠'}
                        {result.resource.category === 'helplines' && '📞'}
                        {result.resource.category === 'clinics' && '🏥'}
                        {result.resource.category === 'online-services' && '💻'}
                        {result.resource.category === 'peer-support' && '👥'}
                        {result.resource.category === 'emergency-services' && '🚨'}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 line-clamp-1">
                          {result.resource.name.en}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {result.resource.category.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {result.resource.description.en}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-yellow-600">
                        ⭐ {result.resource.qualityMetrics.averageRating.toFixed(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        result.isCurrentlyOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {result.isCurrentlyOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                    {result.distance && (
                      <div className="mt-2 text-xs text-gray-500">
                        📍 {result.distance.toFixed(1)} km away
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Directory View */}
        {currentView === 'directory' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              🏥 Complete Resources Directory
            </h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Full Directory Interface
              </h3>
              <p className="text-gray-600 mb-6">
                The complete resources directory with advanced search, filtering, and management features.
              </p>
              <div className="space-x-4">
                <a
                  href="/resources-directory"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  View Full Directory
                </a>
                <a
                  href="/resources-demo"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors inline-block"
                >
                  Try Directory Demo
                </a>
                <a
                  href="/resources-admin-simple"
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors inline-block"
                >
                  Admin Interface
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Demo Information */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">
            🎯 Comprehensive Platform Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">🧠 AI Engine Capabilities:</h4>
              <ul className="space-y-1 text-blue-600">
                <li>• PHQ-4 mental health assessment</li>
                <li>• 5 recommendation strategies</li>
                <li>• Cultural sensitivity features</li>
                <li>• Multi-language support</li>
                <li>• Machine learning optimization</li>
                <li>• A/B testing framework</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-700 mb-2">🏥 Directory Features:</h4>
              <ul className="space-y-1 text-purple-600">
                <li>• Dynamic resource categorization</li>
                <li>• Multi-language descriptions</li>
                <li>• Real-time availability</li>
                <li>• Location-based search</li>
                <li>• QR code generation</li>
                <li>• Utilization tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">📊 Analytics & Admin:</h4>
              <ul className="space-y-1 text-green-600">
                <li>• Comprehensive dashboard</li>
                <li>• Resource management</li>
                <li>• Feedback collection</li>
                <li>• Usage analytics</li>
                <li>• Performance metrics</li>
                <li>• API endpoints</li>
              </ul>
            </div>
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

export default ComprehensiveDemo;
