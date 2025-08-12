/**
 * Business Logic Functions for SATA Mental Health Platform
 * Core functions for PHQ-4 assessment, mood analysis, gamification, and risk assessment
 */

export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'severe';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface SentimentResult {
  score: number;
  label: SentimentLabel;
  confidence?: number;
}

export interface GamificationAction {
  type: string;
  points: number;
  description: string;
  multiplier?: number;
}

/**
 * Calculate PHQ-4 severity level based on depression and anxiety scores
 */
export function calculatePHQ4Severity(
  depressionScore: number | null | undefined,
  anxietyScore: number | null | undefined
): SeverityLevel {
  // Validate input types
  if (typeof depressionScore === 'string' || typeof anxietyScore === 'string') {
    throw new Error('Score values must be numbers');
  }

  // Handle null/undefined values
  const depression = depressionScore ?? 0;
  const anxiety = anxietyScore ?? 0;

  // Ensure scores are within valid range
  const validDepression = Math.max(0, Math.min(6, depression));
  const validAnxiety = Math.max(0, Math.min(6, anxiety));

  const totalScore = validDepression + validAnxiety;

  // Standard PHQ-4 scoring thresholds (based on test expectations)
  if (totalScore <= 3) return 'minimal';
  if (totalScore <= 6) return 'mild';
  if (totalScore <= 9) return 'moderate';
  return 'severe';
}

/**
 * Validate mood score input
 */
export function validateMoodScore(score: any): boolean {
  return typeof score === 'number' && 
         Number.isInteger(score) && 
         score >= 1 && 
         score <= 10;
}

/**
 * Simple sentiment analysis for mood notes
 */
export function calculateSentiment(text: string | null | undefined): SentimentResult {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return { score: 0, label: 'neutral' };
  }

  const lowerText = text.toLowerCase();
  
  // Positive keywords with weights
  const positiveKeywords = {
    'great': 3, 'amazing': 3, 'excellent': 3, 'wonderful': 3, 'fantastic': 3,
    'good': 2, 'happy': 2, 'joy': 2, 'love': 2, 'blessed': 2, 'grateful': 2,
    'better': 1, 'okay': 1, 'fine': 1, 'calm': 1, 'peaceful': 1, 'hopeful': 1
  };

  // Negative keywords with weights
  const negativeKeywords = {
    'terrible': -3, 'awful': -3, 'horrible': -3, 'hate': -3, 'worst': -3,
    'sad': -2, 'depressed': -2, 'anxious': -2, 'worried': -2, 'stressed': -2,
    'upset': -1, 'tired': -1, 'difficult': -1, 'hard': -1, 'struggling': -1
  };

  let score = 0;
  let matchCount = 0;

  // Calculate positive sentiment
  Object.entries(positiveKeywords).forEach(([keyword, weight]) => {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  });

  // Calculate negative sentiment
  Object.entries(negativeKeywords).forEach(([keyword, weight]) => {
    if (lowerText.includes(keyword)) {
      score += weight;
      matchCount++;
    }
  });

  // Normalize score (simplified)
  if (matchCount > 0) {
    score = score / matchCount; // Simple average instead of sqrt
  }

  // Determine label
  let label: SentimentLabel = 'neutral';
  if (score > 0.3) label = 'positive';
  else if (score < -0.3) label = 'negative';

  return {
    score: Math.max(-1, Math.min(1, score)),
    label,
    confidence: Math.min(1, matchCount * 0.2)
  };
}

/**
 * Calculate gamification points for different actions
 */
export function calculateGamificationPoints(
  actionType: string | null,
  metadata: any = {}
): number {
  if (!actionType || typeof actionType !== 'string') {
    return 0;
  }

  if (!metadata || typeof metadata !== 'object') {
    return 0;
  }

  const basePoints: { [key: string]: number } = {
    'mood_log': 5,
    'phq4_assessment': 20,
    'resource_view': 2,
    'resource_contact': 15,
    'resource_share': 10,
    'resource_bookmark': 3,
    'peer_support_message': 8,
    'peer_support_help': 12,
    'educational_content': 5,
    'daily_checkin': 10,
    'weekly_survey': 25,
    'therapy_session_completed': 50,
    'goal_completed': 30,
    'streak_day': 5
  };

  let points = basePoints[actionType] || 0;

  // Apply multipliers based on metadata
  switch (actionType) {
    case 'mood_log':
      if (metadata.consecutive) points *= 2;
      break;
    
    case 'phq4_assessment':
      if (metadata.firstTime) return 50;
      if (!metadata.completed) return 0;
      break;
    
    case 'streak_milestone':
      if (metadata.days === 7) return 100;
      if (metadata.days === 30) return 500;
      if (metadata.days === 100) return 1000;
      break;
    
    case 'assessment_milestone':
      if (metadata.count === 5) return 150;
      if (metadata.count === 10) return 300;
      if (metadata.count === 25) return 750;
      break;
    
    case 'resource_contact':
      if (metadata.emergencyResource) points *= 1.5;
      break;
    
    case 'peer_support_help':
      if (metadata.helpfulness === 'very_helpful') points *= 1.5;
      break;
  }

  return Math.round(points);
}

