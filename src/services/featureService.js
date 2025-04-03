import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

class FeatureService {
  constructor() {
    this.cache = new Map();
  }

  async getAllFeatures() {
    try {
      console.log('📡 Fetching all features...');
      const response = await api.get('/features');
      
      // Ensure we have an array of features
      const features = Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ Found ${features.length} features`);
      this.cache.set('allFeatures', features);
      
      return features;
    } catch (error) {
      console.error('❌ Error fetching features:', error);
      ErrorLogger.logToFile(error, 'FeatureService:getAllFeatures');
      throw new Error(`Failed to fetch features: ${error.message}`);
    }
  }

  logError(error, context) {
    ErrorLogger.logToFile(error, 'FeatureService:' + context);
  }

  async getFeatureById(id) {
    try {
      console.log(`📡 Fetching feature ${id}`);
      const response = await api.get(`/features/${id}`);
      console.log('✅ Feature fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching feature ${id}:`, error);
      ErrorLogger.logToFile(error, 'FeatureService:getFeatureById');
      throw new Error(`Failed to fetch feature: ${error.message}`);
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
      ErrorLogger.logToFile(error, 'FeatureService:createFeature');
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
      ErrorLogger.logToFile(error, 'FeatureService:updateFeature');
      throw new Error(`Failed to update feature: ${error.message}`);
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
      ErrorLogger.logToFile(error, 'FeatureService:deleteFeature');
      throw new Error(`Failed to delete feature: ${error.message}`);
    }
  }
}

export const featureService = new FeatureService();
export default featureService; 