import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const dashboardsTools: Tool[] = [
  // Dashboard Tools
  {
    name: 'list_dashboards',
    description: 'List all dashboards in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of dashboards with: id, name, description, groupId, groupName, widget count, owner. ' +
      '\n\n**When to use:** ' +
      '\n- Find AWS/Azure/infrastructure dashboards' +
      '\n- Discover available pre-built dashboards' +
      '\n- Get dashboard IDs for generating links' +
      '\n- List dashboards in specific group' +
      '\n\n**Common filter patterns:** ' +
      '\n- By name: filter:"name\\~\\*AWS\\*" (find all AWS dashboards)' +
      '\n- By group: filter:"groupId:5" or filter:"groupName\\~\\*Cloud\\*"' +
      '\n- By owner: filter:"owner:john.doe"' +
      '\n\n**Next step:** Use "generate\\_dashboard\\_link" with the dashboard ID to get the full clickable URL for sharing. ' +
      '\n\n**Tip:** Dashboards are organized in groups. Use "list\\_dashboard\\_groups" to browse the hierarchy. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_dashboard" (details), "generate\\_dashboard\\_link" (get URL), "list\\_dashboard\\_groups" (browse hierarchy).',
    annotations: {
      title: 'List dashboards',
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
    name: 'get_dashboard',
    description: 'Get detailed information about a specific dashboard by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete dashboard details: name, description, groupId, owner, widgets configuration, widget count, sharing settings, template variables, last modified. ' +
      '\n\n**When to use:** ' +
      '\n- Review dashboard configuration' +
      '\n- See widget definitions before cloning' +
      '\n- Check dashboard owner' +
      '\n- Verify template variables' +
      '\n- Get dashboard metadata' +
      '\n\n**What you get:** ' +
      '\n- widgetsConfig: JSON configuration of all widgets (chart types, metrics, thresholds)' +
      '\n- widgetTokens: Template variables (e.g., defaultDeviceGroup for dynamic filtering)' +
      '\n- groupId/groupName: Which folder dashboard is in' +
      '\n- sharable: Whether dashboard is public/private' +
      '\n\n**Use cases:** ' +
      '\n- Clone dashboard to create similar one' +
      '\n- Export dashboard configuration for backup' +
      '\n- Audit which resources/devices/metrics are being visualized' +
      '\n- Document dashboard purpose and widgets' +
      '\n\n**Workflow:** Use "list\\_dashboards" to find dashboardId, then get details, then "generate\\_dashboard\\_link" to get shareable URL. ' +
      '\n\n**Related tools:** "list\\_dashboards" (find dashboard), "generate\\_dashboard\\_link" (get URL), "update\\_dashboard" (modify), "list\\_dashboard\\_groups" (browse folders).',
    annotations: {
      title: 'Get dashboard details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'create_dashboard',
    description: 'Create a new dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a new visual monitoring dashboard with widgets for metrics, alerts, maps, and more. Dashboards provide at-a-glance views of infrastructure health. ' +
      '\n\n**When to use:** ' +
      '\n- Build custom monitoring views for teams' +
      '\n- Create executive summary dashboards' +
      '\n- Visualize specific applications/services' +
      '\n- Set up NOC/SOC displays' +
      '\n- Share monitoring data with stakeholders' +
      '\n\n**Required parameters:** ' +
      '\n- name: Dashboard name (e.g., "Production Infrastructure", "Executive Summary")' +
      '\n\n**Optional parameters:** ' +
      '\n- groupId: Dashboard folder ID (from "list\\_dashboard\\_groups", use 1 for root)' +
      '\n- description: Dashboard purpose/audience' +
      '\n- widgetsConfig: JSON array of widget configurations (graphs, alerts, gauges, maps)' +
      '\n- sharable: true (public link) or false (private, login required)' +
      '\n- widgetTokens: Template variables for dynamic filtering' +
      '\n\n**Dashboard workflow:** ' +
      '\n- Create empty dashboard with name and folder' +
      '\n- Use LogicMonitor UI to add widgets visually (easier than JSON)' +
      '\n- Use "get\\_dashboard" to export widgetsConfig for cloning' +
      '\n- Use "generate\\_dashboard\\_link" to get shareable URL' +
      '\n\n**Common dashboard types:** ' +
      '\n\n**NOC/SOC Dashboard:** ' +
      '\n- Alert widgets showing critical alerts' +
      '\n- Gauge widgets for key metrics (CPU, memory, bandwidth)' +
      '\n- Maps showing geographic resource/device status' +
      '\n- SLA widgets showing availability percentages' +
      '\n\n**Executive Dashboard:** ' +
      '\n- High-level availability metrics' +
      '\n- Alert counts by severity' +
      '\n- Service health status' +
      '\n- Trend graphs (week/month comparisons)' +
      '\n\n**Application Dashboard:** ' +
      '\n- App server metrics (response time, throughput)' +
      '\n- Database performance (queries/sec, connection pools)' +
      '\n- Load balancer health' +
      '\n- Error rate trends' +
      '\n\n**Best practices:** ' +
      '\n- Start simple - create dashboard, add widgets in UI' +
      '\n- Use groups to organize dashboards by team/function' +
      '\n- Make critical dashboards "sharable" for NOC displays' +
      '\n- Use widgetTokens for dynamic filtering (##defaultDeviceGroup##)' +
      '\n- Clone existing dashboards using "get\\_dashboard" widgetsConfig' +
      '\n\n**After creation:** Use "generate\\_dashboard\\_link" to get the full URL for sharing or embedding. ' +
      '\n\n**Related tools:** "generate\\_dashboard\\_link" (get URL), "list\\_dashboards" (browse existing), "get\\_dashboard" (export for cloning), "update\\_dashboard" (modify).',
    annotations: {
      title: 'Create dashboard',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the dashboard',
        },
        description: {
          type: 'string',
          description: 'Description of the dashboard',
        },
        groupId: {
          type: 'number',
          description: 'Dashboard group ID',
        },
        widgetsConfig: {
          type: 'string',
          description: 'JSON string of widget configuration',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_dashboard',
    description: 'Update an existing dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify dashboard name, description, widgets, sharing settings, or move to different folder. ' +
      '\n\n**When to use:** ' +
      '\n- Rename dashboard' +
      '\n- Update dashboard description' +
      '\n- Move to different folder' +
      '\n- Change sharing settings' +
      '\n- Bulk update widgets (advanced)' +
      '\n\n**Required parameters:** ' +
      '\n- id: Dashboard ID (from "list\\_dashboards")' +
      '\n\n**Optional parameters (what to change):** ' +
      '\n- name: New dashboard name' +
      '\n- description: Updated description' +
      '\n- groupId: Move to different dashboard folder' +
      '\n- sharable: true (make public) or false (require login)' +
      '\n- widgetsConfig: JSON widget configuration (advanced - usually modify in UI)' +
      '\n- widgetTokens: Update template variables' +
      '\n\n**Common update scenarios:** ' +
      '\n\n**Rename dashboard:** ' +
      '{id: 123, name: "Production - Updated"}' +
      '\n\n**Move to different folder:** ' +
      '{id: 123, groupId: 456}' +
      '\n\n**Make dashboard public (shareable):** ' +
      '{id: 123, sharable: true}' +
      '\n\n**Update description:** ' +
      '{id: 123, description: "Executive view - updated quarterly"}' +
      '\n\n**⚠️ Widget updates:** ' +
      'Updating widgetsConfig directly is complex (large JSON). Easier to: ' +
      '\n- Modify widgets in LogicMonitor UI' +
      '\n- Use API only for name/description/folder changes' +
      '\n- Or use "get\\_dashboard" to export, modify JSON, then update' +
      '\n\n**Best practice:** Use "get\\_dashboard" first to see current configuration, then update specific fields. ' +
      '\n\n**After update:** Use "generate\\_dashboard\\_link" to get updated URL if needed. ' +
      '\n\n**Related tools:** "get\\_dashboard" (review before update), "list\\_dashboards" (find dashboard), "generate\\_dashboard\\_link" (get new URL).',
    annotations: {
      title: 'Update dashboard',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to update',
        },
        name: {
          type: 'string',
          description: 'New name for the dashboard',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'delete_dashboard',
    description: 'Delete a dashboard from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION** ' +
      '\n- Dashboard and all widgets are permanently removed' +
      '\n- Shared dashboard links will stop working' +
      '\n- Users with bookmarks will get 404 errors' +
      '\n- Cannot be undone - no recovery possible' +
      '\n\n**What this does:** Permanently removes dashboard from LogicMonitor. All widgets, configuration, and sharing links are deleted. ' +
      '\n\n**When to use:** ' +
      '\n- Remove outdated dashboards' +
      '\n- Clean up duplicates' +
      '\n- Delete test/temporary dashboards' +
      '\n- Consolidate similar dashboards' +
      '\n\n**Required parameters:** ' +
      '\n- id: Dashboard ID to delete (from "list\\_dashboards")' +
      '\n\n**Before deleting - check:** ' +
      '\n- Use "get\\_dashboard" to verify it\'s the correct dashboard' +
      '\n- Check if dashboard is widely shared/used' +
      '\n- Consider exporting configuration for backup (via "get\\_dashboard")' +
      '\n- Notify users if it\'s a team dashboard' +
      '\n\n**Impact of deletion:** ' +
      '\n- NOC/SOC displays showing this dashboard will break' +
      '\n- Embedded dashboard iframes will show errors' +
      '\n- Users\' custom home dashboards may need reconfiguration' +
      '\n- Shared public links become invalid' +
      '\n\n**Alternatives to deletion:** ' +
      '\n- Rename to "ARCHIVED - [name]" instead of deleting' +
      '\n- Move to "Archived" folder' +
      '\n- Make private (sharable: false) instead of deleting' +
      '\n- Export configuration via "get\\_dashboard" before deleting' +
      '\n\n**Best practice:** Export dashboard configuration before deletion in case you need to recreate it. ' +
      '\n\n**Workflow:** Use "get\\_dashboard" to backup/verify, then delete. ' +
      '\n\n**Related tools:** "get\\_dashboard" (backup before delete), "list\\_dashboards" (find dashboard), "update\\_dashboard" (archive instead of delete).',
    annotations: {
      title: 'Delete dashboard',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to delete',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },

  // Dashboard Link Tools
  {
    name: 'generate_dashboard_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) dashboard. ' +
      `\n\n**Returns:** Complete dashboard URL with full group hierarchy path, dashboard details (id, name, groupName), and group path array. URL pattern: https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-{path},dashboards-{id}` +
      '\n\n**When to use:** ' +
      '\n- Share dashboard links in Slack/email/tickets' +
      '\n- Create documentation with direct dashboard links' +
      '\n- Embed dashboard URLs in runbooks' +
      '\n- Build custom reports with clickable links' +
      '\n\n**Why use this:** Provides the complete navigable URL including all parent group IDs, so the link opens the dashboard in correct context within the UI navigation tree. ' +
      '\n\n**Workflow:** First use "list\\_dashboards" to find dashboard ID, then use this tool to generate the shareable link. ' +
      '\n\n**Related tools:** "list\\_dashboards" (find dashboard), "get\\_dashboard" (get details).',
    annotations: {
      title: 'Generate dashboard link',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'generate_resource_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) resource/device. ' +
      `\n\n**Returns:** Complete resource URL plus resource/device details (id, name, displayName). URL pattern: https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/resources/treeNodes/t-d,id-{deviceId}?source=details` +
      '\n\n**When to use:** ' +
      '\n- Share resource/device links in incident tickets' +
      '\n- Create alert notifications with resource/device links' +
      '\n- Build reports with clickable resource/device references' +
      '\n- Document infrastructure with direct LM links' +
      '\n\n**Why use this:** Provides the canonical resource details URL so clicking the link navigates directly to the resource/device details view. ' +
      '\n\n**Workflow:** First find resource/device using "list\\_resources" or "search\\_resources", then use this tool with deviceId to generate shareable link. ' +
      '\n\n**Related tools:** "list\\_resources" (find device), "get\\_resource" (get details), "generate\\_alert\\_link" (link to resource/device alerts).',
    annotations: {
      title: 'Generate resource/device link',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: {
          type: 'number',
          description: 'The ID of the resource/device to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['deviceId'],
    },
  },
  {
    name: 'generate_alert_link',
    description: 'Generate a direct URL/link/weburl for a LogicMonitor (LM) alert. ' +
      `\n\n**Returns:** Direct URL to alert details page. URL pattern: https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/alerts/{alertId}` +
      '\n\n**When to use:** ' +
      '\n- Include alert links in Slack/PagerDuty notifications' +
      '\n- Share alert context with team members' +
      '\n- Create incident tickets with direct alert references' +
      '\n- Build alert reports with clickable links' +
      '\n\n**Why use this:** Simplifies alert investigation by providing direct navigation to the alert details page with full context, history, and acknowledgement options. ' +
      '\n\n**Workflow:** Get alertId from "list\\_alerts", then use this tool to generate the shareable link for team collaboration. ' +
      '\n\n**Related tools:** "list\\_alerts" (find alerts), "get\\_alert" (get details), "acknowledge\\_alert" (acknowledge).',
    annotations: {
      title: 'Generate alert link',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The ID of the alert to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['alertId'],
    },
  },

  // Generate Link Group Tools
  {
    name: 'generate_website_link',
    description: 'Generate a direct direct URL/link/weburl for a LogicMonitor (LM) website monitor with full hierarchy path for easy sharing and navigation. ' +
      '\n\n**What this does:** Creates shareable URL that opens specific website monitor in LogicMonitor UI, preserving the full folder hierarchy path. Link works for anyone with access to the LogicMonitor portal. ' +
      `\n\n**Returns:** Complete URL in format: https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/websites/treeNodes#websiteGroups-{groupId1},websiteGroups-{groupId2},...,websites-{websiteId} ` +
      '\n\n**When to use:** ' +
      '\n- Share website monitor with team (Slack/email/tickets)' +
      '\n- Create documentation with direct links' +
      '\n- Build custom dashboards/reports with LM links' +
      '\n- Reference in incident tickets' +
      '\n- Bookmark frequently accessed monitors' +
      '\n\n**Required parameters:** ' +
      '\n- websiteId: Website monitor ID (from "list\\_websites" or "search\\_websites")' +
      '\n\n**Common use cases:** ' +
      '\n\n**Share in Slack/Teams:** ' +
      '"Production API health check is failing: [View Monitor](generated-url-here)" ' +
      '\n\n**Incident ticket documentation:** ' +
      '"INC-12345: Website monitor showing SSL certificate expiring in 7 days. See: {generated-url}" ' +
      '\n\n**Runbook links:** ' +
      '"If homepage monitoring alerts, check: {generated-url-for-homepage-monitor}" ' +
      '\n\n**Custom reporting:** ' +
      'Build report that includes clickable links to each website monitor for quick access. ' +
      '\n\n**Link structure explained:** ' +
      'The URL includes complete folder path (websiteGroups) so when clicked, the UI shows: ' +
      '\n- Full breadcrumb navigation (e.g., "All Website Monitors > Production > External APIs > Homepage Check")' +
      '\n- Website monitor details page' +
      '\n- Recent check history and availability' +
      '\n- Current status and response times' +
      '\n\n**Why use generated links:** ' +
      '\n- **Shareable:** Send exact monitor to teammates' +
      '\n- **Bookmarkable:** Save frequent monitors for quick access' +
      '\n- **Integration-friendly:** Use in external tools, tickets, wikis' +
      '\n- **Context-preserving:** Shows full folder hierarchy when opened' +
      '\n\n**Workflow example:** ' +
      '\n- Find website monitor: list_websites() → websiteId: 789' +
      '\n- Generate link: generate_website_link(websiteId: 789)' +
      '\n- Share link: "Check this monitor: https://company.logicmonitor.com/santaba/uiv4/websites/..."' +
      '\n\n**Access requirements:** ' +
      'Link recipients must: ' +
      '\n- Have LogicMonitor user account' +
      '\n- Have permissions to view website monitors' +
      '\n- Have access to specific website monitor (based on access groups)' +
      '\n\n**Best practices:** ' +
      '\n- Use in incident documentation for traceability' +
      '\n- Include in runbooks for quick troubleshooting access' +
      '\n- Add to monitoring dashboards for drill-down capability' +
      '\n- Share with stakeholders who have LM access' +
      '\n\n**Related tools:** "list\\_websites" (find website), "get\\_website" (verify details), "generate\\_dashboard\\_link" (for dashboards), "generate\\_resource\\_link" (for resources/devices), "generate\\_alert\\_link" (for alerts).',
    annotations: {
      title: 'Generate website monitor link',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        websiteId: {
          type: 'number',
          description: 'The ID of the website monitor to generate a link for',
        },
      },
      additionalProperties: false,
      required: ['websiteId'],
    },
  },
  {
    name: 'list_dashboard_groups',
    description: 'List all dashboard groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of dashboard groups with: id, name, parentId, full path, description, number of dashboards, number of subgroups, owner. ' +
      '\n\n**What are dashboard groups:** Organizational folders for dashboards, like directories in a file system. Used to organize dashboards by team, function, or application. ' +
      '\n\n**When to use:** ' +
      '\n- Browse dashboard organization before creating/moving dashboards' +
      '\n- Find group IDs for dashboard operations' +
      '\n- Understand dashboard hierarchy' +
      '\n- Navigate to specific dashboard folders' +
      '\n\n**Common organization patterns:** ' +
      '\n- By team: "Platform Team", "Database Team", "Network Team"' +
      '\n- By environment: "Production", "Staging", "Development"' +
      '\n- By application: "Web App", "API Services", "Background Jobs"' +
      '\n- By cloud provider: "AWS Dashboards", "Azure Dashboards"' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list\\_dashboards" filtered by groupId to see dashboards in specific folder. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_dashboard\\_group" (details), "list\\_dashboards" (dashboards in group), "create\\_dashboard\\_group" (create folder).',
    annotations: {
      title: 'List dashboard groups',
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
    name: 'get_dashboard_group',
    description: 'Get detailed information about a specific dashboard group by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete dashboard group details: name, full path, parentId, description, number of dashboards (direct and total), number of subgroups, owner, permissions. ' +
      '\n\n**When to use:** ' +
      '\n- Get group path for documentation' +
      '\n- Check group membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Review permissions before creating dashboards in it' +
      '\n\n**Workflow:** Use "list\\_dashboard\\_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list\\_dashboard\\_groups" (find groups), "list\\_dashboards" (dashboards in group), "create\\_dashboard\\_group" (create new).',
    annotations: {
      title: 'Get dashboard group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the dashboard group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_dashboard_group',
    description: 'Create a new dashboard group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a folder to organize dashboards into a hierarchy. ' +
      '\n\n**Required:** name. ' +
      '\n\n**Optional:** description, parentId (defaults to root group 1 if omitted), plus widgetTokens/template via `config`. ' +
      '\n\n**Related tools:** "list\\_dashboard\\_groups", "create\\_dashboard" (place dashboards in the group).',
    annotations: { title: 'Create dashboard group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The dashboard group name' },
        description: { type: 'string', description: 'The dashboard group description' },
        parentId: { type: 'number', description: 'The parent dashboard group ID (root = 1)' },
        config: {
          type: 'object',
          description: 'Additional dashboard group attributes (e.g., widgetTokens, template) merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_dashboard_group',
    description: 'Update a dashboard group in LogicMonitor (LM) monitoring. ' +
      '\n\n**Parameters:** groupId plus any of name, description, parentId (move the group), or additional fields via `config`. Partial update. ' +
      '\n\n**Related tools:** "get\\_dashboard\\_group", "list\\_dashboard\\_groups".',
    annotations: { title: 'Update dashboard group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The dashboard group ID to update' },
        name: { type: 'string', description: 'New dashboard group name' },
        description: { type: 'string', description: 'New description' },
        parentId: { type: 'number', description: 'Move the group under a different parent group ID' },
        config: {
          type: 'object',
          description: 'Additional dashboard group attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_dashboard_group',
    description: 'Delete a dashboard group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Deleting a non-empty group (with dashboards or subgroups) requires allowNonEmptyGroup=true and will remove its contents. Cannot be undone. ' +
      '\n\n**Parameters:** groupId; optional allowNonEmptyGroup (default false). ' +
      '\n\n**Before deleting:** Use "get\\_dashboard\\_group" to check dashboard/subgroup counts. ' +
      '\n\n**Related tools:** "get\\_dashboard\\_group", "list\\_dashboard\\_groups".',
    annotations: { title: 'Delete dashboard group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The dashboard group ID to delete' },
        allowNonEmptyGroup: { type: 'boolean', description: 'Allow deleting a group that still contains dashboards/subgroups (default false).' },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'clone_dashboard_group',
    description: 'Clone a dashboard group (and optionally its contents) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Asynchronously copies an existing dashboard group into a new group. ' +
      '\n\n**Parameters:** groupId (source group), a `config` describing the new group (at least `name`, and `parentId` for placement), and optional recursive (clone subgroups/dashboards too). ' +
      '\n\n**Related tools:** "create\\_dashboard\\_group", "get\\_dashboard\\_group".',
    annotations: { title: 'Clone dashboard group', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: { type: 'number', description: 'The source dashboard group ID to clone' },
        config: {
          type: 'object',
          description: 'Definition of the new (cloned) group (e.g., name, parentId, description).',
          additionalProperties: true,
        },
        recursive: { type: 'boolean', description: 'Also clone subgroups and dashboards (default false).' },
      },
      additionalProperties: false,
      required: ['groupId', 'config'],
    },
  },

  // Default Dashboard
  {
    name: 'update_default_dashboard',
    description: 'Update the default dashboard preference (user data) in LogicMonitor (LM). Uses PATCH semantics; provide changed fields via "config".',
    annotations: { title: 'Update default dashboard', readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        userDataId: { type: 'string', description: 'The user data ID (e.g., defaultDashboardId).' },
        config: { type: 'object', additionalProperties: true, description: 'Fields to update (e.g., value/dashboardId).' },
      },
      additionalProperties: false,
      required: ['userDataId', 'config'],
    },
  },

  // Dashboard Widget Tools
  {
    name: 'list_widgets',
    description: 'List dashboard widgets across all dashboards in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of widgets, each with: id, name, type, dashboardId, description, theme, interval (refresh, minutes), timescale, lastUpdatedOn, lastUpdatedBy. ' +
      '\n\n**What are widgets:** Individual visual components on a dashboard - graphs, alert tables, gauges, big numbers, maps, pie charts, SLA widgets, NOC widgets, etc. ' +
      '\n\n**When to use:**' +
      '\n- Inventory all widgets in your portal' +
      '\n- Find widgets of a particular type or name' +
      '\n- Locate a widget id to inspect or modify' +
      '\n\n**Tip:** To list widgets belonging to one dashboard, use "list\\_dashboard\\_widgets" instead. ' +
      '\n\n**Related tools:** "list\\_dashboard\\_widgets" (widgets of one dashboard), "get\\_widget" (details), "get\\_widget\\_data" (rendered data).',
    annotations: {
      title: 'List widgets',
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
    name: 'list_dashboard_widgets',
    description: 'List all widgets that belong to a specific dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of widgets on the dashboard with: id, name, type, dashboardId, description, theme, interval, timescale. ' +
      '\n\n**When to use:**' +
      '\n- See the contents of a dashboard before editing' +
      '\n- Enumerate widgets to clone or reorganize' +
      '\n- Find a widget id within a known dashboard' +
      '\n\n**Required parameters:**' +
      '\n- dashboardId: The dashboard ID (from "list\\_dashboards")' +
      '\n\n**Related tools:** "list\\_dashboards" (find dashboard IDs), "get\\_widget" (widget details), "create\\_widget" (add a widget to this dashboard).',
    annotations: {
      title: 'List widgets on a dashboard',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard whose widgets to list (from "list_dashboards").',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['dashboardId'],
    },
  },
  {
    name: 'get_widget',
    description: 'Get detailed configuration for a specific dashboard widget in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Full widget object including type-specific configuration (e.g., graph datapoints, alert filters, gauge thresholds), name, type, dashboardId, description, theme, interval, timescale, and timestamps. ' +
      '\n\n**When to use:**' +
      '\n- Inspect a widget\'s configuration' +
      '\n- Export a widget\'s config to clone it (the returned object can be adapted and passed to "create\\_widget")' +
      '\n- Discover the type-specific attributes required for "create\\_widget"/"update\\_widget"' +
      '\n\n**Required parameters:**' +
      '\n- widgetId: The widget ID (from "list\\_widgets" or "list\\_dashboard\\_widgets")' +
      '\n\n**Related tools:** "get\\_widget\\_data" (rendered data values), "update\\_widget" (modify), "create\\_widget" (clone).',
    annotations: {
      title: 'Get widget details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        widgetId: {
          type: 'number',
          description: 'The ID of the widget to retrieve.',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['widgetId'],
    },
  },
  {
    name: 'get_widget_data',
    description: 'Get the rendered data for a specific dashboard widget in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** The widget\'s computed data payload. The shape depends on the widget type (e.g., graph series/datapoints, alert lists, big-number values, gauge readings). ' +
      '\n\n**What this does:** Unlike "get\\_widget" (which returns configuration), this returns the actual values the widget would display, optionally for a specific time range. ' +
      '\n\n**When to use:**' +
      '\n- Read current metric values shown by a graph/gauge/big-number widget' +
      '\n- Pull widget data for a custom time window' +
      '\n- Feed dashboard data into downstream analysis' +
      '\n\n**Required parameters:**' +
      '\n- widgetId: The widget ID (from "list\\_widgets")' +
      '\n\n**Optional parameters:**' +
      '\n- start: Start of the time range, in epoch seconds' +
      '\n- end: End of the time range, in epoch seconds' +
      '\n- format: Response format for the data payload' +
      '\n\n**Related tools:** "get\\_widget" (configuration), "list\\_widgets" (find widget IDs).',
    annotations: {
      title: 'Get widget data',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        widgetId: {
          type: 'number',
          description: 'The ID of the widget whose data to retrieve.',
        },
        start: {
          type: 'number',
          description: 'Start of the time range, in epoch seconds (optional).',
        },
        end: {
          type: 'number',
          description: 'End of the time range, in epoch seconds (optional).',
        },
        format: {
          type: 'string',
          description: 'Optional response format for the widget data payload.',
        },
      },
      additionalProperties: false,
      required: ['widgetId'],
    },
  },
  {
    name: 'create_widget',
    description: 'Create a new widget on a dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Adds a visual component (graph, alert table, gauge, big number, map, pie chart, SLA, NOC, etc.) to an existing dashboard. ' +
      '\n\n**Required parameters:**' +
      '\n- dashboardId: The dashboard to add the widget to (from "list\\_dashboards")' +
      '\n- name: The widget name' +
      '\n- type: The widget type. One of: alert, batchjob, flash, gmap, ngraph, ograph, cgraph, sgraph, netflowgraph, groupNetflowGraph, netflow, groupNetflow, html, bigNumber, gauge, pieChart, table, dynamicTable, deviceSLA, text, statsd, deviceStatus, serviceAlert, noc, websiteOverview, websiteOverallStatus, websiteIndividualStatus, websiteSLA, savedMap.' +
      '\n\n**Optional parameters:**' +
      '\n- description: Widget description' +
      '\n- theme: Color scheme (e.g., newBorderBlue, solidGray, simplePurple)' +
      '\n- interval: Refresh interval in minutes' +
      '\n- timescale: Default timescale of the widget' +
      '\n- config: An object with type-specific attributes (merged into the widget body). Different widget types require different attributes.' +
      '\n\n**⚠️ Widget configuration is type-specific and can be complex.** The easiest reliable workflow is: ' +
      '\n1. Create a widget of the desired type in the LogicMonitor UI (or find an existing one) ' +
      '\n2. Call "get\\_widget" to export its full configuration ' +
      '\n3. Adapt that configuration and pass the type-specific fields via "config" here ' +
      '\n\n**Related tools:** "get\\_widget" (export a template), "list\\_dashboards" (find dashboardId), "update\\_widget" (modify), "delete\\_widget" (remove).',
    annotations: {
      title: 'Create widget',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        dashboardId: {
          type: 'number',
          description: 'The ID of the dashboard the widget belongs to.',
        },
        name: {
          type: 'string',
          description: 'The name of the widget.',
        },
        type: {
          type: 'string',
          description: 'The widget type (e.g., "alert", "cgraph", "bigNumber", "gauge", "table", "pieChart", "noc", "text", "deviceSLA"). See tool description for the full list.',
        },
        description: {
          type: 'string',
          description: 'The description of the widget.',
        },
        theme: {
          type: 'string',
          description: 'The color scheme of the widget (e.g., "newBorderBlue", "solidGray").',
        },
        interval: {
          type: 'number',
          description: 'The refresh interval of the widget, in minutes.',
        },
        timescale: {
          type: 'string',
          description: 'The default timescale of the widget.',
        },
        config: {
          type: 'object',
          description: 'Type-specific widget configuration attributes, merged into the widget body. ' +
            'Use "get_widget" on an existing widget of the same type to discover the required attributes.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['dashboardId', 'name', 'type'],
    },
  },
  {
    name: 'update_widget',
    description: 'Update an existing dashboard widget in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies a widget\'s name, description, theme, refresh interval, timescale, dashboard placement, or type-specific configuration. Uses a partial update (only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- widgetId: The widget ID to update (from "list\\_widgets" or "list\\_dashboard\\_widgets")' +
      '\n\n**Optional parameters (what to change):**' +
      '\n- name: New widget name' +
      '\n- description: New description' +
      '\n- theme: New color scheme' +
      '\n- interval: New refresh interval (minutes)' +
      '\n- timescale: New default timescale' +
      '\n- dashboardId: Move the widget to a different dashboard' +
      '\n- type: The widget type (some configuration changes require the type)' +
      '\n- config: An object with type-specific attributes to update (merged into the widget body)' +
      '\n\n**Best practice:** Call "get\\_widget" first to review the current configuration, then send only the fields you want to change. For complex type-specific edits, export via "get\\_widget", adapt, and pass through "config". ' +
      '\n\n**Related tools:** "get\\_widget" (review before update), "list\\_widgets" (find widget), "delete\\_widget" (remove).',
    annotations: {
      title: 'Update widget',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        widgetId: {
          type: 'number',
          description: 'The ID of the widget to update.',
        },
        name: {
          type: 'string',
          description: 'New name for the widget.',
        },
        description: {
          type: 'string',
          description: 'New description for the widget.',
        },
        theme: {
          type: 'string',
          description: 'New color scheme for the widget.',
        },
        interval: {
          type: 'number',
          description: 'New refresh interval, in minutes.',
        },
        timescale: {
          type: 'string',
          description: 'New default timescale for the widget.',
        },
        dashboardId: {
          type: 'number',
          description: 'Move the widget to a different dashboard by ID.',
        },
        type: {
          type: 'string',
          description: 'The widget type (required by the API for some configuration changes).',
        },
        config: {
          type: 'object',
          description: 'Type-specific widget configuration attributes to update, merged into the widget body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['widgetId'],
    },
  },
  {
    name: 'delete_widget',
    description: 'Delete a widget from a dashboard in LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION**' +
      '\n- The widget and its configuration are permanently removed from the dashboard' +
      '\n- Cannot be undone - no recovery possible' +
      '\n\n**What this does:** Permanently removes a single widget from its dashboard. The dashboard itself is not deleted. ' +
      '\n\n**Required parameters:**' +
      '\n- widgetId: The widget ID to delete (from "list\\_widgets" or "list\\_dashboard\\_widgets")' +
      '\n\n**Before deleting:**' +
      '\n- Use "get\\_widget" to verify it is the correct widget' +
      '\n- Consider exporting its configuration via "get\\_widget" for backup' +
      '\n\n**Related tools:** "get\\_widget" (backup/verify before delete), "list\\_dashboard\\_widgets" (find widget), "update\\_widget" (modify instead of delete).',
    annotations: {
      title: 'Delete widget',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        widgetId: {
          type: 'number',
          description: 'The ID of the widget to delete.',
        },
      },
      additionalProperties: false,
      required: ['widgetId'],
    },
  },
];
