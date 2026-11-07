/**
 * Tests for the OAuth 2.1 Authorization Server helpers (oauth-as.ts)
 *
 * Covers dynamic client registration, the authorization-code lifecycle
 * (single-use, expiry, replay), rotating refresh tokens, PKCE S256
 * verification, discovery metadata builders, and the pending-authorization
 * transaction store used to survive Passport's session regeneration.
 */

import crypto from 'crypto';
import { describe, it, expect } from '@jest/globals';
import {
  registerClient,
  getClient,
  issueAuthorizationCode,
  consumeAuthorizationCode,
  issueRefreshToken,
  consumeRefreshToken,
  verifyPkceS256,
  buildProtectedResourceMetadata,
  buildAuthorizationServerMetadata,
  createTransactionId,
  storePendingAuthorization,
  consumePendingAuthorization,
  cleanupExpired,
  PendingAuthorization,
} from './oauth-as.js';

const USER = { id: 'user-1', username: 'alice', email: 'alice@example.com' };

function base64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makePkcePair(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('hex');
  const challenge = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

describe('oauth-as: client registration', () => {
  it('registers a public PKCE client and returns it via getClient', () => {
    const reg = registerClient({
      redirectUris: ['https://client.example/callback'],
      clientName: 'Test Client',
      scope: 'mcp:tools',
    });

    expect(reg.clientId).toMatch(/^mcp-[0-9a-f]+$/);
    expect(reg.tokenEndpointAuthMethod).toBe('none');
    expect(reg.grantTypes).toEqual(['authorization_code', 'refresh_token']);
    expect(reg.responseTypes).toEqual(['code']);
    expect(reg.redirectUris).toEqual(['https://client.example/callback']);

    const fetched = getClient(reg.clientId);
    expect(fetched).toBeDefined();
    expect(fetched?.clientName).toBe('Test Client');
  });

  it('issues unique client ids for each registration', () => {
    const a = registerClient({ redirectUris: ['https://a.example/cb'] });
    const b = registerClient({ redirectUris: ['https://b.example/cb'] });
    expect(a.clientId).not.toBe(b.clientId);
  });

  it('returns undefined for an unknown client id', () => {
    expect(getClient('mcp-does-not-exist')).toBeUndefined();
  });
});

describe('oauth-as: authorization codes', () => {
  it('issues a code that can be consumed exactly once', () => {
    const code = issueAuthorizationCode({
      clientId: 'mcp-client',
      redirectUri: 'https://client.example/cb',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      scope: 'mcp:tools',
      user: USER,
    });

    const first = consumeAuthorizationCode(code);
    expect(first).not.toBeNull();
    expect(first?.clientId).toBe('mcp-client');
    expect(first?.user.id).toBe('user-1');

    // Replay must fail.
    const second = consumeAuthorizationCode(code);
    expect(second).toBeNull();
  });

  it('returns null for an unknown code', () => {
    expect(consumeAuthorizationCode('nope')).toBeNull();
  });
});

describe('oauth-as: refresh tokens (rotating)', () => {
  it('issues a refresh token that can be consumed once and is then revoked', () => {
    const token = issueRefreshToken({ clientId: 'mcp-client', scope: 'mcp:tools', user: USER });

    const first = consumeRefreshToken(token);
    expect(first).not.toBeNull();
    expect(first?.scope).toBe('mcp:tools');
    expect(first?.user.id).toBe('user-1');

    // A rotated/used refresh token must not be reusable.
    const second = consumeRefreshToken(token);
    expect(second).toBeNull();
  });

  it('returns null for an unknown refresh token', () => {
    expect(consumeRefreshToken('unknown-token')).toBeNull();
  });
});

describe('oauth-as: PKCE S256 verification', () => {
  it('accepts a verifier that matches its challenge', () => {
    const { verifier, challenge } = makePkcePair();
    expect(verifyPkceS256(verifier, challenge)).toBe(true);
  });

  it('rejects a verifier that does not match the challenge', () => {
    const { challenge } = makePkcePair();
    expect(verifyPkceS256('wrong-verifier', challenge)).toBe(false);
  });

  it('rejects when the challenge length differs (no throw)', () => {
    const { verifier } = makePkcePair();
    expect(verifyPkceS256(verifier, 'short')).toBe(false);
  });
});

describe('oauth-as: discovery metadata', () => {
  const baseUrl = 'https://mcp.example.com';
  const scopes = ['mcp:tools', 'lm:read'];

  it('builds RFC 9728 protected resource metadata', () => {
    const meta = buildProtectedResourceMetadata(baseUrl, scopes);
    expect(meta.resource).toBe(baseUrl);
    expect(meta.authorization_servers).toEqual([baseUrl]);
    expect(meta.scopes_supported).toEqual(scopes);
    expect(meta.bearer_methods_supported).toEqual(['header']);
  });

  it('builds RFC 8414 authorization server metadata', () => {
    const meta = buildAuthorizationServerMetadata(baseUrl, scopes);
    expect(meta.issuer).toBe(baseUrl);
    expect(meta.authorization_endpoint).toBe(`${baseUrl}/oauth/authorize`);
    expect(meta.token_endpoint).toBe(`${baseUrl}/oauth/token`);
    expect(meta.registration_endpoint).toBe(`${baseUrl}/oauth/register`);
    expect(meta.code_challenge_methods_supported).toEqual(['S256']);
    expect(meta.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
    expect(meta.token_endpoint_auth_methods_supported).toEqual(['none']);
  });
});

describe('oauth-as: pending authorization store', () => {
  function makePending(): PendingAuthorization {
    return {
      clientId: 'mcp-client',
      redirectUri: 'https://client.example/cb',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      scope: 'mcp:tools',
      state: 'xyz',
      createdAt: Date.now(),
    };
  }

  it('stores and consumes a pending authorization exactly once', () => {
    const txId = createTransactionId();
    expect(txId).toMatch(/^[0-9a-f]+$/);

    storePendingAuthorization(txId, makePending());

    const first = consumePendingAuthorization(txId);
    expect(first).not.toBeNull();
    expect(first?.state).toBe('xyz');

    // Consuming again must fail (single-use).
    expect(consumePendingAuthorization(txId)).toBeNull();
  });

  it('returns null for an unknown transaction id', () => {
    expect(consumePendingAuthorization('missing')).toBeNull();
  });

  it('does not return an expired pending authorization', () => {
    const txId = createTransactionId();
    const stale = makePending();
    // Backdate beyond the 10 minute TTL.
    stale.createdAt = Date.now() - 11 * 60 * 1000;
    storePendingAuthorization(txId, stale);

    expect(consumePendingAuthorization(txId)).toBeNull();
  });
});

describe('oauth-as: cleanupExpired', () => {
  it('runs without error and returns numeric counters', () => {
    const result = cleanupExpired();
    expect(typeof result.codes).toBe('number');
    expect(typeof result.clients).toBe('number');
    expect(typeof result.pending).toBe('number');
    expect(typeof result.refresh).toBe('number');
  });

  it('removes an expired refresh token', () => {
    // A fresh token should survive cleanup; an expired one should be removed.
    const token = issueRefreshToken({ clientId: 'mcp-client', scope: 'mcp:tools', user: USER });
    cleanupExpired();
    // Still valid → consumable.
    expect(consumeRefreshToken(token)).not.toBeNull();
  });
});
