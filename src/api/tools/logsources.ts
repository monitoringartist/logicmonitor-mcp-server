import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const logsourcesTools: Tool[] = [
  // LogSources
  {
    name: 'list_logsources',
    description: 'List LogSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are LogSources:** Modules that define how logs are collected, parsed, filtered, and mapped to resources for LM Logs. ' +
      '\n\n**Returns:** Array of logsources with id, name, description, collectionMethod, appliesTo. ' +
      '\n\n**Related tools:** "get\\_logsource", "create\\_logsource".',
    annotations: { title: 'List logsources', readOnlyHint: true },
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
    name: 'get_logsource',
    description: 'Get details of a specific LogSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Full config: name, collectionMethod, appliesToScript, resourceMapping, filters, logFields, sensitiveDataMaskingRules. ' +
      '\n\n**Related tools:** "list\\_logsources", "update\\_logsource".',
    annotations: { title: 'Get logsource', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        logSourceId: { type: 'number', description: 'The LogSource ID' },
        format: { type: 'string', description: 'Optional response format.' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['logSourceId'],
    },
  },
  {
    name: 'create_logsource',
    description: 'Create a LogSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines how logs are collected, parsed, filtered, and mapped to resources for LM Logs. ' +
      '\n\n**⚠️ LogSources are complex modules.** The most reliable approach is to export an existing one via "get\\_logsource", adapt it, and pass the full definition via `config`. ' +
      '\n\n**Required:** a `config` containing at least `name`, `collectionMethod`, and `appliesToScript`. ' +
      '\n\n**Tip:** For sharing/distributing prefer "import\\_logsource" with official JSON. ' +
      '\n\n**Related tools:** "get\\_logsource", "update\\_logsource", "import\\_logsource".',
    annotations: { title: 'Create logsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: 'Full LogSource definition (name, collectionMethod, appliesToScript, resourceMapping, filters, logFields, etc.).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_logsource',
    description: 'Update a LogSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** logSourceId and a `config` with fields to change. Partial update. Optional `reason` (audit note). ' +
      '\n\n**Best practice:** Review with "get\\_logsource" first. ' +
      '\n\n**Related tools:** "get\\_logsource", "list\\_logsources".',
    annotations: { title: 'Update logsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logSourceId: { type: 'number', description: 'The LogSource ID' },
        config: {
          type: 'object',
          description: 'LogSource fields to update (merged into the request body).',
          additionalProperties: true,
        },
        reason: { type: 'string', description: 'Audit reason for the update.' },
      },
      additionalProperties: false,
      required: ['logSourceId', 'config'],
    },
  },
  {
    name: 'delete_logsource',
    description: 'Delete a LogSource from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Permanently removes the module; log collection it provided will stop. Cannot be undone. ' +
      '\n\n**Related tools:** "get\\_logsource" (review before delete).',
    annotations: { title: 'Delete logsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logSourceId: { type: 'number', description: 'The LogSource ID to delete' },
      },
      additionalProperties: false,
      required: ['logSourceId'],
    },
  },
  {
    name: 'import_logsource',
    description: 'Import a LogSource into LogicMonitor (LM) monitoring from JSON content. ' +
      '\n\n**What this does:** Uploads an exported LogSource JSON definition as a multipart file. ' +
      '\n\n**Parameters:** ' +
      '\n- content: The full JSON module definition (as a string)' +
      '\n- handleConflict: how to resolve name conflicts (e.g., "all", "ignore")' +
      '\n- fieldsToPreserve: comma-separated fields to keep from the existing module' +
      '\n\n**Related tools:** "create\\_logsource" (build from scratch).',
    annotations: { title: 'Import logsource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON LogSource definition content.' },
        handleConflict: { type: 'string', description: 'Conflict handling strategy (e.g., "all", "ignore").' },
        fieldsToPreserve: { type: 'string', description: 'Comma-separated fields to preserve from the existing module.' },
      },
      additionalProperties: false,
      required: ['content'],
    },
  },

  // Log Pipelines / Log Alert Groups
  {
    name: 'list_log_alert_groups',
    description: 'List log alert pipelines (log alert groups) in LogicMonitor (LM). ' +
      '\n\n**What this does:** Returns log pipelines used to organize log alert processors. ' +
      '\n\n**Related tools:** "get\\_log\\_alert\\_group", "list\\_log\\_alerts".',
    annotations: { title: 'List log alert groups', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_log_alert_group',
    description: 'Get a specific log alert pipeline (log alert group) by ID in LogicMonitor (LM).',
    annotations: { title: 'Get log alert group', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { logAlertGroupId: { type: 'number', description: 'The log alert group (pipeline) ID' }, ...fieldsSchema },
      additionalProperties: false,
      required: ['logAlertGroupId'],
    },
  },
  {
    name: 'create_log_alert_group',
    description: 'Create a log alert pipeline (log alert group) in LogicMonitor (LM). Provide pipeline attributes via "config".',
    annotations: { title: 'Create log alert group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Log pipeline attributes (name, description, filters, etc.).' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_log_alert_group',
    description: 'Update a log alert pipeline (log alert group) in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update log alert group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logAlertGroupId: { type: 'number', description: 'The log alert group (pipeline) ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['logAlertGroupId', 'config'],
    },
  },
  {
    name: 'delete_log_alert_group',
    description: 'Delete a log alert pipeline (log alert group) by ID in LogicMonitor (LM).',
    annotations: { title: 'Delete log alert group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { logAlertGroupId: { type: 'number', description: 'The log alert group (pipeline) ID' } },
      additionalProperties: false,
      required: ['logAlertGroupId'],
    },
  },
  {
    name: 'list_log_alerts',
    description: 'List log alerts (log pipeline processors) in LogicMonitor (LM).',
    annotations: { title: 'List log alerts', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_log_alert',
    description: 'Get a specific log alert (log pipeline processor) by ID in LogicMonitor (LM).',
    annotations: { title: 'Get log alert', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { logAlertId: { type: 'number', description: 'The log alert (pipeline processor) ID' }, ...fieldsSchema },
      additionalProperties: false,
      required: ['logAlertId'],
    },
  },
  {
    name: 'create_log_alert',
    description: 'Create a log alert (log pipeline processor) in LogicMonitor (LM). Provide processor attributes via "config".',
    annotations: { title: 'Create log alert', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Log processor attributes (name, conditions, severity, etc.).' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_log_alert',
    description: 'Update a log alert (log pipeline processor) in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update log alert', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logAlertId: { type: 'number', description: 'The log alert (pipeline processor) ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['logAlertId', 'config'],
    },
  },
  {
    name: 'delete_log_alert',
    description: 'Delete a log alert (log pipeline processor) by ID in LogicMonitor (LM).',
    annotations: { title: 'Delete log alert', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { logAlertId: { type: 'number', description: 'The log alert (pipeline processor) ID' } },
      additionalProperties: false,
      required: ['logAlertId'],
    },
  },
  {
    name: 'set_log_alert_status',
    description: 'Enable or disable a log alert (log pipeline processor) in LogicMonitor (LM). ' +
      '\n\n**Parameters:** logAlertId and action (e.g., "enable"/"disable"); optional "config" body.',
    annotations: { title: 'Set log alert status', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logAlertId: { type: 'number', description: 'The log alert (pipeline processor) ID' },
        action: { type: 'string', description: 'The action to perform (e.g., enable, disable).' },
        config: { type: 'object', additionalProperties: true, description: 'Optional request body.' },
      },
      additionalProperties: false,
      required: ['logAlertId', 'action'],
    },
  },

  // Log Query Groups
  {
    name: 'list_log_query_groups',
    description: 'List log query groups in LogicMonitor (LM).',
    annotations: { title: 'List log query groups', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_log_query_group',
    description: 'Get a specific log query group by ID in LogicMonitor (LM).',
    annotations: { title: 'Get log query group', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { logQueryGroupId: { type: 'number', description: 'The log query group ID' }, ...fieldsSchema },
      additionalProperties: false,
      required: ['logQueryGroupId'],
    },
  },
  {
    name: 'create_log_query_group',
    description: 'Create a log query group in LogicMonitor (LM). Provide attributes via "config".',
    annotations: { title: 'Create log query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Log query group attributes.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_log_query_group',
    description: 'Update a log query group in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update log query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logQueryGroupId: { type: 'number', description: 'The log query group ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['logQueryGroupId', 'config'],
    },
  },
  {
    name: 'delete_log_query_group',
    description: 'Delete a log query group by ID in LogicMonitor (LM).',
    annotations: { title: 'Delete log query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { logQueryGroupId: { type: 'number', description: 'The log query group ID' } },
      additionalProperties: false,
      required: ['logQueryGroupId'],
    },
  },
  {
    name: 'list_log_query_group_queries',
    description: 'List the log queries within a log query group in LogicMonitor (LM).',
    annotations: { title: 'List log query group queries', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { logQueryGroupId: { type: 'number', description: 'The log query group ID' }, ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
      required: ['logQueryGroupId'],
    },
  },
  {
    name: 'list_log_query_groups_by_type',
    description: 'List log query groups filtered by group type in LogicMonitor (LM).',
    annotations: { title: 'List log query groups by type', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupType: { type: 'string', description: 'The group type to filter by.' },
        allGroups: { type: 'boolean', description: 'Whether to include all groups.' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupType'],
    },
  },
  {
    name: 'move_log_queries',
    description: 'Move log queries into a target log query group in LogicMonitor (LM). Provide the move payload via "config".',
    annotations: { title: 'Move log queries', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logQueryGroupId: { type: 'number', description: 'The target log query group ID' },
        config: { type: 'object', additionalProperties: true, description: 'Move payload (e.g., list of query IDs).' },
      },
      additionalProperties: false,
      required: ['logQueryGroupId', 'config'],
    },
  },

  // Log Partitions
  {
    name: 'list_log_partitions',
    description: 'List log partitions in LogicMonitor (LM).',
    annotations: { title: 'List log partitions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_log_partition',
    description: 'Get a specific log partition by ID in LogicMonitor (LM).',
    annotations: { title: 'Get log partition', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { logPartitionId: { type: 'number', description: 'The log partition ID' }, ...fieldsSchema },
      additionalProperties: false,
      required: ['logPartitionId'],
    },
  },
  {
    name: 'create_log_partition',
    description: 'Create a log partition in LogicMonitor (LM). Provide attributes via "config".',
    annotations: { title: 'Create log partition', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Log partition attributes (name, description, retention, etc.).' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_log_partition',
    description: 'Update a log partition in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update log partition', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logPartitionId: { type: 'number', description: 'The log partition ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['logPartitionId', 'config'],
    },
  },
  {
    name: 'delete_log_partition',
    description: 'Delete a log partition by ID in LogicMonitor (LM).',
    annotations: { title: 'Delete log partition', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { logPartitionId: { type: 'number', description: 'The log partition ID' } },
      additionalProperties: false,
      required: ['logPartitionId'],
    },
  },
  {
    name: 'get_log_partition_retentions',
    description: 'Get the available log partition retention options in LogicMonitor (LM).',
    annotations: { title: 'Get log partition retentions', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'log_partition_action',
    description: 'Perform an action on a log partition (e.g., pause/resume) in LogicMonitor (LM). ' +
      '\n\n**Parameters:** logPartitionId and action; optional "config" body.',
    annotations: { title: 'Log partition action', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        logPartitionId: { type: 'number', description: 'The log partition ID' },
        action: { type: 'string', description: 'The action to perform.' },
        config: { type: 'object', additionalProperties: true, description: 'Optional request body.' },
      },
      additionalProperties: false,
      required: ['logPartitionId', 'action'],
    },
  },

  // Tracked Query Groups
  {
    name: 'list_tracked_query_groups',
    description: 'List tracked query groups (log analysis) in LogicMonitor (LM).',
    annotations: { title: 'List tracked query groups', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_tracked_query_group',
    description: 'Get a specific tracked query group by ID in LogicMonitor (LM).',
    annotations: { title: 'Get tracked query group', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { trackedQueryGroupId: { type: 'number', description: 'The tracked query group ID' }, ...fieldsSchema },
      additionalProperties: false,
      required: ['trackedQueryGroupId'],
    },
  },
  {
    name: 'create_tracked_query_group',
    description: 'Create a tracked query group in LogicMonitor (LM). Provide attributes via "config".',
    annotations: { title: 'Create tracked query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { config: { type: 'object', additionalProperties: true, description: 'Tracked query group attributes.' } },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_tracked_query_group',
    description: 'Update a tracked query group in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update tracked query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        trackedQueryGroupId: { type: 'number', description: 'The tracked query group ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['trackedQueryGroupId', 'config'],
    },
  },
  {
    name: 'delete_tracked_query_group',
    description: 'Delete a tracked query group by ID in LogicMonitor (LM).',
    annotations: { title: 'Delete tracked query group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { trackedQueryGroupId: { type: 'number', description: 'The tracked query group ID' } },
      additionalProperties: false,
      required: ['trackedQueryGroupId'],
    },
  },

];
