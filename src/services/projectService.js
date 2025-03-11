import axios from 'axios';
import { handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

// Add request interceptor
axios.interceptors.request.use(
  config => {
    console.log('🔍 Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axios.interceptors.response.use(
  response => {
    console.log('✅ Response:', {
      status: response.status,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '');
if (!API_BASE_URL) {
  throw new Error('REACT_APP_API_BASE_URL is not defined in environment variables');
}

console.log('🔧 API_BASE_URL:', API_BASE_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

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
      const url = `${API_BASE_URL}/projects`;
      console.log('🔧 Making request to:', url);
      console.log('🔧 With headers:', getAuthHeader());
      
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      
      console.log('✅ API Response:', response);
      this.setCachedData(cacheKey, response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching all projects:', error);
      console.error('❌ Error details:', {
        url: `${API_BASE_URL}/projects`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAllProjects');
      throw new Error(`Failed to fetch projects: ${errorMessage}`);
    }
  }

  async getProjectById(id) {
    const cacheKey = `project:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching project ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getProjectById');
      throw new Error(`Failed to fetch project: ${errorMessage}`);
    }
  }

  async createProject(projectData) {
    try {
      console.log('📡 Creating new project with data:', projectData);
      const url = `${API_BASE_URL}/projects`;
      console.log('🔧 Making POST request to:', url);
      console.log('🔧 With headers:', {
        ...getAuthHeader(),
        "Content-Type": "application/json"
      });
      
      const response = await axios.post(url, projectData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      
      console.log('✅ Project created successfully:', response.data);
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      console.error('❌ Error details:', {
        url: `${API_BASE_URL}/projects`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${errorMessage}`);
    }
  }

  async updateProject(id, projectData) {
    try {
      console.log(`📡 Updating project ${id}:`, projectData);
      const response = await axios.put(`${API_BASE_URL}/projects/${id}`, projectData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Project updated:', response.data);
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating project ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateProject');
      throw new Error(`Failed to update project: ${errorMessage}`);
    }
  }

  async deleteProject(id) {
    try {
      console.log(`📡 Deleting project ${id}`);
      const response = await axios.delete(`${API_BASE_URL}/projects/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project deleted:', response.data);
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting project ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'deleteProject');
      throw new Error(`Failed to delete project: ${errorMessage}`);
    }
  }

  async getProjectMetrics(id) {
    const cacheKey = `projectMetrics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for project ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/metrics`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project metrics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project metrics ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getProjectMetrics');
      throw new Error(`Failed to fetch project metrics: ${errorMessage}`);
    }
  }

  async getProjectEpics(id) {
    const cacheKey = `projectEpics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching epics for project ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/epics`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project epics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project epics ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getProjectEpics');
      throw new Error(`Failed to fetch project epics: ${errorMessage}`);
    }
  }

  async getProjectStories(id) {
    const cacheKey = `projectStories:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for project ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/stories`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project stories ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getProjectStories');
      throw new Error(`Failed to fetch project stories: ${errorMessage}`);
    }
  }

  async getProjectSprints(id) {
    const cacheKey = `projectSprints:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching sprints for project ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/projects/${id}/sprints`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project sprints fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project sprints ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getProjectSprints');
      throw new Error(`Failed to fetch project sprints: ${errorMessage}`);
    }
  }

  async refreshProjectCache(id) {
    try {
      // Clear specific project caches
      this.cache.delete('allProjects');
      this.cache.delete(`project:${id}`);
      this.cache.delete(`projectMetrics:${id}`);
      this.cache.delete(`projectEpics:${id}`);
      this.cache.delete(`projectStories:${id}`);
      this.cache.delete(`projectSprints:${id}`);
      
      // Refetch project data
      await this.getProjectById(id);
      return true;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'refreshProjectCache');
      throw new Error(`Failed to refresh project cache: ${errorMessage}`);
    }
  }
}

export default new ProjectService(); 