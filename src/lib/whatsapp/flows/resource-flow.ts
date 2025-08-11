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

export class ResourceFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.showResourceCategories(session);
      case 1:
        return await this.handleCategorySelection(text, session);
      case 2:
        return await this.showSpecificResources(text, session);
      case 3:
        return await this.handleResourceAction(text, session);
      default:
        return await this.showResourceCategories(session);
    }
  }

  private async showResourceCategories(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('resource_categories_intro', session.language),
      buttons: [
        { id: 'stress_anxiety', title: this.getLocalizedText('stress_anxiety_resources', session.language) },
        { id: 'depression', title: this.getLocalizedText('depression_resources', session.language) },
        { id: 'work_life', title: this.getLocalizedText('work_life_resources', session.language) },
        { id: 'crisis_support', title: this.getLocalizedText('crisis_support', session.language) },
        { id: 'self_care', title: this.getLocalizedText('self_care_resources', session.language) },
        { id: 'professional_help', title: this.getLocalizedText('professional_help', session.language) }
      ],
      nextStep: 1
    };
  }

  private async handleCategorySelection(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    let category = '';
    
    if (lowerText.includes('stress') || lowerText.includes('anxiety') || lowerText.includes('焦虑') || lowerText.includes('উদ্বেগ')) {
      category = 'stress_anxiety';
    } else if (lowerText.includes('depression') || lowerText.includes('抑郁') || lowerText.includes('বিষণ্ণতা')) {
      category = 'depression';
    } else if (lowerText.includes('work') || lowerText.includes('life') || lowerText.includes('工作') || lowerText.includes('কাজ')) {
      category = 'work_life_balance';
    } else if (lowerText.includes('crisis') || lowerText.includes('emergency') || lowerText.includes('危机') || lowerText.includes('জরুরি')) {
      category = 'crisis';
    } else if (lowerText.includes('self') || lowerText.includes('care') || lowerText.includes('自我护理') || lowerText.includes('স্ব-যত্ন')) {
      category = 'self_care';
    } else if (lowerText.includes('professional') || lowerText.includes('counseling') || lowerText.includes('专业') || lowerText.includes('পেশাদার')) {
      category = 'counseling';
    } else {
      // Default to general wellness
      category = 'wellness';
    }

    return await this.fetchAndDisplayResources(category, session);
  }

  private async fetchAndDisplayResources(category: string, session: UserSession): Promise<FlowResponse> {
    // Fetch resources from database
    const resources = await prisma.mentalHealthResource.findMany({
      where: {
        category: category,
        isActive: true,
        languages: { has: session.language }
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' }
      ],
      take: 5
    });

    if (resources.length === 0) {
      return {
        message: this.getLocalizedText('no_resources_found', session.language),
        buttons: [
          { id: 'try_another_category', title: this.getLocalizedText('try_another_category', session.language) },
          { id: 'request_resource', title: this.getLocalizedText('request_specific_resource', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        nextFlow: 'idle',
        shouldEndFlow: true
      };
    }

    let resourcesMessage = this.getLocalizedText('available_resources', session.language) + '\n\n';
    
    resources.forEach((resource, index) => {
      const title = this.extractLocalizedField(resource.title, session.language);
      const description = this.extractLocalizedField(resource.description, session.language);
      const emoji = this.getCategoryEmoji(resource.category);
      
      resourcesMessage += `${emoji} ${index + 1}. **${title}**\n`;
      resourcesMessage += `${description.substring(0, 100)}${description.length > 100 ? '...' : ''}\n\n`;
    });

    // Log resource interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'RESOURCE_BROWSED',
        entityType: 'resource_category',
        entityId: category,
        metadata: {
          category,
          resourceCount: resources.length,
          timestamp: new Date().toISOString()
        }
      }
    });

    return {
      message: resourcesMessage,
      quickReplies: resources.map((_, index) => `${index + 1}. ${this.getLocalizedText('view_details', session.language)}`),
      buttons: [
        { id: 'save_all', title: this.getLocalizedText('save_all_resources', session.language) },
        { id: 'share_resource', title: this.getLocalizedText('share_with_friend', session.language) },
        { id: 'back_to_categories', title: this.getLocalizedText('back_to_categories', session.language) }
      ],
      nextStep: 2,
      context: { category, resources: resources.map(r => ({ id: r.id, title: r.title, category: r.category })) }
    };
  }

  private async showSpecificResources(text: string, session: UserSession): Promise<FlowResponse> {
    const match = text.match(/^(\d+)/);
    if (!match) {
      return {
        message: this.getLocalizedText('invalid_selection', session.language),
        quickReplies: session.context.resources?.map((_: any, index: number) => `${index + 1}. ${this.getLocalizedText('view_details', session.language)}`) || [],
        nextStep: 2
      };
    }

    const resourceIndex = parseInt(match[1]) - 1;
    const resourceId = session.context.resources?.[resourceIndex]?.id;

    if (!resourceId) {
      return {
        message: this.getLocalizedText('resource_not_found', session.language),
        buttons: [
          { id: 'back_to_list', title: this.getLocalizedText('back_to_list', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        nextStep: 1
      };
    }

    // Fetch detailed resource information
    const resource = await prisma.mentalHealthResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      return {
        message: this.getLocalizedText('resource_not_found', session.language),
        nextStep: 1
      };
    }

    // Create detailed resource message
    const title = this.extractLocalizedField(resource.title, session.language);
    const description = this.extractLocalizedField(resource.description, session.language);
    const contactInfo = resource.contactInfo as any;
    const availability = resource.availability as any;

    let detailMessage = `📋 **${title}**\n\n`;
    detailMessage += `${description}\n\n`;
    
    if (contactInfo) {
      detailMessage += `📞 **${this.getLocalizedText('contact_info', session.language)}:**\n`;
      if (contactInfo.phone) detailMessage += `Phone: ${contactInfo.phone}\n`;
      if (contactInfo.email) detailMessage += `Email: ${contactInfo.email}\n`;
      if (contactInfo.website) detailMessage += `Website: ${contactInfo.website}\n`;
      if (contactInfo.address) detailMessage += `Address: ${contactInfo.address}\n`;
      detailMessage += '\n';
    }

    if (availability) {
      detailMessage += `🕐 **${this.getLocalizedText('availability', session.language)}:**\n`;
      if (availability.hours) detailMessage += `Hours: ${availability.hours}\n`;
      if (availability.languages) detailMessage += `Languages: ${availability.languages.join(', ')}\n`;
      detailMessage += '\n';
    }

    if (resource.isFree) {
      detailMessage += `💰 ${this.getLocalizedText('free_service', session.language)}\n`;
    }

    if (resource.isEmergency) {
      detailMessage += `🚨 ${this.getLocalizedText('emergency_service', session.language)}\n`;
    }

    // Log resource view
    await prisma.resourceInteraction.create({
      data: {
        userId: session.userId,
        resourceId: resource.id,
        language: session.language
      }
    });

    return {
      message: detailMessage,
      buttons: [
        { id: 'save_resource', title: this.getLocalizedText('save_resource', session.language) },
        { id: 'share_resource', title: this.getLocalizedText('share_resource', session.language) },
        { id: 'get_directions', title: this.getLocalizedText('get_directions', session.language) },
        { id: 'back_to_list', title: this.getLocalizedText('back_to_list', session.language) }
      ],
      nextStep: 3,
      context: { ...session.context, selectedResource: resource }
    };
  }

  private async handleResourceAction(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    const resource = session.context.selectedResource;

    if (lowerText.includes('save')) {
      return await this.saveResource(resource, session);
    } else if (lowerText.includes('share')) {
      return await this.shareResource(resource, session);
    } else if (lowerText.includes('directions') || lowerText.includes('location')) {
      return await this.getDirections(resource, session);
    } else if (lowerText.includes('back')) {
      return await this.fetchAndDisplayResources(session.context.category, session);
    } else {
      return {
        message: this.getLocalizedText('what_would_you_like_to_do', session.language),
        buttons: [
          { id: 'save_resource', title: this.getLocalizedText('save_resource', session.language) },
          { id: 'share_resource', title: this.getLocalizedText('share_resource', session.language) },
          { id: 'back_to_list', title: this.getLocalizedText('back_to_list', session.language) }
        ],
        nextStep: 3
      };
    }
  }

  private async saveResource(resource: any, session: UserSession): Promise<FlowResponse> {
    // Save resource interaction
    await prisma.resourceInteraction.create({
      data: {
        userId: session.userId,
        resourceId: resource.id,
        language: session.language,
        helpful: true
      }
    });

    // Award points for saving resource
    await this.awardPoints(session.userId, 5);

    return {
      message: this.getLocalizedText('resource_saved', session.language),
      buttons: [
        { id: 'view_saved_resources', title: this.getLocalizedText('view_saved_resources', session.language) },
        { id: 'find_more_resources', title: this.getLocalizedText('find_more_resources', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: 'idle',
      shouldEndFlow: true
    };
  }

  private async shareResource(resource: any, session: UserSession): Promise<FlowResponse> {
    const title = this.extractLocalizedField(resource.title, session.language);
    const description = this.extractLocalizedField(resource.description, session.language);
    
    const shareMessage = `🤝 ${this.getLocalizedText('shared_resource_intro', session.language)}\n\n` +
      `📋 **${title}**\n${description}\n\n` +
      `${this.getLocalizedText('shared_via_sata', session.language)}`;

    // Log sharing action
    await prisma.resourceInteraction.create({
      data: {
        userId: session.userId,
        resourceId: resource.id,
        language: session.language
      }
    });

    return {
      message: shareMessage,
      buttons: [
        { id: 'share_another', title: this.getLocalizedText('share_another_resource', session.language) },
        { id: 'back_to_list', title: this.getLocalizedText('back_to_list', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: 'idle',
      shouldEndFlow: true
    };
  }

  private async getDirections(resource: any, session: UserSession): Promise<FlowResponse> {
    const contactInfo = resource.contactInfo as any;
    
    if (!contactInfo?.address) {
      return {
        message: this.getLocalizedText('no_address_available', session.language),
        buttons: [
          { id: 'contact_directly', title: this.getLocalizedText('contact_directly', session.language) },
          { id: 'back_to_resource', title: this.getLocalizedText('back_to_resource', session.language) }
        ],
        nextStep: 3
      };
    }

    // Create Google Maps link
    const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(contactInfo.address)}`;
    
    return {
      message: `🗺️ ${this.getLocalizedText('directions_info', session.language)}\n\n` +
        `📍 **${this.getLocalizedText('address', session.language)}:** ${contactInfo.address}\n\n` +
        `🔗 ${this.getLocalizedText('open_in_maps', session.language)}: ${mapsUrl}`,
      buttons: [
        { id: 'contact_resource', title: this.getLocalizedText('contact_resource', session.language) },
        { id: 'back_to_resource', title: this.getLocalizedText('back_to_resource', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: 'idle',
      shouldEndFlow: true
    };
  }

  private extractLocalizedField(field: any, language: string): string {
    if (!field || typeof field !== 'object') return '';
    return field[language] || field.en || 'Content not available';
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      stress_anxiety: '😰',
      depression: '😔',
      work_life_balance: '⚖️',
      crisis: '🚨',
      self_care: '🧘',
      counseling: '💬',
      wellness: '🌟',
      support_groups: '👥'
    };
    return emojiMap[category] || '📋';
  }

  private async awardPoints(userId: string, points: number): Promise<void> {
    await prisma.gamificationData.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: points },
        updatedAt: new Date()
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
    const texts: Record<string, Record<string, string>> = {
      resource_categories_intro: {
        en: "📚 Mental Health Resources\n\nI can help you find resources and support for various mental health topics. What area would you like to explore?",
        zh: "📚 心理健康资源\n\n我可以帮助您找到各种心理健康主题的资源和支持。您想探索哪个领域？",
        bn: "📚 মানসিক স্বাস্থ্য সংস্থান\n\nআমি আপনাকে বিভিন্ন মানসিক স্বাস্থ্য বিষয়ের জন্য সংস্থান এবং সহায়তা খুঁজে পেতে সাহায্য করতে পারি। আপনি কোন ক্ষেত্র অন্বেষণ করতে চান?",
        ta: "📚 மன நல வளங்கள்\n\nபல்வேறு மன நல தலைப்புகளுக்கான வளங்கள் மற்றும் ஆதரவைக் கண்டறிய நான் உங்களுக்கு உதவ முடியும். நீங்கள் எந்தப் பகுதியை ஆராய விரும்புகிறீர்கள்?",
        my: "📚 စိတ်ကျန်းမာရေး အရင်းအမြစ်များ\n\nစိတ်ကျန်းမာရေး ခေါင်းစဉ်အမျိုးမျိုးအတွက် အရင်းအမြစ်များနှင့် အကူအညီများ ရှာဖွေရာတွင် ကျွန်တော် သင့်ကို ကူညီနိုင်ပါတယ်။ ဘယ်နယ်ပယ်ကို လေ့လာချင်ပါသလဲ?",
        id: "📚 Sumber Daya Kesehatan Mental\n\nSaya dapat membantu Anda menemukan sumber daya dan dukungan untuk berbagai topik kesehatan mental. Area mana yang ingin Anda jelajahi?"
      },
      stress_anxiety_resources: {
        en: "😰 Stress & Anxiety",
        zh: "😰 压力与焦虑",
        bn: "😰 চাপ ও উদ্বেগ",
        ta: "😰 மன அழுத்தம் & கவலை",
        my: "😰 စိတ်ဖိစီးမှုနှင့် စိုးရိမ်မှု",
        id: "😰 Stres & Kecemasan"
      },
      depression_resources: {
        en: "😔 Depression Support",
        zh: "😔 抑郁症支持",
        bn: "😔 বিষণ্নতা সহায়তা",
        ta: "😔 மனச்சோர்வு ஆதரவு",
        my: "😔 စိတ်ဓာတ်ကျမှု အကူအညီ",
        id: "😔 Dukungan Depresi"
      },
      work_life_resources: {
        en: "⚖️ Work-Life Balance",
        zh: "⚖️ 工作生活平衡",
        bn: "⚖️ কাজ-জীবনের ভারসাম্য",
        ta: "⚖️ வேலை-வாழ்க்கை சமநிலை",
        my: "⚖️ အလုပ်-ဘဝ ဟန်ချက်",
        id: "⚖️ Keseimbangan Kerja-Hidup"
      },
      crisis_support: {
        en: "🚨 Crisis Support",
        zh: "🚨 危机支持",
        bn: "🚨 সংকট সহায়তা",
        ta: "🚨 நெருக்கடி ஆதரவு",
        my: "🚨 အကြပ်အတည်း အကူအညီ",
        id: "🚨 Dukungan Krisis"
      },
      self_care_resources: {
        en: "🧘 Self-Care & Wellness",
        zh: "🧘 自我护理与健康",
        bn: "🧘 স্ব-যত্ন ও সুস্থতা",
        ta: "🧘 சுய பராமரிப்பு & நல்வாழ்வு",
        my: "🧘 မိမိကိုယ်ကို ပြုစုခြင်းနှင့် ကျန်းမာရေး",
        id: "🧘 Perawatan Diri & Kesehatan"
      },
      professional_help: {
        en: "💬 Professional Counseling",
        zh: "💬 专业咨询",
        bn: "💬 পেশাদার পরামর্শ",
        ta: "💬 தொழில்முறை ஆலோசனை",
        my: "💬 ပရော်ဖက်ရှင်နယ် အကြံပေးခြင်း",
        id: "💬 Konseling Profesional"
      },
      available_resources: {
        en: "Here are the available resources:",
        zh: "以下是可用的资源：",
        bn: "এখানে উপলব্ধ সংস্থানগুলি রয়েছে:",
        ta: "இங்கே கிடைக்கும் வளங்கள்:",
        my: "ရရှိနိုင်သော အရင်းအမြစ်များ:",
        id: "Berikut adalah sumber daya yang tersedia:"
      },
      no_resources_found: {
        en: "🤔 No resources found for this category. Let me help you find alternatives or you can request specific resources.",
        zh: "🤔 未找到此类别的资源。让我帮您找到替代方案，或者您可以请求特定资源。",
        bn: "🤔 এই বিভাগের জন্য কোন সংস্থান পাওয়া যায়নি। আমি আপনাকে বিকল্প খুঁজে পেতে সাহায্য করি বা আপনি নির্দিষ্ট সংস্থানের জন্য অনুরোধ করতে পারেন।",
        ta: "🤔 இந்த வகைக்கான வளங்கள் எதுவும் கிடைக்கவில்லை. மாற்றுகளைக் கண்டறிய நான் உங்களுக்கு உதவுகிறேன் அல்லது நீங்கள் குறிப்பிட்ட வளங்களைக் கோரலாம்.",
        my: "🤔 ဒီအမျိုးအစားအတွက် အရင်းအမြစ်များ မတွေ့ရပါ။ အခြားရွေးချယ်စရာများ ရှာဖွေရာတွင် ကျွန်တော် သင့်ကို ကူညီပါမယ် သို့မဟုတ် သင် သတ်မှတ်ထားသော အရင်းအမြစ်များကို တောင်းဆိုနိုင်ပါတယ်။",
        id: "🤔 Tidak ada sumber daya yang ditemukan untuk kategori ini. Biarkan saya membantu Anda menemukan alternatif atau Anda dapat meminta sumber daya spesifik."
      },
      view_details: {
        en: "View Details",
        zh: "查看详情",
        bn: "বিস্তারিত দেখুন",
        ta: "விவரங்களைப் பார்க்கவும்",
        my: "အသေးစိတ် ကြည့်ရှုပါ",
        id: "Lihat Detail"
      },
      save_resource: {
        en: "💾 Save Resource",
        zh: "💾 保存资源",
        bn: "💾 সংস্থান সংরক্ষণ করুন",
        ta: "💾 வளத்தைச் சேமிக்கவும்",
        my: "💾 အရင်းအမြစ် သိမ်းဆည်းပါ",
        id: "💾 Simpan Sumber Daya"
      },
      share_resource: {
        en: "📤 Share Resource",
        zh: "📤 分享资源",
        bn: "📤 সংস্থান শেয়ার করুন",
        ta: "📤 வளத்தைப் பகிரவும்",
        my: "📤 အရင်းအမြစ် မျှဝေပါ",
        id: "📤 Bagikan Sumber Daya"
      },
      resource_saved: {
        en: "✅ Resource saved successfully! You've earned 5 wellness points.\n\nYou can access your saved resources anytime from the main menu.",
        zh: "✅ 资源保存成功！您获得了5个健康积分。\n\n您可以随时从主菜单访问已保存的资源。",
        bn: "✅ সংস্থান সফলভাবে সংরক্ষিত হয়েছে! আপনি 5টি সুস্থতার পয়েন্ট অর্জন করেছেন।\n\nআপনি প্রধান মেনু থেকে যে কোনো সময় আপনার সংরক্ষিত সংস্থানগুলি অ্যাক্সেস করতে পারেন।",
        ta: "✅ வளம் வெற்றிகரமாக சேமிக்கப்பட்டது! நீங்கள் 5 நல்வாழ்வு புள்ளிகளைப் பெற்றுள்ளீர்கள்.\n\nமுதன்மை மெனுவிலிருந்து எந்த நேரத்திலும் உங்கள் சேமிக்கப்பட்ட வளங்களை அணுகலாம்.",
        my: "✅ အရင်းအမြစ် အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ! သင် ကျန်းမာရေး အမှတ် 5 ရရှိခဲ့ပါတယ်။\n\nပင်မမီနူးမှ သင့်ရဲ့ သိမ်းဆည်းထားသော အရင်းအမြစ်များကို အချိန်မရွေး ဝင်ရောက်ကြည့်ရှုနိုင်ပါတယ်။",
        id: "✅ Sumber daya berhasil disimpan! Anda telah mendapatkan 5 poin kesehatan.\n\nAnda dapat mengakses sumber daya yang disimpan kapan saja dari menu utama."
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
