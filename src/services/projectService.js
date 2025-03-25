import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

class ProjectService {
  constructor() {
    this.cache = new Map();
  }

  logError(error, context) {
    console.error(`❌ ProjectService Error (${context}):`, error);
    return ErrorLogger.logToFile ? 
      ErrorLogger.logToFile(error, `ProjectService:${context}`) : 
      console.error('ErrorLogger not available');
  }

  async getAllProjects() {
    try {
      console.log('📡 Fetching all projects...');
      const response = await api.get('/projects');
      
      const projects = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${projects.length} projects`);
      this.cache.set('allProjects', projects);
      return projects;
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'getAllProjects');
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }
  }

  async getProjectById(id) {
    try {
      console.log(`📡 Fetching project ${id}...`);
      const response = await api.get(`/projects/${id}`);
      console.log('✅ Project fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'getProjectById');
      throw new Error(`Failed to fetch project: ${error.message}`);
    }
  }

  async createProject(projectData) {
    try {
      console.log('📡 Creating project with data:', projectData);
      const response = await api.post('/projects', projectData);
      
      console.log('✅ Project created successfully:', response.data.name);
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'createProject');
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  async updateProject(id, projectData) {
    try {
      console.log(`📡 Updating project ${id} with data:`, projectData);
      const response = await api.put(`/projects/${id}`, projectData);
      
      console.log('✅ Project updated successfully:', response.data.name);
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'updateProject');
      throw new Error(`Failed to update project: ${error.message}`);
    }
  }

  async deleteProject(id) {
    try {
      console.log(`📡 Deleting project ${id}...`);
      const response = await api.delete(`/projects/${id}`);
      
      console.log('✅ Project deleted successfully');
      this.cache.delete('allProjects');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'deleteProject');
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  async updateProjectStatus(id, status) {
    try {
      // Validate status
      if (!['ACTIVE', 'INACTIVE', 'ON_HOLD', 'COMPLETED'].includes(status.toUpperCase())) {
        throw new Error(`Invalid status value: ${status}. Must be one of: ACTIVE, INACTIVE, ON_HOLD, COMPLETED`);
      }

      console.log(`📡 Updating project ${id} status to ${status}`);
      
      // First get the project to ensure we have the name (required by the API)
      const project = await this.getProjectById(id);
      
      // Use the update project endpoint
      const response = await api.put(`/projects/${id}`, { 
        name: project.name,
        status: status.toUpperCase()
      });
      
      console.log(`✅ Status successfully updated to ${status}`);
      
      // Update cache
      this.cache.delete('allProjects');
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating project status:', error);
      this.logError(error, 'updateProjectStatus');
      throw new Error(`Failed to update project status: ${error.message}`);
    }
  }
}

const projectService = new ProjectService();
export { projectService };
export default projectService; 