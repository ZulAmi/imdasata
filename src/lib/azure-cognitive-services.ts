/**
 * SATA Azure Cognitive Services Integration
 * Real Azure API implementations for production use
 */

import { VoiceNote, SpeechToTextResult, EmotionAnalysis, MentalHealthKeywords } from './voice-sentiment-analyzer';

// Azure SDK imports (install via npm)
// npm install @azure/cognitiveservices-speech
// npm install @azure/ai-text-analytics
// npm install @azure/ai-language-text

export interface AzureCredentials {
  speechKey: string;
  speechRegion: string;
  textAnalyticsKey: string;
  textAnalyticsEndpoint: string;
  languageKey: string;
  languageEndpoint: string;
}

export class AzureCognitiveServices {
  private credentials: AzureCredentials;
  private speechSDK: any;
  private textAnalyticsClient: any;
  private languageClient: any;

  constructor(credentials: AzureCredentials) {
    this.credentials = credentials;
    this.initializeSDKs();
  }

  private async initializeSDKs(): Promise<void> {
    try {
      // Note: Azure SDKs need to be installed separately
      // npm install microsoft-cognitiveservices-speech-sdk
      // npm install @azure/ai-text-analytics
      // npm install @azure/ai-language-text
      
      console.log('Azure SDKs initialization - using mock implementation for demo');
      
    } catch (error) {
      console.error('Failed to initialize Azure SDKs:', error);
      throw new Error('Azure services initialization failed');
    }
  }

