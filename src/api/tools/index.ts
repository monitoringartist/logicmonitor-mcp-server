/**
 * LogicMonitor (LM) MCP tool definitions.
 *
 * Aggregates the per-domain tool arrays into a single registry and exposes
 * the public `getLogicMonitorTools` accessor. Splitting by domain keeps each
 * file reviewable; the combined order is irrelevant because the accessor
 * sorts by name.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { devicesTools } from './devices.js';
import { deviceGroupsTools } from './device-groups.js';
import { alertsTools } from './alerts.js';
import { collectorsTools } from './collectors.js';
import { datasourcesTools } from './datasources.js';
import { instancesTools } from './instances.js';
import { dashboardsTools } from './dashboards.js';
import { reportsTools } from './reports.js';
import { websitesTools } from './websites.js';
import { usersTools } from './users.js';
import { sdtTools } from './sdt.js';
import { configsourcesTools } from './configsources.js';
import { auditTools } from './audit.js';
import { accessGroupsTools } from './access-groups.js';
import { eventsourcesTools } from './eventsources.js';
import { escalationTools } from './escalation.js';
import { propertyRulesTools } from './property-rules.js';
import { logsourcesTools } from './logsources.js';
import { opsnotesTools } from './opsnotes.js';
import { servicesTools } from './services.js';
import { jobMonitorsTools } from './job-monitors.js';
import { diagnosticsTools } from './diagnostics.js';
import { logicmodulesTools } from './logicmodules.js';
import { topologyTools } from './topology.js';
import { cloudTools } from './cloud.js';
import { integrationsTools } from './integrations.js';
import { miscTools } from './misc.js';
import { netscansTools } from './netscans.js';
import { costOptimizationTools } from './cost-optimization.js';
import { applyToolParamAliases } from '../param-aliases.js';

const ALL_LOGICMONITOR_TOOLS: Tool[] = [
  ...devicesTools,
  ...deviceGroupsTools,
  ...alertsTools,
  ...collectorsTools,
  ...datasourcesTools,
  ...instancesTools,
  ...dashboardsTools,
  ...reportsTools,
  ...websitesTools,
  ...usersTools,
  ...sdtTools,
  ...configsourcesTools,
  ...auditTools,
  ...accessGroupsTools,
  ...eventsourcesTools,
  ...escalationTools,
  ...propertyRulesTools,
  ...logsourcesTools,
  ...opsnotesTools,
  ...servicesTools,
  ...jobMonitorsTools,
  ...diagnosticsTools,
  ...logicmodulesTools,
  ...topologyTools,
  ...cloudTools,
  ...integrationsTools,
  ...miscTools,
  ...netscansTools,
  ...costOptimizationTools,
];

// Make tools forgiving of common LM-native parameter-name variants
// (e.g. deviceGroupId -> groupId, hdsId -> deviceDataSourceId).
applyToolParamAliases(ALL_LOGICMONITOR_TOOLS);

/**
 * Get LogicMonitor tools, optionally filtered by read-only status
 * @param onlyReadOnly - If true, only return tools with readOnlyHint: true
 * @returns Array of Tool definitions sorted alphabetically by name
 */
export function getLogicMonitorTools(onlyReadOnly: boolean = false): Tool[] {
  const tools = onlyReadOnly
    ? ALL_LOGICMONITOR_TOOLS.filter(tool => {
      const readOnlyHint = tool.annotations?.readOnlyHint;
      return readOnlyHint === true;
    })
    : ALL_LOGICMONITOR_TOOLS;

  // Sort tools alphabetically by name
  return [...tools].sort((a, b) => a.name.localeCompare(b.name));
}
