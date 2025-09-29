// Redis-based session store for production
// This persists sessions across server restarts and works in distributed environments
import { createClient, RedisClientType } from 'redis';
import { SessionRecord } from './fileSessionStore';

// Redis client instance
let redisClient: RedisClientType | null = null;
let isConnecting = false;
let redisAvailable = true; // Flag to track Redis availability
let redisChecked = false; // Flag to prevent repeated connection attempts

// Session expiration time (7 days in seconds)
const SESSION_EXPIRATION = 7 * 24 * 60 * 60;

// Get Redis client
async function getRedisClient(): Promise<RedisClientType | null> {
  // If we've already determined Redis is not available, don't try to connect again
  if (!redisAvailable || redisChecked) {
    return null;
  }

  // Return existing client if available
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If already connecting, return null to avoid multiple connections
  if (isConnecting) {
    console.log('Redis client is already connecting');
    return null;
  }

  try {
    isConnecting = true;
    redisChecked = true; // Mark that we've attempted to connect
    
    // Get Redis URL from environment variable or use default localhost
    // Fix for "redis" hostname issue - use localhost instead
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const fixedRedisUrl = redisUrl.replace('redis://redis', 'redis://localhost');
    
    console.log('Connecting to Redis at:', fixedRedisUrl);
    
    // Create new Redis client
    redisClient = createClient({
      url: fixedRedisUrl,
      socket: {
        reconnectStrategy: (retries: number) => {
          // Stop reconnecting after 3 attempts
          if (retries > 3) {
            redisAvailable = false;
            console.log('Redis connection failed after 3 attempts, will use file-based session store');
            return new Error('Redis connection failed');
          }
          // Exponential backoff, max 5 seconds
          return Math.min(retries * 1000, 5000);
        },
        connectTimeout: 5000 // 5 second connection timeout
      }
    });

    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
      // Mark Redis as unavailable on connection failure
      if (!redisAvailable) return; // Already marked as unavailable
      redisAvailable = false;
      console.log('Redis marked as unavailable, will use file-based session store');
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    redisClient.on('reconnecting', () => {
      console.log('Reconnecting to Redis...');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Mark Redis as unavailable on connection failure
    redisAvailable = false;
    redisChecked = true;
    console.log('Redis marked as unavailable due to connection failure, will use file-based session store');
    // Explicitly set redisClient to null on connection failure
    redisClient = null;
    return null;
  } finally {
    isConnecting = false;
  }
}

// Get session by ID
export async function getSession(id: string): Promise<SessionRecord | undefined> {
  console.log(`=== GETTING SESSION ${id.substring(0, 20)}... ===`);
  
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      console.error('Redis client not available, using file-based session store');
      // Fallback to file-based session store if Redis is not available
      const { getSession: getFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store');
      return await getFileSession(id);
    }

    const sessionData = await client.get(`session:${id}`);
    if (!sessionData) {
      console.log(`Session ${id.substring(0, 20)}...: NOT FOUND`);
      return undefined;
    }

    const session: SessionRecord = JSON.parse(sessionData);
    console.log(`Session ${id.substring(0, 20)}...: FOUND`);
    console.log(`Session details - authType: ${session.authType}, hasRefreshToken: ${!!session.refreshToken}`);

    // Check if session is expired (7 days)
    const now = Date.now();
    if (now - session.createdAt > 7 * 24 * 60 * 60 * 1000) { // 7 days
      console.log('Session expired, deleting it');
      await deleteSession(id);
      return undefined;
    }

    // Check if session hasn't been rotated in a long time (24 hours)
    if (now - session.lastRotatedAt > 24 * 60 * 60 * 1000) { // 24 hours
      console.log('Session not rotated in 24 hours, might be stale');
    }

    return session;
  } catch (error) {
    console.error('Error getting session from Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { getSession: getFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store due to Redis error');
      return await getFileSession(id);
    } catch (fallbackError) {
      console.error('Error getting session from file store:', fallbackError);
      return undefined;
    }
  }
}

// Create a new session
export async function createSession(
  refreshToken: string, 
  authType: string, 
  meta?: Partial<Omit<SessionRecord, 'refreshToken' | 'authType' | 'createdAt' | 'lastRotatedAt'>>
): Promise<string> {
  console.log(`=== CREATING SESSION ===`);
  console.log(`Refresh token length: ${refreshToken.length}`);
  console.log(`Auth type: ${authType}`);
  console.log(`Meta data:`, meta);

  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      // Fallback to file-based session store if Redis is not available
      const { createSession: createFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store');
      return await createFileSession(refreshToken, authType, meta);
    }

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

    // Store session in Redis with expiration
    await client.setEx(
      `session:${id}`, 
      SESSION_EXPIRATION, 
      JSON.stringify(session)
    );

    console.log(`Session created successfully`);
    return id;
  } catch (error) {
    console.error('Error creating session in Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { createSession: createFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store due to Redis error');
      return await createFileSession(refreshToken, authType, meta);
    } catch (fallbackError) {
      console.error('Error creating session in file store:', fallbackError);
      throw new Error('Failed to create session');
    }
  }
}

