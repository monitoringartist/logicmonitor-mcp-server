#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  JSONRPCMessage,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import cors from 'cors';
import crypto from 'crypto';
import https from 'https';
import fs from 'fs';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import {
  registerSession,
  registerRefreshCallback,
  startPeriodicCleanup,
  TokenData,
} from '../utils/core/token-refresh.js';
import { parseConfig, validateConfig } from '../utils/core/cli-config.js';
import { configureOAuthStrategy, getRefreshTokenFunction, OAuthUser } from '../utils/core/oauth-strategy.js';
import { getJWTValidator, isJWT, extractAudience } from '../utils/core/jwt-validator.js';
import { ScopeManager } from '../utils/core/scope-manager.js';
import { processResourceParameter, validateResourceMatch, determineAudience } from '../utils/core/resource-validator.js';
import { isMCPError, formatErrorForUser } from '../utils/core/error-handler.js';

// Load environment variables
dotenv.config();

/**
 * MCP Remote Server with Multi-Transport Support
 *
 * Supports:
 * - Streamable HTTP transport (POST /mcp)
 * - SSE transport (GET ${MCP_ENDPOINT_PATH}/sse, default: /mcp/sse)
 * - Generic OAuth/OIDC authentication (multiple providers)
 * - Transport fallback strategies
 * - Automatic token refresh
 *
 * Transport Options:
 * - http-only: Only HTTP transport
 * - sse-only: Only SSE transport
 * - both: Both transports available
 */

// Parse and validate configuration
const appConfig = parseConfig();
validateConfig(appConfig);

// Validate authentication configuration
// At least one authentication method must be configured: OAuth or static bearer token
if (!appConfig.oauth && !appConfig.mcpBearerToken) {
  console.error('❌ ERROR: No authentication configured for multi-transport server!');
  console.error('');
  console.error('Configure at least one authentication method:');
  console.error('');
  console.error('Option 1: Static Bearer Token (simpler, for development/testing)');
  console.error('   export MCP_BEARER_TOKEN=your-secret-token-here');
  console.error('');
  console.error('Option 2: OAuth/OIDC (recommended for production)');
  console.error('   export OAUTH_PROVIDER=github');
  console.error('   export OAUTH_CLIENT_ID=your-client-id');
  console.error('   export OAUTH_CLIENT_SECRET=your-client-secret');
  console.error('');
  console.error('See env.example for detailed configuration options');
  process.exit(1);
}

const oauthConfig = appConfig.oauth;

// Parse address to extract host and port
const addressParts = appConfig.address.split(':');
const HOST = addressParts[0] || 'localhost';
const PORT = addressParts[1] ? parseInt(addressParts[1], 10) : 3000;

const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;
const TRANSPORT_MODE = (process.env.TRANSPORT_MODE || 'both') as 'http-only' | 'sse-only' | 'both';
const MCP_ENDPOINT_PATH = appConfig.endpointPath; // Configurable MCP endpoint path (default: /mcp)

// LogicMonitor configuration
const LM_COMPANY = appConfig.lmCompany;
const LM_BEARER_TOKEN = appConfig.lmBearerToken;
const ONLY_READONLY_TOOLS = appConfig.readOnly;

// MCP Server authentication (static bearer token)
const MCP_BEARER_TOKEN = appConfig.mcpBearerToken;

// Logging configuration
const LOG_LEVEL = (process.env.MCP_LOG_LEVEL || appConfig.logLevel) as 'debug' | 'info' | 'warn' | 'error';
const LOG_FORMAT = (process.env.MCP_LOG_FORMAT || appConfig.logFormat) as 'json' | 'human';

// Log level priorities
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Structured logger
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  requestId?: string;
}

function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveFields = [
    'state', 'code', 'code_verifier', 'code_challenge',
    'authorization', 'client_secret', 'access_token',
    'refresh_token', 'password', 'secret', 'token',
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      if (typeof sanitized[field] === 'string') {
        // Show first 4 chars only for debugging
        sanitized[field] = sanitized[field].length > 4
          ? `${sanitized[field].substring(0, 4)}...`
          : '***';
      } else {
        sanitized[field] = '***';
      }
    }
  }

  return sanitized;
}

function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, requestId?: string) {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    ...(data && { data: sanitizeForLogging(data) }),
    ...(requestId && { requestId }),
  };

  if (LOG_FORMAT === 'json') {
    // JSON format (machine-friendly, default)
    console.log(JSON.stringify(entry));
  } else {
    // Chatty format (human-friendly with emoticons)
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    const colorCode = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    }[level];

    const reset = '\x1b[0m';

    let output = `${colorCode}${emoji} [${entry.timestamp}] ${level.toUpperCase()}${reset}: ${message}`;

    if (requestId) {
      output += ` ${colorCode}[${requestId}]${reset}`;
    }

    if (data) {
      output += `\n${JSON.stringify(sanitizeForLogging(data), null, 2)}`;
    }

    console.log(output);
  }
}

// Log startup configuration
log('info', 'Server configuration', {
  port: PORT,
  transport_mode: TRANSPORT_MODE,
  oauth_provider: oauthConfig?.provider || 'none',
  static_token: MCP_BEARER_TOKEN ? 'configured' : 'none',
  token_refresh: oauthConfig?.tokenRefreshEnabled || false,
  log_level: LOG_LEVEL,
  log_format: LOG_FORMAT,
  read_only: ONLY_READONLY_TOOLS,
});

// Configure Passport with the selected OAuth provider (if OAuth is configured)
if (oauthConfig) {
  configureOAuthStrategy(oauthConfig);
}

// Initialize JWT validator for audience validation (RFC 8707)
const jwtValidator = getJWTValidator({
  issuer: BASE_URL,
  audience: BASE_URL,
  expiresIn: 3600, // 1 hour
  algorithm: 'HS256',
});

// Create Express app
const app = express();

// Middleware

// Request/Response logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Store requestId for later use
  (req as any).requestId = requestId;

  // Log request
  log('debug', 'Incoming request', {
    method: req.method,
    endpoint: req.path,
    query: req.query,
    headers: {
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? 'Bearer ***' : 'none',
      'user-agent': req.get('user-agent'),
    },
    body: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
  }, requestId);

  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any = null;

  // Override res.send
  res.send = function(data: any): Response {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Override res.json
  res.json = function(data: any): Response {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    log('debug', 'Response sent', {
      status: res.statusCode,
      duration_ms: duration,
      body: responseBody && typeof responseBody === 'string' && responseBody.length > 1000
        ? responseBody.substring(0, 1000) + '... (truncated)'
        : responseBody,
    }, requestId);
  });

  next();
});

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.text({ type: 'application/json' }));

