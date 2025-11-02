/**
 * LogicMonitor MCP Tool Handlers
 *
 * Implementation of tool handlers for LogicMonitor API operations
 */

import { LogicMonitorClient } from './client.js';
import { batchProcessor, smartBatchProcessor as _smartBatchProcessor } from '../utils/helpers/batch-processor.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../utils/helpers/filters.js';
import { LogicMonitorApiError } from '../utils/core/lm-error.js';
import { MCPError, ErrorCodes, ErrorSuggestions, createMCPError } from '../utils/core/error-handler.js';

// Default field sets for curated responses (when no fields parameter specified)
const DEFAULT_DEVICE_FIELDS = [
  'id', 'displayName', 'name', 'hostGroupIds', 'preferredCollectorId',
  'hostStatus', 'alertStatus', 'alertStatusPriority', 'disableAlerting',
  'customProperties', 'createdOn', 'updatedOn', 'sdtStatus', 'alertDisableStatus',
];

const DEFAULT_ALERT_FIELDS = [
  'id', 'internalId', 'type', 'startEpoch', 'endEpoch', 'acked', 'ackedBy',
  'severity', 'cleared', 'monitorObjectName', 'instanceName', 'dataPointName',
  'alertValue', 'threshold', 'resourceId', 'resourceTemplateName',
];

const DEFAULT_COLLECTOR_FIELDS = [
  'id', 'description', 'hostname', 'platform', 'status', 'numberOfHosts',
  'createdOn', 'updatedOn', 'escalatingChainId', 'suppressAlertClear',
];

const DEFAULT_DATASOURCE_FIELDS = [
  'id', 'name', 'displayName', 'description', 'appliesTo', 'group',
  'dataSourceType', 'collectMethod', 'technology', 'hasMultiInstances',
];

const DEFAULT_DASHBOARD_FIELDS = [
  'id', 'name', 'description', 'groupId', 'groupName', 'sharable',
  'createdOn', 'updatedOn', 'widgetsConfigVersion', 'widgetTokens',
];

const DEFAULT_WEBSITE_FIELDS = [
  'id', 'name', 'description', 'type', 'schema', 'domain', 'isInternal',
  'status', 'stopMonitoring', 'overallAlertLevel', 'createdOn',
];

const DEFAULT_USER_FIELDS = [
  'id', 'username', 'email', 'firstName', 'lastName', 'roles',
  'status', 'createdOn', 'lastAction', 'twoFAEnabled',
];

const DEFAULT_ROLE_FIELDS = [
  'id', 'name', 'description', 'requireEULA', 'roleGroupId',
  'customHelpLabel', 'customHelpURL', 'privileges',
];

const DEFAULT_SDT_FIELDS = [
  'id', 'type', 'admin', 'comment', 'startDateTime', 'endDateTime',
  'duration', 'isEffective', 'deviceId', 'deviceDisplayName',
];

const DEFAULT_DEVICE_GROUP_FIELDS = [
  'id', 'name', 'fullPath', 'description', 'parentId', 'numOfHosts',
  'numOfDirectDevices', 'createdOn', 'disableAlerting', 'alertStatus',
];

const DEFAULT_DASHBOARD_GROUP_FIELDS = [
  'id', 'name', 'description', 'parentId', 'numOfDashboards',
  'fullPath', 'widgetCount',
];

const DEFAULT_WEBSITE_GROUP_FIELDS = [
  'id', 'name', 'description', 'parentId', 'fullPath',
  'numOfWebsites', 'disableAlerting', 'stopMonitoring',
];

const DEFAULT_REPORT_FIELDS = [
  'id', 'name', 'description', 'type', 'groupId', 'groupName',
  'scheduleTimezone', 'format', 'lastGenerateOn', 'lastGenerateSize',
];

const DEFAULT_CONFIGSOURCE_FIELDS = [
  'id', 'name', 'displayName', 'description', 'appliesTo', 'group',
  'version', 'lineageId', 'hasMultiConfigs',
];

const DEFAULT_DEVICE_PROPERTY_FIELDS = [
  'name', 'value', 'type', 'inheritedFrom',
];

