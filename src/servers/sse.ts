/**
 * SSE Transport Module
 *
 * Handles SSE (Server-Sent Events) transport for web-based MCP connections
 */

import { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import crypto from 'crypto';

export interface SSEServerInfo {
  server: Server;
  cleanup: () => Promise<void>;
  startNotificationIntervals?: (sessionId?: string) => void;
}

export interface SSESessionCallbacks {
  onClose?: (sessionId: string) => void | Promise<void>;
  getSessionId?: (req: Request) => string;
  getOrCreateServer: (sessionId: string) => SSEServerInfo;
  messageEndpoint?: string;
  transports?: Map<string, SSEServerTransport>;
}

/**
 * Handles SSE connection requests with flexible session management
 *
 * @param req Express request
 * @param res Express response
 * @param callbacks Callbacks for session management
 */
export async function handleSSEConnection(
  req: Request,
  res: Response,
  callbacks: SSESessionCallbacks,
): Promise<void> {
  // Get session ID (allow custom logic or default to crypto)
  const sessionId = callbacks.getSessionId
    ? callbacks.getSessionId(req)
    : (req.session as any)?.id || crypto.randomBytes(8).toString('hex');

  // Get or create server using callback
  const serverInfo = callbacks.getOrCreateServer(sessionId);

  // Create SSE transport
  const messageEndpoint = callbacks.messageEndpoint || '/mcp/message';
  const transport = new SSEServerTransport(messageEndpoint, res);
  callbacks.transports?.set(transport.sessionId, transport);

  try {
    await serverInfo.server.connect(transport);
  } catch (error) {
    callbacks.transports?.delete(transport.sessionId);
    throw error;
  }

  // Start notification intervals if available
  if (serverInfo.startNotificationIntervals) {
    serverInfo.startNotificationIntervals(sessionId);
  }

  // Handle connection close
  req.on('close', async () => {
    callbacks.transports?.delete(transport.sessionId);

    // Call cleanup
    await serverInfo.cleanup();

    // Call onClose callback if provided
    if (callbacks.onClose) {
      await callbacks.onClose(sessionId);
    }
  });
}

/**
 * Routes incoming HTTP POST messages for an active SSE session to its SSEServerTransport.
 *
 * @param req Express request (expects `?sessionId=...` query parameter)
 * @param res Express response
 * @param transports Active SSE transports keyed by transport.sessionId
 */
export async function handleSSEMessage(
  req: Request,
  res: Response,
  transports: Map<string, SSEServerTransport>,
): Promise<void> {
  const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined;
  if (!sessionId) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing sessionId query parameter',
    });
    return;
  }

  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(404).json({
      error: 'session_not_found',
      error_description: 'No active SSE session found for the specified sessionId',
    });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
}

