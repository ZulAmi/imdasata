/**
 * Google Translate API Integration for SATA
 * Real-time translation for multilingual mental health support
 */

import { EventEmitter } from 'events';

export interface GoogleTranslateConfig {
  apiKey: string;
  projectId?: string;
  location?: string;
  apiVersion?: string;
  baseUrl?: string;
}

export interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  confidence?: number;
  model?: string;
  glossaryConfig?: any;
}

export interface LanguageDetectionResult {
  language: string;
  confidence: number;
  isReliable: boolean;
}

export interface SupportedLanguage {
  language: string;
  name: string;
  supportSource: boolean;
  supportTarget: boolean;
}

export interface MentalHealthGlossary {
  [key: string]: {
    [targetLanguage: string]: string;
  };
}

export interface TranslationBatch {
  id: string;
  sourceLanguage: string;
  targetLanguage: string;
  texts: string[];
  results?: TranslationResult[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: Date;
}

class GoogleTranslateAPI extends EventEmitter {
  private config: GoogleTranslateConfig;
  private cache: Map<string, TranslationResult> = new Map();
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // 1 minute

  // Mental health specific terminology glossary
  private mentalHealthGlossary: MentalHealthGlossary = {
    'anxiety': {
      'es': 'ansiedad',
      'fr': 'anxiété',
      'de': 'Angst',
      'pt': 'ansiedade',
      'zh': '焦虑',
      'ja': '不安',
      'ko': '불안',
      'ar': 'قلق',
      'hi': 'चिंता',
      'bn': 'উদ্বেগ',
      'ta': 'கவலை',
      'my': 'စိတ်ပူပန်မှု',
      'id': 'kecemasan'
    },
    'depression': {
      'es': 'depresión',
      'fr': 'dépression',
      'de': 'Depression',
      'pt': 'depressão',
      'zh': '抑郁症',
      'ja': 'うつ病',
      'ko': '우울증',
      'ar': 'اكتئاب',
      'hi': 'अवसाद',
      'bn': 'বিষণ্নতা',
      'ta': 'மனச்சோர்வு',
      'my': 'စိတ်ကျရောဂါ',
      'id': 'depresi'
    },
    'therapy': {
      'es': 'terapia',
      'fr': 'thérapie',
      'de': 'Therapie',
      'pt': 'terapia',
      'zh': '治疗',
      'ja': '治療',
      'ko': '치료',
      'ar': 'علاج',
      'hi': 'चिकित्सा',
      'bn': 'থেরাপি',
      'ta': 'சிகிச்சை',
      'my': 'ကုသမှု',
      'id': 'terapi'
    },
    'mental health': {
      'es': 'salud mental',
      'fr': 'santé mentale',
      'de': 'psychische Gesundheit',
      'pt': 'saúde mental',
      'zh': '心理健康',
      'ja': 'メンタルヘルス',
      'ko': '정신 건강',
      'ar': 'الصحة النفسية',
      'hi': 'मानसिक स्वास्थ्य',
      'bn': 'মানসিক স্বাস্থ্য',
      'ta': 'மனநலம்',
      'my': 'စိတ်ကျန်းမာရေး',
      'id': 'kesehatan mental'
    },
    'counseling': {
      'es': 'consejería',
      'fr': 'conseil',
      'de': 'Beratung',
      'pt': 'aconselhamento',
      'zh': '咨询',
      'ja': 'カウンセリング',
      'ko': '상담',
      'ar': 'استشارة',
      'hi': 'परामर्श',
      'bn': 'পরামর্শ',
      'ta': 'ஆலோசனை',
      'my': 'အကြံပေးခြင်း',
      'id': 'konseling'
    },
    'suicide': {
      'es': 'suicidio',
      'fr': 'suicide',
      'de': 'Selbstmord',
      'pt': 'suicídio',
      'zh': '自杀',
      'ja': '自殺',
      'ko': '자살',
      'ar': 'انتحار',
      'hi': 'आत्महत्या',
      'bn': 'আত্মহত্যা',
      'ta': 'தற்கொலை',
      'my': 'သတ်သေခြင်း',
      'id': 'bunuh diri'
    }
  };

  constructor(config: GoogleTranslateConfig) {
    super();
    this.config = {
      apiVersion: 'v2',
      baseUrl: 'https://translation.googleapis.com',
      ...config
    };
  }

