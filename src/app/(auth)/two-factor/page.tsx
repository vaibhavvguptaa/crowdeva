"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthUserType } from '@/types/auth';

export default function TwoFactorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithOtp } = useAuth();

  const email = searchParams?.get('email');
  const password = searchParams?.get('password');
  const authType = searchParams?.get('authType') as AuthUserType;

  useEffect(() => {
    if (!email || !password || !authType) {
      router.push('/signin');
    }
  }, [email, password, authType, router]);

  const handleSubmit = async (otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithOtp(email!, password!, authType, otp);
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
