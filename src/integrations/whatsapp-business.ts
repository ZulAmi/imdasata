/**
 * WhatsApp Business API Integration for SATA
 * Handles messaging, notifications, and mental health support conversations
 */

import { EventEmitter } from 'events';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  webhookVerifyToken: string;
  apiVersion: string;
  businessAccountId: string;
  baseUrl: string;
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive' | 'image' | 'document' | 'audio';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
  interactive?: {
    type: 'button' | 'list';
    header?: any;
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: any;
  };
  image?: {
    link?: string;
    id?: string;
    caption?: string;
  };
  document?: {
    link?: string;
    id?: string;
    caption?: string;
    filename?: string;
  };
  audio?: {
    link?: string;
    id?: string;
  };
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
          context?: {
            from: string;
            id: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description: string;
            };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface MentalHealthTemplate {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}

class WhatsAppBusinessAPI extends EventEmitter {
  private config: WhatsAppConfig;
  private rateLimitQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private requestCount = 0;
  private resetTime = Date.now() + 3600000; // 1 hour

  constructor(config: WhatsAppConfig) {
    super();
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://graph.facebook.com',
      apiVersion: config.apiVersion || 'v18.0'
    };
  }

  /**
   * Send a message via WhatsApp Business API
   */
  async sendMessage(message: WhatsAppMessage): Promise<any> {
    return this.executeWithRateLimit(async () => {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...message
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      this.emit('message:sent', { message, result });
      return result;
    });
  }

  /**
   * Send a simple text message
   */
  async sendTextMessage(to: string, text: string, previewUrl = false): Promise<any> {
    return this.sendMessage({
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl
      }
    });
  }

  /**
   * Send a template message for mental health support
   */
  async sendMentalHealthTemplate(
    to: string, 
    templateName: string, 
    language = 'en', 
    components?: any[]
  ): Promise<any> {
    return this.sendMessage({
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: language },
        components: components || []
      }
    });
  }

  /**
   * Send an interactive button message for mental health options
   */
  async sendMentalHealthOptions(to: string, bodyText: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'mood_check',
                title: '😊 Mood Check'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'breathing_exercise',
                title: '🫁 Breathing'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'crisis_support',
                title: '🚨 Crisis Help'
              }
            }
          ]
        }
      }
    });
  }

  /**
   * Send crisis support message with quick actions
   */
  async sendCrisisSupport(to: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '🚨 CRISIS SUPPORT'
        },
        body: {
          text: 'You are not alone. Immediate help is available:'
        },
        footer: {
          text: 'SATA Mental Health Platform'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'call_hotline',
                title: '📞 Call Hotline'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'chat_counselor',
                title: '💬 Chat Support'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'emergency_contacts',
                title: '👥 Emergency Contacts'
              }
            }
          ]
        }
      }
    });
  }

  /**
   * Send mood tracking reminder
   */
  async sendMoodReminder(to: string, name?: string): Promise<any> {
    const greeting = name ? `Hi ${name}!` : 'Hello!';
    return this.sendMentalHealthTemplate(
      to,
      'mood_tracking_reminder',
      'en',
      [
        {
          type: 'body',
          parameters: [{ type: 'text', text: greeting }]
        }
      ]
    );
  }

  /**
   * Send daily mental health tip
   */
  async sendDailyTip(to: string, tip: string): Promise<any> {
    return this.sendTextMessage(
      to,
      `🌟 Daily Mental Health Tip:\n\n${tip}\n\n💪 Take care of yourself today!`
    );
  }

  /**
   * Send medication reminder
   */
  async sendMedicationReminder(
    to: string, 
    medicationName: string, 
    dosage: string, 
    time: string
  ): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '💊 Medication Reminder'
        },
        body: {
          text: `Time to take your ${medicationName} (${dosage}) at ${time}`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'taken',
                title: '✅ Taken'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'skip',
                title: '⏰ Skip'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'snooze',
                title: '🔔 Snooze 15min'
              }
            }
          ]
        }
      }
    });
  }

  /**
   * Handle incoming webhook messages
   */
  handleWebhook(payload: WhatsAppWebhookPayload): void {
    try {
      payload.entry.forEach(entry => {
        entry.changes.forEach(change => {
          if (change.field === 'messages') {
            const { messages, contacts, statuses } = change.value;

            // Handle incoming messages
            if (messages) {
              messages.forEach(message => {
                this.processIncomingMessage(message, contacts);
              });
            }

            // Handle message status updates
            if (statuses) {
              statuses.forEach(status => {
                this.emit('message:status', status);
              });
            }
          }
        });
      });
    } catch (error) {
      this.emit('webhook:error', error);
    }
  }

  /**
   * Process incoming message and route to appropriate handler
   */
  private processIncomingMessage(message: any, contacts?: any[]): void {
    const contact = contacts?.find(c => c.wa_id === message.from);
    const userProfile = contact ? { name: contact.profile.name, phone: contact.wa_id } : null;

    // Detect message intent
    const intent = this.detectMentalHealthIntent(message);
    
    this.emit('message:received', {
      message,
      userProfile,
      intent,
      timestamp: new Date(parseInt(message.timestamp) * 1000)
    });

    // Auto-respond based on intent
    this.handleMentalHealthIntent(message.from, intent, message);
  }

  /**
   * Detect mental health related intent from message
   */
  private detectMentalHealthIntent(message: any): string {
    if (message.interactive?.button_reply) {
      return message.interactive.button_reply.id;
    }

    if (message.text?.body) {
      const text = message.text.body.toLowerCase();
      
      // Crisis keywords
      const crisisKeywords = ['help', 'crisis', 'suicide', 'emergency', 'hurt myself', 'end it all'];
      if (crisisKeywords.some(keyword => text.includes(keyword))) {
        return 'crisis';
      }

      // Mood keywords
      const moodKeywords = ['mood', 'feeling', 'emotion', 'sad', 'happy', 'anxious', 'depressed'];
      if (moodKeywords.some(keyword => text.includes(keyword))) {
        return 'mood_inquiry';
      }

      // Support keywords
      const supportKeywords = ['talk', 'listen', 'support', 'therapy', 'counseling'];
      if (supportKeywords.some(keyword => text.includes(keyword))) {
        return 'support_request';
      }

      // Medication keywords
      const medicationKeywords = ['medication', 'pills', 'medicine', 'dose', 'prescription'];
      if (medicationKeywords.some(keyword => text.includes(keyword))) {
        return 'medication_inquiry';
      }
    }

    return 'general';
  }

  /**
   * Handle different mental health intents with appropriate responses
   */
  private async handleMentalHealthIntent(to: string, intent: string, message: any): Promise<void> {
    try {
      switch (intent) {
        case 'crisis':
          await this.sendCrisisSupport(to);
          break;

        case 'mood_check':
          await this.sendMoodCheckIn(to);
          break;

        case 'breathing_exercise':
          await this.sendBreathingGuide(to);
          break;

        case 'mood_inquiry':
          await this.sendMentalHealthOptions(to, 'I understand you want to talk about your mood. How can I help you today?');
          break;

        case 'support_request':
          await this.sendSupportOptions(to);
          break;

        case 'medication_inquiry':
          await this.sendMedicationInfo(to);
          break;

        default:
          await this.sendGeneralMentalHealthInfo(to);
      }
    } catch (error) {
      this.emit('intent:error', { intent, error, message });
    }
  }

  /**
   * Send mood check-in interactive message
   */
  private async sendMoodCheckIn(to: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: '😊 Mood Check-In'
        },
        body: {
          text: 'How are you feeling right now? Select your current mood:'
        },
        action: {
          button: 'Select Mood',
          sections: [
            {
              title: 'Your Mood',
              rows: [
                { id: 'very_happy', title: '😄 Very Happy', description: 'Feeling great and energetic' },
                { id: 'happy', title: '😊 Happy', description: 'Feeling good and positive' },
                { id: 'neutral', title: '😐 Neutral', description: 'Feeling okay, neither good nor bad' },
                { id: 'sad', title: '😢 Sad', description: 'Feeling down or upset' },
                { id: 'very_sad', title: '😭 Very Sad', description: 'Feeling very low or distressed' }
              ]
            }
          ]
        }
      }
    });
  }

  /**
   * Send breathing exercise guide
   */
  private async sendBreathingGuide(to: string): Promise<any> {
    const messages = [
      'Let\'s do a simple breathing exercise together. 🫁',
      'Find a comfortable position and follow along:',
      '1️⃣ Breathe in slowly for 4 counts... 1, 2, 3, 4',
      '2️⃣ Hold your breath for 4 counts... 1, 2, 3, 4',
      '3️⃣ Breathe out slowly for 6 counts... 1, 2, 3, 4, 5, 6',
      '4️⃣ Repeat this cycle 3 more times',
      'Great job! 👏 How do you feel now?'
    ];

    for (let i = 0; i < messages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 3000)); // Stagger messages
      await this.sendTextMessage(to, messages[i]);
    }
  }

  /**
   * Send support options
   */
  private async sendSupportOptions(to: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: 'I\'m here to support you. Choose how you\'d like to get help:'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'chat_ai',
                title: '🤖 AI Chat Support'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'human_counselor',
                title: '👨‍⚕️ Human Counselor'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'resources',
                title: '📚 Self-Help Resources'
              }
            }
          ]
        }
      }
    });
  }

  /**
   * Send medication information and tracking
   */
  private async sendMedicationInfo(to: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: {
          type: 'text',
          text: '💊 Medication Support'
        },
        body: {
          text: 'I can help you with medication-related questions and reminders:'
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'set_reminder',
                title: '⏰ Set Reminder'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'track_doses',
                title: '📝 Track Doses'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'side_effects',
                title: '⚠️ Side Effects'
              }
            }
          ]
        }
      }
    });
  }

  /**
   * Send general mental health information
   */
  private async sendGeneralMentalHealthInfo(to: string): Promise<any> {
    return this.sendMentalHealthOptions(
      to,
      'Welcome to SATA Mental Health Support! 🌟\n\nI\'m here to help you with your mental wellness journey. What would you like to do today?'
    );
  }

  /**
   * Rate limiting for API requests
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
      // Check rate limit (1000 requests per hour)
      if (Date.now() > this.resetTime) {
        this.requestCount = 0;
        this.resetTime = Date.now() + 3600000;
      }

      if (this.requestCount >= 1000) {
        const waitTime = this.resetTime - Date.now();
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      const operation = this.rateLimitQueue.shift();
      if (operation) {
        this.requestCount++;
        await operation();
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Verify webhook signature for security
   */
  verifyWebhook(signature: string, payload: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookVerifyToken)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Create mental health message templates
   */
  getMentalHealthTemplates(): MentalHealthTemplate[] {
    return [
      {
        name: 'mood_tracking_reminder',
        category: 'UTILITY',
        language: 'en',
        components: [
          {
            type: 'BODY',
            text: '{{1}} 🌟 It\'s time for your daily mood check-in. How are you feeling today? Your mental health matters!'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: 'Check Mood Now'
              }
            ]
          }
        ]
      },
      {
        name: 'therapy_appointment_reminder',
        category: 'UTILITY',
        language: 'en',
        components: [
          {
            type: 'HEADER',
            format: 'TEXT',
            text: '📅 Therapy Appointment Reminder'
          },
          {
            type: 'BODY',
            text: 'Your therapy session with {{1}} is scheduled for {{2}} at {{3}}. Remember to prepare any topics you\'d like to discuss.'
          },
          {
            type: 'FOOTER',
            text: 'SATA Mental Health Platform'
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: 'Confirm Appointment'
              },
              {
                type: 'QUICK_REPLY',
                text: 'Reschedule'
              }
            ]
          }
        ]
      }
    ];
  }
}

export default WhatsAppBusinessAPI;
