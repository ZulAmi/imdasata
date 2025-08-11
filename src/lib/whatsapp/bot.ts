import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '../whatsapp/service';
import { ConversationFlow } from '../whatsapp/conversation';
import { LanguageDetector } from '../whatsapp/language-detector';
import { SentimentAnalyzer } from '../whatsapp/sentiment-analyzer';

interface BotMessage {
  from: string;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: Date;
}

interface UserState {
  userId: string;
  language: string;
  currentFlow: string;
  step: number;
  context: Record<string, any>;
  lastActivity: Date;
}

export class WhatsAppBot {
  private whatsapp: WhatsAppService;
  private conversation: ConversationFlow;
  private languageDetector: LanguageDetector;
  private sentimentAnalyzer: SentimentAnalyzer;
  private userStates: Map<string, UserState> = new Map();

  constructor() {
    this.whatsapp = new WhatsAppService();
    this.conversation = new ConversationFlow();
    this.languageDetector = new LanguageDetector();
    this.sentimentAnalyzer = new SentimentAnalyzer();
  }

  async handleIncomingMessage(message: BotMessage): Promise<void> {
    try {
      // Get or create user
      const user = await this.getOrCreateUser(message.from);
      
      // Get current user state
      let userState = this.getUserState(message.from);
      if (!userState) {
        userState = await this.initializeUserState(user.id, message.from);
      }

      // Detect language if not set
      if (!userState.language || userState.language === 'auto') {
        userState.language = await this.languageDetector.detect(message.body);
        this.updateUserState(message.from, userState);
      }

      // Handle media messages
      if (message.mediaUrl && message.mediaType === 'audio') {
        await this.handleVoiceMessage(message, userState);
        return;
      }

      // Process text message
      await this.processTextMessage(message, userState);

      // Log interaction
      await this.logInteraction(user.id, message);

    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      await this.sendErrorMessage(message.from);
    }
  }

