'use client';

import React from 'react';
// Legacy SignUpForm replaced by SignUpForm (react-hook-form + zod)
import { SignUpForm } from '@/components/signup/SignUpForm';
import { GoogleSignInButton } from '@/components/signin/GoogleSignInButton';
import { AuthUserType } from '@/types/auth';

interface SignUpFormWrapperProps {
  userType: AuthUserType;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  firstName: string;
  setFirstName: (firstName: string) => void;
  lastName: string;
  setLastName: (lastName: string) => void;
  companyName: string;
  setCompanyName: (companyName: string) => void;
  onSignUp: (
    email: string, 
    password: string, 
    confirmPassword: string,
    firstName: string,
    lastName: string,
    companyName: string | null
  ) => Promise<void>;
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

export const SignUpFormWrapper: React.FC<SignUpFormWrapperProps> = ({
  userType,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  companyName,
  setCompanyName,
  onSignUp,
  onSignIn,
  isLoading,
  error,
  successMessage,
}) => {
  return (
    <>
      <SignUpForm
        userType={userType}
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
        onSignUp={onSignUp}
        onSignIn={onSignIn}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
      />
         <GoogleSignInButton 
          authType={userType}
          disabled={isLoading}
        />
  {/* Removed bottom separator line below Google button per request */}
    </>
  );
};
