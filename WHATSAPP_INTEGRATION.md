# SATA WhatsApp Mental Wellness Bot

A comprehensive WhatsApp conversation routing system for mental health support, designed for Southeast Asian migrant workers.

## Features

### 🤖 Intelligent Message Routing

- **Crisis Intervention**: Automatic detection of crisis keywords in multiple languages (EN, ZH, BN, TA, MY, ID)
- **Flow Management**: Seamless transitions between different conversation flows
- **Session Management**: Persistent user sessions with context preservation
- **Multi-language Support**: Localized responses for diverse user base

### 🧠 Mental Health Tools

- **PHQ-4 Assessment**: Complete depression and anxiety screening with scoring
- **Daily Check-ins**: Mood tracking and wellness monitoring
- **Resource Library**: Browsable mental health resources with categorization
- **Peer Support**: Group connections and buddy system integration

### 💬 Conversation Flows

#### 1. Onboarding Flow (`onboarding-flow.ts`)

- Welcome new users with privacy-first approach
- Language selection and demographic collection
- Gamified progress tracking
- Complete user profile setup

#### 2. Assessment Flow (`assessment-flow.ts`)

- PHQ-4 mental health screening
- Intelligent question sequencing
- Severity classification and recommendations
- Service referrals based on scores

#### 3. Resource Flow (`resource-flow.ts`)

- Browse resources by category
- Save and share functionality
- Detailed resource information
- Usage tracking and analytics

#### 4. Message Router (`message-router-clean.ts`)

- Main conversation coordinator
- Crisis keyword detection
- Route determination logic
- Session state management

## Technical Architecture

### Backend Components

```
src/lib/whatsapp/flows/
├── message-router-clean.ts     # Main routing system
├── onboarding-flow.ts          # New user registration
├── assessment-flow.ts          # PHQ-4 implementation
└── resource-flow.ts            # Resource management
```

### API Endpoints

```
src/app/api/whatsapp/
└── webhook/
    └── route.ts               # Twilio webhook handler
```

### Database Integration

- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Production-ready data storage
- **Models**: AnonymousUser, PHQ4Assessment, MentalHealthResource, SupportGroup

## Setup Instructions

### 1. Environment Configuration

Create `.env.local` from `.env.example`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_whatsapp_number

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/sata_db"
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed
```

### 3. Twilio Configuration

1. Get WhatsApp sandbox number from Twilio Console
2. Configure webhook URL: `https://your-domain.com/api/whatsapp/webhook`
3. Set HTTP method to POST
4. Enable status callbacks (optional)

### 4. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Use ngrok for webhook testing
npx ngrok http 3000
```

## Crisis Intervention

The system includes comprehensive crisis detection:

### Keyword Detection

- **Multi-language**: Covers EN, ZH, BN, TA, MY, ID
- **Context-aware**: Considers message context and user history
- **Immediate Response**: Instant crisis intervention protocols

### Safety Features

- 24/7 hotline integration
- Emergency contact protocols
- Professional referral system
- Follow-up scheduling

## Conversation Flow Examples

### New User Experience

```
User: "Hi"
Bot: "🌟 Welcome to SATA Mental Wellness Assistant!
     I'm here to support your mental health journey.
     Let's start by selecting your preferred language..."
```

### Assessment Initiation

```
User: "I want to check my mental health"
Bot: "📋 I'll guide you through a brief 4-question assessment
     to better understand how you're feeling..."
```

### Resource Request

```
User: "I need help with anxiety"
Bot: "📚 Here are anxiety resources available:
     1. 🧘 Mindfulness Techniques
     2. 🏥 Professional Services
     3. 📞 Crisis Hotlines..."
```

## Localization

### Supported Languages

- **English (EN)**: Primary language
- **Chinese (ZH)**: Simplified Chinese for Chinese migrants
- **Bengali (BN)**: For Bangladeshi workers
- **Tamil (TA)**: For Tamil-speaking migrants
- **Myanmar (MY)**: For Myanmar migrant workers
- **Indonesian (ID)**: For Indonesian workers

### Text Management

All user-facing text is managed through the `getLocalizedText()` method in the message router, making it easy to add new languages or update existing translations.

## Production Considerations

### Scalability

- Session management with Redis (recommended)
- Database connection pooling
- Rate limiting for abuse prevention
- Message queue for high-volume processing

### Security

- Input validation and sanitization
- Crisis alert logging and monitoring
- User privacy protection
- Secure webhook verification

### Monitoring

- Conversation flow analytics
- Crisis intervention tracking
- User engagement metrics
- System performance monitoring

## Contributing

This system is designed to be extensible. To add new conversation flows:

1. Create a new flow handler in `src/lib/whatsapp/flows/`
2. Implement the standard flow interface
3. Add route detection logic to `message-router-clean.ts`
4. Update localization texts for all supported languages

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
