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
    description: 'Interactive health check for a LogicMonitor resource/device. ' +
      'Searches for a resource by name or custom filter, allows selection if multiple matches, ' +
      'then displays comprehensive health information including resource details, location, ' +
      'collector assignment, and current metrics (CPU, memory, network) in a formatted table.',
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

