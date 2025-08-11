# SATA - Sentiment Analysis Therapy Assistant

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Azure](https://img.shields.io/badge/Azure-Cognitive%20Services-blue)](https://azure.microsoft.com/services/cognitive-services/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> A comprehensive AI-powered mental health platform designed specifically for migrant workers, combining voice sentiment analysis, peer support systems, and clinical-grade reporting for mental health professionals and individuals seeking emotional wellbeing support.

## 🌟 Overview

SATA is a privacy-first mental health platform that leverages advanced AI technologies to provide culturally sensitive support for migrant workers and vulnerable populations. The platform integrates voice sentiment analysis, comprehensive mood tracking, peer support systems, and professional healthcare reporting in a unified, accessible interface.

## 🎯 Key Features

### 🎙️ Advanced Voice Sentiment Analysis

- **Real-time emotion detection** using Azure Cognitive Services
- **Multi-language support** (English, Chinese, Bengali, Tamil, Myanmar, Indonesian, Thai, Vietnamese)
- **Stress indicator identification** and mental health keyword extraction
- **Privacy-first processing** with on-device capabilities where possible
- **Cultural context awareness** for accent and dialect recognition

### 😊 Comprehensive Mood Tracking System

- **Emoji-based mood selection** with intuitive 10-point scale
- **Voice note integration** with automatic sentiment correlation
- **Multi-modal input** supporting text, voice, and contextual tags
- **Real-time trend visualization** with pattern recognition algorithms
- **Personalized AI insights** with actionable recommendations
- **Healthcare provider export** in multiple professional formats

### 👥 Peer Support & Community Systems

- **Smart buddy pairing** based on compatibility algorithms
- **Group chat functionality** with language and interest-based matching
- **Moderation dashboard** with automated content filtering
- **Safety reporting mechanisms** with real-time intervention protocols
- **Gamification system** with achievements and trust scoring

### 🏥 Clinical-Grade Healthcare Integration

- **HIPAA-compliant reporting** with professional clinical formatting
- **Assessment integration** (PHQ-4, GAD-7, custom scales)
- **Automated report generation** (weekly, monthly, compliance audits)
- **Risk assessment algorithms** with proactive intervention triggers
- **Healthcare provider dashboards** with patient progress tracking

### 🎮 Engagement & Gamification

- **Comprehensive point system** rewarding healthy behaviors
- **Achievement badges** for consistent engagement
- **Streak tracking** for daily habits and assessments
- **QR code rewards** for real-world benefit redemption
- **Leaderboards** with privacy controls

### 📊 Advanced Analytics & Reporting

- **Real-time engagement tracking** with behavioral pattern analysis
- **Automated report generation** for administrators and healthcare providers
- **Resource utilization analytics** with gap analysis
- **Intervention effectiveness measurement** with outcome tracking
- **Compliance monitoring** with privacy audit capabilities

## 🏗️ Technical Architecture

### Frontend Technologies

```
React 18 + TypeScript     → Type-safe component development
Next.js 14.2.15           → Full-stack framework with SSR/SSG
Tailwind CSS              → Responsive design system
Chart.js/Recharts         → Advanced data visualization
Web Audio API             → Voice recording and processing
WebRTC                    → Secure peer-to-peer communication
```

### Backend & AI Integration

```
Azure Cognitive Services  → Voice analysis and NLP
EventEmitter Architecture → Real-time data processing
LocalStorage/IndexedDB    → Client-side data persistence
RESTful API Design        → Healthcare provider integration
Service Workers           → Push notifications and offline support
```

### AI/ML Components

```
Natural Language Processing → Text sentiment analysis
Voice Recognition          → Emotional tone detection
Pattern Recognition        → Mood trend analysis
Machine Learning Models    → Personalized insight generation
Statistical Analysis       → Confidence scoring and prediction
```

## 📁 Project Structure

```
SATA/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── PeerChatInterface.tsx           # Peer support chat system
│   │   │   └── BuddyInterface.tsx              # Buddy pairing interface
│   │   ├── VoiceAnalysisInterface.tsx          # Voice recording and analysis
│   │   ├── MoodLoggingInterface.tsx            # Comprehensive mood tracking
│   │   ├── MoodTrendsVisualization.tsx         # Data visualization
│   │   ├── GamificationInterface.tsx           # Points and achievements
│   │   ├── EngagementAnalyticsDashboard.tsx    # Analytics dashboard
│   │   ├── AdminDashboard.tsx                  # Administrative interface
│   │   └── ReportingEngine.tsx                 # Automated report generation
│   ├── lib/
│   │   ├── voice-sentiment-analyzer.ts         # Core voice analysis engine
│   │   ├── mood-analytics-engine.ts            # Advanced mood analytics
│   │   ├── peer-chat-system.ts                 # Peer support logic
│   │   ├── buddy-system.ts                     # Buddy matching algorithms
│   │   ├── gamification-system.ts              # Points and achievements
│   │   ├── engagement-tracker.ts               # User engagement analytics
│   │   ├── azure-cognitive-services.ts         # Azure AI integration
│   │   └── resources-directory.ts              # Mental health resources
│   ├── pages/
│   │   ├── index.tsx                           # Main landing page
│   │   ├── voice-analysis.tsx                  # Voice sentiment demo
│   │   ├── mood-dashboard.tsx                  # Mood tracking dashboard
│   │   ├── peer-support-chat.tsx               # Peer chat interface
│   │   ├── buddy-system.tsx                    # Buddy pairing system
│   │   ├── gamification.tsx                    # Gamification dashboard
│   │   ├── reports.tsx                         # Automated reporting
│   │   ├── analytics-hub.tsx                   # Comprehensive analytics
│   │   ├── admin-dashboard.tsx                 # Admin interface
│   │   └── resources-admin.tsx                 # Resource management
│   └── types/
│       ├── mood-types.ts                       # Mood tracking types
│       ├── peer-support-types.ts               # Peer support types
│       └── gamification-types.ts               # Gamification types
├── public/
│   ├── sw-*.js                                 # Service workers
│   └── manifest.json                           # PWA configuration
├── docs/
│   ├── ADMIN_DASHBOARD_README.md               # Admin documentation
│   ├── REPORTING_SYSTEM_DOCS.md                # Reporting documentation
│   └── API_DOCUMENTATION.md                    # API reference
└── .github/
    └── copilot-instructions.md                 # Development guidelines
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Azure Cognitive Services account
- Modern web browser with microphone access

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/sata.git
   cd sata
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file:

   ```env
   # Azure Cognitive Services
   AZURE_SPEECH_KEY=your_azure_speech_key
   AZURE_SPEECH_REGION=your_azure_region
   AZURE_TEXT_ANALYTICS_KEY=your_text_analytics_key
   AZURE_TEXT_ANALYTICS_ENDPOINT=your_text_analytics_endpoint

   # Application Settings
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_PRIVACY_MODE=true
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application**
   - Main Platform: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/admin-login`
   - Reports System: `http://localhost:3000/reports`

## 📱 Platform Features

### User-Facing Applications

| Feature                | Endpoint             | Description                            |
| ---------------------- | -------------------- | -------------------------------------- |
| **Voice Analysis**     | `/voice-analysis`    | AI-powered voice sentiment analysis    |
| **Mood Dashboard**     | `/mood-dashboard`    | Comprehensive mood tracking and trends |
| **Peer Support**       | `/peer-support-chat` | Community chat with language matching  |
| **Buddy System**       | `/buddy-system`      | One-on-one peer support pairing        |
| **Gamification**       | `/gamification`      | Points, achievements, and rewards      |
| **Resource Directory** | `/resources`         | Mental health services and information |

### Administrative Interfaces

| Feature                | Endpoint              | Description                      |
| ---------------------- | --------------------- | -------------------------------- |
| **Admin Dashboard**    | `/admin-dashboard`    | Real-time platform monitoring    |
| **Reports System**     | `/reports`            | Automated report generation      |
| **Analytics Hub**      | `/analytics-hub`      | Comprehensive platform analytics |
| **Chat Moderation**    | `/chat-moderation`    | Peer support moderation tools    |
| **Buddy Admin**        | `/buddy-admin`        | Buddy system management          |
| **Resources Admin**    | `/resources-admin`    | Resource directory management    |
| **Gamification Admin** | `/gamification-admin` | Points and rewards management    |

## 🔧 Core Functionality

### Voice Sentiment Analysis Workflow

1. **Audio Capture**: High-quality recording with noise reduction
2. **Azure Processing**: Speech-to-text with emotional tone analysis
3. **Sentiment Extraction**: Multi-dimensional emotion scoring
4. **Pattern Recognition**: Historical trend analysis and anomaly detection
5. **Insight Generation**: Personalized recommendations and interventions

### Peer Support System

1. **Smart Matching**: Algorithm-based pairing by language, interests, experience
2. **Group Formation**: Auto-creation of support groups with moderation
3. **Safety Mechanisms**: Real-time content filtering and reporting systems
4. **Engagement Tracking**: Interaction quality and frequency monitoring
5. **Crisis Intervention**: Automated escalation for high-risk situations

### Healthcare Integration

1. **Assessment Correlation**: Integration with PHQ-4, GAD-7, and custom scales
2. **Clinical Reports**: HIPAA-compliant professional documentation
3. **Progress Tracking**: Longitudinal analysis with treatment effectiveness
4. **Risk Assessment**: Automated alerts for concerning patterns
5. **Provider Dashboard**: Comprehensive patient overview for healthcare professionals

## 📊 Analytics & Reporting

### Automated Report Generation

- **Mental Health Trends**: Weekly/monthly mood and assessment analysis
- **Resource Gap Analysis**: Demand vs. availability with recommendations
- **User Journey Insights**: Behavior patterns and engagement analysis
- **Intervention Effectiveness**: Success rates and outcome tracking
- **Compliance Audits**: Privacy and security monitoring reports

### Real-time Metrics

- **User Engagement**: Daily/weekly/monthly active users
- **Feature Usage**: Adoption rates and preference patterns
- **Content Interaction**: Assessment completion and resource utilization
- **Peer Support**: Participation levels and community health
- **System Performance**: Health monitoring and performance analytics

## 🔒 Privacy & Security

### HIPAA Compliance

- **Data Anonymization**: Automatic removal of personally identifiable information
- **Encryption**: End-to-end encryption for sensitive communications
- **Access Controls**: Role-based permissions with audit trails
- **Consent Management**: Granular privacy controls and user consent
- **Secure Storage**: Healthcare-grade data handling and retention policies

### Cultural Sensitivity

- **Multi-language Support**: Native language interfaces and content
- **Cultural Context**: Culturally appropriate mental health resources
- **Anonymous Operation**: Privacy protection for vulnerable populations
- **Migrant Worker Focus**: Specialized support for diaspora communities

## 🌐 Multi-Language Support

Supported Languages:

- **English** (en) - Primary interface
- **中文** (zh) - Chinese (Simplified)
- **বাংলা** (bn) - Bengali
- **தமிழ்** (ta) - Tamil
- **မြန်မာ** (my) - Myanmar (Burmese)
- **Bahasa Indonesia** (idn) - Indonesian
- **ไทย** (th) - Thai
- **Tiếng Việt** (vi) - Vietnamese

## 🎮 Gamification System

### Point Categories

- **Daily Check-ins**: 10-25 points (mood bonuses, streak multipliers)
- **Assessments**: 25-40 points (completion + improvement bonuses)
- **Educational Content**: 2-20 points (engagement and completion)
- **Peer Support**: 5-25 points (quality ratings, leadership bonuses)
- **Buddy Interactions**: 5-40 points (duration, quality, sentiment)
- **Resource Utilization**: 2-50 points (help-seeking courage bonuses)
- **Streak Maintenance**: 2-200 points (weekly, monthly milestones)

### Achievement System

- **4 Rarity Levels**: Common, Rare, Epic, Legendary
- **10 User Levels**: From Newcomer to Enlightened
- **Badge Categories**: Engagement, Support, Learning, Community
- **QR Code Rewards**: Real-world benefit redemption system

## 🤝 Contributing

We welcome contributions from developers, mental health professionals, and community members. Please read our contributing guidelines and code of conduct before submitting pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Follow TypeScript and React best practices
4. Ensure HIPAA compliance in healthcare features
5. Add comprehensive tests
6. Submit a pull request with detailed description

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support, feature requests, or mental health resources:

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our community discussions
- **Emergency**: For mental health emergencies, contact local crisis services

## 🙏 Acknowledgments

- **Azure Cognitive Services** for AI capabilities
- **Mental Health Professionals** for clinical guidance
- **Migrant Worker Communities** for feedback and testing
- **Open Source Community** for foundational technologies

---

**SATA** - Empowering mental health through AI, community, and culturally sensitive care for migrant workers and vulnerable populations worldwide.
