/**
 * Streamable HTTP Transport Module
 *
 * Handles HTTP transport for MCP connections with session management
 */

import { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';

export interface HTTPSessionInfo {
  serverInstance: Server;
  sessionId: string;
  cleanup: () => Promise<void>;
}

export interface HTTPSessionCallbacks {
  getOrCreateSession: (sessionId: string) => HTTPSessionInfo;
  handleMessage: (server: Server, message: JSONRPCMessage) => Promise<any>;
  onError?: (error: Error, sessionId: string) => void;
}

export interface HTTPDeleteCallbacks {
  getSession: (sessionId: string) => HTTPSessionInfo | undefined;
  onClose: (sessionId: string) => void | Promise<void>;
  onError?: (error: Error, sessionId: string) => void;
}

/**
 * Handles HTTP POST requests for MCP messages with flexible session management
 *
 * @param req Express request
 * @param res Express response
 * @param callbacks Callbacks for session management
 */
export async function handleHTTPRequest(
  req: Request,
  res: Response,
  callbacks: HTTPSessionCallbacks,
): Promise<void> {
  // Get or create session ID
  let sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
  }

  // Get or create session using callback
  const sessionInfo = callbacks.getOrCreateSession(sessionId);

  try {
    const message: JSONRPCMessage = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Handle the message using callback
    const response = await callbacks.handleMessage(sessionInfo.serverInstance, message);

    // Set session header (always return the session ID)
    res.setHeader('Mcp-Session-Id', sessionId);

    // For notifications (null response), return 200 OK
    if (response === null) {
      res.status(200).send();
    } else {
      res.json(response);
    }
  } catch (error) {
    // Notify error callback if provided
    if (callbacks.onError && error instanceof Error) {
      callbacks.onError(error, sessionId);
    }

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
 * @param callbacks Callbacks for session management
 */
export async function handleHTTPDelete(
  req: Request,
  res: Response,
  callbacks: HTTPDeleteCallbacks,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing Mcp-Session-Id header',
    });
    return;
  }

  // Get session using callback
  const sessionInfo = callbacks.getSession(sessionId);

  if (!sessionInfo) {
    res.status(404).json({
      error: 'session_not_found',
      error_description: 'The specified session does not exist or has already been terminated',
    });
    return;
  }

  try {
    // Call cleanup before deleting session
    await sessionInfo.cleanup();

    // Call onClose callback
    await callbacks.onClose(sessionId);

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    // Notify error callback if provided
    if (callbacks.onError && error instanceof Error) {
      callbacks.onError(error, sessionId);
    }

    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to terminate session',
    });
  }
}

