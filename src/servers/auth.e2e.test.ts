/**
 * End-to-End Authentication Tests
 *
 * Tests authentication scenarios across different server configurations:
 * - No authentication (unauthenticated access allowed)
 * - Bearer token authentication (MCP_BEARER_TOKEN)
 * - OAuth authentication
 * - Mixed configuration (bearer token with no auth fallback)
 *
 * Endpoints tested:
 * - / (home page)
 * - /healthz (health check)
 * - /health (detailed health)
 * - /mcp (MCP HTTP endpoint)
 * - /mcp/sse (MCP SSE endpoint)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import { once } from 'events';

interface ServerProcess {
  process: ChildProcess;
  port: number;
  cleanup: () => Promise<void>;
}

/**
 * Start a server instance with specific environment configuration
 */
async function startServer(env: Record<string, string>, port: number): Promise<ServerProcess> {
  return new Promise((resolve, reject) => {
    const serverEnv = {
      ...process.env,
      ...env,
      MCP_TRANSPORT: 'sse',
      MCP_ADDRESS: `localhost:${port}`,
      MCP_LOG_LEVEL: 'info', // Use info level to see startup messages
      MCP_LOG_FORMAT: 'human',
      NODE_ENV: 'test',
    };

    // Remove undefined values
    Object.keys(serverEnv).forEach(key => {
      if ((serverEnv as Record<string, string | undefined>)[key] === undefined) {
        delete (serverEnv as Record<string, string | undefined>)[key];
      }
    });

    const serverProcess = spawn('node', ['build/servers/index.js'], {
      env: serverEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
    });

    let serverOutput = '';
    let serverReady = false;
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!serverReady && !resolved) {
        serverProcess.kill('SIGTERM');
        reject(new Error(`Server failed to start within timeout (port ${port}).\nLast 500 chars of output:\n${serverOutput.slice(-500)}`));
      }
    }, 15000);

    const checkServerReady = (output: string) => {
      // Remove ANSI color codes for easier matching
      const cleanOutput = output.replace(/\x1b\[[0-9;]*m/g, '');

      // Check if server is ready by looking for the running message with the correct port
      if (cleanOutput.includes(`running on http://localhost:${port}`) ||
          cleanOutput.includes(`running on https://localhost:${port}`)) {
        if (!serverReady && !resolved) {
          serverReady = true;
          resolved = true;
          clearTimeout(timeout);
          resolve({
            process: serverProcess,
            port,
            cleanup: async () => {
              try {
                serverProcess.kill('SIGTERM');
                // Wait up to 2 seconds for graceful shutdown
                const exitPromise = once(serverProcess, 'exit');
                const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.race([exitPromise, timeoutPromise]);
                if (!serverProcess.killed) {
                  serverProcess.kill('SIGKILL');
                }
              } catch {
                // Ignore cleanup errors
              }
            },
          });
        }
      }
    };

    serverProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      serverOutput += output;
      checkServerReady(output);
    });

    serverProcess.stderr?.on('data', (data: Buffer) => {
      const output = data.toString();
      serverOutput += output;
      checkServerReady(output);
    });

    serverProcess.on('error', (error: Error) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Failed to start server: ${error.message}\nOutput:\n${serverOutput.slice(-500)}`));
      }
    });

    serverProcess.on('exit', (code: number | null, signal: string | null) => {
      if (!serverReady && !resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error(`Server exited with code ${code} signal ${signal} before becoming ready (port ${port}).\nLast 500 chars of output:\n${serverOutput.slice(-500)}`));
      }
    });
  });
}

/**
 * Make an HTTP request and return status code and response
 */
async function makeRequest(
  port: number,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string; timeout?: number } = {},
): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const isSSE = path.includes('/sse');
    const timeout = options.timeout || (isSSE ? 2000 : 5000); // Shorter timeout for SSE

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        let timeoutId: NodeJS.Timeout | null = null;

        // For SSE endpoints with successful connection (200), we just want to verify the connection is established
        // For error responses (401, 403, etc.), treat as normal HTTP to get full response
        if (isSSE && res.statusCode === 200) {
          // Wait for first chunk or timeout
          timeoutId = setTimeout(() => {
            req.destroy();
            resolve({
              status: res.statusCode || 0,
              body,
              headers: res.headers,
            });
          }, timeout);

          res.once('data', (chunk) => {
            body += chunk;
            if (timeoutId) clearTimeout(timeoutId);
            req.destroy();
            resolve({
              status: res.statusCode || 0,
              body,
              headers: res.headers,
            });
          });

          res.on('error', (_err) => {
            if (timeoutId) clearTimeout(timeoutId);
            req.destroy();
            resolve({
              status: res.statusCode || 0,
              body,
              headers: res.headers,
            });
          });
        } else {
          // Normal request - collect full response
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({
              status: res.statusCode || 0,
              body,
              headers: res.headers,
            });
          });
        }
      },
    );

    req.on('error', (err) => {
      // For connection refused, etc, still resolve with error info
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeRequest(port, '/healthz');
      return;
    } catch {
      if (i === maxAttempts - 1) {
        throw new Error(`Server on port ${port} did not become ready after ${maxAttempts} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

describe('Authentication E2E Tests', () => {
  // Use different ports for different test scenarios to avoid conflicts
  const TEST_PORTS = {
    NO_AUTH: 13000,
    BEARER: 13001,
    OAUTH: 13002,
    BEARER_AND_NO_AUTH: 13003,
  };

  // Ensure build exists before running tests
  beforeAll(async () => {
    // Check if build directory exists
    const fs = await import('fs');
    const buildPath = 'build/servers/index.js';
    if (!fs.existsSync(buildPath)) {
      throw new Error(
        'Build directory not found. Please run "npm run build" before running e2e tests.',
      );
    }
  }, 30000);

  describe('Scenario 1: No Authentication (unauthenticated access allowed)', () => {
    let server: ServerProcess;

    beforeAll(async () => {
      // Start server without any auth configuration
      // Note: We must explicitly unset any auth env vars that might be inherited
      server = await startServer(
        {
          LM_COMPANY: 'test-company',
          LM_BEARER_TOKEN: 'test-lm-token',
          // Explicitly clear any MCP auth settings
          MCP_BEARER_TOKEN: '', // Empty string to unset
          OAUTH_PROVIDER: '', // Empty string to unset
          OAUTH_CLIENT_ID: '',
          OAUTH_CLIENT_SECRET: '',
        },
        TEST_PORTS.NO_AUTH,
      );
      await waitForServer(TEST_PORTS.NO_AUTH);
    }, 30000);

    afterAll(async () => {
      if (server) {
        await server.cleanup();
      }
    });

    it('should allow access to / without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/');
      expect(response.status).toBe(200);
      expect(response.body).toContain('LogicMonitor MCP Server');
    });

    it('should allow access to /healthz without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/healthz');
      expect(response.status).toBe(200);
      expect(response.body).toBe('ok');
    });

    it('should allow access to /health without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/health');
      expect(response.status).toBe(200);
      const health = JSON.parse(response.body);
      expect(health.status).toBe('healthy');
      expect(health.version).toBeDefined();
    });

    it('should allow access to /mcp without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }),
      });
      expect(response.status).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.jsonrpc).toBe('2.0');
      expect(result.result).toBeDefined();
    });

    it('should allow access to /mcp/sse without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse');
      expect(response.status).toBe(200);
      // SSE endpoint should return text/event-stream
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('Scenario 2: Bearer Token Authentication', () => {
    let server: ServerProcess;
    const BEARER_TOKEN = 'test-bearer-token-12345';

    beforeAll(async () => {
      // Start server with bearer token authentication
      server = await startServer(
        {
          LM_COMPANY: 'test-company',
          LM_BEARER_TOKEN: 'test-lm-token',
          MCP_BEARER_TOKEN: BEARER_TOKEN,
          OAUTH_PROVIDER: 'none',
        },
        TEST_PORTS.BEARER,
      );
      await waitForServer(TEST_PORTS.BEARER);
    }, 30000);

    afterAll(async () => {
      if (server) {
        await server.cleanup();
      }
    });

    it('should allow access to / without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/');
      expect(response.status).toBe(200);
    });

    it('should allow access to /healthz without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/healthz');
      expect(response.status).toBe(200);
    });

    it('should allow access to /health without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/health');
      expect(response.status).toBe(200);
    });

    it('should deny access to /mcp without bearer token (401)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers['www-authenticate']).toBeDefined();
      const result = JSON.parse(response.body);
      expect(result.error).toBe('unauthorized');
    });

    it('should deny access to /mcp with invalid bearer token (401)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        }),
      });
      expect(response.status).toBe(401);
    });

    it('should allow access to /mcp with valid bearer token (200)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }),
      });
      expect(response.status).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.result).toBeDefined();
    });

    it('should deny access to /mcp/sse without bearer token (401)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse');
      expect(response.status).toBe(401);
    });

    it('should allow access to /mcp/sse with valid bearer token (200)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse', {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('Scenario 3: OAuth Authentication', () => {
    let server: ServerProcess;

    beforeAll(async () => {
      // Start server with OAuth configuration
      server = await startServer(
        {
          LM_COMPANY: 'test-company',
          LM_BEARER_TOKEN: 'test-lm-token',
          OAUTH_PROVIDER: 'github',
          OAUTH_CLIENT_ID: 'test-client-id',
          OAUTH_CLIENT_SECRET: 'test-client-secret',
          OAUTH_SESSION_SECRET: 'test-session-secret',
          OAUTH_CALLBACK_URL: `http://localhost:${TEST_PORTS.OAUTH}/auth/callback`,
        },
        TEST_PORTS.OAUTH,
      );
      await waitForServer(TEST_PORTS.OAUTH);
    }, 30000);

    afterAll(async () => {
      if (server) {
        await server.cleanup();
      }
    });

    it('should allow access to / without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/');
      expect(response.status).toBe(200);
      expect(response.body).toContain('LogicMonitor MCP Server');
    });

    it('should allow access to /healthz without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/healthz');
      expect(response.status).toBe(200);
    });

    it('should allow access to /health without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/health');
      expect(response.status).toBe(200);
    });

    it('should deny access to /mcp without authentication (401)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers['www-authenticate']).toBeDefined();
      const result = JSON.parse(response.body);
      expect(result.error).toBe('invalid_token');
      // OAuth configured, should include resource metadata
      expect(result.resource_metadata).toBeDefined();
      expect(result.authorization_endpoint).toBeDefined();
    });

    it('should deny access to /mcp/sse without authentication (401)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse');
      expect(response.status).toBe(401);
      const result = JSON.parse(response.body);
      expect(result.error).toBe('invalid_token');
      expect(result.resource_metadata).toBeDefined();
    });

    it('should redirect /auth/login to OAuth provider (302)', async () => {
      const response = await makeRequest(server.port, '/auth/login');
      // Passport redirects to OAuth provider
      expect([302, 303]).toContain(response.status);
      expect(response.headers.location).toBeDefined();
      expect(response.headers.location).toContain('github.com');
    });
  });

  describe('Scenario 4: Bearer Token with No Auth Fallback (mixed)', () => {
    let server: ServerProcess;
    const BEARER_TOKEN = 'test-mixed-token-67890';

    beforeAll(async () => {
      // This scenario tests when both bearer token is set but we want to verify behavior
      // Actually, the server either has auth or doesn't - this tests bearer token behavior
      server = await startServer(
        {
          LM_COMPANY: 'test-company',
          LM_BEARER_TOKEN: 'test-lm-token',
          MCP_BEARER_TOKEN: BEARER_TOKEN,
          OAUTH_PROVIDER: 'none',
        },
        TEST_PORTS.BEARER_AND_NO_AUTH,
      );
      await waitForServer(TEST_PORTS.BEARER_AND_NO_AUTH);
    }, 30000);

    afterAll(async () => {
      if (server) {
        await server.cleanup();
      }
    });

    it('should allow access to / without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/');
      expect(response.status).toBe(200);
    });

    it('should allow access to /healthz without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/healthz');
      expect(response.status).toBe(200);
    });

    it('should allow access to /health without authentication (200)', async () => {
      const response = await makeRequest(server.port, '/health');
      expect(response.status).toBe(200);
    });

    it('should deny access to /mcp without valid token (401)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {},
          id: 1,
        }),
      });
      expect(response.status).toBe(401);
    });

    it('should allow access to /mcp with valid bearer token (200)', async () => {
      const response = await makeRequest(server.port, '/mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' },
          },
          id: 1,
        }),
      });
      expect(response.status).toBe(200);
    });

    it('should deny access to /mcp/sse without token (401)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse');
      expect(response.status).toBe(401);
    });

    it('should allow access to /mcp/sse with valid bearer token (200)', async () => {
      const response = await makeRequest(server.port, '/mcp/sse', {
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      });
      expect(response.status).toBe(200);
    });
  });
});

