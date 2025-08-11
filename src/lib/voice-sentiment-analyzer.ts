/**
 * SATA Voice Sentiment Analysis Service
 * Azure Cognitive Services integration for voice note analysis
 */

import { EventEmitter } from 'events';

// Azure Cognitive Services configuration
export interface AzureConfig {
  speechKey: string;
  speechRegion: string;
  textAnalyticsKey: string;
  textAnalyticsEndpoint: string;
  languageKey: string;
  languageEndpoint: string;
}

// Voice analysis interfaces
export interface VoiceNote {
  id: string;
  userId: string;
  audioUrl: string;
  uploadedAt: Date;
  duration: number; // in seconds
  language?: string;
  isProcessed: boolean;
  isPrivacyProtected: boolean;
}

export interface SpeechToTextResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  segments: SpeechSegment[];
}

export interface SpeechSegment {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface EmotionAnalysis {
  primaryEmotion: string;
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
    neutral: number;
    anxiety: number;
    stress: number;
  };
  arousal: number; // 0-1 (calm to excited)
  valence: number; // 0-1 (negative to positive)
  confidence: number;
}

export interface MentalHealthKeywords {
  concerns: string[];
  positiveIndicators: string[];
  riskKeywords: string[];
  copingMechanisms: string[];
  supportNeeds: string[];
  categories: {
    depression: number;
    anxiety: number;
    stress: number;
    suicidalIdeation: number;
    selfHarm: number;
    substance: number;
    relationships: number;
    work: number;
    sleep: number;
    eating: number;
  };
}

export interface MoodScore {
  overall: number; // 0-100
  emotional: number;
  stress: number;
  energy: number;
  clarity: number;
  timestamp: Date;
  confidence: number;
  factors: {
    tone: number;
    pace: number;
    volume: number;
    keywords: number;
    sentiment: number;
  };
}

export interface TrendAnalysis {
  timeframe: 'daily' | 'weekly' | 'monthly';
  moodTrend: 'improving' | 'stable' | 'declining' | 'concerning';
  averageMood: number;
  volatility: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  interventionNeeded: boolean;
}

export interface ProactiveIntervention {
  id: string;
  userId: string;
  triggerType: 'mood_decline' | 'risk_keywords' | 'stress_spike' | 'pattern_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: InterventionAction[];
  timestamp: Date;
  responded: boolean;
  responseTime?: number;
}

export interface InterventionAction {
  type: 'notification' | 'resource_suggestion' | 'peer_connect' | 'professional_contact' | 'emergency_protocol';
  title: string;
  description: string;
  url?: string;
  priority: number;
  automated: boolean;
}

// Multi-language support
export interface LanguageSupport {
  code: string;
  name: string;
  supported: boolean;
  mentalHealthVocabulary: string[];
  culturalContext: {
    expressionPatterns: string[];
    stigmaTerms: string[];
    supportTerms: string[];
  };
}

export class VoiceSentimentAnalyzer extends EventEmitter {
  private azureConfig: AzureConfig;
  private supportedLanguages: Map<string, LanguageSupport>;
  private voiceNotes: Map<string, VoiceNote>;
  private analysisResults: Map<string, any>;
  private userMoodHistory: Map<string, MoodScore[]>;
  private interventions: Map<string, ProactiveIntervention[]>;
  private privacyMode: boolean;

  constructor(config: AzureConfig, privacyMode: boolean = true) {
    super();
    this.azureConfig = config;
    this.privacyMode = privacyMode;
    this.voiceNotes = new Map();
    this.analysisResults = new Map();
    this.userMoodHistory = new Map();
    this.interventions = new Map();
    this.supportedLanguages = new Map();
    
    this.initializeLanguageSupport();
    this.setupAzureServices();
  }

