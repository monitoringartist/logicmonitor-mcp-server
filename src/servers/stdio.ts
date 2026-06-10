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
import { buildCollapsedTools } from '../api/tools/collapse.js';
import { createServer } from './server.js';

export interface StdioConfig {
  version: string;
  lmCompany?: string;
  lmBearerToken?: string;
  readOnly: boolean;
  enabledTools?: string[];
  collapseToolsLevel1?: boolean;
  collapseToolsLevel2?: boolean;
}

/**
 * Starts the MCP server with STDIO transport
 */
export async function startStdioTransport(config: StdioConfig): Promise<void> {
  const { version, lmCompany, lmBearerToken, readOnly, enabledTools, collapseToolsLevel1, collapseToolsLevel2 } = config;

  console.error('🚀 Starting LogicMonitor MCP Server in STDIO mode...');

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined;
  let lmHandlers: LogicMonitorHandlers | undefined;

  if (lmCompany && lmBearerToken) {
    lmClient = new LogicMonitorClient({
      company: lmCompany,
      bearerToken: lmBearerToken,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient, { collapseToolsLevel1, collapseToolsLevel2, readOnly });
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

  // Collapse per-verb tools into manage_<resource> tools if enabled
  if (collapseToolsLevel1) {
    const beforeCount = tools.length;
    tools = buildCollapsedTools(tools, { level2: collapseToolsLevel2 }).tools;
    const levelLabel = collapseToolsLevel2 ? 'level 1+2' : 'level 1';
    console.error(`ℹ️  Collapsed tools (${levelLabel}): ${beforeCount} -> ${tools.length} tools`);
  }

  // Create server instance using factory
  const { server, cleanup } = createServer({
    version,
    tools,
    lmClient,
    lmHandlers,
  });

  console.error(`✅ Server initialized with ${tools.length} tools${readOnly ? ' (read-only mode)' : ''}`);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.error('\n🛑 Received SIGINT, shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('\n🛑 Received SIGTERM, shutting down gracefully...');
    await cleanup();
    process.exit(0);
  });

  // Connect to STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('✅ MCP Server ready on STDIO');
  console.error('📡 Waiting for requests...');
}

