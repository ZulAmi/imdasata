# SATA Gamification System Documentation

## Overview

The SATA Gamification System is a comprehensive rewards and engagement platform designed to motivate consistent mental health care and community participation. The system awards points for various activities, tracks achievements, maintains streaks, and allows users to redeem rewards through QR codes.

## System Architecture

### Core Components

1. **GamificationSystem** (`gamification-system.ts`) - Main engine
2. **GamificationInterface** (`GamificationInterface.tsx`) - User interface
3. **GamificationIntegration** (`gamification-integration.ts`) - Platform integrations
4. **QRScanner** (`QRScanner.tsx`) - Reward redemption scanner
5. **Admin Dashboard** (`gamification-admin.tsx`) - Administrative controls

## Point System

### Point Categories

| Activity                 | Base Points | Bonus Conditions                               |
| ------------------------ | ----------- | ---------------------------------------------- |
| **Daily Check-in**       | 10          | +5 for mood ≥7, +10 for mood ≥9, +streak bonus |
| **PHQ-4 Assessment**     | 25          | +10 completion bonus, +15 improvement bonus    |
| **Educational Content**  | 2-20        | Based on time spent and content type           |
| **Peer Support**         | 5-15        | Quality rating bonus, leadership bonus         |
| **Buddy Interactions**   | 5-30        | Duration bonus, quality multiplier             |
| **Resource Utilization** | 2-30        | First-time bonus, help-seeking courage bonus   |
| **Streaks**              | 2-200       | Weekly, monthly, and milestone bonuses         |

### Point Award Examples

```typescript
// Daily check-in with good mood and streak
GamificationIntegration.onDailyCheckIn(userId, 8, "Feeling great!", 3);
// Awards: 10 (base) + 5 (mood) + streak bonus

// PHQ-4 assessment showing improvement
GamificationIntegration.onPHQ4Assessment(userId, 2, 3, 5);
// Awards: 25 (base) + 10 (completion) + 15 (improvement if applicable)

// Educational engagement with high completion
GamificationIntegration.onEducationalContentEngagement(
  userId,
  "article-123",
  "article",
  240,
  95
);
// Awards: 8 (base) + 10 (completion bonus) + 5 (speed bonus)
```

## Achievement System

### Achievement Categories

1. **Wellness** - Health-focused milestones
2. **Social** - Community engagement achievements
3. **Learning** - Educational progress
4. **Consistency** - Streak and habit achievements
5. **Milestone** - Point and level achievements

### Achievement Rarities

- **Common** - Basic engagement (25-49 points)
- **Rare** - Consistent participation (50-74 points)
- **Epic** - Significant milestones (75-99 points)
- **Legendary** - Exceptional dedication (100+ points)

### Sample Achievements

```typescript
{
  id: 'week-warrior',
  name: 'Week Warrior',
  description: '7-day check-in streak! 🔥',
  category: 'consistency',
  points: 50,
  rarity: 'rare',
  icon: '🔥'
}
```

## Level System

Users progress through 10 levels, each with increasing point requirements and perks:

| Level | Name        | Points Required | Badge | Key Perks                             |
| ----- | ----------- | --------------- | ----- | ------------------------------------- |
| 1     | Newcomer    | 0               | 🌱    | Daily check-ins, Basic resources      |
| 2     | Explorer    | 100             | 🔍    | Assessment tools, Educational content |
| 3     | Supporter   | 300             | 🤝    | Peer support groups, Buddy matching   |
| 4     | Advocate    | 600             | 💪    | Advanced resources, Priority support  |
| 5     | Champion    | 1000            | 🏆    | Leadership roles, Exclusive rewards   |
| 6     | Mentor      | 1500            | 👨‍🏫    | Mentorship opportunities              |
| 7     | Guardian    | 2500            | 🛡️    | Community moderation                  |
| 8     | Sage        | 4000            | 🧙‍♂️    | Wisdom sharing, Platform influence    |
| 9     | Legend      | 6000            | ⭐    | Legendary status                      |
| 10    | Enlightened | 10000           | ✨    | Ultimate recognition                  |

## Streak System

### Streak Types

1. **Daily Check-in** - Most important for mental health tracking
2. **Assessment** - Regular mental health assessments
3. **Learning** - Educational content engagement
4. **Peer Support** - Community participation
5. **Overall** - General platform engagement

### Streak Bonuses

- **3 days**: Getting started
- **7 days**: Week bonus (5-15 points)
- **30 days**: Month milestone (50-100 points)
- **100 days**: Epic achievement (200-500 points)
- **365 days**: Legendary status (500-1000 points)

## Reward System

### Reward Categories

1. **Wellness** - Tea packages, journals, meditation access
2. **Digital** - App subscriptions, premium content
3. **Physical** - Fitness trackers, wellness products
4. **Professional** - Counseling sessions, therapy access

### Sample Rewards

