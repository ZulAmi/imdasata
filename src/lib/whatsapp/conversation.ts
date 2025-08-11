import { prisma } from '@/lib/prisma';

interface UserState {
  userId: string;
  language: string;
  currentFlow: string;
  step: number;
  context: Record<string, any>;
  lastActivity: Date;
}

interface ConversationResponse {
  message: string;
  quickReplies?: string[];
  buttons?: Array<{id: string, title: string}>;
  newState: UserState;
}

export class ConversationFlow {
  async processMessage(message: string, userState: UserState): Promise<ConversationResponse> {
    const lowerMessage = message.toLowerCase().trim();

    // Handle global commands
    if (lowerMessage === 'help' || lowerMessage === 'menu') {
      return this.showMainMenu(userState);
    }

    if (lowerMessage === 'stop' || lowerMessage === 'quit') {
      return this.handleStopCommand(userState);
    }

    // Route to appropriate flow
    switch (userState.currentFlow) {
      case 'welcome':
        return this.handleWelcomeFlow(message, userState);
      case 'phq4_assessment':
        return this.handlePHQ4Flow(message, userState);
      case 'mood_checkin':
        return this.handleMoodCheckin(message, userState);
      case 'peer_support':
        return this.handlePeerSupport(message, userState);
      case 'resources':
        return this.handleResourcesFlow(message, userState);
      default:
        return this.showMainMenu(userState);
    }
  }

  private showMainMenu(userState: UserState): ConversationResponse {
    const menuText = this.getLocalizedText('main_menu', userState.language);
    
    return {
      message: menuText,
      quickReplies: [
        this.getLocalizedText('menu_assessment', userState.language),
        this.getLocalizedText('menu_mood_log', userState.language),
        this.getLocalizedText('menu_resources', userState.language),
        this.getLocalizedText('menu_peer_support', userState.language)
      ],
      newState: {
        ...userState,
        currentFlow: 'main_menu',
        step: 0,
        context: {}
      }
    };
  }

  private async handleWelcomeFlow(message: string, userState: UserState): Promise<ConversationResponse> {
    if (userState.step === 0) {
      // First interaction - welcome message
      const welcomeText = this.getLocalizedText('welcome_message', userState.language);
      
      return {
        message: welcomeText,
        quickReplies: [
          this.getLocalizedText('get_started', userState.language),
          this.getLocalizedText('learn_more', userState.language)
        ],
        newState: {
          ...userState,
          step: 1
        }
      };
    } else {
      // User responded to welcome
      if (message.toLowerCase().includes('start') || message.includes('开始') || message.includes('শুরু')) {
        return this.showMainMenu(userState);
      } else {
        return this.showAppInfo(userState);
      }
    }
  }

  private async handlePHQ4Flow(message: string, userState: UserState): Promise<ConversationResponse> {
    const questions = [
      'phq4_q1_nervous',
      'phq4_q2_worry',
      'phq4_q3_little_interest',
      'phq4_q4_feeling_down'
    ];

    if (userState.step === 0) {
      // Start assessment
      const introText = this.getLocalizedText('phq4_intro', userState.language);
      const firstQuestion = this.getLocalizedText(questions[0], userState.language);
      
      return {
        message: `${introText}\n\n1/4: ${firstQuestion}`,
        quickReplies: ['0 - Not at all', '1 - Several days', '2 - More than half', '3 - Nearly every day'],
        newState: {
          ...userState,
          step: 1,
          context: { answers: [] }
        }
      };
    } else if (userState.step <= 4) {
      // Process answer and ask next question
      const score = this.parseScore(message);
      if (score === -1) {
        return {
          message: this.getLocalizedText('invalid_score', userState.language),
          quickReplies: ['0 - Not at all', '1 - Several days', '2 - More than half', '3 - Nearly every day'],
          newState: userState
        };
      }

      userState.context.answers.push(score);

      if (userState.step === 4) {
        // Assessment complete
        return await this.completePHQ4Assessment(userState);
      } else {
        // Ask next question
        const nextQuestion = this.getLocalizedText(questions[userState.step], userState.language);
        return {
          message: `${userState.step + 1}/4: ${nextQuestion}`,
          quickReplies: ['0 - Not at all', '1 - Several days', '2 - More than half', '3 - Nearly every day'],
          newState: {
            ...userState,
            step: userState.step + 1
          }
        };
      }
    }

    return this.showMainMenu(userState);
  }

