import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    } = req.body;

    // Validate input
    if (!anonymousId || !Number.isInteger(moodScore) || moodScore < 1 || moodScore > 10) {
      return res.status(400).json({ error: 'Invalid mood data' });
    }

    // Find user
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Simple sentiment analysis (in production, use a proper NLP service)
    let sentimentScore = 0;
    let sentimentLabel = 'neutral';
    
    if (moodScore >= 7) {
      sentimentScore = 0.5 + (moodScore - 7) * 0.17; // 0.5 to 1.0
      sentimentLabel = 'positive';
    } else if (moodScore <= 4) {
      sentimentScore = -0.5 - (4 - moodScore) * 0.17; // -0.5 to -1.0
      sentimentLabel = 'negative';
    } else {
      sentimentScore = (moodScore - 5.5) * 0.33; // -0.17 to 0.17
      sentimentLabel = 'neutral';
    }

    // Create mood log
    const moodLog = await prisma.moodLog.create({
      data: {
        userId: user.id,
        moodScore,
        emotions,
        notes: notes || null,
        triggers,
        sentimentScore,
        sentimentLabel,
        language
      }
    });

    // Track interaction
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'mood_logged',
        entityType: 'mood',
        entityId: moodLog.id,
        metadata: {
          moodScore,
          sentimentLabel
        },
        language
      }
    });

    // Update gamification
    await prisma.gamificationData.upsert({
      where: { userId: user.id },
      update: {
        moodLogsCount: { increment: 1 },
        totalPoints: { increment: 5 },
        lastPointsEarned: new Date()
      },
      create: {
        userId: user.id,
        moodLogsCount: 1,
        totalPoints: 5,
        lastPointsEarned: new Date()
      }
    });

    // Update user's last active time
    await prisma.anonymousUser.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    res.status(201).json({
      moodLogId: moodLog.id,
      sentimentAnalysis: {
        score: sentimentScore,
        label: sentimentLabel
      },
      pointsEarned: 5,
      message: 'Mood logged successfully'
    });

  } catch (error) {
    console.error('Mood Log Error:', error);
    res.status(500).json({ error: 'Failed to log mood' });
  }
}
