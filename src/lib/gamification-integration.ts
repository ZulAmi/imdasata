/**
 * SATA Gamification Integration Hooks
 * Integration points for awarding points across the platform
 */

import { gamificationSystem } from './gamification-system';

export class GamificationIntegration {
  // Daily Check-in Integration
  static onDailyCheckIn(userId: string, mood: number, notes?: string, stressLevel?: number): void {
    // Award points for daily check-in
    gamificationSystem.recordDailyCheckIn(userId, mood, notes);
    
    // Additional points for stress level tracking
    if (stressLevel !== undefined) {
      gamificationSystem.awardPoints(
        userId,
        'check-in',
        5,
        'Stress level tracking bonus',
        'check-in-stress-bonus',
        { stressLevel }
      );
    }
    
    // Mood improvement bonus
    if (mood >= 8) {
      gamificationSystem.awardPoints(
        userId,
        'check-in',
        5,
        'Great mood bonus! 😊',
        'mood-bonus',
        { mood }
      );
    }
  }

  // PHQ-4 Assessment Integration
  static onPHQ4Assessment(userId: string, anxietyScore: number, depressionScore: number, totalScore: number): void {
    // Base points for completing assessment
    gamificationSystem.recordAssessment(userId, 'PHQ-4', totalScore);
    
    // Bonus for completing comprehensive assessment
    gamificationSystem.awardPoints(
      userId,
      'assessment',
      10,
      'PHQ-4 completion bonus',
      'phq4-bonus',
      { anxietyScore, depressionScore, totalScore }
    );
    
    // Encourage regular assessment if score indicates improvement
    const previousAssessments = gamificationSystem.getTransactions(userId)
      .filter(t => t.category === 'assessment' && t.metadata?.assessmentType === 'PHQ-4')
      .slice(0, 2);
    
    if (previousAssessments.length > 0) {
      const previousScore = previousAssessments[0].metadata?.score || 0;
      if (totalScore < previousScore) {
        gamificationSystem.awardPoints(
          userId,
          'assessment',
          15,
          'Improvement detected! 🎉',
          'improvement-bonus',
          { previousScore, currentScore: totalScore, improvement: previousScore - totalScore }
        );
      }
    }
  }

  // Educational Content Integration
  static onEducationalContentEngagement(
    userId: string, 
    contentId: string, 
    contentType: 'article' | 'video' | 'interactive' | 'quiz',
    duration: number,
    completionRate: number = 100
  ): void {
    // Base points for engagement
    gamificationSystem.recordEducationalEngagement(userId, contentType, duration);
    
    // Completion bonus
    if (completionRate >= 90) {
      gamificationSystem.awardPoints(
        userId,
        'education',
        10,
        'Content completion bonus! 📚',
        'completion-bonus',
        { contentId, completionRate }
      );
    }
    
    // Speed learning bonus (completed quickly but thoroughly)
    if (completionRate >= 95 && contentType === 'article' && duration < 180) {
      gamificationSystem.awardPoints(
        userId,
        'education',
        5,
        'Speed reader bonus! 🚀',
        'speed-bonus',
        { contentId, duration, completionRate }
      );
    }
    
    // Quiz excellence bonus
    if (contentType === 'quiz' && completionRate >= 80) {
      const bonusPoints = completionRate >= 95 ? 20 : completionRate >= 90 ? 15 : 10;
      gamificationSystem.awardPoints(
        userId,
        'education',
        bonusPoints,
        `Quiz mastery: ${completionRate}%! 🧠`,
        'quiz-excellence',
        { contentId, score: completionRate }
      );
    }
  }

