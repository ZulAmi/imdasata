import { prisma } from '@/lib/prisma';
import { WhatsAppBot } from '@/lib/whatsapp/bot';
import { PhoneMappingService } from '@/lib/services/phone-mapping.service';

export class NudgeScheduler {
  private bot: WhatsAppBot;
  private phoneService: PhoneMappingService;

  constructor() {
    this.bot = new WhatsAppBot();
    this.phoneService = new PhoneMappingService();
  }

  async sendDailyCheckins(): Promise<void> {
    try {
      // Get users who haven't had interactions in the last 24 hours
      // Using lastActiveAt from AnonymousUser instead of relation filtering
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const inactiveUsers = await prisma.anonymousUser.findMany({
        where: {
          isActive: true,
          lastActiveAt: {
            lt: cutoffDate
          }
        },
        take: 100
      });

      let successCount = 0;
      
      for (const user of inactiveUsers) {
        const phoneNumber = await this.phoneService.getPhoneNumber(user.anonymousId);
        if (phoneNumber) {
          try {
            await this.bot.sendProactiveNudge(user.id, phoneNumber, 'daily_checkin');
            successCount++;
            
            // Rate limiting to comply with WhatsApp policies
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to send nudge to user ${user.anonymousId}:`, error);
          }
        }
      }

      console.log(`Sent daily check-ins to ${successCount}/${inactiveUsers.length} users`);
    } catch (error) {
      console.error('Error sending daily check-ins:', error);
      throw error;
    }
  }

  async sendMoodReminders(): Promise<void> {
    try {
      // Get users who haven't logged mood in the last 3 days
      // Using a different approach to avoid field name issues
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      
      const usersWithRecentMoods = await prisma.moodLog.findMany({
        where: {
          loggedAt: {
            gte: threeDaysAgo
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      const recentMoodUserIds = usersWithRecentMoods.map(log => log.userId);

      const users = await prisma.anonymousUser.findMany({
        where: {
          isActive: true,
          id: {
            notIn: recentMoodUserIds
          }
        },
        take: 50
      });

      let successCount = 0;

      for (const user of users) {
        const phoneNumber = await this.phoneService.getPhoneNumber(user.anonymousId);
        if (phoneNumber) {
          try {
            await this.bot.sendProactiveNudge(user.id, phoneNumber, 'mood_log');
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to send mood reminder to user ${user.anonymousId}:`, error);
          }
        }
      }

      console.log(`Sent mood reminders to ${successCount}/${users.length} users`);
    } catch (error) {
      console.error('Error sending mood reminders:', error);
      throw error;
    }
  }

  async sendAssessmentReminders(): Promise<void> {
    try {
      // Get users who haven't completed PHQ-4 in the last 2 weeks
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      const usersWithRecentAssessments = await prisma.pHQ4Assessment.findMany({
        where: {
          completedAt: {
            gte: twoWeeksAgo
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });

      const recentAssessmentUserIds = usersWithRecentAssessments.map(assessment => assessment.userId);

      const users = await prisma.anonymousUser.findMany({
        where: {
          isActive: true,
          id: {
            notIn: recentAssessmentUserIds
          }
        },
        take: 30
      });

      let successCount = 0;

      for (const user of users) {
        const phoneNumber = await this.phoneService.getPhoneNumber(user.anonymousId);
        if (phoneNumber) {
          try {
            await this.bot.sendProactiveNudge(user.id, phoneNumber, 'assessment_reminder');
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to send assessment reminder to user ${user.anonymousId}:`, error);
          }
        }
      }

      console.log(`Sent assessment reminders to ${successCount}/${users.length} users`);
    } catch (error) {
      console.error('Error sending assessment reminders:', error);
      throw error;
    }
  }

  async sendWellnessTips(): Promise<void> {
    try {
      // Send weekly wellness tips to active users who have been active recently
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const activeUsers = await prisma.anonymousUser.findMany({
        where: {
          isActive: true,
          lastActiveAt: {
            gte: oneWeekAgo
          }
        },
        take: 100
      });

      let successCount = 0;

      for (const user of activeUsers) {
        const phoneNumber = await this.phoneService.getPhoneNumber(user.anonymousId);
        if (phoneNumber) {
          try {
            await this.bot.sendProactiveNudge(user.id, phoneNumber, 'wellness_tip');
            successCount++;
            // Longer delay for wellness tips to avoid spam
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Failed to send wellness tip to user ${user.anonymousId}:`, error);
          }
        }
      }

      console.log(`Sent wellness tips to ${successCount}/${activeUsers.length} users`);
    } catch (error) {
      console.error('Error sending wellness tips:', error);
      throw error;
    }
  }

  /**
   * Clean up old phone mappings for PDPA compliance
   * Remove mappings for users inactive for more than specified days
   */
  async cleanupInactiveUsers(inactiveDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - inactiveDays * 24 * 60 * 60 * 1000);
      
      const inactiveUsers = await prisma.anonymousUser.findMany({
        where: {
          lastActiveAt: {
            lt: cutoffDate
          },
          isActive: false
        },
        select: {
          anonymousId: true
        }
      });

      let cleanupCount = 0;
      
      for (const user of inactiveUsers) {
        try {
          await this.phoneService.deletePhoneMapping(user.anonymousId);
          cleanupCount++;
        } catch (error) {
          console.error(`Failed to cleanup phone mapping for ${user.anonymousId}:`, error);
        }
      }

      console.log(`Cleaned up ${cleanupCount} inactive user phone mappings`);
    } catch (error) {
      console.error('Error during phone mapping cleanup:', error);
      throw error;
    }
  }
}