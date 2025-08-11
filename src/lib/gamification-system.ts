/**
 * SATA Gamification System
 * Comprehensive point and reward system for mental health engagement
 */

import { EventEmitter } from 'events';
import QRCode from 'qrcode';

export interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  joinedAt: Date;
  lastActive: Date;
  currentLevel: number;
  totalPoints: number;
  availablePoints: number; // Points that can be spent
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: Badge[];
  preferences: {
    shareProgress: boolean;
    notifications: boolean;
    leaderboard: boolean;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'wellness' | 'social' | 'learning' | 'consistency' | 'milestone';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  progress?: {
    current: number;
    target: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  level: number;
  earnedAt: Date;
  category: 'daily' | 'assessment' | 'learning' | 'social' | 'streak' | 'special';
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'bonus' | 'penalty';
  category: 'check-in' | 'assessment' | 'education' | 'peer-support' | 'buddy' | 'resource' | 'streak' | 'achievement' | 'redemption';
  amount: number;
  description: string;
  metadata?: any;
  timestamp: Date;
  source: string; // Component that triggered the transaction
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'wellness' | 'education' | 'social' | 'digital' | 'physical';
  pointCost: number;
  icon: string;
  availability: 'unlimited' | 'limited' | 'seasonal';
  stock?: number;
  isActive: boolean;
  requirements?: {
    minLevel?: number;
    requiredBadges?: string[];
    requiredAchievements?: string[];
  };
  redemptionInfo?: {
    instructions: string;
    validUntil?: Date;
    code?: string;
  };
}

export interface QRRedemption {
  id: string;
  userId: string;
  rewardId: string;
  qrCode: string;
  generatedAt: Date;
  expiresAt: Date;
  isRedeemed: boolean;
  redeemedAt?: Date;
  redemptionLocation?: string;
}

export interface Streak {
  userId: string;
  type: 'daily-check-in' | 'assessment' | 'learning' | 'peer-support' | 'overall';
  current: number;
  longest: number;
  lastActivity: Date;
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
  level: number;
  rank: number;
  badge?: string;
}

export interface Level {
  level: number;
  name: string;
  pointsRequired: number;
  badge: string;
  perks: string[];
  color: string;
}

class GamificationSystem extends EventEmitter {
  private users: Map<string, UserProfile> = new Map();
  private transactions: Map<string, PointTransaction[]> = new Map();
  private streaks: Map<string, Streak[]> = new Map();
  private rewards: Map<string, Reward> = new Map();
  private qrRedemptions: Map<string, QRRedemption> = new Map();
  private achievements: Map<string, Achievement> = new Map();
  private levels: Level[] = [];

  constructor() {
    super();
    this.initializeLevels();
    this.initializeRewards();
    this.startPeriodicTasks();
  }

  // User Management
  createUser(userData: { userId: string; username: string; email?: string }): UserProfile {
    const user: UserProfile = {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
      joinedAt: new Date(),
      lastActive: new Date(),
      currentLevel: 1,
      totalPoints: 0,
      availablePoints: 0,
      lifetimePoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      badges: [],
      preferences: {
        shareProgress: true,
        notifications: true,
        leaderboard: true,
      },
    };

    this.users.set(userData.userId, user);
    this.transactions.set(userData.userId, []);
    this.streaks.set(userData.userId, []);

    // Welcome bonus
    this.awardPoints(userData.userId, 'achievement', 50, 'Welcome to SATA! 🎉', 'welcome-bonus');
    
    this.emit('userCreated', user);
    return user;
  }

  getUser(userId: string): UserProfile | undefined {
    return this.users.get(userId);
  }

  getTransactions(userId: string): PointTransaction[] {
    return this.transactions.get(userId) || [];
  }

  updateLastActivity(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.lastActive = new Date();
      this.users.set(userId, user);
    }
  }

  // Point System
  awardPoints(
    userId: string,
    category: PointTransaction['category'],
    amount: number,
    description: string,
    source: string,
    metadata?: any
  ): PointTransaction | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const transaction: PointTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'earn',
      category,
      amount,
      description,
      metadata,
      timestamp: new Date(),
      source,
    };

    // Update user points
    user.totalPoints += amount;
    user.availablePoints += amount;
    user.lifetimePoints += amount;
    user.lastActive = new Date();

    // Check for level up
    const newLevel = this.calculateLevel(user.totalPoints);
    if (newLevel > user.currentLevel) {
      const levelUpBonus = (newLevel - user.currentLevel) * 25;
      user.currentLevel = newLevel;
      user.availablePoints += levelUpBonus;
      
      this.emit('levelUp', { 
        user, 
        newLevel, 
        bonus: levelUpBonus,
        levelInfo: this.levels[newLevel - 1]
      });
    }

    // Store transaction
    const userTransactions = this.transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    this.transactions.set(userId, userTransactions);

    this.users.set(userId, user);

    // Check for achievements
    this.checkAchievements(userId, category, amount, metadata);

    this.emit('pointsAwarded', transaction);
    return transaction;
  }

  spendPoints(userId: string, amount: number, description: string, source: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.availablePoints < amount) return false;

    const transaction: PointTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'spend',
      category: 'redemption',
      amount: -amount,
      description,
      timestamp: new Date(),
      source,
    };

    user.availablePoints -= amount;
    user.lastActive = new Date();

    const userTransactions = this.transactions.get(userId) || [];
    userTransactions.unshift(transaction);
    this.transactions.set(userId, userTransactions);

    this.users.set(userId, user);
    this.emit('pointsSpent', transaction);
    return true;
  }

  // Activity-Specific Point Awards
  recordDailyCheckIn(userId: string, mood: number, notes?: string): PointTransaction | null {
    const basePoints = 10;
    let bonusPoints = 0;
    
    // Mood improvement bonus
    if (mood >= 7) bonusPoints += 5;
    if (mood >= 9) bonusPoints += 5;

    // Streak bonus
    const streak = this.updateStreak(userId, 'daily-check-in');
    if (streak && streak.current > 0) {
      bonusPoints += Math.min(streak.current, 20); // Max 20 bonus points
    }

    const totalPoints = basePoints + bonusPoints;
    const description = `Daily check-in completed (Mood: ${mood}/10)${bonusPoints > 0 ? ` +${bonusPoints} bonus` : ''}`;

    return this.awardPoints(userId, 'check-in', totalPoints, description, 'daily-check-in', {
      mood,
      notes,
      streak: streak?.current || 0,
      bonus: bonusPoints
    });
  }

  recordAssessment(userId: string, assessmentType: string, score: number): PointTransaction | null {
    let points = 0;
    
    switch (assessmentType) {
      case 'PHQ-4':
        points = 25;
        break;
      case 'mood-tracker':
        points = 15;
        break;
      case 'wellness-survey':
        points = 20;
        break;
      default:
        points = 15;
    }

    // Assessment completion streak
    const streak = this.updateStreak(userId, 'assessment');
    if (streak && streak.current > 1) {
      points += Math.min(streak.current * 2, 15); // Up to 15 bonus points
    }

    const description = `${assessmentType} assessment completed`;
    return this.awardPoints(userId, 'assessment', points, description, 'assessment-system', {
      assessmentType,
      score,
      streak: streak?.current || 0
    });
  }

  recordEducationalEngagement(userId: string, contentType: string, duration: number): PointTransaction | null {
    let points = 0;
    
    switch (contentType) {
      case 'article':
        points = Math.min(Math.floor(duration / 60) * 2, 10); // 2 points per minute, max 10
        break;
      case 'video':
        points = Math.min(Math.floor(duration / 60) * 3, 15); // 3 points per minute, max 15
        break;
      case 'interactive':
        points = Math.min(Math.floor(duration / 60) * 4, 20); // 4 points per minute, max 20
        break;
      case 'quiz':
        points = 15;
        break;
      default:
        points = Math.min(Math.floor(duration / 60) * 2, 8);
    }

    const description = `Engaged with ${contentType} (${Math.floor(duration / 60)}min)`;
    return this.awardPoints(userId, 'education', points, description, 'education-system', {
      contentType,
      duration
    });
  }

  recordPeerSupportActivity(userId: string, activityType: string, quality?: number): PointTransaction | null {
    let points = 0;
    
    switch (activityType) {
      case 'group-message':
        points = 5;
        break;
      case 'group-voice':
        points = 10;
        break;
      case 'support-given':
        points = 15;
        break;
      case 'group-check-in':
        points = 12;
        break;
      default:
        points = 5;
    }

    // Quality bonus
    if (quality && quality >= 4) {
      points += 5;
    }

    const description = `Peer support: ${activityType.replace('-', ' ')}`;
    return this.awardPoints(userId, 'peer-support', points, description, 'peer-support-system', {
      activityType,
      quality
    });
  }

  recordBuddyInteraction(userId: string, interactionType: string, quality: number, duration?: number): PointTransaction | null {
    let points = 0;
    
    switch (interactionType) {
      case 'text-chat':
        points = 5;
        break;
      case 'voice-call':
        points = 15 + Math.min(Math.floor((duration || 0) / 300), 10); // 1 point per 5 minutes, max 10
        break;
      case 'check-in':
        points = 20;
        break;
      case 'goal-update':
        points = 18;
        break;
      default:
        points = 8;
    }

    // Quality multiplier
    const qualityMultiplier = quality / 3; // 5-star = 1.67x, 4-star = 1.33x, etc.
    points = Math.round(points * qualityMultiplier);

    const description = `Buddy ${interactionType.replace('-', ' ')} (${quality}⭐)`;
    return this.awardPoints(userId, 'buddy', points, description, 'buddy-system', {
      interactionType,
      quality,
      duration
    });
  }

  recordResourceUtilization(userId: string, resourceType: string, engagement: string): PointTransaction | null {
    let points = 0;
    
    switch (engagement) {
      case 'view':
        points = 2;
        break;
      case 'save':
        points = 5;
        break;
      case 'share':
        points = 8;
        break;
      case 'review':
        points = 12;
        break;
      case 'contact':
        points = 15;
        break;
      default:
        points = 3;
    }

    const description = `Resource ${engagement}: ${resourceType}`;
    return this.awardPoints(userId, 'resource', points, description, 'resource-system', {
      resourceType,
      engagement
    });
  }

  // Streak System
  updateStreak(userId: string, streakType: Streak['type']): Streak | null {
    const userStreaks = this.streaks.get(userId) || [];
    let streak = userStreaks.find(s => s.type === streakType);
    
    if (!streak) {
      streak = {
        userId,
        type: streakType,
        current: 0,
        longest: 0,
        lastActivity: new Date(),
        isActive: true,
      };
      userStreaks.push(streak);
    }

    const now = new Date();
    const lastActivity = new Date(streak.lastActivity);
    const daysDiff = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
      // Same day, no change
      return streak;
    } else if (daysDiff === 1) {
      // Consecutive day
      streak.current++;
      streak.isActive = true;
    } else {
      // Streak broken
      streak.current = 1;
      streak.isActive = true;
    }

    // Update longest streak
    if (streak.current > streak.longest) {
      streak.longest = streak.current;
    }

    streak.lastActivity = now;
    this.streaks.set(userId, userStreaks);

    // Award streak bonus points
    if (streak.current > 1) {
      const bonusPoints = this.calculateStreakBonus(streak.current, streakType);
      if (bonusPoints > 0) {
        this.awardPoints(
          userId,
          'streak',
          bonusPoints,
          `${streak.current}-day ${streakType} streak bonus! 🔥`,
          'streak-system',
          { streakType, streakLength: streak.current }
        );
      }
    }

    // Update user's overall streak
    const user = this.users.get(userId);
    if (user && streakType === 'daily-check-in') {
      user.currentStreak = streak.current;
      if (streak.longest > user.longestStreak) {
        user.longestStreak = streak.longest;
      }
      this.users.set(userId, user);
    }

    this.emit('streakUpdated', streak);
    return streak;
  }

  private calculateStreakBonus(streakLength: number, streakType: Streak['type']): number {
    const baseBonus = {
      'daily-check-in': 2,
      'assessment': 3,
      'learning': 2,
      'peer-support': 3,
      'overall': 4,
    };

    const base = baseBonus[streakType] || 2;
    
    // Milestone bonuses
    if (streakLength === 7) return base * 5; // Week streak
    if (streakLength === 30) return base * 15; // Month streak
    if (streakLength === 100) return base * 50; // 100-day streak
    if (streakLength === 365) return base * 200; // Year streak
    
    // Regular bonuses
    if (streakLength >= 30) return base * 3;
    if (streakLength >= 14) return base * 2;
    if (streakLength >= 7) return base;
    if (streakLength >= 3) return Math.floor(base / 2);
    
    return 0;
  }

  // Achievement System
  private checkAchievements(userId: string, category: string, points: number, metadata?: any): void {
    const user = this.users.get(userId);
    if (!user) return;

    const userTransactions = this.transactions.get(userId) || [];
    const userStreaks = this.streaks.get(userId) || [];

    // Check various achievement conditions
    this.checkPointMilestones(user, userTransactions);
    this.checkStreakAchievements(user, userStreaks);
    this.checkCategorySpecificAchievements(user, category, userTransactions, metadata);
    this.checkConsistencyAchievements(user, userTransactions);
    this.checkSocialAchievements(user, userTransactions);
  }

  private checkPointMilestones(user: UserProfile, transactions: PointTransaction[]): void {
    const milestones = [
      { points: 100, id: 'first-hundred', name: 'Century Club', description: 'Earned your first 100 points!' },
      { points: 500, id: 'five-hundred', name: 'Rising Star', description: '500 points earned - you\'re on fire!' },
      { points: 1000, id: 'thousand', name: 'Point Master', description: '1,000 points! You\'re dedicated to wellness.' },
      { points: 2500, id: 'twenty-five-hundred', name: 'Wellness Warrior', description: '2,500 points - a true wellness champion!' },
      { points: 5000, id: 'five-thousand', name: 'Legendary Status', description: '5,000 points! Legendary dedication.' },
    ];

    milestones.forEach(milestone => {
      if (user.lifetimePoints >= milestone.points && !user.achievements.find(a => a.id === milestone.id)) {
        this.awardAchievement(user.userId, milestone.id, milestone.name, milestone.description, 'milestone', 50);
      }
    });
  }

  private checkStreakAchievements(user: UserProfile, streaks: Streak[]): void {
    const checkInStreak = streaks.find(s => s.type === 'daily-check-in');
    if (checkInStreak) {
      const streakAchievements = [
        { streak: 3, id: 'three-day-streak', name: 'Getting Started', description: '3-day check-in streak!' },
        { streak: 7, id: 'week-warrior', name: 'Week Warrior', description: '7-day check-in streak! 🔥' },
        { streak: 30, id: 'month-master', name: 'Monthly Master', description: '30-day streak - incredible consistency!' },
        { streak: 100, id: 'hundred-day-hero', name: 'Hundred Day Hero', description: '100 days strong! Unstoppable!' },
        { streak: 365, id: 'year-champion', name: 'Year Champion', description: 'A full year of daily check-ins! 🏆' },
      ];

      streakAchievements.forEach(achievement => {
        if (checkInStreak.longest >= achievement.streak && !user.achievements.find(a => a.id === achievement.id)) {
          this.awardAchievement(
            user.userId,
            achievement.id,
            achievement.name,
            achievement.description,
            'consistency',
            achievement.streak >= 100 ? 100 : achievement.streak >= 30 ? 75 : 50
          );
        }
      });
    }
  }

  private awardAchievement(
    userId: string,
    id: string,
    name: string,
    description: string,
    category: Achievement['category'],
    bonusPoints: number
  ): void {
    const user = this.users.get(userId);
    if (!user) return;

    const achievement: Achievement = {
      id,
      name,
      description,
      icon: this.getAchievementIcon(category),
      category,
      points: bonusPoints,
      rarity: this.getAchievementRarity(bonusPoints),
      unlockedAt: new Date(),
    };

    user.achievements.push(achievement);
    this.users.set(userId, user);

    // Award bonus points
    this.awardPoints(userId, 'achievement', bonusPoints, `Achievement unlocked: ${name}`, 'achievement-system', {
      achievementId: id
    });

    this.emit('achievementUnlocked', { user, achievement });
  }

  private getAchievementIcon(category: Achievement['category']): string {
    const icons = {
      wellness: '🌱',
      social: '🤝',
      learning: '📚',
      consistency: '🔥',
      milestone: '🏆',
    };
    return icons[category] || '⭐';
  }

  private getAchievementRarity(points: number): Achievement['rarity'] {
    if (points >= 100) return 'legendary';
    if (points >= 75) return 'epic';
    if (points >= 50) return 'rare';
    return 'common';
  }

  // Level System
  private initializeLevels(): void {
    this.levels = [
      { level: 1, name: 'Newcomer', pointsRequired: 0, badge: '🌱', perks: ['Daily check-ins', 'Basic resources'], color: '#10B981' },
      { level: 2, name: 'Explorer', pointsRequired: 100, badge: '🔍', perks: ['Assessment tools', 'Educational content'], color: '#3B82F6' },
      { level: 3, name: 'Supporter', pointsRequired: 300, badge: '🤝', perks: ['Peer support groups', 'Buddy matching'], color: '#8B5CF6' },
      { level: 4, name: 'Advocate', pointsRequired: 600, badge: '💪', perks: ['Advanced resources', 'Priority support'], color: '#F59E0B' },
      { level: 5, name: 'Champion', pointsRequired: 1000, badge: '🏆', perks: ['Leadership roles', 'Exclusive rewards'], color: '#EF4444' },
      { level: 6, name: 'Mentor', pointsRequired: 1500, badge: '👨‍🏫', perks: ['Mentorship opportunities', 'Special recognition'], color: '#EC4899' },
      { level: 7, name: 'Guardian', pointsRequired: 2500, badge: '🛡️', perks: ['Community moderation', 'Expert status'], color: '#6366F1' },
      { level: 8, name: 'Sage', pointsRequired: 4000, badge: '🧙‍♂️', perks: ['Wisdom sharing', 'Platform influence'], color: '#8B5CF6' },
      { level: 9, name: 'Legend', pointsRequired: 6000, badge: '⭐', perks: ['Legendary status', 'All perks unlocked'], color: '#F59E0B' },
      { level: 10, name: 'Enlightened', pointsRequired: 10000, badge: '✨', perks: ['Enlightened one', 'Ultimate recognition'], color: '#10B981' },
    ];
  }

  private calculateLevel(points: number): number {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].pointsRequired) {
        return this.levels[i].level;
      }
    }
    return 1;
  }

  getLevelInfo(level: number): Level | undefined {
    return this.levels.find(l => l.level === level);
  }

  // Reward System
  private initializeRewards(): void {
    const rewardList = [
      {
        id: 'wellness-tea',
        name: 'Wellness Tea Package',
        description: 'Calming herbal tea blend for relaxation',
        category: 'wellness',
        pointCost: 200,
        icon: '🍵',
        availability: 'unlimited',
        isActive: true,
      },
      {
        id: 'meditation-app',
        name: 'Premium Meditation App (1 Month)',
        description: 'Access to premium meditation content',
        category: 'digital',
        pointCost: 500,
        icon: '🧘‍♀️',
        availability: 'unlimited',
        isActive: true,
      },
      {
        id: 'wellness-journal',
        name: 'Wellness Journal',
        description: 'Beautiful journal for mindfulness practice',
        category: 'physical',
        pointCost: 300,
        icon: '📔',
        availability: 'limited',
        stock: 50,
        isActive: true,
      },
      {
        id: 'counseling-session',
        name: 'Free Counseling Session',
        description: 'One-on-one session with certified counselor',
        category: 'wellness',
        pointCost: 1000,
        icon: '👨‍⚕️',
        availability: 'limited',
        stock: 10,
        isActive: true,
        requirements: {
          minLevel: 3,
        },
      },
      {
        id: 'fitness-tracker',
        name: 'Fitness & Wellness Tracker',
        description: 'Smart device to monitor health metrics',
        category: 'physical',
        pointCost: 2000,
        icon: '⌚',
        availability: 'limited',
        stock: 5,
        isActive: true,
        requirements: {
          minLevel: 5,
        },
      },
    ];

    rewardList.forEach(reward => {
      this.rewards.set(reward.id, reward as Reward);
    });
  }

  getAvailableRewards(userId: string): Reward[] {
    const user = this.users.get(userId);
    if (!user) return [];

    return Array.from(this.rewards.values()).filter(reward => {
      if (!reward.isActive) return false;
      
      // Check requirements
      if (reward.requirements) {
        if (reward.requirements.minLevel && user.currentLevel < reward.requirements.minLevel) {
          return false;
        }
        // Add other requirement checks here
      }
      
      // Check stock
      if (reward.availability === 'limited' && reward.stock !== undefined && reward.stock <= 0) {
        return false;
      }
      
      return true;
    });
  }

  // QR Code Redemption
  async redeemReward(userId: string, rewardId: string): Promise<QRRedemption | null> {
    const user = this.users.get(userId);
    const reward = this.rewards.get(rewardId);
    
    if (!user || !reward || !reward.isActive) return null;
    
    // Check if user has enough points
    if (user.availablePoints < reward.pointCost) return null;
    
    // Check requirements
    if (reward.requirements) {
      if (reward.requirements.minLevel && user.currentLevel < reward.requirements.minLevel) {
        return null;
      }
    }
    
    // Check stock
    if (reward.availability === 'limited' && reward.stock !== undefined && reward.stock <= 0) {
      return null;
    }
    
    // Spend points
    if (!this.spendPoints(userId, reward.pointCost, `Redeemed: ${reward.name}`, 'reward-system')) {
      return null;
    }
    
    // Update stock
    if (reward.availability === 'limited' && reward.stock !== undefined) {
      reward.stock--;
      this.rewards.set(rewardId, reward);
    }
    
    // Generate QR code
    const redemptionId = `redemption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrData = {
      redemptionId,
      userId,
      rewardId,
      timestamp: Date.now(),
    };
    
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
    
    const redemption: QRRedemption = {
      id: redemptionId,
      userId,
      rewardId,
      qrCode,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isRedeemed: false,
    };
    
    this.qrRedemptions.set(redemptionId, redemption);
    this.emit('rewardRedeemed', { user, reward, redemption });
    
    return redemption;
  }

  async validateQRRedemption(qrData: string): Promise<{ valid: boolean; redemption?: QRRedemption; message: string }> {
    try {
      const data = JSON.parse(qrData);
      const redemption = this.qrRedemptions.get(data.redemptionId);
      
      if (!redemption) {
        return { valid: false, message: 'Invalid redemption code' };
      }
      
      if (redemption.isRedeemed) {
        return { valid: false, message: 'This reward has already been redeemed' };
      }
      
      if (new Date() > redemption.expiresAt) {
        return { valid: false, message: 'This redemption code has expired' };
      }
      
      return { valid: true, redemption, message: 'Valid redemption code' };
    } catch (error) {
      return { valid: false, message: 'Invalid QR code format' };
    }
  }

  completeQRRedemption(redemptionId: string, location?: string): boolean {
    const redemption = this.qrRedemptions.get(redemptionId);
    if (!redemption || redemption.isRedeemed) return false;
    
    redemption.isRedeemed = true;
    redemption.redeemedAt = new Date();
    redemption.redemptionLocation = location;
    
    this.qrRedemptions.set(redemptionId, redemption);
    this.emit('redemptionCompleted', redemption);
    
    return true;
  }

  // Analytics and Leaderboard
  getLeaderboard(timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time', limit = 10): LeaderboardEntry[] {
    const users = Array.from(this.users.values());
    
    // For simplicity, using total points. In a real implementation, you'd filter by timeframe
    const leaderboard = users
      .filter(user => user.preferences.leaderboard)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        points: timeframe === 'all-time' ? user.totalPoints : user.totalPoints, // Simplified
        level: user.currentLevel,
        rank: 0,
        badge: this.getLevelInfo(user.currentLevel)?.badge || '',
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
    
    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return leaderboard;
  }

  getUserStats(userId: string): any {
    const user = this.users.get(userId);
    const transactions = this.transactions.get(userId) || [];
    const streaks = this.streaks.get(userId) || [];
    
    if (!user) return null;
    
    const categoryPoints = transactions.reduce((acc, txn) => {
      if (txn.type === 'earn') {
        acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return {
      user,
      totalTransactions: transactions.length,
      categoryBreakdown: categoryPoints,
      achievements: user.achievements.length,
      currentStreaks: streaks.filter(s => s.isActive),
      longestStreaks: streaks.map(s => ({ type: s.type, length: s.longest })),
      level: this.getLevelInfo(user.currentLevel),
      nextLevel: this.getLevelInfo(user.currentLevel + 1),
      pointsToNextLevel: this.getLevelInfo(user.currentLevel + 1)?.pointsRequired ? 
        (this.getLevelInfo(user.currentLevel + 1)!.pointsRequired - user.totalPoints) : 0,
    };
  }

  // Admin Functions
  getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  getSystemStats(): any {
    const users = Array.from(this.users.values());
    const allTransactions = Array.from(this.transactions.values()).flat();
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => {
        const daysSinceActive = (Date.now() - u.lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive <= 7;
      }).length,
      totalPointsAwarded: allTransactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0),
      totalPointsSpent: allTransactions
        .filter(t => t.type === 'spend')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      averageLevel: users.length > 0 ? 
        users.reduce((sum, u) => sum + u.currentLevel, 0) / users.length : 0,
      totalAchievements: users.reduce((sum, u) => sum + u.achievements.length, 0),
      rewardsRedeemed: Array.from(this.qrRedemptions.values()).filter(r => r.isRedeemed).length,
    };
  }

  // Periodic Tasks
  private startPeriodicTasks(): void {
    // Check and break inactive streaks daily
    setInterval(() => {
      this.checkInactiveStreaks();
    }, 24 * 60 * 60 * 1000); // Daily
    
    // Clean up expired QR codes weekly
    setInterval(() => {
      this.cleanupExpiredRedemptions();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  private checkInactiveStreaks(): void {
    const now = new Date();
    
    for (const [userId, streaks] of this.streaks) {
      streaks.forEach(streak => {
        const daysSinceActivity = Math.floor((now.getTime() - streak.lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceActivity > 1 && streak.isActive) {
          streak.current = 0;
          streak.isActive = false;
          this.emit('streakBroken', { userId, streak });
        }
      });
      
      this.streaks.set(userId, streaks);
    }
  }

  private cleanupExpiredRedemptions(): void {
    const now = new Date();
    
    for (const [id, redemption] of this.qrRedemptions) {
      if (now > redemption.expiresAt && !redemption.isRedeemed) {
        this.qrRedemptions.delete(id);
      }
    }
  }

  // Additional helper methods for category-specific achievements
  private checkCategorySpecificAchievements(user: UserProfile, category: string, transactions: PointTransaction[], metadata?: any): void {
    const categoryTransactions = transactions.filter(t => t.category === category && t.type === 'earn');
    
    switch (category) {
      case 'check-in':
        if (categoryTransactions.length === 1) {
          this.awardAchievement(user.userId, 'first-check-in', 'First Steps', 'Completed your first daily check-in!', 'wellness', 25);
        }
        if (categoryTransactions.length === 30) {
          this.awardAchievement(user.userId, 'check-in-master', 'Check-in Master', '30 daily check-ins completed!', 'wellness', 75);
        }
        break;
        
      case 'assessment':
        if (categoryTransactions.length === 1) {
          this.awardAchievement(user.userId, 'first-assessment', 'Self-Awareness', 'Completed your first assessment!', 'wellness', 25);
        }
        if (categoryTransactions.length === 10) {
          this.awardAchievement(user.userId, 'assessment-expert', 'Assessment Expert', '10 assessments completed!', 'wellness', 50);
        }
        break;
        
      case 'education':
        const educationPoints = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        if (educationPoints >= 100) {
          this.awardAchievement(user.userId, 'knowledge-seeker', 'Knowledge Seeker', 'Earned 100+ education points!', 'learning', 50);
        }
        break;
        
      case 'peer-support':
        if (categoryTransactions.length === 5) {
          this.awardAchievement(user.userId, 'helpful-peer', 'Helpful Peer', 'Actively participated in peer support!', 'social', 40);
        }
        break;
        
      case 'buddy':
        if (categoryTransactions.length === 10) {
          this.awardAchievement(user.userId, 'great-buddy', 'Great Buddy', 'Excellent buddy interactions!', 'social', 60);
        }
        break;
    }
  }

  private checkConsistencyAchievements(user: UserProfile, transactions: PointTransaction[]): void {
    const last7Days = transactions.filter(t => {
      const daysDiff = (Date.now() - t.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && t.type === 'earn';
    });
    
    // Check if user earned points every day for the last 7 days
    const uniqueDays = new Set(last7Days.map(t => t.timestamp.toDateString()));
    if (uniqueDays.size === 7) {
      this.awardAchievement(user.userId, 'week-consistency', 'Consistency Champion', '7 days of consistent activity!', 'consistency', 75);
    }
  }

  private checkSocialAchievements(user: UserProfile, transactions: PointTransaction[]): void {
    const socialTransactions = transactions.filter(t => 
      (t.category === 'peer-support' || t.category === 'buddy') && t.type === 'earn'
    );
    
    if (socialTransactions.length >= 25) {
      this.awardAchievement(user.userId, 'social-butterfly', 'Social Butterfly', 'Active in social features!', 'social', 60);
    }
  }
}

// Export singleton instance
export const gamificationSystem = new GamificationSystem();
