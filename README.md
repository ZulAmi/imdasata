# SATA - Sentiment Analysis Therapy Assistant

A comprehensive AI-powered mental health platform combining voice sentiment analysis, mood tracking, and clinical-grade reporting for mental health professionals and individuals seeking emotional wellbeing support.

![SATA Platform](https://img.shields.io/badge/Platform-Mental%20Health%20AI-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue) ![React](https://img.shields.io/badge/React-18-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![Azure](https://img.shields.io/badge/Azure-Cognitive%20Services-blue)

## 🌟 Key Features

### 🎙️ Voice Sentiment Analysis

- **Real-time emotion detection** from voice recordings using Azure Cognitive Services
- **Multi-language support** with accent recognition
- **Advanced audio processing** with noise reduction and quality enhancement
- **Emotional tone extraction** with confidence scoring
- **Stress indicator detection** and mental health keyword identification
- **Privacy-first design** with on-device processing capabilities

### 😊 Comprehensive Mood Tracking

- **Emoji-based mood selection** with intuitive 10-point scale
- **Voice note integration** with sentiment analysis correlation
- **Multi-modal input** supporting text, voice, and tag-based categorization
- **Real-time trend visualization** with pattern recognition
- **Personalized AI insights** with actionable recommendations
- **Daily streak tracking** and habit building features

### 📈 Advanced Analytics Engine

- **Linear regression analysis** for mood trend prediction
- **Pattern recognition algorithms** for emotional state identification
- **Correlation analysis** with clinical assessment scores (PHQ-4, GAD-7)
- **Statistical confidence intervals** and trend reliability scoring
- **Anomaly detection** for concerning patterns
- **Proactive intervention triggers** based on risk assessment

### 🏥 Healthcare Integration

- **HIPAA-compliant reporting** with professional clinical formatting
- **Multi-format data export** (HTML reports, JSON data, CSV summaries)
- **Assessment correlation analysis** with standardized mental health tools
- **Anonymous data processing** with privacy protection controls
- **Healthcare provider dashboards** with patient progress tracking
- **Clinical decision support** through AI-generated insights

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18** with TypeScript for type-safe component development
- **Next.js 14.2.15** for full-stack framework with SSR/SSG capabilities
- **Tailwind CSS** for responsive design and component styling
- **Chart.js/Recharts** for advanced data visualization
- **Web Audio API** for voice recording and processing

### Backend Integration

- **Azure Cognitive Services** for voice sentiment analysis
- **EventEmitter Architecture** for real-time data processing
- **LocalStorage/IndexedDB** for client-side data persistence
- **RESTful API design** for healthcare provider integration
- **WebRTC** for secure voice transmission

### AI/ML Components

- **Natural Language Processing** for text sentiment analysis
- **Voice Recognition** with emotional tone detection
- **Pattern Recognition** algorithms for mood trend analysis
- **Machine Learning** models for personalized insight generation
- **Statistical Analysis** with confidence scoring and prediction

## 📁 Project Structure

```
SATA/
├── src/
│   ├── components/
│   │   ├── VoiceAnalysisInterface.tsx      # Voice recording and analysis UI
│   │   ├── MoodLoggingInterface.tsx        # Comprehensive mood tracking
│   │   ├── MoodTrendsVisualization.tsx     # Data visualization charts
│   │   └── HealthcareExport.tsx            # Clinical reporting system
│   ├── lib/
│   │   ├── voice-sentiment-analyzer.ts     # Core voice analysis engine
│   │   ├── mood-analytics-engine.ts        # Advanced mood analytics
│   │   ├── azure-integration.ts            # Azure Cognitive Services
│   │   └── engagement-integration.ts       # User engagement tracking
│   ├── pages/
│   │   ├── index.tsx                       # Main landing page
│   │   ├── voice-analysis.tsx              # Voice analysis demo page
│   │   └── mood-dashboard.tsx              # Comprehensive mood dashboard
│   └── types/
│       └── mood-types.ts                   # TypeScript type definitions
├── public/
├── docs/
└── README.md
```

## 🚀 Getting Started

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
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser

## 🎯 Core Functionality

### Voice Sentiment Analysis Workflow

1. **Audio Capture**: High-quality voice recording with noise reduction
2. **Azure Processing**: Speech-to-text conversion with emotional tone analysis
3. **Sentiment Extraction**: Multi-dimensional emotion scoring (happiness, stress, anxiety)
4. **Pattern Recognition**: Historical trend analysis and anomaly detection
5. **Insight Generation**: Personalized recommendations and intervention triggers

### Mood Tracking Process

1. **Emoji Selection**: Intuitive 10-point mood scale with emotional descriptors
2. **Multi-Modal Input**: Text descriptions, voice notes, and contextual tags
3. **Real-Time Analysis**: Immediate sentiment scoring and trend calculation
4. **Pattern Detection**: Long-term mood patterns and correlation analysis
5. **Healthcare Integration**: Professional report generation for clinical use

### Healthcare Provider Features

1. **Patient Dashboard**: Comprehensive mood tracking overview
2. **Clinical Reports**: HIPAA-compliant professional documentation
3. **Assessment Integration**: PHQ-4, GAD-7, and custom scale correlation
4. **Progress Tracking**: Longitudinal analysis with treatment effectiveness
5. **Risk Assessment**: Automated alerts for concerning patterns

## 📊 Analytics & Insights

### Mood Analytics Engine

- **Trend Analysis**: Linear regression with confidence intervals
- **Pattern Recognition**: Seasonal, weekly, and daily mood patterns
- **Correlation Analysis**: Mood vs. external factors and assessments
- **Anomaly Detection**: Statistical outliers and concerning patterns
- **Predictive Modeling**: Future mood state prediction with confidence scoring

### Healthcare Metrics

- **Assessment Correlation**: PHQ-4, GAD-7, and custom tool integration
- **Treatment Effectiveness**: Before/after intervention analysis
- **Risk Stratification**: Patient categorization based on mood patterns
- **Clinical Decision Support**: Evidence-based recommendation generation

## 🔒 Privacy & Security

### Data Protection

- **HIPAA Compliance**: Healthcare-grade data handling and storage
- **Anonymous Processing**: User identity protection with secure identifiers
- **On-Device Analysis**: Local processing where possible to minimize data transmission
- **Encryption**: End-to-end encryption for sensitive data
- **Access Controls**: Role-based permissions for healthcare providers

### Privacy Features

- **Data Anonymization**: Personal information removal for analytics
- **Consent Management**: Granular privacy controls and user consent
- **Data Retention**: Configurable retention policies with secure deletion
- **Audit Trails**: Comprehensive logging for compliance and security
- **MoodLog**: Daily mood tracking with sentiment analysis
- **MentalHealthResource**: Curated directory of mental health resources
- **SupportGroup**: Peer support groups with multi-language support
- **BuddyRelation**: Peer buddy system for mutual support

### Engagement & Analytics

- **UserInteraction**: Comprehensive user engagement tracking
- **GamificationData**: Points, levels, achievements, and streaks
- **ServiceReferral**: Crisis intervention and service connection tracking
- **AnalyticsSummary**: Anonymous aggregated analytics for admin dashboard

### Key Features

- Multi-language JSON fields for internationalization
- PDPA-compliant anonymous user tracking
- Gamification system with achievements
- Crisis intervention workflow
- Comprehensive analytics without personal data exposure

## Getting Started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Set up environment variables:

   ```sh
   cp .env.example .env
   # Edit .env with your database URLs and API keys
   ```

3. Set up the database:

   ```sh
   # Generate Prisma client
   npm run db:generate

   # Run database migrations
   npm run db:migrate

   # Seed the database with initial data
   npm run db:seed
   ```

4. Run the development server:

   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (⚠️ destroys all data)

## API Endpoints

### Assessment APIs

- `POST /api/assessment/phq4` - Submit PHQ-4 depression/anxiety assessment
- `GET /api/assessment/history` - Get user's assessment history

### Mood Tracking

- `POST /api/mood/log` - Log daily mood with sentiment analysis
- `GET /api/mood/trends` - Get mood trends and insights

### Resources

- `GET /api/resources` - Get mental health resources (filterable by category/language)
- `POST /api/resources/interaction` - Track resource access

### Support & Community

- `GET /api/groups` - Get available support groups
- `POST /api/groups/join` - Join a support group
- `POST /api/buddy/request` - Request a buddy connection

## Features

- **WhatsApp Integration:** Easily connect with users via WhatsApp.
- **Multi-language:** Supports six languages for inclusivity.
- **PWA:** Optimized for low-end devices.
- **Anonymous Auth:** Protects user privacy.
- **PDPA Compliance:** Handles data responsibly.
- **PostgreSQL & Prisma:** Robust, scalable data storage.
- **Redis:** Fast caching and session management.

## Privacy & Compliance

This application is designed with PDPA compliance in mind:

- No collection of personal identifying information
- Anonymous user tracking with UUIDs
- Encrypted sensitive data fields
- Automatic data anonymization utilities
- Comprehensive audit trails
- **PDPA Compliance:** Handles data responsibly.
- **PostgreSQL & Prisma:** Robust, scalable data storage.
- **Redis:** Fast caching and session management.

## License

MIT
