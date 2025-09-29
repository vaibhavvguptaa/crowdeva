import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '@/app/(auth)/signin/page';

// Mock next/navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/signin',
}));

// Mock auth hook
const mockLogin = vi.fn(() => Promise.resolve());
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: mockLogin, loading: false }),
}));

// Mock child components that may rely on complex animations / external deps
vi.mock('@/components/signin/AnimatedContent', () => ({
  AnimatedContent: () => <div data-testid="animated-content" />,
}));
vi.mock('@/components/Ui/OptimizedLoading', () => ({
  OptimizedLoading: ({ isVisible }: { isVisible: boolean }) => isVisible ? <div data-testid="loading-overlay">Loading...</div> : null,
}));
vi.mock('@/components/Ui/ClientOnly', () => ({
  ClientOnly: ({ children }: any) => <>{children}</>,
}));

// Simplify GoogleSignInButton to avoid external logic
vi.mock('@/components/signin/GoogleSignInButton', () => ({
  GoogleSignInButton: (props: any) => <button type="button" disabled={props.disabled} data-testid="google-btn">Google</button>,
}));

// Avoid keycloak config access side-effects
vi.mock('@/lib/config', () => ({
  getKeycloakConfig: () => ({ realm: 'customer' }),
}));

// Silence console errors from retry logs for cleaner test output
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('SignInPage', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('renders credential step form elements', () => {
    render(<SignInPage />);

    // Form labels
    expect(screen.getAllByLabelText(/email address/i)[0]).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)[0]).toBeInTheDocument();

    // Submit button
    expect(screen.getAllByRole('button', { name: /sign in/i })[0]).toBeInTheDocument();

  // Tabs (labels no longer include 'for')
  expect(screen.getByRole('tab', { name: /customers/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /developers/i })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /vendors/i })).toBeInTheDocument();
  });

  it('validates form inputs before submitting', async () => {
    render(<SignInPage />);

    const submit = screen.getAllByRole('button', { name: /sign in/i })[0];
    fireEvent.click(submit);

    // Since ImprovedAuthForm uses react-hook-form with zod, validation errors appear only after interaction; fill invalid then clear
    const emailInput = screen.getAllByLabelText(/email address/i)[0] as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('submits credentials and logs in directly when TOTP not required', async () => {
    render(<SignInPage />);
    const emailInput = screen.getAllByLabelText(/email address/i)[0] as HTMLInputElement;
    const passwordInput = screen.getAllByLabelText(/password/i)[0] as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'plain@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(emailInput.closest('form')!);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
    expect(screen.queryByText(/two-factor authentication/i)).not.toBeInTheDocument();
  });

  it('prompts for OTP only when backend signals TOTP_REQUIRED', async () => {
    // Make the first credential attempt throw TOTP_REQUIRED then succeed with OTP
    mockLogin.mockImplementationOnce(() => Promise.reject({ message: 'TOTP_REQUIRED' }));
    render(<SignInPage />);
    const emailInput = screen.getAllByLabelText(/email address/i)[0] as HTMLInputElement;
    const passwordInput = screen.getAllByLabelText(/password/i)[0] as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: '2fa@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(emailInput.closest('form')!);
    await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
    // Provide OTP
    const otpHidden = screen.getByLabelText(/6-digit code/i) as HTMLInputElement; // hidden input
    fireEvent.change(otpHidden, { target: { value: '123456' } });
    fireEvent.submit(otpHidden.closest('form')!);
  });

  it('fills and submits 2FA code', async () => {
    render(<SignInPage />);
    // Make the first credential attempt succeed and indicate TOTP_REQUIRED
    mockLogin.mockImplementationOnce(() => Promise.reject({ message: 'TOTP_REQUIRED' }));
    const emailInput = screen.getAllByLabelText(/email address/i)[0] as HTMLInputElement;
    const passwordInput = screen.getAllByLabelText(/password/i)[0] as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: '2fa@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(emailInput.closest('form')!);
    await waitFor(() => expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument());
    // Fill all 6 input fields with a valid code
    for (let i = 0; i < 6; i++) {
      fireEvent.change(screen.getByLabelText(`2FA code digit ${i + 1} of 6`), { target: { value: '1' } });
    }
    fireEvent.click(screen.getByText(/verify/i));
  });

  it('switches tabs without navigating away (credential step)', async () => {
    render(<SignInPage />);

    const developerTab = screen.getByRole('tab', { name: /developers/i });
    fireEvent.click(developerTab);

    // The active tab text should now reflect developer realm (button has aria-selected true)
  await waitFor(() => expect(developerTab).toHaveAttribute('aria-selected', 'true'));
  });
});
