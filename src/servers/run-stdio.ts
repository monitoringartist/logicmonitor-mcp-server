/**
 * STDIO transport runner for the LogicMonitor (LM) MCP server.
 *
 * Extracted from the unified entry point; `index.ts` calls `runStdio` when the
 * configured transport is "stdio".
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LogicMonitorClient } from '../api/client.js';
import { LogicMonitorHandlers } from '../api/handlers.js';
import { getLogicMonitorTools } from '../api/tools.js';
import { buildCollapsedTools } from '../api/tools/collapse.js';
import { createServer } from './server.js';
import { ServerConfig } from '../utils/core/cli-config.js';

export function runStdio(appConfig: ServerConfig, version: string): void {
  const SERVER_VERSION = version;
  const LM_COMPANY = appConfig.lmCompany;
  const LM_BEARER_TOKEN = appConfig.lmBearerToken;
  const ONLY_READONLY_TOOLS = appConfig.readOnly;

  // STDIO mode: Simple local transport (no authentication needed)
  console.error('🚀 Starting LogicMonitor MCP Server in STDIO mode...');

  // Initialize LogicMonitor client and handlers
  let lmClient: LogicMonitorClient | undefined = undefined;
  let lmHandlers: LogicMonitorHandlers | undefined = undefined;

  if (LM_COMPANY && LM_BEARER_TOKEN) {
    lmClient = new LogicMonitorClient({
      company: LM_COMPANY,
      bearerToken: LM_BEARER_TOKEN,
    });
    lmHandlers = new LogicMonitorHandlers(lmClient, {
      collapseToolsLevel1: appConfig.collapseToolsLevel1,
      collapseToolsLevel2: appConfig.collapseToolsLevel2,
      readOnly: ONLY_READONLY_TOOLS,
    });
    console.error('✅ LogicMonitor credentials configured');
  } else {
    console.error('⚠️  Warning: LM_COMPANY and LM_BEARER_TOKEN not set');
    console.error('⚠️  Tools will be listed but will fail when executed');
    console.error('⚠️  Please set environment variables to use the tools');
  }

  // Get filtered tools
  let TOOLS = getLogicMonitorTools(ONLY_READONLY_TOOLS);

  // Filter by enabled tools if specified
  if (appConfig.enabledTools && appConfig.enabledTools.length > 0) {
    const originalCount = TOOLS.length;
    TOOLS = TOOLS.filter(tool => appConfig.enabledTools!.includes(tool.name));
    console.error(`ℹ️  Filtered tools by enabled tools list: ${originalCount} -> ${TOOLS.length} tools`);

    if (TOOLS.length === 0) {
      console.error('⚠️  No tools match the enabled tools list! Check your MCP_ENABLED_TOOLS configuration.');
    }

    const knownToolNames = getLogicMonitorTools(ONLY_READONLY_TOOLS).map(t => t.name);
    const unknownTools = appConfig.enabledTools.filter(name => !knownToolNames.includes(name));
    if (unknownTools.length > 0) {
      console.error('⚠️  Unknown tools in enabled tools list:', unknownTools.join(', '));
    }
  }

  // Collapse per-verb tools into manage_<resource> tools if enabled
  if (appConfig.collapseToolsLevel1) {
    const beforeCount = TOOLS.length;
    TOOLS = buildCollapsedTools(TOOLS, { level2: appConfig.collapseToolsLevel2 }).tools;
    const levelLabel = appConfig.collapseToolsLevel2 ? 'level 1+2' : 'level 1';
    console.error(`ℹ️  Collapsed tools (${levelLabel}): ${beforeCount} -> ${TOOLS.length} tools`);
  }

  // Create server instance using factory pattern
  const { server, cleanup, startNotificationIntervals } = createServer({
    version: SERVER_VERSION,
    tools: TOOLS,
    lmClient,
    lmHandlers,
    enablePeriodicUpdates: false, // Disable periodic updates for STDIO
  });

  // Start the STDIO server
  async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Start notification intervals if enabled
    if (startNotificationIntervals) {
      startNotificationIntervals();
    }

    console.error(`LogicMonitor MCP Server v${SERVER_VERSION} running on stdio`);
    if (LM_COMPANY && LM_BEARER_TOKEN) {
      console.error(`LogicMonitor credentials configured for company: ${LM_COMPANY}`);
    }
    console.error(`Available tools: ${TOOLS.length}${ONLY_READONLY_TOOLS ? ' (read-only mode)' : ''}`);
  }

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

  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
