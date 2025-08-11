/**
 * Buddy Pairing System for SATA Mental Wellness Platform
 * Provides 1-on-1 peer support connections with safety and gamification
 */

import { EventEmitter } from 'events';

export interface BuddyUser {
  id: string;
  name: string;
  language: string;
  country: string;
  interests: string[];
  timezone: string;
  availableTimes: string[]; // e.g., ['morning', 'afternoon', 'evening']
  experienceLevel: 'newcomer' | 'experienced' | 'veteran';
  supportPreferences: {
    communicationStyle: 'casual' | 'structured' | 'flexible';
    topicsOfInterest: string[];
    triggerWarnings: string[];
    preferredGender?: 'male' | 'female' | 'any';
    ageRange?: [number, number];
  };
  trustScore: number;
  totalBuddyPoints: number;
  currentBuddyId?: string;
  buddyHistory: string[];
  joinedAt: Date;
  lastActive: Date;
  isActive: boolean;
  privacySettings: {
    shareLocation: boolean;
    sharePersonalInfo: boolean;
    allowVoiceMessages: boolean;
  };
}

export interface BuddyPair {
  id: string;
  user1Id: string;
  user2Id: string;
  pairedAt: Date;
  lastInteraction: Date;
  interactionCount: number;
  compatibilityScore: number;
  status: 'active' | 'inactive' | 'ended' | 'reported';
  endReason?: 'mutual' | 'timeout' | 'report' | 'reassignment';
  checkInFrequency: 'daily' | 'weekly' | 'biweekly';
  nextScheduledCheckIn?: Date;
  sharedGoals: string[];
  conversationStarters: string[];
  points: {
    user1Points: number;
    user2Points: number;
    totalSharedPoints: number;
  };
}

export interface BuddyInteraction {
  id: string;
  pairId: string;
  initiatorId: string;
  type: 'check-in' | 'voice-call' | 'text-chat' | 'goal-update' | 'emergency';
  timestamp: Date;
  duration?: number; // in minutes
  quality: 1 | 2 | 3 | 4 | 5; // 1-5 rating
  pointsEarned: number;
  conversationStarter?: string;
  mood: {
    before: number; // 1-10 scale
    after: number;  // 1-10 scale
  };
  notes?: string;
  isEmergency: boolean;
}

export interface ConversationStarter {
  id: string;
  category: 'check-in' | 'goal-setting' | 'coping-strategies' | 'cultural-exchange' | 'light-hearted';
  text: string;
  followUpQuestions: string[];
  culturallySensitive: boolean;
  experienceLevel: 'all' | 'newcomer' | 'experienced';
}

export interface SafetyReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  pairId?: string;
  reason: 'inappropriate-behavior' | 'harassment' | 'privacy-violation' | 'emergency' | 'other';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  moderatorNotes?: string;
  actionTaken?: string;
}

export class BuddySystem extends EventEmitter {
  private users: Map<string, BuddyUser> = new Map();
  private pairs: Map<string, BuddyPair> = new Map();
  private interactions: Map<string, BuddyInteraction[]> = new Map();
  private reports: Map<string, SafetyReport> = new Map();
  private conversationStarters: ConversationStarter[] = [];
  private matchingQueue: string[] = [];

  constructor() {
    super();
    this.initializeConversationStarters();
    this.startPeriodicTasks();
  }

  // User Management
  registerUser(userData: Partial<BuddyUser> & { id: string; name: string }): BuddyUser {
    const user: BuddyUser = {
      language: 'en',
      country: 'unknown',
      interests: [],
      timezone: 'UTC',
      availableTimes: ['evening'],
      experienceLevel: 'newcomer',
      supportPreferences: {
        communicationStyle: 'flexible',
        topicsOfInterest: [],
        triggerWarnings: [],
      },
      trustScore: 50,
      totalBuddyPoints: 0,
      buddyHistory: [],
      joinedAt: new Date(),
      lastActive: new Date(),
      isActive: true,
      privacySettings: {
        shareLocation: false,
        sharePersonalInfo: false,
        allowVoiceMessages: true,
      },
      ...userData,
    };

    this.users.set(user.id, user);
    this.emit('userRegistered', user);
    
    // Add to matching queue
    this.addToMatchingQueue(user.id);
    
    return user;
  }

