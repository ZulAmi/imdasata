/**
 * SATA Comprehensive Internationalization System
 * Supports multi-language mental health platform with cultural sensitivity
 */

import { EventEmitter } from 'events';

// Supported languages with cultural metadata
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  region: string;
  rtl: boolean;
  voiceSupported: boolean;
  culturalContext: 'western' | 'eastern' | 'southeast_asian' | 'south_asian';
  mentalHealthStigma: 'low' | 'medium' | 'high';
  familyOriented: boolean;
  formalityLevels: boolean;
  dateFormat: string;
  numberFormat: string;
  voiceCodes: string[];
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    region: 'global',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'western',
    mentalHealthStigma: 'low',
    familyOriented: false,
    formalityLevels: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
    voiceCodes: ['en-US', 'en-GB', 'en-AU']
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    region: 'china',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'eastern',
    mentalHealthStigma: 'high',
    familyOriented: true,
    formalityLevels: true,
    dateFormat: 'YYYY/MM/DD',
    numberFormat: 'zh-CN',
    voiceCodes: ['zh-CN', 'zh-TW', 'zh-HK']
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    region: 'bangladesh',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'south_asian',
    mentalHealthStigma: 'high',
    familyOriented: true,
    formalityLevels: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'bn-BD',
    voiceCodes: ['bn-BD', 'bn-IN']
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    region: 'tamil_nadu',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'south_asian',
    mentalHealthStigma: 'high',
    familyOriented: true,
    formalityLevels: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ta-IN',
    voiceCodes: ['ta-IN', 'ta-LK']
  },
  my: {
    code: 'my',
    name: 'Burmese',
    nativeName: 'မြန်မာ',
    region: 'myanmar',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'southeast_asian',
    mentalHealthStigma: 'high',
    familyOriented: true,
    formalityLevels: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'my-MM',
    voiceCodes: ['my-MM']
  },
  id: {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    region: 'indonesia',
    rtl: false,
    voiceSupported: true,
    culturalContext: 'southeast_asian',
    mentalHealthStigma: 'medium',
    familyOriented: true,
    formalityLevels: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'id-ID',
    voiceCodes: ['id-ID']
  }
};

// Translation namespace types
export interface TranslationNamespace {
  // Core UI elements
  common: Record<string, string>;
  navigation: Record<string, string>;
  forms: Record<string, string>;
  buttons: Record<string, string>;
  
  // Mental health specific
  mentalHealth: Record<string, string>;
  emotions: Record<string, string>;
  assessments: Record<string, string>;
  therapy: Record<string, string>;
  
  // Voice and audio
  voice: Record<string, string>;
  audio: Record<string, string>;
  
  // Privacy and consent
  privacy: Record<string, string>;
  consent: Record<string, string>;
  
  // Cultural adaptations
  cultural: Record<string, string>;
  family: Record<string, string>;
  
  // Error messages and feedback
  errors: Record<string, string>;
  feedback: Record<string, string>;
  
  // Date and time
  dates: Record<string, string>;
  time: Record<string, string>;
}

// Voice synthesis and recognition
export interface VoiceConfig {
  languageCode: string;
  voiceName: string;
  gender: 'male' | 'female' | 'neutral';
  culturalStyle: 'formal' | 'casual' | 'therapeutic';
  speed: number;
  pitch: number;
  emotion: 'calm' | 'warm' | 'professional';
}

// Cultural adaptation settings
export interface CulturalSettings {
  languageCode: string;
  formalityLevel: 'casual' | 'polite' | 'formal' | 'very_formal';
  mentalHealthApproach: 'direct' | 'gentle' | 'indirect' | 'metaphorical';
  familyInvolvement: 'individual' | 'family_aware' | 'family_centered';
  religionSensitivity: boolean;
  communityOriented: boolean;
  stigmaAware: boolean;
}

class InternationalizationSystem extends EventEmitter {
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';
  private translations: Map<string, TranslationNamespace> = new Map();
  private culturalSettings: Map<string, CulturalSettings> = new Map();
  private voiceConfigs: Map<string, VoiceConfig[]> = new Map();
  private languageDetector: LanguageDetector;
  private voiceSynthesis: VoiceSynthesis;
  private speechRecognition: SpeechRecognition;

  constructor() {
    super();
    this.languageDetector = new LanguageDetector();
    this.voiceSynthesis = new VoiceSynthesis();
    this.speechRecognition = new SpeechRecognition();
    this.initializeI18nSystem();
  }

