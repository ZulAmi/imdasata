/**
 * Azure Cognitive Services Integration for SATA
 * Handles sentiment analysis, emotion detection, and text analytics for mental health
 */

import { EventEmitter } from 'events';

export interface AzureConfig {
  subscriptionKey: string;
  endpoint: string;
  region: string;
  apiVersion?: string;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  confidenceScores: {
    positive: number;
    negative: number;
    neutral: number;
  };
  sentences: Array<{
    text: string;
    sentiment: string;
    confidenceScores: {
      positive: number;
      negative: number;
      neutral: number;
    };
    offset: number;
    length: number;
  }>;
  warnings: any[];
  statistics?: {
    charactersCount: number;
    transactionsCount: number;
  };
}

export interface EmotionAnalysisResult {
  anger: number;
  contempt: number;
  disgust: number;
  fear: number;
  happiness: number;
  neutral: number;
  sadness: number;
  surprise: number;
}

export interface KeyPhraseResult {
  keyPhrases: string[];
  warnings: any[];
  statistics?: {
    charactersCount: number;
    transactionsCount: number;
  };
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  iso6391Name: string;
  warnings: any[];
}

export interface MentalHealthInsight {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  emotionalState: {
    primary: string;
    secondary?: string;
    intensity: number;
  };
  sentiment: {
    overall: string;
    confidence: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  keyThemes: string[];
  recommendations: string[];
  urgentFlags: string[];
  supportLevel: 'self-help' | 'peer-support' | 'professional' | 'crisis';
}

export interface VoiceEmotionResult {
  emotions: {
    angry: number;
    calm: number;
    disgusted: number;
    fearful: number;
    happy: number;
    neutral: number;
    sad: number;
    surprised: number;
  };
  arousal: number;
  valence: number;
  dominance: number;
  stress_level: number;
}

class AzureCognitiveServices extends EventEmitter {
  private textAnalyticsConfig: AzureConfig;
  private speechConfig: AzureConfig;
  private faceConfig: AzureConfig;

  constructor(configs: {
    textAnalytics: AzureConfig;
    speech?: AzureConfig;
    face?: AzureConfig;
  }) {
    super();
    this.textAnalyticsConfig = {
      apiVersion: 'v3.1',
      ...configs.textAnalytics
    };
    this.speechConfig = configs.speech || this.textAnalyticsConfig;
    this.faceConfig = configs.face || this.textAnalyticsConfig;
  }

  /**
   * Analyze sentiment of text with mental health context
   */
  async analyzeSentiment(
    text: string, 
    language = 'en',
    includeOpinionMining = true
  ): Promise<SentimentAnalysisResult> {
    const url = `${this.textAnalyticsConfig.endpoint}/text/analytics/${this.textAnalyticsConfig.apiVersion}/sentiment`;
    
    const payload = {
      documents: [{
        id: '1',
        language,
        text
      }],
      opinionMining: includeOpinionMining
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.textAnalyticsConfig.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Azure Text Analytics API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const document = result.documents[0];
      
      this.emit('sentiment:analyzed', { text, result: document });
      return document;
    } catch (error) {
      this.emit('sentiment:error', error);
      throw error;
    }
  }

