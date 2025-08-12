/**
 * WhatsApp Bot Conversation Flow Testing Suite
 * Tests message routing, crisis detection, and conversation flows
 */

import { WhatsAppBot } from '@/lib/whatsapp-bot';
import { MessageContext, ConversationState } from '@/types/whatsapp';

// Mock WhatsApp SDK
jest.mock('@/lib/whatsapp-sdk', () => ({
  sendMessage: jest.fn(),
  sendTemplate: jest.fn(),
  markAsRead: jest.fn(),
}));

// Mock business logic functions
jest.mock('@/lib/business-logic', () => ({
  calculatePHQ4Severity: jest.fn(() => 'moderate'),
  calculateSentiment: jest.fn(() => ({ score: 0.5, label: 'neutral' })),
}));

describe('WhatsApp Bot Conversation Flow Tests', () => {
  let bot: WhatsAppBot;

  beforeEach(() => {
    bot = new WhatsAppBot();
    jest.clearAllMocks();
  });

  describe('Message Routing', () => {
    test('should route greeting messages to welcome flow', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'Hello',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('welcome');
      expect(response.messages).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining('Welcome')
        })
      );
    });

    test('should route assessment requests to PHQ-4 flow', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I want to take an assessment',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('assessment');
      expect(response.nextState).toBe(ConversationState.PHQ4_QUESTION_1);
    });

    test('should route mood logging requests to mood flow', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I want to log my mood',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('mood_log');
      expect(response.nextState).toBe(ConversationState.MOOD_ENTRY);
    });

    test('should route resource requests to resources flow', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I need help finding resources',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('resources');
      expect(response.resources).toBeDefined();
      expect(Array.isArray(response.resources)).toBe(true);
    });

    test('should handle unknown messages with helpful suggestions', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'xyz random message',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('help');
      expect(response.messages).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining('help')
        })
      );
    });
  });

  describe('Crisis Detection', () => {
    test('should detect crisis keywords and provide immediate support', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I want to hurt myself',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('crisis');
      expect(response.priority).toBe('urgent');
      expect(response.messages).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining('help')
        })
      );
      expect(response.emergencyContacts).toBeDefined();
    });

    test('should escalate severe crisis situations', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I am going to kill myself tonight',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('crisis');
      expect(response.escalate).toBe(true);
      expect(response.emergencyContacts).toBeDefined();
      expect(response.emergencyContacts!.length).toBeGreaterThan(0);
    });

    test('should handle crisis detection in multiple languages', async () => {
      const contexts = [
        {
          phoneNumber: '+1234567890',
          message: '我想自杀', // Chinese
          messageType: 'text' as const,
          timestamp: new Date(),
          language: 'zh'
        },
        {
          phoneNumber: '+1234567891',
          message: 'আমি আত্মহত্যা করতে চাই', // Bengali
          messageType: 'text' as const,
          timestamp: new Date(),
          language: 'bn'
        }
      ];

      for (const context of contexts) {
        const response = await bot.handleMessage(context);
        
        expect(response.type).toBe('crisis');
        expect(response.messages[0].language).toBe(context.language);
      }
    });

    test('should not trigger false positives for similar words', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I killed it at work today', // Positive use of "killed"
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).not.toBe('crisis');
    });
  });

  describe('PHQ-4 Assessment Flow', () => {
    test('should guide user through PHQ-4 questions', async () => {
      const bot = new WhatsAppBot();
      
      // Start assessment
      let context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'start assessment',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      let response = await bot.handleMessage(context);
      expect(response.nextState).toBe(ConversationState.PHQ4_QUESTION_1);

      // Answer questions
      for (let i = 1; i <= 4; i++) {
        context = {
          phoneNumber: '+1234567890',
          message: '2', // Score of 2
          messageType: 'text',
          timestamp: new Date(),
          language: 'en',
          conversationState: response.nextState
        };

        response = await bot.handleMessage(context);

        if (i < 4) {
          expect(response.nextState).toBe(`PHQ4_QUESTION_${i + 1}` as ConversationState);
        } else {
          expect(response.type).toBe('assessment_complete');
          expect(response.results).toBeDefined();
        }
      }
    });

    test('should validate PHQ-4 answer scores', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: '5', // Invalid score (max is 3)
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.PHQ4_QUESTION_1
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('validation_error');
      expect(response.messages[0].text).toContain('0 and 3');
    });

    test('should provide appropriate follow-up based on scores', async () => {
      // High score scenario
      const highScoreContext: MessageContext = {
        phoneNumber: '+1234567890',
        message: '3', // High score
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.PHQ4_QUESTION_4,
        assessmentData: {
          question1: 3,
          question2: 3,
          question3: 3
        }
      };

      const response = await bot.handleMessage(highScoreContext);

      expect(response.followUp).toBe('high_severity');
      expect(response.results?.recommendations).toBeDefined();
    });
  });

  describe('Mood Logging Flow', () => {
    test('should collect mood score and emotions', async () => {
      let context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'log mood',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      let response = await bot.handleMessage(context);
      expect(response.nextState).toBe(ConversationState.MOOD_ENTRY);

      // Enter mood score
      context = {
        phoneNumber: '+1234567890',
        message: '7',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.MOOD_ENTRY
      };

      response = await bot.handleMessage(context);
      expect(response.nextState).toBe(ConversationState.EMOTION_SELECTION);

      // Select emotions
      context = {
        phoneNumber: '+1234567890',
        message: 'happy,calm',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.EMOTION_SELECTION
      };

      response = await bot.handleMessage(context);
      expect(response.type).toBe('mood_logged');
      expect(response.moodData).toMatchObject({
        score: 7,
        emotions: ['happy', 'calm']
      });
    });

    test('should validate mood scores', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: '15', // Invalid score (max is 10)
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.MOOD_ENTRY
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('validation_error');
      expect(response.messages[0].text).toContain('1 and 10');
    });

    test('should handle optional notes and triggers', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'Had a great workout today',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.MOOD_NOTES,
        moodData: {
          score: 8,
          emotions: ['happy', 'energetic']
        }
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('mood_logged');
      expect(response.moodData?.notes).toBe('Had a great workout today');
    });
  });

  describe('Resource Recommendations', () => {
    test('should provide personalized resource recommendations', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'I need help',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('resources');
      expect(response.resources).toBeDefined();
      expect(Array.isArray(response.resources)).toBe(true);
      if (response.resources && response.resources.length > 0) {
        expect(response.resources[0].relevanceScore).toBeGreaterThan(0);
      }
    });

    test('should filter resources by user language', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: '我需要帮助', // Chinese
        messageType: 'text',
        timestamp: new Date(),
        language: 'zh'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('resources');
      expect(response.resources).toBeDefined();
      // All resources should support Chinese or be universal
      response.resources?.forEach((resource: any) => {
        expect(
          resource.languages?.includes('zh') || 
          resource.languages?.includes('universal')
        ).toBe(true);
      });
    });
  });

  describe('Multi-language Support', () => {
    test('should respond in user preferred language', async () => {
      const languages = [
        { code: 'en', message: 'Hello', expectedResponse: /Hello|Welcome/i },
        { code: 'zh', message: '你好', expectedResponse: /你好|欢迎/i },
        { code: 'bn', message: 'হ্যালো', expectedResponse: /হ্যালো|স্বাগতম/i },
        { code: 'ta', message: 'வணக்கம்', expectedResponse: /வணக்கம்|வரவேற்கிறோம்/i },
        { code: 'my', message: 'မင်္ဂလာပါ', expectedResponse: /မင်္ဂလာပါ|ကြိုဆိုပါတယ်/i },
        { code: 'id', message: 'Halo', expectedResponse: /Halo|Selamat/i }
      ];

      for (const lang of languages) {
        const context: MessageContext = {
          phoneNumber: '+1234567890',
          message: lang.message,
          messageType: 'text',
          timestamp: new Date(),
          language: lang.code
        };

        const response = await bot.handleMessage(context);

        expect(response.messages[0].text).toMatch(lang.expectedResponse);
        expect(response.messages[0].language).toBe(lang.code);
      }
    });

    test('should detect language from message content when not specified', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: '我感到很沮丧', // Chinese: "I feel very depressed"
        messageType: 'text',
        timestamp: new Date()
        // language not specified
      };

      const response = await bot.handleMessage(context);

      expect(response.detectedLanguage).toBe('zh');
      expect(response.messages[0].language).toBe('zh');
    });
  });

  describe('Conversation State Management', () => {
    test('should maintain conversation context across messages', async () => {
      const phoneNumber = '+1234567890';

      // Start a conversation
      let context: MessageContext = {
        phoneNumber,
        message: 'start assessment',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      let response = await bot.handleMessage(context);
      const firstState = response.nextState;

      // Continue conversation
      context = {
        phoneNumber,
        message: '2',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      response = await bot.handleMessage(context);

      // State should have progressed
      expect(response.previousState).toBe(firstState);
      expect(response.nextState).not.toBe(firstState);
    });

    test('should handle conversation timeouts', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: '2',
        messageType: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        language: 'en',
        conversationState: ConversationState.PHQ4_QUESTION_2
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('session_expired');
      expect(response.nextState).toBe(ConversationState.IDLE);
    });

    test('should reset conversation state on explicit reset command', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'reset',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en',
        conversationState: ConversationState.PHQ4_QUESTION_3
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('reset');
      expect(response.nextState).toBe(ConversationState.IDLE);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock a network error
      const { sendMessage } = require('@/lib/whatsapp-sdk');
      sendMessage.mockRejectedValue(new Error('Network error'));

      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'Hello',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('error');
      expect(response.error).toBe('message_send_failed');
    });

    test('should handle malformed messages', async () => {
      const context: MessageContext = {
        phoneNumber: '',
        message: '',
        messageType: 'text',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('error');
      expect(response.error).toBe('invalid_message');
    });

    test('should handle unsupported message types', async () => {
      const context: MessageContext = {
        phoneNumber: '+1234567890',
        message: 'media content',
        messageType: 'video',
        timestamp: new Date(),
        language: 'en'
      };

      const response = await bot.handleMessage(context);

      expect(response.type).toBe('unsupported_media');
      expect(response.messages[0].text).toContain('text messages');
    });
  });
});
