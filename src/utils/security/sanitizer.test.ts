import { InputSanitizer, sanitizer } from './sanitizer.js';

describe('InputSanitizer', () => {
  let inputSanitizer: InputSanitizer;

  beforeEach(() => {
    inputSanitizer = new InputSanitizer();
  });

  describe('sanitizeFilter', () => {
    it('should remove HTML tags', () => {
      const input = 'name:<script>alert(1)</script>web*';
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should remove data: protocol', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result.toLowerCase()).not.toContain('data:');
    });

    it('should trim whitespace', () => {
      const input = '  name:web*  ';
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result).toBe('name:web*');
    });

    it('should allow valid filter syntax', () => {
      const input = 'name:web*,displayName~server';
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result).toBe('name:web*,displayName~server');
    });

    it('should limit length to prevent DoS', () => {
      const input = 'a'.repeat(2000);
      const result = inputSanitizer.sanitizeFilter(input);
      expect(result.length).toBe(1000);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeFilter('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(inputSanitizer.sanitizeFilter(null as any)).toBe('');
      expect(inputSanitizer.sanitizeFilter(undefined as any)).toBe('');
    });
  });

  describe('sanitizeDeviceName', () => {
    it('should allow valid device names', () => {
      const input = 'web-server-01';
      const result = inputSanitizer.sanitizeDeviceName(input);
      expect(result).toBe('web-server-01');
    });

    it('should allow alphanumeric, spaces, hyphens, underscores, periods', () => {
      const input = 'web_server.prod 01';
      const result = inputSanitizer.sanitizeDeviceName(input);
      expect(result).toBe('web_server.prod 01');
    });

    it('should remove special characters', () => {
      const input = 'web@server#01!';
      const result = inputSanitizer.sanitizeDeviceName(input);
      expect(result).toBe('webserver01');
    });

    it('should limit length to 255 characters', () => {
      const input = 'a'.repeat(300);
      const result = inputSanitizer.sanitizeDeviceName(input);
      expect(result.length).toBe(255);
    });

    it('should trim whitespace', () => {
      const input = '  web-server  ';
      const result = inputSanitizer.sanitizeDeviceName(input);
      expect(result).toBe('web-server');
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeDeviceName('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(inputSanitizer.sanitizeDeviceName(null as any)).toBe('');
      expect(inputSanitizer.sanitizeDeviceName(undefined as any)).toBe('');
    });
  });

  describe('sanitizeGroupName', () => {
    it('should allow forward slashes for hierarchy', () => {
      const input = 'Devices/Production/Web Servers';
      const result = inputSanitizer.sanitizeGroupName(input);
      expect(result).toBe('Devices/Production/Web Servers');
    });

    it('should prevent directory traversal', () => {
      const input = '../../../etc/passwd';
      const result = inputSanitizer.sanitizeGroupName(input);
      expect(result).not.toContain('..');
    });

    it('should normalize multiple slashes', () => {
      const input = 'Devices//Production///Web';
      const result = inputSanitizer.sanitizeGroupName(input);
      expect(result).toBe('Devices/Production/Web');
    });

    it('should remove special characters except allowed ones', () => {
      const input = 'Devices@Production#Web!';
      const result = inputSanitizer.sanitizeGroupName(input);
      expect(result).toBe('DevicesProductionWeb');
    });

    it('should limit length to 255 characters', () => {
      const input = 'a'.repeat(300);
      const result = inputSanitizer.sanitizeGroupName(input);
      expect(result.length).toBe(255);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeGroupName('')).toBe('');
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should remove script tags', () => {
      const input = 'John <script>alert(1)</script> Doe';
      const result = inputSanitizer.sanitizeDisplayName(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      // Angle brackets removed, tag names remain
      expect(result).toBe('John scriptalert(1)/script Doe');
    });

    it('should remove HTML tags', () => {
      const input = 'John <b>Doe</b>';
      const result = inputSanitizer.sanitizeDisplayName(input);
      // Angle brackets removed, tag names remain
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toBe('John bDoe/b');
    });

    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert(1)';
      const result = inputSanitizer.sanitizeDisplayName(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should allow special characters in names', () => {
      const input = "John O'Brien (CEO)";
      const result = inputSanitizer.sanitizeDisplayName(input);
      expect(result).toBe("John O'Brien (CEO)");
    });

    it('should limit length to 255 characters', () => {
      const input = 'a'.repeat(300);
      const result = inputSanitizer.sanitizeDisplayName(input);
      expect(result.length).toBe(255);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeDisplayName('')).toBe('');
    });
  });

  describe('sanitizeDescription', () => {
    it('should remove script tags', () => {
      const input = 'Description with <script>alert(1)</script> code';
      const result = inputSanitizer.sanitizeDescription(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove event handlers', () => {
      const input = 'Click <div onclick="alert(1)">here</div>';
      const result = inputSanitizer.sanitizeDescription(input);
      expect(result.toLowerCase()).not.toContain('onclick=');
    });

    it('should remove dangerous protocols', () => {
      const input = 'Link: javascript:void(0)';
      const result = inputSanitizer.sanitizeDescription(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should allow longer text than names', () => {
      const input = 'a'.repeat(5000);
      const result = inputSanitizer.sanitizeDescription(input);
      expect(result.length).toBe(5000);
    });

    it('should limit length to 10000 characters', () => {
      const input = 'a'.repeat(15000);
      const result = inputSanitizer.sanitizeDescription(input);
      expect(result.length).toBe(10000);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeDescription('')).toBe('');
    });
  });

  describe('sanitizeIPAddress', () => {
    it('should accept valid IPv4 addresses', () => {
      expect(inputSanitizer.sanitizeIPAddress('192.168.1.1')).toBe('192.168.1.1');
      expect(inputSanitizer.sanitizeIPAddress('10.0.0.1')).toBe('10.0.0.1');
      expect(inputSanitizer.sanitizeIPAddress('255.255.255.255')).toBe('255.255.255.255');
      expect(inputSanitizer.sanitizeIPAddress('0.0.0.0')).toBe('0.0.0.0');
    });

    it('should reject invalid IPv4 addresses', () => {
      expect(inputSanitizer.sanitizeIPAddress('256.1.1.1')).toBe('');
      expect(inputSanitizer.sanitizeIPAddress('192.168.1')).toBe('');
      expect(inputSanitizer.sanitizeIPAddress('192.168.1.1.1')).toBe('');
      expect(inputSanitizer.sanitizeIPAddress('192.168.-1.1')).toBe('');
    });

    it('should accept valid IPv6 addresses', () => {
      expect(inputSanitizer.sanitizeIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBeTruthy();
      expect(inputSanitizer.sanitizeIPAddress('::1')).toBe('::1');
      expect(inputSanitizer.sanitizeIPAddress('fe80::1')).toBe('fe80::1');
    });

    it('should trim whitespace', () => {
      expect(inputSanitizer.sanitizeIPAddress('  192.168.1.1  ')).toBe('192.168.1.1');
    });

    it('should reject malicious input', () => {
      expect(inputSanitizer.sanitizeIPAddress('192.168.1.1; DROP TABLE')).toBe('');
      expect(inputSanitizer.sanitizeIPAddress('<script>alert(1)</script>')).toBe('');
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeIPAddress('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(inputSanitizer.sanitizeIPAddress(null as any)).toBe('');
      expect(inputSanitizer.sanitizeIPAddress(undefined as any)).toBe('');
    });
  });

  describe('sanitizeHostname', () => {
    it('should accept valid hostnames', () => {
      expect(inputSanitizer.sanitizeHostname('example.com')).toBe('example.com');
      expect(inputSanitizer.sanitizeHostname('web-server-01.example.com')).toBe('web-server-01.example.com');
      expect(inputSanitizer.sanitizeHostname('localhost')).toBe('localhost');
    });

    it('should convert to lowercase', () => {
      expect(inputSanitizer.sanitizeHostname('EXAMPLE.COM')).toBe('example.com');
    });

    it('should remove invalid characters', () => {
      expect(inputSanitizer.sanitizeHostname('example@com')).toBe('examplecom');
      expect(inputSanitizer.sanitizeHostname('example!.com')).toBe('example.com');
    });

    it('should prevent multiple consecutive dots', () => {
      expect(inputSanitizer.sanitizeHostname('example..com')).toBe('example.com');
    });

    it('should remove leading/trailing dots', () => {
      expect(inputSanitizer.sanitizeHostname('.example.com.')).toBe('example.com');
    });

    it('should limit length to 253 characters', () => {
      const input = 'a'.repeat(300) + '.com';
      const result = inputSanitizer.sanitizeHostname(input);
      expect(result.length).toBe(253);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeHostname('')).toBe('');
    });
  });

  describe('sanitizePropertyName', () => {
    it('should allow valid property names', () => {
      expect(inputSanitizer.sanitizePropertyName('custom.property')).toBe('custom.property');
      expect(inputSanitizer.sanitizePropertyName('my_property')).toBe('my_property');
      expect(inputSanitizer.sanitizePropertyName('prop-name')).toBe('prop-name');
    });

    it('should remove invalid characters', () => {
      expect(inputSanitizer.sanitizePropertyName('prop@name')).toBe('propname');
      expect(inputSanitizer.sanitizePropertyName('prop name')).toBe('propname');
    });

    it('should limit length to 255 characters', () => {
      const input = 'a'.repeat(300);
      const result = inputSanitizer.sanitizePropertyName(input);
      expect(result.length).toBe(255);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizePropertyName('')).toBe('');
    });
  });

  describe('sanitizePropertyValue', () => {
    it('should remove script tags', () => {
      const input = 'Value <script>alert(1)</script> here';
      const result = inputSanitizer.sanitizePropertyValue(input);
      expect(result).not.toContain('<script>');
    });

    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert(1)';
      const result = inputSanitizer.sanitizePropertyValue(input);
      expect(result.toLowerCase()).not.toContain('javascript:');
    });

    it('should allow special characters', () => {
      const input = 'Value with @#$%^&*() characters';
      const result = inputSanitizer.sanitizePropertyValue(input);
      expect(result).toContain('@#$%^&*()');
    });

    it('should limit length to 10000 characters', () => {
      const input = 'a'.repeat(15000);
      const result = inputSanitizer.sanitizePropertyValue(input);
      expect(result.length).toBe(10000);
    });

    it('should handle null/undefined', () => {
      expect(inputSanitizer.sanitizePropertyValue(null as any)).toBe('');
      expect(inputSanitizer.sanitizePropertyValue(undefined as any)).toBe('');
    });

    it('should convert non-string values to string', () => {
      expect(inputSanitizer.sanitizePropertyValue(123 as any)).toBe('123');
      expect(inputSanitizer.sanitizePropertyValue(true as any)).toBe('true');
    });
  });

  describe('sanitizeId', () => {
    it('should accept valid numeric IDs', () => {
      expect(inputSanitizer.sanitizeId(123)).toBe(123);
      expect(inputSanitizer.sanitizeId(0)).toBe(0);
      expect(inputSanitizer.sanitizeId(999999)).toBe(999999);
    });

    it('should accept string numeric IDs', () => {
      expect(inputSanitizer.sanitizeId('123')).toBe(123);
      expect(inputSanitizer.sanitizeId('456')).toBe(456);
    });

    it('should floor decimal numbers', () => {
      expect(inputSanitizer.sanitizeId(123.45)).toBe(123);
      expect(inputSanitizer.sanitizeId(999.99)).toBe(999);
    });

    it('should reject negative numbers', () => {
      expect(inputSanitizer.sanitizeId(-1)).toBe(0);
      expect(inputSanitizer.sanitizeId('-123')).toBe(0);
    });

    it('should reject non-numeric strings', () => {
      expect(inputSanitizer.sanitizeId('abc')).toBe(0);
      expect(inputSanitizer.sanitizeId('123abc')).toBe(123);
    });

    it('should trim whitespace in string IDs', () => {
      expect(inputSanitizer.sanitizeId('  123  ')).toBe(123);
    });

    it('should handle null/undefined', () => {
      expect(inputSanitizer.sanitizeId(null as any)).toBe(0);
      expect(inputSanitizer.sanitizeId(undefined as any)).toBe(0);
    });
  });

  describe('sanitizeSortField', () => {
    it('should allow valid field names', () => {
      expect(inputSanitizer.sanitizeSortField('name')).toBe('name');
      expect(inputSanitizer.sanitizeSortField('device_name')).toBe('device_name');
      expect(inputSanitizer.sanitizeSortField('alert.severity')).toBe('alert.severity');
    });

    it('should preserve + and - prefixes', () => {
      expect(inputSanitizer.sanitizeSortField('+name')).toBe('+name');
      expect(inputSanitizer.sanitizeSortField('-name')).toBe('-name');
    });

    it('should remove invalid characters', () => {
      expect(inputSanitizer.sanitizeSortField('name@field')).toBe('namefield');
      expect(inputSanitizer.sanitizeSortField('name field')).toBe('namefield');
    });

    it('should limit length to 100 characters', () => {
      const input = 'a'.repeat(200);
      const result = inputSanitizer.sanitizeSortField(input);
      expect(result.length).toBe(100);
    });

    it('should handle prefix with long field name', () => {
      const input = '+' + 'a'.repeat(200);
      const result = inputSanitizer.sanitizeSortField(input);
      expect(result.length).toBe(101); // + prefix + 100 chars
      expect(result.startsWith('+')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(inputSanitizer.sanitizeSortField('')).toBe('');
    });
  });

  describe('sanitizePaginationValue', () => {
    it('should accept valid numbers', () => {
      expect(inputSanitizer.sanitizePaginationValue(10)).toBe(10);
      expect(inputSanitizer.sanitizePaginationValue(100)).toBe(100);
      expect(inputSanitizer.sanitizePaginationValue(0)).toBe(0);
    });

    it('should accept string numbers', () => {
      expect(inputSanitizer.sanitizePaginationValue('10')).toBe(10);
      expect(inputSanitizer.sanitizePaginationValue('100')).toBe(100);
    });

    it('should enforce maximum value', () => {
      expect(inputSanitizer.sanitizePaginationValue(2000)).toBe(1000);
      expect(inputSanitizer.sanitizePaginationValue('5000')).toBe(1000);
    });

    it('should use custom maximum', () => {
      expect(inputSanitizer.sanitizePaginationValue(150, 0, 100)).toBe(100);
      expect(inputSanitizer.sanitizePaginationValue(50, 0, 100)).toBe(50);
    });

    it('should reject negative numbers', () => {
      expect(inputSanitizer.sanitizePaginationValue(-10)).toBe(0);
      expect(inputSanitizer.sanitizePaginationValue('-10')).toBe(0);
    });

    it('should use default value for invalid input', () => {
      expect(inputSanitizer.sanitizePaginationValue('abc')).toBe(0);
      expect(inputSanitizer.sanitizePaginationValue('abc', 50)).toBe(50);
    });

    it('should use default value for undefined', () => {
      expect(inputSanitizer.sanitizePaginationValue(undefined)).toBe(0);
      expect(inputSanitizer.sanitizePaginationValue(undefined, 25)).toBe(25);
    });

    it('should handle null', () => {
      expect(inputSanitizer.sanitizePaginationValue(null as any)).toBe(0);
      expect(inputSanitizer.sanitizePaginationValue(null as any, 25)).toBe(25);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(sanitizer).toBeInstanceOf(InputSanitizer);
    });

    it('should work with singleton instance', () => {
      const result = sanitizer.sanitizeDeviceName('web-server-01');
      expect(result).toBe('web-server-01');
    });
  });
});

