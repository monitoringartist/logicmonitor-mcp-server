import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { fieldsSchema } from './common.js';

export const costOptimizationTools: Tool[] = [
  // Cost Optimization Recommendations Tools
  {
    name: 'list_cost_optimization_recommendations',
    description: 'List cloud cost optimization recommendations in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of recommendations, each with: id (composite identifier), recommendationId, recommendation (details), recommendationCategory, recommendationStatus, annualSavings (potential annual savings in USD), cloudProvider (AWS/Azure/GCP), cloudServiceType, cloudAccountId, resourceDisplayName, resourceId, deviceSubtype, criteria, providerConsoleUrl, createdAtMS, updatedAtMS. ' +
      '\n\n**What this is:** LogicMonitor Cost Optimization analyzes your connected cloud accounts (AWS, Azure, GCP) and surfaces actionable recommendations to reduce spend, such as removing unattached storage, right-sizing instances, or deleting idle resources. ' +
      '\n\n**When to use:**' +
      '\n- Find ways to reduce cloud spend' +
      '\n- Build a cost-savings report (sum annualSavings)' +
      '\n- Identify idle or oversized cloud resources' +
      '\n- Review recommendations by category or status' +
      '\n\n**Filtering:** Filtering is supported on `recommendationStatus` and `recommendationCategory` using the `:` (equals) operator. ' +
      'Only one value at a time is supported for `recommendationCategory`, but multiple statuses may be combined with the `|` (OR) operator. ' +
      'When combining different filters, only the `,` (AND) relation is supported. ' +
      '\n- Single category: `recommendationCategory:"EC2 Right Sizing"`' +
      '\n- Multiple statuses: `recommendationStatus:"active"|"snoozed"`' +
      '\n- Combined: `recommendationCategory:"EBS Unattached",recommendationStatus:"active"`' +
      '\n\n**Tip:** Use "list_cost_optimization_recommendation_categories" first to discover valid category names. ' +
      '\n\n**Related tools:** "get_cost_optimization_recommendation" (full details for one recommendation), "list_cost_optimization_recommendation_categories" (available categories).',
    annotations: {
      title: 'List cost optimization recommendations',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'number',
          description: 'Number of results per page (default: 50, max: 500).',
        },
        offset: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0).',
        },
        filter: {
          type: 'string',
          description: 'Filter expression. Only `recommendationStatus` and `recommendationCategory` ' +
            'are filterable, using the `:` (equals) operator. One category value at a time; ' +
            'multiple statuses may be OR-ed with `|`; combine different filters with `,` (AND). ' +
            'Examples: `recommendationCategory:"EBS Unattached"` or ' +
            '`recommendationCategory:"EC2 Right Sizing",recommendationStatus:"active"|"snoozed"`.',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_cost_optimization_recommendation',
    description: 'Get detailed information about a specific cloud cost optimization recommendation in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Full recommendation object including recommendation details, category, status, annualSavings (USD), cloud provider/account/service, the associated resource (resourceDisplayName, resourceId, deviceSubtype), criteria, providerConsoleUrl, and timestamps (createdAtMS, updatedAtMS). ' +
      '\n\n**When to use:**' +
      '\n- Inspect a single recommendation surfaced by "list_cost_optimization_recommendations"' +
      '\n- Get the cloud provider console URL to act on a recommendation' +
      '\n- Review the exact criteria behind a savings recommendation' +
      '\n\n**Related tools:** "list_cost_optimization_recommendations" (find recommendation IDs).',
    annotations: {
      title: 'Get cost optimization recommendation details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The composite recommendation identifier, made up of the recommendation\'s ' +
            'database ID, the associated resource ID, and the recommendation type, delimited by ' +
            'hyphens (e.g., "123-456-EBS_UNATTACHED"). Obtain this from ' +
            '"list_cost_optimization_recommendations".',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['id'],
    },
  },
  {
    name: 'list_cost_optimization_recommendation_categories',
    description: 'List the available cloud cost optimization recommendation categories in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of categories, each with: name (category name, e.g. "EBS Unattached", "EC2 Right Sizing") and description. ' +
      '\n\n**When to use:**' +
      '\n- Discover valid category names before filtering "list_cost_optimization_recommendations"' +
      '\n- Understand the kinds of savings opportunities LogicMonitor detects' +
      '\n\n**Related tools:** "list_cost_optimization_recommendations" (filter by a category name).',
    annotations: {
      title: 'List cost optimization recommendation categories',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'number',
          description: 'Number of results per page (default: 50).',
        },
        offset: {
          type: 'number',
          description: 'Starting offset for pagination (default: 0).',
        },
        filter: {
          type: 'string',
          description: 'Optional filter expression using LogicMonitor query syntax.',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },

];
