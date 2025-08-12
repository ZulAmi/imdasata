# SATA i18n Integration Guide

Quick guide to integrate the SATA i18n system into an existing React project.

## 📁 File Structure

After integration, your project should have these files:

```
src/
├── lib/
│   └── i18n-system.ts          # Core i18n engine
├── hooks/
│   └── useI18n.tsx             # React hooks for i18n
├── translations/
│   ├── en.json                 # English translations
│   ├── zh.json                 # Chinese translations
│   ├── bn.json                 # Bengali translations
│   ├── ta.json                 # Tamil translations
│   ├── my.json                 # Burmese translations
│   └── id.json                 # Indonesian translations
└── examples/
    └── I18nExample.tsx         # Usage examples
```

## 🚀 Integration Steps

### Step 1: Install Dependencies (if needed)

The system uses only built-in browser APIs and React, so no additional dependencies are required. However, ensure you have:

```bash
npm install react@^18.0.0 typescript@^4.0.0
```

### Step 2: Wrap Your App with I18nProvider

```tsx
// src/App.tsx
import React from "react";
import { I18nProvider } from "./hooks/useI18n";
import { YourExistingApp } from "./YourExistingApp";

function App() {
  return (
    <I18nProvider>
      <YourExistingApp />
    </I18nProvider>
  );
}

export default App;
```

### Step 3: Add Language Selector to Your Header/Navigation

```tsx
// src/components/LanguageSelector.tsx
import React from "react";
import { useLanguageSwitch } from "../hooks/useI18n";

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, supportedLanguages, changeLanguage, isChanging } =
    useLanguageSwitch();

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Language:</label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        disabled={isChanging}
        className="language-select"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};
```

### Step 4: Replace Hardcoded Text with Translations

**Before:**

```tsx
// Old component with hardcoded text
function WelcomePage() {
  return (
    <div>
      <h1>Welcome to SATA</h1>
      <p>Mental health support for everyone</p>
      <button>Get Started</button>
    </div>
  );
}
```

**After:**

```tsx
// Updated component with i18n
import { useTranslation } from "../hooks/useI18n";

function WelcomePage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("welcome.title", { namespace: "common" })}</h1>
      <p>{t("welcome.subtitle", { namespace: "mentalHealth" })}</p>
      <button>{t("getStarted", { namespace: "buttons" })}</button>
    </div>
  );
}
```

### Step 5: Add RTL Support to Your CSS

```css
/* src/styles/global.css */

/* RTL Support */
[dir="rtl"] {
  text-align: right;
}

[dir="ltr"] {
  text-align: left;
}

/* Margin/Padding helpers for RTL */
.margin-start {
  margin-inline-start: var(--spacing);
}

.margin-end {
  margin-inline-end: var(--spacing);
}

.padding-start {
  padding-inline-start: var(--spacing);
}

.padding-end {
  padding-inline-end: var(--spacing);
}

/* Language selector styling */
.language-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.language-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
}

.language-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Step 6: Add RTL Styling Support to Components

```tsx
// src/components/Card.tsx
import React from "react";
import { useDirectionalStyles } from "../hooks/useI18n";

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  const { getDirection, getTextAlign, getMarginStart } = useDirectionalStyles();

  return (
    <div
      style={{
        direction: getDirection(),
        textAlign: getTextAlign(),
        ...getMarginStart("1rem"),
        padding: "1rem",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
      }}
    >
      <h3>{title}</h3>
      {children}
    </div>
  );
};
```

## 🎯 Common Integration Patterns

### Form Components

```tsx
// src/components/ContactForm.tsx
import React, { useState } from "react";
import { useTranslation } from "../hooks/useI18n";

export const ContactForm: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "" });

  return (
    <form>
      <div>
        <label>{t("name", { namespace: "forms" })}</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t("enterName", { namespace: "forms" })}
        />
      </div>

      <div>
        <label>{t("email", { namespace: "forms" })}</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder={t("enterEmail", { namespace: "forms" })}
        />
      </div>

      <button type="submit">{t("submit", { namespace: "buttons" })}</button>
    </form>
  );
};
```

### Error Messages

```tsx
// src/components/ErrorBoundary.tsx
import React from "react";
import { useTranslation } from "../hooks/useI18n";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  const { t } = useTranslation();

  return (
    <div role="alert" style={{ padding: "2rem", textAlign: "center" }}>
      <h2>{t("somethingWentWrong", { namespace: "errors" })}</h2>
      <pre style={{ color: "red", margin: "1rem 0" }}>{error.message}</pre>
      <button onClick={resetError}>
        {t("tryAgain", { namespace: "buttons" })}
      </button>
    </div>
  );
};
```

### Mental Health Specific Components

```tsx
// src/components/MoodTracker.tsx
import React, { useState } from "react";
import {
  useTranslation,
  useVoice,
  useCulturalAdaptation,
} from "../hooks/useI18n";

