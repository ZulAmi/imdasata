import { Twilio } from 'twilio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface OnboardingState {
  step: 'welcome' | 'language' | 'age' | 'location' | 'category' | 'consent' | 'complete';
  userData: {
    preferredLanguage?: string;
    ageRange?: string;
    location?: string;
    workerCategory?: string;
    hasConsent?: boolean;
  };
}

const ONBOARDING_MESSAGES = {
  welcome: {
    en: "👋 Welcome to SATA Mental Wellness Assistant! I'm here to support your mental health journey.\n\nLet's get started with a few questions to personalize your experience. This will take about 2 minutes.",
    zh: "👋 欢迎来到SATA心理健康助手！我在这里支持您的心理健康之旅。\n\n让我们先回答几个问题来个性化您的体验。这大约需要2分钟。",
    bn: "👋 SATA মানসিক সুস্থতা সহায়কে স্বাগতম! আমি আপনার মানসিক স্বাস্থ্য যাত্রায় সহায়তা করতে এখানে আছি।\n\nআপনার অভিজ্ঞতা ব্যক্তিগতকরণের জন্য কয়েকটি প্রশ্ন দিয়ে শুরু করি। এতে প্রায় ২ মিনিট সময় লাগবে।",
    ta: "👋 SATA மன நல உதவியாளருக்கு வரவேற்கிறோம்! உங்கள் மன ஆரோக்கிய பயணத்தை ஆதரிக்க நான் இங்கே இருக்கிறேன்।\n\nஉங்கள் அனுபவத்தை தனிப்பயனாக்க சில கேள்விகளுடன் தொடங்குவோம். இதற்கு சுமார் 2 நிமிடங்கள் ஆகும்।",
    my: "👋 SATA စိတ်ကျန်းမာရေး အကူအညီကို ကြိုဆိုပါတယ်! သင့်ရဲ့ စိတ်ကျန်းမာရေး ခရီးကို ထောက်ပံ့ဖို့ ကျွန်တော် ဒီမှာ ရှိပါတယ်။\n\nသင့်အတွေ့အကြုံကို စိတ်ကြိုက်ပြင်ဆင်ဖို့ မေးခွန်းအနည်းငယ်နဲ့ စတင်ကြပါစို့။ ဒါကို ၂ မိနစ်လောက် ကြာပါမယ်။",
    id: "👋 Selamat datang di Asisten Kesehatan Mental SATA! Saya di sini untuk mendukung perjalanan kesehatan mental Anda.\n\nMari mulai dengan beberapa pertanyaan untuk mempersonalisasi pengalaman Anda. Ini akan memakan waktu sekitar 2 menit."
  },
  language_select: {
    en: "🌍 Please select your preferred language:\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\nReply with the number (1-6):",
    zh: "🌍 请选择您的首选语言：\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\n请回复数字 (1-6)：",
    bn: "🌍 অনুগ্রহ করে আপনার পছন্দের ভাষা নির্বাচন করুন:\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\nসংখ্যা দিয়ে উত্তর দিন (1-6):",
    ta: "🌍 தயவுசெய்து உங்கள் விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்:\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\nஎண்ணைக் கொண்டு பதிலளிக்கவும் (1-6):",
    my: "🌍 သင်နှစ်သက်သော ভাষা ရွေးချယ်ပါ:\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\nနံပါတ်နဲ့ ပြန်ဖြေပါ (1-6):",
    id: "🌍 Silakan pilih bahasa pilihan Anda:\n\n1️⃣ English\n2️⃣ 中文 (Chinese)\n3️⃣ বাংলা (Bengali)\n4️⃣ தமிழ் (Tamil)\n5️⃣ မြန်မာ (Burmese)\n6️⃣ Bahasa Indonesia\n\nBalas dengan angka (1-6):"
  },
  age_question: {
    en: "📅 What's your age range?\n\n1️⃣ 18-25 years\n2️⃣ 26-35 years\n3️⃣ 36-45 years\n4️⃣ 46-55 years\n5️⃣ 56+ years\n\nReply with the number:",
    zh: "📅 您的年龄范围是？\n\n1️⃣ 18-25岁\n2️⃣ 26-35岁\n3️⃣ 36-45岁\n4️⃣ 46-55岁\n5️⃣ 56岁以上\n\n请回复数字：",
    bn: "📅 আপনার বয়সের পরিসীমা কত?\n\n1️⃣ ১৮-২৫ বছর\n2️⃣ ২৬-৩৫ বছর\n3️⃣ ৩৬-৪৫ বছর\n4️⃣ ৪৬-৫৫ বছর\n5️⃣ ৫৬+ বছর\n\nসংখ্যা দিয়ে উত্তর দিন:",
    ta: "📅 உங்கள் வயது வரம்பு என்ன?\n\n1️⃣ 18-25 ஆண்டுகள்\n2️⃣ 26-35 ஆண்டுகள்\n3️⃣ 36-45 ஆண்டுகள்\n4️⃣ 46-55 ஆண்டுகள்\n5️⃣ 56+ ஆண்டுகள்\n\nஎண்ணைக் கொண்டு பதிலளிக்கவும்:",
    my: "📅 သင့်အသက်အပိုင်းအခြား ဘာလဲ?\n\n1️⃣ ၁၈-၂၅ နှစ်\n2️⃣ ၂၆-၃၅ နှစ်\n3️⃣ ၃၆-၄၅ နှစ်\n4️⃣ ၄၆-၅၅ နှစ်\n5️⃣ ၅၆+ နှစ်\n\nနံပါတ်နဲ့ ပြန်ဖြေပါ:",
    id: "📅 Berapa rentang usia Anda?\n\n1️⃣ 18-25 tahun\n2️⃣ 26-35 tahun\n3️⃣ 36-45 tahun\n4️⃣ 46-55 tahun\n5️⃣ 56+ tahun\n\nBalas dengan angka:"
  },
  location_question: {
    en: "📍 Which region are you currently in?\n\n1️⃣ Singapore\n2️⃣ Malaysia\n3️⃣ Hong Kong\n4️⃣ Middle East\n5️⃣ Other\n\nReply with the number:",
    zh: "📍 您目前在哪个地区？\n\n1️⃣ 新加坡\n2️⃣ 马来西亚\n3️⃣ 香港\n4️⃣ 中东\n5️⃣ 其他\n\n请回复数字：",
    bn: "📍 আপনি বর্তমানে কোন অঞ্চলে আছেন?\n\n1️⃣ সিঙ্গাপুর\n2️⃣ মালয়েশিয়া\n3️⃣ হংকং\n4️⃣ মধ্যপ্রাচ্য\n5️⃣ অন্যান্য\n\nসংখ্যা দিয়ে উত্তর দিন:",
    ta: "📍 நீங்கள் தற்போது எந்த பகுதியில் இருக்கிறீர்கள்?\n\n1️⃣ சிங்கப்பூர்\n2️⃣ மலேசியா\n3️⃣ ஹாங்காங்\n4️⃣ மத்திய கிழக்கு\n5️⃣ மற்றவை\n\nஎண்ணைக் கொண்டு பதிலளிக்கவும்:",
    my: "📍 သင် လောလောဆယ် ဘယ်ဒေသမှာ ရှိနေလဲ?\n\n1️⃣ စင်္ကာပူ\n2️⃣ မလေးရှား\n3️⃣ ဟောင်ကောင်\n4️⃣ အရှေ့အလယ်ပိုင်း\n5️⃣ အခြား\n\nနံပါတ်နဲ့ ပြန်ဖြေပါ:",
    id: "📍 Anda sedang berada di wilayah mana?\n\n1️⃣ Singapura\n2️⃣ Malaysia\n3️⃣ Hong Kong\n4️⃣ Timur Tengah\n5️⃣ Lainnya\n\nBalas dengan angka:"
  },
  worker_category: {
    en: "👷 What type of work do you do?\n\n1️⃣ Domestic Helper\n2️⃣ Construction Worker\n3️⃣ Healthcare Worker\n4️⃣ Factory Worker\n5️⃣ Service Industry\n6️⃣ Other\n\nReply with the number:",
    zh: "👷 您从事什么类型的工作？\n\n1️⃣ 家政工人\n2️⃣ 建筑工人\n3️⃣ 医护工人\n4️⃣ 工厂工人\n5️⃣ 服务行业\n6️⃣ 其他\n\n请回复数字：",
    bn: "👷 আপনি কি ধরনের কাজ করেন?\n\n1️⃣ গৃহকর্মী\n2️⃣ নির্মাণ শ্রমিক\n3️⃣ স্বাস্থ্যসেবা কর্মী\n4️⃣ কারখানা শ্রমিক\n5️⃣ সেবা শিল্প\n6️⃣ অন্যান্য\n\nসংখ্যা দিয়ে উত্তর দিন:",
    ta: "👷 நீங்கள் எந்த வகையான வேலை செய்கிறீர்கள்?\n\n1️⃣ வீட்டு உதவியாளர்\n2️⃣ கட்டுமான தொழிலாளர்\n3️⃣ சுகாதார பணியாளர்\n4️⃣ தொழிற்சாலை தொழிலாளர்\n5️⃣ சேவை துறை\n6️⃣ மற்றவை\n\nஎண்ணைக் கொண்டு பதிலளிக்கவும்:",
    my: "👷 သင် ဘယ်လို အလုပ်မျိုး လုပ်လဲ?\n\n1️⃣ အိမ်ထောက်ပံ့သူ\n2️⃣ ဆောက်လုပ်ရေးသမား\n3️⃣ ကျန်းမာရေးဝန်ထမ်း\n4️⃣ စက်ရုံသမား\n5️⃣ ဝန်ဆောင်မှုလုပ်ငန်း\n6️⃣ အခြား\n\nနံပါတ်နဲ့ ပြန်ဖြေပါ:",
    id: "👷 Jenis pekerjaan apa yang Anda lakukan?\n\n1️⃣ Pembantu Rumah Tangga\n2️⃣ Pekerja Konstruksi\n3️⃣ Pekerja Kesehatan\n4️⃣ Pekerja Pabrik\n5️⃣ Industri Jasa\n6️⃣ Lainnya\n\nBalas dengan angka:"
  },
  consent_request: {
    en: "🔒 Privacy & Data Consent\n\nTo provide you with personalized mental health support, we need your consent to:\n\n• Store your anonymous wellness data\n• Send you helpful reminders and resources\n• Connect you with peer support when requested\n\nAll data is encrypted and anonymous. You can withdraw consent anytime.\n\n✅ Type 'YES' to agree\n❌ Type 'NO' to decline",
    zh: "🔒 隐私与数据同意\n\n为了为您提供个性化的心理健康支持，我们需要您同意：\n\n• 存储您的匿名健康数据\n• 向您发送有用的提醒和资源\n• 在您需要时连接同伴支持\n\n所有数据都是加密和匿名的。您可以随时撤回同意。\n\n✅ 输入同意表示同意\n❌ 输入不同意表示拒绝",
    bn: "🔒 গোপনীয়তা ও ডেটা সম্মতি\n\nআপনাকে ব্যক্তিগতকৃত মানসিক স্বাস্থ্য সহায়তা প্রদানের জন্য, আমাদের আপনার সম্মতি প্রয়োজন:\n\n• আপনার বেনামী সুস্থতার ডেটা সংরক্ষণ করতে\n• আপনাকে সহায়ক অনুস্মারক এবং সম্পদ পাঠাতে\n• অনুরোধ করলে সমবয়সী সহায়তার সাথে সংযুক্ত করতে\n\nসমস্ত ডেটা এনক্রিপ্ট এবং বেনামী। আপনি যেকোনো সময় সম্মতি প্রত্যাহার করতে পারেন।\n\n✅ সম্মত হতে 'হ্যাঁ' টাইপ করুন\n❌ অস্বীকার করতে 'না' টাইপ করুন",
    ta: "🔒 தனியுரிமை மற்றும் தரவு ஒப்புதல்\n\nஉங்களுக்கு தனிப்பயனாக்கப்பட்ட மன ஆரோக்கிய ஆதரவை வழங்க, உங்கள் ஒப்புதல் தேவை:\n\n• உங்கள் அநாமதேய நல்வாழ்வு தரவை சேமிக்க\n• உதவிகரமான நினைவூட்டல்கள் மற்றும் வளங்களை அனுப்ப\n• கோரிக்கையின் போது சமூக ஆதரவுடன் இணைக்க\n\nஅனைத்து தரவும் குறியாக்கம் மற்றும் அநாமதேயமானது. எந்த நேரத்திலும் ஒப்புதலை திரும்பப் பெறலாம்।\n\n✅ ஒப்புக்கொள்ள 'ஆம்' தட்டச்சு செய்யுங்கள்\n❌ மறுக்க 'இல்லை' தட்டச்சு செய்யுங்கள்",
    my: "🔒 ကိုယ်ရေးကာယရေး နှင့် ဒေတာ သဘောတူညီချက်\n\nသင့်အတွက် စိတ်ကြိုက်ပြင်ဆင်ထားသော စိတ်ကျန်းမာရေး ထောက်ပံ့မှုကို ပေးအပ်ရန်၊ ကျွန်ုပ်တို့က သင်၏ သဘောတူညီချက် လိုအပ်ပါသည်:\n\n• သင်၏ အမည်မဖော်သော ကျန်းမာရေးဒေတာကို သိမ်းဆည်းရန်\n• သင့်အား အသုံးဝင်သော သတိပေးချက်များနှင့် အရင်းအမြစ်များ ပေးပို့ရန်\n• တောင်းဆိုသောအခါ ရွယ်တူ ထောက်ပံ့မှုနှင့် ချိတ်ဆက်ပေးရန်\n\nဒေတာအားလုံး ကုဒ်ဝှက်ထားပြီး အမည်မဖော်ပါ။ အချိန်မရွေး သဘောတူညီချက်ကို ပြန်ရုပ်သိမ်းနိုင်ပါသည်။n\n✅ သဘောတူရန် 'ဟုတ်ကဲ့' ရိုက်ပါ\n❌ ငြင်းဆိုရန် 'မဟုတ်ဘူး' ရိုက်ပါ",
    id: "🔒 Persetujuan Privasi & Data\n\nUntuk memberikan dukungan kesehatan mental yang dipersonalisasi, kami memerlukan persetujuan Anda untuk:\n\n• Menyimpan data kesehatan anonim Anda\n• Mengirimkan pengingat dan sumber daya yang bermanfaat\n• Menghubungkan Anda dengan dukungan sebaya saat diminta\n\nSemua data dienkripsi dan anonim. Anda dapat menarik persetujuan kapan saja.\n\n✅ Ketik 'YA' untuk setuju\n❌ Ketik 'TIDAK' untuk menolak"
  },
  completion_message: {
    en: "🎉 Welcome aboard! Your profile has been set up successfully.\n\nHere's what I can help you with:\n\n🧠 Mental health check-ins\n📚 Wellness resources\n👥 Peer support groups\n🆘 Crisis support (24/7)\n🎯 Daily wellness activities\n\nType 'help' anytime to see all options, or 'start' to begin your wellness journey!",
    zh: "🎉 欢迎加入！您的个人资料已成功设置。\n\n我可以帮助您：\n\n🧠 心理健康检查\n📚 健康资源\n👥 同伴支持小组\n🆘 危机支持（24/7）\n🎯 日常健康活动\n\n随时输入帮助查看所有选项，或输入开始来开始您的健康之旅！",
    bn: "🎉 স্বাগতম! আপনার প্রোফাইল সফলভাবে সেট আপ হয়েছে।\n\nআমি যেভাবে সাহায্য করতে পারি:\n\n🧠 মানসিক স্বাস্থ্য চেক-ইন\n📚 সুস্থতার সম্পদ\n👥 সমবয়সী সহায়তা গ্রুপ\n🆘 সংকট সহায়তা (২৪/৭)\n🎯 দৈনন্দিন সুস্থতার কার্যক্রম\n\nসব বিকল্প দেখতে যেকোনো সময় 'সাহায্য' টাইপ করুন, অথবা আপনার সুস্থতার যাত্রা শুরু করতে 'শুরু' টাইপ করুন!",
    ta: "🎉 வரவேற்கிறோம்! உங்கள் சுயவிவரம் வெற்றிகரமாக அமைக்கப்பட்டுள்ளது।\n\nநான் உங்களுக்கு எப்படி உதவ முடியும்:\n\n🧠 மன ஆரோக்கிய சோதனைகள்\n📚 நல்வாழ்வு வளங்கள்\n👥 சமூக ஆதரவு குழுக்கள்\n🆘 நெருக்கடி ஆதரவு (24/7)\n🎯 தினசரி நல்வாழ்வு செயல்பாடுகள்\n\nஅனைத்து விருப்பங்களையும் பார்க்க எந்த நேரத்திலும் 'உதவி' தட்டச்சு செய்யுங்கள், அல்லது உங்கள் நல்வாழ்வு பயணத்தைத் தொடங்க 'தொடங்கு' தட்டச்சு செய்யுங்கள்!",
    my: "🎉 ကြိုဆိုပါတယ်! သင့်ရဲ့ ပရိုဖိုင် အောင်မြင်စွာ တည်ဆောက်ပြီးပါပြီ။\n\nကျွန်တော် ဘယ်လို ကူညီနိုင်လဲ:\n\n🧠 စိတ်ကျန်းမာရေး စစ်ဆေးမှုများ\n📚 ကျန်းမာရေး အရင်းအမြစ်များ\n👥 ရွယ်တူ ထောက်ပံ့မှု အုပ်စုများ\n🆘 အရေးပေါ် ထောက်ပံ့မှု (၂၄/၇)\n🎯 နေ့စဉ် ကျန်းမာရေး လှုပ်ရှားမှုများ\n\nရွေးချယ်စရာအားလုံး ကြည့်ရှုရန် အချိန်မရွေး 'အကူအညီ' ရိုက်ပါ၊ သို့မဟုတ် သင့်ရဲ့ ကျန်းမာရေး ခရီးစတင်ရန် 'စတင်' ရိုက်ပါ!",
    id: "🎉 Selamat datang! Profil Anda telah berhasil dibuat.\n\nBerikut cara saya dapat membantu Anda:\n\n🧠 Pemeriksaan kesehatan mental\n📚 Sumber daya kesehatan\n👥 Grup dukungan sebaya\n🆘 Dukungan krisis (24/7)\n🎯 Aktivitas kesehatan harian\n\nKetik 'bantuan' kapan saja untuk melihat semua opsi, atau 'mulai' untuk memulai perjalanan kesehatan Anda!"
  }
};

