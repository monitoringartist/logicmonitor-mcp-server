import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const escalationTools: Tool[] = [
  // Escalation Chains
  {
    name: 'list_escalation_chains',
    description: 'List all escalation chains in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of escalation chains with: id, name, description, escalation stages, recipients at each stage, timing/delays, enabled status. ' +
      '\n\n**What are escalation chains:** Define HOW and WHO gets notified when alerts trigger. Multi-stage notification workflows: Stage 1 (notify team lead immediately) → Stage 2 (if still open after 15 min, notify manager) → Stage 3 (if still open after 30 min, page director). ' +
      '\n\n**When to use:**' +
      '\n- Audit notification routing' +
      '\n- Find escalation chain IDs for alert rule configuration' +
      '\n- Review who gets notified for critical alerts' +
      '\n- Verify on-call escalation paths' +
      '\n' +
      '\n\n**How escalation chains work:** ' +
      'Alert triggers → Alert Rule matches → Routes to Escalation Chain → Stage 1 notifies immediately → Wait X minutes → If still alerting, Stage 2 notifies → Repeat through stages ' +
      '\n\n**Common escalation patterns:** ' +
      '\n- **Critical Production:** Stage 1: On-call engineer (0 min) → Stage 2: Team lead (15 min) → Stage 3: Engineering manager (30 min) ' +
      '\n- **Standard:** Stage 1: Team email (0 min) → Stage 2: PagerDuty (30 min) ' +
      '\n- **Business Hours Only:** Stage 1: Team Slack (0 min, 8am-6pm only) ' +
      '\n\n**Use cases:** ' +
      '\n- "Who gets paged for critical database alerts?" → Check escalation chain ' +
      '\n- "Why didn\'t I get notified?" → Verify you\'re in the escalation chain ' +
      '\n- "Update on-call rotation" → Modify escalation chain recipients ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_escalation_chain" (detailed stages), "list_alert_rules" (see which rules use chain), "list_recipient_groups" (available notification targets).',
    annotations: {
      title: 'List escalation chains',
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
    name: 'get_escalation_chain',
    description: 'Get detailed information about a specific escalation chain by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete escalation chain details: name, description, all stages with: recipients at each stage, notification methods (email/SMS/webhook), time delays between stages, rate limiting, business hours restrictions. ' +
      '\n\n**When to use:**' +
      '\n- Review detailed notification workflow' +
      '\n- Verify who gets notified at each stage' +
      '\n- Check timing between escalations' +
      '\n- Audit notification methods' +
      '\n- Troubleshoot why notifications not received' +
      '\n' +
      '\n\n**Stage details returned:** ' +
      'For each stage: ' +
      '\n- Stage number (1, 2, 3...) ' +
      '\n- Delay before stage triggers (minutes) ' +
      '\n- Recipients/groups notified ' +
      '\n- Notification methods (email, SMS, integration) ' +
      '\n- Schedule (24/7 vs business hours only) ' +
      '\n\n**Example escalation chain details:** ' +
      'Stage 1 (0 min): Email "oncall@company.com", SMS "+1-555-1234" ' +
      'Stage 2 (15 min): PagerDuty integration, Email "team-lead@company.com" ' +
      'Stage 3 (30 min): Slack webhook, Email "engineering-manager@company.com" ' +
      '\n\n**Workflow:** Use "list_escalation_chains" to find chainId, then use this tool to review complete notification workflow. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find chains), "update_escalation_chain" (modify), "list_recipient_groups" (see recipient groups).',
    annotations: {
      title: 'Get escalation chain details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },
  {
    name: 'create_escalation_chain',
    description: 'Create a new escalation chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Defines multi-stage notification workflow for alerts. Controls WHO gets notified, WHEN they get notified, and HOW notifications escalate if alerts remain unacknowledged. ' +
      '\n\n**When to use:**' +
      '\n- Set up on-call rotation notifications' +
      '\n- Define critical alert escalation (team → lead → manager)' +
      '\n- Create business hours vs after-hours notification paths' +
      '\n- Configure team-specific alert routing' +
      '\n- Establish incident escalation procedures' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Escalation chain name (e.g., "Critical Production", "Database Team", "Business Hours Only") ' +
      '\n- stages: Array of escalation stages defining notification workflow ' +
      '\n\n**Stage configuration:** ' +
      'Each stage defines: ' +
      '\n- recipients: Array of recipient IDs or group IDs to notify ' +
      '\n- delay: Minutes to wait before this stage (0 = immediate, 15 = wait 15 min) ' +
      '\n- notificationMethod: email, SMS, voice, webhook, integration ' +
      '\n- schedule: When stage is active (24/7 vs business hours only) ' +
      '\n\n**Escalation chain workflow:** ' +
      'Alert triggers → Matched by Alert Rule → Routes to Escalation Chain → ' +
      'Stage 1 notifies immediately → Wait delay → If still alerting → Stage 2 notifies → Repeat ' +
      '\n\n**Common escalation patterns:** ' +
      '\n\n**Critical Production (3-stage):** ' +
      '{name: "Critical Production", stages: [ ' +
      '  {recipients: [1,2], delay: 0, method: "SMS"},  // On-call engineer immediately ' +
      '  {recipients: [3], delay: 15, method: "SMS"},  // Team lead after 15min ' +
      '  {recipients: [4], delay: 30, method: "voice"}  // Manager after 30min total ' +
      ']} ' +
      '\n\n**Standard Team (2-stage):** ' +
      '{name: "Database Team", stages: [ ' +
      '  {recipients: [groupId:10], delay: 0, method: "email"},  // Entire team immediately ' +
      '  {recipients: [5], delay: 30, method: "SMS"}  // Team lead after 30min ' +
      ']} ' +
      '\n\n**Business Hours Only:** ' +
      '{name: "Non-Critical", stages: [ ' +
      '  {recipients: [groupId:20], delay: 0, method: "email", schedule: "business-hours"}  // Email during work hours only ' +
      ']} ' +
      '\n\n**PagerDuty Integration:** ' +
      '{name: "PagerDuty Escalation", stages: [ ' +
      '  {recipients: [integrationId:1], delay: 0, method: "webhook"}  // PagerDuty handles escalation ' +
      ']} ' +
      '\n\n**Slack + Email Combo:** ' +
      '{name: "DevOps Team", stages: [ ' +
      '  {recipients: [slackId:1], delay: 0, method: "webhook"},  // Slack channel immediately ' +
      '  {recipients: [groupId:30], delay: 10, method: "email"}  // Email if not acknowledged ' +
      ']} ' +
      '\n\n**Delay timing explained:** ' +
      '\n- delay: 0 = Immediate notification when alert triggers ' +
      '\n- delay: 15 = Wait 15 minutes from previous stage ' +
      '\n- delay: 30 = Wait 30 minutes from previous stage ' +
      '\n- If alert acknowledged, escalation stops (no further stages notify) ' +
      '\n- If alert clears, escalation stops ' +
      '\n\n**Notification methods:** ' +
      '\n- email: Email to recipient address ' +
      '\n- SMS: Text message to phone ' +
      '\n- voice: Phone call ' +
      '\n- webhook: HTTP POST (for Slack, PagerDuty, custom integrations) ' +
      '\n- integration: Pre-configured integration (ServiceNow, Jira, etc.) ' +
      '\n\n**Schedule restrictions:** ' +
      '\n- "24/7" or null: Always active ' +
      '\n- "business-hours": Mon-Fri 9am-5pm (configurable) ' +
      '\n- Custom schedules: Define specific time windows ' +
      '\n\n**After creation workflow:** ' +
      '1. Create escalation chain with notification stages ' +
      '2. Create Alert Rule that routes alerts to this chain ' +
      '3. Alert Rule matches alerts → Routes to chain → Chain notifies per stages ' +
      '\n\n**Best practices:** ' +
      '\n- Use recipient groups instead of individuals (easier to update) ' +
      '\n- Start with reasonable delays (15-30 min between stages) ' +
      '\n- Use SMS/voice for critical escalations only (cost/noise) ' +
      '\n- Business hours chains for non-critical alerts (reduce after-hours noise) ' +
      '\n- Test escalation chains before production use ' +
      '\n- Document who is in each stage for on-call handoffs ' +
      '\n\n**Related tools:** "list_recipient_groups" (find groups), "list_integrations" (find integrations), "create_alert_rule" (route alerts to chain), "list_escalation_chains" (view all).',
    annotations: {
      title: 'Create escalation chain',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the escalation chain',
        },
        description: {
          type: 'string',
          description: 'Description of the escalation chain',
        },
        stages: {
          type: 'array',
          description: 'Array of escalation stages with recipients and timing',
          items: { type: 'object', additionalProperties: true },
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_escalation_chain',
    description: 'Update an existing escalation chain in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify escalation chain stages, recipients, timing, or notification methods. Changes affect all alert rules using this chain immediately. ' +
      '\n\n**When to use:**' +
      '\n- Update on-call rotation recipients' +
      '\n- Adjust escalation timing' +
      '\n- Add/remove notification stages' +
      '\n- Change notification methods' +
      '\n- Update business hours schedules' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- chainId: Escalation chain ID (from "list_escalation_chains") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New chain name ' +
      '\n- description: Updated description ' +
      '\n- stages: New escalation stages array (replaces all stages) ' +
      '\n- enabled: true (active) or false (disable temporarily) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update on-call rotation:** ' +
      '{chainId: 123, stages: [{recipients: [newOnCallId], delay: 0, method: "SMS"}]} ' +
      '\n\n**Adjust escalation timing:** ' +
      '{chainId: 123, stages: [{recipients: [1,2], delay: 0}, {recipients: [3], delay: 10}]} // Faster escalation ' +
      '\n\n**Add stage for manager escalation:** ' +
      '{chainId: 123, stages: [stage1, stage2, {recipients: [managerId], delay: 45}]} // Add 3rd stage ' +
      '\n\n**Disable chain temporarily:** ' +
      '{chainId: 123, enabled: false} // During team restructuring ' +
      '\n\n**⚠️ Important - Immediate Impact:** ' +
      '\n- All alert rules using this chain immediately use new configuration ' +
      '\n- Active alerts in-progress continue with old stages (already notified) ' +
      '\n- New alerts use updated stages ' +
      '\n- Disabling chain stops all notifications for alerts routed to it ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_escalation_chain" to review current configuration ' +
      '2. Use "list_alert_rules" to see which rules use this chain (impact analysis) ' +
      '3. Update escalation chain ' +
      '4. Monitor alerts to verify new configuration works ' +
      '\n\n**Related tools:** "get_escalation_chain" (review), "list_alert_rules" (impact analysis), "list_recipient_groups" (find recipient groups).',
    annotations: {
      title: 'Update escalation chain',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to update',
        },
        name: {
          type: 'string',
          description: 'New name for the escalation chain',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        stages: {
          type: 'array',
          description: 'Updated array of escalation stages',
          items: { type: 'object', additionalProperties: true },
        },
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },
  {
    name: 'delete_escalation_chain',
    description: 'Delete an escalation chain from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS ALERT ROUTING** ' +
      '\n- Alert rules using this chain will stop sending notifications ' +
      '\n- Active alerts routed to this chain stop escalating ' +
      '\n- Cannot be undone - must recreate chain if needed ' +
      '\n- No alerts will be sent until rules updated to use different chain ' +
      '\n\n**What this does:** Permanently removes escalation chain. Alert rules referencing this chain lose their notification path and stop sending alerts. ' +
      '\n\n**When to use:**' +
      '\n- Consolidating duplicate chains' +
      '\n- Replacing with better-configured chain' +
      '\n- Team/process restructuring' +
      '\n- Cleanup unused chains' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- chainId: Escalation chain ID to delete (from "list_escalation_chains") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "list_alert_rules" with filter to find ALL rules using this chain ' +
      '2. Create/identify replacement escalation chain ' +
      '3. Update all alert rules to use new chain BEFORE deleting ' +
      '4. Verify no rules still reference this chain ' +
      '\n\n**Impact of deletion:** ' +
      '\n- **Alert Rules:** Rules using this chain stop sending notifications (silently!) ' +
      '\n- **Active Alerts:** In-progress escalations stop (no further stages notify) ' +
      '\n- **New Alerts:** Matched by broken rules but no notifications sent ' +
      '\n- **No Error:** System does not warn that notifications stopped ' +
      '\n\n**Safe deletion workflow:** ' +
      '\n\n**Step 1: Find affected alert rules** ' +
      'list_alert_rules() // Look for escalationChainId matching chain to delete ' +
      '\n\n**Step 2: Create/identify replacement chain** ' +
      'create_escalation_chain(name: "New On-Call") // Or use existing chain ID ' +
      '\n\n**Step 3: Update ALL alert rules FIRST** ' +
      'For each rule: update_alert_rule(ruleId: X, escalationChainId: NEW_CHAIN_ID) ' +
      '\n\n**Step 4: Verify no rules reference old chain** ' +
      'list_alert_rules() // Confirm no rules use old chainId ' +
      '\n\n**Step 5: Delete chain** ' +
      'delete_escalation_chain(chainId: OLD_CHAIN_ID) ' +
      '\n\n**Common scenarios:** ' +
      '\n\n**Replace on-call rotation chain:** ' +
      '1. Create new escalation chain with updated rotation ' +
      '2. Update all alert rules to new chain ' +
      '3. Test with sample alert ' +
      '4. Delete old chain once verified ' +
      '\n\n**Consolidate duplicate chains:** ' +
      '1. Identify chains doing same thing ' +
      '2. Choose one to keep (or create better one) ' +
      '3. Update rules using duplicate chains to use primary chain ' +
      '4. Delete duplicate chains ' +
      '\n\n**⚠️ NEVER delete escalation chain without updating alert rules first - notifications will silently stop!** ' +
      '\n\n**Best practice:** Always migrate alert rules to replacement chain BEFORE deleting old chain. ' +
      '\n\n**Related tools:** "list_alert_rules" (find usage), "update_alert_rule" (migrate rules), "create_escalation_chain" (create replacement).',
    annotations: {
      title: 'Delete escalation chain',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'The ID of the escalation chain to delete',
        },
      },
      additionalProperties: false,
      required: ['chainId'],
    },
  },

  // Recipient Groups
  {
    name: 'list_recipient_groups',
    description: 'List all recipient groups in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of recipient groups with: id, name, description, member count, recipients list. ' +
      '\n\n**What are recipient groups:** Collections of recipients treated as a single notification target. Simplify escalation chains by notifying entire teams at once. Example: "Database Team" group contains 5 team members - notify group = notify all 5. ' +
      '\n\n**When to use:**' +
      '\n- Find group IDs for escalation chains' +
      '\n- Audit team notification lists' +
      '\n- Review group membership before changes' +
      '\n- Simplify notification management' +
      '\n' +
      '\n\n**Benefits over individual recipients:** ' +
      '\n- **Easier management:** Update team once, applies to all escalation chains using that group ' +
      '\n- **Team notifications:** Notify entire team simultaneously ' +
      '\n- **Organized:** Group by function (DB team, Network team, On-call rotation) ' +
      '\n\n**Common recipient groups:** ' +
      '\n- "On-Call Engineers" - Current on-call rotation members ' +
      '\n- "Database Team" - All database administrators ' +
      '\n- "Network Operations" - NOC team members ' +
      '\n- "Management" - For escalation to leadership ' +
      '\n\n**Use cases:** ' +
      '\n- "Notify entire team for critical alerts" → Use group instead of 5 individual recipients ' +
      '\n- "Rotate on-call" → Update group members without touching escalation chains ' +
      '\n- "Add new team member" → Add to group, automatically included in alerts ' +
      '\n\n**Workflow:** Use this tool to find groups, then use in escalation chains to notify multiple people at once. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get_recipient_group" (details), "list_escalation_chains" (see usage).',
    annotations: {
      title: 'List recipient groups',
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
    name: 'get_recipient_group',
    description: 'Get detailed information about a specific recipient group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete recipient group details: name, description, list of all members (recipients), member contact info, escalation chains using this group. ' +
      '\n\n**When to use:**' +
      '\n- Review group membership before modifications' +
      '\n- Verify who gets notified through this group' +
      '\n- Check which escalation chains use this group' +
      '\n- Audit team notification lists' +
      '\n' +
      '\n\n**Key information returned:** ' +
      '\n- Members: All recipients in group (names, emails, phones) ' +
      '\n- Usage: Which escalation chains reference this group ' +
      '\n- Description: Purpose/team name ' +
      '\n\n**Before modifying group:** Review escalation chain usage to understand impact of changes. Removing member from group affects all chains using that group. ' +
      '\n\n**Workflow:** Use "list_recipient_groups" to find groupId, then use this tool to review membership before updating. ' +
      '\n\n**Related tools:** "list_recipient_groups" (find groups), "update_recipient_group" (modify), "list_escalation_chains" (see where used).',
    annotations: {
      title: 'Get recipient group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_recipient_group',
    description: 'Create a new recipient group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates collection of recipients treated as single notification target. Simplifies escalation chains by notifying entire teams at once instead of listing individual recipients. ' +
      '\n\n**When to use:**' +
      '\n- Set up team notifications (email entire team)' +
      '\n- Create on-call rotation groups' +
      '\n- Organize recipients by department/function' +
      '\n- Simplify escalation chain management' +
      '\n- Group multiple contact methods for redundancy' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Group name (e.g., "Database Team", "On-Call Engineers", "NOC Team") ' +
      '\n- recipients: Array of recipient IDs to include in group ' +
      '\n\n**Optional parameters:** ' +
      '\n- description: Group purpose/notes ' +
      '\n\n**Benefits of recipient groups:** ' +
      '\n- **Simpler management:** Update group once vs updating each escalation chain ' +
      '\n- **Team notifications:** Notify all 5 team members by referencing 1 group ' +
      '\n- **Easy rotation updates:** Swap group members without touching escalation chains ' +
      '\n- **Organized:** Group by function (database team, network team, managers) ' +
      '\n\n**Common group patterns:** ' +
      '\n\n**Team notification group:** ' +
      '{name: "Database Team", recipients: [1,2,3,4,5], description: "All database administrators"} ' +
      '// Notify entire team at once ' +
      '\n\n**On-call rotation group:** ' +
      '{name: "Current On-Call", recipients: [10,11], description: "This week\'s on-call engineers"} ' +
      '// Update recipients weekly for rotation ' +
      '\n\n**Multi-channel redundancy group:** ' +
      '{name: "John Doe - All Contacts", recipients: [emailId, smsId, voiceId]} ' +
      '// Email + SMS + Voice for same person ' +
      '\n\n**Escalation level groups:** ' +
      '{name: "Management", recipients: [20,21,22], description: "Engineering managers"} ' +
      '{name: "Executives", recipients: [30,31], description: "CTO, VP Engineering"} ' +
      '\n\n**Department groups:** ' +
      '{name: "Network Operations", recipients: [40,41,42,43]} ' +
      '{name: "Server Team", recipients: [50,51,52]} ' +
      '{name: "Security Team", recipients: [60,61]} ' +
      '\n\n**Workflow example:** ' +
      '1. Create individual recipients for team members ' +
      '2. Create recipient group containing all members ' +
      '3. Use group in escalation chain (simpler than listing 5 individuals) ' +
      '4. Update group membership when team changes (escalation chains unchanged) ' +
      '\n\n**On-call rotation workflow:** ' +
      '1. Create "On-Call This Week" group ' +
      '2. Initially: Add current on-call person ' +
      '3. Use group in escalation chains ' +
      '4. Weekly: Update group members (swap old/new on-call) ' +
      '5. Escalation chains automatically use new on-call person ' +
      '\n\n**Best practices:** ' +
      '\n- Descriptive names: "Team Name - Purpose" ' +
      '\n- One group per team/function ' +
      '\n- Use groups in escalation chains instead of individual recipients ' +
      '\n- Keep groups small (3-10 members) for manageability ' +
      '\n- Document group purpose in description ' +
      '\n\n**Related tools:** "update_recipient_group" (change members), "create_escalation_chain" (use groups).',
    annotations: {
      title: 'Create recipient group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the recipient group',
        },
        description: {
          type: 'string',
          description: 'Description of the group',
        },
        recipientIds: {
          type: 'array',
          description: 'Array of recipient IDs to include in this group',
          items: { type: 'number' },
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_recipient_group',
    description: 'Update an existing recipient group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group membership, name, or description. Changes affect all escalation chains using this group immediately. ' +
      '\n\n**When to use:**' +
      '\n- Update on-call rotation (swap team members)' +
      '\n- Add new team members to notifications' +
      '\n- Remove departed employees' +
      '\n- Reorganize team structure' +
      '\n- Rename group' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Recipient group ID (from "list_recipient_groups") ' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New group name ' +
      '\n- description: Updated description ' +
      '\n- recipients: New array of recipient IDs (replaces all members) ' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Update on-call rotation:** ' +
      '{groupId: 123, recipients: [newOnCallId1, newOnCallId2]} // Swap weekly rotation ' +
      '\n\n**Add new team member:** ' +
      '{groupId: 123, recipients: [1,2,3,4,5,6]} // Added recipient 6 ' +
      '\n\n**Remove departed employee:** ' +
      '{groupId: 123, recipients: [1,2,4,5]} // Removed recipient 3 ' +
      '\n\n**Rename group:** ' +
      '{groupId: 123, name: "Database Team - Updated"} ' +
      '\n\n**⚠️ Important:** ' +
      '\n- All escalation chains using this group immediately use new members ' +
      '\n- Removing member: They stop receiving notifications ' +
      '\n- Adding member: They start receiving notifications ' +
      '\n\n**Best practice workflow:** ' +
      '1. Use "get_recipient_group" to see current members ' +
      '2. Update group with new membership ' +
      '3. Changes take effect for next alerts ' +
      '\n\n**Related tools:** "get_recipient_group" (review), "list_recipient_groups" (find group).',
    annotations: {
      title: 'Update recipient group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
        recipientIds: {
          type: 'array',
          description: 'Updated array of recipient IDs',
          items: { type: 'number' },
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_recipient_group',
    description: 'Delete a recipient group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: BREAKS ESCALATION CHAINS** ' +
      '\n- Escalation chains using this group stop notifying those members ' +
      '\n- No error or warning shown ' +
      '\n- Notifications silently fail for stages using this group ' +
      '\n- Cannot be undone ' +
      '\n\n**What this does:** Permanently removes recipient group. Escalation chains referencing this group lose that notification path. ' +
      '\n\n**When to use:**' +
      '\n- Team dissolved/restructured' +
      '\n- Consolidating duplicate groups' +
      '\n- Replacing with individual recipients' +
      '\n- Cleanup unused groups' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Recipient group ID to delete (from "list_recipient_groups") ' +
      '\n\n**Before deleting - CRITICAL CHECKS:** ' +
      '1. Use "list_escalation_chains" to find chains using this group ' +
      '2. Create replacement group or identify individual recipients ' +
      '3. Update all escalation chains BEFORE deleting group ' +
      '4. Verify no chains reference this group ' +
      '\n\n**Impact of deletion:** ' +
      '\n- Escalation chain stages with this group stop sending notifications ' +
      '\n- No error - notifications silently fail ' +
      '\n- Individual recipients NOT deleted (just group container removed) ' +
      '\n\n**Safe deletion workflow:** ' +
      '1. Find which escalation chains use this group ' +
      '2. Create new group or identify replacement recipients ' +
      '3. Update all escalation chains to use replacement ' +
      '4. Verify updated ' +
      '5. Delete old group ' +
      '\n\n**Best practice:** Migrate escalation chains to replacement group/recipients BEFORE deleting to prevent notification gaps. ' +
      '\n\n**Related tools:** "list_escalation_chains" (find usage), "create_recipient_group" (replacement), "update_escalation_chain" (migrate).',
    annotations: {
      title: 'Delete recipient group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the recipient group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

];
