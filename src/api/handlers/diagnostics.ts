import { ToolHandlerMap, ToolHandlerContext } from './shared.js';

export const diagnosticsToolHandlers: ToolHandlerMap = {
  'list_diagnosticsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listDiagnosticSources({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDiagnosticSource(args.diagnosticSourceId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createDiagnosticSource({ ...rest, ...(config || {}) });
  },

  'update_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { diagnosticSourceId, reason, config, ...rest } = args;
    return await client.updateDiagnosticSource(diagnosticSourceId, { ...rest, ...(config || {}) }, { reason });
  },

  'delete_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteDiagnosticSource(args.diagnosticSourceId);
  },

  'import_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.importDiagnosticSource(args.content, {
      handleConflict: args.handleConflict,
      fieldsToPreserve: args.fieldsToPreserve,
    });
  },

  'execute_diagnosticsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.executeDiagnosticSource(args.config || {});
  },

  'list_remediationsources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listRemediationSources({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_remediationsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getRemediationSource(args.remediationSourceId, {
      format: args.format,
      fields: args.fields,
    });
  },

  'create_remediationsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createRemediationSource({ ...rest, ...(config || {}) });
  },

  'update_remediationsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { remediationSourceId, reason, config, ...rest } = args;
    return await client.updateRemediationSource(remediationSourceId, { ...rest, ...(config || {}) }, { reason });
  },

  'delete_remediationsource': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteRemediationSource(args.remediationSourceId);
  },

  'execute_remediation': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.executeRemediation(args.config || {});
  },

  'get_diagnostic_remediation_sources': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDiagnosticRemediationSources({
      resourceId: args.resourceId, alertId: args.alertId, moduleType: args.moduleType,
    });
  },

  'get_diagnostic_remediation_results': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getDiagnosticRemediationResults({
      resourceId: args.resourceId, alertId: args.alertId, taskId: args.taskId,
    });
  },
};