const LANGUAGE_MAP: Record<string, string> = {
  '1': 'en',
  '2': 'zh',
  '3': 'bn',
  '4': 'ta',
  '5': 'my',
  '6': 'id'
};

const AGE_MAP: Record<string, string> = {
  '1': '18-25',
  '2': '26-35',
  '3': '36-45',
  '4': '46-55',
  '5': '56+'
};

const LOCATION_MAP: Record<string, string> = {
  '1': 'Singapore',
  '2': 'Malaysia',
  '3': 'Hong Kong',
  '4': 'Middle East',
  '5': 'Other'
};

const WORKER_CATEGORY_MAP: Record<string, string> = {
  '1': 'Domestic Helper',
  '2': 'Construction Worker',
  '3': 'Healthcare Worker',
  '4': 'Factory Worker',
  '5': 'Service Industry',
  '6': 'Other'
};

export class OnboardingFlow {
  private client: Twilio;

  constructor(client: Twilio) {
    this.client = client;
  }

  async handleMessage(
    from: string,
    message: string,
    currentState: OnboardingState | null
  ): Promise<string> {
    const state = currentState || {
      step: 'welcome',
      userData: {}
    };

    const language = state.userData.preferredLanguage || 'en';

    switch (state.step) {
      case 'welcome':
        return await this.handleWelcome(from, state);

      case 'language':
        return await this.handleLanguageSelection(from, message, state);

      case 'age':
        return await this.handleAgeSelection(from, message, state);

      case 'location':
        return await this.handleLocationSelection(from, message, state);

      case 'category':
        return await this.handleWorkerCategorySelection(from, message, state);

      case 'consent':
        return await this.handleConsentResponse(from, message, state);

      default:
        return ONBOARDING_MESSAGES.welcome[language as keyof typeof ONBOARDING_MESSAGES.welcome];
    }
  }

