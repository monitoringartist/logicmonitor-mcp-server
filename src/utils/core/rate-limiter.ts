/**
 * Rate Limiting Utility for LogicMonitor API
 *
 * Handles rate limit detection, backoff, and retry logic based on:
 * - X-Rate-Limit-Limit: Request limit per window
 * - X-Rate-Limit-Remaining: Requests left for the time window
 * - X-Rate-Limit-Window: Rolling time window in seconds
 */

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    window: number;
    resetTime: number;
  }

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  }

export class RateLimiter {
  private currentLimits = new Map<string, RateLimitInfo>();
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 60000, // 60 seconds
    backoffMultiplier: 2,
  };

  /**
     * Extract rate limit information from response headers
     */
  extractRateLimitInfo(headers: Headers): RateLimitInfo | null {
    const limit = parseInt(headers.get('x-rate-limit-limit') || '');
    const remaining = parseInt(headers.get('x-rate-limit-remaining') || '');
    const window = parseInt(headers.get('x-rate-limit-window') || '');

    if (isNaN(limit) || isNaN(remaining) || isNaN(window)) {
      return null;
    }

    return {
      limit,
      remaining,
      window,
      resetTime: Date.now() + window * 1000,
    };
  }

  /**
     * Update stored rate limit info for a given key (e.g., API endpoint)
     */
  updateRateLimitInfo(key: string, info: RateLimitInfo | null): void {
    if (info) {
      this.currentLimits.set(key, info);
    }
  }

  /**
     * Check if we should preemptively back off based on remaining requests
     */
  shouldBackoff(key: string, threshold: number = 10): boolean {
    const info = this.currentLimits.get(key);
    if (!info) return false;

    // Back off if we're getting close to the limit
    return info.remaining <= threshold;
  }

  /**
     * Calculate backoff delay based on attempt number
     */
  calculateBackoff(attempt: number, options?: RetryOptions): number {
    const opts = { ...this.defaultOptions, ...options };
    const delay = Math.min(
      opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
      opts.maxDelay,
    );

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
     * Calculate delay based on rate limit reset time
     */
  calculateDelayUntilReset(key: string): number {
    const info = this.currentLimits.get(key);
    if (!info || !info.resetTime) return 0;

    const now = Date.now();
    const delay = Math.max(0, info.resetTime - now);

    // Add small buffer to ensure we're past the reset
    return delay + 1000;
  }

  /**
     * Check if error is a rate limit error
     */
  isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('429') || message.includes('rate limit');
    }
    return false;
  }

  /**
     * Execute a function with retry logic for rate limits
     */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    key: string,
    options?: RetryOptions,
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        // Check if we should preemptively back off
        if (this.shouldBackoff(key)) {
          const delay = this.calculateDelayUntilReset(key);
          if (delay > 0) {
            await this.sleep(delay);
          }
        }

        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!this.isRateLimitError(error)) {
          throw error; // Not a rate limit error, don't retry
        }

        if (attempt === opts.maxRetries) {
          break; // No more retries
        }

        // Calculate delay for exponential backoff
        const delay = this.calculateBackoff(attempt, options);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
     * Get current rate limit info for a key
     */
  getRateLimitInfo(key: string): RateLimitInfo | undefined {
    return this.currentLimits.get(key);
  }

  /**
     * Clear stored rate limit info
     */
  clear(): void {
    this.currentLimits.clear();
  }

  /**
     * Sleep for specified milliseconds
     */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
