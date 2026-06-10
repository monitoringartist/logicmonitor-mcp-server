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
import { normalizeToolArgs } from '../param-aliases.js';
import { getLogicMonitorTools } from '../tools.js';
import {
  buildCollapsedTools,
  type CollapseResult,
  type CollapsedToolRoute,
} from '../tools/collapse.js';
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

/** Options controlling how tool calls are dispatched. */
export interface LogicMonitorHandlerOptions {
  /**
   * When true, accept collapsed `manage_<resource>` tool calls (routing the
   * `operation` parameter to the underlying per-verb handler) and reject the
   * original per-verb names that were collapsed away.
   */
  collapseToolsLevel1?: boolean;
  /**
   * When true (and level 1 is enabled), also route leaf tools that were folded
   * into a parent `manage_<resource>` tool as extra operations.
   */
  collapseToolsLevel2?: boolean;
  /**
   * When true, write operations on collapsed tools are rejected at call time.
   * Mirrors the read-only filtering applied to the advertised tool list.
   */
  readOnly?: boolean;
}

export class LogicMonitorHandlers {
  private client: LogicMonitorClient;
  private options: LogicMonitorHandlerOptions;
  private collapsePlan?: CollapseResult;

  constructor(client: LogicMonitorClient, options: LogicMonitorHandlerOptions = {}) {
    this.client = client;
    this.options = options;
  }

  /** Whether a handler is registered for the given tool name. */
  hasHandler(name: string): boolean {
    return Object.prototype.hasOwnProperty.call(TOOL_REGISTRY, name);
  }

  /**
   * Lazily build (and cache) the collapse plan from the full tool set. The full
   * set is used so write operations are known even in read-only mode, which lets
   * us return an accurate "disabled in read-only mode" error instead of a vague
   * "unknown operation" one.
   */
  private getCollapsePlan(): CollapseResult {
    if (!this.collapsePlan) {
      this.collapsePlan = buildCollapsedTools(getLogicMonitorTools(false), {
        level2: this.options.collapseToolsLevel2 === true,
      });
    }
    return this.collapsePlan;
  }

  /**
   * Resolve a collapsed `manage_<resource>` call to the underlying per-verb tool
   * name and arguments, validating the operation, read-only mode, and required
   * parameters. Throws an MCPError on any violation.
   */
  private resolveCollapsedCall(
    manageName: string,
    route: CollapsedToolRoute,
    args: any,
  ): { toolName: string; args: any } {
    const availableOps = Array.from(route.operations.keys());
    const operation = args?.operation;

    if (!operation || typeof operation !== 'string') {
      throw new MCPError(
        `The "${manageName}" tool requires an "operation" parameter. Available operations: ${availableOps.join(', ')}.`,
        ErrorCodes.MISSING_REQUIRED_FIELD,
        { tool: manageName, availableOperations: availableOps },
        [`Set "operation" to one of: ${availableOps.join(', ')}`],
      );
    }

    const entry = route.operations.get(operation as any);
    if (!entry) {
      throw new MCPError(
        `Unknown operation "${operation}" for "${manageName}". Available operations: ${availableOps.join(', ')}.`,
        ErrorCodes.INVALID_PARAMETERS,
        { tool: manageName, operation, availableOperations: availableOps },
        [`Use one of the available operations: ${availableOps.join(', ')}`],
      );
    }

    if (this.options.readOnly && !entry.readOnly) {
      const readOps = Array.from(route.operations.entries())
        .filter(([, opRoute]) => opRoute.readOnly)
        .map(([op]) => op);
      throw new MCPError(
        `Operation "${operation}" on "${manageName}" modifies data and is disabled in read-only mode.`,
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
        { tool: manageName, operation },
        [
          'Set MCP_READ_ONLY=false (or remove --read-only) to enable write operations',
          readOps.length > 0
            ? `Use a read operation instead, e.g. one of: ${readOps.join(', ')}`
            : 'No read operations are available on this tool',
        ],
      );
    }

    const isPresent = (field: string): boolean => {
      const value = args?.[field];
      return value !== undefined && value !== null;
    };
    const missingGroups = entry.requiredGroups.filter(group => !group.some(isPresent));
    if (missingGroups.length > 0) {
      const missingStr = missingGroups
        .map(group => (group.length === 1 ? group[0] : `(${group.join(' or ')})`))
        .join(', ');
      throw new MCPError(
        `Operation "${operation}" on "${manageName}" requires: ${missingStr}.`,
        ErrorCodes.MISSING_REQUIRED_FIELD,
        { tool: manageName, operation, missing: missingGroups },
        [`Provide the required parameters: ${missingStr}`],
      );
    }

    const forwardedArgs = { ...(args ?? {}) };
    delete forwardedArgs.operation;
    return { toolName: entry.toolName, args: forwardedArgs };
  }

  async handleToolCall(
    name: string,
    args: any,
    progressCallback?: ProgressCallback,
  ): Promise<any> {
    let toolName = name;
    let toolArgs = args;

    // When tool collapsing is enabled, route collapsed `manage_<resource>` calls
    // to the underlying per-verb handler, and reject the original names that were
    // collapsed away (pointing the caller at the replacement).
    if (this.options.collapseToolsLevel1) {
      const plan = this.getCollapsePlan();
      const route = plan.routes.get(toolName);
      if (route) {
        const resolved = this.resolveCollapsedCall(toolName, route, toolArgs);
        toolName = resolved.toolName;
        toolArgs = resolved.args;
      } else {
        const replacement = plan.consumed.get(toolName);
        if (replacement) {
          throw new MCPError(
            `Tool "${toolName}" is not available when tool collapsing is enabled. Use "${replacement.manageName}" with operation="${replacement.operation}" instead.`,
            ErrorCodes.INVALID_PARAMETERS,
            { toolName, manageTool: replacement.manageName, operation: replacement.operation },
            [
              `Call "${replacement.manageName}" with { "operation": "${replacement.operation}", ... }`,
              'See the tool list for the consolidated manage_<resource> tools',
            ],
          );
        }
      }
    }

    const handler = TOOL_REGISTRY[toolName];
    if (!handler) {
      throw new MCPError(
        `Unknown tool: ${toolName}`,
        ErrorCodes.INVALID_PARAMETERS,
        { toolName },
        [
          'Check the tool name spelling',
          'Run list_tools to see available tools',
          'Verify you are using a supported tool version',
        ],
      );
    }
    try {
      // Map common parameter-name aliases (e.g. deviceGroupId -> groupId) onto the
      // canonical names that handlers read.
      const normalizedArgs = normalizeToolArgs(toolName, toolArgs);
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(toolName, normalizedArgs?.fields);
      return await handler({ client: this.client, args: normalizedArgs, progressCallback });
    } catch (error) {
      handleToolError(error, toolName);
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
