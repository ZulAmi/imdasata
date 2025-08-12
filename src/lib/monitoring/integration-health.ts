/**
 * Integration Service Health Monitoring
 * Tracks health of external APIs and services
 */

import { IntegrationHealth, EndpointHealth, MonitoringAlert } from '@prisma/client';
import { prisma } from '../prisma';

interface ServiceConfig {
  name: string;
  baseUrl: string;
  endpoints: Array<{
    path: string;
    method: string;
    expectedStatus: number;
    timeout: number;
  }>;
  healthCheckInterval: number; // in milliseconds
}

export class IntegrationHealthMonitor {
  private services: ServiceConfig[] = [
    {
      name: 'WhatsApp Business API',
      baseUrl: 'https://graph.facebook.com/v18.0',
      endpoints: [
        { path: '/health', method: 'GET', expectedStatus: 200, timeout: 5000 },
        { path: '/me', method: 'GET', expectedStatus: 200, timeout: 3000 }
      ],
      healthCheckInterval: 60000 // 1 minute
    },
    {
      name: 'Email Service',
      baseUrl: process.env.EMAIL_SERVICE_URL || 'https://api.emailservice.com',
      endpoints: [
        { path: '/health', method: 'GET', expectedStatus: 200, timeout: 5000 },
        { path: '/api/v1/status', method: 'GET', expectedStatus: 200, timeout: 3000 }
      ],
      healthCheckInterval: 120000 // 2 minutes
    },
    {
      name: 'SMS Service',
      baseUrl: process.env.SMS_SERVICE_URL || 'https://api.smsservice.com',
      endpoints: [
        { path: '/health', method: 'GET', expectedStatus: 200, timeout: 5000 },
        { path: '/v1/status', method: 'GET', expectedStatus: 200, timeout: 3000 }
      ],
      healthCheckInterval: 120000 // 2 minutes
    },
    {
      name: 'Translation Service',
      baseUrl: 'https://api.cognitive.microsofttranslator.com',
      endpoints: [
        { path: '/detect?api-version=3.0', method: 'POST', expectedStatus: 200, timeout: 5000 }
      ],
      healthCheckInterval: 300000 // 5 minutes
    }
  ];

  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alertThresholds = {
    maxResponseTime: 5000, // 5 seconds
    maxErrorRate: 0.1, // 10%
    minUptime: 95.0 // 95%
  };

  constructor() {
    this.initializeHealthChecks();
    
    // Generate integration health reports every hour
    setInterval(() => this.generateIntegrationReport(), 3600000);
  }

  /**
   * Initialize health checks for all services
   */
  private initializeHealthChecks(): void {
    for (const service of this.services) {
      this.startHealthCheck(service);
    }
    
    console.log(`Initialized health checks for ${this.services.length} integration services`);
  }

  /**
   * Start health check for a specific service
   */
  private startHealthCheck(service: ServiceConfig): void {
    // Run immediate check
    this.checkServiceHealth(service);
    
    // Schedule recurring checks
    const interval = setInterval(() => {
      this.checkServiceHealth(service);
    }, service.healthCheckInterval);
    
    this.healthCheckIntervals.set(service.name, interval);
  }

