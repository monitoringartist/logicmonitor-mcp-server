/**
 * Tests for LogicMonitor MCP completion handler
 */

import { jest } from '@jest/globals';
import { LogicMonitorHandlers } from './handlers.js';
import { LogicMonitorClient } from './client.js';

describe('LogicMonitorHandlers - Completion', () => {
  let mockClient: jest.Mocked<LogicMonitorClient>;
  let handlers: LogicMonitorHandlers;

  beforeEach(() => {
    mockClient = {
      listResources: jest.fn(),
    } as any;

    handlers = new LogicMonitorHandlers(mockClient);
  });

  describe('handleCompletion', () => {
    it('should return completions for resource_check prompt resourceName argument', async () => {
      mockClient.listResources.mockResolvedValue({
        items: [
          { displayName: 'prod-web-01', name: 'web01' },
          { displayName: 'prod-web-02', name: 'web02' },
          { displayName: 'prod-db-01', name: 'db01' },
        ],
        total: 3,
      });

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: 'prod' },
      );

      expect(result.values).toEqual(['prod-web-01', 'prod-web-02', 'prod-db-01']);
      expect(result.total).toBe(3);
      expect(result.hasMore).toBe(false);
      expect(mockClient.listResources).toHaveBeenCalledWith({
        size: 100,
        offset: 0,
        filter: 'name~"prod"||displayName~"prod"||name:"prod"',
        fields: 'displayName,name',
      });
    });

    it('should handle empty search value', async () => {
      mockClient.listResources.mockResolvedValue({
        items: [
          { displayName: 'server-01', name: 'srv01' },
          { displayName: 'server-02', name: 'srv02' },
        ],
        total: 2,
      });

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: '' },
      );

      expect(result.values).toEqual(['server-01', 'server-02']);
      expect(mockClient.listResources).toHaveBeenCalledWith({
        size: 100,
        offset: 0,
        filter: '',
        fields: 'displayName,name',
      });
    });

    it('should indicate hasMore when total exceeds returned values', async () => {
      mockClient.listResources.mockResolvedValue({
        items: Array.from({ length: 100 }, (_, i) => ({
          displayName: `server-${i}`,
          name: `srv${i}`,
        })),
        total: 150,
      });

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: 'server' },
      );

      expect(result.values).toHaveLength(100);
      expect(result.total).toBe(150);
      expect(result.hasMore).toBe(true);
    });

    it('should filter out null/undefined displayNames', async () => {
      mockClient.listResources.mockResolvedValue({
        items: [
          { displayName: 'server-01', name: 'srv01' },
          { displayName: null, name: 'srv02' },
          { displayName: 'server-03', name: 'srv03' },
          { name: 'srv04' }, // No displayName
        ],
        total: 4,
      });

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: 'server' },
      );

      expect(result.values).toEqual(['server-01', 'srv02', 'server-03', 'srv04']);
      expect(result.total).toBe(4);
    });

    it('should return empty completions on API error', async () => {
      // Mock console.error to suppress expected error output in tests
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockClient.listResources.mockRejectedValue(new Error('API Error'));

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: 'test' },
      );

      expect(result.values).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[LogicMonitor MCP] Completion error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should return empty completions for unsupported prompt', async () => {
      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'unknown_prompt' },
        { name: 'someArg', value: 'test' },
      );

      expect(result.values).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(mockClient.listResources).not.toHaveBeenCalled();
    });

    it('should return empty completions for unsupported argument', async () => {
      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'unknownArg', value: 'test' },
      );

      expect(result.values).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(mockClient.listResources).not.toHaveBeenCalled();
    });

    it('should return empty completions for ref/resource type', async () => {
      const result = await handlers.handleCompletion(
        { type: 'ref/resource', uri: 'file:///test' },
        { name: 'someArg', value: 'test' },
      );

      expect(result.values).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
      expect(mockClient.listResources).not.toHaveBeenCalled();
    });

    it('should search by IP address (exact match)', async () => {
      mockClient.listResources.mockResolvedValue({
        items: [
          { displayName: 'web-server', name: '192.168.1.100' },
        ],
        total: 1,
      });

      const result = await handlers.handleCompletion(
        { type: 'ref/prompt', name: 'resource_check' },
        { name: 'resourceName', value: '192.168.1.100' },
      );

      expect(result.values).toEqual(['web-server']);
      expect(mockClient.listResources).toHaveBeenCalledWith({
        size: 100,
        offset: 0,
        filter: 'name~"192.168.1.100"||displayName~"192.168.1.100"||name:"192.168.1.100"',
        fields: 'displayName,name',
      });
    });
  });
});

