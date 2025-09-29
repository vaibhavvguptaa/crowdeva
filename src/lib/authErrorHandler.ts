import { AppError } from '@/lib/errors';
import { logError, logWarn, logSecurityEvent } from '@/lib/logger';
import ErrorAnalytics, { trackAuthError, trackNetworkError, trackValidationError } from '@/lib/errorAnalytics';

export interface ErrorState {
  message: string;
  type: 'validation' | 'authentication' | 'network' | 'unknown';
  field?: string;
  code?: string;
  recoveryAction?: string;
  canRetry?: boolean;
}

export class AuthErrorHandler {
  static handleError(error: unknown, context?: Record<string, any>): ErrorState {
    if (error instanceof AppError) {
      logWarn('Authentication app error', { 
        error: error.message, 
        type: 'authentication',
        ...context 
      });
      
      // Track authentication error
      trackAuthError(error.message, { statusCode: error.statusCode, ...context });
      
      return {
        message: error.message,
        type: 'authentication',
        code: 'AUTH_ERROR',
        canRetry: error.statusCode !== 401,
      };
    }

    if (error instanceof Error) {
      // Log the error with context
      logError('Authentication error', error, context);

      // CSRF/Session errors
      if (error.message.includes('CSRF') || error.message.includes('Session expired') || error.message.includes('Invalid CSRF token')) {
        const csrfError = 'Your session has expired. Please refresh the page and try again.';
        trackAuthError(error.message, { errorType: 'csrf_error', ...context });
        return {
          message: csrfError,
          type: 'authentication',
          code: 'SESSION_EXPIRED',
          canRetry: false,
          recoveryAction: 'Refresh the page and try again',
        };
      }

      // Network/connectivity errors
      if (error.message.includes('fetch') || 
          error.message.includes('Network') || 
          error.message.includes('Failed to fetch') ||
          error.message.toLowerCase().includes('connection')) {
        const networkError = 'Unable to connect to authentication service. Please check your internet connection and try again.';
        trackNetworkError(error.message, context?.component || 'auth', { originalError: error.message });
        return {
          message: networkError,
          type: 'network',
          code: 'NETWORK_ERROR',
          canRetry: true,
          recoveryAction: 'Check your internet connection and try again',
        };
      }

      // Server errors
      if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        const serverError = 'Authentication service is temporarily unavailable. Please try again in a few moments.';
        trackNetworkError(error.message, context?.component || 'auth', { errorType: 'server_error' });
        return {
          message: serverError,
          type: 'network',
          code: 'SERVER_ERROR',
          canRetry: true,
          recoveryAction: 'Wait a few moments and try again',
        };
      }

      // Timeout errors
      if (error.message.includes('timeout') || error.message.includes('AbortError')) {
        const timeoutError = 'Authentication request timed out. Please try again.';
        trackNetworkError(error.message, context?.component || 'auth', { errorType: 'timeout' });
        return {
          message: timeoutError,
          type: 'network',
          code: 'TIMEOUT_ERROR',
          canRetry: true,
          recoveryAction: 'Try again with a stable connection',
        };
      }

      // Rate limiting
      if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
        const rateLimitError = 'Too many login attempts. Please wait a few minutes before trying again.';
        trackAuthError(error.message, { errorType: 'rate_limit', ...context });
        return {
          message: rateLimitError,
          type: 'authentication',
          code: 'RATE_LIMIT',
          canRetry: false,
          recoveryAction: 'Wait 5-10 minutes before trying again',
        };
      }

      // Account locked/disabled
      if (error.message.includes('account_disabled') || error.message.includes('locked')) {
        const accountError = 'Your account has been temporarily locked. Please contact support for assistance.';
        trackAuthError(error.message, { errorType: 'account_locked', ...context });
        return {
          message: accountError,
          type: 'authentication',
          code: 'ACCOUNT_LOCKED',
          canRetry: false,
          recoveryAction: 'Contact support for assistance',
        };
      }

      // Validation errors
      if (error.message.includes('email') || error.message.includes('password')) {
        trackValidationError(error.message, context?.component || 'auth', error.message.includes('email') ? 'email' : 'password');
        return {
          message: error.message,
          type: 'validation',
          code: 'VALIDATION_ERROR',
          canRetry: true,
          recoveryAction: 'Check your input and try again',
        };
      }

      // OTP / 2FA specific errors
      if (/(otp|totp|2fa)/i.test(error.message)) {
        const msg = /invalid|incorrect|expired/i.test(error.message)
          ? 'Invalid or expired 2FA code. Please try again.'
          : 'Two-factor authentication code required.';
        trackAuthError(error.message, { errorType: 'otp', ...context });
        return {
            message: msg,
            type: 'authentication',
            code: 'OTP_ERROR',
            canRetry: true,
            recoveryAction: 'Open your authenticator app and enter the newest code',
        };
      }

      // Check for potential security issues
      if (error.message.includes('CORS') || error.message.includes('blocked')) {
        logSecurityEvent('CORS or blocking error detected', {
          error: error.message,
          ...context
        });
        
        trackNetworkError(error.message, context?.component || 'auth', { errorType: 'cors_error' });
        
        return {
          message: 'Authentication service configuration error. Please contact support.',
          type: 'network',
          code: 'CORS_ERROR',
          canRetry: false,
          recoveryAction: 'Contact support for assistance',
        };
      }

      // Generic error tracking
      ErrorAnalytics.trackError(error.message, 'unknown', context?.component || 'auth', context);

      return {
        message: error.message,
        type: 'unknown',
        code: 'UNKNOWN_ERROR',
        canRetry: true,
      };
    }

    // Log unknown errors
    logError('Unknown authentication error', new Error(String(error)), context);
    
    // Track unknown error
    ErrorAnalytics.trackError(String(error), 'unknown', context?.component || 'auth', context);

    return {
      message: 'An unexpected error occurred. Please try again. If the problem persists, contact support.',
      type: 'unknown',
      code: 'UNKNOWN_ERROR',
      canRetry: true,
      recoveryAction: 'Try again or contact support if the issue persists',
    };
  }

  static validateEmail(email: string): ErrorState | null {
    if (!email) {
      return {
        message: 'Email is required',
        type: 'validation',
        field: 'email',
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logWarn('Invalid email format attempted', { email: email.substring(0, 3) + '***' });
      return {
        message: 'Please enter a valid email address',
        type: 'validation',
        field: 'email',
      };
    }

    return null;
  }

  static validatePassword(password: string): ErrorState | null {
    if (!password) {
      return {
        message: 'Password is required',
        type: 'validation',
        field: 'password',
      };
    }

    if (password.length < 8) {
      return {
        message: 'Password must be at least 8 characters long',
        type: 'validation',
        field: 'password',
      };
    }

    return null;
  }

  static validateForm(email: string, password: string): ErrorState | null {
    const emailError = this.validateEmail(email);
    if (emailError) return emailError;

    const passwordError = this.validatePassword(password);
    if (passwordError) return passwordError;

    return null;
  }
}
