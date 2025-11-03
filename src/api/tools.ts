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
    name: 'list_resources',
    description: 'List all monitored resources/devices in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of resource/device with: id, displayName, name (IP/hostname), hostStatus (dead/alive/unknown), preferredCollectorId, deviceType, custom properties, group memberships. ' +
      '\n\n**When to use:** ' +
      '\n - Get inventory of all monitored resources/devices' +
      '\n - Find specific resource/device by name/IP/property' +
      '\n - Check resource/device health status' +
      '\n - Get resource/device IDs for other operations' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"displayName\\~\\*prod\\*" (wildcard search) ' +
      '\n- By status: filter:"hostStatus:alive" or filter:"hostStatus:dead" ' +
      '\n- By type: filter:"systemProperties.name:system.devicetype,value:server" ' +
      '\n- By collector: filter:"preferredCollectorId:123" ' +
      '\n- Multiple conditions: filter:"hostStatus:alive,displayName~\\*web\\*" (comma = AND) ' +
      '\n\n**Performance tips:** Use autoPaginate:false for large environments (>1000 resources/devices) and paginate manually to avoid timeouts. ' +
      '\n\n**Related tools:** "get_resource" (details), "search_resources" (simpler text search), "generate_resource_link" (get UI link).',
    annotations: {
      title: 'List monitored resources/resources/devices',
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
    name: 'get_resource',
    description: 'Get detailed information about a specific resource/device in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete resource/device details including: displayName, IP/hostname, hostStatus, alertStatus, collector assignment, resource/device type, custom properties, applied datasources, group memberships, last data time, creation date. ' +
      '\n\n**When to use:** (1) Get full details after finding resource/device ID via "list_resources", (2) Check resource/device configuration, (3) Verify collector assignment, (4) Review custom properties before updating. ' +
      '\n\n**Workflow:** Use "list_resources" or "search_resources" first to find the deviceId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_device_datasources" (see what\'s monitored), "list_device_properties" (view all properties), "generate_resource_link" (get UI link).',
    annotations: {
      title: 'Get resource/device details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The ID of the resource/device to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'create_resource',
    description: 'Add a new resource/device or multiple resources/resources/devices to LogicMonitor (LM) monitoring. ' +
      '\n\n**Two modes: Single resource/device OR Batch creation** ' +
      '\n\n**Single resource/device mode (most common):** ' +
      '• Required: displayName (friendly name), name (IP/hostname), preferredCollectorId (from "list_collectors") ' +
      '• Optional: hostGroupIds (folder location), description, disableAlerting, customProperties ' +
      '• Example: Add "prod-web-01" at 192.168.1.100 to Production folder monitored by collector 5 ' +
      '\n\n**Batch mode (for multiple resources/resources/devices):** ' +
      '• Provide resource/device array, each with displayName, name, preferredCollectorId ' +
      '• Use batchOptions: {maxConcurrent: 5, continueOnError: true} ' +
      '• Processes up to 5 resource/device simultaneously ' +
      '• If one fails, others continue (when continueOnError:true) ' +
      '\n\n**When to use:** (1) Add new servers/resources/devices to monitoring, (2) Onboard cloud instances, (3) Bulk import from CMDB/inventory, (4) Auto-discovery integration. ' +
      '\n\n**Before creating:** ' +
      '1. Use "list_collectors" to find available collectorId (must be alive/healthy) ' +
      '2. Use "list_resource_groups" to find hostGroupIds for folder placement ' +
      '3. Verify IP/hostname is reachable from collector ' +
      '\n\n**Custom properties examples:** ' +
      '• Environment: {name: "env", value: "production"} ' +
      '• Owner: {name: "owner", value: "platform-team"} ' +
      '• Credentials: {name: "ssh.user", value: "monitoring"} (for authentication) ' +
      '\n\n**Performance tip:** For >50 resources/devices, use batch mode to avoid rate limits. ' +
      '\n\n**After creation:** Use "list_resources" to verify resource/device was added, check hostStatus. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_resource_groups" (find folder), "update_resource" (modify), "generate_resource_link" (get URL).',
    annotations: {
      title: 'Add resource/device(s)',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single resource/device properties
        displayName: {
          type: 'string',
          description: 'Display name for the resource/device (for single creation)',
        },
        name: {
          type: 'string',
          description: 'IP address or hostname of the resource/device (for single creation)',
        },
        preferredCollectorId: {
          type: 'number',
          description: 'ID of the collector to monitor this resource/device (for single creation)',
        },
        hostGroupIds: {
          type: 'string',
          description: 'Comma-separated list of resource/device group IDs (for single creation)',
        },
        description: {
          type: 'string',
          description: 'Description of the resource/device (for single creation)',
        },
        disableAlerting: {
          type: 'boolean',
          description: 'Whether to disable alerting for this resource/device (for single creation)',
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
          description: 'Array of resource/device to create (for batch creation)',
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
    name: 'update_resource',
    description: 'Modify an existing resource/device or multiple resources/devices in LogicMonitor (LM) monitoring. ' +
      '\n\n**Two modes: Single resource/device OR Batch update** ' +
      '\n\n**Single resource/device mode:** ' +
      '• Required: deviceId (from "list_resources" or "search_resources") ' +
      '• Optional: displayName, description, disableAlerting, preferredCollectorId, customProperties ' +
      '• opType: "replace" (default) overwrites all, "add" merges with existing ' +
      '\n\n**Batch mode:** ' +
      '• Provide resource/device array, each must include deviceId ' +
      '• Use batchOptions for concurrent processing ' +
      '\n\n**When to use:** (1) Change resource/device name/description, (2) Move to different collector, (3) Enable/disable alerting, (4) Update custom properties, (5) Bulk modifications. ' +
      '\n\n**Common update scenarios:** ' +
      '• Rename device: {deviceId: 123, displayName: "new-prod-web-01"} ' +
      '• Disable alerts during migration: {deviceId: 123, disableAlerting: true} ' +
      '• Move to new collector: {deviceId: 123, preferredCollectorId: 5} ' +
      '• Update property: {deviceId: 123, customProperties: [{name: "env", value: "staging"}]} ' +
      '\n\n**opType explained:** ' +
      '• "replace": Overwrites entire field (careful with customProperties!) ' +
      '• "add": Merges/appends to existing values (safer for properties) ' +
      '\n\n**Workflow:** First find deviceId using "list_resources" or "search_resources", then update. ' +
      '\n\n**Related tools:** "list_resources" (find device), "get_resource" (verify before update), "update_device_property" (simpler property updates).',
    annotations: {
      title: 'Update resource/device(s)',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single resource/device properties
        deviceId: {
          type: 'number',
          description: 'The ID of the resource/device to update (for single update)',
        },
        displayName: {
          type: 'string',
          description: 'New display name for the resource/device (for single update)',
        },
        description: {
          type: 'string',
          description: 'New description for the resource/device (for single update)',
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
          description: 'Array of resource/device to update (for batch update). Each must include deviceId.',
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
    name: 'delete_resource',
    description: 'Remove a resource/device or multiple resources/resources/devices from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: DESTRUCTIVE OPERATION** ' +
      '• This permanently removes the resource/device from monitoring ' +
      '• All historical data will be deleted ' +
      '• All alerts for this resource/device will be cleared ' +
      '• This action CANNOT be undone ' +
      '\n\n**Two modes: Single resource/device OR Batch deletion** ' +
      '\n\n**Single resource/device mode:** ' +
      '• Required: deviceId (from "list_resources") ' +
      '• Optional: deleteFromSystem (true = complete removal including history) ' +
      '\n\n**Batch mode:** ' +
      '• Provide deviceIds array [123, 456, 789] ' +
      '• Use batchOptions for concurrent processing ' +
      '\n\n**When to use:** (1) Decommissioned servers, (2) Deleted cloud instances, (3) Cleanup after migrations, (4) Remove duplicate entries, (5) Bulk decommissioning. ' +
      '\n\n**⚠️ CONSIDER ALTERNATIVES FIRST:** ' +
      '• Need temporary suppression? Use "create_device_sdt" instead (reversible!) ' +
      '• Need to stop monitoring but keep history? Use "update_resource" with disableAlerting:true ' +
      '• Moving to different collector? Use "update_resource" to change collector ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_resource" to verify you have correct resource/device ' +
      '2. Consider if SDT or disableAlerting is better option ' +
      '3. If deletion necessary, delete resource/device ' +
      '4. No verification step possible (irreversible) ' +
      '\n\n**Batch deletion tip:** For >50 resources/devices, use batch mode with continueOnError:true to handle any failures gracefully. ' +
      '\n\n**Related tools:** "create_device_sdt" (temporary alternative), "update_resource" (disable without deleting), "list_resources" (find resource/device to delete).',
    annotations: {
      title: 'Delete resource/device(s)',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        // Single resource/device properties
        deviceId: {
          type: 'number',
          description: 'The ID of the resource/device to delete (for single deletion)',
        },
        deleteFromSystem: {
          type: 'boolean',
          description: 'Whether to delete the resource/device from the system completely',
        },
        // Batch properties
        deviceIds: {
          type: 'array',
          description: 'Array of resource/device IDs to delete (for batch deletion)',
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
    name: 'list_resource_groups',
    description: 'List all resource/device groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of groups with: id, name, parentId, full path, description, number of resources/devices, number of subgroups, custom properties. ' +
      '\n\n**What are groups:** Organizational folders for resources/devices, like directories in a file system. Used to organize by location, environment, customer, or any logical structure. ' +
      '\n\n**When to use:** (1) Browse resource/device organization, (2) Find group IDs for resource/device creation/assignment, (3) Understand resource/device hierarchy, (4) Get group IDs for group-level operations (properties, SDT). ' +
      '\n\n**Common use cases:** ' +
      '• Geographic: "US-West", "EU-Central", "APAC" ' +
      '• Environment: "Production", "Staging", "Development" ' +
      '• Customer: "Customer-A", "Customer-B" (for MSPs) ' +
      '• Function: "Web Servers", "Database Servers", "Network resources/Devices" ' +
      '\n\n**Common filter patterns:** ' +
      '• By name: filter:"name~*Production*" ' +
      '• Root groups: filter:"parentId:1" ' +
      '• Non-empty: filter:"numOfDirectDevices>0" ' +
      '\n\n**Groups inherit properties:** Custom properties set on group are inherited by all resource/device in that group (useful for credentials, location tags). ' +
      '\n\n**Related tools:** "get_resource_group" (details), "create_resource_group" (create new), "list_device_group_properties" (group properties).',
    annotations: {
      title: 'List resource/device groups',
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
    name: 'get_resource_group',
    description: 'Get detailed information about a specific resource/device group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete group details: name, full path, parentId, description, custom properties, number of resource/device (direct and total), number of subgroups, alert status, SDT status. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Review inherited properties, (3) Check group membership counts, (4) Verify group hierarchy, (5) Get group details before creating resource/device in it. ' +
      '\n\n**Key information:** ' +
      '• fullPath: Complete hierarchy (e.g., "/Production/Web Servers/US-East") ' +
      '• customProperties: Properties inherited by all resource/device in group ' +
      '• numOfDirectDevices: resources/Devices directly in this group ' +
      '• numOfHosts: Total resource/device including subgroups ' +
      '• alertStatus: Rollup alert status for entire group ' +
      '\n\n**Custom properties inheritance:** ' +
      'Properties set on group are inherited by ALL resource/device in group. Common uses: ' +
      '• Credentials: {name: "ssh.user", value: "monitoring"} ' +
      '• Environment tags: {name: "env", value: "production"} ' +
      '• Owner: {name: "team", value: "platform-engineering"} ' +
      '\n\n**Workflow:** Use "list_resource_groups" to find groupId, then use this tool for complete details including inherited properties. ' +
      '\n\n**Related tools:** "list_resource_groups" (find groups), "create_resource_group" (create new), "list_resources" (devices in group).',
    annotations: {
      title: 'Get resource/device group details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the resource/device group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_resource_group',
    description: 'Create a new resource/device group (folder) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates organizational folder for grouping resources/devices. Groups organize resource/device by location, function, customer, environment, etc. ' +
      '\n\n**When to use:** (1) Set up organizational structure before adding resources/devices, (2) Create folders for different teams/applications, (3) Establish hierarchy for multi-tenant environments, (4) Organize resource/device by location/datacenter. ' +
      '\n\n**Required parameters:** ' +
      '• name: Group name (e.g., "Production", "US-East", "Customer-A") ' +
      '\n\n**Optional parameters:** ' +
      '• parentId: Parent group ID (0 = root, or use existing group ID for nesting) ' +
      '• description: Group purpose/notes ' +
      '• customProperties: Properties inherited by all resource/device in group (credentials, tags) ' +
      '• appliesTo: Dynamic membership query (auto-add resource/device matching criteria) ' +
      '\n\n**Common organizational patterns:** ' +
      '\n\n**By environment:** ' +
      '• /Production (parentId: 0) ' +
      '• /Staging (parentId: 0) ' +
      '• /Development (parentId: 0) ' +
      '\n\n**By location:** ' +
      '• /Datacenters (parentId: 0) ' +
      '  • /Datacenters/US-East (parentId: Datacenters ID) ' +
      '  • /Datacenters/EU-West (parentId: Datacenters ID) ' +
      '\n\n**By function:** ' +
      '• /Infrastructure (parentId: 0) ' +
      '  • /Infrastructure/Web Servers ' +
      '  • /Infrastructure/Database Servers ' +
      '  • /Infrastructure/Network resources/Devices ' +
      '\n\n**By customer (MSP):** ' +
      '• /Customer-A (parentId: 0) ' +
      '• /Customer-B (parentId: 0) ' +
      '\n\n**Custom properties for groups:** ' +
      'Properties set on group are automatically inherited by all resources/resources/devices: ' +
      '• Credentials: {name: "ssh.user", value: "monitoring"} ' +
      '• Environment tag: {name: "env", value: "production"} ' +
      '• Owner: {name: "team", value: "platform"} ' +
      '\n\n**Dynamic groups (appliesTo):** ' +
      'Auto-add resource/device matching criteria: ' +
      '• appliesTo: "isWindows()" - All Windows resource/device ' +
      '• appliesTo: "system.hostname =~ \\".*prod.*\\"" - Hostnames containing "prod" ' +
      '• appliesTo: "hasCategory(\\"AWS/EC2\\")" - All AWS EC2 instances ' +
      '\n\n**Workflow:** Create group hierarchy first, then add resource/device to groups via "create_resource" or move existing resource/device via "update_resource". ' +
      '\n\n**Related tools:** "list_resource_groups" (browse hierarchy), "update_resource_group" (modify), "delete_resource_group" (remove empty groups).',
    annotations: {
      title: 'Create resource/device group',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the resource/device group',
        },
        parentId: {
          type: 'number',
          description: 'Parent group ID (use 1 for root)',
        },
        description: {
          type: 'string',
          description: 'Description of the resource/device group',
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
    name: 'update_resource_group',
    description: 'Update an existing resource/device group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group properties, custom properties, or dynamic membership rules. Changes to custom properties affect all resource/device in the group. ' +
      '\n\n**When to use:** (1) Rename group, (2) Update description, (3) Change/add custom properties (affects all resources/resources/devices), (4) Modify dynamic membership (appliesTo), (5) Move group to different parent. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Group ID to update (from "list_resource_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New group name ' +
      '• description: New description ' +
      '• parentId: Move to different parent group ' +
      '• customProperties: Update inherited properties (affects all resources/resources/devices!) ' +
      '• appliesTo: Change dynamic membership query ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename group:** ' +
      '{groupId: 123, name: "Production-US-East"} ' +
      '\n\n**Add credentials to all resource/device in group:** ' +
      '{groupId: 123, customProperties: [{name: "ssh.user", value: "monitoring"}]} ' +
      '\n\n**Update environment tag:** ' +
      '{groupId: 123, customProperties: [{name: "env", value: "production"}]} ' +
      '\n\n**Move group to different parent:** ' +
      '{groupId: 123, parentId: 456} // Moves group under new parent ' +
      '\n\n**Update dynamic membership:** ' +
      '{groupId: 123, appliesTo: "system.hostname =~ \\".*prod.*\\""} ' +
      '\n\n**⚠️ Important notes:** ' +
      '• Updating customProperties affects ALL resource/device in group (including subgroups) ' +
      '• Devices inherit properties - changes propagate immediately ' +
      '• Moving group (changing parentId) moves all resource/device and subgroups with it ' +
      '• Changing appliesTo can cause resource/device to auto-add or auto-remove ' +
      '\n\n**Best practice:** Use "get_resource_group" first to review current configuration and see which resource/device will be affected. ' +
      '\n\n**Workflow:** Use "list_resource_groups" to find groupId, review with "get_resource_group", then update. ' +
      '\n\n**Related tools:** "get_resource_group" (review before update), "list_resources" (see affected resources/devices), "list_resource_groups" (find group).',
    annotations: {
      title: 'Update resource/device group',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the resource/device group to update',
        },
        name: {
          type: 'string',
          description: 'New name for the resource/device group',
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
    name: 'delete_resource_group',
    description: 'Delete a resource/device group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: IMPACT ON DEVICES** ' +
      '• Deleting group does NOT delete resource/device - resource/device are moved to parent group or root ' +
      '• Subgroups are also deleted (recursive) ' +
      '• resources/Devices lose inherited custom properties from this group ' +
      '• Cannot delete groups with subgroups or resource/device (must be empty) ' +
      '\n\n**What this does:** Removes organizational folder from hierarchy. resources/Devices and subgroups must be moved/deleted first before deleting group. ' +
      '\n\n**When to use:** (1) Clean up unused organizational folders, (2) Restructure group hierarchy, (3) Remove temporary groupings, (4) Consolidate duplicate groups. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Group ID to delete (from "list_resource_groups") ' +
      '\n\n**Optional parameters:** ' +
      '• deleteHardFlag: true = delete even if has resource/device (moves resource/device to root), false = fail if not empty (safer, default) ' +
      '\n\n**Before deleting - check:** ' +
      '1. Use "get_resource_group" to see how many resource/device and subgroups ' +
      '2. Use "list_resources" with filter to see which resource/device are in group ' +
      '3. Move resource/device to another group via "update_resource" if needed ' +
      '4. Delete or move subgroups first ' +
      '\n\n**Common workflow for cleanup:** ' +
      '\n\n**Safe deletion (empty group only):** ' +
      '1. Check group: get_resource_group(groupId: 123) ' +
      '2. If numOfHosts = 0 and no subgroups: delete_resource_group(groupId: 123) ' +
      '3. If has resources/devices: Move resource/device first, then delete group ' +
      '\n\n**Force deletion (moves resources/devices):** ' +
      '1. delete_resource_group(groupId: 123, deleteHardFlag: true) ' +
      '2. resources/Devices move to parent group (or root if no parent) ' +
      '3. resources/Devices lose inherited custom properties from deleted group ' +
      '\n\n**⚠️ Impact of deletion:** ' +
      '• resources/Devices lose custom properties inherited from this group (credentials, tags) ' +
      '• Alert rules filtering by group path may break ' +
      '• Dashboards filtering by group may show no data ' +
      '• Reports scoped to this group need updating ' +
      '\n\n**Best practice:** Move resource/device to new group before deleting old group to avoid losing custom properties. ' +
      '\n\n**Workflow:** Use "get_resource_group" to verify empty, then delete. Or move resource/device first via "update_resource". ' +
      '\n\n**Related tools:** "get_resource_group" (check before delete), "list_resources" (find resource/device in group), "update_resource" (move resource/device first).',
    annotations: {
      title: 'Delete resource/device group',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the resource/device group to delete',
        },
        deleteChildren: {
          type: 'boolean',
          description: 'Whether to delete child resource/device groups as well',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

  // Alert Management Tools
  {
    name: 'list_alerts',
    description: 'List active alerts in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of alerts with: id (alertId), severity (critical/error/warning), resource name, datasource, datapoint, alert message, start time (startEpoch), acknowledgement status (acked), alert rule. ' +
      '\n\n**When to use:** (1) Get all critical production alerts, (2) Find unacknowledged alerts needing attention, (3) Monitor specific service health, (4) Check CPU/memory alerts, (5) Generate alert reports. ' +
      '\n\n**Common filter patterns:** ' +
      '• Critical alerts: filter:"severity:critical" ' +
      '• Unacknowledged: filter:"acked:false" ' +
      '• Specific device: filter:"monitorObjectName~*prod-web-01*" ' +
      '• CPU alerts: filter:"resourceTemplateName~*CPU*" ' +
      '• Recent alerts: filter:"startEpoch>1730851200" (epoch seconds) ' +
      '• Combined: filter:"severity:critical,acked:false" (AND logic) ' +
      '\n\n**Important:** Alert API does NOT support OR operator (||). Use comma for AND only. For complex queries, make multiple calls. ' +
      '\n\n**Related tools:** "get_alert" (full details), "acknowledge_alert" (acknowledge), "add_alert_note" (add notes), "search_alerts" (text search), "generate_alert_link" (get URL).',
    annotations: {
      title: 'List alerts',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Get detailed information about a specific alert in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete alert details: alert message, severity, threshold crossed, current value, alert history, escalation chain triggered, acknowledgement details, resource details, datasource/datapoint info, alert rule applied. ' +
      '\n\n**When to use:** (1) Investigate specific alert after getting ID from "list_alerts", (2) Check threshold and current values, (3) Review alert history and escalation, (4) Get context before acknowledging. ' +
      '\n\n**Workflow:** First use "list_alerts" to find the alertId, then use this tool for complete investigation details. ' +
      '\n\n**Related tools:** "acknowledge_alert" (acknowledge alert), "add_alert_note" (document findings), "generate_alert_link" (share with team).',
    annotations: {
      title: 'Get alert details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Acknowledge an alert in LogicMonitor (LM) monitoring to indicate someone is working on it. ' +
      '\n\n**What this does:** ' +
      '• Marks alert as "acknowledged" (someone is handling it) ' +
      '• STOPS alert escalation (no more notifications for this alert) ' +
      '• Records who acknowledged and when ' +
      '• Shows team the issue is being investigated ' +
      '\n\n**When to use:** (1) When you start investigating an alert, (2) To stop repeat notifications, (3) To show team ownership, (4) Before scheduling maintenance, (5) During incident response. ' +
      '\n\n**Required parameters:** ' +
      '• alertId: Alert ID from "list_alerts" or "search_alerts" ' +
      '• comment: REQUIRED - Explain what you\'re doing (e.g., "Investigating high CPU. Checking processes.") ' +
      '\n\n**Best practices:** ' +
      '• Acknowledge immediately when starting investigation ' +
      '• Add meaningful comment for team communication ' +
      '• Use "add_alert_note" to document findings as you investigate ' +
      '• If false alarm, acknowledge with explanation ' +
      '\n\n**Comment examples:** ' +
      '• "Investigating. Appears to be batch job. Monitoring." ' +
      '• "False alarm - planned maintenance. Creating SDT." ' +
      '• "Working on fix. ETA 30 minutes. - John" ' +
      '• "Escalated to network team. Ticket INC-12345." ' +
      '\n\n**Workflow for alert handling:** ' +
      '1. Use "list_alerts" with filter:"acked:false" to find unacked alerts ' +
      '2. Use this tool to acknowledge (stops notifications) ' +
      '3. Investigate issue ' +
      '4. Use "add_alert_note" to document findings and actions ' +
      '5. Resolve underlying issue (alert auto-clears when metrics normalize) ' +
      '\n\n**Note:** If alert continues (still above threshold), it stays acknowledged until cleared. New instances = new alerts. ' +
      '\n\n**Related tools:** "list_alerts" (find alerts), "get_alert" (investigate), "add_alert_note" (document), "generate_alert_link" (share).',
    annotations: {
      title: 'Acknowledge alert',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Add a note to an alert for documentation, collaboration, and incident tracking. ' +
      '\n\n**What this does:** ' +
      '• Adds timestamped note visible to entire team ' +
      '• Documents investigation steps and findings ' +
      '• Creates audit trail for postmortem analysis ' +
      '• Enables team collaboration on active incidents ' +
      '\n\n**When to use:** (1) Document investigation steps, (2) Share findings with team, (3) Track actions taken, (4) Explain resolution, (5) Note false positives, (6) Link to tickets/incidents. ' +
      '\n\n**Required parameters:** ' +
      '• alertId: Alert ID from "list_alerts" ' +
      '• note: Your documentation/findings ' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**During investigation:** ' +
      '• "Checked logs - found memory leak in app. Restarting service." ' +
      '• "CPU spike correlates with backup job. Expected behavior." ' +
      '• "Disk full on /var/log. Rotating logs now." ' +
      '\n\n**Team collaboration:** ' +
      '• "Paging database team - appears to be query performance issue" ' +
      '• "Confirmed network issue. Created ticket NET-5678 with network team" ' +
      '• "Waiting on cloud provider - incident status: https://status.aws.com" ' +
      '\n\n**Resolution documentation:** ' +
      '• "RESOLVED: Cleared temp files. Disk usage now 45%. Will schedule cleanup job." ' +
      '• "FALSE ALARM: Threshold too sensitive. Updated datasource threshold to 90%." ' +
      '• "FIXED: Restarted stuck process. Root cause analysis in JIRA-1234" ' +
      '\n\n**Best practices:** ' +
      '• Add notes as you investigate (breadcrumb trail) ' +
      '• Include timestamps for long investigations ' +
      '• Link to related tickets (JIRA, ServiceNow, etc.) ' +
      '• Document "why false alarm" for future reference ' +
      '• Use clear, actionable language ' +
      '\n\n**Workflow:** ' +
      '1. Acknowledge alert with "acknowledge_alert" (stops notifications) ' +
      '2. Add initial note: "Starting investigation" ' +
      '3. Add notes as you discover findings ' +
      '4. Add final note with resolution or next steps ' +
      '\n\n**Related tools:** "acknowledge_alert" (first step), "get_alert" (view existing notes), "list_alerts" (find alerts).',
    annotations: {
      title: 'Add alert note',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'List all LogicMonitor (LM) monitoring collectors (monitoring agents). ' +
      '\n\n**Returns:** Array of collectors with: id, description (collector name), hostname, platform (Windows/Linux), status (alive/dead), build version, number of monitored resources/devices, last heartbeat time. ' +
      '\n\n**When to use:** (1) Check collector health status before adding resources/devices, (2) Find available collectors for new resource/device assignments, (3) Monitor collector capacity and load, (4) Identify offline/dead collectors. ' +
      '\n\n**What are collectors:** Lightweight agents installed on-premise or in cloud that collect metrics from resources/devices. Each resource/device must be assigned to one collector. ' +
      '\n\n**Common filter patterns:** ' +
      '• Alive collectors: filter:"status:alive" ' +
      '• By platform: filter:"platform:Linux" or filter:"platform:Windows" ' +
      '• By name: filter:"description~*prod*" ' +
      '• Low capacity: filter:"numberOfHosts<100" ' +
      '\n\n**Before creating resources/devices:** Use this tool to find collectorId for the "preferredCollectorId" parameter in "create_resource". ' +
      '\n\n**Related tools:** "get_collector" (details), "list_collector_groups" (browse groups), "list_collector_versions" (check updates).',
    annotations: {
      title: 'List collectors',
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
    name: 'get_collector',
    description: 'Get detailed information about a specific collector by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete collector details: description (name), hostname, platform, status, build version, number of resource/device monitored, free disk space, CPU/memory usage, last heartbeat, configuration. ' +
      '\n\n**When to use:** (1) Check collector health before assigning resources/devices, (2) Verify collector capacity, (3) Troubleshoot connectivity issues, (4) Check version for updates, (5) Monitor collector performance. ' +
      '\n\n**Health indicators to check:** ' +
      '• status: "alive" (healthy) vs "dead" (offline/problem) ' +
      '• numberOfHosts: How many resource/device this collector monitors (capacity planning) ' +
      '• freeDiskSpace: Disk space available (needs GB for data buffering) ' +
      '• build: Version number (compare with "list_collector_versions" for updates) ' +
      '• lastHeartbeatTime: Recent = healthy, old = potential issue ' +
      '\n\n**Workflow:** Use "list_collectors" to find collectorId, then use this tool for detailed health check. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_collector_versions" (check updates), "list_resources" (see assigned resources/devices).',
    annotations: {
      title: 'Get collector details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'List all available datasources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of datasources with: id, name, displayName, description, appliesTo (which resource/device it monitors), collection method, datapoints/metrics collected. ' +
      '\n\n**What are datasources:** Templates that define WHAT to monitor (e.g., CPU, memory, disk), HOW to collect it (SNMP, WMI, API), and WHEN to alert. LogicMonitor has 2000+ pre-built datasources for common technologies. ' +
      '\n\n**When to use:** (1) Find datasource for specific technology (e.g., "AWS_EC2", "VMware_vCenter"), (2) Discover what can be monitored, (3) Get datasource IDs for API operations, (4) Browse monitoring capabilities. ' +
      '\n\n**Common filter patterns:** ' +
      '• By name: filter:"name~*CPU*" or filter:"displayName~*Memory*" ' +
      '• Cloud providers: filter:"name~*AWS*" or filter:"name~*Azure*" ' +
      '• Database: filter:"name~*MySQL*" or filter:"name~*SQL_Server*" ' +
      '• Network: filter:"name~*Cisco*" or filter:"name~*SNMP*" ' +
      '\n\n**Examples:** AWS_EC2 (monitors EC2 instances), SNMP_Network_Interfaces (network stats), WinCPU (Windows CPU), Linux_SSH (Linux via SSH). ' +
      '\n\n**Related tools:** "get_datasource" (details), "list_device_datasources" (see what\'s applied to specific resource/device).',
    annotations: {
      title: 'List datasources',
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
    description: 'Get detailed information about a specific datasource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete datasource details: name, displayName, description, appliesTo logic, collection method, datapoints (metrics), thresholds, alert rules, polling interval. ' +
      '\n\n**When to use:** (1) Understand what datasource monitors, (2) Review alert thresholds, (3) See collection method (SNMP/WMI/API/script), (4) Check datapoint definitions, (5) Troubleshoot why datasource applies/doesn\'t apply to device. ' +
      '\n\n**Key information returned:** ' +
      '• appliesTo: Logic determining which resource/device get this datasource (e.g., "system.hostname =~ \\".*prod.*\\"") ' +
      '• dataSourceType: Collection method (SNMP, WMI, JDBC, API, script) ' +
      '• dataPoints: List of metrics collected (e.g., CPUBusyPercent, MemoryUsedPercent) ' +
      '• alertExpr: Threshold formulas (when to alert) ' +
      '• collectInterval: How often data is collected (seconds) ' +
      '\n\n**Understanding appliesTo logic:** Shows why datasource does/doesn\'t monitor certain resources/devices. Common patterns: ' +
      '• isWindows() - Only Windows resource/device ' +
      '• system.devicetype == "server" - Only servers ' +
      '• hasCategory("AWS/EC2") - Only AWS EC2 instances ' +
      '\n\n**Workflow:** Use "list_datasources" to find dataSourceId, then use this tool to understand how it works. ' +
      '\n\n**Related tools:** "list_datasources" (find datasource), "list_device_datasources" (see which resource/device use it).',
    annotations: {
      title: 'Get datasource details',
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
    name: 'list_resource_instances',
    description: 'List instances of a datasource on a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of instances with: id, name, displayName, description, status, alert status, last collection time. ' +
      '\n\n**What are instances:** Individual components monitored by a datasource. Examples: individual disks (C:, D:, E:), network interfaces (eth0, eth1), database tables, processes. ' +
      '\n\n**When to use:** (1) List all disks on a server before getting disk metrics, (2) Find specific network interface for bandwidth data, (3) Discover what instances are being monitored, (4) Get instance IDs for metric retrieval. ' +
      '\n\n**Example workflow:** ' +
      'Device "web-server-01" has datasource "WinVolumeUsage-" → instances: C:, D:, E: (each disk is an instance) ' +
      'Device "router-01" has datasource "SNMP_Network_Interfaces" → instances: GigabitEthernet0/1, GigabitEthernet0/2 (each interface is an instance) ' +
      '\n\n**Complete workflow to get metrics:** ' +
      '1. Use "list_device_datasources" to get deviceDataSourceId ' +
      '2. Use this tool to list instances and get instanceId ' +
      '3. Use "get_device_instance_data" with instanceId to get actual metrics ' +
      '\n\n**Related tools:** "list_device_datasources" (first step), "get_device_instance_data" (get metrics).',
    annotations: {
      title: 'List datasource instances',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
      '\n\n**When to use:** (1) Get CPU utilization for last 24 hours, (2) Fetch disk usage trends, (3) Retrieve network bandwidth data, (4) Export metrics for analysis, (5) Build custom dashboards/reports. ' +
      '\n\n**Required workflow (3 steps):** ' +
      '1. Use "list_device_datasources" → get deviceDataSourceId for datasource (e.g., WinCPU) ' +
      '2. Use "list_device_instances" → get instanceId for specific instance (e.g., CPU Core 0) ' +
      '3. Use this tool → get actual metric values for that instance ' +
      '\n\n**Parameters:** ' +
      '• deviceId: Device ID from "list_resources" ' +
      '• deviceDataSourceId: From "list_device_datasources" ' +
      '• instanceId: From "list_device_instances" ' +
      '• datapoints: Comma-separated metric names (e.g., "CPUBusyPercent,MemoryUsedPercent") ' +
      '• start/end: Time range in epoch milliseconds (not seconds!) ' +
      '\n\n**Example:** Get last hour CPU data: start=Date.now()-3600000, end=Date.now() ' +
      '\n\n**Time range tips:** If omitted, returns last 2 hours. Max range: 1 year. Use shorter ranges for better performance. ' +
      '\n\n**Related tools:** "list_device_datasources", "list_device_instances".',
    annotations: {
      title: 'Get time-series metric data',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'List all dashboards in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of dashboards with: id, name, description, groupId, groupName, widget count, owner. ' +
      '\n\n**When to use:** (1) Find AWS/Azure/infrastructure dashboards, (2) Discover available pre-built dashboards, (3) Get dashboard IDs for generating links, (4) List dashboards in specific group. ' +
      '\n\n**Common filter patterns:** ' +
      '• By name: filter:"name~*AWS*" (find all AWS dashboards) ' +
      '• By group: filter:"groupId:5" or filter:"groupName~*Cloud*" ' +
      '• By owner: filter:"owner:john.doe" ' +
      '\n\n**Next step:** Use "generate_dashboard_link" with the dashboard ID to get the full clickable URL for sharing. ' +
      '\n\n**Tip:** Dashboards are organized in groups. Use "list_dashboard_groups" to browse the hierarchy. ' +
      '\n\n**Related tools:** "get_dashboard" (details), "generate_dashboard_link" (get URL), "list_dashboard_groups" (browse hierarchy).',
    annotations: {
      title: 'List dashboards',
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
    name: 'get_dashboard',
    description: 'Get detailed information about a specific dashboard by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete dashboard details: name, description, groupId, owner, widgets configuration, widget count, sharing settings, template variables, last modified. ' +
      '\n\n**When to use:** (1) Review dashboard configuration, (2) See widget definitions before cloning, (3) Check dashboard owner, (4) Verify template variables, (5) Get dashboard metadata. ' +
      '\n\n**What you get:** ' +
      '• widgetsConfig: JSON configuration of all widgets (chart types, metrics, thresholds) ' +
      '• widgetTokens: Template variables (e.g., defaultDeviceGroup for dynamic filtering) ' +
      '• groupId/groupName: Which folder dashboard is in ' +
      '• sharable: Whether dashboard is public/private ' +
      '\n\n**Use cases:** ' +
      '• Clone dashboard to create similar one ' +
      '• Export dashboard configuration for backup ' +
      '• Audit which resources/devices/metrics are being visualized ' +
      '• Document dashboard purpose and widgets ' +
      '\n\n**Workflow:** Use "list_dashboards" to find dashboardId, then get details, then "generate_dashboard_link" to get shareable URL. ' +
      '\n\n**Related tools:** "list_dashboards" (find dashboard), "generate_dashboard_link" (get URL), "update_dashboard" (modify), "list_dashboard_groups" (browse folders).',
    annotations: {
      title: 'Get dashboard details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Create a new dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a new visual monitoring dashboard with widgets for metrics, alerts, maps, and more. Dashboards provide at-a-glance views of infrastructure health. ' +
      '\n\n**When to use:** (1) Build custom monitoring views for teams, (2) Create executive summary dashboards, (3) Visualize specific applications/services, (4) Set up NOC/SOC displays, (5) Share monitoring data with stakeholders. ' +
      '\n\n**Required parameters:** ' +
      '• name: Dashboard name (e.g., "Production Infrastructure", "Executive Summary") ' +
      '\n\n**Optional parameters:** ' +
      '• groupId: Dashboard folder ID (from "list_dashboard_groups", use 1 for root) ' +
      '• description: Dashboard purpose/audience ' +
      '• widgetsConfig: JSON array of widget configurations (graphs, alerts, gauges, maps) ' +
      '• sharable: true (public link) or false (private, login required) ' +
      '• widgetTokens: Template variables for dynamic filtering ' +
      '\n\n**Dashboard workflow:** ' +
      '1. Create empty dashboard with name and folder ' +
      '2. Use LogicMonitor UI to add widgets visually (easier than JSON) ' +
      '3. Use "get_dashboard" to export widgetsConfig for cloning ' +
      '4. Use "generate_dashboard_link" to get shareable URL ' +
      '\n\n**Common dashboard types:** ' +
      '\n\n**NOC/SOC Dashboard:** ' +
      '• Alert widgets showing critical alerts ' +
      '• Gauge widgets for key metrics (CPU, memory, bandwidth) ' +
      '• Maps showing geographic resource/device status ' +
      '• SLA widgets showing availability percentages ' +
      '\n\n**Executive Dashboard:** ' +
      '• High-level availability metrics ' +
      '• Alert counts by severity ' +
      '• Service health status ' +
      '• Trend graphs (week/month comparisons) ' +
      '\n\n**Application Dashboard:** ' +
      '• App server metrics (response time, throughput) ' +
      '• Database performance (queries/sec, connection pools) ' +
      '• Load balancer health ' +
      '• Error rate trends ' +
      '\n\n**Best practices:** ' +
      '• Start simple - create dashboard, add widgets in UI ' +
      '• Use groups to organize dashboards by team/function ' +
      '• Make critical dashboards "sharable" for NOC displays ' +
      '• Use widgetTokens for dynamic filtering (##defaultDeviceGroup##) ' +
      '• Clone existing dashboards using "get_dashboard" widgetsConfig ' +
      '\n\n**After creation:** Use "generate_dashboard_link" to get the full URL for sharing or embedding. ' +
      '\n\n**Related tools:** "generate_dashboard_link" (get URL), "list_dashboards" (browse existing), "get_dashboard" (export for cloning), "update_dashboard" (modify).',
    annotations: {
      title: 'Create dashboard',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Update an existing dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify dashboard name, description, widgets, sharing settings, or move to different folder. ' +
      '\n\n**When to use:** (1) Rename dashboard, (2) Update dashboard description, (3) Move to different folder, (4) Change sharing settings, (5) Bulk update widgets (advanced). ' +
      '\n\n**Required parameters:** ' +
      '• id: Dashboard ID (from "list_dashboards") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New dashboard name ' +
      '• description: Updated description ' +
      '• groupId: Move to different dashboard folder ' +
      '• sharable: true (make public) or false (require login) ' +
      '• widgetsConfig: JSON widget configuration (advanced - usually modify in UI) ' +
      '• widgetTokens: Update template variables ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename dashboard:** ' +
      '{id: 123, name: "Production - Updated"} ' +
      '\n\n**Move to different folder:** ' +
      '{id: 123, groupId: 456} ' +
      '\n\n**Make dashboard public (shareable):** ' +
      '{id: 123, sharable: true} ' +
      '\n\n**Update description:** ' +
      '{id: 123, description: "Executive view - updated quarterly"} ' +
      '\n\n**⚠️ Widget updates:** ' +
      'Updating widgetsConfig directly is complex (large JSON). Easier to: ' +
      '1. Modify widgets in LogicMonitor UI ' +
      '2. Use API only for name/description/folder changes ' +
      '3. Or use "get_dashboard" to export, modify JSON, then update ' +
      '\n\n**Best practice:** Use "get_dashboard" first to see current configuration, then update specific fields. ' +
      '\n\n**After update:** Use "generate_dashboard_link" to get updated URL if needed. ' +
      '\n\n**Related tools:** "get_dashboard" (review before update), "list_dashboards" (find dashboard), "generate_dashboard_link" (get new URL).',
    annotations: {
      title: 'Update dashboard',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'Delete a dashboard from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION** ' +
      '• Dashboard and all widgets are permanently removed ' +
      '• Shared dashboard links will stop working ' +
      '• Users with bookmarks will get 404 errors ' +
      '• Cannot be undone - no recovery possible ' +
      '\n\n**What this does:** Permanently removes dashboard from LogicMonitor. All widgets, configuration, and sharing links are deleted. ' +
      '\n\n**When to use:** (1) Remove outdated dashboards, (2) Clean up duplicates, (3) Delete test/temporary dashboards, (4) Consolidate similar dashboards. ' +
      '\n\n**Required parameters:** ' +
      '• id: Dashboard ID to delete (from "list_dashboards") ' +
      '\n\n**Before deleting - check:** ' +
      '1. Use "get_dashboard" to verify it\'s the correct dashboard ' +
      '2. Check if dashboard is widely shared/used ' +
      '3. Consider exporting configuration for backup (via "get_dashboard") ' +
      '4. Notify users if it\'s a team dashboard ' +
      '\n\n**Impact of deletion:** ' +
      '• NOC/SOC displays showing this dashboard will break ' +
      '• Embedded dashboard iframes will show errors ' +
      '• Users\' custom home dashboards may need reconfiguration ' +
      '• Shared public links become invalid ' +
      '\n\n**Alternatives to deletion:** ' +
      '• Rename to "ARCHIVED - [name]" instead of deleting ' +
      '• Move to "Archived" folder ' +
      '• Make private (sharable: false) instead of deleting ' +
      '• Export configuration via "get_dashboard" before deleting ' +
      '\n\n**Best practice:** Export dashboard configuration before deletion in case you need to recreate it. ' +
      '\n\n**Workflow:** Use "get_dashboard" to backup/verify, then delete. ' +
      '\n\n**Related tools:** "get_dashboard" (backup before delete), "list_dashboards" (find dashboard), "update_dashboard" (archive instead of delete).',
    annotations: {
      title: 'Delete dashboard',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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

  // Dashboard Link Tools
  {
    name: 'generate_dashboard_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) dashboard. ' +
      '\n\n**Returns:** Complete dashboard URL with full group hierarchy path, dashboard details (id, name, groupName), and group path array. URL pattern: https://{company}.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-{path},dashboards-{id}' +
      '\n\n**When to use:** (1) Share dashboard links in Slack/email/tickets, (2) Create documentation with direct dashboard links, (3) Embed dashboard URLs in runbooks, (4) Build custom reports with clickable links. ' +
      '\n\n**Why use this:** Provides the complete navigable URL including all parent group IDs, so the link opens the dashboard in correct context within the UI navigation tree. ' +
      '\n\n**Workflow:** First use "list_dashboards" to find dashboard ID, then use this tool to generate the shareable link. ' +
      '\n\n**Example output:** {url: "https://company.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-1,dashboardGroups-186,dashboards-1340", dashboard: {id: 1340, name: "AWS Overview"}, groupPath: [...]}' +
      '\n\n**Related tools:** "list_dashboards" (find dashboard), "get_dashboard" (get details).',
    annotations: {
      title: 'Generate dashboard link',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'generate_resource_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) resource/device. ' +
      '\n\n**Returns:** Complete resource URL with full group hierarchy, resource/device details (id, name, displayName), and group path array. URL pattern: https://{company}.logicmonitor.com/santaba/uiv4/resources/treeNodes?resourcePath=resourceGroups-{path},resources-{id}' +
      '\n\n**When to use:** (1) Share resource/device links in incident tickets, (2) Create alert notifications with resource/device links, (3) Build reports with clickable resource/device references, (4) Document infrastructure with direct LM links. ' +
      '\n\n**Why use this:** Provides the complete URL including all parent group IDs, so clicking the link navigates directly to the resource/device in the correct folder context. ' +
      '\n\n**Workflow:** First find resource/device using "list_resources" or "search_resources", then use this tool with deviceId to generate shareable link. ' +
      '\n\n**Related tools:** "list_resources" (find device), "get_resource" (get details), "generate_alert_link" (link to resource/device alerts).',
    annotations: {
      title: 'Generate resource/device link',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The ID of the resource/device to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'generate_alert_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) alert. ' +
      '\n\n**Returns:** Direct URL to alert details page. URL pattern: https://{company}.logicmonitor.com/santaba/uiv4/alerts/{alertId}' +
      '\n\n**When to use:** (1) Include alert links in Slack/PagerDuty notifications, (2) Share alert context with team members, (3) Create incident tickets with direct alert references, (4) Build alert reports with clickable links. ' +
      '\n\n**Why use this:** Simplifies alert investigation by providing direct navigation to the alert details page with full context, history, and acknowledgement options. ' +
      '\n\n**Workflow:** Get alertId from "list_alerts", then use this tool to generate the shareable link for team collaboration. ' +
      '\n\n**Related tools:** "list_alerts" (find alerts), "get_alert" (get details), "acknowledge_alert" (acknowledge).',
    annotations: {
      title: 'Generate alert link',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['alertId'],
    },
  },

  // Generate Link Group Tools
  {
    name: 'generate_website_link',
    description: 'Generate a direct URL/link for a LogicMonitor (LM) website monitor with full hierarchy path for easy sharing and navigation. ' +
      '\n\n**What this does:** Creates shareable URL that opens specific website monitor in LogicMonitor UI, preserving the full folder hierarchy path. Link works for anyone with access to the LogicMonitor portal. ' +
      '\n\n**Returns:** Complete URL in format: https://{company}.logicmonitor.com/santaba/uiv4/websites/treeNodes#websiteGroups-{groupId1},websiteGroups-{groupId2},...,websites-{websiteId} ' +
      '\n\n**When to use:** (1) Share website monitor with team (Slack/email/tickets), (2) Create documentation with direct links, (3) Build custom dashboards/reports with LM links, (4) Reference in incident tickets, (5) Bookmark frequently accessed monitors. ' +
      '\n\n**Required parameters:** ' +
      '• websiteId: Website monitor ID (from "list_websites" or "search_websites") ' +
      '\n\n**Common use cases:** ' +
      '\n\n**Share in Slack/Teams:** ' +
      '"Production API health check is failing: [View Monitor](generated-url-here)" ' +
      '\n\n**Incident ticket documentation:** ' +
      '"INC-12345: Website monitor showing SSL certificate expiring in 7 days. See: {generated-url}" ' +
      '\n\n**Runbook links:** ' +
      '"If homepage monitoring alerts, check: {generated-url-for-homepage-monitor}" ' +
      '\n\n**Custom reporting:** ' +
      'Build report that includes clickable links to each website monitor for quick access. ' +
      '\n\n**Link structure explained:** ' +
      'The URL includes complete folder path (websiteGroups) so when clicked, the UI shows: ' +
      '• Full breadcrumb navigation (e.g., "All Website Monitors > Production > External APIs > Homepage Check") ' +
      '• Website monitor details page ' +
      '• Recent check history and availability ' +
      '• Current status and response times ' +
      '\n\n**Why use generated links:** ' +
      '• **Shareable:** Send exact monitor to teammates ' +
      '• **Bookmarkable:** Save frequent monitors for quick access ' +
      '• **Integration-friendly:** Use in external tools, tickets, wikis ' +
      '• **Context-preserving:** Shows full folder hierarchy when opened ' +
      '\n\n**Workflow example:** ' +
      '1. Find website monitor: list_websites() → websiteId: 789 ' +
      '2. Generate link: generate_website_link(websiteId: 789) ' +
      '3. Share link: "Check this monitor: https://company.logicmonitor.com/santaba/uiv4/websites/..." ' +
      '\n\n**Access requirements:** ' +
      'Link recipients must: ' +
      '• Have LogicMonitor user account ' +
      '• Have permissions to view website monitors ' +
      '• Have access to specific website monitor (based on access groups) ' +
      '\n\n**Best practices:** ' +
      '• Use in incident documentation for traceability ' +
      '• Include in runbooks for quick troubleshooting access ' +
      '• Add to monitoring dashboards for drill-down capability ' +
      '• Share with stakeholders who have LM access ' +
      '\n\n**Related tools:** "list_websites" (find website), "get_website" (verify details), "generate_dashboard_link" (for dashboards), "generate_resource_link" (for resources/devices), "generate_alert_link" (for alerts).',
    annotations: {
      title: 'Generate website monitor link',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website monitor to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'list_dashboard_groups',
    description: 'List all dashboard groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of dashboard groups with: id, name, parentId, full path, description, number of dashboards, number of subgroups, owner. ' +
      '\n\n**What are dashboard groups:** Organizational folders for dashboards, like directories in a file system. Used to organize dashboards by team, function, or application. ' +
      '\n\n**When to use:** (1) Browse dashboard organization before creating/moving dashboards, (2) Find group IDs for dashboard operations, (3) Understand dashboard hierarchy, (4) Navigate to specific dashboard folders. ' +
      '\n\n**Common organization patterns:** ' +
      '• By team: "Platform Team", "Database Team", "Network Team" ' +
      '• By environment: "Production", "Staging", "Development" ' +
      '• By application: "Web App", "API Services", "Background Jobs" ' +
      '• By cloud provider: "AWS Dashboards", "Azure Dashboards" ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_dashboards" filtered by groupId to see dashboards in specific folder. ' +
      '\n\n**Related tools:** "get_dashboard_group" (details), "list_dashboards" (dashboards in group), "create_dashboard_group" (create folder).',
    annotations: {
      title: 'List dashboard groups',
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
    name: 'get_dashboard_group',
    description: 'Get detailed information about a specific dashboard group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete dashboard group details: name, full path, parentId, description, number of dashboards (direct and total), number of subgroups, owner, permissions. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Check group membership counts, (3) Verify group hierarchy, (4) Review permissions before creating dashboards in it. ' +
      '\n\n**Workflow:** Use "list_dashboard_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_dashboard_groups" (find groups), "list_dashboards" (dashboards in group), "create_dashboard_group" (create new).',
    annotations: {
      title: 'Get dashboard group details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'List all reports (scheduled and on-demand) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of reports with: id, name, type (alert/availability/capacity/performance), description, schedule, recipients, format (PDF/HTML/CSV), last run time. ' +
      '\n\n**What are reports:** Scheduled or on-demand documents summarizing monitoring data. Generate PDFs, HTML, or CSV files with metrics, alerts, availability statistics, capacity planning data. Automatically email to stakeholders. ' +
      '\n\n**When to use:** (1) Find existing reports before creating duplicates, (2) Review report schedules, (3) Check who receives reports, (4) Audit reporting configuration. ' +
      '\n\n**Report types:** ' +
      '• **Alert Reports:** Summary of alerts over time period (count by severity, MTTR, top alerting resources/devices) ' +
      '• **Availability Reports:** Uptime statistics, SLA compliance, outage summaries ' +
      '• **Capacity Planning:** Disk growth trends, CPU/memory usage over time, forecasting ' +
      '• **Performance Reports:** Metric trends, top consumers, performance baselines ' +
      '• **Custom Reports:** User-defined queries and visualizations ' +
      '\n\n**Common use cases:** ' +
      '• **Executive summaries:** Monthly availability report to leadership ' +
      '• **SLA reporting:** Prove 99.9% uptime to customers ' +
      '• **Capacity planning:** Forecast when to add storage/servers ' +
      '• **Compliance:** Document monitoring coverage and alert response ' +
      '• **Billing:** Usage reports for chargebacks ' +
      '\n\n**Report schedules:** ' +
      '• Daily: 8am delivery for NOC shift handoff ' +
      '• Weekly: Monday morning management briefing ' +
      '• Monthly: End-of-month SLA reports ' +
      '• Quarterly: Capacity planning reviews ' +
      '• On-demand: Generate for specific incidents/audits ' +
      '\n\n**Workflow:** Use this tool to find reports, then "get_report" for details, or "generate_report" to run on-demand. ' +
      '\n\n**Related tools:** "get_report" (details), "list_report_groups" (organization), "generate_report" (run now).',
    annotations: {
      title: 'List reports',
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
    name: 'get_report',
    description: 'Get detailed information about a specific report by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete report details: name, type, description, schedule (daily/weekly/monthly), recipients, format, data sources (which resources/devices/groups), date range, customization settings, last run timestamp, delivery status. ' +
      '\n\n**When to use:** (1) Review report configuration before modification, (2) Check recipients and schedule, (3) Verify data sources (which resource/device included), (4) Troubleshoot why report not received, (5) Clone report settings for similar report. ' +
      '\n\n**Configuration details:** ' +
      '• Schedule: When report runs (e.g., "Every Monday at 8am") ' +
      '• Recipients: Who receives report via email ' +
      '• Format: PDF (management), HTML (web), CSV (data analysis) ' +
      '• Scope: Which resources/devices/groups are included ' +
      '• Date range: Last 7 days, last month, custom period ' +
      '\n\n**Workflow:** Use "list_reports" to find reportId, then use this tool for complete configuration. ' +
      '\n\n**Related tools:** "list_reports" (find reports), "update_report" (modify), "generate_report" (run now).',
    annotations: {
      title: 'Get report details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    description: 'List all website monitors (synthetic checks) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of website monitors with: id, name, type (webcheck/pingcheck), domain/URL, status, checkpoint locations, response time, availability percentage. ' +
      '\n\n**What are website monitors:** Synthetic checks that test URL/service availability from multiple global locations. Like "ping from the internet" to verify your services are accessible. ' +
      '\n\n**When to use:** (1) List all monitored URLs/services, (2) Check website availability status, (3) Find website IDs for other operations, (4) Audit monitored endpoints. ' +
      '\n\n**Monitor types:** ' +
      '• webcheck: Full HTTP/HTTPS check (status code, response time, content validation, SSL cert) ' +
      '• pingcheck: Simple ICMP ping test (faster, simpler) ' +
      '\n\n**Common filter patterns:** ' +
      '• By domain: filter:"domain~*example.com*" ' +
      '• By type: filter:"type:webcheck" or filter:"type:pingcheck" ' +
      '• By status: filter:"overallAlertStatus:critical" (find down sites) ' +
      '• By name: filter:"name~*production*" ' +
      '\n\n**Use cases:** Monitor public websites, API endpoints, login pages, load balancer health checks, SaaS service availability. ' +
      '\n\n**Related tools:** "get_website" (details), "create_website" (add new), "generate_website_link" (get URL).',
    annotations: {
      title: 'List website monitors',
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
    description: 'Get detailed information about a specific website monitor by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete website monitor details: name, type (webcheck/pingcheck), domain/URL, monitoring configuration, checkpoint locations, response time thresholds, SSL settings, authentication, custom headers, alert status. ' +
      '\n\n**When to use:** (1) Review monitoring configuration, (2) Check checkpoint locations, (3) Verify URL and settings, (4) Troubleshoot failed checks, (5) Audit SSL certificate monitoring. ' +
      '\n\n**Configuration details returned:** ' +
      '• steps: Multi-step transaction monitoring (for complex workflows) ' +
      '• checkpoints: Which global locations perform checks (e.g., US-East, EU-West, Asia-Pacific) ' +
      '• schema: HTTP vs HTTPS ' +
      '• testLocation: Internal (from collector) vs External (from cloud) ' +
      '• responseTimeThreshold: Alert if slower than X ms ' +
      '• sslCertExpirationDays: Alert X days before cert expires ' +
      '\n\n**Use cases:** ' +
      '• Verify website is monitored from correct geographic locations ' +
      '• Check if SSL certificate expiration monitoring is enabled ' +
      '• Review response time thresholds (too strict? too lenient?) ' +
      '• Troubleshoot why website checks are failing ' +
      '• Document what endpoints are monitored ' +
      '\n\n**Workflow:** Use "list_websites" to find websiteId, then use this tool for complete monitoring configuration. ' +
      '\n\n**Related tools:** "list_websites" (find website), "update_website" (modify), "generate_website_link" (get URL), "list_website_checkpoints" (available locations).',
    annotations: {
      title: 'Get website monitor details',
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
    description: 'Create a new website monitor (synthetic check) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates synthetic monitoring for websites, APIs, or services. Tests from global checkpoint locations to verify availability, performance, and SSL certificate health. ' +
      '\n\n**When to use:** (1) Monitor customer-facing websites, (2) Check API endpoint availability, (3) Track response times from multiple regions, (4) Monitor SSL certificate expiration, (5) Verify multi-step transactions, (6) Monitor third-party services. ' +
      '\n\n**Required parameters:** ' +
      '• name: Monitor name (e.g., "Production Website", "API Health Check") ' +
      '• domain: URL or hostname (e.g., "example.com", "https://api.example.com") ' +
      '• type: "webcheck" (HTTP/HTTPS) or "pingcheck" (ICMP ping) ' +
      '\n\n**Optional parameters:** ' +
      '• groupId: Website folder ID (from "list_website_groups", default: root) ' +
      '• description: Monitor purpose/notes ' +
      '• checkpoints: Array of checkpoint IDs (from "list_website_checkpoints") for multi-region testing ' +
      '• steps: Array of HTTP steps for multi-step transactions (login, add to cart, checkout) ' +
      '• testLocation: "external" (from cloud) or "internal" (from collector) ' +
      '• schema: "https" or "http" ' +
      '• responseTimeThreshold: Alert if response time > X milliseconds ' +
      '• sslCertExpirationDays: Alert X days before SSL expires ' +
      '• failedCount: Alert after X consecutive failures (default: 2) ' +
      '\n\n**Monitor types explained:** ' +
      '\n\n**webcheck (HTTP/HTTPS):** ' +
      '• Full HTTP/HTTPS request with response validation ' +
      '• Check status codes, response time, content matching ' +
      '• Monitor SSL certificate expiration ' +
      '• Support for multi-step transactions ' +
      '• Custom headers, authentication, POST data ' +
      '\n\n**pingcheck (ICMP Ping):** ' +
      '• Simple reachability test ' +
      '• Faster, lower overhead than webcheck ' +
      '• Good for network resources/devices, non-HTTP services ' +
      '• Only tests if host is reachable ' +
      '\n\n**Common monitoring scenarios:** ' +
      '\n\n**Simple website availability:** ' +
      '{name: "Company Website", domain: "example.com", type: "webcheck", checkpoints: [1,2,3], responseTimeThreshold: 3000} ' +
      '\n\n**API health check:** ' +
      '{name: "API /health", domain: "https://api.example.com/health", type: "webcheck", responseTimeThreshold: 500} ' +
      '\n\n**SSL monitoring:** ' +
      '{name: "SSL Cert Check", domain: "example.com", type: "webcheck", sslCertExpirationDays: 30} ' +
      '\n\n**Multi-step transaction (e-commerce):** ' +
      '{name: "Checkout Flow", domain: "shop.example.com", type: "webcheck", steps: [{url: "/login", method: "POST"}, {url: "/cart/add"}, {url: "/checkout"}]} ' +
      '\n\n**Regional performance monitoring:** ' +
      '{name: "Global Website Performance", domain: "example.com", type: "webcheck", checkpoints: [1,2,3,4,5,6]} // Test from US, EU, Asia ' +
      '\n\n**Best practices:** ' +
      '• Use multiple checkpoints for production sites (avoid false positives) ' +
      '• Set realistic responseTimeThreshold (not too sensitive) ' +
      '• Monitor SSL expiration 30+ days in advance ' +
      '• Use internal testLocation for private/VPN applications ' +
      '• Test multi-step transactions for critical user flows ' +
      '• Set failedCount >=2 to reduce false alarms ' +
      '\n\n**After creation:** Use "generate_website_link" to get direct URL to view monitor results. ' +
      '\n\n**Related tools:** "list_website_checkpoints" (find locations), "generate_website_link" (get URL), "update_website" (modify), "list_websites" (browse existing).',
    annotations: {
      title: 'Create website monitor',
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
    description: 'Update an existing website monitor in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify website monitor settings including URL, checkpoints, thresholds, SSL settings, or multi-step transaction flows. ' +
      '\n\n**When to use:** (1) Change monitored URL, (2) Add/remove checkpoint locations, (3) Update response time thresholds, (4) Modify SSL expiration alerts, (5) Update multi-step transaction steps, (6) Enable/disable monitoring. ' +
      '\n\n**Required parameters:** ' +
      '• websiteId: Website monitor ID (from "list_websites") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New monitor name ' +
      '• domain: New URL/hostname ' +
      '• description: Updated description ' +
      '• groupId: Move to different folder ' +
      '• checkpoints: Update checkpoint locations ' +
      '• responseTimeThreshold: New response time alert threshold ' +
      '• sslCertExpirationDays: Update SSL warning days ' +
      '• failedCount: Change consecutive failure threshold ' +
      '• steps: Update multi-step transaction flow ' +
      '• stopMonitoring: true (pause) or false (resume monitoring) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update URL after migration:** ' +
      '{websiteId: 123, domain: "https://new-domain.com"} ' +
      '\n\n**Add more checkpoint locations:** ' +
      '{websiteId: 123, checkpoints: [1,2,3,4,5,6]} // Add Asia-Pacific checkpoints ' +
      '\n\n**Adjust response time threshold:** ' +
      '{websiteId: 123, responseTimeThreshold: 5000} // Increase to 5 seconds ' +
      '\n\n**Update SSL certificate warning:** ' +
      '{websiteId: 123, sslCertExpirationDays: 60} // Alert 60 days before expiry ' +
      '\n\n**Temporarily pause monitoring:** ' +
      '{websiteId: 123, stopMonitoring: true} // During maintenance ' +
      '\n\n**Update multi-step transaction:** ' +
      '{websiteId: 123, steps: [{url: "/api/v2/health"}, {url: "/api/v2/status"}]} // New API version ' +
      '\n\n**Best practice:** Use "get_website" first to review current configuration, then update specific fields. ' +
      '\n\n**After update:** Monitor may take 1-2 minutes to reflect changes in next check cycle. ' +
      '\n\n**Related tools:** "get_website" (review before update), "list_websites" (find website), "generate_website_link" (get updated URL).',
    annotations: {
      title: 'Update website monitor',
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
    description: 'Delete a website monitor from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION** ' +
      '• Website monitor and all historical data permanently removed ' +
      '• Response time history lost (cannot be recovered) ' +
      '• Active alerts for this monitor cleared ' +
      '• Cannot be undone ' +
      '\n\n**What this does:** Permanently removes website/synthetic monitor from LogicMonitor. All monitoring stops immediately and historical performance data is deleted. ' +
      '\n\n**When to use:** (1) Service/website decommissioned, (2) URL permanently moved to different monitor, (3) Duplicate monitors cleanup, (4) Replacing with different monitoring approach. ' +
      '\n\n**Required parameters:** ' +
      '• websiteId: Website monitor ID to delete (from "list_websites") ' +
      '\n\n**Before deleting - check:** ' +
      '1. Use "get_website" to verify correct monitor ' +
      '2. Check if others depend on this monitor (dashboards, reports) ' +
      '3. Consider exporting historical data if needed ' +
      '4. Verify no active incidents related to this monitor ' +
      '\n\n**Impact of deletion:** ' +
      '• Monitoring stops immediately (no more checks) ' +
      '• Historical response time data deleted ' +
      '• Dashboards showing this website will display "no data" ' +
      '• Reports including this monitor need updating ' +
      '• Alert rules filtering on this monitor may break ' +
      '\n\n**Alternatives to deletion:** ' +
      '• **Pause instead:** Use "update_website" with stopMonitoring:true (preserves history) ' +
      '• **Rename:** Mark as "DISABLED - [name]" instead of deleting ' +
      '• **Move to archive folder:** Keep monitor but organize differently ' +
      '• **Reduce check frequency:** Update to check less often instead of deleting ' +
      '\n\n**Best practice:** Use "update_website" to pause monitoring (stopMonitoring:true) instead of deleting if you might need to resume monitoring later. ' +
      '\n\n**Workflow:** Use "get_website" to verify, export historical data if needed, then delete. ' +
      '\n\n**Related tools:** "get_website" (verify before delete), "list_websites" (find website), "update_website" (pause instead of delete).',
    annotations: {
      title: 'Delete website monitor',
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
    description: 'List all website groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of website groups with: id, name, parentId, full path, description, number of websites, number of subgroups. ' +
      '\n\n**What are website groups:** Organizational folders for website monitors (synthetic checks), similar to resource/device groups. Used to categorize monitored URLs/services by application, environment, or customer. ' +
      '\n\n**When to use:** (1) Browse website organization before creating monitors, (2) Find group IDs for website operations, (3) Understand monitoring hierarchy, (4) Navigate to specific website folders. ' +
      '\n\n**Common organization patterns:** ' +
      '• By application: "E-Commerce Site", "API Endpoints", "Marketing Pages" ' +
      '• By environment: "Production URLs", "Staging URLs", "DR Sites" ' +
      '• By location: "US Sites", "EU Sites", "APAC Sites" ' +
      '• By customer: "Customer A Sites", "Customer B Sites" (MSP) ' +
      '• By type: "Public Websites", "Internal Apps", "Third-Party APIs" ' +
      '\n\n**Use cases:** ' +
      '• Organize monitors by application or service ' +
      '• Group customer-facing vs internal endpoints ' +
      '• Separate production vs non-production monitoring ' +
      '• Structure multi-region website monitoring ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_websites" filtered by groupId to see monitors in specific folder. ' +
      '\n\n**Related tools:** "get_website_group" (details), "list_websites" (websites in group), "create_website_group" (create folder).',
    annotations: {
      title: 'List website groups',
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
    description: 'Get detailed information about a specific website group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete website group details: name, full path, parentId, description, number of websites (direct and total), number of subgroups, alert status. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Check website membership counts, (3) Verify group hierarchy, (4) Review group structure before creating monitors. ' +
      '\n\n**Workflow:** Use "list_website_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_website_groups" (find groups), "list_websites" (websites in group), "create_website_group" (create new).',
    annotations: {
      title: 'Get website group details',
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
    description: 'List all users in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of users with: id, username, email, roles, status (active/suspended), last login time, created date, API token count. ' +
      '\n\n**When to use:** (1) Audit user access, (2) Find user IDs for API token management, (3) Check who has admin access, (4) Identify inactive users, (5) Compliance reporting. ' +
      '\n\n**Common filter patterns:** ' +
      '• Active users: filter:"status:active" ' +
      '• By email: filter:"email~*@company.com" ' +
      '• By role: filter:"roles:*administrator*" ' +
      '• Recent logins: filter:"lastLoginOn>{epoch}" ' +
      '• Never logged in: filter:"lastLoginOn:0" ' +
      '\n\n**Related tools:** "get_user" (details), "list_roles" (available roles), "list_api_tokens" (user\'s API tokens).',
    annotations: {
      title: 'List users',
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
    description: 'Get detailed information about a specific user by their ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete user details: username, email, firstName, lastName, roles (permissions), status (active/suspended), last login time, created date, phone, timezone, API token count, two-factor auth status. ' +
      '\n\n**When to use:** (1) Review user permissions and roles, (2) Check last login time (identify inactive users), (3) Verify contact information, (4) Audit user access before modification, (5) Get user details for API token management. ' +
      '\n\n**Key information:** ' +
      '• roles: Array of role names (defines permissions) ' +
      '• status: "active" (can login) vs "suspended" (access revoked) ' +
      '• lastLoginOn: Epoch timestamp (identify inactive accounts) ' +
      '• apiTokens: Number of active API tokens ' +
      '• twoFAEnabled: Whether 2FA is configured ' +
      '\n\n**Security audit use cases:** ' +
      '• Find users who haven\'t logged in for 90+ days ' +
      '• Review which users have admin roles ' +
      '• Check if former employees still have access ' +
      '• Verify API token usage per user ' +
      '\n\n**Workflow:** Use "list_users" to find userId, then use this tool for complete user profile. ' +
      '\n\n**Related tools:** "list_users" (find user), "list_roles" (see available roles), "list_api_tokens" (view user\'s tokens), "update_user" (modify).',
    annotations: {
      title: 'Get user details',
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
    description: 'List all roles (permission sets) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of roles with: id, name, description, custom flag, associated users count, permissions (view/manage/delete for resources/alerts/reports/settings). ' +
      '\n\n**What are roles:** Permission templates assigned to users. Control who can view/modify/delete resources, alerts, dashboards, settings. Essential for RBAC (role-based access control). ' +
      '\n\n**When to use:** (1) Discover available roles before creating users, (2) Audit permission structure, (3) Find role IDs for user assignment, (4) Compare custom vs built-in roles, (5) Compliance documentation. ' +
      '\n\n**Built-in roles (examples):** ' +
      '• administrator: Full access to everything ' +
      '• readonly: View-only access to monitoring data ' +
      '• manager: Manage resources/devices/alerts but not settings ' +
      '\n\n**Custom roles:** Organizations create custom roles for specific needs (e.g., "database-team-role", "view-prod-only"). ' +
      '\n\n**Common use cases:** ' +
      '• "What roles exist?" → List all to see options ' +
      '• "Who can delete resources/devices?" → Check which roles have delete permissions ' +
      '• "Create read-only user" → Find "readonly" role ID for user creation ' +
      '\n\n**Workflow:** Use this tool to discover roles, then "get_role" for detailed permissions, then use in "create_user" or "update_user". ' +
      '\n\n**Related tools:** "get_role" (detailed permissions), "list_users" (see user assignments), "create_user" (assign roles to new users).',
    annotations: {
      title: 'List roles',
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
    description: 'Get detailed information about a specific role by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete role details: name, description, custom flag, detailed permission matrix (view/manage/delete/acknowledge for each area: resources/devices, alerts, dashboards, reports, settings, users). ' +
      '\n\n**When to use:** (1) Review exact permissions before assigning role, (2) Compare roles to choose correct one, (3) Document security policies, (4) Audit what a role can/cannot do, (5) Before creating custom role (use as template). ' +
      '\n\n**Permission granularity returned:** ' +
      '• Resources: Can view/add/modify/delete resource/device ' +
      '• Alerts: Can view/acknowledge/manage alert rules ' +
      '• Dashboards: Can view/create/edit/delete dashboards ' +
      '• Reports: Can view/create/schedule reports ' +
      '• Settings: Can modify datasources/collectors/integrations ' +
      '• Users: Can manage other users/roles ' +
      '\n\n**Use cases:** ' +
      '• Security audit: "Can this role delete production resources/devices?" ' +
      '• Least privilege: Choose role with minimal required permissions ' +
      '• Documentation: Export role permissions for compliance ' +
      '• Role comparison: Compare multiple roles to find right fit ' +
      '\n\n**Workflow:** Use "list_roles" to find roleId, then use this tool to review detailed permissions before assigning to users. ' +
      '\n\n**Related tools:** "list_roles" (find roles), "list_users" (see who has this role), "create_role" (create custom role).',
    annotations: {
      title: 'Get role details',
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
    description: 'List API tokens for a specific user in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of API tokens for specified user with: id, note (description), created date, last used date, status (active/inactive), access ID, roles inherited from user. ' +
      '\n\n**What are API tokens:** Authentication credentials for LogicMonitor REST API. Alternative to username/password for programmatic access. Each token inherits permissions from its user. ' +
      '\n\n**When to use:** (1) Audit API access per user, (2) Find unused/stale tokens for security cleanup, (3) Check last usage time, (4) Inventory API integrations, (5) Before creating new token (check if existing one available). ' +
      '\n\n**Security considerations:** ' +
      '• Each token has Access ID and Access Key (like username/password for API) ' +
      '• Token inherits all permissions from user (if user is admin, token has admin rights) ' +
      '• Tokens never expire automatically (must be manually revoked) ' +
      '• Last used date helps identify unused tokens that should be removed ' +
      '\n\n**Common use cases:** ' +
      '• **Security audit:** "Find all API tokens, check last usage, remove stale ones" ' +
      '• **Integration tracking:** "Which integrations are using this user\'s tokens?" ' +
      '• **Access review:** "What API access does this user have?" ' +
      '• **Token rotation:** "List all tokens before rotating credentials" ' +
      '\n\n**Best practices:** ' +
      '• Create service accounts (dedicated users) for API integrations instead of personal user tokens ' +
      '• Add descriptive notes to tokens (e.g., "Terraform automation", "Grafana integration") ' +
      '• Regularly audit and remove unused tokens (check lastUsedOn timestamp) ' +
      '• Use least-privilege: Create users with minimal required permissions, then create tokens for those users ' +
      '\n\n**Security workflow:** ' +
      '1. List all users with "list_users" ' +
      '2. For each user, use this tool to check their API tokens ' +
      '3. Review lastUsedOn - if >90 days, consider revoking ' +
      '4. Check note field to understand token purpose ' +
      '\n\n**Workflow:** Use this tool with userId from "list_users" to audit that user\'s API access. ' +
      '\n\n**Related tools:** "list_users" (find userId), "create_api_token" (generate new), "delete_api_token" (revoke access).',
    annotations: {
      title: 'Get API tokens',
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
    description: 'List all Scheduled Down Times (SDTs) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of SDTs with: id, type (DeviceSDT/DeviceGroupSDT/etc), device/group name, start/end times, duration, comment, creator, status (active/scheduled/expired). ' +
      '\n\n**What are SDTs:** Maintenance windows that suppress alerting to prevent false alarms during planned work. No alerts are generated during SDT periods. ' +
      '\n\n**When to use:** (1) View active maintenance windows, (2) Check upcoming scheduled maintenance, (3) Verify SDT was created correctly, (4) Find SDTs to extend or cancel, (5) Audit who scheduled downtime. ' +
      '\n\n**Common filter patterns:** ' +
      '• Active now: filter:"isEffective:true" ' +
      '• Future SDTs: filter:"startDateTime>{epoch}" ' +
      '• By device: filter:"deviceDisplayName~*prod-web*" ' +
      '• One-time vs recurring: filter:"type:oneTime" or filter:"type:monthly" ' +
      '• By creator: filter:"admin:john.doe" ' +
      '\n\n**SDT types explained:** ' +
      '• DeviceSDT: All monitoring on specific resource/device ' +
      '• DeviceGroupSDT: All resource/device in group ' +
      '• DeviceDataSourceSDT: Specific datasource on resource/device ' +
      '• DeviceDataSourceInstanceSDT: Specific instance only (e.g., C: drive) ' +
      '\n\n**Best practice:** Always add meaningful comment explaining maintenance reason for audit trail. ' +
      '\n\n**Related tools:** "create_device_sdt" (schedule maintenance), "delete_sdt" (cancel maintenance), "get_sdt" (details).',
    annotations: {
      title: 'Get Scheduled Down Times',
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
    description: 'Get detailed information about a specific Scheduled Down Time (SDT) by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete SDT details: type, device/group affected, start/end times, duration, comment, who created it, status (active/scheduled/expired), recurrence settings. ' +
      '\n\n**When to use:** (1) Verify SDT was created correctly, (2) Check when maintenance window ends, (3) See who scheduled downtime, (4) Get SDT details before extending/canceling, (5) Audit maintenance history. ' +
      '\n\n**Status meanings:** ' +
      '• scheduled: Future maintenance window (not started yet) ' +
      '• active: Currently in maintenance window (alerts suppressed now) ' +
      '• expired: Maintenance window completed (historical record) ' +
      '\n\n**Workflow:** Use "list_sdts" to find SDT ID, then use this tool for complete details before deciding to extend or delete. ' +
      '\n\n**Related tools:** "list_sdts" (find SDTs), "create_device_sdt" (create new), "delete_sdt" (cancel).',
    annotations: {
      title: 'Get Scheduled Down Time details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        sdtId: {
          type: 'string',
          description: 'The ID of the Scheduled Down Time (SDT) to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['sdtId'],
    },
  },
  {
    name: 'create_resource_sdt',
    description: 'Schedule Down Time (SDT) for a resource/device in LogicMonitor (LM) monitoring to suppress alerts during planned maintenance. ' +
      '\n\n**What this does:** Prevents alert notifications during specified time window. No alerts generated = no noise during planned work like patching, upgrades, reboots, migrations. ' +
      '\n\n**When to use:** (1) Before patching servers, (2) During planned maintenance windows, (3) Network changes that will cause temporary outages, (4) Application deployments, (5) Database maintenance. ' +
      '\n\n**Required parameters:** ' +
      '• deviceId: Device to schedule maintenance for (from "list_resources") ' +
      '• type: "DeviceSDT" (entire device) or "DeviceDataSourceSDT" (specific datasource) ' +
      '• startDateTime: Start time in epoch MILLISECONDS (e.g., Date.now() + 3600000 for 1 hour from now) ' +
      '• endDateTime: End time in epoch MILLISECONDS ' +
      '• comment: Reason for maintenance (REQUIRED for audit trail) ' +
      '\n\n**Time calculation examples:** ' +
      '• 1 hour from now: startDateTime: Date.now() + 3600000 ' +
      '• 4 hours maintenance: endDateTime: startDateTime + (4 * 3600000) ' +
      '\n\n**SDT types:** ' +
      '• "DeviceSDT" - Suppresses ALL alerts on resource/device (most common) ' +
      '• "DeviceDataSourceSDT" - Suppresses alerts from specific datasource only ' +
      '\n\n**Best practices:** ' +
      '• Add detailed comment (e.g., "Patching Windows updates - Change ticket CHG12345") ' +
      '• Use appropriate time buffer (start 15 min early, end 15 min late) ' +
      '• Verify SDT with "list_sdts" after creation ' +
      '\n\n**Related tools:** "list_sdts" (verify created), "delete_sdt" (cancel if needed).',
    annotations: {
      title: 'Schedule maintenance window',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The resource/device ID',
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
          description: 'Comment explaining the Scheduled Down Time (SDT)',
        },
      },
      additionalProperties: false,
      required: ['deviceId', 'type', 'startDateTime', 'endDateTime'],
    },
  },
  {
    name: 'delete_sdt',
    description: 'Delete (cancel) a Scheduled Down Time (SDT) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** ' +
      '• Cancels active or scheduled maintenance window ' +
      '• Alerting resumes immediately if SDT was active ' +
      '• Removes SDT from schedule if it was future/scheduled ' +
      '• Cannot undo - creates audit log entry ' +
      '\n\n**When to use:** (1) Maintenance completed early, (2) Maintenance canceled/postponed, (3) SDT created by mistake, (4) Need to restore alerting immediately. ' +
      '\n\n**Common scenarios:** ' +
      '• "Patching completed faster than expected - restore alerting" ' +
      '• "Maintenance postponed to next week - cancel this SDT and create new one" ' +
      '• "Wrong resource/device - need to delete and recreate for correct device" ' +
      '• "Emergency issue needs alerting - cancel maintenance window" ' +
      '\n\n**Important:** ' +
      '• If SDT is active, alerts resume IMMEDIATELY after deletion ' +
      '• Check resource/device status before deleting active SDT to avoid alert flood ' +
      '• Cannot delete only to extend - must delete and create new with longer duration ' +
      '\n\n**Workflow:** ' +
      '1. Use "list_sdts" to find SDT ID (check status: active/scheduled) ' +
      '2. Use "get_sdt" to verify correct SDT before deleting ' +
      '3. Delete SDT ' +
      '4. If resource/device still has issues, expect alerts immediately ' +
      '\n\n**Best practice:** Add comment in related ticket/documentation explaining why SDT was canceled. ' +
      '\n\n**Related tools:** "list_sdts" (find SDT), "get_sdt" (verify before delete), "create_device_sdt" (create replacement if needed).',
    annotations: {
      title: 'Deleyte Scheduled Down Time',
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
    description: 'List all ConfigSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of ConfigSources with: id, name, displayName, description, appliesTo logic, collection method. ' +
      '\n\n**What are ConfigSources:** Track configuration file changes for compliance and change management. Similar to datasources, but for configs instead of metrics. Alert when configs change unexpectedly. ' +
      '\n\n**When to use:** (1) Find ConfigSource for specific resource/device type (e.g., Cisco_IOS_Config), (2) Discover what configs are being tracked, (3) Get ConfigSource IDs for API operations, (4) Audit configuration monitoring coverage. ' +
      '\n\n**What configs can be tracked:** ' +
      '• Network resources/devices: Router configs, switch configs, firewall rules ' +
      '• Linux: /etc files, app configs, SSH authorized_keys ' +
      '• Windows: Registry keys, security policies ' +
      '• Cloud: Security groups, IAM policies ' +
      '\n\n**Use cases:** ' +
      '• Compliance: "Alert when firewall rules change" ' +
      '• Change management: "Who modified this router config?" ' +
      '• Rollback: Compare current config to previous version ' +
      '• Audit: "Show all config changes in last 30 days" ' +
      '\n\n**Common ConfigSources:** ' +
      '• Cisco_IOS_Config: Cisco router/switch configs ' +
      '• F5_LTM_Config: F5 load balancer configs ' +
      '• Palo_Alto_Config: Palo Alto firewall rules ' +
      '• Linux_Config_Files: Monitor /etc files ' +
      '\n\n**Related tools:** "get_configsource" (details), "list_device_configs" (see configs for device).',
    annotations: {
      title: 'List ConfigSources',
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
    description: 'Get detailed information about a specific ConfigSource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete ConfigSource details: name, displayName, description, appliesTo logic (which resources/devices), collection method (CLI/SNMP/API), collection script, alert settings. ' +
      '\n\n**When to use:** (1) Understand what config is being collected, (2) Review appliesTo logic (why it does/doesn\'t apply to device), (3) Check collection method, (4) Troubleshoot config collection issues. ' +
      '\n\n**Key information:** ' +
      '• appliesTo: Logic determining which resource/device get config tracking ' +
      '• collectMethod: How config is retrieved (CLI commands, SNMP, API) ' +
      '• configAlerts: Settings for when to alert on changes ' +
      '• lineageId: Built-in (LogicMonitor) vs custom ConfigSource ' +
      '\n\n**Workflow:** Use "list_configsources" to find configSourceId, then use this tool to understand how it works. ' +
      '\n\n**Related tools:** "list_configsources" (find ConfigSource), "list_device_configs" (see configs for device).',
    annotations: {
      title: 'Get ConfigSource details',
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
    name: 'list_resource_properties',
    description: 'List all custom properties (system and user-defined) for a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of properties with: name, value, source (device-level vs inherited from group), type (system vs custom). ' +
      '\n\n**When to use:** (1) Review resource/device configuration, (2) Check credentials/authentication settings, (3) See inherited vs device-specific properties, (4) Troubleshoot datasource applies logic, (5) Audit resource/device metadata. ' +
      '\n\n**Property types:** ' +
      '\n\n**System properties (auto-populated by LogicMonitor):** ' +
      '• system.hostname: Device hostname ' +
      '• system.devicetype: Device category (server, network, cloud) ' +
      '• system.ips: IP addresses ' +
      '• system.categories: Auto-detected technologies (e.g., "AWS/EC2") ' +
      '\n\n**Custom properties (user-defined):** ' +
      '• Credentials: ssh.user, snmp.community, wmi.user ' +
      '• Tags: env (prod/staging), owner (team name), location ' +
      '• Integration IDs: servicenow.ci_id, jira.project ' +
      '• Business metadata: cost.center, sla.tier, backup.policy ' +
      '\n\n**Property inheritance:** ' +
      'Properties can be set at: Device level (highest priority) → Group level → Parent group (inherited). ' +
      '\n\n**Datasource appliesTo logic uses properties:** ' +
      'Many datasources check properties to decide if they should monitor device. Example: AWS_EC2 datasource checks if resource/device has "aws.resourcetype=ec2" property. ' +
      '\n\n**Workflow:** Use "list_resources" to find deviceId, then use this tool to see all properties including inherited ones. ' +
      '\n\n**Related tools:** "update_device_property" (modify), "get_resource" (see summary), "list_datasources" (see how properties affect monitoring).',
    annotations: {
      title: 'List resource/device properties',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
    name: 'update_resource_property',
    description: 'Update or create a custom property for a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Set/update a single resource/device-level custom property. Simpler alternative to "update_resource" when only changing one property. ' +
      '\n\n**When to use:** (1) Update single property value, (2) Add new property to device, (3) Override inherited property value, (4) Update credentials for one resource/device, (5) Change resource/device tags/metadata. ' +
      '\n\n**Required parameters:** ' +
      '• deviceId: Device ID (from "list_resources") ' +
      '• name: Property name (e.g., "ssh.user", "env", "owner") ' +
      '• value: Property value ' +
      '\n\n**Property types and examples:** ' +
      '\n\n**Credentials (override group defaults):** ' +
      '• SSH: name="ssh.user", value="admin" ' +
      '• SNMP: name="snmp.community", value="public" ' +
      '• WMI: name="wmi.user", value="DOMAIN\\\\monitoring" ' +
      '• Database: name="jdbc.user", value="dbmonitor" ' +
      '\n\n**Tags and metadata:** ' +
      '• Environment: name="env", value="production" ' +
      '• Owner: name="owner", value="platform-team" ' +
      '• Cost center: name="cost.center", value="engineering" ' +
      '• Application: name="app", value="web-frontend" ' +
      '\n\n**Integration IDs:** ' +
      '• ServiceNow: name="servicenow.ci_id", value="ci12345" ' +
      '• JIRA: name="jira.project", value="INFRA" ' +
      '• CMDB: name="cmdb.id", value="server-001" ' +
      '\n\n**Datasource-specific settings:** ' +
      '• Custom threshold: name="threshold.cpu", value="90" ' +
      '• Collection interval: name="poll.interval", value="5" ' +
      '• Monitoring scope: name="monitor.ports", value="80,443" ' +
      '\n\n**Device-level vs Group-level:** ' +
      '• **Device property** (this tool): Applies only to this resource/device, overrides group property ' +
      '• **Group property** (update_resource_group): Inherited by all resource/device in group ' +
      '• Device properties take precedence over group properties ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**Override SSH credentials for one resource/device:** ' +
      '{deviceId: 123, name: "ssh.user", value: "specialadmin"} ' +
      '\n\n**Tag resource/device as production:** ' +
      '{deviceId: 123, name: "env", value: "production"} ' +
      '\n\n**Link to ServiceNow CI:** ' +
      '{deviceId: 123, name: "servicenow.ci_id", value: "ci-web-01"} ' +
      '\n\n**Set custom alert threshold:** ' +
      '{deviceId: 123, name: "cpu.threshold", value: "85"} ' +
      '\n\n**Workflow:** Use "list_device_properties" to see current properties, then update or add new ones. ' +
      '\n\n**Related tools:** "list_device_properties" (view all properties), "update_resource" (update multiple properties), "update_resource_group" (set group-level properties).',
    annotations: {
      title: 'Update resource/device properties',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The resource/device ID',
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
    name: 'search_resources',
    description: 'Search for resources/devices in LogicMonitor (LM) monitoring with simplified search syntax. ' +
      '\n\n**Returns:** Array of matching resource/device with id, displayName, name (IP), hostStatus, deviceType. ' +
      '\n\n**When to use:** (1) Find resource/device by partial name (don\'t know exact name), (2) Quick resource/device lookup without complex filter syntax, (3) Search by IP address pattern, (4) Find resource/device when you know name but not filter syntax, (5) Discover resource/device matching keywords. ' +
      '\n\n**Two search modes:** ' +
      '1. **Free-text search:** Simple queries (e.g., "production", "web-server", "192.168.1.100") automatically search across displayName, description, and name fields ' +
      '2. **Filter syntax:** Precise queries (e.g., "hostStatus:alive") for exact field matching ' +
      '\n\n**Choose the right tool:** ' +
      '• Use "search_resources" for quick name-based searches (simplest) ' +
      '• Use "list_resources" with filter parameter for complex multi-field filtering (most powerful) ' +
      '• Use this tool when you know resource/device name but not exact filter syntax ' +
      '\n\n**Free-text examples:** ' +
      '• query:"production" → finds all resource/device with "production" in name or description ' +
      '• query:"web" → finds web-01, web-server, webhost, etc. ' +
      '• query:"192.168.1" → finds resource/device with this IP pattern ' +
      '• query:"k8s" → finds Kubernetes-related resource/device ' +
      '\n\n**Filter syntax examples:** ' +
      '• query:"hostStatus:alive" → only alive/online resource/device ' +
      '• query:"displayName~*prod*" → wildcard matching ' +
      '• query:"displayName~*web*,hostStatus:alive" → combine filters (AND) ' +
      '\n\n**Common use cases:** ' +
      '• "Find all production web servers" → query:"production web" or query:"displayName~*prod-web*" ' +
      '• "Find resource/device by IP" → query:"192.168.1.100" ' +
      '• "Find all database servers" → query:"database" or query:"db" ' +
      '• "Find alive resource/device in subnet" → query:"192.168.1,hostStatus:alive" ' +
      '\n\n**Related tools:** "list_resources" (complex filtering), "get_resource" (get details), "generate_resource_link" (get URL).',
    annotations: {
      title: 'Search resources/resources/devices',
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
    description: 'Search for alerts in LogicMonitor (LM) monitoring with simplified search syntax. ' +
      '\n\n**Returns:** Array of matching alerts with alertId, severity, resource name, datasource, datapoint, alert message. ' +
      '\n\n**When to use:** (1) Find alerts on specific resource/device/cluster by name, (2) Quick alert lookup without complex filter syntax, (3) Search alerts when you know resource/device name but not exact filter, (4) Discover alerts matching keywords, (5) Find alerts for partially-known resource/device names. ' +
      '\n\n**Two search modes:** ' +
      '1. **Free-text search:** Simple device/resource name queries (e.g., "prod-web-01", "k8s-cluster") ' +
      '2. **Filter syntax:** Precise alert filtering (e.g., "severity:critical", "acked:false") ' +
      '\n\n**Choose the right tool:** ' +
      '• Use "search_alerts" for quick resource/device name searches ' +
      '• Use "list_alerts" with filter parameter for complex multi-field filtering (recommended for most cases) ' +
      '\n\n**Free-text examples:** ' +
      '• query:"production" → finds alerts on resource/device with "production" in name ' +
      '• query:"k8s-prod-cluster" → finds all alerts for this cluster ' +
      '• query:"web-server" → finds alerts on web servers ' +
      '• query:"database" → finds alerts on database hosts ' +
      '\n\n**Filter syntax examples:** ' +
      '• query:"severity:critical" → only critical alerts ' +
      '• query:"resourceTemplateName~*CPU*" → CPU-related alerts ' +
      '• query:"acked:false" → unacknowledged alerts needing attention ' +
      '• query:"severity:critical,acked:false" → critical unacked alerts (AND logic) ' +
      '\n\n**Common use cases:** ' +
      '• "Find all alerts for production cluster" → query:"prod-cluster" ' +
      '• "Find critical unacked alerts" → query:"severity:critical,acked:false" ' +
      '• "Find CPU alerts" → query:"resourceTemplateName~*CPU*" ' +
      '• "Find alerts on web servers" → query:"web-server" ' +
      '\n\n**Important limitation:** Alert API does NOT support OR operator (||). Use comma for AND only. For OR logic, make multiple separate calls. ' +
      '\n\n**Related tools:** "list_alerts" (structured filtering), "get_alert" (details), "generate_alert_link" (get URL), "acknowledge_alert" (ack alerts).',
    annotations: {
      title: 'Search alerts',
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
    description: 'List audit logs in LogicMonitor (LM) monitoring for compliance and security auditing. ' +
      '\n\n**Returns:** Array of audit log entries with: id, username, IP address, timestamp (happenedOn in epoch SECONDS), description of action performed, sessionId. ' +
      '\n\n**When to use:** ' +
      '(1) Investigate changes: "Who deleted this resource/device?" → filter:"description~*Delete*,description~*device*" ' +
      '(2) Track user activity: "What did john.doe do today?" → filter:"username:john.doe,happenedOn>1730851200" ' +
      '(3) Monitor API usage: Find actions performed via API tokens ' +
      '(4) Compliance audits: Export log history for specific time periods ' +
      '(5) Security investigation: Track login attempts, IP addresses, suspicious activities ' +
      '(6) Troubleshooting: "Who changed this alert rule?" → filter:"description~*AlertRule*" ' +
      '\n\n**Common filter patterns:** ' +
      '• By user: filter:"username:john.doe" ' +
      '• By time: filter:"happenedOn>1640995200" (IMPORTANT: epoch SECONDS, not milliseconds!) ' +
      '• By action type: filter:"description~*Create*" or filter:"description~*Delete*" or filter:"description~*Update*" ' +
      '• By resource: filter:"description~*device*" or filter:"description~*dashboard*" ' +
      '• By IP: filter:"ip:192.168.1.100" ' +
      '• Combined (AND): filter:"username:admin,happenedOn>1640995200,description~*device*" ' +
      '\n\n**Critical notes:** ' +
      '• Time uses epoch SECONDS (not milliseconds like other LM APIs) ' +
      '• Cannot use OR operator (||) in audit logs, only AND (comma) ' +
      '• Use autoPaginate:true for complete history (may take time for large datasets) ' +
      '\n\n**Web UI access:** https://{company}.logicmonitor.com/santaba/uiv4/settings/access-logs (Settings → Users & Roles → Audit Logs) ' +
      '\n\n**Related tools:** "get_audit_log" (details of specific entry), "search_audit_logs" (free-text search).',
    annotations: {
      title: 'List audit logs',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      logicmonitorUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/settings/access-logs`,
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
    description: 'Get detailed information about a specific audit log entry in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete audit log details: username, IP address, exact timestamp, full description of action, session ID, affected resources, before/after values (for updates). ' +
      '\n\n**When to use:** (1) Get complete details after finding log ID via "list_audit_logs", (2) Review exact changes made (old vs new values), (3) Investigate specific incident with full context. ' +
      '\n\n**Workflow:** First use "list_audit_logs" with filters to find relevant entries, then use this tool with the log ID for complete details. ' +
      '\n\n**Related tools:** "list_audit_logs" (search logs), "search_audit_logs" (text search).',
    annotations: {
      title: 'Get audit details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      logicmonitorUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/settings/access-logs`,
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
    description: 'Search audit logs in LogicMonitor (LM) monitoring with free-text or advanced filter syntax. ' +
      '\n\n**Two search modes:** ' +
      '1. **Free-text search:** Simple queries (e.g., "production", "device", "john") automatically search across username, description, and IP fields ' +
      '2. **Filter syntax:** Precise queries (e.g., "username:john.doe", "happenedOn>1640995200") for exact field matching ' +
      '\n\n**When to use:** ' +
      '• Use free-text when you know general terms but not exact field names ' +
      '• Use filter syntax when you need precise filtering by specific fields ' +
      '• Use "list_audit_logs" when you need complex AND/OR logic across multiple fields ' +
      '\n\n**Free-text examples:** ' +
      '• query:"device" → finds all logs mentioning "device" in any field ' +
      '• query:"192.168.1.100" → finds logs from this IP or mentioning this IP ' +
      '• query:"john" → finds logs by user john or mentioning john in description ' +
      '\n\n**Filter syntax examples:** ' +
      '• query:"username:john.doe" → exact username match ' +
      '• query:"happenedOn>1640995200" → logs after this time (epoch SECONDS) ' +
      '• query:"description~*device*" → description contains "device" ' +
      '• query:"ip:192.168.1.*" → IP address wildcard match ' +
      '• query:"username:admin,happenedOn>1640995200" → combine with comma (AND) ' +
      '\n\n**Related tools:** "list_audit_logs" (structured filtering), "get_audit_log" (get details).',
    annotations: {
      title: 'Search audit logs',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
      logicmonitorUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/settings/access-logs`,
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
    description: 'List all access groups in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of access groups with: id, name, description, tenant ID, number of associated resources, number of users. ' +
      '\n\n**What are access groups:** Permission boundaries that control WHICH resources users can see and manage. Used in multi-tenant environments to isolate customer data, or to segment access by team/department. Users assigned to access group can only see resources in that group. ' +
      '\n\n**When to use:** (1) Manage multi-tenant environments (MSPs), (2) Segment monitoring by department/team, (3) Control resource visibility, (4) Audit access control configuration, (5) Find access group IDs for user assignment. ' +
      '\n\n**Access groups vs Roles (important distinction):** ' +
      '• **Access Groups:** Control WHAT resources you can see (visibility, data isolation) ' +
      '• **Roles:** Control WHAT actions you can perform (view/edit/delete permissions) ' +
      '• Users need BOTH: Role (what they can do) + Access Group (what they can see) ' +
      '\n\n**Common use cases:** ' +
      '\n\n**MSP / Multi-tenant:** ' +
      '• Access Group "Customer A" - User sees only Customer A resource/device ' +
      '• Access Group "Customer B" - User sees only Customer B resource/device ' +
      '• Prevents customers from seeing each other\'s data ' +
      '\n\n**Departmental isolation:** ' +
      '• Access Group "Network Team" - See only network resource/device ' +
      '• Access Group "Server Team" - See only servers ' +
      '• Access Group "Database Team" - See only database servers ' +
      '\n\n**Environment separation:** ' +
      '• Access Group "Production" - Only prod resource/device ' +
      '• Access Group "Dev/Test" - Only non-prod resource/device ' +
      '• Junior staff limited to dev/test access group ' +
      '\n\n**Workflow:** Use this tool to find access groups, then assign users to groups via "update_user" to control resource visibility. ' +
      '\n\n**Related tools:** "get_access_group" (details), "create_access_group" (create new), "list_users" (see user assignments), "list_resources" (associate resource/device with groups).',
    annotations: {
      title: 'List access groups',
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
    description: 'Get detailed information about a specific access group in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete access group details: name, description, tenant ID, list of associated resources (which resources/devices/groups are in this access group), list of users assigned to this access group. ' +
      '\n\n**When to use:** (1) Review which resources are in this access group, (2) Check which users have access to this group, (3) Audit access control before modifications, (4) Verify tenant isolation configuration. ' +
      '\n\n**Key information returned:** ' +
      '• **Resources:** Which resource/device groups and resources users in this access group can see ' +
      '• **Users:** Which users are assigned to this access group ' +
      '• **Tenant ID:** Multi-tenant identifier (MSP environments) ' +
      '\n\n**Impact analysis:** ' +
      'Before modifying access group: ' +
      '• Removing resource: Users lose visibility to those resource/device ' +
      '• Removing user: User loses visibility to all resources in group ' +
      '• Deleting group: All users lose their access scope ' +
      '\n\n**Workflow:** Use "list_access_groups" to find accessGroupId, then use this tool to review complete configuration before modifications. ' +
      '\n\n**Related tools:** "list_access_groups" (find groups), "update_access_group" (modify), "list_users" (see user access).',
    annotations: {
      title: 'Get access group details',
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
    description: 'Create a new access group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates permission boundary controlling which resources/resources/devices users can see and manage. Essential for multi-tenant environments (MSPs) or departmental isolation. ' +
      '\n\n**When to use:** (1) Set up multi-tenant monitoring (MSP with multiple customers), (2) Segment access by department/team, (3) Create read-only views for specific resource/device groups, (4) Isolate production from dev/test access, (5) Control customer/client data visibility. ' +
      '\n\n**Required parameters:** ' +
      '• name: Access group name (e.g., "Customer A", "Network Team", "Production Access") ' +
      '• description: Purpose/scope (e.g., "Access to Customer A resource/device only") ' +
      '\n\n**Optional parameters:** ' +
      '• tenantId: Multi-tenant identifier (for MSP environments) ' +
      '• resourceGroups: Array of resource/device group IDs users can access ' +
      '• websites: Array of website monitor IDs ' +
      '• dashboards: Array of dashboard IDs ' +
      '\n\n**Access Groups = Data Isolation:** ' +
      'Users assigned to access group can ONLY see resources in that group. Perfect for: ' +
      '• MSPs managing multiple customers ' +
      '• Enterprises with separate business units ' +
      '• Teams managing different environments (prod/staging/dev) ' +
      '• Contractors needing limited access ' +
      '\n\n**Multi-tenant setup (MSP example):** ' +
      '\n\n**Customer A Access:** ' +
      '{name: "Customer A", description: "Customer A resource/device and dashboards", resourceGroups: [10,11,12]} ' +
      '// Users see only Customer A resource/device ' +
      '\n\n**Customer B Access:** ' +
      '{name: "Customer B", description: "Customer B resource/device and dashboards", resourceGroups: [20,21,22]} ' +
      '// Users see only Customer B resource/device ' +
      '\n\n**Internal Team (all access):** ' +
      '{name: "MSP Admin Team", description: "Full access to all customers", resourceGroups: []} ' +
      '// Empty resourceGroups = access to everything ' +
      '\n\n**Department isolation example:** ' +
      '\n\n**Network Team:** ' +
      '{name: "Network Team", description: "Access to network resource/device only", resourceGroups: [100]} ' +
      '// Group 100 = "Network resources/Devices" folder ' +
      '\n\n**Server Team:** ' +
      '{name: "Server Team", description: "Access to servers only", resourceGroups: [200]} ' +
      '// Group 200 = "Servers" folder ' +
      '\n\n**Database Team:** ' +
      '{name: "Database Team", description: "Access to database servers", resourceGroups: [300]} ' +
      '// Group 300 = "Database Servers" folder ' +
      '\n\n**Environment isolation example:** ' +
      '\n\n**Production Access:** ' +
      '{name: "Production Team", description: "Production environment only", resourceGroups: [1]} ' +
      '\n\n**Dev/Test Access:** ' +
      '{name: "Developers", description: "Development and test environments", resourceGroups: [2,3]} ' +
      '\n\n**Access Group + Role (both needed):** ' +
      '• **Access Group:** Controls WHAT resources user sees (visibility) ' +
      '• **Role:** Controls WHAT actions user can perform (permissions) ' +
      '• Users need BOTH assigned to have any access ' +
      '\n\n**After creation workflow:** ' +
      '1. Create access group with resource scope ' +
      '2. Create users and assign them to this access group ' +
      '3. Assign appropriate role to users (view/manage/admin) ' +
      '4. Users now see only resources in their access group ' +
      '\n\n**Best practices:** ' +
      '• One access group per customer (MSP) ' +
      '• One access group per team (department isolation) ' +
      '• Empty resourceGroups = full access (admin groups) ' +
      '• Descriptive names: "Customer Name - Environment" ' +
      '\n\n**Related tools:** "update_access_group" (add/remove resources), "list_access_groups" (view all), "create_user" (assign users to group), "list_resource_groups" (find group IDs).',
    annotations: {
      title: 'Create access group',
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
    description: 'Update an existing access group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify access group properties, add/remove resources, or change tenant assignment. Affects all users assigned to this group immediately. ' +
      '\n\n**When to use:** (1) Add/remove resource/device groups from access scope, (2) Rename access group, (3) Update description, (4) Add new resources after customer growth, (5) Remove decommissioned resources. ' +
      '\n\n**Required parameters:** ' +
      '• accessGroupId: Access group ID (from "list_access_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New access group name ' +
      '• description: Updated description ' +
      '• resourceGroups: New array of resource/device group IDs (replaces existing) ' +
      '• websites: Update website monitor access ' +
      '• dashboards: Update dashboard access ' +
      '• tenantId: Change tenant assignment ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add more resource/device groups to access:** ' +
      '{accessGroupId: 123, resourceGroups: [10,11,12,13,14]} // Added groups 13,14 ' +
      '\n\n**Remove access to resource/device group:** ' +
      '{accessGroupId: 123, resourceGroups: [10,11]} // Removed group 12 (decomm resources/devices) ' +
      '\n\n**Rename access group:** ' +
      '{accessGroupId: 123, name: "Customer A - Updated Name"} ' +
      '\n\n**Grant full access (admin group):** ' +
      '{accessGroupId: 123, resourceGroups: []} // Empty = see everything ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '• Updating resourceGroups affects ALL users in this access group immediately ' +
      '• Removing resource/device group: Users instantly lose access to those resource/device ' +
      '• Adding resource/device group: Users instantly gain access to new resource/device ' +
      '• Users currently viewing removed resources will see "no access" errors ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_access_group" to see current configuration ' +
      '2. Use "list_users" to see which users affected by change ' +
      '3. Update access group with new resource scope ' +
      '4. Notify users of access changes ' +
      '\n\n**Example: Customer adds new infrastructure:** ' +
      '1. Customer provisions new resource/device group (e.g., "Customer A - AWS") ' +
      '2. Get current access: get_access_group(accessGroupId: 123) ' +
      '   // Returns: resourceGroups: [10,11] ' +
      '3. Add new group: update_access_group(accessGroupId: 123, resourceGroups: [10,11,12]) ' +
      '4. Customer users now see new AWS resource/device ' +
      '\n\n**Related tools:** "get_access_group" (review before update), "list_access_groups" (find group), "list_users" (see affected users), "list_resource_groups" (find group IDs).',
    annotations: {
      title: 'Update access group',
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
    description: 'Delete an access group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: CRITICAL IMPACT ON USERS** ' +
      '• Users assigned to this group lose ALL access immediately ' +
      '• Users cannot login or see any resources until reassigned ' +
      '• Cannot be undone - users must be manually reassigned ' +
      '• Active user sessions may be terminated ' +
      '\n\n**What this does:** Permanently removes access group. All users assigned to this group lose their resource visibility immediately. ' +
      '\n\n**When to use:** (1) Customer/client offboarded (MSP), (2) Department dissolved/restructured, (3) Consolidating duplicate access groups, (4) Cleanup unused access groups. ' +
      '\n\n**Required parameters:** ' +
      '• accessGroupId: Access group ID to delete (from "list_access_groups") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "get_access_group" to see which resources are in scope ' +
      '2. Use "list_users" with filter to find ALL users assigned to this group ' +
      '3. Verify users have alternate access groups to move to ' +
      '4. Coordinate with users - they will lose access immediately ' +
      '\n\n**Impact of deletion:** ' +
      '• **Users:** Cannot login or see resources until reassigned to new group ' +
      '• **Active sessions:** May be terminated immediately ' +
      '• **Resources:** Not deleted, just become inaccessible to these users ' +
      '• **Dashboards:** Users lose access to dashboards shared via this group ' +
      '\n\n**Safe deletion workflow:** ' +
      '\n\n**Step 1: Identify affected users** ' +
      'list_users() // Find users with accessGroup: "Customer A" ' +
      '\n\n**Step 2: Create/identify replacement access group** ' +
      'create_access_group(name: "Customer A - New") // Or use existing group ' +
      '\n\n**Step 3: Reassign users BEFORE deleting group** ' +
      'For each user: update_user(userId: X, accessGroupId: NEW_GROUP_ID) ' +
      '\n\n**Step 4: Verify no users remain** ' +
      'get_access_group(accessGroupId: 123) // Check users list is empty ' +
      '\n\n**Step 5: Delete group** ' +
      'delete_access_group(accessGroupId: 123) ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**MSP customer offboarding:** ' +
      '1. Verify customer contract ended ' +
      '2. Export customer data for records ' +
      '3. Check no customer users remain in access group ' +
      '4. Delete access group ' +
      '5. Optionally delete customer resources ' +
      '\n\n**Department restructuring:** ' +
      '1. Create new access group for reorganized team ' +
      '2. Move all users to new group ' +
      '3. Verify old group has zero users ' +
      '4. Delete old access group ' +
      '\n\n**⚠️ NEVER delete access group with active users unless intentionally revoking their access immediately!** ' +
      '\n\n**Best practice:** Always reassign users to new access group BEFORE deleting old group to prevent access disruption. ' +
      '\n\n**Related tools:** "get_access_group" (check users), "list_users" (find affected users), "update_user" (reassign users), "create_access_group" (create replacement).',
    annotations: {
      title: 'Delete access group',
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
    name: 'list_resource_datasources',
    description: 'List datasources applied to a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of datasources actively monitoring this resource/device with: id (deviceDataSourceId), dataSourceName, dataSourceDisplayName, status, alert status, instance count, last poll time. ' +
      '\n\n**When to use:** (1) See what\'s being monitored on a resource/device, (2) Verify datasource is collecting data, (3) Get deviceDataSourceId for metric retrieval, (4) Troubleshoot missing data, (5) Check datasource health. ' +
      '\n\n**What you discover:** ' +
      '• Which datasources are active (e.g., WinCPU, WinMemory, SNMP_Network_Interfaces) ' +
      '• How many instances per datasource (e.g., 3 disks, 4 network interfaces) ' +
      '• Collection status: Collecting data vs errors ' +
      '• Alert status: Any active alerts from this datasource ' +
      '\n\n**This is step 1 for getting metrics:** ' +
      '**Complete workflow to retrieve metric data:** ' +
      '1. Use this tool → get deviceDataSourceId for datasource you want (e.g., WinCPU) ' +
      '2. Use "list_device_instances" → get instanceId for specific instance ' +
      '3. Use "get_device_instance_data" → get actual metric values ' +
      '\n\n**Troubleshooting use cases:** ' +
      '• "Why no CPU data?" → Check if WinCPU datasource is applied and collecting ' +
      '• "Find disk datasource" → Look for datasource with "disk" or "volume" in name ' +
      '• "Check datasource errors" → Review status field for error messages ' +
      '\n\n**Related tools:** "list_device_instances" (next step), "get_device_instance_data" (get metrics), "update_device_datasource" (enable/disable).',
    annotations: {
      title: 'List resource/device datasources',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
      '\n\n**When to use:** (1) Check if datasource is collecting data, (2) Review alert status for specific datasource, (3) Verify custom thresholds, (4) Get deviceDataSourceId for instance operations, (5) Troubleshoot data collection issues. ' +
      '\n\n**Key fields:** ' +
      '• instanceNumber: How many instances (e.g., 4 network interfaces) ' +
      '• status: Collection status (normal vs error) ' +
      '• alertStatus: Any active alerts from this datasource ' +
      '• stopMonitoring: Whether datasource is disabled on this resource/device ' +
      '\n\n**Workflow:** Use "list_device_datasources" to find deviceDataSourceId, then use this tool for detailed status. ' +
      '\n\n**Related tools:** "list_device_datasources" (find datasource), "list_device_instances" (get instances), "update_device_datasource" (enable/disable).',
    annotations: {
      title: 'Get resource/device datasource details',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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
      '\n\n**What this does:** Modify how a specific datasource monitors a specific resource/device. Control alerting, enable/disable monitoring, or adjust device-specific datasource settings without affecting other resources/resources/devices. ' +
      '\n\n**When to use:** (1) Disable monitoring for specific datasource on one resource/device, (2) Disable alerting during maintenance, (3) Enable previously disabled datasource, (4) Adjust polling interval for device, (5) Update device-specific thresholds. ' +
      '\n\n**Required parameters:** ' +
      '• deviceId: Device ID (from "list_resources") ' +
      '• deviceDataSourceId: Device datasource ID (from "list_device_datasources") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• disableAlerting: true (mute alerts) or false (enable alerts) ' +
      '• stopMonitoring: true (stop data collection) or false (resume monitoring) ' +
      '• pollingInterval: Custom polling interval in seconds (override default) ' +
      '• customProperties: Device-specific datasource properties/thresholds ' +
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
      '• **disableAlerting: true** - Still collects data, graphs work, but no alerts (good for maintenance) ' +
      '• **stopMonitoring: true** - No data collection, no graphs, no alerts (fully disabled) ' +
      '\n\n**Use cases by scenario:** ' +
      '\n\n**During server patching:** ' +
      'disableAlerting: true (want graphs to show downtime, but no alerts) ' +
      '\n\n**Datasource not applicable:** ' +
      'stopMonitoring: true (e.g., Windows datasource on Linux server - shouldn\'t be there) ' +
      '\n\n**High-frequency monitoring:** ' +
      'pollingInterval: 60 (every minute for critical metrics) ' +
      '\n\n**Low-frequency monitoring:** ' +
      'pollingInterval: 600 (every 10 minutes for less critical metrics) ' +
      '\n\n**Workflow:** Use "list_device_datasources" to find deviceDataSourceId, then update configuration. ' +
      '\n\n**Related tools:** "list_device_datasources" (find datasource), "get_device_datasource" (check current config), "list_device_instances" (see monitored instances).',
    annotations: {
      title: 'Update resource/device datasource',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
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

  // EventSources
  {
    name: 'list_eventsources',
    description: 'List all EventSources in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of EventSources with: id, name, displayName, description, appliesTo logic, event collection method. ' +
      '\n\n**What are EventSources:** Collect and process event data (logs, Windows events, syslog, traps). Different from DataSources (metrics) and ConfigSources (configs). Used for log monitoring and event correlation. ' +
      '\n\n**When to use:** (1) Find EventSource for log monitoring, (2) Discover what events are being collected, (3) Get EventSource IDs for operations, (4) Audit event monitoring coverage. ' +
      '\n\n**Event types collected:** ' +
      '• Windows Event Logs: Application, Security, System logs ' +
      '• Syslog: Linux/Unix system logs, network resource/device logs ' +
      '• SNMP Traps: Network resource/device alerts and notifications ' +
      '• Application logs: Custom app logs, web server logs ' +
      '• Cloud events: CloudWatch logs, Azure events ' +
      '\n\n**Common EventSources:** ' +
      '• Windows_Application_EventLog: Windows application events ' +
      '• Windows_Security_EventLog: Security/audit logs ' +
      '• Linux_Syslog: Linux system logs via syslog ' +
      '• SNMP_Traps: Network resource/device SNMP traps ' +
      '• VMware_Events: vCenter events ' +
      '\n\n**Use cases:** ' +
      '• Monitor Windows failed login attempts ' +
      '• Alert on ERROR/CRITICAL in application logs ' +
      '• Collect network resource/device syslog for troubleshooting ' +
      '• Track security events for compliance ' +
      '\n\n**Related tools:** "get_eventsource" (details), "list_device_eventsources" (events for device).',
    annotations: {
      title: 'List EventSources',
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
    description: 'Get detailed information about a specific EventSource by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete EventSource details: name, displayName, description, appliesTo logic, collection method, filter rules, severity mapping, alert settings. ' +
      '\n\n**When to use:** (1) Understand what events are collected, (2) Review filter rules (which events trigger alerts), (3) Check severity mapping, (4) Troubleshoot event collection, (5) See appliesTo logic. ' +
      '\n\n**Key information:** ' +
      '• appliesTo: Which resources/devicesget event monitoring ' +
      '• filters: Rules for parsing/matching events ' +
      '• severityMapping: Map event levels (INFO/WARN/ERROR) to LM alert levels ' +
      '• schedule: When event collection runs ' +
      '\n\n**Workflow:** Use "list_eventsources" to find eventSourceId, then use this tool for complete configuration. ' +
      '\n\n**Related tools:** "list_eventsources" (find EventSource), "list_device_eventsources" (events for device).',
    annotations: {
      title: 'Get EventSource details',
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
    description: 'List all escalation chains in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of escalation chains with: id, name, description, escalation stages, recipients at each stage, timing/delays, enabled status. ' +
      '\n\n**What are escalation chains:** Define HOW and WHO gets notified when alerts trigger. Multi-stage notification workflows: Stage 1 (notify team lead immediately) → Stage 2 (if still open after 15 min, notify manager) → Stage 3 (if still open after 30 min, page director). ' +
      '\n\n**When to use:** (1) Audit notification routing, (2) Find escalation chain IDs for alert rule configuration, (3) Review who gets notified for critical alerts, (4) Verify on-call escalation paths. ' +
      '\n\n**How escalation chains work:** ' +
      'Alert triggers → Alert Rule matches → Routes to Escalation Chain → Stage 1 notifies immediately → Wait X minutes → If still alerting, Stage 2 notifies → Repeat through stages ' +
      '\n\n**Common escalation patterns:** ' +
      '• **Critical Production:** Stage 1: On-call engineer (0 min) → Stage 2: Team lead (15 min) → Stage 3: Engineering manager (30 min) ' +
      '• **Standard:** Stage 1: Team email (0 min) → Stage 2: PagerDuty (30 min) ' +
      '• **Business Hours Only:** Stage 1: Team Slack (0 min, 8am-6pm only) ' +
      '\n\n**Use cases:** ' +
      '• "Who gets paged for critical database alerts?" → Check escalation chain ' +
      '• "Why didn\'t I get notified?" → Verify you\'re in the escalation chain ' +
      '• "Update on-call rotation" → Modify escalation chain recipients ' +
      '\n\n**Related tools:** "get_escalation_chain" (detailed stages), "list_alert_rules" (see which rules use chain), "list_recipients" (available notification targets).',
    annotations: {
      title: 'List escalation chains',
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
    description: 'Get detailed information about a specific escalation chain by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete escalation chain details: name, description, all stages with: recipients at each stage, notification methods (email/SMS/webhook), time delays between stages, rate limiting, business hours restrictions. ' +
      '\n\n**When to use:** (1) Review detailed notification workflow, (2) Verify who gets notified at each stage, (3) Check timing between escalations, (4) Audit notification methods, (5) Troubleshoot why notifications not received. ' +
      '\n\n**Stage details returned:** ' +
      'For each stage: ' +
      '• Stage number (1, 2, 3...) ' +
      '• Delay before stage triggers (minutes) ' +
      '• Recipients/groups notified ' +
      '• Notification methods (email, SMS, integration) ' +
      '• Schedule (24/7 vs business hours only) ' +
      '\n\n**Example escalation chain details:** ' +
      'Stage 1 (0 min): Email "oncall@company.com", SMS "+1-555-1234" ' +
      'Stage 2 (15 min): PagerDuty integration, Email "team-lead@company.com" ' +
      'Stage 3 (30 min): Slack webhook, Email "engineering-manager@company.com" ' +
      '\n\n**Workflow:** Use "list_escalation_chains" to find chainId, then use this tool to review complete notification workflow. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find chains), "update_escalation_chain" (modify), "list_recipients" (see recipients).',
    annotations: {
      title: 'Get escalation chain details',
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
    description: 'Create a new escalation chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines multi-stage notification workflow for alerts. Controls WHO gets notified, WHEN they get notified, and HOW notifications escalate if alerts remain unacknowledged. ' +
      '\n\n**When to use:** (1) Set up on-call rotation notifications, (2) Define critical alert escalation (team → lead → manager), (3) Create business hours vs after-hours notification paths, (4) Configure team-specific alert routing, (5) Establish incident escalation procedures. ' +
      '\n\n**Required parameters:** ' +
      '• name: Escalation chain name (e.g., "Critical Production", "Database Team", "Business Hours Only") ' +
      '• stages: Array of escalation stages defining notification workflow ' +
      '\n\n**Stage configuration:** ' +
      'Each stage defines: ' +
      '• recipients: Array of recipient IDs or group IDs to notify ' +
      '• delay: Minutes to wait before this stage (0 = immediate, 15 = wait 15 min) ' +
      '• notificationMethod: email, SMS, voice, webhook, integration ' +
      '• schedule: When stage is active (24/7 vs business hours only) ' +
      '\n\n**Escalation chain workflow:** ' +
      'Alert triggers → Matched by Alert Rule → Routes to Escalation Chain → ' +
      'Stage 1 notifies immediately → Wait delay → If still alerting → Stage 2 notifies → Repeat ' +
      '\n\n**Common escalation patterns:** ' +
      '\n\n**Critical Production (3-stage):** ' +
      '{name: "Critical Production", stages: [ ' +
      '  {recipients: [1,2], delay: 0, method: "SMS"},  // On-call engineer immediately ' +
      '  {recipients: [3], delay: 15, method: "SMS"},  // Team lead after 15min ' +
      '  {recipients: [4], delay: 30, method: "voice"}  // Manager after 30min total ' +
      ']} ' +
      '\n\n**Standard Team (2-stage):** ' +
      '{name: "Database Team", stages: [ ' +
      '  {recipients: [groupId:10], delay: 0, method: "email"},  // Entire team immediately ' +
      '  {recipients: [5], delay: 30, method: "SMS"}  // Team lead after 30min ' +
      ']} ' +
      '\n\n**Business Hours Only:** ' +
      '{name: "Non-Critical", stages: [ ' +
      '  {recipients: [groupId:20], delay: 0, method: "email", schedule: "business-hours"}  // Email during work hours only ' +
      ']} ' +
      '\n\n**PagerDuty Integration:** ' +
      '{name: "PagerDuty Escalation", stages: [ ' +
      '  {recipients: [integrationId:1], delay: 0, method: "webhook"}  // PagerDuty handles escalation ' +
      ']} ' +
      '\n\n**Slack + Email Combo:** ' +
      '{name: "DevOps Team", stages: [ ' +
      '  {recipients: [slackId:1], delay: 0, method: "webhook"},  // Slack channel immediately ' +
      '  {recipients: [groupId:30], delay: 10, method: "email"}  // Email if not acknowledged ' +
      ']} ' +
      '\n\n**Delay timing explained:** ' +
      '• delay: 0 = Immediate notification when alert triggers ' +
      '• delay: 15 = Wait 15 minutes from previous stage ' +
      '• delay: 30 = Wait 30 minutes from previous stage ' +
      '• If alert acknowledged, escalation stops (no further stages notify) ' +
      '• If alert clears, escalation stops ' +
      '\n\n**Notification methods:** ' +
      '• email: Email to recipient address ' +
      '• SMS: Text message to phone ' +
      '• voice: Phone call ' +
      '• webhook: HTTP POST (for Slack, PagerDuty, custom integrations) ' +
      '• integration: Pre-configured integration (ServiceNow, Jira, etc.) ' +
      '\n\n**Schedule restrictions:** ' +
      '• "24/7" or null: Always active ' +
      '• "business-hours": Mon-Fri 9am-5pm (configurable) ' +
      '• Custom schedules: Define specific time windows ' +
      '\n\n**After creation workflow:** ' +
      '1. Create escalation chain with notification stages ' +
      '2. Create Alert Rule that routes alerts to this chain ' +
      '3. Alert Rule matches alerts → Routes to chain → Chain notifies per stages ' +
      '\n\n**Best practices:** ' +
      '• Use recipient groups instead of individuals (easier to update) ' +
      '• Start with reasonable delays (15-30 min between stages) ' +
      '• Use SMS/voice for critical escalations only (cost/noise) ' +
      '• Business hours chains for non-critical alerts (reduce after-hours noise) ' +
      '• Test escalation chains before production use ' +
      '• Document who is in each stage for on-call handoffs ' +
      '\n\n**Related tools:** "list_recipients" (find recipients), "list_recipient_groups" (find groups), "list_integrations" (find integrations), "create_alert_rule" (route alerts to chain), "list_escalation_chains" (view all).',
    annotations: {
      title: 'Create escalation chain',
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
    description: 'Update an existing escalation chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify escalation chain stages, recipients, timing, or notification methods. Changes affect all alert rules using this chain immediately. ' +
      '\n\n**When to use:** (1) Update on-call rotation recipients, (2) Adjust escalation timing, (3) Add/remove notification stages, (4) Change notification methods, (5) Update business hours schedules. ' +
      '\n\n**Required parameters:** ' +
      '• chainId: Escalation chain ID (from "list_escalation_chains") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New chain name ' +
      '• description: Updated description ' +
      '• stages: New escalation stages array (replaces all stages) ' +
      '• enabled: true (active) or false (disable temporarily) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update on-call rotation:** ' +
      '{chainId: 123, stages: [{recipients: [newOnCallId], delay: 0, method: "SMS"}]} ' +
      '\n\n**Adjust escalation timing:** ' +
      '{chainId: 123, stages: [{recipients: [1,2], delay: 0}, {recipients: [3], delay: 10}]} // Faster escalation ' +
      '\n\n**Add stage for manager escalation:** ' +
      '{chainId: 123, stages: [stage1, stage2, {recipients: [managerId], delay: 45}]} // Add 3rd stage ' +
      '\n\n**Disable chain temporarily:** ' +
      '{chainId: 123, enabled: false} // During team restructuring ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '• All alert rules using this chain immediately use new configuration ' +
      '• Active alerts in-progress continue with old stages (already notified) ' +
      '• New alerts use updated stages ' +
      '• Disabling chain stops all notifications for alerts routed to it ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_escalation_chain" to review current configuration ' +
      '2. Use "list_alert_rules" to see which rules use this chain (impact analysis) ' +
      '3. Update escalation chain ' +
      '4. Monitor alerts to verify new configuration works ' +
      '\n\n**Related tools:** "get_escalation_chain" (review), "list_alert_rules" (impact analysis), "list_recipients" (find new recipients).',
    annotations: {
      title: 'Update escalation chain',
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
    description: 'Delete an escalation chain from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS ALERT ROUTING** ' +
      '• Alert rules using this chain will stop sending notifications ' +
      '• Active alerts routed to this chain stop escalating ' +
      '• Cannot be undone - must recreate chain if needed ' +
      '• No alerts will be sent until rules updated to use different chain ' +
      '\n\n**What this does:** Permanently removes escalation chain. Alert rules referencing this chain lose their notification path and stop sending alerts. ' +
      '\n\n**When to use:** (1) Consolidating duplicate chains, (2) Replacing with better-configured chain, (3) Team/process restructuring, (4) Cleanup unused chains. ' +
      '\n\n**Required parameters:** ' +
      '• chainId: Escalation chain ID to delete (from "list_escalation_chains") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "list_alert_rules" with filter to find ALL rules using this chain ' +
      '2. Create/identify replacement escalation chain ' +
      '3. Update all alert rules to use new chain BEFORE deleting ' +
      '4. Verify no rules still reference this chain ' +
      '\n\n**Impact of deletion:** ' +
      '• **Alert Rules:** Rules using this chain stop sending notifications (silently!) ' +
      '• **Active Alerts:** In-progress escalations stop (no further stages notify) ' +
      '• **New Alerts:** Matched by broken rules but no notifications sent ' +
      '• **No Error:** System does not warn that notifications stopped ' +
      '\n\n**Safe deletion workflow:** ' +
      '\n\n**Step 1: Find affected alert rules** ' +
      'list_alert_rules() // Look for escalationChainId matching chain to delete ' +
      '\n\n**Step 2: Create/identify replacement chain** ' +
      'create_escalation_chain(name: "New On-Call") // Or use existing chain ID ' +
      '\n\n**Step 3: Update ALL alert rules FIRST** ' +
      'For each rule: update_alert_rule(ruleId: X, escalationChainId: NEW_CHAIN_ID) ' +
      '\n\n**Step 4: Verify no rules reference old chain** ' +
      'list_alert_rules() // Confirm no rules use old chainId ' +
      '\n\n**Step 5: Delete chain** ' +
      'delete_escalation_chain(chainId: OLD_CHAIN_ID) ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**Replace on-call rotation chain:** ' +
      '1. Create new escalation chain with updated rotation ' +
      '2. Update all alert rules to new chain ' +
      '3. Test with sample alert ' +
      '4. Delete old chain once verified ' +
      '\n\n**Consolidate duplicate chains:** ' +
      '1. Identify chains doing same thing ' +
      '2. Choose one to keep (or create better one) ' +
      '3. Update rules using duplicate chains to use primary chain ' +
      '4. Delete duplicate chains ' +
      '\n\n**⚠️ NEVER delete escalation chain without updating alert rules first - notifications will silently stop!** ' +
      '\n\n**Best practice:** Always migrate alert rules to replacement chain BEFORE deleting old chain. ' +
      '\n\n**Related tools:** "list_alert_rules" (find usage), "update_alert_rule" (migrate rules), "create_escalation_chain" (create replacement).',
    annotations: {
      title: 'Delete escalation chain',
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
    description: 'List all alert recipients (individual notification targets) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of recipients with: id, type (email/SMS/webhook), contact information, method (email address, phone number, webhook URL), name, status. ' +
      '\n\n**What are recipients:** Individual notification endpoints used in escalation chains. Can be: email addresses, SMS/phone numbers, webhook URLs, or integration endpoints (Slack, PagerDuty, etc.). ' +
      '\n\n**When to use:** (1) Find recipient IDs for escalation chain configuration, (2) Audit who can receive alerts, (3) Verify contact information is current, (4) Review notification endpoints before updating escalation chains. ' +
      '\n\n**Recipient types explained:** ' +
      '• **Email:** Email address (e.g., oncall@company.com, john.doe@company.com) ' +
      '• **SMS:** Mobile phone number (e.g., +1-555-123-4567) ' +
      '• **Voice:** Phone number for voice calls ' +
      '• **Arbitrary:** Custom webhooks for external integrations ' +
      '\n\n**Common use cases:** ' +
      '• "Who can receive critical production alerts?" → List recipients used in escalation chains ' +
      '• "Update on-call phone number" → Find recipient by name, update contact info ' +
      '• "Add new team member to alerts" → Create recipient, add to escalation chain ' +
      '• "Remove former employee" → Find and delete recipient ' +
      '\n\n**Recipients vs Recipient Groups:** ' +
      '• Recipients: Individual targets (one email, one phone) ' +
      '• Recipient Groups: Collections of recipients (notify entire team at once) ' +
      '\n\n**Workflow:** Use this tool to find available recipients, then use in "create_escalation_chain" or "update_escalation_chain" to set up notifications. ' +
      '\n\n**Related tools:** "get_recipient" (details), "list_recipient_groups" (group management), "list_escalation_chains" (see who gets notified).',
    annotations: {
      title: 'List alert recipients',
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
    description: 'Get detailed information about a specific recipient by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete recipient details: type, name, contact information (email/phone/URL), notification method, timezone, schedule restrictions, rate limiting settings. ' +
      '\n\n**When to use:** (1) Verify contact information before escalation, (2) Check notification schedule (business hours vs 24/7), (3) Review rate limiting settings, (4) Audit recipient configuration. ' +
      '\n\n**Details returned:** ' +
      '• Contact info: Exact email/phone/webhook URL ' +
      '• Schedule: When notifications are sent (always vs business hours) ' +
      '• Rate limit: Max notifications per time period (prevent notification fatigue) ' +
      '• Method: Delivery mechanism (SMTP, Twilio, webhook) ' +
      '\n\n**Workflow:** Use "list_recipients" to find recipientId, then use this tool for complete configuration. ' +
      '\n\n**Related tools:** "list_recipients" (find recipient), "update_recipient" (modify), "list_escalation_chains" (usage).',
    annotations: {
      title: 'Get recipient details',
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
    description: 'Create a new alert recipient (notification endpoint) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates individual notification target (email address, phone number, webhook URL, etc.) that can receive alert notifications via escalation chains. ' +
      '\n\n**When to use:** (1) Add new team member to alert notifications, (2) Set up on-call phone numbers, (3) Configure webhook for Slack/Teams integration, (4) Add email distribution lists, (5) Set up SMS alerts for critical issues. ' +
      '\n\n**Required parameters:** ' +
      '• type: Recipient type - "email", "sms", "voice", "webhook" ' +
      '• address: Contact information (email address, phone number, webhook URL) ' +
      '\n\n**Optional parameters:** ' +
      '• name: Friendly name (e.g., "John Doe - Mobile", "Team Slack Channel") ' +
      '• schedule: Notification schedule (24/7, business hours only, custom) ' +
      '• rateLimit: Max notifications per time period (prevent alert fatigue) ' +
      '\n\n**Recipient types and examples:** ' +
      '\n\n**Email recipient:** ' +
      '{type: "email", address: "oncall@company.com", name: "On-Call Team Email"} ' +
      '{type: "email", address: "john.doe@company.com", name: "John Doe"} ' +
      '\n\n**SMS recipient (mobile alerts):** ' +
      '{type: "sms", address: "+1-555-123-4567", name: "John - Mobile", schedule: "24/7"} ' +
      '{type: "sms", address: "+1-555-987-6543", name: "On-Call Phone"} ' +
      '\n\n**Voice recipient (phone calls):** ' +
      '{type: "voice", address: "+1-555-111-2222", name: "Emergency Contact"} ' +
      '\n\n**Webhook recipient (integrations):** ' +
      '{type: "webhook", address: "https://hooks.slack.com/...", name: "DevOps Slack Channel"} ' +
      '{type: "webhook", address: "https://custom-app.com/alerts", name: "Custom Integration"} ' +
      '\n\n**Schedule options:** ' +
      '• "24/7" or null: Always receive notifications ' +
      '• "business-hours": Mon-Fri 9am-5pm only (reduce after-hours noise) ' +
      '• Custom schedule: Define specific days/times ' +
      '\n\n**Rate limiting (prevent notification fatigue):** ' +
      '• rateLimit: 10 = Max 10 notifications per hour ' +
      '• rateLimit: 5 = Max 5 notifications per hour (for SMS/voice - cost control) ' +
      '• Prevents alert storms from flooding recipient ' +
      '\n\n**Common recipient patterns:** ' +
      '\n\n**On-call engineer (multiple contact methods):** ' +
      '1. Create email: {type: "email", address: "engineer@company.com"} ' +
      '2. Create SMS: {type: "sms", address: "+1-555-1234"} ' +
      '3. Create voice: {type: "voice", address: "+1-555-1234"} ' +
      '4. Add all to escalation chain for redundancy ' +
      '\n\n**Team notification (prefer groups):** ' +
      'For multiple people, better to: ' +
      '1. Create individual recipients for each team member ' +
      '2. Create recipient group containing all members ' +
      '3. Use group in escalation chains (easier to manage) ' +
      '\n\n**After creation workflow:** ' +
      '1. Create recipient(s) ' +
      '2. Optionally create recipient group to organize ' +
      '3. Add to escalation chain stages ' +
      '4. Escalation chain used by alert rules ' +
      '5. Recipient receives notifications when alerts match ' +
      '\n\n**Best practices:** ' +
      '• Descriptive names: "John Doe - Mobile" not just phone number ' +
      '• Use business hours schedule for non-critical alerts ' +
      '• Rate limit SMS/voice to control costs ' +
      '• Group related recipients (easier management) ' +
      '• Test with sample alert before production use ' +
      '\n\n**Related tools:** "create_recipient_group" (organize recipients), "create_escalation_chain" (use recipients), "list_recipients" (view all).',
    annotations: {
      title: 'Create recipient',
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
    description: 'Update an existing alert recipient in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify recipient contact information, notification schedule, rate limits, or name. Changes affect all escalation chains using this recipient. ' +
      '\n\n**When to use:** (1) Update phone number/email after personnel changes, (2) Change notification schedule, (3) Adjust rate limits, (4) Update recipient name, (5) Switch from email to SMS. ' +
      '\n\n**Required parameters:** ' +
      '• recipientId: Recipient ID (from "list_recipients") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• address: New contact info (email, phone, webhook URL) ' +
      '• name: New friendly name ' +
      '• schedule: Update notification hours ' +
      '• rateLimit: Change max notifications per hour ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update on-call phone number:** ' +
      '{recipientId: 123, address: "+1-555-999-8888", name: "John Doe - New Mobile"} ' +
      '\n\n**Change to business hours only:** ' +
      '{recipientId: 123, schedule: "business-hours"} // Stop after-hours alerts ' +
      '\n\n**Reduce SMS rate limit (cost control):** ' +
      '{recipientId: 123, rateLimit: 5} // Max 5 SMS per hour ' +
      '\n\n**Update webhook URL:** ' +
      '{recipientId: 123, address: "https://new-webhook-url.com/alerts"} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_recipient" to review current configuration ' +
      '2. Update recipient information ' +
      '3. Changes take effect immediately for new notifications ' +
      '\n\n**Related tools:** "get_recipient" (review), "list_recipients" (find recipient), "list_escalation_chains" (see usage).',
    annotations: {
      title: 'Update recipient',
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
    description: 'Delete an alert recipient from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS ESCALATION CHAINS** ' +
      '• Escalation chains using this recipient will have gaps in notification ' +
      '• Stages referencing this recipient stop notifying (silently) ' +
      '• No error shown - notifications just don\'t arrive ' +
      '• Cannot be undone ' +
      '\n\n**What this does:** Permanently removes recipient. Escalation chains referencing this recipient lose that notification endpoint. ' +
      '\n\n**When to use:** (1) Employee left company, (2) Phone number decommissioned, (3) Email no longer valid, (4) Webhook endpoint retired, (5) Consolidating duplicate recipients. ' +
      '\n\n**Required parameters:** ' +
      '• recipientId: Recipient ID to delete (from "list_recipients") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "list_escalation_chains" to find chains using this recipient ' +
      '2. Create/identify replacement recipient ' +
      '3. Update escalation chains to use new recipient BEFORE deleting ' +
      '4. Verify no chains reference this recipient ' +
      '\n\n**Impact of deletion:** ' +
      '• Escalation chain stages with this recipient stop sending notifications ' +
      '• No error or warning - notifications silently fail ' +
      '• Active alerts may skip escalation stages ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Find which escalation chains use this recipient ' +
      '2. Create new recipient for replacement ' +
      '3. Update all escalation chains to use new recipient ' +
      '4. Verify updated ' +
      '5. Delete old recipient ' +
      '\n\n**Best practice:** Replace recipient in all escalation chains BEFORE deleting to prevent notification gaps. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find usage), "create_recipient" (replacement), "update_escalation_chain" (migrate).',
    annotations: {
      title: 'Delete recipient',
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
    description: 'List all recipient groups in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of recipient groups with: id, name, description, member count, recipients list. ' +
      '\n\n**What are recipient groups:** Collections of recipients treated as a single notification target. Simplify escalation chains by notifying entire teams at once. Example: "Database Team" group contains 5 team members - notify group = notify all 5. ' +
      '\n\n**When to use:** (1) Find group IDs for escalation chains, (2) Audit team notification lists, (3) Review group membership before changes, (4) Simplify notification management. ' +
      '\n\n**Benefits over individual recipients:** ' +
      '• **Easier management:** Update team once, applies to all escalation chains using that group ' +
      '• **Team notifications:** Notify entire team simultaneously ' +
      '• **Organized:** Group by function (DB team, Network team, On-call rotation) ' +
      '\n\n**Common recipient groups:** ' +
      '• "On-Call Engineers" - Current on-call rotation members ' +
      '• "Database Team" - All database administrators ' +
      '• "Network Operations" - NOC team members ' +
      '• "Management" - For escalation to leadership ' +
      '\n\n**Use cases:** ' +
      '• "Notify entire team for critical alerts" → Use group instead of 5 individual recipients ' +
      '• "Rotate on-call" → Update group members without touching escalation chains ' +
      '• "Add new team member" → Add to group, automatically included in alerts ' +
      '\n\n**Workflow:** Use this tool to find groups, then use in escalation chains to notify multiple people at once. ' +
      '\n\n**Related tools:** "get_recipient_group" (details), "list_recipients" (individual members), "list_escalation_chains" (see usage).',
    annotations: {
      title: 'List recipient groups',
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
    description: 'Get detailed information about a specific recipient group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete recipient group details: name, description, list of all members (recipients), member contact info, escalation chains using this group. ' +
      '\n\n**When to use:** (1) Review group membership before modifications, (2) Verify who gets notified through this group, (3) Check which escalation chains use this group, (4) Audit team notification lists. ' +
      '\n\n**Key information returned:** ' +
      '• Members: All recipients in group (names, emails, phones) ' +
      '• Usage: Which escalation chains reference this group ' +
      '• Description: Purpose/team name ' +
      '\n\n**Before modifying group:** Review escalation chain usage to understand impact of changes. Removing member from group affects all chains using that group. ' +
      '\n\n**Workflow:** Use "list_recipient_groups" to find groupId, then use this tool to review membership before updating. ' +
      '\n\n**Related tools:** "list_recipient_groups" (find groups), "update_recipient_group" (modify), "list_escalation_chains" (see where used).',
    annotations: {
      title: 'Get recipient group details',
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
    description: 'Create a new recipient group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates collection of recipients treated as single notification target. Simplifies escalation chains by notifying entire teams at once instead of listing individual recipients. ' +
      '\n\n**When to use:** (1) Set up team notifications (email entire team), (2) Create on-call rotation groups, (3) Organize recipients by department/function, (4) Simplify escalation chain management, (5) Group multiple contact methods for redundancy. ' +
      '\n\n**Required parameters:** ' +
      '• name: Group name (e.g., "Database Team", "On-Call Engineers", "NOC Team") ' +
      '• recipients: Array of recipient IDs to include in group ' +
      '\n\n**Optional parameters:** ' +
      '• description: Group purpose/notes ' +
      '\n\n**Benefits of recipient groups:** ' +
      '• **Simpler management:** Update group once vs updating each escalation chain ' +
      '• **Team notifications:** Notify all 5 team members by referencing 1 group ' +
      '• **Easy rotation updates:** Swap group members without touching escalation chains ' +
      '• **Organized:** Group by function (database team, network team, managers) ' +
      '\n\n**Common group patterns:** ' +
      '\n\n**Team notification group:** ' +
      '{name: "Database Team", recipients: [1,2,3,4,5], description: "All database administrators"} ' +
      '// Notify entire team at once ' +
      '\n\n**On-call rotation group:** ' +
      '{name: "Current On-Call", recipients: [10,11], description: "This week\'s on-call engineers"} ' +
      '// Update recipients weekly for rotation ' +
      '\n\n**Multi-channel redundancy group:** ' +
      '{name: "John Doe - All Contacts", recipients: [emailId, smsId, voiceId]} ' +
      '// Email + SMS + Voice for same person ' +
      '\n\n**Escalation level groups:** ' +
      '{name: "Management", recipients: [20,21,22], description: "Engineering managers"} ' +
      '{name: "Executives", recipients: [30,31], description: "CTO, VP Engineering"} ' +
      '\n\n**Department groups:** ' +
      '{name: "Network Operations", recipients: [40,41,42,43]} ' +
      '{name: "Server Team", recipients: [50,51,52]} ' +
      '{name: "Security Team", recipients: [60,61]} ' +
      '\n\n**Workflow example:** ' +
      '1. Create individual recipients for team members ' +
      '2. Create recipient group containing all members ' +
      '3. Use group in escalation chain (simpler than listing 5 individuals) ' +
      '4. Update group membership when team changes (escalation chains unchanged) ' +
      '\n\n**On-call rotation workflow:** ' +
      '1. Create "On-Call This Week" group ' +
      '2. Initially: Add current on-call person ' +
      '3. Use group in escalation chains ' +
      '4. Weekly: Update group members (swap old/new on-call) ' +
      '5. Escalation chains automatically use new on-call person ' +
      '\n\n**Best practices:** ' +
      '• Descriptive names: "Team Name - Purpose" ' +
      '• One group per team/function ' +
      '• Use groups in escalation chains instead of individual recipients ' +
      '• Keep groups small (3-10 members) for manageability ' +
      '• Document group purpose in description ' +
      '\n\n**Related tools:** "list_recipients" (find recipients), "update_recipient_group" (change members), "create_escalation_chain" (use groups).',
    annotations: {
      title: 'Create recipient group',
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
    description: 'Update an existing recipient group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group membership, name, or description. Changes affect all escalation chains using this group immediately. ' +
      '\n\n**When to use:** (1) Update on-call rotation (swap team members), (2) Add new team members to notifications, (3) Remove departed employees, (4) Reorganize team structure, (5) Rename group. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Recipient group ID (from "list_recipient_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New group name ' +
      '• description: Updated description ' +
      '• recipients: New array of recipient IDs (replaces all members) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update on-call rotation:** ' +
      '{groupId: 123, recipients: [newOnCallId1, newOnCallId2]} // Swap weekly rotation ' +
      '\n\n**Add new team member:** ' +
      '{groupId: 123, recipients: [1,2,3,4,5,6]} // Added recipient 6 ' +
      '\n\n**Remove departed employee:** ' +
      '{groupId: 123, recipients: [1,2,4,5]} // Removed recipient 3 ' +
      '\n\n**Rename group:** ' +
      '{groupId: 123, name: "Database Team - Updated"} ' +
      '\n\n**⚠️ Important:** ' +
      '• All escalation chains using this group immediately use new members ' +
      '• Removing member: They stop receiving notifications ' +
      '• Adding member: They start receiving notifications ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_recipient_group" to see current members ' +
      '2. Update group with new membership ' +
      '3. Changes take effect for next alerts ' +
      '\n\n**Related tools:** "get_recipient_group" (review), "list_recipient_groups" (find group), "list_recipients" (find recipients).',
    annotations: {
      title: 'Update recipient group',
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
    description: 'Delete a recipient group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS ESCALATION CHAINS** ' +
      '• Escalation chains using this group stop notifying those members ' +
      '• No error or warning shown ' +
      '• Notifications silently fail for stages using this group ' +
      '• Cannot be undone ' +
      '\n\n**What this does:** Permanently removes recipient group. Escalation chains referencing this group lose that notification path. ' +
      '\n\n**When to use:** (1) Team dissolved/restructured, (2) Consolidating duplicate groups, (3) Replacing with individual recipients, (4) Cleanup unused groups. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Recipient group ID to delete (from "list_recipient_groups") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "list_escalation_chains" to find chains using this group ' +
      '2. Create replacement group or identify individual recipients ' +
      '3. Update all escalation chains BEFORE deleting group ' +
      '4. Verify no chains reference this group ' +
      '\n\n**Impact of deletion:** ' +
      '• Escalation chain stages with this group stop sending notifications ' +
      '• No error - notifications silently fail ' +
      '• Individual recipients NOT deleted (just group container removed) ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Find which escalation chains use this group ' +
      '2. Create new group or identify replacement recipients ' +
      '3. Update all escalation chains to use replacement ' +
      '4. Verify updated ' +
      '5. Delete old group ' +
      '\n\n**Best practice:** Migrate escalation chains to replacement group/recipients BEFORE deleting to prevent notification gaps. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find usage), "create_recipient_group" (replacement), "update_escalation_chain" (migrate).',
    annotations: {
      title: 'Delete recipient group',
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
    description: 'List all alert rules in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of alert rules with: id, name, priority, enabled status, matching conditions (device/datasource/severity filters), escalation chain assigned, suppression settings. ' +
      '\n\n**What are alert rules:** The ROUTING LOGIC that determines "which alerts go to which people." Act as traffic directors: "IF alert matches these conditions, THEN send to this escalation chain." Rules are evaluated in priority order (1st match wins). ' +
      '\n\n**When to use:** (1) Audit who gets notified for different alert types, (2) Understand notification routing logic, (3) Find rule IDs for modifications, (4) Troubleshoot "why didn\'t I get alerted?", (5) Document alert notification policies. ' +
      '\n\n**How alert rules work:** ' +
      'Alert triggers → Rules evaluated in priority order → First matching rule wins → Routes alert to that rule\'s escalation chain → Escalation chain notifies recipients ' +
      '\n\n**Common alert rule patterns:** ' +
      '• **Priority 1 (Critical Production):** IF resource/device in "Production" group AND severity = critical → Route to "Critical On-Call" escalation chain ' +
      '• **Priority 2 (Database Team):** IF datasource contains "MySQL" OR "PostgreSQL" → Route to "Database Team" escalation chain ' +
      '• **Priority 3 (Business Hours):** IF severity = warning → Route to "Business Hours Email" chain (no pages) ' +
      '• **Priority 99 (Catch-All):** IF any alert not matched above → Route to "Default NOC" escalation chain ' +
      '\n\n**Use cases:** ' +
      '• "Who gets paged for production CPU alerts?" → Find rule matching prod resources/resources/devices+ CPU datasource ' +
      '• "Update team notifications" → Modify alert rule to route to different escalation chain ' +
      '• "Stop getting low-priority pages" → Check which rule routes those alerts, adjust severity or chain ' +
      '\n\n**Critical for notification troubleshooting:** If alerts aren\'t reaching people, check: (1) Does alert match any rule? (2) Is matched rule enabled? (3) Is escalation chain configured correctly? ' +
      '\n\n**Related tools:** "get_alert_rule" (detailed conditions), "list_escalation_chains" (destination chains), "update_alert_rule" (modify routing).',
    annotations: {
      title: 'List alert rules',
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
    description: 'Get detailed information about a specific alert rule by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete alert rule details: name, priority, enabled status, detailed matching conditions (device groups, datasources, datapoints, instance filters, severity levels), escalation chain assignment, suppression windows, notification settings. ' +
      '\n\n**When to use:** (1) Review exact matching logic before modifying rule, (2) Troubleshoot why alert matched (or didn\'t match) this rule, (3) Document alert routing policies, (4) Verify suppression settings, (5) Check which escalation chain receives matching alerts. ' +
      '\n\n**Matching conditions explained:** ' +
      '• deviceGroups: Which resource/device folders this rule applies to (e.g., */Production/*, */Database Servers/*) ' +
      '• datasources: Which datasources trigger this rule (e.g., *CPU*, *Memory*, AWS_EC2) ' +
      '• datapoints: Specific metrics (e.g., CPUBusyPercent, MemoryUsedPercent) ' +
      '• instances: Filter by instance name (e.g., C: drive only, eth0 interface only) ' +
      '• severity: Alert levels (critical, error, warn) ' +
      '• escalatingChainId: Where matching alerts are routed ' +
      '\n\n**Troubleshooting use cases:** ' +
      '• "Why did this CPU alert go to wrong team?" → Check resource/device group + datasource filters ' +
      '• "Why didn\'t I get paged?" → Verify alert matches conditions AND check escalation chain ' +
      '• "Too many alerts" → Review if conditions too broad, add instance filters ' +
      '\n\n**Workflow:** Use "list_alert_rules" to find ruleId, then use this tool to review complete matching logic and routing. ' +
      '\n\n**Related tools:** "list_alert_rules" (find rules), "update_alert_rule" (modify), "get_escalation_chain" (check notification chain).',
    annotations: {
      title: 'Get alert rule details',
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
    description: 'Create a new alert rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines routing logic determining which alerts go to which escalation chains. Alert rules match alerts by device, datasource, severity, etc., and route to appropriate notification paths. ' +
      '\n\n**When to use:** (1) Set up alert notifications for new teams, (2) Route critical alerts differently than warnings, (3) Send database alerts to database team, (4) Configure environment-specific routing (prod vs dev), (5) Establish tiered alerting by severity. ' +
      '\n\n**Required parameters:** ' +
      '• name: Rule name (e.g., "Critical Production Alerts", "Database Team Alerts") ' +
      '• priority: Rule evaluation order (1=highest, evaluated first) ' +
      '• escalationChainId: Which escalation chain receives matching alerts ' +
      '\n\n**Optional parameters (matching conditions):** ' +
      '• deviceGroups: Device folders to match (e.g., "*/Production/*") ' +
      '• datasources: DataSource names to match (e.g., "*CPU*", "*Memory*") ' +
      '• instances: Instance names to match ' +
      '• datapoints: Specific metrics ' +
      '• severity: Alert levels (critical, error, warn) ' +
      '\n\n**How alert rules work:** ' +
      'Alert triggers → Rules evaluated in priority order → First matching rule wins → Routes to that rule\'s escalation chain → Escalation chain notifies recipients ' +
      '\n\n**Priority is CRITICAL:** ' +
      '• Rules evaluated in priority order (1, 2, 3...) ' +
      '• FIRST matching rule wins (stops evaluation) ' +
      '• More specific rules need LOWER priority numbers (evaluated first) ' +
      '• Catch-all rules need HIGHER priority numbers (evaluated last) ' +
      '\n\n**Common alert rule patterns:** ' +
      '\n\n**Critical production alerts (Priority 1):** ' +
      '{name: "Critical Production", priority: 1, deviceGroups: "*/Production/*", severity: "critical", escalationChainId: 10} ' +
      '// Critical alerts from production resources/resources/devices→ On-call chain ' +
      '\n\n**Database team alerts (Priority 2):** ' +
      '{name: "Database Team", priority: 2, datasources: "*MySQL*,*PostgreSQL*,*Oracle*", escalationChainId: 20} ' +
      '// Any database datasource → Database team chain ' +
      '\n\n**Network team alerts (Priority 3):** ' +
      '{name: "Network Team", priority: 3, deviceGroups: "*/Network resources/Devices/*", escalationChainId: 30} ' +
      '// Network resource/device → Network team chain ' +
      '\n\n**Business hours only (Priority 4):** ' +
      '{name: "Non-Critical Warnings", priority: 4, severity: "warn", escalationChainId: 40} ' +
      '// Warnings → Business hours email chain ' +
      '\n\n**Catch-all rule (Priority 99):** ' +
      '{name: "Default - All Alerts", priority: 99, escalationChainId: 50} ' +
      '// Everything else → Default NOC chain ' +
      '\n\n**DeviceGroups filter examples:** ' +
      '• "*/Production/*" - Any resource/device in Production folder ' +
      '• "*/Production/Web Servers/*" - Only production web servers ' +
      '• "*" - All resource/device (catch-all) ' +
      '\n\n**Datasources filter examples:** ' +
      '• "*CPU*" - Any datasource with CPU in name ' +
      '• "WinCPU,LinuxCPU" - Specific datasources (comma-separated) ' +
      '• "*Memory*,*Disk*" - Memory or Disk datasources ' +
      '\n\n**Severity options:** ' +
      '• "critical" - Critical alerts only ' +
      '• "error" - Error and critical ' +
      '• "warn" - All severities (warn, error, critical) ' +
      '\n\n**Best practices:** ' +
      '• Start with priority 1 for most specific rules ' +
      '• Increment by 10 (1, 10, 20, 30...) to leave room for insertions ' +
      '• Always have catch-all rule at high priority (99) as safety net ' +
      '• Test rules with sample alerts before production ' +
      '• Document why each rule exists (in description) ' +
      '• Review rules quarterly as teams/infrastructure changes ' +
      '\n\n**After creation workflow:** ' +
      '1. Create escalation chains first (define WHO gets notified) ' +
      '2. Create alert rules (define WHICH alerts go to which chains) ' +
      '3. Test with sample alerts ' +
      '4. Monitor alert routing to verify working correctly ' +
      '\n\n**Related tools:** "list_escalation_chains" (create chains first), "update_alert_rule" (modify), "list_alert_rules" (view all), "list_alerts" (test routing).',
    annotations: {
      title: 'Create alert rule',
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
          description: 'Array of resource/device criteria for this rule',
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
    description: 'Update an existing alert rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify rule matching conditions, priority, escalation chain, or enable/disable rule. Changes affect how NEW alerts are routed immediately. ' +
      '\n\n**When to use:** (1) Route alerts to different team, (2) Adjust rule priority, (3) Update matching conditions, (4) Temporarily disable rule, (5) Broaden/narrow alert scope. ' +
      '\n\n**Required parameters:** ' +
      '• ruleId: Alert rule ID (from "list_alert_rules") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New rule name ' +
      '• priority: Change evaluation order ' +
      '• escalationChainId: Route to different chain ' +
      '• deviceGroups: Update resource/device scope ' +
      '• datasources: Update datasource filter ' +
      '• severity: Change severity matching ' +
      '• enabled: true (active) or false (disable) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Route to different team:** ' +
      '{ruleId: 123, escalationChainId: 456} // Database alerts → new DB team chain ' +
      '\n\n**Adjust priority (rule conflict):** ' +
      '{ruleId: 123, priority: 5} // Make this rule evaluate earlier ' +
      '\n\n**Temporarily disable rule:** ' +
      '{ruleId: 123, enabled: false} // During team transition ' +
      '\n\n**Broaden scope:** ' +
      '{ruleId: 123, deviceGroups: "*/Production/*,*/Staging/*"} // Add staging resource/device ' +
      '\n\n**Narrow scope:** ' +
      '{ruleId: 123, severity: "critical"} // Only critical, not warnings ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '• New alerts immediately use updated rule ' +
      '• Active alerts already routed continue with original chain ' +
      '• Disabling rule means matching alerts route to next matching rule ' +
      '• Priority changes affect which rule wins for overlapping conditions ' +
      '\n\n**Priority update considerations:** ' +
      'If two rules match same alert, LOWER priority number wins. Example: ' +
      '• Rule A (priority 1): deviceGroups="*/Production/*" ' +
      '• Rule B (priority 2): datasources="*CPU*" ' +
      '• Alert from Production resource/device with CPU datasource → Rule A wins (priority 1) ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_alert_rule" to review current configuration ' +
      '2. Use "list_alert_rules" to check priority conflicts ' +
      '3. Update alert rule ' +
      '4. Monitor new alerts to verify routing correctly ' +
      '\n\n**Related tools:** "get_alert_rule" (review), "list_alert_rules" (check priorities), "list_alerts" (verify routing).',
    annotations: {
      title: 'Update alert rule',
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
          description: 'Updated resource/device criteria',
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
    description: 'Delete an alert rule from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: STOPS ALERT ROUTING** ' +
      '• Alerts that matched this rule will route to NEXT matching rule ' +
      '• If no other rules match, alerts may go to default catch-all rule ' +
      '• If NO rules match, alerts might not notify anyone ' +
      '• Cannot be undone ' +
      '\n\n**What this does:** Permanently removes alert rule from routing logic. Alerts previously matched by this rule will be evaluated by remaining rules. ' +
      '\n\n**When to use:** (1) Consolidating duplicate rules, (2) Team/function no longer exists, (3) Replacing with better-configured rule, (4) Cleanup after reorganization. ' +
      '\n\n**Required parameters:** ' +
      '• ruleId: Alert rule ID to delete (from "list_alert_rules") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "get_alert_rule" to understand what alerts this rule matches ' +
      '2. Use "list_alert_rules" to identify which rule will handle these alerts after deletion ' +
      '3. If replacing, create new rule with LOWER priority BEFORE deleting old one ' +
      '4. Verify alert coverage gap won\'t occur ' +
      '\n\n**Impact of deletion:** ' +
      '• **Immediate:** New alerts re-evaluate against remaining rules ' +
      '• **Next match:** Alerts fall through to next matching rule (higher priority number) ' +
      '• **No match:** Alerts might reach catch-all rule or go unnotified ' +
      '• **Active alerts:** Continue with original routing (already assigned) ' +
      '\n\n**Safe deletion workflow:** ' +
      '\n\n**Scenario 1: Replacing rule** ' +
      '1. Get current rule details: get_alert_rule(ruleId: OLD_ID) ' +
      '2. Create new rule with improved config and SAME/LOWER priority ' +
      '3. Test: Verify new rule catches expected alerts ' +
      '4. Delete old rule ' +
      '\n\n**Scenario 2: Consolidating duplicate rules** ' +
      '1. Identify which rules match same alerts (review priorities) ' +
      '2. Keep most comprehensive rule ' +
      '3. Update kept rule if needed to cover all cases ' +
      '4. Delete duplicate rules ' +
      '\n\n**Scenario 3: Team disbanded** ' +
      '1. Find what alerts this rule matched ' +
      '2. Identify which team should receive these alerts now ' +
      '3. Create/update rule to route to new team ' +
      '4. Delete old rule ' +
      '\n\n**Priority matters when deleting:** ' +
      'Example: 3 rules with priorities 1, 5, 10 ' +
      '• Delete priority 1 → Alerts now match priority 5 (if conditions match) ' +
      '• Delete priority 5 → Priority 1 still catches most; priority 10 catches remainder ' +
      '• Delete priority 10 (catch-all) → Alerts with no other match might go unnotified! ' +
      '\n\n**⚠️ NEVER delete catch-all rule (high priority like 99) without replacement - creates notification black hole!** ' +
      '\n\n**Best practice:** Create replacement rule BEFORE deleting old rule to ensure continuous alert coverage. ' +
      '\n\n**Related tools:** "get_alert_rule" (review before delete), "list_alert_rules" (check coverage), "create_alert_rule" (replacement).',
    annotations: {
      title: 'Delete alert rule',
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
    description: 'List all operational notes (OpsNotes) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of OpsNotes with: id, note text, timestamp (epoch), who created it, tags, scope (applies to which resources/devices/groups), related SDTs. ' +
      '\n\n**What are OpsNotes:** Timestamped operational annotations displayed on graphs and dashboards. Document changes, deployments, maintenance, incidents - anything that might affect metrics. Appear as vertical lines on metric graphs at the time they occurred. ' +
      '\n\n**When to use:** (1) Correlate metric changes with operational events, (2) Document deployments/changes, (3) Create timeline of incidents and responses, (4) Track maintenance activities, (5) Generate operational reports. ' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**Deployments:** ' +
      '• "Deployed v2.5.0 to production" (explains CPU spike at deploy time) ' +
      '• "Database schema migration" (explains slow queries during migration) ' +
      '\n\n**Incidents:** ' +
      '• "Customer reported slow load times - investigating" ' +
      '• "Found memory leak, restarting services" ' +
      '• "Incident resolved - bad cache configuration" ' +
      '\n\n**Maintenance:** ' +
      '• "Scaled from 10 to 15 instances" ' +
      '• "Updated SSL certificates" ' +
      '• "Cleared old logs, freed 500GB disk" ' +
      '\n\n**Benefits:** ' +
      '• **Troubleshooting:** "Latency increased at 2pm" → Check OpsNotes: "Deploy happened at 2pm" ' +
      '• **Correlation:** Understand cause of metric anomalies ' +
      '• **Documentation:** Automatic operational timeline ' +
      '• **Communication:** Share what happened with team ' +
      '\n\n**Common filter patterns:** ' +
      '• By time: filter:"happenedOn>1730851200" (recent notes) ' +
      '• By tags: filter:"tags~*deployment*" ' +
      '• By device: filter:"monitorObjectName~*prod-web*" ' +
      '\n\n**Displayed on:** Graphs, dashboards, resource/device pages - visible wherever metrics are shown. ' +
      '\n\n**Related tools:** "get_opsnote" (details), "create_opsnote" (add new), "create_device_sdt" (maintenance windows).',
    annotations: {
      title: 'List OpsNotes',
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
    description: 'Get detailed information about a specific operational note by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete OpsNote details: note text, timestamp, creator, tags, scope (resources/devices/groups affected), related SDTs, linked resources. ' +
      '\n\n**When to use:** (1) Get full note details after finding ID via list, (2) Review what was documented at specific time, (3) Check scope of operational event, (4) Verify linked resources. ' +
      '\n\n**Workflow:** Use "list_opsnotes" to find note ID, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_opsnotes" (find notes), "create_opsnote" (add new), "update_opsnote" (modify).',
    annotations: {
      title: 'Get OpsNote details',
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
    description: 'Create a new operational note (OpsNote) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates timestamped annotation displayed on graphs/dashboards at specific time. Documents changes, deployments, incidents, maintenance - anything that might correlate with metric changes. ' +
      '\n\n**When to use:** (1) Document deployments/releases, (2) Track incident timelines, (3) Note configuration changes, (4) Record maintenance windows, (5) Annotate known events that affect metrics. ' +
      '\n\n**Required parameters:** ' +
      '• note: The annotation text (what happened) ' +
      '• timestamp: When it happened (epoch milliseconds) ' +
      '\n\n**Optional parameters (scope - what it applies to):** ' +
      '• deviceId: Specific resource/device (shows on that device\'s graphs) ' +
      '• deviceGroupId: Device group (shows on all resource/device in group) ' +
      '• websiteId: Website monitor ' +
      '• tags: Keywords for filtering/searching (e.g., ["deployment", "database"]) ' +
      '\n\n**Why OpsNotes are valuable:** ' +
      '• **Troubleshooting:** Quickly see "what changed" around metric spikes/drops ' +
      '• **Correlation:** Link operational events to performance impact ' +
      '• **Documentation:** Automatic timeline of changes ' +
      '• **Team communication:** Share context on dashboards ' +
      '\n\n**Common OpsNote patterns:** ' +
      '\n\n**Deployment tracking:** ' +
      '{note: "Deployed v2.5.0 to production web servers - build #12345", timestamp: 1699889400000, deviceGroupId: 123, tags: ["deployment", "web"]} ' +
      '// Shows on all web server graphs ' +
      '\n\n**Incident documentation:** ' +
      '{note: "Incident INC-5678: Database performance issue - investigating", timestamp: 1699890000000, deviceId: 456, tags: ["incident", "database"]} ' +
      '{note: "INC-5678: Root cause - slow query. Optimized index.", timestamp: 1699891800000, deviceId: 456, tags: ["incident", "resolved"]} ' +
      '// Timeline of incident on affected resource/device ' +
      '\n\n**Configuration changes:** ' +
      '{note: "Updated Nginx config - increased worker processes from 4 to 8", timestamp: 1699892000000, deviceId: 789, tags: ["config-change"]} ' +
      '{note: "Applied firewall rule changes - blocked port 8080", timestamp: 1699893000000, deviceGroupId: 100, tags: ["security", "firewall"]} ' +
      '\n\n**Maintenance windows:** ' +
      '{note: "Started OS patching on all Linux servers", timestamp: 1699894000000, deviceGroupId: 200, tags: ["maintenance", "patching"]} ' +
      '{note: "Completed OS patching - all servers rebooted", timestamp: 1699898000000, deviceGroupId: 200, tags: ["maintenance", "completed"]} ' +
      '\n\n**Known events:** ' +
      '{note: "AWS announced maintenance in us-east-1", timestamp: 1699895000000, tags: ["aws", "external"]} ' +
      '{note: "Batch job running - expected high CPU", timestamp: 1699896000000, deviceId: 111, tags: ["batch-job", "expected"]} ' +
      '\n\n**Scope options explained:** ' +
      '• **deviceId:** Shows on specific resource/device\'s graphs only ' +
      '• **deviceGroupId:** Shows on all resource/device in that group ' +
      '• **websiteId:** Shows on website monitoring graphs ' +
      '• **No scope (global):** Shows on all graphs (use sparingly) ' +
      '\n\n**Timestamp tips:** ' +
      '• Use actual event time (not current time) for accurate correlation ' +
      '• Epoch milliseconds: Date.now() in JavaScript, time.time()*1000 in Python ' +
      '• For past events: Calculate epoch milliseconds for that date/time ' +
      '\n\n**Best practices:** ' +
      '• **Be specific:** "Deployed v2.5.0" not "deployed" ' +
      '• **Include identifiers:** Build numbers, ticket IDs, version numbers ' +
      '• **Use tags:** Makes finding related notes easy ' +
      '• **Scope appropriately:** Don\'t make global notes for single resource/device changes ' +
      '• **Document resolution:** Add note when incident resolved, not just when started ' +
      '\n\n**Workflow examples:** ' +
      '\n\n**During deployment:** ' +
      '1. Start: Create note "Deployment started - v2.5.0" ' +
      '2. Progress: Create note "Database migrations complete" ' +
      '3. Complete: Create note "Deployment complete - all services healthy" ' +
      '\n\n**During incident:** ' +
      '1. Detection: Create note "High CPU detected - investigating" ' +
      '2. Updates: Add notes as you discover findings ' +
      '3. Resolution: Create note "RESOLVED: Killed runaway process" ' +
      '\n\n**After creation:** ' +
      'OpsNotes appear as vertical lines on graphs at the timestamp. Hover to see note text. Use "list_opsnotes" to search/review notes. ' +
      '\n\n**Related tools:** "list_opsnotes" (view all notes), "update_opsnote" (modify), "delete_opsnote" (remove).',
    annotations: {
      title: 'Create OpsNote',
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
          description: 'Array of scopes (resources/devices, groups) this note applies to',
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
    description: 'Update an existing operational note in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify OpsNote text, timestamp, tags, or scope. Useful for correcting mistakes or adding details after initial creation. ' +
      '\n\n**When to use:** (1) Fix typos in note text, (2) Add more details after investigation, (3) Correct timestamp, (4) Update tags for better organization, (5) Change scope (different device/group). ' +
      '\n\n**Required parameters:** ' +
      '• opsNoteId: OpsNote ID (from "list_opsnotes") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• note: New note text ' +
      '• timestamp: Corrected time (epoch milliseconds) ' +
      '• tags: Updated tag array ' +
      '• deviceId: Change to different resource/device ' +
      '• deviceGroupId: Change to different group ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add more details after investigation:** ' +
      '{opsNoteId: 123, note: "Deployed v2.5.0 - ROLLBACK at 3:45pm due to memory leak in new code"} ' +
      '// Updated after discovering issue ' +
      '\n\n**Fix typo:** ' +
      '{opsNoteId: 456, note: "Database migration completed successfully"} ' +
      '// Fixed spelling error ' +
      '\n\n**Correct timestamp:** ' +
      '{opsNoteId: 789, timestamp: 1699899000000} ' +
      '// Used wrong time initially ' +
      '\n\n**Add tags for better organization:** ' +
      '{opsNoteId: 111, tags: ["deployment", "rollback", "production", "critical"]} ' +
      '// Added more descriptive tags ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list_opsnotes" to find note to update ' +
      '2. Update with new information ' +
      '3. Graph annotations update immediately ' +
      '\n\n**Related tools:** "list_opsnotes" (find note), "create_opsnote" (create new), "delete_opsnote" (remove).',
    annotations: {
      title: 'Update OpsNote',
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
    description: 'Delete an operational note from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes OpsNote. Annotation disappears from graphs and dashboards immediately. ' +
      '\n\n**When to use:** (1) Created note by mistake, (2) Note contains incorrect information, (3) Note is no longer relevant, (4) Cleanup old test notes. ' +
      '\n\n**Required parameters:** ' +
      '• opsNoteId: OpsNote ID to delete (from "list_opsnotes") ' +
      '\n\n**Impact:** ' +
      '• Note removed from all graphs and dashboards immediately ' +
      '• Historical record deleted (cannot be recovered) ' +
      '• Other notes unaffected ' +
      '\n\n**Common deletion scenarios:** ' +
      '• Wrong device: Created note on wrong resource/device - delete and recreate on correct one ' +
      '• Wrong time: Timestamp significantly wrong - easier to delete and recreate ' +
      '• Test note: Remove test annotations after experimenting ' +
      '• Irrelevant: "Testing new deployment process" after test completed ' +
      '\n\n**Best practice:** ' +
      'Consider updating note instead of deleting if it just needs correction. Deletion removes historical record. ' +
      '\n\n**Workflow:** ' +
      '1. Use "list_opsnotes" to find note ' +
      '2. Verify correct note before deleting ' +
      '3. Delete note ' +
      '4. Annotation disappears from graphs immediately ' +
      '\n\n**Related tools:** "list_opsnotes" (find note), "update_opsnote" (alternative to deletion), "create_opsnote" (recreate if needed).',
    annotations: {
      title: 'Delete OpsNote',
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
    description: 'List all business services in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of services with: id, name, description, health status, dependencies, monitored resources, service level objectives (SLOs), availability percentage. ' +
      '\n\n**What are services:** Business-level monitoring constructs that aggregate multiple resources/resources/devices/resources into a single health status. Represent customer-facing services, applications, or business processes. Example: "E-Commerce Platform" service includes web servers, databases, load balancers, and APIs - one health indicator for entire platform. ' +
      '\n\n**When to use:** (1) Monitor business service health vs individual resource/device health, (2) Track SLA compliance for customer-facing services, (3) Understand service dependencies, (4) Create business-level dashboards, (5) Report on application availability. ' +
      '\n\n**Service health calculation:** ' +
      'Service health = Aggregate of all dependent resources. If critical resource fails, service status = down. Allows stakeholders to see "Is the application working?" instead of "Is server X working?" ' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**Customer-facing services:** ' +
      '• "E-Commerce Website" - Web servers + database + payment gateway + CDN ' +
      '• "Mobile App Backend" - API servers + auth service + push notifications ' +
      '• "SaaS Platform" - All infrastructure for multi-tenant application ' +
      '\n\n**Internal services:** ' +
      '• "Employee VPN" - VPN servers + RADIUS auth + firewall ' +
      '• "Corporate Email" - Mail servers + spam filter + archiving ' +
      '• "CI/CD Pipeline" - Jenkins + artifact storage + deployment agents ' +
      '\n\n**Benefits:** ' +
      '• **Business perspective:** Non-technical stakeholders understand "Shopping Cart is 99.5% available" ' +
      '• **SLA tracking:** Measure uptime for customer SLAs ' +
      '• **Root cause:** When service is down, see which specific resource failed ' +
      '• **Dependencies:** Visualize what resources comprise a service ' +
      '\n\n**Common filter patterns:** ' +
      '• By status: filter:"status:normal" or filter:"status:dead" ' +
      '• By name: filter:"name~*production*" ' +
      '\n\n**Workflow:** Use this tool to find services, then "get_service" for detailed dependency tree and health status. ' +
      '\n\n**Related tools:** "get_service" (details and dependencies), "list_service_groups" (organization), "create_service" (define new business service).',
    annotations: {
      title: 'List services',
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
    description: 'Get detailed information about a specific service by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete service details: name, description, health status, dependency tree (all resources comprising service), SLA/SLO configuration, availability statistics, alert rules, service group. ' +
      '\n\n**When to use:** (1) Review service dependencies (what resources are included), (2) Check current health status and root cause, (3) Verify SLA/SLO configuration, (4) Troubleshoot service downtime, (5) Understand service architecture. ' +
      '\n\n**Key information returned:** ' +
      '• **Dependency tree:** All resources/devices/resources that comprise this service ' +
      '• **Health calculation:** How service status is determined (e.g., "If ANY web server is down, service is degraded") ' +
      '• **Current status:** Operational / Degraded / Down ' +
      '• **SLA metrics:** Uptime percentage, outage history ' +
      '• **Alert configuration:** When to alert on service issues ' +
      '\n\n**Troubleshooting workflow:** ' +
      'Service shows "Down" → Check dependency tree → Identify which specific resource(s) failed → Address those resources → Service auto-recovers when dependencies healthy ' +
      '\n\n**Workflow:** Use "list_services" to find serviceId, then use this tool for complete dependency analysis. ' +
      '\n\n**Related tools:** "list_services" (find service), "update_service" (modify dependencies), "list_resources" (see health of dependent resources).',
    annotations: {
      title: 'Get service details',
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
    description: 'Create a new business service in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates business-level service aggregating multiple resources into single health status. Think "E-commerce Website" service composed of web servers, databases, load balancers, etc. Service health calculated from member resource/device health. ' +
      '\n\n**When to use:** (1) Monitor application-level health (not just infrastructure), (2) Create business-facing dashboards, (3) SLA tracking for customer-facing services, (4) Executive reporting (business view, not technical), (5) Complex dependency modeling. ' +
      '\n\n**Required parameters:** ' +
      '• name: Service name (e.g., "E-commerce Website", "Payment API", "Mobile App Backend") ' +
      '• groupId: Service group ID for organization (from "list_service_groups") ' +
      '\n\n**Optional parameters:** ' +
      '• description: Service purpose/details ' +
      '• resources/devices: Array of resource/device IDs that comprise this service ' +
      '• alertStatus: Service alert status (calculated or manual) ' +
      '\n\n**What are business services?** ' +
      'Business services represent application/service from business perspective, not infrastructure perspective. Examples: ' +
      '• "E-commerce Website" = web servers + database + Redis + CDN ' +
      '• "Payment Processing" = payment API + payment database + fraud detection service ' +
      '• "Mobile App Backend" = API gateway + app servers + auth service + database ' +
      '\n\n**Why use services?** ' +
      '• **Business view:** Executives care about "Is checkout working?" not "Is web-01 up?" ' +
      '• **SLA tracking:** Monitor service availability for SLA compliance ' +
      '• **Dependencies:** Model which resource/device affect which services ' +
      '• **Simplified dashboards:** Show service health, not 50 individual resource/device ' +
      '• **Impact analysis:** "Which services affected when database down?" ' +
      '\n\n**Service health calculation:** ' +
      'Service health = rollup of member resource/device health: ' +
      '• All resource/device healthy → Service healthy (green) ' +
      '• Any resource/device warning → Service warning (yellow) ' +
      '• Any resource/device critical → Service critical (red) ' +
      '• Any resource/device dead → Service dead (gray) ' +
      '\n\n**Common service patterns:** ' +
      '\n\n**Web application service:** ' +
      '{name: "E-commerce Website", groupId: 10, description: "Customer-facing e-commerce platform", resources/devices: [webserver1Id, webserver2Id, dbserverId, redisId, loadbalancerId]} ' +
      '// All components needed for website to function ' +
      '\n\n**API service:** ' +
      '{name: "Payment API v2", groupId: 20, description: "Payment processing API - SLA 99.9%", resources/devices: [apiserver1Id, apiserver2Id, paymentDbId, queueId]} ' +
      '// API servers + supporting infrastructure ' +
      '\n\n**Tiered application:** ' +
      '// Create separate services per tier for granular monitoring ' +
      '{name: "Mobile App - Web Tier", groupId: 30, resources/devices: [nginx1Id, nginx2Id]} ' +
      '{name: "Mobile App - App Tier", groupId: 30, resources/devices: [app1Id, app2Id, app3Id]} ' +
      '{name: "Mobile App - Data Tier", groupId: 30, resources/devices: [db1Id, db2Id, cacheId]} ' +
      '\n\n**Multi-region service:** ' +
      '{name: "Global API - US-East", groupId: 40, resources/devices: [usEastDevices...]} ' +
      '{name: "Global API - EU-West", groupId: 40, resources/devices: [euWestDevices...]} ' +
      '{name: "Global API - Asia-Pacific", groupId: 40, resources/devices: [asiaPacificDevices...]} ' +
      '\n\n**Workflow for creating services:** ' +
      '1. Identify business-critical application/service ' +
      '2. List all resources/resources/devices/components required for service to function ' +
      '3. Create service group for organization (if needed) ' +
      '4. Create service with all member resource/device ' +
      '5. Create dashboard showing service health ' +
      '6. Configure service-level alerting ' +
      '\n\n**Best practices:** ' +
      '• **Business names:** "Customer Portal" not "Web Stack 3" ' +
      '• **Complete membership:** Include ALL critical dependencies ' +
      '• **Granular services:** One service per distinct business function ' +
      '• **Use service groups:** Organize by department, product, or region ' +
      '• **Document SLAs:** Add SLA targets to description ' +
      '\n\n**After creation:** ' +
      'Service appears in Services view with aggregated health status. Use in dashboards to show business-level health. Use "update_service" to modify membership as infrastructure changes. ' +
      '\n\n**Related tools:** "list_service_groups" (create groups first), "update_service" (modify), "list_resources" (find resources/devices), "create_service_dashboard" (visualize).',
    annotations: {
      title: 'Create service',
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
    description: 'Update an existing business service in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify service name, description, or member resources/devices. Updates service health calculation when membership changes. ' +
      '\n\n**When to use:** (1) Add/remove resource/device as infrastructure changes, (2) Rename service, (3) Update description/SLA, (4) Reorganize service structure, (5) Reflect architecture changes. ' +
      '\n\n**Required parameters:** ' +
      '• serviceId: Service ID (from "list_services") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New service name ' +
      '• description: Updated description ' +
      '• resources/devices: New array of resource/device IDs (replaces all members) ' +
      '• groupId: Move to different service group ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Add new infrastructure:** ' +
      '{serviceId: 123, resources/devices: [existingDevices..., newDb2Id, newCache2Id]} ' +
      '// Added replica database and cache to service ' +
      '\n\n**Remove decommissioned resources/devices:** ' +
      '{serviceId: 123, resources/devices: [dev1, dev2, dev4]} // Removed dev3 (decomm) ' +
      '\n\n**Rename service:** ' +
      '{serviceId: 123, name: "E-commerce Platform v2"} ' +
      '\n\n**Update SLA documentation:** ' +
      '{serviceId: 123, description: "Customer-facing checkout - SLA 99.95% (updated Q4 2024)"} ' +
      '\n\n**⚠️ Important:** ' +
      'Updating resource/device array REPLACES all members. Include existing + new resources/resources/devices, or resource/device will be removed from service. ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_service" to see current membership ' +
      '2. Update service with complete resource/device list ' +
      '3. Service health recalculates immediately ' +
      '\n\n**Related tools:** "get_service" (review), "list_services" (find service), "list_resources" (find resources/devices).',
    annotations: {
      title: 'Update service',
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
    description: 'Delete a business service from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes service. Service disappears from dashboards and Services view. Member resource/device remain unaffected (only service container deleted). ' +
      '\n\n**When to use:** (1) Application/service decommissioned, (2) Service no longer needed, (3) Consolidating duplicate services, (4) Restructuring service hierarchy. ' +
      '\n\n**Required parameters:** ' +
      '• serviceId: Service ID to delete (from "list_services") ' +
      '\n\n**Impact:** ' +
      '• Service removed from all dashboards ' +
      '• Service health history deleted ' +
      '• Member resource/device NOT deleted (remain in monitoring) ' +
      '• Cannot be undone ' +
      '\n\n**Common deletion scenarios:** ' +
      '• Application decommissioned: Delete service after shutting down application ' +
      '• Consolidation: Merge multiple services into one, delete duplicates ' +
      '• Restructuring: Delete old service structure, create new one ' +
      '\n\n**Before deleting:** ' +
      '1. Check if service used in dashboards (will break dashboard widgets) ' +
      '2. Check if service used in alert rules (will break routing) ' +
      '3. Verify service no longer represents active business function ' +
      '\n\n**Best practice:** Update dashboards to remove service widgets BEFORE deleting service. ' +
      '\n\n**Related tools:** "list_services" (find service), "get_service" (verify before delete), "list_dashboards" (check usage).',
    annotations: {
      title: 'Delete service',
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
    description: 'List all service groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of service groups with: id, name, parentId, full path, description, number of services, number of subgroups. ' +
      '\n\n**What are service groups:** Organizational folders for business services, similar to resource/device groups for resources/devices. Used to categorize services by business unit, region, customer, or application stack. ' +
      '\n\n**When to use:** (1) Browse service organization before creating services, (2) Find group IDs for service operations, (3) Understand service hierarchy, (4) Navigate to specific service folders. ' +
      '\n\n**Common organization patterns:** ' +
      '• By business unit: "E-Commerce", "Marketing Platform", "Internal IT" ' +
      '• By customer: "Customer A Services", "Customer B Services" (MSP environments) ' +
      '• By region: "APAC Services", "EMEA Services", "Americas Services" ' +
      '• By tier: "Tier 1 Critical", "Tier 2 Standard", "Tier 3 Best Effort" ' +
      '\n\n**Use cases:** ' +
      '• Organize services for different stakeholders ' +
      '• Group services by SLA tiers ' +
      '• Separate internal vs customer-facing services ' +
      '• Structure multi-tenant service monitoring ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_services" filtered by groupId to see services in specific folder. ' +
      '\n\n**Related tools:** "get_service_group" (details), "list_services" (services in group), "create_service_group" (create folder).',
    annotations: {
      title: 'List service groups',
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
    description: 'Get detailed information about a specific service group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete service group details: name, full path, parentId, description, number of services (direct and total), number of subgroups. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Check service membership counts, (3) Verify group hierarchy, (4) Review group structure before creating services. ' +
      '\n\n**Workflow:** Use "list_service_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_service_groups" (find groups), "list_services" (services in group), "create_service_group" (create new).',
    annotations: {
      title: 'Get service group details',
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
    description: 'Create a new service group (folder) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates organizational folder for business services. Like resource/device groups for resources/devices, service groups organize services by team, product, region, or function. ' +
      '\n\n**When to use:** (1) Organize services before creating them, (2) Group services by department/team, (3) Separate services by product line, (4) Organize by region/environment, (5) Create service hierarchy. ' +
      '\n\n**Required parameters:** ' +
      '• name: Group name (e.g., "E-commerce Services", "Payment Services", "Mobile App Services") ' +
      '\n\n**Optional parameters:** ' +
      '• description: Group purpose ' +
      '• parentId: Parent group ID for nested hierarchy ' +
      '\n\n**Common service group patterns:** ' +
      '\n\n**By department/team:** ' +
      '{name: "Platform Engineering Services", description: "Core platform services"} ' +
      '{name: "Data Engineering Services", description: "Data pipelines and analytics"} ' +
      '{name: "Customer Services", description: "Customer-facing applications"} ' +
      '\n\n**By product line:** ' +
      '{name: "E-commerce Platform", description: "Online store services"} ' +
      '{name: "Mobile Banking", description: "Mobile banking app services"} ' +
      '{name: "Enterprise Suite", description: "B2B product services"} ' +
      '\n\n**By environment:** ' +
      '{name: "Production Services", description: "Customer-facing production"} ' +
      '{name: "Staging Services", description: "Pre-production testing"} ' +
      '\n\n**Nested hierarchy example:** ' +
      '1. Create parent: {name: "All Services"} → groupId: 100 ' +
      '2. Create children: {name: "Web Services", parentId: 100} ' +
      '3. Create children: {name: "API Services", parentId: 100} ' +
      '4. Create children: {name: "Data Services", parentId: 100} ' +
      '\n\n**Best practices:** ' +
      '• Create groups before creating services ' +
      '• Use descriptive names matching organizational structure ' +
      '• Organize by how business views applications ' +
      '• Keep hierarchy shallow (2-3 levels max) ' +
      '\n\n**After creation:** Use groupId when creating services to place them in appropriate folder. ' +
      '\n\n**Related tools:** "list_service_groups" (view hierarchy), "create_service" (add services to group), "update_service_group" (modify).',
    annotations: {
      title: 'Create service group',
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
    description: 'Update an existing service group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group name, description, or parent (move in hierarchy). Does not affect services within group. ' +
      '\n\n**When to use:** (1) Rename group after reorg, (2) Update description, (3) Move group in hierarchy, (4) Reorganize service structure. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Service group ID (from "list_service_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New group name ' +
      '• description: Updated description ' +
      '• parentId: New parent group (moves group) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename after reorg:** ' +
      '{groupId: 123, name: "Platform Services (Cloud Native)"} ' +
      '\n\n**Move in hierarchy:** ' +
      '{groupId: 123, parentId: 456} // Move to different parent ' +
      '\n\n**Update description:** ' +
      '{groupId: 123, description: "Updated to include new microservices"} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list_service_groups" to find group ' +
      '2. Update group settings ' +
      '3. Services within group unaffected ' +
      '\n\n**Related tools:** "list_service_groups" (find group), "get_service_group" (verify), "list_services" (services in group).',
    annotations: {
      title: 'Update service group',
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
    description: 'Delete a service group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: CHECK FOR SERVICES FIRST** ' +
      '• Cannot delete group containing services ' +
      '• Cannot delete group containing subgroups ' +
      '• Must be empty to delete ' +
      '\n\n**What this does:** Removes empty service group folder. Group must have no services and no subgroups. ' +
      '\n\n**When to use:** (1) Cleanup empty groups after reorganization, (2) Remove unused organizational folders, (3) Simplify service hierarchy. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Service group ID to delete (from "list_service_groups") ' +
      '\n\n**Before deleting:** ' +
      '1. Move all services to different group (or delete services) ' +
      '2. Move or delete all subgroups ' +
      '3. Verify group is empty ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Use "list_services" to find services in this group ' +
      '2. Move services: update_service(serviceId: X, groupId: NEW_GROUP) ' +
      '3. Check for subgroups in group ' +
      '4. Delete empty subgroups first ' +
      '5. Delete empty group ' +
      '\n\n**Error handling:** ' +
      'If deletion fails, group likely not empty. Check for: ' +
      '• Services still in group ' +
      '• Subgroups still under this group ' +
      '\n\n**Related tools:** "list_services" (check for services), "list_service_groups" (check for subgroups), "update_service" (move services).',
    annotations: {
      title: 'Delete service group',
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
    description: 'List all report groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of report groups with: id, name, parentId, full path, description, number of reports, number of subgroups. ' +
      '\n\n**What are report groups:** Organizational folders for reports, like directories for files. Used to categorize reports by audience, frequency, purpose, or department. ' +
      '\n\n**When to use:** (1) Browse report organization before creating reports, (2) Find group IDs for report operations, (3) Understand report hierarchy, (4) Navigate to specific report folders. ' +
      '\n\n**Common organization patterns:** ' +
      '• By audience: "Executive Reports", "Operations Reports", "Customer Reports" ' +
      '• By frequency: "Daily Reports", "Weekly Reports", "Monthly Reports" ' +
      '• By department: "IT Reports", "Finance Reports", "Compliance Reports" ' +
      '• By type: "SLA Reports", "Capacity Reports", "Alert Summary Reports" ' +
      '\n\n**Use cases:** ' +
      '• Organize reports for different stakeholders ' +
      '• Group compliance/audit reports separately ' +
      '• Separate internal vs customer-facing reports ' +
      '• Structure reports by delivery schedule ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_reports" filtered by groupId to see reports in specific folder. ' +
      '\n\n**Related tools:** "get_report_group" (details), "list_reports" (reports in group), "create_report_group" (create folder).',
    annotations: {
      title: 'List report groups',
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
    description: 'Get detailed information about a specific report group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete report group details: name, full path, parentId, description, number of reports (direct and total), number of subgroups. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Check report membership counts, (3) Verify group hierarchy, (4) Review group structure before creating reports. ' +
      '\n\n**Workflow:** Use "list_report_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_report_groups" (find groups), "list_reports" (reports in group), "create_report_group" (create new).',
    annotations: {
      title: 'Get report group details',
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
    description: 'Create a new report group (folder) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates organizational folder for reports. Organize reports by team, report type, schedule, or purpose. ' +
      '\n\n**When to use:** (1) Organize reports before creating them, (2) Group by department/team, (3) Separate by report frequency (daily/weekly/monthly), (4) Organize by purpose (compliance/executive/operational). ' +
      '\n\n**Required parameters:** ' +
      '• name: Group name (e.g., "Executive Reports", "Compliance Reports", "Daily Operations") ' +
      '\n\n**Optional parameters:** ' +
      '• description: Group purpose ' +
      '• parentId: Parent group ID for nested hierarchy ' +
      '\n\n**Common report group patterns:** ' +
      '• By audience: "Executive Reports", "Engineering Reports", "Business Unit Reports" ' +
      '• By frequency: "Daily Reports", "Weekly Reports", "Monthly Reports" ' +
      '• By purpose: "Compliance Reports", "SLA Reports", "Capacity Planning" ' +
      '• By type: "Alert Reports", "Availability Reports", "Performance Reports" ' +
      '\n\n**Best practices:** ' +
      '• Create groups before creating reports ' +
      '• Use descriptive names matching business needs ' +
      '• Keep hierarchy shallow (2-3 levels max) ' +
      '\n\n**Related tools:** "list_report_groups" (view hierarchy), "create_report" (add reports), "update_report_group" (modify).',
    annotations: {
      title: 'Create report group',
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
    description: 'Update an existing report group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group name, description, or parent (move in hierarchy). Does not affect reports within group. ' +
      '\n\n**When to use:** (1) Rename group, (2) Update description, (3) Move group in hierarchy, (4) Reorganize report structure. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Report group ID (from "list_report_groups") ' +
      '\n\n**Optional parameters:** ' +
      '• name: New group name ' +
      '• description: Updated description ' +
      '• parentId: New parent group (moves group) ' +
      '\n\n**Related tools:** "list_report_groups" (find group), "get_report_group" (verify), "list_reports" (reports in group).',
    annotations: {
      title: 'Update report group',
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
    description: 'Delete a report group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot delete group containing reports or subgroups. Must be empty to delete. ' +
      '\n\n**What this does:** Removes empty report group folder. Group must have no reports and no subgroups. ' +
      '\n\n**When to use:** (1) Cleanup empty groups after reorganization, (2) Remove unused organizational folders, (3) Simplify report hierarchy. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Report group ID to delete (from "list_report_groups") ' +
      '\n\n**Before deleting:** Move all reports and subgroups first, then delete empty group. ' +
      '\n\n**Related tools:** "list_reports" (check for reports), "list_report_groups" (check for subgroups), "update_report" (move reports).',
    annotations: {
      title: 'Delete report group',
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
    description: 'List all collector groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of collector groups with: id, name, parentId, full path, description, number of collectors, number of subgroups. ' +
      '\n\n**What are collector groups:** Organizational folders for collectors (monitoring agents), similar to resource/device groups. Used to categorize collectors by location, function, or customer. ' +
      '\n\n**When to use:** (1) Browse collector organization, (2) Find group IDs for collector operations, (3) Understand collector deployment structure, (4) Navigate to specific collector folders. ' +
      '\n\n**Common organization patterns:** ' +
      '• By location: "US-West Collectors", "EU Collectors", "APAC Collectors" ' +
      '• By environment: "Production Collectors", "Dev/Test Collectors" ' +
      '• By customer: "Customer A Collectors", "Customer B Collectors" (MSP) ' +
      '• By datacenter: "DC1 Collectors", "DC2 Collectors", "AWS Collectors" ' +
      '• By function: "Network Collectors", "Server Collectors", "Cloud Collectors" ' +
      '\n\n**Use cases:** ' +
      '• Organize collectors by geographic region ' +
      '• Group collectors by customer or tenant ' +
      '• Separate production vs non-production collectors ' +
      '• Structure multi-datacenter collector deployments ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_collectors" filtered by groupId to see collectors in specific folder. ' +
      '\n\n**Related tools:** "get_collector_group" (details), "list_collectors" (collectors in group), "create_collector_group" (create folder).',
    annotations: {
      title: 'List collector groups',
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
    description: 'Get detailed information about a specific collector group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete collector group details: name, full path, parentId, description, number of collectors (direct and total), number of subgroups. ' +
      '\n\n**When to use:** (1) Get group path for documentation, (2) Check collector membership counts, (3) Verify group hierarchy, (4) Review group structure before deploying collectors. ' +
      '\n\n**Workflow:** Use "list_collector_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_collector_groups" (find groups), "list_collectors" (collectors in group), "create_collector_group" (create new).',
    annotations: {
      title: 'Get collector group details',
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
    name: 'list_resource_group_properties',
    description: 'List all custom properties for a specific resource/device group in LogicMonitor (LM) monitoring. Properties set at group level are inherited by all resource/device in the group. ' +
      '\n\n**Returns:** Array of properties with: name, value, type (custom vs system), and inheritance source. ' +
      '\n\n**When to use:** (1) Review properties before bulk updates, (2) Audit credentials/settings applied to resource/device group, (3) Verify property inheritance from parent groups, (4) Check which properties resource/device will inherit when added to group, (5) Document group configuration. ' +
      '\n\n**What are group properties:** Key-value pairs set at group level that ALL resource/device in the group inherit. Common uses: credentials (SSH/SNMP), environment tags, owner/team info, monitoring settings. ' +
      '\n\n**Property inheritance:** ' +
      '• Properties set on group apply to ALL resource/device in group ' +
      '• Child groups inherit from parent groups ' +
      '• Device-level properties override group properties ' +
      '• Used by datasource "appliesTo" logic and authentication ' +
      '\n\n**Common group properties:** ' +
      '• **Credentials:** ssh.user, ssh.pass, snmp.community, wmi.user, wmi.pass ' +
      '• **Tags:** env (production/staging), location (datacenter), owner (team name) ' +
      '• **Business metadata:** cost.center, sla.tier, compliance.level ' +
      '• **Monitoring config:** polling.interval, alert.threshold.multiplier ' +
      '\n\n**Use cases:** ' +
      '• Audit credentials: Check which credentials are configured for group ' +
      '• Before bulk update: See current values before changing ' +
      '• Troubleshoot authentication: Verify credentials applied to resource/device ' +
      '• Document configuration: Export group settings ' +
      '\n\n**Workflow:** Use "list_resource_groups" to find groupId, then use this tool to see properties, then "update_device_group_property" to modify. ' +
      '\n\n**Related tools:** "update_device_group_property" (modify property), "get_resource_group" (group details), "list_device_properties" (device-level properties).',
    annotations: {
      title: 'List resource/device group properties',
      readOnlyHint: true,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The resource/device group ID',
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
    name: 'update_resource_group_property',
    description: 'Update a custom property value for a resource/device group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies group-level property inherited by all resource/device in group. Changes immediately affect all member resources/devices. ' +
      '\n\n**When to use:** (1) Update credentials for all resource/device in group, (2) Change environment tags, (3) Update owner/team information, (4) Modify monitoring settings, (5) Bulk property updates. ' +
      '\n\n**Required parameters:** ' +
      '• groupId: Device group ID (from "list_resource_groups") ' +
      '• name: Property name (e.g., "ssh.user", "env", "owner") ' +
      '• value: New property value ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update credentials for entire group:** ' +
      '{groupId: 123, name: "ssh.user", value: "monitoring-v2"} ' +
      '// All resource/device in group now use new SSH user ' +
      '\n\n**Change environment tag:** ' +
      '{groupId: 123, name: "env", value: "production"} ' +
      '// Mark entire group as production ' +
      '\n\n**Update owner/team:** ' +
      '{groupId: 123, name: "owner", value: "platform-team"} ' +
      '\n\n**⚠️ Important - Inheritance Impact:** ' +
      '• All resource/device in group inherit updated property ' +
      '• resources/Devices with device-level override keep their value (device wins) ' +
      '• Subgroup resource/device also inherit unless overridden ' +
      '• Credential changes affect monitoring immediately ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list_device_group_properties" to see current properties ' +
      '2. Update property value ' +
      '3. Changes propagate to all member resource/device immediately ' +
      '4. Test monitoring still works (especially for credential changes) ' +
      '\n\n**Related tools:** "list_device_group_properties" (view all), "list_device_properties" (device-level view), "get_resource_group" (group details).',
    annotations: {
      title: 'Update resource/device group property',
      readOnlyHint: false,
      serverUrl: `https://${process.env.LM_COMPANY}.logicmonitor.com`,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The resource/device group ID',
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
    description: 'List all network discovery scans (Netscans) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of netscans with: id, name, description, scan method (nmap/script/ICMP/SNMP), schedule, target networks (IP ranges/subnets), collector, last run time, resource/device discovered. ' +
      '\n\n**What are netscans:** Automated network discovery that finds resource/device on your network and adds them to monitoring. Instead of manually adding resource/device one-by-one, netscan automatically discovers and onboards resource/device based on IP ranges or subnets. ' +
      '\n\n**When to use:** (1) Audit existing discovery configurations, (2) Check which networks are being scanned, (3) Review netscan schedules, (4) Troubleshoot why resource/device not auto-discovered, (5) Find netscan IDs for modifications. ' +
      '\n\n**How netscans work:** ' +
      'Scheduled job → Scan network range (e.g., 192.168.1.0/24) → Find live resource/device → Check if already monitored → If new, add to LogicMonitor → Apply resource/device properties and datasources → Begin monitoring ' +
      '\n\n**Netscan methods:** ' +
      '• **nmap:** Network mapper scan (comprehensive, detects OS, ports, services) ' +
      '• **ICMP Ping:** Simple ping sweep (fastest, basic reachability) ' +
      '• **SNMP Walk:** Query SNMP-enabled resource/device (network gear, servers with SNMP) ' +
      '• **Script:** Custom discovery logic (cloud APIs, CMDBs, etc.) ' +
      '• **AWS/Azure/GCP:** Cloud auto-discovery via APIs ' +
      '\n\n**Common use cases:** ' +
      '• **Data center discovery:** Scan 10.0.0.0/16 network, auto-add all servers ' +
      '• **Cloud auto-discovery:** Scan AWS account, add all EC2 instances daily ' +
      '• **Branch office monitoring:** Scan remote office subnets, discover network resource/device ' +
      '• **Dynamic infrastructure:** Auto-discover containers, VMs as they spin up ' +
      '\n\n**Example netscan configurations:** ' +
      '• "Production Servers" - Scan 192.168.1.0/24 every 6 hours via nmap ' +
      '• "AWS EC2 Discovery" - Query AWS API every hour for new instances ' +
      '• "Network resources/Devices" - SNMP walk 10.0.0.0/8 daily for routers/switches ' +
      '\n\n**Workflow:** Use this tool to review netscans, then "get_netscan" for detailed configuration including filters and resource/device properties. ' +
      '\n\n**Related tools:** "get_netscan" (configuration details), "create_netscan" (set up auto-discovery), "run_netscan" (trigger manual scan).',
    annotations: {
      title: 'List netscans',
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
    description: 'Get detailed information about a specific netscan by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete netscan details: name, description, scan method, schedule, target networks/IPs, credentials, filters (include/exclude rules), resource/device properties to apply, collector assignment, duplicate detection settings, last execution results. ' +
      '\n\n**When to use:** (1) Review netscan configuration before running, (2) Troubleshoot why certain resource/device not discovered, (3) Check credentials and filters, (4) Verify resource/device properties applied to discovered resources/devices, (5) Understand duplicate detection logic. ' +
      '\n\n**Configuration details returned:** ' +
      '• **Targets:** IP ranges, subnets, or cloud filters (e.g., "192.168.1.0/24", "All EC2 with tag:Environment=prod") ' +
      '• **Schedule:** How often scan runs (hourly, daily, weekly, on-demand) ' +
      '• **Credentials:** Which properties used for authentication (ssh.user, snmp.community) ' +
      '• **Filters:** Include/exclude rules (e.g., "Exclude IPs ending in .1", "Only Linux servers") ' +
      '• **Device properties:** Auto-applied to discovered resource/device (e.g., location, environment tags) ' +
      '• **Duplicate handling:** How to handle resource/device found in multiple scans ' +
      '\n\n**Troubleshooting use cases:** ' +
      '• "Why resource/device not discovered?" → Check if IP in target range and not excluded by filters ' +
      '• "Wrong credentials?" → Verify credential properties configured in netscan ' +
      '• "resources/Devices missing properties?" → Check default properties applied by netscan ' +
      '\n\n**Workflow:** Use "list_netscans" to find netscanId, then use this tool to review complete configuration. ' +
      '\n\n**Related tools:** "list_netscans" (find netscan), "update_netscan" (modify), "run_netscan" (execute now).',
    annotations: {
      title: 'Get netscan details',
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
    description: 'Create a new network discovery scan (Netscan) in LogicMonitor (LM) monitoring to automatically discover and add resources/devices. ' +
      '\n\n**What this does:** Creates automated network scanner that discovers resource/device by IP range/subnet and adds them to monitoring. Runs on schedule to continuously discover new infrastructure. ' +
      '\n\n**When to use:** (1) Automate resource/device discovery instead of manual adds, (2) Onboard entire subnets, (3) Keep monitoring in sync with dynamic infrastructure (cloud/containers), (4) Continuous discovery for DHCP/dynamic environments, (5) Bulk resource/device onboarding. ' +
      '\n\n**Required parameters:** ' +
      '• name: Netscan name (e.g., "Production Network Scan", "AWS EC2 Discovery") ' +
      '• collectorId: Collector to perform scan (from "list_collectors") ' +
      '• targetType: "subnet", "iprange", "script", "awsEC2", "azureVMs", etc. ' +
      '• target: What to scan (depends on type - subnet CIDR, IP range, script, etc.) ' +
      '\n\n**Optional parameters:** ' +
      '• schedule: When to run ("manual", "daily", "weekly", cron expression) ' +
      '• deviceGroupId: Where to add discovered resource/device ' +
      '• credentials: Authentication for discovered resource/device ' +
      '• excludeFilters: IPs/ranges to skip ' +
      '\n\n**Common netscan patterns:** ' +
      '\n\n**Subnet discovery (on-prem):** ' +
      '{name: "Production Subnet", collectorId: 5, targetType: "subnet", target: "192.168.1.0/24", schedule: "daily", deviceGroupId: 100} ' +
      '// Scan 192.168.1.0/24 every day, add to Production group ' +
      '\n\n**IP range discovery:** ' +
      '{name: "Server Range", collectorId: 5, targetType: "iprange", target: "10.0.1.10-10.0.1.100", schedule: "0 0 2 * * ?", deviceGroupId: 200} ' +
      '// Scan IPs 10.0.1.10-100 at 2am daily ' +
      '\n\n**AWS EC2 discovery:** ' +
      '{name: "AWS Production EC2", collectorId: 5, targetType: "awsEC2", target: "us-east-1", schedule: "0 */6 * * ?", deviceGroupId: 300} ' +
      '// Discover EC2 instances every 6 hours ' +
      '\n\n**Azure VMs discovery:** ' +
      '{name: "Azure Production", collectorId: 5, targetType: "azureVMs", target: "subscription-id", schedule: "0 */4 * * ?", deviceGroupId: 400} ' +
      '// Discover Azure VMs every 4 hours ' +
      '\n\n**With exclusions:** ' +
      '{name: "Office Network", collectorId: 5, targetType: "subnet", target: "172.16.0.0/16", excludeFilters: ["172.16.1.0/24", "172.16.2.50"], deviceGroupId: 500} ' +
      '// Scan 172.16.0.0/16 except specific subnet/IP ' +
      '\n\n**Schedule options:** ' +
      '• "manual": Only run when manually triggered ' +
      '• "daily": Run once per day ' +
      '• "weekly": Run once per week ' +
      '• Cron: "0 0 2 * * ?" = 2am daily, "0 */6 * * * ?" = every 6 hours ' +
      '\n\n**TargetType options:** ' +
      '• subnet: Scan CIDR (e.g., "10.0.0.0/24") ' +
      '• iprange: Scan IP range (e.g., "10.0.1.1-10.0.1.255") ' +
      '• awsEC2: Discover AWS EC2 instances in region ' +
      '• azureVMs: Discover Azure VMs in subscription ' +
      '• script: Custom discovery script ' +
      '\n\n**Why use netscans:** ' +
      '• **Automation:** No manual resource/device adds ' +
      '• **Continuous:** Automatically discovers new infrastructure ' +
      '• **Dynamic environments:** Cloud, containers, DHCP networks ' +
      '• **Bulk onboarding:** Add hundreds of resource/device at once ' +
      '• **Compliance:** Ensure all resource/device are monitored ' +
      '\n\n**Best practices:** ' +
      '• Start with small subnets to test ' +
      '• Use excludeFilters for management IPs, printers, phones ' +
      '• Schedule during low-traffic hours (scans generate network traffic) ' +
      '• Test credentials before scheduling ' +
      '• Group resource/device appropriately with deviceGroupId ' +
      '\n\n**After creation:** Netscan runs on schedule. Use "list_netscans" to view, "get_netscan" for details. Check "list_resources" to see discovered resources/devices. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_resource_groups" (find deviceGroupId), "update_netscan" (modify), "delete_netscan" (remove).',
    annotations: {
      title: 'Create netscan',
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
          description: 'How to handle duplicate resources/devices',
        },
      },
      additionalProperties: false,
      required: ['name', 'collectorId'],
    },
  },
  {
    name: 'update_netscan',
    description: 'Update an existing network discovery scan (Netscan) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify netscan name, target, schedule, credentials, or settings. Changes take effect on next scan run. ' +
      '\n\n**When to use:** (1) Change IP range/subnet scanned, (2) Update scan schedule, (3) Modify credentials, (4) Change destination group for discovered resources/devices, (5) Update exclusion filters. ' +
      '\n\n**Required parameters:** ' +
      '• netscanId: Netscan ID (from "list_netscans") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New netscan name ' +
      '• target: New IP range/subnet ' +
      '• schedule: New schedule (daily, weekly, cron) ' +
      '• deviceGroupId: New destination group ' +
      '• excludeFilters: Updated exclusion list ' +
      '• credentials: Updated authentication ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Expand IP range:** ' +
      '{netscanId: 123, target: "192.168.0.0/16"} // Expanded from /24 to /16 ' +
      '\n\n**Change schedule:** ' +
      '{netscanId: 123, schedule: "0 0 3 * * ?"} // Changed to 3am daily ' +
      '\n\n**Update destination group:** ' +
      '{netscanId: 123, deviceGroupId: 456} // Move discovered resource/device to different group ' +
      '\n\n**Add exclusions:** ' +
      '{netscanId: 123, excludeFilters: ["192.168.1.0/24", "192.168.2.50-192.168.2.100"]} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_netscan" to review current settings ' +
      '2. Update netscan configuration ' +
      '3. Changes apply on next scheduled run ' +
      '\n\n**Related tools:** "get_netscan" (review), "list_netscans" (find netscan), "delete_netscan" (remove).',
    annotations: {
      title: 'Update netscan',
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
    description: 'Delete a network discovery scan (Netscan) from LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Permanently removes netscan. Stops all future automatic resource/device discovery for this target. Previously discovered resource/device remain in monitoring. ' +
      '\n\n**When to use:** (1) Decommissioned network/subnet, (2) Discovery no longer needed (static environment), (3) Consolidating duplicate netscans, (4) Migrating to different discovery method. ' +
      '\n\n**Required parameters:** ' +
      '• netscanId: Netscan ID to delete (from "list_netscans") ' +
      '\n\n**Impact:** ' +
      '• Netscan stops running (no more automatic discovery) ' +
      '• Previously discovered resource/device remain in monitoring (not deleted) ' +
      '• New resource/device in target range will NOT be automatically added ' +
      '• Cannot be undone ' +
      '\n\n**Best practice:** ' +
      'Before deleting, decide if you still need discovery for this network. resources/Devices already discovered remain monitored. ' +
      '\n\n**Related tools:** "list_netscans" (find netscan), "get_netscan" (verify before delete), "list_resources" (see discovered resources/devices).',
    annotations: {
      title: 'Delete netscan',
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
    description: 'List all third-party integrations configured in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of integrations with: id, name, type (Slack/PagerDuty/ServiceNow/Jira/etc), status (active/inactive), configuration summary, authentication status. ' +
      '\n\n**What are integrations:** Connections to external platforms for alert notifications, ticket creation, chat messages, incident management. Extend LogicMonitor alerting beyond email/SMS. ' +
      '\n\n**When to use:** (1) Find integration IDs for escalation chains, (2) Verify integrations are working, (3) Audit external connections, (4) Check authentication status, (5) Review available integration options. ' +
      '\n\n**Popular integrations:** ' +
      '\n\n**Incident Management:** ' +
      '• **PagerDuty:** Page on-call engineers for critical alerts ' +
      '• **Opsgenie:** Alternative incident management and on-call scheduling ' +
      '• **VictorOps (Splunk On-Call):** Alert routing and escalation ' +
      '\n\n**Ticketing:** ' +
      '• **ServiceNow:** Auto-create incidents for alerts ' +
      '• **Jira:** Create tickets for infrastructure issues ' +
      '• **Zendesk:** Customer-facing service desk integration ' +
      '\n\n**Collaboration:** ' +
      '• **Slack:** Post alerts to channels, interactive notifications ' +
      '• **Microsoft Teams:** Teams channel notifications ' +
      '• **Mattermost:** Self-hosted chat notifications ' +
      '\n\n**Workflow & Automation:** ' +
      '• **Webhooks:** Custom integrations to any HTTP endpoint ' +
      '• **API:** Programmatic integration for custom workflows ' +
      '\n\n**Use cases:** ' +
      '• "Post critical production alerts to #incidents Slack channel" ' +
      '• "Auto-create ServiceNow ticket for every critical alert" ' +
      '• "Page PagerDuty when datacenter resource/device go offline" ' +
      '• "Update Jira epic when deployment causes alerts" ' +
      '\n\n**Integration status:** ' +
      '• Active: Integration configured and working ' +
      '• Inactive: Disabled or authentication failed ' +
      '• Test: Verify integration by triggering test notification ' +
      '\n\n**Workflow:** Use this tool to find integrations, then use in escalation chains or as webhook recipients for alert delivery. ' +
      '\n\n**Related tools:** "get_integration" (configuration details), "test_integration" (verify working), "list_escalation_chains" (see usage).',
    annotations: {
      title: 'List integrations',
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
    description: 'Get detailed information about a specific integration by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete integration details: name, type, configuration (API keys, webhooks, URLs), authentication status, last successful notification, error logs, which escalation chains use it. ' +
      '\n\n**When to use:** (1) Troubleshoot integration not working, (2) Review configuration before updates, (3) Check API keys/authentication, (4) See last successful notification time, (5) Audit integration settings. ' +
      '\n\n**Configuration details by type:** ' +
      '• **Slack:** Webhook URL, channel names, mention settings ' +
      '• **PagerDuty:** Integration key, service mappings ' +
      '• **ServiceNow:** Instance URL, credentials, table mapping ' +
      '• **Jira:** Project keys, issue type, custom field mapping ' +
      '• **Webhook:** Target URL, authentication headers, payload format ' +
      '\n\n**Troubleshooting:** ' +
      '• Authentication failed: Check API keys/credentials ' +
      '• Not receiving notifications: Verify escalation chain configuration ' +
      '• Error logs: Review failed notification attempts ' +
      '\n\n**Workflow:** Use "list_integrations" to find integrationId, then use this tool for detailed configuration and troubleshooting. ' +
      '\n\n**Related tools:** "list_integrations" (find integrations), "test_integration" (send test), "update_integration" (modify).',
    annotations: {
      title: 'Get integration details',
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
    description: 'Create a new third-party integration in LogicMonitor (LM) monitoring to send alerts/data to external platforms. ' +
      '\n\n**What this does:** Connects LogicMonitor to external platforms (Slack, PagerDuty, ServiceNow, Jira, Teams, etc.) for alert notifications, ticket creation, and data export. ' +
      '\n\n**When to use:** (1) Send alerts to Slack/Teams channels, (2) Create tickets in ServiceNow/Jira automatically, (3) Page on-call via PagerDuty/Opsgenie, (4) Export data to analytics platforms, (5) Integrate with ITSM workflows. ' +
      '\n\n**Required parameters:** ' +
      '• type: Integration type ("slack", "pagerduty", "servicenow", "jira", "teams", "webhook", etc.) ' +
      '• name: Integration name (e.g., "DevOps Slack Channel", "ServiceNow Production") ' +
      '• config: Integration-specific configuration (API keys, URLs, channels, etc.) ' +
      '\n\n**Common integration patterns:** ' +
      '\n\n**Slack integration:** ' +
      '{type: "slack", name: "DevOps Team Slack", config: {webhookUrl: "https://hooks.slack.com/...", channel: "#alerts"}} ' +
      '// Sends alerts to Slack channel ' +
      '\n\n**PagerDuty integration:** ' +
      '{type: "pagerduty", name: "Production On-Call", config: {apiKey: "...", serviceKey: "..."}} ' +
      '// Pages on-call engineer ' +
      '\n\n**ServiceNow integration:** ' +
      '{type: "servicenow", name: "SNOW Production", config: {instance: "company.service-now.com", username: "...", password: "...", assignmentGroup: "Platform Team"}} ' +
      '// Creates incidents in ServiceNow ' +
      '\n\n**Jira integration:** ' +
      '{type: "jira", name: "Infrastructure Project", config: {url: "company.atlassian.net", username: "...", apiToken: "...", project: "INFRA", issueType: "Bug"}} ' +
      '// Creates Jira tickets ' +
      '\n\n**Microsoft Teams integration:** ' +
      '{type: "teams", name: "Platform Team Channel", config: {webhookUrl: "https://outlook.office.com/webhook/..."}} ' +
      '// Sends alerts to Teams channel ' +
      '\n\n**Generic webhook integration:** ' +
      '{type: "webhook", name: "Custom Webhook", config: {url: "https://api.company.com/alerts", method: "POST", headers: {"Authorization": "Bearer ..."}}} ' +
      '// Sends alerts to custom endpoint ' +
      '\n\n**Why use integrations:** ' +
      '• **Centralized communication:** Alerts go where teams already work (Slack, Teams) ' +
      '• **Automated ticketing:** Create incidents/tickets without manual work ' +
      '• **On-call paging:** Reliable paging via PagerDuty/Opsgenie ' +
      '• **ITSM workflows:** Integrate with existing processes (ServiceNow, Jira) ' +
      '• **Data export:** Send metrics to analytics platforms ' +
      '\n\n**After creation:** ' +
      '1. Use integration in escalation chains to send notifications ' +
      '2. Configure alert rules to route specific alerts to integration ' +
      '3. Test with sample alert before production use ' +
      '\n\n**Best practices:** ' +
      '• Test integration before adding to escalation chains ' +
      '• Use descriptive names (include team/purpose) ' +
      '• Secure credentials (API keys, passwords) ' +
      '• One integration per channel/destination ' +
      '• Document integration purpose ' +
      '\n\n**Related tools:** "list_integrations" (view all), "update_integration" (modify), "delete_integration" (remove), "create_escalation_chain" (use integration).',
    annotations: {
      title: 'Create integration',
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
    description: 'Update an existing third-party integration in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify integration name, credentials, configuration, or destination. Changes affect future notifications immediately. ' +
      '\n\n**When to use:** (1) Update API keys/credentials, (2) Change Slack/Teams channel, (3) Update ServiceNow/Jira configuration, (4) Modify webhook URL, (5) Rename integration. ' +
      '\n\n**Required parameters:** ' +
      '• integrationId: Integration ID (from "list_integrations") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '• name: New integration name ' +
      '• config: Updated configuration (API keys, URLs, channels, etc.) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update Slack channel:** ' +
      '{integrationId: 123, config: {webhookUrl: "https://hooks.slack.com/...", channel: "#critical-alerts"}} ' +
      '\n\n**Rotate API key (PagerDuty):** ' +
      '{integrationId: 123, config: {apiKey: "new-key-...", serviceKey: "..."}} ' +
      '\n\n**Update ServiceNow credentials:** ' +
      '{integrationId: 123, config: {instance: "company.service-now.com", username: "newuser", password: "newpass"}} ' +
      '\n\n**Change webhook URL:** ' +
      '{integrationId: 123, config: {url: "https://new-api.company.com/alerts"}} ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_integration" to see current configuration ' +
      '2. Update integration ' +
      '3. Test with sample notification ' +
      '\n\n**Related tools:** "get_integration" (review), "list_integrations" (find integration), "delete_integration" (remove).',
    annotations: {
      title: 'Update integration',
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
    description: 'Delete a third-party integration from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS NOTIFICATIONS** ' +
      '• Escalation chains using this integration stop sending notifications ' +
      '• No error shown - notifications silently fail ' +
      '• Cannot be undone ' +
      '\n\n**What this does:** Permanently removes integration. Escalation chains referencing this integration lose that notification path. ' +
      '\n\n**When to use:** (1) Integration no longer needed, (2) Platform decommissioned (stopped using Slack/ServiceNow), (3) Consolidating duplicate integrations, (4) Migration to different platform. ' +
      '\n\n**Required parameters:** ' +
      '• integrationId: Integration ID to delete (from "list_integrations") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Find all escalation chains using this integration ' +
      '2. Create replacement integration (if needed) ' +
      '3. Update all escalation chains to use replacement BEFORE deleting ' +
      '4. Verify no chains reference this integration ' +
      '\n\n**Impact of deletion:** ' +
      '• Escalation chain stages with this integration stop notifying ' +
      '• No error or warning - notifications silently fail ' +
      '• Active alerts may skip notification stages ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Use "list_escalation_chains" to find chains using this integration ' +
      '2. Create new integration (if replacing) ' +
      '3. Update all escalation chains to use new integration ' +
      '4. Verify updated ' +
      '5. Delete old integration ' +
      '\n\n**Best practice:** Migrate escalation chains to replacement integration BEFORE deleting to prevent notification gaps. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find usage), "create_integration" (replacement), "update_escalation_chain" (migrate).',
    annotations: {
      title: 'Delete integration',
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
    description: 'List available checkpoint locations for website monitoring in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of checkpoint locations with: id, name, geographic region, status, type (internal/external). ' +
      '\n\n**What are checkpoints:** Global testing locations from which LogicMonitor runs synthetic website checks. Think "test my website from New York, London, Tokyo" - checkpoints are those global vantage points. ' +
      '\n\n**When to use:** (1) Check available checkpoint locations before creating website monitors, (2) Verify geographic coverage for multi-region testing, (3) Select appropriate locations for SLA monitoring, (4) Plan website monitoring strategy. ' +
      '\n\n**Checkpoint types:** ' +
      '• **External (Cloud):** LogicMonitor-managed locations around the world (US-East, EU-West, Asia-Pacific, etc.) ' +
      '• **Internal (Collector-based):** Tests run from your own collectors (test internal apps, VPNs, private networks) ' +
      '\n\n**Common checkpoint locations:** ' +
      '• North America: US-East, US-West, US-Central, Canada ' +
      '• Europe: EU-West (Ireland), EU-Central (Frankfurt), UK ' +
      '• Asia-Pacific: Singapore, Sydney, Tokyo ' +
      '• South America: São Paulo ' +
      '\n\n**Use cases:** ' +
      '• **Global SLA monitoring:** Test from regions where customers are located ' +
      '• **CDN verification:** Ensure content delivery works worldwide ' +
      '• **Regional compliance:** Monitor from specific geographic locations ' +
      '• **Multi-region performance:** Compare response times across locations ' +
      '• **Failover testing:** Verify DR sites accessible from all regions ' +
      '\n\n**Best practices:** ' +
      '• Select checkpoints near your user base ' +
      '• Use multiple checkpoints for critical services (avoid false positives from single location issues) ' +
      '• Mix internal and external checkpoints for comprehensive coverage ' +
      '• Consider timezone differences for result interpretation ' +
      '\n\n**Workflow:** Use this tool to discover available locations, then use those checkpoint IDs when creating website monitors via "create_website". ' +
      '\n\n**Related tools:** "list_websites" (existing monitors), "create_website" (configure checkpoints), "get_website" (verify checkpoint configuration).',
    annotations: {
      title: 'List checkpoint locations',
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
    description: 'Get network topology information in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Network topology data with: resource/device relationships, network connections, parent-child hierarchies, Layer 2/Layer 3 connectivity maps. ' +
      '\n\n**What is topology:** Automatically discovered network relationship map showing how resource/device connect to each other. LogicMonitor uses SNMP, CDP (Cisco Discovery Protocol), LLDP (Link Layer Discovery Protocol), and other methods to build network topology maps. ' +
      '\n\n**When to use:** (1) Understand network architecture and resource/device relationships, (2) Visualize network connectivity, (3) Plan network changes, (4) Troubleshoot connectivity issues, (5) Document network infrastructure. ' +
      '\n\n**Topology information includes:** ' +
      '• **Physical connections:** Which resource/device are physically connected (switch ports, router interfaces) ' +
      '• **Logical relationships:** Parent-child relationships (gateway → firewall → switches → servers) ' +
      '• **Layer 2 topology:** MAC address tables, VLANs, switch port connections ' +
      '• **Layer 3 topology:** IP routing, subnets, default gateways ' +
      '\n\n**Use cases:** ' +
      '• **Network visualization:** See how your network is structured ' +
      '• **Impact analysis:** "If this switch fails, what resource/device lose connectivity?" ' +
      '• **Capacity planning:** Identify network bottlenecks and heavily-utilized links ' +
      '• **Documentation:** Auto-generated network diagrams ' +
      '• **Troubleshooting:** Trace connection paths between resource/device ' +
      '\n\n**How LogicMonitor discovers topology:** ' +
      '• CDP/LLDP: Cisco and other vendors broadcast neighbor information ' +
      '• SNMP: Query resource/device interface tables, ARP tables, routing tables ' +
      '• Traceroute: Active probing to discover paths ' +
      '• Parent/child relationships: Based on gateway configuration ' +
      '\n\n**Related tools:** "list_resources" (view resources/devices), "get_resource" (device details including connections).',
    annotations: {
      title: 'Get network topology',
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
    description: 'List available collector versions in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of collector versions with: version number, release date, stability level (GA/EA/RC), changelog summary, download size, platform support (Windows/Linux), mandatory/recommended flag. ' +
      '\n\n**What are collector versions:** Software releases for LogicMonitor collector agents. Collectors are installed on your infrastructure to gather monitoring data. Staying current ensures latest features, bug fixes, and security patches. ' +
      '\n\n**When to use:** (1) Check for collector updates, (2) Review changelog before upgrading, (3) Find specific version for rollback, (4) Verify platform compatibility, (5) Plan maintenance windows for collector upgrades. ' +
      '\n\n**Version types:** ' +
      '• **GA (Generally Available):** Production-ready, stable, recommended ' +
      '• **EA (Early Adopter):** Beta, new features, use in non-production first ' +
      '• **RC (Release Candidate):** Pre-GA testing version ' +
      '• **Mandatory:** Critical security/bug fixes, upgrade required ' +
      '\n\n**Collector update workflow:** ' +
      '1. Use this tool to check available versions ' +
      '2. Review changelog for breaking changes ' +
      '3. Test new version on non-production collector first ' +
      '4. Use "get_collector" to check current version on your collectors ' +
      '5. Update collectors via LogicMonitor UI or API ' +
      '6. Monitor collector health after upgrade ' +
      '\n\n**Version numbering:** Format is typically X.Y.Z (e.g., 34.100.0) where: ' +
      '• X = Major release (significant changes) ' +
      '• Y = Minor release (features, improvements) ' +
      '• Z = Patch release (bug fixes) ' +
      '\n\n**Best practices:** ' +
      '• Keep collectors within 2-3 versions of latest GA release ' +
      '• Subscribe to release notifications for critical updates ' +
      '• Test EA versions in lab before production ' +
      '• Upgrade during maintenance windows (may briefly interrupt monitoring) ' +
      '• Stagger upgrades (don\'t upgrade all collectors simultaneously) ' +
      '\n\n**Common scenarios:** ' +
      '• "Check if newer version available" → Compare latest version to your collectors ' +
      '• "Plan upgrade" → Review changelog, schedule maintenance ' +
      '• "Rollback needed" → Find previous stable version ' +
      '• "Platform migration" → Verify version supports new OS ' +
      '\n\n**Related tools:** "get_collector" (check current version on collector), "list_collectors" (find collectors to upgrade).',
    annotations: {
      title: 'List collector versions',
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