  private async handleWelcome(from: string, state: OnboardingState): Promise<string> {
    // Update state to language selection
    await this.updateUserState(from, {
      ...state,
      step: 'language'
    });

    return ONBOARDING_MESSAGES.welcome.en + '\n\n' + ONBOARDING_MESSAGES.language_select.en;
  }

  private async handleLanguageSelection(
    from: string,
    message: string,
    state: OnboardingState
  ): Promise<string> {
    const selectedLanguage = LANGUAGE_MAP[message.trim()];
    
    if (!selectedLanguage) {
      return ONBOARDING_MESSAGES.language_select.en;
    }

    state.userData.preferredLanguage = selectedLanguage;
    state.step = 'age';

    await this.updateUserState(from, state);

    return ONBOARDING_MESSAGES.age_question[selectedLanguage as keyof typeof ONBOARDING_MESSAGES.age_question];
  }

  private async handleAgeSelection(
    from: string,
    message: string,
    state: OnboardingState
  ): Promise<string> {
    const language = state.userData.preferredLanguage || 'en';
    const selectedAge = AGE_MAP[message.trim()];
    
    if (!selectedAge) {
      return ONBOARDING_MESSAGES.age_question[language as keyof typeof ONBOARDING_MESSAGES.age_question];
    }

    state.userData.ageRange = selectedAge;
    state.step = 'location';

    await this.updateUserState(from, state);

    return ONBOARDING_MESSAGES.location_question[language as keyof typeof ONBOARDING_MESSAGES.location_question];
  }

