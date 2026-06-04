import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class MiscHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Contract / usage info
        case 'get_contract_info':
          return await this.client.getContractInfo({ fields: args.fields });

        // DNS mappings
        case 'add_dns_mapping':
          return await this.client.addDNSMapping(args.config || {});
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
