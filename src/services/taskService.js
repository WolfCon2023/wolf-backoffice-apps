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
    
    // Mock data to use when API fails
    this.mockTasks = [
      {
        id: 'task-001',
        title: 'Design Login Screen',
        description: 'Create mockups for the login interface',
        status: 'Completed',
        priority: 'High',
        createdAt: new Date('2025-03-12').toISOString(),
        assignee: 'dev-002',
        storyId: 'story-001',
        projectId: 'project-001',
        estimatedHours: 4,
        actualHours: 3.5
      },
      {
        id: 'task-002',
        title: 'Implement Login API',
        description: 'Create backend endpoints for authentication',
        status: 'In Progress',
        priority: 'High',
        createdAt: new Date('2025-03-14').toISOString(),
        assignee: 'dev-001',
        storyId: 'story-001',
        projectId: 'project-001',
        estimatedHours: 8,
        actualHours: 6
      },
      {
        id: 'task-003',
        title: 'Create Chart Components',
        description: 'Develop reusable chart components',
        status: 'To Do',
        priority: 'Medium',
        createdAt: new Date('2025-03-17').toISOString(),
        assignee: 'dev-003',
        storyId: 'story-002',
        projectId: 'project-001',
        estimatedHours: 6,
        actualHours: 0
      },
      {
        id: 'task-004',
        title: 'Setup Email Service',
        description: 'Configure email sending service',
        status: 'In Progress',
        priority: 'Medium',
        createdAt: new Date('2025-03-19').toISOString(),
        assignee: 'dev-001',
        storyId: 'story-004',
        projectId: 'project-002',
        estimatedHours: 3,
        actualHours: 2
      },
      {
        id: 'task-005',
        title: 'Write API Documentation',
        description: 'Document all API endpoints and parameters',
        status: 'To Do',
        priority: 'Low',
        createdAt: new Date('2025-03-21').toISOString(),
        assignee: 'dev-004',
        storyId: 'story-005',
        projectId: 'project-003',
        estimatedHours: 4,
        actualHours: 0
      }
    ];
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.group(`📋 TaskService Error - ${context}`);
    console.error('Error details:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.groupEnd();
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
    console.group('📋 TaskService - getAllTasks');
    console.time('getAllTasks');
    
    const cacheKey = 'allTasks';
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('✅ Using cached tasks data');
      console.timeEnd('getAllTasks');
      console.groupEnd();
      return cached;
    }

    // Check if this endpoint was marked as unavailable
    if (this.endpointAvailability['/tasks']?.available === false) {
      console.log('⚠️ /tasks endpoint was previously marked as unavailable. Using increments API instead.');
      console.timeEnd('getAllTasks');
      console.groupEnd();
      return [];
    }

    try {
      console.log('📡 Fetching all tasks from /tasks endpoint...');
      const startTime = performance.now();
      const response = await api.get('/tasks');
      const endTime = performance.now();
      
      console.log(`✅ Tasks fetched (${Math.round(endTime - startTime)}ms):`, response.data);
      console.log(`📊 Retrieved ${response.data.length} tasks`);
      
      this.setCachedData(cacheKey, response.data);
      this.checkEndpointAvailability('/tasks', true);
      
      console.timeEnd('getAllTasks');
      console.groupEnd();
      return response.data;
    } catch (error) {
      // IMPORTANT: Log 404 errors in detail for API troubleshooting
      if (error.response?.status === 404) {
        console.error('⚠️ API ENDPOINT NOT FOUND ERROR ⚠️');
        console.error(`🔍 Attempted to access: ${error.config?.url || '/tasks'}`);
        console.error(`📋 Status: ${error.response?.status} - ${error.response?.statusText}`);
        console.error(`📝 Message: ${error.response?.data?.message || 'No error message provided'}`);
        console.error('👉 This endpoint is missing in the backend implementation.');
        console.error('📝 RECOMMENDATION: Use the unified increments API instead - /increments will contain all task data');
        console.error('📋 Troubleshooting steps:');
        console.error('   1. Check if the backend server is running');
        console.error('   2. Use /increments or /increments/backlog endpoints instead');
        console.error('   3. Update code to use the new unified data model');
        
        this.checkEndpointAvailability('/tasks', false);
      } else {
        // Other errors could be permissions, server issues, etc.
        console.error(`❌ Error fetching tasks (${error.response?.status || 'Network Error'}):`);
        console.error('- Message:', error.message);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request Method:', error.config?.method);
      }
      
      this.logError(error, 'getAllTasks');
      console.timeEnd('getAllTasks');
      console.groupEnd();
      return [];
    }
  }

  async getTask(id) {
    const cacheKey = `task:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching task ${id}...`);
      const response = await api.get(`/tasks/${id}`);
      console.log('✅ Task fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching task ${id}:`, error);
      this.logError(error, 'getTask');
      throw new Error(`Failed to fetch task: ${createErrorMessage(error)}`);
    }
  }

  async createTask(taskData) {
    try {
      console.log('📡 Creating new task:', taskData);
      const response = await api.post('/tasks', {
        ...taskData,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Task created:', response.data);
      this.cache.delete('allTasks');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      this.logError(error, 'createTask');
      throw new Error(`Failed to create task: ${createErrorMessage(error)}`);
    }
  }

  async updateTask(id, taskData) {
    try {
      console.log(`📡 Updating task ${id}:`, taskData);
      const response = await api.put(`/tasks/${id}`, {
        ...taskData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Task updated:', response.data);
      this.cache.delete('allTasks');
      this.cache.delete(`task:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating task ${id}:`, error);
      this.logError(error, 'updateTask');
      throw new Error(`Failed to update task: ${createErrorMessage(error)}`);
    }
  }

  async deleteTask(id) {
    try {
      console.log(`📡 Deleting task ${id}`);
      const response = await api.delete(`/tasks/${id}`);
      console.log('✅ Task deleted:', response.data);
      this.cache.delete('allTasks');
      this.cache.delete(`task:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting task ${id}:`, error);
      this.logError(error, 'deleteTask');
      throw new Error(`Failed to delete task: ${createErrorMessage(error)}`);
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
      const response = await api.get(`/sprints/${sprintId}/tasks`);
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
      const task = await this.getTask(id);
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

export default new TaskService(); 