/**
 * Scope Manager - Manages scope requirements and validation
 * 
 * Implements scope-based authorization per:
 * - MCP Authorization Specification
 * - RFC 6750 Section 3.1 (insufficient_scope error)
 */

/**
 * Scope definitions for MCP tools
 */
export const SCOPE_DEFINITIONS = {
  // Core MCP scope
  'mcp:tools': {
    description: 'Access to MCP tools',
    category: 'core',
  },

  // Read-only scopes
  'lm:read': {
    description: 'Read access to LogicMonitor resources',
    category: 'read',
  },
  'lm:devices:read': {
    description: 'Read device information',
    category: 'read',
  },
  'lm:alerts:read': {
    description: 'Read alert information',
    category: 'read',
  },
  'lm:dashboards:read': {
    description: 'Read dashboard information',
    category: 'read',
  },
  'lm:reports:read': {
    description: 'Read report information',
    category: 'read',
  },

  // Write scopes
  'lm:write': {
    description: 'Write access to LogicMonitor resources',
    category: 'write',
  },
  'lm:devices:write': {
    description: 'Create and modify devices',
    category: 'write',
  },
  'lm:alerts:write': {
    description: 'Acknowledge and manage alerts',
    category: 'write',
  },
  'lm:dashboards:write': {
    description: 'Create and modify dashboards',
    category: 'write',
  },

  // Administrative scopes
  'lm:admin': {
    description: 'Administrative access to LogicMonitor',
    category: 'admin',
  },
  'lm:users:manage': {
    description: 'Manage users and permissions',
    category: 'admin',
  },
} as const;

export type ScopeName = keyof typeof SCOPE_DEFINITIONS;

/**
 * Tool scope requirements mapping
 */
