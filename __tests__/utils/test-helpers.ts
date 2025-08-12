/**
 * Test helper functions for database testing
 */

import { PrismaClient } from '@prisma/client';

/**
 * Create a test user with default or custom data
 */
export async function createTestUser(
  prisma: PrismaClient,
  userData?: Partial<{
    anonymousId: string;
    language: string;
    timezone: string;
    countryCode: string;
  }>
) {
  const defaultData = {
    anonymousId: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    language: 'en',
    timezone: 'UTC',
    ...userData
  };

  return await prisma.anonymousUser.create({
    data: defaultData
  });
}

/**
 * Create a test PHQ-4 assessment
 */
export async function createTestAssessment(
  prisma: PrismaClient,
  assessmentData: {
    userId: string;
    depressionScore: number;
    anxietyScore: number;
    totalScore?: number;
    severityLevel?: string;
    language?: string;
    question1Score?: number;
    question2Score?: number;
    question3Score?: number;
    question4Score?: number;
  }
) {
  const totalScore = assessmentData.totalScore || 
    (assessmentData.depressionScore + assessmentData.anxietyScore);
  
  let severityLevel = assessmentData.severityLevel;
  if (!severityLevel) {
    if (totalScore <= 2) severityLevel = 'minimal';
    else if (totalScore <= 5) severityLevel = 'mild';
    else if (totalScore <= 9) severityLevel = 'moderate';
    else severityLevel = 'severe';
  }

  // Calculate individual question scores based on total scores
  const q1Score = assessmentData.question1Score ?? Math.floor(assessmentData.depressionScore / 2);
  const q2Score = assessmentData.question2Score ?? (assessmentData.depressionScore - q1Score);
  const q3Score = assessmentData.question3Score ?? Math.floor(assessmentData.anxietyScore / 2);
  const q4Score = assessmentData.question4Score ?? (assessmentData.anxietyScore - q3Score);

  return await prisma.pHQ4Assessment.create({
    data: {
      userId: assessmentData.userId,
      question1Score: q1Score,
      question2Score: q2Score,
      question3Score: q3Score,
      question4Score: q4Score,
      depressionScore: assessmentData.depressionScore,
      anxietyScore: assessmentData.anxietyScore,
      totalScore,
      severityLevel,
      language: assessmentData.language || 'en'
    }
  });
}

/**
 * Create a test mood log
 */
export async function createTestMoodLog(
  prisma: PrismaClient,
  moodData: {
    userId: string;
    moodScore: number;
    emotions?: string[];
    notes?: string;
    triggers?: string[];
    sentimentScore?: number;
    sentimentLabel?: string;
    language?: string;
  }
) {
  return await prisma.moodLog.create({
    data: {
      userId: moodData.userId,
      moodScore: moodData.moodScore,
      emotions: moodData.emotions || [],
      notes: moodData.notes || '',
      triggers: moodData.triggers || [],
      sentimentScore: moodData.sentimentScore || 0,
      sentimentLabel: moodData.sentimentLabel || 'neutral',
      language: moodData.language || 'en'
    }
  });
}

/**
 * Create a test user interaction
 */
export async function createTestInteraction(
  prisma: PrismaClient,
  interactionData: {
    userId: string;
    interactionType: string;
    entityType?: string;
    entityId?: string;
    metadata?: any;
    language?: string;
  }
) {
  return await prisma.userInteraction.create({
    data: {
      userId: interactionData.userId,
      interactionType: interactionData.interactionType,
      entityType: interactionData.entityType || 'general',
      entityId: interactionData.entityId,
      metadata: interactionData.metadata || {},
      language: interactionData.language || 'en'
    }
  });
}

/**
 * Create test gamification data
 */
export async function createTestGamificationData(
  prisma: PrismaClient,
  gamificationData: {
    userId: string;
    totalPoints?: number;
    moodLogsCount?: number;
    assessmentsCount?: number;
    streak?: number;
    longestStreak?: number;
  }
) {
  return await prisma.gamificationData.create({
    data: {
      userId: gamificationData.userId,
      totalPoints: gamificationData.totalPoints || 0,
      moodLogsCount: gamificationData.moodLogsCount || 0,
      assessmentsCount: gamificationData.assessmentsCount || 0,
      streak: gamificationData.streak || 0,
      longestStreak: gamificationData.longestStreak || 0,
      lastPointsEarned: new Date()
    }
  });
}

/**
 * Create a test mental health resource
 */
export async function createTestResource(
  prisma: PrismaClient,
  resourceData: {
    title: { [key: string]: string };
    description: { [key: string]: string };
    category?: string;
    resourceType?: string;
    isEmergency?: boolean;
    isActive?: boolean;
    contactInfo?: any;
    targetAudience?: string[];
    languages?: string[];
  }
) {
  return await prisma.mentalHealthResource.create({
    data: {
      title: resourceData.title,
      description: resourceData.description,
      category: resourceData.category || 'general',
      resourceType: resourceData.resourceType || 'website',
      isEmergency: resourceData.isEmergency || false,
      isActive: resourceData.isActive !== false,
      contactInfo: resourceData.contactInfo || {},
      targetAudience: resourceData.targetAudience || ['general'],
      languages: resourceData.languages || ['en']
    }
  });
}

