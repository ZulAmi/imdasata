/**
 * Anonymous Authentication Integration Demo
 * Shows how to integrate the authentication system with the SATA platform
 */

import React from 'react';
import { AuthWrapper, AccountManagement } from '../components/AuthComponents';
import { AuthProvider } from '../hooks/useAnonymousAuth';

const AuthDemoPage: React.FC = () => {
  return (
    <AuthProvider>
      <div className="auth-demo">
        <AuthWrapper requireAuth={true}>
          <div className="demo-content">
            <header className="demo-header">
              <h1>🔒 SATA Anonymous Authentication System</h1>
              <p>Privacy-first authentication with PDPA compliance</p>
            </header>

            <div className="demo-sections">
              <section className="feature-showcase">
                <h2>🚀 Key Features</h2>
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🔐</div>
                    <h3>Anonymous Authentication</h3>
                    <p>No personal data required. Unique anonymous identifiers generated using cryptographic methods.</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3>Device-Based Security</h3>
                    <p>Hardware fingerprinting for secure device recognition without storing personal information.</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔄</div>
                    <h3>Account Recovery</h3>
                    <p>Recover access using secure recovery tokens without compromising anonymity.</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3>PDPA Compliant</h3>
                    <p>Full compliance with data protection regulations including audit trails and data portability.</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Real-time Sessions</h3>
                    <p>Secure session management with JWT tokens and automatic renewal.</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🛡️</div>
                    <h3>Trust Scoring</h3>
                    <p>Dynamic trust assessment based on behavior patterns and device consistency.</p>
                  </div>
                </div>
              </section>

              <section className="implementation-example">
                <h2>💻 Implementation Example</h2>
                <div className="code-example">
                  <pre><code>{`
// 1. Wrap your app with AuthProvider
import { AuthProvider, AuthWrapper } from '../components/AuthComponents';

function App() {
  return (
    <AuthProvider>
      <AuthWrapper requireAuth={true}>
        <YourAppContent />
      </AuthWrapper>
    </AuthProvider>
  );
}

// 2. Use authentication in components
import { useAnonymousAuth } from '../hooks/useAnonymousAuth';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAnonymousAuth();
  
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return (
    <div>
      <p>Anonymous ID: {user.id}</p>
      <p>Trust Score: {user.trustScore}</p>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}

// 3. Handle data export and deletion (PDPA compliance)
function DataManagement() {
  const { exportData, deleteAccount } = useAnonymousAuth();
  
  const handleExport = async () => {
    const data = await exportData();
    // Download data as JSON
  };
  
  const handleDelete = async () => {
    await deleteAccount();
    // Account deleted, user redirected to login
  };
  
  return (
    <div>
      <button onClick={handleExport}>Export My Data</button>
      <button onClick={handleDelete}>Delete Account</button>
    </div>
  );
}
                  `}</code></pre>
                </div>
              </section>

              <section className="security-features">
                <h2>🔒 Security Architecture</h2>
                <div className="security-grid">
                  <div className="security-item">
                    <h4>🔑 Cryptographic Identifiers</h4>
                    <p>UUID v4 with additional entropy and SHA-256 hashing for unique anonymous IDs.</p>
                  </div>
                  
                  <div className="security-item">
                    <h4>🖥️ Device Fingerprinting</h4>
                    <p>Hardware and browser characteristics combined with canvas fingerprinting.</p>
                  </div>
                  
                  <div className="security-item">
                    <h4>🎟️ JWT Sessions</h4>
                    <p>Secure token-based authentication with configurable expiration and refresh.</p>
                  </div>
                  
                  <div className="security-item">
                    <h4>📝 Audit Logging</h4>
                    <p>Comprehensive activity logging for compliance and security monitoring.</p>
                  </div>
                </div>
              </section>

              <section className="compliance-section">
                <h2>⚖️ PDPA Compliance Features</h2>
                <div className="compliance-list">
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Data Minimization</h4>
                      <p>Only essential data collected - no personal information required</p>
                    </div>
                  </div>
                  
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Right to Access</h4>
                      <p>Users can export all their data in machine-readable format</p>
                    </div>
                  </div>
                  
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Right to Deletion</h4>
                      <p>Complete account and data deletion on user request</p>
                    </div>
                  </div>
                  
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Audit Trail</h4>
                      <p>Complete logging of all authentication and data access events</p>
                    </div>
                  </div>
                  
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Data Portability</h4>
                      <p>Structured data export for migration to other services</p>
                    </div>
                  </div>
                  
                  <div className="compliance-item">
                    <div className="compliance-icon">✅</div>
                    <div>
                      <h4>Anonymization</h4>
                      <p>No personally identifiable information stored or processed</p>
                    </div>
                  </div>
                </div>
              </section>

              <AccountManagement />
            </div>
          </div>
        </AuthWrapper>
      </div>

      <style jsx>{`
        .auth-demo {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .demo-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .demo-header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
        }

        .demo-header h1 {
          font-size: 2.5rem;
          margin: 0 0 10px 0;
          font-weight: 700;
        }

        .demo-header p {
          font-size: 1.2rem;
          opacity: 0.9;
          margin: 0;
        }

        .demo-sections {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        section h2 {
          margin: 0 0 24px 0;
          color: #333;
          font-size: 1.8rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .feature-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
        }

        .feature-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 1.2rem;
        }

        .feature-card p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .code-example {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 24px;
          overflow-x: auto;
        }

        .code-example pre {
          margin: 0;
          color: #d4d4d4;
          font-family: 'Fira Code', Consolas, 'Courier New', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .security-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .security-item {
          border-left: 4px solid #667eea;
          padding-left: 16px;
        }

        .security-item h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .security-item p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .compliance-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .compliance-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .compliance-icon {
          background: #28a745;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .compliance-item h4 {
          margin: 0 0 4px 0;
          color: #333;
          font-size: 1.1rem;
        }

        .compliance-item p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .demo-header h1 {
            font-size: 2rem;
          }
          
          .demo-header p {
            font-size: 1rem;
          }
          
          .features-grid {
            grid-template-columns: 1fr;
          }
          
          .security-grid {
            grid-template-columns: 1fr;
          }
          
          section {
            padding: 24px;
          }
        }
      `}</style>
    </AuthProvider>
  );
};

export default AuthDemoPage;
