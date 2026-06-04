import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class PropertyRulesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Property Rules (PropertySources)
        case 'list_property_rules':
          return await this.client.listPropertyRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            format: args.format,
            autoPaginate: args.autoPaginate,
          });

        case 'get_property_rule':
          return await this.client.getPropertyRule(args.propertyRuleId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_property_rule':
          return await this.client.createPropertyRule(args.config || {});

        case 'update_property_rule':
          return await this.client.updatePropertyRule(args.propertyRuleId, args.config || {}, {
            reason: args.reason,
          });

        case 'delete_property_rule':
          return await this.client.deletePropertyRule(args.propertyRuleId);

        case 'import_property_rule':
          return await this.client.importPropertyRule(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
