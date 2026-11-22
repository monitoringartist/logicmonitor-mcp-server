/**
 * LogicMonitor MCP Server - Resources
 *
 * This module provides MCP resources and resource templates for LogicMonitor
 * API documentation and filter syntax reference.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIELD_SCHEMAS } from './field-schemas.js';
import { SEARCH_FIELDS, FILTER_EXAMPLES } from '../utils/helpers/filters.js';

export interface LMResource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface LMResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface SwaggerSpec {
  swagger?: string;
  openapi?: string;
  info?: Record<string, unknown>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  tags?: Array<{ name: string; description?: string }>;
  securityDefinitions?: Record<string, unknown>;
  paths?: Record<string, Record<string, any>>;
  definitions?: Record<string, any>;
}

const SWAGGER_URL = 'https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json';
const PINNED_SWAGGER_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../spec/lm-swagger-v3.json',
);
const SWAGGER_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;

let cachedSwagger: SwaggerSpec | null = null;
let cachedSwaggerAt = 0;
let pendingSwaggerFetch: Promise<SwaggerSpec> | null = null;

/**
 * Available static LogicMonitor resources
 */
export const LM_RESOURCES: LMResource[] = [
  {
    uri: 'lm://api/swagger',
    name: 'LogicMonitor (LM) API Definition Summary (Swagger/OpenAPI)',
    description:
      'Compact index of the LogicMonitor REST API v3 Swagger/OpenAPI specification ' +
      '(metadata, available domains/tags, schema names, and path/method index). ' +
      'To inspect individual models or domain endpoints without overflowing context, ' +
      'use the resource templates lm://api/swagger/schemas/{schemaName} and ' +
      'lm://api/swagger/paths/{domain}.\n\n' +
      'API notes: v3 requests require ?v=3 or X-Version:3 header; body properties are case-sensitive; ' +
      'maximum pagination size is 1000 (alert offset limit is 10000).',
    mimeType: 'application/json',
  },
  {
    uri: 'lm://filters/syntax-guide',
    name: 'LogicMonitor (LM) Filter Syntax Guide',
    description:
      'Concise markdown reference of LogicMonitor API filter operators, quoting/escaping rules, ' +
      'logical combinators, and searchable fields per resource.',
    mimeType: 'text/markdown',
  },
];

/**
 * Available LogicMonitor MCP resource templates
 */
export const LM_RESOURCE_TEMPLATES: LMResourceTemplate[] = [
  {
    uriTemplate: 'lm://api/swagger/schemas/{schemaName}',
    name: 'LogicMonitor API Schema Definition',
    description:
      'Returns a single LogicMonitor REST API v3 model/schema definition (e.g., Device, Alert, Dashboard, Collector).',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'lm://api/swagger/paths/{domain}',
    name: 'LogicMonitor API Endpoints by Domain',
    description:
      'Returns all LogicMonitor REST API v3 endpoints matching a tag or path domain (e.g., Devices, Alerts, Dashboards, Websites, Collectors).',
    mimeType: 'application/json',
  },
];

/**
 * Fetches content from a URL using HTTPS or HTTP with timeout and redirect limit.
 */
