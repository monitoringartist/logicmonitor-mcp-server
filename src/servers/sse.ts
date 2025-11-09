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
  const transport = new SSEServerTransport('/mcp/message', res);
  await serverInfo.server.connect(transport);

  // Start notification intervals if available
  if (serverInfo.startNotificationIntervals) {
    serverInfo.startNotificationIntervals(sessionId);
  }

  // Handle connection close
  req.on('close', async () => {
    // Call cleanup
    await serverInfo.cleanup();

    // Call onClose callback if provided
    if (callbacks.onClose) {
      await callbacks.onClose(sessionId);
    }
  });
}

