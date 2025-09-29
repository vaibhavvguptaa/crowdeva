'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle} from 'lucide-react';
import { signInSchema, SignInFormData } from '@/lib/validationSchemas';
import dynamic from 'next/dynamic';
import { logAuthFailure } from '@/lib/logger';

const PasswordRequirements = dynamic(() => import('@/components/auth/PasswordRequirements').then(m => m.PasswordRequirements), { ssr: false, loading: () => null });

interface ImprovedAuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
  onSignUp: () => void;
  isLoading: boolean;
  error?: string | null;
  successMessage?: string | null;
}

export const ImprovedAuthForm: React.FC<ImprovedAuthFormProps> = ({
  onSignIn,
  onForgotPassword,
  onSignUp,
  isLoading,
  error: propError,
  successMessage,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Track if form has been submitted

  const { register, handleSubmit, formState: { errors, isValid }, watch, setError, clearErrors, trigger } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onSubmit', // Only validate on submit
    reValidateMode: 'onSubmit',
    defaultValues: { email: '', password: '' }
  });

  // Only subscribe to individual fields (avoids object identity churn)
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const onSubmit = async (data: SignInFormData) => {
    setHasSubmitted(true); // Mark that form has been submitted
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSignIn(data.email, data.password);
    } catch (error) {
      // Error is handled by parent component
      console.error('Sign in failed:', error);
      
      logAuthFailure(data.email, 'signin_failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName: keyof SignInFormData) => {
    // Only show errors after form submission
    if (!hasSubmitted) return undefined;
    
    // For sign-in, we only want to show errors that come from the server (propError)
    // or validation errors that occur on submit, not during typing
    if (fieldName === 'password') {
      // If there's a server error related to password, show it
      if (propError && propError.toLowerCase().includes('password')) {
        return propError;
      }
      // Don't show client-side password validation errors during typing
      return undefined;
    }
    return errors[fieldName]?.message;
  };

  const isFieldTouched = (fieldName: keyof SignInFormData) => {
    if (fieldName === 'email') return !!watchedEmail;
    if (fieldName === 'password') return !!watchedPassword;
    return false;
  };

  // Handle real-time validation feedback for email only
  useEffect(() => {
    if (watchedEmail && !getFieldError('email')) {
      // Validate email format in real-time
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(watchedEmail)) {
        setEmailValidated(true);
      } else {
        setEmailValidated(false);
      }
    } else {
      setEmailValidated(false);
    }
  }, [watchedEmail, errors.email]);

  // Auto-focus email field when component mounts
  useEffect(() => {
    if (isMounted) {
      const emailField = document.getElementById('email') as HTMLInputElement;
      if (emailField) {
        emailField.focus();
      }
    }
  }, [isMounted]);

  // Enhanced error categorization for better user feedback
  const getErrorCategory = (error: string | null | undefined) => {
    if (!error) return null;
    
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('email') || errorLower.includes('username')) {
      return 'email';
    }
    if (errorLower.includes('password')) {
      return 'password';
    }
    if (errorLower.includes('locked') || errorLower.includes('disabled')) {
      return 'account';
    }
    if (errorLower.includes('connection') || errorLower.includes('network')) {
      return 'network';
    }
    if (errorLower.includes('service') || errorLower.includes('configuration')) {
      return 'service';
    }
    
    return 'general';
  };

  const errorCategory = getErrorCategory(propError);

  if (!isMounted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Status Messages */}
      {propError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2" role="alert" aria-live="polite">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs text-red-700 font-medium mb-1">{propError}</div>
            {errorCategory === 'network' && (
              <p className="text-xs text-red-600">
                Please check your internet connection and try again.
              </p>
            )}
            {errorCategory === 'account' && (
              <p className="text-xs text-red-600">
                Try again in a few minutes or contact support if this persists.
              </p>
            )}
            {errorCategory === 'email' && (
              <p className="text-xs text-red-600">
                Double-check your email address and try again.
              </p>
            )}
            {errorCategory === 'password' && (
              <p className="text-xs text-red-600">
                Double-check your password, or use "Forgot password?" below.
              </p>
            )}
            {(errorCategory === 'service' || errorCategory === 'general') && (
              <p className="text-xs text-red-600">
                This appears to be a temporary issue. Please try again or contact support.
              </p>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2" role="alert" aria-live="polite">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-xs text-green-700">{successMessage}</div>
        </div>
      )}

  {/* Email Field */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-900" />
          </div>
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="username"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!getFieldError('email')}
            aria-describedby={getFieldError('email') ? 'email-error' : undefined}
            className={`block w-full pl-10 pr-3 py-2.5 border rounded-md focus:outline-none text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors text-gray-900 ${getFieldError('email') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : emailValidated ? 'border-green-300 focus:ring-green-500 focus:border-green-500' : isFieldTouched('email') ? 'border-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'border-gray-500 focus:ring-gray-500 focus:border-gray-500'}`}
            placeholder="you@example.com"
          />
      
        </div>
        {getFieldError('email') && (
          <p id="email-error" className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {getFieldError('email')}
          </p>
        )}
        {!getFieldError('email') && isFieldTouched('email') && !emailValidated && hasSubmitted && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <span className="text-xs">Enter a valid email address</span>
          </p>
        )}
      </div>

  {/* Password Field */}
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-900" />
          </div>
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!getFieldError('password')}
            aria-describedby={getFieldError('password') ? 'password-error' : undefined}
            className={`block w-full pl-10 pr-12 py-2.5 border rounded-md focus:outline-none text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors text-gray-900 ${getFieldError('password') ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : isFieldTouched('password') ? 'border-gray-400 focus:ring-gray-500 focus:border-gray-500' : 'border-gray-500 focus:ring-gray-500 focus:border-gray-500'}`}
            placeholder="Enter your password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || isSubmitting}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </button>
         </div>
        {getFieldError('password') && (
          <p id="password-error" className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {getFieldError('password')}
          </p>
        )}
      </div>

  {/* Forgot Password */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={isLoading || isSubmitting}
          className="text-sm font-medium text-green-600 hover:text-green-700 cursor-pointer focus:outline-none disabled:opacity-50 transition-colors"
        >
          Forgot password?
        </button>
      </div>

  {/* OTP removed from first step; now handled in dedicated second-step component */}

  {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isSubmitting || (!hasSubmitted && !isValid)}
        className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 cursor-pointer transition-colors"
      >
        {isLoading || isSubmitting ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>

  {/* Sign Up Link */}
      <div className="text-center text-xs text-gray-600">
        <span className="mr-1">Don&apos;t have an account?</span>
        <button
          type="button"
          onClick={onSignUp}
          disabled={isLoading || isSubmitting}
          className="font-medium text-green-600 hover:text-green-700 cursor-pointer focus:outline-none disabled:opacity-50 transition-colors"
        >
          Sign up
        </button>
      </div>
    </form>
  );
};

ImprovedAuthForm.displayName = 'ImprovedAuthForm';