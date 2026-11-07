/**
 * Centralized parameter-name aliases for LogicMonitor (LM) MCP tools.
 *
 * LM's API (and agents calling these tools) often use names that differ from the
 * normalized parameter names exposed by this server, e.g. `deviceGroupId` instead
 * of `groupId`, or `hdsId` instead of `deviceDataSourceId`. To make tools forgiving
 * of these common variants without weakening validation, each alias is:
 *   1. published in the tool's inputSchema (so client-side validation accepts it), and
 *   2. mapped back to the canonical name before the handler runs.
 *
 * Canonical names remain the documented/preferred form.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ParamAliasRule {
  /** The canonical parameter name the handler reads. */
  canonical: string;
  /** The alternative name to also accept. */
  alias: string;
  /** Optional predicate to scope the rule to specific tools (by name). */
  appliesTo?: (toolName: string) => boolean;
}

/**
 * Alias rules applied across the tool registry. Keep these conservative: only add
 * widely-used LM-native synonyms, and scope them where the canonical name is reused
 * across unrelated domains (e.g. `groupId` also means collector/website group).
 */
export const PARAM_ALIAS_RULES: ParamAliasRule[] = [
  // Group tools all expose a generic `groupId`, but agents tend to guess
  // entity-specific names. Accept those per group family.
  { canonical: 'groupId', alias: 'deviceGroupId', appliesTo: (n) => n.includes('resource_group') },
  { canonical: 'groupId', alias: 'websiteGroupId', appliesTo: (n) => n.includes('website_group') },
  { canonical: 'groupId', alias: 'collectorGroupId', appliesTo: (n) => n.includes('collector_group') },
  { canonical: 'groupId', alias: 'dashboardGroupId', appliesTo: (n) => n.includes('dashboard_group') },
  { canonical: 'groupId', alias: 'reportGroupId', appliesTo: (n) => n.includes('report_group') },
  { canonical: 'groupId', alias: 'recipientGroupId', appliesTo: (n) => n.includes('recipient_group') },
  // Device datasource ("host datasource"): LM API path uses `hdsId`.
  { canonical: 'deviceDataSourceId', alias: 'hdsId' },
  // DataSource: lowercase spelling is a common mistake.
  { canonical: 'dataSourceId', alias: 'datasourceId' },
  // Report task: the tool name implies `reportTaskId`.
  { canonical: 'taskId', alias: 'reportTaskId', appliesTo: (n) => n === 'get_report_task_result' },
  // Diagnostic remediation: the rest of the toolset uses `deviceId` for a host.
  { canonical: 'resourceId', alias: 'deviceId', appliesTo: (n) => n.startsWith('get_diagnostic_remediation') },
  // AppliesTo function: the tool name implies `appliesToFunctionId`.
  { canonical: 'functionId', alias: 'appliesToFunctionId', appliesTo: (n) => n.includes('applies_to_function') },
  // Alert rule: the tool name implies `alertRuleId`.
  { canonical: 'ruleId', alias: 'alertRuleId', appliesTo: (n) => n.includes('alert_rule') },
];

function rulesFor(toolName: string): ParamAliasRule[] {
  return PARAM_ALIAS_RULES.filter((r) => !r.appliesTo || r.appliesTo(toolName));
}

/**
 * Inject alias properties into each tool's inputSchema (in place). When a canonical
 * field is `required`, the requirement becomes "canonical OR alias" via an allOf/anyOf
 * pair so that exactly-one-of-each aliased field is still enforced. Idempotent: an
 * alias that already exists (e.g. added manually) is left untouched.
 */
export function applyToolParamAliases(tools: Tool[]): Tool[] {
  for (const tool of tools) {
    const schema = tool.inputSchema as any;
    if (!schema || typeof schema !== 'object') continue;
    const props = schema.properties;
    if (!props || typeof props !== 'object') continue;

    // Collect newly-added aliases grouped by canonical so multiple aliases for the
    // same field share a single anyOf (otherwise required enforcement would break).
    const addedAliasesByCanonical = new Map<string, string[]>();

    for (const rule of rulesFor(tool.name)) {
      if (!props[rule.canonical]) continue;
      if (props[rule.alias]) continue; // respect existing/manual aliases

      props[rule.alias] = {
        ...props[rule.canonical],
        description: `Alias for \`${rule.canonical}\` (accepted for convenience). Prefer \`${rule.canonical}\`.`,
      };
      const list = addedAliasesByCanonical.get(rule.canonical) ?? [];
      list.push(rule.alias);
      addedAliasesByCanonical.set(rule.canonical, list);
    }

    for (const [canonical, aliases] of addedAliasesByCanonical) {
      const required: string[] = Array.isArray(schema.required) ? schema.required : [];
      if (!required.includes(canonical)) continue;
      schema.required = required.filter((r: string) => r !== canonical);
      const allOf = Array.isArray(schema.allOf) ? schema.allOf : [];
      allOf.push({
        anyOf: [canonical, ...aliases].map((name) => ({ required: [name] })),
      });
      schema.allOf = allOf;
    }
  }
  return tools;
}

/**
 * Return a copy of `args` with any alias keys mapped onto their canonical names
 * (only when the canonical value is absent). Handlers always read canonical names.
 */
export function normalizeToolArgs(toolName: string, args: any): any {
  if (!args || typeof args !== 'object') return args;
  const out = { ...args };
  for (const rule of rulesFor(toolName)) {
    if (out[rule.alias] !== undefined && out[rule.canonical] === undefined) {
      out[rule.canonical] = out[rule.alias];
    }
  }
  return out;
}
