import twilio from 'twilio';

export class WhatsAppService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!;
    
    this.client = twilio(accountSid, authToken);
  }

  async sendMessage(to: string, message: string): Promise<void> {
    try {
      await this.client.messages.create({
        body: message,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendQuickReplies(to: string, message: string, replies: string[]): Promise<void> {
    const formattedMessage = `${message}\n\n${replies.map((reply, index) => `${index + 1}. ${reply}`).join('\n')}`;
    await this.sendMessage(to, formattedMessage);
  }

  async sendInteractiveButtons(to: string, message: string, buttons: Array<{id: string, title: string}>): Promise<void> {
    const formattedMessage = `${message}\n\n${buttons.map((button, index) => `${index + 1}. ${button.title}`).join('\n')}`;
    await this.sendMessage(to, formattedMessage);
  }

  async sendMediaMessage(to: string, mediaUrl: string, caption?: string): Promise<void> {
    try {
      await this.client.messages.create({
        mediaUrl: [mediaUrl],
        body: caption,
        from: `whatsapp:${this.fromNumber}`,
        to: `whatsapp:${to}`
      });
    } catch (error) {
      console.error('Error sending WhatsApp media:', error);
      throw error;
    }
  }
}