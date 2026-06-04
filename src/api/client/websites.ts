import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class WebsitesClient extends BaseClient {
  // Websites (Synthetic Monitoring)
  async listWebsites(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/website/websites', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/website/websites', undefined, cleanedParams);
  }

  async getWebsite(websiteId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/website/websites/${websiteId}`, undefined, params);
  }

  async createWebsite(website: any) {
    return this.request<LMResponse<any>>('POST', '/website/websites', website);
  }

  async updateWebsite(websiteId: number, website: any) {
    return this.request<LMResponse<any>>('PATCH', `/website/websites/${websiteId}`, website);
  }

  async deleteWebsite(websiteId: number) {
    return this.request<LMResponse<any>>('DELETE', `/website/websites/${websiteId}`);
  }

  async getWebsiteCheckpointData(websiteId: number, checkpointId: number, params?: {
    period?: number;
    start?: number;
    end?: number;
    datapoints?: string;
    format?: string;
    aggregate?: string;
  }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/website/websites/${websiteId}/checkpoints/${checkpointId}/data`,
      undefined,
      params,
    );
  }

  async getWebsiteGraphData(websiteId: number, checkpointId: number, graphName: string, params?: {
    start?: number;
    end?: number;
    format?: string;
  }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/website/websites/${websiteId}/checkpoints/${checkpointId}/graphs/${encodeURIComponent(graphName)}/data`,
      undefined,
      params,
    );
  }

  // Website Groups
  async listWebsiteGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/website/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/website/groups', undefined, cleanedParams);
  }

  async getWebsiteGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/website/groups/${groupId}`, undefined, params);
  }

  async createWebsiteGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/website/groups', group);
  }

  async updateWebsiteGroup(groupId: number, group: any, params?: { opType?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/website/groups/${groupId}`,
      group,
      this.cleanParams(params || {}),
    );
  }

  async deleteWebsiteGroup(groupId: number, params?: { deleteChildren?: number }) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/website/groups/${groupId}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listWebsiteGroupWebsites(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/website/groups/${groupId}/websites`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async listWebsiteGroupSDTs(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/website/groups/${groupId}/sdts`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getWebsiteGroupSDTHistory(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/website/groups/${groupId}/historysdts`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  // Website extras
  async getWebsiteSDTHistory(websiteId: number, params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/website/websites/${websiteId}/historysdts`;
    if (autoPaginate) return this.paginateAll<any>(path, cleanedParams);
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getWebsiteGraphByName(websiteId: number, graphName: string, params?: { start?: number; end?: number; format?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/website/websites/${websiteId}/graphs/${encodeURIComponent(graphName)}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Website Checkpoints
  async listWebsiteCheckpoints(params?: { fields?: string }) {
    return this.request<LMListResponse<any>>('GET', '/website/smcheckpoints', undefined, params);
  }
}
