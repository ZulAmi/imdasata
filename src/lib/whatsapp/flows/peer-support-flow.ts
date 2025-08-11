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

export class PeerSupportFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.showPeerSupportMenu(session);
      case 1:
        return await this.handleGroupSelection(text, session);
      case 2:
        return await this.confirmGroupJoining(text, session);
      case 3:
        return await this.processGroupJoining(text, session);
      case 4:
        return await this.showGroupGuidelines(session);
      default:
        return await this.showPeerSupportMenu(session);
    }
  }

  private async showPeerSupportMenu(session: UserSession): Promise<FlowResponse> {
    // Check if user is already in groups
    const existingMemberships = await prisma.groupMembership.findMany({
      where: { 
        userId: session.userId,
        isActive: true 
      },
      include: { group: true }
    });

    let message = this.getLocalizedText('peer_support_intro', session.language);
    
    if (existingMemberships.length > 0) {
      message += '\n\n' + this.getLocalizedText('current_groups', session.language);
      existingMemberships.forEach((membership, index) => {
        message += `\n${index + 1}. ${membership.group.name} (${membership.group.language})`;
      });
    }

    return {
      message,
      buttons: [
        { id: 'join_group', title: this.getLocalizedText('join_new_group', session.language) },
        { id: 'view_groups', title: this.getLocalizedText('view_my_groups', session.language) },
        { id: 'group_chat', title: this.getLocalizedText('group_chat', session.language) },
        { id: 'leave_group', title: this.getLocalizedText('leave_group', session.language) }
      ],
      nextStep: 1
    };
  }

  private async handleGroupSelection(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('join') || lowerText.includes('new')) {
      return await this.showAvailableGroups(session);
    } else if (lowerText.includes('view') || lowerText.includes('my')) {
      return await this.showUserGroups(session);
    } else if (lowerText.includes('chat') || lowerText.includes('message')) {
      return await this.initiateGroupChat(session);
    } else if (lowerText.includes('leave')) {
      return await this.initiateGroupLeaving(session);
    } else {
      return await this.showAvailableGroups(session);
    }
  }

  private async showAvailableGroups(session: UserSession): Promise<FlowResponse> {
    // Find groups user isn't already in
    const userGroupIds = await prisma.groupMembership.findMany({
      where: { userId: session.userId, isActive: true },
      select: { groupId: true }
    });

    const excludeIds = userGroupIds.map(membership => membership.groupId);

    const availableGroups = await prisma.supportGroup.findMany({
      where: {
        isActive: true,
        language: session.language,
        id: { notIn: excludeIds }
      },
      include: {
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (availableGroups.length === 0) {
      return {
        message: this.getLocalizedText('no_available_groups', session.language),
        buttons: [
          { id: 'create_group', title: this.getLocalizedText('create_new_group', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    let message = this.getLocalizedText('available_groups', session.language) + '\n\n';
    
    availableGroups.forEach((group, index) => {
      const groupName = this.getLocalizedJsonValue(group.name, session.language);
      const groupDescription = this.getLocalizedJsonValue(group.description, session.language);
      
      message += `${index + 1}. **${groupName}**\n`;
      message += `   ${groupDescription}\n`;
      message += `   👥 ${group._count.memberships}/${group.maxMembers} members\n`;
      message += `   � Category: ${group.category}\n\n`;
    });

    // Store groups in context for selection
    session.context.availableGroups = availableGroups;

    return {
      message,
      quickReplies: availableGroups.map((group, index) => 
        `${index + 1}. ${this.getLocalizedJsonValue(group.name, session.language)}`
      ),
      nextStep: 2
    };
  }

  private async confirmGroupJoining(text: string, session: UserSession): Promise<FlowResponse> {
    const availableGroups = session.context.availableGroups || [];
    
    // Parse group selection
    const groupIndex = this.parseGroupSelection(text, availableGroups);
    
    if (groupIndex === -1) {
      return {
        message: this.getLocalizedText('invalid_group_selection', session.language),
        quickReplies: availableGroups.map((group: any, index: number) => `${index + 1}. ${group.name}`),
        nextStep: 2
      };
    }

    const selectedGroup = availableGroups[groupIndex];
    session.context.selectedGroup = selectedGroup;

    const groupName = this.getLocalizedJsonValue(selectedGroup.name, session.language);
    const groupDescription = this.getLocalizedJsonValue(selectedGroup.description, session.language);

    return {
      message: this.getLocalizedText('confirm_group_joining', session.language)
        .replace('{groupName}', groupName)
        .replace('{groupDescription}', groupDescription),
      buttons: [
        { id: 'confirm_join', title: this.getLocalizedText('yes_join_group', session.language) },
        { id: 'cancel_join', title: this.getLocalizedText('no_go_back', session.language) }
      ],
      nextStep: 3
    };
  }

  private async processGroupJoining(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('confirm') || lowerText.includes('yes') || lowerText.includes('join')) {
      const selectedGroup = session.context.selectedGroup;
      
      // Create group membership
      await prisma.groupMembership.create({
        data: {
          userId: session.userId,
          groupId: selectedGroup.id,
          role: 'member',
          joinedAt: new Date(),
          isActive: true
        }
      });

      // Update group member count - we'll track this separately if needed
      // Note: No memberCount field in schema, using membership count instead

      // Log group joining
      await prisma.userInteraction.create({
        data: {
          userId: session.userId,
          interactionType: 'GROUP_JOINED',
          entityType: 'support_group',
          entityId: selectedGroup.id,
          metadata: {
            groupName: selectedGroup.name,
            groupLanguage: selectedGroup.language,
            joinMethod: 'whatsapp_flow'
          }
        }
      });

      // Award points for joining
      await this.awardGroupJoiningPoints(session.userId);

      const groupName = this.getLocalizedJsonValue(selectedGroup.name, session.language);

      return {
        message: this.getLocalizedText('group_joined_success', session.language)
          .replace('{groupName}', groupName),
        nextStep: 4
      };
    } else {
      return await this.showAvailableGroups(session);
    }
  }

  private async showGroupGuidelines(session: UserSession): Promise<FlowResponse> {
    const selectedGroup = session.context.selectedGroup;
    const groupName = this.getLocalizedJsonValue(selectedGroup.name, session.language);

    return {
      message: this.getLocalizedText('group_guidelines', session.language)
        .replace('{groupName}', groupName),
      buttons: [
        { id: 'start_chatting', title: this.getLocalizedText('start_group_chat', session.language) },
        { id: 'schedule_meeting', title: this.getLocalizedText('view_meeting_schedule', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async showUserGroups(session: UserSession): Promise<FlowResponse> {
    const memberships = await prisma.groupMembership.findMany({
      where: { 
        userId: session.userId,
        isActive: true 
      },
      include: { 
        group: {
          include: {
            _count: {
              select: { memberships: true }
            }
          }
        }
      }
    });

    if (memberships.length === 0) {
      return {
        message: this.getLocalizedText('no_groups_joined', session.language),
        buttons: [
          { id: 'join_group', title: this.getLocalizedText('join_new_group', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    let message = this.getLocalizedText('your_groups', session.language) + '\n\n';
    
    memberships.forEach((membership, index) => {
      const group = membership.group;
      const groupName = this.getLocalizedJsonValue(group.name, session.language);
      
      message += `${index + 1}. **${groupName}**\n`;
      message += `   📅 Joined: ${membership.joinedAt.toLocaleDateString()}\n`;
      message += `   👥 ${group._count.memberships} members\n`;
      message += `   � Category: ${group.category}\n\n`;
    });

    return {
      message,
      buttons: [
        { id: 'group_chat', title: this.getLocalizedText('group_chat', session.language) },
        { id: 'join_another', title: this.getLocalizedText('join_another_group', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async initiateGroupChat(session: UserSession): Promise<FlowResponse> {
    // This would integrate with a real-time chat system
    return {
      message: this.getLocalizedText('group_chat_info', session.language),
      buttons: [
        { id: 'view_recent_messages', title: this.getLocalizedText('view_recent_messages', session.language) },
        { id: 'send_message', title: this.getLocalizedText('send_group_message', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private async initiateGroupLeaving(session: UserSession): Promise<FlowResponse> {
    const memberships = await prisma.groupMembership.findMany({
      where: { 
        userId: session.userId,
        isActive: true 
      },
      include: { group: true }
    });

    if (memberships.length === 0) {
      return {
        message: this.getLocalizedText('no_groups_to_leave', session.language),
        buttons: [
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    return {
      message: this.getLocalizedText('select_group_to_leave', session.language),
      quickReplies: memberships.map(membership => 
        this.getLocalizedJsonValue(membership.group.name, session.language)
      ),
      shouldEndFlow: true
    };
  }

  private parseGroupSelection(text: string, groups: any[]): number {
    // Try to parse number selection first
    const match = text.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]) - 1;
      if (num >= 0 && num < groups.length) {
        return num;
      }
    }

    // Try to match group name
    const lowerText = text.toLowerCase();
    for (let i = 0; i < groups.length; i++) {
      const groupName = this.getLocalizedJsonValue(groups[i].name, 'en').toLowerCase();
      if (lowerText.includes(groupName)) {
        return i;
      }
    }

    return -1;
  }

  private async awardGroupJoiningPoints(userId: string): Promise<void> {
    await prisma.gamificationData.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: 25 },
        updatedAt: new Date()
      },
      create: {
        userId,
        totalPoints: 25,
        level: 1,
        streak: 1
      }
    });
  }

  private getLocalizedJsonValue(jsonValue: any, language: string): string {
    if (typeof jsonValue === 'string') {
      return jsonValue;
    }
    
    if (typeof jsonValue === 'object' && jsonValue !== null) {
      return jsonValue[language] || jsonValue.en || JSON.stringify(jsonValue);
    }
    
    return String(jsonValue || '');
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      peer_support_intro: {
        en: "🤝 **Peer Support Groups**\n\nConnect with others who understand your journey. Our peer support groups provide a safe space to share experiences and find mutual support.",
        zh: "🤝 **同伴支持小组**\n\n与理解您旅程的其他人联系。我们的同伴支持小组提供一个安全的空间来分享经验并找到相互支持。",
        bn: "🤝 **সহকর্মী সহায়তা গ্রুপ**\n\nযারা আপনার যাত্রা বোঝেন তাদের সাথে যুক্ত হন। আমাদের সহকর্মী সহায়তা গ্রুপ অভিজ্ঞতা ভাগাভাগি এবং পারস্পরিক সহায়তা খোঁজার জন্য একটি নিরাপদ স্থান প্রদান করে।",
        ta: "🤝 **சக ஆதரவு குழுக்கள்**\n\nஉங்கள் பயணத்தை புரிந்துகொள்ளும் மற்றவர்களுடன் இணையுங்கள். எங்கள் சக ஆதரவு குழுக்கள் அனுபவங்களைப் பகிர்ந்துகொள்ளவும் பரஸ்பர ஆதரவைக் கண்டறியவும் பாதுகாப்பான இடத்தை வழங்குகின்றன।",
        my: "🤝 **ရွယ်တူ ထောက်ပံ့မှု အုပ်စုများ**\n\nသင့်ခရီးကို နားလည်သူများနှင့် ချိတ်ဆက်ပါ။ ကျွန်ုပ်တို့၏ ရွယ်တူ ထောက်ပံ့မှု အုပ်စုများသည် အတွေ့အကြုံများ မျှဝေရန်နှင့် အပြန်အလှန် ထောက်ပံ့မှု ရှာဖွေရန် လုံခြုံသော နေရာကို ပေးစွမ်းပါသည်။",
        id: "🤝 **Grup Dukungan Sebaya**\n\nTerhubunglah dengan orang lain yang memahami perjalanan Anda. Grup dukungan sebaya kami menyediakan ruang aman untuk berbagi pengalaman dan menemukan dukungan bersama."
      },
      join_new_group: {
        en: "🆕 Join New Group",
        zh: "🆕 加入新组",
        bn: "🆕 নতুন গ্রুপে যোগ দিন",
        ta: "🆕 புதிய குழுவில் சேரு",
        my: "🆕 အုပ်စုအသစ်တွင် ပါဝင်ရန်",
        id: "🆕 Bergabung Grup Baru"
      },
      available_groups: {
        en: "📋 **Available Peer Support Groups**\n\nChoose a group that resonates with your needs:",
        zh: "📋 **可用的同伴支持小组**\n\n选择一个符合您需求的小组：",
        bn: "📋 **উপলব্ধ সহকর্মী সহায়তা গ্রুপ**\n\nআপনার প্রয়োজনের সাথে মানানসই একটি গ্রুপ বেছে নিন:",
        ta: "📋 **கிடைக்கும் சக ஆதரவு குழுக்கள்**\n\nஉங்கள் தேவைகளுக்கு ஏற்ற குழுவைத் தேர்ந்தெடுக்கவும்:",
        my: "📋 **ရရှိနိုင်သော ရွယ်တူ ထောက်ပံ့မှု အုပ်စုများ**\n\nသင့်လိုအပ်ချက်များနှင့် ကိုက်ညီသော အုပ်စုတစ်ခုကို ရွေးချယ်ပါ:",
        id: "📋 **Grup Dukungan Sebaya yang Tersedia**\n\nPilih grup yang sesuai dengan kebutuhan Anda:"
      },
      confirm_group_joining: {
        en: "🤝 **Join {groupName}?**\n\n{groupDescription}\n\nBy joining this group, you'll be able to:\n• Share experiences safely\n• Receive peer support\n• Participate in group activities\n• Connect with others facing similar challenges\n\nWould you like to join this group?",
        zh: "🤝 **加入{groupName}？**\n\n{groupDescription}\n\n加入此小组后，您将能够：\n• 安全地分享经验\n• 获得同伴支持\n• 参与小组活动\n• 与面临类似挑战的其他人联系\n\n您想加入这个小组吗？",
        bn: "🤝 **{groupName} এ যোগ দিবেন?**\n\n{groupDescription}\n\nএই গ্রুপে যোগ দিলে, আপনি পারবেন:\n• নিরাপদে অভিজ্ঞতা ভাগাভাগি করতে\n• সহকর্মী সহায়তা পেতে\n• গ্রুপ কার্যক্রমে অংশগ্রহণ করতে\n• অনুরূপ চ্যালেঞ্জের মুখোমুখি অন্যদের সাথে সংযুক্ত হতে\n\nআপনি কি এই গ্রুপে যোগ দিতে চান?",
        ta: "🤝 **{groupName} இல் சேர வேண்டுமா?**\n\n{groupDescription}\n\nஇந்த குழுவில் சேர்வதன் மூலம், நீங்கள் முடியும்:\n• பாதுகாப்பாக அனுபவங்களைப் பகிர்ந்துகொள்ள\n• சக ஆதரவைப் பெற\n• குழு செயல்பாடுகளில் பங்கேற்க\n• ஒத்த சவால்களை எதிர்கொள்ளும் மற்றவர்களுடன் இணைய\n\nஇந்த குழுவில் சேர விரும்புகிறீர்களா?",
        my: "🤝 **{groupName} တွင် ပါဝင်မလား?**\n\n{groupDescription}\n\nဤအုပ်စုတွင် ပါဝင်ခြင်းဖြင့်၊ သင်သည်:\n• လုံခြုံစွာ အတွေ့အကြုံများ မျှဝေနိုင်မည်\n• ရွယ်တူ ထောက်ပံ့မှု ရယူနိုင်မည်\n• အုပ်စု လှုပ်ရှားမှုများတွင် ပါဝင်နိုင်မည်\n• အလားတူ စိန်ခေါ်မှုများ ရင်ဆိုင်နေသူများနှင့် ချိတ်ဆက်နိုင်မည်\n\nဤအုပ်စုတွင် ပါဝင်လိုပါသလား?",
        id: "🤝 **Bergabung dengan {groupName}?**\n\n{groupDescription}\n\nDengan bergabung dengan grup ini, Anda akan dapat:\n• Berbagi pengalaman dengan aman\n• Menerima dukungan sebaya\n• Berpartisipasi dalam kegiatan grup\n• Terhubung dengan orang lain yang menghadapi tantangan serupa\n\nApakah Anda ingin bergabung dengan grup ini?"
      },
      group_joined_success: {
        en: "🎉 **Welcome to {groupName}!**\n\nYou've successfully joined the group. You'll now receive group updates and can participate in discussions.\n\n+25 wellness points earned! 🌟",
        zh: "🎉 **欢迎加入{groupName}！**\n\n您已成功加入该小组。您现在将收到小组更新并可以参与讨论。\n\n获得+25个健康积分！🌟",
        bn: "🎉 **{groupName} এ স্বাগতম!**\n\nআপনি সফলভাবে গ্রুপে যোগ দিয়েছেন। আপনি এখন গ্রুপ আপডেট পাবেন এবং আলোচনায় অংশগ্রহণ করতে পারবেন।\n\n+২৫ সুস্থতা পয়েন্ট অর্জিত! 🌟",
        ta: "🎉 **{groupName} இல் வரவேற்கிறோம்!**\n\nநீங்கள் வெற்றிகரமாக குழுவில் சேர்ந்துள்ளீர்கள். இப்போது குழு புதுப்பிப்புகளைப் பெறுவீர்கள் மற்றும் விவாதங்களில் பங்கேற்கலாம்।\n\n+25 நல்வாழ்வு புள்ளிகள் பெற்றுள்ளீர்கள்! 🌟",
        my: "🎉 **{groupName} သို့ ကြိုဆိုပါသည်!**\n\nသင်သည် အုပ်စုတွင် အောင်မြင်စွာ ပါဝင်ခဲ့သည်။ သင်သည် ယခု အုပ်စု အပ်ဒိတ်များ ရရှိမည်ဖြစ်ပြီး ဆွေးနွေးမှုများတွင် ပါဝင်နိုင်မည်ဖြစ်သည်။\n\n+25 ကျန်းမာရေး အမှတ်များ ရရှိခဲ့သည်! 🌟",
        id: "🎉 **Selamat datang di {groupName}!**\n\nAnda telah berhasil bergabung dengan grup. Sekarang Anda akan menerima pembaruan grup dan dapat berpartisipasi dalam diskusi.\n\n+25 poin kesehatan diperoleh! 🌟"
      },
      yes_join_group: {
        en: "✅ Yes, Join Group",
        zh: "✅ 是的，加入小组",
        bn: "✅ হ্যাঁ, গ্রুপে যোগ দিন",
        ta: "✅ ஆம், குழுவில் சேரு",
        my: "✅ ဟုတ်ကဲ့၊ အုပ်စုတွင် ပါဝင်ပါ",
        id: "✅ Ya, Bergabung Grup"
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
