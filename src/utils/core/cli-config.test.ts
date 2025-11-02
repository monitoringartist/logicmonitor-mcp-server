/**
 * Tests for CLI Configuration Parser
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  parseConfig,
  validateConfig,
  displayConfig,
  printUsage,
  type ServerConfig,
} from './cli-config.js';

describe('CLI Configuration Parser', () => {
  // Store original values
  const originalArgv = process.argv;
  const originalEnv = process.env;
  const originalExit = process.exit;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  // Mock console methods
  let consoleOutput: string[] = [];
  let consoleErrors: string[] = [];

  beforeEach(() => {
    // Reset process.argv
    process.argv = ['node', 'script.js'];
    
    // Reset process.env - create a clean copy without test-specific vars
    process.env = { ...originalEnv };
    
    // Explicitly delete any LM/MCP related env vars to ensure clean state
    delete process.env.LM_COMPANY;
    delete process.env.LM_BEARER_TOKEN;
    delete process.env.MCP_TRANSPORT;
    delete process.env.MCP_ADDRESS;
    delete process.env.MCP_BASE_PATH;
    delete process.env.MCP_ENDPOINT_PATH;
    delete process.env.MCP_DEBUG;
    delete process.env.MCP_LOG_FORMAT;
    delete process.env.MCP_LOG_LEVEL;
    delete process.env.MCP_ENABLED_TOOLS;
    delete process.env.MCP_READ_ONLY;
    delete process.env.MCP_DISABLE_SEARCH;
    delete process.env.MCP_BEARER_TOKEN;
    delete process.env.TLS_CERT_FILE;
    delete process.env.TLS_KEY_FILE;
    delete process.env.OAUTH_PROVIDER;
    delete process.env.OAUTH_CLIENT_ID;
    delete process.env.OAUTH_CLIENT_SECRET;
    delete process.env.OAUTH_SESSION_SECRET;
    delete process.env.OAUTH_CALLBACK_URL;
    delete process.env.OAUTH_SCOPE;
    delete process.env.OAUTH_TOKEN_REFRESH_ENABLED;
    delete process.env.OAUTH_AUTHORIZATION_URL;
    delete process.env.OAUTH_TOKEN_URL;
    delete process.env.OAUTH_USER_PROFILE_URL;
    delete process.env.SESSION_SECRET;
    
    // Mock console methods
    consoleOutput = [];
    consoleErrors = [];
    console.log = jest.fn((...args: any[]) => {
      consoleOutput.push(args.join(' '));
    }) as any;
    console.error = jest.fn((...args: any[]) => {
      consoleErrors.push(args.join(' '));
    }) as any;
    
    // Mock process.exit
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    // Restore original values
    process.argv = originalArgv;
    process.env = originalEnv;
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('parseConfig', () => {
    describe('Default values', () => {
      it('should return default configuration', () => {
        const config = parseConfig();
        
        expect(config.transport).toBe('stdio');
        expect(config.address).toBe('localhost:3000');
        expect(config.endpointPath).toBe('/mcp');
        expect(config.debug).toBe(false);
        expect(config.logFormat).toBe('human');
        expect(config.logLevel).toBe('info');
        expect(config.readOnly).toBe(true);
        expect(config.disableSearch).toBe(false);
      });

      it('should have empty LM credentials by default', () => {
        const config = parseConfig();
        
        expect(config.lmCompany).toBe('');
        expect(config.lmBearerToken).toBe('');
      });

      it('should have no OAuth config by default', () => {
        const config = parseConfig();
        
        expect(config.oauth).toBeUndefined();
      });
    });

    describe('Environment variables', () => {
      it('should parse transport from env', () => {
        process.env.MCP_TRANSPORT = 'sse';
        const config = parseConfig();
        
        expect(config.transport).toBe('sse');
      });

      it('should parse address from env', () => {
        process.env.MCP_ADDRESS = '0.0.0.0:8080';
        const config = parseConfig();
        
        expect(config.address).toBe('0.0.0.0:8080');
      });

      it('should parse base path from env', () => {
        process.env.MCP_BASE_PATH = '/api';
        const config = parseConfig();
        
        expect(config.basePath).toBe('/api');
      });

      it('should parse endpoint path from env', () => {
        process.env.MCP_ENDPOINT_PATH = '/custom';
        const config = parseConfig();
        
        expect(config.endpointPath).toBe('/custom');
      });

      it('should parse TLS config from env', () => {
        process.env.MCP_TLS_CERT_FILE = '/path/to/cert.pem';
        process.env.MCP_TLS_KEY_FILE = '/path/to/key.pem';
        const config = parseConfig();
        
        expect(config.tlsCertFile).toBe('/path/to/cert.pem');
        expect(config.tlsKeyFile).toBe('/path/to/key.pem');
      });

      it('should parse debug flag from env', () => {
        process.env.MCP_DEBUG = 'true';
        const config = parseConfig();
        
        expect(config.debug).toBe(true);
      });

      it('should parse log format from env', () => {
        process.env.MCP_LOG_FORMAT = 'json';
        const config = parseConfig();
        
        expect(config.logFormat).toBe('json');
      });

      it('should parse log level from env', () => {
        process.env.MCP_LOG_LEVEL = 'debug';
        const config = parseConfig();
        
        expect(config.logLevel).toBe('debug');
      });

      it('should parse enabled tools from env', () => {
        process.env.MCP_ENABLED_TOOLS = 'list_devices,get_device,list_alerts';
        const config = parseConfig();
        
        expect(config.enabledTools).toEqual(['list_devices', 'get_device', 'list_alerts']);
      });

      it('should parse read-only flag from env', () => {
        process.env.MCP_READ_ONLY = 'false';
        const config = parseConfig();
        
        expect(config.readOnly).toBe(false);
      });

      it('should parse disable-search flag from env', () => {
        process.env.MCP_DISABLE_SEARCH = 'true';
        const config = parseConfig();
        
        expect(config.disableSearch).toBe(true);
      });

      it('should parse LM credentials from env', () => {
        process.env.LM_COMPANY = 'mycompany';
        process.env.LM_BEARER_TOKEN = 'my-token-123';
        const config = parseConfig();
        
        expect(config.lmCompany).toBe('mycompany');
        expect(config.lmBearerToken).toBe('my-token-123');
      });

      it('should parse MCP bearer token from env', () => {
        process.env.MCP_BEARER_TOKEN = 'mcp-token-456';
        const config = parseConfig();
        
        expect(config.mcpBearerToken).toBe('mcp-token-456');
      });
    });

    describe('CLI flags', () => {
      it('should parse transport from CLI short flag', () => {
        process.argv = ['node', 'script.js', '-t', 'streamable-http'];
        const config = parseConfig();
        
        expect(config.transport).toBe('streamable-http');
      });

      it('should parse transport from CLI long flag', () => {
        process.argv = ['node', 'script.js', '--transport', 'sse'];
        const config = parseConfig();
        
        expect(config.transport).toBe('sse');
      });

      it('should parse address from CLI', () => {
        process.argv = ['node', 'script.js', '--address', '192.168.1.1:9000'];
        const config = parseConfig();
        
        expect(config.address).toBe('192.168.1.1:9000');
      });

      it('should parse base path from CLI', () => {
        process.argv = ['node', 'script.js', '--base-path', '/v1'];
        const config = parseConfig();
        
        expect(config.basePath).toBe('/v1');
      });

      it('should parse endpoint path from CLI', () => {
        process.argv = ['node', 'script.js', '--endpoint-path', '/api/mcp'];
        const config = parseConfig();
        
        expect(config.endpointPath).toBe('/api/mcp');
      });

      it('should parse TLS config from CLI', () => {
        process.argv = ['node', 'script.js', '--server.tls-cert-file', '/cert.pem', '--server.tls-key-file', '/key.pem'];
        const config = parseConfig();
        
        expect(config.tlsCertFile).toBe('/cert.pem');
        expect(config.tlsKeyFile).toBe('/key.pem');
      });

      it('should parse debug flag from CLI', () => {
        process.argv = ['node', 'script.js', '--debug'];
        const config = parseConfig();
        
        expect(config.debug).toBe(true);
      });

      it('should parse log format from CLI', () => {
        process.argv = ['node', 'script.js', '--log-format', 'json'];
        const config = parseConfig();
        
        expect(config.logFormat).toBe('json');
      });

      it('should parse log level from CLI', () => {
        process.argv = ['node', 'script.js', '--log-level', 'warn'];
        const config = parseConfig();
        
        expect(config.logLevel).toBe('warn');
      });

      it('should parse enabled tools from CLI', () => {
        process.argv = ['node', 'script.js', '--enabled-tools', 'tool1,tool2'];
        const config = parseConfig();
        
        expect(config.enabledTools).toEqual(['tool1', 'tool2']);
      });

      it('should parse read-only flag from CLI', () => {
        process.argv = ['node', 'script.js', '--read-only'];
        const config = parseConfig();
        
        expect(config.readOnly).toBe(true);
      });

      it('should parse disable-search flag from CLI', () => {
        process.argv = ['node', 'script.js', '--disable-search'];
        const config = parseConfig();
        
        expect(config.disableSearch).toBe(true);
      });

      it('should parse LM credentials from CLI', () => {
        process.argv = ['node', 'script.js', '--lm-company', 'testco', '--lm-bearer-token', 'test-token'];
        const config = parseConfig();
        
        expect(config.lmCompany).toBe('testco');
        expect(config.lmBearerToken).toBe('test-token');
      });

      it('should parse MCP bearer token from CLI', () => {
        process.argv = ['node', 'script.js', '--mcp-bearer-token', 'mcp-test-token'];
        const config = parseConfig();
        
        expect(config.mcpBearerToken).toBe('mcp-test-token');
      });
    });

    describe('Precedence: Environment over CLI', () => {
      it('should prefer env var over CLI flag for transport', () => {
        process.env.MCP_TRANSPORT = 'sse';
        process.argv = ['node', 'script.js', '-t', 'streamable-http'];
        const config = parseConfig();
        
        expect(config.transport).toBe('sse');
      });

      it('should prefer env var over CLI flag for address', () => {
        process.env.MCP_ADDRESS = 'env-host:5000';
        process.argv = ['node', 'script.js', '--address', 'cli-host:6000'];
        const config = parseConfig();
        
        expect(config.address).toBe('env-host:5000');
      });

      it('should prefer env var over CLI flag for LM credentials', () => {
        process.env.LM_COMPANY = 'env-company';
        process.env.LM_BEARER_TOKEN = 'env-token';
        process.argv = ['node', 'script.js', '--lm-company', 'cli-company', '--lm-bearer-token', 'cli-token'];
        const config = parseConfig();
        
        expect(config.lmCompany).toBe('env-company');
        expect(config.lmBearerToken).toBe('env-token');
      });

      it('should prefer env var over CLI flag for log format', () => {
        process.env.MCP_LOG_FORMAT = 'json';
        process.argv = ['node', 'script.js', '--log-format', 'human'];
        const config = parseConfig();
        
        expect(config.logFormat).toBe('json');
      });
    });

    describe('OAuth configuration', () => {
      it('should parse OAuth config when all required fields present', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        
        const config = parseConfig();
        
        expect(config.oauth).toBeDefined();
        expect(config.oauth?.provider).toBe('github');
        expect(config.oauth?.clientId).toBe('client-123');
        expect(config.oauth?.clientSecret).toBe('secret-456');
        expect(config.oauth?.sessionSecret).toBe('session-789');
      });

      it('should not parse OAuth config when provider missing', () => {
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        
        const config = parseConfig();
        
        expect(config.oauth).toBeUndefined();
      });

      it('should not parse OAuth config when client ID missing', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        
        const config = parseConfig();
        
        expect(config.oauth).toBeUndefined();
      });

      it('should not parse OAuth config when client secret missing', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        
        const config = parseConfig();
        
        expect(config.oauth).toBeUndefined();
      });

      it('should generate default callback URL', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        
        const config = parseConfig();
        
        expect(config.oauth?.callbackUrl).toBe('http://localhost:3000/auth/callback');
      });

      it('should use custom callback URL from env', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.OAUTH_CALLBACK_URL = 'https://example.com/callback';
        
        const config = parseConfig();
        
        expect(config.oauth?.callbackUrl).toBe('https://example.com/callback');
      });

      it('should parse OAuth scope', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.OAUTH_SCOPE = 'user:email,repo';
        
        const config = parseConfig();
        
        expect(config.oauth?.scope).toBe('user:email,repo');
      });

      it('should default token refresh to enabled', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        
        const config = parseConfig();
        
        expect(config.oauth?.tokenRefreshEnabled).toBe(true);
      });

      it('should allow disabling token refresh', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.OAUTH_TOKEN_REFRESH = 'false';
        
        const config = parseConfig();
        
        expect(config.oauth?.tokenRefreshEnabled).toBe(false);
      });

      it('should parse token refresh buffer', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.OAUTH_TOKEN_REFRESH_BUFFER = '10';
        
        const config = parseConfig();
        
        expect(config.oauth?.tokenRefreshBuffer).toBe(10);
      });

      it('should default token refresh buffer to 5 minutes', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        
        const config = parseConfig();
        
        expect(config.oauth?.tokenRefreshBuffer).toBe(5);
      });

      it('should parse custom provider endpoints', () => {
        process.env.OAUTH_PROVIDER = 'custom';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.OAUTH_AUTHORIZATION_URL = 'https://auth.example.com/oauth/authorize';
        process.env.OAUTH_TOKEN_URL = 'https://auth.example.com/oauth/token';
        process.env.OAUTH_USER_PROFILE_URL = 'https://auth.example.com/oauth/userinfo';
        
        const config = parseConfig();
        
        expect(config.oauth?.authorizationUrl).toBe('https://auth.example.com/oauth/authorize');
        expect(config.oauth?.tokenUrl).toBe('https://auth.example.com/oauth/token');
        expect(config.oauth?.userProfileUrl).toBe('https://auth.example.com/oauth/userinfo');
      });

      it('should not set custom endpoints for non-custom providers', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        
        const config = parseConfig();
        
        expect(config.oauth?.authorizationUrl).toBeUndefined();
        expect(config.oauth?.tokenUrl).toBeUndefined();
        expect(config.oauth?.userProfileUrl).toBeUndefined();
      });

      it('should use SESSION_SECRET as fallback for session secret', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.SESSION_SECRET = 'fallback-session';
        
        const config = parseConfig();
        
        expect(config.oauth?.sessionSecret).toBe('fallback-session');
      });

      it('should use address to generate callback URL', () => {
        process.env.OAUTH_PROVIDER = 'github';
        process.env.OAUTH_CLIENT_ID = 'client-123';
        process.env.OAUTH_CLIENT_SECRET = 'secret-456';
        process.env.OAUTH_SESSION_SECRET = 'session-789';
        process.env.MCP_ADDRESS = '192.168.1.100:8080';
        
        const config = parseConfig();
        
        expect(config.oauth?.callbackUrl).toBe('http://192.168.1.100:8080/auth/callback');
      });
    });

    describe('Help flag', () => {
      it('should exit when --help flag is present', () => {
        process.argv = ['node', 'script.js', '--help'];
        
        parseConfig();
        
        expect(process.exit).toHaveBeenCalledWith(0);
      });

      it('should exit when -h flag is present', () => {
        process.argv = ['node', 'script.js', '-h'];
        
        parseConfig();
        
        expect(process.exit).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('validateConfig', () => {
    let config: ServerConfig;

    beforeEach(() => {
      config = {
        transport: 'stdio',
        address: 'localhost:3000',
        endpointPath: '/mcp',
        debug: false,
        logFormat: 'human',
        logLevel: 'info',
        readOnly: true,
        disableSearch: false,
        lmCompany: 'testcompany',
        lmBearerToken: 'test-token',
      };
    });

    it('should pass validation with valid config', () => {
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should fail validation when LM company is missing', () => {
      config.lmCompany = '';
      
      validateConfig(config);
      
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrors.some(e => e.includes('LogicMonitor credentials are required'))).toBe(true);
    });

    it('should fail validation when LM bearer token is missing', () => {
      config.lmBearerToken = '';
      
      validateConfig(config);
      
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrors.some(e => e.includes('LogicMonitor credentials are required'))).toBe(true);
    });

    it('should fail validation with invalid transport', () => {
      config.transport = 'invalid' as any;
      
      validateConfig(config);
      
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrors.some(e => e.includes('Invalid transport'))).toBe(true);
    });

    it('should fail validation with invalid log format', () => {
      config.logFormat = 'invalid' as any;
      
      validateConfig(config);
      
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrors.some(e => e.includes('Invalid log format'))).toBe(true);
    });

    it('should fail validation with invalid log level', () => {
      config.logLevel = 'invalid' as any;
      
      validateConfig(config);
      
      expect(process.exit).toHaveBeenCalledWith(1);
      expect(consoleErrors.some(e => e.includes('Invalid log level'))).toBe(true);
    });

    it('should validate all transport types', () => {
      ['stdio', 'sse', 'streamable-http'].forEach(transport => {
        config.transport = transport as any;
        expect(() => validateConfig(config)).not.toThrow();
      });
    });

    it('should validate all log formats', () => {
      ['json', 'human'].forEach(format => {
        config.logFormat = format as any;
        expect(() => validateConfig(config)).not.toThrow();
      });
    });

    it('should validate all log levels', () => {
      ['debug', 'info', 'warn', 'error'].forEach(level => {
        config.logLevel = level as any;
        expect(() => validateConfig(config)).not.toThrow();
      });
    });
  });

  describe('displayConfig', () => {
    let config: ServerConfig;

    beforeEach(() => {
      config = {
        transport: 'stdio',
        address: 'localhost:3000',
        endpointPath: '/mcp',
        debug: false,
        logFormat: 'human',
        logLevel: 'info',
        readOnly: true,
        disableSearch: false,
        lmCompany: 'testcompany',
        lmBearerToken: 'test-token',
      };
    });

    it('should display config in human format', () => {
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('LogicMonitor MCP Server'))).toBe(true);
      expect(consoleOutput.some(o => o.includes('Transport: stdio'))).toBe(true);
      expect(consoleOutput.some(o => o.includes('LM Account: testcompany'))).toBe(true);
    });

    it('should display config in JSON format', () => {
      config.logFormat = 'json';
      
      displayConfig(config);
      
      const jsonOutput = consoleOutput.find(o => o.startsWith('{'));
      expect(jsonOutput).toBeDefined();
      
      const parsed = JSON.parse(jsonOutput!);
      expect(parsed.transport).toBe('stdio');
      expect(parsed.logLevel).toBe('info');
    });

    it('should show address for non-stdio transports', () => {
      config.transport = 'sse';
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Address: localhost:3000'))).toBe(true);
    });

    it('should show endpoint for non-stdio transports', () => {
      config.transport = 'streamable-http';
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Endpoint: /mcp'))).toBe(true);
    });

    it('should show base path when configured', () => {
      config.transport = 'sse';
      config.basePath = '/api';
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Base Path: /api'))).toBe(true);
    });

    it('should show debug status', () => {
      config.debug = true;
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Debug: enabled'))).toBe(true);
    });

    it('should show read-only mode', () => {
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Mode: read-only'))).toBe(true);
    });

    it('should show read-write mode', () => {
      config.readOnly = false;
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Mode: read-write'))).toBe(true);
    });

    it('should show search disabled status', () => {
      config.disableSearch = true;
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Search: disabled'))).toBe(true);
    });

    it('should show enabled tools when configured', () => {
      config.enabledTools = ['tool1', 'tool2', 'tool3'];
      
      displayConfig(config);
      
      expect(consoleOutput.some(o => o.includes('Enabled Tools: tool1, tool2, tool3'))).toBe(true);
    });

    it('should use emojis in human format', () => {
      config.logFormat = 'human';
      
      displayConfig(config);
      
      const hasEmoji = consoleOutput.some(o => /[\u{1F300}-\u{1F9FF}]/u.test(o));
      expect(hasEmoji).toBe(true);
    });

    it('should not use emojis in JSON format', () => {
      config.logFormat = 'json';
      
      displayConfig(config);
      
      const hasEmoji = consoleOutput.some(o => /[\u{1F300}-\u{1F9FF}]/u.test(o));
      expect(hasEmoji).toBe(false);
    });
  });

  describe('printUsage', () => {
    it('should print usage information', () => {
      printUsage();
      
      expect(consoleOutput.length).toBeGreaterThan(0);
      expect(consoleOutput.join('\n')).toContain('LogicMonitor MCP Server - Usage');
    });

    it('should include transport options', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('TRANSPORT OPTIONS');
      expect(output).toContain('--transport');
    });

    it('should include TLS configuration', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('TLS CONFIGURATION');
      expect(output).toContain('--server.tls-cert-file');
    });

    it('should include debug and logging options', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('DEBUG AND LOGGING');
      expect(output).toContain('--debug');
      expect(output).toContain('--log-format');
    });

    it('should include tool configuration', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('TOOL CONFIGURATION');
      expect(output).toContain('--enabled-tools');
      expect(output).toContain('--read-only');
    });

    it('should include LogicMonitor API options', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('LOGICMONITOR API');
      expect(output).toContain('--lm-company');
      expect(output).toContain('--lm-bearer-token');
    });

    it('should include examples', () => {
      printUsage();
      
      const output = consoleOutput.join('\n');
      expect(output).toContain('EXAMPLES');
      expect(output).toContain('npm start');
    });
  });
});

