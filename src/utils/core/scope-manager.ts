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
  'list_datasources': ['mcp:tools', 'lm:read'],
  'get_datasource': ['mcp:tools', 'lm:read'],
  'search_devices': ['mcp:tools', 'lm:read'],
  'search_alerts': ['mcp:tools', 'lm:alerts:read'],

  // Write operations - require write scopes
  'acknowledge_alert': ['mcp:tools', 'lm:alerts:write'],
  'add_device': ['mcp:tools', 'lm:devices:write'],
  'update_device': ['mcp:tools', 'lm:devices:write'],
  'delete_device': ['mcp:tools', 'lm:devices:write'],

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

