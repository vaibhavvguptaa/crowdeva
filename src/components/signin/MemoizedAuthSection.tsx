"use client";

import React, { memo } from 'react';
import { ImprovedAuthForm } from './ImprovedAuthForm';
import { TwoFactorStep } from './TwoFactorStep';
import { GoogleSignInButton } from './GoogleSignInButton';
import { AuthUserType } from '@/types/auth';

interface MemoizedAuthSectionProps {
  activeTab: AuthUserType;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSubmitOtp: (otp: string) => Promise<void>;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onError?: (error: string) => void;
  stage: 'credentials' | 'otp';
  onBackToCredentials: () => void;
  onGoogleRedirecting?: (isRedirecting: boolean) => void;
  onResendOtp?: () => void; // new prop for resending OTP
}

const MemoizedAuthSectionComponent: React.FC<MemoizedAuthSectionProps> = ({
  activeTab,
  isLoading,
  error,
  successMessage,
  onSignIn,
  onSubmitOtp,
  onForgotPassword,
  onSignUp,
  onError,
  stage,
  onBackToCredentials,
  onGoogleRedirecting,
  onResendOtp // new prop
}) => {
  return (
    <div className="max-w-md mx-auto w-full">
      {stage === 'credentials' && (
        <ImprovedAuthForm
          key={activeTab} // Add key to force re-render when tab changes
          onSignIn={onSignIn}
          onForgotPassword={onForgotPassword}
          onSignUp={onSignUp}
          isLoading={isLoading}
          error={error}
          successMessage={successMessage}
        />
      )}
      {stage === 'otp' && (
        <TwoFactorStep
          isLoading={isLoading}
          error={error}
          onSubmitCode={onSubmitOtp}
          onBack={onBackToCredentials}
          totpPeriodSeconds={30}
          onResendCode={onResendOtp} // pass the new prop
          canResendCode={true} // for now, always allow resending
        />
      )}
    {/* TabSwitcher + social auth intentionally hidden during OTP for reduced attack surface & to simplify state.
      If future requirement needs realm switching mid-OTP, move this block outside stage check with disabled state. */}
    {stage === 'credentials' && (
        <div className="mt-4">
          <GoogleSignInButton 
            authType={activeTab}
            disabled={isLoading}
            onError={onError}
            onRedirecting={onGoogleRedirecting} // Pass the prop
          />
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const MemoizedAuthSection = memo(MemoizedAuthSectionComponent, (p, n) =>
  p.activeTab === n.activeTab &&
  p.isLoading === n.isLoading &&
  p.error === n.error &&
  p.successMessage === n.successMessage &&
  p.onSignIn === n.onSignIn &&
  p.onSubmitOtp === n.onSubmitOtp &&
  p.onForgotPassword === n.onForgotPassword &&
  p.onSignUp === n.onSignUp &&
  p.onError === n.onError &&
  p.stage === n.stage
);