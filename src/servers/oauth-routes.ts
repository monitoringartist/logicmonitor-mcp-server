/**
 * OAuth 2.1 Authorization Server & Passport IdP Routes
 */

import { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import { getRefreshTokenFunction, OAuthUser } from '../utils/core/oauth-strategy.js';
import { JWTValidator } from '../utils/core/jwt-validator.js';
import {
  registerSession,
  registerRefreshCallback,
  TokenData,
} from '../utils/core/token-refresh.js';
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
  PENDING_AUTH_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  PendingAuthorization,
} from '../utils/core/oauth-as.js';
import {
  processResourceParameter,
  validateResourceMatch,
  determineAudience,
} from '../utils/core/resource-validator.js';
import { OAuthConfig } from '../utils/core/cli-config.js';
import { LoggerFn } from './logger.js';

// Cookie used to carry the OAuth 2.1 transaction id across the IdP round-trip.
// Kept separate from the Express session so it survives Passport's session
// regeneration on successful login.
const OAUTH_TX_COOKIE = 'mcp_oauth_tx';

const SCOPES_SUPPORTED = [
  'mcp:tools',
  'lm:read', 'lm:write', 'lm:admin',
  'lm:alerts:read', 'lm:alerts:write',
  'lm:devices:read', 'lm:devices:write',
  'lm:dashboards:read', 'lm:dashboards:write',
  'lm:reports:read',
  'lm:users:manage',
];

const DEFAULT_USER_SCOPE = [
  'mcp:tools',
  'lm:admin',
  'lm:alerts:write',
  'lm:devices:write',
  'lm:dashboards:write',
  'lm:users:manage',
].join(' ');

export interface OAuthRoutesDeps {
  oauthConfig: OAuthConfig;
  baseUrl: string;
  jwtValidator: JWTValidator;
  authLimiter: RequestHandler;
  loginLimiter: RequestHandler;
  ensureAuthenticated: RequestHandler;
  log: LoggerFn;
}

/**
 * Registers Passport OAuth login/callback/logout routes, CSRF token route,
 * and OAuth 2.1 Authorization Server discovery/DCR/authorize/token endpoints.
 */
