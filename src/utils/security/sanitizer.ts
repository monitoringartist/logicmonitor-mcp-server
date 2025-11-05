/**
 * Input Sanitization Utility
 * 
 * Provides methods to sanitize and validate user inputs to prevent injection attacks
 * and ensure data integrity when interacting with the LogicMonitor API.
 */

/**
 * InputSanitizer class for sanitizing various types of user inputs
 */
export class InputSanitizer {
  /**
   * Sanitize filter strings to prevent filter injection attacks
   * Removes dangerous characters and validates basic syntax
   * 
   * @param filter - The filter string to sanitize
   * @returns Sanitized filter string
   * 
   * @example
   * ```typescript
   * const sanitizer = new InputSanitizer();
   * const clean = sanitizer.sanitizeFilter('name:web*');
   * ```
   */
  sanitizeFilter(filter: string): string {
    if (!filter || typeof filter !== 'string') {
      return '';
    }

    // Remove HTML/XML tags and dangerous characters
    return filter
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/file:/gi, '')
      .trim()
      .substring(0, 1000); // Limit length to prevent DoS
  }

  /**
   * Sanitize device names to prevent special characters that might cause issues
   * Allows alphanumeric characters, spaces, hyphens, underscores, and periods
   * 
   * @param name - The device name to sanitize
   * @returns Sanitized device name
   * 
   * @example
   * ```typescript
   * const sanitizer = new InputSanitizer();
   * const clean = sanitizer.sanitizeDeviceName('web-server-01');
   * ```
   */
  sanitizeDeviceName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Allow alphanumeric, spaces, hyphens, underscores, periods
    return name
      .replace(/[^\w\s\-_.]/g, '')
      .trim()
      .substring(0, 255); // Max length for device names
  }

  /**
   * Sanitize group names
   * Similar to device names but allows forward slashes for path hierarchy
   * 
   * @param name - The group name to sanitize
   * @returns Sanitized group name
   */
  sanitizeGroupName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Allow alphanumeric, spaces, hyphens, underscores, periods, and forward slashes
    return name
      .replace(/[^\w\s\-_./]/g, '')
      .replace(/\.\.+/g, '.') // Prevent directory traversal with consecutive dots
      .replace(/\/+/g, '/') // Normalize multiple slashes
      .trim()
      .substring(0, 255);
  }

  /**
   * Sanitize display names (for users, alerts, etc.)
   * More permissive than device names but still prevents injection
   * 
   * @param name - The display name to sanitize
   * @returns Sanitized display name
   */
  sanitizeDisplayName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Remove HTML tags and script injections but allow most characters
    // Using multiple passes to handle nested/malformed tags and prevent XSS
    let sanitized = name;
    
    // Multi-pass script tag removal to handle all variants including malformed ones
    // Using comprehensive patterns that match any whitespace and attributes in closing tags
    for (let i = 0; i < 5; i++) {
      // Match script tags with any content and closing tags with whitespace/attributes
      sanitized = sanitized.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\b[^>]*>/gi, '');
      // Remove any remaining opening script tags
      sanitized = sanitized.replace(/<\s*script\b[^>]*>/gi, '');
      // Remove any remaining closing script tags with any attributes
      sanitized = sanitized.replace(/<\s*\/\s*script\b[^>]*>/gi, '');
    }
    
    // Remove all HTML tags (including malformed ones)
    for (let i = 0; i < 2; i++) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      sanitized = sanitized.replace(/</g, '&lt;');
      sanitized = sanitized.replace(/>/g, '&gt;');
    }
    
    // Remove dangerous protocols with multiple passes
    for (let i = 0; i < 3; i++) {
      sanitized = sanitized.replace(/javascript\s*:/gi, '');
      sanitized = sanitized.replace(/data\s*:/gi, '');
      sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    }
    
    return sanitized.trim().substring(0, 255);
  }

  /**
   * Sanitize description text
   * Allows more characters than names but prevents script injection
   * 
   * @param description - The description text to sanitize
   * @returns Sanitized description
   */
  sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') {
      return '';
    }

    // Remove script tags and dangerous protocols
    let sanitized = description;
    
    // Multi-pass script tag removal to handle all variants including malformed ones
    // Using comprehensive patterns that match any whitespace and attributes in closing tags
    for (let i = 0; i < 5; i++) {
      // Match script tags with any content and closing tags with whitespace/attributes
      sanitized = sanitized.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\b[^>]*>/gi, '');
      // Remove any remaining opening script tags
      sanitized = sanitized.replace(/<\s*script\b[^>]*>/gi, '');
      // Remove any remaining closing script tags with any attributes
      sanitized = sanitized.replace(/<\s*\/\s*script\b[^>]*>/gi, '');
    }
    
    // Remove dangerous protocols with multiple passes
    for (let i = 0; i < 3; i++) {
      sanitized = sanitized.replace(/javascript\s*:/gi, '');
      sanitized = sanitized.replace(/data\s*:/gi, '');
      sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    }
    
    // Remove event handlers (onclick, onerror, etc.) - multiple passes for nested attempts
    for (let i = 0; i < 3; i++) {
      sanitized = sanitized.replace(/\s*on\w+\s*=/gi, '');
      sanitized = sanitized.replace(/\s*on\s+\w+\s*=/gi, '');
    }
    
    return sanitized.trim().substring(0, 10000); // Larger limit for descriptions
  }

  /**
   * Sanitize IP addresses
   * Validates and sanitizes IPv4 and IPv6 addresses
   * 
   * @param ip - The IP address to sanitize
   * @returns Sanitized IP address or empty string if invalid
   */
  sanitizeIPAddress(ip: string): string {
    if (!ip || typeof ip !== 'string') {
      return '';
    }

    const trimmed = ip.trim();

    // Basic IPv4 pattern: 0-255.0-255.0-255.0-255
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    // Basic IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

    if (ipv4Pattern.test(trimmed)) {
      // Validate IPv4 octets are 0-255
      const octets = trimmed.split('.');
      if (octets.every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      })) {
        return trimmed;
      }
    } else if (ipv6Pattern.test(trimmed)) {
      return trimmed;
    }

    return '';
  }

  /**
   * Sanitize hostname
   * Validates and sanitizes domain names and hostnames
   * 
   * @param hostname - The hostname to sanitize
   * @returns Sanitized hostname
   */
  sanitizeHostname(hostname: string): string {
    if (!hostname || typeof hostname !== 'string') {
      return '';
    }

    // Allow alphanumeric, hyphens, and periods (standard hostname format)
    return hostname
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]/g, '')
      .replace(/\.\.+/g, '.') // Prevent multiple consecutive dots
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .trim()
      .substring(0, 253); // Max hostname length per RFC 1035
  }

  /**
   * Sanitize property names (for custom properties)
   * 
   * @param name - The property name to sanitize
   * @returns Sanitized property name
   */
  sanitizePropertyName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Allow alphanumeric, underscores, hyphens, periods
    return name
      .replace(/[^\w\-_.]/g, '')
      .trim()
      .substring(0, 255);
  }

  /**
   * Sanitize property values (for custom properties)
   * 
   * @param value - The property value to sanitize
   * @returns Sanitized property value
   */
  sanitizePropertyValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    const strValue = String(value);

    // Remove script injections but allow most characters - multiple passes
    let sanitized = strValue;
    
    // Multi-pass script tag removal to handle all variants including malformed ones
    // Using comprehensive patterns that match any whitespace and attributes in closing tags
    for (let i = 0; i < 5; i++) {
      // Match script tags with any content and closing tags with whitespace/attributes
      sanitized = sanitized.replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\b[^>]*>/gi, '');
      // Remove any remaining opening script tags
      sanitized = sanitized.replace(/<\s*script\b[^>]*>/gi, '');
      // Remove any remaining closing script tags with any attributes
      sanitized = sanitized.replace(/<\s*\/\s*script\b[^>]*>/gi, '');
    }
    
    // Remove dangerous protocols with multiple passes
    for (let i = 0; i < 3; i++) {
      sanitized = sanitized.replace(/javascript\s*:/gi, '');
      sanitized = sanitized.replace(/data\s*:/gi, '');
      sanitized = sanitized.replace(/vbscript\s*:/gi, '');
    }
    
    return sanitized.trim().substring(0, 10000);
  }

  /**
   * Sanitize numeric ID
   * Ensures the input is a valid positive integer
   * 
   * @param id - The ID to sanitize (string or number)
   * @returns Sanitized numeric ID or 0 if invalid
   */
  sanitizeId(id: string | number): number {
    if (typeof id === 'number') {
      return id >= 0 ? Math.floor(id) : 0;
    }

    if (typeof id === 'string') {
      const parsed = parseInt(id.trim(), 10);
      return !isNaN(parsed) && parsed >= 0 ? parsed : 0;
    }

    return 0;
  }

  /**
   * Sanitize sort field names
   * Prevents injection through sort parameters
   * 
   * @param field - The field name to sanitize
   * @returns Sanitized field name
   */
  sanitizeSortField(field: string): string {
    if (!field || typeof field !== 'string') {
      return '';
    }

    // Allow alphanumeric, underscores, periods, and optional + or - prefix
    const cleaned = field.trim();
    const prefix = cleaned.startsWith('+') || cleaned.startsWith('-') ? cleaned[0] : '';
    const fieldName = prefix ? cleaned.substring(1) : cleaned;

    const sanitized = fieldName
      .replace(/[^\w_.]/g, '')
      .substring(0, 100);

    return prefix + sanitized;
  }

  /**
   * Validate and sanitize offset/limit pagination parameters
   * 
   * @param value - The pagination value to sanitize
   * @param defaultValue - Default value if invalid (default: 0)
   * @param max - Maximum allowed value (default: 1000)
   * @returns Sanitized pagination value
   */
  sanitizePaginationValue(value: string | number | undefined, defaultValue: number = 0, max: number = 1000): number {
    if (value === undefined || value === null) {
      return defaultValue;
    }

    const num = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);

    if (isNaN(num) || num < 0) {
      return defaultValue;
    }

    return Math.min(num, max);
  }
}

/**
 * Singleton instance for convenience
 */
export const sanitizer = new InputSanitizer();

