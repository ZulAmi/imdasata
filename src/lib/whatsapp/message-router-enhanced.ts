import { Twilio } from 'twilio';
import { prisma } from '@/lib/prisma';
import { OnboardingFlow } from './flows/onboarding-flow';
import { AssessmentFlow } from './flows/assessment-flow';
import { ResourceFlow } from './flows/resource-flow';
import { CrisisFlow } from './flows/crisis-flow';
import { PeerSupportFlow } from './flows/peer-support-flow';
import { DailyCheckInFlow } from './flows/daily-checkin-flow';
import { BuddySystemFlow } from './flows/buddy-system-flow';
import { WhatsAppService } from './service';
import { LanguageDetector } from './language-detector';
import { SentimentAnalyzer } from './sentiment-analyzer';
import { PhoneMappingService } from '../services/phone-mapping.service';

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

interface IncomingMessage {
  from: string;
  body: string;
  messageId?: string;
  mediaType?: string;
  mediaUrl?: string;
  timestamp: Date;
}

export class WhatsAppMessageRouter {
  private whatsapp: WhatsAppService;
  private languageDetector: LanguageDetector;
  private sentimentAnalyzer: SentimentAnalyzer;
  private phoneMapping: PhoneMappingService;
  private activeSessions: Map<string, UserSession> = new Map();

  // Flow handlers
  private onboardingFlow: OnboardingFlow;
  private assessmentFlow: AssessmentFlow;
  private resourceFlow: ResourceFlow;
  private peerSupportFlow: PeerSupportFlow;
  private checkinFlow: DailyCheckInFlow;
  private crisisFlow: CrisisFlow;
  private buddyFlow: BuddySystemFlow;

  // Crisis intervention keywords by language
  private crisisKeywords = {
    en: ['suicide', 'kill myself', 'end it all', 'worthless', 'hopeless', 'want to die', 'no point living', 'better off dead'],
    zh: ['自杀', '自殺', '死', '结束生命', '結束生命', '没有希望', '沒有希望', '想死', '不想活'],
    bn: ['আত্মহত্যা', 'মৃত্যু', 'জীবন শেষ', 'আশা নেই', 'মরতে চাই', 'বাঁচতে চাই না'],
    ta: ['தற்கொலை', 'இறப்பு', 'வாழ்க்கை முடிவு', 'நம்பிக்கை இல்லை', 'சாக வேண்டும்', 'வாழ விருப்பம் இல்லை'],
    my: ['သေ', 'အသက်ဆုံး', 'မျှော်လင့်ချက်မရှိ', 'သေချင်', 'မရှင်တော့ချင်', 'အသက်မရှင်ချင်'],
    id: ['bunuh diri', 'mati', 'mengakhiri hidup', 'tidak ada harapan', 'ingin mati', 'tidak ingin hidup']
  };

  // Command routing patterns - fixed syntax for Chinese characters
  private commandPatterns = {
    help: ['help', 'bantuan', '帮助', '幫助', 'সাহায্য', 'உதவி', 'အကူအညီ'],
    assessment: ['assessment', 'test', 'check', '评估', '評估', 'মূল্যায়ন', 'மதிப்பீடு', 'အကဲဖြတ်'],
    resources: ['resources', 'help', 'support', '资源', '資源', 'সম্পদ', 'வளங்கள்', 'အရင်းအမြစ်'],
    mood: ['mood', 'feeling', 'emotion', '心情', '情绪', 'মেজাজ', 'மனநிலை', 'စိတ်ခံစားမှု'],
    peer: ['group', 'peer', 'community', '小组', '同伴', 'গ্রুপ', 'குழু', 'အုပ်စု'],
    buddy: ['buddy', 'friend', 'partner', '伙伴', '朋友', 'বন্ধু', 'நண்பர்', 'မိတ်ဆွေ'],
    checkin: ['checkin', 'daily', 'today', '签到', '每日', 'দৈনিক', 'தினசরি', 'နေ့စဉ်'],
    stop: ['stop', 'quit', 'end', '停止', '退出', 'বন্ধ', 'நிறுத்து', 'ရပ်']
  };

