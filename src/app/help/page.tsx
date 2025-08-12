'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, HelpCircle, MessageCircle, Book, Phone, Mail, ChevronDown, ChevronRight } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How does the anonymous chat work?',
    answer: 'Our chat system uses advanced encryption and requires no personal information. You can start conversations immediately without creating an account. Each session is completely private and data is automatically deleted after completion.',
    category: 'privacy'
  },
  {
    id: '2',
    question: 'Is the AI really available 24/7?',
    answer: 'Yes, our AI support is available around the clock, every day of the year. The system can handle multiple conversations simultaneously and provides immediate responses. For complex situations, human professionals are also available during business hours.',
    category: 'support'
  },
  {
    id: '3',
    question: 'What happens if the AI detects a crisis?',
    answer: 'Our AI is trained to recognize crisis situations and will immediately provide crisis resources, including emergency hotlines. The system can connect you with human crisis counselors and provide local emergency services information if needed.',
    category: 'crisis'
  },
  {
    id: '4',
    question: 'How accurate are the mental health assessments?',
    answer: 'Our assessments are based on clinically validated tools like PHQ-4 and are continuously updated with the latest research. While they provide valuable insights, they are not a substitute for professional diagnosis.',
    category: 'assessments'
  },
  {
    id: '5',
    question: 'Can I access the platform from different devices?',
    answer: 'Yes, you can access SATA from any web browser on computers, tablets, or smartphones. Your anonymous sessions can be continued across devices using temporary session tokens.',
    category: 'technical'
  },
  {
    id: '6',
    question: 'What languages are supported?',
    answer: 'We currently support English, Spanish, French, Chinese (Mandarin), Arabic, and Hindi. The AI adapts its responses based on cultural context and local mental health practices.',
    category: 'support'
  }
];

const categories = [
  { id: 'all', name: 'All Topics' },
  { id: 'privacy', name: 'Privacy & Security' },
  { id: 'support', name: 'Support & Features' },
  { id: 'crisis', name: 'Crisis Support' },
  { id: 'assessments', name: 'Assessments' },
  { id: 'technical', name: 'Technical' }
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to common questions and get the support you need to make the most of our platform.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/chat" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center">
            <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Start Chat Support</h3>
            <p className="text-gray-600">Get immediate help from our AI assistant</p>
          </Link>

          <Link href="/crisis" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Crisis Support</h3>
            <p className="text-gray-600">Access immediate crisis intervention resources</p>
          </Link>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Contact Us</h3>
            <p className="text-gray-600">Reach out to our support team</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search or browse all topics.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    {expandedFAQ === faq.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-6 pb-4 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Topics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Getting Started</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">How to start your first chat</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Taking your first assessment</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Understanding privacy features</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Setting language preferences</Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Privacy & Security</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">How we protect your data</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Anonymous authentication</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Data retention policies</Link></li>
              <li><Link href="#" className="hover:text-blue-600">GDPR compliance</Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">AI Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">How the AI works</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Crisis detection system</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Mood tracking insights</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Personalized recommendations</Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Assessments</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">Understanding PHQ-4 results</Link></li>
              <li><Link href="#" className="hover:text-blue-600">When to retake assessments</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Sharing results with professionals</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Assessment accuracy</Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Crisis Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">When to seek immediate help</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Crisis hotline numbers</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Safety planning</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Supporting someone in crisis</Link></li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">Technical Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="#" className="hover:text-blue-600">Browser compatibility</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Connection issues</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Mobile app features</Link></li>
              <li><Link href="#" className="hover:text-blue-600">Accessibility options</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            If you can't find the answer you're looking for, our support team is here to help.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Chat with AI Support
            </Link>
            <Link 
              href="/contact"
              className="border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Human Support
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Emergency? Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741</p>
          </div>
        </div>
      </div>
    </div>
  );
}
