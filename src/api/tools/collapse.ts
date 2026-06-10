/**
 * CRUD tool collapsing for the LogicMonitor (LM) MCP server.
 *
 * When enabled, this transforms the flat set of per-verb tools into a smaller set
 * of `manage_<resource>` tools that take an `operation` parameter. This reduces
 * the advertised tool count, which makes large tool sets easier for AI agents.
 *
 * Two levels of collapsing are supported:
 * - Level 1: merge per-verb CRUD tools (`list_/get_/create_/update_/delete_/
 *   import_<resource>`) of the same resource into one `manage_<resource>` tool.
 * - Level 2 (additive): fold remaining leaf tools (sub-collection reads, data/
 *   graph/history endpoints, and actions like `acknowledge_*`) into the matching
 *   parent `manage_<resource>` tool as extra `<verb>_<remainder>` operations.
 *
 * The module is intentionally dependency-light (only the MCP SDK `Tool` type) so
 * it can be reused by both the transport runners (to build the advertised tool
 * list) and the handler dispatch layer (to route calls back to the underlying
 * per-verb handlers). User-facing errors are raised by the handler, not here.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/** The CRUD operations that can be collapsed by level 1. */
export type CrudOperation = 'list' | 'get' | 'create' | 'update' | 'delete' | 'import';

/** Prefix on the original tool name -> the level-1 operation it maps to. */
const PREFIX_TO_OP: ReadonlyArray<{ prefix: string; op: CrudOperation }> = [
  { prefix: 'list_', op: 'list' },
  { prefix: 'get_', op: 'get' },
  { prefix: 'create_', op: 'create' },
  { prefix: 'update_', op: 'update' },
  { prefix: 'delete_', op: 'delete' },
  { prefix: 'import_', op: 'import' },
];

/** Canonical ordering used when listing CRUD operations on a collapsed tool. */
const OPERATION_ORDER: readonly CrudOperation[] = ['list', 'get', 'create', 'update', 'delete', 'import'];

/** CRUD operations that modify state. */
const WRITE_OPERATIONS: ReadonlySet<CrudOperation> = new Set<CrudOperation>(['create', 'update', 'delete', 'import']);

/**
 * Verbs recognized when deriving a level-2 operation name from a leaf tool. The
 * first matching verb prefix is stripped; the remainder (after the parent
 * resource) becomes part of the operation name.
 */
const ACTION_VERBS: readonly string[] = [
  'list', 'get', 'create', 'update', 'delete', 'import',
  'acknowledge', 'add', 'clone', 'collect', 'escalate', 'execute',
  'generate', 'link', 'map', 'move', 'schedule', 'set', 'test', 'verify',
  'discover', 'fetch',
];

/** Prefix applied to every collapsed tool name. */
export const MANAGE_PREFIX = 'manage_';

/** Whether the given operation is a CRUD write operation. */
export function isWriteOperation(op: string): boolean {
  return WRITE_OPERATIONS.has(op as CrudOperation);
}

/** Routing details for a single operation of a collapsed tool. */
export interface CollapsedOperationRoute {
  /** The original (per-verb) tool name to dispatch to. */
  toolName: string;
  operation: string;
  /** Whether the underlying tool is read-only. */
  readOnly: boolean;
  /**
   * Required-parameter groups for the underlying tool. Each group is a set of
   * acceptable parameter names where at least one must be provided (a single-name
   * group is a hard requirement; a multi-name group models a canonical/alias
   * "one of" requirement). Derived from the tool's `required` plus any
   * `allOf[].anyOf[].required` clauses added by the param-alias layer.
   */
  requiredGroups: string[][];
}

/** A collapsed `manage_<resource>` tool and its operation routing table. */
export interface CollapsedToolRoute {
  resource: string;
  operations: Map<string, CollapsedOperationRoute>;
}

/** Info needed to point a caller at the collapsed replacement for a base tool. */
export interface ConsumedToolInfo {
  manageName: string;
  operation: string;
}

