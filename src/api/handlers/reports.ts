import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_REPORT_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class ReportsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Reports
        case 'list_reports': {
          const result = await this.client.listReports({
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
        }

        case 'get_report':
          return await this.client.getReport(args.reportId, {
            fields: args.fields,
          });

        case 'create_report': {
          const { config, ...rest } = args;
          const report = { ...rest, ...(config || {}) };
          return await this.client.createReport(report);
        }

        case 'update_report': {
          const { reportId, config, ...rest } = args;
          const report = { ...rest, ...(config || {}) };
          return await this.client.updateReport(reportId, report);
        }

        case 'delete_report':
          return await this.client.deleteReport(args.reportId);

        case 'generate_report':
          return await this.client.generateReport(args.reportId, {
            withAdminId: args.withAdminId,
            receiveEmails: args.receiveEmails,
          });

        case 'get_report_task_result':
          return await this.client.getReportTaskResult(args.reportId, args.taskId);

        // Report Groups
        case 'list_report_groups':
          return await this.client.listReportGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_report_group':
          return await this.client.getReportGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_report_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          return await this.client.createReportGroup(group);
        }

        case 'update_report_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          return await this.client.updateReportGroup(args.groupId, group);
        }

        case 'delete_report_group':
          return await this.client.deleteReportGroup(args.groupId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
