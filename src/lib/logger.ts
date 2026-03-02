/**
 * Secure Logger Utility
 * 
 * Provides conditional logging that respects environment settings
 * and prevents sensitive data exposure in production.
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * Sanitize sensitive data from objects before logging
 */
function sanitizeForLogging(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Redact email addresses in production
    if (isProduction && data.includes('@')) {
      return data.replace(/([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '***@***');
    }
    return data;
  }
  
  if (typeof data === 'object') {
    const sanitized: any = Array.isArray(data) ? [] : {};
    
    for (const key in data) {
      // Redact sensitive fields
      const sensitiveFields = [
        'password', 'token', 'secret', 'apiKey', 'api_key',
        'private_key', 'privateKey', 'sessionId', 'session_id'
      ];
      
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (key.toLowerCase().includes('email') && isProduction) {
        sanitized[key] = '***@***';
      } else {
        sanitized[key] = sanitizeForLogging(data[key]);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Secure logger that only logs in development or when explicitly enabled
 */
export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
    }
  },

  /**
   * Info level logging - development and production (sanitized)
   */
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
    } else if (isProduction) {
    }
  },

  /**
   * Warning level logging - always enabled (sanitized in production)
   */
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
    } else {
    }
  },

  /**
   * Error level logging - always enabled (sanitized in production)
   */
  error: (message: string, error?: any, ...args: any[]) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error, ...args);
    } else {
      // In production, log error message but sanitize details
      console.error(`[ERROR] ${message}`, {
        message: error?.message || 'Unknown error',
        type: error?.constructor?.name || 'Error'
      });
    }
  },

  /**
   * Webhook logging - special category for webhook debugging
   */
  webhook: (source: string, message: string, data?: any) => {
    const prefix = `[WEBHOOK-${source.toUpperCase()}]`;
    if (isDevelopment) {
    } else if (isProduction) {
    }
  },

  /**
   * Security logging - always enabled, never sanitized (for audit trail)
   */
  security: (event: string, details: any) => {
  }
};

/**
 * Legacy console.log replacement for gradual migration
 * Use this to replace console.log calls throughout the codebase
 */
export const secureLog = logger.debug;

