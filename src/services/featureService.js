import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

class FeatureService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    console.error(`❌ Error in FeatureService - ${context}:`, error);
    return ErrorLogger.logToFile(error, `FeatureService:${context}`);
  }

  async getAllFeatures() {
    try {
      console.log('📡 Fetching all features');
      const response = await api.get('/features');
      console.log('✅ Features fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching features:', error);
      this.logError(error, 'getAllFeatures');
      throw new Error(`Failed to fetch features: ${createErrorMessage(error)}`);
    }
  }

  async getFeatureById(id) {
    try {
      console.log(`📡 Fetching feature ${id}`);
      const response = await api.get(`/features/${id}`);
      console.log('✅ Feature fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching feature ${id}:`, error);
      this.logError(error, 'getFeatureById');
      throw new Error(`Failed to fetch feature: ${createErrorMessage(error)}`);
    }
  }

  async createFeature(featureData) {
    try {
      console.log('📡 Creating new feature');
      console.log('Feature data:', featureData);
      
      const payload = {
        name: featureData.title, // Map title to name for backend compatibility
        description: featureData.description,
        status: featureData.status || 'PLANNED',
        priority: featureData.priority || 'MEDIUM'
      };

      const response = await api.post('/features', payload);
      console.log('✅ Feature created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating feature:', error);
      this.logError(error, 'createFeature');
      throw error;
    }
  }

  async updateFeature(id, featureData) {
    try {
      console.log(`📡 Updating feature ${id}`);
      const payload = {
        name: featureData.title, // Map title to name for backend compatibility
        description: featureData.description,
        status: featureData.status,
        priority: featureData.priority
      };
      const response = await api.put(`/features/${id}`, payload);
      console.log('✅ Feature updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating feature ${id}:`, error);
      this.logError(error, 'updateFeature');
      throw new Error(`Failed to update feature: ${createErrorMessage(error)}`);
    }
  }

  async deleteFeature(id) {
    try {
      console.log(`📡 Deleting feature ${id}`);
      const response = await api.delete(`/features/${id}`);
      console.log('✅ Feature deleted');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting feature ${id}:`, error);
      this.logError(error, 'deleteFeature');
      throw new Error(`Failed to delete feature: ${createErrorMessage(error)}`);
    }
  }
}

// Create and export a singleton instance
const featureService = new FeatureService();
export default featureService; 