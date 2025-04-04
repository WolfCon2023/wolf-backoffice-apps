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
  useTheme,
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
  PlayArrow,
  CheckCircle,
  AddCircleOutline,
  People,
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
import { storyService } from '../services/storyService';
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
      PLANNING: 'info',
      CLOSED: 'default'
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
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.group('📊 Dashboard Data Fetching');
    console.log('Starting data fetch...');
    
    try {
      setLoading(true);

      // Fetch all data in parallel with individual error handling
      const [projectsData, teamsData, sprintsData, storiesData, tasksData, defectsData, usersData] = await Promise.allSettled([
        projectService.getAllProjects().catch(err => {
          console.warn('Failed to fetch projects:', err);
          return [];
        }),
        teamService.getAllTeams().catch(err => {
          console.warn('Failed to fetch teams:', err);
          return [];
        }),
        sprintService.getAllSprints().catch(err => {
          console.warn('Failed to fetch sprints:', err);
          return [];
        }),
        storyService.getAllStories().catch(err => {
          console.warn('Failed to fetch stories:', err);
          return [];
        }),
        taskService.getAllTasks().catch(err => {
          console.warn('Failed to fetch tasks:', err);
          return [];
        }),
        defectService.getAllDefects().catch(err => {
          console.warn('Failed to fetch defects:', err);
          return [];
        }),
        userService.getAllUsers().catch(err => {
          console.warn('Failed to fetch users:', err);
          return [];
        })
      ]);

      // Extract values from Promise.allSettled results
      const [
        projects,
        teams,
        sprints,
        stories,
        tasks,
        defects,
        users
      ] = [
        projectsData.value || [],
        teamsData.value || [],
        sprintsData.value || [],
        storiesData.value || [],
        tasksData.value || [],
        defectsData.value || [],
        usersData.value || []
      ];

      console.log('✅ Data fetched:', {
        projects: projects.length,
        teams: teams.length,
        sprints: sprints.length,
        stories: stories.length,
        tasks: tasks.length,
        defects: defects.length,
        users: users.length
      });

      // Update state with fetched data
      setProjects(projects);
      setTeams(teams);
      setSprints(sprints);
      setUsers(users);

      // Calculate metrics
      const activeProjectsCount = projects.filter(p => p.status === 'ACTIVE').length;
      const activeSprintsCount = sprints.filter(s => 
        s.status === 'ACTIVE' || 
        s.status === 'IN_PROGRESS'
      ).length;

      setMetrics({
        totalProjects: projects.length,
        activeProjects: activeProjectsCount,
        totalTeams: teams.length,
        activeSprints: activeSprintsCount,
        totalStories: stories.length,
        totalTasks: tasks.length,
        totalDefects: defects.length
      });

      // Calculate backlog metrics
      const backlogData = {
        stories: {
          total: stories.length,
          byStatus: groupByStatus(stories),
          byType: groupByType(stories)
        },
        tasks: {
          total: tasks.length,
          byStatus: groupByStatus(tasks),
          byPriority: groupByPriority(tasks)
        },
        defects: {
          total: defects.length,
          bySeverity: groupBySeverity(defects),
          byStatus: groupByStatus(defects)
        }
      };

      setBacklogMetrics(backlogData);

      // Calculate project progress
      const progressData = projects.map(project => {
        const projectTasks = tasks.filter(task => task.project === project._id);
        const projectDefects = defects.filter(defect => defect.projectId === project._id);
        const projectStories = stories.filter(story => story.project === project._id);

        const totalItems = projectTasks.length + projectDefects.length + projectStories.length;
        const completedItems = [
          ...projectTasks.filter(task => task.status === 'COMPLETED'),
          ...projectDefects.filter(defect => defect.status === 'CLOSED'),
          ...projectStories.filter(story => story.status === 'COMPLETED')
        ].length;

        return {
          name: project.name,
          progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
        };
      });

      setProjectProgress(progressData);

      // Set team metrics
      setTeamMetrics({
        totalTeams: teams.length,
        totalMembers: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)
      });

      // Set project metrics
      setProjectMetrics({
        total: projects.length,
        active: projects.filter(p => p.status === 'ACTIVE').length,
        completed: projects.filter(p => p.status === 'COMPLETED').length,
        onHold: projects.filter(p => p.status === 'ON_HOLD').length
      });

      // Set upcoming sprints
      const upcomingSprints = sprints
        .filter(sprint => 
          sprint.status === 'PLANNING' || 
          sprint.status === 'ACTIVE' || 
          sprint.status === 'IN_PROGRESS'
        )
        .map(sprint => ({
          ...sprint,
          projectName: projects.find(p => p._id === sprint.project)?.name || 'Unknown Project'
        }))
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .slice(0, 5);

      setUpcomingSprints(upcomingSprints);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load some dashboard data');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const groupByStatus = (items) => {
    return items?.reduce((acc, item) => {
      const status = item.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};
  };

  const groupByType = (items) => {
    return items?.reduce((acc, item) => {
      const type = item.type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};
  };

  const groupByPriority = (items) => {
    return items?.reduce((acc, item) => {
      const priority = item.priority || 'MEDIUM';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {}) || {};
  };

  const groupBySeverity = (items) => {
    return items?.reduce((acc, item) => {
      const severity = item.severity || 'MEDIUM';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {}) || {};
  };

  // Add missing user management functions
  const handleCreateUser = async () => {
    try {
      const response = await userService.createUser(newUser);
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

  // Add missing team management functions
  const handleAddTeamMember = async (teamId, userId) => {
    try {
      if (!teamId || !userId) {
        console.error('Missing required parameters:', { teamId, userId });
        toast.error('Missing required parameters');
        return;
      }

      await teamService.addTeamMember(teamId, {
        userId,
        role: 'TEAM_MEMBER',
        joinedAt: new Date().toISOString(),
      });
      
      toast.success('Team member added successfully');
      setOpenAddMemberDialog(false);
      
      // Refresh team data
      const updatedTeamData = await teamService.getTeam(teamId);
      setSelectedTeam(updatedTeamData);
      
      // Refresh teams list
      const updatedTeams = await teamService.getAllTeams();
      setTeams(updatedTeams);
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Failed to add team member');
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
      setOpenNewTeamDialog(false);
      setSelectedTeam(null);
      toast.success('Team updated successfully!');
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  // Add sprint management functions
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
    setEditingSprint(null);
    setNewSprint({
      name: '',
      project: '',
      goal: '',
      status: 'PLANNING',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      capacity: 10
    });
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
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Missing required fields');
        return;
      }

      const response = await sprintService.createSprint(newSprint);
      setSprints(prev => [...prev, response]);
      toast.success('Sprint created successfully');
      handleCloseNewSprint();

      // Refresh sprints
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeSprints: updatedSprints.filter(s => 
          s.status === 'ACTIVE' || 
          s.status === 'IN_PROGRESS'
        ).length
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
      if (!newSprint.name || !newSprint.project || !newSprint.startDate || !newSprint.endDate) {
        toast.error('Missing required fields');
        return;
      }

      const response = await sprintService.updateSprint(editingSprint.id, newSprint);
      setSprints(prev => prev.map(s => s.id === editingSprint.id ? response : s));
      toast.success('Sprint updated successfully');
      handleCloseNewSprint();

      // Refresh sprints
      const updatedSprints = await sprintService.getAllSprints();
      setSprints(updatedSprints);
    } catch (error) {
      console.error('Failed to update sprint:', error);
      toast.error(`Failed to update sprint: ${error.message}`);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    if (!window.confirm('Are you sure you want to delete this sprint?')) {
      return;
    }

    try {
      await sprintService.deleteSprint(sprintId);
      setSprints(prev => prev.filter(s => s.id !== sprintId));
      toast.success('Sprint deleted successfully');

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          s.id !== sprintId && (
            s.status === 'ACTIVE' || 
            s.status === 'IN_PROGRESS'
          )
        ).length
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
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          s.id === sprintId || (
            s.status === 'ACTIVE' || 
            s.status === 'IN_PROGRESS'
          )
        ).length
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
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        activeSprints: sprints.filter(s => 
          s.id !== sprintId && (
            s.status === 'ACTIVE' || 
            s.status === 'IN_PROGRESS'
          )
        ).length
      }));
    } catch (error) {
      console.error('Failed to complete sprint:', error);
      toast.error(`Failed to complete sprint: ${error.message}`);
    }
  };

  // Fix the Chip components in the team members section
  const renderTeamMembers = (members) => {
    return members?.map((member) => (
      <Chip
        key={`team-member-${member.id || member._id}`}
        label={member.name || member.username}
        size="small"
        sx={{ mr: 1, mb: 1 }}
      />
    ));
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
                startIcon={<AddCircleOutline />}
                onClick={() => setOpenNewTeamDialog(true)}
              >
                New Team
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<People />}
                onClick={() => setOpenUserManagementDialog(true)}
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<Timeline />}
                onClick={() => setOpenSprintManagementDialog(true)}
              >
                Sprint Management
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
                    <Bar dataKey="progress" stackId="a" fill="#2563eb" name="Progress" />
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
                        <TableRow key={`recent-project-${project._id || project.id}`}>
                          <TableCell>{project.name || 'Unnamed Project'}</TableCell>
                          <TableCell>
                            <Chip
                              key={`project-status-${project._id || project.id}`}
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
                        <TableRow key={`team-${team._id || team.id}`}>
                          <TableCell>{team.name}</TableCell>
                          <TableCell>
                            {renderTeamMembers(team.members)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              key={`team-status-${team._id || team.id}`}
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
                                  setSelectedTeam({
                                    ...team,
                                    selectedUserId: ''
                                  });
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
                    startIcon={<PersonAdd />}
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
                      <TableRow key={`sprint-${sprint._id || sprint.id}`}>
                        <TableCell>{sprint.name}</TableCell>
                        <TableCell>
                          {projects.find(p => p._id === sprint.project)?.name || 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            key={`sprint-status-${sprint._id || sprint.id}`}
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
                            onClick={() => handleDeleteSprint(sprint._id || sprint.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                          {(sprint.status === 'PLANNING' || sprint.status === 'Planning') && (
                            <Tooltip title="Start Sprint">
                              <IconButton
                                size="small"
                                onClick={() => handleStartSprint(sprint._id || sprint.id)}
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
                                onClick={() => handleCompleteSprint(sprint._id || sprint.id)}
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
                    <TableRow key="no-sprints">
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