  private initializeLanguageSupport(): void {
    const languages: LanguageSupport[] = [
      {
        code: 'en-US',
        name: 'English (US)',
        supported: true,
        mentalHealthVocabulary: [
          'depressed', 'anxious', 'stressed', 'overwhelmed', 'hopeless', 'suicidal',
          'panic', 'worried', 'sad', 'angry', 'frustrated', 'tired', 'exhausted',
          'happy', 'grateful', 'calm', 'peaceful', 'confident', 'motivated'
        ],
        culturalContext: {
          expressionPatterns: ['I feel like', 'I am struggling with', 'I need help'],
          stigmaTerms: ['crazy', 'mental', 'insane'],
          supportTerms: ['therapy', 'counseling', 'support group', 'medication']
        }
      },
      {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        supported: true,
        mentalHealthVocabulary: [
          '抑郁', '焦虑', '压力', '绝望', '痛苦', '困扰',
          '开心', '感激', '平静', '自信', '动力'
        ],
        culturalContext: {
          expressionPatterns: ['我觉得', '我很担心', '我需要帮助'],
          stigmaTerms: ['疯子', '神经病'],
          supportTerms: ['心理治疗', '咨询', '支持小组']
        }
      },
      {
        code: 'es-ES',
        name: 'Spanish',
        supported: true,
        mentalHealthVocabulary: [
          'deprimido', 'ansioso', 'estresado', 'abrumado', 'desesperanzado',
          'feliz', 'agradecido', 'tranquilo', 'confiado', 'motivado'
        ],
        culturalContext: {
          expressionPatterns: ['Me siento', 'Estoy luchando con', 'Necesito ayuda'],
          stigmaTerms: ['loco', 'mental'],
          supportTerms: ['terapia', 'consejería', 'grupo de apoyo']
        }
      }
    ];

    languages.forEach(lang => {
      this.supportedLanguages.set(lang.code, lang);
    });
  }

  private async setupAzureServices(): Promise<void> {
    // Initialize Azure Cognitive Services clients
    try {
      this.emit('services:initialized', {
        speech: true,
        textAnalytics: true,
        language: true,
        timestamp: new Date()
      });
    } catch (error) {
      this.emit('services:error', { error, timestamp: new Date() });
    }
  }

  // Main analysis pipeline
  async analyzeVoiceNote(voiceNote: VoiceNote): Promise<any> {
    try {
      this.emit('analysis:started', { noteId: voiceNote.id, userId: voiceNote.userId });

      // Step 1: Speech to Text
      const speechResult = await this.speechToText(voiceNote);
      
      // Step 2: Language Detection
      const language = await this.detectLanguage(speechResult.text);
      
      // Step 3: Emotion Analysis
      const emotions = await this.analyzeEmotions(speechResult, language);
      
      // Step 4: Mental Health Keywords
      const keywords = await this.extractMentalHealthKeywords(speechResult.text, language);
      
      // Step 5: Mood Score Calculation
      const moodScore = this.calculateMoodScore(emotions, keywords, speechResult);
      
      // Step 6: Store and Update Trends
      this.updateUserMoodHistory(voiceNote.userId, moodScore);
      
      // Step 7: Risk Assessment
      const riskAssessment = await this.assessRisk(voiceNote.userId, moodScore, keywords);
      
      // Step 8: Proactive Interventions
      if (riskAssessment.interventionNeeded) {
        await this.triggerIntervention(voiceNote.userId, riskAssessment);
      }

      const analysisResult = {
        noteId: voiceNote.id,
        userId: voiceNote.userId,
        speechResult,
        language,
        emotions,
        keywords,
        moodScore,
        riskAssessment,
        timestamp: new Date(),
        privacyProtected: this.privacyMode
      };

      this.analysisResults.set(voiceNote.id, analysisResult);
      this.emit('analysis:completed', analysisResult);

      return analysisResult;

    } catch (error) {
      this.emit('analysis:error', { error, noteId: voiceNote.id });
      throw error;
    }
  }

  private async speechToText(voiceNote: VoiceNote): Promise<SpeechToTextResult> {
    // Mock implementation for demo - replace with actual Azure Speech Service
    const mockResult: SpeechToTextResult = {
      text: "I've been feeling really overwhelmed lately. Work stress is getting to me and I'm having trouble sleeping. I think I need some help but I'm not sure where to start.",
      confidence: 0.92,
      language: 'en-US',
      duration: voiceNote.duration,
      segments: [
        {
          text: "I've been feeling really overwhelmed lately.",
          startTime: 0,
          endTime: 3.2,
          confidence: 0.95
        },
        {
          text: "Work stress is getting to me and I'm having trouble sleeping.",
          startTime: 3.5,
          endTime: 7.8,
          confidence: 0.88
        },
        {
          text: "I think I need some help but I'm not sure where to start.",
          startTime: 8.1,
          endTime: 12.3,
          confidence: 0.94
        }
      ]
    };

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.emit('speech:converted', { noteId: voiceNote.id, confidence: mockResult.confidence });
    return mockResult;
  }

  private async detectLanguage(text: string): Promise<string> {
    // Mock implementation - replace with Azure Language Detection
    const languages = ['en-US', 'zh-CN', 'es-ES'];
    
    // Simple keyword-based detection for demo
    if (text.includes('我') || text.includes('很')) return 'zh-CN';
    if (text.includes('siento') || text.includes('ayuda')) return 'es-ES';
    return 'en-US';
  }

