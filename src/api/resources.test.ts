/**
 * Tests for LogicMonitor MCP Server - Resources
 */

import { describe, it, expect } from '@jest/globals';
import { listLMResources, readLMResource } from './resources.js';

describe('LogicMonitor Resources', () => {
  describe('listLMResources', () => {
    it('should return a list of available resources', () => {
      const resources = listLMResources();

      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
    });

    it('should include the API swagger resource', () => {
      const resources = listLMResources();
      const swaggerResource = resources.find(r => r.uri === 'lm://api/swagger');

      expect(swaggerResource).toBeDefined();
      expect(swaggerResource?.name).toContain('API');
      expect(swaggerResource?.description).toBeTruthy();
      expect(swaggerResource?.mimeType).toBe('application/json');
    });

    it('should have valid resource structure', () => {
      const resources = listLMResources();

      resources.forEach(resource => {
        expect(resource.uri).toBeTruthy();
        expect(resource.name).toBeTruthy();
        expect(resource.description).toBeTruthy();
      });
    });
  });

  describe('readLMResource', () => {
    it('should throw error for non-existent resource', async () => {
      await expect(
        readLMResource('lm://invalid/resource'),
      ).rejects.toThrow('Resource not found');
    });

    it('should fetch API swagger definition', async () => {
      const result = await readLMResource('lm://api/swagger');

      expect(result).toBeDefined();
      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBe(1);

      const content = result.contents[0];
      expect(content.uri).toBe('lm://api/swagger');
      expect(content.mimeType).toBe('application/json');
      expect(content.text).toBeTruthy();

      // Verify it's valid JSON
      const swagger = JSON.parse(content.text);
      expect(swagger).toBeDefined();
      expect(swagger.swagger).toBeDefined();
      expect(swagger.paths).toBeDefined();
    }, 30000); // 30 second timeout for network request

    it('should return valid swagger structure', async () => {
      const result = await readLMResource('lm://api/swagger');
      const swagger = JSON.parse(result.contents[0].text);

      // Verify basic Swagger/OpenAPI structure
      expect(swagger.swagger || swagger.openapi).toBeDefined();
      expect(swagger.info).toBeDefined();
      expect(swagger.paths).toBeDefined();
      expect(typeof swagger.paths).toBe('object');

      // Verify LogicMonitor specific content
      expect(swagger.basePath).toBe('/santaba/rest');
      expect(swagger.schemes).toContain('https');
    }, 30000);
  });
});

