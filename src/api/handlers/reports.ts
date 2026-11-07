import { filterFields, DEFAULT_REPORT_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const reportsToolHandlers: ToolHandlerMap = {
  'list_reports': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listReports({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });

    if (args.fields) {
      return result;
    }

    return {
      ...result,
      items: result.items.map((report: any) =>
        filterFields(report, DEFAULT_REPORT_FIELDS),
      ),
    };
  },

  'get_report': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getReport(args.reportId, {
      fields: args.fields,
    });
  },

  'create_report': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const report = { ...rest, ...(config || {}) };
    return await client.createReport(report);
  },

  'update_report': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { reportId, config, ...rest } = args;
    const report = { ...rest, ...(config || {}) };
    return await client.updateReport(reportId, report);
  },

  'delete_report': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteReport(args.reportId);
  },

  'generate_report': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.generateReport(args.reportId, {
      withAdminId: args.withAdminId,
      receiveEmails: args.receiveEmails,
    });
  },

  'get_report_task_result': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getReportTaskResult(args.reportId, args.taskId);
  },

  'list_report_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listReportGroups({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_report_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getReportGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_report_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {
      name: args.name,
    };
    if (args.description) group.description = args.description;
    return await client.createReportGroup(group);
  },

  'update_report_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {};
    if (args.name) group.name = args.name;
    if (args.description !== undefined) group.description = args.description;
    return await client.updateReportGroup(args.groupId, group);
  },

  'delete_report_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteReportGroup(args.groupId);
  },
};
