import { BaseClient, LMResponse } from './base-client.js';

export class MiscClient extends BaseClient {
  // Contract / usage info
  async getContractInfo(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/usage/contractInfo', undefined, this.cleanParams(params || {}));
  }

  // DNS mappings
  async addDNSMapping(body: any) {
    return this.request<LMResponse<any>>('POST', '/setting/dnsmappings', body);
  }

  // FOCUS Cost & Usage export
  async getFocusCostUsage(params?: {
    feature?: string;
    dimensionKey?: string;
    startTime?: number;
    endTime?: number;
    at?: number;
    metricQualifier?: string;
    usageBreakdownType?: string;
    usageBreakdownUnits?: string;
    sku?: string;
    tenantIds?: string[];
    size?: number;
    offset?: number;
  }) {
    return this.request<LMResponse<any>>('GET', '/usage/focusCostUsage', undefined, this.cleanParams(params || {}));
  }
}