async function fetchUrl(url: string, redirectsRemaining = MAX_REDIRECTS): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || undefined,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'LogicMonitor-MCP-Server/1.0',
        'Accept': 'application/json',
      },
    };

    const req = protocol.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        res.resume();
        if (redirectUrl && redirectsRemaining > 0) {
          const resolvedUrl = new URL(redirectUrl, url).toString();
          fetchUrl(resolvedUrl, redirectsRemaining - 1).then(resolve).catch(reject);
          return;
        }
        reject(new Error('Too many redirects'));
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.setTimeout(FETCH_TIMEOUT_MS, () => {
      req.destroy(new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Returns the cached parsed Swagger specification, fetching and caching it if needed.
 */
export async function getSwaggerSpec(): Promise<SwaggerSpec> {
  const now = Date.now();
  if (cachedSwagger && now - cachedSwaggerAt < SWAGGER_CACHE_TTL_MS) {
    return cachedSwagger;
  }

  if (pendingSwaggerFetch) {
    return pendingSwaggerFetch;
  }

  pendingSwaggerFetch = (async () => {
    try {
      if (fs.existsSync(PINNED_SWAGGER_PATH)) {
        const raw = fs.readFileSync(PINNED_SWAGGER_PATH, 'utf8');
        const parsed = JSON.parse(raw) as SwaggerSpec;
        cachedSwagger = parsed;
        cachedSwaggerAt = Date.now();
        return parsed;
      }

      const raw = await fetchUrl(SWAGGER_URL);
      const parsed = JSON.parse(raw) as SwaggerSpec;
      cachedSwagger = parsed;
      cachedSwaggerAt = Date.now();
      return parsed;
    } catch (error) {
      throw new Error(
        `Failed to fetch LogicMonitor API definition: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      pendingSwaggerFetch = null;
    }
  })();

  return pendingSwaggerFetch;
}

/**
 * Sets or clears the in-memory Swagger cache (intended for testing).
 */
export function setSwaggerCacheForTesting(spec: SwaggerSpec | null): void {
  cachedSwagger = spec;
  cachedSwaggerAt = spec ? Date.now() : 0;
  pendingSwaggerFetch = null;
}

/**
 * Builds the compact summary payload for `lm://api/swagger` so clients don't
 * blow out their context window on the full multi-megabyte spec.
 */
function buildSwaggerSummary(spec: SwaggerSpec) {
  const pathIndex: Record<string, string[]> = {};
  for (const [pathKey, methods] of Object.entries(spec.paths ?? {})) {
    if (methods && typeof methods === 'object') {
      pathIndex[pathKey] = Object.keys(methods).filter(m => m !== 'parameters');
    }
  }

  const tagSet = new Set<string>(spec.tags?.map(t => t.name) ?? []);
  for (const methods of Object.values(spec.paths ?? {})) {
    for (const op of Object.values(methods ?? {})) {
      if (op && Array.isArray(op.tags)) {
        for (const tag of op.tags) {
          tagSet.add(tag);
        }
      }
    }
  }

  return {
    ...(spec.swagger ? { swagger: spec.swagger } : {}),
    ...(spec.openapi ? { openapi: spec.openapi } : {}),
    info: spec.info,
    host: spec.host,
    basePath: spec.basePath,
    schemes: spec.schemes,
    tags: Array.from(tagSet).sort(),
    availableSchemas: Object.keys(spec.definitions ?? {}).sort(),
    paths: pathIndex,
    resourceTemplates: LM_RESOURCE_TEMPLATES.map(t => t.uriTemplate),
  };
}

/**
 * Builds the static markdown reference for `lm://filters/syntax-guide`.
 */
export function buildFilterSyntaxGuide(): string {
  const searchFieldsRows = Object.entries(SEARCH_FIELDS)
    .map(([resource, fields]) => `| \`${resource}\` | ${fields.map(f => `\`${f}\``).join(', ')} |`)
    .join('\n');

  const examplesList = Object.entries(FILTER_EXAMPLES)
    .map(([resource, examples]) => {
      const items = examples.map(ex => `- \`${ex}\``).join('\n');
      return `### ${resource}\n${items}`;
    })
    .join('\n\n');

  return `# LogicMonitor API Filter Syntax Guide

## Operators
| Operator | Meaning | Example |
| --- | --- | --- |
| \`:\` | Equal (supports \`*\` wildcard) | \`displayName:"*prod*"\` |
| \`!:\` | Not equal | \`hostStatus!:"dead"\` |
| \`>\` / \`< \` | Strictly greater / less than | \`id>100\` |
| \`>:\` / \`<:\` | Greater / less than or equal | \`id>:100\` |
| \`~\` | Contains (substring match) | \`name~"web"\` |
| \`!~\` | Does not contain | \`name!~"test"\` |

## Quoting & Escaping Rules
- **String values** MUST be wrapped in double quotes: \`name:"my-server"\`.
- **Numbers and booleans** MUST NOT be quoted: \`id>:100\`, \`acked:false\`, \`disableAlerting:false\`.
- **Wildcards**: Use \`*\` inside quoted strings (e.g. \`displayName:"prod*"\`). Do not escape \`*\`.
- **Special characters**: Escape \`(\`, \`)\`, \`:\`, \`,\`, \`~\`, \`"\`, and \`\\\` with a leading backslash \`\\\`.

## Logical Combinators
- **AND** across conditions: comma \`,\` — \`displayName:"web*",hostStatus:"alive"\`
- **OR** across conditions: double pipe \`||\` — \`name:"web*"||name:"app*"\`
- **OR** within a single field: single pipe \`|\` — \`hostStatus:"active"|"pending"\`
- **Note**: The Alerts API does **not** support \`||\` (OR) across conditions; use single-field filters or \`,\` (AND).

## Searchable Fields (\`SEARCH_FIELDS\`)
| Resource | Default Search Fields |
| --- | --- |
${searchFieldsRows}

## Examples
${examplesList}
`;
}

/**
 * Reads the content of a LogicMonitor resource or resource template URI.
 */
export async function readLMResource(
  uri: string,
): Promise<{ contents: Array<{ uri: string; mimeType?: string; text: string }> }> {
  if (uri === 'lm://filters/syntax-guide') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: buildFilterSyntaxGuide(),
        },
      ],
    };
  }

  if (uri === 'lm://api/swagger') {
    const spec = await getSwaggerSpec();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(buildSwaggerSummary(spec), null, 2),
        },
      ],
    };
  }

  const schemaPrefix = 'lm://api/swagger/schemas/';
  if (uri.startsWith(schemaPrefix)) {
    const rawName = decodeURIComponent(uri.slice(schemaPrefix.length)).trim();
    if (!rawName) {
      throw new Error('Schema name is required');
    }

    try {
      const spec = await getSwaggerSpec();
      const definitions = spec.definitions ?? {};
      const matchedKey = Object.keys(definitions).find(
        key => key === rawName || key.toLowerCase() === rawName.toLowerCase(),
      );

      if (!matchedKey) {
        throw new Error(`Schema not found: ${rawName}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ schema: matchedKey, definition: definitions[matchedKey] }, null, 2),
          },
        ],
      };
    } catch (error) {
      // Fall back to bundled FIELD_SCHEMAS when offline or if Swagger spec is unavailable
      const fallbackKey = Object.keys(FIELD_SCHEMAS).find(
        key => key === rawName || key.toLowerCase() === rawName.toLowerCase(),
      );
      if (fallbackKey) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  schema: fallbackKey,
                  fields: FIELD_SCHEMAS[fallbackKey],
                  source: 'bundled-field-schemas',
                },
                null,
                2,
              ),
            },
          ],
        };
      }
      throw error;
    }
  }

  const pathsPrefix = 'lm://api/swagger/paths/';
  if (uri.startsWith(pathsPrefix)) {
    const rawDomain = decodeURIComponent(uri.slice(pathsPrefix.length)).trim();
    if (!rawDomain) {
      throw new Error('Domain is required');
    }

    const spec = await getSwaggerSpec();
    const targetLower = rawDomain.toLowerCase();
    const matchedPaths: Record<string, Record<string, unknown>> = {};

    for (const [pathKey, methods] of Object.entries(spec.paths ?? {})) {
      if (!methods || typeof methods !== 'object') continue;
      const pathMatches = pathKey.toLowerCase().includes(`/${targetLower}`);

      const filteredMethods: Record<string, unknown> = {};
      for (const [method, operation] of Object.entries(methods)) {
        if (method === 'parameters') continue;
        const tags: string[] = Array.isArray(operation?.tags) ? operation.tags : [];
        const tagMatches = tags.some(t => t.toLowerCase() === targetLower);
        if (pathMatches || tagMatches) {
          filteredMethods[method] = operation;
        }
      }

      if (Object.keys(filteredMethods).length > 0) {
        matchedPaths[pathKey] = filteredMethods;
      }
    }

    if (Object.keys(matchedPaths).length === 0) {
      throw new Error(`No API paths found for domain: ${rawDomain}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              domain: rawDomain,
              pathCount: Object.keys(matchedPaths).length,
              paths: matchedPaths,
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
}

/**
 * Lists all available static LogicMonitor resources
 */
export function listLMResources(): LMResource[] {
  return LM_RESOURCES;
}

/**
 * Lists all available LogicMonitor MCP resource templates
 */
export function listLMResourceTemplates(): LMResourceTemplate[] {
  return LM_RESOURCE_TEMPLATES;
}
