/**
 * SATA Privacy Dashboard
 * Comprehensive privacy controls and compliance management interface
 */

import React, { useState } from 'react';
import { PrivacyProvider } from '../hooks/usePrivacyControls';
import { 
  ConsentManager, 
  PrivacySettingsManager, 
  DataManagement, 
  ComplianceDashboard 
} from '../components/PrivacyComponents';

const PrivacyDashboard: React.FC = () => {
  const [currentUser] = useState({
    id: 'privacy-demo-user',
    role: 'user' // Change to 'admin' or 'staff' to see compliance features
  });

  const [activeTab, setActiveTab] = useState<'consent' | 'settings' | 'data' | 'compliance'>('consent');

  const tabs = [
    { id: 'consent', label: '🛡️ Consent', description: 'Manage data usage permissions' },
    { id: 'settings', label: '⚙️ Settings', description: 'Configure privacy preferences' },
    { id: 'data', label: '📊 Data', description: 'Export or delete your data' },
    ...(currentUser.role === 'admin' || currentUser.role === 'staff' ? 
      [{ id: 'compliance' as const, label: '📋 Compliance', description: 'Monitor privacy compliance' }] : 
      []
    )
  ];

  return (
    <PrivacyProvider userId={currentUser.id}>
      <div className="privacy-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>🔒 Privacy & Data Protection</h1>
            <p>
              Your privacy is our priority. Control how your mental health data is collected, 
              used, and shared while ensuring compliance with data protection regulations.
            </p>
          </div>
          
          <div className="privacy-highlights">
            <div className="highlight-item">
              <div className="highlight-icon">🔐</div>
              <div>
                <h3>End-to-End Encryption</h3>
                <p>All sensitive data encrypted with industry-standard protocols</p>
              </div>
            </div>
            
            <div className="highlight-item">
              <div className="highlight-icon">🎭</div>
              <div>
                <h3>Data Anonymization</h3>
                <p>Analytics performed on anonymized data to protect your identity</p>
              </div>
            </div>
            
            <div className="highlight-item">
              <div className="highlight-icon">⚖️</div>
              <div>
                <h3>PDPA Compliant</h3>
                <p>Full compliance with Personal Data Protection Act requirements</p>
              </div>
            </div>
            
            <div className="highlight-item">
              <div className="highlight-icon">🗑️</div>
              <div>
                <h3>Right to be Forgotten</h3>
                <p>Complete data deletion available on request</p>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-content">
          {activeTab === 'consent' && (
            <div className="content-section">
              <ConsentManager />
              
              <div className="privacy-notice">
                <h3>🛡️ Your Privacy Rights</h3>
                <div className="rights-grid">
                  <div className="right-item">
                    <h4>Right to Information</h4>
                    <p>You have the right to know what personal data we collect and how it's used.</p>
                  </div>
                  <div className="right-item">
                    <h4>Right to Access</h4>
                    <p>You can request access to all your personal data at any time.</p>
                  </div>
                  <div className="right-item">
                    <h4>Right to Correction</h4>
                    <p>You can update or correct any inaccurate personal data.</p>
                  </div>
                  <div className="right-item">
                    <h4>Right to Deletion</h4>
                    <p>You can request complete deletion of all your personal data.</p>
                  </div>
                  <div className="right-item">
                    <h4>Right to Portability</h4>
                    <p>You can export your data in a structured, machine-readable format.</p>
                  </div>
                  <div className="right-item">
                    <h4>Right to Object</h4>
                    <p>You can withdraw consent or object to data processing at any time.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="content-section">
              <PrivacySettingsManager />
              
              <div className="security-features">
                <h3>🔒 Security Features</h3>
                <div className="features-grid">
                  <div className="feature-item">
                    <div className="feature-icon">🔐</div>
                    <h4>Multi-Level Encryption</h4>
                    <p>
                      Critical data uses double AES-256 encryption, while less sensitive 
                      data uses appropriate encryption levels to balance security and performance.
                    </p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">🎯</div>
                    <h4>Data Minimization</h4>
                    <p>
                      We only collect the minimum data necessary for your mental health 
                      support and can further reduce collection based on your preferences.
                    </p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">📱</div>
                    <h4>Device-Based Authentication</h4>
                    <p>
                      Your device characteristics are used for secure authentication 
                      without storing personal identifying information.
                    </p>
                  </div>
                  
                  <div className="feature-item">
                    <div className="feature-icon">🔄</div>
                    <h4>Automatic Data Cleanup</h4>
                    <p>
                      Data is automatically deleted based on your retention preferences, 
                      ensuring old data doesn't accumulate unnecessarily.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="content-section">
              <DataManagement />
              
              <div className="data-insights">
                <h3>📊 Understanding Your Data</h3>
                <div className="data-categories">
                  <div className="category-item">
                    <h4>🧠 Mental Health Data</h4>
                    <ul>
                      <li>Mood entries and emotional states</li>
                      <li>Assessment scores (PHQ-4, GAD-7)</li>
                      <li>Voice recordings and transcripts</li>
                      <li>Insights and patterns</li>
                    </ul>
                    <span className="encryption-level critical">Critical Encryption</span>
                  </div>
                  
                  <div className="category-item">
                    <h4>⚙️ Usage Data</h4>
                    <ul>
                      <li>App interaction patterns</li>
                      <li>Feature usage statistics</li>
                      <li>Session duration and frequency</li>
                      <li>Device and browser information</li>
                    </ul>
                    <span className="encryption-level medium">Medium Encryption</span>
                  </div>
                  
                  <div className="category-item">
                    <h4>🔒 Account Data</h4>
                    <ul>
                      <li>Anonymous user identifier</li>
                      <li>Privacy preferences</li>
                      <li>Consent history</li>
                      <li>Access logs</li>
                    </ul>
                    <span className="encryption-level high">High Encryption</span>
                  </div>
                  
                  <div className="category-item">
                    <h4>📈 Analytics Data</h4>
                    <ul>
                      <li>Anonymized usage patterns</li>
                      <li>Aggregated trends</li>
                      <li>Performance metrics</li>
                      <li>Error reports</li>
                    </ul>
                    <span className="encryption-level low">Anonymized</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (currentUser.role === 'admin' || currentUser.role === 'staff') && (
            <div className="content-section">
              <ComplianceDashboard />
              
              <div className="compliance-info">
                <h3>⚖️ Regulatory Compliance</h3>
                <div className="compliance-frameworks">
                  <div className="framework-item">
                    <h4>🇸🇬 PDPA (Singapore)</h4>
                    <p>
                      Full compliance with Singapore's Personal Data Protection Act, 
                      including consent management, data protection obligations, and 
                      individual rights.
                    </p>
                    <div className="compliance-status compliant">✅ Compliant</div>
                  </div>
                  
                  <div className="framework-item">
                    <h4>🇪🇺 GDPR (EU)</h4>
                    <p>
                      Adherence to General Data Protection Regulation principles 
                      including lawful basis, data minimization, and individual rights.
                    </p>
                    <div className="compliance-status compliant">✅ Compliant</div>
                  </div>
                  
                  <div className="framework-item">
                    <h4>🏥 HIPAA (Healthcare)</h4>
                    <p>
                      Healthcare-grade security and privacy controls for mental 
                      health data protection and secure provider sharing.
                    </p>
                    <div className="compliance-status compliant">✅ Compliant</div>
                  </div>
                  
                  <div className="framework-item">
                    <h4>🔒 ISO 27001</h4>
                    <p>
                      Information security management systems aligned with 
                      international standards for data protection.
                    </p>
                    <div className="compliance-status in-progress">🔄 In Progress</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-footer">
          <div className="footer-content">
            <h3>Need Help with Privacy?</h3>
            <p>
              If you have questions about your privacy rights, data usage, or need 
              assistance with any privacy-related requests, please contact our privacy team.
            </p>
            <div className="contact-options">
              <button className="contact-button">
                📧 Email Privacy Team
              </button>
              <button className="contact-button">
                📞 Call Privacy Hotline
              </button>
              <button className="contact-button">
                💬 Live Chat Support
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .privacy-dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }

          .dashboard-header {
            background: white;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }

          .header-content h1 {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 2.2rem;
            font-weight: 700;
          }

          .header-content p {
            margin: 0 0 32px 0;
            color: #666;
            font-size: 1.1rem;
            line-height: 1.6;
            max-width: 800px;
          }

          .privacy-highlights {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
          }

          .highlight-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
          }

          .highlight-icon {
            font-size: 2rem;
            flex-shrink: 0;
          }

          .highlight-item h3 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 1.1rem;
          }

          .highlight-item p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .dashboard-navigation {
            display: flex;
            gap: 8px;
            margin-bottom: 24px;
            overflow-x: auto;
          }

          .nav-tab {
            background: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: left;
            min-width: 200px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .nav-tab:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .nav-tab.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .tab-label {
            display: block;
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 4px;
          }

          .tab-description {
            display: block;
            font-size: 0.85rem;
            opacity: 0.8;
          }

          .dashboard-content {
            margin-bottom: 24px;
          }

          .content-section {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .privacy-notice,
          .security-features,
          .data-insights,
          .compliance-info {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .privacy-notice h3,
          .security-features h3,
          .data-insights h3,
          .compliance-info h3 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 1.2rem;
          }

          .rights-grid,
          .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          }

          .right-item,
          .feature-item {
            padding: 16px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
          }

          .right-item h4,
          .feature-item h4 {
            margin: 0 0 8px 0;
            color: #333;
            font-size: 1rem;
          }

          .right-item p,
          .feature-item p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .feature-item {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .feature-icon {
            font-size: 1.5rem;
          }

          .data-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }

          .category-item {
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
            position: relative;
          }

          .category-item h4 {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 1rem;
          }

          .category-item ul {
            margin: 0 0 16px 0;
            padding-left: 20px;
            color: #666;
            font-size: 0.9rem;
          }

          .category-item li {
            margin-bottom: 4px;
          }

          .encryption-level {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .encryption-level.critical {
            background: #dc3545;
            color: white;
          }

          .encryption-level.high {
            background: #fd7e14;
            color: white;
          }

          .encryption-level.medium {
            background: #ffc107;
            color: #212529;
          }

          .encryption-level.low {
            background: #28a745;
            color: white;
          }

          .compliance-frameworks {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }

          .framework-item {
            padding: 20px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
            position: relative;
          }

          .framework-item h4 {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 1rem;
          }

          .framework-item p {
            margin: 0 0 16px 0;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .compliance-status {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .compliance-status.compliant {
            background: #d4edda;
            color: #155724;
          }

          .compliance-status.in-progress {
            background: #fff3cd;
            color: #856404;
          }

          .dashboard-footer {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            text-align: center;
          }

          .footer-content h3 {
            margin: 0 0 12px 0;
            color: #333;
            font-size: 1.3rem;
          }

          .footer-content p {
            margin: 0 0 24px 0;
            color: #666;
            font-size: 1rem;
            line-height: 1.6;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
          }

          .contact-options {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .contact-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
          }

          .contact-button:hover {
            transform: translateY(-2px);
          }

          @media (max-width: 768px) {
            .privacy-dashboard {
              padding: 12px;
            }

            .dashboard-header {
              padding: 20px;
            }

            .header-content h1 {
              font-size: 1.8rem;
            }

            .privacy-highlights {
              grid-template-columns: 1fr;
            }

            .nav-tab {
              min-width: 150px;
              padding: 12px 16px;
            }

            .rights-grid,
            .features-grid,
            .data-categories,
            .compliance-frameworks {
              grid-template-columns: 1fr;
            }

            .contact-options {
              flex-direction: column;
              align-items: center;
            }

            .contact-button {
              width: 100%;
              max-width: 300px;
            }
          }
        `}</style>
      </div>
    </PrivacyProvider>
  );
};

export default PrivacyDashboard;