  private async initializeI18nSystem(): Promise<void> {
    try {
      // Load translations for all supported languages
      await this.loadAllTranslations();
      
      // Initialize cultural settings
      this.initializeCulturalSettings();
      
      // Setup voice configurations
      await this.initializeVoiceConfigs();
      
      // Detect user's preferred language
      const detectedLanguage = await this.languageDetector.detectLanguage();
      await this.setLanguage(detectedLanguage);
      
      this.emit('i18n:initialized', { language: this.currentLanguage });
    } catch (error) {
      console.error('I18n system initialization failed:', error);
      this.emit('i18n:error', { error, phase: 'initialization' });
    }
  }

  // ========== LANGUAGE MANAGEMENT ==========

  /**
   * Set the current language with cultural adaptations
   */
  async setLanguage(languageCode: string): Promise<boolean> {
    if (!SUPPORTED_LANGUAGES[languageCode]) {
      console.warn(`Unsupported language: ${languageCode}, falling back to ${this.fallbackLanguage}`);
      languageCode = this.fallbackLanguage;
    }

    const previousLanguage = this.currentLanguage;
    this.currentLanguage = languageCode;

    try {
      // Load translations if not already loaded
      if (!this.translations.has(languageCode)) {
        await this.loadTranslationsForLanguage(languageCode);
      }

      // Apply cultural settings
      const culturalSettings = this.culturalSettings.get(languageCode);
      if (culturalSettings) {
        this.applyCulturalSettings(culturalSettings);
      }

      // Update document direction for RTL languages
      this.updateDocumentDirection();

      // Initialize voice for the language
      await this.voiceSynthesis.setLanguage(languageCode);
      await this.speechRecognition.setLanguage(languageCode);

      // Store preference
      localStorage.setItem('sata_preferred_language', languageCode);

      this.emit('language:changed', {
        previous: previousLanguage,
        current: languageCode,
        config: SUPPORTED_LANGUAGES[languageCode]
      });

      return true;
    } catch (error) {
      // Rollback on error
      this.currentLanguage = previousLanguage;
      this.emit('language:change_failed', { language: languageCode, error });
      return false;
    }
  }

  /**
   * Get current language configuration
   */
  getCurrentLanguage(): LanguageConfig {
    return SUPPORTED_LANGUAGES[this.currentLanguage];
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return Object.values(SUPPORTED_LANGUAGES);
  }

  // ========== TRANSLATION METHODS ==========

  /**
   * Translate text with cultural adaptations
   */
  t(key: string, options?: {
    namespace?: keyof TranslationNamespace;
    context?: 'formal' | 'casual' | 'therapeutic';
    gender?: 'male' | 'female' | 'neutral';
    count?: number;
    interpolation?: Record<string, string | number>;
  }): string {
    const namespace = options?.namespace || 'common';
    const translations = this.translations.get(this.currentLanguage);
    
    if (!translations || !translations[namespace]) {
      return this.getFallbackTranslation(key, namespace);
    }

    let translation = translations[namespace][key];
    
    if (!translation) {
      return this.getFallbackTranslation(key, namespace);
    }

    // Apply cultural context adaptations
    if (options?.context) {
      translation = this.adaptToCulturalContext(translation, options.context);
    }

    // Apply gender adaptations (for languages with gender-specific terms)
    if (options?.gender) {
      translation = this.adaptToGender(translation, options.gender);
    }

    // Handle pluralization
    if (options?.count !== undefined) {
      translation = this.handlePluralization(translation, options.count);
    }

    // Handle interpolation
    if (options?.interpolation) {
      translation = this.interpolateTranslation(translation, options.interpolation);
    }

    return translation;
  }

  /**
   * Translate mental health terms with cultural sensitivity
   */
  tMentalHealth(key: string, options?: {
    stigmaLevel?: 'direct' | 'gentle' | 'metaphorical';
    familyContext?: boolean;
    religiousSensitive?: boolean;
  }): string {
    const culturalSettings = this.culturalSettings.get(this.currentLanguage);
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];

    let context: 'formal' | 'casual' | 'therapeutic' = 'therapeutic';
    
    // Adapt based on cultural mental health stigma
    if (languageConfig.mentalHealthStigma === 'high') {
      context = options?.stigmaLevel === 'direct' ? 'therapeutic' : 'formal';
    }

