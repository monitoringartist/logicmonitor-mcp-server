import { filterFields, DEFAULT_DEVICE_GROUP_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const deviceGroupsToolHandlers: ToolHandlerMap = {
  'list_resource_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listDeviceGroups({
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
      items: result.items.map((group: any) =>
        filterFields(group, DEFAULT_DEVICE_GROUP_FIELDS),
      ),
    };
  },

  'get_resource_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_resource_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {
      name: args.name,
    };
    if (args.parentId) group.parentId = args.parentId;
    if (args.description) group.description = args.description;
    if (args.disableAlerting !== undefined) group.disableAlerting = args.disableAlerting;
    if (args.customProperties) group.customProperties = args.customProperties;
    return await client.createDeviceGroup(group);
  },

  'update_resource_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, opType, ...groupData } = args;
    return await client.updateDeviceGroup(groupId, groupData, {
      opType: opType || 'replace',
    });
  },

  'delete_resource_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDeviceGroup(args.groupId, {
      deleteChildren: args.deleteChildren,
    });
  },

  'list_resource_group_properties': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceGroupProperties(args.groupId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'update_resource_group_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDeviceGroupProperty(
      args.groupId,
      args.propertyName,
      args.value,
    );
  },

  'create_resource_group_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createDeviceGroupProperty(args.groupId, args.name, args.value);
  },

  'delete_resource_group_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDeviceGroupProperty(args.groupId, args.propertyName);
  },

  'list_resource_group_cluster_alert_confs': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceGroupClusterAlertConfs(args.groupId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_resource_group_cluster_alert_conf': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceGroupClusterAlertConf(args.groupId, args.clusterAlertConfId);
  },

  'create_resource_group_cluster_alert_conf': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, config, ...rest } = args;
    return await client.createDeviceGroupClusterAlertConf(groupId, { ...rest, ...(config || {}) });
  },

  'update_resource_group_cluster_alert_conf': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, clusterAlertConfId, config, ...rest } = args;
    return await client.updateDeviceGroupClusterAlertConf(groupId, clusterAlertConfId, { ...rest, ...(config || {}) });
  },

  'delete_resource_group_cluster_alert_conf': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDeviceGroupClusterAlertConf(args.groupId, args.clusterAlertConfId);
  },

  'list_resource_group_datasources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceGroupDatasources(args.groupId, {
      includeDisabledDataSourceWithoutInstance: args.includeDisabledDataSourceWithoutInstance,
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_resource_group_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceGroupDatasource(args.groupId, args.dataSourceId, { fields: args.fields });
  },

  'update_resource_group_datasource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, dataSourceId, config, ...rest } = args;
    return await client.updateDeviceGroupDatasource(groupId, dataSourceId, { ...rest, ...(config || {}) });
  },

  'get_resource_group_datasource_alert_setting': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceGroupDatasourceAlertSetting(args.groupId, args.dataSourceId, { fields: args.fields });
  },

  'update_resource_group_datasource_alert_setting': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, dataSourceId, config, ...rest } = args;
    return await client.updateDeviceGroupDatasourceAlertSetting(groupId, dataSourceId, { ...rest, ...(config || {}) });
  },

  'list_resource_group_alerts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    let filter = args.filter;
    if (args.cleared !== undefined) {
      const clearedFilter = `cleared:${args.cleared}`;
      filter = filter ? `${filter},${clearedFilter}` : clearedFilter;
    }
    return await client.listDeviceGroupAlerts(args.groupId, {
      needMessage: args.needMessage, customColumns: args.customColumns,
      size: args.size, offset: args.offset, filter: filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'list_resource_group_sdts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceGroupSDTs(args.groupId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_resource_group_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceGroupSDTHistory(args.groupId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },
};
