import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const opsnotesToolHandlers: ToolHandlerMap = {
  'list_opsnotes': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listOpsNotes({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_opsnote': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getOpsNote(args.opsNoteId, {
      fields: args.fields,
    });
  },

  'create_opsnote': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const opsNote: any = {
      note: args.note,
      scopes: args.scopes || [],
    };
    if (args.tags) opsNote.tags = args.tags;
    if (args.happenOnInSec) opsNote.happenOnInSec = args.happenOnInSec;
    return await client.createOpsNote(opsNote);
  },

  'update_opsnote': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const opsNote: any = {};
    if (args.note) opsNote.note = args.note;
    if (args.scopes) opsNote.scopes = args.scopes;
    if (args.tags) opsNote.tags = args.tags;
    return await client.updateOpsNote(args.opsNoteId, opsNote);
  },

  'delete_opsnote': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteOpsNote(args.opsNoteId);
  },
};
