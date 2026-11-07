import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class AlertsClient extends BaseClient {
  // Alert Management
  async listAlerts(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    needMessage?: boolean;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/alert/alerts', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/alert/alerts', undefined, cleanedParams);
  }

  async getAlert(alertId: string, params?: { fields?: string; needMessage?: boolean }) {
    return this.request<LMResponse<any>>('GET', `/alert/alerts/${alertId}`, undefined, params);
  }

  async acknowledgeAlert(alertId: string, ackComment?: string) {
    return this.request<LMResponse<any>>('POST', `/alert/alerts/${alertId}/ack`, {
      ackComment: ackComment || 'Acknowledged via MCP',
    });
  }

  async addAlertNote(alertId: string, note: string) {
    return this.request<LMResponse<any>>('POST', `/alert/alerts/${alertId}/note`, {
      note,
    });
  }

  // Alert Rules
  async listAlertRules(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/alert/rules', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/alert/rules', undefined, cleanedParams);
  }

  async getAlertRule(ruleId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/alert/rules/${ruleId}`, undefined, params);
  }

  async createAlertRule(rule: any) {
    return this.request<LMResponse<any>>('POST', '/setting/alert/rules', rule);
  }

  async updateAlertRule(ruleId: number, rule: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/alert/rules/${ruleId}`, rule);
  }

  async deleteAlertRule(ruleId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/alert/rules/${ruleId}`);
  }

  // Action Chains
  async listActionChains(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/action/chains', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/action/chains', undefined, cleanedParams);
  }

  async getActionChain(actionChainId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/action/chains/${actionChainId}`, undefined, this.cleanParams(params || {}));
  }

  async createActionChain(actionChain: any) {
    return this.request<LMResponse<any>>('POST', '/setting/action/chains', actionChain);
  }

  async updateActionChain(actionChainId: number, actionChain: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/action/chains/${actionChainId}`, actionChain);
  }

  async deleteActionChain(actionChainId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/action/chains/${actionChainId}`);
  }

  // Action Rules
  async listActionRules(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/action/rules', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/action/rules', undefined, cleanedParams);
  }

  async getActionRule(actionRuleId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/action/rules/${actionRuleId}`, undefined, this.cleanParams(params || {}));
  }

  async createActionRule(actionRule: any) {
    return this.request<LMResponse<any>>('POST', '/setting/action/rules', actionRule);
  }

  async updateActionRule(actionRuleId: number, actionRule: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/action/rules/${actionRuleId}`, actionRule);
  }

  async deleteActionRule(actionRuleId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/action/rules/${actionRuleId}`);
  }

  async setActionRuleStatus(actionRuleId: number, enabled: boolean) {
    return this.request<LMResponse<any>>('PATCH', `/setting/action/rules/${actionRuleId}/status`, { enabled });
  }

  // Alert escalation
  async escalateAlert(alertId: string) {
    return this.request<LMResponse<any>>('POST', `/alert/alerts/${encodeURIComponent(alertId)}/escalate`, {});
  }
}