    // Get base translation
    let translation = this.t(key, {
      namespace: 'mentalHealth',
      context
    });

    // Apply cultural mental health adaptations
    if (culturalSettings?.stigmaAware) {
      translation = this.adaptForStigma(translation, key);
    }

    if (options?.familyContext && languageConfig.familyOriented) {
      translation = this.adaptForFamilyContext(translation);
    }

    if (options?.religiousSensitive && culturalSettings?.religionSensitivity) {
      translation = this.adaptForReligiousSensitivity(translation);
    }

    return translation;
  }

  // ========== VOICE SYNTHESIS AND RECOGNITION ==========

  /**
   * Speak text in current language with cultural voice settings
   */
  async speak(text: string, options?: {
    voice?: 'default' | 'therapeutic' | 'formal';
    emotion?: 'calm' | 'warm' | 'professional';
    speed?: number;
    volume?: number;
  }): Promise<void> {
    const voiceConfig = this.getVoiceConfig(options?.voice || 'therapeutic');
    
    await this.voiceSynthesis.speak(text, {
      ...voiceConfig,
      emotion: options?.emotion || voiceConfig.emotion,
      speed: options?.speed || voiceConfig.speed,
      volume: options?.volume || 1.0
    });

    this.emit('voice:spoken', {
      text,
      language: this.currentLanguage,
      config: voiceConfig
    });
  }

  /**
   * Start voice recognition for current language
   */
  async startVoiceRecognition(options?: {
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
    culturalAdaptation?: boolean;
  }): Promise<void> {
    const config = {
      language: this.currentLanguage,
      continuous: options?.continuous || false,
      interimResults: options?.interimResults || false,
      maxAlternatives: options?.maxAlternatives || 1
    };

    await this.speechRecognition.start(config);

    // Apply cultural adaptations to recognition results
    if (options?.culturalAdaptation) {
      this.speechRecognition.on('result', (result: any) => {
        const adaptedResult = this.adaptRecognitionResult(result);
        this.emit('voice:recognized', adaptedResult);
      });
    }
  }

  /**
   * Stop voice recognition
   */
  stopVoiceRecognition(): void {
    this.speechRecognition.stop();
    this.emit('voice:stopped');
  }

  /**
   * Check if voice recognition is currently listening
   */
  isListening(): boolean {
    return this.speechRecognition.isListening || false;
  }

  // ========== CULTURAL ADAPTATIONS ==========

  private adaptToCulturalContext(text: string, context: 'formal' | 'casual' | 'therapeutic'): string {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    const culturalSettings = this.culturalSettings.get(this.currentLanguage);

    if (!languageConfig.formalityLevels) {
      return text; // Language doesn't have formality levels
    }

    // Apply formality adaptations based on cultural context
    switch (culturalSettings?.formalityLevel) {
      case 'very_formal':
        return this.applyVeryFormalAdaptation(text);
      case 'formal':
        return this.applyFormalAdaptation(text);
      case 'polite':
        return this.applyPoliteAdaptation(text);
      case 'casual':
      default:
        return text;
    }
  }

  private adaptForStigma(text: string, key: string): string {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    
    if (languageConfig.mentalHealthStigma === 'high') {
      // Use gentler, more indirect language
      const stigmaAdaptations = this.getStigmaAdaptations();
      return stigmaAdaptations[key] || text;
    }
    
    return text;
  }

  private adaptForFamilyContext(text: string): string {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    
    if (languageConfig.familyOriented) {
      // Adapt language to acknowledge family involvement
      return text.replace(/\byou\b/g, 'you and your family')
                 .replace(/\byour\b/g, 'your family\'s');
    }
    
    return text;
  }

  private adaptForReligiousSensitivity(text: string): string {
    // Avoid potentially sensitive religious references
    const religiousAdaptations = {
      'meditation': 'mindfulness practice',
      'spiritual': 'personal reflection',
      'blessing': 'positive intention'
    };

    let adaptedText = text;
    Object.entries(religiousAdaptations).forEach(([original, replacement]) => {
      adaptedText = adaptedText.replace(new RegExp(original, 'gi'), replacement);
    });

    return adaptedText;
  }

  // ========== LANGUAGE DETECTION ==========

  /**
   * Detect user's preferred language from various sources
   */
  async detectUserLanguage(): Promise<string> {
    return await this.languageDetector.detectLanguage();
  }

  // ========== DATE AND NUMBER FORMATTING ==========

  /**
   * Format date according to cultural preferences
   */
  formatDate(date: Date, format?: 'short' | 'medium' | 'long' | 'full'): string {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    
    return new Intl.DateTimeFormat(languageConfig.numberFormat, {
      dateStyle: format || 'medium'
    }).format(date);
  }

  /**
   * Format number according to cultural preferences
   */
  formatNumber(number: number, options?: {
    style?: 'decimal' | 'currency' | 'percent';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }): string {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    
    return new Intl.NumberFormat(languageConfig.numberFormat, options).format(number);
  }

  // ========== RTL SUPPORT ==========

  private updateDocumentDirection(): void {
    const languageConfig = SUPPORTED_LANGUAGES[this.currentLanguage];
    const direction = languageConfig.rtl ? 'rtl' : 'ltr';
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', direction);
      document.documentElement.setAttribute('lang', languageConfig.code);
      
      // Update CSS custom properties for RTL support
      document.documentElement.style.setProperty('--text-direction', direction);
      document.documentElement.style.setProperty('--start', languageConfig.rtl ? 'right' : 'left');
      document.documentElement.style.setProperty('--end', languageConfig.rtl ? 'left' : 'right');
    }
  }

  // ========== INITIALIZATION HELPERS ==========

  private async loadAllTranslations(): Promise<void> {
    const loadPromises = Object.keys(SUPPORTED_LANGUAGES).map(lang => 
      this.loadTranslationsForLanguage(lang)
    );
    
    await Promise.all(loadPromises);
  }

  private async loadTranslationsForLanguage(languageCode: string): Promise<void> {
    try {
      // In a real implementation, this would load from external files
      const translations = await this.loadTranslationFiles(languageCode);
      this.translations.set(languageCode, translations);
    } catch (error) {
      console.error(`Failed to load translations for ${languageCode}:`, error);
      // Use fallback translations
      if (languageCode !== this.fallbackLanguage) {
        const fallbackTranslations = this.translations.get(this.fallbackLanguage);
        if (fallbackTranslations) {
          this.translations.set(languageCode, fallbackTranslations);
        }
      }
    }
  }

  private async loadTranslationFiles(languageCode: string): Promise<TranslationNamespace> {
    try {
      // Dynamic import of translation files from locales directory
      const translations = await import(`../locales/${languageCode}.json`);
      return translations.default || translations;
    } catch (error) {
      console.error(`Failed to load translation file for ${languageCode}:`, error);
      
      // Return basic structure with fallback
      return {
        common: { 
          welcome: 'Welcome',
          language: 'Language',
          save: 'Save',
          cancel: 'Cancel'
        },
        navigation: {},
        forms: {},
        buttons: {},
        mentalHealth: {
          title: 'Mental Health Support',
          welcome: 'Welcome to your mental health journey'
        },
        emotions: {},
        assessments: {},
        therapy: {},
        voice: {},
        audio: {},
        privacy: {},
        consent: {},
        cultural: {},
        family: {},
        errors: {},
        feedback: {},
        dates: {},
        time: {}
      };
    }
  }

  private initializeCulturalSettings(): void {
    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, config]) => {
      const settings: CulturalSettings = {
        languageCode: code,
        formalityLevel: config.formalityLevels ? 'polite' : 'casual',
        mentalHealthApproach: config.mentalHealthStigma === 'high' ? 'indirect' : 'direct',
        familyInvolvement: config.familyOriented ? 'family_aware' : 'individual',
        religionSensitivity: config.culturalContext !== 'western',
        communityOriented: config.familyOriented,
        stigmaAware: config.mentalHealthStigma !== 'low'
      };
      
      this.culturalSettings.set(code, settings);
    });
  }

  private async initializeVoiceConfigs(): Promise<void> {
    Object.entries(SUPPORTED_LANGUAGES).forEach(([code, config]) => {
      if (config.voiceSupported) {
        const voices: VoiceConfig[] = [
          {
            languageCode: code,
            voiceName: 'default',
            gender: 'neutral',
            culturalStyle: 'therapeutic',
            speed: 1.0,
            pitch: 1.0,
            emotion: 'calm'
          },
          {
            languageCode: code,
            voiceName: 'formal',
            gender: 'female',
            culturalStyle: 'formal',
            speed: 0.9,
            pitch: 1.1,
            emotion: 'professional'
          },
          {
            languageCode: code,
            voiceName: 'therapeutic',
            gender: 'female',
            culturalStyle: 'therapeutic',
            speed: 0.8,
            pitch: 0.9,
            emotion: 'warm'
          }
        ];
        
        this.voiceConfigs.set(code, voices);
      }
    });
  }

  // ========== UTILITY METHODS ==========

  private getFallbackTranslation(key: string, namespace: keyof TranslationNamespace): string {
    const fallbackTranslations = this.translations.get(this.fallbackLanguage);
    
    if (fallbackTranslations && fallbackTranslations[namespace][key]) {
      return fallbackTranslations[namespace][key];
    }
    
    // Return the key itself as last resort
    return key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private applyCulturalSettings(settings: CulturalSettings): void {
    // Apply cultural settings to various components
    this.emit('culture:settings_applied', settings);
  }

  private getVoiceConfig(voiceType: string): VoiceConfig {
    const voices = this.voiceConfigs.get(this.currentLanguage) || [];
    return voices.find(v => v.voiceName === voiceType) || voices[0] || {
      languageCode: this.currentLanguage,
      voiceName: 'default',
      gender: 'neutral',
      culturalStyle: 'therapeutic',
      speed: 1.0,
      pitch: 1.0,
      emotion: 'calm'
    };
  }

  private handlePluralization(text: string, count: number): string {
    // Basic pluralization logic - would be expanded for each language
    if (count === 1) {
      return text.replace(/\{\{plural\}\}/g, '');
    } else {
      return text.replace(/\{\{plural\}\}/g, 's');
    }
  }

  private interpolateTranslation(text: string, values: Record<string, string | number>): string {
    let result = text;
    Object.entries(values).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
    return result;
  }

  private adaptToGender(text: string, gender: 'male' | 'female' | 'neutral'): string {
    // Gender-specific adaptations would be implemented per language
    return text;
  }

  private applyVeryFormalAdaptation(text: string): string {
    // Very formal language adaptations
    return text;
  }

  private applyFormalAdaptation(text: string): string {
    // Formal language adaptations
    return text;
  }

  private applyPoliteAdaptation(text: string): string {
    // Polite language adaptations
    return text;
  }

  private getStigmaAdaptations(): Record<string, string> {
    // Return stigma-aware language adaptations for current language
    return {};
  }

  private adaptRecognitionResult(result: any): any {
    // Adapt speech recognition results based on cultural context
    return result;
  }
}

