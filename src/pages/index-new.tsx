import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const { t } = useTranslation('common');
  const [showWhatsAppInfo, setShowWhatsAppInfo] = useState(false);

  const handleWhatsAppConnect = () => {
    // Get WhatsApp number from environment or show instructions
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890';
    const message = encodeURIComponent('Hi! I would like to get mental wellness support.');
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${message}`;
    
    // Try to open WhatsApp, fallback to showing instructions
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank');
    } else {
      setShowWhatsAppInfo(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
          {t('title', 'Mental Wellness Assistant')}
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {t('subtitle', 'Supporting migrant workers with accessible mental health resources')}
        </p>
        
        {!showWhatsAppInfo ? (
          <div className="space-y-4">
            <Link href="/dashboard" className="block">
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                {t('start', 'Get Started')}
              </button>
            </Link>
            <button 
              onClick={handleWhatsAppConnect}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
            >
              {t('whatsapp', 'Connect via WhatsApp')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                {t('whatsapp_instructions', 'Connect via WhatsApp')}
              </h3>
              <p className="text-green-700 text-sm mb-3">
                {t('whatsapp_description', 'Send a message to our WhatsApp number to start getting mental wellness support:')}
              </p>
              <div className="bg-white border rounded p-2 mb-3">
                <code className="text-green-800 font-mono">
                  {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+1234567890'}
                </code>
              </div>
              <p className="text-green-600 text-xs">
                {t('whatsapp_message', 'Start your message with: "Hi! I would like to get mental wellness support."')}
              </p>
            </div>
            <button 
              onClick={() => setShowWhatsAppInfo(false)}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
            >
              {t('back', 'Back')}
            </button>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {t('privacy_note', 'Your privacy is protected. We use anonymous identifiers to ensure PDPA compliance.')}
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
