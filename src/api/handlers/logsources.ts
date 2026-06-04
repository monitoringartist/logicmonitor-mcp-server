import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class LogsourcesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // LogSources
        case 'list_logsources':
          return await this.client.listLogSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            format: args.format,
            autoPaginate: args.autoPaginate,
          });

        case 'get_logsource':
          return await this.client.getLogSource(args.logSourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_logsource':
          return await this.client.createLogSource(args.config || {});

        case 'update_logsource':
          return await this.client.updateLogSource(args.logSourceId, args.config || {}, {
            reason: args.reason,
          });

        case 'delete_logsource':
          return await this.client.deleteLogSource(args.logSourceId);

        case 'import_logsource':
          return await this.client.importLogSource(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // Log Pipelines / Log Alert Groups
        case 'list_log_alert_groups':
          return await this.client.listLogAlertGroups({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_log_alert_group':
          return await this.client.getLogAlertGroup(args.pipelineId, { fields: args.fields });

        case 'create_log_alert_group': {
          const { config, ...rest } = args;
          return await this.client.createLogAlertGroup({ ...rest, ...(config || {}) });
        }

        case 'update_log_alert_group': {
          const { pipelineId, config, ...rest } = args;
          return await this.client.updateLogAlertGroup(pipelineId, { ...rest, ...(config || {}) });
        }

        case 'delete_log_alert_group':
          return await this.client.deleteLogAlertGroup(args.pipelineId);

        case 'list_log_alerts':
          return await this.client.listLogAlerts({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_log_alert':
          return await this.client.getLogAlert(args.processorId, { fields: args.fields });

        case 'create_log_alert': {
          const { config, ...rest } = args;
          return await this.client.createLogAlert({ ...rest, ...(config || {}) });
        }

        case 'update_log_alert': {
          const { processorId, config, ...rest } = args;
          return await this.client.updateLogAlert(processorId, { ...rest, ...(config || {}) });
        }

        case 'delete_log_alert':
          return await this.client.deleteLogAlert(args.processorId);

        case 'set_log_alert_status':
          return await this.client.setLogAlertStatus(args.processorId, args.action, args.config || {});

        // Log Query Groups
        case 'list_log_query_groups':
          return await this.client.listLogQueryGroups({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_log_query_group':
          return await this.client.getLogQueryGroup(args.groupId, { fields: args.fields });

        case 'create_log_query_group': {
          const { config, ...rest } = args;
          return await this.client.createLogQueryGroup({ ...rest, ...(config || {}) });
        }

        case 'update_log_query_group': {
          const { groupId, config, ...rest } = args;
          return await this.client.updateLogQueryGroup(groupId, { ...rest, ...(config || {}) });
        }

        case 'delete_log_query_group':
          return await this.client.deleteLogQueryGroup(args.groupId);

        case 'list_log_query_group_queries':
          return await this.client.listLogQueryGroupQueries(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'list_log_query_groups_by_type':
          return await this.client.listLogQueryGroupsByType(args.groupType, {
            allGroups: args.allGroups, size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
          });

        case 'move_log_queries':
          return await this.client.moveLogQueries(args.groupId, args.config || {});

        // Log Partitions
        case 'list_log_partitions':
          return await this.client.listLogPartitions({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_log_partition':
          return await this.client.getLogPartition(args.partitionId, { fields: args.fields });

        case 'create_log_partition': {
          const { config, ...rest } = args;
          return await this.client.createLogPartition({ ...rest, ...(config || {}) });
        }

        case 'update_log_partition': {
          const { partitionId, config, ...rest } = args;
          return await this.client.updateLogPartition(partitionId, { ...rest, ...(config || {}) });
        }

        case 'delete_log_partition':
          return await this.client.deleteLogPartition(args.partitionId);

        case 'get_log_partition_retentions':
          return await this.client.getLogPartitionRetentions({ fields: args.fields });

        case 'log_partition_action':
          return await this.client.logPartitionAction(args.partitionId, args.action, args.config || {});

        // Tracked Query Groups
        case 'list_tracked_query_groups':
          return await this.client.listTrackedQueryGroups({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_tracked_query_group':
          return await this.client.getTrackedQueryGroup(args.groupId, { fields: args.fields });

        case 'create_tracked_query_group': {
          const { config, ...rest } = args;
          return await this.client.createTrackedQueryGroup({ ...rest, ...(config || {}) });
        }

        case 'update_tracked_query_group': {
          const { groupId, config, ...rest } = args;
          return await this.client.updateTrackedQueryGroup(groupId, { ...rest, ...(config || {}) });
        }

        case 'delete_tracked_query_group':
          return await this.client.deleteTrackedQueryGroup(args.groupId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
