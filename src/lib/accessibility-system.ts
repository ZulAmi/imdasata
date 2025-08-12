/**
 * SATA Accessibility System
 * Comprehensive accessibility features for users with varying literacy levels
 */

import { EventEmitter } from 'events';

// Accessibility configuration types
export interface AccessibilityConfig {
  voiceNavigation: boolean;
  iconBasedInterface: boolean;
  textToSpeech: boolean;
  highContrastMode: boolean;
  simplifiedLanguage: boolean;
  offlineMode: boolean;
  touchFriendly: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  readingSpeed: 'slow' | 'normal' | 'fast';
  autoRead: boolean;
  keyboardNavigation: boolean;
  colorBlindSupport: boolean;
}

export interface VoiceCommand {
  command: string;
  action: string;
  aliases: string[];
  description: string;
}

export interface IconMapping {
  action: string;
  icon: string;
  label: string;
  description: string;
  voiceCommand: string;
}

// Voice navigation commands
const VOICE_COMMANDS: VoiceCommand[] = [
  {
    command: 'go home',
    action: 'navigate:home',
    aliases: ['home', 'main page', 'start'],
    description: 'Navigate to home page'
  },
  {
    command: 'track mood',
    action: 'navigate:mood',
    aliases: ['mood', 'feelings', 'emotions'],
    description: 'Open mood tracking'
  },
  {
    command: 'voice analysis',
    action: 'navigate:voice',
    aliases: ['voice', 'speak', 'record'],
    description: 'Open voice analysis'
  },
  {
    command: 'help',
    action: 'show:help',
    aliases: ['assistance', 'support', 'tutorial'],
    description: 'Show help and tutorials'
  },
  {
    command: 'read this',
    action: 'tts:current',
    aliases: ['speak', 'read aloud', 'say this'],
    description: 'Read current content aloud'
  },
  {
    command: 'stop reading',
    action: 'tts:stop',
    aliases: ['stop', 'quiet', 'silence'],
    description: 'Stop text-to-speech'
  },
  {
    command: 'increase text size',
    action: 'accessibility:font-larger',
    aliases: ['bigger text', 'larger font', 'zoom in'],
    description: 'Make text larger'
  },
  {
    command: 'decrease text size',
    action: 'accessibility:font-smaller',
    aliases: ['smaller text', 'smaller font', 'zoom out'],
    description: 'Make text smaller'
  },
  {
    command: 'high contrast',
    action: 'accessibility:contrast-toggle',
    aliases: ['contrast mode', 'dark mode', 'better visibility'],
    description: 'Toggle high contrast mode'
  },
  {
    command: 'simple language',
    action: 'accessibility:simple-language',
    aliases: ['easy words', 'simple mode', 'basic language'],
    description: 'Use simplified language'
  }
];

// Icon-based interface mappings
const ICON_MAPPINGS: IconMapping[] = [
  {
    action: 'navigate:home',
    icon: '🏠',
    label: 'Home',
    description: 'Go to main page',
    voiceCommand: 'go home'
  },
  {
    action: 'navigate:mood',
    icon: '😊',
    label: 'Feelings',
    description: 'Track your mood',
    voiceCommand: 'track mood'
  },
  {
    action: 'navigate:voice',
    icon: '🎤',
    label: 'Voice',
    description: 'Voice analysis',
    voiceCommand: 'voice analysis'
  },
  {
    action: 'show:help',
    icon: '❓',
    label: 'Help',
    description: 'Get help',
    voiceCommand: 'help'
  },
  {
    action: 'tts:current',
    icon: '🔊',
    label: 'Read',
    description: 'Read this page',
    voiceCommand: 'read this'
  },
  {
    action: 'accessibility:settings',
    icon: '⚙️',
    label: 'Settings',
    description: 'Accessibility options',
    voiceCommand: 'settings'
  },
  {
    action: 'emergency:help',
    icon: '🆘',
    label: 'Emergency',
    description: 'Get immediate help',
    voiceCommand: 'emergency help'
  },
  {
    action: 'offline:sync',
    icon: '📱',
    label: 'Offline',
    description: 'Offline features',
    voiceCommand: 'offline mode'
  }
];

