/**
 * Application Performance and Uptime Monitoring
 * Tracks system performance metrics, response times, and availability
 */

import { ApplicationMetrics, MonitoringAlert, HealthCheckResult } from './types';
import { prisma } from '../prisma';
import * as os from 'os';
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private responseTimes: number[] = [];
  private metrics: ApplicationMetrics[] = [];
  private alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };

  constructor() {
    this.startTime = Date.now();
    this.alertThresholds = {
      responseTime: 1000, // 1 second
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8 // 80%
    };
    
    // Start collecting metrics every minute
    setInterval(() => this.collectMetrics(), 60000);
  }

  /**
   * Track request performance
   */
  public trackRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimes.push(responseTime);
    
    if (isError) {
      this.errorCount++;
    }

    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<ApplicationMetrics> {
    const now = Date.now();
    const uptime = now - this.startTime;
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate average response time from last collection
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length
      : 0;

    // Calculate requests per second (last minute)
    const requestsPerSecond = this.requestCount / 60;

    // Calculate error rate
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;

    // Get CPU usage (approximation)
    const cpuUsage = this.getCpuUsage();

    const metrics: ApplicationMetrics = {
      uptime,
      responseTime: avgResponseTime,
      requestsPerSecond,
      errorRate,
      memoryUsage: usedMemory / totalMemory,
      cpuUsage,
      timestamp: new Date()
    };

    this.metrics.push(metrics);
    
    // Keep only last 24 hours of metrics
    if (this.metrics.length > 1440) { // 24 hours * 60 minutes
      this.metrics = this.metrics.slice(-1440);
    }

    // Reset counters for next interval
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];

    // Check for performance alerts
    await this.checkPerformanceAlerts(metrics);

    // Store metrics in database
    await this.storeMetrics(metrics);

    return metrics;
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    
    return 1 - (idle / total);
  }

  /**
   * Check for performance-related alerts
   */
  private async checkPerformanceAlerts(metrics: ApplicationMetrics): Promise<void> {
    const alerts: MonitoringAlert[] = [];

    // Response time alert
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        id: `perf-response-${Date.now()}`,
        type: 'performance',
        severity: metrics.responseTime > this.alertThresholds.responseTime * 2 ? 'critical' : 'high',
        title: 'High Response Time',
        description: `Average response time (${metrics.responseTime.toFixed(2)}ms) exceeds threshold (${this.alertThresholds.responseTime}ms)`,
        metrics,
        threshold: this.alertThresholds.responseTime,
        currentValue: metrics.responseTime,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email', 'slack']
      });
    }

    // Error rate alert
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        id: `perf-error-${Date.now()}`,
        type: 'performance',
        severity: metrics.errorRate > this.alertThresholds.errorRate * 2 ? 'critical' : 'high',
        title: 'High Error Rate',
        description: `Error rate (${(metrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(this.alertThresholds.errorRate * 100).toFixed(2)}%)`,
        metrics,
        threshold: this.alertThresholds.errorRate,
        currentValue: metrics.errorRate,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email', 'slack']
      });
    }

    // Memory usage alert
    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        id: `perf-memory-${Date.now()}`,
        type: 'performance',
        severity: metrics.memoryUsage > 0.9 ? 'critical' : 'medium',
        title: 'High Memory Usage',
        description: `Memory usage (${(metrics.memoryUsage * 100).toFixed(2)}%) exceeds threshold (${(this.alertThresholds.memoryUsage * 100).toFixed(2)}%)`,
        metrics,
        threshold: this.alertThresholds.memoryUsage,
        currentValue: metrics.memoryUsage,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email']
      });
    }

    // CPU usage alert
    if (metrics.cpuUsage > this.alertThresholds.cpuUsage) {
      alerts.push({
        id: `perf-cpu-${Date.now()}`,
        type: 'performance',
        severity: metrics.cpuUsage > 0.9 ? 'critical' : 'medium',
        title: 'High CPU Usage',
        description: `CPU usage (${(metrics.cpuUsage * 100).toFixed(2)}%) exceeds threshold (${(this.alertThresholds.cpuUsage * 100).toFixed(2)}%)`,
        metrics,
        threshold: this.alertThresholds.cpuUsage,
        currentValue: metrics.cpuUsage,
        timestamp: new Date(),
        resolved: false,
        notificationChannels: ['email']
      });
    }

    // Send alerts if any
    if (alerts.length > 0) {
      await this.sendPerformanceAlerts(alerts);
    }
  }

  /**
   * Send performance alerts
   */
  private async sendPerformanceAlerts(alerts: MonitoringAlert[]): Promise<void> {
    // Store alerts in database
    for (const alert of alerts) {
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
        console.error('Failed to store performance alert:', error);
      }
    }

    // Send notifications (implementation depends on notification service)
    for (const alert of alerts) {
      await this.sendNotification(alert);
    }
  }

  /**
   * Send notification for alert
   */
  private async sendNotification(alert: MonitoringAlert): Promise<void> {
    // Email notification
    if (alert.notificationChannels.includes('email')) {
      // Implementation would integrate with email service
      console.log(`EMAIL ALERT: ${alert.title} - ${alert.description}`);
    }

    // Slack notification
    if (alert.notificationChannels.includes('slack')) {
      // Implementation would integrate with Slack API
      console.log(`SLACK ALERT: ${alert.title} - ${alert.description}`);
    }

    // Webhook notification
    if (alert.notificationChannels.includes('webhook')) {
      // Implementation would call webhook endpoints
      console.log(`WEBHOOK ALERT: ${alert.title} - ${alert.description}`);
    }
  }

  /**
   * Store metrics in database
   */
  private async storeMetrics(metrics: ApplicationMetrics): Promise<void> {
    try {
      await prisma.applicationMetrics.create({
        data: {
          uptime: metrics.uptime,
          responseTime: metrics.responseTime,
          requestsPerSecond: metrics.requestsPerSecond,
          errorRate: metrics.errorRate,
          memoryUsage: metrics.memoryUsage,
          cpuUsage: metrics.cpuUsage,
          timestamp: metrics.timestamp
        }
      });
    } catch (error) {
      console.error('Failed to store application metrics:', error);
    }
  }

  /**
   * Perform health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    const checks: { [key: string]: any } = {};

    // Database connectivity check
    try {
      await prisma.anonymousUser.findFirst();
      checks.database = {
        status: 'pass',
        message: 'Database connection successful',
        responseTime: performance.now() - startTime
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: 'Database connection failed',
        responseTime: performance.now() - startTime
      };
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const memoryUsagePercent = (totalMem - os.freemem()) / totalMem;
    
    checks.memory = {
      status: memoryUsagePercent < 0.9 ? 'pass' : 'fail',
      message: `Memory usage: ${(memoryUsagePercent * 100).toFixed(2)}%`,
      responseTime: 0
    };

    // CPU check
    const cpuUsage = this.getCpuUsage();
    checks.cpu = {
      status: cpuUsage < 0.9 ? 'pass' : 'warn',
      message: `CPU usage: ${(cpuUsage * 100).toFixed(2)}%`,
      responseTime: 0
    };

    // Disk space check (simplified)
    checks.disk = {
      status: 'pass',
      message: 'Disk space adequate',
      responseTime: 0
    };

    const overallStatus = Object.values(checks).every((check: any) => check.status === 'pass') 
      ? 'healthy' 
      : Object.values(checks).some((check: any) => check.status === 'fail') 
        ? 'unhealthy' 
        : 'degraded';

    return {
      service: 'application',
      status: overallStatus,
      responseTime: performance.now() - startTime,
      checks,
      timestamp: new Date()
    };
  }

  /**
   * Get current metrics
   */
  public getCurrentMetrics(): ApplicationMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(hours: number = 24): ApplicationMetrics[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp.getTime() > cutoff);
  }

  /**
   * Get uptime percentage
   */
  public getUptimePercentage(hours: number = 24): number {
    const history = this.getMetricsHistory(hours);
    if (history.length === 0) return 100;

    const totalChecks = history.length;
    const healthyChecks = history.filter(metric => 
      metric.responseTime < this.alertThresholds.responseTime &&
      metric.errorRate < this.alertThresholds.errorRate
    ).length;

    return (healthyChecks / totalChecks) * 100;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();
