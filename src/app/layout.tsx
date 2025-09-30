import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import QueryProvider from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CrowdEval',
  metadataBase: new URL('http://localhost:3000'), 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}