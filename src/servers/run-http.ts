/**
 * SSE / Streamable-HTTP transport runner for the LogicMonitor (LM) MCP server.
 *
 * Extracted from the unified entry point; `index.ts` calls `runHttp` for all
 * non-stdio transports.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import lusca from 'lusca';
import https from 'https';
import fs from 'fs';
import crypto from 'crypto';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import { buildCollapsedTools, CollapsedToolRoute } from '../api/tools/collapse.js';
import { startPeriodicCleanup } from '../utils/core/token-refresh.js';
import { configureOAuthStrategy } from '../utils/core/oauth-strategy.js';
import { getJWTValidator, isJWT } from '../utils/core/jwt-validator.js';
import { startOAuthCleanup } from '../utils/core/oauth-as.js';
import { ServerConfig } from '../utils/core/cli-config.js';
import { createHttpLogger, escapeHtml, LogFormat, LogLevel } from './logger.js';
import { registerOAuthRoutes } from './oauth-routes.js';
import { registerMcpRoutes } from './mcp-routes.js';

export function runHttp(appConfig: ServerConfig, version: string): void {
  const SERVER_VERSION = version;
  const TRANSPORT = appConfig.transport;
  const LM_COMPANY = appConfig.lmCompany;
  const LM_BEARER_TOKEN = appConfig.lmBearerToken;
  const ONLY_READONLY_TOOLS = appConfig.readOnly;

  const oauthConfig = appConfig.oauth;
  const hasAuthentication = !!(oauthConfig || appConfig.mcpBearerToken);

  if (!hasAuthentication) {
    console.error('⚠️  WARNING: Running WITHOUT authentication (MCP_ALLOW_UNAUTHENTICATED=true).');
    console.error('   Any client that can reach this server may delete devices, alert rules, etc.');
    console.error('');
    console.error('   For production use, configure authentication instead:');
    console.error('');
    console.error('   Option 1: Static Bearer Token');
    console.error('      export MCP_BEARER_TOKEN=your-secret-token-here');
    console.error('');
    console.error('   Option 2: OAuth/OIDC');
    console.error('      export OAUTH_PROVIDER=github');
    console.error('      export OAUTH_CLIENT_ID=your-client-id');
    console.error('      export OAUTH_CLIENT_SECRET=your-client-secret');
    console.error('');
  }

  const addressParts = appConfig.address.split(':');
  const HOST = addressParts[0] || 'localhost';
  const PORT = addressParts[1] ? parseInt(addressParts[1], 10) : 3000;

  const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;
  const TRANSPORT_MODE = (process.env.TRANSPORT_MODE || 'both') as 'http-only' | 'sse-only' | 'both';
  const MCP_ENDPOINT_PATH = appConfig.endpointPath;
  const MCP_BEARER_TOKEN = appConfig.mcpBearerToken;

  const LOG_LEVEL = (process.env.MCP_LOG_LEVEL || appConfig.logLevel) as LogLevel;
  const LOG_FORMAT = (process.env.MCP_LOG_FORMAT || appConfig.logFormat) as LogFormat;
  const log = createHttpLogger(LOG_LEVEL, LOG_FORMAT);

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

  if (oauthConfig) {
    configureOAuthStrategy(oauthConfig);
  }

  const jwtValidator = getJWTValidator({
    issuer: BASE_URL,
    audience: BASE_URL,
    expiresIn: 3600,
    algorithm: 'HS256',
  });

  const app = express();
  app.disable('x-powered-by');

  const trustProxy = process.env.EXPRESS_TRUST_PROXY;
  if (trustProxy) {
    const numeric = Number(trustProxy);
    app.set('trust proxy', Number.isFinite(numeric) ? numeric : trustProxy === 'true' ? true : trustProxy);
  }

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
      log('debug', 'Response sent', {
        status: res.statusCode,
        duration_ms: Date.now() - startTime,
      }, requestId);
    });

    next();
  });

  // CORS configuration - fail closed in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) || [];
  const isProduction = process.env.NODE_ENV === 'production';
  const allowAllOrigins = allowedOrigins.includes('*');
  const hasExplicitAllowlist = allowedOrigins.length > 0 && !allowAllOrigins;
  const corsCredentials = hasExplicitAllowlist;

  if (!hasExplicitAllowlist) {
    if (isProduction) {
      log('warn', 'ALLOWED_ORIGINS is not set in production: cross-origin browser requests will be denied. Set ALLOWED_ORIGINS to a comma-separated list of trusted origins to permit them.');
    } else if (allowAllOrigins) {
      log('warn', "ALLOWED_ORIGINS includes '*': reflecting all origins without credentials. Avoid wildcard origins in production.");
    } else {
      log('warn', 'ALLOWED_ORIGINS is not set: reflecting all origins without credentials (development default). Set ALLOWED_ORIGINS for production deployments.');
    }
  }

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (hasExplicitAllowlist) {
        return allowedOrigins.includes(origin)
          ? callback(null, true)
          : callback(new Error('Not allowed by CORS'));
      }
      if (allowAllOrigins || !isProduction) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: corsCredentials,
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'mcp-protocol-version', 'last-event-id'],
  }));

  app.use(express.json());
  app.use(express.text({ type: 'application/json' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts, please try again later.',
  });

  const healthLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many health check requests, please try again later.',
  });

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

    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/mcp') || req.path.startsWith(MCP_ENDPOINT_PATH) ||
          req.path.startsWith('/.well-known/') || req.path.startsWith('/oauth/') ||
          req.path === '/healthz' || req.path === '/health' || req.path === '/') {
        return next();
      }
      lusca.csrf()(req, res, next);
    });
  }

  const sessionScopes = new Map<string, string>();

  function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    const requestId = (req as any).requestId;

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

    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

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

          const sessionId = (req.session as any)?.id;
          if (sessionId) {
            sessionScopes.set(sessionId, validationResult.payload.scope || 'mcp:tools');
          }

          log('debug', 'Authenticated via JWT Bearer token', {
            username: (req as any).user.username,
            audience: validationResult.payload.aud,
            scope: validationResult.payload.scope,
          }, requestId);
          return next();
        }

        log('warn', 'JWT validation failed', {
          error: validationResult.error,
          errorCode: validationResult.errorCode,
        }, requestId);

        if (validationResult.errorCode === 'invalid_audience') {
          if (oauthConfig) {
            const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
            res.setHeader('WWW-Authenticate', [
              `Bearer realm="${BASE_URL}"`,
              'error="invalid_token"',
              'error_description="Token audience mismatch"',
              `resource_metadata="${resourceMetadataUrl}"`,
              'scope="mcp:tools"',
            ].join(', '));
            return res.status(401).json({
              error: 'invalid_token',
              error_description: 'Token audience mismatch',
              resource_metadata: resourceMetadataUrl,
              authorization_endpoint: `${BASE_URL}/auth/login`,
              scope: 'mcp:tools',
            });
          }
          res.setHeader('WWW-Authenticate', 'Bearer');
          return res.status(401).json({
            error: 'invalid_token',
            error_description: 'Token audience mismatch',
          });
        }
      }
    }

    if (oauthConfig) {
      const resourceMetadataUrl = `${BASE_URL}/.well-known/oauth-protected-resource`;
      log('debug', 'Sending 401 Unauthorized', { resource_metadata: resourceMetadataUrl }, requestId);
      res.setHeader('WWW-Authenticate', [
        `Bearer realm="${BASE_URL}"`,
        `resource_metadata="${resourceMetadataUrl}"`,
        'scope="mcp:tools"',
        'error="invalid_token"',
        'error_description="The access token is missing, expired, or invalid"',
      ].join(', '));
      return res.status(401).json({
        error: 'invalid_token',
        error_description: 'The access token is missing, expired, or invalid',
        resource_metadata: resourceMetadataUrl,
        authorization_endpoint: `${BASE_URL}/auth/login`,
        scope: 'mcp:tools',
      });
    }

    log('debug', 'Sending 401 Unauthorized (no OAuth)', undefined, requestId);
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'The access token is missing, expired, or invalid',
    });
  }

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined;
  let lmHandlers: LogicMonitorHandlers | undefined;

  if (LM_COMPANY && LM_BEARER_TOKEN) {
    lmClient = new LogicMonitorClient({
      company: LM_COMPANY,
      bearerToken: LM_BEARER_TOKEN,
      logger: log,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient, {
      collapseToolsLevel1: appConfig.collapseToolsLevel1,
      collapseToolsLevel2: appConfig.collapseToolsLevel2,
      readOnly: ONLY_READONLY_TOOLS,
    });
    log('info', 'LogicMonitor credentials configured for company: ' + LM_COMPANY);
  } else {
    log('warn', 'LM_COMPANY and LM_BEARER_TOKEN not set');
  }

  // Prepare tools
  let TOOLS: Tool[] = getLogicMonitorTools(ONLY_READONLY_TOOLS);

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

  let collapseRoutes: Map<string, CollapsedToolRoute> | undefined;
  if (appConfig.collapseToolsLevel1) {
    const beforeCount = TOOLS.length;
    const collapseResult = buildCollapsedTools(TOOLS, { level2: appConfig.collapseToolsLevel2 });
    TOOLS = collapseResult.tools;
    collapseRoutes = collapseResult.routes;
    log('info', 'Collapsed tools', {
      level: appConfig.collapseToolsLevel2 ? 2 : 1,
      original_count: beforeCount,
      collapsed_count: TOOLS.length,
    });
  }

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
          <li><code>GET ${MCP_ENDPOINT_PATH}</code> - MCP HTTP SSE stream</li>
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

  if (oauthConfig) {
    registerOAuthRoutes(app, {
      oauthConfig,
      baseUrl: BASE_URL,
      jwtValidator,
      authLimiter,
      loginLimiter,
      ensureAuthenticated,
      log,
    });
  }

  const mcpHandle = registerMcpRoutes(app, {
    appConfig,
    version: SERVER_VERSION,
    transportMode: TRANSPORT_MODE,
    endpointPath: MCP_ENDPOINT_PATH,
    tools: TOOLS,
    collapseRoutes,
    lmClient,
    lmHandlers,
    sessionScopes,
    authLimiter,
    ensureAuthenticated,
    log,
  });

  // Health & status endpoints
  app.get('/healthz', healthLimiter, (_req: Request, res: Response) => {
    res.status(200).send('ok');
  });

  app.get('/health', healthLimiter, (_req: Request, res: Response) => {
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
      connections: mcpHandle.getActiveCounts(),
      timestamp: new Date().toISOString(),
      transport: {
        mode: TRANSPORT_MODE,
        http: TRANSPORT_MODE !== 'sse-only',
        sse: TRANSPORT_MODE !== 'http-only',
      },
    });
  });

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

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    log('error', 'Server error', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  });

  if (oauthConfig && oauthConfig.tokenRefreshEnabled) {
    startPeriodicCleanup();
    log('info', 'Token refresh system initialized');
  }

  if (oauthConfig) {
    startOAuthCleanup();
    log('info', 'OAuth authorization server cleanup started');
  }

  const useTLS = !!(appConfig.tlsCertFile && appConfig.tlsKeyFile);

  if (useTLS) {
    try {
      const tlsOptions = {
        cert: fs.readFileSync(appConfig.tlsCertFile!),
        key: fs.readFileSync(appConfig.tlsKeyFile!),
      };
      https.createServer(tlsOptions, app).listen(PORT, () => {
        log('info', `LogicMonitor MCP Server v${SERVER_VERSION} running on https://${HOST}:${PORT}`);
        if (oauthConfig) log('info', `OAuth Provider: ${oauthConfig.provider}`);
        if (MCP_BEARER_TOKEN) log('info', 'Auth: Static Bearer Token');
        if (!hasAuthentication) log('warn', 'Auth: UNAUTHENTICATED ACCESS (no auth configured)');
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
      if (oauthConfig) log('info', `OAuth Provider: ${oauthConfig.provider}`);
      if (MCP_BEARER_TOKEN) log('info', 'Auth: Static Bearer Token');
      if (!hasAuthentication) log('warn', 'Auth: UNAUTHENTICATED ACCESS (no auth configured)');
      log('info', `Transport: ${TRANSPORT} (mode: ${TRANSPORT_MODE})`);
      log('info', `Tools: ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only)' : ''}`);
    });
  }
}