export const TOOL_SCOPE_REQUIREMENTS: Record<string, string[]> = {
  // List/Get operations - require read scopes
  'list_resources': ['mcp:tools', 'lm:read'],
  'get_resource': ['mcp:tools', 'lm:read'],
  'list_alerts': ['mcp:tools', 'lm:alerts:read'],
  'get_alert': ['mcp:tools', 'lm:alerts:read'],
  'list_dashboards': ['mcp:tools', 'lm:dashboards:read'],
  'get_dashboard': ['mcp:tools', 'lm:dashboards:read'],
  'list_widgets': ['mcp:tools', 'lm:dashboards:read'],
  'list_dashboard_widgets': ['mcp:tools', 'lm:dashboards:read'],
  'get_widget': ['mcp:tools', 'lm:dashboards:read'],
  'get_widget_data': ['mcp:tools', 'lm:dashboards:read'],
  'get_collector_installer': ['mcp:tools', 'lm:read'],
  'get_website_checkpoint_data': ['mcp:tools', 'lm:read'],
  'get_website_graph_data': ['mcp:tools', 'lm:read'],
  'list_datasources': ['mcp:tools', 'lm:read'],
  'get_datasource': ['mcp:tools', 'lm:read'],
  'list_cost_optimization_recommendations': ['mcp:tools', 'lm:read'],
  'get_cost_optimization_recommendation': ['mcp:tools', 'lm:read'],
  'list_cost_optimization_recommendation_categories': ['mcp:tools', 'lm:read'],

  // Write operations - require write scopes
  'acknowledge_alert': ['mcp:tools', 'lm:alerts:write'],
  'add_device': ['mcp:tools', 'lm:devices:write'],
  'update_device': ['mcp:tools', 'lm:devices:write'],
  'delete_device': ['mcp:tools', 'lm:devices:write'],
  'create_widget': ['mcp:tools', 'lm:dashboards:write'],
  'update_widget': ['mcp:tools', 'lm:dashboards:write'],
  'delete_widget': ['mcp:tools', 'lm:dashboards:write'],
  'create_collector': ['mcp:tools', 'lm:write'],
  'update_collector': ['mcp:tools', 'lm:write'],
  'delete_collector': ['mcp:tools', 'lm:write'],
  'acknowledge_collector_down_alert': ['mcp:tools', 'lm:write'],
  'execute_debug_command': ['mcp:tools', 'lm:write'],
  'get_debug_command_result': ['mcp:tools', 'lm:read'],
  'create_configsource': ['mcp:tools', 'lm:write'],
  'update_configsource': ['mcp:tools', 'lm:write'],
  'delete_configsource': ['mcp:tools', 'lm:write'],
  'import_configsource': ['mcp:tools', 'lm:write'],
  'create_eventsource': ['mcp:tools', 'lm:write'],
  'update_eventsource': ['mcp:tools', 'lm:write'],
  'delete_eventsource': ['mcp:tools', 'lm:write'],
  'import_eventsource': ['mcp:tools', 'lm:write'],
  'create_sdt': ['mcp:tools', 'lm:write'],
  'update_sdt': ['mcp:tools', 'lm:write'],
  'create_report': ['mcp:tools', 'lm:write'],
  'update_report': ['mcp:tools', 'lm:write'],
  'delete_report': ['mcp:tools', 'lm:write'],
  'generate_report': ['mcp:tools', 'lm:write'],
  'get_report_task_result': ['mcp:tools', 'lm:read'],
  // Device instances, alert settings, config, netflow, SDT history
  'create_resource_instance': ['mcp:tools', 'lm:write'],
  'update_resource_instance': ['mcp:tools', 'lm:write'],
  'delete_resource_instance': ['mcp:tools', 'lm:write'],
  'get_instance_graph_data': ['mcp:tools', 'lm:read'],
  'get_resource_datasource_data': ['mcp:tools', 'lm:read'],
  'list_resource_instance_groups': ['mcp:tools', 'lm:read'],
  'get_resource_instance_group': ['mcp:tools', 'lm:read'],
  'create_resource_instance_group': ['mcp:tools', 'lm:write'],
  'update_resource_instance_group': ['mcp:tools', 'lm:write'],
  'update_instance_group_alert_threshold': ['mcp:tools', 'lm:write'],
  'get_instance_group_overview_graph_data': ['mcp:tools', 'lm:read'],
  'list_resource_alert_settings': ['mcp:tools', 'lm:read'],
  'list_instance_alert_settings': ['mcp:tools', 'lm:read'],
  'get_instance_alert_setting': ['mcp:tools', 'lm:read'],
  'update_instance_alert_setting': ['mcp:tools', 'lm:write'],
  'list_resource_instance_configs': ['mcp:tools', 'lm:read'],
  'get_resource_instance_config': ['mcp:tools', 'lm:read'],
  'collect_resource_instance_config': ['mcp:tools', 'lm:write'],
  'list_resource_netflow_flows': ['mcp:tools', 'lm:read'],
  'list_resource_netflow_ports': ['mcp:tools', 'lm:read'],
  'list_resource_netflow_endpoints': ['mcp:tools', 'lm:read'],
  'get_resource_top_talkers_graph': ['mcp:tools', 'lm:read'],
  'get_resource_sdt_history': ['mcp:tools', 'lm:read'],
  'get_resource_datasource_sdt_history': ['mcp:tools', 'lm:read'],
  'get_instance_sdt_history': ['mcp:tools', 'lm:read'],
  'create_resource_property': ['mcp:tools', 'lm:write'],
  'delete_resource_property': ['mcp:tools', 'lm:write'],
  'list_resource_alerts': ['mcp:tools', 'lm:read'],
  'list_resource_eventsources': ['mcp:tools', 'lm:read'],
  'schedule_resource_auto_discovery': ['mcp:tools', 'lm:write'],
  'get_resources_delta_id': ['mcp:tools', 'lm:read'],
  'get_resources_delta': ['mcp:tools', 'lm:read'],
  // Alert automation: action chains & rules
  'list_action_chains': ['mcp:tools', 'lm:read'],
  'get_action_chain': ['mcp:tools', 'lm:read'],
  'create_action_chain': ['mcp:tools', 'lm:write'],
  'update_action_chain': ['mcp:tools', 'lm:write'],
  'delete_action_chain': ['mcp:tools', 'lm:write'],
  'list_action_rules': ['mcp:tools', 'lm:read'],
  'get_action_rule': ['mcp:tools', 'lm:read'],
  'create_action_rule': ['mcp:tools', 'lm:write'],
  'update_action_rule': ['mcp:tools', 'lm:write'],
  'delete_action_rule': ['mcp:tools', 'lm:write'],
  'set_action_rule_status': ['mcp:tools', 'lm:write'],
  // DataSource management (write/import) + read extras
  'create_datasource': ['mcp:tools', 'lm:write'],
  'update_datasource': ['mcp:tools', 'lm:write'],
  'delete_datasource': ['mcp:tools', 'lm:write'],
  'import_datasource': ['mcp:tools', 'lm:write'],
  'list_datasource_overview_graphs': ['mcp:tools', 'lm:read'],
  'get_datasource_overview_graph': ['mcp:tools', 'lm:read'],
  'list_datasource_devices': ['mcp:tools', 'lm:read'],
  'list_datasource_update_reasons': ['mcp:tools', 'lm:read'],
  // PropertySources (property rules)
  'list_property_rules': ['mcp:tools', 'lm:read'],
  'get_property_rule': ['mcp:tools', 'lm:read'],
  'create_property_rule': ['mcp:tools', 'lm:write'],
  'update_property_rule': ['mcp:tools', 'lm:write'],
  'delete_property_rule': ['mcp:tools', 'lm:write'],
  'import_property_rule': ['mcp:tools', 'lm:write'],
  // LogSources
  'list_logsources': ['mcp:tools', 'lm:read'],
  'get_logsource': ['mcp:tools', 'lm:read'],
  'create_logsource': ['mcp:tools', 'lm:write'],
  'update_logsource': ['mcp:tools', 'lm:write'],
  'delete_logsource': ['mcp:tools', 'lm:write'],
  'import_logsource': ['mcp:tools', 'lm:write'],
  // Dashboard groups (write)
  'create_dashboard_group': ['mcp:tools', 'lm:dashboards:write'],
  'update_dashboard_group': ['mcp:tools', 'lm:dashboards:write'],
  'delete_dashboard_group': ['mcp:tools', 'lm:dashboards:write'],
  'clone_dashboard_group': ['mcp:tools', 'lm:dashboards:write'],

  // Administrative operations
  'list_users': ['mcp:tools', 'lm:admin'],
  'create_user': ['mcp:tools', 'lm:users:manage'],
  'update_user': ['mcp:tools', 'lm:users:manage'],
  'delete_user': ['mcp:tools', 'lm:users:manage'],
  'create_api_token': ['mcp:tools', 'lm:users:manage'],
  'update_api_token': ['mcp:tools', 'lm:users:manage'],
  'delete_api_token': ['mcp:tools', 'lm:users:manage'],

  // Collector groups & agent log levels
  'create_collector_group': ['mcp:tools', 'lm:write'],
  'update_collector_group': ['mcp:tools', 'lm:write'],
  'delete_collector_group': ['mcp:tools', 'lm:write'],
  'list_collector_agent_log_levels': ['mcp:tools', 'lm:read'],
  'get_collector_agent_log_level': ['mcp:tools', 'lm:read'],
  'update_collector_agent_log_level': ['mcp:tools', 'lm:write'],
  'get_collector_events': ['mcp:tools', 'lm:read'],
  'get_collector_status_check': ['mcp:tools', 'lm:read'],

  // Job Monitors (BatchJobs)
  'list_job_monitors': ['mcp:tools', 'lm:read'],
  'get_job_monitor': ['mcp:tools', 'lm:read'],
  'create_job_monitor': ['mcp:tools', 'lm:write'],
  'update_job_monitor': ['mcp:tools', 'lm:write'],
  'delete_job_monitor': ['mcp:tools', 'lm:write'],
  'import_job_monitor': ['mcp:tools', 'lm:write'],

  // DiagnosticSources
  'list_diagnosticsources': ['mcp:tools', 'lm:read'],
  'get_diagnosticsource': ['mcp:tools', 'lm:read'],
  'create_diagnosticsource': ['mcp:tools', 'lm:write'],
  'update_diagnosticsource': ['mcp:tools', 'lm:write'],
  'delete_diagnosticsource': ['mcp:tools', 'lm:write'],
  'import_diagnosticsource': ['mcp:tools', 'lm:write'],
  'execute_diagnosticsource': ['mcp:tools', 'lm:write'],

  // AppliesTo Functions
  'list_applies_to_functions': ['mcp:tools', 'lm:read'],
  'get_applies_to_function': ['mcp:tools', 'lm:read'],
  'create_applies_to_function': ['mcp:tools', 'lm:write'],
  'update_applies_to_function': ['mcp:tools', 'lm:write'],
  'delete_applies_to_function': ['mcp:tools', 'lm:write'],
  'import_applies_to_function': ['mcp:tools', 'lm:write'],

  // SNMP OIDs
  'list_oids': ['mcp:tools', 'lm:read'],
  'get_oid': ['mcp:tools', 'lm:read'],
  'create_oid': ['mcp:tools', 'lm:write'],
  'update_oid': ['mcp:tools', 'lm:write'],
  'delete_oid': ['mcp:tools', 'lm:write'],
  'import_oid': ['mcp:tools', 'lm:write'],

  // RemediationSources
  'list_remediationsources': ['mcp:tools', 'lm:read'],
  'get_remediationsource': ['mcp:tools', 'lm:read'],
  'create_remediationsource': ['mcp:tools', 'lm:write'],
  'update_remediationsource': ['mcp:tools', 'lm:write'],
  'delete_remediationsource': ['mcp:tools', 'lm:write'],
  'execute_remediation': ['mcp:tools', 'lm:write'],

  // TopologySources
  'list_topologysources': ['mcp:tools', 'lm:read'],
  'get_topologysource': ['mcp:tools', 'lm:read'],
  'create_topologysource': ['mcp:tools', 'lm:write'],
  'update_topologysource': ['mcp:tools', 'lm:write'],
  'delete_topologysource': ['mcp:tools', 'lm:write'],
  'import_topologysource': ['mcp:tools', 'lm:write'],

  // Bulk instance data fetch & instance graph by id
  'fetch_instances_data': ['mcp:tools', 'lm:read'],
  'get_instance_graph_data_by_id': ['mcp:tools', 'lm:read'],

  // Log Pipelines / Log Alert Groups
  'list_log_alert_groups': ['mcp:tools', 'lm:read'],
  'get_log_alert_group': ['mcp:tools', 'lm:read'],
  'create_log_alert_group': ['mcp:tools', 'lm:write'],
  'update_log_alert_group': ['mcp:tools', 'lm:write'],
  'delete_log_alert_group': ['mcp:tools', 'lm:write'],
  'list_log_alerts': ['mcp:tools', 'lm:read'],
  'get_log_alert': ['mcp:tools', 'lm:read'],
  'create_log_alert': ['mcp:tools', 'lm:write'],
  'update_log_alert': ['mcp:tools', 'lm:write'],
  'delete_log_alert': ['mcp:tools', 'lm:write'],
  'set_log_alert_status': ['mcp:tools', 'lm:write'],

  // Log Query Groups
  'list_log_query_groups': ['mcp:tools', 'lm:read'],
  'get_log_query_group': ['mcp:tools', 'lm:read'],
  'create_log_query_group': ['mcp:tools', 'lm:write'],
  'update_log_query_group': ['mcp:tools', 'lm:write'],
  'delete_log_query_group': ['mcp:tools', 'lm:write'],
  'list_log_query_group_queries': ['mcp:tools', 'lm:read'],
  'list_log_query_groups_by_type': ['mcp:tools', 'lm:read'],
  'move_log_queries': ['mcp:tools', 'lm:write'],

  // Log Partitions
  'list_log_partitions': ['mcp:tools', 'lm:read'],
  'get_log_partition': ['mcp:tools', 'lm:read'],
  'create_log_partition': ['mcp:tools', 'lm:write'],
  'update_log_partition': ['mcp:tools', 'lm:write'],
  'delete_log_partition': ['mcp:tools', 'lm:write'],
  'get_log_partition_retentions': ['mcp:tools', 'lm:read'],
  'log_partition_action': ['mcp:tools', 'lm:write'],

  // Tracked Query Groups
  'list_tracked_query_groups': ['mcp:tools', 'lm:read'],
  'get_tracked_query_group': ['mcp:tools', 'lm:read'],
  'create_tracked_query_group': ['mcp:tools', 'lm:write'],
  'update_tracked_query_group': ['mcp:tools', 'lm:write'],
  'delete_tracked_query_group': ['mcp:tools', 'lm:write'],

  // Cloud Onboarding (AWS / Azure / GCP / SaaS) - read-oriented validation
  'get_aws_account_id': ['mcp:tools', 'lm:read'],
  'get_aws_external_id': ['mcp:tools', 'lm:read'],
  'test_aws_account': ['mcp:tools', 'lm:read'],
  'verify_aws_billing_permissions': ['mcp:tools', 'lm:read'],
  'discover_azure_subscriptions': ['mcp:tools', 'lm:read'],
  'test_azure_account': ['mcp:tools', 'lm:read'],
  'verify_azure_storage_permissions': ['mcp:tools', 'lm:read'],
  'test_gcp_account': ['mcp:tools', 'lm:read'],
  'test_saas_account': ['mcp:tools', 'lm:read'],

  // ConfigSource update reasons & Website extras
  'get_configsource_update_reasons': ['mcp:tools', 'lm:read'],
  'get_website_sdt_history': ['mcp:tools', 'lm:read'],
  'get_website_graph_by_name': ['mcp:tools', 'lm:read'],

  // Diagnostic Remediation & Metrics
  'get_diagnostic_remediation_sources': ['mcp:tools', 'lm:read'],
  'get_diagnostic_remediation_results': ['mcp:tools', 'lm:read'],
  'get_metrics_summary': ['mcp:tools', 'lm:read'],
  'get_metrics_usage': ['mcp:tools', 'lm:read'],

  // Default Dashboard, Alerts, Access Group mapping, DNS
  'update_default_dashboard': ['mcp:tools', 'lm:write'],
  'escalate_alert': ['mcp:tools', 'lm:write'],
  'map_unmap_module_to_access_group': ['mcp:tools', 'lm:write'],
  'add_dns_mapping': ['mcp:tools', 'lm:write'],

  // Singletons (read)
  'get_integration_audit_logs': ['mcp:tools', 'lm:read'],
  'get_external_api_stats': ['mcp:tools', 'lm:read'],
  'get_logicmodule_metadata': ['mcp:tools', 'lm:read'],
  'list_unmonitored_devices': ['mcp:tools', 'lm:read'],
  'get_contract_info': ['mcp:tools', 'lm:read'],

  // Roles (write)
  'create_role': ['mcp:tools', 'lm:users:manage'],
  'update_role': ['mcp:tools', 'lm:users:manage'],
  'delete_role': ['mcp:tools', 'lm:users:manage'],

  // Website groups
  'create_website_group': ['mcp:tools', 'lm:write'],
  'update_website_group': ['mcp:tools', 'lm:write'],
  'delete_website_group': ['mcp:tools', 'lm:write'],
  'list_website_group_websites': ['mcp:tools', 'lm:read'],
  'list_website_group_sdts': ['mcp:tools', 'lm:read'],
  'get_website_group_sdt_history': ['mcp:tools', 'lm:read'],
};

