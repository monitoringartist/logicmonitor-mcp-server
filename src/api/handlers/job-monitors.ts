import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const jobMonitorsToolHandlers: ToolHandlerMap = {
  'list_job_monitors': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listJobMonitors({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      format: args.format,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_job_monitor': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getJobMonitor(args.jobMonitorId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_job_monitor': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createJobMonitor({ ...rest, ...(config || {}) });
  },

  'update_job_monitor': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { jobMonitorId, reason, config, ...rest } = args;
    return await client.updateJobMonitor(jobMonitorId, { ...rest, ...(config || {}) }, { reason });
  },

  'delete_job_monitor': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteJobMonitor(args.jobMonitorId);
  },

  'import_job_monitor': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importJobMonitor(args.content, args.format, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },
};
