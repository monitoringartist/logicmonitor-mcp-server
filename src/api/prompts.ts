/**
 * LogicMonitor MCP Server - Prompts
 *
 * This module provides MCP prompts for common LogicMonitor operations.
 * Prompts are interactive workflows that guide users through multi-step tasks.
 */

/**
 * Prompt definition for checking resource health
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

    // Build the interactive prompt workflow
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
            'generate_resource_link tool to create direct link to LogicMonitor for this resource, ' +
            'list_resource_datasources tool to find available datasources for this resource, ' +
            'list_resource_instances tool to find available instances for this resource, ' +
            'get_resource_instance_data tool to get data for this resource (start time must be before current time), ' +
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

  throw new Error(`Unknown prompt: ${name}`);
}
