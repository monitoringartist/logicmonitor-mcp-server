import { BaseClient, LMResponse, LMListResponse } from './base-client.js';
import { LogicMonitorApiError } from '../../utils/core/lm-error.js';
import type { LogicMonitorClient } from './index.js';

export class DashboardsClient extends BaseClient {
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
  async generateResourceLink(deviceId: number): Promise<{ url: string; device: any }> {
    // Get device details to verify it exists
    const device = await (this as unknown as LogicMonitorClient).getDevice(deviceId, { fields: 'id,displayName,name' });

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

    // Construct the full URL.
    // Format: {portal}/santaba/uiv4/resources/treeNodes/t-d,id-{deviceId}?source=details
    // where "t-d" denotes the tree-node type (device) and "id-{deviceId}" the resource id.
    const baseUrl = this.baseUrl.replace('/santaba/rest', '');
    const url = `${baseUrl}/santaba/uiv4/resources/treeNodes/t-d,id-${deviceId}?source=details`;

    return {
      url,
      device,
    };
  }

  /**
   * Generate a link URL for an alert
   * The URL follows the pattern: https://{company}.logicmonitor.com/santaba/uiv4/alerts/{alertId}
   */
  async generateAlertLink(alertId: string): Promise<{ url: string; alert: any }> {
    // Get alert details to verify it exists
    const alert = await (this as unknown as LogicMonitorClient).getAlert(alertId, { fields: 'id,internalId,type,severity,monitorObjectName' });

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
    const website = await (this as unknown as LogicMonitorClient).getWebsite(websiteId, { fields: 'id,name,groupId' });

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
        const group = await (this as unknown as LogicMonitorClient).getWebsiteGroup(currentGroupId, { fields: 'id,name,parentId' });
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

  async createDashboardGroup(group: any) {
    return this.request<LMResponse<any>>('POST', '/dashboard/groups', group);
  }

  async updateDashboardGroup(groupId: number, group: any) {
    return this.request<LMResponse<any>>('PATCH', `/dashboard/groups/${groupId}`, group);
  }

  async deleteDashboardGroup(groupId: number, params?: { allowNonEmptyGroup?: boolean }) {
    return this.request<LMResponse<any>>('DELETE', `/dashboard/groups/${groupId}`, undefined, this.cleanParams(params || {}));
  }

  async cloneDashboardGroup(groupId: number, group: any, params?: { recursive?: boolean }) {
    return this.request<LMResponse<any>>(
      'POST',
      `/dashboard/groups/${groupId}/asyncclone`,
      group,
      this.cleanParams(params || {}),
    );
  }

  // Default Dashboard (user data)
  async updateDefaultDashboard(userDataId: string, body: any) {
    return this.request<LMResponse<any>>('PATCH', `/setting/userdata/${encodeURIComponent(userDataId)}`, body);
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
