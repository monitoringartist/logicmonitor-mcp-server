/**
 * Shared helpers for LogicMonitor (LM) MCP tool handlers:
 * curated default field sets, the field-filter utility, the progress-callback
 * type, and centralized error conversion used by every domain handler.
 */

import { LogicMonitorApiError } from '../../utils/core/lm-error.js';
import { MCPError, ErrorCodes, ErrorSuggestions, createMCPError } from '../../utils/core/error-handler.js';
import { LogicMonitorClient } from '../client.js';

export { validateFields } from '../../utils/helpers/validate-fields.js';

// Type for progress notification callback
export type ProgressCallback = (progress: number, total: number) => Promise<void>;

/**
 * Context passed to every tool handler in the registry.
 */
export interface ToolHandlerContext {
  client: LogicMonitorClient;
  args: any;
  progressCallback?: ProgressCallback;
}

/** A single tool handler. */
export type ToolHandler = (ctx: ToolHandlerContext) => Promise<any>;

/** Map of tool name -> handler. Per-domain maps are merged into one registry. */
export type ToolHandlerMap = Record<string, ToolHandler>;

// Default field sets for curated responses (when no fields parameter specified)
export const DEFAULT_DEVICE_FIELDS = [
  'id', 'displayName', 'name', 'hostGroupIds', 'preferredCollectorId',
  'hostStatus', 'alertStatus', 'alertStatusPriority', 'disableAlerting',
  'customProperties', 'sdtStatus',
];

export const DEFAULT_ALERT_FIELDS = [
  'id', 'internalId', 'type', 'startEpoch', 'endEpoch', 'acked', 'ackedBy',
  'severity', 'cleared', 'monitorObjectName', 'instanceName', 'dataPointName',
  'alertValue', 'threshold', 'resourceId', 'resourceTemplateName',
];

export const DEFAULT_COLLECTOR_FIELDS = [
  'id', 'description', 'hostname', 'platform', 'status', 'numberOfHosts',
  'escalatingChainId', 'suppressAlertClear',
];

export const DEFAULT_DATASOURCE_FIELDS = [
  'id', 'name', 'displayName', 'description', 'group',
  'dataSourceType', 'collectMethod', 'hasMultiInstances',
];

export const DEFAULT_DASHBOARD_FIELDS = [
  'id', 'name', 'description', 'groupId', 'groupName',
  'widgetsConfigVersion', 'widgetTokens',
];

export const DEFAULT_WEBSITE_FIELDS = [
  'id', 'name', 'description', 'type', 'schema', 'domain', 'isInternal',
  'status', 'stopMonitoring', 'overallAlertLevel',
];

export const DEFAULT_USER_FIELDS = [
  'id', 'username', 'email', 'firstName', 'lastName', 'roles',
  'status', 'lastAction',
];

export const DEFAULT_ROLE_FIELDS = [
  'id', 'name', 'description', 'roleGroupId',
  'customHelpLabel', 'customHelpURL', 'privileges',
];

export const DEFAULT_SDT_FIELDS = [
  'id', 'type', 'admin', 'comment', 'startDateTime', 'endDateTime',
  'duration', 'isEffective', 'deviceId', 'deviceDisplayName',
];

export const DEFAULT_DEVICE_GROUP_FIELDS = [
  'id', 'name', 'fullPath', 'description', 'parentId', 'numOfHosts',
  'numOfDirectDevices', 'disableAlerting', 'alertStatus',
];

export const DEFAULT_DASHBOARD_GROUP_FIELDS = [
  'id', 'name', 'description', 'parentId', 'numOfDashboards',
  'fullPath',
];

export const DEFAULT_WEBSITE_GROUP_FIELDS = [
  'id', 'name', 'description', 'parentId', 'fullPath',
  'numOfWebsites', 'disableAlerting', 'stopMonitoring',
];

export const DEFAULT_REPORT_FIELDS = [
  'id', 'name', 'description', 'type', 'groupId', 'groupName',
  'scheduleTimezone', 'format', 'lastGenerateOn', 'lastGenerateSize',
];

export const DEFAULT_CONFIGSOURCE_FIELDS = [
  'id', 'name', 'displayName', 'description', 'appliesTo', 'group',
  'version', 'lineageId', 'hasMultiConfigs',
];

export const DEFAULT_DEVICE_PROPERTY_FIELDS = [
  'name', 'value', 'type', 'inheritedFrom',
];

export const DEFAULT_API_TOKEN_FIELDS = [
  'adminId', 'adminName', 'accessId', 'note',
  'status', 'lastUsedOn',
];

export const DEFAULT_AUDIT_LOG_FIELDS = [
  'id', 'happenedOn', 'username', 'sessionId', 'ip',
  'description', 'userId',
];

export const DEFAULT_ACCESS_GROUP_FIELDS = [
  'id', 'name', 'description', 'tenantId',
  'numOfDevices', 'numOfUsers',
];

/**
 * Filter object to only include specified fields
 */
export function filterFields<T extends Record<string, any>>(obj: T, fields: string[]): Partial<T> {
  const filtered: any = {};
  for (const field of fields) {
    if (field in obj) {
      filtered[field] = obj[field];
    }
  }
  return filtered;
}

