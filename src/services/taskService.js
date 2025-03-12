import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

class TaskService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `TaskService:${context}`);
  }

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

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getAllTasks() {
    const cacheKey = 'allTasks';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📡 Fetching all tasks...');
      const response = await api.get('/tasks');
      console.log('✅ Tasks fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching tasks:', error);
      this.logError(error, 'getAllTasks');
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