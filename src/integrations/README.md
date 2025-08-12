# SATA Integration Services

Comprehensive external service integrations for the SATA mental health platform. This module provides a complete suite of integrations for messaging, analytics, translation, notifications, mental health providers, QR code generation, and monitoring.

## 🚀 Overview

The SATA Integration Services module includes 7 major integration components:

1. **WhatsApp Business API** - Messaging and crisis support
2. **Azure Cognitive Services** - Sentiment analysis and mental health insights
3. **Google Translate API** - Real-time translation with mental health terminology preservation
4. **SMS Gateway** - Multi-provider SMS for critical notifications
5. **Mental Health Provider APIs** - Therapist directories and appointment booking
6. **QR Code Service** - Mental health resource QR codes
7. **Analytics & Monitoring** - Comprehensive analytics with Mixpanel, Google Analytics, and more

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

Each integration service requires specific configuration. Here's how to set up each service:

### WhatsApp Business API

```typescript
import { WhatsAppBusinessAPI } from "./integrations";

const whatsapp = new WhatsAppBusinessAPI({
  businessApiToken: "your_business_api_token",
  webhookSecret: "your_webhook_secret",
  phoneNumberId: "your_phone_number_id",
  enableCrisisDetection: true,
  enableMentalHealthSupport: true,
  mentalHealthKeywords: ["suicide", "depression", "anxiety", "crisis"],
});
```

### Azure Cognitive Services

```typescript
import { AzureCognitiveServices } from "./integrations";

const azure = new AzureCognitiveServices({
  textAnalytics: {
    subscriptionKey: "your_subscription_key",
    endpoint: "your_endpoint",
    region: "your_region",
  },
  enableMentalHealthInsights: true,
  riskThresholds: {
    sentiment: -0.7,
    anxiety: 0.8,
    depression: 0.8,
    suicide: 0.5,
  },
});
```

### Google Translate API

```typescript
import { GoogleTranslateAPI } from "./integrations";

const translate = new GoogleTranslateAPI({
  apiKey: "your_api_key",
  projectId: "your_project_id",
  supportedLanguages: ["en", "es", "fr", "de", "it", "pt"],
  mentalHealthGlossary: {
    enableCustomGlossary: true,
    glossaryId: "mental-health-terms-v1",
  },
});
```

### SMS Gateway

```typescript
import { SMSGateway } from "./integrations";

const sms = new SMSGateway({
  provider: "twilio",
  credentials: {
    accountSid: "your_account_sid",
    authToken: "your_auth_token",
  },
  enableCrisisAlerts: true,
  enableMedicationReminders: true,
});
```

### Mental Health Provider APIs

```typescript
import { MentalHealthProviderAPI } from "./integrations";

const providers = new MentalHealthProviderAPI();
// Configuration is done via environment variables or individual provider setup
```

### QR Code Service

```typescript
import { QRCodeService } from "./integrations";

const qr = new QRCodeService({
  enableMentalHealthQR: true,
  enableAnalytics: true,
  storage: {
    provider: "aws-s3",
    bucket: "your-qr-codes-bucket",
    region: "us-east-1",
  },
});
```

### Analytics & Monitoring

```typescript
import { AnalyticsMonitoring } from "./integrations";

const analytics = new AnalyticsMonitoring({
  providers: {
    mixpanel: {
      token: "your_mixpanel_token",
      apiSecret: "your_api_secret",
      projectId: "your_project_id",
    },
    googleAnalytics: {
      measurementId: "your_measurement_id",
      apiSecret: "your_api_secret",
      propertyId: "your_property_id",
    },
  },
  mentalHealthCompliance: {
    hipaaCompliant: true,
    anonymizeHealthData: true,
    encryptSensitiveEvents: true,
  },
});
```

## 🏗️ Integration Manager

Use the `SATAIntegrationManager` to orchestrate all services:

```typescript
import {
  SATAIntegrationManager,
  WhatsAppBusinessAPI,
  AnalyticsMonitoring,
} from "./integrations";

const manager = new SATAIntegrationManager();

// Add services
const whatsapp = new WhatsAppBusinessAPI(whatsappConfig);
const analytics = new AnalyticsMonitoring(analyticsConfig);

manager.addService("whatsapp", whatsapp);
manager.addService("analytics", analytics);

// Start health monitoring
manager.startHealthMonitoring(5); // Check every 5 minutes

// Get service
const whatsappService = manager.getService<WhatsAppBusinessAPI>("whatsapp");

// Check health
const healthStatus = await manager.getHealthStatus();
console.log("Service Health:", Array.from(healthStatus.values()));

// Get metrics
const metrics = manager.getMetrics();
console.log("Integration Metrics:", metrics);
```

## 🧠 Mental Health Features

All integrations include specialized mental health features:

### Crisis Detection

- Automatic crisis keyword detection
- Risk level assessment
- Immediate intervention triggers
- Crisis hotline integration

### HIPAA Compliance

- Data anonymization
- Encrypted sensitive events
- Audit trail logging
- Consent management

### Mental Health Analytics

- Mood trend tracking
- Therapy session metrics
- Crisis event monitoring
- Outcome measurements

### Multilingual Support

- Mental health terminology preservation
- Crisis message translation
- Culturally appropriate responses

