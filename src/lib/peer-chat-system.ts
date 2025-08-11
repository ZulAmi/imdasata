import { EventEmitter } from 'events';

// Core interfaces for the peer support chat system
export interface ChatUser {
  id: string;
  anonymousId: string; // For privacy - no real names
  displayName: string;
  avatar?: string;
  languagePreferences: string[];
  countryOfOrigin?: string;
  interests: string[];
  trustScore: number; // Based on community feedback
  badges: UserBadge[];
  joinedAt: Date;
  lastActive: Date;
  isOnline: boolean;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  showCountryOfOrigin: boolean;
  showLanguages: boolean;
  allowDirectMessages: boolean;
  dataRetention: 'minimal' | 'standard' | 'extended'; // PDPA compliance
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  type: 'helper' | 'active' | 'supportive' | 'milestone';
}

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  type: 'language' | 'country' | 'interest' | 'support_topic' | 'general';
  criteria: GroupCriteria;
  members: string[]; // User IDs
  moderators: string[];
  settings: GroupSettings;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
  maxMembers: number;
  rules: string[];
}

export interface GroupCriteria {
  languages?: string[];
  countries?: string[];
  interests?: string[];
  supportTopics?: string[];
  minTrustScore?: number;
}

export interface GroupSettings {
  isPublic: boolean;
  requireApproval: boolean;
  allowVoiceMessages: boolean;
  autoModeration: boolean;
  retentionDays: number; // Message retention for privacy
  notificationsEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  content?: string;
  type: 'text' | 'voice' | 'system' | 'emoji_reaction';
  voiceData?: VoiceMessageData;
  replyTo?: string;
  reactions: MessageReaction[];
  timestamp: Date;
  isModerated: boolean;
  moderationFlag?: ModerationFlag;
  isEncrypted: boolean;
  expiresAt?: Date; // For ephemeral messages
}

export interface VoiceMessageData {
  audioUrl: string;
  duration: number;
  transcription?: string; // For accessibility
  language: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface ModerationFlag {
  reason: 'inappropriate' | 'spam' | 'harmful' | 'off_topic';
  reviewedBy?: string;
  action: 'none' | 'warning' | 'hide' | 'remove';
  reviewedAt?: Date;
}

export interface NotificationPreferences {
  newMessages: boolean;
  mentions: boolean;
  groupInvites: boolean;
  moderationAlerts: boolean;
  dailySummary: boolean;
  method: 'in_app' | 'push' | 'none';
}

// Event types for the chat system
export type ChatEvent = 
  | 'message_sent'
  | 'user_joined'
  | 'user_left'
  | 'reaction_added'
  | 'group_created'
  | 'moderation_action'
  | 'user_typing'
  | 'voice_message_sent';

export class PeerSupportChatSystem extends EventEmitter {
  private users: Map<string, ChatUser> = new Map();
  private groups: Map<string, ChatGroup> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private userGroups: Map<string, string[]> = new Map(); // userId -> groupIds
  private activeConnections: Map<string, WebSocket> = new Map();

  constructor() {
    super();
    this.initializeDefaultGroups();
    this.startCleanupScheduler();
  }

  // User Management
  async registerUser(userData: Partial<ChatUser>): Promise<ChatUser> {
    const user: ChatUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      anonymousId: `anonymous_${Math.random().toString(36).substr(2, 12)}`,
      displayName: userData.displayName || `User${Math.floor(Math.random() * 1000)}`,
      avatar: userData.avatar,
      languagePreferences: userData.languagePreferences || ['en'],
      countryOfOrigin: userData.countryOfOrigin,
      interests: userData.interests || [],
      trustScore: 50, // Starting trust score
      badges: [],
      joinedAt: new Date(),
      lastActive: new Date(),
      isOnline: false,
      privacySettings: {
        showCountryOfOrigin: userData.privacySettings?.showCountryOfOrigin ?? false,
        showLanguages: userData.privacySettings?.showLanguages ?? true,
        allowDirectMessages: userData.privacySettings?.allowDirectMessages ?? true,
        dataRetention: userData.privacySettings?.dataRetention || 'standard'
      }
    };

    this.users.set(user.id, user);
    this.userGroups.set(user.id, []);
    
    // Auto-join appropriate groups
    await this.autoJoinGroups(user.id);
    
    this.emit('user_registered', user);
    return user;
  }

  async updateUserPreferences(userId: string, updates: Partial<ChatUser>): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    Object.assign(user, updates);
    this.users.set(userId, user);
    
