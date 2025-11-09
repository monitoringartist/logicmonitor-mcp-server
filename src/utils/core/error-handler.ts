/**
 * Enhanced error handling for MCP server
 * Provides structured errors with actionable suggestions
 */

/**
 * MCP Error class with actionable guidance
 * Extends standard Error with additional context and suggestions
 */
export class MCPError extends Error {
  /**
   * @param message Human-readable error message
   * @param code Machine-readable error code (e.g., 'DEVICE_CREATE_FAILED')
   * @param details Additional error context and details
   * @param suggestions Array of actionable suggestions to resolve the error
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
    public readonly suggestions?: string[],
  ) {
    super(message);
    this.name = 'MCPError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MCPError);
    }
  }

  /**
   * Convert error to MCP-compatible response format
   */
  toMCPResponse() {
    return {
      error: this.code,
      message: this.message,
      details: this.details,
      suggestions: this.suggestions,
    };
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}

/**
 * Error codes for common MCP server errors
 */
export const ErrorCodes = {
  // Authentication & Authorization
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Resource/Device Operations
  DEVICE_CREATE_FAILED: 'DEVICE_CREATE_FAILED',
  DEVICE_UPDATE_FAILED: 'DEVICE_UPDATE_FAILED',
  DEVICE_DELETE_FAILED: 'DEVICE_DELETE_FAILED',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  
  // Group Operations
  GROUP_CREATE_FAILED: 'GROUP_CREATE_FAILED',
  GROUP_UPDATE_FAILED: 'GROUP_UPDATE_FAILED',
  GROUP_DELETE_FAILED: 'GROUP_DELETE_FAILED',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  
  // Alert Operations
  ALERT_NOT_FOUND: 'ALERT_NOT_FOUND',
  ALERT_ACK_FAILED: 'ALERT_ACK_FAILED',
  ALERT_NOTE_FAILED: 'ALERT_NOTE_FAILED',
  
  // DataSource Operations
  DATASOURCE_NOT_FOUND: 'DATASOURCE_NOT_FOUND',
  DATASOURCE_UPDATE_FAILED: 'DATASOURCE_UPDATE_FAILED',
  
  // API/Network Errors
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Validation Errors
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  
  // General Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Common error suggestions by category
 */
export const ErrorSuggestions = {
  authentication: [
    'Verify your LM_BEARER_TOKEN is valid and not expired',
    'Check if the API token has the required permissions',
    'Ensure your LogicMonitor account is active',
  ],
  
  deviceCreate: [
    'Verify the collector ID exists and is active',
    'Check if the device name is unique',
    'Ensure you have permissions to create devices',
    'Verify the host group path exists',
    'Check if all required properties are provided',
  ],
  
  deviceUpdate: [
    'Verify the device ID exists',
    'Check if you have permissions to update devices',
    'Ensure the update data is valid',
    'Verify no required fields are missing',
  ],
  
  deviceDelete: [
    'Verify the device ID exists',
    'Check if you have permissions to delete devices',
    'Ensure the device is not part of a protected group',
  ],
  
  groupOperations: [
    'Verify the group ID exists',
    'Check if the parent group path is valid',
    'Ensure you have permissions to modify groups',
    'Verify the group name is unique within the parent',
  ],
  
  alertOperations: [
    'Verify the alert ID exists and is still active',
    'Check if you have permissions to manage alerts',
    'Ensure the alert is in a state that allows the operation',
  ],
  
  rateLimit: [
    'Wait a few moments before retrying',
    'Reduce the frequency of API calls',
    'Use batch operations when possible',
    'Contact LogicMonitor support to increase rate limits',
  ],
  
  networkError: [
    'Check your internet connection',
    'Verify the LogicMonitor API is accessible',
    'Check if there are any firewall rules blocking access',
    'Verify the LM_COMPANY name is correct',
  ],
  
  validation: [
    'Check the API documentation for required parameters',
    'Verify all required fields are provided',
    'Ensure parameter types match expected values',
    'Review the error details for specific validation failures',
  ],
} as const;

/**
 * Helper function to create a structured error from an unknown error
 * @param error Original error object
 * @param context Additional context about where the error occurred
 * @returns MCPError instance with structured information
 */
export function createMCPError(
  error: unknown,
  context: {
    operation: string;
    code?: string;
    details?: any;
    suggestions?: string[];
  },
): MCPError {
  // If already an MCPError, return it
  if (error instanceof MCPError) {
    return error;
  }
  
  // Extract message from error
  let message = `Operation failed: ${context.operation}`;
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }
  
  // Determine error code
  const code = context.code || ErrorCodes.UNKNOWN_ERROR;
  
  // Merge details
  const details = {
    operation: context.operation,
    ...(error instanceof Error && { originalError: error.message }),
    ...context.details,
  };
  
  return new MCPError(message, code, details, context.suggestions);
}

/**
 * Helper function to check if an error is an MCPError
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Format an error for display to the user
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof MCPError) {
    let output = `Error: ${error.message}\n`;
    
    if (error.details) {
      output += `\nDetails:\n${JSON.stringify(error.details, null, 2)}\n`;
    }
    
    if (error.suggestions && error.suggestions.length > 0) {
      output += '\nSuggestions:\n';
      error.suggestions.forEach((suggestion, index) => {
        output += `  ${index + 1}. ${suggestion}\n`;
      });
    }
    
    return output;
  }
  
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  
  return `Error: ${String(error)}`;
}