## 📊 Event Tracking

Track mental health specific events:

```typescript
// Track mood entry
await analytics.trackMoodEntry(userId, {
  mood: 7,
  emotions: ["happy", "calm"],
  notes: "Feeling better today",
  triggers: ["exercise", "meditation"],
});

// Track therapy session
await analytics.trackTherapySession({
  sessionId: "session_123",
  userId: "user_456",
  therapistId: "therapist_789",
  sessionType: "video",
  duration: 50,
  completed: true,
  rating: 5,
});

// Track crisis event
await analytics.trackCrisisEvent(userId, {
  riskLevel: "high",
  triggerSource: "text_analysis",
  interventionTriggered: true,
  responseTime: 45,
});
```

## 🔍 Health Monitoring

All services include comprehensive health monitoring:

```typescript
// Individual service health check
const whatsappHealth = await whatsapp.healthCheck();
console.log("WhatsApp Status:", whatsappHealth);

// Manager-level health monitoring
const allHealth = await manager.getHealthStatus();
for (const [service, status] of allHealth) {
  console.log(`${service}: ${status.isHealthy ? "✅" : "❌"}`);
}

// Restart unhealthy services
await manager.restartUnhealthyServices();
```

## 🚨 Crisis Management

Automated crisis detection and response:

```typescript
// Crisis detection in WhatsApp
whatsapp.on("crisis:detected", async (data) => {
  console.log("Crisis detected:", data);

  // Trigger SMS alert
  await sms.sendCrisisAlert(data.phoneNumber, {
    riskLevel: data.riskLevel,
    message: data.message,
    timestamp: data.timestamp,
  });

  // Log crisis event
  await analytics.trackCrisisEvent(data.userId, {
    riskLevel: data.riskLevel,
    triggerSource: "whatsapp_message",
    interventionTriggered: true,
  });
});
```

## 📱 QR Code Generation

Generate mental health specific QR codes:

```typescript
// Crisis hotline QR code
const crisisQR = await qr.generateCrisisHotlineQR({
  hotlineNumber: "988",
  emergencyText: "URGENT: Crisis Support",
  styling: { backgroundColor: "#FF0000", foregroundColor: "#FFFFFF" },
});

// Therapy session QR code
const sessionQR = await qr.generateTherapySessionQR({
  sessionId: "session_123",
  joinUrl: "https://therapy.sata.com/session/123",
  sessionTime: new Date(),
  requiresAuth: true,
});

// Mood tracker QR code
const moodQR = await qr.generateMoodTrackerQR({
  userId: "user_456",
  quickEntry: true,
  defaultMood: 5,
  styling: { backgroundColor: "#4CAF50" },
});
```

## 🔄 Event-Driven Architecture

All services use EventEmitter for real-time events:

```typescript
// WhatsApp events
whatsapp.on("message:received", (data) => console.log("New message:", data));
whatsapp.on("crisis:detected", (data) => console.log("Crisis detected:", data));

// Azure events
azure.on("analysis:completed", (data) => console.log("Analysis done:", data));
azure.on("risk:detected", (data) => console.log("Risk detected:", data));

// SMS events
sms.on("message:sent", (data) => console.log("SMS sent:", data));
sms.on("delivery:confirmed", (data) => console.log("SMS delivered:", data));

// Analytics events
analytics.on("event:sent", (data) =>
  console.log("Analytics event sent:", data)
);
analytics.on("alert:triggered", (data) =>
  console.log("Alert triggered:", data)
);
```

## 🔒 Security & Privacy

### HIPAA Compliance

- All sensitive data is encrypted
- Audit trails for all operations
- Consent management
- Data anonymization options

### Rate Limiting

- Configurable rate limits per service
- Queue management for high-volume scenarios
- Backoff strategies for API limits

### Error Handling

- Comprehensive error handling and logging
- Automatic retry mechanisms
- Graceful degradation

## 📈 Analytics & Metrics

Comprehensive mental health analytics:

### User Metrics

- Mood trends and patterns
- Engagement scores
- Feature usage analytics
- Retention rates

### Clinical Metrics

- Assessment score improvements
- Therapy session outcomes
- Crisis intervention success rates
- Medication adherence

### System Metrics

- Service health and uptime
- Response times
- Error rates
- Integration success rates

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 📋 Environment Variables

Required environment variables for production deployment:

```env
# WhatsApp Business API
WHATSAPP_BUSINESS_TOKEN=your_token
WHATSAPP_WEBHOOK_SECRET=your_secret
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Azure Cognitive Services
AZURE_SUBSCRIPTION_KEY=your_key
AZURE_ENDPOINT=your_endpoint
AZURE_REGION=your_region

# Google Translate
GOOGLE_TRANSLATE_API_KEY=your_key
GOOGLE_PROJECT_ID=your_project_id

# SMS Providers
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Analytics
MIXPANEL_TOKEN=your_token
MIXPANEL_API_SECRET=your_secret
GA_MEASUREMENT_ID=your_id
GA_API_SECRET=your_secret

# Storage
AWS_S3_BUCKET=your_bucket
AWS_S3_REGION=your_region
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the SATA development team
- Check the documentation wiki

## 🔗 Related Documentation

- [SATA Platform Overview](../README.md)
- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guidelines](./docs/security.md)
