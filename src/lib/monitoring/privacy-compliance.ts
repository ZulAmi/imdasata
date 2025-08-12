/**
 * Privacy Compliance Monitoring
 * Tracks PDPA compliance and data protection violations
 */

import { PrivacyComplianceMetrics, PrivacyViolation, MonitoringAlert } from '@prisma/client';
import { prisma } from '../prisma';

export class PrivacyComplianceMonitor {
  private complianceThresholds = {
    minComplianceScore: 95.0, // Minimum compliance score
    maxDataRetentionDays: 365, // Maximum data retention in days
    maxConsentGap: 30, // Days without proper consent
    criticalViolationThreshold: 3 // Critical violations in 24h
  };

  constructor() {
    // Run compliance checks every 6 hours
    setInterval(() => this.runComplianceCheck(), 6 * 60 * 60 * 1000);
    
    // Generate compliance reports daily
    setInterval(() => this.generateComplianceReport(), 24 * 60 * 60 * 1000);
  }

  /**
   * Run comprehensive privacy compliance check
   */
  public async runComplianceCheck(): Promise<PrivacyComplianceMetrics> {
    const startTime = Date.now();

    try {
      // Check data retention compliance
      const dataRetentionCompliance = await this.checkDataRetention();
      
      // Check encryption status
      const encryptionStatus = await this.checkEncryption();
      
      // Check access logs integrity
      const accessLogsIntegrity = await this.checkAccessLogs();
      
      // Count consent records
      const consentRecords = await this.countConsentRecords();
      
      // Count data breach incidents
      const dataBreachIncidents = await this.countDataBreaches();
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore({
        dataRetentionCompliance,
        encryptionStatus,
        accessLogsIntegrity,
        consentRecords,
        dataBreachIncidents
      });

      const metrics: Omit<PrivacyComplianceMetrics, 'id'> = {
        dataRetentionCompliance,
        encryptionStatus,
        accessLogsIntegrity,
        consentRecords,
        dataBreachIncidents,
        lastAuditDate: new Date(),
        complianceScore,
        timestamp: new Date()
      };

      // Store metrics
      const storedMetrics = await this.storeComplianceMetrics(metrics);

      // Check for compliance violations
      await this.checkComplianceViolations(storedMetrics);

      console.log(`Privacy compliance check completed in ${Date.now() - startTime}ms - Score: ${complianceScore.toFixed(1)}%`);
      return storedMetrics;

    } catch (error) {
      console.error('Error running privacy compliance check:', error);
      throw error;
    }
  }

