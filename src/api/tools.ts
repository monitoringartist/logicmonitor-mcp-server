/**
 * LogicMonitor (LM) monitoring MCP Tools
 *
 * Tool definitions and handlers for LogicMonitor API integration.
 * Use "LM" as shorthand for "LogicMonitor" throughout this server.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Common parameter schemas
const paginationSchema = {
  size: {
    type: 'number',
    description: 'Number of results per page (default: 50, max: 1000).',
  },
  offset: {
    type: 'number',
    description: 'Starting offset for pagination (default: 0). ' +
      'Use this to skip a specific number of results.',
  },
  autoPaginate: {
    type: 'boolean',
    description: 'Automatically fetch all pages (default: false). ' +
      'When true, fetches all results across multiple pages. ' +
      'When false, returns only the requested page. ' +
      'Use false for large result sets to avoid long response times.',
  },
};

const filterSchema = {
  filter: {
    type: 'string',
    description: 'Filter expression using LogicMonitor query syntax. ' +
      'Examples: name:*prod*, displayName~*server*, id>100, hostStatus:normal. ' +
      'Available operators: : (equals), ~ (includes), !: (not equals), !~ (not includes), ' +
      '>: (greater than or equals), <: (less than or equals), > (greater than), < (less than). ' +
      'Multiple conditions: Use comma (,) for AND, use || for OR. Do NOT use &&.',
  },
};

const fieldsSchema = {
  fields: {
    type: 'string',
    description: 'Comma-separated list of fields to include in response. ' +
      'Examples: "id,displayName,hostStatus" or use "*" for all fields. ' +
      'Omit this parameter to receive a curated set of commonly used fields.',
  },
};

const ALL_LOGICMONITOR_TOOLS: Tool[] = [
  // Device Management Tools
  {
    name: 'list_devices',
    description: 'List all monitored devices/resources in LogicMonitor (LM) monitoring. Supports filtering, pagination, and field selection. Use filters like "displayName~\\"*server*\\"" or "systemProperties.name:system.devicetype,value:server". Essential for inventory management and finding specific devices.',
    annotations: {
      title: 'List all monitored devices/resources in LogicMonitor (LM) monitoring. Supports filtering, pagination, and field selection. Use filters like "displayName~\\"*server*\\"" or "systemProperties.name:system.devicetype,value:server". Essential for inventory management and finding specific devices.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
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
    name: 'get_device',
    description: 'Get detailed information about a specific device/resource in LogicMonitor (LM) monitoring by its ID. Returns device properties, collector assignment, alert status, and monitoring configuration.',
    annotations: {
      title: 'Get detailed information about a specific device/resource in LogicMonitor (LM) monitoring by its ID. Returns device properties, collector assignment, alert status, and monitoring configuration.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The ID of the device/resource to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'create_device',
    description: 'Add a new device or multiple devices to LogicMonitor (LM) monitoring. Supports both single device creation and batch creation. For single: provide displayName, name, preferredCollectorId. For batch: provide devices array with batchOptions.',
    annotations: {
      title: 'Add a new device or multiple devices to LogicMonitor (LM) monitoring. Supports both single device creation and batch creation.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single device properties
        displayName: {
          type: 'string',
          description: 'Display name for the device/resource (for single creation)',
        },
        name: {
          type: 'string',
          description: 'IP address or hostname of the device/resource (for single creation)',
        },
        preferredCollectorId: {
          type: 'number',
          description: 'ID of the collector to monitor this device/resource (for single creation)',
        },
        hostGroupIds: {
          type: 'string',
          description: 'Comma-separated list of device/resource group IDs (for single creation)',
        },
        description: {
          type: 'string',
          description: 'Description of the device/resource (for single creation)',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting for this device/resource (for single creation)',
        },
        customProperties: {
          type: 'array',
          description: 'Array of custom properties with name and value (for single creation)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
        // Batch properties
        devices: {
          type: 'array',
          description: 'Array of devices to create (for batch creation)',
          items: {
            type: 'object',
            properties: {
              displayName: { type: 'string' },
              name: { type: 'string' },
              preferredCollectorId: { type: 'number' },
              hostGroupIds: { type: 'string' },
              description: { type: 'string' },
              disableAlerting: { type: 'boolean' },
              customProperties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    value: { type: 'string' },
                  },
                },
              },
            },
            required: ['displayName', 'name', 'preferredCollectorId'],
          },
        },
        batchOptions: {
          type: 'object',
          description: 'Options for batch processing',
          properties: {
            maxConcurrent: {
              type: 'number',
              description: 'Maximum concurrent requests (default: 5)',
            },
            continueOnError: {
              type: 'boolean',
              description: 'Continue processing if some items fail (default: true)',
            },
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'update_device',
    description: 'Modify an existing device or multiple devices in LogicMonitor (LM) monitoring. Supports both single and batch update. For single: provide deviceId and fields to update. For batch: provide devices array with batchOptions.',
    annotations: {
      title: 'Modify an existing device or multiple devices in LogicMonitor (LM) monitoring. Supports both single and batch update.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single device properties
        deviceId: {
          type: 'number',
          description: 'The ID of the device/resource to update (for single update)',
        },
        displayName: {
          type: 'string',
          description: 'New display name for the device/resource (for single update)',
        },
        description: {
          type: 'string',
          description: 'New description for the device/resource (for single update)',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting (for single update)',
        },
        preferredCollectorId: {
          type: 'number',
          description: 'New collector ID (for single update)',
        },
        customProperties: {
          type: 'array',
          description: 'Array of custom properties to update (for single update)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
        opType: {
          type: 'string',
          description: 'Operation type: "replace" or "add" (default: replace, for single update)',
        },
        // Batch properties
        devices: {
          type: 'array',
          description: 'Array of devices to update (for batch update). Each must include deviceId.',
          items: {
            type: 'object',
            properties: {
              deviceId: { type: 'number' },
              displayName: { type: 'string' },
              description: { type: 'string' },
              disableAlerting: { type: 'boolean' },
              preferredCollectorId: { type: 'number' },
              customProperties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    value: { type: 'string' },
                  },
                },
              },
              opType: { type: 'string' },
            },
            required: ['deviceId'],
          },
        },
        batchOptions: {
          type: 'object',
          description: 'Options for batch processing',
          properties: {
            maxConcurrent: {
              type: 'number',
              description: 'Maximum concurrent requests (default: 5)',
            },
            continueOnError: {
              type: 'boolean',
              description: 'Continue processing if some items fail (default: true)',
            },
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'delete_device',
    description: 'Remove a device or multiple devices from LogicMonitor (LM) monitoring. Supports both single and batch deletion. For single: provide deviceId. For batch: provide deviceIds array with batchOptions.',
    annotations: {
      title: 'Remove a device or multiple devices from LogicMonitor (LM) monitoring. Supports both single and batch deletion.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single device properties
        deviceId: {
          type: 'number',
          description: 'The ID of the device/resource to delete (for single deletion)',
        },
        deleteFromSystem: {
          type: 'boolean',
          description: 'Whether to delete the device/resource from the system completely',
        },
        // Batch properties
        deviceIds: {
          type: 'array',
          description: 'Array of device IDs to delete (for batch deletion)',
          items: {
            type: 'number',
          },
        },
        batchOptions: {
          type: 'object',
          description: 'Options for batch processing',
          properties: {
            maxConcurrent: {
              type: 'number',
              description: 'Maximum concurrent requests (default: 5)',
            },
            continueOnError: {
              type: 'boolean',
              description: 'Continue processing if some items fail (default: true)',
            },
          },
        },
      },
      additionalProperties: false,
    },
  },

  // Device Group Tools
  {
    name: 'list_device_groups',
    description: 'List all device/resource groups/folders in LogicMonitor (LM) monitoring. Use groups to organize devices logically. Supports filtering and pagination.',
    annotations: {
      title: 'List all device/resource groups/folders in LogicMonitor (LM) monitoring. Use groups to organize devices logically. Supports filtering and pagination.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
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
    name: 'get_device_group',
    description: 'Get detailed information about a specific device/resource group by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific device/resource group by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the device/resource group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_device_group',
    description: 'Create a new device/resource group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new device/resource group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the device/resource group',
        },
        parentId: {
          type: 'number',
          description: 'Parent group ID (use 1 for root)',
        },
        description: {
          type: 'string',
          description: 'Description of the device/resource group',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting for this group',
        },
        customProperties: {
          type: 'array',
          description: 'Array of custom properties',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_device_group',
    description: 'Update an existing device/resource group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an existing device/resource group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the device/resource group to update',
        },
        name: {
          type: 'string',
          description: 'New name for the device/resource group',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting',
        },
        opType: {
          type: 'string',
          description: 'Operation type: "replace" or "add"',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_device_group',
    description: 'Delete a device/resource group from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a device/resource group from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the device/resource group to delete',
        },
        deleteChildren: {
          type: 'boolean',
          description: 'Whether to delete child device/resource groups as well',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Alert Management Tools
  {
    name: 'list_alerts',
    description: 'List active alerts in LogicMonitor (LM) monitoring. Filter by severity (critical, error, warn), resource, time, etc. Example filters: severity:critical, resourceTemplateName~"*cpu*". Use this to monitor system health and identify issues.',
    annotations: {
      title: 'List active alerts in LogicMonitor (LM) monitoring. Filter by severity (critical, error, warn), resource, time, etc. Example filters: severity:critical, resourceTemplateName~"*cpu*". Use this to monitor system health and identify issues.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
        needMessage: {
          type: 'boolean',
          description: 'Whether to include alert message details',
          default: true,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_alert',
    description: 'Get detailed information about a specific alert in LogicMonitor (LM) monitoring by its ID. Includes alert history, thresholds, datapoint values, and escalation status.',
    annotations: {
      title: 'Get detailed information about a specific alert in LogicMonitor (LM) monitoring by its ID. Includes alert history, thresholds, datapoint values, and escalation status.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to retrieve',
        },
        needMessage: {
          type: 'boolean',
          description: 'Whether to include alert message details',
          default: true,
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['alertId'],
    },
  },
  {
    name: 'acknowledge_alert',
    description: 'Acknowledge an alert in LogicMonitor (LM) monitoring to indicate someone is working on it. Stops escalation and shows the alert is being handled.',
    annotations: {
      title: 'Acknowledge an alert in LogicMonitor (LM) monitoring to indicate someone is working on it. Stops escalation and shows the alert is being handled.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to acknowledge',
        },
        comment: {
          type: 'string',
          description: 'Acknowledgment comment',
        },
      },
      additionalProperties: false,
      required: ['alertId'],
    },
  },
  {
    name: 'add_alert_note',
    description: 'Add a note to an alert for documentation or collaboration purposes.',
    annotations: {
      title: 'Add a note to an alert for documentation or collaboration purposes.',
      readOnlyHint: false,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert',
        },
        note: {
          type: 'string',
          description: 'The note to add',
        },
      },
      additionalProperties: false,
      required: ['alertId', 'note'],
    },
  },

  // Collector Tools
  {
    name: 'list_collectors',
    description: 'List all LogicMonitor (LM) monitoring collectors (monitoring agents). Collectors are installed on-premise or in cloud to gather metrics from devices. Check collector health and capacity.',
    annotations: {
      title: 'List all LogicMonitor (LM) monitoring collectors (monitoring agents). Collectors are installed on-premise or in cloud to gather metrics from devices. Check collector health and capacity.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
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
    name: 'get_collector',
    description: 'Get detailed information about a specific collector by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific collector by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com',
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the collector to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },

  // DataSource Tools
  {
    name: 'list_datasources',
    description: 'List all available datasources in LogicMonitor (LM) monitoring. DataSources define what metrics, thresholds, and collection methods to use (e.g., SNMP, WMI, scripts).',
    annotations: {
      title: 'List all available datasources in LogicMonitor (LM) monitoring. DataSources define what metrics, thresholds, and collection methods to use (e.g., SNMP, WMI, scripts).',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Get detailed information about a specific datasource by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific datasource by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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

  // Device DataSource Instance Tools
  {
    name: 'list_device_instances',
    description: 'List instances of a datasource on a specific device (e.g., individual disks, network interfaces) in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List instances of a datasource on a specific device (e.g., individual disks, network interfaces) in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The device datasource ID',
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
    name: 'get_device_instance_data',
    description: 'Get metrics/datapoints data, e.g. CPU/memory/network utilization for a specific device datasource instance in LogicMonitor (LM) monitoring. Returns time-series data for monitoring metrics.',
    annotations: {
      title: 'Get metrics/datapoints, e.g. CPU/memory/network utilization for a specific device datasource instance in LogicMonitor (LM) monitoring. Returns time-series data for monitoring metrics.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The device datasource ID',
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
          description: 'Start time (epoch milliseconds)',
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

  // Dashboard Tools
  {
    name: 'list_dashboards',
    description: 'List all dashboards in LogicMonitor (LM) monitoring. Dashboards provide visual monitoring views with widgets for metrics, alerts, maps, and more.',
    annotations: {
      title: 'List all dashboards in LogicMonitor (LM) monitoring. Dashboards provide visual monitoring views with widgets for metrics, alerts, maps, and more.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboards-<dashboardId>',
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
    name: 'get_dashboard',
    description: 'Get detailed information about a specific dashboard by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific dashboard by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboards-<dashboardId>',
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'create_dashboard',
    description: 'Create a new dashboard in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new dashboard in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboards-<dashboardId>',
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the dashboard',
        },
        description: {
          type: 'string',
          description: 'Description of the dashboard',
        },
        groupId: {
          type: 'number',
          description: 'Dashboard group ID',
        },
        widgetsConfig: {
          type: 'string',
          description: 'JSON string of widget configuration',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_dashboard',
    description: 'Update an existing dashboard in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an existing dashboard in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboards-<dashboardId>',
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to update',
        },
        name: {
          type: 'string',
          description: 'New name for the dashboard',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'delete_dashboard',
    description: 'Delete a dashboard from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a dashboard from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboards-<dashboardId>',
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to delete',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },

  // Dashboard Group Tools
  {
    name: 'list_dashboard_groups',
    description: 'List all dashboard groups in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all dashboard groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardGroupUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-<dashboardGroupParentId>,dashboardGroups-<dashboardGroupId>*',
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
    name: 'get_dashboard_group',
    description: 'Get detailed information about a specific dashboard group by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific dashboard group by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      dashboardGroupUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-<dashboardGroupParentId>,dashboardGroups-<dashboardGroupId>*',
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the dashboard group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Report Tools
  {
    name: 'list_reports',
    description: 'List all reports in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all reports in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      reportUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/reports/treeNodes/reportGroups-<reportGroupId>,reports-<reportId>',
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
    name: 'get_report',
    description: 'Get detailed information about a specific report by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific report by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      reportUrl: 'https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/reports/treeNodes/reportGroups-<reportGroupId>,reports-<reportId>',
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['reportId'],
    },
  },

  // Website (Synthetic Monitoring) Tools
  {
    name: 'list_websites',
    description: 'List all website monitors in LogicMonitor (LM) monitoring. Website monitoring provides synthetic checks (ping, HTTP/HTTPS) to verify service availability and response times from multiple locations.',
    annotations: {
      title: 'List all website monitors in LogicMonitor (LM) monitoring. Website monitoring provides synthetic checks (ping, HTTP/HTTPS) to verify service availability and response times from multiple locations.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_website',
    description: 'Get detailed information about a specific website monitor by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific website monitor by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'create_website',
    description: 'Create a new website monitor in LogicMonitor (LM) monitoring. Monitor website/service availability with HTTP/HTTPS checks or simple ping tests from global checkpoint locations.',
    annotations: {
      title: 'Create a new website monitor in LogicMonitor (LM) monitoring. Monitor website/service availability with HTTP/HTTPS checks or simple ping tests from global checkpoint locations.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the website monitor',
        },
        domain: {
          type: 'string',
          description: 'Domain or URL to monitor',
        },
        type: {
          type: 'string',
          description: 'Monitor type: "webcheck" or "pingcheck"',
        },
        description: {
          type: 'string',
          description: 'Description of the monitor',
        },
        checkpointId: {
          type: 'number',
          description: 'Checkpoint location ID',
        },
      },
      additionalProperties: false,
      required: ['name', 'domain', 'type'],
    },
  },
  {
    name: 'update_website',
    description: 'Update an existing website monitor in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an existing website monitor in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'delete_website',
    description: 'Delete a website monitor from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a website monitor from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website to delete',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },

  // Website Group Tools
  {
    name: 'list_website_groups',
    description: 'List all website groups in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all website groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_website_group',
    description: 'Get detailed information about a specific website group by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific website group by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the website group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // User Management Tools
  {
    name: 'list_users',
    description: 'List all users (admins) in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all users (admins) in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_user',
    description: 'Get detailed information about a specific user by their ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific user by their ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'The ID of the user to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['userId'],
    },
  },

  // Role Tools
  {
    name: 'list_roles',
    description: 'List all roles in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all roles in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_role',
    description: 'Get detailed information about a specific role by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific role by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        roleId: {
          type: 'number',
          description: 'The ID of the role to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['roleId'],
    },
  },

  // API Token Tools
  {
    name: 'list_api_tokens',
    description: 'List API tokens for a specific user in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List API tokens for a specific user in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          description: 'The user ID',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['userId'],
    },
  },

  // SDT (Scheduled Down Time) Tools
  {
    name: 'list_sdts',
    description: 'List all Scheduled Down Times (SDTs) in LogicMonitor (LM) monitoring. SDTs suppress alerting during planned maintenance windows to prevent false alarms.',
    annotations: {
      title: 'List all Scheduled Down Times (SDTs) in LogicMonitor (LM) monitoring. SDTs suppress alerting during planned maintenance windows to prevent false alarms.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_sdt',
    description: 'Get detailed information about a specific SDT by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific SDT by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        sdtId: {
          type: 'string',
          description: 'The ID of the SDT to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['sdtId'],
    },
  },
  {
    name: 'create_device_sdt',
    description: 'Schedule downtime for a device in LogicMonitor (LM) monitoring to suppress alerts during planned maintenance. Prevents false alerts during upgrades, patches, or service windows.',
    annotations: {
      title: 'Schedule downtime for a device in LogicMonitor (LM) monitoring to suppress alerts during planned maintenance. Prevents false alerts during upgrades, patches, or service windows.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        type: {
          type: 'string',
          description: 'SDT type: "DeviceSDT", "DeviceGroupSDT", "DeviceDataSourceSDT", etc.',
        },
        startDateTime: {
          type: 'number',
          description: 'Start time (epoch milliseconds)',
        },
        endDateTime: {
          type: 'number',
          description: 'End time (epoch milliseconds)',
        },
        comment: {
          type: 'string',
          description: 'Comment explaining the SDT',
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'type', 'startDateTime', 'endDateTime'],
    },
  },
  {
    name: 'delete_sdt',
    description: 'Delete a scheduled down time in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a scheduled down time in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        sdtId: {
          type: 'string',
          description: 'The ID of the SDT to delete',
        },
      },
      additionalProperties: false,
      required: ['sdtId'],
    },
  },

  // ConfigSource Tools
  {
    name: 'list_configsources',
    description: 'List all ConfigSources in LogicMonitor (LM) monitoring. ConfigSources track and alert on configuration file changes (e.g., router configs, firewall rules) for compliance and change management.',
    annotations: {
      title: 'List all ConfigSources in LogicMonitor (LM) monitoring. ConfigSources track and alert on configuration file changes (e.g., router configs, firewall rules) for compliance and change management.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Get detailed information about a specific configuration source by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific configuration source by its ID in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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

  // Device Property Tools
  {
    name: 'list_device_properties',
    description: 'List all custom properties for a specific device in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'List all custom properties for a specific device in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
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
    name: 'update_device_property',
    description: 'Update a custom property value for a device in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a custom property value for a device in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        propertyName: {
          type: 'string',
          description: 'The name of the property to update',
        },
        value: {
          type: 'string',
          description: 'The new value for the property',
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'propertyName', 'value'],
    },
  },

  // Search Tools
  {
    name: 'search_devices',
    description: 'Search for devices/resources in LogicMonitor (LM) monitoring by name or description. Supports both free-text search (e.g., "production") and filter syntax (e.g., "hostStatus:alive"). Free-text searches across displayName, description, and name fields automatically.',
    annotations: {
      title: 'Search for devices/resources in LogicMonitor (LM) monitoring. Supports free-text search and filter syntax with auto-formatting.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Use free text (e.g., "server") or filter syntax (e.g., "hostStatus:alive"). Free text automatically searches displayName, description, and name fields.',
        },
        ...paginationSchema,
      },
      additionalProperties: false,
      required: ['query'],
    },
  },
  {
    name: 'search_alerts',
    description: 'Search for alerts in LogicMonitor (LM) monitoring. Supports both free-text search and filter syntax. Free-text searches by resource/device name (e.g., "k8s-prod-cluster"). For advanced searches, use filter syntax (e.g., "severity:critical", "resourceTemplateName~*CPU*"). Note: Alert API does not support OR operations (||), use comma for AND.',
    annotations: {
      title: 'Search for alerts in LogicMonitor (LM) monitoring. Supports free-text search and filter syntax with auto-formatting.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Free text (e.g., "production") searches by resource/device name. Use filter syntax for specific fields: "severity:critical", "resourceTemplateName~*CPU*", "acked:false". Combine with comma for AND: "severity:critical,acked:false".',
        },
        ...paginationSchema,
      },
      additionalProperties: false,
      required: ['query'],
    },
  },

  // Audit Logs Tools
  {
    name: 'list_audit_logs',
    description: 'List audit logs in LogicMonitor (LM) monitoring. Returns audit trail of user actions, API calls, and system changes. Use filters to search by user, action type, time range, or IP address. Essential for compliance, security auditing, and troubleshooting.',
    annotations: {
      title: 'List audit logs in LogicMonitor (LM) monitoring for compliance and security auditing.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_audit_log',
    description: 'Get detailed information about a specific audit log entry in LogicMonitor (LM) monitoring by its ID. Returns full details including user, timestamp, action performed, affected resource, and changes made.',
    annotations: {
      title: 'Get detailed information about a specific audit log entry in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        auditLogId: {
          type: 'string',
          description: 'The ID of the audit log entry to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['auditLogId'],
    },
  },
  {
    name: 'search_audit_logs',
    description: 'Search audit logs in LogicMonitor (LM) monitoring by user, action, or resource. Supports free-text search and filter syntax. Free-text searches across username, description, and IP fields. Use filters like "username:admin", "happenedOn>1640995200", "sessionId:*xyz*" for precise queries.',
    annotations: {
      title: 'Search audit logs in LogicMonitor (LM) monitoring with free-text or filter syntax.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Free text searches username, description, and IP. Use filter syntax for specific fields: "username:john.doe", "happenedOn>1640995200" (epoch seconds), "description~*device*", "ip:192.168.1.*". Combine with comma for AND.',
        },
        ...paginationSchema,
      },
      additionalProperties: false,
      required: ['query'],
    },
  },

  // Access Groups Tools
  {
    name: 'list_access_groups',
    description: 'List all access groups in LogicMonitor (LM) monitoring. Access groups control resource visibility and permissions. Use filters to find specific groups. Essential for managing multi-tenant environments and role-based access control.',
    annotations: {
      title: 'List all access groups in LogicMonitor (LM) monitoring for managing permissions.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_access_group',
    description: 'Get detailed information about a specific access group in LogicMonitor (LM) monitoring by its ID. Returns group name, description, tenant ID, and associated resources/users.',
    annotations: {
      title: 'Get detailed information about a specific access group in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },
  {
    name: 'create_access_group',
    description: 'Create a new access group in LogicMonitor (LM) monitoring. Access groups control which resources and data users can access. Requires name and description.',
    annotations: {
      title: 'Create a new access group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the access group',
        },
        description: {
          type: 'string',
          description: 'Description of the access group',
        },
        tenantId: {
          type: 'number',
          description: 'Tenant ID (optional, for multi-tenant environments)',
        },
      },
      additionalProperties: false,
      required: ['name', 'description'],
    },
  },
  {
    name: 'update_access_group',
    description: 'Update an existing access group in LogicMonitor (LM) monitoring. Can modify name, description, and tenant assignment.',
    annotations: {
      title: 'Update an existing access group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to update',
        },
        name: {
          type: 'string',
          description: 'New name for the access group',
        },
        description: {
          type: 'string',
          description: 'New description for the access group',
        },
        tenantId: {
          type: 'number',
          description: 'New tenant ID (optional)',
        },
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },
  {
    name: 'delete_access_group',
    description: 'Delete an access group from LogicMonitor (LM) monitoring. Warning: This action cannot be undone. Ensure no critical resources or users depend on this group.',
    annotations: {
      title: 'Delete an access group from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        accessGroupId: {
          type: 'number',
          description: 'The ID of the access group to delete',
        },
      },
      additionalProperties: false,
      required: ['accessGroupId'],
    },
  },

  // Device DataSources
  {
    name: 'list_device_datasources',
    description: 'List datasources applied to a specific device in LogicMonitor (LM) monitoring. Shows which datasources are actively monitoring the device, their status, and configuration.',
    annotations: {
      title: 'List datasources applied to a specific device in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
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
    name: 'get_device_datasource',
    description: 'Get detailed information about a specific datasource applied to a device in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a device datasource in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The device datasource ID',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId', 'deviceDataSourceId'],
    },
  },
  {
    name: 'update_device_datasource',
    description: 'Update a device datasource configuration in LogicMonitor (LM) monitoring (e.g., enable/disable alerting, stop monitoring).',
    annotations: {
      title: 'Update device datasource configuration in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The device ID',
        },
        deviceDataSourceId: {
          type: 'number',
          description: 'The device datasource ID',
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

  // EventSources
  {
    name: 'list_eventsources',
    description: 'List all eventsources in LogicMonitor (LM) monitoring. EventSources collect and process event data from log files, Windows events, syslog, and other event streams.',
    annotations: {
      title: 'List all eventsources in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Get detailed information about a specific eventsource by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a specific eventsource in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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

  // Escalation Chains
  {
    name: 'list_escalation_chains',
    description: 'List all escalation chains in LogicMonitor (LM) monitoring. Escalation chains define how alerts are routed and escalated to notification recipients.',
    annotations: {
      title: 'List all escalation chains in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_escalation_chain',
    description: 'Get detailed information about a specific escalation chain by its ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about an escalation chain in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },
  {
    name: 'create_escalation_chain',
    description: 'Create a new escalation chain in LogicMonitor (LM) monitoring to define alert routing and escalation stages.',
    annotations: {
      title: 'Create a new escalation chain in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the escalation chain',
        },
        description: {
          type: 'string',
          description: 'Description of the escalation chain',
        },
        stages: {
          type: 'array',
          description: 'Array of escalation stages with recipients and timing',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_escalation_chain',
    description: 'Update an existing escalation chain in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an escalation chain in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to update',
        },
        name: {
          type: 'string',
          description: 'New name for the escalation chain',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        stages: {
          type: 'array',
          description: 'Updated array of escalation stages',
        },
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },
  {
    name: 'delete_escalation_chain',
    description: 'Delete an escalation chain from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete an escalation chain from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to delete',
        },
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },

  // Recipients
  {
    name: 'list_recipients',
    description: 'List all alert recipients in LogicMonitor (LM) monitoring. Recipients receive alert notifications via email, SMS, or other methods.',
    annotations: {
      title: 'List all alert recipients in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_recipient',
    description: 'Get detailed information about a specific recipient by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a recipient in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: {
          type: 'number',
          description: 'The ID of the recipient to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['recipientId'],
    },
  },
  {
    name: 'create_recipient',
    description: 'Create a new alert recipient in LogicMonitor (LM) monitoring to receive notifications.',
    annotations: {
      title: 'Create a new alert recipient in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Recipient type (e.g., "email", "sms")',
        },
        addr: {
          type: 'string',
          description: 'Recipient address (email or phone number)',
        },
        name: {
          type: 'string',
          description: 'Recipient name',
        },
        method: {
          type: 'string',
          description: 'Notification method',
        },
      },
      additionalProperties: false,
      required: ['type', 'addr'],
    },
  },
  {
    name: 'update_recipient',
    description: 'Update an existing alert recipient in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an alert recipient in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: {
          type: 'number',
          description: 'The ID of the recipient to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        addr: {
          type: 'string',
          description: 'New address',
        },
        method: {
          type: 'string',
          description: 'New notification method',
        },
      },
      additionalProperties: false,
      required: ['recipientId'],
    },
  },
  {
    name: 'delete_recipient',
    description: 'Delete an alert recipient from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete an alert recipient from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: {
          type: 'number',
          description: 'The ID of the recipient to delete',
        },
      },
      additionalProperties: false,
      required: ['recipientId'],
    },
  },

  // Recipient Groups
  {
    name: 'list_recipient_groups',
    description: 'List all recipient groups in LogicMonitor (LM) monitoring. Recipient groups organize multiple recipients for easier alert routing.',
    annotations: {
      title: 'List all recipient groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_recipient_group',
    description: 'Get detailed information about a specific recipient group by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a recipient group in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_recipient_group',
    description: 'Create a new recipient group in LogicMonitor (LM) monitoring to organize alert recipients.',
    annotations: {
      title: 'Create a new recipient group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the recipient group',
        },
        description: {
          type: 'string',
          description: 'Description of the group',
        },
        recipientIds: {
          type: 'array',
          description: 'Array of recipient IDs to include in this group',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_recipient_group',
    description: 'Update an existing recipient group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a recipient group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        recipientIds: {
          type: 'array',
          description: 'Updated array of recipient IDs',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_recipient_group',
    description: 'Delete a recipient group from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a recipient group from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Alert Rules
  {
    name: 'list_alert_rules',
    description: 'List all alert rules in LogicMonitor (LM) monitoring. Alert rules define how alerts are routed to escalation chains and recipients.',
    annotations: {
      title: 'List all alert rules in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_alert_rule',
    description: 'Get detailed information about a specific alert rule by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about an alert rule in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'number',
          description: 'The ID of the alert rule to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['ruleId'],
    },
  },
  {
    name: 'create_alert_rule',
    description: 'Create a new alert rule in LogicMonitor (LM) monitoring to define alert routing logic.',
    annotations: {
      title: 'Create a new alert rule in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the alert rule',
        },
        priority: {
          type: 'number',
          description: 'Priority of the rule (lower number = higher priority, default: 10)',
        },
        escalationChainId: {
          type: 'number',
          description: 'ID of the escalation chain to use for alerts matching this rule',
        },
        devices: {
          type: 'array',
          description: 'Array of device criteria for this rule',
        },
        datasources: {
          type: 'array',
          description: 'Array of datasource criteria for this rule',
        },
      },
      additionalProperties: false,
      required: ['name', 'escalationChainId'],
    },
  },
  {
    name: 'update_alert_rule',
    description: 'Update an existing alert rule in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an alert rule in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'number',
          description: 'The ID of the alert rule to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        priority: {
          type: 'number',
          description: 'New priority',
        },
        escalationChainId: {
          type: 'number',
          description: 'New escalation chain ID',
        },
        devices: {
          type: 'array',
          description: 'Updated device criteria',
        },
        datasources: {
          type: 'array',
          description: 'Updated datasource criteria',
        },
      },
      additionalProperties: false,
      required: ['ruleId'],
    },
  },
  {
    name: 'delete_alert_rule',
    description: 'Delete an alert rule from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete an alert rule from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'number',
          description: 'The ID of the alert rule to delete',
        },
      },
      additionalProperties: false,
      required: ['ruleId'],
    },
  },

  // OpsNotes
  {
    name: 'list_opsnotes',
    description: 'List all operational notes (OpsNotes) in LogicMonitor (LM) monitoring. OpsNotes document changes, maintenance windows, and operational events.',
    annotations: {
      title: 'List all operational notes in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_opsnote',
    description: 'Get detailed information about a specific operational note by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about an operational note in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },
  {
    name: 'create_opsnote',
    description: 'Create a new operational note in LogicMonitor (LM) monitoring to document changes or events.',
    annotations: {
      title: 'Create a new operational note in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: 'The note text content',
        },
        scopes: {
          type: 'array',
          description: 'Array of scopes (devices, groups) this note applies to',
        },
        tags: {
          type: 'array',
          description: 'Array of tags for categorizing the note',
        },
        happenOnInSec: {
          type: 'number',
          description: 'Timestamp (in seconds since epoch) when the event occurred',
        },
      },
      additionalProperties: false,
      required: ['note'],
    },
  },
  {
    name: 'update_opsnote',
    description: 'Update an existing operational note in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update an operational note in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to update',
        },
        note: {
          type: 'string',
          description: 'Updated note text',
        },
        scopes: {
          type: 'array',
          description: 'Updated scopes',
        },
        tags: {
          type: 'array',
          description: 'Updated tags',
        },
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },
  {
    name: 'delete_opsnote',
    description: 'Delete an operational note from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete an operational note from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        opsNoteId: {
          type: 'string',
          description: 'The ID of the OpsNote to delete',
        },
      },
      additionalProperties: false,
      required: ['opsNoteId'],
    },
  },

  // Services
  {
    name: 'list_services',
    description: 'List all business services in LogicMonitor (LM) monitoring. Services represent business-level monitoring aggregations.',
    annotations: {
      title: 'List all business services in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_service',
    description: 'Get detailed information about a specific service by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a service in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['serviceId'],
    },
  },
  {
    name: 'create_service',
    description: 'Create a new business service in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new business service in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service',
        },
        type: {
          type: 'string',
          description: 'Type of service (default: "default")',
        },
        description: {
          type: 'string',
          description: 'Description of the service',
        },
        groupId: {
          type: 'number',
          description: 'ID of the service group to place this service in',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_service',
    description: 'Update an existing business service in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a business service in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['serviceId'],
    },
  },
  {
    name: 'delete_service',
    description: 'Delete a business service from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a business service from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'number',
          description: 'The ID of the service to delete',
        },
      },
      additionalProperties: false,
      required: ['serviceId'],
    },
  },

  // Service Groups
  {
    name: 'list_service_groups',
    description: 'List all service groups in LogicMonitor (LM) monitoring. Service groups organize business services.',
    annotations: {
      title: 'List all service groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_service_group',
    description: 'Get detailed information about a specific service group by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a service group in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_service_group',
    description: 'Create a new service group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new service group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the service group',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
        parentId: {
          type: 'number',
          description: 'Parent group ID (use 1 for root)',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_service_group',
    description: 'Update an existing service group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a service group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_service_group',
    description: 'Delete a service group from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a service group from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the service group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Report Groups
  {
    name: 'list_report_groups',
    description: 'List all report groups in LogicMonitor (LM) monitoring. Report groups organize reports.',
    annotations: {
      title: 'List all report groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_report_group',
    description: 'Get detailed information about a specific report group by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a report group in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_report_group',
    description: 'Create a new report group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new report group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the report group',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_report_group',
    description: 'Update an existing report group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a report group in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_report_group',
    description: 'Delete a report group from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a report group from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Collector Groups
  {
    name: 'list_collector_groups',
    description: 'List all collector groups in LogicMonitor (LM) monitoring. Collector groups organize collectors.',
    annotations: {
      title: 'List all collector groups in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_collector_group',
    description: 'Get detailed information about a specific collector group by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a collector group in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the collector group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Device Group Properties
  {
    name: 'list_device_group_properties',
    description: 'List all custom properties for a specific device group in LogicMonitor (LM) monitoring. Properties are inherited by devices in the group.',
    annotations: {
      title: 'List device group properties in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The device group ID',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'update_device_group_property',
    description: 'Update a custom property value for a device group in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a device group property in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The device group ID',
        },
        propertyName: {
          type: 'string',
          description: 'The name of the property to update',
        },
        value: {
          type: 'string',
          description: 'The new value for the property',
        },
      },
      additionalProperties: false,
      required: ['groupId', 'propertyName', 'value'],
    },
  },

  // Netscans
  {
    name: 'list_netscans',
    description: 'List all network discovery scans (Netscans) in LogicMonitor (LM) monitoring. Netscans automatically discover and add devices.',
    annotations: {
      title: 'List all network discovery scans in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_netscan',
    description: 'Get detailed information about a specific netscan by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about a netscan in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the netscan to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },
  {
    name: 'create_netscan',
    description: 'Create a new network discovery scan in LogicMonitor (LM) monitoring to automatically discover devices.',
    annotations: {
      title: 'Create a new network discovery scan in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the netscan',
        },
        collectorId: {
          type: 'number',
          description: 'ID of the collector that will perform the scan',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
        schedule: {
          type: 'object',
          description: 'Schedule configuration (e.g., { cron: "0 0 * * *" })',
        },
        subnet: {
          type: 'string',
          description: 'Subnet to scan (e.g., "192.168.1.0/24")',
        },
        excludeDuplicateType: {
          type: 'string',
          description: 'How to handle duplicate devices',
        },
      },
      additionalProperties: false,
      required: ['name', 'collectorId'],
    },
  },
  {
    name: 'update_netscan',
    description: 'Update an existing network discovery scan in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a network discovery scan in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the netscan to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        schedule: {
          type: 'object',
          description: 'New schedule configuration',
        },
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },
  {
    name: 'delete_netscan',
    description: 'Delete a network discovery scan from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a network discovery scan from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        netscanId: {
          type: 'number',
          description: 'The ID of the netscan to delete',
        },
      },
      additionalProperties: false,
      required: ['netscanId'],
    },
  },

  // Integrations
  {
    name: 'list_integrations',
    description: 'List all third-party integrations in LogicMonitor (LM) monitoring (e.g., Slack, PagerDuty, ServiceNow).',
    annotations: {
      title: 'List all third-party integrations in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'get_integration',
    description: 'Get detailed information about a specific integration by ID in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Get detailed information about an integration in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        integrationId: {
          type: 'number',
          description: 'The ID of the integration to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['integrationId'],
    },
  },
  {
    name: 'create_integration',
    description: 'Create a new third-party integration in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Create a new third-party integration in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the integration',
        },
        type: {
          type: 'string',
          description: 'Integration type (e.g., "slack", "pagerduty")',
        },
        url: {
          type: 'string',
          description: 'Integration URL/webhook',
        },
        extra: {
          type: 'object',
          description: 'Additional integration-specific configuration',
        },
      },
      additionalProperties: false,
      required: ['name', 'type'],
    },
  },
  {
    name: 'update_integration',
    description: 'Update an existing third-party integration in LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Update a third-party integration in LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        integrationId: {
          type: 'number',
          description: 'The ID of the integration to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        url: {
          type: 'string',
          description: 'New URL/webhook',
        },
        extra: {
          type: 'object',
          description: 'Updated configuration',
        },
      },
      additionalProperties: false,
      required: ['integrationId'],
    },
  },
  {
    name: 'delete_integration',
    description: 'Delete a third-party integration from LogicMonitor (LM) monitoring.',
    annotations: {
      title: 'Delete a third-party integration from LogicMonitor (LM) monitoring.',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        integrationId: {
          type: 'number',
          description: 'The ID of the integration to delete',
        },
      },
      additionalProperties: false,
      required: ['integrationId'],
    },
  },

  // Website Checkpoints
  {
    name: 'list_website_checkpoints',
    description: 'List available checkpoint locations for website monitoring in LogicMonitor (LM) monitoring. Checkpoints are global locations from which synthetic tests run.',
    annotations: {
      title: 'List available website monitoring checkpoint locations in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },

  // Topology
  {
    name: 'get_topology',
    description: 'Get network topology information in LogicMonitor (LM) monitoring. Shows device relationships and network connectivity.',
    annotations: {
      title: 'Get network topology information in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },

  // Collector Versions
  {
    name: 'list_collector_versions',
    description: 'List available collector versions in LogicMonitor (LM) monitoring. Shows available collector software versions for download and installation.',
    annotations: {
      title: 'List available collector versions in LogicMonitor (LM) monitoring.',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'number',
          description: 'Number of results per page (default: 50, max: 1000).',
        },
        offset: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0).',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
];

/**
 * Get LogicMonitor tools, optionally filtered by read-only status
 * @param onlyReadOnly - If true, only return tools with readOnlyHint: true
 * @returns Array of Tool definitions
 */
export function getLogicMonitorTools(onlyReadOnly: boolean = false): Tool[] {
  if (!onlyReadOnly) {
    return ALL_LOGICMONITOR_TOOLS;
  }

  // Filter to only include tools with readOnlyHint: true
  return ALL_LOGICMONITOR_TOOLS.filter(tool => {
    const readOnlyHint = tool.annotations?.readOnlyHint;
    return readOnlyHint === true;
  });
}
