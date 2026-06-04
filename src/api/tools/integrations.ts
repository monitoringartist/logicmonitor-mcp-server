import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const integrationsTools: Tool[] = [
  // Integration audit logs
  {
    name: 'get_integration_audit_logs',
    description: 'Get integration audit logs for the LogicMonitor (LM) portal. ' +
      '\n\n**Portal-wide:** Returns audit logs across all integrations; there is no per-integration filter (do not pass an integrationId). ' +
      'The only supported parameter is `format` (e.g., "csv").',
    annotations: { title: 'Get integration audit logs', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { format: { type: 'string', description: 'Response format (e.g., csv).' } },
      additionalProperties: false,
    },
  },

  // Integrations
  {
    name: 'list_integrations',
    description: 'List all third-party integrations configured in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of integrations with: id, name, type (Slack/PagerDuty/ServiceNow/Jira/etc), status (active/inactive), configuration summary, authentication status. ' +
      '\n\n**What are integrations:** Connections to external platforms for alert notifications, ticket creation, chat messages, incident management. Extend LogicMonitor alerting beyond email/SMS. ' +
      '\n\n**When to use:**' +
      '\n- Find integration IDs for escalation chains' +
      '\n- Verify integrations are working' +
      '\n- Audit external connections' +
      '\n- Check authentication status' +
      '\n- Review available integration options' +
      '\n' +
      '\n\n**Popular integrations:** ' +
      '\n\n**Incident Management:** ' +
      '\n- **PagerDuty:** Page on-call engineers for critical alerts ' +
      '\n- **Opsgenie:** Alternative incident management and on-call scheduling ' +
      '\n- **VictorOps (Splunk On-Call):** Alert routing and escalation ' +
      '\n\n**Ticketing:** ' +
      '\n- **ServiceNow:** Auto-create incidents for alerts ' +
      '\n- **Jira:** Create tickets for infrastructure issues ' +
      '\n- **Zendesk:** Customer-facing service desk integration ' +
      '\n\n**Collaboration:** ' +
      '\n- **Slack:** Post alerts to channels, interactive notifications ' +
      '\n- **Microsoft Teams:** Teams channel notifications ' +
      '\n- **Mattermost:** Self-hosted chat notifications ' +
      '\n\n**Workflow & Automation:** ' +
      '\n- **Webhooks:** Custom integrations to any HTTP endpoint ' +
      '\n- **API:** Programmatic integration for custom workflows ' +
      '\n\n**Use cases:** ' +
      '\n- "Post critical production alerts to #incidents Slack channel" ' +
      '\n- "Auto-create ServiceNow ticket for every critical alert" ' +
      '\n- "Page PagerDuty when datacenter resource/device go offline" ' +
      '\n- "Update Jira epic when deployment causes alerts" ' +
      '\n\n**Integration status:** ' +
      '\n- Active: Integration configured and working ' +
      '\n- Inactive: Disabled or authentication failed ' +
      '\n- Test: Verify integration by triggering test notification ' +
      '\n\n**Workflow:** Use this tool to find integrations, then use in escalation chains or as webhook recipients for alert delivery. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_integration" (configuration details), "test\\_integration" (verify working), "list\\_escalation\\_chains" (see usage).',
    annotations: {
      title: 'List integrations',
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
    name: 'get_integration',
    description: 'Get detailed information about a specific integration by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete integration details: name, type, configuration (API keys, webhooks, URLs), authentication status, last successful notification, error logs, which escalation chains use it. ' +
      '\n\n**When to use:**' +
      '\n- Troubleshoot integration not working' +
      '\n- Review configuration before updates' +
      '\n- Check API keys/authentication' +
      '\n- See last successful notification time' +
      '\n- Audit integration settings' +
      '\n' +
      '\n\n**Configuration details by type:** ' +
      '\n- **Slack:** Webhook URL, channel names, mention settings ' +
      '\n- **PagerDuty:** Integration key, service mappings ' +
      '\n- **ServiceNow:** Instance URL, credentials, table mapping ' +
      '\n- **Jira:** Project keys, issue type, custom field mapping ' +
      '\n- **Webhook:** Target URL, authentication headers, payload format ' +
      '\n\n**Troubleshooting:** ' +
      '\n- Authentication failed: Check API keys/credentials ' +
      '\n- Not receiving notifications: Verify escalation chain configuration ' +
      '\n- Error logs: Review failed notification attempts ' +
      '\n\n**Workflow:** Use "list\\_integrations" to find integrationId, then use this tool for detailed configuration and troubleshooting. ' +
      '\n\n**Related tools:** "list\\_integrations" (find integrations), "test\\_integration" (send test), "update\\_integration" (modify).',
    annotations: {
      title: 'Get integration details',
      readOnlyHint: true,
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
      '\n\n**When to use:**' +
      '\n- Send alerts to Slack/Teams channels' +
      '\n- Create tickets in ServiceNow/Jira automatically' +
      '\n- Page on-call via PagerDuty/Opsgenie' +
      '\n- Export data to analytics platforms' +
      '\n- Integrate with ITSM workflows' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- type: Integration type ("slack", "pagerduty", "servicenow", "jira", "teams", "webhook", etc.) ' +
      '\n- name: Integration name (e.g., "DevOps Slack Channel", "ServiceNow Production") ' +
      '\n- config: Integration-specific configuration (API keys, URLs, channels, etc.) ' +
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
      '\n- **Centralized communication:** Alerts go where teams already work (Slack, Teams) ' +
      '\n- **Automated ticketing:** Create incidents/tickets without manual work ' +
      '\n- **On-call paging:** Reliable paging via PagerDuty/Opsgenie ' +
      '\n- **ITSM workflows:** Integrate with existing processes (ServiceNow, Jira) ' +
      '\n- **Data export:** Send metrics to analytics platforms ' +
      '\n\n**After creation:** ' +
      '1. Use integration in escalation chains to send notifications ' +
      '2. Configure alert rules to route specific alerts to integration ' +
      '3. Test with sample alert before production use ' +
      '\n\n**Best practices:** ' +
      '\n- Test integration before adding to escalation chains ' +
      '\n- Use descriptive names (include team/purpose) ' +
      '\n- Secure credentials (API keys, passwords) ' +
      '\n- One integration per channel/destination ' +
      '\n- Document integration purpose ' +
      '\n\n**Related tools:** "list\\_integrations" (view all), "update\\_integration" (modify), "delete\\_integration" (remove), "create\\_escalation\\_chain" (use integration).',
    annotations: {
      title: 'Create integration',
      readOnlyHint: false,
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
      '\n\n**When to use:**' +
      '\n- Update API keys/credentials' +
      '\n- Change Slack/Teams channel' +
      '\n- Update ServiceNow/Jira configuration' +
      '\n- Modify webhook URL' +
      '\n- Rename integration' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- integrationId: Integration ID (from "list\\_integrations") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New integration name ' +
      '\n- config: Updated configuration (API keys, URLs, channels, etc.) ' +
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
      '1. Use "get\\_integration" to see current configuration ' +
      '2. Update integration ' +
      '3. Test with sample notification ' +
      '\n\n**Related tools:** "get\\_integration" (review), "list\\_integrations" (find integration), "delete\\_integration" (remove).',
    annotations: {
      title: 'Update integration',
      readOnlyHint: false,
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
      '\n- Escalation chains using this integration stop sending notifications ' +
      '\n- No error shown - notifications silently fail ' +
      '\n- Cannot be undone ' +
      '\n\n**What this does:** Permanently removes integration. Escalation chains referencing this integration lose that notification path. ' +
      '\n\n**When to use:**' +
      '\n- Integration no longer needed' +
      '\n- Platform decommissioned (stopped using Slack/ServiceNow)' +
      '\n- Consolidating duplicate integrations' +
      '\n- Migration to different platform' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- integrationId: Integration ID to delete (from "list\\_integrations") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Find all escalation chains using this integration ' +
      '2. Create replacement integration (if needed) ' +
      '3. Update all escalation chains to use replacement BEFORE deleting ' +
      '4. Verify no chains reference this integration ' +
      '\n\n**Impact of deletion:** ' +
      '\n- Escalation chain stages with this integration stop notifying ' +
      '\n- No error or warning - notifications silently fail ' +
      '\n- Active alerts may skip notification stages ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Use "list\\_escalation\\_chains" to find chains using this integration ' +
      '2. Create new integration (if replacing) ' +
      '3. Update all escalation chains to use new integration ' +
      '4. Verify updated ' +
      '5. Delete old integration ' +
      '\n\n**Best practice:** Migrate escalation chains to replacement integration BEFORE deleting to prevent notification gaps. ' +
      '\n\n**Related tools:** "list\\_escalation\\_chains" (find usage), "create\\_integration" (replacement), "update\\_escalation\\_chain" (migrate).',
    annotations: {
      title: 'Delete integration',
      readOnlyHint: false,
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

];
