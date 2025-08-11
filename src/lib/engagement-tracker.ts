/**
 * SATA User Engagement Analytics System
 * Comprehensive tracking of user engagement across all platform features
 */

import { EventEmitter } from 'events';

export interface UserSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  device: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  platform: string;
  ipAddress?: string;
  userAgent: string;
  pageViews: PageView[];
  interactions: UserInteraction[];
  isActive: boolean;
}

export interface PageView {
  pageId: string;
  pagePath: string;
  pageTitle: string;
  timestamp: Date;
  timeOnPage?: number; // in seconds
  exitPage: boolean;
  referrer?: string;
  loadTime?: number; // in milliseconds
}

export interface UserInteraction {
  id: string;
  userId: string;
  sessionId: string;
  type: 'click' | 'scroll' | 'input' | 'download' | 'share' | 'like' | 'comment' | 'submit';
  element: string;
  elementType: string;
  page: string;
  timestamp: Date;
  metadata?: any;
}

export interface FeatureUsage {
  userId: string;
  feature: string;
  subFeature?: string;
  action: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  metadata?: any;
}

export interface ContentInteraction {
  userId: string;
  contentId: string;
  contentType: 'article' | 'video' | 'audio' | 'interactive' | 'assessment' | 'resource';
  category: string;
  action: 'view' | 'read' | 'watch' | 'listen' | 'complete' | 'share' | 'save' | 'rate';
  timestamp: Date;
  duration?: number;
  progress?: number; // 0-100 percentage
  rating?: number; // 1-5 stars
  metadata?: any;
}

export interface AssessmentTracking {
  userId: string;
  assessmentId: string;
  assessmentType: 'PHQ-4' | 'mood-tracker' | 'stress-assessment' | 'wellness-survey' | 'custom';
  startTime: Date;
  completionTime?: Date;
  duration?: number;
  isCompleted: boolean;
  score?: number;
  responses?: any[];
  previousScore?: number;
  improvementTrend?: 'improving' | 'stable' | 'declining';
  metadata?: any;
}

export interface PeerSupportMetrics {
  userId: string;
  activityType: 'group-join' | 'message-sent' | 'message-received' | 'voice-join' | 'support-given' | 'support-received';
  groupId?: string;
  messageId?: string;
  timestamp: Date;
  messageLength?: number;
  sentiment?: 'positive' | 'neutral' | 'negative' | 'supportive';
  responseTime?: number; // minutes
  helpfulness?: number; // 1-5 rating
  metadata?: any;
}

export interface NotificationMetrics {
  notificationId: string;
  userId: string;
  type: 'push' | 'email' | 'in-app' | 'sms';
  category: 'reminder' | 'achievement' | 'social' | 'assessment' | 'emergency' | 'educational';
  title: string;
  message: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  actionTaken?: string;
  isOpened: boolean;
  isClicked: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'failed' | 'bounced';
  metadata?: any;
}

export interface RetentionMetrics {
  userId: string;
  cohortDate: Date; // User registration date
  daysSinceRegistration: number;
  isActive: boolean;
  lastActiveDate: Date;
  consecutiveDaysActive: number;
  totalDaysActive: number;
  churnRisk: 'low' | 'medium' | 'high';
  churnPrediction?: number; // 0-1 probability
  reactivationTriggers?: string[];
}

export interface EngagementScore {
  userId: string;
  date: Date;
  overallScore: number; // 0-100
  categoryScores: {
    dailyCheckins: number;
    assessments: number;
    education: number;
    peerSupport: number;
    resourceUsage: number;
    appUsage: number;
  };
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
  recommendations: string[];
}

export interface CohortAnalysis {
  cohortId: string;
  cohortDate: Date;
  totalUsers: number;
  retentionRates: {
    day1: number;
    day7: number;
    day14: number;
    day30: number;
    day60: number;
    day90: number;
  };
  averageEngagement: number;
  topFeatures: string[];
  churnPatterns: string[];
}

export interface FeatureAnalytics {
  feature: string;
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  usageFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
    rarely: number;
  };
  averageSessionDuration: number;
  completionRate: number;
  satisfactionScore: number;
  topUserActions: string[];
  dropoffPoints: string[];
}