  /**
   * Translate text with mental health context awareness
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
    options?: {
      format?: 'text' | 'html';
      model?: 'base' | 'nmt';
      preserveMentalHealthTerms?: boolean;
      useCache?: boolean;
    }
  ): Promise<TranslationResult> {
    const cacheKey = `${text}-${sourceLanguage || 'auto'}-${targetLanguage}`;
    
    // Check cache first
    if (options?.useCache !== false && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.emit('translation:cache-hit', { text, targetLanguage, cached });
      return cached;
    }

    return this.executeWithRateLimit(async () => {
      try {
        // Pre-process text for mental health terms if enabled
        let processedText = text;
        let termMapping: Map<string, string> = new Map();
        
        if (options?.preserveMentalHealthTerms) {
          const result = this.preprocessMentalHealthTerms(text, targetLanguage);
          processedText = result.processedText;
          termMapping = result.termMapping;
        }

        const url = `${this.config.baseUrl}/${this.config.apiVersion}/translate`;
        const params = new URLSearchParams({
          key: this.config.apiKey,
          q: processedText,
          target: targetLanguage,
          format: options?.format || 'text',
          model: options?.model || 'nmt'
        });

        if (sourceLanguage) {
          params.append('source', sourceLanguage);
        }

        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Google Translate API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const translation = result.data.translations[0];

        let translatedText = translation.translatedText;
        
        // Post-process to restore mental health terms
        if (options?.preserveMentalHealthTerms && termMapping.size > 0) {
          translatedText = this.postprocessMentalHealthTerms(translatedText, termMapping);
        }

        const translationResult: TranslationResult = {
          translatedText,
          detectedSourceLanguage: translation.detectedSourceLanguage,
          model: options?.model || 'nmt'
        };

        // Cache the result
        this.cache.set(cacheKey, translationResult);
        
        this.emit('translation:completed', {
          originalText: text,
          targetLanguage,
          result: translationResult
        });

        return translationResult;
      } catch (error) {
        this.emit('translation:error', { text, targetLanguage, error });
        throw error;
      }
    });
  }

  /**
   * Detect the language of input text
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    return this.executeWithRateLimit(async () => {
      try {
        const url = `${this.config.baseUrl}/${this.config.apiVersion}/detect`;
        const params = new URLSearchParams({
          key: this.config.apiKey,
          q: text
        });

        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Google Translate Detection API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const detection = result.data.detections[0][0];

        const detectionResult: LanguageDetectionResult = {
          language: detection.language,
          confidence: detection.confidence,
          isReliable: detection.isReliable
        };

        this.emit('language:detected', { text, result: detectionResult });
        return detectionResult;
      } catch (error) {
        this.emit('language:detection:error', { text, error });
        throw error;
      }
    });
  }

  /**
   * Get list of supported languages
   */
  async getSupportedLanguages(target?: string): Promise<SupportedLanguage[]> {
    return this.executeWithRateLimit(async () => {
      try {
        const url = `${this.config.baseUrl}/${this.config.apiVersion}/languages`;
        const params = new URLSearchParams({
          key: this.config.apiKey
        });

        if (target) {
          params.append('target', target);
        }

        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Google Translate Languages API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const languages = result.data.languages.map((lang: any) => ({
          language: lang.language,
          name: lang.name || lang.language,
          supportSource: true,
          supportTarget: true
        }));

        this.emit('languages:fetched', { languages });
        return languages;
      } catch (error) {
        this.emit('languages:error', error);
        throw error;
      }
    });
  }

  /**
   * Batch translate multiple texts efficiently
   */
  async batchTranslate(
    texts: string[],
    targetLanguage: string,
    sourceLanguage?: string,
    options?: {
      preserveMentalHealthTerms?: boolean;
      batchSize?: number;
    }
  ): Promise<TranslationBatch> {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchSize = options?.batchSize || 10;
    const batch: TranslationBatch = {
      id: batchId,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      texts,
      status: 'pending',
      timestamp: new Date()
    };

    try {
      batch.status = 'processing';
      this.emit('batch:started', batch);

      const results: TranslationResult[] = [];
      
      for (let i = 0; i < texts.length; i += batchSize) {
        const textBatch = texts.slice(i, i + batchSize);
        const batchPromises = textBatch.map(text => 
          this.translateText(text, targetLanguage, sourceLanguage, {
            preserveMentalHealthTerms: options?.preserveMentalHealthTerms,
            useCache: true
          })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Rate limiting delay between batches
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      batch.results = results;
      batch.status = 'completed';
      
      this.emit('batch:completed', batch);
      return batch;
    } catch (error) {
      batch.status = 'error';
      this.emit('batch:error', { batch, error });
      throw error;
    }
  }

  /**
   * Translate mental health conversation in real-time
   */
  async translateConversation(
    messages: Array<{
      id: string;
      text: string;
      sender: 'user' | 'therapist' | 'system';
      timestamp: Date;
    }>,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<Array<{
    id: string;
    originalText: string;
    translatedText: string;
    sender: string;
    timestamp: Date;
  }>> {
    const translatedMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          const translation = await this.translateText(
            message.text,
            targetLanguage,
            sourceLanguage,
            { preserveMentalHealthTerms: true, useCache: true }
          );

          return {
            id: message.id,
            originalText: message.text,
            translatedText: translation.translatedText,
            sender: message.sender,
            timestamp: message.timestamp
          };
        } catch (error) {
          this.emit('conversation:translation:error', { message, error });
          return {
            id: message.id,
            originalText: message.text,
            translatedText: `[Translation Error: ${message.text}]`,
            sender: message.sender,
            timestamp: message.timestamp
          };
        }
      })
    );

