#!/usr/bin/env node

/**
 * LogicMonitor MCP Server - Unified Transport Entry Point
 *
 * Loads configuration and dispatches to the transport runner:
 * - STDIO: local usage (Claude Desktop, CLI) -> ./run-stdio.ts
 * - SSE / Streamable HTTP: web & advanced integrations -> ./run-http.ts
 *
 * Transport is selected via configuration (--transport flag or MCP_TRANSPORT env var).
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseConfig, validateConfig } from '../utils/core/cli-config.js';
import { runStdio } from './run-stdio.js';
import { runHttp } from './run-http.js';

// Load environment variables.
// quiet: true suppresses dotenv v17's startup log, which would otherwise
// corrupt the JSON-RPC stream when running over the stdio transport.
dotenv.config({ quiet: true });

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const SERVER_VERSION = packageJson.version;

// Parse and validate configuration
const appConfig = parseConfig();
validateConfig(appConfig);

if (appConfig.transport === 'stdio') {
  runStdio(appConfig, SERVER_VERSION);
} else {
  runHttp(appConfig, SERVER_VERSION);
}