/** Options controlling how aggressively tools are collapsed. */
export interface BuildCollapsedToolsOptions {
  /** Also fold leaf tools into parent manage_ tools as extra operations. */
  level2?: boolean;
}

/** Result of {@link buildCollapsedTools}. */
export interface CollapseResult {
  /** The advertised tool list (passthrough tools + collapsed tools), sorted by name. */
  tools: Tool[];
  /** Map of collapsed tool name -> routing table. */
  routes: Map<string, CollapsedToolRoute>;
  /** Map of consumed base tool name -> its collapsed replacement. */
  consumed: Map<string, ConsumedToolInfo>;
}

/** Internal: a single member operation of a manage_ tool while building. */
interface MemberOperation {
  op: string;
  tool: Tool;
  readOnly: boolean;
}

/**
 * Convert a (likely plural) token to its singular form using conservative rules.
 * Conservative on purpose: under-singularizing only fails to merge a group (safe),
 * whereas over-singularizing could merge unrelated resources (unsafe).
 */
function singularize(word: string): string {
  if (/ies$/.test(word)) {
    return word.replace(/ies$/, 'y');
  }
  if (/(s|x|z|ch|sh)es$/.test(word)) {
    return word.replace(/es$/, '');
  }
  if (/ss$/.test(word)) {
    return word;
  }
  if (/s$/.test(word)) {
    return word.replace(/s$/, '');
  }
  return word;
}

/**
 * Parse a tool name into its level-1 CRUD operation and resource key, or null
 * when the name does not start with a collapsible CRUD prefix.
 */
function parseToolName(toolName: string): { op: CrudOperation; key: string } | null {
  for (const { prefix, op } of PREFIX_TO_OP) {
    if (!toolName.startsWith(prefix)) {
      continue;
    }
    const remainder = toolName.slice(prefix.length);
    if (!remainder) {
      return null;
    }
    if (op === 'list') {
      // `list_` names are plural; singularize the trailing token so they align
      // with the singular `get_/create_/...` names of the same resource.
      const parts = remainder.split('_');
      parts[parts.length - 1] = singularize(parts[parts.length - 1]);
      return { op, key: parts.join('_') };
    }
    return { op, key: remainder };
  }
  return null;
}

/** Split a tool name into its leading verb and remainder, or null. */
function stripVerb(toolName: string): { verb: string; rest: string } | null {
  for (const verb of ACTION_VERBS) {
    if (toolName.startsWith(verb + '_')) {
      return { verb, rest: toolName.slice(verb.length + 1) };
    }
  }
  return null;
}

/**
 * Derive required-parameter groups from a tool's input schema. Each returned
 * group is an OR-set: at least one of its names must be provided. Top-level
 * `required` fields become single-name groups; `allOf[].anyOf[].required`
 * clauses (added by the param-alias layer) become multi-name groups.
 */
function getRequiredGroups(inputSchema: Tool['inputSchema'] | undefined): string[][] {
  const schema = (inputSchema ?? {}) as Record<string, unknown>;
  const groups: string[][] = [];

  const required = Array.isArray(schema.required) ? (schema.required as string[]) : [];
  for (const field of required) {
    groups.push([field]);
  }

  const allOf = Array.isArray(schema.allOf) ? (schema.allOf as Array<Record<string, unknown>>) : [];
  for (const clause of allOf) {
    const anyOf = Array.isArray(clause?.anyOf) ? (clause.anyOf as Array<Record<string, unknown>>) : [];
    const names: string[] = [];
    for (const option of anyOf) {
      const optionRequired = Array.isArray(option?.required) ? (option.required as string[]) : [];
      names.push(...optionRequired);
    }
    if (names.length > 0) {
      groups.push(names);
    }
  }

  return groups;
}

/** Format requirement groups for display, e.g. ["a"],["b","c"] -> "a, (b or c)". */
function formatRequiredGroups(groups: string[][]): string {
  return groups
    .map(group => (group.length === 1 ? group[0] : `(${group.join(' or ')})`))
    .join(', ');
}

