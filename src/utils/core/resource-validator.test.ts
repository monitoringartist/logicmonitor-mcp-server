/**
 * Tests for RFC 8707 Resource Indicators validator
 */

import { describe, it, expect } from '@jest/globals';
import {
  normalizeUrl,
  isValidResourceUri,
  validateResourceMatch,
  normalizeResources,
  validateResourceUris,
  determineAudience,
  isSupportedResource,
  getSupportedResources,
  processResourceParameter,
} from './resource-validator.js';

describe('Resource Validator', () => {
  describe('normalizeUrl', () => {
    it('should remove trailing slash from URL', () => {
      expect(normalizeUrl('http://localhost:3000/')).toBe('http://localhost:3000');
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
    });

    it('should preserve root slash', () => {
      expect(normalizeUrl('http://localhost:3000/')).toBe('http://localhost:3000');
    });

    it('should handle URLs without trailing slash', () => {
      expect(normalizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should remove trailing slash from paths', () => {
      expect(normalizeUrl('http://localhost:3000/api/')).toBe('http://localhost:3000/api');
      expect(normalizeUrl('https://example.com/path/to/resource/')).toBe('https://example.com/path/to/resource');
    });

    it('should preserve query strings', () => {
      expect(normalizeUrl('http://localhost:3000/?foo=bar')).toBe('http://localhost:3000?foo=bar');
      expect(normalizeUrl('http://localhost:3000/api/?foo=bar')).toBe('http://localhost:3000/api?foo=bar');
    });

    it('should preserve hash fragments', () => {
      expect(normalizeUrl('http://localhost:3000/#section')).toBe('http://localhost:3000#section');
      expect(normalizeUrl('http://localhost:3000/api/#section')).toBe('http://localhost:3000/api#section');
    });

    it('should handle complex URLs', () => {
      expect(normalizeUrl('https://example.com:8080/api/v1/?key=value#section'))
        .toBe('https://example.com:8080/api/v1?key=value#section');
    });

    it('should handle URLs with port numbers', () => {
      expect(normalizeUrl('http://localhost:3000/')).toBe('http://localhost:3000');
      expect(normalizeUrl('https://example.com:8443/')).toBe('https://example.com:8443');
    });

    it('should return invalid URLs as-is', () => {
      expect(normalizeUrl('not-a-url')).toBe('not-a-url');
      expect(normalizeUrl('')).toBe('');
    });

    it('should handle multiple trailing slashes', () => {
      expect(normalizeUrl('http://localhost:3000//')).toBe('http://localhost:3000/');
    });
  });

  describe('isValidResourceUri', () => {
    it('should accept valid absolute URIs', () => {
      expect(isValidResourceUri('http://localhost:3000')).toBe(true);
      expect(isValidResourceUri('https://example.com')).toBe(true);
      expect(isValidResourceUri('http://192.168.1.1:8080')).toBe(true);
    });

    it('should accept URIs with paths', () => {
      expect(isValidResourceUri('http://localhost:3000/api')).toBe(true);
      expect(isValidResourceUri('https://example.com/path/to/resource')).toBe(true);
    });

    it('should accept URIs with query strings', () => {
      expect(isValidResourceUri('http://localhost:3000?foo=bar')).toBe(true);
    });

    it('should reject relative URIs', () => {
      expect(isValidResourceUri('/api/v1')).toBe(false);
      expect(isValidResourceUri('api/v1')).toBe(false);
      expect(isValidResourceUri('../resource')).toBe(false);
    });

    it('should reject invalid URIs', () => {
      expect(isValidResourceUri('')).toBe(false);
      expect(isValidResourceUri('not-a-url')).toBe(false);
      expect(isValidResourceUri('http://')).toBe(false);
    });

    it('should reject URIs without scheme', () => {
      expect(isValidResourceUri('localhost:3000')).toBe(false);
      expect(isValidResourceUri('example.com')).toBe(false);
    });

    it('should accept various schemes', () => {
      expect(isValidResourceUri('https://example.com')).toBe(true);
      expect(isValidResourceUri('http://example.com')).toBe(true);
    });
  });

  describe('normalizeResources', () => {
    it('should convert string to array', () => {
      expect(normalizeResources('http://localhost:3000')).toEqual(['http://localhost:3000']);
    });

    it('should handle arrays', () => {
      const resources = ['http://localhost:3000', 'https://example.com'];
      expect(normalizeResources(resources)).toEqual(resources);
    });

    it('should handle space-separated strings', () => {
      expect(normalizeResources('http://localhost:3000 https://example.com'))
        .toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('should filter out empty strings', () => {
      expect(normalizeResources('')).toEqual([]);
      expect(normalizeResources('  ')).toEqual([]);
      expect(normalizeResources(['http://localhost:3000', '', 'https://example.com']))
        .toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('should handle undefined', () => {
      expect(normalizeResources(undefined)).toEqual([]);
    });

    it('should filter non-string values from arrays', () => {
      expect(normalizeResources(['http://localhost:3000', null as any, 'https://example.com']))
        .toEqual(['http://localhost:3000', 'https://example.com']);
    });
  });

  describe('validateResourceUris', () => {
    it('should validate all URIs in array', () => {
      const result = validateResourceUris([
        'http://localhost:3000',
        'https://example.com',
      ]);
      expect(result.valid).toBe(true);
      expect(result.invalidResources).toEqual([]);
    });

    it('should detect invalid URIs', () => {
      const result = validateResourceUris([
        'http://localhost:3000',
        'not-a-url',
        '/relative/path',
      ]);
      expect(result.valid).toBe(false);
      expect(result.invalidResources).toEqual(['not-a-url', '/relative/path']);
    });

    it('should handle empty array', () => {
      const result = validateResourceUris([]);
      expect(result.valid).toBe(true);
      expect(result.invalidResources).toEqual([]);
    });

    it('should validate complex URIs', () => {
      const result = validateResourceUris([
        'https://example.com:8443/api/v1?key=value#section',
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateResourceMatch', () => {
    it('should allow matching resources', () => {
      const result = validateResourceMatch('http://localhost:3000', 'http://localhost:3000');
      expect(result.valid).toBe(true);
    });

    it('should allow subset of authorized resources', () => {
      const result = validateResourceMatch(
        'http://localhost:3000',
        ['http://localhost:3000', 'https://example.com'],
      );
      expect(result.valid).toBe(true);
    });

    it('should reject unauthorized resources', () => {
      const result = validateResourceMatch(
        'https://unauthorized.com',
        'http://localhost:3000',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('was not authorized');
    });

    it('should handle URLs with trailing slashes', () => {
      const result = validateResourceMatch(
        'http://localhost:3000/',
        'http://localhost:3000',
      );
      expect(result.valid).toBe(true);
    });

    it('should normalize URLs before comparison', () => {
      const result = validateResourceMatch(
        'http://localhost:3000/',
        'http://localhost:3000',
      );
      expect(result.valid).toBe(true);
    });

    it('should allow no resources (backward compatibility)', () => {
      const result = validateResourceMatch(undefined, undefined);
      expect(result.valid).toBe(true);
    });

    it('should allow authorized but no requested resources', () => {
      const result = validateResourceMatch(undefined, 'http://localhost:3000');
      expect(result.valid).toBe(true);
    });

    it('should reject requested but no authorized resources', () => {
      const result = validateResourceMatch('http://localhost:3000', undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not included in authorization request');
    });

    it('should handle multiple requested resources', () => {
      const result = validateResourceMatch(
        ['http://localhost:3000', 'https://example.com'],
        ['http://localhost:3000', 'https://example.com', 'https://other.com'],
      );
      expect(result.valid).toBe(true);
    });

    it('should detect unauthorized resource in array', () => {
      const result = validateResourceMatch(
        ['http://localhost:3000', 'https://unauthorized.com'],
        'http://localhost:3000',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('https://unauthorized.com');
    });
  });

  describe('determineAudience', () => {
    const defaultAudience = 'http://localhost:3000';

    it('should use requested resources', () => {
      const audience = determineAudience(
        'https://example.com',
        undefined,
        defaultAudience,
      );
      expect(audience).toBe('https://example.com');
    });

    it('should fall back to authorized resources', () => {
      const audience = determineAudience(
        undefined,
        'https://example.com',
        defaultAudience,
      );
      expect(audience).toBe('https://example.com');
    });

    it('should use default audience when no resources', () => {
      const audience = determineAudience(undefined, undefined, defaultAudience);
      expect(audience).toBe('http://localhost:3000');
    });

    it('should return single resource as string', () => {
      const audience = determineAudience('https://example.com', undefined, defaultAudience);
      expect(typeof audience).toBe('string');
      expect(audience).toBe('https://example.com');
    });

    it('should return multiple resources as array', () => {
      const audience = determineAudience(
        ['http://localhost:3000', 'https://example.com'],
        undefined,
        defaultAudience,
      );
      expect(Array.isArray(audience)).toBe(true);
      expect(audience).toEqual(['http://localhost:3000', 'https://example.com']);
    });

    it('should normalize URLs in audience', () => {
      const audience = determineAudience(
        'http://localhost:3000/',
        undefined,
        defaultAudience,
      );
      expect(audience).toBe('http://localhost:3000');
    });

    it('should normalize default audience', () => {
      const audience = determineAudience(undefined, undefined, 'http://localhost:3000/');
      expect(audience).toBe('http://localhost:3000');
    });

    it('should prefer requested over authorized', () => {
      const audience = determineAudience(
        'https://requested.com',
        'https://authorized.com',
        defaultAudience,
      );
      expect(audience).toBe('https://requested.com');
    });
  });

  describe('isSupportedResource', () => {
    const supportedResources = ['http://localhost:3000', 'https://example.com'];

    it('should return true for supported resources', () => {
      expect(isSupportedResource('http://localhost:3000', supportedResources)).toBe(true);
      expect(isSupportedResource('https://example.com', supportedResources)).toBe(true);
    });

    it('should return false for unsupported resources', () => {
      expect(isSupportedResource('https://unsupported.com', supportedResources)).toBe(false);
    });

    it('should handle URLs with trailing slashes', () => {
      expect(isSupportedResource('http://localhost:3000/', supportedResources)).toBe(true);
      expect(isSupportedResource('https://example.com/', supportedResources)).toBe(true);
    });

    it('should normalize URLs before comparison', () => {
      const resources = ['http://localhost:3000/'];
      expect(isSupportedResource('http://localhost:3000', resources)).toBe(true);
    });

    it('should handle empty supported resources', () => {
      expect(isSupportedResource('http://localhost:3000', [])).toBe(false);
    });
  });

  describe('getSupportedResources', () => {
    it('should return base URL as supported resource', () => {
      const resources = getSupportedResources('http://localhost:3000');
      expect(resources).toEqual(['http://localhost:3000']);
    });

    it('should normalize base URL', () => {
      const resources = getSupportedResources('http://localhost:3000/');
      expect(resources).toEqual(['http://localhost:3000']);
    });

    it('should handle URLs with paths', () => {
      const resources = getSupportedResources('http://localhost:3000/api');
      expect(resources).toEqual(['http://localhost:3000/api']);
    });

    it('should handle URLs with ports', () => {
      const resources = getSupportedResources('https://example.com:8443');
      expect(resources).toEqual(['https://example.com:8443']);
    });
  });

  describe('processResourceParameter', () => {
    const baseUrl = 'http://localhost:3000';

    it('should accept valid resource matching base URL', () => {
      const result = processResourceParameter('http://localhost:3000', baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual(['http://localhost:3000']);
    });

    it('should accept resource with trailing slash', () => {
      const result = processResourceParameter('http://localhost:3000/', baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual(['http://localhost:3000']);
    });

    it('should accept multiple valid resources', () => {
      const result = processResourceParameter(
        ['http://localhost:3000', 'http://localhost:3000/'],
        baseUrl,
      );
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual(['http://localhost:3000', 'http://localhost:3000']);
    });

    it('should allow no resources (backward compatibility)', () => {
      const result = processResourceParameter(undefined, baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual([]);
    });

    it('should reject invalid URIs', () => {
      const result = processResourceParameter('not-a-url', baseUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_target');
      expect(result.error_description).toContain('Invalid resource URIs');
    });

    it('should reject relative URIs', () => {
      const result = processResourceParameter('/api/v1', baseUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_target');
    });

    it('should reject unsupported resources', () => {
      const result = processResourceParameter('https://unsupported.com', baseUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_target');
      expect(result.error_description).toContain('Unsupported resources');
      expect(result.error_description).toContain('This server supports');
    });

    it('should reject mix of valid and invalid URIs', () => {
      const result = processResourceParameter(
        ['http://localhost:3000', 'not-a-url'],
        baseUrl,
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBe('invalid_target');
    });

    it('should normalize returned resources', () => {
      const result = processResourceParameter('http://localhost:3000/', baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual(['http://localhost:3000']);
    });

    it('should handle space-separated resources', () => {
      const result = processResourceParameter(
        'http://localhost:3000 http://localhost:3000',
        baseUrl,
      );
      expect(result.valid).toBe(true);
      expect(result.resources.length).toBe(2);
    });

    it('should include supported resources in error message', () => {
      const result = processResourceParameter('https://wrong.com', baseUrl);
      expect(result.valid).toBe(false);
      expect(result.error_description).toContain('http://localhost:3000');
    });

    it('should handle empty string', () => {
      const result = processResourceParameter('', baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual([]);
    });

    it('should handle array with empty strings', () => {
      const result = processResourceParameter(['', 'http://localhost:3000'], baseUrl);
      expect(result.valid).toBe(true);
      expect(result.resources).toEqual(['http://localhost:3000']);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete OAuth flow with trailing slashes', () => {
      const baseUrl = 'http://localhost:3000';
      
      // Authorization request with trailing slash
      const authResult = processResourceParameter('http://localhost:3000/', baseUrl);
      expect(authResult.valid).toBe(true);
      
      // Token request with trailing slash
      const tokenResult = validateResourceMatch(
        'http://localhost:3000/',
        authResult.resources,
      );
      expect(tokenResult.valid).toBe(true);
      
      // Determine audience
      const audience = determineAudience(
        'http://localhost:3000/',
        authResult.resources,
        baseUrl,
      );
      expect(audience).toBe('http://localhost:3000');
    });

    it('should handle complete OAuth flow without trailing slashes', () => {
      const baseUrl = 'http://localhost:3000';
      
      // Authorization request
      const authResult = processResourceParameter('http://localhost:3000', baseUrl);
      expect(authResult.valid).toBe(true);
      
      // Token request
      const tokenResult = validateResourceMatch(
        'http://localhost:3000',
        authResult.resources,
      );
      expect(tokenResult.valid).toBe(true);
      
      // Determine audience
      const audience = determineAudience(
        'http://localhost:3000',
        authResult.resources,
        baseUrl,
      );
      expect(audience).toBe('http://localhost:3000');
    });

    it('should handle mixed trailing slashes in OAuth flow', () => {
      const baseUrl = 'http://localhost:3000';
      
      // Authorization with slash
      const authResult = processResourceParameter('http://localhost:3000/', baseUrl);
      expect(authResult.valid).toBe(true);
      
      // Token request without slash
      const tokenResult = validateResourceMatch(
        'http://localhost:3000',
        authResult.resources,
      );
      expect(tokenResult.valid).toBe(true);
    });

    it('should reject mismatched resources', () => {
      const baseUrl = 'http://localhost:3000';
      
      // Authorization for one resource
      const authResult = processResourceParameter('http://localhost:3000', baseUrl);
      expect(authResult.valid).toBe(true);
      
      // Token request for different resource
      const tokenResult = validateResourceMatch(
        'https://different.com',
        authResult.resources,
      );
      expect(tokenResult.valid).toBe(false);
    });
  });
});

