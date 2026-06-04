import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class CostOptimizationHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Cost Optimization Recommendations
        case 'list_cost_optimization_recommendations':
          return await this.client.listCostOptimizationRecommendations({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_cost_optimization_recommendation':
          return await this.client.getCostOptimizationRecommendation(args.id, {
            fields: args.fields,
          });

        case 'list_cost_optimization_recommendation_categories':
          return await this.client.listCostOptimizationRecommendationCategories({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
