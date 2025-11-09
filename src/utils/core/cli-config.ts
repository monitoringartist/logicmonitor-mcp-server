/**
 * CLI Configuration Parser
 *
 * Parses command-line flags and environment variables
 * Environment variables take precedence over CLI flags
 */

export interface ServerConfig {
  // Transport options
  transport: 'stdio' | 'sse' | 'streamable-http';
  address: string;
  basePath?: string;
  endpointPath: string;

  // TLS configuration (for streamable-http transport only)
  tlsCertFile?: string;
  tlsKeyFile?: string;

  // Debug and logging
  debug: boolean;
  logFormat: 'json' | 'human';
  logLevel: 'debug' | 'info' | 'warn' | 'error';

  // Tool configuration
  enabledTools?: string[];
  readOnly: boolean;
  disableSearch: boolean;

  // LM credentials
  lmCompany: string;
  lmBearerToken: string;

  // MCP Server authentication
  mcpBearerToken?: string; // Optional static bearer token for MCP server authentication

  // OAuth/OIDC configuration (for remote servers)
  oauth?: OAuthConfig;
}

export interface OAuthConfig {
  // OAuth provider type
  provider: 'github' | 'google' | 'azure' | 'okta' | 'auth0' | 'custom';
  
  // OAuth credentials
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  
  // OAuth endpoints (for custom providers)
  authorizationUrl?: string;
  tokenUrl?: string;
  userProfileUrl?: string;
  
  // OAuth options
  scope?: string;
  sessionSecret: string;
  
  // Token refresh settings
  tokenRefreshEnabled: boolean;
  tokenRefreshBuffer?: number; // Minutes before expiry to refresh
}

/**
 * Parse CLI arguments and environment variables
 */
export function parseConfig(): ServerConfig {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Helper to get CLI flag value
  const getFlag = (shortFlag: string, longFlag: string, defaultValue?: string): string | undefined => {
    const shortIndex = args.indexOf(shortFlag);
    const longIndex = args.indexOf(longFlag);
    const index = shortIndex !== -1 ? shortIndex : longIndex;

    if (index !== -1 && args[index + 1]) {
      return args[index + 1];
    }
    return defaultValue;
  };

  // Helper to check if flag is present (boolean flags)
  const hasFlag = (shortFlag: string, longFlag: string): boolean => {
    return args.includes(shortFlag) || args.includes(longFlag);
  };

  // Transport options (env takes precedence)
  const transport = (
    process.env.MCP_TRANSPORT ||
    getFlag('-t', '--transport') ||
    'stdio'
  ) as 'stdio' | 'sse' | 'streamable-http';

  const address = process.env.MCP_ADDRESS || getFlag('', '--address') || 'localhost:3000';
  const basePath = process.env.MCP_BASE_PATH || getFlag('', '--base-path');
  const endpointPath = process.env.MCP_ENDPOINT_PATH || getFlag('', '--endpoint-path') || '/mcp';

  // TLS configuration (env takes precedence)
  const tlsCertFile = process.env.MCP_TLS_CERT_FILE || getFlag('', '--server.tls-cert-file');
  const tlsKeyFile = process.env.MCP_TLS_KEY_FILE || getFlag('', '--server.tls-key-file');

  // Debug and logging (env takes precedence)
  const debug = process.env.MCP_DEBUG === 'true' || hasFlag('', '--debug');
  const logFormat = (
    process.env.MCP_LOG_FORMAT ||
    getFlag('', '--log-format') ||
    'human'
  ) as 'json' | 'human';
  const logLevel = (
    process.env.MCP_LOG_LEVEL ||
    getFlag('', '--log-level') ||
    'info'
  ) as 'debug' | 'info' | 'warn' | 'error';

  // Tool configuration (env takes precedence)
  const enabledToolsStr = process.env.MCP_ENABLED_TOOLS || getFlag('', '--enabled-tools');
  const enabledTools = enabledToolsStr ? enabledToolsStr.split(',').map(t => t.trim()) : undefined;
  const readOnly = process.env.MCP_READ_ONLY === 'false' ? false : (process.env.MCP_READ_ONLY === 'true' || hasFlag('', '--read-only') || true);
  const disableSearch = process.env.MCP_DISABLE_SEARCH === 'true' || hasFlag('', '--disable-search');

  // LM credentials (env takes precedence over flags)
  const lmCompany = process.env.LM_COMPANY || getFlag('', '--lm-company') || '';
  const lmBearerToken = process.env.LM_BEARER_TOKEN || getFlag('', '--lm-bearer-token') || '';

  // MCP Server authentication (static bearer token)
  const mcpBearerToken = process.env.MCP_BEARER_TOKEN || getFlag('', '--mcp-bearer-token') || undefined;

  // OAuth configuration (optional, for remote servers)
  const oauth = parseOAuthConfig(address);

  return {
    transport,
    address,
    basePath,
    endpointPath,
    tlsCertFile,
    tlsKeyFile,
    debug,
    logFormat,
    logLevel,
    enabledTools,
    readOnly,
    disableSearch,
    lmCompany,
    lmBearerToken,
    mcpBearerToken,
    oauth,
  };
}

