import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const jobMonitorsTools: Tool[] = [
  // Job Monitors (BatchJobs)
  {
    name: 'list_job_monitors',
    description: 'List Job Monitors (BatchJobs) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are Job Monitors:** Definitions for monitoring scheduled/batch jobs (cron tasks, ETL jobs) — tracking execution status, duration, and output. ' +
      '\n\n**Related tools:** "get_job_monitor", "create_job_monitor".',
    annotations: { title: 'List job monitors', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        format: { type: 'string', description: 'Response format (e.g., "file" for export).' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_job_monitor',
    description: 'Get details of a specific Job Monitor (BatchJob) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list_job_monitors", "update_job_monitor".',
    annotations: { title: 'Get job monitor', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        jobMonitorId: { type: 'number', description: 'The Job Monitor ID' },
        format: { type: 'string', description: 'Response format (e.g., "file").' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['jobMonitorId'],
    },
  },
  {
    name: 'create_job_monitor',
    description: 'Create a Job Monitor (BatchJob) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Required:** the BatchJob definition via `config` (name, collector, command/script, schedule, alert thresholds, etc.). ' +
      '\n\n**Related tools:** "get_job_monitor" (template), "import_job_monitor".',
    annotations: { title: 'Create job monitor', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The BatchJob definition merged into the request body.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_job_monitor',
    description: 'Update a Job Monitor (BatchJob) in LogicMonitor (LM) monitoring. Partial update via `config`. ' +
      '\n\n**Parameters:** jobMonitorId, `config` (fields to change), optional reason (audit note). ' +
      '\n\n**Related tools:** "get_job_monitor".',
    annotations: { title: 'Update job monitor', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        jobMonitorId: { type: 'number', description: 'The Job Monitor ID to update' },
        reason: { type: 'string', description: 'Optional audit reason for the change.' },
        config: { type: 'object', additionalProperties: true, description: 'BatchJob fields to update.' },
      },
      additionalProperties: false,
      required: ['jobMonitorId', 'config'],
    },
  },
  {
    name: 'delete_job_monitor',
    description: 'Delete a Job Monitor (BatchJob) from LogicMonitor (LM) monitoring. Cannot be undone. ' +
      '\n\n**Related tools:** "get_job_monitor", "list_job_monitors".',
    annotations: { title: 'Delete job monitor', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        jobMonitorId: { type: 'number', description: 'The Job Monitor ID to delete' },
      },
      additionalProperties: false,
      required: ['jobMonitorId'],
    },
  },
  {
    name: 'import_job_monitor',
    description: 'Import a Job Monitor (BatchJob) definition into LogicMonitor (LM) monitoring from JSON or XML content. ' +
      '\n\n**Parameters:** content (the JSON/XML text), format ("json" or "xml"), optional handleConflict/fieldsToPreserve (JSON only). ' +
      '\n\n**Related tools:** "create_job_monitor".',
    annotations: { title: 'Import job monitor', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The JSON or XML definition content to import.' },
        format: { type: 'string', enum: ['json', 'xml'], description: 'The import format.' },
        handleConflict: { type: 'string', description: 'Conflict handling (JSON import).' },
        fieldsToPreserve: { type: 'string', description: 'Fields to preserve on conflict (JSON import).' },
      },
      additionalProperties: false,
      required: ['content', 'format'],
    },
  },

];
