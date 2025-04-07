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
    
    // Mock data to use when API fails
    this.mockDefects = [
      {
        id: 'defect-001',
        title: 'Login Button Not Working on Mobile',
        description: 'When users tap the login button on mobile devices, nothing happens',
        status: 'New',
        severity: 'High',
        priority: 'High',
        createdAt: new Date('2025-03-16').toISOString(),
        reportedBy: 'user-002',
        assignee: 'dev-001',
        projectId: 'project-001',
        storyId: 'story-001',
        environment: 'Production',
        stepsToReproduce: ['Open the app on mobile', 'Enter credentials', 'Tap login button']
      },
      {
        id: 'defect-002',
        title: 'Dashboard Charts Not Loading',
        description: 'Charts on the dashboard are showing loading spinner indefinitely',
        status: 'In Progress',
        severity: 'Medium',
        priority: 'Medium',
        createdAt: new Date('2025-03-18').toISOString(),
        reportedBy: 'user-003',
        assignee: 'dev-003',
        projectId: 'project-001',
        storyId: 'story-002',
        environment: 'Staging',
        stepsToReproduce: ['Login', 'Navigate to dashboard', 'Observe charts not loading']
      },
      {
        id: 'defect-003',
        title: 'Password Reset Email Contains Broken Link',
        description: 'The link in password reset emails leads to a 404 page',
        status: 'Fixed',
        severity: 'High',
        priority: 'High',
        createdAt: new Date('2025-03-10').toISOString(),
        reportedBy: 'user-005',
        assignee: 'dev-001',
        projectId: 'project-002',
        storyId: 'story-004',
        environment: 'Production',
        stepsToReproduce: ['Request password reset', 'Open email', 'Click on the reset link']
      },
      {
        id: 'defect-004',
        title: 'Data Table Pagination Not Working',
        description: 'Clicking on next page in data tables does not change the displayed data',
        status: 'New',
        severity: 'Low',
        priority: 'Low',
        createdAt: new Date('2025-03-21').toISOString(),
        reportedBy: 'user-001',
        assignee: null,
        projectId: 'project-002',
        storyId: null,
        environment: 'Development',
        stepsToReproduce: ['Go to any data table with multiple pages', 'Click on the next page button']
      },
      {
        id: 'defect-005',
        title: 'API Documentation Missing Authentication Details',
        description: 'The documentation does not include how to authenticate API requests',
        status: 'New',
        severity: 'Medium',
        priority: 'Medium',
        createdAt: new Date('2025-03-22').toISOString(),
        reportedBy: 'user-004',
        assignee: 'dev-004',
        projectId: 'project-003',
        storyId: 'story-005',
        environment: 'Documentation',
        stepsToReproduce: ['Read the API documentation', 'Look for authentication section']
      }
    ];
  }

  /**
   * Log errors to the error logger with context
   */
  logError(error, context) {
    console.group(`📋 DefectService Error - ${context}`);
    console.error('Error details:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.groupEnd();
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
    console.group('📋 DefectService - getAllDefects');
    console.time('getAllDefects');
    
    const cacheKey = 'allDefects';
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      console.log('✅ Using cached defects data');
      console.timeEnd('getAllDefects');
      console.groupEnd();
      return cached;
    }

    // Check if this endpoint was marked as unavailable
    if (this.endpointAvailability['/defects']?.available === false) {
      console.log('⚠️ /defects endpoint was previously marked as unavailable. Using increments API instead.');
      console.timeEnd('getAllDefects');
      console.groupEnd();
      return [];
    }

    try {
      console.log('📡 Fetching all defects from /defects endpoint...');
      const startTime = performance.now();
      const response = await api.get('/defects');
      const endTime = performance.now();
      
      console.log(`✅ Defects fetched (${Math.round(endTime - startTime)}ms):`, response.data);
      console.log(`📊 Retrieved ${response.data.length} defects`);
      
      this.setCachedData(cacheKey, response.data);
      this.checkEndpointAvailability('/defects', true);
      
      console.timeEnd('getAllDefects');
      console.groupEnd();
      return response.data;
    } catch (error) {
      // IMPORTANT: Log 404 errors in detail for API troubleshooting
      if (error.response?.status === 404) {
        console.error('⚠️ API ENDPOINT NOT FOUND ERROR ⚠️');
        console.error(`🔍 Attempted to access: ${error.config?.url || '/defects'}`);
        console.error(`📋 Status: ${error.response?.status} - ${error.response?.statusText}`);
        console.error(`📝 Message: ${error.response?.data?.message || 'No error message provided'}`);
        console.error('👉 This endpoint is missing in the backend implementation.');
        console.error('📝 RECOMMENDATION: Use the unified increments API instead - /increments will contain all defect data');
        console.error('📋 Troubleshooting steps:');
        console.error('   1. Check if the backend server is running');
        console.error('   2. Use /increments or /increments/backlog endpoints instead');
        console.error('   3. Update code to use the new unified data model');
        
        this.checkEndpointAvailability('/defects', false);
      } else {
        // Other errors could be permissions, server issues, etc.
        console.error(`❌ Error fetching defects (${error.response?.status || 'Network Error'}):`);
        console.error('- Message:', error.message);
        console.error('- Request URL:', error.config?.url);
        console.error('- Request Method:', error.config?.method);
      }
      
      this.logError(error, 'getAllDefects');
      console.timeEnd('getAllDefects');
      console.groupEnd();
      return [];
    }
  }

  async getDefect(id) {
    const cacheKey = `defect:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching defect ${id}...`);
      const response = await api.get(`/defects/${id}`);
      console.log('✅ Defect fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching defect ${id}:`, error);
      this.logError(error, 'getDefect');
      throw new Error(`Failed to fetch defect: ${createErrorMessage(error)}`);
    }
  }

  async createDefect(defectData) {
    try {
      console.log('📡 Creating new defect:', defectData);
      const response = await api.post('/defects', {
        ...defectData,
        dateReported: new Date().toISOString()
      });
      console.log('✅ Defect created:', response.data);
      this.cache.delete('allDefects');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating defect:', error);
      this.logError(error, 'createDefect');
      throw new Error(`Failed to create defect: ${createErrorMessage(error)}`);
    }
  }

  async updateDefect(id, defectData) {
    try {
      console.log(`📡 Updating defect ${id}:`, defectData);
      const response = await api.put(`/defects/${id}`, {
        ...defectData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Defect updated:', response.data);
      this.cache.delete('allDefects');
      this.cache.delete(`defect:${id}`);
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
      console.log('✅ Defect deleted:', response.data);
      this.cache.delete('allDefects');
      this.cache.delete(`defect:${id}`);
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
      console.log(`📡 Fetching defects for project ${projectId}...`);
      const response = await api.get(`/projects/${projectId}/defects`);
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
      console.log(`📡 Fetching defects for sprint ${sprintId}...`);
      const response = await api.get(`/sprints/${sprintId}/defects`);
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

export default new DefectService(); 