import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const interactions = await prisma.userInteraction.findMany({
        where: {
          interactionType: 'WHATSAPP_MESSAGE'
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50,
        include: {
          user: {
            select: {
              anonymousId: true,
              language: true
            }
          }
        }
      });
      
      res.status(200).json(interactions);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else if (req.method === 'POST') {
    try {
      const { userId, messageContent, messageType = 'text', phoneNumber, metadata = {} } = req.body;
      
      // Validate required fields
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Store message content in metadata for PDPA compliance
      const interactionMetadata = {
        messageContent: messageContent || '',
        messageType,
        phoneNumber: phoneNumber ? 'encrypted' : undefined, // Don't store actual phone number
        platform: 'whatsapp',
        ...metadata
      };
      
      const interaction = await prisma.userInteraction.create({
        data: {
          userId,
          interactionType: 'WHATSAPP_MESSAGE',
          entityType: 'message',
          entityId: `msg_${Date.now()}`, // Generate unique message ID
          metadata: interactionMetadata,
          timestamp: new Date()
        }
      });
      
      res.status(201).json(interaction);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ error: 'Failed to create message' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
