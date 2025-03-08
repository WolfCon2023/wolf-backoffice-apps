import { api, handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

class AnalyticsServiceClass {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `AnalyticsService:${context}`);
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

  async getAppointmentAnalytics() {
    const cacheKey = 'appointmentAnalytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/appointments');
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAppointmentAnalytics');
      throw new Error(`Failed to fetch appointment analytics: ${errorMessage}`);
    }
  }

  async getSchedulingMetrics(options = {}) {
    const { timeRange = 'week', groupBy = 'day' } = options;
    const cacheKey = `schedulingMetrics:${timeRange}:${groupBy}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/metrics', {
        params: { timeRange, groupBy }
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSchedulingMetrics');
      throw new Error(`Failed to fetch scheduling metrics: ${errorMessage}`);
    }
  }

  async getBusinessMetrics() {
    const cacheKey = 'businessMetrics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Fetch multiple analytics data concurrently with timeouts
      const [
        appointmentStats,
        customerInsights,
        revenueData,
        locationStats
      ] = await Promise.all([
        this.getAppointmentStatistics().catch(e => ({ error: e })),
        this.getCustomerInsights().catch(e => ({ error: e })),
        this.getRevenueAnalytics().catch(e => ({ error: e })),
        this.getLocationPerformance().catch(e => ({ error: e }))
      ]);

      const result = {
        appointments: appointmentStats.error ? null : appointmentStats,
        customers: customerInsights.error ? null : customerInsights,
        revenue: revenueData.error ? null : revenueData,
        locations: locationStats.error ? null : locationStats,
        timestamp: new Date().toISOString(),
        partialData: false
      };

      // Check if we have partial data
      if ([appointmentStats, customerInsights, revenueData, locationStats].some(r => r.error)) {
        result.partialData = true;
        this.logError(
          new Error('Some metrics failed to load'), 
          'getBusinessMetrics:partialData'
        );
      }

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getBusinessMetrics');
      throw new Error(`Failed to fetch business metrics: ${errorMessage}`);
    }
  }

  async getAppointmentTrends(options = {}) {
    const { 
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      groupBy = 'day'
    } = options;

    const cacheKey = `appointmentTrends:${startDate}:${endDate}:${groupBy}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/appointments/trends', {
        params: { 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy
        }
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAppointmentTrends');
      throw new Error(`Failed to fetch appointment trends: ${errorMessage}`);
    }
  }

  async getCustomerInsights(options = {}) {
    const { segment, timeRange = 'month' } = options;
    const cacheKey = `customerInsights:${segment || 'all'}:${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/customers/insights', {
        params: { segment, timeRange }
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getCustomerInsights');
      throw new Error(`Failed to fetch customer insights: ${errorMessage}`);
    }
  }

  async getRevenueAnalytics(options = {}) {
    const { period = 'monthly', includeProjections = false } = options;
    const cacheKey = `revenueAnalytics:${period}:${includeProjections}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/revenue', {
        params: { period, includeProjections }
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getRevenueAnalytics');
      throw new Error(`Failed to fetch revenue analytics: ${errorMessage}`);
    }
  }

  async getLocationPerformance(options = {}) {
    const { sortBy = 'appointments', order = 'desc' } = options;
    const cacheKey = `locationPerformance:${sortBy}:${order}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/locations/performance', {
        params: { sortBy, order }
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getLocationPerformance');
      throw new Error(`Failed to fetch location performance: ${errorMessage}`);
    }
  }

  async getAppointmentStatistics(filters = {}) {
    const filterKey = JSON.stringify(filters);
    const cacheKey = `appointmentStatistics:${filterKey}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await api.get('/analytics/appointments/statistics', {
        params: filters
      });
      this.setCachedData(cacheKey, response);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAppointmentStatistics');
      throw new Error(`Failed to fetch appointment statistics: ${errorMessage}`);
    }
  }

  async exportAnalyticsReport(reportType, dateRange, options = {}) {
    try {
      const { format = 'pdf', includeCharts = true } = options;
      
      // Validate date range
      if (!dateRange || !dateRange.startDate || !dateRange.endDate) {
        const error = new Error('Please select a valid date range for the report');
        error.name = 'ValidationError';
        throw error;
      }

      // Ensure we have Date objects
      const startDate = dateRange.startDate instanceof Date ? 
        dateRange.startDate : new Date(dateRange.startDate);
      const endDate = dateRange.endDate instanceof Date ? 
        dateRange.endDate : new Date(dateRange.endDate);

      // Validate dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        const error = new Error('Invalid date format. Please check your date selection.');
        error.name = 'ValidationError';
        throw error;
      }

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('Authentication required. Please log in again.');
        error.name = 'AuthError';
        throw error;
      }

      try {
        // Use the same endpoint that works for fetching appointments
        const response = await api.get('/appointments', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Handle different response formats
        let appointments;
        if (Array.isArray(response)) {
          appointments = response;
        } else if (response?.data) {
          appointments = Array.isArray(response.data) ? response.data : 
                        response.data?.appointments || response.data?.data || [];
        } else {
          appointments = [];
        }

        // Validate we have data
        if (!appointments || appointments.length === 0) {
          const error = new Error('No appointments found for the selected period');
          error.name = 'DataError';
          throw error;
        }

        // Filter out deleted appointments and sort by date
        appointments = appointments
          .filter(apt => !apt.toBeDeleted)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Generate report content
        const reportContent = {
          title: 'Monthly Analytics Report',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalAppointments: appointments.length,
            completedAppointments: appointments.filter(apt => new Date(apt.date) < new Date()).length,
            upcomingAppointments: appointments.filter(apt => new Date(apt.date) >= new Date()).length
          },
          appointments: appointments.map(apt => ({
            title: apt.title || 'Untitled',
            date: new Date(apt.date).toLocaleDateString(),
            time: new Date(apt.date).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit'
            }),
            location: apt.location || 'No location',
            status: new Date(apt.date) < new Date() ? 'Completed' : 'Upcoming',
            contactName: apt.contactName || 'N/A',
            contactEmail: apt.contactEmail || 'N/A'
          }))
        };

        // Create CSV content with headers
        const headers = ['Title', 'Date', 'Time', 'Location', 'Status', 'Contact Name', 'Contact Email'];
        let csvContent = headers.join(',') + '\n';

        // Add appointment data
        reportContent.appointments.forEach(apt => {
          const row = [
            `"${(apt.title || '').replace(/"/g, '""')}"`,
            `"${apt.date}"`,
            `"${apt.time}"`,
            `"${(apt.location || '').replace(/"/g, '""')}"`,
            `"${apt.status}"`,
            `"${(apt.contactName || '').replace(/"/g, '""')}"`,
            `"${(apt.contactEmail || '').replace(/"/g, '""')}"`
          ];
          csvContent += row.join(',') + '\n';
        });

        // Generate and download the CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `appointments-report-${startDate.toISOString().slice(0, 10)}-to-${endDate.toISOString().slice(0, 10)}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
      } catch (networkError) {
        console.error('Export error details:', networkError);
        // Handle specific error cases
        if (networkError.response?.status === 401) {
          const error = new Error('Session expired. Please log in again.');
          error.name = 'AuthError';
          throw error;
        } else if (networkError.response?.status === 404) {
          const error = new Error('The appointments feature is not available at the moment.');
          error.name = 'NetworkError';
          throw error;
        } else {
          const error = new Error(
            networkError.response?.data?.message || 
            'Network error occurred while fetching appointment data. Please try again.'
          );
          error.name = 'NetworkError';
          error.originalError = networkError;
          throw error;
        }
      }
    } catch (error) {
      // Log error details locally
      this.logError(error, 'exportAnalyticsReport');
      
      // Return a user-friendly error message based on error type
      if (error.name === 'AuthError') {
        throw new Error('Please log in again to access this feature.');
      } else if (error.name === 'ValidationError' || error.name === 'DataError') {
        throw new Error(error.message);
      } else {
        throw new Error('Unable to generate the analytics report. Please try again later.');
      }
    }
  }

  async validateAnalyticsData(data) {
    try {
      const response = await api.post('/analytics/validate', data);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'validateAnalyticsData');
      throw new Error(`Failed to validate analytics data: ${errorMessage}`);
    }
  }

  async refreshAnalyticsCache() {
    try {
      const response = await api.post('/analytics/cache/refresh');
      // Clear local cache
      this.cache.clear();
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'refreshAnalyticsCache');
      throw new Error(`Failed to refresh analytics cache: ${errorMessage}`);
    }
  }
}

export const AnalyticsService = new AnalyticsServiceClass(); 