  updateUserPreferences(userId: string, preferences: Partial<BuddyUser['supportPreferences']>): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.supportPreferences = { ...user.supportPreferences, ...preferences };
    this.users.set(userId, user);
    this.emit('userPreferencesUpdated', user);
    return true;
  }

  // Buddy Matching Algorithm
  private calculateCompatibilityScore(user1: BuddyUser, user2: BuddyUser): number {
    let score = 0;
    const weights = {
      language: 0.25,
      timezone: 0.15,
      interests: 0.20,
      experienceLevel: 0.15,
      communicationStyle: 0.10,
      availableTimes: 0.10,
      ageRange: 0.05,
    };

    // Language compatibility
    if (user1.language === user2.language) {
      score += weights.language * 100;
    }

    // Timezone compatibility (within 3 hours)
    const timezoneScore = Math.max(0, 100 - Math.abs(this.getTimezoneOffset(user1.timezone) - this.getTimezoneOffset(user2.timezone)) * 10);
    score += weights.timezone * timezoneScore;

    // Shared interests
    const sharedInterests = user1.interests.filter(interest => user2.interests.includes(interest));
    const interestScore = Math.min(100, (sharedInterests.length / Math.max(user1.interests.length, user2.interests.length, 1)) * 100);
    score += weights.interests * interestScore;

    // Experience level compatibility
    const experienceLevels = ['newcomer', 'experienced', 'veteran'];
    const user1Level = experienceLevels.indexOf(user1.experienceLevel);
    const user2Level = experienceLevels.indexOf(user2.experienceLevel);
    const experienceScore = Math.max(0, 100 - Math.abs(user1Level - user2Level) * 25);
    score += weights.experienceLevel * experienceScore;

    // Communication style
    if (user1.supportPreferences.communicationStyle === user2.supportPreferences.communicationStyle ||
        user1.supportPreferences.communicationStyle === 'flexible' ||
        user2.supportPreferences.communicationStyle === 'flexible') {
      score += weights.communicationStyle * 100;
    }

    // Available times overlap
    const sharedTimes = user1.availableTimes.filter(time => user2.availableTimes.includes(time));
    const timeScore = (sharedTimes.length / Math.max(user1.availableTimes.length, user2.availableTimes.length, 1)) * 100;
    score += weights.availableTimes * timeScore;

    // Age range compatibility
    if (user1.supportPreferences.ageRange && user2.supportPreferences.ageRange) {
      const [min1, max1] = user1.supportPreferences.ageRange;
      const [min2, max2] = user2.supportPreferences.ageRange;
      const overlap = Math.max(0, Math.min(max1, max2) - Math.max(min1, min2));
      const totalRange = Math.max(max1, max2) - Math.min(min1, min2);
      const ageScore = totalRange > 0 ? (overlap / totalRange) * 100 : 100;
      score += weights.ageRange * ageScore;
    }

    return Math.round(score);
  }

  private getTimezoneOffset(timezone: string): number {
    // Simplified timezone offset calculation
    const offsets: { [key: string]: number } = {
      'UTC': 0, 'GMT': 0, 'EST': -5, 'PST': -8, 'CST': -6, 'MST': -7,
      'JST': 9, 'SGT': 8, 'IST': 5.5, 'CET': 1, 'EET': 2,
    };
    return offsets[timezone] || 0;
  }

  findBestMatch(userId: string): BuddyUser | null {
    const user = this.users.get(userId);
    if (!user || user.currentBuddyId) return null;

    let bestMatch: BuddyUser | null = null;
    let bestScore = 0;

    for (const [candidateId, candidate] of this.users) {
      if (candidateId === userId || candidate.currentBuddyId || !candidate.isActive) continue;
      
      // Check if they've been paired before
      if (user.buddyHistory.includes(candidateId)) continue;

      // Gender preference check
      if (user.supportPreferences.preferredGender && 
          user.supportPreferences.preferredGender !== 'any' &&
          candidate.supportPreferences.preferredGender !== user.supportPreferences.preferredGender) {
        continue;
      }

      const score = this.calculateCompatibilityScore(user, candidate);
      if (score > bestScore && score >= 60) { // Minimum compatibility threshold
        bestScore = score;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  // Buddy Pairing
  createBuddyPair(user1Id: string, user2Id: string): BuddyPair | null {
    const user1 = this.users.get(user1Id);
    const user2 = this.users.get(user2Id);

    if (!user1 || !user2 || user1.currentBuddyId || user2.currentBuddyId) {
      return null;
    }

    const pairId = `pair_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const compatibilityScore = this.calculateCompatibilityScore(user1, user2);

    const pair: BuddyPair = {
      id: pairId,
      user1Id,
      user2Id,
      pairedAt: new Date(),
      lastInteraction: new Date(),
      interactionCount: 0,
      compatibilityScore,
      status: 'active',
      checkInFrequency: 'weekly',
      sharedGoals: [],
      conversationStarters: this.getPersonalizedStarters(user1, user2),
      points: {
        user1Points: 0,
        user2Points: 0,
        totalSharedPoints: 0,
      },
    };

    // Update users
    user1.currentBuddyId = user2Id;
    user2.currentBuddyId = user1Id;
    user1.buddyHistory.push(user2Id);
    user2.buddyHistory.push(user1Id);

    this.pairs.set(pairId, pair);
    this.interactions.set(pairId, []);
    this.users.set(user1Id, user1);
    this.users.set(user2Id, user2);

    this.emit('buddyPairCreated', pair);
    return pair;
  }

  // Auto-matching
  addToMatchingQueue(userId: string): void {
    if (!this.matchingQueue.includes(userId)) {
      this.matchingQueue.push(userId);
      this.processMatchingQueue();
    }
  }

  private processMatchingQueue(): void {
    if (this.matchingQueue.length < 2) return;

    const processedUsers = new Set<string>();

    for (const userId of [...this.matchingQueue]) {
      if (processedUsers.has(userId)) continue;

      const user = this.users.get(userId);
      if (!user || user.currentBuddyId || !user.isActive) {
        this.matchingQueue = this.matchingQueue.filter(id => id !== userId);
        continue;
      }

      const match = this.findBestMatch(userId);
      if (match && !processedUsers.has(match.id)) {
        const pair = this.createBuddyPair(userId, match.id);
        if (pair) {
          processedUsers.add(userId);
          processedUsers.add(match.id);
          this.matchingQueue = this.matchingQueue.filter(id => id !== userId && id !== match.id);
        }
      }
    }
  }

  // Interaction Tracking
  recordInteraction(pairId: string, interaction: Omit<BuddyInteraction, 'id' | 'timestamp'>): BuddyInteraction {
    const interactionId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullInteraction: BuddyInteraction = {
      id: interactionId,
      timestamp: new Date(),
      ...interaction,
    };

    const pairInteractions = this.interactions.get(pairId) || [];
    pairInteractions.push(fullInteraction);
    this.interactions.set(pairId, pairInteractions);

    // Update pair stats
    const pair = this.pairs.get(pairId);
    if (pair) {
      pair.lastInteraction = new Date();
      pair.interactionCount++;
      
      // Award points
      const basePoints = this.calculateInteractionPoints(fullInteraction);
      if (interaction.initiatorId === pair.user1Id) {
        pair.points.user1Points += basePoints;
      } else {
        pair.points.user2Points += basePoints;
      }
      pair.points.totalSharedPoints += basePoints;

      // Update user points
      const initiator = this.users.get(interaction.initiatorId);
      if (initiator) {
        initiator.totalBuddyPoints += basePoints;
        this.users.set(interaction.initiatorId, initiator);
      }

      this.pairs.set(pairId, pair);
    }

    this.emit('interactionRecorded', fullInteraction);
    return fullInteraction;
  }

  private calculateInteractionPoints(interaction: BuddyInteraction): number {
    let points = 10; // Base points

    // Quality bonus
    points += (interaction.quality - 1) * 5;

    // Type bonus
    const typeBonus = {
      'check-in': 5,
      'voice-call': 15,
      'text-chat': 8,
      'goal-update': 12,
      'emergency': 20,
    };
    points += typeBonus[interaction.type] || 0;

    // Duration bonus for calls
    if (interaction.duration) {
      points += Math.min(20, Math.floor(interaction.duration / 5)); // 1 point per 5 minutes, max 20
    }

    // Mood improvement bonus
    if (interaction.mood.after > interaction.mood.before) {
      points += (interaction.mood.after - interaction.mood.before) * 2;
    }

    return points;
  }

  // Conversation Starters
  private initializeConversationStarters(): void {
    this.conversationStarters = [
      {
        id: 'check-in-1',
        category: 'check-in',
        text: 'How has your week been treating you? Any highlights or challenges?',
        followUpQuestions: [
          'What made that moment special/difficult for you?',
          'How did you handle that situation?',
          'What would you do differently next time?'
        ],
        culturallySensitive: true,
        experienceLevel: 'all',
      },
      {
        id: 'goal-1',
        category: 'goal-setting',
        text: 'What\'s one small thing you\'d like to accomplish this week?',
        followUpQuestions: [
          'What steps could help you get there?',
          'What might get in the way?',
          'How can I support you with this goal?'
        ],
        culturallySensitive: true,
        experienceLevel: 'all',
      },
      {
        id: 'coping-1',
        category: 'coping-strategies',
        text: 'What\'s something that always helps you feel a bit better when you\'re down?',
        followUpQuestions: [
          'When did you first discover this helps?',
          'Have you tried sharing this with others?',
          'Are there variations of this that work too?'
        ],
        culturallySensitive: true,
        experienceLevel: 'experienced',
      },
      {
        id: 'cultural-1',
        category: 'cultural-exchange',
        text: 'What\'s a tradition or custom from your background that brings you comfort?',
        followUpQuestions: [
          'How do you maintain this tradition here?',
          'Have you adapted it to your new environment?',
          'Would you like to share this with others?'
        ],
        culturallySensitive: true,
        experienceLevel: 'all',
      },
      {
        id: 'light-1',
        category: 'light-hearted',
        text: 'If you could have any superpower for just one day, what would you choose?',
        followUpQuestions: [
          'What would you do first with that power?',
          'How would you use it to help others?',
          'What would be the funniest way to use it?'
        ],
        culturallySensitive: true,
        experienceLevel: 'all',
      },
      {
        id: 'newcomer-1',
        category: 'check-in',
        text: 'What\'s been the most surprising thing about settling in here?',
        followUpQuestions: [
          'How different was it from what you expected?',
          'What has helped you adjust?',
          'What do you miss most from home?'
        ],
        culturallySensitive: true,
        experienceLevel: 'newcomer',
      },
    ];
  }

  getPersonalizedStarters(user1: BuddyUser, user2: BuddyUser): string[] {
    const relevantStarters = this.conversationStarters.filter(starter => {
      if (starter.experienceLevel !== 'all') {
        return starter.experienceLevel === user1.experienceLevel || 
               starter.experienceLevel === user2.experienceLevel;
      }
      return true;
    });

    return relevantStarters.slice(0, 5).map(s => s.text);
  }

  getConversationStarter(pairId: string, category?: string): ConversationStarter | null {
    const pair = this.pairs.get(pairId);
    if (!pair) return null;

    const user1 = this.users.get(pair.user1Id);
    const user2 = this.users.get(pair.user2Id);
    if (!user1 || !user2) return null;

    let availableStarters = this.conversationStarters.filter(starter => {
      if (category && starter.category !== category) return false;
      if (starter.experienceLevel !== 'all') {
        return starter.experienceLevel === user1.experienceLevel || 
               starter.experienceLevel === user2.experienceLevel;
      }
      return true;
    });

    if (availableStarters.length === 0) {
      availableStarters = this.conversationStarters.filter(s => s.experienceLevel === 'all');
    }

    const randomIndex = Math.floor(Math.random() * availableStarters.length);
    return availableStarters[randomIndex] || null;
  }

  // Check-in Management
  scheduleNextCheckIn(pairId: string): void {
    const pair = this.pairs.get(pairId);
    if (!pair) return;

    const now = new Date();
    const nextCheckIn = new Date(now);

    switch (pair.checkInFrequency) {
      case 'daily':
        nextCheckIn.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextCheckIn.setDate(now.getDate() + 7);
        break;
      case 'biweekly':
        nextCheckIn.setDate(now.getDate() + 14);
        break;
    }

    pair.nextScheduledCheckIn = nextCheckIn;
    this.pairs.set(pairId, pair);
    this.emit('checkInScheduled', { pairId, nextCheckIn });
  }

  getDueCheckIns(): BuddyPair[] {
    const now = new Date();
    return Array.from(this.pairs.values()).filter(pair => 
      pair.status === 'active' &&
      pair.nextScheduledCheckIn &&
      pair.nextScheduledCheckIn <= now
    );
  }

  // Safety and Reporting
  reportUser(reportData: Omit<SafetyReport, 'id' | 'timestamp' | 'status'>): SafetyReport {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const report: SafetyReport = {
      id: reportId,
      timestamp: new Date(),
      status: 'pending',
      ...reportData,
    };

    this.reports.set(reportId, report);
    this.emit('safetyReportFiled', report);

    // Auto-actions for high severity reports
    if (report.severity === 'critical') {
      this.handleCriticalReport(report);
    }

    return report;
  }

  private handleCriticalReport(report: SafetyReport): void {
    // Immediately suspend the reported user's buddy activities
    const reportedUser = this.users.get(report.reportedUserId);
    if (reportedUser) {
      reportedUser.isActive = false;
      this.users.set(report.reportedUserId, reportedUser);

      // End current buddy pair if exists
      if (reportedUser.currentBuddyId) {
        const pairId = this.findPairByUsers(report.reportedUserId, reportedUser.currentBuddyId);
        if (pairId) {
          this.endBuddyPair(pairId, 'report');
        }
      }
    }

    this.emit('criticalReportHandled', report);
  }

  // Buddy Pair Management
  endBuddyPair(pairId: string, reason: BuddyPair['endReason']): boolean {
    const pair = this.pairs.get(pairId);
    if (!pair) return false;

    pair.status = 'ended';
    pair.endReason = reason;

    // Clear current buddy IDs
    const user1 = this.users.get(pair.user1Id);
    const user2 = this.users.get(pair.user2Id);

    if (user1) {
      user1.currentBuddyId = undefined;
      this.users.set(pair.user1Id, user1);
      
      // Add back to matching queue if reason isn't report
      if (reason !== 'report' && user1.isActive) {
        this.addToMatchingQueue(pair.user1Id);
      }
    }

    if (user2) {
      user2.currentBuddyId = undefined;
      this.users.set(pair.user2Id, user2);
      
      // Add back to matching queue if reason isn't report
      if (reason !== 'report' && user2.isActive) {
        this.addToMatchingQueue(pair.user2Id);
      }
    }

    this.pairs.set(pairId, pair);
    this.emit('buddyPairEnded', { pairId, reason });
    return true;
  }

  requestNewBuddy(userId: string, reason: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.currentBuddyId) return false;

    const pairId = this.findPairByUsers(userId, user.currentBuddyId);
    if (!pairId) return false;

    this.endBuddyPair(pairId, 'reassignment');
    this.emit('newBuddyRequested', { userId, reason });
    return true;
  }

  private findPairByUsers(user1Id: string, user2Id: string): string | null {
    for (const [pairId, pair] of this.pairs) {
      if ((pair.user1Id === user1Id && pair.user2Id === user2Id) ||
          (pair.user1Id === user2Id && pair.user2Id === user1Id)) {
        return pairId;
      }
    }
    return null;
  }

  // Analytics and Insights
  getUserStats(userId: string): any {
    const user = this.users.get(userId);
    if (!user) return null;

    const userInteractions = Array.from(this.interactions.values())
      .flat()
      .filter(interaction => interaction.initiatorId === userId);

    const currentPair = user.currentBuddyId ? 
      Array.from(this.pairs.values()).find(pair => 
        pair.user1Id === userId || pair.user2Id === userId
      ) : null;

    return {
      totalPoints: user.totalBuddyPoints,
      trustScore: user.trustScore,
      totalInteractions: userInteractions.length,
      averageInteractionQuality: userInteractions.length > 0 ? 
        userInteractions.reduce((sum, i) => sum + i.quality, 0) / userInteractions.length : 0,
      buddyHistory: user.buddyHistory.length,
      currentBuddyPairedAt: currentPair?.pairedAt,
      daysWithCurrentBuddy: currentPair ? 
        Math.floor((Date.now() - currentPair.pairedAt.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    };
  }

  getPairStats(pairId: string): any {
    const pair = this.pairs.get(pairId);
    const interactions = this.interactions.get(pairId) || [];
    
    if (!pair) return null;

    const user1 = this.users.get(pair.user1Id);
    const user2 = this.users.get(pair.user2Id);

    return {
      compatibilityScore: pair.compatibilityScore,
      daysTogether: Math.floor((Date.now() - pair.pairedAt.getTime()) / (1000 * 60 * 60 * 24)),
      totalInteractions: interactions.length,
      averageQuality: interactions.length > 0 ? 
        interactions.reduce((sum, i) => sum + i.quality, 0) / interactions.length : 0,
      totalSharedPoints: pair.points.totalSharedPoints,
      lastInteractionDaysAgo: pair.lastInteraction ? 
        Math.floor((Date.now() - pair.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)) : null,
      checkInFrequency: pair.checkInFrequency,
      nextCheckIn: pair.nextScheduledCheckIn,
      user1: user1 ? { name: user1.name, points: pair.points.user1Points } : null,
      user2: user2 ? { name: user2.name, points: pair.points.user2Points } : null,
    };
  }

  // Periodic Tasks
  private startPeriodicTasks(): void {
    // Check for inactive pairs every hour
    setInterval(() => {
      this.checkInactivePairs();
    }, 60 * 60 * 1000);

    // Process matching queue every 5 minutes
    setInterval(() => {
      this.processMatchingQueue();
    }, 5 * 60 * 1000);

    // Send check-in reminders every day at 9 AM
    setInterval(() => {
      this.sendCheckInReminders();
    }, 24 * 60 * 60 * 1000);
  }

  private checkInactivePairs(): void {
    const now = new Date();
    const inactiveThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [pairId, pair] of this.pairs) {
      if (pair.status === 'active' && 
          (now.getTime() - pair.lastInteraction.getTime()) > inactiveThreshold) {
        this.endBuddyPair(pairId, 'timeout');
      }
    }
  }

  private sendCheckInReminders(): void {
    const dueCheckIns = this.getDueCheckIns();
    for (const pair of dueCheckIns) {
      this.emit('checkInReminder', pair);
    }
  }

  // Getters
  getUser(userId: string): BuddyUser | undefined {
    return this.users.get(userId);
  }

  getPair(pairId: string): BuddyPair | undefined {
    return this.pairs.get(pairId);
  }

  getUserPair(userId: string): BuddyPair | undefined {
    return Array.from(this.pairs.values()).find(pair => 
      pair.user1Id === userId || pair.user2Id === userId
    );
  }

  getPairInteractions(pairId: string): BuddyInteraction[] {
    return this.interactions.get(pairId) || [];
  }

  getActiveUsers(): BuddyUser[] {
    return Array.from(this.users.values()).filter(user => user.isActive);
  }

  getActivePairs(): BuddyPair[] {
    return Array.from(this.pairs.values()).filter(pair => pair.status === 'active');
  }

  getPendingReports(): SafetyReport[] {
    return Array.from(this.reports.values()).filter(report => report.status === 'pending');
  }
}

// Export singleton instance
export const buddySystem = new BuddySystem();
