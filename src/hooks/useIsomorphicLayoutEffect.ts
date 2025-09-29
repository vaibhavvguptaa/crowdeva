"use client";

import { useEffect, useLayoutEffect } from 'react';

// Use useLayoutEffect on the client and useEffect on the server
// This prevents hydration mismatches when using layout effects
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
