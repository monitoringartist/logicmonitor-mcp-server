import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema, clearedSchema } from './common.js';

export const alertsTools: Tool[] = [
  // Alert Management Tools
  {
    name: 'list_alerts',
    description: 'List active alerts in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of alerts with: id (alertId), severity (critical/error/warning), resource name, datasource, datapoint, alert message, start time (startEpoch), acknowledgement status (acked), alert rule. ' +
      '\n\n**When to use:** ' +
      '\n- Get all critical production alerts' +
      '\n- Find unacknowledged alerts needing attention' +
      '\n- Monitor specific service health' +
      '\n- Check CPU/memory alerts' +
      '\n- Generate alert reports' +
      '\n\n**Two search modes:** ' +
      '\n- **Simple search:** Use query parameter with free text (e.g., query:"prod-web-01") - searches by resource/device name (monitorObjectName field)' +
      '\n- **Advanced filtering:** Use filter parameter with LM filter syntax (e.g., filter:"severity:critical,acked:false") for precise control' +
      '\n\n**Common filter patterns:** ' +
      '\n- Critical alerts: filter:"severity:critical"' +
      '\n- Unacknowledged: filter:"acked:false"' +
      '\n- Specific device: filter:"monitorObjectName\\~\\*prod-web-01\\*"' +
      '\n- CPU alerts: filter:"resourceTemplateName\\~\\*CPU\\*"' +
      '\n- Recent alerts: filter:"startEpoch>1730851200" (epoch seconds)' +
      '\n- Combined: filter:"severity:critical,acked:false" (AND logic)' +
      '\n- Cleared/historical alerts: set cleared:true (or filter:"cleared:true"); active only: cleared:false; both: filter:"cleared:*"' +
      '\n\n**Query vs Filter:** ' +
      '\n- query: Simple text search by resource/device name only (e.g., query:"production", query:"k8s-cluster")' +
      '\n- filter: Precise LM filter syntax with any alert field. Use for severity, acked status, etc.' +
      '\n- If both provided, query is converted to filter and combined with provided filter using AND logic' +
      '\n\n**Important:** Alert API does NOT support OR operator (||). Use comma for AND only. For complex queries, make multiple calls. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_alert" (full details), "acknowledge\\_alert" (acknowledge), "add\\_alert\\_note" (add notes), "generate\\_alert\\_link" (get URL).',
    annotations: {
      title: 'List alerts',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Simple search query. Free text (e.g., "prod-web-01", "k8s-cluster") searches by resource/device name (monitorObjectName). Can also use filter syntax (e.g., "severity:critical") which gets formatted automatically.',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
        ...clearedSchema,
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
      '\n\n**When to use:** ' +
      '\n- Investigate specific alert after getting ID from "list\\_alerts"' +
      '\n- Check threshold and current values' +
      '\n- Review alert history and escalation' +
      '\n- Get context before acknowledging' +
      '\n\n**Workflow:** First use "list\\_alerts" to find the alertId, then use this tool for complete investigation details. ' +
      '\n\n**Related tools:** "acknowledge\\_alert" (acknowledge alert), "add\\_alert\\_note" (document findings), "generate\\_alert\\_link" (share with team).',
    annotations: {
      title: 'Get alert details',
      readOnlyHint: true,
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
      '\n- Marks alert as "acknowledged" (someone is handling it)' +
      '\n- STOPS alert escalation (no more notifications for this alert)' +
      '\n- Records who acknowledged and when' +
      '\n- Shows team the issue is being investigated' +
      '\n\n**When to use:** ' +
      '\n- When you start investigating an alert' +
      '\n- To stop repeat notifications' +
      '\n- To show team ownership' +
      '\n- Before scheduling maintenance' +
      '\n- During incident response' +
      '\n\n**Required parameters:** ' +
      '\n- alertId: Alert ID from "list\\_alerts" or "search\\_alerts"' +
      '\n- comment: REQUIRED - Explain what you\'re doing (e.g., "Investigating high CPU. Checking processes.")' +
      '\n\n**Best practices:** ' +
      '\n- Acknowledge immediately when starting investigation' +
      '\n- Add meaningful comment for team communication' +
      '\n- Use "add\\_alert\\_note" to document findings as you investigate' +
      '\n- If false alarm, acknowledge with explanation' +
      '\n\n**Comment examples:** ' +
      '\n- "Investigating. Appears to be batch job. Monitoring."' +
      '\n- "False alarm - planned maintenance. Creating SDT."' +
      '\n- "Working on fix. ETA 30 minutes. - John"' +
      '\n- "Escalated to network team. Ticket INC-12345."' +
      '\n\n**Workflow for alert handling:** ' +
      '\n- Use "list\\_alerts" with filter:"acked:false" to find unacked alerts' +
      '\n- Use this tool to acknowledge (stops notifications)' +
      '\n- Investigate issue' +
      '\n- Use "add\\_alert\\_note" to document findings and actions' +
      '\n- Resolve underlying issue (alert auto-clears when metrics normalize)' +
      '\n\n**Note:** If alert continues (still above threshold), it stays acknowledged until cleared. New instances = new alerts. ' +
      '\n\n**Related tools:** "list\\_alerts" (find alerts), "get\\_alert" (investigate), "add\\_alert\\_note" (document), "generate\\_alert\\_link" (share).',
    annotations: {
      title: 'Acknowledge alert',
      readOnlyHint: false,
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
      '\n- Adds timestamped note visible to entire team' +
      '\n- Documents investigation steps and findings' +
      '\n- Creates audit trail for postmortem analysis' +
      '\n- Enables team collaboration on active incidents' +
      '\n\n**When to use:** ' +
      '\n- Document investigation steps' +
      '\n- Share findings with team' +
      '\n- Track actions taken' +
      '\n- Explain resolution' +
      '\n- Note false positives' +
      '\n- Link to tickets/incidents' +
      '\n\n**Required parameters:** ' +
      '\n- alertId: Alert ID from "list\\_alerts"' +
      '\n- note: Your documentation/findings' +
      '\n\n**Use cases and examples:** ' +
      '\n\n**During investigation:** ' +
      '\n- "Checked logs - found memory leak in app. Restarting service."' +
      '\n- "CPU spike correlates with backup job. Expected behavior."' +
      '\n- "Disk full on /var/log. Rotating logs now."' +
      '\n\n**Team collaboration:** ' +
      '\n- "Paging database team - appears to be query performance issue"' +
      '\n- "Confirmed network issue. Created ticket NET-5678 with network team"' +
      '\n- "Waiting on cloud provider - incident status: https://status.aws.com"' +
      '\n\n**Resolution documentation:** ' +
      '\n- "RESOLVED: Cleared temp files. Disk usage now 45%. Will schedule cleanup job."' +
      '\n- "FALSE ALARM: Threshold too sensitive. Updated datasource threshold to 90%."' +
      '\n- "FIXED: Restarted stuck process. Root cause analysis in JIRA-1234"' +
      '\n\n**Best practices:** ' +
      '\n- Add notes as you investigate (breadcrumb trail)' +
      '\n- Include timestamps for long investigations' +
      '\n- Link to related tickets (JIRA, ServiceNow, etc.)' +
      '\n- Document "why false alarm" for future reference' +
      '\n- Use clear, actionable language' +
      '\n\n**Workflow:** ' +
      '\n- Acknowledge alert with "acknowledge\\_alert" (stops notifications)' +
      '\n- Add initial note: "Starting investigation"' +
      '\n- Add notes as you discover findings' +
      '\n- Add final note with resolution or next steps' +
      '\n\n**Related tools:** "acknowledge\\_alert" (first step), "get\\_alert" (view existing notes), "list\\_alerts" (find alerts).',
    annotations: {
      title: 'Add alert note',
      readOnlyHint: false,
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

  // Alert Rules
  {
    name: 'list_alert_rules',
    description: 'List all alert rules in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of alert rules with: id, name, priority, enabled status, matching conditions (device/datasource/severity filters), escalation chain assigned, suppression settings. ' +
      '\n\n**What are alert rules:** The ROUTING LOGIC that determines "which alerts go to which people." Act as traffic directors: "IF alert matches these conditions, THEN send to this escalation chain." Rules are evaluated in priority order (1st match wins). ' +
      '\n\n**When to use:**' +
      '\n- Audit who gets notified for different alert types' +
      '\n- Understand notification routing logic' +
      '\n- Find rule IDs for modifications' +
      '\n- Troubleshoot "why didn\'t I get alerted?"' +
      '\n- Document alert notification policies' +
      '\n' +
      '\n\n**How alert rules work:** ' +
      'Alert triggers → Rules evaluated in priority order → First matching rule wins → Routes alert to that rule\'s escalation chain → Escalation chain notifies recipients ' +
      '\n\n**Common alert rule patterns:** ' +
      '\n- **Priority 1 (Critical Production):** IF resource/device in "Production" group AND severity = critical → Route to "Critical On-Call" escalation chain ' +
      '\n- **Priority 2 (Database Team):** IF datasource contains "MySQL" OR "PostgreSQL" → Route to "Database Team" escalation chain ' +
      '\n- **Priority 3 (Business Hours):** IF severity = warning → Route to "Business Hours Email" chain (no pages) ' +
      '\n- **Priority 99 (Catch-All):** IF any alert not matched above → Route to "Default NOC" escalation chain ' +
      '\n\n**Use cases:** ' +
      '\n- "Who gets paged for production CPU alerts?" → Find rule matching prod resources/devices+ CPU datasource ' +
      '\n- "Update team notifications" → Modify alert rule to route to different escalation chain ' +
      '\n- "Stop getting low-priority pages" → Check which rule routes those alerts, adjust severity or chain ' +
      '\n\n**Critical for notification troubleshooting:** If alerts aren\'t reaching people, check:' +
      '\n- Does alert match any rule?' +
      '\n- Is matched rule enabled?' +
      '\n- Is escalation chain configured correctly?' +
      '\n' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_alert\\_rule" (detailed conditions), "list\\_escalation\\_chains" (destination chains), "update\\_alert\\_rule" (modify routing).',
    annotations: {
      title: 'List alert rules',
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
    name: 'get_alert_rule',
    description: 'Get detailed information about a specific alert rule by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete alert rule details: name, priority, enabled status, detailed matching conditions (device groups, datasources, datapoints, instance filters, severity levels), escalation chain assignment, suppression windows, notification settings. ' +
      '\n\n**When to use:**' +
      '\n- Review exact matching logic before modifying rule' +
      '\n- Troubleshoot why alert matched (or didn\'t match) this rule' +
      '\n- Document alert routing policies' +
      '\n- Verify suppression settings' +
      '\n- Check which escalation chain receives matching alerts' +
      '\n' +
      '\n\n**Matching conditions explained:** ' +
      '\n- deviceGroups: Which resource/device folders this rule applies to (e.g., /Production/, /Database Servers/) ' +
      '\n- datasources: Which datasources trigger this rule (e.g., CPU, Memory, AWS\_EC2) ' +
      '\n- datapoints: Specific metrics (e.g., CPUBusyPercent, MemoryUsedPercent) ' +
      '\n- instances: Filter by instance name (e.g., C: drive only, eth0 interface only) ' +
      '\n- severity: Alert levels (critical, error, warn) ' +
      '\n- escalatingChainId: Where matching alerts are routed ' +
      '\n\n**Troubleshooting use cases:** ' +
      '\n- "Why did this CPU alert go to wrong team?" → Check resource/device group + datasource filters ' +
      '\n- "Why didn\'t I get paged?" → Verify alert matches conditions AND check escalation chain ' +
      '\n- "Too many alerts" → Review if conditions too broad, add instance filters ' +
      '\n\n**Workflow:** Use "list\\_alert\\_rules" to find ruleId, then use this tool to review complete matching logic and routing. ' +
      '\n\n**Related tools:** "list\\_alert\\_rules" (find rules), "update\\_alert\\_rule" (modify), "get\\_escalation\\_chain" (check notification chain).',
    annotations: {
      title: 'Get alert rule details',
      readOnlyHint: true,
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
      '\n\n**When to use:**' +
      '\n- Set up alert notifications for new teams' +
      '\n- Route critical alerts differently than warnings' +
      '\n- Send database alerts to database team' +
      '\n- Configure environment-specific routing (prod vs dev)' +
      '\n- Establish tiered alerting by severity' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Rule name (e.g., "Critical Production Alerts", "Database Team Alerts") ' +
      '\n- priority: Rule evaluation order (1=highest, evaluated first) ' +
      '\n- escalationChainId: Which escalation chain receives matching alerts ' +
      '\n\n**Optional parameters (matching conditions):** ' +
      '\n- deviceGroups: Device folders to match (e.g., "/Production/") ' +
      '\n- datasources: DataSource names to match (e.g., "CPU", "Memory") ' +
      '\n- instances: Instance names to match ' +
      '\n- datapoints: Specific metrics ' +
      '\n- severity: Alert levels (critical, error, warn) ' +
      '\n\n**How alert rules work:** ' +
      'Alert triggers → Rules evaluated in priority order → First matching rule wins → Routes to that rule\'s escalation chain → Escalation chain notifies recipients ' +
      '\n\n**Priority is CRITICAL:** ' +
      '\n- Rules evaluated in priority order (1, 2, 3...) ' +
      '\n- FIRST matching rule wins (stops evaluation) ' +
      '\n- More specific rules need LOWER priority numbers (evaluated first) ' +
      '\n- Catch-all rules need HIGHER priority numbers (evaluated last) ' +
      '\n\n**Common alert rule patterns:** ' +
      '\n\n**Critical production alerts (Priority 1):** ' +
      '{name: "Critical Production", priority: 1, deviceGroups: "/Production/", severity: "critical", escalationChainId: 10} ' +
      '// Critical alerts from production resources/devices→ On-call chain ' +
      '\n\n**Database team alerts (Priority 2):** ' +
      '{name: "Database Team", priority: 2, datasources: "MySQL,PostgreSQL,Oracle", escalationChainId: 20} ' +
      '// Any database datasource → Database team chain ' +
      '\n\n**Network team alerts (Priority 3):** ' +
      '{name: "Network Team", priority: 3, deviceGroups: "/Network resources/Devices/", escalationChainId: 30} ' +
      '// Network resource/device → Network team chain ' +
      '\n\n**Business hours only (Priority 4):** ' +
      '{name: "Non-Critical Warnings", priority: 4, severity: "warn", escalationChainId: 40} ' +
      '// Warnings → Business hours email chain ' +
      '\n\n**Catch-all rule (Priority 99):** ' +
      '{name: "Default - All Alerts", priority: 99, escalationChainId: 50} ' +
      '// Everything else → Default NOC chain ' +
      '\n\n**DeviceGroups filter examples:** ' +
      '\n- "/Production/" - Any resource/device in Production folder ' +
      '\n- "/Production/Web Servers/" - Only production web servers ' +
      '\n- "\*" - All resource/device (catch-all) ' +
      '\n\n**Datasources filter examples:** ' +
      '\n- "CPU" - Any datasource with CPU in name ' +
      '\n- "WinCPU,LinuxCPU" - Specific datasources (comma-separated) ' +
      '\n- "Memory,Disk" - Memory or Disk datasources ' +
      '\n\n**Severity options:** ' +
      '\n- "critical" - Critical alerts only ' +
      '\n- "error" - Error and critical ' +
      '\n- "warn" - All severities (warn, error, critical) ' +
      '\n\n**Best practices:** ' +
      '\n- Start with priority 1 for most specific rules ' +
      '\n- Increment by 10 (1, 10, 20, 30...) to leave room for insertions ' +
      '\n- Always have catch-all rule at high priority (99) as safety net ' +
      '\n- Test rules with sample alerts before production ' +
      '\n- Document why each rule exists (in description) ' +
      '\n- Review rules quarterly as teams/infrastructure changes ' +
      '\n\n**After creation workflow:** ' +
      '1. Create escalation chains first (define WHO gets notified) ' +
      '2. Create alert rules (define WHICH alerts go to which chains) ' +
      '3. Test with sample alerts ' +
      '4. Monitor alert routing to verify working correctly ' +
      '\n\n**Related tools:** "list\\_escalation\\_chains" (create chains first), "update\\_alert\\_rule" (modify), "list\\_alert\\_rules" (view all), "list\\_alerts" (test routing).',
    annotations: {
      title: 'Create alert rule',
      readOnlyHint: false,
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
      '\n\n**When to use:**' +
      '\n- Route alerts to different team' +
      '\n- Adjust rule priority' +
      '\n- Update matching conditions' +
      '\n- Temporarily disable rule' +
      '\n- Broaden/narrow alert scope' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- ruleId: Alert rule ID (from "list\\_alert\\_rules") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New rule name ' +
      '\n- priority: Change evaluation order ' +
      '\n- escalationChainId: Route to different chain ' +
      '\n- deviceGroups: Update resource/device scope ' +
      '\n- datasources: Update datasource filter ' +
      '\n- severity: Change severity matching ' +
      '\n- enabled: true (active) or false (disable) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Route to different team:** ' +
      '{ruleId: 123, escalationChainId: 456} // Database alerts → new DB team chain ' +
      '\n\n**Adjust priority (rule conflict):** ' +
      '{ruleId: 123, priority: 5} // Make this rule evaluate earlier ' +
      '\n\n**Temporarily disable rule:** ' +
      '{ruleId: 123, enabled: false} // During team transition ' +
      '\n\n**Broaden scope:** ' +
      '{ruleId: 123, deviceGroups: "/Production/,/Staging/"} // Add staging resource/device ' +
      '\n\n**Narrow scope:** ' +
      '{ruleId: 123, severity: "critical"} // Only critical, not warnings ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '\n- New alerts immediately use updated rule ' +
      '\n- Active alerts already routed continue with original chain ' +
      '\n- Disabling rule means matching alerts route to next matching rule ' +
      '\n- Priority changes affect which rule wins for overlapping conditions ' +
      '\n\n**Priority update considerations:** ' +
      'If two rules match same alert, LOWER priority number wins. Example: ' +
      '\n- Rule A (priority 1): deviceGroups="/Production/" ' +
      '\n- Rule B (priority 2): datasources="CPU" ' +
      '\n- Alert from Production resource/device with CPU datasource → Rule A wins (priority 1) ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get\\_alert\\_rule" to review current configuration ' +
      '2. Use "list\\_alert\\_rules" to check priority conflicts ' +
      '3. Update alert rule ' +
      '4. Monitor new alerts to verify routing correctly ' +
      '\n\n**Related tools:** "get\\_alert\\_rule" (review), "list\\_alert\\_rules" (check priorities), "list\\_alerts" (verify routing).',
    annotations: {
      title: 'Update alert rule',
      readOnlyHint: false,
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
      '\n- Alerts that matched this rule will route to NEXT matching rule ' +
      '\n- If no other rules match, alerts may go to default catch-all rule ' +
      '\n- If NO rules match, alerts might not notify anyone ' +
      '\n- Cannot be undone ' +
      '\n\n**What this does:** Permanently removes alert rule from routing logic. Alerts previously matched by this rule will be evaluated by remaining rules. ' +
      '\n\n**When to use:**' +
      '\n- Consolidating duplicate rules' +
      '\n- Team/function no longer exists' +
      '\n- Replacing with better-configured rule' +
      '\n- Cleanup after reorganization' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- ruleId: Alert rule ID to delete (from "list\\_alert\\_rules") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "get\\_alert\\_rule" to understand what alerts this rule matches ' +
      '2. Use "list\\_alert\\_rules" to identify which rule will handle these alerts after deletion ' +
      '3. If replacing, create new rule with LOWER priority BEFORE deleting old one ' +
      '4. Verify alert coverage gap won\'t occur ' +
      '\n\n**Impact of deletion:** ' +
      '\n- **Immediate:** New alerts re-evaluate against remaining rules ' +
      '\n- **Next match:** Alerts fall through to next matching rule (higher priority number) ' +
      '\n- **No match:** Alerts might reach catch-all rule or go unnotified ' +
      '\n- **Active alerts:** Continue with original routing (already assigned) ' +
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
      '\n- Delete priority 1 → Alerts now match priority 5 (if conditions match) ' +
      '\n- Delete priority 5 → Priority 1 still catches most; priority 10 catches remainder ' +
      '\n- Delete priority 10 (catch-all) → Alerts with no other match might go unnotified! ' +
      '\n\n**⚠️ NEVER delete catch-all rule (high priority like 99) without replacement - creates notification black hole!** ' +
      '\n\n**Best practice:** Create replacement rule BEFORE deleting old rule to ensure continuous alert coverage. ' +
      '\n\n**Related tools:** "get\\_alert\\_rule" (review before delete), "list\\_alert\\_rules" (check coverage), "create\\_alert\\_rule" (replacement).',
    annotations: {
      title: 'Delete alert rule',
      readOnlyHint: false,
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

  // Action Chains & Action Rules (Alert Automation)
  {
    name: 'list_action_chains',
    description: 'List alert action chains in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are action chains:** Ordered escalation/notification sequences (stages) that alert rules invoke to deliver notifications (email, SMS, integrations) and to escalate if not acknowledged. ' +
      '\n\n**Returns:** Array of action chains with id, name, description, and stages. ' +
      '\n\n**Related tools:** "get\\_action\\_chain", "create\\_action\\_chain", "list\\_action\\_rules" (rules reference chains via actionChainId).',
    annotations: { title: 'List action chains', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_action_chain',
    description: 'Get details of a specific alert action chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Full chain config: name, description, and the ordered stages (recipients/integrations per stage). ' +
      '\n\n**Related tools:** "list\\_action\\_chains", "update\\_action\\_chain".',
    annotations: { title: 'Get action chain', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        actionChainId: { type: 'number', description: 'The action chain ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['actionChainId'],
    },
  },
  {
    name: 'create_action_chain',
    description: 'Create an alert action chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines a reusable notification/escalation sequence that alert rules can reference. ' +
      '\n\n**Required:** name and stages. Each stage is a list of recipients/integration targets; alerts escalate from one stage to the next if not acknowledged. ' +
      '\n\n**Tip:** Use "get\\_action\\_chain" on an existing chain to see the exact `stages` structure, then adapt it via `config`. ' +
      '\n\n**Related tools:** "create\\_action\\_rule" (wire the chain to alerts), "update\\_action\\_chain".',
    annotations: { title: 'Create action chain', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The action chain name' },
        description: { type: 'string', description: 'The action chain description' },
        stages: {
          type: 'array',
          description: 'Ordered list of stages; each stage lists the recipients/integration targets to notify.',
          items: { type: 'object', additionalProperties: true },
        },
        config: {
          type: 'object',
          description: 'Additional action chain attributes merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name', 'stages'],
    },
  },
  {
    name: 'update_action_chain',
    description: 'Update an alert action chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** actionChainId plus any of name, description, stages (or additional fields via `config`). Partial update. ' +
      '\n\n**Best practice:** Use "get\\_action\\_chain" first to review the current `stages` before modifying. ' +
      '\n\n**Related tools:** "get\\_action\\_chain", "list\\_action\\_chains".',
    annotations: { title: 'Update action chain', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        actionChainId: { type: 'number', description: 'The action chain ID' },
        name: { type: 'string', description: 'New action chain name' },
        description: { type: 'string', description: 'New action chain description' },
        stages: {
          type: 'array',
          description: 'Replacement ordered list of stages.',
          items: { type: 'object', additionalProperties: true },
        },
        config: {
          type: 'object',
          description: 'Additional action chain attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['actionChainId'],
    },
  },
  {
    name: 'delete_action_chain',
    description: 'Delete an alert action chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ Warning:** Action rules referencing this chain will lose their notification target. Verify no active action rule depends on it first. ' +
      '\n\n**Related tools:** "list\\_action\\_rules" (check dependencies), "get\\_action\\_chain".',
    annotations: { title: 'Delete action chain', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        actionChainId: { type: 'number', description: 'The action chain ID to delete' },
      },
      additionalProperties: false,
      required: ['actionChainId'],
    },
  },
  {
    name: 'list_action_rules',
    description: 'List alert action rules in LogicMonitor (LM) monitoring. ' +
      '\n\n**What are action rules:** Rules that match alerts (by device groups, devices, datasource, datapoint, severity) and route them to an action chain for notification/escalation. ' +
      '\n\n**Returns:** Array of action rules with id, name, levelStr, deviceGroups, actionChainId, enabled. ' +
      '\n\n**Related tools:** "get\\_action\\_rule", "create\\_action\\_rule", "list\\_action\\_chains".',
    annotations: { title: 'List action rules', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: [],
    },
  },
  {
    name: 'get_action_rule',
    description: 'Get details of a specific alert action rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Match criteria (deviceGroups, devices, datasource, datapoint, instance, severity levelStr), the linked actionChainId, and enabled status. ' +
      '\n\n**Related tools:** "list\\_action\\_rules", "update\\_action\\_rule", "set\\_action\\_rule\\_status".',
    annotations: { title: 'Get action rule', readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        actionRuleId: { type: 'number', description: 'The action rule ID' },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['actionRuleId'],
    },
  },
  {
    name: 'create_action_rule',
    description: 'Create an alert action rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Routes matching alerts to an action chain for notification/escalation. ' +
      '\n\n**Required:** name, actionChainId (from "list\\_action\\_chains"), deviceGroups (array of group filters), and levelStr (severity levels, e.g., "Warn,Error,Critical"). ' +
      '\n\n**Optional match criteria:** devices, datasource, datapoint, instance, resourceProperties, enabled. ' +
      '\n\n**Related tools:** "list\\_action\\_chains", "update\\_action\\_rule", "set\\_action\\_rule\\_status".',
    annotations: { title: 'Create action rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The action rule name' },
        actionChainId: { type: 'number', description: 'The action chain ID this rule routes alerts to' },
        deviceGroups: {
          type: 'array',
          description: 'Device groups the rule matches (e.g., ["*"] for all).',
          items: { type: 'string' },
        },
        levelStr: { type: 'string', description: 'Severity levels to match (e.g., "Warn,Error,Critical").' },
        devices: { type: 'array', description: 'Specific devices to match.', items: { type: 'string' } },
        datasource: { type: 'string', description: 'Datasource to match.' },
        datapoint: { type: 'string', description: 'Datapoint to match.' },
        instance: { type: 'string', description: 'Instance to match.' },
        enabled: { type: 'boolean', description: 'Whether the rule is enabled.' },
        config: {
          type: 'object',
          description: 'Additional action rule attributes (e.g., resourceProperties) merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name', 'actionChainId', 'deviceGroups', 'levelStr'],
    },
  },
  {
    name: 'update_action_rule',
    description: 'Update an alert action rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** actionRuleId plus any fields to change (name, actionChainId, deviceGroups, levelStr, devices, datasource, datapoint, instance, enabled, or additional fields via `config`). Partial update. ' +
      '\n\n**Tip:** To only toggle enabled/disabled, prefer "set\\_action\\_rule\\_status". ' +
      '\n\n**Related tools:** "get\\_action\\_rule", "list\\_action\\_rules".',
    annotations: { title: 'Update action rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        actionRuleId: { type: 'number', description: 'The action rule ID' },
        name: { type: 'string', description: 'New action rule name' },
        actionChainId: { type: 'number', description: 'New action chain ID' },
        deviceGroups: { type: 'array', description: 'Device groups the rule matches.', items: { type: 'string' } },
        levelStr: { type: 'string', description: 'Severity levels to match.' },
        devices: { type: 'array', description: 'Specific devices to match.', items: { type: 'string' } },
        datasource: { type: 'string', description: 'Datasource to match.' },
        datapoint: { type: 'string', description: 'Datapoint to match.' },
        instance: { type: 'string', description: 'Instance to match.' },
        enabled: { type: 'boolean', description: 'Whether the rule is enabled.' },
        config: {
          type: 'object',
          description: 'Additional action rule attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['actionRuleId'],
    },
  },
  {
    name: 'delete_action_rule',
    description: 'Delete an alert action rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ Warning:** Alerts previously matched by this rule will no longer trigger its notifications/escalations. ' +
      '\n\n**Related tools:** "get\\_action\\_rule" (review before delete), "list\\_action\\_rules".',
    annotations: { title: 'Delete action rule', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        actionRuleId: { type: 'number', description: 'The action rule ID to delete' },
      },
      additionalProperties: false,
      required: ['actionRuleId'],
    },
  },
  {
    name: 'set_action_rule_status',
    description: 'Enable or disable an alert action rule in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Toggles only the enabled status of an action rule without modifying its other configuration. ' +
      '\n\n**Parameters:** actionRuleId, enabled (true to enable, false to disable). ' +
      '\n\n**Related tools:** "update\\_action\\_rule" (full edit), "get\\_action\\_rule".',
    annotations: { title: 'Set action rule status', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        actionRuleId: { type: 'number', description: 'The action rule ID' },
        enabled: { type: 'boolean', description: 'true to enable, false to disable the rule' },
      },
      additionalProperties: false,
      required: ['actionRuleId', 'enabled'],
    },
  },

  // Alert escalation
  {
    name: 'escalate_alert',
    description: 'Escalate an alert to the next stage in its escalation chain in LogicMonitor (LM).',
    annotations: { title: 'Escalate alert', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: { alertId: { type: 'string', description: 'The alert ID (e.g., DS12345).' } },
      additionalProperties: false,
      required: ['alertId'],
    },
  },

];
