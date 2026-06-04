/**
 * LogicMonitor (LM) MCP tool handlers.
 *
 * Routes each tool call to its per-domain handler. The implementation is split
 * by domain under `./`; this module preserves the public `LogicMonitorHandlers`
 * surface (`handleToolCall`, `formatResponse`, `handleCompletion`).
 */

import { LogicMonitorClient } from '../client.js';
import { MCPError, ErrorCodes } from '../../utils/core/error-handler.js';
import type { ProgressCallback } from './shared.js';
import { DevicesHandlers } from './devices.js';
import { DeviceGroupsHandlers } from './device-groups.js';
import { AlertsHandlers } from './alerts.js';
import { CollectorsHandlers } from './collectors.js';
import { DatasourcesHandlers } from './datasources.js';
import { InstancesHandlers } from './instances.js';
import { DashboardsHandlers } from './dashboards.js';
import { ReportsHandlers } from './reports.js';
import { WebsitesHandlers } from './websites.js';
import { UsersHandlers } from './users.js';
import { SdtHandlers } from './sdt.js';
import { ConfigsourcesHandlers } from './configsources.js';
import { AuditHandlers } from './audit.js';
import { AccessGroupsHandlers } from './access-groups.js';
import { EventsourcesHandlers } from './eventsources.js';
import { EscalationHandlers } from './escalation.js';
import { PropertyRulesHandlers } from './property-rules.js';
import { LogsourcesHandlers } from './logsources.js';
import { OpsnotesHandlers } from './opsnotes.js';
import { ServicesHandlers } from './services.js';
import { JobMonitorsHandlers } from './job-monitors.js';
import { DiagnosticsHandlers } from './diagnostics.js';
import { LogicmodulesHandlers } from './logicmodules.js';
import { TopologyHandlers } from './topology.js';
import { CloudHandlers } from './cloud.js';
import { IntegrationsHandlers } from './integrations.js';
import { MiscHandlers } from './misc.js';
import { NetscansHandlers } from './netscans.js';
import { CostOptimizationHandlers } from './cost-optimization.js';

interface DomainHandler {
  handle(name: string, args: any, progressCallback?: ProgressCallback): Promise<any>;
}

