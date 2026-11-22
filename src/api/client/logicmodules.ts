import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class LogicmodulesClient extends BaseClient {
  // AppliesTo Functions
  async listAppliesToFunctions(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/functions', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/functions', undefined, cleanedParams);
  }

  async getAppliesToFunction(functionId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/functions/${functionId}`, undefined, this.cleanParams(params || {}));
  }

  async createAppliesToFunction(appliesToFunction: any) {
    return this.request<LMResponse<any>>('POST', '/setting/functions', appliesToFunction);
  }

  async updateAppliesToFunction(functionId: number, appliesToFunction: any, params?: { reason?: string; ignoreReference?: boolean }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/functions/${functionId}`, appliesToFunction, this.cleanParams(params || {}));
  }

  async deleteAppliesToFunction(functionId: number, params?: { ignoreReference?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/setting/functions/${functionId}`, undefined, this.cleanParams(params || {}));
  }

  async importAppliesToFunction(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/functions/importjson',
      content,
      'function.json',
      'application/json',
      queryParams,
    );
  }

  // SNMP OIDs
  async listOIDs(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/oids', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/oids', undefined, cleanedParams);
  }

  async getOID(oidId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/oids/${oidId}`, undefined, this.cleanParams(params || {}));
  }

  async createOID(oid: any) {
    return this.request<LMResponse<any>>('POST', '/setting/oids', oid);
  }

  async updateOID(oidId: number, oid: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/oids/${oidId}`, oid);
  }

  async deleteOID(oidId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/oids/${oidId}`);
  }

  async importOID(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/oids/importjson',
      content,
      'oid.json',
      'application/json',
      queryParams,
    );
  }

  // LogicModule metadata
  async getLogicModuleMetadata(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/setting/logicmodules/metadata', undefined, this.cleanParams(params || {}));
  }
}
