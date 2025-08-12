/**
 * Central Monitoring Dashboard
 * Integrates all monitoring systems into a unified interface
 */

import { performanceMonitor } from './performance';
import { engagementMonitor } from './engagement';
import { crisisDetectionMonitor } from './crisis-detection';
import { systemResourceMonitor } from './system-resources';
import { privacyComplianceMonitor } from './privacy-compliance';
import { integrationHealthMonitor } from './integration-health';
import { errorTrackingMonitor } from './error-tracking';
import { prisma } from '../prisma';

interface DashboardMetrics {
  timestamp: Date;
  application: {
    status: string;
    uptime: number;
    responseTime: number;
    errorRate: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    databasePerformance: number;
  };
  users: {
    activeUsers: number;
    engagementScore: number;
    satisfactionScore: number;
    churnRisk: number;
  };
  compliance: {
    score: number;
    violations: number;
    lastAudit: Date;
  };
  integrations: {
    healthyServices: number;
    totalServices: number;
    avgResponseTime: number;
  };
  errors: {
    totalToday: number;
    criticalErrors: number;
    resolutionRate: number;
  };
  alerts: {
    active: number;
    critical: number;
    recent: number;
  };
}

interface AlertSummary {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export class MonitoringDashboard {
  private refreshInterval: NodeJS.Timeout | null = null;
  private dashboardMetrics: DashboardMetrics | null = null;

  constructor() {
    // Auto-refresh dashboard every 30 seconds
    this.startAutoRefresh();
  }

  /**
   * Start automatic dashboard refresh
   */
  public startAutoRefresh(intervalMs: number = 30000): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    this.refreshInterval = setInterval(async () => {
      try {
        await this.refreshDashboard();
      } catch (error) {
        console.error('Dashboard refresh failed:', error);
      }
    }, intervalMs);

    console.log(`Dashboard auto-refresh started (${intervalMs / 1000}s interval)`);
  }

