import { NextApiRequest, NextApiResponse } from 'next';
import { WhatsAppBot } from '@/lib/whatsapp/bot';
import { prisma } from '@/lib/prisma';

const bot = new WhatsAppBot();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { userId, phoneNumber, nudgeType } = req.body;

    if (!userId || !phoneNumber || !nudgeType) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, phoneNumber, nudgeType' 
      });
    }

    // Verify user exists and is active
    const user = await prisma.anonymousUser.findUnique({
      where: { id: userId }
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    await bot.sendProactiveNudge(userId, phoneNumber, nudgeType);

    res.status(200).json({ success: true, message: 'Nudge sent successfully' });
  } catch (error) {
    console.error('Error sending nudge:', error);
    res.status(500).json({ error: 'Failed to send nudge' });
  }
}