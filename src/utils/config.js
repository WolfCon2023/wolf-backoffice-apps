export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || 
    "https://wolf-backoffice-backend-development.up.railway.app/api",
  TIMEOUT: 30000, // 30 seconds
  CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
};

export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  REFRESH_TOKEN_KEY: 'refreshToken',
};

export const STATUS_COLORS = {
  // Project statuses
  Active: 'success',
  Completed: 'default',
  'On Hold': 'warning',
  Cancelled: 'error',
  
  // Sprint statuses
  Planned: 'info',
  'In Progress': 'primary',
  
  // Team statuses
  Inactive: 'default',
  
  // Legacy uppercase values (for backward compatibility)
  ACTIVE: 'success',
  COMPLETED: 'default',
  ON_HOLD: 'warning',
  CANCELLED: 'error',
  PLANNED: 'info',
  IN_PROGRESS: 'primary',
  INACTIVE: 'default',
};

export const ROLES = {
  TEAM_LEAD: 'TEAM_LEAD',
  DEVELOPER: 'DEVELOPER',
  DESIGNER: 'DESIGNER',
  QA: 'QA',
  PRODUCT_OWNER: 'PRODUCT_OWNER',
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
}; 