import { api, handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

class NotificationServiceClass {
  constructor() {
    this.logError = this.logError.bind(this);
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.pendingNotifications = new Map();
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `NotificationService:${context}`);
  }

  async retryWithBackoff(operation, context, retries = 0) {
    try {
      return await operation();
    } catch (error) {
      if (retries >= this.maxRetries) {
        throw error;
      }

      const delay = this.retryDelay * Math.pow(2, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithBackoff(operation, context, retries + 1);
    }
  }

  async sendEmailNotification(appointment, options = {}) {
    const { 
      template = 'APPOINTMENT_CONFIRMATION',
      priority = 'normal',
      attachments = []
    } = options;

    try {
      const operation = async () => {
        const response = await api.post('/notifications/email', {
          appointmentId: appointment._id,
          recipientEmail: appointment.contactEmail,
          type: template,
          priority,
          data: {
            title: appointment.title,
            date: appointment.date,
            location: appointment.location,
            contactName: appointment.contactName
          },
          attachments
        }, {
          timeout: 10000 // 10 second timeout
        });

        // Track pending notification
        this.pendingNotifications.set(`email:${appointment._id}`, {
          type: 'email',
          status: 'sent',
          timestamp: new Date(),
          details: response.data
        });

        return response;
      };

      return await this.retryWithBackoff(operation, 'sendEmailNotification');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'sendEmailNotification');
      throw new Error(`Failed to send email notification: ${errorMessage}`);
    }
  }

  async sendSMSNotification(appointment, options = {}) {
    const { 
      template = 'APPOINTMENT_CONFIRMATION',
      priority = 'normal'
    } = options;

    try {
      const operation = async () => {
        const response = await api.post('/notifications/sms', {
          appointmentId: appointment._id,
          phoneNumber: appointment.contactPhone,
          type: template,
          priority,
          data: {
            title: appointment.title,
            date: appointment.date,
            location: appointment.location
          }
        }, {
          timeout: 10000 // 10 second timeout
        });

        // Track pending notification
        this.pendingNotifications.set(`sms:${appointment._id}`, {
          type: 'sms',
          status: 'sent',
          timestamp: new Date(),
          details: response.data
        });

        return response;
      };

      return await this.retryWithBackoff(operation, 'sendSMSNotification');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'sendSMSNotification');
      throw new Error(`Failed to send SMS notification: ${errorMessage}`);
    }
  }

  async scheduleReminder(appointment, options = {}) {
    const { 
      reminderType = 'both', // 'email', 'sms', or 'both'
      timeBeforeAppointment = 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      template = 'APPOINTMENT_REMINDER'
    } = options;

    try {
      const operation = async () => {
        const response = await api.post('/notifications/schedule', {
          appointmentId: appointment._id,
          type: template,
          reminderType,
          scheduledFor: new Date(appointment.date).getTime() - timeBeforeAppointment,
          data: {
            title: appointment.title,
            date: appointment.date,
            location: appointment.location,
            contactEmail: appointment.contactEmail,
            contactPhone: appointment.contactPhone
          }
        }, {
          timeout: 10000 // 10 second timeout
        });

        // Track scheduled reminder
        this.pendingNotifications.set(`reminder:${appointment._id}`, {
          type: 'reminder',
          status: 'scheduled',
          timestamp: new Date(),
          details: response.data
        });

        return response;
      };

      return await this.retryWithBackoff(operation, 'scheduleReminder');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'scheduleReminder');
      throw new Error(`Failed to schedule reminder: ${errorMessage}`);
    }
  }

  async cancelNotifications(appointmentId) {
    try {
      const operation = async () => {
        const response = await api.delete(`/notifications/${appointmentId}`);
        
        // Remove from pending notifications
        this.pendingNotifications.delete(`email:${appointmentId}`);
        this.pendingNotifications.delete(`sms:${appointmentId}`);
        this.pendingNotifications.delete(`reminder:${appointmentId}`);
        
        return response;
      };

      return await this.retryWithBackoff(operation, 'cancelNotifications');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'cancelNotifications');
      throw new Error(`Failed to cancel notifications: ${errorMessage}`);
    }
  }

  async updateNotifications(appointment, options = {}) {
    const { 
      sendUpdateNotification = true,
      updateReminders = true,
      template = 'APPOINTMENT_UPDATE'
    } = options;

    try {
      const operation = async () => {
        const response = await api.put(`/notifications/${appointment._id}`, {
          type: template,
          sendUpdateNotification,
          updateReminders,
          data: {
            title: appointment.title,
            date: appointment.date,
            location: appointment.location,
            contactEmail: appointment.contactEmail,
            contactPhone: appointment.contactPhone
          }
        }, {
          timeout: 10000 // 10 second timeout
        });

        // Update pending notifications
        if (this.pendingNotifications.has(`reminder:${appointment._id}`)) {
          const reminder = this.pendingNotifications.get(`reminder:${appointment._id}`);
          reminder.status = 'updated';
          reminder.timestamp = new Date();
          this.pendingNotifications.set(`reminder:${appointment._id}`, reminder);
        }

        return response;
      };

      return await this.retryWithBackoff(operation, 'updateNotifications');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateNotifications');
      throw new Error(`Failed to update notifications: ${errorMessage}`);
    }
  }

  // Debug and monitoring methods
  async getNotificationStatus(notificationId) {
    try {
      const response = await api.get(`/notifications/status/${notificationId}`);
      return response;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getNotificationStatus');
      throw new Error(`Failed to get notification status: ${errorMessage}`);
    }
  }

  async resendFailedNotification(notificationId, options = {}) {
    const { maxAttempts = 3 } = options;

    try {
      const operation = async () => {
        const response = await api.post(`/notifications/resend/${notificationId}`, {
          maxAttempts
        });
        return response;
      };

      return await this.retryWithBackoff(operation, 'resendFailedNotification');
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'resendFailedNotification');
      throw new Error(`Failed to resend notification: ${errorMessage}`);
    }
  }

  // Utility methods
  getPendingNotifications() {
    return Array.from(this.pendingNotifications.entries()).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }

  clearPendingNotifications() {
    this.pendingNotifications.clear();
  }
}

export const NotificationService = new NotificationServiceClass(); 