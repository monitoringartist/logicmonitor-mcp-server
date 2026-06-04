import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class EscalationHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Escalation Chains
        case 'list_escalation_chains':
          return await this.client.listEscalationChains({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_escalation_chain':
          return await this.client.getEscalationChain(args.chainId, {
            fields: args.fields,
          });

        case 'create_escalation_chain': {
          const chain: any = {
            name: args.name,
            description: args.description || '',
          };
          if (args.stages) chain.stages = args.stages;
          return await this.client.createEscalationChain(chain);
        }

        case 'update_escalation_chain': {
          const chain: any = {};
          if (args.name) chain.name = args.name;
          if (args.description !== undefined) chain.description = args.description;
          if (args.stages) chain.stages = args.stages;
          return await this.client.updateEscalationChain(args.chainId, chain);
        }

        case 'delete_escalation_chain':
          return await this.client.deleteEscalationChain(args.chainId);

        // Recipients
        case 'list_recipients':
          return await this.client.listRecipients({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_recipient':
          return await this.client.getRecipient(args.recipientId, {
            fields: args.fields,
          });

        case 'create_recipient': {
          const recipient: any = {
            type: args.type,
            addr: args.addr,
          };
          if (args.name) recipient.name = args.name;
          if (args.method) recipient.method = args.method;
          return await this.client.createRecipient(recipient);
        }

        case 'update_recipient': {
          const recipient: any = {};
          if (args.name) recipient.name = args.name;
          if (args.addr) recipient.addr = args.addr;
          if (args.method) recipient.method = args.method;
          return await this.client.updateRecipient(args.recipientId, recipient);
        }

        case 'delete_recipient':
          return await this.client.deleteRecipient(args.recipientId);

        // Recipient Groups
        case 'list_recipient_groups':
          return await this.client.listRecipientGroups({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_recipient_group':
          return await this.client.getRecipientGroup(args.groupId, {
            fields: args.fields,
          });

        case 'create_recipient_group': {
          const group: any = {
            name: args.name,
          };
          if (args.description) group.description = args.description;
          if (args.recipientIds) group.recipientIds = args.recipientIds;
          return await this.client.createRecipientGroup(group);
        }

        case 'update_recipient_group': {
          const group: any = {};
          if (args.name) group.name = args.name;
          if (args.description !== undefined) group.description = args.description;
          if (args.recipientIds) group.recipientIds = args.recipientIds;
          return await this.client.updateRecipientGroup(args.groupId, group);
        }

        case 'delete_recipient_group':
          return await this.client.deleteRecipientGroup(args.groupId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
