import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class LogicmodulesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // AppliesTo Functions
        case 'list_applies_to_functions':
          return await this.client.listAppliesToFunctions({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_applies_to_function':
          return await this.client.getAppliesToFunction(args.functionId, {
            fields: args.fields,
          });

        case 'create_applies_to_function': {
          const { config, ...rest } = args;
          return await this.client.createAppliesToFunction({ ...rest, ...(config || {}) });
        }

        case 'update_applies_to_function': {
          const { functionId, reason, ignoreReference, config, ...rest } = args;
          return await this.client.updateAppliesToFunction(
            functionId,
            { ...rest, ...(config || {}) },
            { reason, ignoreReference },
          );
        }

        case 'delete_applies_to_function':
          return await this.client.deleteAppliesToFunction(args.functionId, {
            ignoreReference: args.ignoreReference,
          });

        case 'import_applies_to_function':
          return await this.client.importAppliesToFunction(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // SNMP OIDs
        case 'list_oids':
          return await this.client.listOIDs({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_oid':
          return await this.client.getOID(args.oidId, {
            fields: args.fields,
          });

        case 'create_oid': {
          const { config, ...rest } = args;
          return await this.client.createOID({ ...rest, ...(config || {}) });
        }

        case 'update_oid': {
          const { oidId, config, ...rest } = args;
          return await this.client.updateOID(oidId, { ...rest, ...(config || {}) });
        }

        case 'delete_oid':
          return await this.client.deleteOID(args.oidId);

        case 'import_oid':
          return await this.client.importOID(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        // LogicModule metadata
        case 'get_logicmodule_metadata':
          return await this.client.getLogicModuleMetadata({ fields: args.fields });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
