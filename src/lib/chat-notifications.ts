import { EventEmitter } from 'events';

export interface ChatNotification {
  id: string;
  userId: string;
  type: 'new_message' | 'mention' | 'group_invite' | 'group_activity' | 'moderation_alert' | 'daily_summary';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  groupId?: string;
  senderId?: string;
}

export interface NotificationPreferences {
  newMessages: boolean;
  mentions: boolean;
  groupInvites: boolean;
  groupActivity: boolean;
  moderationAlerts: boolean;
  dailySummary: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // 24-hour format "22:00"
    end: string;   // 24-hour format "08:00"
  };
  delivery: {
    inApp: boolean;
    push: boolean;
    email: boolean;
  };
  language: string;
}

export class ChatNotificationService extends EventEmitter {
  private notifications: Map<string, ChatNotification[]> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private pushService?: PushNotificationService;

  constructor() {
    super();
    this.initializePushService();
  }

  private initializePushService() {
    // Initialize push notification service (would integrate with FCM, APNs, etc.)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.pushService = new PushNotificationService();
    }
  }

  // User preferences management
  async setUserPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    this.userPreferences.set(userId, preferences);
    
    // Save to local storage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat_notifications_${userId}`, JSON.stringify(preferences));
    }
  }

  getUserPreferences(userId: string): NotificationPreferences {
    const saved = this.userPreferences.get(userId);
    if (saved) return saved;

    // Load from local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`chat_notifications_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.userPreferences.set(userId, parsed);
        return parsed;
      }
    }

    // Default preferences
    const defaults: NotificationPreferences = {
      newMessages: true,
      mentions: true,
      groupInvites: true,
      groupActivity: false,
      moderationAlerts: true,
      dailySummary: false,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      delivery: {
        inApp: true,
        push: true,
        email: false
      },
      language: 'en'
    };

    this.setUserPreferences(userId, defaults);
    return defaults;
  }

  // Notification creation and delivery
  async sendNotification(notification: Omit<ChatNotification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
    const userPrefs = this.getUserPreferences(notification.userId);
    
    // Check if this type of notification is enabled
    if (!this.isNotificationTypeEnabled(notification.type, userPrefs)) {
      return;
    }

    // Check quiet hours
    if (this.isInQuietHours(userPrefs.quietHours)) {
      // Queue for later delivery unless urgent
      if (notification.priority !== 'urgent') {
        await this.queueNotification(notification);
        return;
      }
    }

    const fullNotification: ChatNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };

    // Store notification
    const userNotifications = this.notifications.get(notification.userId) || [];
    userNotifications.unshift(fullNotification); // Add to beginning
    
    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.splice(100);
    }
    
    this.notifications.set(notification.userId, userNotifications);

    // Deliver notification through enabled channels
    await this.deliverNotification(fullNotification, userPrefs);

    // Emit event for real-time UI updates
    this.emit('notification_received', fullNotification);
  }

  private isNotificationTypeEnabled(type: ChatNotification['type'], prefs: NotificationPreferences): boolean {
    switch (type) {
      case 'new_message':
        return prefs.newMessages;
      case 'mention':
        return prefs.mentions;
      case 'group_invite':
        return prefs.groupInvites;
      case 'group_activity':
        return prefs.groupActivity;
      case 'moderation_alert':
        return prefs.moderationAlerts;
      case 'daily_summary':
        return prefs.dailySummary;
      default:
        return true;
    }
  }

  private isInQuietHours(quietHours: NotificationPreferences['quietHours']): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = quietHours.start;
    const end = quietHours.end;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  private async queueNotification(notification: Omit<ChatNotification, 'id' | 'timestamp' | 'isRead'>): Promise<void> {
    // In a real implementation, this would queue for delivery after quiet hours
    console.log('Notification queued for later delivery:', notification);
  }

  private async deliverNotification(notification: ChatNotification, prefs: NotificationPreferences): Promise<void> {
    try {
      // In-app notification (always delivered if enabled)
      if (prefs.delivery.inApp) {
        this.deliverInAppNotification(notification);
      }

      // Push notification
      if (prefs.delivery.push && this.pushService) {
        await this.pushService.sendPushNotification(notification, prefs);
      }

      // Email notification (would integrate with email service)
      if (prefs.delivery.email) {
        await this.sendEmailNotification(notification, prefs);
      }
    } catch (error) {
      console.error('Failed to deliver notification:', error);
    }
  }

  private deliverInAppNotification(notification: ChatNotification): void {
    // Emit event for UI to handle
    this.emit('in_app_notification', notification);
  }

  private async sendEmailNotification(notification: ChatNotification, prefs: NotificationPreferences): Promise<void> {
    // Would integrate with email service like SendGrid, AWS SES, etc.
    console.log('Email notification would be sent:', notification);
  }

  // Message-specific notification helpers
  async notifyNewMessage(
    recipientId: string, 
    senderId: string, 
    groupId: string, 
    messagePreview: string,
    groupName: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: 'new_message',
      title: `New message in ${groupName}`,
      message: messagePreview,
      data: { senderId, groupId, messagePreview },
      priority: 'normal',
      groupId,
      senderId
    });
  }

  async notifyMention(
    recipientId: string, 
    senderId: string, 
    groupId: string, 
    messageContent: string,
    groupName: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: 'mention',
      title: `You were mentioned in ${groupName}`,
      message: messageContent,
      data: { senderId, groupId, messageContent },
      priority: 'high',
      groupId,
      senderId
    });
  }

  async notifyGroupInvite(
    recipientId: string, 
    inviterId: string, 
    groupId: string, 
    groupName: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: 'group_invite',
      title: 'Group Invitation',
      message: `You've been invited to join ${groupName}`,
      data: { inviterId, groupId, groupName },
      priority: 'normal',
      groupId,
      senderId: inviterId
    });
  }

  async notifyGroupActivity(
    recipientId: string, 
    groupId: string, 
    activityType: string, 
    details: string,
    groupName: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: 'group_activity',
      title: `Activity in ${groupName}`,
      message: details,
      data: { groupId, activityType, details },
      priority: 'low',
      groupId
    });
  }

  async notifyModerationAlert(
    recipientId: string, 
    alertType: string, 
    details: string
  ): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: 'moderation_alert',
      title: 'Moderation Alert',
      message: details,
      data: { alertType, details },
      priority: 'urgent'
    });
  }

  async sendDailySummary(
    recipientId: string, 
    summaryData: any
  ): Promise<void> {
    const messageCount = summaryData.messageCount || 0;
    const groupCount = summaryData.activeGroups || 0;
    
    await this.sendNotification({
      userId: recipientId,
      type: 'daily_summary',
      title: 'Daily Chat Summary',
      message: `You received ${messageCount} messages across ${groupCount} groups today`,
      data: summaryData,
      priority: 'low'
    });
  }

  // Notification management
  getUserNotifications(userId: string, limit: number = 50): ChatNotification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(0, limit);
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.isRead = true;
      this.notifications.set(userId, userNotifications);
      this.emit('notification_read', { userId, notificationId });
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.forEach(notification => {
      notification.isRead = true;
    });
    this.notifications.set(userId, userNotifications);
    this.emit('notifications_read', { userId });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const filteredNotifications = userNotifications.filter(n => n.id !== notificationId);
    this.notifications.set(userId, filteredNotifications);
    this.emit('notification_deleted', { userId, notificationId });
  }

  getUnreadCount(userId: string): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.isRead).length;
  }

  // Group notification helpers
  async notifyGroupMembers(
    groupMemberIds: string[], 
    excludeUserId: string, 
    notification: Omit<ChatNotification, 'id' | 'timestamp' | 'isRead' | 'userId'>
  ): Promise<void> {
    const promises = groupMemberIds
      .filter(id => id !== excludeUserId)
      .map(userId => this.sendNotification({ ...notification, userId }));
    
    await Promise.all(promises);
  }

  // Cleanup old notifications
  async cleanupNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const [userId, notifications] of this.notifications) {
      const filteredNotifications = notifications.filter(
        notification => notification.timestamp > thirtyDaysAgo
      );
      this.notifications.set(userId, filteredNotifications);
    }
  }

  // Schedule daily summaries
  scheduleDailySummaries(): void {
    // Run at 8 AM every day
    const scheduleTime = new Date();
    scheduleTime.setHours(8, 0, 0, 0);
    
    if (scheduleTime <= new Date()) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    const timeUntilNext = scheduleTime.getTime() - Date.now();
    
    setTimeout(() => {
      this.processDailySummaries();
      
      // Schedule for next day
      setInterval(() => {
        this.processDailySummaries();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, timeUntilNext);
  }

  private async processDailySummaries(): Promise<void> {
    // In a real implementation, this would query the database for user activity
    for (const [userId, preferences] of this.userPreferences) {
      if (preferences.dailySummary) {
        const summaryData = await this.generateUserSummary(userId);
        await this.sendDailySummary(userId, summaryData);
      }
    }
  }

  private async generateUserSummary(userId: string): Promise<any> {
    // Mock implementation - would calculate real user activity
    return {
      messageCount: Math.floor(Math.random() * 20),
      activeGroups: Math.floor(Math.random() * 5) + 1,
      newFriends: Math.floor(Math.random() * 3),
      helpfulReactions: Math.floor(Math.random() * 10)
    };
  }
}

// Push notification service
class PushNotificationService {
  private registration?: ServiceWorkerRegistration;

  constructor() {
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw-chat-notifications.js');
        console.log('Chat notification service worker registered');
      } catch (error) {
        console.error('Failed to register service worker:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async sendPushNotification(
    notification: ChatNotification, 
    preferences: NotificationPreferences
  ): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    // Create browser notification
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/icons/chat-icon-192.png',
      badge: '/icons/chat-badge-72.png',
      tag: `chat-${notification.groupId || 'general'}`,
      data: notification.data,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low'
    });

    browserNotification.onclick = () => {
      // Focus the chat window/tab
      window.focus();
      
      // Navigate to the relevant chat group
      if (notification.groupId) {
        window.location.href = `/peer-support-chat?group=${notification.groupId}`;
      }
      
      browserNotification.close();
    };

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }
}

export default ChatNotificationService;
