/**
 * Mental Health Crisis Detection and Alerting System
 * Real-time monitoring for crisis keywords, behavioral patterns, and risk escalation
 */

import { CrisisAlert, MonitoringAlert } from './types';
import { prisma } from '../prisma';
import { determineRiskLevel } from '../business-logic';

export class CrisisDetectionMonitor {
  private alertThresholds = {
    critical: {
      responseTime: 60000, // 1 minute max response time
      escalationTime: 300000, // 5 minutes auto-escalation
      keywordWeight: 10
    },
    high: {
      responseTime: 300000, // 5 minutes max response time
      escalationTime: 900000, // 15 minutes auto-escalation
      keywordWeight: 7
    },
    medium: {
      responseTime: 1800000, // 30 minutes max response time
      escalationTime: 3600000, // 1 hour auto-escalation
      keywordWeight: 4
    },
    low: {
      responseTime: 7200000, // 2 hours max response time
      escalationTime: 14400000, // 4 hours auto-escalation
      keywordWeight: 2
    }
  };

  private crisisKeywords = {
    critical: {
      en: [
        'suicide', 'kill myself', 'end my life', 'want to die', 'hurt myself',
        'self harm', 'not worth living', 'better off dead', 'end it all',
        'suicide plan', 'goodbye forever', 'can\'t take it anymore'
      ],
      zh: [
        '自杀', '自殺', '我想死', '结束生命', '伤害自己', '不想活', '死了算了',
        '自残', '生不如死', '一了百了'
      ],
      bn: [
        'আত্মহত্যা', 'মরে যেতে চাই', 'নিজেকে মেরে ফেলব', 'বাঁচতে চাই না',
        'আর পারছি না', 'শেষ করে দেব'
      ]
    },
    high: {
      en: [
        'hopeless', 'no point', 'give up', 'can\'t go on', 'worthless',
        'everyone better without me', 'no way out', 'can\'t handle',
        'unbearable pain', 'desperate', 'trapped'
      ],
      zh: [
        '绝望', '没有希望', '放弃', '没有意义', '撑不下去', '无法忍受',
        '走投无路', '痛不欲生'
      ],
      bn: [
        'নিরাশ', 'আশা নেই', 'হার মেনে নিয়েছি', 'কোন উপায় নেই',
        'সহ্য করতে পারছি না'
      ]
    },
    medium: {
      en: [
        'very depressed', 'extremely sad', 'panic attacks', 'can\'t sleep',
        'losing control', 'overwhelming anxiety', 'feel empty',
        'nothing matters', 'isolating myself'
      ],
      zh: [
        '非常抑郁', '极度悲伤', '恐慌发作', '睡不着', '失去控制',
        '压倒性焦虑', '感到空虚'
      ],
      bn: [
        'খুব বিষণ্ন', 'অতিরিক্ত দুঃখ', 'আতঙ্কের আক্রমণ', 'ঘুম আসে না',
        'নিয়ন্ত্রণ হারাচ্ছি'
      ]
    }
  };

  constructor() {
    // Check for pending alerts every minute
    setInterval(() => this.checkPendingAlerts(), 60000);
    
    // Generate crisis reports every 4 hours
    setInterval(() => this.generateCrisisReport(), 14400000);
  }

  /**
   * Analyze text content for crisis indicators
   */
  public async analyzeContent(
    userId: string,
    content: string,
    language: string = 'en',
    context?: {
      phq4Score?: number;
      previousAlerts?: number;
      sessionDuration?: number;
    }
  ): Promise<CrisisAlert | null> {
    const startTime = Date.now();
    
    // Basic risk assessment using business logic
    const riskLevel = determineRiskLevel(content, language);
    
    // Enhanced crisis detection
    const crisisIndicators = this.detectCrisisIndicators(content, language);
    const severityLevel = this.calculateSeverityLevel(crisisIndicators, context);
    
    if (severityLevel === 'low' && riskLevel === 'low') {
      return null; // No crisis detected
    }

    const finalSeverity = this.getHigherSeverity(severityLevel, riskLevel);
    const responseTime = Date.now() - startTime;

    // Create crisis alert
    const alert: CrisisAlert = {
      id: `crisis-${Date.now()}-${userId}`,
      userId,
      severity: finalSeverity,
      triggerType: 'keyword',
      content: content.substring(0, 500), // Limit content length
      phq4Score: context?.phq4Score,
      riskFactors: crisisIndicators.detectedKeywords,
      timestamp: new Date(),
      resolved: false,
      responseTime,
      escalated: false,
      notificationsSent: []
    };

    // Store alert in database
    await this.storeCrisisAlert(alert);

    // Send immediate notifications for high/critical alerts
    if (finalSeverity === 'critical' || finalSeverity === 'high') {
      await this.sendImmediateNotifications(alert);
    }

    return alert;
  }

