"use client";

// NOTE: This route previously duplicated complex sign-in + 2FA logic and became corrupted.
// The authoritative implementation now lives in `components/signin/BaseSignInPage.tsx`.
// Keep this file as a thin wrapper so all realms (customers/developers/vendors) share one flow.

import React from 'react';
import { BaseSignInPage } from '@/components/signin/BaseSignInPage';

export default function SignInPage() {
  return <BaseSignInPage />;
}