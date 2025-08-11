import twilio from 'twilio';
import { prisma } from './prisma';
import redis from './redis';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  mediaUrl?: string;
  mediaContentType?: string;
}

export interface ConversationState {
  userId: string;
  phoneNumber: string;
  language: string;
  currentFlow: string;
  step: number;
  data: Record<string, any>;
  lastActivity: Date;
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  
  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  // Send a WhatsApp message with optional quick replies
  async sendMessage(
    to: string, 
    body: string, 
    quickReplies?: string[],
    mediaUrl?: string
  ): Promise<void> {
    try {
      const messageOptions: any = {
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${to}`,
        body
      };

      if (mediaUrl) {
        messageOptions.mediaUrl = mediaUrl;
      }

      await client.messages.create(messageOptions);
      
      // Log the message in database
      await this.logMessage(to, body, 'outbound');
      
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  // Send interactive message with buttons
  async sendInteractiveMessage(
    to: string,
    body: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<void> {
    try {
      // Format buttons for Twilio
      const buttonText = buttons
        .map((btn, index) => `${index + 1}. ${btn.title}`)
        .join('\n');
      
      const fullMessage = `${body}\n\n${buttonText}\n\nReply with the number of your choice.`;
      
      await this.sendMessage(to, fullMessage);
      
    } catch (error) {
      console.error('Failed to send interactive message:', error);
      throw error;
    }
  }

  // Get or create user conversation state
  async getConversationState(phoneNumber: string): Promise<ConversationState | null> {
    try {
      const stateKey = `whatsapp:state:${phoneNumber}`;
      const stateData = await redis.get(stateKey);
      
      if (stateData) {
        return JSON.parse(stateData);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get conversation state:', error);
      return null;
    }
  }

  // Save conversation state
  async saveConversationState(state: ConversationState): Promise<void> {
    try {
      const stateKey = `whatsapp:state:${state.phoneNumber}`;
      const ttl = parseInt(process.env.WHATSAPP_SESSION_TIMEOUT || '1800'); // 30 minutes
      
      await redis.setex(stateKey, ttl, JSON.stringify(state));
      
    } catch (error) {
      console.error('Failed to save conversation state:', error);
    }
  }

  // Clear conversation state
  async clearConversationState(phoneNumber: string): Promise<void> {
    try {
      const stateKey = `whatsapp:state:${phoneNumber}`;
      await redis.del(stateKey);
    } catch (error) {
      console.error('Failed to clear conversation state:', error);
    }
  }

  // Find or create anonymous user by phone number
  async findOrCreateUser(phoneNumber: string, language = 'en'): Promise<string> {
    try {
      // Hash phone number for privacy
      const hashedPhone = this.hashPhoneNumber(phoneNumber);
      
      let user = await prisma.anonymousUser.findFirst({
        where: { deviceFingerprint: hashedPhone }
      });

      if (!user) {
        user = await prisma.anonymousUser.create({
          data: {
            anonymousId: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            language,
            deviceFingerprint: hashedPhone,
            timezone: 'UTC'
          }
        });
      } else {
        // Update last active time
        await prisma.anonymousUser.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() }
        });
      }

      return user.id;
    } catch (error) {
      console.error('Failed to find or create user:', error);
      throw error;
    }
  }

  // Log message for analytics (PDPA compliant)
  async logMessage(
    phoneNumber: string, 
    content: string, 
    direction: 'inbound' | 'outbound',
    messageType = 'text'
  ): Promise<void> {
    try {
      const userId = await this.findOrCreateUser(phoneNumber);
      
      await prisma.userInteraction.create({
        data: {
          userId,
          interactionType: `whatsapp_${direction}`,
          entityType: 'message',
          metadata: {
            messageType,
            contentLength: content.length,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  // Hash phone number for privacy compliance
  private hashPhoneNumber(phoneNumber: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phoneNumber).digest('hex');
  }

  // Detect language from message content
  async detectLanguage(message: string): Promise<string> {
    // Simple keyword-based detection (in production, use proper language detection service)
    const languageKeywords = {
      zh: ['你好', '谢谢', '帮助', '心理', '焦虑'],
      bn: ['হ্যালো', 'ধন্যবাদ', 'সাহায্য', 'মানসিক', 'উদ্বেগ'],
      ta: ['வணக்கம்', 'நன்றி', 'உதவி', 'மன', 'கவலை'],
      my: ['မင်္ဂလာပါ', 'ကျေးဇူးတင်', 'အကူအညီ', 'စိတ်', 'စိုးရိမ်'],
      id: ['halo', 'terima kasih', 'bantuan', 'mental', 'cemas']
    };

    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return lang;
      }
    }

    return 'en'; // Default to English
  }

  // Send proactive nudge messages
  async sendProactiveNudge(
    phoneNumber: string, 
    nudgeType: 'daily_checkin' | 'mood_reminder' | 'resource_share',
    language = 'en'
  ): Promise<void> {
    const messages = {
      daily_checkin: {
        en: "👋 Hi! How are you feeling today? Take a moment to check in with yourself. You can share your mood or thoughts with me anytime.",
        zh: "👋 您好！您今天感觉如何？花点时间关注自己。您可以随时与我分享您的心情或想法。",
        bn: "👋 হ্যালো! আজ আপনার কেমন লাগছে? নিজের সাথে চেক ইন করার জন্য একটু সময় নিন। আপনি যেকোনো সময় আমার সাথে আপনার মন বা চিন্তা শেয়ার করতে পারেন।",
        ta: "👋 வணக்கம்! இன்று உங்களுக்கு எப்படி இருக்கிறது? உங்களுடன் சரிபார்க்க சிறிது நேரம் எடுத்துக்கொள்ளுங்கள். நீங்கள் எப்போது வேண்டுமானாலும் உங்கள் மனநிலை அல்லது எண்ணங்களை என்னுடன் பகிர்ந்து கொள்ளலாம்।",
        my: "👋 မင်္ဂလာပါ! ဒီနေ့ ဘယ်လို ခံစားရလဲ? သင့်ကိုယ်သင် စစ်ဆေးဖို့ အချိန်အနည်းငယ် ယူပါ။ သင့်စိတ်ခံစားမှု သို့မဟုတ် အတွေးများကို ကျွန်တော့်နဲ့ အချိན်မရွေး မျှဝေနိုင်ပါတယ်။",
        id: "👋 Halo! Bagaimana perasaan Anda hari ini? Luangkan waktu sejenak untuk memeriksa diri sendiri. Anda dapat berbagi suasana hati atau pikiran dengan saya kapan saja."
      },
      mood_reminder: {
        en: "🌟 Remember to track your mood today! It helps you understand your emotional patterns. Reply 'mood' to log how you're feeling.",
        zh: "🌟 记得今天记录您的心情！这有助于您了解自己的情绪模式。回复'心情'来记录您的感受。",
        bn: "🌟 আজ আপনার মেজাজ ট্র্যাক করতে ভুলবেন না! এটি আপনাকে আপনার আবেগের ধরণ বুঝতে সাহায্য করে। আপনি কেমন অনুভব করছেন তা লগ করতে 'মেজাজ' উত্তর দিন।",
        ta: "🌟 இன்று உங்கள் மனநிலையைக் கண்காணிக்க நினைவில் கொள்ளுங்கள்! இது உங்கள் உணர்ச்சி வடிவங்களைப் புரிந்துகொள்ள உதவுகிறது। நீங்கள் எப்படி உணர்கிறீர்கள் என்பதைப் பதிவு செய்ய 'மனநிலை' என்று பதிலளியுங்கள்।",
        my: "🌟 ဒီနေ့ သင့်စိတ်ခံစားမှုကို မှတ်တမ်းတင်ဖို့ မမေ့နဲ့! ဒါက သင့်ရဲ့ စိတ်ပိုင်းဆိုင်ရာ ပုံစံတွေကို နားလည်ဖို့ ကူညီပါတယ်။ သင် ဘယ်လို ခံစားရတယ်ဆိုတာ မှတ်တမ်းတင်ဖို့ 'စိတ်ခံစားမှု' လို့ ပြန်ပေးပါ။",
        id: "🌟 Ingat untuk melacak suasana hati Anda hari ini! Ini membantu Anda memahami pola emosional Anda. Balas 'mood' untuk mencatat perasaan Anda."
      },
      resource_share: {
        en: "📚 Here's a helpful mental health resource for you. Remember, it's okay to ask for help. You're not alone in this journey.",
        zh: "📚 这里有一个对您有帮助的心理健康资源。记住，寻求帮助是可以的。在这段旅程中您并不孤单。",
        bn: "📚 এখানে আপনার জন্য একটি সহায়ক মানসিক স্বাস্থ্য সম্পদ রয়েছে। মনে রাখবেন, সাহায্য চাওয়া ঠিক আছে। এই যাত্রায় আপনি একা নন।",
        ta: "📚 இங்கே உங்களுக்கு ஒரு உதவிகரமான மனநல வளம் உள்ளது. நினைவில் கொள்ளுங்கள், உதவி கேட்பது பரவாயில்லை. இந்த பயணத்தில் நீங்கள் தனியாக இல்லை।",
        my: "📚 သင့်အတွက် အကူအညီဖြစ်မယ့် စိတ်ကျန်းမာရေး အရင်းအမြစ်တစ်ခု ဒီမှာ ရှိပါတယ်။ အကူအညီတောင်းတာ အဆင်ပြေတယ်ဆိုတာ မမေ့နဲ့။ ဒီခရီးမှာ သင်တစ်ယောက်တည်း မဟုတ်ဘူး။",
        id: "📚 Berikut adalah sumber daya kesehatan mental yang berguna untuk Anda. Ingat, tidak apa-apa meminta bantuan. Anda tidak sendirian dalam perjalanan ini."
      }
    };

    const messageSet = messages[nudgeType];
    const message = messageSet[language as keyof typeof messageSet] || messageSet.en;

    await this.sendMessage(phoneNumber, message);
  }
}
