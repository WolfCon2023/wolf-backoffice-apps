import { api } from './apiConfig';

class IncrementService {
  async getAllIncrements() {
    try {
      console.log('📡 Fetching all increments');
      const response = await api.get('/increments');
      console.log('✅ Increments fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching increments:', error);
      throw error;
    }
  }

  async getIncrementById(id) {
    try {
      console.log(`📡 Fetching increment ${id}`);
      const response = await api.get(`/increments/${id}`);
      console.log('✅ Increment fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching increment:', error);
      throw error;
    }
  }

  async createIncrement(incrementData) {
    try {
      if (!incrementData.reporter) {
        throw new Error('Reporter is required');
      }

      if (!incrementData.project) {
        throw new Error('Project is required');
      }

      // Set type to Increment
      incrementData.type = 'Increment';

      console.log('Creating increment with data:', incrementData);
      const response = await api.post('/increments', incrementData);
      console.log('✅ Increment created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating increment:', error);
      throw error;
    }
  }

  async updateIncrement(id, incrementData) {
    try {
      console.log(`📡 Updating increment ${id}`);
      const response = await api.put(`/increments/${id}`, incrementData);
      console.log('✅ Increment updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating increment:', error);
      throw error;
    }
  }

  async deleteIncrement(id) {
    try {
      console.log(`📡 Deleting increment ${id}`);
      const response = await api.delete(`/increments/${id}`);
      console.log('✅ Increment deleted');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting increment:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const incrementService = new IncrementService();
export default incrementService; 