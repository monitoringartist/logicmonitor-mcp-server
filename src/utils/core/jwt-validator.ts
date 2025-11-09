/**
 * JWT Token Validator with Audience Validation (RFC 8707)
 * 
 * Implements token audience binding per:
 * - RFC 8707: Resource Indicators for OAuth 2.0
 * - RFC 9068: JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens
 * - MCP Authorization Specification
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * JWT payload structure for MCP access tokens
 */
export interface MCPTokenPayload {
  /** Subject (user ID) */
  sub: string;
  /** Audience (resource server) - MUST match this server's base URL (RFC 8707: can be string or array) */
  aud: string | string[];
  /** Issuer (authorization server) */
  iss: string;
  /** Issued at (timestamp) */
  iat: number;
  /** Expiration time (timestamp) */
  exp: number;
  /** Scope (space-separated list) */
  scope?: string;
  /** Client ID */
  client_id?: string;
  /** Token ID (jti - JWT ID for tracking) */
  jti?: string;
  /** User metadata */
  user?: {
    id: string;
    username: string;
    displayName?: string;
    email?: string;
  };
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: MCPTokenPayload;
  error?: string;
  errorCode?: 'invalid_token' | 'invalid_audience' | 'expired' | 'invalid_signature';
}

/**
 * JWT signing configuration
 */
interface JWTConfig {
  /** Secret key for signing (HS256) or private key (RS256) */
  secret: string;
  /** Algorithm (HS256 or RS256) */
  algorithm: 'HS256' | 'RS256';
  /** Token issuer (authorization server URL) */
  issuer: string;
  /** Token audience (resource server URL) */
  audience: string;
  /** Token expiration time in seconds (default: 3600 = 1 hour) */
  expiresIn: number;
}

/**
 * JWT Validator class
 */
export class JWTValidator {
  private config: JWTConfig;
  private publicKey?: string;

  constructor(config: Partial<JWTConfig>) {
    // Generate a secure secret if not provided
    const defaultSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

    this.config = {
      secret: config.secret || defaultSecret,
      algorithm: config.algorithm || 'HS256',
      issuer: config.issuer || 'http://localhost:3000',
      audience: config.audience || 'http://localhost:3000',
      expiresIn: config.expiresIn || 3600,
    };

    // For production, warn if using default secret
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  WARNING: Using auto-generated JWT secret. Set JWT_SECRET environment variable for production.');
    }
  }

  /**
   * Create a JWT access token with audience binding
   */
  createToken(payload: Partial<MCPTokenPayload>): string {
    const now = Math.floor(Date.now() / 1000);

    const fullPayload: MCPTokenPayload = {
      sub: payload.sub || 'unknown',
      aud: this.config.audience, // CRITICAL: Bind token to this resource server
      iss: this.config.issuer,
      iat: now,
      exp: now + this.config.expiresIn,
      scope: payload.scope || 'mcp:tools',
      jti: payload.jti || crypto.randomBytes(16).toString('hex'),
      ...(payload.client_id && { client_id: payload.client_id }),
      ...(payload.user && { user: payload.user }),
    };

    return jwt.sign(fullPayload, this.config.secret, {
      algorithm: this.config.algorithm,
    });
  }

  /**
   * Validate JWT token with MANDATORY audience verification
   * 
   * Per MCP specification and RFC 8707:
   * "MCP servers MUST validate that tokens presented to them were specifically 
   * issued for their use"
   */
  validateToken(token: string, expectedAudience?: string): TokenValidationResult {
    try {
      // Use provided audience or fall back to configured audience
      const audienceToValidate = expectedAudience || this.config.audience;

      // Verify token with strict audience validation
      const decoded = jwt.verify(token, this.config.secret, {
        algorithms: [this.config.algorithm],
        audience: audienceToValidate, // CRITICAL: Audience MUST match
        issuer: this.config.issuer,
        complete: false,
      }) as MCPTokenPayload;

      // Additional audience validation (defense in depth)
      // RFC 8707: audience can be string or array of strings
      const audienceMatches = Array.isArray(decoded.aud)
        ? decoded.aud.includes(audienceToValidate)
        : decoded.aud === audienceToValidate;

      if (!decoded.aud || !audienceMatches) {
        return {
          valid: false,
          error: `Token audience mismatch. Expected: ${audienceToValidate}, Got: ${JSON.stringify(decoded.aud)}`,
          errorCode: 'invalid_audience',
        };
      }

      // Validate expiration (jwt.verify does this, but double-check)
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return {
          valid: false,
          error: 'Token has expired',
          errorCode: 'expired',
        };
      }

      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token has expired',
          errorCode: 'expired',
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        // Check if it's an audience error
        if (error.message.includes('audience')) {
          return {
            valid: false,
            error: error.message,
            errorCode: 'invalid_audience',
          };
        }

        return {
          valid: false,
          error: error.message,
          errorCode: 'invalid_token',
        };
      }

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
        errorCode: 'invalid_token',
      };
    }
  }

  /**
   * Decode token without verification (for debugging/inspection only)
   * DO NOT use for authentication decisions
   */
  decodeToken(token: string): MCPTokenPayload | null {
    try {
      return jwt.decode(token) as MCPTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * Validate token and check for required scopes
   */
  validateTokenWithScopes(
    token: string,
    requiredScopes: string[],
    expectedAudience?: string
  ): TokenValidationResult & { hasRequiredScopes?: boolean } {
    const result = this.validateToken(token, expectedAudience);

    if (!result.valid || !result.payload) {
      return result;
    }

    // Check scopes
    const tokenScopes = result.payload.scope?.split(' ') || [];
    const hasAllScopes = requiredScopes.every(required => tokenScopes.includes(required));

    return {
      ...result,
      hasRequiredScopes: hasAllScopes,
    };
  }

  /**
   * Get token information (for logging/debugging)
   */
  getTokenInfo(token: string): {
    decoded: MCPTokenPayload | null;
    expiresIn: number | null;
    isExpired: boolean;
    audience: string | string[] | null;
  } {
    const decoded = this.decodeToken(token);
    
    if (!decoded) {
      return {
        decoded: null,
        expiresIn: null,
        isExpired: true,
        audience: null,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = decoded.exp ? decoded.exp - now : null;
    const isExpired = decoded.exp ? decoded.exp < now : true;

    return {
      decoded,
      expiresIn,
      isExpired,
      audience: decoded.aud || null,
    };
  }

  /**
   * Get configured audience for this server
   */
  getAudience(): string {
    return this.config.audience;
  }

  /**
   * Get configured issuer for this server
   */
  getIssuer(): string {
    return this.config.issuer;
  }
}

/**
 * Create a singleton instance for the application
 */
let validatorInstance: JWTValidator | null = null;

export function getJWTValidator(config?: Partial<JWTConfig>): JWTValidator {
  if (!validatorInstance) {
    validatorInstance = new JWTValidator(config || {});
  }
  return validatorInstance;
}

/**
 * Reset validator instance (for testing)
 */
export function resetJWTValidator(): void {
  validatorInstance = null;
}

/**
 * Helper: Check if a token is a JWT (vs a simple token)
 */
export function isJWT(token: string): boolean {
  return token.split('.').length === 3;
}

/**
 * Helper: Extract audience from token without validation (for debugging)
 */
export function extractAudience(token: string): string | string[] | null {
  try {
    const decoded = jwt.decode(token) as MCPTokenPayload;
    return decoded?.aud || null;
  } catch {
    return null;
  }
}

