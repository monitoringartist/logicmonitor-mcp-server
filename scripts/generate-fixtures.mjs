#!/usr/bin/env node
/**
 * Generate src/api/fixtures.ts from the LogicMonitor (LM) Swagger v3 spec.
 *
 * Produces one realistic example object per curated resource model, populated
 * with schema-accurate field names and type-appropriate placeholder values
 * (ids, epoch timestamps, enum members, etc.). These fixtures back the test
 * mocks so unit tests assert against payloads shaped like the real API instead
 * of ad-hoc inline objects.
 *
 * The model set is kept in lock-step with `field-schemas` so the drift test can
 * validate every fixture field against the official Swagger model.
 *
 * Usage:
 *   node scripts/generate-fixtures.mjs [path/to/swagger.json]
 *
 * If no path is given the spec is downloaded from the official URL.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SWAGGER_URL =
  'https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json';

// Model name -> the canonical GET endpoint whose 200 response defines the shape.
// Mirrors scripts/generate-field-schemas.mjs so fixtures and field-schemas agree.
const SCHEMA_ENDPOINTS = {
  Device: '/device/devices',
  DeviceGroup: '/device/groups',
  Alert: '/alert/alerts',
  Dashboard: '/dashboard/dashboards',
  DashboardGroup: '/dashboard/groups',
  Widget: '/dashboard/widgets',
  Website: '/website/websites',
  WebsiteGroup: '/website/groups',
  Collector: '/setting/collector/collectors',
  CollectorGroup: '/setting/collector/groups',
  Admin: '/setting/admins',
  Role: '/setting/roles',
  DataSource: '/setting/datasources',
  EventSource: '/setting/eventsources',
  ConfigSource: '/setting/configsources',
  SDT: '/sdt/sdts',
  OpsNote: '/setting/opsnotes',
  Report: '/report/reports',
  RecipientGroup: '/setting/recipientgroups',
  AlertRule: '/setting/alert/rules',
  EscalationChain: '/setting/alert/chains',
};

// How many of each model to expose as a ready-made list fixture is left to the
// helper layer; here we emit a single canonical object per model.

async function loadSpec() {
  const arg = process.argv[2];
  if (arg) {
    if (!existsSync(arg)) {
      throw new Error(`Swagger file not found: ${arg}`);
    }
    return JSON.parse(readFileSync(arg, 'utf8'));
  }
  // eslint-disable-next-line no-console
  console.error(`Downloading swagger spec from ${SWAGGER_URL} ...`);
  const res = await fetch(SWAGGER_URL);
  if (!res.ok) {
    throw new Error(`Failed to download swagger: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** Resolve the response model (unwrapping the list pagination envelope). */
function responseModel(spec, path) {
  const defs = spec.definitions || {};
  const resolveRef = (ref) => defs[ref.split('/').pop()];
  const op = spec.paths?.[path]?.get;
  if (!op) throw new Error(`No GET operation for ${path}`);
  const schema = op.responses?.['200']?.schema;
  if (!schema) throw new Error(`No 200 schema for GET ${path}`);
  let def = schema.$ref ? resolveRef(schema.$ref) : schema;
  const props = def.properties || {};
  if (props.items && props.items.type === 'array' && props.items.items?.$ref) {
    return resolveRef(props.items.items.$ref);
  }
  return def;
}

/** Heuristics: does this property name look like an id / a timestamp? */
const isIdName = (name) => /(^id$|Id$|Ids$)/.test(name);
const isEpochName = (name) =>
  /(time|date|epoch|^on$|On$|At$|createdOn|updatedOn|startEpoch|endEpoch)/i.test(name);

/**
 * Build a type-appropriate placeholder value for a single property.
 * Depth-limited and ref-cycle aware to keep fixtures small and acyclic.
 */