  private async analyzeEmotions(speechResult: SpeechToTextResult, language: string): Promise<EmotionAnalysis> {
    // Mock implementation - replace with Azure Emotion API and voice prosody analysis
    const emotions: EmotionAnalysis = {
      primaryEmotion: 'anxiety',
      emotions: {
        joy: 0.1,
        sadness: 0.3,
        anger: 0.15,
        fear: 0.25,
        surprise: 0.05,
        disgust: 0.05,
        neutral: 0.1,
        anxiety: 0.7,
        stress: 0.8
      },
      arousal: 0.7, // High arousal indicates stress/anxiety
      valence: 0.3, // Low valence indicates negative emotions
      confidence: 0.85
    };

    this.emit('emotions:analyzed', { emotions, language });
    return emotions;
  }

  private async extractMentalHealthKeywords(text: string, language: string): Promise<MentalHealthKeywords> {
    const languageSupport = this.supportedLanguages.get(language);
    if (!languageSupport) {
      throw new Error(`Language ${language} not supported`);
    }

    // Advanced keyword extraction with context analysis
    const keywords: MentalHealthKeywords = {
      concerns: ['overwhelmed', 'stress', 'trouble sleeping'],
      positiveIndicators: [],
      riskKeywords: [],
      copingMechanisms: [],
      supportNeeds: ['help'],
      categories: {
        depression: 0.3,
        anxiety: 0.7,
        stress: 0.8,
        suicidalIdeation: 0.0,
        selfHarm: 0.0,
        substance: 0.0,
        relationships: 0.1,
        work: 0.6,
        sleep: 0.5,
        eating: 0.0
      }
    };

    this.emit('keywords:extracted', { keywords, language });
    return keywords;
  }

  private calculateMoodScore(
    emotions: EmotionAnalysis, 
    keywords: MentalHealthKeywords, 
    speechResult: SpeechToTextResult
  ): MoodScore {
    // Complex mood calculation algorithm
    const emotionalScore = (emotions.emotions.joy * 100 + 
                           (1 - emotions.emotions.sadness) * 100 + 
                           (1 - emotions.emotions.anxiety) * 100) / 3;

    const stressScore = (1 - emotions.emotions.stress) * 100;
    const energyScore = emotions.arousal * 100;
    const clarityScore = speechResult.confidence * 100;

    const keywordImpact = Object.values(keywords.categories).reduce((sum, val) => sum + val, 0) / 10;
    const keywordScore = Math.max(0, 100 - (keywordImpact * 100));

    const overall = (emotionalScore * 0.3 + 
                    stressScore * 0.25 + 
                    energyScore * 0.2 + 
                    clarityScore * 0.15 + 
                    keywordScore * 0.1);

    const moodScore: MoodScore = {
      overall: Math.round(overall),
      emotional: Math.round(emotionalScore),
      stress: Math.round(stressScore),
      energy: Math.round(energyScore),
      clarity: Math.round(clarityScore),
      timestamp: new Date(),
      confidence: emotions.confidence,
      factors: {
        tone: Math.round(emotions.valence * 100),
        pace: Math.round(speechResult.duration > 0 ? (speechResult.text.length / speechResult.duration) * 10 : 50),
        volume: Math.round(emotions.arousal * 100),
        keywords: Math.round(keywordScore),
        sentiment: Math.round(emotions.valence * 100)
      }
    };

    this.emit('mood:calculated', { moodScore });
    return moodScore;
  }

  private updateUserMoodHistory(userId: string, moodScore: MoodScore): void {
    if (!this.userMoodHistory.has(userId)) {
      this.userMoodHistory.set(userId, []);
    }

    const history = this.userMoodHistory.get(userId)!;
    history.push(moodScore);

    // Keep last 100 entries
    if (history.length > 100) {
      history.shift();
    }

    this.emit('mood:updated', { userId, historyLength: history.length });
  }