// Session configuration (only needed if OAuth is enabled)
if (oauthConfig) {
  app.use(
    session({
      secret: oauthConfig.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());
}

/**
 * Helper function to send WWW-Authenticate challenge for insufficient scope
 * Per MCP specification: https://modelcontextprotocol.io/specification/draft/basic/authorization
 * RFC 6750 Section 3.1: https://tools.ietf.org/html/rfc6750#section-3.1
 * @unused - Reserved for future HTTP-level scope challenges (403 responses)
 */
function _sendInsufficientScopeChallenge(
  res: Response,
  requiredScopes: string[],
  description: string = 'Additional scopes required',
  requestId?: string,
): void {
  const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
  const scopeString = requiredScopes.join(' ');

  // Construct WWW-Authenticate header for insufficient_scope error
  const wwwAuthenticateValue = [
    `Bearer realm="${BASE_URL}"`,
    'error="insufficient_scope"',
    `scope="${scopeString}"`,
    `resource_metadata="${resourceMetadataUrl}"`,
    `error_description="${description}"`,
  ].join(', ');

  log('debug', 'Sending 403 Forbidden with insufficient_scope challenge', {
    required_scopes: requiredScopes,
    resource_metadata: resourceMetadataUrl,
  }, requestId);

  res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
  res.status(403).json({
    error: 'insufficient_scope',
    error_description: description,
    scope: scopeString,
    resource_metadata: resourceMetadataUrl,
    authorization_endpoint: `${BASE_URL}/auth/login`,
  });
}

/**
 * Validates that the authenticated user has the required scopes
 * Returns true if authorized, false otherwise
 * @unused - Reserved for future inline scope validation
 */
function _validateScopes(userScopes: string | undefined, requiredScopes: string[]): boolean {
  if (!userScopes) {
    return false;
  }

  const scopeArray = userScopes.split(' ');
  return requiredScopes.every(required => scopeArray.includes(required));
}

// Authentication middleware
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId;

  // Check for session-based authentication (browser)
  if (req.isAuthenticated()) {
    return next();
  }

  // Check for Bearer token authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // First, check against static MCP_BEARER_TOKEN (if configured)
    if (MCP_BEARER_TOKEN && token === MCP_BEARER_TOKEN) {
      // Valid static token - attach minimal user info to request
      (req as any).user = {
        id: 'static-token-user',
        username: 'static-token-user',
        displayName: 'Static Token User',
      };
      (req as any).tokenScope = 'mcp:tools';
      log('debug', 'Authenticated via static Bearer token', undefined, requestId);
      return next();
    }

    // Second, check if it's a JWT token (validate with audience)
    if (isJWT(token)) {
      const validationResult = jwtValidator.validateToken(token, BASE_URL);

      if (validationResult.valid && validationResult.payload) {
        // Valid JWT with correct audience - attach user info
        (req as any).user = validationResult.payload.user || {
          id: validationResult.payload.sub,
          username: validationResult.payload.sub,
          displayName: validationResult.payload.sub,
        };
        (req as any).tokenScope = validationResult.payload.scope;
        (req as any).tokenPayload = validationResult.payload;

        // Store scope in session for later validation
        const sessionId = (req.session as any)?.id || (req as any).requestId;
        if (sessionId) {
          sessionScopes.set(sessionId, validationResult.payload.scope || 'mcp:tools');
        }

        log('debug', 'Authenticated via JWT Bearer token', {
          username: (req as any).user.username,
          audience: validationResult.payload.aud,
          scope: validationResult.payload.scope,
        }, requestId);
        return next();
      } else {
        // JWT validation failed
        log('warn', 'JWT validation failed', {
          error: validationResult.error,
          errorCode: validationResult.errorCode,
          extractedAudience: extractAudience(token),
          expectedAudience: BASE_URL,
        }, requestId);

        // Return specific error for audience mismatch
        if (validationResult.errorCode === 'invalid_audience') {
          const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
          const wwwAuthenticateValue = [
            `Bearer realm="${BASE_URL}"`,
            'error="invalid_token"',
            'error_description="Token audience mismatch: token not intended for this resource server"',
            `resource_metadata="${resourceMetadataUrl}"`,
            'scope="mcp:tools"',
          ].join(', ');

          res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
          return res.status(401).json({
            error: 'invalid_token',
            error_description: 'Token audience mismatch: token not intended for this resource server',
            details: {
              expected_audience: BASE_URL,
              received_audience: extractAudience(token),
            },
            resource_metadata: resourceMetadataUrl,
            authorization_endpoint: `${BASE_URL}/auth/login`,
            scope: 'mcp:tools',
          });
        }
      }
    } else {
      // Third, check against OAuth access tokens (legacy non-JWT tokens)
      const accessTokens = (global as any).accessTokens || new Map();
      const tokenData = accessTokens.get(token);

      if (tokenData && Date.now() < tokenData.expiresAt) {
        // Valid OAuth token - attach user to request
        (req as any).user = tokenData.user;
        (req as any).tokenScope = tokenData.scope;
        log('debug', 'Authenticated via legacy OAuth Bearer token', { username: tokenData.user.username }, requestId);
        return next();
      } else if (tokenData) {
        log('warn', 'Expired OAuth Bearer token', undefined, requestId);
      } else {
        log('warn', 'Invalid Bearer token', undefined, requestId);
      }
    }
  }

  // Return 401 Unauthorized with WWW-Authenticate header per MCP specification
  // RFC 6750 Section 3: https://tools.ietf.org/html/rfc6750#section-3
  // RFC 9728 Section 5.1: https://www.rfc-editor.org/rfc/rfc9728.html#section-5.1
  const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
  const requiredScopes = 'mcp:tools';

  // Construct WWW-Authenticate header with resource metadata and scope guidance
  const wwwAuthenticateValue = [
    `Bearer realm="${BASE_URL}"`,
    `resource_metadata="${resourceMetadataUrl}"`,
    `scope="${requiredScopes}"`,
    'error="invalid_token"',
    'error_description="The access token is missing, expired, or invalid"',
  ].join(', ');

  log('debug', 'Sending 401 Unauthorized with WWW-Authenticate header', {
    resource_metadata: resourceMetadataUrl,
    scope: requiredScopes,
  }, (req as any).requestId);

  res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
  res.status(401).json({
    error: 'invalid_token',
    error_description: 'The access token is missing, expired, or invalid',
    resource_metadata: resourceMetadataUrl,
    authorization_endpoint: `${BASE_URL}/auth/login`,
    scope: requiredScopes,
  });
}

// Initialize LogicMonitor client and handlers
let lmClient: LogicMonitorClient | null = null;
let lmHandlers: LogicMonitorHandlers | null = null;

if (LM_COMPANY && LM_BEARER_TOKEN) {
  lmClient = new LogicMonitorClient({
    company: LM_COMPANY,
    bearerToken: LM_BEARER_TOKEN,
    logger: log,
  });
  lmHandlers = new LogicMonitorHandlers(lmClient);
  log('info', 'LogicMonitor credentials configured', {
    company: LM_COMPANY,
  });
} else {
  log('warn', 'LM_COMPANY and LM_BEARER_TOKEN not set');
  log('warn', 'Tools will be listed but will fail when executed');
}

// Get filtered tools based on ONLY_READONLY_TOOLS setting
const TOOLS: Tool[] = getLogicMonitorTools(ONLY_READONLY_TOOLS);

// Store active MCP servers and sessions
const mcpServers = new Map<string, Server>();
const httpSessions = new Map<string, { server: Server; sessionId: string }>();

// Store custom LM bearer tokens per session
const sessionBearerTokens = new Map<string, string>();

// Logging configuration per session
type LogLevel = 'debug' | 'info' | 'warning' | 'error';
const sessionLogLevels = new Map<string, LogLevel>();
const defaultLogLevel: LogLevel = 'info';

// Store user scopes per session
const sessionScopes = new Map<string, string>();

// Log level priority for filtering
const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
};

