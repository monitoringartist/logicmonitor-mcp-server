import { filterFields, DEFAULT_ALERT_FIELDS, ToolHandlerMap, ToolHandlerContext } from './shared.js';
import { autoFormatFilter } from '../../utils/helpers/filters.js';

export const alertsToolHandlers: ToolHandlerMap = {
  'list_alerts': async ({ client, args }: ToolHandlerContext): Promise<any> => {
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

    const result = await client.listAlerts({
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
  },

  'get_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getAlert(args.alertId, {
      fields: args.fields,
      needMessage: args.needMessage,
    });
  },

  'acknowledge_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.acknowledgeAlert(args.alertId, args.comment);
  },

  'add_alert_note': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.addAlertNote(args.alertId, args.note);
  },

  'list_alert_rules': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listAlertRules({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_alert_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getAlertRule(args.ruleId, {
      fields: args.fields,
    });
  },

  'create_alert_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const rule: any = {
      name: args.name,
      priority: args.priority || 10,
      escalationChainId: args.escalationChainId,
    };
    if (args.devices) rule.devices = args.devices;
    if (args.datasources) rule.datasources = args.datasources;
    if (args.escalatingChainId) rule.escalatingChainId = args.escalatingChainId;
    return await client.createAlertRule(rule);
  },

  'update_alert_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const rule: any = {};
    if (args.name) rule.name = args.name;
    if (args.priority !== undefined) rule.priority = args.priority;
    if (args.escalationChainId) rule.escalationChainId = args.escalationChainId;
    if (args.devices) rule.devices = args.devices;
    if (args.datasources) rule.datasources = args.datasources;
    return await client.updateAlertRule(args.ruleId, rule);
  },

  'delete_alert_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteAlertRule(args.ruleId);
  },

  'list_action_chains': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listActionChains({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_action_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getActionChain(args.actionChainId, { fields: args.fields });
  },

  'create_action_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createActionChain({ ...rest, ...(config || {}) });
  },

  'update_action_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { actionChainId, config, ...rest } = args;
    return await client.updateActionChain(actionChainId, { ...rest, ...(config || {}) });
  },

  'delete_action_chain': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteActionChain(args.actionChainId);
  },

  'list_action_rules': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.listActionRules({
      size: args.size,
      offset: args.offset,
      filter: args.filter,
      fields: args.fields,
      autoPaginate: args.autoPaginate,
    });
  },

  'get_action_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.getActionRule(args.actionRuleId, { fields: args.fields });
  },

  'create_action_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { config, ...rest } = args;
    return await client.createActionRule({ ...rest, ...(config || {}) });
  },

  'update_action_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    const { actionRuleId, config, ...rest } = args;
    return await client.updateActionRule(actionRuleId, { ...rest, ...(config || {}) });
  },

  'delete_action_rule': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.deleteActionRule(args.actionRuleId);
  },

  'set_action_rule_status': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.setActionRuleStatus(args.actionRuleId, args.enabled);
  },

  'escalate_alert': async ({ client, args }: ToolHandlerContext): Promise<any> => {
    return await client.escalateAlert(args.alertId);
  },
};
