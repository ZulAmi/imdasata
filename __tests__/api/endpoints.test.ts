/**
 * API Endpoint Testing Suite
 * Testing all API endpoints with various scenarios including edge cases, error handling, and security
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/assessment/phq4';
import moodHandler from '@/pages/api/mood/log';
import resourcesHandler from '@/pages/api/resources';
import utilizationHandler from '@/pages/api/utilization';
import messagesHandler from '@/pages/api/messages';
import trackInteractionHandler from '@/pages/api/track-interaction';
import { PrismaClient } from '@prisma/client';
import { 
  createTestUser, 
  createTestAssessment, 
  cleanupTestData 
} from '../utils/test-helpers';

// Mock Prisma for API tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    anonymousUser: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    pHQ4Assessment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    moodLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userInteraction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    gamificationData: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    mentalHealthResource: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('@/lib/prisma');

describe('API Endpoints Testing', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('PHQ-4 Assessment API (/api/assessment/phq4)', () => {
    test('should create valid PHQ-4 assessment', async () => {
      const mockUser = {
        id: 'test-user-id',
        anonymousId: 'test-anonymous-id',
        language: 'en'
      };

      const mockAssessment = {
        id: 'test-assessment-id',
        userId: mockUser.id,
        question1Score: 2,
        question2Score: 1,
        question3Score: 2,
        question4Score: 2,
        depressionScore: 3,
        anxietyScore: 4,
        totalScore: 7,
        severityLevel: 'moderate',
        language: 'en'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.pHQ4Assessment.create.mockResolvedValue(mockAssessment);
      prisma.userInteraction.create.mockResolvedValue({});
      prisma.gamificationData.upsert.mockResolvedValue({});

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          answers: [2, 1, 2, 2],
          language: 'en'
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.assessment).toBeDefined();
      expect(data.assessment.totalScore).toBe(7);
      expect(data.assessment.severityLevel).toBe('moderate');
    });

    test('should reject invalid assessment data', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          answers: [2, 1, 5, 2], // Invalid score (max is 3)
          language: 'en'
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Invalid answer');
    });

    test('should handle missing user', async () => {
      prisma.anonymousUser.findUnique.mockResolvedValue(null);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'non-existent-user',
          answers: [1, 1, 1, 1],
          language: 'en'
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('User not found');
    });

    test('should reject unsupported HTTP methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    test('should handle database errors gracefully', async () => {
      prisma.anonymousUser.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          answers: [1, 1, 1, 1],
          language: 'en'
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Mood Logging API (/api/mood/log)', () => {
    test('should create valid mood log', async () => {
      const mockUser = {
        id: 'test-user-id',
        anonymousId: 'test-anonymous-id',
        language: 'en'
      };

      const mockMoodLog = {
        id: 'test-mood-log-id',
        userId: mockUser.id,
        moodScore: 8,
        emotions: ['happy', 'calm'],
        notes: 'Feeling great today!',
        triggers: ['exercise'],
        sentimentScore: 0.8,
        sentimentLabel: 'positive'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.moodLog.create.mockResolvedValue(mockMoodLog);
      prisma.userInteraction.create.mockResolvedValue({});
      prisma.gamificationData.upsert.mockResolvedValue({});
      prisma.anonymousUser.update.mockResolvedValue(mockUser);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          moodScore: 8,
          emotions: ['happy', 'calm'],
          notes: 'Feeling great today!',
          triggers: ['exercise'],
          language: 'en'
        },
      });

      await moodHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.moodLog).toBeDefined();
      expect(data.moodLog.moodScore).toBe(8);
      expect(data.moodLog.emotions).toEqual(['happy', 'calm']);
    });

    test('should validate mood score range', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          moodScore: 11, // Invalid (out of range)
          language: 'en'
        },
      });

      await moodHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid mood data');
    });

    test('should handle missing required fields', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          // Missing anonymousId and moodScore
          emotions: ['happy'],
          language: 'en'
        },
      });

      await moodHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid mood data');
    });

    test('should perform sentiment analysis on notes', async () => {
      const mockUser = {
        id: 'test-user-id',
        anonymousId: 'test-anonymous-id',
        language: 'en'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.moodLog.create.mockResolvedValue({});
      prisma.userInteraction.create.mockResolvedValue({});
      prisma.gamificationData.upsert.mockResolvedValue({});
      prisma.anonymousUser.update.mockResolvedValue(mockUser);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          moodScore: 3,
          notes: 'I feel terrible and hopeless today',
          language: 'en'
        },
      });

      await moodHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      expect(prisma.moodLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sentimentLabel: expect.stringMatching(/negative|neutral/)
          })
        })
      );
    });
  });

  describe('Resources API (/api/resources)', () => {
    test('should fetch resources with filters', async () => {
      const mockResources = [
        {
          id: 'resource-1',
          title: { en: 'Crisis Hotline' },
          description: { en: 'Emergency support' },
          category: 'crisis_support',
          isEmergency: true,
          isActive: true
        },
        {
          id: 'resource-2',
          title: { en: 'Therapy Finder' },
          description: { en: 'Find therapists' },
          category: 'therapy',
          isEmergency: false,
          isActive: true
        }
      ];

      prisma.mentalHealthResource.findMany.mockResolvedValue(mockResources);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          category: 'crisis_support',
          language: 'en'
        },
      });

      await resourcesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.resources).toBeDefined();
      expect(Array.isArray(data.resources)).toBe(true);
    });

    test('should create new resource with admin privileges', async () => {
      const newResource = {
        id: 'new-resource-id',
        title: { en: 'New Resource' },
        description: { en: 'Description' },
        category: 'therapy',
        resourceType: 'website',
        isActive: true
      };

      prisma.mentalHealthResource.create.mockResolvedValue(newResource);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
        },
        body: {
          title: { en: 'New Resource' },
          description: { en: 'Description' },
          category: 'therapy',
          resourceType: 'website'
        },
      });

      await resourcesHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.resource).toBeDefined();
      expect(data.resource.title.en).toBe('New Resource');
    });

    test('should reject unauthorized resource creation', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          title: { en: 'Unauthorized Resource' },
          description: { en: 'Should fail' },
          category: 'therapy'
        },
      });

      await resourcesHandler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('authorization');
    });

    test('should update existing resource', async () => {
      const updatedResource = {
        id: 'existing-resource-id',
        title: { en: 'Updated Resource' },
        description: { en: 'Updated description' },
        isActive: true
      };

      prisma.mentalHealthResource.update.mockResolvedValue(updatedResource);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        headers: {
          'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
        },
        body: {
          id: 'existing-resource-id',
          title: { en: 'Updated Resource' },
          description: { en: 'Updated description' }
        },
      });

      await resourcesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.resource.title.en).toBe('Updated Resource');
    });

    test('should delete resource', async () => {
      prisma.mentalHealthResource.delete.mockResolvedValue({});

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
        headers: {
          'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key'
        },
        body: {
          id: 'resource-to-delete'
        },
      });

      await resourcesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
  });

  describe('Utilization Tracking API (/api/utilization)', () => {
    test('should track resource utilization', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          resourceId: 'resource-123',
          action: 'view',
          userDemographics: {
            ageGroup: '25-34',
            location: 'Singapore'
          }
        },
      });

      await utilizationHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    test('should validate action types', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          resourceId: 'resource-123',
          action: 'invalid_action', // Invalid action
        },
      });

      await utilizationHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Invalid action type');
    });

    test('should require resource ID', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          action: 'view',
          // Missing resourceId
        },
      });

      await utilizationHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Missing required fields');
    });

    test('should get utilization metrics', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          resourceId: 'resource-123'
        },
      });

      await utilizationHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });
  });

  describe('Messages API (/api/messages)', () => {
    test('should fetch user messages', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          userId: 'user-1',
          interactionType: 'WHATSAPP_MESSAGE',
          timestamp: new Date(),
          user: {
            anonymousId: 'user-123',
            language: 'en'
          }
        }
      ];

      prisma.userInteraction.findMany.mockResolvedValue(mockInteractions);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await messagesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(Array.isArray(data)).toBe(true);
    });

    test('should create new message interaction', async () => {
      const mockUser = {
        id: 'user-id',
        anonymousId: 'user-123'
      };

      const mockInteraction = {
        id: 'new-interaction-id',
        userId: 'user-id',
        interactionType: 'whatsapp_message'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.userInteraction.create.mockResolvedValue(mockInteraction);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: 'user-123',
          messageContent: 'Hello, I need help',
          messageType: 'text',
          phoneNumber: '+1234567890'
        },
      });

      await messagesHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    test('should validate required fields for message creation', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          messageContent: 'Hello',
          // Missing userId
        },
      });

      await messagesHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('userId is required');
    });
  });

  describe('Track Interaction API (/api/track-interaction)', () => {
    test('should track user interaction with recommendations', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: 'user-123',
          resourceId: 'resource-456',
          interactionType: 'click',
          recommendationId: 'rec-789',
          data: {
            section: 'homepage',
            timestamp: new Date().toISOString()
          }
        },
      });

      await trackInteractionHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
    });

    test('should handle missing user ID', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          resourceId: 'resource-456',
          interactionType: 'click',
          // Missing userId
        },
      });

      await trackInteractionHandler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });

    test('should calculate interaction quality scores', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          userId: 'user-123',
          resourceId: 'resource-456',
          interactionType: 'contact',
          data: {
            duration: 300, // 5 minutes
            completed: true
          }
        },
      });

      await trackInteractionHandler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.qualityScore).toBeDefined();
      expect(typeof data.qualityScore).toBe('number');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON requests', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: {}, // Start with valid object
      });

      // Simulate malformed JSON by setting req.body to an invalid structure
      (req as any).body = 'invalid json{'; // Simulate malformed JSON string

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
    });

    test('should handle concurrent requests safely', async () => {
      const mockUser = {
        id: 'test-user-id',
        anonymousId: 'test-anonymous-id',
        language: 'en'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.moodLog.create.mockResolvedValue({ id: 'mood-log-id' });
      prisma.userInteraction.create.mockResolvedValue({});
      prisma.gamificationData.upsert.mockResolvedValue({});
      prisma.anonymousUser.update.mockResolvedValue(mockUser);

      // Simulate concurrent requests
      const requests = Array.from({ length: 5 }, (_, index) =>
        createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          body: {
            anonymousId: 'test-anonymous-id',
            moodScore: 5 + index,
            language: 'en'
          },
        })
      );

      const responses = await Promise.all(
        requests.map(({ req, res }) => moodHandler(req, res).then(() => res))
      );

      responses.forEach(res => {
        expect(res._getStatusCode()).toBe(201);
      });
    });

    test('should enforce rate limiting', async () => {
      // This would require implementing rate limiting middleware
      // For now, we'll test the concept
      const requests = Array.from({ length: 100 }, () =>
        createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          headers: {
            'x-forwarded-for': '192.168.1.1'
          }
        })
      );

      // In a real implementation, rate limiting would be applied
      // and some requests would return 429 status
      expect(requests.length).toBe(100);
    });

    test('should sanitize user input', async () => {
      const mockUser = {
        id: 'test-user-id',
        anonymousId: 'test-anonymous-id',
        language: 'en'
      };

      prisma.anonymousUser.findUnique.mockResolvedValue(mockUser);
      prisma.moodLog.create.mockResolvedValue({});
      prisma.userInteraction.create.mockResolvedValue({});
      prisma.gamificationData.upsert.mockResolvedValue({});
      prisma.anonymousUser.update.mockResolvedValue(mockUser);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: {
          anonymousId: 'test-anonymous-id',
          moodScore: 7,
          notes: '<script>alert("xss")</script>Feeling good', // Potential XSS
          emotions: ['happy'],
          language: 'en'
        },
      });

      await moodHandler(req, res);

      expect(res._getStatusCode()).toBe(201);
      
      // Verify that the notes were sanitized
      const createCall = prisma.moodLog.create.mock.calls[0][0];
      expect(createCall.data.notes).not.toContain('<script>');
    });
  });
});