export function registerOAuthRoutes(app: Express, deps: OAuthRoutesDeps): void {
  const {
    oauthConfig,
    baseUrl,
    jwtValidator,
    authLimiter,
    loginLimiter,
    ensureAuthenticated,
    log,
  } = deps;

  const scopeArray = oauthConfig.scope ? oauthConfig.scope.split(',') : undefined;
  app.get('/auth/login', loginLimiter, passport.authenticate(oauthConfig.provider, { scope: scopeArray }));

  app.get(
    '/auth/callback',
    passport.authenticate(oauthConfig.provider, { failureRedirect: '/' }),
    (req: Request, res: Response) => {
      if (req.user && req.session) {
        const user = req.user as OAuthUser;
        const sessionId = req.session.id || req.sessionID;

        const tokenData: TokenData = {
          accessToken: user.tokens.accessToken,
          refreshToken: user.tokens.refreshToken,
          expiresAt: user.tokens.expiresAt,
          tokenType: 'Bearer',
          scope: oauthConfig.scope,
        };

        registerSession(sessionId, user, tokenData);
        log('info', 'Session registered with token refresh', { provider: oauthConfig.provider });

        if (tokenData.refreshToken && oauthConfig.tokenRefreshEnabled) {
          const refreshFn = getRefreshTokenFunction(oauthConfig.provider);
          if (refreshFn) {
            registerRefreshCallback(sessionId, refreshFn);
            log('info', 'Token refresh enabled', { provider: oauthConfig.provider });
          }
        }
      }

      const transactionId: string | undefined = req.cookies?.[OAUTH_TX_COOKIE];
      const pending = transactionId ? consumePendingAuthorization(transactionId) : null;

      if (transactionId) {
        res.clearCookie(OAUTH_TX_COOKIE, { path: '/' });
      }

      if (pending && req.user) {
        const oauthUser = req.user as OAuthUser;
        const code = issueAuthorizationCode({
          clientId: pending.clientId,
          redirectUri: pending.redirectUri,
          codeChallenge: pending.codeChallenge,
          codeChallengeMethod: pending.codeChallengeMethod,
          scope: DEFAULT_USER_SCOPE,
          resources: pending.resources,
          user: {
            id: oauthUser.id,
            username: oauthUser.username,
            displayName: oauthUser.displayName,
            email: oauthUser.email,
          },
        });

        const redirectUrl = new URL(pending.redirectUri);
        redirectUrl.searchParams.set('code', code);
        if (pending.state) redirectUrl.searchParams.set('state', pending.state);

        log('info', 'Issued authorization code to MCP client', {
          clientId: pending.clientId,
          user: oauthUser.username || oauthUser.id,
          transactionId,
        });
        return res.redirect(redirectUrl.toString());
      }

      if (transactionId && !pending) {
        log('warn', 'OAuth callback had transactionId cookie but no matching pending authorization (expired or already consumed)', {
          transactionId,
        });
      }

      res.redirect('/');
    },
  );

  app.get('/logout', authLimiter, (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.get('/csrf-token', authLimiter, ensureAuthenticated, (req: Request, res: Response) => {
    res.json({
      csrfToken: res.locals._csrf || (req as any).csrfToken?.() || null,
    });
  });

  // Discovery: RFC 9728 Protected Resource Metadata & RFC 8414 Authorization Server Metadata
  app.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
    res.json(buildProtectedResourceMetadata(baseUrl, SCOPES_SUPPORTED));
  });

  app.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
    res.json(buildAuthorizationServerMetadata(baseUrl, SCOPES_SUPPORTED));
  });

  // RFC 7591 Dynamic Client Registration
  app.post('/oauth/register', authLimiter, (req: Request, res: Response) => {
    const body = req.body || {};
    const redirectUris: unknown = body.redirect_uris;
    const clientName: unknown = body.client_name;
    const scope: unknown = body.scope;

    if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
      return res.status(400).json({
        error: 'invalid_redirect_uri',
        error_description: 'redirect_uris (non-empty array) is required',
      });
    }

    for (const uri of redirectUris) {
      if (typeof uri !== 'string') {
        return res.status(400).json({
          error: 'invalid_redirect_uri',
          error_description: 'redirect_uris must be strings',
        });
      }
      try {
        new URL(uri);
      } catch {
        return res.status(400).json({
          error: 'invalid_redirect_uri',
          error_description: `malformed redirect_uri: ${uri}`,
        });
      }
    }

    const reg = registerClient({
      redirectUris: redirectUris as string[],
      clientName: typeof clientName === 'string' ? clientName : undefined,
      scope: typeof scope === 'string' ? scope : undefined,
    });

    log('info', 'OAuth client registered', {
      clientId: reg.clientId,
      clientName: reg.clientName,
      redirectUris: reg.redirectUris,
    });

    res.status(201).json({
      client_id: reg.clientId,
      client_id_issued_at: reg.clientIdIssuedAt,
      redirect_uris: reg.redirectUris,
      client_name: reg.clientName,
      token_endpoint_auth_method: reg.tokenEndpointAuthMethod,
      grant_types: reg.grantTypes,
      response_types: reg.responseTypes,
      scope: reg.scope,
    });
  });

  // Authorization endpoint (OAuth 2.1 + PKCE + RFC 8707)
  app.get('/oauth/authorize', loginLimiter, (req: Request, res: Response, next: NextFunction) => {
    const {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scope,
      state,
    } = req.query as Record<string, string | undefined>;

    if (!client_id) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'client_id required' });
    }
    const client = getClient(client_id);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client', error_description: 'unknown client_id' });
    }
    if (!redirect_uri || !client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'redirect_uri not registered' });
    }

    const redirectWithError = (err: string, description: string) => {
      const url = new URL(redirect_uri);
      url.searchParams.set('error', err);
      url.searchParams.set('error_description', description);
      if (state) url.searchParams.set('state', state);
      return res.redirect(url.toString());
    };

    if (response_type !== 'code') {
      return redirectWithError('unsupported_response_type', 'only response_type=code is supported');
    }
    if (!code_challenge) {
      return redirectWithError('invalid_request', 'code_challenge is required (PKCE)');
    }
    if (code_challenge_method !== 'S256') {
      return redirectWithError('invalid_request', 'code_challenge_method must be S256');
    }

    const resourceParam = req.query.resource as string | string[] | undefined;
    const resourceValidation = processResourceParameter(resourceParam, baseUrl, (req as any).requestId);
    if (!resourceValidation.valid) {
      return redirectWithError(
        resourceValidation.error || 'invalid_target',
        resourceValidation.error_description || 'Invalid resource parameter',
      );
    }

    const transactionId = createTransactionId();
    const pendingAuth: PendingAuthorization = {
      clientId: client_id,
      redirectUri: redirect_uri,
      codeChallenge: code_challenge,
      codeChallengeMethod: 'S256',
      scope: scope || 'mcp:tools',
      ...(resourceValidation.resources.length > 0 ? { resources: resourceValidation.resources } : {}),
      state,
      createdAt: Date.now(),
    };
    storePendingAuthorization(transactionId, pendingAuth);

    res.cookie(OAUTH_TX_COOKIE, transactionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: PENDING_AUTH_TTL_MS,
    });

    log('info', 'Starting MCP-client OAuth authorization', {
      clientId: client_id,
      redirectUri: redirect_uri,
      scope,
      transactionId,
    });

    return passport.authenticate(oauthConfig.provider, { scope: scopeArray })(req, res, next);
  });

  // Token endpoint (authorization_code + refresh_token + RFC 8707)
  app.post('/oauth/token', authLimiter, (req: Request, res: Response) => {
    const body = req.body || {};
    const grant_type = body.grant_type;

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    const tokenResourceParam = body.resource as string | string[] | undefined;
    const tokenResourceValidation = processResourceParameter(tokenResourceParam, baseUrl, (req as any).requestId);
    if (!tokenResourceValidation.valid) {
      return res.status(400).json({
        error: tokenResourceValidation.error || 'invalid_target',
        error_description: tokenResourceValidation.error_description || 'Invalid resource parameter',
      });
    }
    const requestedResources = tokenResourceValidation.resources.length > 0
      ? tokenResourceValidation.resources
      : undefined;

    const issueTokenPair = (
      clientId: string,
      scope: string,
      user: { id: string; username?: string; displayName?: string; email?: string },
      aud?: string | string[],
      resources?: string[],
    ) => {
      const accessToken = jwtValidator.createToken({
        sub: user.id,
        scope,
        ...(aud ? { aud } : {}),
        user: {
          id: user.id,
          username: user.username || user.email || user.id,
          displayName: user.displayName,
          email: user.email,
        },
        client_id: clientId,
      });
      const refreshToken = issueRefreshToken({ clientId, scope, resources, user });
      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken,
        refresh_token_expires_in: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
        scope,
      };
    };

    if (grant_type === 'authorization_code') {
      const { code, redirect_uri, client_id, code_verifier } = body;

      if (!code || !redirect_uri || !client_id || !code_verifier) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'code, redirect_uri, client_id and code_verifier are required',
        });
      }

      const record = consumeAuthorizationCode(code);
      if (!record) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'code invalid or expired' });
      }
      if (record.clientId !== client_id) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'client_id mismatch' });
      }
      if (record.redirectUri !== redirect_uri) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri mismatch' });
      }
      if (!verifyPkceS256(code_verifier, record.codeChallenge)) {
        return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      }

      const resourceMatch = validateResourceMatch(requestedResources, record.resources);
      if (!resourceMatch.valid) {
        return res.status(400).json({
          error: 'invalid_target',
          error_description: resourceMatch.error || 'Requested resource was not authorized',
        });
      }
      const audience = determineAudience(requestedResources, record.resources, baseUrl);
      const tokens = issueTokenPair(record.clientId, record.scope, record.user, audience, record.resources);

      log('info', 'Issued access+refresh tokens to MCP client (authorization_code)', {
        clientId: record.clientId,
        user: record.user.username || record.user.id,
        scope: record.scope,
      });

      return res.json(tokens);
    }

    if (grant_type === 'refresh_token') {
      const { refresh_token, client_id } = body;

      if (!refresh_token) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'refresh_token is required',
        });
      }

      const record = consumeRefreshToken(refresh_token);
      if (!record) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'refresh_token invalid, expired, or revoked',
        });
      }
      if (client_id && record.clientId !== client_id) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'client_id mismatch',
        });
      }

      const resourceMatch = validateResourceMatch(requestedResources, record.resources);
      if (!resourceMatch.valid) {
        return res.status(400).json({
          error: 'invalid_target',
          error_description: resourceMatch.error || 'Requested resource was not authorized',
        });
      }
      const audience = determineAudience(requestedResources, record.resources, baseUrl);
      const tokens = issueTokenPair(record.clientId, record.scope, record.user, audience, record.resources);

      log('info', 'Refreshed access token for MCP client (refresh_token)', {
        clientId: record.clientId,
        user: record.user.username || record.user.id,
        scope: record.scope,
      });

      return res.json(tokens);
    }

    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: `grant_type "${grant_type}" is not supported`,
    });
  });
}
