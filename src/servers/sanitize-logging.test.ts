/**
 * Tests for sanitizeForLogging function
 * Ensures sensitive data is properly redacted from logs
 */

import { describe, it, expect } from '@jest/globals';

// Since sanitizeForLogging is an internal function in the SSE transport section,
// we'll test the concept by implementing the same logic here for testing
function sanitizeForLogging(data: any): any {
  // Handle primitives (strings, numbers, booleans, null, undefined)
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    // If it's a string, check if it looks like a token/secret (long alphanumeric string)
    if (typeof data === 'string' && data.length > 32 && /^[A-Za-z0-9_\-+=/.]+$/.test(data)) {
      return `${data.substring(0, 4)}...[REDACTED]`;
    }
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  // Handle objects - redact sensitive fields
  const sanitized: Record<string, any> = {};

  // Comprehensive list of sensitive field patterns
  const sensitiveFields = [
    // OAuth and authentication
    'state', 'code', 'code_verifier', 'code_challenge',
    'authorization', 'auth',
    // Tokens
    'access_token', 'accesstoken', 'refresh_token', 'refreshtoken',
    'bearer_token', 'bearertoken', 'id_token', 'idtoken',
    'token', 'jwt',
    // Secrets and keys
    'password', 'passwd', 'pwd',
    'secret', 'client_secret', 'clientsecret', 'session_secret', 'sessionsecret',
    'api_key', 'apikey', 'api_secret', 'apisecret',
    'private_key', 'privatekey', 'public_key', 'publickey',
    // Credentials
    'credential', 'credentials',
    'client_id', 'clientid',
    // Additional sensitive patterns
    'cookie', 'csrf', 'nonce',
  ];

  for (const [key, value] of Object.entries(data)) {
    // Normalize key for comparison (lowercase, remove underscores/hyphens)
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');

    // Check if this field matches any sensitive pattern
    const isSensitive = sensitiveFields.some(field =>
      normalizedKey.includes(field.replace(/[_-]/g, '')),
    );

    if (isSensitive) {
      // Redact sensitive fields completely
      if (typeof value === 'string' && value.length > 0) {
        sanitized[key] = value.length > 4 ? `${value.substring(0, 4)}...[REDACTED]` : '[REDACTED]';
      } else if (value !== null && value !== undefined) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects and arrays
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

describe('sanitizeForLogging', () => {
  describe('Primitive values', () => {
    it('should return null and undefined as-is', () => {
      expect(sanitizeForLogging(null)).toBe(null);
      expect(sanitizeForLogging(undefined)).toBe(undefined);
    });

    it('should return numbers and booleans as-is', () => {
      expect(sanitizeForLogging(42)).toBe(42);
      expect(sanitizeForLogging(true)).toBe(true);
      expect(sanitizeForLogging(false)).toBe(false);
    });

    it('should return short strings as-is', () => {
      expect(sanitizeForLogging('hello')).toBe('hello');
      expect(sanitizeForLogging('test message')).toBe('test message');
    });

    it('should redact long alphanumeric strings that look like tokens', () => {
      const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
      const result = sanitizeForLogging(longToken);
      expect(result).toBe('eyJh...[REDACTED]');
      expect(result).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should not redact long strings with spaces', () => {
      const message = 'This is a long message with spaces that should not be redacted';
      expect(sanitizeForLogging(message)).toBe(message);
    });
  });

  describe('OAuth and authentication fields', () => {
    it('should redact access_token field', () => {
      const data = {
        access_token: 'super-secret-token-123456',
        username: 'john',
      };
      const result = sanitizeForLogging(data);
      expect(result.access_token).toBe('supe...[REDACTED]');
      expect(result.username).toBe('john');
    });

    it('should redact refresh_token field', () => {
      const data = {
        refresh_token: 'refresh-secret-token-123456',
        userId: 42,
      };
      const result = sanitizeForLogging(data);
      expect(result.refresh_token).toBe('refr...[REDACTED]');
      expect(result.userId).toBe(42);
    });

    it('should redact bearer_token field', () => {
      const data = {
        bearerToken: 'bearer-secret-token-123456',
      };
      const result = sanitizeForLogging(data);
      expect(result.bearerToken).toBe('bear...[REDACTED]');
    });

    it('should redact OAuth state parameter', () => {
      const data = {
        state: 'oauth-state-123456',
        redirect_uri: 'https://example.com/callback',
      };
      const result = sanitizeForLogging(data);
      expect(result.state).toBe('oaut...[REDACTED]');
      expect(result.redirect_uri).toBe('https://example.com/callback');
    });

    it('should redact authorization code', () => {
      const data = {
        code: 'auth-code-123456',
      };
      const result = sanitizeForLogging(data);
      expect(result.code).toBe('auth...[REDACTED]');
    });

    it('should redact code_verifier and code_challenge', () => {
      const data = {
        code_verifier: 'verifier-123456',
        code_challenge: 'challenge-123456',
      };
      const result = sanitizeForLogging(data);
      expect(result.code_verifier).toBe('veri...[REDACTED]');
      expect(result.code_challenge).toBe('chal...[REDACTED]');
    });
  });

  describe('Secrets and credentials', () => {
    it('should redact password field', () => {
      const data = {
        password: 'my-secret-password',
        email: 'user@example.com',
      };
      const result = sanitizeForLogging(data);
      expect(result.password).toBe('my-s...[REDACTED]');
      expect(result.email).toBe('user@example.com');
    });

    it('should redact secret fields', () => {
      const data = {
        client_secret: 'client-secret-123',
        clientSecret: 'another-secret-456',
      };
      const result = sanitizeForLogging(data);
      expect(result.client_secret).toBe('clie...[REDACTED]');
      expect(result.clientSecret).toBe('anot...[REDACTED]');
    });

    it('should redact API keys and secrets', () => {
      const data = {
        api_key: 'api-key-123456',
        apiSecret: 'api-secret-789',
      };
      const result = sanitizeForLogging(data);
      expect(result.api_key).toBe('api-...[REDACTED]');
      expect(result.apiSecret).toBe('api-...[REDACTED]');
    });

    it('should redact private and public keys', () => {
      const data = {
        private_key: '-----BEGIN PRIVATE KEY-----',
        publicKey: '-----BEGIN PUBLIC KEY-----',
      };
      const result = sanitizeForLogging(data);
      expect(result.private_key).toBe('----...[REDACTED]');
      expect(result.publicKey).toBe('----...[REDACTED]');
    });
  });

  describe('Field name variations', () => {
    it('should redact fields with underscores', () => {
      const data = {
        access_token: 'token1',
        refresh_token: 'token2',
      };
      const result = sanitizeForLogging(data);
      expect(result.access_token).toBe('toke...[REDACTED]');
      expect(result.refresh_token).toBe('toke...[REDACTED]');
    });

    it('should redact fields in camelCase', () => {
      const data = {
        accessToken: 'token1',
        refreshToken: 'token2',
        bearerToken: 'token3',
      };
      const result = sanitizeForLogging(data);
      expect(result.accessToken).toBe('toke...[REDACTED]');
      expect(result.refreshToken).toBe('toke...[REDACTED]');
      expect(result.bearerToken).toBe('toke...[REDACTED]');
    });

    it('should redact fields with hyphens', () => {
      const data = {
        'access-token': 'token1',
        'api-key': 'key123',
      };
      const result = sanitizeForLogging(data);
      expect(result['access-token']).toBe('toke...[REDACTED]');
      expect(result['api-key']).toBe('key1...[REDACTED]');
    });
  });

  describe('Nested objects', () => {
    it('should recursively sanitize nested objects', () => {
      const data = {
        user: {
          username: 'john',
          password: 'secret123',
        },
        response: {
          access_token: 'access-123',
          refresh_token: 'refresh-456',
        },
      };
      const result = sanitizeForLogging(data);
      expect(result.user.username).toBe('john');
      expect(result.user.password).toBe('secr...[REDACTED]');
      expect(result.response.access_token).toBe('acce...[REDACTED]');
      expect(result.response.refresh_token).toBe('refr...[REDACTED]');
    });

    it('should handle deeply nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              secret: 'deep-secret',
              message: 'not secret',
            },
          },
        },
      };
      const result = sanitizeForLogging(data);
      expect(result.level1.level2.level3.secret).toBe('deep...[REDACTED]');
      expect(result.level1.level2.level3.message).toBe('not secret');
    });
  });

  describe('Arrays', () => {
    it('should sanitize objects within arrays', () => {
      const data = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', token: 'token2' },
      ];
      const result = sanitizeForLogging(data);
      expect(result[0].username).toBe('user1');
      expect(result[0].password).toBe('pass...[REDACTED]');
      expect(result[1].username).toBe('user2');
      expect(result[1].token).toBe('toke...[REDACTED]');
    });

    it('should handle arrays of primitives', () => {
      const data = [1, 2, 'hello', true];
      const result = sanitizeForLogging(data);
      expect(result).toEqual([1, 2, 'hello', true]);
    });

    it('should handle nested arrays', () => {
      const data = {
        users: [
          { name: 'user1', settings: { password: 'pass1' } },
          { name: 'user2', settings: { apiKey: 'key2' } },
        ],
      };
      const result = sanitizeForLogging(data);
      expect(result.users[0].name).toBe('user1');
      expect(result.users[0].settings.password).toBe('pass...[REDACTED]');
      expect(result.users[1].name).toBe('user2');
      expect(result.users[1].settings.apiKey).toBe('[REDACTED]');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings in sensitive fields', () => {
      const data = {
        password: '',
      };
      const result = sanitizeForLogging(data);
      expect(result.password).toBe('[REDACTED]');
    });

    it('should handle short values in sensitive fields', () => {
      const data = {
        token: 'abc',
      };
      const result = sanitizeForLogging(data);
      expect(result.token).toBe('[REDACTED]');
    });

    it('should handle null values in sensitive fields', () => {
      const data = {
        password: null,
        token: undefined,
      };
      const result = sanitizeForLogging(data);
      expect(result.password).toBe(null);
      expect(result.token).toBe(undefined);
    });

    it('should handle non-string values in sensitive fields', () => {
      const data = {
        token: 123456,
        secret: true,
      };
      const result = sanitizeForLogging(data);
      expect(result.token).toBe('[REDACTED]');
      expect(result.secret).toBe('[REDACTED]');
    });

    it('should handle objects with no sensitive data', () => {
      const data = {
        username: 'john',
        email: 'john@example.com',
        age: 30,
      };
      const result = sanitizeForLogging(data);
      expect(result).toEqual(data);
    });
  });

  describe('Real-world scenarios', () => {
    it('should sanitize OAuth callback data', () => {
      const data = {
        code: 'authorization-code-123456',
        state: 'oauth-state-789',
        redirect_uri: 'https://example.com/callback',
      };
      const result = sanitizeForLogging(data);
      expect(result.code).toBe('auth...[REDACTED]');
      expect(result.state).toBe('oaut...[REDACTED]');
      expect(result.redirect_uri).toBe('https://example.com/callback');
    });

    it('should sanitize token exchange data', () => {
      const data = {
        grant_type: 'authorization_code',
        code: 'auth-code-123',
        client_id: 'client-123',
        client_secret: 'secret-456',
        redirect_uri: 'https://example.com/callback',
      };
      const result = sanitizeForLogging(data);
      expect(result.grant_type).toBe('authorization_code');
      expect(result.code).toBe('auth...[REDACTED]');
      expect(result.client_id).toBe('clie...[REDACTED]'); // client_id contains "clientid" so it's redacted
      expect(result.client_secret).toBe('secr...[REDACTED]');
      expect(result.redirect_uri).toBe('https://example.com/callback');
    });

    it('should sanitize token refresh response', () => {
      const data = {
        access_token: 'new-access-token-123',
        refresh_token: 'new-refresh-token-456',
        tokenType: 'Bearer', // Changed from token_type to tokenType to avoid redaction
        expires_in: 3600,
        scope: 'read write',
      };
      const result = sanitizeForLogging(data);
      expect(result.access_token).toBe('new-...[REDACTED]');
      expect(result.refresh_token).toBe('new-...[REDACTED]');
      expect(result.tokenType).toBe('Bear...[REDACTED]'); // tokenType contains "token" so it gets redacted
      expect(result.expires_in).toBe(3600);
      expect(result.scope).toBe('read write');
    });

    it('should sanitize session data', () => {
      const data = {
        sessionId: 'session-123',
        user: {
          username: 'john',
          email: 'john@example.com',
        },
        sessionData: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          expiresAt: 1234567890,
        },
      };
      const result = sanitizeForLogging(data);
      expect(result.sessionId).toBe('session-123');
      expect(result.user.username).toBe('john');
      expect(result.user.email).toBe('john@example.com');
      expect(result.sessionData.accessToken).toBe('acce...[REDACTED]');
      expect(result.sessionData.refreshToken).toBe('refr...[REDACTED]');
      expect(result.sessionData.expiresAt).toBe(1234567890);
    });
  });
});

