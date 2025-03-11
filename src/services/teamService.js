import axios from 'axios';
import { api, handleHttpError, createErrorMessage } from '../utils';
import { ErrorLogger } from './ErrorLogger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || "https://wolf-backoffice-backend-development.up.railway.app/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

class TeamService {
  constructor() {
    this.logError = this.logError.bind(this);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  logError(error, context) {
    return ErrorLogger.logToFile(error, `TeamService:${context}`);
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

  async getAllTeams() {
    const cacheKey = 'allTeams';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📡 Fetching all teams...');
      const response = await axios.get(`${API_BASE_URL}/teams`, {
        headers: getAuthHeader()
      });
      console.log('✅ API Response:', response);
      this.setCachedData(cacheKey, response.data);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('❌ Error fetching all teams:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getAllTeams');
      throw new Error(`Failed to fetch teams: ${errorMessage}`);
    }
  }

  async getTeam(id) {
    const cacheKey = `team:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching team ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/teams/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getTeam');
      throw new Error(`Failed to fetch team: ${errorMessage}`);
    }
  }

  async createTeam(teamData) {
    try {
      console.log('📡 Creating new team:', teamData);
      const response = await axios.post(`${API_BASE_URL}/teams`, teamData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Team created:', response.data);
      // Invalidate teams cache
      this.cache.delete('allTeams');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'createTeam');
      throw new Error(`Failed to create team: ${errorMessage}`);
    }
  }

  async updateTeam(id, teamData) {
    try {
      console.log(`📡 Updating team ${id}:`, teamData);
      if (!teamData.name) {
        throw new Error('Team name is required');
      }

      const response = await axios.put(`${API_BASE_URL}/teams/${id}`, {
        ...teamData,
        updatedAt: new Date().toISOString()
      }, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Team updated:', response.data);
      // Invalidate related caches
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateTeam');
      throw new Error(`Failed to update team: ${errorMessage}`);
    }
  }

  async updateTeamName(id, name) {
    try {
      console.log(`📡 Updating team ${id} name to: ${name}`);
      if (!name || name.trim().length === 0) {
        throw new Error('Team name cannot be empty');
      }
      return this.updateTeam(id, { name });
    } catch (error) {
      console.error(`❌ Error updating team name:`, error);
      this.logError(error, 'updateTeamName');
      throw error;
    }
  }

  async updateTeamDescription(id, description) {
    try {
      console.log(`📡 Updating team ${id} description`);
      return this.updateTeam(id, { description });
    } catch (error) {
      console.error(`❌ Error updating team description:`, error);
      this.logError(error, 'updateTeamDescription');
      throw error;
    }
  }

  async updateTeamCapacity(id, capacity) {
    try {
      console.log(`📡 Updating team ${id} capacity to: ${capacity}`);
      if (typeof capacity !== 'number' || capacity < 0) {
        throw new Error('Capacity must be a positive number');
      }
      return this.updateTeam(id, { capacity });
    } catch (error) {
      console.error(`❌ Error updating team capacity:`, error);
      this.logError(error, 'updateTeamCapacity');
      throw error;
    }
  }

  async updateTeamStatus(id, status) {
    try {
      console.log(`📡 Updating team ${id} status to: ${status}`);
      const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_HOLD'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      }
      return this.updateTeam(id, { status });
    } catch (error) {
      console.error(`❌ Error updating team status:`, error);
      this.logError(error, 'updateTeamStatus');
      throw error;
    }
  }

  async updateTeamLeader(id, leaderId) {
    try {
      console.log(`📡 Updating team ${id} leader to: ${leaderId}`);
      if (!leaderId) {
        throw new Error('Leader ID is required');
      }
      return this.updateTeam(id, { leaderId });
    } catch (error) {
      console.error(`❌ Error updating team leader:`, error);
      this.logError(error, 'updateTeamLeader');
      throw error;
    }
  }

  async assignProjectToTeam(teamId, projectId) {
    try {
      console.log(`📡 Assigning project ${projectId} to team ${teamId}`);
      const response = await axios.post(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`, null, {
        headers: getAuthHeader()
      });
      console.log('✅ Project assigned to team:', response.data);
      // Invalidate related caches
      this.cache.delete(`team:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error assigning project to team:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'assignProjectToTeam');
      throw new Error(`Failed to assign project to team: ${errorMessage}`);
    }
  }

  async removeProjectFromTeam(teamId, projectId) {
    try {
      console.log(`📡 Removing project ${projectId} from team ${teamId}`);
      const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}/projects/${projectId}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Project removed from team:', response.data);
      // Invalidate related caches
      this.cache.delete(`team:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing project from team:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'removeProjectFromTeam');
      throw new Error(`Failed to remove project from team: ${errorMessage}`);
    }
  }

  async updateTeamMemberRole(teamId, userId, role) {
    try {
      console.log(`📡 Updating role for member ${userId} in team ${teamId} to: ${role}`);
      const validRoles = ['TEAM_LEAD', 'DEVELOPER', 'DESIGNER', 'QA', 'PRODUCT_OWNER'];
      if (!validRoles.includes(role)) {
        throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
      }

      const response = await axios.put(`${API_BASE_URL}/teams/${teamId}/members/${userId}/role`, { role }, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Team member role updated:', response.data);
      // Invalidate related caches
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team member role:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateTeamMemberRole');
      throw new Error(`Failed to update team member role: ${errorMessage}`);
    }
  }

  async updateTeamMemberAvailability(teamId, userId, availability) {
    try {
      console.log(`📡 Updating availability for member ${userId} in team ${teamId} to: ${availability}%`);
      if (typeof availability !== 'number' || availability < 0 || availability > 100) {
        throw new Error('Availability must be a number between 0 and 100');
      }

      const response = await axios.put(`${API_BASE_URL}/teams/${teamId}/members/${userId}/availability`, { availability }, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Team member availability updated:', response.data);
      // Invalidate related caches
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team member availability:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'updateTeamMemberAvailability');
      throw new Error(`Failed to update team member availability: ${errorMessage}`);
    }
  }

  async deleteTeam(id) {
    try {
      console.log(`📡 Deleting team ${id}`);
      const response = await axios.delete(`${API_BASE_URL}/teams/${id}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team deleted:', response.data);
      // Invalidate related caches
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting team ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'deleteTeam');
      throw new Error(`Failed to delete team: ${errorMessage}`);
    }
  }

  async getTeamMembers(id) {
    const cacheKey = `teamMembers:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching members for team ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/teams/${id}/members`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team members fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team members ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getTeamMembers');
      throw new Error(`Failed to fetch team members: ${errorMessage}`);
    }
  }

  async addTeamMember(id, userData) {
    try {
      console.log(`📡 Adding member to team ${id}:`, userData);
      const response = await axios.post(`${API_BASE_URL}/teams/${id}/members`, userData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "application/json"
        }
      });
      console.log('✅ Team member added:', response.data);
      // Invalidate related caches
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding team member:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'addTeamMember');
      throw new Error(`Failed to add team member: ${errorMessage}`);
    }
  }

  async removeTeamMember(teamId, userId) {
    try {
      console.log(` Removing member ${userId} from team ${teamId}`);
      const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}/members/${userId}`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team member removed:', response.data);
      // Invalidate related caches
      this.cache.delete(`team:${teamId}`);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing team member:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'removeTeamMember');
      throw new Error(`Failed to remove team member: ${errorMessage}`);
    }
  }

  async getTeamMetrics(id) {
    const cacheKey = `teamMetrics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for team ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/teams/${id}/metrics`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team metrics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team metrics ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getTeamMetrics');
      throw new Error(`Failed to fetch team metrics: ${errorMessage}`);
    }
  }

  async getTeamVelocity(id) {
    const cacheKey = `teamVelocity:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching velocity for team ${id}...`);
      const response = await axios.get(`${API_BASE_URL}/teams/${id}/velocity`, {
        headers: getAuthHeader()
      });
      console.log('✅ Team velocity fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team velocity ${id}:`, error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'getTeamVelocity');
      throw new Error(`Failed to fetch team velocity: ${errorMessage}`);
    }
  }

  async refreshTeamCache(id) {
    try {
      // Clear specific team caches
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      this.cache.delete(`teamMetrics:${id}`);
      this.cache.delete(`teamVelocity:${id}`);
      
      // Refetch team data
      await this.getTeam(id);
      return true;
    } catch (error) {
      const errorMessage = createErrorMessage(error);
      this.logError(error, 'refreshTeamCache');
      throw new Error(`Failed to refresh team cache: ${errorMessage}`);
    }
  }
}

export default new TeamService(); 