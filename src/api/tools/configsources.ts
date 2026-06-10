import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const configsourcesTools: Tool[] = [
  // ConfigSource Tools
  {
    name: 'list_configsources',
    description: 'List all ConfigSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of ConfigSources with: id, name, displayName, description, appliesTo logic, collection method. ' +
      '\n\n**What are ConfigSources:** Track configuration file changes for compliance and change management. Similar to datasources, but for configs instead of metrics. Alert when configs change unexpectedly. ' +
      '\n\n**When to use:** ' +
      '\n- Find ConfigSource for specific resource/device type (e.g., Cisco_IOS_Config)' +
      '\n- Discover what configs are being tracked' +
      '\n- Get ConfigSource IDs for API operations' +
      '\n- Audit configuration monitoring coverage' +
      '\n\n**What configs can be tracked:** ' +
      '\n- Network resources/devices: Router configs, switch configs, firewall rules' +
      '\n- Linux: /etc files, app configs, SSH authorized_keys' +
      '\n- Windows: Registry keys, security policies' +
      '\n- Cloud: Security groups, IAM policies' +
      '\n\n**Use cases:** ' +
      '\n- Compliance: "Alert when firewall rules change"' +
      '\n- Change management: "Who modified this router config?"' +
      '\n- Rollback: Compare current config to previous version' +
      '\n- Audit: "Show all config changes in last 30 days"' +
      '\n\n**Common ConfigSources:** ' +
      '\n- Cisco_IOS_Config: Cisco router/switch configs' +
      '\n- F5_LTM_Config: F5 load balancer configs' +
      '\n- Palo_Alto_Config: Palo Alto firewall rules' +
      '\n- Linux_Config_Files: Monitor /etc files' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_configsource" (details), "list_device_configs" (see configs for device).',
    annotations: {
      title: 'List ConfigSources',
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
    name: 'get_configsource',
    description: 'Get detailed information about a specific ConfigSource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete ConfigSource details: name, displayName, description, appliesTo logic (which resources/devices), collection method (CLI/SNMP/API), collection script, alert settings. ' +
      '\n\n**When to use:** ' +
      '\n- Understand what config is being collected' +
      '\n- Review appliesTo logic (why it does/doesn\'t apply to device)' +
      '\n- Check collection method' +
      '\n- Troubleshoot config collection issues' +
      '\n\n**Key information:** ' +
      '\n- appliesTo: Logic determining which resource/device get config tracking' +
      '\n- collectMethod: How config is retrieved (CLI commands, SNMP, API)' +
      '\n- configAlerts: Settings for when to alert on changes' +
      '\n- lineageId: Built-in (LogicMonitor) vs custom ConfigSource' +
      '\n\n**Workflow:** Use "list_configsources" to find configSourceId, then use this tool to understand how it works. ' +
      '\n\n**Related tools:** "list_configsources" (find ConfigSource), "list_device_configs" (see configs for device).',
    annotations: {
      title: 'Get ConfigSource details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        configSourceId: {
          type: 'number',
          description: 'The ID of the configuration source to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['configSourceId'],
    },
  },
  {
    name: 'create_configsource',
    description: 'Create a new ConfigSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a new configuration-monitoring module (ConfigSource) that collects and version-tracks device configuration files (e.g., network device running-config). ' +
      '\n\n**⚠️ ConfigSource definitions are complex.** They include collection scripts, appliesTo logic, config-change alerting, and collection schedules. The most reliable way to create one is to model it on an existing ConfigSource: use "get_configsource" to export a similar definition, adapt it, and pass the fields here (use `config` for any attributes not listed below). To re-import an exported ConfigSource file, use "import_configsource" instead. ' +
      '\n\n**Common parameters:**' +
      '\n- name: Unique ConfigSource name' +
      '\n- displayName: Human-friendly display name' +
      '\n- description: What this ConfigSource collects' +
      '\n- appliesTo: AppliesTo expression selecting which resources it runs on' +
      '\n- collectionMethod / collectionAttribute: How configuration is collected' +
      '\n- config: Any additional ConfigSource attributes (merged into the request body)' +
      '\n\n**Related tools:** "get_configsource" (export a template), "import_configsource" (import a file), "update_configsource", "delete_configsource".',
    annotations: {
      title: 'Create ConfigSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Unique ConfigSource name.',
        },
        displayName: {
          type: 'string',
          description: 'Human-friendly display name.',
        },
        description: {
          type: 'string',
          description: 'Description of what the ConfigSource collects.',
        },
        appliesTo: {
          type: 'string',
          description: 'AppliesTo expression selecting which resources the ConfigSource runs on.',
        },
        config: {
          type: 'object',
          description: 'Additional ConfigSource attributes (collection scripts, schedule, config-change alerting, etc.), merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_configsource',
    description: 'Update an existing ConfigSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies a ConfigSource definition (partial update - only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- configSourceId: The ID of the ConfigSource to update (from "list_configsources")' +
      '\n\n**Optional parameters:**' +
      '\n- name, displayName, description, appliesTo' +
      '\n- reason: An audit note recording why the ConfigSource was changed (stored in its update history)' +
      '\n- config: Any additional ConfigSource attributes to update (merged into the body)' +
      '\n\n**Best practice:** Use "get_configsource" first to review the current definition, then change only the needed fields. ' +
      '\n\n**Related tools:** "get_configsource" (review before update), "list_configsources" (find it), "delete_configsource".',
    annotations: {
      title: 'Update ConfigSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        configSourceId: {
          type: 'number',
          description: 'The ID of the ConfigSource to update.',
        },
        name: {
          type: 'string',
          description: 'New ConfigSource name.',
        },
        displayName: {
          type: 'string',
          description: 'New display name.',
        },
        description: {
          type: 'string',
          description: 'New description.',
        },
        appliesTo: {
          type: 'string',
          description: 'New AppliesTo expression.',
        },
        reason: {
          type: 'string',
          description: 'Audit note recording why the ConfigSource was changed (stored in update history).',
        },
        config: {
          type: 'object',
          description: 'Additional ConfigSource attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['configSourceId'],
    },
  },
  {
    name: 'delete_configsource',
    description: 'Delete a ConfigSource from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION**' +
      '\n- The ConfigSource definition is permanently removed' +
      '\n- Configuration collection for matching resources stops' +
      '\n- Historical config data associated with it may be lost' +
      '\n- Cannot be undone' +
      '\n\n**Required parameters:**' +
      '\n- configSourceId: The ID of the ConfigSource to delete (from "list_configsources")' +
      '\n\n**Before deleting:** Use "get_configsource" to verify it is the correct module and consider exporting its definition for backup. ' +
      '\n\n**Related tools:** "get_configsource" (backup/verify before delete), "list_configsources" (find it).',
    annotations: {
      title: 'Delete ConfigSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        configSourceId: {
          type: 'number',
          description: 'The ID of the ConfigSource to delete.',
        },
      },
      additionalProperties: false,
      required: ['configSourceId'],
    },
  },
  {
    name: 'import_configsource',
    description: 'Import a ConfigSource into LogicMonitor (LM) monitoring from an exported JSON or XML definition. ' +
      '\n\n**What this does:** Uploads a ConfigSource definition file (the kind exported from LogicMonitor or a community LogicModule) and creates/updates the ConfigSource. ' +
      '\n\n**Required parameters:**' +
      '\n- content: The full text content of the ConfigSource file (JSON or XML)' +
      '\n- format: "json" or "xml" - must match the content' +
      '\n\n**Optional parameters (JSON import only):**' +
      '\n- handleConflict: How to resolve conflicts with an existing module, e.g. "FORCE_OVERWRITE" or "PRESERVE_FIELDS"' +
      '\n- fieldsToPreserve: Comma-separated fields to preserve when overwriting (e.g. "APPLIES_TO,COLLECTION_INTERVAL")' +
      '\n\n**Tip:** To get a definition to import, use "get_configsource" on an existing module (export), or paste an exported file\'s contents. ' +
      '\n\n**Related tools:** "get_configsource" (export), "create_configsource" (create from structured fields), "list_configsources".',
    annotations: {
      title: 'Import ConfigSource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The full text content of the ConfigSource definition file (JSON or XML).',
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
          description: 'JSON import only: comma-separated fields to preserve when overwriting (e.g. "APPLIES_TO,COLLECTION_INTERVAL").',
        },
      },
      additionalProperties: false,
      required: ['content', 'format'],
    },
  },

  // ConfigSource update reasons
  {
    name: 'get_configsource_update_reasons',
    description: 'Get the update reasons (change history notes) for a ConfigSource in LogicMonitor (LM).',
    annotations: { title: 'Get ConfigSource update reasons', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        configSourceId: { type: 'number', description: 'The ConfigSource ID' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['configSourceId'],
    },
  },

];
