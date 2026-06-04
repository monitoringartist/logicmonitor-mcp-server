import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class EventsourcesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // EventSources
        case 'list_eventsources':
          return await this.client.listEventSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_eventsource':
          return await this.client.getEventSource(args.eventSourceId, {
            fields: args.fields,
          });

        case 'create_eventsource': {
          const { config, ...rest } = args;
          const eventSource = { ...rest, ...(config || {}) };
          return await this.client.createEventSource(eventSource);
        }

        case 'update_eventsource': {
          const { eventSourceId, config, ...rest } = args;
          const eventSource = { ...rest, ...(config || {}) };
          return await this.client.updateEventSource(eventSourceId, eventSource);
        }

        case 'delete_eventsource':
          return await this.client.deleteEventSource(args.eventSourceId);

        case 'import_eventsource':
          return await this.client.importEventSource(args.content, args.format, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
