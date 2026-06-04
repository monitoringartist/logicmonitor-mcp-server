import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const reportsTools: Tool[] = [
  // Report Tools
  {
    name: 'list_reports',
    description: 'List all reports (scheduled and on-demand) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of reports with: id, name, type (alert/availability/capacity/performance), description, schedule, recipients, format (PDF/HTML/CSV), last run time. ' +
      '\n\n**What are reports:** Scheduled or on-demand documents summarizing monitoring data. Generate PDFs, HTML, or CSV files with metrics, alerts, availability statistics, capacity planning data. Automatically email to stakeholders. ' +
      '\n\n**When to use:** ' +
      '\n- Find existing reports before creating duplicates' +
      '\n- Review report schedules' +
      '\n- Check who receives reports' +
      '\n- Audit reporting configuration' +
      '\n\n**Report types:** ' +
      '\n- **Alert Reports:** Summary of alerts over time period (count by severity, MTTR, top alerting resources/devices)' +
      '\n- **Availability Reports:** Uptime statistics, SLA compliance, outage summaries' +
      '\n- **Capacity Planning:** Disk growth trends, CPU/memory usage over time, forecasting' +
      '\n- **Performance Reports:** Metric trends, top consumers, performance baselines' +
      '\n- **Custom Reports:** User-defined queries and visualizations' +
      '\n\n**Common use cases:** ' +
      '\n- **Executive summaries:** Monthly availability report to leadership' +
      '\n- **SLA reporting:** Prove 99.9% uptime to customers' +
      '\n- **Capacity planning:** Forecast when to add storage/servers' +
      '\n- **Compliance:** Document monitoring coverage and alert response' +
      '\n- **Billing:** Usage reports for chargebacks' +
      '\n\n**Report schedules:** ' +
      '\n- Daily: 8am delivery for NOC shift handoff' +
      '\n- Weekly: Monday morning management briefing' +
      '\n- Monthly: End-of-month SLA reports' +
      '\n- Quarterly: Capacity planning reviews' +
      '\n- On-demand: Generate for specific incidents/audits' +
      '\n\n**Workflow:** Use this tool to find reports, then "get\\_report" for details, or "generate\\_report" to run on-demand. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_report" (details), "list\\_report\\_groups" (organization), "generate\\_report" (run now).',
    annotations: {
      title: 'List reports',
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
    name: 'get_report',
    description: 'Get detailed information about a specific report by its ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete report details: name, type, description, schedule (daily/weekly/monthly), recipients, format, data sources (which resources/devices/groups), date range, customization settings, last run timestamp, delivery status. ' +
      '\n\n**When to use:** ' +
      '\n- Review report configuration before modification' +
      '\n- Check recipients and schedule' +
      '\n- Verify data sources (which resource/device included)' +
      '\n- Troubleshoot why report not received' +
      '\n- Clone report settings for similar report' +
      '\n\n**Configuration details:** ' +
      '\n- Schedule: When report runs (e.g., "Every Monday at 8am")' +
      '\n- Recipients: Who receives report via email' +
      '\n- Format: PDF (management), HTML (web), CSV (data analysis)' +
      '\n- Scope: Which resources/devices/groups are included' +
      '\n- Date range: Last 7 days, last month, custom period' +
      '\n\n**Workflow:** Use "list\\_reports" to find reportId, then use this tool for complete configuration. ' +
      '\n\n**Related tools:** "list\\_reports" (find reports), "update\\_report" (modify), "generate\\_report" (run now).',
    annotations: {
      title: 'Get report details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['reportId'],
    },
  },
  {
    name: 'create_report',
    description: 'Create a new report in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates a scheduled or on-demand report (e.g., Alert, Alert SLA, Dashboard, Device Inventory, Resource Metric Trends) that can be delivered via email in HTML, PDF, CSV, or WORD format. ' +
      '\n\n**Required parameters:**' +
      '\n- name: The report name' +
      '\n- type: The report type. Common values: "Alert", "Alert SLA", "Alert Threshold", "Dashboard", "Device Inventory", "Resource Metric Trends", "SLA", "Website SLA", "Audit", "Custom". (Use "get\\_report" on an existing report to see exact type strings.)' +
      '\n\n**⚠️ Report definitions are type-specific.** Each report type requires different configuration (scope, columns, date range, etc.). The most reliable approach is to export an existing report of the same type via "get\\_report", adapt it, and pass the type-specific fields via `config`. ' +
      '\n\n**Optional parameters:**' +
      '\n- description: Report description' +
      '\n- groupId: Report group ID (0 = root report group)' +
      '\n- format: Output format - one of HTML, PDF, CSV, WORD' +
      '\n- delivery: Whether/how the report is delivered via email' +
      '\n- schedule: A cron schedule string for email delivery' +
      '\n- scheduleTimezone: Timezone for the schedule' +
      '\n- recipients: Array of email delivery recipients' +
      '\n- config: Any additional type-specific report attributes (merged into the request body)' +
      '\n\n**Related tools:** "get\\_report" (export a template), "list\\_reports" (browse existing), "update\\_report", "delete\\_report".',
    annotations: {
      title: 'Create report',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the report.',
        },
        type: {
          type: 'string',
          description: 'The report type (e.g., "Alert", "Alert SLA", "Dashboard", "Device Inventory", "Resource Metric Trends", "SLA", "Website SLA", "Audit", "Custom").',
        },
        description: {
          type: 'string',
          description: 'The description of the report.',
        },
        groupId: {
          type: 'number',
          description: 'The ID of the report group (0 = root report group).',
        },
        format: {
          type: 'string',
          description: 'The output format: HTML, PDF, CSV, or WORD.',
        },
        delivery: {
          type: 'string',
          description: 'Whether/how the report is delivered via email.',
        },
        schedule: {
          type: 'string',
          description: 'A cron schedule string indicating when the report is delivered via email.',
        },
        scheduleTimezone: {
          type: 'string',
          description: 'The timezone for the scheduled report.',
        },
        recipients: {
          type: 'array',
          description: 'Email delivery recipients (objects describing each recipient).',
          items: { type: 'object', additionalProperties: true },
        },
        config: {
          type: 'object',
          description: 'Additional type-specific report attributes (scope, columns, date range, etc.), merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['name', 'type'],
    },
  },
  {
    name: 'update_report',
    description: 'Update an existing report in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modifies a report\'s name, description, group, format, schedule, recipients, or type-specific configuration. Uses a partial update (only the fields you provide are changed). ' +
      '\n\n**Required parameters:**' +
      '\n- reportId: The ID of the report to update (from "list\\_reports")' +
      '\n\n**Optional parameters (what to change):**' +
      '\n- name, description, groupId, format, delivery, schedule, scheduleTimezone, recipients' +
      '\n- type: The report type (the API may require this when changing type-specific fields)' +
      '\n- config: Any additional type-specific report attributes to update (merged into the body)' +
      '\n\n**Best practice:** Use "get\\_report" first to review the current configuration (including its `type`), then change only the needed fields. ' +
      '\n\n**Related tools:** "get\\_report" (review before update), "list\\_reports" (find report), "delete\\_report".',
    annotations: {
      title: 'Update report',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report to update.',
        },
        name: {
          type: 'string',
          description: 'New report name.',
        },
        type: {
          type: 'string',
          description: 'The report type (may be required by the API when changing type-specific fields).',
        },
        description: {
          type: 'string',
          description: 'New description.',
        },
        groupId: {
          type: 'number',
          description: 'Move the report to a different report group by ID (0 = root).',
        },
        format: {
          type: 'string',
          description: 'New output format: HTML, PDF, CSV, or WORD.',
        },
        delivery: {
          type: 'string',
          description: 'Whether/how the report is delivered via email.',
        },
        schedule: {
          type: 'string',
          description: 'New cron schedule string for email delivery.',
        },
        scheduleTimezone: {
          type: 'string',
          description: 'New timezone for the scheduled report.',
        },
        recipients: {
          type: 'array',
          description: 'Email delivery recipients (objects describing each recipient).',
          items: { type: 'object', additionalProperties: true },
        },
        config: {
          type: 'object',
          description: 'Additional type-specific report attributes to update, merged into the request body.',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
      required: ['reportId'],
    },
  },
  {
    name: 'delete_report',
    description: 'Delete a report from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING: PERMANENT DELETION**' +
      '\n- The report definition is permanently removed' +
      '\n- Scheduled email delivery stops' +
      '\n- Cannot be undone' +
      '\n\n**What this does:** Permanently removes a report from LogicMonitor. Previously generated/delivered report files are not affected. ' +
      '\n\n**Required parameters:**' +
      '\n- reportId: The ID of the report to delete (from "list\\_reports")' +
      '\n\n**Before deleting:** Use "get\\_report" to verify it is the correct report and consider exporting its configuration for backup. ' +
      '\n\n**Related tools:** "get\\_report" (backup/verify before delete), "list\\_reports" (find report), "update\\_report" (modify instead of delete).',
    annotations: {
      title: 'Delete report',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report to delete.',
        },
      },
      additionalProperties: false,
      required: ['reportId'],
    },
  },
  {
    name: 'generate_report',
    description: 'Run (generate) a report on demand in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Triggers an immediate execution of an existing report definition. Generation is asynchronous: this returns a `taskId` that you pass to "get\\_report\\_task\\_result" to check status and retrieve the generated report (e.g., a download URL). ' +
      '\n\n**Required parameters:**' +
      '\n- reportId: The ID of the report to run (from "list\\_reports")' +
      '\n\n**Optional parameters:**' +
      '\n- receiveEmails: Comma-separated email address(es) that LogicMonitor should email the generated report to' +
      '\n- withAdminId: Generate the report as a specific admin/user ID (0 or omitted = current user)' +
      '\n\n**Workflow:** Call this tool, then poll "get\\_report\\_task\\_result" with the returned `taskId` until the report is ready. ' +
      '\n\n**Related tools:** "get\\_report\\_task\\_result" (fetch status/output), "list\\_reports" (find reportId), "get\\_report" (report details).',
    annotations: {
      title: 'Generate report',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report to run.',
        },
        receiveEmails: {
          type: 'string',
          description: 'Comma-separated email address(es) to send the generated report to.',
        },
        withAdminId: {
          type: 'number',
          description: 'Generate the report as this admin/user ID (0 or omitted = current user).',
        },
      },
      additionalProperties: false,
      required: ['reportId'],
    },
  },
  {
    name: 'get_report_task_result',
    description: 'Get the result of an on-demand report generation in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Retrieves the status and output of a report run started via "generate\\_report", using the `taskId` it returned. The report may not be ready immediately; poll until it completes. ' +
      '\n\n**Required parameters:**' +
      '\n- reportId: The ID of the report that was run' +
      '\n- taskId: The task ID returned by "generate\\_report"' +
      '\n\n**Related tools:** "generate\\_report" (start a report run).',
    annotations: {
      title: 'Get report task result',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        reportId: {
          type: 'number',
          description: 'The ID of the report that was run.',
        },
        taskId: {
          type: 'string',
          description: 'The task ID returned by generate_report.',
        },
      },
      additionalProperties: false,
      required: ['reportId', 'taskId'],
    },
  },

  // Report Groups
  {
    name: 'list_report_groups',
    description: 'List all report groups (folders) in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Array of report groups with: id, name, parentId, full path, description, number of reports, number of subgroups. ' +
      '\n\n**What are report groups:** Organizational folders for reports, like directories for files. Used to categorize reports by audience, frequency, purpose, or department. ' +
      '\n\n**When to use:**' +
      '\n- Browse report organization before creating reports' +
      '\n- Find group IDs for report operations' +
      '\n- Understand report hierarchy' +
      '\n- Navigate to specific report folders' +
      '\n' +
      '\n\n**Common organization patterns:** ' +
      '\n- By audience: "Executive Reports", "Operations Reports", "Customer Reports" ' +
      '\n- By frequency: "Daily Reports", "Weekly Reports", "Monthly Reports" ' +
      '\n- By department: "IT Reports", "Finance Reports", "Compliance Reports" ' +
      '\n- By type: "SLA Reports", "Capacity Reports", "Alert Summary Reports" ' +
      '\n\n**Use cases:** ' +
      '\n- Organize reports for different stakeholders ' +
      '\n- Group compliance/audit reports separately ' +
      '\n- Separate internal vs customer-facing reports ' +
      '\n- Structure reports by delivery schedule ' +
      '\n\n**Workflow:** Use this tool to browse hierarchy, then "list\\_reports" filtered by groupId to see reports in specific folder. ' +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_report\\_group" (details), "list\\_reports" (reports in group), "create\\_report\\_group" (create folder).',
    annotations: {
      title: 'List report groups',
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
    name: 'get_report_group',
    description: 'Get detailed information about a specific report group by ID in LogicMonitor (LM) monitoring. ' +
      '\n\n**Returns:** Complete report group details: name, full path, parentId, description, number of reports (direct and total), number of subgroups. ' +
      '\n\n**When to use:**' +
      '\n- Get group path for documentation' +
      '\n- Check report membership counts' +
      '\n- Verify group hierarchy' +
      '\n- Review group structure before creating reports' +
      '\n' +
      '\n\n**Workflow:** Use "list\\_report\\_groups" to find groupId, then use this tool for complete details. ' +
      '\n\n**Related tools:** "list\\_report\\_groups" (find groups), "list\\_reports" (reports in group), "create\\_report\\_group" (create new).',
    annotations: {
      title: 'Get report group details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'create_report_group',
    description: 'Create a new report group (folder) in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Creates organizational folder for reports. Organize reports by team, report type, schedule, or purpose. ' +
      '\n\n**When to use:**' +
      '\n- Organize reports before creating them' +
      '\n- Group by department/team' +
      '\n- Separate by report frequency (daily/weekly/monthly)' +
      '\n- Organize by purpose (compliance/executive/operational)' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- name: Group name (e.g., "Executive Reports", "Compliance Reports", "Daily Operations") ' +
      '\n\n**Optional parameters:** ' +
      '\n- description: Group purpose ' +
      '\n- parentId: Parent group ID for nested hierarchy ' +
      '\n\n**Common report group patterns:** ' +
      '\n- By audience: "Executive Reports", "Engineering Reports", "Business Unit Reports" ' +
      '\n- By frequency: "Daily Reports", "Weekly Reports", "Monthly Reports" ' +
      '\n- By purpose: "Compliance Reports", "SLA Reports", "Capacity Planning" ' +
      '\n- By type: "Alert Reports", "Availability Reports", "Performance Reports" ' +
      '\n\n**Best practices:** ' +
      '\n- Create groups before creating reports ' +
      '\n- Use descriptive names matching business needs ' +
      '\n- Keep hierarchy shallow (2-3 levels max) ' +
      '\n\n**Related tools:** "list\\_report\\_groups" (view hierarchy), "create\\_report" (add reports), "update\\_report\\_group" (modify).',
    annotations: {
      title: 'Create report group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the report group',
        },
        description: {
          type: 'string',
          description: 'Description',
        },
      },
      additionalProperties: false,
      required: ['name'],
    },
  },
  {
    name: 'update_report_group',
    description: 'Update an existing report group in LogicMonitor (LM) monitoring. ' +
      '\n\n**What this does:** Modify group name, description, or parent (move in hierarchy). Does not affect reports within group. ' +
      '\n\n**When to use:**' +
      '\n- Rename group' +
      '\n- Update description' +
      '\n- Move group in hierarchy' +
      '\n- Reorganize report structure' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Report group ID (from "list\\_report\\_groups") ' +
      '\n\n**Optional parameters:** ' +
      '\n- name: New group name ' +
      '\n- description: Updated description ' +
      '\n- parentId: New parent group (moves group) ' +
      '\n\n**Related tools:** "list\\_report\\_groups" (find group), "get\\_report\\_group" (verify), "list\\_reports" (reports in group).',
    annotations: {
      title: 'Update report group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to update',
        },
        name: {
          type: 'string',
          description: 'New name',
        },
        description: {
          type: 'string',
          description: 'New description',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },
  {
    name: 'delete_report_group',
    description: 'Delete a report group from LogicMonitor (LM) monitoring. ' +
      '\n\n**⚠️ WARNING:** Cannot delete group containing reports or subgroups. Must be empty to delete. ' +
      '\n\n**What this does:** Removes empty report group folder. Group must have no reports and no subgroups. ' +
      '\n\n**When to use:**' +
      '\n- Cleanup empty groups after reorganization' +
      '\n- Remove unused organizational folders' +
      '\n- Simplify report hierarchy' +
      '\n' +
      '\n\n**Required parameters:** ' +
      '\n- groupId: Report group ID to delete (from "list\\_report\\_groups") ' +
      '\n\n**Before deleting:** Move all reports and subgroups first, then delete empty group. ' +
      '\n\n**Related tools:** "list\\_reports" (check for reports), "list\\_report\\_groups" (check for subgroups), "update\\_report" (move reports).',
    annotations: {
      title: 'Delete report group',
      readOnlyHint: false,
    },
    inputSchema: {
      type: 'object',
      properties: {
        groupId: {
          type: 'number',
          description: 'The ID of the report group to delete',
        },
      },
      additionalProperties: false,
      required: ['groupId'],
    },
  },

];
