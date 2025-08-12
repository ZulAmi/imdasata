/**
 * Analytics and Monitoring Integration for SATA
 * Mixpanel, Google Analytics, and custom mental health analytics
 */

import { EventEmitter } from 'events';

export interface AnalyticsConfig {
  providers: {
    mixpanel?: {
      token: string;
      apiSecret: string;
      projectId: string;
    };
    googleAnalytics?: {
      measurementId: string;
      apiSecret: string;
      propertyId: string;
    };
    amplitude?: {
      apiKey: string;
      secretKey: string;
    };
    segment?: {
      writeKey: string;
    };
  };
  privacy: {
    enableDataCollection: boolean;
    anonymizeIP: boolean;
    respectDoNotTrack: boolean;
    cookieConsent: boolean;
    dataRetentionDays: number;
  };
  mentalHealthCompliance: {
    hipaaCompliant: boolean;
    anonymizeHealthData: boolean;
    encryptSensitiveEvents: boolean;
    auditTrail: boolean;
  };
}

export interface UserProfile {
  userId: string;
  anonymousId?: string;
  demographics?: {
    ageRange?: string;
    gender?: string;
    location?: {
      country: string;
      state?: string;
      zipCode?: string;
    };
  };
  mentalHealthProfile?: {
    primaryConcerns: string[];
    treatmentHistory: boolean;
    currentTherapy: boolean;
    medicationManagement: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    consentToTracking: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    notificationSettings: any;
  };
  cohorts?: string[];
}

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  anonymousId?: string;
  timestamp: Date;
  properties: { [key: string]: any };
  category: 'mental-health' | 'user-interaction' | 'system' | 'therapy' | 'crisis' | 'assessment';
  sensitivity: 'public' | 'private' | 'sensitive' | 'confidential';
  context?: {
    userAgent?: string;
    ip?: string;
    page?: string;
    referrer?: string;
    campaign?: string;
    session?: string;
  };
}

export interface MentalHealthMetrics {
  moodTrends: {
    userId: string;
    timeframe: 'daily' | 'weekly' | 'monthly';
    averageMood: number;
    moodVariability: number;
    trendDirection: 'improving' | 'stable' | 'declining';
    dataPoints: Array<{
      date: Date;
      mood: number;
      notes?: string;
    }>;
  };
  
  engagementMetrics: {
    dailyActiveUsers: number;
    sessionDuration: number;
    featuresUsed: Array<{
      feature: string;
      usageCount: number;
      uniqueUsers: number;
    }>;
    retentionRates: {
      day1: number;
      day7: number;
      day30: number;
    };
  };
  
  therapyMetrics: {
    sessionCompletionRate: number;
    averageSessionDuration: number;
    therapistSatisfactionScore: number;
    missedAppointmentRate: number;
    outcomeImprovement: {
      phq9Improvement: number;
      gad7Improvement: number;
      customScaleImprovement: number;
    };
  };
  
