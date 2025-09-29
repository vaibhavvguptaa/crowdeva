"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to prevent hydration mismatches by deferring client-only rendering
 * until after the component has mounted on the client
 */
export function useHydrationSafe() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    console.log('useHydrationSafe effect triggered');
    setHasMounted(true);
  }, []);

  console.log('useHydrationSafe returning:', hasMounted);
  return hasMounted;
}

/**
 * Hook for safely accessing localStorage without causing hydration mismatches
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const hasMounted = useHydrationSafe();

  useEffect(() => {
    if (!hasMounted) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, hasMounted]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [hasMounted ? storedValue : initialValue, setValue];
}

/**
 * Hook for safely accessing sessionStorage without causing hydration mismatches
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const hasMounted = useHydrationSafe();

  useEffect(() => {
    if (!hasMounted) return;

    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
    }
  }, [key, hasMounted]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  };

  return [hasMounted ? storedValue : initialValue, setValue];
}
