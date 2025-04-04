import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const DefectStatus = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened'
};

export const DefectSeverity = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
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

  async getAllDefects() {
    try {
      console.log('📡 Fetching all defects...');
      const response = await api.get('/defects');
      
      if (!response.data) {
        console.warn('No data received from defects API');
        return [];
      }

      // Map the response to match our expected format
      const defects = response.data.map(defect => ({
        id: defect._id,
        title: defect.title,
        description: defect.description,
        severity: defect.severity,
        status: defect.status,
        dateReported: defect.dateReported,
        projectId: defect.projectId,
        reportedBy: defect.reportedBy,
        createdAt: defect.createdAt,
        updatedAt: defect.updatedAt
      }));

      console.log(`✅ Found ${defects.length} defects`);
      return defects;
    } catch (error) {
      console.error('❌ Error fetching defects:', error);
      this.logError(error, 'getAllDefects');
      throw new Error(`Failed to fetch defects: ${error.message}`);
    }
  }

  async createDefect(defectData) {
    try {
      console.log('📡 Creating defect with data:', defectData);
      
      // Validate required fields
      if (!defectData.title) {
        throw new Error('Title is required');
      }
      if (!defectData.projectId) {
        throw new Error('Project ID is required');
      }

      // Format the data to match the database schema
      const formattedData = {
        title: defectData.title,
        description: defectData.description || '',
        severity: defectData.severity || 'Medium',
        status: defectData.status || 'Open',
        projectId: defectData.projectId,
        reportedBy: defectData.reportedBy,
        dateReported: new Date().toISOString()
      };

      console.log('📝 Formatted defect data:', formattedData);

      const response = await api.post('/defects', formattedData);
      console.log('✅ Defect created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating defect:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to create defect');
      }
      this.logError(error, 'createDefect');
      throw error;
    }
  }

  async updateDefect(id, defectData) {
    try {
      console.log(`📡 Updating defect ${id} with data:`, defectData);
      
      // Format the data to match the database schema
      const formattedData = {
        title: defectData.title,
        description: defectData.description,
        severity: defectData.severity,
        status: defectData.status,
        projectId: defectData.projectId,
        reportedBy: defectData.reportedBy
      };

      const response = await api.put(`/defects/${id}`, formattedData);
      console.log('✅ Defect updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating defect:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to update defect');
      }
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
      throw new Error(`Failed to fetch defect: ${error.message}`);
    }
  }

  async getDefectsByProject(projectId) {
    const cacheKey = `projectDefects:${projectId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching defects for project ${projectId}`);
      const response = await api.get(`/defects/project/${projectId}`);
      console.log(`✅ Found ${response.data.length} defects for project`);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching project defects:', error);
      this.logError(error, 'getDefectsByProject');
      throw new Error(`Failed to fetch project defects: ${error.message}`);
    }
  }

  async getDefectsBySprint(sprintId) {
    const cacheKey = `sprintDefects:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching defects for sprint ${sprintId}`);
      const response = await api.get(`/defects/sprint/${sprintId}`);
      console.log(`✅ Found ${response.data.length} defects for sprint`);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching sprint defects:', error);
      this.logError(error, 'getDefectsBySprint');
      throw new Error(`Failed to fetch sprint defects: ${error.message}`);
    }
  }

  async updateDefectStatus(id, status) {
    try {
      console.log(`📡 Updating defect ${id} status to ${status}`);
      
      // Use PUT to update the status
      const response = await api.put(`/defects/${id}`, { 
        status: status
      });
      
      console.log(`✅ Defect status successfully updated to ${status}`);
      this.cache.delete('allDefects');
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating defect ${id}:`, error);
      this.logError(error, 'updateDefectStatus');
      throw new Error(`Failed to update defect: ${error.message}`);
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

  async deleteDefect(id) {
    try {
      console.log(`📡 Deleting defect ${id}`);
      const response = await api.delete(`/defects/${id}`);
      console.log('✅ Defect deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting defect:', error);
      this.logError(error, 'deleteDefect');
      throw new Error(`Failed to delete defect: ${error.message}`);
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