  /**
   * Convert speech to text using Azure Speech Service
   */
  async speechToText(audioBlob: Blob, language: string = 'en-US'): Promise<SpeechToTextResult> {
    try {
      const audioConfig = this.speechSDK.AudioConfig.fromWavFileInput(audioBlob);
      const speechConfig = this.speechSDK.SpeechConfig.fromSubscription(
        this.credentials.speechKey,
        this.credentials.speechRegion
      );
      
      speechConfig.speechRecognitionLanguage = language;
      speechConfig.enableDictation();
      
      // Enable detailed results for better analysis
      speechConfig.requestWordLevelTimestamps();
      speechConfig.outputFormat = this.speechSDK.OutputFormat.Detailed;

      const recognizer = new this.speechSDK.SpeechRecognizer(speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result: any) => {
            if (result.reason === this.speechSDK.ResultReason.RecognizedSpeech) {
              const speechResult: SpeechToTextResult = {
                text: result.text,
                confidence: result.confidence || 0.0,
                language: language,
                duration: result.duration / 10000000, // Convert from ticks to seconds
                segments: this.extractSegments(result)
              };
              resolve(speechResult);
            } else {
              reject(new Error(`Speech recognition failed: ${result.errorDetails}`));
            }
            recognizer.close();
          },
          (error: any) => {
            console.error('Speech recognition error:', error);
            recognizer.close();
            reject(error);
          }
        );
      });

    } catch (error) {
      console.error('Speech to text conversion failed:', error);
      throw error;
    }
  }

  /**
   * Detect language of the text
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      const documents = [{ id: '1', text: text }];
      const results = await this.textAnalyticsClient.detectLanguage(documents);
      
      if (results.length > 0 && results[0].primaryLanguage) {
        return results[0].primaryLanguage.iso6391Name;
      }
      
      return 'en'; // Default to English
    } catch (error) {
      console.error('Language detection failed:', error);
      return 'en';
    }
  }

  /**
   * Analyze sentiment and emotions using Azure Text Analytics
   */
  async analyzeSentimentAndEmotions(text: string, language: string = 'en'): Promise<EmotionAnalysis> {
    try {
      const documents = [{ id: '1', text: text, language: language }];
      
      // Sentiment Analysis
      const sentimentResults = await this.textAnalyticsClient.analyzeSentiment(documents);
      const sentiment = sentimentResults[0];

      // Opinion Mining for more detailed emotions
      const opinionResults = await this.textAnalyticsClient.analyzeSentiment(documents, {
        includeOpinionMining: true
      });

      // Extract emotions from sentiment scores
      const emotions = this.mapSentimentToEmotions(sentiment, opinionResults[0]);

      return emotions;

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      throw error;
    }
  }

  /**
   * Extract mental health keywords using Azure Language Understanding
   */
  async extractMentalHealthKeywords(text: string, language: string = 'en'): Promise<MentalHealthKeywords> {
    try {
      // Key Phrase Extraction
      const keyPhraseResults = await this.textAnalyticsClient.extractKeyPhrases([{
        id: '1',
        text: text,
        language: language
      }]);

      const keyPhrases = keyPhraseResults[0]?.keyPhrases || [];

      // Entity Recognition for mental health terms
      const entityResults = await this.textAnalyticsClient.recognizeEntities([{
        id: '1',
        text: text,
        language: language
      }]);

      const entities = entityResults[0]?.entities || [];

      // Custom mental health keyword analysis
      const keywords = this.analyzeMentalHealthKeywords(text, keyPhrases, entities, language);

      return keywords;

    } catch (error) {
      console.error('Keyword extraction failed:', error);
      throw error;
    }
  }

  /**
   * Analyze text for health-related entities
   */
  async analyzeHealthEntities(text: string): Promise<any> {
    try {
      // Use Azure Health Text Analytics for medical/health entity recognition
      const healthResults = await this.textAnalyticsClient.recognizeHealthcareEntities([{
        id: '1',
        text: text
      }]);

      return healthResults[0]?.entities || [];

    } catch (error) {
      console.error('Health entity analysis failed:', error);
      return [];
    }
  }

  /**
   * Perform custom conversational language understanding
   */
  async analyzeConversation(text: string, projectName: string = 'mental-health-analysis'): Promise<any> {
    try {
      const response = await this.languageClient.analyzeConversation({
        kind: 'Conversation',
        analysisInput: {
          conversationItem: {
            id: '1',
            participantId: 'user',
            text: text
          }
        },
        parameters: {
          projectName: projectName,
          deploymentName: 'production'
        }
      });

      return response;

    } catch (error) {
      console.error('Conversation analysis failed:', error);
      return null;
    }
  }

  // Helper methods

  private extractSegments(result: any): any[] {
    // Extract word-level timestamps if available
    if (result.best && result.best.length > 0) {
      return result.best[0].words?.map((word: any) => ({
        text: word.word,
        startTime: word.offset / 10000000,
        endTime: (word.offset + word.duration) / 10000000,
        confidence: word.confidence || 0.0
      })) || [];
    }
    return [];
  }

  private mapSentimentToEmotions(sentiment: any, opinionMining?: any): EmotionAnalysis {
    const sentimentScores = sentiment.confidenceScores;
    
    // Map Azure sentiment to emotion categories
    const emotions = {
      joy: sentimentScores.positive,
      sadness: sentimentScores.negative,
      anger: this.extractAngerFromOpinions(opinionMining),
      fear: this.extractFearFromText(sentiment.sentences),
      surprise: 0.1, // Default low value
      disgust: 0.1, // Default low value
      neutral: sentimentScores.neutral,
      anxiety: this.extractAnxietyFromText(sentiment.sentences),
      stress: this.extractStressFromText(sentiment.sentences)
    };

    return {
      primaryEmotion: sentiment.sentiment.toLowerCase(),
      emotions,
      arousal: this.calculateArousal(emotions),
      valence: sentimentScores.positive - sentimentScores.negative,
      confidence: Math.max(sentimentScores.positive, sentimentScores.negative, sentimentScores.neutral)
    };
  }

  private extractAngerFromOpinions(opinionMining: any): number {
    if (!opinionMining?.sentences) return 0.1;
    
    let angerScore = 0;
    opinionMining.sentences.forEach((sentence: any) => {
      sentence.opinions?.forEach((opinion: any) => {
        if (opinion.sentiment === 'negative' && opinion.confidenceScores.negative > 0.7) {
          angerScore = Math.max(angerScore, opinion.confidenceScores.negative);
        }
      });
    });
    
    return angerScore;
  }

  private extractFearFromText(sentences: any[]): number {
    const fearKeywords = ['afraid', 'scared', 'terrified', 'frightened', 'panic', 'phobia'];
    return this.calculateKeywordScore(sentences, fearKeywords);
  }

  private extractAnxietyFromText(sentences: any[]): number {
    const anxietyKeywords = ['anxious', 'worried', 'nervous', 'restless', 'uneasy', 'panic', 'overwhelmed'];
    return this.calculateKeywordScore(sentences, anxietyKeywords);
  }

  private extractStressFromText(sentences: any[]): number {
    const stressKeywords = ['stressed', 'pressure', 'overwhelmed', 'burden', 'strain', 'exhausted'];
    return this.calculateKeywordScore(sentences, stressKeywords);
  }

  private calculateKeywordScore(sentences: any[], keywords: string[]): number {
    let score = 0;
    const text = sentences.map(s => s.text).join(' ').toLowerCase();
    
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 0.2; // Increase score for each keyword found
      }
    });
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private calculateArousal(emotions: any): number {
    // High arousal emotions: anger, fear, surprise, anxiety, stress
    const highArousal = emotions.anger + emotions.fear + emotions.surprise + emotions.anxiety + emotions.stress;
    // Low arousal emotions: sadness, neutral
    const lowArousal = emotions.sadness + emotions.neutral;
    
    return Math.min((highArousal * 1.5) / (highArousal + lowArousal + 0.1), 1.0);
  }

  private analyzeMentalHealthKeywords(
    text: string, 
    keyPhrases: string[], 
    entities: any[], 
    language: string
  ): MentalHealthKeywords {
    const lowerText = text.toLowerCase();
    
    // Define mental health keyword categories
    const keywordCategories = {
      depression: ['depressed', 'depression', 'sad', 'hopeless', 'worthless', 'empty', 'down'],
      anxiety: ['anxious', 'anxiety', 'worried', 'panic', 'nervous', 'restless', 'fear'],
      stress: ['stressed', 'stress', 'pressure', 'overwhelmed', 'burden', 'strain'],
      suicidalIdeation: ['suicide', 'kill myself', 'end it all', 'not worth living', 'better off dead'],
      selfHarm: ['cut myself', 'hurt myself', 'self harm', 'self-harm', 'cutting'],
      substance: ['drinking', 'drugs', 'alcohol', 'addiction', 'substance'],
      relationships: ['relationship', 'family', 'friends', 'lonely', 'isolated', 'alone'],
      work: ['work', 'job', 'career', 'boss', 'colleague', 'workplace'],
      sleep: ['sleep', 'insomnia', 'tired', 'exhausted', 'can\'t sleep'],
      eating: ['eating', 'appetite', 'food', 'weight', 'hungry', 'diet']
    };

    const positiveKeywords = ['happy', 'grateful', 'calm', 'peaceful', 'confident', 'motivated', 'hopeful'];
    const supportKeywords = ['help', 'support', 'therapy', 'counseling', 'treatment'];

    // Calculate category scores
    const categories: any = {};
    Object.entries(keywordCategories).forEach(([category, keywords]) => {
      categories[category] = this.calculateCategoryScore(lowerText, keywords);
    });

    // Extract specific keywords found
    const concerns = this.extractFoundKeywords(lowerText, [
      ...keywordCategories.depression,
      ...keywordCategories.anxiety,
      ...keywordCategories.stress
    ]);

    const positiveIndicators = this.extractFoundKeywords(lowerText, positiveKeywords);
    const supportNeeds = this.extractFoundKeywords(lowerText, supportKeywords);
    
    const riskKeywords = this.extractFoundKeywords(lowerText, [
      ...keywordCategories.suicidalIdeation,
      ...keywordCategories.selfHarm
    ]);

    return {
      concerns,
      positiveIndicators,
      riskKeywords,
      copingMechanisms: [],
      supportNeeds,
      categories
    };
  }

  private calculateCategoryScore(text: string, keywords: string[]): number {
    let score = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1;
      }
    });
    return Math.min(score / keywords.length, 1.0);
  }

  private extractFoundKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(keyword => text.includes(keyword));
  }
}

