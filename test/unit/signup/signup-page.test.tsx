import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignUpPage from '@/app/(auth)/signup/page';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/signup',
}));
vi.mock('@/components/signin/TabSwitcher', () => ({ TabSwitcher: () => <div data-testid="tabs" /> }));
vi.mock('@/components/signin/AnimatedContent', () => ({ AnimatedContent: () => <div data-testid="animated" /> }));
vi.mock('@/components/Ui/OptimizedLoading', () => ({ OptimizedLoading: () => null }));
vi.mock('@/components/auth/AuthHeader', () => ({ AuthHeader: ({ title }: any) => <h1>{title}</h1> }));
vi.mock('@/components/Ui/ClientOnly', () => ({ ClientOnly: ({ children }: any) => <>{children}</> }));
vi.mock('@/components/signin/GoogleSignInButton', () => ({ GoogleSignInButton: () => <div /> }));
const registerMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, register: registerMock, loading: false }) }));
const originalError = console.error;
beforeAll(() => { console.error = (...args: any[]) => { if (String(args[0]).includes('Registration failed')) return; originalError(...args); }; });
afterAll(() => { console.error = originalError; });

describe('SignUpPage', () => {
  it('submits valid form and calls register', async () => {
    render(<SignUpPage />);
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Company Name/i), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Abcdefg1' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Abcdefg1' } });
    fireEvent.click(screen.getByLabelText(/I agree/i));
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
    fireEvent.click(submitBtn);
    await waitFor(() => expect(registerMock).toHaveBeenCalledTimes(1));
    expect(registerMock.mock.calls[0][0]).toBe('john@example.com');
  });
});
