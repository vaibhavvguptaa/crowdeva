"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, OtpFormData } from '@/lib/validationSchemas';
import { Loader2, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuthErrorHandler } from '@/lib/authErrorHandler';
import { logAuthFailure, logSecurityEvent } from '@/lib/logger';

interface TwoFactorStepProps {
  isLoading: boolean;
  error?: string | null;
  onSubmitCode: (otp: string) => Promise<void>;
  onBack: () => void; // optionally allow going back to change email/password
  totpPeriodSeconds?: number; // configurable TOTP period (default 30s)
  lastSuccessAt?: number | null; // timestamp to provide success pulse feedback
  onResendCode?: () => void; // new prop for resending codes
  canResendCode?: boolean; // new prop to control resend button state
}

export const TwoFactorStep: React.FC<TwoFactorStepProps> = ({ 
  isLoading, 
  error, 
  onSubmitCode, 
  onBack, 
  totpPeriodSeconds = 30, 
  lastSuccessAt,
  onResendCode,
  canResendCode = true
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, getValues, trigger } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    mode: 'onChange',
    defaultValues: { otp: '' }
  });

  const [digits, setDigits] = useState<string[]>(['','','','','','']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [pasted, setPasted] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const now = Math.floor(Date.now()/1000);
    return totpPeriodSeconds - (now % totpPeriodSeconds);
  });
  const [pendingRolloverSubmitCode, setPendingRolloverSubmitCode] = useState<string | null>(null);
  const lastWindowRef = useRef<number>(Math.floor(Date.now()/1000/ totpPeriodSeconds));
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const focusIndex = (idx: number) => {
    const el = inputRefs.current[idx];
    if (el) el.focus();
  };

  const allJoined = useCallback(() => digits.join(''), [digits]);

  // Sync digits to hidden input for validation & submission
  useEffect(() => {
    const val = allJoined();
    setValue('otp', val, { shouldValidate: true, shouldDirty: true });
    if (val.length === 6) {
      void trigger('otp');
    }
  // If code changed from deferred snapshot, cancel deferred submit
  setPendingRolloverSubmitCode(prev => (prev && prev !== val ? null : prev));
  }, [digits, setValue, trigger, allJoined]);

  // Countdown timer for TOTP window
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const now = Math.floor(Date.now()/1000);
          return totpPeriodSeconds - (now % totpPeriodSeconds);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totpPeriodSeconds]);

  // Refocus on first empty digit after error cleared (UX improvement)
  const prevErrorRef = useRef<string | null | undefined>(error);
  useEffect(() => {
    if (prevErrorRef.current && !error) {
      // find first empty digit
      const firstEmpty = digits.findIndex(d => !d);
      focusIndex(firstEmpty === -1 ? 0 : firstEmpty);
    }
    prevErrorRef.current = error;
  }, [error, digits]);

  const setDigit = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    setDigits(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < 5) focusIndex(index + 1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        setDigit(idx, '');
      } else if (idx > 0) {
        setDigit(idx - 1, '');
        focusIndex(idx - 1);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      focusIndex(idx - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      focusIndex(idx + 1);
      e.preventDefault();
    } else if (/^[0-9]$/.test(e.key) && !digits[idx]) {
      // Auto-fill digit when typing
      setDigit(idx, e.key);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (text.length) {
      e.preventDefault();
      const arr = text.split('');
      setDigits((prev) => prev.map((_, i) => arr[i] || ''));
      setPasted(true);
      if (text.length < 6) focusIndex(text.length);
      
      // Auto-submit if we have a full code
      if (text.length === 6) {
        setTimeout(() => {
          const form = e.currentTarget.closest('form');
          if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              (submitBtn as HTMLButtonElement).click();
            }
          }
        }, 100);
      }
    }
  };

  const submit = async () => {
    const code = getValues('otp');
    if (code.length !== 6) return;
    setAutoSubmitting(true);
    try {
      await onSubmitCode(code);
    } catch (err: any) {
      const errorState = AuthErrorHandler.handleError(
        err,
        { component: 'TwoFactorStep', action: 'submitOtp' }
      );
      // Log authentication failure for security monitoring
      logAuthFailure('unknown', '2fa_failure', {
        error: errorState.message,
        codeLength: code.length
      });
      // Pass error back to parent component through onSubmitCode
      throw new Error(errorState.message);
    } finally {
      setAutoSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!onResendCode || !canResendCode || resendLoading) return;
    
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await onResendCode();
      setResendSuccess(true);
      // Log security event for code resend
      logSecurityEvent('2fa_code_resend', {
        timestamp: new Date().toISOString()
      });
      // Clear success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      const errorState = AuthErrorHandler.handleError(
        error,
        { component: 'TwoFactorStep', action: 'resendCode' }
      );
      // Log authentication failure for security monitoring
      logAuthFailure('unknown', '2fa_resend_failure', {
        error: errorState.message
      });
    } finally {
      setResendLoading(false);
    }
  };

  const hasError = !!errors.otp;
  const ready = allJoined().length === 6 && !hasError;

  // Auto-submit when ready, but avoid submitting in the final 2s of a TOTP window
  useEffect(() => {
    if (!ready || isLoading || autoSubmitting) return;
    if (secondsLeft > 2) {
      // Normal window — submit immediately
      void submit();
    } else {
      // Defer submission until next window ~400ms after rollover; capture code snapshot
      const code = getValues('otp');
      setPendingRolloverSubmitCode(code);
      const delayMs = (secondsLeft * 1000) + 400; // wait remaining time + 400ms buffer
      const id = setTimeout(() => {
        const current = getValues('otp');
        if (!isLoading && !autoSubmitting && pendingRolloverSubmitCode === current) {
          void submit();
        }
      }, delayMs);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, secondsLeft, isLoading, autoSubmitting]);

  // Clear rollover warning state when a new window starts
  useEffect(() => {
    const currentWindow = Math.floor(Date.now()/1000 / totpPeriodSeconds);
    if (currentWindow !== lastWindowRef.current) {
      lastWindowRef.current = currentWindow;
      setPendingRolloverSubmitCode(null);
    }
  }, [secondsLeft, totpPeriodSeconds]);

  /*
   * Admin Reference (moved from stray inline code -> safe comment):
   * Example kcadm OTP policy commands (do NOT leave as executable code):
   * kcadm.sh config credentials --server https://kc.example.com --realm master --user admin --password 'ADMIN_PASS'
   * kcadm.sh update realms/Customer  -s otpPolicyType=totp -s otpPolicyAlgorithm=HmacSHA1 -s otpPolicyDigits=6 -s otpPolicyPeriod=30 -s otpPolicyLookAheadWindow=1 -s otpPolicyInitialCounter=0 -s otpPolicyCodeReusable=false
   * kcadm.sh update realms/Developer -s otpPolicyType=totp -s otpPolicyAlgorithm=HmacSHA1 -s otpPolicyDigits=6 -s otpPolicyPeriod=30 -s otpPolicyLookAheadWindow=1
   * kcadm.sh update realms/Vendor    -s otpPolicyType=totp -s otpPolicyAlgorithm=HmacSHA1 -s otpPolicyDigits=6 -s otpPolicyPeriod=30 -s otpPolicyLookAheadWindow=1
   */

  const progressPct = ((totpPeriodSeconds - secondsLeft) / totpPeriodSeconds) * 100;

  const containerAnimation = error ? 'animate-shake' : lastSuccessAt ? 'animate-pulse-fast' : '';

  return (
  <form onSubmit={handleSubmit(submit)} className={`space-y-6 ${containerAnimation}`} noValidate>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-600" />
          Two-Factor Authentication
        </h2>
        <p className="text-xs text-gray-600">Enter the 6-digit code from your authenticator app. This step keeps your account secure.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2" role="alert" aria-live="polite">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="text-xs text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">6-digit code</label>
        {/* Hidden consolidated input for accessibility + form linkage */}
        <input
          {...register('otp')}
          id="otp"
          type="text"
          inputMode="numeric"
          pattern="\\d{6}"
          aria-hidden="true"
          tabIndex={-1}
          className="sr-only"
          readOnly
          value={allJoined()}
        />
        <div className="flex items-center justify-between gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => {
            const stateClass = hasError
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : d
                ? 'border-green-300 focus:ring-gray-500 focus:border-green-500'
                : 'border-gray-500 focus:ring-gray-500 focus:border-gray-500';
            return (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                disabled={isLoading}
                aria-label={`2FA code digit ${i + 1} of 6`}
                className={`w-12 h-12 text-center text-lg font-semibold rounded-md border bg-white shadow-sm focus:outline-none transition-colors ${stateClass} disabled:bg-gray-50 disabled:cursor-not-allowed`}
                value={d}
                onChange={(e) => setDigit(i, e.target.value.replace(/\D/g,''))}
                onKeyDown={(e) => handleKey(e, i)}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{pasted ? 'Code pasted' : 'You can paste the full code.'}</span>
          <span className="text-gray-500">{secondsLeft}s left</span>
        </div>
        <div className="relative h-1 w-full bg-gray-200 rounded overflow-hidden" aria-hidden="true">
          <div className={`h-full ${secondsLeft <= 5 ? 'bg-red-500' : 'bg-green-500'} transition-all`} style={{ width: `${progressPct}%` }} />
        </div>
        {secondsLeft <= 5 && (
          <div className="text-[10px] mt-1 text-amber-600 flex items-center gap-1" role="status" aria-live="polite">
            {secondsLeft <= 2 && ready
              ? 'Code about to roll over — submitting right after refresh...'
              : 'Code window expiring soon'}
          </div>
        )}
        {hasError && <div className="text-[10px] mt-1 text-red-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {errors.otp?.message}</div>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-medium text-gray-500 hover:text-gray-700 focus:outline-none"
          disabled={isLoading}
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          {onResendCode && (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading || resendLoading || !canResendCode}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {resendLoading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Resend Code
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !ready}
            className="inline-flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || autoSubmitting ? (<><Loader2 className="animate-spin h-5 w-5" /><span>Verifying...</span></>) : 'Verify'}
          </button>
        </div>
      </div>
      
      {resendSuccess && (
        <div className="text-[10px] text-green-600 text-center">
          Code resent successfully. Check your authenticator app.
        </div>
      )}
      
      <div className="text-[10px] text-gray-500 text-center space-y-1">
        <p>Lost access to your 2FA device? Contact support.</p>
        <p className="text-gray-400">Time-based codes refresh every {totpPeriodSeconds} seconds</p>
      </div>
    </form>
  );
};