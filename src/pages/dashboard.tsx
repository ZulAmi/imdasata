import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export default function Dashboard() {
  const { t } = useTranslation('common');
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const features = [
    {
      id: 'assessment',
      title: t('phq4_assessment', 'Mental Health Assessment'),
      description: t('phq4_description', 'Take a quick PHQ-4 assessment to understand your mental wellness'),
      icon: '🧠',
      color: 'bg-blue-100 border-blue-300',
      href: '/assessment'
    },
    {
      id: 'mood_tracking',
      title: t('mood_tracking', 'Daily Mood Tracking'),
      description: t('mood_description', 'Track your daily mood and emotions to identify patterns'),
      icon: '📊',
      color: 'bg-green-100 border-green-300',
      href: '/mood'
    },
    {
      id: 'ai_recommendations',
      title: t('ai_recommendations', 'AI Mental Health Recommendations'),
      description: t('ai_recommendations_description', 'Get personalized resource recommendations powered by AI'),
      icon: '🤖',
      color: 'bg-indigo-100 border-indigo-300',
      href: '/ai-recommendations'
    },
    {
      id: 'resources',
      title: t('mental_health_resources', 'Mental Health Resources'),
      description: t('resources_description', 'Browse mental health services and support resources'),
      icon: '📚',
      color: 'bg-purple-100 border-purple-300',
      href: '/resources'
    },
    {
      id: 'peer_support',
      title: t('peer_support', 'Peer Support Groups'),
      description: t('peer_description', 'Connect with others in similar situations for mutual support'),
      icon: '👥',
      color: 'bg-yellow-100 border-yellow-300',
      href: '/peer-support'
    },
    {
      id: 'crisis_help',
      title: t('crisis_help', 'Crisis Support'),
      description: t('crisis_description', 'Immediate help and emergency contacts for crisis situations'),
      icon: '🚨',
      color: 'bg-red-100 border-red-300',
      href: '/crisis'
    }
  ];

  const handleWhatsAppConnect = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890';
    const message = encodeURIComponent('Hi! I would like to get mental wellness support.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t('dashboard_title', 'Mental Wellness Dashboard')}
              </h1>
              <p className="text-gray-600">
                {t('dashboard_subtitle', 'Your journey to better mental health starts here')}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Admin Dashboard Link */}
              <Link href="/admin-login" className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1">
                <span>📊</span>
                <span>Analytics</span>
              </Link>
              
              {/* Language Selector */}
              <select 
                value={selectedLanguage} 
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="bn">বাংলা</option>
                <option value="ta">தமிழ்</option>
                <option value="my">မြန်မာ</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                {t('back_home', 'Back to Home')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* WhatsApp Connection Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800 mb-1">
                {t('whatsapp_preferred', 'Prefer WhatsApp?')}
              </h3>
              <p className="text-green-700 text-sm">
                {t('whatsapp_convenience', 'Get personalized support through WhatsApp for easier access')}
              </p>
            </div>
            <button 
              onClick={handleWhatsAppConnect}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <span>📱</span>
              <span>{t('connect_whatsapp', 'Connect via WhatsApp')}</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.id}>
              <div className={`${feature.color} border-2 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer`}>
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('getting_started', 'Getting Started')}
          </h2>
          <div className="space-y-3 text-gray-600">
            <p>
              <strong>{t('step_1', 'Step 1:')}</strong> {t('step_1_desc', 'Take the PHQ-4 assessment to understand your current mental wellness level')}
            </p>
            <p>
              <strong>{t('step_2', 'Step 2:')}</strong> {t('step_2_desc', 'Start daily mood tracking to identify patterns and triggers')}
            </p>
            <p>
              <strong>{t('step_3', 'Step 3:')}</strong> {t('step_3_desc', 'Explore resources and connect with peer support groups')}
            </p>
            <p>
              <strong>{t('step_4', 'Step 4:')}</strong> {t('step_4_desc', 'Use WhatsApp for convenient, on-the-go support and check-ins')}
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            {t('privacy_detailed', 'Your privacy is our priority. We use anonymous identifiers and encrypted data storage to ensure PDPA compliance. Your personal information is never stored or shared.')}
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
