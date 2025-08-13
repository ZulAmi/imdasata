'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, MessageCircle, Heart, Brain, ArrowLeft } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface Translation {
  [key: string]: string;
}

interface Translations {
  [languageCode: string]: Translation;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

const translations: Translations = {
  en: {
    title: 'SATA - Mental Health Support',
    subtitle: 'Anonymous AI-powered mental health assistance',
    greeting: 'Hello! How are you feeling today?',
    crisisHelp: 'Crisis Support Available',
    chatNow: 'Start Anonymous Chat',
    takeAssessment: 'Mental Health Assessment',
    moodTracking: 'Track Your Mood',
    resources: 'Browse Resources',
    privacyNote: 'Your privacy is our priority. All conversations are completely anonymous.',
    supportText: 'We provide 24/7 support in multiple languages with cultural sensitivity.',
    featuresTitle: 'Our Features',
    feature1: 'Anonymous Chat Support',
    feature2: 'Crisis Detection & Response',
    feature3: 'Mood Pattern Analysis',
    feature4: 'Personalized Resources',
    backToHome: 'Back to Home'
  },
  es: {
    title: 'SATA - Apoyo de Salud Mental',
    subtitle: 'Asistencia anónima de salud mental impulsada por IA',
    greeting: '¡Hola! ¿Cómo te sientes hoy?',
    crisisHelp: 'Apoyo en Crisis Disponible',
    chatNow: 'Iniciar Chat Anónimo',
    takeAssessment: 'Evaluación de Salud Mental',
    moodTracking: 'Seguimiento del Estado de Ánimo',
    resources: 'Explorar Recursos',
    privacyNote: 'Tu privacidad es nuestra prioridad. Todas las conversaciones son completamente anónimas.',
    supportText: 'Brindamos apoyo 24/7 en múltiples idiomas con sensibilidad cultural.',
    featuresTitle: 'Nuestras Características',
    feature1: 'Soporte de Chat Anónimo',
    feature2: 'Detección y Respuesta a Crisis',
    feature3: 'Análisis de Patrones de Humor',
    feature4: 'Recursos Personalizados',
    backToHome: 'Volver al Inicio'
  },
  fr: {
    title: 'SATA - Soutien en Santé Mentale',
    subtitle: 'Assistance anonyme en santé mentale alimentée par IA',
    greeting: 'Bonjour! Comment vous sentez-vous aujourd\'hui?',
    crisisHelp: 'Soutien de Crise Disponible',
    chatNow: 'Commencer un Chat Anonyme',
    takeAssessment: 'Évaluation de Santé Mentale',
    moodTracking: 'Suivi de l\'Humeur',
    resources: 'Parcourir les Ressources',
    privacyNote: 'Votre vie privée est notre priorité. Toutes les conversations sont complètement anonymes.',
    supportText: 'Nous offrons un soutien 24/7 en plusieurs langues avec sensibilité culturelle.',
    featuresTitle: 'Nos Fonctionnalités',
    feature1: 'Support de Chat Anonyme',
    feature2: 'Détection et Réponse aux Crises',
    feature3: 'Analyse des Modèles d\'Humeur',
    feature4: 'Ressources Personnalisées',
    backToHome: 'Retour à l\'Accueil'
  },
  zh: {
    title: 'SATA - 心理健康支持',
    subtitle: '匿名AI驱动的心理健康援助',
    greeting: '您好！今天感觉如何？',
    crisisHelp: '危机支持可用',
    chatNow: '开始匿名聊天',
    takeAssessment: '心理健康评估',
    moodTracking: '情绪追踪',
    resources: '浏览资源',
    privacyNote: '您的隐私是我们的首要任务。所有对话都是完全匿名的。',
    supportText: '我们提供24/7多语言支持，具有文化敏感性。',
    featuresTitle: '我们的功能',
    feature1: '匿名聊天支持',
    feature2: '危机检测与响应',
    feature3: '情绪模式分析',
    feature4: '个性化资源',
    backToHome: '返回首页'
  },
  ar: {
    title: 'ساتا - دعم الصحة النفسية',
    subtitle: 'مساعدة مجهولة للصحة النفسية مدعومة بالذكاء الاصطناعي',
    greeting: 'مرحباً! كيف تشعر اليوم؟',
    crisisHelp: 'دعم الأزمات متاح',
    chatNow: 'بدء محادثة مجهولة',
    takeAssessment: 'تقييم الصحة النفسية',
    moodTracking: 'تتبع المزاج',
    resources: 'تصفح الموارد',
    privacyNote: 'خصوصيتك هي أولويتنا. جميع المحادثات مجهولة تماماً.',
    supportText: 'نقدم دعماً على مدار الساعة بعدة لغات مع الحساسية الثقافية.',
    featuresTitle: 'ميزاتنا',
    feature1: 'دعم المحادثة المجهولة',
    feature2: 'اكتشاف الأزمات والاستجابة',
    feature3: 'تحليل أنماط المزاج',
    feature4: 'موارد مخصصة',
    backToHome: 'العودة للرئيسية'
  },
  hi: {
    title: 'SATA - मानसिक स्वास्थ्य सहायता',
    subtitle: 'गुमनाम AI-संचालित मानसिक स्वास्थ्य सहायता',
    greeting: 'नमस्ते! आज आप कैसा महसूस कर रहे हैं?',
    crisisHelp: 'संकट सहायता उपलब्ध',
    chatNow: 'गुमनाम चैट शुरू करें',
    takeAssessment: 'मानसिक स्वास्थ्य मूल्यांकन',
    moodTracking: 'मूड ट्रैकिंग',
    resources: 'संसाधन देखें',
    privacyNote: 'आपकी गोपनीयता हमारी प्राथमिकता है। सभी बातचीत पूरी तरह गुमनाम हैं।',
    supportText: 'हम सांस्कृतिक संवेदनशीलता के साथ कई भाषाओं में 24/7 सहायता प्रदान करते हैं।',
    featuresTitle: 'हमारी विशेषताएं',
    feature1: 'गुमनाम चैट सहायता',
    feature2: 'संकट का पता लगाना और प्रतिक्रिया',
    feature3: 'मूड पैटर्न विश्लेषण',
    feature4: 'व्यक्तिगत संसाधन',
    backToHome: 'घर वापस जाएं'
  }
};

export default function I18nTestPage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const t = (key: string): string => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const handleLanguageChange = (languageCode: string): void => {
    if (languageCode === currentLanguage) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentLanguage(languageCode);
      setIsTransitioning(false);
    }, 150);
  };

  const isRTL = currentLanguage === 'ar';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Language Selector */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Language / Idioma / Langue / 语言 / لغة / भाषा
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    currentLanguage === lang.code
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-6xl mx-auto px-4 py-12 transition-opacity duration-300 ${
        isTransitioning ? 'opacity-50' : 'opacity-100'
      }`}>
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full p-6 shadow-lg">
              <Brain className="w-16 h-16 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-3">
              <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
              <span className="text-lg font-semibold text-blue-900">
                {t('greeting')}
              </span>
            </div>
            <p className="text-blue-700">
              {t('supportText')}
            </p>
          </div>
        </div>

        {/* Crisis Support Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-12">
          <div className="flex items-center justify-center">
            <Heart className="w-6 h-6 text-red-600 mr-3" />
            <span className="text-red-800 font-semibold">
              {t('crisisHelp')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link
            href="/chat"
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <MessageCircle className="w-8 h-8 mx-auto mb-3" />
            <span className="block font-semibold">{t('chatNow')}</span>
          </Link>

          <Link
            href="/assessment"
            className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <Brain className="w-8 h-8 mx-auto mb-3" />
            <span className="block font-semibold">{t('takeAssessment')}</span>
          </Link>

          <Link
            href="/mood-tracking"
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <Heart className="w-8 h-8 mx-auto mb-3" />
            <span className="block font-semibold">{t('moodTracking')}</span>
          </Link>

          <Link
            href="/resources"
            className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-lg text-center transition-all transform hover:scale-105 shadow-lg"
          >
            <Globe className="w-8 h-8 mx-auto mb-3" />
            <span className="block font-semibold">{t('resources')}</span>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            {t('featuresTitle')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <MessageCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('feature1')}</h3>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-red-100 rounded-lg p-3">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('feature2')}</h3>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('feature3')}</h3>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-green-100 rounded-lg p-3">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{t('feature4')}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
          <p className="text-gray-700 text-center">
            {t('privacyNote')}
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('backToHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}