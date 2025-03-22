import { api, simpleFetch } from './apiConfig';

/**
 * Service to check the health and availability of API endpoints
 * This helps identify which API endpoints are implemented in the backend
 */
class ApiHealthService {
  constructor() {
    this.endpointStatus = new Map();
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if an API endpoint exists
   * @param {string} endpoint - The endpoint to check
   * @returns {Promise<{available: boolean, error: any}>} - The availability status
   */
  async checkEndpoint(endpoint) {
    try {
      // Check if we have a cached status that's still valid
      const cachedStatus = this.endpointStatus.get(endpoint);
      if (cachedStatus && (Date.now() - cachedStatus.timestamp < this.checkInterval)) {
        return cachedStatus.status;
      }

      console.log(`🔍 Checking API endpoint: ${endpoint}`);
      
      // Try simpleFetch first to avoid CORS issues with preflight requests
      const exists = await simpleFetch(endpoint);
      
      if (exists) {
        // Endpoint exists
        const status = { available: true, error: null };
        this.endpointStatus.set(endpoint, { 
          status, 
          timestamp: Date.now() 
        });
        console.log(`✅ API endpoint available: ${endpoint}`);
        return status;
      } else {
        // SimpleFetch returned false - endpoint might not exist
        // Try the full request for more detailed information
        try {
          // Use a regular GET request with a small timeout
          await api.get(endpoint, { 
            timeout: 3000,
            headers: {
              'Accept': 'application/json'
            }
          });
          
          // If we get here, the endpoint exists
          const status = { available: true, error: null };
          this.endpointStatus.set(endpoint, { 
            status, 
            timestamp: Date.now() 
          });
          console.log(`✅ API endpoint available: ${endpoint}`);
          return status;
        } catch (apiError) {
          // Handle 404 errors specially (endpoint doesn't exist)
          if (apiError.response?.status === 404) {
            const status = { 
              available: false, 
              error: { 
                status: 404, 
                message: 'Endpoint not found or not implemented'
              }
            };
            this.endpointStatus.set(endpoint, { 
              status, 
              timestamp: Date.now() 
            });
            console.warn(`⚠️ API endpoint not implemented: ${endpoint}`);
            return status;
          }
          
          // If it's a CORS error from the api call
          if (apiError.isCorsError || apiError.message.includes('CORS') || 
              (apiError.message.includes('Network Error') && !apiError.response)) {
            const status = { 
              available: null, // null means "unknown"
              error: { 
                status: 'CORS', 
                message: 'Cannot determine availability due to CORS restrictions' 
              }
            };
            this.endpointStatus.set(endpoint, { 
              status, 
              timestamp: Date.now() 
            });
            console.warn(`⚠️ Cannot determine API endpoint status due to CORS: ${endpoint}`);
            return status;
          }
          
          // For other errors, the endpoint might exist but have other issues
          const status = { 
            available: false, 
            error: { 
              status: apiError.response?.status || 'Network Error', 
              message: apiError.message 
            }
          };
          this.endpointStatus.set(endpoint, { 
            status, 
            timestamp: Date.now() 
          });
          console.error(`❌ Error checking API endpoint ${endpoint}:`, apiError.message);
          return status;
        }
      }
    } catch (error) {
      // Handle errors from simpleFetch
      
      // For CORS errors, mark as "unknown" rather than "unavailable"
      if (error.message.includes('Network Error') || 
          error.message.includes('CORS') ||
          !error.response) {
        const status = { 
          available: null, // null means "unknown"
          error: { 
            status: 'CORS', 
            message: 'Cannot determine availability due to CORS restrictions' 
          }
        };
        this.endpointStatus.set(endpoint, { 
          status, 
          timestamp: Date.now() 
        });
        console.warn(`⚠️ Cannot determine API endpoint status due to CORS: ${endpoint}`);
        return status;
      }
      
      // For other errors, the endpoint might exist but have other issues
      const status = { 
        available: false, 
        error: { 
          status: error.response?.status || 'Network Error', 
          message: error.message 
        }
      };
      this.endpointStatus.set(endpoint, { 
        status, 
        timestamp: Date.now() 
      });
      console.error(`❌ Error checking API endpoint ${endpoint}:`, error.message);
      return status;
    }
  }

  /**
   * Check multiple endpoints at once
   * @param {string[]} endpoints - The endpoints to check
   * @returns {Promise<Object>} - An object with endpoint status for each endpoint
   */
  async checkMultipleEndpoints(endpoints) {
    const statusChecks = endpoints.map(async endpoint => {
      const status = await this.checkEndpoint(endpoint);
      return { endpoint, status };
    });

    const results = await Promise.all(statusChecks);
    
    // Convert to an object
    return results.reduce((acc, { endpoint, status }) => {
      acc[endpoint] = status;
      return acc;
    }, {});
  }

  /**
   * Get a list of failed endpoints with reasons
   * @param {Object} checkResults - The results from checkMultipleEndpoints
   * @returns {Object[]} - Array of failed endpoints with reasons
   */
  getFailedEndpoints(checkResults) {
    return Object.entries(checkResults)
      .filter(([_, status]) => status.available === false) // Only include definitively unavailable endpoints
      .map(([endpoint, status]) => ({
        endpoint,
        status: status.error.status,
        reason: status.error.message
      }));
  }

  /**
   * Print a summary of API endpoint health to console
   * @param {Object} checkResults - The results from checkMultipleEndpoints
   */
  logApiHealthSummary(checkResults) {
    console.group('🔍 API Endpoint Health Check');
    
    Object.entries(checkResults).forEach(([endpoint, status]) => {
      if (status.available === true) {
        console.log(`✅ ${endpoint}: Available`);
      } else if (status.available === null) {
        console.warn(`❓ ${endpoint}: Unknown (CORS prevented check)`);
        console.warn(`   - Reason: ${status.error.message}`);
      } else {
        console.warn(`❌ ${endpoint}: Unavailable`);
        console.warn(`   - Status: ${status.error.status}`);
        console.warn(`   - Reason: ${status.error.message}`);
      }
    });
    
    console.groupEnd();
  }
}

export default new ApiHealthService(); 