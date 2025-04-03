import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

// Export enums for use in components
export const DefectStatus = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const DefectSeverity = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

/**
 * Service for managing defect-related API requests
 * This handles all interactions with stories of type 'Bug'
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

  async getAllDefects() {
    try {
      console.log('📡 Fetching all defects');
      console.log('Making request to: /stories?type=Defect');
      
      const response = await api.get('/stories', {
        params: {
          type: 'Defect'
        }
      });
      
      console.log('Raw API Response:', response);
      console.log('Response data:', response.data);
      
      // Map the Story model fields to defect fields
      const defects = (response.data || [])
        .filter(story => story.type === 'Defect')
        .map(defect => ({
          id: defect._id,
          _id: defect._id,
          title: defect.title,
          description: defect.description,
          severity: defect.priority || DefectSeverity.MEDIUM,
          status: defect.status || DefectStatus.NEW,
          dateReported: defect.createdAt,
          projectId: defect.project,
          project: defect.project,
          reportedBy: defect.assignee
        }));

      console.log(`✅ Found ${defects.length} defects:`, defects);
      return defects;
    } catch (error) {
      console.error('❌ Error fetching defects:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      this.logError(error, 'getAllDefects');
      return [];
    }
  }

  async createDefect(defectData) {
    try {
      console.log('📡 Creating new defect');
      console.log('Defect data:', defectData);
      
      // Convert defect fields to Story model fields
      const storyData = {
        title: defectData.title,
        description: defectData.description,
        type: 'Bug',
        priority: defectData.severity,
        status: defectData.status,
        project: defectData.projectId,
        assignee: defectData.reportedBy,
        createdAt: defectData.dateReported || new Date().toISOString()
      };
      
      const response = await api.post('/stories', storyData);
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

  async updateDefectStatus(id, newStatus) {
    try {
      console.log(`📡 Updating defect ${id} status to ${newStatus}`);
      const response = await api.patch(`/stories/${id}`, { status: newStatus });
      console.log('✅ Defect status updated:', response.data);
      return response.data;
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

  async createTestDefect(projectId, userId) {
    try {
      console.log('📡 Creating test defect with:', { projectId, userId });
      const testDefect = {
        title: 'Test Defect',
        description: 'This is a test defect created for testing',
        type: 'Defect',
        priority: DefectSeverity.MEDIUM,
        status: DefectStatus.NEW,
        project: projectId,
        assignee: userId,
        createdAt: new Date().toISOString()
      };
      
      console.log('Test defect payload:', JSON.stringify(testDefect, null, 2));
      const response = await api.post('/stories', testDefect);
      console.log('Create defect response:', response);
      console.log('Created defect data:', response.data);

      // Map the response to match our defect format
      const createdDefect = {
        id: response.data._id,
        _id: response.data._id,
        title: response.data.title,
        description: response.data.description,
        severity: response.data.priority || DefectSeverity.MEDIUM,
        status: response.data.status || DefectStatus.NEW,
        dateReported: response.data.createdAt,
        projectId: response.data.project,
        project: response.data.project,
        reportedBy: response.data.assignee
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