import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema, clearedSchema } from './common.js';

export const instancesTools: Tool[] = [
  // Device DataSource Instance Tools
  {
    name: 'list_resource_instances',
    description: 'List instances of a datasource on a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of instances with: id, name, displayName, description, status, alert status, last collection time. ' +
      '\n\n**What are instances:** Individual components monitored by a datasource. Examples: individual disks (C:, D:, E:), network interfaces (eth0, eth1), database tables, processes. ' +
      '\n\n**When to use:** ' +
      '\n- List all disks on a server before getting disk metrics' +
      '\n- Find specific network interface for bandwidth data' +
      '\n- Discover what instances are being monitored' +
      '\n- Get instance IDs for metric retrieval' +
      '\n\n**Example workflow:** ' +
      'Device "web-server-01" has datasource "WinVolumeUsage-" → instances: C:, D:, E: (each disk is an instance) ' +
      'Device "router-01" has datasource "SNMP_Network_Interfaces" → instances: GigabitEthernet0/1, GigabitEthernet0/2 (each interface is an instance) ' +
      '\n\n**Complete workflow to get metrics:** ' +
      '\n- Use "list_resource_datasources" to get deviceDataSourceId' +
      '\n- Use this tool to list instances and get instanceId' +
      '\n- Use "get_resource_instance_data" with instanceId to get actual metrics' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "list_resource_datasources" (first step), "get_resource_instance_data" (get metrics).',
    annotations: {
      title: 'List datasource instances',
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
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'get_resource_instance_data',
    description: 'Get time-series metrics/datapoints data (e.g., CPU/memory/network utilization) for a specific resource/device datasource instance in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Time-series data with timestamps and values for requested datapoints. Format: {timestamps: [epoch1, epoch2], values: {datapoint1: [val1, val2], datapoint2: [val1, val2]}}. ' +
      '\n\n**When to use:** ' +
      '\n- Get CPU utilization for last 24 hours' +
      '\n- Fetch disk usage trends' +
      '\n- Retrieve network bandwidth data' +
      '\n- Export metrics for analysis' +
      '\n- Build custom dashboards/reports' +
      '\n\n**Required workflow (3 steps):** ' +
      '\n- Use "list_resource_datasources" → get deviceDataSourceId for datasource (e.g., WinCPU)' +
      '\n- Use "list_resource_instances" → get instanceId for specific instance (e.g., CPU Core 0)' +
      '\n- Use this tool → get actual metric values for that instance' +
      '\n\n**Parameters:** ' +
      '\n- deviceId: Device ID from "get_resource" or "list_resources"' +
      '\n- deviceDataSourceId: From "get_resource_datasource" or "list_resource_datasources"' +
      '\n- instanceId: From "list_resource_instances"' +
      '\n- datapoints: Comma-separated metric names (e.g., "CPUBusyPercent,MemoryUsedPercent")' +
      '\n- start/end: Time range in epoch milliseconds (not seconds!), start time must be before current time' +
      '\n\n**Example:** Get last hour CPU data: start=Date.now()-3600000, end=Date.now() ' +
      '\n\n**Time range tips:** If omitted, returns last 2 hours. Max range: 1 year. Use shorter ranges for better performance. ' +
      '\n\n**Related tools:** "list_resource_datasources", "list_resource_instances".',
    annotations: {
      title: 'Get time-series metric data',
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
        instanceId: {
          type: 'number',
          description: 'The instance ID',
        },
        datapoints: {
          type: 'string',
          description: 'Comma-separated list of metric/datapoint names',
        },
        start: {
          type: 'number',
          description: 'Start time (epoch milliseconds), start time must be before current time',
        },
        end: {
          type: 'number',
          description: 'End time (epoch milliseconds)',
        },
        format: {
          type: 'string',
          description: 'Response format: "json" or "csv"',
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'create_resource_instance',
    description: 'Add a new datasource instance to a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Manually creates a monitored instance (e.g., a specific URL, port, process, or table) under a device datasource that supports manual/active discovery instances. ' +
      '\n\n**Required:** deviceId, deviceDataSourceId, and a `config` with at least the instance `wildValue` (and usually `displayName`). ' +
      '\n\n**Related tools:** "list_resource_datasources" (get deviceDataSourceId), "list_resource_instances", "update_resource_instance", "delete_resource_instance".',
    annotations: { title: 'Create datasource instance', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        config: {
          type: 'object',
          description: 'Instance definition (e.g., wildValue, displayName, description, wildValue2, properties, disableAlerting).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'config'],
    },
  },
  {
    name: 'update_resource_instance',
    description: 'Update an existing datasource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Partially updates instance fields such as displayName, description, properties, or disableAlerting. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceId, and a `config` with the fields to change. Optional `opType` (add/refresh/replace) controls property merge behavior. ' +
      '\n\n**Related tools:** "list_resource_instances", "delete_resource_instance".',
    annotations: { title: 'Update datasource instance', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        opType: { type: 'string', description: 'Optional property merge mode: "add", "refresh", or "replace".' },
        config: {
          type: 'object',
          description: 'Instance fields to update (e.g., displayName, description, properties, disableAlerting).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId', 'config'],
    },
  },
  {
    name: 'delete_resource_instance',
    description: 'Delete a datasource instance from a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ Permanent:** Removes the instance and stops its monitoring/data collection. ' +
      '\n\n**Related tools:** "list_resource_instances" (find instanceId).',
    annotations: { title: 'Delete datasource instance', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'get_instance_graph_data',
    description: 'Get rendered graph data for a specific datasource instance graph in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Graph series data (lines, datapoints, timestamps) for the given graphId on an instance. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceId, graphId, optional start/end (epoch seconds) and format. ' +
      '\n\n**Tip:** For raw datapoint values use "get_resource_instance_data" instead.',
    annotations: { title: 'Get instance graph data', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        graphId: { type: 'number', description: 'The graph ID on the instance' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        format: { type: 'string', description: 'Response format (e.g., "json")' },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId', 'graphId'],
    },
  },
  {
    name: 'get_resource_datasource_data',
    description: 'Get aggregated time-series data for all instances of a datasource on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Datapoint values across the datasource instances. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, optional period, start/end (epoch seconds), datapoints (comma-separated), format, aggregate. ' +
      '\n\n**Related tools:** "get_resource_instance_data" (single instance).',
    annotations: { title: 'Get datasource data', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        period: { type: 'number', description: 'Number of periods to retrieve' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        datapoints: { type: 'string', description: 'Comma-separated datapoint names' },
        format: { type: 'string', description: 'Response format (e.g., "json", "csv")' },
        aggregate: { type: 'string', description: 'Aggregation method (e.g., "average")' },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'list_resource_instance_groups',
    description: 'List instance groups for a datasource on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are instance groups:** Logical groupings of datasource instances (e.g., grouping interfaces by role). ' +
      '\n\n**Related tools:** "get_resource_instance_group", "create_resource_instance_group".',
    annotations: { title: 'List instance groups', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'get_resource_instance_group',
    description: 'Get details of a specific datasource instance group on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list_resource_instance_groups", "update_resource_instance_group".',
    annotations: { title: 'Get instance group', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        instanceGroupId: { type: 'number', description: 'The instance group ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceGroupId'],
    },
  },
  {
    name: 'create_resource_instance_group',
    description: 'Create a datasource instance group on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Required:** deviceId, deviceDataSourceId, and a `config` with at least `name`. ' +
      '\n\n**Related tools:** "update_resource_instance_group", "list_resource_instance_groups".',
    annotations: { title: 'Create instance group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        config: {
          type: 'object',
          description: 'Instance group definition (e.g., name, description, groupName).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'config'],
    },
  },
  {
    name: 'update_resource_instance_group',
    description: 'Update a datasource instance group on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceGroupId, and a `config` with fields to change. ' +
      '\n\n**Related tools:** "get_resource_instance_group".',
    annotations: { title: 'Update instance group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        instanceGroupId: { type: 'number', description: 'The instance group ID' },
        config: {
          type: 'object',
          description: 'Instance group fields to update (e.g., name, description).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceGroupId', 'config'],
    },
  },
  {
    name: 'get_instance_group_overview_graph_data',
    description: 'Get rendered overview graph data for a datasource instance group on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceGroupId, overviewGraphId, optional start/end (epoch seconds) and format.',
    annotations: { title: 'Get instance group overview graph', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        instanceGroupId: { type: 'number', description: 'The instance group ID (dsigId)' },
        overviewGraphId: { type: 'number', description: 'The overview graph ID (ographId)' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        format: { type: 'string', description: 'Response format (e.g., "json")' },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceGroupId', 'overviewGraphId'],
    },
  },
  {
    name: 'update_instance_group_alert_threshold',
    description: 'Set or update the alert threshold for a datapoint within a datasource instance group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceGroupId, datapointId, and a `config` with the alert threshold expression (e.g., {"alertExpr": "> 90 95 99"}). ' +
      '\n\n**Related tools:** "get_resource_instance_group".',
    annotations: { title: 'Update instance group alert threshold', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        instanceGroupId: { type: 'number', description: 'The instance group ID (dsigId)' },
        datapointId: { type: 'number', description: 'The datapoint ID (dpId)' },
        config: {
          type: 'object',
          description: 'Alert threshold config (e.g., alertExpr, disableAlerting).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceGroupId', 'datapointId', 'config'],
    },
  },
  {
    name: 'list_resource_alert_settings',
    description: 'List datasource instance alert settings across an entire resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Alert threshold/configuration settings for the device\'s monitored instances. ' +
      '\n\n**Related tools:** "list_instance_alert_settings", "get_instance_alert_setting".',
    annotations: { title: 'List device alert settings', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        ...paginationSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'list_instance_alert_settings',
    description: 'List alert settings for a specific datasource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "get_instance_alert_setting", "update_instance_alert_setting".',
    annotations: { title: 'List instance alert settings', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        ...paginationSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'get_instance_alert_setting',
    description: 'Get a specific alert setting for a datasource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list_instance_alert_settings", "update_instance_alert_setting".',
    annotations: { title: 'Get instance alert setting', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        alertSettingId: { type: 'number', description: 'The alert setting ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId', 'alertSettingId'],
    },
  },
  {
    name: 'update_instance_alert_setting',
    description: 'Update an alert setting (threshold) for a datasource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceId, alertSettingId, and a `config` with fields to change (e.g., alertExpr, disableAlerting). ' +
      '\n\n**Related tools:** "get_instance_alert_setting".',
    annotations: { title: 'Update instance alert setting', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        alertSettingId: { type: 'number', description: 'The alert setting ID' },
        config: {
          type: 'object',
          description: 'Alert setting fields to update (e.g., alertExpr, disableAlerting, alertClearTransitionInterval).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId', 'alertSettingId', 'config'],
    },
  },
  {
    name: 'list_resource_instance_configs',
    description: 'List collected configuration files for a ConfigSource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Config versions/snapshots metadata (id, pollTimestamp, version, change status). ' +
      '\n\n**Workflow:** Find the ConfigSource deviceDataSourceId via "list_resource_datasources", the instance via "list_resource_instances", then list its configs. ' +
      '\n\n**Related tools:** "get_resource_instance_config".',
    annotations: { title: 'List instance configs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The ConfigSource device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'get_resource_instance_config',
    description: 'Get a specific collected configuration file (and its content) for a ConfigSource instance in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, deviceDataSourceId, instanceId, configId (the config version id from "list_resource_instance_configs"), optional format/startEpoch. ' +
      '\n\n**Returns:** The config content and metadata, useful for auditing config changes.',
    annotations: { title: 'Get instance config', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The ConfigSource device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        configId: { type: 'string', description: 'The config version ID' },
        format: { type: 'string', description: 'Response format' },
        startEpoch: { type: 'number', description: 'Start epoch (seconds). The LM config API requires this; defaults to 0 (all history) when omitted.' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId', 'configId'],
    },
  },
  {
    name: 'collect_resource_instance_config',
    description: 'Trigger an immediate configuration collection for a ConfigSource instance in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Forces LM to poll the device now for the latest config (instead of waiting for the next schedule). ' +
      '\n\n**Related tools:** "list_resource_instance_configs" (view results afterward).',
    annotations: { title: 'Collect instance config now', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The ConfigSource device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'list_resource_netflow_flows',
    description: 'List NetFlow traffic flows for a NetFlow-enabled resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Flow records (source/destination, application, bytes, percentage). ' +
      '\n\n**Parameters:** deviceId, optional start/end (epoch seconds), netflowFilter, pagination. ' +
      '\n\n**Related tools:** "list_resource_netflow_ports", "list_resource_netflow_endpoints".',
    annotations: { title: 'List NetFlow flows', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        netflowFilter: { type: 'string', description: 'NetFlow filter expression' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'list_resource_netflow_ports',
    description: 'List NetFlow traffic grouped by port for a NetFlow-enabled resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, optional ip, start/end (epoch seconds), netflowFilter, pagination.',
    annotations: { title: 'List NetFlow ports', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        ip: { type: 'string', description: 'Filter by IP address' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        netflowFilter: { type: 'string', description: 'NetFlow filter expression' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'list_resource_netflow_endpoints',
    description: 'List NetFlow traffic grouped by endpoint for a NetFlow-enabled resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, optional port, start/end (epoch seconds), netflowFilter, pagination.',
    annotations: { title: 'List NetFlow endpoints', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        port: { type: 'string', description: 'Filter by port' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        netflowFilter: { type: 'string', description: 'NetFlow filter expression' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'get_resource_top_talkers_graph',
    description: 'Get the NetFlow "top talkers" graph data for a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, optional start/end (epoch seconds), netflowFilter, format, keyword.',
    annotations: { title: 'Get NetFlow top talkers graph', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        netflowFilter: { type: 'string', description: 'NetFlow filter expression' },
        format: { type: 'string', description: 'Response format' },
        keyword: { type: 'string', description: 'Keyword filter' },
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'get_resource_sdt_history',
    description: 'Get the Scheduled Down Time (SDT) history for a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Past SDT windows applied to the device. ' +
      '\n\n**Related tools:** "get_resource_datasource_sdt_history", "get_instance_sdt_history".',
    annotations: { title: 'Get device SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'get_resource_datasource_sdt_history',
    description: 'Get the SDT history for a specific datasource on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "get_resource_sdt_history", "get_instance_sdt_history".',
    annotations: { title: 'Get datasource SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'get_instance_sdt_history',
    description: 'Get the SDT history for a specific datasource instance on a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "get_resource_sdt_history", "get_resource_datasource_sdt_history".',
    annotations: { title: 'Get instance SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        deviceDataSourceId: { type: 'number', description: 'The resource/device datasource ID (hdsId)' },
        instanceId: { type: 'number', description: 'The instance ID' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId', 'instanceId'],
    },
  },
  {
    name: 'create_resource_property',
    description: 'Add a custom property to a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, name (property key), value. ' +
      '\n\n**Related tools:** "list_resource_properties", "update_resource_property", "delete_resource_property".',
    annotations: { title: 'Create device property', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        name: { type: 'string', description: 'The property name/key' },
        value: { type: 'string', description: 'The property value' },
      },
      additionalProperties: false,
      required: ['deviceId', 'name', 'value'],
    },
  },
  {
    name: 'delete_resource_property',
    description: 'Delete a custom property from a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deviceId, propertyName. ' +
      '\n\n**Related tools:** "list_resource_properties".',
    annotations: { title: 'Delete device property', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        propertyName: { type: 'string', description: 'The property name/key to delete' },
      },
      additionalProperties: false,
      required: ['deviceId', 'propertyName'],
    },
  },
  {
    name: 'list_resource_alerts',
    description: 'List alerts for a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Active/historical alerts scoped to the device. ' +
      '\n\n**Parameters:** deviceId, optional start/end (epoch seconds), needMessage, pagination/filter. ' +
      '\n\n**Related tools:** "list_alerts" (account-wide), "get_alert".',
    annotations: { title: 'List device alerts', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        start: { type: 'number', description: 'Start time (epoch seconds)' },
        end: { type: 'number', description: 'End time (epoch seconds)' },
        needMessage: { type: 'boolean', description: 'Include the alert message body' },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
        ...clearedSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'list_resource_eventsources',
    description: 'List the EventSources applied to a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** EventSources monitoring the device (e.g., Windows Event Logs, SNMP traps). ' +
      '\n\n**Related tools:** "list_eventsources" (definitions).',
    annotations: { title: 'List device eventsources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'schedule_resource_auto_discovery',
    description: 'Trigger Active Discovery for a resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Forces LM to re-run instance discovery now (find new disks/interfaces/etc.) instead of waiting for the schedule. ' +
      '\n\n**Related tools:** "list_resource_instances" (view discovered instances).',
    annotations: { title: 'Schedule active discovery', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'number', description: 'The resource/device ID' },
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'get_resources_delta_id',
    description: 'Begin a device delta-tracking session in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Returns a deltaId snapshot token (and current devices) that can later be passed to "get_resources_delta" to fetch only what changed. ' +
      '\n\n**Parameters:** optional deltaId to refresh an existing token.',
    annotations: { title: 'Get devices delta ID', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deltaId: { type: 'string', description: 'Optional existing delta token to refresh' },
      },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_resources_delta',
    description: 'Fetch device changes since a previous delta snapshot in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** deltaId (from "get_resources_delta_id"). ' +
      '\n\n**Returns:** Added/updated/deleted devices since the snapshot.',
    annotations: { title: 'Get devices delta', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        deltaId: { type: 'string', description: 'The delta token from get_resources_delta_id' },
      },
      additionalProperties: false,
      required: ['deltaId'],
    },
  },

  // Bulk instance data fetch & instance graph by id
  {
    name: 'fetch_instances_data',
    description: 'Fetch recent metric data for multiple device datasource instances in a single bulk request in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** the instances selector via `config` (the DeviceInstances body), plus optional time controls: period, start, end, aggregate. ' +
      '\n\n**Required in `config`:** `instanceIds` (a comma-separated string or array of device datasource instance IDs) — the request fails with "instanceIds can\'t be null" if omitted. Optionally include `dataPoints` to limit which datapoints are returned. ' +
      '\n\n**Related tools:** "list_resource_instances" (find instance IDs), "get_resource_instance_data" (single instance), "get_instance_graph_data_by_id".',
    annotations: { title: 'Fetch bulk instances data', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        config: { type: 'object', additionalProperties: true, description: 'The DeviceInstances request body selecting which instances/datapoints to fetch.' },
        period: { type: 'number', description: 'Time period (e.g., number of hours).' },
        start: { type: 'number', description: 'Start epoch seconds.' },
        end: { type: 'number', description: 'End epoch seconds.' },
        aggregate: { type: 'string', description: 'Aggregation function (e.g., "average").' },
      },
      additionalProperties: false,
      required: ['config'],
    },
  },
  {
    name: 'get_instance_graph_data_by_id',
    description: 'Get rendered graph data for a device datasource instance graph using only the instance ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Retrieves the time-series data for a specific graph on an instance, addressed directly by instanceId + graphId (no device/datasource path needed). ' +
      '\n\n**Parameters:** instanceId, graphId, optional start/end (epoch seconds) and format. ' +
      '\n\n**Related tools:** "get_instance_graph_data" (full device/datasource path), "list_resource_instances".',
    annotations: { title: 'Get instance graph data by id', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        instanceId: { type: 'number', description: 'The device datasource instance ID' },
        graphId: { type: 'number', description: 'The graph ID' },
        start: { type: 'number', description: 'Start epoch seconds.' },
        end: { type: 'number', description: 'End epoch seconds.' },
        format: { type: 'string', description: 'Response format.' },
      },
      additionalProperties: false,
      required: ['instanceId', 'graphId'],
    },
  },

  // Metrics
  {
    name: 'get_metrics_summary',
    description: 'Get the metrics ingestion summary (push metrics) for the LogicMonitor (LM) portal.',
    annotations: { title: 'Get metrics summary', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },
  {
    name: 'get_metrics_usage',
    description: 'Get the metrics usage statistics for the LogicMonitor (LM) portal.',
    annotations: { title: 'Get metrics usage', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...fieldsSchema },
      additionalProperties: false,
    },
  },

];
