/**
 * SATA Admin Login Page
 * Enhanced administrative login supporting both SATA and legacy systems
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface AdminCredentials {
  username: string;
  password: string;
  loginType: 'sata' | 'legacy';
}

export default function AdminLogin() {
  const [credentials, setCredentials] = useState<AdminCredentials>({ 
    username: '', 
    password: '', 
    loginType: 'sata' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // SATA Admin Users Database (in production, this would be from a secure backend)
  const sataAdmins = [
    {
      username: 'sata_admin',
      password: 'secure_admin_2024',
      role: 'super_admin' as const,
      permissions: ['view_dashboard', 'manage_users', 'system_admin', 'view_analytics', 'export_data']
    },
    {
      username: 'clinical_admin',
      password: 'clinical_access_2024',
      role: 'clinician' as const,
      permissions: ['view_dashboard', 'view_analytics', 'export_clinical_data']
    },
    {
      username: 'analyst',
      password: 'data_analyst_2024',
      role: 'analyst' as const,
      permissions: ['view_dashboard', 'view_analytics', 'export_data']
    },
    {
      username: 'staff_admin',
      password: 'staff_admin_2024',
      role: 'admin' as const,
      permissions: ['view_dashboard', 'view_analytics']
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (credentials.loginType === 'sata') {
        // SATA Admin Authentication
        const admin = sataAdmins.find(
          admin => admin.username === credentials.username && admin.password === credentials.password
        );

        if (admin) {
          // Set SATA admin session
          const adminUser = {
            id: `sata_${admin.username}`,
            username: admin.username.replace('_', ' ').toUpperCase(),
            role: admin.role,
            permissions: admin.permissions,
            lastLogin: new Date()
          };

          localStorage.setItem('sata_admin_token', `sata_token_${Date.now()}`);
          localStorage.setItem('sata_admin_user', JSON.stringify(adminUser));
          
          // Track admin login
          console.log(`SATA Admin Login: ${admin.username} (${admin.role})`);
          
          router.push('/admin-dashboard');
        } else {
          setError('Invalid SATA admin credentials. Please check your username and password.');
        }
      } else {
        // Legacy Authentication
        if (credentials.username === 'admin' && credentials.password === 'analytics123') {
          localStorage.setItem('adminAuthenticated', 'true');
          router.push('/admin-dashboard');
        } else {
          setError('Invalid legacy credentials. Demo: admin / analytics123');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (adminType: string) => {
    const demoCredentials = {
      'super_admin': { username: 'sata_admin', password: 'secure_admin_2024' },
      'clinician': { username: 'clinical_admin', password: 'clinical_access_2024' },
      'analyst': { username: 'analyst', password: 'data_analyst_2024' },
      'staff': { username: 'staff_admin', password: 'staff_admin_2024' },
      'legacy': { username: 'admin', password: 'analytics123' }
    };

    const demo = demoCredentials[adminType as keyof typeof demoCredentials];
    if (demo) {
      setCredentials({
        username: demo.username,
        password: demo.password,
        loginType: adminType === 'legacy' ? 'legacy' : 'sata'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🛡️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            SATA Admin Access
          </h1>
          <p className="text-gray-600 text-sm">
            Comprehensive Mental Health Platform Administration
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setCredentials(prev => ({ ...prev, loginType: 'sata' }))}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                credentials.loginType === 'sata'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🏥 SATA Admin
            </button>
            <button
              type="button"
              onClick={() => setCredentials(prev => ({ ...prev, loginType: 'legacy' }))}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                credentials.loginType === 'legacy'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Legacy System
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder={credentials.loginType === 'sata' ? 'Enter SATA username' : 'Enter legacy username'}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">❌ {error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">🔄</span>
                Authenticating...
              </span>
            ) : (
              `🔓 Login to ${credentials.loginType === 'sata' ? 'SATA Admin' : 'Legacy System'}`
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Accounts</h3>
          
          {credentials.loginType === 'sata' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDemoLogin('super_admin')}
                className="text-xs bg-red-50 text-red-700 py-2 px-3 rounded border border-red-200 hover:bg-red-100 transition-colors"
              >
                🔴 Super Admin
              </button>
              <button
                onClick={() => handleDemoLogin('clinician')}
                className="text-xs bg-green-50 text-green-700 py-2 px-3 rounded border border-green-200 hover:bg-green-100 transition-colors"
              >
                🩺 Clinician
              </button>
              <button
                onClick={() => handleDemoLogin('analyst')}
                className="text-xs bg-blue-50 text-blue-700 py-2 px-3 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                📊 Analyst
              </button>
              <button
                onClick={() => handleDemoLogin('staff')}
                className="text-xs bg-gray-50 text-gray-700 py-2 px-3 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                👤 Staff Admin
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleDemoLogin('legacy')}
              className="w-full text-xs bg-gray-50 text-gray-700 py-2 px-3 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              📊 Legacy Admin Demo
            </button>
          )}
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Click any demo account to auto-fill credentials
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-xs text-center">
            🔒 Admin access is logged and monitored. Only authorized personnel should access this system.
          </p>
        </div>

        {/* Navigation */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
          >
            ← Return to SATA Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}
