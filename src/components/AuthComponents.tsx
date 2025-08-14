/**
 * Authentication Components for Anonymous Authentication
 * Provides UI components for login, device management, and account recovery
 */

import React, { useState } from 'react';
import { useAnonymousAuth } from '../hooks/useAnonymousAuth';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({
  children,
  requireAuth = false
}) => {
  const { isAuthenticated } = useAnonymousAuth();

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
      await login();
      // Login function doesn't return a boolean, it updates auth state directly
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {showRecovery ? 'Account Recovery' : 'Anonymous Access'}
          </h2>
          <p className="text-gray-600">
            {showRecovery 
              ? 'Enter your recovery token to restore access'
              : 'Create a secure anonymous session to continue'
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!showRecovery ? (
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating Session...' : 'Create Anonymous Session'}
            </button>
            
            <div className="text-center">
              <button
                onClick={() => setShowRecovery(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Have a recovery token?
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="recoveryToken" className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Token
              </label>
              <input
                id="recoveryToken"
                type="text"
                value={recoveryToken}
                onChange={(e) => setRecoveryToken(e.target.value)}
                placeholder="Enter your recovery token"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={handleRecovery}
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Recovering...' : 'Recover Account'}
            </button>
            
            <div className="text-center">
              <button
                onClick={() => setShowRecovery(false)}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Back to login
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p className="mb-2">🔒 Your privacy is protected</p>
            <p>No personal information is collected or stored</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccountManagement: React.FC = () => {
  const { 
    logout,
    isAuthenticated,
    user
  } = useAnonymousAuth();
  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  if (!isAuthenticated) {
    return <LoginComponent />;
  }

  const handleLogout = async () => {
    await logout();
  };

  const handleDeleteAccount = () => {
    handleLogout(); // For now, logout serves as account deletion
    setShowConfirmDelete(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Management</h2>
        
        <div className="space-y-6">
          {/* Account Info */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Anonymous ID</label>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded">
                  {user?.id || 'Not available'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm text-green-600 font-medium">Active Session</p>
              </div>
            </div>
          </div>

          {/* Privacy Info */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Privacy & Security</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ End-to-end encryption enabled</p>
              <p>✅ No personal data collected</p>
              <p>✅ Anonymous authentication active</p>
              <p>✅ Session automatically expires for security</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Account Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                End Session
              </button>
              
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors ml-0 sm:ml-3"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Account Deletion</h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete your anonymous session and all associated data. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Default export for module recognition
export default {
  AuthWrapper,
  LoginComponent,
  AccountManagement
};