```typescript
{
  id: 'counseling-session',
  name: 'Free Counseling Session',
  description: 'One-on-one session with certified counselor',
  category: 'wellness',
  pointCost: 1000,
  icon: '👨‍⚕️',
  requirements: { minLevel: 3 }
}
```

## QR Code Redemption

### QR Code Generation

When a user redeems a reward:

1. Points are deducted from their account
2. A unique QR code is generated with redemption data
3. QR code expires after 30 days
4. User can download the QR code for offline use

### QR Code Validation

```typescript
const qrData = {
  redemptionId: "redemption_1234567890_abc123",
  userId: "user_123",
  rewardId: "reward_456",
  timestamp: 1640995200000,
};
```

### Scanning Process

1. **Scan QR Code** - Camera or manual input
2. **Validate Data** - Check expiration and status
3. **Complete Redemption** - Mark as redeemed
4. **Award Fulfillment** - Provide reward to user

## Integration Points

### Platform Integration

The gamification system integrates with all major SATA features:

```typescript
// Daily mood tracking
GamificationIntegration.onDailyCheckIn(userId, mood, notes, stressLevel);

// Mental health assessments
GamificationIntegration.onPHQ4Assessment(userId, anxiety, depression, total);

// Educational content
GamificationIntegration.onEducationalContentEngagement(
  userId,
  contentId,
  type,
  duration,
  completion
);

// Peer support groups
GamificationIntegration.onPeerSupportActivity(
  userId,
  activityType,
  groupId,
  quality,
  messageLength
);

// Buddy system interactions
GamificationIntegration.onBuddyInteraction(
  userId,
  buddyId,
  type,
  quality,
  duration,
  sentiment
);

// Resource utilization
GamificationIntegration.onResourceUtilization(
  userId,
  resourceId,
  type,
  engagement
);
```

### Event-Driven Architecture

The system uses EventEmitter for real-time updates:

```typescript
gamificationSystem.on("pointsAwarded", (transaction) => {
  // Update UI, show animations
});

gamificationSystem.on("levelUp", (data) => {
  // Show level up celebration
});

gamificationSystem.on("achievementUnlocked", (data) => {
  // Display achievement notification
});
```

## User Interface

### Main Dashboard

- **Points Overview**: Available, total earned, lifetime
- **Level Progress**: Current level with progress bar
- **Recent Activity**: Transaction history
- **Quick Actions**: Common activities for easy point earning

### Achievements Tab

- **Grid Layout**: Visual achievement cards
- **Rarity Colors**: Color-coded by achievement rarity
- **Progress Tracking**: Shows unlock dates and descriptions

### Rewards Tab

- **Available Rewards**: Filtered by user level and points
- **Point Cost Display**: Clear pricing
- **Stock Information**: Limited quantity indicators
- **Redemption Flow**: Simple click-to-redeem process

### Leaderboard

- **Privacy-Focused**: Opt-in participation
- **Ranking System**: Points-based with level display
- **User Highlighting**: Current user position highlighted

### Statistics

- **Category Breakdown**: Points by activity type
- **Streak Information**: Current and longest streaks
- **Progress Metrics**: Total activities and achievements

## Admin Dashboard

### Overview Metrics

- Total users and active users (7-day window)
- Points awarded and spent across the platform
- Rewards redeemed and average user level
- Recent activity feed

### User Management

- **User List**: Sortable by points, level, activity
- **Individual Profiles**: Detailed user statistics
- **Manual Point Awards**: Administrative point adjustments
- **Achievement Tracking**: View user achievements

### Transaction History

- **Complete Log**: All point transactions across users
- **Filtering**: By user, category, date range
- **Export Options**: Data export for analysis

### Analytics

- **Engagement Metrics**: User activity patterns
- **Reward Analytics**: Most popular rewards
- **Achievement Progress**: Completion rates
- **Trend Analysis**: Growth and engagement trends

## Technical Implementation

### Data Structure

```typescript
interface UserProfile {
  userId: string;
  username: string;
  email?: string;
  joinedAt: Date;
  lastActive: Date;
  currentLevel: number;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: Badge[];
  preferences: {
    shareProgress: boolean;
    notifications: boolean;
    leaderboard: boolean;
  };
}
```

### Point Transaction Model

```typescript
interface PointTransaction {
  id: string;
  userId: string;
  type: "earn" | "spend" | "bonus" | "penalty";
  category: string;
  amount: number;
  description: string;
  metadata?: any;
  timestamp: Date;
  source: string;
}
```

### Performance Considerations

- **In-Memory Storage**: Fast access for demo purposes
- **Event Debouncing**: Prevents spam point awards
- **Lazy Loading**: UI components load data as needed
- **Caching**: Leaderboard and stats cached for performance

### Security Features

- **QR Code Validation**: Prevents fraud with expiration and one-time use
- **Point Limits**: Maximum points per activity per time period
- **Admin Controls**: Manual intervention capabilities
- **Privacy Settings**: User-controlled data sharing

## API Reference

### Core Methods