  private async completePHQ4Assessment(userState: UserState): Promise<ConversationResponse> {
    const answers = userState.context.answers as number[];
    const anxietyScore = answers[0] + answers[1]; // First 2 questions (Q3, Q4 in schema)
    const depressionScore = answers[2] + answers[3]; // Last 2 questions (Q1, Q2 in schema)
    const totalScore = anxietyScore + depressionScore;

    // Determine severity based on PHQ-4 scoring
    const getSeverityLevel = (totalScore: number): string => {
      if (totalScore >= 9) return 'severe';
      if (totalScore >= 6) return 'moderate';
      if (totalScore >= 3) return 'mild';
      return 'minimal';
    };

    // Save to database using correct schema field names
    await prisma.pHQ4Assessment.create({
      data: {
        userId: userState.userId,
        question1Score: answers[2], // "Little interest or pleasure in doing things"
        question2Score: answers[3], // "Feeling down, depressed, or hopeless"
        question3Score: answers[0], // "Feeling nervous, anxious, or on edge"
        question4Score: answers[1], // "Not being able to stop or control worrying"
        anxietyScore,
        depressionScore,
        totalScore,
        severityLevel: getSeverityLevel(totalScore),
        language: userState.language
      }
    });

    // Award points for completing assessment
    await this.awardPoints(userState.userId, 'ASSESSMENT_COMPLETED', 10);

    // Generate response based on severity
    let responseKey = 'phq4_result_minimal';
    if (totalScore >= 6) {
      responseKey = 'phq4_result_moderate';
      
      // Create service referral for moderate/severe cases - find a counseling resource first
      const counselingResource = await prisma.mentalHealthResource.findFirst({
        where: {
          category: 'counseling',
          isActive: true
        }
      });

      if (counselingResource) {
        await prisma.serviceReferral.create({
          data: {
            userId: userState.userId,
            resourceId: counselingResource.id,
            referralType: 'counseling',
            urgencyLevel: totalScore >= 9 ? 'high' : 'medium',
            language: userState.language
          }
        });
      }
    } else if (totalScore >= 3) {
      responseKey = 'phq4_result_mild';
    }

    const resultMessage = this.getLocalizedText(responseKey, userState.language);
    
    return {
      message: resultMessage,
      buttons: [
        { id: 'view_resources', title: this.getLocalizedText('view_resources', userState.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu_button', userState.language) }
      ],
      newState: {
        ...userState,
        currentFlow: 'main_menu',
        step: 0,
        context: {}
      }
    };
  }

  private async handleMoodCheckin(message: string, userState: UserState): Promise<ConversationResponse> {
    if (userState.step === 0) {
      // Ask for mood rating
      return {
        message: this.getLocalizedText('mood_checkin_prompt', userState.language),
        quickReplies: ['😔 1-2', '😐 3-4', '🙂 5-6', '😊 7-8', '😄 9-10'],
        newState: {
          ...userState,
          step: 1
        }
      };
    } else if (userState.step === 1) {
      // Process mood rating
      const moodScore = this.parseMoodLevel(message);
      if (moodScore === -1) {
        return {
          message: this.getLocalizedText('invalid_mood', userState.language),
          quickReplies: ['😔 1-2', '😐 3-4', '🙂 5-6', '😊 7-8', '😄 9-10'],
          newState: userState
        };
      }

      userState.context.moodScore = moodScore;

      return {
        message: this.getLocalizedText('mood_notes_prompt', userState.language),
        newState: {
          ...userState,
          step: 2
        }
      };
    } else if (userState.step === 2) {
      // Save mood log using correct schema field names
      const notes = message === 'skip' ? null : message;
      
      await prisma.moodLog.create({
        data: {
          userId: userState.userId,
          moodScore: userState.context.moodScore, // Changed from moodLevel to moodScore
          notes,
          emotions: [], // Default empty array for emotions
          triggers: [], // Default empty array for triggers
          language: userState.language
        }
      });

      // Award points
      await this.awardPoints(userState.userId, 'MOOD_LOG_COMPLETED', 5);

      const thankYouMessage = this.getLocalizedText('mood_logged_thanks', userState.language);
      
      return {
        message: thankYouMessage,
        buttons: [
          { id: 'view_trends', title: this.getLocalizedText('view_mood_trends', userState.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu_button', userState.language) }
        ],
        newState: {
          ...userState,
          currentFlow: 'main_menu',
          step: 0,
          context: {}
        }
      };
    }

    return this.showMainMenu(userState);
  }

  private async handleResourcesFlow(message: string, userState: UserState): Promise<ConversationResponse> {
    const categories = ['crisis', 'counseling', 'support_group', 'self_help'];
    
    if (userState.step === 0) {
      return {
        message: this.getLocalizedText('resources_menu', userState.language),
        quickReplies: categories.map(cat => this.getLocalizedText(`category_${cat}`, userState.language)),
        newState: {
          ...userState,
          step: 1
        }
      };
    } else {
      // Find matching category
      const selectedCategory = this.matchCategory(message, userState.language);
      if (selectedCategory) {
        const resources = await prisma.mentalHealthResource.findMany({
          where: {
            category: selectedCategory,
            isActive: true
          },
          take: 3
        });

        let resourceText = this.getLocalizedText('resources_found', userState.language) + '\n\n';
        resources.forEach((resource, index) => {
          const content = this.getResourceContent(resource, userState.language);
          resourceText += `${index + 1}. ${content}\n\n`;
        });

        return {
          message: resourceText,
          buttons: [
            { id: 'more_resources', title: this.getLocalizedText('more_resources', userState.language) },
            { id: 'main_menu', title: this.getLocalizedText('main_menu_button', userState.language) }
          ],
          newState: {
            ...userState,
            currentFlow: 'main_menu',
            step: 0,
            context: {}
          }
        };
      }
    }

    return this.showMainMenu(userState);
  }

  private async handlePeerSupport(message: string, userState: UserState): Promise<ConversationResponse> {
    // Implementation for peer support flow
    return {
      message: this.getLocalizedText('peer_support_coming_soon', userState.language),
      buttons: [
        { id: 'main_menu', title: this.getLocalizedText('main_menu_button', userState.language) }
      ],
      newState: {
        ...userState,
        currentFlow: 'main_menu',
        step: 0,
        context: {}
      }
    };
  }

  async handleSentimentResponse(sentiment: any, userState: UserState): Promise<ConversationResponse> {
    let responseKey = 'sentiment_neutral';
    
    if (sentiment.score < -0.5) {
      responseKey = 'sentiment_negative';
      // Offer additional support for negative sentiment
    } else if (sentiment.score > 0.5) {
      responseKey = 'sentiment_positive';
    }

    return {
      message: this.getLocalizedText(responseKey, userState.language),
      buttons: [
        { id: 'mood_checkin', title: this.getLocalizedText('log_mood', userState.language) },
        { id: 'view_resources', title: this.getLocalizedText('view_resources', userState.language) }
      ],
      newState: userState
    };
  }

  private parseScore(message: string): number {
    const match = message.match(/^[0-3]/) || message.match(/[0-3]/);
    return match ? parseInt(match[0]) : -1;
  }

  private parseMoodLevel(message: string): number {
    if (message.includes('1-2') || message.includes('😔')) return 2;
    if (message.includes('3-4') || message.includes('😐')) return 4;
    if (message.includes('5-6') || message.includes('🙂')) return 6;
    if (message.includes('7-8') || message.includes('😊')) return 8;
    if (message.includes('9-10') || message.includes('😄')) return 10;
    
    const num = parseInt(message);
    return (num >= 1 && num <= 10) ? num : -1;
  }

  private async awardPoints(userId: string, action: string, points: number): Promise<void> {
    await prisma.gamificationData.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: points },
        updatedAt: new Date() // Changed from lastActivity to updatedAt
      },
      create: {
        userId,
        totalPoints: points,
        level: 1,
        streak: 1
      }
    });
  }

