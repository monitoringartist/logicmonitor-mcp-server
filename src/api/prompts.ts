/**
 * LogicMonitor MCP Server - Prompts
 *
 * This module provides MCP prompts for common LogicMonitor operations.
 * Prompts are interactive workflows that guide users through multi-step tasks.
 */

export interface LMPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

/**
 * Available LogicMonitor prompts
 */
export const LM_PROMPTS: LMPrompt[] = [
  {
    name: 'resource_check',
    description: 'Interactive resource check for a LogicMonitor resource/device. ' +
      'Searches for a resource by name or custom filter, allows selection if multiple matches, ' +
      'then displays comprehensive information including resource details, groups, ' +
      'collector assignment, and current metrics (CPU, memory, network, ping, etc.) in a formatted table for selected resource.',
    arguments: [
      {
        name: 'resourceName',
        description: 'Name or partial name of the resource/device to check (e.g., "prod-web-01", "palo"). ' +
          'Can also be a filter expression like "customProperties.name:company.team,customProperties.value:teamA"',
        required: true,
      },
    ],
  },
  {
    name: 'alert_triage',
    description: 'Correlates an active LogicMonitor alert with recent device metrics, SDT history, ' +
      'and OpsNotes to identify root cause and recommended remediation steps.',
    arguments: [
      {
        name: 'alertId',
        description: 'Specific LogicMonitor alert ID to triage (e.g., "LMD12345"). Optional if resourceName is provided.',
        required: false,
      },
      {
        name: 'resourceName',
        description: 'Name or partial name of the affected resource/device to triage active alerts for.',
        required: false,
      },
      {
        name: 'datasourceName',
        description: 'Optional DataSource name to focus metric correlation (e.g., "CPU", "WinCPU").',
        required: false,
      },
    ],
  },
  {
    name: 'schedule_maintenance_window',
    description: 'Finds matching LogicMonitor devices or device groups and creates a Scheduled Downtime (SDT) ' +
      'maintenance window with confirmation.',
    arguments: [
      {
        name: 'targetGroupPath',
        description: 'Full path of the device group to place in maintenance (e.g., "Production/Web").',
        required: false,
      },
      {
        name: 'resourceName',
        description: 'Name or partial name of a specific resource/device to place in maintenance.',
        required: false,
      },
      {
        name: 'durationMinutes',
        description: 'Duration of the maintenance window in minutes (default: 60).',
        required: false,
      },
      {
        name: 'comment',
        description: 'Reason or change ticket reference for the SDT window.',
        required: false,
      },
    ],
  },
  {
    name: 'collector_health_audit',
    description: 'Audits LogicMonitor collector health, version status, failover configuration, ' +
      'agent log levels, and collector-down alerts.',
    arguments: [
      {
        name: 'collectorName',
        description: 'Hostname or description of a specific collector to audit. Omit to audit all collectors.',
        required: false,
      },
      {
        name: 'datasourceName',
        description: 'Optional DataSource name to inspect collector-level collection behavior.',
        required: false,
      },
    ],
  },
];

/**
 * Lists all available LogicMonitor prompts
 */
export function listLMPrompts(): LMPrompt[] {
  return LM_PROMPTS;
}

/**
 * Gets a specific prompt by name
 */
export function getLMPrompt(name: string): LMPrompt | undefined {
  return LM_PROMPTS.find(p => p.name === name);
}

/**
 * Generates prompt messages for a given prompt and arguments
 * This is the single source of truth for prompt message generation
 */
