"use client";

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { TabSwitcher } from '@/components/signin/TabSwitcher';
import { SignUpFormWrapper } from '@/components/signup/SignUpFormWrapper';
import { AnimatedContent } from '@/components/signin/AnimatedContent';
import { ClientOnly } from '@/components/Ui/ClientOnly';
import { FullScreenLoading } from '@/components/Ui/LoadingOverlay';
import { useAuthContext } from '@/contexts/AuthContext';
import { AuthUserType } from '@/types/auth';
import { generateStructuredData } from '@/lib/seo';

function SignUpPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, clearError } = useAuthContext();
  const [activeTab, setActiveTab] = useState<AuthUserType>((searchParams?.get('type') as AuthUserType) || 'customers');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = (tab: AuthUserType) => {
    if (isLoading) return;
    setIsTransitioning(true);
    clearError();
    setError(null);
    setActiveTab(tab);
    // Reset form when switching tabs
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setCompanyName('');
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleSignUp = async (
    email: string,
    password: string,
    confirmPassword: string,
    firstName: string,
    lastName: string,
    companyName: string | null
  ) => {
    console.log('handleSignUp called with data:', {
      email,
      password: '***',
      confirmPassword: '***',
      firstName,
      lastName,
      companyName
    });
    
    if (password !== confirmPassword) {
      console.log('Password mismatch detected');
      setError('Passwords do not match');
      return;
    }

    // For vendors and customers, check if companyName is provided
    // Note: This validation should have been handled by the form, but we double-check here
    if (activeTab !== 'developers' && (!companyName || companyName.trim() === '')) {
      console.log('Company name validation failed for non-developer user');
      setError('Company name is required for vendors and customers');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Signup data:', { email, password: '***', companyName, firstName, lastName, activeTab });
      
      await register(email, password, companyName, firstName, lastName, activeTab);
      console.log('Registration successful, setting success message');
      setSuccessMessage('Account created successfully! Redirecting to sign in...');
      // Reduce the redirect delay from 2000ms to 1000ms to improve perceived performance
      setTimeout(() => {
        router.push(`/signin?type=${activeTab}`);
      }, 1000);
    } catch (err) {
      console.error('Registration error caught in handleSignUp:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push(`/signin?type=${activeTab}`);
  };

  const structuredData = useMemo(() => generateStructuredData(activeTab), [activeTab]);

  // Get nonce from headers for CSP
  const nonce = typeof window === 'undefined' ? undefined : undefined; // Will be handled by middleware

  return (
    <>
      {/* SEO Structured Data - Only render on client for parity with SignIn */}
      <ClientOnly>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
          // Note: In a production environment, we would use a nonce here
          // For now, we're relying on the CSP configuration in middleware
        />
      </ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[600px] lg:min-h-[640px]">
              {/* Left Panel - Sign Up Form (mirroring SignIn layout) */}
              <div className="p-4 lg:p-6 flex flex-col justify-center relative h-full">
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-green-100/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-100/30 rounded-full translate-x-1/2 translate-y-1/2"></div>
                <div className="relative z-10">
                  {/* Header */}
                  <AuthHeader title="Create your CrowdEval account" subtitle="Sign up to start evaluating AI projects" />
                  {/* Tab Switcher */}
                  <div className="mb-4 flex justify-center">
                    <div className="overflow-x-auto">
                      <TabSwitcher 
                        activeTab={activeTab} 
                        onTabChange={handleTabChange} 
                        includeVendors={true}
                      />
                    </div>
                  </div>
                  {/* Sign Up Form */}
                  <div className="max-w-md mx-auto w-full">
                    <SignUpFormWrapper
                      userType={activeTab}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      firstName={firstName}
                      setFirstName={setFirstName}
                      lastName={lastName}
                      setLastName={setLastName}
                      companyName={companyName}
                      setCompanyName={setCompanyName}
                      onSignUp={handleSignUp}
                      onSignIn={handleSignIn}
                      isLoading={isLoading}
                      error={error}
                      successMessage={successMessage}
                    />
                  </div>
                </div>
              </div>
              {/* Right Panel - Features */}
              <AnimatedContent 
                activeTab={activeTab} 
                isTransitioning={isTransitioning}
              />
            </div>
          </div>
        </div>
        <ClientOnly>
          {isLoading && (
            <FullScreenLoading message="Creating your account..." />
          )}
        </ClientOnly>
      </div>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignUpPageInner />
    </Suspense>
  );
}