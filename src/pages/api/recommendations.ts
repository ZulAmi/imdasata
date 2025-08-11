import { NextApiRequest, NextApiResponse } from 'next';
import AIRecommendationEngine, { RecommendationRequest, UserProfile } from '../../lib/ai-recommendation-engine';
import ABTestManager from '../../lib/ab-test-manager';

// Initialize the recommendation engine and A/B test manager
const recommendationEngine = new AIRecommendationEngine();
const abTestManager = new ABTestManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userProfile, context, requestId } = req.body as {
      userProfile: UserProfile;
      context: {
        trigger: 'assessment_complete' | 'resource_view' | 'crisis_detected' | 'routine_check' | 'user_request';
        maxRecommendations: number;
        includeTypes?: string[];
        excludeTypes?: string[];
        urgencyFilter?: string;
      };
      requestId?: string;
    };

    // Validate input
    if (!userProfile || !context) {
      return res.status(400).json({ error: 'Missing required fields: userProfile and context' });
    }

    // Assign user to A/B test
    const testAssignment = abTestManager.assignUserToTest(userProfile.anonymousId, userProfile);
    
    // Create recommendation request
    const request: RecommendationRequest = {
      userProfile,
      context,
      abTestGroup: testAssignment?.variantId
    };

    // Get recommendations
    const recommendations = await recommendationEngine.getRecommendations(request);

    // Record A/B test interaction if user is in test
    if (testAssignment) {
      abTestManager.recordResult({
        testId: testAssignment.testId,
        variantId: testAssignment.variantId,
        timestamp: new Date().toISOString(),
        userId: userProfile.anonymousId,
        primaryMetric: recommendations.length > 0 ? 1 : 0, // Basic metric: whether recommendations were generated
        secondaryMetrics: {
          num_recommendations: recommendations.length,
          avg_score: recommendations.reduce((sum, rec) => sum + rec.score, 0) / Math.max(recommendations.length, 1),
          high_urgency_count: recommendations.filter(rec => rec.urgency === 'high' || rec.urgency === 'urgent').length
        },
        userRiskLevel: userProfile.phq4Scores.latest.riskLevel,
        userCountry: userProfile.demographics.location?.country || 'unknown',
        userEmploymentSector: userProfile.demographics.employmentSector || 'unknown',
        userLanguage: userProfile.demographics.language,
        recommendationsShown: recommendations.length,
        recommendationsClicked: 0, // Will be updated via separate tracking endpoint
        recommendationsCompleted: 0,
        sessionDuration: 0 // Will be updated when session ends
      });
    }

    // Return recommendations with metadata
    return res.status(200).json({
      success: true,
      recommendations,
      metadata: {
        requestId: requestId || `req_${Date.now()}`,
        abTestGroup: testAssignment?.variantId,
        totalRecommendations: recommendations.length,
        strategy: recommendations[0]?.strategy || 'none',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Recommendation API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
}

// Helper function to validate user profile
function validateUserProfile(userProfile: any): string[] {
  const errors: string[] = [];

  if (!userProfile.anonymousId) {
    errors.push('anonymousId is required');
  }

  if (!userProfile.phq4Scores?.latest) {
    errors.push('PHQ-4 scores are required');
  } else {
    const latest = userProfile.phq4Scores.latest;
    if (typeof latest.totalScore !== 'number' || latest.totalScore < 0 || latest.totalScore > 12) {
      errors.push('Invalid PHQ-4 total score');
    }
    if (!['minimal', 'mild', 'moderate', 'severe'].includes(latest.riskLevel)) {
      errors.push('Invalid risk level');
    }
  }

  if (!userProfile.demographics?.language) {
    errors.push('User language is required');
  }

  return errors;
}
