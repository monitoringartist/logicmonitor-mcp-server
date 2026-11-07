import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class ConfigsourcesClient extends BaseClient {
  // ConfigSources
  async listConfigSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/configsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/configsources', undefined, cleanedParams);
  }

  async getConfigSource(configSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/configsources/${configSourceId}`, undefined, params);
  }

  async createConfigSource(configSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/configsources', configSource);
  }

  async updateConfigSource(configSourceId: number, configSource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/configsources/${configSourceId}`,
      configSource,
      params,
    );
  }

  async deleteConfigSource(configSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/configsources/${configSourceId}`);
  }

  async importConfigSource(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/configsources/importjson' : '/setting/configsources/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'configsource.json' : 'configsource.xml',
      isJson ? 'application/json' : 'text/xml',
      queryParams,
    );
  }

  // ConfigSource update reasons
  async getConfigSourceUpdateReasons(configSourceId: number, params?: { size?: number; offset?: number; filter?: string; fields?: string }) {
    return this.request<LMListResponse<any>>('GET', `/setting/configsources/${configSourceId}/updatereasons`, undefined, this.cleanParams(params || {}));
  }
}
