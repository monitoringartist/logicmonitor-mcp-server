#!/usr/bin/env node

/**
 * LogicMonitor MCP Server - Unified Transport Server
 *
 * This server supports all transport types:
 * - STDIO: For local usage (Claude Desktop, CLI)
 * - SSE: Server-Sent Events for web clients
 * - Streamable HTTP: For advanced integrations
 *
 * Transport is selected via configuration (--transport flag or MCP_TRANSPORT env var)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { handleSSEConnection } from './sse.js';
import { handleHTTPRequest, handleHTTPDelete } from './streamable-http.js';
import {
  CallToolRequestSchema,
  Tool,
  JSONRPCMessage,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import https from 'https';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import { listLMResources, readLMResource } from '../api/resources.js';
import { listLMPrompts, getLMPrompt, generatePromptMessages } from '../api/prompts.js';
import {
  registerSession,
  registerRefreshCallback,
  startPeriodicCleanup,
  TokenData,
} from '../utils/core/token-refresh.js';
import { parseConfig, validateConfig } from '../utils/core/cli-config.js';
import { configureOAuthStrategy, getRefreshTokenFunction, OAuthUser } from '../utils/core/oauth-strategy.js';
import { getJWTValidator, isJWT } from '../utils/core/jwt-validator.js';
import { ScopeManager } from '../utils/core/scope-manager.js';
import { isMCPError, formatErrorForUser } from '../utils/core/error-handler.js';
import { createServer } from './server.js';

// Load environment variables
dotenv.config();

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const SERVER_VERSION = packageJson.version;

// Parse and validate configuration
const appConfig = parseConfig();
validateConfig(appConfig);

const TRANSPORT = appConfig.transport;
const LM_COMPANY = appConfig.lmCompany;
const LM_BEARER_TOKEN = appConfig.lmBearerToken;
const ONLY_READONLY_TOOLS = appConfig.readOnly;

// ===========================
// STDIO Transport Mode
// ===========================
if (TRANSPORT === 'stdio') {
  // STDIO mode: Simple local transport (no authentication needed)
  console.error('🚀 Starting LogicMonitor MCP Server in STDIO mode...');

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined = undefined;
  let lmHandlers: LogicMonitorHandlers | undefined = undefined;

  if (LM_COMPANY && LM_BEARER_TOKEN) {
    lmClient = new LogicMonitorClient({
      company: LM_COMPANY,
      bearerToken: LM_BEARER_TOKEN,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient);
    console.error('✅ LogicMonitor credentials configured');
  } else {
    console.error('⚠️  Warning: LM_COMPANY and LM_BEARER_TOKEN not set');
    console.error('⚠️  Tools will be listed but will fail when executed');
    console.error('⚠️  Please set environment variables to use the tools');
  }

  // Get filtered tools
  let TOOLS = getLogicMonitorTools(ONLY_READONLY_TOOLS);

  // Filter by enabled tools if specified
  if (appConfig.enabledTools && appConfig.enabledTools.length > 0) {
    const originalCount = TOOLS.length;
    TOOLS = TOOLS.filter(tool => appConfig.enabledTools!.includes(tool.name));
    console.error(`ℹ️  Filtered tools by enabled tools list: ${originalCount} -> ${TOOLS.length} tools`);

    if (TOOLS.length === 0) {
      console.error('⚠️  No tools match the enabled tools list! Check your MCP_ENABLED_TOOLS configuration.');
    }

    const knownToolNames = getLogicMonitorTools(ONLY_READONLY_TOOLS).map(t => t.name);
    const unknownTools = appConfig.enabledTools.filter(name => !knownToolNames.includes(name));
    if (unknownTools.length > 0) {
      console.error('⚠️  Unknown tools in enabled tools list:', unknownTools.join(', '));
    }
  }

  // Create server instance using factory pattern
  const { server, cleanup, startNotificationIntervals } = createServer({
    version: SERVER_VERSION,
    tools: TOOLS,
    lmClient,
    lmHandlers,
    enablePeriodicUpdates: false, // Disable periodic updates for STDIO
  });

  // Start the STDIO server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Start notification intervals if enabled
    if (startNotificationIntervals) {
      startNotificationIntervals();
    }

    console.error(`LogicMonitor MCP Server v${SERVER_VERSION} running on stdio`);
    if (LM_COMPANY && LM_BEARER_TOKEN) {
      console.error(`LogicMonitor credentials configured for company: ${LM_COMPANY}`);
    }
    console.error(`Available tools: ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only mode)' : ''}`);
  }

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('\n🛑 Received SIGINT, shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n🛑 Received SIGTERM, shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });

} else {
  // ===========================
  // SSE/HTTP Transport Modes
  // ===========================

  // Authentication is optional for network transports
  // If neither OAuth nor bearer token is configured, allow unauthenticated access
  const oauthConfig = appConfig.oauth;
  const hasAuthentication = !!(oauthConfig || appConfig.mcpBearerToken);

  if (!hasAuthentication) {
    console.error('⚠️  WARNING: No authentication configured - allowing unauthenticated access!');
    console.error('');
    console.error('For production use, configure authentication:');
    console.error('');
    console.error('Option 1: Static Bearer Token');
    console.error('   export MCP_BEARER_TOKEN=your-secret-token-here');
    console.error('');
    console.error('Option 2: OAuth/OIDC');
    console.error('   export OAUTH_PROVIDER=github');
    console.error('   export OAUTH_CLIENT_ID=your-client-id');
    console.error('   export OAUTH_CLIENT_SECRET=your-client-secret');
    console.error('');
  }

  // Parse address to extract host and port
  const addressParts = appConfig.address.split(':');
  const HOST = addressParts[0] || 'localhost';
  const PORT = addressParts[1] ? parseInt(addressParts[1], 10) : 3000;

  const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;
  const TRANSPORT_MODE = (process.env.TRANSPORT_MODE || 'both') as 'http-only' | 'sse-only' | 'both';
  const MCP_ENDPOINT_PATH = appConfig.endpointPath;
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

  /**
   * Sanitizes sensitive data before logging to prevent exposure of credentials,
   * tokens, and other sensitive information in logs.
   *
   * This function recursively processes objects and arrays to redact sensitive fields
   * matching known patterns (tokens, passwords, secrets, API keys, etc.).
   *
   * @param data - The data to sanitize for logging
   * @returns Sanitized data with sensitive fields redacted
   */
  function sanitizeForLogging(data: any): any {
    // Handle primitives (strings, numbers, booleans, null, undefined)
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      // If it's a string, check if it looks like a token/secret (long alphanumeric string)
      // CodeQL fix: Place hyphen at the end of character class to avoid ambiguity
      if (typeof data === 'string' && data.length > 32 && /^[A-Za-z0-9_+=\/.-]+$/.test(data)) {
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
      // Security: All sensitive data is sanitized via sanitizeForLogging() before logging
      // This prevents credentials, tokens, and secrets from being exposed in logs
      console.log(JSON.stringify(entry));
    } else {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      const colorCode = {
        debug: '\x1b[36m',
        info: '\x1b[32m',
        warn: '\x1b[33m',
        error: '\x1b[31m',
      }[level];

      const reset = '\x1b[0m';

      let output = `${colorCode}${emoji} [${entry.timestamp}] ${level.toUpperCase()}${reset}: ${message}`;

      if (requestId) {
        output += ` ${colorCode}[${requestId}]${reset}`;
      }

      if (data) {
        output += `\n${JSON.stringify(sanitizeForLogging(data), null, 2)}`;
      }

      // Security: All sensitive data is sanitized via sanitizeForLogging() before logging
      console.log(output);
    }
  }

  // HTML escape utility to prevent XSS attacks
  function escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Log startup configuration
  log('info', 'Server configuration', {
    port: PORT,
    transport: TRANSPORT,
    transport_mode: TRANSPORT_MODE,
    oauth_provider: oauthConfig?.provider || 'none',
    static_token: MCP_BEARER_TOKEN ? 'configured' : 'none',
    token_refresh: oauthConfig?.tokenRefreshEnabled || false,
    log_level: LOG_LEVEL,
    log_format: LOG_FORMAT,
    read_only: ONLY_READONLY_TOOLS,
  });

  // Configure Passport with OAuth provider (if configured)
  if (oauthConfig) {
    configureOAuthStrategy(oauthConfig);
  }

  // Initialize JWT validator
  const jwtValidator = getJWTValidator({
    issuer: BASE_URL,
    audience: BASE_URL,
    expiresIn: 3600,
    algorithm: 'HS256',
  });

  // Create Express app
  const app = express();

  // Disable X-Powered-By header for security
  app.disable('x-powered-by');

  // Request/Response logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = crypto.randomBytes(8).toString('hex');
    (req as any).requestId = requestId;

    log('debug', 'Incoming request', {
      method: req.method,
      endpoint: req.path,
      query: req.query,
      headers: {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? 'Bearer ***' : 'none',
        'user-agent': req.get('user-agent'),
      },
    }, requestId);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      log('debug', 'Response sent', {
        status: res.statusCode,
        duration_ms: duration,
      }, requestId);
    });

    next();
  });

  // CORS configuration - restrict origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) {
        return callback(null, true);
      }

      // If no allowed origins configured, allow all (dev mode)
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    // Expose Mcp-Session-Id header for browser-based MCP clients (streamable-http transport)
    exposedHeaders: ['Mcp-Session-Id'],
    // Allow Mcp-Session-Id header in requests
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id'],
  }));

  app.use(express.json());
  app.use(express.text({ type: 'application/json' }));

  // Cookie parser middleware (required for CSRF protection)
  app.use(cookieParser());

  // Global rate limiter for all endpoints
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Generous limit for general use
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });

  // Apply global rate limiter to all routes
  app.use(globalLimiter);

  // Rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });

  // Stricter rate limiting for login endpoints
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
  });

  // Rate limiting for health check endpoints
  const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Allow health checks every second
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many health check requests, please try again later.',
  });

  // Session configuration (if OAuth is enabled)
  if (oauthConfig) {
    app.use(
      session({
        secret: oauthConfig.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // CSRF protection for session-based authentication
    // This protects against Cross-Site Request Forgery attacks
    // Uses cookie-based CSRF tokens for better security
    // Exclude MCP endpoints from CSRF protection as they use Bearer token authentication
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF for MCP endpoints and API routes that use Bearer tokens
      if (req.path.startsWith('/mcp') || req.path.startsWith('/.well-known/') ||
          req.path === '/healthz' || req.path === '/health' || req.path === '/') {
        return next();
      }
      // Apply CSRF protection to other routes
      lusca.csrf()(req, res, next);
    });
  }

  // Authentication middleware (optional if hasAuthentication is false)
  function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId;

    // If no authentication is configured, allow unauthenticated access
    if (!hasAuthentication) {
      (req as any).user = {
        id: 'anonymous',
        username: 'anonymous',
        displayName: 'Anonymous User',
      };
      (req as any).tokenScope = 'mcp:tools';
      log('debug', 'Unauthenticated access allowed (no auth configured)', undefined, requestId);
      return next();
    }

    // Check for session-based authentication (only if Passport is initialized)
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      return next();
    }

    // Check for Bearer token authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Check static bearer token
      if (MCP_BEARER_TOKEN && token === MCP_BEARER_TOKEN) {
        (req as any).user = {
          id: 'static-token-user',
          username: 'static-token-user',
          displayName: 'Static Token User',
        };
        (req as any).tokenScope = 'mcp:tools';
        log('debug', 'Authenticated via static Bearer token', undefined, requestId);
        return next();
      }

      // Check JWT token
      if (isJWT(token)) {
        const validationResult = jwtValidator.validateToken(token, BASE_URL);

        if (validationResult.valid && validationResult.payload) {
          (req as any).user = validationResult.payload.user || {
            id: validationResult.payload.sub,
            username: validationResult.payload.sub,
            displayName: validationResult.payload.sub,
          };
          (req as any).tokenScope = validationResult.payload.scope;
          (req as any).tokenPayload = validationResult.payload;

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
          log('warn', 'JWT validation failed', {
            error: validationResult.error,
            errorCode: validationResult.errorCode,
          }, requestId);

          if (validationResult.errorCode === 'invalid_audience') {
            // Only include OAuth metadata if OAuth is configured
            if (oauthConfig) {
              const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
              const wwwAuthenticateValue = [
                `Bearer realm="${BASE_URL}"`,
                'error="invalid_token"',
                'error_description="Token audience mismatch"',
                `resource_metadata="${resourceMetadataUrl}"`,
                'scope="mcp:tools"',
              ].join(', ');

              res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
              return res.status(401).json({
                error: 'invalid_token',
                error_description: 'Token audience mismatch',
                resource_metadata: resourceMetadataUrl,
                authorization_endpoint: `${BASE_URL}/auth/login`,
                scope: 'mcp:tools',
              });
            } else {
              // Simple 401 response when OAuth is not configured
              res.setHeader('WWW-Authenticate', 'Bearer');
              return res.status(401).json({
                error: 'invalid_token',
                error_description: 'Token audience mismatch',
              });
            }
          }
        }
      }
    }

    // Return 401 Unauthorized
    // Only include OAuth metadata if OAuth is configured
    if (oauthConfig) {
      const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
      const wwwAuthenticateValue = [
        `Bearer realm="${BASE_URL}"`,
        `resource_metadata="${resourceMetadataUrl}"`,
        'scope="mcp:tools"',
        'error="invalid_token"',
        'error_description="The access token is missing, expired, or invalid"',
      ].join(', ');

      log('debug', 'Sending 401 Unauthorized', { resource_metadata: resourceMetadataUrl }, requestId);

      res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
      res.status(401).json({
        error: 'invalid_token',
        error_description: 'The access token is missing, expired, or invalid',
        resource_metadata: resourceMetadataUrl,
        authorization_endpoint: `${BASE_URL}/auth/login`,
        scope: 'mcp:tools',
      });
    } else {
      // Simple 401 response when OAuth is not configured
      log('debug', 'Sending 401 Unauthorized (no OAuth)', undefined, requestId);

      res.setHeader('WWW-Authenticate', 'Bearer');
      res.status(401).json({
        error: 'unauthorized',
        error_description: 'The access token is missing, expired, or invalid',
      });
    }
  }

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined = undefined;
  let lmHandlers: LogicMonitorHandlers | undefined = undefined;

  if (LM_COMPANY && LM_BEARER_TOKEN) {
    lmClient = new LogicMonitorClient({
      company: LM_COMPANY,
      bearerToken: LM_BEARER_TOKEN,
      logger: log,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient);
    log('info', 'LogicMonitor credentials configured for company: ' + LM_COMPANY);
  } else {
    log('warn', 'LM_COMPANY and LM_BEARER_TOKEN not set');
  }

  // Get filtered tools
  let TOOLS: Tool[] = getLogicMonitorTools(ONLY_READONLY_TOOLS);

  // Filter by enabled tools if specified
  if (appConfig.enabledTools && appConfig.enabledTools.length > 0) {
    const originalCount = TOOLS.length;
    TOOLS = TOOLS.filter(tool => appConfig.enabledTools!.includes(tool.name));
    log('info', 'Filtered tools by enabled tools list', {
      original_count: originalCount,
      filtered_count: TOOLS.length,
    });

    if (TOOLS.length === 0) {
      log('warn', 'No tools match the enabled tools list!');
    }

    const knownToolNames = getLogicMonitorTools(ONLY_READONLY_TOOLS).map(t => t.name);
    const unknownTools = appConfig.enabledTools.filter(name => !knownToolNames.includes(name));
    if (unknownTools.length > 0) {
      log('warn', 'Unknown tools in enabled tools list', { unknown_tools: unknownTools });
    }
  }

  // Store active MCP servers and sessions
  const mcpServers = new Map<string, { serverInstance: any; cleanup: () => Promise<void> }>();
  const httpSessions = new Map<string, { serverInstance: any; sessionId: string; cleanup: () => Promise<void> }>();
  const sessionBearerTokens = new Map<string, string>();
  const sessionScopes = new Map<string, string>();
  const sessionClientCapabilities = new Map<string, any>();

  // Event store for potential StreamableHTTP resumability support
  // This provides infrastructure for future event replay and session recovery features
  // Prefixed with _ to indicate it's available for future use
  const _eventStore = new InMemoryEventStore();

  // Create MCP server instance using factory pattern
  function createMCPServer(sessionId?: string): Server {
    // Determine handlers - use custom token if available for this session
    const customToken = sessionId ? sessionBearerTokens.get(sessionId) : undefined;
    let handlers = lmHandlers;
    let client = lmClient;

    if (customToken) {
      log('debug', 'Using custom LM bearer token from session', { sessionId });
      client = new LogicMonitorClient({
        company: LM_COMPANY,
        bearerToken: customToken,
        logger: log,
      });
      handlers = new LogicMonitorHandlers(client);
    }

    // Get user scope for this session
    const userScope = sessionId ? sessionScopes.get(sessionId) || 'mcp:tools' : 'mcp:tools';

    // Create server using factory
    const { server, cleanup, startNotificationIntervals } = createServer({
      version: SERVER_VERSION,
      tools: TOOLS,
      lmClient: client,
      lmHandlers: handlers,
      sessionId,
      userScope,
      enablePeriodicUpdates: false, // Disable for network transports
    });

    // Store cleanup function
    if (sessionId) {
      mcpServers.set(sessionId, { serverInstance: { server, cleanup, startNotificationIntervals }, cleanup });
    }

    // Add custom CallToolRequestSchema handler with scope validation and session-specific tokens
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const { name, arguments: args, _meta } = request.params;
      const progressToken = _meta?.progressToken;

      try {
        const scopeValidation = ScopeManager.validateToolScopes(name, userScope);

        if (!scopeValidation.valid) {
          log('warn', 'Insufficient scope for tool execution', {
            tool: name,
            requiredScopes: scopeValidation.requiredScopes,
            missingScopes: scopeValidation.missingScopes,
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
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        // Re-check for custom token in case it was added after server creation
        let currentHandlers = handlers;
        const currentCustomToken = sessionId ? sessionBearerTokens.get(sessionId) : undefined;

        if (currentCustomToken && currentCustomToken !== customToken) {
          log('debug', 'Using updated custom LM bearer token from session', { sessionId });
          const customClient = new LogicMonitorClient({
            company: LM_COMPANY,
            bearerToken: currentCustomToken,
            logger: log,
          });
          currentHandlers = new LogicMonitorHandlers(customClient);
        } else if (!currentHandlers) {
          throw new Error('LogicMonitor credentials not configured.');
        }

        // Create progress callback if progress token is provided
        const progressCallback = progressToken !== undefined
          ? async (progress: number, total: number) => {
            try {
              await server.notification({
                method: 'notifications/progress',
                params: {
                  progressToken,
                  progress,
                  total,
                },
              }, { relatedRequestId: extra.requestId });
            } catch (err) {
              // Silently ignore notification errors
              log('debug', 'Progress notification error', { error: err });
            }
          }
          : undefined;

        log('debug', 'Executing tool', { tool: name, withProgress: progressToken !== undefined });
        const result = await currentHandlers!.handleToolCall(name, args || {}, progressCallback);

        return {
          content: [
            {
              type: 'text',
              text: currentHandlers!.formatResponse(result),
            },
          ],
        };
      } catch (error) {
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

        let errorResponse: any = {
          error: 'Unknown error occurred',
          tool: name,
        };

        if (error instanceof Error) {
          const lmError = (error as any).lmError;
          if (lmError) {
            errorResponse = {
              error: error.message,
              tool: name,
              details: lmError,
            };
          } else {
            errorResponse.error = error.message;
          }
        }

        log('error', 'Tool execution error', errorResponse);

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

  // Routes

  // Home page
  app.get('/', (req: Request, res: Response) => {
    const isAuthenticated = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    const username = escapeHtml((req.user as any)?.username || 'unknown');
    const providerName = oauthConfig ? escapeHtml(oauthConfig.provider) : '';
    const providerDisplayName = providerName ? escapeHtml(providerName.charAt(0).toUpperCase() + providerName.slice(1)) : '';

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>LogicMonitor MCP Server</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .status { padding: 10px; border-radius: 5px; margin: 20px 0; }
          .authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .unauthenticated { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
          code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>🌍 LogicMonitor MCP Server</h1>
        
        ${isAuthenticated ? `
          <div class="status authenticated">
            ✅ <strong>Authenticated</strong> as ${username}
            <br><br>
            ${oauthConfig ? '<a href="/logout">Logout</a>' : ''}
          </div>
          <h2>MCP Endpoint</h2>
          <p>MCP server ready at:</p>
          <pre>http://${HOST}:${PORT}${MCP_ENDPOINT_PATH}/sse</pre>
        ` : `
          <div class="status unauthenticated">
            ⚠️ <strong>Not Authenticated</strong>
            <br><br>
            ${oauthConfig
    ? `<a href="/auth/login">Login with ${providerDisplayName}</a>`
    : 'Use Bearer token authentication'
}
          </div>
        `}
        
        <h2>API Endpoints</h2>
        <ul>
          <li><code>GET /</code> - This page</li>
          ${oauthConfig ? `
          <li><code>GET /auth/login</code> - OAuth login</li>
          <li><code>GET /auth/callback</code> - OAuth callback</li>
          <li><code>GET /logout</code> - Logout</li>
          ` : ''}
          <li><code>GET /healthz</code> - Health check</li>
          <li><code>GET /health</code> - Detailed health</li>
          <li><code>GET ${MCP_ENDPOINT_PATH}/sse</code> - MCP SSE endpoint</li>
          ${TRANSPORT_MODE !== 'sse-only' ? `
          <li><code>POST ${MCP_ENDPOINT_PATH}</code> - MCP HTTP endpoint</li>
          <li><code>DELETE ${MCP_ENDPOINT_PATH}</code> - Terminate MCP HTTP session</li>
          ` : ''}
        </ul>
        
        <h2>Configuration</h2>
        <p><strong>Transport:</strong> ${TRANSPORT}</p>
        ${oauthConfig ? `<p><strong>OAuth:</strong> ${providerName}</p>` : ''}
        ${MCP_BEARER_TOKEN ? '<p><strong>Auth:</strong> Static Bearer Token</p>' : ''}
        <p><strong>Tools:</strong> ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only)' : ''}</p>
      </body>
      </html>
    `);
  });

  // OAuth routes (if configured)
  if (oauthConfig) {
    const scopeArray = oauthConfig.scope ? oauthConfig.scope.split(',') : undefined;
    app.get('/auth/login', loginLimiter, passport.authenticate(oauthConfig.provider === 'custom' ? 'oauth2' : oauthConfig.provider, { scope: scopeArray }));

    app.get(
      '/auth/callback',
      passport.authenticate(oauthConfig.provider === 'custom' ? 'oauth2' : oauthConfig.provider, { failureRedirect: '/' }),
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

        res.redirect('/');
      },
    );

    app.get('/logout', authLimiter, (req: Request, res: Response) => {
      req.logout(() => {
        res.redirect('/');
      });
    });

    // CSRF token endpoint - provides the token to authenticated clients
    app.get('/csrf-token', authLimiter, ensureAuthenticated, (req: Request, res: Response) => {
      // The CSRF token is automatically available in res.locals._csrf by lusca
      res.json({
        csrfToken: res.locals._csrf || (req as any).csrfToken?.() || null,
      });
    });
  }

  // Health check endpoints (with rate limiting)
  app.get('/healthz', healthLimiter, (req: Request, res: Response) => {
    res.status(200).send('ok');
  });

  app.get('/health', healthLimiter, (req: Request, res: Response) => {
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'healthy',
      version: SERVER_VERSION,
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

  // Status endpoint (with rate limiting)
  app.get('/status', healthLimiter, (req: Request, res: Response) => {
    const isAuthenticated = typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    res.json({
      authenticated: isAuthenticated,
      user: isAuthenticated ? {
        username: (req.user as any)?.username,
        displayName: (req.user as any)?.displayName,
      } : null,
    });
  });

  // MCP SSE endpoint
  if (TRANSPORT_MODE !== 'http-only') {
    app.get(`${MCP_ENDPOINT_PATH}/sse`, authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
      const username = (req.user as any)?.username;
      log('info', 'New MCP SSE connection', { username });

      await handleSSEConnection(req, res, {
        getSessionId: (req) => (req.session as any)?.id || crypto.randomBytes(8).toString('hex'),
        getOrCreateServer: (sessionId) => {
          let serverInfo = mcpServers.get(sessionId);
          if (!serverInfo) {
            createMCPServer(sessionId);
            serverInfo = mcpServers.get(sessionId)!;
          }
          return {
            server: serverInfo.serverInstance.server,
            cleanup: serverInfo.cleanup,
            startNotificationIntervals: serverInfo.serverInstance.startNotificationIntervals,
          };
        },
        onClose: async (sessionId) => {
          log('info', 'MCP SSE connection closed', { username, sessionId });
          mcpServers.delete(sessionId);
          sessionClientCapabilities.delete(sessionId);
          sessionScopes.delete(sessionId);
          sessionBearerTokens.delete(sessionId);
        },
      });
    });

    app.post('/mcp/message', ensureAuthenticated, (req: Request, res: Response) => {
      res.status(200).send();
    });
  }

  // MCP HTTP endpoint (streamable-http)
  if (TRANSPORT_MODE !== 'sse-only') {
    app.post(MCP_ENDPOINT_PATH, authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
      const username = (req.user as any)?.username;
      log('debug', 'MCP HTTP request', { username });

      await handleHTTPRequest(req, res, {
        getOrCreateSession: (sessionId) => {
          let sessionInfo = httpSessions.get(sessionId);

          if (!sessionInfo) {
            log('debug', 'Creating new MCP HTTP session', { username, sessionId });
            const server = createMCPServer(sessionId);
            const storedInfo = mcpServers.get(sessionId);

            if (storedInfo) {
              sessionInfo = {
                serverInstance: storedInfo.serverInstance.server,
                sessionId,
                cleanup: storedInfo.cleanup,
              };
              httpSessions.set(sessionId, sessionInfo);
            } else {
              // Fallback if not stored
              sessionInfo = {
                serverInstance: server,
                sessionId,
                cleanup: async () => {},
              };
              httpSessions.set(sessionId, sessionInfo);
            }
          }

          return sessionInfo;
        },
        handleMessage: handleMCPMessage,
        onError: (error, sessionId) => {
          log('error', 'Error handling MCP HTTP request', {
            error: error.message,
            sessionId,
            username,
          });
        },
      });
    });

    // MCP HTTP session termination endpoint (DELETE)
    app.delete(MCP_ENDPOINT_PATH, authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
      const username = (req.user as any)?.username;
      log('debug', 'MCP HTTP session termination request', { username });

      await handleHTTPDelete(req, res, {
        getSession: (sessionId) => httpSessions.get(sessionId),
        onClose: async (sessionId) => {
          log('info', 'MCP HTTP session terminated', { username, sessionId });
          httpSessions.delete(sessionId);
          mcpServers.delete(sessionId);
          sessionBearerTokens.delete(sessionId);
          sessionScopes.delete(sessionId);
          sessionClientCapabilities.delete(sessionId);
        },
        onError: (error, sessionId) => {
          log('error', 'Error terminating MCP HTTP session', {
            error: error.message,
            sessionId,
            username,
          });
        },
      });
    });
  }

  // Helper function to handle MCP messages
  async function handleMCPMessage(server: Server, message: JSONRPCMessage): Promise<any> {
    try {
      if (!('method' in message)) {
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

      const messageId = 'id' in message ? message.id : null;
      const isNotification = messageId === null || messageId === undefined;

      return new Promise((resolve) => {
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
            resolve(null);
            return;
          }

          // Handle requests
          if (message.method === 'initialize') {
            resolve({
              jsonrpc: '2.0',
              result: {
                protocolVersion: '2024-11-05',
                capabilities: {
                  tools: {},
                  resources: {},
                  prompts: {},
                  logging: {},
                },
                serverInfo: {
                  name: 'logicmonitor-mcp-server',
                  version: SERVER_VERSION,
                },
              },
              id: messageId,
            });
          } else if (message.method === 'ping') {
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
          } else if (message.method === 'resources/list') {
            const resources = listLMResources();
            resolve({
              jsonrpc: '2.0',
              result: {
                resources: resources.map(r => ({
                  uri: r.uri,
                  name: r.name,
                  description: r.description,
                  mimeType: r.mimeType,
                })),
              },
              id: messageId,
            });
          } else if (message.method === 'resources/read') {
            const params = message.params as any;

            if (!params || !params.uri) {
              resolve({
                jsonrpc: '2.0',
                error: {
                  code: -32602,
                  message: 'Invalid params',
                  data: 'Missing required parameter: uri',
                },
                id: messageId,
              });
              return;
            }

            // Handle resource read
            (async () => {
              try {
                const result = await readLMResource(params.uri);

                resolve({
                  jsonrpc: '2.0',
                  result,
                  id: messageId,
                });
              } catch (error: any) {
                log('error', 'Error reading resource', {
                  uri: params.uri,
                  error: error.message || String(error),
                });

                resolve({
                  jsonrpc: '2.0',
                  error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error.message || 'Failed to read resource',
                  },
                  id: messageId,
                });
              }
            })();
          } else if (message.method === 'prompts/list') {
            const prompts = listLMPrompts();
            resolve({
              jsonrpc: '2.0',
              result: {
                prompts: prompts.map(p => ({
                  name: p.name,
                  description: p.description,
                  arguments: p.arguments,
                })),
              },
              id: messageId,
            });
          } else if (message.method === 'prompts/get') {
            const params = message.params as any;

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

            const prompt = getLMPrompt(params.name);

            if (!prompt) {
              resolve({
                jsonrpc: '2.0',
                error: {
                  code: -32602,
                  message: 'Invalid params',
                  data: `Prompt not found: ${params.name}`,
                },
                id: messageId,
              });
              return;
            }

            // Generate the prompt message using centralized logic
            try {
              const result = generatePromptMessages(params.name, params.arguments);
              resolve({
                jsonrpc: '2.0',
                result,
                id: messageId,
              });
            } catch (error) {
              resolve({
                jsonrpc: '2.0',
                error: {
                  code: error instanceof Error && error.message.includes('Unknown prompt') ? -32603 : -32602,
                  message: error instanceof Error && error.message.includes('Unknown prompt') ? 'Internal error' : 'Invalid params',
                  data: error instanceof Error ? error.message : 'An error occurred',
                },
                id: messageId,
              });
            }
          } else if (message.method === 'completion/complete') {
            const params = message.params as any;

            if (!params || !params.ref || !params.argument) {
              resolve({
                jsonrpc: '2.0',
                error: {
                  code: -32602,
                  message: 'Invalid params',
                  data: 'Missing required parameters: ref and argument',
                },
                id: messageId,
              });
              return;
            }

            // Handle completion
            (async () => {
              try {
                if (!lmHandlers) {
                  resolve({
                    jsonrpc: '2.0',
                    result: {
                      completion: {
                        values: [],
                        total: 0,
                        hasMore: false,
                      },
                    },
                    id: messageId,
                  });
                  return;
                }

                const completion = await lmHandlers.handleCompletion(params.ref, params.argument);

                resolve({
                  jsonrpc: '2.0',
                  result: {
                    completion,
                  },
                  id: messageId,
                });
              } catch (error) {
                resolve({
                  jsonrpc: '2.0',
                  error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error instanceof Error ? error.message : 'An error occurred',
                  },
                  id: messageId,
                });
              }
            })();
          } else if (message.method === 'logging/setLevel') {
            const params = message.params as any;
            const level = params?.level || 'info';
            log('info', `Logging level set to: ${level}`, { level });
            resolve({
              jsonrpc: '2.0',
              result: {},
              id: messageId,
            });
          } else if (message.method === 'tools/call') {
            const params = message.params as any;

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

            // Handle tool execution
            (async () => {
              try {
                if (!lmHandlers) {
                  resolve({
                    jsonrpc: '2.0',
                    error: {
                      code: -32603,
                      message: 'Internal error',
                      data: 'LogicMonitor credentials not configured',
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
                if (isMCPError(error)) {
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

                let errorData: any = 'Unknown error occurred';
                if (error instanceof Error) {
                  const lmError = (error as any).lmError;
                  if (lmError) {
                    errorData = {
                      message: error.message,
                      details: lmError,
                    };
                  } else {
                    errorData = error.message;
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
          } else {
            resolve({
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not found',
                data: `Unknown method: ${message.method}`,
              },
              id: messageId,
            });
          }
        } catch (error: any) {
          resolve({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: error.message || 'An unexpected error occurred',
            },
            id: messageId,
          });
        }
      });
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message || 'An unexpected error occurred',
        },
        id: null,
      };
    }
  }

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    log('error', 'Server error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  });

  // Start periodic cleanup (if OAuth configured)
  if (oauthConfig && oauthConfig.tokenRefreshEnabled) {
    startPeriodicCleanup();
    log('info', 'Token refresh system initialized');
  }

  // Start server
  const useTLS = !!(appConfig.tlsCertFile && appConfig.tlsKeyFile);

  if (useTLS) {
    try {
      const tlsOptions = {
        cert: fs.readFileSync(appConfig.tlsCertFile!),
        key: fs.readFileSync(appConfig.tlsKeyFile!),
      };
      https.createServer(tlsOptions, app).listen(PORT, () => {
        log('info', `LogicMonitor MCP Server v${SERVER_VERSION} running on https://${HOST}:${PORT}`);
        if (oauthConfig) {
          log('info', `OAuth Provider: ${oauthConfig.provider}`);
        }
        if (MCP_BEARER_TOKEN) {
          log('info', 'Auth: Static Bearer Token');
        }
        if (!hasAuthentication) {
          log('warn', 'Auth: UNAUTHENTICATED ACCESS (no auth configured)');
        }
        log('info', 'TLS: enabled');
      });
    } catch (error) {
      log('error', 'Failed to start HTTPS server', {
        cert: appConfig.tlsCertFile,
        key: appConfig.tlsKeyFile,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  } else {
    app.listen(PORT, () => {
      log('info', `LogicMonitor MCP Server v${SERVER_VERSION} running on http://${HOST}:${PORT}`);
      if (oauthConfig) {
        log('info', `OAuth Provider: ${oauthConfig.provider}`);
      }
      if (MCP_BEARER_TOKEN) {
        log('info', 'Auth: Static Bearer Token');
      }
      if (!hasAuthentication) {
        log('warn', 'Auth: UNAUTHENTICATED ACCESS (no auth configured)');
      }
      log('info', `Transport: ${TRANSPORT} (mode: ${TRANSPORT_MODE})`);
      log('info', `Tools: ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only)' : ''}`);
    });
  }
}

