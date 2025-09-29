import { describe, it, expect } from 'vitest';
import { calculateBackoffDelay, generateBackoffSequence } from '@/lib/retryBackoff';

describe('retryBackoff helper', () => {
  it('calculates exponential delays correctly', () => {
    expect(calculateBackoffDelay({ baseDelayMs: 100, attempt: 0 })).toBe(100);
    expect(calculateBackoffDelay({ baseDelayMs: 100, attempt: 1 })).toBe(200);
    expect(calculateBackoffDelay({ baseDelayMs: 100, attempt: 2 })).toBe(400);
  });

  it('applies cap (maxDelayMs)', () => {
    // attempt 4 => 100 * 2^4 = 1600 but capped at 500
    expect(calculateBackoffDelay({ baseDelayMs: 100, attempt: 4, maxDelayMs: 500 })).toBe(500);
  });

  it('supports custom factor', () => {
    // factor=3 => 50 * 3^2 = 450
    expect(calculateBackoffDelay({ baseDelayMs: 50, attempt: 2, factor: 3 })).toBe(450);
  });

  it('generates sequence', () => {
    expect(generateBackoffSequence(100, 3)).toEqual([100, 200, 400]);
  });
});
