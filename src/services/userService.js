import { api } from '../services/apiConfig';
import ErrorLogger from '../utils/errorLogger';

class UserService {
  constructor() {
    this.cache = new Map();
  }

  async getAllUsers() {
    try {
      const response = await api.get('/users');
      const users = Array.isArray(response.data) ? response.data : response.data?.users || [];
      this.cache.set('allUsers', users);
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getAllUsers');
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getUserById');
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  async createUser(userData) {
    try {
      // Ensure required fields are present and properly formatted
      const requiredFields = ['username', 'firstName', 'lastName', 'email', 'password'];
      const missingFields = requiredFields.filter(field => !userData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Sanitize and validate role
      const validRoles = ['Developer', 'Scrum Master', 'Product Owner', 'Business Analyst', 'QA Tester'];
      const sanitizedRole = userData.role ? userData.role.trim() : 'Developer';
      if (!validRoles.includes(sanitizedRole)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Format the request data with all required fields
      const requestData = {
        username: userData.username.trim(),
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password || `${userData.firstName.toLowerCase()}${userData.lastName.toLowerCase()}123!`,
        // Required fields with validated values
        role: sanitizedRole,
        department: (userData.department || 'Information Technology').trim(),
        title: (userData.title || sanitizedRole).trim()
      };

      console.log('📡 Creating new user with data:', {
        ...requestData,
        password: '[REDACTED]'
      });

      // Get auth token for admin creation
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Create user using the /auth/register endpoint with admin creation header
      const headers = {
        'x-admin-creation': 'true',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Explicitly add the token
      };
      console.log('🔑 Request headers:', {
        ...headers,
        'Authorization': '[REDACTED]'
      });

      const response = await api.post('/auth/register', requestData, { headers });
      console.log('✅ User created:', response.data);
      this.cache.delete('allUsers');
      return response.data;
    } catch (error) {
      console.error('🚨 Registration Error:', {
        message: error.message,
        stack: error.stack,
        data: error,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
          requestData: error.config?.data ? {
            ...JSON.parse(error.config.data),
            password: '[REDACTED]'
          } : undefined,
          requestHeaders: error.config?.headers
        } : undefined
      });
      this.logError(error, 'createUser');
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      this.cache.delete('allUsers');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'updateUser');
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`);
      this.cache.delete('allUsers');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'deleteUser');
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  logError(error, method) {
    ErrorLogger.logToFile(error, `UserService:${method}`);
  }
}

export const userService = new UserService(); 