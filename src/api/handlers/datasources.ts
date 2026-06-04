import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_DATASOURCE_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class DatasourcesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // DataSources
        case 'list_datasources': {
          const result = await this.client.listDataSources({
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
        }

        case 'get_datasource':
          return await this.client.getDataSource(args.dataSourceId, {
            fields: args.fields,
          });

        case 'create_datasource':
          return await this.client.createDataSource(args.config || {}, { createGraph: args.createGraph });

        case 'update_datasource':
          return await this.client.updateDataSource(args.dataSourceId, args.config || {}, {
            reason: args.reason,
            forceUniqueIdentifier: args.forceUniqueIdentifier,
          });

        case 'delete_datasource':
          return await this.client.deleteDataSource(args.dataSourceId);

        case 'import_datasource':
          return await this.client.importDataSource(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        case 'list_datasource_overview_graphs':
          return await this.client.listDataSourceOverviewGraphs(args.dataSourceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_datasource_overview_graph':
          return await this.client.getDataSourceOverviewGraph(args.dataSourceId, args.overviewGraphId);

        case 'list_datasource_devices':
          return await this.client.listDataSourceDevices(args.dataSourceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'list_datasource_update_reasons':
          return await this.client.listDataSourceUpdateReasons(args.dataSourceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        // Device DataSources
        case 'list_resource_datasources':
          return await this.client.listDeviceDataSources(args.deviceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_resource_datasource':
          return await this.client.getDeviceDataSource(args.deviceId, args.deviceDataSourceId, {
            fields: args.fields,
          });

        case 'update_resource_datasource': {
          const data: any = {};
          if (args.disableAlerting !== undefined) data.disableAlerting = args.disableAlerting;
          if (args.stopMonitoring !== undefined) data.stopMonitoring = args.stopMonitoring;
          return await this.client.updateDeviceDataSource(args.deviceId, args.deviceDataSourceId, data);
        }
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
