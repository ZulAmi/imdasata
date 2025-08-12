/**
 * React Hook for Privacy Controls
 * Provides easy integration with the privacy controls system
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { privacyControlsSystem, UserConsent, PrivacySettings, DataAccessLog, ComplianceReport } from '../lib/privacy-controls';

interface PrivacyContextType {
  // Consent Management
  recordConsent: (consentType: UserConsent['consentType'], granted: boolean) => Promise<void>;
  withdrawConsent: (consentType: UserConsent['consentType'], reason?: string) => Promise<void>;
  hasConsent: (consentType: UserConsent['consentType']) => boolean;
  getConsentHistory: () => UserConsent[];

  // Privacy Settings
  privacySettings: PrivacySettings | null;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;

  // Data Management
  exportData: (format?: 'json' | 'csv' | 'xml') => Promise<any>;
  deleteAllData: (reason?: string) => Promise<boolean>;

  // Access Logs
  getAccessLogs: () => DataAccessLog[];

  // Encryption
  encryptSensitiveData: (data: any, level: 'low' | 'medium' | 'high' | 'critical') => string;

  // Anonymization
  anonymizeForAnalytics: (data: any, method?: 'basic' | 'k_anonymity' | 'differential_privacy') => any;

  // State
  isLoading: boolean;
  error: string | null;
}

const PrivacyContext = createContext<PrivacyContextType | null>(null);

export const usePrivacyControls = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacyControls must be used within a PrivacyProvider');
  }
  return context;
};

interface PrivacyProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children, userId }) => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize privacy settings
  useEffect(() => {
    const settings = privacyControlsSystem.getPrivacySettings(userId);
    setPrivacySettings(settings || null);
  }, [userId]);

  const recordConsent = useCallback(async (
    consentType: UserConsent['consentType'], 
    granted: boolean
  ) => {
    try {
      setError(null);
      privacyControlsSystem.recordConsent(
        userId, 
        consentType, 
        granted, 
        '1.0',
        {
          ipAddress: await getClientIP(),
          userAgent: navigator.userAgent
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent');
    }
  }, [userId]);

  const withdrawConsent = useCallback(async (
    consentType: UserConsent['consentType'], 
    reason?: string
  ) => {
    try {
      setError(null);
      privacyControlsSystem.withdrawConsent(userId, consentType, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw consent');
    }
  }, [userId]);

  const hasConsent = useCallback((consentType: UserConsent['consentType']) => {
    return privacyControlsSystem.hasConsent(userId, consentType);
  }, [userId]);

  const getConsentHistory = useCallback(() => {
    return privacyControlsSystem.getConsentHistory(userId);
  }, [userId]);

  const updatePrivacySettings = useCallback(async (settings: Partial<PrivacySettings>) => {
    try {
      setIsLoading(true);
      setError(null);
      privacyControlsSystem.updatePrivacySettings(userId, settings);
      const updatedSettings = privacyControlsSystem.getPrivacySettings(userId);
      setPrivacySettings(updatedSettings || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const exportData = useCallback(async (format: 'json' | 'csv' | 'xml' = 'json') => {
    try {
      setIsLoading(true);
      setError(null);
      const data = privacyControlsSystem.exportUserData(userId, userId, format);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const deleteAllData = useCallback(async (reason?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      return privacyControlsSystem.deleteUserData(userId, userId, reason);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete data');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const getAccessLogs = useCallback(() => {
    try {
      return privacyControlsSystem.getAccessLogs(userId, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get access logs');
      return [];
    }
  }, [userId]);

  const encryptSensitiveData = useCallback((
    data: any, 
    level: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    try {
      return privacyControlsSystem.encryptData(data, level);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encrypt data');
      return '';
    }
  }, []);

  const anonymizeForAnalytics = useCallback((
    data: any, 
    method: 'basic' | 'k_anonymity' | 'differential_privacy' = 'basic'
  ) => {
    try {
      const anonymized = privacyControlsSystem.anonymizeData(userId, data, method);
      return anonymized.anonymizedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to anonymize data');
      return data;
    }
  }, [userId]);

  const contextValue: PrivacyContextType = {
    recordConsent,
    withdrawConsent,
    hasConsent,
    getConsentHistory,
    privacySettings,
    updatePrivacySettings,
    exportData,
    deleteAllData,
    getAccessLogs,
    encryptSensitiveData,
    anonymizeForAnalytics,
    isLoading,
    error
  };

  return (
    <PrivacyContext.Provider value={contextValue}>
      {children}
    </PrivacyContext.Provider>
  );
};

// Utility function to get client IP (would be implemented server-side)
async function getClientIP(): Promise<string> {
  try {
    // In production, this would call your API to get the client IP
    return '127.0.0.1'; // Placeholder
  } catch {
    return 'unknown';
  }
}

// Hook for admin/staff compliance monitoring
export const useComplianceMonitoring = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = useCallback(async (period: { start: Date; end: Date }) => {
    setIsLoading(true);
    try {
      const report = privacyControlsSystem.generateComplianceReport(period);
      setReports(prev => [report, ...prev]);
      return report;
    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getExistingReports = useCallback(() => {
    const existingReports = privacyControlsSystem.getComplianceReports();
    setReports(existingReports);
  }, []);

  useEffect(() => {
    getExistingReports();
  }, [getExistingReports]);

  return {
    reports,
    generateReport,
    isLoading
  };
};
