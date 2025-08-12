/**
 * Track Interaction API Endpoint
 * Tracks user interactions with recommendations and resources
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface TrackInteractionRequestBody {
  userId: string;
  resourceId?: string;
  interactionType: string;
  recommendationId?: string;
  data?: Record<string, any>;
}

interface TrackInteractionResponseData {
  success?: boolean;
  qualityScore?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackInteractionResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      resourceId,
      interactionType,
      recommendationId,
      data = {}
    }: TrackInteractionRequestBody = req.body;

    // Validate required fields
    if (!userId || !interactionType) {
      return res.status(400).json({ error: 'userId and interactionType are required' });
    }

    // Find user
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate quality score based on interaction
    const qualityScore = calculateInteractionQuality(interactionType, data);

    // Create interaction record
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        interactionType: interactionType.toUpperCase(),
        entityType: resourceId ? 'RESOURCE' : 'RECOMMENDATION',
        entityId: resourceId || recommendationId,
        metadata: {
          ...data,
          qualityScore,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update gamification if it's a high-quality interaction
    if (qualityScore > 0.7) {
      await prisma.gamificationData.upsert({
        where: { userId: user.id },
        update: {
          totalPoints: { increment: Math.floor(qualityScore * 10) },
        },
        create: {
          userId: user.id,
          totalPoints: Math.floor(qualityScore * 10),
          level: 1,
          streak: 1,
          assessmentsCount: 0,
          moodLogsCount: 0,
          resourcesViewed: 1,
        }
      });
    }

    return res.status(200).json({ 
      success: true, 
      qualityScore 
    });

  } catch (error) {
    console.error('Track interaction error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Calculate quality score based on interaction type and data
 */
function calculateInteractionQuality(
  interactionType: string, 
  data: Record<string, any>
): number {
  let score = 0.5; // Base score

  switch (interactionType.toLowerCase()) {
    case 'view':
      score = 0.3;
      break;
    case 'click':
      score = 0.5;
      break;
    case 'contact':
      score = 0.8;
      break;
    case 'bookmark':
      score = 0.7;
      break;
    case 'share':
      score = 0.6;
      break;
    default:
      score = 0.4;
  }

  // Bonus for duration
  if (data.duration && typeof data.duration === 'number') {
    if (data.duration > 300) { // 5+ minutes
      score += 0.2;
    } else if (data.duration > 60) { // 1+ minute
      score += 0.1;
    }
  }

  // Bonus for completion
  if (data.completed === true) {
    score += 0.1;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}
