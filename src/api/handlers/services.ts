import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class ServicesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Services
        case 'list_services':
          return await this.client.listServices({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_service':
          return await this.client.getService(args.serviceId, {
            fields: args.fields,
          });

        case 'create_service': {
          const service: any = {
            name: args.name,
            type: args.type || 'default',
          };
          if (args.description) service.description = args.description;
          if (args.groupId) service.groupId = args.groupId;
          return await this.client.createService(service);
        }

        case 'update_service': {
          const service: any = {};
          if (args.name) service.name = args.name;
          if (args.description !== undefined) service.description = args.description;
          return await this.client.updateService(args.serviceId, service);
        }

        case 'delete_service':
          return await this.client.deleteService(args.serviceId);

        // Service Groups
        case 'list_service_groups':
          return await this.client.listServiceGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_service_group':
          return await this.client.getServiceGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_service_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          if (args.parentId) group.parentId = args.parentId;
          return await this.client.createServiceGroup(group);
        }

        case 'update_service_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          return await this.client.updateServiceGroup(args.groupId, group);
        }

        case 'delete_service_group':
          return await this.client.deleteServiceGroup(args.groupId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
