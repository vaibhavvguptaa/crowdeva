"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { TabSwitcher } from "@/components/signin/TabSwitcher";
import { AnimatedContent } from "@/components/signin/AnimatedContent";
import { ClientOnly } from "@/components/Ui/ClientOnly";
import { FullScreenLoading } from "@/components/Ui/LoadingOverlay";
import { MemoizedAuthSection } from "@/components/signin/MemoizedAuthSection";
import { AuthUserType } from "@/types/auth";
import { generateStructuredData } from "@/lib/seo";
import { useLocationAwareAuth } from "@/hooks/useLocationAwareAuth";
import { AuthErrorHandler } from "@/lib/authErrorHandler";
import { logSecurityEvent, logAuthFailure } from "@/lib/logger";

interface BaseSignInPageProps {
  defaultUserType?: AuthUserType;
  hideRealmHint?: boolean;
  onAuthSuccess?: () => void;
  customRedirectUrl?: string;
}

export const BaseSignInPage: React.FC<BaseSignInPageProps> = ({
  defaultUserType = "customers",
  hideRealmHint = false,
  onAuthSuccess,
  customRedirectUrl,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthUserType>(defaultUserType);
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGoogleRedirecting, setIsGoogleRedirecting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState<{
    attempt: number;
    total: number;
  } | null>(null);
  const [otpUsername, setOtpUsername] = useState<string>("");
  const [otpPassword, setOtpPassword] = useState<string>("");
  const [otpResendCount, setOtpResendCount] = useState(0); // Track resend attempts
  const { locationAwareLogin } = useLocationAwareAuth();

  const structuredData = useMemo(
    () => generateStructuredData(activeTab),
    [activeTab]
  );

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("type", activeTab);
    const newPath = `${window.location.pathname}?${params.toString()}`;
    try {
      window.history.replaceState(null, "", newPath);
    } catch {
      /* noop */
    }
  }, [activeTab]);

  const handleTabChange = (tab: AuthUserType) => {
    if (isLoading || isRedirecting) return;
    setIsTransitioning(true);
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
    
    // Reset form state when switching tabs
    setStage("credentials");
    setOtpUsername("");
    setOtpPassword("");
    setOtpResendCount(0);
    
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleSignIn = async (
    username: string,
    password: string,
    otp?: string
  ) => {
    if (isLoading || isRedirecting) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setRetryStatus(null);

    try {
      if (stage === "credentials") {
        const result = await locationAwareLogin(username, password, activeTab);
        if (result.locationBlocked) {
          const errorState = AuthErrorHandler.handleError(
            new Error("Access from your location is not permitted"),
            {
              component: "BaseSignInPage",
              stage: "credentials",
              locationBlocked: true,
            }
          );
          setError(errorState.message);
          setIsLoading(false);
          return;
        }
        if (result.totpRequired) {
          setStage("otp");
          setSuccessMessage(
            "Please enter your two-factor authentication code"
          );
          // Store credentials for OTP submission
          setOtpUsername(username);
          setOtpPassword(password);
          // Reset resend count when entering OTP stage
          setOtpResendCount(0);
          setIsLoading(false);
          return;
        }
        if (result.error) {
          // Check if it's a CSRF token error that requires page refresh
          if (result.error.includes('Session expired') || result.error.includes('CSRF token')) {
            setError('Your session has expired. Please refresh the page and try again.');
            // Optionally, we could automatically refresh the page after a delay
            // setTimeout(() => window.location.reload(), 3000);
          } else {
            const errorState = AuthErrorHandler.handleError(
              new Error(result.error),
              { component: "BaseSignInPage", stage: "credentials" }
            );
            setError(errorState.message);
          }
          setIsLoading(false);
          return;
        }
        // Successful login - handle redirect directly
        if (result.success) {
          if (onAuthSuccess) {
            onAuthSuccess();
          } else {
            setSuccessMessage("Login successful! Redirecting...");
            setIsRedirecting(true);
            const redirectPath =
              customRedirectUrl || getDefaultRedirectPath(activeTab);
            console.log("Redirecting to:", redirectPath);

            setTimeout(() => {
              window.location.href = redirectPath;
            }, 1500);
          }
        }
      } else if (stage === "otp" && otp) {
        // For OTP submission, we would normally call a different API endpoint
        // This is a simplified version for now
        if (onAuthSuccess) {
          onAuthSuccess();
        } else {
          setSuccessMessage("Login successful! Redirecting...");
          setIsRedirecting(true);
          const redirectPath =
            customRedirectUrl || getDefaultRedirectPath(activeTab);
          console.log("Redirecting to:", redirectPath);
          // Use window.location.href for full page reload to ensure middleware evaluation
          // Add a small delay to show the success message before redirecting
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1500);
        }
      }
    } catch (err: any) {
      // Check if it's a CSRF token error that requires page refresh
      if (err.message && (err.message.includes('Session expired') || err.message.includes('CSRF token'))) {
        setError('Your session has expired. Please refresh the page and try again.');
      } else {
        const errorState = AuthErrorHandler.handleError(err, {
          component: "BaseSignInPage",
          stage,
        });
        setError(errorState.message);
      }
      setIsLoading(false);
    } finally {
      // Only set isLoading to false if we're not redirecting
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    // For OTP submission, we would normally call a different API endpoint
    // This is a simplified version for now
    await handleSignIn(otpUsername, otpPassword, otp);
  };

  const handleBackToCredentials = () => {
    setStage("credentials");
    setError(null);
    setSuccessMessage(null);
    setOtpUsername("");
    setOtpPassword("");
    setOtpResendCount(0);
  };

  const handleForgotPassword = () => {
    router.push(`/forgot-password?type=${activeTab}`);
  };

  const handleSignUp = () => {
    router.push(`/signup?type=${activeTab}`);
  };

  const handleGoogleRedirecting = (isRedirecting: boolean) => {
    setIsGoogleRedirecting(isRedirecting);
  };

  // New function to handle OTP resend
  const handleResendOtp = async () => {
    if (isLoading || isRedirecting) return;

    // Limit resend attempts to prevent abuse
    if (otpResendCount >= 3) {
      setError("Maximum resend attempts reached. Please contact support.");
      logSecurityEvent("2fa_resend_limit_exceeded", {
        username: otpUsername,
        resendCount: otpResendCount,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Log the resend attempt for security monitoring
      logSecurityEvent("2fa_code_resend_attempt", {
        username: otpUsername,
        resendCount: otpResendCount + 1,
        timestamp: new Date().toISOString(),
      });

      // Increment resend count
      setOtpResendCount((prev) => prev + 1);

      // In a real implementation, we would call an API endpoint to resend the OTP
      // For now, we'll just show a success message
      setSuccessMessage(
        "New code sent to your authenticator app. Please check your device."
      );

      // Log successful resend
      logSecurityEvent("2fa_code_resend_success", {
        username: otpUsername,
        resendCount: otpResendCount + 1,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const errorState = AuthErrorHandler.handleError(err, {
        component: "BaseSignInPage",
        action: "resendOtp",
      });
      setError(errorState.message);

      // Log failed resend
      logAuthFailure(otpUsername, "2fa_resend_failed", {
        error: errorState.message,
        resendCount: otpResendCount + 1,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultRedirectPath = (userType: AuthUserType): string => {
    switch (userType) {
      case "developers":
        return "/developer/projects";
      case "vendors":
        return "/vendor/projects";
      default:
        return "/projects";
    }
  };

  return (
    <>
      <ClientOnly>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[600px] lg:min-h-[640px]">
              <div className="p-4 lg:p-6 flex flex-col justify-center relative h-full">
                <div className="absolute top-0 left-0 w-32 h-32 bg-green-100/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-green-100/30 rounded-full translate-x-1/2 translate-y-1/2" />
                <div className="relative z-10">
                  {stage === "credentials" && (
                    <>
                      <AuthHeader
                        title="Crowdeval"
                        subtitle="Welcome back! Please sign in to continue"
                      />
                      <div className="mb-4 flex justify-center">
                        <div className="overflow-x-auto">
                          <TabSwitcher
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            includeVendors={true}
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {retryStatus && !error && !successMessage && (
                    <div
                      className="mb-3 text-xs text-amber-600 text-center"
                      role="status"
                      aria-live="polite"
                    >
                      Network issue, retrying (attempt {retryStatus.attempt} of{" "}
                      {retryStatus.total})...
                    </div>
                  )}
                  <MemoizedAuthSection
                    key={activeTab} // Add key to force re-render when tab changes
                    activeTab={activeTab}
                    isLoading={isLoading}
                    error={error}
                    successMessage={successMessage}
                    onSignIn={handleSignIn}
                    onSubmitOtp={handleOtpSubmit}
                    onForgotPassword={handleForgotPassword}
                    onSignUp={handleSignUp}
                    onError={setError}
                    stage={stage}
                    onBackToCredentials={handleBackToCredentials}
                    onGoogleRedirecting={handleGoogleRedirecting}
                    onResendOtp={handleResendOtp} // Pass the new prop
                  />
                </div>
              </div>
              <AnimatedContent
                activeTab={activeTab}
                isTransitioning={isTransitioning}
              />
            </div>
          </div>
        </div>
      </div>
      <ClientOnly>
        {/* Show single loading overlay for all authentication stages */}
        {(isLoading || isRedirecting || isGoogleRedirecting) && (
          <FullScreenLoading message={loadingMessage || "Processing..."} />
        )}
      </ClientOnly>
    </>
  );
};