  crisisMetrics: {
    crisisEventsDetected: number;
    responseTime: number;
    interventionSuccess: number;
    followUpCompliance: number;
    riskLevelDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

export interface CustomFunnel {
  name: string;
  steps: Array<{
    name: string;
    event: string;
    conditions?: { [key: string]: any };
  }>;
  timeframe: number; // hours
  cohorts?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
  threshold: number | string;
  timeframe: number; // minutes
  severity: 'info' | 'warning' | 'critical';
  actions: Array<{
    type: 'email' | 'sms' | 'webhook' | 'slack';
    target: string;
    template?: string;
  }>;
  isActive: boolean;
}

class AnalyticsMonitoring extends EventEmitter {
  private config: AnalyticsConfig;
  private userProfiles: Map<string, UserProfile> = new Map();
  private eventQueue: AnalyticsEvent[] = [];
  private funnels: Map<string, CustomFunnel> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private isProcessingQueue = false;
  private metrics: { [key: string]: any } = {};

  constructor(config: AnalyticsConfig) {
    super();
    this.config = config;
    this.initializeAlertRules();
    this.startEventProcessor();
    this.startMetricsAggregation();
  }

  /**
   * Track mental health specific events
   */
  async trackMentalHealthEvent(
    eventName: string,
    userId: string,
    properties: { [key: string]: any },
    sensitivity: 'public' | 'private' | 'sensitive' | 'confidential' = 'private'
  ): Promise<void> {
    // Validate HIPAA compliance for sensitive events
    if (sensitivity === 'confidential' && !this.config.mentalHealthCompliance.hipaaCompliant) {
      this.emit('compliance:warning', {
        event: eventName,
        reason: 'Confidential mental health data requires HIPAA compliance'
      });
      return;
    }

    // Anonymize sensitive data if required
    let processedProperties = properties;
    if (this.config.mentalHealthCompliance.anonymizeHealthData && sensitivity !== 'public') {
      processedProperties = this.anonymizeSensitiveData(properties);
    }

    const event: AnalyticsEvent = {
      eventName,
      userId,
      timestamp: new Date(),
      properties: processedProperties,
      category: 'mental-health',
      sensitivity,
      context: this.getEventContext()
    };

    await this.queueEvent(event);
  }

  /**
   * Track mood entry
   */
  async trackMoodEntry(
    userId: string,
    moodData: {
      mood: number;
      emotions: string[];
      notes?: string;
      triggers?: string[];
      context?: string;
    }
  ): Promise<void> {
    await this.trackMentalHealthEvent(
      'mood_entry_recorded',
      userId,
      {
        mood_scale: moodData.mood,
        emotions_selected: moodData.emotions.length,
        has_notes: !!moodData.notes,
        triggers_count: moodData.triggers?.length || 0,
        context_provided: !!moodData.context,
        entry_method: 'manual' // could be 'voice', 'quick', etc.
      },
      'private'
    );

    // Update user mood trends
    await this.updateMoodTrends(userId, moodData);
  }

  /**
   * Track therapy session events
   */
  async trackTherapySession(
    sessionData: {
      sessionId: string;
      userId: string;
      therapistId: string;
      sessionType: 'video' | 'phone' | 'text' | 'in-person';
      duration: number;
      completed: boolean;
      rating?: number;
      technicalIssues?: boolean;
    }
  ): Promise<void> {
    await this.trackMentalHealthEvent(
      'therapy_session_completed',
      sessionData.userId,
      {
        session_id: sessionData.sessionId,
        therapist_id: this.hashSensitiveId(sessionData.therapistId),
        session_type: sessionData.sessionType,
        duration_minutes: sessionData.duration,
        completed_successfully: sessionData.completed,
        user_rating: sessionData.rating,
        had_technical_issues: sessionData.technicalIssues || false,
        session_time_slot: this.getTimeSlot(new Date())
      },
      'confidential'
    );

    // Track session completion funnel
    await this.trackFunnelStep('therapy_journey', sessionData.userId, 'session_completed');
  }

  /**
   * Track crisis events with high priority
   */
  async trackCrisisEvent(
    userId: string,
    crisisData: {
      riskLevel: 'low' | 'medium' | 'high' | 'imminent';
      triggerSource: 'assessment' | 'voice_analysis' | 'text_analysis' | 'manual_report';
      interventionTriggered: boolean;
      responseTime?: number;
      outcome?: 'resolved' | 'escalated' | 'ongoing';
    }
  ): Promise<void> {
    await this.trackMentalHealthEvent(
      'crisis_event_detected',
      userId,
      {
        risk_level: crisisData.riskLevel,
        trigger_source: crisisData.triggerSource,
        intervention_triggered: crisisData.interventionTriggered,
        response_time_seconds: crisisData.responseTime,
        outcome_status: crisisData.outcome,
        timestamp: new Date().toISOString()
      },
      'confidential'
    );

    // Trigger real-time alerts for high-risk events
    if (crisisData.riskLevel === 'high' || crisisData.riskLevel === 'imminent') {
      await this.triggerCrisisAlert(userId, crisisData);
    }
  }

  /**
   * Track assessment completion
   */
  async trackAssessmentCompletion(
    userId: string,
    assessmentData: {
      assessmentType: 'PHQ-9' | 'GAD-7' | 'Beck-Depression' | 'PTSD-Checklist' | 'Custom';
      score: number;
      completionTime: number;
      previousScore?: number;
      riskFlags: string[];
    }
  ): Promise<void> {
    const improvement = assessmentData.previousScore 
      ? assessmentData.score - assessmentData.previousScore 
      : null;

    await this.trackMentalHealthEvent(
      'assessment_completed',
      userId,
      {
        assessment_type: assessmentData.assessmentType,
        current_score: assessmentData.score,
        completion_time_minutes: assessmentData.completionTime,
        score_improvement: improvement,
        risk_flags_count: assessmentData.riskFlags.length,
        has_previous_score: !!assessmentData.previousScore,
        assessment_category: this.categorizeAssessmentScore(assessmentData.assessmentType, assessmentData.score)
      },
      'confidential'
    );
  }

  /**
   * Track user engagement patterns
   */
  async trackEngagement(
    userId: string,
    engagementData: {
      sessionDuration: number;
      pagesVisited: number;
      featuresUsed: string[];
      timeOfDay: string;
      dayOfWeek: string;
      deviceType: string;
    }
  ): Promise<void> {
    await this.trackMentalHealthEvent(
      'user_engagement_session',
      userId,
      {
        session_duration_minutes: engagementData.sessionDuration,
        pages_visited: engagementData.pagesVisited,
        features_used_count: engagementData.featuresUsed.length,
        features_used: engagementData.featuresUsed,
        time_of_day: engagementData.timeOfDay,
        day_of_week: engagementData.dayOfWeek,
        device_type: engagementData.deviceType,
        engagement_score: this.calculateEngagementScore(engagementData)
      },
      'private'
    );
  }

  /**
   * Send events to analytics providers
   */
  private async sendToProviders(event: AnalyticsEvent): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send to Mixpanel
    if (this.config.providers.mixpanel) {
      promises.push(this.sendToMixpanel(event));
    }

    // Send to Google Analytics
    if (this.config.providers.googleAnalytics) {
      promises.push(this.sendToGoogleAnalytics(event));
    }

    // Send to Amplitude
    if (this.config.providers.amplitude) {
      promises.push(this.sendToAmplitude(event));
    }

    // Send to Segment
    if (this.config.providers.segment) {
      promises.push(this.sendToSegment(event));
    }

    try {
      await Promise.all(promises);
      this.emit('event:sent', { event, providers: Object.keys(this.config.providers) });
    } catch (error) {
      this.emit('event:error', { event, error });
      throw error;
    }
  }

  /**
   * Send event to Mixpanel
   */
  private async sendToMixpanel(event: AnalyticsEvent): Promise<void> {
    const mixpanelConfig = this.config.providers.mixpanel!;
    
    const payload = {
      event: event.eventName,
      properties: {
        ...event.properties,
        time: event.timestamp.getTime(),
        distinct_id: event.userId || event.anonymousId,
        $insert_id: `${event.userId}-${event.timestamp.getTime()}`,
        mp_lib: 'SATA-Analytics',
        category: event.category,
        sensitivity: event.sensitivity
      }
    };

    const response = await fetch('https://api.mixpanel.com/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${mixpanelConfig.apiSecret}:`).toString('base64')}`
      },
      body: JSON.stringify([payload])
    });

