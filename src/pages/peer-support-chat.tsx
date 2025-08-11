import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import PeerChatInterface from '../components/PeerChatInterface';
import PeerSupportChatSystem from '../lib/peer-chat-system';

const PeerSupportPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [chatSystem] = useState(() => new PeerSupportChatSystem());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    displayName: '',
    languages: [] as string[],
    countryOfOrigin: '',
    interests: [] as string[],
    privacySettings: {
      showCountryOfOrigin: false,
      showLanguages: true,
      allowDirectMessages: true,
      dataRetention: 'standard' as const
    }
  });

  useEffect(() => {
    // Check if user has already set up chat profile
    const savedUserId = localStorage.getItem('peer_chat_user_id');
    if (savedUserId) {
      setCurrentUserId(savedUserId);
      setShowOnboarding(false);
    }
  }, []);

  const handleCompleteOnboarding = async () => {
    try {
      const user = await chatSystem.registerUser({
        displayName: userPreferences.displayName || `User${Math.floor(Math.random() * 1000)}`,
        languagePreferences: userPreferences.languages,
        countryOfOrigin: userPreferences.countryOfOrigin || undefined,
        interests: userPreferences.interests,
        privacySettings: userPreferences.privacySettings
      });

      setCurrentUserId(user.id);
      localStorage.setItem('peer_chat_user_id', user.id);
      setShowOnboarding(false);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇧🇩' },
    { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'my', name: 'မြန်မာ (Myanmar)', flag: '🇲🇲' },
    { code: 'idn', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt (Vietnamese)', flag: '🇻🇳' }
  ];

  const availableCountries = [
    { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' }
  ];

  const availableInterests = [
    { id: 'mental_health', name: 'Mental Health Support', icon: '🧠' },
    { id: 'work_stress', name: 'Work Stress', icon: '💼' },
    { id: 'homesickness', name: 'Homesickness', icon: '🏠' },
    { id: 'language_practice', name: 'Language Practice', icon: '🗣️' },
    { id: 'cultural_exchange', name: 'Cultural Exchange', icon: '🌍' },
    { id: 'newcomer_support', name: 'Newcomer Support', icon: '🆕' },
    { id: 'financial_advice', name: 'Financial Advice', icon: '💰' },
    { id: 'healthcare_navigation', name: 'Healthcare Navigation', icon: '🏥' },
    { id: 'legal_rights', name: 'Legal Rights', icon: '⚖️' },
    { id: 'social_activities', name: 'Social Activities', icon: '🎉' },
    { id: 'family_support', name: 'Family Support', icon: '👨‍👩‍👧‍👦' },
    { id: 'career_development', name: 'Career Development', icon: '📈' }
  ];

  if (showOnboarding) {
    return (
      <>
        <Head>
          <title>Peer Support Chat - SATA Mental Health</title>
          <meta name="description" content="Connect with peers who understand your journey. Join supportive groups based on language, culture, and shared experiences." />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🤝</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome to Peer Support Chat
              </h1>
              <p className="text-gray-600">
                Connect with others who understand your journey. Set up your profile to find the right support groups for you.
              </p>
            </div>

            <OnboardingForm
              preferences={userPreferences}
              onUpdatePreferences={setUserPreferences}
              onComplete={handleCompleteOnboarding}
              availableLanguages={availableLanguages}
              availableCountries={availableCountries}
              availableInterests={availableInterests}
            />
          </div>
        </div>
      </>
    );
  }

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p>Setting up your chat experience...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Peer Support Chat - SATA Mental Health</title>
        <meta name="description" content="Connect with peers in supportive group chats" />
      </Head>

      <PeerChatInterface
        userId={currentUserId}
        chatSystem={chatSystem}
      />
    </>
  );
};

// Onboarding Form Component
interface OnboardingFormProps {
  preferences: any;
  onUpdatePreferences: (preferences: any) => void;
  onComplete: () => void;
  availableLanguages: Array<{ code: string; name: string; flag: string }>;
  availableCountries: Array<{ code: string; name: string; flag: string }>;
  availableInterests: Array<{ id: string; name: string; icon: string }>;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({
  preferences,
  onUpdatePreferences,
  onComplete,
  availableLanguages,
  availableCountries,
  availableInterests
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const updatePreference = (field: string, value: any) => {
    onUpdatePreferences({
      ...preferences,
      [field]: value
    });
  };

  const updatePrivacySetting = (field: string, value: any) => {
    onUpdatePreferences({
      ...preferences,
      privacySettings: {
        ...preferences.privacySettings,
        [field]: value
      }
    });
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.displayName.trim().length > 0;
      case 2:
        return preferences.languages.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Privacy settings have defaults
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">What should we call you?</h2>
            <p className="text-gray-600 text-center">
              Choose a display name that others will see in chat groups. This helps maintain your privacy while allowing meaningful connections.
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={preferences.displayName}
                onChange={(e) => updatePreference('displayName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., FriendlyHelper, SupportSeeker..."
                maxLength={20}
              />
              <p className="text-xs text-gray-500">
                💡 Tip: Choose something positive and friendly. Avoid using your real name for privacy.
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Which languages do you speak?</h2>
            <p className="text-gray-600 text-center">
              Select all languages you're comfortable chatting in. This helps us match you with the right groups.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {availableLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => updatePreference('languages', toggleArrayItem(preferences.languages, language.code))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    preferences.languages.includes(language.code)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{language.flag}</span>
                    <span className="text-sm font-medium">{language.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">What topics interest you?</h2>
            <p className="text-gray-600 text-center">
              Select areas where you'd like to give or receive support. This helps us suggest relevant groups.
            </p>
            
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {availableInterests.map((interest) => (
                <button
                  key={interest.id}
                  onClick={() => updatePreference('interests', toggleArrayItem(preferences.interests, interest.id))}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    preferences.interests.includes(interest.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{interest.icon}</span>
                    <span className="text-sm font-medium">{interest.name}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 Optional: You can skip this step and explore groups later, or select just a few to start.
              </p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center">Privacy Settings</h2>
            <p className="text-gray-600 text-center">
              Control what information you share and how long your messages are kept.
            </p>
            
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Show Country of Origin</label>
                  <input
                    type="checkbox"
                    checked={preferences.privacySettings.showCountryOfOrigin}
                    onChange={(e) => updatePrivacySetting('showCountryOfOrigin', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Allow others to see your country of origin to find people from similar backgrounds.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-medium">Allow Direct Messages</label>
                  <input
                    type="checkbox"
                    checked={preferences.privacySettings.allowDirectMessages}
                    onChange={(e) => updatePrivacySetting('allowDirectMessages', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Let other users send you private messages outside of group chats.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="block font-medium mb-2">Message Retention</label>
                <select
                  value={preferences.privacySettings.dataRetention}
                  onChange={(e) => updatePrivacySetting('dataRetention', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minimal">Minimal (7 days)</option>
                  <option value="standard">Standard (30 days)</option>
                  <option value="extended">Extended (90 days)</option>
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  How long your messages are kept before being automatically deleted.
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  🔒 Your privacy is important. You can change these settings anytime in your profile.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={!canProceed()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStep === totalSteps ? 'Start Chatting' : 'Next'}
        </button>
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

export default PeerSupportPage;
