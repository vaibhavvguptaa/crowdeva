// jose v5 ships types; if TS cannot resolve, ensure moduleResolution is bundler/node16.
// @ts-ignore -- fallback in case of transient type resolution issue
import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';

// In-memory JWKS cache per issuer
const jwksCache: Map<string, ReturnType<typeof createRemoteJWKSet>> = new Map();

export interface VerifiedToken {
  payload: JWTPayload & { authType?: string; realm_access?: { roles?: string[] } };
  issuer: string;
}

export async function verifyKeycloakJWT(token: string): Promise<VerifiedToken> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const [, payloadB64] = parts;
  const payloadJson = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf8')) as JWTPayload & { iss?: string };
  const iss = payloadJson.iss;
  if (!iss) throw new Error('Missing issuer claim');

  const jwksUrl = iss.replace(/\/$/, '') + '/protocol/openid-connect/certs';
  let jwks = jwksCache.get(jwksUrl);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
  }

  const { payload } = await jwtVerify(token, jwks, { issuer: iss });
  return { payload: payload as VerifiedToken['payload'], issuer: iss };
}

export function extractAuthType(payload: VerifiedToken['payload']): string | undefined {
  return payload.authType || payload.realm_access?.roles?.[0];
}
