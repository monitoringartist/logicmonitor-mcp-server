/**
 * Drift detection for the auto-generated field-schemas module.
 *
 * These checks are cheap and network-free. They guard the invariants that the
 * generator (`scripts/generate-field-schemas.mjs`) is supposed to produce and
 * keep `field-schemas.ts` in sync with `tools.ts`. The remaining drift — the
 * actual field *names* changing in the LogicMonitor Swagger spec — is covered in
 * CI by regenerating from the live spec and running `git diff --exit-code`.
 */

import { describe, it, expect } from '@jest/globals';
import { FIELD_SCHEMAS, TOOL_FIELD_SCHEMA } from './field-schemas.js';
import { getLogicMonitorTools } from './tools.js';

describe('field-schemas drift detection', () => {
  const tools = getLogicMonitorTools(false);
  const toolsByName = new Map(tools.map(t => [t.name, t]));

  it('maps only tools that are actually declared in tools.ts', () => {
    const unknown = Object.keys(TOOL_FIELD_SCHEMA).filter(name => !toolsByName.has(name));
    expect(unknown).toEqual([]);
  });

  it('maps only tools that accept a fields parameter', () => {
    const withoutFields = Object.keys(TOOL_FIELD_SCHEMA).filter(name => {
      const props = (toolsByName.get(name)?.inputSchema?.properties ?? {}) as Record<string, unknown>;
      return !('fields' in props);
    });
    expect(withoutFields).toEqual([]);
  });

  it('references a non-empty schema for every mapped tool', () => {
    const broken = Object.entries(TOOL_FIELD_SCHEMA).filter(
      ([, schema]) => !Array.isArray(FIELD_SCHEMAS[schema]) || FIELD_SCHEMAS[schema].length === 0,
    );
    expect(broken).toEqual([]);
  });

  it('has no orphan schemas (every schema is used by at least one tool)', () => {
    const usedSchemas = new Set(Object.values(TOOL_FIELD_SCHEMA));
    const orphans = Object.keys(FIELD_SCHEMAS).filter(schema => !usedSchemas.has(schema));
    expect(orphans).toEqual([]);
  });

  it('keeps every field list sorted and free of duplicates (matching generator output)', () => {
    for (const [schema, fields] of Object.entries(FIELD_SCHEMAS)) {
      // The generator emits `Object.keys(props).sort()` (default lexicographic order).
      const sorted = [...fields].sort();
      expect({ schema, fields }).toEqual({ schema, fields: sorted });
      expect(new Set(fields).size).toBe(fields.length);
    }
  });
});
