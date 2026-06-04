import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const datasourcesTools: Tool[] = [
  // DataSource Tools
  {
    name: 'list_datasources',
    description: 'List all available datasources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of datasources with: id, name, displayName, description, appliesTo (which resource/device it monitors), collection method, datapoints/metrics collected. ' +
      '\n\n**What are datasources:** Templates that define WHAT to monitor (e.g., CPU, memory, disk), HOW to collect it (SNMP, WMI, API), and WHEN to alert. LogicMonitor has 2000+ pre-built datasources for common technologies. ' +
      '\n\n**When to use:** ' +
      '\n- Find datasource for specific technology (e.g., "AWS\\_EC2", "VMware\\_vCenter")' +
      '\n- Discover what can be monitored' +
      '\n- Get datasource IDs for API operations' +
      '\n- Browse monitoring capabilities' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"name\\~\\*CPU\\*" or filter:"displayName\\~\\*Memory\\*"' +
      '\n- Cloud providers: filter:"name\\~\\*AWS\\*" or filter:"name\\~\\*Azure\\*"' +
      '\n- Database: filter:"name\\~\\*MySQL\\*" or filter:"name\\~\\*SQL\\_Server\\*"' +
      '\n- Network: filter:"name\\~\\*Cisco\\*" or filter:"name\\~\\*SNMP\\*"' +
      '\n\n**Examples:** AWS\\_EC2 (monitors EC2 instances), SNMP\\_Network\\_Interfaces (network stats), WinCPU (Windows CPU), Linux\\_SSH (Linux via SSH). ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_datasource" (details), "list\\_resource\\_datasources" (see what\'s applied to specific resource/device).',
    annotations: {
      title: 'List datasources',
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
    name: 'get_datasource',
    description: 'Get detailed information about a specific datasource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete datasource details: name, displayName, description, appliesTo logic, collection method, datapoints (metrics), thresholds, alert rules, polling interval. ' +
      '\n\n**When to use:** ' +
      '\n- Understand what datasource monitors' +
      '\n- Review alert thresholds' +
      '\n- See collection method (SNMP/WMI/API/script)' +
      '\n- Check datapoint definitions' +
      '\n- Troubleshoot why datasource applies/doesn\'t apply to device' +
      '\n\n**Key information returned:** ' +
      '\n- appliesTo: Logic determining which resource/device get this datasource (e.g., "system.hostname =\\~\\"\\*prod\\*\\"")' +
      '\n- dataSourceType: Collection method (SNMP, WMI, JDBC, API, script)' +
      '\n- dataPoints: List of metrics collected (e.g., CPUBusyPercent, MemoryUsedPercent)' +
      '\n- alertExpr: Threshold formulas (when to alert)' +
      '\n- collectInterval: How often data is collected (seconds)' +
      '\n\n**Understanding appliesTo logic:** Shows why datasource does/doesn\'t monitor certain resources/devices. Common patterns: ' +
      '\n- isWindows() - Only Windows resource/device' +
      '\n- system.devicetype == "server" - Only servers' +
      '\n- hasCategory("AWS/EC2") - Only AWS EC2 instances' +
      '\n\n**Workflow:** Use "list\\_datasources" to find dataSourceId, then use this tool to understand how it works. ' +
      '\n\n**Related tools:** "list\\_datasources" (find datasource), "list\\_resource\\_datasources" (see which resource/device use it).',
    annotations: {
      title: 'Get datasource details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: {
          type: 'number',
          description: 'The ID of the datasource to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dataSourceId'],
    },
  },
  {
    name: 'create_datasource',
    description: 'Create a new DataSource (LogicModule) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a new monitoring module: collection method, appliesTo logic, datapoints, graphs, and alert thresholds. ' +
      '\n\n**⚠️ DataSources are complex, type-specific modules.** The most reliable approach is to export an existing similar DataSource via "get\\_datasource" (with `fields: "*"`), adapt it, and pass the full definition via `config`. ' +
      '\n\n**Required:** a `config` object containing at least `name`, `collector` (collection method), and `appliesTo`. ' +
      '\n\n**Optional:** `createGraph` (boolean) to auto-create default graphs. ' +
      '\n\n**Tip:** For sharing/distributing modules prefer "import\\_datasource" with official XML/JSON. ' +
      '\n\n**Related tools:** "get\\_datasource", "update\\_datasource", "import\\_datasource".',
    annotations: { title: 'Create datasource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          description: 'Full DataSource definition (name, collector, appliesTo, dataPoints, datapoints graphs, collectInterval, etc.).',
          additionalProperties: true,
        },
        createGraph: { type: 'boolean', description: 'Auto-create default graphs for the datasource.' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'update_datasource',
    description: 'Update an existing DataSource (LogicModule) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** dataSourceId and a `config` with the fields to change. Partial update. ' +
      '\n\n**Optional:** `reason` (audit reason for the change), `forceUniqueIdentifier`. ' +
      '\n\n**⚠️ Caution:** Editing a built-in/LogicMonitor-managed DataSource may require a `reason` and can be overwritten by future module updates. Review with "get\\_datasource" first. ' +
      '\n\n**Related tools:** "get\\_datasource", "list\\_datasource\\_update\\_reasons".',
    annotations: { title: 'Update datasource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The ID of the datasource to update' },
        config: {
          type: 'object',
          description: 'DataSource fields to update (merged into the request body).',
          additionalProperties: true,
        },
        reason: { type: 'string', description: 'Audit reason for the update.' },
        forceUniqueIdentifier: { type: 'boolean', description: 'Force a unique identifier when needed.' },
      },
      additionalProperties: false,
      required: ['dataSourceId', 'config'],
    },
  },
  {
    name: 'delete_datasource',
    description: 'Delete a DataSource (LogicModule) from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Permanently removes the module and stops all monitoring it provided across every applied device. Historical data may be lost. Cannot be undone. ' +
      '\n\n**Before deleting:** Use "list\\_datasource\\_devices" to see how many resources rely on it. ' +
      '\n\n**Related tools:** "get\\_datasource", "list\\_datasource\\_devices".',
    annotations: { title: 'Delete datasource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The ID of the datasource to delete' },
      },
      additionalProperties: false,
      required: ['dataSourceId'],
    },
  },
  {
    name: 'import_datasource',
    description: 'Import a DataSource (LogicModule) into LogicMonitor (LM) monitoring from XML or JSON content. ' +
      '\n\n**What this does:** Uploads an exported DataSource definition (e.g., from the LM repository or another portal) as a multipart file. ' +
      '\n\n**Parameters:** ' +
      '\n- content: The full XML or JSON module definition (as a string)' +
      '\n- format: "xml" or "json"' +
      '\n- handleConflict (JSON only): how to resolve name conflicts (e.g., "all", "ignore")' +
      '\n- fieldsToPreserve (JSON only): comma-separated fields to keep from the existing module' +
      '\n\n**Related tools:** "create\\_datasource" (build from scratch), "get\\_datasource".',
    annotations: { title: 'Import datasource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The XML or JSON DataSource definition content.' },
        format: { type: 'string', enum: ['xml', 'json'], description: 'The content format: "xml" or "json".' },
        handleConflict: { type: 'string', description: 'JSON import only: conflict handling strategy.' },
        fieldsToPreserve: { type: 'string', description: 'JSON import only: comma-separated fields to preserve.' },
      },
      additionalProperties: false,
      required: ['content', 'format'],
    },
  },
  {
    name: 'list_datasource_overview_graphs',
    description: 'List overview graphs defined on a DataSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are overview graphs:** Aggregate graphs that summarize data across all instances of the datasource on a device. ' +
      '\n\n**Related tools:** "get\\_datasource\\_overview\\_graph", "get\\_datasource".',
    annotations: { title: 'List datasource overview graphs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The datasource ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dataSourceId'],
    },
  },
  {
    name: 'get_datasource_overview_graph',
    description: 'Get the definition of a specific DataSource overview graph in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list\\_datasource\\_overview\\_graphs".',
    annotations: { title: 'Get datasource overview graph', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The datasource ID' },
        overviewGraphId: { type: 'number', description: 'The overview graph ID' },
      },
      additionalProperties: false,
      required: ['dataSourceId', 'overviewGraphId'],
    },
  },
  {
    name: 'list_datasource_devices',
    description: 'List the resources/devices a DataSource is currently applied to in LogicMonitor (LM) monitoring. ' +
      '\n\n**When to use:** Assess impact before editing/deleting a datasource, or audit where a module is collecting. ' +
      '\n\n**Related tools:** "get\\_datasource", "delete\\_datasource".',
    annotations: { title: 'List datasource devices', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The datasource ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dataSourceId'],
    },
  },
  {
    name: 'list_datasource_update_reasons',
    description: 'List the audit history of update reasons for a DataSource in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Change records (who/when/why) for the module. ' +
      '\n\n**Related tools:** "update\\_datasource" (provide a `reason` when editing).',
    annotations: { title: 'List datasource update reasons', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'number', description: 'The datasource ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dataSourceId'],
    },
  },

  // Device DataSources
  {
    name: 'list_resource_datasources',
    description: 'List datasources applied to a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of datasources actively monitoring this resource/device with: id (deviceDataSourceId), dataSourceName, dataSourceDisplayName, status, alert status, instance count, last poll time. ' +
      '\n\n**When to use:**' +
      '\n- See what\'s being monitored on a resource/device' +
      '\n- Verify datasource is collecting data' +
      '\n- Get deviceDataSourceId for metric retrieval' +
      '\n- Troubleshoot missing data' +
      '\n- Check datasource health' +
      '\n' +
      '\n\n**What you discover:** ' +
      '\n- Which datasources are active (e.g., WinCPU, WinMemory, SNMP\_Network\_Interfaces) ' +
      '\n- How many instances per datasource (e.g., 3 disks, 4 network interfaces) ' +
      '\n- Collection status: Collecting data vs errors ' +
      '\n- Alert status: Any active alerts from this datasource ' +
      '\n\n**This is step 1 for getting metrics:** ' +
      '**Complete workflow to retrieve metric data:** ' +
      '1. Use this tool → get deviceDataSourceId for datasource you want (e.g., WinCPU) ' +
      '2. Use "list\\_device\\_instances" → get instanceId for specific instance ' +
      '3. Use "get\\_device\\_instance\\_data" → get actual metric values ' +
      '\n\n**Troubleshooting use cases:** ' +
      '\n- "Why no CPU data?" → Check if WinCPU datasource is applied and collecting ' +
      '\n- "Find disk datasource" → Look for datasource with "disk" or "volume" in name ' +
      '\n- "Check datasource errors" → Review status field for error messages ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "list\\_device\\_instances" (next step), "get\\_device\\_instance\\_data" (get metrics), "update\\_device\\_datasource" (enable/disable).',
    annotations: {
      title: 'List resource/device datasources',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The resource/device ID',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'get_resource_datasource',
    description: 'Get detailed information about a specific datasource applied to a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete resource/device datasource details: dataSourceName, status, alert status, number of instances, monitoring configuration, stop monitoring flag, custom properties, graphs. ' +
      '\n\n**When to use:**' +
      '\n- Check if datasource is collecting data' +
      '\n- Review alert status for specific datasource' +
      '\n- Verify custom thresholds' +
      '\n- Get deviceDataSourceId for instance operations' +
      '\n- Troubleshoot data collection issues' +
      '\n' +
      '\n\n**Key fields:** ' +
      '\n- instanceNumber: How many instances (e.g., 4 network interfaces) ' +
      '\n- status: Collection status (normal vs error) ' +
      '\n- alertStatus: Any active alerts from this datasource ' +
      '\n- stopMonitoring: Whether datasource is disabled on this resource/device ' +
      '\n\n**Workflow:** Use "list\\_device\\_datasources" to find deviceDataSourceId, then use this tool for detailed status. ' +
      '\n\n**Related tools:** "list\\_device\\_datasources" (find datasource), "list\\_device\\_instances" (get instances), "update\\_device\\_datasource" (enable/disable).',
    annotations: {
      title: 'Get resource/device datasource details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The resource/device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The resource/device datasource ID',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'update_resource_datasource',
    description: 'Update resource/device datasource configuration in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify how a specific datasource monitors a specific resource/device. Control alerting, enable/disable monitoring, or adjust device-specific datasource settings without affecting other resources/devices. ' +
      '\n\n**When to use:**' +
      '\n- Disable monitoring for specific datasource on one resource/device' +
      '\n- Disable alerting during maintenance' +
      '\n- Enable previously disabled datasource' +
      '\n- Adjust polling interval for device' +
      '\n- Update device-specific thresholds' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- deviceId: Device ID (from "list\\_resources") ' +
      '\n- deviceDataSourceId: Device datasource ID (from "list\\_device\\_datasources") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- disableAlerting: true (mute alerts) or false (enable alerts) ' +
      '\n- stopMonitoring: true (stop data collection) or false (resume monitoring) ' +
      '\n- pollingInterval: Custom polling interval in seconds (override default) ' +
      '\n- customProperties: Device-specific datasource properties/thresholds ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**Disable alerting during troubleshooting:** ' +
      '{deviceId: 123, deviceDataSourceId: 456, disableAlerting: true} ' +
      '// Keep collecting data, but suppress alerts ' +
      '\n\n**Stop monitoring specific datasource:** ' +
      '{deviceId: 123, deviceDataSourceId: 456, stopMonitoring: true} ' +
      '// Stop collection completely (e.g., datasource not applicable) ' +
      '\n\n**Resume monitoring after maintenance:** ' +
      '{deviceId: 123, deviceDataSourceId: 456, disableAlerting: false, stopMonitoring: false} ' +
      '\n\n**Custom polling interval:** ' +
      '{deviceId: 123, deviceDataSourceId: 456, pollingInterval: 300} ' +
      '// Poll every 5 minutes instead of default 1 minute ' +
      '\n\n**Device-specific threshold:** ' +
      '{deviceId: 123, deviceDataSourceId: 456, customProperties: [{name: "cpu.threshold", value: "95"}]} ' +
      '// This resource/device can run hotter than others ' +
      '\n\n**DisableAlerting vs StopMonitoring:** ' +
      '\n- **disableAlerting: true** - Still collects data, graphs work, but no alerts (good for maintenance) ' +
      '\n- **stopMonitoring: true** - No data collection, no graphs, no alerts (fully disabled) ' +
      '\n\n**Use cases by scenario:** ' +
      '\n\n**During server patching:** ' +
      'disableAlerting: true (want graphs to show downtime, but no alerts) ' +
      '\n\n**Datasource not applicable:** ' +
      'stopMonitoring: true (e.g., Windows datasource on Linux server - shouldn\'t be there) ' +
      '\n\n**High-frequency monitoring:** ' +
      'pollingInterval: 60 (every minute for critical metrics) ' +
      '\n\n**Low-frequency monitoring:** ' +
      'pollingInterval: 600 (every 10 minutes for less critical metrics) ' +
      '\n\n**Workflow:** Use "list\\_device\\_datasources" to find deviceDataSourceId, then update configuration. ' +
      '\n\n**Related tools:** "list\\_device\\_datasources" (find datasource), "get\\_device\\_datasource" (check current config), "list\\_device\\_instances" (see monitored instances).',
    annotations: {
      title: 'Update resource/device datasource',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The resource/device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The resource/device datasource ID',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting for this datasource',
        },
        stopMonitoring: {
          type: 'boolean',
          description: 'Whether to stop monitoring this datasource',
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },

];
