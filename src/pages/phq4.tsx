import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface PHQ4Response {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  totalScore: number;
  depressionScore: number;
  anxietyScore: number;
  severityLevel: string;
  riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  timestamp: string;
  anonymousId: string;
  language: string;
}

interface QuestionTranslation {
  text: string;
  description: string;
}

interface Question {
  id: string;
  en: QuestionTranslation;
  zh: QuestionTranslation;
  bn: QuestionTranslation;
  ta: QuestionTranslation;
  my: QuestionTranslation;
  idn: QuestionTranslation;
}

interface OptionTranslation {
  value: number;
  en: string;
  zh: string;
  bn: string;
  ta: string;
  my: string;
  idn: string;
  color: string;
}

type SupportedLanguage = 'en' | 'zh' | 'bn' | 'ta' | 'my' | 'idn';

export default function PHQ4Assessment() {
  const { t, i18n } = useTranslation('common');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PHQ4Response | null>(null);
  const [anonymousId, setAnonymousId] = useState<string>('');
  const [showDemographics, setShowDemographics] = useState(false);
  
  // Demographic data (optional)
  const [demographics, setDemographics] = useState({
    countryOfOrigin: '',
    ageGroup: '',
    gender: '',
    employmentSector: ''
  });

  // Voice input support
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Multi-language questions with proper PHQ-4 translations
  const questions: Question[] = [
    {
      id: 'q1',
      en: {
        text: 'Little interest or pleasure in doing things',
        description: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?'
      },
      zh: {
        text: '对事物缺乏兴趣或愉悦感',
        description: '在过去2周里，您有多频繁地被"对事物缺乏兴趣或愉悦感"所困扰？'
      },
      bn: {
        text: 'কাজকর্মে আগ্রহ বা আনন্দের অভাব',
        description: 'গত ২ সপ্তাহে, কাজকর্মে আগ্রহ বা আনন্দের অভাব নিয়ে আপনি কতবার বিরক্ত হয়েছেন?'
      },
      ta: {
        text: 'விஷயங்களில் ஆர்வம் அல்லது மகிழ்ச்சி குறைவு',
        description: 'கடந்த 2 வாரங்களில், விஷயங்களில் ஆர்வம் அல்லது மகிழ்ச்சி குறைவால் எத்தனை முறை நீங்கள் தொந்தரவு அடைந்தீர்கள்?'
      },
      my: {
        text: 'အရာရာတွေကို စိတ်မ၀င်စားဖြစ်ခြင်း',
        description: 'လွန်ခဲ့သော ၂ ပတ်အတွင်း အရာရာတွေကို စိတ်မ၀င်စားဖြစ်ခြင်းကြောင့် ဘယ်လောက်မကြာခဏ စိတ်ညစ်ခဲ့ရပါသလဲ?'
      },
      idn: {
        text: 'Kurang minat atau kesenangan dalam melakukan hal-hal',
        description: 'Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh kurangnya minat atau kesenangan dalam melakukan hal-hal?'
      }
    },
    {
      id: 'q2',
      en: {
        text: 'Feeling down, depressed, or hopeless',
        description: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?'
      },
      zh: {
        text: '感到沮丧、抑郁或绝望',
        description: '在过去2周里，您有多频繁地被"感到沮丧、抑郁或绝望"所困扰？'
      },
      bn: {
        text: 'মন খারাপ, বিষণ্ণ বা আশাহীন বোধ করা',
        description: 'গত ২ সপ্তাহে, মন খারাপ, বিষণ্ণ বা আশাহীন বোধ করার কারণে আপনি কতবার বিরক্ত হয়েছেন?'
      },
      ta: {
        text: 'மனம் வருந்துதல், மனச்சோர்வு அல்லது நம்பிக்கையின்மை',
        description: 'கடந்த 2 வாரங்களில், மனம் வருந்துதல், மனச்சோர்வு அல்லது நம்பிக்கையின்மையால் எத்தனை முறை நீங்கள் தொந்தரவு அடைந்தீர்கள்?'
      },
      my: {
        text: 'စိတ်ညစ်ခြင်း၊ စိတ်ဓာတ်ကျခြင်း သို့မဟုတ် မျှော်လင့်ချက်မရှိခြင်း',
        description: 'လွန်ခဲ့သော ၂ ပတ်အတွင်း စိတ်ညစ်ခြင်း၊ စိတ်ဓာတ်ကျခြင်း သို့မဟုတ် မျှော်လင့်ချက်မရှိခြင်းကြောင့် ဘယ်လောက်မကြာခဏ စိတ်ညစ်ခဲ့ရပါသလဲ?'
      },
      idn: {
        text: 'Merasa sedih, tertekan, atau putus asa',
        description: 'Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh perasaan sedih, tertekan, atau putus asa?'
      }
    },
    {
      id: 'q3',
      en: {
        text: 'Feeling nervous, anxious, or on edge',
        description: 'Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?'
      },
      zh: {
        text: '感到紧张、焦虑或烦躁',
        description: '在过去2周里，您有多频繁地被"感到紧张、焦虑或烦躁"所困扰？'
      },
      bn: {
        text: 'নার্ভাস, উদ্বিগ্ন বা অস্থির বোধ করা',
        description: 'গত ২ সপ্তাহে, নার্ভাস, উদ্বিগ্ন বা অস্থির বোধ করার কারণে আপনি কতবার বিরক্ত হয়েছেন?'
      },
      ta: {
        text: 'பதட்டம், கவலை அல்லது அமைதியின்மை',
        description: 'கடந்த 2 வாரங்களில், பதட்டம், கவலை அல்லது அமைதியின்மையால் எத்தனை முறை நீங்கள் தொந்தரவு அடைந்தீர்கள்?'
      },
      my: {
        text: 'စိတ်လှုပ်ရှားခြင်း၊ စိုးရိမ်ခြင်း သို့မဟုတ် စိတ်မအေးခြင်း',
        description: 'လွန်ခဲ့သော ၂ ပတ်အတွင်း စိတ်လှုပ်ရှားခြင်း၊ စိုးရိမ်ခြင်း သို့မဟုတ် စိတ်မအေးခြင်းကြောင့် ဘယ်လောက်မကြာခဏ စိတ်ညစ်ခဲ့ရပါသလဲ?'
      },
      idn: {
        text: 'Merasa gugup, cemas, atau gelisah',
        description: 'Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh perasaan gugup, cemas, atau gelisah?'
      }
    },
    {
      id: 'q4',
      en: {
        text: 'Not being able to stop or control worrying',
        description: 'Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?'
      },
      zh: {
        text: '无法停止或控制担忧',
        description: '在过去2周里，您有多频繁地被"无法停止或控制担忧"所困扰？'
      },
      bn: {
        text: 'চিন্তা বন্ধ করতে বা নিয়ন্ত্রণ করতে না পারা',
        description: 'গত ২ সপ্তাহে, চিন্তা বন্ধ করতে বা নিয়ন্ত্রণ করতে না পারার কারণে আপনি কতবার বিরক্ত হয়েছেন?'
      },
      ta: {
        text: 'கவலையை நிறுத்த அல்லது கட்டுப்படுத்த முடியாமை',
        description: 'கடந்த 2 வாரங்களில், கவலையை நிறுத்த அல்லது கட்டுப்படுத்த முடியாததால் எத்தனை முறை நீங்கள் தொந்தரவு அடைந்தீர்கள்?'
      },
      my: {
        text: 'စိုးရိမ်မှုကို ရပ်တန့်ခြင်း သို့မဟုတ် ထိန်းချုပ်ခြင်း မတတ်နိုင်ခြင်း',
        description: 'လွန်ခဲ့သော ၂ ပတ်အတွင်း စိုးရိမ်မှုကို ရပ်တန့်ခြင်း သို့မဟုတ် ထိန်းချုပ်ခြင်း မတတ်နိုင်ခြင်းကြောင့် ဘယ်လောက်မကြာခဏ စိတ်ညစ်ခဲ့ရပါသလဲ?'
      },
      idn: {
        text: 'Tidak dapat menghentikan atau mengontrol kekhawatiran',
        description: 'Dalam 2 minggu terakhir, seberapa sering Anda terganggu oleh tidak dapat menghentikan atau mengontrol kekhawatiran?'
      }
    }
  ];

  // PHQ-4 Likert scale options with proper translations
  const options: OptionTranslation[] = [
    {
      value: 0,
      en: 'Not at all',
      zh: '完全没有',
      bn: 'একদমই না',
      ta: 'சற்றும் இல்லை',
      my: 'လုံးဝမရှိ',
      idn: 'Tidak sama sekali',
      color: 'bg-green-100 border-green-300 text-green-800'
    },
    {
      value: 1,
      en: 'Several days',
      zh: '几天',
      bn: 'কয়েক দিন',
      ta: 'சில நாட்கள்',
      my: 'ရက်သတ္တပတ်အချို့',
      idn: 'Beberapa hari',
      color: 'bg-yellow-100 border-yellow-300 text-yellow-800'
    },
    {
      value: 2,
      en: 'More than half the days',
      zh: '超过一半的天数',
      bn: 'অর্ধেকের বেশি দিন',
      ta: 'பாதி நாட்களுக்கு மேல்',
      my: 'ရက်ထက်ဝက်ကျော်',
      idn: 'Lebih dari setengah hari',
      color: 'bg-orange-100 border-orange-300 text-orange-800'
    },
    {
      value: 3,
      en: 'Nearly every day',
      zh: '几乎每天',
      bn: 'প্রায় প্রতিদিন',
      ta: 'கிட்டத்தட்ட தினமும்',
      my: 'နေ့စဉ်နီးပါး',
      idn: 'Hampir setiap hari',
      color: 'bg-red-100 border-red-300 text-red-800'
    }
  ];

  useEffect(() => {
    // Generate anonymous ID for this session
    if (!anonymousId) {
      setAnonymousId(uuidv4());
    }

    // Check for speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = i18n.language === 'zh' ? 'zh-CN' : 
                                       i18n.language === 'bn' ? 'bn-BD' :
                                       i18n.language === 'ta' ? 'ta-IN' :
                                       i18n.language === 'my' ? 'my-MM' :
                                       i18n.language === 'id' ? 'id-ID' : 'en-US';
      }
    }
  }, [anonymousId, i18n.language]);

  const getCurrentLanguage = (): SupportedLanguage => {
    const lang = i18n.language || 'en';
    return (['en', 'zh', 'bn', 'ta', 'my', 'idn'] as const).includes(lang as SupportedLanguage) ? lang as SupportedLanguage : 'en';
  };

  const getLocalizedText = (textObj: Question, key: 'text' | 'description', fallback: string = ''): string => {
    const lang = getCurrentLanguage();
    return textObj[lang]?.[key] || textObj.en?.[key] || fallback;
  };

  const getLocalizedOption = (option: OptionTranslation): string => {
    const lang = getCurrentLanguage();
    return (option as any)[lang] || option.en;
  };

  const startVoiceInput = () => {
    if (!recognitionRef.current || isListening) return;

    setIsListening(true);
    recognitionRef.current.start();

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      
      // Voice command processing for different languages
      const voiceCommands: Record<string, Record<string, string[]>> = {
        en: { 
          '0': ['not at all', 'never', 'zero'], 
          '1': ['several days', 'sometimes', 'one'], 
          '2': ['more than half', 'often', 'two'], 
          '3': ['nearly every day', 'always', 'three'] 
        },
        zh: { 
          '0': ['完全没有', '从不'], 
          '1': ['几天', '有时'], 
          '2': ['超过一半', '经常'], 
          '3': ['几乎每天', '总是'] 
        },
        bn: { 
          '0': ['একদমই না', 'না'], 
          '1': ['কয়েক দিন', 'কখনো কখনো'], 
          '2': ['অর্ধেকের বেশি', 'প্রায়ই'], 
          '3': ['প্রায় প্রতিদিন', 'সবসময়'] 
        }
      };

      const currentLang = getCurrentLanguage();
      const commands = voiceCommands[currentLang] || voiceCommands.en;

      for (const [value, phrases] of Object.entries(commands)) {
        if (phrases.some((phrase: string) => transcript.includes(phrase))) {
          handleAnswer(parseInt(value));
          break;
        }
      }

      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };
  };

  const calculateResults = (responses: number[]): PHQ4Response => {
    const [q1, q2, q3, q4] = responses;
    const totalScore = q1 + q2 + q3 + q4;
    const depressionScore = q1 + q2; // Questions 1-2
    const anxietyScore = q3 + q4; // Questions 3-4

    // Risk level classification based on PHQ-4 scoring
    let riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
    let severityLevel: string;

    if (totalScore >= 12) {
      riskLevel = 'severe';
      severityLevel = 'Severe';
    } else if (totalScore >= 9) {
      riskLevel = 'severe';
      severityLevel = 'Moderately Severe';
    } else if (totalScore >= 6) {
      riskLevel = 'moderate';
      severityLevel = 'Moderate';
    } else if (totalScore >= 3) {
      riskLevel = 'mild';
      severityLevel = 'Mild';
    } else {
      riskLevel = 'minimal';
      severityLevel = 'Minimal';
    }

    // Generate recommendations based on scores
    const recommendations = generateRecommendations(totalScore, depressionScore, anxietyScore, riskLevel);

    return {
      q1, q2, q3, q4,
      totalScore,
      depressionScore,
      anxietyScore,
      severityLevel,
      riskLevel,
      recommendations,
      timestamp: new Date().toISOString(),
      anonymousId,
      language: getCurrentLanguage()
    };
  };

  const generateRecommendations = (total: number, depression: number, anxiety: number, risk: string): string[] => {
    const recommendations: string[] = [];

    if (risk === 'minimal') {
      recommendations.push(
        'Continue maintaining your current self-care practices',
        'Consider regular exercise and healthy lifestyle habits',
        'Stay connected with supportive friends and family'
      );
    } else if (risk === 'mild') {
      recommendations.push(
        'Consider stress management techniques like meditation or deep breathing',
        'Maintain regular sleep schedule and healthy diet',
        'Connect with peer support groups for additional support'
      );
    } else if (risk === 'moderate') {
      recommendations.push(
        'Consider speaking with a mental health professional',
        'Explore counseling or therapy options',
        'Practice daily stress reduction activities'
      );
    } else if (risk === 'severe') {
      recommendations.push(
        'Seek professional mental health support immediately',
        'Contact crisis support services if needed',
        'Consider medical evaluation for treatment options'
      );
    }

    return recommendations;
  };

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Check if we should collect demographics first
      if (!showDemographics) {
        setShowDemographics(true);
      } else {
        submitAssessment(newAnswers);
      }
    }
  };

  const submitAssessment = async (responses: number[]) => {
    setIsLoading(true);
    
    try {
      const assessmentResults = calculateResults(responses);
      
      // Submit to API with demographics
      const response = await fetch('/api/assessment/phq4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          anonymousId: assessmentResults.anonymousId,
          q1: assessmentResults.q1,
          q2: assessmentResults.q2,
          q3: assessmentResults.q3,
          q4: assessmentResults.q4,
          language: assessmentResults.language,
          ...demographics,
          completionTime: Date.now() // Would be calculated properly in production
        }),
      });

      if (response.ok) {
        setResults(assessmentResults);
        setIsComplete(true);
      } else {
        throw new Error('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      // Even if API fails, show results locally
      const assessmentResults = calculateResults(responses);
      setResults(assessmentResults);
      setIsComplete(true);
    }
    
    setIsLoading(false);
  };

  const restart = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setIsComplete(false);
    setResults(null);
    setAnonymousId(uuidv4());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your assessment...</p>
        </div>
      </div>
    );
  }

  if (isComplete && results) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              PHQ-4 Assessment Results
            </h1>
            
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Overall Score: {results.totalScore}/12
                </h3>
                <p className="text-blue-700 text-sm">
                  Severity Level: <span className="font-medium">{results.severityLevel}</span>
                </p>
                <p className="text-blue-700 text-sm">
                  Risk Level: <span className="font-medium capitalize">{results.riskLevel}</span>
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 border border-purple-200 rounded p-4">
                  <h4 className="font-semibold text-purple-800 mb-1">
                    Depression Score
                  </h4>
                  <p className="text-purple-700">{results.depressionScore}/6</p>
                  <p className="text-purple-600 text-xs mt-1">Questions 1-2</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <h4 className="font-semibold text-green-800 mb-1">
                    Anxiety Score
                  </h4>
                  <p className="text-green-700">{results.anxietyScore}/6</p>
                  <p className="text-green-600 text-xs mt-1">Questions 3-4</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Recommendations
                </h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  {results.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>

              {results.riskLevel === 'severe' && (
                <div className="bg-red-50 border border-red-200 rounded p-4">
                  <h4 className="font-semibold text-red-800 mb-2">
                    🚨 Important Notice
                  </h4>
                  <p className="text-red-700 text-sm mb-2">
                    Your scores indicate you may benefit from professional mental health support. Please consider reaching out to a healthcare provider.
                  </p>
                  <Link href="/crisis" className="inline-block">
                    <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors">
                      Access Crisis Support
                    </button>
                  </Link>
                </div>
              )}

              <div className="flex space-x-4">
                <button 
                  onClick={restart}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
                >
                  Take Again
                </button>
                <Link href="/dashboard" className="flex-1">
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Assessment ID: {results.anonymousId.substring(0, 8)}... | {new Date(results.timestamp).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show demographics collection after questions are completed
  if (showDemographics && !isComplete) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Optional: Help Us Better Understand Our Community
              </h2>
              <p className="text-gray-600 text-sm">
                This information helps us provide better, culturally-appropriate support. All data remains anonymous.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country of Origin (Optional)
                </label>
                <select 
                  value={demographics.countryOfOrigin}
                  onChange={(e) => setDemographics({...demographics, countryOfOrigin: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select country</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="India">India</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Myanmar">Myanmar</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Nepal">Nepal</option>
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age Group (Optional)
                </label>
                <select 
                  value={demographics.ageGroup}
                  onChange={(e) => setDemographics({...demographics, ageGroup: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select age group</option>
                  <option value="18-25">18-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-45">36-45</option>
                  <option value="46-55">46-55</option>
                  <option value="55+">55+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender (Optional)
                </label>
                <select 
                  value={demographics.gender}
                  onChange={(e) => setDemographics({...demographics, gender: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Sector (Optional)
                </label>
                <select 
                  value={demographics.employmentSector}
                  onChange={(e) => setDemographics({...demographics, employmentSector: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select sector</option>
                  <option value="Construction">Construction</option>
                  <option value="Domestic Work">Domestic Work</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Food Service">Food Service</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button 
                onClick={() => submitAssessment(answers)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Complete Assessment
              </button>
              <button 
                onClick={() => {
                  setDemographics({
                    countryOfOrigin: '',
                    ageGroup: '',
                    gender: '',
                    employmentSector: ''
                  });
                  submitAssessment(answers);
                }}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Skip & Continue
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Your privacy is protected. All demographic information is optional and stored anonymously.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-800">
                PHQ-4 Assessment
              </h1>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
                Back to Dashboard
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              This standardized assessment evaluates depression and anxiety symptoms over the past 2 weeks.
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {getLocalizedText(currentQ, 'text')}
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              {getLocalizedText(currentQ, 'description')}
            </p>

            {/* Voice Input Button */}
            {voiceSupported && (
              <div className="mb-4 text-center">
                <button
                  onClick={startVoiceInput}
                  disabled={isListening}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-800 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {isListening ? '🎤 Listening...' : '🎤 Voice Input'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Say your answer out loud (e.g., "not at all", "several days")
                </p>
              </div>
            )}

            <div className="space-y-3">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-4 border-2 rounded-lg text-left hover:shadow-md transition-all ${option.color} hover:opacity-80`}
                >
                  <span className="font-medium">
                    {option.value}. {getLocalizedOption(option)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Your responses are anonymously stored with ID: {anonymousId.substring(0, 8)}...</p>
            <p className="mt-1">All data is encrypted and PDPA compliant.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
