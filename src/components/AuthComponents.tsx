/**
 * Authentication Components for Anonymous Authentication
 * Provides UI components for login, device management, and account recovery
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAnonymousAuth, useAuthActions } from '../hooks/useAnonymousAuth';
import { UserPreferences } from '../lib/anonymous-auth-system';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading } = useAnonymousAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Initializing secure connection...</p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <LoginComponent />;
  }

  return <>{children}</>;
};

export const LoginComponent: React.FC = () => {
  const { login, recoverAccount } = useAnonymousAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login();
      if (!success) {
        setError('Failed to create secure connection. Please try again.');
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryToken.trim()) {
      setError('Please enter your recovery token');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const success = await recoverAccount(recoveryToken);
      if (!success) {
        setError('Invalid recovery token. Please check and try again.');
      }
    } catch (error) {
      setError('Recovery failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>🔒 Secure Anonymous Access</h2>
          <p>Your privacy is protected. No personal information is collected.</p>
        </div>

        {!showRecovery ? (
          <div className="login-section">
            <div className="privacy-notice">
              <div className="privacy-icon">🛡️</div>
              <div>
                <h3>Anonymous & Secure</h3>
                <ul>
                  <li>✅ No personal data required</li>
                  <li>✅ Device-based authentication</li>
                  <li>✅ PDPA compliant</li>
                  <li>✅ End-to-end encryption</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={handleLogin}
              disabled={isLoading}
              className="login-button"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Connecting...
                </>
              ) : (
                'Enter Anonymously'
              )}
            </button>

            <div className="recovery-link">
              <button 
                onClick={() => setShowRecovery(true)}
                className="link-button"
              >
                Have a recovery token?
              </button>
            </div>
          </div>
        ) : (
          <div className="recovery-section">
            <h3>Account Recovery</h3>
            <p>Enter your recovery token to restore access:</p>
            
            <div className="input-group">
              <input
                type="text"
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                placeholder="Enter recovery token"
                className="recovery-input"
              />
            </div>

            <div className="recovery-actions">
              <button 
                onClick={handleRecovery}
                disabled={isLoading || !recoveryToken.trim()}
                className="recovery-button"
              >
                {isLoading ? 'Recovering...' : 'Recover Account'}
              </button>
              
              <button 
                onClick={() => {
                  setShowRecovery(false);
                  setRecoveryToken('');
                  setError('');
                }}
                className="back-button"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .auth-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .auth-header h2 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 24px;
        }

        .auth-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .privacy-notice {
          display: flex;
          gap: 15px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 30px;
          align-items: flex-start;
        }

        .privacy-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .privacy-notice h3 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 16px;
        }

        .privacy-notice ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .privacy-notice li {
          color: #555;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .login-button, .recovery-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-button:hover, .recovery-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .login-button:disabled, .recovery-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .recovery-link {
          text-align: center;
          margin-top: 20px;
        }

        .link-button {
          background: none;
          border: none;
          color: #667eea;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
        }

        .recovery-section h3 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .recovery-section p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 14px;
        }

        .input-group {
          margin-bottom: 20px;
        }

        .recovery-input {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }

        .recovery-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .recovery-actions {
          display: flex;
          gap: 10px;
          flex-direction: column;
        }

        .back-button {
          background: #f8f9fa;
          color: #6c757d;
          border: 1px solid #dee2e6;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: #e9ecef;
        }

        .error-message {
          background: #fff5f5;
          color: #c53030;
          padding: 12px 15px;
          border-radius: 8px;
          margin-top: 20px;
          font-size: 14px;
          border: 1px solid #fed7d7;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auth-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const AccountManagement: React.FC = () => {
  const { 
    user, 
    updatePreferences, 
    generateRecoveryTokens, 
    exportData, 
    deleteAccount,
    logout,
    trustScore
  } = useAnonymousAuth();
  
  const [recoveryTokens, setRecoveryTokens] = useState<string[]>([]);
  const [showTokens, setShowTokens] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(user?.preferences || {
    language: 'en',
    theme: 'auto',
    notificationsEnabled: true,
    dataRetentionPeriod: 365,
    anonymityLevel: 'enhanced'
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleGenerateTokens = async () => {
    setIsGenerating(true);
    try {
      const tokens = await generateRecoveryTokens();
      setRecoveryTokens(tokens);
      setShowTokens(true);
    } catch (error) {
      console.error('Failed to generate recovery tokens:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sata-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await updatePreferences(preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="account-management">
      <div className="section">
        <h3>🛡️ Account Security</h3>
        <div className="trust-score">
          <span>Trust Score: </span>
          <div className="trust-meter">
            <div 
              className="trust-fill" 
              style={{ width: `${trustScore * 100}%` }}
            ></div>
          </div>
          <span>{Math.round(trustScore * 100)}%</span>
        </div>
        
        <div className="account-info">
          <p><strong>Anonymous ID:</strong> {user.id.slice(0, 8)}...{user.id.slice(-8)}</p>
          <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p><strong>Trust Score:</strong> {Math.round(trustScore * 100)}%</p>
        </div>
      </div>

      <div className="section">
        <h3>🔑 Recovery Tokens</h3>
        <p>Generate backup tokens to recover your account if you lose access.</p>
        
        {!showTokens ? (
          <button 
            onClick={handleGenerateTokens}
            disabled={isGenerating}
            className="action-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Recovery Tokens'}
          </button>
        ) : (
          <div className="recovery-tokens">
            <div className="warning">
              ⚠️ Save these tokens securely. They will only be shown once.
            </div>
            <div className="tokens-list">
              {recoveryTokens.map((token, index) => (
                <div key={index} className="token">
                  <span>{index + 1}.</span>
                  <code>{token}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <h3>⚙️ Preferences</h3>
        <div className="preferences">
          <label>
            <input
              type="checkbox"
              checked={preferences.notificationsEnabled || false}
              onChange={(e) => setPreferences({
                ...preferences,
                notificationsEnabled: e.target.checked
              })}
            />
            Enable Notifications
          </label>
          
          <label>
            Language:
            <select 
              value={preferences.language || 'en'}
              onChange={(e) => setPreferences({
                ...preferences,
                language: e.target.value
              })}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </label>

          <label>
            Anonymity Level:
            <select 
              value={preferences.anonymityLevel || 'enhanced'}
              onChange={(e) => setPreferences({
                ...preferences,
                anonymityLevel: e.target.value as 'basic' | 'enhanced' | 'maximum'
              })}
            >
              <option value="basic">Basic</option>
              <option value="enhanced">Enhanced</option>
              <option value="maximum">Maximum</option>
            </select>
          </label>

          <button onClick={handleUpdatePreferences} className="action-button">
            Save Preferences
          </button>
        </div>
      </div>

      <div className="section">
        <h3>📊 Data Management</h3>
        <div className="data-actions">
          <button onClick={handleExportData} className="action-button">
            Export My Data
          </button>
          
          <button onClick={logout} className="action-button secondary">
            Sign Out
          </button>
          
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="action-button danger"
          >
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>⚠️ Delete Account</h3>
            <p>This action cannot be undone. All your data will be permanently deleted.</p>
            <div className="modal-actions">
              <button 
                onClick={handleDeleteAccount}
                className="action-button danger"
              >
                Delete Permanently
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="action-button secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .account-management {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .section h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .trust-score {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .trust-meter {
          flex: 1;
          height: 8px;
          background: #e9ecef;
          border-radius: 4px;
          overflow: hidden;
        }

        .trust-fill {
          height: 100%;
          background: linear-gradient(90deg, #dc3545 0%, #ffc107 50%, #28a745 100%);
          transition: width 0.3s ease;
        }

        .account-info p {
          margin: 8px 0;
          color: #666;
        }

        .action-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          margin-right: 12px;
          margin-bottom: 12px;
          transition: background 0.3s ease;
        }

        .action-button:hover {
          background: #5a6fd8;
        }

        .action-button.secondary {
          background: #6c757d;
        }

        .action-button.secondary:hover {
          background: #5a6268;
        }

        .action-button.danger {
          background: #dc3545;
        }

        .action-button.danger:hover {
          background: #c82333;
        }

        .recovery-tokens {
          margin-top: 16px;
        }

        .warning {
          background: #fff3cd;
          color: #856404;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #ffeaa7;
        }

        .tokens-list {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
        }

        .token {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          font-family: monospace;
        }

        .token code {
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .preferences label {
          display: block;
          margin-bottom: 16px;
        }

        .preferences input[type="checkbox"] {
          margin-right: 8px;
        }

        .preferences select {
          margin-left: 8px;
          padding: 4px 8px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }

        .data-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
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
          max-width: 400px;
          width: 90%;
        }

        .modal h3 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .modal p {
          margin: 0 0 20px 0;
          color: #666;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};
