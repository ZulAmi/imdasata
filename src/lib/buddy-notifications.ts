/**
 * Buddy System Notification Service
 * Handles notifications, reminders, and communication for the buddy system
 */

import { EventEmitter } from 'events';
import { buddySystem, BuddyPair, BuddyUser, BuddyInteraction } from './buddy-system';

export interface BuddyNotification {
  id: string;
  type: 'check-in-reminder' | 'new-buddy' | 'buddy-message' | 'achievement' | 'safety-alert' | 'system';
  userId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationPreferences {
  checkInReminders: boolean;
  buddyMessages: boolean;
  achievements: boolean;
  safetyAlerts: boolean;
  systemUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  delivery: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
}

class BuddyNotificationService extends EventEmitter {
  private notifications: Map<string, BuddyNotification[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private pushSubscriptions: Map<string, PushSubscription> = new Map();

  constructor() {
    super();
    this.setupBuddySystemListeners();
    this.startPeriodicTasks();
  }

  private setupBuddySystemListeners() {
    buddySystem.on('buddyPairCreated', (pair: BuddyPair) => {
      this.sendNewBuddyNotifications(pair);
    });

    buddySystem.on('interactionRecorded', (interaction: BuddyInteraction) => {
      this.handleInteractionNotifications(interaction);
    });

    buddySystem.on('checkInReminder', (pair: BuddyPair) => {
      this.sendCheckInReminders(pair);
    });

    buddySystem.on('safetyReportFiled', (report: any) => {
      this.sendSafetyAlerts(report);
    });

    buddySystem.on('buddyPairEnded', (data: any) => {
      this.sendPairEndedNotifications(data);
    });
  }

  // Notification Management
  createNotification(
    userId: string,
    type: BuddyNotification['type'],
    title: string,
    message: string,
    data?: any,
    priority: BuddyNotification['priority'] = 'medium'
  ): BuddyNotification {
    const notification: BuddyNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      userId,
      title,
      message,
      data,
      timestamp: new Date(),
      isRead: false,
      priority,
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
      userNotifications.splice(50);
    }
    
    this.notifications.set(userId, userNotifications);
    this.deliverNotification(notification);
    
    return notification;
  }

  private async deliverNotification(notification: BuddyNotification) {
    const prefs = this.getNotificationPreferences(notification.userId);
    
    // Check if user wants this type of notification
    if (!this.shouldDeliverNotification(notification, prefs)) {
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(prefs)) {
      // Queue for later delivery unless urgent
      if (notification.priority !== 'urgent') {
        return;
      }
    }

    // Deliver via enabled channels
    if (prefs.delivery.inApp) {
      this.emit('notificationCreated', notification);
    }

    if (prefs.delivery.push) {
      this.sendPushNotification(notification);
    }

    if (prefs.delivery.email) {
      this.sendEmailNotification(notification);
    }
  }

  private shouldDeliverNotification(notification: BuddyNotification, prefs: NotificationPreferences): boolean {
    switch (notification.type) {
      case 'check-in-reminder':
        return prefs.checkInReminders;
      case 'buddy-message':
        return prefs.buddyMessages;
      case 'achievement':
        return prefs.achievements;
      case 'safety-alert':
        return prefs.safetyAlerts;
      case 'system':
        return prefs.systemUpdates;
      default:
        return true;
    }
  }

  private isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = prefs.quietHours.start;
    const end = prefs.quietHours.end;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    return currentTime >= start && currentTime <= end;
  }

  // Push Notifications
  async registerPushSubscription(userId: string, subscription: PushSubscription) {
    this.pushSubscriptions.set(userId, subscription);
  }