  private async assessRisk(userId: string, moodScore: MoodScore, keywords: MentalHealthKeywords): Promise<any> {
    const history = this.userMoodHistory.get(userId) || [];
    
    // Risk factors
    const lowMoodScore = moodScore.overall < 30;
    const highStress = moodScore.stress < 40;
    const riskKeywords = keywords.categories.suicidalIdeation > 0.3 || 
                        keywords.categories.selfHarm > 0.3;
    const trendDecline = this.calculateTrendDecline(history);

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let interventionNeeded = false;

    if (riskKeywords || keywords.categories.suicidalIdeation > 0.5) {
      riskLevel = 'critical';
      interventionNeeded = true;
    } else if (lowMoodScore && highStress && trendDecline) {
      riskLevel = 'high';
      interventionNeeded = true;
    } else if (lowMoodScore || highStress) {
      riskLevel = 'medium';
      interventionNeeded = moodScore.overall < 25;
    }

    return {
      riskLevel,
      interventionNeeded,
      factors: {
        lowMoodScore,
        highStress,
        riskKeywords,
        trendDecline
      },
      recommendations: this.generateRecommendations(riskLevel, keywords)
    };
  }

  private calculateTrendDecline(history: MoodScore[]): boolean {
    if (history.length < 5) return false;

    const recent = history.slice(-5);
    const earlier = history.slice(-10, -5);

    if (earlier.length === 0) return false;

    const recentAvg = recent.reduce((sum, score) => sum + score.overall, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, score) => sum + score.overall, 0) / earlier.length;