  private getLocalizedText(key: string, language: string): string {
    // Enhanced localization with SATA project requirements
    const texts: Record<string, Record<string, string>> = {
      main_menu: {
        en: "🌟 Mental Wellness Assistant\n\nHow can I help you today?",
        zh: "🌟 心理健康助手\n\n我今天可以为您做些什么？",
        bn: "🌟 মানসিক সুস্থতার সহায়ক\n\nআজ আমি আপনাকে কিভাবে সাহায্য করতে পারি?",
        ta: "🌟 மன நல உதவியாளர்\n\nஇன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
        my: "🌟 စိတ်ကျန်းမာရေး အကူအညီ\n\nယနေ့ ကျွန်တော် သင့်ကို ဘယ်လို ကူညီနိုင်မလဲ?",
        id: "🌟 Asisten Kesejahteraan Mental\n\nBagaimana saya bisa membantu Anda hari ini?"
      },
      welcome_message: {
        en: "👋 Welcome! I'm here to support your mental wellness journey. Everything is confidential and anonymous.",
        zh: "👋 欢迎！我在这里支持您的心理健康之旅。一切都是保密和匿名的。",
        bn: "👋 স্বাগতম! আমি আপনার মানসিক সুস্থতার যাত্রায় সহায়তা করতে এখানে আছি। সবকিছু গোপনীয় এবং নামহীন।",
        ta: "👋 வரவேற்கிறோம்! உங்கள் மன நல பயணத்தை ஆதரிக்க நான் இங்கே இருக்கிறேன். எல்லாம் ரகசியமானது மற்றும் அநாமதேயமானது.",
        my: "👋 ကြိုဆိုပါတယ်! သင့်စိတ်ကျန်းမာရေး ခရီးကို ပံ့ပိုးဖို့ ကျွန်တော် ဒီမှာရှိပါတယ်။ အားလုံး လျှို့ဝှက်ပြီး အမည်မဖော်ပါ။",
        id: "👋 Selamat datang! Saya di sini untuk mendukung perjalanan kesejahteraan mental Anda. Semuanya rahasia dan anonim."
      },
      phq4_intro: {
        en: "📋 This is a brief mental health screening (PHQ-4). It takes 2 minutes and helps assess anxiety and depression levels.",
        zh: "📋 这是一个简短的心理健康筛查(PHQ-4)。需要2分钟，有助于评估焦虑和抑郁水平。",
        bn: "📋 এটি একটি সংক্ষিপ্ত মানসিক স্বাস্থ্য স্ক্রিনিং (PHQ-4)। এটি 2 মিনিট সময় নেয় এবং উদ্বেগ ও বিষণ্নতার মাত্রা মূল্যায়ন করতে সাহায্য করে।",
        ta: "📋 இது ஒரு சுருக்கமான மன நல பரிசோதனை (PHQ-4). இது 2 நி்மிடங்கள் எடுக்கும் மற்றும் கவலை மற்றும் மனச்சோர்வு நிலைகளை மதிப்பிட உதவுகிறது.",
        my: "📋 ဒါက တိုတောင်းတဲ့ စိတ်ကျန်းမာရေး စစ်ဆေးမှု (PHQ-4) ပါ။ ၂ မိနစ်ခန့် ကြာပြီး စိုးရိမ်မှုနဲ့ စိတ်ဓာတ်ကျမှု အဆင့်များကို အကဲဖြတ်ဖို့ ကူညီပါတယ်။",
        id: "📋 Ini adalah skrining kesehatan mental singkat (PHQ-4). Membutuhkan 2 menit dan membantu menilai tingkat kecemasan dan depresi."
      },
      mood_checkin_prompt: {
        en: "😊 How are you feeling today? Please rate your mood from 1-10:",
        zh: "😊 您今天感觉如何？请给您的心情打分1-10：",
        bn: "😊 আজ আপনার মন কেমন? অনুগ্রহ করে ১-১০ এর মধ্যে আপনার মেজাজ রেট করুন:",
        ta: "😊 இன்று நீங்கள் எப்படி உணர்கிறீர்கள்? தயவுசெய்து உங்கள் மனநிலையை 1-10 க்கு மதிப்பிடுங்கள்:",
        my: "😊 ယနေ့ သင် ဘယ်လို ခံစားနေပါသလဲ? သင့်စိတ်ခံစားမှုကို ၁-၁၀ အတွင်း အဆင့်သတ်မှတ်ပါ:",
        id: "😊 Bagaimana perasaan Anda hari ini? Silakan beri nilai suasana hati Anda dari 1-10:"
      }
      // Add more localized texts as needed...
    };

    const textSet = texts[key];
    if (!textSet) return key;
    
    return textSet[language] || textSet.en || key;
  }