export class AccessibilitySystem extends EventEmitter {
  private config: AccessibilityConfig;
  private speechSynthesis: SpeechSynthesis | null = null;
  private speechRecognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListeningForCommands: boolean = false;
  private offlineData: Map<string, any> = new Map();

  constructor() {
    super();
    
    // Default accessibility configuration
    this.config = {
      voiceNavigation: false,
      iconBasedInterface: true,
      textToSpeech: false,
      highContrastMode: false,
      simplifiedLanguage: false,
      offlineMode: false,
      touchFriendly: true,
      fontSize: 'medium',
      readingSpeed: 'normal',
      autoRead: false,
      keyboardNavigation: true,
      colorBlindSupport: false
    };

    this.initializeAccessibilitySystem();
  }

  private async initializeAccessibilitySystem(): Promise<void> {
    try {
      // Load saved preferences
      await this.loadAccessibilityPreferences();
      
      // Initialize speech synthesis
      this.initializeSpeechSynthesis();
      
      // Initialize voice recognition
      this.initializeVoiceRecognition();
      
      // Apply initial accessibility settings
      this.applyAccessibilitySettings();
      
      // Setup keyboard navigation
      this.setupKeyboardNavigation();
      
      // Initialize offline capabilities
      this.initializeOfflineMode();
      
      this.emit('accessibility:initialized', this.config);
    } catch (error) {
      console.error('Accessibility system initialization failed:', error);
      this.emit('accessibility:error', { error, phase: 'initialization' });
    }
  }

  // ========== CONFIGURATION MANAGEMENT ==========

