import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const diagnosticsTools: Tool[] = [
  // DiagnosticSources
  {
    name: 'list_diagnosticsources',
    description: 'List DiagnosticSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are DiagnosticSources:** LogicModules that gather diagnostic data on demand (e.g., when an alert fires) to aid troubleshooting. ' +
      '\n\n**Related tools:** "get\\_diagnosticsource", "create\\_diagnosticsource".',
    annotations: { title: 'List diagnosticsources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_diagnosticsource',
    description: 'Get details of a specific DiagnosticSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list\\_diagnosticsources".',
    annotations: { title: 'Get diagnosticsource', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        diagnosticSourceId: { type: 'number', description: 'The DiagnosticSource ID' },
        format: { type: 'string', description: 'Response format (e.g., "file").' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['diagnosticSourceId'],
    },
  },
  {
    name: 'create_diagnosticsource',
    description: 'Create a DiagnosticSource in LogicMonitor (LM) monitoring. Definition passed via `config`. ' +
      '\n\n**Related tools:** "get\\_diagnosticsource" (template), "import\\_diagnosticsource".',
    annotations: { title: 'Create diagnosticsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The DiagnosticSource definition.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_diagnosticsource',
    description: 'Update a DiagnosticSource in LogicMonitor (LM) monitoring. Partial update via `config`. ' +
      '\n\n**Parameters:** diagnosticSourceId, `config`, optional reason. ',
    annotations: { title: 'Update diagnosticsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        diagnosticSourceId: { type: 'number', description: 'The DiagnosticSource ID to update' },
        reason: { type: 'string', description: 'Optional audit reason.' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['diagnosticSourceId', 'config'],
    },
  },
  {
    name: 'delete_diagnosticsource',
    description: 'Delete a DiagnosticSource from LogicMonitor (LM) monitoring. Cannot be undone. ',
    annotations: { title: 'Delete diagnosticsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        diagnosticSourceId: { type: 'number', description: 'The DiagnosticSource ID to delete' },
      },
      additionalProperties: false,
      required: ['diagnosticSourceId'],
    },
  },
  {
    name: 'import_diagnosticsource',
    description: 'Import a DiagnosticSource definition (JSON) into LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Import diagnosticsource', readOnlyHint: false },
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
  {
    name: 'execute_diagnosticsource',
    description: 'Manually execute a DiagnosticSource in LogicMonitor (LM) monitoring to gather diagnostic data on demand. ' +
      '\n\n**Parameters:** the execution request via `config` (e.g., deviceId, deviceDataSourceId / instance to run against). ',
    annotations: { title: 'Execute diagnosticsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The DiagnosticsSourceExecution request body.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },

  // RemediationSources
  {
    name: 'list_remediationsources',
    description: 'List RemediationSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are RemediationSources:** LogicModules that run automated remediation actions (scripts) in response to alerts. ' +
      '\n\n**Related tools:** "get\\_remediationsource", "execute\\_remediation".',
    annotations: { title: 'List remediationsources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_remediationsource',
    description: 'Get details of a specific RemediationSource in LogicMonitor (LM) monitoring. ',
    annotations: { title: 'Get remediationsource', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        remediationSourceId: { type: 'number', description: 'The RemediationSource ID' },
        format: { type: 'string', description: 'Response format (e.g., "file").' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['remediationSourceId'],
    },
  },
  {
    name: 'create_remediationsource',
    description: 'Create a RemediationSource in LogicMonitor (LM) monitoring. Definition via `config`. ',
    annotations: { title: 'Create remediationsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The RemediationSource definition.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_remediationsource',
    description: 'Update a RemediationSource in LogicMonitor (LM) monitoring. Partial update via `config`. Optional reason. ',
    annotations: { title: 'Update remediationsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        remediationSourceId: { type: 'number', description: 'The RemediationSource ID to update' },
        reason: { type: 'string', description: 'Optional audit reason.' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['remediationSourceId', 'config'],
    },
  },
  {
    name: 'delete_remediationsource',
    description: 'Delete a RemediationSource from LogicMonitor (LM) monitoring. Cannot be undone. ',
    annotations: { title: 'Delete remediationsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        remediationSourceId: { type: 'number', description: 'The RemediationSource ID to delete' },
      },
      additionalProperties: false,
      required: ['remediationSourceId'],
    },
  },
  {
    name: 'execute_remediation',
    description: 'Manually execute a RemediationSource remediation action in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** This runs a remediation script/action against a target — verify the target before executing. ' +
      '\n\n**Parameters:** the execution request via `config`. ',
    annotations: { title: 'Execute remediation', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The RemediationSourceExecution request body.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },

  // Diagnostic Remediation
  {
    name: 'get_diagnostic_remediation_sources',
    description: 'List diagnostic remediation sources applicable to a resource/alert in LogicMonitor (LM).',
    annotations: { title: 'Get diagnostic remediation sources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        resourceId: { type: 'number', description: 'The resource/device ID.' },
        alertId: { type: 'string', description: 'The alert ID.' },
        moduleType: { type: 'string', description: 'The module type.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_diagnostic_remediation_results',
    description: 'Get diagnostic remediation execution results in LogicMonitor (LM).',
    annotations: { title: 'Get diagnostic remediation results', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        resourceId: { type: 'number', description: 'The resource/device ID.' },
        alertId: { type: 'string', description: 'The alert ID.' },
        taskId: { type: 'string', description: 'The remediation task ID.' },
      },
      additionalProperties: false,
    },
  },

];
