/**
 * SMS Gateway Integration for SATA
 * Critical notifications, crisis alerts, and mental health reminders via SMS
 */

import { EventEmitter } from 'events';

export interface SMSConfig {
  provider: 'twilio' | 'aws-sns' | 'vonage' | 'messagebird';
  credentials: {
    accountSid?: string;
    authToken?: string;
    apiKey?: string;
    apiSecret?: string;
    accessKey?: string;
    secretKey?: string;
    region?: string;
  };
  fromNumber: string;
  webhookUrl?: string;
  defaultCountryCode?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'reminder' | 'alert' | 'crisis' | 'appointment' | 'medication' | 'mood-check' | 'general';
  metadata?: {
    userId?: string;
    messageId?: string;
    scheduledTime?: Date;
    retryCount?: number;
    language?: string;
  };
}

export interface SMSResponse {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  cost?: number;
  timestamp: Date;
  error?: string;
}

export interface SMSTemplate {
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  template: string;
  variables: string[];
  maxLength: number;
  supportedLanguages: string[];
}

export interface CrisisAlert {
  userId: string;
  phoneNumber: string;
  alertType: 'suicide-ideation' | 'self-harm' | 'emergency' | 'high-risk';
  triggerMessage?: string;
  severity: 1 | 2 | 3 | 4 | 5;
  emergencyContacts: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface SMSSchedule {
  id: string;
  userId: string;
  phoneNumber: string;
  message: string;
  scheduledTime: Date;
  recurrence?: 'daily' | 'weekly' | 'monthly' | 'custom';
  customRecurrence?: string; // cron expression
  timezone: string;
  isActive: boolean;
  lastSent?: Date;
  nextSend?: Date;
}

class SMSGateway extends EventEmitter {
  private config: SMSConfig;
  private templates: Map<string, SMSTemplate> = new Map();
  private schedules: Map<string, SMSSchedule> = new Map();
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private resetTime = Date.now() + 60000; // 1 minute

  constructor(config: SMSConfig) {
    super();
    this.config = config;
    this.initializeTemplates();
    this.startScheduler();
  }

  /**
   * Send SMS message with priority handling
   */
  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    // Validate phone number
    const phoneNumber = this.formatPhoneNumber(message.to);
    
    // Apply rate limiting based on priority
    if (message.priority === 'critical') {
      return this.sendImmediately(phoneNumber, message);
    }
    
    return this.executeWithRateLimit(async () => {
      return this.sendViaPrimaryProvider(phoneNumber, message);
    });
  }

  /**
   * Send immediate SMS (bypass rate limiting for crisis situations)
   */
  private async sendImmediately(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    try {
      const response = await this.sendViaPrimaryProvider(phoneNumber, message);
      this.emit('sms:critical:sent', { message, response });
      return response;
    } catch (error) {
      this.emit('sms:critical:failed', { message, error });
      throw error;
    }
  }

  /**
   * Send SMS via primary provider (Twilio)
   */
  private async sendViaPrimaryProvider(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    switch (this.config.provider) {
      case 'twilio':
        return this.sendViaTwilio(phoneNumber, message);
      case 'aws-sns':
        return this.sendViaAWS(phoneNumber, message);
      case 'vonage':
        return this.sendViaVonage(phoneNumber, message);
      case 'messagebird':
        return this.sendViaMessageBird(phoneNumber, message);
      default:
        throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
    }
  }

