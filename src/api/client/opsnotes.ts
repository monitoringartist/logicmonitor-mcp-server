import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class OpsnotesClient extends BaseClient {
  // OpsNotes
  async listOpsNotes(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/opsnotes', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/opsnotes', undefined, cleanedParams);
  }

  async getOpsNote(opsNoteId: string, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/opsnotes/${opsNoteId}`, undefined, params);
  }

  async createOpsNote(opsNote: any) {
    return this.request<LMResponse<any>>('POST', '/setting/opsnotes', opsNote);
  }

  async updateOpsNote(opsNoteId: string, opsNote: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/opsnotes/${opsNoteId}`, opsNote);
  }

  async deleteOpsNote(opsNoteId: string) {
    return this.request<LMResponse<any>>('DELETE', `/setting/opsnotes/${opsNoteId}`);
  }
}
