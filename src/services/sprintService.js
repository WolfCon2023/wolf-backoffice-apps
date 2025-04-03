import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

class SprintService {
  constructor() {
    this.cache = new Map();
  }

  async getAllSprints() {
    try {
      console.log('📡 Fetching all sprints...');
      const response = await api.get('/sprints');
      
      // Ensure we have an array of sprints
      const sprints = Array.isArray(response.data) ? response.data : [];
      
      console.log(`✅ Found ${sprints.length} sprints`);
      this.cache.set('allSprints', sprints);
      
      return sprints;
    } catch (error) {
      console.error('❌ Error fetching sprints:', error);
      ErrorLogger.logToFile(error, 'SprintService:getAllSprints');
      
      // If it's a 404, return an empty array instead of throwing
      if (error.response?.status === 404) {
        console.log('No sprints found, returning empty array');
        return [];
      }
      
      throw new Error(`Failed to fetch sprints: ${error.message}`);
    }
  }

  logError(error, context) {
    ErrorLogger.logToFile(error, 'SprintService:' + context);
  }
}

export const sprintService = new SprintService();
export default sprintService; 