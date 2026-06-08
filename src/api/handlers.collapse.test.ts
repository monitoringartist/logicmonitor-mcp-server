/**
 * Tests for collapsed-tool dispatch in LogicMonitorHandlers.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { LogicMonitorHandlers } from './handlers.js';
import { createMockClient } from './fixtures-helpers.js';
import { MCPError } from '../utils/core/error-handler.js';

/**
 * Full mock client (derived from the real client surface) with the specific
 * datasource methods these tests touch wired to deterministic returns.
 */
function makeMockClient() {
  return createMockClient(
    {
      listDataSources: jest.fn(async () => ({ items: [], total: 0 })),
      getDataSource: jest.fn(async () => ({ id: 1, name: 'DS' })),
      deleteDataSource: jest.fn(async () => ({ success: true })),
      listDataSourceDevices: jest.fn(async () => ({ items: [], total: 0 })),
    },
    { wireReadDefaults: false },
  );
}

describe('LogicMonitorHandlers collapsed-tool dispatch', () => {
  let client: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = makeMockClient();
  });

  describe('when collapse level 1 is enabled', () => {
    it('routes a read operation to the underlying handler', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await handlers.handleToolCall('manage_datasource', { operation: 'list' });

      expect((client as any).listDataSources).toHaveBeenCalledTimes(1);
    });

    it('routes a get operation and strips the operation parameter', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await handlers.handleToolCall('manage_datasource', { operation: 'get', dataSourceId: 42 });

      expect((client as any).getDataSource).toHaveBeenCalledWith(42, expect.anything());
      // operation must not leak into the underlying call args
      const callArg = (client as any).getDataSource.mock.calls[0];
      expect(JSON.stringify(callArg)).not.toContain('operation');
    });

    it('errors when the operation parameter is missing', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await expect(handlers.handleToolCall('manage_datasource', {})).rejects.toMatchObject({
        code: 'MISSING_REQUIRED_FIELD',
      });
      expect((client as any).listDataSources).not.toHaveBeenCalled();
    });

    it('errors on an unknown operation', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await expect(
        handlers.handleToolCall('manage_datasource', { operation: 'frobnicate' }),
      ).rejects.toMatchObject({ code: 'INVALID_PARAMETERS' });
    });

    it('errors when required parameters for the operation are missing', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      const error = await handlers
        .handleToolCall('manage_datasource', { operation: 'get' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(MCPError);
      expect((error as MCPError).code).toBe('MISSING_REQUIRED_FIELD');
      expect((error as MCPError).message).toContain('dataSourceId');
      expect((client as any).getDataSource).not.toHaveBeenCalled();
    });

    it('rejects calls to a collapsed-away base name and points at the replacement', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      const error = await handlers
        .handleToolCall('get_datasource', { dataSourceId: 1 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(MCPError);
      expect((error as MCPError).message).toContain('manage_datasource');
      expect((error as MCPError).message).toContain('operation="get"');
      expect((client as any).getDataSource).not.toHaveBeenCalled();
    });

    it('still dispatches passthrough (non-collapsed) tools by their original name', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await handlers.handleToolCall('list_datasource_devices', { dataSourceId: 7 });

      expect((client as any).listDataSourceDevices).toHaveBeenCalledTimes(1);
    });
  });

  describe('when collapse level 2 is enabled', () => {
    it('routes a folded leaf operation to the underlying handler', async () => {
      const handlers = new LogicMonitorHandlers(client, {
        collapseToolsLevel1: true,
        collapseToolsLevel2: true,
      });

      await handlers.handleToolCall('manage_datasource', {
        operation: 'list_devices',
        dataSourceId: 7,
      });

      expect((client as any).listDataSourceDevices).toHaveBeenCalledTimes(1);
    });

    it('rejects the folded leaf tool by its original name and points at the replacement', async () => {
      const handlers = new LogicMonitorHandlers(client, {
        collapseToolsLevel1: true,
        collapseToolsLevel2: true,
      });

      const error = await handlers
        .handleToolCall('list_datasource_devices', { dataSourceId: 7 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(MCPError);
      expect((error as MCPError).message).toContain('manage_datasource');
      expect((error as MCPError).message).toContain('operation="list_devices"');
      expect((client as any).listDataSourceDevices).not.toHaveBeenCalled();
    });

    it('does not expose folded leaf operations when only level 1 is enabled', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true });

      await expect(
        handlers.handleToolCall('manage_datasource', {
          operation: 'list_devices',
          dataSourceId: 7,
        }),
      ).rejects.toMatchObject({ code: 'INVALID_PARAMETERS' });
      expect((client as any).listDataSourceDevices).not.toHaveBeenCalled();
    });
  });

  describe('read-only mode with collapsed tools', () => {
    it('rejects a write operation with a read-only error', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true, readOnly: true });

      const error = await handlers
        .handleToolCall('manage_datasource', { operation: 'delete', dataSourceId: 5 })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(MCPError);
      expect((error as MCPError).code).toBe('INSUFFICIENT_PERMISSIONS');
      expect((error as MCPError).message).toContain('read-only');
      expect((client as any).deleteDataSource).not.toHaveBeenCalled();
    });

    it('still allows read operations', async () => {
      const handlers = new LogicMonitorHandlers(client, { collapseToolsLevel1: true, readOnly: true });

      await handlers.handleToolCall('manage_datasource', { operation: 'get', dataSourceId: 9 });

      expect((client as any).getDataSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('when collapsing is disabled (default)', () => {
    it('dispatches base tool names normally', async () => {
      const handlers = new LogicMonitorHandlers(client);

      await handlers.handleToolCall('get_datasource', { dataSourceId: 3 });

      expect((client as any).getDataSource).toHaveBeenCalledWith(3, expect.anything());
    });

    it('does not recognize collapsed manage_ names', async () => {
      const handlers = new LogicMonitorHandlers(client);

      await expect(
        handlers.handleToolCall('manage_datasource', { operation: 'list' }),
      ).rejects.toMatchObject({ code: 'INVALID_PARAMETERS' });
    });
  });
});
