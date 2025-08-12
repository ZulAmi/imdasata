'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Brain, 
  MessageCircle, 
  Shield, 
  BarChart3, 
  Users, 
  Globe, 
  Clock,
  Heart,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Smartphone,
  Lock,
  Activity
} from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
  color: string;
  gradient: string;
  category: 'ai' | 'privacy' | 'support' | 'analytics';
}

const features: Feature[] = [
  {
    id: 'intelligent-conversations',
    title: 'Intelligent Conversation Management',
    description: 'Advanced AI that understands context, emotions, and provides personalized responses with crisis detection.',
    icon: <Brain className="w-8 h-8" />,
    benefits: [
      'Natural language understanding in 6 languages',
      'Real-time sentiment analysis and emotion detection',
      'Automatic crisis detection and immediate intervention',
      'Contextual memory across conversations',
      'Cultural adaptation for global users'
    ],
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-purple-600',
    category: 'ai'
  },
  {
    id: 'predictive-analytics',
    title: 'Mental Health Predictive Analytics',
    description: 'AI-powered insights that identify patterns and predict potential mental health challenges before they escalate.',
    icon: <BarChart3 className="w-8 h-8" />,
    benefits: [
      'Early warning system for mental health risks',
      'Behavioral pattern recognition and analysis',
      'Personalized intervention recommendations',
      'Trend analysis and mood forecasting',
      'Evidence-based risk assessment'
    ],
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-pink-600',
    category: 'analytics'
  },
  {
    id: 'anonymous-privacy',
    title: 'Complete Privacy & Anonymity',
    description: 'Military-grade encryption with zero personal data collection. Your identity remains completely protected.',
    icon: <Shield className="w-8 h-8" />,
    benefits: [
      'End-to-end encryption for all communications',
      'No personal information required to use',
      'Anonymous authentication system',
      'Data automatically deleted after sessions',
      'HIPAA and GDPR compliant infrastructure'
    ],
    color: 'text-green-600',
    gradient: 'from-green-500 to-teal-600',
    category: 'privacy'
  },
  {
    id: 'mood-tracking',
    title: 'Enhanced Mood Pattern Recognition',
    description: 'Sophisticated mood tracking with AI insights to help you understand your mental health patterns.',
    icon: <Activity className="w-8 h-8" />,
    benefits: [
      'Daily mood logging with multiple dimensions',
      'Pattern recognition across time periods',
      'Trigger identification and analysis',
      'Personalized coping strategy recommendations',
      'Visual insights and progress tracking'
    ],
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-600',
    category: 'analytics'
  },
  {
    id: 'adaptive-assessments',
    title: 'Adaptive Assessment System',
    description: 'Dynamic mental health assessments that adapt to your responses for more accurate and personalized evaluation.',
    icon: <Zap className="w-8 h-8" />,
    benefits: [
      'Personalized questions based on your responses',
      'Reduced assessment fatigue with smart routing',
      'Cultural and linguistic adaptation',
      'Real-time scoring and interpretation',
      'Integration with treatment recommendations'
    ],
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-blue-600',
    category: 'ai'
  },
  {
    id: 'peer-support',
    title: 'Anonymous Peer Support Community',
    description: 'Connect with others who understand your journey in a safe, moderated environment.',
    icon: <Users className="w-8 h-8" />,
    benefits: [
      'Moderated group conversations by topic',
      'Anonymous peer matching based on experiences',
      'Safe sharing with community guidelines',
      'Professional oversight and intervention',
      'Support group scheduling and notifications'
    ],
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-600',
    category: 'support'
  },
  {
    id: 'global-access',
    title: 'Multi-Language Global Access',
    description: '24/7 support in 6 languages with cultural sensitivity and regional mental health resource integration.',
    icon: <Globe className="w-8 h-8" />,
    benefits: [
      'Support in English, Spanish, French, Chinese, Arabic, Hindi',
      'Cultural adaptation of therapeutic approaches',
      'Local mental health resource integration',
      'Time zone aware support scheduling',
      'Regional crisis hotline integration'
    ],
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-blue-600',
    category: 'support'
  },
  {
    id: 'content-personalization',
    title: 'Personalized Content Engine',
    description: 'AI-curated mental health resources, exercises, and content tailored specifically to your needs and preferences.',
    icon: <Heart className="w-8 h-8" />,
    benefits: [
      'Personalized resource recommendations',
      'Adaptive content difficulty and pacing',
      'Learning style accommodation',
      'Progress-based content unlocking',
      'Integration with mood and assessment data'
    ],
    color: 'text-red-600',
    gradient: 'from-red-500 to-pink-600',
    category: 'ai'
  }
];