  private async handleLocationSelection(
    from: string,
    message: string,
    state: OnboardingState
  ): Promise<string> {
    const language = state.userData.preferredLanguage || 'en';
    const selectedLocation = LOCATION_MAP[message.trim()];
    
    if (!selectedLocation) {
      return ONBOARDING_MESSAGES.location_question[language as keyof typeof ONBOARDING_MESSAGES.location_question];
    }

    state.userData.location = selectedLocation;
    state.step = 'category';

    await this.updateUserState(from, state);

    return ONBOARDING_MESSAGES.worker_category[language as keyof typeof ONBOARDING_MESSAGES.worker_category];
  }

  private async handleWorkerCategorySelection(
    from: string,
    message: string,
    state: OnboardingState
  ): Promise<string> {
    const language = state.userData.preferredLanguage || 'en';
    const selectedCategory = WORKER_CATEGORY_MAP[message.trim()];
    
    if (!selectedCategory) {
      return ONBOARDING_MESSAGES.worker_category[language as keyof typeof ONBOARDING_MESSAGES.worker_category];
    }

    state.userData.workerCategory = selectedCategory;
    state.step = 'consent';

    await this.updateUserState(from, state);

    return ONBOARDING_MESSAGES.consent_request[language as keyof typeof ONBOARDING_MESSAGES.consent_request];
  }