/**
 * Scope hierarchy - parent scopes imply child scopes
 */
export const SCOPE_HIERARCHY: Record<string, string[]> = {
  'lm:admin': ['lm:write', 'lm:read'],
  'lm:write': ['lm:read'],
  'lm:devices:write': ['lm:devices:read'],
  'lm:alerts:write': ['lm:alerts:read'],
  'lm:dashboards:write': ['lm:dashboards:read'],
  'lm:users:manage': ['lm:read'],
};

/**
 * Scope Manager class
 */
export class ScopeManager {
  /**
   * Parse scope string into array
   */
  static parseScopes(scopeString: string | undefined): string[] {
    if (!scopeString) {
      return [];
    }
    return scopeString.split(' ').filter(s => s.length > 0);
  }

  /**
   * Check if user has all required scopes (considering hierarchy)
   */
  static hasRequiredScopes(userScopes: string[], requiredScopes: string[]): boolean {
    const expandedUserScopes = this.expandScopes(userScopes);
    return requiredScopes.every(required => expandedUserScopes.includes(required));
  }

  /**
   * Expand scopes based on hierarchy
   * Example: 'lm:admin' expands to ['lm:admin', 'lm:write', 'lm:read']
   */
  static expandScopes(scopes: string[]): string[] {
    const expanded = new Set<string>(scopes);

    for (const scope of scopes) {
      const implied = SCOPE_HIERARCHY[scope];
      if (implied) {
        implied.forEach(s => expanded.add(s));
      }
    }

    return Array.from(expanded);
  }

