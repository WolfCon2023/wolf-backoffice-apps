import axios from 'axios';

// Base URL for API endpoints
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Explicitly disable sending credentials
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && !config.url.includes('/auth/register')) {
      console.log("🔑 Request Interceptor - Token:", token ? "Token exists" : "No token found");
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Authorization header set:", config.headers.Authorization);
    }

    // Log the full URL being requested
    console.log('🔍 Request:', {
      method: config.method,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? '[REDACTED]' : undefined
      },
      data: config.data ? {
        ...config.data,
        password: config.data.password ? '[REDACTED]' : undefined
      } : undefined
    });

    console.log(`📡 Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received: ${response.status}`);
    return response;
  },
  (error) => {
    const errorResponse = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.message || error.response?.data?.error || error.message,
      requestData: error.config?.data ? {
        ...error.config.data,
        password: '[REDACTED]'
      } : undefined,
      headers: error.config?.headers
    };
    
    console.error('❌ Response Error:', errorResponse);

    // Handle specific error cases
    if (error.response?.status === 500) {
      console.error('Server Error Details:', {
        message: error.response?.data?.message,
        error: error.response?.data?.error,
        stack: error.response?.data?.stack,
        requestData: error.config?.data ? {
          ...error.config.data,
          password: '[REDACTED]'
        } : undefined
      });
      error.message = error.response?.data?.message || error.response?.data?.error || 'Internal server error. Please try again later.';
    } else if (error.response?.status === 404) {
      console.error(`API route not found: ${errorResponse.fullUrl}`);
      error.message = 'API route not found';
    } else if (error.response?.status === 401) {
      if (!error.config?.url.includes('/auth/')) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      error.message = error.response?.data?.message || 'Authentication failed';
    } else if (error.response?.status === 403) {
      error.message = 'Access forbidden. Please check your permissions.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Simple fetch function without triggering 401 redirect
export const simpleFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export { api }; 