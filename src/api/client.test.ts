/**
 * Tests for LogicMonitor API Client
 */

import { describe, it, expect } from '@jest/globals';
import { escapeFilterValue } from './client.js';

describe('LogicMonitor Client Utils', () => {
  describe('escapeFilterValue', () => {
    it('should escape parentheses', () => {
      expect(escapeFilterValue('test (value)')).toBe('test \\(value\\)');
      expect(escapeFilterValue('(test)')).toBe('\\(test\\)');
    });

    it('should escape colons', () => {
      expect(escapeFilterValue('test:value')).toBe('test\\:value');
    });

    it('should escape commas', () => {
      expect(escapeFilterValue('test,value')).toBe('test\\,value');
    });

    it('should escape tildes', () => {
      expect(escapeFilterValue('test~value')).toBe('test\\~value');
    });

    it('should escape quotes', () => {
      expect(escapeFilterValue('test"value')).toBe('test\\"value');
    });

    it('should escape backslashes', () => {
      expect(escapeFilterValue('test\\value')).toBe('test\\\\value');
    });

    it('should NOT escape asterisks (wildcards)', () => {
      expect(escapeFilterValue('*test*')).toBe('*test*');
      expect(escapeFilterValue('test*value')).toBe('test*value');
    });

    it('should handle multiple special characters', () => {
      expect(escapeFilterValue('test:value,name~"data"')).toBe('test\\:value\\,name\\~\\"data\\"');
    });

    it('should handle empty string', () => {
      expect(escapeFilterValue('')).toBe('');
    });

    it('should handle strings with no special characters', () => {
      expect(escapeFilterValue('testvalue')).toBe('testvalue');
    });
  });
});

