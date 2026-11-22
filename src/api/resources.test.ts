/**
 * Tests for LogicMonitor MCP Server - Resources
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  listLMResources,
  listLMResourceTemplates,
  readLMResource,
  setSwaggerCacheForTesting,
  SwaggerSpec,
} from './resources.js';

const MOCK_SWAGGER_SPEC: SwaggerSpec = {
  swagger: '2.0',
  info: { title: 'LogicMonitor REST API', version: '3.0.0' },
  host: 'company.logicmonitor.com',
  basePath: '/santaba/rest',
  schemes: ['https'],
  tags: [{ name: 'Devices' }, { name: 'Alerts' }],
  paths: {
    '/device/devices': {
      get: { tags: ['Devices'], summary: 'Get device list' },
      post: { tags: ['Devices'], summary: 'Add device' },
    },
    '/alert/alerts': {
      get: { tags: ['Alerts'], summary: 'Get alert list' },
    },
  },
  definitions: {
    Device: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        displayName: { type: 'string' },
      },
    },
    Alert: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        severity: { type: 'integer' },
      },
    },
  },
};

describe('LogicMonitor Resources', () => {
  beforeEach(() => {
    setSwaggerCacheForTesting(MOCK_SWAGGER_SPEC);
  });

  afterEach(() => {
    setSwaggerCacheForTesting(null);
  });

  describe('listLMResources', () => {
    it('should return a list of available resources', () => {
      const resources = listLMResources();

      expect(resources).toBeDefined();
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThanOrEqual(2);
    });

    it('should include the API swagger summary and filter syntax guide resources', () => {
      const resources = listLMResources();
      const swaggerResource = resources.find(r => r.uri === 'lm://api/swagger');
      const filterGuide = resources.find(r => r.uri === 'lm://filters/syntax-guide');

      expect(swaggerResource).toBeDefined();
      expect(swaggerResource?.name).toContain('API');
      expect(swaggerResource?.mimeType).toBe('application/json');

      expect(filterGuide).toBeDefined();
      expect(filterGuide?.mimeType).toBe('text/markdown');
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

  describe('listLMResourceTemplates', () => {
    it('should expose schema and domain path resource templates', () => {
      const templates = listLMResourceTemplates();
      const uris = templates.map(t => t.uriTemplate);

      expect(uris).toContain('lm://api/swagger/schemas/{schemaName}');
      expect(uris).toContain('lm://api/swagger/paths/{domain}');
    });
  });

  describe('readLMResource', () => {
    it('should throw error for non-existent resource', async () => {
      await expect(
        readLMResource('lm://invalid/resource'),
      ).rejects.toThrow('Resource not found');
    });

    it('should return compact swagger summary without full definitions', async () => {
      const result = await readLMResource('lm://api/swagger');

      expect(result.contents).toHaveLength(1);
      const content = result.contents[0];
      expect(content.uri).toBe('lm://api/swagger');
      expect(content.mimeType).toBe('application/json');

      const swagger = JSON.parse(content.text);
      expect(swagger.swagger).toBe('2.0');
      expect(swagger.info).toBeDefined();
      expect(swagger.basePath).toBe('/santaba/rest');
      expect(swagger.schemes).toContain('https');
      expect(swagger.paths['/device/devices']).toEqual(['get', 'post']);
      expect(swagger.availableSchemas).toEqual(['Alert', 'Device']);
      expect(swagger.definitions).toBeUndefined();
    });

    it('should return a single schema definition via lm://api/swagger/schemas/{schemaName}', async () => {
      const result = await readLMResource('lm://api/swagger/schemas/device');
      const parsed = JSON.parse(result.contents[0].text);

      expect(parsed.schema).toBe('Device');
      expect(parsed.definition.properties.displayName).toEqual({ type: 'string' });
    });

    it('should fall back to bundled FIELD_SCHEMAS when swagger cache is unavailable', async () => {
      setSwaggerCacheForTesting(null);
      // Use a schema name from FIELD_SCHEMAS; if network fails in sandbox, fallback succeeds
      const result = await readLMResource('lm://api/swagger/schemas/Device');
      const parsed = JSON.parse(result.contents[0].text);

      expect(parsed.schema).toBe('Device');
      expect(parsed.definition || parsed.fields).toBeDefined();
    }, 20000);

    it('should return endpoints for a domain via lm://api/swagger/paths/{domain}', async () => {
      const result = await readLMResource('lm://api/swagger/paths/Alerts');
      const parsed = JSON.parse(result.contents[0].text);

      expect(parsed.domain).toBe('Alerts');
      expect(parsed.pathCount).toBe(1);
      expect(parsed.paths['/alert/alerts'].get.summary).toBe('Get alert list');
      expect(parsed.paths['/device/devices']).toBeUndefined();
    });

    it('should return the static markdown filter syntax guide via lm://filters/syntax-guide', async () => {
      const result = await readLMResource('lm://filters/syntax-guide');

      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].mimeType).toBe('text/markdown');
      expect(result.contents[0].text).toContain('LogicMonitor API Filter Syntax Guide');
      expect(result.contents[0].text).toContain('SEARCH_FIELDS');
      expect(result.contents[0].text).toContain('displayName');
    });
  });
});
