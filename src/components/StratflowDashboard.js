import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Timeline,
  Assignment,
  Group,
  TrendingUp,
  BugReport,
  Task,
  PersonAdd,
  Edit,
  Delete,
  AdminPanelSettings,
  PlayArrow,
  CheckCircle,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  Tooltip as ChartTooltip,
  ArcElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { projectService } from '../services/projectService';
import teamService from '../services/teamService';
import sprintService from '../services/sprintService';
import storyService from '../services/storyService';
import taskService from '../services/taskService';
import defectService from '../services/defectService';
import { userService } from '../services/userService';
import { Link as RouterLink } from 'react-router-dom';
import apiHealthService from '../services/apiHealthService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Legend,
  ChartTooltip,
  ArcElement
);

const StratflowDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [sprints, setSprints] = useState([]);
  const mountedRef = useRef(false);
  const [projectMetrics, setProjectMetrics] = useState({
    total: 0,
    active: 0,
    completed: 0,
    onHold: 0,
  });
  const [teamMetrics, setTeamMetrics] = useState({
    totalTeams: 0,
    totalMembers: 0,
  });
  const [upcomingSprints, setUpcomingSprints] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTeams: 0,
    activeSprints: 0,
    totalStories: 0,
    totalTasks: 0,
    totalDefects: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [velocityData, setVelocityData] = useState({
    labels: [],
    datasets: [],
  });
  const [backlogMetrics, setBacklogMetrics] = useState({
    stories: {
      total: 0,
      byStatus: {},
      byType: {},
    },
    tasks: {
      total: 0,
      byStatus: {},
      byPriority: {},
    },
    defects: {
      total: 0,
      bySeverity: {},
      byStatus: {},
    },
  });
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [openAddMemberDialog, setOpenAddMemberDialog] = useState(false);
  const [openUserManagementDialog, setOpenUserManagementDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'USER',
    title: '',
    department: '',
  });
  const [editingUser, setEditingUser] = useState(null);
  const [openNewTeamDialog, setOpenNewTeamDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    capacity: 5,
    status: 'ACTIVE',
  });
  
  // Sprint Management state
  const [openSprintManagementDialog, setOpenSprintManagementDialog] = useState(false);
  const [openNewSprintDialog, setOpenNewSprintDialog] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [newSprint, setNewSprint] = useState({
    name: '',
    project: '',
    goal: '',
    status: 'PLANNING',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    capacity: 10
  });
  const [projects, setProjects] = useState([]);
  
  const [apiHealth, setApiHealth] = useState({});
  const [showApiStatus, setShowApiStatus] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  useEffect(() => {
    // Prevent duplicate API calls in StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;
    
    // Check API health first to identify which endpoints are implemented
    const checkApiHealth = async () => {
      console.group('🔍 API Health Check');
      console.log('Checking API endpoint health...');
      
      const endpoints = [
        '/projects',
        '/teams',
        '/sprints',
        '/stories',
        '/tasks',
        '/defects'
      ];
      
      const healthResults = await apiHealthService.checkMultipleEndpoints(endpoints);
      apiHealthService.logApiHealthSummary(healthResults);
      
      setApiHealth(healthResults);
      console.groupEnd();
      
      // Continue with data fetching
      fetchDashboardData(healthResults);
    };
    
    const fetchDashboardData = async (healthStatus) => {
      console.group('📊 StratFlow Dashboard - Data Fetching');
      console.time('dashboardDataFetch');
      
      setLoading(true);
      
      // Create data containers
      let projects = [], teams = [], sprints = [], stories = [], tasks = [], defects = [];
      let apiStatus = {
        projects: { success: false, error: null, count: 0 },
        teams: { success: false, error: null, count: 0 },
        sprints: { success: false, error: null, count: 0 },
        stories: { success: false, error: null, count: 0 },
        tasks: { success: false, error: null, count: 0 },
        defects: { success: false, error: null, count: 0 }
      };

      // Modify the fetchWithRetry function to check for CORS unknown status
      const fetchWithRetry = async (fetchFn, entityName, maxRetries = 2, retryDelay = 1000) => {
        // Skip fetch if we already know the endpoint doesn't exist
        const endpoint = `/${entityName}`;
        const healthResult = healthStatus[endpoint];
        
        // If health check returned definitively unavailable (not just CORS unknown)
        if (healthResult && healthResult.available === false) {
          console.warn(`⚠️ Skipping ${entityName} fetch - endpoint not implemented`);
          return [];
        }
        
        // If health status is unknown due to CORS, we'll try anyway
        if (healthResult && healthResult.available === null) {
          console.warn(`⚠️ ${entityName} status unknown due to CORS - attempting fetch anyway`);
        }

        let retries = 0;
        let lastError = null;
        
        while (retries <= maxRetries) {
          try {
            const startTime = performance.now();
            const data = await fetchFn();
            const endTime = performance.now();
            
            console.log(`✅ ${entityName} fetched successfully in ${Math.round(endTime - startTime)}ms`);
            apiStatus[entityName] = { success: true, error: null, count: data.length };
            return data;
          } catch (error) {
            lastError = error;
            
            // Don't retry 404 errors - these mean the endpoint doesn't exist
            if (error.response?.status === 404) {
              console.warn(`⚠️ ${entityName} endpoint returned 404 - Not implemented yet`);
              break;
            }
            
            // Don't retry unauthorized errors
            if (error.response?.status === 401 || error.response?.status === 403) {
              console.error(`❌ ${entityName} fetch failed: Authentication error`);
              break;
            }
            
            retries++;
            if (retries <= maxRetries) {
              console.warn(`⚠️ ${entityName} fetch attempt ${retries} failed, retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }
        
        if (lastError) {
          console.error(`❌ Failed to fetch ${entityName} after ${retries} attempts:`, lastError);
          apiStatus[entityName] = { success: false, error: lastError, count: 0 };
        }
        
        return [];
      };

      // Fetch core data first - projects and teams
      console.group('📊 Fetching Core Data');
      console.time('coreDataFetch');
      
      // Projects
      projects = await fetchWithRetry(
        () => projectService.getAllProjects(),
        'projects'
      );
      console.log(`📋 Loaded ${projects.length} projects`);
      
      // Store projects in state for sprint management
      setProjects(projects);
      
      // Teams
      teams = await fetchWithRetry(
        () => teamService.getAllTeams(),
        'teams'
      );
      console.log(`👥 Loaded ${teams.length} teams`);
      
      // Only try to fetch sprints if we have projects
      if (projects.length > 0) {
        sprints = await fetchWithRetry(
          () => sprintService.getAllSprints(),
          'sprints'
        );
        console.log(`🏃‍♂️ Loaded ${sprints.length} sprints`);
        
        // Store sprints in state for management
        setSprints(sprints);
      } else {
        console.warn('⚠️ Skipping sprint fetch - no projects available');
      }
      
      console.timeEnd('coreDataFetch');
      console.groupEnd(); // Core data fetching

      // Process core data
      // Calculate project metrics
      const projectMetricsData = {
        total: projects.length,
        active: projects.filter(p => p.status === 'Active').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        onHold: projects.filter(p => p.status === 'On Hold').length,
      };
      setProjectMetrics(projectMetricsData);

      // Calculate team metrics
      const teamMetricsData = {
        totalTeams: teams.length,
        totalMembers: teams.reduce((total, team) => total + (team.members?.length || 0), 0),
        activeTeams: teams.filter(t => t.status === 'Active').length,
      };
      setTeamMetrics(teamMetricsData);

      // Update metrics with project and team data
      setMetrics(prev => ({
        ...prev,
        totalProjects: projects.length,
        activeProjects: projectMetricsData.active,
        totalTeams: teams.length,
        completedProjects: projectMetricsData.completed,
      }));

      // Calculate project progress
      if (projects.length > 0) {
        const progressData = projects.map(project => ({
          name: project.name || 'Unnamed Project',
          completed: project.progress || 0,
          remaining: 100 - (project.progress || 0),
        }));
        setProjectProgress(progressData);

        // Set recent projects with safe date handling
        const sortedProjects = [...projects]
          .filter(p => p && p.createdAt) // Only include projects with valid dates
          .sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) ? 0 : dateB - dateA;
          })
          .slice(0, 5);
        setRecentProjects(sortedProjects);
      }

      // Calculate upcoming sprints
      if (sprints.length > 0) {
        const upcomingSprintsData = sprints
          .filter(sprint => {
            const startDate = new Date(sprint.startDate);
            return !isNaN(startDate.getTime()) && startDate >= new Date();
          })
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 5)
          .map(sprint => ({
            ...sprint,
            projectName: projects.find(p => p.id === sprint.projectId)?.name || 'Unknown Project'
          }));
        
        setUpcomingSprints(upcomingSprintsData);
      }

      // Fetch backlog data - these endpoints might not exist yet
      console.group('📊 Fetching Backlog Data');
      console.time('backlogDataFetch');
      
      // Stories
      stories = await fetchWithRetry(
        () => storyService.getAllStories(),
        'stories'
      );
      console.log(`📃 Loaded ${stories.length} stories`);
      
      // Tasks
      tasks = await fetchWithRetry(
        () => taskService.getAllTasks(),
        'tasks'
      );
      console.log(`✓ Loaded ${tasks.length} tasks`);
      
      // Defects
      defects = await fetchWithRetry(
        () => defectService.getAllDefects(),
        'defects'
      );
      console.log(`🐞 Loaded ${defects.length} defects`);
      
      console.timeEnd('backlogDataFetch');
      console.groupEnd(); // Backlog data fetching

      // Calculate backlog metrics if we have any data
      const backlogMetricsData = {
        stories: {
          total: stories.length,
          byStatus: stories.reduce((acc, story) => {
            acc[story.status] = (acc[story.status] || 0) + 1;
            return acc;
          }, {}),
          byType: stories.reduce((acc, story) => {
            acc[story.type] = (acc[story.type] || 0) + 1;
            return acc;
          }, {}),
        },
        tasks: {
          total: tasks.length,
          byStatus: tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
          }, {}),
          byPriority: tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
          }, {}),
        },
        defects: {
          total: defects.length,
          bySeverity: defects.reduce((acc, defect) => {
            acc[defect.severity] = (acc[defect.severity] || 0) + 1;
            return acc;
          }, {}),
          byStatus: defects.reduce((acc, defect) => {
            acc[defect.status] = (acc[defect.status] || 0) + 1;
            return acc;
          }, {}),
        },
      };
      setBacklogMetrics(backlogMetricsData);

      // Update overall metrics
      setMetrics(prev => ({
        ...prev,
        totalStories: stories.length,
        totalTasks: tasks.length,
        totalDefects: defects.length,
        activeSprints: sprints.filter(s => 
          s.status === 'ACTIVE' || 
          s.status === 'Active' || 
          s.status === 'IN_PROGRESS' || 
          s.status === 'In Progress'
        ).length,
      }));

      // Print API Status Summary
      console.group('📊 API Status Summary');
      Object.entries(apiStatus).forEach(([entityName, status]) => {
        if (status.success) {
          console.log(`✅ ${entityName}: ${status.count} items`);
        } else {
          console.warn(`❌ ${entityName}: Failed to load`);
          if (status.error?.response?.status === 404) {
            console.warn(`   - Reason: API endpoint not implemented (404)`);
          } else if (status.error) {
            console.warn(`   - Error: ${status.error.message}`);
          }
        }
      });
      console.groupEnd(); // API Status Summary

      setLoading(false);
      console.timeEnd('dashboardDataFetch');
      console.groupEnd(); // Dashboard Data Fetching
    };

    checkApiHealth();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        setUsers(response);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  const getStatusColor = (status) => {
    // Normalize status to uppercase for consistent matching
    const normalizedStatus = status?.toUpperCase();
    
    const statusColors = {
      ACTIVE: 'success',
      COMPLETED: 'default',
      ON_HOLD: 'warning',
      CANCELLED: 'error',
      PLANNED: 'info',
      IN_PROGRESS: 'primary',
    };
    
    return statusColors[normalizedStatus] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Highest': 'error',
      'High': 'warning',
      'Medium': 'primary',
      'Low': 'info',
      'Lowest': 'default',
    };
    return colors[priority] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': 'error',
      'High': 'error',
      'Medium': 'warning',
      'Low': 'info',
    };
    return colors[severity] || 'default';
  };

  const handleAddTeamMember = async (teamId, userId) => {
    try {
      await teamService.addTeamMember(teamId, {
        userId,
        role: 'TEAM_MEMBER',
        joinedAt: new Date().toISOString(),
      });
      toast.success('Team member added successfully');
      setOpenAddMemberDialog(false);
      // Refresh team data
      const updatedTeam = await teamService.getTeam(teamId);
      setSelectedTeam(updatedTeam);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
    }
  };

  const handleCreateUser = async () => {
    try {
      await userService.createUser(newUser);
      toast.success('User created successfully');
      setOpenUserManagementDialog(false);
      setNewUser({
        username: '',
        email: '',
        role: 'USER',
        title: '',
        department: '',
      });
      // Refresh users list
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await userService.updateUser(editingUser._id, editingUser);
      toast.success('User updated successfully');
      setOpenUserManagementDialog(false);
      setEditingUser(null);
      // Refresh users list
      const updatedUsers = await userService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('User deleted successfully');
        // Refresh users list
        const updatedUsers = await userService.getAllUsers();
        setUsers(updatedUsers);
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleCreateTeam = async () => {
    try {
      if (!newTeam.name) {
        toast.error('Team name is required');
        return;
      }

      const response = await teamService.createTeam(newTeam);
      setTeams([...teams, response]);
      setOpenNewTeamDialog(false);
      setNewTeam({
        name: '',
        description: '',
        capacity: 5,
        status: 'ACTIVE',
      });
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const handleEditTeam = async (team) => {
    try {
      const updatedTeam = await teamService.updateTeam(team.id, {
        ...team,
        updatedAt: new Date().toISOString(),
      });
      setTeams(teams.map(t => t.id === team.id ? updatedTeam : t));
      toast.success('Team updated successfully!');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  // Add a new method to render the API health status dialog
  const renderApiStatusDialog = () => {
    return (
      <Dialog 
        open={showApiStatus} 
        onClose={() => setShowApiStatus(false)}
        maxWidth="md"
      >
        <DialogTitle>API Endpoint Status</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Note:</strong> CORS restrictions may prevent accurate status checks in development environment.
              The actual backend features might be available despite showing as "Unknown" here.
            </Typography>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Endpoint</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(apiHealth).map(([endpoint, status]) => (
                  <TableRow key={endpoint}>
                    <TableCell>{endpoint}</TableCell>
                    <TableCell>
                      {status.available === true ? (
                        <Chip
                          label="Available"
                          color="success"
                          size="small"
                        />
                      ) : status.available === null ? (
                        <Chip
                          label="Unknown"
                          color="warning"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Not Implemented"
                          color="error"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {status.available !== true && status.error && status.error.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiStatus(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  const handleOpenSprintManagement = () => {
    setOpenSprintManagementDialog(true);
  };

  const handleCloseSprintManagement = () => {
    setOpenSprintManagementDialog(false);
  };

  const handleOpenNewSprint = () => {
    setNewSprint({
      name: '',
      project: projects.length > 0 ? projects[0]._id : '',
      goal: '',
      status: 'PLANNING',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      capacity: 10
    });
    setOpenNewSprintDialog(true);
  };

  const handleCloseNewSprint = () => {
    setOpenNewSprintDialog(false);
  };

  const handleSprintChange = (e) => {
    const { name, value } = e.target;
    setNewSprint(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSprint = async () => {
    try {
      // Validate required fields
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Missing required fields');
        return;
      }

      const response = await sprintService.createSprint(newSprint);
      
      setSprints(prev => [...prev, response]);
      toast.success('Sprint created successfully');
      handleCloseNewSprint();
      
      // Refresh the data
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);
      
      // Update metrics for active sprints
      setMetrics(prev => ({
        ...prev,
        activeSprints: updatedSprints.filter(s => 
          s.status === 'ACTIVE' || 
          s.status === 'Active' || 
          s.status === 'IN_PROGRESS' || 
          s.status === 'In Progress'
        ).length,
      }));
    } catch (error) {
      console.error('Failed to create sprint:', error);
      toast.error(`Failed to create sprint: ${error.message}`);
    }
  };

  const handleEditSprint = (sprint) => {
    setEditingSprint(sprint);
    setNewSprint({
      name: sprint.name,
      project: sprint.project,
      goal: sprint.goal || '',
      status: sprint.status,
      startDate: new Date(sprint.startDate).toISOString().split('T')[0],
      endDate: new Date(sprint.endDate).toISOString().split('T')[0],
      capacity: sprint.capacity || 10
    });
    setOpenNewSprintDialog(true);
  };

  const handleUpdateSprint = async () => {
    try {
      // Validate required fields
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Missing required fields');
        return;
      }

      const response = await sprintService.updateSprint(editingSprint.id, newSprint);
      
      setSprints(prev => prev.map(s => s.id === editingSprint.id ? response : s));
      toast.success('Sprint updated successfully');
      setEditingSprint(null);
      handleCloseNewSprint();
      
      // Refresh the data
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);
      
      // Update metrics for active sprints
      setMetrics(prev => ({
        ...prev,
        activeSprints: updatedSprints.filter(s => 
          s.status === 'ACTIVE' || 
          s.status === 'Active' || 
          s.status === 'IN_PROGRESS' || 
          s.status === 'In Progress'
        ).length,
      }));
    } catch (error) {
      console.error('Failed to update sprint:', error);
      toast.error(`Failed to update sprint: ${error.message}`);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await sprintService.deleteSprint(sprintId);
      
      setSprints(prev => prev.filter(s => s.id !== sprintId));
      toast.success('Sprint deleted successfully');
      
      // Update metrics for active sprints
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          (s.id !== sprintId) && (
            s.status === 'ACTIVE' || 
            s.status === 'Active' || 
            s.status === 'IN_PROGRESS' || 
            s.status === 'In Progress'
          )
        ).length,
      }));
    } catch (error) {
      console.error('Failed to delete sprint:', error);
      toast.error(`Failed to delete sprint: ${error.message}`);
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      const sprint = sprints.find(s => s.id === sprintId);
      const updatedSprint = {
        ...sprint,
        status: 'ACTIVE'
      };
      
      const response = await sprintService.updateSprint(sprintId, updatedSprint);
      
      setSprints(prev => prev.map(s => s.id === sprintId ? response : s));
      toast.success('Sprint started successfully');
      
      // Update metrics for active sprints
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          (s.id === sprintId) || (
            s.status === 'ACTIVE' || 
            s.status === 'Active' || 
            s.status === 'IN_PROGRESS' || 
            s.status === 'In Progress'
          )
        ).length,
      }));
    } catch (error) {
      console.error('Failed to start sprint:', error);
      toast.error(`Failed to start sprint: ${error.message}`);
    }
  };

  const handleCompleteSprint = async (sprintId) => {
    try {
      const sprint = sprints.find(s => s.id === sprintId);
      const updatedSprint = {
        ...sprint,
        status: 'COMPLETED',
        completedDate: new Date().toISOString()
      };
      
      const response = await sprintService.updateSprint(sprintId, updatedSprint);
      
      setSprints(prev => prev.map(s => s.id === sprintId ? response : s));
      toast.success('Sprint completed successfully');
      
      // Update metrics for active sprints
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          (s.id !== sprintId) && (
            s.status === 'ACTIVE' || 
            s.status === 'Active' || 
            s.status === 'IN_PROGRESS' || 
            s.status === 'In Progress'
          )
        ).length,
      }));
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      toast.error(`Failed to complete sprint: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" gutterBottom>
          StratFlow Dashboard
        </Typography>

        {/* Overview Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Projects
                </Typography>
                <Typography variant="h4">{metrics.totalProjects}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Teams
                </Typography>
                <Typography variant="h4">{metrics.totalTeams}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Sprints
                </Typography>
                <Typography variant="h4">{metrics.activeSprints}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Members
                </Typography>
                <Typography variant="h4">{teamMetrics.totalMembers}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Group />}
                onClick={() => setOpenUserManagementDialog(true)}
              >
                User Management
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Group />}
                onClick={() => setOpenNewTeamDialog(true)}
              >
                Team Management
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Timeline />}
                onClick={handleOpenSprintManagement}
              >
                Sprint Management
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<AdminPanelSettings />}
                onClick={() => setShowApiStatus(true)}
              >
                API Status
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Backlog Overview */}
        <Typography variant="h5" sx={{ mb: 2 }}>Backlog Overview</Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1 }} />
                  <Typography variant="h6">Stories</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.stories.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Status</Typography>
                {Object.entries(backlogMetrics.stories.byStatus).map(([status, count]) => (
                  <Box key={status} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={status}
                      size="small"
                      color={getStatusColor(status)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Task sx={{ mr: 1 }} />
                  <Typography variant="h6">Tasks</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.tasks.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Priority</Typography>
                {Object.entries(backlogMetrics.tasks.byPriority).map(([priority, count]) => (
                  <Box key={priority} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={priority}
                      size="small"
                      color={getPriorityColor(priority)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BugReport sx={{ mr: 1 }} />
                  <Typography variant="h6">Defects</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 2 }}>{backlogMetrics.defects.total}</Typography>
                <Typography variant="subtitle2" color="textSecondary">By Severity</Typography>
                {Object.entries(backlogMetrics.defects.bySeverity).map(([severity, count]) => (
                  <Box key={severity} sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Chip
                      label={severity}
                      size="small"
                      color={getSeverityColor(severity)}
                      sx={{ minWidth: 100 }}
                    />
                    <Typography>{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Project and Team Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Project Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="primary">
                      {projectMetrics?.total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Projects
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Active: {projectMetrics?.active || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.active || 0) / (projectMetrics?.total || 1)) * 100}
                        color="success"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        Completed: {projectMetrics?.completed || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.completed || 0) / (projectMetrics?.total || 1)) * 100}
                        color="info"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2">
                        On Hold: {projectMetrics?.onHold || 0}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={((projectMetrics?.onHold || 0) / (projectMetrics?.total || 1)) * 100}
                        color="warning"
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Overview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="primary">
                      {teamMetrics?.totalTeams || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Teams
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h3" color="secondary">
                      {teamMetrics?.totalMembers || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Project Progress Chart */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Project Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              {projectProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectProgress}
                    stackOffset="expand"
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="completed" stackId="a" fill="#2563eb" name="Completed" />
                    <Bar dataKey="remaining" stackId="a" fill="#e5e7eb" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography color="text.secondary">No progress data available</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Upcoming Sprints */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Sprints
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Sprint</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {upcomingSprints.length > 0 ? (
                    upcomingSprints.map((sprint) => (
                      <TableRow key={sprint.id}>
                        <TableCell>{sprint.name}</TableCell>
                        <TableCell>{sprint.projectName}</TableCell>
                        <TableCell>
                          {formatDate(sprint.startDate)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sprint.status}
                            color={getStatusColor(sprint.status)}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No upcoming sprints
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Metrics Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Assignment sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Projects</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalProjects}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {metrics.activeProjects} Active Projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Group sx={{ mr: 1 }} />
                  <Typography variant="h6">Teams</Typography>
                </Box>
                <Typography variant="h4">{metrics.totalTeams}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Across all projects
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Timeline sx={{ mr: 1 }} />
                  <Typography variant="h6">Active Sprints</Typography>
                </Box>
                <Typography variant="h4">{metrics.activeSprints}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently in progress
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  <Typography variant="h6">Velocity</Typography>
                </Box>
                <Typography variant="h4">
                  {velocityData.datasets[0]?.data.slice(-1)[0] || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Points in last sprint
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Velocity Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Team Velocity Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                  <Line
                    data={velocityData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Projects */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Recent Projects
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Project</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>{project.name || 'Unnamed Project'}</TableCell>
                          <TableCell>
                            <Chip
                              label={project.status || 'Unknown'}
                              size="small"
                              color={getStatusColor(project.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(project.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Team Management Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Team Management</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAdd />}
                    onClick={() => setOpenNewTeamDialog(true)}
                  >
                    Create New Team
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Team Name</TableCell>
                        <TableCell>Members</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell>{team.name}</TableCell>
                          <TableCell>
                            {team.members?.map((member) => (
                              <Chip
                                key={member.id}
                                label={member.name}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={team.status}
                              color={team.status === 'ACTIVE' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit Team">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setOpenNewTeamDialog(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Add Member">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setOpenAddMemberDialog(true);
                                }}
                              >
                                <PersonAdd />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Management Section */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">User Management</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AdminPanelSettings />}
                    onClick={() => setOpenUserManagementDialog(true)}
                  >
                    Manage Users
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.title}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setEditingUser(user);
                                  setOpenUserManagementDialog(true);
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Add Team Member Dialog */}
        <Dialog open={openAddMemberDialog} onClose={() => setOpenAddMemberDialog(false)}>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedTeam?.selectedUserId || ''}
                onChange={(e) => setSelectedTeam({ ...selectedTeam, selectedUserId: e.target.value })}
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.username} - {user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddMemberDialog(false)}>Cancel</Button>
            <Button
              onClick={() => handleAddTeamMember(selectedTeam.id, selectedTeam.selectedUserId)}
              variant="contained"
              color="primary"
            >
              Add Member
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Management Dialog */}
        <Dialog open={openUserManagementDialog} onClose={() => setOpenUserManagementDialog(false)}>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Username"
              value={editingUser ? editingUser.username : newUser.username}
              onChange={(e) => {
                if (editingUser) {
                  setEditingUser({ ...editingUser, username: e.target.value });
                } else {
                  setNewUser({ ...newUser, username: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editingUser ? editingUser.email : newUser.email}
              onChange={(e) => {
                if (editingUser) {
                  setEditingUser({ ...editingUser, email: e.target.value });
                } else {
                  setNewUser({ ...newUser, email: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={editingUser ? editingUser.role : newUser.role}
                onChange={(e) => {
                  if (editingUser) {
                    setEditingUser({ ...editingUser, role: e.target.value });
                  } else {
                    setNewUser({ ...newUser, role: e.target.value });
                  }
                }}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MANAGER">Manager</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Title"
              value={editingUser ? editingUser.title : newUser.title}
              onChange={(e) => {
                if (editingUser) {
                  setEditingUser({ ...editingUser, title: e.target.value });
                } else {
                  setNewUser({ ...newUser, title: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Department"
              value={editingUser ? editingUser.department : newUser.department}
              onChange={(e) => {
                if (editingUser) {
                  setEditingUser({ ...editingUser, department: e.target.value });
                } else {
                  setNewUser({ ...newUser, department: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUserManagementDialog(false)}>Cancel</Button>
            <Button
              onClick={editingUser ? handleUpdateUser : handleCreateUser}
              variant="contained"
              color="primary"
            >
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Team Dialog */}
        <Dialog open={openNewTeamDialog} onClose={() => setOpenNewTeamDialog(false)}>
          <DialogTitle>
            {selectedTeam ? 'Edit Team' : 'Create New Team'}
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Team Name"
              value={selectedTeam ? selectedTeam.name : newTeam.name}
              onChange={(e) => {
                if (selectedTeam) {
                  setSelectedTeam({ ...selectedTeam, name: e.target.value });
                } else {
                  setNewTeam({ ...newTeam, name: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={selectedTeam ? selectedTeam.description : newTeam.description}
              onChange={(e) => {
                if (selectedTeam) {
                  setSelectedTeam({ ...selectedTeam, description: e.target.value });
                } else {
                  setNewTeam({ ...newTeam, description: e.target.value });
                }
              }}
              sx={{ mt: 2 }}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedTeam ? selectedTeam.status : newTeam.status}
                onChange={(e) => {
                  if (selectedTeam) {
                    setSelectedTeam({ ...selectedTeam, status: e.target.value });
                  } else {
                    setNewTeam({ ...newTeam, status: e.target.value });
                  }
                }}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="ON_HOLD">On Hold</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenNewTeamDialog(false);
              setSelectedTeam(null);
              setNewTeam({
                name: '',
                description: '',
                capacity: 5,
                status: 'ACTIVE',
              });
            }}>
              Cancel
            </Button>
            <Button
              onClick={selectedTeam ? () => handleEditTeam(selectedTeam) : handleCreateTeam}
              variant="contained"
              color="primary"
            >
              {selectedTeam ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* API Status Dialog */}
        {renderApiStatusDialog()}

        {/* Sprint Management Dialog */}
        <Dialog
          open={openSprintManagementDialog}
          onClose={handleCloseSprintManagement}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Sprint Management
            <Box sx={{ float: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PersonAdd />}
                onClick={handleOpenNewSprint}
              >
                New Sprint
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sprints.length > 0 ? (
                    sprints.map((sprint) => (
                      <TableRow key={sprint.id}>
                        <TableCell>{sprint.name}</TableCell>
                        <TableCell>
                          {projects.find(p => p._id === sprint.project)?.name || 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sprint.status}
                            color={getStatusColor(sprint.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(sprint.startDate)}</TableCell>
                        <TableCell>{formatDate(sprint.endDate)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditSprint(sprint)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteSprint(sprint.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                          {(sprint.status === 'PLANNING' || sprint.status === 'Planning') && (
                            <Tooltip title="Start Sprint">
                              <IconButton
                                size="small"
                                onClick={() => handleStartSprint(sprint.id)}
                                color="success"
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(sprint.status === 'ACTIVE' || sprint.status === 'Active' || 
                            sprint.status === 'IN_PROGRESS' || sprint.status === 'In Progress') && (
                            <Tooltip title="Complete Sprint">
                              <IconButton
                                size="small"
                                onClick={() => handleCompleteSprint(sprint.id)}
                                color="info"
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No sprints found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSprintManagement}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* New Sprint Dialog */}
        <Dialog
          open={openNewSprintDialog}
          onClose={handleCloseNewSprint}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingSprint ? 'Edit Sprint' : 'Create New Sprint'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Sprint Name"
                name="name"
                value={newSprint.name}
                onChange={handleSprintChange}
                margin="normal"
                required
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Project</InputLabel>
                <Select
                  name="project"
                  value={newSprint.project}
                  onChange={handleSprintChange}
                >
                  {projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Goal"
                name="goal"
                value={newSprint.goal}
                onChange={handleSprintChange}
                margin="normal"
                multiline
                rows={2}
              />
              
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newSprint.status}
                  onChange={handleSprintChange}
                >
                  <MenuItem value="PLANNING">Planning</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={newSprint.startDate}
                    onChange={handleSprintChange}
                    margin="normal"
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    name="endDate"
                    type="date"
                    value={newSprint.endDate}
                    onChange={handleSprintChange}
                    margin="normal"
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Capacity (Story Points)"
                name="capacity"
                type="number"
                value={newSprint.capacity}
                onChange={handleSprintChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseNewSprint}>Cancel</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={editingSprint ? handleUpdateSprint : handleCreateSprint}
            >
              {editingSprint ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default StratflowDashboard; 