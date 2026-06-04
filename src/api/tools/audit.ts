import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { paginationSchema, filterSchema, fieldsSchema } from './common.js';

export const auditTools: Tool[] = [
  // Audit Logs Tools
  {
    name: 'list_audit_logs',
    description: 'List audit logs in LogicMonitor (LM) monitoring for compliance and security auditing. ' +
      '\n\n**Returns:** Array of audit log entries with: id, username, IP address, timestamp (happenedOn in epoch SECONDS), description of action performed, sessionId. ' +
      '\n\n**When to use:** ' +
      '\n- Investigate changes: "Who deleted this resource/device?" → filter:"description~\\*Delete\\*,description~\\*device\\*"' +
      '\n- Track user activity: "What did john.doe do today?" → filter:"username:john.doe,happenedOn>1730851200"' +
      '\n- Monitor API usage: Find actions performed via API tokens' +
      '\n- Compliance audits: Export log history for specific time periods' +
      '\n- Security investigation: Track login attempts, IP addresses, suspicious activities' +
      '\n- Troubleshooting: "Who changed this alert rule?" → filter:"description~\\*AlertRule\\*"' +
      '\n\n**Two search modes:** ' +
      '\n- **Simple search:** Use query parameter with free text (e.g., query:"john.doe", query:"device") - searches across username, description, and IP fields' +
      '\n- **Advanced filtering:** Use filter parameter with LM filter syntax (e.g., filter:"username:admin,happenedOn>1640995200") for precise control' +
      '\n\n**Common filter patterns:** ' +
      '\n- By user: filter:"username:john.doe"' +
      '\n- By time: filter:"happenedOn>1640995200" (IMPORTANT: epoch SECONDS, not milliseconds!)' +
      '\n- By action type: filter:"description~\\*Create\\*" or filter:"description~\\*Delete\\*" or filter:"description~\\*Update\\*"' +
      '\n- By resource: filter:"description~\\*device\\*" or filter:"description~\\*dashboard\\*"' +
      '\n- By IP: filter:"ip:192.168.1.100"' +
      '\n- Combined (AND): filter:"username:admin,happenedOn>1640995200,description~\\*device\\*"' +
      '\n\n**Query vs Filter:** ' +
      '\n- query: Simple text search across username, description, IP (OR logic). Use for quick lookups: query:"john.doe", query:"device"' +
      '\n- filter: Precise LM filter syntax with any field. Use for time ranges, exact matches: filter:"happenedOn>1640995200"' +
      '\n- If both provided, query is converted to filter and combined with provided filter using AND logic' +
      '\n\n**Critical notes:** ' +
      '\n- Time uses epoch SECONDS (not milliseconds like other LM APIs)' +
      '\n- Cannot use OR operator (||) in audit logs, only AND (comma)' +
      '\n- Use autoPaginate:true for complete history (may take time for large datasets)' +
      `\n\n**Web UI access:** https://${process.env.LM_COMPANY}.logicmonitor.com/santaba/uiv4/settings/access-logs (Settings → Audit Logs) ` +
      '\n\n**Important:** A negative "total" value in the response indicates incomplete results. Use pagination (size/offset parameters) or set autoPaginate: true to retrieve all items. ' +
      '\n\n**Related tools:** "get\\_audit\\_log" (details of specific entry).',
    annotations: {
      title: 'List audit logs',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Simple search query. Free text (e.g., "john.doe", "device", "192.168.1.100") automatically searches across username, description, and IP fields. Can also use filter syntax (e.g., "username:admin") which gets formatted automatically.',
        },
        ...paginationSchema,
        ...filterSchema,
        ...fieldsSchema,
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_audit_log',
    description: 'Get detailed information about a specific audit log entry in LogicMonitor (LM) monitoring by its ID. ' +
      '\n\n**Returns:** Complete audit log details: username, IP address, exact timestamp, full description of action, session ID, affected resources, before/after values (for updates). ' +
      '\n\n**When to use:** ' +
      '\n- Get complete details after finding log ID via "list\\_audit\\_logs"' +
      '\n- Review exact changes made (old vs new values)' +
      '\n- Investigate specific incident with full context' +
      '\n\n**Workflow:** First use "list\\_audit\\_logs" with filters to find relevant entries, then use this tool with the log ID for complete details. ' +
      '\n\n**Related tools:** "list\\_audit\\_logs" (search logs), "search\\_audit\\_logs" (text search).',
    annotations: {
      title: 'Get audit details',
      readOnlyHint: true,
    },
    inputSchema: {
      type: 'object',
      properties: {
        auditLogId: {
          type: 'string',
          description: 'The ID of the audit log entry to retrieve',
        },
        ...fieldsSchema,
      },
      additionalProperties: false,
      required: ['auditLogId'],
    },
  },

];
