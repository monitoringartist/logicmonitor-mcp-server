import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class AuditClient extends BaseClient {
  // Audit Logs
  async listAuditLogs(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/accesslogs', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/accesslogs', undefined, cleanedParams);
  }

  async getAuditLog(auditLogId: string, params?: {
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params || {});
    return this.request<LMResponse<any>>('GET', `/setting/accesslogs/${auditLogId}`, undefined, cleanedParams);
  }
}
