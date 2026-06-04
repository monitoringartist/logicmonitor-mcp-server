import { BaseClient, LMResponse, LMListResponse, escapeFilterValue } from './base-client.js';

export class DevicesClient extends BaseClient {
  // Device Management
  /**
   * List resources with optional filtering
   *
   * Filter examples:
   * - Exact match: filter: 'id:123'
   * - Contains with wildcards: filter: 'displayName~"*server*"' (quotes required for wildcards)
   * - Multiple conditions (AND): filter: 'displayName~"*prod*",hostStatus:normal' (use comma, NOT &&)
   * - Multiple conditions (OR): filter: 'displayName~"*prod*" || displayName~"*dev*"'
   * - With special characters: Use escapeFilterValue() for user input
   *
   * IMPORTANT: Use comma (,) for AND operations, NOT &&
   *
   * Note: Filter parameter is automatically URL-encoded. For special characters in filter values,
   * use escapeFilterValue() to escape them before building the filter string.
   */
  async listResources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/device/devices', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/devices', undefined, cleanedParams);
  }

  async getDevice(deviceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/devices/${deviceId}`, undefined, params);
  }

  async createDevice(device: any) {
    return this.request<LMResponse<any>>('POST', '/device/devices', device);
  }

  async updateDevice(deviceId: number, device: any, params?: { opType?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}`, device, params);
  }

  async deleteDevice(deviceId: number, params?: { deleteFromSystem?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/device/devices/${deviceId}`, undefined, params);
  }

  // Device ConfigSource collected configs
  async listDeviceInstanceConfigs(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceConfig(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    configId: string,
    params?: { format?: string; startEpoch?: number; fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config/${encodeURIComponent(configId)}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async collectDeviceInstanceConfig(deviceId: number, deviceDataSourceId: number, instanceId: number) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config/configCollection`,
    );
  }

  // Netflow
  async listNetflowFlows(
    deviceId: number,
    params?: { start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/flows`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listNetflowPorts(
    deviceId: number,
    params?: { ip?: string; start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/ports`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listNetflowEndpoints(
    deviceId: number,
    params?: { port?: string; start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/endpoints`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceTopTalkersGraph(
    deviceId: number,
    params?: { start?: number; end?: number; netflowFilter?: string; format?: string; keyword?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/topTalkersGraph`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device properties (write)
  async createDeviceProperty(deviceId: number, name: string, value: string) {
    return this.request<LMResponse<any>>('POST', `/device/devices/${deviceId}/properties`, { name, value });
  }

  async deleteDeviceProperty(deviceId: number, propertyName: string) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/device/devices/${deviceId}/properties/${encodeURIComponent(propertyName)}`,
    );
  }

  // Device alerts / eventsources / discovery / delta
  async listDeviceAlerts(
    deviceId: number,
    params?: {
      start?: number;
      end?: number;
      needMessage?: boolean;
      size?: number;
      offset?: number;
      filter?: string;
      fields?: string;
    },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/alerts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDeviceEventSources(deviceId: number) {
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/deviceeventsources`);
  }

  async scheduleDeviceAutoDiscovery(deviceId: number) {
    return this.request<LMResponse<any>>('POST', `/device/devices/${deviceId}/scheduleAutoDiscovery`);
  }

  async getDevicesDeltaId(params?: { deltaId?: string }) {
    return this.request<LMResponse<any>>('GET', '/device/devices/delta', undefined, this.cleanParams(params || {}));
  }

  async getDevicesDelta(deltaId: string) {
    return this.request<LMResponse<any>>('GET', `/device/devices/delta/${encodeURIComponent(deltaId)}`);
  }

  // Device Properties
  async listDeviceProperties(deviceId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/devices/${deviceId}/properties`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/properties`, undefined, cleanedParams);
  }

  async updateDeviceProperty(deviceId: number, propertyName: string, value: string) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}/properties/${propertyName}`, {
      value,
    });
  }

  // Unmonitored devices
  async listUnmonitoredDevices(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/device/unmonitoreddevices', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/device/unmonitoreddevices', undefined, cleanedParams);
  }
}
