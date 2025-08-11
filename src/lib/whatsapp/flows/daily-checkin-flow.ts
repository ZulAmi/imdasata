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

export class DailyCheckInFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.initiateDailyCheckIn(session);
      case 1:
        return await this.processMoodRating(text, session);
      case 2:
        return await this.processEnergyLevel(text, session);
      case 3:
        return await this.processStressLevel(text, session);
      case 4:
        return await this.processSleepQuality(text, session);
      case 5:
        return await this.processGoalsReflection(text, session);
      case 6:
        return await this.processGratitude(text, session);
      case 7:
        return await this.completeDailyCheckIn(session);
      default:
        return await this.initiateDailyCheckIn(session);
    }
  }

  private async initiateDailyCheckIn(session: UserSession): Promise<FlowResponse> {
    // Check if user has already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCheckIn = await prisma.moodLog.findFirst({
      where: {
        userId: session.userId,
        loggedAt: {
          gte: today
        }
      }
    });

    if (todayCheckIn) {
      return {
        message: this.getLocalizedText('already_checked_in_today', session.language),
        buttons: [
          { id: 'view_summary', title: this.getLocalizedText('view_today_summary', session.language) },
          { id: 'weekly_report', title: this.getLocalizedText('view_weekly_report', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        shouldEndFlow: true
      };
    }

    // Initialize check-in context
    session.context.checkInData = {
      mood: null,
      energy: null,
      stress: null,
      sleepQuality: null,
      goals: null,
      gratitude: null,
      startTime: new Date()
    };

    return {
      message: this.getLocalizedText('daily_checkin_intro', session.language),
      quickReplies: ['😄 5', '🙂 4', '😐 3', '🙁 2', '😢 1'],
      nextStep: 1
    };
  }

  private async processMoodRating(text: string, session: UserSession): Promise<FlowResponse> {
    const moodRating = this.parseRating(text);
    
    if (moodRating === -1) {
      return {
        message: this.getLocalizedText('invalid_mood_rating', session.language),
        quickReplies: ['😄 5', '🙂 4', '😐 3', '🙁 2', '😢 1'],
        nextStep: 1
      };
    }

    session.context.checkInData.mood = moodRating;

    return {
      message: this.getLocalizedText('energy_level_question', session.language),
      quickReplies: ['⚡ 5', '🔋 4', '🔌 3', '🪫 2', '😴 1'],
      nextStep: 2
    };
  }

  private async processEnergyLevel(text: string, session: UserSession): Promise<FlowResponse> {
    const energyLevel = this.parseRating(text);
    
    if (energyLevel === -1) {
      return {
        message: this.getLocalizedText('invalid_energy_rating', session.language),
        quickReplies: ['⚡ 5', '🔋 4', '🔌 3', '🪫 2', '😴 1'],
        nextStep: 2
      };
    }

    session.context.checkInData.energy = energyLevel;

    return {
      message: this.getLocalizedText('stress_level_question', session.language),
      quickReplies: ['😌 1', '😊 2', '😐 3', '😰 4', '😵 5'],
      nextStep: 3
    };
  }

  private async processStressLevel(text: string, session: UserSession): Promise<FlowResponse> {
    const stressLevel = this.parseRating(text);
    
    if (stressLevel === -1) {
      return {
        message: this.getLocalizedText('invalid_stress_rating', session.language),
        quickReplies: ['😌 1', '😊 2', '😐 3', '😰 4', '😵 5'],
        nextStep: 3
      };
    }

    session.context.checkInData.stress = stressLevel;

    return {
      message: this.getLocalizedText('sleep_quality_question', session.language),
      quickReplies: ['🛌 5', '😴 4', '😊 3', '😑 2', '😩 1'],
      nextStep: 4
    };
  }

  private async processSleepQuality(text: string, session: UserSession): Promise<FlowResponse> {
    const sleepQuality = this.parseRating(text);
    
    if (sleepQuality === -1) {
      return {
        message: this.getLocalizedText('invalid_sleep_rating', session.language),
        quickReplies: ['🛌 5', '😴 4', '😊 3', '😑 2', '😩 1'],
        nextStep: 4
      };
    }

    session.context.checkInData.sleepQuality = sleepQuality;

    return {
      message: this.getLocalizedText('goals_reflection_question', session.language),
      buttons: [
        { id: 'goals_excellent', title: this.getLocalizedText('goals_excellent', session.language) },
        { id: 'goals_good', title: this.getLocalizedText('goals_good', session.language) },
        { id: 'goals_okay', title: this.getLocalizedText('goals_okay', session.language) },
        { id: 'goals_struggling', title: this.getLocalizedText('goals_struggling', session.language) }
      ],
      nextStep: 5
    };
  }

  private async processGoalsReflection(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    let goalsProgress: string;

    if (lowerText.includes('excellent') || lowerText.includes('优秀') || lowerText.includes('অসাধারণ')) {
      goalsProgress = 'excellent';
    } else if (lowerText.includes('good') || lowerText.includes('好') || lowerText.includes('ভাল')) {
      goalsProgress = 'good';
    } else if (lowerText.includes('okay') || lowerText.includes('还行') || lowerText.includes('ঠিক আছে')) {
      goalsProgress = 'okay';
    } else if (lowerText.includes('struggling') || lowerText.includes('困难') || lowerText.includes('কষ্ট')) {
      goalsProgress = 'struggling';
    } else {
      return {
        message: this.getLocalizedText('invalid_goals_response', session.language),
        buttons: [
          { id: 'goals_excellent', title: this.getLocalizedText('goals_excellent', session.language) },
          { id: 'goals_good', title: this.getLocalizedText('goals_good', session.language) },
          { id: 'goals_okay', title: this.getLocalizedText('goals_okay', session.language) },
          { id: 'goals_struggling', title: this.getLocalizedText('goals_struggling', session.language) }
        ],
        nextStep: 5
      };
    }

    session.context.checkInData.goals = goalsProgress;

    return {
      message: this.getLocalizedText('gratitude_question', session.language),
      nextStep: 6
    };
  }

  private async processGratitude(text: string, session: UserSession): Promise<FlowResponse> {
    session.context.checkInData.gratitude = text.trim();

    if (text.trim().length < 3) {
      return {
        message: this.getLocalizedText('gratitude_too_short', session.language),
        nextStep: 6
      };
    }

    return await this.completeDailyCheckIn(session);
  }

  private async completeDailyCheckIn(session: UserSession): Promise<FlowResponse> {
    const checkInData = session.context.checkInData;
    
    // Calculate wellness score
    const wellnessScore = this.calculateWellnessScore(checkInData);
    
    // Save mood log
    const moodLog = await prisma.moodLog.create({
      data: {
        userId: session.userId,
        moodScore: checkInData.mood * 2, // Convert 1-5 to 1-10 scale
        emotions: this.mapMoodToEmotions(checkInData),
        notes: checkInData.gratitude,
        triggers: this.inferTriggers(checkInData),
        language: session.language,
        emotionAnalysis: {
          energy: checkInData.energy,
          stress: checkInData.stress,
          sleepQuality: checkInData.sleepQuality,
          goalsProgress: checkInData.goals,
          wellnessScore: wellnessScore
        }
      }
    });

    // Log interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'DAILY_CHECKIN',
        entityType: 'mood_log',
        entityId: moodLog.id,
        metadata: {
          wellnessScore,
          mood: checkInData.mood,
          energy: checkInData.energy,
          stress: checkInData.stress
        }
      }
    });

    // Award points for daily check-in
    await this.awardCheckInPoints(session.userId);

    // Check if intervention is needed
    const interventionMessage = await this.checkForIntervention(checkInData, session);

    // Generate summary and recommendations
    const summary = this.generateCheckInSummary(checkInData, wellnessScore, session.language);
    const recommendations = await this.generateRecommendations(checkInData, session);

    return {
      message: summary + '\n\n' + recommendations + (interventionMessage ? '\n\n' + interventionMessage : ''),
      buttons: [
        { id: 'view_trends', title: this.getLocalizedText('view_trends', session.language) },
        { id: 'get_support', title: this.getLocalizedText('get_support', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      shouldEndFlow: true
    };
  }

  private parseRating(text: string): number {
    // Extract number from text (1-5)
    const match = text.match(/[1-5]/);
    if (match) {
      return parseInt(match[0]);
    }
    
    // Try to parse emoji-based ratings
    if (text.includes('😄') || text.includes('⚡') || text.includes('🛌')) return 5;
    if (text.includes('🙂') || text.includes('🔋') || text.includes('😴')) return 4;
    if (text.includes('😐') || text.includes('🔌') || text.includes('😊')) return 3;
    if (text.includes('🙁') || text.includes('🪫') || text.includes('😑')) return 2;
    if (text.includes('😢') || text.includes('😴') || text.includes('😩')) return 1;
    
    return -1; // Invalid rating
  }

  private calculateWellnessScore(checkInData: any): number {
    // Calculate weighted wellness score (0-100)
    const moodWeight = 0.3;
    const energyWeight = 0.25;
    const stressWeight = 0.25; // Inverse scoring for stress
    const sleepWeight = 0.2;

    const moodScore = (checkInData.mood / 5) * 100;
    const energyScore = (checkInData.energy / 5) * 100;
    const stressScore = ((6 - checkInData.stress) / 5) * 100; // Inverse
    const sleepScore = (checkInData.sleepQuality / 5) * 100;

    return Math.round(
      moodScore * moodWeight +
      energyScore * energyWeight +
      stressScore * stressWeight +
      sleepScore * sleepWeight
    );
  }

  private generateCheckInSummary(checkInData: any, wellnessScore: number, language: string): string {
    let summary = this.getLocalizedText('checkin_complete', language) + '\n\n';
    summary += this.getLocalizedText('wellness_score', language).replace('{score}', wellnessScore.toString()) + '\n\n';
    
    summary += this.getLocalizedText('todays_metrics', language) + '\n';
    summary += `• ${this.getLocalizedText('mood', language)}: ${this.getMoodEmoji(checkInData.mood)} ${checkInData.mood}/5\n`;
    summary += `• ${this.getLocalizedText('energy', language)}: ${this.getEnergyEmoji(checkInData.energy)} ${checkInData.energy}/5\n`;
    summary += `• ${this.getLocalizedText('stress', language)}: ${this.getStressEmoji(checkInData.stress)} ${checkInData.stress}/5\n`;
    summary += `• ${this.getLocalizedText('sleep', language)}: ${this.getSleepEmoji(checkInData.sleepQuality)} ${checkInData.sleepQuality}/5\n`;

    return summary;
  }

  private async generateRecommendations(checkInData: any, session: UserSession): Promise<string> {
    const recommendations = [];
    
    // Mood-based recommendations
    if (checkInData.mood <= 2) {
      recommendations.push(this.getLocalizedText('mood_recommendation_low', session.language));
    } else if (checkInData.mood >= 4) {
      recommendations.push(this.getLocalizedText('mood_recommendation_high', session.language));
    }

    // Energy-based recommendations
    if (checkInData.energy <= 2) {
      recommendations.push(this.getLocalizedText('energy_recommendation_low', session.language));
    }

    // Stress-based recommendations
    if (checkInData.stress >= 4) {
      recommendations.push(this.getLocalizedText('stress_recommendation_high', session.language));
    }

    // Sleep-based recommendations
    if (checkInData.sleepQuality <= 2) {
      recommendations.push(this.getLocalizedText('sleep_recommendation_poor', session.language));
    }

    if (recommendations.length === 0) {
      recommendations.push(this.getLocalizedText('general_recommendation', session.language));
    }

    return this.getLocalizedText('recommendations_header', session.language) + '\n' + 
           recommendations.map(rec => `• ${rec}`).join('\n');
  }

  private async checkForIntervention(checkInData: any, session: UserSession): Promise<string | null> {
    // Check if multiple low scores indicate need for intervention
    const lowScores = [
      checkInData.mood <= 2,
      checkInData.energy <= 2,
      checkInData.stress >= 4,
      checkInData.sleepQuality <= 2
    ].filter(Boolean).length;

    if (lowScores >= 2) {
      // Create service referral for intervention
      await prisma.serviceReferral.create({
        data: {
          userId: session.userId,
          resourceId: '00000000-0000-0000-0000-000000000001', // Default mental health resource
          referralType: 'counseling',
          urgencyLevel: 'medium',
          status: 'pending',
          notes: 'Multiple low wellness indicators in daily check-in',
          language: session.language
        }
      });

      return this.getLocalizedText('intervention_suggested', session.language);
    }

    return null;
  }

  private async awardCheckInPoints(userId: string): Promise<void> {
    // Check streak
    const streak = await this.calculateCheckInStreak(userId);
    const basePoints = 10;
    const streakBonus = Math.min(streak * 2, 20); // Max 20 bonus points

    await prisma.gamificationData.upsert({
      where: { userId },
      update: {
        totalPoints: { increment: basePoints + streakBonus },
        streak: streak,
        updatedAt: new Date()
      },
      create: {
        userId,
        totalPoints: basePoints + streakBonus,
        level: 1,
        streak: streak
      }
    });
  }

  private async calculateCheckInStreak(userId: string): Promise<number> {
    const today = new Date();
    let streak = 1;
    let checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - 1);

    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayCheckIn = await prisma.moodLog.findFirst({
        where: {
          userId,
          loggedAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      if (dayCheckIn) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private mapMoodToEmotions(checkInData: any): string[] {
    const emotions = [];
    
    if (checkInData.mood >= 4) emotions.push('happy', 'content');
    if (checkInData.mood <= 2) emotions.push('sad', 'low');
    if (checkInData.stress >= 4) emotions.push('anxious', 'stressed');
    if (checkInData.energy <= 2) emotions.push('tired', 'exhausted');
    if (checkInData.energy >= 4) emotions.push('energetic', 'motivated');
    if (checkInData.sleepQuality <= 2) emotions.push('tired');
    if (checkInData.goals === 'excellent') emotions.push('accomplished', 'proud');
    if (checkInData.goals === 'struggling') emotions.push('frustrated', 'overwhelmed');
    
    return emotions.length > 0 ? emotions : ['neutral'];
  }

  private inferTriggers(checkInData: any): string[] {
    const triggers = [];
    
    if (checkInData.stress >= 4) triggers.push('stress');
    if (checkInData.sleepQuality <= 2) triggers.push('sleep');
    if (checkInData.goals === 'struggling') triggers.push('work', 'goals');
    if (checkInData.energy <= 2) triggers.push('fatigue');
    
    return triggers.length > 0 ? triggers : ['general'];
  }

  private getMoodEmoji(mood: number): string {
    const emojis = ['😢', '🙁', '😐', '🙂', '😄'];
    return emojis[mood - 1] || '😐';
  }

  private getEnergyEmoji(energy: number): string {
    const emojis = ['😴', '🪫', '🔌', '🔋', '⚡'];
    return emojis[energy - 1] || '🔌';
  }

  private getStressEmoji(stress: number): string {
    const emojis = ['😌', '😊', '😐', '😰', '😵'];
    return emojis[stress - 1] || '😐';
  }

  private getSleepEmoji(sleep: number): string {
    const emojis = ['😩', '😑', '😊', '😴', '🛌'];
    return emojis[sleep - 1] || '😊';
  }

  private getLocalizedText(key: string, language: string): string {
    const texts: Record<string, Record<string, string>> = {
      daily_checkin_intro: {
        en: "🌅 **Daily Check-In**\n\nLet's see how you're feeling today! On a scale of 1-5, how would you rate your overall mood right now?",
        zh: "🌅 **每日签到**\n\n让我们看看您今天的感觉如何！在1-5分的范围内，您如何评价您现在的整体情绪？",
        bn: "🌅 **দৈনিক চেক-ইন**\n\nদেখা যাক আজ আপনার কেমন লাগছে! ১-৫ স্কেলে, আপনি এখন আপনার সামগ্রিক মেজাজ কীভাবে রেট করবেন?",
        ta: "🌅 **தினசரி சோதனை**\n\nஇன்று நீங்கள் எப்படி உணர்கிறீர்கள் என்று பார்ப்போம்! 1-5 அளவில், உங்கள் ஒட்டுமொத்த மனநிலையை இப்போது எப்படி மதிப்பிடுவீர்கள்?",
        my: "🌅 **နေ့စဉ် စစ်ဆေးခြင်း**\n\nယနေ့ သင် ဘယ်လို ခံစားရသလဲ ကြည့်ကြရအောင်! ၁-၅ အတိုင်းအတာဖြင့်၊ သင့်ရဲ့ ယေဘုယျ စိတ်ခံစားမှုကို ယခု ဘယ်လို အဆင့်သတ်မှတ်မလဲ?",
        id: "🌅 **Check-In Harian**\n\nMari lihat bagaimana perasaan Anda hari ini! Dalam skala 1-5, bagaimana Anda menilai suasana hati Anda secara keseluruhan saat ini?"
      },
      energy_level_question: {
        en: "⚡ How would you rate your energy level today? (1=Very Low, 5=Very High)",
        zh: "⚡ 您如何评价您今天的精力水平？（1=非常低，5=非常高）",
        bn: "⚡ আজ আপনার শক্তির মাত্রা কীভাবে রেট করবেন? (১=খুবই কম, ৫=খুবই বেশি)",
        ta: "⚡ இன்று உங்கள் ஆற்றல் நிலையை எப்படி மதிப்பிடுவீர்கள்? (1=மிகவும் குறைவு, 5=மிகவும் அதிகம்)",
        my: "⚡ ယနေ့ သင့်ရဲ့ စွမ်းအင်ပမာဏကို ဘယ်လို အဆင့်သတ်မှတ်မလဲ? (၁=အလွန်နည်း၊ ၅=အလွန်များ)",
        id: "⚡ Bagaimana Anda menilai tingkat energi Anda hari ini? (1=Sangat Rendah, 5=Sangat Tinggi)"
      },
      stress_level_question: {
        en: "😰 How would you rate your stress level today? (1=Very Calm, 5=Very Stressed)",
        zh: "😰 您如何评价您今天的压力水平？（1=非常平静，5=非常有压力）",
        bn: "😰 আজ আপনার চাপের মাত্রা কীভাবে রেট করবেন? (১=খুবই শান্ত, ৫=খুবই চাপে)",
        ta: "😰 இன்று உங்கள் மன அழுத்த நிலையை எப்படி மதிப்பிடுவீர்கள்? (1=மிகவும் அமைதி, 5=மிகவும் மன அழுத்தம்)",
        my: "😰 ယနေ့ သင့်ရဲ့ စိတ်ဖိစီးမှုအဆင့်ကို ဘယ်လို အဆင့်သတ်မှတ်မလဲ? (၁=အလွန်အေးဆေး၊ ၅=အလွန်ဖိစီး)",
        id: "😰 Bagaimana Anda menilai tingkat stres Anda hari ini? (1=Sangat Tenang, 5=Sangat Stres)"
      },
      checkin_complete: {
        en: "✅ **Daily Check-In Complete!**\n\nThank you for taking time to reflect on your wellness today.",
        zh: "✅ **每日签到完成！**\n\n感谢您今天花时间反思您的健康状况。",
        bn: "✅ **দৈনিক চেক-ইন সম্পূর্ণ!**\n\nআজ আপনার সুস্থতা নিয়ে চিন্তা করার জন্য সময় নেওয়ার জন্য ধন্যবাদ।",
        ta: "✅ **தினசரி சோதனை முடிந்தது!**\n\nஇன்று உங்கள் நல்வாழ்வைப் பற்றி சிந்திக்க நேரம் செலவிட்டதற்கு நன்றி।",
        my: "✅ **နေ့စဉ် စစ်ဆေးခြင်း ပြီးဆုံး!**\n\nယနေ့ သင့်ရဲ့ ကျန်းမာရေးအကြောင်း စဉ်းစားဖို့ အချိန်ပေးတဲ့အတွက် ကျေးဇူးတင်ပါတယ်။",
        id: "✅ **Check-In Harian Selesai!**\n\nTerima kasih telah meluangkan waktu untuk merefleksikan kesehatan Anda hari ini."
      },
      wellness_score: {
        en: "🎯 **Wellness Score: {score}/100**",
        zh: "🎯 **健康评分：{score}/100**",
        bn: "🎯 **সুস্থতার স্কোর: {score}/100**",
        ta: "🎯 **நல்வாழ்வு மதிப்பெண்: {score}/100**",
        my: "🎯 **ကျန်းမာရေး ရမှတ်: {score}/100**",
        id: "🎯 **Skor Kesehatan: {score}/100**"
      },
      view_trends: {
        en: "📈 View Trends",
        zh: "📈 查看趋势",
        bn: "📈 ট্রেন্ড দেখুন",
        ta: "📈 போக்குகளைப் பார்க்கவும்",
        my: "📈 လမ်းကြောင်းများ ကြည့်ရန်",
        id: "📈 Lihat Tren"
      }
    };

    const textSet = texts[key];
    if (!textSet) return key;
    
    return textSet[language] || textSet.en || key;
  }
}
