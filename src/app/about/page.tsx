'use client';

import Link from 'next/link';
import { Heart, Shield, Brain, Users, Globe, Award, ArrowRight, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Zulhilmi Rahmat",
      role: "Clinical Psychologist & AI Ethics Lead",
      image: "/images/team/zulhilmi.jpg",
      bio: "15+ years in mental health research and AI applications in healthcare."
    },
    {
      name: "Zulhilmi Rahmat",
      role: "Lead AI Engineer",
      image: "/images/team/zulhilmi.jpg", 
      bio: "Specialized in natural language processing and conversational AI systems."
    },
    {
      name: "Zulhilmi Rahmatn",
      role: "Psychiatrist & Medical Advisor",
      image: "/images/team/zulhilmi.jpg",
      bio: "Board-certified psychiatrist with expertise in digital mental health interventions."
    },
    {
      name: "Zulhilmi Rahmat",
      role: "Privacy & Security Officer",
      image: "/images/team/zulhilmi.jpg",
      bio: "Cybersecurity expert ensuring the highest standards of user privacy protection."
    }
  ];

  const milestones = [
    {
      year: "2025",
      title: "Foundation",
      description: "We were founded with a mission to make mental health support accessible and anonymous."
    },
    {
      year: "2025",
      title: "AI Integration", 
      description: "Launched advanced AI-powered conversation management with crisis detection capabilities."
    },
    {
      year: "2026",
      title: "Global Expansion",
      description: "Expanded to 6 languages with cultural adaptation and 24/7 multilingual support."
    },
    {
      year: "2027",
      title: "Innovation",
      description: "Introduced predictive analytics and personalized mental health interventions."
    }
  ];

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy First",
      description: "Complete anonymity with end-to-end encryption. Your identity is never compromised.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Compassionate Care",
      description: "Every interaction is designed with empathy, understanding, and genuine concern for your wellbeing.",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Evidence-Based",
      description: "Our AI is trained on clinically validated approaches and continuously updated with latest research.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Inclusive Community",
      description: "Safe space for everyone, regardless of background, identity, or mental health challenges.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Accessibility",
      description: "Mental health support in multiple languages with cultural sensitivity and 24/7 availability.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "Committed to the highest standards of AI safety, clinical accuracy, and user experience.",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  const features = [
    "AI-powered conversation management with crisis detection",
    "Anonymous authentication and end-to-end encryption",
    "Predictive mental health analytics and early intervention",
    "Multi-language support with cultural adaptation",
    "24/7 availability with human oversight",
    "Evidence-based therapeutic approaches",
    "Peer support community integration",
    "Comprehensive mood tracking and insights"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About SATA</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              We're revolutionizing mental health support through AI-powered, anonymous, 
              and accessible care that respects your privacy while providing professional-grade assistance.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Statement */}
        <section className="mb-20">
          <div className="bg-white rounded-lg shadow-lg p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                To provide accessible, anonymous, and AI-enhanced mental health support that empowers 
                individuals to take control of their wellbeing without fear of stigma or privacy concerns.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Anonymous & Safe</h3>
                <p className="text-gray-600">Complete privacy protection with no personal information required</p>
              </div>
              
              <div>
                <div className="bg-purple-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">AI-Enhanced Care</h3>
                <p className="text-gray-600">Advanced AI providing personalized support and crisis detection</p>
              </div>
              
              <div>
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Globally Accessible</h3>
                <p className="text-gray-600">Available 24/7 in multiple languages with cultural sensitivity</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything we do is guided by these core principles that put your wellbeing and privacy first.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className={`${value.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                  {value.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What We Offer */}
        <section className="mb-20">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive mental health support powered by cutting-edge AI technology and clinical expertise.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {features.slice(4).map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Journey */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From concept to global platform - how we've evolved to serve millions seeking mental health support.
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <div className="text-blue-600 font-bold text-lg mb-2">{milestone.year}</div>
                      <h3 className="font-bold text-xl text-gray-900 mb-3">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="relative z-10 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                  
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Expert Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mental health professionals, AI researchers, and technology experts working together 
              to create the future of mental healthcare.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-600">{member.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-20">
          <div className="bg-gray-900 text-white rounded-lg p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Making a Difference</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Real impact in the lives of people seeking mental health support worldwide.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
                <div className="text-gray-300">Users Supported</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
                <div className="text-gray-300">Availability</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">6</div>
                <div className="text-gray-300">Languages</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-orange-400 mb-2">99.9%</div>
                <div className="text-gray-300">Privacy Protected</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8 lg:p-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands who have found support, understanding, and hope through our platform. 
              Your mental health matters, and we're here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/chat"
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Start Anonymous Chat
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/assessment"
                className="border-2 border-white/30 hover:border-white/60 hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-all"
              >
                Take Assessment
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
