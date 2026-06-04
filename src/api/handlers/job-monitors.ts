import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class JobMonitorsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Job Monitors (BatchJobs)
        case 'list_job_monitors':
          return await this.client.listJobMonitors({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            format: args.format,
            autoPaginate: args.autoPaginate,
          });

        case 'get_job_monitor':
          return await this.client.getJobMonitor(args.jobMonitorId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_job_monitor': {
          const { config, ...rest } = args;
          return await this.client.createJobMonitor({ ...rest, ...(config || {}) });
        }

        case 'update_job_monitor': {
          const { jobMonitorId, reason, config, ...rest } = args;
          return await this.client.updateJobMonitor(jobMonitorId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_job_monitor':
          return await this.client.deleteJobMonitor(args.jobMonitorId);

        case 'import_job_monitor':
          return await this.client.importJobMonitor(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