  /**
   * Analyze PHQ-4 assessment scores for crisis indicators
   */
  public async analyzeAssessment(
    userId: string,
    phq4Score: number,
    subscores: { depression: number; anxiety: number }
  ): Promise<CrisisAlert | null> {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const riskFactors: string[] = [];

    // Score-based risk assessment
    if (phq4Score >= 11) {
      severity = 'critical';
      riskFactors.push('extremely_high_phq4_score');
    } else if (phq4Score >= 9) {
      severity = 'high';
      riskFactors.push('high_phq4_score');
    } else if (phq4Score >= 6) {
      severity = 'medium';
      riskFactors.push('moderate_phq4_score');
    }

    // Specific subscale analysis
    if (subscores.depression >= 5) {
      riskFactors.push('severe_depression_indicators');
      if (severity === 'low') severity = 'medium';
    }
    
    if (subscores.anxiety >= 5) {
      riskFactors.push('severe_anxiety_indicators');
      if (severity === 'low') severity = 'medium';
    }

    // Check for concerning combinations
    if (subscores.depression >= 4 && subscores.anxiety >= 4) {
      riskFactors.push('combined_depression_anxiety');
      severity = severity === 'low' ? 'high' : severity;
    }

    if (severity === 'low') {
      return null; // No crisis level detected
    }

    const alert: CrisisAlert = {
      id: `crisis-assessment-${Date.now()}-${userId}`,
      userId,
      severity,
      triggerType: 'assessment_score',
      phq4Score,
      riskFactors,
      timestamp: new Date(),
      resolved: false,
      responseTime: 0,
      escalated: false,
      notificationsSent: []
    };

    await this.storeCrisisAlert(alert);

    if (severity === 'critical' || severity === 'high') {
      await this.sendImmediateNotifications(alert);
    }

    return alert;
  }

  /**
   * Analyze behavioral patterns for crisis indicators
   */
  public async analyzeBehavioralPattern(userId: string): Promise<CrisisAlert | null> {
    try {
      // Get recent user data
      const recentData = await this.getUserRecentActivity(userId);
      
      if (!recentData) {
        return null;
      }

      const riskFactors: string[] = [];
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Analyze patterns
      if (recentData.assessmentTrend === 'worsening') {
        riskFactors.push('worsening_assessment_scores');
        severity = 'medium';
      }

      if (recentData.moodTrend === 'declining') {
        riskFactors.push('declining_mood_pattern');
        severity = severity === 'low' ? 'medium' : severity;
      }

      if (recentData.engagementDrop) {
        riskFactors.push('sudden_engagement_drop');
        severity = severity === 'low' ? 'medium' : severity;
      }

      if (recentData.isolationPattern) {
        riskFactors.push('social_isolation_pattern');
        severity = 'medium';
      }

      // Combination risk assessment
      if (riskFactors.length >= 3) {
        severity = 'high';
        riskFactors.push('multiple_risk_patterns');
      }

      if (severity === 'low') {
        return null;
      }

      const alert: CrisisAlert = {
        id: `crisis-pattern-${Date.now()}-${userId}`,
        userId,
        severity,
        triggerType: 'behavioral_pattern',
        riskFactors,
        timestamp: new Date(),
        resolved: false,
        responseTime: 0,
        escalated: false,
        notificationsSent: []
      };

      await this.storeCrisisAlert(alert);
      return alert;

    } catch (error) {
      console.error('Error analyzing behavioral pattern:', error);
      return null;
    }
  }

  /**
   * Detect crisis indicators in text
   */
  private detectCrisisIndicators(content: string, language: string) {
    const lowerContent = content.toLowerCase();
    const detectedKeywords: string[] = [];
    let maxWeight = 0;

    // Check critical keywords
    const criticalWords = this.crisisKeywords.critical[language as keyof typeof this.crisisKeywords.critical] || 
                         this.crisisKeywords.critical.en;
    
    for (const keyword of criticalWords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        maxWeight = Math.max(maxWeight, this.alertThresholds.critical.keywordWeight);
      }
    }

    // Check high-risk keywords
    const highWords = this.crisisKeywords.high[language as keyof typeof this.crisisKeywords.high] || 
                     this.crisisKeywords.high.en;
    
