'use client';

import Link from 'next/link';
import { Phone, MessageCircle, MapPin, Clock, AlertTriangle, Heart, ArrowRight } from 'lucide-react';

export default function CrisisPage() {
  const crisisResources = [
    {
      name: "National Suicide Prevention Lifeline",
      phone: "988",
      description: "24/7 crisis support in English and Spanish",
      features: ["Free & Confidential", "24/7 Available", "Trained Counselors"]
    },
    {
      name: "Crisis Text Line",
      phone: "Text HOME to 741741",
      description: "Free, 24/7 support via text message",
      features: ["Text-Based Support", "Anonymous", "Quick Response"]
    },
    {
      name: "National Domestic Violence Hotline",
      phone: "1-800-799-7233",
      description: "Support for domestic violence situations",
      features: ["Safety Planning", "Legal Resources", "Shelter Information"]
    },
    {
      name: "SAMHSA National Helpline",
      phone: "1-800-662-4357",
      description: "Treatment referral and information service",
      features: ["Treatment Locator", "Insurance Guidance", "Multiple Languages"]
    }
  ];

  const emergencySteps = [
    {
      step: 1,
      title: "Immediate Danger",
      content: "If you or someone else is in immediate physical danger, call 911 or go to the nearest emergency room.",
      icon: <AlertTriangle className="w-6 h-6 text-red-600" />
    },
    {
      step: 2,
      title: "Crisis Support",
      content: "For mental health crisis support, call 988 - the Suicide & Crisis Lifeline is available 24/7.",
      icon: <Phone className="w-6 h-6 text-blue-600" />
    },
    {
      step: 3,
      title: "Text Support",
      content: "If you prefer texting, send HOME to 741741 for the Crisis Text Line support.",
      icon: <MessageCircle className="w-6 h-6 text-green-600" />
    },
    {
      step: 4,
      title: "Find Local Help",
      content: "Use our resources to find local mental health services and support groups in your area.",
      icon: <MapPin className="w-6 h-6 text-purple-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Emergency Banner */}
      <div className="bg-red-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <p className="font-semibold text-center">
              If you're in immediate danger, call 911 or go to your nearest emergency room
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <Heart className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Crisis Support & Resources</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You are not alone. Help is available 24/7. These resources provide immediate support for mental health crises.
          </p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
            <Phone className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Call Now</h2>
            <div className="text-4xl font-bold text-red-600 mb-4">988</div>
            <p className="text-red-800 mb-4">Suicide & Crisis Lifeline</p>
            <a 
              href="tel:988"
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Call 988
            </a>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Text Support</h2>
            <div className="text-2xl font-bold text-blue-600 mb-4">HOME to 741741</div>
            <p className="text-blue-800 mb-4">Crisis Text Line</p>
            <a 
              href="sms:741741?body=HOME"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Send Text
            </a>
          </div>
        </div>

        {/* Emergency Steps */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">What to Do in a Crisis</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {emergencySteps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Crisis Resources */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">24/7 Crisis Support Resources</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {crisisResources.map((resource, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{resource.name}</h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">{resource.phone}</div>
                <p className="text-gray-600 mb-4">{resource.description}</p>
                <div className="flex flex-wrap gap-2">
                  {resource.features.map((feature, i) => (
                    <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning Signs */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Warning Signs to Watch For</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Immediate Risk Signs:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Talking about wanting to die or kill oneself</li>
                <li>• Looking for ways to kill oneself</li>
                <li>• Talking about feeling hopeless or having no purpose</li>
                <li>• Talking about feeling trapped or in unbearable pain</li>
                <li>• Talking about being a burden to others</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Other Warning Signs:</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Increased use of alcohol or drugs</li>
                <li>• Acting anxious or agitated</li>
                <li>• Withdrawing from family and friends</li>
                <li>• Sleeping too little or too much</li>
                <li>• Dramatic mood changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Safety Planning */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create a Safety Plan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Recognize Triggers</h3>
              <p className="text-sm text-gray-600">Identify situations, thoughts, or feelings that might lead to crisis.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Coping Strategies</h3>
              <p className="text-sm text-gray-600">List healthy activities that help you feel better when distressed.</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Support Contacts</h3>
              <p className="text-sm text-gray-600">Keep a list of trusted people and crisis numbers easily accessible.</p>
            </div>
          </div>
        </div>

        {/* Additional Support */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Support</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/chat"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Anonymous Chat Support
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/resources"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Mental Health Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
