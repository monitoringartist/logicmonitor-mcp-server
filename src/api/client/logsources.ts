import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class LogsourcesClient extends BaseClient {
  // LogSources
  async listLogSources(params?: {
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
      return this.paginateAll<any>('/setting/logsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/logsources', undefined, cleanedParams);
  }

  async getLogSource(logSourceId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/logsources/${logSourceId}`, undefined, this.cleanParams(params || {}));
  }

  async createLogSource(logSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/logsources', logSource);
  }

  async updateLogSource(logSourceId: number, logSource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/logsources/${logSourceId}`,
      logSource,
      this.cleanParams(params || {}),
    );
  }

  async deleteLogSource(logSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/logsources/${logSourceId}`);
  }

  async importLogSource(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/logsources/importjson',
      content,
      'logsource.json',
      'application/json',
      queryParams,
    );
  }

  // Log Pipelines / Log Alert Groups
  async listLogAlertGroups(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/logpipelines', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/logpipelines', undefined, cleanedParams);
  }

  async getLogAlertGroup(pipelineId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/logpipelines/${pipelineId}`, undefined, this.cleanParams(params || {}));
  }

  async createLogAlertGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/logpipelines', group);
  }

  async updateLogAlertGroup(pipelineId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/logpipelines/${pipelineId}`, group);
  }

  async deleteLogAlertGroup(pipelineId: number) {
    return this.request<LMResponse<any>>('DELETE', `/logpipelines/${pipelineId}`);
  }

  async listLogAlerts(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/logpipelines/processors', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/logpipelines/processors', undefined, cleanedParams);
  }

  async getLogAlert(processorId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/logpipelines/processors/${processorId}`, undefined, this.cleanParams(params || {}));
  }

  async createLogAlert(processor: any) {
    return this.request<LMResponse<any>>('POST', '/logpipelines/processors', processor);
  }

  async updateLogAlert(processorId: number, processor: any) {
    return this.request<LMResponse<any>>('PATCH', `/logpipelines/processors/${processorId}`, processor);
  }

  async deleteLogAlert(processorId: number) {
    return this.request<LMResponse<any>>('DELETE', `/logpipelines/processors/${processorId}`);
  }

  async setLogAlertStatus(processorId: number, action: string, body?: any) {
    return this.request<LMResponse<any>>('PUT', `/logpipelines/processors/${processorId}/${encodeURIComponent(action)}`, body || {});
  }

  // Log Query Groups
  async listLogQueryGroups(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/log/logquerygroups', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/log/logquerygroups', undefined, cleanedParams);
  }

  async getLogQueryGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/log/logquerygroups/${groupId}`, undefined, this.cleanParams(params || {}));
  }

  async createLogQueryGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/log/logquerygroups', group);
  }

  async updateLogQueryGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/log/logquerygroups/${groupId}`, group);
  }

  async deleteLogQueryGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/log/logquerygroups/${groupId}`);
  }

  async listLogQueryGroupQueries(groupId: number, params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/log/logquerygroups/${groupId}/logqueries`;
    if (autoPaginate) return this.paginateAll<any>(path, cleanedParams);
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async listLogQueryGroupsByType(groupType: string, params?: { allGroups?: boolean; size?: number; offset?: number; filter?: string; fields?: string }) {
    return this.request<LMListResponse<any>>('GET', `/log/logquerygroups/grouptype/${encodeURIComponent(groupType)}`, undefined, this.cleanParams(params || {}));
  }

  async moveLogQueries(groupId: number, body: any) {
    return this.request<LMResponse<any>>('POST', `/log/logquerygroups/${groupId}/move`, body);
  }

  // Log Partitions
  async listLogPartitions(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/log/partitions', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/log/partitions', undefined, cleanedParams);
  }

  async getLogPartition(partitionId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/log/partitions/${partitionId}`, undefined, this.cleanParams(params || {}));
  }

  async createLogPartition(partition: any) {
    return this.request<LMResponse<any>>('POST', '/log/partitions', partition);
  }

  async updateLogPartition(partitionId: number, partition: any) {
    return this.request<LMResponse<any>>('PATCH', `/log/partitions/${partitionId}`, partition);
  }

  async deleteLogPartition(partitionId: number) {
    return this.request<LMResponse<any>>('DELETE', `/log/partitions/${partitionId}`);
  }

  async getLogPartitionRetentions(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/log/partitions/retentions', undefined, this.cleanParams(params || {}));
  }

  async logPartitionAction(partitionId: number, action: string, body?: any) {
    return this.request<LMResponse<any>>('POST', `/log/partitions/${partitionId}/${encodeURIComponent(action)}`, body || {});
  }

  // Tracked Query Groups
  async listTrackedQueryGroups(params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) return this.paginateAll<any>('/trackedquerygroups', cleanedParams);
    return this.request<LMListResponse<any>>('GET', '/trackedquerygroups', undefined, cleanedParams);
  }

  async getTrackedQueryGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/trackedquerygroups/${groupId}`, undefined, this.cleanParams(params || {}));
  }

  async createTrackedQueryGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/trackedquerygroups', group);
  }

  async updateTrackedQueryGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/trackedquerygroups/${groupId}`, group);
  }

  async deleteTrackedQueryGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/trackedquerygroups/${groupId}`);
  }
}
