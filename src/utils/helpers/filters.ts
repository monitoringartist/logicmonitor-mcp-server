/**
 * LogicMonitor API Filter Utilities
 *
 * Based on LogicMonitor REST API documentation:
 * - Pattern: <field name><operator><values>
 * - Operators: : (equal), !: (not equal), > < >: <: (comparison), ~ (contain), !~ (not contain)
 * - String values need double quotes: name:"value"
 * - Multiple values use | (OR): status:"active"|"suspend"
 * - Multiple conditions use , (AND): name:"test",status:"active"
 * - Logical OR between conditions use || (OR): name:"aaa"||status:"suspend"
 *
 * Examples:
 * - displayName:"*villa*"
 * - hostStatus:"alive"
 * - id>:100
 * - displayName:"prod*",hostStatus:"alive" (AND)
 * - name:"web*"||name:"app*" (OR)
 */

/**
 * Format a LogicMonitor API filter string, automatically quoting string values
 * and handling wildcards
 */
export function formatLogicMonitorFilter(filter: string | undefined): string | undefined {
  if (!filter) return filter;

  // Split on logical operators (, for AND, || for OR) while preserving them
  // Using a non-backtracking pattern to avoid polynomial complexity
  const parts = filter.split(/( *(?:,|\|\|) *)/);

  const formattedParts = parts.map((part) => {
    // Skip logical operators
    if (part.match(/^ *(?:,|\|\|) *$/)) {
      return part;
    }

    // Process individual conditions
    return formatFilterCondition(part.trim());
  });

  return formattedParts.join('');
}

/**
   * Format a single filter condition
   */
function formatFilterCondition(condition: string): string {
  // Handle LogicMonitor operators: :, !:, >, <, >:, <:, ~, !~
  // Match pattern: property<operator>value(s)
  // Using possessive quantifier equivalent to avoid backtracking
  const operatorMatch = condition.match(/^([^:!><~]+?)([:!><~]+)(.*)$/);

  if (!operatorMatch) {
    return condition; // Return as-is if not recognized pattern
  }

  const [, property, operator, value] = operatorMatch;
  const cleanProperty = property.trim();
  const cleanOperator = operator.trim();
  const cleanValue = value.trim();

  // Handle multiple values separated by | (OR within same field)
  if (cleanValue.includes('|') && !cleanValue.startsWith('"')) {
    const values = cleanValue.split('|').map((v) => {
      const trimmed = v.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return trimmed; // Already quoted
      }
      return needsQuoting(trimmed) ? `"${trimmed}"` : trimmed;
    });
    return `${cleanProperty}${cleanOperator}${values.join('|')}`;
  }

  // Check if value is already properly quoted
  if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
    return `${cleanProperty}${cleanOperator}${cleanValue}`;
  }

  // Check if value needs quoting
  if (needsQuoting(cleanValue)) {
    return `${cleanProperty}${cleanOperator}"${cleanValue}"`;
  }

  // Return as-is for numeric values
  return `${cleanProperty}${cleanOperator}${cleanValue}`;
}

/**
   * Check if a value needs to be quoted
   */
function needsQuoting(value: string): boolean {
  // Special case: if already quoted, don't double quote
  if (value.startsWith('"') && value.endsWith('"')) {
    return false;
  }

  // Don't quote pure integers
  if (/^\d+$/.test(value)) {
    return false;
  }

  // Don't quote pure decimals
  if (/^\d+\.\d+$/.test(value)) {
    return false;
  }

  // Don't quote boolean values
  if (value === 'true' || value === 'false') {
    return false;
  }

  // Quote ALL string values - LogicMonitor API requires string values to be quoted
  return true;
}

/**
   * Escape special characters in filter values
   * Special characters that need escaping: ( ) : , ~ " \
   * Note: Asterisk (*) is NOT escaped as it's used for wildcards
   */
export function escapeFilterValue(value: string): string {
  return value.replace(/([(),:~"\\])/g, '\\$1');
}

/**
   * Auto-format a filter or search query intelligently:
   * - If it contains filter operators (: or ~), treat as a filter and format it
   * - If it's plain text, convert to a search filter across specified fields
   *
   * @param input - User input (filter expression or plain text search)
   * @param searchFields - Fields to search across for plain text (optional)
   * @returns Formatted filter string
   */
export function autoFormatFilter(
  input: string | undefined,
  searchFields?: string[],
): string | undefined {
  if (!input) return input;

  const trimmedInput = input.trim();

  // If it contains filter operators, treat as a proper filter expression
  if (trimmedInput.includes(':') || trimmedInput.includes('~')) {
    return formatLogicMonitorFilter(trimmedInput);
  }

  // If no search fields provided, just format as-is (for backward compatibility)
  if (!searchFields || searchFields.length === 0) {
    return formatLogicMonitorFilter(trimmedInput);
  }

  // Plain text search - create OR filter across all search fields
  const escapedQuery = escapeFilterValue(trimmedInput);
  const searchConditions = searchFields.map(
    field => `${field}~"*${escapedQuery}*"`,
  );

  return searchConditions.join(' || ');
}

/**
   * Common search field configurations for different resource types
   *
   * NOTE: Some endpoints (like alerts) don't support OR (||) operator.
   * For those endpoints, limit to a single field or use AND (,) with filter syntax.
   */
export const SEARCH_FIELDS = {
  devices: ['displayName', 'description', 'name'],
  deviceGroups: ['name', 'description', 'fullPath'],
  alerts: ['monitorObjectName'], // Alert API doesn't support OR - use single most relevant field
  collectors: ['description', 'hostname'],
  datasources: ['name', 'displayName', 'description'],
  dashboards: ['name', 'description'],
  reports: ['name', 'description'],
  websites: ['name', 'domain', 'description'],
  users: ['username', 'email', 'firstName', 'lastName'],
  roles: ['name', 'description'],
  sdts: ['comment', 'adminName'],
  configsources: ['name', 'displayName', 'description'],
  auditLogs: ['username', 'description', 'ip'],
};

/**
   * Common filter patterns for documentation
   */
export const FILTER_EXAMPLES = {
  devices: [
    'displayName:"*prod*"',
    'hostStatus:"alive"',
    'displayName:"web*",hostStatus:"alive"', // AND with comma
    'name:"web*"||name:"app*"', // OR with ||
    'id>:100', // Greater than or equal
    'disableAlerting:false',
    'hostStatus:"active"|"pending"', // Multiple values with |
  ],
  deviceGroups: [
    'name:"*servers*"',
    'parentId:1',
    'name:"production*"',
    'name~"test"', // Contains
  ],
  alerts: [
    'severity:"critical"',
    'resourceTemplateName~"*cpu*"',
    'acked:false',
    'startEpoch>:1640000000000',
  ],
  websites: [
    'type:"webcheck"',
    'status:"active"',
    'domain~"*example.com"',
  ],
};
