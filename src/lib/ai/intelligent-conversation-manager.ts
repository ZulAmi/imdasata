/**
 * Intelligent Conversation Manager
 * AI-powered conversation handling with intent recognition and contextual responses
 */

import { EventEmitter } from 'events';
import { prisma } from '@/lib/prisma';

export interface ConversationContext {
  userId: string;
  phoneNumber: string;
  conversationHistory: Message[];
  userProfile: UserProfile;
  currentMood?: string;
  recentAssessments: Assessment[];
  culturalContext: CulturalContext;
  sessionContext: SessionContext;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: 'user' | 'bot';
  intent?: Intent;
  entities?: Entity[];
  sentiment?: SentimentAnalysis;
}

export interface Intent {
  name: string;
  confidence: number;
  category: 'mood_check' | 'crisis_help' | 'resource_request' | 'assessment' | 'general' | 'emergency';
}

export interface Entity {
  type: 'emotion' | 'severity' | 'time' | 'trigger' | 'symptom' | 'location';
  value: string;
  confidence: number;
  start: number;
  end: number;
}

export interface SentimentAnalysis {
  score: number; // -1 (negative) to 1 (positive)
  magnitude: number; // 0 to 1 (intensity)
  emotions: {
    anger: number;
    disgust: number;
    fear: number;
    joy: number;
    sadness: number;
    surprise: number;
    anxiety: number;
    stress: number;
  };
}

export interface UserProfile {
  id: string;
  language: string;
  culturalBackground: string;
  mentalHealthHistory: string[];
  communicationPreferences: {
    formality: 'formal' | 'casual' | 'therapeutic';
    directness: 'direct' | 'gentle' | 'indirect';
    familyInvolvement: boolean;
  };
  riskFactors: string[];
  engagementPatterns: EngagementPattern[];
}

export interface CulturalContext {
  country: string;
  language: string;
  mentalHealthStigma: 'low' | 'medium' | 'high';
  familyOriented: boolean;
  religiousSensitive: boolean;
  communicationStyle: 'direct' | 'indirect' | 'high_context';
}

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  messageCount: number;
  currentFlow: string;
  userMood: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface EngagementPattern {
  timeOfDay: string;
  responseTime: number;
  messageLength: number;
  emotionalOpenness: number;
  preferredTopics: string[];
}

export interface ConversationResponse {
  message: string;
  intent: Intent;
  actions: ResponseAction[];
  followUpQuestions?: string[];
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  nextFlow?: string;
  personalizedElements: PersonalizedElement[];
}

export interface ResponseAction {
  type: 'assessment_trigger' | 'resource_share' | 'crisis_escalation' | 'mood_log' | 'follow_up_schedule';
  payload: any;
  priority: number;
}

export interface PersonalizedElement {
  type: 'cultural_adaptation' | 'language_style' | 'family_context' | 'religious_sensitivity';
  adaptation: string;
}

class IntelligentConversationManager extends EventEmitter {
  private intentClassifier: IntentClassifier;
  private entityExtractor: EntityExtractor;
  private sentimentAnalyzer: SentimentAnalyzer;
  private responseGenerator: ResponseGenerator;
  private culturalAdapter: CulturalAdapter;
  private conversationMemory: Map<string, ConversationContext> = new Map();

  constructor() {
    super();
    this.intentClassifier = new IntentClassifier();
    this.entityExtractor = new EntityExtractor();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.responseGenerator = new ResponseGenerator();
    this.culturalAdapter = new CulturalAdapter();
  }

