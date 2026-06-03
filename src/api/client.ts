/**
 * LogicMonitor API Client
 *
 * HTTP client for interacting with LogicMonitor REST API v3
 * Documentation: https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/
 */

import { rateLimiter } from '../utils/core/rate-limiter.js';
import { formatLogicMonitorFilter } from '../utils/helpers/filters.js';
import { LogicMonitorApiError } from '../utils/core/lm-error.js';

export interface LogicMonitorConfig {
  company: string;
  bearerToken: string;
  timeout?: number; // Request timeout in milliseconds (default: 30000)
  logger?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, requestId?: string) => void;
}

/**
 * Escape special characters in filter values according to LogicMonitor API requirements
 * Special characters that need escaping: ( ) : , ~ " \
 * Note: Asterisk (*) is NOT escaped as it's used for wildcards in search patterns
 */
export function escapeFilterValue(value: string): string {
  // Escape special characters with backslash
  // These characters have special meaning in LogicMonitor filter syntax
  // We exclude * from escaping as it's commonly used for wildcard searches
  return value.replace(/([(),:~"\\])/g, '\\$1');
}

// LogicMonitor API v3 returns single resource responses directly (not wrapped)
export type LMResponse<T> = T;

// LogicMonitor API v3 returns list responses with this structure
export interface LMListResponse<T> {
    total: number;
    items: T[];
  searchId?: string;
  isMin?: boolean;
}

export class LogicMonitorClient {
  private baseUrl: string;
  private bearerToken: string;
  private timeout: number;
  private logger?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, requestId?: string) => void;

  constructor(config: LogicMonitorConfig) {
    this.baseUrl = `https://${config.company}.logicmonitor.com/santaba/rest`;
    this.bearerToken = config.bearerToken;
    this.timeout = config.timeout || 30000; // Default 30 seconds
    this.logger = config.logger;
  }

  /**
   * Clean and format request parameters
   * - Handles fields="*" by omitting it
   * - Formats filter strings automatically
   */
  private cleanParams(params?: Record<string, any>): Record<string, any> {
    if (!params) return {};

    const { fields, filter, ...otherParams } = params;
    return {
      ...otherParams,
      ...(fields && fields !== '*' ? { fields } : {}),
      ...(filter ? { filter: formatLogicMonitorFilter(filter) } : {}),
    };
  }

  /**
   * Make an authenticated HTTP request to LogicMonitor API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // URLSearchParams.append() automatically does URL encoding
          // No special handling needed - standard encoding works for filters
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Accept': 'application/json',
      'X-Version': '3',
    };

    // Only add Content-Type header if there's a body
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    // Setup timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    // Log API request
    const startTime = Date.now();
    this.logger?.('debug', 'LM API Request', {
      method,
      path,
      url: url.toString(),
      params,
      timeout: this.timeout,
      headers: {
        ...(headers['Content-Type'] ? { 'Content-Type': headers['Content-Type'] } : {}),
        'Accept': headers['Accept'],
        'X-Version': headers['X-Version'],
        'Authorization': headers['Authorization'] ? `${headers['Authorization'].substring(0, 20)}...` : 'none',
      },
      body: body ? (JSON.stringify(body).length > 500 ? `${JSON.stringify(body).substring(0, 500)}... (truncated)` : body) : undefined,
    });

    let response: Response;
    let data: any;

    try {
      response = await fetch(url.toString(), options);
      data = await response.json();

      const duration = Date.now() - startTime;

      // Extract and update rate limit info from headers
      const rateLimitInfo = rateLimiter.extractRateLimitInfo(response.headers);
      if (rateLimitInfo) {
        rateLimiter.updateRateLimitInfo('api-request', rateLimitInfo);
        this.logger?.('debug', 'Rate limit info', rateLimitInfo);
      }

      // Log API response
      if (response.ok) {
        this.logger?.('debug', 'LM API Response', {
          status: response.status,
          duration_ms: duration,
          path,
          dataSize: JSON.stringify(data).length,
          responseStructure: {
            hasStatus: !!data.status,
            hasErrmsg: !!data.errmsg,
            hasData: !!data.data,
            topLevelKeys: Object.keys(data),
          },
          rateLimit: rateLimitInfo,
        });
      } else {
        this.logger?.('warn', 'LM API Error Response', {
          status: response.status,
          duration_ms: duration,
          path,
          url: url.toString(),
          error: data.errmsg || response.statusText,
          errorMessage: data.errorMessage,
          errorCode: data.errorCode,
          errorDetail: data.errorDetail,
          fullResponse: data,
          rateLimit: rateLimitInfo,
        });
      }

      if (!response.ok) {
        // Special handling for rate limit errors
        if (response.status === 429) {
          this.logger?.('warn', 'Rate limit exceeded', { rateLimitInfo });
        }

        // Throw detailed error with all LM API error information
        throw new LogicMonitorApiError(
          `LogicMonitor API Error: ${response.status}`,
          {
            status: response.status,
            errorCode: data.errorCode,
            errorMessage: data.errorMessage || data.errmsg || response.statusText,
            errorDetail: data.errorDetail,
            path,
            duration,
          },
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check if error is due to timeout
      const isTimeout = error instanceof Error && error.name === 'AbortError';

      this.logger?.('error', 'LM API Request Failed', {
        method,
        path,
        duration_ms: duration,
        timeout: isTimeout,
        error: error instanceof Error ? error.message : String(error),
      });

      if (isTimeout) {
        throw new Error(`Request timeout after ${this.timeout}ms: ${method} ${path}`);
      }

      throw error;
    } finally {
      // Always clear timeout to prevent memory leaks
      clearTimeout(timeoutId);
    }

    return data;
  }

  /**
   * Upload a LogicModule file (XML or JSON) via a multipart/form-data request.
   *
   * Used by the import endpoints (e.g. /setting/configsources/importjson). The file
   * content is sent under the "file" form field, matching LogicMonitor's import API.
   * The Content-Type header is intentionally NOT set so that fetch generates the
   * correct multipart boundary automatically.
   */
  private async requestMultipart<T>(
    path: string,
    fileContent: string,
    fileName: string,
    contentType: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const form = new FormData();
    form.append('file', new Blob([fileContent], { type: contentType }), fileName);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Accept': 'application/json',
      'X-Version': '3',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const startTime = Date.now();

    this.logger?.('debug', 'LM API Multipart Request', {
      method: 'POST',
      path,
      url: url.toString(),
      fileName,
      contentType,
      params,
    });

    let response: Response;
    let data: any;

    try {
      response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: form,
        signal: controller.signal,
      });
      data = await response.json();

      if (!response.ok) {
        throw new LogicMonitorApiError(
          `LogicMonitor API Error: ${response.status}`,
          {
            status: response.status,
            errorCode: data.errorCode,
            errorMessage: data.errorMessage || data.errmsg || response.statusText,
            errorDetail: data.errorDetail,
            path,
            duration: Date.now() - startTime,
          },
        );
      }
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      this.logger?.('error', 'LM API Multipart Request Failed', {
        path,
        timeout: isTimeout,
        error: error instanceof Error ? error.message : String(error),
      });
      if (isTimeout) {
        throw new Error(`Request timeout after ${this.timeout}ms: POST ${path}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    return data;
  }

  /**
   * Generic pagination helper that automatically fetches all pages
   * @param path - The API path to paginate
   * @param params - Request parameters including optional size/offset
   * @returns Combined results from all pages
   */
  private async paginateAll<T>(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<LMListResponse<T>> {
    const size = (params?.size as number) || 1000; // Default to max size for efficiency
    let offset = (params?.offset as number) || 0;
    const initialOffset = offset;
    let allItems: T[] = [];
    let totalCount = 0;
    let hasMore = true;

    this.logger?.('debug', 'Starting pagination', {
      path,
      initialSize: size,
      initialOffset: offset,
      params,
    });

    while (hasMore) {
      try {
        // Make the request with current pagination params
        const response = await this.request<any>(
          'GET',
          path,
          undefined,
          { ...params, size, offset },
        );

        // Log the actual response structure for debugging
        this.logger?.('debug', 'Pagination response structure', {
          path,
          offset,
          responseType: typeof response,
          responseKeys: response ? Object.keys(response) : undefined,
          hasTotal: !!(response?.total),
          hasItems: !!(response?.items),
        });

        // LM API v3 returns {total, items, searchId, isMin} directly
        if (!response || typeof response !== 'object') {
          throw new Error(`Invalid API response for ${path}: response is not an object`);
        }

        if (!('total' in response) || !('items' in response)) {
          this.logger?.('error', 'Unexpected response structure', {
            path,
            offset,
            responseKeys: Object.keys(response),
            response: JSON.stringify(response).substring(0, 500),
          });
          throw new Error(`Invalid API response structure for ${path}: missing total/items properties`);
        }

        // On first iteration, capture the total count
        if (offset === initialOffset) {
          totalCount = response.total || 0;
        }

        // Add items from this page
        const items = response.items || [];
        allItems = allItems.concat(items);

        this.logger?.('debug', 'Fetched page', {
          path,
          offset,
          requestedSize: size,
          returnedSize: items.length,
          totalSoFar: allItems.length,
          total: totalCount,
        });

        // Check if we have more pages
        if (items.length === 0 || allItems.length >= totalCount) {
          hasMore = false;
        } else {
          // Calculate next offset based on actual items returned
          offset += items.length;
        }
      } catch (error) {
        this.logger?.('error', 'Pagination failed', {
          path,
          offset,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    this.logger?.('info', 'Pagination complete', {
      path,
      totalPages: Math.ceil(allItems.length / size),
      totalItems: allItems.length,
      expectedTotal: totalCount,
    });

    return {
      total: totalCount,
      items: allItems,
    };
  }

  // Device Management
  /**
   * List resources with optional filtering
   *
   * Filter examples:
   * - Exact match: filter: 'id:123'
   * - Contains with wildcards: filter: 'displayName~"*server*"' (quotes required for wildcards)
   * - Multiple conditions (AND): filter: 'displayName~"*prod*",hostStatus:normal' (use comma, NOT &&)
   * - Multiple conditions (OR): filter: 'displayName~"*prod*" || displayName~"*dev*"'
   * - With special characters: Use escapeFilterValue() for user input
   *
   * IMPORTANT: Use comma (,) for AND operations, NOT &&
   *
   * Note: Filter parameter is automatically URL-encoded. For special characters in filter values,
   * use escapeFilterValue() to escape them before building the filter string.
   */
  async listResources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/device/devices', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/devices', undefined, cleanedParams);
  }

  async getDevice(deviceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/devices/${deviceId}`, undefined, params);
  }

  async createDevice(device: any) {
    return this.request<LMResponse<any>>('POST', '/device/devices', device);
  }

  async updateDevice(deviceId: number, device: any, params?: { opType?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}`, device, params);
  }

  async deleteDevice(deviceId: number, params?: { deleteFromSystem?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/device/devices/${deviceId}`, undefined, params);
  }

  // Device Groups
  async listDeviceGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/device/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/device/groups', undefined, cleanedParams);
  }

  async getDeviceGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/groups/${groupId}`, undefined, params);
  }

  async createDeviceGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/device/groups', group);
  }

  async updateDeviceGroup(groupId: number, group: any, params?: { opType?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}`, group, params);
  }

  async deleteDeviceGroup(groupId: number, params?: { deleteChildren?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/device/groups/${groupId}`, undefined, params);
  }

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

  // Collectors
  async listCollectors(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/collector/collectors', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/collector/collectors', undefined, cleanedParams);
  }

  async getCollector(collectorId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/collector/collectors/${collectorId}`, undefined, params);
  }

  async createCollector(collector: any) {
    return this.request<LMResponse<any>>('POST', '/setting/collector/collectors', collector);
  }

  async updateCollector(collectorId: number, collector: any, params?: {
    autoBalanceMonitoredDevices?: boolean;
    forceUpdateFailedOverDevices?: boolean;
    opType?: string;
  }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/collector/collectors/${collectorId}`,
      collector,
      params,
    );
  }

  async deleteCollector(collectorId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/collector/collectors/${collectorId}`);
  }

  /**
   * Build the authenticated download URL for a Collector installer.
   *
   * The installer endpoint streams a large binary file, which is unsuitable for an
   * inline MCP response, so this returns the fully-qualified URL (with query params)
   * plus metadata. The caller downloads it with their LM bearer token, e.g.:
   *   curl -H "Authorization: Bearer <token>" -L "<url>" -o logicmonitor-collector
   */
  getCollectorInstallerUrl(collectorId: number, osAndArch: string, options?: {
    collectorVersion?: number;
    collectorSize?: string;
    useEA?: boolean;
    monitorOthers?: boolean;
    token?: string;
  }): { url: string; collectorId: number; osAndArch: string; downloadInstructions: string; note: string } {
    const path = `/setting/collector/collectors/${collectorId}/installers/${encodeURIComponent(osAndArch)}`;
    const url = new URL(`${this.baseUrl}${path}`);

    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const urlString = url.toString();
    return {
      url: urlString,
      collectorId,
      osAndArch,
      downloadInstructions:
        `curl -H "Authorization: Bearer <LM_BEARER_TOKEN>" -L "${urlString}" -o logicmonitor-collector` +
        (osAndArch.toLowerCase().startsWith('win') ? '.exe' : '.bin'),
      note:
        'This URL requires the LogicMonitor bearer token in the Authorization header. ' +
        'The endpoint returns the installer binary directly, so download it with the command above ' +
        'rather than opening the URL in a browser.',
    };
  }

  async acknowledgeCollectorDownAlert(collectorId: number, comment?: string) {
    return this.request<LMResponse<any>>(
      'POST',
      `/setting/collector/collectors/${collectorId}/ackdown`,
      { comment: comment ?? '' },
    );
  }

  // DataSources
  async listDataSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/datasources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/datasources', undefined, cleanedParams);
  }

  async getDataSource(dataSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/datasources/${dataSourceId}`, undefined, params);
  }

  async createDataSource(dataSource: any, params?: { createGraph?: boolean }) {
    return this.request<LMResponse<any>>('POST', '/setting/datasources', dataSource, this.cleanParams(params || {}));
  }

  async updateDataSource(
    dataSourceId: number,
    dataSource: any,
    params?: { reason?: string; forceUniqueIdentifier?: boolean; forceRestrictedChangeKey?: string },
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/datasources/${dataSourceId}`,
      dataSource,
      this.cleanParams(params || {}),
    );
  }

  async deleteDataSource(dataSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/datasources/${dataSourceId}`);
  }

  async importDataSource(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/datasources/importjson' : '/setting/datasources/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'datasource.json' : 'datasource.xml',
      isJson ? 'application/json' : 'text/xml',
      queryParams,
    );
  }

  async listDataSourceOverviewGraphs(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/ographs`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDataSourceOverviewGraph(dataSourceId: number, overviewGraphId: number) {
    return this.request<LMResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/ographs/${overviewGraphId}`,
    );
  }

  async listDataSourceDevices(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/devices`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDataSourceUpdateReasons(
    dataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/setting/datasources/${dataSourceId}/updatereasons`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSource Instances
  async listDeviceDataSourceInstances(
    deviceId: number,
    deviceDataSourceId: number,
    params?: {
      size?: number;
      offset?: number;
      filter?: string;
      fields?: string;
      autoPaginate?: boolean;
    },
  ) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(
        `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
        cleanedParams,
      );
    }
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
      undefined,
      cleanedParams,
    );
  }

  async getDeviceDataSourceInstanceData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: {
      datapoints?: string;
      start?: number;
      end?: number;
      format?: string;
    },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/data`,
      undefined,
      params,
    );
  }

  // Device DataSource Instances - write operations
  async createDeviceDataSourceInstance(deviceId: number, deviceDataSourceId: number, instance: any) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances`,
      instance,
    );
  }

  async updateDeviceDataSourceInstance(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    instance: any,
    params?: { opType?: string },
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}`,
      instance,
      this.cleanParams(params || {}),
    );
  }

  async deleteDeviceDataSourceInstance(deviceId: number, deviceDataSourceId: number, instanceId: number) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}`,
    );
  }

  async getDeviceDataSourceInstanceGraphData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    graphId: number,
    params?: { start?: number; end?: number; format?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/graphs/${graphId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceDataSourceData(
    deviceId: number,
    deviceDataSourceId: number,
    params?: {
      period?: number;
      start?: number;
      end?: number;
      datapoints?: string;
      format?: string;
      aggregate?: string;
    },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSource Instance Groups
  async listDeviceDataSourceInstanceGroups(
    deviceId: number,
    deviceDataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string; autoPaginate?: boolean },
  ) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups`;
    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getDeviceDataSourceInstanceGroup(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    params?: { fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async createDeviceDataSourceInstanceGroup(deviceId: number, deviceDataSourceId: number, group: any) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups`,
      group,
    );
  }

  async updateDeviceDataSourceInstanceGroup(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    group: any,
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}`,
      group,
    );
  }

  async updateInstanceGroupAlertThreshold(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    datapointId: number,
    config: any,
  ) {
    return this.request<LMResponse<any>>(
      'PUT',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}/datapoints/${datapointId}/alertconfig`,
      config,
    );
  }

  async getDeviceDataSourceInstanceGroupOverviewGraphData(
    deviceId: number,
    deviceDataSourceId: number,
    instanceGroupId: number,
    overviewGraphId: number,
    params?: { start?: number; end?: number; format?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/groups/${instanceGroupId}/graphs/${overviewGraphId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device DataSource Instance Alert Settings
  async listDeviceAlertSettings(
    deviceId: number,
    params?: { start?: number; end?: number; size?: number; offset?: number },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/alertsettings`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDeviceInstanceAlertSettings(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceAlertSetting(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    alertSettingId: number,
    params?: { fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings/${alertSettingId}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async updateDeviceInstanceAlertSetting(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    alertSettingId: number,
    setting: any,
  ) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/alertsettings/${alertSettingId}`,
      setting,
    );
  }

  // Device ConfigSource collected configs
  async listDeviceInstanceConfigs(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceConfig(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    configId: string,
    params?: { format?: string; startEpoch?: number; fields?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config/${encodeURIComponent(configId)}`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async collectDeviceInstanceConfig(deviceId: number, deviceDataSourceId: number, instanceId: number) {
    return this.request<LMResponse<any>>(
      'POST',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/config/configCollection`,
    );
  }

  // Netflow
  async listNetflowFlows(
    deviceId: number,
    params?: { start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/flows`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listNetflowPorts(
    deviceId: number,
    params?: { ip?: string; start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/ports`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listNetflowEndpoints(
    deviceId: number,
    params?: { port?: string; start?: number; end?: number; netflowFilter?: string; size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/endpoints`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceTopTalkersGraph(
    deviceId: number,
    params?: { start?: number; end?: number; netflowFilter?: string; format?: string; keyword?: string },
  ) {
    return this.request<LMResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/topTalkersGraph`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // SDT history
  async getDeviceSDTHistory(
    deviceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceDataSourceSDTHistory(
    deviceId: number,
    deviceDataSourceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async getDeviceInstanceSDTHistory(
    deviceId: number,
    deviceDataSourceId: number,
    instanceId: number,
    params?: { size?: number; offset?: number; filter?: string; fields?: string },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}/instances/${instanceId}/historysdts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  // Device properties (write)
  async createDeviceProperty(deviceId: number, name: string, value: string) {
    return this.request<LMResponse<any>>('POST', `/device/devices/${deviceId}/properties`, { name, value });
  }

  async deleteDeviceProperty(deviceId: number, propertyName: string) {
    return this.request<LMResponse<any>>(
      'DELETE',
      `/device/devices/${deviceId}/properties/${encodeURIComponent(propertyName)}`,
    );
  }

  // Device alerts / eventsources / discovery / delta
  async listDeviceAlerts(
    deviceId: number,
    params?: {
      start?: number;
      end?: number;
      needMessage?: boolean;
      size?: number;
      offset?: number;
      filter?: string;
      fields?: string;
    },
  ) {
    return this.request<LMListResponse<any>>(
      'GET',
      `/device/devices/${deviceId}/alerts`,
      undefined,
      this.cleanParams(params || {}),
    );
  }

  async listDeviceEventSources(deviceId: number) {
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/deviceeventsources`);
  }

  async scheduleDeviceAutoDiscovery(deviceId: number) {
    return this.request<LMResponse<any>>('POST', `/device/devices/${deviceId}/scheduleAutoDiscovery`);
  }

  async getDevicesDeltaId(params?: { deltaId?: string }) {
    return this.request<LMResponse<any>>('GET', '/device/devices/delta', undefined, this.cleanParams(params || {}));
  }

  async getDevicesDelta(deltaId: string) {
    return this.request<LMResponse<any>>('GET', `/device/devices/delta/${encodeURIComponent(deltaId)}`);
  }

  // Dashboards
  async listDashboards(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/dashboard/dashboards', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/dashboard/dashboards', undefined, cleanedParams);
  }

  async getDashboard(dashboardId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/dashboard/dashboards/${dashboardId}`, undefined, params);
  }

  async createDashboard(dashboard: any) {
    return this.request<LMResponse<any>>('POST', '/dashboard/dashboards', dashboard);
  }

  async updateDashboard(dashboardId: number, dashboard: any) {
    return this.request<LMResponse<any>>('PATCH', `/dashboard/dashboards/${dashboardId}`, dashboard);
  }

  async deleteDashboard(dashboardId: number) {
    return this.request<LMResponse<any>>('DELETE', `/dashboard/dashboards/${dashboardId}`);
  }

  /**
   * Generate a link URL for a dashboard
   * The URL follows the pattern: https://{company}.logicmonitor.com/santaba/uiv4/dashboards/dashboardGroups-{groupId1},dashboardGroups-{groupId2},...,dashboards-{dashboardId}
   */
  async generateDashboardLink(dashboardId: number): Promise<{ url: string; dashboard: any; groupPath: any[] }> {
    // Get dashboard details to retrieve groupId
    const dashboard = await this.getDashboard(dashboardId, { fields: 'id,name,groupId,groupName' });

    if (!dashboard || !dashboard.id) {
      throw new LogicMonitorApiError(
        `Dashboard with ID ${dashboardId} not found`,
        {
          status: 404,
          path: `/dashboard/dashboards/${dashboardId}`,
          errorMessage: 'Dashboard not found',
        },
      );
    }

    // Build the group hierarchy path
    const groupPath: any[] = [];
    let currentGroupId = dashboard.groupId;

    // Traverse up the group hierarchy
    while (currentGroupId) {
      try {
        const group = await this.getDashboardGroup(currentGroupId, { fields: 'id,name,parentId' });
        groupPath.unshift(group); // Add to beginning to maintain correct order
        currentGroupId = group.parentId;
      } catch (error) {
        // If we can't fetch a parent group (e.g., root level), stop traversing
        this.logger?.('warn', `Could not fetch dashboard group ${currentGroupId}`, { error });
        break;
      }
    }

    // Build the URL path segments
    const groupSegments = groupPath.map(group => `dashboardGroups-${group.id}`).join(',');
    const dashboardSegment = `dashboards-${dashboardId}`;
    const pathSegments = groupSegments ? `${groupSegments},${dashboardSegment}` : dashboardSegment;

    // Construct the full URL
    const baseUrl = this.baseUrl.replace('/santaba/rest', '');
    const url = `${baseUrl}/santaba/uiv4/dashboards/${pathSegments}`;

    return {
      url,
      dashboard,
      groupPath,
    };
  }

  /**
   * Generate a link URL for a resource/device
   * The URL follows the pattern: https://{company}.logicmonitor.com/santaba/uiv4/resources/treeNodes?resourcePath=resourceGroups-{groupId1},resourceGroups-{groupId2},...,resources-{deviceId}
   * Note: Uses URL encoding (%2C) for commas in the actual URL
   */
  async generateResourceLink(deviceId: number): Promise<{ url: string; device: any; groupPath: any[] }> {
    // Get device details to retrieve hostGroupIds
    const device = await this.getDevice(deviceId, { fields: 'id,displayName,name,hostGroupIds' });

    if (!device || !device.id) {
      throw new LogicMonitorApiError(
        `Device with ID ${deviceId} not found`,
        {
          status: 404,
          path: `/device/devices/${deviceId}`,
          errorMessage: 'Device not found',
        },
      );
    }

    // Build the group hierarchy path
    const groupPath: any[] = [];

    // Device can have multiple hostGroupIds, use the first one (primary group)
    if (device.hostGroupIds && device.hostGroupIds.length > 0) {
      const deviceGroupIds = device.hostGroupIds.split(',').map((id: string) => parseInt(id.trim()));
      const primaryGroupId = deviceGroupIds[0];

      let currentGroupId = primaryGroupId;

      // Traverse up the group hierarchy
      while (currentGroupId) {
        try {
          const group = await this.getDeviceGroup(currentGroupId, { fields: 'id,name,parentId' });
          groupPath.unshift(group); // Add to beginning to maintain correct order
          currentGroupId = group.parentId;
        } catch (error) {
          // If we can't fetch a parent group (e.g., root level), stop traversing
          this.logger?.('warn', `Could not fetch device group ${currentGroupId}`, { error });
          break;
        }
      }
    }

    // Build the URL path segments
    const groupSegments = groupPath.map(group => `resourceGroups-${group.id}`).join(',');
    const resourceSegment = `resources-${deviceId}`;
    const pathSegments = groupSegments ? `${groupSegments},${resourceSegment}` : resourceSegment;

    // URL encode the path (commas become %2C)
    const encodedPath = encodeURIComponent(pathSegments);

    // Construct the full URL
    const baseUrl = this.baseUrl.replace('/santaba/rest', '');
    const url = `${baseUrl}/santaba/uiv4/resources/treeNodes?resourcePath=${encodedPath}`;

    return {
      url,
      device,
      groupPath,
    };
  }

  /**
   * Generate a link URL for an alert
   * The URL follows the pattern: https://{company}.logicmonitor.com/santaba/uiv4/alerts/{alertId}
   */
  async generateAlertLink(alertId: string): Promise<{ url: string; alert: any }> {
    // Get alert details to verify it exists
    const alert = await this.getAlert(alertId, { fields: 'id,internalId,type,severity,monitorObjectName' });

    if (!alert || !alert.id) {
      throw new LogicMonitorApiError(
        `Alert with ID ${alertId} not found`,
        {
          status: 404,
          path: `/alert/alerts/${alertId}`,
          errorMessage: 'Alert not found',
        },
      );
    }

    // Construct the full URL (simple, no hierarchy needed)
    const baseUrl = this.baseUrl.replace('/santaba/rest', '');
    const url = `${baseUrl}/santaba/uiv4/alerts/${alertId}`;

    return {
      url,
      alert,
    };
  }

  /**
   * Generate a link URL for a website
   * The URL follows the pattern: https://{company}.logicmonitor.com/santaba/uiv4/websites/treeNodes#websiteGroups-{groupId1},websiteGroups-{groupId2},...,websites-{websiteId}
   */
  async generateWebsiteLink(websiteId: number): Promise<{ url: string; website: any; groupPath: any[] }> {
    // Get website details to retrieve groupId
    const website = await this.getWebsite(websiteId, { fields: 'id,name,groupId' });

    if (!website || !website.id) {
      throw new LogicMonitorApiError(
        `Website with ID ${websiteId} not found`,
        {
          status: 404,
          path: `/website/websites/${websiteId}`,
          errorMessage: 'Website not found',
        },
      );
    }

    // Build the group hierarchy path
    const groupPath: any[] = [];
    let currentGroupId = website.groupId;

    // Traverse up the group hierarchy
    while (currentGroupId) {
      try {
        const group = await this.getWebsiteGroup(currentGroupId, { fields: 'id,name,parentId' });
        groupPath.unshift(group); // Add to beginning to maintain correct order
        currentGroupId = group.parentId;
      } catch (error) {
        // If we can't fetch a parent group (e.g., root level), stop traversing
        this.logger?.('warn', `Could not fetch website group ${currentGroupId}`, { error });
        break;
      }
    }

    // Build the URL path segments
    const groupSegments = groupPath.map(group => `websiteGroups-${group.id}`).join(',');
    const websiteSegment = `websites-${websiteId}`;
    const pathSegments = groupSegments ? `${groupSegments},${websiteSegment}` : websiteSegment;

    // Construct the full URL (uses hash # instead of query parameter)
    const baseUrl = this.baseUrl.replace('/santaba/rest', '');
    const url = `${baseUrl}/santaba/uiv4/websites/treeNodes#${pathSegments}`;

    return {
      url,
      website,
      groupPath,
    };
  }

  // Dashboard Groups
  async listDashboardGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/dashboard/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/dashboard/groups', undefined, cleanedParams);
  }

  async getDashboardGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/dashboard/groups/${groupId}`, undefined, params);
  }

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

  // Websites (Synthetic Monitoring)
  async listWebsites(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/website/websites', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/website/websites', undefined, cleanedParams);
  }

  async getWebsite(websiteId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/website/websites/${websiteId}`, undefined, params);
  }

  async createWebsite(website: any) {
    return this.request<LMResponse<any>>('POST', '/website/websites', website);
  }

  async updateWebsite(websiteId: number, website: any) {
    return this.request<LMResponse<any>>('PATCH', `/website/websites/${websiteId}`, website);
  }

  async deleteWebsite(websiteId: number) {
    return this.request<LMResponse<any>>('DELETE', `/website/websites/${websiteId}`);
  }

  async getWebsiteCheckpointData(websiteId: number, checkpointId: number, params?: {
    period?: number;
    start?: number;
    end?: number;
    datapoints?: string;
    format?: string;
    aggregate?: string;
  }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/website/websites/${websiteId}/checkpoints/${checkpointId}/data`,
      undefined,
      params,
    );
  }

  async getWebsiteGraphData(websiteId: number, checkpointId: number, graphName: string, params?: {
    start?: number;
    end?: number;
    format?: string;
  }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/website/websites/${websiteId}/checkpoints/${checkpointId}/graphs/${encodeURIComponent(graphName)}/data`,
      undefined,
      params,
    );
  }

  // Website Groups
  async listWebsiteGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/website/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/website/groups', undefined, cleanedParams);
  }

  async getWebsiteGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/website/groups/${groupId}`, undefined, params);
  }

  // Users
  async listUsers(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/admins', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/admins', undefined, cleanedParams);
  }

  async getUser(userId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/admins/${userId}`, undefined, params);
  }

  // Roles
  async listRoles(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/roles', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/roles', undefined, cleanedParams);
  }

  async getRole(roleId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/roles/${roleId}`, undefined, params);
  }

  // API Tokens
  async listApiTokens(userId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/setting/admins/${userId}/apitokens`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/setting/admins/${userId}/apitokens`, undefined, cleanedParams);
  }

  // SDT (Scheduled Down Time)
  async listSDTs(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/sdt/sdts', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/sdt/sdts', undefined, cleanedParams);
  }

  async getSDT(sdtId: string, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/sdt/sdts/${sdtId}`, undefined, params);
  }

  async createDeviceSDT(sdt: any) {
    return this.request<LMResponse<any>>('POST', '/sdt/sdts', sdt);
  }

  async createSDT(sdt: any) {
    return this.request<LMResponse<any>>('POST', '/sdt/sdts', sdt);
  }

  async updateSDT(sdtId: string, sdt: any) {
    return this.request<LMResponse<any>>('PATCH', `/sdt/sdts/${sdtId}`, sdt);
  }

  async deleteSDT(sdtId: string) {
    return this.request<LMResponse<any>>('DELETE', `/sdt/sdts/${sdtId}`);
  }

  // ConfigSources
  async listConfigSources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/configsources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/configsources', undefined, cleanedParams);
  }

  async getConfigSource(configSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/configsources/${configSourceId}`, undefined, params);
  }

  async createConfigSource(configSource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/configsources', configSource);
  }

  async updateConfigSource(configSourceId: number, configSource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/configsources/${configSourceId}`,
      configSource,
      params,
    );
  }

  async deleteConfigSource(configSourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/configsources/${configSourceId}`);
  }

  async importConfigSource(content: string, format: 'json' | 'xml', params?: {
    handleConflict?: string;
    fieldsToPreserve?: string;
  }) {
    const isJson = format === 'json';
    const path = isJson ? '/setting/configsources/importjson' : '/setting/configsources/importxml';
    const queryParams: Record<string, string | number | boolean> = {};
    if (isJson) {
      if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
      if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    }
    return this.requestMultipart<LMResponse<any>>(
      path,
      content,
      isJson ? 'configsource.json' : 'configsource.xml',
      isJson ? 'application/json' : 'text/xml',
      queryParams,
    );
  }

  // Device Properties
  async listDeviceProperties(deviceId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/devices/${deviceId}/properties`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/properties`, undefined, cleanedParams);
  }

  async updateDeviceProperty(deviceId: number, propertyName: string, value: string) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}/properties/${propertyName}`, {
      value,
    });
  }

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

  // Access Groups
  async listAccessGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/accessgroup', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/accessgroup', undefined, cleanedParams);
  }

  async getAccessGroup(accessGroupId: number, params?: {
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params || {});
    return this.request<LMResponse<any>>('GET', `/setting/accessgroup/${accessGroupId}`, undefined, cleanedParams);
  }

  async createAccessGroup(data: {
    name: string;
    description: string;
    tenantId?: number;
  }) {
    return this.request<LMResponse<any>>('POST', '/setting/accessgroup', data);
  }

  async updateAccessGroup(accessGroupId: number, data: {
    name?: string;
    description?: string;
    tenantId?: number;
  }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/accessgroup/${accessGroupId}`, data);
  }

  async deleteAccessGroup(accessGroupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/accessgroup/${accessGroupId}`);
  }

  // Device DataSources
  async listDeviceDataSources(deviceId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/devices/${deviceId}/devicedatasources`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/devices/${deviceId}/devicedatasources`, undefined, cleanedParams);
  }

  async getDeviceDataSource(deviceId: number, deviceDataSourceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}`, undefined, params);
  }

  async updateDeviceDataSource(deviceId: number, deviceDataSourceId: number, data: any) {
    return this.request<LMResponse<any>>('PATCH', `/device/devices/${deviceId}/devicedatasources/${deviceDataSourceId}`, data);
  }

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

  // Property Rules (PropertySources)
  async listPropertyRules(params?: {
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
      return this.paginateAll<any>('/setting/propertyrules', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/propertyrules', undefined, cleanedParams);
  }

  async getPropertyRule(propertyRuleId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/propertyrules/${propertyRuleId}`, undefined, this.cleanParams(params || {}));
  }

  async createPropertyRule(propertyRule: any) {
    return this.request<LMResponse<any>>('POST', '/setting/propertyrules', propertyRule);
  }

  async updatePropertyRule(propertyRuleId: number, propertyRule: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/propertyrules/${propertyRuleId}`,
      propertyRule,
      this.cleanParams(params || {}),
    );
  }

  async deletePropertyRule(propertyRuleId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/propertyrules/${propertyRuleId}`);
  }

  async importPropertyRule(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/propertyrules/importjson',
      content,
      'propertysource.json',
      'application/json',
      queryParams,
    );
  }

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

  // Services
  async listServices(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/service/services', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/service/services', undefined, cleanedParams);
  }

  async getService(serviceId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/service/services/${serviceId}`, undefined, params);
  }

  async createService(service: any) {
    return this.request<LMResponse<any>>('POST', '/service/services', service);
  }

  async updateService(serviceId: number, service: any) {
    return this.request<LMResponse<any>>('PATCH', `/service/services/${serviceId}`, service);
  }

  async deleteService(serviceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/service/services/${serviceId}`);
  }

  // Service Groups
  async listServiceGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/service/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/service/groups', undefined, cleanedParams);
  }

  async getServiceGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/service/groups/${groupId}`, undefined, params);
  }

  async createServiceGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/service/groups', group);
  }

  async updateServiceGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/service/groups/${groupId}`, group);
  }

  async deleteServiceGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/service/groups/${groupId}`);
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

  // Collector Groups
  async listCollectorGroups(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/collector/groups', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/collector/groups', undefined, cleanedParams);
  }

  async getCollectorGroup(groupId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/collector/groups/${groupId}`, undefined, params);
  }

  // Device Group Properties
  async listDeviceGroupProperties(groupId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>(`/device/groups/${groupId}/properties`, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', `/device/groups/${groupId}/properties`, undefined, cleanedParams);
  }

  async updateDeviceGroupProperty(groupId: number, propertyName: string, value: string) {
    return this.request<LMResponse<any>>('PATCH', `/device/groups/${groupId}/properties/${propertyName}`, {
      value,
    });
  }

  // Netscans
  async listNetscans(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/setting/netscans', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/netscans', undefined, cleanedParams);
  }

  async getNetscan(netscanId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/netscans/${netscanId}`, undefined, params);
  }

  async createNetscan(netscan: any) {
    return this.request<LMResponse<any>>('POST', '/setting/netscans', netscan);
  }

  async updateNetscan(netscanId: number, netscan: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/netscans/${netscanId}`, netscan);
  }

  async deleteNetscan(netscanId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/netscans/${netscanId}`);
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

  // Website Checkpoints
  async listWebsiteCheckpoints(params?: { fields?: string }) {
    return this.request<LMListResponse<any>>('GET', '/website/smcheckpoints', undefined, params);
  }

  // Topology
  async getTopology(params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', '/topology', undefined, params);
  }

  // Collector Versions
  async listCollectorVersions(params?: {
    size?: number;
    offset?: number;
    fields?: string;
  }) {
    return this.request<LMListResponse<any>>('GET', '/setting/collector/collectors/versions', undefined, params);
  }

  // Cost Optimization Recommendations
  async listCostOptimizationRecommendations(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params);
    return this.request<LMListResponse<any>>('GET', '/cost-optimization/recommendations', undefined, cleanedParams);
  }

  async getCostOptimizationRecommendation(id: string, params?: { fields?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/cost-optimization/recommendations/${encodeURIComponent(id)}`,
      undefined,
      params,
    );
  }

  async listCostOptimizationRecommendationCategories(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params);
    return this.request<LMListResponse<any>>(
      'GET',
      '/cost-optimization/recommendations/categories',
      undefined,
      cleanedParams,
    );
  }

  // Dashboard Widgets
  async listWidgets(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);

    if (autoPaginate) {
      return this.paginateAll<any>('/dashboard/widgets', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/dashboard/widgets', undefined, cleanedParams);
  }

  async listDashboardWidgets(dashboardId: number, params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    const path = `/dashboard/dashboards/${dashboardId}/widgets`;

    if (autoPaginate) {
      return this.paginateAll<any>(path, cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', path, undefined, cleanedParams);
  }

  async getWidget(widgetId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/dashboard/widgets/${widgetId}`, undefined, params);
  }

  async getWidgetData(widgetId: number, params?: {
    start?: number;
    end?: number;
    format?: string;
  }) {
    return this.request<LMResponse<any>>('GET', `/dashboard/widgets/${widgetId}/data`, undefined, params);
  }

  async createWidget(widget: any) {
    return this.request<LMResponse<any>>('POST', '/dashboard/widgets', widget);
  }

  async updateWidget(widgetId: number, widget: any) {
    return this.request<LMResponse<any>>('PATCH', `/dashboard/widgets/${widgetId}`, widget);
  }

  async deleteWidget(widgetId: number) {
    return this.request<LMResponse<any>>('DELETE', `/dashboard/widgets/${widgetId}`);
  }
}
