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
    return await client.getLogAlertGroup(args.pipelineId, { fields: args.fields });
  },

  'create_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogAlertGroup({ ...rest, ...(config || {}) });
  },

  'update_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { pipelineId, config, ...rest } = args;
    return await client.updateLogAlertGroup(pipelineId, { ...rest, ...(config || {}) });
  },

  'delete_log_alert_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogAlertGroup(args.pipelineId);
  },

  'list_log_alerts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogAlerts({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogAlert(args.processorId, { fields: args.fields });
  },

  'create_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogAlert({ ...rest, ...(config || {}) });
  },

  'update_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { processorId, config, ...rest } = args;
    return await client.updateLogAlert(processorId, { ...rest, ...(config || {}) });
  },

  'delete_log_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogAlert(args.processorId);
  },

  'set_log_alert_status': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.setLogAlertStatus(args.processorId, args.action, args.config || {});
  },

  'list_log_query_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroups({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogQueryGroup(args.groupId, { fields: args.fields });
  },

  'create_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogQueryGroup({ ...rest, ...(config || {}) });
  },

  'update_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, config, ...rest } = args;
    return await client.updateLogQueryGroup(groupId, { ...rest, ...(config || {}) });
  },

  'delete_log_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogQueryGroup(args.groupId);
  },

  'list_log_query_group_queries': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroupQueries(args.groupId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'list_log_query_groups_by_type': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogQueryGroupsByType(args.groupType, {
      allGroups: args.allGroups, size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
    });
  },

  'move_log_queries': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.moveLogQueries(args.groupId, args.config || {});
  },

  'list_log_partitions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listLogPartitions({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogPartition(args.partitionId, { fields: args.fields });
  },

  'create_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createLogPartition({ ...rest, ...(config || {}) });
  },

  'update_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { partitionId, config, ...rest } = args;
    return await client.updateLogPartition(partitionId, { ...rest, ...(config || {}) });
  },

  'delete_log_partition': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteLogPartition(args.partitionId);
  },

  'get_log_partition_retentions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogPartitionRetentions({ fields: args.fields });
  },

  'log_partition_action': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.logPartitionAction(args.partitionId, args.action, args.config || {});
  },

  'list_tracked_query_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listTrackedQueryGroups({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getTrackedQueryGroup(args.groupId, { fields: args.fields });
  },

  'create_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createTrackedQueryGroup({ ...rest, ...(config || {}) });
  },

  'update_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, config, ...rest } = args;
    return await client.updateTrackedQueryGroup(groupId, { ...rest, ...(config || {}) });
  },

  'delete_tracked_query_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteTrackedQueryGroup(args.groupId);
  },
};