/**
 * Parse OAuth configuration from environment variables
 * @param address - Server address (host:port) to use for default callback URL
 */
function parseOAuthConfig(address: string): OAuthConfig | undefined {
  const provider = (process.env.OAUTH_PROVIDER || 'none') as OAuthConfig['provider'] | 'none';
  const clientId = process.env.OAUTH_CLIENT_ID || '';
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || '';
  const sessionSecret = process.env.OAUTH_SESSION_SECRET || process.env.SESSION_SECRET || '';

  // OAuth is optional - disabled if provider is 'none' or not set
  if (provider === 'none' || !provider || !clientId || !clientSecret) {
    return undefined;
  }

  // Parse host and port from address for default callback URL
  const addressParts = address.split(':');
  const host = addressParts[0] || 'localhost';
  const port = addressParts[1] || '3000';
  const callbackUrl = process.env.OAUTH_CALLBACK_URL || `http://${host}:${port}/auth/callback`;
  
  const config: OAuthConfig = {
    provider,
    clientId,
    clientSecret,
    callbackUrl,
    sessionSecret,
    scope: process.env.OAUTH_SCOPE,
    tokenRefreshEnabled: process.env.OAUTH_TOKEN_REFRESH !== 'false',
    tokenRefreshBuffer: process.env.OAUTH_TOKEN_REFRESH_BUFFER 
      ? parseInt(process.env.OAUTH_TOKEN_REFRESH_BUFFER, 10) 
      : 5, // Default: 5 minutes before expiry
  };

  // Custom provider endpoints
  if (provider === 'custom') {
    config.authorizationUrl = process.env.OAUTH_AUTHORIZATION_URL;
    config.tokenUrl = process.env.OAUTH_TOKEN_URL;
    config.userProfileUrl = process.env.OAUTH_USER_PROFILE_URL;
  }

  return config;
}

/**
 * Validate configuration
 */
export function validateConfig(config: ServerConfig): void {
  if (!config.lmCompany || !config.lmBearerToken) {
    console.error('❌ Error: LogicMonitor credentials are required');
    console.error('');
    console.error('   Option 1: Environment variables (recommended)');
    console.error('   export LM_COMPANY=mycompany');
    console.error('   export LM_BEARER_TOKEN=your-token-here');
    console.error('');
    console.error('   Option 2: CLI flags');
    console.error('   npm start -- --lm-company mycompany --lm-bearer-token "your-token"');
    console.error('');
    console.error('   Option 3: Create .env file (see env.example)');
    console.error('');
    console.error('Run "npm start -- --help" for more information');
    process.exit(1);
  }

  if (!['stdio', 'sse', 'streamable-http'].includes(config.transport)) {
    console.error(`❌ Error: Invalid transport '${config.transport}'`);
    console.error('   Valid options: stdio, sse, streamable-http');
    process.exit(1);
  }

  if (!['json', 'human'].includes(config.logFormat)) {
    console.error(`❌ Error: Invalid log format '${config.logFormat}'`);
    console.error('   Valid options: json, human');
    process.exit(1);
  }

  if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
    console.error(`❌ Error: Invalid log level '${config.logLevel}'`);
    console.error('   Valid options: debug, info, warn, error');
    process.exit(1);
  }
}

/**
 * Display current configuration
 */
