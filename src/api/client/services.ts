import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

/**
 * LogicMonitor business services are not exposed under a dedicated `/service/*`
 * API. They live in the device tree as devices with `deviceType=6` (biz_service)
 * and are organized via device groups (`/device/groups`). Querying the
 * non-existent `/service/services` path makes the LM gateway respond with
 * HTTP 415, so every method here targets the device endpoints instead.
 *
 * deviceType reference (from the LM Swagger v3 Device model):
 *   0 regular, 1 APPGROUP, 2 AWS, 3 service, 4 Azure, 6 biz_service, 7 GCP, 8 K8S
 */
const BIZ_SERVICE_DEVICE_TYPE = 6;

/**
 * `groupType` value that identifies a business-service group in the device tree.
 * Service groups are device groups, so the list is constrained to this type to
 * exclude regular device/dynamic groups.
 */
const BIZ_SERVICE_GROUP_TYPE = 'BizService';

/** Prepend the biz_service `deviceType` constraint to any caller-supplied filter. */
function withServiceTypeFilter(filter?: string): string {
  const typeCondition = `deviceType:${BIZ_SERVICE_DEVICE_TYPE}`;
  return filter && filter.trim() ? `${typeCondition},${filter}` : typeCondition;
}

/** Prepend the biz_service `groupType` constraint to any caller-supplied filter. */
function withServiceGroupTypeFilter(filter?: string): string {
  const typeCondition = `groupType:${BIZ_SERVICE_GROUP_TYPE}`;
  return filter && filter.trim() ? `${typeCondition},${filter}` : typeCondition;
}

export class ServicesClient extends BaseClient {
  // Services (biz_service devices)
  async listServices(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, filter, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams({
      ...otherParams,
      filter: withServiceTypeFilter(filter),
    });

    if (autoPaginate) {
      return this.paginateAll<any>('/device/devices', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/devices', undefined, cleanedParams);
  }

  async getService(serviceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/devices/${serviceId}`, undefined, params);
  }

  async createService(service: any) {
    return this.request<LMResponse<any>>('POST', '/device/devices', {
      ...service,
      deviceType: BIZ_SERVICE_DEVICE_TYPE,
    });
  }

  async updateService(serviceId: number, service: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${serviceId}`, service);
  }

  async deleteService(serviceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/device/devices/${serviceId}`);
  }

  // Service Groups (device groups)
  async listServiceGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, filter, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams({
      ...otherParams,
      filter: withServiceGroupTypeFilter(filter),
    });

    if (autoPaginate) {
      return this.paginateAll<any>('/device/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/groups', undefined, cleanedParams);
  }

  async getServiceGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/groups/${groupId}`, undefined, params);
  }

  async createServiceGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/device/groups', group);
  }

  async updateServiceGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}`, group);
  }

  async deleteServiceGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/device/groups/${groupId}`);
  }
}
