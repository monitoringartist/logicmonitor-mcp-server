import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class DatasourcesClient extends BaseClient {
  // DataSources
  async listDataSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/datasources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/datasources', undefined, cleanedParams);
  }

  async getDataSource(dataSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/datasources/${dataSourceId}`, undefined, params);
  }

  async createDataSource(dataSource: any, params?: { createGraph?: boolean }) {
    return this.request<LMResponse<any>>('POST', '/setting/datasources', dataSource, this.cleanParams(params || {}));
  }

  async updateDataSource(
    dataSourceId: number,
    dataSource: any,
    params?: { reason?: string; forceUniqueIdentifier?: boolean; forceRestrictedChangeKey?: string },
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/datasources/${dataSourceId}`,
      dataSource,
      this.cleanParams(params || {}),
    );
  }

  async deleteDataSource(dataSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/datasources/${dataSourceId}`);
  }

  async importDataSource(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/datasources/importjson' : '/setting/datasources/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'datasource.json' : 'datasource.xml',
      isJson ? 'application/json' : 'text/xml',
      queryParams,
    );
  }

  async listDataSourceOverviewGraphs(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/ographs`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDataSourceOverviewGraph(dataSourceId: number, overviewGraphId: number) {
    return this.request<LMResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/ographs/${overviewGraphId}`,
    );
  }

  async listDataSourceDevices(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/devices`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDataSourceUpdateReasons(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/updatereasons`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSources
  async listDeviceDataSources(deviceId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/devices/${deviceId}/devicedatasources`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/devicedatasources`, undefined, cleanedParams);
  }

  async getDeviceDataSource(deviceId: number, deviceDataSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}`, undefined, params);
  }

  async updateDeviceDataSource(deviceId: number, deviceDataSourceId: number, data: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}`, data);
  }
}
