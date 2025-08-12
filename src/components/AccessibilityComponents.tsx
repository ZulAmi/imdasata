/**
 * Accessible UI Components for SATA Platform
 * Components designed for users with varying literacy levels
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAccessibility, useVoiceNavigation, useTextToSpeech, useVisualAccessibility, useIconInterface } from '../hooks/useAccessibility';

// Accessibility Controls Panel Component
export const AccessibilityControlPanel: React.FC = () => {
  const { config, updateConfig } = useAccessibility();
  const { toggleHighContrast } = useVisualAccessibility();
  const { start: startVoice, stop: stopVoice, isEnabled: voiceEnabled } = useVoiceNavigation();
  const { speak } = useTextToSpeech();
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleVoiceNavigation = async () => {
    if (voiceEnabled) {
      stopVoice();
      await speak("Voice navigation disabled");
    } else {
      startVoice();
      await speak("Voice navigation enabled. Say help to hear commands.");
    }
  };

  return (
    <div className={`accessibility-controls ${isMinimized ? 'minimized' : ''}`}>
      {!isMinimized && (
        <>
          <h3>Accessibility Settings</h3>
          
          <div className="accessibility-control">
            <label>Voice Navigation</label>
            <button 
              className={`accessibility-toggle ${config.voiceNavigation ? 'active' : ''}`}
              onClick={toggleVoiceNavigation}
              aria-label={`Voice navigation ${config.voiceNavigation ? 'enabled' : 'disabled'}`}
            />
          </div>

          <div className="accessibility-control">
            <label>Text to Speech</label>
            <button 
              className={`accessibility-toggle ${config.textToSpeech ? 'active' : ''}`}
              onClick={() => updateConfig({ textToSpeech: !config.textToSpeech })}
              aria-label={`Text to speech ${config.textToSpeech ? 'enabled' : 'disabled'}`}
            />
          </div>

          <div className="accessibility-control">
            <label>High Contrast</label>
            <button 
              className={`accessibility-toggle ${config.highContrastMode ? 'active' : ''}`}
              onClick={toggleHighContrast}
              aria-label={`High contrast mode ${config.highContrastMode ? 'enabled' : 'disabled'}`}
            />
          </div>

          <div className="accessibility-control">
            <label>Simple Language</label>
            <button 
              className={`accessibility-toggle ${config.simplifiedLanguage ? 'active' : ''}`}
              onClick={() => updateConfig({ simplifiedLanguage: !config.simplifiedLanguage })}
              aria-label={`Simple language ${config.simplifiedLanguage ? 'enabled' : 'disabled'}`}
            />
          </div>

          <div className="accessibility-control">
            <label>Touch Friendly</label>
            <button 
              className={`accessibility-toggle ${config.touchFriendly ? 'active' : ''}`}
              onClick={() => updateConfig({ touchFriendly: !config.touchFriendly })}
              aria-label={`Touch friendly mode ${config.touchFriendly ? 'enabled' : 'disabled'}`}
            />
          </div>

          <div className="accessibility-control">
            <label>Font Size</label>
            <select 
              value={config.fontSize} 
              onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
              aria-label="Font size selection"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>
        </>
      )}
      
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className="minimize-toggle"
        aria-label={isMinimized ? 'Expand accessibility controls' : 'Minimize accessibility controls'}
      >
        {isMinimized ? '⚙️' : '✖️'}
      </button>
    </div>
  );
};

// Icon-based Navigation Component
interface IconNavItemProps {
  action: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const IconNavItem: React.FC<IconNavItemProps> = ({ action, onClick, isActive = false, disabled = false }) => {
  const { getIcon, getLabel, getDescription } = useIconInterface();
  const { speak } = useTextToSpeech();
  
  const handleClick = async () => {
    if (disabled) return;
    await speak(getLabel(action));
    onClick();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div 
      className={`icon-item ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={getDescription(action)}
      aria-pressed={isActive}
      aria-disabled={disabled}
    >
      <span className="icon-emoji" aria-hidden="true">{getIcon(action)}</span>
      <span className="icon-label">{getLabel(action)}</span>
      <span className="icon-description sr-only">{getDescription(action)}</span>
    </div>
  );
};

export const IconBasedNavigation: React.FC = () => {
  const { config } = useAccessibility();
  const [activeAction, setActiveAction] = useState<string>('');

  const navigationActions = [
    { action: 'home', onClick: () => window.location.href = '/' },
    { action: 'mood-track', onClick: () => window.location.href = '/mood' },
    { action: 'voice-analysis', onClick: () => window.location.href = '/voice' },
    { action: 'help', onClick: () => window.location.href = '/help' },
    { action: 'settings', onClick: () => setActiveAction('settings') }
  ];

  if (!config.iconBasedInterface) return null;

  return (
    <nav className="icon-interface" role="navigation" aria-label="Main navigation with icons">
      <div className="icon-nav-grid">
        {navigationActions.map(({ action, onClick }) => (
          <IconNavItem
            key={action}
            action={action}
            onClick={onClick}
            isActive={activeAction === action}
          />
        ))}
      </div>
    </nav>
  );
};

// Voice Command Help Component
export const VoiceCommandHelp: React.FC = () => {
  const { commands } = useVoiceNavigation();
  const { speak } = useTextToSpeech();
  const { config } = useAccessibility();

  const readAllCommands = async () => {
    const commandText = commands
      .map((cmd: any) => `Say "${cmd.phrase}" to ${cmd.description}`)
      .join('. ');
    
    await speak(`Available voice commands: ${commandText}`);
  };

  if (!config.voiceNavigation) return null;

  return (
    <div className="voice-help-panel">
      <h3>Voice Commands</h3>
      <button 
        onClick={readAllCommands}
        className="btn-secondary"
        aria-label="Read all voice commands aloud"
      >
        🔊 Read Commands
      </button>
      
      <ul className="voice-commands-list">
        {commands.map((command: any, index: number) => (
          <li key={index} className="voice-command-item">
            <strong>"{command.phrase}"</strong> - {command.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Text Reading Component
interface ReadableTextProps {
  children: React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const ReadableText: React.FC<ReadableTextProps> = ({ 
  children, 
  className = '', 
  priority = 'medium' 
}) => {
  const { speak, isEnabled } = useTextToSpeech();
  const { config } = useAccessibility();
  const textRef = useRef<HTMLDivElement>(null);

  const handleTextClick = async () => {
    if (!isEnabled || !textRef.current) return;
    
    const text = textRef.current.textContent || '';
    const options = {
      priority,
      rate: config.readingSpeed === 'slow' ? 0.8 : 
            config.readingSpeed === 'fast' ? 1.4 : 1.0
    };
    
    await speak(text, options);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isEnabled) {
      handleTextClick();
    }
  };

  return (
    <div 
      ref={textRef}
      className={`readable-text ${className} ${isEnabled ? 'tts-enabled' : ''}`}
      onClick={isEnabled ? handleTextClick : undefined}
      onKeyPress={handleKeyPress}
      tabIndex={isEnabled ? 0 : -1}
      role={isEnabled ? 'button' : undefined}
      aria-label={isEnabled ? 'Click to read aloud' : undefined}
    >
      {children}
      {isEnabled && (
        <span className="tts-indicator" aria-hidden="true">🔊</span>
      )}
    </div>
  );
};

// Font Size Control Component
export const FontSizeControl: React.FC = () => {
  const { fontSize, setFontSize } = useVisualAccessibility();
  const { speak } = useTextToSpeech();

  const fontSizes = [
    { value: 'small', label: 'Small', emoji: '🔤' },
    { value: 'medium', label: 'Medium', emoji: '🔤' },
    { value: 'large', label: 'Large', emoji: '🔤' },
    { value: 'extra-large', label: 'Extra Large', emoji: '🔤' }
  ];

  const handleFontChange = async (size: any) => {
    setFontSize(size);
    await speak(`Font size changed to ${size.replace('-', ' ')}`);
  };

  return (
    <div className="font-size-control">
      <h4>Text Size</h4>
      <div className="font-size-options">
        {fontSizes.map(({ value, label, emoji }) => (
          <button
            key={value}
            className={`font-size-option ${fontSize === value ? 'active' : ''}`}
            onClick={() => handleFontChange(value)}
            aria-label={`Set font size to ${label}`}
            aria-pressed={fontSize === value}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Simplified Mental Health Card Component
interface SimpleMentalHealthCardProps {
  title: string;
  description: string;
  action: string;
  icon: string;
  onClick: () => void;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export const SimpleMentalHealthCard: React.FC<SimpleMentalHealthCardProps> = ({
  title,
  description,
  action,
  icon,
  onClick,
  difficulty = 'easy'
}) => {
  const { speak } = useTextToSpeech();
  const { config } = useAccessibility();

  const handleCardClick = async () => {
    if (config.textToSpeech) {
      await speak(`${title}. ${description}`);
    }
    onClick();
  };

  const difficultyColors = {
    easy: '#4CAF50',
    medium: '#FF9800', 
    hard: '#F44336'
  };

  return (
    <div 
      className={`mental-health-card ${config.touchFriendly ? 'touch-friendly' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${description}. Click to ${action}`}
      style={{ borderLeftColor: difficultyColors[difficulty] }}
    >
      <div className="card-icon" aria-hidden="true">{icon}</div>
      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
        <button className="card-action" aria-label={action}>
          {action}
        </button>
      </div>
      <div className="difficulty-indicator">
        <span className="sr-only">Difficulty: {difficulty}</span>
        {'⭐'.repeat(difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3)}
      </div>
    </div>
  );
};

// Emergency Quick Access Component
export const EmergencyQuickAccess: React.FC = () => {
  const { speak } = useTextToSpeech();
  
  const emergencyActions = [
    {
      title: 'Crisis Help',
      icon: '🚨',
      action: () => window.location.href = '/crisis',
      description: 'Immediate mental health crisis support'
    },
    {
      title: 'Call Support',
      icon: '📞',
      action: () => window.open('tel:988'),
      description: 'Call suicide prevention hotline'
    },
    {
      title: 'Breathing Exercise',
      icon: '🫁',
      action: () => window.location.href = '/breathing',
      description: 'Quick calming breathing exercise'
    }
  ];

  const handleEmergencyAction = async (action: any, title: string) => {
    await speak(`Accessing ${title}`);
    action();
  };

  return (
    <div className="emergency-access" role="region" aria-label="Emergency mental health support">
      <h2>Need Help Now?</h2>
      <div className="emergency-actions">
        {emergencyActions.map(({ title, icon, action, description }) => (
          <button
            key={title}
            className="emergency-button"
            onClick={() => handleEmergencyAction(action, title)}
            aria-label={description}
          >
            <span className="emergency-icon" aria-hidden="true">{icon}</span>
            <span className="emergency-title">{title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default {
  AccessibilityControlPanel,
  IconBasedNavigation,
  VoiceCommandHelp,
  ReadableText,
  FontSizeControl,
  SimpleMentalHealthCard,
  EmergencyQuickAccess
};
