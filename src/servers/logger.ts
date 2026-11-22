/**
 * HTTP Transport Structured Logger & Log Sanitizer
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFormat = 'json' | 'human';
export type LoggerFn = (level: LogLevel, message: string, data?: any, requestId?: string) => void;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  requestId?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SENSITIVE_FIELDS = [
  // OAuth and authentication
  'state', 'code', 'code_verifier', 'code_challenge',
  'authorization', 'auth',
  // Tokens
  'access_token', 'accesstoken', 'refresh_token', 'refreshtoken',
  'bearer_token', 'bearertoken', 'id_token', 'idtoken',
  'token', 'jwt',
  // Secrets and keys
  'password', 'passwd', 'pwd',
  'secret', 'client_secret', 'clientsecret', 'session_secret', 'sessionsecret',
  'api_key', 'apikey', 'api_secret', 'apisecret',
  'private_key', 'privatekey', 'public_key', 'publickey',
  // Credentials
  'credential', 'credentials',
  'client_id', 'clientid',
  // Additional sensitive patterns
  'cookie', 'csrf', 'nonce',
];

/**
 * Recursively redacts sensitive fields (tokens, secrets, credentials) from
 * objects and arrays before logging.
 */
export function sanitizeForLogging(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    if (typeof data === 'string' && data.length > 32 && /^[A-Za-z0-9_+=/.-]+$/.test(data)) {
      return `${data.substring(0, 4)}...[REDACTED]`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeForLogging(item));
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[_-]/g, '');
    const isSensitive = SENSITIVE_FIELDS.some(field =>
      normalizedKey.includes(field.replace(/[_-]/g, '')),
    );

    if (isSensitive) {
      if (typeof value === 'string' && value.length > 0) {
        sanitized[key] = value.length > 4 ? `${value.substring(0, 4)}...[REDACTED]` : '[REDACTED]';
      } else if (value !== null && value !== undefined) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Escapes HTML special characters to prevent XSS in rendered status pages.
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Creates a structured logger that sanitizes logged payloads.
 */
export function createHttpLogger(logLevel: LogLevel, logFormat: LogFormat): LoggerFn {
  return (level: LogLevel, message: string, data?: any, requestId?: string) => {
    if (LOG_LEVELS[level] < LOG_LEVELS[logLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(data && { data: sanitizeForLogging(data) }),
      ...(requestId && { requestId }),
    };

    if (logFormat === 'json') {
      console.log(JSON.stringify(entry));
      return;
    }

    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    const colorCode = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    }[level];

    const reset = '\x1b[0m';
    let output = `${colorCode}${emoji} [${entry.timestamp}] ${level.toUpperCase()}${reset}: ${message}`;

    if (requestId) {
      output += ` ${colorCode}[${requestId}]${reset}`;
    }

    if (data) {
      output += `\n${JSON.stringify(sanitizeForLogging(data), null, 2)}`;
    }

    console.log(output);
  };
}
