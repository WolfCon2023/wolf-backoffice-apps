import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

// Helper function for error message creation
const createErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

class IncrementService {
  constructor() {
    this.cache = new Map();
    this.endpointAvailability = {};
    this.logger = new ErrorLogger('IncrementService');
  }

  /**
   * Get data from cache if available and not expired
   */
  getCachedData(key, maxAge = 60000) { // Default max age is 1 minute
    const cachedItem = this.cache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < maxAge) {
      console.log(`🔄 Using cached data for ${key}`);
      return cachedItem.data;
    }
    return null;
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

  logError(error, method) {
    this.logger.logError(error, method);
  }

  /**
   * Get all increments with optional filtering
   */
  async getAllIncrements(filters = {}) {
    const cacheKey = `increments:${JSON.stringify(filters)}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    // First try the /increments endpoint
    try {
      console.log('📡 Fetching all increments with filters:', filters);
      const response = await api.get('/increments', { params: filters });
      console.log(`✅ Fetched ${response.data.length} increments`);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        console.error('⚠️ API ENDPOINT NOT FOUND ERROR: /increments');
        console.error(`🔍 Attempted to access: ${error.config?.url}`);
        console.error(`📋 Status: ${error.response?.status} - ${error.response?.statusText}`);
        console.error(`📝 Message: ${error.response?.data?.message || 'No error message provided'}`);
        
        // Try fallback to the /increments/backlog endpoint if available
        console.log('🔄 Attempting fallback to /increments/backlog endpoint...');
        try {
          // Note: We need a project filter to use this endpoint
          const projectId = filters.project || Object.keys(filters)[0]; // Try to get any project ID
          if (!projectId) {
            console.error('❌ No project ID available for fallback to /increments/backlog');
            return [];
          }
          
          const backlogResponse = await api.get('/increments/backlog', {
            params: { project: projectId }
          });
          
          // If we get here, the backlog endpoint works
          console.log('✅ Fallback to /increments/backlog successful');
          
          // Extract all increments from the backlog data
          let allIncrements = [];
          
          // Get backlog items (unassigned increments)
          if (backlogResponse.data.backlogItems) {
            allIncrements = [...backlogResponse.data.backlogItems];
          }
          
          // Get sprint increments
          if (backlogResponse.data.sprints) {
            backlogResponse.data.sprints.forEach(sprint => {
              if (sprint.increments) {
                allIncrements = [...allIncrements, ...sprint.increments];
              }
            });
          }
          
          console.log(`📊 Retrieved ${allIncrements.length} increments from backlog data`);
          
          // Cache the results
          this.setCachedData(cacheKey, allIncrements);
          return allIncrements;
        } catch (backlogError) {
          console.error('❌ Fallback to /increments/backlog also failed:', backlogError);
          console.error('👉 No increment endpoints are available in the API');
          this.logError(backlogError, 'getAllIncrements-fallback');
          return [];
        }
      } else {
        console.error('❌ Error fetching increments:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
      
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAllIncrements');
      // Return empty array instead of throwing error for better compatibility with other services
      console.warn(`Failed to fetch increments: ${errorMessage}`);
      return [];
    }
  }

  /**
   * Get backlog data (sprints with their increments plus unassigned items)
   */
  async getBacklogData(projectId) {
    const cacheKey = `backlog:${projectId}`;
    const cachedData = this.getCachedData(cacheKey, 30000); // 30 seconds cache
    if (cachedData) return cachedData;

    try {
      console.log(`📡 Fetching backlog data for project ${projectId}`);
      const response = await api.get('/increments/backlog', {
        params: { project: projectId }
      });
      console.log('✅ Fetched backlog data');
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching backlog data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getBacklogData');
      throw new Error(`Failed to fetch backlog data: ${errorMessage}`);
    }
  }

  /**
   * Get increment by ID
   */
  async getIncrementById(id) {
    const cacheKey = `increment:${id}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      console.log(`📡 Fetching increment ${id}`);
      const response = await api.get(`/increments/${id}`);
      console.log('✅ Fetched increment:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching increment ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getIncrementById');
      throw new Error(`Failed to fetch increment: ${errorMessage}`);
    }
  }

  /**
   * Create increment
   */
  async createIncrement(data) {
    try {
      console.log('📡 Creating increment:', data);
      
      // Add debugging to check payload structure
      console.log('Request payload details:');
      console.log('- Type:', data.type);
      console.log('- Title:', data.title);
      console.log('- Project:', data.project);
      console.log('- Sprint:', data.sprint);
      console.log('- Full payload:', JSON.stringify(data, null, 2));
      
      const response = await api.post('/increments', data);
      console.log('✅ Created increment:', response.data);
      
      // Clear relevant caches
      this.clearRelevantCaches(data.project);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating increment:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Request config:', error.config);
      } else if (error.request) {
        console.error('No response received. Request details:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'createIncrement');
      throw new Error(`Failed to create increment: ${errorMessage}`);
    }
  }

  /**
   * Update increment
   */
  async updateIncrement(id, data) {
    try {
      console.log(`📡 Updating increment ${id}:`, data);
      const response = await api.put(`/increments/${id}`, data);
      console.log('✅ Updated increment:', response.data);
      
      // Clear caches
      this.cache.delete(`increment:${id}`);
      this.clearRelevantCaches(data.project);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating increment ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateIncrement');
      throw new Error(`Failed to update increment: ${errorMessage}`);
    }
  }

  /**
   * Delete increment
   */
  async deleteIncrement(id) {
    try {
      console.log(`📡 Deleting increment ${id}`);
      const response = await api.delete(`/increments/${id}`);
      console.log('✅ Deleted increment');
      
      // Get a reference to the project ID before clearing cache
      const incrementData = this.getCachedData(`increment:${id}`);
      const projectId = incrementData?.project?._id || incrementData?.project;
      
      // Clear caches
      this.cache.delete(`increment:${id}`);
      if (projectId) {
        this.clearRelevantCaches(projectId);
      } else {
        // If we don't know the project ID, clear all increment-related caches
        this.clearAllIncrementCaches();
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting increment ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'deleteIncrement');
      throw new Error(`Failed to delete increment: ${errorMessage}`);
    }
  }

  /**
   * Add/remove increment to/from sprint
   */
  async updateIncrementSprint(id, sprintId, action) {
    try {
      console.log(`📡 ${action === 'add' ? 'Adding' : 'Removing'} increment ${id} ${action === 'add' ? 'to' : 'from'} sprint ${sprintId}`);
      const response = await api.put(`/increments/${id}/sprint/${sprintId}`, { action });
      console.log('✅ Updated increment sprint:', response.data);
      
      // Get a reference to the project ID before clearing cache
      const incrementData = this.getCachedData(`increment:${id}`);
      const projectId = incrementData?.project?._id || incrementData?.project;
      
      // Clear caches
      this.cache.delete(`increment:${id}`);
      if (projectId) {
        this.clearRelevantCaches(projectId);
      } else {
        this.clearAllIncrementCaches();
      }
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating increment sprint:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateIncrementSprint');
      throw new Error(`Failed to update increment sprint: ${errorMessage}`);
    }
  }

  /**
   * Add comment to increment
   */
  async addComment(id, text) {
    try {
      console.log(`📡 Adding comment to increment ${id}`);
      const response = await api.post(`/increments/${id}/comments`, { text });
      console.log('✅ Added comment:', response.data);
      
      // Clear cache for this increment
      this.cache.delete(`increment:${id}`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding comment to increment ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'addComment');
      throw new Error(`Failed to add comment: ${errorMessage}`);
    }
  }

  /**
   * Helper to clear all relevant caches when project data changes
   */
  clearRelevantCaches(projectId) {
    // Clear any cache keys related to this project
    for (const key of this.cache.keys()) {
      if (key.includes(projectId) || 
          key.startsWith('increments:') ||
          key.startsWith('backlog:')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Helper to clear all increment-related caches
   */
  clearAllIncrementCaches() {
    for (const key of this.cache.keys()) {
      if (key.startsWith('increment:') || 
          key.startsWith('increments:') ||
          key.startsWith('backlog:')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get increments by sprint ID
   */
  async getIncrementsBySprint(sprintId) {
    const cacheKey = `sprintIncrements:${sprintId}`;
    const cachedData = this.getCachedData(cacheKey, 30000); // 30 seconds cache
    if (cachedData) return cachedData;

    try {
      console.log(`📡 Fetching increments for sprint ${sprintId}`);
      const response = await api.get('/increments', {
        params: { sprint: sprintId }
      });
      console.log(`✅ Fetched ${response.data.length} increments for sprint ${sprintId}`);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching increments for sprint:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getIncrementsBySprint');
      throw new Error(`Failed to fetch sprint increments: ${errorMessage}`);
    }
  }
}

export const incrementService = new IncrementService();
export default incrementService; 