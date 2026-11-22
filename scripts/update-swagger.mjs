#!/usr/bin/env node
/**
 * Download and pin the LogicMonitor REST API v3 Swagger specification into spec/lm-swagger-v3.json.
 *
 * Usage:
 *   npm run swagger:update
 *   node scripts/update-swagger.mjs [outputPath]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SWAGGER_URL =
  'https://www.logicmonitor.com/swagger-ui-master/api-v3/dist/swagger.json';

const here = dirname(fileURLToPath(import.meta.url));
const defaultTarget = join(here, '..', 'spec', 'lm-swagger-v3.json');
const target = process.argv[2] || defaultTarget;

async function main() {
  console.error(`Downloading LogicMonitor Swagger v3 spec from ${SWAGGER_URL} ...`);
  const res = await fetch(SWAGGER_URL, {
    headers: {
      'User-Agent': 'LogicMonitor-MCP-Server/1.0',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to download swagger: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  const parsed = JSON.parse(text);

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');

  const pathCount = Object.keys(parsed.paths || {}).length;
  const defCount = Object.keys(parsed.definitions || {}).length;
  console.error(
    `Saved ${target} (swagger=${parsed.swagger}, version=${parsed.info?.version}, paths=${pathCount}, definitions=${defCount})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
