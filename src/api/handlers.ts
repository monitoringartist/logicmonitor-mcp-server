/**
 * LogicMonitor MCP Tool Handlers
 *
 * Implementation of tool handlers for LogicMonitor API operations
 */

import { LogicMonitorClient } from './client.js';
import { batchProcessor, smartBatchProcessor as _smartBatchProcessor } from '../utils/helpers/batch-processor.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../utils/helpers/filters.js';
import { validateFields } from '../utils/helpers/validate-fields.js';
import { LogicMonitorApiError } from '../utils/core/lm-error.js';
import { MCPError, ErrorCodes, ErrorSuggestions, createMCPError } from '../utils/core/error-handler.js';

// Default field sets for curated responses (when no fields parameter specified)
const DEFAULT_DEVICE_FIELDS = [
  'id', 'displayName', 'name', 'hostGroupIds', 'preferredCollectorId',
  'hostStatus', 'alertStatus', 'alertStatusPriority', 'disableAlerting',
  'customProperties', 'sdtStatus',
];

const DEFAULT_ALERT_FIELDS = [
  'id', 'internalId', 'type', 'startEpoch', 'endEpoch', 'acked', 'ackedBy',
  'severity', 'cleared', 'monitorObjectName', 'instanceName', 'dataPointName',
  'alertValue', 'threshold', 'resourceId', 'resourceTemplateName',
];

const DEFAULT_COLLECTOR_FIELDS = [
  'id', 'description', 'hostname', 'platform', 'status', 'numberOfHosts',
  'escalatingChainId', 'suppressAlertClear',
];

const DEFAULT_DATASOURCE_FIELDS = [
  'id', 'name', 'displayName', 'description', 'group',
  'dataSourceType', 'collectMethod', 'hasMultiInstances',
];

const DEFAULT_DASHBOARD_FIELDS = [
  'id', 'name', 'description', 'groupId', 'groupName',
  'widgetsConfigVersion', 'widgetTokens',
];

const DEFAULT_WEBSITE_FIELDS = [
  'id', 'name', 'description', 'type', 'schema', 'domain', 'isInternal',
  'status', 'stopMonitoring', 'overallAlertLevel',
];

const DEFAULT_USER_FIELDS = [
  'id', 'username', 'email', 'firstName', 'lastName', 'roles',
  'status', 'lastAction',
];

const DEFAULT_ROLE_FIELDS = [
  'id', 'name', 'description', 'roleGroupId',
  'customHelpLabel', 'customHelpURL', 'privileges',
];

const DEFAULT_SDT_FIELDS = [
  'id', 'type', 'admin', 'comment', 'startDateTime', 'endDateTime',
  'duration', 'isEffective', 'deviceId', 'deviceDisplayName',
];

const DEFAULT_DEVICE_GROUP_FIELDS = [
  'id', 'name', 'fullPath', 'description', 'parentId', 'numOfHosts',
  'numOfDirectDevices', 'disableAlerting', 'alertStatus',
];

const DEFAULT_DASHBOARD_GROUP_FIELDS = [
  'id', 'name', 'description', 'parentId', 'numOfDashboards',
  'fullPath',
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
  'adminId', 'adminName', 'accessId', 'note',
  'status', 'lastUsedOn',
];

const DEFAULT_AUDIT_LOG_FIELDS = [
  'id', 'happenedOn', 'username', 'sessionId', 'ip',
  'description', 'userId',
];

