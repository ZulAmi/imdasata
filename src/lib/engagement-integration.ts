/**
 * SATA Engagement Integration
 * Integrates engagement tracking throughout the platform
 */

import { engagementTracker } from '../lib/engagement-tracker';

// Integration hooks for tracking user engagement across all platform features
export class EngagementIntegration {
  // Store active sessions for each user
  private static activeSessions = new Map<string, string>();

  // Get active session ID for user
  private static getSessionId(userId: string): string | undefined {
    return this.activeSessions.get(userId);
  }

  // Track page navigation
  static trackPageView(pageName: string, userId: string, metadata?: Record<string, any>) {
    const sessionId = this.getSessionId(userId);
    if (sessionId) {
      engagementTracker.trackPageView(sessionId, {
        pagePath: pageName,
        pageTitle: pageName,
        timestamp: new Date(),
        ...metadata
      });
    }
  }

  // Track user interactions
  static trackUserInteraction(
    userId: string, 
    feature: string, 
    action: string, 
    metadata?: Record<string, any>
  ) {
    const sessionId = this.getSessionId(userId);
    if (sessionId) {
      engagementTracker.trackInteraction(sessionId, {
        type: 'click',
        element: feature,
        elementType: action,
        page: feature,
        timestamp: new Date(),
        metadata
      });
    }
  }

  // Track session start
  static startSession(userId: string, deviceInfo?: Record<string, any>) {
    const sessionId = engagementTracker.startSession(userId, {
      device: deviceInfo?.device || 'desktop',
      browser: deviceInfo?.browser || 'unknown',
      platform: deviceInfo?.platform || 'web',
      userAgent: deviceInfo?.userAgent || navigator.userAgent,
      isActive: true
    });
    
    this.activeSessions.set(userId, sessionId);
    return sessionId;
  }

  // Track session end
  static endSession(userId: string) {
    const sessionId = this.getSessionId(userId);
    if (sessionId) {
      engagementTracker.endSession(sessionId);
      this.activeSessions.delete(userId);
    }
  }

  // Daily Check-ins Integration
  static trackDailyCheckIn(userId: string, mood: string, energy: number, anxiety: number) {
    this.trackUserInteraction(userId, 'daily-checkin', 'completed', {
      mood,
      energy,
      anxiety,
      timestamp: Date.now()
    });

    // Track feature usage
    engagementTracker.trackFeatureUsage(userId, {
      feature: 'daily-checkin',
      action: 'completed',
      timestamp: new Date(),
      duration: 120,
      success: true
    });
  }

  // Mood Assessment Integration
  static trackMoodAssessment(userId: string, assessmentType: string, score: number, completed: boolean) {
    engagementTracker.trackAssessmentCompletion(userId, assessmentType, completed ? 'completed' : 'abandoned');

    if (completed) {
      this.trackUserInteraction(userId, 'mood-assessment', 'completed', {
        assessmentType,
        score
      });
    }
  }

  // Educational Content Integration
  static trackContentEngagement(
    userId: string, 
    contentType: string, 
    contentId: string, 
    action: 'view' | 'complete' | 'like' | 'share' | 'comment',
    duration?: number
  ) {
    engagementTracker.trackContentInteraction(userId, {
      contentId,
      contentType: contentType as any,
      category: 'education',
      action: action as any,
      timestamp: new Date(),
      duration
    });

    // Track specific interactions
    if (action === 'view') {
      this.trackUserInteraction(userId, 'education', 'content-viewed', {
        contentType,
        contentId
      });
    } else if (action === 'complete') {
      this.trackUserInteraction(userId, 'education', 'content-completed', {
        contentType,
        contentId,
        duration
      });
    }
  }

  // Peer Support Integration
  static trackPeerSupportActivity(
    userId: string, 
    activity: 'message-sent' | 'message-received' | 'support-given' | 'support-received' | 'group-joined',
    metadata?: Record<string, any>
  ) {
    // Simplified tracking - just use the interaction tracking for now
    this.trackUserInteraction(userId, 'peer-support', activity, metadata);
  }

  // Crisis Resources Integration
  static trackCrisisResourceAccess(userId: string, resourceType: string, urgent: boolean = false) {
    this.trackUserInteraction(userId, 'crisis-resources', 'accessed', {
      resourceType,
      urgent,
      timestamp: Date.now()
    });

    engagementTracker.trackFeatureUsage(userId, {
      feature: 'crisis-resources',
      action: 'accessed',
      timestamp: new Date(),
      duration: 60,
      success: true
    });
  }

