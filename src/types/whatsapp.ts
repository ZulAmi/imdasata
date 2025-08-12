/**
 * WhatsApp Bot Type Definitions
 */

export interface MessageContext {
  phoneNumber: string;
  message: string;
  messageType: 'text' | 'audio' | 'image' | 'video' | 'document';
  timestamp: Date;
  language?: string;
  conversationState?: ConversationState;
  assessmentData?: Record<string, any>;
  moodData?: Record<string, any>;
}

export enum ConversationState {
  IDLE = 'IDLE',
  WELCOME = 'WELCOME',
  PHQ4_QUESTION_1 = 'PHQ4_QUESTION_1',
  PHQ4_QUESTION_2 = 'PHQ4_QUESTION_2',
  PHQ4_QUESTION_3 = 'PHQ4_QUESTION_3',
  PHQ4_QUESTION_4 = 'PHQ4_QUESTION_4',
  MOOD_ENTRY = 'MOOD_ENTRY',
  EMOTION_SELECTION = 'EMOTION_SELECTION',
  MOOD_NOTES = 'MOOD_NOTES',
  RESOURCE_SELECTION = 'RESOURCE_SELECTION',
  CRISIS_SUPPORT = 'CRISIS_SUPPORT'
}

export interface BotResponse {
  type: 'welcome' | 'assessment' | 'mood_log' | 'resources' | 'crisis' | 'help' | 'error' | 'validation_error' | 'assessment_complete' | 'mood_logged' | 'unsupported_media' | 'session_expired' | 'reset';
  messages: BotMessage[];
  nextState?: ConversationState;
  previousState?: ConversationState;
  resources?: ResourceRecommendation[];
  emergencyContacts?: EmergencyContact[];
  priority?: 'normal' | 'high' | 'urgent';
  escalate?: boolean;
  followUp?: string;
  results?: AssessmentResult;
  moodData?: MoodData;
  detectedLanguage?: string;
  error?: string;
}

export interface BotMessage {
  text: string;
  language: string;
  type?: 'text' | 'quick_reply' | 'template';
  buttons?: MessageButton[];
}

export interface MessageButton {
  id: string;
  text: string;
  type: 'reply' | 'url' | 'phone';
  payload?: string;
}

export interface ResourceRecommendation {
  id: string;
  title: Record<string, string>;
  type: string;
  relevanceScore: number;
  languages?: string[];
  contactInfo?: Record<string, any>;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  available24h: boolean;
  languages: string[];
}

export interface AssessmentResult {
  totalScore: number;
  depressionScore: number;
  anxietyScore: number;
  severityLevel: string;
  recommendations: string[];
}

export interface MoodData {
  score: number;
  emotions: string[];
  notes?: string;
  triggers?: string[];
}
