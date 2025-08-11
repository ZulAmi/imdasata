/**
 * SATA (Sentiment Analysis Therapy Assistant) - Main Landing Page
 * Comprehensive mental health platform with voice analysis and mood tracking
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function SATAHomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const router = useRouter();

  const features = [
    {
      icon: '🎙️',
      title: 'Voice Sentiment Analysis',
      description: 'AI-powered emotional tone analysis from voice recordings',
      details: 'Advanced Azure Cognitive Services integration for real-time emotion detection',
      demo: '/voice-analysis',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '😊',
      title: 'Mood Tracking Dashboard',
      description: 'Comprehensive mood logging with emoji-based selection',
      details: 'Track patterns, trends, and receive personalized AI insights',
      demo: '/mood-dashboard',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '📈',
      title: 'Trend Analysis',
      description: 'Visualize mood patterns and emotional wellbeing over time',
      details: 'Advanced analytics with correlation analysis and pattern recognition',
      demo: '/mood-dashboard',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: '🏥',
      title: 'Healthcare Integration',
      description: 'HIPAA-compliant reports for healthcare providers',
      details: 'Professional clinical reports with assessment correlation analysis',
      demo: '/mood-dashboard',
      color: 'from-red-500 to-orange-500'
    }
  ];

  const stats = [
    { number: '15+', label: 'Emotional States Detected', icon: '🎭' },
    { number: '7', label: 'Languages Supported', icon: '🌍' },
    { number: '24/7', label: 'Continuous Monitoring', icon: '⏰' },
    { number: '100%', label: 'Privacy Protected', icon: '🔒' }
  ];

  const useCases = [
    {
      icon: '👩‍⚕️',
      title: 'Mental Health Professionals',
      description: 'Clinical-grade mood tracking and sentiment analysis for patient care',
      features: ['Assessment correlation', 'Progress tracking', 'Professional reports']
    },
    {
      icon: '🧑‍💼',
      title: 'Wellness Programs',
      description: 'Employee wellbeing monitoring and workplace mental health initiatives',
      features: ['Team insights', 'Stress detection', 'Intervention triggers']
    },
    {
      icon: '🧑‍🎓',
      title: 'Research & Academia',
      description: 'Emotional wellbeing research with comprehensive data analytics',
      features: ['Longitudinal studies', 'Pattern analysis', 'Data export']
    },
    {
      icon: '👤',
      title: 'Personal Use',
      description: 'Individual mood tracking and emotional self-awareness development',
      features: ['Daily tracking', 'Trend visualization', 'Personalized insights']
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (path: string) => {
    setIsLoading(true);
    router.push(path).finally(() => setIsLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🧠</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SATA</h1>
                <p className="text-xs text-gray-600">Sentiment Analysis Therapy Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigate('/voice-analysis')}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Voice Analysis
              </button>
              <button
                onClick={() => handleNavigate('/mood-dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mood Dashboard
              </button>
              <Link href="/analytics-hub" className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>📈</span>
                <span>Analytics</span>
              </Link>
              <Link href="/reports" className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>📊</span>
                <span>Reports</span>
              </Link>
              <Link href="/admin-login" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1">
                <span>📊</span>
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Mental Health
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Sentiment Analysis
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Comprehensive emotional wellbeing platform combining voice sentiment analysis, 
              mood tracking, and clinical-grade reporting for mental health professionals and individuals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleNavigate('/mood-dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-200 shadow-lg"
                disabled={isLoading}
              >
                🚀 Start Mood Tracking
              </button>
              <button
                onClick={() => handleNavigate('/voice-analysis')}
                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg border border-gray-200"
                disabled={isLoading}
              >
                🎙️ Try Voice Analysis
              </button>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`relative p-6 rounded-2xl text-white transform transition-all duration-500 hover:scale-105 cursor-pointer ${
                    currentFeature === index ? 'scale-105 shadow-2xl' : 'shadow-lg'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${feature.color.split(' ')[0]?.replace('from-', '') || 'blue-500'} 0%, ${feature.color.split(' ')[1]?.replace('to-', '') || 'cyan-500'} 100%)`
                  }}
                  onClick={() => handleNavigate(feature.demo)}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/90 mb-3">{feature.description}</p>
                  <p className="text-sm text-white/80">{feature.details}</p>
                  
                  {currentFeature === index && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Powerful Analytics & Insights</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Advanced AI technology providing comprehensive emotional analysis and mental health tracking
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Every Use Case</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From individual wellness to clinical practice, SATA adapts to your specific mental health needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{useCase.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{useCase.title}</h3>
                    <p className="text-gray-600 mb-4">{useCase.description}</p>
                    <div className="space-y-2">
                      {useCase.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise-Grade Technology</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built with cutting-edge AI and cloud technologies for reliability, scalability, and security
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
            {[
              { name: 'Azure Cognitive Services', icon: '☁️' },
              { name: 'React & TypeScript', icon: '⚛️' },
              { name: 'Next.js Framework', icon: '🔥' },
              { name: 'AI Pattern Recognition', icon: '🤖' },
              { name: 'HIPAA Compliance', icon: '🔒' },
              { name: 'Real-time Analysis', icon: '⚡' }
            ].map((tech, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {tech.icon}
                </div>
                <div className="text-sm text-gray-700 font-medium">{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Mental Health Care?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users and healthcare professionals using SATA for comprehensive emotional wellbeing analysis
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigate('/mood-dashboard')}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg"
              disabled={isLoading}
            >
              🚀 Start Free Trial
            </button>
            <button
              onClick={() => handleNavigate('/voice-analysis')}
              className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-200"
              disabled={isLoading}
            >
              📋 View Demo
            </button>
          </div>
          
          <div className="mt-8 text-blue-100 text-sm">
            ✅ No credit card required • ✅ HIPAA compliant • ✅ 24/7 support
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="text-2xl">🧠</div>
                <div>
                  <div className="font-bold">SATA</div>
                  <div className="text-sm text-gray-400">Sentiment Analysis Therapy Assistant</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered mental health platform for comprehensive emotional wellbeing analysis and clinical integration.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Voice Sentiment Analysis</li>
                <li>Mood Tracking Dashboard</li>
                <li>Trend Analysis & Insights</li>
                <li>Healthcare Reports</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Clinical Practice</li>
                <li>Wellness Programs</li>
                <li>Research & Academia</li>
                <li>Personal Wellbeing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Technology</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Azure AI Services</li>
                <li>React & TypeScript</li>
                <li>HIPAA Compliance</li>
                <li>Real-time Processing</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 SATA - Sentiment Analysis Therapy Assistant. All rights reserved.</p>
            <p className="mt-2">Built with ❤️ for mental health professionals and individuals seeking emotional wellbeing.</p>
          </div>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin text-3xl mb-4">🔄</div>
            <p className="text-gray-700">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}
