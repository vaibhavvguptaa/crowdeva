"use client";

import React from 'react';
import { useHydrationSafe } from '@/hooks/useHydrationSafe';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that only renders its children on the client-side
 * to prevent hydration mismatches for components that depend on browser APIs
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const hasMounted = useHydrationSafe();

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
