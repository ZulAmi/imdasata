import { NextApiRequest, NextApiResponse } from 'next';
import { NudgeScheduler } from '@/lib/scheduler/nudge-scheduler';

const scheduler = new NudgeScheduler();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Verify API key for security
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.SCHEDULER_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { type } = req.body;

    switch (type) {
      case 'daily_checkins':
        await scheduler.sendDailyCheckins();
        break;
      case 'mood_reminders':
        await scheduler.sendMoodReminders();
        break;
      case 'assessment_reminders':
        await scheduler.sendAssessmentReminders();
        break;
      case 'wellness_tips':
        await scheduler.sendWellnessTips();
        break;
      case 'all':
        await scheduler.sendDailyCheckins();
        await scheduler.sendMoodReminders();
        await scheduler.sendAssessmentReminders();
        await scheduler.sendWellnessTips();
        break;
      default:
        return res.status(400).json({ error: 'Invalid nudge type' });
    }

    res.status(200).json({ success: true, message: `${type} nudges sent successfully` });
  } catch (error) {
    console.error('Error running scheduler:', error);
    res.status(500).json({ error: 'Failed to run scheduler' });
  }
}