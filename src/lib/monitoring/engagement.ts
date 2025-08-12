/**
 * User Engagement and Satisfaction Monitoring
 * Tracks user behavior, satisfaction metrics, and engagement patterns
 */

import { UserEngagementMetrics, MonitoringAlert } from './types';
import { prisma } from '../prisma';

export class EngagementMonitor {
  private sessionData: Map<string, {
    startTime: number;
    pageViews: number;
    assessments: number;
    resources: number;
    messages: number;
    lastActivity: number;
  }> = new Map();

  private satisfactionScores: Map<string, number[]> = new Map();

  constructor() {
    // Clean up old sessions every hour
    setInterval(() => this.cleanupOldSessions(), 3600000);
    
    // Generate engagement reports every 24 hours
    setInterval(() => this.generateEngagementReport(), 86400000);
  }

  /**
   * Start tracking a user session
   */
  public startSession(userId: string): void {
    const now = Date.now();
    this.sessionData.set(userId, {
      startTime: now,
      pageViews: 0,
      assessments: 0,
      resources: 0,
      messages: 0,
      lastActivity: now
    });
  }

  /**
   * Track page view
   */
  public trackPageView(userId: string): void {
    const session = this.sessionData.get(userId);
    if (session) {
      session.pageViews++;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Track assessment completion
   */
  public trackAssessment(userId: string): void {
    const session = this.sessionData.get(userId);
    if (session) {
      session.assessments++;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Track resource access
   */
  public trackResourceAccess(userId: string): void {
    const session = this.sessionData.get(userId);
    if (session) {
      session.resources++;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Track message sent
   */
  public trackMessage(userId: string): void {
    const session = this.sessionData.get(userId);
    if (session) {
      session.messages++;
      session.lastActivity = Date.now();
    }
  }

  /**
   * Record satisfaction score
   */
  public recordSatisfactionScore(userId: string, score: number): void {
    if (score < 1 || score > 5) {
      throw new Error('Satisfaction score must be between 1 and 5');
    }

    const scores = this.satisfactionScores.get(userId) || [];
    scores.push(score);
    
    // Keep only last 10 scores per user
    if (scores.length > 10) {
      scores.shift();
    }
    
    this.satisfactionScores.set(userId, scores);
  }

  /**
   * End session and store metrics
   */
  public async endSession(userId: string): Promise<UserEngagementMetrics | null> {
    const session = this.sessionData.get(userId);
    if (!session) {
      return null;
    }

    const now = Date.now();
    const sessionDuration = Math.floor((now - session.startTime) / 1000); // seconds

    // Get user's retention period
    const user = await prisma.anonymousUser.findUnique({
      where: { anonymousId: userId }
    });

    const retentionPeriod = user 
      ? Math.floor((now - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Calculate average satisfaction score
    const userScores = this.satisfactionScores.get(userId) || [];
    const avgSatisfaction = userScores.length > 0 
      ? userScores.reduce((sum, score) => sum + score, 0) / userScores.length
      : undefined;

    const metrics: UserEngagementMetrics = {
      userId,
      sessionDuration,
      pagesViewed: session.pageViews,
      assessmentsCompleted: session.assessments,
      resourcesAccessed: session.resources,
      messagesSent: session.messages,
      lastActiveTime: new Date(session.lastActivity),
      satisfactionScore: avgSatisfaction,
      retentionPeriod
    };

    // Store metrics in database
    await this.storeEngagementMetrics(metrics);

    // Check for engagement alerts
    await this.checkEngagementAlerts(metrics);

    // Clean up session data
    this.sessionData.delete(userId);

    return metrics;
  }

  /**
   * Store engagement metrics in database
   */
  private async storeEngagementMetrics(metrics: UserEngagementMetrics): Promise<void> {
    try {
      await prisma.userEngagementMetrics.create({
        data: {
          userId: metrics.userId,
          sessionDuration: metrics.sessionDuration,
          pagesViewed: metrics.pagesViewed,
          assessmentsCompleted: metrics.assessmentsCompleted,
          resourcesAccessed: metrics.resourcesAccessed,
          messagesSent: metrics.messagesSent,
          lastActiveTime: metrics.lastActiveTime,
          satisfactionScore: metrics.satisfactionScore,
          retentionPeriod: metrics.retentionPeriod
        }
      });
    } catch (error) {
      console.error('Failed to store engagement metrics:', error);
    }
  }

  /**
   * Check for engagement-related alerts
   */
  private async checkEngagementAlerts(metrics: UserEngagementMetrics): Promise<void> {
    const alerts: MonitoringAlert[] = [];

    // Low engagement alert
    if (metrics.sessionDuration < 30 && metrics.pagesViewed < 2) {
      alerts.push({
        id: `engagement-low-${Date.now()}`,
        type: 'performance',
        severity: 'low',
        title: 'Low User Engagement',
        description: `User ${metrics.userId} had very low engagement: ${metrics.sessionDuration}s session, ${metrics.pagesViewed} pages`,
        metrics,
        threshold: 30,
        currentValue: metrics.sessionDuration,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: []
      });
    }

    // Low satisfaction alert
    if (metrics.satisfactionScore && metrics.satisfactionScore < 2.5) {
      alerts.push({
        id: `satisfaction-low-${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        title: 'Low Satisfaction Score',
        description: `User ${metrics.userId} reported low satisfaction: ${metrics.satisfactionScore}/5.0`,
        metrics,
        threshold: 2.5,
        currentValue: metrics.satisfactionScore,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email']
      });
    }

    // High churn risk (returning user with very short session)
    if (metrics.retentionPeriod > 7 && metrics.sessionDuration < 60) {
      alerts.push({
        id: `churn-risk-${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        title: 'Potential User Churn',
        description: `Returning user ${metrics.userId} (${metrics.retentionPeriod} days) had very short session: ${metrics.sessionDuration}s`,
        metrics,
        threshold: 60,
        currentValue: metrics.sessionDuration,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email']
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: MonitoringAlert): Promise<void> {
    try {
      await prisma.monitoringAlert.create({
        data: {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          metrics: alert.metrics as any,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          notificationChannels: alert.notificationChannels
        }
      });
    } catch (error) {
      console.error('Failed to store engagement alert:', error);
    }
  }

  /**
   * Clean up old session data
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30 minutes

    for (const [userId, session] of this.sessionData.entries()) {
      if (now - session.lastActivity > timeout) {
        // Auto-end inactive sessions
        this.endSession(userId).catch(console.error);
      }
    }
  }

  /**
   * Generate daily engagement report
   */
  private async generateEngagementReport(): Promise<void> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get yesterday's engagement metrics
      const metrics = await prisma.userEngagementMetrics.findMany({
        where: {
          timestamp: {
            gte: yesterday,
            lt: today
          }
        }
      });

      if (metrics.length === 0) {
        return;
      }

      // Calculate aggregate metrics
      const totalUsers = metrics.length;
      const avgSessionDuration = metrics.reduce((sum, m) => sum + m.sessionDuration, 0) / totalUsers;
      const avgPagesViewed = metrics.reduce((sum, m) => sum + m.pagesViewed, 0) / totalUsers;
      const totalAssessments = metrics.reduce((sum, m) => sum + m.assessmentsCompleted, 0);
      const totalResources = metrics.reduce((sum, m) => sum + m.resourcesAccessed, 0);
      const totalMessages = metrics.reduce((sum, m) => sum + m.messagesSent, 0);
      
      const satisfactionScores = metrics
        .filter(m => m.satisfactionScore !== undefined)
        .map(m => m.satisfactionScore as number);
      
      const avgSatisfaction = satisfactionScores.length > 0
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : undefined;

      // Check for concerning trends
      const lowEngagementUsers = metrics.filter(m => m.sessionDuration < 60).length;
      const lowSatisfactionUsers = satisfactionScores.filter(score => score < 2.5).length;

      console.log(`Daily Engagement Report for ${yesterday.toDateString()}:`);
      console.log(`- Total active users: ${totalUsers}`);
      console.log(`- Average session duration: ${avgSessionDuration.toFixed(1)}s`);
      console.log(`- Average pages viewed: ${avgPagesViewed.toFixed(1)}`);
      console.log(`- Total assessments: ${totalAssessments}`);
      console.log(`- Total resources accessed: ${totalResources}`);
      console.log(`- Total messages sent: ${totalMessages}`);
      if (avgSatisfaction !== undefined) {
        console.log(`- Average satisfaction: ${avgSatisfaction.toFixed(2)}/5.0`);
      }
      console.log(`- Low engagement users: ${lowEngagementUsers} (${((lowEngagementUsers/totalUsers)*100).toFixed(1)}%)`);
      console.log(`- Low satisfaction users: ${lowSatisfactionUsers} (${((lowSatisfactionUsers/satisfactionScores.length)*100).toFixed(1)}%)`);

      // Generate alerts for concerning trends
      if (lowEngagementUsers / totalUsers > 0.3) {
        await this.storeAlert({
          id: `trend-low-engagement-${Date.now()}`,
          type: 'performance',
          severity: 'medium',
          title: 'High Low-Engagement Rate',
          description: `${((lowEngagementUsers/totalUsers)*100).toFixed(1)}% of users had low engagement yesterday`,
          metrics: { totalUsers, lowEngagementUsers, percentage: (lowEngagementUsers/totalUsers)*100 },
          threshold: 30,
          currentValue: (lowEngagementUsers/totalUsers)*100,
          timestamp: new Date(),
          resolved: false,
          notificationChannels: ['email']
        });
      }

      if (avgSatisfaction !== undefined && avgSatisfaction < 3.0) {
        await this.storeAlert({
          id: `trend-low-satisfaction-${Date.now()}`,
          type: 'performance',
          severity: 'high',
          title: 'Low Average Satisfaction',
          description: `Average satisfaction score was ${avgSatisfaction.toFixed(2)}/5.0 yesterday`,
          metrics: { avgSatisfaction, totalResponses: satisfactionScores.length },
          threshold: 3.0,
          currentValue: avgSatisfaction,
          timestamp: new Date(),
          resolved: false,
          notificationChannels: ['email', 'slack']
        });
      }

    } catch (error) {
      console.error('Failed to generate engagement report:', error);
    }
  }

  /**
   * Get engagement statistics for a user
   */
  public async getUserEngagementStats(userId: string, days: number = 30): Promise<any> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const metrics = await prisma.userEngagementMetrics.findMany({
      where: {
        userId,
        timestamp: {
          gte: cutoff
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (metrics.length === 0) {
      return null;
    }

    const totalSessions = metrics.length;
    const avgSessionDuration = metrics.reduce((sum, m) => sum + m.sessionDuration, 0) / totalSessions;
    const totalPagesViewed = metrics.reduce((sum, m) => sum + m.pagesViewed, 0);
    const totalAssessments = metrics.reduce((sum, m) => sum + m.assessmentsCompleted, 0);
    const totalResources = metrics.reduce((sum, m) => sum + m.resourcesAccessed, 0);
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesSent, 0);

    const satisfactionScores = metrics
      .filter(m => m.satisfactionScore !== undefined)
      .map(m => m.satisfactionScore as number);

    return {
      userId,
      period: `${days} days`,
      totalSessions,
      avgSessionDuration: Math.round(avgSessionDuration),
      totalPagesViewed,
      totalAssessments,
      totalResources,
      totalMessages,
      avgSatisfaction: satisfactionScores.length > 0 
        ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
        : null,
      retentionPeriod: metrics[0]?.retentionPeriod || 0,
      lastActiveTime: metrics[0]?.lastActiveTime
    };
  }

  /**
   * Get current active sessions
   */
  public getActiveSessions(): Array<{userId: string, duration: number, activity: number}> {
    const now = Date.now();
    return Array.from(this.sessionData.entries()).map(([userId, session]) => ({
      userId,
      duration: Math.floor((now - session.startTime) / 1000),
      activity: Math.floor((now - session.lastActivity) / 1000)
    }));
  }
}

// Singleton instance
export const engagementMonitor = new EngagementMonitor();
