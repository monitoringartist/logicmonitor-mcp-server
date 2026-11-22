/**
 * Strict validation of the optional `fields` parameter against the Swagger spec.
 *
 * The LogicMonitor API silently ignores unknown `fields` names, which can lead to
 * confusing "missing data" results when a field is mistyped. For tools whose
 * response model is known (see field-schemas.ts, generated from Swagger), we
 * validate every requested field up-front and raise a clear error listing the
 * invalid names plus the closest valid matches.
 */
import { FIELD_SCHEMAS, TOOL_FIELD_SCHEMA } from '../../api/field-schemas.js';
import { MCPError, ErrorCodes, ErrorSuggestions } from '../core/error-handler.js';

/** Levenshtein distance, used to suggest the closest valid field for a typo. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

function closestMatches(field: string, valid: readonly string[]): string[] {
  const lower = field.toLowerCase();
  return valid
    .map((v) => ({ v, d: editDistance(lower, v.toLowerCase()) }))
    .filter(({ v, d }) => d <= 3 || v.toLowerCase().includes(lower))
    .sort((x, y) => x.d - y.d)
    .slice(0, 3)
    .map(({ v }) => v);
}

/**
 * Validate the `fields` parameter for a tool call.
 *
 * No-op when the tool has no known schema or `fields` is empty/not a string.
 * Sub-field selectors (e.g. `customProperties.name`) are validated on the
 * top-level segment only, matching the API's behaviour.
 *
 * @throws {MCPError} INVALID_PARAMETERS when one or more field names are invalid.
 */
export function validateFields(toolName: string, fields: unknown): void {
  if (typeof fields !== 'string' || fields.trim() === '') {
    return;
  }
  const schemaName = TOOL_FIELD_SCHEMA[toolName];
  if (!schemaName) {
    return;
  }
  const valid = FIELD_SCHEMAS[schemaName];
  if (!valid || valid.length === 0) {
    return;
  }
  const validSet = new Set(valid);

  const requested = fields
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const invalid = requested.filter((f) => !validSet.has(f.split('.')[0]));
  if (invalid.length === 0) {
    return;
  }

  const suggestionLines = invalid.map((f) => {
    const matches = closestMatches(f.split('.')[0], valid);
    return matches.length > 0
      ? `'${f}' is not a valid field. Did you mean: ${matches.join(', ')}?`
      : `'${f}' is not a valid field.`;
  });

  throw new MCPError(
    `Invalid 'fields' value for ${toolName}: ${invalid.join(', ')}`,
    ErrorCodes.INVALID_PARAMETERS,
    {
      tool: toolName,
      schema: schemaName,
      invalidFields: invalid,
      validFields: valid,
    },
    [...suggestionLines, ...ErrorSuggestions.validation],
  );
}
