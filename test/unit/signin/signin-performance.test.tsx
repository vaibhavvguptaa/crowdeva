import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '@/app/(auth)/signin/page';

// Basic mocks similar to existing test (keep lightweight)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/signin',
}));

const mockLogin = vi.fn(() => Promise.resolve());
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, login: mockLogin, loading: false }),
}));

vi.mock('@/components/signin/GoogleSignInButton', () => ({
  GoogleSignInButton: (props: any) => <button type="button" disabled={props.disabled}>Google</button>,
}));
vi.mock('@/lib/config', () => ({
  getKeycloakConfig: () => ({ realm: 'customer' }),
}));

// Don't dynamically import real AnimatedContent to isolate critical path perf
vi.mock('@/components/signin/AnimatedContent', () => ({
  AnimatedContent: () => <div data-testid="animated" />,
}));

// Utility to read performance entries inside JSDOM (marks added by component when env flag is set)
const getMeasure = (name: string) => {
  // @ts-ignore
  const perf: Performance = window.performance;
  const entries = perf.getEntriesByName(name);
  return entries[entries.length - 1];
};

// Ensure env flag for perf instrumentation is set
process.env.NEXT_PUBLIC_ENABLE_AUTH_PERF = '1';

describe('SignInPage performance', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    // Clear previous performance entries to avoid cross-test contamination
    performance.clearMarks();
    performance.clearMeasures();
  });

  it('records initial render performance mark within budget', async () => {
    render(<SignInPage />);
    // Allow effect to run
    await waitFor(() => {
      const measure = getMeasure('signin:initial-render');
      expect(measure).toBeDefined();
      // Simple budget assertion (arbitrary 120ms in JSDOM; adjust if needed)
      expect(measure.duration).toBeLessThan(120);
    });
  });

  it('submits credentials with minimal interaction latency', async () => {
    render(<SignInPage />);
    const email = screen.getAllByLabelText(/email address/i)[0];
    const password = screen.getAllByLabelText(/password/i)[0];

    const t0 = performance.now();
    fireEvent.change(email, { target: { value: 'user@example.com' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    fireEvent.submit(email.closest('form')!);

    await waitFor(() => expect(mockLogin).toHaveBeenCalledOnce());
    const latency = performance.now() - t0;
    // Basic expectation that local form + mock login resolves quickly (<50ms in JSDOM typical). Allow margin.
    expect(latency).toBeLessThan(200);
  });
});