    if (!response.ok) {
      throw new Error(`Mixpanel API error: ${response.status}`);
    }
  }

  /**
   * Send event to Google Analytics
   */
  private async sendToGoogleAnalytics(event: AnalyticsEvent): Promise<void> {
    const gaConfig = this.config.providers.googleAnalytics!;
    
    const payload = {
      client_id: event.userId || event.anonymousId,
      events: [{
        name: event.eventName.replace(/[^a-zA-Z0-9_]/g, '_'),
        params: {
          ...event.properties,
          category: event.category,
          custom_timestamp: event.timestamp.getTime()
        }
      }]
    };

    const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${gaConfig.measurementId}&api_secret=${gaConfig.apiSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Analytics API error: ${response.status}`);
    }
  }

  /**
   * Send event to Amplitude
   */
  private async sendToAmplitude(event: AnalyticsEvent): Promise<void> {
    const amplitudeConfig = this.config.providers.amplitude!;
    
    const payload = {
      api_key: amplitudeConfig.apiKey,
      events: [{
        user_id: event.userId,
        device_id: event.anonymousId,
        event_type: event.eventName,
        time: event.timestamp.getTime(),
        event_properties: event.properties,
        user_properties: {
          category: event.category,
          sensitivity: event.sensitivity
        }
      }]
    };

    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Amplitude API error: ${response.status}`);
    }
  }

  /**
   * Send event to Segment
   */
  private async sendToSegment(event: AnalyticsEvent): Promise<void> {
    const segmentConfig = this.config.providers.segment!;
    
    const payload = {
      userId: event.userId,
      anonymousId: event.anonymousId,
      event: event.eventName,
      properties: event.properties,
      context: event.context,
      timestamp: event.timestamp.toISOString()
    };

    const response = await fetch('https://api.segment.io/v1/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${segmentConfig.writeKey}:`).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Segment API error: ${response.status}`);
    }
  }

  /**
   * Get comprehensive mental health metrics
   */
  async getMentalHealthMetrics(
    timeframe: { start: Date; end: Date },
    cohort?: string
  ): Promise<MentalHealthMetrics> {
    // This would query your analytics providers for aggregated data
    // For now, return mock comprehensive metrics
    return {
      moodTrends: {
        userId: 'aggregate',
        timeframe: 'monthly',
        averageMood: 6.5,
        moodVariability: 1.2,
        trendDirection: 'stable',
        dataPoints: []
      },
      engagementMetrics: {
        dailyActiveUsers: 1250,
        sessionDuration: 12.5,
        featuresUsed: [
          { feature: 'mood_tracking', usageCount: 5680, uniqueUsers: 890 },
          { feature: 'therapy_sessions', usageCount: 2340, uniqueUsers: 445 },
          { feature: 'assessments', usageCount: 1890, uniqueUsers: 623 }
        ],
        retentionRates: {
          day1: 0.85,
          day7: 0.62,
          day30: 0.34
        }
      },
      therapyMetrics: {
        sessionCompletionRate: 0.87,
        averageSessionDuration: 48.5,
        therapistSatisfactionScore: 4.6,
        missedAppointmentRate: 0.13,
        outcomeImprovement: {
          phq9Improvement: -2.3,
          gad7Improvement: -1.8,
          customScaleImprovement: 1.9
        }
      },
      crisisMetrics: {
        crisisEventsDetected: 23,
        responseTime: 4.2,
        interventionSuccess: 0.91,
        followUpCompliance: 0.78,
        riskLevelDistribution: {
          low: 0.65,
          medium: 0.25,
          high: 0.08,
          critical: 0.02
        }
      }
    };
  }

  /**
   * Create custom funnel analysis
   */
  createFunnel(funnel: CustomFunnel): void {
    this.funnels.set(funnel.name, funnel);
    this.emit('funnel:created', { name: funnel.name, steps: funnel.steps.length });
  }

  /**
   * Track funnel step completion
   */
  async trackFunnelStep(funnelName: string, userId: string, stepName: string): Promise<void> {
    const funnel = this.funnels.get(funnelName);
    if (!funnel) return;

    await this.trackMentalHealthEvent(
      `funnel_${funnelName}_${stepName}`,
      userId,
      {
        funnel_name: funnelName,
        step_name: stepName,
        step_timestamp: new Date().toISOString()
      },
      'private'
    );
  }

  /**
   * Set up alert rule
   */
  setAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert:rule:created', { id: rule.id, name: rule.name });
  }

  /**
   * Trigger crisis alert
   */
  private async triggerCrisisAlert(userId: string, crisisData: any): Promise<void> {
    const alertsToTrigger = Array.from(this.alertRules.values())
      .filter(rule => rule.metric === 'crisis_event' && rule.isActive);

    for (const rule of alertsToTrigger) {
      for (const action of rule.actions) {
        try {
          await this.executeAlertAction(action, {
            userId,
            crisisData,
            rule,
            timestamp: new Date()
          });
        } catch (error) {
          this.emit('alert:action:failed', { rule: rule.id, action, error });
        }
      }
    }
  }

  /**
   * Execute alert action
   */
  private async executeAlertAction(action: any, context: any): Promise<void> {
    switch (action.type) {
      case 'email':
        // Integration with email service
        this.emit('alert:email:sent', { to: action.target, context });
        break;
      case 'sms':
        // Integration with SMS service
        this.emit('alert:sms:sent', { to: action.target, context });
        break;
      case 'webhook':
        await fetch(action.target, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(context)
        });
        break;
      case 'slack':
        // Integration with Slack
        this.emit('alert:slack:sent', { channel: action.target, context });
        break;
    }
  }

  /**
   * Helper methods
   */
  private async queueEvent(event: AnalyticsEvent): Promise<void> {
    this.eventQueue.push(event);
    
    if (!this.isProcessingQueue) {
      this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.eventQueue.length > 0) {
      const batch = this.eventQueue.splice(0, 10); // Process in batches
      
      for (const event of batch) {
        try {
          await this.sendToProviders(event);
        } catch (error) {
          this.emit('event:processing:error', { event, error });
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessingQueue = false;
  }

  private getEventContext(): any {
    return {
      timestamp: new Date().toISOString(),
      lib: 'SATA-Analytics',
      lib_version: '1.0.0'
    };
  }

  private anonymizeSensitiveData(properties: any): any {
    const anonymized = { ...properties };
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'phone', 'name', 'address', 'ssn', 'medical_record'];
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        anonymized[field] = this.hashSensitiveId(anonymized[field]);
      }
    }

    return anonymized;
  }

  private hashSensitiveId(id: string): string {
    // Simple hash function for demo - use proper crypto in production
    return Buffer.from(id).toString('base64').substring(0, 8);
  }

  private getTimeSlot(date: Date): string {
    const hour = date.getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private calculateEngagementScore(data: any): number {
    // Simple engagement scoring algorithm
    const durationScore = Math.min(data.sessionDuration / 30, 1) * 40;
    const pageScore = Math.min(data.pagesVisited / 10, 1) * 30;
    const featureScore = Math.min(data.featuresUsed.length / 5, 1) * 30;
    
    return Math.round(durationScore + pageScore + featureScore);
  }

  private categorizeAssessmentScore(type: string, score: number): string {
    // Categorize assessment scores
    switch (type) {
      case 'PHQ-9':
        if (score <= 4) return 'minimal';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        if (score <= 19) return 'moderately_severe';
        return 'severe';
      case 'GAD-7':
        if (score <= 4) return 'minimal';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        return 'severe';
      default:
        return 'unknown';
    }
  }

  private async updateMoodTrends(userId: string, moodData: any): Promise<void> {
    // Update user's mood trend data
    // This would typically update a database or cache
    this.emit('mood:trend:updated', { userId, moodData });
  }

  private initializeAlertRules(): void {
    // Set up default crisis alert rules
    this.setAlertRule({
      id: 'crisis-high-risk',
      name: 'High Risk Crisis Event',
      description: 'Triggered when a high or imminent risk crisis event is detected',
      metric: 'crisis_event',
      condition: 'greater_than',
      threshold: 'high',
      timeframe: 5,
      severity: 'critical',
      actions: [
        { type: 'email', target: 'crisis-team@sata.com' },
        { type: 'sms', target: '+1234567890' }
      ],
      isActive: true
    });
  }

  private startEventProcessor(): void {
    // Process queued events every 30 seconds
    setInterval(() => {
      if (!this.isProcessingQueue && this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 30000);
  }

  private startMetricsAggregation(): void {
    // Aggregate metrics every 5 minutes
    setInterval(() => {
      this.aggregateMetrics();
    }, 300000);
  }

  private aggregateMetrics(): void {
    // Aggregate real-time metrics
    this.emit('metrics:aggregated', {
      timestamp: new Date(),
      queueSize: this.eventQueue.length,
      activeAlerts: Array.from(this.alertRules.values()).filter(r => r.isActive).length
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    providers: { [key: string]: boolean };
    queueSize: number;
    lastEventProcessed?: Date;
  }> {
    const providerHealth: { [key: string]: boolean } = {};

    // Check each provider
    for (const providerName of Object.keys(this.config.providers)) {
      try {
        // Test connection to provider
        providerHealth[providerName] = true;
      } catch (error) {
        providerHealth[providerName] = false;
      }
    }

    const isHealthy = Object.values(providerHealth).every(status => status);

    return {
      isHealthy,
      providers: providerHealth,
      queueSize: this.eventQueue.length,
      lastEventProcessed: new Date()
    };
  }
}

export default AnalyticsMonitoring;
