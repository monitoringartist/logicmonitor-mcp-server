/**
 * Streamable HTTP Transport Module
 *
 * Handles MCP Streamable HTTP transport (POST, GET, DELETE) using the official
 * MCP SDK `StreamableHTTPServerTransport`.
 */

import { Request, Response } from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  StreamableHTTPServerTransport,
  EventStore,
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';

export interface HTTPSessionInfo {
  server: Server;
  transport: StreamableHTTPServerTransport;
  sessionId: string;
  cleanup: () => Promise<void>;
}

export interface HTTPSessionCallbacks {
  getSession: (sessionId: string) => HTTPSessionInfo | undefined;
  createSession: (sessionId: string) => { server: Server; cleanup: () => Promise<void> };
  onSessionInitialized?: (sessionId: string, sessionInfo: HTTPSessionInfo) => void | Promise<void>;
  onClose: (sessionId: string) => void | Promise<void>;
  eventStore?: EventStore;
  onError?: (error: Error, sessionId?: string) => void;
}

/**
 * Handles Streamable HTTP requests (POST, GET, DELETE) for MCP sessions.
 *
 * @param req Express request
 * @param res Express response
 * @param callbacks Session lifecycle callbacks
 */
export async function handleHTTPRequest(
  req: Request,
  res: Response,
  callbacks: HTTPSessionCallbacks,
): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const sessionInfo = callbacks.getSession(sessionId);
    if (!sessionInfo) {
      res.status(404).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Session not found',
        },
        id: null,
      });
      return;
    }

    try {
      await sessionInfo.transport.handleRequest(
        req,
        res,
        req.method === 'POST' ? req.body : undefined,
      );
    } catch (error) {
      if (callbacks.onError && error instanceof Error) {
        callbacks.onError(error, sessionId);
      }
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal error',
          },
          id: null,
        });
      }
    }
    return;
  }

  // Without Mcp-Session-Id, only a POST initialize request can start a new session.
  if (req.method !== 'POST') {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Mcp-Session-Id header is required',
      },
      id: null,
    });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error: Invalid JSON',
      },
      id: null,
    });
    return;
  }

  const isInit = Array.isArray(parsedBody)
    ? parsedBody.some(isInitializeRequest)
    : isInitializeRequest(parsedBody);

  if (!isInit) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  const newSessionId = crypto.randomUUID();
  const { server, cleanup } = callbacks.createSession(newSessionId);

  let closed = false;
  const closeSession = async () => {
    if (closed) return;
    closed = true;
    await cleanup();
    await callbacks.onClose(newSessionId);
  };

  let transport: StreamableHTTPServerTransport;
  transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => newSessionId,
    eventStore: callbacks.eventStore,
    onsessioninitialized: async (sid) => {
      const info: HTTPSessionInfo = {
        server,
        transport,
        sessionId: sid,
        cleanup,
      };
      if (callbacks.onSessionInitialized) {
        await callbacks.onSessionInitialized(sid, info);
      }
    },
    onsessionclosed: async () => {
      await closeSession();
    },
  });

  transport.onclose = () => {
    void closeSession();
  };

  transport.onerror = (error) => {
    callbacks.onError?.(error, newSessionId);
  };

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);

    // If initialization failed before a session was established (e.g. 406 Not Acceptable),
    // clean up the uninitialized server resources immediately.
    if (!transport.sessionId) {
      await closeSession();
    }
  } catch (error) {
    if (callbacks.onError && error instanceof Error) {
      callbacks.onError(error, newSessionId);
    }
    await closeSession();
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
        },
        id: null,
      });
    }
  }
}
