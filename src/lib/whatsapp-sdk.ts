/**
 * WhatsApp SDK Mock for Testing
 * Provides mock functions for WhatsApp Business API integration
 */

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'interactive';
  text?: { body: string };
  template?: { name: string; language: { code: string }; components?: any[] };
  interactive?: { type: string; body?: any; action?: any };
}

export interface WhatsAppWebhook {
  object: string;
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  field: string;
  value: {
    messaging_product: string;
    metadata: { display_phone_number: string; phone_number_id: string };
    messages?: WhatsAppIncomingMessage[];
    statuses?: WhatsAppMessageStatus[];
  };
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'audio' | 'button' | 'document' | 'image' | 'interactive' | 'video';
  text?: { body: string };
  button?: { text: string; payload: string };
  interactive?: { type: string; button_reply?: { id: string; title: string } };
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

/**
 * Send a text message via WhatsApp Business API
 */
export async function sendMessage(
  phoneNumber: string, 
  message: string, 
  phoneNumberId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // In production, this would make actual API calls to WhatsApp Business API
    console.log(`[MOCK] Sending message to ${phoneNumber}: ${message}`);
    
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send a template message via WhatsApp Business API
 */
export async function sendTemplate(
  phoneNumber: string,
  templateName: string,
  language: string = 'en',
  components?: any[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`[MOCK] Sending template ${templateName} to ${phoneNumber} in ${language}`);
    
    return {
      success: true,
      messageId: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send an interactive message (buttons, lists, etc.)
 */
export async function sendInteractive(
  phoneNumber: string,
  interactiveData: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`[MOCK] Sending interactive message to ${phoneNumber}:`, interactiveData);
    
    return {
      success: true,
      messageId: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Mark a message as read
 */
export async function markAsRead(
  messageId: string,
  phoneNumberId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[MOCK] Marking message ${messageId} as read`);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get media URL from WhatsApp
 */
export async function getMediaUrl(mediaId: string): Promise<{ url?: string; error?: string }> {
  try {
    console.log(`[MOCK] Getting media URL for ${mediaId}`);
    
    return {
      url: `https://mock-whatsapp-media.com/${mediaId}`
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // In production, this would verify the actual webhook signature
  console.log(`[MOCK] Verifying webhook signature`);
  return true;
}

/**
 * Parse incoming webhook data
 */
export function parseWebhookData(webhookData: WhatsAppWebhook): {
  messages: WhatsAppIncomingMessage[];
  statuses: WhatsAppMessageStatus[];
} {
  const messages: WhatsAppIncomingMessage[] = [];
  const statuses: WhatsAppMessageStatus[] = [];

  webhookData.entry.forEach(entry => {
    entry.changes.forEach(change => {
      if (change.value.messages) {
        messages.push(...change.value.messages);
      }
      if (change.value.statuses) {
        statuses.push(...change.value.statuses);
      }
    });
  });

  return { messages, statuses };
}

export default {
  sendMessage,
  sendTemplate,
  sendInteractive,
  markAsRead,
  getMediaUrl,
  verifyWebhookSignature,
  parseWebhookData
};
