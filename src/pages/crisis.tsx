import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';

export default function Crisis() {
  const { t } = useTranslation('common');

  const emergencyContacts = [
    {
      name: t('samaritans_hotline', 'Samaritans Hotline'),
      number: '1767',
      description: t('samaritans_24h', '24-hour emotional support hotline'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil']
    },
    {
      name: t('police_emergency', 'Police Emergency'),
      number: '999',
      description: t('police_desc', 'For immediate danger or emergency situations'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil']
    },
    {
      name: t('ambulance_emergency', 'Ambulance/Medical Emergency'),
      number: '995',
      description: t('ambulance_desc', 'For medical emergencies requiring immediate attention'),
      languages: ['English', 'Chinese', 'Malay', 'Tamil']
    }
  ];

  const handleWhatsAppCrisis = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890';
    const message = encodeURIComponent('URGENT: I need crisis support and immediate help.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-red-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-3xl font-bold text-red-800 mb-2">
              {t('crisis_support', 'Crisis Support')}
            </h1>
            <p className="text-red-700 text-lg">
              {t('crisis_subtitle', 'You are not alone. Help is available right now.')}
            </p>
          </div>

          {/* Immediate Help Section */}
          <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-red-800 mb-4">
              {t('immediate_help', 'Need Immediate Help?')}
            </h2>
            <p className="text-red-700 mb-4">
              {t('crisis_instruction', 'If you are having thoughts of suicide or self-harm, or are in immediate danger, please contact emergency services right away.')}
            </p>
            
            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between bg-white border border-red-200 rounded p-4">
                  <div>
                    <h3 className="font-semibold text-red-800">{contact.name}</h3>
                    <p className="text-red-600 text-sm">{contact.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.languages.map((lang, idx) => (
                        <span key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open(`tel:${contact.number}`, '_blank')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg hover:bg-red-700 transition-colors"
                  >
                    📞 {contact.number}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Crisis Support */}
          <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-orange-800 mb-4">
              {t('whatsapp_crisis_support', 'WhatsApp Crisis Support')}
            </h2>
            <p className="text-orange-700 mb-4">
              {t('whatsapp_crisis_desc', 'If you prefer messaging or can\'t make a phone call, connect with our crisis support team via WhatsApp.')}
            </p>
            <button 
              onClick={handleWhatsAppCrisis}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>📱</span>
              <span>{t('get_crisis_help_whatsapp', 'Get Crisis Help via WhatsApp')}</span>
            </button>
          </div>

          {/* Safety Planning */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-blue-800 mb-4">
              {t('safety_planning', 'Crisis Safety Planning')}
            </h2>
            <div className="space-y-3 text-blue-700">
              <div>
                <h3 className="font-semibold">{t('warning_signs', 'Warning Signs to Watch For:')}</h3>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>{t('sign_1', 'Thoughts of suicide or self-harm')}</li>
                  <li>{t('sign_2', 'Feeling hopeless or trapped')}</li>
                  <li>{t('sign_3', 'Severe mood changes')}</li>
                  <li>{t('sign_4', 'Substance abuse increase')}</li>
                  <li>{t('sign_5', 'Social withdrawal')}</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold">{t('coping_strategies', 'Immediate Coping Strategies:')}</h3>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>{t('strategy_1', 'Call someone you trust')}</li>
                  <li>{t('strategy_2', 'Remove harmful objects from reach')}</li>
                  <li>{t('strategy_3', 'Practice deep breathing exercises')}</li>
                  <li>{t('strategy_4', 'Go to a safe, public place')}</li>
                  <li>{t('strategy_5', 'Use grounding techniques (5-4-3-2-1 method)')}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-yellow-800 mb-3">
              {t('important_reminders', 'Important Reminders')}
            </h2>
            <ul className="text-yellow-700 text-sm space-y-2">
              <li>✅ {t('reminder_1', 'You are not alone - crisis support is available 24/7')}</li>
              <li>✅ {t('reminder_2', 'Your feelings are temporary - this crisis will pass')}</li>
              <li>✅ {t('reminder_3', 'Seeking help is a sign of strength, not weakness')}</li>
              <li>✅ {t('reminder_4', 'There are people who care about you and want to help')}</li>
              <li>✅ {t('reminder_5', 'Professional support can make a real difference')}</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex space-x-4">
            <Link href="/dashboard" className="flex-1">
              <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                {t('back_dashboard', 'Back to Dashboard')}
              </button>
            </Link>
            <Link href="/resources" className="flex-1">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                {t('view_resources', 'View All Resources')}
              </button>
            </Link>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500">
            <p>{t('crisis_privacy', 'Your safety is our priority. All communications are confidential and secure.')}</p>
          </div>
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