// Create MCP server instance
function createMCPServer(sessionId?: string): Server {
  const server = new Server(
    {
      name: 'logicmonitor-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    },
  );

  // Store current user scope for tool execution
  (server as any).currentUserScope = sessionId ? sessionScopes.get(sessionId) || 'mcp:tools' : 'mcp:tools';

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      // Get user scope from context (set by authentication middleware)
      const userScope = (server as any).currentUserScope;

      // Validate scopes for this tool
      const scopeValidation = ScopeManager.validateToolScopes(name, userScope);

      if (!scopeValidation.valid) {
        // Insufficient scope - return error
        log('warn', 'Insufficient scope for tool execution', {
          tool: name,
          userScopes: ScopeManager.parseScopes(userScope),
          requiredScopes: scopeValidation.requiredScopes,
          missingScopes: scopeValidation.missingScopes,
          sessionId,
        });

        const errorMessage = `Insufficient scope to execute tool "${name}". ` +
          `Missing scopes: ${ScopeManager.formatScopes(scopeValidation.missingScopes)}. ` +
          'Please re-authorize with additional permissions.';

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'insufficient_scope',
                error_description: errorMessage,
                tool: name,
                required_scopes: scopeValidation.requiredScopes,
                missing_scopes: scopeValidation.missingScopes,
                resource_metadata: `${BASE_URL}/.well-known/oauth-protected-resource`,
                authorization_endpoint: `${BASE_URL}/auth/login`,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }

      // Check for custom bearer token in session
      let handlers = lmHandlers;
      const customToken = sessionId ? sessionBearerTokens.get(sessionId) : undefined;

      if (customToken) {
        // Create a custom client with the session-specific bearer token
        log('debug', 'Using custom LM bearer token from session', { sessionId });
        const customClient = new LogicMonitorClient({
          company: LM_COMPANY,
          bearerToken: customToken,
          logger: log,
        });
        handlers = new LogicMonitorHandlers(customClient);
      } else if (!lmHandlers) {
        throw new Error('LogicMonitor credentials not configured. Please set LM_COMPANY and LM_BEARER_TOKEN environment variables or provide X-LM-BEARER-TOKEN header.');
      }

      log('debug', 'Executing tool with valid scopes', {
        tool: name,
        userScopes: ScopeManager.parseScopes(userScope),
        requiredScopes: scopeValidation.requiredScopes,
      });

      const result = await handlers!.handleToolCall(name, args || {});

      return {
        content: [
          {
            type: 'text',
            text: handlers!.formatResponse(result),
          },
        ],
      };
    } catch (error) {
      // Handle MCPError with structured suggestions
      if (isMCPError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: formatErrorForUser(error),
            },
          ],
          isError: true,
        };
      }

      // Fallback for other errors
      let errorResponse: any = {
        error: 'Unknown error occurred',
        tool: name,
      };

      if (error instanceof Error) {
        // Check if this error has LM API details attached
        const lmError = (error as any).lmError;
        if (lmError) {
          // Include full LM API error details
          errorResponse = {
            error: error.message,
            tool: name,
            details: lmError,
          };
        } else {
          errorResponse.error = error.message;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(errorResponse, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// Helper function for MCP client logging feature
function _shouldLogToMCPClient(sessionId: string, level: LogLevel): boolean {
  const sessionLevel = sessionLogLevels.get(sessionId) || defaultLogLevel;
  return logLevelPriority[level] >= logLevelPriority[sessionLevel];
}

// MCP client logging function (for logging/setLevel feature)
function logToMCPClient(sessionId: string | null, level: LogLevel, message: string, data?: any) {
  // Convert MCP LogLevel to server log level ('warning' -> 'warn')
  const serverLevel = level === 'warning' ? 'warn' : level;
  log(serverLevel, message, data);

  // Note: In a full implementation, you would also send logging notifications
  // to the MCP client if it has subscribed to logging via the transport
  // This would require extending the transport to support server->client notifications
}

// OAuth Discovery Endpoints (RFC 8414, OpenID Connect Discovery)

// OAuth 2.0 Protected Resource Metadata (RFC 9728)
app.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
  res.json({
    resource: BASE_URL,
    authorization_servers: [BASE_URL],
    scopes_supported: ScopeManager.getAvailableScopes(),
    bearer_methods_supported: ['header', 'query'],
    resource_signing_alg_values_supported: ['RS256', 'ES256'],
    resource_documentation: `${BASE_URL}/docs`,
    resource_policy_uri: `${BASE_URL}/policy`,
    scope_descriptions: Object.fromEntries(
      ScopeManager.getAvailableScopes().map(scope => [
        scope,
        ScopeManager.getScopeDescription(scope),
      ]),
    ),
  });
});

// OAuth 2.0 Authorization Server Metadata (RFC 8414)
app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/auth/login`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    token_endpoint_auth_methods_supported: [
      'none', // Only public clients with PKCE supported
    ],
    jwks_uri: `${BASE_URL}/oauth/jwks`,
    scopes_supported: [...ScopeManager.getAvailableScopes(), 'openid', 'profile', 'email'],
    response_types_supported: ['code', 'token'],
    response_modes_supported: ['query', 'fragment'],
    grant_types_supported: [
      'authorization_code',
      'implicit',
      'refresh_token',
    ],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    token_endpoint_auth_signing_alg_values_supported: [], // Not used for public clients
    code_challenge_methods_supported: ['S256'], // PKCE required, only S256 supported
    resource_indicators_supported: true, // RFC 8707: Resource Indicators for OAuth 2.0
    service_documentation: `${BASE_URL}/docs`,
    ui_locales_supported: ['en-US', 'en-GB'],
  });
});

// OpenID Connect Discovery (OpenID Connect 1.0)
app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/auth/login`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    userinfo_endpoint: `${BASE_URL}/oauth/userinfo`,
    jwks_uri: `${BASE_URL}/oauth/jwks`,
    scopes_supported: ['openid', 'profile', 'email', ...ScopeManager.getAvailableScopes()],
    response_types_supported: ['code', 'id_token', 'token id_token', 'code id_token', 'code token', 'code token id_token'],
    response_modes_supported: ['query', 'fragment', 'form_post'],
    grant_types_supported: ['authorization_code', 'implicit', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    userinfo_signing_alg_values_supported: ['RS256', 'ES256', 'none'],
    token_endpoint_auth_methods_supported: [
      'none', // Only public clients with PKCE supported
    ],
    token_endpoint_auth_signing_alg_values_supported: [], // Not used for public clients
    display_values_supported: ['page', 'popup'],
    claim_types_supported: ['normal'],
    claims_supported: [
      'sub',
      'iss',
      'auth_time',
      'acr',
      'name',
      'given_name',
      'family_name',
      'nickname',
      'profile',
      'picture',
      'email',
      'email_verified',
      'locale',
      'zoneinfo',
    ],
    service_documentation: `${BASE_URL}/docs`,
    claims_parameter_supported: true,
    request_parameter_supported: true,
    request_uri_parameter_supported: true,
    require_request_uri_registration: false,
    op_policy_uri: `${BASE_URL}/policy`,
    op_tos_uri: `${BASE_URL}/terms`,
    code_challenge_methods_supported: ['S256'], // PKCE required, only S256 supported
    resource_indicators_supported: true, // RFC 8707: Resource Indicators for OAuth 2.0
    end_session_endpoint: `${BASE_URL}/logout`,
  });
});

// Expose .well-known endpoints under MCP endpoint path as well (configurable via MCP_ENDPOINT_PATH)
app.get(`${MCP_ENDPOINT_PATH}/.well-known/oauth-protected-resource`, (req: Request, res: Response) => {
  res.json({
    resource: BASE_URL,
    authorization_servers: [BASE_URL],
    scopes_supported: ScopeManager.getAvailableScopes(),
    bearer_methods_supported: ['header', 'query'],
    resource_signing_alg_values_supported: ['RS256', 'ES256'],
    resource_documentation: `${BASE_URL}/docs`,
    resource_policy_uri: `${BASE_URL}/policy`,
    scope_descriptions: Object.fromEntries(
      ScopeManager.getAvailableScopes().map(scope => [
        scope,
        ScopeManager.getScopeDescription(scope),
      ]),
    ),
  });
});

