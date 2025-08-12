/**
 * Error Tracking and Automated Reporting System
 * Comprehensive error monitoring, aggregation, and reporting
 */

import { ErrorMetrics, MonitoringAlert } from '@prisma/client';
import { prisma } from '../prisma';

interface ErrorPattern {
  pattern: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  recommendedAction: string;
}

interface ErrorReport {
  period: string;
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  topErrors: Array<{
    message: string;
    count: number;
    lastOccurred: Date;
  }>;
  trends: {
    errorRate: number;
    trending: 'up' | 'down' | 'stable';
  };
}

export class ErrorTrackingMonitor {
  private errorPatterns: ErrorPattern[] = [
    {
      pattern: 'database.*connection.*timeout',
      severity: 'critical',
      description: 'Database connection timeout',
      recommendedAction: 'Check database server status and connection pool settings'
    },
    {
      pattern: 'whatsapp.*api.*rate.*limit',
      severity: 'warning',
      description: 'WhatsApp API rate limit exceeded',
      recommendedAction: 'Implement rate limiting and request queuing'
    },
    {
      pattern: 'memory.*out.*of.*bounds',
      severity: 'critical',
      description: 'Memory allocation error',
      recommendedAction: 'Check for memory leaks and optimize memory usage'
    },
    {
      pattern: 'authentication.*failed',
      severity: 'error',
      description: 'Authentication failure',
      recommendedAction: 'Verify API keys and authentication configuration'
    },
    {
      pattern: 'validation.*error',
      severity: 'warning',
      description: 'Input validation error',
      recommendedAction: 'Review input validation rules and user input patterns'
    },
    {
      pattern: 'network.*unreachable',
      severity: 'error',
      description: 'Network connectivity issue',
      recommendedAction: 'Check network connectivity and DNS resolution'
    }
  ];

  private aggregationThresholds = {
    similarErrorWindow: 300000, // 5 minutes
    maxErrorRate: 10, // errors per minute
    criticalErrorThreshold: 5, // critical errors in 10 minutes
    reportingInterval: 3600000 // 1 hour
  };

  constructor() {
    // Generate error reports every hour
    setInterval(() => this.generateErrorReport(), this.aggregationThresholds.reportingInterval);
    
    // Check for error patterns every 5 minutes
    setInterval(() => this.analyzeErrorPatterns(), 300000);
    
    // Clean up old errors daily
    setInterval(() => this.cleanupOldErrors(), 24 * 60 * 60 * 1000);
  }

  /**
   * Log an error with automatic categorization and alerting
   */
  public async logError(errorData: {
    type: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    stack?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    tags?: string[];
    context?: any;
  }): Promise<ErrorMetrics> {
    try {
      // Check for existing similar errors
      const similarError = await this.findSimilarError(errorData);
      
      if (similarError) {
        // Increment count for existing error
        return await this.incrementErrorCount(similarError.id);
      } else {
        // Create new error record
        const errorRecord = await prisma.errorMetrics.create({
          data: {
            type: errorData.type,
            severity: errorData.severity,
            message: errorData.message,
            stack: errorData.stack,
            userId: errorData.userId,
            endpoint: errorData.endpoint,
            method: errorData.method,
            statusCode: errorData.statusCode,
            timestamp: new Date(),
            count: 1,
            resolved: false,
            tags: errorData.tags || []
          }
        });

        // Check for immediate alerts
        await this.checkErrorAlerts(errorRecord);
        
        console.log(`ERROR LOGGED: [${errorData.severity.toUpperCase()}] ${errorData.message}`);
        return errorRecord;
      }
    } catch (error) {
      console.error('Failed to log error:', error);
      throw error;
    }
  }

  /**
   * Find similar error within time window
   */
  private async findSimilarError(errorData: {
    type: string;
    message: string;
    endpoint?: string;
    method?: string;
  }): Promise<ErrorMetrics | null> {
    try {
      const timeWindow = new Date(Date.now() - this.aggregationThresholds.similarErrorWindow);
      
      return await prisma.errorMetrics.findFirst({
        where: {
          type: errorData.type,
          message: errorData.message,
          endpoint: errorData.endpoint,
          method: errorData.method,
          timestamp: { gte: timeWindow },
          resolved: false
        }
      });
    } catch (error) {
      console.error('Error finding similar error:', error);
      return null;
    }
  }

  /**
   * Increment count for existing error
   */
  private async incrementErrorCount(errorId: string): Promise<ErrorMetrics> {
    try {
      return await prisma.errorMetrics.update({
        where: { id: errorId },
        data: {
          count: { increment: 1 },
          timestamp: new Date() // Update to latest occurrence
        }
      });
    } catch (error) {
      console.error('Failed to increment error count:', error);
      throw error;
    }
  }

