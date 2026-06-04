/**
 * LogicMonitor (LM) MCP tool handlers.
 *
 * Each tool is registered in a flat `name -> handler` registry, merged from the
 * per-domain registry objects under `./`. Dispatch is an O(1) lookup. This
 * module preserves the public `LogicMonitorHandlers` surface (`handleToolCall`,
 * `formatResponse`, `handleCompletion`) and additionally exposes `hasHandler`
 * and `getRegisteredToolNames` for implementation/drift checks.
 */

import { LogicMonitorClient } from '../client.js';
import { MCPError, ErrorCodes } from '../../utils/core/error-handler.js';
import { ToolHandlerMap, validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';
import { devicesToolHandlers } from './devices.js';
import { deviceGroupsToolHandlers } from './device-groups.js';
import { alertsToolHandlers } from './alerts.js';
import { collectorsToolHandlers } from './collectors.js';
import { datasourcesToolHandlers } from './datasources.js';
import { instancesToolHandlers } from './instances.js';
import { dashboardsToolHandlers } from './dashboards.js';
import { reportsToolHandlers } from './reports.js';
import { websitesToolHandlers } from './websites.js';
import { usersToolHandlers } from './users.js';
import { sdtToolHandlers } from './sdt.js';
import { configsourcesToolHandlers } from './configsources.js';
import { auditToolHandlers } from './audit.js';
import { accessGroupsToolHandlers } from './access-groups.js';
import { eventsourcesToolHandlers } from './eventsources.js';
import { escalationToolHandlers } from './escalation.js';
import { propertyRulesToolHandlers } from './property-rules.js';
import { logsourcesToolHandlers } from './logsources.js';
import { opsnotesToolHandlers } from './opsnotes.js';
import { servicesToolHandlers } from './services.js';
import { jobMonitorsToolHandlers } from './job-monitors.js';
import { diagnosticsToolHandlers } from './diagnostics.js';
import { logicmodulesToolHandlers } from './logicmodules.js';
import { topologyToolHandlers } from './topology.js';
import { cloudToolHandlers } from './cloud.js';
import { integrationsToolHandlers } from './integrations.js';
import { miscToolHandlers } from './misc.js';
import { netscansToolHandlers } from './netscans.js';
import { costOptimizationToolHandlers } from './cost-optimization.js';

/**
 * The complete tool registry: every tool name maps to exactly one handler.
 * Domain maps are merged; tool names are unique across domains.
 */
const TOOL_REGISTRY: ToolHandlerMap = {
  ...devicesToolHandlers,
  ...deviceGroupsToolHandlers,
  ...alertsToolHandlers,
  ...collectorsToolHandlers,
  ...datasourcesToolHandlers,
  ...instancesToolHandlers,
  ...dashboardsToolHandlers,
  ...reportsToolHandlers,
  ...websitesToolHandlers,
  ...usersToolHandlers,
  ...sdtToolHandlers,
  ...configsourcesToolHandlers,
  ...auditToolHandlers,
  ...accessGroupsToolHandlers,
  ...eventsourcesToolHandlers,
  ...escalationToolHandlers,
  ...propertyRulesToolHandlers,
  ...logsourcesToolHandlers,
  ...opsnotesToolHandlers,
  ...servicesToolHandlers,
  ...jobMonitorsToolHandlers,
  ...diagnosticsToolHandlers,
  ...logicmodulesToolHandlers,
  ...topologyToolHandlers,
  ...cloudToolHandlers,
  ...integrationsToolHandlers,
  ...miscToolHandlers,
  ...netscansToolHandlers,
  ...costOptimizationToolHandlers,
};

/** Names of all tools that have a registered handler. */
export function getRegisteredToolNames(): string[] {
  return Object.keys(TOOL_REGISTRY);
}

export class LogicMonitorHandlers {
  private client: LogicMonitorClient;

  constructor(client: LogicMonitorClient) {
    this.client = client;
  }

  /** Whether a handler is registered for the given tool name. */
  hasHandler(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(TOOL_REGISTRY, name);
  }

  async handleToolCall(
    name: string,
    args: any,
    progressCallback?: ProgressCallback,
  ): Promise<any> {
    const handler = TOOL_REGISTRY[name];
    if (!handler) {
      throw new MCPError(
        `Unknown tool: ${name}`,
        ErrorCodes.INVALID_PARAMETERS,
        { toolName: name },
        [
          'Check the tool name spelling',
          'Run list_tools to see available tools',
          'Verify you are using a supported tool version',
        ],
      );
    }
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);
      return await handler({ client: this.client, args, progressCallback });
    } catch (error) {
      handleToolError(error, name);
    }
  }

  formatResponse(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Handles completion requests for prompt arguments
   *
   * @param ref Reference to the prompt or resource
   * @param argument The argument being completed
   * @returns Completion suggestions
   */
  async handleCompletion(
    ref: { type: string; name?: string; uri?: string },
    argument: { name: string; value: string },
  ): Promise<{ values: string[]; total?: number; hasMore?: boolean }> {
    // Only support prompt completions for now
    if (ref.type === 'ref/prompt' && ref.name === 'resource_check') {
      // Only support resourceName argument
      if (argument.name === 'resourceName') {
        const searchValue = argument.value || '';

        // Build OR filter to search across name, displayName, and IP
        // Using OR (||) to find resources matching any of these fields
        let filter = '';
        if (searchValue) {
          const filters = [
            `name~"${searchValue}"`,
            `displayName~"${searchValue}"`,
            `name:"${searchValue}"`, // Exact IP match
          ];
          filter = filters.join('||');
        }

        try {
          // Search for resources with a limit of 100 (max per MCP spec)
          const result = await this.client.listResources({
            size: 100,
            offset: 0,
            filter,
            fields: 'displayName,name', // Only need displayName and name
          });

          const items = result.items || [];
          const total = result.total || items.length;

          // Extract displayNames for completion suggestions
          const values = items
            .map((item: any) => item.displayName || item.name)
            .filter((name: string) => name); // Remove any null/undefined

          return {
            values,
            total,
            hasMore: total > values.length,
          };
        } catch (error) {
          // On error, return empty suggestions
          console.error('[LogicMonitor MCP] Completion error:', error);
          return {
            values: [],
            total: 0,
            hasMore: false,
          };
        }
      }
    }

    // Unsupported completion - return empty
    return {
      values: [],
      total: 0,
      hasMore: false,
    };
  }
}