const DEFAULT_ACCESS_GROUP_FIELDS = [
  'id', 'name', 'description', 'tenantId',
  'numOfDevices', 'numOfUsers',
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

// Type for progress notification callback
type ProgressCallback = (progress: number, total: number) => Promise<void>;

export class LogicMonitorHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handleToolCall(
    name: string,
    args: any,
    progressCallback?: ProgressCallback,
  ): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model). Catches typo'd
      // field names that the API would otherwise silently ignore.
      validateFields(name, args?.fields);

      switch (name) {
        // Resource Management
        case 'list_resources': {
          // Handle query parameter - convert to filter
          let filter = args.filter;
          if (args.query) {
            const queryFilter = autoFormatFilter(args.query, SEARCH_FIELDS.devices);
            // Combine with existing filter using AND logic
            filter = filter ? `${queryFilter},${filter}` : queryFilter;
          }

          const result = await this.client.listResources({
            size: args.size,
            offset: args.offset,
            filter: filter,
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
                onProgress: progressCallback ? (completed, total) => {
                  // Send progress notification if callback provided
                  progressCallback(completed, total).catch(() => {
                    // Ignore errors in progress notifications
                  });
                } : undefined,
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
                onProgress: progressCallback ? (completed, total) => {
                  progressCallback(completed, total).catch(() => {});
                } : undefined,
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
                onProgress: progressCallback ? (completed, total) => {
                  progressCallback(completed, total).catch(() => {});
                } : undefined,
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
          // Handle query parameter - convert to filter
          let filter = args.filter;
          if (args.query) {
            // Alert API doesn't support OR (||) operator, so handle differently
            if (args.query.includes(':') || args.query.includes('~')) {
              // User provided filter syntax - format it
              const queryFilter = autoFormatFilter(args.query);
              filter = filter ? `${queryFilter},${filter}` : queryFilter;
            } else {
              // Free text search - use only monitorObjectName (most relevant field for alerts)
              const queryFilter = autoFormatFilter(args.query, ['monitorObjectName']);
              filter = filter ? `${queryFilter},${filter}` : queryFilter;
            }
          }

          const result = await this.client.listAlerts({
            size: args.size,
            offset: args.offset,
            filter: filter,
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

        case 'generate_dashboard_link':
          return await this.client.generateDashboardLink(args.dashboardId);

        case 'generate_resource_link':
          return await this.client.generateResourceLink(args.deviceId);

        case 'generate_alert_link':
          return await this.client.generateAlertLink(args.alertId);

        case 'generate_website_link':
          return await this.client.generateWebsiteLink(args.websiteId);

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

        case 'create_dashboard_group': {
          const { config, ...rest } = args;
          return await this.client.createDashboardGroup({ ...rest, ...(config || {}) });
        }

        case 'update_dashboard_group': {
          const { groupId, config, ...rest } = args;
          return await this.client.updateDashboardGroup(groupId, { ...rest, ...(config || {}) });
        }

        case 'delete_dashboard_group':
          return await this.client.deleteDashboardGroup(args.groupId, {
            allowNonEmptyGroup: args.allowNonEmptyGroup,
          });

        case 'clone_dashboard_group':
          return await this.client.cloneDashboardGroup(args.groupId, args.config || {}, {
            recursive: args.recursive,
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

        case 'create_report': {
          const { config, ...rest } = args;
          const report = { ...rest, ...(config || {}) };
          return await this.client.createReport(report);
        }

        case 'update_report': {
          const { reportId, config, ...rest } = args;
          const report = { ...rest, ...(config || {}) };
          return await this.client.updateReport(reportId, report);
        }

        case 'delete_report':
          return await this.client.deleteReport(args.reportId);

        case 'generate_report':
          return await this.client.generateReport(args.reportId, {
            withAdminId: args.withAdminId,
            receiveEmails: args.receiveEmails,
          });

        case 'get_report_task_result':
          return await this.client.getReportTaskResult(args.reportId, args.taskId);

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

        case 'create_website_group': {
          const { config, ...rest } = args;
          return await this.client.createWebsiteGroup({ ...rest, ...(config || {}) });
        }

        case 'update_website_group': {
          const { groupId, opType, config, ...rest } = args;
          return await this.client.updateWebsiteGroup(
            groupId,
            { ...rest, ...(config || {}) },
            { opType },
          );
        }

        case 'delete_website_group':
          return await this.client.deleteWebsiteGroup(args.groupId, {
            deleteChildren: args.deleteChildren,
          });

        case 'list_website_group_websites':
          return await this.client.listWebsiteGroupWebsites(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'list_website_group_sdts':
          return await this.client.listWebsiteGroupSDTs(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_website_group_sdt_history':
          return await this.client.getWebsiteGroupSDTHistory(args.groupId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
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

        case 'create_role': {
          const { config, ...rest } = args;
          return await this.client.createRole({ ...rest, ...(config || {}) });
        }

        case 'update_role': {
          const { roleId, config, ...rest } = args;
          return await this.client.updateRole(roleId, { ...rest, ...(config || {}) });
        }

        case 'delete_role':
          return await this.client.deleteRole(args.roleId);

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

        case 'create_resource_sdt': {
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

        case 'create_sdt': {
          const { config, ...rest } = args;
          const sdt = { ...rest, ...(config || {}) };
          return await this.client.createSDT(sdt);
        }

        case 'update_sdt': {
          const { sdtId, config, ...rest } = args;
          const sdt = { ...rest, ...(config || {}) };
          return await this.client.updateSDT(sdtId, sdt);
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

        case 'create_configsource': {
          const { config, ...rest } = args;
          const configSource = { ...rest, ...(config || {}) };
          return await this.client.createConfigSource(configSource);
        }

        case 'update_configsource': {
          const { configSourceId, reason, config, ...rest } = args;
          const configSource = { ...rest, ...(config || {}) };
          return await this.client.updateConfigSource(configSourceId, configSource, { reason });
        }

        case 'delete_configsource':
          return await this.client.deleteConfigSource(args.configSourceId);

        case 'import_configsource':
          return await this.client.importConfigSource(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // Device Properties
        case 'list_resource_properties': {
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

        case 'update_resource_property':
          return await this.client.updateDeviceProperty(
            args.deviceId,
            args.propertyName,
            args.value,
          );

        case 'create_resource_property':
          return await this.client.createDeviceProperty(args.deviceId, args.name, args.value);

        case 'delete_resource_property':
          return await this.client.deleteDeviceProperty(args.deviceId, args.propertyName);

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

        // Device alert settings
        case 'list_resource_alert_settings':
          return await this.client.listDeviceAlertSettings(args.deviceId, {
            start: args.start,
            end: args.end,
            size: args.size,
            offset: args.offset,
          });

        case 'list_instance_alert_settings':
          return await this.client.listDeviceInstanceAlertSettings(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            { size: args.size, offset: args.offset },
          );

        case 'get_instance_alert_setting':
          return await this.client.getDeviceInstanceAlertSetting(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            args.alertSettingId,
            { fields: args.fields },
          );

        case 'update_instance_alert_setting':
          return await this.client.updateDeviceInstanceAlertSetting(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            args.alertSettingId,
            args.config || {},
          );

        // Device ConfigSource collected configs
        case 'list_resource_instance_configs':
          return await this.client.listDeviceInstanceConfigs(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );

        case 'get_resource_instance_config':
          return await this.client.getDeviceInstanceConfig(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            args.configId,
            { format: args.format, startEpoch: args.startEpoch, fields: args.fields },
          );

        case 'collect_resource_instance_config':
          return await this.client.collectDeviceInstanceConfig(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
          );

        // NetFlow
        case 'list_resource_netflow_flows':
          return await this.client.listNetflowFlows(args.deviceId, {
            start: args.start,
            end: args.end,
            netflowFilter: args.netflowFilter,
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'list_resource_netflow_ports':
          return await this.client.listNetflowPorts(args.deviceId, {
            ip: args.ip,
            start: args.start,
            end: args.end,
            netflowFilter: args.netflowFilter,
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'list_resource_netflow_endpoints':
          return await this.client.listNetflowEndpoints(args.deviceId, {
            port: args.port,
            start: args.start,
            end: args.end,
            netflowFilter: args.netflowFilter,
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_resource_top_talkers_graph':
          return await this.client.getDeviceTopTalkersGraph(args.deviceId, {
            start: args.start,
            end: args.end,
            netflowFilter: args.netflowFilter,
            format: args.format,
            keyword: args.keyword,
          });

        // SDT history
        case 'get_resource_sdt_history':
          return await this.client.getDeviceSDTHistory(args.deviceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_resource_datasource_sdt_history':
          return await this.client.getDeviceDataSourceSDTHistory(
            args.deviceId,
            args.deviceDataSourceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );

        case 'get_instance_sdt_history':
          return await this.client.getDeviceInstanceSDTHistory(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );

        // Device alerts / eventsources / discovery / delta
        case 'list_resource_alerts':
          return await this.client.listDeviceAlerts(args.deviceId, {
            start: args.start,
            end: args.end,
            needMessage: args.needMessage,
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'list_resource_eventsources':
          return await this.client.listDeviceEventSources(args.deviceId);

        case 'schedule_resource_auto_discovery':
          return await this.client.scheduleDeviceAutoDiscovery(args.deviceId);

        case 'get_resources_delta_id':
          return await this.client.getDevicesDeltaId({ deltaId: args.deltaId });

        case 'get_resources_delta':
          return await this.client.getDevicesDelta(args.deltaId);

        // Audit Logs
        case 'list_audit_logs': {
          // Handle query parameter - convert to filter
          let filter = args.filter;
          if (args.query) {
            const queryFilter = autoFormatFilter(args.query, SEARCH_FIELDS.auditLogs);
            // Combine with existing filter using AND logic
            filter = filter ? `${queryFilter},${filter}` : queryFilter;
          }

          const result = await this.client.listAuditLogs({
            size: args.size,
            offset: args.offset,
            filter: filter,
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

        case 'create_eventsource': {
          const { config, ...rest } = args;
          const eventSource = { ...rest, ...(config || {}) };
          return await this.client.createEventSource(eventSource);
        }

        case 'update_eventsource': {
          const { eventSourceId, config, ...rest } = args;
          const eventSource = { ...rest, ...(config || {}) };
          return await this.client.updateEventSource(eventSourceId, eventSource);
        }

        case 'delete_eventsource':
          return await this.client.deleteEventSource(args.eventSourceId);

        case 'import_eventsource':
          return await this.client.importEventSource(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
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

        // Action Chains
        case 'list_action_chains':
          return await this.client.listActionChains({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_action_chain':
          return await this.client.getActionChain(args.actionChainId, { fields: args.fields });

        case 'create_action_chain': {
          const { config, ...rest } = args;
          return await this.client.createActionChain({ ...rest, ...(config || {}) });
        }

        case 'update_action_chain': {
          const { actionChainId, config, ...rest } = args;
          return await this.client.updateActionChain(actionChainId, { ...rest, ...(config || {}) });
        }

        case 'delete_action_chain':
          return await this.client.deleteActionChain(args.actionChainId);

        // Action Rules
        case 'list_action_rules':
          return await this.client.listActionRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_action_rule':
          return await this.client.getActionRule(args.actionRuleId, { fields: args.fields });

        case 'create_action_rule': {
          const { config, ...rest } = args;
          return await this.client.createActionRule({ ...rest, ...(config || {}) });
        }

        case 'update_action_rule': {
          const { actionRuleId, config, ...rest } = args;
          return await this.client.updateActionRule(actionRuleId, { ...rest, ...(config || {}) });
        }

        case 'delete_action_rule':
          return await this.client.deleteActionRule(args.actionRuleId);

        case 'set_action_rule_status':
          return await this.client.setActionRuleStatus(args.actionRuleId, args.enabled);

        // Property Rules (PropertySources)
        case 'list_property_rules':
          return await this.client.listPropertyRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            format: args.format,
            autoPaginate: args.autoPaginate,
          });

        case 'get_property_rule':
          return await this.client.getPropertyRule(args.propertyRuleId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_property_rule':
          return await this.client.createPropertyRule(args.config || {});

        case 'update_property_rule':
          return await this.client.updatePropertyRule(args.propertyRuleId, args.config || {}, {
            reason: args.reason,
          });

        case 'delete_property_rule':
          return await this.client.deletePropertyRule(args.propertyRuleId);

        case 'import_property_rule':
          return await this.client.importPropertyRule(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

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

        // Job Monitors (BatchJobs)
        case 'list_job_monitors':
          return await this.client.listJobMonitors({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            format: args.format,
            autoPaginate: args.autoPaginate,
          });

        case 'get_job_monitor':
          return await this.client.getJobMonitor(args.jobMonitorId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_job_monitor': {
          const { config, ...rest } = args;
          return await this.client.createJobMonitor({ ...rest, ...(config || {}) });
        }

        case 'update_job_monitor': {
          const { jobMonitorId, reason, config, ...rest } = args;
          return await this.client.updateJobMonitor(jobMonitorId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_job_monitor':
          return await this.client.deleteJobMonitor(args.jobMonitorId);

        case 'import_job_monitor':
          return await this.client.importJobMonitor(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // DiagnosticSources
        case 'list_diagnosticsources':
          return await this.client.listDiagnosticSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_diagnosticsource':
          return await this.client.getDiagnosticSource(args.diagnosticSourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_diagnosticsource': {
          const { config, ...rest } = args;
          return await this.client.createDiagnosticSource({ ...rest, ...(config || {}) });
        }

        case 'update_diagnosticsource': {
          const { diagnosticSourceId, reason, config, ...rest } = args;
          return await this.client.updateDiagnosticSource(diagnosticSourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_diagnosticsource':
          return await this.client.deleteDiagnosticSource(args.diagnosticSourceId);

        case 'import_diagnosticsource':
          return await this.client.importDiagnosticSource(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        case 'execute_diagnosticsource':
          return await this.client.executeDiagnosticSource(args.config || {});

        // AppliesTo Functions
        case 'list_applies_to_functions':
          return await this.client.listAppliesToFunctions({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_applies_to_function':
          return await this.client.getAppliesToFunction(args.functionId, {
            fields: args.fields,
          });

        case 'create_applies_to_function': {
          const { config, ...rest } = args;
          return await this.client.createAppliesToFunction({ ...rest, ...(config || {}) });
        }

        case 'update_applies_to_function': {
          const { functionId, reason, ignoreReference, config, ...rest } = args;
          return await this.client.updateAppliesToFunction(
            functionId,
            { ...rest, ...(config || {}) },
            { reason, ignoreReference },
          );
        }

        case 'delete_applies_to_function':
          return await this.client.deleteAppliesToFunction(args.functionId, {
            ignoreReference: args.ignoreReference,
          });

        case 'import_applies_to_function':
          return await this.client.importAppliesToFunction(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // SNMP OIDs
        case 'list_oids':
          return await this.client.listOIDs({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_oid':
          return await this.client.getOID(args.oidId, {
            fields: args.fields,
          });

        case 'create_oid': {
          const { config, ...rest } = args;
          return await this.client.createOID({ ...rest, ...(config || {}) });
        }

        case 'update_oid': {
          const { oidId, config, ...rest } = args;
          return await this.client.updateOID(oidId, { ...rest, ...(config || {}) });
        }

        case 'delete_oid':
          return await this.client.deleteOID(args.oidId);

        case 'import_oid':
          return await this.client.importOID(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // RemediationSources
        case 'list_remediationsources':
          return await this.client.listRemediationSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_remediationsource':
          return await this.client.getRemediationSource(args.remediationSourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_remediationsource': {
          const { config, ...rest } = args;
          return await this.client.createRemediationSource({ ...rest, ...(config || {}) });
        }

        case 'update_remediationsource': {
          const { remediationSourceId, reason, config, ...rest } = args;
          return await this.client.updateRemediationSource(remediationSourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_remediationsource':
          return await this.client.deleteRemediationSource(args.remediationSourceId);

        case 'execute_remediation':
          return await this.client.executeRemediation(args.config || {});

        // TopologySources
        case 'list_topologysources':
          return await this.client.listTopologySources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_topologysource':
          return await this.client.getTopologySource(args.topologySourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_topologysource': {
          const { config, ...rest } = args;
          return await this.client.createTopologySource({ ...rest, ...(config || {}) });
        }

        case 'update_topologysource': {
          const { topologySourceId, reason, config, ...rest } = args;
          return await this.client.updateTopologySource(topologySourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_topologysource':
          return await this.client.deleteTopologySource(args.topologySourceId);

        case 'import_topologysource':
          return await this.client.importTopologySource(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // Users & API Tokens (write)
        case 'create_user': {
          const { config, ...rest } = args;
          return await this.client.createUser({ ...rest, ...(config || {}) });
        }

        case 'update_user': {
          const { userId, changePassword, validationOnly, config, ...rest } = args;
          return await this.client.updateUser(userId, { ...rest, ...(config || {}) }, { changePassword, validationOnly });
        }

        case 'delete_user':
          return await this.client.deleteUser(args.userId);

        case 'create_api_token': {
          const { userId, type, config, ...rest } = args;
          return await this.client.createApiToken(userId, { ...rest, ...(config || {}) }, { type });
        }

        case 'update_api_token': {
          const { userId, apiTokenId, config, ...rest } = args;
          return await this.client.updateApiToken(userId, apiTokenId, { ...rest, ...(config || {}) });
        }

        case 'delete_api_token':
          return await this.client.deleteApiToken(args.userId, args.apiTokenId);

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

        // Cloud Onboarding - AWS
        case 'get_aws_account_id':
          return await this.client.getAwsAccountId();

        case 'get_aws_external_id':
          return await this.client.getAwsExternalId();

        case 'test_aws_account':
          return await this.client.testAwsAccount(args.config || {});

        case 'verify_aws_billing_permissions':
          return await this.client.verifyAwsBillingPermissions(args.config || {});

        // Cloud Onboarding - Azure
        case 'discover_azure_subscriptions':
          return await this.client.discoverAzureSubscriptions(args.config || {});

        case 'test_azure_account':
          return await this.client.testAzureAccount(args.config || {});

        case 'verify_azure_storage_permissions':
          return await this.client.verifyAzureStoragePermissions(args.config || {});

        // Cloud Onboarding - GCP
        case 'test_gcp_account':
          return await this.client.testGcpAccount(args.config || {});

        // ConfigSource update reasons
        case 'get_configsource_update_reasons':
          return await this.client.getConfigSourceUpdateReasons(args.configSourceId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
          });

        // Website extras
        case 'get_website_sdt_history':
          return await this.client.getWebsiteSDTHistory(args.websiteId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_website_graph_by_name':
          return await this.client.getWebsiteGraphByName(args.websiteId, args.graphName, {
            start: args.start, end: args.end, format: args.format,
          });

        // Diagnostic Remediation
        case 'get_diagnostic_remediation_sources':
          return await this.client.getDiagnosticRemediationSources({
            resourceId: args.resourceId, alertId: args.alertId, moduleType: args.moduleType,
          });

        case 'get_diagnostic_remediation_results':
          return await this.client.getDiagnosticRemediationResults({
            resourceId: args.resourceId, alertId: args.alertId, taskId: args.taskId,
          });

        // Metrics
        case 'get_metrics_summary':
          return await this.client.getMetricsSummary({ fields: args.fields });

        case 'get_metrics_usage':
          return await this.client.getMetricsUsage({ fields: args.fields });

        // Default Dashboard
        case 'update_default_dashboard': {
          const { userDataId, config, ...rest } = args;
          return await this.client.updateDefaultDashboard(userDataId, { ...rest, ...(config || {}) });
        }

        // Alert escalation
        case 'escalate_alert':
          return await this.client.escalateAlert(args.alertId);

        // Access group module mapping
        case 'map_unmap_module_to_access_group':
          return await this.client.mapUnmapModuleToAccessGroup(args.config || {});

        // Integration audit logs
        case 'get_integration_audit_logs':
          return await this.client.getIntegrationAuditLogs({ format: args.format });

        // API usage stats
        case 'get_external_api_stats':
          return await this.client.getExternalApiStats({ fields: args.fields });

        // LogicModule metadata
        case 'get_logicmodule_metadata':
          return await this.client.getLogicModuleMetadata({ fields: args.fields });

        // Unmonitored devices
        case 'list_unmonitored_devices':
          return await this.client.listUnmonitoredDevices({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        // Contract / usage info
        case 'get_contract_info':
          return await this.client.getContractInfo({ fields: args.fields });

        // DNS mappings
        case 'add_dns_mapping':
          return await this.client.addDNSMapping(args.config || {});

        // SaaS account
        case 'test_saas_account':
          return await this.client.testSaaSAccount(args.config || {});

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
        case 'list_resource_group_alerts':
          return await this.client.listDeviceGroupAlerts(args.groupId, {
            needMessage: args.needMessage, customColumns: args.customColumns,
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'list_resource_group_sdts':
          return await this.client.listDeviceGroupSDTs(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

        case 'get_resource_group_sdt_history':
          return await this.client.getDeviceGroupSDTHistory(args.groupId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });

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

        case 'get_website_checkpoint_data':
          return await this.client.getWebsiteCheckpointData(args.websiteId, args.checkpointId, {
            period: args.period,
            start: args.start,
            end: args.end,
            datapoints: args.datapoints,
            aggregate: args.aggregate,
            format: args.format,
          });

        case 'get_website_graph_data':
          return await this.client.getWebsiteGraphData(args.websiteId, args.checkpointId, args.graphName, {
            start: args.start,
            end: args.end,
            format: args.format,
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

        // Cost Optimization Recommendations
        case 'list_cost_optimization_recommendations':
          return await this.client.listCostOptimizationRecommendations({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_cost_optimization_recommendation':
          return await this.client.getCostOptimizationRecommendation(args.id, {
            fields: args.fields,
          });

        case 'list_cost_optimization_recommendation_categories':
          return await this.client.listCostOptimizationRecommendationCategories({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        // Dashboard Widgets
        case 'list_widgets':
          return await this.client.listWidgets({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'list_dashboard_widgets':
          return await this.client.listDashboardWidgets(args.dashboardId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_widget':
          return await this.client.getWidget(args.widgetId, {
            fields: args.fields,
          });

        case 'get_widget_data':
          return await this.client.getWidgetData(args.widgetId, {
            start: args.start,
            end: args.end,
            format: args.format,
          });

        case 'create_widget': {
          const { config, ...rest } = args;
          const widget = { ...rest, ...(config || {}) };
          return await this.client.createWidget(widget);
        }

        case 'update_widget': {
          const { widgetId, config, ...rest } = args;
          const widget = { ...rest, ...(config || {}) };
          return await this.client.updateWidget(widgetId, widget);
        }

        case 'delete_widget':
          return await this.client.deleteWidget(args.widgetId);

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
          'Use list_resources or search_resources to find the correct ID',
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

  /**
   * Handles completion requests for prompt arguments
   *
   * @param ref Reference to the prompt or resource
   * @param argument The argument being completed
   * @returns Completion suggestions
   */
  async handleCompletion(
    ref: { type: string; name?: string; uri?: string },
    argument: { name: string; value: string },
  ): Promise<{ values: string[]; total?: number; hasMore?: boolean }> {
    // Only support prompt completions for now
    if (ref.type === 'ref/prompt' && ref.name === 'resource_check') {
      // Only support resourceName argument
      if (argument.name === 'resourceName') {
        const searchValue = argument.value || '';

        // Build OR filter to search across name, displayName, and IP
        // Using OR (||) to find resources matching any of these fields
        let filter = '';
        if (searchValue) {
          const filters = [
            `name~"${searchValue}"`,
            `displayName~"${searchValue}"`,
            `name:"${searchValue}"`, // Exact IP match
          ];
          filter = filters.join('||');
        }

        try {
          // Search for resources with a limit of 100 (max per MCP spec)
          const result = await this.client.listResources({
            size: 100,
            offset: 0,
            filter,
            fields: 'displayName,name', // Only need displayName and name
          });

          const items = result.items || [];
          const total = result.total || items.length;

          // Extract displayNames for completion suggestions
          const values = items
            .map((item: any) => item.displayName || item.name)
            .filter((name: string) => name); // Remove any null/undefined

          return {
            values,
            total,
            hasMore: total > values.length,
          };
        } catch (error) {
          // On error, return empty suggestions
          console.error('[LogicMonitor MCP] Completion error:', error);
          return {
            values: [],
            total: 0,
            hasMore: false,
          };
        }
      }
    }

    // Unsupported completion - return empty
    return {
      values: [],
      total: 0,
      hasMore: false,
    };
  }
}