  /**
   * Twilio SMS implementation
   */
  private async sendViaTwilio(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    const accountSid = this.config.credentials.accountSid;
    const authToken = this.config.credentials.authToken;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append('To', phoneNumber);
    formData.append('From', this.config.fromNumber);
    formData.append('Body', message.message);

    // Add delivery status callback for critical messages
    if (message.priority === 'critical' && this.config.webhookUrl) {
      formData.append('StatusCallback', this.config.webhookUrl);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Twilio SMS Error: ${error.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      const smsResponse: SMSResponse = {
        messageId: result.sid,
        status: this.mapTwilioStatus(result.status),
        cost: parseFloat(result.price) || 0,
        timestamp: new Date()
      };

      this.emit('sms:sent', { message, response: smsResponse, provider: 'twilio' });
      return smsResponse;
    } catch (error) {
      this.emit('sms:error', { message, error, provider: 'twilio' });
      throw error;
    }
  }

  /**
   * AWS SNS SMS implementation
   */
  private async sendViaAWS(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    // AWS SNS implementation would go here
    // For now, return a mock response
    throw new Error('AWS SNS SMS implementation not yet available');
  }

  /**
   * Vonage SMS implementation
   */
  private async sendViaVonage(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    const apiKey = this.config.credentials.apiKey;
    const apiSecret = this.config.credentials.apiSecret;
    
    if (!apiKey || !apiSecret) {
      throw new Error('Vonage credentials not configured');
    }

    const url = 'https://rest.nexmo.com/sms/json';
    
    const payload = {
      api_key: apiKey,
      api_secret: apiSecret,
      to: phoneNumber,
      from: this.config.fromNumber,
      text: message.message
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Vonage SMS Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const messageData = result.messages[0];
      
      if (messageData.status !== '0') {
        throw new Error(`Vonage SMS Error: ${messageData['error-text']}`);
      }

      const smsResponse: SMSResponse = {
        messageId: messageData['message-id'],
        status: 'sent',
        cost: parseFloat(messageData['message-price']) || 0,
        timestamp: new Date()
      };

      this.emit('sms:sent', { message, response: smsResponse, provider: 'vonage' });
      return smsResponse;
    } catch (error) {
      this.emit('sms:error', { message, error, provider: 'vonage' });
      throw error;
    }
  }

  /**
   * MessageBird SMS implementation
   */
  private async sendViaMessageBird(phoneNumber: string, message: SMSMessage): Promise<SMSResponse> {
    const apiKey = this.config.credentials.apiKey;
    
    if (!apiKey) {
      throw new Error('MessageBird API key not configured');
    }

    const url = 'https://rest.messagebird.com/messages';
    
    const payload = {
      recipients: [phoneNumber],
      originator: this.config.fromNumber,
      body: message.message
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `AccessKey ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`MessageBird SMS Error: ${error.errors?.[0]?.description || 'Unknown error'}`);
      }

      const result = await response.json();
      
      const smsResponse: SMSResponse = {
        messageId: result.id,
        status: 'sent',
        timestamp: new Date()
      };

      this.emit('sms:sent', { message, response: smsResponse, provider: 'messagebird' });
      return smsResponse;
    } catch (error) {
      this.emit('sms:error', { message, error, provider: 'messagebird' });
      throw error;
    }
  }

  /**
   * Send crisis alert to emergency contacts
   */
  async sendCrisisAlert(alert: CrisisAlert): Promise<SMSResponse[]> {
    const responses: SMSResponse[] = [];
    
    // Primary alert to user
    const userMessage: SMSMessage = {
      to: alert.phoneNumber,
      message: this.getCrisisMessage(alert.alertType, alert.severity),
      priority: 'critical',
      type: 'crisis',
      metadata: {
        userId: alert.userId,
        messageId: `crisis-${Date.now()}`
      }
    };

    try {
      const userResponse = await this.sendSMS(userMessage);
      responses.push(userResponse);
    } catch (error) {
      this.emit('crisis:alert:user:failed', { alert, error });
    }

    // Alert emergency contacts
    for (const contactNumber of alert.emergencyContacts) {
      const contactMessage: SMSMessage = {
        to: contactNumber,
        message: this.getEmergencyContactMessage(alert),
        priority: 'critical',
        type: 'crisis',
        metadata: {
          userId: alert.userId,
          messageId: `crisis-contact-${Date.now()}`
        }
      };

      try {
        const contactResponse = await this.sendSMS(contactMessage);
        responses.push(contactResponse);
      } catch (error) {
        this.emit('crisis:alert:contact:failed', { alert, contactNumber, error });
      }
    }

    this.emit('crisis:alert:sent', { alert, responses });
    return responses;
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(
    phoneNumber: string,
    medicationName: string,
    dosage: string,
    time: string,
    userId?: string
  ): Promise<SMSResponse> {
    const template = this.templates.get('medication-reminder');
    if (!template) {
      throw new Error('Medication reminder template not found');
    }

    const message = template.template
      .replace('{medication}', medicationName)
      .replace('{dosage}', dosage)
      .replace('{time}', time);

    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high',
      type: 'medication',
      metadata: { userId }
    });
  }

  /**
   * Send mood tracking reminder
   */
  async sendMoodReminder(
    phoneNumber: string,
    name?: string,
    userId?: string
  ): Promise<SMSResponse> {
    const template = this.templates.get('mood-reminder');
    if (!template) {
      throw new Error('Mood reminder template not found');
    }

    const greeting = name ? `Hi ${name}!` : 'Hello!';
    const message = template.template.replace('{name}', greeting);

    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'medium',
      type: 'mood-check',
      metadata: { userId }
    });
  }

  /**
   * Send therapy appointment reminder
   */
  async sendAppointmentReminder(
    phoneNumber: string,
    therapistName: string,
    appointmentTime: string,
    userId?: string
  ): Promise<SMSResponse> {
    const template = this.templates.get('appointment-reminder');
    if (!template) {
      throw new Error('Appointment reminder template not found');
    }

    const message = template.template
      .replace('{therapist}', therapistName)
      .replace('{time}', appointmentTime);

    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'high',
      type: 'appointment',
      metadata: { userId }
    });
  }

  /**
   * Schedule recurring SMS
   */
  async scheduleRecurringSMS(schedule: Omit<SMSSchedule, 'id'>): Promise<string> {
    const scheduleId = `sched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullSchedule: SMSSchedule = {
      id: scheduleId,
      ...schedule,
      nextSend: this.calculateNextSend(schedule.scheduledTime, schedule.recurrence, schedule.timezone)
    };

    this.schedules.set(scheduleId, fullSchedule);
    this.emit('schedule:created', { scheduleId, schedule: fullSchedule });
    
    return scheduleId;
  }

  /**
   * Cancel scheduled SMS
   */
  async cancelScheduledSMS(scheduleId: string): Promise<boolean> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return false;
    }

    schedule.isActive = false;
    this.schedules.set(scheduleId, schedule);
    this.emit('schedule:cancelled', { scheduleId, schedule });
    
    return true;
  }

