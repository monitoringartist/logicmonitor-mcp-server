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
          // Validate index is a safe integer within bounds
          if (!Number.isSafeInteger(actualIndex) || actualIndex < 0 || actualIndex >= items.length) {
            throw new Error(`Invalid index: ${actualIndex}`);
          }

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
          // Validate index before assignment
          if (Number.isSafeInteger(actualIndex) && actualIndex >= 0 && actualIndex < items.length) {
            results[actualIndex] = {
              index: actualIndex,
              success: false,
              error: errorMessage,
            };
          }

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

/**
 * Smart Batch Processor with adaptive concurrency
 * Automatically adjusts concurrency based on API rate limits
 */
export interface SmartBatchOptions extends BatchOptions {
  /** Target API rate limit in requests per second (default: auto-detect) */
  apiRateLimit?: number;
  /** Enable adaptive concurrency adjustment (default: true) */
  adaptiveConcurrency?: boolean;
  /** Minimum concurrency to maintain (default: 1) */
  minConcurrency?: number;
  /** Maximum concurrency allowed (default: 20) */
  maxConcurrencyLimit?: number;
  /** Callback for concurrency changes */
  onConcurrencyChange?: (newConcurrency: number, reason: string) => void;
}

interface ConcurrencyMetrics {
  successfulRequests: number;
  rateLimitErrors: number;
  totalRequests: number;
  lastAdjustmentTime: number;
  currentConcurrency: number;
  consecutiveSuccesses: number;
  consecutiveRateLimits: number;
}

export class SmartBatchProcessor extends BatchProcessor {
  private metrics: Map<string, ConcurrencyMetrics> = new Map();
  private readonly ADJUSTMENT_INTERVAL = 5000; // 5 seconds
  private readonly SUCCESS_THRESHOLD = 10; // consecutive successes to increase
  private readonly RATE_LIMIT_THRESHOLD = 2; // consecutive rate limits to decrease

