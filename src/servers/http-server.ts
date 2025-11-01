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

// Load environment variables
dotenv.config();

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

// Validate OAuth configuration
if (!config.oauth) {
  console.error('❌ ERROR: OAuth credentials not configured!');
  console.error('');
  console.error('Required environment variables:');
  console.error('  OAUTH_PROVIDER         - Provider type (github, google, azure, okta, auth0, custom)');
  console.error('  OAUTH_CLIENT_ID        - OAuth client ID');
  console.error('  OAUTH_CLIENT_SECRET    - OAuth client secret');
  console.error('  OAUTH_SESSION_SECRET   - Session encryption secret');
  console.error('');
  console.error('See env.example for full configuration options');
  process.exit(1);
}

const oauthConfig = config.oauth;
const PORT = process.env.PORT || 3000;
const LM_COMPANY = config.lmCompany;
const LM_BEARER_TOKEN = config.lmBearerToken;
const ONLY_READONLY_TOOLS = config.readOnly;

// Configure Passport with the selected OAuth provider
configureOAuthStrategy(oauthConfig);

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json());

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

// Authentication middleware
function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please authenticate first.' });
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
const TOOLS: Tool[] = getLogicMonitorTools(ONLY_READONLY_TOOLS);

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
          <a href="/logout">Logout</a>
        </div>
        <h2>MCP Endpoint</h2>
        <p>Your MCP server is ready at:</p>
        <pre>http://localhost:${PORT}/mcp/sse</pre>
        
        <h2>Test the Server</h2>
        <p>You can now connect your MCP client to this endpoint.</p>
        
      ` : `
        <div class="status unauthenticated">
          ⚠️ <strong>Not Authenticated</strong>
          <br><br>
          <a href="/auth/login">Login with ${oauthConfig.provider.charAt(0).toUpperCase() + oauthConfig.provider.slice(1)}</a>
        </div>
      `}
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>GET /</code> - This page</li>
        <li><code>GET /auth/login</code> - Initiate OAuth login</li>
        <li><code>GET /auth/callback</code> - OAuth callback</li>
        <li><code>GET /logout</code> - Logout</li>
        <li><code>GET /status</code> - Check authentication status</li>
        <li><code>GET /mcp/sse</code> - MCP SSE endpoint (authenticated)</li>
      </ul>
      
      <h2>Configuration</h2>
      <p><strong>OAuth Provider:</strong> ${oauthConfig.provider}</p>
      <p>See <code>env.example</code> for setup instructions.</p>
    </body>
    </html>
  `);
});

// Generic OAuth routes
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

// Health check endpoint
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).send('ok');
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
app.get('/mcp/sse', ensureAuthenticated, async (req: Request, res: Response) => {
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

// Start periodic cleanup of expired sessions
if (oauthConfig.tokenRefreshEnabled) {
  startPeriodicCleanup();
  console.log('✅ Token refresh system initialized');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Remote Server with OAuth running on http://localhost:${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to authenticate`);
  console.log(`🔐 OAuth Provider: ${oauthConfig.provider}`);
  if (oauthConfig.tokenRefreshEnabled) {
    console.log('🔄 Token refresh: enabled (automatic background refresh)');
  }
});
