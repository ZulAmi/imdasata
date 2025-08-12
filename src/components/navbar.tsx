'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Brain, 
  Menu, 
  X, 
  MessageCircle, 
  BarChart3, 
  Shield, 
  Users, 
  BookOpen, 
  Info, 
  Phone,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: <Brain className="w-4 h-4" />,
      description: 'Main platform overview'
    },
    {
      name: 'Chat',
      href: '/chat',
      icon: <MessageCircle className="w-4 h-4" />,
      description: 'AI mental health support'
    },
    {
      name: 'Assessment',
      href: '/assessment',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Mental health screening'
    },
    {
      name: 'Mood Tracking',
      href: '/mood-tracking',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'Track your daily mood'
    },
    {
      name: 'Resources',
      href: '/resources',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Mental health resources'
    }
  ];

  const secondaryNavigation = [
    {
      name: 'About',
      href: '/about',
      icon: <Info className="w-4 h-4" />
    },
    {
      name: 'Features',
      href: '/features',
      icon: <Shield className="w-4 h-4" />
    },
    {
      name: 'Help',
      href: '/help',
      icon: <Users className="w-4 h-4" />
    },
    {
      name: 'Contact',
      href: '/contact',
      icon: <Phone className="w-4 h-4" />
    }
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
            : 'bg-white/90 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative">
                  <Brain className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  <div className="absolute -inset-1 bg-blue-200 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </div>
                <span className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  SATA
                </span>
                <span className="hidden sm:block text-sm text-gray-600 font-medium">
                  Mental Health Platform
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {isActive(item.href) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Secondary Navigation & CTA */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Crisis Button */}
              <Link
                href="/crisis"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Crisis Help</span>
              </Link>

              {/* Dropdown for secondary nav */}
              <div className="relative group">
                <button className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                  <span>More</span>
                  <svg className="w-4 h-4 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                  <div className="py-2">
                    {secondaryNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                    <div className="border-t border-gray-100 my-2"></div>
                    <Link
                      href="/privacy"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Privacy Policy</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sign Up Button */}
              <Link
                href="/signup"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-2 pb-4 space-y-2 bg-white border-t border-gray-200">
            {/* Crisis Button - Mobile */}
            <Link
              href="/crisis"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 bg-red-50 border border-red-200 font-medium"
            >
              <AlertTriangle className="w-5 h-5" />
              <div>
                <div className="text-sm font-semibold">Crisis Help</div>
                <div className="text-xs text-red-500">Get immediate support</div>
              </div>
            </Link>

            {/* Main Navigation - Mobile */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {item.icon}
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </Link>
            ))}

            {/* Secondary Navigation - Mobile */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                More Options
              </div>
              {secondaryNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </Link>
              ))}
              <Link
                href="/privacy"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Privacy Policy</span>
              </Link>
            </div>

            {/* Sign Up Button - Mobile */}
            <div className="pt-4">
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16"></div>
    </>
  );
}
