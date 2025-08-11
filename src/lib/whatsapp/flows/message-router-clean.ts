import { Twilio } from 'twilio';
import { prisma } from '@/lib/prisma';
import { OnboardingFlow } from './onboarding-flow';
import { AssessmentFlow } from './assessment-flow';
import { ResourceFlow } from './resource-flow';

export enum RouteType {
  ONBOARDING = 'onboarding',
  ASSESSMENT = 'assessment',
  RESOURCE_REQUEST = 'resource_request',
  PEER_SUPPORT = 'peer_support',
  DAILY_CHECKIN = 'daily_checkin',
  CRISIS_INTERVENTION = 'crisis_intervention',
  BUDDY_SYSTEM = 'buddy_system',
  IDLE = 'idle',
  HELP = 'help'
}

interface UserSession {
  userId: string;
  anonymousId: string;
  language: string;
  currentFlow: string;
  flowStep: number;
  context: Record<string, any>;
  lastActivity: Date;
  isNewUser: boolean;
}

interface FlowResponse {
  message: string;
  quickReplies?: string[];
  buttons?: Array<{id: string, title: string}>;
  nextFlow?: string;
  nextStep?: number;
  context?: Record<string, any>;
  shouldEndFlow?: boolean;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export class MessageRouter {
  private client: Twilio;
  private onboardingFlow: OnboardingFlow;
  private assessmentFlow: AssessmentFlow;
  private resourceFlow: ResourceFlow;

  private sessions: Map<string, UserSession> = new Map();

  // Crisis keywords in multiple languages
  private crisisKeywords = [
    // English
    'suicide', 'kill myself', 'want to die', 'end my life', 'hurt myself', 'self harm',
    'no point living', 'better off dead', 'cant go on', 'hopeless', 'worthless',
    // Chinese
    '自杀', '想死', '结束生命', '伤害自己', '自残', '活着没意思', '死了算了', '绝望', '没用',
    // Bengali
    'আত্মহত্যা', 'মরতে চাই', 'জীবন শেষ', 'নিজেকে ক্ষতি', 'আশাহীন', 'অকেজো',
    // Tamil
    'தற்கொலை', 'இறக்க வேண்டும்', 'வாழ்க்கையை முடிக்க', 'தன்னைத் தாக்க', 'நம்பிக்கையற்ற',
    // Myanmar
    'သေချင်', 'ဘဝကို အဆုံးသတ်', 'မိမိကို နာကျင်အောင်', 'မျှော်လင့်ချက်မရှ',
    // Indonesian
    'bunuh diri', 'ingin mati', 'mengakhiri hidup', 'menyakiti diri', 'putus asa', 'tidak berguna'
  ];

  constructor(twilioClient: Twilio) {
    this.client = twilioClient;
    this.onboardingFlow = new OnboardingFlow(null as any);
    this.assessmentFlow = new AssessmentFlow(null as any);
    this.resourceFlow = new ResourceFlow(null as any);
  }

  async routeMessage(from: string, messageBody: string): Promise<string> {
    try {
      // Get or create user session
      const session = await this.getOrCreateSession(from);
      
      // Check for crisis intervention keywords first (highest priority)
      if (this.detectCrisisKeywords(messageBody)) {
        return await this.handleCrisisIntervention(session, messageBody);
      }

      // Determine route based on message content and current session state
      const route = this.determineRoute(messageBody, session);
      
      // Handle the message based on the route
      const response = await this.handleRoute(route, messageBody, session);
      
      // Update session state
      await this.updateSession(from, response, session);
      
      return response.message;

    } catch (error) {
      console.error('Error routing message:', error);
      return this.getLocalizedText('error_message', 'en');
    }
  }

  private async getOrCreateSession(from: string): Promise<UserSession> {
    // Check if session exists in memory
    if (this.sessions.has(from)) {
      const session = this.sessions.get(from)!;
      session.lastActivity = new Date();
      return session;
    }

    // Check if user exists in database
    let user = await prisma.anonymousUser.findUnique({
      where: { anonymousId: from }
    });

    let isNewUser = false;
    if (!user) {
      // Create new user
      user = await prisma.anonymousUser.create({
        data: {
          anonymousId: from,
          language: 'en', // Default language
          isActive: true
        }
      });
      isNewUser = true;
    }

    // Create session
    const session: UserSession = {
      userId: user.id,
      anonymousId: from,
      language: user.language,
      currentFlow: isNewUser ? RouteType.ONBOARDING : RouteType.IDLE,
      flowStep: 0,
      context: {},
      lastActivity: new Date(),
      isNewUser
    };

    this.sessions.set(from, session);
    return session;
  }

  private detectCrisisKeywords(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.crisisKeywords.some(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
  }

  private determineRoute(message: string, session: UserSession): RouteType {
    const lowerMessage = message.toLowerCase();

    // If user is already in a flow, continue with it
    if (session.currentFlow && session.currentFlow !== RouteType.IDLE) {
      return session.currentFlow as RouteType;
    }

    // Check for specific route triggers
    if (this.matchesPattern(lowerMessage, ['start', 'begin', 'hello', 'hi', 'new', 'setup'])) {
      return session.isNewUser ? RouteType.ONBOARDING : RouteType.HELP;
    }

    if (this.matchesPattern(lowerMessage, ['assessment', 'phq', 'test', 'check', 'mental health', 'evaluate', '评估', 'মূল্যায়ন', 'மதிப்பீடு', 'အကဲဖြတ်', 'penilaian'])) {
      return RouteType.ASSESSMENT;
    }

    if (this.matchesPattern(lowerMessage, ['resource', 'help', 'support', 'find', 'need', 'counseling', 'therapy', '资源', 'সংস্থান', 'வளங்கள்', 'အရင်းအမြစ်', 'sumber daya'])) {
      return RouteType.RESOURCE_REQUEST;
    }

    if (this.matchesPattern(lowerMessage, ['checkin', 'mood', 'how feeling', 'daily', '心情', 'মুড', 'மனநிலை', 'စိတ်ခံစားမှု', 'suasana hati'])) {
      return RouteType.DAILY_CHECKIN;
    }

    if (this.matchesPattern(lowerMessage, ['peer', 'group', 'friend', 'buddy', 'connect', '同伴', 'সমকক্ষ', 'சக', 'လုပ်ဖော်ကိုင်ဖက်', 'teman'])) {
      return RouteType.PEER_SUPPORT;
    }

    if (this.matchesPattern(lowerMessage, ['help', 'menu', 'options', 'what can you do', '帮助', 'সাহায্য', 'உதவி', 'အကူအညီ', 'bantuan'])) {
      return RouteType.HELP;
    }

    // Default to help/main menu
    return RouteType.HELP;
  }

  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  private async handleRoute(route: RouteType, message: string, session: UserSession): Promise<FlowResponse> {
    switch (route) {
      case RouteType.ONBOARDING:
        return await this.onboardingFlow.handleMessage(message, session);
      
      case RouteType.ASSESSMENT:
        return await this.assessmentFlow.handleMessage(message, session);
      
      case RouteType.RESOURCE_REQUEST:
        return await this.resourceFlow.handleMessage(message, session);
      
      case RouteType.DAILY_CHECKIN:
        return await this.handleDailyCheckin(message, session);
      
      case RouteType.PEER_SUPPORT:
        return await this.handlePeerSupport(message, session);
      
      case RouteType.BUDDY_SYSTEM:
        return await this.handleBuddySystem(message, session);
      
      case RouteType.HELP:
        return await this.handleHelp(message, session);
      
      default:
        return await this.handleHelp(message, session);
    }
  }

  private async handleCrisisIntervention(session: UserSession, originalMessage: string): Promise<string> {
    // Immediate crisis response
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'CRISIS_ALERT',
        entityType: 'crisis_intervention',
        entityId: `crisis_${Date.now()}`,
        metadata: {
          originalMessage,
          triggeredAt: new Date().toISOString(),
          language: session.language
        }
      }
    });