export const MoodTracker: React.FC = () => {
  const { t } = useTranslation();
  const { speak, isSupported: isVoiceSupported } = useVoice();
  const { shouldShowFamilyOptions, isFamilyOriented } = useCulturalAdaptation();
  const [selectedMood, setSelectedMood] = useState<string>("");

  const moods = ["happy", "sad", "anxious", "calm", "stressed", "hopeful"];

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);

    // Speak the selected mood if voice is supported
    if (isVoiceSupported) {
      const moodText = t(`emotions.${mood}`, {
        namespace: "emotions",
        context: "therapeutic",
      });
      speak(moodText);
    }
  };

  return (
    <div>
      <h2>{t("howAreYouFeeling", { namespace: "emotions" })}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "1rem",
        }}
      >
        {moods.map((mood) => (
          <button
            key={mood}
            onClick={() => handleMoodSelect(mood)}
            style={{
              padding: "1rem",
              border:
                selectedMood === mood ? "2px solid #007acc" : "1px solid #ccc",
              borderRadius: "8px",
              background: selectedMood === mood ? "#e6f3ff" : "white",
              cursor: "pointer",
            }}
          >
            {t(`emotions.${mood}`, { namespace: "emotions" })}
          </button>
        ))}
      </div>

      {/* Show family support option for family-oriented cultures */}
      {shouldShowFamilyOptions() && selectedMood && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f8f9fa",
            borderRadius: "8px",
          }}
        >
          <p>{t("family.moodSupport", { namespace: "family" })}</p>
          <button style={{ marginTop: "0.5rem", padding: "0.5rem 1rem" }}>
            {t("family.inviteSupport", { namespace: "family" })}
          </button>
        </div>
      )}
    </div>
  );
};
```

## 🔧 Testing Your Integration

### 1. Language Switching Test

```tsx
// src/components/__tests__/LanguageTest.tsx
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import { I18nProvider } from "../hooks/useI18n";
import { LanguageSelector } from "../components/LanguageSelector";

test("should switch language when selection changes", async () => {
  render(
    <I18nProvider>
      <LanguageSelector />
    </I18nProvider>
  );

  const selector = screen.getByLabelText("Language:");

  // Switch to Chinese
  fireEvent.change(selector, { target: { value: "zh" } });

  // Verify the language changed
  expect(selector.value).toBe("zh");
});
```

### 2. Translation Test

```tsx
// src/components/__tests__/TranslationTest.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "../hooks/useI18n";
import { WelcomePage } from "../components/WelcomePage";

test("should display English translations by default", () => {
  render(
    <I18nProvider>
      <WelcomePage />
    </I18nProvider>
  );

  // Check for English text (assuming it's in your translations)
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

## 🚨 Common Issues and Solutions

### Issue 1: Translation Not Found

**Problem:** Getting "Translation not found" warnings

**Solution:** Ensure the key exists in all translation files:

```json
// Check that the key exists in all language files
// en.json, zh.json, bn.json, ta.json, my.json, id.json
{
  "common": {
    "yourNewKey": "Your translation here"
  }
}
```

### Issue 2: Voice Features Not Working

**Problem:** Voice synthesis/recognition not functioning

**Solution:** Check browser compatibility and user permissions:

```tsx
// Add voice feature detection
const { isSupported } = useVoice();

if (!isSupported) {
  return (
    <p>Voice features require a modern browser with Web Speech API support</p>
  );
}
```

### Issue 3: RTL Layout Issues

**Problem:** Layout broken in RTL languages

**Solution:** Use CSS logical properties and the directional hooks:

```tsx
// Instead of margin-left, use margin-inline-start
const { getMarginStart } = useDirectionalStyles();

<div style={{
  ...getMarginStart('1rem'), // Automatically handles RTL/LTR
  // Instead of textAlign: 'left'
  textAlign: 'start' // CSS logical property
}}>
```

### Issue 4: Cultural Adaptations Not Showing

**Problem:** Family options not appearing for family-oriented cultures

**Solution:** Check the cultural configuration and use the hooks properly:

```tsx
const { shouldShowFamilyOptions, isFamilyOriented } = useCulturalAdaptation();

// Make sure to call shouldShowFamilyOptions() as a function
if (shouldShowFamilyOptions()) {
  // Show family options
}
```

## 📝 Migration Checklist

- [ ] Copy all i18n system files to your project
- [ ] Wrap your app with `I18nProvider`
- [ ] Add language selector to navigation
- [ ] Replace hardcoded text with `t()` function calls
- [ ] Add RTL CSS support
- [ ] Update forms to use translated labels
- [ ] Test voice features in supported browsers
- [ ] Verify cultural adaptations work correctly
- [ ] Add error boundaries with translated messages
- [ ] Test language switching functionality

## 🎉 You're Ready!

Your SATA application now has comprehensive internationalization support with cultural sensitivity and voice features. The system will automatically:

- Detect user's preferred language
- Adapt mental health terminology for cultural context
- Support voice interactions in all languages
- Handle RTL text rendering
- Provide family-oriented features where appropriate

For more examples and advanced usage, check the complete example in `src/examples/I18nExample.tsx`.
