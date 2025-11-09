/**
 * Token Refresh Manager
 *
 * Handles automatic OAuth token refresh in the background
 * to keep users logged in without requiring re-authentication
 */

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in milliseconds
  tokenType: string;
  scope?: string;
}

export interface UserSession {
  user: any;
  tokens: TokenData;
  lastRefresh?: number;
}

// Store active sessions with their tokens
const userSessions = new Map<string, UserSession>();

// Store refresh timers
const refreshTimers = new Map<string, NodeJS.Timeout>();

/**
 * Register a user session with token data
 */
export function registerSession(sessionId: string, user: any, tokens: TokenData): void {
  userSessions.set(sessionId, {
    user,
    tokens,
    lastRefresh: Date.now(),
  });

  // Schedule token refresh
  scheduleTokenRefresh(sessionId);
}

/**
 * Get session data
 */
export function getSession(sessionId: string): UserSession | undefined {
  return userSessions.get(sessionId);
}

/**
 * Update session tokens
 */
export function updateSessionTokens(sessionId: string, tokens: TokenData): void {
  const session = userSessions.get(sessionId);
  if (session) {
    session.tokens = tokens;
    session.lastRefresh = Date.now();
    userSessions.set(sessionId, session);

    // Reschedule refresh
    scheduleTokenRefresh(sessionId);
  }
}

/**
 * Remove session
 */
export function removeSession(sessionId: string): void {
  // Clear refresh timer
  const timer = refreshTimers.get(sessionId);
  if (timer) {
    clearTimeout(timer);
    refreshTimers.delete(sessionId);
  }

  // Remove session
  userSessions.delete(sessionId);
}

/**
 * Schedule automatic token refresh
 * Refreshes 5 minutes before expiry
 */
function scheduleTokenRefresh(sessionId: string): void {
  // Clear existing timer
  const existingTimer = refreshTimers.get(sessionId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const session = userSessions.get(sessionId);
  if (!session || !session.tokens.refreshToken) {
    return; // No refresh token available
  }

  const now = Date.now();
  const expiresAt = session.tokens.expiresAt;
  const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry

  // Calculate when to refresh (5 minutes before expiry)
  const refreshAt = expiresAt - refreshBuffer;
  const delay = Math.max(0, refreshAt - now);

  // Don't schedule if already expired
  if (delay === 0 && now >= expiresAt) {
    console.log(`⚠️  Token already expired for session ${sessionId}`);
    return;
  }

  // Schedule refresh
  const timer = setTimeout(() => {
    console.log(`🔄 Refreshing token for session ${sessionId}`);
    refreshSessionToken(sessionId).catch(err => {
      console.error(`❌ Token refresh failed for session ${sessionId}:`, err.message);
    });
  }, delay);

  refreshTimers.set(sessionId, timer);

  const refreshIn = Math.round(delay / 1000 / 60); // minutes
  console.log(`⏰ Token refresh scheduled for session ${sessionId} in ${refreshIn} minutes`);
}

/**
 * Refresh a session's token
 */
async function refreshSessionToken(sessionId: string): Promise<void> {
  const session = userSessions.get(sessionId);
  if (!session || !session.tokens.refreshToken) {
    throw new Error('No session or refresh token available');
  }

  // Call the refresh callback if registered
  const callback = refreshCallbacks.get(sessionId);
  if (!callback) {
    throw new Error('No refresh callback registered');
  }

  try {
    const newTokens = await callback(session.tokens.refreshToken);
    updateSessionTokens(sessionId, newTokens);
    console.log(`✅ Token refreshed successfully for session ${sessionId}`);
  } catch (error) {
    console.error(`❌ Token refresh failed for session ${sessionId}:`, error);
    // Remove session on refresh failure
    removeSession(sessionId);
    throw error;
  }
}

/**
 * Token refresh callbacks
 * Each provider (GitHub, custom OAuth) registers its own refresh callback
 */
type RefreshCallback = (refreshToken: string) => Promise<TokenData>;
const refreshCallbacks = new Map<string, RefreshCallback>();

/**
 * Register a token refresh callback for a session
 */
export function registerRefreshCallback(sessionId: string, callback: RefreshCallback): void {
  refreshCallbacks.set(sessionId, callback);
}

/**
 * Check if token needs refresh
 */
export function needsRefresh(sessionId: string, bufferMinutes: number = 5): boolean {
  const session = userSessions.get(sessionId);
  if (!session) {
    return false;
  }

  const now = Date.now();
  const buffer = bufferMinutes * 60 * 1000;
  return (session.tokens.expiresAt - buffer) <= now;
}

/**
 * Get token for a session (with automatic refresh if needed)
 */
export async function getValidToken(sessionId: string): Promise<string | null> {
  const session = userSessions.get(sessionId);
  if (!session) {
    return null;
  }

  // Check if token needs refresh
  if (needsRefresh(sessionId)) {
    try {
      await refreshSessionToken(sessionId);
      const refreshedSession = userSessions.get(sessionId);
      return refreshedSession?.tokens.accessToken || null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  return session.tokens.accessToken;
}

/**
 * Get all active sessions (for monitoring)
 */
export function getActiveSessions(): Array<{
  sessionId: string;
  user: string;
  expiresAt: Date;
  hasRefreshToken: boolean;
}> {
  const sessions: Array<{
    sessionId: string;
    user: string;
    expiresAt: Date;
    hasRefreshToken: boolean;
  }> = [];

  userSessions.forEach((session, sessionId) => {
    sessions.push({
      sessionId,
      user: session.user.username || session.user.displayName || 'unknown',
      expiresAt: new Date(session.tokens.expiresAt),
      hasRefreshToken: !!session.tokens.refreshToken,
    });
  });

  return sessions;
}

/**
 * Clean up expired sessions
 */
export function cleanupExpiredSessions(): number {
  const now = Date.now();
  let removed = 0;

  userSessions.forEach((session, sessionId) => {
    // Remove if expired and no refresh token
    if (session.tokens.expiresAt < now && !session.tokens.refreshToken) {
      removeSession(sessionId);
      removed++;
    }
  });

  return removed;
}

/**
 * Start periodic cleanup of expired sessions
 * Runs every hour
 */
export function startPeriodicCleanup(intervalMs: number = 3600000): NodeJS.Timeout {
  return setInterval(() => {
    const removed = cleanupExpiredSessions();
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired session(s)`);
    }
  }, intervalMs);
}