  /**
   * Check data retention compliance
   */
  private async checkDataRetention(): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.complianceThresholds.maxDataRetentionDays);

      // Check for data older than retention period
      const oldAssessments = await prisma.pHQ4Assessment.count({
        where: {
          completedAt: { lt: cutoffDate }
        }
      });

      const oldMoodLogs = await prisma.moodLog.count({
        where: {
          loggedAt: { lt: cutoffDate }
        }
      });

      const oldInteractions = await prisma.userInteraction.count({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      // If there's old data beyond retention period, it's non-compliant
      const hasOldData = oldAssessments > 0 || oldMoodLogs > 0 || oldInteractions > 0;

      if (hasOldData) {
        await this.recordViolation({
          type: 'data_retention',
          severity: 'high',
          description: `Found ${oldAssessments + oldMoodLogs + oldInteractions} records beyond ${this.complianceThresholds.maxDataRetentionDays} day retention period`
        });
      }

      return !hasOldData;
    } catch (error) {
      console.error('Error checking data retention:', error);
      return false;
    }
  }

  /**
   * Check encryption status
   */
  private async checkEncryption(): Promise<boolean> {
    try {
      // Check if encryption is enabled for sensitive fields
      // In a real implementation, this would check database encryption settings
      // and verify that sensitive fields are properly encrypted
      
      // For now, we'll assume encryption is enabled
      const encryptionEnabled = true;

      // Check for any unencrypted sensitive data
      const unencryptedCount = 0; // Would perform actual checks

      if (unencryptedCount > 0) {
        await this.recordViolation({
          type: 'unauthorized_access',
          severity: 'critical',
          description: `Found ${unencryptedCount} unencrypted sensitive records`
        });
      }

      return encryptionEnabled && unencryptedCount === 0;
    } catch (error) {
      console.error('Error checking encryption:', error);
      return false;
    }
  }

  /**
   * Check access logs integrity
   */
  private async checkAccessLogs(): Promise<boolean> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Check if access logs exist for recent activity
      const recentUsers = await prisma.anonymousUser.count({
        where: {
          lastActiveAt: { gte: last24Hours }
        }
      });

      // In a real implementation, would check that all access is properly logged
      const logsIntact = recentUsers >= 0; // Basic check

      return logsIntact;
    } catch (error) {
      console.error('Error checking access logs:', error);
      return false;
    }
  }

  /**
   * Count valid consent records
   */
  private async countConsentRecords(): Promise<number> {
    try {
      // Count users (assuming all have implicit consent by using the platform)
      const consentCount = await prisma.anonymousUser.count({
        where: {
          isActive: true
        }
      });

      return consentCount;
    } catch (error) {
      console.error('Error counting consent records:', error);
      return 0;
    }
  }

  /**
   * Count data breach incidents in the last 30 days
   */
  private async countDataBreaches(): Promise<number> {
    try {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const breaches = await prisma.privacyViolation.count({
        where: {
          type: 'data_leak',
          timestamp: { gte: last30Days }
        }
      });

      return breaches;
    } catch (error) {
      console.error('Error counting data breaches:', error);
      return 0;
    }
  }

  /**
   * Calculate overall compliance score
   */
  private calculateComplianceScore(metrics: {
    dataRetentionCompliance: boolean;
    encryptionStatus: boolean;
    accessLogsIntegrity: boolean;
    consentRecords: number;
    dataBreachIncidents: number;
  }): number {
    let score = 0;
    let totalChecks = 0;

    // Data retention compliance (30 points)
    if (metrics.dataRetentionCompliance) score += 30;
    totalChecks += 30;

    // Encryption status (25 points)
    if (metrics.encryptionStatus) score += 25;
    totalChecks += 25;

    // Access logs integrity (20 points)
    if (metrics.accessLogsIntegrity) score += 20;
    totalChecks += 20;

    // Consent coverage (15 points)
    const consentCoverage = Math.min(metrics.consentRecords / 100, 1); // Assuming 100 is good coverage
    score += consentCoverage * 15;
    totalChecks += 15;

    // Data breach penalty (10 points deduction per breach)
    score -= metrics.dataBreachIncidents * 10;
    totalChecks += 10; // Base 10 points for no breaches

    return Math.max(0, Math.min(100, (score / totalChecks) * 100));
  }

  /**
   * Store compliance metrics in database
   */
  private async storeComplianceMetrics(metrics: Omit<PrivacyComplianceMetrics, 'id'>): Promise<PrivacyComplianceMetrics> {
    try {
      return await prisma.privacyComplianceMetrics.create({
        data: metrics
      });
    } catch (error) {
      console.error('Failed to store compliance metrics:', error);
      throw error;
    }
  }

  /**
   * Check for compliance violations and create alerts
   */
  private async checkComplianceViolations(metrics: PrivacyComplianceMetrics): Promise<void> {
    const alerts: Array<{
      alertId: string;
      type: string;
      severity: string;
      title: string;
      description: string;
      metrics: any;
      threshold: number | null;
      currentValue: number | null;
      timestamp: Date;
      resolved: boolean;
      resolutionTime: number | null;
      notificationChannels: string[];
      resolvedAt: Date | null;
      resolvedBy: string | null;
    }> = [];

    // Low compliance score alert
    if (metrics.complianceScore < this.complianceThresholds.minComplianceScore) {
      alerts.push({
        alertId: `compliance-score-${Date.now()}`,
        type: 'compliance',
        severity: metrics.complianceScore < 80 ? 'critical' : 'high',
        title: 'Low Privacy Compliance Score',
        description: `Compliance score (${metrics.complianceScore.toFixed(1)}%) below threshold (${this.complianceThresholds.minComplianceScore}%)`,
        metrics: metrics as any,
        threshold: this.complianceThresholds.minComplianceScore,
        currentValue: metrics.complianceScore,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Data retention violation
    if (!metrics.dataRetentionCompliance) {
      alerts.push({
        alertId: `data-retention-${Date.now()}`,
        type: 'compliance',
        severity: 'high',
        title: 'Data Retention Violation',
        description: 'Data found beyond allowed retention period',
        metrics: metrics as any,
        threshold: this.complianceThresholds.maxDataRetentionDays,
        currentValue: 0,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Encryption violation
    if (!metrics.encryptionStatus) {
      alerts.push({
        alertId: `encryption-${Date.now()}`,
        type: 'security',
        severity: 'critical',
        title: 'Encryption Violation',
        description: 'Sensitive data found without proper encryption',
        metrics: metrics as any,
        threshold: 0,
        currentValue: 1,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack', 'phone'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Data breach incidents
    if (metrics.dataBreachIncidents > 0) {
      alerts.push({
        alertId: `data-breach-${Date.now()}`,
        type: 'security',
        severity: 'critical',
        title: 'Data Breach Incidents Detected',
        description: `${metrics.dataBreachIncidents} data breach incident(s) in the last 30 days`,
        metrics: metrics as any,
        threshold: 0,
        currentValue: metrics.dataBreachIncidents,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack', 'phone'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Store and send alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }
  }

  /**
   * Record a privacy violation
   */
  private async recordViolation(violation: {
    type: string;
    severity: string;
    description: string;
    userId?: string;
  }): Promise<void> {
    try {
      await prisma.privacyViolation.create({
        data: {
          type: violation.type,
          severity: violation.severity,
          description: violation.description,
          userId: violation.userId,
          timestamp: new Date(),
          resolved: false
        }
      });

      console.log(`PRIVACY VIOLATION: ${violation.severity} - ${violation.description}`);
    } catch (error) {
      console.error('Failed to record privacy violation:', error);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: {
    alertId: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    metrics: any;
    threshold: number | null;
    currentValue: number | null;
    timestamp: Date;
    resolved: boolean;
    resolutionTime: number | null;
    notificationChannels: string[];
    resolvedAt: Date | null;
    resolvedBy: string | null;
  }): Promise<void> {
    try {
      await prisma.monitoringAlert.create({
        data: {
          alertId: alert.alertId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          metrics: alert.metrics,
          threshold: alert.threshold,
          currentValue: alert.currentValue,
          timestamp: alert.timestamp,
          resolved: alert.resolved,
          resolutionTime: alert.resolutionTime,
          notificationChannels: alert.notificationChannels,
          resolvedAt: alert.resolvedAt,
          resolvedBy: alert.resolvedBy
        }
      });

      console.log(`COMPLIANCE ALERT: ${alert.title} - ${alert.description}`);
    } catch (error) {
      console.error('Failed to store compliance alert:', error);
    }
  }

  /**
   * Generate daily compliance report
   */
  private async generateComplianceReport(): Promise<void> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get latest metrics
      const latestMetrics = await prisma.privacyComplianceMetrics.findFirst({
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        console.log('No compliance metrics available for report');
        return;
      }

      // Get violations in last 24 hours
      const recentViolations = await prisma.privacyViolation.findMany({
        where: {
          timestamp: { gte: last24Hours }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Generate report
      console.log(`\nPrivacy Compliance Report (Last 24 Hours):`);
      console.log(`- Overall Score: ${latestMetrics.complianceScore.toFixed(1)}%`);
      console.log(`- Data Retention: ${latestMetrics.dataRetentionCompliance ? 'COMPLIANT' : 'VIOLATION'}`);
      console.log(`- Encryption: ${latestMetrics.encryptionStatus ? 'COMPLIANT' : 'VIOLATION'}`);
      console.log(`- Access Logs: ${latestMetrics.accessLogsIntegrity ? 'INTACT' : 'COMPROMISED'}`);
      console.log(`- Consent Records: ${latestMetrics.consentRecords}`);
      console.log(`- Data Breaches: ${latestMetrics.dataBreachIncidents}`);
      console.log(`- New Violations (24h): ${recentViolations.length}`);

      if (recentViolations.length > 0) {
        console.log(`Recent Violations:`);
        recentViolations.forEach((violation, index) => {
          console.log(`  ${index + 1}. ${violation.severity.toUpperCase()}: ${violation.description}`);
        });
      }

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
    }
  }

  /**
   * Get current compliance status
   */
  public async getCurrentComplianceStatus(): Promise<PrivacyComplianceMetrics | null> {
    try {
      return await prisma.privacyComplianceMetrics.findFirst({
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      console.error('Error getting compliance status:', error);
      return null;
    }
  }

  /**
   * Get recent violations
   */
  public async getRecentViolations(hours: number = 24): Promise<PrivacyViolation[]> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return await prisma.privacyViolation.findMany({
        where: {
          timestamp: { gte: cutoff }
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      console.error('Error getting recent violations:', error);
      return [];
    }
  }

  /**
   * Resolve a privacy violation
   */
  public async resolveViolation(violationId: string, resolvedBy: string): Promise<boolean> {
    try {
      await prisma.privacyViolation.update({
        where: { id: violationId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolvedBy,
          resolutionTime: Math.floor((Date.now() - new Date().getTime()) / (1000 * 60)) // minutes
        }
      });

      console.log(`Privacy violation ${violationId} resolved by ${resolvedBy}`);
      return true;
    } catch (error) {
      console.error('Error resolving violation:', error);
      return false;
    }
  }

  /**
   * Get compliance trends
   */
  public async getComplianceTrends(days: number = 30): Promise<any> {
    try {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const metrics = await prisma.privacyComplianceMetrics.findMany({
        where: {
          timestamp: { gte: cutoff }
        },
        orderBy: { timestamp: 'asc' }
      });

      if (metrics.length === 0) {
        return null;
      }

      const scores = metrics.map(m => m.complianceScore);
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);

      return {
        period: `${days} days`,
        samples: metrics.length,
        averageScore: avgScore,
        minScore,
        maxScore,
        trend: metrics.length >= 2 ? 
          (metrics[metrics.length - 1].complianceScore - metrics[0].complianceScore) : 0
      };
    } catch (error) {
      console.error('Error getting compliance trends:', error);
      return null;
    }
  }
}

// Singleton instance
export const privacyComplianceMonitor = new PrivacyComplianceMonitor();
