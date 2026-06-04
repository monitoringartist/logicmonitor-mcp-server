import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_COLLECTOR_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class CollectorsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Collectors
        case 'list_collectors': {
          const result = await this.client.listCollectors({
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
            items: result.items.map((collector: any) =>
              filterFields(collector, DEFAULT_COLLECTOR_FIELDS),
            ),
          };
        }

        case 'get_collector':
          return await this.client.getCollector(args.collectorId, {
            fields: args.fields,
          });

        case 'create_collector': {
          const { config, ...rest } = args;
          const collector = { ...rest, ...(config || {}) };
          return await this.client.createCollector(collector);
        }

        case 'update_collector': {
          const {
            collectorId,
            config,
            autoBalanceMonitoredDevices,
            forceUpdateFailedOverDevices,
            opType,
            ...rest
          } = args;
          const collector = { ...rest, ...(config || {}) };
          return await this.client.updateCollector(collectorId, collector, {
            autoBalanceMonitoredDevices,
            forceUpdateFailedOverDevices,
            opType,
          });
        }

        case 'delete_collector':
          return await this.client.deleteCollector(args.collectorId);

        case 'get_collector_installer':
          return this.client.getCollectorInstallerUrl(args.collectorId, args.osAndArch, {
            collectorVersion: args.collectorVersion,
            collectorSize: args.collectorSize,
            useEA: args.useEA,
            monitorOthers: args.monitorOthers,
            token: args.token,
          });

        case 'acknowledge_collector_down_alert':
          return await this.client.acknowledgeCollectorDownAlert(args.collectorId, args.comment);

        case 'execute_debug_command':
          return await this.client.executeDebugCommand(args.collectorId, args.cmdline);

        case 'get_debug_command_result':
          return await this.client.getDebugCommandResult(args.sessionId, args.collectorId);

        // Collector Groups
        case 'list_collector_groups':
          return await this.client.listCollectorGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_collector_group':
          return await this.client.getCollectorGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_collector_group': {
          const { config, ...rest } = args;
          return await this.client.createCollectorGroup({ ...rest, ...(config || {}) });
        }

        case 'update_collector_group': {
          const { groupId, autoBalanceMonitoredDevices, forceUpdateFailedOverDevices, opType, config, ...rest } = args;
          return await this.client.updateCollectorGroup(
            groupId,
            { ...rest, ...(config || {}) },
            { autoBalanceMonitoredDevices, forceUpdateFailedOverDevices, opType },
          );
        }

        case 'delete_collector_group':
          return await this.client.deleteCollectorGroup(args.groupId);

        case 'list_collector_agent_log_levels':
          return await this.client.listCollectorAgentLogLevels(args.collectorId);

        case 'get_collector_agent_log_level':
          return await this.client.getCollectorAgentLogLevel(args.collectorId, args.component);

        case 'update_collector_agent_log_level':
          return await this.client.updateCollectorAgentLogLevel(args.collectorId, args.component, args.config || {});

        case 'get_collector_events':
          return await this.client.getCollectorEvents(args.collectorId);

        case 'get_collector_status_check':
          return await this.client.getCollectorStatusCheck(args.collectorId);

        // Collector Versions
        case 'list_collector_versions':
          return await this.client.listCollectorVersions({
            size: args.size,
            offset: args.offset,
            fields: args.fields,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