export function generatePromptMessages(name: string, args?: Record<string, any>): {
  description: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text';
      text: string;
    };
  }>;
} {
  if (name === 'resource_check') {
    const resourceName = args?.resourceName as string;

    if (!resourceName) {
      throw new Error('Missing required argument: resourceName');
    }

    const messages = [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `I need to check the status of a LogicMonitor resource: "${resourceName}"`,
        },
      },
      {
        role: 'assistant' as const,
        content: {
          type: 'text' as const,
          text: `I'll help you check the health of the resource "${resourceName}". Let me search for it first.\n\n` +
            'I\'ll use the list_resources tool with query parameter to find this resource, ' +
            'eventually ask user to select one particular resource from the list if there is multiple resources matching search condition, ' +
            'list_alerts tool to find any alerts for this resource, ' +
            'link_resource tool to create direct link to LogicMonitor for this resource, ' +
            'list_resource_datasources tool to find available datasources for this resource, ' +
            'list_resource_instances tool to find available instances for this resource, ' +
            'get_resource_instance_data tool to get data for this resource (start/end are epoch seconds, start time must be before current time), ' +
            'get_resource_group tool to get the group details for this resource, ' +
            'get_collector tool to get the collector details for this resource, ' +
            'get_collector_group tool to get the collector group details for this resource. ' +
            'Result will be table summary with display name, name, ip, status, current alerts and current main metrics (CPU/Memory/network/Ping), ' +
            'full group paths for all resource groups where is resource assigned. ',
        },
      },
    ];

    return {
      description: `Resource check workflow for resource: ${resourceName}`,
      messages,
    };
  }

  if (name === 'alert_triage') {
    const alertId = args?.alertId as string | undefined;
    const resourceName = args?.resourceName as string | undefined;
    const datasourceName = args?.datasourceName as string | undefined;

    const targetDesc = alertId
      ? `alert "${alertId}"`
      : resourceName
        ? `active alerts for resource "${resourceName}"`
        : 'current active critical/error alerts';

    return {
      description: `Alert triage workflow for ${targetDesc}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Triage ${targetDesc}${datasourceName ? ` (focusing on DataSource "${datasourceName}")` : ''}.`,
          },
        },
        {
          role: 'assistant' as const,
          content: {
            type: 'text' as const,
            text:
              `I'll triage ${targetDesc} by correlating alert context, metrics, maintenance history, and OpsNotes:\n` +
              `1. Fetch alert details using ${alertId ? `get_alert (id="${alertId}")` : 'list_alerts (filtered by severity/cleared=false)'}${resourceName ? ` and list_resources (query="${resourceName}")` : ''}.\n` +
              `2. Inspect recent metric trends on the affected resource with list_resource_datasources, list_resource_instances, and get_resource_instance_data${datasourceName ? ` (prioritizing "${datasourceName}")` : ''}.\n` +
              '3. Check for overlapping maintenance or recent changes using get_resource_sdt_history and list_opsnotes.\n' +
              '4. Summarize root-cause indicators, impacted services, and suggest whether to acknowledge (acknowledge_alert) or escalate (escalate_alert).',
          },
        },
      ],
    };
  }

  if (name === 'schedule_maintenance_window') {
    const targetGroupPath = args?.targetGroupPath as string | undefined;
    const resourceName = args?.resourceName as string | undefined;
    const durationMinutes = args?.durationMinutes ? String(args.durationMinutes) : '60';
    const comment = (args?.comment as string | undefined) || 'Scheduled maintenance window';

    const targetDesc = targetGroupPath
      ? `device group "${targetGroupPath}"`
      : resourceName
        ? `resource "${resourceName}"`
        : 'specified devices or device groups';

    return {
      description: `Schedule maintenance window (SDT) for ${targetDesc}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Schedule a ${durationMinutes}-minute maintenance window (SDT) for ${targetDesc}. Reason: "${comment}".`,
          },
        },
        {
          role: 'assistant' as const,
          content: {
            type: 'text' as const,
            text:
              `I'll help schedule a ${durationMinutes}-minute SDT for ${targetDesc}:\n` +
              `1. Resolve the target IDs using ${targetGroupPath ? `list_resource_groups (filter='fullPath~"${targetGroupPath}"')` : 'list_resource_groups'}${resourceName ? ` and list_resources (query="${resourceName}")` : ' and/or list_resources'}.\n` +
              '2. Check for any existing active SDTs with list_sdts to avoid duplicate windows.\n' +
              `3. Confirm the exact target, start time, duration (${durationMinutes} minutes), and comment ("${comment}"), then create the SDT via create_sdt.`,
          },
        },
      ],
    };
  }

  if (name === 'collector_health_audit') {
    const collectorName = args?.collectorName as string | undefined;
    const datasourceName = args?.datasourceName as string | undefined;
    const targetDesc = collectorName ? `collector "${collectorName}"` : 'all LogicMonitor collectors';

    return {
      description: `Collector health audit for ${targetDesc}`,
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Run a health audit for ${targetDesc}${datasourceName ? ` including DataSource "${datasourceName}"` : ''}.`,
          },
        },
        {
          role: 'assistant' as const,
          content: {
            type: 'text' as const,
            text:
              `I'll audit ${targetDesc}:\n` +
              `1. List collectors via list_collectors${collectorName ? ` (filter='hostname~"${collectorName}"||description~"${collectorName}"')` : ''} and collector groups via list_collector_groups.\n` +
              '2. For each collector, inspect status, version, failover configuration, and recent events/status using get_collector, get_collector_status_check, get_collector_events, and list_collector_upgrade_history.\n' +
              '3. Check for collector-down alerts using list_alerts and inspect agent log levels with list_collector_agent_log_levels.\n' +
              `${datasourceName ? `4. Review DataSource "${datasourceName}" collection config via list_datasources.\n5.` : '4.'} Present a health summary table highlighting down/outdated collectors, single points of failure, and recommended actions.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
}
