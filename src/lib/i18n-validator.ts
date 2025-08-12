/**
 * i18n Validator Library
 * Validates translation quality and cultural appropriateness
 */

import { SupportedLanguage } from './i18n';

export interface ValidationResult {
  isValid: boolean;
  score: number;
  medicalAccuracy?: number;
  regionalAppropriate?: boolean;
  issues: string[];
  suggestions: string[];
  flags?: string[];
}

export interface CulturalValidationResult {
  isAppropriate: boolean;
  culturalScore: number;
  suggestions: string[];
  flags?: string[];
}

/**
 * Validate translation quality between source and target text
 */
export async function validateTranslation(
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string,
  options?: { domain?: string }
): Promise<ValidationResult> {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 1.0;

  // Basic validation checks
  if (!targetText || targetText.trim() === '') {
    issues.push('empty_translation');
    score = 0;
  }

  if (targetText === sourceText) {
    issues.push('untranslated_text');
    score *= 0.5;
  }

  // Length validation (very basic)
  const lengthRatio = targetText.length / sourceText.length;
  if (lengthRatio < 0.3 || lengthRatio > 3.0) {
    issues.push('suspicious_length_ratio');
    score *= 0.8;
  }

  // Domain-specific validation
  let medicalAccuracy = 1.0;
  if (options?.domain === 'medical') {
    medicalAccuracy = await validateMedicalTerms(sourceText, targetText, sourceLang, targetLang);
    if (medicalAccuracy < 0.8) {
      issues.push('medical_inaccuracy');
    }
  }

  // Character encoding validation
  if (!isValidEncoding(targetText, targetLang)) {
    issues.push('encoding_issues');
    score *= 0.9;
  }

  // Add suggestions based on issues
  if (issues.includes('empty_translation')) {
    suggestions.push('Provide a translation for this text');
  }
  if (issues.includes('untranslated_text')) {
    suggestions.push('Translate the text instead of keeping it in the source language');
  }
  if (issues.includes('medical_inaccuracy')) {
    suggestions.push('Review medical terminology for accuracy');
  }

  return {
    isValid: score > 0.7,
    score,
    medicalAccuracy,
    issues,
    suggestions
  };
}

/**
 * Validate cultural appropriateness of content
 */
export async function validateCulturalContent(
  content: string,
  language: string,
  culture?: string
): Promise<CulturalValidationResult> {
  const suggestions: string[] = [];
  const flags: string[] = [];
  let culturalScore = 1.0;

  // Check for culturally inappropriate terms
  const inappropriateTerms = getCulturallyInappropriateTerms(language);
  const lowerContent = content.toLowerCase();

  for (const term of inappropriateTerms) {
    if (lowerContent.includes(term.term.toLowerCase())) {
      flags.push(term.reason);
      culturalScore -= term.severity;
      suggestions.push(term.suggestion);
    }
  }

  // Check for stigmatizing language
  const stigmatizingTerms = getStigmatizingTerms(language);
  for (const term of stigmatizingTerms) {
    if (lowerContent.includes(term.term.toLowerCase())) {
      flags.push('stigmatizing_language');
      culturalScore -= 0.3;
      suggestions.push('Use person-first language');
    }
  }

  // Ensure minimum score
  culturalScore = Math.max(0, culturalScore);

  return {
    isAppropriate: culturalScore > 0.7 && flags.length === 0,
    culturalScore,
    suggestions,
    flags
  };
}

/**
 * Detect language from text content
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Simple character-based detection
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali characters
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil characters
  if (/[\u1000-\u109F]/.test(text)) return 'my'; // Myanmar characters
  
  // Indonesian detection (Latin script)
  const indonesianWords = ['saya', 'anda', 'adalah', 'dengan', 'untuk', 'tidak', 'yang'];
  const lowerText = text.toLowerCase();
  if (indonesianWords.some(word => lowerText.includes(word))) return 'id';
  
  // Default to English
  return 'en';
}

/**
 * Validate medical terminology accuracy
 */