app.get(`${MCP_ENDPOINT_PATH}/.well-known/oauth-authorization-server`, (req: Request, res: Response) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/auth/login`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    token_endpoint_auth_methods_supported: [
      'none', // Only public clients with PKCE supported
    ],
    jwks_uri: `${BASE_URL}/oauth/jwks`,
    scopes_supported: [...ScopeManager.getAvailableScopes(), 'openid', 'profile', 'email'],
    response_types_supported: ['code', 'token'],
    response_modes_supported: ['query', 'fragment'],
    grant_types_supported: [
      'authorization_code',
      'implicit',
      'refresh_token',
    ],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    token_endpoint_auth_signing_alg_values_supported: [], // Not used for public clients
    code_challenge_methods_supported: ['S256'], // PKCE required
    resource_indicators_supported: true, // RFC 8707: Resource Indicators for OAuth 2.0
  });
});

app.get(`${MCP_ENDPOINT_PATH}/.well-known/openid-configuration`, (req: Request, res: Response) => {
  res.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/auth/login`,
    token_endpoint: `${BASE_URL}/oauth/token`,
    registration_endpoint: `${BASE_URL}/oauth/register`,
    userinfo_endpoint: `${BASE_URL}/oauth/userinfo`,
    jwks_uri: `${BASE_URL}/oauth/jwks`,
    scopes_supported: ['openid', 'profile', 'email', ...ScopeManager.getAvailableScopes()],
    response_types_supported: ['code', 'id_token', 'token id_token', 'code id_token', 'code token', 'code token id_token'],
    response_modes_supported: ['query', 'fragment', 'form_post'],
    grant_types_supported: ['authorization_code', 'implicit', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    userinfo_signing_alg_values_supported: ['RS256', 'ES256', 'none'],
    token_endpoint_auth_methods_supported: [
      'none', // Only public clients with PKCE supported
    ],
    token_endpoint_auth_signing_alg_values_supported: [], // Not used for public clients
    display_values_supported: ['page', 'popup'],
    claim_types_supported: ['normal'],
    claims_supported: [
      'sub',
      'name',
      'given_name',
      'family_name',
      'middle_name',
      'nickname',
      'preferred_username',
      'profile',
      'picture',
      'email',
      'email_verified',
      'locale',
      'zoneinfo',
    ],
    service_documentation: `${BASE_URL}/docs`,
    claims_parameter_supported: true,
    request_parameter_supported: true,
    request_uri_parameter_supported: true,
    require_request_uri_registration: false,
    op_policy_uri: `${BASE_URL}/policy`,
    op_tos_uri: `${BASE_URL}/terms`,
    code_challenge_methods_supported: ['S256'], // PKCE required, only S256 supported
    resource_indicators_supported: true, // RFC 8707: Resource Indicators for OAuth 2.0
    end_session_endpoint: `${BASE_URL}/logout`,
  });
});

// Routes

// MCP Server Info endpoint (unauthenticated for Cursor/client discovery)
// GET ${MCP_ENDPOINT_PATH} returns server info, POST ${MCP_ENDPOINT_PATH} is the authenticated transport endpoint
app.get(MCP_ENDPOINT_PATH, (req: Request, res: Response) => {
  // Return server info without requiring authentication
  // This allows MCP clients like Cursor to discover server capabilities
  res.json({
    name: 'logicmonitor-mcp-server',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      logging: {},
    },
    serverInfo: {
      name: 'logicmonitor-mcp-server',
      version: '1.0.0',
    },
    description: 'LogicMonitor MCP Server with OAuth and multi-transport support',
    transports: {
      http: TRANSPORT_MODE !== 'sse-only',
      sse: TRANSPORT_MODE !== 'http-only',
    },
    endpoints: {
      http: TRANSPORT_MODE !== 'sse-only' ? `${BASE_URL}${MCP_ENDPOINT_PATH}` : null,
      sse: TRANSPORT_MODE !== 'http-only' ? `${BASE_URL}${MCP_ENDPOINT_PATH}/sse` : null,
    },
    authentication: {
      required: true,
      type: 'oauth2',
      authorizationUrl: `${BASE_URL}/auth/login`,
      tokenUrl: `${BASE_URL}/oauth/token`,
    },
  });
});

