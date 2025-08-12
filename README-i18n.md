# SATA Internationalization (i18n) System

A comprehensive internationalization system designed specifically for mental health applications, supporting cultural sensitivity, voice features, and accessibility.

## Features

### 🌍 **Multi-Language Support**

- **6 Target Languages**: English, Mandarin Chinese, Bengali, Tamil, Burmese, Bahasa Indonesia
- **Cultural Context**: Each language includes culturally appropriate mental health terminology
- **Right-to-Left (RTL)** text support for applicable languages
- **Family-oriented** adaptations for cultures with high mental health stigma

### 🗣️ **Voice Integration**

- **Text-to-Speech**: Native browser synthesis in all supported languages
- **Voice Recognition**: Speech-to-text input with cultural adaptations
- **Real-time Feedback**: Voice activity indicators and error handling
- **Language-specific Voice Codes**: Optimized voice selection per language

### 🎭 **Cultural Sensitivity**

- **Mental Health Stigma Awareness**: Adaptive language based on cultural context
- **Formality Levels**: Support for formal, casual, and therapeutic contexts
- **Family Involvement**: Features for family-oriented mental health support
- **Cultural Terminology**: Appropriate mental health vocabulary for each culture

### ⚡ **Advanced Features**

- **Automatic Language Detection**: Browser-based language preference detection
- **Real-time Language Switching**: Seamless language changes with event system
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance**: Lazy loading and efficient translation caching

## Quick Start

### 1. Setup the Provider

```tsx
import React from "react";
import { I18nProvider } from "./hooks/useI18n";
import YourApp from "./YourApp";

function App() {
  return (
    <I18nProvider>
      <YourApp />
    </I18nProvider>
  );
}

export default App;
```

### 2. Basic Translation Usage

```tsx
import React from "react";
import { useTranslation } from "./hooks/useI18n";

function WelcomeMessage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("common.welcome", { namespace: "common" })}</h1>
      <p>
        {t("mentalHealth.supportMessage", {
          namespace: "mentalHealth",
          context: "therapeutic",
        })}
      </p>
    </div>
  );
}
```

### 3. Voice Features

```tsx
import React from "react";
import { useVoice } from "./hooks/useI18n";

function VoiceControls() {
  const { speak, startListening, stopListening, isListening, isSupported } =
    useVoice();

  if (!isSupported) {
    return <div>Voice features not supported in this browser</div>;
  }

  return (
    <div>
      <button onClick={() => speak("Hello, how are you feeling today?")}>
        Speak Message
      </button>
      <button onClick={isListening ? stopListening : startListening}>
        {isListening ? "Stop Listening" : "Start Voice Input"}
      </button>
    </div>
  );
}
```

### 4. Language Switching

```tsx
import React from "react";
import { useLanguageSwitch } from "./hooks/useI18n";

function LanguageSelector() {
  const { currentLanguage, supportedLanguages, changeLanguage, isChanging } =
    useLanguageSwitch();

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
      disabled={isChanging}
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
```

### 5. Cultural Adaptations

```tsx
import React from "react";
import { useCulturalAdaptation } from "./hooks/useI18n";

function CulturalSupport() {
  const {
    shouldShowFamilyOptions,
    adaptForFamily,
    getStigmaLevel,
    isFamilyOriented,
  } = useCulturalAdaptation();

  return (
    <div>
      {shouldShowFamilyOptions() && (
        <div>
          <h3>Family Support</h3>
          <p>{adaptForFamily("Would you like to involve family members?")}</p>
        </div>
      )}

      {getStigmaLevel() === "high" && (
        <div>
          <p>We understand discussing mental health can be sensitive...</p>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### Translation Hooks

#### `useTranslation()`

The primary hook for accessing translations.

```tsx
const { t, formatDate, formatNumber, formatCurrency } = useTranslation();

// Basic translation
const message = t("key", { namespace: "common" });

// With context (formal, casual, therapeutic)
const greeting = t("greeting", {
  namespace: "common",
  context: "formal",
});

// With interpolation
const welcome = t("welcome", {
  namespace: "common",
  interpolation: { name: "John" },
});

// Date formatting
const date = formatDate(new Date(), "medium");
```

#### `useI18n()`

Core i18n state and utilities.

```tsx
const { currentLanguage, isRTL, isLoading, setLanguage } = useI18n();
```

### Voice Hooks

#### `useVoice()`

Voice synthesis and recognition features.

```tsx
const {
  speak, // (text: string, options?) => Promise<void>
  startListening, // (options?) => Promise<void>
  stopListening, // () => void
  isSupported, // boolean
  isListening, // boolean
  isSpeaking, // boolean
  language, // string
} = useVoice();

// Speak text with options
await speak("Hello world", {
  rate: 1.2,
  pitch: 1.0,
  volume: 0.8,
});

