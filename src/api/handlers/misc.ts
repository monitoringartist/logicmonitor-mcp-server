import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const miscToolHandlers: ToolHandlerMap = {
  'get_contract_info': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getContractInfo({ fields: args.fields });
  },

  'add_dns_mapping': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.addDNSMapping(args.config || {});
  },

  'get_focus_cost_usage': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getFocusCostUsage({
      feature: args.feature,
      dimensionKey: args.dimensionKey,
      startTime: args.startTime,
      endTime: args.endTime,
      at: args.at,
      metricQualifier: args.metricQualifier,
      usageBreakdownType: args.usageBreakdownType,
      usageBreakdownUnits: args.usageBreakdownUnits,
      sku: args.sku,
      tenantIds: args.tenantIds,
      size: args.size,
      offset: args.offset,
    });
  },
};
