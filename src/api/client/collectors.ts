import { BaseClient, LMResponse, LMListResponse } from './base-client.js';
import { LogicMonitorApiError } from '../../utils/core/lm-error.js';

const VALID_OS_AND_ARCH = ['linux64', 'linux32', 'win64', 'win32'];

/**
 * Normalize a user-supplied OS/architecture string to the token the LM installer
 * endpoint expects (e.g. "Windows64" -> "win64", "Linux 64" -> "linux64").
 * Unknown values are passed through unchanged so the API can validate them.
 */
function normalizeOsAndArch(osAndArch: string): string {
  const compact = osAndArch.toLowerCase().replace(/[\s_-]/g, '');
  const bits = compact.includes('32') ? '32' : compact.includes('64') ? '64' : '';
  if ((compact.startsWith('win') || compact.startsWith('windows')) && bits) {
    return `win${bits}`;
  }
  if (compact.startsWith('linux') && bits) {
    return `linux${bits}`;
  }
  return osAndArch;
}

export class CollectorsClient extends BaseClient {
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
    if (osAndArch === undefined || osAndArch === null || String(osAndArch).trim() === '') {
      throw new LogicMonitorApiError(
        `Missing required "osAndArch" parameter. Provide the OS and architecture for the installer, e.g. one of: ${VALID_OS_AND_ARCH.join(', ')}.`,
        {
          status: 400,
          path: `/setting/collector/collectors/${collectorId}/installers/{osAndArch}`,
          errorMessage: 'osAndArch is required (e.g. linux64, win64).',
        },
      );
    }

    osAndArch = normalizeOsAndArch(String(osAndArch));
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

  // Collector Debug Commands
  async executeDebugCommand(collectorId: number, cmdline: string) {
    return this.request<LMResponse<any>>('POST', '/debug', { cmdline }, this.cleanParams({ collectorId }));
  }

  async getDebugCommandResult(sessionId: string, collectorId: number) {
    return this.request<LMResponse<any>>(
      'GET',
      `/debug/${encodeURIComponent(sessionId)}`,
      undefined,
      this.cleanParams({ collectorId }),
    );
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

  async createCollectorGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/setting/collector/groups', group);
  }

  async updateCollectorGroup(groupId: number, group: any, params?: {
    autoBalanceMonitoredDevices?: boolean;
    forceUpdateFailedOverDevices?: boolean;
    opType?: string;
  }) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/collector/groups/${groupId}`,
      group,
      this.cleanParams(params || {}),
    );
  }

  async deleteCollectorGroup(groupId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/collector/groups/${groupId}`);
  }

  async listCollectorAgentLogLevels(collectorId: number) {
    return this.request<LMResponse<any>>('GET', `/setting/collector/collectors/${collectorId}/agentloglevels`);
  }

  async getCollectorAgentLogLevel(collectorId: number, component: string) {
    return this.request<LMResponse<any>>(
      'GET',
      `/setting/collector/collectors/${collectorId}/agentloglevels/${encodeURIComponent(component)}`,
    );
  }

  async updateCollectorAgentLogLevel(collectorId: number, component: string, body: any) {
    return this.request<LMResponse<any>>(
      'PATCH',
      `/setting/collector/collectors/${collectorId}/agentloglevels/${encodeURIComponent(component)}`,
      body,
    );
  }

  async getCollectorEvents(collectorId: number) {
    return this.request<LMResponse<any>>('GET', `/setting/collector/collectors/${collectorId}/events`);
  }

  async getCollectorStatusCheck(collectorId: number) {
    return this.request<LMResponse<any>>(
      'GET',
      `/setting/collector/collectors/${collectorId}/services/getStatusCheck`,
    );
  }

  // Collector Versions
  async listCollectorVersions(params?: {
    size?: number;
    offset?: number;
    fields?: string;
  }) {
    return this.request<LMListResponse<any>>('GET', '/setting/collector/collectors/versions', undefined, params);
  }
}
