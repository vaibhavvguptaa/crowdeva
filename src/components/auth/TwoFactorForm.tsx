"use client";

import React, { useState } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

interface TwoFactorFormProps {
  onSubmit: (otp: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSubmit, isLoading, error }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim()) {
      onSubmit(otp.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2" role="alert">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <div className="text-xs text-red-700">{error}</div>
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
          Two-Factor Authentication Code
        </label>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ShieldCheck className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isLoading}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none sm:text-sm bg-white text-gray-900 disabled:bg-gray-50"
            placeholder="Enter 6-digit code"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !otp.trim()}
        className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5" />
            <span>Verifying...</span>
          </>
        ) : (
          'Verify Code'
        )}
      </button>
    </form>
  );
};