/**
 * Clean up all test data from the database
 */
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in order to respect foreign key constraints
  await prisma.userInteraction.deleteMany({
    where: {
      userId: {
        contains: 'test-user'
      }
    }
  });

  await prisma.gamificationData.deleteMany({
    where: {
      userId: {
        contains: 'test-user'
      }
    }
  });

  await prisma.moodLog.deleteMany({
    where: {
      userId: {
        contains: 'test-user'
      }
    }
  });

  await prisma.pHQ4Assessment.deleteMany({
    where: {
      userId: {
        contains: 'test-user'
      }
    }
  });

  await prisma.anonymousUser.deleteMany({
    where: {
      anonymousId: {
        contains: 'test-user'
      }
    }
  });

  // Clean up test resources
  await prisma.mentalHealthResource.deleteMany({
    where: {
      OR: [
        { title: { path: ['en'], string_contains: 'Test' } },
        { title: { path: ['en'], string_contains: 'Crisis Line' } },
        { title: { path: ['en'], string_contains: 'Therapy Finder' } },
        { title: { path: ['en'], string_contains: 'Inactive Resource' } }
      ]
    }
  });
}

/**
 * Create a full test user profile with all related data
 */
export async function createTestUserProfile(prisma: PrismaClient) {
  const user = await createTestUser(prisma);
  
  const assessment = await createTestAssessment(prisma, {
    userId: user.id,
    depressionScore: 3,
    anxietyScore: 4
  });

  const moodLog = await createTestMoodLog(prisma, {
    userId: user.id,
    moodScore: 7,
    emotions: ['happy', 'calm'],
    notes: 'Test mood log'
  });

  const interaction = await createTestInteraction(prisma, {
    userId: user.id,
    interactionType: 'mood_logged',
    entityType: 'mood',
    entityId: moodLog.id
  });

  const gamificationData = await createTestGamificationData(prisma, {
    userId: user.id,
    totalPoints: 100,
    moodLogsCount: 1,
    assessmentsCount: 1,
    streak: 5
  });

  return {
    user,
    assessment,
    moodLog,
    interaction,
    gamificationData
  };
}

/**
 * Wait for a specified amount of time (useful for timing-dependent tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate mock assessment data for testing trends
 */
export function generateMockAssessmentData(
  userId: string,
  count: number,
  trend: 'improving' | 'declining' | 'stable' = 'stable'
): Array<{
  userId: string;
  depressionScore: number;
  anxietyScore: number;
  totalScore: number;
  severityLevel: string;
  language: string;
  createdAt: Date;
}> {
  const data = [];
  const baseDate = new Date();

  for (let i = 0; i < count; i++) {
    let depressionScore = 3;
    let anxietyScore = 3;

    switch (trend) {
      case 'improving':
        depressionScore = Math.max(0, 6 - i);
        anxietyScore = Math.max(0, 6 - i);
        break;
      case 'declining':
        depressionScore = Math.min(6, i + 1);
        anxietyScore = Math.min(6, i + 1);
        break;
      case 'stable':
        depressionScore = 3 + Math.floor(Math.random() * 2) - 1;
        anxietyScore = 3 + Math.floor(Math.random() * 2) - 1;
        break;
    }

    const totalScore = depressionScore + anxietyScore;
    let severityLevel = 'minimal';
    if (totalScore <= 2) severityLevel = 'minimal';
    else if (totalScore <= 5) severityLevel = 'mild';
    else if (totalScore <= 9) severityLevel = 'moderate';
    else severityLevel = 'severe';

    data.push({
      userId,
      depressionScore,
      anxietyScore,
      totalScore,
      severityLevel,
      language: 'en',
      createdAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000)
    });
  }

  return data;
}

/**
 * Generate mock mood data for testing
 */
export function generateMockMoodData(
  userId: string,
  count: number,
  pattern: 'random' | 'improving' | 'declining' = 'random'
): Array<{
  userId: string;
  moodScore: number;
  emotions: string[];
  notes: string;
  triggers: string[];
  sentimentScore: number;
  sentimentLabel: string;
  language: string;
  createdAt: Date;
}> {
  const data = [];
  const baseDate = new Date();
  const emotions = ['happy', 'sad', 'anxious', 'calm', 'excited', 'tired', 'hopeful', 'worried'];
  const triggers = ['work', 'family', 'therapy', 'exercise', 'friends', 'stress', 'sleep'];

  for (let i = 0; i < count; i++) {
    let moodScore = 5;

    switch (pattern) {
      case 'improving':
        moodScore = Math.min(10, 3 + i);
        break;
      case 'declining':
        moodScore = Math.max(1, 8 - i);
        break;
      case 'random':
        moodScore = Math.floor(Math.random() * 10) + 1;
        break;
    }

    const selectedEmotions = emotions
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);

    const selectedTriggers = triggers
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 2) + 1);

    const sentimentScore = (moodScore - 5.5) / 4.5; // Normalize to -1 to 1
    const sentimentLabel = sentimentScore > 0.2 ? 'positive' : 
                          sentimentScore < -0.2 ? 'negative' : 'neutral';

    data.push({
      userId,
      moodScore,
      emotions: selectedEmotions,
      notes: `Test mood log ${i + 1}`,
      triggers: selectedTriggers,
      sentimentScore,
      sentimentLabel,
      language: 'en',
      createdAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000)
    });
  }

  return data;
}
