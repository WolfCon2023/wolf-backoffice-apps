import axios from 'axios';
import ErrorLogger from '../utils/errorLogger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://wolf-backoffice-backend-development.up.railway.app/api";

class ProjectService {
  constructor() {
    this.cache = new Map();
  }

  async getAllProjects() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.post(`${API_BASE_URL}/projects`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
          url: error.config?.url
        });
      }
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async updateProject(id, projectData) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.put(`${API_BASE_URL}/projects/${id}`, projectData, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.delete(`${API_BASE_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${id}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${id}/epics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${id}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${id}/sprints`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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