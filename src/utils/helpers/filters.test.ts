/**
 * Tests for filter formatting utilities
 */

import { describe, it, expect } from '@jest/globals';
import { formatLogicMonitorFilter } from './filters.js';

describe('formatLogicMonitorFilter', () => {
  it('should handle empty/null/undefined filters', () => {
    expect(formatLogicMonitorFilter('')).toBe('');
    expect(formatLogicMonitorFilter(null as any)).toBeNull();
    expect(formatLogicMonitorFilter(undefined as any)).toBeUndefined();
  });

  it('should add quotes to string values', () => {
    expect(formatLogicMonitorFilter('name:test')).toBe('name:"test"');
    expect(formatLogicMonitorFilter('displayName:myserver')).toBe('displayName:"myserver"');
  });

  it('should not quote numeric values', () => {
    expect(formatLogicMonitorFilter('id>100')).toBe('id>100');
    expect(formatLogicMonitorFilter('count:42')).toBe('count:42');
  });

  it('should handle filters with wildcards', () => {
    expect(formatLogicMonitorFilter('displayName~*server*')).toBe('displayName~"*server*"');
    expect(formatLogicMonitorFilter('name:*prod*')).toBe('name:"*prod*"');
  });

  it('should preserve already quoted values', () => {
    expect(formatLogicMonitorFilter('name:"test"')).toBe('name:"test"');
    expect(formatLogicMonitorFilter('displayName:"*server*"')).toBe('displayName:"*server*"');
  });

  it('should handle multiple conditions with comma (AND)', () => {
    const filter = 'name:test,status:active';
    expect(formatLogicMonitorFilter(filter)).toBe('name:"test",status:"active"');
  });

  it('should handle multiple conditions with OR', () => {
    const filter = 'name:test || name:prod';
    expect(formatLogicMonitorFilter(filter)).toBe('name:"test" || name:"prod"');
  });

  it('should handle complex filters', () => {
    const filter = 'displayName~*server*,hostStatus:normal,id>100';
    expect(formatLogicMonitorFilter(filter)).toBe('displayName~"*server*",hostStatus:"normal",id>100');
  });

  it('should trim whitespace from values', () => {
    expect(formatLogicMonitorFilter('  name:test  ')).toBe('name:"test"');
  });

  it('should handle whitespace around operators', () => {
    // Whitespace around logical operators is preserved in the output
    expect(formatLogicMonitorFilter('name:test , status:active')).toBe('name:"test" , status:"active"');
    expect(formatLogicMonitorFilter('name:test,status:active')).toBe('name:"test",status:"active"');
  });

  it('should handle boolean values', () => {
    expect(formatLogicMonitorFilter('disableAlerting:false')).toBe('disableAlerting:false');
    expect(formatLogicMonitorFilter('active:true')).toBe('active:true');
  });

  it('should handle multiple values with pipe (OR within field)', () => {
    expect(formatLogicMonitorFilter('status:active|pending')).toBe('status:"active"|"pending"');
  });
});

