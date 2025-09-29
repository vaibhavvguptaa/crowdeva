interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

interface LogEntry {
  timestamp: string;
  level: keyof LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';
  private logBuffer: LogEntry[] = [];
  private bufferSize = 50;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Set up periodic flushing in browser environment
    if (typeof window !== 'undefined') {
      this.flushInterval = setInterval(() => {
        this.flushLogs();
      }, 30000); // Flush every 30 seconds

      // Flush logs before page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.flushLogs();
        });
      }
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Detailed formatting for development
      return JSON.stringify(entry, null, 2);
    }
    // Compact formatting for production
    return JSON.stringify(entry);
  }

  private createLogEntry(
    level: keyof LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    // Add request context if available (in browser)
    if (typeof window !== 'undefined') {
      entry.url = window.location?.href;
      entry.userAgent = window.navigator?.userAgent;
    }

    return entry;
  }

  private async sendToExternalService(entries: LogEntry[]): Promise<void> {
    try {
      // In a real implementation, you'd send this to your logging service
      // For now, we'll just log to console in production
      if (this.isProduction) {
        console.log('Sending logs to external service:', entries);
      }

      // Example API call (uncomment and modify for your logging service)
      /*
      await fetch('/api/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
      });
      */
    } catch (error) {
      // If we can't send to external service, keep logs in buffer
      console.error('Failed to send logs to external service:', error);
    }
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await this.sendToExternalService(logsToSend);
    } catch (error) {
      // If sending fails, put logs back in buffer
      this.logBuffer.unshift(...logsToSend);
      console.error('Failed to flush logs:', error);
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushLogs();
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('ERROR', message, context, error);
    console.error(this.formatLog(entry));
    this.addToBuffer(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('WARN', message, context);
    console.warn(this.formatLog(entry));
    this.addToBuffer(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('INFO', message, context);
    console.info(this.formatLog(entry));
    this.addToBuffer(entry);
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('DEBUG', message, context);
      console.debug(this.formatLog(entry));
      this.addToBuffer(entry);
    }
  }

  // Authentication-specific logging methods
  authSuccess(userId: string, authType: string, context?: Record<string, any>): void {
    this.info('Authentication successful', {
      userId,
      authType,
      important: true,
      eventType: 'auth_success',
      ...context,
    });
  }

  authFailure(email: string, reason: string, context?: Record<string, any>): void {
    this.warn('Authentication failed', {
      email: this.hashEmail(email),
      reason,
      important: true,
      eventType: 'auth_failure',
      ...context,
    });
  }

  securityEvent(event: string, context?: Record<string, any>): void {
    this.error('Security event detected', undefined, {
      event,
      important: true,
      eventType: 'security_event',
      ...context,
    });
  }

  // New method for authentication analytics
  authAnalytics(event: string, context?: Record<string, any>): void {
    this.info('Authentication analytics event', {
      event,
      eventType: 'auth_analytics',
      ...context,
    });
  }

  private hashEmail(email: string): string {
    // Hash email for privacy while maintaining uniqueness for tracking
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      // In browser environment with WebCrypto API
      try {
        return btoa(email).slice(0, 10); // Simple base64 hash for privacy
      } catch (e) {
        // Fallback if btoa fails
        return email.replace(/(.{2}).*@/, '$1***@');
      }
    }
    // Fallback for other environments
    return email.replace(/(.{2}).*@/, '$1***@');
  }

  // Method to manually flush logs
  flush(): void {
    this.flushLogs();
  }
}

// Create singleton instance
const logger = Logger.getInstance();

// Export convenient methods
export const logError = (message: string, error?: Error, context?: Record<string, any>) => 
  logger.error(message, error, context);

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context);

export const logAuthSuccess = (userId: string, authType: string, context?: Record<string, any>) => 
  logger.authSuccess(userId, authType, context);

export const logAuthFailure = (email: string, reason: string, context?: Record<string, any>) => 
  logger.authFailure(email, reason, context);

export const logSecurityEvent = (event: string, context?: Record<string, any>) => 
  logger.securityEvent(event, context);

// New export for authentication analytics
export const logAuthAnalytics = (event: string, context?: Record<string, any>) => 
  logger.authAnalytics(event, context);

export default logger;