// Home page with transport information
app.get('/', (req: Request, res: Response) => {
  const isAuthenticated = req.isAuthenticated();
  const transportInfo = TRANSPORT_MODE === 'both'
    ? 'HTTP + SSE (both transports enabled)'
    : TRANSPORT_MODE === 'http-only'
      ? 'HTTP only (streamable)'
      : 'SSE only';

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Multi-Transport Server</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; }
        .status { padding: 15px; border-radius: 8px; margin: 20px 0; }
        .authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .unauthenticated { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .transport { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        code { background: #f5f5f5; padding: 3px 8px; border-radius: 4px; font-size: 0.9em; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; }
        .badge-http { background: #cfe2ff; color: #084298; }
        .badge-sse { background: #f8d7da; color: #842029; }
        .badge-both { background: #d1e7dd; color: #0f5132; }
      </style>
    </head>
    <body>
      <h1>🌐 MCP Multi-Transport Server</h1>
      
      <div class="transport">
        <strong>Transport Mode:</strong> ${transportInfo}
        <span class="badge ${TRANSPORT_MODE === 'both' ? 'badge-both' : TRANSPORT_MODE === 'http-only' ? 'badge-http' : 'badge-sse'}">
          ${TRANSPORT_MODE.toUpperCase()}
        </span>
      </div>
      
      ${isAuthenticated ? `
        <div class="status authenticated">
          ✅ <strong>Authenticated</strong> as ${(req.user as any)?.username || 'unknown'}
          <br><br>
          <a href="/logout">Logout</a>
        </div>
        
        <h2>🔌 Available Endpoints</h2>
        <table>
          <thead>
            <tr>
              <th>Transport</th>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${TRANSPORT_MODE !== 'sse-only' ? `
            <tr>
              <td><span class="badge badge-http">HTTP</span></td>
              <td>POST</td>
              <td><code>${MCP_ENDPOINT_PATH}</code></td>
              <td>✅ Available</td>
            </tr>
            ` : ''}
            ${TRANSPORT_MODE !== 'http-only' ? `
            <tr>
              <td><span class="badge badge-sse">SSE</span></td>
              <td>GET</td>
              <td><code>${MCP_ENDPOINT_PATH}/sse</code></td>
              <td>✅ Available</td>
            </tr>
            ` : ''}
            <tr>
              <td><span class="badge" style="background: #e7f1ff; color: #004085;">Health</span></td>
              <td>GET</td>
              <td><code>/healthz</code></td>
              <td>✅ Available</td>
            </tr>
            <tr>
              <td><span class="badge" style="background: #e7f1ff; color: #004085;">Health</span></td>
              <td>GET</td>
              <td><code>/health</code></td>
              <td>✅ Available</td>
            </tr>
          </tbody>
        </table>
        
        <h2>📖 Transport Strategies</h2>
        <p>When connecting, clients can use these strategies:</p>
        <ul>
          <li><strong>http-first</strong>: Try HTTP (POST ${MCP_ENDPOINT_PATH}), fallback to SSE on 404</li>
          <li><strong>sse-first</strong>: Try SSE (GET ${MCP_ENDPOINT_PATH}/sse), fallback to HTTP on 405</li>
          <li><strong>http-only</strong>: Only use HTTP transport</li>
          <li><strong>sse-only</strong>: Only use SSE transport</li>
        </ul>
        
        <h2>💡 Usage Example</h2>
        <pre>npx mcp-remote --transport http-first http://${HOST}:${PORT}${MCP_ENDPOINT_PATH}</pre>
        
      ` : `
        <div class="status unauthenticated">
          ⚠️ <strong>Not Authenticated</strong>
          <br><br>
          ${oauthConfig
    ? `<a href="/auth/login">Login with ${oauthConfig.provider.charAt(0).toUpperCase() + oauthConfig.provider.slice(1)}</a>`
    : 'Use Bearer token authentication: <code>Authorization: Bearer YOUR_TOKEN</code>'
}
        </div>
      `}
      
      <h2>🔧 API Documentation</h2>
      <table>
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Description</th>
            <th>Auth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>GET /</code></td>
            <td>This page</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /.well-known/oauth-protected-resource</code></td>
            <td>OAuth resource metadata (RFC 9728)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /.well-known/oauth-authorization-server</code></td>
            <td>OAuth server metadata (RFC 8414)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /.well-known/openid-configuration</code></td>
            <td>OpenID Connect discovery</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET ${MCP_ENDPOINT_PATH}/.well-known/oauth-protected-resource</code></td>
            <td>OAuth resource metadata (under MCP path)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET ${MCP_ENDPOINT_PATH}/.well-known/oauth-authorization-server</code></td>
            <td>OAuth server metadata (under MCP path)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET ${MCP_ENDPOINT_PATH}/.well-known/openid-configuration</code></td>
            <td>OpenID Connect discovery (under MCP path)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /auth/login</code></td>
            <td>Initiate GitHub OAuth</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /status</code></td>
            <td>Check authentication status</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /healthz</code></td>
            <td>Simple health check (returns "ok")</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>GET /health</code></td>
            <td>Detailed health check (status, version, uptime, memory, connections)</td>
            <td>No</td>
          </tr>
          <tr>
            <td><code>POST ${MCP_ENDPOINT_PATH}</code></td>
            <td>HTTP transport endpoint</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td><code>GET ${MCP_ENDPOINT_PATH}/sse</code></td>
            <td>SSE transport endpoint</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `);
});

// OAuth routes (only if OAuth is configured)
if (oauthConfig) {
  // Generic authorization endpoint that handles MCP Inspector's OAuth flow
  const passportStrategy = oauthConfig.provider === 'custom' ? 'oauth2' : oauthConfig.provider;
  const scopeArray = oauthConfig.scope ? oauthConfig.scope.split(',') : undefined;

  app.get('/auth/login', (req: Request, res: Response, next: NextFunction) => {
    // Get OAuth parameters from query
    const { redirect_uri, state, code_challenge, code_challenge_method, scope, response_type, client_id, resource, display } = req.query;
    const requestId = (req as any).requestId;

    if (redirect_uri) {
      // Validate resource parameter per RFC 8707
      const resourceValidation = processResourceParameter(resource as string | string[] | undefined, BASE_URL, requestId);

      if (!resourceValidation.valid) {
        log('warn', 'Invalid resource parameter in authorization request', {
          error: resourceValidation.error,
          error_description: resourceValidation.error_description,
        }, requestId);

        // Return error per RFC 6749 Section 4.1.2.1 and RFC 8707 Section 2
        const errorParams = new URLSearchParams({
          error: resourceValidation.error || 'invalid_request',
          error_description: resourceValidation.error_description || 'Invalid resource parameter',
          state: state as string || '',
        });

        return res.redirect(`${redirect_uri}?${errorParams.toString()}`);
      }

      // OAuth flow - encode parameters in provider state to survive the round-trip
      const oauthParams = {
        redirect_uri: redirect_uri as string,
        original_state: state as string,
        code_challenge: code_challenge as string,
        code_challenge_method: code_challenge_method as string,
        scope: scope as string,
        response_type: response_type as string,
        client_id: client_id as string,
        resource: resource as string | string[] | undefined,
        display: display as string,
      };

      // Encode parameters as base64 to pass through OAuth
      const encodedState = Buffer.from(JSON.stringify(oauthParams)).toString('base64url');

      log('info', 'Starting OAuth flow', {
        provider: oauthConfig.provider,
        redirect_uri,
        code_challenge_method,
        display,
        resources: resourceValidation.resources,
      }, requestId);

      // Continue with authentication, passing encoded state
      passport.authenticate(passportStrategy, {
        scope: scopeArray,
        state: encodedState,
      })(req, res, next);
    } else {
      // No OAuth parameters, proceed with normal flow
      passport.authenticate(passportStrategy, {
        scope: scopeArray,
      })(req, res, next);
    }
  });

  app.get(
    '/auth/callback',
    passport.authenticate(passportStrategy, { failureRedirect: '/' }),
    (req: Request, res: Response) => {
      const requestId = (req as any).requestId;
      log('debug', 'OAuth callback received', { provider: oauthConfig.provider }, requestId);

      // Register session with token refresh if user has tokens
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
        log('info', 'Session registered with token refresh', {
          provider: oauthConfig.provider,
          username: user.username,
          sessionId: sessionId.substring(0, 8) + '...',
        }, requestId);

        // Register refresh callback if provider supports it
        if (tokenData.refreshToken && oauthConfig.tokenRefreshEnabled) {
          const refreshFn = getRefreshTokenFunction(oauthConfig.provider);
          if (refreshFn) {
            registerRefreshCallback(sessionId, refreshFn);
            log('info', `Token refresh enabled for ${oauthConfig.provider}`, undefined, requestId);
          }
        }
      }

      // Try to decode OAuth parameters from state
      let oauthParams: any = null;
      if (req.query.state) {
        try {
          const decoded = Buffer.from(req.query.state as string, 'base64url').toString('utf-8');
          oauthParams = JSON.parse(decoded);
          log('debug', 'Decoded OAuth parameters from state', {
            redirect_uri: oauthParams.redirect_uri,
            code_challenge_method: oauthParams.code_challenge_method,
          }, requestId);
        } catch {
          log('debug', 'No OAuth parameters in state (normal flow)', undefined, requestId);
        }
      }

      // Check if this was initiated by an OAuth client (like MCP Inspector)
      if (oauthParams && oauthParams.redirect_uri) {
        const redirectUri = oauthParams.redirect_uri;
        const state = oauthParams.original_state;

        // Generate authorization code (in production, this should be a secure token)
        const authCode = Buffer.from(JSON.stringify({
          userId: (req.user as any)?.id,
          username: (req.user as any)?.username,
          timestamp: Date.now(),
        })).toString('base64url');

        // Store the auth code temporarily (in production, use Redis or database)
        const authCodes = (global as any).authCodes || ((global as any).authCodes = new Map());
        authCodes.set(authCode, {
          user: req.user,
          code_challenge: oauthParams.code_challenge,
          code_challenge_method: oauthParams.code_challenge_method,
          scope: oauthParams.scope,
          resource: oauthParams.resource, // RFC 8707: Store resource parameter for token endpoint validation
          redirectUri: redirectUri,
          expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        log('info', 'OAuth flow complete, authorization code generated', undefined, requestId);

        // Check if client wants manual code entry (Quick OAuth Flow)
        // This is ONLY triggered by explicit display=page parameter
        const isQuickFlow = (oauthParams.display === 'page');

        if (isQuickFlow) {
        // Display authorization code for manual entry (MCP Inspector pattern)
          res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authorization Code</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                max-width: 600px;
                margin: 100px auto;
                padding: 40px;
                background: #f5f5f7;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              h1 {
                color: #1d1d1f;
                margin: 0 0 20px 0;
                font-size: 32px;
              }
              p {
                color: #6e6e73;
                line-height: 1.6;
                margin: 0 0 20px 0;
              }
              .code-container {
                background: #f5f5f7;
                border: 2px solid #0071e3;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                word-break: break-all;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 14px;
                color: #1d1d1f;
                position: relative;
              }
              .copy-button {
                background: #0071e3;
                color: white;
                border: none;
                border-radius: 8px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                margin: 10px 0;
                width: 100%;
                transition: background 0.2s;
              }
              .copy-button:hover {
                background: #0077ed;
              }
              .copy-button:active {
                background: #006edb;
              }
              .success {
                color: #34c759;
                font-weight: 600;
                display: none;
                margin-top: 10px;
              }
              .info {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
                color: #856404;
              }
              .user-info {
                background: #d1ecf1;
                border-left: 4px solid #0c5460;
                padding: 12px;
                margin: 20px 0;
                border-radius: 4px;
                color: #0c5460;
              }
              .continue-link {
                display: block;
                text-align: center;
                color: #0071e3;
                text-decoration: none;
                margin-top: 20px;
                font-weight: 500;
              }
              .continue-link:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Authorization Successful</h1>
              
              <div class="user-info">
                <strong>Authenticated as:</strong> ${(req.user as any)?.username || 'User'}
              </div>
              
              <p>
                Your authorization code has been generated. Copy this code and paste it into 
                the MCP Inspector to complete the authentication.
              </p>
              
              <div class="code-container" id="authCode">${authCode}</div>
              
              <button class="copy-button" onclick="copyCode()">
                📋 Copy Authorization Code
              </button>
              
              <div class="success" id="successMessage">
                ✅ Copied to clipboard!
              </div>
              
              <div class="info">
                <strong>⏰ Important:</strong> This code expires in 10 minutes and can only be used once.
              </div>
              
              <p style="font-size: 14px; color: #86868b; margin-top: 30px;">
                After copying the code, return to the MCP Inspector and paste it in the 
                "Authorization Code" field, then click "Continue".
              </p>
              
              <a href="/" class="continue-link">Return to Home →</a>
            </div>
            
            <script>
              function copyCode() {
                const code = document.getElementById('authCode').textContent;
                navigator.clipboard.writeText(code).then(() => {
                  const button = document.querySelector('.copy-button');
                  const success = document.getElementById('successMessage');
                  
                  button.textContent = '✅ Copied!';
                  success.style.display = 'block';
                  
                  setTimeout(() => {
                    button.textContent = '📋 Copy Authorization Code';
                    success.style.display = 'none';
                  }, 3000);
                }).catch(err => {
                  alert('Failed to copy code. Please select and copy it manually.');
                });
              }
              
              // Auto-select code on page load for easy manual copying
              window.addEventListener('load', () => {
                const codeElement = document.getElementById('authCode');
                codeElement.addEventListener('click', () => {
                  const selection = window.getSelection();
                  const range = document.createRange();
                  range.selectNodeContents(codeElement);
                  selection.removeAllRanges();
                  selection.addRange(range);
                });
              });
            </script>
          </body>
          </html>
        `);
        } else {
        // Automatic redirect for standard OAuth clients
          const redirectUrl = new URL(redirectUri);
          redirectUrl.searchParams.set('code', authCode);
          if (state) {
            redirectUrl.searchParams.set('state', state as string);
          }
          res.redirect(redirectUrl.toString());
        }
      } else {
      // Normal flow - redirect to home page
        res.redirect('/');
      }
    },
  );

  // OAuth Dynamic Client Registration endpoint (RFC 7591)
  // Required by MCP specification for clients like Cursor to register
  app.post('/oauth/register', (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    log('info', 'Dynamic Client Registration request received', undefined, requestId);

    try {
      const {
        client_name,
        redirect_uris,
        grant_types,
        response_types,
        application_type,
        scope,
      } = req.body;

      // This server only supports public clients (PKCE-only, no secrets)
      // All clients are public by default
      const client_id = crypto.randomBytes(16).toString('hex');
      const client_id_issued_at = Math.floor(Date.now() / 1000);

      // Store client registration (in production, use database)
      const registeredClients = (global as any).registeredClients || ((global as any).registeredClients = new Map());

      const clientData = {
        client_id,
        client_name: client_name || 'Unnamed Client',
        redirect_uris: redirect_uris || [],
        grant_types: grant_types || ['authorization_code'],
        response_types: response_types || ['code'],
        token_endpoint_auth_method: 'none', // Always public (PKCE-only)
        application_type: application_type || 'web',
        scope: scope || 'mcp:tools',
        client_id_issued_at,
        created_at: new Date().toISOString(),
      };

      registeredClients.set(client_id, clientData);

      log('info', 'Client registered (public, PKCE-only)', {
        client_id,
        client_name: clientData.client_name,
        redirect_uris: clientData.redirect_uris,
      }, requestId);

      // Return client credentials per RFC 7591
      // No client_secret - this server only supports public clients with PKCE
      res.json({
        client_id,
        client_id_issued_at,
        client_name: clientData.client_name,
        redirect_uris: clientData.redirect_uris,
        grant_types: clientData.grant_types,
        response_types: clientData.response_types,
        token_endpoint_auth_method: 'none', // Always public
        application_type: clientData.application_type,
        scope: clientData.scope,
      });
    } catch (error: any) {
      log('error', 'Client registration error', { error: error.message }, requestId);
      res.status(400).json({
        error: 'invalid_client_metadata',
        error_description: error.message || 'Invalid client registration request',
      });
    }
  });

  // OAuth token endpoint (for exchanging authorization code for access token)
  // This server ONLY supports public clients with PKCE (no client secrets)
  app.post('/oauth/token', express.urlencoded({ extended: true }), (req: Request, res: Response) => {
    const { grant_type, code, client_id, code_verifier, resource } = req.body;
    const requestId = (req as any).requestId;

    log('info', 'Token request received', { grant_type, client_id, has_verifier: !!code_verifier, resource }, requestId);

    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported',
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing authorization code',
      });
    }

    // Retrieve the authorization code data
    const authCodes = (global as any).authCodes || new Map();
    const authData = authCodes.get(code);

    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code',
      });
    }

    // Check expiration
    if (Date.now() > authData.expiresAt) {
      authCodes.delete(code);
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code has expired',
      });
    }

    // PKCE is REQUIRED for all clients (this server doesn't support client secrets)
    if (!authData.code_challenge || !code_verifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'PKCE is required. Missing code_challenge or code_verifier. This server only supports public clients with PKCE.',
      });
    }

    // Verify PKCE
    const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');

    if (hash !== authData.code_challenge) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid code verifier - PKCE verification failed',
      });
    }

    log('debug', 'PKCE verification successful', undefined, requestId);

    // RFC 8707: Validate resource parameter if provided
    // The resource in the token request must match or be a subset of what was authorized
    const resourceValidation = validateResourceMatch(resource, authData.resource);
    if (!resourceValidation.valid) {
      log('warn', 'Resource parameter mismatch', {
        requested: resource,
        authorized: authData.resource,
        error: resourceValidation.error,
      }, requestId);

      return res.status(400).json({
        error: 'invalid_target',
        error_description: resourceValidation.error || 'Requested resource does not match authorized resource',
      });
    }

    // Determine the JWT audience based on resource parameter (RFC 8707 Section 4)
    // If resource was specified, use it as the audience. Otherwise, use BASE_URL
    const audience = determineAudience(resource, authData.resource, BASE_URL);

    log('debug', 'Resource validation successful', { audience }, requestId);

    // Generate JWT access token with audience binding (RFC 8707)
    // Per MCP specification: "MCP clients MUST implement and use the resource parameter"
    const accessToken = jwtValidator.createToken({
      sub: authData.user.id,
      scope: authData.scope || 'mcp:tools',
      client_id: client_id,
      // Override default audience with resource-specific audience
      ...(audience !== BASE_URL && { aud: audience }),
      user: {
        id: authData.user.id,
        username: authData.user.username,
        displayName: authData.user.displayName,
        email: authData.user.email,
      },
    });

    // Store access token for validation (in production, use Redis or database)
    // This allows us to support both JWT and legacy tokens
    const accessTokens = (global as any).accessTokens || ((global as any).accessTokens = new Map());
    accessTokens.set(accessToken, {
      user: authData.user,
      scope: authData.scope,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    // Delete the authorization code (one-time use)
    authCodes.delete(code);

    log('info', 'JWT access token issued with audience binding', {
      username: authData.user.username,
      audience: BASE_URL,
      scope: authData.scope,
    }, requestId);

    // Return the access token per RFC 6749
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authData.scope || 'mcp:tools',
    });
  });

  // Logout
  app.get('/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
}

