import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { fieldsSchema } from './common.js';

export const miscTools: Tool[] = [
  // Contract / usage info
  {
    name: 'get_contract_info',
    description: 'Get contract and usage information for the LogicMonitor (LM) portal.',
    annotations: { title: 'Get contract info', readOnlyHint: true },
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
    annotations: { title: 'Add DNS mapping', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'DNS mapping payload.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },

];