  /**
   * Get required scopes for a tool
   */
  static getToolScopes(toolName: string): string[] {
    // Check exact match first
    if (TOOL_SCOPE_REQUIREMENTS[toolName]) {
      return TOOL_SCOPE_REQUIREMENTS[toolName];
    }

    // Default: require basic mcp:tools scope
    return ['mcp:tools'];
  }

  /**
   * Get missing scopes
   */
  static getMissingScopes(userScopes: string[], requiredScopes: string[]): string[] {
    const expandedUserScopes = this.expandScopes(userScopes);
    return requiredScopes.filter(required => !expandedUserScopes.includes(required));
  }

  /**
   * Validate scopes for a tool
   */
  static validateToolScopes(toolName: string, userScopes: string | undefined): {
    valid: boolean;
    requiredScopes: string[];
    missingScopes: string[];
  } {
    const userScopeArray = this.parseScopes(userScopes);
    const requiredScopes = this.getToolScopes(toolName);
    const hasScopes = this.hasRequiredScopes(userScopeArray, requiredScopes);
    const missingScopes = hasScopes ? [] : this.getMissingScopes(userScopeArray, requiredScopes);

    return {
      valid: hasScopes,
      requiredScopes,
      missingScopes,
    };
  }

  /**
   * Get recommended scope set (for step-up authorization)
   * Returns existing scopes + missing scopes
   */
  static getRecommendedScopes(userScopes: string[], missingScopes: string[]): string[] {
    const userScopeArray = this.parseScopes(userScopes.join(' '));
    const combined = new Set([...userScopeArray, ...missingScopes]);
    return Array.from(combined);
  }

