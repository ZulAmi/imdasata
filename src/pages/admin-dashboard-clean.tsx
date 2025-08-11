/**
 * SATA Admin Dashboard Page - Clean Implementation
 * Comprehensive administrative interface for SATA staff
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminDashboard from '../components/AdminDashboard';

interface AdminUser {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'analyst' | 'clinician';
  permissions: string[];
  lastLogin: Date;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      // Check if admin is logged in
      const token = localStorage.getItem('sata_admin_token');
      const adminData = localStorage.getItem('sata_admin_user');
      const legacyAuth = localStorage.getItem('adminAuthenticated');

      if (token && adminData) {
        // New SATA admin authentication
        const user = JSON.parse(adminData);
        setAdminUser(user);
        setIsAuthenticated(true);
      } else if (legacyAuth === 'true') {
        // Legacy authentication - create default admin user
        const defaultAdmin: AdminUser = {
          id: 'legacy-admin',
          username: 'Legacy Admin',
          role: 'admin',
          permissions: ['view_dashboard', 'view_analytics', 'manage_users'],
          lastLogin: new Date()
        };
        setAdminUser(defaultAdmin);
        setIsAuthenticated(true);
      } else {
        // Redirect to admin login
        router.push('/admin-login');
        return;
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.push('/admin-login');
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sata_admin_token');
    localStorage.removeItem('sata_admin_user');
    localStorage.removeItem('adminAuthenticated');
    router.push('/admin-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !adminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600">Access denied. Please log in.</p>
          <button 
            onClick={() => router.push('/admin-login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🛡️</div>
              <div>
                <h1 className="text-lg font-semibold">SATA Administrative Portal</h1>
                <p className="text-blue-200 text-sm">
                  Logged in as: {adminUser.username} ({adminUser.role.replace('_', ' ')})
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-200">
                Last login: {adminUser.lastLogin.toLocaleDateString()}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-700 rounded transition-colors text-sm"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Access Notice */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-sm text-yellow-800">
              Administrative access granted. All actions are logged and monitored for security compliance.
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      {adminUser.permissions.includes('view_dashboard') ? (
        <AdminDashboard />
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-6">
              Your current role ({adminUser.role.replace('_', ' ')}) does not have access to the admin dashboard.
            </p>
            <p className="text-sm text-gray-500">
              Contact your system administrator to request additional permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
