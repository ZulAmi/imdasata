'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Heart } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <Heart className="w-24 h-24 text-blue-500 mx-auto mb-4 opacity-50" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist. Let's get you back to a safe space.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full justify-center"
          >
            <Home className="w-5 h-5" />
            Return Home
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors w-full justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Need immediate support?</strong><br />
            Crisis Hotline: <span className="font-semibold">988</span><br />
            Text: <span className="font-semibold">HOME to 741741</span>
          </p>
        </div>
      </div>
    </div>
  );
}
