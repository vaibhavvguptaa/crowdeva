import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignUpForm } from '@/components/signup/SignUpForm';
import { vi, describe, it, expect } from 'vitest';

// Mock the dynamic import
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = fn().then((mod: any) => mod.PasswordRequirements);
    return () => <div data-testid="password-requirements" />;
  },
}));

describe('SignUpForm Terms Acceptance', () => {
  const defaultProps = {
    userType: 'developers' as const,
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    firstName: '',
    setFirstName: vi.fn(),
    lastName: '',
    setLastName: vi.fn(),
    companyName: '',
    setCompanyName: vi.fn(),
    onSignUp: vi.fn(),
    onSignIn: vi.fn(),
    isLoading: false,
  };

  it('shows terms error only when trying to submit without accepting', async () => {
    render(<SignUpForm {...defaultProps} />);
    
    // Initially, no terms error should be shown
    expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123' } });
    
    // Still no terms error should be shown before submission
    expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    
    // Click submit without accepting terms
    const submitBtn = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(submitBtn);
    
    // Now the terms error should be shown
    await waitFor(() => {
      expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
    });
    
    // Check the terms checkbox
    fireEvent.click(screen.getByLabelText(/I agree/i));
    
    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    });
  });
  
  it('shows terms error when checkbox is touched and unchecked', async () => {
    render(<SignUpForm {...defaultProps} />);
    
    // Initially, no terms error should be shown
    expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    
    // Click the terms checkbox to check it
    fireEvent.click(screen.getByLabelText(/I agree/i));
    
    // Still no error should be shown
    expect(screen.queryByText('You must accept the terms and conditions')).not.toBeInTheDocument();
    
    // Click again to uncheck it
    fireEvent.click(screen.getByLabelText(/I agree/i));
    
    // Now the error should be shown
    await waitFor(() => {
      expect(screen.getByText('You must accept the terms and conditions')).toBeInTheDocument();
    });
  });
});