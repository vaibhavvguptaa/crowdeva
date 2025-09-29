"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TabSwitcher } from '@/components/signin/TabSwitcher';
import { GoogleSignInButton } from '@/components/signin/GoogleSignInButton';
import { FullScreenLoading } from '@/components/Ui/LoadingOverlay';
import { AuthErrorHandler } from '@/lib/authErrorHandler';
import { AuthUserType, REALM_CONFIGS } from '@/types/auth';
import { SignUpFormWrapper } from '@/components/signup/SignUpFormWrapper';

export default function VendorSignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const activeTab: AuthUserType = 'vendors';

  const router = useRouter();
  const { user, register, loading } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/vendor/projects');
    }
  }, [user, router]);

  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [email, password, confirmPassword, firstName, lastName, companyName]);

  const handleSignUp = async (
    email: string, 
    password: string, 
    confirmPassword: string,
    firstName: string,
    lastName: string,
    companyName: string | null
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // For vendors, companyName is required
      if (!companyName) {
        throw new Error('Company name is required for vendors');
      }

      await register(email, password, companyName, firstName, lastName, activeTab);
      setSuccessMessage('Registration successful! Please check your email to verify your account, then sign in.');
      
      setTimeout(() => {
        router.push('/vendor/signin');
      }, 3000);
    } catch (err) {
      const errorState = AuthErrorHandler.handleError(err);
      setError(errorState.message);
      console.error("Registration failed:", errorState.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push('/vendor/signin');
  };

  const handleTabChange = (tab: AuthUserType) => {
    if (tab === 'developers') {
      router.push('/developer/signup');
    } else if (tab === 'customers') {
      router.push('/signup');
    }
    // Stay on current page for vendors
  };

  if (loading) {
    return <FullScreenLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-screen max-w-7xl mx-4 max-h-screen lg:min-h-0 ">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
          <div className="grid lg:grid-cols-2 min-h-[700px]">
            {/* Left Panel - Sign Up Form */}
            <div className="p-8 lg:p-12 flex flex-col justify-center relative">
              <div className="absolute top-0 left-0 w-32 h-32 bg-green-100/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-100/30 rounded-full translate-x-1/2 translate-y-1/2"></div>
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Vendor</h1>
                  <p className="text-gray-600">Create your vendor account</p>
                </div>
                <div className="mb-8 flex justify-center whitespace-nowrap">
                  <TabSwitcher 
                    activeTab={activeTab} 
                    onTabChange={handleTabChange} 
                    includeVendors={true}
                  />
                </div>
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
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-center text-sm text-gray-600 mb-4">
                      Or continue with
                    </div>
                    <GoogleSignInButton 
                      authType={activeTab}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Right Panel - Features */}
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 p-8 lg:p-12 flex flex-col justify-center text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/2 translate-y-1/2"></div>
              <div className="relative z-10">
                <div className="max-w-md mx-auto">
                  <h2 className="text-3xl font-bold mb-6">Vendor Platform</h2>
                  <p className="text-yellow-100 text-lg mb-8 leading-relaxed">
                    {REALM_CONFIGS[activeTab].description}
                  </p>
                  <div className="mb-8">
                    <div className="space-y-3">
                      {REALM_CONFIGS[activeTab].features.map((feature, index) => (
                        <div key={index} className="flex items-center text-yellow-100">
                          <svg className="w-5 h-5 mr-3 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-yellow-500/30 pt-6">
                    <p className="text-yellow-200 text-sm">
                      Join thousands of vendors who trust Crowdeval for their business needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <FullScreenLoading />}
    </div>
  );
}