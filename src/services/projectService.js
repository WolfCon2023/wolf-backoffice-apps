import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

class ProjectService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `ProjectService:${context}`);
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

  async getAllProjects() {
    const cacheKey = 'allProjects';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📡 Fetching all projects...');
      const response = await api.get('/projects');
      console.log('✅ API Response:', response);
      this.setCachedData(cacheKey, response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching all projects:', error);
      this.logError(error, 'getAllProjects');
      throw new Error(`Failed to fetch projects: ${createErrorMessage(error)}`);
    }
  }

  async getProjectById(id) {
    const cacheKey = `project:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching project ${id}...`);
      const response = await api.get(`/projects/${id}`);
      console.log('✅ Project fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project ${id}:`, error);
      this.logError(error, 'getProjectById');
      throw new Error(`Failed to fetch project: ${createErrorMessage(error)}`);
    }
  }

  async createProject(projectData) {
    try {
      console.log('📡 Creating new project with data:', projectData);
      const response = await api.post('/projects', projectData);
      console.log('✅ Project created successfully:', response.data);
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${createErrorMessage(error)}`);
    }
  }

  async updateProject(id, projectData) {
    try {
      console.log(`📡 Updating project ${id}:`, projectData);
      const response = await api.put(`/projects/${id}`, projectData);
      console.log('✅ Project updated:', response.data);
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating project ${id}:`, error);
      this.logError(error, 'updateProject');
      throw new Error(`Failed to update project: ${createErrorMessage(error)}`);
    }
  }

  async deleteProject(id) {
    try {
      console.log(`📡 Deleting project ${id}`);
      const response = await api.delete(`/projects/${id}`);
      console.log('✅ Project deleted:', response.data);
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting project ${id}:`, error);
      this.logError(error, 'deleteProject');
      throw new Error(`Failed to delete project: ${createErrorMessage(error)}`);
    }
  }

  async getProjectMetrics(id) {
    const cacheKey = `projectMetrics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for project ${id}...`);
      const response = await api.get(`/projects/${id}/metrics`);
      console.log('✅ Project metrics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project metrics ${id}:`, error);
      this.logError(error, 'getProjectMetrics');
      throw new Error(`Failed to fetch project metrics: ${createErrorMessage(error)}`);
    }
  }

  async getProjectEpics(id) {
    const cacheKey = `projectEpics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching epics for project ${id}...`);
      const response = await api.get(`/projects/${id}/epics`);
      console.log('✅ Project epics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project epics ${id}:`, error);
      this.logError(error, 'getProjectEpics');
      throw new Error(`Failed to fetch project epics: ${createErrorMessage(error)}`);
    }
  }

  async getProjectStories(id) {
    const cacheKey = `projectStories:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for project ${id}...`);
      const response = await api.get(`/projects/${id}/stories`);
      console.log('✅ Project stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project stories ${id}:`, error);
      this.logError(error, 'getProjectStories');
      throw new Error(`Failed to fetch project stories: ${createErrorMessage(error)}`);
    }
  }

  async getProjectSprints(id) {
    const cacheKey = `projectSprints:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching sprints for project ${id}...`);
      const response = await api.get(`/projects/${id}/sprints`);
      console.log('✅ Project sprints fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project sprints ${id}:`, error);
      this.logError(error, 'getProjectSprints');
      throw new Error(`Failed to fetch project sprints: ${createErrorMessage(error)}`);
    }
  }

  async refreshProjectCache(id) {
    try {
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      this.cache.delete(`projectMetrics:${id}`);
      this.cache.delete(`projectEpics:${id}`);
      this.cache.delete(`projectStories:${id}`);
      this.cache.delete(`projectSprints:${id}`);
      
      await this.getProjectById(id);
      return true;
    } catch (error) {
      this.logError(error, 'refreshProjectCache');
      throw new Error(`Failed to refresh project cache: ${createErrorMessage(error)}`);
    }
  }
}

export default new ProjectService(); 