  /**
   * Process scheduled messages
   */
  private async processScheduledMessages(): Promise<void> {
    const now = new Date();
    
    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (!schedule.isActive || !schedule.nextSend || schedule.nextSend > now) {
        continue;
      }

      try {
        await this.sendSMS({
          to: schedule.phoneNumber,
          message: schedule.message,
          priority: 'medium',
          type: 'reminder',
          metadata: {
            userId: schedule.userId,
            messageId: `scheduled-${scheduleId}`
          }
        });

        // Update schedule for next occurrence
        schedule.lastSent = now;
        schedule.nextSend = this.calculateNextSend(
          schedule.scheduledTime,
          schedule.recurrence,
          schedule.timezone
        );
        
        this.schedules.set(scheduleId, schedule);
        this.emit('schedule:executed', { scheduleId, schedule });
      } catch (error) {
        this.emit('schedule:error', { scheduleId, schedule, error });
      }
    }
  }

  /**
   * Start the message scheduler
   */
  private startScheduler(): void {
    setInterval(() => {
      this.processScheduledMessages();
    }, 60000); // Check every minute
  }

  /**
   * Calculate next send time for recurring messages
   */
  private calculateNextSend(
    baseTime: Date,
    recurrence?: string,
    timezone = 'UTC'
  ): Date {
    const now = new Date();
    const next = new Date(baseTime);

    switch (recurrence) {
      case 'daily':
        while (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;
      case 'weekly':
        while (next <= now) {
          next.setDate(next.getDate() + 7);
        }
        break;
      case 'monthly':
        while (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
        break;
      default:
        // One-time message
        return baseTime > now ? baseTime : new Date(now.getTime() + 60000);
    }

    return next;
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add default country code if not present
    if (!cleaned.startsWith('1') && this.config.defaultCountryCode) {
      cleaned = this.config.defaultCountryCode + cleaned;
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  /**
   * Map Twilio status to our standard status
   */
  private mapTwilioStatus(twilioStatus: string): 'sent' | 'delivered' | 'failed' | 'pending' {
    switch (twilioStatus) {
      case 'sent':
      case 'queued':
        return 'sent';
      case 'delivered':
        return 'delivered';
      case 'failed':
      case 'undelivered':
        return 'failed';
      default:
        return 'pending';
    }
  }

  /**
   * Get crisis message based on alert type and severity
   */
  private getCrisisMessage(alertType: string, severity: number): string {
    const baseMessages = {
      'suicide-ideation': 'We noticed you might be having thoughts of suicide. You are not alone. Help is available 24/7. Call 988 for immediate support.',
      'self-harm': 'We are concerned about your wellbeing. Please reach out for support. Call 988 or text HOME to 741741.',
      'emergency': 'This is an emergency wellness check. Please contact emergency services (911) or call 988 immediately.',
      'high-risk': 'Your recent activity suggests you may need extra support. Please contact your therapist or call 988.'
    };

    let message = baseMessages[alertType as keyof typeof baseMessages] || baseMessages['high-risk'];
    
    if (severity >= 4) {
      message += ' This is urgent - please seek immediate help.';
    }

    return message;
  }

  /**
   * Get emergency contact message
   */
  private getEmergencyContactMessage(alert: CrisisAlert): string {
    let message = `SATA Mental Health Alert: A person in your emergency contact list may need immediate support. `;
    
    if (alert.alertType === 'suicide-ideation') {
      message += 'Suicide ideation detected. ';
    } else if (alert.alertType === 'emergency') {
      message += 'Emergency situation detected. ';
    }
    
    message += 'Please reach out to them immediately or contact emergency services if needed.';
    
    if (alert.location) {
      message += ` Last known location: ${alert.location.address || `${alert.location.latitude}, ${alert.location.longitude}`}`;
    }

    return message;
  }

  /**
   * Initialize SMS templates
   */
  private initializeTemplates(): void {
    const templates: SMSTemplate[] = [
      {
        type: 'medication-reminder',
        priority: 'high',
        template: '💊 Medication Reminder: Time to take your {medication} ({dosage}) at {time}. Reply TAKEN when complete.',
        variables: ['medication', 'dosage', 'time'],
        maxLength: 160,
        supportedLanguages: ['en', 'es', 'fr']
      },
      {
        type: 'mood-reminder',
        priority: 'medium',
        template: '{name} 🌟 How are you feeling today? Take a moment to check in with your mood. Reply with a number 1-10.',
        variables: ['name'],
        maxLength: 160,
        supportedLanguages: ['en', 'es', 'fr']
      },
      {
        type: 'appointment-reminder',
        priority: 'high',
        template: '📅 Therapy Reminder: Your session with {therapist} is at {time}. Reply CONFIRM or RESCHEDULE.',
        variables: ['therapist', 'time'],
        maxLength: 160,
        supportedLanguages: ['en', 'es', 'fr']
      },
      {
        type: 'crisis-support',
        priority: 'critical',
        template: '🚨 CRISIS SUPPORT: You are not alone. Call 988 (Suicide & Crisis Lifeline) for immediate help. Available 24/7.',
        variables: [],
        maxLength: 160,
        supportedLanguages: ['en', 'es', 'fr']
      },
      {
        type: 'daily-tip',
        priority: 'low',
        template: '💡 Daily Mental Health Tip: {tip} Take care of yourself today! 💪',
        variables: ['tip'],
        maxLength: 160,
        supportedLanguages: ['en', 'es', 'fr']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  /**
   * Rate limiting for SMS requests
   */
  private async executeWithRateLimit<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.rateLimitQueue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process rate limit queue
   */
  private async processQueue(): Promise<void> {
    this.isProcessingQueue = true;

    while (this.rateLimitQueue.length > 0) {
      // Check rate limit (1 message per second for most providers)
      if (Date.now() > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000;
      }

      if (this.requestCount >= 60) {
        const waitTime = this.resetTime - Date.now();
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const operation = this.rateLimitQueue.shift();
      if (operation) {
        this.requestCount++;
        await operation();
        
        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Health check for SMS service
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    provider: string;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Send a test message to a test number (would need to be configured)
      const testMessage: SMSMessage = {
        to: '+1234567890', // Test number
        message: 'Health check - please ignore',
        priority: 'low',
        type: 'general'
      };

      // In a real implementation, you might send to a test number
      // For now, we'll just validate the configuration
      if (!this.config.credentials.accountSid && !this.config.credentials.apiKey) {
        throw new Error('SMS provider not properly configured');
      }

      const latency = Date.now() - startTime;
      
      this.emit('health:check:success', { latency, provider: this.config.provider });
      return {
        isHealthy: true,
        provider: this.config.provider,
        latency
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.emit('health:check:failed', { latency, error, provider: this.config.provider });
      return {
        isHealthy: false,
        provider: this.config.provider,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get SMS delivery statistics
   */
  getDeliveryStats(): {
    totalSent: number;
    delivered: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  } {
    // In a real implementation, this would query your database
    // For now, return mock data
    return {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      deliveryRate: 0
    };
  }
}

export default SMSGateway;
