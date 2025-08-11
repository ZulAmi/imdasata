# Peer Support Chat System

A comprehensive peer support chat system designed for the SATA Mental Health platform, specifically tailored for migrant workers seeking culturally sensitive mental health support.

## 🌟 Features

### Core Chat Functionality

- **Real-time messaging** with text and voice support
- **Group-based conversations** organized by language, country, interests, or support topics
- **Auto-grouping algorithm** that matches users based on preferences
- **Multi-language support** for 8+ languages commonly spoken by migrant workers
- **Privacy-first design** with anonymous display names and data retention controls

### Advanced Features

- **Voice messaging** with audio recording and playback
- **Emoji reactions** for non-verbal support and encouragement
- **Message encryption** for secure conversations
- **Ephemeral messaging** with automatic expiration
- **Offline support** with message queuing and background sync

### Moderation & Safety

- **Automated content moderation** with configurable filters
- **Human moderation dashboard** for review and action
- **Trust scoring system** based on community feedback
- **User reporting** and escalation workflows
- **Safe space enforcement** with community guidelines

### Gamification & Engagement

- **Badge system** for helpful community members
- **Trust score progression** encouraging positive behavior
- **Activity recognition** with achievements for milestones
- **Peer support metrics** tracking helpful interactions

### Privacy & Compliance

- **PDPA compliance** with data retention controls
- **Anonymous identity system** protecting real names
- **Granular privacy settings** for information sharing
- **Right to be forgotten** implementation
- **Secure data handling** with encryption at rest and in transit

### Notifications

- **Smart notification system** with quiet hours and preferences
- **Push notifications** for important messages and mentions
- **Daily activity summaries** (optional)
- **Group activity alerts** for relevant updates
- **Moderation notifications** for safety alerts

## 🏗️ Architecture

### Core Components

1. **PeerSupportChatSystem** (`src/lib/peer-chat-system.ts`)

   - Main chat engine handling users, groups, and messages
   - Auto-grouping algorithms based on user preferences
   - Content moderation and safety features
   - Badge and trust score management

2. **PeerChatInterface** (`src/components/PeerChatInterface.tsx`)

   - Main React component for the chat interface
   - Real-time message display and input
   - Group management and navigation
   - Voice message recording and playback

3. **ChatNotificationService** (`src/lib/chat-notifications.ts`)

   - Comprehensive notification system
   - Push notification support with service worker
   - User preference management
   - Quiet hours and smart delivery

4. **ModerationDashboard** (`src/pages/chat-moderation.tsx`)
   - Admin interface for content moderation
   - Flagged message review and action
   - User management and reporting
   - Analytics and safety metrics

### Pages

- **Peer Support Chat** (`/peer-support-chat`) - Main chat interface with onboarding
- **Chat Moderation** (`/chat-moderation`) - Admin moderation dashboard
- **Resources Admin** (`/resources-admin`) - Integration with existing resource management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Next.js 14+ application
- Modern browser with WebRTC support (for voice messages)

### Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Add Service Worker**

   - The service worker (`public/sw-chat-notifications.js`) is already included
   - Notifications will work automatically in supported browsers

3. **Configure Environment**
   ```bash
   # Add to your .env.local file
   NEXT_PUBLIC_CHAT_ENCRYPTION_KEY=your-encryption-key
   NEXT_PUBLIC_PUSH_NOTIFICATION_KEY=your-push-key
   ```

### Usage

1. **Access the Chat System**

   - Visit `/peer-support-chat` to start using the chat
   - Complete the onboarding flow to set preferences
   - Join or create groups based on your interests

2. **For Administrators**

   - Visit `/chat-moderation` for the moderation dashboard
   - Monitor flagged content and user reports
   - Manage groups and user permissions

3. **Integration with Resources**
   - The system integrates with the existing resources admin panel
   - Quick access links are available in the analytics section

## 🔧 Configuration

### User Onboarding

Users go through a 4-step onboarding process:

1. **Display Name** - Choose an anonymous, friendly name
2. **Languages** - Select preferred communication languages
3. **Interests** - Pick support topics and areas of interest
4. **Privacy Settings** - Configure data sharing and retention

### Auto-Grouping Algorithm

