import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class IntegrationsClient extends BaseClient {
  // Integration audit logs
  async getIntegrationAuditLogs(params?: { format?: string }) {
    return this.request<LMResponse<any>>('GET', '/setting/integrations/auditlogs', undefined, this.cleanParams(params || {}));
  }

  // Integrations
  async listIntegrations(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/integrations', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/integrations', undefined, cleanedParams);
  }

  async getIntegration(integrationId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/integrations/${integrationId}`, undefined, params);
  }

  async createIntegration(integration: any) {
    return this.request<LMResponse<any>>('POST', '/setting/integrations', integration);
  }

  async updateIntegration(integrationId: number, integration: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/integrations/${integrationId}`, integration);
  }

  async deleteIntegration(integrationId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/integrations/${integrationId}`);
  }
}
