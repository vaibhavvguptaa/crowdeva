"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthenticationError } from '@/lib/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log the error
    console.error('Auth Error Boundary caught an error:', error, errorInfo);

    // Handle authentication errors specially
    if (error instanceof AuthenticationError) {
      // Clear auth state and redirect to signin
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kc-token');
        localStorage.removeItem('kc-refresh-token');
        localStorage.removeItem('authType');
        localStorage.removeItem('userData');
        localStorage.removeItem('userId');
        window.location.href = '/signin';
      }
    }
  }

  handleRetry = () => {
    // Clear any auth state before retrying
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kc-token');
      localStorage.removeItem('kc-refresh-token');
      localStorage.removeItem('authType');
      localStorage.removeItem('userData');
      localStorage.removeItem('userId');
      
      // Clear cookies
      document.cookie = 'kc-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'authType=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.cookie = 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 text-center">
                {this.state.error instanceof AuthenticationError
                  ? 'Authentication failed. Please sign in again.'
                  : 'An unexpected error occurred. Please try refreshing the page or signing in again.'}
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-green-600 text-white text-sm font-medium py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={() => {
                  // Clear auth state before redirecting
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('kc-token');
                    localStorage.removeItem('kc-refresh-token');
                    localStorage.removeItem('authType');
                    localStorage.removeItem('userData');
                    localStorage.removeItem('userId');
                    
                    // Clear cookies
                    document.cookie = 'kc-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    document.cookie = 'authType=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    document.cookie = 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    
                    window.location.href = '/signin';
                  }
                }}
                className="w-full bg-gray-100 text-gray-700 text-sm font-medium py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { AuthErrorBoundary };