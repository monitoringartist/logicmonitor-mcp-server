import { filterFields, DEFAULT_AUDIT_LOG_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../../utils/helpers/filters.js';

export const auditToolHandlers: ToolHandlerMap = {
  'list_audit_logs': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    // Handle query parameter - convert to filter
    let filter = args.filter;
    if (args.query) {
      const queryFilter = autoFormatFilter(args.query, SEARCH_FIELDS.auditLogs);
      // Combine with existing filter using AND logic
      filter = filter ? `${queryFilter},${filter}` : queryFilter;
    }

    const result = await client.listAuditLogs({
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
  },

  'get_audit_log': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getAuditLog(args.auditLogId, {
      fields: args.fields,
    });
  },
};
