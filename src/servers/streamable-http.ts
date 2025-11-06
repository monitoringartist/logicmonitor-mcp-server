/**
 * Streamable HTTP Transport Module
 *
 * Handles HTTP transport for MCP connections with session management
 */

import { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import { createServer } from './server.js';
import { ServerConfig } from './server.js';

export interface HTTPSession {
  server: Server;
  sessionId: string;
}

/**
 * Handles HTTP POST requests for MCP messages
 *
 * @param config Server configuration
 * @param req Express request
 * @param res Express response
 * @param sessions Map to store active sessions
 * @param handleMessage Function to handle MCP messages
 */
export async function handleHTTPRequest(
  config: ServerConfig,
  req: Request,
  res: Response,
  sessions: Map<string, HTTPSession>,
  handleMessage: (server: Server, message: JSONRPCMessage) => Promise<any>,
): Promise<void> {
  let sessionId = req.headers['mcp-session-id'] as string | undefined;

  // Create new session if needed
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
  }

  // Get or create server for this session
  let session = sessions.get(sessionId);

  if (!session) {
    const { server } = createServer({
      ...config,
      sessionId,
    });
    session = { server, sessionId };
    sessions.set(sessionId, session);
  }

  try {
    const message: JSONRPCMessage = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Handle the message
    const response = await handleMessage(session.server, message);

    // Set session header
    res.setHeader('Mcp-Session-Id', sessionId);

    // For notifications (null response), return 200 OK
    if (response === null) {
      res.status(200).send();
    } else {
      res.json(response);
    }
  } catch (error) {
    res.setHeader('Mcp-Session-Id', sessionId);
    res.status(200).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      id: null,
    });
  }
}

/**
 * Handles HTTP DELETE requests for session termination
 *
 * @param req Express request
 * @param res Express response
 * @param sessions Map to store active sessions
 * @param onClose Callback when session closes
 */
export async function handleHTTPDelete(
  req: Request,
  res: Response,
  sessions: Map<string, HTTPSession>,
  onClose?: (sessionId: string) => void,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing Mcp-Session-Id header',
    });
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({
      error: 'session_not_found',
      error_description: 'The specified session does not exist or has already been terminated',
    });
    return;
  }

  // Clean up session
  sessions.delete(sessionId);
  if (onClose) {
    onClose(sessionId);
  }

  res.status(200).json({
    success: true,
    message: 'Session terminated successfully',
  });
}