  async updateConfig(updates: Partial<AccessibilityConfig>): Promise<void> {
    const previousConfig = { ...this.config };
    this.config = { ...this.config, ...updates };
    
    try {
      await this.saveAccessibilityPreferences();
      this.applyAccessibilitySettings();
      
      this.emit('accessibility:config-updated', {
        previous: previousConfig,
        current: this.config,
        changes: updates
      });
    } catch (error) {
      // Rollback on error
      this.config = previousConfig;
      this.emit('accessibility:error', { error, phase: 'configuration' });
    }
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  // ========== VOICE NAVIGATION ==========

  private initializeVoiceRecognition(): void {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        this.processVoiceCommand(command);
      };

      this.speechRecognition.onerror = (error: any) => {
        console.error('Voice recognition error:', error);
        this.emit('accessibility:voice-error', error);
      };
    }
  }

  startVoiceNavigation(): void {
    if (this.speechRecognition && this.config.voiceNavigation) {
      try {
        this.speechRecognition.start();
        this.isListeningForCommands = true;
        this.emit('accessibility:voice-navigation-started');
        
        // Announce voice navigation is active
        this.speak('Voice navigation is now active. Say "help" to hear available commands.');
      } catch (error) {
        console.error('Failed to start voice navigation:', error);
        this.emit('accessibility:voice-error', error);
      }
    }
  }

  stopVoiceNavigation(): void {
    if (this.speechRecognition && this.isListeningForCommands) {
      try {
        this.speechRecognition.stop();
        this.isListeningForCommands = false;
        this.emit('accessibility:voice-navigation-stopped');
        this.speak('Voice navigation stopped.');
      } catch (error) {
        console.error('Failed to stop voice navigation:', error);
      }
    }
  }

  private processVoiceCommand(command: string): void {
    const matchedCommand = VOICE_COMMANDS.find(cmd => 
      cmd.command === command || cmd.aliases.some(alias => 
        command.includes(alias) || alias.includes(command)
      )
    );

    if (matchedCommand) {
      this.executeCommand(matchedCommand.action);
      this.speak(`Executing: ${matchedCommand.description}`);
    } else {
      this.speak('Command not recognized. Say "help" to hear available commands.');
    }
  }

  private executeCommand(action: string): void {
    const [category, command] = action.split(':');
    
    switch (category) {
      case 'navigate':
        this.emit('accessibility:navigate', command);
        break;
      case 'tts':
        this.handleTTSCommand(command);
        break;
      case 'accessibility':
        this.handleAccessibilityCommand(command);
        break;
      case 'show':
        this.emit('accessibility:show', command);
        break;
      case 'emergency':
        this.emit('accessibility:emergency', command);
        break;
      case 'offline':
        this.handleOfflineCommand(command);
        break;
    }
  }

  // ========== TEXT-TO-SPEECH ==========

  private initializeSpeechSynthesis(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis;
    }
  }

  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: string;
    interrupt?: boolean;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.speechSynthesis) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      // Stop current speech if interrupting
      if (options.interrupt !== false) {
        this.stopSpeaking();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply reading speed
      const speedMultiplier = {
        slow: 0.7,
        normal: 1.0,
        fast: 1.3
      };
      utterance.rate = (options.rate || 1.0) * speedMultiplier[this.config.readingSpeed];
      
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      // Select appropriate voice
      const voices = this.speechSynthesis.getVoices();
      if (options.voice) {
        const selectedVoice = voices.find(v => v.name.includes(options.voice!));
        if (selectedVoice) utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (error) => {
        this.currentUtterance = null;
        reject(error);
      };

      this.currentUtterance = utterance;
      this.speechSynthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  private handleTTSCommand(command: string): void {
    switch (command) {
      case 'current':
        this.readCurrentPage();
        break;
      case 'stop':
        this.stopSpeaking();
        break;
    }
  }

  readCurrentPage(): void {
    // Get main content from the page
    const content = this.extractPageContent();
    if (content) {
      this.speak(content);
    } else {
      this.speak('No readable content found on this page.');
    }
  }

  private extractPageContent(): string {
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      'article',
      '.content'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        return this.cleanTextContent(element.textContent || '');
      }
    }

    // Fallback to body content
    const body = document.body;
    return this.cleanTextContent(body.textContent || '');
  }

  private cleanTextContent(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '')
      .trim();
  }

  // ========== ACCESSIBILITY SETTINGS ==========

  private handleAccessibilityCommand(command: string): void {
    switch (command) {
      case 'font-larger':
        this.increaseFontSize();
        break;
      case 'font-smaller':
        this.decreaseFontSize();
        break;
      case 'contrast-toggle':
        this.toggleHighContrast();
        break;
      case 'simple-language':
        this.toggleSimpleLanguage();
        break;
    }
  }

  private increaseFontSize(): void {
    const sizes: AccessibilityConfig['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.config.fontSize);
    if (currentIndex < sizes.length - 1) {
      this.updateConfig({ fontSize: sizes[currentIndex + 1] });
      this.speak(`Text size increased to ${sizes[currentIndex + 1]}`);
    } else {
      this.speak('Text is already at maximum size');
    }
  }

  private decreaseFontSize(): void {
    const sizes: AccessibilityConfig['fontSize'][] = ['small', 'medium', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(this.config.fontSize);
    if (currentIndex > 0) {
      this.updateConfig({ fontSize: sizes[currentIndex - 1] });
      this.speak(`Text size decreased to ${sizes[currentIndex - 1]}`);
    } else {
      this.speak('Text is already at minimum size');
    }
  }

  private toggleHighContrast(): void {
    this.updateConfig({ highContrastMode: !this.config.highContrastMode });
    this.speak(`High contrast mode ${this.config.highContrastMode ? 'enabled' : 'disabled'}`);
  }

  private toggleSimpleLanguage(): void {
    this.updateConfig({ simplifiedLanguage: !this.config.simplifiedLanguage });
    this.speak(`Simple language mode ${this.config.simplifiedLanguage ? 'enabled' : 'disabled'}`);
  }

  private applyAccessibilitySettings(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '20px',
      'extra-large': '24px'
    };
    root.style.setProperty('--accessibility-font-size', fontSizeMap[this.config.fontSize]);

    // Apply high contrast mode
    if (this.config.highContrastMode) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // Apply touch-friendly mode
    if (this.config.touchFriendly) {
      root.classList.add('accessibility-touch-friendly');
    } else {
      root.classList.remove('accessibility-touch-friendly');
    }

    // Apply color blind support
    if (this.config.colorBlindSupport) {
      root.classList.add('accessibility-colorblind-support');
    } else {
      root.classList.remove('accessibility-colorblind-support');
    }
  }

  // ========== KEYBOARD NAVIGATION ==========

  private setupKeyboardNavigation(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', (event) => {
      if (!this.config.keyboardNavigation) return;

      // Alt + H for help
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        this.emit('accessibility:show', 'help');
        this.speak('Help menu opened');
      }

      // Alt + R to read current content
      if (event.altKey && event.key === 'r') {
        event.preventDefault();
        this.readCurrentPage();
      }

      // Alt + S to stop speech
      if (event.altKey && event.key === 's') {
        event.preventDefault();
        this.stopSpeaking();
      }

      // Alt + V to toggle voice navigation
      if (event.altKey && event.key === 'v') {
        event.preventDefault();
        if (this.isListeningForCommands) {
          this.stopVoiceNavigation();
        } else {
          this.startVoiceNavigation();
        }
      }
    });
  }

  // ========== OFFLINE CAPABILITIES ==========

  private initializeOfflineMode(): void {
    if (typeof window === 'undefined') return;

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-accessibility.js')
        .then(() => {
          console.log('Accessibility service worker registered');
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error);
        });
    }

    // Cache essential data for offline use
    this.cacheEssentialData();
  }

  private cacheEssentialData(): void {
    // Cache voice commands
    this.offlineData.set('voice-commands', VOICE_COMMANDS);
    
    // Cache icon mappings
    this.offlineData.set('icon-mappings', ICON_MAPPINGS);
    
    // Cache accessibility preferences
    this.offlineData.set('accessibility-config', this.config);
  }

  private handleOfflineCommand(command: string): void {
    switch (command) {
      case 'sync':
        this.syncOfflineData();
        break;
    }
  }

  private syncOfflineData(): void {
    // Sync cached data when back online
    if (navigator.onLine) {
      this.emit('accessibility:offline-sync-started');
      // Implement sync logic here
      this.speak('Syncing offline data...');
    } else {
      this.speak('Currently offline. Data will sync when connection is restored.');
    }
  }

  // ========== PERSISTENCE ==========

  private async loadAccessibilityPreferences(): Promise<void> {
    try {
      const saved = localStorage.getItem('sata_accessibility_config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load accessibility preferences:', error);
    }
  }

  private async saveAccessibilityPreferences(): Promise<void> {
    try {
      localStorage.setItem('sata_accessibility_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  }

  // ========== UTILITY METHODS ==========

  getVoiceCommands(): VoiceCommand[] {
    return [...VOICE_COMMANDS];
  }

  getIconMappings(): IconMapping[] {
    return [...ICON_MAPPINGS];
  }

  isFeatureEnabled(feature: keyof AccessibilityConfig): boolean {
    return this.config[feature] as boolean;
  }

  announceHelp(): void {
    const helpText = `
      SATA Accessibility Help. 
      Voice commands available: 
      Say "go home" to return to main page.
      Say "track mood" to open mood tracking.
      Say "voice analysis" for voice features.
      Say "read this" to hear page content.
      Say "help" to repeat this message.
      Say "stop reading" to stop speech.
      Press Alt+H for help menu.
      Press Alt+R to read current page.
      Press Alt+V to toggle voice navigation.
    `;
    this.speak(helpText);
  }
}

// Export singleton instance
export const accessibilitySystem = new AccessibilitySystem();
export default AccessibilitySystem;
