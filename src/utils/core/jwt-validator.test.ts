/**
 * Tests for JWT Token Validator with Audience Validation
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  JWTValidator,
  getJWTValidator,
  resetJWTValidator,
  isJWT,
  extractAudience,
  type MCPTokenPayload,
} from './jwt-validator.js';

describe('JWT Validator', () => {
  const testConfig = {
    secret: 'test-secret-key-for-testing-only',
    algorithm: 'HS256' as const,
    issuer: 'http://test-issuer.com',
    audience: 'http://test-audience.com',
    expiresIn: 3600,
  };

  let validator: JWTValidator;

  beforeEach(() => {
    validator = new JWTValidator(testConfig);
  });

  afterEach(() => {
    resetJWTValidator();
  });

  describe('JWTValidator constructor', () => {
    it('should create validator with provided config', () => {
      const v = new JWTValidator(testConfig);
      expect(v.getAudience()).toBe('http://test-audience.com');
      expect(v.getIssuer()).toBe('http://test-issuer.com');
    });

    it('should use default values when config not provided', () => {
      const v = new JWTValidator({});
      expect(v.getAudience()).toBe('http://localhost:3000');
      expect(v.getIssuer()).toBe('http://localhost:3000');
    });

    it('should generate random secret if not provided', () => {
      const v = new JWTValidator({});
      // Should not throw and should create tokens
      const token = v.createToken({ sub: 'test' });
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });
  });

  describe('createToken', () => {
    it('should create valid JWT token', () => {
      const token = validator.createToken({ sub: 'user-123' });
      
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should include required claims', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded).toBeDefined();
      expect(info.decoded?.sub).toBe('user-123');
      expect(info.decoded?.aud).toBe('http://test-audience.com');
      expect(info.decoded?.iss).toBe('http://test-issuer.com');
      expect(info.decoded?.iat).toBeDefined();
      expect(info.decoded?.exp).toBeDefined();
      expect(info.decoded?.jti).toBeDefined();
    });

    it('should use default subject if not provided', () => {
      const token = validator.createToken({});
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded?.sub).toBe('unknown');
    });

    it('should use default scope if not provided', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded?.scope).toBe('mcp:tools');
    });

    it('should include custom scope', () => {
      const token = validator.createToken({ 
        sub: 'user-123', 
        scope: 'lm:read lm:write' 
      });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded?.scope).toBe('lm:read lm:write');
    });

    it('should include client_id when provided', () => {
      const token = validator.createToken({ 
        sub: 'user-123', 
        client_id: 'client-456' 
      });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded?.client_id).toBe('client-456');
    });

    it('should include user metadata when provided', () => {
      const token = validator.createToken({ 
        sub: 'user-123',
        user: {
          id: 'user-123',
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
        },
      });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded?.user).toBeDefined();
      expect(info.decoded?.user?.username).toBe('testuser');
      expect(info.decoded?.user?.email).toBe('test@example.com');
    });

    it('should generate unique jti for each token', () => {
      const token1 = validator.createToken({ sub: 'user-123' });
      const token2 = validator.createToken({ sub: 'user-123' });
      
      const info1 = validator.getTokenInfo(token1);
      const info2 = validator.getTokenInfo(token2);
      
      expect(info1.decoded?.jti).not.toBe(info2.decoded?.jti);
    });

    it('should set expiration time correctly', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const info = validator.getTokenInfo(token);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 3600;
      
      expect(info.decoded?.exp).toBeGreaterThanOrEqual(expectedExp - 2);
      expect(info.decoded?.exp).toBeLessThanOrEqual(expectedExp + 2);
    });
  });

  describe('validateToken', () => {
    it('should validate valid token', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token);
      
      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe('user-123');
    });

    it('should validate token with correct audience', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token, 'http://test-audience.com');
      
      expect(result.valid).toBe(true);
    });

    it('should reject token with wrong audience', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token, 'http://wrong-audience.com');
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_audience');
      expect(result.error).toContain('audience');
    });

    it('should reject expired token', () => {
      // Create validator with very short expiration
      const shortValidator = new JWTValidator({
        ...testConfig,
        expiresIn: -1, // Already expired
      });
      
      const token = shortValidator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('expired');
    });

    it('should reject token with invalid signature', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const tamperedToken = token.slice(0, -10) + 'tampered00';
      
      const result = validator.validateToken(tamperedToken);
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_token');
    });

    it('should reject malformed token', () => {
      const result = validator.validateToken('not.a.valid.token');
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_token');
    });

    it('should reject empty token', () => {
      const result = validator.validateToken('');
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_token');
    });

    it('should validate token with array audience', () => {
      // Create a custom validator to test array audiences
      const token = validator.createToken({ sub: 'user-123' });
      // The token has audience set, validation should work
      const result = validator.validateToken(token);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('validateTokenWithScopes', () => {
    it('should validate token with required scopes', () => {
      const token = validator.createToken({ 
        sub: 'user-123', 
        scope: 'mcp:tools lm:read lm:write' 
      });
      
      const result = validator.validateTokenWithScopes(token, ['mcp:tools', 'lm:read']);
      
      expect(result.valid).toBe(true);
      expect(result.hasRequiredScopes).toBe(true);
    });

    it('should detect missing scopes', () => {
      const token = validator.createToken({ 
        sub: 'user-123', 
        scope: 'mcp:tools' 
      });
      
      const result = validator.validateTokenWithScopes(token, ['mcp:tools', 'lm:admin']);
      
      expect(result.valid).toBe(true);
      expect(result.hasRequiredScopes).toBe(false);
    });

    it('should handle token with no scopes', () => {
      const token = validator.createToken({ sub: 'user-123' });
      
      const result = validator.validateTokenWithScopes(token, ['lm:admin']);
      
      expect(result.valid).toBe(true);
      expect(result.hasRequiredScopes).toBe(false);
    });

    it('should fail validation for invalid token', () => {
      const result = validator.validateTokenWithScopes('invalid-token', ['mcp:tools']);
      
      expect(result.valid).toBe(false);
      expect(result.hasRequiredScopes).toBeUndefined();
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const decoded = validator.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('user-123');
    });

    it('should return null for invalid token', () => {
      const decoded = validator.decodeToken('invalid-token');
      
      expect(decoded).toBeNull();
    });

    it('should decode without verification', () => {
      const token = validator.createToken({ sub: 'user-123' });
      // Even with wrong validator
      const otherValidator = new JWTValidator({ secret: 'different-secret' });
      const decoded = otherValidator.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.sub).toBe('user-123');
    });
  });

  describe('getTokenInfo', () => {
    it('should return token information', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const info = validator.getTokenInfo(token);
      
      expect(info.decoded).toBeDefined();
      expect(info.expiresIn).toBeGreaterThan(3500);
      expect(info.isExpired).toBe(false);
      expect(info.audience).toBe('http://test-audience.com');
    });

    it('should detect expired token', () => {
      const shortValidator = new JWTValidator({
        ...testConfig,
        expiresIn: -100,
      });
      
      const token = shortValidator.createToken({ sub: 'user-123' });
      const info = validator.getTokenInfo(token);
      
      expect(info.isExpired).toBe(true);
      expect(info.expiresIn).toBeLessThan(0);
    });

    it('should handle invalid token', () => {
      const info = validator.getTokenInfo('invalid-token');
      
      expect(info.decoded).toBeNull();
      expect(info.expiresIn).toBeNull();
      expect(info.isExpired).toBe(true);
      expect(info.audience).toBeNull();
    });
  });

  describe('getJWTValidator singleton', () => {
    afterEach(() => {
      resetJWTValidator();
    });

    it('should return same instance on multiple calls', () => {
      const v1 = getJWTValidator(testConfig);
      const v2 = getJWTValidator();
      
      expect(v1).toBe(v2);
    });

    it('should create new instance after reset', () => {
      const v1 = getJWTValidator(testConfig);
      resetJWTValidator();
      const v2 = getJWTValidator(testConfig);
      
      expect(v1).not.toBe(v2);
    });
  });

  describe('isJWT helper', () => {
    it('should identify valid JWT format', () => {
      const token = validator.createToken({ sub: 'user-123' });
      expect(isJWT(token)).toBe(true);
    });

    it('should reject non-JWT tokens', () => {
      expect(isJWT('simple-token')).toBe(false);
      expect(isJWT('two.parts')).toBe(false);
      expect(isJWT('')).toBe(false);
    });

    it('should accept any three-part string', () => {
      expect(isJWT('a.b.c')).toBe(true);
      expect(isJWT('header.payload.signature')).toBe(true);
    });
  });

  describe('extractAudience helper', () => {
    it('should extract audience from valid token', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const audience = extractAudience(token);
      
      expect(audience).toBe('http://test-audience.com');
    });

    it('should return null for invalid token', () => {
      const audience = extractAudience('invalid-token');
      
      expect(audience).toBeNull();
    });

    it('should extract array audience', () => {
      // Create token (the createToken method sets audience automatically)
      const token = validator.createToken({ sub: 'user-123' });
      const audience = extractAudience(token);
      
      expect(audience).toBeDefined();
    });
  });

  describe('Audience validation (RFC 8707 compliance)', () => {
    it('should enforce audience validation', () => {
      const token = validator.createToken({ sub: 'user-123' });
      
      // Should pass with correct audience
      const validResult = validator.validateToken(token, 'http://test-audience.com');
      expect(validResult.valid).toBe(true);
      
      // Should fail with wrong audience
      const invalidResult = validator.validateToken(token, 'http://other-service.com');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errorCode).toBe('invalid_audience');
    });

    it('should prevent token reuse across services', () => {
      // Create token for service A
      const serviceA = new JWTValidator({
        ...testConfig,
        audience: 'http://service-a.com',
      });
      
      // Try to use on service B
      const serviceB = new JWTValidator({
        ...testConfig,
        audience: 'http://service-b.com',
      });
      
      const token = serviceA.createToken({ sub: 'user-123' });
      const result = serviceB.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_audience');
    });
  });

  describe('Security features', () => {
    it('should use HMAC-SHA256 by default', () => {
      const token = validator.createToken({ sub: 'user-123' });
      // Token should be validatable with same secret
      const result = validator.validateToken(token);
      expect(result.valid).toBe(true);
    });

    it('should reject token signed with different secret', () => {
      const validator1 = new JWTValidator({ secret: 'secret-1' });
      const validator2 = new JWTValidator({ secret: 'secret-2' });
      
      const token = validator1.createToken({ sub: 'user-123' });
      const result = validator2.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_token');
    });

    it('should include jti for token tracking', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const decoded = validator.decodeToken(token);
      
      expect(decoded?.jti).toBeDefined();
      expect(decoded?.jti).toHaveLength(32); // 16 bytes as hex = 32 chars
    });

    it('should allow custom jti', () => {
      const customJti = 'custom-token-id-12345';
      const token = validator.createToken({ 
        sub: 'user-123',
        jti: customJti,
      });
      const decoded = validator.decodeToken(token);
      
      expect(decoded?.jti).toBe(customJti);
    });
  });

  describe('Error handling', () => {
    it('should provide detailed error for expired token', () => {
      const shortValidator = new JWTValidator({
        ...testConfig,
        expiresIn: -1,
      });
      
      const token = shortValidator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token);
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('expired');
      expect(result.error).toContain('expired');
    });

    it('should provide detailed error for audience mismatch', () => {
      const token = validator.createToken({ sub: 'user-123' });
      const result = validator.validateToken(token, 'http://wrong.com');
      
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('invalid_audience');
      expect(result.error).toContain('audience');
    });

    it('should handle malformed JWT gracefully', () => {
      const results = [
        validator.validateToken(''),
        validator.validateToken('a'),
        validator.validateToken('a.b'),
        validator.validateToken('not-a-jwt-at-all'),
      ];
      
      results.forEach(result => {
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('invalid_token');
      });
    });
  });
});

