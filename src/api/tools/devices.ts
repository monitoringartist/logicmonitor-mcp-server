import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const devicesTools: Tool[] = [
  // Device Management Tools
  {
    name: 'list_resources',
    description: 'List all monitored resources/devices in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of resource/device with: id, displayName, name (IP/hostname), hostStatus (dead/alive/unknown), preferredCollectorId, deviceType, custom properties, group memberships. ' +
      '\n\n**When to use:** ' +
      '\n- Get inventory of all monitored resources/devices' +
      '\n- Find specific resource/device by name/IP/property' +
      '\n- Check resource/device health status' +
      '\n- Get resource/device IDs for other operations' +
      '\n\n**Two search modes:** ' +
      '\n- **Simple search:** Use query parameter with free text (e.g., query:"production", query:"web-server") - automatically searches displayName, description, and name fields' +
      '\n- **Advanced filtering:** Use filter parameter with LM filter syntax (e.g., filter:"hostStatus:alive,displayName~\\*web\\*") for precise control' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"displayName\\~\\*prod\\*" (wildcard search) ' +
      '\n- By status: filter:"hostStatus:alive" or filter:"hostStatus:dead" ' +
      '\n- By type: filter:"systemProperties.name:system.devicetype,value:server" ' +
      '\n- By custom property: filter:"customProperties.name:company.team,customProperties.value:teamA" ' +
      '\n- By collector: filter:"preferredCollectorId:123" ' +
      '\n- Multiple conditions: filter:"hostStatus:alive,displayName\\~\\*web\\*" (comma = AND) ' +
      '\n\n**Query vs Filter:** ' +
      '\n- query: Simplified search across displayName, description, name (OR logic). Use for quick lookups: query:"prod-web-01"' +
      '\n- filter: Precise LM filter syntax with any field. Use for complex conditions: filter:"hostStatus:alive,displayName~\\*prod\\*"' +
      '\n- If both provided, query is converted to filter and combined with provided filter using AND logic' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Performance tips:** Use autoPaginate:false for large environments (>1000 resources/devices) and paginate manually to avoid timeouts. ' +
      '\n\n**Related tools:** "get_resource" (details), "generate_resource_link" (get UI link).',
    annotations: {
      title: 'List monitored resources/devices',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Simple search query. Free text (e.g., "production", "web-server", "192.168.1.100") automatically searches across displayName, description, and name fields. Can also use filter syntax (e.g., "hostStatus:alive") which gets formatted automatically.',
        },
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
      '\n\n**When to use:** ' +
      '\n- Get full details after finding resource/device ID via "list_resources"' +
      '\n- Check resource/device configuration' +
      '\n- Verify collector assignment' +
      '\n- Review custom properties before updating' +
      '\n\n**Workflow:** Use "list_resources" or "search_resources" first to find the deviceId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_resource_datasources" (see what\'s monitored), "list_resource_properties" (view all properties), "generate_resource_link" (get UI link).',
    annotations: {
      title: 'Get resource/device details',
      readOnlyHint: true,
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
    description: 'Add a new resource/device or multiple resources/devices to LogicMonitor (LM) monitoring. ' +
      '\n\n**Two modes: Single resource/device OR Batch creation** ' +
      '\n\n**Single resource/device mode (most common):** ' +
      '\n- Required: displayName (friendly name), name (IP/hostname), preferredCollectorId (from "list_collectors")' +
      '\n- Optional: hostGroupIds (folder location), description, disableAlerting, customProperties' +
      '\n- Example: Add "prod-web-01" at 192.168.1.100 to Production folder monitored by collector 5' +
      '\n\n**Batch mode (for multiple resources/devices):** ' +
      '\n- Provide resource/device array, each with displayName, name, preferredCollectorId' +
      '\n- Use batchOptions: {maxConcurrent: 5, continueOnError: true}' +
      '\n- Processes up to 5 resource/device simultaneously' +
      '\n- If one fails, others continue (when continueOnError:true)' +
      '\n\n**When to use:** ' +
      '\n- Add new servers/resources/devices to monitoring' +
      '\n- Onboard cloud instances' +
      '\n- Bulk import from CMDB/inventory' +
      '\n- Auto-discovery integration' +
      '\n\n**Before creating:** ' +
      '\n- Use "list_collectors" to find available collectorId (must be alive/healthy)' +
      '\n- Use "list_resource_groups" to find hostGroupIds for folder placement' +
      '\n- Verify IP/hostname is reachable from collector' +
      '\n\n**Custom properties examples:** ' +
      '\n- Environment: {name: "env", value: "production"}' +
      '\n- Owner: {name: "owner", value: "platform-team"}' +
      '\n- Credentials: {name: "ssh.user", value: "monitoring"} (for authentication)' +
      '\n\n**Performance tip:** For >50 resources/devices, use batch mode to avoid rate limits. ' +
      '\n\n**After creation:** Use "list_resources" to verify resource/device was added, check hostStatus. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_resource_groups" (find folder), "update_resource" (modify), "generate_resource_link" (get URL).',
    annotations: {
      title: 'Add resource/device(s)',
      readOnlyHint: false,
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
      '\n- Required: deviceId (from "list_resources" or "search_resources")' +
      '\n- Optional: displayName, description, disableAlerting, preferredCollectorId, customProperties' +
      '\n- opType: "replace" (default) overwrites all, "add" merges with existing' +
      '\n\n**Batch mode:** ' +
      '\n- Provide resource/device array, each must include deviceId' +
      '\n- Use batchOptions for concurrent processing' +
      '\n\n**When to use:** ' +
      '\n- Change resource/device name/description' +
      '\n- Move to different collector' +
      '\n- Enable/disable alerting' +
      '\n- Update custom properties' +
      '\n- Bulk modifications' +
      '\n\n**Common update scenarios:** ' +
      '\n- Rename device: {deviceId: 123, displayName: "new-prod-web-01"}' +
      '\n- Disable alerts during migration: {deviceId: 123, disableAlerting: true}' +
      '\n- Move to new collector: {deviceId: 123, preferredCollectorId: 5}' +
      '\n- Update property: {deviceId: 123, customProperties: [{name: "env", value: "staging"}]}' +
      '\n\n**opType explained:** ' +
      '\n- "replace": Overwrites entire field (careful with customProperties!)' +
      '\n- "add": Merges/appends to existing values (safer for properties)' +
      '\n\n**Workflow:** First find deviceId using "list_resources" or "search_resources", then update. ' +
      '\n\n**Related tools:** "list_resources" (find device), "get_resource" (verify before update), "update_resource_property" (simpler property updates).',
    annotations: {
      title: 'Update resource/device(s)',
      readOnlyHint: false,
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
    description: 'Remove a resource/device or multiple resources/devices from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: DESTRUCTIVE OPERATION** ' +
      '\n- This permanently removes the resource/device from monitoring' +
      '\n- All historical data will be deleted' +
      '\n- All alerts for this resource/device will be cleared' +
      '\n- This action CANNOT be undone' +
      '\n\n**Two modes: Single resource/device OR Batch deletion** ' +
      '\n\n**Single resource/device mode:** ' +
      '\n- Required: deviceId (from "list_resources")' +
      '\n- Optional: deleteFromSystem (true = complete removal including history)' +
      '\n\n**Batch mode:** ' +
      '\n- Provide deviceIds array [123, 456, 789]' +
      '\n- Use batchOptions for concurrent processing' +
      '\n\n**When to use:** ' +
      '\n- Decommissioned servers' +
      '\n- Deleted cloud instances' +
      '\n- Cleanup after migrations' +
      '\n- Remove duplicate entries' +
      '\n- Bulk decommissioning' +
      '\n\n**⚠️ CONSIDER ALTERNATIVES FIRST:** ' +
      '\n- Need temporary suppression? Use "create_resource_sdt" instead (reversible!)' +
      '\n- Need to stop monitoring but keep history? Use "update_resource" with disableAlerting:true' +
      '\n- Moving to different collector? Use "update_resource" to change collector' +
      '\n\n**Best practice workflow:** ' +
      '\n- Use "get_resource" to verify you have correct resource/device' +
      '\n- Consider if SDT or disableAlerting is better option' +
      '\n- If deletion necessary, delete resource/device' +
      '\n- No verification step possible (irreversible)' +
      '\n\n**Batch deletion tip:** For >50 resources/devices, use batch mode with continueOnError:true to handle any failures gracefully. ' +
      '\n\n**Related tools:** "create_resource_sdt" (temporary alternative), "update_resource" (disable without deleting), "list_resources" (find resource/device to delete).',
    annotations: {
      title: 'Delete resource/device(s)',
      readOnlyHint: false,
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

  // Device Property Tools
  {
    name: 'list_resource_properties',
    description: 'List all custom properties (system and user-defined) for a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of properties with: name, value, source (device-level vs inherited from group), type (system vs custom). ' +
      '\n\n**When to use:** ' +
      '\n- Review resource/device configuration' +
      '\n- Check credentials/authentication settings' +
      '\n- See inherited vs device-specific properties' +
      '\n- Troubleshoot datasource applies logic' +
      '\n- Audit resource/device metadata' +
      '\n\n**Property types:** ' +
      '\n\n**System properties (auto-populated by LogicMonitor):** ' +
      '\n- system.hostname: Device hostname' +
      '\n- system.devicetype: Device category (server, network, cloud)' +
      '\n- system.ips: IP addresses' +
      '\n- system.categories: Auto-detected technologies (e.g., "AWS/EC2")' +
      '\n\n**Custom properties (user-defined):** ' +
      '\n- Credentials: ssh.user, snmp.community, wmi.user' +
      '\n- Tags: env (prod/staging), owner (team name), location' +
      '\n- Integration IDs: servicenow.ci_id, jira.project' +
      '\n- Business metadata: cost.center, sla.tier, backup.policy' +
      '\n\n**Property inheritance:** ' +
      'Properties can be set at: Device level (highest priority) → Group level → Parent group (inherited). ' +
      '\n\n**Datasource appliesTo logic uses properties:** ' +
      'Many datasources check properties to decide if they should monitor device. Example: AWS_EC2 datasource checks if resource/device has "aws.resourcetype=ec2" property. ' +
      '\n\n**Workflow:** Use "list_resources" to find deviceId, then use this tool to see all properties including inherited ones. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "update_device_property" (modify), "get_resource" (see summary), "list_datasources" (see how properties affect monitoring).',
    annotations: {
      title: 'List resource/device properties',
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
    name: 'update_resource_property',
    description: 'Update or create a custom property for a specific resource/device in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Set/update a single resource/device-level custom property. Simpler alternative to "update_resource" when only changing one property. ' +
      '\n\n**When to use:** ' +
      '\n- Update single property value' +
      '\n- Add new property to device' +
      '\n- Override inherited property value' +
      '\n- Update credentials for one resource/device' +
      '\n- Change resource/device tags/metadata' +
      '\n\n**Required parameters:** ' +
      '\n- deviceId: Device ID (from "list_resources")' +
      '\n- name: Property name (e.g., "ssh.user", "env", "owner")' +
      '\n- value: Property value' +
      '\n\n**Property types and examples:** ' +
      '\n\n**Credentials (override group defaults):** ' +
      '\n- SSH: name="ssh.user", value="admin"' +
      '\n- SNMP: name="snmp.community", value="public"' +
      '\n- WMI: name="wmi.user", value="DOMAIN\\\\monitoring"' +
      '\n- Database: name="jdbc.user", value="dbmonitor"' +
      '\n\n**Tags and metadata:** ' +
      '\n- Environment: name="env", value="production"' +
      '\n- Owner: name="owner", value="platform-team"' +
      '\n- Cost center: name="cost.center", value="engineering"' +
      '\n- Application: name="app", value="web-frontend"' +
      '\n\n**Integration IDs:** ' +
      '\n- ServiceNow: name="servicenow.ci_id", value="ci12345"' +
      '\n- JIRA: name="jira.project", value="INFRA"' +
      '\n- CMDB: name="cmdb.id", value="server-001"' +
      '\n\n**Datasource-specific settings:** ' +
      '\n- Custom threshold: name="threshold.cpu", value="90"' +
      '\n- Collection interval: name="poll.interval", value="5"' +
      '\n- Monitoring scope: name="monitor.ports", value="80,443"' +
      '\n\n**Device-level vs Group-level:** ' +
      '\n- **Device property** (this tool): Applies only to this resource/device, overrides group property' +
      '\n- **Group property** (update_resource_group): Inherited by all resource/device in group' +
      '\n- Device properties take precedence over group properties' +
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

  // Unmonitored devices
  {
    name: 'list_unmonitored_devices',
    description: 'List unmonitored devices discovered by LogicMonitor (LM) collectors but not yet added to monitoring.',
    annotations: { title: 'List unmonitored devices', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { ...paginationSchema, ...filterSchema, ...fieldsSchema },
      additionalProperties: false,
    },
  },

];