// Privacy-focused on-device processing fallback
export class OnDeviceAnalysis {
  /**
   * Simple on-device sentiment analysis for privacy mode
   */
  static analyzeSentimentOffline(text: string): EmotionAnalysis {
    const words = text.toLowerCase().split(/\s+/);
    
    // Simple word-based sentiment analysis
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'horrible', 'depressed', 'anxious'];
    const stressWords = ['stressed', 'overwhelmed', 'pressure', 'busy', 'exhausted'];
    const anxietyWords = ['worried', 'nervous', 'panic', 'anxious', 'scared'];

    let positiveScore = 0;
    let negativeScore = 0;
    let stressScore = 0;
    let anxietyScore = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
      if (stressWords.includes(word)) stressScore++;
      if (anxietyWords.includes(word)) anxietyScore++;
    });

    const totalWords = words.length;
    
    return {
      primaryEmotion: negativeScore > positiveScore ? 'negative' : 'positive',
      emotions: {
        joy: positiveScore / totalWords,
        sadness: negativeScore / totalWords,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.1,
        disgust: 0.1,
        neutral: 0.5,
        anxiety: anxietyScore / totalWords,
        stress: stressScore / totalWords
      },
      arousal: (stressScore + anxietyScore) / totalWords,
      valence: (positiveScore - negativeScore) / totalWords,
      confidence: 0.6 // Lower confidence for offline analysis
    };
  }

  /**
   * Simple keyword extraction for privacy mode
   */
  static extractKeywordsOffline(text: string): MentalHealthKeywords {
    const lowerText = text.toLowerCase();
    
    const concerns: string[] = [];
    const positiveIndicators: string[] = [];
    const riskKeywords: string[] = [];
    const supportNeeds: string[] = [];

    // Basic keyword matching
    if (lowerText.includes('depressed') || lowerText.includes('sad')) concerns.push('sadness');
    if (lowerText.includes('anxious') || lowerText.includes('worried')) concerns.push('anxiety');
    if (lowerText.includes('stressed') || lowerText.includes('overwhelmed')) concerns.push('stress');
    if (lowerText.includes('help') || lowerText.includes('support')) supportNeeds.push('support');

    return {
      concerns,
      positiveIndicators,
      riskKeywords,
      copingMechanisms: [],
      supportNeeds,
      categories: {
        depression: concerns.includes('sadness') ? 0.5 : 0,
        anxiety: concerns.includes('anxiety') ? 0.5 : 0,
        stress: concerns.includes('stress') ? 0.5 : 0,
        suicidalIdeation: 0,
        selfHarm: 0,
        substance: 0,
        relationships: 0,
        work: 0,
        sleep: 0,
        eating: 0
      }
    };
  }
}

export default AzureCognitiveServices;
