import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const TaskStatus = {
  NEW: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
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
   * Get all tasks from the API
   * @returns {Array} List of tasks or empty array if API fails
   */
  async getAllTasks() {
    try {
      console.log('📡 Fetching all tasks');
      console.log('Making request to: /stories?type=Task');
      
      const response = await api.get('/stories', {
        params: {
          type: 'Task'
        }
      });
      
      console.log('Raw API Response:', response);
      console.log('Response data:', response.data);
      
      // Map the Story model fields to task fields
      const tasks = (response.data || [])
        .filter(story => story.type === 'Task')
        .map(task => ({
          id: task._id,
          _id: task._id,
          taskName: task.title,
          taskDescription: task.description,
          priority: task.priority || TaskPriority.MEDIUM,
          deadline: task.dueDate,
          assignee: task.assignee,
          status: task.status || TaskStatus.NEW,
          category: task.category || TaskCategory.DEVELOPMENT,
          progress: task.storyPoints || 0,
          projectId: task.project,
          project: task.project // Keep both for compatibility
        }));

      console.log(`✅ Found ${tasks.length} tasks:`, tasks);
      return tasks;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      this.logError(error, 'getAllTasks');
      return []; // Return empty array instead of throwing
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
      console.log('📡 Creating new task');
      console.log('Task data:', taskData);
      
      // Convert task fields to Story model fields
      const storyData = {
        title: taskData.taskName,
        description: taskData.taskDescription,
        type: 'Task',
        priority: taskData.priority,
        status: taskData.status,
        dueDate: taskData.deadline,
        assignee: taskData.assignee,
        project: taskData.projectId,
        category: taskData.category,
        storyPoints: taskData.progress || 0
      };
      
      const response = await api.post('/stories', storyData);
      console.log('✅ Task created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating task:', error);
      this.logError(error, 'createTask');
      throw error;
    }
  }

  async updateTask(id, taskData) {
    try {
      console.log(`📡 Updating task ${id}`);
      const response = await api.put(`/tasks/${id}`, taskData);
      console.log('✅ Task updated:', response.data);
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
      console.log(`📡 Updating task ${id} status to ${status}`);
      
      // Use PUT to update the status
      const response = await api.put(`/stories/${id}`, { 
        status: status.toUpperCase(),
        type: 'Task'
      });
      
      console.log(`✅ Task status successfully updated to ${status}`);
      this.cache.delete('allTasks');
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating task ${id}:`, error);
      this.logError(error, 'updateTaskStatus');
      throw new Error(`Failed to update task: ${error.message}`);
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

  async createTestTask(projectId, userId) {
    try {
      console.log('📡 Creating test task with:', { projectId, userId });
      const testTask = {
        title: 'Test Task',
        description: 'This is a test task created for testing',
        type: 'Task',
        status: TaskStatus.NEW,
        priority: TaskPriority.MEDIUM,
        category: TaskCategory.DEVELOPMENT,
        project: projectId,
        assignee: userId,
        storyPoints: 0
      };
      
      console.log('Test task payload:', JSON.stringify(testTask, null, 2));
      const response = await api.post('/stories', testTask);
      console.log('Create task response:', response);
      console.log('Created task data:', response.data);

      // Map the response to match our task format
      const createdTask = {
        id: response.data._id,
        _id: response.data._id,
        taskName: response.data.title,
        taskDescription: response.data.description,
        priority: response.data.priority || TaskPriority.MEDIUM,
        status: response.data.status || TaskStatus.NEW,
        category: response.data.category || TaskCategory.DEVELOPMENT,
        progress: response.data.storyPoints || 0,
        projectId: response.data.project,
        project: response.data.project,
        assignee: response.data.assignee
      };

      console.log('Mapped task data:', createdTask);
      return createdTask;
    } catch (error) {
      console.error('❌ Error creating test task:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      this.logError(error, 'createTestTask');
      throw error;
    }
  }
}

// Export a singleton instance
const taskService = new TaskService();
export default taskService; 