    // Update session to crisis intervention flow
    session.currentFlow = RouteType.CRISIS_INTERVENTION;
    session.flowStep = 0;
    session.context = { originalMessage };

    return this.getLocalizedText('crisis_immediate_response', session.language);
  }

  private async handleDailyCheckin(message: string, session: UserSession): Promise<FlowResponse> {
    // Basic mood check-in implementation
    return {
      message: this.getLocalizedText('daily_checkin_prompt', session.language),
      quickReplies: [
        this.getLocalizedText('mood_great', session.language),
        this.getLocalizedText('mood_good', session.language),
        this.getLocalizedText('mood_okay', session.language),
        this.getLocalizedText('mood_difficult', session.language),
        this.getLocalizedText('mood_struggling', session.language)
      ],
      nextFlow: RouteType.IDLE,
      shouldEndFlow: true
    };
  }

  private async handlePeerSupport(message: string, session: UserSession): Promise<FlowResponse> {
    // Find available support groups
    const supportGroups = await prisma.supportGroup.findMany({
      where: {
        language: session.language,
        isActive: true
      },
      take: 3
    });

    if (supportGroups.length === 0) {
      return {
        message: this.getLocalizedText('no_groups_available', session.language),
        buttons: [
          { id: 'request_group', title: this.getLocalizedText('request_new_group', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        nextFlow: RouteType.IDLE,
        shouldEndFlow: true
      };
    }

    let groupsMessage = this.getLocalizedText('available_groups', session.language) + '\n\n';
    supportGroups.forEach((group, index) => {
      groupsMessage += `${index + 1}. ${group.name}\n`;
      groupsMessage += `   ${group.description || ''}\n`;
      groupsMessage += `   Max Members: ${group.maxMembers}\n\n`;
    });

    return {
      message: groupsMessage,
      buttons: supportGroups.map((group, index) => ({
        id: `join_group_${group.id}`,
        title: `Join ${group.name}`
      })),
      nextFlow: RouteType.IDLE,
      shouldEndFlow: true
    };
  }

  private async handleBuddySystem(message: string, session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_system_intro', session.language),
      buttons: [
        { id: 'find_buddy', title: this.getLocalizedText('find_buddy', session.language) },
        { id: 'be_buddy', title: this.getLocalizedText('become_buddy', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: RouteType.IDLE,
      shouldEndFlow: true
    };
  }

  private async handleHelp(message: string, session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('help_menu', session.language),
      buttons: [
        { id: 'take_assessment', title: this.getLocalizedText('take_assessment', session.language) },
        { id: 'browse_resources', title: this.getLocalizedText('browse_resources', session.language) },
        { id: 'daily_checkin', title: this.getLocalizedText('daily_checkin', session.language) },
        { id: 'peer_support', title: this.getLocalizedText('peer_support', session.language) },
        { id: 'my_progress', title: this.getLocalizedText('view_progress', session.language) },
        { id: 'settings', title: this.getLocalizedText('settings', session.language) }
      ],
      nextFlow: RouteType.IDLE,
      shouldEndFlow: true
    };
  }

  private async updateSession(from: string, response: FlowResponse, session: UserSession): Promise<void> {
    // Update session state based on response
    if (response.nextFlow) {
      session.currentFlow = response.nextFlow;
    }
    
    if (response.nextStep !== undefined) {
      session.flowStep = response.nextStep;
    }
    
    if (response.context) {
      session.context = { ...session.context, ...response.context };
    }
    
    if (response.shouldEndFlow) {
      session.currentFlow = RouteType.IDLE;
      session.flowStep = 0;
      session.context = {};
    }

    session.lastActivity = new Date();
    
    // Update in memory
    this.sessions.set(from, session);
    
    // Optionally persist to database/Redis for production
    // await this.persistSession(from, session);
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      crisis_immediate_response: {
        en: "🚨 I'm very concerned about you right now. Your safety is the most important thing.\n\n🛡️ You are not alone. Help is available 24/7.\n\nPlease let me know: Are you safe right now?",
        zh: "🚨 我现在非常担心您。您的安全是最重要的。\n\n🛡️ 您并不孤单。24/7都有帮助可用。\n\n请告诉我：您现在安全吗？",
        bn: "🚨 আমি এখন আপনার জন্য খুবই চিন্তিত। আপনার নিরাপত্তাই সবচেয়ে গুরুত্বপূর্ণ।\n\n🛡️ আপনি একা নন। ২৪/৭ সাহায্য উপলব্ধ।\n\nঅনুগ্রহ করে জানান: আপনি কি এখন নিরাপদ?",
        ta: "🚨 நான் இப்போது உங்களைப் பற்றி மிகவும் கவலைப்படுகிறேன். உங்கள் பாதுகாப்பு மிக முக்கியம்.\n\n🛡️ நீங்கள் தனியாக இல்லை. உதவி 24/7 கிடைக்கிறது.\n\nதயவுசெய்து தெரியப்படுத்துங்கள்: நீங்கள் இப்போது பாதுகாப்பாக இருக்கிறீர்களா?",
        my: "🚨 ကျွန်တော် အခုချိန်မှာ သင့်အတွက် အရမ်းစိုးရိမ်နေပါတယ်။ သင့်လုံခြုံမှုက အရေးကြီးဆုံးပါ။\n\n🛡️ သင်တစ်ယောက်တည်းမဟုတ်ပါ။ ၂၄/၇ အကူအညီရနိုင်ပါတယ်။\n\nကျေးဇူးပြုပြီး ပြောပြပါ: သင် အခုချိန်မှာ လုံခြုံပါသလား?",
        id: "🚨 Saya sangat khawatir tentang Anda sekarang. Keselamatan Anda adalah hal yang paling penting.\n\n🛡️ Anda tidak sendirian. Bantuan tersedia 24/7.\n\nTolong beri tahu saya: Apakah Anda aman sekarang?"
      },
      help_menu: {
        en: "🏠 **SATA Mental Wellness Assistant**\n\nI'm here to support your mental health journey. Here's what I can help you with:",
        zh: "🏠 **SATA心理健康助手**\n\n我在这里支持您的心理健康之旅。我可以帮助您：",
        bn: "🏠 **SATA মানসিক সুস্থতার সহায়ক**\n\nআমি আপনার মানসিক স্বাস্থ্যের যাত্রায় সহায়তা করতে এখানে আছি। আমি যেভাবে সাহায্য করতে পারি:",
        ta: "🏠 **SATA மன நல உதவியாளர்**\n\nஉங்கள் மன நல பயணத்தை ஆதரிக்க நான் இங்கே இருக்கிறேன். நான் உங்களுக்கு எப்படி உதவ முடியும்:",
        my: "🏠 **SATA စိတ်ကျန်းမာရေး အကူအညী**\n\nသင့်ရဲ့ စိတ်ကျန်းမာရေး ခရီးကို ထောက်ပံ့ဖို့ ကျွန်တော် ဒီမှာ ရှိပါတယ်။ ကျွန်တော် ဘယ်လို ကူညီနိုင်လဲ:",
        id: "🏠 **SATA Asisten Kesehatan Mental**\n\nSaya di sini untuk mendukung perjalanan kesehatan mental Anda. Berikut cara saya dapat membantu Anda:"
      },
      error_message: {
        en: "😅 I'm having trouble understanding that. Could you try rephrasing or type 'help' for options?",
        zh: "😅 我很难理解这一点。您能尝试重新表述或输入帮助来查看选项吗？",
        bn: "😅 আমি বুঝতে সমস্যা হচ্ছে। আপনি কি আবার বলার চেষ্টা করতে পারেন বা বিকল্পের জন্য 'সাহায্য' টাইপ করতে পারেন?",
        ta: "😅 அதைப் புரிந்துகொள்வதில் சிக்கல் உள்ளது. மீண்டும் சொல்ல முயற்சிக்கவும் அல்லது விருப்பங்களுக்கு 'உதவி' என தட்டச்சு செய்யவும்?",
        my: "😅 နားမလည်ပါ။ ထပ်ပြောကြည့်ပါ သို့မဟုတ် ရွေးချယ်စရာများအတွက် 'အကူအညီ' ဟုရိုက်ပါ?",
        id: "😅 Saya kesulitan memahami itu. Bisakah Anda mencoba mengungkapkannya kembali atau ketik 'bantuan' untuk opsi?"
      },
      take_assessment: {
        en: "📋 Take Mental Health Assessment",
        zh: "📋 进行心理健康评估",
        bn: "📋 মানসিক স্বাস্থ্য মূল্যায়ন নিন",
        ta: "📋 மன நல மதிப்பீடு எடுக்கவும்",
        my: "📋 စိတ်ကျန်းမာရေး အကဲဖြတ်မှု လုပ်ပါ",
        id: "📋 Ambil Penilaian Kesehatan Mental"
      },
      browse_resources: {
        en: "📚 Browse Resources",
        zh: "📚 浏览资源",
        bn: "📚 সংস্থান ব্রাউজ করুন",
        ta: "📚 வளங்களை உலாவுங்கள்",
        my: "📚 အရင်းအမြစ်များ ကြည့်ရှုပါ",
        id: "📚 Jelajahi Sumber Daya"
      },
      daily_checkin: {
        en: "📅 Daily Check-in",
        zh: "📅 每日签到",
        bn: "📅 দৈনিক চেক-ইন",
        ta: "📅 தினசரி செக்-இன்",
        my: "📅 နေ့စဉ် စစ်ဆေးမှု",
        id: "📅 Check-in Harian"
      },
      peer_support: {
        en: "👥 Peer Support",
        zh: "👥 同伴支持",
        bn: "👥 সমকক্ষ সহায়তা",
        ta: "👥 சக ஆதரவு",
        my: "👥 လုပ်ဖော်ကိုင်ဖက် အထောက်အပံ့",
        id: "👥 Dukungan Sebaya"
      },
      main_menu: {
        en: "🏠 Main Menu",
        zh: "🏠 主菜单",
        bn: "🏠 প্রধান মেনু",
        ta: "🏠 முதன்மை மெனு",
        my: "🏠 ပင်မ မီနူး",
        id: "🏠 Menu Utama"
      }
    };

    const textSet = texts[key];
    if (!textSet) return key;
    
    return textSet[language] || textSet.en || key;
  }
}
