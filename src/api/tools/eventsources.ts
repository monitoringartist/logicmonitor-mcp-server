import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const eventsourcesTools: Tool[] = [
  // EventSources
  {
    name: 'list_eventsources',
    description: 'List all EventSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of EventSources with: id, name, displayName, description, appliesTo logic, event collection method. ' +
      '\n\n**What are EventSources:** Collect and process event data (logs, Windows events, syslog, traps). Different from DataSources (metrics) and ConfigSources (configs). Used for log monitoring and event correlation. ' +
      '\n\n**When to use:**' +
      '\n- Find EventSource for log monitoring' +
      '\n- Discover what events are being collected' +
      '\n- Get EventSource IDs for operations' +
      '\n- Audit event monitoring coverage' +
      '\n' +
      '\n\n**Event types collected:** ' +
      '\n- Windows Event Logs: Application, Security, System logs ' +
      '\n- Syslog: Linux/Unix system logs, network resource/device logs ' +
      '\n- SNMP Traps: Network resource/device alerts and notifications ' +
      '\n- Application logs: Custom app logs, web server logs ' +
      '\n- Cloud events: CloudWatch logs, Azure events ' +
      '\n\n**Common EventSources:** ' +
      '\n- Windows_Application_EventLog: Windows application events ' +
      '\n- Windows_Security_EventLog: Security/audit logs ' +
      '\n- Linux_Syslog: Linux system logs via syslog ' +
      '\n- SNMP_Traps: Network resource/device SNMP traps ' +
      '\n- VMware_Events: vCenter events ' +
      '\n\n**Use cases:** ' +
      '\n- Monitor Windows failed login attempts ' +
      '\n- Alert on ERROR/CRITICAL in application logs ' +
      '\n- Collect network resource/device syslog for troubleshooting ' +
      '\n- Track security events for compliance ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_eventsource" (details), "list_device_eventsources" (events for device).',
    annotations: {
      title: 'List EventSources',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_eventsource',
    description: 'Get detailed information about a specific EventSource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete EventSource details: name, displayName, description, appliesTo logic, collection method, filter rules, severity mapping, alert settings. ' +
      '\n\n**When to use:**' +
      '\n- Understand what events are collected' +
      '\n- Review filter rules (which events trigger alerts)' +
      '\n- Check severity mapping' +
      '\n- Troubleshoot event collection' +
      '\n- See appliesTo logic' +
      '\n' +
      '\n\n**Key information:** ' +
      '\n- appliesTo: Which resources/devicesget event monitoring ' +
      '\n- filters: Rules for parsing/matching events ' +
      '\n- severityMapping: Map event levels (INFO/WARN/ERROR) to LM alert levels ' +
      '\n- schedule: When event collection runs ' +
      '\n\n**Workflow:** Use "list_eventsources" to find eventSourceId, then use this tool for complete configuration. ' +
      '\n\n**Related tools:** "list_eventsources" (find EventSource), "list_device_eventsources" (events for device).',
    annotations: {
      title: 'Get EventSource details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        eventSourceId: {
          type: 'number',
          description: 'The ID of the eventsource to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['eventSourceId'],
    },
  },
  {
    name: 'create_eventsource',
    description: 'Create a new EventSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a new event-monitoring module (EventSource) that collects events (e.g., SNMP traps, Windows event logs, syslog) and maps them to LogicMonitor alerts. ' +
      '\n\n**⚠️ EventSource definitions are complex** (collection method, filters, severity mapping, appliesTo). The most reliable way to create one is to model it on an existing EventSource: use "get_eventsource" to export a similar definition, adapt it, and pass the fields here (use `config` for attributes not listed below). To re-import an exported EventSource file, use "import_eventsource". ' +
      '\n\n**Common parameters:**' +
      '\n- name: Unique EventSource name' +
      '\n- description: What events this collects' +
      '\n- appliesTo: AppliesTo expression selecting which resources it runs on' +
      '\n- collector: The collection mechanism (e.g., "scriptevent", "snmptrap", "eventlog", "syslog")' +
      '\n- config: Any additional EventSource attributes (filters, severity mapping, schedule), merged into the request body' +
      '\n\n**Related tools:** "get_eventsource" (export a template), "import_eventsource" (import a file), "update_eventsource", "delete_eventsource".',
    annotations: {
      title: 'Create EventSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Unique EventSource name.',
        },
        description: {
          type: 'string',
          description: 'Description of what events the EventSource collects.',
        },
        appliesTo: {
          type: 'string',
          description: 'AppliesTo expression selecting which resources the EventSource runs on.',
        },
        collector: {
          type: 'string',
          description: 'The collection mechanism (e.g., "scriptevent", "snmptrap", "eventlog", "syslog").',
        },
        config: {
          type: 'object',
          description: 'Additional EventSource attributes (filters, severity mapping, schedule), merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_eventsource',
    description: 'Update an existing EventSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies an EventSource definition (partial update - only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- eventSourceId: The ID of the EventSource to update (from "list_eventsources")' +
      '\n\n**Optional parameters:**' +
      '\n- name, description, appliesTo, collector' +
      '\n- config: Any additional EventSource attributes to update (merged into the body)' +
      '\n\n**Best practice:** Use "get_eventsource" first to review the current definition, then change only the needed fields. ' +
      '\n\n**Related tools:** "get_eventsource" (review before update), "list_eventsources" (find it), "delete_eventsource".',
    annotations: {
      title: 'Update EventSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        eventSourceId: {
          type: 'number',
          description: 'The ID of the EventSource to update.',
        },
        name: {
          type: 'string',
          description: 'New EventSource name.',
        },
        description: {
          type: 'string',
          description: 'New description.',
        },
        appliesTo: {
          type: 'string',
          description: 'New AppliesTo expression.',
        },
        collector: {
          type: 'string',
          description: 'New collection mechanism.',
        },
        config: {
          type: 'object',
          description: 'Additional EventSource attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['eventSourceId'],
    },
  },
  {
    name: 'delete_eventsource',
    description: 'Delete an EventSource from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION**' +
      '\n- The EventSource definition is permanently removed' +
      '\n- Event collection for matching resources stops' +
      '\n- Cannot be undone' +
      '\n\n**Required parameters:**' +
      '\n- eventSourceId: The ID of the EventSource to delete (from "list_eventsources")' +
      '\n\n**Before deleting:** Use "get_eventsource" to verify it is the correct module and consider exporting its definition for backup. ' +
      '\n\n**Related tools:** "get_eventsource" (backup/verify before delete), "list_eventsources" (find it).',
    annotations: {
      title: 'Delete EventSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        eventSourceId: {
          type: 'number',
          description: 'The ID of the EventSource to delete.',
        },
      },
      additionalProperties: false,
      required: ['eventSourceId'],
    },
  },
  {
    name: 'import_eventsource',
    description: 'Import an EventSource into LogicMonitor (LM) monitoring from an exported JSON or XML definition. ' +
      '\n\n**What this does:** Uploads an EventSource definition file (exported from LogicMonitor or a community LogicModule) and creates/updates the EventSource. ' +
      '\n\n**Required parameters:**' +
      '\n- content: The full text content of the EventSource file (JSON or XML)' +
      '\n- format: "json" or "xml" - must match the content' +
      '\n\n**Optional parameters (JSON import only):**' +
      '\n- handleConflict: How to resolve conflicts with an existing module, e.g. "FORCE_OVERWRITE" or "PRESERVE_FIELDS"' +
      '\n- fieldsToPreserve: Comma-separated fields to preserve when overwriting (e.g. "APPLIES_TO,ACTIVE_DISCOVERY")' +
      '\n\n**Tip:** To get a definition to import, use "get_eventsource" on an existing module (export), or paste an exported file\'s contents. ' +
      '\n\n**Related tools:** "get_eventsource" (export), "create_eventsource" (create from structured fields), "list_eventsources".',
    annotations: {
      title: 'Import EventSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The full text content of the EventSource definition file (JSON or XML).',
        },
        format: {
          type: 'string',
          enum: ['json', 'xml'],
          description: 'The format of the content: "json" or "xml".',
        },
        handleConflict: {
          type: 'string',
          description: 'JSON import only: conflict-resolution strategy, e.g. "FORCE_OVERWRITE" or "PRESERVE_FIELDS".',
        },
        fieldsToPreserve: {
          type: 'string',
          description: 'JSON import only: comma-separated fields to preserve when overwriting.',
        },
      },
      additionalProperties: false,
      required: ['content', 'format'],
    },
  },

];
