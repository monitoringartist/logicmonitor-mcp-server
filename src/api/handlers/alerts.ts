import { LogicMonitorClient } from '../client.js';
import { validateFields, handleToolError, filterFields, DEFAULT_ALERT_FIELDS } from './shared.js';
import type { ProgressCallback } from './shared.js';
import { autoFormatFilter } from '../../utils/helpers/filters.js';

export class AlertsHandlers {
  constructor(private client: LogicMonitorClient) {}

  async handle(name: string, args: any, _progressCallback?: ProgressCallback): Promise<any> {
    try {
      // Strict validation of the optional `fields` parameter against the Swagger
      // schema (no-op for tools without a known response model).
      validateFields(name, args?.fields);

      switch (name) {
        // Alerts
        case 'list_alerts': {
          // Handle query parameter - convert to filter
          let filter = args.filter;
          if (args.query) {
            // Alert API doesn't support OR (||) operator, so handle differently
            if (args.query.includes(':') || args.query.includes('~')) {
              // User provided filter syntax - format it
              const queryFilter = autoFormatFilter(args.query);
              filter = filter ? `${queryFilter},${filter}` : queryFilter;
            } else {
              // Free text search - use only monitorObjectName (most relevant field for alerts)
              const queryFilter = autoFormatFilter(args.query, ['monitorObjectName']);
              filter = filter ? `${queryFilter},${filter}` : queryFilter;
            }
          }

          if (args.cleared !== undefined) {
            const clearedFilter = `cleared:${args.cleared}`;
            filter = filter ? `${filter},${clearedFilter}` : clearedFilter;
          }

          const result = await this.client.listAlerts({
            size: args.size,
            offset: args.offset,
            filter: filter,
            fields: args.fields,
            needMessage: args.needMessage,
            autoPaginate: args.autoPaginate,
          });

          // If user specified fields, return raw data
          if (args.fields) {
            return result;
          }

          // Otherwise, return curated fields
          return {
            ...result,
            items: result.items.map((alert: any) =>
              filterFields(alert, DEFAULT_ALERT_FIELDS),
            ),
          };
        }

        case 'get_alert':
          return await this.client.getAlert(args.alertId, {
            fields: args.fields,
            needMessage: args.needMessage,
          });

        case 'acknowledge_alert':
          return await this.client.acknowledgeAlert(args.alertId, args.comment);

        case 'add_alert_note':
          return await this.client.addAlertNote(args.alertId, args.note);

        // Alert Rules
        case 'list_alert_rules':
          return await this.client.listAlertRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_alert_rule':
          return await this.client.getAlertRule(args.ruleId, {
            fields: args.fields,
          });

        case 'create_alert_rule': {
          const rule: any = {
            name: args.name,
            priority: args.priority || 10,
            escalationChainId: args.escalationChainId,
          };
          if (args.devices) rule.devices = args.devices;
          if (args.datasources) rule.datasources = args.datasources;
          if (args.escalatingChainId) rule.escalatingChainId = args.escalatingChainId;
          return await this.client.createAlertRule(rule);
        }

        case 'update_alert_rule': {
          const rule: any = {};
          if (args.name) rule.name = args.name;
          if (args.priority !== undefined) rule.priority = args.priority;
          if (args.escalationChainId) rule.escalationChainId = args.escalationChainId;
          if (args.devices) rule.devices = args.devices;
          if (args.datasources) rule.datasources = args.datasources;
          return await this.client.updateAlertRule(args.ruleId, rule);
        }

        case 'delete_alert_rule':
          return await this.client.deleteAlertRule(args.ruleId);

        // Action Chains
        case 'list_action_chains':
          return await this.client.listActionChains({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_action_chain':
          return await this.client.getActionChain(args.actionChainId, { fields: args.fields });

        case 'create_action_chain': {
          const { config, ...rest } = args;
          return await this.client.createActionChain({ ...rest, ...(config || {}) });
        }

        case 'update_action_chain': {
          const { actionChainId, config, ...rest } = args;
          return await this.client.updateActionChain(actionChainId, { ...rest, ...(config || {}) });
        }

        case 'delete_action_chain':
          return await this.client.deleteActionChain(args.actionChainId);

        // Action Rules
        case 'list_action_rules':
          return await this.client.listActionRules({
            size: args.size,
            offset: args.offset,
            filter: args.filter,
            fields: args.fields,
            autoPaginate: args.autoPaginate,
          });

        case 'get_action_rule':
          return await this.client.getActionRule(args.actionRuleId, { fields: args.fields });

        case 'create_action_rule': {
          const { config, ...rest } = args;
          return await this.client.createActionRule({ ...rest, ...(config || {}) });
        }

        case 'update_action_rule': {
          const { actionRuleId, config, ...rest } = args;
          return await this.client.updateActionRule(actionRuleId, { ...rest, ...(config || {}) });
        }

        case 'delete_action_rule':
          return await this.client.deleteActionRule(args.actionRuleId);

        case 'set_action_rule_status':
          return await this.client.setActionRuleStatus(args.actionRuleId, args.enabled);

        // Alert escalation
        case 'escalate_alert':
          return await this.client.escalateAlert(args.alertId);
      }
    } catch (error) {
      handleToolError(error, name);
    }
  }
}
