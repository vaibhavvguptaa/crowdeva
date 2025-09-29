interface ErrorAnalyticsData {
  error: string;
  type: 'authentication' | 'network' | 'validation' | 'unknown';
  component: string;
  userAgent?: string;
  timestamp: string;
  userId?: string;
  authType?: string;
  additional?: Record<string, any>;
  // New fields for enhanced analytics
  sessionId?: string;
  ipAddress?: string;
  url?: string;
  httpStatus?: number;
  errorCode?: string;
  recoveryAction?: string;
}

class ErrorAnalytics {
  private static errorQueue: ErrorAnalyticsData[] = [];
  private static batchSize = 10;
  private static flushInterval = 30000; // 30 seconds
  private static analyticsEndpoint = process.env.NEXT_PUBLIC_ERROR_ANALYTICS_ENDPOINT || '/api/analytics/errors';

  static {
    // Start periodic flush
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.flushInterval);
      
      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  static trackError(
    error: string,
    type: ErrorAnalyticsData['type'],
    component: string,
    additional?: Record<string, any>
  ) {
    const errorData: ErrorAnalyticsData = {
      error,
      type,
      component,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      userId: typeof window !== 'undefined' ? localStorage.getItem('userId') || undefined : undefined,
      authType: typeof window !== 'undefined' ? localStorage.getItem('authType') || undefined : undefined,
      sessionId: typeof window !== 'undefined' ? sessionStorage.getItem('sessionId') || undefined : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...additional
    };

    this.errorQueue.push(errorData);

    // Flush if queue is full
    if (this.errorQueue.length >= this.batchSize) {
      this.flush();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Analytics');
      console.error('Error:', error);
      console.log('Type:', type);
      console.log('Component:', component);
      console.log('Additional:', additional);
      console.groupEnd();
    }
  }

  static async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real implementation, you'd send this to your analytics service
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Flushing error analytics:', errors);
      }

      // Send to analytics endpoint
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      // Re-queue errors if sending fails
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send error analytics:', error);
    }
  }

  static getErrorStats() {
    // Return current error statistics
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;
    
    const recentErrors = this.errorQueue.filter(
      e => new Date(e.timestamp).getTime() > now - oneHour
    );
    
    const dailyErrors = this.errorQueue.filter(
      e => new Date(e.timestamp).getTime() > now - oneDay
    );

    return {
      totalErrors: this.errorQueue.length,
      recentErrors: recentErrors.length,
      dailyErrors: dailyErrors.length,
      errorsByType: this.errorQueue.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      errorsByComponent: this.errorQueue.reduce((acc, e) => {
        acc[e.component] = (acc[e.component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // New method to get authentication-specific error stats
  static getAuthErrorStats() {
    const authErrors = this.errorQueue.filter(e => e.type === 'authentication');
    
    return {
      totalAuthErrors: authErrors.length,
      authErrorsByComponent: authErrors.reduce((acc, e) => {
        acc[e.component] = (acc[e.component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      commonAuthErrors: authErrors.reduce((acc, e) => {
        acc[e.error] = (acc[e.error] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // New method to clear error queue (useful for testing)
  static clearQueue() {
    this.errorQueue = [];
  }
}

export default ErrorAnalytics;

// Convenience functions for common error tracking
export const trackAuthError = (error: string, additional?: Record<string, any>) => {
  ErrorAnalytics.trackError(error, 'authentication', 'auth', additional);
};

export const trackNetworkError = (error: string, component: string, additional?: Record<string, any>) => {
  ErrorAnalytics.trackError(error, 'network', component, additional);
};

export const trackValidationError = (error: string, component: string, field?: string) => {
  ErrorAnalytics.trackError(error, 'validation', component, { field });
};

// New convenience function for authentication analytics
export const trackAuthAnalytics = (event: string, additional?: Record<string, any>) => {
  ErrorAnalytics.trackError(event, 'authentication', 'analytics', additional);
};