  /**
   * Process batch with intelligent adaptive concurrency
   */
  async processBatchSmart<TInput, TOutput>(
    items: TInput[],
    processor: ProcessorFunction<TInput, TOutput>,
    options: SmartBatchOptions = {},
  ): Promise<BatchResponse<TOutput>> {
    const {
      adaptiveConcurrency = true,
      minConcurrency = 3,
      maxConcurrencyLimit = 20,
      apiRateLimit,
      onConcurrencyChange,
      ...batchOptions
    } = options;

    if (!adaptiveConcurrency) {
      // Use standard batch processing if adaptive mode is disabled
      return this.processBatch(items, processor, batchOptions);
    }

    // Initialize metrics for this batch
    const batchId = `batch-${Date.now()}`;
    const initialConcurrency = await this.determineOptimalConcurrency(
      batchId,
      minConcurrency,
      maxConcurrencyLimit,
      apiRateLimit,
    );

    this.initializeMetrics(batchId, initialConcurrency);

    const results: BatchResult<TOutput>[] = [];
    const total = items.length;
    let completed = 0;
    let currentConcurrency = initialConcurrency;

    // Create a wrapped processor that tracks metrics
    const wrappedProcessor = async (item: TInput, index: number): Promise<TOutput> => {
      const metrics = this.metrics.get(batchId)!;
      metrics.totalRequests++;

      try {
        const result = await processor(item, index);
        metrics.successfulRequests++;
        metrics.consecutiveSuccesses++;
        metrics.consecutiveRateLimits = 0;
        
        // Consider increasing concurrency after consecutive successes
        if (metrics.consecutiveSuccesses >= this.SUCCESS_THRESHOLD) {
          const newConcurrency = this.increaseConcurrency(
            currentConcurrency,
            maxConcurrencyLimit,
          );
          if (newConcurrency > currentConcurrency) {
            currentConcurrency = newConcurrency;
            metrics.currentConcurrency = newConcurrency;
            metrics.consecutiveSuccesses = 0;
            if (onConcurrencyChange) {
              onConcurrencyChange(newConcurrency, 'Increased after successful requests');
            }
          }
        }

        return result;
      } catch (error) {
        // Check if this is a rate limit error
        if (this.isRateLimitError(error)) {
          metrics.rateLimitErrors++;
          metrics.consecutiveRateLimits++;
          metrics.consecutiveSuccesses = 0;

          // Decrease concurrency immediately on rate limit
          if (metrics.consecutiveRateLimits >= this.RATE_LIMIT_THRESHOLD) {
            const newConcurrency = this.decreaseConcurrency(
              currentConcurrency,
              minConcurrency,
            );
            if (newConcurrency < currentConcurrency) {
              currentConcurrency = newConcurrency;
              metrics.currentConcurrency = newConcurrency;
              metrics.consecutiveRateLimits = 0;
              if (onConcurrencyChange) {
                onConcurrencyChange(newConcurrency, 'Decreased due to rate limits');
              }
            }
          }
        }
        throw error;
      }
    };

    // Process with adaptive concurrency
    const continueOnError = batchOptions.continueOnError ?? true;
    const onProgress = batchOptions.onProgress;

    let i = 0;
    while (i < items.length) {
      // Use current concurrency for this chunk
      const chunkSize = Math.min(currentConcurrency, items.length - i);
      const chunk = items.slice(i, i + chunkSize);

      const chunkPromises = chunk.map(async (item, chunkIndex) => {
        const actualIndex = i + chunkIndex;

        try {
          const result = await wrappedProcessor(item, actualIndex);
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

      await Promise.all(chunkPromises);

      // Move to next chunk
      i += chunkSize;

      // Get updated concurrency for next iteration
      const metrics = this.metrics.get(batchId);
      if (metrics) {
        currentConcurrency = metrics.currentConcurrency;
      }
    }

    // Cleanup metrics
    this.metrics.delete(batchId);

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
   * Determine optimal starting concurrency
   */
  private async determineOptimalConcurrency(
    batchId: string,
    minConcurrency: number,
    maxConcurrency: number,
    apiRateLimit?: number,
  ): Promise<number> {
    // If API rate limit is specified, use it to calculate concurrency
    if (apiRateLimit && apiRateLimit > 0) {
      // Conservative: use 70% of rate limit to avoid hitting it
      const calculated = Math.floor(apiRateLimit * 0.7);
      return Math.max(minConcurrency, Math.min(calculated, maxConcurrency));
    }

    // Check if we have historical data for similar batches
    const historicalConcurrency = this.getHistoricalOptimalConcurrency();
    if (historicalConcurrency) {
      return Math.max(minConcurrency, Math.min(historicalConcurrency, maxConcurrency));
    }

    // Start conservative with moderate concurrency
    return Math.max(minConcurrency, Math.min(5, maxConcurrency));
  }

  /**
   * Initialize metrics for a batch
   */
  private initializeMetrics(batchId: string, initialConcurrency: number): void {
    this.metrics.set(batchId, {
      successfulRequests: 0,
      rateLimitErrors: 0,
      totalRequests: 0,
      lastAdjustmentTime: Date.now(),
      currentConcurrency: initialConcurrency,
      consecutiveSuccesses: 0,
      consecutiveRateLimits: 0,
    });
  }

  /**
   * Get historical optimal concurrency from past batches
   */
  private getHistoricalOptimalConcurrency(): number | null {
    // In a production system, this could query metrics from a database
    // For now, return null to use default
    return null;
  }

  /**
   * Check if error is a rate limit error
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429')
      );
    }
    return false;
  }

  /**
   * Increase concurrency gradually
   */
  private increaseConcurrency(current: number, max: number): number {
    // Increase by 20% or add 1, whichever is larger
    const increase = Math.max(1, Math.floor(current * 0.2));
    return Math.min(current + increase, max);
  }

  /**
   * Decrease concurrency aggressively when rate limited
   */
  private decreaseConcurrency(current: number, min: number): number {
    // Decrease by 50% to quickly back off from rate limits
    const decrease = Math.max(1, Math.floor(current * 0.5));
    return Math.max(current - decrease, min);
  }

  /**
   * Get current metrics for a batch (useful for monitoring)
   */
  getMetrics(batchId: string): ConcurrencyMetrics | undefined {
    return this.metrics.get(batchId);
  }

  /**
   * Get current concurrency statistics across all active batches
   */
  getGlobalStats(): {
    activeBatches: number;
    averageConcurrency: number;
    totalRateLimitErrors: number;
    totalSuccessfulRequests: number;
  } {
    const batches = Array.from(this.metrics.values());
    
    if (batches.length === 0) {
      return {
        activeBatches: 0,
        averageConcurrency: 0,
        totalRateLimitErrors: 0,
        totalSuccessfulRequests: 0,
      };
    }

    const totalConcurrency = batches.reduce((sum, m) => sum + m.currentConcurrency, 0);
    const totalRateLimits = batches.reduce((sum, m) => sum + m.rateLimitErrors, 0);
    const totalSuccess = batches.reduce((sum, m) => sum + m.successfulRequests, 0);

    return {
      activeBatches: batches.length,
      averageConcurrency: totalConcurrency / batches.length,
      totalRateLimitErrors: totalRateLimits,
      totalSuccessfulRequests: totalSuccess,
    };
  }
}

// Singleton instances
export const batchProcessor = new BatchProcessor();
export const smartBatchProcessor = new SmartBatchProcessor();
