/**
 * React hooks for SATA Internationalization System
 * Provides easy integration with React components
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { i18nSystem, LanguageConfig, CulturalSettings, SUPPORTED_LANGUAGES } from '../lib/i18n-system';

// Context types
interface I18nContextType {
  currentLanguage: string;
  languageConfig: LanguageConfig;
  isLoading: boolean;
  error: string | null;
  
  // Translation methods
  t: (key: string, options?: TranslationOptions) => string;
  tMentalHealth: (key: string, options?: MentalHealthOptions) => string;
  
  // Language management
  setLanguage: (languageCode: string) => Promise<boolean>;
  getSupportedLanguages: () => LanguageConfig[];
  detectUserLanguage: () => Promise<string>;
  
  // Voice features
  speak: (text: string, options?: VoiceOptions) => Promise<void>;
  startVoiceRecognition: (options?: VoiceRecognitionOptions) => Promise<void>;
  stopVoiceRecognition: () => void;
  isVoiceSupported: boolean;
  
  // Formatting
  formatDate: (date: Date, format?: 'short' | 'medium' | 'long' | 'full') => string;
  formatNumber: (number: number, options?: NumberFormatOptions) => string;
  
  // Cultural features
  culturalSettings: CulturalSettings | null;
  isRTL: boolean;
  isFormalitySupported: boolean;
  isFamilyOriented: boolean;
}

interface TranslationOptions {
  namespace?: 'common' | 'navigation' | 'forms' | 'buttons' | 'mentalHealth' | 'emotions' | 'assessments' | 'therapy' | 'voice' | 'audio' | 'privacy' | 'consent' | 'cultural' | 'family' | 'errors' | 'feedback' | 'dates' | 'time';
  context?: 'formal' | 'casual' | 'therapeutic';
  gender?: 'male' | 'female' | 'neutral';
  count?: number;
  interpolation?: Record<string, string | number>;
}

interface MentalHealthOptions {
  stigmaLevel?: 'direct' | 'gentle' | 'metaphorical';
  familyContext?: boolean;
  religiousSensitive?: boolean;
}

interface VoiceOptions {
  voice?: 'default' | 'therapeutic' | 'formal';
  emotion?: 'calm' | 'warm' | 'professional';
  speed?: number;
  volume?: number;
}

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  culturalAdaptation?: boolean;
}

interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Provider component
interface I18nProviderProps {
  children: React.ReactNode;
  defaultLanguage?: string;
  enableVoice?: boolean;
  enableDetection?: boolean;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage = 'en',
  enableVoice = true,
  enableDetection = true
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);
  const [languageConfig, setLanguageConfig] = useState<LanguageConfig>(SUPPORTED_LANGUAGES[defaultLanguage]);
  const [culturalSettings, setCulturalSettings] = useState<CulturalSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState<boolean>(false);

  // Initialize i18n system
  useEffect(() => {
    initializeI18n();
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (event: any) => {
      setCurrentLanguage(event.current);
      setLanguageConfig(event.config);
      updateCulturalSettings(event.config);
    };

    const handleError = (event: any) => {
      setError(event.error.message);
    };

    i18nSystem.on('language:changed', handleLanguageChange);
    i18nSystem.on('i18n:error', handleError);

    return () => {
      i18nSystem.off('language:changed', handleLanguageChange);
      i18nSystem.off('i18n:error', handleError);
    };
  }, []);

  const initializeI18n = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Detect user language if enabled
      if (enableDetection) {
        const detectedLanguage = await i18nSystem.detectUserLanguage();
        if (detectedLanguage !== currentLanguage) {
          await i18nSystem.setLanguage(detectedLanguage);
        }
      }

      // Check voice support
      if (enableVoice) {
        const voiceSupported = SUPPORTED_LANGUAGES[currentLanguage]?.voiceSupported || false;
        setIsVoiceSupported(voiceSupported);
      }

      // Update states
      const config = i18nSystem.getCurrentLanguage();
      setCurrentLanguage(config.code);
      setLanguageConfig(config);
      updateCulturalSettings(config);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize i18n system');
      console.error('I18n initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCulturalSettings = (config: LanguageConfig) => {
    const settings: CulturalSettings = {
      languageCode: config.code,
      formalityLevel: config.formalityLevels ? 'polite' : 'casual',
      mentalHealthApproach: config.mentalHealthStigma === 'high' ? 'indirect' : 'direct',
      familyInvolvement: config.familyOriented ? 'family_aware' : 'individual',
      religionSensitivity: config.culturalContext !== 'western',
      communityOriented: config.familyOriented,
      stigmaAware: config.mentalHealthStigma !== 'low'
    };
    setCulturalSettings(settings);
  };

  // Translation methods
  const t = useCallback((key: string, options?: TranslationOptions): string => {
    try {
      return i18nSystem.t(key, options);
    } catch (err) {
      console.warn(`Translation failed for key: ${key}`, err);
      return key;
    }
  }, [currentLanguage]);

  const tMentalHealth = useCallback((key: string, options?: MentalHealthOptions): string => {
    try {
      return i18nSystem.tMentalHealth(key, options);
    } catch (err) {
      console.warn(`Mental health translation failed for key: ${key}`, err);
      return key;
    }
  }, [currentLanguage]);

  // Language management
  const setLanguage = useCallback(async (languageCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await i18nSystem.setLanguage(languageCode);
      
      if (success) {
        const config = i18nSystem.getCurrentLanguage();
        setCurrentLanguage(config.code);
        setLanguageConfig(config);
        updateCulturalSettings(config);
        
        // Update voice support
        if (enableVoice) {
          setIsVoiceSupported(config.voiceSupported);
        }
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change language');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enableVoice]);

  const getSupportedLanguages = useCallback((): LanguageConfig[] => {
    return i18nSystem.getSupportedLanguages();
  }, []);

  const detectUserLanguage = useCallback(async (): Promise<string> => {
    return await i18nSystem.detectUserLanguage();
  }, []);

  // Voice features
  const speak = useCallback(async (text: string, options?: VoiceOptions): Promise<void> => {
    if (!isVoiceSupported) {
      throw new Error('Voice synthesis not supported for current language');
    }
    
    try {
      await i18nSystem.speak(text, options);
    } catch (err) {
      console.error('Speech synthesis failed:', err);
      throw err;
    }
  }, [isVoiceSupported]);

  const startVoiceRecognition = useCallback(async (options?: VoiceRecognitionOptions): Promise<void> => {
    if (!isVoiceSupported) {
      throw new Error('Voice recognition not supported for current language');
    }
    
    try {
      await i18nSystem.startVoiceRecognition(options);
    } catch (err) {
      console.error('Voice recognition failed:', err);
      throw err;
    }
  }, [isVoiceSupported]);

  const stopVoiceRecognition = useCallback((): void => {
    try {
      i18nSystem.stopVoiceRecognition();
    } catch (err) {
      console.error('Failed to stop voice recognition:', err);
    }
  }, []);

  // Formatting methods
  const formatDate = useCallback((date: Date, format?: 'short' | 'medium' | 'long' | 'full'): string => {
    return i18nSystem.formatDate(date, format);
  }, [currentLanguage]);

  const formatNumber = useCallback((number: number, options?: NumberFormatOptions): string => {
    return i18nSystem.formatNumber(number, options);
  }, [currentLanguage]);

  const contextValue: I18nContextType = {
    currentLanguage,
    languageConfig,
    culturalSettings,
    isLoading,
    error,
    t,
    tMentalHealth,
    setLanguage,
    getSupportedLanguages,
    detectUserLanguage,
    speak,
    startVoiceRecognition,
    stopVoiceRecognition,
    isVoiceSupported,
    formatDate,
    formatNumber,
    isRTL: languageConfig.rtl,
    isFormalitySupported: languageConfig.formalityLevels,
    isFamilyOriented: languageConfig.familyOriented
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// Main hook
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Specialized hooks
export const useTranslation = () => {
  const { t, tMentalHealth, currentLanguage, languageConfig } = useI18n();
  
  return {
    t,
    tMentalHealth,
    language: currentLanguage,
    config: languageConfig
  };
};

export const useVoice = () => {
  const { 
    speak, 
    startVoiceRecognition, 
    stopVoiceRecognition, 
    isVoiceSupported,
    currentLanguage 
  } = useI18n();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakText = useCallback(async (text: string, options?: VoiceOptions) => {
    if (!isVoiceSupported) return;
    
    try {
      setIsSpeaking(true);
      await speak(text, options);
    } finally {
      setIsSpeaking(false);
    }
  }, [speak, isVoiceSupported]);

  const startListening = useCallback(async (options?: VoiceRecognitionOptions) => {
    if (!isVoiceSupported || isListening) return;
    
    try {
      setIsListening(true);
      await startVoiceRecognition(options);
    } catch (err) {
      setIsListening(false);
      throw err;
    }
  }, [startVoiceRecognition, isVoiceSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    
    stopVoiceRecognition();
    setIsListening(false);
  }, [stopVoiceRecognition, isListening]);

  return {
    speak: speakText,
    startListening,
    stopListening,
    isSupported: isVoiceSupported,
    isListening,
    isSpeaking,
    language: currentLanguage
  };
};

export const useCulturalAdaptation = () => {
  const { 
    culturalSettings, 
    languageConfig, 
    isRTL, 
    isFormalitySupported, 
    isFamilyOriented 
  } = useI18n();

  const getMentalHealthApproach = useCallback((direct: string, indirect: string): string => {
    if (!culturalSettings) return direct;
    
    switch (culturalSettings.mentalHealthApproach) {
      case 'indirect':
      case 'metaphorical':
        return indirect;
      case 'gentle':
        return `${indirect} (${direct})`;
      default:
        return direct;
    }
  }, [culturalSettings]);

  const adaptForFamily = useCallback((individual: string, family: string): string => {
    return isFamilyOriented ? family : individual;
  }, [isFamilyOriented]);

  const getFormality = useCallback((): 'casual' | 'polite' | 'formal' | 'very_formal' => {
    return culturalSettings?.formalityLevel || 'casual';
  }, [culturalSettings]);

  const shouldShowFamilyOptions = useCallback((): boolean => {
    return languageConfig.familyOriented && languageConfig.mentalHealthStigma !== 'low';
  }, [languageConfig]);

  const getStigmaLevel = useCallback((): 'low' | 'medium' | 'high' => {
    return languageConfig.mentalHealthStigma;
  }, [languageConfig]);

  return {
    culturalSettings,
    languageConfig,
    isRTL,
    isFormalitySupported,
    isFamilyOriented,
    getMentalHealthApproach,
    adaptForFamily,
    getFormality,
    shouldShowFamilyOptions,
    getStigmaLevel
  };
};

export const useLanguageSwitch = () => {
  const { 
    setLanguage, 
    getSupportedLanguages, 
    currentLanguage, 
    isLoading 
  } = useI18n();

  const [isChanging, setIsChanging] = useState(false);
  const supportedLanguages = getSupportedLanguages();

  const changeLanguage = useCallback(async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return;
    
    try {
      setIsChanging(true);
      const success = await setLanguage(languageCode);
      
      if (success) {
        // Trigger page reload for complete language switch if needed
        // window.location.reload();
      }
      
      return success;
    } finally {
      setIsChanging(false);
    }
  }, [setLanguage, currentLanguage, isChanging]);

  return {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isChanging: isChanging || isLoading
  };
};

// Utility hooks
export const useDirectionalStyles = () => {
  const { isRTL } = useI18n();
  
  const getDirection = useCallback(() => isRTL ? 'rtl' : 'ltr', [isRTL]);
  const getTextAlign = useCallback(() => isRTL ? 'right' : 'left', [isRTL]);
  const getMarginStart = useCallback((value: string) => ({
    [isRTL ? 'marginRight' : 'marginLeft']: value
  }), [isRTL]);
  const getMarginEnd = useCallback((value: string) => ({
    [isRTL ? 'marginLeft' : 'marginRight']: value
  }), [isRTL]);
  const getPaddingStart = useCallback((value: string) => ({
    [isRTL ? 'paddingRight' : 'paddingLeft']: value
  }), [isRTL]);
  const getPaddingEnd = useCallback((value: string) => ({
    [isRTL ? 'paddingLeft' : 'paddingRight']: value
  }), [isRTL]);

  return {
    isRTL,
    direction: getDirection(),
    textAlign: getTextAlign(),
    getDirection,
    getTextAlign,
    getMarginStart,
    getMarginEnd,
    getPaddingStart,
    getPaddingEnd
  };
};

export default useI18n;
