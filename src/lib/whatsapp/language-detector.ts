export class LanguageDetector {
  private languagePatterns = {
    en: /^[a-zA-Z\s.,!?'"()-]+$/,
    zh: /[\u4e00-\u9fff]/,
    bn: /[\u0980-\u09FF]/,
    ta: /[\u0B80-\u0BFF]/,
    my: /[\u1000-\u109F]/,
    id: /^[a-zA-Z\s.,!?'"()-]+$/
  };

  private commonWords = {
    en: ['hello', 'hi', 'help', 'yes', 'no', 'thank', 'please', 'good', 'bad'],
    zh: ['你好', '帮助', '是', '不', '谢谢', '请', '好', '坏'],
    bn: ['হ্যালো', 'সাহায্য', 'হ্যাঁ', 'না', 'ধন্যবাদ', 'অনুগ্রহ'],
    ta: ['வணக்கம்', 'உதவி', 'ஆம்', 'இல்லை', 'நன்றி'],
    my: ['မင်္ဂလာပါ', 'ကူညီ', 'ဟုတ်', 'မဟုတ်', 'ကျေးဇူး'],
    id: ['halo', 'bantuan', 'ya', 'tidak', 'terima kasih', 'tolong']
  };

  async detect(text: string): Promise<string> {
    const normalizedText = text.toLowerCase().trim();
    
    // Check for script patterns first
    for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
      if (pattern.test(text)) {
        // For scripts that could be multiple languages, check common words
        if (lang === 'en' || lang === 'id') {
          const words = this.commonWords[lang as keyof typeof this.commonWords];
          const hasCommonWords = words.some(word => normalizedText.includes(word));
          if (hasCommonWords) {
            return lang;
          }
        } else {
          return lang;
        }
      }
    }

    // Fallback: check for common words in any language
    for (const [lang, words] of Object.entries(this.commonWords)) {
      const hasCommonWords = words.some(word => normalizedText.includes(word));
      if (hasCommonWords) {
        return lang;
      }
    }

    // Default to English if no pattern matches
    return 'en';
  }

  getSupportedLanguages(): string[] {
    return Object.keys(this.languagePatterns);
  }
}