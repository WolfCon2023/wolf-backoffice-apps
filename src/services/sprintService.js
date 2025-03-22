import { api } from './apiConfig';
import { createErrorMessage } from "../utils";
import ErrorLogger from '../utils/errorLogger';

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
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getAllSprints() {
    const cacheKey = "allSprints";
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log("📡 Fetching all sprints from projects...");
      // Get all projects
      const projectsResponse = await api.get('/projects');
      const projects = projectsResponse.data;
      
      console.log('📊 Project data structure:', JSON.stringify(projects, null, 2));
      
      // Create synthetic sprints for projects
      const allSprints = projects.map(project => {
        console.log(`Processing project ${project.id}:`, project);
        
        // Calculate sprint dates based on project dates
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.targetEndDate);
        const sprintDuration = 14 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds
        const totalDuration = endDate.getTime() - startDate.getTime();
        const numberOfSprints = Math.max(1, Math.ceil(totalDuration / sprintDuration));
        
        // Create sprints to cover the project duration
        return Array.from({ length: numberOfSprints }, (_, index) => {
          const sprintStartDate = new Date(startDate.getTime() + (index * sprintDuration));
          const sprintEndDate = new Date(Math.min(
            sprintStartDate.getTime() + sprintDuration,
            endDate.getTime()
          ));
          
          const sprint = {
            id: `sprint-${project._id}-${index + 1}`,
            name: `${project.name} Sprint ${index + 1}`,
            projectId: project._id,
            projectName: project.name,
            startDate: sprintStartDate.toISOString(),
            endDate: sprintEndDate.toISOString(),
            status: 'PLANNED',
            metrics: {
              totalStoryPoints: Math.round(project.metrics?.totalStoryPoints / numberOfSprints) || 0,
              completedStoryPoints: 0,
              velocity: project.metrics?.velocity || 0
            }
          };
          
          console.log(`✅ Created synthetic sprint for project ${project._id}:`, sprint);
          return sprint;
        });
      }).flat();
      
      console.log('✅ Sprints processed:', allSprints);
      this.setCachedData(cacheKey, allSprints);
      return allSprints;
    } catch (error) {
      this.logError(error, "getAllSprints");
      return [];
    }
  }

  async getSprint(id) {
    const cacheKey = `sprint:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching sprint ${id}...`);
      const response = await api.get(`/sprints/${id}`);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      this.logError(error, "getSprint");
      throw new Error(`Failed to fetch sprint: ${createErrorMessage(error)}`);
    }
  }

  async createSprint(sprintData) {
    try {
      console.log('📡 Creating new sprint:', sprintData);
      const response = await api.post('/sprints', sprintData);
      console.log('✅ Sprint created:', response.data);
      this.cache.delete('allSprints');
      return response.data;
    } catch (error) {
      this.logError(error, 'createSprint');
      throw new Error(`Failed to create sprint: ${createErrorMessage(error)}`);
    }
  }

  async updateSprint(id, sprintData) {
    try {
      console.log(`📡 Updating sprint ${id}:`, sprintData);
      const response = await api.put(`/sprints/${id}`, sprintData);
      console.log('✅ Sprint updated:', response.data);
      this.cache.delete('allSprints');
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      this.logError(error, 'updateSprint');
      throw new Error(`Failed to update sprint: ${createErrorMessage(error)}`);
    }
  }

  async deleteSprint(id) {
    try {
      console.log(`📡 Deleting sprint ${id}`);
      const response = await api.delete(`/sprints/${id}`);
      console.log('✅ Sprint deleted:', response.data);
      this.cache.delete('allSprints');
      this.cache.delete(`sprint:${id}`);
      return response.data;
    } catch (error) {
      this.logError(error, 'deleteSprint');
      throw new Error(`Failed to delete sprint: ${createErrorMessage(error)}`);
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