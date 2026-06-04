import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const netscansToolHandlers: ToolHandlerMap = {
  'list_netscans': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listNetscans({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_netscan': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getNetscan(args.netscanId, {
      fields: args.fields,
    });
  },

  'create_netscan': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const netscan: any = {
      name: args.name,
      collectorId: args.collectorId,
      schedule: args.schedule || { cron: '0 0 * * *' },
    };
    if (args.description) netscan.description = args.description;
    if (args.excludeDuplicateType) netscan.excludeDuplicateType = args.excludeDuplicateType;
    if (args.subnet) netscan.subnet = args.subnet;
    return await client.createNetscan(netscan);
  },

  'update_netscan': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const netscan: any = {};
    if (args.name) netscan.name = args.name;
    if (args.description !== undefined) netscan.description = args.description;
    if (args.schedule) netscan.schedule = args.schedule;
    return await client.updateNetscan(args.netscanId, netscan);
  },

  'delete_netscan': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteNetscan(args.netscanId);
  },
};
