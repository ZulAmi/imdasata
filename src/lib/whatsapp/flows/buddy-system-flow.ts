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

export class BuddySystemFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.showBuddySystemMenu(session);
      case 1:
        return await this.handleMenuSelection(text, session);
      case 2:
        return await this.processBuddyMatching(text, session);
      case 3:
        return await this.confirmBuddyPairing(text, session);
      case 4:
        return await this.initiateBuddyCheckIn(text, session);
      case 5:
        return await this.processBuddyCheckInResponse(text, session);
      default:
        return await this.showBuddySystemMenu(session);
    }
  }

  private async showBuddySystemMenu(session: UserSession): Promise<FlowResponse> {
    // Check if user already has a buddy
    const existingBuddyship = await prisma.userInteraction.findFirst({
      where: {
        userId: session.userId,
        interactionType: 'BUDDY_PAIRED',
        metadata: {
          path: ['status'],
          equals: 'active'
        }
      }
    });

    if (existingBuddyship) {
      return await this.showExistingBuddyMenu(session, existingBuddyship);
    } else {
      return await this.showBuddyMatchingMenu(session);
    }
  }

  private async showExistingBuddyMenu(session: UserSession, buddyship: any): Promise<FlowResponse> {
    const buddyId = (buddyship.metadata as any)?.buddyId;
    const buddyNickname = (buddyship.metadata as any)?.buddyNickname || 'Your Buddy';

    return {
      message: this.getLocalizedText('existing_buddy_menu', session.language)
        .replace('{buddyName}', buddyNickname),
      buttons: [
        { id: 'check_in_buddy', title: this.getLocalizedText('check_in_with_buddy', session.language) },
        { id: 'buddy_status', title: this.getLocalizedText('buddy_status', session.language) },
        { id: 'buddy_activities', title: this.getLocalizedText('buddy_activities', session.language) },
        { id: 'end_partnership', title: this.getLocalizedText('end_buddy_partnership', session.language) }
      ],
      nextStep: 1
    };
  }

  private async showBuddyMatchingMenu(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_system_intro', session.language),
      buttons: [
        { id: 'find_buddy', title: this.getLocalizedText('find_buddy', session.language) },
        { id: 'how_it_works', title: this.getLocalizedText('how_buddy_works', session.language) },
        { id: 'buddy_benefits', title: this.getLocalizedText('buddy_benefits', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextStep: 1
    };
  }

  private async handleMenuSelection(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('find') || lowerText.includes('match')) {
      return await this.initiateBuddyMatching(session);
    } else if (lowerText.includes('check') || lowerText.includes('buddy')) {
      return await this.showBuddyCheckInOptions(session);
    } else if (lowerText.includes('status')) {
      return await this.showBuddyStatus(session);
    } else if (lowerText.includes('activities')) {
      return await this.showBuddyActivities(session);
    } else if (lowerText.includes('how') || lowerText.includes('works')) {
      return await this.explainBuddySystem(session);
    } else if (lowerText.includes('benefits')) {
      return await this.showBuddyBenefits(session);
    } else if (lowerText.includes('end') || lowerText.includes('stop')) {
      return await this.initiateBuddyBreakup(session);
    } else {
      return await this.initiateBuddyMatching(session);
    }
  }

  private async initiateBuddyMatching(session: UserSession): Promise<FlowResponse> {
    // Find potential buddies based on criteria
    const potentialBuddies = await this.findPotentialBuddies(session);

    if (potentialBuddies.length === 0) {
      return {
        message: this.getLocalizedText('no_buddies_available', session.language),
        buttons: [
          { id: 'join_waitlist', title: this.getLocalizedText('join_buddy_waitlist', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    // Store potential buddies in context
    session.context.potentialBuddies = potentialBuddies;

    return {
      message: this.getLocalizedText('buddy_matching_preferences', session.language),
      buttons: [
        { id: 'similar_timezone', title: this.getLocalizedText('similar_timezone', session.language) },
        { id: 'similar_language', title: this.getLocalizedText('similar_language', session.language) },
        { id: 'similar_goals', title: this.getLocalizedText('similar_goals', session.language) },
        { id: 'any_match', title: this.getLocalizedText('any_suitable_match', session.language) }
      ],
      nextStep: 2
    };
  }

  private async processBuddyMatching(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    const potentialBuddies = session.context.potentialBuddies || [];

    let filteredBuddies = potentialBuddies;

    if (lowerText.includes('timezone')) {
      filteredBuddies = this.filterByTimezone(potentialBuddies, session);
    } else if (lowerText.includes('language')) {
      filteredBuddies = this.filterByLanguage(potentialBuddies, session);
    } else if (lowerText.includes('goals')) {
      filteredBuddies = this.filterByGoals(potentialBuddies, session);
    }

    if (filteredBuddies.length === 0) {
      return {
        message: this.getLocalizedText('no_matches_found', session.language),
        buttons: [
          { id: 'broaden_search', title: this.getLocalizedText('broaden_search', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    // Select best match
    const bestMatch = this.selectBestMatch(filteredBuddies, session);
    session.context.selectedBuddy = bestMatch;

    return await this.presentBuddyMatch(bestMatch, session);
  }

  private async presentBuddyMatch(buddy: any, session: UserSession): Promise<FlowResponse> {
    const buddyProfile = await this.generateBuddyProfile(buddy, session);

    return {
      message: this.getLocalizedText('buddy_match_found', session.language) + '\n\n' + buddyProfile,
      buttons: [
        { id: 'accept_buddy', title: this.getLocalizedText('accept_buddy_match', session.language) },
        { id: 'see_another', title: this.getLocalizedText('see_another_match', session.language) },
        { id: 'decline_match', title: this.getLocalizedText('decline_match', session.language) }
      ],
      nextStep: 3
    };
  }

  private async confirmBuddyPairing(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('accept') || lowerText.includes('yes')) {
      return await this.createBuddyPairing(session);
    } else if (lowerText.includes('another') || lowerText.includes('different')) {
      return await this.processBuddyMatching('any_match', session);
    } else {
      return await this.initiateBuddyMatching(session);
    }
  }

  private async createBuddyPairing(session: UserSession): Promise<FlowResponse> {
    const selectedBuddy = session.context.selectedBuddy;
    const pairingId = `buddy_${session.userId}_${selectedBuddy.userId}_${Date.now()}`;

    // Create buddy pairing for both users
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'BUDDY_PAIRED',
        entityType: 'buddy_system',
        entityId: pairingId,
        metadata: {
          buddyId: selectedBuddy.userId,
          buddyNickname: selectedBuddy.nickname,
          pairingDate: new Date(),
          status: 'active',
          language: session.language
        }
      }
    });

    await prisma.userInteraction.create({
      data: {
        userId: selectedBuddy.userId,
        interactionType: 'BUDDY_PAIRED',
        entityType: 'buddy_system',
        entityId: pairingId,
        metadata: {
          buddyId: session.userId,
          buddyNickname: `User_${session.userId.slice(-4)}`,
          pairingDate: new Date(),
          status: 'active',
          language: selectedBuddy.language || session.language
        }
      }
    });

    // Award points for buddy pairing
    await this.awardBuddyPoints(session.userId, 'pairing');
    await this.awardBuddyPoints(selectedBuddy.userId, 'pairing');

    // Send notification to the buddy (in a real implementation)
    // await this.notifyBuddyOfPairing(selectedBuddy, session);

    return {
      message: this.getLocalizedText('buddy_pairing_success', session.language)
        .replace('{buddyName}', selectedBuddy.nickname),
      buttons: [
        { id: 'first_checkin', title: this.getLocalizedText('send_first_checkin', session.language) },
        { id: 'buddy_guidelines', title: this.getLocalizedText('view_buddy_guidelines', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async showBuddyCheckInOptions(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_checkin_options', session.language),
      buttons: [
        { id: 'quick_checkin', title: this.getLocalizedText('quick_checkin', session.language) },
        { id: 'detailed_checkin', title: this.getLocalizedText('detailed_checkin', session.language) },
        { id: 'custom_message', title: this.getLocalizedText('custom_message', session.language) },
        { id: 'check_buddy_status', title: this.getLocalizedText('check_buddy_status', session.language) }
      ],
      nextStep: 4
    };
  }

  private async initiateBuddyCheckIn(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('quick')) {
      return await this.processQuickCheckIn(session);
    } else if (lowerText.includes('detailed')) {
      return await this.processDetailedCheckIn(session);
    } else if (lowerText.includes('custom')) {
      return {
        message: this.getLocalizedText('custom_message_prompt', session.language),
        nextStep: 5
      };
    } else if (lowerText.includes('status')) {
      return await this.showBuddyStatus(session);
    } else {
      return await this.processQuickCheckIn(session);
    }
  }

  private async processQuickCheckIn(session: UserSession): Promise<FlowResponse> {
    // Get current buddy
    const buddyship = await prisma.userInteraction.findFirst({
      where: {
        userId: session.userId,
        interactionType: 'BUDDY_PAIRED',
        metadata: {
          path: ['status'],
          equals: 'active'
        }
      }
    });

    if (!buddyship) {
      return {
        message: this.getLocalizedText('no_active_buddy', session.language),
        shouldEndFlow: true
      };
    }

    const buddyId = (buddyship.metadata as any)?.buddyId;
    
    // Create check-in interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'BUDDY_CHECKIN',
        entityType: 'buddy_system',
        entityId: buddyship.entityId || '',
        metadata: {
          checkInType: 'quick',
          buddyId: buddyId,
          message: this.getLocalizedText('quick_checkin_message', session.language),
          timestamp: new Date()
        }
      }
    });

    // Award points
    await this.awardBuddyPoints(session.userId, 'checkin');

    return {
      message: this.getLocalizedText('quick_checkin_sent', session.language),
      buttons: [
        { id: 'send_another', title: this.getLocalizedText('send_another_message', session.language) },
        { id: 'view_buddy_response', title: this.getLocalizedText('view_buddy_responses', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async processDetailedCheckIn(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('detailed_checkin_prompt', session.language),
      nextStep: 5
    };
  }

  private async processBuddyCheckInResponse(text: string, session: UserSession): Promise<FlowResponse> {
    // Get current buddy
    const buddyship = await prisma.userInteraction.findFirst({
      where: {
        userId: session.userId,
        interactionType: 'BUDDY_PAIRED',
        metadata: {
          path: ['status'],
          equals: 'active'
        }
      }
    });

    if (!buddyship) {
      return {
        message: this.getLocalizedText('no_active_buddy', session.language),
        shouldEndFlow: true
      };
    }

    const buddyId = (buddyship.metadata as any)?.buddyId;
    
    // Create detailed check-in interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'BUDDY_CHECKIN',
        entityType: 'buddy_system',
        entityId: buddyship.entityId || '',
        metadata: {
          checkInType: 'detailed',
          buddyId: buddyId,
          message: text,
          timestamp: new Date()
        }
      }
    });

    // Award points
    await this.awardBuddyPoints(session.userId, 'detailed_checkin');

    return {
      message: this.getLocalizedText('detailed_checkin_sent', session.language),
      buttons: [
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async findPotentialBuddies(session: UserSession): Promise<any[]> {
    // Find users who are also looking for buddies or could be good matches
    // This is a simplified implementation
    const recentActiveUsers = await prisma.userInteraction.findMany({
      where: {
        userId: { not: session.userId },
        interactionType: { in: ['DAILY_CHECKIN', 'ASSESSMENT_COMPLETED', 'RESOURCE_VIEWED'] },
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      distinct: ['userId'],
      take: 10
    });

    // Filter out users who already have buddies
    const usersWithBuddies = await prisma.userInteraction.findMany({
      where: {
        interactionType: 'BUDDY_PAIRED',
        metadata: {
          path: ['status'],
          equals: 'active'
        }
      },
      select: { userId: true }
    });

    const excludeIds = usersWithBuddies.map(u => u.userId);
    
    return recentActiveUsers
      .filter(user => !excludeIds.includes(user.userId))
      .map(user => ({
        userId: user.userId,
        nickname: `Buddy_${user.userId.slice(-4)}`,
        language: session.language, // Simplified - would get from user profile
        lastActive: user.timestamp,
        compatibility: Math.random() * 100 // Simplified compatibility score
      }));
  }

  private filterByTimezone(buddies: any[], session: UserSession): any[] {
    // Simplified timezone filtering
    return buddies.filter(buddy => buddy.compatibility > 70);
  }

  private filterByLanguage(buddies: any[], session: UserSession): any[] {
    return buddies.filter(buddy => buddy.language === session.language);
  }

  private filterByGoals(buddies: any[], session: UserSession): any[] {
    // Simplified goals filtering
    return buddies.filter(buddy => buddy.compatibility > 60);
  }

  private selectBestMatch(buddies: any[], session: UserSession): any {
    return buddies.sort((a, b) => b.compatibility - a.compatibility)[0];
  }

  private async generateBuddyProfile(buddy: any, session: UserSession): Promise<string> {
    return this.getLocalizedText('buddy_profile_template', session.language)
      .replace('{nickname}', buddy.nickname)
      .replace('{compatibility}', Math.round(buddy.compatibility).toString())
      .replace('{lastActive}', buddy.lastActive.toLocaleDateString());
  }

  private async showBuddyStatus(session: UserSession): Promise<FlowResponse> {
    // Get recent buddy interactions
    const recentInteractions = await prisma.userInteraction.findMany({
      where: {
        userId: session.userId,
        interactionType: 'BUDDY_CHECKIN',
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    let statusMessage = this.getLocalizedText('buddy_status_summary', session.language);
    statusMessage += `\n\n📊 Recent Check-ins: ${recentInteractions.length}`;
    
    if (recentInteractions.length > 0) {
      statusMessage += `\n📅 Last Check-in: ${recentInteractions[0].timestamp.toLocaleDateString()}`;
    }

    return {
      message: statusMessage,
      buttons: [
        { id: 'buddy_activities', title: this.getLocalizedText('view_activities', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async showBuddyActivities(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_activities_info', session.language),
      buttons: [
        { id: 'challenge_buddy', title: this.getLocalizedText('start_wellness_challenge', session.language) },
        { id: 'share_resource', title: this.getLocalizedText('share_resource', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async awardBuddyPoints(userId: string, action: string): Promise<void> {
    const points = {
      'pairing': 50,
      'checkin': 15,
      'detailed_checkin': 25,
      'response': 10
    };

    const earnedPoints = points[action as keyof typeof points] || 10;

    await prisma.gamificationData.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: earnedPoints },
        updatedAt: new Date()
      },
      create: {
        userId,
        totalPoints: earnedPoints,
        level: 1,
        streak: 1
      }
    });
  }

  private async explainBuddySystem(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_system_explanation', session.language),
      buttons: [
        { id: 'find_buddy', title: this.getLocalizedText('find_buddy', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async showBuddyBenefits(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('buddy_benefits_explanation', session.language),
      buttons: [
        { id: 'find_buddy', title: this.getLocalizedText('find_buddy', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async initiateBuddyBreakup(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('confirm_end_partnership', session.language),
      buttons: [
        { id: 'confirm_end', title: this.getLocalizedText('yes_end_partnership', session.language) },
        { id: 'cancel_end', title: this.getLocalizedText('no_keep_buddy', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      buddy_system_intro: {
        en: "🤝 **Buddy System**\n\nGet paired with a wellness buddy for mutual support and accountability! Your buddy will be someone who understands your journey and can provide encouragement when you need it most.",
        zh: "🤝 **伙伴系统**\n\n与健康伙伴配对，获得相互支持和责任感！您的伙伴将是理解您旅程并能在您最需要时提供鼓励的人。",
        bn: "🤝 **বন্ধু সিস্টেম**\n\nপারস্পরিক সহায়তা এবং দায়বদ্ধতার জন্য একজন সুস্থতার বন্ধুর সাথে জোড়া হন! আপনার বন্ধু এমন কেউ হবেন যিনি আপনার যাত্রা বোঝেন এবং আপনার সবচেয়ে প্রয়োজনের সময় উৎসাহ প্রদান করতে পারেন।",
        ta: "🤝 **நண்பர் அமைப்பு**\n\nபரஸ்பர ஆதரவு மற்றும் பொறுப்புணர்வுக்காக ஒரு நல்வாழ்வு நண்பருடன் இணைந்துகொள்ளுங்கள்! உங்கள் நண்பர் உங்கள் பயணத்தைப் புரிந்துகொண்டு, உங்களுக்கு மிகவும் தேவைப்படும் போது ஊக்கம் அளிக்கக்கூடிய ஒருவராக இருப்பார்.",
        my: "🤝 **မိတ်ဆွေ စနစ်**\n\nအပြန်အလှန် ထောက်ပံ့မှုနှင့် တာဝန်ခံမှုအတွက် ကျန်းမာရေး မိတ်ဆွေတစ်ယောက်နှင့် တွဲဖက်ပါ! သင့်မိတ်ဆွေသည် သင့်ခရီးကို နားလည်ပြီး သင် အလွန်လိုအပ်သည့်အချိန်တွင် အားပေးမှု ပေးနိုင်သူ ဖြစ်မည်ဖြစ်သည်။",
        id: "🤝 **Sistem Teman**\n\nBerpasangan dengan teman kesehatan untuk dukungan dan akuntabilitas bersama! Teman Anda akan menjadi seseorang yang memahami perjalanan Anda dan dapat memberikan dorongan saat Anda paling membutuhkannya."
      },
      find_buddy: {
        en: "🔍 Find a Buddy",
        zh: "🔍 寻找伙伴",
        bn: "🔍 একটি বন্ধু খুঁজুন",
        ta: "🔍 நண்பரை கண்டுபிடி",
        my: "🔍 မိတ်ဆွေ ရှာပါ",
        id: "🔍 Cari Teman"
      },
      buddy_match_found: {
        en: "🎯 **Buddy Match Found!**\n\nWe found a great potential buddy for you:",
        zh: "🎯 **找到伙伴匹配！**\n\n我们为您找到了一个很好的潜在伙伴：",
        bn: "🎯 **বন্ধু ম্যাচ পাওয়া গেছে!**\n\nআমরা আপনার জন্য একটি দুর্দান্ত সম্ভাব্য বন্ধু খুঁজে পেয়েছি:",
        ta: "🎯 **நண்பர் பொருத்தம் கண்டறியப்பட்டது!**\n\nஉங்களுக்காக ஒரு சிறந்த சாத்தியமான நண்பரை நாங்கள் கண்டுபிடித்துள்ளோம்:",
        my: "🎯 **မိတ်ဆွေ တွေ့ရှိခဲ့သည်!**\n\nသင့်အတွက် အလွန်ကောင်းသော ဖြစ်နိုင်ချေရှိသော မိတ်ဆွေတစ်ယောက်ကို ကျွန်ုပ်တို့ တွေ့ရှိခဲ့သည်:",
        id: "🎯 **Teman Cocok Ditemukan!**\n\nKami menemukan teman potensial yang bagus untuk Anda:"
      },
      buddy_profile_template: {
        en: "👤 **{nickname}**\n📊 Compatibility: {compatibility}%\n📅 Last Active: {lastActive}\n🌟 Ready to support your wellness journey!",
        zh: "👤 **{nickname}**\n📊 兼容性：{compatibility}%\n📅 最后活跃：{lastActive}\n🌟 准备支持您的健康之旅！",
        bn: "👤 **{nickname}**\n📊 সামঞ্জস্য: {compatibility}%\n📅 শেষ সক্রিয়: {lastActive}\n🌟 আপনার সুস্থতার যাত্রায় সহায়তা করতে প্রস্তুত!",
        ta: "👤 **{nickname}**\n📊 பொருத்தம்: {compatibility}%\n📅 கடைசி செயல்பாடு: {lastActive}\n🌟 உங்கள் நல்வாழ்வு பயணத்தை ஆதரிக்க தயார்!",
        my: "👤 **{nickname}**\n📊 လိုက်ဖက်မှု: {compatibility}%\n📅 နောက်ဆုံး တက်ကြွမှု: {lastActive}\n🌟 သင့်ကျန်းမာရေး ခရီးကို ထောက်ပံ့ရန် အသင့်ဖြစ်နေသည်!",
        id: "👤 **{nickname}**\n📊 Kompatibilitas: {compatibility}%\n📅 Terakhir Aktif: {lastActive}\n🌟 Siap mendukung perjalanan kesehatan Anda!"
      },
      accept_buddy_match: {
        en: "✅ Accept Match",
        zh: "✅ 接受匹配",
        bn: "✅ ম্যাচ গ্রহণ করুন",
        ta: "✅ பொருத்தத்தை ஏற்கவும்",
        my: "✅ တွဲချက်ကို လက်ခံပါ",
        id: "✅ Terima Pasangan"
      },
      buddy_pairing_success: {
        en: "🎉 **Buddy Pairing Successful!**\n\nYou're now paired with {buddyName}! You can start supporting each other on your wellness journeys.\n\n+50 wellness points earned! 🌟",
        zh: "🎉 **伙伴配对成功！**\n\n您现在与{buddyName}配对！您可以开始在健康之旅中相互支持。\n\n获得+50健康积分！🌟",
        bn: "🎉 **বন্ধু জোড়া সফল!**\n\nআপনি এখন {buddyName} এর সাথে জোড়া হয়েছেন! আপনি আপনার সুস্থতার যাত্রায় একে অপরকে সাহায্য করা শুরু করতে পারেন।\n\n+৫০ সুস্থতার পয়েন্ট অর্জিত! 🌟",
        ta: "🎉 **நண்பர் இணைத்தல் வெற்றிகரமாக!**\n\nநீங்கள் இப்போது {buddyName} உடன் இணைந்துள்ளீர்கள்! உங்கள் நல்வாழ்வு பயணங்களில் ஒருவருக்கொருவர் ஆதரவளிக்க ஆரம்பிக்கலாம்।\n\n+50 நல்வாழ்வு புள்ளிகள் பெற்றுள்ளீர்கள்! 🌟",
        my: "🎉 **မိတ်ဆွေ တွဲဖက်ခြင်း အောင်မြင်ခဲ့သည်!**\n\nသင်သည် ယခု {buddyName} နှင့် တွဲဖက်ထားပြီး ဖြစ်သည်! သင်တို့၏ ကျန်းမာရေး ခရီးများတွင် တစ်ယောက်ကိုတစ်ယောက် စတင်ထောက်ပံ့နိုင်ပါပြီ။\n\n+50 ကျန်းမာရေး အမှတ်များ ရရှိခဲ့သည်! 🌟",
        id: "🎉 **Pemasangan Teman Berhasil!**\n\nAnda sekarang dipasangkan dengan {buddyName}! Anda dapat mulai saling mendukung dalam perjalanan kesehatan Anda.\n\n+50 poin kesehatan diperoleh! 🌟"
      },
      check_in_with_buddy: {
        en: "💬 Check-in with Buddy",
        zh: "💬 与伙伴签到",
        bn: "💬 বন্ধুর সাথে চেক-ইন",
        ta: "💬 நண்பருடன் சோதனை",
        my: "💬 မိတ်ဆွေနှင့် စစ်ဆေးခြင်း",
        id: "💬 Check-in dengan Teman"
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
