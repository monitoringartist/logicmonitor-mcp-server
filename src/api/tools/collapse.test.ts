/**
 * Tests for CRUD tool collapsing.
 */

import { describe, it, expect } from '@jest/globals';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { buildCollapsedTools, isWriteOperation, MANAGE_PREFIX } from './collapse.js';
import { getLogicMonitorTools } from './index.js';

/** Build a minimal valid Tool definition for tests. */
function makeTool(
  name: string,
  readOnly: boolean,
  properties: Record<string, object> = {},
  required: string[] = [],
): Tool {
  return {
    name,
    description: `${name}: does the ${name} thing for testing. More detail here.`,
    annotations: { title: name, readOnlyHint: readOnly },
    inputSchema: {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
      additionalProperties: false,
    },
  };
}

describe('buildCollapsedTools', () => {
  describe('grouping', () => {
    it('collapses a full CRUD set into a single manage_<resource> tool', () => {
      const base = [
        makeTool('list_datasources', true, { filter: { type: 'string' } }),
        makeTool('get_datasource', true, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
        makeTool('create_datasource', false, { config: { type: 'object' } }, ['config']),
        makeTool('update_datasource', false, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
        makeTool('delete_datasource', false, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
        makeTool('import_datasource', false, { content: { type: 'string' } }, ['content']),
      ];

      const { tools, routes } = buildCollapsedTools(base);

      const names = tools.map(t => t.name);
      expect(names).toEqual(['manage_datasource']);

      const route = routes.get('manage_datasource');
      expect(route).toBeDefined();
      expect(Array.from(route!.operations.keys())).toEqual([
        'list', 'get', 'create', 'update', 'delete', 'import',
      ]);
    });

    it('matches plural list_ names with singular sibling names', () => {
      const base = [
        makeTool('list_widgets', true),
        makeTool('get_widget', true, { widgetId: { type: 'number' } }, ['widgetId']),
      ];

      const { tools } = buildCollapsedTools(base);
      expect(tools.map(t => t.name)).toEqual(['manage_widget']);
    });

    it('handles -ies plurals (categories -> category)', () => {
      const base = [
        makeTool('list_categories', true),
        makeTool('get_category', true, { id: { type: 'number' } }, ['id']),
      ];

      const { tools } = buildCollapsedTools(base);
      expect(tools.map(t => t.name)).toEqual(['manage_category']);
    });

    it('keeps multi-word resource keys intact', () => {
      const base = [
        makeTool('list_resource_datasources', true, { deviceId: { type: 'number' } }, ['deviceId']),
        makeTool('get_resource_datasource', true, { deviceId: { type: 'number' } }, ['deviceId']),
        makeTool('update_resource_datasource', false, { deviceId: { type: 'number' } }, ['deviceId']),
      ];

      const { tools, routes } = buildCollapsedTools(base);
      expect(tools.map(t => t.name)).toEqual(['manage_resource_datasource']);
      expect(Array.from(routes.get('manage_resource_datasource')!.operations.keys())).toEqual([
        'list', 'get', 'update',
      ]);
    });
  });

  describe('passthrough rules', () => {
    it('leaves lone collapsible tools unchanged', () => {
      const base = [makeTool('list_datasource_devices', true)];
      const { tools, routes, consumed } = buildCollapsedTools(base);

      expect(tools.map(t => t.name)).toEqual(['list_datasource_devices']);
      expect(routes.size).toBe(0);
      expect(consumed.size).toBe(0);
    });

    it('leaves non-CRUD verbs unchanged', () => {
      const base = [
        makeTool('acknowledge_alert', false, { alertId: { type: 'string' } }, ['alertId']),
        makeTool('execute_remediation', false),
        makeTool('generate_resource_link', true),
      ];

      const { tools, routes } = buildCollapsedTools(base);
      expect(tools.map(t => t.name).sort()).toEqual([
        'acknowledge_alert', 'execute_remediation', 'generate_resource_link',
      ]);
      expect(routes.size).toBe(0);
    });

    it('does not collapse when the manage_ name collides with an existing tool', () => {
      const base = [
        makeTool('manage_foo', false),
        makeTool('list_foos', true),
        makeTool('get_foo', true, { id: { type: 'number' } }, ['id']),
      ];

      const { tools, routes, consumed } = buildCollapsedTools(base);
      expect(tools.map(t => t.name).sort()).toEqual(['get_foo', 'list_foos', 'manage_foo']);
      expect(routes.size).toBe(0);
      expect(consumed.size).toBe(0);
    });
  });

  describe('collapsed tool schema', () => {
    const base = [
      makeTool('list_datasources', true, { filter: { type: 'string' }, size: { type: 'number' } }),
      makeTool('get_datasource', true, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
      makeTool('delete_datasource', false, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
    ];
    const { tools } = buildCollapsedTools(base);
    const manageTool = tools.find(t => t.name === 'manage_datasource')!;

    it('requires the operation parameter', () => {
      expect(manageTool.inputSchema.required).toEqual(['operation']);
    });

    it('exposes an operation enum of available operations', () => {
      const op = (manageTool.inputSchema.properties as any).operation;
      expect(op.type).toBe('string');
      expect(op.enum).toEqual(['list', 'get', 'delete']);
    });

    it('merges properties from all member tools', () => {
      const props = manageTool.inputSchema.properties as Record<string, unknown>;
      expect(props).toHaveProperty('operation');
      expect(props).toHaveProperty('filter');
      expect(props).toHaveProperty('size');
      expect(props).toHaveProperty('dataSourceId');
    });

    it('keeps additionalProperties false', () => {
      expect(manageTool.inputSchema.additionalProperties).toBe(false);
    });

    it('marks read-only only when every operation is read-only', () => {
      const readOnlyGroup = buildCollapsedTools([
        makeTool('list_widgets', true),
        makeTool('get_widget', true, { widgetId: { type: 'number' } }, ['widgetId']),
      ]).tools.find(t => t.name === 'manage_widget')!;
      expect(readOnlyGroup.annotations?.readOnlyHint).toBe(true);

      // The datasource group above contains delete (write) -> not read-only.
      expect(manageTool.annotations?.readOnlyHint).toBe(false);
    });

    it('synthesizes a description mentioning each operation', () => {
      expect(manageTool.description).toContain('operation="list"');
      expect(manageTool.description).toContain('operation="get"');
      expect(manageTool.description).toContain('operation="delete"');
      // Write operations are tagged.
      expect(manageTool.description).toContain('[write]');
    });
  });

  describe('routing maps', () => {
    it('maps each operation to its underlying tool and read-only flag', () => {
      const { routes, consumed } = buildCollapsedTools([
        makeTool('list_datasources', true),
        makeTool('get_datasource', true, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
        makeTool('delete_datasource', false, { dataSourceId: { type: 'number' } }, ['dataSourceId']),
      ]);

      const route = routes.get('manage_datasource')!;
      expect(route.operations.get('list')!.toolName).toBe('list_datasources');
      expect(route.operations.get('list')!.readOnly).toBe(true);
      expect(route.operations.get('delete')!.toolName).toBe('delete_datasource');
      expect(route.operations.get('delete')!.readOnly).toBe(false);
      expect(route.operations.get('get')!.requiredGroups).toEqual([['dataSourceId']]);

      // Consumed maps every collapsed base name to its replacement.
      expect(consumed.get('get_datasource')).toEqual({
        manageName: 'manage_datasource',
        operation: 'get',
      });
    });
  });

  describe('isWriteOperation', () => {
    it('classifies write vs read operations', () => {
      expect(isWriteOperation('create')).toBe(true);
      expect(isWriteOperation('update')).toBe(true);
      expect(isWriteOperation('delete')).toBe(true);
      expect(isWriteOperation('import')).toBe(true);
      expect(isWriteOperation('list')).toBe(false);
      expect(isWriteOperation('get')).toBe(false);
    });
  });

  describe('level 2 folding', () => {
    const base = [
      makeTool('list_collectors', true, { filter: { type: 'string' } }),
      makeTool('get_collector', true, { collectorId: { type: 'number' } }, ['collectorId']),
      makeTool('get_collector_events', true, { collectorId: { type: 'number' } }, ['collectorId']),
      makeTool('acknowledge_collector_alert', false, { alertId: { type: 'string' } }, ['alertId']),
      makeTool('list_collector_groups', true),
      makeTool('get_collector_group', true, { groupId: { type: 'number' } }, ['groupId']),
      makeTool('get_collector_group_members', true, { groupId: { type: 'number' } }, ['groupId']),
      makeTool('get_unrelated_thing', true),
    ];

    it('leaves leaf tools as passthrough when level 2 is off', () => {
      const { tools } = buildCollapsedTools(base);
      const names = tools.map(t => t.name).sort();
      expect(names).toContain('get_collector_events');
      expect(names).toContain('acknowledge_collector_alert');
      expect(names).toContain('get_collector_group_members');
    });

    it('folds leaf tools into the parent manage_ tool when level 2 is on', () => {
      const { tools, routes, consumed } = buildCollapsedTools(base, { level2: true });

      const names = tools.map(t => t.name).sort();
      expect(names).toEqual([
        'get_unrelated_thing',
        'manage_collector',
        'manage_collector_group',
      ]);

      const collectorOps = Array.from(routes.get('manage_collector')!.operations.keys());
      expect(collectorOps).toEqual(['list', 'get', 'acknowledge_alert', 'get_events']);

      expect(consumed.get('get_collector_events')).toEqual({
        manageName: 'manage_collector',
        operation: 'get_events',
      });
      expect(consumed.get('acknowledge_collector_alert')).toEqual({
        manageName: 'manage_collector',
        operation: 'acknowledge_alert',
      });
    });

    it('routes a folded operation to the correct underlying tool with its requirements', () => {
      const { routes } = buildCollapsedTools(base, { level2: true });
      const ack = routes.get('manage_collector')!.operations.get('acknowledge_alert')!;
      expect(ack.toolName).toBe('acknowledge_collector_alert');
      expect(ack.readOnly).toBe(false);
      expect(ack.requiredGroups).toEqual([['alertId']]);
    });

    it('folds into the longest-matching parent resource', () => {
      const { routes, consumed } = buildCollapsedTools(base, { level2: true });
      expect(routes.get('manage_collector')!.operations.has('get_group_members')).toBe(false);
      expect(consumed.get('get_collector_group_members')).toEqual({
        manageName: 'manage_collector_group',
        operation: 'get_members',
      });
    });

    it('marks the parent tool as not read-only once a write leaf is folded in', () => {
      const { tools } = buildCollapsedTools(base, { level2: true });
      const manageCollector = tools.find(t => t.name === 'manage_collector')!;
      expect(manageCollector.annotations?.readOnlyHint).toBe(false);
    });

    it('keeps orphan leaf tools as passthrough', () => {
      const { tools, consumed } = buildCollapsedTools(base, { level2: true });
      expect(tools.map(t => t.name)).toContain('get_unrelated_thing');
      expect(consumed.has('get_unrelated_thing')).toBe(false);
    });
  });

  describe('against the real tool set', () => {
    const baseTools = getLogicMonitorTools(false);
    const { tools, routes } = buildCollapsedTools(baseTools);

    it('produces a strictly smaller tool set', () => {
      expect(tools.length).toBeLessThan(baseTools.length);
      expect(routes.size).toBeGreaterThan(0);
    });

    it('produces unique tool names', () => {
      const names = tools.map(t => t.name);
      expect(new Set(names).size).toBe(names.length);
    });

    it('produces well-formed collapsed tools', () => {
      const collapsed = tools.filter(t => t.name.startsWith(MANAGE_PREFIX));
      expect(collapsed.length).toBeGreaterThan(0);

      collapsed.forEach(tool => {
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.required).toEqual(['operation']);
        expect(tool.inputSchema.additionalProperties).toBe(false);
        const op = (tool.inputSchema.properties as any).operation;
        expect(Array.isArray(op.enum)).toBe(true);
        expect(op.enum.length).toBeGreaterThanOrEqual(2);
        expect(tool.description && tool.description.length).toBeGreaterThan(10);
      });
    });

    it('declares items for every array-typed schema node', () => {
      const findArraysMissingItems = (node: unknown, path: string): string[] => {
        if (!node || typeof node !== 'object') {
          return [];
        }
        const offenders: string[] = [];
        const schema = node as Record<string, unknown>;
        if (schema.type === 'array' && schema.items === undefined) {
          offenders.push(path);
        }
        const properties = schema.properties as Record<string, unknown> | undefined;
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            offenders.push(...findArraysMissingItems(value, `${path}.${key}`));
          }
        }
        if (schema.items) {
          offenders.push(...findArraysMissingItems(schema.items, `${path}.items`));
        }
        return offenders;
      };

      const offenders = tools.flatMap(tool =>
        findArraysMissingItems(tool.inputSchema, tool.name),
      );
      expect(offenders).toEqual([]);
    });

    it('does not advertise any base name that was collapsed away', () => {
      const { tools: advertised, consumed } = buildCollapsedTools(baseTools);
      const advertisedNames = new Set(advertised.map(t => t.name));
      for (const consumedName of consumed.keys()) {
        expect(advertisedNames.has(consumedName)).toBe(false);
      }
    });

    it('level 2 produces a smaller, still well-formed tool set', () => {
      const level1 = buildCollapsedTools(baseTools);
      const level2 = buildCollapsedTools(baseTools, { level2: true });

      expect(level2.tools.length).toBeLessThan(level1.tools.length);

      const names = level2.tools.map(t => t.name);
      expect(new Set(names).size).toBe(names.length);

      const advertisedNames = new Set(names);
      for (const consumedName of level2.consumed.keys()) {
        expect(advertisedNames.has(consumedName)).toBe(false);
      }
    });
  });
});