    this.emit('conversation:translated', {
      originalLanguage: sourceLanguage,
      targetLanguage,
      messageCount: messages.length,
      translatedMessages
    });

    return translatedMessages;
  }

  /**
   * Get mental health crisis messages in multiple languages
   */
  async getCrisisMessagesMultiLanguage(): Promise<{
    [language: string]: {
      immediateHelp: string;
      hotlineNumber: string;
      supportMessage: string;
      breathingInstruction: string;
    };
  }> {
    const baseMessages = {
      immediateHelp: 'If you are in immediate danger, please call emergency services (911) right now.',
      hotlineNumber: 'For crisis support, call 988 (Suicide & Crisis Lifeline) available 24/7.',
      supportMessage: 'You are not alone. Help is available and things can get better.',
      breathingInstruction: 'Take slow, deep breaths. Breathe in for 4 counts, hold for 4, breathe out for 6.'
    };

    const languages = ['es', 'fr', 'de', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'bn', 'ta', 'my', 'id'];
    const translations: { [language: string]: any } = { en: baseMessages };

    for (const lang of languages) {
      try {
        const langTranslations: any = {};
        
        for (const [key, message] of Object.entries(baseMessages)) {
          const translation = await this.translateText(
            message,
            lang,
            'en',
            { preserveMentalHealthTerms: true, useCache: true }
          );
          langTranslations[key] = translation.translatedText;
        }
        
        translations[lang] = langTranslations;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.emit('crisis:translation:error', { language: lang, error });
        translations[lang] = baseMessages; // Fallback to English
      }
    }

    this.emit('crisis:messages:generated', { languages: Object.keys(translations) });
    return translations;
  }

  /**
   * Preprocess text to preserve mental health terminology
   */
  private preprocessMentalHealthTerms(
    text: string,
    targetLanguage: string
  ): { processedText: string; termMapping: Map<string, string> } {
    let processedText = text;
    const termMapping = new Map<string, string>();

    for (const [englishTerm, translations] of Object.entries(this.mentalHealthGlossary)) {
      if (translations[targetLanguage]) {
        const regex = new RegExp(`\\b${englishTerm}\\b`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
          matches.forEach((match, index) => {
            const placeholder = `__MHTERM_${englishTerm.toUpperCase().replace(/\s+/g, '_')}_${index}__`;
            termMapping.set(placeholder, translations[targetLanguage]);
            processedText = processedText.replace(match, placeholder);
          });
        }
      }
    }

    return { processedText, termMapping };
  }

  /**
   * Postprocess text to restore mental health terminology
   */
  private postprocessMentalHealthTerms(
    translatedText: string,
    termMapping: Map<string, string>
  ): string {
    let processedText = translatedText;
    
    for (const [placeholder, translation] of termMapping.entries()) {
      processedText = processedText.replace(new RegExp(placeholder, 'g'), translation);
    }

    return processedText;
  }

  /**
   * Rate limiting for API requests
   */
  private async executeWithRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process rate limit queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      // Check rate limit (100 requests per 100 seconds)
      if (Date.now() > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = Date.now() + 100000; // 100 seconds
      }

      if (this.requestCount >= 100) {
        const waitTime = this.resetTime - Date.now();
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const operation = this.rateLimitQueue.shift();
      if (operation) {
        this.requestCount++;
        await operation();
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: string;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: `${JSON.stringify(Array.from(this.cache.entries())).length} bytes`
    };
  }

  /**
   * Health check for Google Translate API
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      await this.translateText('health check', 'es', 'en', { useCache: false });
      const latency = Date.now() - startTime;
      
      this.emit('health:check:success', { latency });
      return { isHealthy: true, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.emit('health:check:failed', { latency, error });
      return {
        isHealthy: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default GoogleTranslateAPI;
