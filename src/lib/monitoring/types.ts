/**
 * Monitoring System Type Definitions
 * Central types for all monitoring components
 */

export interface ApplicationMetrics {
  uptime: number;
  responseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

export interface UserEngagementMetrics {
  userId: string;
  sessionDuration: number;
  pagesViewed: number;
  assessmentsCompleted: number;
  resourcesAccessed: number;
  messagesSent: number;
  lastActiveTime: Date;
  satisfactionScore?: number;
  retentionPeriod: number; // days since first visit
}

export interface CrisisAlert {
  id: string;
  userId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  triggerType: 'keyword' | 'assessment_score' | 'behavioral_pattern' | 'manual';
  content?: string;
  phq4Score?: number;
  riskFactors: string[];
  timestamp: Date;
  resolved: boolean;
  responseTime?: number; // ms to detect and alert
  escalated: boolean;
  notificationsSent: string[]; // channels notified
}

export interface SystemResourceMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    usage: number;
    heap: {
      used: number;
      total: number;
    };
  };
  disk: {
    used: number;
    total: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
  timestamp: Date;
}

export interface PrivacyComplianceMetrics {
  dataRetentionCompliance: boolean;
  encryptionStatus: boolean;
  accessLogsIntegrity: boolean;
  consentRecords: number;
  dataBreachIncidents: number;
  pdpaViolations: PrivacyViolation[];
  lastAuditDate: Date;
  complianceScore: number; // 0-100
}

export interface PrivacyViolation {
  id: string;
  type: 'data_retention' | 'unauthorized_access' | 'missing_consent' | 'data_leak';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: number;
}

export interface IntegrationHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  errorRate: number;
  lastHealthCheck: Date;
  uptime: number;
  endpoints: EndpointHealth[];
}

export interface EndpointHealth {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  lastChecked: Date;
  errorCount: number;
}

export interface ErrorMetrics {
  id: string;
  type: 'application' | 'database' | 'network' | 'external_api' | 'validation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  stack?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  timestamp: Date;
  count: number; // if aggregated
  resolved: boolean;
  tags: string[];
}

export interface MonitoringAlert {
  id: string;
  type: 'performance' | 'crisis' | 'security' | 'compliance' | 'integration' | 'error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metrics: any;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  resolutionTime?: number;
  notificationChannels: string[];
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      responseTime?: number;
    };
  };
  timestamp: Date;
}

export interface MonitoringConfig {
  performance: {
    responseTimeThreshold: number;
    errorRateThreshold: number;
    uptimeThreshold: number;
  };
  crisis: {
    autoEscalationTime: number; // minutes
    severityLevels: {
      [key: string]: {
        keywords: string[];
        phq4Threshold: number;
        responseTime: number; // max ms
      };
    };
  };
  privacy: {
    auditInterval: number; // hours
    dataRetentionPeriod: number; // days
    encryptionRequirements: string[];
  };
  integrations: {
    healthCheckInterval: number; // minutes
    timeoutThreshold: number; // ms
    retryAttempts: number;
  };
  notifications: {
    channels: {
      email: string[];
      sms: string[];
      webhook: string[];
      slack?: string;
    };
    quietHours: {
      start: string; // HH:mm
      end: string; // HH:mm
    };
  };
}

export interface DashboardMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    assessmentsToday: number;
    crisisAlertsToday: number;
    systemUptime: number;
    averageResponseTime: number;
  };
  trends: {
    userGrowth: number[]; // last 30 days
    engagementRate: number[]; // last 30 days
    crisisAlerts: number[]; // last 30 days
    systemLoad: number[]; // last 24 hours
  };
  alerts: MonitoringAlert[];
  healthStatus: {
    application: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    integrations: 'healthy' | 'degraded' | 'down';
    compliance: 'compliant' | 'warning' | 'violation';
  };
}
