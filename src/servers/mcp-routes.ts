/**
 * MCP Transport Mounts (SSE & Streamable HTTP) and Per-Session Server Factory
 */

import { Express, Request, Response, RequestHandler } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { CollapsedToolRoute } from '../api/tools/collapse.js';
import { ScopeManager } from '../utils/core/scope-manager.js';
import { isMCPError } from '../utils/core/error-handler.js';
import { ServerConfig } from '../utils/core/cli-config.js';
import { createServer, formatToolErrorResult } from './server.js';
import { handleSSEConnection, handleSSEMessage } from './sse.js';
import { handleHTTPRequest, HTTPSessionInfo } from './streamable-http.js';
import { LoggerFn } from './logger.js';

export interface McpRoutesDeps {
  appConfig: ServerConfig;
  version: string;
  transportMode: 'http-only' | 'sse-only' | 'both';
  endpointPath: string;
  tools: Tool[];
  collapseRoutes?: Map<string, CollapsedToolRoute>;
  lmClient?: LogicMonitorClient;
  lmHandlers?: LogicMonitorHandlers;
  sessionScopes: Map<string, string>;
  authLimiter: RequestHandler;
  ensureAuthenticated: RequestHandler;
  log: LoggerFn;
}

export interface McpRoutesHandle {
  getActiveCounts: () => { mcp: number; http: number };
}

/**
 * Registers MCP SSE and Streamable HTTP endpoints and manages per-session
 * `Server` instances with scope validation and error formatting.
 */
