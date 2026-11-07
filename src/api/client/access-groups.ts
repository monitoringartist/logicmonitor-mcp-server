import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class AccessGroupsClient extends BaseClient {
  // Access Groups
  async listAccessGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/accessgroup', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/accessgroup', undefined, cleanedParams);
  }

  async getAccessGroup(accessGroupId: number, params?: {
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params || {});
    return this.request<LMResponse<any>>('GET', `/setting/accessgroup/${accessGroupId}`, undefined, cleanedParams);
  }

  async createAccessGroup(data: {
    name: string;
    description: string;
    tenantId?: number;
  }) {
    return this.request<LMResponse<any>>('POST', '/setting/accessgroup', data);
  }

  async updateAccessGroup(accessGroupId: number, data: {
    name?: string;
    description?: string;
    tenantId?: number;
  }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/accessgroup/${accessGroupId}`, data);
  }

  async deleteAccessGroup(accessGroupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/accessgroup/${accessGroupId}`);
  }

  // Access group module mapping
  async mapUnmapModuleToAccessGroup(body: any) {
    return this.request<LMResponse<any>>('POST', '/setting/accessgroup/mapunmap/modules', body);
  }
}