  /**
   * Process incoming user message with AI analysis
   */
  async processMessage(
    message: string,
    userId: string,
    phoneNumber: string
  ): Promise<ConversationResponse> {
    try {
      // Get or create conversation context
      const context = await this.getOrCreateContext(userId, phoneNumber);
      
      // AI Analysis Pipeline
      const [intent, entities, sentiment] = await Promise.all([
        this.intentClassifier.classify(message, context),
        this.entityExtractor.extract(message, context.userProfile.language),
        this.sentimentAnalyzer.analyze(message, context.userProfile.language)
      ]);

      // Update conversation context
      const processedMessage: Message = {
        id: `msg_${Date.now()}`,
        content: message,
        timestamp: new Date(),
        sender: 'user',
        intent,
        entities,
        sentiment
      };

      context.conversationHistory.push(processedMessage);
      context.sessionContext.messageCount++;
      context.sessionContext.userMood = this.interpretMoodFromSentiment(sentiment);

      // Crisis detection
      if (this.detectCrisisFromAnalysis(intent, entities, sentiment)) {
        return await this.handleCrisisScenario(context, processedMessage);
      }

      // Generate contextual response
      const response = await this.generateContextualResponse(context, processedMessage);

      // Cultural adaptation
      const culturallyAdaptedResponse = await this.culturalAdapter.adaptResponse(
        response,
        context.culturalContext,
        context.userProfile.communicationPreferences
      );

      // Store conversation update
      await this.updateConversationHistory(context);

      // Emit events for monitoring
      this.emit('message:processed', {
        userId,
        intent: intent.name,
        sentiment: sentiment.score,
        urgency: culturallyAdaptedResponse.urgencyLevel
      });

      return culturallyAdaptedResponse;

    } catch (error) {
      console.error('Error processing message:', error);
      this.emit('error', { error, userId, message });
      
      return {
        message: "I'm sorry, I'm having trouble understanding right now. Please try again or contact support if this continues.",
        intent: { name: 'error', confidence: 1.0, category: 'general' },
        actions: [],
        urgencyLevel: 'low',
        personalizedElements: []
      };
    }
  }