export function registerMcpRoutes(app: Express, deps: McpRoutesDeps): McpRoutesHandle {
  const {
    appConfig,
    version,
    transportMode,
    endpointPath,
    tools,
    collapseRoutes,
    lmClient,
    lmHandlers,
    sessionScopes,
    authLimiter,
    ensureAuthenticated,
    log,
  } = deps;

  const mcpServers = new Map<string, { serverInstance: any; cleanup: () => Promise<void> }>();
  const httpSessions = new Map<string, HTTPSessionInfo>();
  const sseTransports = new Map<string, SSEServerTransport>();
  const sessionBearerTokens = new Map<string, string>();
  const sessionClientCapabilities = new Map<string, any>();
  const eventStore = new InMemoryEventStore();

  function createMCPServer(sessionId?: string): Server {
    const customToken = sessionId ? sessionBearerTokens.get(sessionId) : undefined;
    let handlers = lmHandlers;
    let client = lmClient;

    if (customToken) {
      log('debug', 'Using custom LM bearer token from session', { sessionId });
      client = new LogicMonitorClient({
        company: appConfig.lmCompany,
        bearerToken: customToken,
        logger: log,
      });
      handlers = new LogicMonitorHandlers(client, {
        collapseToolsLevel1: appConfig.collapseToolsLevel1,
        collapseToolsLevel2: appConfig.collapseToolsLevel2,
        readOnly: appConfig.readOnly,
      });
    }

    const userScope = sessionId ? sessionScopes.get(sessionId) || 'mcp:tools' : 'mcp:tools';

    const { server, cleanup, startNotificationIntervals } = createServer({
      version,
      tools,
      lmClient: client,
      lmHandlers: handlers,
      sessionId,
      userScope,
      enablePeriodicUpdates: false,
    });

    if (sessionId) {
      mcpServers.set(sessionId, { serverInstance: { server, cleanup, startNotificationIntervals }, cleanup });
    }

    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const { name, arguments: args, _meta } = request.params;
      const progressToken = _meta?.progressToken;

      try {
        let scopedToolName = name;
        let scopedReadOnlyHint: boolean | undefined;
        if (collapseRoutes) {
          const route = collapseRoutes.get(name);
          if (route && typeof (args as Record<string, unknown> | undefined)?.operation === 'string') {
            const opRoute = route.operations.get((args as Record<string, unknown>).operation as string);
            if (opRoute) {
              scopedToolName = opRoute.toolName;
              scopedReadOnlyHint = opRoute.readOnly;
            }
          }
        }

        const scopeValidation = ScopeManager.validateToolScopes(scopedToolName, userScope, scopedReadOnlyHint);

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

        let currentHandlers = handlers;
        const currentCustomToken = sessionId ? sessionBearerTokens.get(sessionId) : undefined;

        if (currentCustomToken && currentCustomToken !== customToken) {
          log('debug', 'Using updated custom LM bearer token from session', { sessionId });
          const customClient = new LogicMonitorClient({
            company: appConfig.lmCompany,
            bearerToken: currentCustomToken,
            logger: log,
          });
          currentHandlers = new LogicMonitorHandlers(customClient, {
            collapseToolsLevel1: appConfig.collapseToolsLevel1,
            collapseToolsLevel2: appConfig.collapseToolsLevel2,
            readOnly: appConfig.readOnly,
          });
        } else if (!currentHandlers) {
          throw new Error('LogicMonitor credentials not configured.');
        }

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
        const formatted = formatToolErrorResult(name, error);
        if (!isMCPError(error)) {
          log('error', 'Tool execution error', {
            tool: name,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          });
        }
        return formatted;
      }
    });

    return server;
  }

  function cleanupSessionMaps(sessionId: string) {
    mcpServers.delete(sessionId);
    sessionClientCapabilities.delete(sessionId);
    sessionScopes.delete(sessionId);
    sessionBearerTokens.delete(sessionId);
  }

  // Legacy SSE transport
  if (transportMode !== 'http-only') {
    const sseMessagePath = `${endpointPath}/message`;

    app.get(`${endpointPath}/sse`, authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
      const username = (req.user as any)?.username;
      const tokenScope = (req as any)?.tokenScope as string | undefined;
      log('info', 'New MCP SSE connection', { username });

      await handleSSEConnection(req, res, {
        messageEndpoint: sseMessagePath,
        transports: sseTransports,
        getSessionId: (r) => (r.session as any)?.id || crypto.randomBytes(8).toString('hex'),
        getOrCreateServer: (sessionId) => {
          if (tokenScope) {
            sessionScopes.set(sessionId, tokenScope);
          }
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
          cleanupSessionMaps(sessionId);
        },
      });
    });

    app.post(sseMessagePath, authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
      await handleSSEMessage(req, res, sseTransports);
    });
  }

  // Streamable HTTP transport
  if (transportMode !== 'sse-only') {
    const handleStreamableHttp = async (req: Request, res: Response) => {
      const username = (req.user as any)?.username;
      const tokenScope = (req as any)?.tokenScope as string | undefined;
      log('debug', 'MCP HTTP request', { method: req.method, username });

      await handleHTTPRequest(req, res, {
        getSession: (sessionId) => httpSessions.get(sessionId),
        createSession: (sessionId) => {
          log('debug', 'Creating new MCP HTTP session', { username, sessionId });
          if (tokenScope) {
            sessionScopes.set(sessionId, tokenScope);
          }
          const server = createMCPServer(sessionId);
          const storedInfo = mcpServers.get(sessionId);
          return {
            server,
            cleanup: storedInfo ? storedInfo.cleanup : async () => {},
          };
        },
        onSessionInitialized: (sessionId, sessionInfo) => {
          httpSessions.set(sessionId, sessionInfo);
        },
        onClose: async (sessionId) => {
          log('info', 'MCP HTTP session terminated', { username, sessionId });
          httpSessions.delete(sessionId);
          cleanupSessionMaps(sessionId);
        },
        eventStore,
        onError: (error, sessionId) => {
          log('error', 'Error handling MCP HTTP request', {
            error: error.message,
            sessionId,
            username,
          });
        },
      });
    };

    app.post(endpointPath, authLimiter, ensureAuthenticated, handleStreamableHttp);
    app.get(endpointPath, authLimiter, ensureAuthenticated, handleStreamableHttp);
    app.delete(endpointPath, authLimiter, ensureAuthenticated, handleStreamableHttp);
  }

  return {
    getActiveCounts: () => ({
      mcp: mcpServers.size,
      http: httpSessions.size,
    }),
  };
}
