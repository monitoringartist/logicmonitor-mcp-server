/**
 * Transport & Protocol Tests
 *
 * Covers:
 * 1A. Legacy SSE message routing (handleSSEConnection + handleSSEMessage)
 * 1B. Official SDK StreamableHTTPServerTransport (initialize, batching, GET SSE, DELETE)
 * 1C. Server CallToolRequestSchema MCPError -> isError: true handling
 */

import { describe, it, expect, jest } from '@jest/globals';
import express from 'express';
import http from 'http';
import { AddressInfo } from 'net';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createServer } from './server.js';
import { handleSSEConnection, handleSSEMessage } from './sse.js';
import { handleHTTPRequest, HTTPSessionInfo } from './streamable-http.js';
import { MCPError } from '../utils/core/error-handler.js';
import { LogicMonitorHandlers } from '../api/handlers.js';

function startExpressApp(app: express.Express): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, port });
    });
  });
}

function stopExpressApp(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

describe('MCP Transport & Protocol Fixes', () => {
  describe('1A. Legacy SSE Message Routing', () => {
    it('routes POST /mcp/message?sessionId=... to the active SSEServerTransport and returns JSON-RPC responses over SSE', async () => {
      const app = express();
      app.use(express.json());

      const sseTransports = new Map<string, SSEServerTransport>();

      app.get('/mcp/sse', async (req, res) => {
        await handleSSEConnection(req, res, {
          messageEndpoint: '/mcp/message',
          transports: sseTransports,
          getOrCreateServer: (sessionId) =>
            createServer({
              version: '1.0.0-test',
              tools: [],
              sessionId,
            }),
        });
      });

      app.post('/mcp/message', async (req, res) => {
        await handleSSEMessage(req, res, sseTransports);
      });

      const { server, port } = await startExpressApp(app);

      try {
        // Test missing sessionId -> 400
        const missingRes = await fetch(`http://127.0.0.1:${port}/mcp/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
        });
        expect(missingRes.status).toBe(400);

        // Test unknown sessionId -> 404
        const unknownRes = await fetch(`http://127.0.0.1:${port}/mcp/message?sessionId=nonexistent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 1 }),
        });
        expect(unknownRes.status).toBe(404);

        // Connect SSE stream and verify endpoint + initialize round-trip
        await new Promise<void>((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${port}/mcp/sse`, (res) => {
            expect(res.statusCode).toBe(200);
            let buffer = '';
            let messagePath: string | null = null;

            res.on('data', async (chunk: Buffer) => {
              buffer += chunk.toString();

              if (!messagePath) {
                const match = buffer.match(/event: endpoint\ndata: ([^\n]+)\n/);
                if (match) {
                  messagePath = match[1].trim();
                  expect(messagePath).toContain('/mcp/message?sessionId=');

                  const postRes = await fetch(`http://127.0.0.1:${port}${messagePath}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      jsonrpc: '2.0',
                      method: 'initialize',
                      params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: { name: 'sse-test', version: '1.0.0' },
                      },
                      id: 42,
                    }),
                  });
                  expect(postRes.status).toBe(202);
                }
              }

              if (buffer.includes('"id":42')) {
                expect(buffer).toContain('"completions"');
                expect(buffer).toContain('"instructions"');
                req.destroy();
                resolve();
              }
            });

            res.on('error', reject);
          });

          req.on('error', (err) => {
            if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
              reject(err);
            }
          });
        });
      } finally {
        await stopExpressApp(server);
      }
    });

    it('propagates JWT tokenScope from req.tokenScope into the SSE session server for scope enforcement', async () => {
      const app = express();
      app.use(express.json());

      const sessionScopes = new Map<string, string>();
      const mockHandlers = {
        handleToolCall: jest.fn<() => Promise<unknown>>().mockResolvedValue({ ok: true }),
        formatResponse: jest.fn<(r: unknown) => string>().mockReturnValue('{"ok":true}'),
      } as unknown as LogicMonitorHandlers;

      const { registerMcpRoutes } = await import('./mcp-routes.js');
      registerMcpRoutes(app, {
        appConfig: {
          transport: 'sse',
          address: '127.0.0.1:0',
          endpointPath: '/mcp',
          debug: false,
          logFormat: 'json',
          logLevel: 'error',
          readOnly: false,
          collapseToolsLevel1: false,
          collapseToolsLevel2: false,
          lmCompany: 'test',
          lmBearerToken: 'test-token',
          allowUnauthenticated: true,
        },
        version: '1.0.0-test',
        transportMode: 'sse-only',
        endpointPath: '/mcp',
        tools: [
          {
            name: 'delete_resource',
            description: 'Delete device',
            annotations: { readOnlyHint: false },
            inputSchema: { type: 'object', properties: { deviceId: { type: 'number' } } },
          },
        ],
        lmHandlers: mockHandlers,
        sessionScopes,
        authLimiter: (_req, _res, next) => next(),
        ensureAuthenticated: (req, _res, next) => {
          // Simulate JWT bearer auth middleware setting req.tokenScope without an Express session
          (req as any).user = { username: 'jwt-user' };
          (req as any).tokenScope = 'mcp:tools lm:read';
          next();
        },
        log: () => {},
      });

      const { server, port } = await startExpressApp(app);

      try {
        await new Promise<void>((resolve, reject) => {
          const req = http.get(`http://127.0.0.1:${port}/mcp/sse`, (res) => {
            expect(res.statusCode).toBe(200);
            let buffer = '';
            let messagePath: string | null = null;
            let sentCallTool = false;

            res.on('data', async (chunk: Buffer) => {
              buffer += chunk.toString();

              if (!messagePath) {
                const match = buffer.match(/event: endpoint\ndata: ([^\n]+)\n/);
                if (match) {
                  messagePath = match[1].trim();
                  await fetch(`http://127.0.0.1:${port}${messagePath}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      jsonrpc: '2.0',
                      method: 'initialize',
                      params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: { name: 'sse-scope-test', version: '1.0.0' },
                      },
                      id: 1,
                    }),
                  });
                }
              }

              if (messagePath && buffer.includes('"id":1') && !sentCallTool) {
                sentCallTool = true;
                await fetch(`http://127.0.0.1:${port}${messagePath}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'tools/call',
                    params: { name: 'delete_resource', arguments: { deviceId: 1 } },
                    id: 2,
                  }),
                });
              }

              if (buffer.includes('"id":2')) {
                expect(buffer).toContain('insufficient_scope');
                expect(buffer).toContain('lm:devices:write');
                req.destroy();
                resolve();
              }
            });

            res.on('error', reject);
          });

          req.on('error', (err) => {
            if ((err as NodeJS.ErrnoException).code !== 'ECONNRESET') {
              reject(err);
            }
          });
        });
      } finally {
        await stopExpressApp(server);
      }
    });
  });

  describe('1B. Official SDK StreamableHTTPServerTransport', () => {
    it('supports initialize with instructions & completions, batching, GET SSE stream, and DELETE termination', async () => {
      const app = express();
      app.use(express.json());

      const httpSessions = new Map<string, HTTPSessionInfo>();
      const eventStore = new InMemoryEventStore();

      const handler = async (req: express.Request, res: express.Response) => {
        await handleHTTPRequest(req, res, {
          getSession: (sid) => httpSessions.get(sid),
          createSession: (sid) =>
            createServer({
              version: '1.0.0-test',
              tools: [],
              sessionId: sid,
            }),
          onSessionInitialized: (sid, info) => {
            httpSessions.set(sid, info);
          },
          onClose: (sid) => {
            httpSessions.delete(sid);
          },
          eventStore,
        });
      };

      app.post('/mcp', handler);
      app.get('/mcp', handler);
      app.delete('/mcp', handler);

      const { server, port } = await startExpressApp(app);

      try {
        // 1. Initialize session
        const initRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'initialize',
            params: {
              protocolVersion: '2025-03-26',
              capabilities: {},
              clientInfo: { name: 'http-test', version: '1.0.0' },
            },
            id: 1,
          }),
        });

        expect(initRes.status).toBe(200);
        const sessionId = initRes.headers.get('mcp-session-id');
        expect(sessionId).toBeTruthy();

        const initBody = await initRes.text();
        expect(initBody).toContain('"completions"');
        expect(initBody).toContain('LogicMonitor MCP Server');

        // 2. JSON-RPC batch array
        const batchRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Mcp-Session-Id': sessionId!,
            'Mcp-Protocol-Version': '2025-03-26',
          },
          body: JSON.stringify([
            { jsonrpc: '2.0', method: 'ping', id: 2 },
            { jsonrpc: '2.0', method: 'ping', id: 3 },
          ]),
        });
        expect(batchRes.status).toBe(200);
        const batchBody = await batchRes.text();
        expect(batchBody).toContain('"id":2');
        expect(batchBody).toContain('"id":3');

        // 3. GET /mcp SSE stream
        const abortController = new AbortController();
        const getRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Mcp-Session-Id': sessionId!,
            'Mcp-Protocol-Version': '2025-03-26',
          },
          signal: abortController.signal,
        });
        expect(getRes.status).toBe(200);
        expect(getRes.headers.get('content-type')).toContain('text/event-stream');
        abortController.abort();

        // 4. DELETE /mcp terminates session
        const delRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'DELETE',
          headers: {
            'Mcp-Session-Id': sessionId!,
            'Mcp-Protocol-Version': '2025-03-26',
          },
        });
        expect(delRes.status).toBe(200);
        expect(httpSessions.has(sessionId!)).toBe(false);

        // 5. Subsequent request with terminated session returns 404
        const postAfterDelete = await fetch(`http://127.0.0.1:${port}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Mcp-Session-Id': sessionId!,
          },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'ping', id: 4 }),
        });
        expect(postAfterDelete.status).toBe(404);
      } finally {
        await stopExpressApp(server);
      }
    });
  });

  describe('1C. CallToolRequestSchema MCPError handling in server.ts', () => {
    it('converts MCPError thrown by handleToolCall into an isError: true tool result with suggestions', async () => {
      const mockHandlers = {
        handleToolCall: jest.fn<() => Promise<never>>().mockRejectedValue(
          new MCPError(
            'Invalid fields parameter',
            'INVALID_PARAMETERS',
            { field: 'bogus' },
            ['Use valid field names such as id, name'],
          ),
        ),
        formatResponse: jest.fn<(r: unknown) => string>().mockReturnValue(''),
      } as unknown as LogicMonitorHandlers;

      const { server, cleanup } = createServer({
        version: '1.0.0-test',
        tools: [
          {
            name: 'test_tool',
            description: 'Test tool',
            inputSchema: { type: 'object', properties: {} },
          },
        ],
        lmHandlers: mockHandlers,
      });

      const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
      const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} });

      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      try {
        const result = await client.callTool({ name: 'test_tool', arguments: {} });
        expect(result.isError).toBe(true);
        const text = (result.content as Array<{ type: string; text: string }>)[0]?.text;
        expect(text).toContain('Invalid fields parameter');
        expect(text).toContain('"field": "bogus"');
        expect(text).toContain('Use valid field names such as id, name');
      } finally {
        await client.close();
        await cleanup();
      }
    });
  });
});
