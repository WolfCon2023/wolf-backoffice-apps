import { api } from './apiConfig';
import ErrorLogger from '../utils/errorLogger';

class TeamService {
  constructor() {
    this.cache = new Map();
  }

  logError(error, context) {
    console.error(`❌ TeamService Error (${context}):`, error);
    return ErrorLogger.logToFile ? 
      ErrorLogger.logToFile(error, `TeamService:${context}`) : 
      console.error('ErrorLogger not available');
  }

  async getAllTeams() {
    try {
      console.log('📡 Fetching all teams...');
      const response = await api.get('/teams');
      
      const teams = Array.isArray(response.data) ? response.data : [];
      console.log(`✅ Found ${teams.length} teams`);
      this.cache.set('allTeams', teams);
      return teams;
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'getAllTeams');
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }
  }

  async getTeamById(id, useCache = true) {
    try {
      console.log(`📡 Fetching team ${id}...`);
      const response = await api.get(`/teams/${id}`);
      console.log('✅ Team fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching team:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'getTeamById');
      throw new Error(`Failed to fetch team: ${error.message}`);
    }
  }

  async createTeam(teamData) {
    try {
      // Create a clean payload
      const payload = {
        name: teamData.name,
        description: teamData.description || '',
        status: teamData.status || 'ACTIVE',
        members: teamData.members || []
      };

      console.log('📡 Creating team with data:', payload);
      const response = await api.post('/teams', payload);
      
      console.log('✅ Team created successfully:', response.data.name);
      this.cache.delete('allTeams');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'createTeam');
      throw new Error(`Failed to create team: ${error.message}`);
    }
  }

  async updateTeam(id, teamData) {
    try {
      // Ensure name is present (required by API)
      if (!teamData.name) {
        throw new Error('Team name is required');
      }

      console.log(`📡 Updating team ${id} with data:`, teamData);
      const response = await api.put(`/teams/${id}`, teamData);
      
      console.log('✅ Team updated successfully:', response.data.name);
      this.cache.delete('allTeams');
      return response.data;
    } catch (error) {
      console.error('❌ Error updating team:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'updateTeam');
      throw new Error(`Failed to update team: ${error.message}`);
    }
  }

  async deleteTeam(id) {
    try {
      console.log(`📡 Deleting team ${id}...`);
      const response = await api.delete(`/teams/${id}`);
      
      console.log('✅ Team deleted successfully');
      this.cache.delete('allTeams');
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting team:', error);
      if (error.response) {
        console.error('Response error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      this.logError(error, 'deleteTeam');
      throw new Error(`Failed to delete team: ${error.message}`);
    }
  }

  async updateTeamStatus(id, status) {
    try {
      // Validate status
      if (!['ACTIVE', 'INACTIVE', 'ON_HOLD'].includes(status.toUpperCase())) {
        throw new Error(`Invalid status value: ${status}. Must be one of: ACTIVE, INACTIVE, ON_HOLD`);
      }

      console.log(`📡 Updating team ${id} status to ${status}`);
      
      // First get the team to ensure we have the name (required by the API)
      const team = await this.getTeamById(id);
      
      // Use the dedicated status update endpoint
      const response = await api.put(`/teams/${id}/status`, { 
        status: status.toUpperCase()
      });
      
      console.log(`✅ Status successfully updated to ${status}`);
      
      // Update cache with the new team data
      const updatedTeam = response.data;
      sessionStorage.setItem(`team_${id}`, JSON.stringify(updatedTeam));
      this.cache.delete('allTeams');
      
      return updatedTeam;
    } catch (error) {
      console.error('❌ Error updating team status:', error);
      this.logError(error, 'updateTeamStatus');
      throw new Error(`Failed to update team status: ${error.message}`);
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
      const response = await api.post(`/teams/${teamId}/projects/${projectId}`);
      console.log('✅ Project assigned to team:', response.data);
      this.cache.delete(`team:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error assigning project to team:`, error);
      this.logError(error, 'assignProjectToTeam');
      throw new Error(`Failed to assign project to team: ${error.message}`);
    }
  }

  async removeProjectFromTeam(teamId, projectId) {
    try {
      console.log(`📡 Removing project ${projectId} from team ${teamId}`);
      const response = await api.delete(`/teams/${teamId}/projects/${projectId}`);
      console.log('✅ Project removed from team:', response.data);
      this.cache.delete(`team:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing project from team:`, error);
      this.logError(error, 'removeProjectFromTeam');
      throw new Error(`Failed to remove project from team: ${error.message}`);
    }
  }

  async updateTeamMemberRole(teamId, userId, role) {
    try {
      console.log(`📡 Updating role for member ${userId} in team ${teamId} to: ${role}`);
      const validRoles = ['TEAM_LEAD', 'DEVELOPER', 'DESIGNER', 'QA', 'PRODUCT_OWNER'];
      if (!validRoles.includes(role)) {
        throw new Error(`Role must be one of: ${validRoles.join(', ')}`);
      }

      const response = await api.put(`/teams/${teamId}/members/${userId}/role`, { role });
      console.log('✅ Team member role updated:', response.data);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team member role:`, error);
      this.logError(error, 'updateTeamMemberRole');
      throw new Error(`Failed to update team member role: ${error.message}`);
    }
  }

  async updateTeamMemberAvailability(teamId, userId, availability) {
    try {
      console.log(`📡 Updating availability for member ${userId} in team ${teamId} to: ${availability}%`);
      if (typeof availability !== 'number' || availability < 0 || availability > 100) {
        throw new Error('Availability must be a number between 0 and 100');
      }

      const response = await api.put(`/teams/${teamId}/members/${userId}/availability`, { availability });
      console.log('✅ Team member availability updated:', response.data);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team member availability:`, error);
      this.logError(error, 'updateTeamMemberAvailability');
      throw new Error(`Failed to update team member availability: ${error.message}`);
    }
  }

  async getTeamMembers(id) {
    const cacheKey = `teamMembers:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching members for team ${id}...`);
      const response = await api.get(`/teams/${id}/members`);
      console.log('✅ Team members fetched:', response.data);
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team members ${id}:`, error);
      this.logError(error, 'getTeamMembers');
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }
  }

  async addTeamMember(teamId, userId, role = 'DEVELOPER') {
    try {
      console.log(`📡 Adding user ${userId} to team ${teamId} with role ${role}`);
      const response = await api.post(`/teams/${teamId}/members`, { 
        userId,
        role
      });
      console.log('✅ Team member added:', response.data);
      this.cache.delete(`team:${teamId}`);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding team member:`, error);
      this.logError(error, 'addTeamMember');
      throw new Error(`Failed to add team member: ${error.message}`);
    }
  }

  async removeTeamMember(teamId, userId) {
    try {
      console.log(`📡 Removing user ${userId} from team ${teamId}`);
      const response = await api.delete(`/teams/${teamId}/members/${userId}`);
      console.log('✅ Team member removed:', response.data);
      this.cache.delete(`team:${teamId}`);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing team member:`, error);
      this.logError(error, 'removeTeamMember');
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  }

  async getTeamMetrics(id) {
    const cacheKey = `teamMetrics:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for team ${id}...`);
      const response = await api.get(`/teams/${id}/metrics`);
      console.log('✅ Team metrics fetched:', response.data);
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team metrics ${id}:`, error);
      this.logError(error, 'getTeamMetrics');
      throw new Error(`Failed to fetch team metrics: ${error.message}`);
    }
  }

  async getTeamVelocity(id) {
    const cacheKey = `teamVelocity:${id}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching velocity for team ${id}...`);
      const response = await api.get(`/teams/${id}/velocity`);
      console.log('✅ Team velocity fetched:', response.data);
      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team velocity ${id}:`, error);
      this.logError(error, 'getTeamVelocity');
      throw new Error(`Failed to fetch team velocity: ${error.message}`);
    }
  }

  async refreshTeamCache(id) {
    try {
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      // Clear the cache
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Error refreshing team cache:`, error);
      this.logError(error, 'refreshTeamCache');
      throw new Error(`Failed to refresh team cache: ${error.message}`);
    }
  }
}

const teamService = new TeamService();
export default teamService;