// Health check endpoint (simple)
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('ok');
});

// Detailed health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();

  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
    },
    connections: {
      mcp: mcpServers.size,
      http: httpSessions.size,
    },
    timestamp: new Date().toISOString(),
    transport: {
      mode: TRANSPORT_MODE,
      http: TRANSPORT_MODE !== 'sse-only',
      sse: TRANSPORT_MODE !== 'http-only',
    },
  });
});

// Status endpoint
app.get('/status', (req: Request, res: Response) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      username: (req.user as any)?.username,
      displayName: (req.user as any)?.displayName,
    } : null,
    transports: {
      http: TRANSPORT_MODE !== 'sse-only',
      sse: TRANSPORT_MODE !== 'http-only',
      mode: TRANSPORT_MODE,
    },
  });
});

// Streamable HTTP Transport - POST ${MCP_ENDPOINT_PATH}
if (TRANSPORT_MODE !== 'sse-only') {
  app.post(MCP_ENDPOINT_PATH, ensureAuthenticated, async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    log('debug', 'HTTP transport request', { username: (req.user as any)?.username }, requestId);

    try {
      // Get or create session
      const sessionId = req.headers['mcp-session-id'] as string ||
                       (req.session as any).id ||
                       `http-${Date.now()}-${Math.random()}`;

      // Check for custom LM bearer token header
      const customBearerToken = req.headers['x-lm-bearer-token'] as string;
      if (customBearerToken) {
        log('debug', 'Custom LM bearer token provided in request', { sessionId }, requestId);
        sessionBearerTokens.set(sessionId, customBearerToken);
      } else {
        // Remove any existing custom token if header is not present
        sessionBearerTokens.delete(sessionId);
      }

      let sessionData = httpSessions.get(sessionId);

      if (!sessionData) {
        const server = createMCPServer(sessionId);
        sessionData = { server, sessionId };
        httpSessions.set(sessionId, sessionData);
        log('debug', 'Created new HTTP session', { sessionId }, requestId);
      }

      // Parse the JSON-RPC message
      const message = req.body as JSONRPCMessage;

      // Handle the message through the server's message handler
      // This is a simplified implementation - production would use proper transport classes
      const response = await handleMCPMessage(sessionData.server, message);

      // Set session header for client
      res.setHeader('Mcp-Session-Id', sessionId);

      // For notifications (null response), return 200 OK
      if (response === null) {
        res.status(200).send();
      } else {
        res.json(response);
      }

    } catch (error: any) {
      log('error', 'HTTP transport error', { error: error.message, stack: error.stack }, requestId);

      // Return JSON-RPC error response without crashing
      res.status(200).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message || 'An unexpected error occurred',
        },
        id: null,
      });
    }
  });
} else {
  // Return 404 for HTTP endpoint when in SSE-only mode
  app.post(MCP_ENDPOINT_PATH, (req: Request, res: Response) => {
    res.status(404).json({
      error: 'HTTP transport not available',
      message: 'Server is configured for SSE-only transport',
      availableTransports: ['sse'],
      sseEndpoint: `${MCP_ENDPOINT_PATH}/sse`,
    });
  });
}

