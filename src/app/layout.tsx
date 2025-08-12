import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SATA - Mental Health Platform',
  description: 'AI-powered mental health support and wellness platform',
  keywords: ['mental health', 'wellness', 'AI support', 'anonymous'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
