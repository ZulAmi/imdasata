import { NextApiRequest, NextApiResponse } from 'next';
import ResourcesDirectoryManager from '../../lib/resources-directory';

// Initialize directory manager
const directoryManager = new ResourcesDirectoryManager();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        return handleSubmitFeedback(req, res);
      case 'GET':
        return handleGetFeedback(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Feedback API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/feedback - Submit feedback for a resource
 */
function handleSubmitFeedback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      resourceId,
      userId,
      rating,
      feedback,
      categories,
      wouldRecommend,
      visitDate
    } = req.body;

    // Validate required fields
    if (!resourceId || !userId || rating === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['resourceId', 'userId', 'rating']
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    // Create feedback object
    const feedbackData = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      resourceId,
      rating,
      feedback: feedback || '',
      categories: categories || {
        accessibility: rating,
        effectiveness: rating,
        staff_friendliness: rating,
        language_support: rating,
        wait_time: rating
      },
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : rating >= 4,
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      submittedAt: new Date().toISOString(),
      isVerified: false
    };

    // Submit feedback
    const feedbackId = directoryManager.addFeedback({
      userId,
      resourceId,
      rating,
      feedback: feedback || '',
      categories: categories || {
        accessibility: rating,
        effectiveness: rating,
        staff_friendliness: rating,
        language_support: rating,
        wait_time: rating
      },
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : rating >= 4,
      visitDate: visitDate || new Date().toISOString().split('T')[0],
      isVerified: false
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: feedbackId,
        resourceId,
        rating,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({
      error: 'Failed to submit feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/feedback - Get feedback for resources
 */
function handleGetFeedback(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { resourceId, limit = '10', offset = '0' } = req.query;

    // For now, return a placeholder since there's no public method to get feedback
    if (resourceId && typeof resourceId === 'string') {
      return res.status(200).json({
        success: true,
        message: 'Feedback retrieval not yet implemented',
        data: [],
        resourceId,
        note: 'Feedback is being collected but retrieval requires additional implementation'
      });
    }

    // Get all feedback (for admin purposes)
    // This would require a getAllFeedback method
    return res.status(200).json({
      success: true,
      message: 'Feedback endpoint',
      note: 'Specify resourceId to get feedback for a specific resource'
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({
      error: 'Failed to get feedback',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