// Maps each tool name to the domain handler that implements it.
const TOOL_DOMAINS: Record<string, string> = {
  'list_resources': 'devices',
  'get_resource': 'devices',
  'create_resource': 'devices',
  'update_resource': 'devices',
  'delete_resource': 'devices',
  'list_resource_properties': 'devices',
  'update_resource_property': 'devices',
  'create_resource_property': 'devices',
  'delete_resource_property': 'devices',
  'list_resource_alert_settings': 'devices',
  'list_instance_alert_settings': 'devices',
  'get_instance_alert_setting': 'devices',
  'update_instance_alert_setting': 'devices',
  'list_resource_instance_configs': 'devices',
  'get_resource_instance_config': 'devices',
  'collect_resource_instance_config': 'devices',
  'list_resource_netflow_flows': 'devices',
  'list_resource_netflow_ports': 'devices',
  'list_resource_netflow_endpoints': 'devices',
  'get_resource_top_talkers_graph': 'devices',
  'list_resource_alerts': 'devices',
  'list_resource_eventsources': 'devices',
  'schedule_resource_auto_discovery': 'devices',
  'get_resources_delta_id': 'devices',
  'get_resources_delta': 'devices',
  'list_unmonitored_devices': 'devices',
  'list_resource_groups': 'deviceGroups',
  'get_resource_group': 'deviceGroups',
  'create_resource_group': 'deviceGroups',
  'update_resource_group': 'deviceGroups',
  'delete_resource_group': 'deviceGroups',
  'list_resource_group_properties': 'deviceGroups',
  'update_resource_group_property': 'deviceGroups',
  'create_resource_group_property': 'deviceGroups',
  'delete_resource_group_property': 'deviceGroups',
  'list_resource_group_cluster_alert_confs': 'deviceGroups',
  'get_resource_group_cluster_alert_conf': 'deviceGroups',
  'create_resource_group_cluster_alert_conf': 'deviceGroups',
  'update_resource_group_cluster_alert_conf': 'deviceGroups',
  'delete_resource_group_cluster_alert_conf': 'deviceGroups',
  'list_resource_group_datasources': 'deviceGroups',
  'get_resource_group_datasource': 'deviceGroups',
  'update_resource_group_datasource': 'deviceGroups',
  'get_resource_group_datasource_alert_setting': 'deviceGroups',
  'update_resource_group_datasource_alert_setting': 'deviceGroups',
  'list_resource_group_alerts': 'deviceGroups',
  'list_resource_group_sdts': 'deviceGroups',
  'get_resource_group_sdt_history': 'deviceGroups',
  'list_alerts': 'alerts',
  'get_alert': 'alerts',
  'acknowledge_alert': 'alerts',
  'add_alert_note': 'alerts',
  'list_alert_rules': 'alerts',
  'get_alert_rule': 'alerts',
  'create_alert_rule': 'alerts',
  'update_alert_rule': 'alerts',
  'delete_alert_rule': 'alerts',
  'list_action_chains': 'alerts',
  'get_action_chain': 'alerts',
  'create_action_chain': 'alerts',
  'update_action_chain': 'alerts',
  'delete_action_chain': 'alerts',
  'list_action_rules': 'alerts',
  'get_action_rule': 'alerts',
  'create_action_rule': 'alerts',
  'update_action_rule': 'alerts',
  'delete_action_rule': 'alerts',
  'set_action_rule_status': 'alerts',
  'escalate_alert': 'alerts',
  'list_collectors': 'collectors',
  'get_collector': 'collectors',
  'create_collector': 'collectors',
  'update_collector': 'collectors',
  'delete_collector': 'collectors',
  'get_collector_installer': 'collectors',
  'acknowledge_collector_down_alert': 'collectors',
  'execute_debug_command': 'collectors',
  'get_debug_command_result': 'collectors',
  'list_collector_groups': 'collectors',
  'get_collector_group': 'collectors',
  'create_collector_group': 'collectors',
  'update_collector_group': 'collectors',
  'delete_collector_group': 'collectors',
  'list_collector_agent_log_levels': 'collectors',
  'get_collector_agent_log_level': 'collectors',
  'update_collector_agent_log_level': 'collectors',
  'get_collector_events': 'collectors',
  'get_collector_status_check': 'collectors',
  'list_collector_versions': 'collectors',
  'list_datasources': 'datasources',
  'get_datasource': 'datasources',
  'create_datasource': 'datasources',
  'update_datasource': 'datasources',
  'delete_datasource': 'datasources',
  'import_datasource': 'datasources',
  'list_datasource_overview_graphs': 'datasources',
  'get_datasource_overview_graph': 'datasources',
  'list_datasource_devices': 'datasources',
  'list_datasource_update_reasons': 'datasources',
  'list_resource_datasources': 'datasources',
  'get_resource_datasource': 'datasources',
  'update_resource_datasource': 'datasources',
  'list_resource_instances': 'instances',
  'get_resource_instance_data': 'instances',
  'create_resource_instance': 'instances',
  'update_resource_instance': 'instances',
  'delete_resource_instance': 'instances',
  'get_instance_graph_data': 'instances',
  'get_resource_datasource_data': 'instances',
  'list_resource_instance_groups': 'instances',
  'get_resource_instance_group': 'instances',
  'create_resource_instance_group': 'instances',
  'update_resource_instance_group': 'instances',
  'update_instance_group_alert_threshold': 'instances',
  'get_instance_group_overview_graph_data': 'instances',
  'fetch_instances_data': 'instances',
  'get_instance_graph_data_by_id': 'instances',
  'get_metrics_summary': 'instances',
  'get_metrics_usage': 'instances',
  'list_dashboards': 'dashboards',
  'get_dashboard': 'dashboards',
  'create_dashboard': 'dashboards',
  'update_dashboard': 'dashboards',
  'delete_dashboard': 'dashboards',
  'generate_dashboard_link': 'dashboards',
  'generate_resource_link': 'dashboards',
  'generate_alert_link': 'dashboards',
  'generate_website_link': 'dashboards',
  'list_dashboard_groups': 'dashboards',
  'get_dashboard_group': 'dashboards',
  'create_dashboard_group': 'dashboards',
  'update_dashboard_group': 'dashboards',
  'delete_dashboard_group': 'dashboards',
  'clone_dashboard_group': 'dashboards',
  'update_default_dashboard': 'dashboards',
  'list_widgets': 'dashboards',
  'list_dashboard_widgets': 'dashboards',
  'get_widget': 'dashboards',
  'get_widget_data': 'dashboards',
  'create_widget': 'dashboards',
  'update_widget': 'dashboards',
  'delete_widget': 'dashboards',
  'list_reports': 'reports',
  'get_report': 'reports',
  'create_report': 'reports',
  'update_report': 'reports',
  'delete_report': 'reports',
  'generate_report': 'reports',
  'get_report_task_result': 'reports',
  'list_report_groups': 'reports',
  'get_report_group': 'reports',
  'create_report_group': 'reports',
  'update_report_group': 'reports',
  'delete_report_group': 'reports',
  'list_websites': 'websites',
  'get_website': 'websites',
  'create_website': 'websites',
  'update_website': 'websites',
  'delete_website': 'websites',
  'list_website_groups': 'websites',
  'get_website_group': 'websites',
  'create_website_group': 'websites',
  'update_website_group': 'websites',
  'delete_website_group': 'websites',
  'list_website_group_websites': 'websites',
  'list_website_group_sdts': 'websites',
  'get_website_group_sdt_history': 'websites',
  'get_website_sdt_history': 'websites',
  'get_website_graph_by_name': 'websites',
  'list_website_checkpoints': 'websites',
  'get_website_checkpoint_data': 'websites',
  'get_website_graph_data': 'websites',
  'list_users': 'users',
  'get_user': 'users',
  'list_roles': 'users',
  'get_role': 'users',
  'create_role': 'users',
  'update_role': 'users',
  'delete_role': 'users',
  'list_api_tokens': 'users',
  'create_user': 'users',
  'update_user': 'users',
  'delete_user': 'users',
  'create_api_token': 'users',
  'update_api_token': 'users',
  'delete_api_token': 'users',
  'get_external_api_stats': 'users',
  'list_sdts': 'sdt',
  'get_sdt': 'sdt',
  'create_resource_sdt': 'sdt',
  'create_sdt': 'sdt',
  'update_sdt': 'sdt',
  'delete_sdt': 'sdt',
  'get_resource_sdt_history': 'sdt',
  'get_resource_datasource_sdt_history': 'sdt',
  'get_instance_sdt_history': 'sdt',
  'list_configsources': 'configsources',
  'get_configsource': 'configsources',
  'create_configsource': 'configsources',
  'update_configsource': 'configsources',
  'delete_configsource': 'configsources',
  'import_configsource': 'configsources',
  'get_configsource_update_reasons': 'configsources',
  'list_audit_logs': 'audit',
  'get_audit_log': 'audit',
  'list_access_groups': 'accessGroups',
  'get_access_group': 'accessGroups',
  'create_access_group': 'accessGroups',
  'update_access_group': 'accessGroups',
  'delete_access_group': 'accessGroups',
  'map_unmap_module_to_access_group': 'accessGroups',
  'list_eventsources': 'eventsources',
  'get_eventsource': 'eventsources',
  'create_eventsource': 'eventsources',
  'update_eventsource': 'eventsources',
  'delete_eventsource': 'eventsources',
  'import_eventsource': 'eventsources',
  'list_escalation_chains': 'escalation',
  'get_escalation_chain': 'escalation',
  'create_escalation_chain': 'escalation',
  'update_escalation_chain': 'escalation',
  'delete_escalation_chain': 'escalation',
  'list_recipients': 'escalation',
  'get_recipient': 'escalation',
  'create_recipient': 'escalation',
  'update_recipient': 'escalation',
  'delete_recipient': 'escalation',
  'list_recipient_groups': 'escalation',
  'get_recipient_group': 'escalation',
  'create_recipient_group': 'escalation',
  'update_recipient_group': 'escalation',
  'delete_recipient_group': 'escalation',
  'list_property_rules': 'propertyRules',
  'get_property_rule': 'propertyRules',
  'create_property_rule': 'propertyRules',
  'update_property_rule': 'propertyRules',
  'delete_property_rule': 'propertyRules',
  'import_property_rule': 'propertyRules',
  'list_logsources': 'logsources',
  'get_logsource': 'logsources',
  'create_logsource': 'logsources',
  'update_logsource': 'logsources',
  'delete_logsource': 'logsources',
  'import_logsource': 'logsources',
  'list_log_alert_groups': 'logsources',
  'get_log_alert_group': 'logsources',
  'create_log_alert_group': 'logsources',
  'update_log_alert_group': 'logsources',
  'delete_log_alert_group': 'logsources',
  'list_log_alerts': 'logsources',
  'get_log_alert': 'logsources',
  'create_log_alert': 'logsources',
  'update_log_alert': 'logsources',
  'delete_log_alert': 'logsources',
  'set_log_alert_status': 'logsources',
  'list_log_query_groups': 'logsources',
  'get_log_query_group': 'logsources',
  'create_log_query_group': 'logsources',
  'update_log_query_group': 'logsources',
  'delete_log_query_group': 'logsources',
  'list_log_query_group_queries': 'logsources',
  'list_log_query_groups_by_type': 'logsources',
  'move_log_queries': 'logsources',
  'list_log_partitions': 'logsources',
  'get_log_partition': 'logsources',
  'create_log_partition': 'logsources',
  'update_log_partition': 'logsources',
  'delete_log_partition': 'logsources',
  'get_log_partition_retentions': 'logsources',
  'log_partition_action': 'logsources',
  'list_tracked_query_groups': 'logsources',
  'get_tracked_query_group': 'logsources',
  'create_tracked_query_group': 'logsources',
  'update_tracked_query_group': 'logsources',
  'delete_tracked_query_group': 'logsources',
  'list_opsnotes': 'opsnotes',
  'get_opsnote': 'opsnotes',
  'create_opsnote': 'opsnotes',
  'update_opsnote': 'opsnotes',
  'delete_opsnote': 'opsnotes',
  'list_services': 'services',
  'get_service': 'services',
  'create_service': 'services',
  'update_service': 'services',
  'delete_service': 'services',
  'list_service_groups': 'services',
  'get_service_group': 'services',
  'create_service_group': 'services',
  'update_service_group': 'services',
  'delete_service_group': 'services',
  'list_job_monitors': 'jobMonitors',
  'get_job_monitor': 'jobMonitors',
  'create_job_monitor': 'jobMonitors',
  'update_job_monitor': 'jobMonitors',
  'delete_job_monitor': 'jobMonitors',
  'import_job_monitor': 'jobMonitors',
  'list_diagnosticsources': 'diagnostics',
  'get_diagnosticsource': 'diagnostics',
  'create_diagnosticsource': 'diagnostics',
  'update_diagnosticsource': 'diagnostics',
  'delete_diagnosticsource': 'diagnostics',
  'import_diagnosticsource': 'diagnostics',
  'execute_diagnosticsource': 'diagnostics',
  'list_remediationsources': 'diagnostics',
  'get_remediationsource': 'diagnostics',
  'create_remediationsource': 'diagnostics',
  'update_remediationsource': 'diagnostics',
  'delete_remediationsource': 'diagnostics',
  'execute_remediation': 'diagnostics',
  'get_diagnostic_remediation_sources': 'diagnostics',
  'get_diagnostic_remediation_results': 'diagnostics',
  'list_applies_to_functions': 'logicmodules',
  'get_applies_to_function': 'logicmodules',
  'create_applies_to_function': 'logicmodules',
  'update_applies_to_function': 'logicmodules',
  'delete_applies_to_function': 'logicmodules',
  'import_applies_to_function': 'logicmodules',
  'list_oids': 'logicmodules',
  'get_oid': 'logicmodules',
  'create_oid': 'logicmodules',
  'update_oid': 'logicmodules',
  'delete_oid': 'logicmodules',
  'import_oid': 'logicmodules',
  'get_logicmodule_metadata': 'logicmodules',
  'list_topologysources': 'topology',
  'get_topologysource': 'topology',
  'create_topologysource': 'topology',
  'update_topologysource': 'topology',
  'delete_topologysource': 'topology',
  'import_topologysource': 'topology',
  'get_topology': 'topology',
  'get_aws_account_id': 'cloud',
  'get_aws_external_id': 'cloud',
  'test_aws_account': 'cloud',
  'verify_aws_billing_permissions': 'cloud',
  'discover_azure_subscriptions': 'cloud',
  'test_azure_account': 'cloud',
  'verify_azure_storage_permissions': 'cloud',
  'test_gcp_account': 'cloud',
  'test_saas_account': 'cloud',
  'get_integration_audit_logs': 'integrations',
  'list_integrations': 'integrations',
  'get_integration': 'integrations',
  'create_integration': 'integrations',
  'update_integration': 'integrations',
  'delete_integration': 'integrations',
  'get_contract_info': 'misc',
  'add_dns_mapping': 'misc',
  'list_netscans': 'netscans',
  'get_netscan': 'netscans',
  'create_netscan': 'netscans',
  'update_netscan': 'netscans',
  'delete_netscan': 'netscans',
  'list_cost_optimization_recommendations': 'costOptimization',
  'get_cost_optimization_recommendation': 'costOptimization',
  'list_cost_optimization_recommendation_categories': 'costOptimization',
};

