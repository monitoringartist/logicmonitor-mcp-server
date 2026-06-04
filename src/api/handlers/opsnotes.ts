import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class OpsnotesHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // OpsNotes
        case 'list_opsnotes':
          return await this.client.listOpsNotes({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_opsnote':
          return await this.client.getOpsNote(args.opsNoteId, {
            fields: args.fields,
          });

        case 'create_opsnote': {
          const opsNote: any = {
            note: args.note,
            scopes: args.scopes || [],
          };
          if (args.tags) opsNote.tags = args.tags;
          if (args.happenOnInSec) opsNote.happenOnInSec = args.happenOnInSec;
          return await this.client.createOpsNote(opsNote);
        }

        case 'update_opsnote': {
          const opsNote: any = {};
          if (args.note) opsNote.note = args.note;
          if (args.scopes) opsNote.scopes = args.scopes;
          if (args.tags) opsNote.tags = args.tags;
          return await this.client.updateOpsNote(args.opsNoteId, opsNote);
        }

        case 'delete_opsnote':
          return await this.client.deleteOpsNote(args.opsNoteId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