/**
 * Convert LogicMonitor API error to MCPError with contextual suggestions
 */
export function convertLMErrorToMCPError(error: LogicMonitorApiError, toolName: string): MCPError {
  const httpStatus = error.status;
  const lmError = error.errorMessage;

  // Determine error code and suggestions based on operation and HTTP status
  let code: string = ErrorCodes.API_REQUEST_FAILED;
  let suggestions: string[] = [];

  // Authentication errors (401, 403)
  if (httpStatus === 401 || httpStatus === 403) {
    code = httpStatus === 401 ? ErrorCodes.AUTHENTICATION_FAILED : ErrorCodes.INSUFFICIENT_PERMISSIONS;
    suggestions = [...ErrorSuggestions.authentication];
  }
  // Not found errors (404)
  else if (httpStatus === 404) {
    if (toolName.includes('device') || toolName.includes('resource')) {
      code = ErrorCodes.DEVICE_NOT_FOUND;
      suggestions = [
        'Verify the device ID exists',
        'Check if the device was recently deleted',
        'Use list_resources or search_resources to find the correct ID',
      ];
    } else if (toolName.includes('group')) {
      code = ErrorCodes.GROUP_NOT_FOUND;
      suggestions = [...ErrorSuggestions.groupOperations];
    } else if (toolName.includes('alert')) {
      code = ErrorCodes.ALERT_NOT_FOUND;
      suggestions = [...ErrorSuggestions.alertOperations];
    } else {
      suggestions = [
        'Verify the resource ID exists',
        'Check if the resource was recently deleted',
        'Use the appropriate list command to find valid IDs',
      ];
    }
  }
  // Rate limit errors (429)
  else if (httpStatus === 429) {
    code = ErrorCodes.RATE_LIMIT_EXCEEDED;
    suggestions = [...ErrorSuggestions.rateLimit];
  }
  // Validation errors (400)
  else if (httpStatus === 400) {
    code = ErrorCodes.INVALID_PARAMETERS;
    suggestions = [...ErrorSuggestions.validation];

    // Add operation-specific suggestions
    if (toolName.includes('create')) {
      if (toolName.includes('device') || toolName.includes('resource')) {
        code = ErrorCodes.DEVICE_CREATE_FAILED;
        suggestions = [...ErrorSuggestions.deviceCreate];
      } else if (toolName.includes('group')) {
        code = ErrorCodes.GROUP_CREATE_FAILED;
        suggestions = [...ErrorSuggestions.groupOperations];
      }
    } else if (toolName.includes('update')) {
      if (toolName.includes('device') || toolName.includes('resource')) {
        code = ErrorCodes.DEVICE_UPDATE_FAILED;
        suggestions = [...ErrorSuggestions.deviceUpdate];
      } else if (toolName.includes('group')) {
        code = ErrorCodes.GROUP_UPDATE_FAILED;
        suggestions = [...ErrorSuggestions.groupOperations];
      }
    } else if (toolName.includes('delete')) {
      if (toolName.includes('device') || toolName.includes('resource')) {
        code = ErrorCodes.DEVICE_DELETE_FAILED;
        suggestions = [...ErrorSuggestions.deviceDelete];
      } else if (toolName.includes('group')) {
        code = ErrorCodes.GROUP_DELETE_FAILED;
        suggestions = [...ErrorSuggestions.groupOperations];
      }
    } else if (toolName.includes('acknowledge_alert')) {
      code = ErrorCodes.ALERT_ACK_FAILED;
      suggestions = [...ErrorSuggestions.alertOperations];
    } else if (toolName.includes('alert_note')) {
      code = ErrorCodes.ALERT_NOTE_FAILED;
      suggestions = [...ErrorSuggestions.alertOperations];
    }
  }
  // Server errors (5xx)
  else if (httpStatus >= 500) {
    code = ErrorCodes.API_REQUEST_FAILED;
    suggestions = [
      'LogicMonitor API is experiencing issues',
      'Wait a few moments and retry',
      'Check LogicMonitor status page',
      'Contact LogicMonitor support if the issue persists',
    ];
  }
  // Network/timeout errors
  else if (httpStatus === 0 || httpStatus === -1) {
    code = ErrorCodes.NETWORK_ERROR;
    suggestions = [...ErrorSuggestions.networkError];
  }

  return new MCPError(
    lmError || error.message,
    code,
    {
      tool: toolName,
      httpStatus,
      apiError: error.toJSON(),
    },
    suggestions,
  );
}

/**
 * Convert any thrown error from a tool handler into an MCPError. Always throws.
 */
export function handleToolError(error: unknown, name: string): never {
  // If it's already an MCPError, re-throw it
  if (error instanceof MCPError) {
    throw error;
  }

  // If it's a LogicMonitor API error, convert to MCPError with suggestions
  if (error instanceof LogicMonitorApiError) {
    throw convertLMErrorToMCPError(error, name);
  }

  // For other errors, wrap them in MCPError
  if (error instanceof Error) {
    throw createMCPError(error, {
      operation: name,
      code: ErrorCodes.INTERNAL_ERROR,
      suggestions: [
        'Check the server logs for more details',
        'Verify your LogicMonitor credentials are valid',
        'Ensure the API endpoint is accessible',
      ],
    });
  }
  throw error;
}
