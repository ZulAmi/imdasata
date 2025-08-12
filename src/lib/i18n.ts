/**
 * Internationalization (i18n) Library
 * Handles multi-language content and translations
 */

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'zh', 'bn', 'ta', 'my', 'id'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Translation data structure
interface TranslationData {
  [key: string]: {
    [lang in SupportedLanguage]?: string;
  };
}

// Sample translations for testing
const translations: TranslationData = {
  'welcome.message': {
    en: 'Welcome to SATA Mental Wellness Assistant! How can I help you today?',
    zh: '欢迎使用SATA心理健康助手！今天我可以为您做些什么？',
    bn: 'SATA মানসিক সুস্থতা সহায়কে স্বাগতম! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
    ta: 'SATA மன நல்வாழ்வு உதவியாளருக்கு வரவேற்கிறோம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
    my: 'SATA စိတ်ကျန်းမာရေး လက်ထောက်သို့ ကြိုဆိုပါတယ်! ဒီနေ့ ကျွန်တော် ဘယ်လို ကူညီပေးနိုင်မလဲ?',
    id: 'Selamat datang di Asisten Kesehatan Mental SATA! Bagaimana saya bisa membantu Anda hari ini?'
  },
  'assessment.phq4.question1': {
    en: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
    zh: '在过去2周里，您多久感到情绪低落、沮丧或绝望？',
    bn: 'গত 2 সপ্তাহে, আপনি কতবার বিষণ্ণ, হতাশ বা আশাহীন বোধ করেছেন?',
    ta: 'கடந்த 2 வாரங்களில், நீங்கள் எத்தனை முறை மனச்சோர்வு, உணர்ச்சியற்ற அல்லது நம்பிக்கையற்ற உணர்வால் பாதிக்கப்பட்டீர்கள்?',
    my: 'ပြီးခဲ့သော ၂ ပတ်အတွင်း၊ စိတ်ညစ်မျက်နှာပျက်ခြင်း၊ စိတ်ပျက်အားလျော့ခြင်းတို့ကြောင့် မည်မျှအကြိမ်အောင် စိတ်ပူပန်ခဲ့ရပါသလဲ?',
    id: 'Selama 2 minggu terakhir, seberapa sering Anda terganggu oleh perasaan sedih, depresi, atau putus asa?'
  },
  'mood.log.prompt': {
    en: 'How are you feeling today on a scale of 1-10?',
    zh: '您今天的感觉如何，1-10分？',
    bn: 'আজ আপনার মন কেমন 1-10 স্কেলে?',
    ta: 'இன்று உங்கள் மனநிலை 1-10 அளவில் எப்படி உள்ளது?',
    my: 'ဒီနေ့ သင့်ရဲ့ စိတ်ခံစားမှု ၁-၁၀ အဆင့်မှာ ဘယ်လောက်လဲ?',
    id: 'Bagaimana perasaan Anda hari ini dalam skala 1-10?'
  },
  'crisis.support.message': {
    en: 'I\'m here to help. If you\'re having thoughts of self-harm, please reach out to emergency services immediately.',
    zh: '我在这里帮助您。如果您有自残的想法，请立即联系急救服务。',
    bn: 'আমি এখানে সাহায্য করতে আছি। যদি আপনার আত্মক্ষতির চিন্তা থাকে, অনুগ্রহ করে তাৎক্ষণিক জরুরি সেবায় যোগাযোগ করুন।',
    ta: 'நான் உதவ இங்கே இருக்கிறேன். உங்களுக்கு தன்னைத் தானே காயப்படுத்தும் எண்ணங்கள் இருந்தால், உடனடியாக அவசர சேவைகளை தொடர்பு கொள்ளுங்கள்।',
    my: 'ကျွန်တော် ဒီမှာ ကူညီဖို့ ရှိပါတယ်။ မိမိကိုယ်ကို ထိခိုက်ဖို့ အတွေးတွေ ရှိနေရင် ချက်ချင်း အရေးပေါ် ဝန်ဆောင်မှုတွေကို ဆက်သွယ်ပါ။',
    id: 'Saya di sini untuk membantu. Jika Anda memiliki pikiran untuk menyakiti diri sendiri, segera hubungi layanan darurat.'
  },
  'error.general': {
    en: 'Sorry, something went wrong. Please try again.',
    zh: '抱歉，出了点问题。请重试。',
    bn: 'দুঃখিত, কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    ta: 'மன்னிக்கவும், ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    my: 'တောင်းပန်ပါတယ်၊ တစ်ခုခု မှားယွင်းသွားပါတယ်။ ကျေးဇူးပြု၍ ထပ်စမ်းကြည့်ပါ။',
    id: 'Maaf, terjadi kesalahan. Silakan coba lagi.'
  }
};

/**
 * Get translation for a specific key and language
 */
export function getTranslation(key: string, language: SupportedLanguage = 'en'): string {
  const translationSet = translations[key];
  
  if (!translationSet) {
    console.warn(`Translation key '${key}' not found`);
    return key; // Return the key itself as fallback
  }

  // Try to get translation in requested language
  const translation = translationSet[language];
  if (translation) {
    return translation;
  }

  // Fallback to English
  const englishTranslation = translationSet.en;
  if (englishTranslation) {
    console.warn(`Translation for '${key}' not found in '${language}', falling back to English`);
    return englishTranslation;
  }

  // Ultimate fallback
  console.warn(`No translation found for '${key}' in any language`);
  return key;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): readonly SupportedLanguage[] {
  return SUPPORTED_LANGUAGES;
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
}

/**
 * Get all translations for a specific key
 */
export function getAllTranslations(key: string): Record<SupportedLanguage, string> | null {
  const translationSet = translations[key];
  if (!translationSet) {
    return null;
  }

  const result = {} as Record<SupportedLanguage, string>;
  
  for (const lang of SUPPORTED_LANGUAGES) {
    result[lang] = translationSet[lang] || translationSet.en || key;
  }

  return result;
}

/**
 * Add or update a translation
 */
export function setTranslation(key: string, language: SupportedLanguage, translation: string): void {
  if (!translations[key]) {
    translations[key] = {};
  }
  translations[key][language] = translation;
}

/**
 * Detect language from text content (simple implementation)
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Simple character-based detection
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali characters
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil characters
  if (/[\u1000-\u109F]/.test(text)) return 'my'; // Myanmar characters
  
  // Indonesian detection (Latin script, so harder to detect)
  const indonesianWords = ['saya', 'anda', 'adalah', 'dengan', 'untuk', 'tidak', 'yang'];
  const lowerText = text.toLowerCase();
  if (indonesianWords.some(word => lowerText.includes(word))) return 'id';
  
  // Default to English
  return 'en';
}

/**
 * Get language-specific formatting rules
 */
export function getLanguageFormatting(language: SupportedLanguage) {
  const formatRules = {
    en: { direction: 'ltr', script: 'latin' },
    zh: { direction: 'ltr', script: 'han' },
    bn: { direction: 'ltr', script: 'bengali' },
    ta: { direction: 'ltr', script: 'tamil' },
    my: { direction: 'ltr', script: 'myanmar' },
    id: { direction: 'ltr', script: 'latin' }
  };

  return formatRules[language];
}

export default {
  getTranslation,
  getSupportedLanguages,
  isLanguageSupported,
  getAllTranslations,
  setTranslation,
  detectLanguage,
  getLanguageFormatting,
  SUPPORTED_LANGUAGES
};
