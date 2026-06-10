import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const miscToolHandlers: ToolHandlerMap = {
  'get_contract_info': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getContractInfo({ fields: args.fields });
  },

  'add_dns_mapping': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.addDNSMapping(args.config || {});
  },
};
