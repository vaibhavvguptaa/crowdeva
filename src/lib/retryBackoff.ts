export interface BackoffOptions {
  baseDelayMs: number; // base delay (already validated)
  attempt: number; // zero-based attempt index
  maxDelayMs?: number; // optional cap
  factor?: number; // exponential factor (default 2)
}

/**
 * Calculates exponential backoff delay used for sign-in retries.
 * Mirrors logic previously inline in SignInPage: base * 2^attempt with optional cap.
 */
export function calculateBackoffDelay({ baseDelayMs, attempt, maxDelayMs, factor = 2 }: BackoffOptions): number {
  if (attempt < 0) attempt = 0;
  const raw = baseDelayMs * Math.pow(factor, attempt);
  return maxDelayMs ? Math.min(raw, maxDelayMs) : raw;
}

/**
 * Generates an array of backoff delays for a sequence of attempts (useful in tests/metrics).
 */
export function generateBackoffSequence(baseDelayMs: number, attempts: number, opts?: { maxDelayMs?: number; factor?: number }): number[] {
  const seq: number[] = [];
  for (let i = 0; i < attempts; i++) {
    seq.push(calculateBackoffDelay({ baseDelayMs, attempt: i, ...opts }));
  }
  return seq;
}