  /**
   * Check for error-based alerts
   */
  private async checkErrorAlerts(error: ErrorMetrics): Promise<void> {
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

    // Critical error immediate alert
    if (error.severity === 'critical') {
      alerts.push({
        alertId: `critical-error-${error.id}-${Date.now()}`,
        type: 'error',
        severity: 'critical',
        title: 'Critical Error Detected',
        description: `Critical error: ${error.message}`,
        metrics: error as any,
        threshold: 1,
        currentValue: error.count,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack', 'phone'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // High frequency error alert
    if (error.count >= 10) {
      alerts.push({
        alertId: `frequent-error-${error.id}-${Date.now()}`,
        type: 'error',
        severity: 'high',
        title: 'Frequent Error Pattern',
        description: `Error occurred ${error.count} times: ${error.message}`,
        metrics: error as any,
        threshold: 10,
        currentValue: error.count,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert);
    }
  }

  /**
   * Analyze error patterns and trends
   */
  private async analyzeErrorPatterns(): Promise<void> {
    try {
      const last10Minutes = new Date(Date.now() - 10 * 60 * 1000);
      
      const recentErrors = await prisma.errorMetrics.findMany({
        where: {
          timestamp: { gte: last10Minutes }
        }
      });

      if (recentErrors.length === 0) {
        return;
      }

      // Check error rate
      const errorRate = recentErrors.reduce((sum, error) => sum + error.count, 0) / 10; // per minute
      
      if (errorRate > this.aggregationThresholds.maxErrorRate) {
        await this.storeAlert({
          alertId: `high-error-rate-${Date.now()}`,
          type: 'error',
          severity: 'high',
          title: 'High Error Rate Detected',
          description: `Error rate (${errorRate.toFixed(1)}/min) exceeds threshold (${this.aggregationThresholds.maxErrorRate}/min)`,
          metrics: { errorRate, recentErrorCount: recentErrors.length } as any,
          threshold: this.aggregationThresholds.maxErrorRate,
          currentValue: errorRate,
          timestamp: new Date(),
          resolved: false,
          resolutionTime: null,
          notificationChannels: ['email', 'slack'],
          resolvedAt: null,
          resolvedBy: null
        });
      }

      // Check for pattern matches
      for (const pattern of this.errorPatterns) {
        const patternMatches = recentErrors.filter(error => 
          new RegExp(pattern.pattern, 'i').test(error.message)
        );

        if (patternMatches.length > 0) {
          const totalCount = patternMatches.reduce((sum, error) => sum + error.count, 0);
          
          await this.storeAlert({
            alertId: `pattern-match-${pattern.pattern}-${Date.now()}`,
            type: 'error',
            severity: pattern.severity,
            title: 'Error Pattern Detected',
            description: `${pattern.description} (${totalCount} occurrences). Recommendation: ${pattern.recommendedAction}`,
            metrics: { pattern: pattern.pattern, matches: patternMatches.length } as any,
            threshold: 1,
            currentValue: totalCount,
            timestamp: new Date(),
            resolved: false,
            resolutionTime: null,
            notificationChannels: pattern.severity === 'critical' ? ['email', 'slack', 'phone'] : ['email', 'slack'],
            resolvedAt: null,
            resolvedBy: null
          });
        }
      }

    } catch (error) {
      console.error('Failed to analyze error patterns:', error);
    }
  }

  /**
   * Generate comprehensive error report
   */
  private async generateErrorReport(hours: number = 24): Promise<ErrorReport> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const errors = await prisma.errorMetrics.findMany({
        where: {
          timestamp: { gte: cutoff }
        },
        orderBy: { count: 'desc' }
      });

      const totalErrors = errors.reduce((sum, error) => sum + error.count, 0);
      
      // Group by type
      const errorsByType: Record<string, number> = {};
      const errorsBySeverity: Record<string, number> = {};
      
      for (const error of errors) {
        errorsByType[error.type] = (errorsByType[error.type] || 0) + error.count;
        errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + error.count;
      }

      // Top errors
      const topErrors = errors.slice(0, 10).map(error => ({
        message: error.message,
        count: error.count,
        lastOccurred: error.timestamp
      }));

      // Calculate trend
      const halfwayPoint = new Date(Date.now() - (hours * 60 * 60 * 1000) / 2);
      const firstHalfErrors = errors.filter(e => e.timestamp < halfwayPoint);
      const secondHalfErrors = errors.filter(e => e.timestamp >= halfwayPoint);
      
      const firstHalfCount = firstHalfErrors.reduce((sum, e) => sum + e.count, 0);
      const secondHalfCount = secondHalfErrors.reduce((sum, e) => sum + e.count, 0);
      
      let trending: 'up' | 'down' | 'stable' = 'stable';
      if (secondHalfCount > firstHalfCount * 1.2) {
        trending = 'up';
      } else if (secondHalfCount < firstHalfCount * 0.8) {
        trending = 'down';
      }

      const report: ErrorReport = {
        period: `${hours} hours`,
        totalErrors,
        errorsByType,
        errorsBySeverity,
        topErrors,
        trends: {
          errorRate: totalErrors / hours,
          trending
        }
      };

      // Log report summary
      console.log(`\nError Report (Last ${hours} hours):`);
      console.log(`- Total Errors: ${totalErrors}`);
      console.log(`- Error Rate: ${report.trends.errorRate.toFixed(1)}/hour`);
      console.log(`- Trend: ${trending.toUpperCase()}`);
      console.log(`- Critical: ${errorsBySeverity.critical || 0}`);
      console.log(`- Errors: ${errorsBySeverity.error || 0}`);
      console.log(`- Warnings: ${errorsBySeverity.warning || 0}`);
      console.log(`- Info: ${errorsBySeverity.info || 0}`);

      if (topErrors.length > 0) {
        console.log(`Top Errors:`);
        topErrors.slice(0, 5).forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.message} (${error.count} times)`);
        });
      }

      return report;

    } catch (error) {
      console.error('Failed to generate error report:', error);
      throw error;
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

      console.log(`ERROR ALERT: ${alert.title} - ${alert.description}`);
    } catch (error) {
      console.error('Failed to store error alert:', error);
    }
  }

  /**
   * Resolve an error
   */
  public async resolveError(errorId: string, resolvedBy: string, resolutionNote?: string): Promise<boolean> {
    try {
      const startTime = Date.now();
      
      const updatedError = await prisma.errorMetrics.update({
        where: { id: errorId },
        data: {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy: resolvedBy
        }
      });

      const resolutionTime = Math.floor((Date.now() - updatedError.timestamp.getTime()) / (1000 * 60)); // minutes

      console.log(`Error ${errorId} resolved by ${resolvedBy} in ${resolutionTime} minutes`);
      return true;
    } catch (error) {
      console.error('Error resolving error:', error);
      return false;
    }
  }

  /**
   * Get error statistics
   */
  public async getErrorStatistics(hours: number = 24): Promise<any> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const totalErrors = await prisma.errorMetrics.count({
        where: { timestamp: { gte: cutoff } }
      });

      const resolvedErrors = await prisma.errorMetrics.count({
        where: { 
          timestamp: { gte: cutoff },
          resolved: true
        }
      });

      const criticalErrors = await prisma.errorMetrics.count({
        where: { 
          timestamp: { gte: cutoff },
          severity: 'critical'
        }
      });

      const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

      return {
        period: `${hours} hours`,
        totalErrors,
        resolvedErrors,
        criticalErrors,
        resolutionRate: resolutionRate.toFixed(1),
        errorRate: totalErrors / hours
      };
    } catch (error) {
      console.error('Error getting error statistics:', error);
      return null;
    }
  }

  /**
   * Clean up old resolved errors
   */
  private async cleanupOldErrors(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const deletedCount = await prisma.errorMetrics.deleteMany({
        where: {
          resolved: true,
          resolvedAt: { lt: cutoff }
        }
      });

      console.log(`Cleaned up ${deletedCount.count} old resolved errors`);
    } catch (error) {
      console.error('Failed to cleanup old errors:', error);
    }
  }

  /**
   * Get recent unresolved errors
   */
  public async getUnresolvedErrors(limit: number = 50): Promise<ErrorMetrics[]> {
    try {
      return await prisma.errorMetrics.findMany({
        where: { resolved: false },
        orderBy: [
          { severity: 'desc' },
          { count: 'desc' },
          { timestamp: 'desc' }
        ],
        take: limit
      });
    } catch (error) {
      console.error('Error getting unresolved errors:', error);
      return [];
    }
  }

  /**
   * Search errors by pattern
   */
  public async searchErrors(pattern: string, hours: number = 24): Promise<ErrorMetrics[]> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return await prisma.errorMetrics.findMany({
        where: {
          AND: [
            { timestamp: { gte: cutoff } },
            {
              OR: [
                { message: { contains: pattern, mode: 'insensitive' } },
                { stack: { contains: pattern, mode: 'insensitive' } }
              ]
            }
          ]
        },
        orderBy: { timestamp: 'desc' }
      });
    } catch (error) {
      console.error('Error searching errors:', error);
      return [];
    }
  }
}

// Singleton instance
export const errorTrackingMonitor = new ErrorTrackingMonitor();