const categories = [
  { id: 'all', name: 'All Features', icon: <Brain className="w-5 h-5" /> },
  { id: 'ai', name: 'AI Technology', icon: <Brain className="w-5 h-5" /> },
  { id: 'privacy', name: 'Privacy & Security', icon: <Shield className="w-5 h-5" /> },
  { id: 'support', name: 'Support & Community', icon: <Users className="w-5 h-5" /> },
  { id: 'analytics', name: 'Analytics & Insights', icon: <BarChart3 className="w-5 h-5" /> }
];

const stats = [
  { number: '99.9%', label: 'Uptime Guarantee' },
  { number: '24/7', label: 'AI Availability' },
  { number: '6', label: 'Languages Supported' },
  { number: '<1s', label: 'Response Time' }
];

export default function FeaturesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(feature => feature.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Platform Features</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
              Discover how our AI-powered platform revolutionizes mental health support with 
              cutting-edge technology, complete privacy, and personalized care.
            </p>
            
            {/* Quick Demo Button */}
            <div className="flex justify-center">
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2">
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Stats Section */}
        <section className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Category Filter */}
        <section className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-8">
            {filteredFeatures.map((feature) => (
              <div 
                key={feature.id} 
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
              >
                <div className={`h-2 bg-gradient-to-r ${feature.gradient}`}></div>
                
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`${feature.color} bg-gray-50 p-3 rounded-lg`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>

                  {selectedFeature === feature.id && (
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Key Benefits:</h4>
                      <div className="space-y-3">
                        {feature.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 text-center">
                    <span className="text-sm text-gray-500">
                      {selectedFeature === feature.id ? 'Click to collapse' : 'Click to expand details'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Powered by Advanced Technology</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our platform leverages cutting-edge AI, security, and cloud technologies 
                to deliver reliable, secure, and intelligent mental health support.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Natural Language AI</h3>
                <p className="text-sm text-gray-300">Advanced NLP and machine learning models</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Military-Grade Security</h3>
                <p className="text-sm text-gray-300">End-to-end encryption and zero-trust architecture</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Global Infrastructure</h3>
                <p className="text-sm text-gray-300">Worldwide CDN and edge computing</p>
              </div>
              
              <div className="text-center">
                <div className="bg-orange-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="font-semibold mb-2">Cross-Platform</h3>
                <p className="text-sm text-gray-300">Web, mobile, and API accessibility</p>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Showcase */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Seamless Integration</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI components work together to provide a comprehensive mental health support ecosystem.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 p-6 rounded-lg mb-4">
                  <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Conversation AI</h3>
                </div>
                <p className="text-sm text-gray-600">Detects crisis situations and triggers immediate interventions</p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 p-6 rounded-lg mb-4">
                  <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Analytics Engine</h3>
                </div>
                <p className="text-sm text-gray-600">Provides insights to conversation AI for personalized responses</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 p-6 rounded-lg mb-4">
                  <Heart className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">Content Engine</h3>
                </div>
                <p className="text-sm text-gray-600">Delivers personalized resources based on mood and assessment data</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Real-time coordination across all AI components</span>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 lg:p-12">
            <h2 className="text-3xl font-bold mb-4">Experience the Future of Mental Health Support</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Ready to see how our AI-powered platform can support your mental health journey? 
              Start with a free, anonymous conversation today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/chat"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Try AI Chat Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/assessment"
                className="border-2 border-white/30 hover:border-white/60 hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-all"
              >
                Take Assessment
              </Link>
            </div>
            
            <div className="mt-6 text-sm text-blue-100">
              No signup required • Completely anonymous • Available 24/7
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
