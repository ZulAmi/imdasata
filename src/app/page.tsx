'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  MessageCircle, 
  Shield, 
  Heart, 
  Users, 
  BarChart3, 
  ArrowRight,
  CheckCircle,
  Star,
  Globe
} from 'lucide-react';

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Support",
      description: "Intelligent conversation management with crisis detection and personalized responses",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: "Anonymous Chat",
      description: "Secure, private conversations with AI and peer support without compromising privacy",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Mood Tracking",
      description: "Advanced pattern recognition and predictive analytics for mental health insights",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy First",
      description: "End-to-end encryption and anonymous authentication to protect your identity",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Peer Support",
      description: "Connect with others in a safe, moderated environment for mutual support",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Multi-Language",
      description: "Support in 6 languages with cultural adaptation for global accessibility",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  const stats = [
    { number: "10K+", label: "Users Supported" },
    { number: "24/7", label: "AI Availability" },
    { number: "99.9%", label: "Privacy Protected" },
    { number: "6", label: "Languages" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white pt-16">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-full p-4 float-animation">
                <Heart className="w-16 h-16 text-pink-300" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              Your Mental Health
              <span className="bg-gradient-to-r from-pink-300 to-yellow-300 bg-clip-text text-transparent">
                {" "}Matters
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              SATA provides AI-powered mental health support with complete privacy. 
              Get personalized assistance, track your mood, and connect with others anonymously.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/chat" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                Start Anonymous Chat
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <Link 
                href="/assessment" 
                className="border-2 border-white/30 hover:border-white/60 hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all backdrop-blur-sm"
              >
                Take Assessment
              </Link>
            </div>
            
            {/* Crisis Support Banner */}
            <div className="mt-12 bg-red-600/20 border border-red-400/30 rounded-lg p-4 backdrop-blur-sm">
              <p className="text-red-100 font-medium">
                🆘 <strong>Crisis Support:</strong> If you're having thoughts of self-harm, 
                <Link href="/crisis" className="underline hover:text-white ml-1">
                  get immediate help
                </Link> or call 988
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Mental Health Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-enhanced platform provides personalized, private, and accessible mental health resources
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 ${
                  hoveredFeature === index ? 'ring-2 ring-blue-500' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Enhancement Highlight */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Advanced AI for Mental Health
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Our platform uses cutting-edge AI to provide personalized support, 
                detect crisis situations, and offer culturally-adapted responses in multiple languages.
              </p>
              
              <div className="space-y-4">
                {[
                  "Intelligent conversation management",
                  "Predictive mental health analytics",
                  "Enhanced mood pattern recognition",
                  "Adaptive assessment system",
                  "Content personalization engine"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span className="text-blue-100">{feature}</span>
                  </div>
                ))}
              </div>
              
              <Link 
                href="/features" 
                className="inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold mt-8 transition-colors"
              >
                Learn More
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 float-animation">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500 rounded-full p-3">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2 flex-1">
                      <p className="text-sm">How are you feeling today?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-end">
                    <div className="bg-white/20 rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">I've been feeling anxious lately...</p>
                    </div>
                    <div className="bg-green-500 rounded-full p-3">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-500 rounded-full p-3">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div className="bg-white/20 rounded-lg px-4 py-2 flex-1">
                      <p className="text-sm">I understand. Let's explore some coping strategies...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Start Your Mental Health Journey Today
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join thousands who trust SATA for anonymous, AI-powered mental health support. 
            Your privacy is protected, your wellbeing is our priority.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link 
              href="/about" 
              className="border border-gray-600 hover:border-gray-400 hover:bg-gray-800 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-8 h-8 text-pink-500" />
                <span className="text-xl font-bold text-white">SATA</span>
              </div>
              <p className="text-gray-400">
                AI-powered mental health support platform with privacy at its core.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/chat" className="block hover:text-white transition-colors">Chat Support</Link>
                <Link href="/assessment" className="block hover:text-white transition-colors">Assessment</Link>
                <Link href="/mood-tracking" className="block hover:text-white transition-colors">Mood Tracking</Link>
                <Link href="/resources" className="block hover:text-white transition-colors">Resources</Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-gray-400">
                <Link href="/crisis" className="block hover:text-white transition-colors">Crisis Help</Link>
                <Link href="/help" className="block hover:text-white transition-colors">Help Center</Link>
                <Link href="/contact" className="block hover:text-white transition-colors">Contact</Link>
                <Link href="/privacy" className="block hover:text-white transition-colors">Privacy</Link>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Emergency</h3>
              <div className="space-y-2 text-gray-400">
                <p>Crisis Hotline: <span className="text-white font-semibold">988</span></p>
                <p>Text: <span className="text-white font-semibold">HOME to 741741</span></p>
                <p>Always available, completely confidential</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SATA Mental Health Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
