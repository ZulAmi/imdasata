/**
 * SATA Anonymous Authentication System
 * Secure, privacy-first authentication without personal data collection
 * PDPA compliant with full audit logging and data portability
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { EventEmitter } from 'events';

// Core Types
interface AnonymousUser {
  id: string;
  deviceFingerprint: string;
  sessionToken: string;
  createdAt: Date;
  lastActiveAt: Date;
  trustScore: number;
  deviceInfo: DeviceInfo;
  preferences: UserPreferences;
  recoveryTokens: RecoveryToken[];
  auditLog: AuditEntry[];
}

interface DeviceInfo {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  platform: string;
  hashedFingerprint: string;
}

interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  notificationsEnabled: boolean;
  dataRetentionPeriod: number; // in days
  anonymityLevel: 'basic' | 'enhanced' | 'maximum';
}

interface RecoveryToken {
  id: string;
  hashedToken: string;
  expiresAt: Date;
  usedAt?: Date;
  deviceFingerprint: string;
}

interface AuditEntry {
  id: string;
  action: AuditAction;
  timestamp: Date;
  deviceFingerprint: string;
  ipHash: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  deviceFingerprint: string;
  createdAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
}

type AuditAction = 
  | 'account_created'
  | 'session_started'
  | 'session_ended'
  | 'authentication_attempt'
  | 'recovery_token_generated'
  | 'recovery_token_used'
  | 'data_export_requested'
  | 'data_deletion_requested'
  | 'preferences_updated'
  | 'device_registered'
  | 'suspicious_activity_detected';

interface AuthOptions {
  sessionDuration: number; // in milliseconds
  maxSessionsPerDevice: number;
  recoveryTokenValidityPeriod: number; // in milliseconds
  maxRecoveryTokens: number;
  auditRetentionPeriod: number; // in milliseconds
  trustScoreThreshold: number;
}

class AnonymousAuthenticationSystem extends EventEmitter {
  private users: Map<string, AnonymousUser> = new Map();
  private sessions: Map<string, Session> = new Map();
  private deviceSessions: Map<string, string[]> = new Map();
  private options: AuthOptions;

  constructor(options: Partial<AuthOptions> = {}) {
    super();
    
    this.options = {
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      maxSessionsPerDevice: 3,
      recoveryTokenValidityPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxRecoveryTokens: 5,
      auditRetentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      trustScoreThreshold: 0.7,
      ...options
    };

    // Initialize cleanup intervals
    this.startMaintenanceTasks();
  }

  /**
   * Generate a unique anonymous user identifier
   */
  private generateAnonymousId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(16).toString('hex');
    return `anon_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Generate a recovery token
   */
  private generateRecoveryToken(): string {
    return randomBytes(24).toString('hex');
  }

  /**
   * Create a device fingerprint from browser information
   */
  generateDeviceFingerprint(deviceInfo: Partial<DeviceInfo>): string {
    const components = [
      deviceInfo.userAgent || '',
      deviceInfo.language || '',
      deviceInfo.timezone || '',
      deviceInfo.screenResolution || '',
      deviceInfo.platform || ''
    ];
    
    const fingerprint = components.join('|');
    return createHash('sha256').update(fingerprint).digest('hex');
  }

  /**
   * Hash sensitive data for storage
   */
  private hashData(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify hashed data
   */
  private verifyHash(data: string, hash: string): boolean {
    const dataHash = this.hashData(data);
    return timingSafeEqual(Buffer.from(dataHash), Buffer.from(hash));
  }

  /**
   * Calculate trust score based on device consistency and usage patterns
   */
  private calculateTrustScore(user: AnonymousUser): number {
    const now = Date.now();
    const accountAge = now - user.createdAt.getTime();
    const sessionCount = user.auditLog.filter(entry => entry.action === 'session_started').length;
    const lastActive = now - user.lastActiveAt.getTime();
    
    // Base score from account age (max 0.3)
    const ageScore = Math.min(accountAge / (30 * 24 * 60 * 60 * 1000), 0.3);
    
    // Score from regular usage (max 0.4)
    const usageScore = Math.min(sessionCount / 50, 0.4);
    
    // Penalty for long inactivity (max -0.3)
    const inactivityPenalty = Math.max(lastActive / (7 * 24 * 60 * 60 * 1000), 0.3);
    
    // Device consistency bonus (max 0.3)
    const deviceConsistency = user.auditLog.filter(
      entry => entry.deviceFingerprint === user.deviceFingerprint
    ).length / user.auditLog.length;
    const consistencyScore = deviceConsistency * 0.3;
    
    return Math.max(0, Math.min(1, ageScore + usageScore + consistencyScore - inactivityPenalty));
  }

  /**
   * Add audit log entry
   */
  private addAuditEntry(
    userId: string,
    action: AuditAction,
    deviceFingerprint: string,
    ipAddress?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    const user = this.users.get(userId);
    if (!user) return;

    const auditEntry: AuditEntry = {
      id: this.generateAnonymousId(),
      action,
      timestamp: new Date(),
      deviceFingerprint,
      ipHash: ipAddress ? this.hashData(ipAddress) : '',
      sessionId: sessionId || '',
      metadata
    };

    user.auditLog.push(auditEntry);
    
    // Emit event for real-time monitoring
    this.emit('audit_entry', auditEntry);
    
    // Clean old audit entries
    this.cleanOldAuditEntries(user);
  }

  /**
   * Clean old audit entries based on retention policy
   */
  private cleanOldAuditEntries(user: AnonymousUser): void {
    const cutoffDate = new Date(Date.now() - this.options.auditRetentionPeriod);
    user.auditLog = user.auditLog.filter(entry => entry.timestamp > cutoffDate);
  }

  /**
   * Create a new anonymous user account
   */
  async createAnonymousAccount(
    deviceInfo: DeviceInfo,
    preferences: Partial<UserPreferences> = {},
    ipAddress?: string
  ): Promise<{ user: AnonymousUser; session: Session }> {
    const userId = this.generateAnonymousId();
    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    const sessionToken = this.generateSessionToken();
    
    const user: AnonymousUser = {
      id: userId,
      deviceFingerprint,
      sessionToken,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      trustScore: 0.1, // Initial low trust score
      deviceInfo: {
        ...deviceInfo,
        hashedFingerprint: deviceFingerprint
      },
      preferences: {
        language: 'en',
        theme: 'auto',
        notificationsEnabled: true,
        dataRetentionPeriod: 365,
        anonymityLevel: 'enhanced',
        ...preferences
      },
      recoveryTokens: [],
      auditLog: []
    };

    // Create initial session
    const session = await this.createSession(user, deviceFingerprint, ipAddress);
    
    // Store user
    this.users.set(userId, user);
    
    // Add audit entry
    this.addAuditEntry(userId, 'account_created', deviceFingerprint, ipAddress, session.id);
    
    this.emit('account_created', { user, session });
    
    return { user, session };
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    user: AnonymousUser,
    deviceFingerprint: string,
    ipAddress?: string
  ): Promise<Session> {
    const sessionId = this.generateAnonymousId();
    const sessionToken = this.generateSessionToken();
    
    const session: Session = {
      id: sessionId,
      userId: user.id,
      token: sessionToken,
      deviceFingerprint,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.options.sessionDuration),
      lastActiveAt: new Date(),
      isActive: true
    };

    // Manage device session limits
    const deviceSessions = this.deviceSessions.get(deviceFingerprint) || [];
    if (deviceSessions.length >= this.options.maxSessionsPerDevice) {
      // Remove oldest session
      const oldestSessionId = deviceSessions.shift();
      if (oldestSessionId) {
        const oldSession = this.sessions.get(oldestSessionId);
        if (oldSession) {
          oldSession.isActive = false;
          this.addAuditEntry(user.id, 'session_ended', deviceFingerprint, ipAddress, oldestSessionId, {
            reason: 'device_limit_exceeded'
          });
        }
      }
    }

    deviceSessions.push(sessionId);
    this.deviceSessions.set(deviceFingerprint, deviceSessions);
    this.sessions.set(sessionId, session);

    // Update user
    user.lastActiveAt = new Date();
    user.sessionToken = sessionToken;
    user.trustScore = this.calculateTrustScore(user);

    // Add audit entry
    this.addAuditEntry(user.id, 'session_started', deviceFingerprint, ipAddress, sessionId);

    return session;
  }

  /**
   * Authenticate user with device fingerprint
   */
  async authenticateWithDevice(
    deviceFingerprint: string,
    ipAddress?: string
  ): Promise<{ user: AnonymousUser; session: Session } | null> {
    // Find user by device fingerprint
    const user = Array.from(this.users.values()).find(
      u => u.deviceFingerprint === deviceFingerprint
    );

    if (!user) {
      this.addAuditEntry('unknown', 'authentication_attempt', deviceFingerprint, ipAddress, '', {
        result: 'user_not_found'
      });
      return null;
    }

    // Check trust score
    if (user.trustScore < this.options.trustScoreThreshold) {
      this.addAuditEntry(user.id, 'authentication_attempt', deviceFingerprint, ipAddress, '', {
        result: 'low_trust_score',
        trustScore: user.trustScore
      });
      return null;
    }

    // Create new session
    const session = await this.createSession(user, deviceFingerprint, ipAddress);
    
    return { user, session };
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string): Promise<{ user: AnonymousUser; session: Session } | null> {
    const session = Array.from(this.sessions.values()).find(
      s => s.token === sessionToken && s.isActive
    );

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      this.addAuditEntry(session.userId, 'session_ended', session.deviceFingerprint, '', session.id, {
        reason: 'expired'
      });
      return null;
    }

    const user = this.users.get(session.userId);
    if (!user) {
      return null;
    }

    // Update last active time
    session.lastActiveAt = new Date();
    user.lastActiveAt = new Date();

    return { user, session };
  }

  /**
   * Generate recovery tokens for account recovery
   */
  async generateRecoveryTokens(userId: string, count: number = 5): Promise<string[]> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const tokens: string[] = [];
    const recoveryTokens: RecoveryToken[] = [];

    for (let i = 0; i < Math.min(count, this.options.maxRecoveryTokens); i++) {
      const token = this.generateRecoveryToken();
      const hashedToken = this.hashData(token);
      
      recoveryTokens.push({
        id: this.generateAnonymousId(),
        hashedToken,
        expiresAt: new Date(Date.now() + this.options.recoveryTokenValidityPeriod),
        deviceFingerprint: user.deviceFingerprint
      });
      
      tokens.push(token);
    }

    // Replace existing recovery tokens
    user.recoveryTokens = recoveryTokens;

    this.addAuditEntry(userId, 'recovery_token_generated', user.deviceFingerprint, '', '', {
      tokenCount: count
    });

    return tokens;
  }

  /**
   * Recover account using recovery token
   */
  async recoverAccountWithToken(
    recoveryToken: string,
    deviceFingerprint: string,
    ipAddress?: string
  ): Promise<{ user: AnonymousUser; session: Session } | null> {
    // Find user with matching recovery token
    let targetUser: AnonymousUser | null = null;
    let matchingToken: RecoveryToken | null = null;

    for (const user of this.users.values()) {
      for (const token of user.recoveryTokens) {
        if (this.verifyHash(recoveryToken, token.hashedToken) && 
            token.expiresAt > new Date() && 
            !token.usedAt) {
          targetUser = user;
          matchingToken = token;
          break;
        }
      }
      if (targetUser) break;
    }

    if (!targetUser || !matchingToken) {
      this.addAuditEntry('unknown', 'authentication_attempt', deviceFingerprint, ipAddress, '', {
        result: 'invalid_recovery_token'
      });
      return null;
    }

    // Mark token as used
    matchingToken.usedAt = new Date();

    // Update device fingerprint if necessary
    targetUser.deviceFingerprint = deviceFingerprint;

    // Create new session
    const session = await this.createSession(targetUser, deviceFingerprint, ipAddress);

    this.addAuditEntry(targetUser.id, 'recovery_token_used', deviceFingerprint, ipAddress, session.id);

    return { user: targetUser, session };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    const oldPreferences = { ...user.preferences };
    user.preferences = { ...user.preferences, ...preferences };

    this.addAuditEntry(userId, 'preferences_updated', user.deviceFingerprint, '', '', {
      oldPreferences,
      newPreferences: user.preferences
    });

    return true;
  }

  /**
   * Export user data for PDPA compliance
   */
  async exportUserData(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user sessions
    const userSessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId
    );

    const exportData = {
      anonymousId: user.id,
      accountCreated: user.createdAt,
      lastActive: user.lastActiveAt,
      trustScore: user.trustScore,
      preferences: user.preferences,
      deviceInfo: {
        platform: user.deviceInfo.platform,
        language: user.deviceInfo.language,
        timezone: user.deviceInfo.timezone
        // Exclude sensitive fingerprint data
      },
      sessionsCount: userSessions.length,
      auditLog: user.auditLog.map(entry => ({
        action: entry.action,
        timestamp: entry.timestamp,
        // Exclude sensitive device and IP data
      })),
      dataGeneratedAt: new Date(),
      exportFormat: 'JSON',
      pdpaCompliance: true
    };

    this.addAuditEntry(userId, 'data_export_requested', user.deviceFingerprint);

    return exportData;
  }

  /**
   * Delete user data for PDPA compliance
   */
  async deleteUserData(userId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    // Add final audit entry
    this.addAuditEntry(userId, 'data_deletion_requested', user.deviceFingerprint);

    // Remove all user sessions
    const userSessions = Array.from(this.sessions.entries()).filter(
      ([_, session]) => session.userId === userId
    );

    for (const [sessionId, _] of userSessions) {
      this.sessions.delete(sessionId);
    }

    // Remove from device sessions
    const deviceSessions = this.deviceSessions.get(user.deviceFingerprint) || [];
    const updatedDeviceSessions = deviceSessions.filter(sessionId => 
      !userSessions.some(([id, _]) => id === sessionId)
    );
    
    if (updatedDeviceSessions.length > 0) {
      this.deviceSessions.set(user.deviceFingerprint, updatedDeviceSessions);
    } else {
      this.deviceSessions.delete(user.deviceFingerprint);
    }

    // Remove user
    this.users.delete(userId);

    this.emit('user_deleted', { userId });

    return true;
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(): Promise<any> {
    const totalUsers = this.users.size;
    const activeSessions = Array.from(this.sessions.values()).filter(s => s.isActive).length;
    const auditEntries = Array.from(this.users.values()).reduce(
      (total, user) => total + user.auditLog.length, 0
    );

    return {
      timestamp: new Date(),
      totalAnonymousUsers: totalUsers,
      activeSessions,
      totalAuditEntries: auditEntries,
      dataRetentionCompliance: {
        auditRetentionPeriod: this.options.auditRetentionPeriod,
        oldestAuditEntry: this.getOldestAuditEntry(),
        dataCleanupActive: true
      },
      privacyFeatures: {
        anonymousIdentifiers: true,
        deviceBasedAuth: true,
        hashedDataStorage: true,
        automaticDataExpiry: true,
        userDataPortability: true,
        rightToDeletion: true
      },
      securityMetrics: {
        averageTrustScore: this.getAverageTrustScore(),
        suspiciousActivityDetected: this.getSuspiciousActivityCount(),
        sessionSecurityEnabled: true
      }
    };
  }

  /**
   * Get oldest audit entry for compliance reporting
   */
  private getOldestAuditEntry(): Date | null {
    let oldest: Date | null = null;
    
    for (const user of this.users.values()) {
      for (const entry of user.auditLog) {
        if (!oldest || entry.timestamp < oldest) {
          oldest = entry.timestamp;
        }
      }
    }
    
    return oldest;
  }

  /**
   * Get average trust score across all users
   */
  private getAverageTrustScore(): number {
    if (this.users.size === 0) return 0;
    
    const totalTrustScore = Array.from(this.users.values()).reduce(
      (sum, user) => sum + user.trustScore, 0
    );
    
    return totalTrustScore / this.users.size;
  }

  /**
   * Get count of suspicious activity
   */
  private getSuspiciousActivityCount(): number {
    let count = 0;
    
    for (const user of this.users.values()) {
      count += user.auditLog.filter(entry => 
        entry.action === 'suspicious_activity_detected'
      ).length;
    }
    
    return count;
  }

  /**
   * Start maintenance tasks for cleanup and security
   */
  private startMaintenanceTasks(): void {
    // Clean expired sessions every hour
    setInterval(() => {
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000);

    // Clean old audit entries every day
    setInterval(() => {
      this.cleanOldAuditEntriesForAllUsers();
    }, 24 * 60 * 60 * 1000);

    // Update trust scores every 6 hours
    setInterval(() => {
      this.updateAllTrustScores();
    }, 6 * 60 * 60 * 1000);
  }

  /**
   * Clean expired sessions
   */
  private cleanExpiredSessions(): void {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      const session = this.sessions.get(sessionId);
      if (session) {
        this.addAuditEntry(session.userId, 'session_ended', session.deviceFingerprint, '', sessionId, {
          reason: 'cleanup_expired'
        });
      }
      this.sessions.delete(sessionId);
    }

    this.emit('sessions_cleaned', { count: expiredSessions.length });
  }

  /**
   * Clean old audit entries for all users
   */
  private cleanOldAuditEntriesForAllUsers(): void {
    for (const user of this.users.values()) {
      this.cleanOldAuditEntries(user);
    }
  }

  /**
   * Update trust scores for all users
   */
  private updateAllTrustScores(): void {
    for (const user of this.users.values()) {
      const oldScore = user.trustScore;
      user.trustScore = this.calculateTrustScore(user);
      
      if (Math.abs(user.trustScore - oldScore) > 0.1) {
        this.emit('trust_score_updated', {
          userId: user.id,
          oldScore,
          newScore: user.trustScore
        });
      }
    }
  }

  /**
   * Logout user and invalidate session
   */
  async logout(sessionToken: string): Promise<boolean> {
    const session = Array.from(this.sessions.values()).find(
      s => s.token === sessionToken
    );

    if (!session) {
      return false;
    }

    session.isActive = false;
    this.addAuditEntry(session.userId, 'session_ended', session.deviceFingerprint, '', session.id, {
      reason: 'user_logout'
    });

    return true;
  }

  /**
   * Get user statistics
   */
  getStats(): any {
    return {
      totalUsers: this.users.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      averageTrustScore: this.getAverageTrustScore(),
      deviceSessions: this.deviceSessions.size
    };
  }
}

export default AnonymousAuthenticationSystem;
export type {
  AnonymousUser,
  DeviceInfo,
  UserPreferences,
  Session,
  AuditEntry,
  AuditAction,
  AuthOptions
};
