/**
 * STDIO Transport Module
 *
 * Handles STDIO transport for local MCP connections (e.g., Claude Desktop, CLI tools)
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import { createServer } from './server.js';

export interface StdioConfig {
  version: string;
  lmCompany?: string;
  lmBearerToken?: string;
  readOnly: boolean;
  enabledTools?: string[];
}

/**
 * Starts the MCP server with STDIO transport
 */
export async function startStdioTransport(config: StdioConfig): Promise<void> {
  const { version, lmCompany, lmBearerToken, readOnly, enabledTools } = config;

  console.error('🚀 Starting LogicMonitor MCP Server in STDIO mode...');

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined;
  let lmHandlers: LogicMonitorHandlers | undefined;

  if (lmCompany && lmBearerToken) {
    lmClient = new LogicMonitorClient({
      company: lmCompany,
      bearerToken: lmBearerToken,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient);
    console.error('✅ LogicMonitor credentials configured');
  } else {
    console.error('⚠️  Warning: LM_COMPANY and LM_BEARER_TOKEN not set');
    console.error('⚠️  Tools will be listed but will fail when executed');
    console.error('⚠️  Please set environment variables to use the tools');
  }

  // Get filtered tools
  let tools: Tool[] = getLogicMonitorTools(readOnly);

  // Filter by enabled tools if specified
  if (enabledTools && enabledTools.length > 0) {
    const originalCount = tools.length;
    tools = tools.filter(tool => enabledTools.includes(tool.name));
    console.error(`ℹ️  Filtered tools by enabled tools list: ${originalCount} -> ${tools.length} tools`);

    if (tools.length === 0) {
      console.error('⚠️  No tools match the enabled tools list! Check your MCP_ENABLED_TOOLS configuration.');
    }

    const knownToolNames = getLogicMonitorTools(readOnly).map(t => t.name);
    const unknownTools = enabledTools.filter(name => !knownToolNames.includes(name));
    if (unknownTools.length > 0) {
      console.error('⚠️  Unknown tools in enabled tools list:', unknownTools.join(', '));
    }
  }

  // Create server instance using factory
  const { server } = createServer({
    version,
    tools,
    lmClient,
    lmHandlers,
  });

  console.error(`✅ Server initialized with ${tools.length} tools${readOnly ? ' (read-only mode)' : ''}`);

  // Connect to STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ MCP Server ready on STDIO');
  console.error('📡 Waiting for requests...');
}

