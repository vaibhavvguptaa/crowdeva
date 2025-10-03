"use client";

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Building, AlertCircle, ShieldCheck } from 'lucide-react';
import { signUpSchema as baseSignUpSchema, SignUpFormData } from '@/lib/validationSchemas';
import dynamic from 'next/dynamic';
// Lazy load password requirements to keep initial bundle smaller
const PasswordRequirements = dynamic(() => import('@/components/auth/PasswordRequirements').then(m => m.PasswordRequirements), { ssr: false, loading: () => null });
import { AuthUserType } from '@/types/auth';

interface SignUpFormProps {
  userType: AuthUserType;
  // External state setters retained for backwards compatibility; form manages its own state internally.
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  confirmPassword: string; setConfirmPassword: (v: string) => void;
  firstName: string; setFirstName: (v: string) => void;
  lastName: string; setLastName: (v: string) => void;
  companyName: string; setCompanyName: (v: string) => void;
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
  error?: string | null;
  successMessage?: string | null;
}

// Predefine schemas outside component to avoid re-instantiation cost
// Updated schemas to properly handle conditional validation
const developerSchema = baseSignUpSchema.superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: "Passwords don't match" });
  }
});

const orgSchema = baseSignUpSchema.superRefine((data, ctx) => {
  // For vendors and customers, company name is required and must be non-empty
  if (!data.companyName || data.companyName.trim() === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['companyName'], message: 'Company name is required for vendors and customers' });
  }
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: "Passwords don't match" });
  }
});

