import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_DEVICE_FIELDS, DEFAULT_DEVICE_PROPERTY_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';
import { batchProcessor } from '../../utils/helpers/batch-processor.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../../utils/helpers/filters.js';

export class DevicesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
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

        // Device alerts / eventsources / discovery / delta
        case 'list_resource_alerts': {
          let filter = args.filter;
          if (args.cleared !== undefined) {
            const clearedFilter = `cleared:${args.cleared}`;
            filter = filter ? `${filter},${clearedFilter}` : clearedFilter;
          }
          return await this.client.listDeviceAlerts(args.deviceId, {
            start: args.start,
            end: args.end,
            needMessage: args.needMessage,
            size: args.size,
            offset: args.offset,
            filter: filter,
            fields: args.fields,
          });
        }

        case 'list_resource_eventsources':
          return await this.client.listDeviceEventSources(args.deviceId);

        case 'schedule_resource_auto_discovery':
          return await this.client.scheduleDeviceAutoDiscovery(args.deviceId);

        case 'get_resources_delta_id':
          return await this.client.getDevicesDeltaId({ deltaId: args.deltaId });

        case 'get_resources_delta':
          return await this.client.getDevicesDelta(args.deltaId);

        // Unmonitored devices
        case 'list_unmonitored_devices':
          return await this.client.listUnmonitoredDevices({
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
