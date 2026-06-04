import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class EscalationClient extends BaseClient {
  // Escalation Chains
  async listEscalationChains(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/alert/chains', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/alert/chains', undefined, cleanedParams);
  }

  async getEscalationChain(chainId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/alert/chains/${chainId}`, undefined, params);
  }

  async createEscalationChain(chain: any) {
    return this.request<LMResponse<any>>('POST', '/setting/alert/chains', chain);
  }

  async updateEscalationChain(chainId: number, chain: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/alert/chains/${chainId}`, chain);
  }

  async deleteEscalationChain(chainId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/alert/chains/${chainId}`);
  }

  // Recipients
  async listRecipients(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/recipients', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/recipients', undefined, cleanedParams);
  }

  async getRecipient(recipientId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/recipients/${recipientId}`, undefined, params);
  }

  async createRecipient(recipient: any) {
    return this.request<LMResponse<any>>('POST', '/setting/recipients', recipient);
  }

  async updateRecipient(recipientId: number, recipient: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/recipients/${recipientId}`, recipient);
  }

  async deleteRecipient(recipientId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/recipients/${recipientId}`);
  }

  // Recipient Groups
  async listRecipientGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/recipientgroups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/recipientgroups', undefined, cleanedParams);
  }

  async getRecipientGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/recipientgroups/${groupId}`, undefined, params);
  }

  async createRecipientGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/setting/recipientgroups', group);
  }

  async updateRecipientGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/recipientgroups/${groupId}`, group);
  }

  async deleteRecipientGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/recipientgroups/${groupId}`);
  }
}
