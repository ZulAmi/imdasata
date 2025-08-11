/**
 * Buddy System Main Page
 * Entry point for the buddy pairing system with onboarding
 */

import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import BuddyInterface from '../components/chat/BuddyInterface';
import { buddySystem, BuddyUser } from '../lib/buddy-system';

interface BuddyOnboardingData {
  name: string;
  language: string;
  country: string;
  interests: string[];
  timezone: string;
  availableTimes: string[];
  experienceLevel: 'newcomer' | 'experienced' | 'veteran';
  communicationStyle: 'casual' | 'structured' | 'flexible';
  topicsOfInterest: string[];
  triggerWarnings: string[];
  preferredGender?: 'male' | 'female' | 'any';
  ageRange?: [number, number];
  privacySettings: {
    shareLocation: boolean;
    sharePersonalInfo: boolean;
    allowVoiceMessages: boolean;
  };
}

const BuddySystemPage: React.FC = () => {
  const { t } = useTranslation('common');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<BuddyOnboardingData>({
    name: '',
    language: 'en',
    country: '',
    interests: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    availableTimes: [],
    experienceLevel: 'newcomer',
    communicationStyle: 'flexible',
    topicsOfInterest: [],
    triggerWarnings: [],
    preferredGender: 'any',
    privacySettings: {
      shareLocation: false,
      sharePersonalInfo: false,
      allowVoiceMessages: true,
    },
  });

  useEffect(() => {
    // Check if user is already registered
    const savedUserId = localStorage.getItem('buddyUserId');
    if (savedUserId) {
      const user = buddySystem.getUser(savedUserId);
      if (user) {
        setCurrentUserId(savedUserId);
        setIsOnboarded(true);
      } else {
        localStorage.removeItem('buddyUserId');
      }
    }
  }, []);

  const startOnboarding = () => {
    setShowOnboarding(true);
    setOnboardingStep(1);
  };

  const completeOnboarding = () => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const user = buddySystem.registerUser({
      id: userId,
      ...onboardingData,
      supportPreferences: {
        communicationStyle: onboardingData.communicationStyle,
        topicsOfInterest: onboardingData.topicsOfInterest,
        triggerWarnings: onboardingData.triggerWarnings,
        preferredGender: onboardingData.preferredGender,
        ageRange: onboardingData.ageRange,
      },
    });

    localStorage.setItem('buddyUserId', userId);
    setCurrentUserId(userId);
    setIsOnboarded(true);
    setShowOnboarding(false);
  };

  const updateOnboardingData = (updates: Partial<BuddyOnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setOnboardingStep(prev => prev + 1);
  };

  const prevStep = () => {
    setOnboardingStep(prev => Math.max(1, prev - 1));
  };

  if (isOnboarded && currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <BuddyInterface currentUserId={currentUserId} />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-2xl mx-auto">
          <BuddyOnboarding
            step={onboardingStep}
            data={onboardingData}
            onUpdateData={updateOnboardingData}
            onNext={nextStep}
            onPrev={prevStep}
            onComplete={completeOnboarding}
            t={t}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-6">
        {/* Header */}
        <div className="mb-8">
          <span className="text-6xl mb-4 block">🤝</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {t('buddy_system_title', 'Find Your Support Buddy')}
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {t('buddy_system_desc', 'Connect with someone who understands your journey. Get matched with a buddy for mutual support, regular check-ins, and shared growth.')}
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <span className="text-3xl mb-3 block">🎯</span>
            <h3 className="font-semibold text-gray-800 mb-2">{t('smart_matching', 'Smart Matching')}</h3>
            <p className="text-sm text-gray-600">
              {t('smart_matching_desc', 'Advanced algorithm matches you based on language, interests, experience level, and communication preferences.')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <span className="text-3xl mb-3 block">🔒</span>
            <h3 className="font-semibold text-gray-800 mb-2">{t('safe_secure', 'Safe & Secure')}</h3>
            <p className="text-sm text-gray-600">
              {t('safe_secure_desc', 'Built-in safety features, reporting mechanisms, and privacy controls to ensure your well-being.')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <span className="text-3xl mb-3 block">🏆</span>
            <h3 className="font-semibold text-gray-800 mb-2">{t('gamified_support', 'Gamified Support')}</h3>
            <p className="text-sm text-gray-600">
              {t('gamified_support_desc', 'Earn points, unlock achievements, and track your progress together with your buddy.')}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <span className="text-3xl mb-3 block">💬</span>
            <h3 className="font-semibold text-gray-800 mb-2">{t('flexible_communication', 'Flexible Communication')}</h3>
            <p className="text-sm text-gray-600">
              {t('flexible_communication_desc', 'Text chat, voice messages, scheduled check-ins, and conversation starters to keep you connected.')}
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('how_it_works', 'How It Works')}</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium text-gray-800">{t('step_1', 'Complete Profile')}</div>
              <div className="text-gray-600">{t('step_1_desc', 'Share your preferences and interests')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium text-gray-800">{t('step_2', 'Get Matched')}</div>
              <div className="text-gray-600">{t('step_2_desc', 'Our algorithm finds your perfect buddy')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium text-gray-800">{t('step_3', 'Start Chatting')}</div>
              <div className="text-gray-600">{t('step_3_desc', 'Begin your support journey together')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🌱</div>
              <div className="font-medium text-gray-800">{t('step_4', 'Grow Together')}</div>
              <div className="text-gray-600">{t('step_4_desc', 'Build resilience and support each other')}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={startOnboarding}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
        >
          {t('get_started', 'Get Started - Find My Buddy')}
        </button>

        <p className="text-xs text-gray-500 mt-4">
          {t('buddy_privacy_note', 'Your privacy and safety are our top priorities. All interactions are monitored for safety.')}
        </p>
      </div>
    </div>
  );
};

// Onboarding Component
const BuddyOnboarding: React.FC<{
  step: number;
  data: BuddyOnboardingData;
  onUpdateData: (updates: Partial<BuddyOnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  t: any;
}> = ({ step, data, onUpdateData, onNext, onPrev, onComplete, t }) => {
  const totalSteps = 5;

  const availableInterests = [
    'Career Development', 'Mental Health', 'Cultural Adaptation', 'Language Learning',
    'Financial Planning', 'Healthcare Navigation', 'Social Connections', 'Family Support',
    'Education', 'Legal Rights', 'Housing', 'Food & Cooking', 'Exercise & Wellness',
    'Technology', 'Arts & Creativity', 'Travel', 'Spirituality', 'Volunteering'
  ];

  const availableTopics = [
    'Work Stress', 'Homesickness', 'Language Barriers', 'Cultural Differences',
    'Loneliness', 'Family Relationships', 'Financial Stress', 'Health Concerns',
    'Legal Issues', 'Discrimination', 'Career Goals', 'Education Planning',
    'Relationship Advice', 'Parenting', 'Elder Care', 'Mental Health Support'
  ];

  const availableTriggerWarnings = [
    'Violence', 'Discrimination', 'Family Trauma', 'Financial Stress',
    'Health Issues', 'Legal Problems', 'Relationship Abuse', 'Workplace Harassment',
    'Immigration Stress', 'Religious Topics', 'Political Discussions', 'Loss & Grief'
  ];

  const toggleArrayItem = (array: string[], item: string, setter: (items: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.name.trim().length > 0 && data.country.trim().length > 0;
      case 2:
        return data.interests.length > 0 && data.availableTimes.length > 0;
      case 3:
        return data.topicsOfInterest.length > 0;
      case 4:
        return true; // Optional step
      case 5:
        return true; // Privacy settings
      default:
        return false;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">{t('step', 'Step')} {step} {t('of', 'of')} {totalSteps}</span>
          <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('basic_info', 'Basic Information')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('your_name', 'Your Name')} *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => onUpdateData({ name: e.target.value })}
                placeholder={t('enter_name', 'Enter your preferred name')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('country_origin', 'Country of Origin')} *
              </label>
              <input
                type="text"
                value={data.country}
                onChange={(e) => onUpdateData({ country: e.target.value })}
                placeholder={t('enter_country', 'Enter your country')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preferred_language', 'Preferred Language')}
              </label>
              <select
                value={data.language}
                onChange={(e) => onUpdateData({ language: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="zh">中文 (Chinese)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="my">မြန်မာ (Myanmar)</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="th">ไทย (Thai)</option>
                <option value="vi">Tiếng Việt (Vietnamese)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('experience_level', 'Experience Level')}
              </label>
              <div className="space-y-2">
                {[
                  { value: 'newcomer', label: t('newcomer', 'Newcomer'), desc: t('newcomer_desc', 'New to the area, looking for guidance') },
                  { value: 'experienced', label: t('experienced', 'Experienced'), desc: t('experienced_desc', 'Settled in, can offer and receive support') },
                  { value: 'veteran', label: t('veteran', 'Veteran'), desc: t('veteran_desc', 'Long-term resident, ready to mentor others') },
                ].map(level => (
                  <label key={level.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level.value}
                      checked={data.experienceLevel === level.value}
                      onChange={(e) => onUpdateData({ experienceLevel: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{level.label}</div>
                      <div className="text-sm text-gray-600">{level.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('interests_availability', 'Interests & Availability')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('select_interests', 'Select Your Interests')} * ({t('min_one', 'minimum 1')})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableInterests.map(interest => (
                  <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.interests.includes(interest)}
                      onChange={() => toggleArrayItem(data.interests, interest, (interests) => onUpdateData({ interests }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('available_times', 'When are you usually available?')} * ({t('min_one', 'minimum 1')})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'early-morning', label: t('early_morning', 'Early Morning (6-9 AM)') },
                  { value: 'morning', label: t('morning', 'Morning (9 AM-12 PM)') },
                  { value: 'afternoon', label: t('afternoon', 'Afternoon (12-6 PM)') },
                  { value: 'evening', label: t('evening', 'Evening (6-10 PM)') },
                  { value: 'late-night', label: t('late_night', 'Late Night (10 PM-12 AM)') },
                  { value: 'flexible', label: t('flexible', 'Flexible / As needed') },
                ].map(time => (
                  <label key={time.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.availableTimes.includes(time.value)}
                      onChange={() => toggleArrayItem(data.availableTimes, time.value, (times) => onUpdateData({ availableTimes: times }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{time.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('communication_style', 'Communication Style')}
              </label>
              <div className="space-y-2">
                {[
                  { value: 'casual', label: t('casual', 'Casual'), desc: t('casual_desc', 'Informal, friendly conversations') },
                  { value: 'structured', label: t('structured', 'Structured'), desc: t('structured_desc', 'Organized check-ins with clear goals') },
                  { value: 'flexible', label: t('flexible', 'Flexible'), desc: t('flexible_desc', 'Adapt to what works best for both') },
                ].map(style => (
                  <label key={style.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="communicationStyle"
                      value={style.value}
                      checked={data.communicationStyle === style.value}
                      onChange={(e) => onUpdateData({ communicationStyle: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{style.label}</div>
                      <div className="text-sm text-gray-600">{style.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('support_topics', 'Support Topics')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('topics_interested', 'What topics would you like to discuss with your buddy?')} * ({t('min_one', 'minimum 1')})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableTopics.map(topic => (
                  <label key={topic} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.topicsOfInterest.includes(topic)}
                      onChange={() => toggleArrayItem(data.topicsOfInterest, topic, (topics) => onUpdateData({ topicsOfInterest: topics }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('trigger_warnings', 'Are there topics you prefer to avoid?')} ({t('optional', 'optional')})
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableTriggerWarnings.map(warning => (
                  <label key={warning} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.triggerWarnings.includes(warning)}
                      onChange={() => toggleArrayItem(data.triggerWarnings, warning, (warnings) => onUpdateData({ triggerWarnings: warnings }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{warning}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('matching_preferences', 'Matching Preferences')}</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preferred_buddy_gender', 'Preferred Buddy Gender')} ({t('optional', 'optional')})
              </label>
              <div className="space-y-2">
                {[
                  { value: 'any', label: t('any_gender', 'Any Gender') },
                  { value: 'male', label: t('male', 'Male') },
                  { value: 'female', label: t('female', 'Female') },
                ].map(gender => (
                  <label key={gender.value} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="preferredGender"
                      value={gender.value}
                      checked={data.preferredGender === gender.value}
                      onChange={(e) => onUpdateData({ preferredGender: e.target.value as any })}
                    />
                    <span className="text-gray-800">{gender.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('preferred_age_range', 'Preferred Age Range')} ({t('optional', 'optional')})
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder={t('min_age', 'Min Age')}
                    value={data.ageRange?.[0] || ''}
                    onChange={(e) => {
                      const min = parseInt(e.target.value) || undefined;
                      const max = data.ageRange?.[1];
                      onUpdateData({ ageRange: min && max ? [min, max] : undefined });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-500">-</span>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder={t('max_age', 'Max Age')}
                    value={data.ageRange?.[1] || ''}
                    onChange={(e) => {
                      const max = parseInt(e.target.value) || undefined;
                      const min = data.ageRange?.[0];
                      onUpdateData({ ageRange: min && max ? [min, max] : undefined });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('privacy_settings', 'Privacy & Safety Settings')}</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-3">{t('privacy_controls', 'Privacy Controls')}</h3>
              <div className="space-y-3">
                {[
                  { 
                    key: 'allowVoiceMessages', 
                    label: t('allow_voice_messages', 'Allow Voice Messages'),
                    desc: t('voice_desc', 'Let your buddy send you voice messages')
                  },
                  { 
                    key: 'sharePersonalInfo', 
                    label: t('share_personal_info', 'Share Personal Information'),
                    desc: t('personal_info_desc', 'Allow sharing of location and contact details')
                  },
                  { 
                    key: 'shareLocation', 
                    label: t('share_location', 'Share Location'),
                    desc: t('location_desc', 'Let your buddy know your general area')
                  },
                ].map(setting => (
                  <label key={setting.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.privacySettings[setting.key as keyof typeof data.privacySettings]}
                      onChange={(e) => onUpdateData({
                        privacySettings: {
                          ...data.privacySettings,
                          [setting.key]: e.target.checked
                        }
                      })}
                      className="mt-1 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{setting.label}</div>
                      <div className="text-sm text-gray-600">{setting.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">{t('safety_reminders', 'Safety Reminders')}</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {t('safety_1', 'Never share personal information like full address or financial details')}</li>
                <li>• {t('safety_2', 'Report any inappropriate behavior immediately')}</li>
                <li>• {t('safety_3', 'All conversations are monitored for safety')}</li>
                <li>• {t('safety_4', 'You can request a new buddy at any time')}</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">{t('ready_to_connect', 'Ready to Connect!')}</h3>
              <p className="text-sm text-green-700">
                {t('ready_desc', 'You\'re all set! Once you complete setup, we\'ll find you a compatible buddy who shares your interests and communication style.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrev}
          disabled={step === 1}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed"
        >
          {t('previous', 'Previous')}
        </button>

        {step < totalSteps ? (
          <button
            onClick={onNext}
            disabled={!isStepValid()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('next', 'Next')}
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 font-medium"
          >
            {t('find_my_buddy', 'Find My Buddy!')}
          </button>
        )}
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

export default BuddySystemPage;