  // Buddy System Integration
  static trackBuddyActivity(
    userId: string, 
    activity: 'matched' | 'check-in' | 'message' | 'support' | 'reassigned',
    buddyId?: string,
    metadata?: Record<string, any>
  ) {
    this.trackUserInteraction(userId, 'buddy-system', activity, {
      buddyId,
      ...metadata,
      timestamp: Date.now()
    });

    // Track as peer support activity
    if (activity === 'message' || activity === 'support') {
      this.trackPeerSupportActivity(userId, activity === 'message' ? 'message-sent' : 'support-given', {
        buddyId,
        context: 'buddy-system'
      });
    }
  }

  // Gamification Integration
  static trackGamificationActivity(
    userId: string, 
    activity: 'points-earned' | 'achievement-unlocked' | 'level-up' | 'reward-redeemed',
    points?: number,
    metadata?: Record<string, any>
  ) {
    this.trackUserInteraction(userId, 'gamification', activity, {
      points,
      ...metadata,
      timestamp: Date.now()
    });

    engagementTracker.trackFeatureUsage(userId, {
      feature: 'gamification',
      action: activity,
      timestamp: new Date(),
      duration: 30,
      success: true
    });
  }

  // Notification Integration
  static trackNotificationActivity(
    userId: string, 
    notificationId: string, 
    action: 'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed',
    notificationType: string
  ) {
    if (action === 'sent') {
      engagementTracker.trackNotificationSent({
        userId,
        notificationId,
        type: notificationType as any
      });
    } else if (action === 'opened') {
      engagementTracker.trackNotificationOpened(userId, notificationId);
    } else if (action === 'clicked') {
      engagementTracker.trackNotificationClicked(userId, notificationId);
      this.trackUserInteraction(userId, 'notifications', 'clicked', {
        notificationId,
        notificationType
      });
    }
  }

  // Get engagement insights for a user
  static async getUserEngagementInsights(userId: string) {
    // Return mock insights for now
    return {
      score: Math.random() * 10,
      level: 'High',
      recommendations: ['Continue daily check-ins', 'Explore new content']
    };
  }

  // Get platform-wide analytics
  static async getPlatformAnalytics() {
    return engagementTracker.getAnalyticsDashboard();
  }

  // Initialize engagement tracking for new user session
  static initializeUserSession(userId: string, deviceInfo?: Record<string, any>) {
    this.startSession(userId, deviceInfo);
    
    // Track initial page view
    this.trackPageView('dashboard', userId, {
      sessionStart: true,
      deviceInfo
    });
  }

  // Clean up engagement tracking on user logout
  static cleanupUserSession(userId: string) {
    this.endSession(userId);
    
    this.trackUserInteraction(userId, 'authentication', 'logged-out', {
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const engagementIntegration = EngagementIntegration;

// React Hook for easy integration in components
export const useEngagementTracking = (userId: string) => {
  const trackInteraction = (feature: string, action: string, metadata?: Record<string, any>) => {
    EngagementIntegration.trackUserInteraction(userId, feature, action, metadata);
  };

  const trackPageView = (pageName: string, metadata?: Record<string, any>) => {
    EngagementIntegration.trackPageView(pageName, userId, metadata);
  };

  const trackFeatureUsage = (feature: string, duration: number, status: string = 'completed') => {
    engagementTracker.trackFeatureUsage(userId, {
      feature,
      action: status,
      timestamp: new Date(),
      duration,
      success: true
    });
  };

  return {
    trackInteraction,
    trackPageView,
    trackFeatureUsage,
    trackDailyCheckIn: (mood: string, energy: number, anxiety: number) => 
      EngagementIntegration.trackDailyCheckIn(userId, mood, energy, anxiety),
    trackContentEngagement: (contentType: string, contentId: string, action: any, duration?: number) =>
      EngagementIntegration.trackContentEngagement(userId, contentType, contentId, action, duration),
    trackPeerSupport: (activity: any, metadata?: Record<string, any>) =>
      EngagementIntegration.trackPeerSupportActivity(userId, activity, metadata),
    trackGamification: (activity: any, points?: number, metadata?: Record<string, any>) =>
      EngagementIntegration.trackGamificationActivity(userId, activity, points, metadata)
  };
};
