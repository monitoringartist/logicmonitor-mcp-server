import { filterFields, DEFAULT_WEBSITE_FIELDS, DEFAULT_WEBSITE_GROUP_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const websitesToolHandlers: ToolHandlerMap = {
  'list_websites': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listWebsites({
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
      items: result.items.map((website: any) =>
        filterFields(website, DEFAULT_WEBSITE_FIELDS),
      ),
    };
  },

  'get_website': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsite(args.websiteId, {
      fields: args.fields,
    });
  },

  'create_website': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const website: any = {
      name: args.name,
      domain: args.domain,
      type: args.type,
    };
    if (args.description) website.description = args.description;
    if (args.checkpointId) website.checkpointId = args.checkpointId;
    return await client.createWebsite(website);
  },

  'update_website': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { websiteId, ...websiteData } = args;
    return await client.updateWebsite(websiteId, websiteData);
  },

  'delete_website': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteWebsite(args.websiteId);
  },

  'list_website_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listWebsiteGroups({
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
        filterFields(group, DEFAULT_WEBSITE_GROUP_FIELDS),
      ),
    };
  },

  'get_website_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_website_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createWebsiteGroup({ ...rest, ...(config || {}) });
  },

  'update_website_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { groupId, opType, config, ...rest } = args;
    return await client.updateWebsiteGroup(
      groupId,
      { ...rest, ...(config || {}) },
      { opType },
    );
  },

  'delete_website_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteWebsiteGroup(args.groupId, {
      deleteChildren: args.deleteChildren,
    });
  },

  'list_website_group_websites': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listWebsiteGroupWebsites(args.groupId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'list_website_group_sdts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listWebsiteGroupSDTs(args.groupId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_website_group_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteGroupSDTHistory(args.groupId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_website_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteSDTHistory(args.websiteId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields, autoPaginate: args.autoPaginate,
    });
  },

  'get_website_graph_by_name': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteGraphByName(args.websiteId, args.graphName, {
      start: args.start, end: args.end, format: args.format,
    });
  },

  'list_website_checkpoints': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listWebsiteCheckpoints({
      fields: args.fields,
    });
  },

  'get_website_checkpoint_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteCheckpointData(args.websiteId, args.checkpointId, {
      period: args.period,
      start: args.start,
      end: args.end,
      datapoints: args.datapoints,
      aggregate: args.aggregate,
      format: args.format,
    });
  },

  'get_website_graph_data': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getWebsiteGraphData(args.websiteId, args.checkpointId, args.graphName, {
      start: args.start,
      end: args.end,
      format: args.format,
    });
  },
};