export class LogicMonitorHandlers {
  private client: LogicMonitorClient;
  private handlers: Record<string, DomainHandler>;
  private routes: Map<string, DomainHandler> = new Map();

  constructor(client: LogicMonitorClient) {
    this.client = client;
    this.handlers = {
      devices: new DevicesHandlers(client),
      deviceGroups: new DeviceGroupsHandlers(client),
      alerts: new AlertsHandlers(client),
      collectors: new CollectorsHandlers(client),
      datasources: new DatasourcesHandlers(client),
      instances: new InstancesHandlers(client),
      dashboards: new DashboardsHandlers(client),
      reports: new ReportsHandlers(client),
      websites: new WebsitesHandlers(client),
      users: new UsersHandlers(client),
      sdt: new SdtHandlers(client),
      configsources: new ConfigsourcesHandlers(client),
      audit: new AuditHandlers(client),
      accessGroups: new AccessGroupsHandlers(client),
      eventsources: new EventsourcesHandlers(client),
      escalation: new EscalationHandlers(client),
      propertyRules: new PropertyRulesHandlers(client),
      logsources: new LogsourcesHandlers(client),
      opsnotes: new OpsnotesHandlers(client),
      services: new ServicesHandlers(client),
      jobMonitors: new JobMonitorsHandlers(client),
      diagnostics: new DiagnosticsHandlers(client),
      logicmodules: new LogicmodulesHandlers(client),
      topology: new TopologyHandlers(client),
      cloud: new CloudHandlers(client),
      integrations: new IntegrationsHandlers(client),
      misc: new MiscHandlers(client),
      netscans: new NetscansHandlers(client),
      costOptimization: new CostOptimizationHandlers(client),
    };
    for (const [tool, domain] of Object.entries(TOOL_DOMAINS)) {
      this.routes.set(tool, this.handlers[domain]);
    }
  }

  async handleToolCall(
    name: string,
    args: any,
    progressCallback?: ProgressCallback,
  ): Promise<any> {
    const handler = this.routes.get(name);
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
    return handler.handle(name, args, progressCallback);
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
