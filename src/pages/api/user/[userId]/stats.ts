import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find user by anonymousId
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId: userId },
      include: {
        phq4Assessments: {
          orderBy: { completedAt: 'desc' },
          take: 10
        },
        moodLogs: {
          orderBy: { loggedAt: 'desc' },
          take: 30
        },
        interactions: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate statistics
    const totalAssessments = user.phq4Assessments.length;
    const totalMoodLogs = user.moodLogs.length;
    const totalInteractions = user.interactions.length;

    // Recent assessment trends
    const recentAssessments = user.phq4Assessments.slice(0, 5);
    const avgTotalScore = recentAssessments.length > 0 
      ? recentAssessments.reduce((sum: number, a: any) => sum + a.totalScore, 0) / recentAssessments.length 
      : 0;
    
    const avgDepressionScore = recentAssessments.length > 0
      ? recentAssessments.reduce((sum: number, a: any) => sum + a.depressionScore, 0) / recentAssessments.length
      : 0;
    
    const avgAnxietyScore = recentAssessments.length > 0
      ? recentAssessments.reduce((sum: number, a: any) => sum + a.anxietyScore, 0) / recentAssessments.length
      : 0;

    // Mood trends
    const recentMoods = user.moodLogs.slice(0, 10);
    const avgMoodScore = recentMoods.length > 0
      ? recentMoods.reduce((sum: number, m: any) => sum + m.moodScore, 0) / recentMoods.length
      : 0;

    // Engagement metrics
    const daysSinceFirstInteraction = user.interactions.length > 0
      ? Math.floor((Date.now() - new Date(user.interactions[user.interactions.length - 1].timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const daysSinceLastActive = Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));

    // Risk assessment
    let riskLevel = 'low';
    if (avgTotalScore >= 9 || avgMoodScore <= 3) {
      riskLevel = 'high';
    } else if (avgTotalScore >= 6 || avgMoodScore <= 5) {
      riskLevel = 'moderate';
    }

    const stats = {
      userId: user.anonymousId,
      joinedAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      language: user.language,
      isActive: user.isActive,
      
      // Engagement
      totalAssessments,
      totalMoodLogs,
      totalInteractions,
      daysSinceFirstInteraction,
      daysSinceLastActive,
      
      // Mental health metrics
      avgTotalScore: Math.round(avgTotalScore * 100) / 100,
      avgDepressionScore: Math.round(avgDepressionScore * 100) / 100,
      avgAnxietyScore: Math.round(avgAnxietyScore * 100) / 100,
      avgMoodScore: Math.round(avgMoodScore * 100) / 100,
      riskLevel,
      
      // Recent trends
      recentAssessments: recentAssessments.map((a: any) => ({
        date: a.completedAt,
        totalScore: a.totalScore,
        depressionScore: a.depressionScore,
        anxietyScore: a.anxietyScore,
        severityLevel: a.severityLevel
      })),
      
      recentMoods: recentMoods.map((m: any) => ({
        date: m.loggedAt,
        score: m.moodScore,
        emotions: m.emotions,
        sentiment: m.sentimentLabel
      })),

      // Interaction patterns
      interactionTypes: user.interactions.reduce((acc: Record<string, number>, interaction: any) => {
        acc[interaction.interactionType] = (acc[interaction.interactionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    res.status(200).json({ stats });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
