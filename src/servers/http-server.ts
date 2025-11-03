#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

// Load environment variables
dotenv.config();

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const SERVER_VERSION = packageJson.version;

/**
 * MCP Remote Server with Generic OAuth Authentication
 * - HTTP/SSE transport (instead of stdio)
 * - Generic OAuth/OIDC authentication (supports multiple providers)
 * - Remote access over the network
 * - Session management with automatic token refresh
 */

// Parse configuration
const config = parseConfig();
validateConfig(config);

// Validate authentication configuration
// At least one authentication method must be configured: OAuth or static bearer token
if (!config.oauth && !config.mcpBearerToken) {
  console.error('❌ ERROR: No authentication configured for HTTP server!');
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
  console.error('   export OAUTH_SESSION_SECRET=your-session-secret');
  console.error('');
  console.error('See env.example for detailed configuration options');
  process.exit(1);
}

const oauthConfig = config.oauth;

// Parse address to extract host and port
const addressParts = config.address.split(':');
const HOST = addressParts[0] || 'localhost';
const PORT = addressParts[1] ? parseInt(addressParts[1], 10) : 3000;
const BASE_URL = process.env.BASE_URL || `http://${HOST}:${PORT}`;

const MCP_ENDPOINT_PATH = config.endpointPath; // Configurable MCP endpoint path (default: /mcp)
const LM_COMPANY = config.lmCompany;
const LM_BEARER_TOKEN = config.lmBearerToken;
const ONLY_READONLY_TOOLS = config.readOnly;

// MCP Server authentication (static bearer token)
const MCP_BEARER_TOKEN = config.mcpBearerToken;

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
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());

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
): void {
  const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
  const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;
  const scopeString = requiredScopes.join(' ');

  // Construct WWW-Authenticate header for insufficient_scope error
  const wwwAuthenticateValue = [
    `Bearer realm="${baseUrl}"`,
    'error="insufficient_scope"',
    `scope="${scopeString}"`,
    `resource_metadata="${resourceMetadataUrl}"`,
    `error_description="${description}"`,
  ].join(', ');

  console.log('📛 Sending 403 Forbidden with insufficient_scope challenge:', {
    required_scopes: requiredScopes,
    resource_metadata: resourceMetadataUrl,
  });

  res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
  res.status(403).json({
    error: 'insufficient_scope',
    error_description: description,
    scope: scopeString,
    resource_metadata: resourceMetadataUrl,
    authorization_endpoint: `${baseUrl}/auth/login`,
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
      console.log('✓ Authenticated via static Bearer token');
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

        console.log('✓ Authenticated via JWT Bearer token', {
          username: (req as any).user.username,
          audience: validationResult.payload.aud,
        });
        return next();
      } else {
        // JWT validation failed
        console.warn('⚠ JWT validation failed:', validationResult.error);

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
      console.warn('⚠ Invalid Bearer token');
    }
  }

  // Return 401 Unauthorized with WWW-Authenticate header per MCP specification
  // RFC 6750 Section 3: https://tools.ietf.org/html/rfc6750#section-3
  // RFC 9728 Section 5.1: https://www.rfc-editor.org/rfc/rfc9728.html#section-5.1
  const baseUrl = process.env.BASE_URL || `http://${HOST}:${PORT}`;
  const resourceMetadataUrl = `${baseUrl}/.well-known/oauth-protected-resource`;
  const requiredScopes = 'mcp:tools';

  // Construct WWW-Authenticate header with resource metadata and scope guidance
  const wwwAuthenticateValue = [
    `Bearer realm="${baseUrl}"`,
    `resource_metadata="${resourceMetadataUrl}"`,
    `scope="${requiredScopes}"`,
    'error="invalid_token"',
    'error_description="The access token is missing, expired, or invalid"',
  ].join(', ');

  console.log('🔒 Sending 401 Unauthorized with WWW-Authenticate header');

  res.setHeader('WWW-Authenticate', wwwAuthenticateValue);
  res.status(401).json({
    error: 'invalid_token',
    error_description: 'The access token is missing, expired, or invalid',
    resource_metadata: resourceMetadataUrl,
    authorization_endpoint: `${baseUrl}/auth/login`,
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
  });
  lmHandlers = new LogicMonitorHandlers(lmClient);
  console.log('✅ LogicMonitor credentials configured');
} else {
  console.log('⚠️  Warning: LM_COMPANY and LM_BEARER_TOKEN not set');
  console.log('⚠️  Tools will be listed but will fail when executed');
}

