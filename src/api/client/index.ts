/**
 * LogicMonitor (LM) API Client.
 *
 * Composes the per-domain method classes onto a single `LogicMonitorClient`
 * via the TypeScript mixin (declaration-merging) pattern, preserving the
 * original flat public surface (e.g. `client.listResources(...)`).
 */

import { BaseClient, LogicMonitorConfig } from './base-client.js';
import { DevicesClient } from './devices.js';
import { DeviceGroupsClient } from './device-groups.js';
import { AlertsClient } from './alerts.js';
import { CollectorsClient } from './collectors.js';
import { DatasourcesClient } from './datasources.js';
import { InstancesClient } from './instances.js';
import { SdtClient } from './sdt.js';
import { DashboardsClient } from './dashboards.js';
import { ReportsClient } from './reports.js';
import { WebsitesClient } from './websites.js';
import { UsersClient } from './users.js';
import { ConfigsourcesClient } from './configsources.js';
import { AuditClient } from './audit.js';
import { AccessGroupsClient } from './access-groups.js';
import { EventsourcesClient } from './eventsources.js';
import { EscalationClient } from './escalation.js';
import { PropertyRulesClient } from './property-rules.js';
import { LogsourcesClient } from './logsources.js';
import { OpsnotesClient } from './opsnotes.js';
import { ServicesClient } from './services.js';
import { JobMonitorsClient } from './job-monitors.js';
import { DiagnosticsClient } from './diagnostics.js';
import { LogicmodulesClient } from './logicmodules.js';
import { TopologyClient } from './topology.js';
import { CloudClient } from './cloud.js';
import { IntegrationsClient } from './integrations.js';
import { MiscClient } from './misc.js';
import { NetscansClient } from './netscans.js';
import { CostOptimizationClient } from './cost-optimization.js';

export { escapeFilterValue } from './base-client.js';
export type { LogicMonitorConfig, LMResponse, LMListResponse } from './base-client.js';

export class LogicMonitorClient extends BaseClient {
  constructor(config: LogicMonitorConfig) {
    super(config);
  }
}

// Merge the domain method signatures into the public type.
export interface LogicMonitorClient extends DevicesClient, DeviceGroupsClient, AlertsClient, CollectorsClient, DatasourcesClient, InstancesClient, SdtClient, DashboardsClient, ReportsClient, WebsitesClient, UsersClient, ConfigsourcesClient, AuditClient, AccessGroupsClient, EventsourcesClient, EscalationClient, PropertyRulesClient, LogsourcesClient, OpsnotesClient, ServicesClient, JobMonitorsClient, DiagnosticsClient, LogicmodulesClient, TopologyClient, CloudClient, IntegrationsClient, MiscClient, NetscansClient, CostOptimizationClient {}

/**
 * Copy own prototype methods from each domain class onto the target.
 */
function applyMixins(target: any, sources: any[]): void {
  for (const source of sources) {
    for (const name of Object.getOwnPropertyNames(source.prototype)) {
      if (name === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(source.prototype, name);
      if (descriptor) {
        Object.defineProperty(target.prototype, name, descriptor);
      }
    }
  }
}

applyMixins(LogicMonitorClient, [
  DevicesClient,
  DeviceGroupsClient,
  AlertsClient,
  CollectorsClient,
  DatasourcesClient,
  InstancesClient,
  SdtClient,
  DashboardsClient,
  ReportsClient,
  WebsitesClient,
  UsersClient,
  ConfigsourcesClient,
  AuditClient,
  AccessGroupsClient,
  EventsourcesClient,
  EscalationClient,
  PropertyRulesClient,
  LogsourcesClient,
  OpsnotesClient,
  ServicesClient,
  JobMonitorsClient,
  DiagnosticsClient,
  LogicmodulesClient,
  TopologyClient,
  CloudClient,
  IntegrationsClient,
  MiscClient,
  NetscansClient,
  CostOptimizationClient,
]);
