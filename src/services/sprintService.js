import axios from "axios";
import { api } from './apiConfig';
import { createErrorMessage } from "../utils";
import ErrorLogger from '../utils/errorLogger';

class SprintService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, method) {
    console.error(`Error in SprintService.${method}:`, error);
    if (error.response) {
      console.error('Response error details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      });
    }
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
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getAllSprints() {
    try {
      console.log('📡 Fetching all sprints...');
      const response = await api.get('/sprints');
      const sprints = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${sprints.length} sprints`);
      this.cache.set('allSprints', sprints);
      return sprints;
    } catch (error) {
      this.logError(error, 'getAllSprints');
      throw new Error(`Failed to fetch sprints: ${error.message}`);
    }
  }

  async getSprintById(id) {
    try {
      console.log(`📡 Fetching sprint ${id}...`);
      const response = await api.get(`/sprints/${id}`);
      console.log('✅ Sprint fetched successfully');
      return response.data;
    } catch (error) {
      this.logError(error, 'getSprintById');
      throw new Error(`Failed to fetch sprint: ${error.message}`);
    }
  }

  async createSprint(sprintData) {
    try {
      console.log("📡 Creating new sprint:", sprintData);
      console.log("🔍 Project ID:", sprintData.project);
      
      const response = await api.post('/sprints', sprintData);
      console.log('✅ Sprint created successfully:', response.data.name);
      this.cache.delete('allSprints');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating sprint:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        });
      }
      this.logError(error, 'createSprint');
      throw new Error(`Failed to create sprint: ${error.message}`);
    }
  }

  async updateSprint(id, sprintData) {
    try {
      console.log(`📡 Updating sprint ${id} with data:`, sprintData);
      const response = await api.put(`/sprints/${id}`, sprintData);
      console.log('✅ Sprint updated successfully:', response.data.name);
      this.cache.delete('allSprints');
      return response.data;
    } catch (error) {
      this.logError(error, 'updateSprint');
      throw new Error(`Failed to update sprint: ${error.message}`);
    }
  }

  async deleteSprint(id) {
    try {
      console.log(`📡 Deleting sprint ${id}...`);
      const response = await api.delete(`/sprints/${id}`);
      console.log('✅ Sprint deleted successfully');
      this.cache.delete('allSprints');
      return response.data;
    } catch (error) {
      this.logError(error, 'deleteSprint');
      throw new Error(`Failed to delete sprint: ${error.message}`);
    }
  }

  async updateSprintStatus(id, status) {
    try {
      // Validate status
      if (!['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
        throw new Error(`Invalid status value: ${status}. Must be one of: PLANNING, IN_PROGRESS, COMPLETED, CANCELLED`);
      }

      console.log(`📡 Updating sprint ${id} status to ${status}`);
      
      // Use the dedicated status update endpoint
      const response = await api.put(`/sprints/${id}/status`, { 
        status: status.toUpperCase()
      });
      
      console.log(`✅ Status successfully updated to ${status}`);
      this.cache.delete('allSprints');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating sprint status:', error);
      this.logError(error, 'updateSprintStatus');
      throw new Error(`Failed to update sprint status: ${error.message}`);
    }
  }

  async getSprintStories(id) {
    const cacheKey = `sprintStories:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for sprint ${id}...`);
      const response = await api.get(`/sprints/${id}/stories`);
      console.log('✅ Sprint stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint stories ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSprintStories');
      throw new Error(`Failed to fetch sprint stories: ${errorMessage}`);
    }
  }

  async addStoryToSprint(sprintId, storyId) {
    try {
      console.log(`📡 Adding story ${storyId} to sprint ${sprintId}...`);
      const response = await api.post(`/sprints/${sprintId}/stories/${storyId}`);
      console.log('✅ Story added to sprint:', response.data);
      this.cache.delete(`sprint:${sprintId}`);
      this.cache.delete(`sprintStories:${sprintId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding story to sprint:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'addStoryToSprint');
      throw new Error(`Failed to add story to sprint: ${errorMessage}`);
    }
  }

  async removeStoryFromSprint(sprintId, storyId) {
    try {
      console.log(`📡 Removing story ${storyId} from sprint ${sprintId}...`);
      const response = await api.delete(`/sprints/${sprintId}/stories/${storyId}`);
      console.log('✅ Story removed from sprint:', response.data);
      this.cache.delete(`sprint:${sprintId}`);
      this.cache.delete(`sprintStories:${sprintId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing story from sprint:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'removeStoryFromSprint');
      throw new Error(`Failed to remove story from sprint: ${errorMessage}`);
    }
  }

  async startSprint(id, startData) {
    try {
      console.log(`📡 Starting sprint ${id}:`, startData);
      if (!startData.startDate) throw new Error('Start date is required');
      if (!startData.endDate) throw new Error('End date is required');

      const response = await api.post(`/sprints/${id}/start`, {
        ...startData,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString()
      });
      console.log('✅ Sprint started:', response.data);
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error starting sprint ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'startSprint');
      throw new Error(`Failed to start sprint: ${errorMessage}`);
    }
  }

  async completeSprint(id, completeData) {
    try {
      console.log(`📡 Completing sprint ${id}:`, completeData);
      const response = await api.post(`/sprints/${id}/complete`, {
        ...completeData,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      });
      console.log('✅ Sprint completed:', response.data);
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error completing sprint ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'completeSprint');
      throw new Error(`Failed to complete sprint: ${errorMessage}`);
    }
  }

  async getSprintMetrics(id) {
    const cacheKey = `sprintMetrics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for sprint ${id}...`);
      const response = await api.get(`/sprints/${id}/metrics`);
      console.log('✅ Sprint metrics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint metrics ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSprintMetrics');
      throw new Error(`Failed to fetch sprint metrics: ${errorMessage}`);
    }
  }

  async getSprintBurndown(id) {
    const cacheKey = `sprintBurndown:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching burndown for sprint ${id}...`);
      const response = await api.get(`/sprints/${id}/burndown`);
      console.log('✅ Sprint burndown fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint burndown ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSprintBurndown');
      throw new Error(`Failed to fetch sprint burndown: ${errorMessage}`);
    }
  }

  async refreshSprintCache(id) {
    try {
      // Clear specific sprint caches
      this.cache.delete('allSprints');
      this.cache.delete(`sprint:${id}`);
      this.cache.delete(`sprintStories:${id}`);
      this.cache.delete(`sprintMetrics:${id}`);
      this.cache.delete(`sprintBurndown:${id}`);
      
      // Refetch sprint data
      await this.getSprintById(id);
      return true;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'refreshSprintCache');
      throw new Error(`Failed to refresh sprint cache: ${errorMessage}`);
    }
  }

  getErrorMessage(error) {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.message || 
           'An unknown error occurred';
  }
}

const sprintService = new SprintService();
export { sprintService };
export default sprintService; 