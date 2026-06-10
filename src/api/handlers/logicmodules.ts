import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const logicmodulesToolHandlers: ToolHandlerMap = {
  'list_applies_to_functions': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listAppliesToFunctions({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_applies_to_function': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getAppliesToFunction(args.functionId, {
      fields: args.fields,
    });
  },

  'create_applies_to_function': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createAppliesToFunction({ ...rest, ...(config || {}) });
  },

  'update_applies_to_function': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { functionId, reason, ignoreReference, config, ...rest } = args;
    return await client.updateAppliesToFunction(
      functionId,
      { ...rest, ...(config || {}) },
      { reason, ignoreReference },
    );
  },

  'delete_applies_to_function': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteAppliesToFunction(args.functionId, {
      ignoreReference: args.ignoreReference,
    });
  },

  'import_applies_to_function': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importAppliesToFunction(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'list_oids': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listOIDs({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_oid': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getOID(args.oidId, {
      fields: args.fields,
    });
  },

  'create_oid': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createOID({ ...rest, ...(config || {}) });
  },

  'update_oid': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { oidId, config, ...rest } = args;
    return await client.updateOID(oidId, { ...rest, ...(config || {}) });
  },

  'delete_oid': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteOID(args.oidId);
  },

  'import_oid': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importOID(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'get_logicmodule_metadata': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getLogicModuleMetadata({ fields: args.fields });
  },
};