function sampleValue(prop, name, defs, depth, seen) {
  if (!prop || typeof prop !== 'object') return null;

  if (prop.$ref) {
    const refName = prop.$ref.split('/').pop();
    if (seen.has(refName) || depth <= 0) return {};
    const target = defs[refName];
    if (!target) return {};
    return sampleObject(target, defs, depth - 1, new Set([...seen, refName]));
  }

  if (prop.example !== undefined) return prop.example;
  if (Array.isArray(prop.enum) && prop.enum.length > 0) return prop.enum[0];

  switch (prop.type) {
    case 'integer':
    case 'number': {
      if (isEpochName(name)) return 1700000000; // 2023-11-14T22:13:20Z (epoch s)
      if (isIdName(name)) return 1;
      return 0;
    }
    case 'boolean':
      return false;
    case 'string': {
      if (prop.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (name === 'name') return 'sample-name';
      if (name === 'displayName') return 'Sample Display Name';
      if (name === 'description') return 'Sample description';
      return `sample-${name}`;
    }
    case 'array': {
      if (depth <= 0) return [];
      const items = prop.items;
      if (!items) return [];
      const element = sampleValue(items, name, defs, depth - 1, seen);
      return element === null ? [] : [element];
    }
    case 'object':
      if (prop.properties && depth > 0) {
        return sampleObject(prop, defs, depth - 1, seen);
      }
      return {};
    default:
      if (prop.properties && depth > 0) {
        return sampleObject(prop, defs, depth - 1, seen);
      }
      return null;
  }
}

/** Build a sample object for a model definition. */
function sampleObject(def, defs, depth, seen) {
  const props = def.properties || {};
  const out = {};
  for (const [name, prop] of Object.entries(props)) {
    out[name] = sampleValue(prop, name, defs, depth, seen);
  }
  return out;
}

/** Stable, sorted-key serialization so regeneration produces minimal diffs. */
function serialize(value, indent) {
  const pad = '  '.repeat(indent);
  const padInner = '  '.repeat(indent + 1);
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${padInner}${serialize(v, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).sort();
    if (keys.length === 0) return '{}';
    const entries = keys.map(
      (k) => `${padInner}${JSON.stringify(k)}: ${serialize(value[k], indent + 1)}`,
    );
    return `{\n${entries.join(',\n')}\n${pad}}`;
  }
  return JSON.stringify(value);
}

async function main() {
  const spec = await loadSpec();
  const defs = spec.definitions || {};

  const fixtures = {};
  for (const [model, path] of Object.entries(SCHEMA_ENDPOINTS)) {
    const def = responseModel(spec, path);
    fixtures[model] = sampleObject(def, defs, 2, new Set());
  }

  const body = Object.keys(fixtures)
    .sort()
    .map((model) => `  ${model}: ${serialize(fixtures[model], 1)},`)
    .join('\n');

  const out = `/* eslint-disable */
/**
 * AUTO-GENERATED FILE — do not edit by hand.
 *
 * Generated by scripts/generate-fixtures.mjs from the LogicMonitor (LM) Swagger
 * v3 spec. Run \`npm run generate:fixtures\` to regenerate after API changes.
 *
 * Each entry is a single, schema-accurate example object for an LM resource
 * model, used by the test mocks (see fixtures-helpers.ts) so unit tests assert
 * against payloads shaped like the real API. Values are deterministic
 * placeholders (ids = 1, epoch timestamps = 1700000000, enums = first member).
 */

/** Model name -> a canonical example object with real Swagger field names. */
export const LM_FIXTURES = {
${body}
} as const;

/** Union of available fixture model names. */
export type LMFixtureModel = keyof typeof LM_FIXTURES;
`;

  const here = dirname(fileURLToPath(import.meta.url));
  const target = join(here, '..', 'src', 'api', 'fixtures.ts');
  writeFileSync(target, out, 'utf8');
  // eslint-disable-next-line no-console
  console.error(`Wrote ${target} (${Object.keys(fixtures).length} model fixtures)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