  private showAppInfo(userState: UserState): ConversationResponse {
    return {
      message: this.getLocalizedText('app_info', userState.language),
      buttons: [
        { id: 'get_started', title: this.getLocalizedText('get_started', userState.language) }
      ],
      newState: {
        ...userState,
        currentFlow: 'main_menu',
        step: 0
      }
    };
  }

  private handleStopCommand(userState: UserState): ConversationResponse {
    return {
      message: this.getLocalizedText('goodbye_message', userState.language),
      newState: {
        ...userState,
        currentFlow: 'stopped',
        step: 0,
        context: {}
      }
    };
  }

  private matchCategory(message: string, language: string): string | null {
    // Implement category matching logic based on user input and language
    const categoryMappings: Record<string, string[]> = {
      'crisis': ['crisis', 'emergency', '危机', 'সংকট', 'நெருக்கடி', 'အရေးပေါ်', 'krisis'],
      'counseling': ['counseling', 'therapy', '咨询', 'পরামর্শ', 'ஆலோசனை', 'အကြံပေးခြင်း', 'konseling'],
      'support_group': ['group', 'support', '小组', 'গ্রুপ', 'குழு', 'အုပ်စု', 'grup'],
      'self_help': ['self', 'help', '自助', 'স্ব-সহায়তা', 'சுய உதவி', 'ကိုယ်တိုင်ကူညီ', 'bantuan diri']
    };

    const lowerMessage = message.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
        return category;
      }
    }
    
    return 'self_help'; // Default fallback
  }

  private getResourceContent(resource: any, language: string): string {
    // Extract content from Json fields based on language
    const title = resource.title?.[language] || resource.title?.en || 'Resource';
    const description = resource.description?.[language] || resource.description?.en || '';
    
    return `${title}\n${description}`;
  }
}