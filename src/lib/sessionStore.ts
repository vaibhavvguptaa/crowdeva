// Simple in-memory session store (replace with Redis in production)
// Maps opaque session IDs to refresh tokens & metadata.
import crypto from 'crypto';

export interface SessionRecord {
  refreshToken: string;
  authType: string;
  userId?: string;
  createdAt: number;
  lastRotatedAt: number;
  userAgent?: string;
  ip?: string;
  // Security enhancements
  loginAttempts?: number;
  lastLoginAttempt?: number;
  isLocked?: boolean;
}

const store: Map<string, SessionRecord> = new Map();
const SESSION_ID_BYTES = 32;

export function getSession(id: string): SessionRecord | undefined {
  console.log(`=== GETTING SESSION ${id.substring(0, 20)}... ===`);
  const session = store.get(id);
  console.log(`Session ${id.substring(0, 20)}...:`, session ? 'FOUND' : 'NOT FOUND');
  if (session) {
    console.log(`Session details - authType: ${session.authType}, hasRefreshToken: ${!!session.refreshToken}`);
  }
  return session;
}

export function createSession(refreshToken: string, authType: string, meta?: Partial<Omit<SessionRecord,'refreshToken'|'authType'|'createdAt'|'lastRotatedAt'>>) {
  console.log(`=== CREATING SESSION ===`);
  console.log(`Refresh token length: ${refreshToken.length}`);
  console.log(`Auth type: ${authType}`);
  
  const id = crypto.randomBytes(SESSION_ID_BYTES).toString('hex');
  console.log(`Generated session ID: ${id.substring(0, 20)}...`);
  
  store.set(id, {
    refreshToken,
    authType,
    createdAt: Date.now(),
    lastRotatedAt: Date.now(),
    loginAttempts: 0,
    ...meta,
  });
  
  console.log(`Session created successfully`);
  return id;
}

export function updateSession(id: string, updates: Partial<SessionRecord>) {
  const rec = store.get(id);
  if (!rec) return;
  store.set(id, { ...rec, ...updates });
}

export function deleteSession(id: string) {
  console.log(`Deleting session ${id}`);
  store.delete(id);
}

export function rotateSession(id: string, newRefreshToken: string) {
  console.log(`=== ROTATING SESSION ${id.substring(0, 20)}... ===`);
  console.log(`New refresh token length: ${newRefreshToken.length}`);
  updateSession(id, { refreshToken: newRefreshToken, lastRotatedAt: Date.now() });
}

export function purgeExpired(maxAgeMs = 1000 * 60 * 60 * 24 * 7) { // 7 days
  const now = Date.now();
  for (const [id, rec] of store.entries()) {
    if (now - rec.createdAt > maxAgeMs) store.delete(id);
  }
}

// For diagnostics (avoid exposing refresh tokens in logs)
export function sessionStats() {
  return { count: store.size };
}

/**
 * Track login attempts for a session
 * @param id Session ID
 * @param success Whether the login attempt was successful
 * @returns Updated session record or null if session not found
 */
export function trackLoginAttempt(id: string, success: boolean): SessionRecord | null {
  const session = store.get(id);
  if (!session) return null;
  
  const now = Date.now();
  
  if (success) {
    // Reset login attempts on successful login
    session.loginAttempts = 0;
    session.lastLoginAttempt = now;
    session.isLocked = false;
  } else {
    // Increment login attempts on failed login
    session.loginAttempts = (session.loginAttempts || 0) + 1;
    session.lastLoginAttempt = now;
    
    // Lock session after 5 failed attempts
    if (session.loginAttempts >= 5) {
      session.isLocked = true;
    }
  }
  
  store.set(id, session);
  return session;
}

/**
 * Check if a session is locked due to too many failed login attempts
 * @param id Session ID
 * @returns Whether the session is locked
 */
export function isSessionLocked(id: string): boolean {
  const session = store.get(id);
  if (!session) return false;
  
  // Unlock session after 30 minutes
  if (session.isLocked && session.lastLoginAttempt && 
      Date.now() - session.lastLoginAttempt > 30 * 60 * 1000) {
    session.isLocked = false;
    session.loginAttempts = 0;
    store.set(id, session);
    return false;
  }
  
  return session.isLocked || false;
}

/**
 * Periodically clean up expired sessions to prevent memory leaks
 */
export function startSessionCleanup() {
  // Clean up expired sessions every hour
  setInterval(() => {
    purgeExpired();
  }, 60 * 60 * 1000); // 1 hour
}

// Start cleanup process when module is loaded
startSessionCleanup();