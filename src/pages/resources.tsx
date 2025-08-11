import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export default function Resources() {
  const { t } = useTranslation('common');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: t('all_resources', 'All Resources'), icon: '📚' },
    { id: 'crisis', label: t('crisis_support', 'Crisis Support'), icon: '🚨' },
    { id: 'counseling', label: t('counseling', 'Counseling'), icon: '💬' },
    { id: 'support_groups', label: t('support_groups', 'Support Groups'), icon: '👥' },
    { id: 'self_help', label: t('self_help', 'Self-Help'), icon: '📖' },
    { id: 'medical', label: t('medical', 'Medical Services'), icon: '🏥' }
  ];

  const resources = [
    {
      id: 1,
      title: t('samaritans_singapore', 'Samaritans of Singapore'),
      category: 'crisis',
      type: t('hotline', 'Hotline'),
      phone: '1-767',
      description: t('samaritans_desc', '24-hour confidential emotional support hotline'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil'],
      isEmergency: true,
      isFree: true
    },
    {
      id: 2,
      title: t('institute_mental_health', 'Institute of Mental Health'),
      category: 'medical',
      type: t('hospital', 'Hospital'),
      phone: '6389-2222',
      description: t('imh_desc', 'Singapore\'s national psychiatric hospital providing comprehensive mental health services'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil'],
      isEmergency: false,
      isFree: false
    },
    {
      id: 3,
      title: t('touch_community', 'TOUCH Community Services'),
      category: 'counseling',
      type: t('counseling_service', 'Counseling Service'),
      phone: '6804-6555',
      description: t('touch_desc', 'Professional counseling services for individuals and families'),
      languages: ['English', 'Chinese'],
      isEmergency: false,
      isFree: true
    },
    {
      id: 4,
      title: t('migrant_workers_centre', 'Migrant Workers\' Centre'),
      category: 'support_groups',
      type: t('community_support', 'Community Support'),
      phone: '6536-2692',
      description: t('mwc_desc', 'Support services specifically for migrant workers in Singapore'),
      languages: ['English', 'Bengali', 'Tamil', 'Chinese'],
      isEmergency: false,
      isFree: true
    },
    {
      id: 5,
      title: t('mindfulness_app', 'Mindfulness & Meditation Apps'),
      category: 'self_help',
      type: t('digital_resource', 'Digital Resource'),
      phone: '',
      description: t('mindfulness_desc', 'Free apps for meditation, breathing exercises, and stress management'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil'],
      isEmergency: false,
      isFree: true
    }
  ];

  const filteredResources = selectedCategory === 'all' 
    ? resources 
    : resources.filter(resource => resource.category === selectedCategory);

  const handleWhatsAppConnect = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890';
    const message = encodeURIComponent('Hi! I need help finding mental health resources.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t('mental_health_resources', 'Mental Health Resources')}
              </h1>
              <p className="text-gray-600">
                {t('resources_subtitle', 'Find support services and resources for your mental wellness')}
              </p>
            </div>
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
              {t('back_dashboard', 'Back to Dashboard')}
            </Link>
          </div>

          {/* Emergency Banner */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  🚨 {t('emergency_help', 'Need Immediate Help?')}
                </h3>
                <p className="text-red-700 text-sm">
                  {t('emergency_instruction', 'If you\'re in crisis or having thoughts of self-harm, call 1-767 (Samaritans) immediately')}
                </p>
              </div>
              <button 
                onClick={() => window.open('tel:1767', '_blank')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <span>📞</span>
                <span>{t('call_now', 'Call Now')}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Option */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 mb-1">
                  💬 {t('whatsapp_support', 'Get Personalized Help via WhatsApp')}
                </h3>
                <p className="text-green-700 text-sm">
                  {t('whatsapp_resources_desc', 'Get help finding the right resources for your specific situation')}
                </p>
              </div>
              <button 
                onClick={handleWhatsAppConnect}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>📱</span>
                <span>{t('get_help', 'Get Help')}</span>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {t('filter_by_category', 'Filter by Category')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.icon} {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources List */}
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {resource.title}
                      {resource.isEmergency && (
                        <span className="ml-2 inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          {t('emergency', 'Emergency')}
                        </span>
                      )}
                      {resource.isFree && (
                        <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {t('free', 'Free')}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{resource.type}</p>
                  </div>
                  {resource.phone && (
                    <button 
                      onClick={() => window.open(`tel:${resource.phone}`, '_blank')}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      📞 {resource.phone}
                    </button>
                  )}
                </div>
                
                <p className="text-gray-700 mb-3">{resource.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs text-gray-500">{t('languages_available', 'Languages')}:</span>
                  {resource.languages.map((language, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {language}
                    </span>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    {t('save_resource', 'Save Resource')}
                  </button>
                  <button className="text-green-600 hover:text-green-800 text-sm">
                    {t('share_resource', 'Share')}
                  </button>
                  <button className="text-purple-600 hover:text-purple-800 text-sm">
                    {t('get_directions', 'Get Directions')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredResources.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {t('no_resources_found', 'No resources found for this category.')}
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>{t('resources_disclaimer', 'This information is for guidance only. In emergencies, always call local emergency services.')}</p>
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