  /**
   * Get conversation context with user profile and history
   */
  private async getOrCreateContext(userId: string, phoneNumber: string): Promise<ConversationContext> {
    const existing = this.conversationMemory.get(userId);
    if (existing && this.isSessionValid(existing)) {
      return existing;
    }

    // Load user data from database
    const user = await prisma.anonymousUser.findUnique({
      where: { id: userId },
      include: {
        moodLogs: { take: 10, orderBy: { loggedAt: 'desc' } }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get recent assessments separately
    const recentAssessments = await prisma.pHQ4Assessment.findMany({
      where: { userId },
      take: 5,
      orderBy: { completedAt: 'desc' }
    });

    const context: ConversationContext = {
      userId,
      phoneNumber,
      conversationHistory: [],
      userProfile: await this.buildUserProfile(user),
      recentAssessments: recentAssessments.map(this.mapAssessment),
      culturalContext: await this.buildCulturalContext(user),
      sessionContext: {
        sessionId: `session_${Date.now()}`,
        startTime: new Date(),
        messageCount: 0,
        currentFlow: 'general',
        userMood: 'neutral',
        urgencyLevel: 'low'
      }
    };

    this.conversationMemory.set(userId, context);
    return context;
  }

  /**
   * Generate contextual response based on analysis
   */
  private async generateContextualResponse(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const responseStrategy = await this.selectResponseStrategy(context, message);
    
    switch (message.intent?.category) {
      case 'mood_check':
        return await this.handleMoodCheckIntent(context, message);
      
      case 'crisis_help':
        return await this.handleCrisisHelpIntent(context, message);
      
      case 'resource_request':
        return await this.handleResourceRequestIntent(context, message);
      
      case 'assessment':
        return await this.handleAssessmentIntent(context, message);
      
      case 'emergency':
        return await this.handleCrisisHelpIntent(context, message);
      
      default:
        return await this.handleGeneralIntent(context, message);
    }
  }

  /**
   * Handle mood check conversation
   */
  private async handleMoodCheckIntent(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const moodEntity = message.entities?.find(e => e.type === 'emotion');
    const severityEntity = message.entities?.find(e => e.type === 'severity');
    
    let responseMessage = '';
    const actions: ResponseAction[] = [];
    const followUpQuestions: string[] = [];

    if (moodEntity) {
      // User shared specific mood
      responseMessage = await this.responseGenerator.generateMoodAcknowledgment(
        moodEntity.value,
        message.sentiment!,
        context.userProfile.communicationPreferences
      );

      // Trigger mood logging
      actions.push({
        type: 'mood_log',
        payload: {
          mood: moodEntity.value,
          severity: severityEntity?.value || 'medium',
          sentiment: message.sentiment
        },
        priority: 1
      });

      // Generate follow-up based on mood
      if (message.sentiment!.score < -0.3) {
        followUpQuestions.push(
          "Would you like to explore some coping strategies?",
          "Is there anything specific that's contributing to how you're feeling?"
        );
        
        actions.push({
          type: 'resource_share',
          payload: { category: 'coping_strategies', mood: moodEntity.value },
          priority: 2
        });
      }
    } else {
      // Ask for mood clarification
      responseMessage = await this.responseGenerator.generateMoodInquiry(
        context.userProfile.communicationPreferences,
        context.culturalContext
      );
      
      followUpQuestions.push(
        "How would you describe your mood on a scale of 1-10?",
        "What emotions are you experiencing right now?"
      );
    }

    return {
      message: responseMessage,
      intent: message.intent!,
      actions,
      followUpQuestions,
      urgencyLevel: this.calculateUrgencyFromSentiment(message.sentiment!),
      personalizedElements: await this.generatePersonalizedElements(context)
    };
  }

  /**
   * Handle crisis help requests
   */
  private async handleCrisisHelpIntent(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const urgencyLevel = this.assessCrisisUrgency(message, context);
    
    const responseMessage = await this.responseGenerator.generateCrisisResponse(
      urgencyLevel,
      context.culturalContext,
      context.userProfile.communicationPreferences
    );

    const actions: ResponseAction[] = [
      {
        type: 'crisis_escalation',
        payload: {
          urgency: urgencyLevel,
          userMessage: message.content,
          sentiment: message.sentiment,
          userProfile: context.userProfile
        },
        priority: 1
      }
    ];

    // Add immediate resource sharing for high urgency
    if (urgencyLevel === 'high' || urgencyLevel === 'critical') {
      actions.push({
        type: 'resource_share',
        payload: { 
          category: 'crisis_support',
          immediate: true,
          location: context.culturalContext.country
        },
        priority: 1
      });
    }

    return {
      message: responseMessage,
      intent: message.intent!,
      actions,
      followUpQuestions: urgencyLevel === 'critical' ? [] : [
        "Would you like me to connect you with a crisis counselor?",
        "Do you have someone you can reach out to right now?"
      ],
      urgencyLevel,
      personalizedElements: await this.generatePersonalizedElements(context)
    };
  }

  /**
   * Handle resource requests
   */
  private async handleResourceRequestIntent(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const topicEntity = message.entities?.find(e => e.type === 'symptom' || e.type === 'trigger');
    const topic = topicEntity?.value || this.inferTopicFromSentiment(message.sentiment!);

    const responseMessage = await this.responseGenerator.generateResourceResponse(
      topic,
      context.userProfile,
      context.culturalContext
    );

    const actions: ResponseAction[] = [
      {
        type: 'resource_share',
        payload: {
          category: topic,
          language: context.userProfile.language,
          culturalContext: context.culturalContext,
          userHistory: context.recentAssessments
        },
        priority: 1
      }
    ];

    return {
      message: responseMessage,
      intent: message.intent!,
      actions,
      followUpQuestions: [
        "Would you like specific resources for this topic?",
        "Are you looking for professional help or self-help resources?"
      ],
      urgencyLevel: 'medium',
      personalizedElements: await this.generatePersonalizedElements(context)
    };
  }

  /**
   * Handle assessment requests
   */
  private async handleAssessmentIntent(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const lastAssessment = context.recentAssessments[0];
    const daysSinceLastAssessment = lastAssessment ? 
      Math.floor((Date.now() - lastAssessment.completedAt.getTime()) / (1000 * 60 * 60 * 24)) : 999;

    let responseMessage = '';
    const actions: ResponseAction[] = [];

    if (daysSinceLastAssessment < 7) {
      responseMessage = await this.responseGenerator.generateAssessmentDelayResponse(
        daysSinceLastAssessment,
        context.userProfile.communicationPreferences
      );
    } else {
      responseMessage = await this.responseGenerator.generateAssessmentInvitation(
        context.userProfile.communicationPreferences,
        context.culturalContext
      );

      actions.push({
        type: 'assessment_trigger',
        payload: {
          type: 'PHQ4',
          adaptive: true,
          userHistory: context.recentAssessments
        },
        priority: 1
      });
    }

    return {
      message: responseMessage,
      intent: message.intent!,
      actions,
      followUpQuestions: daysSinceLastAssessment >= 7 ? [
        "Would you like to start the assessment now?",
        "Do you have a few minutes to complete a brief questionnaire?"
      ] : [],
      urgencyLevel: 'low',
      personalizedElements: await this.generatePersonalizedElements(context)
    };
  }

  /**
   * Handle general conversation
   */
  private async handleGeneralIntent(
    context: ConversationContext,
    message: Message
  ): Promise<ConversationResponse> {
    const responseMessage = await this.responseGenerator.generateGeneralResponse(
      message.content,
      message.sentiment!,
      context.userProfile,
      context.culturalContext
    );

    const actions: ResponseAction[] = [];

    // Suggest helpful actions based on conversation flow
    if (context.sessionContext.messageCount > 3) {
      actions.push({
        type: 'follow_up_schedule',
        payload: {
          suggestedTime: this.calculateOptimalFollowUpTime(context),
          reason: 'continued_conversation'
        },
        priority: 3
      });
    }

    return {
      message: responseMessage,
      intent: message.intent!,
      actions,
      followUpQuestions: [
        "Is there anything specific I can help you with today?",
        "How are you feeling overall?"
      ],
      urgencyLevel: 'low',
      personalizedElements: await this.generatePersonalizedElements(context)
    };
  }

  /**
   * Detect crisis from AI analysis
   */
  private detectCrisisFromAnalysis(
    intent: Intent,
    entities: Entity[],
    sentiment: SentimentAnalysis
  ): boolean {
    // Crisis indicators
    const crisisIntent = intent.category === 'crisis_help' || intent.category === 'emergency';
    const severeCrisisEntities = entities.some(e => 
      e.type === 'trigger' && ['suicide', 'self-harm', 'hurt myself'].includes(e.value.toLowerCase())
    );
    const extremeNegativeSentiment = sentiment.score < -0.8 && sentiment.magnitude > 0.7;
    const highAnxietyOrFear = sentiment.emotions.fear > 0.8 || sentiment.emotions.anxiety > 0.8;

    return crisisIntent || severeCrisisEntities || extremeNegativeSentiment || highAnxietyOrFear;
  }

  /**
   * Generate personalized elements for cultural adaptation
   */
  private async generatePersonalizedElements(context: ConversationContext): Promise<PersonalizedElement[]> {
    const elements: PersonalizedElement[] = [];

    // Cultural adaptation
    if (context.culturalContext.mentalHealthStigma === 'high') {
      elements.push({
        type: 'cultural_adaptation',
        adaptation: 'gentle_indirect_language'
      });
    }

    // Family context
    if (context.culturalContext.familyOriented && context.userProfile.communicationPreferences.familyInvolvement) {
      elements.push({
        type: 'family_context',
        adaptation: 'family_inclusive_language'
      });
    }

    // Religious sensitivity
    if (context.culturalContext.religiousSensitive) {
      elements.push({
        type: 'religious_sensitivity',
        adaptation: 'spiritually_respectful_language'
      });
    }

    // Language style
    elements.push({
      type: 'language_style',
      adaptation: context.userProfile.communicationPreferences.formality
    });

    return elements;
  }

  // Helper methods
  private interpretMoodFromSentiment(sentiment: SentimentAnalysis): string {
    if (sentiment.score > 0.3) return 'positive';
    if (sentiment.score < -0.3) return 'negative';
    return 'neutral';
  }

  private calculateUrgencyFromSentiment(sentiment: SentimentAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    if (sentiment.score < -0.8 && sentiment.magnitude > 0.8) return 'critical';
    if (sentiment.score < -0.5 && sentiment.magnitude > 0.6) return 'high';
    if (sentiment.score < -0.2 || sentiment.magnitude > 0.4) return 'medium';
    return 'low';
  }

  private assessCrisisUrgency(message: Message, context: ConversationContext): 'low' | 'medium' | 'high' | 'critical' {
    const baseUrgency = this.calculateUrgencyFromSentiment(message.sentiment!);
    
    // Escalate based on entities
    const hasSuicidalEntities = message.entities?.some(e => 
      e.type === 'trigger' && ['suicide', 'kill myself', 'end it all'].includes(e.value.toLowerCase())
    );
    
    const hasImmediateTimeEntities = message.entities?.some(e => 
      e.type === 'time' && ['now', 'today', 'tonight'].includes(e.value.toLowerCase())
    );

    if (hasSuicidalEntities && hasImmediateTimeEntities) return 'critical';
    if (hasSuicidalEntities) return 'high';
    
    return baseUrgency;
  }

  private inferTopicFromSentiment(sentiment: SentimentAnalysis): string {
    const dominantEmotion = Object.entries(sentiment.emotions)
      .reduce((max, [emotion, score]) => score > max.score ? { emotion, score } : max, { emotion: '', score: 0 });

    const topicMap: Record<string, string> = {
      'anxiety': 'anxiety_management',
      'stress': 'stress_relief',
      'sadness': 'depression_support',
      'anger': 'anger_management',
      'fear': 'anxiety_management'
    };

    return topicMap[dominantEmotion.emotion] || 'general_wellness';
  }

  private calculateOptimalFollowUpTime(context: ConversationContext): Date {
    // Basic implementation - could be enhanced with ML
    const now = new Date();
    const followUpHours = context.sessionContext.urgencyLevel === 'high' ? 4 : 24;
    return new Date(now.getTime() + followUpHours * 60 * 60 * 1000);
  }

  private isSessionValid(context: ConversationContext): boolean {
    const sessionAge = Date.now() - context.sessionContext.startTime.getTime();
    const maxSessionAge = 2 * 60 * 60 * 1000; // 2 hours
    return sessionAge < maxSessionAge;
  }

  private async buildUserProfile(user: any): Promise<UserProfile> {
    // Implementation would analyze user data to build comprehensive profile
    return {
      id: user.id,
      language: user.language || 'en',
      culturalBackground: user.countryOfOrigin || 'unknown',
      mentalHealthHistory: [], // Would be derived from assessments
      communicationPreferences: {
        formality: 'casual',
        directness: 'gentle',
        familyInvolvement: false
      },
      riskFactors: [],
      engagementPatterns: []
    };
  }

  private async buildCulturalContext(user: any): Promise<CulturalContext> {
    // Implementation would map user data to cultural context
    return {
      country: user.countryOfOrigin || 'unknown',
      language: user.language || 'en',
      mentalHealthStigma: 'medium',
      familyOriented: false,
      religiousSensitive: false,
      communicationStyle: 'direct'
    };
  }

  private mapAssessment(assessment: any): Assessment {
    return {
      id: assessment.id,
      type: 'PHQ4',
      score: assessment.totalScore,
      completedAt: assessment.completedAt,
      severity: assessment.severityLevel
    };
  }

  private async selectResponseStrategy(context: ConversationContext, message: Message): Promise<string> {
    // Implementation would select optimal response strategy
    return 'empathetic_supportive';
  }

  private async handleCrisisScenario(context: ConversationContext, message: Message): Promise<ConversationResponse> {
    // Immediate crisis response
    return {
      message: "I understand you're going through a very difficult time right now. Your safety is my top priority. I'm here to help you find immediate support.",
      intent: { name: 'crisis_immediate', confidence: 1.0, category: 'emergency' },
      actions: [
        {
          type: 'crisis_escalation',
          payload: { urgency: 'critical', immediate: true },
          priority: 1
        }
      ],
      urgencyLevel: 'critical',
      personalizedElements: []
    };
  }

  private async updateConversationHistory(context: ConversationContext): Promise<void> {
    // Store conversation updates in database
    try {
      await prisma.userInteraction.create({
        data: {
          userId: context.userId,
          interactionType: 'ai_conversation',
          metadata: {
            sessionId: context.sessionContext.sessionId,
            messageCount: context.sessionContext.messageCount,
            userMood: context.sessionContext.userMood,
            urgencyLevel: context.sessionContext.urgencyLevel
          }
        }
      });
    } catch (error) {
      console.error('Error updating conversation history:', error);
    }
  }
}

// Supporting classes (simplified interfaces - would need full implementation)
class IntentClassifier {
  async classify(message: string, context: ConversationContext): Promise<Intent> {
    // ML-based intent classification implementation
    return { name: 'general', confidence: 0.8, category: 'general' };
  }
}

class EntityExtractor {
  async extract(message: string, language: string): Promise<Entity[]> {
    // NLP entity extraction implementation
    return [];
  }
}

class SentimentAnalyzer {
  async analyze(message: string, language: string): Promise<SentimentAnalysis> {
    // Advanced sentiment analysis implementation
    return {
      score: 0,
      magnitude: 0.5,
      emotions: {
        anger: 0, disgust: 0, fear: 0, joy: 0, sadness: 0, surprise: 0, anxiety: 0, stress: 0
      }
    };
  }
}

class ResponseGenerator {
  async generateMoodAcknowledgment(mood: string, sentiment: SentimentAnalysis, preferences: any): Promise<string> {
    return `I understand you're feeling ${mood}. Thank you for sharing that with me.`;
  }

  async generateMoodInquiry(preferences: any, cultural: CulturalContext): Promise<string> {
    return "How are you feeling today? I'm here to listen and support you.";
  }

  async generateCrisisResponse(urgency: string, cultural: CulturalContext, preferences: any): Promise<string> {
    return "I'm here to help you through this difficult time. Let's work together to find the support you need.";
  }

  async generateResourceResponse(topic: string, profile: UserProfile, cultural: CulturalContext): Promise<string> {
    return `I can help you find resources for ${topic}. Let me share some options that might be helpful.`;
  }

  async generateAssessmentDelayResponse(days: number, preferences: any): Promise<string> {
    return `You completed an assessment ${days} days ago. It's best to wait a bit longer before taking another one.`;
  }

  async generateAssessmentInvitation(preferences: any, cultural: CulturalContext): Promise<string> {
    return "Would you like to complete a brief mental health assessment? It helps me understand how to better support you.";
  }

  async generateGeneralResponse(message: string, sentiment: SentimentAnalysis, profile: UserProfile, cultural: CulturalContext): Promise<string> {
    return "I'm here to listen and support you. How can I help you today?";
  }
}

class CulturalAdapter {
  async adaptResponse(response: ConversationResponse, cultural: CulturalContext, preferences: any): Promise<ConversationResponse> {
    // Cultural adaptation logic
    return response;
  }
}

interface Assessment {
  id: string;
  type: string;
  score: number;
  completedAt: Date;
  severity: string;
}

export { IntelligentConversationManager };