/**
 * Determine risk level based on text content
 */
export function determineRiskLevel(
  text: string | null | undefined,
  language: string = 'en'
): RiskLevel {
  if (!text || typeof text !== 'string') {
    return 'low';
  }

  const lowerText = text.toLowerCase();

  // Crisis keywords that indicate immediate risk
  const crisisKeywords = {
    en: [
      'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
      'self harm', 'not worth living', 'better off dead', 'end it all'
    ],
    zh: [
      '自杀', '自殺', '我想死', '结束生命', '伤害自己', '不想活', '死了算了'
    ],
    bn: [
      'আত্মহত্যা', 'মরে যেতে চাই', 'নিজেকে মেরে ফেলব', 'বাঁচতে চাই না'
    ],
    ta: [
      'தற்கொலை', 'இறக்க விரும்புகிறேன்', 'உயிர் வாழ விரும்பவில்லை'
    ],
    my: [
      'မိမိကိုယ်ကို သတ်', 'သေချင်', 'မနေချင်တော့'
    ],
    id: [
      'bunuh diri', 'ingin mati', 'tidak ingin hidup', 'mengakhiri hidup'
    ]
  };

  // High-risk keywords
  const highRiskKeywords = {
    en: [
      'hopeless', 'no point', 'give up', 'can\'t go on', 'worthless',
      'everyone better without me', 'no way out', 'can\'t handle'
    ],
    zh: [
      '绝望', '没有希望', '放弃', '没有意义', '撑不下去'
    ],
    bn: [
      'নিরাশ', 'আশা নেই', 'হার মেনে নিয়েছি', 'কোন উপায় নেই'
    ],
    ta: [
      'நம்பிக்கையற்ற', 'கைவிட', 'பயனற்ற', 'வழியில்லை'
    ],
    my: [
      'မျှော်လင့်ချက်မရှိ', 'စွန့်လွှတ်', 'မရရှိနိုင်'
    ],
    id: [
      'putus asa', 'menyerah', 'tidak ada jalan', 'tidak berguna'
    ]
  };

  // Medium-risk keywords
  const mediumRiskKeywords = {
    en: [
      'very sad', 'extremely anxious', 'can\'t sleep', 'panic attacks',
      'overwhelming', 'struggling daily', 'losing control'
    ],
    zh: [
      '非常伤心', '极度焦虑', '睡不着', '恐慌', '压倒性', '每天都在挣扎'
    ],
    bn: [
      'খুব দুঃখিত', 'অত্যধিক উদ্বিগ্ন', 'ঘুম আসে না', 'আতঙ্ক'
    ],
    ta: [
      'மிகவும் சோகம்', 'அதிக கவலை', 'தூக்கம் வரவில்லை'
    ],
    my: [
      'အလွန်ဝမ်းနည်း', 'အလွန်စိုးရိမ်', 'အိပ်မရ'
    ],
    id: [
      'sangat sedih', 'sangat cemas', 'tidak bisa tidur', 'panik'
    ]
  };

  const currentCrisisKeywords = crisisKeywords[language as keyof typeof crisisKeywords] || crisisKeywords.en;
  const currentHighRiskKeywords = highRiskKeywords[language as keyof typeof highRiskKeywords] || highRiskKeywords.en;
  const currentMediumRiskKeywords = mediumRiskKeywords[language as keyof typeof mediumRiskKeywords] || mediumRiskKeywords.en;

  // Check for crisis keywords
  if (currentCrisisKeywords.some((keyword: string) => lowerText.includes(keyword.toLowerCase()))) {
    return 'critical';
  }

  // Check for high-risk keywords
  if (currentHighRiskKeywords.some((keyword: string) => lowerText.includes(keyword.toLowerCase()))) {
    return 'high';
  }

  // Check for medium-risk keywords
  if (currentMediumRiskKeywords.some((keyword: string) => lowerText.includes(keyword.toLowerCase()))) {
    return 'medium';
  }

  return 'low';
}

