import axios from 'axios';

class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.rateLimitMap = new Map();
    this.rateLimitWindow = 60000; // 1 minute
    this.maxErrorsPerWindow = 10;
    
    // Make the logger globally accessible
    window.__errorLogger = this;
  }

  isRateLimited(context) {
    const now = Date.now();
    const contextErrors = this.rateLimitMap.get(context) || [];
    
    // Clean up old entries
    const recentErrors = contextErrors.filter(timestamp => 
      now - timestamp < this.rateLimitWindow
    );
    
    if (recentErrors.length >= this.maxErrorsPerWindow) {
      return true;
    }
    
    recentErrors.push(now);
    this.rateLimitMap.set(context, recentErrors);
    return false;
  }

  async logToFile(error, context = '') {
    try {
      // Check rate limiting
      if (this.isRateLimited(context)) {
        console.warn(`Error logging rate limited for context: ${context}`);
        return false;
      }

      const errorDetails = {
        message: error.message || 'Unknown error',
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        severity: this.determineSeverity(error),
        metadata: {
          browser: this.getBrowserInfo(),
          screen: this.getScreenInfo(),
          performance: this.getPerformanceMetrics()
        }
      };

      // Add response details if available
      if (error.response) {
        errorDetails.status = error.response.status;
        errorDetails.data = error.response.data;
        errorDetails.endpoint = error.response.config?.url;
        errorDetails.method = error.response.config?.method;
      }

      // Store locally with rotation
      this.logs.push(errorDetails);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('Error Details');
        console.error('Error:', errorDetails.message);
        console.info('Context:', context);
        console.info('Severity:', errorDetails.severity);
        if (error.response) {
          console.info('Status:', error.response.status);
          console.info('Endpoint:', error.response.config?.url);
        }
        console.groupEnd();
      }

      return true;
    } catch (e) {
      console.warn('Failed to log error:', e);
      return false;
    }
  }

  determineSeverity(error) {
    if (error.response) {
      const status = error.response.status;
      if (status >= 500) return 'critical';
      if (status >= 400) return 'error';
      return 'warning';
    }
    if (error instanceof TypeError) return 'error';
    if (error.message && error.message.includes('network')) return 'critical';
    if (error.name === 'NetworkError' || error.name === 'AxiosError') return 'critical';
    return 'warning';
  }

  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    };
  }

  getScreenInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type
    };
  }

  getPerformanceMetrics() {
    if (!window.performance) return null;
    
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation?.loadEventEnd - navigation?.startTime,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.startTime,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    };
  }

  getStoredLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    this.rateLimitMap.clear();
    return true;
  }
}

// Create a singleton instance
const errorLogger = new ErrorLogger();

export { errorLogger as ErrorLogger }; 