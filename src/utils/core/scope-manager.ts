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

  // Administrative operations
  'list_users': ['mcp:tools', 'lm:admin'],
  'create_user': ['mcp:tools', 'lm:users:manage'],
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

