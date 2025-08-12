'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    urgent: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Message Sent!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for reaching out. We'll get back to you within 24 hours.
            </p>
            <div className="space-y-3">
              <Link 
                href="/chat"
                className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start AI Chat
              </Link>
              <Link 
                href="/"
                className="block border border-gray-300 hover:border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're here to help. Reach out to our support team for assistance, feedback, or questions about our platform.
          </p>
        </div>

        {/* Emergency Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-12">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-2">In Case of Emergency</h3>
              <p className="text-red-800 mb-3">
                If you're experiencing a mental health crisis or having thoughts of self-harm, 
                please seek immediate help:
              </p>
              <div className="space-y-1 text-red-800">
                <p>• Call 988 (Suicide & Crisis Lifeline)</p>
                <p>• Text HOME to 741741 (Crisis Text Line)</p>
                <p>• Call 911 or go to your nearest emergency room</p>
                <p>• <Link href="/crisis" className="underline font-medium">View crisis resources</Link></p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      <option value="technical">Technical Support</option>
                      <option value="account">Account Issues</option>
                      <option value="privacy">Privacy & Security</option>
                      <option value="feedback">Feedback & Suggestions</option>
                      <option value="partnership">Partnership Inquiry</option>
                      <option value="media">Media & Press</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide details about your inquiry..."
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="urgent"
                    name="urgent"
                    checked={formData.urgent}
                    onChange={handleChange}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="urgent" className="text-sm text-gray-700">
                    This is urgent and requires immediate attention
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Privacy Note:</strong> Your contact information is only used to respond to your inquiry and is not stored with your anonymous platform usage data.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Need Immediate Help?</h3>
              <div className="space-y-3">
                <Link 
                  href="/chat"
                  className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">AI Chat Support</div>
                    <div className="text-sm text-gray-600">Available 24/7</div>
                  </div>
                </Link>
                
                <Link 
                  href="/crisis"
                  className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Phone className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Crisis Support</div>
                    <div className="text-sm text-gray-600">Emergency resources</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Email Support</div>
                    <div className="text-sm text-gray-600">support@sata-platform.com</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Response Time</div>
                    <div className="text-sm text-gray-600">Within 24 hours</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Global Support</div>
                    <div className="text-sm text-gray-600">Available worldwide in 6 languages</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Support Hours</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Support</span>
                  <span className="font-medium text-green-600">24/7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Support</span>
                  <span className="font-medium">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Crisis Support</span>
                  <span className="font-medium text-red-600">Always Available</span>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Common Questions?</h3>
              <p className="text-gray-600 mb-4">
                Check our help center for instant answers to frequently asked questions.
              </p>
              <Link 
                href="/help"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Visit Help Center
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
