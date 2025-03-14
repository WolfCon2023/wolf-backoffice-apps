import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 
  "https://wolf-backoffice-backend-development.up.railway.app/api";

if (!API_BASE_URL) {
  throw new Error('REACT_APP_API_BASE_URL is not defined in environment variables');
}

console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log the full URL being requested
    console.log('🔍 Request:', {
      method: config.method,
      fullUrl: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    // Enhanced error logging
    const errorResponse = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      fullUrl: `${error.config?.baseURL}${error.config?.url}`,
      method: error.config?.method,
    };
    
    console.error('❌ Response Error:', errorResponse);

    // Handle specific error cases
    if (error.response?.status === 404) {
      console.error(`API route not found: ${errorResponse.fullUrl}`);
      error.message = 'API route not found';
    } else if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      error.message = 'Access forbidden. Please check your permissions.';
    } else if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export { api, API_BASE_URL }; 