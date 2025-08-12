/**
 * AI Module Index
 * Central export point for all AI/NLP components in the SATA platform
 */

// Core AI Components
export { IntelligentConversationManager } from './intelligent-conversation-manager';
export { MentalHealthPredictor } from './mental-health-predictor';
export { EnhancedMoodPatternRecognition } from './enhanced-mood-pattern-recognition';
export { AdaptiveAssessmentSystem } from './adaptive-assessment-system';
export { ContentPersonalizationEngine } from './content-personalization-engine';
export { AIIntegrationService } from './ai-integration-service';

// Type Exports from Intelligent Conversation Manager
export type {
  ConversationContext,
  Message,
  Intent,
  Entity,
  SentimentAnalysis,
  ConversationResponse,
  ResponseAction,
  PersonalizedElement,
  UserProfile,
  CulturalContext,
  SessionContext,
  EngagementPattern
} from './intelligent-conversation-manager';

// Type Exports from Mental Health Predictor
export type {
  MentalHealthPrediction,
  RiskFactor,
  InterventionRecommendation,
  TrendAnalysis,
  PredictiveMetrics
} from './mental-health-predictor';

// Type Exports from Enhanced Mood Pattern Recognition
export type {
  MoodPatternAnalysis,
  MoodInsight,
  MoodPrediction,
  MoodRecommendation,
  IdentifiedTrigger,
  MoodRiskAssessment,
  MoodDataEntry,
  PatternConfiguration
} from './enhanced-mood-pattern-recognition';

// Type Exports from Adaptive Assessment System
export type {
  AdaptiveAssessment,
  AdaptiveQuestion,
  AssessmentResponse,
  QuestionResponse,
  AssessmentScore,
  AssessmentInsight,
  PersonalizationContext,
  AssessmentType,
  QuestionType
} from './adaptive-assessment-system';

// Type Exports from Content Personalization Engine
export type {
  PersonalizedContent,
  ContentRecommendation,
  UserContentProfile,
  ContentPreferences,
  EngagementHistory,
  LearningStyle,
  EmotionalProfile,
  ContentPersonalizationRequest,
  ContentType,
  ContentFormat
} from './content-personalization-engine';

// Type Exports from AI Integration Service
export type {
  AIServiceConfig,
  AIRequest,
  AIResponse,
  AIInsight,
  CrossServiceAnalysis,
  IntegratedRecommendation,
  AIServiceType,
  InsightType,
  InsightCategory
} from './ai-integration-service';

/**
 * AI Events
 * Centralized event definitions for AI components
 */
export const AIEvents = {
  // Conversation Events
  MESSAGE_PROCESSED: 'message:processed',
  INTENT_DETECTED: 'intent:detected',
  CRISIS_DETECTED: 'crisis:detected',
  
  // Prediction Events
  RISK_PREDICTED: 'risk:predicted',
  HIGH_RISK_DETECTED: 'high_risk:detected',
  INTERVENTION_RECOMMENDED: 'intervention:recommended',
  
  // Mood Analysis Events
  PATTERN_IDENTIFIED: 'pattern:identified',
  MOOD_TREND_DETECTED: 'mood_trend:detected',
  TRIGGER_IDENTIFIED: 'trigger:identified',
  
  // Assessment Events
  ASSESSMENT_GENERATED: 'assessment:generated',
  ASSESSMENT_COMPLETED: 'assessment:completed',
  ADAPTATION_APPLIED: 'adaptation:applied',
  
  // Content Events
  CONTENT_PERSONALIZED: 'content:personalized',
  RECOMMENDATION_GENERATED: 'recommendation:generated',
  ENGAGEMENT_TRACKED: 'engagement:tracked',
  
  // Integration Events
  SERVICE_INITIALIZED: 'service:initialized',
  CROSS_SERVICE_ANALYSIS: 'cross_service:analysis',
  AI_ERROR: 'ai:error'
} as const;

/**
 * AI Configuration Constants
 */
export const AIConfig = {
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
  CRISIS_DETECTION_THRESHOLD: 0.8,
  HIGH_RISK_THRESHOLD: 0.75,
  PATTERN_DETECTION_MIN_DATA_POINTS: 5,
  ASSESSMENT_ADAPTATION_LEVELS: ['minimal', 'moderate', 'extensive'] as const,
  CONTENT_PERSONALIZATION_LEVELS: ['low', 'medium', 'high'] as const,
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'zh', 'ar', 'hi'] as const,
  DEFAULT_SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  PREDICTION_HORIZONS: {
    SHORT_TERM: 7, // days
    MEDIUM_TERM: 30, // days
    LONG_TERM: 90 // days
  }
} as const;

/**
 * AI Utility Functions
 */
export const AIUtils = {
  /**
   * Calculate confidence score average
   */
  calculateAverageConfidence(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  },

  /**
   * Determine risk level from score
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 0.9) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  },

  /**
   * Validate AI configuration
   */
  validateConfig(config: any): boolean {
    // Basic validation logic
    return typeof config === 'object' && config !== null;
  },

  /**
   * Generate unique request ID
   */
  generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Format AI response for logging
   */
  formatResponseForLogging(response: any): object {
    return {
      timestamp: new Date().toISOString(),
      responseType: response.constructor.name,
      confidence: response.confidence || 'unknown',
      dataPoints: Array.isArray(response.data) ? response.data.length : 'single'
    };
  }
};
