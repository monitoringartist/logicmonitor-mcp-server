import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class JobMonitorsClient extends BaseClient {
  // Job Monitors (BatchJobs)
  async listJobMonitors(params?: {
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
      return this.paginateAll<any>('/setting/batchjobs', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/batchjobs', undefined, cleanedParams);
  }

  async getJobMonitor(jobMonitorId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/batchjobs/${jobMonitorId}`, undefined, this.cleanParams(params || {}));
  }

  async createJobMonitor(jobMonitor: any) {
    return this.request<LMResponse<any>>('POST', '/setting/batchjobs', jobMonitor);
  }

  async updateJobMonitor(jobMonitorId: number, jobMonitor: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/batchjobs/${jobMonitorId}`, jobMonitor, this.cleanParams(params || {}));
  }

  async deleteJobMonitor(jobMonitorId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/batchjobs/${jobMonitorId}`);
  }

  async importJobMonitor(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/batchjobs/importjson' : '/setting/batchjobs/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'batchjob.json' : 'batchjob.xml',
      isJson ? 'application/json' : 'application/xml',
      queryParams,
    );
  }
}
