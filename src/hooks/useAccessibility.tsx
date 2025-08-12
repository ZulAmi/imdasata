/**
 * React Hooks for SATA Accessibility System
 * Easy integration of accessibility features in React components
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { accessibilitySystem, AccessibilityConfig, VoiceCommand, IconMapping } from '../lib/accessibility-system';

// Context for accessibility state
interface AccessibilityContextType {
  config: AccessibilityConfig;
  isLoading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<AccessibilityConfig>) => Promise<void>;
  speak: (text: string, options?: any) => Promise<void>;
  stopSpeaking: () => void;
  startVoiceNavigation: () => void;
  stopVoiceNavigation: () => void;
  readCurrentPage: () => void;
  announceHelp: () => void;
  voiceCommands: VoiceCommand[];
  iconMappings: IconMapping[];
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

// Provider component
interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AccessibilityConfig>(accessibilitySystem.getConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voiceCommands] = useState<VoiceCommand[]>(accessibilitySystem.getVoiceCommands());
  const [iconMappings] = useState<IconMapping[]>(accessibilitySystem.getIconMappings());

  useEffect(() => {
    const handleConfigUpdate = (event: any) => {
      setConfig(event.current);
    };

    const handleError = (event: any) => {
      setError(event.error.message);
    };

    const handleInitialized = () => {
      setIsLoading(false);
      setConfig(accessibilitySystem.getConfig());
    };

    accessibilitySystem.on('accessibility:config-updated', handleConfigUpdate);
    accessibilitySystem.on('accessibility:error', handleError);
    accessibilitySystem.on('accessibility:initialized', handleInitialized);

    return () => {
      accessibilitySystem.off('accessibility:config-updated', handleConfigUpdate);
      accessibilitySystem.off('accessibility:error', handleError);
      accessibilitySystem.off('accessibility:initialized', handleInitialized);
    };
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AccessibilityConfig>) => {
    try {
      setError(null);
      await accessibilitySystem.updateConfig(updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update accessibility config');
    }
  }, []);

  const speak = useCallback(async (text: string, options?: any) => {
    if (config.textToSpeech) {
      try {
        await accessibilitySystem.speak(text, options);
      } catch (err) {
        console.error('Speech failed:', err);
      }
    }
  }, [config.textToSpeech]);

  const stopSpeaking = useCallback(() => {
    accessibilitySystem.stopSpeaking();
  }, []);

  const startVoiceNavigation = useCallback(() => {
    accessibilitySystem.startVoiceNavigation();
  }, []);

  const stopVoiceNavigation = useCallback(() => {
    accessibilitySystem.stopVoiceNavigation();
  }, []);

  const readCurrentPage = useCallback(() => {
    accessibilitySystem.readCurrentPage();
  }, []);

  const announceHelp = useCallback(() => {
    accessibilitySystem.announceHelp();
  }, []);

  const value: AccessibilityContextType = {
    config,
    isLoading,
    error,
    updateConfig,
    speak,
    stopSpeaking,
    startVoiceNavigation,
    stopVoiceNavigation,
    readCurrentPage,
    announceHelp,
    voiceCommands,
    iconMappings
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Main accessibility hook
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// Voice navigation hook
export const useVoiceNavigation = () => {
  const { config, startVoiceNavigation, stopVoiceNavigation, voiceCommands } = useAccessibility();
  
  const isEnabled = config.voiceNavigation;
  
  return {
    isEnabled,
    start: startVoiceNavigation,
    stop: stopVoiceNavigation,
    commands: voiceCommands,
    toggle: useCallback(() => {
      if (isEnabled) {
        stopVoiceNavigation();
      } else {
        startVoiceNavigation();
      }
    }, [isEnabled, startVoiceNavigation, stopVoiceNavigation])
  };
};

// Text-to-speech hook
export const useTextToSpeech = () => {
  const { config, speak, stopSpeaking, readCurrentPage } = useAccessibility();
  
  const isEnabled = config.textToSpeech;
  
  return {
    isEnabled,
    speak: useCallback((text: string, options?: any) => {
      if (isEnabled) {
        return speak(text, options);
      }
      return Promise.resolve();
    }, [isEnabled, speak]),
    stop: stopSpeaking,
    readPage: readCurrentPage,
    readingSpeed: config.readingSpeed
  };
};

// Visual accessibility hook
export const useVisualAccessibility = () => {
  const { config, updateConfig } = useAccessibility();
  
  return {
    fontSize: config.fontSize,
    highContrastMode: config.highContrastMode,
    colorBlindSupport: config.colorBlindSupport,
    setFontSize: useCallback((size: AccessibilityConfig['fontSize']) => {
      updateConfig({ fontSize: size });
    }, [updateConfig]),
    toggleHighContrast: useCallback(() => {
      updateConfig({ highContrastMode: !config.highContrastMode });
    }, [config.highContrastMode, updateConfig]),
    toggleColorBlindSupport: useCallback(() => {
      updateConfig({ colorBlindSupport: !config.colorBlindSupport });
    }, [config.colorBlindSupport, updateConfig])
  };
};

// Touch and interaction hook
export const useTouchAccessibility = () => {
  const { config, updateConfig } = useAccessibility();
  
  return {
    touchFriendly: config.touchFriendly,
    keyboardNavigation: config.keyboardNavigation,
    toggleTouchFriendly: useCallback(() => {
      updateConfig({ touchFriendly: !config.touchFriendly });
    }, [config.touchFriendly, updateConfig]),
    toggleKeyboardNavigation: useCallback(() => {
      updateConfig({ keyboardNavigation: !config.keyboardNavigation });
    }, [config.keyboardNavigation, updateConfig])
  };
};

// Language simplification hook
export const useLanguageSimplification = () => {
  const { config, updateConfig } = useAccessibility();
  
  const simplify = useCallback((text: string): string => {
    if (!config.simplifiedLanguage) return text;
    
    // Simple text transformation rules
    return text
      .replace(/utilize/g, 'use')
      .replace(/demonstrate/g, 'show')
      .replace(/accomplish/g, 'do')
      .replace(/assistance/g, 'help')
      .replace(/currently/g, 'now')
      .replace(/approximately/g, 'about')
      .replace(/consequently/g, 'so')
      .replace(/furthermore/g, 'also')
      .replace(/nevertheless/g, 'but')
      .replace(/subsequently/g, 'then')
      // Split long sentences
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
      // Simplify mental health terms
      .replace(/psychological wellbeing/g, 'feeling good')
      .replace(/emotional regulation/g, 'managing feelings')
      .replace(/cognitive behavioral/g, 'thinking and behavior')
      .replace(/therapeutic intervention/g, 'treatment')
      .replace(/assessment/g, 'check')
      .replace(/evaluation/g, 'review');
  }, [config.simplifiedLanguage]);
  
  return {
    isEnabled: config.simplifiedLanguage,
    simplify,
    toggle: useCallback(() => {
      updateConfig({ simplifiedLanguage: !config.simplifiedLanguage });
    }, [config.simplifiedLanguage, updateConfig])
  };
};

// Icon-based interface hook
export const useIconInterface = () => {
  const { config, iconMappings } = useAccessibility();
  
  return {
    isEnabled: config.iconBasedInterface,
    mappings: iconMappings,
    getIcon: useCallback((action: string) => {
      const mapping = iconMappings.find(m => m.action === action);
      return mapping?.icon || '❓';
    }, [iconMappings]),
    getLabel: useCallback((action: string) => {
      const mapping = iconMappings.find(m => m.action === action);
      return mapping?.label || 'Unknown';
    }, [iconMappings]),
    getDescription: useCallback((action: string) => {
      const mapping = iconMappings.find(m => m.action === action);
      return mapping?.description || 'No description available';
    }, [iconMappings])
  };
};

// Offline capability hook
export const useOfflineAccessibility = () => {
  const { config } = useAccessibility();
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return {
    isOfflineModeEnabled: config.offlineMode,
    isOnline,
    canUseFeature: useCallback((feature: string) => {
      // Define which features work offline
      const offlineFeatures = [
        'textToSpeech',
        'iconBasedInterface',
        'simplifiedLanguage',
        'highContrastMode',
        'touchFriendly'
      ];
      
      return isOnline || offlineFeatures.includes(feature);
    }, [isOnline])
  };
};

// Comprehensive accessibility status hook
export const useAccessibilityStatus = () => {
  const { config, error, isLoading } = useAccessibility();
  
  const getStatusSummary = useCallback(() => {
    const activeFeatures = Object.entries(config)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);
    
    return {
      totalFeatures: Object.keys(config).length,
      activeFeatures: activeFeatures.length,
      features: activeFeatures,
      accessibility_level: activeFeatures.length > 5 ? 'high' : 
                          activeFeatures.length > 2 ? 'medium' : 'basic'
    };
  }, [config]);
  
  return {
    config,
    error,
    isLoading,
    summary: getStatusSummary()
  };
};
