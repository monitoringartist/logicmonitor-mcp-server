/**
 * LogicMonitor (LM) API Client.
 *
 * Barrel re-export. The implementation now lives in `./client/`, split into a
 * shared `BaseClient` plus per-domain method classes merged in `./client/index.ts`.
 */

export { LogicMonitorClient } from './client/index.js';
export { escapeFilterValue } from './client/base-client.js';
export type { LogicMonitorConfig, LMResponse, LMListResponse } from './client/base-client.js';
