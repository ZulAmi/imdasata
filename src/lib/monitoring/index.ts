/**
 * Monitoring System Main Export
 * Central entry point for all monitoring components
 */

// Import singleton instances
import { performanceMonitor } from './performance';
import { engagementMonitor } from './engagement';
import { crisisDetectionMonitor } from './crisis-detection';
import { systemResourceMonitor } from './system-resources';
import { privacyComplianceMonitor } from './privacy-compliance';
import { integrationHealthMonitor } from './integration-health';
import { errorTrackingMonitor } from './error-tracking';
import { monitoringDashboard } from './dashboard';

// Core monitoring classes - for type exports and instantiation
export { PerformanceMonitor } from './performance';
export { EngagementMonitor } from './engagement';
export { CrisisDetectionMonitor } from './crisis-detection';
export { SystemResourceMonitor } from './system-resources';
export { PrivacyComplianceMonitor } from './privacy-compliance';
export { IntegrationHealthMonitor } from './integration-health';
export { ErrorTrackingMonitor } from './error-tracking';
export { MonitoringDashboard } from './dashboard';

// Export singleton instances
export { 
  performanceMonitor,
  engagementMonitor,
  crisisDetectionMonitor,
  systemResourceMonitor,
  privacyComplianceMonitor,
  integrationHealthMonitor,
  errorTrackingMonitor,
  monitoringDashboard
};

// Type definitions
export * from './types';

// Example usage and initialization
export async function initializeMonitoring(): Promise<void> {
  console.log('🚀 Initializing SATA Monitoring System...');
  
  try {
    // Start performance monitoring
    console.log('  📊 Starting performance monitoring...');
    await performanceMonitor.performHealthCheck();
    
    // Start system resource monitoring
    console.log('  💻 Starting system resource monitoring...');
    await systemResourceMonitor.collectMetrics();
    
    // Run initial privacy compliance check
    console.log('  🔒 Running privacy compliance check...');
    await privacyComplianceMonitor.runComplianceCheck();
    
    // Check integration health
    console.log('  🔗 Checking integration services health...');
    await integrationHealthMonitor.checkAllServices();
    
    // Start monitoring dashboard
    console.log('  📋 Starting monitoring dashboard...');
    await monitoringDashboard.refreshDashboard();
    
    console.log('✅ SATA Monitoring System initialized successfully!');
    
    // Generate initial report
    console.log('📄 Generating initial monitoring report...');
    await monitoringDashboard.generateMonitoringReport();
    
  } catch (error) {
    console.error('❌ Failed to initialize monitoring system:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdownMonitoring(): Promise<void> {
  console.log('🛑 Shutting down SATA Monitoring System...');
  
  try {
    // Stop dashboard auto-refresh
    monitoringDashboard.stopAutoRefresh();
    
    // Stop integration health checks
    integrationHealthMonitor.stopHealthChecks();
    
    // Cleanup dashboard resources
    monitoringDashboard.cleanup();
    
    console.log('✅ Monitoring system shut down gracefully');
    
  } catch (error) {
    console.error('❌ Error during monitoring shutdown:', error);
  }
}

// Health check endpoint for external monitoring
export async function getSystemHealthStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: Record<string, string>;
  alerts: number;
}> {
  try {
    // Get current dashboard metrics
    const dashboardMetrics = monitoringDashboard.getCurrentMetrics();
    
    if (!dashboardMetrics) {
      await monitoringDashboard.refreshDashboard();
    }
    
    const healthOverview = await monitoringDashboard.getSystemHealthOverview();
    const currentMetrics = monitoringDashboard.getCurrentMetrics();
    
    // Get service statuses
    const integrationStatuses = await integrationHealthMonitor.getCurrentServiceStatuses();
    const services: Record<string, string> = {};
    
    integrationStatuses.forEach(service => {
      services[service.serviceName] = service.status;
    });
    
    // Add application and system services
    services['Application'] = currentMetrics?.application.status || 'unknown';
    services['Database'] = (currentMetrics?.system.databasePerformance || 0) < 1000 ? 'healthy' : 'degraded';
    services['System Resources'] = 
      (currentMetrics?.system.cpuUsage || 0) < 80 && 
      (currentMetrics?.system.memoryUsage || 0) < 85 ? 'healthy' : 'degraded';
    services['Privacy Compliance'] = (currentMetrics?.compliance.score || 0) > 95 ? 'healthy' : 'degraded';
    
    return {
      status: healthOverview.status,
      timestamp: new Date(),
      services,
      alerts: currentMetrics?.alerts.active || 0
    };
    
  } catch (error) {
    console.error('Error getting system health status:', error);
    return {
      status: 'critical',
      timestamp: new Date(),
      services: { 'Monitoring System': 'error' },
      alerts: 0
    };
  }
}

// Export monitoring configuration
export const MONITORING_CONFIG = {
  // Performance monitoring settings
  performance: {
    metricsInterval: 60000, // 1 minute
    alertThresholds: {
      responseTime: 2000, // 2 seconds
      errorRate: 0.05, // 5%
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.75 // 75%
    }
  },
  
  // System resource monitoring settings
  systemResources: {
    metricsInterval: 30000, // 30 seconds
    alertThresholds: {
      cpu: 80, // 80%
      memory: 85, // 85%
      disk: 90, // 90%
      databaseQueryTime: 1000 // 1 second
    }
  },
  
  // Privacy compliance monitoring settings
  privacyCompliance: {
    checkInterval: 21600000, // 6 hours
    minComplianceScore: 95.0,
    maxDataRetentionDays: 365
  },
  
  // Integration health monitoring settings
  integrationHealth: {
    defaultCheckInterval: 60000, // 1 minute
    alertThresholds: {
      maxResponseTime: 5000, // 5 seconds
      maxErrorRate: 0.1, // 10%
      minUptime: 95.0 // 95%
    }
  },
  
  // Error tracking settings
  errorTracking: {
    similarErrorWindow: 300000, // 5 minutes
    maxErrorRate: 10, // errors per minute
    criticalErrorThreshold: 5
  },
  
  // Dashboard settings
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    reportInterval: 3600000 // 1 hour
  }
};

// Default export
export default {
  initializeMonitoring,
  shutdownMonitoring,
  getSystemHealthStatus,
  MONITORING_CONFIG,
  
  // Direct access to monitors
  monitors: {
    performance: performanceMonitor,
    engagement: engagementMonitor,
    crisisDetection: crisisDetectionMonitor,
    systemResources: systemResourceMonitor,
    privacyCompliance: privacyComplianceMonitor,
    integrationHealth: integrationHealthMonitor,
    errorTracking: errorTrackingMonitor,
    dashboard: monitoringDashboard
  }
};