```typescript
// User management
gamificationSystem.createUser(userData);
gamificationSystem.getUser(userId);
gamificationSystem.updateLastActivity(userId);

// Point system
gamificationSystem.awardPoints(userId, category, amount, description, source);
gamificationSystem.spendPoints(userId, amount, description, source);

// Activity recording
gamificationSystem.recordDailyCheckIn(userId, mood, notes);
gamificationSystem.recordAssessment(userId, type, score);
gamificationSystem.recordEducationalEngagement(userId, type, duration);

// Reward system
gamificationSystem.getAvailableRewards(userId);
gamificationSystem.redeemReward(userId, rewardId);
gamificationSystem.validateQRRedemption(qrData);

// Analytics
gamificationSystem.getLeaderboard(timeframe, limit);
gamificationSystem.getUserStats(userId);
gamificationSystem.getSystemStats();
```

### Integration Methods

```typescript
// Platform integrations
GamificationIntegration.onDailyCheckIn(userId, mood, notes, stress);
GamificationIntegration.onPHQ4Assessment(userId, anxiety, depression, total);
GamificationIntegration.onEducationalContentEngagement(
  userId,
  id,
  type,
  duration,
  completion
);
GamificationIntegration.onPeerSupportActivity(
  userId,
  type,
  groupId,
  quality,
  length
);
GamificationIntegration.onBuddyInteraction(
  userId,
  buddyId,
  type,
  quality,
  duration,
  sentiment
);
GamificationIntegration.onResourceUtilization(
  userId,
  resourceId,
  type,
  engagement
);

// Special events
GamificationIntegration.onPlatformMilestone(userId, type, metadata);
GamificationIntegration.onSpecialEvent(
  userId,
  eventType,
  participation,
  metadata
);
GamificationIntegration.onMoodTrend(userId, trendType, duration, averageMood);
```

## Deployment and Configuration

### Environment Setup

1. Install dependencies: `npm install qrcode @types/qrcode`
2. Import gamification components in your pages
3. Initialize the gamification system
4. Set up event listeners for platform integrations

### Configuration Options

```typescript
// Customize point values
const POINT_VALUES = {
  dailyCheckIn: 10,
  phq4Assessment: 25,
  educationMinute: 2,
  peerSupportMessage: 5,
  // ... more values
};

// Customize achievement thresholds
const ACHIEVEMENT_THRESHOLDS = {
  firstCheckIn: 1,
  weekStreak: 7,
  monthStreak: 30,
  // ... more thresholds
};
```

### Integration Examples

```typescript
// Example: Integrate with existing mood tracking
onMoodSubmit = (mood, notes, stress) => {
  // Existing mood tracking logic
  saveMoodToDatabase(mood, notes, stress);

  // Award gamification points
  GamificationIntegration.onDailyCheckIn(currentUserId, mood, notes, stress);
};

// Example: Integrate with assessment system
onAssessmentComplete = (assessmentData) => {
  // Existing assessment logic
  saveAssessmentToDatabase(assessmentData);

  // Award gamification points
  if (assessmentData.type === "PHQ-4") {
    GamificationIntegration.onPHQ4Assessment(
      currentUserId,
      assessmentData.anxietyScore,
      assessmentData.depressionScore,
      assessmentData.totalScore
    );
  }
};
```

## Best Practices

### Point Economy Balance

1. **Consistent Rewards**: Daily activities should provide steady point income
2. **Milestone Bonuses**: Larger rewards for significant achievements
3. **Diminishing Returns**: Prevent point farming with rate limits
4. **Value Proposition**: Rewards should feel attainable but meaningful

### User Experience

1. **Immediate Feedback**: Show point awards instantly
2. **Progress Visibility**: Clear progress indicators
3. **Achievement Celebration**: Satisfying unlock animations
4. **Privacy Respect**: Opt-in social features

### Mental Health Focus

1. **Positive Reinforcement**: All interactions should be encouraging
2. **No Punishment**: Never penalize users for mental health struggles
3. **Professional Support**: Rewards include access to real help
4. **Community Building**: Foster supportive peer connections

### Technical Maintenance

1. **Regular Updates**: Keep reward catalog fresh
2. **Data Analytics**: Monitor engagement patterns
3. **Performance Monitoring**: Ensure system responsiveness
4. **Security Audits**: Protect user data and prevent fraud

## Future Enhancements

### Planned Features

1. **Social Challenges**: Group goals and competitions
2. **Seasonal Events**: Time-limited challenges and rewards
3. **Mentor System**: High-level users guide newcomers
4. **Integration APIs**: Third-party reward fulfillment
5. **Machine Learning**: Personalized achievement recommendations

### Advanced Analytics

1. **Predictive Modeling**: Identify at-risk user engagement
2. **A/B Testing**: Optimize point values and rewards
3. **Cohort Analysis**: Track long-term user engagement
4. **ROI Tracking**: Measure impact on mental health outcomes

This comprehensive gamification system transforms mental health engagement into an rewarding journey while maintaining focus on genuine wellness outcomes and community support.
