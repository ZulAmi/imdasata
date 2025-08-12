import React from 'react';
import { I18nProvider, useI18n, useTranslation, useVoice, useCulturalAdaptation, useLanguageSwitch } from '../hooks/useI18n';

// Example component demonstrating i18n features
const I18nExampleContent: React.FC = () => {
  const { currentLanguage, isRTL } = useI18n();
  const { t } = useTranslation();
  const { speak, startListening, stopListening, isListening, isSupported: isVoiceSupported } = useVoice();
  const { culturalSettings, adaptForFamily, shouldShowFamilyOptions } = useCulturalAdaptation();
  const { changeLanguage } = useLanguageSwitch();

  const handleSpeak = () => {
    const message = t('mentalHealth.welcome', { 
      namespace: 'mentalHealth',
      context: 'therapeutic' 
    });
    speak(message);
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'my', name: 'မြန်မာ' },
    { code: 'id', name: 'Bahasa Indonesia' }
  ];

  return (
    <div 
      style={{ 
        direction: isRTL ? 'rtl' : 'ltr',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <h1>{t('common.welcome', { namespace: 'common' })}</h1>
      
      {/* Language Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ marginRight: '10px' }}>
          {t('common.language', { namespace: 'common' })}:
        </label>
        <select 
          value={currentLanguage} 
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{ padding: '5px' }}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mental Health Content Examples */}
      <div style={{ marginBottom: '20px' }}>
        <h2>{t('mentalHealth.title', { namespace: 'mentalHealth' })}</h2>
        <p>
          {t('mentalHealth.supportMessage', { 
            namespace: 'mentalHealth',
            context: 'therapeutic' 
          })}
        </p>
      </div>

      {/* Emotion Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('emotions.howAreYouFeeling', { namespace: 'emotions' })}</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['happy', 'sad', 'anxious', 'calm', 'stressed'].map(emotion => (
            <button
              key={emotion}
              style={{ 
                padding: '10px 15px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                background: '#f5f5f5',
                cursor: 'pointer'
              }}
              onClick={() => {
                const emotionText = t(`emotions.${emotion}`, { 
                  namespace: 'emotions',
                  context: 'therapeutic' 
                });
                speak(emotionText);
              }}
            >
              {t(`emotions.${emotion}`, { namespace: 'emotions' })}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Features */}
      {isVoiceSupported && (
        <div style={{ marginBottom: '20px' }}>
          <h3>{t('voice.title', { namespace: 'voice' })}</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSpeak}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: '#007acc',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {t('voice.speak', { namespace: 'voice' })}
            </button>
            <button
              onClick={handleVoiceInput}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: isListening ? '#dc3545' : '#28a745',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              {isListening 
                ? t('voice.stopListening', { namespace: 'voice' })
                : t('voice.startListening', { namespace: 'voice' })
              }
            </button>
          </div>
        </div>
      )}

      {/* Cultural Adaptations Demo */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('cultural.title', { namespace: 'cultural' })}</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['formal', 'casual', 'therapeutic'].map(context => (
            <button
              key={context}
              style={{
                padding: '8px 12px',
                borderRadius: '3px',
                border: '1px solid #ddd',
                background: '#fff',
                cursor: 'pointer'
              }}
              onClick={() => {
                const adaptedText = t('common.greeting', { 
                  namespace: 'common',
                  context: context as 'formal' | 'casual' | 'therapeutic'
                });
                alert(`${context.toUpperCase()}: ${adaptedText}`);
              }}
            >
              {t(`cultural.context.${context}`, { namespace: 'cultural' })}
            </button>
          ))}
        </div>
      </div>

      {/* Family Support (for high-stigma cultures) */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('family.title', { namespace: 'family' })}</h3>
        <p>{t('family.supportMessage', { namespace: 'family' })}</p>
        <button
          style={{
            padding: '10px 15px',
            borderRadius: '5px',
            border: '1px solid #007acc',
            background: 'white',
            color: '#007acc',
            cursor: 'pointer'
          }}
          onClick={() => speak(t('family.invitationMessage', { namespace: 'family' }))}
        >
          {t('family.inviteSupport', { namespace: 'family' })}
        </button>
      </div>

      {/* Current Language Info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <strong>Current Language Info:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Language: {currentLanguage}</li>
          <li>Direction: {isRTL ? 'Right-to-Left' : 'Left-to-Right'}</li>
          <li>Voice Support: {isVoiceSupported ? 'Yes' : 'No'}</li>
          <li>Listening: {isListening ? 'Active' : 'Inactive'}</li>
        </ul>
      </div>
    </div>
  );
};

// Main component with provider
const I18nExample: React.FC = () => {
  return (
    <I18nProvider>
      <I18nExampleContent />
    </I18nProvider>
  );
};

export default I18nExample;