  // Peer Support Group Integration
  static onPeerSupportActivity(
    userId: string,
    activityType: 'group-message' | 'group-voice' | 'support-given' | 'group-check-in' | 'group-join',
    groupId: string,
    quality?: number,
    messageLength?: number
  ): void {
    // Base points for activity
    gamificationSystem.recordPeerSupportActivity(userId, activityType, quality);
    
    // First-time group participation bonus
    const previousGroupActivity = gamificationSystem.getTransactions(userId)
      .filter(t => t.category === 'peer-support' && t.metadata?.groupId === groupId);
    
    if (previousGroupActivity.length === 0) {
      gamificationSystem.awardPoints(
        userId,
        'peer-support',
        15,
        'Welcome to the group! 👋',
        'first-group-bonus',
        { groupId, activityType }
      );
    }
    
    // Thoughtful message bonus (for longer, meaningful messages)
    if (activityType === 'group-message' && messageLength && messageLength > 100) {
      gamificationSystem.awardPoints(
        userId,
        'peer-support',
        8,
        'Thoughtful message bonus! 💭',
        'thoughtful-message',
        { groupId, messageLength }
      );
    }
    
    // Group leadership bonus (for active participants)
    const recentGroupActivity = gamificationSystem.getTransactions(userId)
      .filter(t => {
        const daysDiff = (Date.now() - t.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && t.category === 'peer-support' && t.metadata?.groupId === groupId;
      });
    
    if (recentGroupActivity.length >= 5) {
      gamificationSystem.awardPoints(
        userId,
        'peer-support',
        20,
        'Group leader bonus! 👑',
        'group-leader',
        { groupId, weeklyActivity: recentGroupActivity.length }
      );
    }
  }

  // Buddy System Integration
  static onBuddyInteraction(
    userId: string,
    buddyId: string,
    interactionType: 'text-chat' | 'voice-call' | 'check-in' | 'goal-update',
    quality: number,
    duration?: number,
    sentiment?: 'positive' | 'neutral' | 'supportive'
  ): void {
    // Base points for interaction
    gamificationSystem.recordBuddyInteraction(userId, interactionType, quality, duration);
    
    // Mutual support bonus (when both buddies are active)
    const buddyTransactions = gamificationSystem.getTransactions(buddyId)
      .filter(t => {
        const daysDiff = (Date.now() - t.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 1 && t.category === 'buddy';
      });
    
    if (buddyTransactions.length > 0) {
      gamificationSystem.awardPoints(
        userId,
        'buddy',
        10,
        'Mutual support bonus! 🤝',
        'mutual-support',
        { buddyId, interactionType }
      );
    }
    
    // Sentiment bonus
    if (sentiment === 'supportive') {
      gamificationSystem.awardPoints(
        userId,
        'buddy',
        8,
        'Supportive buddy bonus! 💖',
        'supportive-buddy',
        { buddyId, sentiment }
      );
    }
    
    // Long conversation bonus
    if (interactionType === 'voice-call' && duration && duration > 1800) { // 30+ minutes
      gamificationSystem.awardPoints(
        userId,
        'buddy',
        15,
        'Deep connection bonus! 🗣️',
        'long-conversation',
        { buddyId, duration }
      );
    }
    
    // Regular check-in streak with buddy
    const recentBuddyCheckins = gamificationSystem.getTransactions(userId)
      .filter(t => {
        const daysDiff = (Date.now() - t.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7 && t.category === 'buddy' && t.source === 'buddy-system' && 
               t.metadata?.interactionType === 'check-in';
      });
    
    if (recentBuddyCheckins.length >= 3) {
      gamificationSystem.awardPoints(
        userId,
        'buddy',
        25,
        'Consistent buddy support! 🌟',
        'buddy-consistency',
        { buddyId, weeklyCheckins: recentBuddyCheckins.length }
      );
    }
  }

  // Resource Utilization Integration
  static onResourceUtilization(
    userId: string,
    resourceId: string,
    resourceType: 'hotline' | 'counselor' | 'support-group' | 'clinic' | 'emergency' | 'educational',
    engagement: 'view' | 'save' | 'share' | 'contact' | 'review',
    metadata?: any
  ): void {
    // Base points for resource utilization
    gamificationSystem.recordResourceUtilization(userId, resourceType, engagement);
    
    // First-time resource usage bonus
    const previousResourceUsage = gamificationSystem.getTransactions(userId)
      .filter(t => t.category === 'resource' && t.metadata?.resourceType === resourceType);
    
    if (previousResourceUsage.length === 0) {
      gamificationSystem.awardPoints(
        userId,
        'resource',
        20,
        `First ${resourceType.replace('-', ' ')} usage! 🌟`,
        'first-resource-usage',
        { resourceType, resourceId }
      );
    }
    
    // Help-seeking courage bonus (for contacting professional resources)
    if (engagement === 'contact' && ['hotline', 'counselor', 'clinic'].includes(resourceType)) {
      gamificationSystem.awardPoints(
        userId,
        'resource',
        30,
        'Seeking help takes courage! 💪',
        'help-seeking-bonus',
        { resourceType, resourceId }
      );
    }
    
    // Community contribution (for sharing or reviewing resources)
    if (engagement === 'share' || engagement === 'review') {
      gamificationSystem.awardPoints(
        userId,
        'resource',
        15,
        'Community contribution bonus! 🤲',
        'community-contribution',
        { resourceType, resourceId, engagement }
      );
    }
    
    // Crisis support bonus (for emergency resource usage)
    if (resourceType === 'emergency' && engagement === 'contact') {
      gamificationSystem.awardPoints(
        userId,
        'resource',
        50,
        'Crisis support - you\'re not alone! 🆘',
        'crisis-support',
        { resourceId }
      );
    }
  }

  // Platform Engagement Integration
  static onPlatformMilestone(
    userId: string,
    milestoneType: 'first-login' | 'profile-complete' | 'settings-configured' | 'tutorial-complete' | 'first-week' | 'first-month',
    metadata?: any
  ): void {
    const milestonePoints = {
      'first-login': 25,
      'profile-complete': 35,
      'settings-configured': 20,
      'tutorial-complete': 30,
      'first-week': 100,
      'first-month': 250,
    };
    
    const milestoneDescriptions = {
      'first-login': 'Welcome to SATA! 🎉',
      'profile-complete': 'Profile completed! 👤',
      'settings-configured': 'Settings configured! ⚙️',
      'tutorial-complete': 'Tutorial mastered! 🎓',
      'first-week': 'One week strong! 📅',
      'first-month': 'Monthly champion! 🏆',
    };
    
    gamificationSystem.awardPoints(
      userId,
      'achievement',
      milestonePoints[milestoneType],
      milestoneDescriptions[milestoneType],
      'platform-milestone',
      { milestoneType, ...metadata }
    );
  }

  // Streak Maintenance Integration
  static onStreakMaintenance(userId: string, streakType: string, streakLength: number): void {
    // Weekly streak bonus
    if (streakLength % 7 === 0 && streakLength > 0) {
      const weeklyBonus = Math.min(streakLength / 7 * 10, 50); // Max 50 points
      gamificationSystem.awardPoints(
        userId,
        'streak',
        weeklyBonus,
        `${streakLength}-day ${streakType} streak! 🔥`,
        'weekly-streak-bonus',
        { streakType, streakLength }
      );
    }
    
    // Monthly milestone
    if (streakLength === 30) {
      gamificationSystem.awardPoints(
        userId,
        'streak',
        100,
        'Monthly streak achievement! 🌙',
        'monthly-streak',
        { streakType, streakLength }
      );
    }
    
    // Epic milestones
    if (streakLength === 100) {
      gamificationSystem.awardPoints(
        userId,
        'streak',
        500,
        '100-day streak - EPIC! 🎯',
        'epic-streak',
        { streakType, streakLength }
      );
    }
    
    if (streakLength === 365) {
      gamificationSystem.awardPoints(
        userId,
        'streak',
        1000,
        'Year-long streak - LEGENDARY! 👑',
        'legendary-streak',
        { streakType, streakLength }
      );
    }
  }

  // Special Events Integration
  static onSpecialEvent(
    userId: string,
    eventType: 'mental-health-day' | 'wellness-week' | 'community-challenge' | 'holiday' | 'anniversary',
    participation: 'attend' | 'organize' | 'share' | 'complete-challenge',
    metadata?: any
  ): void {
    const eventPoints = {
      'mental-health-day': { attend: 50, organize: 100, share: 25, 'complete-challenge': 75 },
      'wellness-week': { attend: 40, organize: 150, share: 30, 'complete-challenge': 100 },
      'community-challenge': { attend: 35, organize: 80, share: 20, 'complete-challenge': 60 },
      'holiday': { attend: 30, organize: 60, share: 15, 'complete-challenge': 45 },
      'anniversary': { attend: 75, organize: 200, share: 50, 'complete-challenge': 125 },
    };
    
    const points = eventPoints[eventType]?.[participation] || 25;
    
    gamificationSystem.awardPoints(
      userId,
      'achievement',
      points,
      `${eventType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${participation}! 🎊`,
      'special-event',
      { eventType, participation, ...metadata }
    );
    
    // Community builder bonus for organizing events
    if (participation === 'organize') {
      gamificationSystem.awardPoints(
        userId,
        'achievement',
        50,
        'Community builder bonus! 🏗️',
        'community-builder',
        { eventType }
      );
    }
  }

  // Mood Tracking Integration
  static onMoodTrend(
    userId: string,
    trendType: 'improving' | 'consistent-good' | 'concerning' | 'recovery',
    duration: number, // days
    averageMood: number
  ): void {
    if (trendType === 'improving') {
      gamificationSystem.awardPoints(
        userId,
        'check-in',
        25,
        `Mood improving over ${duration} days! 📈`,
        'mood-improvement',
        { trendType, duration, averageMood }
      );
    }
    
    if (trendType === 'consistent-good' && duration >= 7) {
      gamificationSystem.awardPoints(
        userId,
        'check-in',
        35,
        `Consistently good mood for ${duration} days! ☀️`,
        'mood-consistency',
        { trendType, duration, averageMood }
      );
    }
    
    if (trendType === 'recovery') {
      gamificationSystem.awardPoints(
        userId,
        'check-in',
        50,
        'Recovery progress recognized! 🌈',
        'recovery-progress',
        { trendType, duration, averageMood }
      );
    }
  }

  // Helper method to get user's current gamification status
  static getUserGamificationSummary(userId: string): any {
    const user = gamificationSystem.getUser(userId);
    const stats = gamificationSystem.getUserStats(userId);
    const leaderboard = gamificationSystem.getLeaderboard('all-time', 100);
    const userRank = leaderboard.findIndex(entry => entry.userId === userId) + 1;
    
    return {
      user,
      stats,
      rank: userRank || null,
      isTopPerformer: userRank <= 10,
      pointsThisWeek: this.getPointsThisWeek(userId),
      nextReward: this.getNextAffordableReward(userId),
    };
  }
  
  private static getPointsThisWeek(userId: string): number {
    const transactions = gamificationSystem.getTransactions(userId);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    return transactions
      .filter(t => t.type === 'earn' && t.timestamp >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private static getNextAffordableReward(userId: string): any {
    const user = gamificationSystem.getUser(userId);
    if (!user) return null;
    
    const rewards = gamificationSystem.getAvailableRewards(userId);
    const affordableRewards = rewards
      .filter(r => r.pointCost <= user.availablePoints)
      .sort((a, b) => a.pointCost - b.pointCost);
    
    return affordableRewards[0] || rewards.sort((a, b) => a.pointCost - b.pointCost)[0];
  }
}

export default GamificationIntegration;
