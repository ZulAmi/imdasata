/**
 * Mood Logging API Endpoint
 * Handles creation and retrieval of mood logs with sentiment analysis
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { 
  validateMoodScore, 
  calculateSentiment, 
  calculateGamificationPoints
} from '@/lib/business-logic';

interface MoodLogRequestBody {
  anonymousId: string;
  moodScore: number;
  emotions?: string[];
  notes?: string;
  triggers?: string[];
  language?: string;
}

interface MoodLogResponseData {
  moodLog?: any;
  error?: string;
  alerts?: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MoodLogResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      anonymousId, 
      moodScore, 
      emotions = [], 
      notes = '', 
      triggers = [], 
      language = 'en' 
    }: MoodLogRequestBody = req.body;

    // Validate input
    if (!anonymousId || moodScore === undefined) {
      return res.status(400).json({ error: 'Invalid mood data' });
    }

    if (!validateMoodScore(moodScore)) {
      return res.status(400).json({ error: 'Invalid mood data' });
    }

    // Find user
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Perform sentiment analysis on notes
    let sentimentScore = 0;
    let sentimentLabel = 'neutral';
    
    if (notes) {
      const sentiment = calculateSentiment(notes);
      sentimentScore = sentiment.score;
      sentimentLabel = sentiment.label;
    }

    // Check for crisis keywords (simplified detection)
    const alerts: string[] = [];
    if (notes || emotions.length > 0) {
      const textToAnalyze = `${notes} ${emotions.join(' ')}`.toLowerCase();
      const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hopeless', 'worthless'];
      
      if (crisisKeywords.some(keyword => textToAnalyze.includes(keyword))) {
        alerts.push('Crisis keywords detected - consider seeking immediate help');
      }
    }

    // Create mood log
    const moodLog = await prisma.moodLog.create({
      data: {
        userId: user.id,
        moodScore,
        emotions,
        notes: sanitizeInput(notes),
        triggers,
        sentimentScore,
        sentimentLabel,
        language,
        loggedAt: new Date(),
      }
    });

    // Track interaction
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'MOOD_LOG',
        metadata: {
          moodScore,
          sentimentLabel,
          emotionsCount: emotions.length,
          hasNotes: !!notes,
          language
        }
      }
    });

    // Calculate points for mood logging
    const points = calculateGamificationPoints('mood_log', {
      hasNotes: !!notes,
      emotionsCount: emotions.length
    });

    // Update gamification data
    await prisma.gamificationData.upsert({
      where: { userId: user.id },
      update: {
        totalPoints: { increment: points },
        moodLogsCount: { increment: 1 },
        lastPointsEarned: new Date(),
      },
      create: {
        userId: user.id,
        totalPoints: points,
        level: 1,
        streak: 1,
        assessmentsCount: 0,
        moodLogsCount: 1,
        resourcesViewed: 0,
        lastPointsEarned: new Date(),
      }
    });

    return res.status(201).json({ 
      moodLog,
      alerts: alerts.length > 0 ? alerts : undefined
    });

  } catch (error) {
    console.error('Mood log error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Sanitize user input to prevent XSS attacks
 */
function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
}
