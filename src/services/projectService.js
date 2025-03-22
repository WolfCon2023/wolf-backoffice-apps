import { api } from '../services/apiConfig';
import ErrorLogger from '../utils/errorLogger';
import { toast } from 'react-toastify';

class ProjectService {
  constructor() {
    this.cache = new Map();
  }

  async getAllProjects() {
    try {
      const response = await api.get('/projects');
      
      const projects = Array.isArray(response.data) ? response.data : [];
      this.cache.set('allProjects', projects);
      return projects;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getAllProjects');
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  }

  async getProjectById(id) {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getProjectById');
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  async createProject(projectData) {
    try {
      // Create a clean payload similar to the userService implementation
      const payload = {
        name: projectData.name,
        key: projectData.key,
        description: projectData.description || '',
        status: 'Active',
        methodology: projectData.methodology || 'Agile',
        visibility: 'Team Only',
        tags: [],
      };

      // Handle dates - convert to ISO string format before sending
      payload.startDate = projectData.startDate instanceof Date 
        ? projectData.startDate.toISOString() 
        : new Date().toISOString();
      
      payload.targetEndDate = projectData.targetEndDate instanceof Date
        ? projectData.targetEndDate.toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      console.log('📡 Creating project with data:', {
        ...payload,
        startDate: payload.startDate,
        targetEndDate: payload.targetEndDate
      });

      const response = await api.post('/projects', payload);
      
      console.log('✅ Project created successfully:', response.data);
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          fullUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`
        });
      }
      
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async updateProject(id, projectData) {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'updateProject');
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async deleteProject(id) {
    try {
      const response = await api.delete(`/projects/${id}`);
      
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'deleteProject');
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async getProjectMetrics(id) {
    try {
      const response = await api.get(`/projects/${id}/metrics`);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project metrics:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getProjectMetrics');
      throw new Error(`Failed to fetch project metrics: ${error.message}`);
    }
  }

  async getProjectEpics(id) {
    try {
      const response = await api.get(`/projects/${id}/epics`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project epics:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getProjectEpics');
      throw new Error(`Failed to fetch project epics: ${error.message}`);
    }
  }

  async getProjectStories(id) {
    try {
      const response = await api.get(`/projects/${id}/stories`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project stories:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getProjectStories');
      throw new Error(`Failed to fetch project stories: ${error.message}`);
    }
  }

  async getProjectSprints(id) {
    try {
      const response = await api.get(`/projects/${id}/sprints`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project sprints:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers,
          url: error.config?.url
        });
      }
      this.logError(error, 'getProjectSprints');
      throw new Error(`Failed to fetch project sprints: ${error.message}`);
    }
  }

  async refreshProjectCache(id) {
    try {
      this.cache.delete('allProjects');
      await this.getProjectById(id);
      return true;
    } catch (error) {
      this.logError(error, 'refreshProjectCache');
      throw new Error(`Failed to refresh project cache: ${error.message}`);
    }
  }

  logError(error, method) {
    ErrorLogger.logToFile(error, `ProjectService:${method}`);
  }
}

export const projectService = new ProjectService(); 