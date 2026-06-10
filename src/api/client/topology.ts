import { BaseClient, LMResponse, LMListResponse } from './base-client.js';

export class TopologyClient extends BaseClient {
  // TopologySources
  async listTopologySources(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/setting/topologysources', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/setting/topologysources', undefined, cleanedParams);
  }

  async getTopologySource(topologySourceId: number, params?: { format?: string; fields?: string }) {
    return this.request<LMResponse<any>>('GET', `/setting/topologysources/${topologySourceId}`, undefined, this.cleanParams(params || {}));
  }

  async createTopologySource(topologySource: any) {
    return this.request<LMResponse<any>>('POST', '/setting/topologysources', topologySource);
  }

  async updateTopologySource(topologySourceId: number, topologySource: any, params?: { reason?: string }) {
    return this.request<LMResponse<any>>('PATCH', `/setting/topologysources/${topologySourceId}`, topologySource, this.cleanParams(params || {}));
  }

  async deleteTopologySource(topologySourceId: number) {
    return this.request<LMResponse<any>>('DELETE', `/setting/topologysources/${topologySourceId}`);
  }

  async importTopologySource(content: string, params?: { handleConflict?: string; fieldsToPreserve?: string }) {
    const queryParams: Record<string, string | number | boolean> = {};
    if (params?.handleConflict) queryParams.handleConflict = params.handleConflict;
    if (params?.fieldsToPreserve) queryParams.fieldsToPreserve = params.fieldsToPreserve;
    return this.requestMultipart<LMResponse<any>>(
      '/setting/topologysources/importjson',
      content,
      'topologysource.json',
      'application/json',
      queryParams,
    );
  }

  // Topology maps (dynamically generated topology data)
  //
  // NOTE: The topology *data* endpoints live under `/topology/topologies/*` and
  // are served by the santaba REST API with `X-Version: 3` (already sent by the
  // base client). They are not published in the v3 Swagger spec, which only
  // documents TopologySource management under `/setting/topologysources`. The old
  // `GET /topology` path used here previously does not exist and returned HTTP 404.

  /** List available topology maps (paginated). Use to discover a map `id`. */
  async listTopologies(params?: {
    size?: number;
    offset?: number;
    filter?: string;
    fields?: string;
    autoPaginate?: boolean;
  }) {
    const { autoPaginate = false, ...otherParams } = params || {};
    const cleanedParams = this.cleanParams(otherParams);
    if (autoPaginate) {
      return this.paginateAll<any>('/topology/topologies', cleanedParams);
    }
    return this.request<LMListResponse<any>>('GET', '/topology/topologies', undefined, cleanedParams);
  }

  /** Get the vertex/edge data for a specific topology map by its ID. */
  async getTopology(topologyId: number, params?: { fields?: string }) {
    return this.request<LMResponse<any>>(
      'GET',
      `/topology/topologies/${topologyId}/data`,
      undefined,
      this.cleanParams(params || {}),
    );
  }
}
