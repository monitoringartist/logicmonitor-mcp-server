import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema, clearedSchema } from './common.js';

export const deviceGroupsTools: Tool[] = [
  // Device Group Tools
  {
    name: 'list_resource_groups',
    description: 'List all resource/device groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of groups with: id, name, parentId, full path, description, number of resources/devices, number of subgroups, custom properties. ' +
      '\n\n**What are groups:** Organizational folders for resources/devices, like directories in a file system. Used to organize by location, environment, customer, or any logical structure. ' +
      '\n\n**When to use:** ' +
      '\n- Browse resource/device organization' +
      '\n- Find group IDs for resource/device creation/assignment' +
      '\n- Understand resource/device hierarchy' +
      '\n- Get group IDs for group-level operations (properties, SDT)' +
      '\n\n**Common use cases:** ' +
      '\n- Geographic: "US-West", "EU-Central", "APAC"' +
      '\n- Environment: "Production", "Staging", "Development"' +
      '\n- Customer: "Customer-A", "Customer-B" (for MSPs)' +
      '\n- Function: "Web Servers", "Database Servers", "Network resources/Devices"' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"name\\~\\*Production\\*"' +
      '\n- Root groups: filter:"parentId:1"' +
      '\n- Non-empty: filter:"numOfDirectDevices>0"' +
      '\n\n**Groups inherit properties:** Custom properties set on group are inherited by all resource/device in that group (useful for credentials, location tags). ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_resource\\_group" (details), "create\\_resource\\_group" (create new), "list\\_resource\\_group\\_properties" (group properties).',
    annotations: {
      title: 'List resource/device groups',
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
    name: 'get_resource_group',
    description: 'Get detailed information about a specific resource/device group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete group details: name, full path, parentId, description, custom properties, number of resource/device (direct and total), number of subgroups, alert status, SDT status. ' +
      '\n\n**When to use:** ' +
      '\n- Get group path for documentation' +
      '\n- Review inherited properties' +
      '\n- Check group membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Get group details before creating resource/device in it' +
      '\n\n**Key information:** ' +
      '\n- fullPath: Complete hierarchy (e.g., "/Production/Web Servers/US-East")' +
      '\n- customProperties: Properties inherited by all resource/device in group' +
      '\n- numOfDirectDevices: resources/Devices directly in this group' +
      '\n- numOfHosts: Total resource/device including subgroups' +
      '\n- alertStatus: Rollup alert status for entire group' +
      '\n\n**Custom properties inheritance:** ' +
      'Properties set on group are inherited by ALL resource/device in group. Common uses: ' +
      '\n- Credentials: {name: "ssh.user", value: "monitoring"}' +
      '\n- Environment tags: {name: "env", value: "production"}' +
      '\n- Owner: {name: "team", value: "platform-engineering"}' +
      '\n\n**Workflow:** Use "list\\_resource\\_groups" to find groupId, then use this tool for complete details including inherited properties. ' +
      '\n\n**Related tools:** "list\\_resource\\_groups" (find groups), "create\\_resource\\_group" (create new), "list\\_resources" (devices in group).',
    annotations: {
      title: 'Get resource/device group details',
      readOnlyHint: true,
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
      '\n\n**When to use:** ' +
      '\n- Set up organizational structure before adding resources/devices' +
      '\n- Create folders for different teams/applications' +
      '\n- Establish hierarchy for multi-tenant environments' +
      '\n- Organize resource/device by location/datacenter' +
      '\n\n**Required parameters:** ' +
      '\n- name: Group name (e.g., "Production", "US-East", "Customer-A")' +
      '\n\n**Optional parameters:** ' +
      '\n- parentId: Parent group ID (0 = root, or use existing group ID for nesting)' +
      '\n- description: Group purpose/notes' +
      '\n- customProperties: Properties inherited by all resource/device in group (credentials, tags)' +
      '\n- appliesTo: Dynamic membership query (auto-add resource/device matching criteria)' +
      '\n\n**Common organizational patterns:** ' +
      '\n\n**By environment:** ' +
      '\n- /Production (parentId: 0)' +
      '\n- /Staging (parentId: 0)' +
      '\n- /Development (parentId: 0)' +
      '\n\n**By location:** ' +
      '\n- /Datacenters (parentId: 0)' +
      '\n  - /Datacenters/US-East (parentId: Datacenters ID)' +
      '\n  - /Datacenters/EU-West (parentId: Datacenters ID)' +
      '\n\n**By function:** ' +
      '\n- /Infrastructure (parentId: 0)' +
      '\n  - /Infrastructure/Web Servers' +
      '\n  - /Infrastructure/Database Servers' +
      '\n  - /Infrastructure/Network resources/Devices' +
      '\n\n**By customer (MSP):** ' +
      '\n- /Customer-A (parentId: 0)' +
      '\n- /Customer-B (parentId: 0)' +
      '\n\n**Custom properties for groups:** ' +
      'Properties set on group are automatically inherited by all resources/devices: ' +
      '\n- Credentials: {name: "ssh.user", value: "monitoring"}' +
      '\n- Environment tag: {name: "env", value: "production"}' +
      '\n- Owner: {name: "team", value: "platform"}' +
      '\n\n**Dynamic groups (appliesTo):** ' +
      'Auto-add resource/device matching criteria: ' +
      '\n- appliesTo: "isWindows()" - All Windows resource/device' +
      '\n- appliesTo: "system.hostname =\\~ \\"\\*prod\\*\\"" - Hostnames containing "prod"' +
      '\n- appliesTo: "hasCategory(\\"AWS/EC2\\")" - All AWS EC2 instances' +
      '\n\n**Workflow:** Create group hierarchy first, then add resource/device to groups via "create\\_resource" or move existing resource/device via "update\\_resource". ' +
      '\n\n**Related tools:** "list\\_resource\\_groups" (browse hierarchy), "update\\_resource\\_group" (modify), "delete\\_resource\\_group" (remove empty groups).',
    annotations: {
      title: 'Create resource/device group',
      readOnlyHint: false,
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
      '\n\n**When to use:** ' +
      '\n- Rename group' +
      '\n- Update description' +
      '\n- Change/add custom properties (affects all resources/devices)' +
      '\n- Modify dynamic membership (appliesTo)' +
      '\n- Move group to different parent' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Group ID to update (from "list\\_resource\\_groups")' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New group name' +
      '\n- description: New description' +
      '\n- parentId: Move to different parent group' +
      '\n- customProperties: Update inherited properties (affects all resources/devices!)' +
      '\n- appliesTo: Change dynamic membership query' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename group:** ' +
      '{groupId: 123, name: "Production-US-East"}' +
      '\n\n**Add credentials to all resource/device in group:** ' +
      '{groupId: 123, customProperties: [{name: "ssh.user", value: "monitoring"}]}' +
      '\n\n**Update environment tag:** ' +
      '{groupId: 123, customProperties: [{name: "env", value: "production"}]}' +
      '\n\n**Move group to different parent:** ' +
      '{groupId: 123, parentId: 456} // Moves group under new parent' +
      '\n\n**Update dynamic membership:** ' +
      '{groupId: 123, appliesTo: "system.hostname =\\~ \\"\\*prod\\*\\""}' +
      '\n\n**⚠️ Important notes:** ' +
      '\n- Updating customProperties affects ALL resource/device in group (including subgroups)' +
      '\n- Devices inherit properties - changes propagate immediately' +
      '\n- Moving group (changing parentId) moves all resource/device and subgroups with it' +
      '\n- Changing appliesTo can cause resource/device to auto-add or auto-remove' +
      '\n\n**Best practice:** Use "get\\_resource\\_group" first to review current configuration and see which resource/device will be affected. ' +
      '\n\n**Workflow:** Use "list\\_resource\\_groups" to find groupId, review with "get\\_resource\\_group", then update. ' +
      '\n\n**Related tools:** "get\\_resource\\_group" (review before update), "list\\_resources" (see affected resources/devices), "list\\_resource\\_groups" (find group).',
    annotations: {
      title: 'Update resource/device group',
      readOnlyHint: false,
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
      '\n- Deleting group does NOT delete resource/device - resource/device are moved to parent group or root' +
      '\n- Subgroups are also deleted (recursive)' +
      '\n- resources/Devices lose inherited custom properties from this group' +
      '\n- Cannot delete groups with subgroups or resource/device (must be empty)' +
      '\n\n**What this does:** Removes organizational folder from hierarchy. resources/Devices and subgroups must be moved/deleted first before deleting group. ' +
      '\n\n**When to use:** ' +
      '\n- Clean up unused organizational folders' +
      '\n- Restructure group hierarchy' +
      '\n- Remove temporary groupings' +
      '\n- Consolidate duplicate groups' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Group ID to delete (from "list\\_resource\\_groups")' +
      '\n\n**Optional parameters:** ' +
      '\n- deleteHardFlag: true = delete even if has resource/device (moves resource/device to root), false = fail if not empty (safer, default)' +
      '\n\n**Before deleting - check:** ' +
      '\n- Use "get\\_resource\\_group" to see how many resource/device and subgroups' +
      '\n- Use "list\\_resources" with filter to see which resource/device are in group' +
      '\n- Move resource/device to another group via "update\\_resource" if needed' +
      '\n- Delete or move subgroups first' +
      '\n\n**Common workflow for cleanup:** ' +
      '\n\n**Safe deletion (empty group only):** ' +
      '\n- Check group: get_resource_group(groupId: 123)' +
      '\n- If numOfHosts = 0 and no subgroups: delete_resource_group(groupId: 123)' +
      '\n- If has resources/devices: Move resource/device first, then delete group' +
      '\n\n**Force deletion (moves resources/devices):** ' +
      '\n- delete_resource_group(groupId: 123, deleteHardFlag: true)' +
      '\n- resources/Devices move to parent group (or root if no parent)' +
      '\n- resources/Devices lose inherited custom properties from deleted group' +
      '\n\n**⚠️ Impact of deletion:** ' +
      '\n- resources/Devices lose custom properties inherited from this group (credentials, tags)' +
      '\n- Alert rules filtering by group path may break' +
      '\n- Dashboards filtering by group may show no data' +
      '\n- Reports scoped to this group need updating' +
      '\n\n**Best practice:** Move resource/device to new group before deleting old group to avoid losing custom properties. ' +
      '\n\n**Workflow:** Use "get\\_resource\\_group" to verify empty, then delete. Or move resource/device first via "update\\_resource". ' +
      '\n\n**Related tools:** "get\\_resource\\_group" (check before delete), "list\\_resources" (find resource/device in group), "update\\_resource" (move resource/device first).',
    annotations: {
      title: 'Delete resource/device group',
      readOnlyHint: false,
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

  // Device Group Properties
  {
    name: 'list_resource_group_properties',
    description: 'List all custom properties for a specific resource/device group in LogicMonitor (LM) monitoring. Properties set at group level are inherited by all resource/device in the group. ' +
      '\n\n**Returns:** Array of properties with: name, value, type (custom vs system), and inheritance source. ' +
      '\n\n**When to use:**' +
      '\n- Review properties before bulk updates' +
      '\n- Audit credentials/settings applied to resource/device group' +
      '\n- Verify property inheritance from parent groups' +
      '\n- Check which properties resource/device will inherit when added to group' +
      '\n- Document group configuration' +
      '\n' +
      '\n\n**What are group properties:** Key-value pairs set at group level that ALL resource/device in the group inherit. Common uses: credentials (SSH/SNMP), environment tags, owner/team info, monitoring settings. ' +
      '\n\n**Property inheritance:** ' +
      '\n- Properties set on group apply to ALL resource/device in group ' +
      '\n- Child groups inherit from parent groups ' +
      '\n- Device-level properties override group properties ' +
      '\n- Used by datasource "appliesTo" logic and authentication ' +
      '\n\n**Common group properties:** ' +
      '\n- **Credentials:** ssh.user, ssh.pass, snmp.community, wmi.user, wmi.pass ' +
      '\n- **Tags:** env (production/staging), location (datacenter), owner (team name) ' +
      '\n- **Business metadata:** cost.center, sla.tier, compliance.level ' +
      '\n- **Monitoring config:** polling.interval, alert.threshold.multiplier ' +
      '\n\n**Use cases:** ' +
      '\n- Audit credentials: Check which credentials are configured for group ' +
      '\n- Before bulk update: See current values before changing ' +
      '\n- Troubleshoot authentication: Verify credentials applied to resource/device ' +
      '\n- Document configuration: Export group settings ' +
      '\n\n**Workflow:** Use "list\\_resource\\_groups" to find groupId, then use this tool to see properties, then "update\\_device\\_group\\_property" to modify. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "update\\_device\\_group\\_property" (modify property), "get\\_resource\\_group" (group details), "list\\_device\\_properties" (device-level properties).',
    annotations: {
      title: 'List resource/device group properties',
      readOnlyHint: true,
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
      '\n\n**When to use:**' +
      '\n- Update credentials for all resource/device in group' +
      '\n- Change environment tags' +
      '\n- Update owner/team information' +
      '\n- Modify monitoring settings' +
      '\n- Bulk property updates' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Device group ID (from "list\\_resource\\_groups") ' +
      '\n- name: Property name (e.g., "ssh.user", "env", "owner") ' +
      '\n- value: New property value ' +
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
      '\n- All resource/device in group inherit updated property ' +
      '\n- resources/Devices with device-level override keep their value (device wins) ' +
      '\n- Subgroup resource/device also inherit unless overridden ' +
      '\n- Credential changes affect monitoring immediately ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "list\\_device\\_group\\_properties" to see current properties ' +
      '2. Update property value ' +
      '3. Changes propagate to all member resource/device immediately ' +
      '4. Test monitoring still works (especially for credential changes) ' +
      '\n\n**Related tools:** "list\\_device\\_group\\_properties" (view all), "list\\_device\\_properties" (device-level view), "get\\_resource\\_group" (group details).',
    annotations: {
      title: 'Update resource/device group property',
      readOnlyHint: false,
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
  {
    name: 'create_resource_group_property',
    description: 'Add a custom property to a resource/device group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a new group-level property that is inherited by all resources/devices in the group (unless overridden at a lower level). ' +
      '\n\n**Related tools:** "update\\_resource\\_group\\_property" (modify existing), "delete\\_resource\\_group\\_property" (remove), "list\\_resource\\_group\\_properties" (view all).',
    annotations: { title: 'Create resource/device group property', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        name: { type: 'string', description: 'The property name (e.g., "ssh.user", "env").' },
        value: { type: 'string', description: 'The property value.' },
      },
      additionalProperties: false,
      required: ['groupId', 'name', 'value'],
    },
  },
  {
    name: 'delete_resource_group_property',
    description: 'Delete a custom property from a resource/device group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "update\\_resource\\_group\\_property", "create\\_resource\\_group\\_property", "list\\_resource\\_group\\_properties".',
    annotations: { title: 'Delete resource/device group property', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        propertyName: { type: 'string', description: 'The name of the property to delete.' },
      },
      additionalProperties: false,
      required: ['groupId', 'propertyName'],
    },
  },

  // Device Group - Cluster Alert Configurations
  {
    name: 'list_resource_group_cluster_alert_confs',
    description: 'List cluster alert configurations for a resource/device group in LogicMonitor (LM). ' +
      '\n\n**What this does:** Cluster alerts trigger when a threshold number of instances across the group meet a condition (e.g., "more than 5 servers down"). ' +
      '\n\n**Related tools:** "get\\_resource\\_group\\_cluster\\_alert\\_conf", "create\\_resource\\_group\\_cluster\\_alert\\_conf".',
    annotations: { title: 'List resource/device group cluster alert configs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'get_resource_group_cluster_alert_conf',
    description: 'Get a specific cluster alert configuration for a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'Get resource/device group cluster alert config', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        id: { type: 'number', description: 'The cluster alert configuration ID' },
      },
      additionalProperties: false,
      required: ['groupId', 'id'],
    },
  },
  {
    name: 'create_resource_group_cluster_alert_conf',
    description: 'Create a cluster alert configuration for a resource/device group in LogicMonitor (LM). Provide attributes via "config".',
    annotations: { title: 'Create resource/device group cluster alert config', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        config: { type: 'object', additionalProperties: true, description: 'Cluster alert config attributes (name, dataSourceId, alertExpr, etc.).' },
      },
      additionalProperties: false,
      required: ['groupId', 'config'],
    },
  },
  {
    name: 'update_resource_group_cluster_alert_conf',
    description: 'Update a cluster alert configuration for a resource/device group in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update resource/device group cluster alert config', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        id: { type: 'number', description: 'The cluster alert configuration ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['groupId', 'id', 'config'],
    },
  },
  {
    name: 'delete_resource_group_cluster_alert_conf',
    description: 'Delete a cluster alert configuration from a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'Delete resource/device group cluster alert config', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        id: { type: 'number', description: 'The cluster alert configuration ID' },
      },
      additionalProperties: false,
      required: ['groupId', 'id'],
    },
  },

  // Device Group - DataSources
  {
    name: 'list_resource_group_datasources',
    description: 'List the datasources applied to a resource/device group in LogicMonitor (LM). ' +
      '\n\n**Related tools:** "get\\_resource\\_group\\_datasource", "update\\_resource\\_group\\_datasource", "get\\_resource\\_group\\_datasource\\_alert\\_setting".',
    annotations: { title: 'List resource/device group datasources', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        includeDisabledDataSourceWithoutInstance: { type: 'boolean', description: 'Include disabled datasources that have no instances.' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'get_resource_group_datasource',
    description: 'Get a specific datasource applied to a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'Get resource/device group datasource', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        id: { type: 'number', description: 'The group datasource ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId', 'id'],
    },
  },
  {
    name: 'update_resource_group_datasource',
    description: 'Update a datasource applied to a resource/device group in LogicMonitor (LM) (e.g., monitoring/collection settings). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update resource/device group datasource', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        id: { type: 'number', description: 'The group datasource ID' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update.' },
      },
      additionalProperties: false,
      required: ['groupId', 'id', 'config'],
    },
  },

  // Device Group - DataSource Alert Settings
  {
    name: 'get_resource_group_datasource_alert_setting',
    description: 'Get the alert settings (thresholds) for a datasource on a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'Get resource/device group datasource alert setting', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        dsId: { type: 'number', description: 'The group datasource ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId', 'dsId'],
    },
  },
  {
    name: 'update_resource_group_datasource_alert_setting',
    description: 'Update the alert settings (thresholds) for a datasource on a resource/device group in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update resource/device group datasource alert setting', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        dsId: { type: 'number', description: 'The group datasource ID' },
        config: { type: 'object', additionalProperties: true, description: 'Alert setting fields to update (e.g., disableAlerting, datapoint thresholds).' },
      },
      additionalProperties: false,
      required: ['groupId', 'dsId', 'config'],
    },
  },

  // Device Group - Alerts / SDTs
  {
    name: 'list_resource_group_alerts',
    description: 'List alerts for all resources/devices in a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'List resource/device group alerts', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        needMessage: { type: 'boolean', description: 'Include the alert message body.' },
        customColumns: { type: 'string', description: 'Comma-separated custom columns to include.' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema, ...clearedSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'list_resource_group_sdts',
    description: 'List active/scheduled down times (SDTs) for a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'List resource/device group SDTs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'get_resource_group_sdt_history',
    description: 'Get the scheduled down time (SDT) history for a resource/device group in LogicMonitor (LM).',
    annotations: { title: 'Get resource/device group SDT history', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The resource/device group ID' },
        ...paginationSchema, ...filterSchema, ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

];
