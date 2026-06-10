import { validateFields } from './validate-fields.js';
import { FIELD_SCHEMAS, TOOL_FIELD_SCHEMA } from '../../api/field-schemas.js';
import { MCPError, ErrorCodes } from '../core/error-handler.js';

describe('validateFields', () => {
  describe('no-op cases', () => {
    it('does nothing when fields is undefined', () => {
      expect(() => validateFields('list_resources', undefined)).not.toThrow();
    });

    it('does nothing when fields is empty or whitespace', () => {
      expect(() => validateFields('list_resources', '')).not.toThrow();
      expect(() => validateFields('list_resources', '   ')).not.toThrow();
    });

    it('does nothing when fields is not a string', () => {
      expect(() => validateFields('list_resources', 123)).not.toThrow();
      expect(() => validateFields('list_resources', ['id'])).not.toThrow();
    });

    it('does nothing for tools without a known schema', () => {
      expect(() =>
        validateFields('some_unmapped_tool', 'totallyBogusField'),
      ).not.toThrow();
    });
  });

  describe('valid fields', () => {
    it('accepts a single valid field', () => {
      expect(() => validateFields('list_resources', 'id')).not.toThrow();
    });

    it('accepts a comma-separated list of valid fields', () => {
      expect(() =>
        validateFields('list_resources', 'id,displayName,name,hostStatus'),
      ).not.toThrow();
    });

    it('tolerates surrounding whitespace', () => {
      expect(() =>
        validateFields('list_resources', ' id , displayName '),
      ).not.toThrow();
    });

    it('accepts sub-field selectors by validating the top-level segment', () => {
      expect(() =>
        validateFields('list_resources', 'customProperties.name'),
      ).not.toThrow();
    });

    it('validates fields for a get-by-id tool sharing the same schema', () => {
      expect(() => validateFields('get_alert', 'id,severity,acked')).not.toThrow();
    });
  });

  describe('invalid fields', () => {
    it('throws MCPError with INVALID_PARAMETERS for an unknown field', () => {
      expect.assertions(3);
      try {
        validateFields('list_resources', 'id,bogusField');
      } catch (err) {
        expect(err).toBeInstanceOf(MCPError);
        expect((err as MCPError).code).toBe(ErrorCodes.INVALID_PARAMETERS);
        expect((err as MCPError).details.invalidFields).toEqual(['bogusField']);
      }
    });

    it('reports all invalid fields at once', () => {
      try {
        validateFields('list_resources', 'foo,id,bar');
        throw new Error('should have thrown');
      } catch (err) {
        expect((err as MCPError).details.invalidFields).toEqual(['foo', 'bar']);
      }
    });

    it('suggests the closest valid field for a typo', () => {
      try {
        validateFields('list_resources', 'displaName');
        throw new Error('should have thrown');
      } catch (err) {
        const suggestions = (err as MCPError).suggestions ?? [];
        expect(suggestions.some((s) => s.includes('displayName'))).toBe(true);
      }
    });

    it('rejects an invalid top-level segment of a sub-field selector', () => {
      expect(() =>
        validateFields('list_resources', 'bogus.name'),
      ).toThrow(MCPError);
    });
  });

  describe('generated schema integrity', () => {
    it('maps every tool to an existing schema with fields', () => {
      for (const [tool, schema] of Object.entries(TOOL_FIELD_SCHEMA)) {
        expect(FIELD_SCHEMAS[schema]).toBeDefined();
        expect(FIELD_SCHEMAS[schema].length).toBeGreaterThan(0);
        expect(typeof tool).toBe('string');
      }
    });

    it('includes the core device fields', () => {
      expect(FIELD_SCHEMAS.Device).toContain('id');
      expect(FIELD_SCHEMAS.Device).toContain('displayName');
    });
  });
});
