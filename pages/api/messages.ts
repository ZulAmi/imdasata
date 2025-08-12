/**
 * Messages API Endpoint
 * Handles WhatsApp and other messaging interactions
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

interface MessageRequestBody {
  userId: string;
  messageContent: string;
  messageType?: string;
  phoneNumber?: string;
  language?: string;
}

interface MessageResponseData {
  messages?: any[];
  interaction?: any;
  error?: string;
  success?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<MessageResponseData>
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetMessages(req, res);
      case 'POST':
        return await handleCreateMessage(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Messages API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetMessages(
  req: NextApiRequest,
  res: NextApiResponse<MessageResponseData>
) {
  const { userId, limit = '50' } = req.query;

  let where: any = {
    interactionType: 'WHATSAPP_MESSAGE'
  };

  if (userId) {
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId: userId as string }
    });
    
    if (user) {
      where.userId = user.id;
    }
  }

  const interactions = await prisma.userInteraction.findMany({
    where,
    include: {
      user: {
        select: {
          anonymousId: true,
          language: true
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: parseInt(limit as string)
  });

  return res.status(200).json({ messages: interactions } as MessageResponseData);
}

async function handleCreateMessage(
  req: NextApiRequest,
  res: NextApiResponse<MessageResponseData>
) {
  const {
    userId,
    messageContent,
    messageType = 'text',
    phoneNumber,
    language = 'en'
  }: MessageRequestBody = req.body;

  // Validate required fields
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  if (!messageContent) {
    return res.status(400).json({ error: 'messageContent is required' });
  }

  // Find user
  const user = await prisma.anonymousUser.findUnique({
    where: { anonymousId: userId }
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create interaction record
  const interaction = await prisma.userInteraction.create({
    data: {
      userId: user.id,
      interactionType: 'WHATSAPP_MESSAGE',
      metadata: {
        messageContent: sanitizeInput(messageContent),
        messageType,
        phoneNumber,
        language,
        timestamp: new Date().toISOString()
      }
    }
  });

  return res.status(200).json({ success: true, interaction });
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
