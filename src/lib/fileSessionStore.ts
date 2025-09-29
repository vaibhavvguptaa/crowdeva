// File-based session store for development and fallback
// This is a simple implementation that stores sessions in memory
// In production, Redis should be used instead

import * as fs from 'fs';
import * as path from 'path';

// Define the session record structure
export interface SessionRecord {
  refreshToken: string;
  authType: string;
  createdAt: number;
  lastRotatedAt: number;
  loginAttempts?: number;
  lastLoginAttempt?: number;
  isLocked?: boolean;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory session store for development
const memoryStore: Map<string, SessionRecord> = new Map();

// File path for persistent storage
const SESSIONS_FILE = path.join(process.cwd(), '.sessions.json');

// Load sessions from file on startup
function loadSessionsFromFile(): void {
  try {
    console.log('Checking for sessions file:', SESSIONS_FILE);
    if (fs.existsSync(SESSIONS_FILE)) {
      console.log('Sessions file exists, loading...');
      const data = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const sessions = JSON.parse(data);
      console.log(`Loaded ${Object.keys(sessions).length} sessions from file`);
      // Populate memory store
      Object.keys(sessions).forEach(id => {
        memoryStore.set(id, sessions[id]);
        console.log(`Loaded session ${id.substring(0, 20)}... into memory`);
      });
      console.log('Loaded sessions from file');
    } else {
      console.log('Sessions file does not exist');
    }
  } catch (error) {
    console.warn('Failed to load sessions from file:', error);
  }
}

// Save sessions to file
function saveSessionsToFile(): void {
  try {
    // Convert Map to object for JSON serialization
    const sessions: Record<string, SessionRecord> = {};
    memoryStore.forEach((value, key) => {
      sessions[key] = value;
    });
    
    console.log(`Saving ${Object.keys(sessions).length} sessions to file: ${SESSIONS_FILE}`);
    
    // Write to file synchronously to ensure data persistence
    console.log(`Writing ${Object.keys(sessions).length} sessions to file`);
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
    console.log('Sessions saved successfully to file');
    
    // Verify the file was written correctly
    try {
      const verifyData = fs.readFileSync(SESSIONS_FILE, 'utf8');
      const verifySessions = JSON.parse(verifyData);
      console.log(`Verified ${Object.keys(verifySessions).length} sessions in file`);
    } catch (verifyError) {
      console.warn('Failed to verify sessions file:', verifyError);
    }
  } catch (error) {
    console.warn('Failed to save sessions to file:', error);
  }
}

// Load sessions on module import
loadSessionsFromFile();

// Get session by ID
export async function getSession(id: string): Promise<SessionRecord | undefined> {
  console.log(`=== GETTING SESSION FROM FILE STORE ${id.substring(0, 20)}... ===`);
  
  // Check if session exists in memory
  if (memoryStore.has(id)) {
    const session = memoryStore.get(id)!;
    console.log(`Session ${id.substring(0, 20)}...: FOUND`);
    
    // Check if session is expired (7 days)
    const now = Date.now();
    if (now - session.createdAt > 7 * 24 * 60 * 60 * 1000) { // 7 days
      console.log('Session expired, deleting it');
      await deleteSession(id);
      return undefined;
    }
    
    return session;
  }
  
  console.log(`Session ${id.substring(0, 20)}...: NOT FOUND`);
  console.log(`Available session IDs: ${Array.from(memoryStore.keys()).map(k => k.substring(0, 20)).join(', ')}`);
  
  // Try to load sessions from file again in case they were added by another process
  try {
    loadSessionsFromFile();
    if (memoryStore.has(id)) {
      const session = memoryStore.get(id)!;
      console.log(`Session ${id.substring(0, 20)}...: FOUND after reload`);
      return session;
    }
  } catch (e) {
    console.log('Failed to reload sessions from file:', e);
  }
  
  return undefined;
}

// Create a new session
export async function createSession(
  refreshToken: string, 
  authType: string, 
  meta?: Partial<Omit<SessionRecord, 'refreshToken' | 'authType' | 'createdAt' | 'lastRotatedAt'>>
): Promise<string> {
  console.log(`=== CREATING SESSION IN FILE STORE ===`);
  console.log(`Refresh token length: ${refreshToken.length}`);
  console.log(`Auth type: ${authType}`);
  console.log(`Meta data:`, meta);

  // Generate session ID
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  console.log(`Generated session ID: ${id.substring(0, 20)}...`);

  // Create session record
  const session: SessionRecord = {
    refreshToken,
    authType,
    createdAt: Date.now(),
    lastRotatedAt: Date.now(),
    loginAttempts: 0,
    ...meta,
  };

  console.log('Session record to be stored:', {
    refreshToken: refreshToken.substring(0, 10) + '...',
    authType,
    createdAt: session.createdAt,
    lastRotatedAt: session.lastRotatedAt,
    loginAttempts: session.loginAttempts,
    userId: session.userId
  });
  
  // Log the full session ID for debugging
  console.log(`Full session ID: ${id}`);

  // Store session in memory
  console.log(`Storing session with ID: ${id}`);
  memoryStore.set(id, session);
  console.log(`Session stored, memory store size: ${memoryStore.size}`);
  
  // Persist to file
  saveSessionsToFile();

  console.log(`Session created successfully with ID: ${id}`);
  return id;
}

// Update session
export async function updateSession(id: string, updates: Partial<SessionRecord>): Promise<void> {
  console.log(`Updating session ${id.substring(0, 20)}... in file store with:`, updates);
  
  if (memoryStore.has(id)) {
    const session = memoryStore.get(id)!;
    const updatedSession = { ...session, ...updates };
    memoryStore.set(id, updatedSession);
    console.log(`Session ${id.substring(0, 20)}... updated successfully`);
    
    // Persist to file
    saveSessionsToFile();
  } else {
    console.log(`Session ${id.substring(0, 20)}...: NOT FOUND during update`);
  }
}

// Delete session
export async function deleteSession(id: string): Promise<void> {
  console.log(`Deleting session ${id} from file store`);
  
  if (memoryStore.has(id)) {
    memoryStore.delete(id);
    console.log(`Session ${id} deleted, memory store size: ${memoryStore.size}`);
  } else {
    console.log(`Session ${id} not found in memory store`);
  }
  
  // Persist to file
  saveSessionsToFile();
}

// Rotate session (update refresh token)
export async function rotateSession(id: string, newRefreshToken: string): Promise<void> {
  console.log(`=== ROTATING SESSION ${id.substring(0, 20)}... IN FILE STORE ===`);
  console.log(`New refresh token length: ${newRefreshToken.length}`);
  
  await updateSession(id, { refreshToken: newRefreshToken, lastRotatedAt: Date.now() });
  console.log(`Session ${id.substring(0, 20)}... rotated successfully`);
}

// Purge expired sessions
export async function purgeExpired(): Promise<void> {
  console.log('Purging expired sessions from file store');
  
  const now = Date.now();
  const expiredIds: string[] = [];
  
  memoryStore.forEach((session, id) => {
    if (now - session.createdAt > 7 * 24 * 60 * 60 * 1000) { // 7 days
      expiredIds.push(id);
    }
  });
  
  expiredIds.forEach(id => {
    memoryStore.delete(id);
  });
  
  // Persist to file
  saveSessionsToFile();
  
  console.log(`Purged ${expiredIds.length} expired sessions`);
}

// For diagnostics
export async function sessionStats(): Promise<{ count: number }> {
  return { count: memoryStore.size };
}

// Track login attempts
export async function trackLoginAttempt(id: string, success: boolean): Promise<SessionRecord | null> {
  if (memoryStore.has(id)) {
    const session = memoryStore.get(id)!;
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

    memoryStore.set(id, session);
    
    // Persist to file
    saveSessionsToFile();

    return session;
  }
  
  return null;
}

// Check if session is locked
export async function isSessionLocked(id: string): Promise<boolean> {
  if (memoryStore.has(id)) {
    const session = memoryStore.get(id)!;

    // Unlock session after 30 minutes
    if (session.isLocked && session.lastLoginAttempt && 
        Date.now() - session.lastLoginAttempt > 30 * 60 * 1000) {
      session.isLocked = false;
      session.loginAttempts = 0;
      memoryStore.set(id, session);
      
      // Persist to file
      saveSessionsToFile();
      
      return false;
    }

    return session.isLocked || false;
  }
  
  return false;
}

// Initialize the file store
export function initializeFileStore(): void {
  console.log('Initializing file-based session store');
  loadSessionsFromFile();
  console.log(`File store initialized with ${memoryStore.size} sessions`);
}

// List all sessions (for debugging)
export async function listSessions(): Promise<{[key: string]: SessionRecord}> {
  const sessions: {[key: string]: SessionRecord} = {};
  memoryStore.forEach((value, key) => {
    sessions[key] = value;
  });
  return sessions;
}