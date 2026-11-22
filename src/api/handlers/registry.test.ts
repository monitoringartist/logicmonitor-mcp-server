/**
 * Drift test: the tool registry and the tool definitions must stay in sync.
 *
 * Every tool declared in `tools.ts` must have exactly one registered handler,
 * and every registered handler must correspond to a declared tool. This catches
 * the common drift of adding a tool definition without a handler (or vice versa).
 */

import { describe, it, expect } from '@jest/globals';
import { getLogicMonitorTools } from '../tools.js';
import { getRegisteredToolNames } from './index.js';

describe('tool handler registry', () => {
  const declaredNames = getLogicMonitorTools(false).map(t => t.name);
  const registeredNames = getRegisteredToolNames();

  it('registers a handler for every declared tool', () => {
    const registered = new Set(registeredNames);
    const missing = declaredNames.filter(name => !registered.has(name));
    expect(missing).toEqual([]);
  });

  it('does not register handlers for unknown tools', () => {
    const declared = new Set(declaredNames);
    const extra = registeredNames.filter(name => !declared.has(name));
    expect(extra).toEqual([]);
  });

  it('registers each tool exactly once (no duplicates)', () => {
    const seen = new Set<string>();
    const duplicates = registeredNames.filter(name => {
      if (seen.has(name)) return true;
      seen.add(name);
      return false;
    });
    expect(duplicates).toEqual([]);
  });

  it('has the same number of handlers as declared tools', () => {
    expect(registeredNames.length).toBe(declaredNames.length);
  });
});
