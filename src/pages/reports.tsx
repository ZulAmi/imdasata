/**
 * SATA Automated Reports Page
 * Main interface for accessing the reporting system
 */

import React from 'react';
import ReportingEngine from '../components/ReportingEngine';
import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="text-3xl">🧠</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SATA</h1>
                  <p className="text-xs text-gray-600">Sentiment Analysis Therapy Assistant</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/admin-dashboard" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>📊</span>
                <span>Admin Dashboard</span>
              </Link>
              <Link href="/mood-dashboard" className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>😊</span>
                <span>Mood Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <ReportingEngine />
    </div>
  );
}
