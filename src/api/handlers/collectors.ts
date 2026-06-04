import { filterFields, DEFAULT_COLLECTOR_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const collectorsToolHandlers: ToolHandlerMap = {
  'list_collectors': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listCollectors({
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
  },

  'get_collector': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCollector(args.collectorId, {
      fields: args.fields,
    });
  },

  'create_collector': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const collector = { ...rest, ...(config || {}) };
    return await client.createCollector(collector);
  },

  'update_collector': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const {
      collectorId,
      config,
      autoBalanceMonitoredDevices,
      forceUpdateFailedOverDevices,
      opType,
      ...rest
    } = args;
    const collector = { ...rest, ...(config || {}) };
    return await client.updateCollector(collectorId, collector, {
      autoBalanceMonitoredDevices,
      forceUpdateFailedOverDevices,
      opType,
    });
  },

  'delete_collector': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteCollector(args.collectorId);
  },

  'get_collector_installer': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return client.getCollectorInstallerUrl(args.collectorId, args.osAndArch, {
      collectorVersion: args.collectorVersion,
      collectorSize: args.collectorSize,
      useEA: args.useEA,
      monitorOthers: args.monitorOthers,
      token: args.token,
    });
  },

  'acknowledge_collector_down_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.acknowledgeCollectorDownAlert(args.collectorId, args.comment);
  },

  'execute_debug_command': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.executeDebugCommand(args.collectorId, args.cmdline);
  },

  'get_debug_command_result': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDebugCommandResult(args.sessionId, args.collectorId);
  },

  'list_collector_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listCollectorGroups({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_collector_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCollectorGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_collector_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createCollectorGroup({ ...rest, ...(config || {}) });
  },

  'update_collector_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, autoBalanceMonitoredDevices, forceUpdateFailedOverDevices, opType, config, ...rest } = args;
    return await client.updateCollectorGroup(
      groupId,
      { ...rest, ...(config || {}) },
      { autoBalanceMonitoredDevices, forceUpdateFailedOverDevices, opType },
    );
  },

  'delete_collector_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteCollectorGroup(args.groupId);
  },

  'list_collector_agent_log_levels': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listCollectorAgentLogLevels(args.collectorId);
  },

  'get_collector_agent_log_level': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCollectorAgentLogLevel(args.collectorId, args.component);
  },

  'update_collector_agent_log_level': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateCollectorAgentLogLevel(args.collectorId, args.component, args.config || {});
  },

  'get_collector_events': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCollectorEvents(args.collectorId);
  },

  'get_collector_status_check': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCollectorStatusCheck(args.collectorId);
  },

  'list_collector_versions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listCollectorVersions({
      size: args.size,
      offset: args.offset,
      fields: args.fields,
    });
  },
};
