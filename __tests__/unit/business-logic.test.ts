/**
 * Unit tests for business logic functions
 * Testing core mental health assessment, mood logging, and gamification logic
 */

import { 
  calculatePHQ4Severity, 
  validateMoodScore, 
  calculateSentiment,
  calculateGamificationPoints,
  determineRiskLevel,
  validateLanguageContent 
} from '@/lib/business-logic';

describe('Business Logic Functions', () => {
  describe('PHQ-4 Assessment Logic', () => {
    test('calculatePHQ4Severity should return correct severity levels', () => {
      expect(calculatePHQ4Severity(0, 0)).toBe('minimal');
      expect(calculatePHQ4Severity(2, 1)).toBe('minimal');
      expect(calculatePHQ4Severity(3, 3)).toBe('mild');
      expect(calculatePHQ4Severity(5, 4)).toBe('moderate');
      expect(calculatePHQ4Severity(6, 6)).toBe('severe');
      expect(calculatePHQ4Severity(3, 2)).toBe('mild');
    });

    test('calculatePHQ4Severity should handle edge cases', () => {
      expect(calculatePHQ4Severity(-1, 0)).toBe('minimal');
      expect(calculatePHQ4Severity(10, 10)).toBe('severe');
      expect(calculatePHQ4Severity(null, undefined)).toBe('minimal');
    });

    test('calculatePHQ4Severity should validate input types', () => {
      expect(() => calculatePHQ4Severity('invalid' as any, 5)).toThrow();
      expect(() => calculatePHQ4Severity(5, 'invalid' as any)).toThrow();
    });
  });

  describe('Mood Score Validation', () => {
    test('validateMoodScore should accept valid scores', () => {
      for (let i = 1; i <= 10; i++) {
        expect(validateMoodScore(i)).toBe(true);
      }
    });

    test('validateMoodScore should reject invalid scores', () => {
      expect(validateMoodScore(0)).toBe(false);
      expect(validateMoodScore(11)).toBe(false);
      expect(validateMoodScore(-1)).toBe(false);
      expect(validateMoodScore(5.5)).toBe(false);
      expect(validateMoodScore('5')).toBe(false);
      expect(validateMoodScore(null)).toBe(false);
      expect(validateMoodScore(undefined)).toBe(false);
    });
  });

  describe('Sentiment Analysis', () => {
    test('calculateSentiment should analyze positive text correctly', () => {
      const positiveTexts = [
        'I feel great today!',
        'Life is wonderful and I am happy',
        'Feeling blessed and grateful',
        'Amazing day with friends'
      ];

      positiveTexts.forEach(text => {
        const sentiment = calculateSentiment(text);
        expect(sentiment.score).toBeGreaterThan(0);
        expect(sentiment.label).toBe('positive');
      });
    });

    test('calculateSentiment should analyze negative text correctly', () => {
      const negativeTexts = [
        'I feel terrible today',
        'Everything is going wrong',
        'I hate this situation',
        'Feeling very sad and hopeless'
      ];

      negativeTexts.forEach(text => {
        const sentiment = calculateSentiment(text);
        expect(sentiment.score).toBeLessThan(0);
        expect(sentiment.label).toBe('negative');
      });
    });

    test('calculateSentiment should handle neutral text', () => {
      const neutralTexts = [
        'The weather is okay',
        'I went to the store',
        'Meeting at 3 PM',
        'Regular day at work'
      ];

      neutralTexts.forEach(text => {
        const sentiment = calculateSentiment(text);
        expect(Math.abs(sentiment.score)).toBeLessThan(0.3);
        expect(sentiment.label).toBe('neutral');
      });
    });

    test('calculateSentiment should handle empty or invalid input', () => {
      expect(calculateSentiment('')).toEqual({ score: 0, label: 'neutral' });
      expect(calculateSentiment(null)).toEqual({ score: 0, label: 'neutral' });
      expect(calculateSentiment(undefined)).toEqual({ score: 0, label: 'neutral' });
    });
  });

  describe('Gamification Points Calculation', () => {
    test('calculateGamificationPoints should calculate mood logging points', () => {
      expect(calculateGamificationPoints('mood_log', { moodScore: 8 })).toBe(5);
      expect(calculateGamificationPoints('mood_log', { moodScore: 3 })).toBe(5);
      expect(calculateGamificationPoints('mood_log', { consecutive: true })).toBe(10);
    });

    test('calculateGamificationPoints should calculate assessment points', () => {
      expect(calculateGamificationPoints('phq4_assessment', { completed: true })).toBe(20);
      expect(calculateGamificationPoints('phq4_assessment', { completed: false })).toBe(0);
      expect(calculateGamificationPoints('phq4_assessment', { firstTime: true })).toBe(50);
    });

    test('calculateGamificationPoints should calculate resource engagement points', () => {
      expect(calculateGamificationPoints('resource_view', {})).toBe(2);
      expect(calculateGamificationPoints('resource_contact', {})).toBe(15);
      expect(calculateGamificationPoints('resource_share', {})).toBe(10);
    });

    test('calculateGamificationPoints should handle milestone bonuses', () => {
      expect(calculateGamificationPoints('streak_milestone', { days: 7 })).toBe(100);
      expect(calculateGamificationPoints('streak_milestone', { days: 30 })).toBe(500);
      expect(calculateGamificationPoints('assessment_milestone', { count: 10 })).toBe(300);
    });

    test('calculateGamificationPoints should handle invalid input', () => {
      expect(calculateGamificationPoints('invalid_action', {})).toBe(0);
      expect(calculateGamificationPoints(null, {})).toBe(0);
      expect(calculateGamificationPoints('mood_log', null)).toBe(0);
    });
  });

  describe('Risk Level Determination', () => {
    test('determineRiskLevel should assess crisis keywords', () => {
      const crisisTexts = [
        'I want to hurt myself',
        'thinking about suicide',
        'I want to die',
        'life is not worth living'
      ];

      crisisTexts.forEach(text => {
        expect(determineRiskLevel(text)).toBe('critical');
      });
    });

    test('determineRiskLevel should assess high-risk indicators', () => {
      const highRiskTexts = [
        'I feel hopeless every day',
        'Nothing will ever get better',
        'I can\'t handle this anymore',
        'Everyone would be better without me'
      ];

      highRiskTexts.forEach(text => {
        expect(determineRiskLevel(text)).toBe('high');
      });
    });

    test('determineRiskLevel should assess medium-risk indicators', () => {
      const mediumRiskTexts = [
        'I\'ve been feeling very sad lately',
        'Having trouble sleeping and eating',
        'Feeling anxious most of the time',
        'Struggling with daily activities'
      ];

      mediumRiskTexts.forEach(text => {
        expect(determineRiskLevel(text)).toBe('medium');
      });
    });

    test('determineRiskLevel should assess low-risk content', () => {
      const lowRiskTexts = [
        'Had a good day today',
        'Feeling okay, some ups and downs',
        'Managing well with support',
        'Making progress in therapy'
      ];

      lowRiskTexts.forEach(text => {
        expect(determineRiskLevel(text)).toBe('low');
      });
    });

    test('determineRiskLevel should handle multilingual content', () => {
      expect(determineRiskLevel('我想死', 'zh')).toBe('critical');
      expect(determineRiskLevel('আমি আত্মহত্যা করতে চাই', 'bn')).toBe('critical');
      expect(determineRiskLevel('நான் இறக்க விரும்புகிறேன்', 'ta')).toBe('critical');
    });
  });

  describe('Language Content Validation', () => {
    test('validateLanguageContent should validate supported languages', () => {
      const supportedLanguages = ['en', 'zh', 'bn', 'ta', 'my', 'id'];
      
      supportedLanguages.forEach(lang => {
        expect(validateLanguageContent('Hello world', lang)).toBe(true);
      });
    });

    test('validateLanguageContent should reject unsupported languages', () => {
      expect(validateLanguageContent('Hello world', 'fr')).toBe(false);
      expect(validateLanguageContent('Hello world', 'de')).toBe(false);
      expect(validateLanguageContent('Hello world', 'invalid')).toBe(false);
    });

    test('validateLanguageContent should validate content length', () => {
      const shortContent = 'Hi';
      const normalContent = 'This is a normal length message for mental health support';
      const longContent = 'A'.repeat(5000);

      expect(validateLanguageContent(shortContent, 'en')).toBe(true);
      expect(validateLanguageContent(normalContent, 'en')).toBe(true);
      expect(validateLanguageContent(longContent, 'en')).toBe(false);
    });

    test('validateLanguageContent should handle special characters and emojis', () => {
      expect(validateLanguageContent('Feeling good 😊', 'en')).toBe(true);
      expect(validateLanguageContent('心情很好 ❤️', 'zh')).toBe(true);
      expect(validateLanguageContent('খুব ভালো লাগছে 🌟', 'bn')).toBe(true);
    });

    test('validateLanguageContent should detect inappropriate content', () => {
      const inappropriateContent = [
        'spam message with lots of links',
        'promotional content selling products',
        'irrelevant commercial content'
      ];

      inappropriateContent.forEach(content => {
        expect(validateLanguageContent(content, 'en')).toBe(false);
      });
    });
  });
});