// Get filtered tools based on ONLY_READONLY_TOOLS setting
let TOOLS: Tool[] = getLogicMonitorTools(ONLY_READONLY_TOOLS);

// Filter out search tools if disabled
if (config.disableSearch) {
  const searchTools = ['search_resources', 'search_alerts', 'search_audit_logs'];
  const originalCount = TOOLS.length;
  TOOLS = TOOLS.filter(tool => !searchTools.includes(tool.name));
  console.log(`ℹ️  Search tools disabled: ${originalCount} -> ${TOOLS.length} tools`);
}

// Filter by enabled tools if specified
if (config.enabledTools && config.enabledTools.length > 0) {
  const originalCount = TOOLS.length;
  TOOLS = TOOLS.filter(tool => config.enabledTools!.includes(tool.name));
  console.log(`ℹ️  Filtered tools by enabled tools list: ${originalCount} -> ${TOOLS.length} tools`);

  // Warn if no tools match
  if (TOOLS.length === 0) {
    console.warn('⚠️  No tools match the enabled tools list! Check your MCP_ENABLED_TOOLS configuration.');
  }

  // Warn about unknown tools
  const knownToolNames = getLogicMonitorTools(ONLY_READONLY_TOOLS).map(t => t.name);
  const unknownTools = config.enabledTools.filter((name: string) => !knownToolNames.includes(name));
  if (unknownTools.length > 0) {
    console.warn('⚠️  Unknown tools in enabled tools list:', unknownTools.join(', '));
  }
}

// Store active MCP servers per session
const mcpServers = new Map<string, Server>();

// Create MCP server instance for authenticated user
function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'logicmonitor-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Handle tool listing requests
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Handle tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (!lmHandlers) {
        throw new Error('LogicMonitor credentials not configured. Please set LM_COMPANY and LM_BEARER_TOKEN environment variables.');
      }

      const result = await lmHandlers.handleToolCall(name, args || {});

      return {
        content: [
          {
            type: 'text',
            text: lmHandlers.formatResponse(result),
          },
        ],
      };
    } catch (error) {
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

// Routes

// Home page
app.get('/', (req: Request, res: Response) => {
  const isAuthenticated = req.isAuthenticated();
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LogicMonitor MCP Remote Server</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .status { padding: 10px; border-radius: 5px; margin: 20px 0; }
        .authenticated { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .unauthenticated { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>🌍 LogicMonitor MCP Remote Server</h1>
      
      ${isAuthenticated ? `
        <div class="status authenticated">
          ✅ <strong>Authenticated</strong> as ${(req.user as any)?.username || 'unknown'}
          <br><br>
          ${oauthConfig ? '<a href="/logout">Logout</a>' : ''}
        </div>
        <h2>MCP Endpoint</h2>
        <p>Your MCP server is ready at:</p>
        <pre>http://${HOST}:${PORT}${MCP_ENDPOINT_PATH}/sse</pre>
        
        <h2>Test the Server</h2>
        <p>You can now connect your MCP client to this endpoint.</p>
        
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
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>GET /</code> - This page</li>
        ${oauthConfig ? `
        <li><code>GET /auth/login</code> - Initiate OAuth login</li>
        <li><code>GET /auth/callback</code> - OAuth callback</li>
        <li><code>GET /logout</code> - Logout</li>
        ` : ''}
        <li><code>GET /status</code> - Check authentication status</li>
        <li><code>GET /healthz</code> - Health check endpoint (returns "ok")</li>
        <li><code>GET ${MCP_ENDPOINT_PATH}/sse</code> - MCP SSE endpoint (authenticated)</li>
      </ul>
      
      <h2>Configuration</h2>
      ${oauthConfig ? `<p><strong>OAuth Provider:</strong> ${oauthConfig.provider}</p>` : ''}
      ${MCP_BEARER_TOKEN ? '<p><strong>Auth Method:</strong> Static Bearer Token</p>' : ''}
      <p>See <code>env.example</code> for setup instructions.</p>
    </body>
    </html>
  `);
});

// OAuth routes (only if OAuth is configured)
if (oauthConfig) {
  const scopeArray = oauthConfig.scope ? oauthConfig.scope.split(',') : undefined;
  app.get('/auth/login', passport.authenticate(oauthConfig.provider === 'custom' ? 'oauth2' : oauthConfig.provider, { scope: scopeArray }));

  app.get(
    '/auth/callback',
    passport.authenticate(oauthConfig.provider === 'custom' ? 'oauth2' : oauthConfig.provider, { failureRedirect: '/' }),
    (req: Request, res: Response) => {
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
        console.log(`✅ Session registered with token refresh (${oauthConfig.provider}): ${sessionId.substring(0, 8)}...`);

        // Register refresh callback if provider supports it
        if (tokenData.refreshToken && oauthConfig.tokenRefreshEnabled) {
          const refreshFn = getRefreshTokenFunction(oauthConfig.provider);
          if (refreshFn) {
            registerRefreshCallback(sessionId, refreshFn);
            console.log(`🔄 Token refresh enabled for ${oauthConfig.provider}`);
          }
        }
      }

      res.redirect('/');
    },
  );

  // Logout
  app.get('/logout', (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect('/');
    });
  });
}

