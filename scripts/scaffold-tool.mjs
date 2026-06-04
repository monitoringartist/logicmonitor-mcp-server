#!/usr/bin/env node
/**
 * Scaffold the boilerplate for a new MCP tool.
 *
 * Adding a tool touches three files that share strict conventions:
 *   - src/api/tools/<domain>.ts      (the tool definition + JSON schema)
 *   - src/api/client/<domain>.ts     (the typed LM API client method)
 *   - src/api/handlers/<domain>.ts   (the registry entry wiring tool -> client)
 *
 * This generator prints ready-to-paste stubs for all three, with the correct
 * naming, read-only hint, HTTP verb and parameter shape inferred from the tool
 * name. It intentionally prints rather than editing files in place, so it can
 * never corrupt the hand-maintained domain files — copy each block into the
 * indicated location and adjust the TODOs.
 *
 * Usage:
 *   node scripts/scaffold-tool.mjs --name list_foos --domain foos \
 *     [--title "List foos"] [--description "..."] [--client-method listFoos] \
 *     [--http GET] [--path /foo/foos] [--id-param fooId] [--read-only|--write]
 */

const READ_VERBS = new Set(['list', 'get', 'fetch', 'verify', 'test', 'generate', 'discover']);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'read-only' || key === 'write') {
      args[key] = true;
      continue;
    }
    const value = argv[i + 1];
    if (value !== undefined && !value.startsWith('--')) {
      args[key] = value;
      i++;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function toCamelCase(snake) {
  return snake.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function toTitleCase(snake) {
  const s = snake.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fail(message) {
  // eslint-disable-next-line no-console
  console.error(`Error: ${message}\n`);
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/scaffold-tool.mjs --name <tool_name> --domain <domain> [options]');
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!args.name) fail('--name is required (e.g. --name list_foos)');
if (!args.domain) fail('--domain is required (e.g. --domain foos)');

const name = args.name;
const domain = args.domain;
const verb = name.split('_')[0];
const remainder = name.slice(verb.length + 1); // e.g. "cost_optimization_recommendation"

const readOnly = args['read-only'] ? true : args.write ? false : READ_VERBS.has(verb);
const clientMethod = args['client-method'] || toCamelCase(name);
const title = args.title || toTitleCase(name);
const description = args.description || `TODO: describe what ${name} does in LogicMonitor (LM).`;
const idParam = args['id-param'] || (remainder ? `${toCamelCase(remainder)}Id` : 'id');
const apiPath = args.path || '/REPLACE/with/api/path';

const httpVerb = (args.http || (
  verb === 'create' ? 'POST'
    : verb === 'update' ? 'PUT'
      : verb === 'delete' ? 'DELETE'
        : 'GET'
)).toUpperCase();

// ---- Build the tool definition stub -------------------------------------------------
let toolProperties;
let toolRequired;
let clientSignature;
let clientBody;
let handlerCall;

if (verb === 'list') {
  toolProperties = '        ...paginationSchema,\n        ...filterSchema,\n        ...fieldsSchema,';
  toolRequired = '';
  clientSignature = `async ${clientMethod}(params?: { size?: number; offset?: number; filter?: string; fields?: string }) {`;
  clientBody = `    return this.request<LMListResponse<any>>('GET', '${apiPath}', undefined, this.cleanParams(params));`;
  handlerCall = `    return await client.${clientMethod}({\n      size: args.size,\n      offset: args.offset,\n      filter: args.filter,\n      fields: args.fields,\n    });`;
} else if (verb === 'get') {
  toolProperties = `        ${idParam}: {\n          type: 'number',\n          description: 'TODO: identifier of the resource to fetch.',\n        },\n        ...fieldsSchema,`;
  toolRequired = `\n      required: ['${idParam}'],`;
  clientSignature = `async ${clientMethod}(${idParam}: number, params?: { fields?: string }) {`;
  clientBody = `    return this.request<LMResponse<any>>('GET', \`${apiPath}/\${${idParam}}\`, undefined, params);`;
  handlerCall = `    return await client.${clientMethod}(args.${idParam}, {\n      fields: args.fields,\n    });`;
} else if (verb === 'delete') {
  toolProperties = `        ${idParam}: {\n          type: 'number',\n          description: 'TODO: identifier of the resource to delete.',\n        },`;
  toolRequired = `\n      required: ['${idParam}'],`;
  clientSignature = `async ${clientMethod}(${idParam}: number) {`;
  clientBody = `    return this.request<LMResponse<any>>('DELETE', \`${apiPath}/\${${idParam}}\`);`;
  handlerCall = `    return await client.${clientMethod}(args.${idParam});`;
} else if (verb === 'create') {
  toolProperties = `        config: {\n          type: 'object',\n          description: 'TODO: the resource definition to create.',\n          additionalProperties: true,\n        },`;
  toolRequired = '\n      required: [\'config\'],';
  clientSignature = `async ${clientMethod}(config: any) {`;
  clientBody = `    return this.request<LMResponse<any>>('POST', '${apiPath}', config);`;
  handlerCall = `    return await client.${clientMethod}(args.config);`;
} else if (verb === 'update') {
  toolProperties = `        ${idParam}: {\n          type: 'number',\n          description: 'TODO: identifier of the resource to update.',\n        },\n        config: {\n          type: 'object',\n          description: 'TODO: fields to update.',\n          additionalProperties: true,\n        },`;
  toolRequired = `\n      required: ['${idParam}', 'config'],`;
  clientSignature = `async ${clientMethod}(${idParam}: number, config: any) {`;
  clientBody = `    return this.request<LMResponse<any>>('PUT', \`${apiPath}/\${${idParam}}\`, config);`;
  handlerCall = `    return await client.${clientMethod}(args.${idParam}, args.config);`;
} else {
  // Generic action stub.
  toolProperties = '        // TODO: define input properties for this tool.';
  toolRequired = '';
  clientSignature = `async ${clientMethod}(config: any) {`;
  clientBody = `    return this.request<LMResponse<any>>('${httpVerb}', '${apiPath}', config);`;
  handlerCall = `    return await client.${clientMethod}(args.config);`;
}

const toolStub = `  {
    name: '${name}',
    description: '${description.replace(/'/g, "\\'")}',
    annotations: { title: '${title.replace(/'/g, "\\'")}', readOnlyHint: ${readOnly} },
    inputSchema: {
      type: 'object',
      properties: {
${toolProperties}
      },${toolRequired}
      additionalProperties: false,
    },
  },`;

const clientStub = `  ${clientSignature}
${clientBody}
  }`;

const handlerStub = `  '${name}': async ({ client, args }: ToolHandlerContext): Promise<any> => {
${handlerCall}
  },`;

const camelDomain = toCamelCase(domain);
const pascalDomain = camelDomain.charAt(0).toUpperCase() + camelDomain.slice(1);

const out = `
Scaffolding tool "${name}" (domain: ${domain}, ${readOnly ? 'read-only' : 'write'}, ${httpVerb} ${apiPath})

============================================================
1) TOOL DEFINITION  ->  src/api/tools/${domain}.ts
   Add to the exported \`${camelDomain}Tools\` array.
   Ensure these are imported at the top from './common.js' if used:
     paginationSchema, filterSchema, fieldsSchema
------------------------------------------------------------
${toolStub}

============================================================
2) CLIENT METHOD  ->  src/api/client/${domain}.ts
   Add as a method on \`class ${pascalDomain}Client extends BaseClient\`.
   Ensure LMResponse / LMListResponse are imported from './base-client.js'.
------------------------------------------------------------
${clientStub}

============================================================
3) HANDLER ENTRY  ->  src/api/handlers/${domain}.ts
   Add to the exported \`${camelDomain}ToolHandlers\` map.
------------------------------------------------------------
${handlerStub}

============================================================
After pasting:
  - Replace the TODOs (API path, description, param descriptions).
  - npm run lint && npm run build && npm test
  - The drift tests (registry.test.ts, tools.test.ts) verify the tool is wired
    end-to-end and has a valid readOnlyHint + additionalProperties: false.
  - If this is a NEW domain (file did not exist), also register it in
    src/api/tools/index.ts, src/api/client/index.ts and src/api/handlers/index.ts.
`;

// eslint-disable-next-line no-console
console.log(out);
