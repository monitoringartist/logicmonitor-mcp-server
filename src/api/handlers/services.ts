import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const servicesToolHandlers: ToolHandlerMap = {
  'list_services': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listServices({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_service': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getService(args.serviceId, {
      fields: args.fields,
    });
  },

  'create_service': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const service: any = {
      name: args.name,
      type: args.type || 'default',
    };
    if (args.description) service.description = args.description;
    if (args.groupId) service.groupId = args.groupId;
    return await client.createService(service);
  },

  'update_service': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const service: any = {};
    if (args.name) service.name = args.name;
    if (args.description !== undefined) service.description = args.description;
    return await client.updateService(args.serviceId, service);
  },

  'delete_service': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteService(args.serviceId);
  },

  'list_service_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listServiceGroups({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_service_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getServiceGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_service_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {
      name: args.name,
    };
    if (args.description) group.description = args.description;
    if (args.parentId) group.parentId = args.parentId;
    return await client.createServiceGroup(group);
  },

  'update_service_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {};
    if (args.name) group.name = args.name;
    if (args.description !== undefined) group.description = args.description;
    return await client.updateServiceGroup(args.groupId, group);
  },

  'delete_service_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteServiceGroup(args.groupId);
  },
};
