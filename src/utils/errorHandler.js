import { toast } from 'react-toastify';
import { AUTH_CONFIG } from './config';
import { ErrorLogger } from '../services/ErrorLogger';

export const createErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const handleApiError = (error, context) => {
  // Handle authentication errors
  if (error.response?.status === 401) {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    window.location.href = "/login";
    return 'Authentication failed. Please log in again.';
  }

  // Handle validation errors
  if (error.response?.status === 400) {
    const message = createErrorMessage(error);
    toast.error(message);
    return message;
  }

  // Handle not found errors
  if (error.response?.status === 404) {
    const message = 'The requested resource was not found';
    toast.error(message);
    return message;
  }

  // Handle server errors
  if (error.response?.status >= 500) {
    const message = 'Server error. Please try again later.';
    toast.error(message);
    return message;
  }

  // Log the error
  const errorMessage = createErrorMessage(error);
  ErrorLogger.logToFile(error, `API_ERROR:${context}`);
  toast.error(errorMessage);
  return errorMessage;
};

export const handleFormError = (error) => {
  if (error.validationErrors) {
    Object.values(error.validationErrors).forEach(message => {
      toast.error(message);
    });
    return error.validationErrors;
  }

  toast.error(createErrorMessage(error));
  return null;
};

export const validateRequired = (values, fields) => {
  const errors = {};
  fields.forEach(field => {
    if (!values[field]) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });
  return errors;
}; 