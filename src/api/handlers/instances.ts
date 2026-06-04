import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class InstancesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Device DataSource Instances
        case 'list_resource_instances':
          return await this.client.listDeviceDataSourceInstances(
            args.deviceId,
            args.deviceDataSourceId,
            {
              size: args.size,
              offset: args.offset,
              filter: args.filter,
              fields: args.fields,
            },
          );

        case 'get_resource_instance_data':
          return await this.client.getDeviceDataSourceInstanceData(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            {
              datapoints: args.datapoints,
              start: args.start,
              end: args.end,
              format: args.format,
            },
          );

        // Device DataSource Instance write operations
        case 'create_resource_instance':
          return await this.client.createDeviceDataSourceInstance(
            args.deviceId,
            args.deviceDataSourceId,
            args.config || {},
          );

        case 'update_resource_instance':
          return await this.client.updateDeviceDataSourceInstance(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            args.config || {},
            { opType: args.opType },
          );

        case 'delete_resource_instance':
          return await this.client.deleteDeviceDataSourceInstance(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
          );

        case 'get_instance_graph_data':
          return await this.client.getDeviceDataSourceInstanceGraphData(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            args.graphId,
            { start: args.start, end: args.end, format: args.format },
          );

        case 'get_resource_datasource_data':
          return await this.client.getDeviceDataSourceData(
            args.deviceId,
            args.deviceDataSourceId,
            {
              period: args.period,
              start: args.start,
              end: args.end,
              datapoints: args.datapoints,
              format: args.format,
              aggregate: args.aggregate,
            },
          );

        // Device DataSource Instance Groups
        case 'list_resource_instance_groups':
          return await this.client.listDeviceDataSourceInstanceGroups(
            args.deviceId,
            args.deviceDataSourceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );

        case 'get_resource_instance_group':
          return await this.client.getDeviceDataSourceInstanceGroup(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceGroupId,
            { fields: args.fields },
          );

        case 'create_resource_instance_group':
          return await this.client.createDeviceDataSourceInstanceGroup(
            args.deviceId,
            args.deviceDataSourceId,
            args.config || {},
          );

        case 'update_resource_instance_group':
          return await this.client.updateDeviceDataSourceInstanceGroup(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceGroupId,
            args.config || {},
          );

        case 'update_instance_group_alert_threshold':
          return await this.client.updateInstanceGroupAlertThreshold(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceGroupId,
            args.datapointId,
            args.config || {},
          );

        case 'get_instance_group_overview_graph_data':
          return await this.client.getDeviceDataSourceInstanceGroupOverviewGraphData(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceGroupId,
            args.overviewGraphId,
            { start: args.start, end: args.end, format: args.format },
          );

        // Bulk instance data fetch & instance graph by id
        case 'fetch_instances_data':
          return await this.client.fetchDeviceInstancesData(args.config || {}, {
            period: args.period,
            start: args.start,
            end: args.end,
            aggregate: args.aggregate,
          });

        case 'get_instance_graph_data_by_id':
          return await this.client.getInstanceGraphDataById(args.instanceId, args.graphId, {
            start: args.start,
            end: args.end,
            format: args.format,
          });

        // Metrics
        case 'get_metrics_summary':
          return await this.client.getMetricsSummary({ fields: args.fields });

        case 'get_metrics_usage':
          return await this.client.getMetricsUsage({ fields: args.fields });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
