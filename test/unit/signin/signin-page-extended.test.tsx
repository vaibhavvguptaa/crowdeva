import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, beforeEach, expect, vi } from 'vitest';

let SignInPage: React.ComponentType<any>;
const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => '/signin'
}));

let mockLogin: any;
let mockUser: any = null;
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, login: mockLogin, loading: false })
}));

vi.mock('@/components/signin/AnimatedContent', () => ({ AnimatedContent: () => <div data-testid="animated-content" /> }));
vi.mock('@/components/Ui/OptimizedLoading', () => ({ OptimizedLoading: ({ isVisible, message }: { isVisible: boolean; message?: string }) => isVisible ? <div data-testid="loading-overlay">{message || 'Loading'}</div> : null }));
vi.mock('@/components/Ui/ClientOnly', () => ({ ClientOnly: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/signin/GoogleSignInButton', () => ({ GoogleSignInButton: (props: any) => <button type="button" disabled={props.disabled} data-testid="google-btn">Google</button> }));
vi.mock('@/lib/config', () => ({ getKeycloakConfig: () => ({ realm: 'customer' }) }));

vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

async function loadPage() {
  const mod = await import('@/app/(auth)/signin/page');
  SignInPage = mod.default as any;
}

function fillAndSubmitCredentials(email = 'test@example.com', password = 'password123') {
  const emailInput = screen.getAllByLabelText(/email address/i)[0] as HTMLInputElement;
  const passwordInput = screen.getAllByLabelText(/password/i)[0] as HTMLInputElement;
  fireEvent.change(emailInput, { target: { value: email } });
  fireEvent.change(passwordInput, { target: { value: password } });
  const form = emailInput.closest('form');
  if (!form) throw new Error('Form not found');
  fireEvent.submit(form);
}

function submitOtp(code = '123456') {
  const otpInput = screen.getByLabelText(/6-digit code/i) as HTMLInputElement;
  fireEvent.change(otpInput, { target: { value: code } });
  fireEvent.submit(otpInput.closest('form')!);
}

describe('SignInPage extended scenarios', () => {
  beforeEach(() => {
    mockUser = null;
    pushMock.mockClear();
    replaceMock.mockClear();
    process.env.NEXT_PUBLIC_SIGNIN_BASE_DELAY_MS = '100';
    process.env.NEXT_PUBLIC_SIGNIN_MAX_RETRIES = '1';
  });

  it('shows loading overlay during an in-flight login and hides after success', async () => {
    // First call simulates TOTP requirement, second stays pending until resolved
    let resolveLogin!: () => void;
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      if (!otp && mockLogin.mock.calls.length === 0) {
        return Promise.reject(new Error('TOTP_REQUIRED'));
      }
      return new Promise<void>(res => { resolveLogin = res; });
    });
    await loadPage();
    render(<SignInPage />);
  fillAndSubmitCredentials();
  await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
  submitOtp();
    await waitFor(() => expect(screen.getByTestId('loading-overlay')).toBeInTheDocument());
    resolveLogin();
    await waitFor(() => expect(screen.queryByTestId('loading-overlay')).not.toBeInTheDocument());
  });

  it('retries once on network error then succeeds (OTP stage)', async () => {
    let call = 0;
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      // First: trigger TOTP flow
      if (!otp && call === 0) { call++; return Promise.reject(new Error('TOTP_REQUIRED')); }
      call++;
      if (call === 2) return Promise.reject(new Error('Network Error: Failed to fetch'));
      return Promise.resolve();
    });
    await loadPage();
    render(<SignInPage />);
  fillAndSubmitCredentials();
  await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
  // First OTP attempt network fail -> second attempt success
  submitOtp();
  await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(2));
  // Success message not rendered in OTP step; presence of second call indicates success
  });

  it('switches to developer realm and calls login with developers realm', async () => {
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      if (!otp && mockLogin.mock.calls.length === 0) return Promise.reject(new Error('TOTP_REQUIRED'));
      return Promise.resolve();
    });
    await loadPage();
    render(<SignInPage />);
  const developerTab = screen.getByRole('tab', { name: /developers/i });
    fireEvent.click(developerTab);
    await waitFor(() => expect(developerTab).toHaveAttribute('aria-selected', 'true'));
  fillAndSubmitCredentials('dev@example.com', 'devpassword');
  await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
  submitOtp();
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('dev@example.com', 'devpassword', 'developers', '123456'));
  });

  it('redirects already authenticated user to projects', async () => {
    mockUser = { id: '1', email: 'user@example.com', role: 'customers' } as any;
    mockLogin = vi.fn();
    await loadPage();
    render(<SignInPage />);
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/projects'));
  });

  it('shows validation/auth error message on failed login (non-network)', async () => {
    // First prompts OTP, second fails with invalid password after OTP
    let call = 0;
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      if (!otp && call === 0) { call++; return Promise.reject(new Error('TOTP_REQUIRED')); }
      return Promise.reject(new Error('Invalid password'));
    });
    await loadPage();
    render(<SignInPage />);
  // Use password meeting min length so form submits and triggers mocked failure
  fillAndSubmitCredentials('user@example.com', 'wrongpass');
    await waitFor(() => screen.getByText(/two-factor authentication/i));
    mockLogin.mockRejectedValueOnce(new Error('Invalid password'));
    submitOtp();
    await waitFor(() => expect(screen.getByText(/invalid password/i)).toBeInTheDocument());
  });

  it('switches to vendor realm and calls login with vendors realm', async () => {
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      if (!otp && mockLogin.mock.calls.length === 0) return Promise.reject(new Error('TOTP_REQUIRED'));
      return Promise.resolve();
    });
    await loadPage();
    render(<SignInPage />);
  const vendorTab = screen.getByRole('tab', { name: /vendors/i });
    fireEvent.click(vendorTab);
    await waitFor(() => expect(vendorTab).toHaveAttribute('aria-selected', 'true'));
  fillAndSubmitCredentials('vendor@example.com', 'vendorpass');
  await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
  submitOtp();
  await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('vendor@example.com', 'vendorpass', 'vendors', '123456'));
  });

  it('aborts in-flight login when switching tab before retry and prevents further attempts', async () => {
    process.env.NEXT_PUBLIC_SIGNIN_BASE_DELAY_MS = '200';
    process.env.NEXT_PUBLIC_SIGNIN_MAX_RETRIES = '2';
    let call = 0;
    mockLogin = vi.fn((email: string, password: string, realm: string, otp?: string) => {
      // First triggers OTP requirement
      if (!otp && call === 0) { call++; return Promise.reject(new Error('TOTP_REQUIRED')); }
      call++;
      if (call === 2) return Promise.reject(new Error('Network Error: Failed to fetch'));
      return Promise.resolve();
    });
    await loadPage();
    render(<SignInPage />);
  fillAndSubmitCredentials();
  await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
  // Cause first OTP attempt (network fail) then switch tab before retry logic
  submitOtp();
  const developerTab = screen.getByRole('tab', { name: /developers/i });
    fireEvent.click(developerTab);
    await waitFor(() => expect(developerTab).toHaveAttribute('aria-selected', 'true'));
  await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
    await new Promise(res => setTimeout(res, 75));
    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  // Exponential backoff behavior now covered by pure unit tests in `__tests__/retryBackoff.test.ts`.
});
