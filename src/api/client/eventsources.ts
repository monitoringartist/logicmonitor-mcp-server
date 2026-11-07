import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class EventsourcesClient extends BaseClient {
  // EventSources
  async listEventSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/eventsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/eventsources', undefined, cleanedParams);
  }

  async getEventSource(eventSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/eventsources/${eventSourceId}`, undefined, params);
  }

  async createEventSource(eventSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/eventsources', eventSource);
  }

  async updateEventSource(eventSourceId: number, eventSource: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/eventsources/${eventSourceId}`, eventSource);
  }

  async deleteEventSource(eventSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/eventsources/${eventSourceId}`);
  }

  async importEventSource(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/eventsources/importjson' : '/setting/eventsources/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'eventsource.json' : 'eventsource.xml',
      isJson ? 'application/json' : 'text/xml',
      queryParams,
    );
  }
}
