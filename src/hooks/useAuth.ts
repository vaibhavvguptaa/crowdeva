// Consolidated useAuth hook: delegates entirely to AuthContext to avoid duplication.
// All authentication logic now lives in AuthProvider (contexts/AuthContext.tsx).
// This keeps a stable public API for existing consumers while eliminating drift.
import { useAuthContext } from '@/contexts/AuthContext';

export const useAuth = () => {
  return useAuthContext();
};

// (Optional) If needed in future, we can expose a selector pattern here to avoid rerenders.
