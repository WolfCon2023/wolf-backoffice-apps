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
    try {
      console.log('📡 Fetching all stories');
      
      // Check cache
      if (this.cache.has('allStories')) {
        const cachedData = this.cache.get('allStories');
        console.log('✅ Using cached stories');
        return cachedData;
      }
      
      const response = await api.get('/stories');
      console.log('✅ Stories fetched successfully:', response.data.length);
      
      // Cache the data
      this.cache.set('allStories', response.data);
      
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
      
      // Check cache
      const cacheKey = `story:${id}`;
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        console.log('✅ Using cached story');
        return cachedData;
      }
      
      const response = await api.get(`/stories/${id}`);
      console.log('✅ Story fetched:', response.data);
      
      // Cache the data
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching story ${id}:`, error);
      this.logError(error, 'getStoryById');
      throw new Error(`Failed to fetch story: ${createErrorMessage(error)}`);
    }
  }

  async createStory(storyData) {
    try {
      console.log('📡 Creating new story');
      console.log('Story data:', storyData);
      
      if (!storyData.reporter) {
        throw new Error('Reporter ID is required');
      }

      // Ensure all required fields are present and properly formatted
      const payload = {
        key: storyData.key,
        title: storyData.title,
        description: storyData.description || '',
        priority: storyData.priority || 'Medium',
        type: storyData.type || 'Story',
        status: storyData.status || 'PLANNING',
        storyPoints: storyData.storyPoints ? parseInt(storyData.storyPoints) : 0,
        estimatedHours: storyData.estimatedHours ? parseFloat(storyData.estimatedHours) : 0,
        assignee: storyData.assignee || null,
        reporter: storyData.reporter, // MongoDB ObjectId
        project: storyData.project,
        sprint: storyData.sprint || null,
        feature: storyData.feature || null
      };

      // Log the reporter ID specifically
      console.log('Reporter ID being sent:', payload.reporter);
      console.log('Full payload:', payload);
      
      const response = await api.post('/stories', payload);
      console.log('✅ Story created:', response.data);
      
      // Clear the cache
      this.cache.delete('allStories');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      this.logError(error, 'createStory');
      throw error;
    }
  }

  async updateStory(id, storyData) {
    try {
      console.log(`📡 Updating story ${id}`);
      const response = await api.put(`/stories/${id}`, storyData);
      console.log('✅ Story updated:', response.data);
      
      // Clear the cache
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
      console.log('✅ Story deleted');
      
      // Clear the cache
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
      console.log(`📡 Fetching stories for project ${projectId}`);
      const response = await api.get(`/stories/project/${projectId}`);
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

  async updateStoryPoints(id, points) {
    try {
      console.log(`📡 Updating story ${id} points to: ${points}`);
      return this.updateStory(id, { storyPoints: parseInt(points) });
    } catch (error) {
      console.error(`❌ Error updating story points:`, error);
      this.logError(error, 'updateStoryPoints');
      throw new Error(`Failed to update story points: ${createErrorMessage(error)}`);
    }
  }

  async moveStoryToSprint(id, sprintId) {
    try {
      console.log(`📡 Moving story ${id} to sprint: ${sprintId}`);
      return this.updateStory(id, { sprintId });
    } catch (error) {
      console.error(`❌ Error moving story to sprint:`, error);
      this.logError(error, 'moveStoryToSprint');
      throw new Error(`Failed to move story to sprint: ${createErrorMessage(error)}`);
    }
  }

  clearCache() {
    console.log('🧹 Clearing story service cache');
    this.cache.clear();
  }
}

// Create and export a singleton instance
const storyService = new StoryService();
export { storyService };
export default storyService;
