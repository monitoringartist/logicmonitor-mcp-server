import { filterFields, DEFAULT_CONFIGSOURCE_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const configsourcesToolHandlers: ToolHandlerMap = {
  'list_configsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listConfigSources({
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
      items: result.items.map((configsource: any) =>
        filterFields(configsource, DEFAULT_CONFIGSOURCE_FIELDS),
      ),
    };
  },

  'get_configsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getConfigSource(args.configSourceId, {
      fields: args.fields,
    });
  },

  'create_configsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const configSource = { ...rest, ...(config || {}) };
    return await client.createConfigSource(configSource);
  },

  'update_configsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { configSourceId, reason, config, ...rest } = args;
    const configSource = { ...rest, ...(config || {}) };
    return await client.updateConfigSource(configSourceId, configSource, { reason });
  },

  'delete_configsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteConfigSource(args.configSourceId);
  },

  'import_configsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importConfigSource(args.content, args.format, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'get_configsource_update_reasons': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getConfigSourceUpdateReasons(args.configSourceId, {
      size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
    });
  },
};
