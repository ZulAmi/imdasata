/**
 * WhatsApp Bot Implementation
 * Handles conversation flows and message routing
 */

import { MessageContext, ConversationState, BotResponse, BotMessage } from '@/types/whatsapp';
import { calculatePHQ4Severity } from '@/lib/business-logic';

export class WhatsAppBot {
  private conversationStates: Map<string, ConversationState> = new Map();
  private conversationData: Map<string, any> = new Map();

  async handleMessage(context: MessageContext): Promise<BotResponse> {
    try {
      // Validate message
      if (!context.phoneNumber || !context.message) {
        return this.createErrorResponse('invalid_message');
      }

      // Get current conversation state
      const currentState = context.conversationState || 
        this.conversationStates.get(context.phoneNumber) || 
        ConversationState.IDLE;

      // Detect language if not provided
      const language = context.language || this.detectLanguage(context.message);

      // Handle different message types
      if (context.messageType !== 'text') {
        return this.handleUnsupportedMedia(language);
      }

      // Check for reset command
      if (context.message.toLowerCase().includes('reset')) {
        return this.handleReset(context.phoneNumber, language);
      }

      // Check for session timeout
      if (this.isSessionExpired(context.phoneNumber)) {
        return this.handleSessionExpired(context.phoneNumber, language);
      }

      // Crisis detection
      if (this.detectCrisis(context.message, language)) {
        return this.handleCrisis(context, language);
      }

      // Route based on state and message content
      return this.routeMessage(context, currentState, language);

    } catch (error) {
      console.error('WhatsApp bot error:', error);
      return this.createErrorResponse('message_send_failed');
    }
  }

  private routeMessage(context: MessageContext, state: ConversationState, language: string): BotResponse {
    const message = context.message.toLowerCase();

    // Handle state-specific flows
    switch (state) {
      case ConversationState.PHQ4_QUESTION_1:
      case ConversationState.PHQ4_QUESTION_2:
      case ConversationState.PHQ4_QUESTION_3:
      case ConversationState.PHQ4_QUESTION_4:
        return this.handlePHQ4Flow(context, state, language);

      case ConversationState.MOOD_ENTRY:
        return this.handleMoodEntry(context, language);

      case ConversationState.EMOTION_SELECTION:
        return this.handleEmotionSelection(context, language);

      case ConversationState.MOOD_NOTES:
        return this.handleMoodNotes(context, language);

      default:
        // Handle initial message routing
        if (this.isGreeting(message)) {
          return this.handleWelcome(context.phoneNumber, language);
        } else if (this.isAssessmentRequest(message)) {
          return this.startAssessment(context.phoneNumber, language);
        } else if (this.isMoodRequest(message)) {
          return this.startMoodLog(context.phoneNumber, language);
        } else if (this.isResourceRequest(message)) {
          return this.handleResourceRequest(context, language);
        } else {
          return this.handleHelp(language);
        }
    }
  }

  private handleWelcome(phoneNumber: string, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.WELCOME);

    const welcomeMessages: Record<string, string> = {
      en: 'Welcome to SATA Mental Wellness Assistant! How can I help you today?',
      zh: '欢迎使用SATA心理健康助手！今天我可以为您做些什么？',
      bn: 'SATA মানসিক সুস্থতা সহায়কে স্বাগতম! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      ta: 'SATA மன நல்வாழ்வு உதவியாளருக்கு வரவேற்கிறோம்! இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
      my: 'SATA စိတ်ကျန်းမာရေး လက်ထောက်သို့ ကြိုဆိုပါတယ်! ဒီနေ့ ကျွန်တော် ဘယ်လို ကူညီပေးနိုင်မလဲ?',
      id: 'Selamat datang di Asisten Kesehatan Mental SATA! Bagaimana saya bisa membantu Anda hari ini?'
    };

