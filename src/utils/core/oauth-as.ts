/**
 * OAuth 2.1 Authorization Server helpers
 *
 * Implements the AS surface expected by Claude's remote MCP connector:
 *   - RFC 9728 Protected Resource Metadata (discovery)
 *   - RFC 8414 Authorization Server Metadata (discovery)
 *   - RFC 7591 Dynamic Client Registration
 *   - OAuth 2.1 authorization code flow with PKCE (RFC 7636, S256)
 *
 * State is held in memory. Sufficient for a single-replica deployment;
 * a multi-replica deployment needs Redis-backed storage.
 */

import crypto from 'crypto';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface ClientRegistration {
  clientId: string;
  clientIdIssuedAt: number; // epoch seconds
  redirectUris: string[];
  clientName?: string;
  tokenEndpointAuthMethod: 'none'; // public client with PKCE only
  grantTypes: string[];
  responseTypes: string[];
  scope?: string;
}

export interface PendingAuthorization {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  state?: string;
  createdAt: number; // epoch ms
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  user: {
    id: string;
    username?: string;
    displayName?: string;
    email?: string;
  };
  createdAt: number; // epoch ms
  consumed: boolean;
}


// ------------------------------------------------------------------
// TTLs
// ------------------------------------------------------------------

const PENDING_AUTH_TTL_MS = 10 * 60 * 1000; // 10 minutes
const AUTH_CODE_TTL_MS = 60 * 1000; // 60 seconds (single-use)
const CLIENT_TTL_MS = 24 * 60 * 60 * 1000 * 30; // 30 days (registrations)
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ------------------------------------------------------------------
// In-memory stores
// ------------------------------------------------------------------

const clients = new Map<string, ClientRegistration>();
const authCodes = new Map<string, AuthorizationCode>();
const pendingAuthorizations = new Map<string, PendingAuthorization>();

// ------------------------------------------------------------------
// Pending authorization storage (server-side, keyed by transactionId)
// ------------------------------------------------------------------
//
// pendingAuth MUST NOT live in req.session: Passport >= 0.6 regenerates
// the session on successful req.login() for session-fixation defence, so
// anything stashed in the session before the IdP round-trip is gone by
// the time /auth/callback runs. Instead we store server-side keyed by
// a random transactionId that we carry across the IdP redirect in a
// short-lived, HttpOnly cookie that Passport never touches.

export function createTransactionId(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function storePendingAuthorization(
  transactionId: string,
  authz: PendingAuthorization,
): void {
  pendingAuthorizations.set(transactionId, authz);
}

export function consumePendingAuthorization(
  transactionId: string,
): PendingAuthorization | null {
  const record = pendingAuthorizations.get(transactionId);
  if (!record) return null;
  pendingAuthorizations.delete(transactionId);
  if (Date.now() - record.createdAt > PENDING_AUTH_TTL_MS) {
    return null;
  }
  return record;
}

// ------------------------------------------------------------------
// Client registration
// ------------------------------------------------------------------

export function registerClient(input: {
  redirectUris: string[];
  clientName?: string;
  scope?: string;
}): ClientRegistration {
  const clientId = `mcp-${crypto.randomBytes(16).toString('hex')}`;

  const registration: ClientRegistration = {
    clientId,
    clientIdIssuedAt: Math.floor(Date.now() / 1000),
    redirectUris: input.redirectUris,
    clientName: input.clientName,
    tokenEndpointAuthMethod: 'none',
    grantTypes: ['authorization_code', 'refresh_token'],
    responseTypes: ['code'],
    scope: input.scope,
  };

  clients.set(clientId, registration);
  return registration;
}

export function getClient(clientId: string): ClientRegistration | undefined {
  return clients.get(clientId);
}

// ------------------------------------------------------------------
// Authorization codes
// ------------------------------------------------------------------

export function issueAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  user: AuthorizationCode['user'];
}): string {
  const code = crypto.randomBytes(32).toString('hex');
  authCodes.set(code, {
    code,
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    codeChallengeMethod: input.codeChallengeMethod,
    scope: input.scope,
    user: input.user,
    createdAt: Date.now(),
    consumed: false,
  });
  return code;
}

export function consumeAuthorizationCode(code: string): AuthorizationCode | null {
  const record = authCodes.get(code);
  if (!record) return null;
  if (record.consumed) return null;
  if (Date.now() - record.createdAt > AUTH_CODE_TTL_MS) {
    authCodes.delete(code);
    return null;
  }
  record.consumed = true;
  // Keep briefly for replay detection visibility, then let cleanup expire it.
  return record;
}

// NOTE: Refresh tokens are stateless JWTs minted and validated by
// JWTValidator (see jwt-validator.ts, token_use: 'refresh'). They are
// deliberately NOT stored here: in-memory state does not survive Azure
// Container Apps restarts (scale-from-zero, redeploys), which previously
// invalidated all refresh tokens and forced every user to reconnect.
// REFRESH_TOKEN_TTL_MS above remains the single source of truth for
// their lifetime.

// ------------------------------------------------------------------
// PKCE
// ------------------------------------------------------------------

/**
 * Verify that SHA256(verifier) base64url-encoded equals the stored challenge.
 * RFC 7636 §4.6.
 */
export function verifyPkceS256(verifier: string, challenge: string): boolean {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const computed = base64UrlEncode(hash);
  // Constant-time compare
  if (computed.length !== challenge.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(challenge));
  } catch {
    return false;
  }
}

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ------------------------------------------------------------------
// Metadata builders
// ------------------------------------------------------------------

export function buildProtectedResourceMetadata(baseUrl: string, scopesSupported: string[]) {
  return {
    resource: baseUrl,
    authorization_servers: [baseUrl],
    scopes_supported: scopesSupported,
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/`,
  };
}

export function buildAuthorizationServerMetadata(baseUrl: string, scopesSupported: string[]) {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'], // public clients w/ PKCE
    scopes_supported: scopesSupported,
    service_documentation: `${baseUrl}/`,
  };
}

// ------------------------------------------------------------------
// Periodic cleanup
// ------------------------------------------------------------------

export function cleanupExpired(): {
  codes: number;
  clients: number;
  pending: number;
} {
  const now = Date.now();
  let expiredCodes = 0;
  authCodes.forEach((record, code) => {
    if (now - record.createdAt > AUTH_CODE_TTL_MS) {
      authCodes.delete(code);
      expiredCodes++;
    }
  });

  let expiredClients = 0;
  clients.forEach((reg, id) => {
    if (now - reg.clientIdIssuedAt * 1000 > CLIENT_TTL_MS) {
      clients.delete(id);
      expiredClients++;
    }
  });

  let expiredPending = 0;
  pendingAuthorizations.forEach((record, txId) => {
    if (now - record.createdAt > PENDING_AUTH_TTL_MS) {
      pendingAuthorizations.delete(txId);
      expiredPending++;
    }
  });

  return {
    codes: expiredCodes,
    clients: expiredClients,
    pending: expiredPending,
  };
}

export function startOAuthCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const { codes, clients: removedClients, pending } = cleanupExpired();
    if (codes > 0 || removedClients > 0 || pending > 0) {
      // Use console.error to avoid coupling to the server's log function
      console.error(
        `[oauth-as] cleanup: removed ${codes} codes, ${removedClients} clients, ${pending} pending`,
      );
    }
  }, intervalMs);
}

// ------------------------------------------------------------------
// Pending authorization helpers (operate on express-session)
// ------------------------------------------------------------------

export { PENDING_AUTH_TTL_MS };
