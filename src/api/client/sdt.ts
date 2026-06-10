import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class SdtClient extends BaseClient {
  // SDT history
  async getDeviceSDTHistory(
    deviceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceDataSourceSDTHistory(
    deviceId: number,
    deviceDataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceSDTHistory(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // SDT (Scheduled Down Time)
  async listSDTs(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/sdt/sdts', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/sdt/sdts', undefined, cleanedParams);
  }

  async getSDT(sdtId: string, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/sdt/sdts/${sdtId}`, undefined, params);
  }

  async createDeviceSDT(sdt: any) {
    return this.request<LMResponse<any>>('POST', '/sdt/sdts', sdt);
  }

  async createSDT(sdt: any) {
    return this.request<LMResponse<any>>('POST', '/sdt/sdts', sdt);
  }

  async updateSDT(sdtId: string, sdt: any) {
    return this.request<LMResponse<any>>('PATCH', `/sdt/sdts/${sdtId}`, sdt);
  }

  async deleteSDT(sdtId: string) {
    return this.request<LMResponse<any>>('DELETE', `/sdt/sdts/${sdtId}`);
  }
}