// Start voice recognition
await startListening({
  continuous: true,
  interimResults: true,
});
```

### Cultural Hooks

#### `useCulturalAdaptation()`

Cultural sensitivity and adaptation features.

```tsx
const {
  culturalSettings, // Current cultural configuration
  languageConfig, // Current language configuration
  isRTL, // Right-to-left text direction
  isFormalitySupported, // Language supports formality levels
  isFamilyOriented, // Culture is family-oriented
  adaptForFamily, // Adapt text for family context
  shouldShowFamilyOptions, // Should show family involvement options
  getStigmaLevel, // Get mental health stigma level
} = useCulturalAdaptation();
```

#### `useLanguageSwitch()`

Language switching and management.

```tsx
const {
  currentLanguage, // Current language code
  supportedLanguages, // Array of supported languages
  changeLanguage, // (code: string) => Promise<boolean>
  isChanging, // Loading state during language change
} = useLanguageSwitch();
```

### Utility Hooks

#### `useDirectionalStyles()`

RTL/LTR styling utilities.

```tsx
const {
  getDirection, // () => 'rtl' | 'ltr'
  getTextAlign, // () => 'right' | 'left'
  getMarginStart, // (value: string) => CSS object
  getMarginEnd, // (value: string) => CSS object
  getPaddingStart, // (value: string) => CSS object
  getPaddingEnd, // (value: string) => CSS object
} = useDirectionalStyles();

// Usage in components
<div
  style={{
    direction: getDirection(),
    textAlign: getTextAlign(),
    ...getMarginStart("20px"),
  }}
>
  Content
</div>;
```

## Translation Structure

### Namespaces

The system organizes translations into logical namespaces:

- **`common`**: General UI elements, buttons, navigation
- **`navigation`**: Menu items, breadcrumbs, links
- **`forms`**: Form labels, validation, inputs
- **`buttons`**: Button labels and actions
- **`mentalHealth`**: Mental health terminology and concepts
- **`emotions`**: Emotion names and descriptions
- **`assessments`**: Assessment tools and questionnaires
- **`therapy`**: Therapeutic content and interventions
- **`voice`**: Voice feature labels and controls
- **`audio`**: Audio-related content
- **`privacy`**: Privacy policies and consent
- **`consent`**: Consent forms and agreements
- **`cultural`**: Cultural adaptation content
- **`family`**: Family involvement features
- **`errors`**: Error messages and troubleshooting
- **`feedback`**: User feedback and ratings
- **`dates`**: Date-related content
- **`time`**: Time-related content

### Translation Keys

Example translation structure:

```json
{
  "common": {
    "welcome": "Welcome",
    "greeting": "Hello",
    "language": "Language",
    "save": "Save",
    "cancel": "Cancel"
  },
  "mentalHealth": {
    "title": "Mental Health Support",
    "welcome": "Welcome to your mental health journey",
    "supportMessage": "You are not alone. We are here to help.",
    "seekHelp": "It's okay to seek help",
    "confidential": "Your privacy is important to us"
  },
  "emotions": {
    "howAreYouFeeling": "How are you feeling today?",
    "happy": "Happy",
    "sad": "Sad",
    "anxious": "Anxious",
    "calm": "Calm",
    "stressed": "Stressed"
  }
}
```

## Cultural Configurations

### Language Settings

Each language includes cultural configuration:

```typescript
{
  code: 'bn',
  name: 'Bengali',
  nativeName: 'বাংলা',
  region: 'south_asia',
  rtl: false,
  voiceSupported: true,
  culturalContext: 'south_asian',
  mentalHealthStigma: 'high',
  familyOriented: true,
  formalityLevels: true,
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'bn-BD',
  voiceCodes: ['bn-BD', 'bn-IN']
}
```

### Cultural Adaptations

- **High Stigma Cultures**: Use gentler, more indirect language
- **Family-Oriented Cultures**: Include family involvement options
- **Formal Cultures**: Default to formal language register
- **RTL Languages**: Automatic text direction and layout adjustments

## Accessibility

### Screen Reader Support

- Proper ARIA labels for language changes
- Announcements for voice feature status
- Semantic HTML structure

### Keyboard Navigation

- All interactive elements keyboard accessible
- Focus management during language changes
- Logical tab order

### Voice Accessibility

- Alternative text input for voice recognition
- Visual feedback for voice interactions
- Error handling with clear messaging

## Browser Support

### Voice Features

- **Chrome/Edge**: Full support (Web Speech API)
- **Firefox**: Synthesis only (no recognition)
- **Safari**: Synthesis only (limited recognition)
- **Mobile**: Platform-dependent

### Core Features

- **All modern browsers**: Translation, formatting, cultural adaptations
- **IE11+**: Basic translation support (no voice features)

## Performance

### Optimization Strategies

- **Lazy Loading**: Translations loaded on demand
- **Caching**: Efficient memory management
- **Event System**: Minimal re-renders on language changes
- **Tree Shaking**: Only used translations included in bundle

### Bundle Size

- Core system: ~15KB gzipped
- Per language: ~5-8KB gzipped
- Voice features: ~3KB gzipped

## Contributing

### Adding New Languages

1. Create translation file in `src/translations/[code].json`
2. Add language configuration to `SUPPORTED_LANGUAGES`
3. Include cultural settings and voice codes
4. Test with cultural adaptations

### Translation Guidelines

1. **Mental Health Sensitivity**: Use appropriate, non-stigmatizing language
2. **Cultural Context**: Consider local mental health terminology
3. **Family Dynamics**: Respect cultural family structures
4. **Formality**: Include appropriate formal/informal variants
5. **Gender**: Use inclusive, gender-neutral language where possible

## Examples

See `src/examples/I18nExample.tsx` for a comprehensive demonstration of all features.

## License

[Your License Here]

## Support

For questions about cultural adaptations or mental health terminology, please consult with local mental health professionals and cultural experts.