export const SignUpForm: React.FC<SignUpFormProps> = ({
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
  error: propError,
  successMessage,
}) => {
  // Use a type guard to ensure TypeScript understands all possible values
  const isDeveloper = userType === 'developers';
  const schema = isDeveloper ? developerSchema : orgSchema;

  const { register, handleSubmit, control, formState: { errors, isValid, isSubmitting }, setValue, trigger } = useForm<SignUpFormData & { termsAccepted: boolean }>({
    resolver: zodResolver(schema),
    // Switched to onChange so submit button enables immediately during automated tests (previously onBlur)
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email, password, confirmPassword, firstName, lastName, companyName, termsAccepted: false }
  });
  
  // Debugging: Log validation errors
  React.useEffect(() => {
    console.log('Form errors:', errors);
    console.log('Form is valid:', isValid);
  }, [errors, isValid]);
  // Granular value subscriptions to reduce re-renders compared to broad watch()
  const watchedFirstName = useWatch({ control, name: 'firstName' });
  const watchedLastName = useWatch({ control, name: 'lastName' });
  const watchedEmail = useWatch({ control, name: 'email' });
  const watchedPassword = useWatch({ control, name: 'password' });
  const watchedConfirmPassword = useWatch({ control, name: 'confirmPassword' });
  const watchedCompanyName = useWatch({ control, name: 'companyName' });
  const watchedTermsAccepted = useWatch({ control, name: 'termsAccepted' });
  const preservedCompanyRef = useRef<string>('');

  // Sync outward for compatibility with existing page state (not strictly needed now)
  useEffect(() => { setEmail(watchedEmail); }, [watchedEmail, setEmail]);
  useEffect(() => { setPassword(watchedPassword); }, [watchedPassword, setPassword]);
  useEffect(() => { setConfirmPassword(watchedConfirmPassword); }, [watchedConfirmPassword, setConfirmPassword]);
  useEffect(() => { setFirstName(watchedFirstName); }, [watchedFirstName, setFirstName]);
  useEffect(() => { setLastName(watchedLastName); }, [watchedLastName, setLastName]);
  useEffect(() => { 
    const companyNameValue = watchedCompanyName || '';
    setCompanyName(companyNameValue); 
  }, [watchedCompanyName, setCompanyName]);
  useEffect(() => {
    if (isDeveloper) {
      if (watchedCompanyName) preservedCompanyRef.current = watchedCompanyName;
      // Clear company name field for developers
      setValue('companyName', '');
      setCompanyName('');
    } else {
      if (!watchedCompanyName && preservedCompanyRef.current) {
        setValue('companyName', preservedCompanyRef.current);
        setCompanyName(preservedCompanyRef.current);
      }
    }
    // Re-trigger validation when user type changes
    trigger();
  }, [isDeveloper, watchedCompanyName, setValue, setCompanyName, trigger]);

  const onSubmit = useCallback(async (data: SignUpFormData & { termsAccepted: boolean }) => {
    console.log('Form submission data:', data);
    console.log('User type:', userType);
    console.log('Form is valid:', isValid);
    console.log('Form errors:', errors);
    
    // Double-check that form is valid before proceeding
    if (!isValid) {
      console.log('Form is not valid, preventing submission');
      return;
    }
    
    // Prepare company name to send
    let companyNameToSend = null;
    if (isDeveloper) {
      companyNameToSend = ''; // Empty string for developers
    } else {
      
      companyNameToSend = data.companyName?.trim() || null;
      // If trimmed value is empty, set to null to trigger validation error
      if (companyNameToSend === '') {
        companyNameToSend = null;
      }
    }
    
    console.log('Company name to send:', companyNameToSend);
    console.log('Calling onSignUp with data:', {
      email: data.email,
      password: '***',
      confirmPassword: '***',
      firstName: data.firstName,
      lastName: data.lastName,
      companyName: companyNameToSend
    });
    
    await onSignUp(
      data.email, 
      data.password, 
      data.confirmPassword, 
      data.firstName, 
      data.lastName, 
      companyNameToSend
    );
  }, [onSignUp, isDeveloper, isValid, errors]);

  const getErr = (field: keyof (SignUpFormData & { termsAccepted: boolean })) => errors[field]?.message as string | undefined;
  const touched = useCallback((field: keyof (SignUpFormData & { termsAccepted: boolean })) => {
    switch (field) {
      case 'firstName': return !!watchedFirstName;
      case 'lastName': return !!watchedLastName;
      case 'email': return !!watchedEmail;
      case 'password': return !!watchedPassword;
      case 'confirmPassword': return !!watchedConfirmPassword;
      case 'companyName': return !!watchedCompanyName;
      case 'termsAccepted': return watchedTermsAccepted !== undefined && watchedTermsAccepted !== false; // Only consider touched if user has interacted (true or explicitly set to false)
      default: return false;
    }
  }, [watchedFirstName, watchedLastName, watchedEmail, watchedPassword, watchedConfirmPassword, watchedCompanyName, watchedTermsAccepted]);
  const showErr = (field: keyof (SignUpFormData & { termsAccepted: boolean })) => {
    
    if (field === 'termsAccepted') {
      return !!getErr(field) && (touched(field) || isSubmitting);
    }
    return !!getErr(field) && touched(field);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {propError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="text-xs text-red-700">{propError}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2" role="alert" aria-live="polite">
          <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5" />
          <div className="text-xs text-green-700">{successMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
          <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-1 focus-within:ring-gray-500 focus-within:ring-opacity-50">
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              autoComplete="given-name"
              disabled={isLoading}
              aria-invalid={showErr('firstName')}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          {showErr('firstName') && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('firstName')}</p>}
        </div>
        {/* Last Name */}
        <div className="space-y-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
          <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
        
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              autoComplete="family-name"
              disabled={isLoading}
              aria-invalid={showErr('lastName')}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          {showErr('lastName') && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('lastName')}</p>}
        </div>
      </div>

      {!isDeveloper && (
        <div className="space-y-1">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
          <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
       
            <input
              {...register('companyName')}
              id="companyName"
              type="text"
              autoComplete="organization"
              disabled={isLoading}
              aria-invalid={showErr('companyName')}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
          </div>
          {showErr('companyName') && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('companyName')}</p>}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
        <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
          
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="username"
            disabled={isLoading}
            aria-invalid={showErr('email')}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        {showErr('email') && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('email')}</p>}
      </div>

      {/* Password */}
      <PasswordInputs
        register={register}
        getErr={getErr}
        touched={touched}
        isLoading={isLoading}
        watchPassword={watchedPassword}
      />

      {/* Terms */}
      <div className="flex items-center gap-2">
        <input
          {...register('termsAccepted')}
          id="termsAccepted"
          type="checkbox"
          disabled={isLoading}
          className="h-4 w-4 rounded border-gray-300 cursor-pointer text-green-600 focus:ring-gray-500 disabled:opacity-50"
        />
        <label htmlFor="termsAccepted" className="text-xs text-gray-600 select-none">
          I agree to the <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>
        </label>
      </div>
      {showErr('termsAccepted') && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {getErr('termsAccepted')}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isLoading || isSubmitting}
  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none cursor-pointer transition-colors"
      >
        {(isLoading || isSubmitting) ? (<><Loader2 className="animate-spin h-5 w-5" /><span>Creating account...</span></>) : 'Create Account'}
      </button>

      {/* Separator with overlayed sign-in link */}
      <div className="relative my-6">
        <div className="border-t border-gray-300" aria-hidden="true"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-3 bg-white text-xs text-gray-600 flex items-center gap-1">
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={onSignIn}
              disabled={isLoading}
              className="font-medium text-green-600 hover:text-green-700 focus:outline-none disabled:opacity-50 cursor-pointer"
            >
              Sign in
            </button>
          </span>
        </div>
      </div>
    </form>
  );
};

const PasswordInputs: React.FC<{register: any; getErr: (k: any)=>string|undefined; touched: (k:any)=>boolean; isLoading:boolean; watchPassword:string;}> = ({ register, getErr, touched, isLoading, watchPassword }) => {
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const showErr = (field: any) => !!getErr(field) && touched(field);
  return (
      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
           
            <input
              {...register('password')}
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={showErr('password')}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
            <button type="button" onClick={()=>setShowPass(p=>!p)} aria-label={showPass?'Hide password':'Show password'} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
              {showPass ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
            </button>
          </div>
          {showErr('password') && <p className="text-xs  text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('password')}</p>}
          <div className="text-[10px] text-gray-500 mt-1">
            <PasswordRequirements password={watchPassword} minimal />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <div className="relative rounded-md shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
            
            <input
              {...register('confirmPassword')}
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isLoading}
              aria-invalid={showErr('confirmPassword')}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
            />
            <button type="button" onClick={()=>setShowConfirm(p=>!p)} aria-label={showConfirm?'Hide password':'Show password'} className="absolute inset-y-0 right-0 pr-3 flex items-center" disabled={isLoading}>
              {showConfirm ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
            </button>
          </div>
          {showErr('confirmPassword') && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{getErr('confirmPassword')}</p>}
        </div>
      </div>
  );
};

SignUpForm.displayName = 'SignUpForm';