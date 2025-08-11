import { NextApiRequest, NextApiResponse } from 'next';
import AIRecommendationEngine from '../../lib/ai-recommendation-engine';
import ABTestManager from '../../lib/ab-test-manager';

const recommendationEngine = new AIRecommendationEngine();
const abTestManager = new ABTestManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      recommendationId,
      userId,
      interactionType,
      resourceId,
      data,
      testAssignment
    } = req.body as {
      recommendationId: string;
      userId: string;
      interactionType: 'view' | 'click' | 'complete' | 'rate' | 'bookmark' | 'share';
      resourceId: string;
      data?: {
        rating?: number;
        helpfulness?: number;
        duration?: number;
        timeToInteraction?: number;
        completionPercentage?: number;
        feedbackText?: string;
      };
      testAssignment?: {
        testId: string;
        variantId: string;
      };
    };

    // Validate required fields
    if (!recommendationId || !userId || !interactionType || !resourceId) {
      return res.status(400).json({ 
        error: 'Missing required fields: recommendationId, userId, interactionType, resourceId' 
      });
    }

    // Track interaction in recommendation engine (only for supported types)
    if (['view', 'click', 'complete', 'rate'].includes(interactionType)) {
      recommendationEngine.trackInteraction(
        recommendationId, 
        interactionType as 'view' | 'click' | 'complete' | 'rate', 
        data
      );
    }

    // Update A/B test metrics if user is in a test
    if (testAssignment) {
      const existingResults = abTestManager.exportResults(testAssignment.testId)
        .filter(r => r.userId === userId);

      if (existingResults.length > 0) {
        const latestResult = existingResults[existingResults.length - 1];
        
        // Update the latest result with new interaction data
        const updatedMetrics = { ...latestResult.secondaryMetrics };
        
        switch (interactionType) {
          case 'click':
            latestResult.recommendationsClicked += 1;
            updatedMetrics.click_through_rate = latestResult.recommendationsClicked / latestResult.recommendationsShown;
            if (data?.timeToInteraction) {
              updatedMetrics.avg_time_to_click = data.timeToInteraction;
            }
            break;
            
          case 'complete':
            latestResult.recommendationsCompleted += 1;
            updatedMetrics.completion_rate = latestResult.recommendationsCompleted / Math.max(latestResult.recommendationsClicked, 1);
            if (data?.duration) {
              latestResult.sessionDuration += data.duration;
              updatedMetrics.avg_engagement_duration = data.duration;
            }
            break;
            
          case 'rate':
            if (data?.rating) {
              latestResult.satisfactionRating = data.rating;
              updatedMetrics.satisfaction_rating = data.rating;
            }
            if (data?.helpfulness) {
              latestResult.helpfulnessRating = data.helpfulness;
              updatedMetrics.helpfulness_rating = data.helpfulness;
            }
            break;
            
          case 'bookmark':
            updatedMetrics.bookmark_rate = (updatedMetrics.bookmark_rate || 0) + 1;
            break;
            
          case 'share':
            updatedMetrics.share_rate = (updatedMetrics.share_rate || 0) + 1;
            break;
        }

        // Record updated result
        abTestManager.recordResult({
          ...latestResult,
          secondaryMetrics: updatedMetrics,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Store interaction for analytics
    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recommendationId,
      userId,
      resourceId,
      type: interactionType,
      timestamp: new Date().toISOString(),
      data: data || {},
      testAssignment: testAssignment || null
    };

    // In a production system, you would store this in a database
    console.log('Interaction tracked:', interaction);

    // Generate response with relevant metrics
    const response: any = {
      success: true,
      interactionId: interaction.id,
      message: `${interactionType} interaction tracked successfully`
    };

    // Add specific response data based on interaction type
    switch (interactionType) {
      case 'click':
        response.metrics = {
          timeToClick: data?.timeToInteraction,
          resourceClicked: resourceId
        };
        break;
        
      case 'complete':
        response.metrics = {
          completionTime: data?.duration,
          completionPercentage: data?.completionPercentage
        };
        break;
        
      case 'rate':
        response.metrics = {
          rating: data?.rating,
          helpfulness: data?.helpfulness
        };
        // Trigger follow-up recommendations if rating is low
        if (data?.rating && data.rating <= 2) {
          response.suggestFollowUp = true;
          response.message = 'Low rating detected. Consider showing alternative recommendations.';
        }
        break;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Tracking API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      error: 'Failed to track interaction',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
}

// Helper function to calculate interaction quality score
function calculateInteractionQuality(
  interactionType: string, 
  data: any, 
  resourceType: string
): number {
  let baseScore = 0;
  
  switch (interactionType) {
    case 'view': baseScore = 0.1; break;
    case 'click': baseScore = 0.3; break;
    case 'complete': baseScore = 0.7; break;
    case 'rate': baseScore = 0.5; break;
    case 'bookmark': baseScore = 0.6; break;
    case 'share': baseScore = 0.8; break;
  }

  // Adjust based on data quality
  if (data?.rating && data.rating >= 4) baseScore += 0.2;
  if (data?.duration && data.duration > 30) baseScore += 0.1; // 30+ seconds engagement
  if (data?.completionPercentage && data.completionPercentage > 80) baseScore += 0.1;

  // Adjust based on resource type importance
  if (resourceType === 'crisis') baseScore += 0.1;
  if (resourceType === 'therapy') baseScore += 0.05;

  return Math.min(1.0, baseScore);
}

// Helper function to determine if follow-up is needed
function shouldTriggerFollowUp(
  interactionType: string,
  data: any,
  userRiskLevel: string
): boolean {
  // Crisis situations always need follow-up
  if (userRiskLevel === 'severe') return true;
  
  // Low ratings suggest need for better recommendations
  if (data?.rating && data.rating <= 2) return true;
  
  // Quick exits from important resources
  if (interactionType === 'click' && data?.duration && data.duration < 10) return true;
  
  // No engagement with high-priority recommendations
  if (interactionType === 'view' && data?.urgency === 'high') return true;
  
  return false;
}