/** Extract a short, single-sentence summary from a tool description. */
function firstSentence(description: string | undefined): string {
  if (!description) {
    return '';
  }
  const trimmed = description.trim();
  const paragraphEnd = trimmed.indexOf('\n\n');
  let segment = paragraphEnd >= 0 ? trimmed.slice(0, paragraphEnd) : trimmed;
  const sentenceEnd = segment.indexOf('. ');
  if (sentenceEnd >= 0) {
    segment = segment.slice(0, sentenceEnd + 1);
  }
  return segment.replace(/\s+/g, ' ').trim();
}

/** Order members: CRUD operations first (canonical order), then others A-Z. */
function sortMembers(members: MemberOperation[]): MemberOperation[] {
  return [...members].sort((a, b) => {
    const ai = OPERATION_ORDER.indexOf(a.op as CrudOperation);
    const bi = OPERATION_ORDER.indexOf(b.op as CrudOperation);
    const aIsCrud = ai !== -1;
    const bIsCrud = bi !== -1;
    if (aIsCrud && bIsCrud) {
      return ai - bi;
    }
    if (aIsCrud) {
      return -1;
    }
    if (bIsCrud) {
      return 1;
    }
    return a.op.localeCompare(b.op);
  });
}

/** Build the synthesized description for a collapsed tool from its members. */
function buildDescription(resourceKey: string, members: ReadonlyArray<MemberOperation>): string {
  const label = resourceKey.replace(/_/g, ' ');
  const ops = members.map(m => m.op).join(', ');

  let description =
    `Manage LogicMonitor (LM) ${label}. ` +
    `Set the "operation" parameter to choose the action: ${ops}.\n`;

  for (const member of members) {
    const groups = getRequiredGroups(member.tool.inputSchema);
    const requiredStr = groups.length > 0 ? ` (requires: ${formatRequiredGroups(groups)})` : '';
    const writeTag = member.readOnly ? '' : ' [write]';
    description += `\n- operation="${member.op}"${writeTag}${requiredStr}: ${firstSentence(member.tool.description)}`;
  }

  description += '\n\nProvide only the parameters relevant to the chosen operation.';
  return description;
}

/**
 * Collapse per-verb tools into `manage_<resource>` tools.
 *
 * Level 1 rules:
 * - Only `list_/get_/create_/update_/delete_/import_` tools are candidates.
 * - A resource is collapsed only when it has 2+ collapsible operations.
 * - Lone candidates and non-CRUD tools pass through unchanged.
 * - If a collapsed name would collide with an existing tool name, or a resource
 *   has duplicate operations, that group is left un-collapsed for safety.
 *
 * Level 2 rules (applied additively when `options.level2` is true):
 * - Each remaining passthrough tool whose verb-stripped name extends an existing
 *   `manage_<resource>` (longest match wins) is folded into that tool as an extra
 *   operation named `<verb>_<remainder>` (e.g. `get_collector_events` ->
 *   `manage_collector` operation `get_events`).
 * - Folds that would produce an empty remainder or collide with an existing
 *   operation on the parent are skipped (the tool stays as passthrough).
 *
 * @param baseTools The base (per-verb) tool definitions.
 * @param options Collapsing options (level 2 folding).
 * @returns The advertised tool list plus routing/consumed maps for dispatch.
 */
