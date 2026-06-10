import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const costOptimizationToolHandlers: ToolHandlerMap = {
  'list_cost_recommendations': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listCostOptimizationRecommendations({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },

  'get_cost_recommendation': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getCostOptimizationRecommendation(args.id, {
      fields: args.fields,
    });
  },

  'list_cost_recommendation_categories': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listCostOptimizationRecommendationCategories({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
    });
  },
};
