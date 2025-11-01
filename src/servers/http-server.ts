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
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import cors from 'cors';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';

// Load environment variables
dotenv.config();

/**
 * MCP Remote Server with OAuth Authentication
 * - HTTP/SSE transport (instead of stdio)
 * - OAuth authentication (GitHub)
 * - Remote access over the network
 * - Session management
 */

// Configuration
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'mcp-session-secret-change-me';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const CALLBACK_URL = process.env.CALLBACK_URL || `http://localhost:${PORT}/auth/github/callback`;

// LogicMonitor configuration
const LM_COMPANY = process.env.LM_COMPANY || '';
const LM_BEARER_TOKEN = process.env.LM_BEARER_TOKEN || '';
// Default to true (read-only mode) for safety - explicitly set to 'false' to enable write operations
const ONLY_READONLY_TOOLS = process.env.ONLY_READONLY_TOOLS !== 'false';

// Validate configuration
if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.error('ERROR: GitHub OAuth credentials not configured!');
  console.error('Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env file');
  console.error('See OAUTH-SETUP.md for instructions');
  process.exit(1);
}

// Configure Passport with GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: CALLBACK_URL,
    },
    (accessToken: string, refreshToken: string, profile: any, done: any) => {
      // In production, you would store user info in a database
      // For this example, we just pass the profile
      return done(null, profile);
    },
  ),
);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

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
    secret: SESSION_SECRET,
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
          <a href="/auth/github">Login with GitHub</a>
        </div>
      `}
      
      <h2>API Endpoints</h2>
      <ul>
        <li><code>GET /</code> - This page</li>
        <li><code>GET /auth/github</code> - Initiate GitHub OAuth</li>
        <li><code>GET /auth/github/callback</code> - OAuth callback</li>
        <li><code>GET /logout</code> - Logout</li>
        <li><code>GET /status</code> - Check authentication status</li>
        <li><code>GET /mcp/sse</code> - MCP SSE endpoint (authenticated)</li>
      </ul>
      
      <h2>Documentation</h2>
      <p>See <code>OAUTH-SETUP.md</code> for setup instructions.</p>
    </body>
    </html>
  `);
});

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  (req: Request, res: Response) => {
    res.redirect('/');
  },
);

// Logout
app.get('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    res.redirect('/');
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Remote Server with OAuth running on http://localhost:${PORT}`);
  console.log(`📝 Visit http://localhost:${PORT} to authenticate`);
  console.log('🔐 Using GitHub OAuth for authentication');
});
