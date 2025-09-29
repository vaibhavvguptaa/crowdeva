import crypto from 'crypto';

// Generate a random nonce for CSP
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

// Create CSP header with nonce support
export function createCSPHeader(nonce?: string): string {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self'${nonce ? ` 'nonce-${nonce}'` : ''} 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", // Keep unsafe-inline for styles as it's less risky
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "child-src 'self'",
    // Add worker-src for better security
    "worker-src 'self'",
    // Add manifest-src for PWA support
    "manifest-src 'self'"
  ];
  
  return cspDirectives.join('; ');
}

// Pre-generate common CSP headers for better performance
const defaultCSP = createCSPHeader();
const strictCSP = createCSPHeader(generateNonce());

export { defaultCSP, strictCSP };