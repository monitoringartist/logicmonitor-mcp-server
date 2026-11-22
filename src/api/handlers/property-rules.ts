import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const propertyRulesToolHandlers: ToolHandlerMap = {
  'list_property_rules': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listPropertyRules({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      format: args.format,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_property_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getPropertyRule(args.propertyRuleId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_property_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.createPropertyRule(args.config || {});
  },

  'update_property_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.updatePropertyRule(args.propertyRuleId, args.config || {}, {
      reason: args.reason,
    });
  },

  'delete_property_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deletePropertyRule(args.propertyRuleId);
  },

  'import_property_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importPropertyRule(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },
};
