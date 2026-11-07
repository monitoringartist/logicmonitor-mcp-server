/**
 * Tests for the Swagger-derived test fixtures and mock client.
 *
 * Network-free. These guard that:
 *  - every fixture uses real Swagger field names (validated against FIELD_SCHEMAS,
 *    which is generated from the same spec), catching drift in the generator; and
 *  - the mock client mirrors the real client surface and is usable end-to-end
 *    through the handlers.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LM_FIXTURES } from './fixtures.js';
import {
  lmFixture,
  lmListResponse,
  lmListOf,
  createMockClient,
  lmClientMethodNames,
} from './fixtures-helpers.js';
import { FIELD_SCHEMAS } from './field-schemas.js';
import { LogicMonitorHandlers } from './handlers.js';

describe('LM fixtures', () => {
  const models = Object.keys(LM_FIXTURES) as Array<keyof typeof LM_FIXTURES>;

  it('exposes at least the core resource models', () => {
    for (const model of ['Device', 'DeviceGroup', 'Alert', 'Collector', 'Dashboard']) {
      expect(models).toContain(model);
    }
  });

  it('uses only real Swagger field names (validated against FIELD_SCHEMAS)', () => {
    const offenders: Array<{ model: string; unknownFields: string[] }> = [];

    for (const model of models) {
      const allowed = FIELD_SCHEMAS[model as string];
      // Only models that also have a generated field schema can be checked; all
      // curated fixture models do, so a missing schema is itself a failure.
      expect(Array.isArray(allowed)).toBe(true);

      const allowedSet = new Set(allowed);
      const unknownFields = Object.keys(LM_FIXTURES[model]).filter(k => !allowedSet.has(k));
      if (unknownFields.length > 0) {
        offenders.push({ model: model as string, unknownFields });
      }
    }

    expect(offenders).toEqual([]);
  });

  it('produces independent deep copies via lmFixture (no shared mutation)', () => {
    const a = lmFixture('Device');
    const b = lmFixture('Device');
    (a as { displayName: string }).displayName = 'mutated';
    expect((b as { displayName: string }).displayName).not.toBe('mutated');
    // The exported constant is untouched too.
    expect((LM_FIXTURES.Device as { displayName: string }).displayName).not.toBe('mutated');
  });

  it('applies overrides on top of the fixture', () => {
    const device = lmFixture('Device', { displayName: 'web-01', id: 999 });
    expect(device.displayName).toBe('web-01');
    expect(device.id).toBe(999);
    // Untouched fields still present.
    expect(device).toHaveProperty('hostStatus');
  });
});

describe('lmListResponse', () => {
  it('wraps items in the LM pagination envelope', () => {
    const res = lmListResponse([{ id: 1 }, { id: 2 }]);
    expect(res).toEqual({ total: 2, items: [{ id: 1 }, { id: 2 }] });
  });

  it('honors explicit total and searchId', () => {
    const res = lmListResponse([{ id: 1 }], { total: 50, searchId: 'abc' });
    expect(res).toEqual({ total: 50, items: [{ id: 1 }], searchId: 'abc' });
  });

  it('lmListOf builds a single-item list of the model', () => {
    const res = lmListOf('Alert');
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]).toHaveProperty('id');
  });
});

describe('createMockClient', () => {
  it('mirrors the full client method surface as jest mocks', () => {
    const client = createMockClient();
    const methods = lmClientMethodNames();
    expect(methods.length).toBeGreaterThan(50);
    for (const name of methods) {
      expect(jest.isMockFunction((client as unknown as Record<string, unknown>)[name])).toBe(true);
    }
  });

  it('pre-wires common read methods to resolve fixtures', async () => {
    const client = createMockClient();
    const devices = await client.listResources({});
    expect(devices.items[0]).toHaveProperty('id');
    const device = await client.getDevice(1);
    expect(device).toHaveProperty('displayName');
  });

  it('lets overrides replace specific methods', async () => {
    const client = createMockClient({
      getDevice: jest.fn(async () => lmFixture('Device', { id: 42, displayName: 'override' })),
    });
    const device = await client.getDevice(42);
    expect(device).toMatchObject({ id: 42, displayName: 'override' });
  });
});

describe('mock client through the handlers', () => {
  let client: ReturnType<typeof createMockClient>;
  let handlers: LogicMonitorHandlers;

  beforeEach(() => {
    client = createMockClient();
    handlers = new LogicMonitorHandlers(client);
  });

  it('routes list_resources to the fixture-backed client method', async () => {
    const result = await handlers.handleToolCall('list_resources', { size: 10 });
    expect(client.listResources).toHaveBeenCalledTimes(1);
    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).toHaveProperty('displayName');
  });

  it('routes get_resource and returns a schema-accurate device', async () => {
    client.getDevice = jest.fn(async () => lmFixture('Device', { id: 7, displayName: 'srv-7' }));
    const result = await handlers.handleToolCall('get_resource', { deviceId: 7 });
    expect(client.getDevice).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 7, displayName: 'srv-7' });
  });
});
