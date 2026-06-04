import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const escalationToolHandlers: ToolHandlerMap = {
  'list_escalation_chains': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listEscalationChains({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_escalation_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getEscalationChain(args.chainId, {
      fields: args.fields,
    });
  },

  'create_escalation_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const chain: any = {
      name: args.name,
      description: args.description || '',
    };
    if (args.stages) chain.stages = args.stages;
    return await client.createEscalationChain(chain);
  },

  'update_escalation_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const chain: any = {};
    if (args.name) chain.name = args.name;
    if (args.description !== undefined) chain.description = args.description;
    if (args.stages) chain.stages = args.stages;
    return await client.updateEscalationChain(args.chainId, chain);
  },

  'delete_escalation_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteEscalationChain(args.chainId);
  },

  'list_recipients': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listRecipients({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_recipient': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getRecipient(args.recipientId, {
      fields: args.fields,
    });
  },

  'create_recipient': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const recipient: any = {
      type: args.type,
      addr: args.addr,
    };
    if (args.name) recipient.name = args.name;
    if (args.method) recipient.method = args.method;
    return await client.createRecipient(recipient);
  },

  'update_recipient': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const recipient: any = {};
    if (args.name) recipient.name = args.name;
    if (args.addr) recipient.addr = args.addr;
    if (args.method) recipient.method = args.method;
    return await client.updateRecipient(args.recipientId, recipient);
  },

  'delete_recipient': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteRecipient(args.recipientId);
  },

  'list_recipient_groups': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listRecipientGroups({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_recipient_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getRecipientGroup(args.groupId, {
      fields: args.fields,
    });
  },

  'create_recipient_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {
      name: args.name,
    };
    if (args.description) group.description = args.description;
    if (args.recipientIds) group.recipientIds = args.recipientIds;
    return await client.createRecipientGroup(group);
  },

  'update_recipient_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const group: any = {};
    if (args.name) group.name = args.name;
    if (args.description !== undefined) group.description = args.description;
    if (args.recipientIds) group.recipientIds = args.recipientIds;
    return await client.updateRecipientGroup(args.groupId, group);
  },

  'delete_recipient_group': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteRecipientGroup(args.groupId);
  },
};
