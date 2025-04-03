import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

/**
 * Service for managing story-related API requests
 * This handles all interactions with the /stories endpoints
 */
class StoryService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.endpointAvailability = {
      '/stories': { available: null, lastChecked: null }
    };
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.error(`❌ Error in StoryService - ${context}:`, error);
    return ErrorLogger.logToFile(error, `StoryService:${context}`);
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
   * Get all stories from the API
   * @returns {Array} List of stories or empty array if API fails
   */
  async getAllStories() {
    try {
      console.log('📡 Fetching all stories');
      const response = await api.get('/stories');
      console.log('✅ Stories fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stories:', error);
      this.logError(error, 'getAllStories');
      throw new Error(`Failed to fetch stories: ${createErrorMessage(error)}`);
    }
  }

  async getStoryById(id) {
    try {
      console.log(`📡 Fetching story ${id}`);
      const response = await api.get(`/stories/${id}`);
      console.log('✅ Story fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching story ${id}:`, error);
      this.logError(error, 'getStoryById');
      throw new Error(`Failed to fetch story: ${createErrorMessage(error)}`);
    }
  }

  async createStory(storyData) {
    try {
      if (!storyData.reporter) {
        throw new Error('Reporter is required');
      }

      if (!storyData.project) {
        throw new Error('Project is required');
      }

      // Set type to Feature by default
      storyData.type = 'Feature';

      // Generate a temporary key - the backend will handle the actual unique key
      storyData.key = `TEMP-${Date.now()}`;

      console.log('Creating story with reporter:', storyData.reporter);
      console.log('Full payload:', storyData);

      const response = await api.post('/stories', storyData);
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  async updateStory(id, storyData) {
    try {
      console.log(`📡 Updating story ${id}`);
      const response = await api.put(`/stories/${id}`, storyData);
      console.log('✅ Story updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating story ${id}:`, error);
      this.logError(error, 'updateStory');
      throw new Error(`Failed to update story: ${createErrorMessage(error)}`);
    }
  }

  async deleteStory(id) {
    try {
      console.log(`📡 Deleting story ${id}`);
      const response = await api.delete(`/stories/${id}`);
      console.log('✅ Story deleted');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting story ${id}:`, error);
      this.logError(error, 'deleteStory');
      throw new Error(`Failed to delete story: ${createErrorMessage(error)}`);
    }
  }

  async getStoriesByProject(projectId) {
    try {
      console.log(`📡 Fetching stories for project ${projectId}`);
      const response = await api.get(`/stories/project/${projectId}`);
      console.log('✅ Project stories fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project stories:`, error);
      this.logError(error, 'getStoriesByProject');
      return [];
    }
  }

  async getStoriesBySprint(sprintId) {
    const cacheKey = `sprintStories:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for sprint ${sprintId}...`);
      const response = await api.get(`/sprints/${sprintId}/stories`);
      console.log('✅ Sprint stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint stories:`, error);
      this.logError(error, 'getStoriesBySprint');
      return [];
    }
  }

  async updateStoryStatus(id, status) {
    try {
      // Validate status
      if (!['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'].includes(status.toUpperCase())) {
        throw new Error(`Invalid status value: ${status}. Must be one of: PLANNING, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD`);
      }

      console.log(`📡 Updating story ${id} status to ${status}`);
      
      // Use the dedicated status update endpoint
      const response = await api.put(`/stories/${id}/status`, { 
        status: status.toUpperCase()
      });
      
      console.log(`✅ Status successfully updated to ${status}`);
      this.cache.delete('allStories');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      this.logError(error, 'updateStoryStatus');
      throw new Error(`Failed to update story status: ${error.message}`);
    }
  }

  async updateStoryPriority(id, priority) {
    try {
      console.log(`📡 Updating story ${id} priority to: ${priority}`);
      return this.updateStory(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating story priority:`, error);
      this.logError(error, 'updateStoryPriority');
      throw new Error(`Failed to update story priority: ${createErrorMessage(error)}`);
    }
  }

  async updateStoryAssignee(id, assigneeId) {
    try {
      console.log(`📡 Updating story ${id} assignee to: ${assigneeId}`);
      return this.updateStory(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error updating story assignee:`, error);
      this.logError(error, 'updateStoryAssignee');
      throw new Error(`Failed to update story assignee: ${createErrorMessage(error)}`);
    }
  }

  async createTestStories(projectId, reporterId) {
    try {
      // Create a task
      const taskStory = {
        type: 'Task',
        title: 'Test Task',
        description: 'This is a test task',
        status: 'PLANNING',
        priority: 'Medium',
        project: projectId,
        reporter: reporterId,
        key: `TASK-${Date.now()}`
      };

      // Create a bug (not defect - to match backend model)
      const bugStory = {
        type: 'Bug',  // Using 'Bug' to match the backend model's enum
        title: 'Test Bug',
        description: 'This is a test bug',
        status: 'PLANNING',  // Using standard story status
        priority: 'High',
        project: projectId,
        reporter: reporterId,
        key: `BUG-${Date.now()}`
      };

      // Create both stories
      const [task, bug] = await Promise.all([
        this.createStory(taskStory),
        this.createStory(bugStory)
      ]);

      console.log('Created test stories:', { task, bug });
      return { task, bug };
    } catch (error) {
      console.error('Error creating test stories:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const storyService = new StoryService();