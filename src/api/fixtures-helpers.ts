/**
 * Test helpers built on the Swagger-derived fixtures (`./fixtures.ts`).
 *
 * These let unit tests work with payloads shaped like the real LogicMonitor (LM)
 * API instead of ad-hoc inline objects:
 *
 *   - `lmFixture(model, overrides)` — a single schema-accurate resource object.
 *   - `lmListResponse(items, opts)` — the LM list pagination envelope.
 *   - `createMockClient(overrides)` — a fully-typed `jest.Mocked<LogicMonitorClient>`
 *     whose method surface is derived from the real client, with the common read
 *     methods pre-wired to resolve fixtures.
 *
 * This module is only imported by tests; it lives under `src/` (alongside the
 * co-located `*.test.ts` files) so it shares the same TS/ESM config.
 */

import { jest } from '@jest/globals';
import { LogicMonitorClient } from './client.js';
import { LM_FIXTURES, type LMFixtureModel } from './fixtures.js';

/** Deep clone helper (structuredClone is available on Node >= 18). */
function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Return a fresh, schema-accurate example object for the given model, with the
 * provided fields overridden. The base object is deep-cloned so callers can
 * mutate the result without affecting other tests.
 */
export function lmFixture<M extends LMFixtureModel>(
  model: M,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ...clone(LM_FIXTURES[model] as Record<string, unknown>), ...overrides };
}

/** Options for {@link lmListResponse}. */
export interface LMListResponseOptions {
  /** Total matching the query (defaults to items.length). */
  total?: number;
  searchId?: string;
}

/**
 * Wrap items in the LM v3 list pagination envelope: `{ total, items, searchId? }`.
 */
export function lmListResponse<T>(
  items: T[],
  options: LMListResponseOptions = {},
): { total: number; items: T[]; searchId?: string } {
  const envelope: { total: number; items: T[]; searchId?: string } = {
    total: options.total ?? items.length,
    items,
  };
  if (options.searchId !== undefined) {
    envelope.searchId = options.searchId;
  }
  return envelope;
}

/**
 * Convenience: a single-item list response for the given model.
 */
export function lmListOf(
  model: LMFixtureModel,
  overrides: Record<string, unknown> = {},
): { total: number; items: Record<string, unknown>[] } {
  return lmListResponse([lmFixture(model, overrides)]);
}

// Common read methods pre-wired to resolve fixtures. Only applied when the
// method actually exists on the client, so this list can be conservative.
const READ_DEFAULTS: ReadonlyArray<[method: string, model: LMFixtureModel, kind: 'list' | 'one']> = [
  ['listResources', 'Device', 'list'],
  ['getDevice', 'Device', 'one'],
  ['listDeviceGroups', 'DeviceGroup', 'list'],
  ['getDeviceGroup', 'DeviceGroup', 'one'],
  ['listAlerts', 'Alert', 'list'],
  ['getAlert', 'Alert', 'one'],
  ['listCollectors', 'Collector', 'list'],
  ['getCollector', 'Collector', 'one'],
  ['listCollectorGroups', 'CollectorGroup', 'list'],
  ['getCollectorGroup', 'CollectorGroup', 'one'],
  ['listDashboards', 'Dashboard', 'list'],
  ['getDashboard', 'Dashboard', 'one'],
  ['listDashboardGroups', 'DashboardGroup', 'list'],
  ['getDashboardGroup', 'DashboardGroup', 'one'],
  ['listWebsites', 'Website', 'list'],
  ['getWebsite', 'Website', 'one'],
  ['listWebsiteGroups', 'WebsiteGroup', 'list'],
  ['getWebsiteGroup', 'WebsiteGroup', 'one'],
  ['listDataSources', 'DataSource', 'list'],
  ['getDataSource', 'DataSource', 'one'],
  ['listEventSources', 'EventSource', 'list'],
  ['getEventSource', 'EventSource', 'one'],
  ['listSDTs', 'SDT', 'list'],
  ['getSDT', 'SDT', 'one'],
  ['listOpsNotes', 'OpsNote', 'list'],
  ['getOpsNote', 'OpsNote', 'one'],
  ['listReports', 'Report', 'list'],
  ['getReport', 'Report', 'one'],
  ['listUsers', 'Admin', 'list'],
  ['getUser', 'Admin', 'one'],
  ['listRoles', 'Role', 'list'],
  ['getRole', 'Role', 'one'],
  ['listRecipientGroups', 'RecipientGroup', 'list'],
  ['getRecipientGroup', 'RecipientGroup', 'one'],
  ['listAlertRules', 'AlertRule', 'list'],
  ['getAlertRule', 'AlertRule', 'one'],
  ['listEscalationChains', 'EscalationChain', 'list'],
  ['getEscalationChain', 'EscalationChain', 'one'],
];

/** The public method names of LogicMonitorClient (own prototype methods). */
export function lmClientMethodNames(): string[] {
  const prototype = LogicMonitorClient.prototype as unknown as Record<string, unknown>;
  return Object.getOwnPropertyNames(prototype).filter(
    name => name !== 'constructor' && typeof prototype[name] === 'function',
  );
}

/** Options for {@link createMockClient}. */
export interface CreateMockClientOptions {
  /**
   * Pre-wire the common read methods (list_/get_) to resolve fixtures. Defaults
   * to true. Set false to get a "blank" mock where every method is an unconfigured
   * `jest.fn()` (returns undefined), e.g. for suites that set their own returns.
   */
  wireReadDefaults?: boolean;
}

/**
 * Build a fully-typed `jest.Mocked<LogicMonitorClient>` whose method surface is
 * derived from the real client (so it never drifts as methods are added). Every
 * method is a `jest.fn()`; by default the common read methods resolve fixtures.
 *
 * Pass `overrides` to set specific method implementations/return values.
 */
export function createMockClient(
  overrides: Partial<Record<string, unknown>> = {},
  options: CreateMockClientOptions = {},
): jest.Mocked<LogicMonitorClient> {
  const { wireReadDefaults = true } = options;
  const mock: Record<string, unknown> = {};

  for (const name of lmClientMethodNames()) {
    mock[name] = jest.fn();
  }

  if (wireReadDefaults) {
    for (const [method, model, kind] of READ_DEFAULTS) {
      if (typeof mock[method] === 'function') {
        mock[method] = jest.fn(async () =>
          kind === 'list' ? lmListOf(model) : lmFixture(model),
        );
      }
    }
  }

  Object.assign(mock, overrides);

  return mock as unknown as jest.Mocked<LogicMonitorClient>;
}