const DEFAULT_API_TOKEN_FIELDS = [
  'adminId', 'adminName', 'accessId', 'note', 'createdOn',
  'status', 'lastUsedOn',
];

const DEFAULT_AUDIT_LOG_FIELDS = [
  'id', 'happenedOn', 'username', 'sessionId', 'ip',
  'description', 'companyName', 'userId',
];

const DEFAULT_ACCESS_GROUP_FIELDS = [
  'id', 'name', 'description', 'tenantId', 'createdOn',
  'updatedOn', 'numOfDevices', 'numOfUsers',
];

/**
 * Filter object to only include specified fields
 */
function filterFields<T extends Record<string, any>>(obj: T, fields: string[]): Partial<T> {
  const filtered: any = {};
  for (const field of fields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }
  return filtered;
}

export class LogicMonitorHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handleToolCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        // Device Management
        case 'list_resources': {
          const result = await this.client.listDevices({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          // If user specified fields, return raw data
          if (args.fields) {
            return result;
          }

          // Otherwise, return curated fields
          return {
            ...result,
            items: result.items.map((device: any) =>
              filterFields(device, DEFAULT_DEVICE_FIELDS),
            ),
          };
        }

        case 'get_resource':
          return await this.client.getDevice(args.deviceId, {
            fields: args.fields,
          });

        case 'create_resource': {
          // Check if this is a batch operation
          if (args.devices && Array.isArray(args.devices)) {
            // Batch mode with adaptive concurrency support
            // Use smartBatchProcessor for automatic rate limit handling:
            // const result = await smartBatchProcessor.processBatchSmart(..., { adaptiveConcurrency: true })
            const batchOptions = args.batchOptions || {};
            const result = await batchProcessor.processBatch(
              args.devices,
              async (device: any) => {
                const deviceData: any = {
                  displayName: device.displayName,
                  name: device.name,
                  preferredCollectorId: device.preferredCollectorId,
                };
                if (device.hostGroupIds) deviceData.hostGroupIds = device.hostGroupIds;
                if (device.description) deviceData.description = device.description;
                if (device.disableAlerting !== undefined) deviceData.disableAlerting = device.disableAlerting;
                if (device.customProperties) deviceData.customProperties = device.customProperties;

                const created = await this.client.createDevice(deviceData);
                return { id: (created as any).id, displayName: (created as any).displayName };
              },
              {
                maxConcurrent: batchOptions.maxConcurrent || 5,
                continueOnError: batchOptions.continueOnError ?? true,
                retryOnRateLimit: true,
              },
            );

            // Return batch result in reference format
            return {
              success: result.success,
              summary: result.summary,
              devices: result.results.map(r => ({
                index: r.index,
                success: r.success,
                ...(r.success ? { device: r.data } : { error: r.error }),
              })),
            };
          }

          // Single mode
          const device: any = {
            displayName: args.displayName,
            name: args.name,
            preferredCollectorId: args.preferredCollectorId,
          };
          if (args.hostGroupIds) device.hostGroupIds = args.hostGroupIds;
          if (args.description) device.description = args.description;
          if (args.disableAlerting !== undefined) device.disableAlerting = args.disableAlerting;
          if (args.customProperties) device.customProperties = args.customProperties;
          return await this.client.createDevice(device);
        }

        case 'update_resource': {
          // Check if this is a batch operation
          if (args.devices && Array.isArray(args.devices)) {
            // Batch mode
            const batchOptions = args.batchOptions || {};
            const result = await batchProcessor.processBatch(
              args.devices,
              async (device: any) => {
                const { deviceId, opType, ...deviceData } = device;
                const updated = await this.client.updateDevice(deviceId, deviceData, {
                  opType: opType || 'replace',
                });
                return { id: (updated as any).id, displayName: (updated as any).displayName };
              },
              {
                maxConcurrent: batchOptions.maxConcurrent || 5,
                continueOnError: batchOptions.continueOnError ?? true,
                retryOnRateLimit: true,
              },
            );

            // Return batch result in reference format
            return {
              success: result.success,
              summary: result.summary,
              devices: result.results.map(r => ({
                index: r.index,
                success: r.success,
                ...(r.success ? { device: r.data } : { error: r.error }),
              })),
            };
          }

          // Single mode
          const { deviceId, opType, ...deviceData } = args;
          return await this.client.updateDevice(deviceId, deviceData, {
            opType: opType || 'replace',
          });
        }

        case 'delete_resource': {
          // Check if this is a batch operation
          if (args.deviceIds && Array.isArray(args.deviceIds)) {
            // Batch mode
            const batchOptions = args.batchOptions || {};
            const result = await batchProcessor.processBatch(
              args.deviceIds,
              async (deviceId: number) => {
                await this.client.deleteDevice(deviceId, {
                  deleteFromSystem: args.deleteFromSystem,
                });
                return { id: deviceId };
              },
              {
                maxConcurrent: batchOptions.maxConcurrent || 5,
                continueOnError: batchOptions.continueOnError ?? true,
                retryOnRateLimit: true,
              },
            );

            // Return batch result in reference format
            return {
              success: result.success,
              summary: result.summary,
              devices: result.results.map(r => ({
                index: r.index,
                success: r.success,
                ...(r.success ? { device: r.data } : { error: r.error }),
              })),
            };
          }

          // Single mode
          return await this.client.deleteDevice(args.deviceId, {
            deleteFromSystem: args.deleteFromSystem,
          });
        }

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

        // Alerts
        case 'list_alerts': {
          const result = await this.client.listAlerts({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            needMessage: args.needMessage,
            autoPaginate: args.autoPaginate,
          });

          // If user specified fields, return raw data
          if (args.fields) {
            return result;
          }

          // Otherwise, return curated fields
          return {
            ...result,
            items: result.items.map((alert: any) =>
              filterFields(alert, DEFAULT_ALERT_FIELDS),
            ),
          };
        }

        case 'get_alert':
          return await this.client.getAlert(args.alertId, {
            fields: args.fields,
            needMessage: args.needMessage,
          });

        case 'acknowledge_alert':
          return await this.client.acknowledgeAlert(args.alertId, args.comment);

        case 'add_alert_note':
          return await this.client.addAlertNote(args.alertId, args.note);

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

        // Device DataSource Instances
        case 'list_device_instances':
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

        case 'get_device_instance_data':
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

        // Dashboards
        case 'list_dashboards': {
          const result = await this.client.listDashboards({
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
            items: result.items.map((dashboard: any) =>
              filterFields(dashboard, DEFAULT_DASHBOARD_FIELDS),
            ),
          };
        }

        case 'get_dashboard':
          return await this.client.getDashboard(args.dashboardId, {
            fields: args.fields,
          });

        case 'create_dashboard': {
          const dashboard: any = {
            name: args.name,
          };
          if (args.description) dashboard.description = args.description;
          if (args.groupId) dashboard.groupId = args.groupId;
          if (args.widgetsConfig) dashboard.widgetsConfig = args.widgetsConfig;
          return await this.client.createDashboard(dashboard);
        }

        case 'update_dashboard': {
          const { dashboardId, ...dashboardData } = args;
          return await this.client.updateDashboard(dashboardId, dashboardData);
        }

        case 'delete_dashboard':
          return await this.client.deleteDashboard(args.dashboardId);

        case 'generate_dashboard_deeplink':
          return await this.client.generateDashboardDeeplink(args.dashboardId);

        case 'generate_resource_deeplink':
          return await this.client.generateResourceDeeplink(args.deviceId);

        case 'generate_alert_deeplink':
          return await this.client.generateAlertDeeplink(args.alertId);

        case 'generate_website_deeplink':
          return await this.client.generateWebsiteDeeplink(args.websiteId);

        // Dashboard Groups
        case 'list_dashboard_groups': {
          const result = await this.client.listDashboardGroups({
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
              filterFields(group, DEFAULT_DASHBOARD_GROUP_FIELDS),
            ),
          };
        }

        case 'get_dashboard_group':
          return await this.client.getDashboardGroup(args.groupId, {
            fields: args.fields,
          });

        // Reports
        case 'list_reports': {
          const result = await this.client.listReports({
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
            items: result.items.map((report: any) =>
              filterFields(report, DEFAULT_REPORT_FIELDS),
            ),
          };
        }

        case 'get_report':
          return await this.client.getReport(args.reportId, {
            fields: args.fields,
          });

        // Websites
        case 'list_websites': {
          const result = await this.client.listWebsites({
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
            items: result.items.map((website: any) =>
              filterFields(website, DEFAULT_WEBSITE_FIELDS),
            ),
          };
        }

        case 'get_website':
          return await this.client.getWebsite(args.websiteId, {
            fields: args.fields,
          });

        case 'create_website': {
          const website: any = {
            name: args.name,
            domain: args.domain,
            type: args.type,
          };
          if (args.description) website.description = args.description;
          if (args.checkpointId) website.checkpointId = args.checkpointId;
          return await this.client.createWebsite(website);
        }

        case 'update_website': {
          const { websiteId, ...websiteData } = args;
          return await this.client.updateWebsite(websiteId, websiteData);
        }

        case 'delete_website':
          return await this.client.deleteWebsite(args.websiteId);

        // Website Groups
        case 'list_website_groups': {
          const result = await this.client.listWebsiteGroups({
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
              filterFields(group, DEFAULT_WEBSITE_GROUP_FIELDS),
            ),
          };
        }

        case 'get_website_group':
          return await this.client.getWebsiteGroup(args.groupId, {
            fields: args.fields,
          });

        // Users
        case 'list_users': {
          const result = await this.client.listUsers({
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
            items: result.items.map((user: any) =>
              filterFields(user, DEFAULT_USER_FIELDS),
            ),
          };
        }

        case 'get_user':
          return await this.client.getUser(args.userId, {
            fields: args.fields,
          });

        // Roles
        case 'list_roles': {
          const result = await this.client.listRoles({
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
            items: result.items.map((role: any) =>
              filterFields(role, DEFAULT_ROLE_FIELDS),
            ),
          };
        }

        case 'get_role':
          return await this.client.getRole(args.roleId, {
            fields: args.fields,
          });

        // API Tokens
        case 'list_api_tokens': {
          const result = await this.client.listApiTokens(args.userId, {
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
            items: result.items.map((token: any) =>
              filterFields(token, DEFAULT_API_TOKEN_FIELDS),
            ),
          };
        }

        // SDTs
        case 'list_sdts': {
          const result = await this.client.listSDTs({
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
            items: result.items.map((sdt: any) =>
              filterFields(sdt, DEFAULT_SDT_FIELDS),
            ),
          };
        }

        case 'get_sdt':
          return await this.client.getSDT(args.sdtId, {
            fields: args.fields,
          });

        case 'create_device_sdt': {
          const sdt: any = {
            sdtType: 1, // Device SDT
            deviceId: args.deviceId,
            type: args.type,
            startDateTime: args.startDateTime,
            endDateTime: args.endDateTime,
          };
          if (args.comment) sdt.comment = args.comment;
          return await this.client.createDeviceSDT(sdt);
        }

        case 'delete_sdt':
          return await this.client.deleteSDT(args.sdtId);

        // ConfigSources
        case 'list_configsources': {
          const result = await this.client.listConfigSources({
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
            items: result.items.map((configsource: any) =>
              filterFields(configsource, DEFAULT_CONFIGSOURCE_FIELDS),
            ),
          };
        }

        case 'get_configsource':
          return await this.client.getConfigSource(args.configSourceId, {
            fields: args.fields,
          });

        // Device Properties
        case 'list_device_properties': {
          const result = await this.client.listDeviceProperties(args.deviceId, {
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
            items: result.items.map((property: any) =>
              filterFields(property, DEFAULT_DEVICE_PROPERTY_FIELDS),
            ),
          };
        }

        case 'update_device_property':
          return await this.client.updateDeviceProperty(
            args.deviceId,
            args.propertyName,
            args.value,
          );

        // Search Tools (aliases with specific filters)
        case 'search_devices': {
          return await this.client.listDevices({
            size: args.size,
            offset: args.offset,
            filter: autoFormatFilter(args.query, SEARCH_FIELDS.devices),
            autoPaginate: args.autoPaginate,
          });
        }

        case 'search_alerts': {
          // Alert API doesn't support OR (||) operator, so handle differently
          let filter: string | undefined;
          if (args.query.includes(':') || args.query.includes('~')) {
            // User provided filter syntax - format it
            filter = autoFormatFilter(args.query);
          } else {
            // Free text search - use only monitorObjectName (most relevant field for alerts)
            // This is the resource/device name where the alert occurred
            filter = autoFormatFilter(args.query, ['monitorObjectName']);
          }

          return await this.client.listAlerts({
            size: args.size,
            offset: args.offset,
            filter: filter,
            autoPaginate: args.autoPaginate,
          });
        }

        // Audit Logs
        case 'list_audit_logs': {
          const result = await this.client.listAuditLogs({
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
            items: result.items.map((auditLog: any) =>
              filterFields(auditLog, DEFAULT_AUDIT_LOG_FIELDS),
            ),
          };
        }

        case 'get_audit_log':
          return await this.client.getAuditLog(args.auditLogId, {
            fields: args.fields,
          });

        case 'search_audit_logs': {
          return await this.client.listAuditLogs({
            size: args.size,
            offset: args.offset,
            filter: autoFormatFilter(args.query, SEARCH_FIELDS.auditLogs),
            autoPaginate: args.autoPaginate,
          });
        }

        // Access Groups
        case 'list_access_groups': {
          const result = await this.client.listAccessGroups({
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
            items: result.items.map((accessGroup: any) =>
              filterFields(accessGroup, DEFAULT_ACCESS_GROUP_FIELDS),
            ),
          };
        }

        case 'get_access_group':
          return await this.client.getAccessGroup(args.accessGroupId, {
            fields: args.fields,
          });

        case 'create_access_group': {
          const data: any = {
            name: args.name,
            description: args.description,
          };
          if (args.tenantId !== undefined) data.tenantId = args.tenantId;
          return await this.client.createAccessGroup(data);
        }

        case 'update_access_group': {
          const data: any = {};
          if (args.name !== undefined) data.name = args.name;
          if (args.description !== undefined) data.description = args.description;
          if (args.tenantId !== undefined) data.tenantId = args.tenantId;
          return await this.client.updateAccessGroup(args.accessGroupId, data);
        }

        case 'delete_access_group':
          return await this.client.deleteAccessGroup(args.accessGroupId);

        // Device DataSources
        case 'list_device_datasources':
          return await this.client.listDeviceDataSources(args.deviceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_device_datasource':
          return await this.client.getDeviceDataSource(args.deviceId, args.deviceDataSourceId, {
            fields: args.fields,
          });

        case 'update_device_datasource': {
          const data: any = {};
          if (args.disableAlerting !== undefined) data.disableAlerting = args.disableAlerting;
          if (args.stopMonitoring !== undefined) data.stopMonitoring = args.stopMonitoring;
          return await this.client.updateDeviceDataSource(args.deviceId, args.deviceDataSourceId, data);
        }

        // EventSources
        case 'list_eventsources':
          return await this.client.listEventSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_eventsource':
          return await this.client.getEventSource(args.eventSourceId, {
            fields: args.fields,
          });

        // Escalation Chains
        case 'list_escalation_chains':
          return await this.client.listEscalationChains({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_escalation_chain':
          return await this.client.getEscalationChain(args.chainId, {
            fields: args.fields,
          });

        case 'create_escalation_chain': {
          const chain: any = {
            name: args.name,
            description: args.description || '',
          };
          if (args.stages) chain.stages = args.stages;
          return await this.client.createEscalationChain(chain);
        }

        case 'update_escalation_chain': {
          const chain: any = {};
          if (args.name) chain.name = args.name;
          if (args.description !== undefined) chain.description = args.description;
          if (args.stages) chain.stages = args.stages;
          return await this.client.updateEscalationChain(args.chainId, chain);
        }

        case 'delete_escalation_chain':
          return await this.client.deleteEscalationChain(args.chainId);

        // Recipients
        case 'list_recipients':
          return await this.client.listRecipients({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_recipient':
          return await this.client.getRecipient(args.recipientId, {
            fields: args.fields,
          });

        case 'create_recipient': {
          const recipient: any = {
            type: args.type,
            addr: args.addr,
          };
          if (args.name) recipient.name = args.name;
          if (args.method) recipient.method = args.method;
          return await this.client.createRecipient(recipient);
        }

        case 'update_recipient': {
          const recipient: any = {};
          if (args.name) recipient.name = args.name;
          if (args.addr) recipient.addr = args.addr;
          if (args.method) recipient.method = args.method;
          return await this.client.updateRecipient(args.recipientId, recipient);
        }

        case 'delete_recipient':
          return await this.client.deleteRecipient(args.recipientId);

        // Recipient Groups
        case 'list_recipient_groups':
          return await this.client.listRecipientGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_recipient_group':
          return await this.client.getRecipientGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_recipient_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          if (args.recipientIds) group.recipientIds = args.recipientIds;
          return await this.client.createRecipientGroup(group);
        }

        case 'update_recipient_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          if (args.recipientIds) group.recipientIds = args.recipientIds;
          return await this.client.updateRecipientGroup(args.groupId, group);
        }

        case 'delete_recipient_group':
          return await this.client.deleteRecipientGroup(args.groupId);

        // Alert Rules
        case 'list_alert_rules':
          return await this.client.listAlertRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_alert_rule':
          return await this.client.getAlertRule(args.ruleId, {
            fields: args.fields,
          });

        case 'create_alert_rule': {
          const rule: any = {
            name: args.name,
            priority: args.priority || 10,
            escalationChainId: args.escalationChainId,
          };
          if (args.devices) rule.devices = args.devices;
          if (args.datasources) rule.datasources = args.datasources;
          if (args.escalatingChainId) rule.escalatingChainId = args.escalatingChainId;
          return await this.client.createAlertRule(rule);
        }

        case 'update_alert_rule': {
          const rule: any = {};
          if (args.name) rule.name = args.name;
          if (args.priority !== undefined) rule.priority = args.priority;
          if (args.escalationChainId) rule.escalationChainId = args.escalationChainId;
          if (args.devices) rule.devices = args.devices;
          if (args.datasources) rule.datasources = args.datasources;
          return await this.client.updateAlertRule(args.ruleId, rule);
        }

        case 'delete_alert_rule':
          return await this.client.deleteAlertRule(args.ruleId);

        // OpsNotes
        case 'list_opsnotes':
          return await this.client.listOpsNotes({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_opsnote':
          return await this.client.getOpsNote(args.opsNoteId, {
            fields: args.fields,
          });

        case 'create_opsnote': {
          const opsNote: any = {
            note: args.note,
            scopes: args.scopes || [],
          };
          if (args.tags) opsNote.tags = args.tags;
          if (args.happenOnInSec) opsNote.happenOnInSec = args.happenOnInSec;
          return await this.client.createOpsNote(opsNote);
        }

        case 'update_opsnote': {
          const opsNote: any = {};
          if (args.note) opsNote.note = args.note;
          if (args.scopes) opsNote.scopes = args.scopes;
          if (args.tags) opsNote.tags = args.tags;
          return await this.client.updateOpsNote(args.opsNoteId, opsNote);
        }

        case 'delete_opsnote':
          return await this.client.deleteOpsNote(args.opsNoteId);

        // Services
        case 'list_services':
          return await this.client.listServices({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_service':
          return await this.client.getService(args.serviceId, {
            fields: args.fields,
          });

        case 'create_service': {
          const service: any = {
            name: args.name,
            type: args.type || 'default',
          };
          if (args.description) service.description = args.description;
          if (args.groupId) service.groupId = args.groupId;
          return await this.client.createService(service);
        }

        case 'update_service': {
          const service: any = {};
          if (args.name) service.name = args.name;
          if (args.description !== undefined) service.description = args.description;
          return await this.client.updateService(args.serviceId, service);
        }

        case 'delete_service':
          return await this.client.deleteService(args.serviceId);

        // Service Groups
        case 'list_service_groups':
          return await this.client.listServiceGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_service_group':
          return await this.client.getServiceGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_service_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          if (args.parentId) group.parentId = args.parentId;
          return await this.client.createServiceGroup(group);
        }

        case 'update_service_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          return await this.client.updateServiceGroup(args.groupId, group);
        }

        case 'delete_service_group':
          return await this.client.deleteServiceGroup(args.groupId);

        // Report Groups
        case 'list_report_groups':
          return await this.client.listReportGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_report_group':
          return await this.client.getReportGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_report_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          return await this.client.createReportGroup(group);
        }

        case 'update_report_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          return await this.client.updateReportGroup(args.groupId, group);
        }

        case 'delete_report_group':
          return await this.client.deleteReportGroup(args.groupId);

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

        // Device Group Properties
        case 'list_device_group_properties':
          return await this.client.listDeviceGroupProperties(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'update_device_group_property':
          return await this.client.updateDeviceGroupProperty(
            args.groupId,
            args.propertyName,
            args.value,
          );

        // Netscans
        case 'list_netscans':
          return await this.client.listNetscans({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_netscan':
          return await this.client.getNetscan(args.netscanId, {
            fields: args.fields,
          });

        case 'create_netscan': {
          const netscan: any = {
            name: args.name,
            collectorId: args.collectorId,
            schedule: args.schedule || { cron: '0 0 * * *' },
          };
          if (args.description) netscan.description = args.description;
          if (args.excludeDuplicateType) netscan.excludeDuplicateType = args.excludeDuplicateType;
          if (args.subnet) netscan.subnet = args.subnet;
          return await this.client.createNetscan(netscan);
        }

        case 'update_netscan': {
          const netscan: any = {};
          if (args.name) netscan.name = args.name;
          if (args.description !== undefined) netscan.description = args.description;
          if (args.schedule) netscan.schedule = args.schedule;
          return await this.client.updateNetscan(args.netscanId, netscan);
        }

        case 'delete_netscan':
          return await this.client.deleteNetscan(args.netscanId);

        // Integrations
        case 'list_integrations':
          return await this.client.listIntegrations({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_integration':
          return await this.client.getIntegration(args.integrationId, {
            fields: args.fields,
          });

        case 'create_integration': {
          const integration: any = {
            name: args.name,
            type: args.type,
          };
          if (args.url) integration.url = args.url;
          if (args.extra) integration.extra = args.extra;
          return await this.client.createIntegration(integration);
        }

        case 'update_integration': {
          const integration: any = {};
          if (args.name) integration.name = args.name;
          if (args.url) integration.url = args.url;
          if (args.extra) integration.extra = args.extra;
          return await this.client.updateIntegration(args.integrationId, integration);
        }

        case 'delete_integration':
          return await this.client.deleteIntegration(args.integrationId);

        // Website Checkpoints
        case 'list_website_checkpoints':
          return await this.client.listWebsiteCheckpoints({
            fields: args.fields,
          });

        // Topology
        case 'get_topology':
          return await this.client.getTopology({
            fields: args.fields,
          });

        // Collector Versions
        case 'list_collector_versions':
          return await this.client.listCollectorVersions({
            size: args.size,
            offset: args.offset,
            fields: args.fields,
          });

        default:
          throw new MCPError(
            `Unknown tool: ${name}`,
            ErrorCodes.INVALID_PARAMETERS,
            { toolName: name },
            [
              'Check the tool name spelling',
              'Run list_tools to see available tools',
              'Verify you are using a supported tool version',
            ],
          );
      }
    } catch (error) {
      // If it's already an MCPError, re-throw it
      if (error instanceof MCPError) {
        throw error;
      }

      // If it's a LogicMonitor API error, convert to MCPError with suggestions
      if (error instanceof LogicMonitorApiError) {
        throw this.convertLMErrorToMCPError(error, name);
      }

      // For other errors, wrap them in MCPError
      if (error instanceof Error) {
        throw createMCPError(error, {
          operation: name,
          code: ErrorCodes.INTERNAL_ERROR,
          suggestions: [
            'Check the server logs for more details',
            'Verify your LogicMonitor credentials are valid',
            'Ensure the API endpoint is accessible',
          ],
        });
      }
      throw error;
    }
  }

  /**
   * Convert LogicMonitor API error to MCPError with contextual suggestions
   */
  private convertLMErrorToMCPError(error: LogicMonitorApiError, toolName: string): MCPError {
    const httpStatus = error.status;
    const lmError = error.errorMessage;

    // Determine error code and suggestions based on operation and HTTP status
    let code: string = ErrorCodes.API_REQUEST_FAILED;
    let suggestions: string[] = [];

    // Authentication errors (401, 403)
    if (httpStatus === 401 || httpStatus === 403) {
      code = httpStatus === 401 ? ErrorCodes.AUTHENTICATION_FAILED : ErrorCodes.INSUFFICIENT_PERMISSIONS;
      suggestions = [...ErrorSuggestions.authentication];
    }
    // Not found errors (404)
    else if (httpStatus === 404) {
      if (toolName.includes('device') || toolName.includes('resource')) {
        code = ErrorCodes.DEVICE_NOT_FOUND;
        suggestions = [
          'Verify the device ID exists',
          'Check if the device was recently deleted',
          'Use list_resources or search_devices to find the correct ID',
        ];
      } else if (toolName.includes('group')) {
        code = ErrorCodes.GROUP_NOT_FOUND;
        suggestions = [...ErrorSuggestions.groupOperations];
      } else if (toolName.includes('alert')) {
        code = ErrorCodes.ALERT_NOT_FOUND;
        suggestions = [...ErrorSuggestions.alertOperations];
      } else {
        suggestions = [
          'Verify the resource ID exists',
          'Check if the resource was recently deleted',
          'Use the appropriate list command to find valid IDs',
        ];
      }
    }
    // Rate limit errors (429)
    else if (httpStatus === 429) {
      code = ErrorCodes.RATE_LIMIT_EXCEEDED;
      suggestions = [...ErrorSuggestions.rateLimit];
    }
    // Validation errors (400)
    else if (httpStatus === 400) {
      code = ErrorCodes.INVALID_PARAMETERS;
      suggestions = [...ErrorSuggestions.validation];

      // Add operation-specific suggestions
      if (toolName.includes('create')) {
        if (toolName.includes('device') || toolName.includes('resource')) {
          code = ErrorCodes.DEVICE_CREATE_FAILED;
          suggestions = [...ErrorSuggestions.deviceCreate];
        } else if (toolName.includes('group')) {
          code = ErrorCodes.GROUP_CREATE_FAILED;
          suggestions = [...ErrorSuggestions.groupOperations];
        }
      } else if (toolName.includes('update')) {
        if (toolName.includes('device') || toolName.includes('resource')) {
          code = ErrorCodes.DEVICE_UPDATE_FAILED;
          suggestions = [...ErrorSuggestions.deviceUpdate];
        } else if (toolName.includes('group')) {
          code = ErrorCodes.GROUP_UPDATE_FAILED;
          suggestions = [...ErrorSuggestions.groupOperations];
        }
      } else if (toolName.includes('delete')) {
        if (toolName.includes('device') || toolName.includes('resource')) {
          code = ErrorCodes.DEVICE_DELETE_FAILED;
          suggestions = [...ErrorSuggestions.deviceDelete];
        } else if (toolName.includes('group')) {
          code = ErrorCodes.GROUP_DELETE_FAILED;
          suggestions = [...ErrorSuggestions.groupOperations];
        }
      } else if (toolName.includes('acknowledge_alert')) {
        code = ErrorCodes.ALERT_ACK_FAILED;
        suggestions = [...ErrorSuggestions.alertOperations];
      } else if (toolName.includes('alert_note')) {
        code = ErrorCodes.ALERT_NOTE_FAILED;
        suggestions = [...ErrorSuggestions.alertOperations];
      }
    }
    // Server errors (5xx)
    else if (httpStatus >= 500) {
      code = ErrorCodes.API_REQUEST_FAILED;
      suggestions = [
        'LogicMonitor API is experiencing issues',
        'Wait a few moments and retry',
        'Check LogicMonitor status page',
        'Contact LogicMonitor support if the issue persists',
      ];
    }
    // Network/timeout errors
    else if (httpStatus === 0 || httpStatus === -1) {
      code = ErrorCodes.NETWORK_ERROR;
      suggestions = [...ErrorSuggestions.networkError];
    }

    return new MCPError(
      lmError || error.message,
      code,
      {
        tool: toolName,
        httpStatus,
        apiError: error.toJSON(),
      },
      suggestions,
    );
  }

  formatResponse(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}
