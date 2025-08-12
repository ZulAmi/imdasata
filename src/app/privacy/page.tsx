'use client';

import { Shield, Lock, Eye, Trash2, Globe, CheckCircle } from 'lucide-react';

export default function PrivacyPage() {
  const privacyFeatures = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Complete Anonymity",
      description: "No personal information required. Use our platform without revealing your identity.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "End-to-End Encryption",
      description: "All communications are encrypted using military-grade security protocols.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "No Data Tracking",
      description: "We don't track your browsing habits or build profiles for advertising.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: <Trash2 className="w-8 h-8" />,
      title: "Auto-Delete",
      description: "Session data is automatically deleted after each conversation.",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Compliance",
      description: "GDPR, HIPAA, and international privacy standards compliant.",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Regular Audits",
      description: "Third-party security audits ensure the highest protection standards.",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy is our top priority. Learn how we protect your anonymity and secure your data.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: August 12, 2025
          </div>
        </div>

        {/* Privacy Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-lg shadow-lg p-8 prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Privacy Commitment</h2>
          
          <p className="text-gray-700 mb-6">
            SATA (Anonymous Mental Health Platform) is committed to protecting your privacy and ensuring 
            your anonymity while providing mental health support. This privacy policy explains how we 
            collect, use, and protect information when you use our platform.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">1. Information We DON'T Collect</h3>
          <p className="text-gray-700 mb-4">
            We are designed with privacy-by-design principles. We do NOT collect:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Personal identifying information (name, address, phone number)</li>
            <li>Email addresses or account credentials</li>
            <li>IP addresses or location data</li>
            <li>Device fingerprints or tracking cookies</li>
            <li>Browsing history or behavioral profiles</li>
            <li>Payment information (our service is free)</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-4">2. Anonymous Session Data</h3>
          <p className="text-gray-700 mb-4">
            To provide our AI-powered mental health support, we temporarily process:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Conversation messages during your session</li>
            <li>Assessment responses for personalized support</li>
            <li>Mood tracking data you choose to share</li>
            <li>Anonymous usage statistics for service improvement</li>
          </ul>
          <p className="text-gray-700 mb-6">
            <strong>Important:</strong> All session data is automatically deleted within 24 hours 
            of your session ending. No persistent user profiles are created.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">3. How We Protect Your Data</h3>
          <p className="text-gray-700 mb-4">
            Your security is paramount. We implement:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li><strong>End-to-End Encryption:</strong> All communications use AES-256 encryption</li>
            <li><strong>Zero-Knowledge Architecture:</strong> Our servers cannot decrypt your conversations</li>
            <li><strong>Secure Infrastructure:</strong> SOC 2 Type II certified data centers</li>
            <li><strong>No Data Retention:</strong> Automatic deletion prevents data accumulation</li>
            <li><strong>Anonymous Processing:</strong> AI analysis without identity linkage</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-4">4. AI and Machine Learning</h3>
          <p className="text-gray-700 mb-6">
            Our AI systems are designed to provide support while protecting your privacy:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Conversation analysis happens in real-time and is not stored</li>
            <li>Machine learning models are trained on anonymized, aggregated data</li>
            <li>No individual conversations are used for training</li>
            <li>Crisis detection operates without creating permanent records</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-4">5. Crisis Intervention</h3>
          <p className="text-gray-700 mb-6">
            When our AI detects potential crisis situations, we may:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Provide immediate crisis resources and hotlines</li>
            <li>Offer to connect you with human crisis counselors</li>
            <li>Share anonymous statistical data with crisis prevention organizations</li>
          </ul>
          <p className="text-gray-700 mb-6">
            Even in crisis situations, your identity remains protected and anonymous.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">6. Third-Party Services</h3>
          <p className="text-gray-700 mb-6">
            We may integrate with privacy-focused third-party services for:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Anonymous analytics (no personal data shared)</li>
            <li>Crisis hotline connections (initiated by you)</li>
            <li>Mental health resource databases (anonymous access)</li>
          </ul>
          <p className="text-gray-700 mb-6">
            All third-party integrations maintain the same privacy standards and anonymity.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">7. International Privacy Laws</h3>
          <p className="text-gray-700 mb-6">
            We comply with international privacy regulations:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li><strong>GDPR (EU):</strong> Right to anonymity and data minimization</li>
            <li><strong>HIPAA (US):</strong> Healthcare privacy protection standards</li>
            <li><strong>PIPEDA (Canada):</strong> Personal information protection</li>
            <li><strong>Privacy Act (Australia):</strong> Australian privacy principles</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-4">8. Your Privacy Rights</h3>
          <p className="text-gray-700 mb-4">
            Because we don't collect personal data, many traditional privacy rights don't apply. However:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>You can end your session at any time</li>
            <li>Session data is automatically deleted</li>
            <li>You can request information about our privacy practices</li>
            <li>You can report privacy concerns to our team</li>
          </ul>

          <h3 className="text-xl font-bold text-gray-900 mb-4">9. Children's Privacy</h3>
          <p className="text-gray-700 mb-6">
            Our platform is designed for users 13 and older. We do not knowingly collect data from 
            children under 13. If you're under 18, please involve a trusted adult when seeking 
            mental health support.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h3>
          <p className="text-gray-700 mb-6">
            We may update this privacy policy to reflect changes in our practices or legal requirements. 
            Any changes will be posted on this page with an updated date. Continued use of our platform 
            constitutes acceptance of any changes.
          </p>

          <h3 className="text-xl font-bold text-gray-900 mb-4">11. Contact Us</h3>
          <p className="text-gray-700 mb-6">
            If you have questions about this privacy policy or our privacy practices:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-1">
            <li>Email: privacy@sata-platform.com</li>
            <li>Use our anonymous chat for privacy questions</li>
            <li>Visit our help center for more information</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h4 className="font-bold text-gray-900 mb-2">Privacy Summary</h4>
            <p className="text-gray-700 text-sm">
              SATA is designed for complete anonymity. We don't collect personal information, 
              don't track users, and automatically delete session data. Your privacy is protected 
              by design, not just by policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
