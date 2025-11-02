/**
 * Tests for error-handler module
 */

import { describe, it, expect } from '@jest/globals';
import {
  MCPError,
  ErrorCodes,
  ErrorSuggestions,
  createMCPError,
  isMCPError,
  formatErrorForUser,
} from './error-handler.js';

describe('MCPError', () => {
  it('should create an MCPError with all properties', () => {
    const error = new MCPError(
      'Test error message',
      'TEST_CODE',
      { detail: 'test detail' },
      ['suggestion 1', 'suggestion 2'],
    );

    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'test detail' });
    expect(error.suggestions).toEqual(['suggestion 1', 'suggestion 2']);
    expect(error.name).toBe('MCPError');
  });

  it('should create an MCPError without details and suggestions', () => {
    const error = new MCPError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toBeUndefined();
    expect(error.suggestions).toBeUndefined();
  });

  it('should convert to MCP response format', () => {
    const error = new MCPError(
      'Test error',
      'TEST_CODE',
      { detail: 'info' },
      ['suggestion'],
    );

    const response = error.toMCPResponse();

    expect(response).toEqual({
      error: 'TEST_CODE',
      message: 'Test error',
      details: { detail: 'info' },
      suggestions: ['suggestion'],
    });
  });

  it('should convert to JSON format', () => {
    const error = new MCPError(
      'Test error',
      'TEST_CODE',
      { detail: 'info' },
      ['suggestion'],
    );

    const json = error.toJSON();

    expect(json).toEqual({
      name: 'MCPError',
      message: 'Test error',
      code: 'TEST_CODE',
      details: { detail: 'info' },
      suggestions: ['suggestion'],
      stack: expect.any(String),
    });
  });
});

