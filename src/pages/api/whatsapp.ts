import { NextApiRequest, NextApiResponse } from 'next';
import { sendWhatsAppMessage } from '../../lib/whatsapp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { to, message } = req.body;
  try {
    await sendWhatsAppMessage(to, message);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
}
