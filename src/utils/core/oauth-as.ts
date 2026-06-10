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

export interface RefreshToken {
  token: string;
  clientId: string;
  scope: string;
  user: {
    id: string;
    username?: string;
    displayName?: string;
    email?: string;
  };
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  revoked: boolean;
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
const refreshTokens = new Map<string, RefreshToken>();

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

// ------------------------------------------------------------------
// Refresh tokens (rotating, opaque)
// ------------------------------------------------------------------
//
// Rotating refresh tokens: each refresh issues a fresh access+refresh
// pair, the old refresh token is revoked. Limits replay if a refresh
// token leaks. Tokens are opaque random strings stored server-side.

export function issueRefreshToken(input: {
  clientId: string;
  scope: string;
  user: RefreshToken['user'];
}): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  refreshTokens.set(token, {
    token,
    clientId: input.clientId,
    scope: input.scope,
    user: input.user,
    createdAt: now,
    expiresAt: now + REFRESH_TOKEN_TTL_MS,
    revoked: false,
  });
  return token;
}

/**
 * Look up and consume a refresh token. Returns the record on success
 * (and marks it revoked so subsequent uses fail), null otherwise.
 *
 * Returning null covers all rejection cases — unknown token, expired,
 * already-revoked. Caller MUST treat any null as `invalid_grant`.
 */
export function consumeRefreshToken(token: string): RefreshToken | null {
  const record = refreshTokens.get(token);
  if (!record) return null;
  if (record.revoked) return null;
  if (Date.now() > record.expiresAt) {
    refreshTokens.delete(token);
    return null;
  }
  record.revoked = true;
  // Keep briefly so cleanup can collect it; do not delete immediately
  // so detect-replay logging in the future can see the prior record.
  return record;
}

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
  refresh: number;
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

  // Drop refresh tokens that are either expired or revoked + older than
  // a grace window (so we don't keep revoked rotated tokens forever).
  let expiredRefresh = 0;
  const REVOKED_GRACE_MS = 24 * 60 * 60 * 1000;
  refreshTokens.forEach((record, token) => {
    if (now > record.expiresAt) {
      refreshTokens.delete(token);
      expiredRefresh++;
    } else if (record.revoked && now - record.createdAt > REVOKED_GRACE_MS) {
      refreshTokens.delete(token);
      expiredRefresh++;
    }
  });

  return {
    codes: expiredCodes,
    clients: expiredClients,
    pending: expiredPending,
    refresh: expiredRefresh,
  };
}

export function startOAuthCleanup(intervalMs: number = 5 * 60 * 1000): NodeJS.Timeout {
  return setInterval(() => {
    const { codes, clients: removedClients, pending, refresh } = cleanupExpired();
    if (codes > 0 || removedClients > 0 || pending > 0 || refresh > 0) {
      // Use console.error to avoid coupling to the server's log function
      console.error(
        `[oauth-as] cleanup: removed ${codes} codes, ${removedClients} clients, ${pending} pending, ${refresh} refresh`,
      );
    }
  }, intervalMs);
}

// ------------------------------------------------------------------
// Pending authorization helpers (operate on express-session)
// ------------------------------------------------------------------

export { PENDING_AUTH_TTL_MS };
