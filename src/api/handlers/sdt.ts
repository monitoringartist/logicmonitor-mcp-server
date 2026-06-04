import { filterFields, DEFAULT_SDT_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const sdtToolHandlers: ToolHandlerMap = {
  'list_sdts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const result = await client.listSDTs({
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
      items: result.items.map((sdt: any) =>
        filterFields(sdt, DEFAULT_SDT_FIELDS),
      ),
    };
  },

  'get_sdt': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getSDT(args.sdtId, {
      fields: args.fields,
    });
  },

  'create_resource_sdt': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const sdt: any = {
      sdtType: 1, // Device SDT
      deviceId: args.deviceId,
      type: args.type,
      startDateTime: args.startDateTime,
      endDateTime: args.endDateTime,
    };
    if (args.comment) sdt.comment = args.comment;
    return await client.createDeviceSDT(sdt);
  },

  'create_sdt': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const sdt = { ...rest, ...(config || {}) };
    return await client.createSDT(sdt);
  },

  'update_sdt': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { sdtId, config, ...rest } = args;
    const sdt = { ...rest, ...(config || {}) };
    return await client.updateSDT(sdtId, sdt);
  },

  'delete_sdt': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteSDT(args.sdtId);
  },

  'get_resource_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceSDTHistory(args.deviceId, {
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'get_resource_datasource_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceDataSourceSDTHistory(
      args.deviceId,
      args.deviceDataSourceId,
      { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
    );
  },

  'get_instance_sdt_history': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDeviceInstanceSDTHistory(
      args.deviceId,
      args.deviceDataSourceId,
      args.instanceId,
      { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
    );
  },
};
