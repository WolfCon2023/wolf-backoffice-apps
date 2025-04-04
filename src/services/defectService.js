import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const DefectStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED'
};

export const DefectSeverity = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/**
 * Service for managing defect-related API requests
 * This handles all interactions with the /defects endpoint
 */
class DefectService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.error(`❌ DefectService Error (${context}):`, error);
    return ErrorLogger.logToFile(error, `DefectService:${context}`);
  }

  /**
   * Check if data exists in cache and is still valid
   */
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

  /**
   * Set data in cache with current timestamp
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Check and update the availability status of an API endpoint
   */
  checkEndpointAvailability(endpoint, status) {
    if (!this.endpointAvailability[endpoint]) {
      this.endpointAvailability[endpoint] = { available: null, lastChecked: null };
    }
    
    this.endpointAvailability[endpoint] = {
      available: status,
      lastChecked: Date.now()
    };
    
    console.info(`🔍 API Endpoint ${endpoint} availability: ${status ? 'Available' : 'Unavailable'}`);
  }

  /**
   * Get all defects from the API
   * @returns {Array} List of defects or empty array if API fails
   */
  async getAllDefects() {
    try {
      console.log('📡 Fetching all defects...');
      const response = await api.get('/defects');
      
      if (!response.data) {
        console.warn('⚠️ No data received from defects API');
        return [];
      }

      const defects = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${defects.length} defects`);
      return defects;
    } catch (error) {
      console.error('❌ Error fetching defects:', error);
      this.logError(error, 'getAllDefects');
      return []; // Return empty array instead of throwing
    }
  }

  async generateDefectKey(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to generate defect key');
      }

      // Get the project details to get the project key
      const project = await api.get(`/projects/${projectId}`);
      const projectKey = project.data.key;

      // Get all defects for the project to determine the next number
      const defects = await api.get(`/defects/project/${projectId}`);
      const projectDefects = defects.data || [];
      
      // Find the highest defect number for this project
      const defectNumbers = projectDefects
        .map(defect => {
          const match = defect.key?.match(new RegExp(`${projectKey}-D(\\d+)`));
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => !isNaN(num));

      const nextNumber = defectNumbers.length > 0 ? Math.max(...defectNumbers) + 1 : 1;
      
      // Generate the new key with 'D' prefix for defects
      const newKey = `${projectKey}-D${nextNumber}`;
      console.log(`📝 Generated new defect key: ${newKey}`);
      return newKey;
    } catch (error) {
      console.error('❌ Error generating defect key:', error);
      this.logError(error, 'generateDefectKey');
      throw new Error('Failed to generate defect key');
    }
  }

  async createDefect(defectData) {
    try {
      console.log('📡 Creating new defect:', defectData);
      const response = await api.post('/defects', defectData);
      console.log('✅ Defect created successfully:', response.data);
      this.cache.delete('allDefects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating defect:', error);
      this.logError(error, 'createDefect');
      throw error;
    }
  }

  async updateDefect(id, defectData) {
    try {
      console.log(`📡 Updating defect ${id}:`, defectData);
      const response = await api.put(`/defects/${id}`, defectData);
      console.log('✅ Defect updated successfully');
      this.cache.delete('allDefects');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating defect:', error);
      this.logError(error, 'updateDefect');
      throw error;
    }
  }

  async getDefectById(id) {
    try {
      console.log(`📡 Fetching defect ${id}`);
      const response = await api.get(`/defects/${id}`);
      console.log('✅ Defect fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching defect:', error);
      this.logError(error, 'getDefectById');
      throw error;
    }
  }

  async getDefectsByProject(projectId) {
    const cacheKey = `projectDefects:${projectId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching defects for project ${projectId}`);
      const response = await api.get(`/defects/project/${projectId}`);
      console.log('✅ Project defects fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project defects:', error);
      this.logError(error, 'getDefectsByProject');
      return [];
    }
  }

  async getDefectsBySprint(sprintId) {
    const cacheKey = `sprintDefects:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching defects for sprint ${sprintId}`);
      const response = await api.get(`/defects/sprint/${sprintId}`);
      console.log('✅ Sprint defects fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching sprint defects:', error);
      this.logError(error, 'getDefectsBySprint');
      return [];
    }
  }

  async updateDefectStatus(id, status) {
    try {
      console.log(`📡 Updating defect ${id} status to ${status}`);
      const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');
      const response = await api.put(`/defects/${id}/status`, { status: normalizedStatus });
      console.log(`✅ Status successfully updated to ${normalizedStatus}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating defect status:', error);
      this.logError(error, 'updateDefectStatus');
      throw error;
    }
  }

  async updateDefectSeverity(id, severity) {
    try {
      console.log(`📡 Updating defect ${id} severity to ${severity}`);
      return this.updateDefect(id, { severity });
    } catch (error) {
      console.error(`❌ Error updating defect severity:`, error);
      this.logError(error, 'updateDefectSeverity');
      throw error;
    }
  }

  async updateDefectPriority(id, priority) {
    try {
      console.log(`📡 Updating defect ${id} priority to: ${priority}`);
      return this.updateDefect(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating defect priority:`, error);
      this.logError(error, 'updateDefectPriority');
      throw error;
    }
  }

  async updateDefectAssignee(id, assigneeId) {
    try {
      console.log(`📡 Updating defect ${id} assignee to ${assigneeId}`);
      return this.updateDefect(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error updating defect assignee:`, error);
      this.logError(error, 'updateDefectAssignee');
      throw error;
    }
  }

  async updateCodeReviewStatus(id, status) {
    try {
      console.log(`📡 Updating code review status for defect ${id} to: ${status}`);
      return this.updateDefect(id, { codeReviewStatus: status });
    } catch (error) {
      console.error(`❌ Error updating code review status:`, error);
      this.logError(error, 'updateCodeReviewStatus');
      throw error;
    }
  }

  async addComment(defectId, comment) {
    try {
      console.log(`📡 Adding comment to defect ${defectId}`);
      const response = await api.post(`/defects/${defectId}/comments`, comment);
      console.log('✅ Comment added:', response.data);
      this.cache.delete(`defect:${defectId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding comment:`, error);
      this.logError(error, 'addComment');
      throw new Error(`Failed to add comment: ${createErrorMessage(error)}`);
    }
  }

  async addAttachment(defectId, attachment) {
    try {
      console.log(`📡 Adding attachment to defect ${defectId}`);
      const formData = new FormData();
      formData.append('file', attachment);
      
      const response = await api.post(`/defects/${defectId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Attachment added:', response.data);
      this.cache.delete(`defect:${defectId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding attachment:`, error);
      this.logError(error, 'addAttachment');
      throw new Error(`Failed to add attachment: ${createErrorMessage(error)}`);
    }
  }

  async deleteDefect(id) {
    try {
      console.log(`📡 Deleting defect ${id}`);
      const response = await api.delete(`/defects/${id}`);
      console.log('✅ Defect deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting defect:', error);
      this.logError(error, 'deleteDefect');
      throw error;
    }
  }

  async createTestDefect(projectId, userId) {
    try {
      console.log('📡 Creating test defect with:', { projectId, userId });
      const testDefect = {
        title: 'Test Defect',
        description: 'This is a test defect created for testing',
        severity: DefectSeverity.MEDIUM,
        status: DefectStatus.OPEN,
        projectId: projectId,
        reportedBy: userId,
        dateReported: new Date().toISOString()
      };
      
      console.log('Test defect payload:', JSON.stringify(testDefect, null, 2));
      const response = await api.post('/defects', testDefect);
      console.log('Create defect response:', response);
      console.log('Created defect data:', response.data);

      // Map the response to match our defect format
      const createdDefect = {
        id: response.data._id,
        title: response.data.title,
        description: response.data.description,
        severity: response.data.severity,
        status: response.data.status,
        dateReported: response.data.dateReported,
        projectId: response.data.projectId,
        reportedBy: response.data.reportedBy
      };

      console.log('Mapped defect data:', createdDefect);
      return createdDefect;
    } catch (error) {
      console.error('❌ Error creating test defect:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      this.logError(error, 'createTestDefect');
      throw error;
    }
  }
}

// Export a singleton instance
const defectService = new DefectService();
export default defectService; 