import { filterFields, DEFAULT_DASHBOARD_FIELDS, DEFAULT_DASHBOARD_GROUP_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const dashboardsToolHandlers: ToolHandlerMap = {
  'list_dashboards': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listDashboards({
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
  },

  'get_dashboard': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDashboard(args.dashboardId, {
      fields: args.fields,
    });
  },

  'create_dashboard': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const dashboard: any = {
      name: args.name,
    };
    if (args.description) dashboard.description = args.description;
    if (args.groupId) dashboard.groupId = args.groupId;
    if (args.widgetsConfig) dashboard.widgetsConfig = args.widgetsConfig;
    return await client.createDashboard(dashboard);
  },

  'update_dashboard': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { dashboardId, ...dashboardData } = args;
    return await client.updateDashboard(dashboardId, dashboardData);
  },

  'delete_dashboard': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDashboard(args.dashboardId);
  },

  'generate_dashboard_link': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.generateDashboardLink(args.dashboardId);
  },

  'generate_resource_link': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.generateResourceLink(args.deviceId);
  },

  'generate_alert_link': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.generateAlertLink(args.alertId);
  },

  'generate_website_link': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.generateWebsiteLink(args.websiteId);
  },

  'list_dashboard_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listDashboardGroups({
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
  },

  'get_dashboard_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDashboardGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_dashboard_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createDashboardGroup({ ...rest, ...(config || {}) });
  },

  'update_dashboard_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, config, ...rest } = args;
    return await client.updateDashboardGroup(groupId, { ...rest, ...(config || {}) });
  },

  'delete_dashboard_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDashboardGroup(args.groupId, {
      allowNonEmptyGroup: args.allowNonEmptyGroup,
    });
  },

  'clone_dashboard_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.cloneDashboardGroup(args.groupId, args.config || {}, {
      recursive: args.recursive,
    });
  },

  'update_default_dashboard': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { userDataId, config, ...rest } = args;
    return await client.updateDefaultDashboard(userDataId, { ...rest, ...(config || {}) });
  },

  'list_widgets': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listWidgets({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'list_dashboard_widgets': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDashboardWidgets(args.dashboardId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_widget': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWidget(args.widgetId, {
      fields: args.fields,
    });
  },

  'get_widget_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWidgetData(args.widgetId, {
      start: args.start,
      end: args.end,
      format: args.format,
    });
  },

  'create_widget': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const widget = { ...rest, ...(config || {}) };
    return await client.createWidget(widget);
  },

  'update_widget': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { widgetId, config, ...rest } = args;
    const widget = { ...rest, ...(config || {}) };
    return await client.updateWidget(widgetId, widget);
  },

  'delete_widget': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteWidget(args.widgetId);
  },
};
