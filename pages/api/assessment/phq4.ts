/**
 * PHQ-4 Assessment API Endpoint
 * Handles creation and retrieval of PHQ-4 depression/anxiety assessments
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { calculatePHQ4Severity, determineRiskLevel } from '@/lib/business-logic';

interface PHQ4RequestBody {
  anonymousId: string;
  answers: number[];
  language: string;
}

interface PHQ4ResponseData {
  assessment?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PHQ4ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { anonymousId, answers, language = 'en' }: PHQ4RequestBody = req.body;

    // Validate input
    if (!anonymousId || !answers || !Array.isArray(answers) || answers.length !== 4) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Validate answer scores (must be 0-3)
    for (const answer of answers) {
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        return res.status(400).json({ error: 'Invalid answer score. Must be between 0 and 3' });
      }
    }

    // Find user
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate scores
    const depressionScore = answers[0] + answers[1]; // Questions 1-2 for depression
    const anxietyScore = answers[2] + answers[3]; // Questions 3-4 for anxiety
    const totalScore = depressionScore + anxietyScore;
    
    const severityLevel = calculatePHQ4Severity(depressionScore, anxietyScore);

    // Create assessment
    const assessment = await prisma.pHQ4Assessment.create({
      data: {
        userId: user.id,
        question1Score: answers[0],
        question2Score: answers[1],
        question3Score: answers[2],
        question4Score: answers[3],
        depressionScore,
        anxietyScore,
        totalScore,
        severityLevel,
        language,
        completedAt: new Date(),
      }
    });

    // Track interaction
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'PHQ4_ASSESSMENT',
        metadata: {
          totalScore,
          severityLevel,
          language
        }
      }
    });

    // Update gamification data
    await prisma.gamificationData.upsert({
      where: { userId: user.id },
      update: {
        totalPoints: { increment: 10 }, // Points for completing assessment
        assessmentsCount: { increment: 1 },
      },
      create: {
        userId: user.id,
        totalPoints: 10,
        level: 1,
        streak: 1,
        assessmentsCount: 1,
        moodLogsCount: 0,
        resourcesViewed: 0,
      }
    });

    return res.status(201).json({ assessment });

  } catch (error) {
    console.error('PHQ-4 assessment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
