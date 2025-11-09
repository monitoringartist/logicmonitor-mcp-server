/**
 * Custom error class for LogicMonitor API errors
 * Preserves all error details from the LM API response
 */
export class LogicMonitorApiError extends Error {
  public readonly status: number;
  public readonly errorCode?: number;
  public readonly errorMessage?: string;
  public readonly errorDetail?: string | null;
  public readonly path: string;
  public readonly duration?: number;

  constructor(
    message: string,
    details: {
        status: number;
        errorCode?: number;
        errorMessage?: string;
        errorDetail?: string | null;
        path: string;
        duration?: number;
      },
  ) {
    super(message);
    this.name = 'LogicMonitorApiError';
    this.status = details.status;
    this.errorCode = details.errorCode;
    this.errorMessage = details.errorMessage;
    this.errorDetail = details.errorDetail;
    this.path = details.path;
    this.duration = details.duration;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LogicMonitorApiError);
    }
  }

  /**
     * Returns a detailed error message for MCP clients
     */
  toMCPError(): string {
    const parts = [`HTTP ${this.status}`];

    if (this.errorMessage) {
      parts.push(this.errorMessage);
    }

    if (this.errorCode) {
      parts.push(`(LM Error ${this.errorCode})`);
    }

    if (this.errorDetail) {
      parts.push(`- ${this.errorDetail}`);
    }

    parts.push(`[${this.path}]`);

    return parts.join(' ');
  }

  /**
     * Returns full error details as JSON
     */
  toJSON(): object {
    return {
      error: 'LogicMonitor API Error',
      status: this.status,
      errorCode: this.errorCode,
      errorMessage: this.errorMessage,
      errorDetail: this.errorDetail,
      path: this.path,
      duration: this.duration,
    };
  }
}
