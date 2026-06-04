import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_DASHBOARD_FIELDS, DEFAULT_DASHBOARD_GROUP_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class DashboardsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Dashboards
        case 'list_dashboards': {
          const result = await this.client.listDashboards({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((dashboard: any) =>
              filterFields(dashboard, DEFAULT_DASHBOARD_FIELDS),
            ),
          };
        }

        case 'get_dashboard':
          return await this.client.getDashboard(args.dashboardId, {
            fields: args.fields,
          });

        case 'create_dashboard': {
          const dashboard: any = {
            name: args.name,
          };
          if (args.description) dashboard.description = args.description;
          if (args.groupId) dashboard.groupId = args.groupId;
          if (args.widgetsConfig) dashboard.widgetsConfig = args.widgetsConfig;
          return await this.client.createDashboard(dashboard);
        }

        case 'update_dashboard': {
          const { dashboardId, ...dashboardData } = args;
          return await this.client.updateDashboard(dashboardId, dashboardData);
        }

        case 'delete_dashboard':
          return await this.client.deleteDashboard(args.dashboardId);

        case 'generate_dashboard_link':
          return await this.client.generateDashboardLink(args.dashboardId);

        case 'generate_resource_link':
          return await this.client.generateResourceLink(args.deviceId);

        case 'generate_alert_link':
          return await this.client.generateAlertLink(args.alertId);

        case 'generate_website_link':
          return await this.client.generateWebsiteLink(args.websiteId);

        // Dashboard Groups
        case 'list_dashboard_groups': {
          const result = await this.client.listDashboardGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

          if (args.fields) {
            return result;
          }

          return {
            ...result,
            items: result.items.map((group: any) =>
              filterFields(group, DEFAULT_DASHBOARD_GROUP_FIELDS),
            ),
          };
        }

        case 'get_dashboard_group':
          return await this.client.getDashboardGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_dashboard_group': {
          const { config, ...rest } = args;
          return await this.client.createDashboardGroup({ ...rest, ...(config || {}) });
        }

        case 'update_dashboard_group': {
          const { groupId, config, ...rest } = args;
          return await this.client.updateDashboardGroup(groupId, { ...rest, ...(config || {}) });
        }

        case 'delete_dashboard_group':
          return await this.client.deleteDashboardGroup(args.groupId, {
            allowNonEmptyGroup: args.allowNonEmptyGroup,
          });

        case 'clone_dashboard_group':
          return await this.client.cloneDashboardGroup(args.groupId, args.config || {}, {
            recursive: args.recursive,
          });

        // Default Dashboard
        case 'update_default_dashboard': {
          const { userDataId, config, ...rest } = args;
          return await this.client.updateDefaultDashboard(userDataId, { ...rest, ...(config || {}) });
        }

        // Dashboard Widgets
        case 'list_widgets':
          return await this.client.listWidgets({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'list_dashboard_widgets':
          return await this.client.listDashboardWidgets(args.dashboardId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_widget':
          return await this.client.getWidget(args.widgetId, {
            fields: args.fields,
          });

        case 'get_widget_data':
          return await this.client.getWidgetData(args.widgetId, {
            start: args.start,
            end: args.end,
            format: args.format,
          });

        case 'create_widget': {
          const { config, ...rest } = args;
          const widget = { ...rest, ...(config || {}) };
          return await this.client.createWidget(widget);
        }

        case 'update_widget': {
          const { widgetId, config, ...rest } = args;
          const widget = { ...rest, ...(config || {}) };
          return await this.client.updateWidget(widgetId, widget);
        }

        case 'delete_widget':
          return await this.client.deleteWidget(args.widgetId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