// Supporting classes
class LanguageDetector {
  async detectLanguage(): Promise<string> {
    // Check stored preference
    const stored = localStorage.getItem('sata_preferred_language');
    if (stored && SUPPORTED_LANGUAGES[stored]) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGUAGES[browserLang]) {
      return browserLang;
    }

    // Check accepted languages
    const acceptedLanguages = navigator.languages || [];
    for (const lang of acceptedLanguages) {
      const langCode = lang.split('-')[0];
      if (SUPPORTED_LANGUAGES[langCode]) {
        return langCode;
      }
    }

    // Default to English
    return 'en';
  }
}

class VoiceSynthesis {
  private currentLanguage: string = 'en';
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    this.currentLanguage = languageCode;
  }

  async speak(text: string, config: any): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      utterance.lang = SUPPORTED_LANGUAGES[this.currentLanguage]?.voiceCodes[0] || this.currentLanguage;
      utterance.rate = config.speed || 1.0;
      utterance.pitch = config.pitch || 1.0;
      utterance.volume = config.volume || 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(error);

      this.synthesis!.speak(utterance);
    });
  }
}

class SpeechRecognition extends EventEmitter {
  private recognition: any = null;
  private currentLanguage: string = 'en';
  public isListening: boolean = false;

  constructor() {
    super();
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
      }
    }
  }

  async setLanguage(languageCode: string): Promise<void> {
    this.currentLanguage = languageCode;
    if (this.recognition) {
      this.recognition.lang = SUPPORTED_LANGUAGES[languageCode]?.voiceCodes[0] || languageCode;
    }
  }

  async start(config: any): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;

    this.recognition.onresult = (event: any) => {
      this.emit('result', event);
    };

    this.recognition.onerror = (error: any) => {
      this.isListening = false;
      this.emit('error', error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.isListening = true;
    this.recognition.start();
  }

  stop(): void {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
    }
  }
}

// Export singleton instance
export const i18nSystem = new InternationalizationSystem();
export default InternationalizationSystem;
