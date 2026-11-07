import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const eventsourcesToolHandlers: ToolHandlerMap = {
  'list_eventsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listEventSources({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_eventsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getEventSource(args.eventSourceId, {
      fields: args.fields,
    });
  },

  'create_eventsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    const eventSource = { ...rest, ...(config || {}) };
    return await client.createEventSource(eventSource);
  },

  'update_eventsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { eventSourceId, config, ...rest } = args;
    const eventSource = { ...rest, ...(config || {}) };
    return await client.updateEventSource(eventSourceId, eventSource);
  },

  'delete_eventsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteEventSource(args.eventSourceId);
  },

  'import_eventsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importEventSource(args.content, args.format, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },
};
