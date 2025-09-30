"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthUserType } from '@/types/auth';

// Separate component that uses useSearchParams
function TwoFactorContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { loginWithOtp } = useAuth();

  // State for auth parameters
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [authType, setAuthType] = useState<AuthUserType | null>(null);

  useEffect(() => {
    // Get parameters from URL search params
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const passwordParam = params.get('password');
    const authTypeParam = params.get('authType') as AuthUserType;

    setEmail(emailParam);
    setPassword(passwordParam);
    setAuthType(authTypeParam);

    if (!emailParam || !passwordParam || !authTypeParam) {
      router.push('/signin');
    }
  }, [router]);

  const handleSubmit = async (otp: string) => {
    if (!email || !password || !authType) {
      setError('Missing authentication parameters');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await loginWithOtp(email, password, authType, otp);
      router.push('/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <AuthHeader
          title="Two-Factor Authentication"
          subtitle="Enter the code from your authenticator app."
        />
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <TwoFactorForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return <TwoFactorContent />;
}