    return {
      type: 'welcome',
      messages: [{
        text: welcomeMessages[language] || welcomeMessages.en,
        language
      }],
      nextState: ConversationState.WELCOME
    };
  }

  private startAssessment(phoneNumber: string, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.PHQ4_QUESTION_1);
    this.conversationData.set(phoneNumber, { answers: [] });

    const questions: Record<string, string> = {
      en: 'Let\'s start the PHQ-4 assessment. Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless? (0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day)',
      zh: '让我们开始PHQ-4评估。在过去2周里，您多久感到情绪低落、沮丧或绝望？（0=完全没有，1=几天，2=超过一半的天数，3=几乎每天）',
      bn: 'চলুন PHQ-4 মূল্যায়ন শুরু করি। গত 2 সপ্তাহে, আপনি কতবার বিষণ্ণ, হতাশ বা আশাহীন বোধ করেছেন? (0=মোটেও না, 1=কয়েকদিন, 2=অর্ধেকেরও বেশি দিন, 3=প্রায় প্রতিদিন)'
    };

    return {
      type: 'assessment',
      messages: [{
        text: questions[language] || questions.en,
        language
      }],
      nextState: ConversationState.PHQ4_QUESTION_1
    };
  }

  private handlePHQ4Flow(context: MessageContext, state: ConversationState, language: string): BotResponse {
    const score = parseInt(context.message);

    // Validate score
    if (isNaN(score) || score < 0 || score > 3) {
      return {
        type: 'validation_error',
        messages: [{
          text: 'Please enter a number between 0 and 3.',
          language
        }],
        nextState: state
      };
    }

    // Store answer
    const data = this.conversationData.get(context.phoneNumber) || { answers: [] };
    data.answers.push(score);
    this.conversationData.set(context.phoneNumber, data);

    // Move to next question or complete assessment
    const questionMap: Record<ConversationState, ConversationState | null> = {
      [ConversationState.PHQ4_QUESTION_1]: ConversationState.PHQ4_QUESTION_2,
      [ConversationState.PHQ4_QUESTION_2]: ConversationState.PHQ4_QUESTION_3,
      [ConversationState.PHQ4_QUESTION_3]: ConversationState.PHQ4_QUESTION_4,
      [ConversationState.PHQ4_QUESTION_4]: null,
      [ConversationState.IDLE]: null,
      [ConversationState.WELCOME]: null,
      [ConversationState.MOOD_ENTRY]: null,
      [ConversationState.EMOTION_SELECTION]: null,
      [ConversationState.MOOD_NOTES]: null,
      [ConversationState.RESOURCE_SELECTION]: null,
      [ConversationState.CRISIS_SUPPORT]: null
    };

    const nextState = questionMap[state];

    if (nextState) {
      this.conversationStates.set(context.phoneNumber, nextState);
      
      const questions: Record<ConversationState, string> = {
        [ConversationState.PHQ4_QUESTION_2]: 'Question 2: How often have you had little interest or pleasure in doing things?',
        [ConversationState.PHQ4_QUESTION_3]: 'Question 3: How often have you felt nervous, anxious, or on edge?',
        [ConversationState.PHQ4_QUESTION_4]: 'Question 4: How often have you not been able to stop or control worrying?',
        [ConversationState.PHQ4_QUESTION_1]: '',
        [ConversationState.IDLE]: '',
        [ConversationState.WELCOME]: '',
        [ConversationState.MOOD_ENTRY]: '',
        [ConversationState.EMOTION_SELECTION]: '',
        [ConversationState.MOOD_NOTES]: '',
        [ConversationState.RESOURCE_SELECTION]: '',
        [ConversationState.CRISIS_SUPPORT]: ''
      };

      return {
        type: 'assessment',
        messages: [{
          text: questions[nextState],
          language
        }],
        nextState,
        previousState: state
      };
    } else {
      // Complete assessment
      return this.completeAssessment(context.phoneNumber, data.answers, language);
    }
  }

  private completeAssessment(phoneNumber: string, answers: number[], language: string): BotResponse {
    const depressionScore = answers[0] + answers[1];
    const anxietyScore = answers[2] + answers[3];
    const totalScore = depressionScore + anxietyScore;
    const severityLevel = calculatePHQ4Severity(depressionScore, anxietyScore);

    this.conversationStates.set(phoneNumber, ConversationState.IDLE);
    this.conversationData.delete(phoneNumber);

    const followUp = totalScore >= 6 ? 'high_severity' : 'normal';

    return {
      type: 'assessment_complete',
      messages: [{
        text: `Assessment complete. Your total score is ${totalScore}. Severity level: ${severityLevel}`,
        language
      }],
      results: {
        totalScore,
        depressionScore,
        anxietyScore,
        severityLevel,
        recommendations: this.getRecommendations(severityLevel)
      },
      followUp,
      nextState: ConversationState.IDLE
    };
  }

  private startMoodLog(phoneNumber: string, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.MOOD_ENTRY);

    return {
      type: 'mood_log',
      messages: [{
        text: 'How are you feeling today on a scale of 1-10? (1=Very sad, 10=Very happy)',
        language
      }],
      nextState: ConversationState.MOOD_ENTRY
    };
  }

  private handleMoodEntry(context: MessageContext, language: string): BotResponse {
    const score = parseInt(context.message);

    if (isNaN(score) || score < 1 || score > 10) {
      return {
        type: 'validation_error',
        messages: [{
          text: 'Please enter a number between 1 and 10.',
          language
        }],
        nextState: ConversationState.MOOD_ENTRY
      };
    }

    this.conversationData.set(context.phoneNumber, { moodScore: score });
    this.conversationStates.set(context.phoneNumber, ConversationState.EMOTION_SELECTION);

    return {
      type: 'mood_log',
      messages: [{
        text: 'What emotions are you feeling? (e.g., happy, sad, anxious, calm - separate with commas)',
        language
      }],
      nextState: ConversationState.EMOTION_SELECTION
    };
  }

  private handleEmotionSelection(context: MessageContext, language: string): BotResponse {
    const emotions = context.message.split(',').map(e => e.trim().toLowerCase());
    const data = this.conversationData.get(context.phoneNumber) || {};
    data.emotions = emotions;

    return this.completeMoodLog(context.phoneNumber, data, language);
  }

  private handleMoodNotes(context: MessageContext, language: string): BotResponse {
    const data = this.conversationData.get(context.phoneNumber) || {};
    data.notes = context.message;

    return this.completeMoodLog(context.phoneNumber, data, language);
  }

  private completeMoodLog(phoneNumber: string, moodData: any, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.IDLE);
    this.conversationData.delete(phoneNumber);

    return {
      type: 'mood_logged',
      messages: [{
        text: 'Thank you for logging your mood! Your entry has been saved.',
        language
      }],
      moodData,
      nextState: ConversationState.IDLE
    };
  }

  private handleResourceRequest(context: MessageContext, language: string): BotResponse {
    // Mock resources - in real implementation, this would query the database
    const resources = [
      {
        id: 'resource-1',
        title: { en: 'Crisis Hotline', zh: '危机热线' },
        type: 'emergency',
        relevanceScore: 0.9,
        languages: ['en', 'zh', 'universal']
      },
      {
        id: 'resource-2',
        title: { en: 'Therapy Finder', zh: '治疗师查找' },
        type: 'therapy',
        relevanceScore: 0.8,
        languages: ['en', 'zh']
      }
    ];

    return {
      type: 'resources',
      messages: [{
        text: 'Here are some resources that might help:',
        language
      }],
      resources,
      nextState: ConversationState.IDLE
    };
  }

  private handleCrisis(context: MessageContext, language: string): BotResponse {
    const emergencyContacts = [
      {
        name: 'National Crisis Hotline',
        phone: '988',
        available24h: true,
        languages: ['en', 'zh', 'bn']
      },
      {
        name: 'Emergency Services',
        phone: '911',
        available24h: true,
        languages: ['en']
      }
    ];

    return {
      type: 'crisis',
      messages: [{
        text: 'I\'m here to help. If you\'re having thoughts of self-harm, please reach out to emergency services or a crisis hotline immediately.',
        language
      }],
      emergencyContacts,
      priority: 'urgent',
      escalate: this.shouldEscalate(context.message),
      nextState: ConversationState.CRISIS_SUPPORT
    };
  }

  private handleHelp(language: string): BotResponse {
    return {
      type: 'help',
      messages: [{
        text: 'I can help you with: assessments, mood logging, finding resources, or crisis support. What would you like to do?',
        language
      }]
    };
  }

  private handleReset(phoneNumber: string, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.IDLE);
    this.conversationData.delete(phoneNumber);

    return {
      type: 'reset',
      messages: [{
        text: 'Conversation reset. How can I help you?',
        language
      }],
      nextState: ConversationState.IDLE
    };
  }

  private handleSessionExpired(phoneNumber: string, language: string): BotResponse {
    this.conversationStates.set(phoneNumber, ConversationState.IDLE);
    this.conversationData.delete(phoneNumber);

    return {
      type: 'session_expired',
      messages: [{
        text: 'Your session has expired. Please start over.',
        language
      }],
      nextState: ConversationState.IDLE
    };
  }

  private handleUnsupportedMedia(language: string): BotResponse {
    return {
      type: 'unsupported_media',
      messages: [{
        text: 'I can only process text messages at this time. Please send a text message.',
        language
      }]
    };
  }

  private createErrorResponse(errorType: string): BotResponse {
    return {
      type: 'error',
      messages: [{
        text: 'Sorry, something went wrong. Please try again.',
        language: 'en'
      }],
      error: errorType
    };
  }

  // Helper methods
  private detectLanguage(message: string): string {
    // Simple language detection - in production, use a proper language detection library
    if (/[\u4e00-\u9fff]/.test(message)) return 'zh';
    if (/[\u0980-\u09FF]/.test(message)) return 'bn';
    if (/[\u0B80-\u0BFF]/.test(message)) return 'ta';
    if (/[\u1000-\u109F]/.test(message)) return 'my';
    return 'en';
  }

  private detectCrisis(message: string, language: string): boolean {
    const crisisKeywords: Record<string, string[]> = {
      en: ['suicide', 'kill myself', 'end it all', 'hurt myself', 'want to die'],
      zh: ['自杀', '自残', '想死'],
      bn: ['আত্মহত্যা', 'মরতে চাই'],
    };

    const keywords = crisisKeywords[language] || crisisKeywords.en;
    return keywords.some((keyword: string) => message.toLowerCase().includes(keyword.toLowerCase()));
  }

  private shouldEscalate(message: string): boolean {
    const severeKeywords = ['tonight', 'today', 'now', 'immediately', 'plan'];
    return severeKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', '你好', 'হ্যালো'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isAssessmentRequest(message: string): boolean {
    return message.includes('assessment') || message.includes('test') || message.includes('phq');
  }

  private isMoodRequest(message: string): boolean {
    return message.includes('mood') || message.includes('feeling') || message.includes('log');
  }

  private isResourceRequest(message: string): boolean {
    return message.includes('help') || message.includes('resource') || message.includes('support');
  }

  private isSessionExpired(phoneNumber: string): boolean {
    // In production, implement proper session tracking
    return false;
  }

  private getRecommendations(severityLevel: string): string[] {
    const recommendations: Record<string, string[]> = {
      minimal: ['Self-care activities', 'Regular exercise', 'Healthy sleep habits'],
      mild: ['Consider talking to a counselor', 'Stress management techniques', 'Social support'],
      moderate: ['Professional therapy recommended', 'Regular mental health check-ups'],
      severe: ['Immediate professional help recommended', 'Crisis support resources', 'Emergency contacts']
    };

    return recommendations[severityLevel] || recommendations.minimal;
  }
}
