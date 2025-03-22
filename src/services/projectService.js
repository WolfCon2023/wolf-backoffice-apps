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
      // Make a clean copy of the data to avoid reference issues
      const cleanData = {
        name: projectData.name,
        key: projectData.key,
        description: projectData.description || '',
        status: projectData.status,
        methodology: projectData.methodology || 'Agile',
        visibility: projectData.visibility || 'Team Only',
        tags: projectData.tags || [],
        progress: projectData.progress || 0,
        
        // Convert dates to proper format
        startDate: new Date(projectData.startDate || new Date()).toISOString(),
        targetEndDate: new Date(projectData.targetEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
      console.log('📡 Creating project with cleaned data:', {
        ...cleanData,
        startDate: cleanData.startDate,
        targetEndDate: cleanData.targetEndDate
      });

      const response = await api.post('/projects', cleanData);
      
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
          fullUrl: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
          requestData: error.config?.data ? JSON.parse(error.config.data) : undefined
        });
      }
      
      // Try the test endpoint as a fallback
      try {
        console.log('🔧 Trying test endpoint instead...');
        const testResponse = await this.testCreateProject();
        console.log('🔧 Test endpoint response:', testResponse);
        
        // If the test endpoint works, explain the issue
        toast.info('Project created via test endpoint. There seems to be an issue with the regular endpoint.');
        this.cache.delete('allProjects');
        return testResponse;
      } catch (testError) {
        console.error('🔧 Test endpoint also failed:', testError);
      }
      
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  // Test method to diagnose issues with project creation
  async testCreateProject() {
    try {
      console.log('🧪 Calling test-create endpoint...');
      const response = await api.post('/projects/test-create');
      console.log('🧪 Test create response:', response.data);
      return response.data.project;
    } catch (error) {
      console.error('❌ Test create error:', error);
      if (error.response) {
        console.error('Test create error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      throw error;
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