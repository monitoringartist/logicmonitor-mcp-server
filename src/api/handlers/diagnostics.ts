import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError } from './shared.js';
import type { ProgressCallback } from './shared.js';

export class DiagnosticsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // DiagnosticSources
        case 'list_diagnosticsources':
          return await this.client.listDiagnosticSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_diagnosticsource':
          return await this.client.getDiagnosticSource(args.diagnosticSourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_diagnosticsource': {
          const { config, ...rest } = args;
          return await this.client.createDiagnosticSource({ ...rest, ...(config || {}) });
        }

        case 'update_diagnosticsource': {
          const { diagnosticSourceId, reason, config, ...rest } = args;
          return await this.client.updateDiagnosticSource(diagnosticSourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_diagnosticsource':
          return await this.client.deleteDiagnosticSource(args.diagnosticSourceId);

        case 'import_diagnosticsource':
          return await this.client.importDiagnosticSource(args.content, {
            handleConflict: args.handleConflict,
            fieldsToPreserve: args.fieldsToPreserve,
          });

        case 'execute_diagnosticsource':
          return await this.client.executeDiagnosticSource(args.config || {});

        // RemediationSources
        case 'list_remediationsources':
          return await this.client.listRemediationSources({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_remediationsource':
          return await this.client.getRemediationSource(args.remediationSourceId, {
            format: args.format,
            fields: args.fields,
          });

        case 'create_remediationsource': {
          const { config, ...rest } = args;
          return await this.client.createRemediationSource({ ...rest, ...(config || {}) });
        }

        case 'update_remediationsource': {
          const { remediationSourceId, reason, config, ...rest } = args;
          return await this.client.updateRemediationSource(remediationSourceId, { ...rest, ...(config || {}) }, { reason });
        }

        case 'delete_remediationsource':
          return await this.client.deleteRemediationSource(args.remediationSourceId);

        case 'execute_remediation':
          return await this.client.executeRemediation(args.config || {});

        // Diagnostic Remediation
        case 'get_diagnostic_remediation_sources':
          return await this.client.getDiagnosticRemediationSources({
            resourceId: args.resourceId, alertId: args.alertId, moduleType: args.moduleType,
          });

        case 'get_diagnostic_remediation_results':
          return await this.client.getDiagnosticRemediationResults({
            resourceId: args.resourceId, alertId: args.alertId, taskId: args.taskId,
          });
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
