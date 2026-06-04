import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class ServicesClient extends BaseClient {
  // Services
  async listServices(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/service/services', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/service/services', undefined, cleanedParams);
  }

  async getService(serviceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/service/services/${serviceId}`, undefined, params);
  }

  async createService(service: any) {
    return this.request<LMResponse<any>>('POST', '/service/services', service);
  }

  async updateService(serviceId: number, service: any) {
    return this.request<LMResponse<any>>('PATCH', `/service/services/${serviceId}`, service);
  }

  async deleteService(serviceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/service/services/${serviceId}`);
  }

  // Service Groups
  async listServiceGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/service/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/service/groups', undefined, cleanedParams);
  }

  async getServiceGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/service/groups/${groupId}`, undefined, params);
  }

  async createServiceGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/service/groups', group);
  }

  async updateServiceGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/service/groups/${groupId}`, group);
  }

  async deleteServiceGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/service/groups/${groupId}`);
  }
}