  private async getOrCreateUser(phoneNumber: string) {
    // Create a hash of the phone number for PDPA compliance
    const phoneHash = this.hashPhone(phoneNumber);
    
    let user = await prisma.anonymousUser.findFirst({
      where: { 
        // Use device fingerprint or other identifier since phoneHash doesn't exist in schema
        deviceFingerprint: phoneHash 
      }
    });

    if (!user) {
      user = await prisma.anonymousUser.create({
        data: {
          anonymousId: `wa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          language: 'auto',
          deviceFingerprint: phoneHash,
          isActive: true
        }
      });
    }

    return user;
  }

  private async initializeUserState(userId: string, phoneNumber: string): Promise<UserState> {
    const state: UserState = {
      userId,
      language: 'auto',
      currentFlow: 'welcome',
      step: 0,
      context: {},
      lastActivity: new Date()
    };

    this.userStates.set(phoneNumber, state);
    return state;
  }

  private getUserState(phoneNumber: string): UserState | undefined {
    return this.userStates.get(phoneNumber);
  }

  private updateUserState(phoneNumber: string, state: UserState): void {
    state.lastActivity = new Date();
    this.userStates.set(phoneNumber, state);
  }

  private async processTextMessage(message: BotMessage, userState: UserState): Promise<void> {
    // Check for crisis keywords first
    if (await this.detectCrisisMessage(message.body, userState.language)) {
      await this.handleCrisisIntervention(message.from, userState);
      return;
    }

    // Process through conversation flow
    const response = await this.conversation.processMessage(
      message.body,
      userState
    );

    // Send response
    await this.sendResponse(message.from, response, userState.language);

    // Update user state
    this.updateUserState(message.from, response.newState);
  }

  private async handleVoiceMessage(message: BotMessage, userState: UserState): Promise<void> {
    try {
      // Analyze sentiment from voice note
      const sentiment = await this.sentimentAnalyzer.analyzeVoice(message.mediaUrl!);
      
      // Log mood based on sentiment using correct field names
      await prisma.moodLog.create({
        data: {
          userId: userState.userId,
          moodScore: this.sentimentToMoodLevel(sentiment.score),
          notes: 'Voice message sentiment analysis',
          sentimentScore: sentiment.score,
          sentimentLabel: sentiment.label
        }
      });

      // Respond appropriately to sentiment
      const response = await this.conversation.handleSentimentResponse(
        sentiment,
        userState
      );

      await this.sendResponse(message.from, response, userState.language);

    } catch (error) {
      console.error('Error processing voice message:', error);
      await this.sendMessage(
        message.from,
        this.getLocalizedText('voice_processing_error', userState.language)
      );
    }
  }

  private async detectCrisisMessage(text: string, language: string): Promise<boolean> {
    const crisisKeywords = {
      en: ['suicide', 'kill myself', 'end it all', 'worthless', 'hopeless'],
      zh: ['自杀', '死', '结束生命', '没有希望'],
      bn: ['আত্মহত্যা', 'মৃত্যু', 'জীবন শেষ'],
      ta: ['தற்கொலை', 'இறப்பு', 'வாழ்க்கை முடிவு'],
      my: ['သေ', 'အသက်ဆုံး', 'မျှော်လင့်ချက်မရှိ'],
      id: ['bunuh diri', 'mati', 'mengakhiri hidup']
    };

    const keywords = crisisKeywords[language as keyof typeof crisisKeywords] || crisisKeywords.en;
    const lowerText = text.toLowerCase();
    
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  private async handleCrisisIntervention(phoneNumber: string, userState: UserState): Promise<void> {
    // Send immediate crisis response
    const crisisMessage = this.getLocalizedText('crisis_intervention', userState.language);
    await this.sendMessage(phoneNumber, crisisMessage);

    // Get a crisis resource first to have a valid resourceId
    const crisisResource = await prisma.mentalHealthResource.findFirst({
      where: {
        category: 'crisis',
        isActive: true
      }
    });

    // Only create service referral if we have a valid crisis resource
    if (crisisResource) {
      await prisma.serviceReferral.create({
        data: {
          userId: userState.userId,
          resourceId: crisisResource.id,
          referralType: 'emergency',
          urgencyLevel: 'high',
          language: userState.language
        }
      });
    } else {
      // Log warning if no crisis resources are available
      console.warn(`No crisis resources available for user ${userState.userId}`);
      
      // Create a generic crisis resource entry using correct schema fields
      const genericCrisisResource = await prisma.mentalHealthResource.create({
        data: {
          title: {
            en: 'Emergency Crisis Support',
            zh: '紧急危机支持',
            bn: 'জরুরী সংকট সহায়তা',
            ta: 'அவசர நெருக்கடி ஆதரவு',
            my: 'အရေးပေါ် အကြပ်အတည်း အကူအညီ',
            id: 'Dukungan Krisis Darurat'
          },
          description: {
            en: 'If you are in immediate danger, please contact emergency services (911/999) or go to your nearest emergency room.',
            zh: '如果您处于紧急危险中，请联系紧急服务(911/999)或前往最近的急诊室。',
            bn: 'আপনি যদি তাৎক্ষণিক বিপদে থাকেন, অনুগ্রহ করে জরুরি সেবায় (911/999) যোগাযোগ করুন বা আপনার নিকটতম জরুরি কক্ষে যান।',
            ta: 'நீங்கள் உடனடி ஆபத்தில் இருந்தால், தயவுசெய்து அவசர சேவைகளை (911/999) தொடர்பு கொள்ளுங்கள் அல்லது உங்கள் அருகிலுள்ள அவசர அறைக்குச் செல்லுங்கள்।',
            my: 'သင်သည် ချက်ခြင်းအန္တရာယ်ကြုံနေလျှင် အရေးပေါ်ဝန်ဆောင်မှုများ (911/999) ကို ဆက်သွယ်ပါ သို့မဟုတ် အနီးဆုံးအရေးပေါ်ခန်းသို့သွားပါ။',
            id: 'Jika Anda dalam bahaya langsung, silakan hubungi layanan darurat (911/999) atau pergi ke ruang gawat darurat terdekat.'
          },
          category: 'crisis',
          resourceType: 'hotline',
          contactInfo: {
            phone: '911',
            description: 'Emergency Services'
          },
          availability: {
            hours: '24/7',
            languages: ['en', 'zh', 'bn', 'ta', 'my', 'id']
          },
          targetAudience: ['general', 'migrant_workers'],
          languages: ['en', 'zh', 'bn', 'ta', 'my', 'id'],
          isFree: true,
          isEmergency: true,
          isActive: true,
          priority: 1
        }
      });

      // Now create the service referral with the new resource
      await prisma.serviceReferral.create({
        data: {
          userId: userState.userId,
          resourceId: genericCrisisResource.id,
          referralType: 'emergency',
          urgencyLevel: 'high',
          language: userState.language
        }
      });
    }

    // Send crisis resources
    const resources = await prisma.mentalHealthResource.findMany({
      where: {
        category: 'crisis',
        isActive: true
      },
      orderBy: {
        priority: 'asc'
      },
      take: 5 // Limit to top 5 most important crisis resources
    });

    if (resources.length > 0) {
      for (const resource of resources) {
        const resourceText = this.getResourceText(resource, userState.language);
        await this.sendMessage(phoneNumber, resourceText);
        
        // Add small delay between messages to avoid overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } else {
      // Fallback message if no resources are found
      const fallbackMessage = this.getLocalizedText('crisis_fallback_resources', userState.language);
      await this.sendMessage(phoneNumber, fallbackMessage);
    }
  }

  async sendProactiveNudge(userId: string, phoneNumber: string, nudgeType: string): Promise<void> {
    try {
      const user = await prisma.anonymousUser.findUnique({
        where: { id: userId }
      });

      if (!user || !user.isActive) return;

      const userState = this.getUserState(phoneNumber) || await this.initializeUserState(userId, phoneNumber);
      
      let message = '';
      
      switch (nudgeType) {
        case 'daily_checkin':
          message = this.getLocalizedText('daily_checkin_nudge', userState.language);
          break;
        case 'mood_log':
          message = this.getLocalizedText('mood_log_reminder', userState.language);
          break;
        case 'assessment_reminder':
          message = this.getLocalizedText('assessment_reminder', userState.language);
          break;
        case 'wellness_tip':
          const tip = await this.getRandomWellnessTip(userState.language);
          message = tip;
          break;
      }

      await this.sendMessage(phoneNumber, message);

      // Log the nudge using correct field names
      await prisma.userInteraction.create({
        data: {
          userId,
          interactionType: 'PROACTIVE_NUDGE',
          entityType: 'nudge',
          entityId: nudgeType,
          metadata: { nudgeType }
        }
      });

    } catch (error) {
      console.error('Error sending proactive nudge:', error);
    }
  }

  private async sendResponse(phoneNumber: string, response: any, language: string): Promise<void> {
    if (response.quickReplies && response.quickReplies.length > 0) {
      await this.sendQuickReplies(phoneNumber, response.message, response.quickReplies);
    } else if (response.buttons && response.buttons.length > 0) {
      await this.sendInteractiveButtons(phoneNumber, response.message, response.buttons);
    } else {
      await this.sendMessage(phoneNumber, response.message);
    }
  }

  private async sendMessage(to: string, message: string): Promise<void> {
    await this.whatsapp.sendMessage(to, message);
  }

  private async sendQuickReplies(to: string, message: string, replies: string[]): Promise<void> {
    await this.whatsapp.sendQuickReplies(to, message, replies);
  }

  private async sendInteractiveButtons(to: string, message: string, buttons: any[]): Promise<void> {
    await this.whatsapp.sendInteractiveButtons(to, message, buttons);
  }

  private async sendErrorMessage(phoneNumber: string): Promise<void> {
    const userState = this.getUserState(phoneNumber);
    const language = userState?.language || 'en';
    const errorMessage = this.getLocalizedText('error_message', language);
    await this.sendMessage(phoneNumber, errorMessage);
  }

  private async logInteraction(userId: string, message: BotMessage): Promise<void> {
    await prisma.userInteraction.create({
      data: {
        userId,
        interactionType: 'WHATSAPP_MESSAGE',
        entityType: 'message',
        entityId: message.from,
        metadata: {
          mediaType: message.mediaType,
          mediaUrl: message.mediaUrl,
          timestamp: message.timestamp
        }
      }
    });
  }

  private hashPhone(phoneNumber: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phoneNumber + process.env.PHONE_SALT).digest('hex');
  }

  private sentimentToMoodLevel(sentimentScore: number): number {
    // Convert sentiment score (-1 to 1) to mood level (1 to 10)
    return Math.round(((sentimentScore + 1) / 2) * 9 + 1);
  }

  private getLocalizedText(key: string, language: string): string {
    const texts = {
      crisis_intervention: {
        en: "🚨 I'm concerned about you. Please reach out to a crisis helpline immediately. You're not alone, and help is available 24/7.",
        zh: "🚨 我很担心你。请立即联系危机求助热线。你并不孤单，24/7都有帮助可用。",
        bn: "🚨 আমি আপনার জন্য চিন্তিত। অনুগ্রহ করে অবিলম্বে একটি সংকট হেল্পলাইনে যোগাযোগ করুন।",
        ta: "🚨 நான் உங்களைப் பற்றி கவலைப்படுகிறேன். உடனடியாக நெருக்கடி உதவி எண்ணை தொடர்பு கொள்ளுங்கள்।",
        my: "🚨 ကျွန်တော် သင့်အတွက် စိုးရိမ်နေပါသည်။ ချက်ချင်း အရေးပေါ် ကူညီရေး ဖုန်းနံပါတ်ကို ဆက်သွယ်ပါ။",
        id: "🚨 Saya khawatir tentang Anda. Silakan hubungi hotline krisis segera. Anda tidak sendirian."
      },
      crisis_fallback_resources: {
        en: "🆘 Emergency Contacts:\n• Emergency Services: 911\n• Crisis Text Line: Text HOME to 741741\n• National Suicide Prevention Lifeline: 988\n\nYou are not alone. Help is available.",
        zh: "🆘 紧急联系方式:\n• 紧急服务: 911\n• 危机短信热线: 发送HOME到741741\n• 全国自杀预防生命线: 988\n\n你并不孤单。帮助随时可用。",
        bn: "🆘 জরুরি যোগাযোগ:\n• জরুরি সেবা: ৯৯৯\n• সংকট টেক্সট লাইন: HOME লিখে 741741 এ পাঠান\n\nআপনি একা নন। সাহায্য উপলব্ধ।",
        ta: "🆘 அவசர தொடர்புகள்:\n• அவசர சேவைகள்: 108\n• நெருக்கடி உரை வரி: HOME என்று 741741 க்கு அனுப்பவும்\n\nநீங்கள் தனியாக இல்லை। உதவி கிடைக்கிறது।",
        my: "🆘 အရေးပေါ်ဆက်သွယ်ရန်:\n• အရေးပေါ်ဝန်ဆောင်မှုများ: 911\n• အကြပ်အတည်းစာသားလိုင်း: HOME ကို 741741 သို့ပို့ပါ\n\nသင်မှာတစ်ယောက်တည်းမဟုတ်ပါ။ အကူအညီရရှိနိုင်ပါသည်။",
        id: "🆘 Kontak Darurat:\n• Layanan Darurat: 112\n• Hotline Krisis: 119 ext 8\n• Sejiwa: 119 ext 8\n\nAnda tidak sendirian. Bantuan tersedia."
      },
      daily_checkin_nudge: {
        en: "🌟 How are you feeling today? Take a moment to check in with yourself.",
        zh: "🌟 你今天感觉怎么样？花一点时间关注一下自己。",
        bn: "🌟 আজ আপনার মনের অবস্থা কেমন? নিজের সাথে একটু সময় কাটান।",
        ta: "🌟 இன்று நீங்கள் எப்படி உணர்கிறீர்கள்? உங்களுடன் சிறிது நேரம் செலவிடுங்கள்।",
        my: "🌟 ယနေ့ သင် ဘယ်လို ခံစားနေပါသလဲ။ သင့်ကိုယ်သင် ဂရုစိုက်ကြည့်ပါ။",
        id: "🌟 Bagaimana perasaan Anda hari ini? Luangkan waktu sejenak untuk memeriksa diri sendiri."
      },
      mood_log_reminder: {
        en: "📝 Don't forget to log your mood today! It helps track your emotional wellbeing.",
        zh: "📝 别忘了今天记录你的心情！这有助于跟踪你的情绪健康。",
        bn: "📝 আজ আপনার মেজাজ লগ করতে ভুলবেন না! এটি আপনার আবেগময় সুস্থতা ট্র্যাক করতে সাহায্য করে।",
        ta: "📝 இன்று உங்கள் மனநிலையைப் பதிவு செய்ய மறக்காதீர்கள்! இது உங்கள் உணர்ச்சி நல்வாழ்வைக் கண்காணிக்க உதவுகிறது।",
        my: "📝 ဒီနေ့ သင့်စိတ်ခံစားမှုကို မှတ်တမ်းတင်ဖို့ မမေ့နဲ့! ဒါက သင့်စိတ်ပိုင်းဆိုင်ရာ ကျန်းမာရေးကို ကောင်းကောင်းကြည့်ဖို့ ကူညီပါတယ်။",
        id: "📝 Jangan lupa catat suasana hati Anda hari ini! Ini membantu melacak kesejahteraan emosional Anda."
      },
      assessment_reminder: {
        en: "🔍 Time for a quick mental health check-in. Complete a brief assessment to understand your wellbeing.",
        zh: "🔍 是时候进行快速心理健康检查了。完成简短评估以了解您的健康状况。",
        bn: "🔍 দ্রুত মানসিক স্বাস্থ্য চেক-ইনের সময়। আপনার সুস্থতা বোঝার জন্য একটি সংক্ষিপ্ত মূল্যায়ন সম্পূর্ণ করুন।",
        ta: "🔍 விரைவான மனநல பரிசோதனையின் நேரம். உங்கள் நல்வாழ்வைப் புரிந்துகொள்ள ஒரு சுருக்கமான மதிப்பீட்டை முடிக்கவும்।",
        my: "🔍 စိတ်ကျန်းမာရေး အမြန်စစ်ဆေးချိန်ရောက်ပြီ။ သင့်ကျန်းမာရေးအခြေအနေကို နားလည်ဖို့ တိုတောင်းတဲ့ အကဲဖြတ်မှုတစ်ခု လုပ်ပါ။",
        id: "🔍 Saatnya pemeriksaan kesehatan mental singkat. Selesaikan penilaian singkat untuk memahami kesejahteraan Anda."
      },
      error_message: {
        en: "Sorry, I couldn't understand that. Please try again or type 'help' for assistance.",
        zh: "抱歉，我无法理解。请重试或输入'帮助'寻求协助。",
        bn: "দুঃখিত, আমি বুঝতে পারিনি। অনুগ্রহ করে আবার চেষ্টা করুন বা 'সাহায্য' টাইপ করুন।",
        ta: "மன்னிக்கவும், எனக்கு புரியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது 'உதவி' என்று தட்டச்சு செய்யவும்।",
        my: "စိတ်မကောင်းပါဘူး၊ နားမလည်ပါ။ ထပ်ကြိုးစားပါ သို့မဟုတ် 'အကူအညီ' ဟုရိုက်ပါ။",
        id: "Maaf, saya tidak mengerti. Silakan coba lagi atau ketik 'bantuan' untuk mendapat bantuan."
      },
      voice_processing_error: {
        en: "I had trouble processing your voice message. Please try sending a text message instead.",
        zh: "我无法处理您的语音消息。请尝试发送文本消息。",
        bn: "আপনার ভয়েস বার্তা প্রক্রিয়া করতে সমস্যা হয়েছে। পরিবর্তে টেক্সট বার্তা পাঠানোর চেষ্টা করুন।",
        ta: "உங்கள் குரல் செய்தியை செயலாக்குவதில் சிக்கல் உள்ளது. பதிலாக உரை செய்தி அனுப்ப முயற்சிக்கவும்।",
        my: "သင့်အသံစာကို လုပ်ဆောင်ရာတွင် ပြဿနာရှိပါသည်။ စာတစ်စောင် ပို့ကြည့်ပါ။",
        id: "Saya mengalami masalah memproses pesan suara Anda. Silakan coba kirim pesan teks."
      },
      default_wellness_tip: {
        en: "💡 Wellness Tip: Take 5 deep breaths and remind yourself that you are enough, just as you are.",
        zh: "💡 健康小贴士：深呼吸5次，提醒自己你就是你，这样就足够了。",
        bn: "💡 সুস্থতার টিপ: ৫টি গভীর শ্বাস নিন এবং নিজেকে মনে করিয়ে দিন যে আপনি যথেষ্ট, ঠিক যেমন আছেন।",
        ta: "💡 நல்வாழ்வு குறிப்பு: 5 ஆழமான மூச்சுகளை எடுத்து, நீங்கள் இருக்கும் விதத்திலேயே போதும் என்று உங்களுக்கு நினைவூட்டுங்கள்।",
        my: "💡 ကျန်းမာရေးအကြံပြုချက်: နက်ရှိုင်းစွာ အသက်ရှူ ၅ကြိမ်ရှူပြီး သင်သည် လုံလောက်သည်ဟု သင့်ကိုယ်သင် သတိပေးပါ။",
        id: "💡 Tips Kesehatan: Ambil 5 napas dalam dan ingatkan diri Anda bahwa Anda sudah cukup, apa adanya."
      }
    };

    const textSet = texts[key as keyof typeof texts];
    if (!textSet) return key;
    
    return textSet[language as keyof typeof textSet] || textSet.en;
  }

  private getResourceText(resource: any, language: string): string {
    // Extract title and description from Json fields based on language
    const title = resource.title?.[language] || resource.title?.en || 'Resource';
    const description = resource.description?.[language] || resource.description?.en || '';
    
    // Format contact information
    let contactText = '';
    if (resource.contactInfo) {
      if (typeof resource.contactInfo === 'object') {
        const phone = resource.contactInfo.phone;
        const description = resource.contactInfo.description;
        if (phone) contactText += `\n📞 ${description || 'Contact'}: ${phone}`;
      }
    }
    
    // Format availability
    let availabilityText = '';
    if (resource.availability?.hours) {
      availabilityText = `\n🕒 Available: ${resource.availability.hours}`;
    }
    
    return `📋 ${title}\n${description}${contactText}${availabilityText}`;
  }

  private async getRandomWellnessTip(language: string): Promise<string> {
    const resources = await prisma.mentalHealthResource.findMany({
      where: {
        category: 'self_help',
        resourceType: 'document',
        isActive: true
      }
    });

    if (resources.length === 0) {
      return this.getLocalizedText('default_wellness_tip', language);
    }

    const randomResource = resources[Math.floor(Math.random() * resources.length)];
    return this.getResourceText(randomResource, language);
  }
}