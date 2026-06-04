import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_SDT_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class SdtHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // SDTs
        case 'list_sdts': {
          const result = await this.client.listSDTs({
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
        }

        case 'get_sdt':
          return await this.client.getSDT(args.sdtId, {
            fields: args.fields,
          });

        case 'create_resource_sdt': {
          const sdt: any = {
            sdtType: 1, // Device SDT
            deviceId: args.deviceId,
            type: args.type,
            startDateTime: args.startDateTime,
            endDateTime: args.endDateTime,
          };
          if (args.comment) sdt.comment = args.comment;
          return await this.client.createDeviceSDT(sdt);
        }

        case 'create_sdt': {
          const { config, ...rest } = args;
          const sdt = { ...rest, ...(config || {}) };
          return await this.client.createSDT(sdt);
        }

        case 'update_sdt': {
          const { sdtId, config, ...rest } = args;
          const sdt = { ...rest, ...(config || {}) };
          return await this.client.updateSDT(sdtId, sdt);
        }

        case 'delete_sdt':
          return await this.client.deleteSDT(args.sdtId);

        // SDT history
        case 'get_resource_sdt_history':
          return await this.client.getDeviceSDTHistory(args.deviceId, {
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
          });

        case 'get_resource_datasource_sdt_history':
          return await this.client.getDeviceDataSourceSDTHistory(
            args.deviceId,
            args.deviceDataSourceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );

        case 'get_instance_sdt_history':
          return await this.client.getDeviceInstanceSDTHistory(
            args.deviceId,
            args.deviceDataSourceId,
            args.instanceId,
            { size: args.size, offset: args.offset, filter: args.filter, fields: args.fields },
          );
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
