import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class CostOptimizationClient extends BaseClient {
  // Cost Optimization Recommendations
  async listCostOptimizationRecommendations(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params);
    return this.request<LMListResponse<any>>('GET', '/cost-optimization/recommendations', undefined, cleanedParams);
  }

  async getCostOptimizationRecommendation(id: string, params?: { fields?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/cost-optimization/recommendations/${encodeURIComponent(id)}`,
      undefined,
      params,
    );
  }

  async listCostOptimizationRecommendationCategories(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
  }) {
    const cleanedParams = this.cleanParams(params);
    return this.request<LMListResponse<any>>(
      'GET',
      '/cost-optimization/recommendations/categories',
      undefined,
      cleanedParams,
    );
  }
}
