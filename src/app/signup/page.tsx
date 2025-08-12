'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, MessageCircle, ArrowRight, CheckCircle, Heart } from 'lucide-react';

export default function SignupPage() {
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
    // Redirect to chat after a brief delay
    setTimeout(() => {
      window.location.href = '/chat';
    }, 2000);
  };

  if (isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to SATA!</h1>
            <p className="text-gray-600 mb-6">
              You're all set! Redirecting to your anonymous chat session...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-4">
              <Heart className="w-16 h-16 text-pink-300" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            No Signup Required
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Start your mental health journey immediately with complete anonymity. 
            No forms, no personal information, no barriers to getting help.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Features */}
          <div className="space-y-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-8">Why No Signup?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-3 flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Complete Privacy</h3>
                    <p className="text-blue-100">
                      No personal information means no data breaches, no tracking, 
                      and no privacy concerns. Your identity is never at risk.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-3 flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Immediate Access</h3>
                    <p className="text-blue-100">
                      Start getting help right now. No barriers, no waiting, 
                      no forms to fill out when you need support most.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-white/20 backdrop-blur-lg rounded-full p-3 flex-shrink-0">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Reduced Stigma</h3>
                    <p className="text-blue-100">
                      Seek help without fear of judgment or disclosure. 
                      Your mental health journey is completely private.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">What You Get Instantly:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>AI Chat Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Mental Health Assessments</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Mood Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Crisis Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Resource Library</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span>Multi-Language Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - CTA */}
          <div className="bg-white rounded-lg shadow-2xl p-8 lg:p-12">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-blue-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Journey Now
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Click below to begin your anonymous mental health support session. 
                No information required - just compassionate AI assistance.
              </p>

              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-8 rounded-lg font-bold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3 mb-6"
              >
                Start Anonymous Chat
                <ArrowRight className="w-6 h-6" />
              </button>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>100% Anonymous & Encrypted</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>No Personal Data Required</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 text-green-600" />
                  <span>Available 24/7</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  Want to learn more first?
                </p>
                <div className="flex justify-center gap-4">
                  <Link 
                    href="/assessment"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Take Assessment
                  </Link>
                  <span className="text-gray-300">•</span>
                  <Link 
                    href="/about"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-red-600/20 border border-red-400/30 rounded-lg p-6 backdrop-blur-sm max-w-2xl mx-auto">
            <h3 className="font-bold text-white mb-2">Need Immediate Help?</h3>
            <p className="text-red-100 mb-4">
              If you're experiencing a mental health crisis or having thoughts of self-harm:
            </p>
            <div className="space-y-2 text-red-100">
              <p>🆘 Call 988 (Suicide & Crisis Lifeline)</p>
              <p>📱 Text HOME to 741741 (Crisis Text Line)</p>
              <p>🏥 Go to your nearest emergency room</p>
            </div>
            <Link 
              href="/crisis" 
              className="inline-block mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              View Crisis Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
