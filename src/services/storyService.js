import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

/**
 * Service for managing story-related API requests
 * This handles all interactions with the /stories endpoints
 */
export const StoryStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD'
};

class StoryService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.error(`❌ StoryService Error (${context}):`, error);
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
      console.log('📡 Fetching all stories...');
      const response = await api.get('/stories');
      
      if (!response.data) {
        console.warn('No data received from stories API');
        return [];
      }

      const stories = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${stories.length} stories`);
      return stories;
    } catch (error) {
      console.error('❌ Error fetching stories:', error);
      this.logError(error, 'getAllStories');
      throw new Error(`Failed to fetch stories: ${error.message}`);
    }
  }

  async getStoryById(id) {
    try {
      console.log(`📡 Fetching story ${id}`);
      const response = await api.get(`/stories/${id}`);
      console.log('✅ Story fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching story:', error);
      this.logError(error, 'getStoryById');
      throw new Error(`Failed to fetch story: ${error.message}`);
    }
  }

  async createStory(storyData) {
    try {
      console.log('📡 Creating story with data:', storyData);
      
      // Format the data for the API
      const formattedData = {
        title: storyData.title,
        description: storyData.description,
        type: storyData.type || 'Feature',
        status: storyData.status?.toUpperCase().replace(/\s+/g, '_') || 'PLANNING',
        priority: storyData.priority || 'Medium',
        project: storyData.project,
        sprint: storyData.sprint || null,
        feature: storyData.feature || null,
        reporter: storyData.reporter,
        assignee: storyData.assignee || null,
        storyPoints: parseInt(storyData.storyPoints) || 0
      };

      const response = await api.post('/stories', formattedData);
      console.log('✅ Story created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      this.logError(error, 'createStory');
      throw new Error(`Failed to create story: ${error.message}`);
    }
  }

  async updateStory(storyId, storyData) {
    try {
      console.log('📡 Updating story with data:', storyData);
      
      // Format the data for the API ensuring all required fields
      const formattedData = {
        type: storyData.type || 'Task', // Required field
        title: storyData.title,
        description: storyData.description || '',
        status: storyData.status?.toUpperCase().replace(/\s+/g, '_') || 'PLANNING',
        priority: storyData.priority || 'Medium',
        storyPoints: parseInt(storyData.storyPoints) || 0,
        project: storyData.project?._id || storyData.project, // Send only the ID
        sprint: storyData.sprint || null,
        assignee: storyData.assignee?._id || storyData.assignee || null, // Send only the ID
        reporter: storyData.reporter?._id || storyData.reporter, // Send only the ID
        key: storyData.key // Preserve the existing key
      };

      // Remove any undefined or null values
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === undefined) {
          delete formattedData[key];
        }
      });

      console.log('📤 Sending formatted data:', formattedData);
      const response = await api.put(`/stories/${storyId}`, formattedData);
      console.log('✅ Story updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating story:', error);
      this.logError(error, 'updateStory');
      throw error;
    }
  }

  async deleteStory(id) {
    try {
      console.log(`📡 Deleting story ${id}`);
      const response = await api.delete(`/stories/${id}`);
      console.log('✅ Story deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting story:', error);
      this.logError(error, 'deleteStory');
      throw new Error(`Failed to delete story: ${error.message}`);
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
      console.log(`📡 Updating story ${id} status to ${status}`);
      
      // Ensure status is uppercase
      const normalizedStatus = status.toUpperCase();
      
      // Use the dedicated status update endpoint
      const response = await api.put(`/stories/${id}/status`, { 
        status: normalizedStatus
      });
      
      console.log(`✅ Status successfully updated to ${normalizedStatus}`);
      this.cache.delete('allStories');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      this.logError(error, 'updateStoryStatus');
      throw new Error(`Failed to update story status: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateStoryPriority(id, priority) {
    try {
      console.log(`📡 Updating story ${id} priority to: ${priority}`);
      return this.updateStory(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating story priority:`, error);
      this.logError(error, 'updateStoryPriority');
      throw new Error(`Failed to update story priority: ${error.message}`);
    }
  }

  async updateStoryAssignee(id, assigneeId) {
    try {
      console.log(`📡 Updating story ${id} assignee to: ${assigneeId}`);
      return this.updateStory(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error updating story assignee:`, error);
      this.logError(error, 'updateStoryAssignee');
      throw new Error(`Failed to update story assignee: ${error.message}`);
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

// Export a singleton instance
export const storyService = new StoryService();