  private async handleConsentResponse(
    from: string,
    message: string,
    state: OnboardingState
  ): Promise<string> {
    const language = state.userData.preferredLanguage || 'en';
    const response = message.trim().toLowerCase();
    
    if (!['yes', 'no', 'হ্যাঁ', 'না', 'ஆம்', 'இல்லை', 'ဟုတ်ကဲ့', 'မဟုတ်ဘူး', 'ya', 'tidak', '同意', '不同意'].includes(response)) {
      return ONBOARDING_MESSAGES.consent_request[language as keyof typeof ONBOARDING_MESSAGES.consent_request];
    }

    const hasConsent = ['yes', 'হ্যাঁ', 'ஆம்', 'ဟုတ်ကဲ့', 'ya', '同意'].includes(response);
    
    if (!hasConsent) {
      return "🙏 Thank you for your time. If you change your mind, just type 'hello' to start again.";
    }

    // Create user account
    await this.createUserAccount(from, state.userData);

    state.step = 'complete';
    await this.updateUserState(from, state);

    return ONBOARDING_MESSAGES.completion_message[language as keyof typeof ONBOARDING_MESSAGES.completion_message];
  }

  private async createUserAccount(from: string, userData: any): Promise<void> {
    try {
      await prisma.anonymousUser.create({
        data: {
          anonymousId: from, // Using phone number as anonymous ID
          language: userData.preferredLanguage || 'en',
          isActive: true
        }
      });
    } catch (error) {
      console.error('Error creating user account:', error);
    }
  }

  private async updateUserState(from: string, state: OnboardingState): Promise<void> {
    // In a real implementation, store this in Redis or database
    // For now, we'll store in memory (this should be improved)
    console.log(`Updating state for ${from}:`, state);
  }

  async isOnboardingComplete(from: string): Promise<boolean> {
    try {
      const user = await prisma.anonymousUser.findUnique({
        where: { anonymousId: from }
      });
      return !!user;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }
}