class EngagementTracker extends EventEmitter {
  private sessions: Map<string, UserSession> = new Map();
  private userInteractions: Map<string, UserInteraction[]> = new Map();
  private featureUsage: Map<string, FeatureUsage[]> = new Map();
  private contentInteractions: Map<string, ContentInteraction[]> = new Map();
  private assessmentTracking: Map<string, AssessmentTracking[]> = new Map();
  private peerSupportMetrics: Map<string, PeerSupportMetrics[]> = new Map();
  private notificationMetrics: Map<string, NotificationMetrics[]> = new Map();
  private retentionData: Map<string, RetentionMetrics> = new Map();
  private engagementScores: Map<string, EngagementScore[]> = new Map();

  constructor() {
    super();
    this.startPeriodicTasks();
  }

  // Session Tracking
  startSession(userId: string, sessionData: Partial<UserSession>): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UserSession = {
      userId,
      sessionId,
      startTime: new Date(),
      device: sessionData.device || 'desktop',
      browser: sessionData.browser || 'unknown',
      platform: sessionData.platform || 'web',
      userAgent: sessionData.userAgent || '',
      pageViews: [],
      interactions: [],
      isActive: true,
      ...sessionData
    };

    this.sessions.set(sessionId, session);
    this.emit('sessionStarted', session);
    
