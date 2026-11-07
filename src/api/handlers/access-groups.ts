import { filterFields, DEFAULT_ACCESS_GROUP_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const accessGroupsToolHandlers: ToolHandlerMap = {
  'list_access_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listAccessGroups({
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
  },

  'get_access_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getAccessGroup(args.accessGroupId, {
      fields: args.fields,
    });
  },

  'create_access_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const data: any = {
      name: args.name,
      description: args.description,
    };
    if (args.tenantId !== undefined) data.tenantId = args.tenantId;
    return await client.createAccessGroup(data);
  },

  'update_access_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const data: any = {};
    if (args.name !== undefined) data.name = args.name;
    if (args.description !== undefined) data.description = args.description;
    if (args.tenantId !== undefined) data.tenantId = args.tenantId;
    return await client.updateAccessGroup(args.accessGroupId, data);
  },

  'delete_access_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteAccessGroup(args.accessGroupId);
  },

  'map_unmap_module_to_access_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.mapUnmapModuleToAccessGroup(args.config || {});
  },
};
