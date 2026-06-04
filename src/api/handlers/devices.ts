import { filterFields, DEFAULT_DEVICE_FIELDS, DEFAULT_DEVICE_PROPERTY_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';
import { batchProcessor } from '../../utils/helpers/batch-processor.js';
import { autoFormatFilter, SEARCH_FIELDS } from '../../utils/helpers/filters.js';

export const devicesToolHandlers: ToolHandlerMap = {
  'list_resources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    // Handle query parameter - convert to filter
    let filter = args.filter;
    if (args.query) {
      const queryFilter = autoFormatFilter(args.query, SEARCH_FIELDS.devices);
      // Combine with existing filter using AND logic
      filter = filter ? `${queryFilter},${filter}` : queryFilter;
    }

    const result = await client.listResources({
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
  },

  'get_resource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDevice(args.deviceId, {
      fields: args.fields,
    });
  },

  'create_resource': async ({ client, args, progressCallback }: ToolHandlerContext): Promise<any> => {
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

          const created = await client.createDevice(deviceData);
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
    return await client.createDevice(device);
  },

  'update_resource': async ({ client, args, progressCallback }: ToolHandlerContext): Promise<any> => {
    // Check if this is a batch operation
    if (args.devices && Array.isArray(args.devices)) {
      // Batch mode
      const batchOptions = args.batchOptions || {};
      const result = await batchProcessor.processBatch(
        args.devices,
        async (device: any) => {
          const { deviceId, opType, ...deviceData } = device;
          const updated = await client.updateDevice(deviceId, deviceData, {
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
    return await client.updateDevice(deviceId, deviceData, {
      opType: opType || 'replace',
    });
  },

  'delete_resource': async ({ client, args, progressCallback }: ToolHandlerContext): Promise<any> => {
    // Check if this is a batch operation
    if (args.deviceIds && Array.isArray(args.deviceIds)) {
      // Batch mode
      const batchOptions = args.batchOptions || {};
      const result = await batchProcessor.processBatch(
        args.deviceIds,
        async (deviceId: number) => {
          await client.deleteDevice(deviceId, {
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
    return await client.deleteDevice(args.deviceId, {
      deleteFromSystem: args.deleteFromSystem,
    });
  },

  'list_resource_properties': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listDeviceProperties(args.deviceId, {
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
  },

  'update_resource_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDeviceProperty(
      args.deviceId,
      args.propertyName,
      args.value,
    );
  },

  'create_resource_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createDeviceProperty(args.deviceId, args.name, args.value);
  },

  'delete_resource_property': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDeviceProperty(args.deviceId, args.propertyName);
  },

  'list_resource_alert_settings': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceAlertSettings(args.deviceId, {
      start: args.start,
      end: args.end,
      size: args.size,
      offset: args.offset,
    });
  },

  'list_instance_alert_settings': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceInstanceAlertSettings(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      { size: args.size, offset: args.offset },
    );
  },

  'get_instance_alert_setting': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceInstanceAlertSetting(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      args.alertSettingId,
      { fields: args.fields },
    );
  },

  'update_instance_alert_setting': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updateDeviceInstanceAlertSetting(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      args.alertSettingId,
      args.config || {},
    );
  },

  'list_resource_instance_configs': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceInstanceConfigs(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
    );
  },

  'get_resource_instance_config': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceInstanceConfig(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      args.configId,
      { format: args.format, startEpoch: args.startEpoch, fields: args.fields },
    );
  },

  'collect_resource_instance_config': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.collectDeviceInstanceConfig(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
    );
  },

  'list_resource_netflow_flows': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listNetflowFlows(args.deviceId, {
      start: args.start,
      end: args.end,
      netflowFilter: args.netflowFilter,
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'list_resource_netflow_ports': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listNetflowPorts(args.deviceId, {
      ip: args.ip,
      start: args.start,
      end: args.end,
      netflowFilter: args.netflowFilter,
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'list_resource_netflow_endpoints': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listNetflowEndpoints(args.deviceId, {
      port: args.port,
      start: args.start,
      end: args.end,
      netflowFilter: args.netflowFilter,
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'get_resource_top_talkers_graph': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceTopTalkersGraph(args.deviceId, {
      start: args.start,
      end: args.end,
      netflowFilter: args.netflowFilter,
      format: args.format,
      keyword: args.keyword,
    });
  },

  'list_resource_alerts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    let filter = args.filter;
    if (args.cleared !== undefined) {
      const clearedFilter = `cleared:${args.cleared}`;
      filter = filter ? `${filter},${clearedFilter}` : clearedFilter;
    }
    return await client.listDeviceAlerts(args.deviceId, {
      start: args.start,
      end: args.end,
      needMessage: args.needMessage,
      size: args.size,
      offset: args.offset,
      filter: filter,
      fields: args.fields,
    });
  },

  'list_resource_eventsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDeviceEventSources(args.deviceId);
  },

  'schedule_resource_auto_discovery': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.scheduleDeviceAutoDiscovery(args.deviceId);
  },

  'get_resources_delta_id': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDevicesDeltaId({ deltaId: args.deltaId });
  },

  'get_resources_delta': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDevicesDelta(args.deltaId);
  },

  'list_unmonitored_devices': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listUnmonitoredDevices({
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },
};
