import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const collectorsTools: Tool[] = [
  // Collector Tools
  {
    name: 'list_collectors',
    description: 'List all LogicMonitor (LM) monitoring collectors (monitoring agents). ' +
      '\n\n**Returns:** Array of collectors with: id, description (collector name), hostname, platform (Windows/Linux), status (alive/dead), build version, number of monitored resources/devices, last heartbeat time. ' +
      '\n\n**When to use:** ' +
      '\n- Check collector health status before adding resources/devices' +
      '\n- Find available collectors for new resource/device assignments' +
      '\n- Monitor collector capacity and load' +
      '\n- Identify offline/dead collectors' +
      '\n\n**What are collectors:** Lightweight agents installed on-premise or in cloud that collect metrics from resources/devices. Each resource/device must be assigned to one collector. ' +
      '\n\n**Common filter patterns:** ' +
      '\n- Alive collectors: filter:"status:alive"' +
      '\n- By platform: filter:"platform:Linux" or filter:"platform:Windows"' +
      '\n- By name: filter:"description\\~\\*prod\\*"' +
      '\n- Low capacity: filter:"numberOfHosts<100"' +
      '\n\n**Before creating resources/devices:** Use this tool to find collectorId for the "preferredCollectorId" parameter in "create_resource". ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_collector" (details), "list_collector_groups" (browse groups), "list_collector_versions" (check updates).',
    annotations: {
      title: 'List collectors',
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
    name: 'get_collector',
    description: 'Get detailed information about a specific collector by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete collector details: description (name), hostname, platform, status, build version, number of resource/device monitored, free disk space, CPU/memory usage, last heartbeat, configuration. ' +
      '\n\n**When to use:** ' +
      '\n- Check collector health before assigning resources/devices' +
      '\n- Verify collector capacity' +
      '\n- Troubleshoot connectivity issues' +
      '\n- Check version for updates' +
      '\n- Monitor collector performance' +
      '\n\n**Health indicators to check:** ' +
      '\n- status: "alive" (healthy) vs "dead" (offline/problem)' +
      '\n- numberOfHosts: How many resource/device this collector monitors (capacity planning)' +
      '\n- freeDiskSpace: Disk space available (needs GB for data buffering)' +
      '\n- build: Version number (compare with "list_collector_versions" for updates)' +
      '\n- lastHeartbeatTime: Recent = healthy, old = potential issue' +
      '\n\n**Workflow:** Use "list_collectors" to find collectorId, then use this tool for detailed health check. ' +
      '\n\n**Related tools:** "list_collectors" (find collector), "list_collector_versions" (check updates), "list_resources" (see assigned resources/devices).',
    annotations: {
      title: 'Get collector details',
      readOnlyHint: true,
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
  {
    name: 'create_collector',
    description: 'Create a new collector record in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Registers a new Collector in your LogicMonitor portal. This creates the Collector entry and (optionally) a Collector device; you still need to download and run the installer on the target host to bring it online. ' +
      '\n\n**Typical workflow:**' +
      '\n1. `create_collector` to register the Collector and obtain its `id`' +
      '\n2. `get_collector_installer` to obtain the installer download URL for the target OS/architecture' +
      '\n3. Install and run the Collector on the host' +
      '\n4. `get_collector` / `list_collectors` to verify it comes online' +
      '\n\n**Optional parameters:**' +
      '\n- description: The Collector\'s description/name' +
      '\n- collectorGroupId: The collector group to place it in (from "list_collector_groups")' +
      '\n- backupAgentId: ID of a backup Collector for failover' +
      '\n- escalatingChainId: Escalation chain ID for Collector-down alerts' +
      '\n- resendIval: Alert notification resend interval (minutes)' +
      '\n- suppressAlertClear: Suppress alert-clear notifications' +
      '\n- enableFailBack: Enable automatic failback' +
      '\n- specifiedCollectorDeviceGroupId: Device group for the auto-created Collector device' +
      '\n- needAutoCreateCollectorDevice: Whether to auto-create a Collector device' +
      '\n- config: An object with any additional Collector attributes (merged into the request body)' +
      '\n\n**Related tools:** "get_collector_installer" (download installer), "list_collector_groups" (find group), "update_collector", "delete_collector".',
    annotations: {
      title: 'Create collector',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'The Collector\'s description (name).',
        },
        collectorGroupId: {
          type: 'number',
          description: 'The ID of the collector group to place the Collector in.',
        },
        backupAgentId: {
          type: 'number',
          description: 'The ID of a backup Collector assigned for failover.',
        },
        escalatingChainId: {
          type: 'number',
          description: 'The ID of the escalation chain associated with this Collector.',
        },
        resendIval: {
          type: 'number',
          description: 'Interval, in minutes, after which Collector-down alert notifications are resent.',
        },
        suppressAlertClear: {
          type: 'boolean',
          description: 'Whether alert-clear notifications are suppressed for the Collector.',
        },
        enableFailBack: {
          type: 'boolean',
          description: 'Whether automatic failback is enabled for the Collector.',
        },
        specifiedCollectorDeviceGroupId: {
          type: 'number',
          description: 'The device group ID used when auto-creating the Collector device.',
        },
        needAutoCreateCollectorDevice: {
          type: 'boolean',
          description: 'Whether to auto-create a Collector device for this Collector.',
        },
        config: {
          type: 'object',
          description: 'Additional Collector attributes, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'update_collector',
    description: 'Update an existing collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies a Collector\'s settings such as description, collector group, backup Collector, escalation chain, failover/failback behavior, and alerting options. Uses a partial update (only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- collectorId: The ID of the Collector to update (from "list_collectors")' +
      '\n\n**Optional parameters (what to change):**' +
      '\n- description, collectorGroupId, backupAgentId, escalatingChainId, resendIval, suppressAlertClear, enableFailBack, specifiedCollectorDeviceGroupId, needAutoCreateCollectorDevice' +
      '\n- config: An object with any additional Collector attributes to update (merged into the body)' +
      '\n\n**Advanced options:**' +
      '\n- autoBalanceMonitoredDevices: Rebalance monitored devices across the Auto-Balanced Collector Group' +
      '\n- forceUpdateFailedOverDevices: Force update of failed-over devices' +
      '\n- opType: Operation type for how the update is applied (e.g., "refresh", "add", "replace")' +
      '\n\n**Best practice:** Call "get_collector" first to review current settings, then send only the fields you want to change. ' +
      '\n\n**Related tools:** "get_collector" (review before update), "list_collectors" (find Collector), "delete_collector".',
    annotations: {
      title: 'Update collector',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the collector to update.',
        },
        description: {
          type: 'string',
          description: 'New description (name) for the Collector.',
        },
        collectorGroupId: {
          type: 'number',
          description: 'Move the Collector to a different collector group by ID.',
        },
        backupAgentId: {
          type: 'number',
          description: 'The ID of a backup Collector assigned for failover.',
        },
        escalatingChainId: {
          type: 'number',
          description: 'The ID of the escalation chain associated with this Collector.',
        },
        resendIval: {
          type: 'number',
          description: 'Interval, in minutes, after which Collector-down alert notifications are resent.',
        },
        suppressAlertClear: {
          type: 'boolean',
          description: 'Whether alert-clear notifications are suppressed for the Collector.',
        },
        enableFailBack: {
          type: 'boolean',
          description: 'Whether automatic failback is enabled for the Collector.',
        },
        specifiedCollectorDeviceGroupId: {
          type: 'number',
          description: 'The device group ID used when auto-creating the Collector device.',
        },
        needAutoCreateCollectorDevice: {
          type: 'boolean',
          description: 'Whether to auto-create a Collector device for this Collector.',
        },
        autoBalanceMonitoredDevices: {
          type: 'boolean',
          description: 'Rebalance monitored devices across the Auto-Balanced Collector Group.',
        },
        forceUpdateFailedOverDevices: {
          type: 'boolean',
          description: 'Force update of failed-over devices.',
        },
        opType: {
          type: 'string',
          description: 'Operation type controlling how the update is applied (e.g., "refresh", "add", "replace").',
        },
        config: {
          type: 'object',
          description: 'Additional Collector attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },
  {
    name: 'delete_collector',
    description: 'Delete a collector from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION**' +
      '\n- The Collector record is permanently removed from LogicMonitor' +
      '\n- Resources/devices monitored by this Collector will stop being monitored unless reassigned or covered by failover' +
      '\n- Cannot be undone' +
      '\n\n**What this does:** Removes the Collector registration from your portal. The Collector should ideally be uninstalled from the host as well. ' +
      '\n\n**Required parameters:**' +
      '\n- collectorId: The ID of the Collector to delete (from "list_collectors")' +
      '\n\n**Before deleting:**' +
      '\n- Use "get_collector" to verify it is the correct Collector and check `numberOfHosts`' +
      '\n- Reassign monitored resources/devices to another Collector if needed' +
      '\n- Ensure a backup/failover Collector is available for critical monitoring' +
      '\n\n**Related tools:** "get_collector" (verify before delete), "list_collectors" (find Collector), "update_collector" (reconfigure instead of delete).',
    annotations: {
      title: 'Delete collector',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the collector to delete.',
        },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },
  {
    name: 'get_collector_installer',
    description: 'Get the installer download URL for a collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** An object with the authenticated installer download `url` (including query parameters), the target `osAndArch`, ready-to-run `downloadInstructions` (a curl command), and a `note`. ' +
      '\n\n**⚠️ Important:** The installer is a large binary file. This tool intentionally returns the download URL rather than the binary itself. ' +
      'The URL requires your LogicMonitor bearer token in the `Authorization` header, so download it with the provided curl command (not a browser). ' +
      '\n\n**Required parameters:**' +
      '\n- collectorId: The ID of the Collector to install (from "create_collector" or "list_collectors")' +
      '\n- osAndArch: The OS and architecture of the installer, e.g. "linux64", "linux32", "win64", "win32".' +
      '\n\n**Optional parameters:**' +
      '\n- collectorVersion: Specific installer version to download (defaults to the latest GD Collector)' +
      '\n- collectorSize: Collector size - one of nano, small (2GB), medium (4GB), large (8GB), "extra large" (16GB), "double extra large" (32GB). Requires collector version 22.180+. Defaults to small.' +
      '\n- useEA: If true, use the latest EA Collector version (defaults to false)' +
      '\n- monitorOthers: Whether the Collector should monitor other resources' +
      '\n- token: Optional installer token' +
      '\n\n**Related tools:** "create_collector" (register the Collector first), "list_collector_versions" (find a version), "get_collector" (status).',
    annotations: {
      title: 'Get collector installer download URL',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the collector to install.',
        },
        osAndArch: {
          type: 'string',
          description: 'The OS and architecture for the installer, e.g. "linux64", "linux32", "win64", "win32".',
        },
        collectorVersion: {
          type: 'number',
          description: 'Specific installer version to download. Defaults to the latest GD Collector.',
        },
        collectorSize: {
          type: 'string',
          description: 'Collector size: nano, small, medium, large, "extra large", or "double extra large". Defaults to small.',
        },
        useEA: {
          type: 'boolean',
          description: 'If true, use the latest EA Collector version. Defaults to false.',
        },
        monitorOthers: {
          type: 'boolean',
          description: 'Whether the Collector should monitor other resources.',
        },
        token: {
          type: 'string',
          description: 'Optional installer token.',
        },
      },
      additionalProperties: false,
      required: ['collectorId', 'osAndArch'],
    },
  },
  {
    name: 'acknowledge_collector_down_alert',
    description: 'Acknowledge a collector-down alert in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Acknowledges the alert raised when a Collector goes down, optionally recording a comment. This signals that someone is aware of and investigating the outage; it does not bring the Collector back online. ' +
      '\n\n**When to use:**' +
      '\n- A Collector is down and you want to acknowledge the alert to stop repeated notifications' +
      '\n- Record an investigation note for the Collector-down condition' +
      '\n\n**Required parameters:**' +
      '\n- collectorId: The ID of the down Collector (from "list_collectors", where `isDown` is true)' +
      '\n\n**Optional parameters:**' +
      '\n- comment: A note explaining the acknowledgement (e.g., "Investigating network outage at DC1")' +
      '\n\n**Related tools:** "get_collector" (check `isDown`/`acked` status), "list_collectors" (find down Collectors), "acknowledge_alert" (acknowledge regular alerts).',
    annotations: {
      title: 'Acknowledge collector down alert',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the down collector whose alert to acknowledge.',
        },
        comment: {
          type: 'string',
          description: 'Optional comment explaining the acknowledgement.',
        },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },
  {
    name: 'execute_debug_command',
    description: 'Execute a Collector debug command in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Submits a debug command (e.g., `!account`, `!tlist`, `!ping <host>`, `!checkcredential`) to run on a specific Collector. Execution is asynchronous: this returns a `sessionId` that you pass to "get_debug_command_result" to retrieve the output. ' +
      '\n\n**⚠️ Note:** Debug commands run directly on the Collector host and are primarily a troubleshooting/diagnostics tool. Use with care. ' +
      '\n\n**Required parameters:**' +
      '\n- collectorId: The ID of the Collector to run the command on (from "list_collectors")' +
      '\n- cmdline: The debug command line to execute (e.g., "!tlist", "!ping 8.8.8.8")' +
      '\n\n**Workflow:** Call this tool, then poll "get_debug_command_result" with the returned `sessionId` until output is available. ' +
      '\n\n**Related tools:** "get_debug_command_result" (fetch output), "list_collectors" (find collectorId).',
    annotations: {
      title: 'Execute collector debug command',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: {
          type: 'number',
          description: 'The ID of the collector to run the debug command on.',
        },
        cmdline: {
          type: 'string',
          description: 'The debug command line to execute (e.g., "!tlist", "!ping 8.8.8.8").',
        },
      },
      additionalProperties: false,
      required: ['collectorId', 'cmdline'],
    },
  },
  {
    name: 'get_debug_command_result',
    description: 'Get the result of a previously executed Collector debug command in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Retrieves the output of a debug command submitted via "execute_debug_command", using the `sessionId` returned by that call. The result may not be ready immediately; poll until `output` is populated. ' +
      '\n\n**Required parameters:**' +
      '\n- sessionId: The session ID returned by "execute_debug_command"' +
      '\n- collectorId: The ID of the Collector the command was run on' +
      '\n\n**Related tools:** "execute_debug_command" (submit a command).',
    annotations: {
      title: 'Get collector debug command result',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'The session ID returned by execute_debug_command.',
        },
        collectorId: {
          type: 'number',
          description: 'The ID of the collector the debug command was run on.',
        },
      },
      additionalProperties: false,
      required: ['sessionId', 'collectorId'],
    },
  },

  // Collector Groups
  {
    name: 'list_collector_groups',
    description: 'List all collector groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of collector groups with: id, name, parentId, full path, description, number of collectors, number of subgroups. ' +
      '\n\n**What are collector groups:** Organizational folders for collectors (monitoring agents), similar to resource/device groups. Used to categorize collectors by location, function, or customer. ' +
      '\n\n**When to use:**' +
      '\n- Browse collector organization' +
      '\n- Find group IDs for collector operations' +
      '\n- Understand collector deployment structure' +
      '\n- Navigate to specific collector folders' +
      '\n' +
      '\n\n**Common organization patterns:** ' +
      '\n- By location: "US-West Collectors", "EU Collectors", "APAC Collectors" ' +
      '\n- By environment: "Production Collectors", "Dev/Test Collectors" ' +
      '\n- By customer: "Customer A Collectors", "Customer B Collectors" (MSP) ' +
      '\n- By datacenter: "DC1 Collectors", "DC2 Collectors", "AWS Collectors" ' +
      '\n- By function: "Network Collectors", "Server Collectors", "Cloud Collectors" ' +
      '\n\n**Use cases:** ' +
      '\n- Organize collectors by geographic region ' +
      '\n- Group collectors by customer or tenant ' +
      '\n- Separate production vs non-production collectors ' +
      '\n- Structure multi-datacenter collector deployments ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list_collectors" filtered by groupId to see collectors in specific folder. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_collector_group" (details), "list_collectors" (collectors in group), "create_collector_group" (create folder).',
    annotations: {
      title: 'List collector groups',
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
    name: 'get_collector_group',
    description: 'Get detailed information about a specific collector group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete collector group details: name, full path, parentId, description, number of collectors (direct and total), number of subgroups. ' +
      '\n\n**When to use:**' +
      '\n- Get group path for documentation' +
      '\n- Check collector membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Review group structure before deploying collectors' +
      '\n' +
      '\n\n**Workflow:** Use "list_collector_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list_collector_groups" (find groups), "list_collectors" (collectors in group), "create_collector_group" (create new).',
    annotations: {
      title: 'Get collector group details',
      readOnlyHint: true,
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
  {
    name: 'create_collector_group',
    description: 'Create a new collector group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a folder to organize Collectors into a hierarchy. ' +
      '\n\n**Required:** name. **Optional:** description, customProperties, autoBalance settings via `config`. ' +
      '\n\n**Related tools:** "list_collector_groups", "update_collector_group".',
    annotations: { title: 'Create collector group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The collector group name' },
        description: { type: 'string', description: 'The collector group description' },
        config: { type: 'object', additionalProperties: true, description: 'Additional collector group attributes merged into the request body (e.g., customProperties, autoBalanceStrategy).' },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_collector_group',
    description: 'Update a collector group in LogicMonitor (LM) monitoring. Partial update. ' +
      '\n\n**Parameters:** groupId plus name, description, or additional fields via `config`. ' +
      '\n\n**Optional query flags:** autoBalanceMonitoredDevices, forceUpdateFailedOverDevices, opType. ' +
      '\n\n**Related tools:** "get_collector_group", "list_collector_groups".',
    annotations: { title: 'Update collector group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The collector group ID to update' },
        name: { type: 'string', description: 'New collector group name' },
        description: { type: 'string', description: 'New description' },
        autoBalanceMonitoredDevices: { type: 'boolean', description: 'Auto-balance monitored devices across the group.' },
        forceUpdateFailedOverDevices: { type: 'boolean', description: 'Force update of failed-over devices.' },
        opType: { type: 'string', description: 'How to merge properties: "refresh", "add", or "replace".' },
        config: { type: 'object', additionalProperties: true, description: 'Additional collector group attributes to update.' },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_collector_group',
    description: 'Delete a collector group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot be undone. The group should generally be empty (no Collectors) before deletion. ' +
      '\n\n**Related tools:** "get_collector_group", "list_collector_groups".',
    annotations: { title: 'Delete collector group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The collector group ID to delete' },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'list_collector_agent_log_levels',
    description: 'List the agent log levels for each component of a Collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of components with their current log level (trace/debug/info/warn/error). ' +
      '\n\n**Related tools:** "get_collector_agent_log_level", "update_collector_agent_log_level".',
    annotations: { title: 'List collector agent log levels', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: { type: 'number', description: 'The Collector ID' },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },
  {
    name: 'get_collector_agent_log_level',
    description: 'Get the agent log level for a specific component of a Collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**Related tools:** "list_collector_agent_log_levels", "update_collector_agent_log_level".',
    annotations: { title: 'Get collector agent log level', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: { type: 'number', description: 'The Collector ID' },
        component: { type: 'string', description: 'The Collector component name (e.g., "collector", "watchdog", "sbproxy").' },
      },
      additionalProperties: false,
      required: ['collectorId', 'component'],
    },
  },
  {
    name: 'update_collector_agent_log_level',
    description: 'Update the agent log level for a specific component of a Collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ Note:** Verbose levels (trace/debug) increase log volume; revert when finished troubleshooting. ' +
      '\n\n**Parameters:** collectorId, component, and the new level via `config` (e.g., `{ "level": "debug" }`). ' +
      '\n\n**Related tools:** "get_collector_agent_log_level".',
    annotations: { title: 'Update collector agent log level', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: { type: 'number', description: 'The Collector ID' },
        component: { type: 'string', description: 'The Collector component name' },
        config: { type: 'object', additionalProperties: true, description: 'The log level body (e.g., { "level": "debug" }).' },
      },
      additionalProperties: false,
      required: ['collectorId', 'component', 'config'],
    },
  },
  {
    name: 'get_collector_events',
    description: 'Get recent events for a Collector in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Collector event entries (restarts, failovers, config changes, errors). ' +
      '\n\n**Related tools:** "get_collector", "get_collector_status_check".',
    annotations: { title: 'Get collector events', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: { type: 'number', description: 'The Collector ID' },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },
  {
    name: 'get_collector_status_check',
    description: 'Run a status check on a Collector\'s services in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Health/status information about the Collector services. ' +
      '\n\n**Related tools:** "get_collector", "get_collector_events".',
    annotations: { title: 'Get collector status check', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        collectorId: { type: 'number', description: 'The Collector ID' },
      },
      additionalProperties: false,
      required: ['collectorId'],
    },
  },

  // Collector Versions
  {
    name: 'list_collector_versions',
    description: 'List available collector versions in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of collector versions with: version number, release date, stability level (GA/EA/RC), changelog summary, download size, platform support (Windows/Linux), mandatory/recommended flag. ' +
      '\n\n**What are collector versions:** Software releases for LogicMonitor collector agents. Collectors are installed on your infrastructure to gather monitoring data. Staying current ensures latest features, bug fixes, and security patches. ' +
      '\n\n**When to use:**' +
      '\n- Check for collector updates' +
      '\n- Review changelog before upgrading' +
      '\n- Find specific version for rollback' +
      '\n- Verify platform compatibility' +
      '\n- Plan maintenance windows for collector upgrades' +
      '\n' +
      '\n\n**Version types:** ' +
      '\n- **GA (Generally Available):** Production-ready, stable, recommended ' +
      '\n- **EA (Early Adopter):** Beta, new features, use in non-production first ' +
      '\n- **RC (Release Candidate):** Pre-GA testing version ' +
      '\n- **Mandatory:** Critical security/bug fixes, upgrade required ' +
      '\n\n**Collector update workflow:** ' +
      '1. Use this tool to check available versions ' +
      '2. Review changelog for breaking changes ' +
      '3. Test new version on non-production collector first ' +
      '4. Use "get_collector" to check current version on your collectors ' +
      '5. Update collectors via LogicMonitor UI or API ' +
      '6. Monitor collector health after upgrade ' +
      '\n\n**Version numbering:** Format is typically X.Y.Z (e.g., 34.100.0) where: ' +
      '\n- X = Major release (significant changes) ' +
      '\n- Y = Minor release (features, improvements) ' +
      '\n- Z = Patch release (bug fixes) ' +
      '\n\n**Best practices:** ' +
      '\n- Keep collectors within 2-3 versions of latest GA release ' +
      '\n- Subscribe to release notifications for critical updates ' +
      '\n- Test EA versions in lab before production ' +
      '\n- Upgrade during maintenance windows (may briefly interrupt monitoring) ' +
      '\n- Stagger upgrades (don\'t upgrade all collectors simultaneously) ' +
      '\n\n**Common scenarios:** ' +
      '\n- "Check if newer version available" → Compare latest version to your collectors ' +
      '\n- "Plan upgrade" → Review changelog, schedule maintenance ' +
      '\n- "Rollback needed" → Find previous stable version ' +
      '\n- "Platform migration" → Verify version supports new OS ' +
      '\n\n**Related tools:** "get_collector" (check current version on collector), "list_collectors" (find collectors to upgrade).',
    annotations: {
      title: 'List collector versions',
      readOnlyHint: true,
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
