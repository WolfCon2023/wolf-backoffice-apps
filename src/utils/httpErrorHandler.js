import { toast } from 'react-toastify';

// Custom HTTP Error class
export class HttpError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

// Error type checks
export const isNetworkError = (error) => !error.response && error.request;
export const isAuthenticationError = (error) => error.response?.status === 401;
export const isValidationError = (error) => error.response?.status === 422;
export const isServerError = (error) => error.response?.status >= 500;
export const isClientError = (error) => error.response?.status >= 400 && error.response?.status < 500;

// Error message creation
export const createErrorMessage = (error) => {
  if (error.response) {
    return error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    return 'No response received from server';
  }
  return error.message || 'An unexpected error occurred';
};

// Detailed error information
export const getErrorDetails = (error) => {
  if (error instanceof HttpError) {
    return {
      message: error.message,
      status: error.status,
      data: error.data,
      timestamp: error.timestamp
    };
  }

  if (error.response) {
    return {
      message: error.response.data.message || error.message,
      status: error.response.status,
      data: error.response.data,
      timestamp: new Date().toISOString()
    };
  }

  return {
    message: error.message,
    status: null,
    data: null,
    timestamp: new Date().toISOString()
  };
};

// Main error handler
export const handleHttpError = (error, context = '') => {
  const errorMessage = createErrorMessage(error);
  
  // Log the error for debugging
  console.error(`[${context}] ${errorMessage}`, error);
  
  // Show user-friendly toast
  toast.error(errorMessage);

  // Log to file if available
  try {
    // Avoid circular dependency by checking if window.__errorLogger exists
    if (window.__errorLogger && typeof window.__errorLogger.logToFile === 'function') {
      window.__errorLogger.logToFile(error, context);
    }
  } catch (e) {
    console.warn('Error logger not available:', e);
  }

  return errorMessage;
};

// Validation helper
export const validateResponse = (response) => {
  if (!response.ok) {
    throw new HttpError(
      response.statusText,
      response.status,
      response.data
    );
  }
  return response;
};

export default {
  HttpError,
  handleHttpError,
  createErrorMessage,
  getErrorDetails,
  isNetworkError,
  isAuthenticationError,
  isValidationError,
  isServerError,
  isClientError,
  validateResponse
}; 