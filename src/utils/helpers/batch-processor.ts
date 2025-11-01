/**
 * Batch Processing Utility
 *
 * Handles batch operations with:
 * - Configurable concurrency control
 * - Rate limit awareness
 * - Partial failure handling
 * - Progress tracking
 */

import { rateLimiter } from '../core/rate-limiter.js';

export interface BatchResult<T> {
  index: number;
  success: boolean;
  data?: T;
  error?: string;
}

export interface BatchResponse<T> {
  success: boolean;
  results: BatchResult<T>[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface BatchOptions {
  /** Maximum number of concurrent operations (default: 5) */
  maxConcurrent?: number;
  /** Continue processing even if some items fail (default: true) */
  continueOnError?: boolean;
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number) => void;
  /** Retry on rate limit errors (default: true) */
  retryOnRateLimit?: boolean;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelay?: number;
}

export type ProcessorFunction<TInput, TOutput> = (
  item: TInput,
  index: number
) => Promise<TOutput>;

export class BatchProcessor {
  /**
   * Process an array of items with the given processor function
   */
  async processBatch<TInput, TOutput>(
    items: TInput[],
    processor: ProcessorFunction<TInput, TOutput>,
    options: BatchOptions = {},
  ): Promise<BatchResponse<TOutput>> {
    const {
      maxConcurrent = 5,
      continueOnError = true,
      onProgress,
      retryOnRateLimit = true,
      maxRetries = 3,
      retryDelay = 1000,
    } = options;

    const results: BatchResult<TOutput>[] = [];
    const total = items.length;
    let completed = 0;

    // Process items in chunks based on maxConcurrent
    for (let i = 0; i < items.length; i += maxConcurrent) {
      const chunk = items.slice(i, i + maxConcurrent);
      const chunkPromises = chunk.map(async (item, chunkIndex) => {
        const actualIndex = i + chunkIndex;

        try {
          let result: TOutput;

          if (retryOnRateLimit) {
            result = await this.executeWithRetry(
              () => processor(item, actualIndex),
              maxRetries,
              retryDelay,
            );
          } else {
            result = await processor(item, actualIndex);
          }

          results[actualIndex] = {
            index: actualIndex,
            success: true,
            data: result,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results[actualIndex] = {
            index: actualIndex,
            success: false,
            error: errorMessage,
          };

          if (!continueOnError) {
            throw error;
          }
        }

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      });

      // Wait for chunk to complete before processing next chunk
      await Promise.all(chunkPromises);
    }

    // Calculate summary
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: failed === 0,
      results,
      summary: {
        total,
        succeeded,
        failed,
      },
    };
  }

  /**
   * Execute a function with retry logic for rate limit errors using the rate limiter
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    retryDelay: number,
  ): Promise<T> {
    return rateLimiter.executeWithRetry(fn, 'api-request', {
      maxRetries,
      initialDelay: retryDelay,
      backoffMultiplier: 2,
    });
  }

  /**
   * Process items one at a time (serial processing)
   */
  async processSerial<TInput, TOutput>(
    items: TInput[],
    processor: ProcessorFunction<TInput, TOutput>,
    options: Omit<BatchOptions, 'maxConcurrent'> = {},
  ): Promise<BatchResponse<TOutput>> {
    return this.processBatch(items, processor, { ...options, maxConcurrent: 1 });
  }

  /**
   * Process all items in parallel (use with caution for rate-limited APIs)
   */
  async processParallel<TInput, TOutput>(
    items: TInput[],
    processor: ProcessorFunction<TInput, TOutput>,
    options: Omit<BatchOptions, 'maxConcurrent'> = {},
  ): Promise<BatchResponse<TOutput>> {
    return this.processBatch(items, processor, {
      ...options,
      maxConcurrent: items.length,
    });
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();
