import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class NetscansClient extends BaseClient {
  // Netscans
  async listNetscans(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/netscans', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/netscans', undefined, cleanedParams);
  }

  async getNetscan(netscanId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/netscans/${netscanId}`, undefined, params);
  }

  async createNetscan(netscan: any) {
    return this.request<LMResponse<any>>('POST', '/setting/netscans', netscan);
  }

  async updateNetscan(netscanId: number, netscan: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/netscans/${netscanId}`, netscan);
  }

  async deleteNetscan(netscanId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/netscans/${netscanId}`);
  }
}
