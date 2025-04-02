import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

/**
 * Service for managing defect-related API requests
 * This handles all interactions with the /defects endpoints
 */
class DefectService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.endpointAvailability = {
      '/defects': { available: null, lastChecked: null }
    };
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.error(`❌ Error in DefectService - ${context}:`, error);
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
      console.group('📡 Fetching all defects');
      const response = await api.get('/defects');
      console.log('✅ Defects API Response:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      console.groupEnd();
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching defects:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      this.logError(error, 'getAllDefects');
      throw new Error(`Failed to fetch defects: ${createErrorMessage(error)}`);
    }
  }

  async getDefectById(id) {
    try {
      console.log(`📡 Fetching defect ${id}`);
      const response = await api.get(`/defects/${id}`);
      console.log('✅ Defect fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching defect ${id}:`, error);
      this.logError(error, 'getDefectById');
      throw new Error(`Failed to fetch defect: ${createErrorMessage(error)}`);
    }
  }

  async createDefect(defectData) {
    try {
      console.log('📡 Creating new defect');
      const payload = {
        title: defectData.title,
        description: defectData.description,
        severity: defectData.severity || 'Medium',
        status: defectData.status || 'New',
        projectId: defectData.projectId,
        reportedBy: defectData.reportedBy,
        dateReported: new Date()
      };

      console.log('Creating defect with payload:', payload);
      const response = await api.post('/defects', payload);
      console.log('✅ Defect created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating defect:', error);
      this.logError(error, 'createDefect');
      throw error;
    }
  }

  async updateDefect(id, defectData) {
    try {
      console.log(`📡 Updating defect ${id}`);
      const response = await api.put(`/defects/${id}`, defectData);
      console.log('✅ Defect updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating defect ${id}:`, error);
      this.logError(error, 'updateDefect');
      throw new Error(`Failed to update defect: ${createErrorMessage(error)}`);
    }
  }

  async deleteDefect(id) {
    try {
      console.log(`📡 Deleting defect ${id}`);
      const response = await api.delete(`/defects/${id}`);
      console.log('✅ Defect deleted');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting defect ${id}:`, error);
      this.logError(error, 'deleteDefect');
      throw new Error(`Failed to delete defect: ${createErrorMessage(error)}`);
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
      console.error(`❌ Error fetching project defects:`, error);
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
      console.error(`❌ Error fetching sprint defects:`, error);
      this.logError(error, 'getDefectsBySprint');
      return [];
    }
  }

  async updateDefectStatus(id, status) {
    try {
      console.log(`📡 Updating defect ${id} status to: ${status}`);
      return this.updateDefect(id, { status });
    } catch (error) {
      console.error(`❌ Error updating defect status:`, error);
      this.logError(error, 'updateDefectStatus');
      throw error;
    }
  }

  async updateDefectSeverity(id, severity) {
    try {
      console.log(`📡 Updating defect ${id} severity to: ${severity}`);
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

  async assignDefect(id, assigneeId) {
    try {
      console.log(`📡 Assigning defect ${id} to user ${assigneeId}`);
      return this.updateDefect(id, { assignedTo: assigneeId });
    } catch (error) {
      console.error(`❌ Error assigning defect:`, error);
      this.logError(error, 'assignDefect');
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
}

const defectService = new DefectService();
export default defectService; 