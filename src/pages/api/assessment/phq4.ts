import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { isPDPACompliant, anonymizeData } from '../../../lib/pdpa';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { anonymousId, q1, q2, q3, q4, answers, language = 'en' } = req.body;

    // Support both individual questions and answers array
    let scores: number[];
    if (answers && Array.isArray(answers)) {
      scores = answers;
    } else if (q1 !== undefined && q2 !== undefined && q3 !== undefined && q4 !== undefined) {
      scores = [q1, q2, q3, q4];
    } else {
      return res.status(400).json({ error: 'Invalid assessment data' });
    }

    // Validate input
    if (!anonymousId || !scores.every(score => 
      Number.isInteger(score) && score >= 0 && score <= 3
    ) || scores.length !== 4) {
      return res.status(400).json({ error: 'Invalid answer values. Each answer must be 0-3.' });
    }

    // Find or create anonymous user
    let user = await prisma.anonymousUser.findUnique({
      where: { anonymousId }
    });

    if (!user) {
      user = await prisma.anonymousUser.create({
        data: {
          anonymousId,
          language,
          lastActiveAt: new Date()
        }
      });
    } else {
      await prisma.anonymousUser.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      });
    }

    // Calculate scores
    const [q1Score, q2Score, q3Score, q4Score] = scores;
    const totalScore = q1Score + q2Score + q3Score + q4Score;
    const depressionScore = q1Score + q2Score;
    const anxietyScore = q3Score + q4Score;

    // Determine severity level
    let severityLevel = 'minimal';
    if (totalScore >= 9) severityLevel = 'severe';
    else if (totalScore >= 6) severityLevel = 'moderate';
    else if (totalScore >= 3) severityLevel = 'mild';

    // Create assessment record
    const assessment = await prisma.pHQ4Assessment.create({
      data: {
        userId: user.id,
        question1Score: q1Score,
        question2Score: q2Score,
        question3Score: q3Score,
        question4Score: q4Score,
        totalScore,
        depressionScore,
        anxietyScore,
        severityLevel,
        language
      }
    });

    // Track interaction
    await prisma.userInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'assessment_completed',
        entityType: 'phq4',
        entityId: assessment.id,
        language
      }
    });

    // Update gamification data
    await prisma.gamificationData.upsert({
      where: { userId: user.id },
      update: {
        assessmentsCount: { increment: 1 },
        totalPoints: { increment: 10 }
      },
      create: {
        userId: user.id,
        assessmentsCount: 1,
        totalPoints: 10
      }
    });

    // Check if emergency referral is needed
    if (severityLevel === 'severe') {
      const emergencyResource = await prisma.mentalHealthResource.findFirst({
        where: { 
          isEmergency: true,
          isActive: true,
          languages: { has: language }
        },
        orderBy: { priority: 'desc' }
      });

      if (emergencyResource) {
        await prisma.serviceReferral.create({
          data: {
            userId: user.id,
            resourceId: emergencyResource.id,
            referralType: 'emergency',
            urgencyLevel: 'high',
            language
          }
        });
      }
    }

    res.status(201).json({
      assessmentId: assessment.id,
      totalScore,
      depressionScore,
      anxietyScore,
      severityLevel,
      recommendations: severityLevel === 'severe' 
        ? ['emergency_contact', 'professional_help']
        : severityLevel === 'moderate'
        ? ['counseling', 'support_groups']
        : ['self_care', 'monitoring']
    });

  } catch (error) {
    console.error('PHQ-4 Assessment Error:', error);
    res.status(500).json({ error: 'Assessment processing failed' });
  }
}