  constructor() {
    this.whatsapp = new WhatsAppService();
    this.languageDetector = new LanguageDetector();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.phoneMapping = new PhoneMappingService();

    // Initialize flow handlers
    this.onboardingFlow = new OnboardingFlow(this.whatsapp);
    this.assessmentFlow = new AssessmentFlow(this.whatsapp);
    this.resourceFlow = new ResourceFlow(this.whatsapp);
    this.peerSupportFlow = new PeerSupportFlow(this.whatsapp);
    this.checkinFlow = new DailyCheckInFlow(this.whatsapp);
    this.crisisFlow = new CrisisFlow(this.whatsapp);
    this.buddyFlow = new BuddySystemFlow(this.whatsapp);
  }

  async handleIncomingMessage(message: IncomingMessage): Promise<void> {
    try {
      console.log(`Processing WhatsApp message from ${message.from}`);

      // Get or create user session
      const session = await this.getOrCreateSession(message.from, message.body);

      // Crisis intervention check - highest priority
      if (await this.detectCrisisMessage(message.body, session.language)) {
        await this.handleCrisisIntervention(message, session);
        return;
      }

      // Route to appropriate flow
      await this.routeToActiveFlow(message, session);

    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      const language = 'en'; // Default fallback
      await this.handleError(message.from, language);
    }
  }

  private async getOrCreateSession(phoneNumber: string, messageText: string): Promise<UserSession> {
    // Check for existing session
    if (this.activeSessions.has(phoneNumber)) {
      const session = this.activeSessions.get(phoneNumber)!;
      session.lastActivity = new Date();
      return session;
    }

    // Get or create anonymous user (simplified implementation)
    let anonymousUser = await prisma.anonymousUser.findFirst({
      where: { deviceFingerprint: phoneNumber } // Using deviceFingerprint as phone identifier
    });
    
    if (!anonymousUser) {
      anonymousUser = await prisma.anonymousUser.create({
        data: {
          anonymousId: `phone_${phoneNumber.replace(/\D/g, '')}`, // Clean phone number
          deviceFingerprint: phoneNumber,
          language: 'en' // Default language
        }
      });
    }
    
    // Simple language detection based on common patterns
    const detectedLanguage = this.detectLanguageFromText(messageText);
    
    // Check if this is a new user (no previous interactions)
    const interactionCount = await prisma.userInteraction.count({
      where: { userId: anonymousUser.id }
    });

    const session: UserSession = {
      userId: anonymousUser.id,
      anonymousId: anonymousUser.id,
      language: detectedLanguage,
      currentFlow: 'idle',
      flowStep: 0,
      context: {},
      lastActivity: new Date(),
      isNewUser: interactionCount === 0
    };

    this.activeSessions.set(phoneNumber, session);
    return session;
  }

  private detectLanguageFromText(text: string): string {
    // Simple language detection based on character patterns
    const lowerText = text.toLowerCase();
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
    
    // Bengali characters  
    if (/[\u0980-\u09FF]/.test(text)) return 'bn';
    
    // Tamil characters
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    
    // Myanmar characters
    if (/[\u1000-\u109F]/.test(text)) return 'my';
    
    // Indonesian/Malay keywords
    if (['selamat', 'terima', 'kasih', 'bantuan', 'kesehatan'].some(word => lowerText.includes(word))) {
      return 'id';
    }
    
    // Bengali keywords
    if (['আমি', 'আপনি', 'সাহায্য', 'ধন্যবাদ', 'স্বাস্থ্য'].some(word => lowerText.includes(word))) {
      return 'bn';
    }
    
    // Default to English
    return 'en';
  }

  private async detectCrisisMessage(text: string, language: string): Promise<boolean> {
    const keywords = this.crisisKeywords[language as keyof typeof this.crisisKeywords] || this.crisisKeywords.en;
    const lowerText = text.toLowerCase();
    
    // Check for crisis keywords
    const hasKeywords = keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    
    // Also use sentiment analysis for additional detection
    const sentiment = await this.sentimentAnalyzer.analyzeText(text);
    const hasNegativeSentiment = sentiment.score < -0.7 && sentiment.confidence > 0.6;
    
    return hasKeywords || hasNegativeSentiment;
  }

  private async handleCrisisIntervention(message: IncomingMessage, session: UserSession): Promise<void> {
    // Immediately switch to crisis flow
    session.currentFlow = 'crisis';
    session.flowStep = 0;
    session.context = { originalMessage: message.body };

    const response = await this.crisisFlow.handleMessage(message.body, session);
    await this.sendResponse(message.from, response, session);

    // Update session
    this.updateSessionFromResponse(session, response);
  }

