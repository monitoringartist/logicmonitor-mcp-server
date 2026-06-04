import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_ACCESS_GROUP_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class AccessGroupsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Access Groups
        case 'list_access_groups': {
          const result = await this.client.listAccessGroups({
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
            items: result.items.map((accessGroup: any) =>
              filterFields(accessGroup, DEFAULT_ACCESS_GROUP_FIELDS),
            ),
          };
        }

        case 'get_access_group':
          return await this.client.getAccessGroup(args.accessGroupId, {
            fields: args.fields,
          });

        case 'create_access_group': {
          const data: any = {
            name: args.name,
            description: args.description,
          };
          if (args.tenantId !== undefined) data.tenantId = args.tenantId;
          return await this.client.createAccessGroup(data);
        }

        case 'update_access_group': {
          const data: any = {};
          if (args.name !== undefined) data.name = args.name;
          if (args.description !== undefined) data.description = args.description;
          if (args.tenantId !== undefined) data.tenantId = args.tenantId;
          return await this.client.updateAccessGroup(args.accessGroupId, data);
        }

        case 'delete_access_group':
          return await this.client.deleteAccessGroup(args.accessGroupId);

        // Access group module mapping
        case 'map_unmap_module_to_access_group':
          return await this.client.mapUnmapModuleToAccessGroup(args.config || {});
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
