import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const topologyToolHandlers: ToolHandlerMap = {
  'list_topologysources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listTopologySources({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_topologysource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getTopologySource(args.topologySourceId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_topologysource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createTopologySource({ ...rest, ...(config || {}) });
  },

  'update_topologysource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { topologySourceId, reason, config, ...rest } = args;
    return await client.updateTopologySource(topologySourceId, { ...rest, ...(config || {}) }, { reason });
  },

  'delete_topologysource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteTopologySource(args.topologySourceId);
  },

  'import_topologysource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importTopologySource(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'list_topologies': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listTopologies({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_topology': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getTopology(args.topologyId, {
      fields: args.fields,
    });
  },
};
