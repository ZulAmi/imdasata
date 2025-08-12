/**
 * Utilization Tracking API Endpoint
 * Tracks resource utilization metrics and analytics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface UtilizationRequestBody {
  resourceId: string;
  action: string;
  userDemographics?: {
    ageGroup?: string;
    location?: string;
    language?: string;
  };
  sessionData?: Record<string, any>;
}

interface UtilizationResponseData {
  success?: boolean;
  metrics?: any;
  error?: string;
}

const VALID_ACTIONS = ['view', 'click', 'contact', 'download', 'share', 'bookmark'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UtilizationResponseData>
) {
  try {
    switch (req.method) {
      case 'POST':
        return await handleTrackUtilization(req, res);
      case 'GET':
        return await handleGetMetrics(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Utilization tracking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTrackUtilization(
  req: NextApiRequest, 
  res: NextApiResponse<UtilizationResponseData>
) {
  const {
    resourceId,
    action,
    userDemographics = {},
    sessionData = {}
  }: UtilizationRequestBody = req.body;

  // Validate required fields
  if (!resourceId || !action) {
    return res.status(400).json({ error: 'Missing required fields: resourceId and action' });
  }

  // Validate action type
  if (!VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ 
      error: `Invalid action type. Must be one of: ${VALID_ACTIONS.join(', ')}` 
    });
  }

  // Verify resource exists
  const resource = await prisma.mentalHealthResource.findUnique({
    where: { id: resourceId }
  });

  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }

  // For now, we'll just track basic resource interactions
  // This could be expanded with a dedicated table for detailed analytics
  
  return res.status(200).json({ success: true });
}

async function handleGetMetrics(
  req: NextApiRequest, 
  res: NextApiResponse<UtilizationResponseData>
) {
  const { resourceId } = req.query;

  // For now, return basic metrics
  // This would be expanded with actual analytics data
  const metrics = {
    totalInteractions: 0,
    interactionsByType: {},
    success: true
  };

  if (resourceId) {
    const resource = await prisma.mentalHealthResource.findUnique({
      where: { id: resourceId as string },
      include: {
        interactions: true
      }
    });

    if (resource) {
      metrics.totalInteractions = resource.interactions.length;
    }
  }

  return res.status(200).json({ success: true, metrics });
}

/**
 * Get client IP address from request headers
 */
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded 
    ? forwarded.split(',')[0].trim() 
    : req.connection?.remoteAddress || '';
  
  return ip;
}

/**
 * Generate a simple session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
