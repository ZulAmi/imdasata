/**
 * Integration tests for database operations
 * Testing Prisma models, relationships, and data integrity
 */

import { PrismaClient } from '@prisma/client';
import { 
  createTestUser, 
  createTestAssessment, 
  createTestMoodLog,
  cleanupTestData 
} from '../utils/test-helpers';

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData(prisma);
  });

  afterAll(async () => {
    // Clean up test data and disconnect
    await cleanupTestData(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate for each test
    await cleanupTestData(prisma);
  });

  describe('Anonymous User Operations', () => {
    test('should create anonymous user with valid data', async () => {
      const userData = {
        anonymousId: 'test-user-123',
        language: 'en',
        timezone: 'Asia/Singapore',
        countryCode: 'SG'
      };

      const user = await prisma.anonymousUser.create({
        data: userData
      });

      expect(user).toBeDefined();
      expect(user.anonymousId).toBe(userData.anonymousId);
      expect(user.language).toBe(userData.language);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.lastActiveAt).toBeInstanceOf(Date);
    });

    test('should enforce unique anonymousId constraint', async () => {
      const userData = {
        anonymousId: 'duplicate-user',
        language: 'en'
      };

      // Create first user
      await prisma.anonymousUser.create({ data: userData });

      // Attempt to create duplicate should fail
      await expect(
        prisma.anonymousUser.create({ data: userData })
      ).rejects.toThrow();
    });

    test('should update user last active timestamp', async () => {
      const user = await createTestUser(prisma, {
        anonymousId: 'active-user',
        language: 'en'
      });

      const originalLastActive = user.lastActiveAt;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedUser = await prisma.anonymousUser.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });

      expect(updatedUser.lastActiveAt.getTime()).toBeGreaterThan(
        originalLastActive.getTime()
      );
    });

    test('should delete user and cascade related data', async () => {
      const user = await createTestUser(prisma, {
        anonymousId: 'cascade-test-user',
        language: 'en'
      });

      // Create related data
      await createTestAssessment(prisma, {
        userId: user.id,
        depressionScore: 5,
        anxietyScore: 4
      });

      await createTestMoodLog(prisma, {
        userId: user.id,
        moodScore: 7
      });

      // Delete user
      await prisma.anonymousUser.delete({
        where: { id: user.id }
      });

      // Verify related data is also deleted
      const assessments = await prisma.pHQ4Assessment.findMany({
        where: { userId: user.id }
      });

      const moodLogs = await prisma.moodLog.findMany({
        where: { userId: user.id }
      });

      expect(assessments).toHaveLength(0);
      expect(moodLogs).toHaveLength(0);
    });
  });

  describe('PHQ-4 Assessment Operations', () => {
    test('should create PHQ-4 assessment with valid scores', async () => {
      const user = await createTestUser(prisma);
      
      const assessmentData = {
        userId: user.id,
        question1Score: 1,
        question2Score: 2,
        question3Score: 2,
        question4Score: 2,
        depressionScore: 3,
        anxietyScore: 4,
        totalScore: 7,
        severityLevel: 'moderate' as const,
        language: 'en'
      };

      const assessment = await prisma.pHQ4Assessment.create({
        data: assessmentData
      });

      expect(assessment).toBeDefined();
      expect(assessment.depressionScore).toBe(3);
      expect(assessment.anxietyScore).toBe(4);
      expect(assessment.totalScore).toBe(7);
      expect(assessment.severityLevel).toBe('moderate');
      expect(assessment.userId).toBe(user.id);
    });

    test('should validate score ranges', async () => {
      const user = await createTestUser(prisma);

      // Test invalid depression score
      await expect(
        prisma.pHQ4Assessment.create({
          data: {
            userId: user.id,
            question1Score: -1, // Invalid
            question2Score: 0,
            question3Score: 3,
            question4Score: 0,
            depressionScore: -1, // Invalid
            anxietyScore: 3,
            totalScore: 2,
            severityLevel: 'minimal',
            language: 'en'
          }
        })
      ).rejects.toThrow();

      // Test invalid anxiety score
      await expect(
        prisma.pHQ4Assessment.create({
          data: {
            userId: user.id,
            question1Score: 3,
            question2Score: 0,
            question3Score: 3,
            question4Score: 4, // Invalid (max 3)
            depressionScore: 3,
            anxietyScore: 7, // Invalid (max 6)
            totalScore: 10,
            severityLevel: 'severe',
            language: 'en'
          }
        })
      ).rejects.toThrow();
    });

    test('should retrieve user assessment history', async () => {
      const user = await createTestUser(prisma);

      // Create multiple assessments
      const assessmentDates = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-02-01')
      ];

      for (const date of assessmentDates) {
        await prisma.pHQ4Assessment.create({
          data: {
            userId: user.id,
            question1Score: 1,
            question2Score: 1,
            question3Score: 1,
            question4Score: 2,
            depressionScore: 2,
            anxietyScore: 3,
            totalScore: 5,
            severityLevel: 'mild',
            language: 'en',
            completedAt: date
          }
        });
      }

      const assessments = await prisma.pHQ4Assessment.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'asc' }
      });

      expect(assessments).toHaveLength(3);
      expect(assessments[0].completedAt).toEqual(assessmentDates[0]);
      expect(assessments[2].completedAt).toEqual(assessmentDates[2]);
    });

    test('should calculate assessment trends', async () => {
      const user = await createTestUser(prisma);

      // Create trend data
      const trendData = [
        { depression: 6, anxiety: 6, total: 12, severity: 'severe' },
        { depression: 4, anxiety: 5, total: 9, severity: 'moderate' },
        { depression: 2, anxiety: 3, total: 5, severity: 'mild' }
      ];

      for (const [index, data] of trendData.entries()) {
        await prisma.pHQ4Assessment.create({
          data: {
            userId: user.id,
            question1Score: Math.floor(data.depression / 2),
            question2Score: Math.ceil(data.depression / 2),
            question3Score: Math.floor(data.anxiety / 2),
            question4Score: Math.ceil(data.anxiety / 2),
            depressionScore: data.depression,
            anxietyScore: data.anxiety,
            totalScore: data.total,
            severityLevel: data.severity as any,
            language: 'en',
            completedAt: new Date(Date.now() + index * 24 * 60 * 60 * 1000)
          }
        });
      }

      const assessments = await prisma.pHQ4Assessment.findMany({
        where: { userId: user.id },
        orderBy: { completedAt: 'asc' }
      });

      // Verify improving trend
      expect(assessments[0].totalScore).toBeGreaterThan(assessments[1].totalScore);
      expect(assessments[1].totalScore).toBeGreaterThan(assessments[2].totalScore);
    });
  });

  describe('Mood Log Operations', () => {
    test('should create mood log with emotions and triggers', async () => {
      const user = await createTestUser(prisma);

      const moodData = {
        userId: user.id,
        moodScore: 8,
        emotions: ['happy', 'excited', 'grateful'],
        notes: 'Had a great therapy session today',
        triggers: ['therapy', 'exercise'],
        sentimentScore: 0.85,
        sentimentLabel: 'positive' as const,
        language: 'en'
      };

      const moodLog = await prisma.moodLog.create({
        data: moodData,
        include: { user: true }
      });

      expect(moodLog).toBeDefined();
      expect(moodLog.moodScore).toBe(8);
      expect(moodLog.emotions).toEqual(['happy', 'excited', 'grateful']);
      expect(moodLog.triggers).toEqual(['therapy', 'exercise']);
      expect(moodLog.sentimentScore).toBe(0.85);
      expect(moodLog.user.id).toBe(user.id);
    });

    test('should validate mood score range', async () => {
      const user = await createTestUser(prisma);

      // Test invalid low score
      await expect(
        prisma.moodLog.create({
          data: {
            userId: user.id,
            moodScore: 0, // Invalid
            language: 'en'
          }
        })
      ).rejects.toThrow();

      // Test invalid high score
      await expect(
        prisma.moodLog.create({
          data: {
            userId: user.id,
            moodScore: 11, // Invalid
            language: 'en'
          }
        })
      ).rejects.toThrow();
    });

    test('should retrieve mood history with date filtering', async () => {
      const user = await createTestUser(prisma);

      // Create mood logs over different dates
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-10') // Outside range
      ];

      for (const [index, date] of dates.entries()) {
        await prisma.moodLog.create({
          data: {
            userId: user.id,
            moodScore: 5 + index,
            language: 'en',
            loggedAt: date
          }
        });
      }

      // Query for specific date range
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const moodLogs = await prisma.moodLog.findMany({
        where: {
          userId: user.id,
          loggedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { loggedAt: 'asc' }
      });

      expect(moodLogs).toHaveLength(3); // Should exclude the Jan 10 entry
      expect(moodLogs[0].moodScore).toBe(5);
      expect(moodLogs[2].moodScore).toBe(7);
    });

    test('should calculate mood averages and trends', async () => {
      const user = await createTestUser(prisma);

      // Create mood data with clear trend
      const moodScores = [3, 4, 5, 6, 7, 8]; // Improving trend

      for (const [index, score] of moodScores.entries()) {
        await prisma.moodLog.create({
          data: {
            userId: user.id,
            moodScore: score,
            language: 'en',
            loggedAt: new Date(Date.now() + index * 24 * 60 * 60 * 1000)
          }
        });
      }

      const moodLogs = await prisma.moodLog.findMany({
        where: { userId: user.id },
        orderBy: { loggedAt: 'asc' }
      });

      // Calculate average
      const average = moodLogs.reduce((sum, log) => sum + log.moodScore, 0) / moodLogs.length;
      expect(average).toBe(5.5);

      // Verify trend
      const firstHalf = moodLogs.slice(0, 3);
      const secondHalf = moodLogs.slice(3);
      
      const firstAvg = firstHalf.reduce((sum, log) => sum + log.moodScore, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, log) => sum + log.moodScore, 0) / secondHalf.length;
      
      expect(secondAvg).toBeGreaterThan(firstAvg);
    });
  });

  describe('User Interaction Operations', () => {
    test('should track user interactions with proper timestamps', async () => {
      const user = await createTestUser(prisma);

      const interactionData = {
        userId: user.id,
        interactionType: 'whatsapp_message',
        entityType: 'mood_log',
        entityId: 'mood-123',
        metadata: {
          messageContent: 'Feeling better today',
          platform: 'whatsapp'
        },
        language: 'en'
      };

      const interaction = await prisma.userInteraction.create({
        data: interactionData,
        include: { user: true }
      });

      expect(interaction).toBeDefined();
      expect(interaction.interactionType).toBe('whatsapp_message');
      expect(interaction.entityType).toBe('mood_log');
      expect(interaction.metadata).toEqual(interactionData.metadata);
      expect(interaction.timestamp).toBeInstanceOf(Date);
      expect(interaction.user.id).toBe(user.id);
    });

    test('should query interactions by type and date range', async () => {
      const user = await createTestUser(prisma);

      // Create various interaction types
      const interactions = [
        { type: 'mood_logged', date: new Date('2024-01-01') },
        { type: 'assessment_completed', date: new Date('2024-01-02') },
        { type: 'resource_viewed', date: new Date('2024-01-03') },
        { type: 'mood_logged', date: new Date('2024-01-10') }
      ];

      for (const interaction of interactions) {
        await prisma.userInteraction.create({
          data: {
            userId: user.id,
            interactionType: interaction.type,
            entityType: 'general',
            language: 'en',
            timestamp: interaction.date
          }
        });
      }

      // Query for mood_logged interactions
      const moodInteractions = await prisma.userInteraction.findMany({
        where: {
          userId: user.id,
          interactionType: 'mood_logged'
        }
      });

      expect(moodInteractions).toHaveLength(2);

      // Query for date range
      const dateRangeInteractions = await prisma.userInteraction.findMany({
        where: {
          userId: user.id,
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-05')
          }
        }
      });

      expect(dateRangeInteractions).toHaveLength(3);
    });
  });

  describe('Gamification Data Operations', () => {
    test('should create and update gamification data', async () => {
      const user = await createTestUser(prisma);

      // Create initial gamification data
      const gamificationData = await prisma.gamificationData.create({
        data: {
          userId: user.id,
          totalPoints: 100,
          moodLogsCount: 5,
          assessmentsCount: 2,
          streak: 3,
          longestStreak: 7,
          lastPointsEarned: new Date()
        }
      });

      expect(gamificationData).toBeDefined();
      expect(gamificationData.totalPoints).toBe(100);
      expect(gamificationData.streak).toBe(3);

      // Update gamification data
      const updatedData = await prisma.gamificationData.update({
        where: { userId: user.id },
        data: {
          totalPoints: { increment: 50 },
          moodLogsCount: { increment: 1 },
          streak: { increment: 1 }
        }
      });

      expect(updatedData.totalPoints).toBe(150);
      expect(updatedData.moodLogsCount).toBe(6);
      expect(updatedData.streak).toBe(4);
    });

    test('should handle streak resets correctly', async () => {
      const user = await createTestUser(prisma);

      const gamificationData = await prisma.gamificationData.create({
        data: {
          userId: user.id,
          totalPoints: 200,
          streak: 10,
          longestStreak: 10,
          lastPointsEarned: new Date()
        }
      });

      // Reset streak but update longest streak
      const updatedData = await prisma.gamificationData.update({
        where: { userId: user.id },
        data: {
          streak: 0,
          longestStreak: Math.max(gamificationData.longestStreak, gamificationData.streak)
        }
      });

      expect(updatedData.streak).toBe(0);
      expect(updatedData.longestStreak).toBe(10);
    });
  });

  describe('Mental Health Resource Operations', () => {
    test('should create multilingual mental health resources', async () => {
      const resourceData = {
        title: {
          en: 'Crisis Hotline',
          zh: '危機熱線',
          bn: 'সংকট হটলাইন'
        },
        description: {
          en: 'Immediate support for mental health emergencies',
          zh: '心理健康緊急情況的即時支援',
          bn: 'মানসিক স্বাস্থ্য জরুরি অবস্থার জন্য তাৎক্ষণিক সহায়তা'
        },
        contactInfo: {
          phone: '1-800-273-8255',
          website: 'https://suicidepreventionlifeline.org'
        },
        category: 'crisis_support',
        resourceType: 'hotline',
        isEmergency: true,
        isActive: true,
        targetAudience: ['general'],
        accessibilityFeatures: ['hearing_impaired', 'multilingual']
      };

      const resource = await prisma.mentalHealthResource.create({
        data: resourceData
      });

      expect(resource).toBeDefined();
      expect((resource.title as any).en).toBe('Crisis Hotline');
      expect((resource.title as any).zh).toBe('危機熱線');
      expect(resource.isEmergency).toBe(true);
      expect(resource.category).toBe('crisis_support');
    });

    test('should query resources by category and emergency status', async () => {
      // Create test resources
      await prisma.mentalHealthResource.createMany({
        data: [
          {
            title: { en: 'Crisis Line' },
            description: { en: 'Emergency support' },
            category: 'crisis_support',
            resourceType: 'hotline',
            isEmergency: true,
            isActive: true
          },
          {
            title: { en: 'Therapy Finder' },
            description: { en: 'Find therapists' },
            category: 'therapy',
            resourceType: 'website',
            isEmergency: false,
            isActive: true
          },
          {
            title: { en: 'Inactive Resource' },
            description: { en: 'Not active' },
            category: 'general',
            resourceType: 'document',
            isEmergency: false,
            isActive: false
          }
        ]
      });

      // Query emergency resources
      const emergencyResources = await prisma.mentalHealthResource.findMany({
        where: {
          isEmergency: true,
          isActive: true
        }
      });

      expect(emergencyResources).toHaveLength(1);
      expect((emergencyResources[0].title as any).en).toBe('Crisis Line');

      // Query by category
      const therapyResources = await prisma.mentalHealthResource.findMany({
        where: {
          category: 'therapy',
          isActive: true
        }
      });

      expect(therapyResources).toHaveLength(1);
      expect((therapyResources[0].title as any).en).toBe('Therapy Finder');
    });
  });

  describe('Data Relationships and Integrity', () => {
    test('should maintain referential integrity across tables', async () => {
      const user = await createTestUser(prisma);
      
      // Create related data
      const assessment = await createTestAssessment(prisma, {
        userId: user.id,
        depressionScore: 4,
        anxietyScore: 5
      });

      const moodLog = await createTestMoodLog(prisma, {
        userId: user.id,
        moodScore: 6
      });

      // Verify relationships
      const userWithData = await prisma.anonymousUser.findUnique({
        where: { id: user.id },
        include: {
          phq4Assessments: true,
          moodLogs: true,
          interactions: true,
          gamificationData: true
        }
      });

      expect(userWithData?.phq4Assessments).toHaveLength(1);
      expect(userWithData?.moodLogs).toHaveLength(1);
      expect(userWithData?.phq4Assessments[0].id).toBe(assessment.id);
      expect(userWithData?.moodLogs[0].id).toBe(moodLog.id);
    });

    test('should handle concurrent operations safely', async () => {
      const user = await createTestUser(prisma);

      // Simulate concurrent mood log creations
      const concurrentOperations = Array.from({ length: 5 }, (_, index) =>
        prisma.moodLog.create({
          data: {
            userId: user.id,
            moodScore: 5 + index,
            language: 'en'
          }
        })
      );

      const results = await Promise.all(concurrentOperations);
      
      expect(results).toHaveLength(5);
      results.forEach((moodLog, index) => {
        expect(moodLog.moodScore).toBe(5 + index);
        expect(moodLog.userId).toBe(user.id);
      });

      // Verify all mood logs were created
      const allMoodLogs = await prisma.moodLog.findMany({
        where: { userId: user.id }
      });

      expect(allMoodLogs).toHaveLength(5);
    });

    test('should handle transaction rollbacks on errors', async () => {
      const user = await createTestUser(prisma);

      // Attempt transaction that should fail
      await expect(
        prisma.$transaction(async (tx) => {
          // Create valid mood log
          await tx.moodLog.create({
            data: {
              userId: user.id,
              moodScore: 7,
              language: 'en'
            }
          });

          // This should fail and rollback the transaction
          await tx.pHQ4Assessment.create({
            data: {
              userId: user.id,
              question1Score: -1, // Invalid
              question2Score: 0,
              question3Score: 0,
              question4Score: 0,
              depressionScore: -1, // Invalid score
              anxietyScore: 3,
              totalScore: 2,
              severityLevel: 'minimal',
              language: 'en'
            }
          });
        })
      ).rejects.toThrow();

      // Verify no mood log was created due to rollback
      const moodLogs = await prisma.moodLog.findMany({
        where: { userId: user.id }
      });

      expect(moodLogs).toHaveLength(0);
    });
  });
});
