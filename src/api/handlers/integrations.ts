import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const integrationsToolHandlers: ToolHandlerMap = {
  'get_integration_audit_logs': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getIntegrationAuditLogs({ format: args.format });
  },

  'list_integrations': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listIntegrations({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_integration': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getIntegration(args.integrationId, {
      fields: args.fields,
    });
  },

  'create_integration': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const integration: any = {
      name: args.name,
      type: args.type,
    };
    if (args.url) integration.url = args.url;
    if (args.extra) integration.extra = args.extra;
    return await client.createIntegration(integration);
  },

  'update_integration': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const integration: any = {};
    if (args.name) integration.name = args.name;
    if (args.url) integration.url = args.url;
    if (args.extra) integration.extra = args.extra;
    return await client.updateIntegration(args.integrationId, integration);
  },

  'delete_integration': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteIntegration(args.integrationId);
  },
};