// Update session
export async function updateSession(id: string, updates: Partial<SessionRecord>): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      // Fallback to file-based session store if Redis is not available
      const { updateSession: updateFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store');
      return await updateFileSession(id, updates);
    }

    const sessionData = await client.get(`session:${id}`);
    if (!sessionData) {
      console.log(`Session ${id.substring(0, 20)}...: NOT FOUND during update`);
      return;
    }

    const session: SessionRecord = JSON.parse(sessionData);
    const updatedSession = { ...session, ...updates };

    console.log(`Updating session ${id.substring(0, 20)}... with:`, updates);

    // Store updated session in Redis with expiration
    await client.setEx(
      `session:${id}`, 
      SESSION_EXPIRATION, 
      JSON.stringify(updatedSession)
    );
  } catch (error) {
    console.error('Error updating session in Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { updateSession: updateFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store due to Redis error');
      return await updateFileSession(id, updates);
    } catch (fallbackError) {
      console.error('Error updating session in file store:', fallbackError);
    }
  }
}

// Delete session
export async function deleteSession(id: string): Promise<void> {
  console.log(`Deleting session ${id}`);
  
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      // Fallback to file-based session store if Redis is not available
      const { deleteSession: deleteFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store');
      return await deleteFileSession(id);
    }

    await client.del(`session:${id}`);
  } catch (error) {
    console.error('Error deleting session from Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { deleteSession: deleteFileSession } = await import('./fileSessionStore');
      console.log('Falling back to file-based session store due to Redis error');
      return await deleteFileSession(id);
    } catch (fallbackError) {
      console.error('Error deleting session from file store:', fallbackError);
    }
  }
}

// Rotate session (update refresh token)
export async function rotateSession(id: string, newRefreshToken: string): Promise<void> {
  console.log(`=== ROTATING SESSION ${id.substring(0, 20)}... ===`);
  console.log(`New refresh token length: ${newRefreshToken.length}`);
  
  await updateSession(id, { refreshToken: newRefreshToken, lastRotatedAt: Date.now() });
}

// Purge expired sessions (Redis automatically handles expiration, but this is kept for compatibility)
export async function purgeExpired(): Promise<void> {
  // Redis automatically expires keys, so this function is not needed
  // Keeping it for API compatibility
  console.log('Redis automatically handles session expiration, no manual purge needed');
}

// For diagnostics
export async function sessionStats(): Promise<{ count: number }> {
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      const { sessionStats: fileSessionStats } = await import('./fileSessionStore');
      return await fileSessionStats();
    }

    // Count sessions with pattern matching
    const keys = await client.keys('session:*');
    return { count: keys.length };
  } catch (error) {
    console.error('Error getting session stats from Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { sessionStats: fileSessionStats } = await import('./fileSessionStore');
      return await fileSessionStats();
    } catch (fallbackError) {
      console.error('Error getting session stats from file store:', fallbackError);
      return { count: 0 };
    }
  }
}

// Track login attempts
export async function trackLoginAttempt(id: string, success: boolean): Promise<SessionRecord | null> {
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      const { trackLoginAttempt: trackFileLoginAttempt } = await import('./fileSessionStore');
      return await trackFileLoginAttempt(id, success);
    }

    const sessionData = await client.get(`session:${id}`);
    if (!sessionData) return null;

    const session: SessionRecord = JSON.parse(sessionData);
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

    // Store updated session in Redis with expiration
    await client.setEx(
      `session:${id}`, 
      SESSION_EXPIRATION, 
      JSON.stringify(session)
    );

    return session;
  } catch (error) {
    console.error('Error tracking login attempt in Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { trackLoginAttempt: trackFileLoginAttempt } = await import('./fileSessionStore');
      return await trackFileLoginAttempt(id, success);
    } catch (fallbackError) {
      console.error('Error tracking login attempt in file store:', fallbackError);
      return null;
    }
  }
}

// Check if session is locked
export async function isSessionLocked(id: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client || !redisAvailable) {
      const { isSessionLocked: isFileSessionLocked } = await import('./fileSessionStore');
      return await isFileSessionLocked(id);
    }

    const sessionData = await client.get(`session:${id}`);
    if (!sessionData) return false;

    const session: SessionRecord = JSON.parse(sessionData);

    // Unlock session after 30 minutes
    if (session.isLocked && session.lastLoginAttempt && 
        Date.now() - session.lastLoginAttempt > 30 * 60 * 1000) {
      session.isLocked = false;
      session.loginAttempts = 0;
      
      // Store updated session in Redis with expiration
      await client.setEx(
        `session:${id}`, 
        SESSION_EXPIRATION, 
        JSON.stringify(session)
      );
      
      return false;
    }

    return session.isLocked || false;
  } catch (error) {
    console.error('Error checking session lock status in Redis:', error);
    // Fallback to file-based session store on error
    try {
      const { isSessionLocked: isFileSessionLocked } = await import('./fileSessionStore');
      return await isFileSessionLocked(id);
    } catch (fallbackError) {
      console.error('Error checking session lock status in file store:', fallbackError);
      return false;
    }
  }
}

// Gracefully shutdown Redis connection
export async function shutdown(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}