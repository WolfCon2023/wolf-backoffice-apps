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
      console.log('📡 Creating new story with data:', storyData);

      // Safely extract IDs from objects
      const getIdFromObject = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        return obj._id || obj.id || null;
      };

      // Get project ID for key generation
      const projectId = getIdFromObject(storyData.project);
      
      // Generate key if not provided
      let key = storyData.key;
      if (!key && projectId) {
        try {
          key = await this.generateStoryKey(projectId);
          console.log('Generated new key:', key);
        } catch (error) {
          console.warn('Failed to generate story key:', error);
          key = `STORY-${Date.now()}`; // Fallback
        }
      }

      // Format the data for the API
      const formattedData = {
        title: storyData.title,
        type: storyData.type || 'Story',
        status: storyData.status?.toUpperCase().replace(/[\s-]+/g, '_') || 'IN_PROGRESS',
        priority: storyData.priority || 'High',
        project: projectId,
        reporter: getIdFromObject(storyData.reporter),
        key: key,
        description: storyData.description || '',
        sprint: getIdFromObject(storyData.sprint),
        feature: getIdFromObject(storyData.feature),
        assignee: getIdFromObject(storyData.assignee),
        storyPoints: parseInt(storyData.storyPoints) || 0
      };

      // Validate required fields
      const requiredFields = ['title', 'type', 'status', 'priority', 'project', 'reporter', 'key'];
      const missingFields = requiredFields.filter(field => !formattedData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('📤 Sending formatted data:', formattedData);
      const response = await api.post('/stories', formattedData);
      console.log('✅ Story created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      this.logError(error, 'createStory');
      throw error;
    }
  }

  async updateStory(storyId, storyData) {
    try {
      console.log('📡 Updating story with data:', storyData);
      
      // If only status is being updated, use the dedicated endpoint
      if (Object.keys(storyData).length === 1 && storyData.status) {
        return this.updateStoryStatus(storyId, storyData.status);
      }

      // Safely extract IDs from objects or use direct values
      const getIdFromObject = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string') return obj;
        return obj._id || obj.id || null;
      };

      // Format the data for the API ensuring all required fields
      const formattedData = {
        // Required fields
        title: storyData.title,
        type: storyData.type || 'Story',
        status: (storyData.status || 'IN_PROGRESS').toUpperCase().replace(/[\s-]+/g, '_'),
        priority: storyData.priority || 'High',
        project: getIdFromObject(storyData.project),
        reporter: getIdFromObject(storyData.reporter),
        
        // Optional fields
        description: storyData.description || '',
        sprint: getIdFromObject(storyData.sprint),
        feature: getIdFromObject(storyData.feature),
        assignee: getIdFromObject(storyData.assignee),
        storyPoints: parseInt(storyData.storyPoints) || 0
      };

      // First try to update the existing story
      try {
        // Try to get existing story just to check if it exists and get its key
        const existingStory = await this.getStoryById(storyId);
        formattedData.key = existingStory.key;
        
        console.log('📤 Updating existing story with data:', formattedData);
        const response = await api.put(`/stories/${storyId}`, formattedData);
        console.log('✅ Story updated successfully:', response.data);
        return response.data;
      } catch (error) {
        // If story doesn't exist (404) or API route not found, create a new story
        if (error.response?.status === 404 || error.message.includes('API route not found')) {
          console.log('Story not found or invalid ID, creating new story instead');
          
          // Generate a key for the new story
          if (formattedData.project) {
            try {
              formattedData.key = await this.generateStoryKey(formattedData.project);
            } catch (keyError) {
              console.warn('Failed to generate story key:', keyError);
              formattedData.key = `STORY-${Date.now()}`;
            }
          } else {
            formattedData.key = `STORY-${Date.now()}`;
          }

          // Validate required fields before creating
          const requiredFields = ['title', 'type', 'status', 'priority', 'project', 'reporter', 'key'];
          const missingFields = requiredFields.filter(field => !formattedData[field]);
          
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields for new story: ${missingFields.join(', ')}`);
          }

          console.log('📤 Creating new story with data:', formattedData);
          return await this.createStory(formattedData);
        }
        
        // If it's not a 404 error or API route not found, rethrow
        throw error;
      }
    } catch (error) {
      console.error('❌ Error updating/creating story:', error);
      this.logError(error, 'updateStory');
      throw error;
    }
  }

  /**
   * Generate a unique story key for a project
   * @param {string} projectId - The ID of the project
   * @returns {Promise<string>} The generated story key
   */
  async generateStoryKey(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to generate story key');
      }

      // Get the project details to get the project key
      const project = await api.get(`/projects/${projectId}`);
      const projectKey = project.data.key;

      // Get all stories for the project to determine the next number
      const stories = await api.get(`/stories/project/${projectId}`);
      const projectStories = stories.data || [];
      
      // Find the highest story number for this project
      const storyNumbers = projectStories
        .map(story => {
          const match = story.key?.match(new RegExp(`${projectKey}-(\\d+)`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => !isNaN(num));

      const nextNumber = storyNumbers.length > 0 ? Math.max(...storyNumbers) + 1 : 1;
      
      // Generate the new key
      const newKey = `${projectKey}-${nextNumber}`;
      console.log(`📝 Generated new story key: ${newKey}`);
      return newKey;
    } catch (error) {
      console.error('❌ Error generating story key:', error);
      this.logError(error, 'generateStoryKey');
      throw new Error('Failed to generate story key');
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
      
      // Normalize status to match enum
      const normalizedStatus = status.toUpperCase().replace(/[\s-]+/g, '_');
      
      // Validate status is a valid enum value
      const validStatuses = Object.values(StoryStatus);
      if (!validStatuses.includes(normalizedStatus)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Use the dedicated status update endpoint
      const response = await api.put(`/stories/${id}/status`, { 
        status: normalizedStatus
      });
      
      console.log(`✅ Status successfully updated to ${normalizedStatus}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating story status:', error);
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