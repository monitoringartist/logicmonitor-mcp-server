import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_AUDIT_LOG_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../../utils/helpers/filters.js';

export class AuditHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Audit Logs
        case 'list_audit_logs': {
          // Handle query parameter - convert to filter
          let filter = args.filter;
          if (args.query) {
            const queryFilter = autoFormatFilter(args.query, SEARCH_FIELDS.auditLogs);
            // Combine with existing filter using AND logic
            filter = filter ? `${queryFilter},${filter}` : queryFilter;
          }

          const result = await this.client.listAuditLogs({
            size: args.size,
            offset: args.offset,
            filter: filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((auditLog: any) =>
              filterFields(auditLog, DEFAULT_AUDIT_LOG_FIELDS),
            ),
          };
        }

        case 'get_audit_log':
          return await this.client.getAuditLog(args.auditLogId, {
            fields: args.fields,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
