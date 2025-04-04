import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const TaskStatus = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const TaskPriority = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const TaskCategory = {
  DEVELOPMENT: 'Development',
  TESTING: 'Testing',
  DOCUMENTATION: 'Documentation',
  MAINTENANCE: 'Maintenance'
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
        console.warn('No data received from tasks API');
        return [];
      }

      // Map the response to match our expected format
      const tasks = response.data.map(task => ({
        id: task._id,
        taskName: task.taskName,
        taskDescription: task.taskDescription,
        priority: task.priority,
        deadline: task.deadline,
        assignee: task.assignee,
        status: task.status,
        category: task.category,
        progress: task.progress
      }));

      console.log(`✅ Found ${tasks.length} tasks`);
      return tasks;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      this.logError(error, 'getAllTasks');
      throw new Error(`Failed to fetch tasks: ${error.message}`);
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
      throw new Error(`Failed to fetch task: ${error.message}`);
    }
  }

  async createTask(taskData) {
    try {
      console.log('📡 Creating task with data:', taskData);
      
      // Validate required fields
      if (!taskData.title) {
        throw new Error('Title is required');
      }

      // Format the data to match the database schema
      const formattedData = {
        taskName: taskData.title,
        taskDescription: taskData.description || '',
        status: taskData.status || 'Planning',
        priority: taskData.priority || 'Medium',
        assignee: taskData.assignee || 'Unassigned',
        category: taskData.category || 'Development',
        progress: taskData.progress || 0,
        deadline: taskData.deadline || null
      };

      console.log('📝 Formatted task data:', formattedData);

      const response = await api.post('/tasks', formattedData);
      console.log('✅ Task created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create task');
      }
      this.logError(error, 'createTask');
      throw error;
    }
  }

  async updateTask(id, taskData) {
    try {
      console.log(`📡 Updating task ${id} with data:`, taskData);
      
      // Format the data to match the database schema
      const formattedData = {
        taskName: taskData.title,
        taskDescription: taskData.description,
        status: taskData.status,
        priority: taskData.priority,
        assignee: taskData.assignee,
        category: taskData.category,
        progress: taskData.progress,
        deadline: taskData.deadline
      };

      const response = await api.put(`/tasks/${id}`, formattedData);
      console.log('✅ Task updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating task:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update task');
      }
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
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  async getTasksByProject(projectId) {
    try {
      console.log(`📡 Fetching tasks for project ${projectId}`);
      const response = await api.get(`/tasks/project/${projectId}`);
      console.log(`✅ Found ${response.data.length} tasks for project`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project tasks:', error);
      this.logError(error, 'getTasksByProject');
      throw new Error(`Failed to fetch project tasks: ${error.message}`);
    }
  }

  async getTasksBySprint(sprintId) {
    try {
      console.log(`📡 Fetching tasks for sprint ${sprintId}`);
      const response = await api.get(`/tasks/sprint/${sprintId}`);
      console.log(`✅ Found ${response.data.length} tasks for sprint`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching sprint tasks:', error);
      this.logError(error, 'getTasksBySprint');
      throw new Error(`Failed to fetch sprint tasks: ${error.message}`);
    }
  }

  async updateTaskStatus(id, status) {
    try {
      console.log(`📡 Updating task ${id} status to ${status}`);
      
      // Use PUT to update the status
      const response = await api.put(`/tasks/${id}`, { 
        status: status
      });
      
      console.log(`✅ Task status successfully updated to ${status}`);
      this.cache.delete('allTasks');
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating task status:`, error);
      this.logError(error, 'updateTaskStatus');
      throw error;
    }
  }
}

// Export a singleton instance
const taskService = new TaskService();
export default taskService;