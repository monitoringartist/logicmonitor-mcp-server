/**
 * Per-User Rate Limiting Middleware
 *
 * Implements token bucket algorithm for rate limiting on a per-user basis.
 * This prevents individual users from overwhelming the server with too many requests.
 */

export interface UserRateLimitConfig {
  tokensPerMinute?: number; // Default: 60 requests per minute
  maxBurst?: number; // Maximum tokens that can accumulate (default: same as tokensPerMinute)
  cleanupIntervalMs?: number; // How often to clean up stale entries (default: 5 minutes)
}

export interface UserLimit {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
}

export class UserRateLimitError extends Error {
  constructor(
    message: string,
    public userId: string,
    public retryAfterMs: number,
  ) {
    super(message);
    this.name = 'UserRateLimitError';
  }
}

export class UserRateLimiter {
  private userLimits = new Map<string, UserLimit>();
  private readonly tokensPerMinute: number;
  private readonly maxBurst: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: UserRateLimitConfig = {}) {
    this.tokensPerMinute = config.tokensPerMinute || 60;
    this.maxBurst = config.maxBurst || this.tokensPerMinute;

    // Start cleanup interval to prevent memory leaks
    const cleanupIntervalMs = config.cleanupIntervalMs || 300000; // 5 minutes
    this.startCleanup(cleanupIntervalMs);
  }

  /**
   * Check if a user has available tokens and consume one if available
   * @param userId - Unique identifier for the user
   * @param tokensPerMinute - Optional override for rate limit (defaults to constructor value)
   * @returns true if request is allowed, false if rate limited
   */
  checkLimit(userId: string, tokensPerMinute?: number): boolean {
    const limit = tokensPerMinute || this.tokensPerMinute;
    const maxTokens = tokensPerMinute || this.maxBurst;
    const now = Date.now();
    const userLimit = this.userLimits.get(userId) || {
      tokens: maxTokens,
      lastRefill: now,
      maxTokens: maxTokens,
    };

    // Update maxTokens if custom limit is provided and it's higher
    if (tokensPerMinute && tokensPerMinute > userLimit.maxTokens) {
      userLimit.maxTokens = tokensPerMinute;
    }

    // Token bucket algorithm: refill tokens based on elapsed time
    const elapsed = now - userLimit.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 60000) * limit);

    if (tokensToAdd > 0) {
      userLimit.tokens = Math.min(
        userLimit.maxTokens,
        userLimit.tokens + tokensToAdd,
      );
      userLimit.lastRefill = now;
    }

    // Check if user has available tokens
    if (userLimit.tokens < 1) {
      this.userLimits.set(userId, userLimit);
      return false; // Rate limit exceeded
    }

    // Consume one token
    userLimit.tokens -= 1;
    this.userLimits.set(userId, userLimit);
    return true;
  }

  /**
   * Check rate limit and throw error if exceeded
   * @param userId - Unique identifier for the user
   * @param tokensPerMinute - Optional override for rate limit
   * @throws UserRateLimitError if rate limit is exceeded
   */
  enforceLimit(userId: string, tokensPerMinute?: number): void {
    if (!this.checkLimit(userId, tokensPerMinute)) {
      const retryAfterMs = this.getRetryAfter(userId);
      throw new UserRateLimitError(
        `Rate limit exceeded for user ${userId}. Try again in ${Math.ceil(retryAfterMs / 1000)} seconds.`,
        userId,
        retryAfterMs,
      );
    }
  }

  /**
   * Get the number of tokens remaining for a user
   * @param userId - Unique identifier for the user
   * @returns Number of available tokens (0 if user not found)
   */
  getRemainingTokens(userId: string): number {
    const userLimit = this.userLimits.get(userId);
    if (!userLimit) return this.tokensPerMinute;

    // Calculate current tokens with refill
    const now = Date.now();
    const elapsed = now - userLimit.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 60000) * this.tokensPerMinute);

    return Math.min(
      userLimit.maxTokens,
      userLimit.tokens + tokensToAdd,
    );
  }

  /**
   * Calculate how long until a token is available
   * @param userId - Unique identifier for the user
   * @returns Milliseconds until next token is available
   */
  getRetryAfter(userId: string): number {
    const userLimit = this.userLimits.get(userId);
    if (!userLimit || userLimit.tokens >= 1) return 0;

    // Calculate time until next token
    const msPerToken = 60000 / this.tokensPerMinute;
    const tokensNeeded = 1 - userLimit.tokens;
    return Math.ceil(tokensNeeded * msPerToken);
  }

  /**
   * Reset rate limit for a specific user
   * @param userId - Unique identifier for the user
   */
  resetUser(userId: string): void {
    this.userLimits.delete(userId);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.userLimits.clear();
  }

  /**
   * Get the number of users being tracked
   * @returns Number of users in the rate limiter
   */
  getUserCount(): number {
    return this.userLimits.size;
  }

  /**
   * Get all user IDs currently being tracked
   * @returns Array of user IDs
   */
  getTrackedUsers(): string[] {
    return Array.from(this.userLimits.keys());
  }

  /**
   * Start periodic cleanup of stale user entries
   * Removes entries that haven't been accessed recently
   * @param intervalMs - Cleanup interval in milliseconds
   */
  private startCleanup(intervalMs: number): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 600000; // 10 minutes

      for (const [userId, userLimit] of this.userLimits.entries()) {
        // Remove users who haven't made requests in 10+ minutes
        if (now - userLimit.lastRefill > staleThreshold) {
          this.userLimits.delete(userId);
        }
      }
    }, intervalMs);

    // Prevent the interval from keeping the process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop the cleanup interval and clean up resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instance with default configuration
export const userRateLimiter = new UserRateLimiter();

