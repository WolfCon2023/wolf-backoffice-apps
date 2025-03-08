// Import from axiosInstance
import { api, instance, setAuthToken, clearAuthToken } from './axiosInstance';

// Import from httpErrorHandler
import {
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
} from './httpErrorHandler';

// Export everything
export {
  api,
  instance,
  setAuthToken,
  clearAuthToken,
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