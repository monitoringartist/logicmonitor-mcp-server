import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { fieldsSchema } from './common.js';

export const miscTools: Tool[] = [
  // Contract / usage info
  {
    name: 'get_contract_info',
    description: 'Get contract and usage information for the LogicMonitor (LM) portal.',
    annotations: { title: 'Get contract info', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },

  // DNS mappings
  {
    name: 'add_dns_mapping',
    description: 'Add a DNS mapping in LogicMonitor (LM). Provide the mapping payload via "config".',
    annotations: { title: 'Add DNS mapping', readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'DNS mapping payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'get_focus_cost_usage',
    description: 'Get FOCUS v1.3 Cost and Usage shaped usage export from LogicMonitor (LM).',
    annotations: { title: 'Get FOCUS cost usage', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Optional feature filter' },
        dimensionKey: { type: 'string', description: 'Optional dimension key' },
        startTime: { type: 'number', description: 'Optional start time (epoch)' },
        endTime: { type: 'number', description: 'Optional end time (epoch)' },
        at: { type: 'number', description: 'Optional point-in-time timestamp' },
        metricQualifier: { type: 'string', description: 'Optional metric qualifier' },
        usageBreakdownType: { type: 'string', description: 'Optional usage breakdown type' },
        usageBreakdownUnits: { type: 'string', description: 'Optional usage breakdown units' },
        sku: { type: 'string', description: 'Optional SKU filter' },
        tenantIds: { type: 'array', items: { type: 'string' }, description: 'Optional list of tenant IDs' },
        size: { type: 'number', description: 'Number of results per page' },
        offset: { type: 'number', description: 'Starting offset for pagination' },
      },
      additionalProperties: false,
    },
  },

];
