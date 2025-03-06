import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || "https://wolf-backoffice-backend-development.up.railway.app/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const customerService = {
  // Get all customers
  getAllCustomers: async () => {
    try {
      console.log('📡 Fetching all customers...');
      const response = await axios.get(`${API_BASE_URL}/customers`, {
        headers: getAuthHeader()
      });
      console.log('✅ API Response:', response);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching all customers:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return [];
    }
  },

  // Search customers
  searchCustomers: async (field, query) => {
    try {
      console.log(`📡 Searching customers - Field: ${field}, Query: ${query}`);
      
      // If searching for high value customers
      if (field === 'highValue') {
        const response = await axios.get(`${API_BASE_URL}/customers`, {
          headers: getAuthHeader()
        });
        const highValueCustomers = response.data.filter(customer => customer.highValue);
        console.log('✅ Found high value customers:', highValueCustomers);
        return highValueCustomers;
      }

      // For other search criteria
      const response = await axios.get(`${API_BASE_URL}/customers/search`, {
        params: {
          field,
          query
        },
        headers: getAuthHeader()
      });

      console.log('✅ Search API Response:', response);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error searching customers:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return [];
    }
  },

  // Add new customer
  addCustomer: async (customer) => {
    try {
      console.log('📡 Adding new customer:', customer);
      const response = await axios.post(`${API_BASE_URL}/customers`, customer, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Customer added:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding customer:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw error;
    }
  },

  // Update customer
  updateCustomer: async (id, customer) => {
    try {
      console.log(`📡 Updating customer ${id}:`, customer);
      const response = await axios.put(`${API_BASE_URL}/customers/${id}`, customer, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Customer updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw error;
    }
  },

  // Delete customer
  deleteCustomer: async (id) => {
    try {
      console.log(`📡 Deleting customer ${id}`);
      const response = await axios.delete(`${API_BASE_URL}/customers/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Customer deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting customer:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw error;
    }
  }
};