    return sessionId;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      session.duration = Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000);
      session.isActive = false;
      
      this.sessions.set(sessionId, session);
      this.emit('sessionEnded', session);
      
      // Update user engagement metrics
      this.updateEngagementScore(session.userId);
    }
  }

  // Page View Tracking
  trackPageView(sessionId: string, pageData: Partial<PageView>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const pageView: PageView = {
      pageId: `page_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      pagePath: pageData.pagePath || '',
      pageTitle: pageData.pageTitle || '',
      timestamp: new Date(),
      exitPage: false,
      ...pageData
    };

    // Mark previous page as exit page
    if (session.pageViews.length > 0) {
      const lastPage = session.pageViews[session.pageViews.length - 1];
      lastPage.exitPage = false;
      lastPage.timeOnPage = Math.floor((pageView.timestamp.getTime() - lastPage.timestamp.getTime()) / 1000);
    }

    session.pageViews.push(pageView);
    this.sessions.set(sessionId, session);
    
    this.emit('pageViewed', { session, pageView });
  }

  // User Interaction Tracking
  trackInteraction(sessionId: string, interactionData: Partial<UserInteraction>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const interaction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId: session.userId,
      sessionId,
      type: interactionData.type || 'click',
      element: interactionData.element || '',
      elementType: interactionData.elementType || '',
      page: interactionData.page || '',
      timestamp: new Date(),
      ...interactionData
    };

    session.interactions.push(interaction);
    
    const userInteractions = this.userInteractions.get(session.userId) || [];
    userInteractions.push(interaction);
    this.userInteractions.set(session.userId, userInteractions);

    this.emit('interactionTracked', interaction);
  }

  // Feature Usage Tracking
  trackFeatureUsage(userId: string, featureData: Partial<FeatureUsage>): void {
    const usage: FeatureUsage = {
      userId,
      feature: featureData.feature || '',
      action: featureData.action || '',
      timestamp: new Date(),
      success: featureData.success !== false,
      ...featureData
    };

    const userFeatureUsage = this.featureUsage.get(userId) || [];
    userFeatureUsage.push(usage);
    this.featureUsage.set(userId, userFeatureUsage);

    this.emit('featureUsed', usage);
  }

  // Content Interaction Tracking
  trackContentInteraction(userId: string, contentData: Partial<ContentInteraction>): void {
    const interaction: ContentInteraction = {
      userId,
      contentId: contentData.contentId || '',
      contentType: contentData.contentType || 'article',
      category: contentData.category || '',
      action: contentData.action || 'view',
      timestamp: new Date(),
      ...contentData
    };

    const userContentInteractions = this.contentInteractions.get(userId) || [];
    userContentInteractions.push(interaction);
    this.contentInteractions.set(userId, userContentInteractions);

    this.emit('contentInteracted', interaction);
  }

  // Assessment Tracking
  trackAssessmentStart(userId: string, assessmentData: Partial<AssessmentTracking>): void {
    const assessment: AssessmentTracking = {
      userId,
      assessmentId: assessmentData.assessmentId || '',
      assessmentType: assessmentData.assessmentType || 'custom',
      startTime: new Date(),
      isCompleted: false,
      ...assessmentData
    };

    const userAssessments = this.assessmentTracking.get(userId) || [];
    userAssessments.push(assessment);
    this.assessmentTracking.set(userId, userAssessments);

    this.emit('assessmentStarted', assessment);
  }

  trackAssessmentCompletion(userId: string, assessmentId: string, completionData: any): void {
    const userAssessments = this.assessmentTracking.get(userId) || [];
    const assessment = userAssessments.find(a => a.assessmentId === assessmentId);

    if (assessment) {
      assessment.completionTime = new Date();
      assessment.duration = Math.floor((assessment.completionTime.getTime() - assessment.startTime.getTime()) / 1000);
      assessment.isCompleted = true;
      assessment.score = completionData.score;
      assessment.responses = completionData.responses;

      // Check for improvement trend
      const previousAssessments = userAssessments
        .filter(a => a.assessmentType === assessment.assessmentType && a.isCompleted && a.assessmentId !== assessmentId)
        .sort((a, b) => b.completionTime!.getTime() - a.completionTime!.getTime());

      if (previousAssessments.length > 0) {
        assessment.previousScore = previousAssessments[0].score;
        if (assessment.score && assessment.previousScore) {
          if (assessment.score < assessment.previousScore) {
            assessment.improvementTrend = 'improving';
          } else if (assessment.score > assessment.previousScore) {
            assessment.improvementTrend = 'declining';
          } else {
            assessment.improvementTrend = 'stable';
          }
        }
      }

      this.assessmentTracking.set(userId, userAssessments);
      this.emit('assessmentCompleted', assessment);
    }
  }

  // Peer Support Tracking
  trackPeerSupportActivity(userId: string, activityData: Partial<PeerSupportMetrics>): void {
    const activity: PeerSupportMetrics = {
      userId,
      activityType: activityData.activityType || 'message-sent',
      timestamp: new Date(),
      ...activityData
    };

    const userPeerSupport = this.peerSupportMetrics.get(userId) || [];
    userPeerSupport.push(activity);
    this.peerSupportMetrics.set(userId, userPeerSupport);

    this.emit('peerSupportActivity', activity);
  }

  // Notification Tracking
  trackNotificationSent(notificationData: Partial<NotificationMetrics>): void {
    const notification: NotificationMetrics = {
      notificationId: notificationData.notificationId || `notif_${Date.now()}`,
      userId: notificationData.userId || '',
      type: notificationData.type || 'push',
      category: notificationData.category || 'reminder',
      title: notificationData.title || '',
      message: notificationData.message || '',
      sentAt: new Date(),
      isOpened: false,
      isClicked: false,
      deliveryStatus: 'sent',
      ...notificationData
    };

    const userNotifications = this.notificationMetrics.get(notification.userId) || [];
    userNotifications.push(notification);
    this.notificationMetrics.set(notification.userId, userNotifications);

    this.emit('notificationSent', notification);
  }

  trackNotificationDelivered(notificationId: string, userId: string): void {
    const userNotifications = this.notificationMetrics.get(userId) || [];
    const notification = userNotifications.find(n => n.notificationId === notificationId);

    if (notification) {
      notification.deliveredAt = new Date();
      notification.deliveryStatus = 'delivered';
      this.notificationMetrics.set(userId, userNotifications);
      this.emit('notificationDelivered', notification);
    }
  }

  trackNotificationOpened(notificationId: string, userId: string): void {
    const userNotifications = this.notificationMetrics.get(userId) || [];
    const notification = userNotifications.find(n => n.notificationId === notificationId);

    if (notification) {
      notification.openedAt = new Date();
      notification.isOpened = true;
      this.notificationMetrics.set(userId, userNotifications);
      this.emit('notificationOpened', notification);
    }
  }

  trackNotificationClicked(notificationId: string, userId: string, action?: string): void {
    const userNotifications = this.notificationMetrics.get(userId) || [];
    const notification = userNotifications.find(n => n.notificationId === notificationId);

    if (notification) {
      notification.clickedAt = new Date();
      notification.isClicked = true;
      notification.actionTaken = action;
      this.notificationMetrics.set(userId, userNotifications);
      this.emit('notificationClicked', notification);
    }
  }

  // Analytics Methods
  getDailyActiveUsers(date: Date = new Date()): number {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const activeUsers = new Set<string>();
    
    for (const session of this.sessions.values()) {
      if (session.startTime >= dayStart && session.startTime <= dayEnd) {
        activeUsers.add(session.userId);
      }
    }

    return activeUsers.size;
  }

  getWeeklyActiveUsers(date: Date = new Date()): number {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const activeUsers = new Set<string>();
    
    for (const session of this.sessions.values()) {
      if (session.startTime >= weekStart && session.startTime <= weekEnd) {
        activeUsers.add(session.userId);
      }
    }

    return activeUsers.size;
  }

  getMonthlyActiveUsers(date: Date = new Date()): number {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const activeUsers = new Set<string>();
    
    for (const session of this.sessions.values()) {
      if (session.startTime >= monthStart && session.startTime <= monthEnd) {
        activeUsers.add(session.userId);
      }
    }

    return activeUsers.size;
  }

  getFeatureUsagePatterns(): Map<string, FeatureAnalytics> {
    const featureAnalytics = new Map<string, FeatureAnalytics>();
    
    for (const [userId, usageList] of this.featureUsage) {
      for (const usage of usageList) {
        const feature = usage.feature;
        
        if (!featureAnalytics.has(feature)) {
          featureAnalytics.set(feature, {
            feature,
            totalUsers: 0,
            activeUsers: { daily: 0, weekly: 0, monthly: 0 },
            usageFrequency: { daily: 0, weekly: 0, monthly: 0, rarely: 0 },
            averageSessionDuration: 0,
            completionRate: 0,
            satisfactionScore: 0,
            topUserActions: [],
            dropoffPoints: []
          });
        }
        
        const analytics = featureAnalytics.get(feature)!;
        analytics.totalUsers++;
        
        // Calculate frequency and other metrics
        // This is a simplified version - in production, you'd have more sophisticated calculations
      }
    }
    
    return featureAnalytics;
  }

  getContentInteractionRates(): any {
    const interactionRates: any = {};
    
    for (const [userId, interactions] of this.contentInteractions) {
      for (const interaction of interactions) {
        const contentType = interaction.contentType;
        
        if (!interactionRates[contentType]) {
          interactionRates[contentType] = {
            totalViews: 0,
            totalCompletions: 0,
            averageDuration: 0,
            averageProgress: 0,
            topCategories: new Map<string, number>()
          };
        }
        
        const rates = interactionRates[contentType];
        
        if (interaction.action === 'view') rates.totalViews++;
        if (interaction.action === 'complete') rates.totalCompletions++;
        
        if (interaction.duration) {
          rates.averageDuration = (rates.averageDuration + interaction.duration) / 2;
        }
        
        if (interaction.progress) {
          rates.averageProgress = (rates.averageProgress + interaction.progress) / 2;
        }
        
        // Track category popularity
        const categoryCount = rates.topCategories.get(interaction.category) || 0;
        rates.topCategories.set(interaction.category, categoryCount + 1);
      }
    }
    
    return interactionRates;
  }

  getAssessmentCompletionRates(): any {
    const completionRates: any = {};
    
    for (const [userId, assessments] of this.assessmentTracking) {
      for (const assessment of assessments) {
        const type = assessment.assessmentType;
        
        if (!completionRates[type]) {
          completionRates[type] = {
            totalStarted: 0,
            totalCompleted: 0,
            completionRate: 0,
            averageDuration: 0,
            improvementRate: 0
          };
        }
        
        const rates = completionRates[type];
        rates.totalStarted++;
        
        if (assessment.isCompleted) {
          rates.totalCompleted++;
          if (assessment.duration) {
            rates.averageDuration = (rates.averageDuration + assessment.duration) / 2;
          }
          if (assessment.improvementTrend === 'improving') {
            rates.improvementRate++;
          }
        }
        
        rates.completionRate = (rates.totalCompleted / rates.totalStarted) * 100;
      }
    }
    
    return completionRates;
  }

  getPeerSupportParticipation(): any {
    const participation: any = {
      totalParticipants: this.peerSupportMetrics.size,
      messagesSent: 0,
      supportGiven: 0,
      groupJoins: 0,
      averageResponseTime: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0, supportive: 0 }
    };
    
    let responseTimeSum = 0;
    let responseTimeCount = 0;
    
    for (const [userId, activities] of this.peerSupportMetrics) {
      for (const activity of activities) {
        switch (activity.activityType) {
          case 'message-sent':
            participation.messagesSent++;
            break;
          case 'support-given':
            participation.supportGiven++;
            break;
          case 'group-join':
            participation.groupJoins++;
            break;
        }
        
        if (activity.responseTime) {
          responseTimeSum += activity.responseTime;
          responseTimeCount++;
        }
        
        if (activity.sentiment) {
          participation.sentimentDistribution[activity.sentiment]++;
        }
      }
    }
    
    participation.averageResponseTime = responseTimeCount > 0 ? responseTimeSum / responseTimeCount : 0;
    
    return participation;
  }

  getRetentionAnalysis(): any {
    const now = new Date();
    const cohorts = new Map<string, CohortAnalysis>();
    
    for (const [userId, retention] of this.retentionData) {
      const cohortKey = retention.cohortDate.toISOString().split('T')[0];
      
      if (!cohorts.has(cohortKey)) {
        cohorts.set(cohortKey, {
          cohortId: cohortKey,
          cohortDate: retention.cohortDate,
          totalUsers: 0,
          retentionRates: { day1: 0, day7: 0, day14: 0, day30: 0, day60: 0, day90: 0 },
          averageEngagement: 0,
          topFeatures: [],
          churnPatterns: []
        });
      }
      
      const cohort = cohorts.get(cohortKey)!;
      cohort.totalUsers++;
      
      // Calculate retention rates based on last active date
      const daysSinceRegistration = Math.floor((now.getTime() - retention.cohortDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysSinceLastActive = Math.floor((now.getTime() - retention.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceRegistration >= 1 && daysSinceLastActive <= 1) cohort.retentionRates.day1++;
      if (daysSinceRegistration >= 7 && daysSinceLastActive <= 7) cohort.retentionRates.day7++;
      if (daysSinceRegistration >= 14 && daysSinceLastActive <= 14) cohort.retentionRates.day14++;
      if (daysSinceRegistration >= 30 && daysSinceLastActive <= 30) cohort.retentionRates.day30++;
      if (daysSinceRegistration >= 60 && daysSinceLastActive <= 60) cohort.retentionRates.day60++;
      if (daysSinceRegistration >= 90 && daysSinceLastActive <= 90) cohort.retentionRates.day90++;
    }
    
    // Convert counts to percentages
    for (const cohort of cohorts.values()) {
      cohort.retentionRates.day1 = (cohort.retentionRates.day1 / cohort.totalUsers) * 100;
      cohort.retentionRates.day7 = (cohort.retentionRates.day7 / cohort.totalUsers) * 100;
      cohort.retentionRates.day14 = (cohort.retentionRates.day14 / cohort.totalUsers) * 100;
      cohort.retentionRates.day30 = (cohort.retentionRates.day30 / cohort.totalUsers) * 100;
      cohort.retentionRates.day60 = (cohort.retentionRates.day60 / cohort.totalUsers) * 100;
      cohort.retentionRates.day90 = (cohort.retentionRates.day90 / cohort.totalUsers) * 100;
    }
    
    return Array.from(cohorts.values());
  }

  getNotificationEffectiveness(): any {
    const effectiveness: any = {
      totalSent: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      byType: {},
      byCategory: {},
      optimalSendTimes: []
    };
    
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    
    for (const [userId, notifications] of this.notificationMetrics) {
      for (const notification of notifications) {
        effectiveness.totalSent++;
        
        if (notification.deliveryStatus === 'delivered') totalDelivered++;
        if (notification.isOpened) totalOpened++;
        if (notification.isClicked) totalClicked++;
        
        // Track by type
        if (!effectiveness.byType[notification.type]) {
          effectiveness.byType[notification.type] = { sent: 0, opened: 0, clicked: 0 };
        }
        effectiveness.byType[notification.type].sent++;
        if (notification.isOpened) effectiveness.byType[notification.type].opened++;
        if (notification.isClicked) effectiveness.byType[notification.type].clicked++;
        
        // Track by category
        if (!effectiveness.byCategory[notification.category]) {
          effectiveness.byCategory[notification.category] = { sent: 0, opened: 0, clicked: 0 };
        }
        effectiveness.byCategory[notification.category].sent++;
        if (notification.isOpened) effectiveness.byCategory[notification.category].opened++;
        if (notification.isClicked) effectiveness.byCategory[notification.category].clicked++;
      }
    }
    
    effectiveness.deliveryRate = effectiveness.totalSent > 0 ? (totalDelivered / effectiveness.totalSent) * 100 : 0;
    effectiveness.openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    effectiveness.clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
    
    return effectiveness;
  }

  // Engagement Score Calculation
  private updateEngagementScore(userId: string): void {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get user data for last 30 days
    const userSessions = Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && s.startTime >= last30Days
    );
    
    const userFeatures = this.featureUsage.get(userId)?.filter(f => f.timestamp >= last30Days) || [];
    const userContent = this.contentInteractions.get(userId)?.filter(c => c.timestamp >= last30Days) || [];
    const userAssessments = this.assessmentTracking.get(userId)?.filter(a => a.startTime >= last30Days) || [];
    const userPeerSupport = this.peerSupportMetrics.get(userId)?.filter(p => p.timestamp >= last30Days) || [];
    
    // Calculate category scores (0-100)
    const categoryScores = {
      dailyCheckins: this.calculateDailyCheckinsScore(userId, last30Days),
      assessments: this.calculateAssessmentsScore(userAssessments),
      education: this.calculateEducationScore(userContent),
      peerSupport: this.calculatePeerSupportScore(userPeerSupport),
      resourceUsage: this.calculateResourceUsageScore(userFeatures),
      appUsage: this.calculateAppUsageScore(userSessions)
    };
    
    // Calculate overall score (weighted average)
    const weights = {
      dailyCheckins: 0.25,
      assessments: 0.20,
      education: 0.15,
      peerSupport: 0.15,
      resourceUsage: 0.10,
      appUsage: 0.15
    };
    
    const overallScore = Object.entries(categoryScores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);
    
    // Determine trend
    const previousScores = this.engagementScores.get(userId) || [];
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    
    if (previousScores.length > 0) {
      const lastScore = previousScores[previousScores.length - 1].overallScore;
      if (overallScore > lastScore + 5) trend = 'increasing';
      else if (overallScore < lastScore - 5) trend = 'decreasing';
    }
    
    const engagementScore: EngagementScore = {
      userId,
      date: now,
      overallScore: Math.round(overallScore),
      categoryScores,
      trend,
      factors: this.getEngagementFactors(categoryScores),
      recommendations: this.getEngagementRecommendations(categoryScores, trend)
    };
    
    previousScores.push(engagementScore);
    this.engagementScores.set(userId, previousScores);
    
    this.emit('engagementScoreUpdated', engagementScore);
  }

  private calculateDailyCheckinsScore(userId: string, since: Date): number {
    // Implementation would check daily checkin frequency
    return 75; // Placeholder
  }

  private calculateAssessmentsScore(assessments: AssessmentTracking[]): number {
    const completed = assessments.filter(a => a.isCompleted).length;
    const total = assessments.length;
    return total > 0 ? (completed / total) * 100 : 0;
  }

  private calculateEducationScore(content: ContentInteraction[]): number {
    const completed = content.filter(c => c.action === 'complete').length;
    const viewed = content.filter(c => c.action === 'view').length;
    return viewed > 0 ? (completed / viewed) * 100 : 0;
  }

  private calculatePeerSupportScore(activities: PeerSupportMetrics[]): number {
    const supportGiven = activities.filter(a => a.activityType === 'support-given').length;
    return Math.min(supportGiven * 10, 100); // 10 points per support given, max 100
  }

  private calculateResourceUsageScore(features: FeatureUsage[]): number {
    const uniqueResources = new Set(features.map(f => f.feature)).size;
    return Math.min(uniqueResources * 20, 100); // 20 points per unique resource, max 100
  }

  private calculateAppUsageScore(sessions: UserSession[]): number {
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const averageDaily = totalDuration / 30; // 30 days
    return Math.min(averageDaily / 10, 100); // 1 point per 10 seconds average daily, max 100
  }

  private getEngagementFactors(scores: any): string[] {
    const factors = [];
    if (scores.dailyCheckins > 80) factors.push('Consistent daily check-ins');
    if (scores.assessments > 70) factors.push('Regular assessment completion');
    if (scores.education > 60) factors.push('Active learning engagement');
    if (scores.peerSupport > 50) factors.push('Supportive community member');
    if (scores.resourceUsage > 40) factors.push('Diverse resource utilization');
    if (scores.appUsage > 70) factors.push('High app engagement');
    return factors;
  }

  private getEngagementRecommendations(scores: any, trend: string): string[] {
    const recommendations = [];
    if (scores.dailyCheckins < 50) recommendations.push('Try setting daily check-in reminders');
    if (scores.assessments < 40) recommendations.push('Complete mental health assessments regularly');
    if (scores.education < 30) recommendations.push('Explore educational content');
    if (scores.peerSupport < 25) recommendations.push('Join peer support groups');
    if (scores.resourceUsage < 20) recommendations.push('Browse available resources');
    if (trend === 'decreasing') recommendations.push('Consider reaching out for additional support');
    return recommendations;
  }

  // Periodic Tasks
  private startPeriodicTasks(): void {
    // Update engagement scores daily
    setInterval(() => {
      this.updateAllEngagementScores();
    }, 24 * 60 * 60 * 1000); // Daily

    // Clean old data weekly
    setInterval(() => {
      this.cleanOldData();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly
  }

  private updateAllEngagementScores(): void {
    const allUsers = new Set<string>();
    
    for (const session of this.sessions.values()) {
      allUsers.add(session.userId);
    }
    
    for (const userId of allUsers) {
      this.updateEngagementScore(userId);
    }
  }

  private cleanOldData(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // Keep 90 days of data
    
    // Clean old sessions
    for (const [sessionId, session] of this.sessions) {
      if (session.startTime < cutoffDate) {
        this.sessions.delete(sessionId);
      }
    }
    
    // Clean old interactions
    for (const [userId, interactions] of this.userInteractions) {
      const filtered = interactions.filter(i => i.timestamp >= cutoffDate);
      this.userInteractions.set(userId, filtered);
    }
    
    // Similar cleanup for other data structures...
  }

  // Public API for getting analytics
  getAnalyticsDashboard(): any {
    return {
      activeUsers: {
        daily: this.getDailyActiveUsers(),
        weekly: this.getWeeklyActiveUsers(),
        monthly: this.getMonthlyActiveUsers()
      },
      featureUsage: this.getFeatureUsagePatterns(),
      contentInteraction: this.getContentInteractionRates(),
      assessmentCompletion: this.getAssessmentCompletionRates(),
      peerSupportParticipation: this.getPeerSupportParticipation(),
      retentionAnalysis: this.getRetentionAnalysis(),
      notificationEffectiveness: this.getNotificationEffectiveness()
    };
  }
}

// Export singleton instance
export const engagementTracker = new EngagementTracker();
