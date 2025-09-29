"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, BarChart3, Users, Shield } from 'lucide-react';
import { authenticateWithPassword, initializeKeycloak, isAuthenticated } from '@/services/keycloak';
import { AppError } from '@/lib/errors';

// Shared Form Component
const AuthForm = ({ 
  email,
  setEmail,
  password,
  setPassword,
  onSignIn, 
  onForgotPassword, 
  onSignUp, 
  isLoading, 
  error,
  successMessage,
  showPasswordFields = true,
  showForgotPassword = true,
  showSignUp = true,
  submitButtonText = "Sign In",
  submitButtonColor = "green"
}: { 
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  onSignIn: (email: string, password: string) => void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  isLoading: boolean;
  error: string | null;
  successMessage?: string | null;
  showPasswordFields?: boolean;
  showForgotPassword?: boolean;
  showSignUp?: boolean;
  submitButtonText?: string;
  submitButtonColor?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    if (!email || (showPasswordFields && !password)) return;
    onSignIn(email, password);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignIn();
    }
  };

  const getButtonColorClasses = () => {
    switch (submitButtonColor) {
      case 'gray':
        return 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-500';
      case 'green':
      default:
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="ml-3 text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="you@example.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Password Field */}
      {showPasswordFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Link */}
      {showForgotPassword && onForgotPassword && (
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Forgot password?
          </button>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSignIn}
        disabled={isLoading || !email || (showPasswordFields && !password)}
        className={`w-full ${getButtonColorClasses()} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {submitButtonText === "Sign In" ? "Signing In..." : "Loading..."}
          </div>
        ) : (
          submitButtonText
        )}
      </button>

      {/* Sign Up Link */}
      {showSignUp && onSignUp && (
        <div className="text-center">
          <span className="text-gray-600 text-sm">Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={onSignUp}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Sign up
          </button>
        </div>
      )}
    </div>
  );
};

const TabSwitcher = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
  <div className="flex bg-gray-100 rounded-xl p-1">
    <button
      onClick={() => onTabChange('customers')}
      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
        activeTab === 'customers'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      For Customers
    </button>
    <button
      onClick={() => onTabChange('developers')}
      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
        activeTab === 'developers'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      For Developers
    </button>
  </div>
);

const FeatureList = () => (
  <div className="space-y-6 mb-8">
    <div className="flex items-start space-x-4">
      <div className="bg-green-500 rounded-lg p-2">
        <BarChart3 className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Advanced Analytics</h3>
        <p className="text-green-100">Deep insights into your evaluation metrics</p>
      </div>
    </div>

    <div className="flex items-start space-x-4">
      <div className="bg-green-500 rounded-lg p-2">
        <Users className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Team Collaboration</h3>
        <p className="text-green-100">Work together on evaluation projects</p>
      </div>
    </div>

    <div className="flex items-start space-x-4">
      <div className="bg-green-500 rounded-lg p-2">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">Enterprise Security</h3>
        <p className="text-green-100">Bank-grade security for your data</p>
      </div>
    </div>
  </div>
);

const Testimonial = () => (
  <div className="bg-green-500 rounded-2xl p-6">
    <div className="flex items-center mb-3">
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="w-4 h-4 bg-yellow-400 rounded-full"></div>
        ))}
      </div>
      <span className="ml-2 font-semibold">5.0</span>
    </div>
    <blockquote className="text-green-50 italic mb-3">
      &quot;CrowdEval let us integrate evaluation directly into CI. Our models ship faster and break less.&quot;
    </blockquote>
    <cite className="text-green-100 font-medium">— Sarah Chen, Product Manager</cite>
  </div>
);

const CustomerSignIn = ({ 
  onSignIn, 
  onForgotPassword, 
  onSignUp, 
  isLoading, 
  error,
  successMessage
}: { 
  onSignIn: (email: string, password: string) => void, 
  onForgotPassword: () => void, 
  onSignUp: () => void,
  isLoading: boolean,
  error: string | null,
  successMessage: string | null
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md mx-auto w-full">
      <AuthForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSignIn={onSignIn}
        onForgotPassword={onForgotPassword}
        onSignUp={onSignUp}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
        showPasswordFields={true}
        showForgotPassword={true}
        showSignUp={true}
        submitButtonText="Sign In"
        submitButtonColor="green"
      />
    </div>
  );
};

const DeveloperSignIn = ({ 
  onSignIn,
  onSignUp,
  isLoading,
  error,
  successMessage
}: { 
  onSignIn: (email: string, password: string) => void,
  onSignUp?: () => void,
  isLoading: boolean,
  error: string | null,
  successMessage: string | null
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Developer Access</h3>
        <p className="text-gray-600 mb-6">Access our API and developer tools</p>
      </div>
      
      <AuthForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        isLoading={isLoading}
        error={error}
        successMessage={successMessage}
        showPasswordFields={true}
        showForgotPassword={false}
        showSignUp={!!onSignUp}
        submitButtonText="Continue with Developer Access"
        submitButtonColor="gray"
      />
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('customers');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize authentication and check user status
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        
        // Set active tab from URL
        const tab = searchParams?.get('tab');
        if (tab === 'developers') setActiveTab('developers');

        // Check if user is already authenticated
        if (isAuthenticated()) {
          const returnTo = searchParams?.get('returnTo') || '/projects';
          router.push(returnTo);
          return;
        }

        // Initialize Keycloak if needed
        await initializeKeycloak();
        
      } catch (error) {
        console.error('Initialization error:', error);
        setError('Authentication service is temporarily unavailable. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [router, searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
    const newUrl = tab === 'developers' ? '/developer/signin' : '/signin';
    window.history.pushState({}, '', newUrl);
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await authenticateWithPassword(email, password, activeTab === 'developers' ? 'developers' : 'customers');
      setSuccessMessage('Login successful! Redirecting...');
      
      const returnTo = searchParams?.get('returnTo') || '/projects';
      setTimeout(() => router.push(returnTo), 1500);

    } catch (err: unknown) {
      if (err instanceof AppError) {
        // Provide more specific error messages
        if (err.message.includes('Network error')) {
          setError('Network error occurred during login. Please check:' +
            '\n1. Keycloak server is running' +
            '\n2. Environment variables are correctly configured' +
            '\n3. Your internet connection is stable' +
            '\n4. CORS is properly configured in Keycloak');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Authentication failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // Implement Keycloak password reset flow
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  if (isInitializing) {
    return <LoadingOverlay />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            {/* Left Panel - Sign In Form */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Jupilens</h1>
                <p className="text-gray-600">Welcome back! Please sign in to continue</p>
              </div>

              {/* Tab Switcher */}
              <div className="mb-8">
                <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} />
              </div>

              {/* Sign In Forms */}
              {activeTab === 'customers' ? (
                <CustomerSignIn
                  onSignIn={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  onSignUp={handleSignUp}
                  isLoading={isLoading}
                  error={error}
                  successMessage={successMessage}
                />
              ) : (
                <DeveloperSignIn
                  onSignIn={handleLogin}
                  onSignUp={handleSignUp}
                  isLoading={isLoading}
                  error={error}
                  successMessage={successMessage}
                />
              )}
            </div>

            {/* Right Panel - Features */}
            <div className="bg-green-600 p-8 lg:p-12 flex flex-col justify-center text-white">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold mb-4">Powerful Evaluation Platform</h2>
                <p className="text-green-100 text-lg mb-8 leading-relaxed">
                  Transform your evaluation process with our comprehensive analytics and collaboration tools.
                </p>

                <FeatureList />
                <Testimonial />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