export function buildCollapsedTools(
  baseTools: Tool[],
  options: BuildCollapsedToolsOptions = {},
): CollapseResult {
  const level2 = options.level2 === true;
  const baseNames = new Set(baseTools.map(t => t.name));

  // Tools that pass through unchanged after level 1 (and are candidates for
  // level-2 folding): non-CRUD tools plus lone/uncollapsible CRUD members.
  let passthrough: Tool[] = [];
  const groups = new Map<string, Array<{ tool: Tool; op: CrudOperation }>>();

  for (const tool of baseTools) {
    const parsed = parseToolName(tool.name);
    if (!parsed) {
      passthrough.push(tool);
      continue;
    }
    const members = groups.get(parsed.key) ?? [];
    members.push({ tool, op: parsed.op });
    groups.set(parsed.key, members);
  }

  const builders = new Map<string, { resource: string; members: MemberOperation[] }>();

  // Level 1: build manage_ tools from CRUD groups with 2+ distinct operations.
  for (const [resourceKey, members] of groups) {
    const manageName = MANAGE_PREFIX + resourceKey;
    const hasDuplicateOps = new Set(members.map(m => m.op)).size !== members.length;

    if (members.length < 2 || hasDuplicateOps || baseNames.has(manageName)) {
      for (const member of members) {
        passthrough.push(member.tool);
      }
      continue;
    }

    builders.set(manageName, {
      resource: resourceKey,
      members: members.map(m => ({
        op: m.op,
        tool: m.tool,
        readOnly: m.tool.annotations?.readOnlyHint === true,
      })),
    });
  }

  // Level 2: fold remaining leaf tools into the matching parent manage_ tool.
  if (level2) {
    const resourceKeys = [...builders.values()].map(b => b.resource);
    const remaining: Tool[] = [];

    for (const tool of passthrough) {
      const stripped = stripVerb(tool.name);
      let folded = false;

      if (stripped) {
        const candidates = resourceKeys.filter(
          r => stripped.rest === r || stripped.rest.startsWith(r + '_'),
        );
        if (candidates.length > 0) {
          const resource = candidates.sort((a, b) => b.length - a.length)[0];
          // When the verb-stripped name is exactly the resource (e.g.
          // `link_resource` -> resource `resource`), the operation is the bare
          // verb; otherwise it is `<verb>_<remainder>` (e.g. `get_events`).
          const remainder = stripped.rest === resource ? '' : stripped.rest.slice(resource.length + 1);
          const opName = remainder ? `${stripped.verb}_${remainder}` : stripped.verb;
          const builder = builders.get(MANAGE_PREFIX + resource)!;
          const collides = builder.members.some(m => m.op === opName);
          if (!collides) {
            builder.members.push({
              op: opName,
              tool,
              readOnly: tool.annotations?.readOnlyHint === true,
            });
            folded = true;
          }
        }
      }

      if (!folded) {
        remaining.push(tool);
      }
    }

    passthrough = remaining;
  }

  // Materialize manage_ tools, routes, and the consumed map from the builders.
  const collapsedTools: Tool[] = [];
  const routes = new Map<string, CollapsedToolRoute>();
  const consumed = new Map<string, ConsumedToolInfo>();

  for (const [manageName, builder] of builders) {
    const sortedMembers = sortMembers(builder.members);

    const operations = new Map<string, CollapsedOperationRoute>();
    const mergedProperties: Record<string, unknown> = {};
    let allReadOnly = true;

    for (const member of sortedMembers) {
      if (!member.readOnly) {
        allReadOnly = false;
      }
      operations.set(member.op, {
        toolName: member.tool.name,
        operation: member.op,
        readOnly: member.readOnly,
        requiredGroups: getRequiredGroups(member.tool.inputSchema),
      });
      consumed.set(member.tool.name, { manageName, operation: member.op });

      const properties = (member.tool.inputSchema?.properties ?? {}) as Record<string, unknown>;
      for (const [propName, propSchema] of Object.entries(properties)) {
        if (!(propName in mergedProperties)) {
          mergedProperties[propName] = propSchema;
        }
      }
    }

    // The collapsed tool owns `operation`; never let a merged property shadow it.
    delete mergedProperties.operation;

    const availableOps = sortedMembers.map(m => m.op);

    collapsedTools.push({
      name: manageName,
      description: buildDescription(builder.resource, sortedMembers),
      annotations: {
        title: `Manage ${builder.resource.replace(/_/g, ' ')}`,
        readOnlyHint: allReadOnly,
      },
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: availableOps,
            description: `The operation to perform. One of: ${availableOps.join(', ')}.`,
          },
          ...mergedProperties,
        },
        required: ['operation'],
        additionalProperties: false,
      },
    });

    routes.set(manageName, { resource: builder.resource, operations });
  }

  const tools = [...passthrough, ...collapsedTools].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return { tools, routes, consumed };
}
