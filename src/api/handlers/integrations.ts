import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class IntegrationsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Integration audit logs
        case 'get_integration_audit_logs':
          return await this.client.getIntegrationAuditLogs({ format: args.format });

        // Integrations
        case 'list_integrations':
          return await this.client.listIntegrations({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_integration':
          return await this.client.getIntegration(args.integrationId, {
            fields: args.fields,
          });

        case 'create_integration': {
          const integration: any = {
            name: args.name,
            type: args.type,
          };
          if (args.url) integration.url = args.url;
          if (args.extra) integration.extra = args.extra;
          return await this.client.createIntegration(integration);
        }

        case 'update_integration': {
          const integration: any = {};
          if (args.name) integration.name = args.name;
          if (args.url) integration.url = args.url;
          if (args.extra) integration.extra = args.extra;
          return await this.client.updateIntegration(args.integrationId, integration);
        }

        case 'delete_integration':
          return await this.client.deleteIntegration(args.integrationId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
