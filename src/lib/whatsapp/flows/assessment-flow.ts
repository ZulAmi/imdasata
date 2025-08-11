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

export class AssessmentFlow {
  constructor(private whatsapp: WhatsAppService) {}

  async handleMessage(text: string, session: UserSession): Promise<FlowResponse> {
    switch (session.flowStep) {
      case 0:
        return await this.startAssessment(session);
      case 1:
      case 2:
      case 3:
      case 4:
        return await this.processAnswer(text, session);
      case 5:
        return await this.completeAssessment(session);
      default:
        return await this.startAssessment(session);
    }
  }

  private async startAssessment(session: UserSession): Promise<FlowResponse> {
    return {
      message: this.getLocalizedText('phq4_intro', session.language),
      quickReplies: [
        this.getLocalizedText('start_now', session.language),
        this.getLocalizedText('learn_more', session.language),
        this.getLocalizedText('maybe_later', session.language)
      ],
      nextStep: 1,
      context: { answers: [], startTime: new Date().toISOString() }
    };
  }

  private async processAnswer(text: string, session: UserSession): Promise<FlowResponse> {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('later') || lowerText.includes('skip')) {
      return {
        message: this.getLocalizedText('assessment_postponed', session.language),
        buttons: [
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) },
          { id: 'explore_resources', title: this.getLocalizedText('browse_resources', session.language) }
        ],
        nextFlow: 'idle',
        shouldEndFlow: true
      };
    }

    if (lowerText.includes('learn') || lowerText.includes('more')) {
      return {
        message: this.getLocalizedText('phq4_explanation', session.language),
        buttons: [
          { id: 'start_assessment', title: this.getLocalizedText('start_now', session.language) },
          { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
        ],
        nextStep: 1
      };
    }

    // Process PHQ-4 questions
    if (session.flowStep >= 1 && session.flowStep <= 4) {
      return await this.askQuestion(text, session);
    }

    return await this.startAssessment(session);
  }

  private async askQuestion(text: string, session: UserSession): Promise<FlowResponse> {
    // Parse score from previous answer (if any)
    if (session.flowStep > 1) {
      const score = this.parseScore(text);
      if (score === -1) {
        return {
          message: this.getLocalizedText('invalid_score', session.language),
          quickReplies: [
            '0 - ' + this.getLocalizedText('not_at_all', session.language),
            '1 - ' + this.getLocalizedText('several_days', session.language),
            '2 - ' + this.getLocalizedText('more_than_half', session.language),
            '3 - ' + this.getLocalizedText('nearly_every_day', session.language)
          ],
          nextStep: session.flowStep // Stay on same question
        };
      }
      
      // Store the answer
      if (!session.context.answers) session.context.answers = [];
      session.context.answers.push(score);
    }

    // Check if we've completed all 4 questions
    if (session.flowStep === 5 || (session.context.answers && session.context.answers.length === 4)) {
      return await this.completeAssessment(session);
    }

    // Ask next question
    const questionNumber = session.context.answers ? session.context.answers.length + 1 : 1;
    const questionKey = `phq4_q${questionNumber}`;
    
    return {
      message: `${questionNumber}/4: ${this.getLocalizedText(questionKey, session.language)}`,
      quickReplies: [
        '0 - ' + this.getLocalizedText('not_at_all', session.language),
        '1 - ' + this.getLocalizedText('several_days', session.language),
        '2 - ' + this.getLocalizedText('more_than_half', session.language),
        '3 - ' + this.getLocalizedText('nearly_every_day', session.language)
      ],
      nextStep: session.flowStep + 1,
      context: session.context
    };
  }

  private async completeAssessment(session: UserSession): Promise<FlowResponse> {
    const answers = session.context.answers as number[];
    
    if (!answers || answers.length !== 4) {
      return await this.startAssessment(session);
    }

    // Calculate scores
    const anxietyScore = answers[2] + answers[3]; // Q3 + Q4
    const depressionScore = answers[0] + answers[1]; // Q1 + Q2
    const totalScore = anxietyScore + depressionScore;

    // Determine severity
    const getSeverityLevel = (score: number): string => {
      if (score >= 9) return 'severe';
      if (score >= 6) return 'moderate';
      if (score >= 3) return 'mild';
      return 'minimal';
    };

    const severity = getSeverityLevel(totalScore);

    // Save assessment to database
    await prisma.pHQ4Assessment.create({
      data: {
        userId: session.userId,
        question1Score: answers[0],
        question2Score: answers[1],
        question3Score: answers[2],
        question4Score: answers[3],
        anxietyScore,
        depressionScore,
        totalScore,
        severityLevel: severity,
        language: session.language
      }
    });

    // Award points
    await this.awardPoints(session.userId, 'ASSESSMENT_COMPLETED', 25);

    // Generate appropriate response and referrals
    await this.handleAssessmentResults(session, totalScore, severity);

    const resultKey = `phq4_result_${severity}`;
    const resultMessage = this.getLocalizedText(resultKey, session.language);

    return {
      message: resultMessage,
      buttons: [
        { id: 'view_resources', title: this.getLocalizedText('view_resources', session.language) },
        { id: 'talk_to_peer', title: this.getLocalizedText('peer_support', session.language) },
        { id: 'main_menu', title: this.getLocalizedText('main_menu', session.language) }
      ],
      nextFlow: 'idle',
      nextStep: 0,
      shouldEndFlow: true,
      priority: severity === 'severe' ? 'high' : 'medium'
    };
  }

  private async handleAssessmentResults(session: UserSession, totalScore: number, severity: string): Promise<void> {
    // Create service referral for moderate/severe cases
    if (totalScore >= 6) {
      const resourceType = severity === 'severe' ? 'crisis' : 'counseling';
      
      const resource = await prisma.mentalHealthResource.findFirst({
        where: {
          category: resourceType,
          isActive: true,
          languages: { has: session.language }
        },
        orderBy: { priority: 'desc' }
      });

      if (resource) {
        await prisma.serviceReferral.create({
          data: {
            userId: session.userId,
            resourceId: resource.id,
            referralType: resourceType,
            urgencyLevel: severity === 'severe' ? 'high' : 'medium',
            language: session.language
          }
        });
      }
    }

    // Log interaction
    await prisma.userInteraction.create({
      data: {
        userId: session.userId,
        interactionType: 'ASSESSMENT_COMPLETED',
        entityType: 'phq4_assessment',
        entityId: `assessment_${Date.now()}`,
        metadata: {
          totalScore,
          severity,
          anxietyScore: session.context.answers[2] + session.context.answers[3],
          depressionScore: session.context.answers[0] + session.context.answers[1],
          completedAt: new Date().toISOString()
        }
      }
    });
  }

  private parseScore(text: string): number {
    // Extract score from user response
    const match = text.match(/^[0-3]/) || text.match(/[0-3]/);
    return match ? parseInt(match[0]) : -1;
  }

  private async awardPoints(userId: string, action: string, points: number): Promise<void> {
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
      phq4_intro: {
        en: "📋 Mental Health Assessment (PHQ-4)\n\nThis brief 2-minute screening helps assess anxiety and depression levels. Your responses are completely confidential and will help me provide better support.\n\n✅ 4 simple questions\n✅ Takes 2 minutes\n✅ Completely anonymous\n✅ Clinically validated\n\nReady to begin?",
        zh: "📋 心理健康评估(PHQ-4)\n\n这个简短的2分钟筛查有助于评估焦虑和抑郁水平。您的回答完全保密，将帮助我提供更好的支持。\n\n✅ 4个简单问题\n✅ 需要2分钟\n✅ 完全匿名\n✅ 临床验证\n\n准备开始了吗？",
        bn: "📋 মানসিক স্বাস্থ্য মূল্যায়ন (PHQ-4)\n\nএই সংক্ষিপ্ত 2-মিনিটের স্ক্রিনিং উদ্বেগ এবং বিষণ্নতার মাত্রা মূল্যায়ন করতে সাহায্য করে। আপনার উত্তরগুলি সম্পূর্ণ গোপনীয় এবং আমাকে আরও ভাল সহায়তা প্রদান করতে সাহায্য করবে।\n\n✅ 4টি সহজ প্রশ্ন\n✅ 2 মিনিট সময় লাগে\n✅ সম্পূর্ণ বেনামী\n✅ ক্লিনিক্যালি যাচাইকৃত\n\nশুরু করতে প্রস্তুত?",
        ta: "📋 மன நல மதிப்பீடு (PHQ-4)\n\nஇந்த சுருக்கமான 2-நிமிட பரிசோதனை கவலை மற்றும் மனச்சோர்வு நிலைகளை மதிப்பிட உதவுகிறது. உங்கள் பதில்கள் முற்றிலும் ரகசியமானவை மற்றும் சிறந்த ஆதரவை வழங்க எனக்கு உதவும்.\n\n✅ 4 எளிய கேள்விகள்\n✅ 2 நிமிடங்கள் எடுக்கும்\n✅ முற்றிலும் அநாமதேயம்\n✅ மருத்துவ ரீதியாக சரிபார்க்கப்பட்டது\n\nதொடங்க தயாரா?",
        my: "📋 စိတ်ကျန်းမာရေး အကဲဖြတ်မှု (PHQ-4)\n\nဒီ တိုတောင်းတဲ့ ၂ မိနစ်ကြာ စစ်ဆေးမှုက စိုးရိမ်မှုနဲ့ စိတ်ဓာတ်ကျမှု အဆင့်များကို အကဲဖြတ်ဖို့ ကူညီပါတယ်။ သင့်ရဲ့ အဖြေများက လုံးဝ လျှို့ဝှက်ပြီး ပိုကောင်းတဲ့ အကူအညီ ပေးဖို့ ကျွန်တော့်ကို ကူညီပါလိမ့်မယ်။\n\n✅ ရိုးရှင်းတဲ့ မေးခွန်း ၄ ခု\n✅ ၂ မိနစ်ကြာပါတယ်\n✅ လုံးဝ အမည်မဖော်\n✅ ဆေးပညာအရ အတည်ပြုပြီး\n\nစတင်ဖို့ အသင့်ရှိပါသလား?",
        id: "📋 Penilaian Kesehatan Mental (PHQ-4)\n\nSkrining singkat 2 menit ini membantu menilai tingkat kecemasan dan depresi. Respons Anda sepenuhnya rahasia dan akan membantu saya memberikan dukungan yang lebih baik.\n\n✅ 4 pertanyaan sederhana\n✅ Membutuhkan 2 menit\n✅ Sepenuhnya anonim\n✅ Tervalidasi secara klinis\n\nSiap untuk memulai?"
      },
      phq4_q1: {
        en: "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
        zh: "在过去2周内，您多久被紧张、焦虑或烦躁的感觉困扰？",
        bn: "গত ২ সপ্তাহে, আপনি কতবার নার্ভাস, উদ্বিগ্ন বা অস্থির অনুভব করে বিরক্ত হয়েছেন?",
        ta: "கடந்த 2 வாரங்களில், நீங்கள் எத்தனை முறை பதட்டம், கவலை அல்லது எரிச்சல் உணர்வால் தொந்தரவு அடைந்தீர்கள்?",
        my: "ပြီးခဲ့တဲ့ ၂ ပတ်အတွင်း၊ စိတ်လှုပ်ရှားခြင်း၊ စိုးရိမ်ခြင်း သို့မဟုတ် စိတ်ညစ်ခြင်းကြောင့် ဘယ်လောက်ကြိမ် စိတ်အနှောင့်အယှက် ဖြစ်ခဲ့ပါသလဲ?",
        id: "Selama 2 minggu terakhir, seberapa sering Anda merasa terganggu oleh perasaan gugup, cemas, atau gelisah?"
      },
      phq4_q2: {
        en: "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
        zh: "在过去2周内，您多久被无法停止或控制担忧的问题困扰？",
        bn: "গত ২ সপ্তাহে, আপনি কতবার চিন্তা বন্ধ করতে বা নিয়ন্ত্রণ করতে না পেরে বিরক্ত হয়েছেন?",
        ta: "கடந்த 2 வாரங்களில், கவலையை நிறுத்தவோ கட்டுப்படுத்தவோ முடியாததால் எத்தனை முறை தொந்தரவு அடைந்தீர்கள்?",
        my: "ပြီးခဲ့တဲ့ ၂ ပတ်အတွင်း၊ စိုးရိမ်မှုကို ရပ်တန့်ခြင်း သို့မဟုတ် ထိန်းချုပ်နိုင်ခြင်းမရှိဘဲ ဘယ်လောက်ကြိမ် စိတ်အနှောင့်အယှက် ဖြစ်ခဲ့ပါသလဲ?",
        id: "Selama 2 minggu terakhir, seberapa sering Anda merasa terganggu karena tidak bisa menghentikan atau mengontrol kekhawatiran?"
      },
      phq4_q3: {
        en: "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
        zh: "在过去2周内，您多久被对做事缺乏兴趣或乐趣的问题困扰？",
        bn: "গত ২ সপ্তাহে, কাজকর্মে সামান্য আগ্রহ বা আনন্দ না থাকার কারণে আপনি কতবার বিরক্ত হয়েছেন?",
        ta: "கடந்த 2 வாரங்களில், விஷயங்களைச் செய்வதில் சிறிதளவு ஆர்வம் அல்லது மகிழ்ச்சி இல்லாததால் எத்தனை முறை தொந்தரவு அடைந்தீர்கள்?",
        my: "ပြီးခဲ့တဲ့ ၂ ပတ်အတွင်း၊ အရာများလုပ်ဆောင်ရာတွင် စိတ်ဝင်စားမှု သို့မဟုတ် ပျော်ရွှင်မှု နည်းပါးခြင်းကြောင့် ဘယ်လောက်ကြိမ် စိတ်အနှောင့်အယှက် ဖြစ်ခဲ့ပါသလဲ?",
        id: "Selama 2 minggu terakhir, seberapa sering Anda merasa terganggu karena sedikit minat atau kesenangan dalam melakukan hal-hal?"
      },
      phq4_q4: {
        en: "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
        zh: "在过去2周内，您多久被情绪低落、沮丧或绝望的感觉困扰？",
        bn: "গত ২ সপ্তাহে, আপনি কতবার হতাশ, বিষণ্ন বা আশাহীন অনুভব করে বিরক্ত হয়েছেন?",
        ta: "கடந்த 2 வாரங்களில், மனமுடைந்த, மனச்சோர்வான அல்லது நம்பிக்கையற்ற உணர்வால் எத்தனை முறை தொந்தரவு அடைந்தீர்கள்?",
        my: "ပြီးခဲ့တဲ့ ၂ ပတ်အတွင်း၊ စိတ်ဓာတ်ကျခြင်း၊ စိတ်ပျက်ခြင်း သို့မဟုတ် မျှော်လင့်ချက်မရှိခြင်းကြောင့် ဘယ်လောက်ကြိမ် စိတ်အနှောင့်အယှက် ဖြစ်ခဲ့ပါသလဲ?",
        id: "Selama 2 minggu terakhir, seberapa sering Anda merasa terganggu oleh perasaan sedih, depresi, atau putus asa?"
      },
      phq4_result_minimal: {
        en: "🌟 Your assessment shows minimal symptoms.\n\nThis is positive! You're showing good mental wellness. Keep up the healthy habits and consider:\n\n• Regular mood check-ins\n• Stress prevention techniques\n• Building your support network\n\nWould you like to explore wellness resources?",
        zh: "🌟 您的评估显示症状很少。\n\n这是积极的！您显示出良好的心理健康。保持健康习惯并考虑：\n\n• 定期情绪检查\n• 压力预防技巧\n• 建立您的支持网络\n\n您想探索健康资源吗？",
        bn: "🌟 আপনার মূল্যায়ন ন্যূনতম উপসর্গ দেখায়।\n\nএটি ইতিবাচক! আপনি ভাল মানসিক সুস্থতা প্রদর্শন করছেন। স্বাস্থ্যকর অভ্যাস বজায় রাখুন এবং বিবেচনা করুন:\n\n• নিয়মিত মুড চেক-ইন\n• চাপ প্রতিরোধ কৌশল\n• আপনার সাপোর্ট নেটওয়ার্ক তৈরি করা\n\nআপনি কি সুস্থতার সংস্থানগুলি অন্বেষণ করতে চান?",
        ta: "🌟 உங்கள் மதிப்பீடு குறைந்தபட்ச அறிகுறிகளைக் காட்டுகிறது।\n\nஇது நேர்மறையானது! நீங்கள் நல்ல மன நல்வாழ்வைக் காட்டுகிறீர்கள். ஆரோக்கியமான பழக்கவழக்கங்களைத் தொடருங்கள் மற்றும் கருத்தில் கொள்ளுங்கள்:\n\n• வழக்கமான மனநிலை சரிபார்ப்புகள்\n• மன அழுத்த தடுப்பு நுட்பங்கள்\n• உங்கள் ஆதரவு வலையமைப்பை உருவாக்குதல்\n\nநல்வாழ்வு வளங்களை ஆராய விரும்புகிறீர்களா?",
        my: "🌟 သင့်အကဲဖြတ်မှုက အနည်းငယ်သာ လက္ခဏာများ ပြသပါတယ်။\n\nဒါက အပြုသဘောဆောင်ပါတယ်! သင်က ကောင်းမွန်တဲ့ စိတ်ကျန်းမာရေး ပြသနေပါတယ်။ ကျန်းမာရေးနဲ့ညီတဲ့ အလေ့အကျင့်များကို ဆက်လက်လုပ်ပြီး ဒီအရာများကို စဉ်းစားကြည့်ပါ:\n\n• ပုံမှန် စိတ်ခံစားမှု စစ်ဆေးခြင်း\n• စိတ်ဖိစီးမှု ကာကွယ်ရေး နည်းလမ်းများ\n• သင့်ရဲ့ အထောက်အပံ့ ကွန်ယက် တည်ဆောက်ခြင်း\n\nကျန်းမာရေး အရင်းအမြစ်များကို လေ့လာချင်ပါသလား?",
        id: "🌟 Penilaian Anda menunjukkan gejala minimal.\n\nIni positif! Anda menunjukkan kesehatan mental yang baik. Pertahankan kebiasaan sehat dan pertimbangkan:\n\n• Pemeriksaan suasana hati secara teratur\n• Teknik pencegahan stres\n• Membangun jaringan dukungan Anda\n\nApakah Anda ingin menjelajahi sumber daya kesehatan?"
      },
      phq4_result_moderate: {
        en: "🟡 Your assessment indicates moderate symptoms that deserve attention.\n\nI recommend connecting with professional support. You're taking a positive step by reaching out.\n\n📞 Professional counseling resources\n👥 Peer support groups\n📚 Self-help materials\n🆘 Crisis support if needed\n\nYou don't have to face this alone. What type of support interests you most?",
        zh: "🟡 您的评估表明中度症状值得关注。\n\n我建议联系专业支持。您主动寻求帮助是积极的一步。\n\n📞 专业咨询资源\n👥 同伴支持小组\n📚 自助材料\n🆘 必要时的危机支持\n\n您不必独自面对。您最感兴趣的是哪种类型的支持？",
        bn: "🟡 আপনার মূল্যায়ন মধ্যম মাত্রার উপসর্গ নির্দেশ করে যা মনোযোগ দেওয়ার যোগ্য।\n\nআমি পেশাদার সহায়তার সাথে সংযোগ করার সুপারিশ করি। সাহায্য চাওয়ার মাধ্যমে আপনি একটি ইতিবাচক পদক্ষেপ নিচ্ছেন।\n\n📞 পেশাদার কাউন্সেলিং সংস্থান\n👥 সহকর্মী সহায়তা গ্রুপ\n📚 স্ব-সহায়তা উপকরণ\n🆘 প্রয়োজনে সংকট সহায়তা\n\nআপনাকে একা এর মুখোমুখি হতে হবে না। কোন ধরনের সহায়তা আপনার সবচেয়ে আগ্রহী?",
        ta: "🟡 உங்கள் மதிப்பீடு கவனம் தேவைப்படும் மிதமான அறிகுறிகளைக் குறிக்கிறது।\n\nதொழில்முறை ஆதரவுடன்இணைக்க நான் பரிந்துரைக்கிறேன். உதவி கேட்பதன் மூலம் நீங்கள் நேர்மறையான அடியெடுத்து வைக்கிறீர்கள்.\n\n📞 தொழில்முறை ஆலோசனை வளங்கள்\n👥 சக ஆதரவு குழுக்கள்\n📚 சுய உதவி பொருட்கள்\n🆘 தேவைப்பட்டால் நெருக்கடி ஆதரவு\n\nநீங்கள் இதை தனியாக எதிர்கொள்ள வேண்டியதில்லை. எந்த வகையான ஆதரவு உங்களுக்கு மிகவும் ஆர்வமாக உள்ளது?",
        my: "🟡 သင့်အကဲဖြတ်မှုက အာရုံစိုက်ရမည့် အလယ်အလတ် လက္ခဏာများကို ညွှန်ပြပါတယ်။\n\nပရော်ဖက်ရှင်နယ် အကူအညီနှင့် ဆက်သွယ်ဖို့ ကျွန်တော် အကြံပြုပါတယ်။ အကူအညီတောင်းခြင်းဖြင့် သင်က အပြုသဘောဆောင်တဲ့ ခြေလှမ်း တစ်လှမ်းကို လှမ်းနေပါတယ်။\n\n📞 ပရော်ဖက်ရှင်နယ် အကြံပေးခြင်း အရင်းအမြစ်များ\n👥 လုပ်ဖော်ကိုင်ဖက် အထောက်အပံ့ အုပ်စုများ\n📚 ကိုယ်တိုင်ကူညီ ပစ္စည်းများ\n🆘 လိုအပ်လျှင် အကြပ်အတည်း အကူအညီ\n\nသင် ဒါကို တစ်ယောက်တည်း ရင်ဆိုင်စရာ မလိုပါ။ ဘယ်လို အကူအညီမျိုးကို အများဆုံး စိတ်ဝင်စားပါသလဲ?",
        id: "🟡 Penilaian Anda menunjukkan gejala moderat yang patut diperhatikan.\n\nSaya merekomendasikan untuk terhubung dengan dukungan profesional. Anda mengambil langkah positif dengan mencari bantuan.\n\n📞 Sumber konseling profesional\n👥 Kelompok dukungan sebaya\n📚 Materi bantuan diri\n🆘 Dukungan krisis jika diperlukan\n\nAnda tidak harus menghadapi ini sendirian. Jenis dukungan apa yang paling menarik bagi Anda?"
      }
      // Add more result variations and other localized texts...
    };

    const textSet = texts[key];
    if (!textSet) return key;
    
    return textSet[language] || textSet.en || key;
  }
}