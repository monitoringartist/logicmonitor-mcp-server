import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class DiagnosticsClient extends BaseClient {
  // DiagnosticSources
  async listDiagnosticSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/diagnosticsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/diagnosticsources', undefined, cleanedParams);
  }

  async getDiagnosticSource(diagnosticSourceId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/diagnosticsources/${diagnosticSourceId}`, undefined, this.cleanParams(params || {}));
  }

  async createDiagnosticSource(diagnosticSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/diagnosticsources', diagnosticSource);
  }

  async updateDiagnosticSource(diagnosticSourceId: number, diagnosticSource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/diagnosticsources/${diagnosticSourceId}`, diagnosticSource, this.cleanParams(params || {}));
  }

  async deleteDiagnosticSource(diagnosticSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/diagnosticsources/${diagnosticSourceId}`);
  }

  async importDiagnosticSource(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/diagnosticsources/importjson',
      content,
      'diagnosticsource.json',
      'application/json',
      queryParams,
    );
  }

  async executeDiagnosticSource(execution: any) {
    return this.request<LMResponse<any>>('POST', '/setting/diagnosticsources/executemanually', execution);
  }

  // RemediationSources
  async listRemediationSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/remediationsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/remediationsources', undefined, cleanedParams);
  }

  async getRemediationSource(remediationSourceId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/remediationsources/${remediationSourceId}`, undefined, this.cleanParams(params || {}));
  }

  async createRemediationSource(remediationSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/remediationsources', remediationSource);
  }

  async updateRemediationSource(remediationSourceId: number, remediationSource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/remediationsources/${remediationSourceId}`, remediationSource, this.cleanParams(params || {}));
  }

  async deleteRemediationSource(remediationSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/remediationsources/${remediationSourceId}`);
  }

  async executeRemediation(execution: any) {
    return this.request<LMResponse<any>>('POST', '/setting/remediationsources/executemanually', execution);
  }

  // Diagnostic Remediation
  async getDiagnosticRemediationSources(params?: { resourceId?: number; alertId?: string; moduleType?: string }) {
    return this.request<LMResponse<any>>('GET', '/setting/diagnosticRemediation/list', undefined, this.cleanParams(params || {}));
  }

  async getDiagnosticRemediationResults(params?: { hostId?: number; alertId?: string; moduleType?: string }) {
    return this.request<LMResponse<any>>('GET', '/setting/diagnosticRemediation/executionResults', undefined, this.cleanParams(params || {}));
  }
}