  /**
   * Check if a scope is a write scope
   */
  static isWriteScope(scope: string): boolean {
    return scope.includes(':write') || 
           scope === 'lm:admin' || 
           scope === 'lm:users:manage';
  }

  /**
   * Check if a scope is an admin scope
   */
  static isAdminScope(scope: string): boolean {
    return scope === 'lm:admin' || scope === 'lm:users:manage';
  }

  /**
   * Get scope description
   */
  static getScopeDescription(scope: string): string {
    const def = SCOPE_DEFINITIONS[scope as ScopeName];
    return def?.description || scope;
  }

  /**
   * Get all available scopes
   */
  static getAvailableScopes(): string[] {
    return Object.keys(SCOPE_DEFINITIONS);
  }

  /**
   * Get scopes by category
   */
  static getScopesByCategory(category: 'core' | 'read' | 'write' | 'admin'): string[] {
    return Object.entries(SCOPE_DEFINITIONS)
      .filter(([_, def]) => def.category === category)
      .map(([scope]) => scope);
  }

  /**
   * Format scopes for display
   */
  static formatScopes(scopes: string[]): string {
    return scopes.map(s => `"${s}"`).join(', ');
  }
}

/**
 * Helper: Check if user has required scopes (simple version)
 */
export function hasScopes(userScopes: string | undefined, requiredScopes: string[]): boolean {
  const userScopeArray = ScopeManager.parseScopes(userScopes);
  return ScopeManager.hasRequiredScopes(userScopeArray, requiredScopes);
}

/**
 * Helper: Get missing scopes
 */
export function getMissingScopes(userScopes: string | undefined, requiredScopes: string[]): string[] {
  const userScopeArray = ScopeManager.parseScopes(userScopes);
  return ScopeManager.getMissingScopes(userScopeArray, requiredScopes);
}

