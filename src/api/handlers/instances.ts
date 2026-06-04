import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const instancesToolHandlers: ToolHandlerMap = {
  'list_resource_instances': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceDataSourceInstances(
      args.deviceId,
      args.deviceDataSourceId,
      {
        size: args.size,
        offset: args.offset,
        filter: args.filter,
        fields: args.fields,
      },
    );
  },

  'get_resource_instance_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceInstanceData(
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
  },

  'create_resource_instance': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createDeviceDataSourceInstance(
      args.deviceId,
      args.deviceDataSourceId,
      args.config || {},
    );
  },

  'update_resource_instance': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDeviceDataSourceInstance(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      args.config || {},
      { opType: args.opType },
    );
  },

  'delete_resource_instance': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDeviceDataSourceInstance(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
    );
  },

  'get_instance_graph_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceInstanceGraphData(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      args.graphId,
      { start: args.start, end: args.end, format: args.format },
    );
  },

  'get_resource_datasource_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceData(
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
  },

  'list_resource_instance_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceDataSourceInstanceGroups(
      args.deviceId,
      args.deviceDataSourceId,
      { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
    );
  },

  'get_resource_instance_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceInstanceGroup(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceGroupId,
      { fields: args.fields },
    );
  },

  'create_resource_instance_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createDeviceDataSourceInstanceGroup(
      args.deviceId,
      args.deviceDataSourceId,
      args.config || {},
    );
  },

  'update_resource_instance_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDeviceDataSourceInstanceGroup(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceGroupId,
      args.config || {},
    );
  },

  'update_instance_group_alert_threshold': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateInstanceGroupAlertThreshold(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceGroupId,
      args.datapointId,
      args.config || {},
    );
  },

  'get_instance_group_overview_graph_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceInstanceGroupOverviewGraphData(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceGroupId,
      args.overviewGraphId,
      { start: args.start, end: args.end, format: args.format },
    );
  },

  'fetch_instances_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.fetchDeviceInstancesData(args.config || {}, {
      period: args.period,
      start: args.start,
      end: args.end,
      aggregate: args.aggregate,
    });
  },

  'get_instance_graph_data_by_id': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getInstanceGraphDataById(args.instanceId, args.graphId, {
      start: args.start,
      end: args.end,
      format: args.format,
    });
  },

  'get_metrics_summary': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getMetricsSummary({ fields: args.fields });
  },

  'get_metrics_usage': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getMetricsUsage({ fields: args.fields });
  },
};
