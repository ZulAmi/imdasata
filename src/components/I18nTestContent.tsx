'use client';

import React, { useState } from 'react';
import { useI18n, useTranslation, useVoice, useCulturalAdaptation, useLanguageSwitch, useDirectionalStyles } from '../hooks/useI18n';

export default function I18nTestContent() {
  const { currentLanguage, isRTL, isLoading, error } = useI18n();
  const { t } = useTranslation();
  const { speak, startListening, stopListening, isListening, isSupported: isVoiceSupported } = useVoice();
  const { shouldShowFamilyOptions, isFamilyOriented, getStigmaLevel } = useCulturalAdaptation();
  const { supportedLanguages, changeLanguage, isChanging } = useLanguageSwitch();
  const { getDirection, getTextAlign } = useDirectionalStyles();

  const [selectedMood, setSelectedMood] = useState('');
  const [testMessage, setTestMessage] = useState('');

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Loading i18n system...</h2>
        <div>Please wait while translations are being loaded.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <h2>Error loading i18n system</h2>
        <div>Error: {error}</div>
      </div>
    );
  }

  const handleLanguageChange = async (languageCode: string) => {
    console.log(`Changing language to: ${languageCode}`);
    const success = await changeLanguage(languageCode);
    console.log(`Language change ${success ? 'successful' : 'failed'}`);
  };

  const handleSpeak = (text: string) => {
    if (isVoiceSupported) {
      speak(text);
    } else {
      alert('Voice not supported in this browser');
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const moods = ['happy', 'sad', 'anxious', 'calm', 'stressed', 'hopeful'];

  return (
    <div style={{ 
      direction: getDirection(),
      textAlign: getTextAlign(),
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '2rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
          🌍 SATA i18n System Test
        </h1>
        <p style={{ color: '#7f8c8d', margin: 0 }}>
          Test language switching, voice features, and cultural adaptations
        </p>
      </div>

      {/* Language Selector */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>🔄 Language Selector</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 'bold' }}>Select Language:</label>
          <select 
            value={currentLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isChanging}
            style={{
              padding: '8px 12px',
              borderRadius: '5px',
              border: '1px solid #ced4da',
              backgroundColor: 'white',
              fontSize: '16px',
              minWidth: '200px'
            }}
          >
            {supportedLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
          {isChanging && <span style={{ color: '#ffc107' }}>⏳ Changing...</span>}
        </div>
      </div>

      {/* Current Language Info */}
      <div style={{ 
        backgroundColor: '#e8f4f8', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #bee5eb'
      }}>
        <h3 style={{ marginTop: 0, color: '#0c5460' }}>📋 Current Language Info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div><strong>Language:</strong> {currentLanguage.toUpperCase()}</div>
          <div><strong>Direction:</strong> {isRTL ? 'Right-to-Left (RTL)' : 'Left-to-Right (LTR)'}</div>
          <div><strong>Voice Support:</strong> {isVoiceSupported ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Family Oriented:</strong> {isFamilyOriented ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Stigma Level:</strong> {getStigmaLevel()}</div>
          <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Translation Test */}
      <div style={{ 
        backgroundColor: '#f0f8ff', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #b3d9ff'
      }}>
        <h3 style={{ marginTop: 0, color: '#0056b3' }}>💬 Translation Test</h3>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <strong>Common.Welcome:</strong> {t('welcome', { namespace: 'common' })}
          </div>
          <div>
            <strong>Mental Health Title:</strong> {t('title', { namespace: 'mentalHealth' })}
          </div>
          <div>
            <strong>Mental Health Support:</strong> {t('supportMessage', { namespace: 'mentalHealth', context: 'therapeutic' })}
          </div>
          <div>
            <strong>How are you feeling:</strong> {t('howAreYouFeeling', { namespace: 'emotions' })}
          </div>
        </div>
      </div>

      {/* Mood Tracker */}
      <div style={{ 
        backgroundColor: '#fff5f5', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '2rem',
        border: '1px solid #fed7d7'
      }}>
        <h3 style={{ marginTop: 0, color: '#c53030' }}>😊 Mood Tracker</h3>
        <p>{t('howAreYouFeeling', { namespace: 'emotions' })}</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {moods.map(mood => (
            <button
              key={mood}
              onClick={() => {
                setSelectedMood(mood);
                const moodText = t(mood, { namespace: 'emotions', context: 'therapeutic' });
                setTestMessage(`Selected mood: ${moodText}`);
                handleSpeak(moodText);
              }}
              style={{
                padding: '0.75rem',
                border: selectedMood === mood ? '2px solid #007acc' : '1px solid #ccc',
                borderRadius: '8px',
                background: selectedMood === mood ? '#e6f3ff' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {t(mood, { namespace: 'emotions' }) || mood}
            </button>
          ))}
        </div>
        {testMessage && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: '#e6f3ff', 
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            {testMessage}
          </div>
        )}
      </div>

      {/* Voice Features */}
      {isVoiceSupported && (
        <div style={{ 
          backgroundColor: '#f0fff4', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid #9ae6b4'
        }}>
          <h3 style={{ marginTop: 0, color: '#2d7d32' }}>🎤 Voice Features</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              onClick={() => handleSpeak(t('welcome', { namespace: 'common' }))}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: '#007acc',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🔊 {t('speak', { namespace: 'voice' }) || 'Speak Welcome'}
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
              {isListening ? '🛑 Stop' : '🎤 Listen'}
            </button>
            <button
              onClick={() => handleSpeak(t('supportMessage', { namespace: 'mentalHealth', context: 'therapeutic' }))}
              style={{
                padding: '10px 15px',
                borderRadius: '5px',
                border: 'none',
                background: '#6f42c1',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🩺 Speak Support Message
            </button>
          </div>
          {isListening && (
            <div style={{ 
              padding: '0.5rem', 
              backgroundColor: '#fff3cd', 
              borderRadius: '4px',
              fontSize: '14px',
              border: '1px solid #ffeaa7'
            }}>
              🎤 Listening for voice input...
            </div>
          )}
        </div>
      )}

      {/* Cultural Adaptations */}
      {shouldShowFamilyOptions() && (
        <div style={{ 
          backgroundColor: '#fdf2e9', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid #fab795'
        }}>
          <h3 style={{ marginTop: 0, color: '#dd6b20' }}>👨‍👩‍👧‍👦 Family Support Features</h3>
          <p>{t('supportMessage', { namespace: 'family' }) || 'Family involvement is encouraged in your culture.'}</p>
          <button
            onClick={() => {
              const familyMessage = t('invitationMessage', { namespace: 'family' }) || 'Would you like to invite a family member to join your session?';
              handleSpeak(familyMessage);
              alert(familyMessage);
            }}
            style={{
              padding: '10px 15px',
              borderRadius: '5px',
              border: '1px solid #dd6b20',
              background: 'white',
              color: '#dd6b20',
              cursor: 'pointer'
            }}
          >
            {t('inviteSupport', { namespace: 'family' }) || 'Invite Family Support'}
          </button>
        </div>
      )}

      {/* Manual Test Input */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '1rem', 
        borderRadius: '8px', 
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>🧪 Manual Test</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter text to speak..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              flex: '1',
              minWidth: '200px'
            }}
          />
          <button
            onClick={() => handleSpeak(testMessage)}
            disabled={!testMessage || !isVoiceSupported}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              background: testMessage && isVoiceSupported ? '#007acc' : '#6c757d',
              color: 'white',
              cursor: testMessage && isVoiceSupported ? 'pointer' : 'not-allowed'
            }}
          >
            🔊 Speak
          </button>
        </div>
      </div>

      {/* Debug Info */}
      <details style={{ marginTop: '2rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#6c757d' }}>
          🐛 Debug Information
        </summary>
        <pre style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '1rem', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          marginTop: '0.5rem'
        }}>
{JSON.stringify({
  currentLanguage,
  isRTL,
  isLoading,
  error,
  isVoiceSupported,
  isListening,
  isFamilyOriented,
  stigmaLevel: getStigmaLevel(),
  supportedLanguagesCount: supportedLanguages.length,
  direction: getDirection()
}, null, 2)}
        </pre>
      </details>
    </div>
  );
}