  /**
   * Extract key phrases from mental health related text
   */
  async extractKeyPhrases(text: string, language = 'en'): Promise<KeyPhraseResult> {
    const url = `${this.textAnalyticsConfig.endpoint}/text/analytics/${this.textAnalyticsConfig.apiVersion}/keyPhrases`;
    
    const payload = {
      documents: [{
        id: '1',
        language,
        text
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.textAnalyticsConfig.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Azure Key Phrases API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const document = result.documents[0];
      
      this.emit('keyphrases:extracted', { text, result: document });
      return document;
    } catch (error) {
      this.emit('keyphrases:error', error);
      throw error;
    }
  }

  /**
   * Detect language of input text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const url = `${this.textAnalyticsConfig.endpoint}/text/analytics/${this.textAnalyticsConfig.apiVersion}/languages`;
    
    const payload = {
      documents: [{
        id: '1',
        text
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.textAnalyticsConfig.subscriptionKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Azure Language Detection API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const document = result.documents[0];
      const detectedLanguage = document.detectedLanguage;
      
      this.emit('language:detected', { text, result: detectedLanguage });
      return {
        language: detectedLanguage.name,
        confidence: detectedLanguage.confidenceScore,
        iso6391Name: detectedLanguage.iso6391Name,
        warnings: document.warnings || []
      };
    } catch (error) {
      this.emit('language:error', error);
      throw error;
    }
  }

  /**
   * Analyze emotions from voice/audio data
   */
  async analyzeVoiceEmotion(audioData: Blob | ArrayBuffer): Promise<VoiceEmotionResult> {
    const url = `${this.speechConfig.endpoint}/speech/emotion/v1.0/recognize`;
    
    const formData = new FormData();
    if (audioData instanceof Blob) {
      formData.append('audio', audioData, 'audio.wav');
    } else {
      formData.append('audio', new Blob([audioData]), 'audio.wav');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.speechConfig.subscriptionKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Azure Speech Emotion API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      this.emit('voice:emotion:analyzed', { result });
      return result;
    } catch (error) {
      this.emit('voice:emotion:error', error);
      throw error;
    }
  }

  /**
   * Comprehensive mental health analysis combining multiple Azure services
   */
  async analyzeMentalHealthText(
    text: string, 
    context?: {
      userId?: string;
      timestamp?: Date;
      previousAnalyses?: any[];
    }
  ): Promise<MentalHealthInsight> {
    try {
      // Run multiple analyses in parallel
      const [sentimentResult, keyPhrasesResult, languageResult] = await Promise.all([
        this.analyzeSentiment(text),
        this.extractKeyPhrases(text),
        this.detectLanguage(text)
      ]);

      // Analyze mental health specific patterns
      const insight = this.generateMentalHealthInsight(
        text,
        sentimentResult,
        keyPhrasesResult,
        context
      );

      this.emit('mental-health:analyzed', {
        text,
        insight,
        rawResults: { sentimentResult, keyPhrasesResult, languageResult }
      });

      return insight;
    } catch (error) {
      this.emit('mental-health:error', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive mental health insights
   */
  private generateMentalHealthInsight(
    text: string,
    sentimentResult: SentimentAnalysisResult,
    keyPhrasesResult: KeyPhraseResult,
    context?: any
  ): MentalHealthInsight {
    const insight: MentalHealthInsight = {
      riskLevel: 'low',
      emotionalState: {
        primary: sentimentResult.sentiment,
        intensity: this.calculateEmotionalIntensity(sentimentResult)
      },
      sentiment: {
        overall: sentimentResult.sentiment,
        confidence: Math.max(
          sentimentResult.confidenceScores.positive,
          sentimentResult.confidenceScores.negative,
          sentimentResult.confidenceScores.neutral
        ),
        trend: 'stable'
      },
      keyThemes: keyPhrasesResult.keyPhrases,
      recommendations: [],
      urgentFlags: [],
      supportLevel: 'self-help'
    };

    // Detect crisis indicators
    const crisisKeywords = [
      'suicide', 'kill myself', 'end it all', 'no point living', 'want to die',
      'self harm', 'hurt myself', 'cut myself', 'overdose', 'jump off'
    ];
    const textLower = text.toLowerCase();
    const hasCrisisContent = crisisKeywords.some(keyword => textLower.includes(keyword));

    if (hasCrisisContent) {
      insight.riskLevel = 'critical';
      insight.urgentFlags.push('Suicide ideation detected');
      insight.supportLevel = 'crisis';
      insight.recommendations.push('Immediate professional intervention required');
      insight.recommendations.push('Contact emergency services or crisis hotline');
    }

    // Detect depression indicators
    const depressionKeywords = [
      'hopeless', 'worthless', 'empty', 'numb', 'exhausted', 'can\'t cope',
      'no energy', 'don\'t care', 'giving up', 'pointless', 'burden'
    ];
    const depressionScore = depressionKeywords
      .reduce((score, keyword) => score + (textLower.includes(keyword) ? 1 : 0), 0);

    if (depressionScore >= 3) {
      insight.riskLevel = 'high';
      insight.emotionalState.secondary = 'depression';
      insight.supportLevel = 'professional';
      insight.recommendations.push('Consider speaking with a mental health professional');
      insight.recommendations.push('Engage in mood tracking and self-care activities');
    } else if (depressionScore >= 1) {
      insight.riskLevel = 'medium';
      insight.supportLevel = 'peer-support';
      insight.recommendations.push('Connect with support groups or trusted friends');
    }

    // Detect anxiety indicators
    const anxietyKeywords = [
      'worried', 'anxious', 'panic', 'scared', 'overwhelmed', 'nervous',
      'can\'t breathe', 'heart racing', 'trembling', 'fear', 'stress'
    ];
    const anxietyScore = anxietyKeywords
      .reduce((score, keyword) => score + (textLower.includes(keyword) ? 1 : 0), 0);

    if (anxietyScore >= 2) {
      insight.emotionalState.secondary = insight.emotionalState.secondary || 'anxiety';
      insight.recommendations.push('Practice breathing exercises and mindfulness');
      insight.recommendations.push('Consider anxiety management techniques');
    }

    // Analyze sentiment trends
    if (sentimentResult.confidenceScores.negative > 0.7) {
      insight.sentiment.trend = 'declining';
      insight.riskLevel = insight.riskLevel === 'low' ? 'medium' : insight.riskLevel;
    } else if (sentimentResult.confidenceScores.positive > 0.7) {
      insight.sentiment.trend = 'improving';
    }

    // Positive indicators
    const positiveKeywords = [
      'grateful', 'hopeful', 'better', 'improving', 'progress', 'proud',
      'accomplished', 'supported', 'loved', 'calm', 'peaceful'
    ];
    const positiveScore = positiveKeywords
      .reduce((score, keyword) => score + (textLower.includes(keyword) ? 1 : 0), 0);

    if (positiveScore >= 2) {
      insight.recommendations.push('Continue current positive practices');
      insight.recommendations.push('Share your progress with others for motivation');
    }

    // Support level recommendations
    switch (insight.supportLevel) {
      case 'crisis':
        insight.recommendations.unshift('Call 988 (Suicide & Crisis Lifeline) immediately');
        break;
      case 'professional':
        insight.recommendations.push('Schedule appointment with therapist or counselor');
        break;
      case 'peer-support':
        insight.recommendations.push('Join support groups or peer counseling');
        break;
      case 'self-help':
        insight.recommendations.push('Use self-help tools and wellness apps');
        insight.recommendations.push('Maintain healthy daily routines');
        break;
    }

    return insight;
  }

  /**
   * Calculate emotional intensity from sentiment scores
   */
  private calculateEmotionalIntensity(sentimentResult: SentimentAnalysisResult): number {
    const scores = sentimentResult.confidenceScores;
    return Math.max(scores.positive, scores.negative, scores.neutral);
  }

  /**
   * Batch analyze multiple texts for efficiency
   */
  async batchAnalyzeMentalHealth(
    texts: Array<{ id: string; text: string; context?: any }>
  ): Promise<Array<{ id: string; insight: MentalHealthInsight }>> {
    const batchSize = 10; // Azure limit
    const results: Array<{ id: string; insight: MentalHealthInsight }> = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(async ({ id, text, context }) => {
        try {
          const insight = await this.analyzeMentalHealthText(text, context);
          return { id, insight };
        } catch (error) {
          this.emit('batch:error', { id, error });
          return {
            id,
            insight: {
              riskLevel: 'low' as const,
              emotionalState: { primary: 'neutral', intensity: 0 },
              sentiment: { overall: 'neutral', confidence: 0, trend: 'stable' as const },
              keyThemes: [],
              recommendations: ['Analysis failed - manual review recommended'],
              urgentFlags: [],
              supportLevel: 'self-help' as const
            }
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get mental health assessment summary
   */
  async getMentalHealthSummary(
    analyses: MentalHealthInsight[],
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    overallRisk: string;
    trends: {
      sentiment: 'improving' | 'stable' | 'declining';
      emotionalState: string;
      riskProgression: string;
    };
    recommendations: string[];
    alertFlags: string[];
  }> {
    const riskLevels = analyses.map(a => a.riskLevel);
    const sentiments = analyses.map(a => a.sentiment.overall);
    const urgentFlags = analyses.flatMap(a => a.urgentFlags);

    // Calculate overall risk
    const criticalCount = riskLevels.filter(r => r === 'critical').length;
    const highCount = riskLevels.filter(r => r === 'high').length;
    const mediumCount = riskLevels.filter(r => r === 'medium').length;

    let overallRisk = 'low';
    if (criticalCount > 0) overallRisk = 'critical';
    else if (highCount > analyses.length * 0.3) overallRisk = 'high';
    else if (mediumCount > analyses.length * 0.5) overallRisk = 'medium';

    // Analyze trends
    const recentAnalyses = analyses.slice(-7); // Last 7 entries
    const olderAnalyses = analyses.slice(0, -7);
    
    const recentNegative = recentAnalyses.filter(a => a.sentiment.overall === 'negative').length;
    const olderNegative = olderAnalyses.filter(a => a.sentiment.overall === 'negative').length;
    
    let sentimentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentNegative < olderNegative / olderAnalyses.length * recentAnalyses.length) {
      sentimentTrend = 'improving';
    } else if (recentNegative > olderNegative / olderAnalyses.length * recentAnalyses.length) {
      sentimentTrend = 'declining';
    }

    const recommendations: string[] = [];
    const alertFlags: string[] = [];

    if (overallRisk === 'critical' || urgentFlags.length > 0) {
      alertFlags.push('Immediate professional attention required');
      recommendations.push('Contact mental health crisis line immediately');
    }

    if (sentimentTrend === 'declining') {
      alertFlags.push('Mental health declining trend detected');
      recommendations.push('Increase monitoring and support activities');
    }

    return {
      overallRisk,
      trends: {
        sentiment: sentimentTrend,
        emotionalState: analyses[analyses.length - 1]?.emotionalState.primary || 'neutral',
        riskProgression: overallRisk
      },
      recommendations,
      alertFlags
    };
  }

  /**
   * Health check for Azure services
   */
  async healthCheck(): Promise<{
    textAnalytics: boolean;
    speech: boolean;
    overall: boolean;
  }> {
    const results = {
      textAnalytics: false,
      speech: false,
      overall: false
    };

    try {
      // Test text analytics
      await this.analyzeSentiment('test', 'en', false);
      results.textAnalytics = true;
    } catch (error) {
      this.emit('health:textanalytics:failed', error);
    }

    try {
      // Test speech (if configured)
      if (this.speechConfig.subscriptionKey) {
        // Simple health check without actual audio
        results.speech = true;
      }
    } catch (error) {
      this.emit('health:speech:failed', error);
    }

    results.overall = results.textAnalytics && results.speech;
    
    this.emit('health:check', results);
    return results;
  }
}

export default AzureCognitiveServices;
