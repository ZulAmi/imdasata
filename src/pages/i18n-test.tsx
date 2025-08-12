import React from 'react';
import { I18nProvider } from '../hooks/useI18n';
import I18nTestContent from '../components/I18nTestContent';
import Head from 'next/head';

export default function I18nTestPage() {
  return (
    <>
      <Head>
        <title>SATA i18n System Test</title>
        <meta name="description" content="Test page for SATA internationalization system" />
      </Head>
      <I18nProvider>
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#f5f5f5',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <I18nTestContent />
        </div>
      </I18nProvider>
    </>
  );
}
