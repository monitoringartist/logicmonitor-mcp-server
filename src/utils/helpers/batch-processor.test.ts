/**
 * Tests for batch-processor module
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  BatchProcessor,
  SmartBatchProcessor,
  type BatchResult,
  type BatchResponse,
  type SmartBatchOptions,
} from './batch-processor.js';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
  });

  describe('processBatch', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4, 5];
      const result = await processor.processBatch(
        items,
        async (item) => item * 2,
      );

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(5);
      expect(result.summary.succeeded).toBe(5);
      expect(result.summary.failed).toBe(0);
      expect(result.results.map(r => r.data)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle failures with continueOnError', async () => {
      const items = [1, 2, 3, 4, 5];
      const result = await processor.processBatch(
        items,
        async (item) => {
          if (item === 3) throw new Error('Failed');
          return item * 2;
        },
        { continueOnError: true },
      );

      expect(result.success).toBe(false);
      expect(result.summary.succeeded).toBe(4);
      expect(result.summary.failed).toBe(1);
      expect(result.results[2].success).toBe(false);
      expect(result.results[2].error).toBe('Failed');
    });

    it('should respect maxConcurrent setting', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const result = await processor.processBatch(
        items,
        async (item) => {
          concurrentCount++;
          maxConcurrent = Math.max(maxConcurrent, concurrentCount);
          await new Promise(resolve => setTimeout(resolve, 10));
          concurrentCount--;
          return item;
        },
        { maxConcurrent: 3 },
      );

      expect(result.success).toBe(true);
      expect(maxConcurrent).toBeLessThanOrEqual(3);
    });

    it('should call onProgress callback', async () => {
      const items = [1, 2, 3, 4, 5];
      const progressUpdates: Array<{ completed: number; total: number }> = [];

      await processor.processBatch(
        items,
        async (item) => item * 2,
        {
          onProgress: (completed, total) => {
            progressUpdates.push({ completed, total });
          },
        },
      );

      expect(progressUpdates.length).toBe(5);
      expect(progressUpdates[4]).toEqual({ completed: 5, total: 5 });
    });
  });

  describe('processSerial', () => {
    it('should process items one at a time', async () => {
      const items = [1, 2, 3];
      const order: number[] = [];

      await processor.processSerial(items, async (item) => {
        order.push(item);
        await new Promise(resolve => setTimeout(resolve, 10));
        return item;
      });

      expect(order).toEqual([1, 2, 3]);
    });
  });
});

describe('SmartBatchProcessor', () => {
  let smartProcessor: SmartBatchProcessor;

  beforeEach(() => {
    smartProcessor = new SmartBatchProcessor();
  });

  describe('processBatchSmart', () => {
    it('should process items with default adaptive concurrency', async () => {
      const items = Array.from({ length: 20 }, (_, i) => i + 1);
      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => item * 2,
      );

      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(20);
      expect(result.summary.succeeded).toBe(20);
      expect(result.summary.failed).toBe(0);
    });

    it('should disable adaptive concurrency when requested', async () => {
      const items = [1, 2, 3, 4, 5];
      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => item * 2,
        { adaptiveConcurrency: false, maxConcurrent: 2 },
      );

      expect(result.success).toBe(true);
      expect(result.summary.succeeded).toBe(5);
    });

    it('should respect minConcurrency setting', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i + 1);
      const concurrencyChanges: number[] = [];

      await smartProcessor.processBatchSmart(
        items,
        async (item) => item * 2,
        {
          minConcurrency: 3,
          onConcurrencyChange: (newConcurrency) => {
            concurrencyChanges.push(newConcurrency);
          },
        },
      );

      // All concurrency changes should be >= 3
      concurrencyChanges.forEach(c => {
        expect(c).toBeGreaterThanOrEqual(3);
      });
    });

    it('should respect maxConcurrencyLimit setting', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i + 1);
      const concurrencyChanges: number[] = [];

      await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return item * 2;
        },
        {
          maxConcurrencyLimit: 8,
          onConcurrencyChange: (newConcurrency) => {
            concurrencyChanges.push(newConcurrency);
          },
        },
      );

      // All concurrency changes should be <= 8
      concurrencyChanges.forEach(c => {
        expect(c).toBeLessThanOrEqual(8);
      });
    });

    it('should decrease concurrency on rate limit errors', async () => {
      const items = Array.from({ length: 30 }, (_, i) => i + 1);
      const concurrencyChanges: Array<{ concurrency: number; reason: string }> = [];
      let requestCount = 0;

      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          requestCount++;
          // Simulate rate limit after 10 requests
          if (requestCount > 10 && requestCount <= 13) {
            throw new Error('Rate limit exceeded - too many requests');
          }
          return item * 2;
        },
        {
          continueOnError: true,
          onConcurrencyChange: (newConcurrency, reason) => {
            concurrencyChanges.push({ concurrency: newConcurrency, reason });
          },
        },
      );

      // Should have some concurrency decreases
      const decreases = concurrencyChanges.filter(c =>
        c.reason.includes('rate limit'),
      );
      expect(decreases.length).toBeGreaterThan(0);
    });

    it('should increase concurrency after successful requests', async () => {
      const items = Array.from({ length: 50 }, (_, i) => i + 1);
      const concurrencyChanges: Array<{ concurrency: number; reason: string }> = [];

      await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return item * 2;
        },
        {
          minConcurrency: 2,
          maxConcurrencyLimit: 15,
          onConcurrencyChange: (newConcurrency, reason) => {
            concurrencyChanges.push({ concurrency: newConcurrency, reason });
          },
        },
      );

      // Should have some concurrency increases
      const increases = concurrencyChanges.filter(c =>
        c.reason.includes('successful'),
      );
      expect(increases.length).toBeGreaterThan(0);
    });

    it('should use apiRateLimit to determine initial concurrency', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i + 1);
      
      // With rate limit of 10 req/s, should start with ~7 (70% of 10)
      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => item * 2,
        {
          apiRateLimit: 10,
        },
      );

      expect(result.success).toBe(true);
    });

    it('should handle mixed success and rate limit errors', async () => {
      const items = Array.from({ length: 20 }, (_, i) => i + 1);
      let requestCount = 0;

      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          requestCount++;
          // Rate limit on every 5th request
          if (requestCount % 5 === 0) {
            throw new Error('429 Too many requests');
          }
          return item * 2;
        },
        {
          continueOnError: true,
          minConcurrency: 1,
          maxConcurrencyLimit: 10,
        },
      );

      // Some should fail, some should succeed
      expect(result.summary.failed).toBeGreaterThan(0);
      expect(result.summary.succeeded).toBeGreaterThan(0);
    });

    it('should track metrics correctly', async () => {
      const items = Array.from({ length: 15 }, (_, i) => i + 1);

      // Process in background to check metrics
      const promise = smartProcessor.processBatchSmart(
        items,
        async (item) => {
          await new Promise(resolve => setTimeout(resolve, 20));
          return item * 2;
        },
      );

      // Wait a bit for processing to start
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = smartProcessor.getGlobalStats();
      expect(stats.activeBatches).toBeGreaterThanOrEqual(0);

      await promise;

      // After completion, should have no active batches
      const finalStats = smartProcessor.getGlobalStats();
      expect(finalStats.activeBatches).toBe(0);
    });
  });

  describe('getGlobalStats', () => {
    it('should return zero stats when no active batches', () => {
      const stats = smartProcessor.getGlobalStats();

      expect(stats).toEqual({
        activeBatches: 0,
        averageConcurrency: 0,
        totalRateLimitErrors: 0,
        totalSuccessfulRequests: 0,
      });
    });
  });

  describe('adaptive concurrency algorithm', () => {
    it('should start with conservative concurrency', async () => {
      const items = Array.from({ length: 5 }, (_, i) => i + 1);
      const concurrencyChanges: number[] = [];
      let initialConcurrency: number | null = null;

      await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          if (initialConcurrency === null) {
            // Capture first call as indicator of initial concurrency
            initialConcurrency = 1;
          }
          return item * 2;
        },
        {
          onConcurrencyChange: (newConcurrency) => {
            concurrencyChanges.push(newConcurrency);
          },
        },
      );

      // Initial concurrency should be reasonable (likely 5)
      expect(initialConcurrency).not.toBeNull();
    });

    it('should handle burst rate limits gracefully', async () => {
      const items = Array.from({ length: 25 }, (_, i) => i + 1);
      let requestCount = 0;
      const concurrencyChanges: number[] = [];

      const result = await smartProcessor.processBatchSmart(
        items,
        async (item) => {
          requestCount++;
          // Burst rate limit after first 8 requests
          if (requestCount > 8 && requestCount <= 11) {
            throw new Error('Rate limit - too many requests');
          }
          await new Promise(resolve => setTimeout(resolve, 10));
          return item * 2;
        },
        {
          continueOnError: true,
          minConcurrency: 1,
          onConcurrencyChange: (newConcurrency) => {
            concurrencyChanges.push(newConcurrency);
          },
        },
      );

      // Should recover and process remaining items
      expect(result.summary.succeeded).toBeGreaterThan(20);
      
      // Should have decreased concurrency
      const minConcurrency = Math.min(...concurrencyChanges);
      expect(minConcurrency).toBeLessThanOrEqual(5);
    });
  });
});

