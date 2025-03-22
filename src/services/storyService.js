import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

class StoryService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `StoryService:${context}`);
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

  async getAllStories() {
    const cacheKey = 'allStories';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📡 Fetching all stories...');
      const response = await api.get('/stories');
      console.log('✅ Stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching stories:', error);
      this.logError(error, 'getAllStories');
      return [];
    }
  }

  async getStory(id) {
    const cacheKey = `story:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching story ${id}...`);
      const response = await api.get(`/stories/${id}`);
      console.log('✅ Story fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching story ${id}:`, error);
      this.logError(error, 'getStory');
      throw new Error(`Failed to fetch story: ${createErrorMessage(error)}`);
    }
  }

  async createStory(storyData) {
    try {
      console.log('📡 Creating new story:', storyData);
      const response = await api.post('/stories', {
        ...storyData,
        createdAt: new Date().toISOString()
      });
      console.log('✅ Story created:', response.data);
      this.cache.delete('allStories');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      this.logError(error, 'createStory');
      throw new Error(`Failed to create story: ${createErrorMessage(error)}`);
    }
  }

  async updateStory(id, storyData) {
    try {
      console.log(`📡 Updating story ${id}:`, storyData);
      const response = await api.put(`/stories/${id}`, {
        ...storyData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Story updated:', response.data);
      this.cache.delete('allStories');
      this.cache.delete(`story:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating story ${id}:`, error);
      this.logError(error, 'updateStory');
      throw new Error(`Failed to update story: ${createErrorMessage(error)}`);
    }
  }

  async deleteStory(id) {
    try {
      console.log(`📡 Deleting story ${id}`);
      const response = await api.delete(`/stories/${id}`);
      console.log('✅ Story deleted:', response.data);
      this.cache.delete('allStories');
      this.cache.delete(`story:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting story ${id}:`, error);
      this.logError(error, 'deleteStory');
      throw new Error(`Failed to delete story: ${createErrorMessage(error)}`);
    }
  }

  async getStoriesByProject(projectId) {
    const cacheKey = `projectStories:${projectId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for project ${projectId}...`);
      const response = await api.get(`/projects/${projectId}/stories`);
      console.log('✅ Project stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching project stories:`, error);
      this.logError(error, 'getStoriesByProject');
      return [];
    }
  }

  async getStoriesBySprint(sprintId) {
    const cacheKey = `sprintStories:${sprintId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching stories for sprint ${sprintId}...`);
      const response = await api.get(`/sprints/${sprintId}/stories`);
      console.log('✅ Sprint stories fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching sprint stories:`, error);
      this.logError(error, 'getStoriesBySprint');
      return [];
    }
  }

  async updateStoryStatus(id, status) {
    try {
      console.log(`📡 Updating story ${id} status to: ${status}`);
      return this.updateStory(id, { status });
    } catch (error) {
      console.error(`❌ Error updating story status:`, error);
      this.logError(error, 'updateStoryStatus');
      throw error;
    }
  }

  async updateStoryPriority(id, priority) {
    try {
      console.log(`📡 Updating story ${id} priority to: ${priority}`);
      return this.updateStory(id, { priority });
    } catch (error) {
      console.error(`❌ Error updating story priority:`, error);
      this.logError(error, 'updateStoryPriority');
      throw error;
    }
  }

  async updateStoryPoints(id, points) {
    try {
      console.log(`📡 Updating story ${id} points to: ${points}`);
      return this.updateStory(id, { storyPoints: points });
    } catch (error) {
      console.error(`❌ Error updating story points:`, error);
      this.logError(error, 'updateStoryPoints');
      throw error;
    }
  }

  async assignStory(id, assigneeId) {
    try {
      console.log(`📡 Assigning story ${id} to user ${assigneeId}`);
      return this.updateStory(id, { assignee: assigneeId });
    } catch (error) {
      console.error(`❌ Error assigning story:`, error);
      this.logError(error, 'assignStory');
      throw error;
    }
  }

  async addComment(storyId, comment) {
    try {
      console.log(`📡 Adding comment to story ${storyId}`);
      const response = await api.post(`/stories/${storyId}/comments`, comment);
      console.log('✅ Comment added:', response.data);
      this.cache.delete(`story:${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding comment:`, error);
      this.logError(error, 'addComment');
      throw new Error(`Failed to add comment: ${createErrorMessage(error)}`);
    }
  }

  async addAttachment(storyId, attachment) {
    try {
      console.log(`📡 Adding attachment to story ${storyId}`);
      const formData = new FormData();
      formData.append('file', attachment);
      
      const response = await api.post(`/stories/${storyId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Attachment added:', response.data);
      this.cache.delete(`story:${storyId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding attachment:`, error);
      this.logError(error, 'addAttachment');
      throw new Error(`Failed to add attachment: ${createErrorMessage(error)}`);
    }
  }
}

export default new StoryService(); 