/**
 * Tests for rate limiter utilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { rateLimiter } from './rate-limiter.js';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset rate limiter state before each test
    rateLimiter.updateRateLimitInfo('test', {
      remaining: 100,
      limit: 100,
      resetTime: Date.now() + 60000,
      window: 60,
    });
  });

  describe('extractRateLimitInfo', () => {
    it('should extract rate limit info from headers', () => {
      const headers = new Headers({
        'x-rate-limit-limit': '100',
        'x-rate-limit-remaining': '75',
        'x-rate-limit-reset': '1640000000',
        'x-rate-limit-window': '60',
      });

      const info = rateLimiter.extractRateLimitInfo(headers);
      expect(info).toBeDefined();
      expect(info?.limit).toBe(100);
      expect(info?.remaining).toBe(75);
      // resetTime is calculated as Date.now() + window * 1000, not from the header
      expect(info?.resetTime).toBeGreaterThan(Date.now());
      expect(info?.window).toBe(60);
    });

    it('should return null for missing headers', () => {
      const headers = new Headers();
      const info = rateLimiter.extractRateLimitInfo(headers);
      expect(info).toBeNull();
    });

    it('should handle partial headers', () => {
      const headers = new Headers({
        'x-rate-limit-limit': '100',
      });

      const info = rateLimiter.extractRateLimitInfo(headers);
      // Should still return null if not all required headers present
      expect(info).toBeNull();
    });
  });

  describe('updateRateLimitInfo', () => {
    it('should update rate limit info for a category', () => {
      const info = {
        remaining: 50,
        limit: 100,
        resetTime: Date.now() + 30000,
        window: 60,
      };

      rateLimiter.updateRateLimitInfo('test-category', info);
      const retrieved = rateLimiter.getRateLimitInfo('test-category');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.remaining).toBe(50);
      expect(retrieved?.limit).toBe(100);
    });
  });

  describe('getRateLimitInfo', () => {
    it('should return rate limit info for existing category', () => {
      const info = rateLimiter.getRateLimitInfo('test');
      expect(info).toBeDefined();
      expect(info?.remaining).toBe(100);
    });

    it('should return undefined for non-existent category', () => {
      const info = rateLimiter.getRateLimitInfo('non-existent');
      expect(info).toBeUndefined();
    });
  });

  describe('shouldBackoff', () => {
    it('should return false when plenty of requests remaining', () => {
      rateLimiter.updateRateLimitInfo('test', {
        remaining: 50,
        limit: 100,
        resetTime: Date.now() + 60000,
        window: 60,
      });

      expect(rateLimiter.shouldBackoff('test')).toBe(false);
    });

    it('should return true when few requests remaining', () => {
      rateLimiter.updateRateLimitInfo('test', {
        remaining: 5,
        limit: 100,
        resetTime: Date.now() + 60000,
        window: 60,
      });

      expect(rateLimiter.shouldBackoff('test')).toBe(true);
    });

    it('should return false for unknown category', () => {
      expect(rateLimiter.shouldBackoff('unknown')).toBe(false);
    });

    it('should respect custom threshold', () => {
      rateLimiter.updateRateLimitInfo('test', {
        remaining: 15,
        limit: 100,
        resetTime: Date.now() + 60000,
        window: 60,
      });

      expect(rateLimiter.shouldBackoff('test', 20)).toBe(true);
      expect(rateLimiter.shouldBackoff('test', 10)).toBe(false);
    });
  });

  describe('calculateDelayUntilReset', () => {
    it('should return 0 when no rate limit info', () => {
      expect(rateLimiter.calculateDelayUntilReset('unknown')).toBe(0);
    });

    it('should calculate delay until reset time', () => {
      const resetTime = Date.now() + 5000; // 5 seconds from now
      rateLimiter.updateRateLimitInfo('test', {
        remaining: 0,
        limit: 100,
        resetTime,
        window: 60,
      });

      const delay = rateLimiter.calculateDelayUntilReset('test');
      expect(delay).toBeGreaterThan(4000); // At least 4 seconds (with 1s buffer)
      expect(delay).toBeLessThanOrEqual(6000); // At most 6 seconds
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = rateLimiter.calculateBackoff(1);
      const delay2 = rateLimiter.calculateBackoff(2);
      const delay3 = rateLimiter.calculateBackoff(3);

      expect(delay1).toBeGreaterThan(900); // ~1000ms with jitter
      expect(delay1).toBeLessThan(1200);
      expect(delay2).toBeGreaterThan(1800); // ~2000ms with jitter
      expect(delay2).toBeLessThan(2400);
      expect(delay3).toBeGreaterThan(3600); // ~4000ms with jitter
      expect(delay3).toBeLessThan(4800);
    });

    it('should respect maxDelay option', () => {
      const delay = rateLimiter.calculateBackoff(10, { maxDelay: 5000 });
      expect(delay).toBeLessThanOrEqual(5500); // Max + jitter
    });
  });

  describe('isRateLimitError', () => {
    it('should detect 429 errors', () => {
      const error = new Error('HTTP 429: Rate limit exceeded');
      expect(rateLimiter.isRateLimitError(error)).toBe(true);
    });

    it('should detect rate limit text', () => {
      const error = new Error('Rate limit exceeded');
      expect(rateLimiter.isRateLimitError(error)).toBe(true);
    });

    it('should return false for non-rate-limit errors', () => {
      const error = new Error('Network error');
      expect(rateLimiter.isRateLimitError(error)).toBe(false);
    });

    it('should handle non-Error objects', () => {
      expect(rateLimiter.isRateLimitError('some string')).toBe(false);
      expect(rateLimiter.isRateLimitError(null)).toBe(false);
    });
  });
});

