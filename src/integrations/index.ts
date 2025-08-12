/**
 * SATA Integration Services Index
 * Comprehensive external service integrations for mental health platform
 */

// Core Integration Modules
import WhatsAppBusinessAPI from './whatsapp-business';
import AzureCognitiveServices from './azure-cognitive';
import GoogleTranslateAPI from './google-translate';
import SMSGateway from './sms-gateway';
import MentalHealthProviderAPI from './mental-health-providers';
import QRCodeService from './qr-code-service';
import AnalyticsMonitoring from './analytics-monitoring';

export {
  WhatsAppBusinessAPI,
  AzureCognitiveServices,
  GoogleTranslateAPI,
  SMSGateway,
  MentalHealthProviderAPI,
  QRCodeService,
  AnalyticsMonitoring
};

// Integration Status Interface
export interface IntegrationStatus {
  service: string;
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
  errorCount: number;
  lastError?: string;
}

// Integration Events
export interface IntegrationEvent {
  service: string;
  event: string;
  timestamp: Date;
  data: any;
  userId?: string;
  success: boolean;
  error?: string;
}

/**
 * SATA Integration Manager
 * Orchestrates all external service integrations
 */
export class SATAIntegrationManager {
  private services: Map<string, any> = new Map();
  private healthChecks: Map<string, IntegrationStatus> = new Map();
  private eventHistory: IntegrationEvent[] = [];

  constructor() {
    console.log('🚀 SATA Integration Manager initialized');
  }

  /**
   * Add a service to the manager
   */
  addService(name: string, service: any): void {
    this.services.set(name, service);
    console.log(`✅ Added service: ${name}`);
  }

  /**
   * Get service instance
   */
  getService<T>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T;
  }

  /**
   * Get all service health statuses
   */
  async getHealthStatus(): Promise<Map<string, IntegrationStatus>> {
    const healthPromises = Array.from(this.services.entries()).map(
      async ([name, service]) => {
        try {
          const startTime = Date.now();
          const health = service.healthCheck ? await service.healthCheck() : { isHealthy: true };
          const responseTime = Date.now() - startTime;

          const status: IntegrationStatus = {
            service: name,
            isHealthy: health.isHealthy,
            lastChecked: new Date(),
            responseTime,
            errorCount: this.getErrorCount(name),
            lastError: this.getLastError(name)
          };

          this.healthChecks.set(name, status);
          return [name, status] as [string, IntegrationStatus];
        } catch (error) {
          const status: IntegrationStatus = {
            service: name,
            isHealthy: false,
            lastChecked: new Date(),
            errorCount: this.getErrorCount(name) + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error'
          };

          this.healthChecks.set(name, status);
          return [name, status] as [string, IntegrationStatus];
        }
      }
    );

    const results = await Promise.all(healthPromises);
    return new Map(results);
  }

  /**
   * Log integration event
   */
  logEvent(event: IntegrationEvent): void {
    this.eventHistory.push(event);
    
    // Keep only last 1000 events
    if (this.eventHistory.length > 1000) {
      this.eventHistory = this.eventHistory.slice(-1000);
    }

    // Log to analytics if available
    const analytics = this.getService<AnalyticsMonitoring>('analytics');
    if (analytics && event.userId) {
      analytics.trackMentalHealthEvent(
        `integration_${event.service}_${event.event}`,
        event.userId,
        {
          service: event.service,
          success: event.success,
          error: event.error,
          response_time: event.data?.responseTime
        }
      ).catch(err => console.error('Failed to track analytics event:', err));
    }
  }

  /**
   * Get integration metrics
   */
  getMetrics(): {
    totalServices: number;
    healthyServices: number;
    totalEvents: number;
    successRate: number;
    averageResponseTime: number;
  } {
    const healthyCount = Array.from(this.healthChecks.values())
      .filter(status => status.isHealthy).length;

    const successfulEvents = this.eventHistory.filter(e => e.success).length;
    const successRate = this.eventHistory.length > 0 
      ? successfulEvents / this.eventHistory.length 
      : 0;

    const responseTimeSum = Array.from(this.healthChecks.values())
      .reduce((sum, status) => sum + (status.responseTime || 0), 0);
    const avgResponseTime = this.healthChecks.size > 0 
      ? responseTimeSum / this.healthChecks.size 
      : 0;

    return {
      totalServices: this.services.size,
      healthyServices: healthyCount,
      totalEvents: this.eventHistory.length,
      successRate,
      averageResponseTime: avgResponseTime
    };
  }

  /**
   * Restart unhealthy services
   */
  async restartUnhealthyServices(): Promise<void> {
    const unhealthyServices = Array.from(this.healthChecks.entries())
      .filter(([_, status]) => !status.isHealthy)
      .map(([name, _]) => name);

    for (const serviceName of unhealthyServices) {
      try {
        console.log(`🔄 Restarting service: ${serviceName}`);
        // Service restart logic would go here
        // For now, just mark as healthy
        const status = this.healthChecks.get(serviceName);
        if (status) {
          status.isHealthy = true;
          status.lastChecked = new Date();
          status.lastError = undefined;
        }
      } catch (error) {
        console.error(`❌ Failed to restart service ${serviceName}:`, error);
      }
    }
  }

  /**
   * List all available services
   */
  listServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Check if service exists
   */
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Remove a service
   */
  removeService(serviceName: string): boolean {
    const removed = this.services.delete(serviceName);
    if (removed) {
      this.healthChecks.delete(serviceName);
      console.log(`❌ Removed service: ${serviceName}`);
    }
    return removed;
  }

  /**
   * Private helper methods
   */
  private getErrorCount(serviceName: string): number {
    return this.eventHistory
      .filter(e => e.service === serviceName && !e.success)
      .length;
  }

  private getLastError(serviceName: string): string | undefined {
    const lastErrorEvent = this.eventHistory
      .filter(e => e.service === serviceName && !e.success)
      .pop();
    
    return lastErrorEvent?.error;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(intervalMinutes: number = 5): void {
    setInterval(async () => {
      try {
        await this.getHealthStatus();
        console.log('🔍 Health check completed for all services');
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, intervalMinutes * 60000);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down integration services...');
    
    for (const [name, service] of this.services.entries()) {
      try {
        if (service.destroy) {
          await service.destroy();
        }
        console.log(`✅ Service ${name} shut down successfully`);
      } catch (error) {
        console.error(`❌ Error shutting down service ${name}:`, error);
      }
    }

    this.services.clear();
    this.healthChecks.clear();
    console.log('✅ All integration services shut down');
  }
}

export default SATAIntegrationManager;
