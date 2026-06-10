import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const logsourcesToolHandlers: ToolHandlerMap = {
  'list_logsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogSources({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      format: args.format,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_logsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogSource(args.logSourceId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_logsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createLogSource(args.config || {});
  },

  'update_logsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateLogSource(args.logSourceId, args.config || {}, {
      reason: args.reason,
    });
  },

  'delete_logsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogSource(args.logSourceId);
  },

  'import_logsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importLogSource(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'list_log_alert_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogAlertGroups({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogAlertGroup(args.logAlertGroupId, { fields: args.fields });
  },

  'create_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogAlertGroup({ ...rest, ...(config || {}) });
  },

  'update_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { logAlertGroupId, config, ...rest } = args;
    return await client.updateLogAlertGroup(logAlertGroupId, { ...rest, ...(config || {}) });
  },

  'delete_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogAlertGroup(args.logAlertGroupId);
  },

  'list_log_alerts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogAlerts({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogAlert(args.logAlertId, { fields: args.fields });
  },

  'create_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogAlert({ ...rest, ...(config || {}) });
  },

  'update_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { logAlertId, config, ...rest } = args;
    return await client.updateLogAlert(logAlertId, { ...rest, ...(config || {}) });
  },

  'delete_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogAlert(args.logAlertId);
  },

  'set_log_alert_status': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.setLogAlertStatus(args.logAlertId, args.action, args.config || {});
  },

  'list_log_query_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroups({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogQueryGroup(args.logQueryGroupId, { fields: args.fields });
  },

  'create_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogQueryGroup({ ...rest, ...(config || {}) });
  },

  'update_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { logQueryGroupId, config, ...rest } = args;
    return await client.updateLogQueryGroup(logQueryGroupId, { ...rest, ...(config || {}) });
  },

  'delete_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogQueryGroup(args.logQueryGroupId);
  },

  'list_log_query_group_queries': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroupQueries(args.logQueryGroupId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'list_log_query_groups_by_type': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroupsByType(args.groupType, {
      allGroups: args.allGroups, size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
    });
  },

  'move_log_queries': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.moveLogQueries(args.logQueryGroupId, args.config || {});
  },

  'list_log_partitions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogPartitions({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogPartition(args.logPartitionId, { fields: args.fields });
  },

  'create_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogPartition({ ...rest, ...(config || {}) });
  },

  'update_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { logPartitionId, config, ...rest } = args;
    return await client.updateLogPartition(logPartitionId, { ...rest, ...(config || {}) });
  },

  'delete_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogPartition(args.logPartitionId);
  },

  'get_log_partition_retentions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogPartitionRetentions({ fields: args.fields });
  },

  'log_partition_action': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.logPartitionAction(args.logPartitionId, args.action, args.config || {});
  },

  'list_tracked_query_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listTrackedQueryGroups({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getTrackedQueryGroup(args.trackedQueryGroupId, { fields: args.fields });
  },

  'create_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createTrackedQueryGroup({ ...rest, ...(config || {}) });
  },

  'update_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { trackedQueryGroupId, config, ...rest } = args;
    return await client.updateTrackedQueryGroup(trackedQueryGroupId, { ...rest, ...(config || {}) });
  },

  'delete_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteTrackedQueryGroup(args.trackedQueryGroupId);
  },
};
