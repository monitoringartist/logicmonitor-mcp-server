import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const propertyRulesTools: Tool[] = [
  // Property Rules (PropertySources)
  {
    name: 'list_property_rules',
    description: 'List PropertySources (property rules) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are PropertySources:** Modules that automatically assign properties to resources based on a script and appliesTo logic (e.g., auto-detect cloud tags, OS details, application metadata). ' +
      '\n\n**Returns:** Array of property rules with id, name, appliesTo, group, script details. ' +
      '\n\n**Related tools:** "get\\_property\\_rule", "create\\_property\\_rule".',
    annotations: { title: 'List property rules', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Optional response format.' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_property_rule',
    description: 'Get details of a specific PropertySource (property rule) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Full rule config: name, appliesTo, script (groovy/embed/powershell/external), params, schedule. ' +
      '\n\n**Related tools:** "list\\_property\\_rules", "update\\_property\\_rule".',
    annotations: { title: 'Get property rule', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        propertyRuleId: { type: 'number', description: 'The PropertySource (property rule) ID' },
        format: { type: 'string', description: 'Optional response format.' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['propertyRuleId'],
    },
  },
  {
    name: 'create_property_rule',
    description: 'Create a PropertySource (property rule) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a module that auto-assigns properties to matching resources via a script. ' +
      '\n\n**⚠️ PropertySources are complex, script-based modules.** The most reliable approach is to export an existing one via "get\\_property\\_rule", adapt it, and pass the full definition via `config`. ' +
      '\n\n**Required:** a `config` containing at least `name`, `appliesTo`, and the script fields (e.g., `groovyScript` with `scriptType: "embed"`). ' +
      '\n\n**Tip:** For sharing/distributing prefer "import\\_property\\_rule" with official JSON. ' +
      '\n\n**Related tools:** "get\\_property\\_rule", "update\\_property\\_rule", "import\\_property\\_rule".',
    annotations: { title: 'Create property rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: 'Full PropertySource definition (name, appliesTo, scriptType, groovyScript/windowsScript/linuxScript, params, etc.).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_property_rule',
    description: 'Update a PropertySource (property rule) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** propertyRuleId and a `config` with fields to change. Partial update. Optional `reason` (audit note). ' +
      '\n\n**Best practice:** Review with "get\\_property\\_rule" first. ' +
      '\n\n**Related tools:** "get\\_property\\_rule", "list\\_property\\_rules".',
    annotations: { title: 'Update property rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        propertyRuleId: { type: 'number', description: 'The PropertySource (property rule) ID' },
        config: {
          type: 'object',
          description: 'PropertySource fields to update (merged into the request body).',
          additionalProperties: true,
        },
        reason: { type: 'string', description: 'Audit reason for the update.' },
      },
      additionalProperties: false,
      required: ['propertyRuleId', 'config'],
    },
  },
  {
    name: 'delete_property_rule',
    description: 'Delete a PropertySource (property rule) from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Permanently removes the module; properties it auto-assigned will no longer be maintained. Cannot be undone. ' +
      '\n\n**Related tools:** "get\\_property\\_rule" (review before delete).',
    annotations: { title: 'Delete property rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        propertyRuleId: { type: 'number', description: 'The PropertySource (property rule) ID to delete' },
      },
      additionalProperties: false,
      required: ['propertyRuleId'],
    },
  },
  {
    name: 'import_property_rule',
    description: 'Import a PropertySource (property rule) into LogicMonitor (LM) monitoring from JSON content. ' +
      '\n\n**What this does:** Uploads an exported PropertySource JSON definition as a multipart file. ' +
      '\n\n**Parameters:** ' +
      '\n- content: The full JSON module definition (as a string)' +
      '\n- handleConflict: how to resolve name conflicts (e.g., "all", "ignore")' +
      '\n- fieldsToPreserve: comma-separated fields to keep from the existing module' +
      '\n\n**Related tools:** "create\\_property\\_rule" (build from scratch).',
    annotations: { title: 'Import property rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON PropertySource definition content.' },
        handleConflict: { type: 'string', description: 'Conflict handling strategy (e.g., "all", "ignore").' },
        fieldsToPreserve: { type: 'string', description: 'Comma-separated fields to preserve from the existing module.' },
      },
      additionalProperties: false,
      required: ['content'],
    },
  },

];