  /**
   * Check health of a specific service
   */
  public async checkServiceHealth(service: ServiceConfig): Promise<IntegrationHealth> {
    const startTime = Date.now();
    let totalResponseTime = 0;
    let successCount = 0;
    let errorCount = 0;
    const endpointResults: Array<{
      serviceName: string;
      url: string;
      method: string;
      status: number;
      responseTime: number;
      lastChecked: Date;
      errorCount: number;
      successCount: number;
      timestamp: Date;
    }> = [];

    try {
      // Check each endpoint
      for (const endpoint of service.endpoints) {
        const endpointResult = await this.checkEndpoint(service, endpoint);
        endpointResults.push({
          serviceName: service.name,
          ...endpointResult
        });
        
        totalResponseTime += endpointResult.responseTime;
        
        if (endpointResult.status >= 200 && endpointResult.status < 300) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      const avgResponseTime = totalResponseTime / service.endpoints.length;
      const errorRate = errorCount / (successCount + errorCount);
      const status = this.determineServiceStatus(avgResponseTime, errorRate);

      // Calculate uptime (simplified - would track over time in production)
      const uptime = errorRate === 0 ? 100 : Math.max(0, 100 - (errorRate * 100));

      const healthRecord: Omit<IntegrationHealth, 'id'> = {
        serviceName: service.name,
        status,
        responseTime: avgResponseTime,
        errorRate,
        lastHealthCheck: new Date(),
        uptime,
        timestamp: new Date()
      };

      // Store health record
      const storedHealth = await this.storeIntegrationHealth(healthRecord);

      // Store endpoint results
      for (const endpointResult of endpointResults) {
        await this.storeEndpointHealth({
          ...endpointResult,
          serviceName: service.name
        });
      }

      // Check for alerts
      await this.checkIntegrationAlerts(storedHealth, service);

      console.log(`${service.name} health check: ${status} (${avgResponseTime.toFixed(0)}ms, ${(errorRate * 100).toFixed(1)}% errors)`);
      return storedHealth;

    } catch (error) {
      console.error(`Error checking ${service.name} health:`, error);
      
      // Record service as down
      const healthRecord: Omit<IntegrationHealth, 'id'> = {
        serviceName: service.name,
        status: 'down',
        responseTime: Date.now() - startTime,
        errorRate: 1.0,
        lastHealthCheck: new Date(),
        uptime: 0,
        timestamp: new Date()
      };

      const storedHealth = await this.storeIntegrationHealth(healthRecord);
      await this.checkIntegrationAlerts(storedHealth, service);
      
      return storedHealth;
    }
  }

  /**
   * Check individual endpoint health
   */
  private async checkEndpoint(service: ServiceConfig, endpoint: {
    path: string;
    method: string;
    expectedStatus: number;
    timeout: number;
  }): Promise<Omit<EndpointHealth, 'id' | 'serviceName'>> {
    const startTime = Date.now();
    const url = `${service.baseUrl}${endpoint.path}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

      const response = await fetch(url, {
        method: endpoint.method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'SATA-HealthCheck/1.0',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        url,
        method: endpoint.method,
        status: response.status,
        responseTime,
        lastChecked: new Date(),
        errorCount: response.status >= 400 ? 1 : 0,
        successCount: response.status < 400 ? 1 : 0,
        timestamp: new Date()
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        url,
        method: endpoint.method,
        status: 0, // Connection failed
        responseTime,
        lastChecked: new Date(),
        errorCount: 1,
        successCount: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Determine service status based on metrics
   */
  private determineServiceStatus(responseTime: number, errorRate: number): string {
    if (errorRate >= 0.5) {
      return 'down';
    } else if (errorRate >= 0.2 || responseTime > this.alertThresholds.maxResponseTime) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Store integration health record
   */
  private async storeIntegrationHealth(health: Omit<IntegrationHealth, 'id'>): Promise<IntegrationHealth> {
    try {
      return await prisma.integrationHealth.create({
        data: health
      });
    } catch (error) {
      console.error('Failed to store integration health:', error);
      throw error;
    }
  }

  /**
   * Store endpoint health record
   */
  private async storeEndpointHealth(health: Omit<EndpointHealth, 'id'>): Promise<void> {
    try {
      await prisma.endpointHealth.create({
        data: health
      });
    } catch (error) {
      console.error('Failed to store endpoint health:', error);
    }
  }

  /**
   * Check for integration-related alerts
   */
  private async checkIntegrationAlerts(health: IntegrationHealth, service: ServiceConfig): Promise<void> {
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

    // Service down alert
    if (health.status === 'down') {
      alerts.push({
        alertId: `integration-down-${service.name}-${Date.now()}`,
        type: 'integration',
        severity: 'critical',
        title: 'Integration Service Down',
        description: `${service.name} is currently down or unreachable`,
        metrics: health as any,
        threshold: 1,
        currentValue: 0,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack', 'phone'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // High response time alert
    if (health.responseTime > this.alertThresholds.maxResponseTime) {
      alerts.push({
        alertId: `integration-slow-${service.name}-${Date.now()}`,
        type: 'performance',
        severity: health.responseTime > 10000 ? 'high' : 'medium',
        title: 'Integration Service Slow Response',
        description: `${service.name} response time (${health.responseTime.toFixed(0)}ms) exceeds threshold (${this.alertThresholds.maxResponseTime}ms)`,
        metrics: health as any,
        threshold: this.alertThresholds.maxResponseTime,
        currentValue: health.responseTime,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // High error rate alert
    if (health.errorRate > this.alertThresholds.maxErrorRate) {
      alerts.push({
        alertId: `integration-errors-${service.name}-${Date.now()}`,
        type: 'integration',
        severity: health.errorRate > 0.5 ? 'critical' : 'high',
        title: 'Integration Service High Error Rate',
        description: `${service.name} error rate (${(health.errorRate * 100).toFixed(1)}%) exceeds threshold (${(this.alertThresholds.maxErrorRate * 100).toFixed(1)}%)`,
        metrics: health as any,
        threshold: this.alertThresholds.maxErrorRate,
        currentValue: health.errorRate,
        timestamp: new Date(),
        resolved: false,
        resolutionTime: null,
        notificationChannels: ['email', 'slack'],
        resolvedAt: null,
        resolvedBy: null
      });
    }

    // Low uptime alert
    if (health.uptime < this.alertThresholds.minUptime) {
      alerts.push({
        alertId: `integration-uptime-${service.name}-${Date.now()}`,
        type: 'integration',
        severity: health.uptime < 80 ? 'critical' : 'high',
        title: 'Integration Service Low Uptime',
        description: `${service.name} uptime (${health.uptime.toFixed(1)}%) below threshold (${this.alertThresholds.minUptime}%)`,
        metrics: health as any,
        threshold: this.alertThresholds.minUptime,
        currentValue: health.uptime,
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

      console.log(`INTEGRATION ALERT: ${alert.title} - ${alert.description}`);
    } catch (error) {
      console.error('Failed to store integration alert:', error);
    }
  }

  /**
   * Generate integration health report
   */
  private async generateIntegrationReport(): Promise<void> {
    try {
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      console.log(`\nIntegration Services Health Report:`);
      
      for (const service of this.services) {
        const recentHealthChecks = await prisma.integrationHealth.findMany({
          where: {
            serviceName: service.name,
            timestamp: { gte: lastHour }
          },
          orderBy: { timestamp: 'desc' }
        });

        if (recentHealthChecks.length === 0) {
          console.log(`- ${service.name}: No recent data`);
          continue;
        }

        const latestHealth = recentHealthChecks[0];
        const avgResponseTime = recentHealthChecks.reduce((sum, h) => sum + h.responseTime, 0) / recentHealthChecks.length;
        const avgErrorRate = recentHealthChecks.reduce((sum, h) => sum + h.errorRate, 0) / recentHealthChecks.length;
        const avgUptime = recentHealthChecks.reduce((sum, h) => sum + h.uptime, 0) / recentHealthChecks.length;

        console.log(`- ${service.name}:`);
        console.log(`  Status: ${latestHealth.status.toUpperCase()}`);
        console.log(`  Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`  Avg Error Rate: ${(avgErrorRate * 100).toFixed(1)}%`);
        console.log(`  Avg Uptime: ${avgUptime.toFixed(1)}%`);
        console.log(`  Checks: ${recentHealthChecks.length} in last hour`);
      }

    } catch (error) {
      console.error('Failed to generate integration report:', error);
    }
  }

  /**
   * Get current service statuses
   */
  public async getCurrentServiceStatuses(): Promise<IntegrationHealth[]> {
    try {
      const statuses: IntegrationHealth[] = [];
      
      for (const service of this.services) {
        const latestHealth = await prisma.integrationHealth.findFirst({
          where: { serviceName: service.name },
          orderBy: { timestamp: 'desc' }
        });
        
        if (latestHealth) {
          statuses.push(latestHealth);
        }
      }
      
      return statuses;
    } catch (error) {
      console.error('Error getting service statuses:', error);
      return [];
    }
  }

  /**
   * Get service health history
   */
  public async getServiceHealthHistory(serviceName: string, hours: number = 24): Promise<IntegrationHealth[]> {
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      return await prisma.integrationHealth.findMany({
        where: {
          serviceName,
          timestamp: { gte: cutoff }
        },
        orderBy: { timestamp: 'asc' }
      });
    } catch (error) {
      console.error('Error getting service health history:', error);
      return [];
    }
  }

  /**
   * Check all services manually
   */
  public async checkAllServices(): Promise<IntegrationHealth[]> {
    const results: IntegrationHealth[] = [];
    
    for (const service of this.services) {
      try {
        const result = await this.checkServiceHealth(service);
        results.push(result);
      } catch (error) {
        console.error(`Failed to check ${service.name}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Stop health checks (for cleanup)
   */
  public stopHealthChecks(): void {
    for (const [serviceName, interval] of this.healthCheckIntervals) {
      clearInterval(interval);
      console.log(`Stopped health checks for ${serviceName}`);
    }
    this.healthCheckIntervals.clear();
  }
}

// Singleton instance
export const integrationHealthMonitor = new IntegrationHealthMonitor();
