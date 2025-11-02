/**
 * Tests for LogicMonitor API Error
 */

import { describe, it, expect } from '@jest/globals';
import { LogicMonitorApiError } from './lm-error.js';

describe('LogicMonitorApiError', () => {
  describe('Constructor', () => {
    it('should create error with all properties', () => {
      const error = new LogicMonitorApiError('Test error', {
        status: 400,
        errorCode: 1400,
        errorMessage: 'Bad Request',
        errorDetail: 'Invalid parameter',
        path: '/device/devices',
        duration: 125,
      });

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LogicMonitorApiError');
      expect(error.status).toBe(400);
      expect(error.errorCode).toBe(1400);
      expect(error.errorMessage).toBe('Bad Request');
      expect(error.errorDetail).toBe('Invalid parameter');
      expect(error.path).toBe('/device/devices');
      expect(error.duration).toBe(125);
    });

    it('should create error with minimal properties', () => {
      const error = new LogicMonitorApiError('Test error', {
        status: 500,
        path: '/test',
      });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(500);
      expect(error.path).toBe('/test');
      expect(error.errorCode).toBeUndefined();
      expect(error.errorMessage).toBeUndefined();
      expect(error.errorDetail).toBeUndefined();
      expect(error.duration).toBeUndefined();
    });

    it('should have proper error name', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 404,
        path: '/test',
      });

      expect(error.name).toBe('LogicMonitorApiError');
    });

    it('should be instance of Error', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 500,
        path: '/test',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LogicMonitorApiError);
    });

    it('should have stack trace', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 500,
        path: '/test',
      });

      expect(error.stack).toBeDefined();
    });
  });

  describe('toMCPError', () => {
    it('should format error with all fields', () => {
      const error = new LogicMonitorApiError('Test error', {
        status: 400,
        errorCode: 1400,
        errorMessage: 'Bad Request',
        errorDetail: 'Invalid parameter value',
        path: '/device/devices/123',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('HTTP 400');
      expect(formatted).toContain('Bad Request');
      expect(formatted).toContain('(LM Error 1400)');
      expect(formatted).toContain('Invalid parameter value');
      expect(formatted).toContain('[/device/devices/123]');
    });

    it('should format error with minimal fields', () => {
      const error = new LogicMonitorApiError('Test error', {
        status: 500,
        path: '/test',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toBe('HTTP 500 [/test]');
    });

    it('should include error code when present', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 404,
        errorCode: 1404,
        path: '/device/devices/999',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('(LM Error 1404)');
    });

    it('should include error message when present', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 403,
        errorMessage: 'Forbidden',
        path: '/admin',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('Forbidden');
    });

    it('should include error detail when present', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 400,
        errorDetail: 'Parameter "name" is required',
        path: '/test',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('- Parameter "name" is required');
    });

    it('should handle null error detail', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 400,
        errorDetail: null,
        path: '/test',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).not.toContain('null');
      expect(formatted).toContain('HTTP 400');
    });

    it('should format complete error message correctly', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 429,
        errorCode: 1429,
        errorMessage: 'Too Many Requests',
        errorDetail: 'Rate limit exceeded',
        path: '/device/devices',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toBe('HTTP 429 Too Many Requests (LM Error 1429) - Rate limit exceeded [/device/devices]');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON with all fields', () => {
      const error = new LogicMonitorApiError('Test error', {
        status: 400,
        errorCode: 1400,
        errorMessage: 'Bad Request',
        errorDetail: 'Invalid parameter',
        path: '/device/devices',
        duration: 150,
      });

      const json = error.toJSON();
      
      expect(json).toEqual({
        error: 'LogicMonitor API Error',
        status: 400,
        errorCode: 1400,
        errorMessage: 'Bad Request',
        errorDetail: 'Invalid parameter',
        path: '/device/devices',
        duration: 150,
      });
    });

    it('should serialize error with minimal fields', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 500,
        path: '/test',
      });

      const json = error.toJSON();
      
      expect(json).toEqual({
        error: 'LogicMonitor API Error',
        status: 500,
        errorCode: undefined,
        errorMessage: undefined,
        errorDetail: undefined,
        path: '/test',
        duration: undefined,
      });
    });

    it('should be JSON stringifiable', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 404,
        errorMessage: 'Not Found',
        path: '/device/devices/999',
      });

      const jsonString = JSON.stringify(error);
      const parsed = JSON.parse(jsonString);
      
      expect(parsed.error).toBe('LogicMonitor API Error');
      expect(parsed.status).toBe(404);
      expect(parsed.errorMessage).toBe('Not Found');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should handle 400 Bad Request', () => {
      const error = new LogicMonitorApiError('Bad Request', {
        status: 400,
        errorMessage: 'Bad Request',
        path: '/test',
      });

      expect(error.status).toBe(400);
      expect(error.toMCPError()).toContain('HTTP 400');
    });

    it('should handle 401 Unauthorized', () => {
      const error = new LogicMonitorApiError('Unauthorized', {
        status: 401,
        errorMessage: 'Unauthorized',
        path: '/test',
      });

      expect(error.status).toBe(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new LogicMonitorApiError('Forbidden', {
        status: 403,
        errorMessage: 'Forbidden',
        path: '/test',
      });

      expect(error.status).toBe(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new LogicMonitorApiError('Not Found', {
        status: 404,
        errorMessage: 'Not Found',
        path: '/device/devices/999',
      });

      expect(error.status).toBe(404);
    });

    it('should handle 429 Too Many Requests', () => {
      const error = new LogicMonitorApiError('Rate Limited', {
        status: 429,
        errorMessage: 'Too Many Requests',
        path: '/test',
      });

      expect(error.status).toBe(429);
    });

    it('should handle 500 Internal Server Error', () => {
      const error = new LogicMonitorApiError('Server Error', {
        status: 500,
        errorMessage: 'Internal Server Error',
        path: '/test',
      });

      expect(error.status).toBe(500);
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new LogicMonitorApiError('Service Unavailable', {
        status: 503,
        errorMessage: 'Service Unavailable',
        path: '/test',
      });

      expect(error.status).toBe(503);
    });
  });

  describe('Error Codes', () => {
    it('should store LM-specific error codes', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 400,
        errorCode: 1007,
        path: '/test',
      });

      expect(error.errorCode).toBe(1007);
      expect(error.toMCPError()).toContain('(LM Error 1007)');
    });

    it('should handle missing error codes', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 400,
        path: '/test',
      });

      expect(error.errorCode).toBeUndefined();
      expect(error.toMCPError()).not.toContain('(LM Error');
    });
  });

  describe('Duration tracking', () => {
    it('should store request duration', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 500,
        path: '/test',
        duration: 5000,
      });

      expect(error.duration).toBe(5000);
      expect(error.toJSON()).toHaveProperty('duration', 5000);
    });

    it('should handle missing duration', () => {
      const error = new LogicMonitorApiError('Test', {
        status: 500,
        path: '/test',
      });

      expect(error.duration).toBeUndefined();
    });
  });

  describe('Path tracking', () => {
    it('should store API endpoint path', () => {
      const paths = [
        '/device/devices',
        '/device/devices/123',
        '/alert/alerts',
        '/dashboard/dashboards/456',
        '/santaba/rest/device/devices',
      ];

      paths.forEach(path => {
        const error = new LogicMonitorApiError('Test', {
          status: 400,
          path,
        });

        expect(error.path).toBe(path);
        expect(error.toMCPError()).toContain(`[${path}]`);
      });
    });
  });

  describe('Error inheritance', () => {
    it('should be catchable as Error', () => {
      try {
        throw new LogicMonitorApiError('Test', {
          status: 500,
          path: '/test',
        });
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        if (e instanceof LogicMonitorApiError) {
          expect(e.status).toBe(500);
        }
      }
    });

    it('should preserve stack trace', () => {
      try {
        throw new LogicMonitorApiError('Test', {
          status: 500,
          path: '/test',
        });
      } catch (e) {
        if (e instanceof Error) {
          expect(e.stack).toBeDefined();
          expect(e.stack).toContain('LogicMonitorApiError');
        }
      }
    });
  });

  describe('Real-world scenarios', () => {
    it('should format rate limit error', () => {
      const error = new LogicMonitorApiError('Rate limit exceeded', {
        status: 429,
        errorCode: 1429,
        errorMessage: 'Too Many Requests',
        errorDetail: 'API rate limit of 1000 requests per minute exceeded',
        path: '/device/devices',
        duration: 50,
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('HTTP 429');
      expect(formatted).toContain('Too Many Requests');
      expect(formatted).toContain('API rate limit');
    });

    it('should format authentication error', () => {
      const error = new LogicMonitorApiError('Authentication failed', {
        status: 401,
        errorCode: 1401,
        errorMessage: 'Unauthorized',
        errorDetail: 'Invalid API token',
        path: '/device/devices',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('HTTP 401');
      expect(formatted).toContain('Invalid API token');
    });

    it('should format validation error', () => {
      const error = new LogicMonitorApiError('Validation failed', {
        status: 400,
        errorCode: 1007,
        errorMessage: 'Validation failed',
        errorDetail: 'Field "displayName" is required',
        path: '/device/devices',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('HTTP 400');
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('displayName');
    });

    it('should format not found error', () => {
      const error = new LogicMonitorApiError('Resource not found', {
        status: 404,
        errorCode: 1404,
        errorMessage: 'Resource not found',
        errorDetail: 'Device with ID 12345 does not exist',
        path: '/device/devices/12345',
      });

      const formatted = error.toMCPError();
      
      expect(formatted).toContain('HTTP 404');
      expect(formatted).toContain('not found');
    });
  });
});