The system automatically suggests and joins users to relevant groups based on:

- **Language preferences** - Primary communication language
- **Country of origin** - For cultural connection (optional)
- **Support interests** - Mental health topics and life areas
- **Trust score** - Ensures quality group membership

### Content Moderation

Multi-layered approach to ensuring safe conversations:

- **Automated filtering** - Keyword and pattern detection
- **Community reporting** - User-driven content flagging
- **Human review** - Moderator dashboard for complex cases
- **Trust scoring** - Community-based reputation system

## 🛡️ Safety Features

### Privacy Protection

- **Anonymous identities** - No real names required
- **Encrypted storage** - All messages encrypted at rest
- **Data retention** - Configurable message expiration
- **Minimal data collection** - Only necessary information stored

### Content Safety

- **Inappropriate content filtering** - Automatic detection and hiding
- **Harassment prevention** - User blocking and reporting
- **Crisis intervention** - Escalation to professional support
- **Community guidelines** - Clear rules and enforcement

### Moderation Tools

- **Flagged content review** - Queue-based moderation workflow
- **User action controls** - Warning, suspension, and ban capabilities
- **Analytics dashboard** - Safety metrics and trends
- **Escalation pathways** - Integration with professional support

## 📊 Analytics & Insights

### User Engagement

- Message volume and frequency
- Group participation rates
- Voice message usage
- Reaction and interaction patterns

### Safety Metrics

- Content moderation statistics
- User trust score distributions
- Report resolution times
- Community health indicators

### Support Effectiveness

- User retention in groups
- Helpful interaction measurements
- Crisis intervention statistics
- Professional referral tracking

## 🌍 Multi-Language Support

The system supports 8 languages commonly used by migrant workers in Singapore:

- **English** (en) - Primary interface language
- **Chinese** (zh) - 中文 support
- **Bengali** (bn) - বাংলা support
- **Tamil** (ta) - தமிழ் support
- **Myanmar** (my) - မြန်မာ support
- **Indonesian** (idn) - Bahasa Indonesia support
- **Thai** (th) - ไทย support
- **Vietnamese** (vi) - Tiếng Việt support

### Language Features

- **Interface localization** - UI elements in user's preferred language
- **Auto-translation hints** - Helpful suggestions for cross-language communication
- **Language-specific groups** - Native language support circles
- **Cultural context awareness** - Understanding of cultural communication styles

## 🔮 Future Enhancements

### Planned Features

- **AI-powered moderation** - Enhanced content safety with machine learning
- **Professional integration** - Direct connection to mental health professionals
- **Crisis detection** - Automatic identification of users in distress
- **Advanced analytics** - Deeper insights into community health

### Technical Improvements

- **Video calling** - Face-to-face peer support sessions
- **File sharing** - Safe document and image sharing
- **Translation services** - Real-time message translation
- **Mobile app** - Native iOS and Android applications

### Community Features

- **Mentorship programs** - Experienced user guidance for newcomers
- **Event coordination** - Community meetups and support events
- **Resource sharing** - User-generated helpful content
- **Success stories** - Inspiring recovery and growth narratives

## 🤝 Contributing

### Development Guidelines

1. **Privacy first** - Always consider user privacy in new features
2. **Safety by design** - Build moderation and safety into core functionality
3. **Cultural sensitivity** - Understand diverse user backgrounds and needs
4. **Accessibility** - Ensure features work for users with different abilities
5. **Performance** - Optimize for users with limited device capabilities

### Code Standards

- **TypeScript** - Strong typing for reliability
- **React best practices** - Component composition and hooks
- **Security reviews** - Regular security audits for sensitive features
- **Testing coverage** - Comprehensive testing for safety-critical features

## 📞 Support

For technical support or questions about the peer support chat system:

- **Documentation** - Refer to inline code comments and this README
- **Issues** - Report bugs through the project issue tracker
- **Security concerns** - Contact administrators for security-related issues
- **Feature requests** - Submit enhancement proposals through proper channels

## 📄 License

This peer support chat system is part of the SATA Mental Health platform and follows the same licensing terms. The system prioritizes user safety, privacy, and effective peer support for vulnerable populations.

---

_Built with ❤️ for the migrant worker community in Singapore_
