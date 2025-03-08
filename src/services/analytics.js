import { api, handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

class Analytics {
  constructor() {
    this.logError = this.logError.bind(this);
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `Analytics:${context}`);
  }

  async getAppointmentAnalytics() {
    try {
      const response = await api.get('/analytics/appointments');
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAppointmentAnalytics');
      throw new Error(`Failed to fetch appointment analytics: ${errorMessage}`);
    }
  }

  async getSchedulingMetrics() {
    try {
      const response = await api.get('/analytics/metrics');
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getSchedulingMetrics');
      throw new Error(`Failed to fetch scheduling metrics: ${errorMessage}`);
    }
  }

  async getBusinessMetrics() {
    try {
      const response = await api.get('/analytics/business');
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getBusinessMetrics');
      throw new Error(`Failed to fetch business metrics: ${errorMessage}`);
    }
  }
}

export const AnalyticsService = new Analytics(); 