async function validateMedicalTerms(
  sourceText: string,
  targetText: string,
  sourceLang: string,
  targetLang: string
): Promise<number> {
  // In a real implementation, this would use medical dictionaries and term validation
  const medicalTerms = {
    depression: {
      zh: ['抑郁症', '抑郁'],
      bn: ['বিষণ্নতা'],
      ta: ['மனச்சோர்வு'],
      my: ['စိတ်ကျရောဂါ'],
      id: ['depresi']
    },
    anxiety: {
      zh: ['焦虑'],
      bn: ['উদ্বেগ'],
      ta: ['கவலை'],
      my: ['စိုးရိမ်ပူပန်မှု'],
      id: ['kecemasan']
    }
  };

  let accuracy = 1.0;

  // Check if medical terms are properly translated
  for (const [englishTerm, translations] of Object.entries(medicalTerms)) {
    if (sourceText.toLowerCase().includes(englishTerm)) {
      const targetTranslations = translations[targetLang as keyof typeof translations] || [];
      const hasCorrectTranslation = targetTranslations.some(translation =>
        targetText.toLowerCase().includes(translation.toLowerCase())
      );

      if (!hasCorrectTranslation) {
        accuracy -= 0.2;
      }
    }
  }

  return Math.max(0, accuracy);
}

/**
 * Check if text has valid character encoding for the language
 */
function isValidEncoding(text: string, language: string): boolean {
  try {
    // Test if the text can be properly encoded and decoded
    const encoded = encodeURIComponent(text);
    const decoded = decodeURIComponent(encoded);
    
    if (decoded !== text) {
      return false;
    }

    // Language-specific character checks
    switch (language) {
      case 'zh':
        // Should contain Chinese characters if it's Chinese text
        return /[\u4e00-\u9fff]/.test(text) || /^[a-zA-Z0-9\s.,!?]*$/.test(text);
      case 'bn':
        // Should contain Bengali characters if it's Bengali text
        return /[\u0980-\u09FF]/.test(text) || /^[a-zA-Z0-9\s.,!?]*$/.test(text);
      case 'ta':
        // Should contain Tamil characters if it's Tamil text
        return /[\u0B80-\u0BFF]/.test(text) || /^[a-zA-Z0-9\s.,!?]*$/.test(text);
      case 'my':
        // Should contain Myanmar characters if it's Myanmar text
        return /[\u1000-\u109F]/.test(text) || /^[a-zA-Z0-9\s.,!?]*$/.test(text);
      default:
        return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get culturally inappropriate terms for a language
 */
function getCulturallyInappropriateTerms(language: string) {
  const terms = {
    zh: [
      { term: '精神病患者', reason: 'stigmatizing_language', severity: 0.5, suggestion: '使用"有心理健康问题的人"' },
      { term: '疯子', reason: 'offensive_terminology', severity: 0.8, suggestion: '避免使用贬低性词汇' }
    ],
    bn: [
      { term: 'পাগল', reason: 'offensive_terminology', severity: 0.8, suggestion: 'অপমানজনক শব্দ এড়িয়ে চলুন' },
      { term: 'মানসিক রোগী', reason: 'stigmatizing_language', severity: 0.5, suggestion: '"মানসিক স্বাস্থ্য সমস্যায় আক্রান্ত ব্যক্তি" ব্যবহার করুন' }
    ],
    en: [
      { term: 'crazy', reason: 'stigmatizing_language', severity: 0.6, suggestion: 'Use person-first language' },
      { term: 'mental patient', reason: 'stigmatizing_language', severity: 0.5, suggestion: 'Use "person with mental health condition"' }
    ]
  };

  return terms[language as keyof typeof terms] || terms.en;
}

/**
 * Get stigmatizing terms for mental health
 */
function getStigmatizingTerms(language: string) {
  const terms = {
    en: [
      { term: 'lunatic', severity: 0.8 },
      { term: 'psycho', severity: 0.7 },
      { term: 'nuts', severity: 0.5 },
      { term: 'insane', severity: 0.6 }
    ],
    zh: [
      { term: '疯癫', severity: 0.7 },
      { term: '神经病', severity: 0.6 }
    ],
    bn: [
      { term: 'খিচুড়ি', severity: 0.6 },
      { term: 'বাতিক', severity: 0.5 }
    ]
  };

  return terms[language as keyof typeof terms] || terms.en;
}
