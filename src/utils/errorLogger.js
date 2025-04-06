class ErrorLogger {
  constructor(serviceName = '') {
      this.serviceName = serviceName;
  }
  
  logError(error, method = '') {
      ErrorLogger.logToFile(error, `${this.serviceName}${method ? '.' + method : ''}`);
  }
  
  static logToFile(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = {
      timestamp,
      context,
      message: errorMessage,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Details:', errorDetails);
    }

    // Here you could add additional logging logic like:
    // - Sending to a logging service
    // - Storing in local storage
    // - Sending to your backend
  }

  static logWarning(message, context = '') {
    const timestamp = new Date().toISOString();
    const warningDetails = {
      timestamp,
      context,
      message
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Warning:', warningDetails);
    }
  }

  static logInfo(message, context = '') {
    const timestamp = new Date().toISOString();
    const infoDetails = {
      timestamp,
      context,
      message
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.info('Info:', infoDetails);
    }
  }
}

export default ErrorLogger; 