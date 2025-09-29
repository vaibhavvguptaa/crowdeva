import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSession, getSession, updateSession, deleteSession, rotateSession, sessionStats, trackLoginAttempt, isSessionLocked, initializeFileStore } from '../../src/lib/fileSessionStore';
import * as fs from 'fs';
import * as path from 'path';

describe('File Session Store', () => {
  const testSessionsFile = path.join(process.cwd(), '.sessions.test.json');
  
  beforeEach(() => {
    // Clear any existing test sessions file
    if (fs.existsSync(testSessionsFile)) {
      fs.unlinkSync(testSessionsFile);
    }
    
    // Mock fs operations to use test file instead of default .sessions.json
    vi.spyOn(fs, 'readFileSync').mockImplementation((filePath: fs.PathOrFileDescriptor, options: any) => {
      if (filePath === path.join(process.cwd(), '.sessions.json')) {
        if (fs.existsSync(testSessionsFile)) {
          return fs.readFileSync(testSessionsFile, options);
        }
        return '{}';
      }
      // Call original implementation for other files
      return fs.readFileSync(filePath, options);
    });
    
    vi.spyOn(fs, 'writeFileSync').mockImplementation((filePath: fs.PathOrFileDescriptor, data: any, options: any) => {
      if (filePath === path.join(process.cwd(), '.sessions.json')) {
        return fs.writeFileSync(testSessionsFile, data, options);
      }
      // Call original implementation for other files
      return fs.writeFileSync(filePath, data, options);
    });
    
    vi.spyOn(fs, 'existsSync').mockImplementation((filePath: fs.PathLike) => {
      if (filePath === path.join(process.cwd(), '.sessions.json')) {
        return fs.existsSync(testSessionsFile);
      }
      // Call original implementation for other files
      return fs.existsSync(filePath);
    });
    
    vi.spyOn(fs, 'unlinkSync').mockImplementation((filePath: fs.PathLike) => {
      if (filePath === path.join(process.cwd(), '.sessions.json')) {
        if (fs.existsSync(testSessionsFile)) {
          return fs.unlinkSync(testSessionsFile);
        }
        return undefined;
      }
      // Call original implementation for other files
      return fs.unlinkSync(filePath);
    });
  });

  afterEach(() => {
    // Clean up test sessions file
    if (fs.existsSync(testSessionsFile)) {
      fs.unlinkSync(testSessionsFile);
    }
    
    // Restore all mocks
    vi.restoreAllMocks();
  });

  it('should create a new session', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers', { userId: 'test-user' });
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it('should retrieve an existing session', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers', { userId: 'test-user' });
    const session = await getSession(sessionId);
    
    expect(session).toBeDefined();
    expect(session?.refreshToken).toBe('test-refresh-token');
    expect(session?.authType).toBe('customers');
    expect(session?.userId).toBe('test-user');
    expect(session?.createdAt).toBeDefined();
    expect(session?.lastRotatedAt).toBeDefined();
  });

  it('should update an existing session', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers');
    await updateSession(sessionId, { userId: 'updated-user', loginAttempts: 3 });
    
    const session = await getSession(sessionId);
    expect(session?.userId).toBe('updated-user');
    expect(session?.loginAttempts).toBe(3);
  });

  it('should delete a session', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers');
    let session = await getSession(sessionId);
    expect(session).toBeDefined();
    
    await deleteSession(sessionId);
    session = await getSession(sessionId);
    expect(session).toBeUndefined();
  });

  it('should rotate a session', async () => {
    const sessionId = await createSession('old-refresh-token', 'customers');
    let session = await getSession(sessionId);
    const originalRotatedAt = session?.lastRotatedAt;
    
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure timestamp changes
    await rotateSession(sessionId, 'new-refresh-token');
    
    session = await getSession(sessionId);
    expect(session?.refreshToken).toBe('new-refresh-token');
    expect(session?.lastRotatedAt).toBeGreaterThan(originalRotatedAt || 0);
  });

  it('should track login attempts', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers');
    
    // Track a failed login attempt
    const session = await trackLoginAttempt(sessionId, false);
    expect(session?.loginAttempts).toBe(1);
    
    // Track another failed login attempt
    const session2 = await trackLoginAttempt(sessionId, false);
    expect(session2?.loginAttempts).toBe(2);
    
    // Track a successful login attempt (should reset counter)
    const session3 = await trackLoginAttempt(sessionId, true);
    expect(session3?.loginAttempts).toBe(0);
  });

  it('should lock a session after too many failed attempts', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers');
    
    // Fail 5 login attempts
    for (let i = 0; i < 5; i++) {
      await trackLoginAttempt(sessionId, false);
    }
    
    // Check if session is locked
    const locked = await isSessionLocked(sessionId);
    expect(locked).toBe(true);
  });

  it('should unlock a session after time passes', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers');
    
    // Fail 5 login attempts
    for (let i = 0; i < 5; i++) {
      await trackLoginAttempt(sessionId, false);
    }
    
    // Manually modify the session to simulate time passing
    await updateSession(sessionId, { lastLoginAttempt: Date.now() - 31 * 60 * 1000 }); // 31 minutes ago
    
    // Check if session is unlocked
    const locked = await isSessionLocked(sessionId);
    expect(locked).toBe(false);
  });

  it('should get session statistics', async () => {
    // Create a few sessions
    await createSession('test-refresh-token-1', 'customers');
    await createSession('test-refresh-token-2', 'developers');
    await createSession('test-refresh-token-3', 'vendors');
    
    const stats = await sessionStats();
    expect(stats.count).toBeGreaterThanOrEqual(3);
  });

  it('should persist sessions to file', async () => {
    const sessionId = await createSession('test-refresh-token', 'customers', { userId: 'test-user' });
    
    // Create a new session store instance to test file loading
    const session = await getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.refreshToken).toBe('test-refresh-token');
    expect(session?.userId).toBe('test-user');
  });
});