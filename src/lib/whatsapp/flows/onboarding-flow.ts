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

export class OnboardingFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.welcomeMessage(session);
      case 1:
        return await this.languageSelection(text, session);
      case 2:
        return await this.privacyConsent(text, session);
      case 3:
        return await this.demographicInfo(text, session);
      case 4:
        return await this.mentalHealthNeeds(text, session);
      case 5:
        return await this.completeOnboarding(text, session);
      default:
        return await this.welcomeMessage(session);
    }
  }

  private async welcomeMessage(session: UserSession): Promise<FlowResponse> {
    // Log new user interaction using UserInteraction model
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'ONBOARDING_START',
        entityType: 'welcome',
        entityId: `welcome_${Date.now()}`,
        metadata: {
          isNewUser: session.isNewUser,
          timestamp: new Date().toISOString()
        }
      }
    });

    return {
      message: this.getLocalizedText('welcome_new_user', session.language),
      quickReplies: [
        this.getLocalizedText('get_started', session.language),
        this.getLocalizedText('learn_more', session.language),
        this.getLocalizedText('change_language', session.language)
      ],
      nextStep: 1
    };
  }

  private async languageSelection(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('language') || lowerText.includes('语言') || lowerText.includes('ভাষা')) {
      return {
        message: this.getLocalizedText('language_selection', session.language),
        quickReplies: [
          '1. English',
          '2. 中文 (Chinese)',
          '3. বাংলা (Bengali)',
          '4. தமிழ் (Tamil)',
          '5. မြန်မာ (Myanmar)',
          '6. Bahasa Indonesia'
        ],
        nextStep: 1
      };
    } else if (lowerText.includes('learn')) {
      return {
        message: this.getLocalizedText('about_sata_privacy', session.language),
        buttons: [
          { id: 'start_onboarding', title: this.getLocalizedText('ready_to_start', session.language) },
          { id: 'privacy_details', title: this.getLocalizedText('privacy_details', session.language) }
        ],
        nextStep: 2
      };
    } else {
      // Proceed to privacy consent
      return {
        message: this.getLocalizedText('privacy_consent_request', session.language),
        buttons: [
          { id: 'agree_consent', title: this.getLocalizedText('agree_and_continue', session.language) },
          { id: 'read_policy', title: this.getLocalizedText('read_privacy_policy', session.language) },
          { id: 'decline_consent', title: this.getLocalizedText('decline_consent', session.language) }
        ],
        nextStep: 2
      };
    }
  }

  private async privacyConsent(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('agree') || lowerText.includes('accept') || lowerText.includes('同意')) {
      // Store consent information in UserInteraction model (PDPA compliant)
      await prisma.userInteraction.create({
        data: {
          userId: session.userId,
          interactionType: 'CONSENT_GIVEN',
          entityType: 'privacy_consent',
          entityId: 'onboarding_consent',
          metadata: {
            consentGiven: true,
            consentDate: new Date().toISOString(),
            privacyPolicyVersion: '1.0',
            consentType: 'data_processing'
          }
        }
      });

      // Update user's last activity (only field available in AnonymousUser)
      await prisma.anonymousUser.update({
        where: { id: session.userId },
        data: {
          lastActiveAt: new Date()
        }
      });

      return {
        message: this.getLocalizedText('consent_accepted', session.language),
        quickReplies: [
          this.getLocalizedText('migrant_worker', session.language),
          this.getLocalizedText('local_resident', session.language),
          this.getLocalizedText('international_student', session.language),
          this.getLocalizedText('prefer_not_say', session.language)
        ],
        nextStep: 3
      };
    } else if (lowerText.includes('read') || lowerText.includes('policy')) {
      return {
        message: this.getLocalizedText('privacy_policy_full', session.language),
        buttons: [
          { id: 'agree_after_reading', title: this.getLocalizedText('agree_after_reading', session.language) },
          { id: 'decline_consent', title: this.getLocalizedText('decline_consent', session.language) }
        ],
        nextStep: 2
      };
    } else {
      // Log consent decline
      await prisma.userInteraction.create({
        data: {
          userId: session.userId,
          interactionType: 'CONSENT_DECLINED',
          entityType: 'privacy_consent',
          entityId: 'onboarding_consent_declined',
          metadata: {
            consentGiven: false,
            declineDate: new Date().toISOString(),
            reason: 'user_choice'
          }
        }
      });

      return {
        message: this.getLocalizedText('consent_declined_info', session.language),
        buttons: [
          { id: 'reconsider_consent', title: this.getLocalizedText('reconsider_consent', session.language) },
          { id: 'exit_onboarding', title: this.getLocalizedText('exit_onboarding', session.language) }
        ],
        shouldEndFlow: true
      };
    }
  }

  private async demographicInfo(text: string, session: UserSession): Promise<FlowResponse> {
    // Store demographic info in UserInteraction model (PDPA compliant)
    const demographic = this.parseDemographic(text, session.language);
    
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'DEMOGRAPHIC_INFO',
        entityType: 'user_profile',
        entityId: 'demographic_collection',
        metadata: {
          userType: demographic,
          demographicCollectedAt: new Date().toISOString(),
          onboardingStep: 'demographic'
        }
      }
    });

    // Update user's last activity
    await prisma.anonymousUser.update({
      where: { id: session.userId },
      data: {
        lastActiveAt: new Date()
      }
    });

    return {
      message: this.getLocalizedText('mental_health_needs_intro', session.language),
      quickReplies: [
        this.getLocalizedText('stress_anxiety', session.language),
        this.getLocalizedText('depression_sadness', session.language),
        this.getLocalizedText('work_life_balance', session.language),
        this.getLocalizedText('social_isolation', session.language),
        this.getLocalizedText('general_wellness', session.language)
      ],
      nextStep: 4,
      context: { demographic }
    };
  }

  private async mentalHealthNeeds(text: string, session: UserSession): Promise<FlowResponse> {
    const needs = this.parseNeeds(text, session.language);
    
    // Store mental health needs in UserInteraction model
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'MENTAL_HEALTH_NEEDS',
        entityType: 'user_profile',
        entityId: 'needs_assessment',
        metadata: {
          mentalHealthNeeds: needs,
          needsCollectedAt: new Date().toISOString(),
          onboardingStep: 'mental_health_needs'
        }
      }
    });
    
    return {
      message: this.getLocalizedText('setup_preferences', session.language),
      buttons: [
        { id: 'daily_checkins', title: this.getLocalizedText('enable_daily_checkins', session.language) },
        { id: 'peer_support', title: this.getLocalizedText('join_peer_groups', session.language) },
        { id: 'skip_for_now', title: this.getLocalizedText('skip_preferences', session.language) }
      ],
      nextStep: 5,
      context: { ...session.context, needs }
    };
  }

  private async completeOnboarding(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    
    // Set up user preferences based on selection
    if (lowerText.includes('daily') || lowerText.includes('checkin')) {
      await this.enableDailyCheckins(session);
    }
    
    if (lowerText.includes('peer') || lowerText.includes('group')) {
      await this.setupPeerSupport(session);
    }

    // Store onboarding completion in UserInteraction model
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'ONBOARDING_COMPLETED',
        entityType: 'user_profile',
        entityId: 'onboarding_completion',
        metadata: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
          preferences: {
            dailyCheckins: lowerText.includes('daily'),
            peerSupport: lowerText.includes('peer'),
            mentalHealthNeeds: session.context.needs || []
          },
          completionStep: 'final'
        }
      }
    });

    // Update user's last activity
    await prisma.anonymousUser.update({
      where: { id: session.userId },
      data: {
        lastActiveAt: new Date()
      }
    });

    // Award onboarding points using upsert to handle existing records
    await prisma.gamificationData.upsert({
      where: { userId: session.userId },
      update: {
        totalPoints: { increment: 50 },
        updatedAt: new Date()
      },
      create: {
        userId: session.userId,
        totalPoints: 50,
        level: 1,
        streak: 1
      }
    });

    return {
      message: this.getLocalizedText('onboarding_complete', session.language),
      buttons: [
        { id: 'take_assessment', title: this.getLocalizedText('start_phq4', session.language) },
        { id: 'explore_resources', title: this.getLocalizedText('browse_resources', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: 'idle',
      nextStep: 0,
      shouldEndFlow: true
    };
  }

  private async enableDailyCheckins(session: UserSession): Promise<void> {
    // Create daily checkin preference in UserInteraction model
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'PREFERENCE_SET',
        entityType: 'daily_checkin',
        entityId: 'enabled',
        metadata: {
          enabled: true,
          frequency: 'daily',
          preferredTime: '09:00',
          setupDate: new Date().toISOString()
        }
      }
    });
  }

  private async setupPeerSupport(session: UserSession): Promise<void> {
    // Find appropriate support group using correct schema fields
    const supportGroup = await prisma.supportGroup.findFirst({
      where: {
        language: session.language,
        isActive: true
        // maxMembers comparison would require counting current members
      }
    });

    if (supportGroup) {
      // Check if membership already exists to avoid duplicates
      const existingMembership = await prisma.groupMembership.findFirst({
        where: {
          userId: session.userId,
          groupId: supportGroup.id
        }
      });

      if (!existingMembership) {
        await prisma.groupMembership.create({
          data: {
            userId: session.userId,
            groupId: supportGroup.id,
            role: 'member',
            joinedAt: new Date()
          }
        });

        // Log the group joining interaction
        await prisma.userInteraction.create({
          data: {
            userId: session.userId,
            interactionType: 'GROUP_JOINED',
            entityType: 'support_group',
            entityId: supportGroup.id,
            metadata: {
              groupName: supportGroup.name,
              groupLanguage: supportGroup.language,
              joinedDate: new Date().toISOString()
            }
          }
        });
      }
    }
  }

  private parseDemographic(text: string, language: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('migrant') || lowerText.includes('worker') || lowerText.includes('外籍')) {
      return 'migrant_worker';
    } else if (lowerText.includes('local') || lowerText.includes('resident')) {
      return 'local_resident';
    } else if (lowerText.includes('student') || lowerText.includes('学生')) {
      return 'student';
    } else {
      return 'prefer_not_say';
    }
  }

  private parseNeeds(text: string, language: string): string[] {
    const lowerText = text.toLowerCase();
    const needs: string[] = [];
    
    if (lowerText.includes('stress') || lowerText.includes('anxiety') || lowerText.includes('焦虑')) {
      needs.push('stress_anxiety');
    }
    if (lowerText.includes('depression') || lowerText.includes('sad') || lowerText.includes('抑郁')) {
      needs.push('depression_sadness');
    }
    if (lowerText.includes('work') || lowerText.includes('balance') || lowerText.includes('工作')) {
      needs.push('work_life_balance');
    }
    if (lowerText.includes('social') || lowerText.includes('isolation') || lowerText.includes('孤独')) {
      needs.push('social_isolation');
    }
    
    return needs.length > 0 ? needs : ['general_wellness'];
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      welcome_new_user: {
        en: "👋 Welcome to SATA Mental Wellness Assistant! I'm here to support your mental health journey in a safe, anonymous environment. Let's get started with a few questions to personalize your experience.",
        zh: "👋 欢迎来到SATA心理健康助手！我在这里在安全、匿名的环境中支持您的心理健康之旅。让我们先回答几个问题来个性化您的体验。",
        bn: "👋 SATA মানসিক সুস্থতা সহায়কে স্বাগতম! আমি একটি নিরাপদ, বেনামী পরিবেশে আপনার মানসিক স্বাস্থ্য যাত্রায় সহায়তা করতে এখানে আছি। আপনার অভিজ্ঞতা ব্যক্তিগতকরণের জন্য কয়েকটি প্রশ্ন দিয়ে শুরু করি।",
        ta: "👋 SATA மன நல உதவியாளருக்கு வரவேற்கிறோம்! பாதுகாப்பான, அநாமதேய சூழலில் உங்கள் மன ஆரோக்கிய பயணத்தை ஆதரிக்க நான் இங்கே இருக்கிறேன். உங்கள் அனுபவத்தை தனிப்பயனாக்க சில கேள்விகளுடன் தொடங்குவோம்।",
        my: "👋 SATA စိတ်ကျန်းမာရေး အကူအညီကို ကြိုဆိုပါတယ်! လုံခြုံပြီး အမည်မဖော်သော ပတ်ဝန်းကျင်မှာ သင့်ရဲ့ စိတ်ကျန်းမာရေး ခရီးကို ထောက်ပံ့ဖို့ ကျွန်တော် ဒီမှာ ရှိပါတယ်။ သင့်အတွေ့အကြုံကို စိတ်ကြိုက်ပြင်ဆင်ဖို့ မေးခွန်းအနည်းငယ်နဲ့ စတင်ကြပါစို့။",
        id: "👋 Selamat datang di Asisten Kesehatan Mental SATA! Saya di sini untuk mendukung perjalanan kesehatan mental Anda di lingkungan yang aman dan anonim. Mari mulai dengan beberapa pertanyaan untuk mempersonalisasi pengalaman Anda."
      },
      language_selection: {
        en: "🌍 Please select your preferred language:",
        zh: "🌍 请选择您的首选语言：",
        bn: "🌍 অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন:",
        ta: "🌍 உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்:",
        my: "🌍 သင့်နှစ်သက်သော ဘာသာစကားကို ရွေးချယ်ပါ:",
        id: "🌍 Silakan pilih bahasa yang Anda sukai:"
      },
      about_sata_privacy: {
        en: "📋 About SATA Privacy\n\nWe prioritize your privacy and mental health:\n\n• All conversations are anonymous\n• Data is encrypted and PDPA-compliant\n• You control what information to share\n• Professional crisis support available 24/7\n• Resources tailored to migrant workers",
        zh: "📋 关于SATA隐私\n\n我们优先考虑您的隐私和心理健康：\n\n• 所有对话都是匿名的\n• 数据经过加密且符合PDPA\n• 您可以控制分享哪些信息\n• 24/7专业危机支持\n• 为外籍工人定制资源",
        bn: "📋 SATA গোপনীয়তা সম্পর্কে\n\nআমরা আপনার গোপনীয়তা এবং মানসিক স্বাস্থ্যকে অগ্রাধিকার দিই:\n\n• সমস্ত কথোপকথন বেনামী\n• ডেটা এনক্রিপ্ট এবং PDPA-সম্মত\n• আপনি কি তথ্য ভাগ করবেন তা নিয়ন্ত্রণ করেন\n• ২৪/৭ পেশাদার সংকট সহায়তা\n• প্রবাসী শ্রমিকদের জন্য কাস্টমাইজড সম্পদ",
        ta: "📋 SATA தனியுரிமை பற்றி\n\nஉங்கள் தனியுரிமை மற்றும் மன ஆரோக்கியத்திற்கு நாங்கள் முன்னுரிமை அளிக்கிறோம்:\n\n• அனைத்து உரையாடல்களும் அநாமதேயம்\n• தரவு குறியாக்கம் மற்றும் PDPA-இணக்கம்\n• என்ன தகவலைப் பகிர்வது என்பதை நீங்கள் கட்டுப்படுத்துகிறீர்கள்\n• 24/7 தொழில்முறை நெருக்கடி ஆதரவு\n• புலம்பெயர் தொழிலாளர்களுக்கு வடிவமைக்கப்பட்ட வளங்கள்",
        my: "📋 SATA ကိုယ်ရေးကာယရေး အကြောင်း\n\nကျွန်ုပ်တို့က သင့်ရဲ့ ကိုယ်ရေးကာယရေးနှင့် စိတ်ကျန်းမာရေးကို ဦးစားပေးပါတယ်:\n\n• စကားပြောဆိုမှုအားလုံး အမည်မဖော်ပါ\n• ဒေတာကို ကုဒ်ဝှက်ပြီး PDPA-နှင့်ကိုက်ညီပါတယ်\n• ဘယ်လို အချက်အလက်တွေ မျှဝေမယ်ဆိုတာ သင်က ထိန်းချုပ်နိုင်ပါတယ်\n• ၂၄/၇ ပရော်ဖက်ရှင်နယ် အရေးပေါ် ထောက်ပံ့မှု\n• ရွှေ့ပြောင်းလုပ်သားများအတွက် ပြင်ဆင်ထားသော အရင်းအမြစ်များ",
        id: "📋 Tentang Privasi SATA\n\nKami mengutamakan privasi dan kesehatan mental Anda:\n\n• Semua percakapan anonim\n• Data dienkripsi dan sesuai PDPA\n• Anda mengontrol informasi apa yang dibagikan\n• Dukungan krisis profesional tersedia 24/7\n• Sumber daya yang disesuaikan untuk pekerja migran"
      },
      privacy_consent_request: {
        en: "🔒 Privacy & Data Consent\n\nTo provide personalized mental health support, we need your consent to:\n\n• Store your anonymous wellness data securely\n• Send helpful reminders and resources\n• Connect you with peer support when needed\n\nAll data is encrypted, anonymous, and PDPA-compliant. You can withdraw consent anytime.\n\nDo you consent to this data processing?",
        zh: "🔒 隐私与数据同意\n\n为了提供个性化的心理健康支持，我们需要您同意：\n\n• 安全存储您的匿名健康数据\n• 发送有用的提醒和资源\n• 在需要时连接同伴支持\n\n所有数据都是加密、匿名和符合PDPA的。您可以随时撤回同意。\n\n您是否同意此数据处理？",
        bn: "🔒 গোপনীয়তা ও ডেটা সম্মতি\n\nব্যক্তিগতকৃত মানসিক স্বাস্থ্য সহায়তা প্রদানের জন্য, আমাদের আপনার সম্মতি প্রয়োজন:\n\n• আপনার বেনামী সুস্থতার ডেটা নিরাপদে সংরক্ষণ করতে\n• সহায়ক অনুস্মারক এবং সম্পদ পাঠাতে\n• প্রয়োজনে সমবয়সী সহায়তার সাথে সংযুক্ত করতে\n\nসমস্ত ডেটা এনক্রিপ্ট, বেনামী এবং PDPA-সম্মত। আপনি যেকোনো সময় সম্মতি প্রত্যাহার করতে পারেন।\n\nআপনি কি এই ডেটা প্রক্রিয়াকরণে সম্মত?",
        ta: "🔒 தனியுரிமை மற்றும் தரவு ஒப்புதல்\n\nதனிப்பயனாக்கப்பட்ட மன ஆரோக்கிய ஆதரவை வழங்க, உங்கள் ஒப்புதல் தேவை:\n\n• உங்கள் அநாமதேய நல்வாழ்வு தரவை பாதுகாப்பாக சேமிக்க\n• உதவிகரமான நினைவூட்டல்கள் மற்றும் வளங்களை அனுப்ப\n• தேவைப்படும்போது சமூக ஆதரவுடன் இணைக்க\n\nஅனைத்து தரவும் குறியாக்கம், அநாமதேயம் மற்றும் PDPA-இணக்கமானது. எந்த நேரத்திலும் ஒப்புதலை திரும்பப் பெறலாம்।\n\nஇந்த தரவுப் செயலாக்கத்திற்கு நீங்கள் ஒப்புக்கொள்கிறீர்களா?",
        my: "🔒 ကိုယ်ရေးကာယရေး နှင့် ဒေတာ သဘောတူညီချက်\n\nစိတ်ကြိုက်ပြင်ဆင်ထားသော စိတ်ကျန်းမာရေး ထောက်ပံ့မှုကို ပေးအပ်ရန်၊ ကျွန်ုပ်တို့က သင်၏ သဘောတူညီချက် လိုအပ်ပါသည်:\n\n• သင်၏ အမည်မဖော်သော ကျန်းမာရေးဒေတာကို လုံခြုံစွာ သိမ်းဆည်းရန်\n• အသုံးဝင်သော သတိပေးချက်များနှင့် အရင်းအမြစ်များ ပေးပို့ရန်\n• လိုအပ်သောအခါ ရွယ်တူ ထောက်ပံ့မှုနှင့် ချိတ်ဆက်ပေးရန်\n\nဒေတာအားလုံး ကုဒ်ဝှက်ထား၊ အမည်မဖော်၊ PDPA-နှင့်ကိုက်ညီပါသည်။ အချိန်မရွေး သဘောတူညီချက်ကို ပြန်ရုပ်သိမ်းနိုင်ပါသည်။\n\nဤဒေတာ လုပ်ဆောင်မှုကို သဘောတူပါသလား?",
        id: "🔒 Persetujuan Privasi & Data\n\nUntuk memberikan dukungan kesehatan mental yang dipersonalisasi, kami memerlukan persetujuan Anda untuk:\n\n• Menyimpan data kesehatan anonim Anda dengan aman\n• Mengirimkan pengingat dan sumber daya yang bermanfaat\n• Menghubungkan Anda dengan dukungan sebaya saat dibutuhkan\n\nSemua data dienkripsi, anonim, dan sesuai PDPA. Anda dapat menarik persetujuan kapan saja.\n\nApakah Anda menyetujui pemrosesan data ini?"
      },
      consent_accepted: {
        en: "✅ Thank you for your consent! Now let's learn a bit about you to provide better support. What best describes you?",
        zh: "✅ 感谢您的同意！现在让我们了解一下您，以便提供更好的支持。什么最能描述您？",
        bn: "✅ আপনার সম্মতির জন্য ধন্যবাদ! এখন আরও ভাল সহায়তা প্রদানের জন্য আপনার সম্পর্কে একটু জানি। কোনটি আপনাকে সবচেয়ে ভাল বর্ণনা করে?",
        ta: "✅ உங்கள் ஒப்புதலுக்கு நன்றி! இப்போது சிறந்த ஆதரவை வழங்க உங்களைப் பற்றி கொஞ்சம் தெரிந்து கொள்வோம். உங்களை எது சிறப்பாக விவரிக்கிறது?",
        my: "✅ သင့်ရဲ့ သဘောတူညီချက်အတွက် ကျေးးဇူးတင်ပါတယ်! ယခု ပိုမိုကောင်းမွန်သော ထောက်ပံ့မှု ပေးရန် သင့်အကြောင်း အနည်းငယ် လေ့လာကြပါစို့။ သင့်ကို အကောင်းဆုံး ဖော်ပြသည့် အရာမှာ?",
        id: "✅ Terima kasih atas persetujuan Anda! Sekarang mari pelajari sedikit tentang Anda untuk memberikan dukungan yang lebih baik. Apa yang paling menggambarkan Anda?"
      },
      mental_health_needs_intro: {
        en: "🎯 What mental health areas would you like support with? This helps us provide relevant resources and connections.",
        zh: "🎯 您希望在哪些心理健康领域获得支持？这有助于我们提供相关资源和联系。",
        bn: "🎯 আপনি কোন মানসিক স্বাস্থ্য ক্ষেত্রে সহায়তা চান? এটি আমাদের প্রাসঙ্গিক সম্পদ এবং সংযোগ প্রদান করতে সাহায্য করে।",
        ta: "🎯 எந்த மன ஆரோக்கிய பகுதிகளில் ஆதரவு வேண்டும்? இது தொடர்புடைய வளங்கள் மற்றும் தொடர்புகளை வழங்க உதவுகிறது।",
        my: "🎯 ဘယ်လို စိတ်ကျန်းမာရေး နယ်ပယ်တွေမှာ ထောက်ပံ့မှု လိုချင်ပါသလဲ? ဒါက သက်ဆိုင်ရာ အရင်းအမြစ်များနှင့် ဆက်သွယ်မှုများ ပေးဖို့ ကူညီပါတယ်။",
        id: "🎯 Area kesehatan mental mana yang ingin Anda dapatkan dukungannya? Ini membantu kami menyediakan sumber daya dan koneksi yang relevan."
      },
      setup_preferences: {
        en: "⚙️ Let's set up your preferences for ongoing support:",
        zh: "⚙️ 让我们为您设置持续支持的偏好：",
        bn: "⚙️ চলমান সহায়তার জন্য আপনার পছন্দ সেট করি:",
        ta: "⚙️ தொடர்ச்சியான ஆதர்விற்கான உங்கள் விருப்பங்களை அமைப்போம்:",
        my: "⚙️ ဆက်လက် ထောက်ပံ့မှုအတွက် သင့်ရဲ့ နှစ်သက်မှုများကို သတ်မှတ်ကြပါစို့:",
        id: "⚙️ Mari atur preferensi Anda untuk dukungan berkelanjutan:"
      },
      onboarding_complete: {
        en: "🎉 Welcome aboard! Your profile is ready.\n\nI can help you with:\n🧠 Mental health assessments\n📚 Wellness resources\n👥 Peer support groups\n🆘 Crisis support (24/7)\n🎯 Daily wellness activities\n\nWhat would you like to explore first?",
        zh: "🎉 欢迎加入！您的个人资料已准备就绪。\n\n我可以帮助您：\n🧠 心理健康评估\n📚 健康资源\n👥 同伴支持小组\n🆘 危机支持（24/7）\n🎯 日常健康活动\n\n您想先探索什么？",
        bn: "🎉 স্বাগতম! আপনার প্রোফাইল প্রস্তুত।\n\nআমি সাহায্য করতে পারি:\n🧠 মানসিক স্বাস্থ্য মূল্যায়ন\n📚 সুস্থতার সম্পদ\n👥 সমবয়সী সহায়তা গ্রুপ\n🆘 সংকট সহায়তা (২৪/৭)\n🎯 দৈনন্দিন সুস্থতার কার্যক্রম\n\nআপনি প্রথমে কী অন্বেষণ করতে চান?",
        ta: "🎉 வரவேற்கிறோம்! உங்கள் சுயவிவரம் தயார்.\n\nநான் உதவ முடியும்:\n🧠 மன ஆரோக்கிய மதிப்பீடுகள்\n📚 நல்வாழ்வு வளங்கள்\n👥 சமூக ஆதரவு குழுக்கள்\n🆘 நெருக்கடி ஆதரவு (24/7)\n🎯 தினசரி நல்வாழ்வு செயல்பாடுகள்\n\nமுதலில் எதை ஆராய விரும்புகிறீர்கள்?",
        my: "🎉 ကြိုဆိုပါတယ်! သင့်ပရိုဖိုင် အဆင်သင့်ဖြစ်ပါပြီ။\n\nကျွန်တော် ကူညီနိုင်တာတွေ:\n🧠 စိတ်ကျန်းမာရေး အကဲဖြတ်မှုများ\n📚 ကျန်းမာရေး အရင်းအမြစ်များ\n👥 ရွယ်တူ ထောက်ပံ့မှု အုပ်စုများ\n🆘 အရေးပေါ် ထောက်ပံ့မှု (၂၄/၇)\n🎯 နေ့စဉ် ကျန်းမာရေး လှုပ်ရှားမှုများ\n\nဘာကို ပထမ ရှာဖွေချင်ပါသလဲ?",
        id: "🎉 Selamat datang! Profil Anda siap.\n\nSaya dapat membantu dengan:\n🧠 Penilaian kesehatan mental\n📚 Sumber daya kesehatan\n👥 Grup dukungan sebaya\n🆘 Dukungan krisis (24/7)\n🎯 Aktivitas kesehatan harian\n\nApa yang ingin Anda jelajahi terlebih dahulu?"
      },
      // Basic navigation texts
      get_started: {
        en: "✅ Get Started",
        zh: "✅ 开始",
        bn: "✅ শুরু করুন",
        ta: "✅ தொடங்கு",
        my: "✅ စတင်ပါ",
        id: "✅ Mulai"
      },
      learn_more: {
        en: "📖 Learn More",
        zh: "📖 了解更多",
        bn: "📖 আরও জানুন",
        ta: "📖 மேலும் அறிய",
        my: "📖 ပိုမိုလေ့လာပါ",
        id: "📖 Pelajari Lebih Lanjut"
      },
      change_language: {
        en: "🌍 Change Language",
        zh: "🌍 更改语言",
        bn: "🌍 ভাষা পরিবর্তন",
        ta: "🌍 மोलியৈ மட்டும",
        my: "🌍 ဘာသာစကားပြောင်းပါ",
        id: "🌍 Ubah Bahasa"
      },
      ready_to_start: {
        en: "🚀 Ready to Start",
        zh: "🚀 准备开始",
        bn: "🚀 শুরু করতে প্রস্তুত",
        ta: "🚀 தொடங்க தயார்",
        my: "🚀 စတင်ရန် အဆင်သင့်",
        id: "🚀 Siap Memulai"
      },
      privacy_details: {
        en: "🔍 Privacy Details",
        zh: "🔍 隐私详情",
        bn: "🔍 গোপনীয়তার বিশদ",
        ta: "🔍 தனியுரிமை விவரங்கள்",
        my: "🔍 ကိုယ်ရေးကာယရေး အသေးစိတ်",
        id: "🔍 Detail Privasi"
      },
      agree_and_continue: {
        en: "✅ I Agree & Continue",
        zh: "✅ 我同意并继续",
        bn: "✅ আমি সম্মত এবং এগিয়ে যাই",
        ta: "✅ நான் ஒப்புக்கொள்கிறேன் & தொடர்கிறேன்",
        my: "✅ သဘောတူပြီး ဆက်လုပ်ပါမယ်",
        id: "✅ Saya Setuju & Lanjutkan"
      },
      read_privacy_policy: {
        en: "📋 Read Privacy Policy",
        zh: "📋 阅读隐私政策",
        bn: "📋 গোপনীয়তা নীতি পড়ুন",
        ta: "📋 தனியுரிமைக் கொள்கையைப் படியுங்கள்",
        my: "📋 ကိုယ်ရေးကာယရေး မူဝါဒ ဖတ်ပါ",
        id: "📋 Baca Kebijakan Privasi"
      },
      decline_consent: {
        en: "❌ Decline",
        zh: "❌ 拒绝",
        bn: "❌ প্রত্যাখ্যান",
        ta: "❌ மறுக்கிறேன்",
        my: "❌ ငြင်းပယ်ပါတယ်",
        id: "❌ Tolak"
      },
      consent_declined_info: {
        en: "We understand. You can still access basic wellness information anonymously. Would you like to reconsider or exit for now?",
        zh: "我们理解。您仍然可以匿名访问基本的健康信息。您想重新考虑还是暂时退出？",
        bn: "আমরা বুঝতে পারি। আপনি এখনও বেনামে বেসিক সুস্থতার তথ্য অ্যাক্সেস করতে পারেন। আপনি কি আবার বিবেচনা করবেন নাকি এখনকার জন্য বের হবেন?",
        ta: "நாங்கல் புரிந்துகொள்கிறோம். நீங்களும் இன்னும் அனாமதேயமாக அடிப்படை நலத்திட்ட தகவல்களை அணுகலாம். நீங்கள் மறுபரிசீலனை செய்ய விரும்புகிறீர்களா அல்லது இப்போது வெளியேற விரும்புகிறீர்களா?",
        my: "ကျွန်ုပ်တို့နားလည်ပါသည်။ သင်သည် အမည်မဖော်ဘဲ အခြေခံကျန်းမာရေး အချက်အလက်များကို ဝင်ရောက်ကြည့်ရှုနိုင်ပါသည်။ သင်သည် ထပ်မံစဉ်းစားလိုပါသလား သို့မဟုတ် ယခုအခါ ထွက်ခွာလိုပါသလား?",
        id: "Kami memahami. Anda masih dapat mengakses informasi kesehatan dasar secara anonim. Apakah Anda ingin mempertimbangkan kembali atau keluar untuk sementara?"
      },
      reconsider_consent: {
        en: "🤔 Reconsider",
        zh: "🤔 重新考虑",
        bn: "🤔 আবার বিবেচনা করুন",
        ta: "🤔 மறுபரிசீலனை செய்க",
        my: "🤔 ပြန်လည်စဉ်းစားပါ",
        id: "🤔 Pertimbangkan Lagi"
      },
      exit_onboarding: {
        en: "🚪 Exit",
        zh: "🚪 退出",
        bn: "🚪 বের হন",
        ta: "🚪 வெளியேறு",
        my: "🚪 ထွက်ခွာပါ",
        id: "🚪 Keluar"
      },
      agree_after_reading: {
        en: "✅ Agree After Reading",
        zh: "✅ 阅读后同意",
        bn: "✅ পড়ার পর সম্মত",
        ta: "✅ படித்த பிறகு ஒப்புக்கொள்",
        my: "✅ ဖတ်ပြီးနောက် သဘောတူပါ",
        id: "✅ Setuju Setelah Membaca"
      },
      privacy_policy_full: {
        en: "📋 SATA Privacy Policy\n\nWe collect and process your data with the highest standards:\n\n• Anonymous identification only\n• End-to-end encryption\n• PDPA compliance\n• No sharing with third parties\n• You control your data\n• Right to data deletion\n\nYour mental health data stays secure and private.",
        zh: "📋 SATA隐私政策\n\n我们以最高标准收集和处理您的数据：\n\n• 仅匿名身份识别\n• 端到端加密\n• PDPA合规\n• 不与第三方共享\n• 您控制您的数据\n• 数据删除权\n\n您的心理健康数据保持安全和私密。",
        bn: "📋 SATA গোপনীয়তা নীতি\n\nআমরা সর্বোচ্চ মান দিয়ে আপনার ডেটা সংগ্রহ ও প্রক্রিয়া করি:\n\n• শুধুমাত্র বেনামী পরিচয়\n• এন্ড-টু-এন্ড এনক্রিপশন\n• PDPA সম্মতি\n• তৃতীয় পক্ষের সাথে ভাগাভাগি নেই\n• আপনি আপনার ডেটা নিয়ন্ত্রণ করেন\n• ডেটা মুছে ফেলার অধিকার\n\nআপনার মানসিক স্বাস্থ্যের ডেটা নিরাপদ ও ব্যক্তিগত থাকে।",
        ta: "📋 SATA தனியுரிமைக் கொள்கை\n\nநாங்கள் உங்கள் தரவுகளை மிக உயர்ந்த தரத்துடன் சேகரிக்கவும், செயலாக்கவும் செய்கிறோம்:\n\n• வெறும் அனாமத அடையாளம்\n• முடுக்கம் முதல் முடுக்கம் குறியாக்கம்\n• PDPA இணக்கம்\n• மூன்றாம் தரப்புடன் பகிர்வு இல்லை\n• நீங்கள் உங்கள் தரவுகளை கட்டுப்படுத்துகிறீர்கள்\n• தரவுகளை நீக்கும் உரிமை\n\nஉங்கள் மன ஆரோக்கிய தரவுகள் பாதுகாப்பாகவும் தனிப்பட்டதாகவும் இருக்கும்.",
        my: "📋 SATA ကိုယ်ရေးကာယရေး မူဝါဒ\n\nကျွန်ုပ်တို့က သင့်ရဲ့ ကိုယ်ရေးကာယရေးနှင့် စိတ်ကျန်းမာရေးကို ဦးစားပေးပါတယ်:\n\n• စကားပြောဆိုမှုအားလုံး အမည်မဖော်ပါ\n• ဒေတာကို ကုဒ်ဝှက်ပြီး PDPA-နှင့်ကိုက်ညီပါတယ်\n• ဘယ်လို အချက်အလက်တွေ မျှဝေမယ်ဆိုတာ သင်က ထိန်းချုပ်နိုင်ပါတယ်\n• ၂၄/၇ ပရော်ဖက်ရှင်နယ် အရေးပေါ် ထောက်ပံ့မှု\n• ရွှေ့ပြောင်းလုပ်သားများအတွက် ပြင်ဆင်ထားသော အရင်းအမြစ်များ",
        id: "📋 Kebijakan Privasi SATA\n\nKami mengumpulkan dan memproses data Anda dengan standar tertinggi:\n\n• Hanya identifikasi anonim\n• Enkripsi ujung ke ujung\n• Kepatuhan PDPA\n• Tidak berbagi dengan pihak ketiga\n• Anda mengontrol data Anda\n• Hak penghapusan data\n\nData kesehatan mental Anda tetap aman dan pribadi."
      },
      // Demographic options
      migrant_worker: {
        en: "👷 Migrant Worker",
        zh: "👷 外籍工人",
        bn: "👷 প্রবাসী শ্রমিক",
        ta: "👷 புலம்காரர்",
        my: "👷 ရွှေ့ပြောင်းလုပ်သား",
        id: "👷 Pekerja Migran"
      },
      local_resident: {
        en: "🏠 Local Resident",
        zh: "🏠 本地居民",
        bn: "🏠 স্থানীয় বাসিন্দা",
        ta: "🏠 உள்ளூர் குடியிருப்பாளர்",
        my: "🏠 ဒေသခံ နေထိုင်သူ",
        id: "🏠 Penduduk Lokal"
      },
      international_student: {
        en: "🎓 International Student",
        zh: "🎓 国际学生",
        bn: "🎓 আন্তর্জাতিক শিক্ষার্থী",
        ta: "🎓 சர்வதேச மாணவர்",
        my: "🎓 နိုင်ငံတကာ ကျောင်းသား",
        id: "🎓 Mahasiswa Internasional"
      },
      prefer_not_say: {
        en: "🤐 Prefer not to say",
        zh: "🤐 不想说",
        bn: "🤐 বলতে পছন্দ করি না",
        ta: "🤐 சொல்ல விரும்பவில்லை",
        my: "🤐 မပြောချင်ပါ",
        id: "🤐 Lebih baik tidak mengatakan"
      },
      // Mental health areas
      stress_anxiety: {
        en: "😰 Stress & Anxiety",
        zh: "😰 压力和焦虑",
        bn: "😰 চাপ এবং উদ্বেগ",
        ta: "😰 மன அழுத்தம் & கவலை",
        my: "😰 စိတ်ဖိစီးမှုနှင့် စိုးရိမ်မှု",
        id: "😰 Stres & Kecemasan"
      },
      depression_sadness: {
        en: "😢 Depression & Sadness",
        zh: "😢 抑郁和悲伤",
        bn: "😢 বিষণ্নতা এবং দুঃখ",
        ta: "😢 மனச்சோர்வு & சோகம்",
        my: "😢 စိတ်ဓာတ်ကျခြင်းနှင့် ဝမ်းနည်းခြင်း",
        id: "😢 Depresi & Kesedihan"
      },
      work_life_balance: {
        en: "⚖️ Work-Life Balance",
        zh: "⚖️ 工作生活平衡",
        bn: "⚖️ কাজ-জীবনের ভারসাম্য",
        ta: "⚖️ வேலை-வாழ்க்கை சமநிலை",
        my: "⚖️ အလုပ်-ဘဝ ဟန်ချက်",
        id: "⚖️ Keseimbangan Kerja-Hidup"
      },
      social_isolation: {
        en: "👥 Social Isolation",
        zh: "👥 社交孤立",
        bn: "👥 সামাজিক বিচ্ছিন্নতা",
        ta: "👥 சமூக தனிமை",
        my: "👥 လူမှုရေး ထီးကွဲခြင်း",
        id: "👥 Isolasi Sosial"
      },
      general_wellness: {
        en: "🌟 General Wellness",
        zh: "🌟 一般健康",
        bn: "🌟 সাধারণ সুস্থতা",
        ta: "🌟 பொது நல்வாழ்வு",
        my: "🌟 ယေဘုယျ ကျန်းမာရေး",
        id: "🌟 Kesehatan Umum"
      },
      // Preference setup options
      enable_daily_checkins: {
        en: "📅 Enable Daily Check-ins",
        zh: "📅 启用每日签到",
        bn: "📅 দৈনিক চেক-ইন সক্রিয় করুন",
        ta: "📅 தினசரி சோதனைகளை இயக்கு",
        my: "📅 နေ့စဉ် စစ်ဆေးမှုများ ဖွင့်ပါ",
        id: "📅 Aktifkan Check-in Harian"
      },
      join_peer_groups: {
        en: "👥 Join Peer Groups",
        zh: "👥 加入同伴小组",
        bn: "👥 সমবয়সী গ্রুপে যোগ দিন",
        ta: "👥 சமூக தனிமை",
        my: "👥 လူမှုရေး ထီးကွဲခြင်း",
        id: "👥 Isolasi Sosial"
      },
      skip_preferences: {
        en: "⏭️ Skip for Now",
        zh: "⏭️ 暂时跳过",
        bn: "⏭️ এখন এড়িয়ে যান",
        ta: "⏭️ இப்போது தவிர்",
        my: "⏭️ ယခု ခံ့ပါ",
        id: "⏭️ Lewati Sekarang"
      },
      // Final onboarding options
      start_phq4: {
        en: "🧠 Take Mental Health Assessment",
        zh: "🧠 进行心理健康评估",
        bn: "🧠 মানসিক স্বাস্থ্য মূল্যায়ন নিন",
        ta: "🧠 மன நல மதிப்பீட்டை எடு",
        my: "🧠 စိတ်ကျန်းမာရေး အကဲဖြတ်မှု ယူပါ",
        id: "🧠 Ikuti Penilaian Kesehatan Mental"
      },
      browse_resources: {
        en: "📚 Browse Resources",
        zh: "📚 浏览资源",
        bn: "📚 সংস্থান ব্রাউজ করুন",
        ta: "📚 வளங்களை உலாவு",
        my: "📚 အရင်းအမြစ်များ ကြည့်ရှုပါ",
        id: "📚 Jelajahi Sumber Daya"
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