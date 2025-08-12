/**
 * Privacy Controls UI Components
 * Provides comprehensive privacy management interfaces
 */

import React, { useState, useEffect } from 'react';
import { usePrivacyControls, useComplianceMonitoring } from '../hooks/usePrivacyControls';
import { UserConsent, PrivacySettings, DataAccessLog } from '../lib/privacy-controls';

// Consent Management Component
export const ConsentManager: React.FC = () => {
  const { 
    recordConsent, 
    withdrawConsent, 
    hasConsent, 
    getConsentHistory,
    isLoading 
  } = usePrivacyControls();

  const [consentHistory, setConsentHistory] = useState<UserConsent[]>([]);

  useEffect(() => {
    setConsentHistory(getConsentHistory());
  }, [getConsentHistory]);

  const consentTypes = [
    {
      type: 'data_collection' as const,
      title: 'Data Collection',
      description: 'Allow SATA to collect and store your mental health data for personalized insights and support.'
    },
    {
      type: 'analytics' as const,
      title: 'Analytics',
      description: 'Allow anonymized analysis of your data to improve SATA services and mental health research.'
    },
    {
      type: 'research' as const,
      title: 'Research',
      description: 'Contribute your anonymized data to mental health research studies (completely anonymous).'
    },
    {
      type: 'sharing' as const,
      title: 'Healthcare Provider Sharing',
      description: 'Allow sharing of your data with healthcare providers you authorize.'
    }
  ];

  const handleConsentChange = async (type: UserConsent['consentType'], granted: boolean) => {
    if (granted) {
      await recordConsent(type, true);
    } else {
      await withdrawConsent(type, 'User preference change');
    }
    setConsentHistory(getConsentHistory());
  };

  return (
    <div className="consent-manager">
      <div className="section-header">
        <h3>🛡️ Privacy Consent Management</h3>
        <p>Control how your data is used and shared. You can change these settings anytime.</p>
      </div>

      <div className="consent-options">
        {consentTypes.map(({ type, title, description }) => {
          const currentConsent = hasConsent(type);
          
          return (
            <div key={type} className="consent-option">
              <div className="consent-info">
                <h4>{title}</h4>
                <p>{description}</p>
              </div>
              
              <div className="consent-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={currentConsent}
                    onChange={(e) => handleConsentChange(type, e.target.checked)}
                    disabled={isLoading}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`status ${currentConsent ? 'granted' : 'denied'}`}>
                  {currentConsent ? 'Granted' : 'Not Granted'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="consent-history">
        <h4>📋 Consent History</h4>
        <div className="history-list">
          {consentHistory.slice(0, 10).map((consent) => (
            <div key={consent.consentId} className="history-item">
              <div className="history-info">
                <span className="consent-type">{consent.consentType.replace('_', ' ')}</span>
                <span className={`consent-status ${consent.granted ? 'granted' : 'withdrawn'}`}>
                  {consent.granted ? 'Granted' : 'Withdrawn'}
                </span>
              </div>
              <div className="history-date">
                {new Date(consent.timestamp).toLocaleString()}
                {consent.withdrawnAt && (
                  <span className="withdrawn-date">
                    (Withdrawn: {new Date(consent.withdrawnAt).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .consent-manager {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .section-header p {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .consent-options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .consent-option {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .consent-info {
          flex: 1;
          margin-right: 16px;
        }

        .consent-info h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1rem;
        }

        .consent-info p {
          margin: 0;
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .consent-control {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #28a745;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(26px);
        }

        .status {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status.granted {
          color: #28a745;
        }

        .status.denied {
          color: #dc3545;
        }

        .consent-history h4 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 1rem;
        }

        .history-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .consent-type {
          font-weight: 500;
          color: #333;
          text-transform: capitalize;
        }

        .consent-status {
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .consent-status.granted {
          color: #28a745;
        }

        .consent-status.withdrawn {
          color: #dc3545;
        }

        .history-date {
          font-size: 0.8rem;
          color: #666;
          text-align: right;
        }

        .withdrawn-date {
          display: block;
          margin-top: 4px;
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

// Privacy Settings Component
export const PrivacySettingsManager: React.FC = () => {
  const { privacySettings, updatePrivacySettings, isLoading } = usePrivacyControls();
  const [settings, setSettings] = useState<Partial<PrivacySettings>>({});

  useEffect(() => {
    if (privacySettings) {
      setSettings(privacySettings);
    }
  }, [privacySettings]);

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    await updatePrivacySettings(settings);
  };

  return (
    <div className="privacy-settings">
      <div className="section-header">
        <h3>⚙️ Privacy Settings</h3>
        <p>Configure how your data is handled and protected.</p>
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <h4>🔐 Data Encryption</h4>
          <select
            value={settings.encryptionLevel || 'standard'}
            onChange={(e) => handleSettingChange('encryptionLevel', e.target.value)}
          >
            <option value="standard">Standard Encryption</option>
            <option value="enhanced">Enhanced Encryption</option>
            <option value="maximum">Maximum Encryption</option>
          </select>
          <p className="setting-description">
            Higher levels provide stronger encryption but may impact performance.
          </p>
        </div>

        <div className="setting-group">
          <h4>🕐 Data Retention</h4>
          <select
            value={settings.dataRetentionPeriod || 365}
            onChange={(e) => handleSettingChange('dataRetentionPeriod', parseInt(e.target.value))}
          >
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={180}>6 months</option>
            <option value={365}>1 year</option>
            <option value={730}>2 years</option>
          </select>
          <p className="setting-description">
            How long your data is kept before automatic deletion.
          </p>
        </div>

        <div className="setting-group">
          <h4>🎭 Anonymization</h4>
          <select
            value={settings.anonymizationPreference || 'opt_in'}
            onChange={(e) => handleSettingChange('anonymizationPreference', e.target.value)}
          >
            <option value="always">Always Anonymize</option>
            <option value="opt_in">Opt-in for Anonymization</option>
            <option value="opt_out">Opt-out of Anonymization</option>
          </select>
          <p className="setting-description">
            Control when your data is anonymized for analytics.
          </p>
        </div>

        <div className="setting-group">
          <h4>📊 Analytics</h4>
          <label className="checkbox-setting">
            <input
              type="checkbox"
              checked={settings.allowAnalytics || false}
              onChange={(e) => handleSettingChange('allowAnalytics', e.target.checked)}
            />
            Allow analytics processing
          </label>
          <p className="setting-description">
            Enable anonymized analysis to improve services.
          </p>
        </div>

        <div className="setting-group">
          <h4>🔬 Research</h4>
          <label className="checkbox-setting">
            <input
              type="checkbox"
              checked={settings.allowResearch || false}
              onChange={(e) => handleSettingChange('allowResearch', e.target.checked)}
            />
            Contribute to research
          </label>
          <p className="setting-description">
            Share anonymized data for mental health research.
          </p>
        </div>

        <div className="setting-group">
          <h4>🔗 Data Sharing</h4>
          <label className="checkbox-setting">
            <input
              type="checkbox"
              checked={settings.allowSharing || false}
              onChange={(e) => handleSettingChange('allowSharing', e.target.checked)}
            />
            Allow authorized sharing
          </label>
          <p className="setting-description">
            Enable sharing with healthcare providers you authorize.
          </p>
        </div>

        <div className="setting-group">
          <h4>🗑️ Right to be Forgotten</h4>
          <label className="checkbox-setting">
            <input
              type="checkbox"
              checked={settings.rightToForgotten ?? true}
              onChange={(e) => handleSettingChange('rightToForgotten', e.target.checked)}
            />
            Enable complete data deletion
          </label>
          <p className="setting-description">
            Allow complete removal of all your data on request.
          </p>
        </div>

        <div className="setting-group">
          <h4>🎯 Data Minimization</h4>
          <label className="checkbox-setting">
            <input
              type="checkbox"
              checked={settings.dataMinimization ?? true}
              onChange={(e) => handleSettingChange('dataMinimization', e.target.checked)}
            />
            Minimize data collection
          </label>
          <p className="setting-description">
            Only collect essential data for your mental health support.
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          onClick={saveSettings}
          disabled={isLoading}
          className="save-button"
        >
          {isLoading ? 'Saving...' : 'Save Privacy Settings'}
        </button>
      </div>

      <style jsx>{`
        .privacy-settings {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .section-header p {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .setting-group {
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .setting-group h4 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 1rem;
        }

        .setting-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: white;
          font-size: 0.9rem;
        }

        .checkbox-setting {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #333;
        }

        .checkbox-setting input {
          margin: 0;
        }

        .setting-description {
          margin: 8px 0 0 0;
          font-size: 0.8rem;
          color: #666;
          line-height: 1.4;
        }

        .settings-actions {
          display: flex;
          justify-content: center;
        }

        .save-button {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .save-button:hover {
          background: #218838;
        }

        .save-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

// Data Management Component
export const DataManagement: React.FC = () => {
  const { exportData, deleteAllData, getAccessLogs, isLoading } = usePrivacyControls();
  const [accessLogs, setAccessLogs] = useState<DataAccessLog[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setAccessLogs(getAccessLogs());
  }, [getAccessLogs]);

  const handleExport = async (format: 'json' | 'csv' | 'xml') => {
    try {
      const data = await exportData(format);
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
        type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/xml'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sata-data-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const success = await deleteAllData('User requested deletion');
      if (success) {
        setShowDeleteConfirm(false);
        alert('All your data has been successfully deleted.');
      } else {
        alert('Data deletion failed. Please try again.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Data deletion failed. Please try again.');
    }
  };

  return (
    <div className="data-management">
      <div className="section-header">
        <h3>📊 Data Management</h3>
        <p>Export your data or request complete deletion (Right to be Forgotten).</p>
      </div>

      <div className="management-sections">
        <div className="export-section">
          <h4>📁 Export Your Data</h4>
          <p>Download all your data in your preferred format:</p>
          <div className="export-buttons">
            <button onClick={() => handleExport('json')} disabled={isLoading}>
              📄 Export as JSON
            </button>
            <button onClick={() => handleExport('csv')} disabled={isLoading}>
              📊 Export as CSV
            </button>
            <button onClick={() => handleExport('xml')} disabled={isLoading}>
              📋 Export as XML
            </button>
          </div>
        </div>

        <div className="delete-section">
          <h4>🗑️ Delete All Data</h4>
          <p>Permanently delete all your data from SATA (this cannot be undone):</p>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="delete-button"
          >
            🚨 Request Data Deletion
          </button>
        </div>

        <div className="access-logs-section">
          <h4>📋 Data Access History</h4>
          <p>Recent access to your data:</p>
          <div className="logs-container">
            {accessLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="log-item">
                <div className="log-info">
                  <span className="log-operation">{log.operation}</span>
                  <span className="log-data-type">{log.dataType}</span>
                  <span className={`log-status ${log.success ? 'success' : 'failed'}`}>
                    {log.success ? '✅' : '❌'}
                  </span>
                </div>
                <div className="log-details">
                  <span className="log-purpose">{log.purpose}</span>
                  <span className="log-date">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Confirm Data Deletion</h3>
            <p>
              This will permanently delete ALL your data from SATA, including:
            </p>
            <ul>
              <li>All mood entries and voice recordings</li>
              <li>Assessment results and insights</li>
              <li>Personal preferences and settings</li>
              <li>Account information</li>
            </ul>
            <p><strong>This action cannot be undone.</strong></p>
            <div className="modal-actions">
              <button onClick={handleDelete} className="confirm-delete">
                Yes, Delete Everything
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .data-management {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .section-header p {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .management-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .export-section,
        .delete-section,
        .access-logs-section {
          padding: 20px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .export-section h4,
        .delete-section h4,
        .access-logs-section h4 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 1rem;
        }

        .export-section p,
        .delete-section p,
        .access-logs-section p {
          margin: 0 0 16px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .export-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .export-buttons button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .export-buttons button:hover {
          background: #0056b3;
        }

        .delete-button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .delete-button:hover {
          background: #c82333;
        }

        .delete-button:disabled,
        .export-buttons button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .logs-container {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          background: white;
        }

        .log-item {
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .log-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .log-operation {
          background: #007bff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .log-data-type {
          background: #6c757d;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .log-status.success {
          color: #28a745;
        }

        .log-status.failed {
          color: #dc3545;
        }

        .log-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .log-purpose {
          font-size: 0.8rem;
          color: #666;
        }

        .log-date {
          font-size: 0.75rem;
          color: #999;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .modal h3 {
          margin: 0 0 16px 0;
          color: #dc3545;
        }

        .modal p {
          margin: 0 0 16px 0;
          color: #666;
        }

        .modal ul {
          margin: 0 0 16px 20px;
          color: #666;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .confirm-delete {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .modal-actions button:last-child {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

// Compliance Dashboard for Admin/Staff
export const ComplianceDashboard: React.FC = () => {
  const { reports, generateReport, isLoading } = useComplianceMonitoring();
  const [selectedPeriod, setSelectedPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  });

  const handleGenerateReport = async () => {
    await generateReport(selectedPeriod);
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="compliance-dashboard">
      <div className="section-header">
        <h3>📊 Privacy Compliance Dashboard</h3>
        <p>Monitor privacy compliance and generate reports for regulatory requirements.</p>
      </div>

      <div className="report-generation">
        <h4>Generate New Report</h4>
        <div className="date-inputs">
          <label>
            Start Date:
            <input
              type="date"
              value={selectedPeriod.start.toISOString().split('T')[0]}
              onChange={(e) => setSelectedPeriod(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={selectedPeriod.end.toISOString().split('T')[0]}
              onChange={(e) => setSelectedPeriod(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
            />
          </label>
          <button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="reports-list">
        <h4>Recent Compliance Reports</h4>
        {reports.length === 0 ? (
          <p>No compliance reports generated yet.</p>
        ) : (
          <div className="reports-grid">
            {reports.slice(0, 6).map((report) => (
              <div key={report.reportId} className="report-card">
                <div className="report-header">
                  <h5>Report {report.reportId.slice(-8)}</h5>
                  <div 
                    className="compliance-score"
                    style={{ 
                      backgroundColor: getComplianceScoreColor(report.complianceScore),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {report.complianceScore.toFixed(1)}%
                  </div>
                </div>
                
                <div className="report-summary">
                  <div className="summary-item">
                    <span>Total Users:</span>
                    <span>{report.totalUsers}</span>
                  </div>
                  <div className="summary-item">
                    <span>Data Accesses:</span>
                    <span>{report.dataAccess.totalAccesses}</span>
                  </div>
                  <div className="summary-item">
                    <span>Consents Granted:</span>
                    <span>{report.consentStatus.granted}</span>
                  </div>
                  <div className="summary-item">
                    <span>Data Exports:</span>
                    <span>{report.dataRequests.exports}</span>
                  </div>
                  <div className="summary-item">
                    <span>Incidents:</span>
                    <span>{report.incidents.length}</span>
                  </div>
                </div>

                <div className="report-period">
                  {new Date(report.period.start).toLocaleDateString()} - 
                  {new Date(report.period.end).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .compliance-dashboard {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .section-header p {
          margin: 0 0 24px 0;
          color: #666;
          font-size: 0.9rem;
        }

        .report-generation {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 32px;
        }

        .report-generation h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .date-inputs {
          display: flex;
          gap: 16px;
          align-items: end;
          flex-wrap: wrap;
        }

        .date-inputs label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.9rem;
          color: #333;
        }

        .date-inputs input {
          padding: 8px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }

        .date-inputs button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }

        .date-inputs button:hover {
          background: #0056b3;
        }

        .date-inputs button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reports-list h4 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .report-card {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 16px;
          background: #f8f9fa;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .report-header h5 {
          margin: 0;
          color: #333;
          font-size: 1rem;
        }

        .report-summary {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }

        .summary-item span:first-child {
          color: #666;
        }

        .summary-item span:last-child {
          font-weight: 600;
          color: #333;
        }

        .report-period {
          font-size: 0.8rem;
          color: #999;
          text-align: center;
          padding-top: 12px;
          border-top: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};
