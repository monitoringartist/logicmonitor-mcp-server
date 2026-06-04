/**
 * LogicMonitor (LM) API Client - shared base.
 *
 * Holds the authenticated request/pagination machinery shared by every domain
 * client. Domain method groups live in sibling files and are merged onto
 * `LogicMonitorClient` in `./index.ts`.
 * Documentation: https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/
 */

import { rateLimiter } from '../../utils/core/rate-limiter.js';
import { formatLogicMonitorFilter } from '../../utils/helpers/filters.js';
import { LogicMonitorApiError } from '../../utils/core/lm-error.js';

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

export class BaseClient {
  protected baseUrl: string;
  protected bearerToken: string;
  protected timeout: number;
  protected logger?: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any, requestId?: string) => void;

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
  protected cleanParams(params?: Record<string, any>): Record<string, any> {
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
  protected async request<T>(
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
  protected async requestMultipart<T>(
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
  protected async paginateAll<T>(
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
}