// SSE Transport - GET ${MCP_ENDPOINT_PATH}/sse
if (TRANSPORT_MODE !== 'http-only') {
  app.get(`${MCP_ENDPOINT_PATH}/sse`, ensureAuthenticated, async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    log('debug', 'SSE transport connection', { username: (req.user as any)?.username }, requestId);

    const sessionId = (req.session as any).id;

    // Check for custom LM bearer token header
    const customBearerToken = req.headers['x-lm-bearer-token'] as string;
    if (customBearerToken) {
      log('debug', 'Custom LM bearer token provided in SSE connection', { sessionId }, requestId);
      sessionBearerTokens.set(sessionId, customBearerToken);
    }

    let server = mcpServers.get(sessionId);

    if (!server) {
      server = createMCPServer(sessionId);
      mcpServers.set(sessionId, server);
    }

    const transport = new SSEServerTransport('/mcp/message', res);
    await server.connect(transport);

    req.on('close', () => {
      log('debug', 'SSE connection closed', { username: (req.user as any)?.username }, requestId);
      mcpServers.delete(sessionId);
      sessionBearerTokens.delete(sessionId);
    });
  });

  app.post(`${MCP_ENDPOINT_PATH}/message`, ensureAuthenticated, (req: Request, res: Response) => {
    res.status(200).send();
  });
} else {
  // Return 405 for SSE endpoint when in HTTP-only mode
  app.get(`${MCP_ENDPOINT_PATH}/sse`, (req: Request, res: Response) => {
    res.status(405).json({
      error: 'SSE transport not available',
      message: 'Server is configured for HTTP-only transport',
      availableTransports: ['http'],
      httpEndpoint: MCP_ENDPOINT_PATH,
    });
  });
}

