#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import { parseConfig, validateConfig } from '../utils/core/cli-config.js';

// Load environment variables
config();

// Read version from package.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const SERVER_VERSION = packageJson.version;

/**
 * LogicMonitor MCP Server (STDIO Transport)
 *
 * This server provides MCP tools for interacting with LogicMonitor API.
 * It supports comprehensive device monitoring, alert management, dashboard operations,
 * and more through the LogicMonitor REST API v3.
 *
 * Configuration via environment variables or CLI flags (see cli-config.ts)
 */

// Parse and validate configuration
const appConfig = parseConfig();
validateConfig(appConfig);

const LM_COMPANY = appConfig.lmCompany;
const LM_BEARER_TOKEN = appConfig.lmBearerToken;
const ONLY_READONLY_TOOLS = appConfig.readOnly;

// Initialize LogicMonitor client and handlers (will fail at runtime if credentials missing)
let lmClient: LogicMonitorClient | null = null;
let lmHandlers: LogicMonitorHandlers | null = null;

if (LM_COMPANY && LM_BEARER_TOKEN) {
  lmClient = new LogicMonitorClient({
    company: LM_COMPANY,
    bearerToken: LM_BEARER_TOKEN,
  });
  lmHandlers = new LogicMonitorHandlers(lmClient);
  console.error('✅ LogicMonitor credentials configured');
} else {
  console.error('⚠️  Warning: LM_COMPANY and LM_BEARER_TOKEN not set');
  console.error('⚠️  Tools will be listed but will fail when executed');
  console.error('⚠️  Please set environment variables to use the tools');
}

// Create the MCP server instance
const server = new Server(
  {
    name: 'logicmonitor-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Get filtered tools based on ONLY_READONLY_TOOLS setting
let TOOLS = getLogicMonitorTools(ONLY_READONLY_TOOLS);

// Filter out search tools if disabled
if (appConfig.disableSearch) {
  const searchTools = ['search_resources', 'search_alerts', 'search_audit_logs'];
  const originalCount = TOOLS.length;
  TOOLS = TOOLS.filter(tool => !searchTools.includes(tool.name));
  console.error(`ℹ️  Search tools disabled: ${originalCount} -> ${TOOLS.length} tools`);
}

// Filter by enabled tools if specified
if (appConfig.enabledTools && appConfig.enabledTools.length > 0) {
  const originalCount = TOOLS.length;
  TOOLS = TOOLS.filter(tool => appConfig.enabledTools!.includes(tool.name));
  console.error(`ℹ️  Filtered tools by enabled tools list: ${originalCount} -> ${TOOLS.length} tools`);

  // Warn if no tools match
  if (TOOLS.length === 0) {
    console.error('⚠️  No tools match the enabled tools list! Check your MCP_ENABLED_TOOLS configuration.');
  }

  // Warn about unknown tools
  const knownToolNames = getLogicMonitorTools(ONLY_READONLY_TOOLS).map(t => t.name);
  const unknownTools = appConfig.enabledTools.filter(name => !knownToolNames.includes(name));
  if (unknownTools.length > 0) {
    console.error('⚠️  Unknown tools in enabled tools list:', unknownTools.join(', '));
  }
}

// Handle tool listing requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool execution requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    console.error(`[LogicMonitor MCP] Executing tool: ${name}`);

    if (!lmHandlers) {
      throw new Error('LogicMonitor credentials not configured. Please set LM_COMPANY and LM_BEARER_TOKEN environment variables.');
    }

    const result = await lmHandlers.handleToolCall(name, args || {});

    return {
      content: [
        {
          type: 'text',
          text: lmHandlers.formatResponse(result),
        },
      ],
    };
  } catch (error) {
    let errorResponse: any = {
      error: 'Unknown error occurred',
      tool: name,
    };

    if (error instanceof Error) {
      // Check if this error has LM API details attached
      const lmError = (error as any).lmError;
      if (lmError) {
        // Include full LM API error details
        errorResponse = {
          error: error.message,
          tool: name,
          details: lmError,
        };
        console.error(`[LogicMonitor MCP] LM API Error executing tool ${name}:`, lmError);
      } else {
        errorResponse.error = error.message;
        console.error(`[LogicMonitor MCP] Error executing tool ${name}:`, error.message);
      }
    } else {
      console.error(`[LogicMonitor MCP] Unknown error executing tool ${name}:`, error);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(errorResponse, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`LogicMonitor MCP Server v${SERVER_VERSION} running on stdio`);
  if (LM_COMPANY && LM_BEARER_TOKEN) {
    console.error(`Connected to LogicMonitor account: ${LM_COMPANY}`);
  }
  console.error(`Available tools: ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only mode)' : ''}`);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
