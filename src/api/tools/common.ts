/**
 * Shared JSON Schema fragments reused across LogicMonitor (LM) tool definitions.
 */

export const paginationSchema = {
  size: {
    type: 'number',
    description: 'Number of results per page (default: 50, max: 1000).',
  },
  offset: {
    type: 'number',
    description: 'Starting offset for pagination (default: 0). ' +
      'Use this to skip a specific number of results.',
  },
  autoPaginate: {
    type: 'boolean',
    description: 'Automatically fetch all pages (default: false). ' +
      'When true, fetches all results across multiple pages. ' +
      'When false, returns only the requested page. ' +
      'Use false for large result sets to avoid long response times.',
  },
};

export const filterSchema = {
  filter: {
    type: 'string',
    description: 'Filter expression using LogicMonitor query syntax. ' +
      'Examples: name:*prod*, displayName~*server*, id>100, hostStatus:normal. ' +
      'Available operators: : (equals), ~ (includes), !: (not equals), !~ (not includes), ' +
      '>: (greater than or equals), <: (less than or equals), > (greater than), < (less than). ' +
      'Multiple conditions: Use comma (,) for AND, use || for OR. Do NOT use &&.',
  },
};

export const fieldsSchema = {
  fields: {
    type: 'string',
    description: 'Comma-separated list of fields to include in response. ' +
      'Examples: "id,displayName,hostStatus" or use "*" for all fields. ' +
      'Omit this parameter to receive a curated set of commonly used fields.',
  },
};

export const clearedSchema = {
  cleared: {
    type: 'boolean',
    description: 'Filter alerts by their cleared (resolved) status. ' +
      'By default the LogicMonitor (LM) API returns only active (non-cleared) alerts. ' +
      'Set true to return only cleared/historical alerts, or false to return only active alerts. ' +
      'Omit to use the LM default (active alerts only). ' +
      'To retrieve BOTH active and cleared alerts, omit this and pass filter:"cleared:*" instead.',
  },
};
