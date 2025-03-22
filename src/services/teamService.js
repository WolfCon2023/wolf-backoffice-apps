import { api } from './apiConfig';
import { createErrorMessage } from '../utils';
import ErrorLogger from '../utils/errorLogger';

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
      console.log('📡 Fetching all teams from projects...');
      // Get all projects
      const projectsResponse = await api.get('/projects');
      const projects = projectsResponse.data || [];
      
      console.log('📊 Project data structure:', JSON.stringify(projects, null, 2));
      
      // Create synthetic teams for projects
      const allTeams = projects.map(project => {
        if (!project) return null;
        
        const projectId = project._id || project.id;
        const projectName = project.name || 'Unnamed Project';
        
        console.log(`Processing project ${projectId}:`, project);
        
        // Create a synthetic team based on project data
        const team = {
          id: `team-${projectId}`,
          name: `${projectName} Team`,
          description: `Team for ${projectName}`,
          projectId: projectId,
          projectName: projectName,
          capacity: 5,
          status: 'ACTIVE',
          members: [],
          metrics: {
            velocity: project.metrics?.velocity || 0,
            completedStoryPoints: project.metrics?.completedStoryPoints || 0,
            totalStoryPoints: project.metrics?.totalStoryPoints || 0,
            avgCycleTime: project.metrics?.avgCycleTime || 0
          }
        };

        // Add owner as team member if available
        if (project.owner) {
          const owner = project.owner;
          team.members.push({
            id: owner._id || owner.id || `user-${Date.now()}`,
            name: owner.name || owner.email || 'Team Lead',
            email: owner.email || '',
            role: 'TEAM_LEAD',
            availability: 100,
            avatar: owner.avatar || '',
            status: 'ACTIVE',
            joinedAt: project.startDate || new Date().toISOString(),
            skills: owner.skills || [],
            title: owner.title || 'Team Lead'
          });
        }
        
        console.log(`✅ Created synthetic team for project ${projectId}:`, team);
        return team;
      }).filter(Boolean); // Remove any null teams
      
      console.log('✅ Teams processed:', allTeams);
      this.setCachedData(cacheKey, allTeams);
      return allTeams;
    } catch (error) {
      console.error('❌ Error fetching all teams:', error);
      this.logError(error, 'getAllTeams');
      return [];
    }
  }

  async getTeam(id) {
    const cacheKey = `team:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching team ${id}...`);
      const response = await api.get(`/teams/${id}`);
      console.log('✅ Team fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team ${id}:`, error);
      this.logError(error, 'getTeam');
      throw new Error(`Failed to fetch team: ${createErrorMessage(error)}`);
    }
  }

  async createTeam(teamData) {
    try {
      console.log('📡 Creating new team:', teamData);
      const response = await api.post('/teams', teamData);
      console.log('✅ Team created:', response.data);
      this.cache.delete('allTeams');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating team:', error);
      this.logError(error, 'createTeam');
      throw new Error(`Failed to create team: ${createErrorMessage(error)}`);
    }
  }

  async updateTeam(id, teamData) {
    try {
      console.log(`📡 Updating team ${id}:`, teamData);
      if (!teamData.name) {
        throw new Error('Team name is required');
      }

      const response = await api.put(`/teams/${id}`, {
        ...teamData,
        updatedAt: new Date().toISOString()
      });
      console.log('✅ Team updated:', response.data);
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating team ${id}:`, error);
      this.logError(error, 'updateTeam');
      throw new Error(`Failed to update team: ${createErrorMessage(error)}`);
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
      const response = await api.post(`/teams/${teamId}/projects/${projectId}`);
      console.log('✅ Project assigned to team:', response.data);
      this.cache.delete(`team:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error assigning project to team:`, error);
      this.logError(error, 'assignProjectToTeam');
      throw new Error(`Failed to assign project to team: ${createErrorMessage(error)}`);
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
      throw new Error(`Failed to remove project from team: ${createErrorMessage(error)}`);
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
      throw new Error(`Failed to update team member role: ${createErrorMessage(error)}`);
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
      throw new Error(`Failed to update team member availability: ${createErrorMessage(error)}`);
    }
  }

  async deleteTeam(id) {
    try {
      console.log(`📡 Deleting team ${id}`);
      const response = await api.delete(`/teams/${id}`);
      console.log('✅ Team deleted:', response.data);
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting team ${id}:`, error);
      this.logError(error, 'deleteTeam');
      throw new Error(`Failed to delete team: ${createErrorMessage(error)}`);
    }
  }

  async getTeamMembers(id) {
    const cacheKey = `teamMembers:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching members for team ${id}...`);
      const response = await api.get(`/teams/${id}/members`);
      console.log('✅ Team members fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team members ${id}:`, error);
      this.logError(error, 'getTeamMembers');
      throw new Error(`Failed to fetch team members: ${createErrorMessage(error)}`);
    }
  }

  async addTeamMember(id, userData) {
    try {
      console.log(`📡 Adding member to team ${id}:`, userData);
      const response = await api.post(`/teams/${id}/members`, userData);
      console.log('✅ Team member added:', response.data);
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error adding team member:`, error);
      this.logError(error, 'addTeamMember');
      throw new Error(`Failed to add team member: ${createErrorMessage(error)}`);
    }
  }

  async removeTeamMember(teamId, userId) {
    try {
      console.log(` Removing member ${userId} from team ${teamId}`);
      const response = await api.delete(`/teams/${teamId}/members/${userId}`);
      console.log('✅ Team member removed:', response.data);
      this.cache.delete(`team:${teamId}`);
      this.cache.delete(`teamMembers:${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error removing team member:`, error);
      this.logError(error, 'removeTeamMember');
      throw new Error(`Failed to remove team member: ${createErrorMessage(error)}`);
    }
  }

  async getTeamMetrics(id) {
    const cacheKey = `teamMetrics:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching metrics for team ${id}...`);
      const response = await api.get(`/teams/${id}/metrics`);
      console.log('✅ Team metrics fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team metrics ${id}:`, error);
      this.logError(error, 'getTeamMetrics');
      throw new Error(`Failed to fetch team metrics: ${createErrorMessage(error)}`);
    }
  }

  async getTeamVelocity(id) {
    const cacheKey = `teamVelocity:${id}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📡 Fetching velocity for team ${id}...`);
      const response = await api.get(`/teams/${id}/velocity`);
      console.log('✅ Team velocity fetched:', response.data);
      this.setCachedData(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching team velocity ${id}:`, error);
      this.logError(error, 'getTeamVelocity');
      throw new Error(`Failed to fetch team velocity: ${createErrorMessage(error)}`);
    }
  }

  async refreshTeamCache(id) {
    try {
      this.cache.delete('allTeams');
      this.cache.delete(`team:${id}`);
      this.cache.delete(`teamMembers:${id}`);
      this.cache.delete(`teamMetrics:${id}`);
      this.cache.delete(`teamVelocity:${id}`);
      
      await this.getTeam(id);
      return true;
    } catch (error) {
      this.logError(error, 'refreshTeamCache');
      throw new Error(`Failed to refresh team cache: ${createErrorMessage(error)}`);
    }
  }
}

export default new TeamService(); 