// Health check endpoint
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('ok');
});

// Detailed health check endpoint
app.get('/health', (req: Request, res: Response) => {
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
      http: 0, // HTTP-only transport doesn't track separate sessions
    },
    timestamp: new Date().toISOString(),
    transport: {
      mode: 'sse',
      http: false,
      sse: true,
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
  });
});

// MCP SSE endpoint
app.get(`${MCP_ENDPOINT_PATH}/sse`, ensureAuthenticated, async (req: Request, res: Response) => {
  console.log('New MCP SSE connection from:', (req.user as any)?.username);

  // Get or create MCP server for this session
  const sessionId = (req.session as any).id;
  let server = mcpServers.get(sessionId);

  if (!server) {
    server = createMCPServer();
    mcpServers.set(sessionId, server);
  }

  // Create SSE transport
  const transport = new SSEServerTransport('/mcp/message', res);
  await server.connect(transport);

  // Clean up on disconnect
  req.on('close', () => {
    console.log('MCP SSE connection closed for:', (req.user as any)?.username);
    mcpServers.delete(sessionId);
  });
});

// MCP message endpoint for client -> server messages
app.post('/mcp/message', ensureAuthenticated, (req: Request, res: Response) => {
  // SSE transport handles this automatically
  res.status(200).send();
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start periodic cleanup of expired sessions (only if OAuth is configured)
if (oauthConfig && oauthConfig.tokenRefreshEnabled) {
  startPeriodicCleanup();
  console.log('✅ Token refresh system initialized');
}

// Start server
// Check if TLS is configured
const useTLS = !!(config.tlsCertFile && config.tlsKeyFile);

if (useTLS) {
  // HTTPS server with TLS
  try {
    const tlsOptions = {
      cert: fs.readFileSync(config.tlsCertFile!),
      key: fs.readFileSync(config.tlsKeyFile!),
    };
    https.createServer(tlsOptions, app).listen(PORT, () => {
      console.log(`🚀 MCP Remote Server v${SERVER_VERSION} running on https://${HOST}:${PORT}`);
      console.log(`📝 Visit https://${HOST}:${PORT} to authenticate`);
      if (oauthConfig) {
        console.log(`🔐 OAuth Provider: ${oauthConfig.provider}`);
      }
      if (MCP_BEARER_TOKEN) {
        console.log('🔐 Auth: Static Bearer Token');
      }
      console.log('🔒 TLS: enabled');
      console.log(`   Certificate: ${config.tlsCertFile}`);
      if (oauthConfig?.tokenRefreshEnabled) {
        console.log('🔄 Token refresh: enabled (automatic background refresh)');
      }
    });
  } catch (error) {
    console.error('❌ ERROR: Failed to start HTTPS server');
    console.error('  TLS certificate file:', config.tlsCertFile);
    console.error('  TLS key file:', config.tlsKeyFile);
    console.error('  Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
} else {
  // HTTP server (no TLS)
  app.listen(PORT, () => {
    console.log(`🚀 MCP Remote Server v${SERVER_VERSION} running on http://${HOST}:${PORT}`);
    console.log(`📝 Visit http://${HOST}:${PORT} to authenticate`);
    if (oauthConfig) {
      console.log(`🔐 OAuth Provider: ${oauthConfig.provider}`);
    }
    if (MCP_BEARER_TOKEN) {
      console.log('🔐 Auth: Static Bearer Token');
    }
    if (oauthConfig?.tokenRefreshEnabled) {
      console.log('🔄 Token refresh: enabled (automatic background refresh)');
    }
  });
}
