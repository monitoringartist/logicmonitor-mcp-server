/**
 * Usage Examples for UserRateLimiter
 *
 * This file demonstrates how to use the per-user rate limiting functionality
 */

import { UserRateLimiter, UserRateLimitError, userRateLimiter } from './user-rate-limiter.js';

// Example 1: Using the singleton instance with default settings (60 requests/minute)
function example1() {
  const userId = 'user123';

  if (userRateLimiter.checkLimit(userId)) {
    console.log('Request allowed');
    // Process the request
  } else {
    console.log('Rate limit exceeded');
    const retryAfter = userRateLimiter.getRetryAfter(userId);
    console.log(`Retry after ${Math.ceil(retryAfter / 1000)} seconds`);
  }
}

// Example 2: Using enforceLimit to throw errors automatically
async function example2() {
  const userId = 'user456';

  try {
    userRateLimiter.enforceLimit(userId);
    // Process the request
    console.log('Request processed successfully');
  } catch (error) {
    if (error instanceof UserRateLimitError) {
      console.error(`Rate limit exceeded for ${error.userId}`);
      console.error(`Retry after ${error.retryAfterMs}ms`);
    }
  }
}

// Example 3: Custom rate limit per user
function example3() {
  const premiumUserId = 'premium123';
  const standardUserId = 'standard456';

  // Premium users get 120 requests/minute
  if (userRateLimiter.checkLimit(premiumUserId, 120)) {
    console.log('Premium request allowed');
  }

  // Standard users get default 60 requests/minute
  if (userRateLimiter.checkLimit(standardUserId)) {
    console.log('Standard request allowed');
  }
}

// Example 4: Creating a custom rate limiter instance
function example4() {
  const customLimiter = new UserRateLimiter({
    tokensPerMinute: 100, // 100 requests per minute
    maxBurst: 150, // Allow bursts up to 150 requests
    cleanupIntervalMs: 300000, // Clean up stale users every 5 minutes
  });

  const userId = 'user789';

  if (customLimiter.checkLimit(userId)) {
    console.log('Request allowed with custom limits');
  }

  // Don't forget to clean up when done
  customLimiter.destroy();
}

// Example 5: Monitoring rate limit status
function example5() {
  const userId = 'user999';

  console.log(`Remaining tokens: ${userRateLimiter.getRemainingTokens(userId)}`);
  console.log(`Retry after: ${userRateLimiter.getRetryAfter(userId)}ms`);

  // Make a request
  userRateLimiter.checkLimit(userId);

  console.log(`After request - Remaining: ${userRateLimiter.getRemainingTokens(userId)}`);
}

// Example 6: Managing users
function example6() {
  // Get user count
  console.log(`Total users tracked: ${userRateLimiter.getUserCount()}`);

  // Get list of tracked users
  const users = userRateLimiter.getTrackedUsers();
  console.log('Tracked users:', users);

  // Reset a specific user's limit
  userRateLimiter.resetUser('user123');

  // Clear all users
  userRateLimiter.clear();
}

// Example 7: Integration with MCP server middleware
async function mcpMiddleware(userId: string, operation: () => Promise<any>) {
  try {
    // Check rate limit before processing
    userRateLimiter.enforceLimit(userId);

    // Process the MCP request
    const result = await operation();
    return result;
  } catch (error) {
    if (error instanceof UserRateLimitError) {
      // Return rate limit error to client
      return {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message,
          retryAfter: Math.ceil(error.retryAfterMs / 1000),
        },
      };
    }
    throw error;
  }
}

// Example 8: Express-style middleware (if using HTTP transport)
function expressMiddleware(req: any, res: any, next: any) {
  const userId = req.user?.id || req.ip; // Use user ID or IP address

  try {
    userRateLimiter.enforceLimit(userId);
    next();
  } catch (error) {
    if (error instanceof UserRateLimitError) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(error.retryAfterMs / 1000),
      });
    } else {
      next(error);
    }
  }
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  mcpMiddleware,
  expressMiddleware,
};

