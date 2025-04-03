import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

/**
 * Service for managing task-related API requests
 * This handles all interactions with the /tasks endpoints
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
    console.error(`❌ Error in TaskService - ${context}:`, error);
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
   * Constants for task enums
   */
  static TASK_STATUS = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    BLOCKED: 'Blocked'
  };

  static TASK_PRIORITY = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    CRITICAL: 'Critical'
  };

  static TASK_CATEGORY = {
    DEVELOPMENT: 'Development',
    TESTING: 'Testing',
    DOCUMENTATION: 'Documentation',
    DESIGN: 'Design',
    OTHER: 'Other'
  };

  /**
   * Get all tasks from the API
   * @returns {Array} List of tasks or empty array if API fails
   */
  async getAllTasks() {
    try {
      console.log('📡 Fetching all tasks');
      console.log('Making request to:', `${api.defaults.baseURL}/tasks`);
      const response = await api.get('/tasks');
      console.log('Raw API Response:', response);

      // Map the database fields to frontend fields
      const tasks = response.data.map(task => ({
        id: task._id,
        taskName: task.taskName,
        taskDescription: task.taskDescription || '',
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        deadline: task.deadline,
        category: task.category,
        progress: task.progress,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }));

      console.log('✅ Found ' + tasks.length + ' tasks:', tasks);
      return tasks;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      throw error;
    }
  }

  async getTaskById(id) {
    try {
      console.log(`📡 Fetching task ${id}`);
      const response = await api.get(`/tasks/${id}`);
      console.log('✅ Task fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching task ${id}:`, error);
      this.logError(error, 'getTaskById');
      throw new Error(`Failed to fetch task: ${createErrorMessage(error)}`);
    }
  }

  async createTask(taskData) {
    try {
      // Map frontend fields to database fields
      const payload = {
        taskName: taskData.taskName,
        taskDescription: taskData.taskDescription,
        priority: taskData.priority || TaskService.TASK_PRIORITY.MEDIUM,
        status: taskData.status || TaskService.TASK_STATUS.TODO,
        assignee: taskData.assignee,
        deadline: taskData.deadline,
        category: taskData.category || TaskService.TASK_CATEGORY.DEVELOPMENT,
        progress: taskData.progress || 0
      };

      console.log('Creating task with payload:', payload);
      const response = await api.post('/tasks', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async updateTask(id, taskData) {
    try {
      const payload = {
        ...taskData,
        status: taskData.status || TaskService.TASK_STATUS.TODO,
        priority: taskData.priority || TaskService.TASK_PRIORITY.MEDIUM,
        category: taskData.category || TaskService.TASK_CATEGORY.DEVELOPMENT,
        progress: typeof taskData.progress === 'number' ? taskData.progress : 0
      };

      console.log(`Updating task ${id} with payload:`, payload);
      const response = await api.put(`/tasks/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id) {
    try {
      console.log(`📡 Deleting task ${id}`);
      const response = await api.delete(`/tasks/${id}`);
      console.log('✅ Task deleted');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting task ${id}:`, error);
      this.logError(error, 'deleteTask');
      throw new Error(`Failed to delete task: ${createErrorMessage(error)}`);
    }
  }

  async getTasksByProject(projectId) {
    try {
      console.log(`📡 Fetching tasks for project ${projectId}`);
      const response = await api.get(`/tasks/project/${projectId}`);
      console.log('✅ Project tasks fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project tasks:`, error);
      this.logError(error, 'getTasksByProject');
      return [];
    }
  }

  async getTasksByStory(storyId) {
    const cacheKey = `storyTasks:${storyId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching tasks for story ${storyId}...`);
      const response = await api.get(`/stories/${storyId}/tasks`);
      console.log('✅ Story tasks fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching story tasks:`, error);
      this.logError(error, 'getTasksByStory');
      return [];
    }
  }

  async getTasksBySprint(sprintId) {
    const cacheKey = `sprintTasks:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching tasks for sprint ${sprintId}...`);
      const response = await api.get(`/tasks/sprint/${sprintId}`);
      console.log('✅ Sprint tasks fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint tasks:`, error);
      this.logError(error, 'getTasksBySprint');
      return [];
    }
  }

  async updateTaskStatus(id, status) {
    try {
      console.log(`📡 Updating task ${id} status to: ${status}`);
      return this.updateTask(id, { status });
    } catch (error) {
      console.error(`❌ Error updating task status:`, error);
      this.logError(error, 'updateTaskStatus');
      throw error;
    }
  }

  async updateTaskPriority(id, priority) {
    try {
      console.log(`📡 Updating task ${id} priority to: ${priority}`);
      return this.updateTask(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating task priority:`, error);
      this.logError(error, 'updateTaskPriority');
      throw error;
    }
  }

  async updateEstimatedHours(id, hours) {
    try {
      console.log(`📡 Updating task ${id} estimated hours to: ${hours}`);
      return this.updateTask(id, { estimatedHours: hours });
    } catch (error) {
      console.error(`❌ Error updating estimated hours:`, error);
      this.logError(error, 'updateEstimatedHours');
      throw error;
    }
  }

  async logHours(id, hours) {
    try {
      console.log(`📡 Logging ${hours} hours for task ${id}`);
      const task = await this.getTaskById(id);
      const loggedHours = (task.loggedHours || 0) + hours;
      return this.updateTask(id, { loggedHours });
    } catch (error) {
      console.error(`❌ Error logging hours:`, error);
      this.logError(error, 'logHours');
      throw error;
    }
  }

  async assignTask(id, assigneeId) {
    try {
      console.log(`📡 Assigning task ${id} to user ${assigneeId}`);
      return this.updateTask(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error assigning task:`, error);
      this.logError(error, 'assignTask');
      throw error;
    }
  }

  async updateCodeReviewStatus(id, status) {
    try {
      console.log(`📡 Updating code review status for task ${id} to: ${status}`);
      return this.updateTask(id, { codeReviewStatus: status });
    } catch (error) {
      console.error(`❌ Error updating code review status:`, error);
      this.logError(error, 'updateCodeReviewStatus');
      throw error;
    }
  }

  async addComment(taskId, comment) {
    try {
      console.log(`📡 Adding comment to task ${taskId}`);
      const response = await api.post(`/tasks/${taskId}/comments`, comment);
      console.log('✅ Comment added:', response.data);
      this.cache.delete(`task:${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding comment:`, error);
      this.logError(error, 'addComment');
      throw new Error(`Failed to add comment: ${createErrorMessage(error)}`);
    }
  }

  async addAttachment(taskId, attachment) {
    try {
      console.log(`📡 Adding attachment to task ${taskId}`);
      const formData = new FormData();
      formData.append('file', attachment);
      
      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Attachment added:', response.data);
      this.cache.delete(`task:${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding attachment:`, error);
      this.logError(error, 'addAttachment');
      throw new Error(`Failed to add attachment: ${createErrorMessage(error)}`);
    }
  }
}

const taskService = new TaskService();
export default taskService;

// Export enums for use in components
export const TaskStatus = TaskService.TASK_STATUS;
export const TaskPriority = TaskService.TASK_PRIORITY;
export const TaskCategory = TaskService.TASK_CATEGORY; 