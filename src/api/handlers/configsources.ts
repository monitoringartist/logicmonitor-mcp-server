import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_CONFIGSOURCE_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class ConfigsourcesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // ConfigSources
        case 'list_configsources': {
          const result = await this.client.listConfigSources({
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
            items: result.items.map((configsource: any) =>
              filterFields(configsource, DEFAULT_CONFIGSOURCE_FIELDS),
            ),
          };
        }

        case 'get_configsource':
          return await this.client.getConfigSource(args.configSourceId, {
            fields: args.fields,
          });

        case 'create_configsource': {
          const { config, ...rest } = args;
          const configSource = { ...rest, ...(config || {}) };
          return await this.client.createConfigSource(configSource);
        }

        case 'update_configsource': {
          const { configSourceId, reason, config, ...rest } = args;
          const configSource = { ...rest, ...(config || {}) };
          return await this.client.updateConfigSource(configSourceId, configSource, { reason });
        }

        case 'delete_configsource':
          return await this.client.deleteConfigSource(args.configSourceId);

        case 'import_configsource':
          return await this.client.importConfigSource(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // ConfigSource update reasons
        case 'get_configsource_update_reasons':
          return await this.client.getConfigSourceUpdateReasons(args.configSourceId, {
            size: args.size, offset: args.offset, filter: args.filter, fields: args.fields,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
