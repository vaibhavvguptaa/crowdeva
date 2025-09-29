import { describe, it, expect, vi } from 'vitest';

// Mock 'jose' to prevent real network/crypto operations in unit test context.
vi.mock('jose', () => {
  return {
    // minimal JWT verify that rejects everything (we don't test success path here)
    jwtVerify: async () => { throw new Error('Signature verification not mocked'); },
    createRemoteJWKSet: () => ({}),
  };
});

import { verifyKeycloakJWT } from '@/lib/jwtVerify';

// Placeholder test focusing on malformed token failure path.
// Future: mock JWKS endpoint and test valid signature scenario.

describe('verifyKeycloakJWT', () => {
  it('rejects malformed token', async () => {
    await expect(verifyKeycloakJWT('abc.def')).rejects.toThrow();
  });
});
