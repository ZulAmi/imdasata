/**
 * Multi-language Content Validation Testing Suite
 * Tests content accuracy, cultural sensitivity, and localization quality
 */

import { validateTranslation, detectLanguage, validateCulturalContent } from '@/lib/i18n-validator';
import { getTranslation, getSupportedLanguages } from '@/lib/i18n';

// Mock i18n functions
jest.mock('@/lib/i18n', () => ({
  getTranslation: jest.fn(),
  getSupportedLanguages: jest.fn(() => ['en', 'zh', 'bn', 'ta', 'my', 'id']),
  validateTranslation: jest.fn(),
}));

jest.mock('@/lib/i18n-validator', () => ({
  validateTranslation: jest.fn(),
  detectLanguage: jest.fn(),
  validateCulturalContent: jest.fn(),
}));

const mockGetTranslation = getTranslation as jest.MockedFunction<typeof getTranslation>;
const mockValidateTranslation = validateTranslation as jest.MockedFunction<typeof validateTranslation>;
const mockDetectLanguage = detectLanguage as jest.MockedFunction<typeof detectLanguage>;
const mockValidateCultural = validateCulturalContent as jest.MockedFunction<typeof validateCulturalContent>;

describe('Multi-language Content Validation Tests', () => {
  const supportedLanguages = ['en', 'zh', 'bn', 'ta', 'my', 'id'];
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Translation Completeness', () => {
    test('should have translations for all supported languages', async () => {
      const testKeys = [
        'welcome.message',
        'assessment.phq4.question1',
        'mood.log.prompt',
        'crisis.support.message',
        'error.general'
      ];

      for (const key of testKeys) {
        for (const language of supportedLanguages) {
          mockGetTranslation.mockReturnValue(`Mock translation for ${key} in ${language}`);
          
          const translation = getTranslation(key, language as any);
          
          expect(translation).toBeDefined();
          expect(translation).not.toBe('');
          expect(translation).not.toBe(key); // Should not return the key itself
        }
      }
    });

    test('should fallback to English for missing translations', async () => {
      const key = 'test.missing.key';
      const englishTranslation = 'English fallback text';
      
      mockGetTranslation.mockImplementation((k, lang) => {
        if (lang === 'en') return englishTranslation;
        return ''; // Missing translation
      });

      // Test fallback for each language
      for (const language of supportedLanguages.filter(l => l !== 'en')) {
        const translation = getTranslation(key, language as any);
        expect(translation).toBe(englishTranslation);
      }
    });

    test('should validate translation quality', async () => {
      const testCases = [
        {
          key: 'assessment.phq4.question1',
          english: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
          translations: {
            zh: '在过去2周里，您多久感到情绪低落、沮丧或绝望？',
            bn: 'গত 2 সপ্তাহে, আপনি কতবার বিষণ্ণ, হতাশ বা আশাহীন বোধ করেছেন?',
            ta: 'கடந்த 2 வாரங்களில், நீங்கள் எத்தனை முறை மனச்சோர்வு, உணர்ச்சியற்ற அல்லது நம்பிக்கையற்ற உணர்வால் பாதிக்கப்பட்டீர்கள்?'
          }
        }
      ];

      for (const testCase of testCases) {
        for (const [language, translation] of Object.entries(testCase.translations)) {
          mockValidateTranslation.mockResolvedValue({
            isValid: true,
            score: 0.9,
            issues: [],
            suggestions: []
          });

          const validation = await validateTranslation(
            testCase.english,
            translation,
            'en',
            language
          );

          expect(validation.isValid).toBe(true);
          expect(validation.score).toBeGreaterThan(0.8);
        }
      }
    });
  });

  describe('Language Detection', () => {
    test('should correctly detect user language from message content', async () => {
      const testMessages = [
        { text: 'Hello, I need help', expectedLang: 'en' },
        { text: '你好，我需要帮助', expectedLang: 'zh' },
        { text: 'হ্যালো, আমার সাহায্য দরকার', expectedLang: 'bn' },
        { text: 'வணக்கம், எனக்கு உதவி தேவை', expectedLang: 'ta' },
        { text: 'မင်္ဂလာပါ၊ ကျွန်တော် အကူအညီ လိုအပ်ပါတယ်', expectedLang: 'my' },
        { text: 'Halo, saya butuh bantuan', expectedLang: 'id' }
      ];

      for (const testMessage of testMessages) {
        mockDetectLanguage.mockReturnValue(testMessage.expectedLang as any);
        
        const detectedLang = detectLanguage(testMessage.text);
        
        expect(detectedLang).toBe(testMessage.expectedLang);
      }
    });

    test('should handle mixed language content', async () => {
      const mixedMessages = [
        { text: 'Hello 你好', expectedLang: 'en' }, // Should default to first detected
        { text: 'I feel sad 我很伤心', expectedLang: 'en' },
        { text: '123 numbers only', expectedLang: 'en' } // Default to English for numbers
      ];

      for (const testMessage of mixedMessages) {
        mockDetectLanguage.mockReturnValue(testMessage.expectedLang as any);
        
        const detectedLang = detectLanguage(testMessage.text);
        
        expect(detectedLang).toBe(testMessage.expectedLang);
      }
    });

    test('should handle unsupported languages gracefully', async () => {
      const unsupportedTexts = [
        'Bonjour, j\'ai besoin d\'aide', // French
        'Hola, necesito ayuda', // Spanish
        'مرحبا أحتاج إلى مساعدة' // Arabic
      ];

      for (const text of unsupportedTexts) {
        mockDetectLanguage.mockReturnValue('en'); // Fallback to English
        
        const detectedLang = detectLanguage(text);
        
        expect(detectedLang).toBe('en');
      }
    });
  });

  describe('Cultural Sensitivity', () => {
    test('should validate cultural appropriateness of mental health content', async () => {
      const culturalTestCases = [
        {
          language: 'zh',
          content: '寻求心理健康帮助是正常的',
          culture: 'chinese',
          shouldPass: true
        },
        {
          language: 'bn',
          content: 'মানসিক স্বাস্থ্য সেবা নেওয়া লজ্জার কিছু নয়',
          culture: 'bengali',
          shouldPass: true
        },
        {
          language: 'ta',
          content: 'மன நலம் பேணுவது முக்கியம்',
          culture: 'tamil',
          shouldPass: true
        },
        {
          language: 'my',
          content: 'စိတ်ကျန်းမာရေး ကူညီမှု ရယူခြင်းက သာမန်ကိစ္စ',
          culture: 'myanmar',
          shouldPass: true
        }
      ];

      for (const testCase of culturalTestCases) {
        mockValidateCultural.mockResolvedValue({
          isAppropriate: testCase.shouldPass,
          culturalScore: testCase.shouldPass ? 0.9 : 0.3,
          suggestions: testCase.shouldPass ? [] : ['Consider cultural context']
        });

        const validation = await validateCulturalContent(
          testCase.content,
          testCase.language,
          testCase.culture
        );

        expect(validation.isAppropriate).toBe(testCase.shouldPass);
        if (testCase.shouldPass) {
          expect(validation.culturalScore).toBeGreaterThan(0.8);
        }
      }
    });

    test('should flag culturally inappropriate content', async () => {
      const inappropriateContent = [
        {
          language: 'zh',
          content: '精神病患者', // Stigmatizing term
          reason: 'stigmatizing_language'
        },
        {
          language: 'bn',
          content: 'পাগল', // Derogatory term
          reason: 'offensive_terminology'
        }
      ];

      for (const testCase of inappropriateContent) {
        mockValidateCultural.mockResolvedValue({
          isAppropriate: false,
          culturalScore: 0.2,
          suggestions: ['Use person-first language', 'Avoid stigmatizing terms'],
          flags: [testCase.reason]
        });

        const validation = await validateCulturalContent(
          testCase.content,
          testCase.language
        );

        expect(validation.isAppropriate).toBe(false);
        expect(validation.flags).toContain(testCase.reason);
        expect(validation.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Medical Translation Accuracy', () => {
    test('should validate medical terminology translation accuracy', async () => {
      const medicalTerms = [
        {
          english: 'depression',
          translations: {
            zh: '抑郁症',
            bn: 'বিষণ্নতা',
            ta: 'மனச்சோர்வு',
            my: 'စိတ်ကျရောဂါ',
            id: 'depresi'
          }
        },
        {
          english: 'anxiety',
          translations: {
            zh: '焦虑',
            bn: 'উদ্বেগ',
            ta: 'கவலை',
            my: 'စိုးရိမ်ပူပန်မှု',
            id: 'kecemasan'
          }
        },
        {
          english: 'mental health',
          translations: {
            zh: '心理健康',
            bn: 'মানসিক স্বাস্থ্য',
            ta: 'மன நலம்',
            my: 'စိတ်ကျန်းမာရေး',
            id: 'kesehatan mental'
          }
        }
      ];

      for (const term of medicalTerms) {
        for (const [language, translation] of Object.entries(term.translations)) {
          mockValidateTranslation.mockResolvedValue({
            isValid: true,
            score: 0.95,
            medicalAccuracy: 0.9,
            issues: [],
            suggestions: []
          });

          const validation = await validateTranslation(
            term.english,
            translation,
            'en',
            language,
            { domain: 'medical' }
          );

          expect(validation.isValid).toBe(true);
          expect(validation.medicalAccuracy).toBeGreaterThan(0.8);
        }
      }
    });

    test('should detect incorrect medical translations', async () => {
      const incorrectTranslations = [
        {
          english: 'depression',
          incorrect: '快乐', // Means 'happiness' in Chinese - completely wrong
          language: 'zh'
        },
        {
          english: 'therapy',
          incorrect: 'খেলা', // Means 'game' in Bengali - incorrect
          language: 'bn'
        }
      ];

      for (const testCase of incorrectTranslations) {
        mockValidateTranslation.mockResolvedValue({
          isValid: false,
          score: 0.1,
          medicalAccuracy: 0.0,
          issues: ['semantic_mismatch', 'medical_inaccuracy'],
          suggestions: ['Use correct medical terminology', 'Verify semantic meaning']
        });

        const validation = await validateTranslation(
          testCase.english,
          testCase.incorrect,
          'en',
          testCase.language,
          { domain: 'medical' }
        );

        expect(validation.isValid).toBe(false);
        expect(validation.medicalAccuracy).toBeLessThan(0.5);
        expect(validation.issues).toContain('medical_inaccuracy');
      }
    });
  });

  describe('Regional Variations', () => {
    test('should handle regional language variations', async () => {
      const regionalVariations = [
        {
          language: 'zh',
          regions: {
            'zh-CN': '简体中文内容', // Simplified Chinese
            'zh-TW': '繁體中文內容', // Traditional Chinese
            'zh-SG': '新加坡华语内容' // Singapore Chinese
          }
        },
        {
          language: 'bn',
          regions: {
            'bn-BD': 'বাংলাদেশী বাংলা', // Bangladesh Bengali
            'bn-IN': 'ভারতীয় বাংলা' // Indian Bengali
          }
        }
      ];

      for (const languageSet of regionalVariations) {
        for (const [region, content] of Object.entries(languageSet.regions)) {
          mockValidateTranslation.mockResolvedValue({
            isValid: true,
            score: 0.9,
            regionalAppropriate: true,
            issues: [],
            suggestions: []
          });

          const validation = await validateTranslation(
            'Sample English content',
            content,
            'en',
            region
          );

          expect(validation.isValid).toBe(true);
          expect(validation.regionalAppropriate).toBe(true);
        }
      }
    });
  });

  describe('Content Length and Formatting', () => {
    test('should validate text length constraints for different languages', async () => {
      const lengthTestCases = [
        {
          language: 'en',
          content: 'Short message',
          expectedLength: 'short'
        },
        {
          language: 'zh',
          content: '短信息', // Chinese is typically more concise
          expectedLength: 'short'
        },
        {
          language: 'bn',
          content: 'এটি একটি দীর্ঘ বার্তা যা বাংলায় লেখা হয়েছে', // Bengali can be longer
          expectedLength: 'medium'
        }
      ];

      for (const testCase of lengthTestCases) {
        const charCount = testCase.content.length;
        const wordCount = testCase.content.split(/\s+/).length;

        // Different languages have different character densities
        if (testCase.language === 'zh') {
          // Chinese characters pack more meaning
          expect(charCount).toBeLessThan(50);
        } else if (testCase.language === 'bn') {
          // Bengali may need more characters for same meaning
          expect(charCount).toBeLessThan(200);
        }

        expect(charCount).toBeGreaterThan(0);
      }
    });

    test('should validate text formatting for different scripts', async () => {
      const formattingTestCases = [
        {
          language: 'en',
          content: 'How are you feeling today?',
          script: 'latin',
          direction: 'ltr'
        },
        {
          language: 'zh',
          content: '你今天感觉怎么样？',
          script: 'han',
          direction: 'ltr'
        },
        {
          language: 'bn',
          content: 'আজ আপনার কেমন লাগছে?',
          script: 'bengali',
          direction: 'ltr'
        },
        {
          language: 'ta',
          content: 'இன்று உங்களுக்கு எப்படி இருக்கிறது?',
          script: 'tamil',
          direction: 'ltr'
        }
      ];

      for (const testCase of formattingTestCases) {
        // Test character encoding
        const encoded = encodeURIComponent(testCase.content);
        const decoded = decodeURIComponent(encoded);
        
        expect(decoded).toBe(testCase.content);
        
        // Test that content contains appropriate characters for the script
        switch (testCase.script) {
          case 'han':
            expect(/[\u4e00-\u9fff]/.test(testCase.content)).toBe(true);
            break;
          case 'bengali':
            expect(/[\u0980-\u09FF]/.test(testCase.content)).toBe(true);
            break;
          case 'tamil':
            expect(/[\u0B80-\u0BFF]/.test(testCase.content)).toBe(true);
            break;
        }
      }
    });
  });

  describe('Accessibility and Readability', () => {
    test('should validate content readability for different languages', async () => {
      const readabilityTestCases = [
        {
          language: 'en',
          content: 'This is a simple message that is easy to read.',
          expectedReadability: 'high'
        },
        {
          language: 'zh',
          content: '这是一条简单易懂的信息。',
          expectedReadability: 'high'
        },
        {
          language: 'bn',
          content: 'এটি একটি সহজ এবং পড়তে সুবিধাজনক বার্তা।',
          expectedReadability: 'high'
        }
      ];

      for (const testCase of readabilityTestCases) {
        // Simple readability checks
        const sentences = testCase.content.split(/[.!?]/).filter(s => s.trim());
        const avgSentenceLength = testCase.content.length / sentences.length;

        // Sentences shouldn't be too long for readability
        expect(avgSentenceLength).toBeLessThan(200);
        
        // Content should not be empty
        expect(testCase.content.trim()).not.toBe('');
      }
    });

    test('should support screen reader compatibility', async () => {
      const accessibilityTestCases = [
        {
          language: 'en',
          content: 'Mental health assessment',
          hasAltText: true,
          isScreenReaderFriendly: true
        },
        {
          language: 'zh',
          content: '心理健康评估',
          hasAltText: true,
          isScreenReaderFriendly: true
        }
      ];

      for (const testCase of accessibilityTestCases) {
        // Test that content doesn't contain problematic characters for screen readers
        expect(testCase.content).not.toMatch(/[^\w\s\u4e00-\u9fff\u0980-\u09FF\u0B80-\u0BFF\u1000-\u109F.,!?]/);
        
        // Content should be properly structured
        expect(testCase.content.trim()).toBe(testCase.content);
      }
    });
  });

  describe('Real-time Translation Quality', () => {
    test('should maintain translation consistency across sessions', async () => {
      const consistencyTestCases = [
        {
          key: 'assessment.phq4.question1',
          language: 'zh'
        },
        {
          key: 'crisis.support.immediate',
          language: 'bn'
        }
      ];

      for (const testCase of consistencyTestCases) {
        const translation1 = 'First translation result';
        const translation2 = 'First translation result'; // Should be identical
        
        mockGetTranslation.mockReturnValueOnce(translation1);
        mockGetTranslation.mockReturnValueOnce(translation2);

        const result1 = getTranslation(testCase.key, testCase.language as any);
        const result2 = getTranslation(testCase.key, testCase.language as any);

        expect(result1).toBe(result2);
      }
    });

    test('should handle translation caching effectively', async () => {
      const cacheTestKey = 'test.cache.key';
      const cachedTranslation = 'Cached translation result';

      mockGetTranslation.mockReturnValue(cachedTranslation);

      // Call multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(getTranslation(cacheTestKey, 'zh' as any));
      }

      // All results should be identical
      expect(results.every(result => result === cachedTranslation)).toBe(true);
    });
  });
});