  private async routeToActiveFlow(message: IncomingMessage, session: UserSession): Promise<void> {
    let response: FlowResponse;

    // Check if user is in an active flow
    if (session.currentFlow && session.currentFlow !== 'idle' && session.currentFlow !== 'stopped') {
      response = await this.handleActiveFlow(message, session);
    } else {
      // Detect command or intent
      const command = this.detectCommand(message.body, session.language);
      response = await this.handleCommand(command, message, session);
    }

    await this.sendResponse(message.from, response, session);
    this.updateSessionFromResponse(session, response);
  }

  private async handleActiveFlow(message: IncomingMessage, session: UserSession): Promise<FlowResponse> {
    switch (session.currentFlow) {
      case 'onboarding':
        return await this.onboardingFlow.handleMessage(message.body, session);
      case 'assessment':
        return await this.assessmentFlow.handleMessage(message.body, session);
      case 'resource':
        return await this.resourceFlow.handleMessage(message.body, session);
      case 'peer':
        return await this.peerSupportFlow.handleMessage(message.body, session);
      case 'checkin':
        return await this.checkinFlow.handleMessage(message.body, session);
      case 'crisis':
        return await this.crisisFlow.handleMessage(message.body, session);
      case 'buddy':
        return await this.buddyFlow.handleMessage(message.body, session);
      default:
        return await this.showMainMenu(session);
    }
  }

  private async handleCommand(command: string | null, message: IncomingMessage, session: UserSession): Promise<FlowResponse> {
    let response: FlowResponse;

    switch (command) {
      case 'help':
        response = await this.showMainMenu(session);
        break;
      
      case 'assessment':
        session.currentFlow = 'assessment';
        session.flowStep = 0;
        response = await this.assessmentFlow.handleMessage(message.body, session);
        break;
      
      case 'resources':
        session.currentFlow = 'resource';
        session.flowStep = 0;
        response = await this.resourceFlow.handleMessage(message.body, session);
        break;
      
      case 'mood':
      case 'checkin':
        session.currentFlow = 'checkin';
        session.flowStep = 0;
        response = await this.checkinFlow.handleMessage(message.body, session);
        break;
      
      case 'peer':
        session.currentFlow = 'peer';
        session.flowStep = 0;
        response = await this.peerSupportFlow.handleMessage(message.body, session);
        break;
      
      case 'buddy':
        session.currentFlow = 'buddy';
        session.flowStep = 0;
        response = await this.buddyFlow.handleMessage(message.body, session);
        break;
      
      case 'stop':
        response = await this.handleStopCommand(session);
        break;
      
      default:
        // New users go to onboarding, existing users get contextual help
        if (session.isNewUser) {
          session.currentFlow = 'onboarding';
          session.flowStep = 0;
          response = await this.onboardingFlow.handleMessage(message.body, session);
        } else {
          response = await this.handleIdleMessage(message.body, session);
        }
    }

    return response;
  }

  private detectCommand(text: string, language: string): string | null {
    const lowerText = text.toLowerCase().trim();
    
    for (const [command, patterns] of Object.entries(this.commandPatterns)) {
      if (patterns.some(pattern => lowerText.includes(pattern.toLowerCase()))) {
        return command;
      }
    }
    
    return null;
  }

  private async showMainMenu(session: UserSession): Promise<FlowResponse> {
    const menuText = this.getLocalizedText('main_menu', session.language);
    
    return {
      message: menuText,
      buttons: [
        { id: 'assessment', title: this.getLocalizedText('menu_assessment', session.language) },
        { id: 'checkin', title: this.getLocalizedText('menu_mood_checkin', session.language) },
        { id: 'resources', title: this.getLocalizedText('menu_resources', session.language) },
        { id: 'peer', title: this.getLocalizedText('menu_peer_support', session.language) },
        { id: 'buddy', title: this.getLocalizedText('menu_buddy_system', session.language) },
        { id: 'help', title: this.getLocalizedText('menu_help', session.language) }
      ],
      nextFlow: 'idle',
      nextStep: 0
    };
  }

  private async handleIdleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    // Analyze sentiment and provide contextual response
    const sentiment = await this.sentimentAnalyzer.analyzeText(text);
    
    let responseKey = 'idle_neutral';
    if (sentiment.score < -0.3) {
      responseKey = 'idle_negative';
    } else if (sentiment.score > 0.3) {
      responseKey = 'idle_positive';
    }