// Helper function to handle MCP messages (simplified)
async function handleMCPMessage(server: Server, message: JSONRPCMessage): Promise<any> {
  // This is a simplified message handler
  // In production, you'd use the proper transport protocol handlers

  try {
    if (!('method' in message)) {
      // Invalid message format - return JSON-RPC error
      return {
        jsonrpc: '2.0',
        error: {
          code: -32600,
          message: 'Invalid Request',
          data: 'Message must contain a method field',
        },
        id: null,
      };
    }

    // Check if this is a notification (no id field)
    const messageId = 'id' in message ? message.id : null;
    const isNotification = messageId === null || messageId === undefined;

    return new Promise((resolve) => {
      // Wrap in try-catch to prevent server crashes
      try {
        // Handle notifications (no response needed)
        if (isNotification) {
          if (message.method === 'notifications/initialized') {
            log('info', 'Client initialized');
          } else if (message.method === 'notifications/cancelled') {
            log('info', 'Request cancelled by client');
          } else {
            log('debug', 'Received notification', { method: message.method });
          }
          resolve(null); // No response for notifications
          return;
        }

        // Handle requests (response needed)
        if (message.method === 'initialize') {
          // Handle initialize request
          resolve({
            jsonrpc: '2.0',
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                logging: {},
              },
              serverInfo: {
                name: 'logicmonitor-mcp-server',
                version: '1.0.0',
              },
            },
            id: messageId,
          });
        } else if (message.method === 'ping') {
          // Handle ping request (keepalive)
          // Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/utilities/ping
          // MUST respond promptly with an empty response
          resolve({
            jsonrpc: '2.0',
            result: {},
            id: messageId,
          });
        } else if (message.method === 'tools/list') {
          resolve({
            jsonrpc: '2.0',
            result: { tools: TOOLS },
            id: messageId,
          });
        } else if (message.method === 'tools/call') {
          const params = message.params as any;

          // Validate parameters
          if (!params || !params.name) {
            resolve({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: name',
              },
              id: messageId,
            });
            return;
          }

          // Handle tool execution using LogicMonitor handlers
          (async () => {
            try {
              if (!lmHandlers) {
                resolve({
                  jsonrpc: '2.0',
                  error: {
                    code: -32603,
                    message: 'Internal error',
                    data: 'LogicMonitor credentials not configured. Please set LM_COMPANY and LM_BEARER_TOKEN environment variables.',
                  },
                  id: messageId,
                });
                return;
              }

              const result = await lmHandlers.handleToolCall(params.name, params.arguments || {});

              resolve({
                jsonrpc: '2.0',
                result: {
                  content: [{
                    type: 'text',
                    text: lmHandlers.formatResponse(result),
                  }],
                },
                id: messageId,
              });
            } catch (error: any) {
              // Handle MCPError with structured suggestions
              if (isMCPError(error)) {
                log('error', 'MCP error in tool execution', {
                  tool: params.name,
                  code: error.code,
                  message: error.message,
                });

                resolve({
                  jsonrpc: '2.0',
                  result: {
                    content: [{
                      type: 'text',
                      text: formatErrorForUser(error),
                    }],
                    isError: true,
                  },
                  id: messageId,
                });
                return;
              }

              // Fallback for other errors
              let errorMessage = 'Unknown error occurred';
              let errorData: any = errorMessage;

              if (error instanceof Error) {
                errorMessage = error.message;
                // Check if this error has LM API details attached
                const lmError = (error as any).lmError;
                if (lmError) {
                  // Include full LM API error details
                  errorData = {
                    message: errorMessage,
                    details: lmError,
                  };
                  log('error', 'LM API error in tool execution', { tool: params.name, lmError });
                } else {
                  errorData = errorMessage;
                  log('error', 'Tool execution error', { tool: params.name, error: errorMessage });
                }
              }

              resolve({
                jsonrpc: '2.0',
                error: {
                  code: -32603,
                  message: 'Internal error',
                  data: errorData,
                },
                id: messageId,
              });
            }
          })();
        } else if (message.method === 'logging/setLevel') {
          // Handle logging level configuration
          const params = message.params as any;

          // Validate level parameter
          if (!params || !params.level) {
            resolve({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params',
                data: 'Missing required parameter: level',
              },
              id: messageId,
            });
            return;
          }

          const level = params.level as string;
          const validLevels = ['debug', 'info', 'warning', 'error'];

          if (!validLevels.includes(level)) {
            resolve({
              jsonrpc: '2.0',
              error: {
                code: -32602,
                message: 'Invalid params',
                data: `Invalid log level: ${level}. Must be one of: ${validLevels.join(', ')}`,
              },
              id: messageId,
            });
            return;
          }

          // Store the log level for this session
          // Note: In HTTP transport, we'd need session ID tracking
          const sessionId = 'default'; // Simplified for this example
          sessionLogLevels.set(sessionId, level as LogLevel);

          log('info', 'MCP client log level changed', { level });
          logToMCPClient(sessionId, 'info', `Log level changed to: ${level}`);

          resolve({
            jsonrpc: '2.0',
            result: {},
            id: messageId,
          });
        } else {
          // Unknown method - return proper error
          log('warn', 'Unknown method requested', { method: message.method });
          resolve({
            jsonrpc: '2.0',
            error: {
              code: -32601,
              message: 'Method not found',
              data: `Unknown method: ${message.method}. Supported methods: initialize, ping, tools/list, tools/call, logging/setLevel`,
            },
            id: messageId,
          });
        }
      } catch (innerError: any) {
        // Catch any unexpected errors and return JSON-RPC error
        log('error', 'Error handling message', { error: innerError.message });
        resolve({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
            data: innerError.message || 'Unknown error occurred',
          },
          id: messageId,
        });
      }
    });
  } catch (outerError: any) {
    // Catch any errors in the outer try block
    log('error', 'Fatal error handling message', { error: outerError.message });
    return {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: outerError.message || 'Unknown error occurred',
      },
      id: null,
    };
  }
}

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = (req as any).requestId;
  log('error', 'Express error handler', { error: err.message, stack: err.stack }, requestId);
  res.status(500).json({ error: 'Internal server error' });
});

// Start periodic cleanup of expired sessions (only if OAuth is configured)
if (oauthConfig && oauthConfig.tokenRefreshEnabled) {
  startPeriodicCleanup();
  log('info', 'Token refresh system initialized');
}

// Start server
// Check if TLS is configured
const useTLS = !!(appConfig.tlsCertFile && appConfig.tlsKeyFile);

let server: https.Server | ReturnType<typeof app.listen>;

if (useTLS) {
  // HTTPS server with TLS
  try {
    const tlsOptions = {
      cert: fs.readFileSync(appConfig.tlsCertFile!),
      key: fs.readFileSync(appConfig.tlsKeyFile!),
    };
    server = https.createServer(tlsOptions, app).listen(PORT, () => {
      log('info', 'MCP Multi-Transport Server started with TLS/HTTPS', {
        url: `https://${HOST}:${PORT}`,
        transport_mode: TRANSPORT_MODE,
        oauth_provider: oauthConfig?.provider || 'none',
        static_token: MCP_BEARER_TOKEN ? 'configured' : 'none',
        token_refresh: oauthConfig?.tokenRefreshEnabled ? 'enabled' : 'disabled',
        tls: 'enabled',
        cert_file: appConfig.tlsCertFile,
        endpoints: {
          http: TRANSPORT_MODE !== 'sse-only' ? `POST https://${HOST}:${PORT}${MCP_ENDPOINT_PATH}` : null,
          sse: TRANSPORT_MODE !== 'http-only' ? `GET https://${HOST}:${PORT}${MCP_ENDPOINT_PATH}/sse` : null,
        },
      });
    });
  } catch (error) {
    console.error('❌ ERROR: Failed to start HTTPS server');
    console.error('  TLS certificate file:', appConfig.tlsCertFile);
    console.error('  TLS key file:', appConfig.tlsKeyFile);
    console.error('  Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
} else {
  // HTTP server (no TLS)
  server = app.listen(PORT, () => {
    log('info', 'MCP Multi-Transport Server started', {
      url: `http://${HOST}:${PORT}`,
      transport_mode: TRANSPORT_MODE,
      oauth_provider: oauthConfig?.provider || 'none',
      static_token: MCP_BEARER_TOKEN ? 'configured' : 'none',
      token_refresh: oauthConfig?.tokenRefreshEnabled ? 'enabled' : 'disabled',
      tls: 'disabled',
      endpoints: {
        http: TRANSPORT_MODE !== 'sse-only' ? `POST http://${HOST}:${PORT}${MCP_ENDPOINT_PATH}` : null,
        sse: TRANSPORT_MODE !== 'http-only' ? `GET http://${HOST}:${PORT}${MCP_ENDPOINT_PATH}/sse` : null,
      },
    });
  });
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
  log('info', `${signal} received, closing server gracefully...`);

  try {
    // Close all MCP connections
    log('info', `Closing ${mcpServers.size} MCP SSE connections...`);
    for (const [sessionId, mcpServer] of mcpServers) {
      try {
        await mcpServer.close();
        log('debug', `Closed MCP connection for session: ${sessionId}`);
      } catch (error) {
        log('error', `Error closing MCP connection for session ${sessionId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Close HTTP sessions (these don't need explicit close, but we clean up references)
    log('info', `Cleaning up ${httpSessions.size} HTTP sessions...`);
    httpSessions.clear();
    sessionBearerTokens.clear();
    sessionLogLevels.clear();
    sessionScopes.clear();

    // Close HTTP/HTTPS server
    log('info', 'Closing HTTP/HTTPS server...');
    server.close(() => {
      log('info', 'Server closed successfully');
      process.exit(0);
    });

    // Force close after 10 seconds if graceful shutdown takes too long
    setTimeout(() => {
      log('error', 'Graceful shutdown timed out after 10 seconds, forcing exit...');
      process.exit(1);
    }, 10000);
  } catch (error) {
    log('error', 'Error during graceful shutdown', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
