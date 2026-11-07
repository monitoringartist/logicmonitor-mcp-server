import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class PropertyRulesClient extends BaseClient {
  // Property Rules (PropertySources)
  async listPropertyRules(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    format?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/propertyrules', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/propertyrules', undefined, cleanedParams);
  }

  async getPropertyRule(propertyRuleId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/propertyrules/${propertyRuleId}`, undefined, this.cleanParams(params || {}));
  }

  async createPropertyRule(propertyRule: any) {
    return this.request<LMResponse<any>>('POST', '/setting/propertyrules', propertyRule);
  }

  async updatePropertyRule(propertyRuleId: number, propertyRule: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/propertyrules/${propertyRuleId}`,
      propertyRule,
      this.cleanParams(params || {}),
    );
  }

  async deletePropertyRule(propertyRuleId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/propertyrules/${propertyRuleId}`);
  }

  async importPropertyRule(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/propertyrules/importjson',
      content,
      'propertysource.json',
      'application/json',
      queryParams,
    );
  }
}
