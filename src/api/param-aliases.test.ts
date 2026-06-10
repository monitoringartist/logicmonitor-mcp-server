import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { applyToolParamAliases, normalizeToolArgs } from './param-aliases.js';
import { getLogicMonitorTools } from './tools/index.js';

describe('param-aliases', () => {
  describe('normalizeToolArgs', () => {
    it('maps deviceGroupId -> groupId for resource_group tools', () => {
      const out = normalizeToolArgs('get_resource_group_sdt_history', { deviceGroupId: 7 });
      expect(out.groupId).toBe(7);
    });

    it('maps entity-specific group ids -> groupId per group family', () => {
      expect(normalizeToolArgs('list_website_group_sdts', { websiteGroupId: 1 }).groupId).toBe(1);
      expect(normalizeToolArgs('get_collector_group', { collectorGroupId: 2 }).groupId).toBe(2);
      expect(normalizeToolArgs('get_dashboard_group', { dashboardGroupId: 3 }).groupId).toBe(3);
      expect(normalizeToolArgs('get_report_group', { reportGroupId: 4 }).groupId).toBe(4);
      expect(normalizeToolArgs('get_recipient_group', { recipientGroupId: 5 }).groupId).toBe(5);
    });

    it('does not cross-apply group aliases between families', () => {
      // websiteGroupId is not valid for a collector group tool
      expect(normalizeToolArgs('get_collector_group', { websiteGroupId: 1 }).groupId).toBeUndefined();
    });

    it('maps hdsId -> deviceDataSourceId', () => {
      const out = normalizeToolArgs('get_resource_instance_config', { hdsId: 5, deviceId: 1 });
      expect(out.deviceDataSourceId).toBe(5);
    });

    it('maps datasourceId -> dataSourceId', () => {
      const out = normalizeToolArgs('get_datasource', { datasourceId: 50 });
      expect(out.dataSourceId).toBe(50);
    });

    it('maps reportTaskId -> taskId only for get_report_task_result', () => {
      expect(normalizeToolArgs('get_report_task_result', { reportTaskId: 't1' }).taskId).toBe('t1');
      // Unrelated tool should not gain a taskId from reportTaskId
      expect(normalizeToolArgs('get_resource', { reportTaskId: 't1' }).taskId).toBeUndefined();
    });

    it('maps deviceId -> resourceId for diagnostic remediation tools', () => {
      expect(normalizeToolArgs('get_diagnostic_remediation_results', { deviceId: 1 }).resourceId).toBe(1);
    });

    it('maps appliesToFunctionId -> functionId (matches tool name)', () => {
      expect(normalizeToolArgs('get_applies_to_function', { appliesToFunctionId: 1 }).functionId).toBe(1);
    });

    it('maps alertRuleId -> ruleId (matches tool name)', () => {
      expect(normalizeToolArgs('get_alert_rule', { alertRuleId: 1 }).ruleId).toBe(1);
      // Scoped: a non-alert-rule tool must not gain ruleId
      expect(normalizeToolArgs('get_resource', { alertRuleId: 1 }).ruleId).toBeUndefined();
    });

    it('does not overwrite an explicitly provided canonical value', () => {
      const out = normalizeToolArgs('get_datasource', { dataSourceId: 1, datasourceId: 2 });
      expect(out.dataSourceId).toBe(1);
    });

    it('does not apply deviceGroupId alias to non-resource_group tools (collector groups)', () => {
      const out = normalizeToolArgs('get_collector_group', { deviceGroupId: 3 });
      expect(out.groupId).toBeUndefined();
    });
  });

  describe('applyToolParamAliases', () => {
    it('publishes alias properties and keeps additionalProperties false', () => {
      const tools = getLogicMonitorTools(false);
      const getDs = tools.find((t) => t.name === 'get_datasource');
      const props = getDs?.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty('dataSourceId');
      expect(props).toHaveProperty('datasourceId');
      expect(getDs?.inputSchema.additionalProperties).toBe(false);
    });

    it('keeps one-of-canonical-or-alias enforced via allOf for required ids', () => {
      const tools = getLogicMonitorTools(false);
      const tool = tools.find((t) => t.name === 'get_resource_group_sdt_history');
      const schema = tool?.inputSchema as any;
      expect(schema.required).not.toContain('groupId');
      const hasGroupAnyOf = (schema.allOf || []).some((s: any) =>
        JSON.stringify(s).includes('groupId') && JSON.stringify(s).includes('deviceGroupId'),
      );
      expect(hasGroupAnyOf).toBe(true);
    });

    it('is idempotent (does not double-add an existing alias)', () => {
      const tool: Tool = {
        name: 'get_datasource_test',
        description: 'x',
        inputSchema: {
          type: 'object',
          properties: { dataSourceId: { type: 'number' }, datasourceId: { type: 'number' } },
          additionalProperties: false,
          required: ['dataSourceId'],
        },
      };
      applyToolParamAliases([tool]);
      // datasourceId already present -> required untouched, no allOf added
      expect((tool.inputSchema as any).required).toEqual(['dataSourceId']);
      expect((tool.inputSchema as any).allOf).toBeUndefined();
    });
  });
});
