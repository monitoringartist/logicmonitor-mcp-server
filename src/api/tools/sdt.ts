import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const sdtTools: Tool[] = [
  // SDT (Scheduled Down Time) Tools
  {
    name: 'list_sdts',
    description: 'List all Scheduled Down Times (SDTs) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of SDTs with: id, type (DeviceSDT/DeviceGroupSDT/etc), device/group name, start/end times, duration, comment, creator, status (active/scheduled/expired). ' +
      '\n\n**What are SDTs:** Maintenance windows that suppress alerting to prevent false alarms during planned work. No alerts are generated during SDT periods. ' +
      '\n\n**When to use:** ' +
      '\n- View active maintenance windows' +
      '\n- Check upcoming scheduled maintenance' +
      '\n- Verify SDT was created correctly' +
      '\n- Find SDTs to extend or cancel' +
      '\n- Audit who scheduled downtime' +
      '\n\n**Common filter patterns:** ' +
      '\n- Active now: filter:"isEffective:true"' +
      '\n- Future SDTs: filter:"startDateTime>{epoch}"' +
      '\n- By device: filter:"deviceDisplayName\\~\\*prod-web\\*"' +
      '\n- One-time vs recurring: filter:"type:oneTime" or filter:"type:monthly"' +
      '\n- By creator: filter:"admin:john.doe"' +
      '\n\n**SDT types explained:** ' +
      '\n- DeviceSDT: All monitoring on specific resource/device' +
      '\n- DeviceGroupSDT: All resource/device in group' +
      '\n- DeviceDataSourceSDT: Specific datasource on resource/device' +
      '\n- DeviceDataSourceInstanceSDT: Specific instance only (e.g., C: drive)' +
      '\n\n**Best practice:** Always add meaningful comment explaining maintenance reason for audit trail. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "create_resource_sdt" (schedule maintenance), "delete_sdt" (cancel maintenance), "get_sdt" (details).',
    annotations: {
      title: 'Get Scheduled Down Times',
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
    name: 'get_sdt',
    description: 'Get detailed information about a specific Scheduled Down Time (SDT) by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete SDT details: type, device/group affected, start/end times, duration, comment, who created it, status (active/scheduled/expired), recurrence settings. ' +
      '\n\n**When to use:** ' +
      '\n- Verify SDT was created correctly' +
      '\n- Check when maintenance window ends' +
      '\n- See who scheduled downtime' +
      '\n- Get SDT details before extending/canceling' +
      '\n- Audit maintenance history' +
      '\n\n**Status meanings:** ' +
      '\n- scheduled: Future maintenance window (not started yet)' +
      '\n- active: Currently in maintenance window (alerts suppressed now)' +
      '\n- expired: Maintenance window completed (historical record)' +
      '\n\n**Workflow:** Use "list_sdts" to find SDT ID, then use this tool for complete details before deciding to extend or delete. ' +
      '\n\n**Related tools:** "list_sdts" (find SDTs), "create_resource_sdt" (create new), "delete_sdt" (cancel).',
    annotations: {
      title: 'Get Scheduled Down Time details',
      readOnlyHint: true,
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
      '\n\n**When to use:** ' +
      '\n- Before patching servers' +
      '\n- During planned maintenance windows' +
      '\n- Network changes that will cause temporary outages' +
      '\n- Application deployments' +
      '\n- Database maintenance' +
      '\n\n**Required parameters:** ' +
      '\n- deviceId: Device to schedule maintenance for (from "list_resources")' +
      '\n- type: "DeviceSDT" (entire device) or "DeviceDataSourceSDT" (specific datasource)' +
      '\n- startDateTime: Start time in epoch MILLISECONDS (e.g., Date.now() + 3600000 for 1 hour from now)' +
      '\n- endDateTime: End time in epoch MILLISECONDS' +
      '\n- comment: Reason for maintenance (REQUIRED for audit trail)' +
      '\n\n**Time calculation examples:** ' +
      '\n- 1 hour from now: startDateTime: Date.now() + 3600000' +
      '\n- 4 hours maintenance: endDateTime: startDateTime + (4 * 3600000)' +
      '\n\n**SDT types:** ' +
      '\n- "DeviceSDT" - Suppresses ALL alerts on resource/device (most common)' +
      '\n- "DeviceDataSourceSDT" - Suppresses alerts from specific datasource only' +
      '\n\n**Best practices:** ' +
      '\n- Add detailed comment (e.g., "Patching Windows updates - Change ticket CHG12345")' +
      '\n- Use appropriate time buffer (start 15 min early, end 15 min late)' +
      '\n- Verify SDT with "list_sdts" after creation' +
      '\n\n**Related tools:** "list_sdts" (verify created), "delete_sdt" (cancel if needed).',
    annotations: {
      title: 'Schedule maintenance window',
      readOnlyHint: false,
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
      '\n- Cancels active or scheduled maintenance window' +
      '\n- Alerting resumes immediately if SDT was active' +
      '\n- Removes SDT from schedule if it was future/scheduled' +
      '\n- Cannot undo - creates audit log entry' +
      '\n\n**When to use:** ' +
      '\n- Maintenance completed early' +
      '\n- Maintenance canceled/postponed' +
      '\n- SDT created by mistake' +
      '\n- Need to restore alerting immediately' +
      '\n\n**Common scenarios:** ' +
      '\n- "Patching completed faster than expected - restore alerting"' +
      '\n- "Maintenance postponed to next week - cancel this SDT and create new one"' +
      '\n- "Wrong resource/device - need to delete and recreate for correct device"' +
      '\n- "Emergency issue needs alerting - cancel maintenance window"' +
      '\n\n**Important:** ' +
      '\n- If SDT is active, alerts resume IMMEDIATELY after deletion' +
      '\n- Check resource/device status before deleting active SDT to avoid alert flood' +
      '\n- Cannot delete only to extend - must delete and create new with longer duration' +
      '\n\n**Workflow:** ' +
      '\n- Use "list_sdts" to find SDT ID (check status: active/scheduled)' +
      '\n- Use "get_sdt" to verify correct SDT before deleting' +
      '\n- Delete SDT' +
      '\n- If resource/device still has issues, expect alerts immediately' +
      '\n\n**Best practice:** Add comment in related ticket/documentation explaining why SDT was canceled. ' +
      '\n\n**Related tools:** "list_sdts" (find SDT), "get_sdt" (verify before delete), "create_resource_sdt" (create replacement if needed).',
    annotations: {
      title: 'Delete Scheduled Down Time',
      readOnlyHint: false,
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
  {
    name: 'create_sdt',
    description: 'Create a Scheduled Down Time (SDT) for any resource type in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Suppresses alert notifications during a maintenance window. Unlike "create_resource_sdt" (which is device-specific), this generic tool supports all SDT target types: resources/devices, device groups, websites, collectors, and instances. ' +
      '\n\n**Required parameters:**' +
      '\n- type: The SDT target type. Common values: "DeviceSDT" (a single resource/device), "DeviceGroupSDT", "DeviceDataSourceInstanceSDT", "WebsiteSDT", "WebsiteGroupSDT", "CollectorSDT".' +
      '\n\n**Schedule (provide the relevant fields):**' +
      '\n- sdtType: Schedule kind. 1 = one-time (default for maintenance), or use weekly/monthly/daily recurring types.' +
      '\n- startDateTime / endDateTime: Epoch milliseconds for a one-time SDT window' +
      '\n- duration: Duration in minutes (for recurring SDTs)' +
      '\n- comment: Note describing the maintenance' +
      '\n\n**Target identifier (depends on `type`, pass via `config`):**' +
      '\n- DeviceSDT → deviceId' +
      '\n- DeviceGroupSDT → deviceGroupId' +
      '\n- WebsiteSDT → websiteId' +
      '\n- CollectorSDT → collectorId' +
      '\n- DeviceDataSourceInstanceSDT → deviceId + deviceDataSourceId + (instance fields)' +
      '\n\n**Tip:** Because SDT bodies are type-specific, put any fields not listed above (e.g. the target ID, recurrence fields) into the `config` object; they are merged into the request body. ' +
      '\n\n**Related tools:** "create_resource_sdt" (simpler device-only SDT), "list_sdts" (find SDTs), "update_sdt" (modify), "delete_sdt" (cancel).',
    annotations: {
      title: 'Create Scheduled Down Time (any type)',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'The SDT target type, e.g. "DeviceSDT", "DeviceGroupSDT", "WebsiteSDT", "CollectorSDT", "DeviceDataSourceInstanceSDT".',
        },
        sdtType: {
          type: 'number',
          description: 'The schedule type. 1 = one-time. Other values select recurring schedules (weekly/monthly/daily).',
        },
        startDateTime: {
          type: 'number',
          description: 'Start time in epoch milliseconds (for one-time SDTs).',
        },
        endDateTime: {
          type: 'number',
          description: 'End time in epoch milliseconds (for one-time SDTs).',
        },
        duration: {
          type: 'number',
          description: 'Duration of the SDT in minutes (for recurring SDTs).',
        },
        comment: {
          type: 'string',
          description: 'A note describing the maintenance window.',
        },
        config: {
          type: 'object',
          description: 'Type-specific SDT fields merged into the request body, e.g. the target identifier ' +
            '(deviceId / deviceGroupId / websiteId / collectorId) and any recurrence fields (weekDay, hour, minute, monthDay, weekOfMonth).',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['type'],
    },
  },
  {
    name: 'update_sdt',
    description: 'Update an existing Scheduled Down Time (SDT) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies an SDT\'s schedule, duration, or comment. Uses a partial update (only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- sdtId: The ID of the SDT to update (from "list_sdts"), in the format like "DV_123".' +
      '\n\n**Optional parameters (what to change):**' +
      '\n- type: The SDT target type (the API may require this when changing schedule fields)' +
      '\n- sdtType: Schedule kind (one-time/recurring)' +
      '\n- startDateTime / endDateTime: New one-time window (epoch milliseconds)' +
      '\n- duration: New duration in minutes' +
      '\n- comment: Updated note' +
      '\n- config: Any additional type-specific fields to update (merged into the body)' +
      '\n\n**Best practice:** Use "get_sdt" to review the current SDT (including its `type`) before updating. ' +
      '\n\n**Related tools:** "get_sdt" (review before update), "list_sdts" (find SDT), "delete_sdt" (cancel instead).',
    annotations: {
      title: 'Update Scheduled Down Time',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        sdtId: {
          type: 'string',
          description: 'The ID of the SDT to update (e.g. "DV_123").',
        },
        type: {
          type: 'string',
          description: 'The SDT target type (may be required by the API when changing schedule fields).',
        },
        sdtType: {
          type: 'number',
          description: 'The schedule type. 1 = one-time. Other values select recurring schedules.',
        },
        startDateTime: {
          type: 'number',
          description: 'New start time in epoch milliseconds.',
        },
        endDateTime: {
          type: 'number',
          description: 'New end time in epoch milliseconds.',
        },
        duration: {
          type: 'number',
          description: 'New duration of the SDT in minutes.',
        },
        comment: {
          type: 'string',
          description: 'Updated note describing the maintenance window.',
        },
        config: {
          type: 'object',
          description: 'Additional type-specific SDT fields to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['sdtId'],
    },
  },

];
