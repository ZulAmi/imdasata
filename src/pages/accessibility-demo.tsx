/**
 * SATA Accessibility Demo Page
 * Comprehensive demonstration of accessibility features
 */

import React, { useEffect } from 'react';
import { AccessibilityProvider } from '../hooks/useAccessibility';
import {
  AccessibilityControlPanel,
  IconBasedNavigation,
  VoiceCommandHelp,
  ReadableText,
  FontSizeControl,
  SimpleMentalHealthCard,
  EmergencyQuickAccess
} from '../components/AccessibilityComponents';

const AccessibilityDemo: React.FC = () => {
  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-accessibility.js')
        .then((registration) => {
          console.log('Accessibility Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Listen for online/offline events
    const handleOnline = () => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'SYNC_OFFLINE_DATA' });
      });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const mentalHealthActivities = [
    {
      title: 'Track Your Mood',
      description: 'Record how you feel today',
      action: 'Start Tracking',
      icon: '😊',
      onClick: () => window.location.href = '/mood',
      difficulty: 'easy' as const
    },
    {
      title: 'Breathing Exercise',
      description: 'Calm your mind with guided breathing',
      action: 'Start Exercise',
      icon: '🫁',
      onClick: () => window.location.href = '/breathing',
      difficulty: 'easy' as const
    },
    {
      title: 'Voice Analysis',
      description: 'Analyze your emotional state through voice',
      action: 'Record Voice',
      icon: '🎤',
      onClick: () => window.location.href = '/voice',
      difficulty: 'medium' as const
    },
    {
      title: 'Therapy Chat',
      description: 'Talk with our AI counselor',
      action: 'Start Chat',
      icon: '💬',
      onClick: () => window.location.href = '/chat',
      difficulty: 'medium' as const
    },
    {
      title: 'Mindfulness',
      description: 'Practice mindfulness meditation',
      action: 'Begin Practice',
      icon: '🧘',
      onClick: () => window.location.href = '/mindfulness',
      difficulty: 'hard' as const
    },
    {
      title: 'Journal',
      description: 'Write about your thoughts and feelings',
      action: 'Start Writing',
      icon: '📝',
      onClick: () => window.location.href = '/journal',
      difficulty: 'medium' as const
    }
  ];

  return (
    <AccessibilityProvider>
      <div className="accessibility-demo">
        {/* Accessibility Controls - Always visible */}
        <AccessibilityControlPanel />

        {/* Skip Navigation Links */}
        <nav className="skip-links">
          <a href="#main-content">Skip to main content</a>
          <a href="#emergency-help">Skip to emergency help</a>
          <a href="#voice-commands">Skip to voice commands</a>
        </nav>

        {/* Emergency Quick Access */}
        <div id="emergency-help">
          <EmergencyQuickAccess />
        </div>

        {/* Icon-based Navigation */}
        <IconBasedNavigation />

        {/* Main Content */}
        <main id="main-content" className="main-content">
          <header className="page-header">
            <ReadableText className="page-title">
              <h1>SATA Mental Health Platform</h1>
            </ReadableText>
            <ReadableText className="page-subtitle">
              <p>Supporting your mental wellness journey with accessible tools and resources.</p>
            </ReadableText>
          </header>

          {/* Font Size Control */}
          <section className="controls-section">
            <FontSizeControl />
          </section>

          {/* Voice Commands Help */}
          <section id="voice-commands" className="voice-section">
            <VoiceCommandHelp />
          </section>

          {/* Mental Health Activities Grid */}
          <section className="activities-section">
            <ReadableText>
              <h2>Mental Health Activities</h2>
              <p>Choose an activity that feels right for you today. All activities are designed to be accessible and easy to use.</p>
            </ReadableText>
            
            <div className="activities-grid">
              {mentalHealthActivities.map((activity, index) => (
                <SimpleMentalHealthCard
                  key={index}
                  title={activity.title}
                  description={activity.description}
                  action={activity.action}
                  icon={activity.icon}
                  onClick={activity.onClick}
                  difficulty={activity.difficulty}
                />
              ))}
            </div>
          </section>

          {/* Accessibility Information */}
          <section className="accessibility-info">
            <ReadableText>
              <h2>Accessibility Features</h2>
              <div className="feature-list">
                <div className="feature-item">
                  <h3>🎤 Voice Navigation</h3>
                  <p>Control the app with your voice. Say "help" to hear available commands.</p>
                </div>
                
                <div className="feature-item">
                  <h3>🔊 Text-to-Speech</h3>
                  <p>Click on any text to have it read aloud. Adjust reading speed in settings.</p>
                </div>
                
                <div className="feature-item">
                  <h3>🎨 High Contrast Mode</h3>
                  <p>Enhanced visual contrast for better readability.</p>
                </div>
                
                <div className="feature-item">
                  <h3>📱 Touch Friendly</h3>
                  <p>Larger buttons and touch targets for easier interaction.</p>
                </div>
                
                <div className="feature-item">
                  <h3>💬 Simple Language</h3>
                  <p>Clear, simple language options for better understanding.</p>
                </div>
                
                <div className="feature-item">
                  <h3>📶 Offline Mode</h3>
                  <p>Basic features work even without internet connection.</p>
                </div>
              </div>
            </ReadableText>
          </section>

          {/* Quick Help Section */}
          <section className="quick-help">
            <ReadableText>
              <h2>Need Help?</h2>
              <div className="help-options">
                <div className="help-item">
                  <strong>Keyboard Users:</strong>
                  <ul>
                    <li>Press <kbd>Alt + H</kbd> for help</li>
                    <li>Press <kbd>Alt + R</kbd> to read current page</li>
                    <li>Press <kbd>Alt + V</kbd> to toggle voice navigation</li>
                    <li>Press <kbd>Alt + S</kbd> to stop speech</li>
                  </ul>
                </div>
                
                <div className="help-item">
                  <strong>Voice Users:</strong>
                  <ul>
                    <li>Say "help" to hear all commands</li>
                    <li>Say "go home" to return to main page</li>
                    <li>Say "track mood" to start mood tracking</li>
                    <li>Say "stop reading" to stop text-to-speech</li>
                  </ul>
                </div>
                
                <div className="help-item">
                  <strong>Mobile Users:</strong>
                  <ul>
                    <li>Enable touch-friendly mode for larger buttons</li>
                    <li>Use voice commands for hands-free navigation</li>
                    <li>Access offline features when connectivity is poor</li>
                  </ul>
                </div>
              </div>
            </ReadableText>
          </section>
        </main>

        {/* Footer with accessibility statement */}
        <footer className="page-footer">
          <ReadableText>
            <p>SATA is committed to digital accessibility for all users. If you encounter any accessibility barriers, please contact our support team.</p>
            <p>This platform supports multiple languages, voice navigation, screen readers, and offline functionality.</p>
          </ReadableText>
        </footer>
      </div>

      <style jsx>{`
        .accessibility-demo {
          min-height: 100vh;
          font-family: Arial, sans-serif;
        }

        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          padding-top: 100px; /* Space for accessibility controls */
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-title h1 {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 10px;
        }

        .page-subtitle p {
          font-size: 1.2rem;
          color: #666;
          max-width: 600px;
          margin: 0 auto;
        }

        .controls-section,
        .voice-section {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .activities-section {
          margin: 40px 0;
        }

        .activities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .accessibility-info {
          margin: 40px 0;
          padding: 30px;
          background: #e8f4fd;
          border-radius: 12px;
        }

        .feature-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .feature-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #ddd;
        }

        .feature-item h3 {
          margin: 0 0 10px 0;
          color: #0066cc;
        }

        .quick-help {
          margin: 40px 0;
          padding: 30px;
          background: #fff3cd;
          border-radius: 12px;
        }

        .help-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .help-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #ffc107;
        }

        .help-item ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
        }

        .help-item li {
          margin: 5px 0;
        }

        kbd {
          background: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 0.9em;
          font-family: monospace;
        }

        .page-footer {
          background: #333;
          color: white;
          padding: 30px;
          text-align: center;
          margin-top: 60px;
        }

        .page-footer p {
          margin: 10px 0;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .main-content {
            padding: 15px;
            padding-top: 120px;
          }

          .page-title h1 {
            font-size: 2rem;
          }

          .activities-grid {
            grid-template-columns: 1fr;
          }

          .feature-list,
          .help-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AccessibilityProvider>
  );
};

export default AccessibilityDemo;
