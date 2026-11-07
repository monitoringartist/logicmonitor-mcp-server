import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class DeviceGroupsClient extends BaseClient {
  // Device Groups
  async listDeviceGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/device/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/groups', undefined, cleanedParams);
  }

  async getDeviceGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/groups/${groupId}`, undefined, params);
  }

  async createDeviceGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/device/groups', group);
  }

  async updateDeviceGroup(groupId: number, group: any, params?: { opType?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}`, group, params);
  }

  async deleteDeviceGroup(groupId: number, params?: { deleteChildren?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/device/groups/${groupId}`, undefined, params);
  }

  // Device Group Properties
  async listDeviceGroupProperties(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/groups/${groupId}/properties`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/groups/${groupId}/properties`, undefined, cleanedParams);
  }

  async updateDeviceGroupProperty(groupId: number, propertyName: string, value: string) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}/properties/${propertyName}`, {
      value,
    });
  }

  async createDeviceGroupProperty(groupId: number, name: string, value: string) {
    return this.request<LMResponse<any>>('POST', `/device/groups/${groupId}/properties`, { name, value });
  }

  async deleteDeviceGroupProperty(groupId: number, propertyName: string) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/device/groups/${groupId}/properties/${encodeURIComponent(propertyName)}`,
    );
  }

  // Device Group - Cluster Alert Configurations
  async listDeviceGroupClusterAlertConfs(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/groups/${groupId}/clusterAlertConf`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getDeviceGroupClusterAlertConf(groupId: number, id: number) {
    return this.request<LMResponse<any>>('GET', `/device/groups/${groupId}/clusterAlertConf/${id}`);
  }

  async createDeviceGroupClusterAlertConf(groupId: number, conf: any) {
    return this.request<LMResponse<any>>('POST', `/device/groups/${groupId}/clusterAlertConf`, conf);
  }

  async updateDeviceGroupClusterAlertConf(groupId: number, id: number, conf: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}/clusterAlertConf/${id}`, conf);
  }

  async deleteDeviceGroupClusterAlertConf(groupId: number, id: number) {
    return this.request<LMResponse<any>>('DELETE', `/device/groups/${groupId}/clusterAlertConf/${id}`);
  }

  // Device Group - DataSources
  async listDeviceGroupDatasources(groupId: number, params?: {
    includeDisabledDataSourceWithoutInstance?: boolean;
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/groups/${groupId}/datasources`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getDeviceGroupDatasource(groupId: number, id: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/groups/${groupId}/datasources/${id}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async updateDeviceGroupDatasource(groupId: number, id: number, body: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}/datasources/${id}`, body);
  }

  // Device Group - DataSource Alert Settings
  async getDeviceGroupDatasourceAlertSetting(groupId: number, dsId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/groups/${groupId}/datasources/${dsId}/alertsettings`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async updateDeviceGroupDatasourceAlertSetting(groupId: number, dsId: number, body: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}/datasources/${dsId}/alertsettings`, body);
  }

  // Device Group - Alerts / SDTs
  async listDeviceGroupAlerts(groupId: number, params?: {
    needMessage?: boolean;
    customColumns?: string;
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/groups/${groupId}/alerts`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async listDeviceGroupSDTs(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/groups/${groupId}/sdts`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getDeviceGroupSDTHistory(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/groups/${groupId}/historysdts`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }
}
