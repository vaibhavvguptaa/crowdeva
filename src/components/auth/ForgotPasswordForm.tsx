"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Loader2, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
	email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
	onBack: () => void;
	/** Realm / auth user type (customers | developers | vendors) */
	userType: string;
	/** Callback fired when request is successfully initiated (regardless of whether account exists) */
	onSuccess?: (email: string) => void;
	/** Override default success message copy */
	successMessageOverride?: string;
	/** Override default generic error message */
	errorMessageOverride?: string;
	/** Optional custom heading text (defaults handled by parent AuthHeader) */
	heading?: string;
	/** Disable the small realm hint footer */
	hideRealmHint?: boolean;
	/** If provided, prevents submission while true (e.g. external global loading) */
	externallyDisabled?: boolean;
	/** Add a test id prefix for easier e2e selection */
	testIdPrefix?: string;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
	onBack,
	userType,
	onSuccess,
	successMessageOverride,
	errorMessageOverride,
	heading,
	hideRealmHint,
	externallyDisabled,
	testIdPrefix = 'forgot-password'
}) => {
		const { register, handleSubmit, formState: { errors, isValid, isSubmitted }, watch } = useForm<ForgotPasswordData>({
		resolver: zodResolver(forgotPasswordSchema),
		mode: 'onChange',
		defaultValues: { email: '' },
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [csrfToken, setCsrfToken] = useState<string | null>(null);
	// simple local cooldown to avoid spamming (UI only; server still rate-limits)
	const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
	const emailVal = watch('email');

	useEffect(() => { if (errorMessage) setErrorMessage(null); }, [emailVal]);

	const remainingCooldownMs = cooldownEndsAt ? Math.max(0, cooldownEndsAt - Date.now()) : 0;
	const cooldownSeconds = Math.ceil(remainingCooldownMs / 1000);

	// Prefetch CSRF token once (mirrors registration flow) – silently ignore errors
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				console.log('Fetching CSRF token for forgot password form');
				const res = await fetch('/api/auth/csrf-token', { 
					credentials: 'include',
					mode: 'cors'
				});
				console.log('CSRF token response status:', res.status);
				if (!res.ok) {
					console.warn('Failed to fetch CSRF token, status:', res.status);
					return;
				}
				const json = await res.json().catch(() => ({}));
				console.log('CSRF token response data:', json);
				if (!cancelled && json?.csrfToken) {
					setCsrfToken(json.csrfToken);
					console.log('CSRF token fetched successfully:', json.csrfToken);
				}
			} catch (error) {
				console.warn('Failed to fetch CSRF token:', error);
			}
		})();
		return () => { cancelled = true; };
	}, []);

	const onSubmit = async (data: ForgotPasswordData) => {
		if (remainingCooldownMs > 0) return; // guard
		setIsSubmitting(true);
		setSuccessMessage(null);
		setErrorMessage(null);
		try {
			console.log('Submitting forgot password request with CSRF token:', csrfToken);
			console.log('User type:', userType);
			console.log('Email:', data.email);
			
			const resp = await fetch(`/api/auth/forgot-password?type=${encodeURIComponent(userType)}` , {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json', 
					...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) 
				},
				body: JSON.stringify({ email: data.email }),
				credentials: 'include',
				mode: 'cors'
			});
			
			console.log('Forgot password response status:', resp.status);
			console.log('Response headers:', [...resp.headers.entries()]);
			
			const json = await resp.json().catch(() => ({}));
			console.log('Forgot password response:', resp.status, json);
			
			if (resp.ok) {
				setSuccessMessage(successMessageOverride || 'If an account exists for this email, password reset instructions were sent.');
				onSuccess?.(data.email);
				// set a brief 30s cooldown after successful submission to discourage repeated requests
				setCooldownEndsAt(Date.now() + 30_000);
			} else {
				const apiMsg = json?.message || json?.error;
				console.log('API error message:', apiMsg);
				setErrorMessage(apiMsg || errorMessageOverride || 'Unable to process request. Please try again.');
				// if rate limited include client-visible cooldown from server Retry-After header
				const retryAfter = Number(resp.headers.get('Retry-After'));
				if (!Number.isNaN(retryAfter) && retryAfter > 0) {
					setCooldownEndsAt(Date.now() + retryAfter * 1000);
				}
				
				// If it's a CSRF error, try to refresh the token
				if (resp.status === 403 && (!apiMsg || apiMsg.includes('CSRF'))) {
					console.log('CSRF error detected, refreshing token');
					const res = await fetch('/api/auth/csrf-token', { 
						credentials: 'include',
						mode: 'cors'
					});
					if (res.ok) {
						const json = await res.json().catch(() => ({}));
						if (json?.csrfToken) {
							setCsrfToken(json.csrfToken);
							console.log('New CSRF token fetched:', json.csrfToken);
						}
					}
				}
			}
		} catch (e) {
			console.error('Forgot password request failed:', e);
			setErrorMessage(errorMessageOverride || 'Unable to process request. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

		// Suppress field error display until user attempts submit
		const fieldErr = isSubmitted ? errors.email?.message : undefined;

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 relative" data-testid={`${testIdPrefix}-form`}>
			<div className="flex items-center gap-2 mb-2">
				<button type="button" onClick={onBack} className="inline-flex items-center text-xs font-medium text-green-600 hover:text-green-700 focus:outline-none" data-testid={`${testIdPrefix}-back`}>
					<ArrowLeft className="w-4 h-4 mr-1" /> Back to sign in
				</button>
			</div>

			{heading && <h2 className="text-lg font-semibold text-gray-800" data-testid={`${testIdPrefix}-heading`}>{heading}</h2>}

			{successMessage && (
				<div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-start gap-2" role="status" aria-live="polite">
					<ShieldCheck className="h-4 w-4 text-green-600 mt-0.5" />
					<p className="text-xs text-green-700">{successMessage}</p>
				</div>
			)}
			{errorMessage && (
				<div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2" role="alert" aria-live="assertive">
					<AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
					<p className="text-xs text-red-700">{errorMessage}</p>
				</div>
			)}

			<div className="space-y-1" data-testid={`${testIdPrefix}-email-field`}>
				<label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
				<div className="relative rounded-md shadow-sm focus-within:ring-2 focus-within:ring-gray-500 focus-within:ring-opacity-50">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Mail className="h-5 w-5 text-gray-400" />
					</div>
					<input
						{...register('email')}
						id="email"
						type="email"
						autoComplete="username"
						disabled={isSubmitting || externallyDisabled}
						aria-invalid={!!fieldErr}
						aria-describedby={fieldErr ? 'email-reset-error' : undefined}
						className={`block w-full pl-10 pr-3 py-3 border rounded-md bg-white text-gray-900 text-sm disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors ${fieldErr ? 'border-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:border-gray-500'}`}
						placeholder="you@example.com" />
				</div>
				{fieldErr && <p id="email-reset-error" className="text-xs text-red-600 flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{fieldErr}</p>}
			</div>

			<p className="text-[11px] text-gray-500 leading-relaxed">
				Enter the email associated with your account and we'll send instructions to reset your password.
				For security reasons, we won't indicate whether an account exists for the provided email.
			</p>

			<button
				type="submit"
				disabled={isSubmitting || !isValid || externallyDisabled || remainingCooldownMs > 0}
				className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none cursor-pointer transition-colors"
				data-testid={`${testIdPrefix}-submit`}
			>
				{isSubmitting ? (<><Loader2 className="h-5 w-5 animate-spin" /><span>Sending...</span></>) : remainingCooldownMs > 0 ? `Wait ${cooldownSeconds}s` : 'Send reset link'}
			</button>

			{/* Optional realm context hint */}
			{!hideRealmHint && (
				<div className="text-[10px] text-gray-400 text-center" data-testid={`${testIdPrefix}-realm-hint`}>Requesting reset for: <span className="font-medium text-gray-600 capitalize">{userType}</span> realm</div>
			)}
			{remainingCooldownMs > 0 && (
				<div className="text-[10px] text-gray-400 text-center" data-testid={`${testIdPrefix}-cooldown-hint`}>You can request another link in {cooldownSeconds}s</div>
			)}
		</form>
	);
};

ForgotPasswordForm.displayName = 'ForgotPasswordForm';

