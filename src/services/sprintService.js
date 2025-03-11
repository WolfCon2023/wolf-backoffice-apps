import axios from 'axios';
import { api, handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || "https://wolf-backoffice-backend-development.up.railway.app/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

class SprintService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `SprintService:${context}`);
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

  async getAllSprints() {
    const cacheKey = 'allSprints';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📡 Fetching all sprints...');
      const response = await axios.get(`${API_BASE_URL}/sprints`, {
        headers: getAuthHeader()
      });
      console.log('✅ API Response:', response);
      this.setCachedData(cacheKey, response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching all sprints:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAllSprints');
      throw new Error(`Failed to fetch sprints: ${errorMessage}`);
    }
  }

  async getSprint(id) {
    const cacheKey = `sprint:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching sprint ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/sprints/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Sprint fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSprint');
      throw new Error(`Failed to fetch sprint: ${errorMessage}`);
    }
  }

  async createSprint(sprintData) {
    try {
      console.log('📡 Creating new sprint:', sprintData);
      const response = await axios.post(`${API_BASE_URL}/sprints`, sprintData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Sprint created:', response.data);
      this.cache.delete('allSprints');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating sprint:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'createSprint');
      throw new Error(`Failed to create sprint: ${errorMessage}`);
    }
  }

  async updateSprint(id, sprintData) {
    try {
      console.log(`📡 Updating sprint ${id}:`, sprintData);
      const response = await axios.put(`${API_BASE_URL}/sprints/${id}`, sprintData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Sprint updated:', response.data);
      this.cache.delete('allSprints');
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating sprint ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateSprint');
      throw new Error(`Failed to update sprint: ${errorMessage}`);
    }
  }

  async deleteSprint(id) {
    try {
      console.log(`📡 Deleting sprint ${id}`);
      const response = await axios.delete(`${API_BASE_URL}/sprints/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Sprint deleted:', response.data);
      this.cache.delete('allSprints');
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting sprint ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'deleteSprint');
      throw new Error(`Failed to delete sprint: ${errorMessage}`);
    }
  }

  async getSprintStories(id) {
    const cacheKey = `sprintStories:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for sprint ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/sprints/${id}/stories`, {
        headers: getAuthHeader()
      });
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
      const response = await axios.post(`${API_BASE_URL}/sprints/${sprintId}/stories/${storyId}`, null, {
        headers: getAuthHeader()
      });
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
      const response = await axios.delete(`${API_BASE_URL}/sprints/${sprintId}/stories/${storyId}`, {
        headers: getAuthHeader()
      });
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

      const response = await axios.post(`${API_BASE_URL}/sprints/${id}/start`, {
        ...startData,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString()
      }, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
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
      const response = await axios.post(`${API_BASE_URL}/sprints/${id}/complete`, {
        ...completeData,
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      }, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
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
      const response = await axios.get(`${API_BASE_URL}/sprints/${id}/metrics`, {
        headers: getAuthHeader()
      });
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
      const response = await axios.get(`${API_BASE_URL}/sprints/${id}/burndown`, {
        headers: getAuthHeader()
      });
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
      await this.getSprint(id);
      return true;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'refreshSprintCache');
      throw new Error(`Failed to refresh sprint cache: ${errorMessage}`);
    }
  }
}

export default new SprintService(); 