import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '../service';

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

export class CrisisFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.immediateResponse(session);
      case 1:
        return await this.safetyCheck(text, session);
      case 2:
        return await this.provideCrisisResources(session);
      case 3:
        return await this.followUpSupport(text, session);
      default:
        return await this.immediateResponse(session);
    }
  }

  private async immediateResponse(session: UserSession): Promise<FlowResponse> {
    // Log crisis intervention
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'CRISIS_INTERVENTION',
        entityType: 'crisis_alert',
        entityId: `crisis_${Date.now()}`,
        metadata: {
          triggeredAt: new Date().toISOString(),
          language: session.language,
          originalMessage: session.context.originalMessage || 'crisis_detected'
        }
      }
    });

    return {
      message: this.getLocalizedText('crisis_immediate_response', session.language),
      quickReplies: [
        this.getLocalizedText('crisis_safe_now', session.language),
        this.getLocalizedText('crisis_need_help', session.language),
        this.getLocalizedText('crisis_someone_else', session.language)
      ],
      nextStep: 1,
      priority: 'critical'
    };
  }

  private async safetyCheck(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('safe') || lowerText.includes('okay') || lowerText.includes('安全') || lowerText.includes('নিরাপদ')) {
      return {
        message: this.getLocalizedText('crisis_glad_safe', session.language),
        quickReplies: [
          this.getLocalizedText('crisis_talk_more', session.language),
          this.getLocalizedText('crisis_get_resources', session.language)
        ],
        nextStep: 2
      };
    } else if (lowerText.includes('help') || lowerText.includes('emergency') || lowerText.includes('帮助') || lowerText.includes('সাহায্য')) {
      return await this.immediateHelp(session);
    } else {
      return await this.provideCrisisResources(session);
    }
  }

  private async immediateHelp(session: UserSession): Promise<FlowResponse> {
    // Create high-priority service referral
    await this.createCrisisReferral(session);

    return {
      message: this.getLocalizedText('crisis_immediate_help', session.language),
      buttons: [
        { id: 'call_emergency', title: this.getLocalizedText('call_emergency', session.language) },
        { id: 'crisis_chat', title: this.getLocalizedText('crisis_chat', session.language) },
        { id: 'safety_plan', title: this.getLocalizedText('safety_plan', session.language) }
      ],
      nextStep: 3,
      priority: 'critical'
    };
  }

  private async provideCrisisResources(session: UserSession): Promise<FlowResponse> {
    // Get crisis resources based on user's location/language
    const crisisResources = await prisma.mentalHealthResource.findMany({
      where: {
        category: 'CRISIS_SUPPORT',
        languages: {
          has: session.language
        },
        isActive: true
      },
      orderBy: {
        priority: 'desc'
      },
      take: 5
    });

    let resourceMessage = this.getLocalizedText('crisis_resources_intro', session.language) + '\n\n';
    
    crisisResources.forEach((resource, index) => {
      const title = this.getLocalizedField(resource.title, session.language);
      const description = this.getLocalizedField(resource.description, session.language);
      
      resourceMessage += `${index + 1}. **${title}**\n`;
      resourceMessage += `   ${description}\n`;
      
      // Extract contact info from contactInfo JSON field
      const contactInfo = resource.contactInfo as any;
      if (contactInfo && typeof contactInfo === 'object') {
        if (contactInfo.phone) {
          resourceMessage += `   📞 ${contactInfo.phone}\n`;
        }
        if (contactInfo.website) {
          resourceMessage += `   🌐 ${contactInfo.website}\n`;
        }
      }
      resourceMessage += '\n';
    });

    // Save crisis resource access
    await this.logCrisisResourceAccess(session, crisisResources.map(r => r.id));

    return {
      message: resourceMessage,
      buttons: [
        { id: 'call_hotline', title: this.getLocalizedText('call_hotline', session.language) },
        { id: 'safety_planning', title: this.getLocalizedText('create_safety_plan', session.language) },
        { id: 'professional_help', title: this.getLocalizedText('find_professional', session.language) },
        { id: 'followup_check', title: this.getLocalizedText('schedule_followup', session.language) }
      ],
      nextStep: 3,
      priority: 'high'
    };
  }

  private async followUpSupport(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('call') || lowerText.includes('hotline') || lowerText.includes('电话') || lowerText.includes('ফোন')) {
      return this.provideHotlineInfo(session);
    } else if (lowerText.includes('safety') || lowerText.includes('plan') || lowerText.includes('安全') || lowerText.includes('পরিকল্পনা')) {
      return this.createSafetyPlan(session);
    } else if (lowerText.includes('professional') || lowerText.includes('therapy') || lowerText.includes('专业') || lowerText.includes('পেশাদার')) {
      return this.findProfessionalHelp(session);
    } else if (lowerText.includes('followup') || lowerText.includes('check') || lowerText.includes('跟进') || lowerText.includes('ফলোআপ')) {
      return this.scheduleFollowUp(session);
    } else {
      return this.continueSupport(session);
    }
  }

  private provideHotlineInfo(session: UserSession): FlowResponse {
    return {
      message: this.getLocalizedText('hotline_info', session.language),
      buttons: [
        { id: 'back_to_resources', title: this.getLocalizedText('back_to_resources', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true,
      priority: 'high'
    };
  }

  private async createSafetyPlan(session: UserSession): Promise<FlowResponse> {
    // Create a basic safety plan record
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'SAFETY_PLAN_CREATED',
        entityType: 'safety_plan',
        entityId: `safety_plan_${Date.now()}`,
        metadata: {
          createdAt: new Date().toISOString(),
          language: session.language
        }
      }
    });

    return {
      message: this.getLocalizedText('safety_plan_created', session.language),
      buttons: [
        { id: 'review_plan', title: this.getLocalizedText('review_plan', session.language) },
        { id: 'share_plan', title: this.getLocalizedText('share_plan', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true,
      priority: 'medium'
    };
  }

  private findProfessionalHelp(session: UserSession): FlowResponse {
    return {
      message: this.getLocalizedText('professional_help_info', session.language),
      buttons: [
        { id: 'find_therapist', title: this.getLocalizedText('find_therapist', session.language) },
        { id: 'emergency_services', title: this.getLocalizedText('emergency_services', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true,
      priority: 'high'
    };
  }

  private async scheduleFollowUp(session: UserSession): Promise<FlowResponse> {
    // Schedule a follow-up check-in
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'FOLLOWUP_SCHEDULED',
        entityType: 'followup',
        entityId: `followup_${Date.now()}`,
        metadata: {
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          language: session.language,
          crisisLevel: 'high'
        }
      }
    });

    return {
      message: this.getLocalizedText('followup_scheduled', session.language),
      buttons: [
        { id: 'immediate_support', title: this.getLocalizedText('need_immediate_support', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true,
      priority: 'medium'
    };
  }

  private continueSupport(session: UserSession): FlowResponse {
    return {
      message: this.getLocalizedText('continue_support', session.language),
      quickReplies: [
        this.getLocalizedText('feeling_better', session.language),
        this.getLocalizedText('still_struggling', session.language),
        this.getLocalizedText('need_more_help', session.language)
      ],
      buttons: [
        { id: 'crisis_resources', title: this.getLocalizedText('view_resources', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true,
      priority: 'medium'
    };
  }

  private async createCrisisReferral(session: UserSession): Promise<void> {
    // First, find a crisis resource to reference
    const crisisResource = await prisma.mentalHealthResource.findFirst({
      where: {
        category: 'CRISIS_SUPPORT',
        isActive: true
      }
    });

    if (crisisResource) {
      await prisma.serviceReferral.create({
        data: {
          userId: session.userId,
          resourceId: crisisResource.id,
          referralType: 'emergency',
          urgencyLevel: 'critical',
          status: 'pending',
          notes: 'Crisis intervention required - immediate safety concern',
          language: session.language
        }
      });
    }
  }

  private async logCrisisResourceAccess(session: UserSession, resourceIds: string[]): Promise<void> {
    const interactions = resourceIds.map(resourceId => ({
      userId: session.userId,
      interactionType: 'RESOURCE_ACCESSED' as const,
      entityType: 'mental_health_resource' as const,
      entityId: resourceId,
      metadata: {
        accessedAt: new Date().toISOString(),
        context: 'crisis_intervention',
        language: session.language
      }
    }));

    await prisma.userInteraction.createMany({
      data: interactions
    });
  }

  private getLocalizedField(jsonField: any, language: string): string {
    if (typeof jsonField === 'string') return jsonField;
    if (typeof jsonField === 'object' && jsonField !== null) {
      return jsonField[language] || jsonField.en || 'No content available';
    }
    return 'No content available';
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      crisis_immediate_response: {
        en: "🚨 I'm very concerned about you right now. Your safety is the most important thing.\n\n🛡️ You are not alone. Help is available 24/7.\n\nPlease let me know your current situation:",
        zh: "🚨 我现在非常担心您。您的安全是最重要的。\n\n🛡️ 您并不孤单。24/7都有帮助可用。\n\n请告诉我您目前的情况：",
        bn: "🚨 আমি এখন আপনার জন্য খুবই চিন্তিত। আপনার নিরাপত্তাই সবচেয়ে গুরুত্বপূর্ণ।\n\n🛡️ আপনি একা নন। ২৪/৭ সাহায্য উপলব্ধ।\n\nঅনুগ্রহ করে আপনার বর্তমান অবস্থা জানান:",
        ta: "🚨 நான் இப்போது உங்களைப் பற்றி மிகவும் கவலைப்படுகிறேன். உங்கள் பாதுகாப்பு மிக முக்கியம்.\n\n🛡️ நீங்கள் தனியாக இல்லை. உதவி 24/7 கிடைக்கிறது.\n\nதயவுசெய்து உங்கள் தற்போதைய நிலைமையைத் தெரியப்படுத்துங்கள்:",
        my: "🚨 ကျွန်တော် အခုချိန်မှာ သင့်အတွက် အရမ်းစိုးရိမ်နေပါတယ်။ သင့်လုံခြုံမှုက အရေးကြီးဆုံးပါ။\n\n🛡️ သင်တစ်ယောက်တည်းမဟုတ်ပါ။ ၂၄/၇ အကူအညီရနိုင်ပါတယ်။\n\nသင့်ရဲ့ လောလောဆယ် အခြေအနေကို ပြောပြပါ:",
        id: "🚨 Saya sangat khawatir tentang Anda sekarang. Keselamatan Anda adalah hal yang paling penting.\n\n🛡️ Anda tidak sendirian. Bantuan tersedia 24/7.\n\nTolong beri tahu saya situasi Anda saat ini:"
      },
      crisis_safe_now: {
        en: "I'm safe right now",
        zh: "我现在很安全",
        bn: "আমি এখন নিরাপদ",
        ta: "நான் இப்போது பாதுகாப்பாக இருக்கிறேன்",
        my: "ကျွန်တော် အခုချိန်မှာ လုံခြုံပါတယ်",
        id: "Saya aman sekarang"
      },
      crisis_need_help: {
        en: "I need immediate help",
        zh: "我需要立即帮助",
        bn: "আমার তাৎক্ষণিক সাহায্য দরকার",
        ta: "எனக்கு உடனடி உதவி வேண்டும்",
        my: "ကျွန်တော် ချက်ချင်း အကူအညီ လိုပါတယ်",
        id: "Saya butuh bantuan segera"
      },
      crisis_someone_else: {
        en: "I'm worried about someone else",
        zh: "我担心其他人",
        bn: "আমি অন্য কারো জন্য চিন্তিত",
        ta: "நான் வேறு யாரையாவது பற்றி கவலைப்படுகிறேன்",
        my: "ကျွန်တော် တခြားသူတစ်ယောက်အတွက် စိုးရိမ်နေပါတယ်",
        id: "Saya khawatir tentang orang lain"
      },
      crisis_glad_safe: {
        en: "I'm glad to hear you're safe. How can I best support you right now?",
        zh: "很高兴听到您安全。我现在如何最好地支持您？",
        bn: "আপনি নিরাপদ শুনে আমি খুশি। আমি এখন আপনাকে কীভাবে সবচেয়ে ভাল সাহায্য করতে পারি?",
        ta: "நீங்கள் பாதுகாப்பாக இருப்பதைக் கேட்டு மகিழ்ச்சி. இப்போது உங்களை எப்படி சிறப்பாக ஆதரிக்க முடியும்?",
        my: "သင် လုံခြုံပါတယ်လို့ ကြားရတာ ဝမ်းသာပါတယ်။ အခုချိန်မှာ သင့်ကို ဘယ်လို အကောင်းဆုံး ထောက်ပံ့နိုင်မလဲ?",
        id: "Saya senang mendengar Anda aman. Bagaimana saya bisa mendukung Anda sebaik-baiknya sekarang?"
      },
      crisis_talk_more: {
        en: "I want to talk more about my feelings",
        zh: "我想更多地谈论我的感受",
        bn: "আমি আমার অনুভূতি নিয়ে আরো কথা বলতে চাই",
        ta: "என் உணர்வுகளைப் பற்றி மேலும் பேச விரும்புகிறேன்",
        my: "ကျွန်တော့်ရဲ့ ခံစားချက်များအကြောင်း ပိုပြီး ပြောချင်ပါတယ်",
        id: "Saya ingin berbicara lebih banyak tentang perasaan saya"
      },
      crisis_get_resources: {
        en: "Show me helpful resources",
        zh: "给我显示有用的资源",
        bn: "আমাকে সহায়ক সংস্থান দেখান",
        ta: "பயனுள்ள வளங்களைக் காட்டுங்கள்",
        my: "အကူအညီဖြစ်တဲ့ အရင်းအမြစ်များကို ပြပါ",
        id: "Tunjukkan sumber daya yang berguna"
      },
      crisis_immediate_help: {
        en: "🆘 You've requested immediate help. Here are your fastest options for support:",
        zh: "🆘 您已请求立即帮助。以下是您最快的支持选项：",
        bn: "🆘 আপনি তাৎক্ষণিক সাহায্যের জন্য অনুরোধ করেছেন। এখানে আপনার সাহায্যের জন্য দ্রুততম বিকল্প রয়েছে:",
        ta: "🆘 நீங்கள் உடனடி உதவியைக் கோரியுள்ளீர்கள். ஆதரவுக்கான உங்களின் விரைவான விருப்பங்கள் இங்கே:",
        my: "🆘 သင် ချက်ချင်း အကူအညီတောင်းခံထားပါတယ်။ ထောက်ပံ့မှုအတွက် သင့်ရဲ့ အမြန်ဆုံး ရွေးချယ်စရာများ ဒီမှာ ရှိပါတယ်:",
        id: "🆘 Anda telah meminta bantuan segera. Berikut adalah opsi tercepat untuk dukungan:"
      },
      call_emergency: {
        en: "📞 Call Emergency Services",
        zh: "📞 拨打紧急服务",
        bn: "📞 জরুরি সেবায় কল করুন",
        ta: "📞 அவசர சேவைகளை அழைக்கவும்",
        my: "📞 အရေးပေါ် ဝန်ဆောင်မှုများကို ခေါ်ပါ",
        id: "📞 Hubungi Layanan Darurat"
      },
      crisis_chat: {
        en: "💬 Crisis Chat Support",
        zh: "💬 危机聊天支持",
        bn: "💬 সংকট চ্যাট সহায়তা",
        ta: "💬 நெருக்கடி அரட்டை ஆதரவு",
        my: "💬 အကျပ်အတည်း ချတ် ထောက်ပံ့မှု",
        id: "💬 Dukungan Chat Krisis"
      },
      safety_plan: {
        en: "🛡️ Create Safety Plan",
        zh: "🛡️ 创建安全计划",
        bn: "🛡️ নিরাপত্তা পরিকল্পনা তৈরি করুন",
        ta: "🛡️ பாதுகாப்பு திட்டத்தை உருவாக்கவும்",
        my: "🛡️ လုံခြုံရေး အစီအစဉ် ပြုလုပ်ပါ",
        id: "🛡️ Buat Rencana Keamanan"
      },
      crisis_resources_intro: {
        en: "🆘 **Crisis Support Resources**\n\nHere are immediate support options available to you:",
        zh: "🆘 **危机支持资源**\n\n以下是您可用的立即支持选项：",
        bn: "🆘 **সংকট সহায়তা সংস্থান**\n\nএখানে আপনার জন্য উপলব্ধ তাৎক্ষণিক সহায়তার বিকল্প রয়েছে:",
        ta: "🆘 **நெருக்கடி ஆதரவு வளங்கள்**\n\nஉங்களுக்குக் கிடைக்கும் உடனடி ஆதரவு விருப்பங்கள் இங்கே:",
        my: "🆘 **အကျပ်အတည်း ထောက်ပံ့မှု အရင်းအမြစ်များ**\n\nသင့်အတွက် ရရှိနိုင်တဲ့ ချက်ချင်း ထောက်ပံ့မှု ရွေးချယ်စရာများ ဒီမှာ ရှိပါတယ်:",
        id: "🆘 **Sumber Daya Dukungan Krisis**\n\nBerikut adalah opsi dukungan langsung yang tersedia untuk Anda:"
      },
      call_hotline: {
        en: "📞 Call Crisis Hotline",
        zh: "📞 拨打危机热线",
        bn: "📞 সংকট হটলাইনে কল করুন",
        ta: "📞 நெருக்கடி ஹாட்லைனை அழைக்கவும்",
        my: "📞 အကျပ်အတည်း ဟော့လိုင်းကို ခေါ်ပါ",
        id: "📞 Hubungi Hotline Krisis"
      },
      create_safety_plan: {
        en: "🛡️ Safety Planning",
        zh: "🛡️ 安全规划",
        bn: "🛡️ নিরাপত্তা পরিকল্পনা",
        ta: "🛡️ பாதுகாப்பு திட்டமிடல்",
        my: "🛡️ လုံခြုံရေး အစီအစဉ်ချမှတ်ခြင်း",
        id: "🛡️ Perencanaan Keamanan"
      },
      find_professional: {
        en: "🏥 Find Professional Help",
        zh: "🏥 寻找专业帮助",
        bn: "🏥 পেশাদার সাহায্য খুঁজুন",
        ta: "🏥 தொழில்முறை உதவியைக் கண்டறியவும்",
        my: "🏥 ပရော်ဖက်ရှင်နယ် အကူအညီ ရှာပါ",
        id: "🏥 Cari Bantuan Profesional"
      },
      schedule_followup: {
        en: "📅 Schedule Follow-up",
        zh: "📅 安排跟进",
        bn: "📅 ফলো-আপ সময়সূচী করুন",
        ta: "📅 பின்தொடர்தலை திட்டமிடவும்",
        my: "📅 နောက်ဆက်တွဲ စစ်ဆေးမှု စီစဉ်ပါ",
        id: "📅 Jadwalkan Tindak Lanjut"
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