  /**
   * Stop automatic refresh
   */
  public stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Dashboard auto-refresh stopped');
    }
  }

  /**
   * Refresh all dashboard metrics
   */
  public async refreshDashboard(): Promise<DashboardMetrics> {
    try {
      const startTime = Date.now();

      // Collect metrics from all monitoring systems
      const [
        appMetrics,
        systemMetrics,
        userMetrics,
        complianceMetrics,
        integrationStatuses,
        errorStats,
        alertSummary
      ] = await Promise.all([
        this.getApplicationMetrics(),
        this.getSystemMetrics(),
        this.getUserMetrics(),
        this.getComplianceMetrics(),
        this.getIntegrationMetrics(),
        this.getErrorMetrics(),
        this.getAlertMetrics()
      ]);

      this.dashboardMetrics = {
        timestamp: new Date(),
        application: appMetrics,
        system: systemMetrics,
        users: userMetrics,
        compliance: complianceMetrics,
        integrations: integrationStatuses,
        errors: errorStats,
        alerts: alertSummary
      };

      const refreshTime = Date.now() - startTime;
      console.log(`Dashboard refreshed in ${refreshTime}ms`);

      return this.dashboardMetrics;
    } catch (error) {
      console.error('Failed to refresh dashboard:', error);
      throw error;
    }
  }

  /**
   * Get current dashboard metrics
   */
  public getCurrentMetrics(): DashboardMetrics | null {
    return this.dashboardMetrics;
  }

  /**
   * Get application performance metrics
   */
  private async getApplicationMetrics(): Promise<DashboardMetrics['application']> {
    try {
      const currentMetrics = performanceMonitor.getCurrentMetrics();
      const uptimePercent = performanceMonitor.getUptimePercentage(24);
      
      return {
        status: currentMetrics ? 'healthy' : 'unknown',
        uptime: uptimePercent,
        responseTime: currentMetrics?.responseTime || 0,
        errorRate: currentMetrics?.errorRate || 0
      };
    } catch (error) {
      return {
        status: 'error',
        uptime: 0,
        responseTime: 0,
        errorRate: 1
      };
    }
  }

  /**
   * Get system resource metrics
   */
  private async getSystemMetrics(): Promise<DashboardMetrics['system']> {
    try {
      const currentResources = systemResourceMonitor.getCurrentResourceStatus();
      
      return {
        cpuUsage: currentResources?.cpuUsage || 0,
        memoryUsage: currentResources?.memoryUsage || 0,
        diskUsage: currentResources?.diskUsage || 0,
        databasePerformance: currentResources?.databaseQueryTime || 0
      };
    } catch (error) {
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        diskUsage: 0,
        databasePerformance: 0
      };
    }
  }

  /**
   * Get user engagement metrics
   */
  private async getUserMetrics(): Promise<DashboardMetrics['users']> {
    try {
      // Get basic user counts from database
      const activeUsers = await prisma.anonymousUser.count({
        where: { isActive: true }
      });

      // For now, return basic metrics - would be enhanced with actual engagement data
      return {
        activeUsers,
        engagementScore: 7.5, // Would calculate from actual engagement data
        satisfactionScore: 8.0, // Would calculate from satisfaction surveys
        churnRisk: 15.0 // Would calculate from user behavior patterns
      };
    } catch (error) {
      return {
        activeUsers: 0,
        engagementScore: 0,
        satisfactionScore: 0,
        churnRisk: 0
      };
    }
  }

  /**
   * Get compliance metrics
   */
  private async getComplianceMetrics(): Promise<DashboardMetrics['compliance']> {
    try {
      const complianceStatus = await privacyComplianceMonitor.getCurrentComplianceStatus();
      const recentViolations = await privacyComplianceMonitor.getRecentViolations(24);
      
      return {
        score: complianceStatus?.complianceScore || 0,
        violations: recentViolations.length,
        lastAudit: complianceStatus?.lastAuditDate || new Date()
      };
    } catch (error) {
      return {
        score: 0,
        violations: 0,
        lastAudit: new Date()
      };
    }
  }

  /**
   * Get integration health metrics
   */
  private async getIntegrationMetrics(): Promise<DashboardMetrics['integrations']> {
    try {
      const serviceStatuses = await integrationHealthMonitor.getCurrentServiceStatuses();
      
      const healthyServices = serviceStatuses.filter(s => s.status === 'healthy').length;
      const totalServices = serviceStatuses.length;
      const avgResponseTime = serviceStatuses.length > 0 
        ? serviceStatuses.reduce((sum, s) => sum + s.responseTime, 0) / serviceStatuses.length
        : 0;
      
      return {
        healthyServices,
        totalServices,
        avgResponseTime
      };
    } catch (error) {
      return {
        healthyServices: 0,
        totalServices: 0,
        avgResponseTime: 0
      };
    }
  }

  /**
   * Get error tracking metrics
   */
  private async getErrorMetrics(): Promise<DashboardMetrics['errors']> {
    try {
      const errorStats = await errorTrackingMonitor.getErrorStatistics(24);
      
      return {
        totalToday: errorStats?.totalErrors || 0,
        criticalErrors: errorStats?.criticalErrors || 0,
        resolutionRate: parseFloat(errorStats?.resolutionRate || '0')
      };
    } catch (error) {
      return {
        totalToday: 0,
        criticalErrors: 0,
        resolutionRate: 0
      };
    }
  }

  /**
   * Get alert summary metrics
   */
  private async getAlertMetrics(): Promise<DashboardMetrics['alerts']> {
    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const activeAlerts = await prisma.monitoringAlert.count({
        where: { resolved: false }
      });

      const criticalAlerts = await prisma.monitoringAlert.count({
        where: { 
          resolved: false,
          severity: 'critical'
        }
      });

      const recentAlerts = await prisma.monitoringAlert.count({
        where: { 
          timestamp: { gte: last24Hours }
        }
      });

      return {
        active: activeAlerts,
        critical: criticalAlerts,
        recent: recentAlerts
      };
    } catch (error) {
      return {
        active: 0,
        critical: 0,
        recent: 0
      };
    }
  }

  /**
   * Get recent alerts for dashboard
   */
  public async getRecentAlerts(limit: number = 10): Promise<AlertSummary[]> {
    try {
      const alerts = await prisma.monitoringAlert.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          type: true,
          severity: true,
          title: true,
          description: true,
          timestamp: true,
          resolved: true
        }
      });

      return alerts;
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  /**
   * Get system health overview
   */
  public async getSystemHealthOverview(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const metrics = this.dashboardMetrics || await this.refreshDashboard();
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check application health
      if (metrics.application.errorRate > 0.05) {
        issues.push(`High error rate: ${(metrics.application.errorRate * 100).toFixed(1)}%`);
        recommendations.push('Investigate error patterns and fix critical issues');
      }

      if (metrics.application.responseTime > 2000) {
        issues.push(`Slow response time: ${metrics.application.responseTime.toFixed(0)}ms`);
        recommendations.push('Optimize application performance and database queries');
      }

      // Check system resources
      if (metrics.system.cpuUsage > 80) {
        issues.push(`High CPU usage: ${metrics.system.cpuUsage.toFixed(1)}%`);
        recommendations.push('Scale up CPU resources or optimize CPU-intensive processes');
      }

      if (metrics.system.memoryUsage > 85) {
        issues.push(`High memory usage: ${metrics.system.memoryUsage.toFixed(1)}%`);
        recommendations.push('Investigate memory leaks and optimize memory usage');
      }

      // Check compliance
      if (metrics.compliance.score < 95) {
        issues.push(`Low compliance score: ${metrics.compliance.score.toFixed(1)}%`);
        recommendations.push('Address privacy compliance violations immediately');
      }

      // Check integrations
      const integrationHealth = metrics.integrations.healthyServices / metrics.integrations.totalServices;
      if (integrationHealth < 0.8) {
        issues.push(`Integration services degraded: ${metrics.integrations.healthyServices}/${metrics.integrations.totalServices} healthy`);
        recommendations.push('Check external service connections and API configurations');
      }

      // Check alerts
      if (metrics.alerts.critical > 0) {
        issues.push(`${metrics.alerts.critical} critical alerts active`);
        recommendations.push('Address critical alerts immediately');
      }

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
      
      if (metrics.alerts.critical > 0 || metrics.compliance.score < 80 || metrics.application.errorRate > 0.1) {
        status = 'critical';
      } else if (issues.length > 0) {
        status = 'degraded';
      }

      return {
        status,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Failed to get system health overview:', error);
      return {
        status: 'critical',
        issues: ['Unable to determine system health'],
        recommendations: ['Check monitoring system configuration']
      };
    }
  }

  /**
   * Generate comprehensive monitoring report
   */
  public async generateMonitoringReport(): Promise<string> {
    try {
      const metrics = await this.refreshDashboard();
      const healthOverview = await this.getSystemHealthOverview();
      const recentAlerts = await this.getRecentAlerts(5);

      let report = `\n=== SATA MONITORING DASHBOARD REPORT ===\n`;
      report += `Generated: ${new Date().toISOString()}\n\n`;

      // System Health Overview
      report += `🔍 SYSTEM HEALTH: ${healthOverview.status.toUpperCase()}\n`;
      if (healthOverview.issues.length > 0) {
        report += `Issues Detected:\n`;
        healthOverview.issues.forEach(issue => report += `  ⚠️  ${issue}\n`);
      }
      if (healthOverview.recommendations.length > 0) {
        report += `Recommendations:\n`;
        healthOverview.recommendations.forEach(rec => report += `  💡 ${rec}\n`);
      }

      // Application Performance
      report += `\n📊 APPLICATION PERFORMANCE\n`;
      report += `  Status: ${metrics.application.status.toUpperCase()}\n`;
      report += `  Uptime: ${metrics.application.uptime.toFixed(2)}%\n`;
      report += `  Response Time: ${metrics.application.responseTime.toFixed(0)}ms\n`;
      report += `  Error Rate: ${(metrics.application.errorRate * 100).toFixed(2)}%\n`;

      // System Resources
      report += `\n💻 SYSTEM RESOURCES\n`;
      report += `  CPU Usage: ${metrics.system.cpuUsage.toFixed(1)}%\n`;
      report += `  Memory Usage: ${metrics.system.memoryUsage.toFixed(1)}%\n`;
      report += `  Disk Usage: ${metrics.system.diskUsage.toFixed(1)}%\n`;
      report += `  DB Performance: ${metrics.system.databasePerformance.toFixed(0)}ms\n`;

      // User Engagement
      report += `\n👥 USER ENGAGEMENT\n`;
      report += `  Active Users: ${metrics.users.activeUsers}\n`;
      report += `  Engagement Score: ${metrics.users.engagementScore.toFixed(1)}/10\n`;
      report += `  Satisfaction Score: ${metrics.users.satisfactionScore.toFixed(1)}/10\n`;
      report += `  Churn Risk: ${metrics.users.churnRisk.toFixed(1)}%\n`;

      // Privacy Compliance
      report += `\n🔒 PRIVACY COMPLIANCE\n`;
      report += `  Compliance Score: ${metrics.compliance.score.toFixed(1)}%\n`;
      report += `  Recent Violations: ${metrics.compliance.violations}\n`;
      report += `  Last Audit: ${metrics.compliance.lastAudit.toISOString().split('T')[0]}\n`;

      // Integration Health
      report += `\n🔗 INTEGRATION SERVICES\n`;
      report += `  Healthy Services: ${metrics.integrations.healthyServices}/${metrics.integrations.totalServices}\n`;
      report += `  Avg Response Time: ${metrics.integrations.avgResponseTime.toFixed(0)}ms\n`;

      // Error Tracking
      report += `\n🚨 ERROR TRACKING\n`;
      report += `  Total Errors (24h): ${metrics.errors.totalToday}\n`;
      report += `  Critical Errors: ${metrics.errors.criticalErrors}\n`;
      report += `  Resolution Rate: ${metrics.errors.resolutionRate}%\n`;

      // Active Alerts
      report += `\n⚠️  ALERTS SUMMARY\n`;
      report += `  Active Alerts: ${metrics.alerts.active}\n`;
      report += `  Critical Alerts: ${metrics.alerts.critical}\n`;
      report += `  Recent Alerts (24h): ${metrics.alerts.recent}\n`;

      if (recentAlerts.length > 0) {
        report += `\nRecent Alerts:\n`;
        recentAlerts.forEach(alert => {
          const status = alert.resolved ? '✅' : '🔴';
          report += `  ${status} [${alert.severity.toUpperCase()}] ${alert.title}\n`;
        });
      }

      report += `\n=== END OF REPORT ===\n`;

      console.log(report);
      return report;

    } catch (error) {
      console.error('Failed to generate monitoring report:', error);
      return 'Failed to generate monitoring report';
    }
  }

  /**
   * Cleanup dashboard resources
   */
  public cleanup(): void {
    this.stopAutoRefresh();
    console.log('Monitoring dashboard cleaned up');
  }
}

// Singleton instance
export const monitoringDashboard = new MonitoringDashboard();
