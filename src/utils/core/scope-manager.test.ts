/**
 * Tests for Scope Manager
 */

import { describe, it, expect } from '@jest/globals';
import {
  ScopeManager,
  hasScopes,
  getMissingScopes,
  SCOPE_DEFINITIONS,
  TOOL_SCOPE_REQUIREMENTS,
  SCOPE_HIERARCHY,
} from './scope-manager.js';

describe('Scope Manager', () => {
  describe('parseScopes', () => {
    it('should parse space-separated scopes', () => {
      const scopes = ScopeManager.parseScopes('mcp:tools lm:read lm:write');
      expect(scopes).toEqual(['mcp:tools', 'lm:read', 'lm:write']);
    });

    it('should handle empty string', () => {
      const scopes = ScopeManager.parseScopes('');
      expect(scopes).toEqual([]);
    });

    it('should handle undefined', () => {
      const scopes = ScopeManager.parseScopes(undefined);
      expect(scopes).toEqual([]);
    });

    it('should filter empty scopes', () => {
      const scopes = ScopeManager.parseScopes('mcp:tools  lm:read');
      expect(scopes).toEqual(['mcp:tools', 'lm:read']);
    });

    it('should handle single scope', () => {
      const scopes = ScopeManager.parseScopes('mcp:tools');
      expect(scopes).toEqual(['mcp:tools']);
    });
  });

  describe('expandScopes', () => {
    it('should expand admin scope to include write and read', () => {
      const expanded = ScopeManager.expandScopes(['lm:admin']);
      expect(expanded).toContain('lm:admin');
      expect(expanded).toContain('lm:write');
      expect(expanded).toContain('lm:read');
    });

    it('should expand write scope to include read', () => {
      const expanded = ScopeManager.expandScopes(['lm:write']);
      expect(expanded).toContain('lm:write');
      expect(expanded).toContain('lm:read');
    });

    it('should expand device write scope to include device read', () => {
      const expanded = ScopeManager.expandScopes(['lm:devices:write']);
      expect(expanded).toContain('lm:devices:write');
      expect(expanded).toContain('lm:devices:read');
    });

    it('should not expand scopes without hierarchy', () => {
      const expanded = ScopeManager.expandScopes(['mcp:tools']);
      expect(expanded).toEqual(['mcp:tools']);
    });

    it('should handle multiple scopes', () => {
      const expanded = ScopeManager.expandScopes(['mcp:tools', 'lm:admin']);
      expect(expanded).toContain('mcp:tools');
      expect(expanded).toContain('lm:admin');
      expect(expanded).toContain('lm:write');
      expect(expanded).toContain('lm:read');
    });

    it('should not duplicate scopes', () => {
      const expanded = ScopeManager.expandScopes(['lm:admin', 'lm:write']);
      const readCount = expanded.filter(s => s === 'lm:read').length;
      expect(readCount).toBe(1);
    });
  });

  describe('hasRequiredScopes', () => {
    it('should return true when user has all required scopes', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        ['mcp:tools', 'lm:read'],
        ['mcp:tools', 'lm:read']
      );
      expect(hasAll).toBe(true);
    });

    it('should return false when user missing required scopes', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        ['mcp:tools'],
        ['mcp:tools', 'lm:read']
      );
      expect(hasAll).toBe(false);
    });

    it('should consider scope hierarchy', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        ['lm:admin'],
        ['lm:read']
      );
      expect(hasAll).toBe(true);
    });

    it('should handle empty user scopes', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        [],
        ['mcp:tools']
      );
      expect(hasAll).toBe(false);
    });

    it('should handle empty required scopes', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        ['mcp:tools'],
        []
      );
      expect(hasAll).toBe(true);
    });

    it('should work with write scope implying read', () => {
      const hasAll = ScopeManager.hasRequiredScopes(
        ['lm:write'],
        ['lm:read']
      );
      expect(hasAll).toBe(true);
    });
  });

  describe('getToolScopes', () => {
    it('should return scopes for known tool', () => {
      const scopes = ScopeManager.getToolScopes('list_alerts');
      expect(scopes).toEqual(['mcp:tools', 'lm:alerts:read']);
    });

    it('should return default scope for unknown tool', () => {
      const scopes = ScopeManager.getToolScopes('unknown_tool');
      expect(scopes).toEqual(['mcp:tools']);
    });

    it('should return write scopes for write operations', () => {
      const scopes = ScopeManager.getToolScopes('acknowledge_alert');
      expect(scopes).toContain('lm:alerts:write');
    });

    it('should return admin scopes for admin operations', () => {
      const scopes = ScopeManager.getToolScopes('list_users');
      expect(scopes).toContain('lm:admin');
    });
  });

  describe('getMissingScopes', () => {
    it('should return empty array when all scopes present', () => {
      const missing = ScopeManager.getMissingScopes(
        ['mcp:tools', 'lm:read'],
        ['mcp:tools']
      );
      expect(missing).toEqual([]);
    });

    it('should return missing scopes', () => {
      const missing = ScopeManager.getMissingScopes(
        ['mcp:tools'],
        ['mcp:tools', 'lm:read', 'lm:write']
      );
      expect(missing).toContain('lm:read');
      expect(missing).toContain('lm:write');
    });

    it('should consider scope hierarchy', () => {
      const missing = ScopeManager.getMissingScopes(
        ['lm:admin'],
        ['lm:read']
      );
      expect(missing).toEqual([]);
    });

    it('should return all required scopes when user has none', () => {
      const missing = ScopeManager.getMissingScopes(
        [],
        ['mcp:tools', 'lm:read']
      );
      expect(missing).toEqual(['mcp:tools', 'lm:read']);
    });
  });

  describe('validateToolScopes', () => {
    it('should validate tool with sufficient scopes', () => {
      const result = ScopeManager.validateToolScopes(
        'list_alerts',
        'mcp:tools lm:alerts:read'
      );
      expect(result.valid).toBe(true);
      expect(result.missingScopes).toEqual([]);
    });

    it('should detect insufficient scopes', () => {
      const result = ScopeManager.validateToolScopes(
        'list_alerts',
        'mcp:tools'
      );
      expect(result.valid).toBe(false);
      expect(result.missingScopes).toContain('lm:alerts:read');
    });

    it('should work with undefined scopes', () => {
      const result = ScopeManager.validateToolScopes('list_alerts', undefined);
      expect(result.valid).toBe(false);
      expect(result.requiredScopes).toEqual(['mcp:tools', 'lm:alerts:read']);
    });

    it('should consider hierarchy in validation', () => {
      const result = ScopeManager.validateToolScopes(
        'list_alerts',
        'lm:admin'
      );
      expect(result.valid).toBe(false); // needs mcp:tools
      expect(result.missingScopes).toContain('mcp:tools');
    });

    it('should validate write operations', () => {
      const result = ScopeManager.validateToolScopes(
        'acknowledge_alert',
        'mcp:tools lm:alerts:write'
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('getRecommendedScopes', () => {
    it('should combine user and missing scopes', () => {
      const recommended = ScopeManager.getRecommendedScopes(
        ['mcp:tools'],
        ['lm:read']
      );
      expect(recommended).toContain('mcp:tools');
      expect(recommended).toContain('lm:read');
    });

    it('should not duplicate scopes', () => {
      const recommended = ScopeManager.getRecommendedScopes(
        ['mcp:tools', 'lm:read'],
        ['lm:read']
      );
      const readCount = recommended.filter(s => s === 'lm:read').length;
      expect(readCount).toBe(1);
    });

    it('should handle empty user scopes', () => {
      const recommended = ScopeManager.getRecommendedScopes(
        [],
        ['mcp:tools']
      );
      expect(recommended).toEqual(['mcp:tools']);
    });
  });

  describe('isWriteScope', () => {
    it('should identify write scopes', () => {
      expect(ScopeManager.isWriteScope('lm:write')).toBe(true);
      expect(ScopeManager.isWriteScope('lm:devices:write')).toBe(true);
      expect(ScopeManager.isWriteScope('lm:alerts:write')).toBe(true);
    });

    it('should identify admin as write scope', () => {
      expect(ScopeManager.isWriteScope('lm:admin')).toBe(true);
      expect(ScopeManager.isWriteScope('lm:users:manage')).toBe(true);
    });

    it('should not identify read scopes as write', () => {
      expect(ScopeManager.isWriteScope('lm:read')).toBe(false);
      expect(ScopeManager.isWriteScope('lm:devices:read')).toBe(false);
      expect(ScopeManager.isWriteScope('mcp:tools')).toBe(false);
    });
  });

  describe('isAdminScope', () => {
    it('should identify admin scopes', () => {
      expect(ScopeManager.isAdminScope('lm:admin')).toBe(true);
      expect(ScopeManager.isAdminScope('lm:users:manage')).toBe(true);
    });

    it('should not identify non-admin scopes', () => {
      expect(ScopeManager.isAdminScope('lm:write')).toBe(false);
      expect(ScopeManager.isAdminScope('lm:read')).toBe(false);
      expect(ScopeManager.isAdminScope('mcp:tools')).toBe(false);
    });
  });

  describe('getScopeDescription', () => {
    it('should return description for known scope', () => {
      const desc = ScopeManager.getScopeDescription('mcp:tools');
      expect(desc).toBe('Access to MCP tools');
    });

    it('should return scope name for unknown scope', () => {
      const desc = ScopeManager.getScopeDescription('unknown:scope');
      expect(desc).toBe('unknown:scope');
    });

    it('should return descriptions for all defined scopes', () => {
      Object.keys(SCOPE_DEFINITIONS).forEach(scope => {
        const desc = ScopeManager.getScopeDescription(scope);
        expect(desc).toBeDefined();
        expect(desc.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getAvailableScopes', () => {
    it('should return all defined scopes', () => {
      const scopes = ScopeManager.getAvailableScopes();
      expect(scopes.length).toBeGreaterThan(0);
      expect(scopes).toContain('mcp:tools');
      expect(scopes).toContain('lm:read');
      expect(scopes).toContain('lm:write');
    });

    it('should include all scope categories', () => {
      const scopes = ScopeManager.getAvailableScopes();
      expect(scopes.some(s => s.includes('read'))).toBe(true);
      expect(scopes.some(s => s.includes('write'))).toBe(true);
      expect(scopes.some(s => s.includes('admin'))).toBe(true);
    });
  });

  describe('getScopesByCategory', () => {
    it('should return core scopes', () => {
      const scopes = ScopeManager.getScopesByCategory('core');
      expect(scopes).toContain('mcp:tools');
    });

    it('should return read scopes', () => {
      const scopes = ScopeManager.getScopesByCategory('read');
      expect(scopes.every(s => s.includes('read'))).toBe(true);
    });

    it('should return write scopes', () => {
      const scopes = ScopeManager.getScopesByCategory('write');
      expect(scopes.every(s => s.includes('write'))).toBe(true);
    });

    it('should return admin scopes', () => {
      const scopes = ScopeManager.getScopesByCategory('admin');
      expect(scopes).toContain('lm:admin');
      expect(scopes).toContain('lm:users:manage');
    });
  });

  describe('formatScopes', () => {
    it('should format single scope', () => {
      const formatted = ScopeManager.formatScopes(['mcp:tools']);
      expect(formatted).toBe('"mcp:tools"');
    });

    it('should format multiple scopes', () => {
      const formatted = ScopeManager.formatScopes(['mcp:tools', 'lm:read']);
      expect(formatted).toBe('"mcp:tools", "lm:read"');
    });

    it('should handle empty array', () => {
      const formatted = ScopeManager.formatScopes([]);
      expect(formatted).toBe('');
    });
  });

  describe('Helper functions', () => {
    describe('hasScopes', () => {
      it('should check if user has required scopes', () => {
        expect(hasScopes('mcp:tools lm:read', ['mcp:tools'])).toBe(true);
        expect(hasScopes('mcp:tools', ['mcp:tools', 'lm:read'])).toBe(false);
      });

      it('should handle undefined user scopes', () => {
        expect(hasScopes(undefined, ['mcp:tools'])).toBe(false);
      });
    });

    describe('getMissingScopes', () => {
      it('should get missing scopes', () => {
        const missing = getMissingScopes('mcp:tools', ['mcp:tools', 'lm:read']);
        expect(missing).toContain('lm:read');
      });

      it('should handle undefined user scopes', () => {
        const missing = getMissingScopes(undefined, ['mcp:tools']);
        expect(missing).toEqual(['mcp:tools']);
      });
    });
  });

  describe('Scope hierarchy validation', () => {
    it('should validate complete hierarchy chain', () => {
      // lm:admin -> lm:write -> lm:read
      const expanded = ScopeManager.expandScopes(['lm:admin']);
      expect(expanded).toContain('lm:admin');
      expect(expanded).toContain('lm:write');
      expect(expanded).toContain('lm:read');
    });

    it('should validate device scope hierarchy', () => {
      const expanded = ScopeManager.expandScopes(['lm:devices:write']);
      expect(expanded).toContain('lm:devices:write');
      expect(expanded).toContain('lm:devices:read');
    });

    it('should validate alert scope hierarchy', () => {
      const expanded = ScopeManager.expandScopes(['lm:alerts:write']);
      expect(expanded).toContain('lm:alerts:write');
      expect(expanded).toContain('lm:alerts:read');
    });

    it('should validate dashboard scope hierarchy', () => {
      const expanded = ScopeManager.expandScopes(['lm:dashboards:write']);
      expect(expanded).toContain('lm:dashboards:write');
      expect(expanded).toContain('lm:dashboards:read');
    });
  });

  describe('Tool scope requirements', () => {
    it('should have requirements for list operations', () => {
      expect(TOOL_SCOPE_REQUIREMENTS['list_resources']).toContain('lm:read');
      expect(TOOL_SCOPE_REQUIREMENTS['list_alerts']).toContain('lm:alerts:read');
      expect(TOOL_SCOPE_REQUIREMENTS['list_dashboards']).toContain('lm:dashboards:read');
    });

    it('should have requirements for write operations', () => {
      expect(TOOL_SCOPE_REQUIREMENTS['acknowledge_alert']).toContain('lm:alerts:write');
      expect(TOOL_SCOPE_REQUIREMENTS['add_device']).toContain('lm:devices:write');
      expect(TOOL_SCOPE_REQUIREMENTS['update_device']).toContain('lm:devices:write');
    });

    it('should have requirements for admin operations', () => {
      expect(TOOL_SCOPE_REQUIREMENTS['list_users']).toContain('lm:admin');
      expect(TOOL_SCOPE_REQUIREMENTS['create_user']).toContain('lm:users:manage');
    });

    it('should require mcp:tools for all operations', () => {
      Object.values(TOOL_SCOPE_REQUIREMENTS).forEach(scopes => {
        expect(scopes).toContain('mcp:tools');
      });
    });
  });
});