describe('ErrorCodes', () => {
  it('should have authentication error codes', () => {
    expect(ErrorCodes.AUTHENTICATION_FAILED).toBe('AUTHENTICATION_FAILED');
    expect(ErrorCodes.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS');
    expect(ErrorCodes.INVALID_TOKEN).toBe('INVALID_TOKEN');
  });

  it('should have device operation error codes', () => {
    expect(ErrorCodes.DEVICE_CREATE_FAILED).toBe('DEVICE_CREATE_FAILED');
    expect(ErrorCodes.DEVICE_UPDATE_FAILED).toBe('DEVICE_UPDATE_FAILED');
    expect(ErrorCodes.DEVICE_DELETE_FAILED).toBe('DEVICE_DELETE_FAILED');
    expect(ErrorCodes.DEVICE_NOT_FOUND).toBe('DEVICE_NOT_FOUND');
  });

  it('should have API error codes', () => {
    expect(ErrorCodes.API_REQUEST_FAILED).toBe('API_REQUEST_FAILED');
    expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCodes.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ErrorCodes.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
  });
});

describe('ErrorSuggestions', () => {
  it('should have authentication suggestions', () => {
    expect(ErrorSuggestions.authentication).toBeInstanceOf(Array);
    expect(ErrorSuggestions.authentication.length).toBeGreaterThan(0);
    expect(ErrorSuggestions.authentication[0]).toContain('LM_BEARER_TOKEN');
  });

  it('should have device create suggestions', () => {
    expect(ErrorSuggestions.deviceCreate).toBeInstanceOf(Array);
    expect(ErrorSuggestions.deviceCreate.length).toBeGreaterThan(0);
  });

  it('should have rate limit suggestions', () => {
    expect(ErrorSuggestions.rateLimit).toBeInstanceOf(Array);
    expect(ErrorSuggestions.rateLimit.length).toBeGreaterThan(0);
  });

  it('should have network error suggestions', () => {
    expect(ErrorSuggestions.networkError).toBeInstanceOf(Array);
    expect(ErrorSuggestions.networkError.length).toBeGreaterThan(0);
  });
});

describe('createMCPError', () => {
  it('should return existing MCPError unchanged', () => {
    const originalError = new MCPError('Original', 'ORIGINAL_CODE');
    const result = createMCPError(originalError, { operation: 'test' });

    expect(result).toBe(originalError);
  });

  it('should convert Error to MCPError', () => {
    const originalError = new Error('Test error');
    const result = createMCPError(originalError, {
      operation: 'test_operation',
      code: ErrorCodes.DEVICE_CREATE_FAILED,
      suggestions: ['suggestion 1'],
    });

    expect(result).toBeInstanceOf(MCPError);
    expect(result.message).toBe('Test error');
    expect(result.code).toBe(ErrorCodes.DEVICE_CREATE_FAILED);
    expect(result.details).toEqual({
      operation: 'test_operation',
      originalError: 'Test error',
    });
    expect(result.suggestions).toEqual(['suggestion 1']);
  });

  it('should convert string to MCPError', () => {
    const result = createMCPError('Error string', {
      operation: 'test_operation',
    });

    expect(result).toBeInstanceOf(MCPError);
    expect(result.message).toBe('Error string');
    expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
  });

  it('should use default error code if not provided', () => {
    const result = createMCPError('Test error', {
      operation: 'test_operation',
    });

    expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
  });

  it('should merge details correctly', () => {
    const result = createMCPError(new Error('Test'), {
      operation: 'test_op',
      details: { custom: 'value' },
    });

    expect(result.details).toEqual({
      operation: 'test_op',
      originalError: 'Test',
      custom: 'value',
    });
  });
});

describe('isMCPError', () => {
  it('should return true for MCPError', () => {
    const error = new MCPError('Test', 'TEST_CODE');
    expect(isMCPError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Test');
    expect(isMCPError(error)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isMCPError('error string')).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(isMCPError(null)).toBe(false);
    expect(isMCPError(undefined)).toBe(false);
  });
});

describe('formatErrorForUser', () => {
  it('should format MCPError with all details', () => {
    const error = new MCPError(
      'Device creation failed',
      'DEVICE_CREATE_FAILED',
      { deviceName: 'test-device', collectorId: 123 },
      ['Check collector ID', 'Verify device name'],
    );

    const formatted = formatErrorForUser(error);

    expect(formatted).toContain('Error: Device creation failed');
    expect(formatted).toContain('Details:');
    expect(formatted).toContain('test-device');
    expect(formatted).toContain('Suggestions:');
    expect(formatted).toContain('1. Check collector ID');
    expect(formatted).toContain('2. Verify device name');
  });

  it('should format MCPError without details', () => {
    const error = new MCPError('Test error', 'TEST_CODE');
    const formatted = formatErrorForUser(error);

    expect(formatted).toBe('Error: Test error\n');
  });

  it('should format MCPError with details but no suggestions', () => {
    const error = new MCPError(
      'Test error',
      'TEST_CODE',
      { detail: 'info' },
    );
    const formatted = formatErrorForUser(error);

    expect(formatted).toContain('Error: Test error');
    expect(formatted).toContain('Details:');
    expect(formatted).toContain('info');
    expect(formatted).not.toContain('Suggestions:');
  });

  it('should format regular Error', () => {
    const error = new Error('Regular error');
    const formatted = formatErrorForUser(error);

    expect(formatted).toBe('Error: Regular error');
  });

  it('should format string error', () => {
    const formatted = formatErrorForUser('String error');
    expect(formatted).toBe('Error: String error');
  });

  it('should format unknown error types', () => {
    const formatted = formatErrorForUser({ custom: 'object' });
    expect(formatted).toContain('Error:');
  });
});

describe('Error Integration', () => {
  it('should maintain error stack trace', () => {
    const error = new MCPError('Test', 'TEST_CODE');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('MCPError');
  });

  it('should be throwable and catchable', () => {
    expect(() => {
      throw new MCPError('Test', 'TEST_CODE');
    }).toThrow(MCPError);

    try {
      throw new MCPError('Test', 'TEST_CODE', {}, ['suggestion']);
    } catch (error) {
      expect(error).toBeInstanceOf(MCPError);
      if (isMCPError(error)) {
        expect(error.suggestions).toEqual(['suggestion']);
      }
    }
  });

  it('should work with instanceof checks', () => {
    const error = new MCPError('Test', 'TEST_CODE');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof MCPError).toBe(true);
  });
});