  private async sendPushNotification(notification: BuddyNotification) {
    const subscription = this.pushSubscriptions.get(notification.userId);
    if (!subscription) return;

    try {
      // In a real implementation, you would use a service like Firebase Cloud Messaging
      // or web-push to send notifications. For now, we'll emit an event.
      this.emit('pushNotificationSent', {
        subscription,
        notification: {
          title: notification.title,
          body: notification.message,
          icon: '/icons/buddy-icon.png',
          badge: '/icons/buddy-badge.png',
          tag: notification.type,
          data: {
            notificationId: notification.id,
            type: notification.type,
            ...notification.data,
          },
        },
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  private async sendEmailNotification(notification: BuddyNotification) {
    // In a real implementation, you would send an email here
    // For now, we'll just emit an event
    this.emit('emailNotificationSent', {
      userId: notification.userId,
      subject: notification.title,
      body: notification.message,
      type: notification.type,
    });
  }

  // Specific Notification Handlers
  private sendNewBuddyNotifications(pair: BuddyPair) {
    const user1 = buddySystem.getUser(pair.user1Id);
    const user2 = buddySystem.getUser(pair.user2Id);

    if (user1 && user2) {
      this.createNotification(
        pair.user1Id,
        'new-buddy',
        '🤝 You have a new buddy!',
        `You've been matched with ${user2.name}. Start your support journey together!`,
        { buddyId: pair.user2Id, pairId: pair.id },
        'high'
      );

      this.createNotification(
        pair.user2Id,
        'new-buddy',
        '🤝 You have a new buddy!',
        `You've been matched with ${user1.name}. Start your support journey together!`,
        { buddyId: pair.user1Id, pairId: pair.id },
        'high'
      );
    }
  }

  private handleInteractionNotifications(interaction: BuddyInteraction) {
    const pair = buddySystem.getPair(interaction.pairId);
    if (!pair) return;

    const otherUserId = interaction.initiatorId === pair.user1Id ? pair.user2Id : pair.user1Id;
    const initiator = buddySystem.getUser(interaction.initiatorId);
    
    if (!initiator) return;

    // Don't send notifications for every text message to avoid spam
    if (interaction.type === 'text-chat') return;

    let title = '';
    let message = '';

    switch (interaction.type) {
      case 'check-in':
        title = '✅ Buddy Check-in Completed';
        message = `${initiator.name} completed a check-in. How are you doing?`;
        break;
      case 'voice-call':
        title = '📞 Buddy Call Completed';
        message = `${initiator.name} just finished a call. They might want to chat!`;
        break;
      case 'goal-update':
        title = '🎯 Buddy Goal Update';
        message = `${initiator.name} updated their goals. Check out their progress!`;
        break;
    }

    if (title && message) {
      this.createNotification(
        otherUserId,
        'buddy-message',
        title,
        message,
        { pairId: interaction.pairId, interactionId: interaction.id }
      );
    }

    // Check for achievements
    this.checkForAchievements(interaction);
  }

  private checkForAchievements(interaction: BuddyInteraction) {
    const pair = buddySystem.getPair(interaction.pairId);
    if (!pair) return;

    const userStats1 = buddySystem.getUserStats(pair.user1Id);
    const userStats2 = buddySystem.getUserStats(pair.user2Id);

    // Check various achievement conditions
    this.checkUserAchievements(pair.user1Id, userStats1, pair);
    this.checkUserAchievements(pair.user2Id, userStats2, pair);
  }

  private checkUserAchievements(userId: string, stats: any, pair: BuddyPair) {
    if (!stats) return;

    const achievements = [
      {
        condition: stats.totalInteractions === 1,
        title: '🎉 First Interaction!',
        message: 'You completed your first buddy interaction. Great start!',
      },
      {
        condition: stats.totalInteractions === 10,
        title: '💪 Regular Supporter',
        message: 'You\'ve completed 10 interactions with your buddy. Keep it up!',
      },
      {
        condition: stats.daysWithCurrentBuddy === 7,
        title: '📅 One Week Strong',
        message: 'You and your buddy have been together for a week. Amazing bond!',
      },
      {
        condition: stats.daysWithCurrentBuddy === 30,
        title: '🌟 Monthly Milestone',
        message: 'A month of buddy support! Your friendship is growing strong.',
      },
      {
        condition: stats.totalPoints >= 100,
        title: '🏆 Point Collector',
        message: 'You\'ve earned 100 buddy points! You\'re a true supporter.',
      },
      {
        condition: stats.totalPoints >= 500,
        title: '👑 Buddy Champion',
        message: 'Incredible! 500 points shows your dedication to peer support.',
      },
      {
        condition: stats.averageInteractionQuality >= 4.5,
        title: '⭐ Quality Supporter',
        message: 'Your interactions consistently rate highly. You\'re amazing!',
      },
      {
        condition: pair.interactionCount >= 50,
        title: '🤝 Unbreakable Bond',
        message: 'You and your buddy have had 50+ interactions. True friendship!',
      },
    ];

    achievements.forEach(achievement => {
      if (achievement.condition) {
        this.createNotification(
          userId,
          'achievement',
          achievement.title,
          achievement.message,
          { type: 'achievement' },
          'low'
        );
      }
    });
  }

  private sendCheckInReminders(pair: BuddyPair) {
    const user1 = buddySystem.getUser(pair.user1Id);
    const user2 = buddySystem.getUser(pair.user2Id);

    if (!user1 || !user2) return;

    const daysSinceLastInteraction = Math.floor(
      (Date.now() - pair.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
    );

    let message = `It's been ${daysSinceLastInteraction} days since you and ${user2.name} last connected. How about reaching out?`;
    
    if (daysSinceLastInteraction === 1) {
      message = `Haven't heard from ${user2.name} since yesterday. Maybe send a quick check-in?`;
    } else if (daysSinceLastInteraction === 0) {
      message = `Time for your regular check-in with ${user2.name}!`;
    }

    this.createNotification(
      pair.user1Id,
      'check-in-reminder',
      '⏰ Buddy Check-in Reminder',
      message.replace(user2.name, user1.name), // Swap names for user1
      { pairId: pair.id, buddyId: pair.user2Id }
    );

    this.createNotification(
      pair.user2Id,
      'check-in-reminder',
      '⏰ Buddy Check-in Reminder',
      message,
      { pairId: pair.id, buddyId: pair.user1Id }
    );
  }

  private sendSafetyAlerts(report: any) {
    // Notify relevant users about safety concerns
    if (report.severity === 'high' || report.severity === 'critical') {
      // For high/critical reports, notify the reporting user that action is being taken
      this.createNotification(
        report.reporterId,
        'safety-alert',
        '🛡️ Safety Report Received',
        'Your safety report has been received and is being reviewed by our team. We take all reports seriously.',
        { reportId: report.id },
        'urgent'
      );
    }
  }

  private sendPairEndedNotifications(data: { pairId: string; reason: string }) {
    const pair = buddySystem.getPair(data.pairId);
    if (!pair) return;

    const user1 = buddySystem.getUser(pair.user1Id);
    const user2 = buddySystem.getUser(pair.user2Id);

    if (!user1 || !user2) return;

    let title = '';
    let message = '';

    switch (data.reason) {
      case 'reassignment':
        title = '🔄 New Buddy Coming Soon';
        message = 'Your buddy pairing has ended and we\'re finding you a new match. Thanks for your patience!';
        break;
      case 'timeout':
        title = '😔 Buddy Pairing Ended';
        message = 'Your buddy pairing has ended due to inactivity. We\'ll help you find a new buddy when you\'re ready.';
        break;
      case 'mutual':
        title = '👋 Buddy Pairing Ended';
        message = 'Your buddy pairing has ended by mutual agreement. We hope you had a positive experience!';
        break;
      default:
        title = '📝 Buddy Pairing Ended';
        message = 'Your buddy pairing has ended. We\'re here to help you find new support when you\'re ready.';
    }

    this.createNotification(pair.user1Id, 'system', title, message, { reason: data.reason }, 'medium');
    this.createNotification(pair.user2Id, 'system', title, message, { reason: data.reason }, 'medium');
  }

  // Preference Management
  getNotificationPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || {
      checkInReminders: true,
      buddyMessages: true,
      achievements: true,
      safetyAlerts: true,
      systemUpdates: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
      delivery: {
        push: true,
        email: false,
        inApp: true,
      },
    };
  }

  updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    const current = this.getNotificationPreferences(userId);
    const updated = { ...current, ...preferences };
    this.preferences.set(userId, updated);
    this.emit('preferencesUpdated', { userId, preferences: updated });
  }

  // Notification Retrieval
  getUserNotifications(userId: string, limit = 20): BuddyNotification[] {
    const notifications = this.notifications.get(userId) || [];
    return notifications.slice(0, limit);
  }

  getUnreadCount(userId: string): number {
    const notifications = this.notifications.get(userId) || [];
    return notifications.filter(n => !n.isRead).length;
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      this.notifications.set(userId, notifications);
      this.emit('notificationRead', { userId, notificationId });
      return true;
    }
    
    return false;
  }

  markAllAsRead(userId: string): void {
    const notifications = this.notifications.get(userId) || [];
    notifications.forEach(n => n.isRead = true);
    this.notifications.set(userId, notifications);
    this.emit('allNotificationsRead', { userId });
  }

  deleteNotification(userId: string, notificationId: string): boolean {
    const notifications = this.notifications.get(userId) || [];
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    
    if (filteredNotifications.length < notifications.length) {
      this.notifications.set(userId, filteredNotifications);
      this.emit('notificationDeleted', { userId, notificationId });
      return true;
    }
    
    return false;
  }

  // Periodic Tasks
  private startPeriodicTasks() {
    // Send daily digest at 9 AM
    setInterval(() => {
      this.sendDailyDigests();
    }, 24 * 60 * 60 * 1000); // Every 24 hours

    // Clean up old notifications weekly
    setInterval(() => {
      this.cleanupOldNotifications();
    }, 7 * 24 * 60 * 60 * 1000); // Every week
  }

  private sendDailyDigests() {
    const now = new Date();
    if (now.getHours() !== 9) return; // Only send at 9 AM

    for (const [userId] of this.notifications) {
      const prefs = this.getNotificationPreferences(userId);
      if (!prefs.systemUpdates) continue;

      const user = buddySystem.getUser(userId);
      if (!user) continue;

      const pair = buddySystem.getUserPair(userId);
      if (!pair) continue;

      const buddy = buddySystem.getUser(user.currentBuddyId || '');
      if (!buddy) continue;

      const stats = buddySystem.getUserStats(userId);
      const recentInteractions = buddySystem.getPairInteractions(pair.id).slice(-3);

      const message = this.generateDailyDigest(user, buddy, stats, recentInteractions);
      
      this.createNotification(
        userId,
        'system',
        '📊 Daily Buddy Digest',
        message,
        { type: 'daily-digest' },
        'low'
      );
    }
  }

  private generateDailyDigest(user: BuddyUser, buddy: BuddyUser, stats: any, recentInteractions: any[]): string {
    const parts = [
      `Good morning, ${user.name}! Here's your buddy update:`,
      ``,
      `🤝 You and ${buddy.name} have been buddies for ${stats.daysWithCurrentBuddy} days`,
      `💬 Total interactions: ${stats.totalInteractions}`,
      `🏆 Total points: ${stats.totalPoints}`,
    ];

    if (recentInteractions.length > 0) {
      parts.push('');
      parts.push('Recent activity:');
      recentInteractions.forEach(interaction => {
        const date = new Date(interaction.timestamp).toLocaleDateString();
        parts.push(`• ${interaction.type.replace('-', ' ')} on ${date}`);
      });
    }

    const nextCheckIn = buddy.currentBuddyId ? 'Consider reaching out to your buddy today!' : 'Find a new buddy when you\'re ready.';
    parts.push('');
    parts.push(nextCheckIn);

    return parts.join('\n');
  }

  private cleanupOldNotifications() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (const [userId, notifications] of this.notifications) {
      const filteredNotifications = notifications.filter(n => n.timestamp > thirtyDaysAgo);
      this.notifications.set(userId, filteredNotifications);
    }
  }

  // System Messages
  sendSystemMessage(userId: string, title: string, message: string, data?: any) {
    this.createNotification(userId, 'system', title, message, data, 'medium');
  }

  broadcastSystemMessage(title: string, message: string, data?: any) {
    const activeUsers = buddySystem.getActiveUsers();
    activeUsers.forEach(user => {
      this.sendSystemMessage(user.id, title, message, data);
    });
  }
}

// Export singleton instance
export const buddyNotificationService = new BuddyNotificationService();
