import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class InstancesClient extends BaseClient {
  // Device DataSource Instances
  async listDeviceDataSourceInstances(
    deviceId: number,
    deviceDataSourceId: number,
    params?: {
      size?: number;
      offset?: number;
      filter?: string;
      fields?: string;
      autoPaginate?: boolean;
    },
  ) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(
        `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
        cleanedParams,
      );
    }
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
      undefined,
      cleanedParams,
    );
  }

  async getDeviceDataSourceInstanceData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: {
      datapoints?: string;
      start?: number;
      end?: number;
      format?: string;
    },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/data`,
      undefined,
      params,
    );
  }

  // Device DataSource Instances - write operations
  async createDeviceDataSourceInstance(deviceId: number, deviceDataSourceId: number, instance: any) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
      instance,
    );
  }

  async updateDeviceDataSourceInstance(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    instance: any,
    params?: { opType?: string },
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}`,
      instance,
      this.cleanParams(params || {}),
    );
  }

  async deleteDeviceDataSourceInstance(deviceId: number, deviceDataSourceId: number, instanceId: number) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}`,
    );
  }

  async getDeviceDataSourceInstanceGraphData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    graphId: number,
    params?: { start?: number; end?: number; format?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/graphs/${graphId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceDataSourceData(
    deviceId: number,
    deviceDataSourceId: number,
    params?: {
      period?: number;
      start?: number;
      end?: number;
      datapoints?: string;
      format?: string;
      aggregate?: string;
    },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSource Instance Groups
  async listDeviceDataSourceInstanceGroups(
    deviceId: number,
    deviceDataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean },
  ) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getDeviceDataSourceInstanceGroup(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    params?: { fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async createDeviceDataSourceInstanceGroup(deviceId: number, deviceDataSourceId: number, group: any) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups`,
      group,
    );
  }

  async updateDeviceDataSourceInstanceGroup(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    group: any,
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}`,
      group,
    );
  }

  async updateInstanceGroupAlertThreshold(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    datapointId: number,
    config: any,
  ) {
    return this.request<LMResponse<any>>(
      'PUT',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}/datapoints/${datapointId}/alertconfig`,
      config,
    );
  }

  async getDeviceDataSourceInstanceGroupOverviewGraphData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    overviewGraphId: number,
    params?: { start?: number; end?: number; format?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}/graphs/${overviewGraphId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSource Instance Alert Settings
  async listDeviceAlertSettings(
    deviceId: number,
    params?: { start?: number; end?: number; size?: number; offset?: number },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/alertsettings`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDeviceInstanceAlertSettings(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceAlertSetting(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    alertSettingId: number,
    params?: { fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings/${alertSettingId}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async updateDeviceInstanceAlertSetting(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    alertSettingId: number,
    setting: any,
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings/${alertSettingId}`,
      setting,
    );
  }

  // Bulk instance data fetch & instance graph by id
  async fetchDeviceInstancesData(body: any, params?: {
    period?: number;
    start?: number;
    end?: number;
    aggregate?: string;
  }) {
    return this.request<LMResponse<any>>('POST', '/device/instances/datafetch', body, this.cleanParams(params || {}));
  }

  async getInstanceGraphDataById(instanceId: number, graphId: number, params?: {
    start?: number;
    end?: number;
    format?: string;
  }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devicedatasourceinstances/${instanceId}/graphs/${graphId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Metrics (Push/Usage)
  async getMetricsSummary(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/metrics/summary', undefined, this.cleanParams(params || {}));
  }

  async getMetricsUsage(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/metrics/usage', undefined, this.cleanParams(params || {}));
  }
}
