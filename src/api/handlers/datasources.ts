import { filterFields, DEFAULT_DATASOURCE_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const datasourcesToolHandlers: ToolHandlerMap = {
  'list_datasources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listDataSources({
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
      items: result.items.map((datasource: any) =>
        filterFields(datasource, DEFAULT_DATASOURCE_FIELDS),
      ),
    };
  },

  'get_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDataSource(args.dataSourceId, {
      fields: args.fields,
    });
  },

  'create_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createDataSource(args.config || {}, { createGraph: args.createGraph });
  },

  'update_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDataSource(args.dataSourceId, args.config || {}, {
      reason: args.reason,
      forceUniqueIdentifier: args.forceUniqueIdentifier,
    });
  },

  'delete_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDataSource(args.dataSourceId);
  },

  'import_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importDataSource(args.content, args.format, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'list_datasource_overview_graphs': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDataSourceOverviewGraphs(args.dataSourceId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'get_datasource_overview_graph': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDataSourceOverviewGraph(args.dataSourceId, args.overviewGraphId);
  },

  'list_datasource_devices': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDataSourceDevices(args.dataSourceId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'list_datasource_update_reasons': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDataSourceUpdateReasons(args.dataSourceId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'list_resource_datasources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceDataSources(args.deviceId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_resource_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSource(args.deviceId, args.deviceDataSourceId, {
      fields: args.fields,
    });
  },

  'update_resource_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const data: any = {};
    if (args.disableAlerting !== undefined) data.disableAlerting = args.disableAlerting;
    if (args.stopMonitoring !== undefined) data.stopMonitoring = args.stopMonitoring;
    return await client.updateDeviceDataSource(args.deviceId, args.deviceDataSourceId, data);
  },
};