    return {
      message: this.getLocalizedText(responseKey, session.language),
      quickReplies: [
        this.getLocalizedText('quick_mood_check', session.language),
        this.getLocalizedText('quick_resources', session.language),
        this.getLocalizedText('quick_help', session.language)
      ],
      nextFlow: 'idle',
      nextStep: 0
    };
  }

  private async handleStopCommand(session: UserSession): Promise<FlowResponse> {
    // Mark session as ended
    session.currentFlow = 'stopped';
    session.flowStep = 0;
    session.context = {};

    return {
      message: this.getLocalizedText('goodbye_message', session.language),
      shouldEndFlow: true
    };
  }

  private async sendResponse(phoneNumber: string, response: FlowResponse, session: UserSession): Promise<void> {
    if (response.quickReplies && response.quickReplies.length > 0) {
      await this.whatsapp.sendQuickReplies(phoneNumber, response.message, response.quickReplies);
    } else if (response.buttons && response.buttons.length > 0) {
      await this.whatsapp.sendInteractiveButtons(phoneNumber, response.message, response.buttons);
    } else {
      await this.whatsapp.sendMessage(phoneNumber, response.message);
    }
  }

  private updateSessionFromResponse(session: UserSession, response: FlowResponse): void {
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
      session.currentFlow = 'idle';
      session.flowStep = 0;
      session.context = {};
    }
    session.lastActivity = new Date();
  }

  private async handleError(phoneNumber: string, language: string): Promise<void> {
    const errorMessage = this.getLocalizedText('error_message', language);
    await this.whatsapp.sendMessage(phoneNumber, errorMessage);
  }

  // Enhanced wellness check system with proactive outreach
  async performWellnessChecks(): Promise<void> {
    console.log('Starting proactive wellness checks...');
    
    // Find users who haven't checked in recently
    const inactiveUsers = await this.findInactiveUsers();
    
    for (const user of inactiveUsers) {
      await this.sendWellnessNudge(user);
    }
    
    // Check for users showing concerning patterns
    await this.monitorConcerningPatterns();
  }

  private async findInactiveUsers(): Promise<any[]> {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    
    return await prisma.anonymousUser.findMany({
      where: {
        interactions: {
          none: {
            timestamp: {
              gte: threeDaysAgo
            }
          }
        }
      },
      include: {
        interactions: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      take: 50 // Limit batch size
    });
  }

  private async sendWellnessNudge(user: any): Promise<void> {
    const phoneNumber = await this.phoneMapping.getPhoneNumber(user.id);
    if (!phoneNumber) return;

    // Determine nudge type based on user history
    const recentInteractions = await prisma.userInteraction.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    let message: string;
    const lastInteraction = recentInteractions[0];

    if (lastInteraction?.interactionType === 'DAILY_CHECKIN') {
      message = this.getLocalizedText('nudge_daily_checkin', user.language);
    } else if (lastInteraction?.interactionType === 'BUDDY_CHECKIN') {
      message = this.getLocalizedText('nudge_buddy_checkin', user.language);
    } else if (lastInteraction?.interactionType === 'ASSESSMENT_COMPLETED') {
      message = this.getLocalizedText('nudge_assessment_reminder', user.language);
    } else {
      message = this.getLocalizedText('nudge_general', user.language);
    }

    await this.whatsapp.sendMessage(phoneNumber, message);
  }

  private async monitorConcerningPatterns(): Promise<void> {
    // Monitor for concerning mood patterns - simplified query
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const concerningMoodLogs = await prisma.moodLog.findMany({
      where: {
        loggedAt: {
          gte: sevenDaysAgo
        },
        moodScore: {
          lte: 4 // Low mood scores (1-10 scale)
        }
      },
      select: {
        userId: true
      }
    });

    // Group by userId and count occurrences
    const userCounts = concerningMoodLogs.reduce((acc, log) => {
      acc[log.userId] = (acc[log.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find users with 3 or more concerning entries
    const concerningUsers = Object.entries(userCounts)
      .filter(([userId, count]) => count >= 3)
      .map(([userId]) => userId);

    for (const userId of concerningUsers) {
      await this.escalateConcern(userId);
    }
  }

  private async escalateConcern(userId: string): Promise<void> {
    // Create service referral for concerning patterns
    const existingReferral = await prisma.serviceReferral.findFirst({
      where: {
        userId,
        status: 'pending',
        referredAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    if (!existingReferral) {
      await prisma.serviceReferral.create({
        data: {
          userId,
          resourceId: '00000000-0000-0000-0000-000000000001', // Default mental health resource
          referralType: 'counseling',
          urgencyLevel: 'medium',
          status: 'pending',
          notes: 'Proactive referral based on concerning mood patterns',
          language: 'en' // Would get from user profile
        }
      });
    }
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      main_menu: {
        en: "🌟 **SATA Mental Wellness Assistant**\n\nHow can I support your mental wellness today?\n\nSelect an option or type your request:",
        zh: "🌟 **SATA心理健康助手**\n\n我今天如何支持您的心理健康？\n\n选择一个选项或输入您的请求：",
        bn: "🌟 **SATA মানসিক সুস্থতার সহায়ক**\n\nআজ আমি কিভাবে আপনার মানসিক সুস্থতা সহায়তা করতে পারি?\n\nএকটি বিকল্প নির্বাচন করুন বা আপনার অনুরোধ টাইপ করুন:",
        ta: "🌟 **SATA மன நல உதவியாளர்**\n\nஇன்று உங்கள் மன நலத்தை எப்படி ஆதரிக்க முடியும்?\n\nஒரு விருப்பத்தை தேர்ந்தெடுக்கவும் அல்லது உங்கள் கோரிக்கையை தட்டச்சு செய்யவும்:",
        my: "🌟 **SATA စိတ်ကျန်းမာရေး အကူအညီ**\n\nယနေ့ သင့်စိတ်ကျန်းမာရေးကို ဘယ်လို ပံ့ပိုးနိုင်မလဲ?\n\nရွေးချယ်စရာတစ်ခု ရွေးပါ သို့မဟုတ် သင့်တောင်းဆိုချက်ကို ရိုက်ပါ:",
        id: "🌟 **Asisten Kesehatan Mental SATA**\n\nBagaimana saya bisa mendukung kesehatan mental Anda hari ini?\n\nPilih opsi atau ketik permintaan Anda:"
      },
      menu_assessment: {
        en: "📋 Mental Health Assessment",
        zh: "📋 心理健康评估",
        bn: "📋 মানসিক স্বাস্থ্য মূল্যায়ন",
        ta: "📋 மன நல மதிப்பீடு",
        my: "📋 စိတ်ကျန်းမာရေး အကဲဖြတ်မှု",
        id: "📋 Penilaian Kesehatan Mental"
      },
      menu_mood_checkin: {
        en: "😊 Daily Check-in",
        zh: "😊 每日签到",
        bn: "😊 দৈনিক চেক-ইন",
        ta: "😊 தினசரி சோதনை",
        my: "😊 နေ့စဉ် စစ်ဆေးခြင်း",
        id: "😊 Check-in Harian"
      },
      menu_resources: {
        en: "📚 Mental Health Resources",
        zh: "📚 心理健康资源",
        bn: "📚 মানসিক স্বাস্থ্য সম্পদ",
        ta: "📚 மன நல வளங்கள்",
        my: "📚 စိတ်ကျန်းမာရေး အရင်းအမြစ်များ",
        id: "📚 Sumber Kesehatan Mental"
      },
      menu_peer_support: {
        en: "👥 Peer Support Groups",
        zh: "👥 同伴支持小组",
        bn: "👥 সহকর্মী সহায়তা গ্রুপ",
        ta: "👥 சக ஆதரவு குழुக્കள்",
        my: "👥 လুပ်ဖော်ကိုင်ဖက် အকူအညီ အুপ়সুများ",
        id: "👥 Grup Dukungan Sebaya"
      },
      menu_buddy_system: {
        en: "🤝 Buddy System",
        zh: "🤝 伙伴系统",
        bn: "🤝 বন্ধু সিস্টেম",
        ta: "🤝 நண்পর் আমাইপ্পু",
        my: "🤝 မိတ်သွေ စনিသ်",
        id: "🤝 Sistem Teman"
      },
      menu_help: {
        en: "ℹ️ Help & Support",
        zh: "ℹ️ 帮助和支持",
        bn: "ℹ️ সাহায্য এবং সহায়তা",
        ta: "ℹ️ উধবী মাত্ত্রুম् আধরবু",
        my: "ℹ️ အকুআনীহनিত် থোক်পণ্ত়মহু",
        id: "ℹ️ Bantuan & Dukungan"
      },
      error_message: {
        en: "😅 I'm having trouble understanding that. Could you try rephrasing or type 'help' for options?",
        zh: "😅 我很难理解这一点。您能尝试重新表述或输入\"帮助\"来查看选项吗？",
        bn: "😅 আমি বুঝতে সমস্যা হচ্ছে। আপনি কি আবার বলার চেষ্টা করতে পারেন বা বিকল্পের জন্য 'সাহায্য' টাইপ করতে পারেন?",
        ta: "😅 அதைப் புরিন্ধুকোণ্ভাতিল় সিক্কাল் উল्লাদু। মীণ্ডুম् সোल্ল মুয়ার্সিক্কাবুম্ আল্লাতু বিরুপ্পাঙ্গালুক্কু 'উধবী' এন তাত্তাচু সেয়যাবুম্?",
        my: "😅 নাজমলায়পা। থাপ়প্রোক্রিত়পা সিওমাহোতে রুচেছায়সরাআত্বোক্ 'আকুআনী' হুরোইক়পা?",
        id: "😅 Saya kesulitan memahami itu. Bisakah Anda mencoba mengungkapkannya kembali atau ketik 'bantuan' untuk opsi?"
      },
      goodbye_message: {
        en: "🙏 Thank you for using SATA Mental Wellness Assistant. Take care and remember - you're not alone. Type 'hello' anytime to start again.",
        zh: "🙏 感谢您使用SATA心理健康助手。保重身体，记住——您并不孤单。随时输入\"你好\"重新开始。",
        bn: "🙏 SATA মানসিক সুস্থতা সহায়ক ব্যবহার করার জন্য ধন্যবাদ। যত্ন নিন এবং মনে রাখবেন - আপনি একা নন। আবার শুরু করতে যে কোনো সময় 'হ্যালো' টাইপ করুন।",
        ta: "🙏 SATA মন নল উধবিয়ালারাই পায়ানপাত্তিয়াদার্কু নান্রি। কবানিত্তুক্কোল্লুঙ্গাল় মাত্ত্রুম् নিনাইবিল় বাইত্তুক্কোল্লুঙ্গাল় - নীঙ্গাল় তানিয়াগা ইল্লাই। মীণ্ডুম් তোদাঙ্গ এন্দ নেরাত্তিলুম 'বাণক্কাম্' এন তাত্তাচু সেয়যুঙ্গাল়।",
        my: "🙏 SATA সিত়ক্য়ানমারে আকুআনীকো আসুম্প্রুপেতত্ আত্বোক্ ক্যেজুতিনপাতয়। গরুসোইক্প্রী মাত্থারপা - সিনতাস্য়োক্তায়মাহোত্পা। থাপ়স্ফো আচিনমারু 'মিন্গালাপা' লোরোইক়পা।",
        id: "🙏 Terima kasih telah menggunakan Asisten Kesehatan Mental SATA. Jaga diri dan ingat - Anda tidak sendirian. Ketik 'halo' kapan saja untuk memulai lagi."
      },
      quick_mood_check: {
        en: "😊 Quick Mood Check",
        zh: "😊 快速心情检查",
        bn: "😊 দ্রুত মেজাজ পরীক্ষা",
        ta: "😊 வേগমান മনোনিলাই সোদানাই",
        my: "😊 မြিন္বুন সিত়ছানসামহু সিস্য়েজেছিন",
        id: "😊 Cek Suasana Hati Cepat"
      },
      quick_resources: {
        en: "📚 Quick Resources",
        zh: "📚 快速资源",
        bn: "📚 দ্রুত সম্পদ",
        ta: "📚 வেগমান বালাঙ্গাল়",
        my: "📚 মরিনবুন আরিনআমরাস়গমা",
        id: "📚 Sumber Cepat"
      },
      quick_help: {
        en: "ℹ️ Quick Help",
        zh: "ℹ️ 快速帮助",
        bn: "ℹ️ দ্রুত সাহায্য",
        ta: "ℹ️ বেগমান উধবী",
        my: "ℹ️ মরিনবুন আকুআনি",
        id: "ℹ️ Bantuan Cepat"
      },
      idle_neutral: {
        en: "I understand. How would you like me to help you today?",
        zh: "我明白了。您希望我今天如何帮助您？",
        bn: "আমি বুঝতে পারছি। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
        ta: "এনাক্কু পুরিগিরাদু। ইন্দ্র এப্পাদি উঙ্গালাইক কাবানিক্ক বেন্দুম্?",
        my: "নালায়তে। দিনেত় সিন্কো বেলো গবানিক্কনেয়ামলে?",
        id: "Saya mengerti. Bagaimana Anda ingin saya membantu Anda hari ini?"
      },
      idle_positive: {
        en: "That sounds great! I'm glad to hear positive things from you. How can I support your continued wellness?",
        zh: "听起来很棒！我很高兴听到您积极的话语。我如何支持您持续的健康？",
        bn: "এটা দুর্দান্ত শোনাচ্ছে! আপনার কাছ থেকে ইতিবাচক কথা শুনে আমি খুশি। আমি কীভাবে আপনার অব্যাহত সুস্থতা সমর্থন করতে পারি?",
        ta: "আদু সিরান্দাগা ইরুক্কিরাদু! উঙ্গালিদাম্ নাল্ল বিষয়াঙ্গালাই কেত্কিরাদুক্কু এনাক্কু সানদোশাম্। উঙ্গাল় তোদারু নাল্বালিত্তানাই এপ্পাদি তুনাই সেয়য়ালাম্?",
        my: "আদু লোগানরে। সিনত্তায়ক নাল্লাবিষায়াগমা ক্যাত়ছিনক্কো খোসিপা। সিন্রে তোদারকিয়ানমারেকো বেলো থোক়পানোয়ামলে?",
        id: "Itu terdengar bagus! Saya senang mendengar hal-hal positif dari Anda. Bagaimana saya bisa mendukung kesehatan Anda yang berkelanjutan?"
      },
      idle_negative: {
        en: "I hear that things might be challenging right now. You don't have to go through this alone. Would you like to talk about it or explore some support options?",
        zh: "我听出现在情况可能比较困难。您不必独自承受这些。您想谈论一下或探索一些支持选项吗？",
        bn: "আমি বুঝতে পারছি যে এখন পরিস্থিতি কঠিন হতে পারে। আপনাকে একা এটি সহ্য করতে হবে না। আপনি কি এটি নিয়ে কথা বলতে বা কিছু সহায়তার বিকল্প অন্বেষণ করতে চান?",
        ta: "ইপ্পো বিষয়াঙ্গাল় কাশ্তামাগা ইরুক্কুম্ এন্দ্র তেরিগিরাদু। ইদানাই তানিয়াগা নীঙ্গাল় সামালিক্ক বেন্দিয়াদু ইল্লাই। ইদাই পাত্তি পেসুবাদা আল্লাতু সিলা তুনাই বিকল্পাঙ্গালাই পার্ক্কুবাদা?",
        my: "আখু বিষায়ামা কাশত়নেত়ছিনমলো। এদানাই তানিয়াগা নীঙ্গাল় সায়মালিক্কবেন্দিয়াদিল্লাই। এদাপাত়ত়ি পেসুবাদা আল্লাতু সিলা তুনাইবিকল্পাঙ্গালাই পার্ক্কুবাদা?",
        id: "Saya mendengar bahwa hal-hal mungkin menantang saat ini. Anda tidak harus melalui ini sendirian. Apakah Anda ingin membicarakannya atau menjelajahi beberapa opsi dukungan?"
      },
      nudge_daily_checkin: {
        en: "🌅 Good morning! How are you feeling today? Your daily check-in helps track your wellness journey.",
        zh: "🌅 早上好！您今天感觉如何？您的每日签到有助于跟踪您的健康之旅。",
        bn: "🌅 সুপ্রভাত! আজ আপনার কেমন লাগছে? আপনার দৈনিক চেক-ইন আপনার সুস্থতার যাত্রা ট্র্যাক করতে সাহায্য করে।",
        ta: "🌅 কালাই বান্নাক্কাম্! ইন্দ্র এপ্পাদি ইরুক্কীঙ্গাল়? উঙ্গাল় নাল্বালিপ্পু পাণামাই তিনানাই সোতানাই উধবুগিরাদু।",
        my: "🌅 মিন্গালাবা! দিনেত় বেলো ছানসারাথাল়ে? সিন্রে নেরে সিস্য়েজেছিনকা সিন্রে ক্যানমারেক্রীকো থোতিনফো উধবুথে।",
        id: "🌅 Selamat pagi! Bagaimana perasaan Anda hari ini? Check-in harian Anda membantu melacak perjalanan kesehatan Anda."
      },
      nudge_buddy_checkin: {
        en: "🤝 Your wellness buddy might appreciate hearing from you today. Consider sending them a supportive message!",
        zh: "🤝 您的健康伙伴今天可能会很高兴收到您的消息。考虑给他们发一条支持性的消息！",
        bn: "🤝 আপনার সুস্থতার বন্ধু আজ আপনার কাছ থেকে শুনে খুশি হতে পারে। তাদের একটি সহায়ক বার্তা পাঠানোর কথা বিবেচনা করুন!",
        ta: "🤝 উঙ্গাল় নাল্বালিপ্পু নান্বার় ইন্দ্র উঙ্গালিদাম্ কেত্পাদানাই বিরুম্বালাম্। আবার্গালুক্কু ওরু তুনাই সেন্দেশাম্ আনুপ্পুবাদানাই য়োসিত্তু পার্ক্কুঙ্গাল়!",
        my: "🤝 সিন্রে ক্যানমারেমিত়সুএা ইন্দু সিনত্তায়ক থায়ার়চিনক্কো খোসিয়ামলে। আথুগামা ওরু থোক়পানমেসেজ পাঠানফো য়োসিনাপার্!",
        id: "🤝 Teman kesehatan Anda mungkin senang mendengar dari Anda hari ini. Pertimbangkan untuk mengirimkan mereka pesan yang mendukung!"
      },
      nudge_assessment_reminder: {
        en: "📋 It's been a while since your last mental health check. Would you like to do a quick assessment to see how you're doing?",
        zh: "📋 距离您上次心理健康检查已经有一段时间了。您想做个快速评估来看看您的状况吗？",
        bn: "📋 আপনার শেষ মানসিক স্বাস্থ্য পরীক্ষার পর থেকে বেশ কিছুদিন হয়ে গেছে। আপনি কেমন আছেন দেখতে একটি দ্রুত মূল্যায়ন করতে চান?",
        ta: "📋 উঙ্গাল় কাদাসি মান নালা পারিক্শাইয়িন পিরাগু কনাক্কাম আগিবিত্তাদু। নীঙ্গাল় এপ্পাদি ইরুক্কীঙ্গাল় এন্দ্র থেরিন্থু কোল্ল ওরু বেগমান মুল্লিপ্পীদানাই সেয়য বিরুম্বুগিরীঙ্গালা?",
        my: "📋 সিন্রে নাখংসিত়ক্যানমারেপারিক্শার পিরাগু কনাক্কাম আগিপিত়াদু। নীঙ্গাল় এপ্পাদি ইরুক্কীঙ্গাল় এন্দ্র থেরিন্থু কোল্ল ওরু মরিনবুন্পারিক্শানাই সেয়য বিরুম্বুথালে?",
        id: "📋 Sudah cukup lama sejak pemeriksaan kesehatan mental terakhir Anda. Apakah Anda ingin melakukan penilaian cepat untuk melihat bagaimana keadaan Anda?"
      },
      nudge_general: {
        en: "👋 Hello! I hope you're doing well. I'm here whenever you need support with your mental wellness journey.",
        zh: "👋 你好！我希望您一切都好。无论何时您需要心理健康方面的支持，我都在这里。",
        bn: "👋 হ্যালো! আমি আশা করি আপনি ভাল আছেন। আপনার মানসিক সুস্থতার যাত্রায় যখনই আপনার সহায়তার প্রয়োজন হবে আমি এখানে আছি।",
        ta: "👋 বান্নাক্কাম্! নীঙ্গাল় নান্দ্রাগা ইরুক্কীঙ্গাল় এন্দ্র নাম্বুগিরেন। উঙ্গাল় মান নাল পাণাত্তিল় এপ্পোঝুম তুনাই বেন্দুমানাল নান ইঙ্গে ইরুক্কিরেন।",
        my: "👋 মিন্গালাবা! নীঙ্গাল় নান্দ্রাগা ইরুক্কীঙ্গাল় এন্দ্র থায়ারতে। সিন্রে সিত়ক্যানমারেপাণাত়িল় এথায়ন তুনাইবেন্দুমানাল নান ইঙ্গে ইরুক্কিরেন।",
        id: "👋 Halo! Saya harap Anda baik-baik saja. Saya di sini kapan pun Anda membutuhkan dukungan dalam perjalanan kesehatan mental Anda."
      }
    };

    const textSet = texts[key];
    if (!textSet) return key;
    
    return textSet[language] || textSet.en || key;
  }
}
