import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class ReportsClient extends BaseClient {
  // Reports
  async listReports(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/report/reports', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/report/reports', undefined, cleanedParams);
  }

  async getReport(reportId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/report/reports/${reportId}`, undefined, params);
  }

  async createReport(report: any) {
    return this.request<LMResponse<any>>('POST', '/report/reports', report);
  }

  async updateReport(reportId: number, report: any) {
    return this.request<LMResponse<any>>('PATCH', `/report/reports/${reportId}`, report);
  }

  async deleteReport(reportId: number) {
    return this.request<LMResponse<any>>('DELETE', `/report/reports/${reportId}`);
  }

  async generateReport(reportId: number, body?: { withAdminId?: number; receiveEmails?: string }) {
    return this.request<LMResponse<any>>('POST', `/report/reports/${reportId}/executions`, body || {});
  }

  async getReportTaskResult(reportId: number, taskId: string) {
    return this.request<LMResponse<any>>(
      'GET',
      `/report/reports/${reportId}/tasks/${encodeURIComponent(taskId)}`,
    );
  }

  // Report Groups
  async listReportGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/report/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/report/groups', undefined, cleanedParams);
  }

  async getReportGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/report/groups/${groupId}`, undefined, params);
  }

  async createReportGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/report/groups', group);
  }

  async updateReportGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/report/groups/${groupId}`, group);
  }

  async deleteReportGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/report/groups/${groupId}`);
  }
}
