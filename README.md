# Digital Mental Wellness Assistant for Migrant Workers

This project is a Next.js-based digital mental wellness assistant tailored for migrant workers, featuring:

- WhatsApp integration capability
- Multi-language support (English, Mandarin, Bengali, Tamil, Burmese, Bahasa Indonesia)
- PWA support for entry-level smartphones
- Anonymous authentication system
- PDPA-compliant data handling
- PostgreSQL database with Prisma ORM
- Redis for caching and session management

## Database Schema

The application uses a comprehensive Prisma schema designed for mental wellness with these key entities:

### Core Models

- **AnonymousUser**: PDPA-compliant user tracking with unique identifiers (no personal data)
- **PHQ4Assessment**: Depression and anxiety screening results with timestamps
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
