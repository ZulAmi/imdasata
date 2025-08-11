import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create mental health resources
  const emergencyHotline = await prisma.mentalHealthResource.create({
    data: {
      title: {
        en: "24/7 Crisis Hotline",
        zh: "24/7 危機熱線",
        bn: "২৪/৭ সংকট হটলাইন",
        ta: "24/7 நெருக்கடி ஹாட்லைன்",
        my: "24/7 အကျပ်အတည်း ဖုန်းလိုင်း",
        id: "Hotline Krisis 24/7"
      },
      description: {
        en: "Immediate support for mental health emergencies",
        zh: "心理健康緊急情況的即時支援",
        bn: "মানসিক স্বাস্থ্য জরুরী অবস্থার জন্য তাৎক্ষণিক সহায়তা",
        ta: "மனநல அவசரநிலைகளுக்கான உடனடி ஆதரவு",
        my: "စိတ်ကျန်းမာရေး အရေးပေါ်အခြေအနေများအတွက် ချက်ချင်းပံ့ပိုးမှု",
        id: "Dukungan segera untuk keadaan darurat kesehatan mental"
      },
      category: "crisis",
      resourceType: "hotline",
      contactInfo: {
        phone: "1-800-CRISIS",
        available24_7: true
      },
      targetAudience: ["migrant_workers", "general"],
      languages: ["en", "zh", "bn", "ta", "my", "id"],
      isFree: true,
      isEmergency: true,
      priority: 100
    }
  });

  const counselingService = await prisma.mentalHealthResource.create({
    data: {
      title: {
        en: "Free Counseling for Migrant Workers",
        zh: "外籍勞工免費諮詢",
        bn: "অভিবাসী শ্রমিকদের জন্য বিনামূল্যে পরামর্শ",
        ta: "புலம்பெயர்ந்த தொழிலாளர்களுக்கான இலவச ஆலோசனை",
        my: "ရွှေ့ပြောင်းအလုပ်သမားများအတွက် အခမဲ့အကြံပေးခြင်း",
        id: "Konseling Gratis untuk Pekerja Migran"
      },
      description: {
        en: "Professional counseling services in your native language",
        zh: "以您的母語提供專業諮詢服務",
        bn: "আপনার মাতৃভাষায় পেশাদার পরামর্শ সেবা",
        ta: "உங்கள் தாய்மொழியில் தொழில்முறை ஆலோசனை சேவைகள்",
        my: "သင့်မိခင်ဘာသာစကားဖြင့် ပရော်ဖက်ရှင်နယ် အကြံပေးဝန်ဆောင်မှုများ",
        id: "Layanan konseling profesional dalam bahasa ibu Anda"
      },
      category: "counseling",
      resourceType: "website",
      contactInfo: {
        website: "https://counseling-service.example.com",
        phone: "+1-555-HELP",
        email: "help@counseling.example.com"
      },
      availability: {
        hours: "9 AM - 6 PM",
        days: "Monday to Friday",
        languages: ["en", "zh", "bn", "ta", "my", "id"]
      },
      targetAudience: ["migrant_workers"],
      languages: ["en", "zh", "bn", "ta", "my", "id"],
      isFree: true,
      priority: 80
    }
  });

  // Create support groups
  const generalSupportGroup = await prisma.supportGroup.create({
    data: {
      name: {
        en: "General Mental Wellness Support",
        zh: "一般心理健康支援",
        bn: "সাধারণ মানসিক সুস্থতা সহায়তা",
        ta: "பொது மன நல ஆதரவு",
        my: "ယေဘုယျ စိတ်ကျန်းမာရေး ပံ့ပိုးမှု",
        id: "Dukungan Kesejahteraan Mental Umum"
      },
      description: {
        en: "A safe space for sharing experiences and mutual support",
        zh: "分享經驗和相互支援的安全空間",
        bn: "অভিজ্ঞতা ভাগাভাগি এবং পারস্পরিক সহায়তার জন্য একটি নিরাপদ স্থান",
        ta: "அனுபவங்களைப் பகிர்வதற்கும் பரஸ்பர ஆதரவுக்கும் ஒரு பாதுகாப்பான இடம்",
        my: "အတွေ့အကြုံများမျှဝေရန်နှင့် အပြန်အလှန်ပံ့ပိုးမှုအတွက် လုံခြုံသောနေရာ",
        id: "Ruang aman untuk berbagi pengalaman dan saling mendukung"
      },
      category: "general",
      language: "en",
      maxMembers: 50
    }
  });

  const workplaceStressGroup = await prisma.supportGroup.create({
    data: {
      name: {
        en: "Workplace Stress Management",
        zh: "職場壓力管理",
        bn: "কর্মক্ষেত্রের চাপ ব্যবস্থাপনা",
        ta: "பணியிட அழுத்த மேலாண்மை",
        my: "အလုပ်ခွင်စိတ်ဖိစီးမှု ကိုင်တွယ်မှု",
        id: "Manajemen Stres Kerja"
      },
      description: {
        en: "Learn coping strategies for work-related stress and challenges",
        zh: "學習應對工作相關壓力和挑戰的策略",
        bn: "কাজ-সংক্রান্ত চাপ এবং চ্যালেঞ্জের সাথে মোকাবিলার কৌশল শিখুন",
        ta: "வேலை தொடர்பான அழுத்தம் மற்றும் சவால்களை சமாளிக்கும் உத்திகளை கற்றுக்கொள்ளுங்கள்",
        my: "အလုပ်နှင့်ပတ်သက်သော စိတ်ဖိစီးမှုများနှင့် စိန်ခေါ်မှုများကို ကိုင်တွယ်ရန် နည်းလမ်းများကို လေ့လာပါ",
        id: "Pelajari strategi mengatasi stres dan tantangan terkait pekerjaan"
      },
      category: "workplace_stress",
      language: "en",
      maxMembers: 30
    }
  });

  console.log('Database seeded successfully!');
  console.log(`Created ${await prisma.mentalHealthResource.count()} mental health resources`);
  console.log(`Created ${await prisma.supportGroup.count()} support groups`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
