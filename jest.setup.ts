/**
 * Jest global setup for test cleanup
 *
 * This file handles cleanup of resources after each test suite to prevent
 * worker process hanging and ensure graceful test termination.
 */

// Track active timers and intervals for cleanup
const activeTimers = new Set<NodeJS.Timeout>();
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// Wrap setTimeout to track timers
global.setTimeout = function(callback: any, ms?: number, ...args: any[]): NodeJS.Timeout {
  const timer = originalSetTimeout(callback, ms, ...args);
  activeTimers.add(timer);
  return timer;
} as typeof setTimeout;

// Wrap setInterval to track intervals
global.setInterval = function(callback: any, ms?: number, ...args: any[]): NodeJS.Timeout {
  const interval = originalSetInterval(callback, ms, ...args);
  activeTimers.add(interval);
  return interval;
} as typeof setInterval;

// Wrap clearTimeout to untrack timers
global.clearTimeout = function(timer: NodeJS.Timeout | undefined): void {
  if (timer) {
    activeTimers.delete(timer);
    originalClearTimeout(timer);
  }
} as typeof clearTimeout;

// Wrap clearInterval to untrack intervals
global.clearInterval = function(interval: NodeJS.Timeout | undefined): void {
  if (interval) {
    activeTimers.delete(interval);
    originalClearInterval(interval);
  }
} as typeof clearInterval;

afterAll(async () => {
  // Clear all tracked timers and intervals
  for (const timer of activeTimers) {
    originalClearTimeout(timer);
  }
  activeTimers.clear();

  // Wait for pending promises to resolve
  await new Promise(resolve => setImmediate(resolve));

  // Give a bit more time for any async cleanup
  await new Promise(resolve => originalSetTimeout(resolve, 100));
});

afterEach(async () => {
  // Minimal cleanup after each test
  await new Promise(resolve => setImmediate(resolve));
});
