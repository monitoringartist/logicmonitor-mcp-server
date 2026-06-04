import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const logicmodulesTools: Tool[] = [
  // AppliesTo Functions
  {
    name: 'list_applies_to_functions',
    description: 'List AppliesTo Functions in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are AppliesTo Functions:** Reusable named expressions used in LogicModule AppliesTo logic to target groups of resources. ' +
      '\n\n**Related tools:** "get\\_applies\\_to\\_function", "create\\_applies\\_to\\_function".',
    annotations: { title: 'List appliesto functions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_applies_to_function',
    description: 'Get details of a specific AppliesTo Function in LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Get appliesto function', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        functionId: { type: 'number', description: 'The AppliesTo Function ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['functionId'],
    },
  },
  {
    name: 'create_applies_to_function',
    description: 'Create an AppliesTo Function in LogicMonitor (LM) monitoring. Definition via `config` (name, code, description). ',
    annotations: { title: 'Create appliesto function', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The AppliesToFunction definition (name, code, description).' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_applies_to_function',
    description: 'Update an AppliesTo Function in LogicMonitor (LM) monitoring. Partial update via `config`. ' +
      '\n\n**Parameters:** functionId, `config`, optional reason, ignoreReference. ',
    annotations: { title: 'Update appliesto function', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        functionId: { type: 'number', description: 'The AppliesTo Function ID to update' },
        reason: { type: 'string', description: 'Optional audit reason.' },
        ignoreReference: { type: 'boolean', description: 'Ignore reference checks when updating.' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['functionId', 'config'],
    },
  },
  {
    name: 'delete_applies_to_function',
    description: 'Delete an AppliesTo Function from LogicMonitor (LM) monitoring. Cannot be undone. ' +
      '\n\n**Optional:** ignoreReference to delete even if referenced by LogicModules. ',
    annotations: { title: 'Delete appliesto function', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        functionId: { type: 'number', description: 'The AppliesTo Function ID to delete' },
        ignoreReference: { type: 'boolean', description: 'Delete even if referenced.' },
      },
      additionalProperties: false,
      required: ['functionId'],
    },
  },
  {
    name: 'import_applies_to_function',
    description: 'Import an AppliesTo Function definition (JSON) into LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Import appliesto function', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON definition content to import.' },
        handleConflict: { type: 'string', description: 'Conflict handling.' },
        fieldsToPreserve: { type: 'string', description: 'Fields to preserve on conflict.' },
      },
      additionalProperties: false,
      required: ['content'],
    },
  },

  // SNMP OIDs
  {
    name: 'list_oids',
    description: 'List SNMP OIDs (MIB definitions) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "get\\_oid", "create\\_oid".',
    annotations: { title: 'List SNMP OIDs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_oid',
    description: 'Get details of a specific SNMP OID in LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Get SNMP OID', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        oidId: { type: 'number', description: 'The OID record ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['oidId'],
    },
  },
  {
    name: 'create_oid',
    description: 'Create an SNMP OID (MIB) definition in LogicMonitor (LM) monitoring. Definition via `config`. ',
    annotations: { title: 'Create SNMP OID', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The OID definition.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_oid',
    description: 'Update an SNMP OID definition in LogicMonitor (LM) monitoring. Partial update via `config`. ',
    annotations: { title: 'Update SNMP OID', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        oidId: { type: 'number', description: 'The OID record ID to update' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['oidId', 'config'],
    },
  },
  {
    name: 'delete_oid',
    description: 'Delete an SNMP OID definition from LogicMonitor (LM) monitoring. Cannot be undone. ',
    annotations: { title: 'Delete SNMP OID', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        oidId: { type: 'number', description: 'The OID record ID to delete' },
      },
      additionalProperties: false,
      required: ['oidId'],
    },
  },
  {
    name: 'import_oid',
    description: 'Import an SNMP OID definition (JSON) into LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Import SNMP OID', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON definition content to import.' },
        handleConflict: { type: 'string', description: 'Conflict handling.' },
        fieldsToPreserve: { type: 'string', description: 'Fields to preserve on conflict.' },
      },
      additionalProperties: false,
      required: ['content'],
    },
  },

  // LogicModule metadata
  {
    name: 'get_logicmodule_metadata',
    description: 'Get portal-wide metadata about LogicModules available in the LogicMonitor (LM) portal. ' +
      '\n\n**No identifier:** This endpoint returns aggregate metadata for all module types and takes no module type/ID. ' +
      'To fetch a specific module, use the type-specific tools instead (e.g., "get\\_datasource", "get\\_logsource", "get\\_property\\_rule", "get\\_eventsource", "get\\_configsource").',
    annotations: { title: 'Get LogicModule metadata', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },

];
