import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_DEVICE_GROUP_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class DeviceGroupsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Device Groups
        case 'list_resource_groups': {
          const result = await this.client.listDeviceGroups({
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
        }

        case 'get_resource_group':
          return await this.client.getDeviceGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_resource_group': {
          const group: any = {
            name: args.name,
          };
          if (args.parentId) group.parentId = args.parentId;
          if (args.description) group.description = args.description;
          if (args.disableAlerting !== undefined) group.disableAlerting = args.disableAlerting;
          if (args.customProperties) group.customProperties = args.customProperties;
          return await this.client.createDeviceGroup(group);
        }

        case 'update_resource_group': {
          const { groupId, opType, ...groupData } = args;
          return await this.client.updateDeviceGroup(groupId, groupData, {
            opType: opType || 'replace',
          });
        }

        case 'delete_resource_group':
          return await this.client.deleteDeviceGroup(args.groupId, {
            deleteChildren: args.deleteChildren,
          });

        // Device Group Properties
        case 'list_resource_group_properties':
          return await this.client.listDeviceGroupProperties(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'update_resource_group_property':
          return await this.client.updateDeviceGroupProperty(
            args.groupId,
            args.propertyName,
            args.value,
          );

        case 'create_resource_group_property':
          return await this.client.createDeviceGroupProperty(args.groupId, args.name, args.value);

        case 'delete_resource_group_property':
          return await this.client.deleteDeviceGroupProperty(args.groupId, args.propertyName);

        // Device Group - Cluster Alert Configurations
        case 'list_resource_group_cluster_alert_confs':
          return await this.client.listDeviceGroupClusterAlertConfs(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_resource_group_cluster_alert_conf':
          return await this.client.getDeviceGroupClusterAlertConf(args.groupId, args.id);

        case 'create_resource_group_cluster_alert_conf': {
          const { groupId, config, ...rest } = args;
          return await this.client.createDeviceGroupClusterAlertConf(groupId, { ...rest, ...(config || {}) });
        }

        case 'update_resource_group_cluster_alert_conf': {
          const { groupId, id, config, ...rest } = args;
          return await this.client.updateDeviceGroupClusterAlertConf(groupId, id, { ...rest, ...(config || {}) });
        }

        case 'delete_resource_group_cluster_alert_conf':
          return await this.client.deleteDeviceGroupClusterAlertConf(args.groupId, args.id);

        // Device Group - DataSources
        case 'list_resource_group_datasources':
          return await this.client.listDeviceGroupDatasources(args.groupId, {
            includeDisabledDataSourceWithoutInstance: args.includeDisabledDataSourceWithoutInstance,
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_resource_group_datasource':
          return await this.client.getDeviceGroupDatasource(args.groupId, args.id, { fields: args.fields });

        case 'update_resource_group_datasource': {
          const { groupId, id, config, ...rest } = args;
          return await this.client.updateDeviceGroupDatasource(groupId, id, { ...rest, ...(config || {}) });
        }

        // Device Group - DataSource Alert Settings
        case 'get_resource_group_datasource_alert_setting':
          return await this.client.getDeviceGroupDatasourceAlertSetting(args.groupId, args.dsId, { fields: args.fields });

        case 'update_resource_group_datasource_alert_setting': {
          const { groupId, dsId, config, ...rest } = args;
          return await this.client.updateDeviceGroupDatasourceAlertSetting(groupId, dsId, { ...rest, ...(config || {}) });
        }

        // Device Group - Alerts / SDTs
        case 'list_resource_group_alerts': {
          let filter = args.filter;
          if (args.cleared !== undefined) {
            const clearedFilter = `cleared:${args.cleared}`;
            filter = filter ? `${filter},${clearedFilter}` : clearedFilter;
          }
          return await this.client.listDeviceGroupAlerts(args.groupId, {
            needMessage: args.needMessage, customColumns: args.customColumns,
            size: args.size, offset: args.offset, filter: filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });
        }

        case 'list_resource_group_sdts':
          return await this.client.listDeviceGroupSDTs(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_resource_group_sdt_history':
          return await this.client.getDeviceGroupSDTHistory(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
