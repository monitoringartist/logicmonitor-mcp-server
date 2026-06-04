import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class NetscansHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Netscans
        case 'list_netscans':
          return await this.client.listNetscans({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_netscan':
          return await this.client.getNetscan(args.netscanId, {
            fields: args.fields,
          });

        case 'create_netscan': {
          const netscan: any = {
            name: args.name,
            collectorId: args.collectorId,
            schedule: args.schedule || { cron: '0 0 * * *' },
          };
          if (args.description) netscan.description = args.description;
          if (args.excludeDuplicateType) netscan.excludeDuplicateType = args.excludeDuplicateType;
          if (args.subnet) netscan.subnet = args.subnet;
          return await this.client.createNetscan(netscan);
        }

        case 'update_netscan': {
          const netscan: any = {};
          if (args.name) netscan.name = args.name;
          if (args.description !== undefined) netscan.description = args.description;
          if (args.schedule) netscan.schedule = args.schedule;
          return await this.client.updateNetscan(args.netscanId, netscan);
        }

        case 'delete_netscan':
          return await this.client.deleteNetscan(args.netscanId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
