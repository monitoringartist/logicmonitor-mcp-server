import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class TopologyHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // TopologySources
        case 'list_topologysources':
          return await this.client.listTopologySources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_topologysource':
          return await this.client.getTopologySource(args.topologySourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_topologysource': {
          const { config, ...rest } = args;
          return await this.client.createTopologySource({ ...rest, ...(config || {}) });
        }

        case 'update_topologysource': {
          const { topologySourceId, reason, config, ...rest } = args;
          return await this.client.updateTopologySource(topologySourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_topologysource':
          return await this.client.deleteTopologySource(args.topologySourceId);

        case 'import_topologysource':
          return await this.client.importTopologySource(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // Topology
        case 'get_topology':
          return await this.client.getTopology({
            fields: args.fields,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