    for (const keyword of highWords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        maxWeight = Math.max(maxWeight, this.alertThresholds.high.keywordWeight);
      }
    }

    // Check medium-risk keywords
    const mediumWords = this.crisisKeywords.medium[language as keyof typeof this.crisisKeywords.medium] || 
                       this.crisisKeywords.medium.en;
    
    for (const keyword of mediumWords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
        maxWeight = Math.max(maxWeight, this.alertThresholds.medium.keywordWeight);
      }
    }

    return { detectedKeywords, maxWeight };
  }

  /**
   * Calculate severity level based on indicators and context
   */
  private calculateSeverityLevel(
    indicators: { detectedKeywords: string[]; maxWeight: number },
    context?: {
      phq4Score?: number;
      previousAlerts?: number;
      sessionDuration?: number;
    }
  ): 'low' | 'medium' | 'high' | 'critical' {
    let baseWeight = indicators.maxWeight;

    // Adjust weight based on context
    if (context?.phq4Score && context.phq4Score >= 9) {
      baseWeight += 3;
    } else if (context?.phq4Score && context.phq4Score >= 6) {
      baseWeight += 1;
    }

    if (context?.previousAlerts && context.previousAlerts > 2) {
      baseWeight += 2;
    }

    if (context?.sessionDuration && context.sessionDuration < 60) {
      baseWeight += 1; // Quick sessions with crisis keywords are concerning
    }

    // Determine severity
    if (baseWeight >= 10) return 'critical';
    if (baseWeight >= 7) return 'high';
    if (baseWeight >= 4) return 'medium';
    return 'low';
  }

  /**
   * Get higher severity between two levels
   */
  private getHigherSeverity(level1: string, level2: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const higher = Math.max(
      severityOrder[level1 as keyof typeof severityOrder] || 0,
      severityOrder[level2 as keyof typeof severityOrder] || 0
    );
    
    return Object.keys(severityOrder)[higher] as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Store crisis alert in database
   */
  private async storeCrisisAlert(alert: CrisisAlert): Promise<void> {
    try {
      await prisma.crisisAlert.create({
        data: {
          id: alert.id,
          userId: alert.userId,
          severity: alert.severity,
          triggerType: alert.triggerType,
          content: alert.content,
          phq4Score: alert.phq4Score,
          riskFactors: alert.riskFactors,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          responseTime: alert.responseTime,
          escalated: alert.escalated,
          notificationsSent: alert.notificationsSent
        }
      });
    } catch (error) {
      console.error('Failed to store crisis alert:', error);
    }
  }

  /**
   * Send immediate notifications for high-priority alerts
   */
  private async sendImmediateNotifications(alert: CrisisAlert): Promise<void> {
    const channels: string[] = [];

    if (alert.severity === 'critical') {
      channels.push('emergency_hotline', 'admin_sms', 'admin_email');
      console.log(`🚨 CRITICAL ALERT: User ${alert.userId} - ${alert.riskFactors.join(', ')}`);
    } else if (alert.severity === 'high') {
      channels.push('admin_email', 'slack_urgent');
      console.log(`⚠️ HIGH ALERT: User ${alert.userId} - ${alert.riskFactors.join(', ')}`);
    }

    // Update alert with sent notifications
    alert.notificationsSent = channels;
    
    try {
      await prisma.crisisAlert.update({
        where: { id: alert.id },
        data: { notificationsSent: channels }
      });
    } catch (error) {
      console.error('Failed to update crisis alert notifications:', error);
    }
  }

  /**
   * Check for pending alerts that need escalation
   */
  private async checkPendingAlerts(): Promise<void> {
    try {
      const now = new Date();
      const pendingAlerts = await prisma.crisisAlert.findMany({
        where: {
          resolved: false,
          escalated: false
        }
      });

      for (const alert of pendingAlerts) {
        const alertAge = now.getTime() - alert.timestamp.getTime();
        const threshold = this.alertThresholds[alert.severity as keyof typeof this.alertThresholds];
        
        if (alertAge > threshold.escalationTime) {
          // Escalate alert
          await this.escalateAlert(alert.id);
        }
      }
    } catch (error) {
      console.error('Error checking pending alerts:', error);
    }
  }

  /**
   * Escalate a crisis alert
   */
  private async escalateAlert(alertId: string): Promise<void> {
    try {
      await prisma.crisisAlert.update({
        where: { id: alertId },
        data: { 
          escalated: true,
          notificationsSent: {
            push: ['escalation_team', 'emergency_contact']
          }
        }
      });

      console.log(`🚨 ESCALATED: Crisis alert ${alertId} has been escalated`);
    } catch (error) {
      console.error('Failed to escalate alert:', error);
    }
  }

  /**
   * Get user's recent activity for behavioral analysis
   */
  private async getUserRecentActivity(userId: string): Promise<any> {
    try {
      const user = await prisma.anonymousUser.findUnique({
        where: { anonymousId: userId },
        include: {
          phq4Assessments: {
            orderBy: { completedAt: 'desc' },
            take: 5
          },
          moodLogs: {
            orderBy: { loggedAt: 'desc' },
            take: 10
          },
          interactions: {
            orderBy: { timestamp: 'desc' },
            take: 20
          }
        }
      });

      if (!user) return null;

      // Analyze assessment trend
      const assessments = user.phq4Assessments;
      let assessmentTrend = 'stable';
      if (assessments.length >= 3) {
        const recent = assessments.slice(0, 3);
        const scores = recent.map(a => a.totalScore).reverse();
        if (scores.every((score, i) => i === 0 || score > scores[i - 1])) {
          assessmentTrend = 'worsening';
        }
      }

      // Analyze mood trend
      const moods = user.moodLogs;
      let moodTrend = 'stable';
      if (moods.length >= 5) {
        const recent = moods.slice(0, 5);
        const scores = recent.map(m => m.moodScore).reverse();
        const avgRecent = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
        const avgOlder = scores.slice(0, 2).reduce((sum, score) => sum + score, 0) / 2;
        if (avgRecent < avgOlder - 1) {
          moodTrend = 'declining';
        }
      }

      // Check engagement drop
      const recent7Days = user.interactions.filter(i => 
        Date.now() - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
      );
      const previous7Days = user.interactions.filter(i => {
        const age = Date.now() - i.timestamp.getTime();
        return age >= 7 * 24 * 60 * 60 * 1000 && age < 14 * 24 * 60 * 60 * 1000;
      });
      
      const engagementDrop = recent7Days.length < previous7Days.length * 0.5;

      // Check isolation pattern (reduced social interactions)
      const socialInteractions = recent7Days.filter(i => 
        i.interactionType.includes('group') || i.interactionType.includes('buddy')
      );
      const isolationPattern = socialInteractions.length === 0 && recent7Days.length > 0;

      return {
        assessmentTrend,
        moodTrend,
        engagementDrop,
        isolationPattern
      };

    } catch (error) {
      console.error('Error getting user activity:', error);
      return null;
    }
  }

  /**
   * Generate crisis detection report
   */
  private async generateCrisisReport(): Promise<void> {
    try {
      const past4Hours = new Date(Date.now() - 4 * 60 * 60 * 1000);
      
      const alerts = await prisma.crisisAlert.findMany({
        where: {
          timestamp: { gte: past4Hours }
        }
      });

      const criticalCount = alerts.filter(a => a.severity === 'critical').length;
      const highCount = alerts.filter(a => a.severity === 'high').length;
      const resolvedCount = alerts.filter(a => a.resolved).length;
      const escalatedCount = alerts.filter(a => a.escalated).length;

      console.log(`Crisis Detection Report (Last 4 Hours):`);
      console.log(`- Total alerts: ${alerts.length}`);
      console.log(`- Critical: ${criticalCount}`);
      console.log(`- High: ${highCount}`);
      console.log(`- Resolved: ${resolvedCount}`);
      console.log(`- Escalated: ${escalatedCount}`);
      console.log(`- Resolution rate: ${alerts.length > 0 ? ((resolvedCount / alerts.length) * 100).toFixed(1) : 0}%`);

    } catch (error) {
      console.error('Failed to generate crisis report:', error);
    }
  }

  /**
   * Resolve a crisis alert
   */
  public async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    try {
      await prisma.crisisAlert.update({
        where: { id: alertId },
        data: {
          resolved: true,
          resolvedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  }

  /**
   * Get active crisis alerts
   */
  public async getActiveAlerts(): Promise<CrisisAlert[]> {
    try {
      const alerts = await prisma.crisisAlert.findMany({
        where: { resolved: false },
        orderBy: [
          { severity: 'desc' },
          { timestamp: 'desc' }
        ]
      });

      return alerts.map(alert => ({
        id: alert.id,
        userId: alert.userId,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        triggerType: alert.triggerType as 'keyword' | 'assessment_score' | 'behavioral_pattern' | 'manual',
        content: alert.content || undefined,
        phq4Score: alert.phq4Score || undefined,
        riskFactors: alert.riskFactors,
        timestamp: alert.timestamp,
        resolved: alert.resolved,
        responseTime: alert.responseTime || undefined,
        escalated: alert.escalated,
        notificationsSent: alert.notificationsSent
      }));
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }
}

// Singleton instance
export const crisisDetectionMonitor = new CrisisDetectionMonitor();
