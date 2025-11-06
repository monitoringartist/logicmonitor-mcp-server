/**
 * SSE Transport Module
 *
 * Handles SSE (Server-Sent Events) transport for web-based MCP connections
 */

import { Request, Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import crypto from 'crypto';
import { createServer } from './server.js';
import { ServerConfig } from './server.js';

export interface SSESession {
  server: Server;
  sessionId: string;
}

/**
 * Handles SSE connection requests
 *
 * @param config Server configuration
 * @param req Express request
 * @param res Express response
 * @param sessions Map to store active sessions
 * @param onClose Callback when connection closes
 */
export async function handleSSEConnection(
  config: ServerConfig,
  req: Request,
  res: Response,
  sessions: Map<string, SSESession>,
  onClose?: (sessionId: string) => void,
): Promise<void> {
  const sessionId = (req.session as any)?.id || crypto.randomBytes(8).toString('hex');

  // Get or create server for this session
  let session = sessions.get(sessionId);
  let cleanup: (() => Promise<void>) | undefined;

  if (!session) {
    const serverInstance = createServer({
      ...config,
      sessionId,
    });
    session = { server: serverInstance.server, sessionId };
    cleanup = serverInstance.cleanup;
    sessions.set(sessionId, session);
  }

  // Create SSE transport
  const transport = new SSEServerTransport('/mcp/message', res);
  await session.server.connect(transport);

  // Handle connection close
  req.on('close', async () => {
    sessions.delete(sessionId);

    // Call cleanup before notifying onClose
    if (cleanup) {
      await cleanup();
    }

    if (onClose) {
      onClose(sessionId);
    }
  });
}

