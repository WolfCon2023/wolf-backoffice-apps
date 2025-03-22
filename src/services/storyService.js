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
    console.group(`📋 StoryService Error - ${context}`);
    console.error('Error details:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.groupEnd();
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
    console.group('📋 StoryService - getAllStories');
    console.time('getAllStories');
    
    const cacheKey = 'allStories';
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('✅ Using cached stories data');
      console.timeEnd('getAllStories');
      console.groupEnd();
      return cached;
    }

    try {
      console.log('📡 Fetching all stories from /stories endpoint...');
      const startTime = performance.now();
      const response = await api.get('/stories');
      const endTime = performance.now();
      
      console.log(`✅ Stories fetched (${Math.round(endTime - startTime)}ms):`, response.data);
      console.log(`📊 Retrieved ${response.data.length} stories`);
      
      this.setCachedData(cacheKey, response.data);
      this.checkEndpointAvailability('/stories', true);
      
      console.timeEnd('getAllStories');
      console.groupEnd();
      return response.data;
    } catch (error) {
      // 404 errors mean the endpoint doesn't exist yet
      if (error.response?.status === 404) {
        console.warn('⚠️ The stories endpoint (/api/stories) returned 404.');
        console.warn('👉 This likely means the endpoint has not been implemented in the backend yet.');
        console.warn('📋 Check your backend implementation for missing routes.');
        this.checkEndpointAvailability('/stories', false);
      } else {
        // Other errors could be permissions, server issues, etc.
        console.error(`❌ Error fetching stories (${error.response?.status || 'Network Error'}):`);
        console.error('- Message:', error.message);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request Method:', error.config?.method);
      }
      
      this.logError(error, 'getAllStories');
      console.timeEnd('getAllStories');
      console.groupEnd();
      return [];
    }
  }

  async getStory(id) {
    const cacheKey = `story:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching story ${id}...`);
      const response = await api.get(`/stories/${id}`);
      console.log('✅ Story fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching story ${id}:`, error);
      this.logError(error, 'getStory');
      throw new Error(`Failed to fetch story: ${createErrorMessage(error)}`);
    }
  }

  async createStory(storyData) {
    try {
      console.log('📡 Creating new story:', storyData);
      const response = await api.post('/stories', {
        ...storyData,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Story created:', response.data);
      this.cache.delete('allStories');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      this.logError(error, 'createStory');
      throw new Error(`Failed to create story: ${createErrorMessage(error)}`);
    }
  }

  async updateStory(id, storyData) {
    try {
      console.log(`📡 Updating story ${id}:`, storyData);
      const response = await api.put(`/stories/${id}`, {
        ...storyData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Story updated:', response.data);
      this.cache.delete('allStories');
      this.cache.delete(`story:${id}`);
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
      console.log('✅ Story deleted:', response.data);
      this.cache.delete('allStories');
      this.cache.delete(`story:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting story ${id}:`, error);
      this.logError(error, 'deleteStory');
      throw new Error(`Failed to delete story: ${createErrorMessage(error)}`);
    }
  }

  async getStoriesByProject(projectId) {
    const cacheKey = `projectStories:${projectId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for project ${projectId}...`);
      const response = await api.get(`/projects/${projectId}/stories`);
      console.log('✅ Project stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
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
      console.log(`📡 Updating story ${id} status to: ${status}`);
      return this.updateStory(id, { status });
    } catch (error) {
      console.error(`❌ Error updating story status:`, error);
      this.logError(error, 'updateStoryStatus');
      throw error;
    }
  }

  async updateStoryPriority(id, priority) {
    try {
      console.log(`📡 Updating story ${id} priority to: ${priority}`);
      return this.updateStory(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating story priority:`, error);
      this.logError(error, 'updateStoryPriority');
      throw error;
    }
  }

  async updateStoryPoints(id, points) {
    try {
      console.log(`📡 Updating story ${id} points to: ${points}`);
      return this.updateStory(id, { storyPoints: points });
    } catch (error) {
      console.error(`❌ Error updating story points:`, error);
      this.logError(error, 'updateStoryPoints');
      throw error;
    }
  }

  async assignStory(id, assigneeId) {
    try {
      console.log(`📡 Assigning story ${id} to user ${assigneeId}`);
      return this.updateStory(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error assigning story:`, error);
      this.logError(error, 'assignStory');
      throw error;
    }
  }

  async addComment(storyId, comment) {
    try {
      console.log(`📡 Adding comment to story ${storyId}`);
      const response = await api.post(`/stories/${storyId}/comments`, comment);
      console.log('✅ Comment added:', response.data);
      this.cache.delete(`story:${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding comment:`, error);
      this.logError(error, 'addComment');
      throw new Error(`Failed to add comment: ${createErrorMessage(error)}`);
    }
  }

  async addAttachment(storyId, attachment) {
    try {
      console.log(`📡 Adding attachment to story ${storyId}`);
      const formData = new FormData();
      formData.append('file', attachment);
      
      const response = await api.post(`/stories/${storyId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Attachment added:', response.data);
      this.cache.delete(`story:${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding attachment:`, error);
      this.logError(error, 'addAttachment');
      throw new Error(`Failed to add attachment: ${createErrorMessage(error)}`);
    }
  }
}

export default new StoryService();  