export function displayConfig(config: ServerConfig): void {
  const emoji = config.logFormat === 'human';

  if (config.logFormat === 'json') {
    console.log(JSON.stringify({
      transport: config.transport,
      address: config.address,
      debug: config.debug,
      logLevel: config.logLevel,
      readOnly: config.readOnly,
      disableSearch: config.disableSearch,
      enabledTools: config.enabledTools?.length || 'all',
    }));
  } else {
    console.log(`${emoji ? '🚀 ' : ''}LogicMonitor MCP Server`);
    console.log(`${emoji ? '📡 ' : ''}Transport: ${config.transport}`);
    if (config.transport !== 'stdio') {
      console.log(`${emoji ? '🌐 ' : ''}Address: ${config.address}`);
      if (config.basePath) {
        console.log(`${emoji ? '📂 ' : ''}Base Path: ${config.basePath}`);
      }
      console.log(`${emoji ? '🎯 ' : ''}Endpoint: ${config.endpointPath}`);
    }
    console.log(`${emoji ? '🔍 ' : ''}Debug: ${config.debug ? 'enabled' : 'disabled'}`);
    console.log(`${emoji ? '📊 ' : ''}Log Level: ${config.logLevel}`);
    console.log(`${emoji ? '🏢 ' : ''}LM Account: ${config.lmCompany}`);
    console.log(`${emoji ? '🔒 ' : ''}Mode: ${config.readOnly ? 'read-only' : 'read-write'}`);
    if (config.disableSearch) {
      console.log(`${emoji ? '🚫 ' : ''}Search: disabled`);
    }
    if (config.enabledTools) {
      console.log(`${emoji ? '🛠️  ' : ''}Enabled Tools: ${config.enabledTools.join(', ')}`);
    }
  }
}

/**
 * Print usage information
 */
export function printUsage(): void {
  console.log(`
LogicMonitor MCP Server - Usage

TRANSPORT OPTIONS:
  -t, --transport <type>     Transport type: stdio, sse, streamable-http
                             Default: stdio
                             Env: MCP_TRANSPORT

  --address <host:port>      Server address for SSE/HTTP transports
                             Default: localhost:3000
                             Env: MCP_ADDRESS

  --base-path <path>         Base path for the server
                             Env: MCP_BASE_PATH

  --endpoint-path <path>     Endpoint path for streamable-http
                             Default: /mcp
                             Env: MCP_ENDPOINT_PATH

TLS CONFIGURATION (streamable-http transport only):
  --server.tls-cert-file <path>  Path to TLS certificate file for HTTPS
                             If configured with tls-key-file, server uses HTTPS
                             If unconfigured, server uses HTTP
                             Env: MCP_TLS_CERT_FILE

  --server.tls-key-file <path>   Path to TLS private key file for HTTPS
                             Both cert and key required for HTTPS
                             Env: MCP_TLS_KEY_FILE

DEBUG AND LOGGING:
  --debug                    Enable debug mode with detailed logging
                             Env: MCP_DEBUG=true

  --log-format <format>      Log format: json or human
                             Default: human
                             Env: MCP_LOG_FORMAT

  --log-level <level>        Log level: debug, info, warn, error
                             Default: info
                             Env: MCP_LOG_LEVEL

TOOL CONFIGURATION:
  --enabled-tools <list>     Comma-separated list of enabled tools
                             Default: all tools enabled
                             Env: MCP_ENABLED_TOOLS

  --read-only                Enable only read-only tools
                             Default: true (safer)
                             To enable write operations: MCP_READ_ONLY=false
                             Env: MCP_READ_ONLY

  --disable-search           Disable search tools
                             Env: MCP_DISABLE_SEARCH=true

LOGICMONITOR API (REQUIRED):
  --lm-company <name>        LogicMonitor company/account name (subdomain)
                             Example: if your portal is "mycompany.logicmonitor.com",
                             use "mycompany"
                             Env: LM_COMPANY

  --lm-bearer-token <token>  LogicMonitor API Bearer Token
                             Generate at: Settings > Users & Roles > API Tokens
                             Env: LM_BEARER_TOKEN

EXAMPLES:
  # STDIO transport (default, for Claude Desktop)
  npm start

  # SSE transport with debug logging
  npm start -- --transport sse --address localhost:3000 --debug

  # Read-only mode with JSON logging
  npm start -- --read-only --log-format json

  # Specify credentials via CLI flags
  npm start -- --lm-company mycompany --lm-bearer-token "your-token-here"

  # Using environment variables (recommended)
  export LM_COMPANY=mycompany
  export LM_BEARER_TOKEN=your-token-here
  export MCP_TRANSPORT=sse
  export MCP_DEBUG=true
  npm start

  # Show this help
  npm start -- --help
  npm start -- -h

For more information, see README.md
`);
}