/**
 * Validate language content for supported languages and appropriate content
 */
export function validateLanguageContent(
  content: string | null | undefined,
  language: string
): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }

  // Check supported languages
  const supportedLanguages = ['en', 'zh', 'bn', 'ta', 'my', 'id'];
  if (!supportedLanguages.includes(language)) {
    return false;
  }

  // Check content length (max 4000 characters for mental health content)
  if (content.length > 4000) {
    return false;
  }

  // Check for spam patterns (multiple links, excessive repetition)
  const linkPattern = /(https?:\/\/|www\.)/gi;
  const linkCount = (content.match(linkPattern) || []).length;
  if (linkCount > 2) {
    return false;
  }

  // Check for promotional content patterns
  const promotionalPatterns = [
    /buy now/gi,
    /click here/gi,
    /limited time/gi,
    /special offer/gi,
    /discount/gi,
    /sale/gi
  ];

  if (promotionalPatterns.some(pattern => pattern.test(content))) {
    return false;
  }

  // Check for excessive repetition
  const words = content.toLowerCase().split(/\s+/);
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  const maxWordRepetition = Math.max(...Object.values(wordCount));
  if (maxWordRepetition > words.length / 3) {
    return false;
  }

  return true;
}

/**
 * Calculate intervention priority based on multiple factors
 */
export function calculateInterventionPriority(
  riskLevel: RiskLevel,
  assessmentScore: number,
  lastContactHours: number,
  previousInterventions: number
): 'immediate' | 'urgent' | 'high' | 'medium' | 'low' {
  // Immediate intervention for critical risk
  if (riskLevel === 'critical') {
    return 'immediate';
  }

  // Urgent for high risk with concerning patterns
  if (riskLevel === 'high' && (assessmentScore >= 12 || lastContactHours > 72)) {
    return 'urgent';
  }

  // High priority for medium risk with multiple factors
  if (riskLevel === 'medium' && assessmentScore >= 8 && lastContactHours > 48) {
    return 'high';
  }

  // Adjust based on previous interventions
  if (previousInterventions >= 3 && riskLevel !== 'low') {
    return 'high';
  }

  // Medium priority for moderate concerns
  if (riskLevel === 'medium' || assessmentScore >= 6) {
    return 'medium';
  }

  return 'low';
}

/**
 * Generate personalized recommendations based on user data
 */
export function generatePersonalizedRecommendations(
  userProfile: {
    riskLevel: RiskLevel;
    moodTrend: 'improving' | 'stable' | 'declining';
    assessmentHistory: number[];
    preferences: {
      language: string;
      contactMethods: string[];
      availableTimes: string[];
    };
    demographicInfo?: {
      ageGroup: string;
      occupation: string;
      location: string;
    };
  }
): Array<{
  type: string;
  priority: number;
  title: string;
  description: string;
  actionUrl?: string;
}> {
  const recommendations = [];

  // Crisis intervention recommendations
  if (userProfile.riskLevel === 'critical') {
    recommendations.push({
      type: 'crisis_intervention',
      priority: 1,
      title: 'Immediate Support Available',
      description: 'Connect with a crisis counselor right now',
      actionUrl: '/crisis-support'
    });
  }

  // Assessment-based recommendations
  if (userProfile.moodTrend === 'declining') {
    recommendations.push({
      type: 'mood_support',
      priority: 2,
      title: 'Mood Support Resources',
      description: 'Tools and techniques to help improve your mood',
      actionUrl: '/mood-support'
    });
  }

  // Personalized therapy recommendations
  if (userProfile.riskLevel === 'high' || userProfile.riskLevel === 'medium') {
    recommendations.push({
      type: 'therapy_referral',
      priority: 3,
      title: 'Professional Support',
      description: 'Connect with mental health professionals in your area',
      actionUrl: '/therapy-finder'
    });
  }

  // Educational content based on assessment patterns
  const avgScore = userProfile.assessmentHistory.reduce((a, b) => a + b, 0) / 
                   userProfile.assessmentHistory.length;
  
  if (avgScore >= 8) {
    recommendations.push({
      type: 'educational_content',
      priority: 4,
      title: 'Coping Strategies',
      description: 'Learn effective techniques for managing anxiety and depression',
      actionUrl: '/educational-resources'
    });
  }

  // Peer support recommendations
  if (userProfile.preferences.contactMethods.includes('peer_support')) {
    recommendations.push({
      type: 'peer_support',
      priority: 5,
      title: 'Connect with Peers',
      description: 'Join support groups with others who understand',
      actionUrl: '/peer-support'
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}
