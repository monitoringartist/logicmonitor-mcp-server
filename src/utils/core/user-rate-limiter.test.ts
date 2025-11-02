/**
 * Tests for UserRateLimiter
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserRateLimiter, UserRateLimitError } from './user-rate-limiter.js';

describe('UserRateLimiter', () => {
  let limiter: UserRateLimiter;

  beforeEach(() => {
    jest.useFakeTimers();
    limiter = new UserRateLimiter({ tokensPerMinute: 60 });
  });

  afterEach(() => {
    limiter.destroy();
    jest.useRealTimers();
  });

  describe('checkLimit', () => {
    it('should allow requests within rate limit', () => {
      const userId = 'user1';
      
      // First request should be allowed
      expect(limiter.checkLimit(userId)).toBe(true);
      
      // Should allow up to 60 requests per minute
      for (let i = 0; i < 59; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }
    });

    it('should block requests when rate limit exceeded', () => {
      const userId = 'user1';
      
      // Consume all 60 tokens
      for (let i = 0; i < 60; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }
      
      // 61st request should be blocked
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it('should refill tokens over time', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      // Should be blocked
      expect(limiter.checkLimit(userId)).toBe(false);
      
      // Advance time by 1 second (should refill 1 token)
      jest.advanceTimersByTime(1000);
      
      // Should be allowed now
      expect(limiter.checkLimit(userId)).toBe(true);
      
      // Should be blocked again
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it('should refill multiple tokens after longer period', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      // Advance time by 10 seconds (should refill 10 tokens)
      jest.advanceTimersByTime(10000);
      
      // Should allow 10 requests
      for (let i = 0; i < 10; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }
      
      // 11th request should be blocked
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it('should not exceed max burst tokens', () => {
      const userId = 'user1';
      
      // Wait a very long time
      jest.advanceTimersByTime(600000); // 10 minutes
      
      // Should only have 60 tokens, not more
      for (let i = 0; i < 60; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }
      
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it('should handle multiple users independently', () => {
      const user1 = 'user1';
      const user2 = 'user2';
      
      // User1 consumes all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(user1);
      }
      
      // User1 should be blocked
      expect(limiter.checkLimit(user1)).toBe(false);
      
      // User2 should still be allowed
      expect(limiter.checkLimit(user2)).toBe(true);
    });

    it('should support custom rate limit per user', () => {
      const userId = 'user1';
      const customLimit = 120; // 120 requests per minute
      
      // Should allow 120 requests with custom limit
      for (let i = 0; i < 120; i++) {
        expect(limiter.checkLimit(userId, customLimit)).toBe(true);
      }
      
      // 121st should be blocked
      expect(limiter.checkLimit(userId, customLimit)).toBe(false);
    });
  });

  describe('enforceLimit', () => {
    it('should not throw error when within limit', () => {
      const userId = 'user1';
      
      expect(() => limiter.enforceLimit(userId)).not.toThrow();
    });

    it('should throw UserRateLimitError when limit exceeded', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.enforceLimit(userId);
      }
      
      // Should throw on next request
      expect(() => limiter.enforceLimit(userId)).toThrow(UserRateLimitError);
    });

    it('should include retry after info in error', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      try {
        limiter.enforceLimit(userId);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(UserRateLimitError);
        if (error instanceof UserRateLimitError) {
          expect(error.userId).toBe(userId);
          expect(error.retryAfterMs).toBeGreaterThan(0);
          expect(error.message).toContain('Rate limit exceeded');
        }
      }
    });
  });

  describe('getRemainingTokens', () => {
    it('should return full tokens for new user', () => {
      const userId = 'user1';
      expect(limiter.getRemainingTokens(userId)).toBe(60);
    });

    it('should return correct remaining tokens after consumption', () => {
      const userId = 'user1';
      
      // Consume 10 tokens
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit(userId);
      }
      
      expect(limiter.getRemainingTokens(userId)).toBe(50);
    });

    it('should account for refilled tokens', () => {
      const userId = 'user1';
      
      // Consume 30 tokens
      for (let i = 0; i < 30; i++) {
        limiter.checkLimit(userId);
      }
      
      // Advance time by 5 seconds (should refill 5 tokens)
      jest.advanceTimersByTime(5000);
      
      // Should have 30 remaining + 5 refilled = 35
      expect(limiter.getRemainingTokens(userId)).toBe(35);
    });
  });

  describe('getRetryAfter', () => {
    it('should return 0 when tokens available', () => {
      const userId = 'user1';
      expect(limiter.getRetryAfter(userId)).toBe(0);
    });

    it('should return time until next token available', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      const retryAfter = limiter.getRetryAfter(userId);
      
      // Should be approximately 1000ms (1 second per token at 60/minute)
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(1000);
    });
  });

  describe('resetUser', () => {
    it('should reset rate limit for specific user', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      // Should be blocked
      expect(limiter.checkLimit(userId)).toBe(false);
      
      // Reset user
      limiter.resetUser(userId);
      
      // Should be allowed again
      expect(limiter.checkLimit(userId)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all rate limit data', () => {
      // Add multiple users
      limiter.checkLimit('user1');
      limiter.checkLimit('user2');
      limiter.checkLimit('user3');
      
      expect(limiter.getUserCount()).toBe(3);
      
      limiter.clear();
      
      expect(limiter.getUserCount()).toBe(0);
    });
  });

  describe('getUserCount and getTrackedUsers', () => {
    it('should return correct user count', () => {
      expect(limiter.getUserCount()).toBe(0);
      
      limiter.checkLimit('user1');
      expect(limiter.getUserCount()).toBe(1);
      
      limiter.checkLimit('user2');
      expect(limiter.getUserCount()).toBe(2);
      
      // Same user shouldn't increase count
      limiter.checkLimit('user1');
      expect(limiter.getUserCount()).toBe(2);
    });

    it('should return list of tracked users', () => {
      limiter.checkLimit('user1');
      limiter.checkLimit('user2');
      limiter.checkLimit('user3');
      
      const users = limiter.getTrackedUsers();
      expect(users).toContain('user1');
      expect(users).toContain('user2');
      expect(users).toContain('user3');
      expect(users.length).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should remove stale users after cleanup interval', () => {
      const limiterWithCleanup = new UserRateLimiter({
        tokensPerMinute: 60,
        cleanupIntervalMs: 60000, // 1 minute
      });

      try {
        limiterWithCleanup.checkLimit('user1');
        expect(limiterWithCleanup.getUserCount()).toBe(1);

        // Advance past stale threshold (10 minutes)
        jest.advanceTimersByTime(700000);

        // Trigger cleanup
        jest.advanceTimersByTime(60000);

        // User should be removed
        expect(limiterWithCleanup.getUserCount()).toBe(0);
      } finally {
        limiterWithCleanup.destroy();
      }
    });
  });

  describe('custom configuration', () => {
    it('should support custom tokens per minute', () => {
      const customLimiter = new UserRateLimiter({ tokensPerMinute: 120 });
      const userId = 'user1';

      try {
        // Should allow 120 requests
        for (let i = 0; i < 120; i++) {
          expect(customLimiter.checkLimit(userId)).toBe(true);
        }

        // 121st should be blocked
        expect(customLimiter.checkLimit(userId)).toBe(false);
      } finally {
        customLimiter.destroy();
      }
    });

    it('should support custom max burst', () => {
      const customLimiter = new UserRateLimiter({
        tokensPerMinute: 60,
        maxBurst: 100,
      });
      const userId = 'user1';

      try {
        // Advance time significantly to test burst
        jest.advanceTimersByTime(600000); // 10 minutes

        // Should allow up to maxBurst (100), not more
        for (let i = 0; i < 100; i++) {
          expect(customLimiter.checkLimit(userId)).toBe(true);
        }

        // 101st should be blocked
        expect(customLimiter.checkLimit(userId)).toBe(false);
      } finally {
        customLimiter.destroy();
      }
    });
  });

  describe('destroy', () => {
    it('should clean up resources on destroy', () => {
      const testLimiter = new UserRateLimiter();
      
      testLimiter.checkLimit('user1');
      expect(testLimiter.getUserCount()).toBe(1);
      
      testLimiter.destroy();
      
      expect(testLimiter.getUserCount()).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid successive requests', () => {
      const userId = 'user1';
      
      // Make 100 requests rapidly
      let allowed = 0;
      let blocked = 0;
      
      for (let i = 0; i < 100; i++) {
        if (limiter.checkLimit(userId)) {
          allowed++;
        } else {
          blocked++;
        }
      }
      
      expect(allowed).toBe(60);
      expect(blocked).toBe(40);
    });

    it('should handle zero remaining tokens correctly', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      expect(limiter.getRemainingTokens(userId)).toBe(0);
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it('should handle partial token refill', () => {
      const userId = 'user1';
      
      // Consume all tokens
      for (let i = 0; i < 60; i++) {
        limiter.checkLimit(userId);
      }
      
      // Advance by 500ms (0.5 seconds = 0.5 tokens, should floor to 0)
      jest.advanceTimersByTime(500);
      
      expect(limiter.checkLimit(userId)).toBe(false);
      
      // Advance another 500ms (total 1 second = 1 token)
      jest.advanceTimersByTime(500);
      
      expect(limiter.checkLimit(userId)).toBe(true);
    });
  });
});