    return recentAvg < earlierAvg - 15; // 15 point decline threshold
  }

  private generateRecommendations(riskLevel: string, keywords: MentalHealthKeywords): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Immediate professional help recommended');
      recommendations.push('Contact crisis hotline');
      recommendations.push('Reach out to trusted friend or family member');
    } else if (riskLevel === 'high') {
      recommendations.push('Consider speaking with a mental health professional');
      recommendations.push('Try stress reduction techniques');
      recommendations.push('Ensure adequate sleep and nutrition');
    } else if (riskLevel === 'medium') {
      recommendations.push('Practice mindfulness or meditation');
      recommendations.push('Engage in physical activity');
      recommendations.push('Connect with support network');
    }

    // Specific recommendations based on keywords
    if (keywords.categories.work > 0.5) {
      recommendations.push('Consider work-life balance strategies');
    }
    if (keywords.categories.sleep > 0.5) {
      recommendations.push('Focus on sleep hygiene');
    }
    if (keywords.categories.anxiety > 0.5) {
      recommendations.push('Try anxiety management techniques');
    }

    return recommendations;
  }

  private async triggerIntervention(userId: string, riskAssessment: any): Promise<void> {
    const intervention: ProactiveIntervention = {
      id: `intervention-${Date.now()}`,
      userId,
      triggerType: 'mood_decline',
      severity: riskAssessment.riskLevel,
      message: this.generateInterventionMessage(riskAssessment),
      actions: this.generateInterventionActions(riskAssessment),
      timestamp: new Date(),
      responded: false
    };

    if (!this.interventions.has(userId)) {
      this.interventions.set(userId, []);
    }

    this.interventions.get(userId)!.push(intervention);

    this.emit('intervention:triggered', { intervention });

    // Execute immediate actions for critical cases
    if (riskAssessment.riskLevel === 'critical') {
      await this.executeCriticalIntervention(intervention);
    }
  }

  private generateInterventionMessage(riskAssessment: any): string {
    const messages = {
      critical: "We've noticed some concerning patterns in your recent voice notes. Your wellbeing is important to us. Please consider reaching out for immediate support.",
      high: "It seems like you might be going through a difficult time. Remember that support is available and you don't have to face this alone.",
      medium: "We've noticed you might be experiencing some stress. Here are some resources that might help.",
      low: "Keep taking care of yourself. Here are some wellness tips for you."
    };

    return messages[riskAssessment.riskLevel as keyof typeof messages] || messages.medium;
  }

  private generateInterventionActions(riskAssessment: any): InterventionAction[] {
    const actions: InterventionAction[] = [];

    if (riskAssessment.riskLevel === 'critical') {
      actions.push({
        type: 'emergency_protocol',
        title: 'Crisis Support',
        description: 'Connect with crisis counselor immediately',
        url: 'tel:988',
        priority: 1,
        automated: true
      });
    }

    if (riskAssessment.riskLevel === 'high' || riskAssessment.riskLevel === 'critical') {
      actions.push({
        type: 'professional_contact',
        title: 'Professional Help',
        description: 'Schedule appointment with mental health professional',
        priority: 2,
        automated: false
      });
    }

    actions.push({
      type: 'resource_suggestion',
      title: 'Coping Resources',
      description: 'Access curated mental health resources',
      url: '/resources',
      priority: 3,
      automated: true
    });

    actions.push({
      type: 'peer_connect',
      title: 'Peer Support',
      description: 'Connect with peer support community',
      url: '/peer-support',
      priority: 4,
      automated: true
    });

    return actions;
  }

  private async executeCriticalIntervention(intervention: ProactiveIntervention): Promise<void> {
    // Implement critical intervention protocols
    this.emit('intervention:critical', { 
      intervention,
      timestamp: new Date(),
      autoExecuted: true
    });
  }

  // Public API methods
  async uploadVoiceNote(audioFile: File, userId: string): Promise<string> {
    const voiceNote: VoiceNote = {
      id: `voice-${Date.now()}-${userId}`,
      userId,
      audioUrl: URL.createObjectURL(audioFile),
      uploadedAt: new Date(),
      duration: 0, // Will be calculated
      isProcessed: false,
      isPrivacyProtected: this.privacyMode
    };

    this.voiceNotes.set(voiceNote.id, voiceNote);
    
    // Start analysis in background
    this.analyzeVoiceNote(voiceNote).catch(error => {
      this.emit('upload:error', { error, noteId: voiceNote.id });
    });

    return voiceNote.id;
  }

  getUserMoodTrends(userId: string, timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): TrendAnalysis {
    const history = this.userMoodHistory.get(userId) || [];
    
    if (history.length === 0) {
      return {
        timeframe,
        moodTrend: 'stable',
        averageMood: 50,
        volatility: 0,
        riskLevel: 'low',
        recommendations: ['Continue regular check-ins'],
        interventionNeeded: false
      };
    }

    const recent = history.slice(-7); // Last 7 entries
    const averageMood = recent.reduce((sum, score) => sum + score.overall, 0) / recent.length;
    
    // Calculate volatility (standard deviation)
    const variance = recent.reduce((sum, score) => sum + Math.pow(score.overall - averageMood, 2), 0) / recent.length;
    const volatility = Math.sqrt(variance);

    // Determine trend
    let moodTrend: 'improving' | 'stable' | 'declining' | 'concerning' = 'stable';
    if (recent.length >= 3) {
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, score) => sum + score.overall, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, score) => sum + score.overall, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 10) moodTrend = 'improving';
      else if (secondAvg < firstAvg - 10) moodTrend = 'declining';
      else if (secondAvg < 30) moodTrend = 'concerning';
    }

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (averageMood < 25 || moodTrend === 'concerning') riskLevel = 'critical';
    else if (averageMood < 40 || moodTrend === 'declining') riskLevel = 'high';
    else if (averageMood < 60 || volatility > 20) riskLevel = 'medium';

    return {
      timeframe,
      moodTrend,
      averageMood: Math.round(averageMood),
      volatility: Math.round(volatility),
      riskLevel,
      recommendations: this.generateRecommendations(riskLevel, { categories: {} } as any),
      interventionNeeded: riskLevel === 'critical' || riskLevel === 'high'
    };
  }

  getAnalysisResult(noteId: string): any {
    return this.analysisResults.get(noteId);
  }

  getUserInterventions(userId: string): ProactiveIntervention[] {
    return this.interventions.get(userId) || [];
  }

  getSupportedLanguages(): LanguageSupport[] {
    return Array.from(this.supportedLanguages.values());
  }

  // Privacy controls
  enablePrivacyMode(enabled: boolean): void {
    this.privacyMode = enabled;
    this.emit('privacy:updated', { enabled });
  }

  deleteUserData(userId: string): void {
    // Remove all user data
    this.userMoodHistory.delete(userId);
    this.interventions.delete(userId);
    
    // Remove voice notes
    Array.from(this.voiceNotes.entries())
      .filter(([_, note]) => note.userId === userId)
      .forEach(([noteId, _]) => {
        this.voiceNotes.delete(noteId);
        this.analysisResults.delete(noteId);
      });

    this.emit('data:deleted', { userId });
  }
}

// Export singleton instance
export const voiceSentimentAnalyzer = new VoiceSentimentAnalyzer({
  speechKey: process.env.AZURE_SPEECH_KEY || 'demo-key',
  speechRegion: process.env.AZURE_SPEECH_REGION || 'eastus',
  textAnalyticsKey: process.env.AZURE_TEXT_ANALYTICS_KEY || 'demo-key',
  textAnalyticsEndpoint: process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || 'https://demo.cognitiveservices.azure.com/',
  languageKey: process.env.AZURE_LANGUAGE_KEY || 'demo-key',
  languageEndpoint: process.env.AZURE_LANGUAGE_ENDPOINT || 'https://demo.cognitiveservices.azure.com/'
});

export default VoiceSentimentAnalyzer;
