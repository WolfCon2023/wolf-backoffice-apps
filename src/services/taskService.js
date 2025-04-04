import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED'
};

export const TaskPriority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const TaskCategory = {
  DEVELOPMENT: 'DEVELOPMENT',
  TESTING: 'TESTING',
  DOCUMENTATION: 'DOCUMENTATION',
  DESIGN: 'DESIGN',
  RESEARCH: 'RESEARCH',
  OTHER: 'OTHER'
};

/**
 * Service for managing task-related API requests
 * This handles all interactions with the /tasks endpoint
 */
class TaskService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.endpointAvailability = {
      '/tasks': { available: null, lastChecked: null }
    };
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.error(`❌ TaskService Error (${context}):`, error);
    return ErrorLogger.logToFile(error, `TaskService:${context}`);
  }

  /**
   * Check if data exists in cache and is still valid
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return data;
  }

  /**
   * Set data in cache with current timestamp
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Check and update the availability status of an API endpoint
   */
  checkEndpointAvailability(endpoint, status) {
    if (!this.endpointAvailability[endpoint]) {
      this.endpointAvailability[endpoint] = { available: null, lastChecked: null };
    }
    
    this.endpointAvailability[endpoint] = {
      available: status,
      lastChecked: Date.now()
    };
    
    console.info(`🔍 API Endpoint ${endpoint} availability: ${status ? 'Available' : 'Unavailable'}`);
  }

  /**
   * Get all tasks from the API
   * @returns {Array} List of tasks or empty array if API fails
   */
  async getAllTasks() {
    try {
      console.log('📡 Fetching all tasks...');
      const response = await api.get('/tasks');
      
      if (!response.data) {
        console.warn('⚠️ No data received from tasks API');
        return [];
      }

      const tasks = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      this.logError(error, 'getAllTasks');
      return []; // Return empty array instead of throwing
    }
  }

  async getTaskById(id) {
    try {
      console.log(`📡 Fetching task ${id}`);
      const response = await api.get(`/tasks/${id}`);
      console.log('✅ Task fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching task:', error);
      this.logError(error, 'getTaskById');
      throw error;
    }
  }

  async generateTaskKey(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to generate task key');
      }

      // Get the project details to get the project key
      const project = await api.get(`/projects/${projectId}`);
      const projectKey = project.data.key;

      // Get all tasks for the project to determine the next number
      const tasks = await api.get(`/tasks/project/${projectId}`);
      const projectTasks = tasks.data || [];
      
      // Find the highest task number for this project
      const taskNumbers = projectTasks
        .map(task => {
          const match = task.key?.match(new RegExp(`${projectKey}-T(\\d+)`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => !isNaN(num));

      const nextNumber = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
      
      // Generate the new key with 'T' prefix for tasks
      const newKey = `${projectKey}-T${nextNumber}`;
      console.log(`📝 Generated new task key: ${newKey}`);
      return newKey;
    } catch (error) {
      console.error('❌ Error generating task key:', error);
      this.logError(error, 'generateTaskKey');
      throw new Error('Failed to generate task key');
    }
  }

  async createTask(taskData) {
    try {
      console.log('📡 Creating new task:', taskData);
      const response = await api.post('/tasks', taskData);
      console.log('✅ Task created successfully:', response.data);
      this.cache.delete('allTasks');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      this.logError(error, 'createTask');
      throw error;
    }
  }

  async updateTask(id, taskData) {
    try {
      console.log(`📡 Updating task ${id}:`, taskData);
      const response = await api.put(`/tasks/${id}`, taskData);
      console.log('✅ Task updated successfully');
      this.cache.delete('allTasks');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating task:', error);
      this.logError(error, 'updateTask');
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      console.log(`📡 Deleting task ${id}`);
      const response = await api.delete(`/tasks/${id}`);
      console.log('✅ Task deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting task:', error);
      this.logError(error, 'deleteTask');
      throw error;
    }
  }

  async getTasksByProject(projectId) {
    const cacheKey = `projectTasks:${projectId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching tasks for project ${projectId}`);
      const response = await api.get(`/tasks/project/${projectId}`);
      console.log('✅ Project tasks fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project tasks:', error);
      this.logError(error, 'getTasksByProject');
      return [];
    }
  }

  async getTasksBySprint(sprintId) {
    const cacheKey = `sprintTasks:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching tasks for sprint ${sprintId}`);
      const response = await api.get(`/tasks/sprint/${sprintId}`);
      console.log('✅ Sprint tasks fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching sprint tasks:', error);
      this.logError(error, 'getTasksBySprint');
      return [];
    }
  }

  async updateTaskStatus(id, status) {
    try {
      console.log(`📡 Updating task ${id} status to ${status}`);
      const response = await api.put(`/tasks/${id}/status`, { status });
      console.log(`✅ Task status successfully updated to ${status}`);
      this.cache.delete('allTasks');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating task status:', error);
      this.logError(error, 'updateTaskStatus');
      throw error;
    }
  }
}

// Export a singleton instance
const taskService = new TaskService();
export default taskService;