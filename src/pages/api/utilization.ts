import { NextApiRequest, NextApiResponse } from 'next';
import ResourcesDirectoryManager from '../../lib/resources-directory';

// Initialize directory manager
const directoryManager = new ResourcesDirectoryManager();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'POST':
        return handleTrackUtilization(req, res);
      case 'GET':
        return handleGetUtilization(req, res);
      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Utilization API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/utilization - Track resource utilization
 */
function handleTrackUtilization(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      resourceId,
      action,
      userDemographics,
      metadata
    } = req.body;

    // Validate required fields
    if (!resourceId || !action) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['resourceId', 'action']
      });
    }

    // Validate action type
    const validActions = ['view', 'contact', 'qr_scan', 'share', 'feedback'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        error: 'Invalid action type',
        validActions
      });
    }

    // Track the utilization
    directoryManager.trackUtilization(resourceId, action, userDemographics);

    return res.status(200).json({
      success: true,
      message: 'Utilization tracked successfully',
      data: {
        resourceId,
        action,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Track utilization error:', error);
    return res.status(500).json({
      error: 'Failed to track utilization',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/utilization - Get utilization metrics
 */
function handleGetUtilization(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { resourceId, startDate, endDate, groupBy } = req.query;

    // If resourceId is provided, get basic resource info
    if (resourceId && typeof resourceId === 'string') {
      // For now, return a placeholder since getResourceUtilization doesn't exist
      return res.status(200).json({
        success: true,
        message: 'Resource utilization tracking is active',
        resourceId,
        note: 'Detailed utilization metrics require additional implementation'
      });
    }

    // Otherwise, get aggregated metrics
    // Note: This would require additional methods in ResourcesDirectoryManager
    // For now, return a basic response
    return res.status(200).json({
      success: true,
      message: 'Utilization metrics endpoint',
      note: 'Full analytics implementation pending'
    });

  } catch (error) {
    console.error('Get utilization error:', error);
    return res.status(500).json({
      error: 'Failed to get utilization data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