    // Re-evaluate group memberships if preferences changed
    if (updates.languagePreferences || updates.countryOfOrigin || updates.interests) {
      await this.autoJoinGroups(userId);
    }
  }

  async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    user.isOnline = isOnline;
    user.lastActive = new Date();
    this.users.set(userId, user);

    // Notify user's groups
    const userGroupIds = this.userGroups.get(userId) || [];
    userGroupIds.forEach(groupId => {
      this.emit('user_status_changed', { userId, groupId, isOnline });
    });
  }

  // Group Management
  async createGroup(groupData: Partial<ChatGroup>, creatorId: string): Promise<ChatGroup> {
    const group: ChatGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: groupData.name || 'New Group',
      description: groupData.description || '',
      type: groupData.type || 'general',
      criteria: groupData.criteria || {},
      members: [creatorId],
      moderators: [creatorId],
      settings: {
        isPublic: true,
        requireApproval: false,
        allowVoiceMessages: true,
        autoModeration: true,
        retentionDays: 30,
        notificationsEnabled: true,
        ...groupData.settings
      },
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      maxMembers: groupData.maxMembers || 50,
      rules: groupData.rules || this.getDefaultGroupRules()
    };

    this.groups.set(group.id, group);
    this.messages.set(group.id, []);
    
    // Add creator to group
    const userGroups = this.userGroups.get(creatorId) || [];
    userGroups.push(group.id);
    this.userGroups.set(creatorId, userGroups);

    this.emit('group_created', group);
    return group;
  }

  async joinGroup(userId: string, groupId: string): Promise<boolean> {
    const user = this.users.get(userId);
    const group = this.groups.get(groupId);
    
    if (!user || !group) return false;
    if (group.members.includes(userId)) return true;
    if (group.members.length >= group.maxMembers) return false;

    // Check if user meets criteria
    if (!this.meetsGroupCriteria(user, group.criteria)) return false;

    group.members.push(userId);
    group.lastActivity = new Date();
    this.groups.set(groupId, group);

    const userGroups = this.userGroups.get(userId) || [];
    userGroups.push(groupId);
    this.userGroups.set(userId, userGroups);

    // Send welcome message
    await this.sendSystemMessage(groupId, `${user.displayName} joined the group`, 'user_joined');

    this.emit('user_joined', { userId, groupId });
    return true;
  }

  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const user = this.users.get(userId);
    const group = this.groups.get(groupId);
    
    if (!user || !group) return false;

    // Remove user from group
    group.members = group.members.filter(id => id !== userId);
    
    // Remove moderator status if applicable
    group.moderators = group.moderators.filter(id => id !== userId);
    
    // If no moderators left, assign to most trusted member
    if (group.moderators.length === 0 && group.members.length > 0) {
      const mostTrusted = group.members.reduce((prev, current) => {
        const prevUser = this.users.get(prev);
        const currentUser = this.users.get(current);
        return (currentUser?.trustScore || 0) > (prevUser?.trustScore || 0) ? current : prev;
      });
      group.moderators.push(mostTrusted);
    }

    this.groups.set(groupId, group);

    // Remove group from user's list
    const userGroups = this.userGroups.get(userId) || [];
    this.userGroups.set(userId, userGroups.filter(id => id !== groupId));

    // Send leave message
    await this.sendSystemMessage(groupId, `${user.displayName} left the group`, 'user_left');

    this.emit('user_left', { userId, groupId });
    return true;
  }

  // Messaging
  async sendMessage(
    userId: string, 
    groupId: string, 
    content: string, 
    type: 'text' | 'voice' = 'text',
    voiceData?: VoiceMessageData
  ): Promise<ChatMessage | null> {
    const user = this.users.get(userId);
    const group = this.groups.get(groupId);
    
    if (!user || !group || !group.members.includes(userId)) return null;

    // Content moderation
    const moderationResult = await this.moderateContent(content, userId);
    
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      senderId: userId,
      content: moderationResult.approved ? content : '[Message hidden by moderation]',
      type,
      voiceData,
      reactions: [],
      timestamp: new Date(),
      isModerated: !moderationResult.approved,
      moderationFlag: moderationResult.flag,
      isEncrypted: true,
      expiresAt: this.calculateMessageExpiration(group.settings.retentionDays)
    };

    const groupMessages = this.messages.get(groupId) || [];
    groupMessages.push(message);
    this.messages.set(groupId, groupMessages);

    // Update group activity
    group.lastActivity = new Date();
    this.groups.set(groupId, group);

    // Award badges for activity
    await this.checkAndAwardBadges(userId);

    this.emit('message_sent', message);
    return message;
  }

  async addReaction(userId: string, messageId: string, emoji: string): Promise<boolean> {
    // Find message across all groups
    for (const [groupId, messages] of this.messages) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        // Check if user is in the group
        const group = this.groups.get(groupId);
        if (!group?.members.includes(userId)) return false;

        // Remove existing reaction from this user
        message.reactions = message.reactions.filter(r => r.userId !== userId);
        
        // Add new reaction
        message.reactions.push({
          emoji,
          userId,
          timestamp: new Date()
        });

        this.emit('reaction_added', { messageId, userId, emoji });
        return true;
      }
    }
    return false;
  }

  async getGroupMessages(groupId: string, userId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const group = this.groups.get(groupId);
    if (!group?.members.includes(userId)) return [];

    const messages = this.messages.get(groupId) || [];
    return messages
      .filter(m => !m.expiresAt || m.expiresAt > new Date())
      .slice(-limit - offset, -offset || undefined)
      .reverse();
  }

  // Auto-grouping based on user preferences
  private async autoJoinGroups(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    for (const [groupId, group] of this.groups) {
      if (group.isActive && 
          group.settings.isPublic && 
          !group.members.includes(userId) &&
          group.members.length < group.maxMembers &&
          this.meetsGroupCriteria(user, group.criteria)) {
        
        await this.joinGroup(userId, groupId);
      }
    }
  }

  private meetsGroupCriteria(user: ChatUser, criteria: GroupCriteria): boolean {
    // Language matching
    if (criteria.languages?.length) {
      const hasLanguageMatch = criteria.languages.some(lang => 
        user.languagePreferences.includes(lang)
      );
      if (!hasLanguageMatch) return false;
    }

    // Country matching (only if user allows sharing)
    if (criteria.countries?.length && user.privacySettings.showCountryOfOrigin) {
      if (!criteria.countries.includes(user.countryOfOrigin || '')) return false;
    }

    // Interest matching
    if (criteria.interests?.length) {
      const hasInterestMatch = criteria.interests.some(interest => 
        user.interests.includes(interest)
      );
      if (!hasInterestMatch) return false;
    }

    // Trust score requirement
    if (criteria.minTrustScore && user.trustScore < criteria.minTrustScore) {
      return false;
    }

    return true;
  }

  // Content Moderation
  private async moderateContent(content: string, userId: string): Promise<{
    approved: boolean;
    flag?: ModerationFlag;
  }> {
    const user = this.users.get(userId);
    if (!user) return { approved: false };

    // Basic content filtering
    const inappropriatePatterns = [
      /\b(hate|harm|violence|abuse)\b/i,
      /\b(spam|scam|fraud)\b/i,
      // Add more patterns as needed
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        return {
          approved: false,
          flag: {
            reason: 'inappropriate',
            action: 'hide',
            reviewedAt: new Date()
          }
        };
      }
    }

    // Trust score based approval
    if (user.trustScore < 20) {
      return {
        approved: false,
        flag: {
          reason: 'harmful',
          action: 'remove',
          reviewedAt: new Date()
        }
      };
    }

    return { approved: true };
  }

  // Gamification & Badges
  private async checkAndAwardBadges(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    const userMessages = await this.getUserMessageCount(userId);
    const userGroups = this.userGroups.get(userId)?.length || 0;

    // Activity badges
    if (userMessages >= 10 && !user.badges.some(b => b.id === 'active_chatter')) {
      user.badges.push({
        id: 'active_chatter',
        name: 'Active Chatter',
        description: 'Sent 10 messages',
        icon: '💬',
        earnedAt: new Date(),
        type: 'active'
      });
    }

    // Helper badges based on reactions received
    const helpfulReactions = await this.getHelpfulReactionsCount(userId);
    if (helpfulReactions >= 5 && !user.badges.some(b => b.id === 'helpful_friend')) {
      user.badges.push({
        id: 'helpful_friend',
        name: 'Helpful Friend',
        description: 'Received 5 helpful reactions',
        icon: '🤝',
        earnedAt: new Date(),
        type: 'helper'
      });
      
      // Increase trust score
      user.trustScore = Math.min(100, user.trustScore + 5);
    }

    this.users.set(userId, user);
  }

  private async getUserMessageCount(userId: string): Promise<number> {
    let count = 0;
    for (const messages of this.messages.values()) {
      count += messages.filter(m => m.senderId === userId).length;
    }
    return count;
  }

  private async getHelpfulReactionsCount(userId: string): Promise<number> {
    let count = 0;
    const helpfulEmojis = ['👍', '❤️', '🙏', '💪'];
    
    for (const messages of this.messages.values()) {
      for (const message of messages) {
        if (message.senderId === userId) {
          count += message.reactions.filter(r => 
            helpfulEmojis.includes(r.emoji)
          ).length;
        }
      }
    }
    return count;
  }

  // System messages
  private async sendSystemMessage(groupId: string, content: string, eventType: string): Promise<void> {
    const message: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId,
      senderId: 'system',
      content,
      type: 'system',
      reactions: [],
      timestamp: new Date(),
      isModerated: false,
      isEncrypted: false
    };

    const groupMessages = this.messages.get(groupId) || [];
    groupMessages.push(message);
    this.messages.set(groupId, groupMessages);
  }

  // Privacy & Data Management
  private calculateMessageExpiration(retentionDays: number): Date {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + retentionDays);
    return expiration;
  }

  private startCleanupScheduler(): void {
    // Clean up expired messages every hour
    setInterval(() => {
      this.cleanupExpiredMessages();
    }, 60 * 60 * 1000);
  }

  private cleanupExpiredMessages(): void {
    const now = new Date();
    
    for (const [groupId, messages] of this.messages) {
      const validMessages = messages.filter(m => 
        !m.expiresAt || m.expiresAt > now
      );
      this.messages.set(groupId, validMessages);
    }
  }

  // Initialize default groups
  private initializeDefaultGroups(): void {
    const defaultGroups = [
      {
        name: 'English Support Circle',
        description: 'General support in English',
        type: 'language' as const,
        criteria: { languages: ['en'] }
      },
      {
        name: '华语互助圈 (Chinese Support)',
        description: 'General support in Chinese',
        type: 'language' as const,
        criteria: { languages: ['zh'] }
      },
      {
        name: 'বাংলা সাহায্য (Bengali Support)',
        description: 'General support in Bengali',
        type: 'language' as const,
        criteria: { languages: ['bn'] }
      },
      {
        name: 'New Arrivals Welcome',
        description: 'Support for newcomers to Singapore',
        type: 'support_topic' as const,
        criteria: { interests: ['newcomer_support'] }
      },
      {
        name: 'Work Stress Support',
        description: 'Dealing with workplace challenges',
        type: 'support_topic' as const,
        criteria: { interests: ['work_stress'] }
      }
    ];

    defaultGroups.forEach(async (groupData) => {
      await this.createGroup(groupData, 'system');
    });
  }

  private getDefaultGroupRules(): string[] {
    return [
      'Be respectful and kind to all members',
      'No personal attacks or harassment',
      'Keep conversations supportive and constructive',
      'Respect privacy - no sharing personal information',
      'Use appropriate language for all ages',
      'No spam or promotional content',
      'Support each other\'s mental health journey'
    ];
  }

  // Notification system
  async sendNotification(userId: string, type: string, data: any): Promise<void> {
    const user = this.users.get(userId);
    if (!user) return;

    // Implement notification delivery based on user preferences
    this.emit('notification', { userId, type, data });
  }

  // Analytics & Insights (Privacy-compliant)
  getGroupStats(groupId: string): {
    memberCount: number;
    messageCount: number;
    activeMembers: number;
    lastActivity: Date;
  } | null {
    const group = this.groups.get(groupId);
    if (!group) return null;

    const messages = this.messages.get(groupId) || [];
    const activeMembers = group.members.filter(userId => {
      const user = this.users.get(userId);
      return user?.isOnline || false;
    }).length;

    return {
      memberCount: group.members.length,
      messageCount: messages.length,
      activeMembers,
      lastActivity: group.lastActivity
    };
  }

  // Export for admin/moderation tools
  async exportUserData(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;

    // Return user data for PDPA compliance
    return {
      profile: user,
      groups: this.userGroups.get(userId) || [],
      messageCount: await this.getUserMessageCount(userId)
    };
  }

  async deleteUserData(userId: string): Promise<boolean> {
    // PDPA Right to be forgotten
    const user = this.users.get(userId);
    if (!user) return false;

    // Remove from all groups
    const userGroupIds = this.userGroups.get(userId) || [];
    for (const groupId of userGroupIds) {
      await this.leaveGroup(userId, groupId);
    }

    // Anonymize messages (don't delete to maintain conversation context)
    for (const messages of this.messages.values()) {
      messages.forEach(message => {
        if (message.senderId === userId) {
          message.senderId = 'anonymous';
          message.content = '[Message from deleted user]';
        }
      });
    }

    // Remove user data
    this.users.delete(userId);
    this.userGroups.delete(userId);

    return true;
  }
}

export default PeerSupportChatSystem;
